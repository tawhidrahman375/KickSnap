import { useRef, useState } from 'react'
import { Upload, RotateCcw, Check, TriangleAlert, Loader2, Pencil } from 'lucide-react'
import { useEditor } from '../EditorContext'
import { analyzeOverlay, normalizeOverlay } from '../overlayScan'
import { cn } from '@/lib/utils'
import StreamerSelector from '../StreamerSelector'

/**
 * Only ever revoke a URL that never reached editor state.
 *
 * `overlay` is in the undo history's DOC_KEYS, so a blob URL that has been
 * dispatched can be restored by Ctrl+Z — revoking it on replace or reset would
 * make undo render a dead image. The URLs safe to free are the raw pre-normalize
 * import and a discarded pending one, which are never dispatched. The one blob
 * per import that this leaks is ~10KB (a real overlay PNG's size) and the
 * browser releases it on unload, which is a fair trade for undo staying intact.
 */
const revokeUnused = (url) => {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

/** Streamer selector + custom overlay import + overlay vertical position slider. */
export default function OverlayPanel() {
  const { state, dispatch } = useEditor()
  const { position, custom, streamer, rate } = state.overlay
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(null)
  // 'idle' | 'scanning' | 'confirm' | 'details'
  const [phase, setPhase] = useState('idle')
  // An import held back pending "are you sure?" — not yet in editor state.
  const [pending, setPending] = useState(null)

  async function importOverlay(file) {
    if (!file) return
    // A drop can carry anything (the picker's accept="image/*" only guards the
    // browse path), and a non-image would render as a broken overlay.
    if (!file.type.startsWith('image/')) {
      setError("That file isn't an image — drop a PNG overlay.")
      return
    }
    setError(null)
    setPhase('scanning')

    const url = URL.createObjectURL(file)
    try {
      const scan = await analyzeOverlay(url)
      if (scan.looksKick) {
        await apply(url, scan)
      } else {
        // Hold it un-applied until they confirm; the reason names what's off.
        setPending({ url, scan })
        setPhase('confirm')
      }
    } catch (err) {
      revokeUnused(url)
      setError(err?.message || 'Could not read that image.')
      setPhase('idle')
    }
  }

  /** Normalize to the template, swap it in, then collect name + rate. */
  async function apply(url, scan) {
    try {
      const normalized = await normalizeOverlay(url, scan.bbox)
      // Safe: the raw import is superseded by the normalized copy and never
      // enters state. The outgoing `image` is NOT revoked — undo can restore it.
      revokeUnused(url)
      dispatch({ type: 'IMPORT_OVERLAY', url: normalized })
      setPending(null)
      setPhase('details')
    } catch (err) {
      revokeUnused(url)
      setError(err?.message || 'Could not process that image.')
      setPhase('idle')
    }
  }

  function resetOverlay() {
    revokeUnused(pending?.url)
    setPending(null)
    setError(null)
    setPhase('idle')
    dispatch({ type: 'RESET_OVERLAY' })
  }

  function cancelPending() {
    revokeUnused(pending?.url)
    setPending(null)
    setPhase('idle')
  }

  // A custom import with no name yet still needs its details filled in.
  const needsDetails = phase === 'details' || (custom && !streamer)

  return (
    <div className="flex flex-col gap-5">
      {/* Import your own — the escape hatch for streamers not in the list. It
          sits above a grid of 70+ faces, so it needs enough contrast to not read
          as a disabled afterthought. */}
      <div className="border-b-2 border-border pb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your own overlay
          </span>
          {!custom && phase === 'idle' && (
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
              Not on the list?
            </span>
          )}
        </div>

        {phase === 'scanning' ? (
          <div className="flex items-center justify-center gap-2 rounded-md border-2 border-border px-4 py-5 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Checking overlay…
          </div>
        ) : phase === 'confirm' && pending ? (
          <ConfirmNotKick
            reason={pending.scan.reason}
            src={pending.url}
            onUse={() => apply(pending.url, pending.scan)}
            onCancel={cancelPending}
          />
        ) : needsDetails ? (
          <DetailsForm
            initialName={streamer}
            initialRate={rate}
            onSave={(name, r) => {
              dispatch({ type: 'SET_OVERLAY_DETAILS', name, rate: r })
              setPhase('idle')
            }}
            onDiscard={resetOverlay}
          />
        ) : custom ? (
          <div className="flex items-center justify-between gap-2 rounded-md border-2 border-kick bg-kick/10 px-3 py-2.5">
            <div className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold text-kick">
                <Check className="size-4 shrink-0" strokeWidth={3} />
                <span className="truncate">{streamer}</span>
              </span>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Your overlay{rate != null ? ` · $${rate}/100K` : ''}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setPhase('details')}
                title="Edit name or rate"
                className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                <Pencil className="size-3" strokeWidth={2.5} />
                Edit
              </button>
              <button
                onClick={resetOverlay}
                title="Back to default"
                className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" strokeWidth={2.5} />
                Reset
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              importOverlay(e.dataTransfer.files?.[0])
            }}
            className={cn(
              'flex w-full flex-col items-center gap-2 rounded-md border-2 border-dashed px-4 py-5 text-center transition-colors',
              dragging
                ? 'border-kick bg-kick/15'
                : 'border-kick/40 bg-kick/5 hover:border-kick hover:bg-kick/10',
            )}
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-kick/15 text-kick">
              <Upload className="size-[18px]" strokeWidth={2.5} />
            </span>
            <span className="text-sm font-semibold text-foreground">
              {dragging ? 'Drop to use it' : 'Import your own overlay'}
            </span>
            <span className="text-xs text-muted-foreground">
              Drag a PNG here, or click to browse
            </span>
          </button>
        )}

        <p
          className={cn(
            'mt-2 font-mono text-[10px] leading-relaxed uppercase tracking-wide',
            error ? 'text-destructive' : 'text-muted-foreground/70',
          )}
        >
          {error ??
            'Any Kick overlay PNG works. It gets sized to match the built-in ones.'}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            importOverlay(e.target.files?.[0])
            e.target.value = '' // let the same file be re-picked after a reset
          }}
        />
      </div>

      <StreamerSelector />

      {/* vertical position */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Overlay position
          </span>
          <span className="font-mono text-[10px] text-foreground">
            {Math.round(position * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={26}
          max={78}
          value={Math.round(position * 100)}
          onChange={(e) =>
            dispatch({ type: 'SET_OVERLAY', patch: { position: Number(e.target.value) / 100 } })
          }
          className="w-full accent-kick"
        />
        <p className="mt-2 font-mono text-[10px] leading-relaxed uppercase tracking-wide text-muted-foreground/70">
          Locked to the safe zone. Drag it near the edges and you'll get a quiet
          heads-up — it never blocks you.
        </p>
      </div>
    </div>
  )
}

/**
 * Shown when the scan doesn't recognize the import. Deliberately a question, not
 * a rejection — the check is a heuristic, and a real overlay we fail to
 * recognize must still be usable in one click.
 */
function ConfirmNotKick({ reason, src, onUse, onCancel }) {
  return (
    <div className="rounded-md border-2 border-amber-400/50 bg-amber-400/10 p-3">
      <div className="flex items-center gap-2 text-amber-300">
        <TriangleAlert className="size-4 shrink-0" strokeWidth={2.5} />
        <span className="text-sm font-semibold">Are you sure this is a Kick overlay?</span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{reason}</p>
      <div className="mt-3 overflow-hidden rounded border border-border bg-black/40">
        <img src={src} alt="" className="max-h-16 w-full object-contain" />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onUse}
          className="flex-1 rounded bg-kick py-2 font-mono text-[10px] font-bold uppercase tracking-wide text-black transition-colors hover:bg-kick-hover"
        >
          Use it anyway
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded border-2 border-border py-2 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          Pick another
        </button>
      </div>
    </div>
  )
}

