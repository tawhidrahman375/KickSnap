import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useEditor } from './EditorContext'
import { PlaybackProvider } from './PlaybackContext'
import { exportClip, ExportCanceled } from './exportClip'
import { locate, segDuration, segmentOffsets, timelineTime, totalDuration } from './segments'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import Preview from './Preview'
import Timeline from './Timeline'
import ExportOverlay from './ExportOverlay'
import DiscordReward from './DiscordReward'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The full editor. `embedded` renders it inside a landing-page frame instead of
 * full-screen: it fills its container, drops the global keyboard shortcuts (so
 * it never hijacks page scrolling), skips the export/Discord modals, and swaps
 * the dashboard TopBar for a slim "Sign up to export" gate. The /editor route
 * passes nothing, so its behavior is unchanged.
 */
export default function EditorShell({ embedded = false, onLockedExport }) {
  const { state, dispatch } = useEditor()
  const { spendCredit } = useAuth()
  const videoRef = useRef(null)
  const exportAbortRef = useRef(null)
  const [currentTime, setCurrentTimeState] = useState(0)
  const [playing, setPlaying] = useState(false)

  const segments = state.segments
  const total = totalDuration(segments)

  // Which segment the playhead is currently inside. A source range can appear
  // more than once (duplicated clip), so we can't derive this from the video's
  // time alone — we track it explicitly.
  const activeIndexRef = useRef(0)
  const timeRef = useRef(0)
  // True while a trim head is being dragged, so the playback timeupdate handler
  // doesn't fight the live preview seek.
  const trimmingRef = useRef(false)
  const setCurrentTime = useCallback((t) => {
    timeRef.current = t
    setCurrentTimeState(t)
  }, [])

  // Seek by TIMELINE time (0..total): map to a segment + source time, move the
  // <video>, and remember which segment we landed in.
  const seek = useCallback(
    (tTimeline) => {
      const v = videoRef.current
      const t = Math.min(total, Math.max(0, tTimeline))
      const { index, sourceTime } = locate(segments, t)
      activeIndexRef.current = index
      if (v) v.currentTime = sourceTime
      setCurrentTime(t)
    },
    [segments, total, setCurrentTime],
  )

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      if (timeRef.current >= total - 0.05) seek(0)
      v.play().catch(() => {})
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }, [total, seek])

  // Playback loop across segments: advance to the next segment at its end, loop
  // back to the start after the last one.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    function onTime() {
      if (trimmingRef.current) return // trim head is driving the preview
      const segs = state.segments
      let idx = activeIndexRef.current
      let seg = segs[idx]
      if (!seg) return
      if (v.currentTime >= seg.out - 0.03) {
        if (idx < segs.length - 1) {
          idx += 1
          activeIndexRef.current = idx
          const nextIn = segs[idx].in
          if (Math.abs(v.currentTime - nextIn) > 0.05) v.currentTime = nextIn
        } else {
          idx = 0
          activeIndexRef.current = 0
          v.currentTime = segs[0].in
        }
      }
      setCurrentTime(timelineTime(segs, activeIndexRef.current, v.currentTime))
    }
    function onPause() {
      setPlaying(false)
    }
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('pause', onPause)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('pause', onPause)
    }
  }, [state.segments, state.clip, state.format, state.effect, setCurrentTime])

  // Keep audio in sync with the volume control. Re-applied when the <video>
  // element remounts (format/effect switches swap the element).
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = state.audio.muted
    v.volume = state.audio.muted ? 0 : state.audio.volume
  }, [state.audio, state.clip, state.format, state.effect])

  // Segments changed (split / duplicate / delete / trim) — clamp the playhead
  // to the new total and resync the video to the right source frame.
  useEffect(() => {
    const t = Math.min(timeRef.current, totalDuration(state.segments))
    const { index, sourceTime } = locate(state.segments, t)
    activeIndexRef.current = index
    const v = videoRef.current
    // While a trim head is dragging, onTrimPreview owns the video frame — don't
    // yank it back to the playhead on every SET_SEGMENT.
    if (v && v.paused && !trimmingRef.current) v.currentTime = sourceTime
    setCurrentTime(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.segments])

  // --- scrub audio: play a short audible burst as the playhead is dragged ---
  const scrubTimer = useRef(null)
  const wasPlayingRef = useRef(false)
  const onScrubStart = useCallback(() => {
    const v = videoRef.current
    wasPlayingRef.current = v ? !v.paused : false
  }, [])
  const onScrub = useCallback(
    (t) => {
      seek(t)
      const v = videoRef.current
      if (!v) return
      if (v.paused) v.play().catch(() => {})
      clearTimeout(scrubTimer.current)
      scrubTimer.current = setTimeout(() => {
        const vv = videoRef.current
        if (vv && !wasPlayingRef.current) vv.pause()
      }, 150)
    },
    [seek],
  )
  const onScrubEnd = useCallback(() => {
    clearTimeout(scrubTimer.current)
    const v = videoRef.current
    if (v && !wasPlayingRef.current) v.pause()
  }, [])

  // --- trim heads: live-preview the in/out source frame as a head is dragged,
  // CapCut-style, then leave the playhead parked on the trimmed edge. ---
  const onTrimPreview = useCallback((sourceTime) => {
    const v = videoRef.current
    if (!v) return
    trimmingRef.current = true
    if (!v.paused) {
      v.pause()
      setPlaying(false)
    }
    try {
      v.currentTime = sourceTime
    } catch {
      /* seeking out of range mid-load — ignore */
    }
  }, [])
  const onTrimEnd = useCallback(
    (segId, side) => {
      trimmingRef.current = false
      const segs = state.segments
      const idx = segs.findIndex((s) => s.id === segId)
      if (idx < 0) return
      const offs = segmentOffsets(segs)
      // Park the playhead on the edge we just moved so the preview holds it.
      const edge = side === 'in' ? offs[idx] + 0.001 : offs[idx] + segDuration(segs[idx]) - 0.001
      seek(edge)
    },
    [state.segments, seek],
  )

  // --- keyboard shortcuts (CapCut-ish) ---
  // Skipped when embedded on the landing page so the editor never steals the
  // page's Space/arrow scrolling from a visitor who hasn't clicked into it.
  useEffect(() => {
    if (embedded) return
    function onKey(e) {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      // Undo / redo — Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z or Ctrl+Y.
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        const k = e.key.toLowerCase()
        if (k === 'z') {
          e.preventDefault()
          dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' })
          return
        }
        if (k === 'y') {
          e.preventDefault()
          dispatch({ type: 'REDO' })
          return
        }
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!state.clip) return
      const step = e.shiftKey ? 1 : 0.1
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 's':
          dispatch({ type: 'SPLIT_SEGMENT', time: timeRef.current })
          break
        case 'q':
          dispatch({ type: 'TRIM_TO_PLAYHEAD', side: 'in', time: timeRef.current })
          break
        case 'w':
          dispatch({ type: 'TRIM_TO_PLAYHEAD', side: 'out', time: timeRef.current })
          break
        case 'r':
          dispatch({ type: 'RESET_TRIM' })
          break
        case 'd':
          dispatch({ type: 'DUPLICATE_SEGMENT' })
          break
        case 'Delete':
        case 'Backspace':
          dispatch({ type: 'DELETE_SEGMENT' })
          break
        case 'n':
          dispatch({ type: 'TOGGLE_SNAP' })
          break
        case 'm':
          dispatch({ type: 'SET_AUDIO', patch: { muted: !state.audio.muted } })
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(Math.max(0, timeRef.current - step))
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(Math.min(total, timeRef.current + step))
          break
        case 'Escape':
          dispatch({ type: 'SELECT_ELEMENT', element: null })
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // `embedded` is fixed for the life of the mount, so it's intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePlay, seek, dispatch, state.clip, state.audio.muted, total])

  async function handleExport() {
    const v = videoRef.current
    v?.pause()
    setPlaying(false)
    const ac = new AbortController()
    exportAbortRef.current = ac
    dispatch({ type: 'EXPORT_START' })
    try {
      const result = await exportClip(
        state.file,
        state,
        (p) => dispatch({ type: 'EXPORT_PROGRESS', progress: p }),
        ac.signal,
      )
      // Charge only now that a file actually exists. If this call fails the user
      // still keeps their clip — we won't hold a finished export hostage to a
      // billing hiccup, and the balance self-corrects on the next page load.
      try {
        await spendCredit()
      } catch (err) {
        console.error('[KickSnap] credit not charged for this export', err)
      }
      dispatch({ type: 'EXPORT_DONE', result })
    } catch (err) {
      // A cancel is a deliberate user action, not a failure — drop straight back
      // to the editor without an error card, and don't spend a credit.
      if (err instanceof ExportCanceled) {
        dispatch({ type: 'EXPORT_RESET' })
        return
      }
      console.error('[KickSnap] export failed', err)
      dispatch({ type: 'EXPORT_ERROR', error: err?.message || 'Something went wrong during export.' })
    } finally {
      exportAbortRef.current = null
    }
  }

  const cancelExport = useCallback(() => exportAbortRef.current?.abort(), [])

  return (
    <PlaybackProvider value={{ currentTime, playing, total, seek, togglePlay }}>
      <div
        className={cn(
          'flex flex-col overflow-hidden bg-background',
          embedded ? 'h-full' : 'h-svh',
        )}
      >
        {embedded ? (
          <DemoBar onLockedExport={onLockedExport} />
        ) : (
          <TopBar onExport={handleExport} />
        )}
        <div className="flex min-h-0 flex-1">
          <Sidebar embedded={embedded} onLocked={onLockedExport} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Preview videoRef={videoRef} embedded={embedded} />
            <Timeline
              currentTime={currentTime}
              playing={playing}
              total={total}
              onTogglePlay={togglePlay}
              onScrubStart={onScrubStart}
              onScrub={onScrub}
              onScrubEnd={onScrubEnd}
              onTrimPreview={onTrimPreview}
              onTrimEnd={onTrimEnd}
              embedded={embedded}
            />
          </div>
        </div>
      </div>
      {!embedded && <ExportOverlay onCancel={cancelExport} />}
      {!embedded && <DiscordReward />}
    </PlaybackProvider>
  )
}

/**
 * Slim header for the embedded landing demo — replaces the dashboard TopBar.
 * Spells out "Demo — text, export & more require sign up" rather than a bare
 * "Preview" pill, since Text is now a locked teaser tab and this is the one
 * place that explains why. The button routes to the real editor (also the
 * export funnel — once auth ships this becomes the gate).
 */
function DemoBar({ onLockedExport }) {
  return (
    <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3">
      <span className="flex items-center gap-1.5 rounded-md border border-kick/40 bg-kick/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-kick">
        Demo
        <span className="hidden font-normal normal-case tracking-normal text-muted-foreground sm:inline">
          — sign up for text, export &amp; more
        </span>
      </span>
      <button
        onClick={onLockedExport}
        className="flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-kick px-3 text-[13px] font-semibold text-black transition-colors hover:bg-kick-hover"
      >
        Open full editor
        <ArrowRight className="size-3.5" strokeWidth={2.5} />
      </button>
    </header>
  )
}
