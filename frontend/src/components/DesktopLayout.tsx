import { useState, useEffect, useRef } from 'react'
import type { Session } from '../lib/types'
import { api } from '../lib/api'
import { useTheme } from '../hooks/useTheme'
import { SessionList } from './SessionList'
import { Timeline } from './Timeline'
import { SessionDetail } from './SessionDetail'
import { SearchBar } from './SearchBar'
import { Select } from './Select'
import { Activity, Layers, Sun, Moon, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

const statusOptions = [
  { value: '', label: '状态' },
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'interrupted', label: '已中断' },
  { value: 'unrecoverable', label: '异常' },
]

export function DesktopLayout() {
  const { theme, toggle } = useTheme()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [stats, setStats] = useState<{ session_count: number; project_count: number } | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sessionReqRef = useRef(0)

  useEffect(() => {
    api.projects.list().then(p => setProjects(p.map(({ id, name }) => ({ id, name })))).catch(() => {})
    api.stats().then(setStats).catch(() => {})
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

  const projectOptions = [
    { value: '', label: '全部项目' },
    ...projects.map(p => ({ value: p.id, label: p.name })),
  ]

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header
        className="flex items-center justify-between shrink-0 border-b border-[var(--color-border-primary)]"
        style={{
          height: 'var(--height-bar-sm)',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
        }}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
          <div
            className="rounded-md flex items-center justify-center bg-[var(--color-accent)] text-white"
            style={{ width: 'var(--space-6)', height: 'var(--space-6)' }}
            aria-hidden="true"
          >
            <Layers size={14} />
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">CCMemo</span>
          {stats && (
            <span
              className="text-xs rounded-md
                bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]
                ring-1 ring-inset ring-[var(--color-border-primary)]"
              style={{
                paddingLeft: 'var(--space-2)',
                paddingRight: 'var(--space-2)',
                paddingTop: '2px',
                paddingBottom: '2px',
              }}
              aria-label={`已索引 ${stats.session_count} 个会话，${stats.project_count} 个项目`}
            >
              {stats.session_count} 个会话
            </span>
          )}
        </div>
        <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
          <button
            onClick={toggle}
            className="rounded-lg transition-colors duration-200 text-[var(--color-text-tertiary)]
              hover:bg-[var(--color-surface-hover)] focus-visible:ring-0 focus-ring"
            style={{ padding: 'var(--space-2)' }}
            aria-label={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
            title={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
          >
            {theme === 'light' ? <Moon size={15} aria-hidden="true" /> : <Sun size={15} aria-hidden="true" />}
          </button>
          <button
            onClick={async () => { await api.auth.logout(); window.location.reload() }}
            className="rounded-lg transition-colors duration-200 text-[var(--color-text-tertiary)]
              hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent)]
              focus-visible:ring-0 focus-ring"
            style={{ padding: 'var(--space-2)' }}
            aria-label="退出登录"
            title="退出登录"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div
          className={`flex flex-col shrink-0 transition-all duration-200
            border-r border-[var(--color-border-primary)] ${sidebarCollapsed ? 'overflow-hidden' : ''}`}
          style={{ width: sidebarCollapsed ? 'var(--space-8)' : '320px' }}
        >
          {!sidebarCollapsed && (
            <div
              className="shrink-0 border-b border-[var(--color-border-primary)] flex flex-col"
              style={{
                padding: 'var(--space-3)',
                gap: 'var(--space-3)',
              }}
            >
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <div className="flex" style={{ gap: 'var(--space-2)' }}>
                <Select
                  className="flex-1 min-w-0"
                  value={projectFilter}
                  onChange={v => setProjectFilter(v || undefined as unknown as string)}
                  options={projectOptions}
                  ariaLabel="按项目筛选会话"
                  size="sm"
                />
                <Select
                  className="shrink-0"
                  style={{ minWidth: '104px' }}
                  value={statusFilter}
                  onChange={v => setStatusFilter(v || undefined as unknown as string)}
                  options={statusOptions}
                  ariaLabel="按状态筛选会话"
                  size="sm"
                />
              </div>
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden min-h-0">
              <SessionList
                onSelect={setSelectedId}
                selectedId={selectedId ?? undefined}
                searchQuery={searchQuery || undefined}
                projectId={projectFilter || undefined}
                statusFilter={statusFilter || undefined}
              />
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-xs shrink-0 transition-colors duration-200
              border-t border-[var(--color-border-primary)] text-[var(--color-text-muted)]
              hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)]
              focus-visible:ring-0 focus-ring
              flex items-center justify-center"
            style={{
              padding: 'var(--space-2)',
              gap: 'var(--space-2)',
              writingMode: sidebarCollapsed ? 'vertical-rl' : 'horizontal-tb',
              height: sidebarCollapsed ? 'auto' : 'var(--space-9)',
              flex: sidebarCollapsed ? '1' : 'none',
            }}
            aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {sidebarCollapsed
              ? <PanelLeftOpen size={14} aria-hidden="true" />
              : (
                <>
                  <PanelLeftClose size={14} aria-hidden="true" />
                  <span>收起</span>
                </>
              )}
          </button>
        </div>

        {/* Main Area */}
        {selectedSession ? (
          <div className="flex-1 flex overflow-hidden min-h-0">
            <div className="flex-1 overflow-hidden border-r border-[var(--color-border-primary)] flex flex-col min-w-0">
              <div
                className="flex items-center justify-between shrink-0 border-b border-[var(--color-border-primary)]"
                style={{
                  paddingLeft: 'var(--space-4)',
                  paddingRight: 'var(--space-4)',
                  paddingTop: 'var(--space-3)',
                  paddingBottom: 'var(--space-3)',
                }}
              >
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                  时间线
                </h3>
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <Timeline session={selectedSession} />
              </div>
            </div>
            <div
              className="overflow-y-auto shrink-0 border-l border-[var(--color-border-primary)]"
              style={{ width: '320px' }}
            >
              <SessionDetail session={selectedSession} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div
              className="flex flex-col items-center"
              style={{
                paddingLeft: 'var(--space-6)',
                paddingRight: 'var(--space-6)',
                maxWidth: '360px',
                gap: 'var(--space-3)',
              }}
            >
              <div
                className="rounded-2xl flex items-center justify-center bg-[var(--color-bg-secondary)]"
                style={{ width: '64px', height: '64px' }}
                aria-hidden="true"
              >
                <Activity size={28} className="text-[var(--color-text-muted)]" />
              </div>
              <h2
                className="text-lg font-semibold text-[var(--color-text-primary)] text-center"
                style={{ marginTop: 'var(--space-1)' }}
              >
                选择一个会话
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] text-center">
                从侧边栏选择一个会话以查看其时间线事件和详情
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
