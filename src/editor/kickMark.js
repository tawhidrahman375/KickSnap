/**
 * The KICK wordmark, traced from the official clip-overlay graphic as pure SVG
 * geometry (a fixed graphic, not a font). Built from rounded primitives so it
 * renders identically in the DOM preview and on the export canvas:
 *   K = solid stem + two flat-tipped diagonal arms that open on the right
 *   I = plain bar
 *   C = squared open-right bracket (top bar + left stem + bottom bar)
 * Every stroke shares thickness T with lightly rounded corners (radius R),
 * matching the reference's chunky-but-soft look.
 */
const VB_W = 212
const VB_H = 70
const T = 18 // stroke thickness (stems, bars, arms all share it)
const R = 5 // corner radius

const rr = (x, y, w, h, r = R) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}"/>`

// K glyph at horizontal offset ox: stem + upper/lower arms meeting mid-stem and
// splaying to flat, rounded tips at the top-right / bottom-right corners. The
// triangular gap between the arms on the right is the defining K "mouth".
function kGlyph(ox) {
  const arm = rr(-9, -T / 2, 58.4, T) // overlaps the stem at its left end
  return [
    rr(ox, 0, T, VB_H),
    `<g transform="translate(${ox + 14} 35) rotate(-36)">${arm}</g>`,
    `<g transform="translate(${ox + 14} 35) rotate(36)">${arm}</g>`,
  ].join('')
}

const cGlyph = (ox) =>
  [rr(ox, 0, 48, T), rr(ox, 0, T, VB_H), rr(ox, VB_H - T, 48, T)].join('')

const iGlyph = (ox) => rr(ox, 0, T, VB_H)

// K · I · C · K laid out with ~8u gaps.
const MARK = kGlyph(0) + iGlyph(68) + cGlyph(94) + kGlyph(150)

export function kickMarkSvg(color = '#53FC18') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VB_W * 3}" height="${VB_H * 3}" viewBox="0 0 ${VB_W} ${VB_H}" preserveAspectRatio="xMidYMid meet"><g fill="${color}">${MARK}</g></svg>`
}

export const KICK_MARK_ASPECT = VB_W / VB_H // ≈ 3.03

// The real KICK wordmark, extracted straight from the official overlay PNG
// (see public/kick-logo.png). This is the graphic used everywhere; the vector
// above is only a fallback if the asset is missing.
export const KICK_LOGO_SRC = '/kick-logo.png'

/**
 * Load the KICK wordmark as an <img> for canvas drawImage (used at export).
 * Prefers the real extracted asset; falls back to the vector recreation.
 */
export function loadKickMark(color = '#53fc18') {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      const svg = new Image()
      svg.onload = () => resolve(svg)
      svg.onerror = () => resolve(null)
      svg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(kickMarkSvg(color))
    }
    img.src = KICK_LOGO_SRC
  })
}
