/**
 * Inspects and normalizes a user-imported overlay PNG so it behaves like the 72
 * real ones in public/overlays.
 *
 * Every genuine Kick overlay is exactly 1082x108 (aspect 10.019) with the green
 * KICK wordmark accounting for ~16% of its opaque pixels. Those two signals were
 * measured against the real assets and calibrated so that neither alone decides:
 * kick-logo.png is 100% green but has aspect 3.1, and a photo has neither. An
 * import must clear BOTH to read as a Kick overlay.
 *
 * Nothing here rejects an import — the editor always lets the user proceed. This
 * only decides whether to ask "are you sure?" first.
 */
import { OVERLAY } from './constants'

const TEMPLATE_ASPECT = OVERLAY.srcW / OVERLAY.srcH // 10.019

// Generous bounds around the template. The nearest non-overlay asset measured
// 3.5, so there's a wide margin before a real overlay would ever be flagged.
const ASPECT_MIN = 8
const ASPECT_MAX = 12.5
// Real overlays measure ~0.16; the closest false positive (og-image) was 0.029.
const GREEN_MIN = 0.04

const ALPHA_FLOOR = 16

/** Kick green is #53fc18 (83, 252, 24) — match it with room for compression. */
function isKickGreen(r, g, b) {
  return g > 180 && r < 150 && b < 120 && g - r > 80 && g - b > 100
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read that image.'))
    img.src = src
  })
}

/**
 * @returns {Promise<{
 *   width:number, height:number, aspect:number, greenRatio:number,
 *   bbox:{x:number,y:number,w:number,h:number},
 *   looksKick:boolean, reason:string|null
 * }>}
 */
export async function analyzeOverlay(src) {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) throw new Error('Could not read that image.')

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)

  let data
  try {
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    // Tainted canvas (shouldn't happen for a local file) — skip the scan rather
    // than block the import.
    return {
      width: w, height: h, aspect: w / h, greenRatio: 0,
      bbox: { x: 0, y: 0, w, h }, looksKick: true, reason: null,
    }
  }

  let opaque = 0
  let green = 0
  let minX = w, minY = h, maxX = -1, maxY = -1
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] <= ALPHA_FLOOR) continue
    opaque++
    const p = i / 4
    const px = p % w
    const py = (p / w) | 0
    if (px < minX) minX = px
    if (px > maxX) maxX = px
    if (py < minY) minY = py
    if (py > maxY) maxY = py
    if (isKickGreen(data[i], data[i + 1], data[i + 2])) green++
  }

  // Fully transparent image — nothing to measure.
  if (maxX < 0) {
    return {
      width: w, height: h, aspect: w / h, greenRatio: 0,
      bbox: { x: 0, y: 0, w, h }, looksKick: false,
      reason: "That image is empty — it doesn't look like a Kick overlay.",
    }
  }

  const bbox = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
  // Measure the visible content, not the canvas — an overlay exported with
  // transparent padding is still a real overlay.
  const aspect = bbox.w / bbox.h
  const greenRatio = green / Math.max(1, opaque)

  const aspectOk = aspect >= ASPECT_MIN && aspect <= ASPECT_MAX
  const greenOk = greenRatio >= GREEN_MIN

  let reason = null
  if (!aspectOk && !greenOk) {
    reason = "That doesn't look like a Kick overlay — wrong shape, and no KICK logo found."
  } else if (!aspectOk) {
    reason = `A Kick overlay is a wide bar (about ${TEMPLATE_ASPECT.toFixed(0)}:1). This one is ${aspect.toFixed(1)}:1.`
  } else if (!greenOk) {
    reason = "That's the right shape, but there's no green KICK logo in it."
  }

  return { width: w, height: h, aspect, greenRatio, bbox, looksKick: aspectOk && greenOk, reason }
}

/**
 * Redraws an import onto the 1082x108 template so it renders at exactly the same
 * width and bar position as the built-in overlays: crop to the visible content
 * (dropping any transparent padding), scale that to the template width, and
 * center it vertically.
 *
 * For a genuine 1082x108 overlay this is a no-op. For a padded or differently
 * sized one it lands the bar where OverlayLayer's anchor expects it. If the
 * content is too tall to fit the template (i.e. not really an overlay), the
 * canvas grows to hold it rather than squashing the aspect — that import is
 * flagged by analyzeOverlay anyway.
 *
 * @returns {Promise<string>} object URL of the normalized PNG
 */
export async function normalizeOverlay(src, bbox) {
  const img = await loadImage(src)
  const box = bbox ?? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }

  const outW = OVERLAY.srcW
  const scale = outW / box.w
  const scaledH = Math.round(box.h * scale)
  const outH = Math.max(OVERLAY.srcH, scaledH)

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    img,
    box.x, box.y, box.w, box.h,
    0, Math.round((outH - scaledH) / 2), outW, scaledH,
  )

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process that image.'))), 'image/png')
  })
  return URL.createObjectURL(blob)
}
