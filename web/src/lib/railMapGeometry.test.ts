import { describe, expect, it } from 'vitest'
import {
  boundsOfPoints,
  pointAtProgress,
  polylineLength,
  viewBoxFromBounds,
} from './railMapGeometry'

const unit: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 50 },
]

describe('polylineLength', () => {
  it('sums segment lengths', () => {
    expect(polylineLength(unit)).toBe(150)
  })

  it('returns 0 for fewer than 2 points', () => {
    expect(polylineLength([{ x: 1, y: 1 }])).toBe(0)
  })
})

describe('pointAtProgress', () => {
  it('returns start at 0', () => {
    expect(pointAtProgress(unit, 0)).toEqual({ x: 0, y: 0 })
  })

  it('returns end at 1', () => {
    expect(pointAtProgress(unit, 1)).toEqual({ x: 100, y: 50 })
  })

  it('interpolates mid-path', () => {
    // 100/150 along first segment
    const p = pointAtProgress(unit, 100 / 150)
    expect(p.x).toBeCloseTo(100)
    expect(p.y).toBeCloseTo(0)
  })

  it('clamps out of range', () => {
    expect(pointAtProgress(unit, -1)).toEqual({ x: 0, y: 0 })
    expect(pointAtProgress(unit, 2)).toEqual({ x: 100, y: 50 })
  })
})

describe('viewBoxFromBounds', () => {
  it('pads and enforces min size', () => {
    const b = boundsOfPoints([
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ])
    const vb = viewBoxFromBounds(b, 5, 40)
    expect(vb.w).toBeGreaterThanOrEqual(40)
    expect(vb.h).toBeGreaterThanOrEqual(40)
    expect(vb.x).toBeLessThanOrEqual(10)
    expect(vb.y).toBeLessThanOrEqual(10)
  })
})
