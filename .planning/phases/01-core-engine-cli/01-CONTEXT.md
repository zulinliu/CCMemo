# Phase 1: Core Engine + CLI - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

## Phase Boundary

Build the Rust core engine that scans ~/.claude/projects/ for Claude Code transcript JSONL files, parses them via claude-code-transcripts crate, indexes sessions and events into a 6-table SQLite database with WAL mode and FTS5, and provides CLI commands (scan/list/show/resume/export/demo/config/doctor) for users to interact with their session data from the terminal.

This phase delivers: data ingestion pipeline (scanner + parser + indexer), storage layer (SQLite schema + migrations + connection management), and CLI interface (clap with all subcommands). It does NOT include: Web UI, AI analysis, Skill Forge, or network API.

## Implementation Decisions

### JSONL Parser & Transcript Handling
- **D-01:** Use claude-code-transcripts 0.1.11 crate as primary parser. Do a spike in the first plan to verify its Entry enum covers all observed transcript types (including queue-operation, attachment variants, hook_success, hook_additional_context). If gaps found, implement a custom streaming parser as fallback.
- **D-02:** Streaming parser architecture: BufReader + line-by-line processing. Track byte offsets for each event. Handle partial lines at EOF by buffering incomplete lines across reads.
- **D-03:** Single JSON line hard limit of 10MB. Lines exceeding this are logged and skipped (security measure against malicious transcripts).
- **D-04:** Path discovery uses directory scanning of ~/.claude/projects/ subdirectories + cross-validation with JSONL content's project path field. Never reverse-encode paths (bug #40946).

### FTS5 & Chinese Search Foundation
- **D-05:** Use pre-tokenization approach for Chinese text: jieba-rs 0.10.1 tokenizes text into space-separated tokens, stored in an auxiliary FTS5 column. This avoids complex C FFI shim for custom FTS5 tokenizer registration.
- **D-06:** FTS5 table uses unicode61 tokenizer for English + pre-tokenized jieba-rs column for Chinese. Search queries both columns.
- **D-07:** jieba-rs dictionary adds ~10MB to binary size. Accept this trade-off for Chinese search support.

### Storage Layer
- **D-08:** SQLite connection management: single Mutex<Connection> for writes, separate read-only connections via r2d2 connection pool. Set busy_timeout = 5000ms.
- **D-09:** WAL mode enabled at connection creation via PRAGMA. Also set: synchronous=NORMAL, cache_size=-64000 (64MB), temp_store=MEMORY.
- **D-10:** Batch writes in transactions: 4MB or 2000 rows per batch (whichever limit hits first).
- **D-11:** 6-table schema exactly as designed: ProjectIdentity, SessionMetadata, TranscriptEvent, ToolCall, Summary, ScanBookmark.
- **D-12:** TranscriptEvent.fileOffset + TranscriptEvent.byteLength are mandatory for O(1) seek to raw JSON in long sessions.
- **D-13:** ScanBookmark table tracks (filePath, sessionId, lastIndexedLine, fileHash, lastScannedAt) for incremental re-scan.

### Session Status Detection
- **D-14:** Status判定规则：Active (last event < 2h + last is assistant), Completed (> 7d no activity or user marked), Interrupted (last is user message with no assistant reply), Unrecoverable (project path gone + CLI unavailable).

### CLI Design
- **D-15:** CLI output uses rich terminal formatting: console crate for colored output, indicatif for progress bars during scan. Fallback to plain text when stdout is not a TTY.
- **D-16:** clap 4.6 with derive macros. Subcommands: scan, list, show, resume, export, serve, demo, config, doctor.
- **D-17:** `ccmemo list` default output: table with columns (ID short-code, Title, Project, Branch, Status, Last Updated). Support --format json for machine-readable output.
- **D-18:** `ccmemo show` displays full session metadata + condensed timeline. Use pager (less) for long output.

### Error Handling
- **D-19:** thiserror for library/service layer errors (typed, structured). anyhow for CLI top-level error handling (flexible, user-friendly messages).

### Security
- **D-20:** API keys read from environment variables (CCMEMO_AI_API_KEY). After reading, call std::env::remove_var to clear from process environment.
- **D-21:** Log sanitization: never log raw transcript content or API keys. Only log session IDs, file paths, and error types.

### Configuration
- **D-22:** TOML config format. Priority: CLI args > env vars (CCMEMO_*) > .ccmemo.toml (project-local) > config.toml (XDG config dir) > defaults.
- **D-23:** Key config values: claude_config_dir (default: ~/.claude), db_path (default: ~/.local/share/ccmemo/ccmemo.db), export_dir (default: ~/ccmemo-exports).

### Demo Data
- **D-24:** `ccmemo demo` imports 3 synthetic JSONL sessions: (1) Bug fix session (diagnosis→fix→verify), (2) Requirements discussion (clarifying questions→decisions), (3) Tech research (exploration→comparison→recommendation).
- **D-25:** Demo sessions use realistic but synthetic data. No real user data or API keys.

### Project Structure
- **D-26:** Cargo workspace with crates: ccmemo-core (library), ccmemo-cli (binary). Core crate contains all service and storage logic; CLI crate is a thin wrapper.
- **D-27:** Frontend will be a separate directory (web/) with its own package.json, built into static assets that rust-embed compiles into the binary (in Phase 3).

### Claude's Discretion
- Exact module file organization within ccmemo-core (splitting services into files)
- Specific error type variants and message wording
- Testing granularity and test file organization
- Migration versioning scheme
- Progress reporting detail level during scan

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Document
- `CCMemo-设计方案.md` — Complete design specification with data models, API design, security rules, and version roadmap. This is the authoritative source for all implementation decisions.

### Research
- `.planning/research/STACK.md` — Verified crate versions, compatibility matrix, build tooling
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow, schema design, module structure, build order
- `.planning/research/PITFALLS.md` — SQLite WAL pitfalls, FTS5 tokenizer traps, cross-compilation issues, security concerns
- `.planning/research/SUMMARY.md` — Consolidated research findings with phase recommendations

### Project Context
- `.planning/PROJECT.md` — Project goals, constraints, key decisions
- `.planning/REQUIREMENTS.md` — All v1 requirements with REQ-IDs (SCAN-*, STOR-*, CLIC-* map to Phase 1)
- `.planning/ROADMAP.md` — Phase 1 definition with success criteria and plan breakdown

## Existing Code Insights

### Reusable Assets
None — greenfield project.

### Established Patterns
None — this phase establishes the patterns.

### Integration Points
- Phase 2 (Web API) will use the service layer traits defined here
- Phase 3 (React UI) will consume the API endpoints built on this storage layer
- Phase 4 (AI + Skills) will use the export and session data access patterns

## Specific Ideas

- Auto-title generation: extract first user message, strip file paths and commands, clean to readable title (max 50 chars)
- `ccmemo doctor` command: checks Claude config dir exists, verifies SQLite can create DB, checks disk space, reports transcript count
- Scan progress should show: files found, events indexed, current file being processed, elapsed time, estimated remaining

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 1-Core Engine + CLI*
*Context gathered: 2026-05-29*
