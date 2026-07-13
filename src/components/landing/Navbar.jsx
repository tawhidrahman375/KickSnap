import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import DiscordIcon from '@/components/icons/DiscordIcon'
import { cn } from '@/lib/utils'

const DISCORD_URL = 'https://discord.gg/DT7HvKQ9G'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b-2 border-border bg-background/90 backdrop-blur-md'
          : 'border-b-2 border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-9" />
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-kick transition-colors hover:text-kick-hover"
            title="Join Discord"
          >
            <DiscordIcon className="size-5" />
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="lg"
            className="hidden h-11 rounded-none px-5 text-sm font-bold uppercase tracking-wide sm:inline-flex"
          >
            Sign In
          </Button>
          <Button
            size="lg"
            onClick={() => navigate('/editor')}
            className="h-11 rounded-none bg-kick px-6 text-sm font-bold uppercase tracking-wide text-black hover:bg-kick-hover"
          >
            Get Started
          </Button>
        </div>
      </nav>
    </header>
  )
}
