# CCMemo

Claude Code session memory manager — turns JSONL transcripts into searchable, reusable engineering assets.

## Features

- **Web UI**: Browse sessions in a polished web interface with dark/light theme, timeline inspector, and search
- **Scan & Index**: Automatically discover and index all Claude Code session transcripts from `~/.claude/projects/`
- **Full-text Search**: FTS5-powered search with Chinese (jieba) and English tokenization
- **Session Management**: List, show, resume, and export your Claude Code sessions
- **Incremental Scanning**: Only re-indexes changed files using hash-based bookmarks
- **Rich Metadata**: Extracts tool calls, file paths, branches, models, and more from transcripts
- **Export**: Export sessions to clean Markdown for sharing or documentation
- **Single Binary**: Frontend embedded via rust-embed — deploy one file, zero dependencies

## Installation

```bash
cargo install --path crates/ccmemo-cli
```

Or build from source:

```bash
git clone https://github.com/ccmemo/ccmemo.git
cd ccmemo

# Build frontend first (requires Node.js)
cd frontend && npm install && npm run build && cd ..

# Build the binary with embedded frontend
cargo build --release
```

## Quick Start

```bash
# Index all Claude Code sessions
ccmemo scan

# Start web UI (opens with auth token)
ccmemo serve

# List indexed sessions
ccmemo list

# Search sessions
ccmemo list --query "auth bug"

# Show session details
ccmemo show <session-id>

# Export session to markdown
ccmemo export <session-id> --format markdown

# Run diagnostics
ccmemo doctor
```

## Commands

| Command | Description |
|---------|-------------|
| `serve` | Start Web UI server (embedded React app + REST API) |
| `scan` | Scan and index Claude Code session transcripts |
| `list` | List indexed sessions with filtering |
| `show` | Show detailed session information |
| `resume` | Check resume readiness for a session |
| `export` | Export session to markdown or jsonl |
| `demo` | Import demo sessions for testing |
| `config` | Get/set configuration values |
| `doctor` | Run diagnostic checks |

## Web UI

Run `ccmemo serve` to start the web interface. The server binds to `127.0.0.1` on a random port and prints a one-time auth token. Features:

- **Session Browser**: Scrollable list with status indicators, branch info, token counts
- **Timeline Inspector**: Three-column layout (timeline + content + details) with color-coded event types
- **Full-text Search**: Real-time search with Chinese IME support
- **Dark/Light Theme**: Follows OS preference, toggleable in the header
- **Project Filters**: Filter sessions by project and status

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/sessions` | List sessions with cursor pagination |
| `GET /api/sessions/:id` | Get session detail |
| `GET /api/sessions/:id/timeline` | Get timeline events |
| `GET /api/sessions/:id/tool-calls` | Get tool calls |
| `GET /api/projects` | List all projects |
| `GET /api/search?q=` | Full-text search |
| `GET /api/stats` | Database statistics |

All endpoints require `X-CCMemo-Token` header for authentication.

## Configuration

CCMemo uses environment variables for configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `CCMEMO_CLAUDE_CONFIG_DIR` | `~/.claude` | Claude Code config directory |
| `CCMEMO_DB_PATH` | `~/.local/share/ccmemo/ccmemo.db` | Database file path |
| `CCMEMO_EXPORT_DIR` | `~/ccmemo-exports` | Export output directory |

## Architecture

CCMemo is a Rust workspace with an embedded React frontend:

- **ccmemo-core**: Core library with domain types, storage, parsing, services, and Axum web server
- **ccmemo-cli**: CLI application using clap for command handling
- **frontend**: React + TypeScript + Vite + Tailwind CSS SPA

### Tech Stack

- **Backend**: Rust, Axum, rusqlite, r2d2, jieba-rs
- **Frontend**: React, TypeScript, Vite, Tailwind CSS v4
- **Design**: Anthropic-inspired warm ivory/slate palette, Inter + JetBrains Mono

### Storage

- SQLite with WAL mode for concurrent reads
- 6-table schema with FTS5 virtual table for full-text search
- r2d2 connection pool for read scalability

### Parser

- Streaming JSONL parser with byte offset tracking
- Handles all Claude Code event types: user, assistant, tool_use, tool_result, system
- 10MB line cap for safety

## Development

```bash
# Run tests
cargo test

# Run with logging
RUST_LOG=debug cargo run -- scan

# Lint
cargo clippy -- -D warnings

# Build release (with embedded frontend)
cd frontend && npm run build && cd .. && cargo build --release
```

## License

Apache License 2.0
