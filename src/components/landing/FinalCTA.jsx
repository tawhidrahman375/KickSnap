import { motion } from 'motion/react'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-kick py-24 text-black">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(3rem,9vw,7rem)] uppercase leading-[0.85] tracking-tight"
        >
          Start clipping
          <br />
          smarter.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 font-mono text-sm font-bold uppercase tracking-[0.2em] text-black/70"
        >
          Clip smarter. Earn more. Built by a clipper, for clippers.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10"
        >
          <InteractiveHoverButton
            text="Get Started Free"
            className="h-14 w-auto rounded-none border-2 border-black/20 bg-black px-10 py-0 text-base font-bold uppercase tracking-wide text-white [&_svg]:text-white"
          />
        </motion.div>
      </div>
    </section>
  )
}
