use std::io::{BufRead, BufReader, Read};
use std::path::Path;

use serde_json::Value;

use crate::domain::error::{AppError, Result};

const MAX_LINE_BYTES: usize = 10 * 1024 * 1024;

#[derive(Debug, Clone)]
pub struct RawEntry {
    pub line_number: i64,
    pub byte_offset: i64,
    pub byte_length: i64,
    pub json: Value,
}

pub struct JsonlParser;

impl JsonlParser {
    pub fn parse_file(path: &Path) -> Result<JsonlFileIterator<std::fs::File>> {
        let file = std::fs::File::open(path).map_err(AppError::Io)?;
        let reader = BufReader::with_capacity(256 * 1024, file);
        Ok(JsonlFileIterator {
            reader,
            line_number: 0,
            byte_offset: 0,
        })
    }

    pub fn parse_reader<R: Read>(reader: R) -> JsonlFileIterator<R> {
        JsonlFileIterator {
            reader: BufReader::with_capacity(256 * 1024, reader),
            line_number: 0,
            byte_offset: 0,
        }
    }

    pub fn extract_session_id(entries: &[RawEntry]) -> Option<String> {
        entries.iter().find_map(|e| {
            e.json
                .get("sessionId")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
        })
    }

    pub fn extract_first_user_content(entries: &[RawEntry]) -> Option<String> {
        for e in entries {
            if e.json.get("type").and_then(|v| v.as_str()) == Some("user")
                && let Some(content) = e.json.get("message").and_then(|m| m.get("content"))
            {
                if let Some(s) = content.as_str() {
                    return Some(truncate_preview(s, 200));
                }
                if let Some(arr) = content.as_array() {
                    for block in arr {
                        if block.get("type").and_then(|v| v.as_str()) == Some("text")
                            && let Some(text) = block.get("text").and_then(|v| v.as_str())
                        {
                            return Some(truncate_preview(text, 200));
                        }
                    }
                }
            }
        }
        None
    }
}

fn truncate_preview(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        let truncated: String = s.chars().take(max_len).collect();
        format!("{truncated}...")
    }
}

pub struct JsonlFileIterator<R: Read> {
    reader: BufReader<R>,
    line_number: i64,
    byte_offset: i64,
}

impl<R: Read> Iterator for JsonlFileIterator<R> {
    type Item = Result<RawEntry>;

    fn next(&mut self) -> Option<Self::Item> {
        let mut line = Vec::with_capacity(4096);
        let start_offset = self.byte_offset;

        loop {
            let buf = self.reader.fill_buf().ok()?;
            if buf.is_empty() {
                if line.is_empty() {
                    return None;
                }
                break;
            }

            let (found, consumed) = match buf.iter().position(|&b| b == b'\n') {
                Some(pos) => {
                    line.extend_from_slice(&buf[..pos]);
                    (true, pos + 1)
                }
                None => {
                    line.extend_from_slice(buf);
                    (false, buf.len())
                }
            };

            self.reader.consume(consumed);
            self.byte_offset += consumed as i64;

            if line.len() > MAX_LINE_BYTES {
                self.line_number += 1;
                return Some(Err(AppError::Parse(format!(
                    "Line {} exceeds {} byte limit",
                    self.line_number, MAX_LINE_BYTES
                ))));
            }

            if found {
                break;
            }
        }

        self.line_number += 1;

        let line_str = match std::str::from_utf8(&line) {
            Ok(s) => s.trim(),
            Err(_) => {
                return Some(Err(AppError::Parse(format!(
                    "Line {} is not valid UTF-8",
                    self.line_number
                ))));
            }
        };

        if line_str.is_empty() {
            return self.next();
        }

        match serde_json::from_str(line_str) {
            Ok(json) => Some(Ok(RawEntry {
                line_number: self.line_number,
                byte_offset: start_offset,
                byte_length: self.byte_offset - start_offset,
                json,
            })),
            Err(e) => Some(Err(AppError::Parse(format!(
                "Line {}: JSON parse error: {e}",
                self.line_number
            )))),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn parse_simple_entries() {
        let data = r#"{"type":"user","sessionId":"s1","timestamp":"2026-01-01T00:00:00Z"}
{"type":"assistant","sessionId":"s1","timestamp":"2026-01-01T00:00:01Z"}
{"type":"last-prompt","sessionId":"s1"}
"#;
        let entries: Vec<RawEntry> = JsonlParser::parse_reader(Cursor::new(data))
            .filter_map(|r| r.ok())
            .collect();

        assert_eq!(entries.len(), 3);
        assert_eq!(entries[0].json["type"], "user");
        assert_eq!(entries[0].line_number, 1);
        assert_eq!(entries[1].json["type"], "assistant");
        assert_eq!(entries[1].line_number, 2);
    }

    #[test]
    fn skip_blank_lines() {
        let data = "\n\n{\"type\":\"user\"}\n\n";
        let entries: Vec<RawEntry> = JsonlParser::parse_reader(Cursor::new(data))
            .filter_map(|r| r.ok())
            .collect();
        assert_eq!(entries.len(), 1);
    }

    #[test]
    fn extract_session_id_from_entries() {
        let entries = vec![RawEntry {
            line_number: 1,
            byte_offset: 0,
            byte_length: 10,
            json: serde_json::json!({"type": "user", "sessionId": "abc-123"}),
        }];
        assert_eq!(
            JsonlParser::extract_session_id(&entries),
            Some("abc-123".to_string())
        );
    }

    #[test]
    fn extract_first_user_content_from_message() {
        let entries = vec![RawEntry {
            line_number: 1,
            byte_offset: 0,
            byte_length: 10,
            json: serde_json::json!({
                "type": "user",
                "message": {
                    "role": "user",
                    "content": "Hello, this is a test message for the preview"
                }
            }),
        }];
        let content = JsonlParser::extract_first_user_content(&entries).unwrap();
        assert_eq!(content, "Hello, this is a test message for the preview");
    }

    #[test]
    fn extract_first_user_content_from_blocks() {
        let entries = vec![RawEntry {
            line_number: 1,
            byte_offset: 0,
            byte_length: 10,
            json: serde_json::json!({
                "type": "user",
                "message": {
                    "role": "user",
                    "content": [{"type": "text", "text": "Block content here"}]
                }
            }),
        }];
        let content = JsonlParser::extract_first_user_content(&entries).unwrap();
        assert_eq!(content, "Block content here");
    }

    #[test]
    fn truncate_long_preview() {
        let long_text = "x".repeat(300);
        let result = truncate_preview(&long_text, 200);
        assert_eq!(result.len(), 203); // 200 chars + "..."
        assert!(result.ends_with("..."));
    }

    #[test]
    fn byte_offset_tracking() {
        let data = "{\"a\":1}\n{\"b\":2}\n";
        let entries: Vec<RawEntry> = JsonlParser::parse_reader(Cursor::new(data))
            .filter_map(|r| r.ok())
            .collect();
        assert_eq!(entries[0].byte_offset, 0);
        assert_eq!(entries[0].byte_length, 8); // {"a":1}\n
        assert_eq!(entries[1].byte_offset, 8);
    }
}
