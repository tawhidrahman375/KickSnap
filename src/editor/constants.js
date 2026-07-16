/**
 * Editor constants — format specs, effects, safe/dead zones, export target.
 * All video work is client-side (WebCodecs via mediabunny). No server, ever.
 */

// Output canvas dimensions per format. 1080p spec (see product brief).
export const FORMATS = {
  full: {
    id: 'full',
    label: '9:16 Full',
    sub: 'Full screen',
    ratio: 9 / 16,
    width: 1080,
    height: 1920,
    aspectClass: 'aspect-[9/16]',
  },
  split: {
    id: 'split',
    label: '9:16 Split',
    sub: 'Top + bottom',
    ratio: 9 / 16,
    width: 1080,
    height: 1920,
    aspectClass: 'aspect-[9/16]',
  },
  square: {
    id: 'square',
    label: '1:1 Square',
    sub: 'Square',
    ratio: 1,
    width: 1080,
    height: 1080,
    aspectClass: 'aspect-square',
  },
}

export const FORMAT_ORDER = ['full', 'split', 'square']

// Format effects — mutually exclusive, apply to how the clip fills the frame.
export const EFFECTS = {
  blur: { id: 'blur', label: 'Blurred background', sub: 'Zoomed clip, blurred top + bottom' },
  zoom: { id: 'zoom', label: 'Zoom crop', sub: 'Fill the frame' },
}

// Blurred-background: how much the sharp foreground clip is zoomed in over the
// pure fit-to-width baseline. >1 fills more of the frame (thinner blur bars)
// without going all the way to a full zoom crop. This is the DEFAULT — the user
// can now tune it live with the "Clip size" slider (state.blur.zoom).
export const BLUR_ZOOM = 1.46

// Live blur controls (Effects panel). `intensity` drives how blurred the bars
// are (1 = faint, 10 = heavy); `zoom` is the foreground clip size in the frame.
export const BLUR_DEFAULTS = { intensity: 6, zoom: BLUR_ZOOM }
export const BLUR_INTENSITY_RANGE = { min: 1, max: 10, step: 1 }
export const BLUR_ZOOM_RANGE = { min: 1, max: 1.85, step: 0.05 }
// Blur radius as a fraction of frame width. intensity 6 ≈ the old 0.035 default.
export const blurFraction = (intensity) => 0.006 * intensity

// Snap-to-grid interval (seconds) for the timeline playhead + trim handles.
export const SNAP_GRID = 0.5

// Kick overlay geometry — measured directly off the official overlay PNG
// (tammyhtherealtor.png, 1082x108). Every value is a SOURCE PIXEL in that image.
// The whole overlay scales by W/srcW onto the frame and is anchored so the black
// bar's center lands on the drag position; source-y values map through that
// anchor. The green KICK wordmark itself is the real extracted asset
// (public/kick-logo.png) -- not a recreation -- placed at logoX/logoY.
// Shared verbatim by the DOM preview (cqw units) and the export compositor.
export const OVERLAY = {
  srcW: 1082,
  barCenterY: 71, // bar vertical center in the source -> maps to posY*H
  barH: 72, // black bar height (source px)
  radius: 15, // bar + tab corner radius
  tabX: 70, // raised tab left edge
  tabW: 259, // raised tab width
  tabTopY: 1, // tab top (pokes above the bar; bottom = bar bottom)
  logoX: 79, // extracted wordmark left
  logoTopY: 10, // extracted wordmark top
  logoW: 242, // extracted wordmark width (public/kick-logo.png natural size)
  logoH: 78, // extracted wordmark height
  textSize: 42, // KICK.COM/<name> font size (source px)
}

// The default blank overlay shown before a streamer is picked — a real Kick
// overlay PNG with the name erased ("KICK.COM/"). Selecting a streamer swaps in
// their overlay; a custom import replaces it entirely.
export const BLANK_OVERLAY = '/overlays/_blank.png'

// Overlay is confined to the vertical band between these fractions of frame
// height. Anything below DEAD_ZONE_LOW risks program rejection.
export const SAFE_ZONE = { top: 0.2, bottom: 0.8 }
export const DEAD_ZONE_WARNING = 'Too low — may be rejected'

// Export encode target.
export const EXPORT = {
  codec: 'avc', // H.264 — most compatible across TikTok/Shorts/Reels
  keyFrameInterval: 2,
}

// Credit cost per export.
export const CREDIT_COST = 1

// Discord community reward. Joining the server grants a one-time credit bonus.
// TODO: gate the reward behind Discord OAuth (post-MVP) so it can't be re-claimed.
export { DISCORD_URL as DISCORD_INVITE } from '@/lib/site'
export const DISCORD_BONUS_CREDITS = 5
