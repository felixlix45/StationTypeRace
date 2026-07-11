import { calcWpm } from './wpm'

/** Per-station timing/error sample recorded on advance (or finish). */
export type StationSample = {
  index: number
  name: string
  startedAt: number
  endedAt: number
  durationMs: number
  targetLen: number
  perfect: boolean
  /** Chars banked into race WPM (target length if perfect, else 0). */
  creditedChars: number
  correctDelta: number
  incorrectDelta: number
  /** Productive WPM for this stop: creditedChars / 5 / minutes. */
  stationWpm: number
}

export type KeystrokeBaseline = {
  correct: number
  incorrect: number
}

export function buildStationSample(args: {
  index: number
  name: string
  target: string
  perfect: boolean
  startedAt: number
  endedAt: number
  correctKeystrokes: number
  incorrectKeystrokes: number
  baseline: KeystrokeBaseline
}): StationSample {
  const durationMs = Math.max(args.endedAt - args.startedAt, 1)
  const creditedChars = args.perfect ? args.target.length : 0
  return {
    index: args.index,
    name: args.name,
    startedAt: args.startedAt,
    endedAt: args.endedAt,
    durationMs,
    targetLen: args.target.length,
    perfect: args.perfect,
    creditedChars,
    correctDelta: Math.max(0, args.correctKeystrokes - args.baseline.correct),
    incorrectDelta: Math.max(
      0,
      args.incorrectKeystrokes - args.baseline.incorrect,
    ),
    stationWpm: calcWpm(creditedChars, durationMs),
  }
}

export function countPerfectStations(samples: StationSample[]): number {
  return samples.reduce((n, s) => n + (s.perfect ? 1 : 0), 0)
}
