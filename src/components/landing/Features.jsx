import {
  Crop,
  Sparkles,
  Users,
  Shield,
  Type,
  ChartColumnBig,
} from 'lucide-react'
import Reveal from './Reveal'
import Eyebrow from './Eyebrow'

const FEATURES = [
  {
    icon: Crop,
    title: 'One-click formatting',
    body: '9:16, split, square. The correct Kick overlay applied per streamer, automatically.',
  },
  {
    icon: Sparkles,
    title: 'Blur or zoom',
    body: 'Pick your style, one click, done. No timeline fiddling, no guesswork.',
  },
  {
    icon: Users,
    title: 'Streamer selector',
    body: 'Face grid, search, favourites. Auto-fills your overlay text instantly.',
  },
  {
    icon: Shield,
    title: 'Dead zone protection',
    body: 'Overlay placement warnings so your clip never gets rejected by the program.',
  },
  {
    icon: Type,
    title: 'TikTok-style text',
    body: 'Bold white, black outline, auto line wrap. Looks right every single time.',
  },
  {
    icon: ChartColumnBig,
    title: 'Analytics',
    body: 'Track views and see which streamers and formats make you the most.',
  },
]

export default function Features() {
  return (
    <section id="features" className="border-t border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-3xl">
          <Eyebrow>The toolkit</Eyebrow>
          <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[0.9] tracking-tight text-foreground">
            Everything you need.
            <br />
            <span className="text-muted-foreground">Nothing you don't.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <Reveal
                key={feature.title}
                delay={(i % 3) * 0.08}
                className="group relative bg-background p-8 transition-colors hover:bg-card"
              >
                <span className="absolute right-6 top-6 font-mono text-xs font-bold text-border">
                  0{i + 1}
                </span>
                <div className="flex size-12 items-center justify-center rounded-lg bg-kick/10 text-kick transition-transform group-hover:scale-110">
                  <Icon className="size-6" strokeWidth={2.5} />
                </div>
                <h3 className="mt-6 text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
