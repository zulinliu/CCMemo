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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-14 shrink-0"
      style={{
        background: 'var(--color-bg-primary)',
        borderTop: '1px solid var(--color-border-primary)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        const disabled = !hasSession && key !== 'sessions'
        return (
          <button
            key={key}
            onClick={() => !disabled && onChange(key)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-opacity duration-150"
            style={{
              color: isActive ? 'var(--color-accent)' : disabled ? 'var(--color-text-muted)' : 'var(--color-text-tertiary)',
              opacity: disabled ? 0.4 : 1,
            }}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
