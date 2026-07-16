import { useRef, useState } from 'react'
import { Upload, RotateCcw, Check } from 'lucide-react'
import { useEditor } from '../EditorContext'
import { cn } from '@/lib/utils'
import StreamerSelector from '../StreamerSelector'

/** Streamer selector + custom overlay import + overlay vertical position slider. */
export default function OverlayPanel() {
  const { state, dispatch } = useEditor()
  const { position, custom, image } = state.overlay
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState(false)

  function importOverlay(file) {
    if (!file) return
    // A drop can be anything (the file picker's accept="image/*" only guards the
    // browse path), and a non-image would render as a broken overlay.
    if (!file.type.startsWith('image/')) {
      setRejected(true)
      return
    }
    setRejected(false)
    // Release the previous import's blob before replacing it — the URL lives in
    // state, so without this each re-import leaks the old one for the session.
    if (custom && image?.startsWith('blob:')) URL.revokeObjectURL(image)
    dispatch({ type: 'IMPORT_OVERLAY', url: URL.createObjectURL(file) })
  }

  function resetOverlay() {
    if (custom && image?.startsWith('blob:')) URL.revokeObjectURL(image)
    setRejected(false)
    dispatch({ type: 'RESET_OVERLAY' })
  }

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
          {!custom && (
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
              Not on the list?
            </span>
          )}
        </div>

        {custom ? (
          <div className="flex items-center justify-between gap-2 rounded-md border-2 border-kick bg-kick/10 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold text-kick">
              <Check className="size-4 shrink-0" strokeWidth={3} />
              Custom overlay in use
            </span>
            <button
              onClick={resetOverlay}
              title="Back to default"
              className="flex shrink-0 items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3" strokeWidth={2.5} />
              Reset
            </button>
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
            rejected ? 'text-destructive' : 'text-muted-foreground/70',
          )}
        >
          {rejected
            ? "That file isn't an image — drop a PNG overlay."
            : 'Any Kick overlay PNG works. It locks to the same spot, with the same rules.'}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => importOverlay(e.target.files?.[0])}
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
