import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import Logo from '@/components/Logo'
import DiscordIcon from '@/components/icons/DiscordIcon'
import { DISCORD_URL } from '@/lib/site'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on route change / navigation so it never lingers
  // open over the next page.
  useEffect(() => {
    if (!menuOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border bg-background/90 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
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
            aria-label="Join Discord"
          >
            <DiscordIcon className="size-5" />
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="hidden h-11 px-5 text-sm font-bold uppercase tracking-wide sm:inline-flex"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </Button>
          <InteractiveHoverButton
            text={user ? 'Open Editor' : 'Get Started'}
            onClick={() => navigate('/editor')}
            className="h-11 w-auto rounded-none border-2 px-6 py-0 text-sm font-bold uppercase tracking-wide"
          />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex size-11 shrink-0 items-center justify-center border-2 border-border text-foreground md:hidden"
          >
            {menuOpen ? <X className="size-5" strokeWidth={2.25} /> : <Menu className="size-5" strokeWidth={2.25} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — the only way to reach Sign In / Discord / in-page nav
          below md, since the desktop nav row and Sign In button are hidden
          there. */}
      {menuOpen && (
        <div
          id="mobile-nav-menu"
          className="border-t border-border bg-background px-6 py-4 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join Discord"
              onClick={() => setMenuOpen(false)}
              className="flex h-11 items-center gap-2 font-mono text-sm font-bold uppercase tracking-widest text-kick transition-colors hover:text-kick-hover"
            >
              <DiscordIcon className="size-5" /> Join Discord
            </a>
            <Button
              variant="outline"
              onClick={() => {
                setMenuOpen(false)
                navigate('/dashboard')
              }}
              className="mt-2 h-11 justify-start px-3 text-sm font-bold uppercase tracking-wide"
            >
              {user ? 'Dashboard' : 'Sign In'}
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
