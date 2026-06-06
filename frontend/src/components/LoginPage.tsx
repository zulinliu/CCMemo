import { useState, useRef } from 'react'
import { Lock, LogIn } from 'lucide-react'
import { motion } from 'motion/react'
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
        {/* Brand header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-col items-center"
          style={{ marginBottom: 'var(--space-8)', gap: 'var(--space-3)' }}
        >
          {/* Stamp-style brand icon */}
          <div
            className="flex items-center justify-center"
            style={{ width: '56px', height: '56px' }}
            aria-hidden="true"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--cinnabar)',
                boxShadow: '0 2px 8px rgba(194, 58, 46, 0.25)',
              }}
            >
              <Lock size={18} className="text-white" />
            </div>
          </div>

          <h1
            className="font-display text-3xl font-medium text-[var(--color-text-primary)] text-center"
            style={{ letterSpacing: '-0.02em' }}
          >
            墨途
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center">
            AI 编程会话的探索手账
          </p>
        </motion.div>

        {/* Login form */}
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
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
              className="w-full text-sm outline-none
                bg-transparent border-0 border-b-2
                text-[var(--color-text-primary)]
                placeholder:text-[var(--color-text-muted)]
                focus:border-[var(--cinnabar)] focus:ring-0
                transition-colors duration-200
                disabled:opacity-50"
              style={{
                height: 'var(--height-control-xl)',
                paddingBottom: 'var(--space-2)',
                borderBottomColor: error ? 'var(--cinnabar)' : 'var(--color-border-secondary)',
              }}
            />
          </div>

          {error && (
            <motion.p
              id="ccmemo-password-error"
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              aria-live="polite"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-[var(--status-failed)]"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading || !password.trim()}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-full flex items-center justify-center rounded-xl font-medium text-sm text-white
              transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              height: 'var(--height-control-xl)',
              gap: 'var(--space-2)',
              background: 'var(--cinnabar)',
            }}
            onMouseEnter={(e) => {
              if (!(loading || !password.trim())) {
                (e.target as HTMLElement).style.background = 'var(--cinnabar-hover)'
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'var(--cinnabar)'
            }}
          >
            {loading ? (
              <>
                <span
                  className="inline-block border-2 border-white/30 border-t-white rounded-full animate-spin"
                  style={{ width: '16px', height: '16px' }}
                  aria-hidden="true"
                />
                <span>正在登录...</span>
              </>
            ) : (
              <>
                <LogIn size={15} aria-hidden="true" />
                <span>登录</span>
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Footer stitch-line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="flex items-center text-xs text-[var(--color-text-muted)]"
          style={{ marginTop: 'var(--space-7)', gap: 'var(--space-3)' }}
        >
          <span className="flex-1 stitch-line" aria-hidden="true" />
          <span>本机部署, 数据不出本地</span>
          <span className="flex-1 stitch-line" aria-hidden="true" />
        </motion.div>
      </div>
    </main>
  )
}
