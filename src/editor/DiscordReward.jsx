import { useEffect, useState } from 'react'
import { X, Gift, Check, ExternalLink } from 'lucide-react'
import { useEditor } from './EditorContext'
import { DISCORD_INVITE, DISCORD_BONUS_CREDITS } from './constants'
import DiscordLogo from './DiscordLogo'

const PERKS = [
  'Drop requests + who’s paying the most',
  'Early features before anyone else',
  'Help when an export won’t behave',
]

/**
 * New-user reward: join the KickSnap Discord, get 5 bonus credits. Two steps so
 * the join actually happens before the credits land — Open Discord, then Claim.
 * Claimed state is persisted (localStorage) so the bonus is granted only once.
 */
export default function DiscordReward() {
  const { state, dispatch } = useEditor()
  const [opened, setOpened] = useState(false)

  const open = state.showDiscordPrompt
  const dismiss = () => dispatch({ type: 'DISMISS_DISCORD_PROMPT' })

  // Close on Escape (only while open). Dispatches directly rather than calling
  // `dismiss` so the effect doesn't re-subscribe on every render.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') dispatch({ type: 'DISMISS_DISCORD_PROMPT' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dispatch])

  if (!open) return null

  const claimed = state.discordClaimed

  const openDiscord = () => {
    window.open(DISCORD_INVITE, '_blank', 'noopener,noreferrer')
    setOpened(true)
  }
  const claim = () => dispatch({ type: 'CLAIM_DISCORD' })

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm duration-200 animate-in fade-in"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discord-reward-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden border-2 border-[#5865F2] bg-card shadow-2xl duration-200 animate-in zoom-in-95"
      >
        {/* blurple header */}
        <div className="relative flex flex-col items-center gap-3 bg-gradient-to-b from-[#5865F2] to-[#4752C4] px-6 pb-6 pt-8 text-center">
          <button
            onClick={dismiss}
            title="Close"
            className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg ring-1 ring-white/25">
            <DiscordLogo className="size-9" />
          </div>
          <h2
            id="discord-reward-title"
            className="font-display text-3xl uppercase leading-[0.9] tracking-tight text-white"
          >
            Join the Discord
          </h2>
          <div className="flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-white">
            <Gift className="size-4" strokeWidth={2.5} />
            +{DISCORD_BONUS_CREDITS} free credits
          </div>
        </div>

        {/* body */}
        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="text-center text-sm text-muted-foreground">
            {claimed
              ? 'You already claimed your bonus — see you in there.'
              : `Hop in the KickSnap community and we’ll drop ${DISCORD_BONUS_CREDITS} bonus credits straight onto your account.`}
          </p>

          <ul className="flex flex-col gap-2">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#5865F2]/15 text-[#5865F2]">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          {!claimed ? (
            <div className="mt-1 flex flex-col gap-2">
              {!opened ? (
                <button
                  onClick={openDiscord}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-3 font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#4752C4]"
                >
                  <DiscordLogo className="size-5" />
                  Open Discord
                  <ExternalLink className="size-4" strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  onClick={claim}
                  className="flex items-center justify-center gap-2 rounded-lg bg-kick px-4 py-3 font-bold uppercase tracking-wide text-black transition-colors hover:bg-kick-hover"
                >
                  <Gift className="size-5" strokeWidth={2.5} />
                  Claim my {DISCORD_BONUS_CREDITS} credits
                </button>
              )}
              <button
                onClick={dismiss}
                className="py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                Maybe later
              </button>
              {opened && (
                <p className="text-center font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Joined? Tap claim to bank your credits.
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={dismiss}
              className="mt-1 rounded-lg bg-kick px-4 py-3 font-bold uppercase tracking-wide text-black transition-colors hover:bg-kick-hover"
            >
              Let’s go
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
