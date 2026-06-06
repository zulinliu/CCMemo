# CCMemo

## What This Is

CCMemo 是一个 Claude Code 会话管理工具，将散落在 JSONL 文件中的 AI 编程会话转化为可搜索、可浏览、可复用的工程资产。面向 Claude Code 高频开发者、技术负责人和 Skill 构建者，提供会话可视化管理、AI 智能分析（生成 PRD/Runbook/技术方案）和 Skill 提炼三大核心能力。

## Core Value

让每一次 AI 编程会话的经验都能被找回、被复用、被锻造为可自动执行的 Agent Skill。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 扫描并索引 Claude Code 本地 transcript 文件（~/.claude/projects/）
- [ ] 流式 JSONL 解析，基于 claude-code-transcripts crate
- [ ] 增量扫描，支持活跃会话正在 append
- [ ] 会话状态自动判定（进行中/已完成/已中断/不可恢复）
- [ ] 自动标题生成（从第一条用户消息截取）
- [ ] 跨项目会话列表浏览（Session Brief 摘要卡）
- [ ] Session Inspector 三栏布局（时间线/原始内容/Session Card）
- [ ] 时间线节点按组分色（用户侧/AI响应/文件操作/命令执行/异常）
- [ ] 响应式布局（1280px/1024px 断点）
- [ ] 长会话虚拟滚动（react-virtuoso）
- [ ] 全文搜索（FTS5 + jieba-rs 中文分词）
- [ ] 搜索语法（project:/branch:/status:/has:errors）
- [ ] 中文 IME 兼容搜索
- [ ] Safe Resume（项目路径+CLI可用+Shell格式检查）
- [ ] 完整会话导出（Markdown/JSONL，含完整思考过程）
- [ ] 安全分享导出（12 条脱敏规则）
- [ ] AI 智能分析（4 种模板：Bug Runbook/技术方案/PRD/学习笔记）
- [ ] Skill Forge（会话经验提炼为可安装 Skill）
- [ ] Skill 静态校验（frontmatter/命名/结构/敏感信息）
- [ ] Skill 安全（逐行审核+injection 检测+安装隔离+hash 校验）
- [ ] Web UI（Axum 后端 + React 前端）
- [ ] CLI 命令（scan/list/show/resume/export/summarize/skill/serve/demo）
- [ ] SQLite + FTS5 存储（WAL 模式）
- [ ] 空状态设计（图标+说明+引导操作）
- [ ] 主题切换（深色/浅色，跟随 OS）
- [ ] 国际化（中英文）
- [ ] 冷启动策略（ccmemo demo 导入示例会话）
- [ ] 本地 API 安全（127.0.0.1+端口随机+bearer token+Host 校验）

### Out of Scope

- Tauri Desktop 封装 — v0.5 阶段，v0.1 不涉及
- SQLCipher 加密 — v0.4+ 引入
- OS Keychain 集成 — v0.4+ 引入
- Workflow 限制为结构化格式 — v0.2+
- 多人协作/云同步 — 本地优先，不涉及网络服务
- 非 Claude Code transcript 支持 — 仅支持 Claude Code 格式

## Context

- Claude Code 的 transcript 文件存储在 `~/.claude/projects/` 下，格式为 JSONL
- 路径编码存在已知 bug (#40946)，不能依赖逆向编码规则，需扫描实际目录
- `claude-code-transcripts` crate 已在 crates.io 验证存在，提供强类型 Entry 变体
- Claude Code 有基础会话管理（--resume、交互式选择器、/export），但全是 CLI 操作，无可视化
- 技术栈确定：Rust Core + Axum + SQLite/FTS5 + React/TypeScript/Vite/Tailwind
- 许可证：Apache 2.0

## Constraints

- **Tech Stack**: Rust Core Engine + Axum + SQLite/FTS5 + React/TypeScript/Vite/Tailwind — 技术选型已确定
- **Local First**: 默认不上传、不共享、不调用外部 AI — 隐私设计原则
- **Performance**: 1000 条消息索引 < 5s, 10000 条搜索 < 300ms — 性能目标
- **Single Binary**: CLI 为单一 binary 分发 — 部署简化
- **Apache 2.0**: 许可证与 Rust 生态一致 — 开源合规

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 基于 claude-code-transcripts crate | 省去自建 parser 2-3 周工期，社区维护 | — Pending |
| 路径发现用目录扫描而非逆向编码 | 已知路径编码 bug #40946，扫描+交叉验证更可靠 | — Pending |
| TranscriptEvent 含 fileOffset + byteLength | 长会话 O(1) seek 定位原始 JSON，避免线性扫描 | — Pending |
| v0.1 即含极简 Web UI | 可视化优先原则，最早验证数据可信 | — Pending |
| 首版 12 条脱敏规则 | 覆盖 API key/AWS 凭证/GitHub token/JWT/SSH/DB 连接串等 | — Pending |
| SQLite WAL 模式 + 批量写入 | 并发读写性能，不阻塞 UI | — Pending |
| 6 表数据模型 | ProjectIdentity/SessionMetadata/TranscriptEvent/ToolCall/Summary/ScanBookmark | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-29 after initialization*
