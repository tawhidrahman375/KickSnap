import { useEffect, useRef, useState, useCallback } from 'react'
import Reveal from './Reveal'
import Eyebrow from './Eyebrow'

const CLIP = '/export-sample.mp4'
const OVERLAY = '/overlays/adrienbroner.png'

// Source clip is 16:9; object-cover crops it into the 9:16 frame. A slight zoom
// from the top pushes the streamer's bottom watermark out of frame, and the
// horizontal object-position nudges the subject left.
const clipStyle = {
  objectPosition: '44% 0%',
  transform: 'scale(1.16)',
  transformOrigin: '50% 0%',
}

// How much the CapCut side is downscaled before being scaled back up. The clip
// is rendered into a box 1/DOWNSCALE the size, so it decodes at a fraction of
// the resolution, then the wrapper scales it back to full size — a genuine loss
// of detail (soft, mushy), the way a real low-bitrate export looks. Not a blur,
// not a tint: actual lower-resolution video.
const DOWNSCALE = 3.2

/** Load the heavy clip only once the section nears the viewport. */
function useInView(ref, rootMargin = '300px') {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, seen, rootMargin])
  return seen
}

export default function ExportQuality() {
  const [pos, setPos] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)
  const seen = useInView(containerRef)

  // The crisp clip is the master; the downscaled CapCut copy follows its clock
  // so both halves show the same frame across the divider. Converge with tiny
  // playbackRate nudges — NOT hard seeks, which flush the decoder and stutter.
  // Only snap on a big gap (e.g. the loop wrapping back to 0).
  const masterRef = useRef(null)
  const capRef = useRef(null)
  const syncCap = useCallback(() => {
    const m = masterRef.current
    const c = capRef.current
    if (!m || !c) return
    if (m.paused !== c.paused) return void (m.paused ? c.pause() : c.play().catch(() => {}))
    const diff = m.currentTime - c.currentTime // + => CapCut is behind
    if (Math.abs(diff) > 0.4) {
      c.currentTime = m.currentTime // big gap (loop wrap): snap once
      c.playbackRate = 1
    } else {
      // ease toward the master: speed up when behind, slow when ahead
      c.playbackRate = Math.max(0.85, Math.min(1.15, 1 + diff))
    }
  }, [])

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

  // Keyboard alternative to dragging — the divider is otherwise a pointer-only
  // interaction, which would leave keyboard users with no way to see the
  // comparison at all.
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 20 : 5
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPos((p) => Math.max(0, p - step))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setPos((p) => Math.min(100, p + step))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setPos(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setPos(100)
    }
  }

  return (
    <section className="border-t border-border bg-background py-20 sm:py-24">
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
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="slider"
            aria-label="Drag to compare CapCut export quality to KickSnap export quality"
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={`${Math.round(pos)}% CapCut shown, ${100 - Math.round(pos)}% KickSnap shown`}
            className="relative mx-auto aspect-[9/16] w-full max-w-xs cursor-ew-resize touch-none select-none overflow-hidden rounded-xl border border-border bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kick focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {/* KickSnap export — crisp, full clip underneath */}
            {seen ? (
              <video
                ref={masterRef}
                src={CLIP}
                className="absolute inset-0 h-full w-full object-cover"
                style={clipStyle}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onTimeUpdate={syncCap}
                onPlay={syncCap}
                onSeeked={syncCap}
              />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}

            {/* CapCut side — the SAME clip, but genuinely rendered at a
                fraction of the resolution and scaled back up, revealed left of
                the divider. The inner wrapper is 1/DOWNSCALE the size so the
                video decodes small (real detail loss), then scale(DOWNSCALE)
                blows it back to full frame — soft, mushy, lower-quality video,
                not a blur or a tint. Same crop math as the crisp side, so the
                two halves line up across the divider. */}
            {seen && (
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
              >
                <div
                  className="absolute left-0 top-0"
                  style={{
                    width: `${100 / DOWNSCALE}%`,
                    height: `${100 / DOWNSCALE}%`,
                    transform: `scale(${DOWNSCALE})`,
                    transformOrigin: 'top left',
                    filter: 'contrast(1.03)',
                  }}
                >
                  <video
                    ref={capRef}
                    src={CLIP}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={clipStyle}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                  />
                </div>
              </div>
            )}

            {/* Kick overlay for the clip — sat low in the frame. */}
            <img
              src={OVERLAY}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-x-0 z-[5] w-full select-none"
              style={{ top: '71%' }}
            />

            {/* Labels */}
            <span className="absolute bottom-3 left-3 z-10 bg-black/70 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-white">
              CapCut default
            </span>
            <span className="absolute bottom-3 right-3 z-10 bg-kick px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-black">
              KickSnap export
            </span>

            {/* Divider handle */}
            <div className="absolute top-0 bottom-0 z-20 w-0.5 bg-white" style={{ left: `${pos}%` }}>
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
