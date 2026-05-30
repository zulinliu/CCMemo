import { useState, useEffect, useRef } from 'react'
import type { Session } from '../lib/types'
import { api } from '../lib/api'
import { useTheme } from '../hooks/useTheme'
import { SessionList } from './SessionList'
import { Timeline } from './Timeline'
import { SessionDetail } from './SessionDetail'
import { SearchBar } from './SearchBar'
import { Activity, Layers, Sun, Moon, LogOut } from 'lucide-react'

export function DesktopLayout() {
  const { theme, toggle } = useTheme()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
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

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--color-accent)] text-white">
            <Layers size={14} />
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">CCMemo</span>
          {stats && (
            <span className="text-xs px-1.5 py-0.5 rounded-md
              bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]">
              {stats.session_count} 个会话
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggle}
            className="p-1.5 rounded-lg transition-colors duration-200 text-[var(--color-text-tertiary)]
              hover:bg-[var(--color-surface-hover)]"
            title={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}>
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button onClick={async () => { await api.auth.logout(); window.location.reload() }}
            className="p-1.5 rounded-lg transition-colors duration-200 text-[var(--color-text-tertiary)]
              hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent)]"
            title="退出登录">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`flex flex-col shrink-0 ${sidebarCollapsed ? 'w-12' : 'w-80'} transition-all duration-200
          border-r border-[var(--color-border-primary)]`}>
          {!sidebarCollapsed && (
            <div className="p-3 space-y-2 border-b border-[var(--color-border-primary)]">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <div className="flex gap-1.5">
                <select
                  value={projectFilter ?? ''}
                  onChange={e => setProjectFilter(e.target.value || undefined)}
                  className="flex-1 h-8 px-2 text-xs rounded-md outline-none
                    bg-[var(--color-bg-secondary)] border border-[var(--color-card-border)] text-[var(--color-text-secondary)]
                    focus:border-[var(--color-border-focus)] focus-ring">
                  <option value="">全部项目</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={statusFilter ?? ''}
                  onChange={e => setStatusFilter(e.target.value || undefined)}
                  className="w-24 h-8 px-2 text-xs rounded-md outline-none
                    bg-[var(--color-bg-secondary)] border border-[var(--color-card-border)] text-[var(--color-text-secondary)]
                    focus:border-[var(--color-border-focus)] focus-ring">
                  <option value="">状态</option>
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="interrupted">已中断</option>
                </select>
              </div>
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden">
              <SessionList
                onSelect={setSelectedId}
                selectedId={selectedId ?? undefined}
                searchQuery={searchQuery || undefined}
                projectId={projectFilter}
                statusFilter={statusFilter}
              />
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 text-xs shrink-0 transition-colors duration-200
              border-t border-[var(--color-border-primary)] text-[var(--color-text-muted)]
              hover:bg-[var(--color-surface-hover)]">
            {sidebarCollapsed ? <Layers size={16} /> : '收起'}
          </button>
        </div>

        {/* Main Area */}
        {selectedSession ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden border-r border-[var(--color-border-primary)]">
              <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--color-border-primary)]">
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                  时间线
                </h3>
                <span className="text-xs text-[var(--color-text-muted)]">
                  事件
                </span>
              </div>
              <Timeline session={selectedSession} />
            </div>
            <div className="w-72 overflow-y-auto shrink-0">
              <SessionDetail session={selectedSession} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4
                bg-[var(--color-bg-secondary)]">
                <Activity size={28} className="text-[var(--color-text-muted)]" />
              </div>
              <h2 className="text-lg font-semibold mb-1.5 text-[var(--color-text-primary)]">
                选择一个会话
              </h2>
              <p className="text-sm max-w-xs mx-auto text-[var(--color-text-muted)]">
                从侧边栏选择一个会话以查看其时间线事件和详情
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
