# CCMemo - Claude Code Session Memory Manager

Turns JSONL transcripts from Claude Code into searchable, reusable engineering assets.

## Build & Test

```bash
cargo build
cargo test
```

## Key Architecture

- **ccmemo-core**: Library crate with domain types, SQLite storage, JSONL parser, services
- **ccmemo-cli**: CLI binary with clap derive commands

## Important Patterns

- rusqlite 0.32 with explicit features (NOT `bundled-full` due to `extra_check` breaking PRAGMA statements)
- SQLite WAL mode via `pragma_update_and_check` for WAL PRAGMA
- FTS5 virtual table with `execute_batch` for inserts (avoids "returned results" errors)
- Connection pooling with r2d2 for reads, single Mutex<Connection> for writes
- UTF-8 safe truncation using `.chars()` not byte slicing
- Rust 2024 edition: `set_var` requires unsafe block, `LazyLock` replaces `lazy_static!`
