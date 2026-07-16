import { useEffect, useRef, useState } from 'react'
import { Download, Check, TriangleAlert, X } from 'lucide-react'
import { useEditor } from './EditorContext'

function fmtSize(bytes) {
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  return `${Math.round(bytes / 1e3)} KB`
}
function fmtDur(s) {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/**
 * Time left, from the rate achieved so far. Held back until there's enough
 * progress to extrapolate from (the first frames include font/overlay/emoji
 * loading, so an early estimate reads wildly high and then collapses — which
 * feels worse than showing nothing).
 */
function fmtEta(seconds) {
  if (seconds >= 90) return `~${Math.round(seconds / 60)} min left`
  if (seconds >= 10) return `~${Math.round(seconds / 5) * 5}s left`
  return 'almost done'
}

export default function ExportOverlay({ onCancel }) {
  const { state, dispatch } = useEditor()
  const { status, progress, result, error } = state.export
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [eta, setEta] = useState(null)
  const startedAt = useRef(0)

  useEffect(() => {
    if (result?.blob) {
      const url = URL.createObjectURL(result.blob)
      setDownloadUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [result])

  // Reset the clock on each new run so a second export doesn't inherit the first
  // one's start time and report a nonsense ETA.
  useEffect(() => {
    if (status === 'running' && startedAt.current === 0) {
      startedAt.current = performance.now()
      setEta(null)
    } else if (status !== 'running') {
      startedAt.current = 0
    }
  }, [status])

  useEffect(() => {
    if (status !== 'running' || progress < 0.08 || !startedAt.current) return
    const elapsed = (performance.now() - startedAt.current) / 1000
    setEta((elapsed / progress) * (1 - progress))
  }, [status, progress])

  if (status === 'idle') return null

  const fileName = `kicksnap-${state.overlay.streamer || 'clip'}-${state.format}.mp4`
  const close = () => dispatch({ type: 'EXPORT_RESET' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-sm border-2 border-border bg-card p-6">
        <button
          onClick={status === 'running' ? onCancel : close}
          className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
          title={status === 'running' ? 'Cancel export' : 'Close'}
        >
          <X className="size-5" strokeWidth={2.5} />
        </button>

        {/* --- running --- */}
        {status === 'running' && (
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Exporting
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-background">
              {/* Progress arrives in throttled steps; a linear transition slightly
                  longer than that interval lets the bar glide between them
                  instead of visibly ticking. */}
              <div
                className="h-full rounded-full bg-kick transition-[width] duration-200 ease-linear"
                style={{ width: `${Math.max(2, Math.round(progress * 100))}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
              <span>{eta != null ? fmtEta(eta) : 'Processing on your device'}</span>
              <span className="tabular-nums text-foreground">{Math.round(progress * 100)}%</span>
            </div>
            <button
              onClick={onCancel}
              className="mt-5 w-full py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        {/* --- error --- */}
        {status === 'error' && (
          <div>
            <div className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="size-5" strokeWidth={2.5} />
              <p className="font-bold uppercase tracking-wide">Export failed</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={close}
              className="mt-5 w-full bg-kick py-2.5 font-bold uppercase tracking-wide text-black transition-colors hover:bg-kick-hover"
            >
              Try again
            </button>
          </div>
        )}

        {/* --- done --- */}
        {status === 'done' && result && (
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-kick text-black">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <p className="font-bold uppercase tracking-wide text-foreground">Clip exported</p>
            </div>

            <div className="mt-4 flex divide-x-2 divide-border border-2 border-border bg-background">
              <Meta label="Format" value={state.format === 'square' ? '1:1' : '9:16'} />
              <Meta label="Length" value={fmtDur(result.duration)} />
              <Meta label="Size" value={fmtSize(result.size)} />
            </div>

            <a
              href={downloadUrl || '#'}
              download={fileName}
              className="mt-4 flex w-full items-center justify-center gap-2 bg-kick py-3 font-bold uppercase tracking-wide text-black transition-colors hover:bg-kick-hover"
            >
              <Download className="size-5" strokeWidth={2.5} />
              Download
            </a>
            <button
              onClick={close}
              className="mt-2 w-full py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to editor
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div className="flex-1 px-2 py-2.5 text-center">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{value}</div>
    </div>
  )
}
