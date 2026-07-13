import { useRef } from 'react'
import { Upload, RotateCcw } from 'lucide-react'
import { useEditor } from '../EditorContext'
import StreamerSelector from '../StreamerSelector'

/** Streamer selector + custom overlay import + overlay vertical position slider. */
export default function OverlayPanel() {
  const { state, dispatch } = useEditor()
  const { position, custom } = state.overlay
  const fileRef = useRef(null)

  function importOverlay(file) {
    if (!file) return
    const url = URL.createObjectURL(file)
    dispatch({ type: 'IMPORT_OVERLAY', url })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* import your own — for streamers not on the list */}
      <div className="border-b-2 border-border pb-4">
        {custom ? (
          <div className="flex items-center justify-between gap-2 border-2 border-kick bg-kick/10 px-3 py-2.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-kick">
              Custom overlay imported
            </span>
            <button
              onClick={() => dispatch({ type: 'RESET_OVERLAY' })}
              title="Back to default"
              className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3" strokeWidth={2.5} />
              Reset
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-border px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-kick hover:text-foreground"
          >
            <Upload className="size-4" strokeWidth={2.5} />
            Import your own overlay
          </button>
        )}
        <p className="mt-1.5 font-mono text-[10px] leading-relaxed uppercase tracking-wide text-muted-foreground/70">
          Streamer not on the list? Drop in their Kick overlay PNG — it locks to
          the same spot with the same rules.
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
