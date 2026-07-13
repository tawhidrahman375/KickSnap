import { cn } from '@/lib/utils'

/**
 * KickSnap wordmark — the real brand lockup (icon + "KickSnap"), keyed to a
 * transparent background so it blends on any dark surface. Size it with a height
 * utility (e.g. `h-9`); width scales automatically.
 */
export default function Logo({ className }) {
  return (
    <img
      src="/wordmark.png"
      alt="KickSnap"
      draggable={false}
      className={cn('h-7 w-auto select-none', className)}
    />
  )
}
