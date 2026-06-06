import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}

export function useIsTablet(min = 768, max = 1024): boolean {
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${min}px) and (max-width: ${max}px)`)
    setIsTablet(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsTablet(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [min, max])

  return isTablet
}
