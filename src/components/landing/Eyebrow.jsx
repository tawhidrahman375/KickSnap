import { cn } from '@/lib/utils'

/**
 * Editorial section tag — uppercase mono with a green slash. Sets the
 * "built by a clipper, not a template" tone.
 */
export default function Eyebrow({ children, className }) {
  return (
    <div
      className={cn(
        'mb-5 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground',
        className,
      )}
    >
      <span className="text-kick">//</span>
      {children}
    </div>
  )
}
