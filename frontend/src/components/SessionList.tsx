import { useState, useEffect, useCallback, useRef } from 'react'
import type { Session, PaginatedResult } from '../lib/types'
import { api } from '../lib/api'
import { formatRelativeTime, truncate, statusColor, formatTokenCount } from '../lib/utils'
import { Clock, GitBranch, Cpu, AlertTriangle } from 'lucide-react'

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
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <p className="text-sm mb-2 text-[var(--color-accent)]">加载会话失败</p>
        <p className="text-xs text-[var(--color-text-muted)]">{error}</p>
      </div>
    )
  }

  if (sessions.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-[var(--color-bg-tertiary)]">
          <Clock size={24} className="text-[var(--color-text-muted)]" />
        </div>
        <p className="text-sm font-medium mb-1 text-[var(--color-text-secondary)]">暂无会话记录</p>
        <p className="text-xs text-center text-[var(--color-text-muted)]">
          运行 <code className="font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">ccmemo scan</code> 扫描并索引 Claude Code 会话
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto">
      <div className="p-4 space-y-2">
        {sessions.map(session => (
          <SessionCard
            key={session.session_id}
            session={session}
            selected={selectedId === session.session_id}
            onClick={() => onSelect(session.session_id)}
          />
        ))}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 rounded-full animate-spin border-[var(--color-border-secondary)] border-t-[var(--color-accent)]" />
          </div>
        )}
        {hasMore && !loading && (
          <button onClick={loadMore}
            className="w-full py-2.5 text-xs font-medium rounded-lg transition-colors duration-200 active:opacity-60 text-[var(--color-text-tertiary)]">
            加载更多...
          </button>
        )}
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

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all duration-200 min-h-[44px]
        border ${selected
          ? 'bg-[var(--color-card-selected-bg)] border-[var(--color-card-selected-border)]'
          : 'bg-[var(--color-card-bg)] border-[var(--color-card-border)] hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-active)]'
        }`}
    >
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-1.5 text-[var(--color-text-primary)]">
        {title}
      </p>

      <div className="flex items-center gap-1.5 text-xs flex-wrap text-[var(--color-text-tertiary)]">
        <span className="flex items-center gap-1 shrink-0">
          <span className="w-2 h-2 rounded-full" style={{ background: statusColor(session.status) }} />
          <span>{statusLabel[session.status] || session.status}</span>
        </span>
        <span className="shrink-0">{formatRelativeTime(session.started_at)}</span>
        {session.branch && (
          <span className="flex items-center gap-0.5 truncate max-w-[120px]">
            <GitBranch size={10} className="shrink-0" />
            <span className="truncate">{session.branch}</span>
          </span>
        )}
        {session.tool_call_count > 0 && (
          <span className="flex items-center gap-0.5 shrink-0">
            <Cpu size={10} />
            {session.tool_call_count}
          </span>
        )}
        {session.error_count > 0 && (
          <span className="flex items-center gap-0.5 shrink-0 text-[var(--color-accent)]">
            <AlertTriangle size={10} />
            {session.error_count}
          </span>
        )}
        {(session.total_input_tokens + session.total_output_tokens) > 0 && (
          <span className="font-mono shrink-0">
            {formatTokenCount(session.total_input_tokens + session.total_output_tokens)} tok
          </span>
        )}
      </div>
    </button>
  )
}
