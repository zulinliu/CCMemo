# Pitfalls Research

**Domain:** Rust CLI + SQLite/FTS5 + Axum Web UI (Claude Code session management)
**Researched:** 2026-05-29
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: SQLite WAL Mode Locks Up Under Concurrent Access

**What goes wrong:**
SQLite WAL mode has a single-writer constraint. When the scan/index worker thread holds a write lock and the Axum API handler tries to write (e.g., updating a scan bookmark), the API thread gets `SQLITE_BUSY` immediately with default `busy_timeout=0`. The UI appears frozen. Worse, if long-running read transactions block checkpointing, the WAL file grows unbounded, consuming disk space and degrading read performance.

**Why it happens:**
Developers enable WAL mode and assume it solves all concurrency problems. WAL allows concurrent readers + one writer, but the "one writer" part is a hard limit. The default busy_timeout is zero, so write contention fails immediately rather than waiting. The scan worker doing batch inserts of thousands of transcript events holds the write lock for extended periods.

**How to avoid:**
- Set `PRAGMA busy_timeout = 5000;` (or higher) on every connection so writers wait rather than fail immediately.
- Use a single write connection pooled through a `Mutex<Connection>` or `tokio::sync::Mutex`. All writes serialize through it.
- Open separate read-only connections (`PRAGMA query_only = ON`) for API handlers to avoid read/write contention entirely.
- Perform batch writes in explicit transactions (BEGIN IMMEDIATE ... COMMIT) with reasonable batch sizes (100-500 rows per transaction).
- Monitor WAL file size; schedule periodic `PRAGMA wal_checkpoint(TRUNCATE)` during idle periods.

**Warning signs:**
- `SQLITE_BUSY` errors in logs during concurrent scan + browse operations.
- WAL file growing past 10MB during normal operation.
- UI latency spikes correlated with background scanning.
- Test: run `ccmemo scan` in one terminal while browsing sessions in the Web UI.

**Phase to address:**
Phase 1 (Core Engine + Storage). The connection pooling strategy and busy_timeout must be established when the storage layer is first built. Retrofitting WAL concurrency handling after the fact requires touching every database access path.

---

### Pitfall 2: FTS5 With Default Tokenizer Silently Fails on Chinese

**What goes wrong:**
FTS5 with the default `unicode61` tokenizer splits Chinese text into individual characters, not words. Searching for "错误处理" (error handling) requires exact character-by-character match; partial word matches like "错误" fail because FTS5 treats each character as a separate token. Chinese users get zero or wrong results and assume the search is broken.

**Why it happens:**
`unicode61` is Unicode-aware but not segmentation-aware. It knows word boundaries for space-delimited languages (English, etc.) but Chinese has no spaces between words. The tokenizer falls back to single-character tokenization, which technically "works" but produces garbage relevance and misses multi-character word matches.

**How to avoid:**
- Use `jieba-rs` as a custom FTS5 tokenizer via the C tokenizer API exposed through rusqlite's `fts5` extension hooks.
- Register the jieba tokenizer when initializing the SQLite connection, before creating FTS5 tables.
- Create the FTS5 table with `TOKENIZE=jieba` (custom tokenizer name): `CREATE VIRTUAL TABLE IF NOT EXISTS transcript_fts USING fts5(content, tokenize='jieba');`
- Test with actual Chinese transcript content from day one. Do not defer Chinese search testing to "later."
- Be aware: `jieba-rs` embeds a ~10MB dictionary. This increases binary size. Accept it; there is no lighter alternative that handles Chinese segmentation correctly.

**Warning signs:**
- Chinese searches only work for single-character queries.
- `EXPLAIN QUERY PLAN` shows full table scan instead of FTS index usage for Chinese terms.
- bm25 ranking gives equal scores to all Chinese results (because each character is a separate token with equal frequency).

**Phase to address:**
Phase 1 (Core Engine + Storage). The FTS5 tokenizer choice determines table schema. Changing tokenizers requires `DROP TABLE` + rebuild. There is no migration path from `unicode61` to `jieba` on an existing FTS5 table.

---

