# CCMemo - Claude Code Session Memory Manager

Turns JSONL transcripts from Claude Code into searchable, reusable engineering assets.

## Build & Test

```bash
# Backend
cargo build
cargo test
cargo clippy -- -D warnings

# Frontend
cd frontend && npm install && npm run build

# Full release (frontend must be built first for rust-embed)
cd frontend && npm run build && cd .. && cargo build --release
```

## Key Architecture

- **ccmemo-core**: Library crate with domain types, SQLite storage, JSONL parser, services, Axum web server
- **ccmemo-cli**: CLI binary with clap derive commands + embedded React UI
- **frontend**: React/TypeScript/Vite/Tailwind SPA, embedded via rust-embed into single binary

## Important Patterns

- rusqlite 0.32 with explicit features (NOT `bundled-full` due to `extra_check` breaking PRAGMA statements)
- SQLite WAL mode via `pragma_update_and_check` for WAL PRAGMA
- FTS5 virtual table with `execute_batch` for inserts (avoids "returned results" errors)
- Connection pooling with r2d2 for reads, single Mutex<Connection> for writes
- UTF-8 safe truncation using `.chars()` not byte slicing
- Rust 2024 edition: `set_var` requires unsafe block, `LazyLock` replaces `lazy_static!`
- rust-embed 8.x for embedding frontend dist/ into binary (path relative to crate: `../../frontend/dist/`)
- Axum 0.8 with tower-http for CORS and tracing
- Tailwind CSS v4 with @theme directive for design tokens
