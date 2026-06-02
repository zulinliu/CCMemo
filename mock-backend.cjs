/**
 * Mock backend for CCMemo visual review.
 * Serves the same /api/* endpoints the Rust backend does, with rich sample data
 * so the optimized UI can be browsed end-to-end without Rust toolchain.
 */
const http = require('http');
const { URL } = require('url');

const PORT = 3456;

const now = new Date();
const minutes = (n) => new Date(now - n * 60 * 1000).toISOString();
const hours = (n) => new Date(now - n * 3600 * 1000).toISOString();
const days = (n) => new Date(now - n * 86400 * 1000).toISOString();

const SESSIONS = [
  {
    session_id: 'sess_a1b2c3d4e5f6g7h8',
    auto_title: '优化 ccmemo-core 全文搜索查询性能与 FTS5 索引健康检查',
    project_id: 'p1',
    project_name: 'CCMemo',
    status: 'active',
    started_at: minutes(5),
    ended_at: null,
    branch: 'feat/search-perf',
    model: 'claude-sonnet-4-5',
    tool_call_count: 12,
    error_count: 0,
    file_count: 8,
    total_input_tokens: 12450,
    total_output_tokens: 8230,
  },
  {
    session_id: 'sess_xyz789abc012def',
    auto_title: '修复会话时间线中重复事件显示的 bug',
    project_id: 'p2',
    project_name: 'claude-rs',
    status: 'completed',
    started_at: hours(3),
    ended_at: hours(2),
    branch: 'main',
    model: 'claude-opus-4',
    tool_call_count: 45,
    error_count: 2,
    file_count: 18,
    total_input_tokens: 89420,
    total_output_tokens: 134210,
  },
  {
    session_id: 'sess_q1w2e3r4t5y6u7i8',
    auto_title: '数据库迁移：从 SQLite WAL 模式切换到 r2d2 连接池',
    project_id: 'p1',
    project_name: 'CCMemo',
    status: 'interrupted',
    started_at: hours(26),
    ended_at: null,
    branch: 'refactor/wal-migration',
    model: 'claude-sonnet-4-5',
    tool_call_count: 7,
    error_count: 1,
    file_count: 3,
    total_input_tokens: 5200,
    total_output_tokens: 3100,
  },
  {
    session_id: 'sess_99ff88ee77dd66cc',
    auto_title: 'API 端到端测试：parser 错误恢复路径',
    project_id: 'p1',
    project_name: 'CCMemo',
    status: 'unrecoverable',
    started_at: days(4),
    ended_at: days(3.9),
    branch: 'test/parser-edge',
    model: 'claude-sonnet-4-5',
    tool_call_count: 23,
    error_count: 8,
    file_count: 11,
    total_input_tokens: 24500,
    total_output_tokens: 18900,
  },
  {
    session_id: 'sess_aa11bb22cc33dd44',
    auto_title: '重构 SessionList 卡片布局支持自定义 token 计数显示',
    project_id: 'p3',
    project_name: 'devtools',
    status: 'completed',
    started_at: days(8),
    ended_at: days(7.9),
    branch: 'feature/very-long-branch-name-that-might-overflow-the-card-layout-and-should-be-truncated-properly-with-ellipsis',
    model: 'claude-haiku-4',
    tool_call_count: 3,
    error_count: 0,
    file_count: 1,
    total_input_tokens: 800,
    total_output_tokens: 600,
  },
];

const TIMELINE_SESSIONS = {
  'sess_a1b2c3d4e5f6g7h8': [
    { id: 1, sequence: 1, event_type: 'user', timestamp: minutes(5), preview: '请帮我分析一下全文搜索的性能瓶颈，ccmemo-core 是不是缺少 FTS5 索引的健康检查？' },
    { id: 2, sequence: 2, event_type: 'assistant', timestamp: minutes(4.9), preview: '好的，我先读一下 ccmemo-core 的 SQLite 存储层，确认 FTS5 虚表的创建与同步策略，然后再看 jieba 分词器的集成。' },
    { id: 3, sequence: 3, event_type: 'tool_use', timestamp: minutes(4.8), preview: 'Read(ccmemo-core/src/storage/sqlite.rs)' },
    { id: 4, sequence: 4, event_type: 'tool_result', timestamp: minutes(4.8), preview: '// 文件内容（截断）...\nCREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(\n  session_id UNINDEXED,\n  title,\n  content,\n  tokenize = "unicode61 remove_diacritics 2"\n);' },
    { id: 5, sequence: 5, event_type: 'user', timestamp: minutes(4), preview: '发现 FTS5 索引在大量写入后会出现 performance regression，请加一个 health check 接口' },
    { id: 6, sequence: 6, event_type: 'system', timestamp: minutes(3.5), preview: 'queue-operation: stats refresh triggered by indexer sweep' },
    { id: 7, sequence: 7, event_type: 'error', timestamp: minutes(3), preview: 'DatabaseError: database disk image is malformed (发生在 fts5 integrity_check 时)' },
    { id: 8, sequence: 8, event_type: 'assistant', timestamp: minutes(2.5), preview: '建议分两步修复：1) PRAGMA integrity_check 替代手工扫描；2) 引入 r2d2 连接池，避免长事务占用 lock 句柄。' },
  ],
};