### Pitfall 3: rusqlite `bundled-full` Feature Causes Cross-Compilation Failures

**What goes wrong:**
The `bundled-full` feature in rusqlite compiles SQLite from C source with all extensions enabled (including FTS5). This works on the developer's machine but fails during cross-compilation because: (a) the C cross-compiler toolchain must be installed, (b) target-specific `CC` environment variables must be set, (c) some build environments (CI, musl targets) lack the necessary C compiler headers. Build failures appear as cryptic `cc` crate errors, not SQLite errors.

**Why it happens:**
`bundled-full` pulls in `libsqlite3-sys` with `bundled` mode, which compiles SQLite C code using the `cc` crate. The `cc` crate needs a working C compiler for the target architecture. On Linux, cross-compiling from x86_64 to aarch64 requires `aarch64-linux-gnu-gcc` installed. For musl static builds (common for single-binary distribution), the `musl-gcc` wrapper must be present.

**How to avoid:**
- Pin `bundled-full` in `Cargo.toml` as the only SQLite feature: `rusqlite = { version = "0.32", features = ["bundled-full"] }`. Do not combine with `bundled` or other subset features.
- Set up CI with cross-compilation from day one, even if initial release is single-platform.
- For musl static builds (recommended for single-binary distribution), use the `rust:alpine` Docker image or install `musl-tools` on Ubuntu-based CI.
- Document the exact C compiler dependencies in the project README build section.
- Consider using `cargo-zigbuild` as an alternative to `cross` for simpler cross-compilation -- Zig bundles its own C cross-compiler toolchain.

**Warning signs:**
- Build succeeds on developer machine but fails on CI.
- Error messages reference `cc` or `gcc` not found, not `rusqlite`.
- `cargo build --target aarch64-unknown-linux-gnu` fails but `cargo build` (native) succeeds.

**Phase to address:**
Phase 1 (Core Engine). The SQLite compilation strategy is foundational. If the first release only targets one platform, set up cross-compilation CI anyway -- it is much harder to add later when the codebase has grown and hidden platform-specific assumptions.

---

### Pitfall 4: JSONL Streaming Parser Breaks on In-Progress Sessions

**What goes wrong:**
Claude Code writes transcript JSONL files by appending lines during active sessions. A streaming parser reading the file may encounter: (a) a partial line at the end (the session is mid-write), (b) a line that is valid JSON but truncated mid-stream (tool use content being written character by character), (c) the file growing between the parser's initial size check and its read loop. The parser crashes with a JSON parse error or silently drops the last event.

**Why it happens:**
Most JSONL parsers assume the file is complete and static. They read lines, parse each as complete JSON, and stop at EOF. But for append-only files being written by another process, "EOF" is a moving target. The last line may be incomplete because the writing process has not finished flushing it.

**How to avoid:**
- Use the `claude-code-transcripts` crate which is designed for this exact use case and handles streaming edges.
- When reading without the crate: buffer the last line. If it does not end with `\n`, keep it in a buffer and retry on the next scan tick.
- Track file position (byte offset) from previous scan. On re-scan, seek to the last known offset and read only new content.
- Mark incomplete lines as "pending" events. Do not error on them. Re-process on the next incremental scan.
- Use `file_modified_time` + `file_size` as a cheap change detection heuristic before re-reading.

**Warning signs:**
- Parse errors on the last line of session files that are currently active.
- Session count changes between scans without new sessions starting.
- Tool call events with truncated content (missing closing `}`).

**Phase to address:**
Phase 1 (Core Engine). The JSONL parsing strategy determines the entire data ingestion pipeline. Retrofitting incremental/streaming parsing after building a batch-only parser requires rewriting the scan loop.

---

### Pitfall 5: FTS5 External Content Table Drift

**What goes wrong:**
Using FTS5 with `content=''` (contentless) or `content=transcript_events` (external content) avoids duplicating data but introduces consistency risks. If rows are deleted from the content table without corresponding FTS5 updates, searches return phantom rows pointing to non-existent content. If FTS5 indexes stale data, searches miss recently indexed events. The `rebuild` command locks the table.

