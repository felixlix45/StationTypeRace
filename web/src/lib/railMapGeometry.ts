import type { RailMapPoint } from '../data/railMap/types'

export type { RailMapPoint }

export function polylineLength(points: RailMapPoint[]): number {
  if (points.length < 2) return 0
  let sum = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    sum += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return sum
}

export function pointAtProgress(
  points: RailMapPoint[],
  progress: number,
): RailMapPoint {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length === 1) return { ...points[0]! }
  const t = Math.min(1, Math.max(0, progress))
  const total = polylineLength(points)
  if (total <= 0) return { ...points[0]! }
  let dist = t * total
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (dist <= seg || i === points.length - 1) {
      const u = seg === 0 ? 0 : Math.min(dist / seg, 1)
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }
    }
    dist -= seg
  }
  return { ...points[points.length - 1]! }
}

export function boundsOfPoints(points: RailMapPoint[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }
  return { minX, minY, maxX, maxY }
}

export function viewBoxFromBounds(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  padding: number,
  minSize: number,
): { x: number; y: number; w: number; h: number } {
  let w = bounds.maxX - bounds.minX + padding * 2
  let h = bounds.maxY - bounds.minY + padding * 2
  let x = bounds.minX - padding
  let y = bounds.minY - padding
  if (w < minSize) {
    x -= (minSize - w) / 2
    w = minSize
  }
  if (h < minSize) {
    y -= (minSize - h) / 2
    h = minSize
  }
  return { x, y, w, h }
}
