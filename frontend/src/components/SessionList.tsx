import { useState, useEffect, useCallback, useRef } from 'react'
import type { Session, PaginatedResult } from '../lib/types'
import { api } from '../lib/api'
import { formatRelativeTime, truncate, statusColor, formatTokenCount } from '../lib/utils'
import { Clock, GitBranch, Cpu, AlertTriangle, Copy, Check, Terminal, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

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
          className="text-[var(--cinnabar)]"
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
    if (searchQuery) {
      return <SearchEmptyState query={searchQuery} />
    }
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
          <AnimatePresence mode="popLayout">
            {sessions.map((session, i) => (
              <motion.div
                key={session.session_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(i * 0.04, 0.4) }}
                layout
              >
                <SessionCard
                  session={session}
                  selected={selectedId === session.session_id}
                  onClick={() => onSelect(session.session_id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div
              className="flex justify-center"
              style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}
              role="status"
              aria-live="polite"
            >
              <div
                className="border-2 rounded-full animate-spin border-[var(--color-border-secondary)] border-t-[var(--cinnabar)]"
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
              加载更多...
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
        className="inline-flex items-center text-[var(--cinnabar)]"
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
    <motion.button
      onClick={onClick}
      aria-pressed={selected}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`w-full text-left rounded-xl flex flex-col
        border focus-visible:ring-0 focus-ring
        ${selected
          ? 'bg-[var(--color-card-selected-bg)] border-[var(--color-card-selected-border)]'
          : 'bg-[var(--color-card-bg)] border-[var(--color-card-border)] hover:bg-[var(--color-surface-hover)]'
        }`}
      style={{
        padding: 'var(--space-4)',
        boxShadow: selected ? 'var(--shadow-card-selected)' : 'var(--shadow-card)',
      }}
    >
      {/* Title */}
      <p
        className="text-sm font-semibold leading-snug line-clamp-2 text-[var(--color-text-primary)]"
        style={{ marginBottom: 'var(--space-3)' }}
      >
        {title}
      </p>

      {/* Status + time + branch */}
      <div
        className="flex items-center text-xs min-w-0 text-[var(--color-text-secondary)]"
        style={{ gap: 'var(--space-2)' }}
      >
        <span className="flex items-center shrink-0" style={{ gap: 'var(--space-1)' }}>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: statusColor(session.status) }}
            aria-hidden="true"
          />
          <span className="font-medium">{statusName}</span>
        </span>
        <span className="text-[var(--color-text-muted)]" aria-hidden="true">&middot;</span>
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

      {/* Stitch-line separator */}
      {metrics.length > 0 && (
        <hr
          className="stitch-line"
          style={{ marginBlock: 'var(--space-3)' }}
          aria-hidden="true"
        />
      )}

      {/* Metrics */}
      {metrics.length > 0 && (
        <div
          className="flex items-center flex-wrap text-xs text-[var(--color-text-muted)]"
          style={{ gap: 'var(--space-3)' }}
        >
          {metrics}
        </div>
      )}
    </motion.button>
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
      <div
        className="flex items-center justify-center"
        style={{ width: '64px', height: '64px', marginBottom: 'var(--space-5)' }}
        aria-hidden="true"
      >
        <Clock size={28} className="text-[var(--color-text-muted)]" />
      </div>
      <p
        className="font-display text-lg font-medium mb-1 text-[var(--color-text-primary)]"
      >
        尚无行纪
      </p>
      <p className="text-sm mb-5 max-w-xs text-[var(--color-text-muted)]">
        在终端运行下方命令扫描并索引本机的 Claude Code 会话
      </p>
      <div
        className="inline-flex items-center rounded-lg
          bg-[var(--color-bg-tertiary)] border border-dashed border-[var(--color-border-secondary)]"
        style={{ gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)' }}
      >
        <Terminal size={12} className="text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
        <code className="font-mono text-xs text-[var(--color-text-primary)]">ccmemo scan</code>
        <button
          onClick={handleCopy}
          className="ml-1 rounded text-[var(--color-text-muted)]
            hover:bg-[var(--color-surface-hover)] focus-visible:ring-0 focus-ring
            active:opacity-60"
          style={{ padding: '2px' }}
          title={copied ? '已复制' : '复制命令'}
          aria-label={copied ? '已复制 ccmemo scan 命令' : '复制 ccmemo scan 命令'}
        >
          {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" role="status">
      <div
        className="flex items-center justify-center text-[var(--color-text-muted)]"
        style={{ width: '64px', height: '64px', marginBottom: 'var(--space-5)' }}
        aria-hidden="true"
      >
        <Search size={28} />
      </div>
      <p className="font-display text-lg font-medium mb-1 text-[var(--color-text-primary)]">
        未找到匹配的行纪
      </p>
      <p className="text-sm max-w-xs text-[var(--color-text-muted)]">
        没有与「{query}」相关的会话。试试其他关键词，或缩短搜索词。
      </p>
    </div>
  )
}
