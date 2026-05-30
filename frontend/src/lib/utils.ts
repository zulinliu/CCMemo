export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  const diffWeek = Math.floor(diffDay / 7)

  if (diffMin < 1) return '刚刚'
  if (diffHr < 1) return `${diffMin}分钟前`
  if (diffDay < 1) return `${diffHr}小时前`
  if (diffWeek < 1) return `${diffDay}天前`
  return `${diffWeek}周前`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(s: string, max: number): string {
  const cleaned = stripHtmlTags(s)
  if (cleaned.length <= max) return cleaned
  return cleaned.slice(0, max - 3) + '...'
}

export function stripHtmlTags(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
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
    case 'user': return '用户'
    case 'assistant': return 'AI'
    case 'tool_use': return '工具调用'
    case 'tool_result': return '工具结果'
    case 'system': return '系统'
    case 'queue-operation': return '队列'
    case 'error': return '错误'
    default: return type
  }
}
