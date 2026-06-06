import { useState, useEffect, useRef } from 'react'
import type { Session } from '../lib/types'
import { api } from '../lib/api'
import { useTheme } from '../hooks/useTheme'
import { statusColor } from '../lib/utils'
import { SessionList } from './SessionList'
import { Timeline } from './Timeline'
import { SessionDetail } from './SessionDetail'
import { SearchBar } from './SearchBar'
import { Select } from './Select'
import { BottomTabBar, type MobileTab } from './BottomTabBar'
import { Sun, Moon, LogOut, Inbox, Filter, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const statusOptions = [
  { value: '', label: '状态' },
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'interrupted', label: '已中断' },
  { value: 'unrecoverable', label: '异常' },
]

export function MobileLayout() {
  const { theme, toggle } = useTheme()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [tab, setTab] = useState<MobileTab>('sessions')
  const sessionReqRef = useRef(0)

  // Hash-based deep linking
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) { setSelectedId(hash); setTab('timeline') }
    const onHash = () => {
      const h = window.location.hash.slice(1)
      if (h && h !== selectedId) { setSelectedId(h); setTab('timeline') }
      else if (!h) setSelectedId(null)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (selectedId) {
      window.history.replaceState(null, '', `#${selectedId}`)
    } else {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId])

  useEffect(() => {
    api.projects.list().then(p => setProjects(p.map(({ id, name }) => ({ id, name })))).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedId) {
      const reqId = ++sessionReqRef.current
      api.sessions.get(selectedId).then(session => {
        if (reqId === sessionReqRef.current) {
          setSelectedSession(session)
        }
      }).catch(() => {
        if (reqId === sessionReqRef.current) {
          setSelectedSession(null)
        }
      })
    } else {
      setSelectedSession(null)
    }
  }, [selectedId])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setTab('timeline')
  }

  const handleTabChange = (t: MobileTab) => {
    if (t === 'sessions') setTab(t)
    else if (selectedSession) setTab(t)
  }

  const projectOptions = [
    { value: '', label: '全部项目' },
    ...projects.map(p => ({ value: p.id, label: p.name })),
  ]

  const activeFilters = [
    ...(projectFilter ? [{ key: 'project' as const, label: projectOptions.find(o => o.value === projectFilter)?.label || projectFilter, clear: () => setProjectFilter('') }] : []),
    ...(statusFilter ? [{ key: 'status' as const, label: statusOptions.find(o => o.value === statusFilter)?.label || statusFilter, clear: () => setStatusFilter('') }] : []),
  ]

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header
        className="flex items-center justify-between shrink-0 border-b border-[var(--color-border-primary)]"
        style={{
          minHeight: 'var(--space-7)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), var(--space-3))',
          paddingBottom: 'var(--space-3)',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
        }}
      >
        <span className="font-display text-base font-medium text-[var(--color-text-primary)]">墨途</span>
        <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
          <button
            onClick={toggle}
            className="rounded-lg transition-colors duration-200 text-[var(--color-text-tertiary)]
              hover:bg-[var(--color-surface-hover)] focus-visible:ring-0 focus-ring"
            style={{ padding: 'var(--space-2)' }}
            aria-label={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
            title={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
          >
            {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
          </button>
          <button
            onClick={async () => { await api.auth.logout(); window.location.reload() }}
            className="rounded-lg transition-colors duration-200 text-[var(--color-text-tertiary)]
              hover:bg-[var(--color-surface-hover)] focus-visible:ring-0 focus-ring"
            style={{ padding: 'var(--space-2)' }}
            aria-label="退出登录"
            title="退出登录"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {tab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col h-full"
            >
              <div
                className="shrink-0 border-b border-[var(--color-border-primary)] flex flex-col"
                style={{
                  paddingLeft: 'var(--space-4)',
                  paddingRight: 'var(--space-4)',
                  paddingTop: 'var(--space-4)',
                  paddingBottom: 'var(--space-3)',
                  gap: 'var(--space-3)',
                }}
              >
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="搜索会话..." />
                <div className="flex" style={{ gap: 'var(--space-2)' }}>
                  <Select
                    className="flex-1 min-w-0"
                    value={projectFilter}
                    onChange={setProjectFilter}
                    options={projectOptions}
                    ariaLabel="按项目筛选会话"
                    size="lg"
                  />
                  <Select
                    className="shrink-0"
                    style={{ minWidth: '104px' }}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                    ariaLabel="按状态筛选会话"
                    size="lg"
                  />
                </div>
              </div>
              {activeFilters.length > 0 && (
                <div
                  className="shrink-0 flex items-center flex-wrap"
                  style={{ paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', gap: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}
                >
                  <Filter size={12} className="text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
                  {activeFilters.map(f => (
                    <span
                      key={f.key}
                      className="inline-flex items-center text-xs rounded-md
                        bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                      style={{ padding: '2px var(--space-2)', gap: 'var(--space-1)' }}
                    >
                      {f.label}
                      <button
                        onClick={f.clear}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
                          focus-visible:ring-0 focus-ring rounded-sm"
                        style={{ padding: '1px' }}
                        aria-label={`移除筛选：${f.label}`}
                      >
                        <X size={10} aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-hidden min-h-0">
                <SessionList
                  onSelect={handleSelect}
                  selectedId={selectedId ?? undefined}
                  searchQuery={searchQuery || undefined}
                  projectId={projectFilter || undefined}
                  statusFilter={statusFilter || undefined}
                />
              </div>
            </motion.div>
          )}

          {tab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {selectedSession ? (
                <div className="flex flex-col h-full">
                  <div
                    className="shrink-0 flex items-center border-b border-[var(--color-border-primary)]"
                    style={{
                      paddingLeft: 'var(--space-4)',
                      paddingRight: 'var(--space-4)',
                      paddingTop: 'var(--space-2)',
                      paddingBottom: 'var(--space-2)',
                    }}
                  >
                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {selectedSession.auto_title}
                    </span>
                    <span
                      className="shrink-0 ml-2 w-2 h-2 rounded-full"
                      style={{ background: statusColor(selectedSession.status) }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden min-h-0">
                    <Timeline session={selectedSession} />
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Inbox size={24} aria-hidden="true" />}
                  title="还没有选中会话"
                  message="在「目录」标签中选择一个会话，查看其时间线事件"
                  action={{ label: '前往目录', onClick: () => setTab('sessions') }}
                />
              )}
            </motion.div>
          )}

          {tab === 'detail' && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {selectedSession ? (
                <div className="flex flex-col h-full">
                  <div
                    className="shrink-0 flex items-center border-b border-[var(--color-border-primary)]"
                    style={{
                      paddingLeft: 'var(--space-4)',
                      paddingRight: 'var(--space-4)',
                      paddingTop: 'var(--space-2)',
                      paddingBottom: 'var(--space-2)',
                    }}
                  >
                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {selectedSession.auto_title}
                    </span>
                    <span
                      className="shrink-0 ml-2 w-2 h-2 rounded-full"
                      style={{ background: statusColor(selectedSession.status) }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <SessionDetail session={selectedSession} />
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Inbox size={24} aria-hidden="true" />}
                  title="还没有选中会话"
                  message="在「目录」标签中选择一个会话，查看其详情信息"
                  action={{ label: '前往目录', onClick: () => setTab('sessions') }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar */}
      <BottomTabBar active={tab} onChange={handleTabChange} hasSession={!!selectedSession} />
    </div>
  )
}

function EmptyState({ icon, title, message, action }: {
  icon: React.ReactNode
  title: string
  message: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="flex flex-col items-center"
        style={{
          paddingLeft: 'var(--space-6)',
          paddingRight: 'var(--space-6)',
          maxWidth: '320px',
          gap: 'var(--space-3)',
        }}
      >
        <div
          className="flex items-center justify-center text-[var(--color-text-muted)]"
          style={{ width: '64px', height: '64px' }}
          aria-hidden="true"
        >
          {icon}
        </div>
        <h2
          className="font-display text-base font-medium text-[var(--color-text-primary)] text-center"
          style={{ marginTop: 'var(--space-1)' }}
        >
          {title}
        </h2>
        <p className="text-sm text-center text-[var(--color-text-muted)]">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-1 text-sm font-medium rounded-lg transition-colors duration-200
              text-[var(--cinnabar)] hover:bg-[var(--cinnabar-ghost)]
              focus-visible:ring-0 focus-ring"
            style={{ padding: 'var(--space-2) var(--space-4)' }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
