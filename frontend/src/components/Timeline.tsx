import { useState, useEffect, useCallback, useRef } from 'react'
import type { TimelineEvent, Session } from '../lib/types'
import { api } from '../lib/api'
import { formatDate, eventTypeColor, eventTypeBg, eventTypeLabel, truncate } from '../lib/utils'
import { User, Bot, Terminal, AlertCircle, Zap, ChevronDown, RefreshCw } from 'lucide-react'

interface TimelineProps {
  session: Session
}

const PREVIEW_COLLAPSED = 200

export function Timeline({ session }: TimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)

  const loadEvents = useCallback(async (cur?: string) => {
    const requestId = ++requestIdRef.current
    try {
      setLoading(true)
      setError(null)
      const result = await api.sessions.timeline(session.session_id, cur, 200)
      if (requestId !== requestIdRef.current) return
      if (cur) {
        setEvents(prev => [...prev, ...result.items])
      } else {
        setEvents(result.items)
      }
      setCursor(result.next_cursor)
      setHasMore(result.has_more)
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      setError(e instanceof Error ? e.message : '加载事件失败')
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [session.session_id])

  useEffect(() => {
    setEvents([])
    setCursor(null)
    setError(null)
    loadEvents()
  }, [loadEvents])

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ padding: 'var(--space-8) var(--space-6)' }}
      >
        <AlertCircle
          size={24}
          className="text-[var(--color-accent)]"
          style={{ marginBottom: 'var(--space-3)' }}
          aria-hidden="true"
        />
        <p
          className="text-sm font-medium text-[var(--color-text-secondary)]"
          style={{ marginBottom: 'var(--space-1)' }}
        >
          加载事件失败
        </p>
        <p
          className="text-xs text-center max-w-xs text-[var(--color-text-muted)]"
          style={{ marginBottom: 'var(--space-3)' }}
        >
          {error}
        </p>
        <button
          onClick={() => loadEvents()}
          className="text-xs rounded-lg active:opacity-60
            bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]
            hover:bg-[var(--color-surface-hover)] focus-visible:ring-0 focus-ring
            inline-flex items-center"
          style={{ gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)' }}
          aria-label="重新加载时间线事件"
        >
          <RefreshCw size={12} aria-hidden="true" />
          重试
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div
        style={{
          paddingLeft: 'var(--space-3)',
          paddingRight: 'var(--space-3)',
          paddingTop: 'var(--space-3)',
          paddingBottom: 'var(--space-7)',
        }}
      >
        <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
          {events.map(event => (
            <TimelineNode key={event.id} event={event} />
          ))}
          {loading && (
            <div
              className="flex justify-center"
              style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}
              role="status"
              aria-live="polite"
            >
              <div
                className="border-2 rounded-full animate-spin
                  border-[var(--color-border-secondary)] border-t-[var(--color-accent)]"
                style={{ width: '16px', height: '16px' }}
                aria-label="正在加载事件"
              />
            </div>
          )}
          {hasMore && !loading && (
            <button
              onClick={() => loadEvents(cursor ?? undefined)}
              className="w-full text-xs font-medium rounded-lg
                text-[var(--color-text-tertiary)]
                hover:bg-[var(--color-surface-hover)] active:opacity-60
                transition-colors duration-200 focus-visible:ring-0 focus-ring"
              style={{ paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)' }}
              aria-label="加载更多事件"
            >
              加载更多事件…
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TimelineNode({ event }: { event: TimelineEvent }) {
  const [expanded, setExpanded] = useState(false)
  const color = eventTypeColor(event.event_type)
  const bgColor = eventTypeBg(event.event_type)
  const icon = eventIcon(event.event_type)
  const hasLongPreview = !!event.preview && event.preview.length > PREVIEW_COLLAPSED

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      aria-expanded={hasLongPreview ? expanded : undefined}
      className="w-full text-left rounded-lg flex
        transition-colors duration-150
        hover:bg-[var(--color-surface-hover)]
        active:bg-[var(--color-surface-active)]
        focus-visible:ring-0 focus-ring"
      style={{ padding: 'var(--space-3)', gap: 'var(--space-3)' }}
    >
      <div className="flex flex-col items-center pt-0.5 shrink-0">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: bgColor, color }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
          <span className="text-xs font-semibold" style={{ color }}>
            {eventTypeLabel(event.event_type)}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">#{event.sequence}</span>
        </div>
        {event.preview && (
          <p className={`text-xs leading-relaxed font-mono whitespace-pre-wrap break-words
            text-[var(--color-text-secondary)]
            ${hasLongPreview && !expanded ? 'line-clamp-2' : ''}`}>
            {hasLongPreview && !expanded ? truncate(event.preview, PREVIEW_COLLAPSED) : event.preview}
          </p>
        )}
        <span
          className="text-xs block text-[var(--color-text-muted)]"
          style={{ marginTop: 'var(--space-2)' }}
        >
          {formatDate(event.timestamp)}
        </span>
      </div>
      {hasLongPreview && (
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`shrink-0 self-center text-[var(--color-text-muted)] transition-transform duration-200
            ${expanded ? 'rotate-180' : ''}`}
        />
      )}
    </button>
  )
}

function eventIcon(type: string) {
  const size = 13
  switch (type) {
    case 'user': return <User size={size} aria-hidden="true" />
    case 'assistant': return <Bot size={size} aria-hidden="true" />
    case 'system': return <Terminal size={size} aria-hidden="true" />
    case 'error': return <AlertCircle size={size} aria-hidden="true" />
    default: return <Zap size={size} aria-hidden="true" />
  }
}
