import { useIsMobile } from '../hooks/useMobile'
import { MobileLayout } from './MobileLayout'
import { DesktopLayout } from './DesktopLayout'

export function App() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileLayout /> : <DesktopLayout />
}
