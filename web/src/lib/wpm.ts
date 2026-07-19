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

/**
 * Monkeytype-style credit inside a station name: each space-separated word
 * is all-or-nothing. A wrong letter zeros that word only. Matching spaces
 * between words still count. Incomplete trailing word (live typing) counts
 * its matching prefix, or 0 if any typed char in that word is wrong.
 */
export function creditedStationChars(target: string, typed: string): number {
  const t = target.toLowerCase()
  const s = typed.toLowerCase()
  const limit = Math.min(t.length, s.length)
  let credited = 0
  let i = 0

  while (i < limit) {
    if (t[i] === ' ') {
      if (s[i] === ' ') credited += 1
      i += 1
      continue
    }

    let end = i
    while (end < t.length && t[end] !== ' ') end += 1
    const wordLen = end - i
    const typedLen = Math.min(wordLen, limit - i)

    if (typedLen < wordLen) {
      let match = true
      for (let j = 0; j < typedLen; j += 1) {
        if (s[i + j] !== t[i + j]) {
          match = false
          break
        }
      }
      if (match) credited += typedLen
      break
    }

    let wordOk = true
    for (let j = 0; j < wordLen; j += 1) {
      if (s[i + j] !== t[i + j]) {
        wordOk = false
        break
      }
    }
    if (wordOk) credited += wordLen
    i = end
  }

  return credited
}

/** Full station match (every word + space correct, full length). */
export function isStationCorrect(target: string, typed: string): boolean {
  return (
    typed.length === target.length &&
    creditedStationChars(target, typed) === target.length
  )
}

/** Live WPM credit for the current station (per-word, not whole-station). */
export function correctPrefixChars(target: string, typed: string): number {
  return creditedStationChars(target, typed)
}
