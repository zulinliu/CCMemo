use std::collections::HashSet;

use serde_json::Value;

use crate::domain::types::{SessionMetadata, SessionStatus, ToolCall, TranscriptEvent};
use crate::parser::jsonl_parser::RawEntry;

#[derive(Debug, Default)]
pub struct SessionExtract {
    pub session_id: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub first_user_message: Option<String>,
    pub git_branch: Option<String>,
    pub model: Option<String>,
    pub cwd: Option<String>,
    pub events: Vec<IndexedEvent>,
    pub tool_calls: Vec<ToolCall>,
    pub total_input_tokens: i64,
    pub total_output_tokens: i64,
    pub event_types: HashSet<String>,
    pub tool_names: HashSet<String>,
    pub file_paths: HashSet<String>,
}

#[derive(Debug, Clone)]
pub struct IndexedEvent {
    pub event: TranscriptEvent,
    pub raw_json: Value,
}

pub struct EntryMapper;

impl EntryMapper {
    pub fn build_session(entries: &[RawEntry]) -> Option<SessionExtract> {
        let session_id = entries.iter().find_map(|e| {
            e.json
                .get("sessionId")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
        })?;

        let mut extract = SessionExtract {
            session_id: session_id.clone(),
            ..Default::default()
        };

        let mut timestamps: Vec<&str> = Vec::new();

        for (idx, entry) in entries.iter().enumerate() {
            let event_type = entry
                .json
                .get("type")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");

            extract.event_types.insert(event_type.to_string());

            if let Some(ts) = entry.json.get("timestamp").and_then(|v| v.as_str()) {
                timestamps.push(ts);
            }

            if extract.git_branch.is_none() {
                extract.git_branch = entry
                    .json
                    .get("gitBranch")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
            }

            if extract.cwd.is_none() {
                extract.cwd = entry
                    .json
                    .get("cwd")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
            }

            match event_type {
                "queue-operation" => {
                    if let Some("enqueue") = entry.json.get("operation").and_then(|v| v.as_str())
                        && extract.first_user_message.is_none()
                    {
                        extract.first_user_message = entry
                            .json
                            .get("content")
                            .and_then(|v| v.as_str())
                            .map(|s| truncate_str(s, 200));
                    }
                }
                "user" => {
                    if extract.first_user_message.is_none() {
                        extract.first_user_message = extract_user_text(&entry.json);
                    }
                }
                "assistant" => {
                    Self::extract_assistant_info(&entry.json, &mut extract);
                }
                _ => {}
            }

            let event_id = entry
                .json
                .get("uuid")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");
            let timestamp = entry
                .json
                .get("timestamp")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            extract.events.push(IndexedEvent {
                event: TranscriptEvent {
                    id: event_id.to_string(),
                    session_id: session_id.clone(),
                    sequence: idx as i64,
                    event_type: event_type.to_string(),
                    timestamp: timestamp.clone(),
                    file_offset: entry.byte_offset,
                    byte_length: entry.byte_length,
                    preview: Self::make_preview(event_type, &entry.json),
                    raw_json_hash: None,
                },
                raw_json: entry.json.clone(),
            });
        }

        timestamps.sort();
        extract.started_at = timestamps.first().unwrap_or(&"").to_string();
        extract.ended_at = if timestamps.len() > 1 {
            Some(timestamps.last().unwrap().to_string())
        } else {
            None
        };

        Some(extract)
    }

