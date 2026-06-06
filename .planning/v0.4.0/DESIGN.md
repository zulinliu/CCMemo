# CCMemo v0.4.0 版本设计方案

**版本主题**：本地工程记忆的实用化闭环  
**日期**：2026-06-06  
**状态**：设计完成，待开发拆分  
**范围约束**：只做 Web 单机闭环；AI 分析与 Skill Forge 仅做设计预留，不接外部 AI，不实施完整 Skill 流程。

## 1. 背景与现状

CCMemo 已经完成从 CLI 工具到品牌化 Web UI 的关键跃迁：Rust Core、SQLite/FTS5、Axum Web Server、React/Tailwind 前端、墨途视觉系统、桌面/移动布局、会话列表、时间线、详情、基础搜索与登录都已具备。当前版本已经能证明“Claude Code 会话可以被浏览和检索”。

但从日常工具角度看，仍缺少完整使用闭环：用户首次启动后无法只靠 Web 完成扫描；恢复会话缺少 Web 检查与命令复制；导出能力仍偏 CLI 且 `--safe` 未形成可信安全导出；本地安全模型与 README/规划承诺不完全一致；结构化搜索语法尚未真正落地；设置与帮助入口缺失。

v0.4.0 的设计目标不是扩张 AI 能力，而是先把“每天真的能用”的路径打通。

## 2. 版本目标

### 2.1 一句话目标

用户从运行 `ccmemo serve` 到完成扫描、搜索、查看、恢复、导出和基础配置，全程可以在本地 Web UI 中完成，并清楚理解数据路径与安全边界。

### 2.2 核心用户故事

1. **作为 Claude Code 高频开发者**，我希望打开 CCMemo 后能直接扫描本地会话，以便不用回到 CLI 才能开始使用。
2. **作为需要恢复上下文的开发者**，我希望在会话详情中看到恢复检查和可复制命令，以便快速回到中断任务。
3. **作为需要沉淀资料的开发者**，我希望安全导出完整会话为 Markdown，以便归档、复盘或后续整理。
4. **作为注重隐私的本地工具用户**，我希望知道 CCMemo 监听在哪里、如何认证、数据存放在哪里，以便放心使用。
5. **作为键盘优先用户**，我希望搜索语法真实可用，以便快速缩小历史会话范围。

### 2.3 成功指标

- 新用户首次打开 Web 后，能在 3 分钟内完成首次扫描并看到会话列表。
- 用户能在 Web 中完成“搜索 → 查看 → Resume 检查 → 复制命令”。
- 用户能在 Web 中完成“选择会话 → 安全导出 Markdown → 复制导出路径”。
- 默认启动不暴露到局域网，未认证请求无法读取业务数据。
- `project:`、`branch:`、`status:`、`has:errors` 搜索语法可被后端解析并验证。

## 3. 范围边界

### 3.1 v0.4.0 必做

- 本地安全基线修正
- Web 扫描入口与扫描状态
- Safe Resume API 与 UI
- Export Service 与 Web 导出入口
- 最小 12 条脱敏规则
- 结构化搜索语法：`project:`、`branch:`、`status:`、`has:errors`
- Settings 只读页与帮助入口
- AI 分析、Skill Forge 的数据结构和入口预留
- README/文档与实际行为对齐

### 3.2 v0.4.0 不做

- 不接 Claude API、OpenAI API 或其他外部 Provider
- 不做完整 AI 文档生成
- 不做完整 Skill Forge 生成、安装、校验闭环
- 不做 Tauri 桌面壳
- 不做 SQLCipher 和 OS Keychain 真集成
- 不做云同步、团队协作、多用户账户

### 3.3 可延期到 v0.4.1

- 完整 Command Palette
- `after:` / `before:` 搜索
- 自定义脱敏规则 UI
- 书签、页边注、决策摘录
- 真 SSE 进度流，如果 polling 已满足体验

## 4. 产品信息架构

```text
目录
  会话列表
  搜索
  项目筛选
  状态筛选
  扫描状态

路线
  时间线
  事件展开
  工具调用摘要
  错误节点

报告
  会话元数据
  Resume Card
  Export Card
  AI 分析预留入口
  Skill Forge 预留入口

设置
  数据路径
  安全状态
  扫描状态
  版本与帮助
```

桌面端保持左中右结构：目录、路线、报告。设置入口从 header 进入。移动端保持底部三 tab，但未选择会话时，“路线”和“报告”必须提供返回目录的明确行动。

