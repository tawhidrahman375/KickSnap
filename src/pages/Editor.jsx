import { EditorProvider } from '@/editor/EditorContext'
import EditorShell from '@/editor/EditorShell'

/**
 * Single-screen editor: sidebar + canvas + controls are always mounted. The
 * upload drop zone lives inside the 9:16 canvas, so there is no separate step.
 */
export default function Editor() {
  return (
    <EditorProvider>
      <EditorShell />
    </EditorProvider>
  )
}
