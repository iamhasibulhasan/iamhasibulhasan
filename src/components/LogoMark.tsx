import { useId } from "react"

export default function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  const id = useId()
  const face = `${id}-face`
  const face2 = `${id}-face2`

  return (
    <svg width={size} height={size} viewBox="13 12 76 77" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={face} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#15803d" />
          <stop offset="0.55" stopColor="#22c55e" />
          <stop offset="1" stopColor="#86efac" />
        </linearGradient>
        <linearGradient id={face2} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#16a34a" />
          <stop offset="0.6" stopColor="#34d96f" />
          <stop offset="1" stopColor="#bbf7d0" />
        </linearGradient>
      </defs>
      <rect x="13" y="12" width="30" height="77" rx="15" fill="#052e16" />
      <rect x="59" y="12" width="30" height="77" rx="15" fill="#052e16" />
      <rect x="13" y="12" width="30" height="68" rx="15" fill={`url(#${face})`} />
      <rect x="59" y="12" width="30" height="68" rx="15" fill={`url(#${face})`} />
      <rect x="25" y="22" width="9" height="42" rx="4.5" fill="#052e16" />
      <rect x="69" y="22" width="9" height="42" rx="4.5" fill="#052e16" />
      <path d="M30.5 88 V66 Q30.5 44 52 44 Q71 44 71 66 V88" fill="none" stroke="#052e16" strokeWidth="11" />
      <path d="M30.5 78 V58 Q30.5 43.5 46 43.5 H55 Q71 43.5 71 58 V78" fill="none" stroke={`url(#${face2})`} strokeWidth="11" />
    </svg>
  )
}
