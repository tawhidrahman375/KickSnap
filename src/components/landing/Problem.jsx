import { Timer, X, Clock } from 'lucide-react'
import Reveal from './Reveal'
import Eyebrow from './Eyebrow'

const PAINS = [
  {
    icon: Timer,
    title: '5 minutes per clip. Manually.',
    body: 'Import, trim, overlay, watermark, export, upload. Every single clip, every single time.',
  },
  {
    icon: X,
    title: 'Wrong overlay = rejected clip.',
    body: 'One misplaced watermark and the program rejects your clip. That is earnings gone.',
  },
  {
    icon: Clock,
    title: 'Three platforms. Three uploads.',
    body: 'TikTok, Shorts, Reels — uploaded by hand, one by one. Hours wasted every week.',
  },
]

export default function Problem() {
  return (
    <section className="relative border-t border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-3xl">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[0.9] tracking-tight text-foreground">
            CapCut is killing
            <br />
            your time.
          </h2>
          <p className="mt-5 max-w-xl text-lg font-medium text-muted-foreground">
            More clips. More views. More money — the tool shouldn't be the thing
            slowing you down.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {PAINS.map((pain, i) => {
            const Icon = pain.icon
            return (
              <Reveal
                key={pain.title}
                delay={i * 0.1}
                className="group bg-background p-8 transition-colors hover:bg-card"
              >
                <div className="flex size-12 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 text-destructive">
                  <Icon className="size-6" strokeWidth={2.5} />
                </div>
                <h3 className="mt-6 text-xl font-bold text-foreground">
                  {pain.title}
                </h3>
                <p className="mt-3 text-muted-foreground">{pain.body}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
