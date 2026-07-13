import { useEffect, useRef, useState } from 'react'
import {
  Play,
  Pause,
  Copy,
  Trash2,
  Magnet,
  Volume2,
  VolumeX,
  Keyboard,
  Undo2,
  Redo2,
  ArrowLeftToLine,
  ArrowRightToLine,
  RotateCcw,
} from 'lucide-react'
import { useEditor } from './EditorContext'
import { SNAP_GRID } from './constants'
import { segDuration, segmentOffsets, snapTime } from './segments'
import SplitIcon from './SplitIcon'
import { cn } from '@/lib/utils'

const SHORTCUTS = [
  ['Space', 'Play / pause'],
  ['S', 'Split at playhead'],
  ['Q', 'Split left (trim start)'],
  ['W', 'Split right (trim end)'],
  ['R', 'Reset trim'],
  ['D', 'Duplicate clip'],
  ['Del', 'Delete clip'],
  ['N', 'Toggle snap'],
  ['M', 'Mute'],
  ['← / →', 'Step (Shift = 1s)'],
  ['Ctrl+Z', 'Undo'],
  ['Ctrl+⇧+Z', 'Redo'],
  ['Esc', 'Deselect'],
]

function fmt(t) {
  if (!isFinite(t)) t = 0
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  const cs = Math.floor((t % 1) * 100)
  return `${m}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}

// Compact ruler label: "5s" under a minute, "1:05" beyond.
function fmtShort(t) {
  const s = Math.round(t)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Pick a tick spacing that yields ~8 labels across the ruler.
function niceStep(total) {
  const target = total / 8
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600]
  return steps.find((s) => s >= target) ?? 600
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export default function Timeline({
  currentTime,
  playing,
  total,
  onTogglePlay,
  onScrubStart,
  onScrub,
  onScrubEnd,
  onTrimPreview,
  onTrimEnd,
}) {
  const { state, dispatch, selectedSegment, canUndo, canRedo } = useEditor()
  const { segments, snap, audio } = state
  const duration = state.clip?.duration || 0
  const trackRef = useRef(null)
  const [drag, setDrag] = useState(null) // 'scrub' | 'in' | 'out'
  const [tip, setTip] = useState(null) // { side, text } — time bubble on the dragged head
  const dragRef = useRef(null)

  // Keep the trim callbacks fresh without re-subscribing the drag listeners.
  const onTrimPreviewRef = useRef(onTrimPreview)
  onTrimPreviewRef.current = onTrimPreview
  const onTrimEndRef = useRef(onTrimEnd)
  onTrimEndRef.current = onTrimEnd

  const offs = segmentOffsets(segments)
  const selIdx = segments.findIndex((s) => s.id === selectedSegment?.id)
  const pct = (t) => `${(total ? t / total : 0) * 100}%`

  function timeAtClientX(clientX) {
    const rect = trackRef.current.getBoundingClientRect()
    const f = clamp((clientX - rect.left) / rect.width, 0, 1)
    let t = f * total
    if (snap) t = clamp(snapTime(t, SNAP_GRID), 0, total)
    return t
  }

  function startScrub(e) {
    if (!total) return
    const t = timeAtClientX(e.clientX)
    const idx = segments.findIndex((_, i) => t < offs[i] + segDuration(segments[i]) || i === segments.length - 1)
    if (segments[idx]) dispatch({ type: 'SELECT_SEGMENT', id: segments[idx].id })
    onScrubStart?.()
    onScrub?.(t)
    setDrag('scrub')
  }

  function startHandle(e, side, seg) {
    e.stopPropagation()
    dispatch({ type: 'SELECT_SEGMENT', id: seg.id })
    const rect = trackRef.current.getBoundingClientRect()
    dragRef.current = {
      side,
      segId: seg.id,
      startX: e.clientX,
      pxPerSec: rect.width / (total || 1),
      origIn: seg.in,
      origOut: seg.out,
    }
    setDrag(side)
    setTip({ side, text: fmt(side === 'in' ? seg.in : seg.out) })
  }

  useEffect(() => {
    if (!drag) return
    function onMove(e) {
      if (drag === 'scrub') {
        onScrub?.(timeAtClientX(e.clientX))
        return
      }
      const d = dragRef.current
      if (!d) return
      const delta = (e.clientX - d.startX) / d.pxPerSec
      if (d.side === 'in') {
        let v = clamp(d.origIn + delta, 0, d.origOut - 0.1)
        if (snap) v = clamp(snapTime(v, SNAP_GRID), 0, d.origOut - 0.1)
        dispatch({ type: 'SET_SEGMENT', id: d.segId, patch: { in: v } })
        onTrimPreviewRef.current?.(v) // live-preview the new in frame
        setTip({ side: 'in', text: fmt(v) })
      } else {
        let v = clamp(d.origOut + delta, d.origIn + 0.1, duration)
        if (snap) v = clamp(snapTime(v, SNAP_GRID), d.origIn + 0.1, duration)
        dispatch({ type: 'SET_SEGMENT', id: d.segId, patch: { out: v } })
        onTrimPreviewRef.current?.(v) // live-preview the new out frame
        setTip({ side: 'out', text: fmt(v) })
      }
    }
    function onUp() {
      if (drag === 'scrub') onScrubEnd?.()
      else if (dragRef.current) onTrimEndRef.current?.(dragRef.current.segId, dragRef.current.side)
      dragRef.current = null
      setDrag(null)
      setTip(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, snap, total, duration])

  const canEdit = segments.length > 0
  const muted = audio.muted || audio.volume === 0

  return (
    <div className="border-t-2 border-border bg-[oklch(0.1_0_0)] px-4 py-3">
      {/* controls: [ segment actions ]  [ PLAY ]  [ volume + time ] */}
      <div className="mb-3 flex items-center gap-3">
        {/* left: segment tools */}
        <div className="flex flex-1 items-center gap-1.5">
          <ToolBtn
            title="Undo (Ctrl+Z)"
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={!canUndo}
          >
            <Undo2 className="size-4" strokeWidth={2.25} />
          </ToolBtn>
          <ToolBtn
            title="Redo (Ctrl+Shift+Z)"
            onClick={() => dispatch({ type: 'REDO' })}
            disabled={!canRedo}
          >
            <Redo2 className="size-4" strokeWidth={2.25} />
          </ToolBtn>
          <div className="mx-1 h-6 w-px bg-border" />
          <ToolBtn
            title="Split at playhead (S)"
            onClick={() => dispatch({ type: 'SPLIT_SEGMENT', time: currentTime })}
            disabled={!canEdit}
          >
            <SplitIcon className="size-4" strokeWidth={2.25} />
          </ToolBtn>
          <ToolBtn
            title="Split left — trim start to playhead (Q)"
            onClick={() => dispatch({ type: 'TRIM_TO_PLAYHEAD', side: 'in', time: currentTime })}
            disabled={!selectedSegment}
          >
            <ArrowLeftToLine className="size-4" strokeWidth={2.25} />
          </ToolBtn>
          <ToolBtn
            title="Split right — trim end to playhead (W)"
            onClick={() => dispatch({ type: 'TRIM_TO_PLAYHEAD', side: 'out', time: currentTime })}
            disabled={!selectedSegment}
          >
            <ArrowRightToLine className="size-4" strokeWidth={2.25} />
          </ToolBtn>
          <ToolBtn
            title="Reset trim (R)"
            onClick={() => dispatch({ type: 'RESET_TRIM' })}
            disabled={!selectedSegment}
          >
            <RotateCcw className="size-4" strokeWidth={2.25} />
          </ToolBtn>
          <div className="mx-1 h-6 w-px bg-border" />
          <ToolBtn
            title="Duplicate clip (D)"
            onClick={() => dispatch({ type: 'DUPLICATE_SEGMENT' })}
            disabled={!canEdit}
          >
            <Copy className="size-4" strokeWidth={2.25} />
          </ToolBtn>
          <ToolBtn
            title="Delete clip (Del)"
            onClick={() => dispatch({ type: 'DELETE_SEGMENT' })}
            disabled={segments.length <= 1}
            danger
          >
            <Trash2 className="size-4" strokeWidth={2.25} />
          </ToolBtn>
          <div className="mx-1 h-6 w-px bg-border" />
          <ToolBtn
            title={snap ? 'Snap: on (N)' : 'Snap: off (N)'}
            onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
            active={snap}
          >
            <Magnet className="size-4" strokeWidth={2.25} />
          </ToolBtn>
        </div>

        {/* center: prominent play button */}
        <button
          onClick={onTogglePlay}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-kick text-black shadow-[0_0_28px_-6px_rgba(83,252,24,0.7)] transition-transform hover:scale-105 active:scale-95"
        >
          {playing ? (
            <Pause className="size-7" strokeWidth={2.5} />
          ) : (
            <Play className="size-7 translate-x-0.5" strokeWidth={2.5} fill="currentColor" />
          )}
        </button>

        {/* right: volume + time */}
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => dispatch({ type: 'SET_AUDIO', patch: { muted: !audio.muted } })}
              title={muted ? 'Unmute' : 'Mute'}
              className="text-muted-foreground transition-colors hover:text-kick"
            >
              {muted ? (
                <VolumeX className="size-4" strokeWidth={2.25} />
              ) : (
                <Volume2 className="size-4" strokeWidth={2.25} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audio.muted ? 0 : audio.volume}
              onChange={(e) =>
                dispatch({ type: 'SET_AUDIO', patch: { volume: Number(e.target.value), muted: false } })
              }
              className="w-20 accent-kick"
              title="Volume"
            />
          </div>
          <span className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:inline">
            <span className="text-foreground">{fmt(currentTime)}</span> / {fmt(total)}
          </span>
        </div>
      </div>

      {/* time ruler */}
      {total > 0 && <Ruler total={total} />}

      {/* segment track */}
      <div
        ref={trackRef}
        onPointerDown={startScrub}
        className="relative h-16 cursor-pointer select-none border-2 border-border bg-[repeating-linear-gradient(90deg,transparent,transparent_9px,rgba(255,255,255,0.05)_9px,rgba(255,255,255,0.05)_10px)]"
      >
        {/* segment blocks */}
        {segments.map((s, i) => {
          const sel = s.id === selectedSegment?.id
          const w = (segDuration(s) / (total || 1)) * 100
          return (
            <div
              key={s.id}
              onPointerDown={(e) => {
                e.stopPropagation()
                dispatch({ type: 'SELECT_SEGMENT', id: s.id })
                startScrub(e)
              }}
              style={{ left: pct(offs[i]), width: `calc(${w}% - 2px)` }}
              className={cn(
                'absolute inset-y-0 flex items-center justify-center overflow-hidden border-2 transition-colors',
                sel
                  ? 'z-10 border-kick bg-kick/15'
                  : 'border-border/70 bg-[oklch(0.16_0_0)] hover:border-kick/40',
              )}
            >
              <span className="pointer-events-none px-2 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {segments.length > 1 ? `Clip ${i + 1}` : 'Clip'}
              </span>
            </div>
          )
        })}

        {/* trim heads on the selected segment (drag to trim + live-preview) */}
        {selectedSegment && selIdx >= 0 && (
          <>
            <Handle
              side="left"
              pos={pct(offs[selIdx])}
              onDown={(e) => startHandle(e, 'in', selectedSegment)}
              tip={tip?.side === 'in' ? tip.text : null}
            />
            <Handle
              side="right"
              pos={pct(offs[selIdx] + segDuration(selectedSegment))}
              onDown={(e) => startHandle(e, 'out', selectedSegment)}
              tip={tip?.side === 'out' ? tip.text : null}
            />
          </>
        )}

        {/* playhead */}
        <div
          className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-white"
          style={{ left: pct(currentTime) }}
        >
          <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-white" />
        </div>
      </div>

      {/* meta row */}
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            {segments.length} clip{segments.length === 1 ? '' : 's'} · {snap ? 'snap on' : 'snap off'}
          </span>
          {selectedSegment && (
            <span className="tabular-nums">
              · In <span className="text-foreground">{fmt(selectedSegment.in)}</span> Out{' '}
              <span className="text-foreground">{fmt(selectedSegment.out)}</span> Len{' '}
              <span className="text-kick">{fmt(selectedSegment.out - selectedSegment.in)}</span>
            </span>
          )}
          {/* keyboard shortcuts legend */}
          <div className="group relative">
            <Keyboard className="size-3.5 cursor-help text-muted-foreground/70 transition-colors hover:text-kick" strokeWidth={2} />
            <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden w-56 border-2 border-border bg-popover p-2 shadow-xl group-hover:block">
              <div className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-kick">
                Shortcuts
              </div>
              <div className="flex flex-col gap-1">
                {SHORTCUTS.map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-[10px] normal-case tracking-normal text-muted-foreground">{label}</span>
                    <kbd className="border border-border bg-card px-1.5 py-0.5 text-[9px] font-bold text-foreground">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <span>Total {fmt(total)}</span>
      </div>
    </div>
  )
}

function Ruler({ total }) {
  const step = niceStep(total)
  const ticks = []
  for (let t = 0; t <= total + 1e-6; t += step) ticks.push(t)
  return (
    <div className="relative mb-1 h-3.5 select-none overflow-hidden">
      {ticks.map((t) => {
        const isEdge = t / total > 0.985
        return (
          <div
            key={t}
            className={cn('absolute top-0 flex flex-col', isEdge ? 'items-end' : 'items-start')}
            style={{ left: pctOf(t, total), transform: isEdge ? 'translateX(-100%)' : undefined }}
          >
            <span className="h-1.5 w-px bg-border" />
            <span className="mt-px font-mono text-[8px] tabular-nums leading-none text-muted-foreground/80">
              {fmtShort(t)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const pctOf = (t, total) => `${(total ? t / total : 0) * 100}%`

function ToolBtn({ onClick, title, disabled, active, danger, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'flex size-9 items-center justify-center border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-35',
        active
          ? 'border-kick bg-kick/15 text-kick'
          : danger
            ? 'border-border bg-card text-muted-foreground hover:border-destructive hover:text-destructive'
            : 'border-border bg-card text-foreground hover:border-kick hover:text-kick',
      )}
    >
      {children}
    </button>
  )
}

function Handle({ side, pos, onDown, tip }) {
  return (
    <div
      onPointerDown={onDown}
      style={{ left: pos }}
      className={cn(
        'absolute inset-y-0 z-30 flex w-3.5 -translate-x-1/2 cursor-ew-resize items-center justify-center bg-kick shadow-[0_0_10px_-2px_rgba(83,252,24,0.8)]',
        side === 'left' ? 'rounded-l-sm' : 'rounded-r-sm',
      )}
    >
      {/* grip lines */}
      <div className="flex gap-[3px]">
        <span className="h-5 w-px bg-black/55" />
        <span className="h-5 w-px bg-black/55" />
      </div>
      {/* time bubble while dragging */}
      {tip && (
        <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-kick px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums text-black shadow-lg">
          {tip}
        </div>
      )}
    </div>
  )
}
