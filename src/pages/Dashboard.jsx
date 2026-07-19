import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  User,
  CheckCircle2,
} from 'lucide-react'
import Logo from '@/components/Logo'
import DiscordIcon from '@/components/icons/DiscordIcon'
import { Button } from '@/components/ui/button'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { DISCORD_URL } from '@/lib/site'
import { useAuth } from '@/lib/auth'
import { CREDIT_PACKS, PLANS } from '@/lib/pricing'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: ChartColumnBig },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// Free-plan monthly credit grant — used to show usage against the allowance.
const PLAN_CREDITS = 10

// Monthly credit allowance per plan, for the Overview usage bar. Agency is
// unlimited, so it has no allowance to show progress against.
const PLAN_ALLOWANCE = { Free: 10, Pro: 150, Agency: null }

// Analytics needs TikTok API access to report real per-clip performance, and we
// don't have it yet. The dashboard below is fully built and runs on sample data,
// so it stays behind this flag rather than being deleted — showing invented
// numbers on an account page would read as the user's own results. Flip to true
// once clips can be tracked for real.
const ANALYTICS_ENABLED = false

const PLAN_LABELS = { free: 'Free', pro: 'Pro', agency: 'Agency' }

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(() => (searchParams.get('tab') === 'billing' ? 'billing' : 'overview'))
  const navigate = useNavigate()
  const { account, refreshAccount } = useAuth()

  // `account` is null while the profile row loads, and in guest mode (no
  // Supabase configured, where RequireAuth lets everyone through). Fall back to
  // the free-plan defaults so the layout never renders holes.
  const credits = account?.credits ?? PLAN_CREDITS
  const exportCount = account?.exportsCount ?? 0
  const plan = PLAN_LABELS[account?.plan] ?? 'Free'

  // Captured once on mount — the Stripe redirect (create-checkout's
  // success_url/cancel_url) lands here as `?checkout=success|cancelled`.
  // Refresh credits on success (the webhook may have already landed by the
  // time we're back) and strip the param so a refresh doesn't re-show it.
  const [checkoutStatus] = useState(() => searchParams.get('checkout'))
  const [showCheckoutBanner, setShowCheckoutBanner] = useState(true)
  useEffect(() => {
    if (!checkoutStatus) return
    if (checkoutStatus === 'success') refreshAccount()
    const next = new URLSearchParams(searchParams)
    next.delete('checkout')
    setSearchParams(next, { replace: true })
    // Runs once on mount to consume the redirect — checkoutStatus is fixed by
    // its lazy initializer above, so it can't drift out of sync with this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-card/30 md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <button onClick={() => setTab('overview')} className="flex items-center" title="Dashboard">
            <Logo className="h-7" />
          </button>
        </div>

        <nav className="flex-1 p-3">
          {/* Editor — the hero action. A calm, confident primary button set apart
              from the muted nav so it's the obvious thing to click. */}
          <button
            onClick={() => navigate('/editor')}
            className="group mb-6 flex w-full items-center gap-3 rounded-lg bg-kick px-3.5 py-3 text-left text-black transition-colors hover:bg-kick-hover"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-black/15">
              <Clapperboard className="size-[18px]" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-tight">New clip</div>
              <div className="text-xs font-medium text-black/60">Open the editor</div>
            </div>
            <Plus
              className="size-4 shrink-0 transition-transform group-hover:rotate-90"
              strokeWidth={2.75}
            />
          </button>

          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Menu
          </div>
          <div className="space-y-0.5">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                    active
                      ? 'bg-kick/10 text-kick'
                      : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                  )}
                >
                  <Icon className="size-[18px] shrink-0" strokeWidth={2} />
                  <span className="flex-1">{item.label}</span>
                  {item.id === 'analytics' && !ANALYTICS_ENABLED && (
                    <span
                      title="Coming soon"
                      className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-border p-3">
          <SidebarUser onOpenSettings={() => setTab('settings')} />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        {/* Top bar (mobile nav + credits) */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/85 px-6 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setTab('overview')}>
              <Logo className="h-7" />
            </button>
          </div>
          <div className="hidden text-sm font-medium text-muted-foreground md:block">
            {NAV.find((n) => n.id === tab)?.label}
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5"
              title="Credits remaining"
            >
              <Coins className="size-4 text-kick" strokeWidth={2.25} />
              <span className="text-sm font-semibold tabular-nums">{credits}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
            <Button
              onClick={() => navigate('/editor')}
              className="hidden h-11 px-4 text-sm font-semibold sm:inline-flex"
            >
              <Plus className="size-4" strokeWidth={2.5} /> New clip
            </Button>
          </div>
        </header>

        {/* Stripe checkout return feedback — success/cancelled banner */}
        {checkoutStatus && showCheckoutBanner && (
          <div
            role="status"
            className={cn(
              'flex items-center justify-between gap-3 border-b px-6 py-3 text-sm font-medium sm:px-8',
              checkoutStatus === 'success'
                ? 'border-kick/30 bg-kick/10 text-kick'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            <span className="flex items-center gap-2">
              {checkoutStatus === 'success' ? (
                <>
                  <CheckCircle2 className="size-4 shrink-0" strokeWidth={2.25} />
                  Payment successful — your credits have been added.
                </>
              ) : (
                'Checkout cancelled — you were not charged.'
              )}
            </span>
            <button
              onClick={() => setShowCheckoutBanner(false)}
              aria-label="Dismiss"
              className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="size-4" strokeWidth={2.25} />
            </button>
          </div>
        )}

        {/* Mobile tab rail */}
        <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === item.id ? 'bg-kick/10 text-kick' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8 sm:py-10">
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
                plan={plan}
                navigate={navigate}
                setTab={setTab}
              />
            )}
            {tab === 'analytics' && (ANALYTICS_ENABLED ? <Analytics /> : <AnalyticsComingSoon />)}
            {tab === 'billing' && <Billing credits={credits} plan={plan} />}
            {tab === 'settings' && <SettingsTab />}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

/* ---------------- Shared ---------------- */

/**
 * Discord's CDN can 404 an avatar (account deleted its image, or the hash went
 * stale between logins), and a broken <img> in the sidebar looks like the app is
 * broken. Fall back to the generic user mark instead.
 */
function Avatar({ profile, className }) {
  const [failed, setFailed] = useState(false)
  const showImage = profile?.avatarUrl && !failed

  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground/10 text-muted-foreground',
        className,
      )}
    >
      {showImage ? (
        <img
          src={profile.avatarUrl}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <User className="size-4" strokeWidth={2} />
      )}
    </div>
  )
}

