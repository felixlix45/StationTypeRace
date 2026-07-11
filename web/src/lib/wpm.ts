/** Standard typing metric: 5 characters = 1 word */
export function calcWpm(chars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || chars <= 0) return 0
  const minutes = elapsedMs / 60_000
  return Math.round((chars / 5) / minutes)
}

/** Monkeytype-style accuracy from live keystroke tallies */
export function calcAccuracy(
  correctKeystrokes: number,
  incorrectKeystrokes: number,
): number {
  const total = correctKeystrokes + incorrectKeystrokes
  if (total <= 0) return 100
  return Math.round((correctKeystrokes / total) * 100)
}

export function formatWpm(wpm: number): string {
  return Number.isFinite(wpm) ? String(wpm) : '0'
}

export function formatAccuracy(accuracy: number): string {
  return Number.isFinite(accuracy) ? `${accuracy}%` : '100%'
}

/** Case-insensitive full-string match (used for WPM banking, not advance). */
export function isStationCorrect(target: string, typed: string): boolean {
  return (
    typed.length === target.length &&
    typed.toLowerCase() === target.toLowerCase()
  )
}

/**
 * Live WPM credit for the current station: full typed length only when
 * every character so far matches the target prefix; otherwise 0 until fixed.
 */
export function correctPrefixChars(target: string, typed: string): number {
  const t = target.toLowerCase()
  const s = typed.toLowerCase()
  for (let i = 0; i < s.length; i += 1) {
    if (s[i] !== t[i]) return 0
  }
  return s.length
}
