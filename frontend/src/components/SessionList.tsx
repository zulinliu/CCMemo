import { useState, useEffect, useCallback, useRef } from 'react'
import type { Session, PaginatedResult } from '../lib/types'
import { api } from '../lib/api'
import { formatRelativeTime, truncate, statusColor, formatTokenCount } from '../lib/utils'
import { Clock, GitBranch, Cpu, AlertTriangle, ChevronRight } from 'lucide-react'

interface SessionListProps {
  onSelect: (id: string) => void
  selectedId?: string
  searchQuery?: string
  projectId?: string
  statusFilter?: string
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
      setError(e instanceof Error ? e.message : 'Failed to load sessions')
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
        <p style={{ color: 'var(--color-accent)' }} className="text-sm mb-2">Failed to load sessions</p>
        <p style={{ color: 'var(--color-text-muted)' }} className="text-xs">{error}</p>
      </div>
    )
  }

  if (sessions.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--color-bg-tertiary)' }}>
          <Clock size={24} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm font-medium mb-1">No sessions found</p>
        <p style={{ color: 'var(--color-text-muted)' }} className="text-xs text-center">
          Run <code className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--color-bg-tertiary)' }}>ccmemo scan</code> to index your Claude Code sessions
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto">
      <div className="p-3 space-y-1.5">
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
            <div className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--color-border-secondary)', borderTopColor: 'var(--color-accent)' }} />
          </div>
        )}
        {hasMore && !loading && (
          <button onClick={loadMore}
            className="w-full py-2 text-xs font-medium rounded-lg transition-colors duration-200"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Load more...
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
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl transition-all duration-200 group"
      style={{
        background: selected ? 'var(--color-surface-active)' : 'transparent',
        border: selected ? '1px solid var(--color-border-focus)' : '1px solid transparent',
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.background = 'var(--color-surface-hover)'
          e.currentTarget.style.borderColor = 'var(--color-border-primary)'
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
        }
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-sm font-medium leading-snug flex-1 line-clamp-2"
          style={{ color: 'var(--color-text-primary)' }}>
          {truncate(session.auto_title, 80)}
        </h3>
        <ChevronRight size={14}
          className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: 'var(--color-text-muted)' }} />
      </div>

      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(session.status) }} />
          <span className="capitalize">{session.status}</span>
        </span>
        <span>{formatRelativeTime(session.started_at)}</span>
        {session.branch && (
          <span className="flex items-center gap-0.5">
            <GitBranch size={10} />
            {truncate(session.branch, 16)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 mt-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {session.tool_call_count > 0 && (
          <span className="flex items-center gap-0.5">
            <Cpu size={10} />
            {session.tool_call_count}
          </span>
        )}
        {session.error_count > 0 && (
          <span className="flex items-center gap-0.5" style={{ color: 'var(--color-accent)' }}>
            <AlertTriangle size={10} />
            {session.error_count}
          </span>
        )}
        {(session.total_input_tokens + session.total_output_tokens) > 0 && (
          <span className="font-mono">
            {formatTokenCount(session.total_input_tokens + session.total_output_tokens)} tok
          </span>
        )}
      </div>
    </button>
  )
}
