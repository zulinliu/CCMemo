import { useState, useEffect } from 'react'
import type { Session } from '../lib/types'
import { api } from '../lib/api'
import { useTheme } from '../hooks/useTheme'
import { SessionList } from './SessionList'
import { Timeline } from './Timeline'
import { SessionDetail } from './SessionDetail'
import { SearchBar } from './SearchBar'
import { BottomTabBar, type MobileTab } from './BottomTabBar'
import { Sun, Moon } from 'lucide-react'

export function MobileLayout() {
  const { theme, toggle } = useTheme()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [tab, setTab] = useState<MobileTab>('sessions')

  useEffect(() => {
    api.projects.list().then(p => setProjects(p.map(({ id, name }) => ({ id, name })))).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedId) {
      api.sessions.get(selectedId).then(setSelectedSession).catch(() => setSelectedSession(null))
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

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-11 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>CCMemo</span>
        <button onClick={toggle}
          className="p-1.5 rounded-lg active:opacity-60"
          style={{ color: 'var(--color-text-tertiary)' }}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden pb-14">
        {tab === 'sessions' && (
          <div className="flex flex-col h-full">
            <div className="p-3 space-y-2" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <div className="flex gap-1.5">
                <select
                  value={projectFilter ?? ''}
                  onChange={e => setProjectFilter(e.target.value || undefined)}
                  className="flex-1 h-8 px-2 text-xs rounded-md outline-none"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border-primary)',
                    color: 'var(--color-text-secondary)',
                  }}>
                  <option value="">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                  value={statusFilter ?? ''}
                  onChange={e => setStatusFilter(e.target.value || undefined)}
                  className="w-24 h-8 px-2 text-xs rounded-md outline-none"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border-primary)',
                    color: 'var(--color-text-secondary)',
                  }}>
                  <option value="">Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="interrupted">Interrupted</option>
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <SessionList
                onSelect={handleSelect}
                selectedId={selectedId ?? undefined}
                searchQuery={searchQuery || undefined}
                projectId={projectFilter}
                statusFilter={statusFilter}
              />
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          selectedSession ? (
            <Timeline session={selectedSession} />
          ) : (
            <EmptyState message="Select a session to view its timeline" />
          )
        )}

        {tab === 'detail' && (
          selectedSession ? (
            <div className="h-full overflow-y-auto">
              <SessionDetail session={selectedSession} />
            </div>
          ) : (
            <EmptyState message="Select a session to view details" />
          )
        )}
      </div>

      {/* Bottom Tab Bar */}
      <BottomTabBar active={tab} onChange={handleTabChange} hasSession={!!selectedSession} />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full px-6">
      <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
    </div>
  )
}
