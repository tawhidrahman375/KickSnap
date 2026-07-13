/**
 * Caption effect definitions — the single source of truth for every caption
 * look. Both the live DOM preview (TextLayer, via CSS) and the canvas export
 * (compositor.drawCaption) read from here, so preview == export exactly.
 *
 * All distances are in em (1em == the caption font size) so an effect renders
 * identically at any frame resolution and scales with the Size slider.
 *
 * Fields (all optional except label + weight):
 *   label     picker label
 *   weight    font-weight
 *   fill      solid glyph color (omit when `gradient` or `box`)
 *   gradient  [topColor, bottomColor] — vertical gradient glyph fill
 *   stroke    { color, width } — width in em, or 'outlineWidth' to track the slider
 *   shadow    { dx, dy, blur, color } — hard drop shadow, offsets/blur in em
 *   glow      { blur, color, passes } — luminous halo, blur in em, passes = layers
 *   box       { fill, text } — one rounded box around the whole caption (TikTok white-box look)
 */
export const CAPTION_EFFECTS = {
  outline: {
    label: 'Outline',
    weight: 550,
    fill: '#fff',
    stroke: { color: '#000', width: 'outlineWidth' },
  },
  background: {
    label: 'White box',
    weight: 800,
    box: { fill: '#fff', text: '#111' },
  },
  shadow: {
    label: 'Shadow',
    weight: 650,
    fill: '#fff',
    shadow: { dx: 0.05, dy: 0.06, blur: 0.02, color: 'rgba(0,0,0,0.85)' },
  },
  glow: {
    label: 'Glow',
    weight: 650,
    fill: '#fff',
    stroke: { color: 'rgba(0,0,0,0.5)', width: 0.04 },
    glow: { blur: 0.3, color: '#ffffff', passes: 3 },
  },
  neon: {
    label: 'Neon',
    weight: 700,
    fill: '#53fc18',
    stroke: { color: '#0c2a05', width: 0.05 },
    glow: { blur: 0.28, color: '#53fc18', passes: 3 },
  },
  pop: {
    label: 'Pop',
    weight: 800,
    fill: '#ffe83b',
    stroke: { color: '#000', width: 0.15 },
  },
  gradient: {
    label: 'Gradient',
    weight: 800,
    gradient: ['#ffe259', '#ff7a18'],
    stroke: { color: '#000', width: 0.11 },
  },
}

// Picker order (also the order effects cycle in the UI).
export const CAPTION_EFFECT_ORDER = [
  'outline',
  'background',
  'shadow',
  'glow',
  'neon',
  'pop',
  'gradient',
]

// Resolve a stroke width to em — 'outlineWidth' pulls from the live slider value.
export function strokeWidthEm(stroke, outlineWidth) {
  if (!stroke) return 0
  return stroke.width === 'outlineWidth' ? outlineWidth : stroke.width
}
