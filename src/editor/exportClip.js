/**
 * Client-side export. Decodes the source with mediabunny (WebCodecs), composites
 * every frame in the trim range onto a canvas at target resolution, re-encodes to
 * H.264, muxes into MP4, and passes the audio through untouched. No server. No
 * FFmpeg. The clip never leaves the browser.
 */
import {
  Input,
  BlobSource,
  ALL_FORMATS,
  Output,
  Mp4OutputFormat,
  BufferTarget,
  CanvasSource,
  VideoSampleSink,
  EncodedPacketSink,
  EncodedAudioPacketSource,
  QUALITY_HIGH,
} from 'mediabunny'
import { FORMATS, EXPORT, BLANK_OVERLAY } from './constants'
import { composeFrame } from './compositor'
import { collectEmojiSrcs } from './captionEmoji'
import { loadKickMark } from './kickMark'
import { totalDuration } from './segments'

const PASSTHROUGH_AUDIO = new Set(['aac', 'mp3'])

function loadImage(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Thrown when the user cancels an in-flight export. */
export class ExportCanceled extends Error {
  constructor() {
    super('Export canceled')
    this.name = 'ExportCanceled'
  }
}

/**
 * Progress is reported once per encoded frame, but each report drives a React
 * dispatch that re-renders the whole editor tree. At 30fps that's ~30 full
 * re-renders a second competing with the encoder for the main thread. Rate-limit
 * to ~15/s — still smooth to the eye, a fraction of the work. Always let 1
 * through so the bar reliably lands on 100%.
 */
function throttleProgress(fn, minIntervalMs = 66) {
  let last = 0
  return (p) => {
    const now = performance.now()
    if (p >= 1 || now - last >= minIntervalMs) {
      last = now
      fn(p)
    }
  }
}

/**
 * @param {File} file            original clip
 * @param {object} state         editor state (format, effect, overlay, text, split, segments, tier)
 * @param {(p:number)=>void} onProgress  0..1
 * @param {AbortSignal} [signal] abort to cancel an in-flight export
 * @returns {Promise<{ blob: Blob, width, height, duration, size }>}
 */
export async function exportClip(file, state, onProgress = () => {}, signal) {
  const report = throttleProgress(onProgress)
  // Encoding holds real GPU/codec resources, so bail out via output.cancel()
  // rather than just dropping the promise on the floor.
  let output = null
  const abortIfCanceled = async () => {
    if (!signal?.aborted) return
    try {
      if (output && output.state === 'started') await output.cancel()
    } catch {
      /* already torn down */
    }
    throw new ExportCanceled()
  }
  const fmt = FORMATS[state.format] || FORMATS.full
  const W = fmt.width
  const H = fmt.height

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { alpha: false })

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  const videoTrack = await input.getPrimaryVideoTrack()
  if (!videoTrack) throw new Error('No video track found in that clip.')

  output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() })

  const videoSource = new CanvasSource(canvas, {
    codec: EXPORT.codec,
    bitrate: QUALITY_HIGH,
    keyFrameInterval: EXPORT.keyFrameInterval,
  })
  output.addVideoTrack(videoSource)

  // Audio passthrough — only for codecs MP4 accepts directly.
  let audioTrack = null
  let audioSource = null
  try {
    audioTrack = await input.getPrimaryAudioTrack()
    if (audioTrack && PASSTHROUGH_AUDIO.has(audioTrack.codec)) {
      audioSource = new EncodedAudioPacketSource(audioTrack.codec)
      output.addAudioTrack(audioSource)
    } else {
      audioTrack = null
    }
  } catch {
    audioTrack = null
    audioSource = null
  }

  await output.start()

  // Timeline is an ordered list of source ranges — export renders them back to
  // back into one continuous clip. A single untouched clip is just one segment.
  const segments =
    state.segments && state.segments.length
      ? state.segments
      : [{ id: 'all', in: 0, out: state.clip?.duration ?? 0 }]
  const span = Math.max(0.001, totalDuration(segments))

  // Make sure the caption + overlay fonts are actually loaded before we rasterize
  // frames — otherwise the first frames fall back to a system font.
  try {
    await Promise.all([
      document.fonts.load('550 100px "Figtree Variable"'),
      document.fonts.load('700 100px "Figtree Variable"'),
      document.fonts.load('700 100px "Geist Variable"'),
    ])
    await document.fonts.ready
  } catch {
    // fonts API unavailable — canvas falls back to the next family in the stack
  }

  let kickImg = null
  try {
    kickImg = await loadKickMark('#53fc18')
  } catch {
    kickImg = null // fall back to bar without wordmark rather than failing export
  }

  // Resolve the overlay image the same way the preview does: a picked streamer's
  // PNG / custom import, else the blank default (unless a name-only text overlay
  // is in use for a streamer we have no PNG for).
  const streamerName = state.overlay.streamer.trim()
  const overlaySrc = state.overlay.image || (streamerName ? null : BLANK_OVERLAY)
  let overlayImg = null
  if (overlaySrc) {
    try {
      overlayImg = await loadImage(overlaySrc)
    } catch {
      overlayImg = null // fall back to the text overlay rather than failing export
    }
  }
  // Preload Twemoji PNGs for any caption emoji so export paints the SAME art as
  // the preview (crossOrigin so jsDelivr's CORS keeps the canvas untainted for
  // WebCodecs). A failed load is skipped — drawCaption falls back to native emoji.
  const emojiImages = new Map()
  if (state.text?.enabled && state.text.value) {
    await Promise.all(
      collectEmojiSrcs(state.text.value).map(async (src) => {
        try {
          emojiImages.set(src, await loadImage(src, 'anonymous'))
        } catch {
          /* emoji image unavailable — native fallback in drawCaption */
        }
      }),
    )
  }

  const drawState = { ...state, kickImg, overlayImg, emojiImages }

  // Output start time of each segment on the concatenated timeline.
  const offsets = []
  {
    let t = 0
    for (const seg of segments) {
      offsets.push(t)
      t += Math.max(0, seg.out - seg.in)
    }
  }

  // --- Video: decode → composite → encode, segment by segment ---
  let done = 0
  for (let i = 0; i < segments.length; i++) {
    const s = Math.max(0, segments[i].in)
    const e = segments[i].out
    const sink = new VideoSampleSink(videoTrack)
    for await (const sample of sink.samples(s, e)) {
      // Check before compositing so a cancel doesn't pay for another frame.
      // The sample must still be closed or its decoder buffer leaks.
      if (signal?.aborted) {
        sample.close()
        await abortIfCanceled()
      }
      composeFrame(ctx, W, H, sample, drawState)
      const rel = Math.max(0, sample.timestamp - s)
      const dur = sample.duration || 1 / 30
      await videoSource.add(offsets[i] + rel, dur)
      sample.close()
      report(Math.min(0.98, (done + rel) / span))
    }
    done = offsets[i] + Math.max(0, e - s)
  }

  await abortIfCanceled()

  // --- Audio: copy encoded packets per segment, shifted onto the output timeline ---
  if (audioTrack && audioSource) {
    try {
      const decoderConfig = await audioTrack.getDecoderConfig()
      let first = true
      for (let i = 0; i < segments.length; i++) {
        const s = Math.max(0, segments[i].in)
        const e = segments[i].out
        const audioSink = new EncodedPacketSink(audioTrack)
        for await (const packet of audioSink.packets()) {
          const pEnd = packet.timestamp + (packet.duration || 0)
          if (pEnd <= s) continue
          if (packet.timestamp >= e) break
          const shifted = packet.clone({ timestamp: offsets[i] + Math.max(0, packet.timestamp - s) })
          await audioSource.add(shifted, first ? { decoderConfig } : undefined)
          first = false
        }
      }
    } catch (err) {
      // A cancel must propagate — only genuine audio failures degrade to silence.
      if (err instanceof ExportCanceled) throw err
      // If audio passthrough fails mid-stream, ship a silent clip rather than error out.
    }
  }

  await abortIfCanceled()

  await output.finalize()
  onProgress(1)

  const buffer = output.target.buffer
  const blob = new Blob([buffer], { type: 'video/mp4' })
  return { blob, width: W, height: H, duration: span, size: blob.size }
}
