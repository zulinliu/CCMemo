pub fn run_migrations(conn: &rusqlite::Connection) -> crate::domain::error::Result<()> {
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        INSERT OR IGNORE INTO _meta (key, value) VALUES ('migration_version', '1');",
    )?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS ProjectIdentity (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            realPath TEXT NOT NULL,
            normalizedPath TEXT NOT NULL,
            encodedFolder TEXT NOT NULL,
            gitRemote TEXT,
            lastActiveAt TEXT NOT NULL
        );",
    )?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS SessionMetadata (
            sessionId TEXT PRIMARY KEY,
            projectId TEXT NOT NULL REFERENCES ProjectIdentity(id),
            autoTitle TEXT NOT NULL DEFAULT '',
            customTitle TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            startedAt TEXT NOT NULL,
            endedAt TEXT,
            totalInputTokens INTEGER NOT NULL DEFAULT 0,
            totalOutputTokens INTEGER NOT NULL DEFAULT 0,
            model TEXT,
            fileCount INTEGER NOT NULL DEFAULT 0,
            toolCallCount INTEGER NOT NULL DEFAULT 0,
            errorCount INTEGER NOT NULL DEFAULT 0,
            tags TEXT,
            branch TEXT,
            filePath TEXT NOT NULL DEFAULT ''
        );",
    )?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS TranscriptEvent (
            id TEXT PRIMARY KEY,
            sessionId TEXT NOT NULL REFERENCES SessionMetadata(sessionId),
            sequence INTEGER NOT NULL,
            type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            fileOffset INTEGER NOT NULL DEFAULT 0,
            byteLength INTEGER NOT NULL DEFAULT 0,
            preview TEXT,
            rawJsonHash TEXT
        );",
    )?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS ToolCall (
            id TEXT PRIMARY KEY,
            eventId TEXT NOT NULL REFERENCES TranscriptEvent(id),
            sessionId TEXT NOT NULL REFERENCES SessionMetadata(sessionId),
            toolName TEXT NOT NULL,
            filePath TEXT,
            inputSummary TEXT,
            outputSummary TEXT
        );",
    )?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS Summary (
            id TEXT PRIMARY KEY,
            sessionId TEXT NOT NULL REFERENCES SessionMetadata(sessionId),
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata TEXT,
            model TEXT
        );",
    )?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS ScanBookmark (
            filePath TEXT PRIMARY KEY,
            sessionId TEXT,
            lastIndexedLine INTEGER NOT NULL DEFAULT 0,
            fileHash TEXT,
            lastScannedAt TEXT NOT NULL
        );",
    )?;

    conn.execute_batch(
        "CREATE INDEX IF NOT EXISTS idx_event_session_seq ON TranscriptEvent(sessionId, sequence);
         CREATE INDEX IF NOT EXISTS idx_event_session_type ON TranscriptEvent(sessionId, type);
         CREATE INDEX IF NOT EXISTS idx_toolcall_event ON ToolCall(eventId);
         CREATE INDEX IF NOT EXISTS idx_toolcall_filepath ON ToolCall(filePath);
         CREATE INDEX IF NOT EXISTS idx_session_status ON SessionMetadata(status);
         CREATE INDEX IF NOT EXISTS idx_session_project ON SessionMetadata(projectId);
         CREATE INDEX IF NOT EXISTS idx_session_cursor ON SessionMetadata(startedAt DESC, sessionId DESC);",
    )?;

    let fts_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='session_fts'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0)
        > 0;

    if !fts_exists {
        conn.execute_batch(
            "CREATE VIRTUAL TABLE session_fts USING fts5(
                sessionId,
                autoTitle,
                content_en,
                content_zh,
                filePath,
                toolNames,
                tokenize='unicode61'
            );",
        )?;
    }

    tracing::info!("Database migrations applied successfully");
    Ok(())
}
