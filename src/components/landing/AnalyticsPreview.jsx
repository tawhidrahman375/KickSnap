import { motion, useReducedMotion } from 'motion/react'
import { TrendingUp, ArrowUpRight } from 'lucide-react'
import Reveal from './Reveal'
import CountUp from './CountUp'
import Eyebrow from './Eyebrow'

const BULLETS = [
  'Views over time, per clip',
  'Best streamer breakdown',
  'Best format breakdown',
  'Estimated earnings in real time',
]

const STATS = [
  { label: 'Views this week', value: 124, suffix: 'K', note: '↑ 340% vs your average' },
  { label: 'Clips exported', value: 23, suffix: '', note: 'About the same as usual' },
  { label: 'Est. earnings', value: 67, prefix: '$', note: '↑ Your best month yet' },
]

// A gentle upward line for the mock chart
const CHART_PATH =
  'M0,110 C40,100 70,95 100,80 C140,60 170,72 210,50 C250,30 290,40 330,22 C360,10 380,14 400,6'

export default function AnalyticsPreview() {
  const reduce = useReducedMotion()
  return (
    <section className="border-t border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-3xl">
          <Eyebrow>Analytics</Eyebrow>
          <h2 className="font-display text-[clamp(2.25rem,5vw,4rem)] uppercase leading-[0.9] tracking-tight text-foreground">
            The Kick dashboard tells you what you earned.
            <br />
            <span className="text-kick">KickSnap tells you why.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Dashboard mockup */}
          <Reveal className="rounded-xl border-2 border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Total views
                </div>
                <div className="font-display text-4xl leading-none text-foreground">
                  <CountUp to={1240000} />
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-kick/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide text-kick">
                <TrendingUp className="size-4" strokeWidth={2.5} /> Climbing
              </div>
            </div>

            {/* Chart */}
            <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-background/50 p-3">
              <svg
                viewBox="0 0 400 120"
                className="h-full w-full"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#53fc18" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#53fc18" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  d={`${CHART_PATH} L400,120 L0,120 Z`}
                  fill="url(#chartFill)"
                  initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.6 }}
                />
                <motion.path
                  d={CHART_PATH}
                  fill="none"
                  stroke="#53fc18"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduce ? 0 : 1.4, ease: 'easeInOut' }}
                />
              </svg>
            </div>

            {/* Stat tiles */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-background/50 p-3">
                  <div className="truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-1 font-display text-2xl leading-none text-foreground">
                    <CountUp to={s.value} prefix={s.prefix} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 flex items-center gap-0.5 text-[11px] font-medium text-kick">
                    {s.note}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Bullets */}
          <div className="space-y-4">
            {BULLETS.map((b, i) => (
              <Reveal
                key={b}
                delay={i * 0.1}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-5 py-4"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-kick/10 text-kick">
                  <ArrowUpRight className="size-4" strokeWidth={2.5} />
                </div>
                <span className="font-medium text-foreground">{b}</span>
              </Reveal>
            ))}
            <Reveal delay={0.4} className="pt-2 text-sm text-muted-foreground">
              Clippers open KickSnap just to check this — even on days they
              don't clip.
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