**Why it happens:**
FTS5 with external content does not automatically synchronize with the content table. The developer must manually issue `INSERT INTO transcript_fts(transcript_fts) VALUES('rebuild')` or use triggers to keep them in sync. The `content=` table is an optimization, not a transparent cache.

**How to avoid:**
- Prefer `content=''` (contentless FTS5) for the initial implementation. Store only the rowid and tokenized index. Retrieve full content from the main `transcript_events` table by rowid after FTS returns matches.
- If using external content tables, create SQLite triggers: `AFTER INSERT ON transcript_events` to insert into FTS, `AFTER DELETE` to delete from FTS, `AFTER UPDATE` to update FTS.
- Run integrity check periodically: `INSERT INTO transcript_fts(transcript_fts) VALUES('integrity-check')`. This returns an error string if content is out of sync.
- Never run `rebuild` on a production database while the UI is active -- it locks the FTS table.

**Warning signs:**
- Search returns results that link to deleted sessions.
- Newly scanned content does not appear in search results.
- `integrity-check` returns non-empty error strings.

**Phase to address:**
Phase 1 (Core Engine + Storage). FTS5 table schema and content strategy must be decided at table creation time. Changing from contentless to external content requires recreating the FTS5 table.

---

### Pitfall 6: Axum SPA Fallback Catches API Routes

**What goes wrong:**
When serving a React SPA from Axum, the typical pattern is `Router::new().fallback(static_file_service)`. But if API routes are registered before the fallback, a request to `/api/sessions` that returns a 404 (e.g., wrong HTTP method, malformed ID) gets caught by the SPA fallback and returns `index.html` with status 200 instead of a proper 404 JSON error. The client receives HTML when it expects JSON.

**Why it happens:**
Axum's `fallback` is a catch-all for any request that does not match a route. API routes that return 404 are still "matched" routes, so this specific scenario is fine for simple setups. The problem arises when API routes are nested under a `/api` prefix and the nesting/ordering is wrong, or when the SPA fallback is registered as a route instead of a true fallback. Also, requests to `/api/nonexistent-endpoint` do get caught by the fallback if no API route matches that path.

**How to avoid:**
- Register all API routes under a dedicated `/api` prefix using `Router::nest("/api", api_routes)`.
- Apply the SPA fallback only to the root router, after nesting API routes.
- Use `tower_http::services::ServeDir` for static assets with a fallback to `index.html` for SPA client-side routing.
- Add explicit 404 handling within the API router that returns JSON: `Json(json!({"error": "not found"}))` with status 404.
- Order: API routes first (nested), then static assets, then SPA index.html fallback.

**Warning signs:**
- API responses sometimes return HTML (`<!DOCTYPE html>`) instead of JSON.
- Browser console shows JSON parse errors on API calls that should be 404.
- `curl /api/nonexistent` returns `index.html` content.

**Phase to address:**
Phase 2 (Web UI + API). The routing structure must be correct when the Axum server is first set up. It is straightforward to fix but easy to miss in testing if only happy-path API calls are tested.

---

### Pitfall 7: React Virtuoso Jumps With Dynamic-Height Chat Messages

**What goes wrong:**
Chat transcripts have highly variable message heights: a one-line user message might be 40px, while a long code block from Claude might be 800px. React Virtuoso's virtual scrolling relies on estimated heights to calculate scroll positions. When estimates are wrong, scrolling jumps violently as the actual heights are measured and the scroll position recalculates. For a session with 500+ messages, the experience is unusable.

**Why it happens:**
Virtuoso's default `heightEstimates` function returns a fixed height for all items. When a 40px item is estimated at 200px and an 800px item is also estimated at 200px, the total estimated scroll height is wildly wrong. As the user scrolls, Virtuoso measures actual heights, discovers the discrepancy, and adjusts the scroll position, causing visible jumps.

