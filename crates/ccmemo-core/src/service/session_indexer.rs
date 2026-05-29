use std::path::Path;

use crate::domain::error::Result;
use crate::domain::types::{ScanBookmark, SessionMetadata, TranscriptEvent, ToolCall};
use crate::parser::entry_mapper::EntryMapper;
use crate::parser::jsonl_parser::JsonlParser;
use crate::service::project_discovery::DiscoveredProject;
use crate::storage::sqlite::Database;
use crate::storage::{BookmarkRepository, EventRepository, ProjectRepository, SessionRepository};
use crate::storage::models;
use crate::tokenizer::jieba::tokenize_for_fts;

use sha2::{Digest, Sha256};

pub struct ScanResult {
    pub files_scanned: usize,
    pub sessions_indexed: usize,
    pub sessions_updated: usize,
    pub events_indexed: usize,
    pub errors: Vec<String>,
}

pub struct SessionIndexer<'a> {
    db: &'a Database,
}

impl<'a> SessionIndexer<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn index_project(&self, project: &DiscoveredProject, full: bool) -> Result<ScanResult> {
        let mut result = ScanResult {
            files_scanned: 0,
            sessions_indexed: 0,
            sessions_updated: 0,
            events_indexed: 0,
            errors: Vec::new(),
        };

        let existing = self.db.find_by_encoded_folder(&project.encoded_folder)?;
        let project_identity = crate::service::project_discovery::ProjectDiscovery::to_project_identity(
            project,
            existing.as_ref(),
        );
        self.db.upsert(&project_identity)?;

        for jsonl_path in &project.jsonl_files {
            result.files_scanned += 1;

            match self.index_file(jsonl_path, &project_identity.id, full) {
                Ok(file_result) => {
                    result.sessions_indexed += file_result.sessions_indexed;
                    result.sessions_updated += file_result.sessions_updated;
                    result.events_indexed += file_result.events_indexed;
                }
                Err(e) => {
                    result.errors.push(format!("{}: {e}", jsonl_path.display()));
                }
            }
        }

        Ok(result)
    }

    fn index_file(&self, path: &Path, project_id: &str, full: bool) -> Result<FileScanResult> {
        let file_path_str = path.to_string_lossy().to_string();

        // Compute file hash for change detection
        let file_hash = compute_file_hash(path)?;
        let line_count = count_lines(path)?;

        if !full {
            if let Some(bookmark) = self.db.get_bookmark(&file_path_str)? {
                if bookmark.file_hash.as_deref() == Some(&file_hash)
                    && bookmark.last_indexed_line == line_count
                {
                    tracing::debug!("Skipping unchanged file: {file_path_str}");
                    return Ok(FileScanResult::default());
                }
            }
        }

        let entries: Vec<_> = JsonlParser::parse_file(path)?
            .filter_map(|r| {
                match r {
                    Ok(entry) => Some(entry),
                    Err(e) => {
                        tracing::warn!("Parse error in {file_path_str}: {e}");
                        None
                    }
                }
            })
            .collect();

        if entries.is_empty() {
            return Ok(FileScanResult::default());
        }

        let session_id = match JsonlParser::extract_session_id(&entries) {
            Some(id) => id,
            None => {
                tracing::warn!("No session ID found in {file_path_str}");
                return Ok(FileScanResult::default());
            }
        };

        let extract = match EntryMapper::build_session(&entries) {
            Some(e) => e,
            None => return Ok(FileScanResult::default()),
        };

        let session_metadata = EntryMapper::to_session_metadata(&extract, project_id, &file_path_str);
        let is_new = self.db.get_session(&session_id)?.is_none();

        self.db.upsert_session(&session_metadata)?;

        let events: Vec<TranscriptEvent> = extract.events.iter().map(|ie| ie.event.clone()).collect();
        let events_count = events.len();
        self.db.upsert_events(&events)?;

        // Insert tool calls
        for tc in &extract.tool_calls {
            self.upsert_tool_call(tc)?;
        }

        // Update FTS index
        self.update_fts(&session_metadata, &extract)?;

        // Update bookmark
        self.db.upsert_bookmark(&ScanBookmark {
            file_path: file_path_str,
            session_id: Some(session_id),
            last_indexed_line: line_count,
            file_hash: Some(file_hash),
            last_scanned_at: chrono::Utc::now().to_rfc3339(),
        })?;

        let mut result = FileScanResult::default();
        if is_new {
            result.sessions_indexed = 1;
        } else {
            result.sessions_updated = 1;
        }
        result.events_indexed = events_count;
        Ok(result)
    }

    fn upsert_tool_call(&self, tc: &ToolCall) -> Result<()> {
        let conn = self.db.get_write_conn();
        conn.execute(
            "INSERT OR IGNORE INTO ToolCall (id, eventId, sessionId, toolName, filePath, inputSummary, outputSummary) \
             VALUES (?1,?2,?3,?4,?5,?6,?7)",
            rusqlite::params![
                tc.id, tc.event_id, tc.session_id, tc.tool_name,
                tc.file_path, tc.input_summary, tc.output_summary
            ],
        )?;
        Ok(())
    }

    fn update_fts(&self, session: &SessionMetadata, extract: &crate::parser::entry_mapper::SessionExtract) -> Result<()> {
        let conn = self.db.get_write_conn();

        // Delete old FTS entry for this session
        let delete_sql = format!(
            "DELETE FROM session_fts WHERE sessionId = '{}'",
            session.session_id.replace('\'', "''"),
        );
        conn.execute_batch(&delete_sql)?;

        // Build content strings for FTS
        let content_en = extract.events.iter()
            .filter_map(|ie| ie.event.preview.as_deref())
            .take(20)
            .collect::<Vec<_>>()
            .join(" ");

        let content_zh = tokenize_for_fts(&content_en);

        let file_paths = extract.file_paths.iter().cloned().collect::<Vec<_>>().join(" ");
        let tool_names = extract.tool_names.iter().cloned().collect::<Vec<_>>().join(" ");

        models::insert_fts_entry(
            &conn,
            &session.session_id,
            &session.auto_title,
            &content_en,
            &content_zh,
            &file_paths,
            &tool_names,
        )?;

        Ok(())
    }
}

fn compute_file_hash(path: &Path) -> Result<String> {
    let data = std::fs::read(path)?;
    let mut hasher = Sha256::new();
    hasher.update(&data);
    Ok(format!("{:x}", hasher.finalize()))
}

fn count_lines(path: &Path) -> Result<i64> {
    use std::io::BufRead;
    let file = std::fs::File::open(path)?;
    let reader = std::io::BufReader::new(file);
    Ok(reader.lines().count() as i64)
}

#[derive(Default)]
struct FileScanResult {
    sessions_indexed: usize,
    sessions_updated: usize,
    events_indexed: usize,
}
