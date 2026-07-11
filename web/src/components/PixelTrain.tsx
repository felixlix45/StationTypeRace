/** 8-bit neon train — pure SVG, no external assets */
export function PixelTrain({
  color = 'var(--line, #ffb020)',
  className,
}: {
  color?: string
  className?: string
}) {
  const cabin = '#0a1620'
  const rail = '#2a3a4a'

  return (
    <svg
      className={className}
      viewBox="0 0 160 64"
      width="160"
      height="64"
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ color }}
    >
      <defs>
        <filter id="train-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track */}
      <rect x="4" y="52" width="152" height="3" fill={rail} />
      <rect x="8" y="56" width="8" height="3" fill="currentColor" opacity="0.55" />
      <rect x="28" y="56" width="8" height="3" fill="currentColor" opacity="0.55" />
      <rect x="48" y="56" width="8" height="3" fill="currentColor" opacity="0.55" />
      <rect x="68" y="56" width="8" height="3" fill="currentColor" opacity="0.55" />
      <rect x="88" y="56" width="8" height="3" fill="currentColor" opacity="0.55" />
      <rect x="108" y="56" width="8" height="3" fill="currentColor" opacity="0.55" />
      <rect x="128" y="56" width="8" height="3" fill="currentColor" opacity="0.55" />
      <rect x="144" y="56" width="8" height="3" fill="currentColor" opacity="0.55" />

      <g filter="url(#train-glow)">
        {/* Engine body */}
        <rect x="18" y="22" width="52" height="26" fill="currentColor" />
        <rect x="22" y="18" width="36" height="8" fill="currentColor" />
        <rect x="26" y="14" width="20" height="6" fill="currentColor" />

        {/* Cabin cutout */}
        <rect x="28" y="26" width="14" height="12" fill={cabin} />
        <rect x="30" y="28" width="10" height="8" fill="currentColor" opacity="0.45" />

        {/* Nose / coupler */}
        <rect x="10" y="34" width="10" height="10" fill="currentColor" />
        <rect x="6" y="38" width="6" height="4" fill="currentColor" opacity="0.55" />

        {/* Headlight */}
        <rect x="8" y="30" width="4" height="4" fill="#fff7c2" />

        {/* Car 1 */}
        <rect x="74" y="24" width="36" height="24" fill="currentColor" />
        <rect x="78" y="28" width="10" height="10" fill={cabin} />
        <rect x="80" y="30" width="6" height="6" fill="currentColor" opacity="0.4" />
        <rect x="94" y="28" width="10" height="10" fill={cabin} />
        <rect x="96" y="30" width="6" height="6" fill="currentColor" opacity="0.4" />

        {/* Car 2 */}
        <rect x="114" y="24" width="36" height="24" fill="currentColor" />
        <rect x="118" y="28" width="10" height="10" fill={cabin} />
        <rect x="120" y="30" width="6" height="6" fill="currentColor" opacity="0.4" />
        <rect x="134" y="28" width="10" height="10" fill={cabin} />
        <rect x="136" y="30" width="6" height="6" fill="currentColor" opacity="0.4" />

        {/* Wheels */}
        <rect x="24" y="46" width="8" height="6" fill="#111" />
        <rect x="26" y="48" width="4" height="2" fill="currentColor" opacity="0.7" />
        <rect x="44" y="46" width="8" height="6" fill="#111" />
        <rect x="46" y="48" width="4" height="2" fill="currentColor" opacity="0.7" />
        <rect x="82" y="46" width="8" height="6" fill="#111" />
        <rect x="84" y="48" width="4" height="2" fill="currentColor" opacity="0.7" />
        <rect x="98" y="46" width="8" height="6" fill="#111" />
        <rect x="100" y="48" width="4" height="2" fill="currentColor" opacity="0.7" />
        <rect x="122" y="46" width="8" height="6" fill="#111" />
        <rect x="124" y="48" width="4" height="2" fill="currentColor" opacity="0.7" />
        <rect x="138" y="46" width="8" height="6" fill="#111" />
        <rect x="140" y="48" width="4" height="2" fill="currentColor" opacity="0.7" />

        {/* Exhaust puffs */}
        <rect x="40" y="6" width="4" height="4" fill="currentColor" opacity="0.55" />
        <rect x="46" y="2" width="4" height="4" fill="currentColor" opacity="0.35" />
      </g>
    </svg>
  )
}

/** Compact engine-only head for the station progress rail */
export function PixelTrainHead({
  color = 'var(--line, #ffb020)',
  className,
}: {
  color?: string
  className?: string
}) {
  const cabin = '#0a1620'

  return (
    <svg
      className={className}
      viewBox="0 0 56 36"
      width="56"
      height="36"
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ color }}
    >
      <defs>
        <filter id="train-head-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#train-head-glow)">
        <rect x="14" y="12" width="34" height="16" fill="currentColor" />
        <rect x="18" y="8" width="24" height="6" fill="currentColor" />
        <rect x="22" y="4" width="14" height="5" fill="currentColor" />
        <rect x="20" y="14" width="10" height="8" fill={cabin} />
        <rect x="22" y="15" width="6" height="5" fill="currentColor" opacity="0.45" />
        <rect x="6" y="18" width="10" height="8" fill="currentColor" />
        <rect x="2" y="20" width="6" height="3" fill="currentColor" opacity="0.55" />
        <rect x="4" y="14" width="3" height="3" fill="#fff7c2" />
        <rect x="20" y="28" width="6" height="4" fill="#111" />
        <rect x="22" y="29" width="2" height="2" fill="currentColor" opacity="0.7" />
        <rect x="34" y="28" width="6" height="4" fill="#111" />
        <rect x="36" y="29" width="2" height="2" fill="currentColor" opacity="0.7" />
        <rect x="28" y="1" width="3" height="3" fill="currentColor" opacity="0.55" />
      </g>
    </svg>
  )
}
