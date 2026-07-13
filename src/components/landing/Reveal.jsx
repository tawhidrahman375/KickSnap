import { motion } from 'motion/react'

/**
 * Fade + slide-up on scroll into view. Fires once.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = 'div',
  ...props
}) {
  const MotionTag = motion[as] ?? motion.div
  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-140px' }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  )
}
