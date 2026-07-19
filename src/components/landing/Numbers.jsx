import Reveal from './Reveal'
import CountUp from './CountUp'

const STATS = [
  { render: <CountUp to={72} />, label: 'Kick streamers, overlays built in', kick: true },
  { render: <CountUp to={800} prefix="$" />, label: 'Per 1M views in the program', kick: true },
  {
    render: <CountUp to={47} suffix="s" />,
    label: 'Per clip vs 5 min in CapCut',
    kick: false,
  },
]

export default function Numbers() {
  return (
    <section className="border-t border-border py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl divide-y divide-border px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {STATS.map((stat, i) => (
          <Reveal key={i} delay={i * 0.1} className="px-4 py-8 text-center sm:py-0">
            <div
              className={`font-display text-[clamp(4rem,10vw,8rem)] leading-none tracking-tight ${
                stat.kick ? 'text-kick' : 'text-foreground'
              }`}
            >
              {stat.render}
            </div>
            <p className="mt-3 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
