# Stack Research

**Domain:** Rust CLI + local Web UI tool for AI session management
**Researched:** 2026-05-29
**Confidence:** HIGH

## Recommended Stack

### Core Technologies (Rust Backend)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Rust | 2024 edition | Core language | Performance, safety, single-binary distribution. 2024 edition for latest idioms. |
| tokio | 1.52 | Async runtime | Required by axum. Full-featured (macros, rt-multi-thread, fs, sync). The only async runtime axum supports. |
| axum | 0.8.9 | HTTP server / local API | Macro-free routing, tower middleware ecosystem, State extractor for sharing DB handles. Confirmed at 0.8.9 on docs.rs. |
| rusqlite | 0.40.0 | SQLite wrapper | Ergonomic SQLite bindings with `bundled-full` feature to statically link SQLite with FTS5 enabled. No system SQLite dependency. |
| clap | 4.6.1 | CLI argument parser | Derive macros for subcommand structure (scan/list/show/resume/export/summarize/skill/serve/demo). Auto-generated help, shell completions. |
| serde + serde_json | 1.0.228 / 1.0.150 | Serialization | JSON deserialization for JSONL parsing, API request/response. Required by claude-code-transcripts. |
| claude-code-transcripts | 0.1.11 | JSONL transcript parser | Typed parser for Claude Code JSONL. Exposes `Entry` enum variants covering user, assistant, system, summary, tool uses, tool results, usage blocks. Includes round-trip validator for schema drift detection. Dual-licensed MIT OR Apache-2.0. |

### Database Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| rusqlite (bundled-full) | 0.40.0 | SQLite with all features | `bundled-full` statically links SQLite 3.x with FTS5, session, window functions, and all compile-time options enabled. Zero external dependency. |
| jieba-rs | 0.10.1 | Chinese word segmentation | Pure Rust implementation of jieba. Required for FTS5 tokenization of Chinese content. Supports `tfidf` and `textrank` keyword extraction features. Default dictionary embedded. Used as custom FTS5 tokenizer via rusqlite's `functions` feature. |

### Web Server / Frontend Serving

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| tower-http | 0.6.11 | HTTP middleware | `ServeDir` with `fallback()` for SPA routing. CORS, compression, trace, timeout middleware. Part of tower ecosystem that axum is built on. |
| rust-embed | 8.11.0 | Embed static assets in binary | Embed the Vite-built React frontend into the Rust binary at compile time. `#[derive(Embed)]` on a folder. Zero runtime file dependency -- single binary distribution. |
| tokio (fs, sync features) | 1.52 | Async file I/O | File watching for incremental scan, async FS operations for non-blocking I/O. |

### AI Provider Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| reqwest | 0.13.4 | HTTP client | Async HTTP client with JSON support. Used for Claude API calls (summarization, analysis, skill generation). Pluggable adapter pattern allows future providers. |

### CLI & System Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| notify | 8.2.0 | File system watcher | `RecommendedWatcher` for watching `~/.claude/projects/` for new/modified JSONL files. Enables incremental scan on active sessions. Cross-platform. |
| fs4 | 1.1.0 | File locking | Cross-platform file locking for safe concurrent read of JSONL files being written by Claude Code. Windows `FILE_SHARE_READ`, POSIX advisory locks. |
| chrono | 0.4.44 | Date/time handling | Session timestamps, time-based state determination (2h/7d thresholds). Serde integration. |
| uuid | 1.23.2 | Session ID generation | For internal session tracking. v4 for random IDs. |
| tracing + tracing-subscriber | 0.1.44 / 0.3.23 | Structured logging | Instrumentation for CLI and server. Structured spans for request tracing. Replaces log/println debugging. |
| thiserror | 2.0.18 | Error type derivation | Derive `std::error::Error` with minimal boilerplate. Used for all crate-level error types. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| anyhow | 1.0 | Top-level error handling | Application-level error propagation in main.rs and CLI command handlers. Not for library code. |
| percent-encoding | 2.x | URL decoding | Decoding the `~/.claude/projects/` path encoding for display. |
| regex | 1.x | Pattern matching | API key/credential detection in the 12-rule sanitizer. |
| sha2 | 0.10 | Hashing | Skill file hash verification during installation. |