function SidebarUser({ onOpenSettings }) {
  const { profile, isConfigured } = useAuth()

  // Guest is only reachable with sign-in switched off (no env vars) — the route
  // is gated otherwise. Keep the old resting state for that case.
  if (!profile) {
    return (
      <div className="flex items-center gap-3 rounded-md px-2 py-2">
        <Avatar profile={null} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">Guest</div>
          <div className="truncate text-xs text-muted-foreground">
            {isConfigured ? 'Not signed in' : 'Sign-in not configured'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onOpenSettings}
      title="Account settings"
      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-foreground/5"
    >
      <Avatar profile={profile} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{profile.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {profile.username ? `@${profile.username}` : profile.email}
        </div>
      </div>
      <Settings className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </button>
  )
}

function PageHeader({ kicker, title, children }) {
  return (
    <div>
      {kicker && (
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {kicker}
        </div>
      )}
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight">{title}</h1>
      {children}
    </div>
  )
}

function CardLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
      {Icon && <Icon className="size-4" strokeWidth={2} />}
      {children}
    </div>
  )
}

/* ---------------- Overview ---------------- */

function StatCard({ icon: Icon, label, value, sub, accent, onClick }) {
  const interactive = typeof onClick === 'function'
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'rounded-lg border border-border bg-card p-5 text-left shadow-sm',
        interactive &&
          'group cursor-pointer transition-colors hover:border-foreground/20 hover:bg-foreground/[0.02]',
      )}
    >
      <CardLabel icon={Icon}>{label}</CardLabel>
      <div
        className={cn(
          'mt-3 text-3xl font-semibold tabular-nums tracking-tight',
          accent && 'text-kick',
        )}
      >
        {value}
      </div>
      {sub && (
        <div
          className={cn(
            'mt-1.5 flex items-center gap-1 text-[13px] text-muted-foreground',
            interactive && 'transition-colors group-hover:text-foreground',
          )}
        >
          {sub}
          {interactive && (
            <ArrowUpRight
              className="size-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={2.25}
            />
          )}
        </div>
      )}
    </Tag>
  )
}

