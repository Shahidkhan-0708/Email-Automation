import { Navigate } from 'react-router-dom'
import { useUserProfile, type ModuleName } from '@/lib/UserProfileContext'
import { LoadingState } from '@/components/ui'

/**
 * Wraps a page route to enforce module-level access.
 * If the user lacks the required module, redirects to /dashboard.
 */
export function ModuleGuard({
  module: mod,
  children,
}: {
  module: ModuleName
  children: React.ReactNode
}) {
  const { profile, loading } = useUserProfile()

  if (loading) return <LoadingState label="Checking permissions…" />
  if (!profile) return <Navigate to="/dashboard" replace />

  // Owners see everything
  if (profile.role === 'owner') return <>{children}</>

  if (!profile.enabled_modules.includes(mod)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
