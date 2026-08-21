import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Wraps page content with a subtle fade-in-up animation on route change.
 * Uses CSS animation class (no JS animation library needed).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [key, setKey] = useState(0)

  useEffect(() => {
    setKey(k => k + 1)
  }, [location.pathname])

  return (
    <div key={key} className="page-enter">
      {children}
    </div>
  )
}