function Overview({ credits, exportCount, plan, navigate, setTab }) {
  const { profile } = useAuth()
  const allowance = PLAN_ALLOWANCE[plan] ?? PLAN_CREDITS
  const usedPct = allowance == null
    ? 0
    : Math.min(100, Math.round(((allowance - Math.min(credits, allowance)) / allowance) * 100))
  // Discord display names can be long; a full one would wrap the kicker onto a
  // second line, so greet with the first word only.
  const firstName = profile?.name?.split(' ')[0]
  return (
    <div className="space-y-8">
      <PageHeader kicker={firstName ? `Welcome back, ${firstName}` : 'Welcome back'} title="Your clip HQ">
        <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
          Turn a raw Kick moment into a ready-to-post clip in under a minute. Everything runs
          in your browser — your clips never leave your machine.
        </p>
      </PageHeader>

      {/* Focal card: how many clips you can make + the primary next action. */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="min-w-0">
            <CardLabel icon={Coins}>Credits this month</CardLabel>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="text-5xl font-semibold tabular-nums tracking-tight text-kick">
                {credits}
              </span>
              <span className="text-[15px] text-muted-foreground">
                clips you can make
              </span>
            </div>
            <div className="mt-4 max-w-xs">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full bg-kick transition-all"
                  style={{ width: `${allowance == null ? 100 : 100 - usedPct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {plan} plan · 1 credit per export
                {allowance != null && ' · resets monthly'}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2.5">
            <Button
              onClick={() => navigate('/editor')}
              className="h-11 px-6 text-sm font-semibold"
            >
              <Plus className="size-4" strokeWidth={2.5} /> New clip
            </Button>
            <button
              onClick={() => setTab('billing')}
              className="text-center text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Need more credits?
            </button>
          </div>
        </div>
      </div>

      {/* Secondary stats — meaningful, calm, no giant vanity numbers. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Clapperboard} label="Clips exported" value={exportCount} sub="All-time" />
        <StatCard
          icon={Crown}
          label="Current plan"
          value={plan}
          sub="Compare plans"
          onClick={() => setTab('billing')}
        />
        <StatCard
          icon={TrendingUp}
          label="Performance"
          value="—"
          sub={ANALYTICS_ENABLED ? 'View analytics' : 'Analytics — coming soon'}
          onClick={() => setTab('analytics')}
        />
      </div>

      {/* Discord + recent exports */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#5865F2]/12 text-[#5865F2]">
            <Gift className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold">Get 5 free credits</div>
            <div className="text-[13px] text-muted-foreground">Join the KickSnap Discord.</div>
          </div>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="h-11 px-3.5 text-sm font-medium">
              <DiscordIcon className="size-4" /> Join
            </Button>
          </a>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <CardLabel icon={Download}>Recent exports</CardLabel>
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <Clapperboard className="size-7 text-muted-foreground/40" strokeWidth={1.75} />
            <p className="text-[13px] text-muted-foreground">
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
  { title: 'the reaction', streamer: 'Cheesur', format: '9:16', views: 92000 },
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
    <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#53fc18" stopOpacity="0.22" />
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
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <CardLabel icon={Icon}>{label}</CardLabel>
      <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      <div
        className={cn(
          'mt-1.5 flex items-center gap-1 text-[13px] font-medium',
          up ? 'text-kick' : 'text-red-400',
        )}
      >
        {up ? (
          <TrendingUp className="size-3.5" strokeWidth={2.25} />
        ) : (
          <TrendingDown className="size-3.5" strokeWidth={2.25} />
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
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.07]">
        <div className="h-full rounded-full bg-kick" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/**
 * Analytics is built but gated (see ANALYTICS_ENABLED). Real numbers need TikTok
 * API access to attribute views back to a clip; until then there is nothing
 * truthful to show.
 *
 * The finished dashboard sits behind this as a blurred, inert backdrop — it's
 * deliberately unreadable and aria-hidden so its sample figures can't be
 * mistaken for the user's own, while still showing that the feature is real.
 */
function AnalyticsComingSoon() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Analytics" title="Know what's landing" />

      <div className="relative overflow-hidden rounded-lg border border-border">
        {/* `inert` as well as aria-hidden: pointer-events only stops the mouse,
            so without it the sample dashboard's controls stay reachable by Tab —
            focusable content inside aria-hidden is an accessibility violation. */}
        <div
          aria-hidden
          inert
          className="pointer-events-none select-none blur-[6px] saturate-50"
        >
          <div className="p-6 opacity-40">
            <Analytics />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-background/70 p-6 backdrop-blur-[2px]">
          <div className="max-w-md text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-kick/15 text-kick">
              <Lock className="size-6" strokeWidth={2} />
            </span>
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              Analytics is coming soon
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Tracking views and earnings per clip needs TikTok API access, which we
              don&apos;t have yet. Rather than show you numbers we made up, we&apos;re
              keeping this shut until it can tell you the truth.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Your exports still work — nothing else is affected
            </p>
          </div>
        </div>
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
        <PageHeader kicker="Analytics" title="Know what's landing" />
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Sample data
          </span>
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            {[7, 14].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                  days === d ? 'bg-kick text-black' : 'text-muted-foreground hover:text-foreground',
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
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <CardLabel>Views over time</CardLabel>
          <div className="flex items-center gap-1 rounded-md bg-kick/10 px-2.5 py-1 text-[13px] font-medium text-kick">
            <TrendingUp className="size-4" strokeWidth={2.25} /> Climbing
          </div>
        </div>
        <div className="overflow-hidden rounded-md border border-border bg-background/50 p-3">
          <ViewsChart data={series} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{days}d ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <CardLabel icon={Users}>Top streamers by views</CardLabel>
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

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <CardLabel icon={ChartColumnBig}>Best format</CardLabel>
          </div>
          <div className="space-y-3">
            {FORMAT_SPLIT.map((f) => (
              <BarRow key={f.name} label={f.name} value={`${f.pct}%`} pct={f.pct} />
            ))}
          </div>
        </div>
      </div>

      {/* Top clips */}
      <div className="overflow-hidden rounded-lg border border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-5 py-3 text-[12px] font-medium text-muted-foreground">Clip</th>
                <th className="px-5 py-3 text-[12px] font-medium text-muted-foreground">Streamer</th>
                <th className="px-5 py-3 text-center text-[12px] font-medium text-muted-foreground">Format</th>
                <th className="px-5 py-3 text-right text-[12px] font-medium text-muted-foreground">Views</th>
                <th className="px-5 py-3 text-right text-[12px] font-medium text-muted-foreground">Est. $</th>
              </tr>
            </thead>
            <tbody>
              {TOP_CLIPS.map((c) => (
                <tr key={c.title} className="border-b border-border/60 bg-card last:border-0">
                  <td className="px-5 py-3 text-[13px] font-medium">{c.title}</td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{c.streamer}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {c.format}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-[13px] tabular-nums">{fmtViews(c.views)}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-semibold tabular-nums text-kick">
                    ${earningsFor(c.views)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground">
        These are sample numbers to show the layout. Your real views and earnings appear here
        once clip tracking launches.
      </p>
    </div>
  )
}

/* ---------------- Billing ---------------- */

// Display copy for the two subscription tiers. Prices and Stripe price IDs come
// from lib/pricing so the buttons can't drift from what Stripe actually charges.
const PLAN_COPY = {
  pro: { tagline: 'Most popular', credits: '150 credits / month + rollover', highlight: true },
  agency: { tagline: 'For serious clippers', credits: 'Unlimited credits + every feature', highlight: false },
}

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
    return <Check className="mx-auto size-[18px] text-kick" strokeWidth={2.5} />
  if (value === false)
    return <X className="mx-auto size-[18px] text-muted-foreground/40" strokeWidth={2.25} />
  return <span className="text-[13px] font-semibold text-foreground">{value}</span>
}

function Billing({ credits, plan }) {
  const [yearly, setYearly] = useState(false)
  const { startCheckout } = useAuth()
  // Which price is mid-redirect, so only the clicked button shows a spinner.
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  async function buy(priceId) {
    setError(null)
    setPending(priceId)
    track('checkout_started', { price_id: priceId })
    try {
      // Leaves the site for Stripe, so `pending` stays set until navigation.
      window.location.href = await startCheckout(priceId)
    } catch (err) {
      console.error('[KickSnap] checkout failed', err)
      setError('Could not open checkout. Please try again.')
      setPending(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader kicker="Billing" title="Plan & credits" />

      {/* Current plan */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <CardLabel>Current plan</CardLabel>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight">{plan}</div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            {credits} credits left · resets monthly
          </div>
        </div>
      </div>

      {/* Billing-period toggle */}
      <div className="flex">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setYearly(false)}
            className={cn(
              'rounded-md px-5 py-2 text-[13px] font-medium transition-colors',
              !yearly ? 'bg-kick text-black' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn(
              'flex items-center gap-2 rounded-md px-5 py-2 text-[13px] font-medium transition-colors',
              yearly ? 'bg-kick text-black' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Yearly
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[11px] font-semibold',
                yearly ? 'bg-black/20 text-black' : 'bg-kick/12 text-kick',
              )}
            >
              2 months free
            </span>
          </button>
        </div>
      </div>

      {/* Subscription plans */}
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((p) => {
          const copy = PLAN_COPY[p.id]
          const tier = yearly ? p.yearly : p.monthly
          // Show the yearly deal as its effective monthly rate — $12.50/mo reads
          // as better value than $150/yr, and it's the same number.
          const perMonth = yearly ? tier.price / 12 : tier.price
          const current = plan.toLowerCase() === p.id
          return (
            <div
              key={p.id}
              className={cn(
                'relative flex flex-col rounded-xl border p-6 shadow-sm',
                copy.highlight ? 'border-kick/60 bg-card ring-1 ring-kick/20' : 'border-border bg-card',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-muted-foreground">{copy.tagline}</span>
                {copy.highlight && (
                  <span className="rounded-full bg-kick px-2.5 py-0.5 text-[11px] font-semibold text-black">
                    Recommended
                  </span>
                )}
              </div>
              <div className="mt-2 text-xl font-semibold tracking-tight">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tabular-nums tracking-tight">
                  ${perMonth % 1 === 0 ? perMonth : perMonth.toFixed(2)}
                </span>
                <span className="text-[13px] text-muted-foreground">/mo</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {yearly ? `$${tier.price} billed yearly` : 'billed monthly'}
              </div>
              <div className="mt-2 flex-1 text-[13px] text-muted-foreground">{copy.credits}</div>
              <InteractiveHoverButton
                onClick={() => buy(tier.priceId)}
                disabled={current || pending !== null}
                text={
                  current
                    ? 'Current plan'
                    : pending === tier.priceId
                      ? 'Opening checkout…'
                      : `Upgrade to ${p.name}`
                }
                className="mt-5 h-11 w-full rounded-none border-2 py-0 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
              />
            </div>
          )
        })}
      </div>

      {/* Credit packs */}
      <div>
        <div className="mb-3 text-[13px] font-medium text-muted-foreground">
          Top up your credits — one-time, no subscription
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 shadow-sm"
            >
              <div>
                <div className="text-[15px] font-semibold">{pack.name}</div>
                <div className="text-[13px] text-muted-foreground">{pack.credits} credits</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold tabular-nums tracking-tight">${pack.price}</span>
                <InteractiveHoverButton
                  onClick={() => buy(pack.priceId)}
                  disabled={pending !== null}
                  text={pending === pack.priceId ? 'Opening…' : 'Buy'}
                  className="h-11 w-24 rounded-none border-2 py-0 text-xs font-medium disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
            </div>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-[13px] font-medium text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Pro vs Agency comparison */}
      <div className="overflow-hidden rounded-lg border border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-5 py-3.5 text-[12px] font-medium text-muted-foreground">Feature</th>
                <th className="px-5 py-3.5 text-center text-[12px] font-medium text-foreground">Pro</th>
                <th className="px-5 py-3.5 text-center text-[12px] font-medium text-kick">Agency</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-border/60 bg-card last:border-0">
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{row.label}</td>
                  <td className="px-5 py-3 text-center">
                    <CompareCell value={row.pro} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <CompareCell value={row.agency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground">
        Payments are handled by Stripe — your card details never touch KickSnap.
      </p>
    </div>
  )
}

/* ---------------- Settings ---------------- */

function SettingRow({ title, desc, action }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="min-w-0">
        <div className="text-[15px] font-semibold">{title}</div>
        <div className="text-[13px] text-muted-foreground">{desc}</div>
      </div>
      {action}
    </div>
  )
}

function SettingsTab() {
  const { profile, isConfigured, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader kicker="Settings" title="Account" />

      <div className="space-y-3">
        <SettingRow
          title="Discord sign-in"
          desc={
            profile
              ? `Connected as ${profile.username ? `@${profile.username}` : profile.name}.`
              : 'Connect your Discord to sync credits across devices.'
          }
          action={
            profile ? (
              <div className="flex shrink-0 items-center gap-2 rounded-md border border-kick/40 bg-kick/10 px-3.5 py-2 text-[13px] font-medium text-kick">
                <Check className="size-3.5" strokeWidth={2.5} /> Connected
              </div>
            ) : isConfigured ? (
              <Button
                onClick={() => navigate('/signin?next=/dashboard')}
                variant="outline"
                className="h-11 shrink-0 text-sm font-medium"
              >
                <DiscordIcon className="size-4" /> Connect
              </Button>
            ) : (
              <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3.5 py-2 text-[13px] text-muted-foreground">
                <Lock className="size-3.5" /> Soon
              </div>
            )
          }
        />
        <SettingRow
          title="Export defaults"
          desc="Set a default format, overlay position and caption style."
          action={
            <span className="shrink-0 text-[13px] text-muted-foreground">Soon</span>
          }
        />
        <SettingRow
          title="Sign out"
          desc="End your session on this device."
          action={
            <Button
              variant="outline"
              disabled={!profile || signingOut}
              onClick={handleSignOut}
              className={cn(
                'h-11 shrink-0 text-sm font-medium',
                !profile && 'cursor-not-allowed',
              )}
            >
              <LogOut className="size-4" /> {signingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          }
        />
      </div>

      <Link
        to="/"
        state={{ stayOnLanding: true }}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Back to site <ChevronRight className="size-3.5" />
      </Link>
    </div>
  )
}
