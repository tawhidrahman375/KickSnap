import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'
import DiscordIcon from '@/components/icons/DiscordIcon'
import { DISCORD_URL } from '@/lib/site'

const LINKS = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Cookie Policy', to: '/cookies' },
]

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Logo />
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Clip smarter. Earn more.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-kick"
          >
            <DiscordIcon className="size-4" />
            Discord
          </a>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl px-6 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60 sm:text-left">
        © {new Date().getFullYear()} KickSnap. Not affiliated with Kick.com.
      </div>
    </footer>
  )
}
