import { motion, useReducedMotion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Check, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

const slamIn = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const TRUST = [
  'No upload — runs in your browser',
  'No export watermark',
  'Works in Chrome & Edge',
]

export default function Hero() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Faint grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <motion.div
        variants={container}
        initial={reduce ? 'show' : 'hidden'}
        animate="show"
        className="mx-auto w-full max-w-6xl px-6"
      >
        <motion.div
          variants={fadeUp}
          className="mb-6 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground"
        >
          <span className="size-2 bg-kick" />
          Built by a clipper. For clippers.
        </motion.div>

        <motion.h1
          variants={slamIn}
          className="font-display text-[clamp(3.25rem,11vw,9rem)] uppercase leading-[0.86] tracking-[-0.02em] text-foreground"
        >
          The clip editor
          <br />
          built for <span className="text-kick">Kick clippers.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-8 max-w-xl text-lg font-medium text-muted-foreground sm:text-xl"
        >
          From raw clip to submission-ready in under 60 seconds. Your only
          bottleneck is finding the moment.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <InteractiveHoverButton
            text="Get started free"
            onClick={() => navigate('/editor')}
            className="h-14 w-auto rounded-none border-2 px-8 py-0 text-base font-bold tracking-wide uppercase"
          />
          <Button
            variant="outline"
            size="lg"
            onClick={scrollToDemo}
            className="h-14 border-2 px-8 text-base font-bold tracking-wide uppercase"
          >
            <Play className="size-4 fill-current" strokeWidth={0} />
            See how it works
          </Button>
        </motion.div>

        {/* Trust row — real product signals instead of a second headline. */}
        <motion.ul
          variants={fadeUp}
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm font-medium text-muted-foreground"
        >
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-kick" strokeWidth={3} />
              {t}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  )
}
