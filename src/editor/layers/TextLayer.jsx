import { useEffect, useRef, useState } from 'react'
import twemoji from '@twemoji/api'
import { useEditor } from '../EditorContext'
import { CAPTION_EFFECTS, strokeWidthEm } from '../captionEffects'
import { cn } from '@/lib/utils'

// TikTok's on-video caption font is Proxima Nova; Figtree is the closest free
// stand-in. TikTok Sans is TikTok's UI font, NOT the caption font. Family +
// weights here mirror compositor.drawCaption so preview == export exactly.
const CAPTION_FONT = '"Figtree Variable", "Montserrat Variable", sans-serif'

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Escape first (user text → innerHTML), then swap emoji for Twitter's SVGs.
function toTwemojiHtml(text) {
  return twemoji.parse(escapeHtml(text), { folder: 'svg', ext: '.svg' })
}

/**
 * Shared caption type + fill styling, used by BOTH the rendered caption and the
 * in-place editor so editing is WYSIWYG. Reads the effect descriptor so preview
 * mirrors compositor.drawCaption exactly.
 */
function captionStyle(t) {
  const eff = CAPTION_EFFECTS[t.style] || CAPTION_EFFECTS.outline
  const font = {
    fontFamily: CAPTION_FONT,
    fontWeight: eff.weight,
    lineHeight: t.lineHeight,
    letterSpacing: `${t.letterSpacing}em`,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    textAlign: 'center',
  }

  if (eff.box) {
    return {
      font,
      fill: {
        color: eff.box.text,
        background: eff.box.fill,
        // Per-line boxes that hug each line's text (TikTok style); the generous
        // vertical padding makes adjacent line-boxes overlap so the rows merge
        // into one connected shape with no gaps between them. Tight padding +
        // small radius keep the merged block crisp instead of pill-like.
        padding: '0.14em 0.26em',
        borderRadius: '0.14em',
        WebkitBoxDecorationBreak: 'clone',
        boxDecorationBreak: 'clone',
      },
    }
  }

  const fill = {}
  if (eff.gradient) {
    fill.backgroundImage = `linear-gradient(to bottom, ${eff.gradient[0]}, ${eff.gradient[1]})`
    fill.WebkitBackgroundClip = 'text'
    fill.backgroundClip = 'text'
    fill.color = 'transparent'
  } else {
    fill.color = eff.fill
  }

  const sw = strokeWidthEm(eff.stroke, t.outlineWidth)
  if (eff.stroke && sw > 0) {
    fill.WebkitTextStroke = `${sw}em ${eff.stroke.color}`
    fill.paintOrder = 'stroke fill'
  }

  // Drop shadow + glow both map to layered text-shadows (glow == blurred, no offset).
  const shadows = []
  if (eff.shadow) {
    const s = eff.shadow
    shadows.push(`${s.dx}em ${s.dy}em ${s.blur}em ${s.color}`)
  }
  if (eff.glow) {
    for (let i = 0; i < eff.glow.passes; i++) shadows.push(`0 0 ${eff.glow.blur}em ${eff.glow.color}`)
  }
  if (shadows.length) fill.textShadow = shadows.join(', ')

  return { font, fill }
}

/**
 * The on-canvas caption. Renders the styled text; click to edit it in place
 * (real multi-line contentEditable that looks exactly like the caption), drag
 * to reposition, snaps to horizontal center. Emoji render via Twemoji.
 */
export default function TextLayer({ containerRef }) {
  const { state, dispatch } = useEditor()
  const t = state.text
  const selected = state.selectedElement === 'text'
  const [editing, setEditing] = useState(false)
  const [snapped, setSnapped] = useState(false)
  const editRef = useRef(null)
  const drag = useRef({ moved: false })

  // Seed the editor with the current value once, and drop the caret at the end.
  useEffect(() => {
    const el = editRef.current
    if (!editing || !el) return
    if (el.innerText !== t.value) el.textContent = t.value
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
    // Only re-seed when entering edit mode, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  function onPointerDown(e) {
    dispatch({ type: 'SELECT_ELEMENT', element: 'text' })
    if (editing) return // editing: let contentEditable own the pointer (caret)
    e.preventDefault()
    e.stopPropagation()
    drag.current.moved = false
    const startX = e.clientX
    const startY = e.clientY
    const onMove = (ev) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      // Ignore sub-4px jitter so a click still opens the editor.
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 4) return
      drag.current.moved = true
      let nx = (ev.clientX - rect.left) / rect.width
      const ny = (ev.clientY - rect.top) / rect.height
      const snap = Math.abs(nx - 0.5) < 0.03
      setSnapped(snap)
      if (snap) nx = 0.5
      dispatch({
        type: 'SET_TEXT',
        patch: {
          x: Math.min(0.95, Math.max(0.05, nx)),
          y: Math.min(0.95, Math.max(0.05, ny)),
        },
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setSnapped(false)
      if (!drag.current.moved) setEditing(true) // a click (no drag) opens the editor
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  if (!t.enabled) return null
  const { font, fill } = captionStyle(t)

  return (
    <>
      {snapped && (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-px -translate-x-1/2 bg-kick/70" />
      )}
      {/* Full-frame flex-centre wrapper: the caption is centred, then nudged to
          (x,y) with frame-relative cqw/cqh transforms. This keeps the caption's
          width tied to its content (never to its position), so it wraps the same
          wherever it sits. */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div
          onPointerDown={onPointerDown}
          style={{
            transform: `translate(${((t.x - 0.5) * 100).toFixed(3)}cqw, ${((t.y - 0.5) * 100).toFixed(3)}cqh)`,
            width: 'fit-content',
            maxWidth: '90cqw',
            // cqw (1% of frame WIDTH) so preview text size == export (W*0.045*size)
            fontSize: `${t.size * 4.5}cqw`,
            pointerEvents: 'auto',
          }}
          className={cn(
            'text-center',
            editing ? 'cursor-text' : 'cursor-grab active:cursor-grabbing',
            selected && !editing && 'outline outline-2 outline-offset-4 outline-kick',
          )}
        >
        {editing ? (
          // inline-block editor: reliable multi-line caret/Enter. (Background
          // style shows a single box here; it snaps to per-line boxes on blur.)
          <span
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Caption text"
            onInput={(e) => dispatch({ type: 'SET_TEXT', patch: { value: e.currentTarget.innerText } })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            style={{ ...font, ...fill, display: 'inline-block', maxWidth: '90cqw', minWidth: '1ch', outline: 'none', caretColor: '#53fc18' }}
          />
        ) : t.value ? (
          // inline by default; the white-box style overrides display via `fill`
          // (inline-block) so the whole caption sits inside one grouped box.
          <span
            className="[&_img]:inline-block [&_img]:h-[1em] [&_img]:w-[1em] [&_img]:-translate-y-[0.14em]"
            style={{ ...font, display: 'inline', ...fill }}
            dangerouslySetInnerHTML={{ __html: toTwemojiHtml(t.value) }}
          />
        ) : (
          <span style={{ ...font, ...fill, display: 'inline-block', opacity: 0.55 }}>Add text</span>
        )}
        </div>
      </div>
    </>
  )
}
