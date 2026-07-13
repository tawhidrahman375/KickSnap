import { Link } from 'react-router-dom'
import { ChevronLeft, Coins, Download, Loader2, TriangleAlert } from 'lucide-react'
import { useEditor } from './EditorContext'
import { FORMATS, DISCORD_INVITE, DISCORD_BONUS_CREDITS } from './constants'
import DiscordLogo from './DiscordLogo'
import Logo from '@/components/Logo'
import { cn } from '@/lib/utils'

export default function TopBar({ onExport }) {
  const { state, dispatch, canExport, formatSpec } = useEditor()
  const running = state.export.status === 'running'
  const lowCredits = state.credits <= 3
  const noStreamer = !state.overlay.image && state.overlay.streamer.trim().length === 0

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b-2 border-border bg-background px-4">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex size-9 items-center justify-center border-2 border-border text-muted-foreground transition-colors hover:border-kick hover:text-foreground"
          title="Dashboard"
        >
          <ChevronLeft className="size-5" strokeWidth={2.5} />
        </Link>
        <Link to="/dashboard" title="Dashboard" className="hidden sm:block">
          <Logo className="h-7" />
        </Link>
        <span className="ml-2 hidden border-2 border-border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:inline-block">
          {formatSpec.id === 'square' ? '1:1' : '9:16'} · {FORMATS[state.format].height}p · H.264
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Discord badge — light-blue square, opens the community + reward */}
        <button
          onClick={() => {
            window.open(DISCORD_INVITE, '_blank', 'noopener,noreferrer')
            if (!state.discordClaimed) dispatch({ type: 'OPEN_DISCORD_PROMPT' })
          }}
          title={
            state.discordClaimed
              ? 'KickSnap Discord'
              : `Join our Discord for ${DISCORD_BONUS_CREDITS} free credits`
          }
          className="relative flex size-11 items-center justify-center rounded-xl bg-[#5865F2] text-white shadow-[0_0_20px_-6px_rgba(88,101,242,0.9)] transition-all hover:scale-105 hover:bg-[#4752C4]"
        >
          <DiscordLogo className="size-6" />
          {!state.discordClaimed && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-kick px-1 font-mono text-[9px] font-bold text-black ring-2 ring-background">
              +{DISCORD_BONUS_CREDITS}
            </span>
          )}
        </button>

        {/* credit counter — always visible */}
        <div
          className={cn(
            'flex items-center gap-2 border-2 px-3 py-1.5',
            lowCredits ? 'border-destructive/60 text-destructive' : 'border-border text-foreground',
          )}
          title={lowCredits ? 'Running low on credits' : 'Credits remaining'}
        >
          <Coins className="size-4" strokeWidth={2.5} />
          <span className="font-mono text-sm font-bold tabular-nums">{state.credits}</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-widest opacity-70 sm:inline">
            credits
          </span>
        </div>

        {/* export — with a hover warning when it's blocked (no overlay / no credits) */}
        {(() => {
          const blocked = !state.clip
            ? 'clip'
            : noStreamer
              ? 'overlay'
              : state.credits <= 0
                ? 'credits'
                : null
          const warn =
            blocked === 'overlay'
              ? 'Pick a streamer or import an overlay first'
              : blocked === 'credits'
                ? 'You’re out of credits'
                : blocked === 'clip'
                  ? 'Drop a clip in to get started'
                  : null
          const handleClick = () => {
            if (canExport && !running) return onExport()
            if (blocked === 'overlay') dispatch({ type: 'SET_TOOL', tool: 'overlay' }) // guide them there
          }
          return (
            <div className="group relative">
              <button
                onClick={handleClick}
                disabled={running}
                aria-disabled={!canExport}
                className={cn(
                  'flex h-11 items-center gap-2 px-5 font-bold uppercase tracking-wide transition-colors',
                  canExport && !running
                    ? 'bg-kick text-black hover:bg-kick-hover'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {running ? (
                  <>
                    <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
                    Exporting
                  </>
                ) : (
                  <>
                    <Download className="size-4" strokeWidth={2.5} />
                    Export
                  </>
                )}
              </button>
              {warn && !running && (
                <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 hidden w-max max-w-xs items-center gap-2 border-2 border-amber-400/60 bg-popover px-3 py-2 shadow-xl group-hover:flex">
                  <TriangleAlert className="size-4 shrink-0 text-amber-400" strokeWidth={2.5} />
                  <span className="text-xs font-medium text-foreground">{warn}</span>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </header>
  )
}
