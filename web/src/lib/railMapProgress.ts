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
