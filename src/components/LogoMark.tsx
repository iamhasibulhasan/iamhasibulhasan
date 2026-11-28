import { useId } from "react"

/**
 * The H mark: one ribbon of even width (two stems and a bar, flat-cut ends,
 * smooth inside curves), with a bevelled face and deep solid sides. Its
 * colours come from the accent (so it follows the customizer): the face runs
 * from a deep shade to the accent to a light shade, the sides are the darkest.
 *
 * `animated`: it draws itself when it appears (a glowing line traces the
 * ribbon, then the face and sides fill in) and again on hover of a `.group`
 * parent. Off for reduced motion (globals.css).
 *
 * The same drawing, in the default green, is public/favicon.svg.
 */
export const RIBBON_H =
  "M19 10 H35 Q39 10 39 14 V29 Q39 39 49 39 H51 Q61 39 61 29 V14 Q61 10 65 10 H81 Q85 10 85 14 V77 Q85 81 81 81 H65 Q61 81 61 77 V69 Q61 59 51 59 H49 Q39 59 39 69 V77 Q39 81 35 81 H19 Q15 81 15 77 V14 Q15 10 19 10 Z"

/** How deep the 3D sides go, and how far they lean right per step. */
const DEPTH = 14
const LEAN = 0.18

export default function LogoMark({ size = 24, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  const id = useId().replace(/:/g, "")
  const ribbon = `${id}-ribbon`
  const inside = `${id}-inside`
  const face = `${id}-face`
  const rim = `${id}-rim`
  const side = `${id}-side`

  const sides = []
  for (let k = DEPTH; k >= 1; k--) {
    sides.push(<use key={k} href={`#${ribbon}`} fill={`url(#${side})`} transform={`translate(${(k * LEAN).toFixed(2)} ${k})`} />)
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="8 6 84 92"
      className={["logo-mark", animated ? "logo-mark--draw" : "", className].filter(Boolean).join(" ")}
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      <defs>
        <path id={ribbon} pathLength={100} d={RIBBON_H} />
        <clipPath id={inside}>
          <use href={`#${ribbon}`} />
        </clipPath>
        <linearGradient id={face} gradientUnits="userSpaceOnUse" x1="15" y1="81" x2="85" y2="10">
          <stop offset="0" style={{ stopColor: "var(--guide-ears)" }} />
          <stop offset="0.45" style={{ stopColor: "hsl(var(--primary))" }} />
          <stop offset="1" style={{ stopColor: "hsl(var(--accent-light))" }} />
        </linearGradient>
        <linearGradient id={rim} gradientUnits="userSpaceOnUse" x1="15" y1="81" x2="85" y2="10">
          <stop offset="0" style={{ stopColor: "hsl(var(--accent-light))" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, hsl(var(--accent-light)) 30%, white)" }} />
        </linearGradient>
        <linearGradient id={side} gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="96">
          <stop offset="0" style={{ stopColor: "hsl(var(--accent-dark))" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, hsl(var(--accent-dark)) 45%, black)" }} />
        </linearGradient>
      </defs>
      <g className="logo-mark__solid">
        {sides}
        <use href={`#${ribbon}`} fill={`url(#${face})`} />
        {/* The bevel: a darker groove just inside the edge, then a light rim and its bright edge line. */}
        <g clipPath={`url(#${inside})`}>
          <use href={`#${ribbon}`} fill="none" stroke="#000" strokeWidth="10" strokeOpacity="0.18" />
          <use href={`#${ribbon}`} fill="none" stroke={`url(#${face})`} strokeWidth="8.4" />
          <use href={`#${ribbon}`} fill="none" stroke={`url(#${rim})`} strokeWidth="7" strokeOpacity="0.5" />
          <use href={`#${ribbon}`} fill="none" stroke={`url(#${rim})`} strokeWidth="2.2" strokeOpacity="0.95" />
        </g>
      </g>
      {animated && <use href={`#${ribbon}`} className="logo-mark__trace" />}
    </svg>
  )
}