## 5. P0 功能设计

## 5.1 安全启动与本地访问控制

### 现状问题

- 服务默认绑定 `0.0.0.0`，与本地优先承诺冲突。
- CORS 允许 Any。
- 默认密码 `123456` 风险高。
- README 提到 token header，前端实际使用 cookie session，认证模型不一致。
- Host 校验为宽松策略，默认允许部分公网 tunnel 场景。

### 目标行为

- 默认监听 `127.0.0.1:0`，随机端口。
- `--host 0.0.0.0` 或类似显式配置才允许局域网访问。
- 启动时生成一次性访问口令，或要求用户通过 `CCMEMO_PASSWORD` 设置密码。
- 认证模型统一为一种主路径：建议 v0.4.0 继续使用 HttpOnly cookie session，但 README 不再宣称必须 `X-CCMemo-Token`。
- 若保留 API token，则需同时支持前端 cookie 与 API token，并文档化差异。
- CORS 默认只允许实际本地 origin。
- Host 默认只接受 `127.0.0.1:<actual-port>` 和可配置的 `localhost:<actual-port>`。
- 未认证业务 API 统一返回不含业务细节的错误。

### CLI 输出

```text
CCMemo server running locally
URL: http://127.0.0.1:48321
Access code: 8N4P-2QXK
Data stays on this machine. Use --host only if you understand the LAN exposure risk.
```

### 验收标准

- 默认情况下，局域网其他设备无法访问 CCMemo。
- 未认证请求访问 `/api/sessions`、`/api/projects`、`/api/stats` 不返回业务数据。
- 不设置密码时不会使用固定默认密码。
- 登录页、README、CLI 输出描述一致。
- 开发模式的安全放宽必须通过显式环境变量或参数启用。

## 5.2 Web 扫描与扫描状态

### 用户流程

```text
首次打开 Web
→ 看到空状态“尚未发现行纪”
→ 点击“扫描 Claude Code 会话”
→ 看到扫描进度
→ 完成后自动刷新会话列表和统计
```

### UI 组件

#### FirstRunEmptyState

内容：

- 标题：尚未发现行纪
- 说明：扫描本机 Claude Code 会话，建立可搜索目录。
- 主按钮：扫描会话目录
- 次按钮：导入示例会话
- 辅助信息：当前 Claude 配置目录路径

#### ScanStatusBar

显示：

- 上次扫描时间
- 当前扫描状态
- 发现项目数
- 处理文件数
- 索引会话数
- 错误数量
- 重新扫描按钮

### API

```text
POST /api/scan
GET  /api/scan/status
POST /api/demo
GET  /api/events      # v0.4 可先预留或 polling 替代
```

### ScanStatus 数据结构

```ts
interface ScanStatus {
  state: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string | null
  finished_at: string | null
  projects_found: number
  files_scanned: number
  sessions_indexed: number
  sessions_updated: number
  events_indexed: number
  errors: ScanError[]
}

interface ScanError {
  path: string
  message: string
  severity: 'warning' | 'error'
}
```

### 并发规则

- 同一时间只允许一个 scan job。
- 重复点击扫描时返回当前 job 状态，不启动第二个任务。
- 完整重扫需要二次确认，因为耗时更长。
- 扫描失败不清空已有数据。

### 验收标准

- 无数据时用户可以从 Web 启动扫描。
- 扫描过程中 UI 有进度反馈。
- 扫描完成后列表自动刷新。
- 扫描失败展示错误路径和重试入口。
- 已有 CLI `scan` 与 Web scan 共用同一 service。

## 5.3 Safe Resume 闭环

### 用户流程

```text
选择会话
→ 打开报告栏
→ 查看“继续此行”模块
→ 系统检查路径、文件、Claude CLI、shell
→ 复制恢复命令
```

### API

```text
GET /api/sessions/:id/resume-check
```

### 返回结构

```ts
interface ResumeCheck {
  ready: boolean
  command: string | null
  shell: 'bash' | 'zsh' | 'powershell' | 'cmd' | 'unknown'
  checks: ResumeCheckItem[]
  warnings: string[]
}

interface ResumeCheckItem {
  key: 'project_path' | 'transcript_file' | 'claude_cli' | 'shell'
  label: string
  status: 'pass' | 'warn' | 'fail'
  message: string
}
```

### UI 文案

- ready：可以继续。项目路径、会话文件和 Claude CLI 均可用。
- warning：可以尝试继续，但存在风险。
- failed：暂不可恢复。根据下方检查结果修复后重试。

