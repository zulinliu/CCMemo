use crate::domain::error::Result;
use crate::domain::types::*;
use crate::storage::sqlite::Database;

pub struct DemoService<'a> {
    db: &'a Database,
}

impl<'a> DemoService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn import_demo(&self) -> Result<usize> {
        let conn = self.db.get_write_conn();

        conn.execute(
            "INSERT OR IGNORE INTO ProjectIdentity (id, name, realPath, normalizedPath, encodedFolder, gitRemote, lastActiveAt) \
             VALUES (?1,?2,?3,?4,?5,?6,?7)",
            rusqlite::params![
                "demo-project-001", "demo-project", "/home/user/projects/demo",
                "/home/user/projects/demo", "demo-encoded",
                "https://github.com/demo/project.git",
                chrono::Utc::now().to_rfc3339()
            ],
        )?;

        drop(conn);

        let sessions = self.create_demo_sessions();
        for session in &sessions {
            let conn = self.db.get_write_conn();
            conn.execute(
                "INSERT OR IGNORE INTO SessionMetadata \
                 (sessionId, projectId, autoTitle, customTitle, status, startedAt, endedAt, \
                  totalInputTokens, totalOutputTokens, model, fileCount, toolCallCount, \
                  errorCount, tags, branch, filePath) \
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16)",
                rusqlite::params![
                    session.session_id, session.project_id, session.auto_title,
                    session.custom_title, session.status.to_string(), session.started_at,
                    session.ended_at, session.total_input_tokens, session.total_output_tokens,
                    session.model, session.file_count, session.tool_call_count,
                    session.error_count, session.tags, session.branch, session.file_path
                ],
            )?;

            let events = self.create_events_for_session(&session.session_id);
            for e in &events {
                conn.execute(
                    "INSERT OR IGNORE INTO TranscriptEvent \
                     (id, sessionId, sequence, type, timestamp, fileOffset, byteLength, preview, rawJsonHash) \
                     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
                    rusqlite::params![
                        e.id, e.session_id, e.sequence, e.event_type, e.timestamp,
                        e.file_offset, e.byte_length, e.preview, e.raw_json_hash
                    ],
                )?;
            }

            drop(conn);
        }

        Ok(sessions.len())
    }

    fn create_demo_sessions(&self) -> Vec<SessionMetadata> {
        let now = chrono::Utc::now();
        vec![
            SessionMetadata {
                session_id: "demo-session-001".into(),
                project_id: "demo-project-001".into(),
                auto_title: "Fix auth token expiry bug".into(),
                custom_title: None,
                status: SessionStatus::Active,
                started_at: (now.clone() - chrono::Duration::hours(2)).to_rfc3339(),
                ended_at: Some((now.clone() - chrono::Duration::minutes(30)).to_rfc3339()),
                total_input_tokens: 15000,
                total_output_tokens: 25000,
                model: Some("claude-sonnet-4-6".into()),
                file_count: 3,
                tool_call_count: 8,
                error_count: 1,
                tags: Some("bug,auth".into()),
                branch: Some("fix/auth-token-expiry".into()),
                file_path: "/home/user/projects/demo/session-001.jsonl".into(),
            },
            SessionMetadata {
                session_id: "demo-session-002".into(),
                project_id: "demo-project-001".into(),
                auto_title: "Discuss API design for payment module".into(),
                custom_title: Some("Payment API Architecture".into()),
                status: SessionStatus::Completed,
                started_at: (now.clone() - chrono::Duration::days(2)).to_rfc3339(),
                ended_at: Some((now.clone() - chrono::Duration::days(2) + chrono::Duration::hours(1)).to_rfc3339()),
                total_input_tokens: 20000,
                total_output_tokens: 35000,
                model: Some("claude-sonnet-4-6".into()),
                file_count: 0,
                tool_call_count: 2,
                error_count: 0,
                tags: Some("design,payment".into()),
                branch: Some("main".into()),
                file_path: "/home/user/projects/demo/session-002.jsonl".into(),
            },
            SessionMetadata {
                session_id: "demo-session-003".into(),
                project_id: "demo-project-001".into(),
                auto_title: "Research Rust async frameworks comparison".into(),
                custom_title: None,
                status: SessionStatus::Completed,
                started_at: (now.clone() - chrono::Duration::days(5)).to_rfc3339(),
                ended_at: Some((now.clone() - chrono::Duration::days(5) + chrono::Duration::hours(3)).to_rfc3339()),
                total_input_tokens: 30000,
                total_output_tokens: 50000,
                model: Some("claude-opus-4-5".into()),
                file_count: 1,
                tool_call_count: 5,
                error_count: 0,
                tags: Some("research,async,rust".into()),
                branch: Some("research/async-frameworks".into()),
                file_path: "/home/user/projects/demo/session-003.jsonl".into(),
            },
        ]
    }

    fn create_events_for_session(&self, session_id: &str) -> Vec<TranscriptEvent> {
        let now = chrono::Utc::now();
        vec![
            TranscriptEvent {
                id: format!("{session_id}-evt-001"),
                session_id: session_id.into(),
                sequence: 1,
                event_type: "user".into(),
                timestamp: (now.clone() - chrono::Duration::hours(2)).to_rfc3339(),
                file_offset: 0,
                byte_length: 256,
                preview: Some("I have a bug where auth tokens expire unexpectedly...".into()),
                raw_json_hash: Some("hash001".into()),
            },
            TranscriptEvent {
                id: format!("{session_id}-evt-002"),
                session_id: session_id.into(),
                sequence: 2,
                event_type: "assistant".into(),
                timestamp: (now.clone() - chrono::Duration::hours(2) + chrono::Duration::seconds(30)).to_rfc3339(),
                file_offset: 256,
                byte_length: 512,
                preview: Some("Let me investigate the token expiry logic...".into()),
                raw_json_hash: Some("hash002".into()),
            },
            TranscriptEvent {
                id: format!("{session_id}-evt-003"),
                session_id: session_id.into(),
                sequence: 3,
                event_type: "tool_use".into(),
                timestamp: (now.clone() - chrono::Duration::hours(2) + chrono::Duration::minutes(1)).to_rfc3339(),
                file_offset: 768,
                byte_length: 128,
                preview: Some("Read file: src/auth/token.rs".into()),
                raw_json_hash: Some("hash003".into()),
            },
            TranscriptEvent {
                id: format!("{session_id}-evt-004"),
                session_id: session_id.into(),
                sequence: 4,
                event_type: "tool_result".into(),
                timestamp: (now.clone() - chrono::Duration::hours(2) + chrono::Duration::minutes(2)).to_rfc3339(),
                file_offset: 896,
                byte_length: 1024,
                preview: Some("File content of token.rs with expiry logic...".into()),
                raw_json_hash: Some("hash004".into()),
            },
            TranscriptEvent {
                id: format!("{session_id}-evt-005"),
                session_id: session_id.into(),
                sequence: 5,
                event_type: "assistant".into(),
                timestamp: (now.clone() - chrono::Duration::hours(1)).to_rfc3339(),
                file_offset: 1920,
                byte_length: 256,
                preview: Some("I found the issue. The token expiry calculation...".into()),
                raw_json_hash: Some("hash005".into()),
            },
        ]
    }
}
