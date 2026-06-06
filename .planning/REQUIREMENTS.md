# Requirements: CCMemo

**Defined:** 2026-05-29
**Core Value:** 让每一次 AI 编程会话的经验都能被找回、被复用、被锻造为可自动执行的 Agent Skill

## v1 Requirements

### Session Scanning & Indexing

- [ ] **SCAN-01**: User can scan ~/.claude/projects/ to discover all Claude Code transcript files
- [ ] **SCAN-02**: System parses JSONL transcripts using claude-code-transcripts crate with streaming (constant memory)
- [ ] **SCAN-03**: System handles incremental scans for actively-appending sessions (partial lines, byte offsets)
- [ ] **SCAN-04**: System detects session status automatically (active/completed/interrupted/unrecoverable)
- [ ] **SCAN-05**: System generates auto-titles from first user message (first 50 chars, cleaned)
- [ ] **SCAN-06**: System discovers project paths by directory scanning + cross-validation (not reverse encoding)
- [ ] **SCAN-07**: System tolerates corrupted/half-line JSON with UTF-8 replacement character and line-skip logging

### Storage

- [ ] **STOR-01**: System stores sessions in SQLite with WAL mode for concurrent read/write
- [ ] **STOR-02**: System maintains 6-table schema (ProjectIdentity, SessionMetadata, TranscriptEvent, ToolCall, Summary, ScanBookmark)
- [ ] **STOR-03**: TranscriptEvent includes fileOffset + byteLength for O(1) seek to raw JSON
- [ ] **STOR-04**: System uses batch writes (4MB or 2000 rows per transaction) for scan performance
- [ ] **STOR-05**: ScanBookmark tracks last indexed line for incremental re-scan

### Session Browsing

- [ ] **BROW-01**: User can view session list with Session Brief cards (title, project, branch, time, status)
- [ ] **BROW-02**: User can inspect session details in three-column layout (timeline, raw content, session card)
- [ ] **BROW-03**: Timeline nodes are color-coded by 5 groups (user/AI/file/command/error)
- [ ] **BROW-04**: Layout is responsive: 3-column > 1280px, 2-column 1024-1280px, 1-column < 1024px
- [ ] **BROW-05**: Long sessions (500+ events) use virtual scrolling with react-virtuoso
- [ ] **BROW-06**: Session list supports cursor-based pagination (no offset pagination)

### Search

- [ ] **SRCH-01**: User can full-text search across all sessions using FTS5
- [ ] **SRCH-02**: System supports jieba-rs Chinese word segmentation for FTS5
- [ ] **SRCH-03**: User can use search syntax: project:, branch:, status:, after:/before:, has:errors
- [ ] **SRCH-04**: Search input handles Chinese IME composition (compositionstart/compositionend)
- [ ] **SRCH-05**: Search bar shows syntax help on focus, autocomplete for project names

### Resume

- [ ] **RSUM-01**: System performs Safe Resume checks: project path exists + Claude CLI available + shell format
- [ ] **RSUM-02**: User can copy platform-specific resume command (auto-detect PowerShell/zsh/WSL/Git Bash)
- [ ] **RSUM-03**: System marks unrecoverable sessions (project path gone + CLI unavailable)

### Export

- [ ] **EXPT-01**: User can export complete session to Markdown (including thinking process and decisions)
- [ ] **EXPT-02**: User can export session to JSONL format
- [ ] **EXPT-03**: System creates export manifest (version, session ID, time, hash)
- [ ] **EXPT-04**: Export defaults to directory outside project (avoids accidental git add)
- [ ] **EXPT-05**: Export directory auto-creates .gitignore
- [ ] **EXPT-06**: Markdown export includes lightweight watermark footer

### Redaction & Security

