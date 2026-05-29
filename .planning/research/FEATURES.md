# Feature Research

**Domain:** AI Coding Session Management & Visualization
**Researched:** 2026-05-29
**Confidence:** MEDIUM

Research combined Context7 documentation (Claude Code, aider), web research on competitive tools (AiderDesk, AgentAPI, Continue.dev), and direct analysis of Claude Code transcript format and session management capabilities. No existing tool provides cross-project session visualization + AI analysis + skill extraction in a single package.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Transcript scan & index | Claude Code users have transcripts in `~/.claude/projects/` and expect tools to find them automatically | MEDIUM | Must handle path encoding bug #40946 (non-ASCII chars replaced with `-`, guaranteed collisions for CJK paths). Use directory scanning, not reverse encoding. `claude-code-transcripts` crate handles parsing. |
| Session list view | Users expect to see all sessions across projects, not dig through directories | MEDIUM | Session Brief cards with auto-generated titles (first user message), project name, timestamp, message count, status indicator. Cross-project aggregation is key differentiator from Claude Code's built-in `--resume` picker. |
| Session detail / inspector | Clicking a session must show its full content | HIGH | Three-column layout: timeline (color-coded by type), raw content, session card. Virtual scrolling for long sessions (react-virtuoso). Responsive breakpoints at 1280px/1024px. |
| Full-text search | Any tool managing text data must be searchable | HIGH | FTS5 + jieba-rs for Chinese tokenization. Filter syntax: `project:/branch:/status:/has:errors`. Chinese IME compatibility essential for target market. Performance target: 10K messages < 300ms. |
| Session status detection | Users need to know which sessions are active vs done vs broken | LOW | Auto-detect: in-progress (still appending), completed (clean exit), interrupted (mid-tool-call), unrecoverable (corrupted). Derived from transcript tail analysis. |
| Export (Markdown + JSONL) | Users expect to get data out in usable formats | MEDIUM | Full export with complete thinking process. Safe-share variant with 12-rule sanitization (API keys, AWS creds, GitHub tokens, JWT, SSH keys, DB connection strings, etc.). |
| Dark/light theme | Modern tools must respect OS preference and allow manual toggle | LOW | CSS custom properties approach. Follow `prefers-color-scheme`. Toggle in UI header. |
| Empty state design | First-time users need guidance, not a blank screen | LOW | Icon + description + guided action (e.g., "Run `ccmemo scan` to index your sessions"). `ccmemo demo` imports sample conversations for cold start. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cross-project session browser | No other tool lets you see ALL Claude Code sessions across every project in one place. Claude Code's built-in picker is single-project only. | MEDIUM | This is the "aha moment" feature. Aggregate from `~/.claude/projects/<encoded-path>/` across all project directories. Session Brief cards with project tag, branch, duration, tool call stats. |
| AI-powered document generation (4 templates) | Turn any session into a structured artifact: Bug Runbook, Technical Proposal, PRD, or Learning Note. No manual synthesis needed. | HIGH | Requires LLM integration (local-first: user's own API key or local model). Templates must extract: problem statement, solution steps, code changes, lessons learned. This is the highest-value differentiator. |
| Skill Forge | Extract reusable Agent Skills from successful sessions. Unique capability not found in any competitor. | HIGH | Analyze session patterns, extract tool usage sequences, generate installable Skill files with frontmatter metadata. Static validation: naming, structure, sensitive info detection. Security: per-line audit + injection detection + install isolation + hash verification. |
| Safe Resume | Resume interrupted sessions with pre-flight safety checks: project path exists, CLI available, shell format valid. Claude Code's `--resume` has no safety checks. | MEDIUM | Three-gate check: (1) project directory still exists, (2) claude CLI is on PATH, (3) shell environment format is compatible. Show user exactly what will happen before resuming. |
| Incremental scan with live append | Index active sessions as they are being written, not just completed ones. | MEDIUM | Watch for file changes (inotify/polling). Handle partial JSONL lines gracefully. `TranscriptEvent` includes `fileOffset` + `byteLength` for O(1) seek to raw JSON without linear scan. |
| Sanitized sharing export | 12-rule automatic sanitization lets users share sessions without leaking secrets. No competitor offers this. | MEDIUM | Regex-based detection for: API keys, AWS credentials, GitHub tokens, JWTs, SSH private keys, DB connection strings, private IPs, email addresses, file paths with usernames, environment variable values, credit card numbers, phone numbers. User reviews redacted output before sharing. |
| Session analytics dashboard | Show patterns across sessions: most-used tools, common error patterns, time spent, cost tracking. | MEDIUM | Aggregate statistics from indexed data. Tool call frequency, error rate by type, session duration distribution, project activity heatmap. AiderDesk has basic cost tracking; CCMemo can go deeper with cross-project insights. |
| CLI + Web dual interface | Full functionality from both CLI (`ccmemo scan/list/show/resume/export/summarize/skill/serve/demo`) and browser-based UI. | MEDIUM | Axum serves both API and static SPA. CLI is the primary interface for automation; Web UI for visualization and exploration. Single binary distribution. |
| i18n (Chinese + English) | Chinese developer market is underserved by AI coding tools. Full Chinese UI + Chinese FTS support. | MEDIUM | jieba-rs tokenization for search. UI string extraction. Chinese IME compatibility in search input. Not just translation -- Chinese-aware search behavior. |
| Local API security | 127.0.0.1 binding + random port + bearer token + Host header validation prevents local network attacks. | LOW | Essential for `ccmemo serve` mode. Generate token at startup, print to terminal. Reject non-localhost connections. Validate Host header to prevent DNS rebinding. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Cloud sync / multi-device | "I want my sessions everywhere" | Violates local-first privacy principle. Introduces authentication, encryption-at-rest, conflict resolution, server costs. Scope explosion that delays v1. | Local-first with manual export. If sync is needed later, use file-based sync (Syncthing, Dropbox) on the SQLite database file. |
| Tauri desktop app | "Native app feels better" | Doubles the build complexity. Two separate UI rendering paths. Auto-update mechanism needed. Platform-specific bugs. The project already has `ccmemo serve` for browser access. | Web UI via `ccmemo serve` covers all platforms. Single binary, zero install friction. Browser tabs are the "desktop app." Defer Tauri to v0.5 as stated in PROJECT.md. |
| Real-time collaboration on sessions | "My team should see sessions live" | Requires WebSocket infrastructure, presence tracking, conflict resolution, permission model. Completely changes architecture from local tool to multi-user service. | Export-and-share workflow. Sanitized export lets teams share insights without live collaboration. |
| AI-powered session auto-categorization | "Automatically tag and organize my sessions" | LLM calls on every session is expensive and slow. Categorization quality is unreliable. Users disagree with auto-tags. Creates maintenance burden for tag taxonomy. | Simple heuristic categorization (by project, status, tool usage). Let users manually tag. AI templates for on-demand analysis are more valuable than automatic categorization. |
| Plugin / extension system | "Let users extend CCMemo" | Premature abstraction. Plugin APIs freeze internal architecture. Security surface area explodes (third-party code accessing session data). Maintenance burden for API stability. | Well-defined export formats (Markdown, JSONL). If extensibility is needed, provide hooks via CLI piping, not a plugin system. |
| Custom LLM provider configuration | "Let me plug in any LLM for analysis" | Abstracting over LLM APIs is a deep rabbit hole. Streaming, tool calling, context window management all differ. Each provider needs testing. | Support 1-2 providers initially (Anthropic API + OpenAI-compatible endpoint). Hard-coded templates optimized for specific models. Add providers when demand is proven. |
| Visual diff of code changes in session | "Show me what changed side-by-side" | Requires parsing code blocks from messages, matching to actual file state, generating diffs. Extremely fragile -- messages may reference code that no longer exists, or partial snippets. | Link to git commits when available. Show tool call parameters (file path + edit content) in structured form, not as a visual diff. |
| Multi-user authentication system | "I want to share CCMemo with my team" | Local tool running on localhost doesn't need multi-user auth. Adding auth means session management, password hashing, cookie handling, CSRF protection -- all for a single-user tool. | Bearer token for local API access. Single-user assumption keeps architecture simple. Team sharing via exported artifacts, not shared instances. |

## Feature Dependencies

```
[Transcript Scan & Index]
    └──requires──> [SQLite + FTS5 Schema]
                       └──requires──> [claude-code-transcripts crate]

[Session List View]
    └──requires──> [Transcript Scan & Index]
    └──requires──> [Session Status Detection]

[Session Inspector]
    └──requires──> [Session List View]
    └──requires──> [Virtual Scroll (react-virtuoso)]
    └──requires──> [Timeline Color Coding]

[Full-Text Search]
    └──requires──> [Transcript Scan & Index]
    └──requires──> [jieba-rs Chinese Tokenizer]
    └──requires──> [Search Syntax Parser]

[Export (Markdown/JSONL)]
    └──requires──> [Transcript Scan & Index]
    └──requires──> [Session Inspector] (for context)

[Sanitized Sharing Export]
    └──requires──> [Export (Markdown/JSONL)]
    └──requires──> [12-Rule Sanitization Engine]

[AI Document Generation]
    └──requires──> [Transcript Scan & Index]
    └──requires──> [LLM Integration Layer]
    └──requires──> [Template System (4 templates)]
    └──enhances──> [Export (Markdown/JSONL)]

[Skill Forge]
    └──requires──> [AI Document Generation]
    └──requires──> [Skill Static Validator]
    └──requires──> [Skill Security Auditor]
    └──requires──> [Transcript Scan & Index]

[Safe Resume]
    └──requires──> [Session Status Detection]
    └──requires──> [Transcript Scan & Index]
    └──conflicts──> [Active session append] (must detect append-in-progress)

[Incremental Scan + Live Append]
    └──requires──> [Transcript Scan & Index]
    └──requires──> [File Watcher (inotify/polling)]
    └──enhances──> [Session Status Detection]

[CLI Commands]
    └──requires──> [Transcript Scan & Index]
    └──requires──> [All core features via programmatic API]

[Web UI]
    └──requires──> [Axum HTTP Server]
    └──requires──> [Local API Security]
    └──requires──> [All core features via REST API]

[Session Analytics Dashboard]
    └──requires──> [Transcript Scan & Index]
    └──enhances──> [Session List View]
```

### Dependency Notes

- **AI Document Generation requires Transcript Scan & Index + LLM Integration:** Cannot analyze sessions without indexed data. LLM integration is the most architecturally significant dependency -- it must be designed before templates.
- **Skill Forge requires AI Document Generation + Validators:** Skill extraction builds on AI analysis capability. The static validator and security auditor are independent but must be complete before Skill Forge can ship.
- **Safe Resume conflicts with Active Session Append:** If a session is being actively written to, resume must detect this and either wait or warn the user. Two processes writing to the same JSONL file is dangerous.
- **CLI requires programmatic API:** Every CLI command must call the same Rust core that the Web UI calls via REST. No duplicate logic paths.
- **Web UI requires Local API Security first:** Serving a web UI without security bindings invites local network attacks. Security must be implemented before UI ships.
- **Full-Text Search requires jieba-rs:** Chinese tokenization is not optional for the target market. FTS5 without jieba produces garbage for Chinese text. This dependency is on the critical path.
- **Export + Sanitization are tightly coupled:** Sanitized export is a variant of regular export with an additional processing step. Build export first, then add sanitization layer.

## MVP Definition

### Launch With (v0.1)

Minimum viable product -- what is needed to validate the concept.

- [ ] **Transcript scan & index** -- Without this, nothing else works. First thing to build.
- [ ] **Session list view (CLI + Web)** -- Users must see their sessions to believe the tool works.
- [ ] **Session inspector (Web)** -- Viewing session content validates data integrity.
- [ ] **Session status detection** -- Essential for knowing which sessions are useful.
- [ ] **Full-text search** -- The "find that conversation" moment. Core value proposition.
- [ ] **Export (Markdown/JSONL)** -- Getting data out proves the tool is not a silo.
- [ ] **CLI commands (scan/list/show/export/serve/demo)** -- CLI is the entry point. `serve` launches Web UI.
- [ ] **Empty state + demo mode** -- Cold start experience. Users need to see value immediately.
- [ ] **Dark/light theme** -- Low effort, high perceived quality.
- [ ] **Local API security** -- Required before `ccmemo serve` is usable.

### Add After Validation (v0.1.x - v0.2)

Features to add once core is working and validated.

- [ ] **Sanitized sharing export** -- Trigger: users want to share sessions publicly. Build the 12-rule engine.
- [ ] **AI document generation (1-2 templates)** -- Trigger: users want more than raw transcripts. Start with Bug Runbook and Technical Proposal.
- [ ] **Safe Resume** -- Trigger: users want to continue interrupted sessions from CCMemo.
- [ ] **Incremental scan + live append** -- Trigger: users complain about re-scanning. File watching optimization.
- [ ] **i18n (Chinese)** -- Trigger: Chinese-language users in the wild. jieba-rs integration for search.
- [ ] **Session analytics dashboard** -- Trigger: users have 100+ sessions and want patterns.

### Future Consideration (v0.3+)

Features to defer until product-market fit is established.

- [ ] **Skill Forge** -- Complex feature requiring AI analysis + validators + security auditor. Defer until AI document generation proves the analysis pipeline.
- [ ] **Skill static validation + security audit** -- Depends on Skill Forge. Must be bulletproof before release.
- [ ] **Additional AI templates (PRD, Learning Note)** -- Add after Bug Runbook and Technical Proposal are validated.
- [ ] **Session analytics v2 (cost tracking, time estimates)** -- Requires calibration data from real usage.
- [ ] **SQLCipher encryption** -- Trigger: users with sensitive sessions wanting at-rest encryption. (v0.4+ per PROJECT.md)
- [ ] **OS Keychain integration** -- Trigger: API key management becomes a pain point. (v0.4+ per PROJECT.md)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Transcript scan & index | HIGH | MEDIUM | P1 |
| Session list view | HIGH | MEDIUM | P1 |
| Session inspector | HIGH | HIGH | P1 |
| Session status detection | MEDIUM | LOW | P1 |
| Full-text search | HIGH | HIGH | P1 |
| Export (Markdown/JSONL) | HIGH | MEDIUM | P1 |
| CLI commands | HIGH | MEDIUM | P1 |
| Empty state + demo | MEDIUM | LOW | P1 |
| Dark/light theme | LOW | LOW | P1 |
| Local API security | MEDIUM | LOW | P1 |
| Sanitized sharing export | MEDIUM | MEDIUM | P2 |
| AI document generation | HIGH | HIGH | P2 |
| Safe Resume | MEDIUM | MEDIUM | P2 |
| Incremental scan | MEDIUM | MEDIUM | P2 |
| i18n (Chinese) | MEDIUM | MEDIUM | P2 |
| Session analytics | MEDIUM | MEDIUM | P2 |
| Skill Forge | HIGH | HIGH | P3 |
| Skill validation + security | MEDIUM | HIGH | P3 |
| Session analytics v2 | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Claude Code Built-in | Aider | AiderDesk | AgentAPI | CCMemo Approach |
|---------|---------------------|-------|-----------|----------|-----------------|
| Session visualization | None (CLI picker only) | None | Chat history view | None | Three-column Web UI with timeline, raw content, session card |
| Cross-project search | None (single project) | None | Multi-project | None | FTS5 + jieba-rs across all `~/.claude/projects/` |
| Session resume | `--resume`, `--continue` flags | Yes (via `.aider.chat.history.md`) | Yes | Yes (via API) | Safe Resume with pre-flight checks |
| Export | `/export` (Markdown only) | Git commits with messages | N/A | N/A | Markdown + JSONL with optional sanitization |
| AI analysis | None | None | None | None | 4 template types: Bug Runbook, Tech Proposal, PRD, Learning Note |
| Skill extraction | None (CLAUDE.md manual) | None | None | None | Skill Forge: session-to-installable-skill pipeline |
| Search | None | None | None | None | FTS5 full-text with filter syntax and Chinese support |
| Cost tracking | None | Token counting | Yes (basic) | None | Aggregate analytics from transcript tool calls |
| Desktop GUI | None (terminal only) | Terminal only | Yes (Electron) | No (API only) | Browser-based via `ccmemo serve`, no Electron |
| Session status | None | None | None | None | Auto-detect: active/completed/interrupted/unrecoverable |
| Live session monitoring | None | None | None | Yes (real-time API) | Incremental scan with file watching |
| Security | API key in env | API key in env | API key in env | Bearer token | 127.0.0.1 + random port + bearer token + Host validation |

### Competitive Position Summary

**CCMemo fills a gap that no single tool addresses:** Claude Code stores rich session data in JSONL but provides zero visualization or cross-session intelligence. AiderDesk comes closest with a GUI but is aider-specific and lacks analysis features. AgentAPI provides real-time agent control but no historical analysis. CCMemo's unique position is turning raw transcripts into **searchable, analyzable, and reusable** engineering memory.

The three-layer value proposition:
1. **See what happened** (visualization layer -- table stakes that Claude Code lacks)
2. **Understand patterns** (analysis layer -- AI-powered document generation, no competitor offers this)
3. **Extract reusable skills** (skill forge layer -- completely unique, no competitor exists)

## Sources

- Claude Code documentation via Context7 (session management, `--resume`, `--continue`, `/export`, memory system)
- `claude-code-transcripts` crate on crates.io (strongly-typed Entry variants, fileOffset/byteLength)
- Aider GitHub repository (chat history format, git-based session management)
- AiderDesk (hotovo/aider-desk) -- desktop GUI for aider with multi-project management
- AgentAPI (coder/agentapi) -- HTTP API for coding agent control
- Claude Code path encoding bug #40946 (non-ASCII char replacement, collision risk)
- Project constraints from `.planning/PROJECT.md` (performance targets, tech stack, scope boundaries)

---
*Feature research for: AI Coding Session Management & Visualization*
*Researched: 2026-05-29*
