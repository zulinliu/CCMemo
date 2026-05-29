use crate::domain::types::{ProjectIdentity, SessionMetadata, TranscriptEvent, ToolCall};

use crate::domain::error::Result;

pub fn session_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<SessionMetadata> {
    Ok(SessionMetadata {
        session_id: row.get("sessionId")?,
        project_id: row.get("projectId")?,
        auto_title: row.get("autoTitle")?,
        custom_title: row.get("customTitle")?,
        status: super::sqlite::parse_status(&row.get::<_, String>("status")?),
        started_at: row.get("startedAt")?,
        ended_at: row.get("endedAt")?,
        total_input_tokens: row.get("totalInputTokens")?,
        total_output_tokens: row.get("totalOutputTokens")?,
        model: row.get("model")?,
        file_count: row.get("fileCount")?,
        tool_call_count: row.get("toolCallCount")?,
        error_count: row.get("errorCount")?,
        tags: row.get("tags")?,
        branch: row.get("branch")?,
        file_path: row.get("filePath")?,
    })
}

pub fn project_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<ProjectIdentity> {
    Ok(ProjectIdentity {
        id: row.get("id")?,
        name: row.get("name")?,
        real_path: row.get("realPath")?,
        normalized_path: row.get("normalizedPath")?,
        encoded_folder: row.get("encodedFolder")?,
        git_remote: row.get("gitRemote")?,
        last_active_at: row.get("lastActiveAt")?,
    })
}

pub fn event_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<TranscriptEvent> {
    Ok(TranscriptEvent {
        id: row.get("id")?,
        session_id: row.get("sessionId")?,
        sequence: row.get("sequence")?,
        event_type: row.get("type")?,
        timestamp: row.get("timestamp")?,
        file_offset: row.get("fileOffset")?,
        byte_length: row.get("byteLength")?,
        preview: row.get("preview")?,
        raw_json_hash: row.get("rawJsonHash")?,
    })
}

pub fn tool_call_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<ToolCall> {
    Ok(ToolCall {
        id: row.get("id")?,
        event_id: row.get("eventId")?,
        session_id: row.get("sessionId")?,
        tool_name: row.get("toolName")?,
        file_path: row.get("filePath")?,
        input_summary: row.get("inputSummary")?,
        output_summary: row.get("outputSummary")?,
    })
}

pub fn insert_fts_entry(
    conn: &rusqlite::Connection,
    session_id: &str,
    auto_title: &str,
    content_en: &str,
    content_zh: &str,
    file_path: &str,
    tool_names: &str,
) -> Result<()> {
    let sql = format!(
        "INSERT INTO session_fts (sessionId, autoTitle, content_en, content_zh, filePath, toolNames) \
         VALUES ('{}', '{}', '{}', '{}', '{}', '{}')",
        session_id.replace('\'', "''"),
        auto_title.replace('\'', "''"),
        content_en.replace('\'', "''"),
        content_zh.replace('\'', "''"),
        file_path.replace('\'', "''"),
        tool_names.replace('\'', "''"),
    );
    conn.execute_batch(&sql)?;
    Ok(())
}
