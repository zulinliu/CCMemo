import { useState, useRef } from 'react'
import { Lock, LogIn } from 'lucide-react'
import { api } from '../lib/api'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.login(password)
      if (result.ok) {
        onLogin()
      } else if (result.reason === 'wrong-password') {
        setError('密码错误，请检查后重试（连续 5 次错误将临时锁定）')
        errorRef.current?.focus()
      } else if (result.reason === 'network') {
        setError('无法连接到服务，请检查网络后重试')
        errorRef.current?.focus()
      } else {
        setError('服务暂时不可用，请稍后重试')
        errorRef.current?.focus()
      }
    } catch {
      setError('无法连接到服务，请检查网络后重试')
      errorRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="flex items-center justify-center min-h-dvh bg-[var(--color-bg-primary)]"
      style={{ paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)' }}
    >
      <div className="w-full max-w-sm">
        <div
          className="flex flex-col items-center"
          style={{
            marginBottom: 'var(--space-7)',
            gap: 'var(--space-3)',
          }}
        >
          <div
            className="rounded-2xl flex items-center justify-center bg-[var(--color-bg-secondary)]"
            style={{ width: '64px', height: '64px' }}
            aria-hidden="true"
          >
            <Lock size={28} className="text-[var(--color-accent)]" />
          </div>
          <h1
            className="text-2xl font-bold text-[var(--color-text-primary)] text-center"
            style={{ marginTop: 'var(--space-1)' }}
          >
            CCMemo
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center">请输入密码以继续</p>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label
              htmlFor="ccmemo-password"
              className="block text-xs font-medium text-[var(--color-text-secondary)]"
              style={{ marginBottom: 'var(--space-2)' }}
            >
              访问密码
            </label>
            <input
              id="ccmemo-password"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
              spellCheck={false}
              autoFocus
              disabled={loading}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'ccmemo-password-error' : undefined}
              className="w-full text-sm rounded-lg outline-none
                bg-[var(--color-bg-secondary)] border border-[var(--color-card-border)] text-[var(--color-text-primary)]
                placeholder:text-[var(--color-text-muted)]
                focus:border-[var(--color-border-focus)] focus-visible:ring-0 focus-ring
                disabled:opacity-50"
              style={{
                height: 'var(--height-control-xl)',
                paddingLeft: 'var(--space-4)',
                paddingRight: 'var(--space-4)',
              }}
            />
          </div>

          {error && (
            <p
              id="ccmemo-password-error"
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              aria-live="polite"
              className="text-xs text-[var(--color-status-unrecoverable)]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full flex items-center justify-center rounded-lg font-medium text-sm text-white
              bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
              transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              height: 'var(--height-control-xl)',
              gap: 'var(--space-2)',
            }}
          >
            {loading ? (
              <>
                <span
                  className="inline-block border-2 border-white/30 border-t-white rounded-full animate-spin"
                  style={{ width: '16px', height: '16px' }}
                  aria-hidden="true"
                />
                <span>正在登录…</span>
              </>
            ) : (
              <>
                <LogIn size={15} aria-hidden="true" />
                <span>登录</span>
              </>
            )}
          </button>
        </form>

        <div
          className="flex items-center text-xs text-[var(--color-text-muted)]"
          style={{ marginTop: 'var(--space-6)', gap: 'var(--space-3)' }}
        >
          <span
            className="flex-1 bg-[var(--color-border-primary)]"
            style={{ height: '1px' }}
            aria-hidden="true"
          />
          <span>本机部署 · 数据不出本地</span>
          <span
            className="flex-1 bg-[var(--color-border-primary)]"
            style={{ height: '1px' }}
            aria-hidden="true"
          />
        </div>
      </div>
    </main>
  )
}