### 验收标准

- 项目路径不存在时清晰提示。
- Claude CLI 不存在时清晰提示。
- 命令复制成功有反馈，失败有错误提示。
- Web 与 CLI resume 使用同一 service。

## 5.4 Export 与最小脱敏

### 用户流程

```text
选择会话
→ 报告栏点击“导出”
→ 选择 Markdown / JSONL
→ 选择原始导出或安全导出
→ 查看脱敏预览（安全导出）
→ 确认导出
→ 复制导出路径
```

### API

```text
POST /api/sessions/:id/redaction-preview
POST /api/sessions/:id/export
```

### ExportRequest

```ts
interface ExportRequest {
  format: 'markdown' | 'jsonl'
  safe: boolean
  include_manifest: boolean
}
```

### ExportResult

```ts
interface ExportResult {
  output_path: string
  manifest_path: string | null
  redaction_enabled: boolean
  redaction_count: number
  source_hash: string
}
```

### Markdown 导出要求

- 包含 session metadata。
- 包含事件时间线。
- 尽量通过 `fileOffset` + `byteLength` 读取原始 JSON 或完整内容，而不是只导出 preview。
- 保留用户消息、assistant 消息、工具调用摘要、错误信息。
- 末尾添加轻量水印。
- 安全导出文件名明确标识 safe。
- 原始导出需明确标识可能包含敏感信息。

### Manifest

```json
{
  "version": "0.4.0",
  "session_id": "...",
  "exported_at": "...",
  "format": "markdown",
  "safe": true,
  "source_path": "...",
  "source_hash": "...",
  "redaction_count": 12
}
```

### 12 条脱敏规则

1. API key
2. Anthropic / OpenAI style key
3. GitHub token
4. AWS key
5. JWT
6. Authorization header
7. SSH private key
8. 数据库连接串
9. `.env` 敏感键值
10. home 路径
11. email
12. private IP

误伤防护：`test`、`fake`、`dummy`、`example` 前缀或明显示例值不触发强替换，可降级为 warning。

### 验收标准

- `ccmemo export --safe` 真正应用脱敏。
- Web export 和 CLI export 使用同一 export service。
- 导出目录自动创建 `.gitignore`。
- 导出完成后能复制路径。
- 脱敏预览不展示完整敏感原文，只展示类型、位置和替换结果。

## 5.5 结构化搜索语法

### 支持范围

v0.4.0 必须支持：

```text
project:
branch:
status:
has:errors
```

可选支持：

```text
after:
before:
```

### 示例

```text
auth status:interrupted
project:CCMemo has:errors
branch:feat/v0.4.0 export
```

### 后端解析结构

```rust
struct ParsedSearch {
    text: String,
    project: Option<String>,
    branch: Option<String>,
    status: Option<SessionStatus>,
    has_errors: bool,
    after: Option<String>,
    before: Option<String>,
}
```

### UI

SearchBar 聚焦时显示语法帮助：

```text
project:CCMemo   status:interrupted   branch:feat/v0.4.0   has:errors
```

搜索结果顶部显示已应用条件。无结果必须显示“未找到匹配”，而不是“尚无行纪”。

### 验收标准

- 后端 search parser 有单元测试。
- 搜索语法特殊字符不会造成 SQL 注入。
- 中文 IME 输入不被中途触发。
- 无结果、无数据、搜索错误三种状态区分清晰。

## 5.6 Settings 与 Help

### Settings 内容

- Claude config dir
- DB path
- Export dir
- Server bind address
- Auth mode
- Last scan time
- Session/project/event/tool call stats
- CCMemo version
- Help / README 入口
- 安全说明

### API

```text
GET /api/settings
PUT /api/settings  # v0.4 可只支持部分字段或暂不开放
```

### 设计要求

- v0.4.0 Settings 可以读多写少。
- 路径修改若需要重启，必须明确提示。
- 不在 UI 中展示完整临时访问口令。
- 安全状态要明确：“仅本机可访问”或“已开放局域网访问”。

## 6. P1 精品体验设计

## 6.1 轻量 Command Palette

v0.4.0 若工期允许，将当前 `Ctrl/Cmd + K` 从聚焦搜索升级为轻量命令面板。若不允许，保留聚焦搜索即可。

候选命令：

- 搜索会话
- 重新扫描
- 导出当前会话
- 复制恢复命令
- 切换主题
- 打开设置

## 6.2 书签、页边注、决策摘录预留

