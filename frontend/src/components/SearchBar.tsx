import { Search, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = '搜索会话...' }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const composingRef = useRef(false)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (debounceRef.current !== undefined) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleChange = (v: string) => {
    setLocalValue(v)
    if (debounceRef.current !== undefined) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!composingRef.current) onChange(v)
    }, 300)
  }

  const handleCompositionStart = () => {
    composingRef.current = true
  }

  const handleCompositionEnd = () => {
    composingRef.current = false
    onChange(localValue)
  }

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div
      className="relative flex items-center w-full h-11 rounded-lg
        bg-[var(--color-bg-secondary)] border border-[var(--color-card-border)]
        focus-within:border-[var(--color-border-focus)]
        transition-colors duration-200 focus-within:shadow-[0_0_0_4px_var(--color-bg-primary),0_0_0_calc(4px+2px)_var(--color-border-focus)]"
    >
      <label htmlFor="ccmemo-search" className="sr-only">
        搜索会话
      </label>
      <Search
        size={16}
        className="shrink-0 text-[var(--color-text-muted)]"
        style={{ marginLeft: 'var(--space-4)' }}
        aria-hidden="true"
      />
      <input
        id="ccmemo-search"
        ref={inputRef}
        type="text"
        role="searchbox"
        value={localValue}
        onChange={e => handleChange(e.target.value)}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder}
        aria-label="搜索会话标题或内容"
        autoComplete="off"
        spellCheck={false}
        className="flex-1 min-w-0 h-full bg-transparent outline-none text-sm
          text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-muted)]
          border-0 focus:ring-0"
        style={{
          paddingLeft: 'var(--space-3)',
          paddingRight: localValue ? '40px' : 'var(--space-4)',
        }}
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md
            active:opacity-60 text-[var(--color-text-muted)]
            hover:bg-[var(--color-surface-hover)] focus-visible:ring-0 focus-ring"
          style={{ padding: '6px' }}
          aria-label="清空搜索"
          title="清空搜索"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
