import { Layers, Clock, BarChart3 } from 'lucide-react'

export type MobileTab = 'sessions' | 'timeline' | 'detail'

interface BottomTabBarProps {
  active: MobileTab
  onChange: (tab: MobileTab) => void
  hasSession: boolean
}

const tabs: { key: MobileTab; label: string; icon: typeof Layers }[] = [
  { key: 'sessions', label: '会话', icon: Layers },
  { key: 'timeline', label: '时间线', icon: Clock },
  { key: 'detail', label: '详情', icon: BarChart3 },
]

export function BottomTabBar({ active, onChange, hasSession }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-14 shrink-0
      bg-[var(--color-bg-primary)] border-t border-[var(--color-border-primary)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        const disabled = !hasSession && key !== 'sessions'
        return (
          <button
            key={key}
            onClick={() => !disabled && onChange(key)}
            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full
              transition-opacity duration-150 ${disabled ? 'opacity-40' : ''}`}
            style={{ color: isActive ? 'var(--color-accent)' : disabled ? 'var(--color-text-muted)' : 'var(--color-text-tertiary)' }}>
            <Icon size={20} />
            <span className={`text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[var(--color-accent)]" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
