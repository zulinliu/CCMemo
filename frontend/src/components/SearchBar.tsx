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
    <div className="relative">
      <Search size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={e => handleChange(e.target.value)}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-9 text-sm rounded-lg outline-none transition-all duration-200
          bg-[var(--color-bg-secondary)] border border-[var(--color-card-border)] text-[var(--color-text-primary)]
          focus:border-[var(--color-border-focus)] focus-ring
          md:h-9"
      />
      {localValue && (
        <button onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md active:opacity-60 text-[var(--color-text-muted)]">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
