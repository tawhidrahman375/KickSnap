import { createContext, useContext, useReducer, useCallback } from 'react'
import { FORMATS, BLUR_DEFAULTS } from './constants'
import {
  newSegmentId,
  splitAt,
  duplicateSegment,
  removeSegment,
  segmentOffsets,
} from './segments'

const clampVal = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

const EditorContext = createContext(null)

const CREDITS_START = 10 // free tier: 10/month

// Discord reward is tracked client-side (no backend yet). "seen" hides the
// new-user prompt for good; "claimed" grants the +5 bonus exactly once.
const DISCORD_CLAIMED_KEY = 'kicksnap_discord_claimed'
const DISCORD_SEEN_KEY = 'kicksnap_discord_seen'
const DISCORD_BONUS = 5
function readFlag(key) {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}
function writeFlag(key) {
  try {
    localStorage.setItem(key, '1')
  } catch {
    // storage unavailable (private mode) — bonus just won't persist across reloads
  }
}

const discordClaimed = readFlag(DISCORD_CLAIMED_KEY)

const initialState = {
  loading: false, // clip is being probed
  error: null,

  file: null,
  clip: null, // { url, width, height, duration } — null = show drop zone in canvas

  format: 'full', // 'full' | 'split' | 'square'
  effect: 'zoom', // 'blur' | 'zoom' (only meaningful for full)
  blur: { ...BLUR_DEFAULTS }, // live blur controls: { intensity, zoom }
  // Interactive clip transform driven by the on-canvas selection handles:
  // scale = zoom multiplier, x/y = offset as a fraction of the frame (0 = centered).
  transform: { scale: 1, x: 0, y: 0 },

  overlay: {
    streamer: '', // name for the text-overlay fallback (streamers without a PNG)
    image: null, // URL of the real overlay PNG (selected streamer or custom import)
    custom: false, // true when the user imported their own overlay
    // USD per 100K views. Comes from streamers.js for a listed pick; typed by the
    // user for a custom import, since an off-list streamer has no known rate.
    rate: null,
    position: 0.72, // normalized center Y within safe zone
  },
  text: {
    enabled: false, // opt-in: added via the Add Text button, never auto-applied
    value: '',
    x: 0.5,
    y: 0.33,
    size: 1,
    style: 'outline', // caption effect id — see captionEffects.js (outline, background, shadow, glow, neon, pop, gradient)
    letterSpacing: 0, // em, added to tracking
    lineHeight: 1.22, // matches TikTok's measured caption line spacing (~1.22)
    outlineWidth: 0.13, // em, black stroke thickness (outline style only)
  },
  split: {
    topImage: null, // HTMLImageElement
    topImageUrl: null,
    swapped: false, // flip top/bottom panels
    // Each split panel is independently selectable + movable. Transforms travel
    // with the content (clip vs image), not the on-screen position, so a flip
    // keeps each panel's framing.
    clipTransform: { scale: 1, x: 0, y: 0 },
    imageTransform: { scale: 1, x: 0, y: 0 },
  },

  // Timeline segments — an ordered playlist of ranges over the one source clip.
  // Populated on upload; drives playback + export. `trim` no longer exists.
  segments: [],
  selectedSegmentId: null,
  snap: true, // snap the playhead + trim handles to a time grid

  selectedElement: null, // canvas selection: 'clip' | 'overlay' | 'text' | null
  audio: { volume: 0.85, muted: false },

  recentStreamers: [], // slugs, max 3
  activeTool: 'format',
  sidebarCollapsed: false,

  tier: 'free',
  credits: CREDITS_START + (discordClaimed ? DISCORD_BONUS : 0),
  discordClaimed,
  showDiscordPrompt: !readFlag(DISCORD_SEEN_KEY), // greet new users once

  export: { status: 'idle', progress: 0, result: null, error: null }, // idle|running|done|error
}

