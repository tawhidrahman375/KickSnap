import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Clapperboard } from 'lucide-react'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'

/**
 * Catch-all for unknown URLs. Without this, a typo'd or stale link rendered a
 * blank page with no way back.
 */
export default function NotFound() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = 'Page not found — KickSnap'
  }, [])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-6">
          <Link to="/" className="flex items-center">
            <Logo className="h-7" />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <div className="font-display text-[clamp(4rem,14vw,8rem)] uppercase leading-none tracking-tight text-kick">
            404
          </div>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            This clip got cut.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            We couldn&apos;t find{' '}
            <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs text-foreground">
              {pathname}
            </code>
            . It may have moved, or the link might be wrong.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => navigate('/editor')}
              className="h-12 bg-kick px-6 font-bold uppercase tracking-wide text-black hover:bg-kick-hover"
            >
              <Clapperboard className="size-4" strokeWidth={2.5} />
              Open the editor
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="h-12 border-2 px-6 font-bold uppercase tracking-wide"
            >
              <ArrowLeft className="size-4" strokeWidth={2.5} />
              Back home
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
