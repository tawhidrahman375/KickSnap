import { useRef, useState, useCallback } from 'react'
import { Play } from 'lucide-react'
import Reveal from './Reveal'
import Eyebrow from './Eyebrow'

/**
 * Placeholder "video frame" — swapped for a real sample-clip still once
 * we have one. Left layer is blurred to represent CapCut's default export.
 */
function Frame({ blurred, label, labelClass }) {
  return (
    <div className="relative h-full w-full select-none">
      <div
        className="h-full w-full"
        style={{
          background:
            'linear-gradient(135deg, #1a2e12 0%, #2d5016 30%, #53fc18 55%, #1a2e12 100%)',
          filter: blurred ? 'blur(4px) saturate(0.7) contrast(0.9)' : 'none',
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
          <Play className="size-7 fill-white text-white" />
        </div>
      </div>
      <span
        className={`absolute bottom-3 left-3 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wide ${labelClass}`}
      >
        {label}
      </span>
    </div>
  )
}

export default function ExportQuality() {
  const [pos, setPos] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)

  const updateFromClientX = useCallback((clientX) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.max(0, Math.min(100, pct)))
  }, [])

  const onPointerDown = (e) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromClientX(e.clientX)
  }
  const onPointerMove = (e) => {
    if (dragging.current) updateFromClientX(e.clientX)
  }
  const onPointerUp = () => {
    dragging.current = false
  }

  return (
    <section className="border-t-2 border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal className="max-w-3xl">
          <Eyebrow>Export quality</Eyebrow>
          <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[0.9] tracking-tight text-foreground">
            CapCut exports blurry.
            <br />
            <span className="text-kick">KickSnap exports right.</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg font-medium text-muted-foreground">
            1080p, correct bitrate, matched frame rate — automatically. Drag to
            compare.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative mx-auto aspect-[9/16] w-full max-w-xs cursor-ew-resize overflow-hidden border-2 border-border"
          >
            {/* After (crisp) — full width underneath */}
            <div className="absolute inset-0">
              <Frame
                label="KickSnap export"
                labelClass="bg-kick text-black"
              />
            </div>

            {/* Before (blurry) — full-size, revealed left of the divider via clip-path */}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            >
              <Frame blurred label="CapCut default" labelClass="bg-black/70 text-white" />
            </div>

            {/* Divider handle */}
            <div
              className="absolute top-0 bottom-0 z-10 w-0.5 bg-white"
              style={{ left: `${pos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/50 backdrop-blur">
                <div className="flex gap-0.5">
                  <span className="text-white">‹</span>
                  <span className="text-white">›</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
