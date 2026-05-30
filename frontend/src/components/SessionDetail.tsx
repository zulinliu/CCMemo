import type { Session } from '../lib/types'
import { formatDate, statusColor, formatTokenCount } from '../lib/utils'
import { GitBranch, Clock, Cpu, FileText, AlertTriangle, Monitor } from 'lucide-react'

const statusLabel: Record<string, string> = {
  active: '进行中',
  completed: '已完成',
  interrupted: '已中断',
  unrecoverable: '异常',
}

interface SessionDetailProps {
  session: Session
}

export function SessionDetail({ session }: SessionDetailProps) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-base font-semibold leading-snug mb-2"
          style={{ color: 'var(--color-text-primary)' }}>
          {session.auto_title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: `${statusColor(session.status)}15`,
              color: statusColor(session.status),
            }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(session.status) }} />
            <span>{statusLabel[session.status] || session.status}</span>
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        <DetailRow icon={<Clock size={13} />} label="开始" value={formatDate(session.started_at)} />
        {session.ended_at && <DetailRow icon={<Clock size={13} />} label="结束" value={formatDate(session.ended_at)} />}
        {session.branch && <DetailRow icon={<GitBranch size={13} />} label="分支" value={session.branch} mono />}
        {session.model && <DetailRow icon={<Monitor size={13} />} label="模型" value={session.model} />}
      </div>

      <div className="pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
        <h4 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          统计
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={<FileText size={13} />} label="文件" value={String(session.file_count)} />
          <StatCard icon={<Cpu size={13} />} label="工具调用" value={String(session.tool_call_count)} />
          <StatCard icon={<AlertTriangle size={13} />} label="错误" value={String(session.error_count)}
            accent={session.error_count > 0} />
          <StatCard icon={<Zap size={13} />} label="Token"
            value={formatTokenCount(session.total_input_tokens + session.total_output_tokens)} />
        </div>
      </div>

      <div className="pt-3" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
        <h4 className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
          会话 ID
        </h4>
        <code className="text-xs px-2 py-1 rounded-md block break-all"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-secondary)',
          }}>
          {session.session_id}
        </code>
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value, mono }: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
      <span style={{ color: 'var(--color-text-muted)' }} className="w-14">{label}</span>
      <span className={mono ? 'font-mono' : ''}
        style={{
          color: 'var(--color-text-primary)',
          ...(mono ? { fontFamily: 'var(--font-mono)' } : {}),
        }}>
        {value}
      </span>
    </div>
  )
}

function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="p-2.5 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span style={{ color: accent ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>{icon}</span>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      </div>
      <span className="text-sm font-semibold font-mono"
        style={{
          color: accent ? 'var(--color-accent)' : 'var(--color-text-primary)',
          fontFamily: 'var(--font-mono)',
        }}>
        {value}
      </span>
    </div>
  )
}

function Zap({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}
