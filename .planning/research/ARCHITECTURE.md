# Architecture Patterns

**Domain:** Rust CLI + local Web UI session management tool (CCMemo)
**Researched:** 2026-05-29

## Recommended Architecture

Three-layer architecture with strict dependency direction: UI Layer depends on Service Layer, Service Layer depends on Storage Layer. No upward calls, no circular dependencies. Each layer communicates through well-defined interfaces (traits in Rust).

```text
+------------------------------------------------------------------+
|  UI Layer                                                        |
|  +------------------+  +------------------+  +----------------+  |
|  | React Web UI     |  | CLI (clap)       |  | Tauri (v0.5+)  |  |
|  | (Axum HTTP/SSE)  |  | (stdout/stderr)  |  | (IPC commands)  |  |
|  +--------+---------+  +--------+---------+  +-------+--------+  |
+-----------|----------------------|----------------------|----------+
            |                      |                      |
            v                      v                      v
+------------------------------------------------------------------+
|  Service Layer (Rust Core)                                       |
|  +------------------+  +------------------+  +----------------+  |
|  | ProjectDiscovery |  | SessionIndexer   |  | ExportEngine   |  |
|  | (scan ~/.claude) |  | (JSONL -> DB)    |  | (MD/JSONL out) |  |
|  +------------------+  +--------+---------+  +-------+--------+  |
|                                  |                      |        |
|  +------------------+  +--------v---------+  +-------v--------+  |
|  | RedactionEngine  |  | TimelineService  |  | AIProviderMgr  |  |
|  | (12 regex rules) |  | (query/paginate) |  | (adapter)      |  |
|  +------------------+  +------------------+  +----------------+  |
|                                                                  |
|  +------------------+  +------------------+                      |
|  | SkillForge       |  | ConfigManager    |                      |
|  | (session->skill) |  | (TOML chain)     |                      |
|  +------------------+  +------------------+                      |
+-----------|----------------------|-------------------------------+
            |                      |
            v                      v
+------------------------------------------------------------------+
|  Storage Layer                                                   |
|  +------------------+  +------------------+                      |
|  | SQLite (WAL)     |  | FTS5 Index       |                      |
|  | 6-table schema   |  | (full-text)      |                      |
|  +------------------+  +------------------+                      |
+------------------------------------------------------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Crate Dependencies |
|-----------|---------------|-------------------|-------------------|
| **CLI (clap)** | Parse CLI args, dispatch commands, output text | Service Layer directly | `clap`, `indicatif`, `console` |
| **Axum HTTP Server** | REST API, SSE events, static file serving | Service Layer via `AppState` | `axum`, `tower-http`, `tokio` |
| **ProjectDiscovery** | Scan `~/.claude/projects/`, build path mapping | Storage (ProjectIdentity) | `walkdir`, `std::fs` |
| **JsonlParser** | Stream-parse JSONL files, extract events | Called by SessionIndexer | `claude-code-transcripts`, `serde_json` |
| **SessionIndexer** | Orchestrate parsing, write to SQLite in batches | JsonlParser, Storage | `rusqlite` |
| **TimelineService** | Query events with cursor pagination | Storage (TranscriptEvent) | `rusqlite` |
| **ExportEngine** | Render session to Markdown/JSONL | TimelineService, RedactionEngine | `serde_json`, `chrono` |
| **RedactionEngine** | Apply 12 regex rules, preview highlights | Called by ExportEngine, AIProviderMgr | `regex` |
| **AIProviderMgr** | Pluggable AI provider adapter pattern | RedactionEngine, external HTTP | `reqwest`, `async-trait` |
| **SkillForge** | Extract patterns, generate SKILL.md | AIProviderMgr, Storage | `serde`, `handlebars` |
| **ConfigManager** | TOML config priority chain | All services (read) | `toml`, `dirs` |
| **Storage** | SQLite schema, migrations, connection pool | All data services | `rusqlite` (bundled-full) |
| **FileWatcher** | Watch transcript dirs for changes | SessionIndexer (re-index) | `notify`, `notify-debouncer-full` |
| **React Web UI** | Frontend SPA, consumes REST API | Axum via HTTP/SSE | `react`, `vite`, `tailwind`, `react-virtuoso` |

### Data Flow

**1. Scanning Flow (write path)**

```text
~/.claude/projects/<encoded>/
       |
       v  [ProjectDiscovery scans dirs]
