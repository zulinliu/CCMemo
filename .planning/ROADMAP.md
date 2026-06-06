# Roadmap: CCMemo

## Overview

CCMemo transforms scattered Claude Code JSONL transcripts into searchable, browsable, and reusable engineering assets. The roadmap builds from the data foundation outward: first a working Rust engine that scans and indexes transcripts with CLI access, then an API layer with security, then a React web UI for visual exploration, and finally the high-value differentiators of export, AI analysis, and Skill extraction. Each phase delivers a coherent, independently verifiable capability.

**Mode:** mvp
**Granularity:** coarse

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core Engine + CLI** - Scan, parse, index Claude Code transcripts into SQLite with FTS5; validate via CLI commands
- [ ] **Phase 2: Web Server + API** - Axum HTTP server with security middleware and REST endpoints for all service operations
- [ ] **Phase 3: React Web UI + Search** - Visual session browsing, full-text search, responsive layout, theme support, and first-launch experience
- [ ] **Phase 4: Export + AI Analysis + Skill Forge** - Session export with sanitization, AI-powered document generation, and Skill extraction pipeline

## Phase Details

### Phase 1: Core Engine + CLI
**Mode:** mvp
**Goal:** **As a** Claude Code developer, **I want to** scan my transcript files and browse session data from the command line, **so that** I can find and revisit past coding sessions without digging through raw JSONL files.
**Depends on**: Nothing (first phase)
**Requirements**: SCAN-01, SCAN-02, SCAN-03, SCAN-04, SCAN-05, SCAN-06, SCAN-07, STOR-01, STOR-02, STOR-03, STOR-04, STOR-05, CLIC-01, CLIC-02, CLIC-03, CLIC-04, CLIC-05, CLIC-06, CLIC-09, CLIC-10
**Success Criteria** (what must be TRUE):
  1. User runs `ccmemo scan` and all Claude Code transcript files under ~/.claude/projects/ are discovered, parsed with streaming JSONL, and indexed into SQLite
  2. User runs `ccmemo list` and sees a paginated table of sessions with title, project, branch, time, and auto-detected status
  3. User runs `ccmemo show <id>` and sees full session details including timeline events and tool calls
  4. User runs `ccmemo demo` and example sessions are imported for immediate exploration
  5. Database uses WAL mode, 6-table schema, batch writes, and FTS5 with jieba-rs tokenizer ready for search
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md -- Walking Skeleton: project scaffold + storage layer (SQLite WAL, 6-table schema, FTS5, jieba-rs) + demo data + list command
- [ ] 01-02-PLAN.md -- Real scanner: streaming JSONL parser + claude-code-transcripts Entry mapping + project discovery + session indexer + scan command
- [ ] 01-03-PLAN.md -- Complete CLI: show/resume/export/config/doctor commands with service logic (serve stub for Phase 2)

### Phase 2: Web Server + API
**Mode:** mvp
**Goal:** A secure local HTTP API exposes all session operations to a web frontend, with proper authentication, CORS, and SSE for real-time progress
**Depends on**: Phase 1
**Requirements**: SECR-01, SECR-02, SECR-03, SECR-04, SECR-05, SECR-06, APIE-01, APIE-02, APIE-03, APIE-04, APIE-05, APIE-06, APIE-07, APIE-08, APIE-09, APIE-10, APIE-11, APIE-12, APIE-13, CLIC-07, CLIC-08
**Success Criteria** (what must be TRUE):
  1. `ccmemo serve` starts an HTTP server bound to 127.0.0.1 on a random port, logs the one-time bearer token, and rejects unauthenticated requests with 404
  2. Authenticated API consumers can list projects, list sessions with cursor pagination, get session details, and retrieve timeline events
  3. API endpoints exist for triggering export, redaction preview, AI summarize, and Skill draft/validate/install with SSE progress events
  4. Full-text search endpoint returns results with FTS5 + jieba-rs Chinese segmentation, supporting project/status/branch/has:errors filter syntax
  5. CORS restricts to http://127.0.0.1:* and Host header validation prevents DNS rebinding
**Plans**: 3 plans

