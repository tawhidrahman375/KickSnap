/**
 * Canvas compositor — the single source of truth for how a frame is drawn.
 * Used by the WebCodecs export pipeline to render every frame at target
 * resolution. The live DOM preview mirrors this layout with CSS.
 *
 * A "source" is anything with dimensions plus a `draw(ctx, sx,sy,sw,sh, dx,dy,dw,dh)`
 * method — VideoSample already exposes exactly that, and we wrap HTMLImageElement.
 */
import { BLUR_DEFAULTS, OVERLAY, blurFraction } from './constants'
import { CAPTION_EFFECTS, strokeWidthEm } from './captionEffects'
import { tokenizeCaption } from './captionEmoji'

// TikTok-style caption typeface — bold, humanist, mixed-case. Keep in sync with
// the CSS used by the live TextLayer preview.
// TikTok's on-video caption font is Proxima Nova; Figtree is the closest free
// stand-in. Keep family + 600 weight in sync with TextLayer CAPTION_FONT.
export const CAPTION_FONT = '"Figtree Variable", "Montserrat Variable", sans-serif'

// Cover: crop the source so it fills the destination box (no bars).
function drawCover(ctx, src, dx, dy, dw, dh) {
  const s = Math.max(dw / src.width, dh / src.height)
  const sw = dw / s
  const sh = dh / s
  const sx = (src.width - sw) / 2
  const sy = (src.height - sh) / 2
  src.draw(ctx, sx, sy, sw, sh, dx, dy, dw, dh)
}

// Blurred-background foreground: the sharp clip zoomed in a bit past fit-to-width
// (`zoom`, the live "Clip size" control), centered in the frame. Fills more of
// the frame than a plain letterbox — the blurred fill only shows in the gaps.
function drawBlurForeground(ctx, src, W, H, zoom) {
  const dw = W * zoom
  const dh = dw * (src.height / src.width)
  const dx = (W - dw) / 2
  const dy = (H - dh) / 2
  src.draw(ctx, 0, 0, src.width, src.height, dx, dy, dw, dh)
}

// Run `fn` with the user's interactive clip transform applied (scale about the
// frame centre, then offset by x/y as a fraction of the frame). Mirrors the CSS
// `translate(x*100%, y*100%) scale(s)` on the live preview video.
function withTransform(ctx, W, H, transform, fn) {
  const s = transform?.scale ?? 1
  const x = transform?.x ?? 0
  const y = transform?.y ?? 0
  if (s === 1 && x === 0 && y === 0) {
    fn()
    return
  }
  ctx.save()
  ctx.translate(W / 2 + x * W, H / 2 + y * H)
  ctx.scale(s, s)
  ctx.translate(-W / 2, -H / 2)
  fn()
  ctx.restore()
}

// Like withTransform, but scoped + clipped to a sub-region (a split panel).
// Scales about the region centre and offsets by x/y as a fraction of the region.
function withTransformRegion(ctx, rx, ry, rw, rh, transform, fn) {
  const s = transform?.scale ?? 1
  const x = transform?.x ?? 0
  const y = transform?.y ?? 0
  ctx.save()
  ctx.beginPath()
  ctx.rect(rx, ry, rw, rh)
  ctx.clip()
  if (s !== 1 || x !== 0 || y !== 0) {
    const cx = rx + rw / 2
    const cy = ry + rh / 2
    ctx.translate(cx + x * rw, cy + y * rh)
    ctx.scale(s, s)
    ctx.translate(-cx, -cy)
  }
  fn()
  ctx.restore()
}

