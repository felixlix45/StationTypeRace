/** 8-bit neon station building — pure SVG, no external assets */
export function PixelStationBuilding({
  color = '#ffb020',
  variant = 0,
  className,
  glowId = 'station-glow',
}: {
  color?: string
  /** 0–2 slight silhouette variants so a row of chips feels less identical */
  variant?: number
  className?: string
  /** Unique filter id when many buildings share one card */
  glowId?: string
}) {
  const neon = color
  const body = '#0a1620'
  const glass = '#7ef9ff'
  const v = ((variant % 3) + 3) % 3

  return (
    <svg
      className={className}
      viewBox="0 0 56 44"
      width="56"
      height="44"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.25" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Platform / tracks */}
      <rect x="0" y="38" width="56" height="3" fill={neon} opacity="0.4" />
      <rect x="4" y="40" width="5" height="2" fill={glass} opacity="0.45" />
      <rect x="16" y="40" width="5" height="2" fill={glass} opacity="0.45" />
      <rect x="28" y="40" width="5" height="2" fill={glass} opacity="0.45" />
      <rect x="40" y="40" width="5" height="2" fill={glass} opacity="0.45" />
      <rect x="50" y="40" width="4" height="2" fill={glass} opacity="0.45" />

      <g filter={`url(#${glowId})`}>
        {/* Roof / tower variants */}
        {v === 0 && (
          <>
            <rect x="14" y="6" width="28" height="4" fill={neon} />
            <rect x="18" y="2" width="20" height="4" fill={neon} />
            <rect x="24" y="0" width="8" height="2" fill={glass} opacity="0.8" />
          </>
        )}
        {v === 1 && (
          <>
            <rect x="10" y="8" width="36" height="4" fill={neon} />
            <rect x="14" y="4" width="28" height="4" fill={neon} />
            {/* Clock tower */}
            <rect x="24" y="0" width="8" height="8" fill={neon} />
            <rect x="26" y="2" width="4" height="4" fill={glass} opacity="0.9" />
          </>
        )}
        {v === 2 && (
          <>
            <rect x="8" y="8" width="40" height="4" fill={neon} />
            <rect x="12" y="4" width="32" height="4" fill={neon} opacity="0.9" />
            <rect x="26" y="0" width="4" height="4" fill={glass} />
            <rect x="20" y="0" width="2" height="2" fill={glass} opacity="0.55" />
            <rect x="34" y="0" width="2" height="2" fill={glass} opacity="0.55" />
          </>
        )}

        {/* Main hall */}
        <rect x="14" y="10" width="28" height="24" fill={body} />
        <rect x="14" y="10" width="28" height="2" fill={neon} />
        <rect x="14" y="10" width="2" height="24" fill={neon} />
        <rect x="40" y="10" width="2" height="24" fill={neon} />

        {/* Side wings */}
        <rect x="6" y="18" width="8" height="16" fill={body} />
        <rect x="6" y="18" width="8" height="2" fill={neon} opacity="0.85" />
        <rect x="42" y="18" width="8" height="16" fill={body} />
        <rect x="42" y="18" width="8" height="2" fill={neon} opacity="0.85" />

        {/* Station sign */}
        <rect x="18" y="12" width="20" height="6" fill={neon} />
        <rect x="20" y="13" width="16" height="4" fill={body} />
        <rect x="22" y="14" width="3" height="2" fill={glass} />
        <rect x="27" y="14" width="3" height="2" fill={glass} />
        <rect x="32" y="14" width="3" height="2" fill={glass} />

        {/* Windows */}
        {v === 0 && (
          <>
            <rect x="18" y="21" width="6" height="6" fill={glass} opacity="0.9" />
            <rect x="32" y="21" width="6" height="6" fill={glass} opacity="0.9" />
            <rect x="8" y="22" width="4" height="5" fill={glass} opacity="0.65" />
            <rect x="44" y="22" width="4" height="5" fill={glass} opacity="0.65" />
          </>
        )}
        {v === 1 && (
          <>
            <rect x="18" y="20" width="5" height="7" fill={glass} opacity="0.85" />
            <rect x="26" y="20" width="4" height="7" fill={glass} opacity="0.55" />
            <rect x="33" y="20" width="5" height="7" fill={glass} opacity="0.85" />
            <rect x="8" y="22" width="4" height="4" fill={glass} opacity="0.7" />
            <rect x="44" y="22" width="4" height="4" fill={glass} opacity="0.7" />
          </>
        )}
        {v === 2 && (
          <>
            <rect x="18" y="20" width="4" height="4" fill={glass} opacity="0.9" />
            <rect x="26" y="20" width="4" height="4" fill={glass} opacity="0.6" />
            <rect x="34" y="20" width="4" height="4" fill={glass} opacity="0.9" />
            <rect x="18" y="26" width="4" height="4" fill={glass} opacity="0.5" />
            <rect x="34" y="26" width="4" height="4" fill={glass} opacity="0.5" />
            <rect x="8" y="24" width="4" height="4" fill={glass} opacity="0.65" />
            <rect x="44" y="24" width="4" height="4" fill={glass} opacity="0.65" />
          </>
        )}

        {/* Door */}
        <rect x="25" y="27" width="6" height="7" fill={neon} opacity="0.8" />
        <rect x="26" y="28" width="4" height="6" fill={body} />
        <rect x="28" y="30" width="1" height="1" fill={glass} />

        {/* Canopy / awning */}
        <rect x="4" y="34" width="48" height="4" fill={neon} opacity="0.75" />
        <rect x="4" y="34" width="48" height="1" fill={glass} opacity="0.5" />
        <rect x="8" y="32" width="2" height="2" fill={neon} opacity="0.6" />
        <rect x="46" y="32" width="2" height="2" fill={neon} opacity="0.6" />
      </g>
    </svg>
  )
}
