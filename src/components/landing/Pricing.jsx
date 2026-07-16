import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Reveal from './Reveal'
import Eyebrow from './Eyebrow'

const TIERS = [
  {
    name: 'Free',
    monthly: 0,
    yearly: 0,
    tagline: 'Try it out',
    credits: '10 credits / month',
    cta: 'Get Started',
    highlight: false,
    features: [
      'All three formats',
      'Streamer selector',
      'Dead zone protection',
      '1 saved template',
      'Basic analytics (7 days)',
    ],
  },
  {
    name: 'Pro',
    monthly: 15,
    yearly: 12.5,
    tagline: 'Most Popular',
    credits: '150 credits / month + rollover',
    cta: 'Go Pro',
    highlight: true,
    features: [
      'Everything in Free',
      'Unlimited templates',
      'Credit rollover',
      'Full analytics history',
      'Streamer & format breakdowns',
    ],
  },
  {
    name: 'Agency',
    monthly: 150,
    yearly: 125,
    tagline: 'For serious clippers',
    credits: 'Unlimited credits',
    cta: 'Go Agency',
    highlight: false,
    features: [
      'Everything in Pro',
      'Auto-post to TikTok / Shorts / Reels',
      'Batch processing',
      'Team accounts',
      'Shareable templates',
      'Exportable PDF reports',
    ],
  },
]

const PACKS = [
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

function Cell({ value }) {
  if (value === true)
    return <Check className="mx-auto size-5 text-kick" strokeWidth={3} />
  if (value === false)
    return <X className="mx-auto size-5 text-muted-foreground/40" strokeWidth={2.5} />
  return <span className="text-sm font-bold text-foreground">{value}</span>
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="border-t-2 border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-3xl">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[0.9] tracking-tight text-foreground">
            Priced in USD.
            <br />
            Because you earn in USD.
          </h2>
        </Reveal>

        {/* Toggle */}
        <Reveal delay={0.05} className="mt-10 flex">
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
        </Reveal>

        {/* Tier cards */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier, i) => {
            const price = yearly ? tier.yearly : tier.monthly
            return (
              <Reveal
                key={tier.name}
                delay={i * 0.08}
                className={cn(
                  'relative flex flex-col rounded-xl border p-10',
                  tier.highlight
                    ? 'border-kick/60 bg-card ring-1 ring-kick/20'
                    : 'border-border bg-background',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {tier.tagline}
                  </span>
                  {tier.highlight && (
                    <span className="rounded-full bg-kick px-2.5 py-0.5 text-[11px] font-semibold text-black">
                      Recommended
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-display text-3xl uppercase leading-none text-foreground">
                  {tier.name}
                </h3>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-5xl leading-none text-foreground">
                    ${price}
                  </span>
                  {tier.monthly > 0 && (
                    <span className="font-mono text-sm text-muted-foreground">/mo</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{tier.credits}</p>

                <Button
                  className={cn(
                    'mt-6 h-12 font-bold uppercase tracking-wide',
                    tier.highlight ? 'bg-kick text-black hover:bg-kick-hover' : '',
                  )}
                  variant={tier.highlight ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>

                <ul className="mt-8 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-kick" strokeWidth={3} />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )
          })}
        </div>

        {/* Top-up packs */}
        <Reveal className="mt-8">
          <div className="border-2 border-border bg-card/30 p-6">
            <div className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Top up your credits — one-time, no subscription
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {PACKS.map((pack) => (
                <div
                  key={pack.name}
                  className="flex items-center justify-between border-2 border-border bg-background/40 px-5 py-4"
                >
                  <div>
                    <div className="font-bold text-foreground">{pack.name}</div>
                    <div className="text-sm text-muted-foreground">{pack.credits}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl leading-none text-foreground">
                      ${pack.price}
                    </span>
                    <Button variant="outline" size="sm" className="font-bold uppercase">
                      Buy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Comparison table */}
        <Reveal className="mt-8">
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
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {row.label}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Cell value={row.pro} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Cell value={row.agency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