    pub fn to_session_metadata(
        extract: &SessionExtract,
        project_id: &str,
        file_path: &str,
    ) -> SessionMetadata {
        let status = if extract.ended_at.is_some() {
            SessionStatus::Completed
        } else {
            SessionStatus::Active
        };

        let auto_title = extract
            .first_user_message
            .clone()
            .unwrap_or_else(|| "Untitled session".to_string());

        let file_count = extract.file_paths.len() as i64;
        let tool_call_count = extract.tool_calls.len() as i64;
        let error_count = extract
            .events
            .iter()
            .filter(|e| e.event.event_type == "error")
            .count() as i64;

        let tags = if extract.tool_names.is_empty() {
            None
        } else {
            Some(
                extract
                    .tool_names
                    .iter()
                    .map(|s| s.as_str())
                    .collect::<Vec<_>>()
                    .join(","),
            )
        };

        SessionMetadata {
            session_id: extract.session_id.clone(),
            project_id: project_id.to_string(),
            auto_title,
            custom_title: None,
            status,
            started_at: extract.started_at.clone(),
            ended_at: extract.ended_at.clone(),
            total_input_tokens: extract.total_input_tokens,
            total_output_tokens: extract.total_output_tokens,
            model: extract.model.clone(),
            file_count,
            tool_call_count,
            error_count,
            tags,
            branch: extract.git_branch.clone(),
            file_path: file_path.to_string(),
        }
    }