## Recommended Cargo.toml Structure

```toml
[package]
name = "ccmemo"
version = "0.1.0"
edition = "2024"
license = "Apache-2.0"

[dependencies]
# CLI
clap = { version = "4.6", features = ["derive"] }

# Async runtime
tokio = { version = "1.52", features = ["full"] }

# Web server
axum = "0.8.9"
tower-http = { version = "0.6.11", features = ["fs", "cors", "compression-gzip", "trace"] }

# Database
rusqlite = { version = "0.40", features = ["bundled-full", "hooks"] }

# JSONL parsing
claude-code-transcripts = "0.1.11"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Chinese text processing
jieba-rs = { version = "0.10", features = ["tfidf"] }

# Embed frontend
rust-embed = "8.11"

# HTTP client (AI provider)
reqwest = { version = "0.13", features = ["json"] }

# File watching
notify = "8.2"
fs4 = "1.1"

# Utilities
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.23", features = ["v4"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
thiserror = "2.0"
anyhow = "1.0"
regex = "1"
percent-encoding = "2"
sha2 = "0.10"

[dev-dependencies]
assert_cmd = "2"
assert_fs = "1"
tempfile = "3"
```

## Frontend Stack

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.x | UI framework | Component model, ecosystem. Required for react-virtuoso virtual scrolling. |
| TypeScript | 5.x | Type safety | Compile-time type checking. All frontend code in TS. |
| Vite | 6.x | Build tool | Fast HMR in dev, optimized production builds. Outputs to `dist/` for rust-embed to consume. |
| Tailwind CSS | 4.x | Utility-first CSS | Rapid styling, responsive breakpoints (1280px/1024px), dark/light theme via CSS custom properties. |
| react-virtuoso | 4.x | Virtual scrolling | Handles 500+ event sessions with dynamic heights. Critical for performance. |
| react-router | 7.x | Client-side routing | SPA routing for session list, session detail, search views. |

## Build & Distribution

| Tool | Purpose | Notes |
|------|---------|-------|
| cargo-dist (dist) | Release automation | Builds cross-platform binaries. Generates GitHub Actions CI. Supports homebrew, npm, and shell installers. |
| cross or cargo-zigbuild | Cross-compilation | dist transparently uses cargo-zigbuild for Linux targets and cargo-xwin for Windows MSVC targets. |
| Vite build | Frontend production build | Output to `frontend/dist/`. rust-embed includes at compile time. |

### Build Pipeline

```text
1. cd frontend && npm run build        # Vite outputs to frontend/dist/
2. cargo build --release               # rust-embed embeds frontend/dist/ at compile time
3. Single binary contains both Rust backend + React frontend
```

### cargo-dist Configuration

