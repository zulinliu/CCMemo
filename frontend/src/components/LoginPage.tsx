import { useState } from 'react'
import { Lock, LogIn } from 'lucide-react'
import { api } from '../lib/api'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    setError('')
    setLoading(true)
    try {
      const ok = await api.auth.login(password)
      if (ok) {
        onLogin()
      } else {
        setError('密码错误，请重试')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-dvh bg-[var(--color-bg-primary)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[var(--color-bg-secondary)]">
            <Lock size={28} className="text-[var(--color-accent)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">CCMemo</h1>
          <p className="text-sm text-[var(--color-text-muted)]">请输入密码以继续</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
              访问密码
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoFocus
              disabled={loading}
              className="w-full h-11 px-3 text-sm rounded-lg outline-none
                bg-[var(--color-bg-secondary)] border border-[var(--color-card-border)] text-[var(--color-text-primary)]
                placeholder:text-[var(--color-text-muted)]
                focus:border-[var(--color-border-focus)] focus-ring
                disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-xs text-[var(--color-status-unrecoverable)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg font-medium text-sm text-white
              bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
              transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn size={15} />
            )}
            {loading ? '正在登录...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
