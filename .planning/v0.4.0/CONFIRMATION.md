# CCMemo v0.4.0 规划确认记录

**确认日期**：2026-06-06  
**确认人**：项目 owner  
**当前分支**：`feat/v0.4.0`  
**状态**：设计与自审已确认，进入 phase plan 拆分前状态

## 1. 已确认版本方向

v0.4.0 采用以下推荐方向：

1. **主目标：落地闭环**  
   补齐安全、扫描、搜索、恢复、导出、设置，让 CCMemo 从“可浏览”进入“可日常使用”。

2. **AI 范围：先做设计预留**  
   v0.4.0 不接外部 AI Provider，不实现完整 AI 分析，不实现完整 Skill Forge。只保留数据模型、入口文案、安全原则和后续扩展位。

3. **交付形态：继续 Web 单机**  
   保持 single binary + 本地 Web 的交付形态，优先稳定、安全、易用。不在 v0.4.0 引入 Tauri、SQLCipher、OS Keychain 或桌面壳。

## 2. 已确认 P0 范围

v0.4.0 P0 范围锁定为：

- 安全启动与本地访问控制
- Web 扫描入口与扫描状态
- Safe Resume API 与 UI
- Export 与最小脱敏
- 结构化搜索语法：`project:`、`branch:`、`status:`、`has:errors`
- Settings 与 Help
- AI 分析与 Skill Forge 设计预留

## 3. 已确认延期范围

以下内容不进入 v0.4.0 P0，可延期到 v0.4.1 或后续版本：

- 完整 Command Palette
- `after:` / `before:` 搜索
- 自定义脱敏规则 UI
- 书签、页边注、决策摘录
- 真 SSE 进度流，若 polling 已满足体验
- 外部 AI Provider 接入
- 完整 Skill Forge 生成、校验、安装闭环
- Tauri 桌面化
- SQLCipher 与 OS Keychain

## 4. 进入开发前必须澄清的 5 个问题

自审报告给出“有条件通过”。进入开发拆分前，以下问题必须在 phase plan 中逐项决策：

1. 认证主路径：cookie session 还是 API token。
2. 完整导出读取策略：如何从 raw transcript 读取完整内容，而不是只导出 preview。
3. Web scan 并发规则：单任务、重复提交、失败恢复、全量重扫确认。
4. Search parser 语法边界和 SQL 参数化策略。
5. Settings v0.4.0 哪些字段只读，哪些字段可写。

## 5. 下一步

推荐下一步创建 4 个 phase plan：

1. `0.4.1` 安全与设置骨架
2. `0.4.2` 扫描与搜索闭环
3. `0.4.3` Resume 与 Export 闭环
4. `0.4.4` 质量收口与发布文档

每个 phase plan 都必须包含：目标、范围、接口、数据结构、异常路径、验收标准、测试清单和回滚策略。
