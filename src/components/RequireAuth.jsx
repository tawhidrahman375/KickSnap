import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

/**
 * Gate for account-only routes.
 *
 * When no Supabase project is attached the gate opens: a local checkout without
 * `.env.local` should still be able to work on the dashboard, and a preview
 * deploy missing its env vars should degrade to guest mode rather than bounce
 * everyone to a sign-in page that cannot work. Real gating starts the moment the
 * env vars exist.
 */
export default function RequireAuth({ children }) {
  const { session, loading, isConfigured } = useAuth()
  const location = useLocation()

  if (!isConfigured) return children

  if (loading) {
    return (
      <div className="min-h-svh bg-background" aria-busy="true" aria-label="Loading your account" />
    )
  }

  if (!session) {
    return <Navigate to={`/signin?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}