Directory listing + cross-validate with JSONL content
       |
       v  [SessionIndexer reads JSONL]
JsonlParser streams entries one-by-one (constant memory)
       |
       v  [SessionIndexer batches]
Collect 2000 entries OR 4MB, write to SQLite in one transaction
       |
       v  [SessionIndexer writes]
INSERT into TranscriptEvent, ToolCall, SessionMetadata, ProjectIdentity
       |
       v  [SessionIndexer updates bookmark]
Upsert ScanBookmark (lastIndexedLine, fileHash)
```

**2. Browsing Flow (read path)**

```text
React UI --> GET /api/sessions?cursor=xxx&limit=50
                |
                v  [Axum handler]
            TimelineService::get_sessions(cursor, limit)
                |
                v  [Storage layer]
            SELECT ... FROM SessionMetadata WHERE id < cursor ORDER BY startedAt DESC LIMIT 51
            (51 to detect has_next_page)
                |
                v  [Response]
            JSON: { items: [...], next_cursor: "abc", has_more: true }
```

**3. Export Flow**

```text
User triggers export --> POST /api/sessions/:id/export
                |
                v  [ExportEngine]
            TimelineService::get_all_events(session_id)
                |
                v  [RedactionEngine::scan()]
            Apply 12 regex rules, produce list of (offset, rule, match_text)
                |
                v  [if safe export]
            RedactionEngine::redact(content, matches) --> replace with [REDACTED:type]
                |
                v  [Markdown renderer]
            Generate structured Markdown with sections
                |
                v  [Write to disk]
            Output to ~/Desktop/ or specified dir, create .gitignore
```

**4. AI Analysis Flow**

```text
User selects template --> POST /api/sessions/:id/summarize
                |
                v  [AIProviderMgr]
            TimelineService::get_full_session(session_id)
                |
                v  [RedactionEngine::scan()]
            Detect sensitive content in transcript
                |
                v  [Build prompt from template]
            Inject session data into template (Bug Runbook/PRD/Tech Plan/Learning Notes)
                |
                v  [AIProviderMgr::complete()]
            Call external AI API (reqwest streaming)
                |
                v  [SSE progress events]
            Stream progress: reading -> redacting -> generating -> validating
                |
                v  [Quality self-check]
            Verify summary covers key discussion points
                |
                v  [Store result]
            INSERT into Summary table
```

## Patterns to Follow

### Pattern 1: Repository / Data Access Trait

**What:** Abstract all database operations behind traits so services never touch SQL directly.
**When:** Every storage interaction.
**Why:** Enables unit testing with mock repositories, clean separation, easy migration to SQLCipher later.

```rust
// In src/storage/mod.rs
pub trait SessionRepository: Send + Sync {
    fn get_sessions(
        &self,
        query: &SessionQuery,
    ) -> Result<PaginatedResult<SessionMetadata>>;
    fn get_session(&self, id: &str) -> Result<Option<SessionDetail>>;
    fn upsert_session(&self, session: &SessionMetadata) -> Result<()>;
    fn get_events(
        &self,
        session_id: &str,
        cursor: Option<&str>,
        limit: usize,
    ) -> Result<PaginatedResult<TranscriptEvent>>;
    // ...
}

pub struct SqliteSessionRepository {
    pool: r2d2::Pool<SqliteConnectionManager>,
}
```

### Pattern 2: Service Provider / Dependency Injection

**What:** Services receive their dependencies as trait implementations, not concrete types.
**When:** All service construction.
**Why:** Testable, mockable, swappable implementations.

```rust
// In src/service/mod.rs
pub struct AppServices {
    pub project_discovery: ProjectDiscoveryService,
    pub session_indexer: SessionIndexerService,
    pub timeline: TimelineService,
    pub export: ExportService,
    pub redaction: RedactionService,
    pub ai_provider: Box<dyn AiProvider>,
    pub config: ConfigManager,
}

