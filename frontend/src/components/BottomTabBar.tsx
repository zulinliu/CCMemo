import { Layers, Clock, BarChart3 } from 'lucide-react'

export type MobileTab = 'sessions' | 'timeline' | 'detail'

interface BottomTabBarProps {
  active: MobileTab
  onChange: (tab: MobileTab) => void
  hasSession: boolean
}

const tabs: { key: MobileTab; label: string; aria: string; icon: typeof Layers }[] = [
  { key: 'sessions', label: '会话', aria: '会话列表', icon: Layers },
  { key: 'timeline', label: '时间线', aria: '时间线事件', icon: Clock },
  { key: 'detail', label: '详情', aria: '会话详情', icon: BarChart3 },
]

export function BottomTabBar({ active, onChange, hasSession }: BottomTabBarProps) {
  return (
    <nav
      role="tablist"
      aria-label="主导航"
      className="shrink-0 flex justify-around items-center z-50
        bg-[var(--color-bg-primary)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-primary)]/80
        border-t border-[var(--color-border-primary)]"
      style={{
        height: 'var(--height-bar-lg)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map(({ key, label, aria, icon: Icon }) => {
        const isActive = active === key
        const disabled = !hasSession && key !== 'sessions'
        return (
          <button
            key={key}
            onClick={() => !disabled && onChange(key)}
            disabled={disabled}
            role="tab"
            aria-selected={isActive}
            aria-label={aria}
            aria-disabled={disabled}
            className={`relative flex flex-col items-center justify-center flex-1 h-full
              transition-opacity duration-150 focus-visible:ring-0 focus-ring
              ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              color: isActive ? 'var(--color-accent)' : disabled ? 'var(--color-text-muted)' : 'var(--color-text-tertiary)',
              gap: 'var(--space-1)',
            }}
          >
            <Icon size={20} aria-hidden="true" />
            <span
              className={isActive ? 'font-semibold' : 'font-medium'}
              style={{ fontSize: '11px', lineHeight: 1.2 }}
            >
              {label}
            </span>
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent)]"
                style={{ top: '0px', width: '32px', height: '2px' }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