这三个能力与“墨途手账”品牌强相关，但不应抢占 v0.4.0 P0。

预留模型：

```text
SessionBookmark(sessionId, createdAt, note)
EventAnnotation(eventId, content, createdAt)
DecisionMark(eventId, label, createdAt)
```

UI 隐喻：

- 书签：折角
- 页边注：窄栏注释
- 决策：朱砂印记

v0.4.0 不主推这些入口，避免虚假可用。

## 7. AI 与 Skill Forge 设计预留

## 7.1 AI 分析预留

模板：

- Bug Runbook
- 技术方案
- PRD
- 学习笔记

Summary metadata 约定：

```json
{
  "template": "bug_runbook",
  "source_event_ids": [],
  "redaction_enabled": true,
  "provider": null,
  "status": "draft",
  "quality_check": null
}
```

UI 禁用态文案：

```text
生成方案
后续版本开启。当前可先导出完整会话，用于人工整理或外部分析。
```

## 7.2 Skill Forge 预留

安全原则：

- transcript 是不可信输入。
- Skill 安装必须逐行审核。
- 生成内容必须经过敏感信息扫描。
- 可执行指令必须明确确认。
- 安装路径隔离。
- hash 校验。

v0.4.0 只在导出 manifest 和设计文档中保留后续扩展空间，不实现生成和安装。

## 8. 后端模块设计

建议新增或重构 service 层：

```text
service/
  scan_service.rs
  resume_service.rs
  export_service.rs
  redaction.rs
  search_parser.rs
  settings_service.rs
  security.rs
```

原则：

- CLI 和 Web 共用 service。
- handler 只做参数解析和响应包装。
- redaction 不绑定 export，后续 AI 发送前也能复用。
- search parser 后端权威，前端只做提示。
- scan 状态可查询，避免 UI 黑盒等待。

## 9. 前端组件设计

新增组件：

- `ScanStatusBar`
- `FirstRunEmptyState`
- `ResumeCard`
- `ExportCard`
- `RedactionPreview`
- `SettingsPanel`
- `SearchSyntaxHelp`
- `OperationProgress`
- `InlineErrorNotice`

设计约束：

- 不做装饰性动效。
- 150-250ms 反馈。
- 扫描和导出显示状态进展，不只用孤立 spinner。
- 不使用 SaaS 风格大渐变或 AI cliché。
- 设置、安全、导出场景文案必须具体。

## 10. 数据与迁移

v0.4.0 可能需要新增：

- Scan job 状态持久化或内存态结构。
- Export manifest 文件，不一定入库。
- Redaction preview 结果不持久化。
- Settings 可先来自 env/config，不强制迁移。

若新增数据库字段，必须提供 migration version，而不是直接修改既有表定义。

## 11. 测试策略

### 后端

- security middleware tests
- scan service tests
- resume service tests
- export service tests
- redaction tests
- search parser tests
- settings API tests

### 前端

- 空状态
- 扫描中/完成/失败
- resume ready/warn/fail
- export 原始/安全/失败
- search syntax help
- settings readonly
- dark/light theme

### 端到端

- demo 数据导入后 Web 可浏览
- scan 后列表刷新
- safe export 文件不含已知敏感样例
- 未认证 API 不泄露业务数据

## 12. 推荐实施拆分

### Phase 0.4.1：安全与设置骨架

- 修正监听地址和 CORS
- 统一认证模型
- settings API
- service 层骨架
- README 对齐

### Phase 0.4.2：扫描与搜索闭环

- Web scan API
- scan status
- first-run empty state
- search parser
- syntax help

### Phase 0.4.3：Resume 与 Export 闭环

- resume-check service/API/UI
- export service
- redaction engine
- manifest 和 `.gitignore`
- Web ExportCard

### Phase 0.4.4：质量收口

- SettingsPanel 完整展示
- 帮助入口
- 错误状态统一
- 测试补齐
- release notes

## 13. 发布验收清单

- [ ] `cargo test` 通过
- [ ] `cargo clippy -- -D warnings` 通过
- [ ] `cd frontend && npm run build` 通过
- [ ] 默认不监听公网地址
- [ ] 未认证无法读取业务 API
- [ ] Web 可启动扫描并刷新列表
- [ ] Web 可执行 resume-check 并复制命令
- [ ] Web 可导出 Markdown
- [ ] safe export 有脱敏测试
- [ ] search parser 有单元测试
- [ ] Settings 显示路径、安全、版本和帮助
- [ ] README 与实际行为一致