- [ ] **REDN-01**: System applies 12-rule regex sanitization (API keys, AWS creds, GitHub tokens, JWT, SSH keys, DB connection strings, auth headers, hardcoded passwords, home paths, email/phone, private IPs, .env blocks)
- [ ] **REDN-02**: System provides redaction preview before export/share
- [ ] **REDN-03**: Sanitization skips test/fake/dummy/example prefixed values (false positive prevention)
- [ ] **REDN-04**: User can define custom redaction rules (regex pattern + replacement)
- [ ] **SECR-01**: Local API binds to 127.0.0.1 only with random port
- [ ] **SECR-02**: API generates one-time bearer token on startup
- [ ] **SECR-03**: API validates Host header (127.0.0.1:<actual-port> only)
- [ ] **SECR-04**: API requires X-CCMemo-Token header on all requests
- [ ] **SECR-05**: Non-authenticated requests return 404 (no response differentiation)
- [ ] **SECR-06**: CORS only allows http://127.0.0.1:*

### AI Analysis

- [ ] **AIAN-01**: User can generate Bug Fix Runbook from session (symptoms, diagnosis, root cause, fix, verification, pitfalls)
- [ ] **AIAN-02**: User can generate Technical Implementation Plan from session (background, tech choices, architecture, steps, risks)
- [ ] **AIAN-03**: User can generate PRD from session (user needs from discussion, feature definition, acceptance criteria, priorities)
- [ ] **AIAN-04**: User can generate Learning Notes from session (key knowledge, code examples, pitfalls, further reading)
- [ ] **AIAN-05**: AI analysis uses pluggable provider adapter (first version: Claude API via reqwest)
- [ ] **AIAN-06**: Generation shows staged progress (read → redact → send → generate → self-check) with cancel support
- [ ] **AIAN-07**: System performs quality self-check (coverage of core discussions, missing decisions, unverifiable claims)
- [ ] **AIAN-08**: Self-check failure is non-blocking: shows report alongside generated content with retry option

### Skill Forge

- [ ] **SKIL-01**: User can draft Skill spec from a successful session
- [ ] **SKIL-02**: System extracts success path, failure path, key decisions, domain knowledge, trigger conditions
- [ ] **SKIL-03**: System generates SKILL.md with correct frontmatter and structure
- [ ] **SKIL-04**: System runs static validation (frontmatter, naming, structure, description, sensitive info scan)
- [ ] **SKIL-05**: Skill install requires explicit per-line user approval of executable instructions
- [ ] **SKIL-06**: System scans for prompt injection patterns during Skill generation
- [ ] **SKIL-07**: Skill install generates hash for integrity verification on load
- [ ] **SKIL-08**: System distinguishes Skill vs Playbook (auto-executable vs human-read)

### CLI

- [ ] **CLIC-01**: User can run `ccmemo scan [--full]` to scan and index sessions
- [ ] **CLIC-02**: User can run `ccmemo list` with filters (query, project, status, limit)
- [ ] **CLIC-03**: User can run `ccmemo show <session_id>` to display session details
- [ ] **CLIC-04**: User can run `ccmemo resume <session_id>` with Safe Resume checks
- [ ] **CLIC-05**: User can run `ccmemo serve [--port]` to start Web UI server
- [ ] **CLIC-06**: User can run `ccmemo export <session_id> --format markdown|jsonl [--safe]`
- [ ] **CLIC-07**: User can run `ccmemo summarize <session_id> --template <type>`
- [ ] **CLIC-08**: User can run `ccmemo skill draft/init/validate/install/uninstall`
- [ ] **CLIC-09**: User can run `ccmemo demo` to import example sessions
- [ ] **CLIC-10**: User can run `ccmemo config get/set` and `ccmemo doctor`

### Web API

