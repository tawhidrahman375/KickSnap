import { motion, useReducedMotion } from 'motion/react'

/**
 * Fade + slide-up on scroll into view. Fires once.
 * Respects prefers-reduced-motion: renders content in place, no animation.
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
  const reduce = useReducedMotion()
  return (
    <MotionTag
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-140px' }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  )
}