function patchSegment(state, id, patch) {
  return {
    ...state,
    segments: state.segments.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'UPLOAD_START':
      return { ...state, loading: true, file: action.file, error: null }

    case 'UPLOAD_READY': {
      const seg = { id: newSegmentId(), in: 0, out: action.clip.duration }
      return {
        ...state,
        loading: false,
        clip: action.clip,
        segments: [seg],
        selectedSegmentId: seg.id,
        selectedElement: 'clip',
        transform: { scale: 1, x: 0, y: 0 }, // fresh clip → reset any prior zoom/offset
        split: {
          ...state.split,
          clipTransform: { scale: 1, x: 0, y: 0 },
          imageTransform: { scale: 1, x: 0, y: 0 },
        },
      }
    }

    case 'UPLOAD_ERROR':
      return { ...state, loading: false, file: null, error: action.error }

    case 'RESET':
      // "New clip" — keep the user's account/prefs, drop the clip + edits.
      return {
        ...initialState,
        credits: state.credits,
        tier: state.tier,
        blur: state.blur,
        audio: state.audio,
        snap: state.snap,
        recentStreamers: state.recentStreamers,
        discordClaimed: state.discordClaimed,
        showDiscordPrompt: false, // already greeted this session
      }

    case 'SET_FORMAT':
      return { ...state, format: action.format }

    case 'SET_EFFECT':
      return { ...state, effect: action.effect }

    case 'SET_BLUR':
      return { ...state, blur: { ...state.blur, ...action.patch } }

    case 'SET_TRANSFORM':
      return { ...state, transform: { ...state.transform, ...action.patch } }

    case 'RESET_TRANSFORM':
      return { ...state, transform: { scale: 1, x: 0, y: 0 } }

    case 'SET_OVERLAY':
      return { ...state, overlay: { ...state.overlay, ...action.patch } }

    case 'SELECT_STREAMER': {
      const recents = [
        action.slug,
        ...state.recentStreamers.filter((s) => s !== action.slug),
      ].slice(0, 3)
      return {
        ...state,
        overlay: {
          ...state.overlay,
          streamer: action.name,
          image: action.overlay || null, // real PNG when we have it, else text fallback
          custom: false,
          rate: action.rate ?? null,
        },
        recentStreamers: recents,
      }
    }

    // User imported their own overlay PNG (streamer not on the list). The name is
    // baked into their image, so there's no separate streamer text.
    case 'IMPORT_OVERLAY':
      return {
        ...state,
        overlay: { ...state.overlay, image: action.url, custom: true, streamer: '', rate: null },
      }

    // Name + rate for a custom import — an off-list streamer we know nothing about.
    case 'SET_OVERLAY_DETAILS':
      return {
        ...state,
        overlay: { ...state.overlay, streamer: action.name, rate: action.rate },
      }

    // Back to the blank default overlay.
    case 'RESET_OVERLAY':
      return {
        ...state,
        overlay: { ...state.overlay, image: null, custom: false, streamer: '', rate: null },
      }

    case 'SET_TEXT':
      return { ...state, text: { ...state.text, ...action.patch } }

    case 'SET_SPLIT':
      return { ...state, split: { ...state.split, ...action.patch } }

    // Per-panel transform for the split layout. Merges against current state so
    // a drag can send just {x,y} or {scale} without clobbering the other axis.
    case 'SET_SPLIT_TRANSFORM': {
      const key = action.role === 'image' ? 'imageTransform' : 'clipTransform'
      return {
        ...state,
        split: { ...state.split, [key]: { ...state.split[key], ...action.patch } },
      }
    }

    // --- timeline segments ---
    case 'SET_SEGMENT':
      return patchSegment(state, action.id, action.patch)

    case 'SELECT_SEGMENT':
      return { ...state, selectedSegmentId: action.id, selectedElement: 'clip' }

    case 'SPLIT_SEGMENT': {
      const res = splitAt(state.segments, action.time)
      if (!res) return state
      return { ...state, segments: res.segments, selectedSegmentId: res.selectedId }
    }

    case 'DUPLICATE_SEGMENT': {
      const res = duplicateSegment(state.segments, action.id ?? state.selectedSegmentId)
      if (!res) return state
      return { ...state, segments: res.segments, selectedSegmentId: res.selectedId }
    }

    case 'DELETE_SEGMENT': {
      const res = removeSegment(state.segments, action.id ?? state.selectedSegmentId)
      if (!res) return state
      return { ...state, segments: res.segments, selectedSegmentId: res.selectedId }
    }

    // Trim the selected clip's start ('in') or end ('out') to the playhead —
    // shared by the Split L / Split R buttons and their Q / W hotkeys.
    case 'TRIM_TO_PLAYHEAD': {
      const seg = state.segments.find((s) => s.id === state.selectedSegmentId) || state.segments[0]
      if (!seg) return state
      const idx = state.segments.indexOf(seg)
      const segOffset = segmentOffsets(state.segments)[idx] ?? 0
      const src = clampVal(seg.in + (action.time - segOffset), seg.in, seg.out)
      const duration = state.clip?.duration ?? seg.out
      const patch =
        action.side === 'in'
          ? { in: clampVal(src, 0, seg.out - 0.1) }
          : { out: clampVal(src, seg.in + 0.1, duration) }
      return patchSegment(state, seg.id, patch)
    }

    case 'RESET_TRIM': {
      const seg = state.segments.find((s) => s.id === state.selectedSegmentId) || state.segments[0]
      if (!seg) return state
      return patchSegment(state, seg.id, { in: 0, out: state.clip?.duration ?? seg.out })
    }

    case 'TOGGLE_SNAP':
      return { ...state, snap: !state.snap }

    // --- canvas selection + audio ---
    case 'SELECT_ELEMENT':
      return { ...state, selectedElement: action.element }

    case 'SET_AUDIO':
      return { ...state, audio: { ...state.audio, ...action.patch } }

    // --- Discord reward ---
    case 'CLAIM_DISCORD':
      if (state.discordClaimed) return { ...state, showDiscordPrompt: false }
      writeFlag(DISCORD_CLAIMED_KEY)
      writeFlag(DISCORD_SEEN_KEY)
      return {
        ...state,
        credits: state.credits + DISCORD_BONUS,
        discordClaimed: true,
        showDiscordPrompt: false,
      }

    case 'OPEN_DISCORD_PROMPT':
      return { ...state, showDiscordPrompt: true }

    case 'DISMISS_DISCORD_PROMPT':
      writeFlag(DISCORD_SEEN_KEY)
      return { ...state, showDiscordPrompt: false }

    case 'SET_TOOL':
      return { ...state, activeTool: action.tool }

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }

    case 'EXPORT_START':
      return { ...state, export: { status: 'running', progress: 0, result: null, error: null } }

    case 'EXPORT_PROGRESS':
      return { ...state, export: { ...state.export, progress: action.progress } }

    case 'EXPORT_DONE':
      return {
        ...state,
        credits: Math.max(0, state.credits - 1),
        export: { status: 'done', progress: 1, result: action.result, error: null },
      }

    case 'EXPORT_ERROR':
      return { ...state, export: { status: 'error', progress: 0, result: null, error: action.error } }

    case 'EXPORT_RESET':
      return { ...state, export: { status: 'idle', progress: 0, result: null, error: null } }

    default:
      return state
  }
}