// AppState for Axum
pub struct AppState {
    pub services: Arc<AppServices>,
    pub db: Arc<SqliteSessionRepository>,
}
```

### Pattern 3: AI Provider Adapter

**What:** Trait-based adapter for AI providers. Each provider implements the same interface.
**When:** AI-powered features (summarize, skill forge).
**Why:** Pluggable providers, easy to add OpenAI/Gemini/Ollama later.

```rust
// In src/service/ai_provider.rs
#[async_trait]
pub trait AiProvider: Send + Sync {
    async fn complete(
        &self,
        request: AiRequest,
    ) -> Result<AiResponse>;
    async fn complete_stream(
        &self,
        request: AiRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<AiChunk>> + Send>>>;
    fn name(&self) -> &str;
    fn validate_config(&self) -> Result<()>;
}

pub struct ClaudeProvider {
    client: reqwest::Client,
    api_key: String,
    model: String,
}

pub struct OllamaProvider {
    client: reqwest::Client,
    base_url: String,
    model: String,
}
```

### Pattern 4: Cursor-Based Pagination

**What:** Use opaque cursors (base64-encoded last item ID) instead of offset-based pagination.
**When:** All list endpoints (sessions, timeline, search results).
**Why:** Stable pagination across inserts/deletes, consistent performance at any depth.

```rust
// In src/storage/pagination.rs
#[derive(Serialize, Deserialize)]
pub struct PaginatedResult<T> {
    pub items: Vec<T>,
    pub next_cursor: Option<String>,
    pub has_more: bool,
}

// Cursor = base64(last_item_id)
// Query: WHERE id < decode(cursor) ORDER BY startedAt DESC LIMIT :limit + 1
// If results.len() > limit: has_more = true, next_cursor = base64(last.id)
```

SQL pattern for cursor-based pagination:

```sql
-- Sessions list (newest first)
SELECT * FROM SessionMetadata
WHERE startedAt < :cursor_timestamp OR
      (startedAt = :cursor_timestamp AND sessionId < :cursor_id)
ORDER BY startedAt DESC, sessionId DESC
LIMIT :limit + 1;

-- Timeline events (sequential)
SELECT * FROM TranscriptEvent
WHERE sessionId = :sid AND sequence > :cursor_sequence
ORDER BY sequence ASC
LIMIT :limit + 1;
```

### Pattern 5: Streaming JSONL Parser (Constant Memory)

**What:** Read JSONL line-by-line using BufReader, process each line, never hold full file in memory.
**When:** All transcript parsing.
**Why:** GB-scale files must not OOM. 10MB line-length hard cap prevents pathological inputs.

```rust
// In src/parser/jsonl_parser.rs
pub struct JsonlParser {
    reader: BufReader<File>,
    current_offset: u64,
    line_buffer: String,
}

impl JsonlParser {
    pub fn next_entry(&mut self) -> Result<Option<(u64, usize, Entry)>> {
        self.line_buffer.clear();
        let bytes_read = self.reader.read_line(&mut self.line_buffer)?;
        if bytes_read == 0 { return Ok(None); }

        let offset = self.current_offset;
        let byte_len = bytes_read;

        // Hard cap: 10MB per line
        if byte_len > 10 * 1024 * 1024 {
            self.current_offset += byte_len as u64;
            return Ok(None); // skip, log warning
        }

        let entry: Entry = serde_json::from_str(self.line_buffer.trim_end())?;
        self.current_offset += byte_len as u64;

        Ok(Some((offset, byte_len, entry)))
    }
}
```

### Pattern 6: Batch Write with Dynamic Sizing

**What:** Accumulate parsed events in a Vec, flush to SQLite when batch hits 4MB or 2000 entries.
**When:** Indexing (scan and re-index).
**Why:** Transaction batching is orders of magnitude faster than per-row inserts. Dynamic sizing adapts to event sizes.

```rust
// In src/service/session_indexer.rs
struct WriteBatch {
    events: Vec<TranscriptEvent>,
    tool_calls: Vec<ToolCall>,
    estimated_bytes: usize,
}

const MAX_BATCH_SIZE: usize = 4 * 1024 * 1024; // 4MB
const MAX_BATCH_ROWS: usize = 2000;

impl WriteBatch {
    fn should_flush(&self) -> bool {
        self.events.len() >= MAX_BATCH_ROWS ||
        self.estimated_bytes >= MAX_BATCH_SIZE
    }

