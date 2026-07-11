import { Upload, Wand2, Rocket } from 'lucide-react'
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
    <section className="border-t-2 border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-3xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[0.9] tracking-tight text-foreground">
            Three steps.
            <br />
            Under 60 seconds.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border-2 border-border bg-border md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <Reveal
                key={step.step}
                delay={i * 0.12}
                className="relative bg-background p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-6xl leading-none text-border">
                    {step.step}
                  </span>
                  <div className="flex size-12 items-center justify-center bg-kick/10 text-kick">
                    <Icon className="size-6" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="mt-8 text-xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-muted-foreground">{step.body}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