**How to avoid:**
- Use `VirtuosoMessageList` component (designed specifically for chat/message interfaces) instead of raw `Virtuoso`.
- Provide a custom `heightEstimates` function that classifies messages by type. Estimate user messages at ~60px, assistant text at ~120px, code blocks at ~400px, tool calls at ~200px.
- Use `initialItemCount={20}` to render a manageable first batch and let Virtuoso calibrate.
- Set `overscan={5}` to render a few items above/below the viewport for smoother scrolling.
- For the timeline view, consider grouping consecutive small messages into "message groups" to reduce item count and height variance.
- Test with a real 1000-message session early. Do not test only with short sessions.

**Warning signs:**
- Scroll position jumps when loading a long session.
- "Scroll to bottom" button lands in the middle of the conversation.
- Performance degrades (frame drops) on sessions with 500+ messages.

**Phase to address:**
Phase 2 (Web UI). The virtual scrolling configuration must be tested with realistic data from the start. Build a test fixture with a 1000-message session and use it during development.

---

### Pitfall 8: Local API Security Bypass via DNS Rebinding

**What goes wrong:**
CCMemo binds to `127.0.0.1` with a random port and bearer token. But a malicious website can use DNS rebinding: it serves a page from `evil.com` that resolves to `127.0.0.1` via a custom DNS record, then makes fetch requests to `http://127.0.0.1:{random_port}/api/sessions`. If the browser sends the request (no CORS preflight for simple requests), the malicious site reads session data including transcript content. The bearer token alone does not prevent this because the attacker does not need the token if CORS headers are permissive.

**Why it happens:**
Developers assume `127.0.0.1` binding is sufficient security because only local processes can connect. But browsers are local processes, and any website the user visits can make requests to localhost. CORS headers are the browser-enforced boundary. If the Axum server returns `Access-Control-Allow-Origin: *` or does not validate the `Origin` header, any website can access the API.

**How to avoid:**
- Validate the `Host` header on every API request: reject anything not matching `127.0.0.1:{port}` or `localhost:{port}`.
- Validate the `Origin` header on every API request: reject any non-empty Origin that is not `http://127.0.0.1:{port}` or `http://localhost:{port}`.
- Do NOT use `Access-Control-Allow-Origin: *`. Return the specific origin only if it matches.
- Generate a random bearer token on server start. Print it to CLI stdout. The Web UI must read it from the startup URL or a local file. Never accept token via query parameter (it appears in logs and browser history).
- Consider additional CSRF protection: require a custom header (e.g., `X-Requested-With: CCMemo`) that browsers do not send in cross-origin requests.

**Warning signs:**
- API responds to requests with `Origin: https://evil.com` without rejection.
- Bearer token is passed as a URL query parameter.
- CORS headers return `*` or echo back any origin.

**Phase to address:**
Phase 2 (Web UI + API). Security middleware must be in place before the Web UI is functional. This is a launch blocker, not a "fix later" item.

---

### Pitfall 9: Chinese IME Composition Breaks Search Input

**What goes wrong:**
When a Chinese user types search queries using an Input Method Editor (IME), the search input fires `onChange` events for every composition character. If the search is debounced and triggers on each keystroke, intermediate pinyin characters trigger useless searches. The user types "cuo wu" (pinyin for "error") and the UI searches for "c", "cu", "cuo", "cuo ", "cuo w", "cuo wu" before finally settling on the intended Chinese characters. This wastes FTS5 queries and produces irrelevant intermediate results.

**Why it happens:**
React's `onChange` fires for every composition update in most browsers. The search debounce (typically 200-300ms) is shorter than the time a user takes to select the correct Chinese character from the IME candidate list. The intermediate pinyin is sent to the search backend where it either matches nothing or matches random content.

**How to avoid:**
- Use `compositionstart` and `compositionend` events on the search input.
- During composition (between start and end), do not fire search queries. Buffer the input.
- On `compositionend`, fire the search with the final committed text.
- Alternatively, use `React`'s synthetic event system which handles `onCompositionStart` / `onCompositionEnd` / `onCompositionUpdate`.
- Increase debounce to 500ms for search inputs. This accommodates both IME users and fast typists.
- Test with actual Chinese IME input (ibus, fcitx, macOS pinyin) on all target platforms.

**Warning signs:**
- Search flickers through multiple result sets while typing Chinese characters.
- Network tab shows FTS5 queries with partial pinyin strings.
- Chinese users report "search doesn't work" because intermediate results are confusing.

