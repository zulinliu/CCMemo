import { useState, useEffect, useCallback, useRef } from 'react'
import type { Session, PaginatedResult } from '../lib/types'
import { api } from '../lib/api'
import { formatRelativeTime, truncate, statusColor, formatTokenCount } from '../lib/utils'
import { Clock, GitBranch, Cpu, AlertTriangle, Copy, Check, Terminal } from 'lucide-react'

interface SessionListProps {
  onSelect: (id: string) => void
  selectedId?: string
  searchQuery?: string
  projectId?: string
  statusFilter?: string
}

const statusLabel: Record<string, string> = {
  active: '进行中',
  completed: '已完成',
  interrupted: '已中断',
  unrecoverable: '异常',
}

export function SessionList({ onSelect, selectedId, searchQuery, projectId, statusFilter }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadSessions = useCallback(async (cur?: string) => {
    try {
      setLoading(true)
      setError(null)

      let result: PaginatedResult<Session>
      if (searchQuery) {
        result = await api.search.query(searchQuery, projectId, 30)
      } else {
        result = await api.sessions.list({
          project_id: projectId,
          status: statusFilter,
          limit: 30,
          cursor: cur,
        })
      }

      if (cur) {
        setSessions(prev => [...prev, ...result.items])
      } else {
        setSessions(result.items)
      }
      setCursor(result.next_cursor)
      setHasMore(result.has_more)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载会话失败')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, projectId, statusFilter])

  useEffect(() => {
    setSessions([])
    setCursor(null)
    loadSessions()
  }, [loadSessions])

  const loadMore = () => {
    if (cursor && hasMore) {
      loadSessions(cursor)
    }
  }

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      if (hasMore && !loading) loadMore()
    }
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ padding: 'var(--space-8) var(--space-6)' }}
      >
        <AlertTriangle
          size={20}
          className="text-[var(--color-accent)]"
          style={{ marginBottom: 'var(--space-3)' }}
          aria-hidden="true"
        />
        <p
          className="text-sm font-medium text-[var(--color-text-secondary)]"
          style={{ marginBottom: 'var(--space-1)' }}
        >
          加载会话失败
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">{error}</p>
      </div>
    )
  }

  if (sessions.length === 0 && !loading) {
    return <EmptyState />
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto">
      <div
        style={{
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
          paddingTop: 'var(--space-4)',
          paddingBottom: 'var(--space-8)',
        }}
      >
        <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
        {sessions.map(session => (
          <SessionCard
            key={session.session_id}
            session={session}
            selected={selectedId === session.session_id}
            onClick={() => onSelect(session.session_id)}
          />
        ))}
        {loading && (
          <div
            className="flex justify-center"
            style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}
            role="status"
            aria-live="polite"
          >
            <div
              className="border-2 rounded-full animate-spin border-[var(--color-border-secondary)] border-t-[var(--color-accent)]"
              style={{ width: '20px', height: '20px' }}
              aria-label="正在加载会话"
            />
          </div>
        )}
        {hasMore && !loading && (
          <button
            onClick={loadMore}
            className="w-full text-xs font-medium rounded-lg transition-colors duration-200
              text-[var(--color-text-tertiary)]
              hover:bg-[var(--color-surface-hover)] active:opacity-60
              focus-visible:ring-0 focus-ring"
            style={{ paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)' }}
            aria-label="加载更多会话"
          >
            加载更多…
          </button>
        )}
        </div>
      </div>
    </div>
  )
}