/**
 * An off-list streamer has no name or rate in streamers.js, so the user supplies
 * both. The name also drives the export filename; the rate mirrors what the
 * selector shows for listed streamers.
 */
function DetailsForm({ initialName, initialRate, onSave, onDiscard }) {
  const [name, setName] = useState(initialName || '')
  const [rate, setRate] = useState(initialRate != null ? String(initialRate) : '')
  const trimmed = name.trim()

  function save(e) {
    e.preventDefault()
    if (!trimmed) return
    const parsed = Number.parseFloat(rate)
    onSave(trimmed, Number.isFinite(parsed) && parsed >= 0 ? parsed : null)
  }

  return (
    <form onSubmit={save} className="rounded-md border-2 border-kick bg-kick/5 p-3">
      <p className="text-sm font-semibold text-foreground">Whose overlay is this?</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        They&apos;re not on our list, so tell us who it is and what they pay.
      </p>

      <label className="mt-3 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Streamer name
      </label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Kai Cenat"
        className="mt-1 w-full rounded border-2 border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-kick"
      />

      <label className="mt-3 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Rate (USD per 100K views)
      </label>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex flex-1 items-center rounded border-2 border-border bg-background px-2.5 focus-within:border-kick">
          <span className="font-mono text-sm text-muted-foreground">$</span>
          <input
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            inputMode="decimal"
            placeholder="25"
            className="w-full bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            /100K
          </span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={!trimmed}
          className="flex-1 rounded bg-kick py-2 font-mono text-[10px] font-bold uppercase tracking-wide text-black transition-colors hover:bg-kick-hover disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded border-2 border-border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          Discard
        </button>
      </div>
    </form>
  )
}