**Phase to address:**
Phase 2 (Web UI). Search input handling must include IME composition awareness from the first implementation. It is a small code change but hard to discover through automated testing.

---

### Pitfall 10: Crash Dumps and Logs Contain Session Content With API Keys

**What goes wrong:**
When CCMemo crashes (panic, segfault in SQLite C code, OOM on large sessions), the crash dump may contain stack traces that reference session content. More commonly, debug/error logging inadvertently logs full transcript event content including API keys that Claude Code used in tool calls. The `safe_share` export feature sanitizes output, but internal logging does not apply the same 12-rule sanitization.

**Why it happens:**
Rust's `Debug` derive trait prints entire struct contents. If a `TranscriptEvent` struct has a `Debug` impl and gets logged in an error path (e.g., "failed to parse event: {:?}", event), the entire event content including any API keys embedded in tool call arguments is written to the log. Error paths are rarely tested for data leakage.

**How to avoid:**
- Never derive `Debug` on structs that contain raw transcript content. Implement a custom `Debug` that truncates or redacts sensitive fields.
- Create a `SanitizedDebug` wrapper or `Redacted` newtype for transcript content fields.
- Audit all `error!()` and `warn!()` calls in the codebase for accidental content logging. Use `tracing`'s field-level redaction: `error!(event_id = %id, "parse failed")` instead of `error!(event = ?event, "parse failed")`.
- Apply the 12-rule sanitization (API key, AWS credentials, GitHub token, JWT, SSH, DB connection string patterns) to any log output that might contain raw transcript data.
- Set up a CI lint check that flags `{:?}` formatting on transcript-related types.
- Ensure panic hooks do not dump struct contents. Use `std::panic::set_hook` to control panic output.

**Warning signs:**
- Log files contain recognizable API key patterns (sk-..., ghp_..., AKIA...).
- `RUST_BACKTRACE=full` output shows struct field values in stack frames.
- Error messages include raw JSONL content from transcript files.

