import { describe, expect, it } from 'vitest'
import {
  markerPointFromStations,
  stationPathProgress,
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
