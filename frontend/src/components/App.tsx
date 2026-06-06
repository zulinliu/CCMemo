import { useState, useEffect } from 'react'
import { useIsMobile } from '../hooks/useMobile'
import { MobileLayout } from './MobileLayout'
import { DesktopLayout } from './DesktopLayout'
import { LoginPage } from './LoginPage'
import { api } from '../lib/api'

export function App() {
  const isMobile = useIsMobile()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    api.auth.check().then(setAuthed).catch(() => setAuthed(false))
  }, [])

  useEffect(() => {
    function handleUnauthorized() {
      setAuthed(false)
    }
    window.addEventListener('ccmemo:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('ccmemo:unauthorized', handleUnauthorized)
  }, [])

  if (authed === null) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[var(--color-bg-primary)]">
        <div
          className="border-2 border-[var(--color-text-muted)] border-t-[var(--color-accent)] rounded-full animate-spin"
          style={{ width: '24px', height: '24px' }}
          role="status"
          aria-label="正在加载"
        />
      </div>
    )
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />
  }

  return isMobile ? <MobileLayout /> : <DesktopLayout />
}
