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
  const roof = '#1a2834'
  const v = ((variant % 3) + 3) % 3

  return (
    <svg
      className={className}
      viewBox="0 0 48 40"
      width="48"
      height="40"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Platform / ground */}
      <rect x="2" y="34" width="44" height="3" fill={neon} opacity="0.45" />
      <rect x="6" y="36" width="4" height="2" fill={glass} opacity="0.5" />
      <rect x="22" y="36" width="4" height="2" fill={glass} opacity="0.5" />
      <rect x="38" y="36" width="4" height="2" fill={glass} opacity="0.5" />

      <g filter={`url(#${glowId})`}>
        {/* Roof — three silhouettes */}
        {v === 0 && (
          <>
            <rect x="10" y="6" width="28" height="4" fill={neon} />
            <rect x="14" y="2" width="20" height="4" fill={neon} />
            <rect x="18" y="0" width="12" height="2" fill={glass} opacity="0.7" />
          </>
        )}
        {v === 1 && (
          <>
            <rect x="8" y="8" width="32" height="4" fill={neon} />
            <rect x="12" y="4" width="24" height="4" fill={neon} />
            <rect x="20" y="0" width="8" height="4" fill={glass} opacity="0.75" />
          </>
        )}
        {v === 2 && (
          <>
            <rect x="6" y="8" width="36" height="4" fill={neon} />
            <rect x="10" y="4" width="28" height="4" fill={roof} />
            <rect x="10" y="4" width="28" height="2" fill={neon} opacity="0.85" />
            <rect x="22" y="0" width="4" height="4" fill={glass} />
          </>
        )}

        {/* Main hall */}
        <rect x="12" y="10" width="24" height="22" fill={body} />
        <rect x="12" y="10" width="24" height="2" fill={neon} />
        <rect x="12" y="10" width="2" height="22" fill={neon} opacity="0.9" />
        <rect x="34" y="10" width="2" height="22" fill={neon} opacity="0.9" />

        {/* Station sign board */}
        <rect x="16" y="12" width="16" height="5" fill={neon} />
        <rect x="18" y="13" width="12" height="3" fill={body} />
        <rect x="20" y="14" width="2" height="1" fill={glass} />
        <rect x="24" y="14" width="2" height="1" fill={glass} />
        <rect x="28" y="14" width="2" height="1" fill={glass} />

        {/* Windows */}
        {v === 0 && (
          <>
            <rect x="16" y="20" width="6" height="6" fill={glass} opacity="0.85" />
            <rect x="26" y="20" width="6" height="6" fill={glass} opacity="0.85" />
          </>
        )}
        {v === 1 && (
          <>
            <rect x="15" y="19" width="5" height="7" fill={glass} opacity="0.8" />
            <rect x="22" y="19" width="4" height="7" fill={glass} opacity="0.55" />
            <rect x="28" y="19" width="5" height="7" fill={glass} opacity="0.8" />
          </>
        )}
        {v === 2 && (
          <>
            <rect x="16" y="19" width="4" height="4" fill={glass} opacity="0.9" />
            <rect x="22" y="19" width="4" height="4" fill={glass} opacity="0.65" />
            <rect x="28" y="19" width="4" height="4" fill={glass} opacity="0.9" />
            <rect x="16" y="25" width="4" height="4" fill={glass} opacity="0.55" />
            <rect x="28" y="25" width="4" height="4" fill={glass} opacity="0.55" />
          </>
        )}

        {/* Door */}
        <rect x="21" y="26" width="6" height="6" fill={neon} opacity="0.75" />
        <rect x="22" y="27" width="4" height="5" fill={body} />
        <rect x="24" y="29" width="1" height="1" fill={glass} />

        {/* Awning over platform */}
        <rect x="8" y="30" width="32" height="3" fill={neon} opacity="0.7" />
        <rect x="8" y="30" width="32" height="1" fill={glass} opacity="0.45" />
      </g>
    </svg>
  )
}
