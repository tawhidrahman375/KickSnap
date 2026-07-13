import { createContext, useContext } from 'react'

/**
 * Lightweight playback state shared between the timeline, preview and trim panel.
 * Kept out of the main editor reducer so high-frequency time updates don't
 * re-render the whole editor tree through the reducer.
 */
const PlaybackContext = createContext(null)

export function PlaybackProvider({ value, children }) {
  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext)
  if (!ctx) throw new Error('usePlayback must be used inside PlaybackProvider')
  return ctx
}
