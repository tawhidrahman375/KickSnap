import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, RefreshCw, Plus, TriangleAlert, Upload, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { useEditor } from './EditorContext'
import { probeClip } from './probe'
import { blurFraction } from './constants'
import OverlayLayer from './layers/OverlayLayer'
import TextLayer from './layers/TextLayer'
import Logo from '@/components/Logo'
import { cn } from '@/lib/utils'

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
// How close (as a fraction of the frame/panel) the centre must be before the
// clip snaps to it. Drag past this to break the snap — the CapCut feel.
const SNAP_EPS = 0.02

/**
 * Centre preview + the upload target in one surface. When no clip is loaded the
 * 9:16 canvas shows the drop zone; a dropped clip loads directly into it. A live
 * <video> fills the frame per format + effect, with the KICK overlay and caption
 * composited on top as draggable DOM layers. The whole canvas can be zoomed
 * (scroll wheel / buttons), and clicking an element selects it CapCut-style.
 * Moving a clip snaps to centre with guide lines; the split layout is two
 * independently selectable + movable panels.
 */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const cssT = (t) => `translate(${t.x * 100}%, ${t.y * 100}%) scale(${t.scale})`

export default function Preview({ videoRef }) {
  const { state, dispatch } = useEditor()
  const { format, effect, clip, loading, split, error, blur, transform, selectedElement } = state
  const frameRef = useRef(null)
  const viewportRef = useRef(null)
  const clipPanelRef = useRef(null)
  const imagePanelRef = useRef(null)
  const topFileRef = useRef(null)
  const dropFileRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [tdrag, setTdrag] = useState(null) // 'move' | 'nw'|'ne'|'sw'|'se'
  const tdragRef = useRef(null)
  const [guides, setGuides] = useState({ target: null, v: false, h: false })

  const src = clip?.url
  const isSplit = format === 'split'
  const canTransform = clip && !isSplit // the full-frame transform box

  const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
  const nudgeZoom = useCallback((delta) => setZoom((z) => clampZoom(z + delta)), [])

  // Combined CSS transform for the full/square preview video: interactive clip
  // transform folded in with the blur foreground zoom. Mirrors compositor math.
  const baseScale = format === 'full' && effect === 'blur' ? blur.zoom : 1
  const videoTransform = isSplit
    ? undefined
    : `translate(${transform.x * 100}%, ${transform.y * 100}%) scale(${baseScale * transform.scale})`

  // --- transform target plumbing (full clip + the two split panels) ---
  const activeTransform = (target) =>
    target === 'split-clip' ? split.clipTransform
      : target === 'split-image' ? split.imageTransform
        : transform
  const applyTransform = useCallback(
    (target, patch) => {
      if (target === 'split-clip') dispatch({ type: 'SET_SPLIT_TRANSFORM', role: 'clip', patch })
      else if (target === 'split-image') dispatch({ type: 'SET_SPLIT_TRANSFORM', role: 'image', patch })
      else dispatch({ type: 'SET_TRANSFORM', patch })
    },
    [dispatch],
  )
  const resetTarget = (target) => {
    if (target === 'split-clip') dispatch({ type: 'SET_SPLIT_TRANSFORM', role: 'clip', patch: { scale: 1, x: 0, y: 0 } })
    else if (target === 'split-image') dispatch({ type: 'SET_SPLIT_TRANSFORM', role: 'image', patch: { scale: 1, x: 0, y: 0 } })
    else dispatch({ type: 'RESET_TRANSFORM' })
  }

  // Drag a clip/panel body to reposition it (snaps to centre).
  const startMove = (target, getRect) => (e) => {
    dispatch({ type: 'SELECT_ELEMENT', element: target })
    e.stopPropagation()
    const rect = getRect()
    const t = activeTransform(target)
    tdragRef.current = {
      mode: 'move', target,
      w: rect.width, h: rect.height,
      startX: e.clientX, startY: e.clientY,
      ox: t.x, oy: t.y,
    }
    setTdrag('move')
  }

  // Drag a corner handle to scale (zoom) about the frame/panel centre.
  const startResize = (target, getRect) => (corner) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch({ type: 'SELECT_ELEMENT', element: target })
    const rect = getRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const t = activeTransform(target)
    tdragRef.current = {
      mode: 'resize', target, cx, cy,
      startDist: Math.hypot(e.clientX - cx, e.clientY - cy) || 1,
      startScale: t.scale,
    }
    setTdrag(corner)
  }

  useEffect(() => {
    if (!tdrag) return
    function onMove(e) {
      const d = tdragRef.current
      if (!d) return
      if (d.mode === 'move') {
        let x = clamp(d.ox + (e.clientX - d.startX) / d.w, -1.5, 1.5)
        let y = clamp(d.oy + (e.clientY - d.startY) / d.h, -1.5, 1.5)
        let gv = false
        let gh = false
        if (Math.abs(x) < SNAP_EPS) { x = 0; gv = true }
        if (Math.abs(y) < SNAP_EPS) { y = 0; gh = true }
        setGuides({ target: d.target, v: gv, h: gh })
        applyTransform(d.target, { x, y })
      } else {
        const dist = Math.hypot(e.clientX - d.cx, e.clientY - d.cy)
        const s = clamp(d.startScale * (dist / d.startDist), 0.2, 5)
        applyTransform(d.target, { scale: Math.round(s * 100) / 100 })
      }
    }
    function onUp() {
      tdragRef.current = null
      setTdrag(null)
      setGuides({ target: null, v: false, h: false })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [tdrag, applyTransform])

  // Scroll-wheel zoom. Native listener so we can preventDefault.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e) => {
      if (!clip) return
      e.preventDefault()
      setZoom((z) => clampZoom(z - Math.sign(e.deltaY) * 0.12))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [clip])

  async function handleFile(file) {
    if (!file) return
    dispatch({ type: 'UPLOAD_START', file })
    try {
      const c = await probeClip(file)
      await new Promise((r) => setTimeout(r, 400))
      dispatch({ type: 'UPLOAD_READY', clip: c })
    } catch (err) {
      dispatch({ type: 'UPLOAD_ERROR', error: err.message })
    }
  }

  function loadTopImage(file) {
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => dispatch({ type: 'SET_SPLIT', patch: { topImage: img, topImageUrl: url } })
    img.src = url
  }

  const clipRect = () => clipPanelRef.current.getBoundingClientRect()
  const imageRect = () => imagePanelRef.current.getBoundingClientRect()

  return (
    <div
      ref={viewportRef}
      onPointerDown={(e) => {
        if (e.target === viewportRef.current) dispatch({ type: 'SELECT_ELEMENT', element: null })
      }}
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-8"
    >
      <div
        className="relative h-full max-h-full transition-transform duration-100"
        style={{
          aspectRatio: format === 'square' ? '1 / 1' : '9 / 16',
          transform: `scale(${zoom})`,
        }}
      >
        <div
          ref={frameRef}
          onPointerDown={() => {
            if (clip && !isSplit) dispatch({ type: 'SELECT_ELEMENT', element: 'clip' })
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
          className={cn(
            'group absolute inset-0 overflow-hidden border-2 bg-black shadow-2xl',
            dragging ? 'border-kick' : 'border-border',
          )}
          style={{ containerType: 'size' }}
        >
          {/* --- empty: drop zone --- */}
          {!clip && !loading && (
            <button
              type="button"
              onClick={() => dropFileRef.current?.click()}
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-4 transition-colors',
                dragging ? 'bg-kick/5' : 'bg-[oklch(0.13_0_0)]',
              )}
            >
              <div
                className={cn(
                  'flex size-20 items-center justify-center rounded-full border-2 transition-all duration-300',
                  dragging
                    ? 'scale-110 animate-pulse border-kick bg-kick/15 text-kick'
                    : 'border-border bg-[oklch(0.18_0_0)] text-muted-foreground',
                )}
              >
                <Plus className="size-9" strokeWidth={2.5} />
              </div>
              <p
                className={cn(
                  'px-4 text-center font-mono text-xs font-bold uppercase tracking-widest',
                  dragging ? 'text-kick' : 'text-muted-foreground',
                )}
              >
                {dragging ? 'Drop it' : 'Drag your clip here or click to browse'}
              </p>
              <p className="px-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                MP4 · MOV · WebM — never uploaded
              </p>
              {error && (
                <div className="mx-6 flex items-start gap-2 border-2 border-destructive/50 bg-destructive/10 px-3 py-2">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" strokeWidth={2.5} />
                  <span className="text-left text-xs font-medium text-foreground">{error}</span>
                </div>
              )}
            </button>
          )}

          {/* --- loading --- */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[oklch(0.11_0_0)]">
              <div className="relative flex size-16 items-center justify-center">
                <span className="absolute inset-0 animate-spin rounded-full border-2 border-kick/25 border-t-kick" />
                <span className="size-2.5 animate-pulse rounded-full bg-kick" />
              </div>
              <Logo className="h-6" />
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Getting your clip ready…
              </p>
            </div>
          )}

          {/* --- clip loaded --- */}
          {clip && (
            <>
              {isSplit ? (
                <SplitPanels
                  src={src}
                  videoRef={videoRef}
                  split={split}
                  selectedElement={selectedElement}
                  guides={guides}
                  clipPanelRef={clipPanelRef}
                  imagePanelRef={imagePanelRef}
                  onStartMove={startMove}
                  onStartResize={startResize}
                  onReset={resetTarget}
                  clipRect={clipRect}
                  imageRect={imageRect}
                  onAddImage={() => topFileRef.current?.click()}
                  onReplaceClip={() => dropFileRef.current?.click()}
                  onFlip={() => dispatch({ type: 'SET_SPLIT', patch: { swapped: !split.swapped } })}
                />
              ) : (
                <>
                  {format === 'full' && effect === 'blur' && (
                    <BlurBackground videoRef={videoRef} intensity={blur.intensity} />
                  )}
                  <video
                    ref={videoRef}
                    src={src}
                    playsInline
                    onPointerDown={startMove('clip', () => frameRef.current.getBoundingClientRect())}
                    onDoubleClick={() => dispatch({ type: 'RESET_TRANSFORM' })}
                    className={cn(
                      'absolute inset-0 h-full w-full',
                      selectedElement === 'clip' && 'cursor-move',
                      format === 'full' && effect === 'blur' ? 'object-contain' : 'object-cover',
                    )}
                    style={{ transform: videoTransform, transformOrigin: 'center' }}
                  />
                  <ReplaceButton
                    onClick={() => dropFileRef.current?.click()}
                    label="Replace clip"
                    className="left-2 top-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
                  />
                  {selectedElement === 'clip' && canTransform && (
                    <TransformBox
                      transform={transform}
                      onResizeStart={startResize('clip', () => frameRef.current.getBoundingClientRect())}
                    />
                  )}
                  {guides.target === 'clip' && <CenterGuides v={guides.v} h={guides.h} />}
                </>
              )}

              <TextLayer containerRef={frameRef} />
              <OverlayLayer containerRef={frameRef} />
            </>
          )}

          <input
            ref={dropFileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <input
            ref={topFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => loadTopImage(e.target.files?.[0])}
          />
        </div>

        {/* Split flip control — sits just outside the frame's left edge. */}
        {clip && isSplit && (
          <button
            onClick={() => dispatch({ type: 'SET_SPLIT', patch: { swapped: !split.swapped } })}
            title="Flip top / bottom"
            className="absolute top-1/2 -left-12 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-kick bg-black/80 text-kick shadow-lg transition-transform hover:rotate-180"
          >
            <RefreshCw className="size-4" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Canvas zoom controls */}
      {clip && (
        <div className="absolute bottom-3 right-3 z-40 flex items-center gap-1 border-2 border-border bg-card/95 p-1 backdrop-blur">
          <ZoomBtn onClick={() => nudgeZoom(-0.25)} title="Zoom out" disabled={zoom <= ZOOM_MIN}>
            <ZoomOut className="size-4" strokeWidth={2.5} />
          </ZoomBtn>
          <button
            onClick={() => setZoom(1)}
            title="Reset zoom"
            className="min-w-12 px-1 font-mono text-[11px] font-bold tabular-nums text-foreground transition-colors hover:text-kick"
          >
            {Math.round(zoom * 100)}%
          </button>
          <ZoomBtn onClick={() => nudgeZoom(0.25)} title="Zoom in" disabled={zoom >= ZOOM_MAX}>
            <ZoomIn className="size-4" strokeWidth={2.5} />
          </ZoomBtn>
          <ZoomBtn onClick={() => setZoom(1)} title="Fit">
            <Maximize className="size-4" strokeWidth={2.5} />
          </ZoomBtn>
        </div>
      )}
    </div>
  )
}

function ZoomBtn({ onClick, title, disabled, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-kick disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

/** Kick-green centre alignment guides shown while a clip snaps to centre. */
function CenterGuides({ v, h }) {
  return (
    <>
      {v && (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-40 w-px -translate-x-1/2 bg-kick shadow-[0_0_8px_rgba(83,252,24,0.9)]" />
      )}
      {h && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-40 h-px -translate-y-1/2 bg-kick shadow-[0_0_8px_rgba(83,252,24,0.9)]" />
      )}
    </>
  )
}

/**
 * Interactive clip transform box: a green outline tracking the clip's real
 * scaled/offset bounds within its parent (frame or split panel), with four
 * draggable corner handles that resize (zoom). Handles are clamped inside so
 * they stay grabbable when the clip is zoomed past the edges.
 */
function TransformBox({ transform, onResizeStart }) {
  const s = transform.scale
  const left = 50 - 50 * s + transform.x * 100
  const top = 50 - 50 * s + transform.y * 100
  const size = 100 * s
  const clampPct = (v) => Math.min(99, Math.max(1, v))
  const corners = [
    { id: 'nw', fx: 0, fy: 0, cur: 'nwse' },
    { id: 'ne', fx: 1, fy: 0, cur: 'nesw' },
    { id: 'sw', fx: 0, fy: 1, cur: 'nesw' },
    { id: 'se', fx: 1, fy: 1, cur: 'nwse' },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        className="absolute border-2 border-kick"
        style={{ left: `${left}%`, top: `${top}%`, width: `${size}%`, height: `${size}%` }}
      />
      {corners.map((c) => (
        <span
          key={c.id}
          onPointerDown={onResizeStart(c.id)}
          style={{
            left: `${clampPct(left + c.fx * size)}%`,
            top: `${clampPct(top + c.fy * size)}%`,
            cursor: `${c.cur}-resize`,
          }}
          className="pointer-events-auto absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-black/50 bg-kick shadow transition-transform hover:scale-125"
        />
      ))}
      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-bold text-kick"
        style={{ top: `${clampPct(top)}%` }}
      >
        {Math.round(s * 100)}%
      </span>
    </div>
  )
}

/** CapCut-style selection outline: green border + four corner handles. */
export function SelectionBox({ className, style }) {
  return (
    <div
      className={cn('pointer-events-none absolute z-40 border-2 border-kick', className)}
      style={style}
    >
      {[
        'left-0 top-0 -translate-x-1/2 -translate-y-1/2',
        'right-0 top-0 translate-x-1/2 -translate-y-1/2',
        'left-0 bottom-0 -translate-x-1/2 translate-y-1/2',
        'right-0 bottom-0 translate-x-1/2 translate-y-1/2',
      ].map((pos) => (
        <span
          key={pos}
          className={cn('absolute size-2 rounded-[1px] border border-black/40 bg-kick', pos)}
        />
      ))}
    </div>
  )
}

/**
 * Genuine gaussian blur for the top/bottom bars: paints the current video frame
 * onto a canvas with ctx.filter blur, kept fresh on load/seek and while playing.
 */
function BlurBackground({ videoRef, intensity }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0

    const paint = () => {
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw
        canvas.height = vh
      }
      ctx.filter = `blur(${Math.max(4, Math.round(vw * blurFraction(intensity)))}px)`
      ctx.drawImage(video, 0, 0, vw, vh)
    }
    const loop = () => {
      paint()
      if (!video.paused && !video.ended) raf = requestAnimationFrame(loop)
    }
    const onPlay = () => {
      cancelAnimationFrame(raf)
      loop()
    }
    video.addEventListener('play', onPlay)
    video.addEventListener('seeked', paint)
    video.addEventListener('loadeddata', paint)
    video.addEventListener('timeupdate', paint)
    paint()
    return () => {
      cancelAnimationFrame(raf)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('seeked', paint)
      video.removeEventListener('loadeddata', paint)
      video.removeEventListener('timeupdate', paint)
    }
  }, [videoRef, intensity])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full scale-110 object-cover" />
}