/** Draw the base video according to format + effect (+ the user clip transform). */
export function drawBase(ctx, video, W, H, { format, effect, topImage, blur, transform, split } = {}) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)

  if (format === 'split') {
    // Two independently-framed panels (clip + image). Each carries its own
    // transform and travels with a top/bottom flip. Regions are clipped so a
    // zoomed/moved panel never bleeds into the other half.
    const half = H / 2
    const swapped = split?.swapped
    const clipRegion = swapped ? [0, 0, W, half] : [0, half, W, half]
    const imageRegion = swapped ? [0, half, W, half] : [0, 0, W, half]
    if (topImage) {
      withTransformRegion(ctx, ...imageRegion, split?.imageTransform, () =>
        drawCover(ctx, topImage, ...imageRegion),
      )
    }
    withTransformRegion(ctx, ...clipRegion, split?.clipTransform, () =>
      drawCover(ctx, video, ...clipRegion),
    )
    ctx.fillStyle = 'rgba(0,0,0,0.9)'
    ctx.fillRect(0, half - 2, W, 4)
    return
  }

  if (format === 'square') {
    withTransform(ctx, W, H, transform, () => drawCover(ctx, video, 0, 0, W, H))
    return
  }

  // full 9:16
  if (effect === 'blur') {
    const intensity = blur?.intensity ?? BLUR_DEFAULTS.intensity
    const zoom = blur?.zoom ?? BLUR_DEFAULTS.zoom
    ctx.save()
    ctx.filter = `blur(${Math.round(W * blurFraction(intensity))}px)`
    drawCover(ctx, video, -40, -40, W + 80, H + 80) // overscan so blur edges stay covered
    ctx.restore()
    withTransform(ctx, W, H, transform, () => drawBlurForeground(ctx, video, W, H, zoom))
  } else {
    withTransform(ctx, W, H, transform, () => drawCover(ctx, video, 0, 0, W, H))
  }
}

// Break a single word that's wider than maxWidth into character-level chunks,
// so a long unbroken string still wraps instead of spilling past the frame
// (TikTok does the same when a "word" runs off the edge).
function breakLongWord(ctx, word, maxWidth) {
  const chunks = []
  let chunk = ''
  for (const ch of word) {
    const test = chunk + ch
    if (ctx.measureText(test).width > maxWidth && chunk) {
      chunks.push(chunk)
      chunk = ch
    } else {
      chunk = test
    }
  }
  if (chunk) chunks.push(chunk)
  return chunks
}

function wrapLines(ctx, text, maxWidth) {
  const out = []
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (!words.length) {
      out.push('')
      continue
    }
    let line = ''
    const pushLine = () => {
      if (line) out.push(line)
      line = ''
    }
    for (const word of words) {
      // A single word longer than the frame: flush the current line, then
      // split the word across as many lines as it needs.
      if (ctx.measureText(word).width > maxWidth) {
        pushLine()
        const pieces = breakLongWord(ctx, word, maxWidth)
        for (let j = 0; j < pieces.length - 1; j++) out.push(pieces[j])
        line = pieces[pieces.length - 1]
        continue
      }
      const test = line ? line + ' ' + word : word
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line)
        line = word
      } else {
        line = test
      }
    }
    pushLine()
  }
  return out
}

/**
 * TikTok-style caption. The look is driven by the shared CAPTION_EFFECTS
 * descriptor (outline, white box, shadow, glow, neon, pop, gradient) so this
 * canvas path and the TextLayer.jsx DOM preview render identically. Wrap width,
 * line height, letter spacing and outline thickness come from the text object.
 */
