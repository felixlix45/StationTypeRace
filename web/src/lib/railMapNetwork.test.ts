import { describe, expect, it } from 'vitest'
import network from '../data/railMap/network.json'
import { getLinePath, resolveStationPoints } from './railMapNetwork'
import { STATION_LINES } from '../data/stations'
import type { RailMapNetwork } from '../data/railMap/types'

const net = network as RailMapNetwork

describe('getLinePath', () => {
  it('finds every playable line id', () => {
    for (const line of STATION_LINES) {
      expect(getLinePath(net, line.id)?.lineId).toBe(line.id)
    }
  })
})

describe('resolveStationPoints', () => {
  it('interpolates missing middle stops', () => {
    const path = getLinePath(net, 'mrt-ns')!
    const names = STATION_LINES.find((l) => l.id === 'mrt-ns')!.stations
    const resolved = resolveStationPoints(path, names)
    expect(resolved).toHaveLength(names.length)
    expect(resolved[0]!.name).toBe(names[0])
    expect(resolved[resolved.length - 1]!.name).toBe(names[names.length - 1])
  })
})

describe('network.borders', () => {
  const expectedIds = [
    'jakarta-pusat',
    'jakarta-utara',
    'jakarta-barat',
    'jakarta-selatan',
    'jakarta-timur',
    'depok',
    'bogor',
    'tangerang',
    'tangerang-selatan',
    'bekasi',
  ]

  it('includes the ten kota (no kabupaten)', () => {
    expect(net.borders.map((b) => b.id).sort()).toEqual([...expectedIds].sort())
  })

  it('uses non-rectangular rings (≥8 verts, not axis-aligned boxes)', () => {
    for (const border of net.borders) {
      const pts = border.points
      // closed ring: first ≈ last, so unique verts = length - 1 when closed
      const unique =
        pts.length >= 2 &&
        Math.abs(pts[0]!.x - pts[pts.length - 1]!.x) < 1e-6 &&
        Math.abs(pts[0]!.y - pts[pts.length - 1]!.y) < 1e-6
          ? pts.length - 1
          : pts.length
      expect(unique, border.id).toBeGreaterThanOrEqual(8)

      const xs = new Set(pts.map((p) => Math.round(p.x * 100) / 100))
      const ys = new Set(pts.map((p) => Math.round(p.y * 100) / 100))
      // axis-aligned rectangle only has 2 distinct x and 2 distinct y
      const isAxisAlignedBox = xs.size <= 2 && ys.size <= 2
      expect(isAxisAlignedBox, border.id).toBe(false)
    }
  })
})
