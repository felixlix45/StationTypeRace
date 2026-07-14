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

/** Case-insensitive full-string match (used for perfect-station stats / finish). */
export function isStationCorrect(target: string, typed: string): boolean {
  return (
    typed.length === target.length &&
    typed.toLowerCase() === target.toLowerCase()
  )
}

/**
 * WPM credit for a station by linguistic word, not the whole stop name.
 *
 * Space-separated words are scored independently (case-insensitive):
 * - A fully correct word banks its letters.
 * - Trailing spaces after a correct word bank when typed correctly.
 * - A mistyped word (and its trailing spaces) banks 0; later correct words still bank.
 * - The in-progress word banks its typed prefix only while that prefix still matches.
 *
 * Example: target "A Diesel B", typed "A Diesal B" → credits "A", its space, and "B".
 */
export function creditedWordChars(target: string, typed: string): number {
  const t = target.toLowerCase()
  const s = typed.toLowerCase()
  let credited = 0
  let i = 0

  while (i < target.length) {
    while (i < target.length && target[i] === ' ') {
      // Leading spaces (unexpected for station names): credit only if typed correctly.
      if (i < s.length && s[i] === t[i]) credited += 1
      else if (i < s.length) {
        /* mistyped leading space — skip without credit */
      } else {
        return credited
      }
      i += 1
    }
    if (i >= target.length) break

    const wordStart = i
    while (i < target.length && target[i] !== ' ') i += 1
    const wordEnd = i

    const spaceStart = i
    while (i < target.length && target[i] === ' ') i += 1
    const spaceEnd = i

    if (s.length < wordEnd) {
      if (s.length > wordStart) {
        let prefixOk = true
        for (let j = wordStart; j < s.length; j += 1) {
          if (s[j] !== t[j]) {
            prefixOk = false
            break
          }
        }
        if (prefixOk) credited += s.length - wordStart
      }
      break
    }

    let wordOk = true
    for (let j = wordStart; j < wordEnd; j += 1) {
      if (s[j] !== t[j]) {
        wordOk = false
        break
      }
    }

    if (!wordOk) continue

    credited += wordEnd - wordStart

    if (spaceEnd <= spaceStart) continue
    if (s.length <= spaceStart) break

    let spacesOk = true
    const typedSpaceEnd = Math.min(s.length, spaceEnd)
    for (let j = spaceStart; j < typedSpaceEnd; j += 1) {
      if (s[j] !== t[j]) {
        spacesOk = false
        break
      }
    }
    if (spacesOk) {
      credited += typedSpaceEnd - spaceStart
      if (s.length < spaceEnd) break
    }
  }

  return credited
}

/**
 * Live WPM credit for the current station (same per-word rules as banking).
 * Prefer {@link creditedWordChars}; kept as an alias for call sites.
 */
export function correctPrefixChars(target: string, typed: string): number {
  return creditedWordChars(target, typed)
}