Plans:
- [ ] 02-01: Security middleware -- 127.0.0.1 binding, random port, bearer token generation, Host validation, CORS
- [ ] 02-02: REST API endpoints -- session CRUD, timeline, search, projects, settings, SSE event stream
- [ ] 02-03: Service layer wiring -- export engine, redaction engine, AI provider adapter, Skill forge service integration with API routes

### Phase 3: React Web UI + Search
**Mode:** mvp
**Goal:** Users can visually browse sessions, search across all transcripts, inspect conversation details, and resume sessions through a polished web interface
**Depends on**: Phase 2
**Requirements**: BROW-01, BROW-02, BROW-03, BROW-04, BROW-05, BROW-06, SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05, RSUM-01, RSUM-02, RSUM-03, UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-05, UIUX-06, UIUX-07
**Success Criteria** (what must be TRUE):
  1. User opens the web UI and sees a session list with Session Brief cards showing title, project, branch, time, and status, with cursor-based pagination
  2. User clicks a session and sees a three-column inspector layout (timeline, raw content, session card) with color-coded nodes and virtual scrolling for 500+ events
  3. User types in the search bar and gets full-text results with Chinese segmentation, filter syntax (project:/branch:/status:/has:errors), and Chinese IME compatibility
  4. User clicks resume on a session and sees Safe Resume check results with a copyable platform-specific command, or sees unrecoverable status when project path is gone
  5. UI supports dark/light theme following OS preference, empty states with icons and guidance, keyboard navigation, and i18n for Chinese and English
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [ ] 03-01: Session list + inspector -- Session Brief cards, three-column layout, color-coded timeline, virtual scrolling with react-virtuoso, responsive breakpoints
- [ ] 03-02: Search + resume -- search bar with syntax help and autocomplete, FTS5 results display, Chinese IME handling, Safe Resume UI
- [ ] 03-03: UI shell -- dark/light theme, empty states, first-launch wizard, Ctrl+K command palette, i18n, keyboard navigation, ARIA labels

### Phase 4: Export + AI Analysis + Skill Forge
**Mode:** mvp
**Goal:** Users can export sessions safely with redaction, generate AI-powered analysis documents, and extract reusable Skills from successful sessions
**Depends on**: Phase 2
**Requirements**: EXPT-01, EXPT-02, EXPT-03, EXPT-04, EXPT-05, EXPT-06, REDN-01, REDN-02, REDN-03, REDN-04, AIAN-01, AIAN-02, AIAN-03, AIAN-04, AIAN-05, AIAN-06, AIAN-07, AIAN-08, SKIL-01, SKIL-02, SKIL-03, SKIL-04, SKIL-05, SKIL-06, SKIL-07, SKIL-08
**Success Criteria** (what must be TRUE):
  1. User exports a session to Markdown or JSONL, with a manifest file and auto-created .gitignore in the export directory
  2. User enables safe export and sees a redaction preview showing the 12-rule regex sanitization applied (API keys, AWS creds, tokens, etc.), with false-positive detection for test/dummy values
  3. User selects an AI template (Bug Runbook, Technical Plan, PRD, or Learning Notes) and sees staged progress with cancel support, quality self-check results, and retry on failure
  4. User drafts a Skill from a session, sees extracted success/failure paths and key decisions, gets static validation results, and can approve and install with per-line review and integrity hash
  5. Skill generation detects prompt injection patterns and the system distinguishes auto-executable Skills from human-read Playbooks
**Plans**: 3 plans

Plans:
- [ ] 04-01: Export engine -- Markdown/JSONL export, manifest generation, .gitignore creation, watermark footer
- [ ] 04-02: Redaction + AI analysis -- 12-rule regex engine, redaction preview, AI provider adapter (Claude API), 4 templates, staged progress, quality self-check
- [ ] 04-03: Skill Forge -- Skill extraction from sessions, SKILL.md generation, static validation, prompt injection detection, per-line install approval, hash verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Engine + CLI | 0/3 | Planning complete | - |
| 2. Web Server + API | 0/3 | Not started | - |
| 3. React Web UI + Search | 0/3 | Not started | - |
| 4. Export + AI Analysis + Skill Forge | 0/3 | Not started | - |
