import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search sessions...' }: SearchBarProps) {
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
      <Search size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-text-muted)' }} />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={e => handleChange(e.target.value)}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 text-sm rounded-lg outline-none transition-all duration-200"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-primary)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-sans)',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--color-border-focus)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(198, 97, 63, 0.1)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--color-border-primary)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {localValue && (
        <button onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--color-surface-hover)]"
          style={{ color: 'var(--color-text-muted)' }}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}
