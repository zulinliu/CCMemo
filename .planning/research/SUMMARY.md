# Project Research Summary

**Project:** CCMemo
**Domain:** Rust CLI + local Web UI for AI session management (Claude Code transcripts)
**Researched:** 2026-05-29
**Confidence:** HIGH

## Executive Summary

CCMemo is a local-first tool that turns Claude Code JSONL transcripts into searchable, browsable, and reusable engineering assets. The product fills a gap no existing tool addresses: Claude Code stores rich session data but provides zero visualization, zero cross-session search, and zero intelligence extraction. The competitive landscape confirms this is greenfield territory — AiderDesk offers a GUI but only for aider, and Claude Code itself has only a CLI session picker limited to a single project.

The recommended approach is a Rust core engine with SQLite/FTS5 storage, an Axum HTTP server embedding a React SPA, and a CLI interface wrapping the same service layer. The architecture is a strict three-layer design (Storage → Service → UI) with repository traits for testability and an AI provider adapter pattern for future extensibility. Single-binary distribution via cargo-dist with rust-embed for the frontend is the deployment model.

The key risks center on SQLite concurrency (WAL mode requires disciplined connection management), Chinese text search (FTS5 with jieba-rs must be set up correctly from day one, no migration path from a wrong tokenizer), and JSONL streaming edge cases (parsing files actively being written by Claude Code). All three risks map to Phase 1 and must be addressed at the storage/parser level before any UI work begins.

## Key Findings

### Recommended Stack

Rust 2024 edition with tokio async runtime forms the backend core. axum 0.8.9 serves the API and embedded React SPA. rusqlite 0.40 with bundled-full provides SQLite with FTS5 statically linked. The claude-code-transcripts 0.1.11 crate handles typed JSONL parsing. jieba-rs 0.10.1 provides Chinese word segmentation for FTS5. The frontend is React 19 + TypeScript + Vite 6 + Tailwind 4, built into static assets that rust-embed compiles into the binary.

**Core technologies:**
- **Rust 2024 + tokio 1.52**: Core language and async runtime — performance, safety, single-binary distribution
- **axum 0.8.9 + tower-http 0.6.11**: HTTP server with SPA serving, SSE support — 0.7 is EOL
- **rusqlite 0.40 (bundled-full)**: SQLite with FTS5, WAL mode — `bundled-full` required (not `bundled`)
- **claude-code-transcripts 0.1.11**: Typed JSONL parser with Entry enum — young crate, use round-trip validator
- **jieba-rs 0.10.1**: Chinese word segmentation for FTS5 — ~10MB dictionary, critical for target market
- **rust-embed 8.11**: Embeds Vite-built frontend into binary — single binary deployment
- **clap 4.6 (derive)**: CLI with subcommands, auto-generated help, shell completions
- **React 19 + react-virtuoso 4**: Frontend with virtual scrolling for long sessions (500+ messages)

### Expected Features

**Must have (table stakes — v0.1):**
- Transcript scan and index of ~/.claude/projects/ — foundation everything depends on
- Session list view (CLI + Web) with cross-project aggregation — the "aha moment"
- Session inspector with three-column layout and virtual scrolling — validates data integrity
- Full-text search with FTS5 + jieba-rs — "find that conversation" is core value
- Session status auto-detection (active/completed/interrupted/unrecoverable)
- Export to Markdown and JSONL with optional 12-rule sanitization
- Dark/light theme, empty state design, demo mode
- Local API security (127.0.0.1 + random port + bearer token + Host validation)
- CLI commands: scan/list/show/export/serve/demo

**Should have (competitive — v0.2):**
- AI-powered document generation (Bug Runbook, Technical Proposal templates)
- Safe Resume with three-gate pre-flight checks
- Incremental scan with file watching (notify crate)
- Sanitized sharing export (12-rule regex engine)
- Session analytics dashboard
- i18n (Chinese + English)

