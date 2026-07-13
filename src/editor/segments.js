/**
 * Timeline segment model. A "segment" is a range { in, out } of the ONE source
 * clip. The timeline is an ordered playlist of these — so splitting, duplicating
 * and deleting all operate on the same underlying video with no re-upload. The
 * preview plays them back to back and the exporter concatenates them in order.
 *
 * All functions are pure: they take the current segment array and return a new
 * one (plus the id that should become selected), or null when the edit is a
 * no-op. Keeping the logic here makes the reducer + timeline trivial to reason
 * about.
 */

let _seq = 0
export function newSegmentId() {
  _seq += 1
  return `seg_${Date.now().toString(36)}_${_seq.toString(36)}`
}

export function segDuration(s) {
  return Math.max(0, s.out - s.in)
}

export function totalDuration(segments) {
  return segments.reduce((a, s) => a + segDuration(s), 0)
}

/** Cumulative timeline start offset (seconds) for each segment. */
export function segmentOffsets(segments) {
  const offs = []
  let t = 0
  for (const s of segments) {
    offs.push(t)
    t += segDuration(s)
  }
  return offs
}

/** Timeline time (0..total) → { index, sourceTime } in the source clip. */
export function locate(segments, tTimeline) {
  if (!segments.length) return { index: 0, sourceTime: 0 }
  let t = Math.max(0, tTimeline)
  for (let i = 0; i < segments.length; i++) {
    const d = segDuration(segments[i])
    if (t < d || i === segments.length - 1) {
      return { index: i, sourceTime: segments[i].in + Math.min(d, Math.max(0, t)) }
    }
    t -= d
  }
  const last = segments.length - 1
  return { index: last, sourceTime: segments[last].out }
}

/** (segment index, source time) → timeline time. */
export function timelineTime(segments, index, sourceTime) {
  const offs = segmentOffsets(segments)
  const s = segments[index]
  if (!s) return 0
  return offs[index] + Math.min(segDuration(s), Math.max(0, sourceTime - s.in))
}

/**
 * Split the segment under `tTimeline` into two at that point. Returns null when
 * the cut would land too close to either edge (< minDur).
 */
export function splitAt(segments, tTimeline, minDur = 0.1) {
  const { index, sourceTime } = locate(segments, tTimeline)
  const s = segments[index]
  if (!s) return null
  if (sourceTime - s.in < minDur || s.out - sourceTime < minDur) return null
  const a = { ...s, out: sourceTime }
  const b = { id: newSegmentId(), in: sourceTime, out: s.out }
  return {
    segments: [...segments.slice(0, index), a, b, ...segments.slice(index + 1)],
    selectedId: b.id,
  }
}

/** Insert a copy of `id` immediately after it. */
export function duplicateSegment(segments, id) {
  const i = segments.findIndex((s) => s.id === id)
  if (i < 0) return null
  const copy = { id: newSegmentId(), in: segments[i].in, out: segments[i].out }
  return {
    segments: [...segments.slice(0, i + 1), copy, ...segments.slice(i + 1)],
    selectedId: copy.id,
  }
}

/** Remove `id`. Refuses to remove the last remaining segment. */
export function removeSegment(segments, id) {
  if (segments.length <= 1) return null
  const i = segments.findIndex((s) => s.id === id)
  if (i < 0) return null
  const next = segments.filter((s) => s.id !== id)
  return { segments: next, selectedId: next[Math.min(i, next.length - 1)].id }
}

/** Snap a time to the nearest grid line. */
export function snapTime(t, grid) {
  return Math.round(t / grid) * grid
}