    fn flush(&mut self, conn: &Connection) -> Result<()> {
        let tx = conn.transaction()?;
        // bulk INSERT using prepared statements
        for event in &self.events {
            // INSERT INTO TranscriptEvent ...
        }
        for tc in &self.tool_calls {
            // INSERT INTO ToolCall ...
        }
        tx.commit()?;
        self.events.clear();
        self.tool_calls.clear();
        self.estimated_bytes = 0;
        Ok(())
    }
}
```

### Pattern 7: Incremental Scan with Bookmark

**What:** After indexing a file, record the last indexed line number and file hash. On re-scan, compare hash and resume from bookmark.
**When:** All scans (full and incremental).
**Why:** Avoids re-parsing unchanged files. Detects mid-file appends (active sessions).

```text
Full scan:
  For each JSONL file in ~/.claude/projects/:
    1. Check ScanBookmark for this file
    2. No bookmark -> parse from line 0
    3. Bookmark exists:
       a. Compare file size + hash of first N bytes
       b. If unchanged + same size -> skip (already indexed)
       c. If unchanged + larger -> resume from lastIndexedLine (append only)
       d. If changed -> re-parse from line 0 (file was modified)

Incremental scan (file watcher triggered):
  1. File change event received
  2. Same bookmark comparison logic
  3. Only re-index delta
```

### Pattern 8: SSE Event Stream for Progress

**What:** Use Axum's built-in `Sse` with `KeepAlive` to stream progress events to the web UI.
**When:** Long-running operations (scanning, AI generation, export).
**Why:** Real-time feedback without polling. Axum has first-class SSE support.

```rust
// In src/api/sse.rs
use axum::response::sse::{Event, KeepAlive, Sse};
use tokio_stream::StreamExt;

async fn events_handler(
    State(state): State<Arc<AppState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let mut rx = state.event_bus.subscribe();

    let stream = async_stream::stream! {
        while let Some(event) = rx.recv().await {
            let data = serde_json::to_string(&event).unwrap();
            yield Ok(Event::default().data(data).event("progress"));
        }
    };

    Sse::new(stream).keep_alive(KeepAlive::default())
}
```

### Pattern 9: Redaction Engine (Regex Pipeline)

**What:** Ordered pipeline of 12 regex rules. Each rule produces match spans. Redaction applies all rules, then replaces by span position (reverse order to preserve offsets).
**When:** Export (safe mode), AI provider input preparation.
**Why:** Correct redaction requires coordinated multi-rule matching -- naive sequential replace corrupts offsets.

```rust
// In src/service/redaction.rs
pub struct RedactionEngine {
    rules: Vec<RedactionRule>,
}

pub struct RedactionRule {
    pub name: String,
    pub pattern: Regex,
    pub replacement: String,  // e.g., "[REDACTED:api-key]"
    pub severity: Severity,
}

pub struct RedactionMatch {
    pub start: usize,
    pub end: usize,
    pub matched_text: String,
    pub rule_name: String,
}

impl RedactionEngine {
    pub fn scan(&self, text: &str) -> Vec<RedactionMatch> {
        let mut matches = Vec::new();
        for rule in &self.rules {
            for mat in rule.pattern.find_iter(text) {
                // Skip known false positives (test_, fake_, dummy_, example_ prefixes)
                if is_known_false_positive(mat.as_str()) { continue; }
                matches.push(RedactionMatch {
                    start: mat.start(),
                    end: mat.end(),
                    matched_text: mat.as_str().to_string(),
                    rule_name: rule.name.clone(),
                });
            }
        }
        // Sort reverse by start position for safe replacement
        matches.sort_by(|a, b| b.start.cmp(&a.start));
        matches
    }

