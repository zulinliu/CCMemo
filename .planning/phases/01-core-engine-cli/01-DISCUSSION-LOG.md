# Phase 1: Core Engine + CLI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 1-Core Engine + CLI
**Mode:** --auto (fully autonomous)
**Areas discussed:** JSONL Parser, FTS5 Chinese Search, Storage Layer, CLI Design, Error Handling, Security, Configuration, Demo Data, Project Structure

---

## JSONL Parser & Transcript Handling

| Option | Description | Selected |
|--------|-------------|----------|
| claude-code-transcripts crate | Use typed crate, spike to verify coverage | ✓ |
| Custom streaming parser | Build from scratch | |

**Auto-selected:** claude-code-transcripts with spike validation + custom parser fallback
**Notes:** Research flagged API gaps (queue-operation, attachment variants). Spike in first plan validates coverage.

## FTS5 Chinese Search Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-tokenize with jieba-rs | Store space-separated tokens in auxiliary column | ✓ |
| Custom FTS5 tokenizer via C FFI | Register jieba-rs as native tokenizer | |

**Auto-selected:** Pre-tokenization approach — simpler, no C FFI shim needed
**Notes:** Research confirmed custom tokenizer registration through rusqlite is not well-documented. Pre-tokenization is the safer path.

## Storage Connection Management

| Option | Description | Selected |
|--------|-------------|----------|
| r2d2 pool + Mutex write conn | Established, simpler for v0.1 | ✓ |
| deadpool-sqlite + async | Better async ergonomics | |

**Auto-selected:** r2d2 for read pool + single Mutex write connection
**Notes:** Research recommended r2d2 for v0.1 simplicity. Evaluate deadpool if pool contention appears.

## CLI Output Style

| Option | Description | Selected |
|--------|-------------|----------|
| Rich terminal (console + indicatif) | Colored tables, progress bars | ✓ |
| Plain text | Simple, minimal dependencies | |

**Auto-selected:** Rich terminal output with TTY detection fallback
**Notes:** Design doc specifies progress reporting. Rich output provides better UX.

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| thiserror (lib) + anyhow (CLI) | Community best practice | ✓ |
| anyhow everywhere | Simpler but less structured | |
| thiserror everywhere | More boilerplate at CLI level | |

**Auto-selected:** thiserror for library layer, anyhow for CLI layer
**Notes:** Standard Rust pattern. Library errors are typed for downstream consumers; CLI errors are user-friendly.

## Demo Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Synthetic JSONL files | 3 realistic but fake sessions | ✓ |
| Real anonymized sessions | Higher quality but privacy risk | |

**Auto-selected:** Synthetic demo sessions
**Notes:** Design doc specifies 3 scenarios (Bug fix, Requirements discussion, Tech research). No privacy risk with synthetic data.

## Project Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Cargo workspace (core + CLI crates) | Clean separation, reusable core | ✓ |
| Single crate | Simpler to start | |

**Auto-selected:** Workspace with ccmemo-core (lib) + ccmemo-cli (bin)
**Notes:** Core library is reused by Axum server (Phase 2) and Tauri desktop (future). Separation pays off early.

---

## Claude's Discretion

- Module file organization within ccmemo-core
- Error type variants and message wording
- Testing granularity and test file organization
- Migration versioning scheme
- Progress reporting detail level

## Deferred Ideas

None — all decisions stayed within Phase 1 scope.