**Defer (v0.3+):**
- Skill Forge (session-to-installable-skill pipeline) — highest value but highest complexity
- Skill static validation and security audit
- Additional AI templates (PRD, Learning Note)
- SQLCipher encryption (v0.4+)
- OS Keychain integration (v0.4+)

### Architecture Approach

Three-layer architecture with strict downward dependency: UI Layer depends on Service Layer depends on Storage Layer. Services communicate through Rust traits (repository pattern, AI provider adapter). The Axum HTTP server shares an AppState Arc containing all services.

**Major components:**
1. **Storage Layer (SQLite WAL, 6 tables)**: ProjectIdentity, SessionMetadata, TranscriptEvent, ToolCall, Summary, ScanBookmark — with FTS5 virtual table and cursor-based pagination indexes
2. **Service Layer (8 services)**: ProjectDiscovery, SessionIndexer, TimelineService, ExportEngine, RedactionEngine, AIProviderMgr, SkillForge, ConfigManager
3. **UI Layer (dual interface)**: CLI via clap derive macros, React SPA via Axum HTTP/SSE with embedded static assets

### Critical Pitfalls

1. **SQLite WAL concurrency** — Set busy_timeout=5000, single Mutex write connection, separate read connections. Without this, concurrent scan + browse produces SQLITE_BUSY errors.
2. **FTS5 Chinese tokenizer — no migration path** — Default unicode61 produces garbage for Chinese. Must register jieba-rs custom tokenizer before table creation. Changing tokenizers requires DROP TABLE + full re-index.
3. **JSONL streaming parser on active sessions** — Claude Code appends to JSONL in real-time. Parser must handle partial lines at EOF, buffer incomplete lines, track byte offsets for incremental re-scan.
4. **DNS rebinding attack on local API** — Must validate Origin and Host headers on every request. Bearer token in Authorization header, never query parameter.
5. **rusqlite bundled-full cross-compilation** — Requires target-specific C compilers. Set up cross-compilation CI immediately using cargo-zigbuild.

## Implications for Roadmap

### Phase 1: Core Engine + Storage
**Rationale:** Everything depends on transcript parsing, storage, and indexing. Five of ten critical pitfalls map here.
**Delivers:** Rust library that scans ~/.claude/projects/, parses JSONL, stores in SQLite with FTS5, queries via repository traits.
**Addresses:** Transcript scan/index, session status detection, FTS5 + jieba-rs search foundation, incremental scan bookmarks.
**Avoids:** WAL lockups, broken Chinese search, JSONL parse failures, FTS5 drift, credential leakage in logs.

### Phase 2: CLI Commands
**Rationale:** CLI provides first user-facing value and validates the data pipeline end-to-end before any web work.
**Delivers:** Working scan, list, show, export, demo, doctor commands.
**Uses:** clap 4.6 (derive), console/indicatif for terminal output, serde_json for export.

### Phase 3: Web API Server
**Rationale:** HTTP API sits between service layer and React UI. Security middleware (bearer token, CORS, Host validation) must be established before frontend work.
**Delivers:** Axum REST API endpoints for sessions, projects, search, export, SSE events. Local API security middleware.
**Avoids:** DNS rebinding attacks, SPA fallback catching API routes.

### Phase 4: React Web UI
**Rationale:** Most complex UI challenge is virtual scrolling for long sessions. Must test with realistic 1000-message data.
**Delivers:** Session list, session inspector, search interface, dark/light theme, responsive breakpoints.
**Avoids:** Virtuoso scroll jumps, Chinese IME composition breaking search.

### Phase 5: Export + Sanitization
**Rationale:** Export and sanitization are tightly coupled. Building together ensures 12-rule regex engine is validated.
**Delivers:** Full Markdown/JSONL export, safe-share variant with 12-rule sanitization, redaction preview UI.
**Stack:** regex, serde_json, chrono.

### Phase 6: AI Analysis + Safe Resume
**Rationale:** Highest-value differentiator but requires entire data pipeline working. AI provider adapter must be proven first.
**Delivers:** AI document generation (Bug Runbook, Technical Proposal), AI provider adapter, Safe Resume with three-gate checks.
**Stack:** reqwest 0.13, async-trait.