    fn extract_assistant_info(json: &Value, extract: &mut SessionExtract) {
        let model = json
            .get("message")
            .and_then(|m| m.get("model"))
            .and_then(|v| v.as_str());
        if model.is_some() && extract.model.is_none() {
            extract.model = model.map(|s| s.to_string());
        }

        let content = json.get("message").and_then(|m| m.get("content"));
        if let Some(blocks) = content.and_then(|c| c.as_array()) {
            for block in blocks {
                match block.get("type").and_then(|v| v.as_str()) {
                    Some("tool_use") => {
                        if let (Some(id), Some(name)) = (
                            block.get("id").and_then(|v| v.as_str()),
                            block.get("name").and_then(|v| v.as_str()),
                        ) {
                            extract.tool_names.insert(name.to_string());

                            let input_summary = block.get("input").map(|inp| {
                                let s = serde_json::to_string(inp).unwrap_or_default();
                                truncate_str(&s, 200)
                            });

                            let file_path = block
                                .get("input")
                                .and_then(|inp| {
                                    inp.get("file_path")
                                        .or(inp.get("filePath"))
                                        .or(inp.get("path"))
                                })
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string());

                            if let Some(ref fp) = file_path {
                                extract.file_paths.insert(fp.clone());
                            }

                            extract.tool_calls.push(ToolCall {
                                id: id.to_string(),
                                event_id: json
                                    .get("uuid")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("")
                                    .to_string(),
                                session_id: extract.session_id.clone(),
                                tool_name: name.to_string(),
                                file_path,
                                input_summary,
                                output_summary: None,
                            });
                        }
                    }
                    Some("tool_result") => {
                        if let Some(tool_use_id) = block.get("tool_use_id").and_then(|v| v.as_str())
                            && let Some(tc) = extract
                                .tool_calls
                                .iter_mut()
                                .find(|tc| tc.id == tool_use_id)
                        {
                            let output = block.get("content").and_then(|c| {
                                if let Some(s) = c.as_str() {
                                    Some(truncate_str(s, 200))
                                } else if let Some(arr) = c.as_array() {
                                    let texts: Vec<&str> = arr
                                        .iter()
                                        .filter_map(|b| b.get("text").and_then(|t| t.as_str()))
                                        .collect();
                                    Some(truncate_str(&texts.join(""), 200))
                                } else {
                                    None
                                }
                            });
                            tc.output_summary = output;
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    fn make_preview(event_type: &str, json: &Value) -> Option<String> {
        match event_type {
            "queue-operation" => json
                .get("content")
                .and_then(|v| v.as_str())
                .map(|s| truncate_str(s, 200)),
            "user" => extract_user_text(json),
            "assistant" => {
                let content = json.get("message").and_then(|m| m.get("content"));
                content.and_then(|c| {
                    if let Some(arr) = c.as_array() {
                        for block in arr {
                            if block.get("type").and_then(|v| v.as_str()) == Some("text")
                                && let Some(text) = block.get("text").and_then(|v| v.as_str())
                            {
                                return Some(truncate_str(text, 200));
                            }
                        }
                    }
                    None
                })
            }
            "system" => json
                .get("subtype")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            _ => None,
        }
    }
}

fn extract_user_text(json: &Value) -> Option<String> {
    let content = json.get("message").and_then(|m| m.get("content"))?;
    if let Some(s) = content.as_str() {
        return Some(truncate_str(s, 200));
    }
    if let Some(arr) = content.as_array() {
        for block in arr {
            if block.get("type").and_then(|v| v.as_str()) == Some("text")
                && let Some(text) = block.get("text").and_then(|v| v.as_str())
            {
                return Some(truncate_str(text, 200));
            }
        }
    }
    None
}

fn truncate_str(s: &str, max_chars: usize) -> String {
    if s.chars().count() <= max_chars {
        s.to_string()
    } else {
        let truncated: String = s.chars().take(max_chars).collect();
        format!("{truncated}...")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn make_entry(json: Value) -> RawEntry {
        RawEntry {
            line_number: 1,
            byte_offset: 0,
            byte_length: 0,
            json,
        }
    }

    #[test]
    fn extract_session_from_basic_entries() {
        let entries = vec![
            make_entry(
                json!({"type": "queue-operation", "operation": "enqueue", "sessionId": "s1", "timestamp": "2026-01-01T00:00:00Z", "content": "Hello"}),
            ),
            make_entry(
                json!({"type": "user", "sessionId": "s1", "timestamp": "2026-01-01T00:00:01Z", "message": {"role": "user", "content": "Hello"}}),
            ),
            make_entry(
                json!({"type": "assistant", "sessionId": "s1", "timestamp": "2026-01-01T00:00:05Z", "message": {"role": "assistant", "model": "claude-sonnet-4-6", "content": [{"type": "text", "text": "Hi there!"}]}}),
            ),
        ];

        let result = EntryMapper::build_session(&entries).unwrap();
        assert_eq!(result.session_id, "s1");
        assert_eq!(result.first_user_message.unwrap(), "Hello");
        assert_eq!(result.model.unwrap(), "claude-sonnet-4-6");
        assert_eq!(result.started_at, "2026-01-01T00:00:00Z");
        assert_eq!(result.ended_at.unwrap(), "2026-01-01T00:00:05Z");
        assert_eq!(result.events.len(), 3);
    }

    #[test]
    fn extract_tool_calls() {
        let entries = vec![make_entry(
            json!({"type": "assistant", "sessionId": "s1", "uuid": "evt-1", "timestamp": "2026-01-01T00:00:00Z",
                "message": {"role": "assistant", "content": [
                    {"type": "tool_use", "id": "call-1", "name": "Read", "input": {"file_path": "/src/main.rs"}},
                    {"type": "tool_result", "tool_use_id": "call-1", "content": "file contents here"}
                ]}
            }),
        )];

        let result = EntryMapper::build_session(&entries).unwrap();
        assert_eq!(result.tool_calls.len(), 1);
        assert_eq!(result.tool_calls[0].tool_name, "Read");
        assert_eq!(
            result.tool_calls[0].file_path,
            Some("/src/main.rs".to_string())
        );
        assert!(result.tool_names.contains("Read"));
        assert!(result.file_paths.contains("/src/main.rs"));
    }

    #[test]
    fn to_session_metadata_completed() {
        let extract = SessionExtract {
            session_id: "s1".to_string(),
            started_at: "2026-01-01T00:00:00Z".to_string(),
            ended_at: Some("2026-01-01T01:00:00Z".to_string()),
            first_user_message: Some("Fix bug".to_string()),
            git_branch: Some("fix/bug".to_string()),
            model: Some("claude-sonnet-4-6".to_string()),
            tool_calls: vec![ToolCall {
                id: "tc1".to_string(),
                event_id: "e1".to_string(),
                session_id: "s1".to_string(),
                tool_name: "Read".to_string(),
                file_path: None,
                input_summary: None,
                output_summary: None,
            }],
            ..Default::default()
        };

        let meta = EntryMapper::to_session_metadata(&extract, "proj-1", "/path/to/file.jsonl");
        assert_eq!(meta.session_id, "s1");
        assert_eq!(meta.project_id, "proj-1");
        assert_eq!(meta.status, SessionStatus::Completed);
        assert_eq!(meta.auto_title, "Fix bug");
        assert_eq!(meta.branch.unwrap(), "fix/bug");
        assert_eq!(meta.tool_call_count, 1);
    }
}