- [ ] **APIE-01**: GET /api/projects — list all projects
- [ ] **APIE-02**: GET /api/sessions — paginated session list with filters and cursor
- [ ] **APIE-03**: GET /api/sessions/:id — session detail
- [ ] **APIE-04**: GET /api/sessions/:id/timeline — cursor-paginated timeline events
- [ ] **APIE-05**: GET /api/sessions/:id/resume-check — Safe Resume pre-flight
- [ ] **APIE-06**: POST /api/sessions/:id/export — trigger export
- [ ] **APIE-07**: POST /api/sessions/:id/redaction-preview — preview sanitization
- [ ] **APIE-08**: POST /api/sessions/:id/summarize — trigger AI analysis
- [ ] **APIE-09**: POST /api/sessions/:id/skill-draft — trigger Skill draft
- [ ] **APIE-10**: POST /api/skills/:id/validate + /install — Skill management
- [ ] **APIE-11**: GET /api/search?q= — full-text search
- [ ] **APIE-12**: GET/PUT /api/settings — configuration
- [ ] **APIE-13**: GET /api/events — SSE for real-time progress

### UI & UX

- [ ] **UIUX-01**: System provides dark/light theme toggle following OS preference
- [ ] **UIUX-02**: All empty states include icon + description + action button
- [ ] **UIUX-03**: System provides first-launch guided experience (select config dir → scan → preview)
- [ ] **UIUX-04**: Ctrl+K command palette with resume/export/goto actions
- [ ] **UIUX-05**: System supports i18n (Chinese + English via react-i18next + rust-i18n)
- [ ] **UIUX-06**: All interactive elements have keyboard navigation and ARIA labels
- [ ] **UIUX-07**: High contrast mode follows OS setting

## v2 Requirements

### Desktop

- **DSKT-01**: Tauri v2 desktop app packaging
- **DSKT-02**: Native installers for Windows/macOS/Linux
- **DSKT-03**: OS Keychain integration for AI provider credentials
- **DSKT-04**: SQLCipher encryption for local database

### Advanced Search

- **ADVS-01**: Semantic search using embeddings
- **ADVS-02**: Search across exported documents
- **ADVS-03**: Saved search queries and filters

### Collaboration

- **COLL-01**: Export sessions as shareable links (local network)
- **COLL-02**: Team playbook library
- **COLL-03**: Shared Skill registry

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud sync / multi-device | Local-first design principle; no network service |
| Multi-user accounts | Single-user desktop tool, not SaaS |
| Non-Claude Code transcript formats | Only Claude Code JSONL supported |
| Real-time coding assistance | CCMemo manages history, not live coding |
| Plugin/extension system | Out of scope for v1; Skill system provides extensibility |
| Video/audio session export | Text-only tool |
| Mobile app | Desktop-first; web UI is responsive but not mobile-native |
| Automated CI/CD pipeline integration | Manual workflow; no CI/CD hooks in v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAN-01 through SCAN-07 | Phase 1 | Pending |
| STOR-01 through STOR-05 | Phase 1 | Pending |
| CLIC-01 through CLIC-06 | Phase 1 | Pending |
| CLIC-09, CLIC-10 | Phase 1 | Pending |
| SECR-01 through SECR-06 | Phase 2 | Pending |
| APIE-01 through APIE-13 | Phase 2 | Pending |
| CLIC-07, CLIC-08 | Phase 2 | Pending |
| BROW-01 through BROW-06 | Phase 3 | Pending |
| SRCH-01 through SRCH-05 | Phase 3 | Pending |
| RSUM-01 through RSUM-03 | Phase 3 | Pending |
| UIUX-01 through UIUX-07 | Phase 3 | Pending |
| EXPT-01 through EXPT-06 | Phase 4 | Pending |
| REDN-01 through REDN-04 | Phase 4 | Pending |
| AIAN-01 through AIAN-08 | Phase 4 | Pending |
| SKIL-01 through SKIL-08 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 88 total
- Mapped to phases: 88
- Phase 1: 20 (SCAN 7 + STOR 5 + CLIC 8)
- Phase 2: 21 (SECR 6 + APIE 13 + CLIC 2)
- Phase 3: 21 (BROW 6 + SRCH 5 + RSUM 3 + UIUX 7)
- Phase 4: 26 (EXPT 6 + REDN 4 + AIAN 8 + SKIL 8)
- Unmapped: 0

---
*Requirements defined: 2026-05-29*
*Last updated: 2026-05-29 after roadmap creation*
