import { describe, expect, it } from 'vitest'
import {
  clampViewBox,
  frameAroundPoint,
  frameForLine,
  frameForNetwork,
  frameForProgress,
} from './railMapCamera'
import { markerPointFromStations } from './railMapProgress'
import { pointAtProgress } from './railMapGeometry'

const line = [
  { x: 0, y: 50 },
  { x: 200, y: 50 },
  { x: 200, y: 150 },
]

describe('frameForLine', () => {
  it('contains the full line with padding', () => {
    const vb = frameForLine(line, { padding: 10, minSize: 20 })
    expect(vb.x).toBeLessThanOrEqual(0)
    expect(vb.y).toBeLessThanOrEqual(50)
    expect(vb.x + vb.w).toBeGreaterThanOrEqual(200)
    expect(vb.y + vb.h).toBeGreaterThanOrEqual(150)
  })
})

describe('frameForNetwork', () => {
  it('contains every line path', () => {
    const lines = [
      { points: line },
      {
        points: [
          { x: -20, y: 0 },
          { x: 250, y: 180 },
        ],
      },
    ]
    const vb = frameForNetwork(lines, { padding: 5, minSize: 20 })
    expect(vb.x).toBeLessThanOrEqual(-20)
    expect(vb.y).toBeLessThanOrEqual(0)
    expect(vb.x + vb.w).toBeGreaterThanOrEqual(250)
    expect(vb.y + vb.h).toBeGreaterThanOrEqual(180)
  })
})

describe('frameAroundPoint', () => {
  it('centers on the given point', () => {
    const point = { x: 120, y: 80 }
    const zoom = frameAroundPoint(point, {
      padding: 0,
      minSize: 40,
      zoomSize: 40,
    })
    expect(zoom.x + zoom.w / 2).toBeCloseTo(point.x, 5)
    expect(zoom.y + zoom.h / 2).toBeCloseTo(point.y, 5)
  })
})

describe('frameForProgress', () => {
  it('is smaller than full-line frame when zoomed', () => {
    const full = frameForLine(line, { padding: 10, minSize: 40 })
    const zoom = frameForProgress(line, 0.5, {
      padding: 10,
      minSize: 40,
      zoomSize: 80,
    })
    expect(zoom.w).toBeLessThanOrEqual(full.w)
    expect(zoom.h).toBeLessThanOrEqual(full.h)
  })

  it('centers near the marker', () => {
    const zoom = frameForProgress(line, 0, {
      padding: 0,
      minSize: 40,
      zoomSize: 40,
    })
    const cx = zoom.x + zoom.w / 2
    const cy = zoom.y + zoom.h / 2
    expect(cx).toBeCloseTo(0, 0)
    expect(cy).toBeCloseTo(50, 0)
  })
})

describe('racing camera vs station marker (uneven path)', () => {
  it('viewBox center matches station-lerped marker, not path-arclength progress', () => {
    // Dense first corridor, then a long sparse jump — arc-length mid ≠ station mid.
    const path = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 30, y: 0 },
      { x: 40, y: 0 },
      { x: 50, y: 0 },
      { x: 300, y: 0 },
    ]
    const stations = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 300, y: 0 },
    ]
    const stationIndex = 2
    const typedFraction = 0.5
    const marker = markerPointFromStations(stations, stationIndex, typedFraction)
    // stationPathProgress(3, 2, 0.5) = 1.5/2 = 0.75
    const pathPoint = pointAtProgress(path, 0.75)

    const opts = { padding: 0, minSize: 40, zoomSize: 40 }
    const aroundMarker = frameAroundPoint(marker, opts)
    const aroundPath = frameForProgress(path, 0.75, opts)

    expect(aroundMarker.x + aroundMarker.w / 2).toBeCloseTo(marker.x, 5)
    expect(aroundMarker.y + aroundMarker.h / 2).toBeCloseTo(marker.y, 5)
    // Prove the old approach diverges from the station marker on uneven spacing.
    expect(Math.hypot(pathPoint.x - marker.x, pathPoint.y - marker.y)).toBeGreaterThan(
      40,
    )
    expect(aroundPath.x + aroundPath.w / 2).not.toBeCloseTo(marker.x, 0)
  })
})

describe('clampViewBox', () => {
  it('keeps view inside world', () => {
    const vb = clampViewBox(
      { x: -50, y: -50, w: 100, h: 100 },
      { width: 200, height: 200 },
    )
    expect(vb.x).toBeGreaterThanOrEqual(0)
    expect(vb.y).toBeGreaterThanOrEqual(0)
    expect(vb.x + vb.w).toBeLessThanOrEqual(200)
    expect(vb.y + vb.h).toBeLessThanOrEqual(200)
  })
})
