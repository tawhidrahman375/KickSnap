import { EditorProvider } from './EditorContext'
import EditorShell from './EditorShell'

/**
 * The real editor, packaged for the landing page's "try it before you sign up"
 * demo. It's the SAME EditorProvider + EditorShell the /editor route uses — just
 * in embedded mode (fills its frame, no global hotkeys, export gated). Lazy-
 * imported by LiveDemo so mediabunny stays out of the initial landing bundle.
 */
export default function EmbeddedEditor({ onLockedExport }) {
  return (
    <EditorProvider>
      <EditorShell embedded onLockedExport={onLockedExport} />
    </EditorProvider>
  )
}
