import { describe, expect, it } from 'vitest'
import {
  clampViewBox,
  FINISHED_FRAME_MIN_SIZE,
  FINISHED_FRAME_PADDING,
  frameAroundPoint,
  frameForFinishedLine,
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

describe('frameForFinishedLine', () => {
  const shortPath = [
    { x: 100, y: 100 },
    { x: 160, y: 100 },
  ]
  const shortStations = [
    { x: 100, y: 100 },
    { x: 160, y: 100 },
  ]
  const longPath = [
    { x: 40, y: 20 },
    { x: 40, y: 400 },
    { x: 380, y: 720 },
  ]
  const longStations = [
    { x: 40, y: 20 },
    { x: 40, y: 200 },
    { x: 40, y: 400 },
    { x: 200, y: 560 },
    { x: 380, y: 720 },
  ]

  it('frames a short line with finished padding / minSize', () => {
    const vb = frameForFinishedLine(shortPath, shortStations)
    expect(vb.w).toBeGreaterThanOrEqual(FINISHED_FRAME_MIN_SIZE)
    expect(vb.h).toBeGreaterThanOrEqual(FINISHED_FRAME_MIN_SIZE)
    expect(vb.x).toBeLessThanOrEqual(100 - FINISHED_FRAME_PADDING)
    expect(vb.x + vb.w).toBeGreaterThanOrEqual(160 + FINISHED_FRAME_PADDING)
  })

  it('frames a long line so every station fits with margin', () => {
    const vb = frameForFinishedLine(longPath, longStations)
    for (const s of longStations) {
      expect(vb.x).toBeLessThanOrEqual(s.x - FINISHED_FRAME_PADDING)
      expect(vb.y).toBeLessThanOrEqual(s.y - FINISHED_FRAME_PADDING)
      expect(vb.x + vb.w).toBeGreaterThanOrEqual(s.x + FINISHED_FRAME_PADDING)
      expect(vb.y + vb.h).toBeGreaterThanOrEqual(s.y + FINISHED_FRAME_PADDING)
    }
  })

  it('expands to include stations outside path polyline bounds', () => {
    const pathOnly = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]
    const stationsBeyond = [
      { x: -30, y: 0 },
      { x: 100, y: 0 },
      { x: 140, y: 40 },
    ]
    const vb = frameForFinishedLine(pathOnly, stationsBeyond)
    expect(vb.x).toBeLessThanOrEqual(-30 - FINISHED_FRAME_PADDING)
    expect(vb.x + vb.w).toBeGreaterThanOrEqual(140 + FINISHED_FRAME_PADDING)
    expect(vb.y + vb.h).toBeGreaterThanOrEqual(40 + FINISHED_FRAME_PADDING)
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