```toml
[profile.dist]
inherits = "release"
lto = "thin"

[workspace.metadata.dist]
cargo-dist-version = "0.28"
ci = ["github"]
installers = ["shell", "homebrew"]
targets = [
    "x86_64-unknown-linux-gnu",
    "aarch64-unknown-linux-gnu",
    "x86_64-apple-darwin",
    "aarch64-apple-darwin",
    "x86_64-pc-windows-msvc",
]
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| HTTP server | axum 0.8.9 | actix-web 4.x | If you need Actix's built-in actor system or are already invested in the actix ecosystem. axum's tower integration is superior for middleware composition. |
| HTTP server | axum 0.8.9 | warp 0.3.x | If you prefer filter-based routing. warp's filter composition is powerful but has a steeper learning curve. axum's extractors are more ergonomic. |
| SQLite | rusqlite 0.40 | sqlx 0.8 | If you need async database access with connection pooling for PostgreSQL/MySQL too. For pure SQLite, rusqlite is simpler and has better FTS5 support. sqlx adds async overhead with no benefit for a local single-user tool. |
| Chinese tokenization | jieba-rs 0.10 | Lindera | If you also need Japanese/Korean tokenization. jieba-rs is Chinese-only but more mature for Chinese specifically. |
| Frontend embedding | rust-embed 8.11 | include_dir | include_dir has similar functionality. rust-embed has a simpler API and better axum integration via `tower_http::services::ServeDir`. |
| File watching | notify 8.2 | inotify (Linux-only) | If targeting Linux only. notify provides cross-platform abstraction with `RecommendedWatcher`. Always prefer notify. |
| CLI | clap 4.6 | lexopt / pico-args | If binary size is critical (< 1MB). clap 4.x is already lean. For a tool of this complexity with 9 subcommands, clap's derive macros are worth the tradeoff. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| sqlx for SQLite | Adds async complexity and tokio runtime dependency for a local single-user database. rusqlite with `bundled-full` is simpler, synchronous, and has direct FTS5 support. | rusqlite 0.40 with `bundled-full` |
| diesel ORM | Heavy abstraction over SQLite. Adds compile-time schema checking overhead. FTS5 virtual tables are not well-supported. | rusqlite with raw SQL for FTS5 |
| log crate | `log` is unstructured. `tracing` provides spans, structured events, and integrates with tower-http tracing middleware. | tracing 0.1 + tracing-subscriber 0.3 |
| reqwest blocking client | CCMemo uses tokio runtime throughout. Blocking client defeats the purpose. | reqwest async client |
| Tauri v2 (for v0.1) | Out of scope per PROJECT.md. v0.4+ consideration. Adds complexity to initial development. | Axum local web server + browser |
| system SQLite | Requires users to have SQLite installed with FTS5 compiled in. `bundled-full` statically links everything. | rusqlite `bundled-full` feature |
| actix-web | axum integrates natively with tower/tower-http. actix has its own middleware system. tower-http's `ServeDir` is purpose-built for SPA serving. | axum 0.8.9 + tower-http 0.6.11 |

## Key Architecture Patterns

### Axum + React SPA Serving Pattern

```rust
use axum::{Router, routing::get};
use rust_embed::Embed;
use tower_http::services::ServeDir;

#[derive(Embed)]
#[folder = "frontend/dist/"]
struct Assets;

// API routes on /api/*
let api_routes = Router::new()
    .route("/api/sessions", get(list_sessions))
    .route("/api/sessions/:id", get(get_session))
    .route("/api/search", get(search));

// Static files from embedded assets, SPA fallback to index.html
let app = Router::new()
    .merge(api_routes)
    .fallback_service(static_files_service());
```

### rusqlite FTS5 Pattern

```rust
use rusqlite::{Connection, params};

// Enable WAL mode for concurrent read/write
let conn = Connection::open("ccmemo.db")?;
conn.pragma_update(None, "journal_mode", "WAL")?;
conn.pragma_update(None, "foreign_keys", "ON")?;

// Create FTS5 virtual table
conn.execute_batch(
    "CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
        title,
        content,
        project_path,
        tokenize='unicode61'
    )"
)?;

