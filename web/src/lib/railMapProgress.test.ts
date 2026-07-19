import { describe, expect, it } from 'vitest'
import {
  markerPointFromStations,
  markerTravelHeadingDeg,
  segmentHeadingDeg,
  stationPathProgress,
  trainMarkerTransform,
} from './railMapProgress'

const stations = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 200, y: 100 },
]

describe('markerPointFromStations', () => {
  it('holds at first station while typing station 0', () => {
    expect(markerPointFromStations(stations, 0, 0)).toEqual({ x: 0, y: 0 })
    expect(markerPointFromStations(stations, 0, 0.5)).toEqual({ x: 0, y: 0 })
    expect(markerPointFromStations(stations, 0, 1)).toEqual({ x: 0, y: 0 })
  })

  it('starts at previous station when typing station 1 at f=0', () => {
    expect(markerPointFromStations(stations, 1, 0)).toEqual({ x: 0, y: 0 })
  })

  it('lerps toward station i while typing it', () => {
    const mid = markerPointFromStations(stations, 1, 0.5)
    expect(mid.x).toBeCloseTo(50)
    expect(mid.y).toBeCloseTo(0)
  })

  it('reaches station i at typedFraction=1', () => {
    expect(markerPointFromStations(stations, 1, 1)).toEqual({ x: 100, y: 0 })
    expect(markerPointFromStations(stations, 3, 1)).toEqual({ x: 200, y: 100 })
  })

  it('handles single-station lines', () => {
    expect(markerPointFromStations([{ x: 5, y: 7 }], 0, 0.8)).toEqual({
      x: 5,
      y: 7,
    })
  })
})

describe('stationPathProgress', () => {
  it('stays at 0 while typing first station (no Start vertex)', () => {
    expect(stationPathProgress(4, 0, 0)).toBe(0)
    expect(stationPathProgress(4, 0, 1)).toBe(0)
  })

  it('maps typing station 1 from 0 toward first segment', () => {
    expect(stationPathProgress(4, 1, 0)).toBeCloseTo(0)
    expect(stationPathProgress(4, 1, 0.5)).toBeCloseTo(0.5 / 3)
    expect(stationPathProgress(4, 1, 1)).toBeCloseTo(1 / 3)
  })

  it('reaches 1 at last station typedFraction=1', () => {
    expect(stationPathProgress(4, 3, 1)).toBeCloseTo(1)
  })

  it('returns 0 for single-station lines', () => {
    expect(stationPathProgress(1, 0, 0.5)).toBe(0)
  })
})

describe('segmentHeadingDeg', () => {
  it('points along axis-aligned travel', () => {
    expect(segmentHeadingDeg({ x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(0)
    expect(segmentHeadingDeg({ x: 0, y: 0 }, { x: 0, y: 10 })).toBeCloseTo(90)
    expect(segmentHeadingDeg({ x: 10, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(180)
    expect(segmentHeadingDeg({ x: 0, y: 10 }, { x: 0, y: 0 })).toBeCloseTo(-90)
  })
})

describe('markerTravelHeadingDeg', () => {
  it('faces toward station 1 while typing station 0', () => {
    expect(markerTravelHeadingDeg(stations, 0, 0.3)).toBeCloseTo(0)
  })

  it('follows from→to on later stations', () => {
    // stations[1]→[2] is downward (+Y)
    expect(markerTravelHeadingDeg(stations, 2, 0.4)).toBeCloseTo(90)
    // stations[2]→[3] is right (+X)
    expect(markerTravelHeadingDeg(stations, 3, 0.5)).toBeCloseTo(0)
  })
})

describe('trainMarkerTransform (side-view upright)', () => {
  /**
   * Art faces −X. After transform, local “down” (wheels, +Y) must not map to
   * screen top (−Y). Nose must follow travel.
   */
  function localDownAfter(travelDeg: number): { x: number; y: number } {
    const { rotateDeg, scaleX } = trainMarkerTransform(travelDeg)
    // Unit +Y (wheels) after scale(sx,1) then rotate(r) — SVG matrix order.
    const sx = scaleX
    const rad = (rotateDeg * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const lx = 0 * sx
    const ly = 1
    return { x: lx * cos - ly * sin, y: lx * sin + ly * cos }
  }

  function localNoseAfter(travelDeg: number): { x: number; y: number } {
    const { rotateDeg, scaleX } = trainMarkerTransform(travelDeg)
    // Unit −X (art nose) after scale then rotate.
    const sx = scaleX
    const rad = (rotateDeg * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const lx = -1 * sx
    const ly = 0
    return { x: lx * cos - ly * sin, y: lx * sin + ly * cos }
  }

  it('east: nose +X, not upside-down', () => {
    const t = trainMarkerTransform(0)
    expect(t.scaleX).toBe(-1)
    expect(t.rotateDeg).toBe(0)
    const nose = localNoseAfter(0)
    expect(nose.x).toBeCloseTo(1)
    expect(nose.y).toBeCloseTo(0)
    // Wheels must not point toward screen top (−Y)
    expect(localDownAfter(0).y).toBeGreaterThan(0)
  })

  it('west: nose −X, not upside-down', () => {
    const t = trainMarkerTransform(180)
    expect(t.scaleX).toBe(1)
    expect(t.rotateDeg).toBe(0)
    const nose = localNoseAfter(180)
    expect(nose.x).toBeCloseTo(-1)
    expect(nose.y).toBeCloseTo(0)
    expect(localDownAfter(180).y).toBeGreaterThan(0)
  })

  it('south: nose +Y, not belly-up', () => {
    const t = trainMarkerTransform(90)
    expect(t.scaleX).toBe(-1)
    expect(t.rotateDeg).toBe(90)
    const nose = localNoseAfter(90)
    expect(nose.x).toBeCloseTo(0)
    expect(nose.y).toBeCloseTo(1)
    // Sideways wheels (not screen-top / belly-up)
    expect(Math.abs(localDownAfter(90).y)).toBeLessThan(0.5)
  })

  it('north: nose −Y, not belly-up', () => {
    const t = trainMarkerTransform(-90)
    expect(t.scaleX).toBe(-1)
    expect(t.rotateDeg).toBe(-90)
    const nose = localNoseAfter(-90)
    expect(nose.x).toBeCloseTo(0)
    expect(nose.y).toBeCloseTo(-1)
    expect(Math.abs(localDownAfter(-90).y)).toBeLessThan(0.5)
  })
})