function SessionCard({ session, selected, onClick }: {
  session: Session
  selected: boolean
  onClick: () => void
}) {
  const title = truncate(session.auto_title, 60)
  const statusName = statusLabel[session.status] || session.status
  const metrics: React.ReactNode[] = []
  if (session.tool_call_count > 0) {
    metrics.push(
      <span
        key="tool"
        className="inline-flex items-center"
        style={{ gap: 'var(--space-1)' }}
      >
        <Cpu size={11} aria-hidden="true" />
        <span>{session.tool_call_count}</span>
      </span>
    )
  }
  if (session.error_count > 0) {
    metrics.push(
      <span
        key="err"
        className="inline-flex items-center text-[var(--color-accent)]"
        style={{ gap: 'var(--space-1)' }}
      >
        <AlertTriangle size={11} aria-hidden="true" />
        <span>{session.error_count}</span>
      </span>
    )
  }
  const tokenCount = session.total_input_tokens + session.total_output_tokens
  if (tokenCount > 0) {
    metrics.push(
      <span key="tok" className="font-mono">{formatTokenCount(tokenCount)} tok</span>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${title}，状态 ${statusName}`}
      className={`w-full text-left rounded-xl transition-colors duration-200 flex flex-col
        border focus-visible:ring-0 focus-ring
        ${selected
          ? 'bg-[var(--color-card-selected-bg)] border-[var(--color-card-selected-border)]'
          : 'bg-[var(--color-card-bg)] border-[var(--color-card-border)] hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-active)]'
        }`}
      style={{ padding: 'var(--space-4)' }}
    >
      {/* Title — primary content */}
      <p
        className="text-sm font-semibold leading-snug line-clamp-2 text-[var(--color-text-primary)]"
        style={{ marginBottom: 'var(--space-3)' }}
      >
        {title}
      </p>

      {/* Group 1: status + time + branch (semantic identifiers) */}
      <div
        className="flex items-center text-xs min-w-0 text-[var(--color-text-secondary)]"
        style={{ gap: 'var(--space-2)' }}
      >
        <span className="flex items-center shrink-0" style={{ gap: 'var(--space-1)' }}>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: statusColor(session.status) }}
            aria-hidden="true"
          />
          <span className="font-medium">{statusName}</span>
        </span>
        <span className="text-[var(--color-text-muted)]" aria-hidden="true">·</span>
        <span className="shrink-0 text-[var(--color-text-tertiary)]">{formatRelativeTime(session.started_at)}</span>
        {session.branch && (
          <span
            className="flex items-center min-w-0 ml-auto text-[var(--color-text-tertiary)]"
            style={{ gap: 'var(--space-1)', maxWidth: '50%' }}
            title={session.branch}
          >
            <GitBranch size={11} className="shrink-0" aria-hidden="true" />
            <span className="truncate font-mono text-[11px]">{session.branch}</span>
          </span>
        )}
      </div>

      {/* Hairline separator */}
      {metrics.length > 0 && (
        <div
          className="border-t border-[var(--color-border-primary)]"
          style={{ marginBlock: 'var(--space-3)' }}
          aria-hidden="true"
        />
      )}

      {/* Group 2: metrics (quantitative) */}
      {metrics.length > 0 && (
        <div
          className="flex items-center flex-wrap text-xs text-[var(--color-text-muted)]"
          style={{ gap: 'var(--space-3)' }}
        >
          {metrics}
        </div>
      )}
    </button>
  )
}

function EmptyState() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText('ccmemo scan').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-[var(--color-bg-tertiary)]">
        <Clock size={24} className="text-[var(--color-text-muted)]" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium mb-1 text-[var(--color-text-secondary)]">还没有会话记录</p>
      <p className="text-xs mb-4 max-w-xs text-[var(--color-text-muted)]">
        在终端运行下方命令扫描并索引本机的 Claude Code 会话
      </p>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md
        bg-[var(--color-bg-tertiary)] border border-[var(--color-card-border)]">
        <Terminal size={12} className="text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
        <code className="font-mono text-xs text-[var(--color-text-primary)]">ccmemo scan</code>
        <button
          onClick={handleCopy}
          className="ml-1 p-0.5 rounded text-[var(--color-text-muted)]
            hover:bg-[var(--color-surface-hover)] focus-visible:ring-0 focus-ring
            active:opacity-60"
          title={copied ? '已复制' : '复制命令'}
          aria-label={copied ? '已复制 ccmemo scan 命令' : '复制 ccmemo scan 命令'}
        >
          {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
