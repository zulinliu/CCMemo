use std::path::Path;
use std::sync::{Arc, Mutex};

use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;

use crate::domain::error::{AppError, Result};
use crate::domain::types::*;
use crate::storage::migrations;
use crate::storage::{BookmarkRepository, EventRepository, ProjectRepository, SessionRepository};

pub struct Database {
    read_pool: Pool<SqliteConnectionManager>,
    write_conn: Arc<Mutex<rusqlite::Connection>>,
}

impl Database {
    pub fn open(path: &Path) -> Result<Self> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AppError::Config(format!("Cannot create database directory: {e}")))?;
        }

        let write_conn = rusqlite::Connection::open(path)?;

        // journal_mode=WAL returns a row, must use pragma_update_and_check
        write_conn.pragma_update_and_check(None, "journal_mode", "WAL", |_| Ok(()))?;
        write_conn.pragma_update(None, "synchronous", "NORMAL")?;
        write_conn.pragma_update(None, "cache_size", -64000)?;
        write_conn.pragma_update(None, "temp_store", "MEMORY")?;
        write_conn.pragma_update(None, "busy_timeout", 5000)?;
        write_conn.pragma_update(None, "foreign_keys", "ON")?;

        migrations::run_migrations(&write_conn)?;

        let db_path = path.to_path_buf();
        let manager = SqliteConnectionManager::file(db_path).with_init(|conn| {
            conn.pragma_update_and_check(None, "journal_mode", "WAL", |_| Ok(()))?;
            conn.pragma_update(None, "query_only", "ON")?;
            conn.pragma_update(None, "cache_size", -64000)?;
            conn.pragma_update(None, "busy_timeout", 5000)?;
            Ok(())
        });

        let pool = Pool::builder().max_size(4).build(manager)?;

        Ok(Self {
            read_pool: pool,
            write_conn: Arc::new(Mutex::new(write_conn)),
        })
    }

    pub fn open_in_memory() -> Result<Self> {
        let write_conn = rusqlite::Connection::open_in_memory()?;
        write_conn.execute_batch(
            "PRAGMA synchronous=NORMAL;
             PRAGMA cache_size=-64000;
             PRAGMA temp_store=MEMORY;
             PRAGMA foreign_keys=ON;",
        )?;

        migrations::run_migrations(&write_conn)?;

        // Share the same in-memory database via cache=shared URI
        let manager = SqliteConnectionManager::file("file::memory:?cache=shared");
        let pool = Pool::builder().max_size(2).build(manager)?;

        Ok(Self {
            read_pool: pool,
            write_conn: Arc::new(Mutex::new(write_conn)),
        })
    }

    pub fn get_read_conn(&self) -> Result<r2d2::PooledConnection<SqliteConnectionManager>> {
        self.read_pool.get().map_err(AppError::from)
    }

    pub fn get_write_conn(&self) -> std::sync::MutexGuard<'_, rusqlite::Connection> {
        self.write_conn.lock().unwrap_or_else(|e| {
            tracing::warn!("Write lock poisoned, recovering: {e}");
            e.into_inner()
        })
    }
}

pub fn parse_status(s: &str) -> SessionStatus {
    match s {
        "active" => SessionStatus::Active,
        "completed" => SessionStatus::Completed,
        "interrupted" => SessionStatus::Interrupted,
        "unrecoverable" => SessionStatus::Unrecoverable,
        _ => SessionStatus::Active,
    }
}

