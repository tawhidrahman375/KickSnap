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
  TrendingDown,
  ArrowUpRight,
  Eye,
  DollarSign,
  Users,
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
  { id: 'analytics', label: 'Analytics', icon: ChartColumnBig },
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
              <Overview
                credits={credits}
                exportCount={exportCount}
                navigate={navigate}
                setTab={setTab}
              />
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

function StatCard({ icon: Icon, label, value, sub, onClick }) {
  const interactive = typeof onClick === 'function'
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'border-2 border-border bg-card p-5 text-left',
        interactive &&
          'group cursor-pointer transition-colors hover:border-kick/50 hover:bg-kick/[0.03]',
      )}
    >
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={2.5} /> {label}
      </div>
      <div className="mt-2 font-display text-4xl leading-none">{value}</div>
      {sub && (
        <div
          className={cn(
            'mt-2 text-xs text-muted-foreground',
            interactive && 'flex items-center gap-1 transition-colors group-hover:text-kick',
          )}
        >
          {sub}
          {interactive && <ArrowUpRight className="size-3.5" strokeWidth={2.5} />}
        </div>
      )}
    </Tag>
  )
}

function Overview({ credits, exportCount, navigate, setTab }) {
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
        <StatCard
          icon={Crown}
          label="Plan"
          value="Free"
          sub="Upgrade for more credits"
          onClick={() => setTab('billing')}
        />
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

/* ---------------- Analytics ----------------
   Sample-data dashboard. The layout is real; the numbers are placeholders
   until clip tracking ships with accounts (Supabase, Phase 2) — clearly
   labelled "Sample data" so it's never mistaken for real performance. */

// 30 days of daily views (thousands), trending up. Sliced per selected period.
const DAILY_30 = [
  18, 22, 19, 27, 24, 31, 29, 26, 34, 30, 38, 33, 41, 37, 45,
  40, 49, 44, 52, 48, 55, 61, 58, 66, 71, 68, 80, 74, 96, 124,
]

const TOP_STREAMERS = [
  { name: 'Adin Ross', views: 412000 },
  { name: 'Asmongold', views: 288000 },
  { name: 'Deshae Frost', views: 201000 },
  { name: 'Akademiks', views: 176000 },
  { name: 'Cheesur', views: 92000 },
]

const FORMAT_SPLIT = [
  { name: '9:16 Vertical', pct: 62 },
  { name: 'Square', pct: 21 },
  { name: 'Split', pct: 17 },
]

const TOP_CLIPS = [
  { title: 'insane 1v5 clutch', streamer: 'Adin Ross', format: '9:16', views: 412000 },
  { title: 'he said WHAT?!', streamer: 'Asmongold', format: '9:16', views: 288000 },
  { title: 'chat goes feral', streamer: 'Deshae Frost', format: 'Square', views: 201000 },
  { title: 'caught 4k live', streamer: 'Akademiks', format: 'Split', views: 176000 },
  { title: 'the reaction 😳', streamer: 'Cheesur', format: '9:16', views: 92000 },
]

// $ per 1M views in the Kick program (matches the landing-page figure).
const RPM = 800

function fmtViews(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'
  if (n >= 1e3) return Math.round(n / 1e3) + 'K'
  return String(n)
}
const earningsFor = (views) => Math.round((views / 1e6) * RPM)

/** Single-series area+line chart. Pure SVG, brand green, no deps. */
function ViewsChart({ data }) {
  const W = 720
  const H = 200
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const px = (i) => (i / (data.length - 1)) * W
  const py = (v) => H - 14 - ((v - min) / span) * (H - 32)
  const pts = data.map((v, i) => [px(i), py(v)])

  let line = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const cx = (x0 + x1) / 2
    line += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`
  }
  const area = `${line} L${W},${H} L0,${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#53fc18" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#53fc18" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          x2={W}
          y1={H * f}
          y2={H * f}
          stroke="#ffffff"
          strokeOpacity="0.06"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path d={area} fill="url(#viewsFill)" />
      <path
        d={line}
        fill="none"
        stroke="#53fc18"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function AnalyticsStat({ icon: Icon, label, value, delta }) {
  const up = delta >= 0
  return (
    <div className="border-2 border-border bg-card p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={2.5} /> {label}
      </div>
      <div className="mt-2 font-display text-3xl leading-none">{value}</div>
      <div
        className={cn(
          'mt-2 flex items-center gap-1 text-xs font-semibold',
          up ? 'text-kick' : 'text-red-400',
        )}
      >
        {up ? (
          <TrendingUp className="size-3.5" strokeWidth={2.5} />
        ) : (
          <TrendingDown className="size-3.5" strokeWidth={2.5} />
        )}
        {up ? '+' : ''}
        {delta}%
        <span className="font-normal text-muted-foreground">vs prev</span>
      </div>
    </div>
  )
}

function BarRow({ label, value, pct }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 w-full bg-background/60">
        <div className="h-full bg-kick" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Analytics() {
  const [days, setDays] = useState(7)

  const series = DAILY_30.slice(-days)
  const prev = DAILY_30.slice(-days * 2, -days)
  const sum = (a) => a.reduce((x, y) => x + y, 0)
  const views = sum(series) * 1000
  const prevViews = sum(prev) * 1000 || views
  const clips = Math.round(days * 0.85)
  const avg = Math.round(views / clips)
  const earnings = earningsFor(views)
  const delta = Math.round(((views - prevViews) / prevViews) * 100)

  const tiles = [
    { icon: Eye, label: 'Total views', value: fmtViews(views), delta },
    { icon: DollarSign, label: 'Est. earnings', value: `$${earnings.toLocaleString()}`, delta },
    { icon: Clapperboard, label: 'Clips posted', value: clips, delta: 15 },
    { icon: TrendingUp, label: 'Avg views / clip', value: fmtViews(avg), delta: Math.max(0, delta - 15) },
  ]

  const maxStreamer = TOP_STREAMERS[0].views

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
            <span className="text-kick">//</span> Analytics
          </div>
          <SectionTitle>Know what's landing</SectionTitle>
        </div>
        <div className="flex items-center gap-3">
          <span className="border-2 border-border bg-card px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Sample data
          </span>
          <div className="inline-flex items-center gap-1 border-2 border-border bg-card p-1">
            {[7, 14].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  'px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors',
                  days === d ? 'bg-kick text-black' : 'text-muted-foreground',
                )}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <AnalyticsStat key={t.label} {...t} />
        ))}
      </div>

      {/* Views over time */}
      <div className="border-2 border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Views over time
          </div>
          <div className="flex items-center gap-1 bg-kick/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide text-kick">
            <TrendingUp className="size-4" strokeWidth={2.5} /> Climbing
          </div>
        </div>
        <div className="overflow-hidden border-2 border-border bg-background/50 p-3">
          <ViewsChart data={series} />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{days}d ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border-2 border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Users className="size-3.5" strokeWidth={2.5} /> Top streamers by views
          </div>
          <div className="space-y-3">
            {TOP_STREAMERS.map((s) => (
              <BarRow
                key={s.name}
                label={s.name}
                value={fmtViews(s.views)}
                pct={(s.views / maxStreamer) * 100}
              />
            ))}
          </div>
        </div>

        <div className="border-2 border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <ChartColumnBig className="size-3.5" strokeWidth={2.5} /> Best format
          </div>
          <div className="space-y-3">
            {FORMAT_SPLIT.map((f) => (
              <BarRow key={f.name} label={f.name} value={`${f.pct}%`} pct={f.pct} />
            ))}
          </div>
        </div>
      </div>

      {/* Top clips */}
      <div className="overflow-x-auto border-2 border-border">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-border bg-card">
              <th className="px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Clip
              </th>
              <th className="px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Streamer
              </th>
              <th className="px-5 py-3.5 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Format
              </th>
              <th className="px-5 py-3.5 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Views
              </th>
              <th className="px-5 py-3.5 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-kick">
                Est. $
              </th>
            </tr>
          </thead>
          <tbody>
            {TOP_CLIPS.map((c, i) => (
              <tr
                key={c.title}
                className={cn('border-b border-border/60 last:border-0', i % 2 === 1 && 'bg-card/30')}
              >
                <td className="px-5 py-3.5 text-sm font-medium">{c.title}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.streamer}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className="border border-border bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {c.format}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm">{fmtViews(c.views)}</td>
                <td className="px-5 py-3.5 text-right font-mono text-sm font-bold text-kick">
                  ${earningsFor(c.views)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        These are sample numbers to show the layout. Your real views and earnings appear
        here once clip tracking launches with Discord sign-in.
      </p>
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