### Phase 7: Polish + Distribution
**Rationale:** Final phase: analytics, i18n, cross-platform builds, E2E testing. cargo-dist CI validated across all platforms.
**Delivers:** Session analytics, i18n (Chinese + English), cross-platform binaries, CI/CD pipeline, E2E test suite.
**Stack:** cargo-dist, cargo-zigbuild, Playwright.

### Phase Ordering Rationale

- Phase 1 first: five critical pitfalls are architecturally locked at storage layer
- Phase 2 (CLI) before Phase 3 (API): CLI validates data pipeline with minimal infrastructure
- Phase 3 (API) before Phase 4 (UI): API establishes security before React complexity
- Phase 5 (Export) can overlap with Phase 4 (UI): RedactionEngine is service-layer concern
- Phase 6 (AI) after core is stable: most complex and least predictable, needs validated foundation
- Phase 7 (Polish) last: integration concerns should not delay feature development

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** jieba-rs FTS5 integration — custom tokenizer registration via rusqlite vtab not well-documented
- **Phase 3:** Axum SSE + rust-embed SPA serving — router configuration needs verification
- **Phase 4:** react-virtuoso VirtuosoMessageList API — verify component exists and supports needed features
- **Phase 6:** claude-code-transcripts API stability — at 0.1.x, Entry enum may have gaps

Phases with standard patterns (skip research):
- **Phase 2:** CLI with clap derive — well-documented standard Rust pattern
- **Phase 5:** Regex-based redaction and Markdown export — straightforward
- **Phase 7:** cargo-dist and i18n — standard tooling

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified on docs.rs. Compatibility matrix confirmed. |
| Features | MEDIUM | Competitive analysis based on public repos and docs. No user validation yet. |
| Architecture | HIGH | Three-layer pattern standard for Rust services. SQLite schema specific and detailed. |
| Pitfalls | HIGH | SQLite WAL/FTS5 pitfalls well-documented. DNS rebinding and Chinese IME are known concerns. |

**Overall confidence:** HIGH

### Gaps to Address

- **jieba-rs FTS5 integration:** Exact mechanism for registering Rust tokenizer as custom FTS5 tokenizer via rusqlite not well-documented. Fallback: pre-tokenize with jieba-rs and store space-separated tokens in auxiliary column.
- **claude-code-transcripts API coverage:** At 0.1.x may not cover all Claude Code transcript entry types. Test against real files early.
- **Path encoding bug #40946:** Non-ASCII characters replaced with `-`, causing collisions for CJK paths. Directory scanning is correct mitigation but needs testing.
- **Performance targets:** 1000 messages < 5s and 10K search < 300ms need benchmark validation in Phase 1.

## Sources

### Primary (HIGH confidence)
- docs.rs/rusqlite-0.40.0 — bundled-full feature, FTS5, WAL mode
- docs.rs/axum-0.8.9 — routing, tower 0.5.2, SSE support
- docs.rs/claude-code-transcripts-0.1.11 — Entry enum variants
- docs.rs/jieba-rs-0.10.1 — Jieba struct, Token type
- docs.rs/tower-http-0.6.11 — ServeDir with fallback for SPA
- SQLite official docs — WAL mode, FTS5 extension, busy_timeout
- Context7 /axodotdev/cargo-dist — build configuration

### Secondary (MEDIUM confidence)
- Claude Code documentation via Context7 — session management, --resume, /export
- AiderDesk (hotovo/aider-desk) — desktop GUI for aider, feature comparison
- React Virtuoso documentation via Context7 — VirtuosoMessageList

### Tertiary (LOW confidence)
- Claude Code path encoding bug #40946 — behavior inferred from issue description
- claude-code-transcripts crate — API stability unverified in practice

---
*Research completed: 2026-05-29*
*Ready for roadmap: yes*