    pub fn redact(&self, text: &str, matches: &[RedactionMatch]) -> String {
        let mut result = text.to_string();
        for m in matches {
            result.replace_range(m.start..m.end, &format!("[REDACTED:{}]", m.rule_name));
        }
        result
    }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Loading Full JSONL into Memory

**What:** Reading entire transcript file with `std::fs::read_to_string` before parsing.
**Why bad:** A single session can be hundreds of MB. Loading it all causes OOM and latency spikes.
**Instead:** Use `BufReader<File>` with line-by-line reading. Track byte offset for O(1) seek-back.

### Anti-Pattern 2: Offset-Based Pagination

**What:** `SELECT ... LIMIT 50 OFFSET 10000` for deep pagination.
**Why bad:** SQLite must scan and discard 10000 rows. Performance degrades linearly with page depth.
**Instead:** Cursor-based pagination using indexed columns (`startedAt` + `sessionId`). Consistent O(limit) performance at any depth.

### Anti-Pattern 3: Synchronous SQLite in Async Context

**What:** Calling `rusqlite` operations directly inside Axum handlers.
**Why bad:** Rusqlite is synchronous (blocking). Blocking inside a tokio task starves the runtime.
**Instead:** Use `tokio::task::spawn_blocking` to move SQLite operations to a blocking thread pool. Or use a connection pool (`r2d2` or `deadpool-sqlite`) with `spawn_blocking`.

```rust
// CORRECT pattern
async fn get_sessions(
    State(state): State<Arc<AppState>>,
) -> Result<Json<PaginatedResult<Session>>> {
    let db = state.db.clone();
    let result = tokio::task::spawn_blocking(move || {
        db.get_sessions(&SessionQuery::default())
    }).await??;
    Ok(Json(result))
}
```

### Anti-Pattern 4: Embedding SQL in Service Logic

**What:** Service functions contain raw SQL strings scattered throughout.
**Why bad:** Hard to test, hard to optimize, schema changes cause scattered breakage.
**Instead:** Repository trait pattern. All SQL lives in one module (`src/storage/`). Services call trait methods.

### Anti-Pattern 5: Single God Service

**What:** One `CcMemoService` struct that handles scanning, indexing, export, AI, skills.
**Why bad:** Unrelated concerns tangled together. Impossible to test in isolation. Changes cascade.
**Instead:** Separate services with narrow responsibilities: `SessionIndexerService`, `ExportService`, `RedactionEngine`, `AIProviderManager`, `SkillForgeService`.

### Anti-Pattern 6: Naive Redaction (Sequential Replace)

**What:** Running regex replaces one after another on the same string.
**Why bad:** Each replace shifts character positions, invalidating subsequent match offsets.
**Instead:** First scan all rules to collect match spans, then apply replacements in reverse position order.

### Anti-Pattern 7: No File Size Guards on JSONL Parsing

**What:** Blindly parsing any line from a JSONL file without length limits.
**Why bad:** A malicious or corrupted transcript could have a multi-GB single line, causing OOM.
**Instead:** 10MB hard cap per line. Lines exceeding the cap are logged and skipped.

## SQLite Schema Design

### Core Tables

```sql
-- Schema version tracking
PRAGMA user_version = 1;

-- Project identification (maps encoded folders to real paths)
CREATE TABLE ProjectIdentity (
    id              TEXT PRIMARY KEY,          -- hash of realPath
    name            TEXT NOT NULL,             -- directory basename
    realPath        TEXT NOT NULL UNIQUE,      -- actual filesystem path
    normalizedPath  TEXT NOT NULL,             -- lowercased, separator-normalized
    encodedFolder   TEXT NOT NULL,             -- Claude's directory encoding
    gitRemote       TEXT,                      -- from .git/config
    lastActiveAt    TEXT NOT NULL              -- ISO 8601
);

-- Session metadata
CREATE TABLE SessionMetadata (
    sessionId           TEXT PRIMARY KEY,      -- from JSONL
    projectId           TEXT NOT NULL REFERENCES ProjectIdentity(id),
    autoTitle           TEXT,                  -- first user message, 50 chars
    customTitle         TEXT,                  -- user-edited title
    status              TEXT NOT NULL DEFAULT 'active',  -- active/completed/interrupted/unrecoverable
    startedAt           TEXT NOT NULL,         -- first event timestamp
    endedAt             TEXT,                  -- last event timestamp
    totalInputTokens    INTEGER DEFAULT 0,
    totalOutputTokens   INTEGER DEFAULT 0,
    model               TEXT,
    fileCount           INTEGER DEFAULT 0,
    toolCallCount       INTEGER DEFAULT 0,
    errorCount          INTEGER DEFAULT 0,
    tags                TEXT DEFAULT '[]',     -- JSON array of strings
    filePath            TEXT NOT NULL           -- source JSONL file path
);

-- Individual transcript events (indexed for timeline rendering)
CREATE TABLE TranscriptEvent (
    id              TEXT PRIMARY KEY,          -- "{sessionId}:{sequence}"
    sessionId       TEXT NOT NULL REFERENCES SessionMetadata(sessionId),
    sequence        INTEGER NOT NULL,
    type            TEXT NOT NULL,             -- user/assistant/tool_use/tool_result/system/attachment
    timestamp       TEXT NOT NULL,
    fileOffset      INTEGER NOT NULL,         -- byte offset in JSONL file for O(1) seek
    byteLength      INTEGER NOT NULL,         -- bytes of original JSON
    preview         TEXT,                      -- first 200 chars for timeline rendering
    rawJsonHash     TEXT NOT NULL,             -- SHA-256 of original JSON line
    role            TEXT,                      -- for user/assistant entries
    UNIQUE(sessionId, sequence)
);

-- Tool call details (denormalized for filtering)
CREATE TABLE ToolCall (
    id              TEXT PRIMARY KEY,          -- tool call UUID from transcript
    eventId         TEXT NOT NULL REFERENCES TranscriptEvent(id),
    sessionId       TEXT NOT NULL REFERENCES SessionMetadata(sessionId),
    toolName        TEXT NOT NULL,             -- Read/Write/Edit/Bash/etc.
    filePath        TEXT,                      -- target file (if applicable)
    inputSummary    TEXT,                      -- truncated input
    outputSummary   TEXT                       -- truncated output
);

-- AI-generated summaries and playbooks
CREATE TABLE Summary (
    id              TEXT PRIMARY KEY,
    sessionId       TEXT NOT NULL REFERENCES SessionMetadata(sessionId),
    type            TEXT NOT NULL,             -- runbook/technical_plan/prd/learning_notes/skill_spec
    content         TEXT NOT NULL,
    metadata        TEXT DEFAULT '{}',         -- JSON: template, params, quality score
    model           TEXT,                      -- which model generated this
    createdAt       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Incremental scan bookmark
CREATE TABLE ScanBookmark (
    filePath        TEXT PRIMARY KEY,          -- absolute path to JSONL file
    sessionId       TEXT,                      -- associated session
    lastIndexedLine INTEGER NOT NULL DEFAULT 0,
    fileHash        TEXT,                      -- hash of first 64KB for change detection
    lastScannedAt   TEXT NOT NULL DEFAULT (datetime('now')),
    fileSize        INTEGER DEFAULT 0          -- for append-only detection
);
```

### Indexes

```sql
-- Session queries
CREATE INDEX idx_session_status ON SessionMetadata(status);
CREATE INDEX idx_session_project ON SessionMetadata(projectId);
CREATE INDEX idx_session_started ON SessionMetadata(startedAt DESC);

-- Timeline queries (compound index for cursor-based pagination)
CREATE INDEX idx_event_session_seq ON TranscriptEvent(sessionId, sequence);
CREATE INDEX idx_event_session_type ON TranscriptEvent(sessionId, type);
CREATE INDEX idx_event_timestamp ON TranscriptEvent(timestamp);

-- Tool call lookups
CREATE INDEX idx_toolcall_event ON ToolCall(eventId);
CREATE INDEX idx_toolcall_session ON ToolCall(sessionId);
CREATE INDEX idx_toolcall_filepath ON ToolCall(filePath);

-- Summary queries
CREATE INDEX idx_summary_session ON Summary(sessionId);
CREATE INDEX idx_summary_type ON Summary(type);
```

### FTS5 Virtual Table (v0.2)

```sql
CREATE VIRTUAL TABLE session_fts USING fts5(
    sessionId,
    autoTitle,
    content,           -- user messages + assistant responses
    filePath,          -- file paths mentioned in tools
    toolNames,         -- tool calls used
    content='TranscriptEvent',
    content_rowid='rowid',
    tokenize='unicode61'    -- v0.1: basic tokenizer; v0.2: jieba-rs custom tokenizer
);

-- Triggers to keep FTS in sync
CREATE TRIGGER fts_insert AFTER INSERT ON TranscriptEvent BEGIN
    INSERT INTO session_fts(rowid, sessionId, autoTitle, content, filePath, toolNames)
    SELECT new.rowid, new.sessionId,
           (SELECT autoTitle FROM SessionMetadata WHERE sessionId = new.sessionId),
           new.preview, '', '';
END;
```

### SQLite Configuration (Applied at Connection Open)

```sql
PRAGMA journal_mode = WAL;          -- Concurrent reads during writes
PRAGMA synchronous = NORMAL;        -- Safe with WAL, faster than FULL
PRAGMA cache_size = -64000;         -- 64MB cache
PRAGMA temp_store = MEMORY;         -- Temp tables in memory
PRAGMA mmap_size = 268435456;       -- 256MB memory-mapped I/O
PRAGMA foreign_keys = ON;           -- Enforce referential integrity
```

## Module Structure (Rust Crate)

```text
src/
  main.rs                    -- CLI entry point, clap dispatch
  lib.rs                     -- Re-exports, AppServices builder

  cli/
    mod.rs                   -- CLI command definitions (clap derive)
    commands/
      scan.rs                -- ccmemo scan
      list.rs                -- ccmemo list
      show.rs                -- ccmemo show
      resume.rs              -- ccmemo resume
      export.rs              -- ccmemo export
      summarize.rs           -- ccmemo summarize
      skill.rs               -- ccmemo skill (subcommands)
      serve.rs               -- ccmemo serve
      demo.rs                -- ccmemo demo
      config_cmd.rs          -- ccmemo config
      doctor.rs              -- ccmemo doctor

  api/
    mod.rs                   -- Axum router setup, AppState
    routes/
      sessions.rs            -- GET/POST /api/sessions/*
      projects.rs            -- GET /api/projects
      search.rs              -- GET /api/search
      skills.rs              -- POST /api/skills/*
      settings.rs            -- GET/PUT /api/settings
      events.rs              -- GET /api/events (SSE)
      export.rs              -- POST /api/sessions/:id/export
    middleware/
      auth.rs                -- Bearer token + Host header validation
      cors.rs                -- CORS for 127.0.0.1

  service/
    mod.rs                   -- AppServices struct, DI wiring
    project_discovery.rs     -- Scan ~/.claude/projects/
    session_indexer.rs       -- JSONL -> SQLite pipeline
    timeline.rs              -- Query events with pagination
    export.rs                -- Render to Markdown/JSONL
    redaction.rs             -- 12-rule regex engine
    ai_provider.rs           -- Trait + Claude adapter
    skill_forge.rs           -- Session -> SKILL.md pipeline
    file_watcher.rs          -- notify-based FS watcher
    config.rs                -- TOML config chain

  parser/
    mod.rs                   -- Parser trait + factory
    jsonl_parser.rs          -- BufReader-based streaming parser
    entry_types.rs           -- Map claude-code-transcripts Entry -> domain types

  storage/
    mod.rs                   -- Repository traits
    sqlite.rs                -- SQLite implementation
    migrations.rs            -- Schema version management
    models.rs                -- Domain structs (SessionMetadata, TranscriptEvent, etc.)

  domain/
    mod.rs
    types.rs                 -- Shared types, Pagination, SessionQuery
    error.rs                 -- AppError enum, IntoResponse impl
```

## Build Order and Component Dependencies

The build order follows a strict dependency chain. Each phase produces testable, independently valuable output.

```text
Phase 1: Foundation (no dependencies)
  [1a] domain/ (types, error types)
  [1b] storage/migrations.rs (schema DDL)
  [1c] storage/models.rs (domain structs matching tables)
  [1d] storage/sqlite.rs (Connection setup, WAL, repository skeleton)
  [1e] service/config.rs (TOML config chain)
  Tests: unit tests for each, in-memory SQLite for storage

Phase 2: Parser + Indexer (depends on Phase 1)
  [2a] parser/entry_types.rs (Entry -> domain mapping)
  [2b] parser/jsonl_parser.rs (streaming JSONL reader)
  [2c] service/project_discovery.rs (directory scanning)
  [2d] service/session_indexer.rs (parser -> storage pipeline with batching)
  Tests: golden JSONL test fixtures, parse-and-assert

Phase 3: Query + CLI (depends on Phase 1, 2)
  [3a] service/timeline.rs (cursor pagination queries)
  [3b] cli/commands/scan.rs
  [3c] cli/commands/list.rs
  [3d] cli/commands/show.rs
  Tests: CLI integration tests with test DB

Phase 4: Export + Resume (depends on Phase 3)
  [4a] service/redaction.rs (12-rule regex engine)
  [4b] service/export.rs (Markdown/JSONL rendering)
  [4c] cli/commands/resume.rs (Safe Resume checks)
  [4d] cli/commands/export.rs
  Tests: export fixtures, redaction coverage tests

Phase 5: API Server (depends on Phase 3, 4)
  [5a] api/mod.rs (router, AppState, middleware)
  [5b] api/routes/sessions.rs
  [5c] api/routes/projects.rs
  [5d] api/routes/events.rs (SSE)
  [5e] api/routes/export.rs
  [5f] cli/commands/serve.rs
  Tests: API integration tests with test DB + reqwest

Phase 6: React Web UI (depends on Phase 5)
  [6a] Vite + React + TypeScript + Tailwind setup
  [6b] API client (fetch wrapper with cursor pagination)
  [6c] Session list page (with react-virtuoso)
  [6d] Session inspector (three-column layout)
  [6e] Export UI + redaction preview
  [6f] Search UI (v0.2)
  Tests: component tests, E2E with Playwright

Phase 7: AI + Skills (depends on Phase 4, 5)
  [7a] service/ai_provider.rs (trait + Claude adapter)
  [7b] api/routes/sessions.rs (summarize endpoint)
  [7c] cli/commands/summarize.rs
  [7d] service/skill_forge.rs (Skill pipeline)
  [7e] cli/commands/skill.rs
  [7f] api/routes/skills.rs
  Tests: mock AI provider, Skill validation tests

Phase 8: File Watcher + Polish (depends on Phase 2, 5)
  [8a] service/file_watcher.rs (notify + debouncer)
  [8b] cli/commands/demo.rs (cold start demo sessions)
  [8c] cli/commands/doctor.rs (diagnostics)
  [8d] cli/commands/config_cmd.rs
  Tests: file watcher integration, end-to-end smoke tests
```

### Dependency Graph Summary

```text
domain -----> storage -----> parser -----> session_indexer
  |               |                            |
  v               v                            v
config      timeline_service              project_discovery
  |               |                            |
  v               v                            v
CLI <--------- API server <--------- React Web UI
                   ^
                   |
            redaction_engine
                   ^
                   |
            export_engine / ai_provider / skill_forge
```

## Scalability Considerations

| Concern | At 100 sessions (< 50MB) | At 1K sessions (< 500MB) | At 5K sessions (< 2GB) |
|---------|--------------------------|--------------------------|------------------------|
| Cold scan | < 5s single-pass | < 30s batch writes | < 3min parallel directory scan |
| Session list query | < 50ms indexed | < 100ms indexed | < 200ms, add LIMIT |
| Timeline load (50 events) | < 30ms | < 50ms | < 80ms, cursor-based O(1) |
| Full-text search | N/A (v0.2) | < 200ms FTS5 | < 300ms FTS5 + jieba-rs |
| JSONL seek to offset | < 1ms direct seek | < 5ms seek | < 10ms seek (fileOffset is key) |
| SQLite DB size | ~5-10MB | ~50-100MB | ~200-500MB |
| Memory usage | < 50MB | < 100MB (streaming) | < 150MB (streaming, never full file) |
| Concurrent read/write | WAL mode, no blocking | WAL mode + batch writes | WAL mode + batch + connection pool |

## API Design Reference

### Cursor Pagination Protocol

All list endpoints follow the same pattern:

**Request:**
```text
GET /api/sessions?cursor=<opaque>&limit=50&status=active&projectId=xxx
```

**Response:**
```json
{
  "items": [...],
  "next_cursor": "eyJpZCI6ImFiYzEyMyJ9",
  "has_more": true,
  "total_count": 1234
}
```

**Cursor encoding:** Base64 of `{"id": "abc123", "ts": "2026-05-29T12:00:00Z"}`. Opaque to clients.

**Edge cases:**
- No cursor = first page (most recent)
- Empty `items` array = no results
- `has_more: false` = last page, `next_cursor` is null

### SSE Event Protocol

```text
GET /api/events
Authorization: Bearer <token>

event: scan_progress
data: {"type":"scan_progress","scanned":42,"total":100,"current_file":"abc.jsonl"}

event: scan_complete
data: {"type":"scan_complete","total_sessions":15,"total_events":5000,"duration_ms":2340}

event: ai_progress
data: {"type":"ai_progress","stage":"redacting","percent":60}

event: ai_complete
data: {"type":"ai_complete","summary_id":"sum_123","quality_score":0.85}
```

## Sources

- Axum SSE: https://docs.rs/axum/latest/axum/response/sse/ (v0.8.9) -- HIGH confidence
- Rusqlite API: https://docs.rs/rusqlite/latest/rusqlite/ -- HIGH confidence
- Rusqlite WAL hooks: Context7 docs -- HIGH confidence
- Notify crate (file watching): Context7 docs, `notify-debouncer-full` -- HIGH confidence
- Tokio `spawn_blocking`: Context7 docs -- HIGH confidence
- Claude Code JSONL format: inspected actual transcript files at `~/.claude/projects/` -- HIGH confidence
- `claude-code-transcripts` crate: crates.io listing exists, API unverified -- MEDIUM confidence (verify before use)
- SQLite FTS5: official SQLite documentation -- HIGH confidence
- Cursor-based pagination: standard pattern, verified against rusqlite query patterns -- HIGH confidence
