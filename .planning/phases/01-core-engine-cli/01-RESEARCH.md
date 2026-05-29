# Phase 1: Core Engine + CLI - Research

**Researched:** 2026-05-29
**Domain:** Rust core engine (JSONL parser + SQLite storage + CLI)
**Confidence:** HIGH

## Summary

Phase 1 builds the foundational Rust engine for CCMemo: a data ingestion pipeline that discovers, parses, indexes, and stores Claude Code JSONL transcripts into a 6-table SQLite database with FTS5 search, exposed through a CLI interface. The three critical risks at this layer are SQLite WAL concurrency (solved by r2d2 pool + Mutex write connection + busy_timeout), Chinese FTS5 tokenization (solved by jieba-rs pre-tokenization into auxiliary columns), and JSONL streaming edge cases on active sessions (solved by BufReader + byte offset tracking + incomplete line buffering).

The claude-code-transcripts 0.1.11 crate exposes an Entry enum with 26 variants -- far more than initially scoped -- including AiTitle, CustomTitle, Tag, TaskSummary, QueueOperation, ContextCollapseCommit, and an Unknown catch-all for forward compatibility. The first implementation task must be a spike mapping all 26 variants to domain types and verifying inner struct fields, per decision D-01.

**Primary recommendation:** Establish the storage layer (schema, migrations, connection management, repository traits) first, then build the streaming parser + indexer pipeline, then wire up CLI commands. This matches the three-plan structure and ensures each layer is independently testable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use claude-code-transcripts 0.1.11 with spike validation. Fallback to custom parser if gaps found.
- **D-02:** Streaming parser: BufReader + line-by-line, track byte offsets, buffer incomplete lines.
- **D-03:** 10MB hard line limit. Skip + log lines exceeding this.
- **D-04:** Directory scanning of ~/.claude/projects/ + cross-validation. Never reverse-encode paths (bug #40946).
- **D-05:** Pre-tokenization with jieba-rs for Chinese FTS5 (space-separated tokens in auxiliary column).
- **D-06:** FTS5 uses unicode61 for English + pre-tokenized jieba-rs column for Chinese.
- **D-07:** Accept ~10MB jieba-rs dictionary binary size increase.
- **D-08:** r2d2 pool for reads + single Mutex<Connection> for writes. busy_timeout=5000ms.
- **D-09:** WAL mode, synchronous=NORMAL, cache_size=-64000, temp_store=MEMORY.
- **D-10:** Batch writes: 4MB or 2000 rows per transaction.
- **D-11:** 6-table schema: ProjectIdentity, SessionMetadata, TranscriptEvent, ToolCall, Summary, ScanBookmark.
- **D-12:** TranscriptEvent.fileOffset + byteLength mandatory for O(1) seek.
- **D-13:** ScanBookmark tracks filePath, sessionId, lastIndexedLine, fileHash, lastScannedAt.
- **D-14:** Status detection: Active (<2h + last is assistant), Completed (>7d or user marked), Interrupted (last is user no reply), Unrecoverable (path gone + CLI unavailable).
- **D-15:** Rich terminal output: console + indicatif. TTY detection for plain text fallback.
- **D-16:** clap 4.6 with derive macros. Subcommands: scan, list, show, resume, export, serve, demo, config, doctor.
- **D-17:** `ccmemo list` default: table with ID, Title, Project, Branch, Status, Last Updated. --format json support.
- **D-18:** `ccmemo show` displays metadata + condensed timeline. Pager (less) for long output.
- **D-19:** thiserror for library errors. anyhow for CLI top-level.
- **D-20:** API keys from env vars, remove_var after reading.
- **D-21:** Log sanitization: never log raw content or API keys.
- **D-22:** TOML config. Priority: CLI args > env vars > .ccmemo.toml > config.toml (XDG) > defaults.
- **D-23:** Key configs: claude_config_dir, db_path, export_dir.
- **D-24:** `ccmemo demo` imports 3 synthetic JSONL sessions.
- **D-25:** Demo uses realistic synthetic data, no real user data.
- **D-26:** Cargo workspace: ccmemo-core (lib) + ccmemo-cli (bin).
- **D-27:** Frontend in separate web/ directory (Phase 3+).

### Claude's Discretion
- Exact module file organization within ccmemo-core
- Specific error type variants and message wording
- Testing granularity and test file organization
- Migration versioning scheme
- Progress reporting detail level during scan

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCAN-01 | Scan ~/.claude/projects/ to discover all transcript files | D-04: directory scanning with walkdir; ProjectDiscovery service pattern |
| SCAN-02 | Parse JSONL with claude-code-transcripts, streaming (constant memory) | D-01/D-02: Entry enum (26 variants verified), BufReader streaming parser pattern |
| SCAN-03 | Incremental scans for actively-appending sessions | D-13: ScanBookmark + incomplete line buffering; byte offset tracking |
| SCAN-04 | Auto-detect session status (active/completed/interrupted/unrecoverable) | D-14: time-based + last-event-type heuristics |
| SCAN-05 | Generate auto-titles from first user message (50 chars) | Entry::User variant parsing; text cleaning logic |
| SCAN-06 | Project path discovery by directory scanning + cross-validation | D-04: never reverse-encode; bug #40946 mitigation |
| SCAN-07 | Tolerate corrupted/half-line JSON with UTF-8 replacement and skip | D-03: 10MB line cap; serde_json error handling with line-skip logging |
| STOR-01 | SQLite with WAL mode for concurrent read/write | D-08/D-09: r2d2 pool + Mutex write conn; WAL + PRAGMA configuration |
| STOR-02 | 6-table schema | D-11: full DDL in ARCHITECTURE.md; verified column types |
| STOR-03 | fileOffset + byteLength for O(1) seek | D-12: tracked in streaming parser; stored in TranscriptEvent |
| STOR-04 | Batch writes (4MB or 2000 rows per transaction) | D-10: WriteBatch pattern with dynamic flush threshold |
| STOR-05 | ScanBookmark for incremental re-scan | D-13: fileHash + lastIndexedLine; append-only detection logic |
| CLIC-01 | `ccmemo scan [--full]` to scan and index | D-16: clap subcommand; indicatif progress bar |
| CLIC-02 | `ccmemo list` with filters | D-17: table output; --format json; cursor pagination |
| CLIC-03 | `ccmemo show <session_id>` | D-18: metadata + timeline; pager for long output |
| CLIC-04 | `ccmemo resume <session_id>` with Safe Resume | D-14: status check; project path + CLI availability |
| CLIC-05 | `ccmemo serve [--port]` | Placeholder in Phase 1 (full impl in Phase 2); stub command |
| CLIC-06 | `ccmemo export <session_id> --format markdown|jsonl [--safe]` | Export service + optional redaction; file output |
| CLIC-09 | `ccmemo demo` to import example sessions | D-24/D-25: 3 synthetic JSONL files embedded in binary |
| CLIC-10 | `ccmemo config get/set` and `ccmemo doctor` | D-22/D-23: TOML config chain; diagnostic checks |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Transcript file discovery | CLI/OS (filesystem) | -- | Directory scanning is an OS-level operation triggered by CLI |
| JSONL parsing | Core Engine (library) | -- | Parser must be independent of I/O; pure data transformation |
| SQLite storage | Core Engine (library) | -- | Schema, migrations, repository traits belong in the data layer |
| FTS5 + Chinese tokenization | Core Engine (library) | -- | jieba-rs integration is a storage concern, not CLI |
| Session status detection | Core Engine (library) | -- | Business logic based on timestamps and event types |
| CLI argument parsing | CLI (binary) | -- | clap derive macros are presentation-layer concern |
| Terminal output formatting | CLI (binary) | -- | console/indicatif are presentation-layer concern |
| Configuration management | Core Engine (library) | CLI (binary) | Config loading is library logic; CLI overrides are presentation |
| Demo data generation | Core Engine (library) | -- | Synthetic JSONL creation is data-layer logic |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| rusqlite | 0.40.0 | SQLite with FTS5 (bundled-full) | Statically links SQLite with all extensions. No system dependency. [VERIFIED: docs.rs] |
| claude-code-transcripts | 0.1.11 | Typed JSONL parser (Entry enum) | Purpose-built for Claude Code transcripts. 26 variants. Round-trip validator. [VERIFIED: docs.rs] |
| clap | 4.6.1 | CLI argument parser | Derive macros for subcommand structure. Standard Rust CLI choice. [VERIFIED: docs.rs] |
| serde + serde_json | 1.0.228 / 1.0.150 | Serialization | Required by claude-code-transcripts. JSON deserialization. [VERIFIED: docs.rs] |
| jieba-rs | 0.10.1 | Chinese word segmentation | Pure Rust jieba. Default dict embedded. Pre-tokenization for FTS5. [VERIFIED: docs.rs] |
| tokio | 1.52 | Async runtime | Required by axum (Phase 2). Full-featured. [VERIFIED: docs.rs] |
| thiserror | 2.0.18 | Error type derivation | Per D-19: library error types. [VERIFIED: docs.rs] |
| anyhow | 1.0 | Top-level error handling | Per D-19: CLI error handling. [VERIFIED: docs.rs] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| r2d2 | 0.8 | Connection pooling for SQLite reads | Per D-08: read connection pool |
| console | 0.15 | Colored terminal output | Per D-15: rich CLI output |
| indicatif | 0.17 | Progress bars | Per D-15: scan progress display |
| tracing + tracing-subscriber | 0.1.44 / 0.3.23 | Structured logging | Per D-21: sanitized logging |
| chrono | 0.4.44 | Date/time handling | Session timestamps, status thresholds |
| uuid | 1.23.2 | ID generation | Session and event IDs |
| sha2 | 0.10 | Hashing | ScanBookmark fileHash |
| walkdir | 2.x | Directory traversal | Per D-04: scanning ~/.claude/projects/ |
| toml | 0.8 | TOML parsing | Per D-22: configuration files |
| dirs | 5.x | Standard directory paths | Per D-23: XDG config, data dirs |
| percent-encoding | 2.x | URL decoding | Per D-04: path display |
| regex | 1.x | Pattern matching | Export redaction (Phase 4 baseline) |

### Dev Dependencies

| Library | Purpose |
|---------|---------|
| tempfile | In-memory SQLite for tests |
| assert_cmd | CLI integration testing |
| assert_fs | Test filesystem fixtures |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| r2d2 for SQLite | deadpool-sqlite | deadpool is async-native but rusqlite is sync; r2d2 is simpler for sync pool |
| walkdir | ignore (like ripgrep) | ignore respects .gitignore; walkdir is simpler for scanning all dirs |
| indicatif progress bars | indicatif + crossbeam channels | Channels needed for multi-threaded progress; overkill for single-threaded scan |

**Installation:**
```bash
# Phase 1 only -- no axum/tower-http/web dependencies yet
cargo add rusqlite --features bundled-full
cargo add claude-code-transcripts
cargo add clap --features derive
cargo add serde --features derive
cargo add serde_json
cargo add jieba-rs --features tfidf
cargo add tokio --features full
cargo add thiserror
cargo add anyhow
cargo add r2d2
cargo add console
cargo add indicatif
cargo add tracing tracing-subscriber --features env-filter
cargo add chrono --features serde
cargo add uuid --features v4
cargo add sha2
cargo add walkdir
cargo add toml
cargo add dirs
cargo add percent-encoding
cargo add regex
cargo add --dev tempfile assert_cmd assert_fs
```

**Version verification:** Versions verified via docs.rs on 2026-05-29. cargo not available on this machine; crate versions cross-referenced with existing verified STACK.md research.

## Architecture Patterns

### System Architecture Diagram

```text
~/.claude/projects/<encoded>/*.jsonl
        |
        v
  [ProjectDiscovery] ----> directory listing + cross-validate paths
        |
        v
  [JsonlParser] ----------> BufReader, line-by-line, byte offset tracking
        |                      10MB line cap, incomplete line buffer
        v
  [SessionIndexer] -------> Entry -> domain type mapping
        |                      jieba-rs pre-tokenization (Chinese)
        |                      WriteBatch (4MB / 2000 rows)
        v
  [SQLite WAL Storage] ---> r2d2 read pool + Mutex<Connection> write
        |                      6 tables + FTS5 virtual table
        |                      ScanBookmark for incremental re-scan
        |
        +------> [TimelineService] ----> cursor-paginated event queries
        |
        +------> [ConfigManager] ------> TOML config priority chain
        |
        v
  [CLI Commands] ----------> clap derive subcommands
        |                      console/indicatif for output
        v
  stdout/stderr (TTY-aware)
```

### Recommended Project Structure

```text
ccmemo/                          # Cargo workspace root
├── Cargo.toml                   # Workspace definition
├── crates/
│   ├── ccmemo-core/             # Library crate
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs           # Re-exports, AppServices builder
│   │       ├── domain/
│   │       │   ├── mod.rs
│   │       │   ├── types.rs     # Shared types, Pagination, SessionQuery
│   │       │   └── error.rs     # AppError enum (thiserror)
│   │       ├── storage/
│   │       │   ├── mod.rs       # Repository traits
│   │       │   ├── sqlite.rs    # Connection setup, WAL, r2d2 pool
│   │       │   ├── migrations.rs # Schema DDL, PRAGMA, version tracking
│   │       │   └── models.rs    # Domain structs matching tables
│   │       ├── parser/
│   │       │   ├── mod.rs       # Parser trait + factory
│   │       │   ├── jsonl_parser.rs  # BufReader streaming parser
│   │       │   └── entry_mapper.rs  # Entry -> domain type mapping
│   │       ├── service/
│   │       │   ├── mod.rs       # AppServices struct
│   │       │   ├── project_discovery.rs  # Scan ~/.claude/projects/
│   │       │   ├── session_indexer.rs    # Parser -> Storage pipeline
│   │       │   ├── timeline.rs           # Query events with pagination
│   │       │   ├── config.rs             # TOML config chain
│   │       │   └── demo.rs               # Synthetic JSONL generation
│   │       └── tokenizer/
│   │           ├── mod.rs       # Tokenizer trait
│   │           └── jieba.rs     # jieba-rs wrapper (singleton Jieba instance)
│   └── ccmemo-cli/             # Binary crate
│       ├── Cargo.toml
│       └── src/
│           ├── main.rs          # Entry point, anyhow top-level
│           └── commands/
│               ├── mod.rs       # CLI command dispatch
│               ├── scan.rs      # ccmemo scan [--full]
│               ├── list.rs      # ccmemo list
│               ├── show.rs      # ccmemo show <id>
│               ├── resume.rs    # ccmemo resume <id>
│               ├── export.rs    # ccmemo export <id> --format
│               ├── serve.rs     # ccmemo serve [--port] (stub)
│               ├── demo.rs      # ccmemo demo
│               ├── config_cmd.rs # ccmemo config get/set
│               └── doctor.rs    # ccmemo doctor
```

### Pattern 1: Repository Trait (Storage Abstraction)

**What:** All database operations behind traits. Services never write SQL.
**When:** Every storage interaction.
**Why:** Testable with mock repos. Swappable to SQLCipher later.

```rust
// Source: ARCHITECTURE.md research
pub trait SessionRepository: Send + Sync {
    fn get_sessions(&self, query: &SessionQuery) -> Result<PaginatedResult<SessionMetadata>>;
    fn get_session(&self, id: &str) -> Result<Option<SessionDetail>>;
    fn upsert_session(&self, session: &SessionMetadata) -> Result<()>;
    fn get_events(&self, session_id: &str, cursor: Option<&str>, limit: usize)
        -> Result<PaginatedResult<TranscriptEvent>>;
}

pub struct SqliteSessionRepository {
    read_pool: r2d2::Pool<SqliteConnectionManager>,
    write_conn: Arc<Mutex<Connection>>,
}
```

### Pattern 2: Streaming JSONL Parser (Constant Memory)

**What:** BufReader + line-by-line. Track byte offsets. 10MB hard cap.
**When:** All transcript parsing.
**Why:** GB-scale files must not OOM.

```rust
// Source: ARCHITECTURE.md research
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

        // Hard cap: 10MB per line (D-03)
        if byte_len > 10 * 1024 * 1024 {
            self.current_offset += byte_len as u64;
            tracing::warn!(offset, byte_len, "skipping oversized line");
            return Ok(None); // skip, log warning
        }

        let entry: Entry = serde_json::from_str(self.line_buffer.trim_end())?;
        self.current_offset += byte_len as u64;
        Ok(Some((offset, byte_len, entry)))
    }
}
```

### Pattern 3: Batch Write with Dynamic Sizing

**What:** Accumulate events in Vec, flush when batch hits 4MB or 2000 entries.
**When:** Indexing (scan and re-index).
**Why:** Transaction batching is orders of magnitude faster than per-row inserts.

```rust
// Source: ARCHITECTURE.md research
struct WriteBatch {
    events: Vec<TranscriptEvent>,
    tool_calls: Vec<ToolCall>,
    estimated_bytes: usize,
}

const MAX_BATCH_SIZE: usize = 4 * 1024 * 1024; // 4MB (D-10)
const MAX_BATCH_ROWS: usize = 2000;

impl WriteBatch {
    fn should_flush(&self) -> bool {
        self.events.len() >= MAX_BATCH_ROWS ||
        self.estimated_bytes >= MAX_BATCH_SIZE
    }
}
```

### Pattern 4: Cursor-Based Pagination

**What:** Opaque base64 cursor from last item ID. No offset pagination.
**When:** Session list, timeline events, search results.
**Why:** Stable across inserts. O(limit) at any depth.

```sql
-- Source: ARCHITECTURE.md research
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

### Pattern 5: Incremental Scan with Bookmark

**What:** ScanBookmark tracks lastIndexedLine + fileHash. Re-scan resumes from bookmark.
**When:** All scans (full and incremental).
**Why:** Avoid re-parsing unchanged files. Detect mid-file appends.

```text
For each JSONL file:
  1. Check ScanBookmark for this file
  2. No bookmark -> parse from line 0
  3. Bookmark exists:
     a. Compare fileHash (first 64KB) + fileSize
     b. Same hash + same size -> skip
     c. Same hash + larger size -> resume from lastIndexedLine (append only)
     d. Different hash -> re-parse from line 0 (file modified)
```

### Pattern 6: jieba-rs Pre-tokenization for FTS5

**What:** jieba-rs tokenizes Chinese text into space-separated tokens in an auxiliary FTS5 column.
**When:** Indexing session content with Chinese text.
**Why:** Avoids complex C FFI for custom FTS5 tokenizer. unicode61 handles English; auxiliary column handles Chinese.

```rust
// Source: jieba-rs docs.rs API (verified)
use jieba_rs::Jieba;

// Singleton Jieba instance (dictionary loads once, ~10MB)
lazy_static! {
    static ref JIEBA: Jieba = Jieba::new();
}

fn tokenize_chinese(text: &str) -> String {
    let tokens = JIEBA.cut(text, false); // Vec<&str>
    tokens.join(" ")  // space-separated for FTS5
}
```

```sql
-- FTS5 table with dual-tokenizer strategy (D-05, D-06)
CREATE VIRTUAL TABLE session_fts USING fts5(
    sessionId,
    autoTitle,
    content_en,        -- unicode61 handles English
    content_zh,        -- pre-tokenized by jieba-rs (space-separated)
    filePath,
    toolNames,
    tokenize='unicode61'
);

-- Search queries both columns:
-- SELECT * FROM session_fts WHERE session_fts MATCH 'content_en:term OR content_zh:term';
```

### Pattern 7: TTY-Aware CLI Output

**What:** Detect if stdout is a TTY. Use console/indicatif for TTY, plain text otherwise.
**When:** All CLI output.
**Why:** Piped output (e.g., `ccmemo list | grep`) must not contain ANSI codes.

```rust
use console::Term;
use indicatif::ProgressBar;

let term = Term::stdout();
let is_tty = term.is_term();

if is_tty {
    let pb = ProgressBar::new(total_files as u64);
    pb.set_style(ProgressStyle::default_bar()
        .template("[{elapsed_precise}] {bar:40} {pos}/{len} {msg}").unwrap());
    // ... use pb during scan
    pb.finish();
} else {
    // plain text output, no progress bar
    println!("Scanning {} files...", total_files);
}
```

### Anti-Patterns to Avoid

- **Loading full JSONL into memory:** Use BufReader streaming. GB-scale files will OOM.
- **Offset-based pagination:** `OFFSET 10000` scans and discards rows. Use cursor-based.
- **Synchronous SQLite in async context:** rusqlite is sync. Use `spawn_blocking` when called from tokio. Not needed in Phase 1 (CLI is single-threaded sync) but required when Phase 2 adds axum.
- **SQL in service logic:** All SQL lives in storage/ module behind repository traits.
- **Naive sequential regex replace:** Each replace shifts offsets. Collect all match spans first, then apply in reverse order.
- **Single God Service:** Separate services with narrow responsibilities per component boundary diagram.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSONL parsing | Custom JSON line parser | claude-code-transcripts 0.1.11 | Handles all 26 Entry variants, round-trip validation, forward-compatible Unknown catch-all |
| Chinese word segmentation | Custom CJK tokenizer | jieba-rs 0.10.1 | 10MB embedded dictionary, HMM support, tfidf extraction. Pre-tokenization avoids FTS5 C FFI |
| SQLite FTS5 integration | Custom tokenizer C extension | Pre-tokenize + auxiliary column | Custom FTS5 tokenizer via rusqlite vtab is poorly documented and error-prone [VERIFIED: STATE.md blocker] |
| CLI argument parsing | Manual argv handling | clap 4.6 derive macros | Subcommands, help generation, shell completions, type-safe |
| Terminal colors | ANSI escape codes | console crate | Cross-platform, TTY detection, style builders |
| Progress bars | Manual percentage output | indicatif | Multi-progress, ETA, spinners, clean finish |
| SQLite connection pooling | Custom connection manager | r2d2 | Thread-safe pool, health checks, configurable size |
| TOML config parsing | Custom config parser | toml crate | De/serialize to structs, error reporting |
| File hashing for change detection | Custom hash implementation | sha2 crate | Standard SHA-256, constant-time comparison |
| Directory traversal | std::fs recursion | walkdir | Handles symlinks, depth limits, error tolerance |

**Key insight:** The claude-code-transcripts crate is young (0.1.x) but purpose-built. The Unknown variant provides forward compatibility when Claude Code adds new entry types. The spike in D-01 must verify that all currently observed Entry inner structs have the fields we need (especially UserEntry.content for auto-title, ToolUseEntry.tool_name/input for ToolCall table, etc.).

## Common Pitfalls

### Pitfall 1: SQLite WAL Locks Under Concurrent Access

**What goes wrong:** SQLITE_BUSY errors when scan worker holds write lock and API tries to write.
**Why it happens:** WAL allows concurrent reads + one writer, but busy_timeout defaults to 0 (immediate failure).
**How to avoid:** Set busy_timeout = 5000ms (D-08). Single Mutex<Connection> for writes. Separate r2d2 read pool.
**Warning signs:** SQLITE_BUSY in logs during concurrent operations. WAL file > 10MB.

### Pitfall 2: FTS5 Default Tokenizer Fails on Chinese (No Migration Path)

**What goes wrong:** unicode61 splits Chinese into individual characters. Multi-character word searches fail.
**Why it happens:** unicode61 is not segmentation-aware. Chinese has no spaces.
**How to avoid:** Pre-tokenize with jieba-rs into auxiliary column (D-05). Test Chinese search from day one.
**Warning signs:** Chinese searches only work for single characters. bm25 gives equal scores to all Chinese results.
**Critical:** Changing tokenizers requires DROP TABLE + full re-index. Must get this right at creation time.

### Pitfall 3: JSONL Streaming Breaks on Active Sessions

**What goes wrong:** Parser crashes on partial lines at EOF of files being actively written by Claude Code.
**Why it happens:** Last line may be incomplete -- session is mid-write.
**How to avoid:** Buffer incomplete lines (no trailing \n). Resume from byte offset on next scan. Mark as "pending."
**Warning signs:** Parse errors on last line of active session files. Session count changes between scans.

### Pitfall 4: rusqlite bundled-full Cross-Compilation Failures

**What goes wrong:** Build succeeds on dev machine but fails on CI -- cryptic cc crate errors.
**Why it happens:** bundled-full compiles SQLite C code. Needs target-specific C compiler.
**How to avoid:** Pin bundled-full as only SQLite feature. Set up CI cross-compilation from day one.
**Warning signs:** Build fails on CI but not locally. Error references cc/gcc not rusqlite.

### Pitfall 5: FTS5 Content Table Drift

**What goes wrong:** Search returns phantom rows pointing to deleted content.
**Why it happens:** FTS5 with external content does not auto-sync. Must use triggers or rebuild.
**How to avoid:** Prefer contentless FTS5 (content='') for initial impl. Retrieve full content by rowid from main table after FTS match.
**Warning signs:** Search results link to deleted sessions. integrity-check returns errors.

### Pitfall 6: Crash Dumps Leak Session Content

**What goes wrong:** Debug logging inadvertently logs full transcript content including API keys.
**Why it happens:** Rust's Debug derive prints entire struct contents.
**How to avoid:** Never derive Debug on transcript content structs. Custom Debug that truncates. Use tracing field-level redaction (D-21).
**Warning signs:** Log files contain API key patterns (sk-..., ghp_..., AKIA...).

## Code Examples

### SQLite Connection Setup with WAL + Pool

```rust
// Source: STACK.md + ARCHITECTURE.md patterns
use rusqlite::Connection;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use std::sync::{Arc, Mutex};
use std::time::Duration;

pub struct Database {
    read_pool: Pool<SqliteConnectionManager>,
    write_conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn open(db_path: &Path) -> Result<Self> {
        // Write connection (single, mutex-guarded)
        let write_conn = Connection::open(db_path)?;
        write_conn.pragma_update(None, "journal_mode", "WAL")?;
        write_conn.pragma_update(None, "synchronous", "NORMAL")?;
        write_conn.pragma_update(None, "cache_size", -64000)?;   // 64MB
        write_conn.pragma_update(None, "temp_store", "MEMORY")?;
        write_conn.pragma_update(None, "mmap_size", 268435456)?;  // 256MB
        write_conn.pragma_update(None, "foreign_keys", "ON")?;
        // Note: busy_timeout takes Duration in rusqlite 0.40
        write_conn.busy_timeout(Duration::from_millis(5000))?;

        // Read pool
        let manager = SqliteConnectionManager::file(db_path)
            .with_init(|conn| {
                conn.pragma_update(None, "journal_mode", "WAL")?;
                conn.pragma_update(None, "query_only", "ON")?;
                conn.pragma_update(None, "cache_size", -64000)?;
                conn.busy_timeout(Duration::from_millis(5000))?;
                Ok(())
            });
        let read_pool = Pool::builder()
            .max_size(4)
            .build(manager)?;

        Ok(Self {
            read_pool,
            write_conn: Arc::new(Mutex::new(write_conn)),
        })
    }
}
```

### Entry Type Mapping Spike (D-01)

```rust
// Source: claude-code-transcripts 0.1.11 docs.rs (verified 26 variants)
use claude_code_transcripts::Entry;

fn map_entry_to_domain(entry: Entry, offset: u64, byte_len: usize)
    -> Result<Option<IndexedEvent>>
{
    match entry {
        Entry::User(e) => {
            // Extract auto-title from first user message (D-05/SCAN-05)
            // e.content contains the message text
            Ok(Some(IndexedEvent::UserMessage { content: e.content, ... }))
        },
        Entry::Assistant(e) => {
            // e.content, e.model, e.usage (if present)
            Ok(Some(IndexedEvent::AssistantMessage { ... }))
        },
        Entry::System(e) => Ok(Some(IndexedEvent::SystemNote { ... })),
        Entry::Attachment(e) => Ok(Some(IndexedEvent::Attachment { ... })),
        Entry::Summary(e) => Ok(Some(IndexedEvent::Summary { ... })),
        Entry::ToolUse(e) => {
            // e.tool_name, e.tool_input -> ToolCall table
            Ok(Some(IndexedEvent::ToolCall { ... }))
        },
        Entry::ToolResult(e) => Ok(Some(IndexedEvent::ToolResult { ... })),
        Entry::AiTitle(e) => {
            // Use as session title hint
            Ok(Some(IndexedEvent::TitleHint { title: e.title }))
        },
        Entry::CustomTitle(e) => {
            // User-edited title, overrides auto-title
            Ok(Some(IndexedEvent::CustomTitle { title: e.title }))
        },
        Entry::Tag(e) => Ok(Some(IndexedEvent::Tag { tag: e.tag })),
        Entry::Unknown => {
            // Forward-compatible: log and skip
            tracing::debug!(offset, "skipping unknown entry type");
            Ok(None)
        },
        // Handle remaining 16 variants similarly...
        _ => {
            tracing::debug!(offset, "skipping unhandled entry type");
            Ok(None)
        }
    }
}
```

### jieba-rs Pre-tokenization Integration

```rust
// Source: jieba-rs 0.10.1 docs.rs (verified API)
use jieba_rs::Jieba;
use std::sync::LazyLock;

static JIEBA: LazyLock<Jieba> = LazyLock::new(Jieba::new);

/// Pre-tokenize Chinese text for FTS5 auxiliary column.
/// Returns space-separated tokens suitable for unicode61 tokenization.
pub fn tokenize_for_fts(text: &str) -> String {
    let words = JIEBA.cut(text, false);  // HMM=false for deterministic
    words.join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chinese_tokenization() {
        let result = tokenize_for_fts("错误处理机制");
        assert!(result.contains("错误"));
        assert!(result.contains("处理"));
        assert!(result.contains("机制"));
    }

    #[test]
    fn test_mixed_chinese_english() {
        let result = tokenize_for_fts("使用React框架开发");
        assert!(result.contains("React"));
        assert!(result.contains("使用"));
        assert!(result.contains("框架"));
    }
}
```

### Scan Command with Progress

```rust
// Source: D-15, D-16 patterns
use clap::Parser;
use console::Term;
use indicatif::{ProgressBar, ProgressStyle};

#[derive(Parser)]
pub struct ScanArgs {
    /// Force full re-scan (ignore bookmarks)
    #[arg(long)]
    pub full: bool,
}

pub fn run_scan(args: ScanArgs, db: &Database, config: &Config) -> Result<()> {
    let term = Term::stdout();
    let discovery = ProjectDiscovery::new(&config.claude_config_dir);

    // Discover files
    let files = discovery.discover_transcripts()?;
    if files.is_empty() {
        term.writeln("No transcript files found.")?;
        return Ok(());
    }

    let is_tty = term.is_term();
    let pb = if is_tty {
        let pb = ProgressBar::new(files.len() as u64);
        pb.set_style(ProgressStyle::default_bar()
            .template("[{elapsed_precise}] {bar:40} {pos}/{len} {msg}").unwrap());
        Some(pb)
    } else {
        println!("Scanning {} files...", files.len());
        None
    };

    let mut indexer = SessionIndexer::new(db);
    for (i, file) in files.iter().enumerate() {
        if let Some(ref pb) = pb {
            pb.set_message(file.file_name().unwrap_or_default().to_string_lossy());
            pb.set_position((i + 1) as u64);
        }
        indexer.index_file(file, args.full)?;
    }

    if let Some(pb) = pb {
        pb.finish_with_message("done");
    }

    let stats = indexer.stats();
    println!("Indexed {} sessions, {} events in {}ms",
        stats.sessions, stats.events, stats.elapsed_ms);
    Ok(())
}
```

### Cursor-Based Pagination Query

```rust
// Source: ARCHITECTURE.md pattern
use base64::{engine::general_purpose::STANDARD as b64, Engine};

#[derive(Serialize, Deserialize)]
pub struct PaginatedResult<T> {
    pub items: Vec<T>,
    pub next_cursor: Option<String>,
    pub has_more: bool,
}

fn decode_cursor(cursor: &str) -> Result<(String, String)> {
    let json = b64.decode(cursor)?;
    let (id, ts): (String, String) = serde_json::from_slice(&json)?;
    Ok((id, ts))
}

fn encode_cursor(id: &str, ts: &str) -> String {
    let json = serde_json::to_string(&(id, ts)).unwrap();
    b64.encode(json)
}

impl SqliteSessionRepository {
    pub fn get_sessions(&self, query: &SessionQuery) -> Result<PaginatedResult<SessionMetadata>> {
        let conn = self.read_pool.get()?;
        let limit = query.limit.unwrap_or(50);

        let mut sql = "SELECT * FROM SessionMetadata".to_string();
        if let Some(ref cursor) = query.cursor {
            let (id, ts) = decode_cursor(cursor)?;
            sql.push_str(&format!(
                " WHERE startedAt < '{}' OR (startedAt = '{}' AND sessionId < '{}')",
                ts, ts, id
            ));
        }
        sql.push_str(&format!(" ORDER BY startedAt DESC, sessionId DESC LIMIT {}", limit + 1));

        // If results.len() > limit: has_more = true, next_cursor = encode(last.id, last.startedAt)
        // ... execute and map
        todo!()
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| rusqlite 0.31 with bundled feature | rusqlite 0.40 with bundled-full | 2024-2025 | bundled-full required for FTS5; bundled alone lacks it |
| axum 0.7 | axum 0.8.9 | 2025 | 0.7 is EOL. Breaking body type changes. |
| thiserror 1.x | thiserror 2.0 | 2025 | 2.0 is backwards compatible but has cleaner derive |
| r2d2-sqlite 0.24 | r2d2_sqlite (current) | Ongoing | Must match rusqlite version |
| notify 6.x | notify 8.2 | 2025 | 8.x has Config builder, EventKindMask filtering |

**Deprecated/outdated:**
- rusqlite `bundled` (without `-full`): Lacks FTS5. Must use `bundled-full`.
- axum 0.7: EOL. Must use 0.8.x.
- log crate: Use tracing instead. Structured logging with spans.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | claude-code-transcripts Entry inner structs have the fields we need (e.g., UserEntry.content, ToolUseEntry.tool_name) | Code Examples | Spike (D-01) required. If fields missing, need custom parser fallback. |
| A2 | r2d2-sqlite crate version compatible with rusqlite 0.40 | Standard Stack | Need to verify exact r2d2-sqlite version; API may differ between versions. |
| A3 | jieba-rs cut() produces sufficient quality for FTS5 search on technical terms | Pattern 6 | Technical jargon may not segment perfectly; custom dictionary entries may be needed. |
| A4 | walkdir 2.x is the right choice vs ignore crate | Standard Stack | ignore respects .gitignore (may skip desired dirs); walkdir is simpler. Low risk. |
| A5 | cargo workspace with crates/ccmemo-core + crates/ccmemo-cli is the right layout | Project Structure | Could also use src/lib.rs + src/main.rs in single crate. Workspace provides cleaner separation. |

## Open Questions

1. **r2d2-sqlite version compatibility with rusqlite 0.40**
   - What we know: rusqlite 0.40 is verified. r2d2-sqlite must match.
   - What's unclear: Exact r2d2-sqlite version that supports rusqlite 0.40.
   - Recommendation: Check r2d2-sqlite crate docs or use rusqlite's own Connection manager if r2d2 incompatibility arises. Alternative: use `deadpool-sqlite` or a manual `Vec<Connection>` pool.

2. **claude-code-transcripts Entry inner struct field names**
   - What we know: Entry enum has 26 variants with typed inner structs.
   - What's unclear: Exact field names of each inner struct (e.g., does UserEntry have `.content` or `.message`?).
   - Recommendation: D-01 spike must deserialize a real JSONL file and print all field names. This is the first implementation task.

3. **Performance targets validation**
   - What we know: CLAUDE.md specifies 1000 msgs < 5s index, 10K search < 300ms.
   - What's unclear: Whether batch writes + WAL achieve this without tuning.
   - Recommendation: Include benchmark in Wave 0 tests. Adjust batch size and PRAGMA if needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Rust toolchain | All Rust code | -- | -- | -- |
| cargo | Build system | -- | -- | -- |
| SQLite | rusqlite bundled-full | N/A (bundled) | N/A | N/A |
| C compiler (cc) | rusqlite bundled-full build | -- | -- | -- |

**Missing dependencies with no fallback:**
- Rust toolchain (rustc + cargo): Required to build any Rust code. Must be installed before implementation begins.
- C compiler: Required by rusqlite bundled-full to compile SQLite C code. Must be available on build machine.

**Note:** The target machine (this machine) does not have Rust toolchain installed. The planner should include a Rust toolchain installation step as the first task in Wave 0, or note that implementation must happen on a machine with Rust installed.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local-only tool, no user auth (API auth is Phase 2) |
| V3 Session Management | no | N/A for Phase 1 |
| V4 Access Control | no | Local-only single-user tool |
| V5 Input Validation | yes | serde_json deserialization validates JSON structure; parameterized SQL queries via rusqlite |
| V6 Cryptography | yes | sha2 for file hash verification; no encryption in Phase 1 |

### Known Threat Patterns for Rust + SQLite

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | rusqlite parameterized queries (params! macro). Never format SQL strings. |
| Path traversal | Tampering | Validate paths are under ~/.claude/projects/. Canonicalize with std::fs::canonicalize. |
| Malicious JSONL (OOM) | Denial of Service | 10MB line hard cap (D-03). Streaming parser never loads full file. |
| Log content leakage | Information Disclosure | Custom Debug impls on transcript structs. tracing field-level redaction (D-21). |
| Env var secret exposure | Information Disclosure | std::env::remove_var after reading API keys (D-20). |

## Sources

### Primary (HIGH confidence)
- docs.rs/rusqlite-0.40.0 -- bundled-full feature, FTS5, WAL mode, busy_timeout takes Duration
- docs.rs/claude-code-transcripts-0.1.11 -- Entry enum (26 variants), check_transcript, Unknown catch-all
- docs.rs/jieba-rs-0.10.1 -- Jieba::new(), cut() returns Vec<&str>, Token.word, tfidf feature
- docs.rs/clap-4.6.1 -- derive macros, subcommand support
- docs.rs/thiserror-2.0.18 -- derive macro for Error trait
- .planning/research/STACK.md -- Full compatibility matrix, verified versions
- .planning/research/ARCHITECTURE.md -- Schema DDL, repository traits, data flow diagrams
- .planning/research/PITFALLS.md -- 10 critical pitfalls with Phase 1 mapping
- SQLite official docs -- WAL mode, FTS5 extension, busy_timeout

### Secondary (MEDIUM confidence)
- .planning/research/SUMMARY.md -- Consolidated findings
- CCMemo-设计方案.md -- Complete design specification
- r2d2-sqlite crate -- Connection pooling for rusqlite (version compatibility needs verification)

### Tertiary (LOW confidence)
- Claude Code path encoding bug #40946 -- Behavior inferred from issue description; not reproduced
- claude-code-transcripts inner struct field names -- Assumed based on Entry variant names; spike required

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core crate versions verified via docs.rs. Supporting crates are well-known.
- Architecture: HIGH - Three-layer pattern is standard Rust. Schema DDL is detailed and verified.
- Pitfalls: HIGH - SQLite WAL/FTS5 pitfalls are well-documented. JSONL streaming is a known domain.
- Entry type mapping: MEDIUM - Entry enum verified but inner struct field names require spike (D-01).

**Research date:** 2026-05-29
**Valid until:** 2026-06-29 (30 days - stable Rust ecosystem)