impl SessionRepository for Database {
    fn get_sessions(&self, query: &SessionQuery) -> Result<PaginatedResult<SessionMetadata>> {
        let conn = self.get_read_conn()?;
        let limit = query.limit.unwrap_or(20);

        let mut sql = String::from(
            "SELECT sessionId, projectId, autoTitle, customTitle, status, \
             startedAt, endedAt, totalInputTokens, totalOutputTokens, \
             model, fileCount, toolCallCount, errorCount, tags, branch, filePath \
             FROM SessionMetadata WHERE 1=1",
        );
        let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(ref pid) = query.project_id {
            sql.push_str(" AND projectId = ?");
            params.push(Box::new(pid.clone()));
        }
        if let Some(ref st) = query.status {
            sql.push_str(" AND status = ?");
            params.push(Box::new(st.to_string()));
        }
        if let Some(ref cursor) = query.cursor {
            let decoded = decode_cursor(cursor);
            sql.push_str(" AND (startedAt, sessionId) < (?, ?)");
            params.push(Box::new(decoded.started_at));
            params.push(Box::new(decoded.session_id));
        }

        sql.push_str(" ORDER BY startedAt DESC, sessionId DESC LIMIT ?");
        params.push(Box::new((limit + 1) as i64));

        let param_refs: Vec<&dyn rusqlite::types::ToSql> =
            params.iter().map(|p| p.as_ref()).collect();
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(param_refs.as_slice(), |row| {
            Ok(SessionMetadata {
                session_id: row.get(0)?,
                project_id: row.get(1)?,
                auto_title: row.get(2)?,
                custom_title: row.get(3)?,
                status: parse_status(&row.get::<_, String>(4)?),
                started_at: row.get(5)?,
                ended_at: row.get(6)?,
                total_input_tokens: row.get(7)?,
                total_output_tokens: row.get(8)?,
                model: row.get(9)?,
                file_count: row.get(10)?,
                tool_call_count: row.get(11)?,
                error_count: row.get(12)?,
                tags: row.get(13)?,
                branch: row.get(14)?,
                file_path: row.get(15)?,
            })
        })?;

        let mut items: Vec<SessionMetadata> = rows.collect::<rusqlite::Result<Vec<_>>>()?;
        let has_more = items.len() > limit;
        if has_more {
            items.truncate(limit);
        }

        let next_cursor = if has_more {
            items
                .last()
                .map(|s| encode_cursor(&s.started_at, &s.session_id))
        } else {
            None
        };

        Ok(PaginatedResult {
            items,
            next_cursor,
            has_more,
        })
    }

    fn get_session(&self, id: &str) -> Result<Option<SessionMetadata>> {
        let conn = self.get_read_conn()?;
        let short_id = if id.len() >= 8 { &id[..8] } else { id };
        let mut stmt = conn.prepare(
            "SELECT sessionId, projectId, autoTitle, customTitle, status, \
             startedAt, endedAt, totalInputTokens, totalOutputTokens, \
             model, fileCount, toolCallCount, errorCount, tags, branch, filePath \
             FROM SessionMetadata WHERE sessionId = ?1 OR substr(sessionId,1,8) = ?2",
        )?;
        let mut rows = stmt.query(rusqlite::params![id, short_id])?;
        match rows.next()? {
            Some(row) => Ok(Some(SessionMetadata {
                session_id: row.get(0)?,
                project_id: row.get(1)?,
                auto_title: row.get(2)?,
                custom_title: row.get(3)?,
                status: parse_status(&row.get::<_, String>(4)?),
                started_at: row.get(5)?,
                ended_at: row.get(6)?,
                total_input_tokens: row.get(7)?,
                total_output_tokens: row.get(8)?,
                model: row.get(9)?,
                file_count: row.get(10)?,
                tool_call_count: row.get(11)?,
                error_count: row.get(12)?,
                tags: row.get(13)?,
                branch: row.get(14)?,
                file_path: row.get(15)?,
            })),
            None => Ok(None),
        }
    }

    fn upsert_session(&self, session: &SessionMetadata) -> Result<()> {
        let conn = self.get_write_conn();
        conn.execute(
            "INSERT INTO SessionMetadata \
             (sessionId, projectId, autoTitle, customTitle, status, startedAt, endedAt, \
              totalInputTokens, totalOutputTokens, model, fileCount, toolCallCount, \
              errorCount, tags, branch, filePath) \
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16) \
             ON CONFLICT(sessionId) DO UPDATE SET \
             autoTitle=excluded.autoTitle, customTitle=excluded.customTitle, \
             status=excluded.status, endedAt=excluded.endedAt, \
             totalInputTokens=excluded.totalInputTokens, totalOutputTokens=excluded.totalOutputTokens, \
             model=excluded.model, fileCount=excluded.fileCount, toolCallCount=excluded.toolCallCount, \
             errorCount=excluded.errorCount, tags=excluded.tags, branch=excluded.branch",
            rusqlite::params![
                session.session_id, session.project_id, session.auto_title,
                session.custom_title, session.status.to_string(), session.started_at,
                session.ended_at, session.total_input_tokens, session.total_output_tokens,
                session.model, session.file_count, session.tool_call_count,
                session.error_count, session.tags, session.branch, session.file_path
            ],
        )?;
        Ok(())
    }

