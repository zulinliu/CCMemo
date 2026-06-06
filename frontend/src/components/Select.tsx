import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  ariaLabel: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: React.CSSProperties
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  size = 'md',
  className = '',
  style,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selected = options.find(o => o.value === value)
  const displayLabel = selected?.label ?? placeholder ?? ''

  const close = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open, close])

  const heightVar = size === 'sm' ? 'var(--height-control-sm)' : size === 'lg' ? 'var(--height-control-xl)' : 'var(--height-control-md)'
  const radiusVar = size === 'sm' ? 'var(--radius-md)' : 'var(--radius-lg)'
  const fontSize = size === 'sm' ? '12px' : '14px'
  const chevronSize = size === 'sm' ? 12 : 14

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(Math.max(0, options.findIndex(o => o.value === value)))
      } else {
        setActiveIndex(prev => Math.min(options.length - 1, prev + 1))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (open) setActiveIndex(prev => Math.max(0, prev - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(Math.max(0, options.findIndex(o => o.value === value)))
      } else if (activeIndex >= 0) {
        onChange(options[activeIndex].value)
        close()
        triggerRef.current?.focus()
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={style}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`w-full inline-flex items-center outline-none cursor-pointer text-left
          bg-[var(--color-bg-secondary)] border border-[var(--color-card-border)] text-[var(--color-text-secondary)]
          transition-colors duration-150
          hover:border-[var(--color-border-secondary)]
          focus-visible:border-[var(--color-border-focus)] focus-ring
          ${open ? 'border-[var(--color-border-focus)]' : ''}`}
        style={{
          height: heightVar,
          borderRadius: radiusVar,
          paddingLeft: 'var(--space-3)',
          paddingRight: 'var(--space-3)',
          gap: 'var(--space-2)',
          fontSize,
          fontWeight: 500,
        }}
      >
        <span
          className="flex-1 min-w-0 truncate"
          style={{ color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
        >
          {displayLabel}
        </span>
        <ChevronDown
          size={chevronSize}
          aria-hidden="true"
          className="shrink-0 text-[var(--color-text-muted)]"
          style={{
            transition: 'transform 150ms',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 z-50 overflow-y-auto
            bg-[var(--color-bg-elevated)] border border-[var(--color-card-border)]"
          style={{
            top: 'calc(100% + var(--space-1))',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-1)',
            maxHeight: '320px',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            const isActive = i === activeIndex
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  onChange(opt.value)
                  close()
                  triggerRef.current?.focus()
                }}
                className={`w-full inline-flex items-center text-left cursor-pointer outline-none
                  focus-visible:ring-0 focus:outline-none
                  ${isActive ? 'bg-[var(--color-surface-hover)]' : ''}
                  ${isSelected ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'}`}
                style={{
                  minHeight: 'var(--height-control-sm)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  gap: 'var(--space-2)',
                  fontSize,
                }}
              >
                <span className="flex-1 min-w-0 truncate">{opt.label}</span>
                {isSelected && (
                  <Check
                    size={chevronSize}
                    aria-hidden="true"
                    className="shrink-0 text-[var(--color-accent)]"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
