# Walking Skeleton — CCMemo

**Phase:** 1
**Generated:** 2026-05-29

## Capability Proven End-to-End

A developer runs `ccmemo demo` to import 3 synthetic sessions into SQLite, then runs `ccmemo list` to see them in a terminal table, and runs `ccmemo show <id>` to inspect one session's timeline events -- proving the full Rust binary -> JSONL parsing -> SQLite storage -> CLI output pipeline works.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | Rust 2024 edition | Performance, safety, single-binary distribution. PROJECT.md constraint. |
| Build system | Cargo workspace with crates/ccmemo-core + crates/ccmemo-cli | D-26: clean separation of library and binary. Core contains all service/storage logic; CLI is a thin wrapper. |
| Data layer | SQLite via rusqlite 0.40 (bundled-full) with WAL mode | D-08/D-09: Static linking with FTS5. No system SQLite dependency. WAL for concurrent read/write. |
| Connection management | r2d2 pool for reads + Mutex<Connection> for writes | D-08: Standard pattern for sync SQLite. busy_timeout=5000ms prevents SQLITE_BUSY. |
| CLI framework | clap 4.6 with derive macros | D-16: Type-safe subcommands, auto-generated help, shell completions. |
| Terminal output | console + indicatif with TTY detection | D-15: Rich output when interactive, plain text when piped. |
| Error handling | thiserror for library, anyhow for CLI | D-19: Typed errors in core, flexible user-friendly errors in CLI. |
| JSONL parsing | claude-code-transcripts 0.1.11 crate | D-01: Typed Entry enum with 26 variants. Spike first to verify field coverage. |
| Chinese search | jieba-rs 0.10.1 pre-tokenization into FTS5 auxiliary column | D-05/D-06: Avoids complex C FFI for custom tokenizer. ~10MB binary increase accepted (D-07). |
| Configuration | TOML via toml crate. Priority: CLI > env > .ccmemo.toml > XDG config > defaults | D-22/D-23: Standard Rust config pattern. |
| Logging | tracing + tracing-subscriber with field-level redaction | D-21: Structured logging. Never log raw content or API keys. |
| Distribution | Single binary (cargo-dist for releases) | PROJECT.md constraint: CLI as single binary. |

## Stack Touched in Phase 1

- [x] Project scaffold (Cargo workspace, core + CLI crates, dependencies)
- [x] Storage layer (SQLite with WAL, 6-table schema, migrations, FTS5 virtual table, connection pool)
- [x] JSONL parsing (claude-code-transcripts Entry spike, streaming BufReader, byte offset tracking)
- [x] CLI commands (scan, list, show, resume, export, demo, config, doctor -- at minimum scan/list/show/demo functional)
- [x] Chinese tokenization (jieba-rs pre-tokenization wired into indexer)
- [x] Configuration (TOML config chain with XDG defaults)
- [x] Demo data (3 synthetic JSONL sessions embedded in binary)

## Out of Scope (Deferred to Later Phases)

- Web UI / Axum HTTP server (Phase 2-3)
- Bearer token authentication, CORS, Host validation (Phase 2)
- AI-powered summarization and analysis (Phase 4)
- Skill Forge pipeline (Phase 4)
- Redaction / safe export with 12-rule sanitization (Phase 4)
- File watching with notify crate (post-v1 enhancement)
- Tauri desktop packaging (v0.4+)
- cross-compilation CI via cargo-dist (Phase 4 polish)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Web Server + API -- Axum HTTP server with security middleware exposing all service operations
- Phase 3: React Web UI + Search -- Visual session browsing, full-text search, responsive layout, theme support
- Phase 4: Export + AI Analysis + Skill Forge -- Session export with sanitization, AI-powered document generation, Skill extraction
