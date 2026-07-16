import { useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { Loader2, ShieldCheck, TriangleAlert } from 'lucide-react'
import Logo from '@/components/Logo'
import DiscordIcon from '@/components/icons/DiscordIcon'
import { useAuth } from '@/lib/auth'

/**
 * Only ever send the user onward to a path inside KickSnap. `next` arrives from
 * the query string, so without this an attacker could hand someone a
 * /signin?next=https://evil.example link and use our own redirect to land them
 * on a lookalike right after a real login.
 */
function safeNext(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

export default function SignIn() {
  const { session, loading, isConfigured, signInWithDiscord } = useAuth()
  const [params] = useSearchParams()
  const location = useLocation()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const next = safeNext(params.get('next') ?? location.state?.next)

  if (session) return <Navigate to={next} replace />

  async function handleSignIn() {
    setError(null)
    setPending(true)
    try {
      // On success the browser leaves for Discord, so `pending` stays true and
      // the button keeps its spinner right up until navigation.
      await signInWithDiscord(next)
    } catch (err) {
      setError(err?.message ?? 'Could not start Discord sign-in.')
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex h-16 shrink-0 items-center px-6">
        <Link to="/" className="flex items-center">
          <Logo className="h-7" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            // Sign in
          </div>
          <h1 className="font-display text-[clamp(2.25rem,6vw,3rem)] uppercase leading-[0.85] tracking-tight">
            Welcome
            <br />
            back
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            KickSnap runs on Discord — the same account you clip with. No password to
            remember, no email to verify.
          </p>

          {!isConfigured ? (
            <div className="mt-7 flex items-start gap-3 rounded-none border-2 border-border bg-card p-4">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
              <div className="text-[13px] leading-relaxed text-muted-foreground">
                Sign-in isn&apos;t configured on this deployment yet. Add
                <code className="mx-1 font-mono text-xs text-foreground">VITE_SUPABASE_URL</code>
                and
                <code className="mx-1 font-mono text-xs text-foreground">VITE_SUPABASE_ANON_KEY</code>
                to enable it.
              </div>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={pending || loading}
              className="group mt-7 flex h-13 w-full items-center justify-center gap-3 rounded-none bg-[#5865F2] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="size-5 animate-spin" strokeWidth={2.25} />
                  Redirecting to Discord…
                </>
              ) : (
                <>
                  <DiscordIcon className="size-5" />
                  Continue with Discord
                </>
              )}
            </button>
          )}

          {error && (
            <p role="alert" className="mt-3 text-[13px] font-medium text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-kick" strokeWidth={2} />
            <p>
              We read your Discord username, avatar and email — nothing else. Your clips
              never leave your machine.
            </p>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-muted-foreground/70">
            By continuing you agree to our{' '}
            <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
