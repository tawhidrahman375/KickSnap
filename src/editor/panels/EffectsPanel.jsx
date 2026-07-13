import { Crop, SquareDashedBottom, Check, Waves, Maximize2 } from 'lucide-react'
import { useEditor } from '../EditorContext'
import { EFFECTS, BLUR_INTENSITY_RANGE, BLUR_ZOOM_RANGE } from '../constants'
import { cn } from '@/lib/utils'

const CARDS = [
  { id: 'zoom', icon: Crop },
  { id: 'blur', icon: SquareDashedBottom },
]

// Live blur controls, shown only when Blurred Background is active.
function BlurControls() {
  const { state, dispatch } = useEditor()
  const { intensity, zoom } = state.blur

  return (
    <div className="mt-1 flex flex-col gap-4 border-2 border-kick/40 bg-kick/[0.04] p-3">
      <div className="flex items-center gap-2">
        <Waves className="size-3.5 text-kick" strokeWidth={2.5} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground">
          Blur controls
        </span>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Blur intensity
          </span>
          <span className="font-mono text-[10px] text-foreground">{intensity}</span>
        </div>
        <input
          type="range"
          min={BLUR_INTENSITY_RANGE.min}
          max={BLUR_INTENSITY_RANGE.max}
          step={BLUR_INTENSITY_RANGE.step}
          value={intensity}
          onChange={(e) => dispatch({ type: 'SET_BLUR', patch: { intensity: Number(e.target.value) } })}
          className="w-full accent-kick"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Clip size
          </span>
          <span className="font-mono text-[10px] text-foreground">{Math.round(zoom * 100)}%</span>
        </div>
        <input
          type="range"
          min={BLUR_ZOOM_RANGE.min}
          max={BLUR_ZOOM_RANGE.max}
          step={BLUR_ZOOM_RANGE.step}
          value={zoom}
          onChange={(e) => dispatch({ type: 'SET_BLUR', patch: { zoom: Number(e.target.value) } })}
          className="w-full accent-kick"
        />
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground/70">
          <Maximize2 className="size-3" strokeWidth={2.5} />
          Bigger clip = thinner blur bars
        </div>
      </div>
    </div>
  )
}

/** Blurred background vs zoom crop — mutually exclusive, one click each. Full format only. */
export default function EffectsPanel() {
  const { state, dispatch } = useEditor()

  if (state.format !== 'full') {
    return (
      <p className="font-mono text-[11px] leading-relaxed uppercase tracking-wide text-muted-foreground">
        Fill effects apply to <span className="text-foreground">9:16 Full</span> only.
        {state.format === 'split'
          ? ' Split panels each fill their half automatically.'
          : ' Square crops to fill automatically.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {CARDS.map(({ id, icon: Icon }) => {
        const e = EFFECTS[id]
        const active = state.effect === id
        return (
          <button
            key={id}
            onClick={() => dispatch({ type: 'SET_EFFECT', effect: id })}
            className={cn(
              'relative flex items-center gap-4 border-2 px-4 py-4 text-left transition-colors',
              active
                ? 'border-kick bg-kick/10 shadow-[0_0_24px_-8px_rgba(83,252,24,0.5)]'
                : 'border-border bg-card hover:border-kick/50',
            )}
          >
            <div
              className={cn(
                'flex size-10 items-center justify-center border-2',
                active ? 'border-kick text-kick' : 'border-border text-muted-foreground',
              )}
            >
              <Icon className="size-5" strokeWidth={2.25} />
            </div>
            <div className="flex-1">
              <div className="font-bold uppercase tracking-tight text-foreground">{e.label}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {e.sub}
              </div>
            </div>
            {active && <Check className="size-5 text-kick" strokeWidth={3} />}
          </button>
        )
      })}

      {state.effect === 'blur' && <BlurControls />}
    </div>
  )
}
