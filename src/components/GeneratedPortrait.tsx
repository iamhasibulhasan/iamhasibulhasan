// Procedurally-drawn placeholder portrait (grayscale silhouette) used until a real photo
// is dropped in via profile.photoUrl.
export default function GeneratedPortrait() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 616 844"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="gp-glow" cx="52%" cy="26%" r="62%">
          <stop offset="0%" stopColor="#2b2b2b" />
          <stop offset="55%" stopColor="#121212" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <linearGradient id="gp-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#585858" />
          <stop offset="45%" stopColor="#2c2c2c" />
          <stop offset="100%" stopColor="#101010" />
        </linearGradient>
        <linearGradient id="gp-skin" x1="0" y1="0" x2="1" y2="0.7">
          <stop offset="0%" stopColor="#8c8c8c" />
          <stop offset="42%" stopColor="#4a4a4a" />
          <stop offset="100%" stopColor="#191919" />
        </linearGradient>
        <linearGradient id="gp-coat" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#343434" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <filter id="gp-soft">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="gp-softer">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <filter id="gp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <clipPath id="gp-frame">
          <rect width="616" height="844" rx="34" />
        </clipPath>
      </defs>

      <g clipPath="url(#gp-frame)">
        <rect width="616" height="844" fill="url(#gp-glow)" />

        {/* jacket */}
        <path d="M96 844 C110 690 190 604 268 578 L352 578 C438 604 512 686 526 844 Z" fill="url(#gp-coat)" />
        <g fill="#8f8f8f" opacity={0.26}>
          <ellipse cx="200" cy="700" rx="11" ry="8" transform="rotate(-18 200 700)" />
          <ellipse cx="264" cy="778" rx="9" ry="7" transform="rotate(12 264 778)" />
          <ellipse cx="430" cy="668" rx="12" ry="9" transform="rotate(24 430 668)" />
          <ellipse cx="472" cy="760" rx="10" ry="7" transform="rotate(-8 472 760)" />
          <ellipse cx="356" cy="812" rx="8" ry="6" />
          <ellipse cx="150" cy="800" rx="9" ry="7" transform="rotate(30 150 800)" />
        </g>
        <path d="M268 578 L306 664 L352 578 Z" fill="#050505" opacity={0.9} />

        {/* neck */}
        <path d="M258 402 C258 486 250 540 268 582 L352 582 C338 540 342 470 348 404 Z" fill="#232323" />

        {/* hair mass */}
        <g filter="url(#gp-soft)">
          <ellipse cx="306" cy="252" rx="182" ry="164" fill="url(#gp-hair)" />
          <ellipse cx="176" cy="286" rx="72" ry="86" fill="url(#gp-hair)" />
          <ellipse cx="438" cy="270" rx="78" ry="92" fill="url(#gp-hair)" />
          <ellipse cx="300" cy="118" rx="118" ry="62" fill="url(#gp-hair)" />
        </g>
        <g fill="#6b6b6b" opacity={0.2} filter="url(#gp-soft)">
          <ellipse cx="214" cy="150" rx="58" ry="40" />
          <ellipse cx="404" cy="176" rx="52" ry="38" />
          <ellipse cx="150" cy="252" rx="34" ry="46" />
        </g>

        {/* face, tilted upward */}
        <g transform="rotate(-11 300 312)">
          <ellipse cx="298" cy="308" rx="102" ry="122" fill="url(#gp-skin)" />
          <path d="M238 236 C258 208 348 206 366 240 C352 226 254 224 238 236 Z" fill="#0d0d0d" opacity={0.65} />
          <ellipse cx="250" cy="330" rx="44" ry="60" fill="#a5a5a5" opacity={0.2} filter="url(#gp-soft)" />
          <ellipse cx="292" cy="392" rx="52" ry="26" fill="#9a9a9a" opacity={0.14} filter="url(#gp-soft)" />
          <path
            d="M292 300 C280 336 274 348 288 356 C300 362 316 358 318 348 C320 336 308 320 306 300 Z"
            fill="#111"
            opacity={0.45}
          />
          <ellipse cx="298" cy="346" rx="20" ry="11" fill="#b0b0b0" opacity={0.26} filter="url(#gp-soft)" />
          <path d="M266 392 C286 382 314 384 330 394 C314 408 282 408 266 392 Z" fill="#0e0e0e" opacity={0.7} />
          <g>
            <path d="M196 268 L400 250 L404 268 L200 288 Z" fill="#0a0a0a" />
            <path d="M198 272 C196 314 224 330 258 322 C286 316 296 292 292 268 Z" fill="#111" />
            <path d="M300 266 C300 306 330 322 362 312 C390 302 400 280 396 258 Z" fill="#141414" />
            <path d="M206 280 C212 306 236 318 258 310 C244 306 220 296 206 280 Z" fill="#e9e9e9" opacity={0.92} />
            <path d="M308 272 C316 296 338 308 358 302 C340 296 320 288 308 272 Z" fill="#cfcfcf" opacity={0.5} />
            <path d="M196 268 L404 250" stroke="#4a4a4a" strokeWidth="3" fill="none" />
          </g>
        </g>

        {/* rim light */}
        <path
          d="M130 300 C126 176 214 76 320 74"
          stroke="#d6d6d6"
          strokeWidth="16"
          fill="none"
          opacity={0.14}
          filter="url(#gp-soft)"
        />
        <ellipse
          cx="308"
          cy="300"
          rx="330"
          ry="360"
          fill="none"
          stroke="#000"
          strokeWidth="180"
          opacity={0.55}
          filter="url(#gp-softer)"
        />

        {/* grain */}
        <rect width="616" height="844" filter="url(#gp-grain)" opacity={0.085} style={{ mixBlendMode: "overlay" }} />
      </g>
    </svg>
  )
}
