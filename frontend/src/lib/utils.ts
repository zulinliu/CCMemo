export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  const diffWeek = Math.floor(diffDay / 7)

  if (diffMin < 1) return 'just now'
  if (diffHr < 1) return `${diffMin}m ago`
  if (diffDay < 1) return `${diffHr}h ago`
  if (diffWeek < 1) return `${diffDay}d ago`
  return `${diffWeek}w ago`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 3) + '...'
}

export function formatTokenCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1000000) return `${(n / 1000).toFixed(1)}k`
  return `${(n / 1000000).toFixed(1)}M`
}

export function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'var(--color-status-active)'
    case 'completed': return 'var(--color-status-completed)'
    case 'interrupted': return 'var(--color-status-interrupted)'
    case 'unrecoverable': return 'var(--color-status-unrecoverable)'
    default: return 'var(--color-text-muted)'
  }
}

export function eventTypeColor(type: string): string {
  switch (type) {
    case 'user': return 'var(--color-timeline-user)'
    case 'assistant': return 'var(--color-timeline-ai)'
    case 'tool_use':
    case 'tool_result': return 'var(--color-timeline-file)'
    case 'system': return 'var(--color-timeline-command)'
    case 'error': return 'var(--color-timeline-error)'
    default: return 'var(--color-text-muted)'
  }
}

export function eventTypeLabel(type: string): string {
  switch (type) {
    case 'user': return 'User'
    case 'assistant': return 'AI'
    case 'system': return 'System'
    case 'queue-operation': return 'Queue'
    case 'error': return 'Error'
    default: return type
  }
}
