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

        <div className="mt-14 divide-y divide-border border-y border-border">
          {PAINS.map((pain, i) => {
            const Icon = pain.icon
            return (
              <Reveal
                key={pain.title}
                delay={i * 0.1}
                className="flex flex-col gap-4 py-8 sm:flex-row sm:items-start sm:gap-8"
              >
                <div className="flex shrink-0 items-center gap-4 sm:w-80">
                  <Icon className="size-6 shrink-0 text-destructive" strokeWidth={2.5} />
                  <h3 className="text-xl font-bold text-foreground">{pain.title}</h3>
                </div>
                <p className="text-muted-foreground sm:flex-1 sm:pt-0.5">{pain.body}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
