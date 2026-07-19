import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Monitor, ArrowRight, Clapperboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Reveal from './Reveal'
import Eyebrow from './Eyebrow'

// The real WebCodecs editor pulls in mediabunny — code-split it so it only
// loads once this section scrolls into view, keeping the initial bundle lean.
const EmbeddedEditor = lazy(() => import('@/editor/EmbeddedEditor'))

/** Fire once when the referenced element nears the viewport. */
function useInView(ref, rootMargin = '250px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, inView, rootMargin])
  return inView
}

/** The editor needs room for its sidebar + canvas + timeline — desktop only. */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 1024px)').matches
      : true,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setDesktop(mq.matches)
    // Resync on mount: the initializer ran during render, and the width can
    // differ by the time the effect fires (or be reported as 0 pre-layout),
    // which would strand the demo on the wrong branch until the next resize.
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return desktop
}

function DemoLoading() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin" strokeWidth={2} />
      Loading the editor…
    </div>
  )
}

/**
 * Holds the frame's space before the editor starts fetching. Deliberately NOT
 * the loading spinner — nothing is loading yet, and a spinner here is
 * indistinguishable from a genuinely stuck load.
 */
function DemoIdle() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground/60">
      <Clapperboard className="size-5" strokeWidth={1.75} />
      Scroll to load the editor
    </div>
  )
}

function MobileFallback({ onOpen }) {
  return (
    <div className="flex h-[420px] flex-col items-center justify-center gap-4 rounded-lg border border-border bg-background px-6 text-center">
      <Monitor className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
      <div>
        <div className="text-lg font-semibold">Best experienced on desktop</div>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          The editor runs on your browser's video engine — open it on desktop Chrome or
          Edge to try the full thing.
        </p>
      </div>
      <Button onClick={onOpen} className="font-semibold">
        Open the editor <ArrowRight className="size-4" strokeWidth={2.5} />
      </Button>
    </div>
  )
}

export default function LiveDemo() {
  const navigate = useNavigate()
  const frameRef = useRef(null)
  const inView = useInView(frameRef)
  const isDesktop = useIsDesktop()
  const showEditor = inView && isDesktop

  return (
    <section id="demo" className="scroll-mt-20 border-t border-border bg-background py-14 sm:py-16">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="max-w-3xl">
          <Eyebrow>Live demo</Eyebrow>
          <h2 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] uppercase leading-[0.9] tracking-tight text-foreground">
            Try it live.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <div
            ref={frameRef}
            className="relative rounded-xl border-2 border-border bg-card p-2.5"
          >
            {/* window chrome */}
            <div className="flex items-center gap-1.5 px-1.5 py-1.5">
              <span className="size-2.5 rounded-full bg-destructive/50" />
              <span className="size-2.5 rounded-full bg-yellow-500/50" />
              <span className="size-2.5 rounded-full bg-kick/50" />
            </div>

            {isDesktop ? (
              <div className="h-[880px] overflow-hidden rounded-lg border border-border bg-background">
                {showEditor ? (
                  <Suspense fallback={<DemoLoading />}>
                    <EmbeddedEditor onLockedExport={() => navigate('/editor')} />
                  </Suspense>
                ) : (
                  <DemoIdle />
                )}
              </div>
            ) : (
              <MobileFallback onOpen={() => navigate('/editor')} />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
