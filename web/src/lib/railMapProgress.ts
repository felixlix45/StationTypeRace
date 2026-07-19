import type { RailMapPoint } from '../data/railMap/types'

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

function lerpPoint(a: RailMapPoint, b: RailMapPoint, t: number): RailMapPoint {
  const u = clamp01(t)
  return {
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
  }
}

/**
 * Marker position along station vertices (no Start node).
 * While typing station `i` with fraction `f`, lerp from stations[i-1]→stations[i]
 * (for i===0, hold at stations[0] — map has no Start vertex).
 */
export function markerPointFromStations(
  stations: RailMapPoint[],
  stationIndex: number,
  typedFraction: number,
): RailMapPoint {
  if (stations.length === 0) return { x: 0, y: 0 }
  if (stations.length === 1) return { ...stations[0]! }

  const last = stations.length - 1
  const i = Math.min(Math.max(stationIndex, 0), last)
  const f = clamp01(typedFraction)
  const from = i === 0 ? stations[0]! : stations[i - 1]!
  const to = stations[i]!
  return lerpPoint(from, to, f)
}

/**
 * 0–1 progress along the station polyline for camera follow.
 * Matches markerPointFromStations: hold at 0 while typing station 0;
 * while typing i (i>0), progress = ((i - 1) + f) / (n - 1).
 */
export function stationPathProgress(
  stationCount: number,
  stationIndex: number,
  typedFraction: number,
): number {
  if (stationCount <= 1) return 0
  const last = stationCount - 1
  const i = Math.min(Math.max(stationIndex, 0), last)
  const f = clamp01(typedFraction)
  if (i === 0) return 0
  return clamp01((i - 1 + f) / last)
}

/** Degrees from +X toward travel (SVG Y-down; matches `rotate()`). */
export function segmentHeadingDeg(from: RailMapPoint, to: RailMapPoint): number {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dx === 0 && dy === 0) return 0
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

/**
 * Travel heading (from → to) for the marker on the station polyline.
 * While typing station 0, faces toward station 1. Finished callers should
 * pass the last station index.
 */
export function markerTravelHeadingDeg(
  stations: RailMapPoint[],
  stationIndex: number,
  _typedFraction: number,
): number {
  if (stations.length < 2) return 0

  const last = stations.length - 1
  const i = Math.min(Math.max(stationIndex, 0), last)

  let from: RailMapPoint
  let to: RailMapPoint
  if (i === 0) {
    from = stations[0]!
    to = stations[1]!
  } else {
    from = stations[i - 1]!
    to = stations[i]!
  }

  if (from.x === to.x && from.y === to.y) {
    // Degenerate segment — peek at the next hop if any.
    if (i < last) {
      from = stations[i]!
      to = stations[i + 1]!
    } else if (i > 0) {
      from = stations[i - 1]!
      to = stations[i]!
    }
  }

  return segmentHeadingDeg(from, to)
}

/**
 * Side-view train marker yaw/flip so the nose follows `travelDeg` without
 * going belly-up (wheels toward screen top).
 *
 * PixelTrainHeadGlyph faces −X (nose/headlight on the left). Formula:
 * - rightish (`cos(travelDeg) >= 0`): flip with `scaleX = -1`, `rotate = travelDeg`
 * - leftish: keep `scaleX = 1`, `rotate = travelDeg - 180`
 *
 * Apply as:
 * `translate(x,y) rotate(rotateDeg) scale(scale * scaleX, scale) translate(-cx,-cy)`
 */
export function trainMarkerTransform(travelDeg: number): {
  rotateDeg: number
  scaleX: number
} {
  const rad = (travelDeg * Math.PI) / 180
  if (Math.cos(rad) >= 0) {
    return { rotateDeg: travelDeg, scaleX: -1 }
  }
  return { rotateDeg: travelDeg - 180, scaleX: 1 }
}
