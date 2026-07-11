import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Reveal from './Reveal'
import Eyebrow from './Eyebrow'

const FAQS = [
  {
    q: 'Will this get my TikTok account shadowbanned?',
    a: 'No. KickSnap exports a standard MP4 file. TikTok never sees the tool — you upload manually, just like you do now.',
  },
  {
    q: 'Is this allowed by the Kick clipping program?',
    a: 'Yes. KickSnap is designed to help you follow program overlay rules correctly, reducing the chance of rejection.',
  },
  {
    q: 'Does my clip get stored on your servers?',
    a: 'No. All video processing happens entirely in your browser using WebCodecs. Your clips never leave your device or get uploaded to our servers.',
  },
  {
    q: 'What formats does it support?',
    a: '9:16 full screen, 9:16 split video, and 1:1 square — all three formats used in the program.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Chrome and Edge on Android work. Safari is not supported. Desktop gives the best experience.',
  },
  {
    q: 'What happens if I run out of credits?',
    a: 'Top up with a one-time credit pack or upgrade your plan. Credits never expire on paid plans.',
  },
  {
    q: 'Is the Kick overlay placement correct?',
    a: 'Yes. KickSnap auto-places the watermark within the program guidelines and warns you if you drag it into a rejected zone.',
  },
  {
    q: 'Can I use this for multiple streamers?',
    a: 'Yes. The streamer selector lets you switch between any creator in the program instantly, with saved favourites for your most-clipped streamers.',
  },
]

function Item({ faq, open, onToggle }) {
  return (
    <div className="border-b-2 border-border">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-lg font-bold text-foreground">{faq.q}</span>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-kick transition-transform duration-300',
            open && 'rotate-180',
          )}
          strokeWidth={2.5}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-10 text-muted-foreground">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" className="border-t-2 border-border py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[0.9] tracking-tight text-foreground">
            Questions? Answered.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-12 border-t-2 border-border">
          {FAQS.map((faq, i) => (
            <Item
              key={faq.q}
              faq={faq}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </Reveal>
      </div>
    </section>
  )
}