const TOOL_CALLS = {
  'sess_a1b2c3d4e5f6g7h8': [
    { id: 1, tool_name: 'Read', file: 'ccmemo-core/src/storage/sqlite.rs', duration_ms: 24 },
    { id: 2, tool_name: 'Bash', command: 'cargo test -p ccmemo-core fts5', duration_ms: 8120 },
    { id: 3, tool_name: 'Edit', file: 'ccmemo-core/src/storage/sqlite.rs', duration_ms: 41 },
  ],
};

const PROJECTS = [
  { id: 'p1', name: 'CCMemo', session_count: 12 },
  { id: 'p2', name: 'claude-rs', session_count: 5 },
  { id: 'p3', name: 'devtools', session_count: 3 },
];

const STATS = { session_count: 23, project_count: 3 };

let authenticated = false;

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function ok(res, data) {
  send(res, 200, { status: 'ok', data });
}

function parseQuery(search) {
  const out = {};
  search.replace(/^\?/, '').split('&').filter(Boolean).forEach(p => {
    const [k, v] = p.split('=');
    out[decodeURIComponent(k)] = v ? decodeURIComponent(v.replace(/\+/g, ' ')) : '';
  });
  return out;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname;
  const q = parseQuery(url.search);

  // Auth endpoints
  if (path === '/api/auth/check' && req.method === 'GET') {
    return ok(res, { authenticated: true });
  }
  if (path === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body || '{}');
        if (password && password.length > 0) {
          authenticated = true;
          return ok(res, { ok: true });
        }
        send(res, 401, { status: 'error', message: 'Invalid password' });
      } catch {
        send(res, 400, { status: 'error', message: 'Bad request' });
      }
    });
    return;
  }
  if (path === '/api/auth/logout' && req.method === 'POST') {
    authenticated = false;
    return ok(res, { ok: true });
  }

  // Protected endpoints (mock: no actual auth check)
  if (path === '/api/stats' && req.method === 'GET') return ok(res, STATS);
  if (path === '/api/projects' && req.method === 'GET') return ok(res, PROJECTS);

  if (path === '/api/sessions' && req.method === 'GET') {
    let items = SESSIONS.slice();
    if (q.project_id) items = items.filter(s => s.project_id === q.project_id);
    if (q.status) items = items.filter(s => s.status === q.status);
    if (q.query) {
      const ql = q.query.toLowerCase();
      items = items.filter(s => s.auto_title.toLowerCase().includes(ql));
    }
    return ok(res, { items, next_cursor: null, has_more: false });
  }

  const sessionMatch = path.match(/^\/api\/sessions\/([^/]+)$/);
  if (sessionMatch && req.method === 'GET') {
    const sid = sessionMatch[1];
    const session = SESSIONS.find(s => s.session_id === sid);
    if (!session) return send(res, 404, { status: 'error', message: 'Not found' });
    return ok(res, session);
  }

  const timelineMatch = path.match(/^\/api\/sessions\/([^/]+)\/timeline$/);
  if (timelineMatch && req.method === 'GET') {
    const sid = timelineMatch[1];
    const items = TIMELINE_SESSIONS[sid] || [];
    return ok(res, { items, next_cursor: null, has_more: false });
  }

  const toolCallsMatch = path.match(/^\/api\/sessions\/([^/]+)\/tool-calls$/);
  if (toolCallsMatch && req.method === 'GET') {
    const sid = toolCallsMatch[1];
    return ok(res, { items: TOOL_CALLS[sid] || [] });
  }

  if (path === '/api/search' && req.method === 'GET') {
    const ql = (q.q || '').toLowerCase();
    const items = SESSIONS.filter(s => s.auto_title.toLowerCase().includes(ql));
    return ok(res, { items, next_cursor: null, has_more: false });
  }

  // 404 fallback
  send(res, 404, { status: 'error', message: `Not found: ${path}` });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[ccmemo-mock] listening on http://127.0.0.1:${PORT}`);
  console.log(`[ccmemo-mock] routes: /api/{auth/check,auth/login,auth/logout,stats,projects,sessions,sessions/:id,sessions/:id/timeline,sessions/:id/tool-calls,search}`);
});
