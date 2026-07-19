import { Upload, Wand2, Rocket, ChevronRight } from 'lucide-react'
import Reveal from './Reveal'
import Eyebrow from './Eyebrow'

const STEPS = [
  {
    icon: Upload,
    step: '01',
    title: 'Drop your clip',
    body: 'Drag and drop. WebCodecs loads it instantly, right in your browser.',
  },
  {
    icon: Wand2,
    step: '02',
    title: 'Format, streamer, text',
    body: 'Pick a format, choose the streamer, add your caption. Overlay auto-fills.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Export and post',
    body: 'One click. Perfect quality, submission-ready, in under 60 seconds.',
  },
]

export default function HowItWorks() {
  return (
    <section className="border-t border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-3xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[0.9] tracking-tight text-foreground">
            Three steps.
            <br />
            Under 60 seconds.
          </h2>
        </Reveal>

        <div className="mt-14 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.step} className="flex flex-1 items-stretch">
                <Reveal delay={i * 0.12} className="flex-1 border-2 border-border p-8">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-kick/10 text-kick">
                    <Icon className="size-6" strokeWidth={2.5} />
                  </div>
                  <div className="mt-8 flex items-baseline gap-3">
                    <span className="font-display text-2xl leading-none text-kick">
                      {step.step}
                    </span>
                    <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-muted-foreground">{step.body}</p>
                </Reveal>
                {i < STEPS.length - 1 && (
                  <div
                    aria-hidden
                    className="hidden shrink-0 items-center justify-center px-2 md:flex"
                  >
                    <ChevronRight className="size-6 text-border" strokeWidth={2.5} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
