/**
 * Emoji tokenizing for the EXPORT canvas. The live preview renders emoji as
 * Twemoji <img> via the DOM (TextLayer); the canvas export can't use DOM, so it
 * paints the same Twemoji PNGs onto the frame. This module splits a caption line
 * into ordered text / emoji runs using Twemoji's own detection, and lists the
 * emoji image URLs to preload — so export matches preview instead of falling back
 * to the browser's native (Apple/Google) emoji.
 */
import twemoji from '@twemoji/api'

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 72×72 PNGs (not SVG) so ctx.drawImage gets a ready raster. Served by jsDelivr
// with CORS headers, so drawing them does NOT taint the export canvas.
function parseToHtml(str) {
  return twemoji.parse(escapeHtml(str), { folder: '72x72', ext: '.png' })
}

// Tokenizing is pure over its input, and the same line strings recur on every
// exported frame — memoize so we parse each line once, not once per frame.
const _cache = new Map()

/**
 * Split one line into ordered tokens:
 *   { t: 'text',  v: string }
 *   { t: 'emoji', src: url, char: string }
 * `char` is the raw emoji, used as a native-fillText fallback if its image
 * fails to preload.
 */
export function tokenizeCaption(line) {
  const hit = _cache.get(line)
  if (hit) return hit
  const tpl = document.createElement('template')
  tpl.innerHTML = parseToHtml(line)
  const tokens = []
  for (const node of tpl.content.childNodes) {
    if (node.nodeType === 3) {
      if (node.textContent) tokens.push({ t: 'text', v: node.textContent })
    } else if (node.tagName === 'IMG') {
      tokens.push({ t: 'emoji', src: node.getAttribute('src'), char: node.getAttribute('alt') })
    }
  }
  _cache.set(line, tokens)
  return tokens
}

/** Unique emoji image URLs used anywhere in a caption value (for preloading). */
export function collectEmojiSrcs(text) {
  const srcs = new Set()
  for (const line of String(text ?? '').split('\n')) {
    for (const tok of tokenizeCaption(line)) if (tok.t === 'emoji') srcs.add(tok.src)
  }
  return [...srcs]
}
