import { useState } from 'react'
import { Check } from 'lucide-react'
import { useEditor } from '../EditorContext'
import { FORMATS, FORMAT_ORDER } from '../constants'
import { cn } from '@/lib/utils'

// Mini shape that previews each format's aspect ratio.
function FormatShape({ id, active }) {
  const base = 'border-2 transition-colors'
  const color = active ? 'border-kick bg-kick/15' : 'border-muted-foreground/50 bg-transparent'
  if (id === 'square') return <div className={cn(base, color, 'size-9')} />
  if (id === 'split')
    return (
      <div className={cn('flex h-12 w-7 flex-col gap-0.5', base, color, 'border-0')}>
        <div className={cn('h-1/2 w-full border-2', color)} />
        <div className={cn('h-1/2 w-full border-2', color)} />
      </div>
    )
  return <div className={cn(base, color, 'h-12 w-7')} />
}

/** Super Smash Bros-style picker: the hovered card grows, the rest shrink. */
export default function FormatPanel() {
  const { state, dispatch } = useEditor()
  const [hover, setHover] = useState(null)

  return (
    <div className="flex flex-col gap-3">
      {FORMAT_ORDER.map((id) => {
        const f = FORMATS[id]
        const active = state.format === id
        const isHover = hover === id
        const scale =
          hover == null ? (active ? 'scale-100' : 'scale-[0.97]') : isHover ? 'scale-[1.03]' : 'scale-[0.94]'
        return (
          <button
            key={id}
            onMouseEnter={() => setHover(id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => dispatch({ type: 'SET_FORMAT', format: id })}
            className={cn(
              'relative flex items-center gap-4 border-2 px-4 py-4 text-left transition-all duration-200 ease-out',
              scale,
              active
                ? 'border-kick bg-kick/10 shadow-[0_0_24px_-8px_rgba(83,252,24,0.5)]'
                : 'border-border bg-card hover:border-kick/50',
            )}
          >
            <FormatShape id={id} active={active} />
            <div className="flex-1">
              <div className="font-bold uppercase tracking-tight text-foreground">{f.label}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {f.sub}
              </div>
            </div>
            {active && <Check className="size-5 text-kick" strokeWidth={3} />}
          </button>
        )
      })}

      <p className="mt-1 font-mono text-[10px] leading-relaxed uppercase tracking-wide text-muted-foreground/70">
        Aspect ratio locks on selection. Resolution + frame rate are set
        automatically for TikTok, Shorts &amp; Reels.
      </p>
    </div>
  )
}
