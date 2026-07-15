import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  LayoutDashboard,
  ChartColumnBig,
  CreditCard,
  Settings,
  Coins,
  Plus,
  Check,
  X,
  Lock,
  Download,
  Gift,
  TrendingUp,
  ArrowUpRight,
  Crown,
  LogOut,
  Clapperboard,
  ChevronRight,
} from 'lucide-react'
import Logo from '@/components/Logo'
import DiscordIcon from '@/components/icons/DiscordIcon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DISCORD_URL = 'https://discord.gg/DT7HvKQ9Gw'

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: ChartColumnBig, soon: true },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// Genuine-but-local placeholders. These read from localStorage today and move to
// Supabase (auth + credits) in Phase 2 — the UI won't change, only the source.
function readCredits() {
  const v = Number(localStorage.getItem('kicksnap_credits'))
  return Number.isFinite(v) && v > 0 ? v : 10
}
function readExportCount() {
  const v = Number(localStorage.getItem('kicksnap_exports'))
  return Number.isFinite(v) && v >= 0 ? v : 0
}

export default function Dashboard() {
  const [tab, setTab] = useState('overview')
  const navigate = useNavigate()
  const credits = readCredits()
  const exportCount = readExportCount()

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r-2 border-border bg-card/40 md:flex">
        <div className="flex h-20 items-center border-b-2 border-border px-6">
          <button onClick={() => setTab('overview')} className="flex items-center" title="Dashboard">
            <Logo className="h-8" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 p-4">
          {/* Editor — the hero action. Deliberately loud (filled kick green +
              glow) and set apart from the muted nav below so it's the obvious
              thing to click. */}
          <button
            onClick={() => navigate('/editor')}
            className="group flex w-full items-center gap-3 border-2 border-kick bg-kick px-4 py-4 text-left text-black shadow-[0_0_28px_-8px_rgba(83,252,24,0.8)] transition-all hover:bg-kick-hover"
          >
            <div className="flex size-10 shrink-0 items-center justify-center bg-black/15">
              <Clapperboard className="size-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg uppercase leading-none tracking-tight">Editor</div>
              <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black/60">
                Make a clip
              </div>
            </div>
            <Plus
              className="size-4 shrink-0 transition-transform group-hover:rotate-90"
              strokeWidth={3}
            />
          </button>

          <div className="space-y-1">
            <div className="px-4 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
              Menu
            </div>
            {NAV.map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-2 px-4 py-3 text-left font-mono text-xs font-bold uppercase tracking-widest transition-colors',
                    active
                      ? 'border-kick/40 bg-kick/10 text-kick'
                      : 'border-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={2.5} />
                  <span className="flex-1">{item.label}</span>
                  {item.soon && (
                    <span className="bg-foreground/10 px-1.5 py-0.5 text-[9px] tracking-wider text-muted-foreground">
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="border-t-2 border-border p-4">
          <div className="flex items-center gap-3 px-1">
            <div className="flex size-9 items-center justify-center bg-foreground/10 font-display text-sm text-muted-foreground">
              ?
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">Guest</div>
              <div className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Not signed in
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        {/* Top bar (mobile nav + credits) */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b-2 border-border bg-background/90 px-6 backdrop-blur-md sm:px-10">
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setTab('overview')}>
              <Logo className="h-7" />
            </button>
          </div>
          <div className="hidden font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground md:block">
            {NAV.find((n) => n.id === tab)?.label}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-2 border-border bg-card px-4 py-2">
              <Coins className="size-4 text-kick" strokeWidth={2.5} />
              <span className="font-display text-lg leading-none">{credits}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                credits
              </span>
            </div>
            <Button
              onClick={() => navigate('/editor')}
              className="hidden h-10 rounded-none bg-kick font-bold uppercase tracking-wide text-black hover:bg-kick-hover sm:inline-flex"
            >
              <Plus className="size-4" strokeWidth={3} /> New Clip
            </Button>
          </div>
        </header>

        {/* Mobile tab rail */}
        <div className="flex gap-1 overflow-x-auto border-b-2 border-border px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'shrink-0 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider',
                tab === item.id ? 'bg-kick/10 text-kick' : 'text-muted-foreground',
              )}
            >
              {item.label}
              {item.soon && ' ·'}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
          {/* Keyed remount fades each tab in; no exit-wait so switching is
              instant and never stalls on an unfinished animation. */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'overview' && (
              <Overview credits={credits} exportCount={exportCount} navigate={navigate} />
            )}
            {tab === 'analytics' && <Analytics />}
            {tab === 'billing' && <Billing credits={credits} />}
            {tab === 'settings' && <SettingsTab />}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

/* ---------------- Overview ---------------- */

function SectionTitle({ children }) {
  return (
    <h1 className="font-display text-[clamp(2rem,4vw,3rem)] uppercase leading-[0.9] tracking-tight">
      {children}
    </h1>
  )
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="border-2 border-border bg-card p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={2.5} /> {label}
      </div>
      <div className="mt-2 font-display text-4xl leading-none">{value}</div>
      {sub && <div className="mt-2 text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

function Overview({ credits, exportCount, navigate }) {
  return (
    <div className="space-y-10">
      <div>
        <div className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
          <span className="text-kick">//</span> Welcome back
        </div>
        <SectionTitle>Your clip HQ</SectionTitle>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Turn a raw Kick moment into a ready-to-post clip in under a minute. Everything
          runs in your browser — your clips never leave your machine.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Coins} label="Credits left" value={credits} sub="Free plan · resets monthly" />
        <StatCard icon={Crown} label="Plan" value="Free" sub="Upgrade for more credits" />
        <StatCard icon={Clapperboard} label="Clips exported" value={exportCount} sub="All-time" />
      </div>

      {/* Primary CTA */}
      <div className="flex flex-col items-start justify-between gap-6 border-2 border-kick/30 bg-kick/5 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl uppercase leading-none tracking-tight">
            Make your next clip
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Drop a clip, add the overlay, export. No upload, no watermark.
          </p>
        </div>
        <Button
          onClick={() => navigate('/editor')}
          className="h-12 shrink-0 rounded-none bg-kick px-8 font-bold uppercase tracking-wide text-black hover:bg-kick-hover"
        >
          <Plus className="size-4" strokeWidth={3} /> Open editor
        </Button>
      </div>

      {/* Discord + recent exports */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex items-center gap-4 border-2 border-border bg-card p-5">
          <div className="flex size-11 shrink-0 items-center justify-center bg-[#5865F2]/15 text-[#5865F2]">
            <Gift className="size-5" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Get 5 free credits</div>
            <div className="text-sm text-muted-foreground">Join the KickSnap Discord.</div>
          </div>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              className="h-10 rounded-none border-2 font-bold uppercase tracking-wide"
            >
              <DiscordIcon className="size-4" /> Join
            </Button>
          </a>
        </div>

        <div className="border-2 border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Download className="size-3.5" strokeWidth={2.5} /> Recent exports
          </div>
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <Clapperboard className="size-7 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Your exported clips will show up here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Analytics (coming soon) ---------------- */

const ANALYTICS_FEATURES = [
  'Views over time, per clip',
  'Best streamer & format breakdown',
  'Estimated earnings in real time',
  'Which clips are actually landing',
]

const CHART_PATH =
  'M0,110 C40,100 70,95 100,80 C140,60 170,72 210,50 C250,30 290,40 330,22 C360,10 380,14 400,6'

function Analytics() {
  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
          <span className="text-kick">//</span> Analytics
        </div>
        <SectionTitle>Know what's landing</SectionTitle>
      </div>

      {/* Locked preview */}
      <div className="relative overflow-hidden border-2 border-border bg-card">
        {/* blurred mock chart behind */}
        <div className="pointer-events-none select-none p-6 blur-[3px] saturate-50">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Total views
              </div>
              <div className="font-display text-4xl leading-none">1.24M</div>
            </div>
            <div className="flex items-center gap-1 bg-kick/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide text-kick">
              <TrendingUp className="size-4" strokeWidth={2.5} /> Climbing
            </div>
          </div>
          <div className="h-40 w-full border-2 border-border bg-background/50 p-3">
            <svg viewBox="0 0 400 120" className="h-full w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dashChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#53fc18" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#53fc18" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${CHART_PATH} L400,120 L0,120 Z`} fill="url(#dashChartFill)" />
              <path
                d={CHART_PATH}
                fill="none"
                stroke="#53fc18"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40 text-center">
          <div className="flex size-14 items-center justify-center border-2 border-kick/40 bg-background text-kick">
            <Lock className="size-6" strokeWidth={2.5} />
          </div>
          <div className="font-display text-2xl uppercase tracking-tight">Coming soon</div>
          <p className="max-w-sm px-6 text-sm text-muted-foreground">
            Performance tracking is on the roadmap. For now, keep clipping — your history
            will be waiting when this goes live.
          </p>
        </div>
      </div>

      {/* Feature list */}
      <div className="grid gap-3 sm:grid-cols-2">
        {ANALYTICS_FEATURES.map((f) => (
          <div
            key={f}
            className="flex items-center gap-3 border-2 border-border bg-card/40 px-5 py-4"
          >
            <div className="flex size-8 shrink-0 items-center justify-center bg-kick/10 text-kick">
              <ArrowUpRight className="size-4" strokeWidth={2.5} />
            </div>
            <span className="font-medium">{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Billing ---------------- */

const PLANS = [
  {
    name: 'Pro',
    monthly: 15,
    yearly: 12.5,
    tagline: 'Most Popular',
    credits: '150 credits / month + rollover',
    highlight: true,
  },
  {
    name: 'Agency',
    monthly: 150,
    yearly: 125,
    tagline: 'For serious clippers',
    credits: 'Unlimited credits + every feature',
    highlight: false,
  },
]

const CREDIT_PACKS = [
  { name: 'Starter', price: 5, credits: '30 credits' },
  { name: 'Pro Pack', price: 10, credits: '100 credits' },
]

const COMPARISON = [
  { label: 'Credits / month', pro: '150', agency: 'Unlimited' },
  { label: 'Credit rollover', pro: true, agency: true },
  { label: 'Saved templates', pro: true, agency: true },
  { label: 'Auto-post to TikTok / Shorts / Reels', pro: false, agency: true },
  { label: 'Batch processing', pro: false, agency: true },
  { label: 'Team accounts', pro: false, agency: true },
  { label: 'Submission tracker', pro: false, agency: true },
  { label: 'Payout calculator', pro: false, agency: true },
  { label: 'Analytics', pro: 'Basic', agency: 'Full' },
  { label: 'Export reports PDF', pro: false, agency: true },
]

function CompareCell({ value }) {
  if (value === true)
    return <Check className="mx-auto size-5 text-kick" strokeWidth={3} />
  if (value === false)
    return <X className="mx-auto size-5 text-muted-foreground/40" strokeWidth={2.5} />
  return <span className="text-sm font-bold text-foreground">{value}</span>
}

function Billing({ credits }) {
  const [yearly, setYearly] = useState(false)

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
          <span className="text-kick">//</span> Billing
        </div>
        <SectionTitle>Plan & credits</SectionTitle>
      </div>

      {/* Current plan */}
      <div className="flex flex-col items-start justify-between gap-4 border-2 border-border bg-card p-6 sm:flex-row sm:items-center">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Current plan
          </div>
          <div className="mt-1 font-display text-3xl uppercase leading-none tracking-tight">
            Free
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {credits} credits left · resets monthly
          </div>
        </div>
        <div className="flex items-center gap-2 border-2 border-border bg-background px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <Lock className="size-3.5" /> Checkout launching soon
        </div>
      </div>

      {/* Billing-period toggle */}
      <div className="flex">
        <div className="inline-flex items-center gap-1 border-2 border-border bg-card p-1">
          <button
            onClick={() => setYearly(false)}
            className={cn(
              'px-5 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-colors',
              !yearly ? 'bg-kick text-black' : 'text-muted-foreground',
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn(
              'flex items-center gap-2 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-colors',
              yearly ? 'bg-kick text-black' : 'text-muted-foreground',
            )}
          >
            Yearly
            <span
              className={cn(
                'px-2 py-0.5 text-[10px] font-bold',
                yearly ? 'bg-black/20 text-black' : 'bg-kick/15 text-kick',
              )}
            >
              2 months free
            </span>
          </button>
        </div>
      </div>

      {/* Subscription plans */}
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const price = yearly ? plan.yearly : plan.monthly
          return (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col border-2 p-6',
                plan.highlight
                  ? 'border-kick bg-card shadow-[0_0_50px_-20px_rgba(83,252,24,0.4)]'
                  : 'border-border bg-card',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {plan.tagline}
                </span>
                {plan.highlight && (
                  <span className="bg-kick px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                    ★
                  </span>
                )}
              </div>
              <div className="mt-1 font-display text-2xl uppercase tracking-tight">
                {plan.name}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl leading-none">${price}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  /mo
                </span>
              </div>
              <div className="mt-2 flex-1 text-sm text-muted-foreground">{plan.credits}</div>
              <Button
                disabled
                className={cn(
                  'mt-4 h-10 w-full cursor-not-allowed rounded-none font-bold uppercase tracking-wide',
                  plan.highlight
                    ? 'bg-kick/40 text-black/60'
                    : 'bg-foreground/10 text-muted-foreground',
                )}
              >
                Soon
              </Button>
            </div>
          )
        })}
      </div>

      {/* Credit packs */}
      <div>
        <div className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Top up your credits — one-time, no subscription
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.name}
              className="flex items-center justify-between border-2 border-border bg-card px-5 py-4"
            >
              <div>
                <div className="font-bold">{pack.name}</div>
                <div className="text-sm text-muted-foreground">{pack.credits}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl leading-none">${pack.price}</span>
                <Button
                  disabled
                  className="cursor-not-allowed rounded-none bg-foreground/10 font-bold uppercase tracking-wide text-muted-foreground"
                  size="sm"
                >
                  Soon
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro vs Agency comparison */}
      <div className="overflow-x-auto border-2 border-border">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-border bg-card">
              <th className="px-5 py-4 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Feature
              </th>
              <th className="px-5 py-4 text-center font-mono text-xs font-bold uppercase tracking-widest text-foreground">
                Pro
              </th>
              <th className="px-5 py-4 text-center font-mono text-xs font-bold uppercase tracking-widest text-kick">
                Agency
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr
                key={row.label}
                className={cn(
                  'border-b border-border/60 last:border-0',
                  i % 2 === 1 && 'bg-card/30',
                )}
              >
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{row.label}</td>
                <td className="px-5 py-3.5 text-center">
                  <CompareCell value={row.pro} />
                </td>
                <td className="px-5 py-3.5 text-center">
                  <CompareCell value={row.agency} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        Payments arrive with Discord sign-in — you'll be able to top up credits and manage
        your plan right here.
      </p>
    </div>
  )
}

/* ---------------- Settings ---------------- */

function SettingRow({ title, desc, action }) {
  return (
    <div className="flex items-center justify-between gap-4 border-2 border-border bg-card p-5">
      <div className="min-w-0">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      {action}
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
          <span className="text-kick">//</span> Settings
        </div>
        <SectionTitle>Account</SectionTitle>
      </div>

      <div className="space-y-3">
        <SettingRow
          title="Discord sign-in"
          desc="Connect your Discord to sync credits across devices."
          action={
            <div className="flex items-center gap-2 border-2 border-border bg-background px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <Lock className="size-3.5" /> Soon
            </div>
          }
        />
        <SettingRow
          title="Export defaults"
          desc="Set a default format, overlay position and caption style."
          action={
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Soon
            </span>
          }
        />
        <SettingRow
          title="Sign out"
          desc="End your session on this device."
          action={
            <Button
              variant="outline"
              disabled
              className="h-10 shrink-0 cursor-not-allowed rounded-none border-2 font-bold uppercase tracking-wide"
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          }
        />
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        Back to site <ChevronRight className="size-3.5" />
      </Link>
    </div>
  )
}
