/** Standard typing metric: 5 characters = 1 word */
export function calcWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctChars <= 0) return 0
  const minutes = elapsedMs / 60_000
  return Math.round((correctChars / 5) / minutes)
}

export function formatWpm(wpm: number): string {
  return Number.isFinite(wpm) ? String(wpm) : '0'
}
