import { useEffect, useState } from 'react'
import { useEditor } from '../EditorContext'
import { OVERLAY, BLANK_OVERLAY } from '../constants'
import { kickMarkSvg, KICK_LOGO_SRC } from '../kickMark'
import { cn } from '@/lib/utils'

// Vertical drag limits (normalized center Y). Near the frame edges we give a
// quiet, passive heads-up — it never blocks or snaps; they can put it anywhere.
const MIN_Y = 0.26
const MAX_Y = 0.78
// Warn only once the bar is dragged past the default resting spot (0.72), so the
// heads-up never fires on load — only when they actually push it near an edge.
const WARN_LOW = 0.75
const WARN_HIGH = 0.3

const KICK_SVG = kickMarkSvg('#53fc18')

// Source px -> cqw (1cqw = 1% of frame width; overlay measured in a 1082px source).
const K = 100 / OVERLAY.srcW
const cqw = (px) => `${px * K}cqw`
const BAR_CENTER_OFF = cqw(OVERLAY.barCenterY) // image anchor: bar center -> posY

// text-overlay fallback geometry (streamers without a PNG)
const BAR_H = cqw(OVERLAY.barH)
const RADIUS = cqw(OVERLAY.radius)
const TAB_LEFT = cqw(OVERLAY.tabX)
const TAB_W = cqw(OVERLAY.tabW)
const TAB_H = cqw(OVERLAY.barCenterY + OVERLAY.barH / 2 - OVERLAY.tabTopY)
const LOGO_LEFT = cqw(OVERLAY.logoX - OVERLAY.tabX)
const LOGO_TOP = cqw(OVERLAY.logoTopY - OVERLAY.tabTopY)
const LOGO_W = cqw(OVERLAY.logoW)
const TEXT_LEFT = cqw(OVERLAY.tabX + OVERLAY.tabW)
const TEXT_SIZE = cqw(OVERLAY.textSize)

/**
 * The locked Kick overlay. Normally the real overlay PNG (blank default, the
 * picked streamer's asset, or a custom import) drawn full-width and anchored so
 * the bar center sits at the drag position. For the handful of listed streamers
 * we don't have a PNG for, it falls back to a text overlay (bar + real KICK
 * wordmark + name). Slides vertically only.
 */
export default function OverlayLayer({ containerRef }) {
  const { state, dispatch } = useEditor()
  const { streamer, image, position } = state.overlay
  const selected = state.selectedElement === 'overlay'
  const [dragging, setDragging] = useState(false)
  const [imgError, setImgError] = useState(false) // overlay PNG failed → text mode
  const [markOk, setMarkOk] = useState(true) // extracted wordmark failed → vector

  const name = streamer.trim()
  // Image mode src: explicit image, else the blank default when nothing's chosen.
  // A listed-but-no-PNG streamer has a name but no image → text mode.
  const overlaySrc = imgError ? null : image || (name ? null : BLANK_OVERLAY)

  const tooLow = position >= WARN_LOW
  const tooHigh = position <= WARN_HIGH
  const warn = tooLow ? 'Sits a little low' : tooHigh ? 'Sits a little high' : null

  // Passive heads-up: appear when the bar enters a warn zone, then fade out after
  // 5s. Dragging keeps it alive (the timer resets on each position change).
  const [warnShown, setWarnShown] = useState(false)
  useEffect(() => {
    if (!warn) {
      setWarnShown(false)
      return
    }
    setWarnShown(true)
    const id = setTimeout(() => setWarnShown(false), 5000)
    return () => clearTimeout(id)
  }, [warn, position])

  useEffect(() => {
    if (!dragging) return
    function onMove(e) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const y = (e.clientY - rect.top) / rect.height
      const clamped = Math.min(MAX_Y, Math.max(MIN_Y, y))
      dispatch({ type: 'SET_OVERLAY', patch: { position: clamped } })
    }
    function onUp() {
      setDragging(false)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, containerRef, dispatch])

  const startDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch({ type: 'SELECT_ELEMENT', element: 'overlay' })
    setDragging(true)
  }

  return (
    <>
      {/* passive heads-up — quiet pill near the bar, never blocks */}
      {warn && (
        <div
          style={{
            top: `${position * 100}%`,
            transform: `translate(-50%, calc(-50% ${tooLow ? '- 3.6cqh' : '+ 3.6cqh'}))`,
            fontSize: '1.9cqh',
          }}
          className={cn(
            'pointer-events-none absolute left-1/2 z-30 flex items-center gap-[0.8cqw] whitespace-nowrap rounded-full border border-amber-300/20 bg-black/55 px-[1.6cqw] py-[0.5cqh] font-medium text-amber-200/90 backdrop-blur-sm transition-opacity duration-500',
            warnShown ? 'opacity-100' : 'opacity-0',
          )}
        >
          <span className="rounded-full bg-amber-300/80" style={{ width: '0.9cqh', height: '0.9cqh' }} />
          {warn}
        </div>
      )}

      {overlaySrc ? (
        <img
          src={overlaySrc}
          alt=""
          draggable={false}
          onError={() => setImgError(true)}
          onPointerDown={startDrag}
          style={{ left: 0, width: '100cqw', top: `calc(${position * 100}% - ${BAR_CENTER_OFF})` }}
          className={cn(
            'absolute z-10 cursor-grab select-none active:cursor-grabbing',
            selected && 'outline outline-2 outline-offset-2 outline-kick',
          )}
        />
      ) : (
        <div
          onPointerDown={startDrag}
          style={{ top: `${position * 100}%`, height: BAR_H, borderRadius: RADIUS }}
          className={cn(
            'group absolute inset-x-0 z-10 -translate-y-1/2 cursor-grab select-none bg-black active:cursor-grabbing',
            selected && 'outline outline-2 outline-offset-2 outline-kick',
          )}
        >
          <div
            style={{ left: TAB_LEFT, width: TAB_W, height: TAB_H, borderRadius: `${RADIUS} ${RADIUS} 0 0` }}
            className="absolute bottom-0 bg-black"
          >
            {markOk ? (
              <img
                src={KICK_LOGO_SRC}
                alt="KICK"
                draggable={false}
                onError={() => setMarkOk(false)}
                style={{ position: 'absolute', left: LOGO_LEFT, top: LOGO_TOP, width: LOGO_W }}
              />
            ) : (
              <span
                style={{ position: 'absolute', left: LOGO_LEFT, top: LOGO_TOP, width: LOGO_W }}
                className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: KICK_SVG }}
              />
            )}
          </div>
          <div
            className="absolute inset-y-0 flex items-center justify-center whitespace-nowrap font-extrabold uppercase text-white"
            style={{ left: TEXT_LEFT, right: 0, fontSize: TEXT_SIZE, letterSpacing: '0.02em' }}
          >
            KICK.COM/{name}
          </div>
        </div>
      )}
    </>
  )
}
