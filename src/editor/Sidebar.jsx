import {
  LayoutGrid,
  Sparkles,
  Layers,
  Type,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
} from 'lucide-react'
import { useEditor } from './EditorContext'
import FormatPanel from './panels/FormatPanel'
import EffectsPanel from './panels/EffectsPanel'
import OverlayPanel from './panels/OverlayPanel'
import TextPanel from './panels/TextPanel'
import { cn } from '@/lib/utils'

// Trimming lives on the timeline itself now (Split Left / Split Right + the
// draggable heads), CapCut-style — so there's no separate Trim sidebar tab.
const TOOLS = [
  { id: 'format', label: 'Format', icon: LayoutGrid, Panel: FormatPanel },
  { id: 'effects', label: 'Effects', icon: Sparkles, Panel: EffectsPanel },
  { id: 'overlay', label: 'Overlay', icon: Layers, Panel: OverlayPanel },
  { id: 'text', label: 'Text', icon: Type, Panel: TextPanel },
]

// In the landing-page demo, Text is a locked teaser rather than hidden — it
// shows there's more in the real editor without letting the demo add an
// element that then can't be exported.
export default function Sidebar({ embedded = false, onLocked }) {
  const { state, dispatch } = useEditor()
  const collapsed = state.sidebarCollapsed
  const active = TOOLS.find((t) => t.id === state.activeTool) ?? TOOLS[0]

  return (
    <div className="flex h-full border-r-2 border-border bg-sidebar">
      {/* icon rail */}
      <div className="flex w-16 flex-col items-center gap-1 border-r-2 border-border py-3">
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          title="New clip"
          className="mb-2 flex size-11 items-center justify-center bg-kick text-black transition-colors hover:bg-kick-hover"
        >
          <Plus className="size-6" strokeWidth={3} />
        </button>

        {TOOLS.map(({ id, label, icon: Icon }) => {
          const locked = embedded && id === 'text'
          return (
            <button
              key={id}
              onClick={() => {
                if (locked) {
                  onLocked?.()
                  return
                }
                dispatch({ type: 'SET_TOOL', tool: id })
                if (collapsed) dispatch({ type: 'TOGGLE_SIDEBAR' })
              }}
              title={locked ? `${label} — sign up to unlock` : label}
              className={cn(
                'group relative flex size-11 items-center justify-center transition-colors',
                locked
                  ? 'text-muted-foreground/40 hover:text-muted-foreground'
                  : active.id === id && !collapsed
                    ? 'bg-card text-kick'
                    : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-5" strokeWidth={2.25} />
              {locked && (
                <Lock className="absolute right-1.5 top-1.5 size-2.5 text-muted-foreground/70" strokeWidth={3} />
              )}
              {active.id === id && !locked && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-kick" />
              )}
              <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap border-2 border-border bg-popover px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {locked ? `${label} 🔒` : label}
              </span>
            </button>
          )
        })}

        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          title={collapsed ? 'Expand' : 'Collapse'}
          className="mt-auto flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" strokeWidth={2.25} />
          ) : (
            <PanelLeftClose className="size-5" strokeWidth={2.25} />
          )}
        </button>
      </div>

      {/* active panel */}
      {!collapsed && (
        <div className="flex w-72 flex-col overflow-y-auto">
          <div className="flex items-center gap-2 border-b-2 border-border px-4 py-3">
            <active.icon className="size-4 text-kick" strokeWidth={2.5} />
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
              {active.label}
            </h2>
          </div>
          <div className="flex-1 p-4">
            <active.Panel />
          </div>
        </div>
      )}
    </div>
  )
}