// --- undo / redo history --------------------------------------------------
// We snapshot only the "document" slice of state (the editable clip + its
// edits), leaving account/session/volatile fields (credits, export status,
// selection, tool, discord) untouched by undo.
const DOC_KEYS = [
  'clip', 'file', 'format', 'effect', 'blur', 'transform',
  'overlay', 'text', 'split', 'segments', 'selectedSegmentId', 'snap',
]
// Actions that stream many times during one gesture (a drag, typing) — collapse
// a run of the same type into a single undo step.
const CONTINUOUS = new Set(['SET_TRANSFORM', 'SET_OVERLAY', 'SET_TEXT', 'SET_BLUR', 'SET_SPLIT', 'SET_SPLIT_TRANSFORM', 'SET_SEGMENT'])
// Actions that never create an undo step.
const NON_UNDOABLE = new Set([
  'UPLOAD_START', 'UPLOAD_ERROR',
  'SELECT_ELEMENT', 'SELECT_SEGMENT', 'SET_TOOL', 'TOGGLE_SIDEBAR', 'SET_AUDIO', 'TOGGLE_SNAP',
  'CLAIM_DISCORD', 'OPEN_DISCORD_PROMPT', 'DISMISS_DISCORD_PROMPT',
  'EXPORT_START', 'EXPORT_PROGRESS', 'EXPORT_DONE', 'EXPORT_ERROR', 'EXPORT_RESET',
])
const HISTORY_LIMIT = 100

function pickDoc(s) {
  const o = {}
  for (const k of DOC_KEYS) o[k] = s[k]
  return o
}

function historyReducer(root, action) {
  const { past, future, present, lastType } = root

  if (action.type === 'UNDO') {
    if (!past.length) return root
    const prev = past[past.length - 1]
    return {
      past: past.slice(0, -1),
      present: { ...present, ...prev },
      future: [pickDoc(present), ...future],
      lastType: null,
    }
  }
  if (action.type === 'REDO') {
    if (!future.length) return root
    const next = future[0]
    return {
      past: [...past, pickDoc(present)],
      present: { ...present, ...next },
      future: future.slice(1),
      lastType: null,
    }
  }

  const nextPresent = reducer(present, action)
  if (nextPresent === present) return root // no-op action, don't touch history

  // Loading a clip or starting over begins a fresh history.
  if (action.type === 'UPLOAD_READY' || action.type === 'RESET') {
    return { past: [], future: [], present: nextPresent, lastType: null }
  }
  if (NON_UNDOABLE.has(action.type)) {
    return { ...root, present: nextPresent, lastType: action.type }
  }
  // Undoable: push the pre-change doc, unless we're mid-gesture on the same type.
  const coalesce = CONTINUOUS.has(action.type) && lastType === action.type
  const nextPast = coalesce ? past : [...past, pickDoc(present)].slice(-HISTORY_LIMIT)
  return { past: nextPast, future: [], present: nextPresent, lastType: action.type }
}

export function EditorProvider({ children }) {
  const [root, dispatch] = useReducer(historyReducer, {
    past: [],
    future: [],
    present: initialState,
    lastType: null,
  })
  const state = root.present
  const canUndo = root.past.length > 0
  const canRedo = root.future.length > 0

  // Export is unlocked with a loaded clip, credits, and a real overlay selection
  // — either a streamer's overlay image, a custom import, or a typed name (for
  // the streamers we don't have a PNG for). The blank default alone stays locked.
  const canExport =
    !!state.clip &&
    (!!state.overlay.image || state.overlay.streamer.trim().length > 0) &&
    state.credits > 0

  const formatSpec = FORMATS[state.format]
  const selectedSegment =
    state.segments.find((s) => s.id === state.selectedSegmentId) || state.segments[0] || null

  const set = useCallback((action) => dispatch(action), [])

  return (
    <EditorContext.Provider
      value={{ state, dispatch: set, canExport, formatSpec, selectedSegment, canUndo, canRedo }}
    >
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used inside EditorProvider')
  return ctx
}