    fn count_sessions(&self) -> Result<i64> {
        let conn = self.get_read_conn()?;
        let count: i64 =
            conn.query_row("SELECT COUNT(*) FROM SessionMetadata", [], |row| row.get(0))?;
        Ok(count)
    }
}

impl EventRepository for Database {
    fn get_events(
        &self,
        session_id: &str,
        cursor: Option<&str>,
        limit: usize,
    ) -> Result<PaginatedResult<TranscriptEvent>> {
        let conn = self.get_read_conn()?;
        let mut sql = String::from(
            "SELECT id, sessionId, sequence, type, timestamp, fileOffset, byteLength, preview, rawJsonHash \
             FROM TranscriptEvent WHERE sessionId = ?1",
        );
        let mut params: Vec<Box<dyn rusqlite::types::ToSql>> =
            vec![Box::new(session_id.to_string())];

        if let Some(c) = cursor {
            sql.push_str(" AND sequence > ?");
            params.push(Box::new(c.parse::<i64>().unwrap_or(0)));
        }

        sql.push_str(" ORDER BY sequence ASC LIMIT ?");
        params.push(Box::new((limit + 1) as i64));

        let param_refs: Vec<&dyn rusqlite::types::ToSql> =
            params.iter().map(|p| p.as_ref()).collect();
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(param_refs.as_slice(), |row| {
            Ok(TranscriptEvent {
                id: row.get(0)?,
                session_id: row.get(1)?,
                sequence: row.get(2)?,
                event_type: row.get(3)?,
                timestamp: row.get(4)?,
                file_offset: row.get(5)?,
                byte_length: row.get(6)?,
                preview: row.get(7)?,
                raw_json_hash: row.get(8)?,
            })
        })?;

        let mut items: Vec<TranscriptEvent> = rows.collect::<rusqlite::Result<Vec<_>>>()?;
        let has_more = items.len() > limit;
        if has_more {
            items.truncate(limit);
        }
        let next_cursor = if has_more {
            items.last().map(|e| e.sequence.to_string())
        } else {
            None
        };

        Ok(PaginatedResult {
            items,
            next_cursor,
            has_more,
        })
    }

    fn upsert_events(&self, events: &[TranscriptEvent]) -> Result<()> {
        if events.is_empty() {
            return Ok(());
        }
        let conn = self.get_write_conn();
        let tx = conn.unchecked_transaction()?;
        for e in events {
            tx.execute(
                "INSERT OR IGNORE INTO TranscriptEvent \
                 (id, sessionId, sequence, type, timestamp, fileOffset, byteLength, preview, rawJsonHash) \
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
                rusqlite::params![
                    e.id, e.session_id, e.sequence, e.event_type, e.timestamp,
                    e.file_offset, e.byte_length, e.preview, e.raw_json_hash
                ],
            )?;
        }
        tx.commit()?;
        Ok(())
    }

    fn get_event_count(&self, session_id: &str) -> Result<i64> {
        let conn = self.get_read_conn()?;
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM TranscriptEvent WHERE sessionId = ?1",
            rusqlite::params![session_id],
            |row| row.get(0),
        )?;
        Ok(count)
    }
}

