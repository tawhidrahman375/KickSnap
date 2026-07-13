import { useEffect, useRef, useState } from 'react'
import { Type, Trash2, Smile } from 'lucide-react'
import twemoji from '@twemoji/api'
import { useEditor } from '../EditorContext'
import { CAPTION_EFFECTS, CAPTION_EFFECT_ORDER } from '../captionEffects'
import { cn } from '@/lib/utils'

// Curated caption emoji — the reactions that actually show up in stream clips.
const EMOJI = [
  '😳', '😂', '🤣', '😭', '💀', '🔥', '💯', '👀',
  '🙏', '❤️', '😍', '🤯', '😱', '🥶', '🤔', '👑',
  '⚡', '🚨', '🎯', '😤', '🙌', '👏', '🥵', '😅',
  '🫡', '💪', '🤝', '🧠', '💸', '🎉', '✅', '😮',
]

// Render an emoji as Twitter's SVG (Twemoji) so the picker matches the caption.
function toTwemojiHtml(emoji) {
  return twemoji.parse(emoji, { folder: 'svg', ext: '.svg' })
}

/** Labeled range control that dispatches a SET_TEXT patch. */
function Slider({ label, value, display, min, max, step, onChange }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-[10px] text-foreground">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-kick"
      />
    </div>
  )
}

/**
 * Caption controls. Text is opt-in — nothing is added until the clipper clicks
 * Add Text. Once added they get style, text, and the full type controls
 * (size, spacing, line height, outline thickness); position is set by dragging.
 */
export default function TextPanel() {
  const { state, dispatch } = useEditor()
  const { enabled, value, size, style, letterSpacing, lineHeight, outlineWidth } = state.text
  const set = (patch) => dispatch({ type: 'SET_TEXT', patch })

  const textareaRef = useRef(null)
  const pickerRef = useRef(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Close the emoji picker on outside click or Escape.
  useEffect(() => {
    if (!pickerOpen) return
    const onDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen])

  // Insert an emoji at the caret (replacing any selection), then restore focus.
  function insertEmoji(emoji) {
    const ta = textareaRef.current
    const start = ta?.selectionStart ?? value.length
    const end = ta?.selectionEnd ?? value.length
    set({ value: value.slice(0, start) + emoji + value.slice(end) })
    requestAnimationFrame(() => {
      if (!ta) return
      ta.focus()
      const pos = start + emoji.length
      ta.setSelectionRange(pos, pos)
    })
  }

  if (!enabled) {
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={() => set({ enabled: true })}
          className="flex items-center justify-center gap-2 border-2 border-dashed border-kick/60 bg-kick/5 px-4 py-4 font-bold uppercase tracking-wide text-kick transition-colors hover:border-kick hover:bg-kick/10"
        >
          <Type className="size-5" strokeWidth={2.5} />
          Add Text
        </button>
        <p className="font-mono text-[10px] leading-relaxed uppercase tracking-wide text-muted-foreground/70">
          TikTok-style caption — 7 effects (outline, white box, shadow, glow,
          neon, pop, gradient), auto-wraps to the frame. Emoji supported.
        </p>
      </div>
    )
  }

  const STYLES = CAPTION_EFFECT_ORDER.map((id) => ({ id, label: CAPTION_EFFECTS[id].label }))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Text
          </label>
          <button
            onClick={() => set({ enabled: false, value: '' })}
            className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="size-3" strokeWidth={2.5} />
            Remove
          </button>
        </div>
        <div className="relative" ref={pickerRef}>
          <textarea
            ref={textareaRef}
            value={value}
            rows={3}
            autoFocus
            placeholder="He actually did it 😳"
            onChange={(e) => set({ value: e.target.value })}
            className="w-full resize-none border-2 border-border bg-card px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-kick focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            aria-label="Insert emoji"
            className={cn(
              'absolute right-2 top-2 flex size-6 items-center justify-center rounded transition-colors hover:text-kick',
              pickerOpen ? 'text-kick' : 'text-muted-foreground',
            )}
          >
            <Smile className="size-4" strokeWidth={2.5} />
          </button>

          {pickerOpen && (
            <div className="absolute inset-x-0 top-full z-30 mt-1 border-2 border-border bg-card p-2 shadow-lg">
              <div className="grid grid-cols-8 gap-0.5">
                {EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => insertEmoji(e)}
                    aria-label={`Insert ${e}`}
                    className="flex items-center justify-center rounded p-1 transition-colors hover:bg-kick/15 [&_img]:size-5"
                    dangerouslySetInnerHTML={{ __html: toTwemojiHtml(e) }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
          Click the text on the preview to edit, drag to reposition.
        </p>
      </div>

      {/* Style toggle */}
      <div>
        <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Style
        </span>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => set({ style: s.id })}
              className={cn(
                'border-2 px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors',
                style === s.id
                  ? 'border-kick bg-kick/10 text-kick'
                  : 'border-border text-muted-foreground hover:border-muted-foreground/60',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Slider
        label="Size"
        value={size}
        display={`${size.toFixed(1)}×`}
        min={0.6}
        max={1.8}
        step={0.1}
        onChange={(v) => set({ size: v })}
      />

      <Slider
        label="Letter spacing"
        value={letterSpacing}
        display={`${letterSpacing > 0 ? '+' : ''}${letterSpacing.toFixed(2)}`}
        min={-0.05}
        max={0.2}
        step={0.01}
        onChange={(v) => set({ letterSpacing: v })}
      />

      <Slider
        label="Line spacing"
        value={lineHeight}
        display={lineHeight.toFixed(2)}
        min={1}
        max={1.8}
        step={0.02}
        onChange={(v) => set({ lineHeight: v })}
      />

      {style === 'outline' && (
        <Slider
          label="Outline thickness"
          value={outlineWidth}
          display={outlineWidth.toFixed(2)}
          min={0}
          max={0.24}
          step={0.01}
          onChange={(v) => set({ outlineWidth: v })}
        />
      )}
    </div>
  )
}
