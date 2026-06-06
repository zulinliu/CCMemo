import type { Session } from '../lib/types'
import { formatDate, statusColor, statusBgColor, formatTokenCount } from '../lib/utils'
import { GitBranch, Clock, Cpu, FileText, AlertTriangle, Monitor, Copy, Check, Zap } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'motion/react'

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
    <div
      style={{
        paddingLeft: 'var(--space-4)',
        paddingRight: 'var(--space-4)',
        paddingTop: 'var(--space-5)',
        paddingBottom: 'var(--space-7)',
      }}
    >
      <div className="flex flex-col" style={{ gap: 'var(--space-5)' }}>
        {/* Header */}
        <header>
          <h2
            className="font-display text-base font-medium leading-snug break-words text-[var(--color-text-primary)]"
            style={{ marginBottom: 'var(--space-3)' }}
          >
            {session.auto_title}
          </h2>
          <div className="flex items-center flex-wrap" style={{ gap: 'var(--space-2)' }}>
            <span
              className="inline-flex items-center text-xs font-medium rounded-full"
              style={{
                gap: 'var(--space-1)',
                paddingLeft: 'var(--space-3)',
                paddingRight: 'var(--space-3)',
                paddingTop: '4px',
                paddingBottom: '4px',
                background: statusBgColor(session.status),
                color: statusColor(session.status),
              }}
              aria-label={`状态：${statusLabel[session.status] || session.status}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: statusColor(session.status) }}
                aria-hidden="true"
              />
              <span>{statusLabel[session.status] || session.status}</span>
            </span>
          </div>
        </header>

        {/* Detail rows */}
        <section
          className="flex flex-col"
          style={{ paddingTop: 'var(--space-4)', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border-primary)' }}
        >
          <DetailRow icon={<Clock size={13} aria-hidden="true" />} label="开始" value={formatDate(session.started_at)} />
          {session.ended_at && <DetailRow icon={<Clock size={13} aria-hidden="true" />} label="结束" value={formatDate(session.ended_at)} />}
          {session.branch && <DetailRow icon={<GitBranch size={13} aria-hidden="true" />} label="分支" value={session.branch} mono />}
          {session.model && <DetailRow icon={<Monitor size={13} aria-hidden="true" />} label="模型" value={session.model} />}
        </section>

        {/* Stats */}
        <section
          className="flex flex-col"
          style={{ paddingTop: 'var(--space-4)', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border-primary)' }}
        >
          <h3 className="text-xs font-medium text-[var(--color-text-secondary)]">
            统计
          </h3>
          <div className="grid grid-cols-2" style={{ gap: 'var(--space-3)' }}>
            <StatCard icon={<FileText size={13} aria-hidden="true" />} label="文件" value={String(session.file_count)} />
            <StatCard icon={<Cpu size={13} aria-hidden="true" />} label="工具调用" value={String(session.tool_call_count)} />
            <StatCard
              icon={<AlertTriangle size={13} aria-hidden="true" />}
              label="错误"
              value={String(session.error_count)}
              accent={session.error_count > 0}
            />
            <StatCard
              icon={<Zap size={13} aria-hidden="true" />}
              label="Tokens"
              value={formatTokenCount(session.total_input_tokens + session.total_output_tokens)}
            />
          </div>
        </section>

        {/* Session ID */}
        <SessionIdBlock id={session.session_id} />
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
    <div className="flex items-center text-xs min-w-0" style={{ gap: 'var(--space-2)' }}>
      <span className="shrink-0 text-[var(--color-text-muted)]">{icon}</span>
      <span
        className="shrink-0 text-[var(--color-text-muted)]"
        style={{ minWidth: '40px' }}
      >
        {label}
      </span>
      <span
        title={value}
        className={`min-w-0 flex-1 truncate ${mono ? 'font-mono text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)]'}`}
      >
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
    <div
      className="min-w-0 rounded-xl bg-[var(--color-bg-secondary)]"
      style={{
        padding: 'var(--space-3)',
        borderTop: accent ? '2px solid var(--cinnabar)' : '2px solid transparent',
      }}
    >
      <div className="flex items-center" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
        <span className={accent ? 'text-[var(--cinnabar)]' : 'text-[var(--color-text-muted)]'}>{icon}</span>
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      </div>
      <span
        title={value}
        className={`block text-base font-semibold font-mono truncate ${accent ? 'text-[var(--cinnabar)]' : 'text-[var(--color-text-primary)]'}`}
      >
        {value}
      </span>
    </div>
  )
}

function SessionIdBlock({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <section
      className="flex flex-col"
      style={{ paddingTop: 'var(--space-4)', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border-primary)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-[var(--color-text-secondary)]">
          会话 ID
        </h3>
        <motion.button
          onClick={handleCopy}
          whileTap={{ scale: 0.9 }}
          className="rounded text-[var(--color-text-muted)]
            hover:bg-[var(--color-surface-hover)] focus-visible:ring-0 focus-ring"
          style={{ padding: 'var(--space-1)' }}
          title={copied ? '已复制' : '复制会话 ID'}
          aria-label={copied ? '已复制会话 ID' : '复制会话 ID'}
        >
          {copied
            ? <Check size={12} className="text-[var(--cinnabar)]" aria-hidden="true" />
            : <Copy size={12} aria-hidden="true" />}
        </motion.button>
      </div>
      <code
        title={id}
        className="text-xs break-all font-mono
          bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]
          border border-dashed border-[var(--color-border-secondary)]"
        style={{
          paddingLeft: 'var(--space-3)',
          paddingRight: 'var(--space-3)',
          paddingTop: 'var(--space-2)',
          paddingBottom: 'var(--space-2)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {id}
      </code>
    </section>
  )
}
