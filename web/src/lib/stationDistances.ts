import type { StationLine } from '../data/stations'

/** Mean inter-station km; used for Start → first station. */
export function startToFirstKm(line: StationLine): number {
  const segs = line.segmentKm
  if (segs.length === 0) return 1
  const sum = segs.reduce((a, b) => a + b, 0)
  return sum / segs.length
}

/** Cumulative km for [Start, ...stations]. Length = stations.length + 1. */
export function nodeKmOffsets(line: StationLine): number[] {
  const start = startToFirstKm(line)
  const offsets = [0, start]
  let acc = start
  for (const km of line.segmentKm) {
    acc += km
    offsets.push(acc)
  }
  return offsets
}

export function totalKm(line: StationLine): number {
  const offsets = nodeKmOffsets(line)
  return offsets[offsets.length - 1] ?? startToFirstKm(line)
}

/**
 * Progress 0–1 along the full Start→terminus path.
 * `stationIndex` is the station being typed; `typedFraction` is chars typed / name length.
 */
export function distanceProgress(
  line: StationLine,
  stationIndex: number,
  typedFraction: number,
): number {
  const offsets = nodeKmOffsets(line)
  const total = offsets[offsets.length - 1] ?? 1
  if (total <= 0) return 0
  const i = Math.min(Math.max(stationIndex, 0), Math.max(line.stations.length - 1, 0))
  const from = offsets[i] ?? 0
  const to = offsets[i + 1] ?? from
  const frac = Math.min(Math.max(typedFraction, 0), 1)
  return Math.min((from + (to - from) * frac) / total, 1)
}
