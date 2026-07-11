import { cn } from '@/lib/utils'

/**
 * KickSnap wordmark. "Kick" in brand green, "Snap" in foreground.
 */
export default function Logo({ className }) {
  return (
    <span
      className={cn(
        'text-2xl font-extrabold tracking-tight select-none',
        className,
      )}
    >
      <span className="text-kick">Kick</span>
      <span className="text-foreground">Snap</span>
    </span>
  )
}
