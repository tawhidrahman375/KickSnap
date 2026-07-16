import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, TriangleAlert } from 'lucide-react'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

function safeNext(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

/**
 * Landing strip for the Discord OAuth redirect.
 *
 * The supabase client is created with `detectSessionInUrl`, so it spots the
 * ?code= on this route and exchanges it for a session on its own; this page just
 * waits for that to land and forwards the user on. Nothing here parses the code.
 */
export default function AuthCallback() {
  const { session } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [timedOut, setTimedOut] = useState(false)

  const next = safeNext(params.get('next'))
  // Discord/Supabase report a refusal by redirecting back with these, not by
  // failing the exchange — e.g. the user hit "Cancel" on the consent screen.
  const oauthError = params.get('error_description') || params.get('error')

  useEffect(() => {
    if (session) navigate(next, { replace: true })
  }, [session, next, navigate])

  useEffect(() => {
    if (oauthError || session) return
    // Backstop: if the exchange neither succeeds nor reports an error, don't
    // leave the user on an eternal spinner.
    const id = setTimeout(() => setTimedOut(true), 12000)
    return () => clearTimeout(id)
  }, [oauthError, session])

  const failed = Boolean(oauthError) || (timedOut && !session)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <Logo className="h-7" />

      {failed ? (
        <div className="max-w-sm">
          <span className="mx-auto flex size-11 items-center justify-center rounded-none border-2 border-border bg-card text-muted-foreground">
            <TriangleAlert className="size-5" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Sign-in didn&apos;t finish</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {oauthError || 'Discord took too long to respond. Nothing was changed on your account.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Button onClick={() => navigate('/signin', { replace: true })} className="h-10 px-4 text-sm font-semibold">
              Try again
            </Button>
            <Link to="/">
              <Button variant="outline" className="h-10 px-4 text-sm font-medium">
                Back to site
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-kick" strokeWidth={2.25} />
          Finishing sign-in…
        </div>
      )}
    </div>
  )
}