// For Chinese support: register jieba as custom tokenizer
// via rusqlite's create_module / vtab feature,
// or use a simpler approach: pre-tokenize with jieba-rs
// and insert space-separated tokens into an auxiliary column
```

### FTS5 Chinese Strategy

The simplest reliable approach for Chinese FTS5:

1. Use `unicode61` tokenizer as the default (handles English and basic CJK)
2. For Chinese content, pre-tokenize with `jieba-rs` and store space-separated tokens in a dedicated column
3. This avoids the complexity of implementing a custom SQLite tokenizer in Rust via rusqlite's vtab
4. Alternative: register a custom FTS5 tokenizer via rusqlite's `vtab` feature, but this is significantly more complex and error-prone

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| axum 0.8.9 | tower 0.5.2, tower-http 0.6.x | axum 0.8 requires tower 0.5+. tower-http 0.6 is the matching version. |
| axum 0.8.9 | tokio 1.44+ | axum 0.8 requires tokio >=1.44. tokio 1.52 is well within range. |
| rusqlite 0.40 | bundled-full feature | Statically links SQLite 3.x with all compile-time extensions including FTS5. No system dependency. |
| claude-code-transcripts 0.1.11 | serde + serde_json | Depends on serde for Entry deserialization. serde 1.0.228 and serde_json 1.0.150 are compatible. |
| reqwest 0.13 | tokio 1.x | Uses tokio as async runtime. Compatible with tokio 1.52. |
| notify 8.2 | tokio | notify 8.x provides both sync and async interfaces. Use sync channel with tokio::task::spawn_blocking. |
| thiserror 2.0 | Any Rust edition | thiserror 2.0 is backwards compatible. Can coexist with anyhow 1.0. |
| jieba-rs 0.10 | Default dictionary embedded | `default-dict` feature enabled by default. `tfidf` feature needed for keyword extraction. |

## Critical Version Notes

1. **axum 0.8.x** is the current stable line. axum 0.7 is EOL. Must use 0.8.x for ongoing support. The upgrade from 0.7 to 0.8 had breaking changes in body types (moved to `http-body-util`).

2. **rusqlite 0.40** with `bundled-full` is the correct feature. Do NOT use `bundled` alone -- it lacks FTS5. Do NOT use `load_extension` to load FTS5 at runtime -- `bundled-full` compiles it in.

3. **claude-code-transcripts 0.1.11** is a young crate (0.1.x). API may change. The `Entry` enum covers current Claude Code transcript types. Use the `check_transcript` round-trip validator during development to catch schema drift when Claude Code adds new fields.

4. **jieba-rs 0.10.1** embeds its dictionary by default. The dictionary loads at first use. For FTS5 integration, create a `Jieba` instance once and reuse it (it is `Send + Sync`).

5. **notify 8.2** has a `Config` builder with `EventKindMask` filtering. Use `EventKindMask::CORE` to watch only create/modify/remove events, ignoring access events.

## Sources

- docs.rs/rusqlite-0.40.0 -- verified bundled-full feature, FTS5, WAL mode, hooks feature for wal_hook
- docs.rs/axum-0.8.9 -- verified tower 0.5.2 dependency, tower-http 0.6.8 dependency, tokio 1.44+
- docs.rs/clap-4.6.1 -- verified derive macros, subcommand support
- docs.rs/claude-code-transcripts-0.1.11 -- verified Entry enum, check_transcript, dual-license MIT OR Apache-2.0
- docs.rs/jieba-rs-0.10.1 -- verified Jieba struct, Token type, tfidf feature
- docs.rs/tower-http-0.6.11 -- verified ServeDir with fallback for SPA
- docs.rs/rust-embed-8.11.0 -- verified Embed derive macro, folder attribute
- docs.rs/reqwest-0.13.4 -- verified async client, json feature
- docs.rs/notify-8.2.0 -- verified RecommendedWatcher, Config, EventKindMask
- docs.rs/fs4-1.1.0 -- cross-platform file locking
- docs.rs/thiserror-2.0.18 -- derive macro for Error trait
- docs.rs/chrono-0.4.44 -- datetime with serde feature
- docs.rs/uuid-1.23.2 -- v4 generation
- docs.rs/tokio-1.52.3 -- async runtime
- docs.rs/tracing-0.1.44 / tracing-subscriber-0.3.23 -- structured logging
- docs.rs/serde-1.0.228 / serde_json-1.0.150 -- serialization
- Context7 /axodotdev/cargo-dist -- build configuration, cross-compilation, CI setup
- docs.rs/dist -- cargo-dist release automation tool

---
*Stack research for: Rust CLI + local Web UI tool for AI session management*
*Researched: 2026-05-29*
