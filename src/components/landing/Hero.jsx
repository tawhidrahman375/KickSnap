import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

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

export default function Hero() {
  const navigate = useNavigate()
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Green-to-black gradient backdrop, top to bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(to bottom, rgba(83,252,24,0.55) 0%, rgba(83,252,24,0.22) 22%, rgba(83,252,24,0.06) 40%, rgba(0,0,0,0) 62%)',
        }}
      />
      {/* Faint grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
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
          built for{' '}
          <span className="text-kick">Kick clippers.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-8 max-w-xl text-lg font-medium text-muted-foreground sm:text-xl"
        >
          From raw clip to submission-ready in under 60 seconds. Your only
          bottleneck is finding the moment.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <Button
            size="lg"
            onClick={() => navigate('/editor')}
            className="h-14 rounded-none bg-kick px-8 text-base font-bold tracking-wide text-black uppercase hover:bg-kick-hover"
          >
            Get Started Free
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-14 rounded-none border-2 px-8 text-base font-bold tracking-wide uppercase"
          >
            Watch Demo
          </Button>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-10 font-display text-4xl font-bold uppercase tracking-tight text-foreground"
          style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
        >
          Clip smarter. Earn more.
        </motion.div>
      </motion.div>
    </section>
  )
}
