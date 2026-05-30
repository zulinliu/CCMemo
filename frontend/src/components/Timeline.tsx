import { useState, useEffect, useCallback, useRef } from 'react'
import type { TimelineEvent, Session } from '../lib/types'
import { api } from '../lib/api'
import { formatDate, eventTypeColor, eventTypeLabel, truncate } from '../lib/utils'
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
      setError(e instanceof Error ? e.message : 'Failed to load events')
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
        <AlertCircle size={24} style={{ color: 'var(--color-accent)' }} className="mb-3" />
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm mb-2">Failed to load events</p>
        <p style={{ color: 'var(--color-text-muted)' }} className="text-xs text-center mb-3">{error}</p>
        <button onClick={() => loadEvents()}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="p-3 space-y-0.5">
        {events.map(event => (
          <TimelineNode key={event.id} event={event} />
        ))}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--color-border-secondary)', borderTopColor: 'var(--color-accent)' }} />
          </div>
        )}
        {hasMore && !loading && (
          <button onClick={() => loadEvents(cursor ?? undefined)}
            className="w-full py-2 text-xs font-medium rounded-lg"
            style={{ color: 'var(--color-text-tertiary)' }}>
            Load more events...
          </button>
        )}
      </div>
    </div>
  )
}

function TimelineNode({ event }: { event: TimelineEvent }) {
  const [expanded, setExpanded] = useState(false)
  const color = eventTypeColor(event.event_type)
  const icon = eventIcon(event.event_type)

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left p-2.5 rounded-lg flex gap-2.5 transition-colors duration-150 group"
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div className="flex flex-col items-center pt-0.5">
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, color }}>
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium" style={{ color }}>
            {eventTypeLabel(event.event_type)}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            #{event.sequence}
          </span>
        </div>
        {event.preview && (
          <p className={`text-xs leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            {expanded ? event.preview : truncate(event.preview, 200)}
          </p>
        )}
        <span className="text-xs mt-1 block" style={{ color: 'var(--color-text-muted)' }}>
          {formatDate(event.timestamp)}
        </span>
      </div>
    </button>
  )
}

function eventIcon(type: string) {
  const size = 12
  switch (type) {
    case 'user': return <User size={size} />
    case 'assistant': return <Bot size={size} />
    case 'system': return <Terminal size={size} />
    case 'error': return <AlertCircle size={size} />
    default: return <Zap size={size} />
  }
}
