import type {
  RailMapLinePath,
  RailMapNetwork,
  RailMapStation,
} from '../data/railMap/types'
import { pointAtProgress } from './railMapGeometry'

export function getLinePath(
  network: RailMapNetwork,
  lineId: string,
): RailMapLinePath | null {
  return network.lines.find((l) => l.lineId === lineId) ?? null
}

export function resolveStationPoints(
  path: RailMapLinePath,
  stationNames: string[],
): RailMapStation[] {
  const byName = new Map(path.stations.map((s) => [s.name, s]))
  const n = stationNames.length
  return stationNames.map((name, i) => {
    const hit = byName.get(name)
    if (hit) return hit
    const t = n <= 1 ? 0 : i / (n - 1)
    const p = pointAtProgress(path.points, t)
    return { name, x: p.x, y: p.y }
  })
}