impl ProjectRepository for Database {
    fn get_all(&self) -> Result<Vec<ProjectIdentity>> {
        let conn = self.get_read_conn()?;
        let mut stmt = conn.prepare(
            "SELECT id, name, realPath, normalizedPath, encodedFolder, gitRemote, lastActiveAt FROM ProjectIdentity",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(ProjectIdentity {
                id: row.get(0)?,
                name: row.get(1)?,
                real_path: row.get(2)?,
                normalized_path: row.get(3)?,
                encoded_folder: row.get(4)?,
                git_remote: row.get(5)?,
                last_active_at: row.get(6)?,
            })
        })?;
        Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
    }

    fn upsert(&self, project: &ProjectIdentity) -> Result<()> {
        let conn = self.get_write_conn();
        conn.execute(
            "INSERT INTO ProjectIdentity (id, name, realPath, normalizedPath, encodedFolder, gitRemote, lastActiveAt) \
             VALUES (?1,?2,?3,?4,?5,?6,?7) \
             ON CONFLICT(id) DO UPDATE SET name=excluded.name, realPath=excluded.realPath, \
             normalizedPath=excluded.normalizedPath, lastActiveAt=excluded.lastActiveAt",
            rusqlite::params![
                project.id, project.name, project.real_path, project.normalized_path,
                project.encoded_folder, project.git_remote, project.last_active_at
            ],
        )?;
        Ok(())
    }

    fn find_by_encoded_folder(&self, folder: &str) -> Result<Option<ProjectIdentity>> {
        let conn = self.get_read_conn()?;
        let mut stmt = conn.prepare(
            "SELECT id, name, realPath, normalizedPath, encodedFolder, gitRemote, lastActiveAt \
             FROM ProjectIdentity WHERE encodedFolder = ?1",
        )?;
        let mut rows = stmt.query(rusqlite::params![folder])?;
        match rows.next()? {
            Some(row) => Ok(Some(ProjectIdentity {
                id: row.get(0)?,
                name: row.get(1)?,
                real_path: row.get(2)?,
                normalized_path: row.get(3)?,
                encoded_folder: row.get(4)?,
                git_remote: row.get(5)?,
                last_active_at: row.get(6)?,
            })),
            None => Ok(None),
        }
    }
}

impl BookmarkRepository for Database {
    fn get_bookmark(&self, file_path: &str) -> Result<Option<ScanBookmark>> {
        let conn = self.get_read_conn()?;
        let mut stmt = conn.prepare(
            "SELECT filePath, sessionId, lastIndexedLine, fileHash, lastScannedAt FROM ScanBookmark WHERE filePath = ?1",
        )?;
        let mut rows = stmt.query(rusqlite::params![file_path])?;
        match rows.next()? {
            Some(row) => Ok(Some(ScanBookmark {
                file_path: row.get(0)?,
                session_id: row.get(1)?,
                last_indexed_line: row.get(2)?,
                file_hash: row.get(3)?,
                last_scanned_at: row.get(4)?,
            })),
            None => Ok(None),
        }
    }

    fn upsert_bookmark(&self, bookmark: &ScanBookmark) -> Result<()> {
        let conn = self.get_write_conn();
        conn.execute(
            "INSERT INTO ScanBookmark (filePath, sessionId, lastIndexedLine, fileHash, lastScannedAt) \
             VALUES (?1,?2,?3,?4,?5) \
             ON CONFLICT(filePath) DO UPDATE SET sessionId=excluded.sessionId, \
             lastIndexedLine=excluded.lastIndexedLine, fileHash=excluded.fileHash, lastScannedAt=excluded.lastScannedAt",
            rusqlite::params![
                bookmark.file_path, bookmark.session_id, bookmark.last_indexed_line,
                bookmark.file_hash, bookmark.last_scanned_at
            ],
        )?;
        Ok(())
    }
}

struct CursorData {
    session_id: String,
    started_at: String,
}

fn encode_cursor(started_at: &str, session_id: &str) -> String {
    let data = format!("{started_at}|{session_id}");
    data.as_bytes().iter().map(|b| format!("{b:02x}")).collect()
}

fn decode_cursor(cursor: &str) -> CursorData {
    let bytes: Vec<u8> = (0..cursor.len())
        .step_by(2)
        .filter_map(|i| {
            cursor
                .get(i..i + 2)
                .and_then(|hex| u8::from_str_radix(hex, 16).ok())
        })
        .collect();
    let s = String::from_utf8_lossy(&bytes);
    let parts: Vec<&str> = s.splitn(2, '|').collect();
    CursorData {
        started_at: parts.first().unwrap_or(&"").to_string(),
        session_id: parts.get(1).unwrap_or(&"").to_string(),
    }
}