export function drawCaption(
  ctx,
  text,
  W,
  H,
  {
    x = 0.5,
    y = 0.33,
    size = 1,
    style = 'outline',
    letterSpacing = 0,
    lineHeight = 1.22,
    outlineWidth = 0.13,
    emojiImages = null, // Map<url, HTMLImageElement> preloaded by exportClip
  } = {},
) {
  if (!text || !text.trim()) return
  const eff = CAPTION_EFFECTS[style] || CAPTION_EFFECTS.outline
  // ~4.5% of frame WIDTH = TikTok's caption size (fits ~3 lines, not a wall of
  // text). Width-based so it reads the same on 9:16, split and 1:1.
  const fontPx = Math.round(W * 0.045 * size)
  ctx.font = `${eff.weight} ${fontPx}px ${CAPTION_FONT}`
  ctx.textAlign = 'left' // runs are positioned manually to interleave emoji
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  // em → px (fontPx == 1em). Set before wrapLines so measureText matches.
  ctx.letterSpacing = `${fontPx * letterSpacing}px`

  const lines = wrapLines(ctx, text, W * 0.9)
  const lineH = fontPx * lineHeight
  const startY = y * H - ((lines.length - 1) * lineH) / 2
  const cx = x * W

  // Emoji render as 1em Twemoji images (mirrors the preview's w/h-[1em]), raised
  // slightly so their centre sits on the text's optical centre.
  const emojiW = fontPx
  const emojiRise = fontPx * 0.08
  const tokenAdvance = (tok) => (tok.t === 'emoji' ? emojiW : ctx.measureText(tok.v).width)
  const measureLine = (tokens) => tokens.reduce((a, t) => a + tokenAdvance(t), 0)

  // Draw only the TEXT runs of a line with the given op — used for each effect
  // layer. Emoji advance the cursor but are painted separately by drawEmoji.
  const drawText = (tokens, left, ly, op) => {
    let tx = left
    for (const tok of tokens) {
      if (tok.t === 'text') {
        op(tok.v, tx, ly)
        tx += ctx.measureText(tok.v).width
      } else {
        tx += emojiW
      }
    }
  }
  // Paint the line's emoji images (top pass; no stroke/glow, like the DOM imgs).
  const drawEmoji = (tokens, left, ly) => {
    let tx = left
    for (const tok of tokens) {
      if (tok.t === 'text') {
        tx += ctx.measureText(tok.v).width
        continue
      }
      const img = emojiImages && emojiImages.get(tok.src)
      if (img) {
        ctx.drawImage(img, tx, ly - emojiW / 2 - emojiRise, emojiW, emojiW)
      } else if (tok.char) {
        ctx.fillStyle = '#fff' // preload failed — native emoji fallback
        ctx.fillText(tok.char, tx, ly)
      }
      tx += emojiW
    }
  }

  if (eff.box) {
    const padX = fontPx * 0.32
    const boxH = fontPx * 1.18
    const radius = fontPx * 0.2
    lines.forEach((line, i) => {
      if (!line) return
      const ly = startY + i * lineH
      const tokens = tokenizeCaption(line)
      const w = measureLine(tokens)
      const left = cx - w / 2
      // Pass 1: white rounded box hugging the line (box-decoration-break mirror).
      ctx.fillStyle = eff.box.fill
      roundRectPath(ctx, left - padX, ly - boxH / 2, w + padX * 2, boxH, radius)
      ctx.fill()
      // Pass 2: text + emoji on top.
      ctx.fillStyle = eff.box.text
      drawText(tokens, left, ly, (v, tx, ty) => ctx.fillText(v, tx, ty))
      drawEmoji(tokens, left, ly)
    })
  } else {
    // Effect glyphs, drawn back-to-front to mirror the DOM paint order:
    // glow/shadow halo → stroke → fill (paintOrder: 'stroke fill').
    const strokeEm = strokeWidthEm(eff.stroke, outlineWidth)
    lines.forEach((line, i) => {
      if (!line) return
      const ly = startY + i * lineH
      const tokens = tokenizeCaption(line)
      const w = measureLine(tokens)
      const left = cx - w / 2

      // 1. Luminous glow — layered blurred passes build up the halo.
      if (eff.glow) {
        ctx.save()
        ctx.shadowColor = eff.glow.color
        ctx.shadowBlur = fontPx * eff.glow.blur
        ctx.fillStyle = eff.fill || '#fff'
        for (let p = 0; p < eff.glow.passes; p++) drawText(tokens, left, ly, (v, tx, ty) => ctx.fillText(v, tx, ty))
        ctx.restore()
      }

      // 2. Hard drop shadow — one offset+blur pass carries the glyph's shadow.
      if (eff.shadow) {
        ctx.save()
        ctx.shadowColor = eff.shadow.color
        ctx.shadowOffsetX = fontPx * eff.shadow.dx
        ctx.shadowOffsetY = fontPx * eff.shadow.dy
        ctx.shadowBlur = fontPx * eff.shadow.blur
        ctx.fillStyle = eff.fill || '#fff'
        drawText(tokens, left, ly, (v, tx, ty) => ctx.fillText(v, tx, ty))
        ctx.restore()
      }

      // 3. Stroke behind the fill (visible outline = half the width).
      if (strokeEm > 0) {
        ctx.strokeStyle = eff.stroke.color
        ctx.lineWidth = fontPx * strokeEm
        drawText(tokens, left, ly, (v, tx, ty) => ctx.strokeText(v, tx, ty))
      }

      // 4. Fill on top — vertical gradient or solid — then the emoji images.
      drawText(tokens, left, ly, (v, tx, ty) => {
        if (eff.gradient) {
          const grad = ctx.createLinearGradient(0, ly - fontPx * 0.55, 0, ly + fontPx * 0.55)
          grad.addColorStop(0, eff.gradient[0])
          grad.addColorStop(1, eff.gradient[1])
          ctx.fillStyle = grad
        } else {
          ctx.fillStyle = eff.fill || '#fff'
        }
        ctx.fillText(v, tx, ty)
      })
      drawEmoji(tokens, left, ly)
    })
  }
  ctx.letterSpacing = '0px' // reset so later draws aren't affected
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/**
 * Locked KICK overlay — black rounded bar with the green KICK wordmark raised on
 * the left and KICK.COM/<streamer> in bold white. Matches the official program
 * overlay. `kickImg` is the rasterized wordmark (see kickMark.loadKickMark).
 */
export function drawOverlay(ctx, W, H, overlay, { kickImg = null, overlayImg = null } = {}) {
  const posY = overlay?.position ?? 0.72
  const s = W / OVERLAY.srcW // source px -> frame px
  const cy = posY * H // bar center anchor

  // Image mode: the real overlay PNG (selected streamer, custom import, or the
  // blank default). Drawn full-width, anchored so its bar center lands on cy.
  if (overlayImg) {
    const iw = W
    const ih = W * (overlayImg.naturalHeight / overlayImg.naturalWidth)
    ctx.drawImage(overlayImg, 0, cy - OVERLAY.barCenterY * s, iw, ih)
    return
  }

  // Text mode: the streamers we have no PNG for — bar + real KICK wordmark +
  // name text.
  const streamer = overlay?.streamer || ''
  const Y = (sy) => cy + (sy - OVERLAY.barCenterY) * s // source-y -> frame-y

  const barH = OVERLAY.barH * s
  const barTop = cy - barH / 2
  const barBottom = barTop + barH
  const r = OVERLAY.radius * s

  ctx.fillStyle = '#000'
  roundRectPath(ctx, 0, barTop, W, barH, r)
  ctx.fill()

  // raised tab (bottom-aligned with the bar; its lower rounded corners tuck
  // inside the bar so only the top pair pokes above)
  const tabX = OVERLAY.tabX * s
  const tabW = OVERLAY.tabW * s
  const tabTop = Y(OVERLAY.tabTopY)
  roundRectPath(ctx, tabX, tabTop, tabW, barBottom - tabTop, r)
  ctx.fill()

  // the real extracted KICK wordmark, at its measured position + size
  if (kickImg) {
    ctx.drawImage(kickImg, OVERLAY.logoX * s, Y(OVERLAY.logoTopY), OVERLAY.logoW * s, OVERLAY.logoH * s)
  }

  const fs = OVERLAY.textSize * s
  ctx.font = `800 ${fs}px "Geist Variable", Geist, Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  // centered in the bar space to the right of the tab, like the official asset
  const textCenterX = ((OVERLAY.tabX + OVERLAY.tabW + OVERLAY.srcW) / 2) * s
  ctx.fillText(`KICK.COM/${(streamer || '').toUpperCase()}`, textCenterX, cy)
}

/** Wrap an HTMLImageElement so it satisfies the "source" draw interface. */
export function imageSource(img) {
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    draw: (ctx, sx, sy, sw, sh, dx, dy, dw, dh) =>
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh),
  }
}

/**
 * Wrap a mediabunny VideoSample. It exposes displayWidth/displayHeight (not
 * width/height), and its draw() must keep the sample as receiver.
 */
export function videoSource(sample) {
  return {
    width: sample.displayWidth,
    height: sample.displayHeight,
    draw: (...args) => sample.draw(...args),
  }
}

/** Compose one full frame. `sample` is a mediabunny VideoSample. */
export function composeFrame(ctx, W, H, sample, state) {
  const { format, effect, overlay, text, split, blur, transform } = state
  drawBase(ctx, videoSource(sample), W, H, {
    format,
    effect,
    blur,
    transform,
    split,
    topImage: split?.topImage ? imageSource(split.topImage) : null,
  })
  if (text?.enabled) drawCaption(ctx, text.value, W, H, { ...text, emojiImages: state.emojiImages })
  drawOverlay(ctx, W, H, overlay, { kickImg: state.kickImg, overlayImg: state.overlayImg })
}