**Phase to address:**
Phase 1 (Core Engine). The logging and error handling patterns must be established when transcript parsing is first implemented. Once `Debug` derives are spread across the codebase, auditing and fixing every log site is expensive.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `unicode61` tokenizer instead of jieba-rs | Faster initial setup, smaller binary | Chinese search is fundamentally broken, requires full re-index to fix | Never -- Chinese search is a core requirement |
| Single SQLite connection (no read/write split) | Simpler code, no connection management | `SQLITE_BUSY` errors under concurrent scan + browse | MVP only, must fix before v0.1 release |
| Loading entire JSONL file into memory | Simpler parsing logic | OOM on large sessions (100MB+ JSONL files exist) | Never -- use streaming parser from day one |
| Skipping incremental scan (full re-scan each time) | No bookmark/offset tracking needed | Re-indexing thousands of sessions on every startup, minutes of delay | Acceptable for demo/development only |
| FTS5 without `automerge` configuration | Simpler setup | Index fragmentation causes search latency degradation over time | MVP acceptable, tune before v0.1 release |
| No CORS/Host validation on API | Works locally without headers | DNS rebinding attack vector | Never -- security must be in place before Web UI ships |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| claude-code-transcripts crate | Assuming all entry variants are covered; new variants may be added as Claude Code evolves | Handle unknown variants gracefully with a catch-all branch that logs the unknown type and skips the event |
| SQLite FTS5 with jieba-rs | Registering the custom tokenizer after creating the FTS5 table | Register tokenizer on connection open, before any table creation DDL runs |
| rusqlite bundled-full + musl target | Using default `cc` crate settings for musl cross-compilation | Set `CC=musl-gcc` or use `cargo-zigbuild` with explicit target specification |
| Axum + tower-http ServeDir | Serving `index.html` for all unmatched routes including API 404s | Nest API routes under `/api` prefix with explicit JSON 404 handler, then SPA fallback |
| React Virtuoso + chat layout | Using flat `Virtuoso` with uniform height estimates | Use `VirtuosoMessageList` with per-message-type height estimates and `followOutput` for auto-scroll |
| jieba-rs dictionary | Assuming the default dictionary is sufficient for technical terms | Accept that technical jargon may not segment perfectly; consider adding custom user dictionary entries for Claude Code-specific terms |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| SQLite WAL file grows unbounded | Disk space warnings, slow reads on large WAL | Periodic `PRAGMA wal_checkpoint(TRUNCATE)` during idle; busy_timeout for writes | 10K+ sessions or long-running scan without restart |
| FTS5 index fragmentation | Search latency increases over weeks of use | Configure `automerge=8` and `crisismerge=16` on FTS5 tables | 1000+ sessions with frequent re-scans |
| Full-table scan on transcript_events | Slow session inspector load times | Create index on `(session_id, sequence_num)` for timeline ordering | 500+ events per session |
| React Virtuoso re-renders all items on state change | UI freezes when updating search highlight state | Memoize row components with `React.memo`; derive highlight state from props, not global state | 200+ visible items with live search highlighting |
| JSONL re-parsing on every session view | Multi-second delay opening a session | Cache parsed events in SQLite, use `fileOffset + byteLength` for O(1) seek to raw JSON | Sessions with 500+ events |
| Serving SPA assets without compression | Slow initial page load (200KB+ uncompressed JS) | Enable `tower_http::compression::CompressionLayer` for gzip/brotli static asset serving | Noticeable on any network, including localhost on slow machines |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Bearer token in URL query parameter | Token appears in browser history, server logs, referrer headers | Pass token in `Authorization: Bearer` header only; generate token at server start, print to stdout |
| No `Origin` header validation on API | DNS rebinding allows any website to read session data | Validate `Origin` and `Host` headers on every request; reject non-localhost origins |
| Logging raw transcript content in error paths | API keys, tokens, passwords from session transcripts leak into log files | Custom `Debug` impls that redact content; audit all log macro calls for struct dumping |
| `rusqlite::load_extension` enabled | SQL injection via malicious SQLite extension loading | Never enable `load_extension`; use `bundled-full` which provides all needed extensions statically |
| Sharing export without sanitization | 12 types of credentials leaked in shared Markdown/JSONL exports | Always apply sanitization rules; make raw export require explicit `--unsafe` flag |
| Random port without port scanning | Predictable or already-in-use port causes silent failure or hijacking | Bind to `127.0.0.1:0` (OS assigns random available port); verify the bound port after listen |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Empty state with no guidance | Users install, run `ccmemo`, see nothing, uninstall | Show onboarding: "No sessions found. Run `ccmemo demo` to import sample sessions, or start a Claude Code session to generate transcripts." |
| Search with no results feedback | Users type Chinese query, get zero results, assume search is broken | Show "No results for [query]. Try fewer characters or check your input method." |
| Long session loads blank screen | Large sessions take 2-3 seconds to render Virtuoso, UI appears frozen | Show skeleton/spinner with "Loading N messages..." during initial render |
| Resume button without safety check | User clicks resume on a session from a different project, Claude Code starts in wrong directory | Show Safe Resume dialog: project path, CLI availability, shell format check before executing |
| No progress indicator during scan | `ccmemo scan` runs for minutes on first use with no output | Show progress: "Scanning session 47/312... Found 12,847 events" with ETA |

## "Looks Done But Isn't" Checklist