/**
 * The 9:16 split layout as two independently selectable + movable panels: the
 * video clip and a top image. Each panel clips its own content, carries its own
 * transform (drag body to move, corner handles to zoom, double-click to reset),
 * and shows centre-snap guides. A flip swaps which panel is on top.
 */
function SplitPanels({
  src, videoRef, split, selectedElement, guides,
  clipPanelRef, imagePanelRef, onStartMove, onStartResize, onReset,
  clipRect, imageRect, onAddImage, onReplaceClip,
}) {
  const { topImage, topImageUrl, swapped, clipTransform, imageTransform } = split

  const clipPanel = (
    <div
      ref={clipPanelRef}
      onPointerDown={(e) => { e.stopPropagation(); }}
      className="group absolute inset-x-0 h-1/2 overflow-hidden"
      style={{ top: swapped ? 0 : '50%' }}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        onPointerDown={onStartMove('split-clip', clipRect)}
        onDoubleClick={() => onReset('split-clip')}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transform: cssT(clipTransform),
          transformOrigin: 'center',
          cursor: selectedElement === 'split-clip' ? 'move' : 'pointer',
        }}
      />
      <ReplaceButton
        onClick={onReplaceClip}
        label="Replace clip"
        className="left-2 top-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
      />
      {selectedElement === 'split-clip' && (
        <TransformBox transform={clipTransform} onResizeStart={onStartResize('split-clip', clipRect)} />
      )}
      {guides.target === 'split-clip' && <CenterGuides v={guides.v} h={guides.h} />}
    </div>
  )

  const imagePanel = (
    <div
      ref={imagePanelRef}
      onPointerDown={(e) => {
        e.stopPropagation()
        if (topImage) return
      }}
      className="group absolute inset-x-0 h-1/2 overflow-hidden"
      style={{ top: swapped ? '50%' : 0 }}
    >
      {topImage ? (
        <>
          <img
            src={topImageUrl}
            alt=""
            onPointerDown={onStartMove('split-image', imageRect)}
            onDoubleClick={() => onReset('split-image')}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              transform: cssT(imageTransform),
              transformOrigin: 'center',
              cursor: selectedElement === 'split-image' ? 'move' : 'pointer',
            }}
          />
          <ReplaceButton
            onClick={onAddImage}
            label="Replace"
            className="left-2 top-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
          />
          {selectedElement === 'split-image' && (
            <TransformBox transform={imageTransform} onResizeStart={onStartResize('split-image', imageRect)} />
          )}
          {guides.target === 'split-image' && <CenterGuides v={guides.v} h={guides.h} />}
        </>
      ) : (
        <button
          onClick={onAddImage}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[oklch(0.16_0_0)] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ImagePlus className="size-8" strokeWidth={2} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Add image</span>
        </button>
      )}
    </div>
  )

  return (
    <>
      {clipPanel}
      {imagePanel}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-1 -translate-y-1/2 bg-black/80" />
    </>
  )
}

/** Small overlay control to swap the media in a panel for a different file. */
function ReplaceButton({ onClick, label, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'absolute z-30 flex items-center gap-1 rounded bg-black/70 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm transition-colors hover:bg-black/90 hover:text-kick',
        className,
      )}
    >
      <Upload className="size-3" strokeWidth={2.5} />
      {label}
    </button>
  )
}
