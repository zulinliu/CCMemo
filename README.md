# CCMemo

Claude Code session memory manager — turns JSONL transcripts into searchable, reusable engineering assets.

## Features

- **Scan & Index**: Automatically discover and index all Claude Code session transcripts from `~/.claude/projects/`
- **Full-text Search**: FTS5-powered search with Chinese (jieba) and English tokenization
- **Session Management**: List, show, resume, and export your Claude Code sessions
- **Incremental Scanning**: Only re-indexes changed files using hash-based bookmarks
- **Rich Metadata**: Extracts tool calls, file paths, branches, models, and more from transcripts
- **Export**: Export sessions to clean Markdown for sharing or documentation

## Installation

```bash
cargo install --path crates/ccmemo-cli
```

Or build from source:

```bash
git clone https://github.com/ccmemo/ccmemo.git
cd ccmemo
cargo build --release
```

## Quick Start

```bash
# Index all Claude Code sessions
ccmemo scan

# List indexed sessions
ccmemo list

# Search sessions
ccmemo list --query "auth bug"

# Show session details
ccmemo show <session-id>

# Check resume readiness
ccmemo resume <session-id>

# Export session to markdown
ccmemo export <session-id> --format markdown

# Run diagnostics
ccmemo doctor
```

## Commands

| Command | Description |
|---------|-------------|
| `scan` | Scan and index Claude Code session transcripts |
| `list` | List indexed sessions with filtering |
| `show` | Show detailed session information |
| `resume` | Check resume readiness for a session |
| `export` | Export session to markdown or jsonl |
| `demo` | Import demo sessions for testing |
| `config` | Get/set configuration values |
| `doctor` | Run diagnostic checks |

## Configuration

CCMemo uses environment variables for configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `CCMEMO_CLAUDE_CONFIG_DIR` | `~/.claude` | Claude Code config directory |
| `CCMEMO_DB_PATH` | `~/.local/share/ccmemo/ccmemo.db` | Database file path |
| `CCMEMO_EXPORT_DIR` | `~/ccmemo-exports` | Export output directory |

## Architecture

CCMemo is structured as a Rust workspace with two crates:

- **ccmemo-core**: Core library with domain types, storage, parsing, and services
- **ccmemo-cli**: CLI application using clap for command handling

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

# Build release
cargo build --release
```

## License

Apache License 2.0
