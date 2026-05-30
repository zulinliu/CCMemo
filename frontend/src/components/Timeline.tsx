import { useState, useEffect, useCallback, useRef } from 'react'
import type { TimelineEvent, Session } from '../lib/types'
import { api } from '../lib/api'
import { formatDate, eventTypeColor, eventTypeBg, eventTypeLabel, truncate } from '../lib/utils'
import { User, Bot, Terminal, AlertCircle, Zap } from 'lucide-react'

interface TimelineProps {
  session: Session
}

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
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <AlertCircle size={24} className="mb-3 text-[var(--color-accent)]" />
        <p className="text-sm mb-2 text-[var(--color-text-secondary)]">加载事件失败</p>
        <p className="text-xs text-center mb-3 text-[var(--color-text-muted)]">{error}</p>
        <button onClick={() => loadEvents()}
          className="text-xs px-3 py-1.5 rounded-lg active:opacity-60
            bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
          重试
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="p-4 space-y-1">
        {events.map(event => (
          <TimelineNode key={event.id} event={event} />
        ))}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-4 h-4 border-2 rounded-full animate-spin
              border-[var(--color-border-secondary)] border-t-[var(--color-accent)]" />
          </div>
        )}
        {hasMore && !loading && (
          <button onClick={() => loadEvents(cursor ?? undefined)}
            className="w-full py-2.5 text-xs font-medium rounded-lg active:opacity-60 text-[var(--color-text-tertiary)]">
            加载更多事件...
          </button>
        )}
      </div>
    </div>
  )
}

function TimelineNode({ event }: { event: TimelineEvent }) {
  const [expanded, setExpanded] = useState(false)
  const color = eventTypeColor(event.event_type)
  const bgColor = eventTypeBg(event.event_type)
  const icon = eventIcon(event.event_type)

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left p-3 rounded-lg flex gap-3 transition-colors duration-150
        active:bg-[var(--color-surface-active)]">
      <div className="flex flex-col items-center pt-0.5">
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: bgColor, color }}>
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color }}>
            {eventTypeLabel(event.event_type)}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            #{event.sequence}
          </span>
        </div>
        {event.preview && (
          <p className={`text-xs leading-relaxed font-mono text-[var(--color-text-secondary)] ${expanded ? '' : 'line-clamp-2'}`}>
            {expanded ? event.preview : truncate(event.preview, 200)}
          </p>
        )}
        <span className="text-xs mt-1 block text-[var(--color-text-muted)]">
          {formatDate(event.timestamp)}
        </span>
      </div>
    </button>
  )
}

function eventIcon(type: string) {
  const size = 13
  switch (type) {
    case 'user': return <User size={size} />
    case 'assistant': return <Bot size={size} />
    case 'system': return <Terminal size={size} />
    case 'error': return <AlertCircle size={size} />
    default: return <Zap size={size} />
  }
}