- [ ] **FTS5 Chinese search:** Often works with single characters but fails on multi-character words -- verify with "错误处理", "会话管理", "代码生成" (2-4 character phrases)
- [ ] **WAL mode persistence:** Often set in code but not persisted across connection reopens -- verify `PRAGMA journal_mode=WAL` returns "wal" after closing and reopening the database
- [ ] **Incremental scan:** Often works for new files but misses appended content in existing files -- verify by scanning a session, then appending to it, then re-scanning
- [ ] **API 404 handling:** Often works for `/api/sessions` but returns HTML for `/api/session/invalid-id` -- verify with `curl -H "Accept: application/json" /api/nonexistent`
- [ ] **Virtual scroll scroll-to-bottom:** Often works on initial load but breaks after new messages appear -- verify by loading a session, then triggering a re-scan that adds events
- [ ] **IME composition:** Often works with English input but double-fires on Chinese -- verify with Chinese IME on macOS, Windows, and Linux
- [ ] **Bearer token auth:** Often enforced on data endpoints but skipped on static assets and WebSocket upgrade -- verify every route handler checks auth
- [ ] **Export sanitization:** Often catches API keys but misses AWS IAM keys (AKIA...) and GitHub tokens (ghp_...) -- verify with test fixture containing all 12 credential patterns
- [ ] **Cross-platform path handling:** Often works on developer's OS but fails on path encoding edge cases -- verify with project paths containing spaces, Unicode, and the known bug #40946 encoding

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong FTS5 tokenizer (unicode61 instead of jieba) | HIGH | Drop FTS5 table, recreate with jieba tokenizer, rebuild index from transcript_events. Requires full re-scan if external content table is also wrong. |
| WAL file grown too large | LOW | Stop server, `PRAGMA wal_checkpoint(TRUNCATE)`, restart. If WAL is corrupted, backup database, `PRAGMA integrity_check`, restore from backup if needed. |
| No incremental scan bookmarks | MEDIUM | Delete ScanBookmark table, run full re-scan. Takes minutes for large collections but no data loss. |
| Logging leaked credentials | HIGH | Rotate all potentially leaked credentials immediately. Audit all log files on the machine. Implement sanitization before next run. |
| API route/SPA fallback conflict | LOW | Restructure Axum Router: nest `/api` routes, add explicit JSON 404, then SPA fallback. No data changes needed. |
| Virtual scroll jumping | MEDIUM | Implement better height estimates based on message type. May require changing the data model to include estimated_height in API responses. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| WAL concurrency (busy_timeout, connection split) | Phase 1: Core Engine | Run scan + browse simultaneously; verify no SQLITE_BUSY errors |
| FTS5 tokenizer (jieba-rs custom tokenizer) | Phase 1: Core Engine | Search Chinese phrases (2-4 chars); verify multi-character word matching |
| rusqlite bundled-full cross-compilation | Phase 1: Core Engine | CI builds for all target platforms; verify musl static build |
| JSONL streaming parser edge cases | Phase 1: Core Engine | Parse active session file while Claude Code is writing to it |
| FTS5 content table consistency | Phase 1: Core Engine | Delete a session, verify FTS returns no results for it; run integrity-check |
| Crash dump/log sanitization | Phase 1: Core Engine | Grep log files for API key patterns after a test crash |
| Axum SPA routing | Phase 2: Web UI | `curl /api/nonexistent` returns JSON 404, not HTML |
| React Virtuoso dynamic heights | Phase 2: Web UI | Load 1000-message session; verify no scroll jumps |
| Local API security (DNS rebinding, CORS) | Phase 2: Web UI | Validate Origin/Host headers; verify `curl -H "Origin: https://evil.com"` is rejected |
| Chinese IME composition handling | Phase 2: Web UI | Type Chinese search with actual IME; verify no intermediate queries fire |
| Export sanitization completeness | Phase 3: AI Analysis + Export | Export session containing all 12 credential patterns; verify none appear in output |
| Safe Resume validation | Phase 3: Session Management | Attempt resume with wrong project path; verify rejection |

## Sources

- SQLite WAL mode documentation: https://www.sqlite.org/wal.html (official)
- SQLite FTS5 extension documentation: https://www.sqlite.org/fts5.html (official)
- rusqlite documentation via Context7: features, WAL hooks, FTS5, load_extension
- Axum documentation via Context7: routing, nesting, fallback, tower-http middleware
- React Virtuoso documentation via Context7: VirtuosoMessageList, heightEstimates, followOutput
- Claude Code known issue #40946: path encoding bug in transcript file paths
- claude-code-transcripts crate: streaming JSONL parsing for Claude Code transcripts
- jieba-rs crate: Rust port of jieba Chinese word segmentation

---
*Pitfalls research for: CCMemo - Claude Code session management tool*
*Researched: 2026-05-29*
