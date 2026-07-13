/**
 * CapCut-style "split" glyph: a clip divided into two panels by a dashed cut
 * line, with a blade marker on top — reads as "split the clip here" (replaces
 * the generic scissors). Matches lucide's stroke API (className + strokeWidth).
 */
export default function SplitIcon({ className, strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* left + right clip panels */}
      <rect x="3" y="7.5" width="6.5" height="9" rx="1.5" />
      <rect x="14.5" y="7.5" width="6.5" height="9" rx="1.5" />
      {/* dashed cut line down the middle */}
      <path d="M12 4.5v15" strokeDasharray="2.2 2.2" />
      {/* blade marker at the top of the cut */}
      <path d="M10.4 4.2 12 6.4l1.6-2.2z" fill="currentColor" stroke="none" />
    </svg>
  )
}
