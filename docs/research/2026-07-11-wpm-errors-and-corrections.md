# Research Brief: WPM with Errors and Corrections

**Date:** 2026-07-11  
**Purpose:** Clarify how major typing tests and standards count Words Per Minute (WPM) when the user types wrong characters and when they backspace/correct — then compare to StationTypeRace.  
**Status:** Research only — no application code changes

---

## 1. Executive summary

Across products, a “word” for typing speed is almost always **5 characters** (including spaces/punctuation), not a linguistic word. Products then diverge on **what counts in the numerator**:

| Approach | Numerator | Errors left in place | Corrections (backspace) |
|----------|-----------|----------------------|-------------------------|
| **Gross / Raw WPM** | All typed characters (often including wrong ones) | Still count toward speed | Time cost only; Backspace itself is not a “character” |
| **Classic Net WPM** | Gross, then subtract uncorrected errors/minute | Explicit WPM penalty | No extra penalty beyond time (and usually not counted as Net errors) |
| **Correct-chars / correct-words WPM** (Monkeytype, 10FF, StationTypeRace-like) | Only correct output (chars or whole words) | Wrong output does **not** boost WPM | Fixing restores credit; time spent fixing still lowers WPM |
| **Forced correction** (TypeRacer) | Passage length / 5 / minutes once finished correctly | Cannot leave errors; must fix to advance | Only path forward; penalty is entirely via elapsed time |

**StationTypeRace today** uses a **correct-characters** formula: `WPM = (correctChars / 5) / minutes`, advances a station when `input.length === target.length` (mistakes allowed), and counts matches **positionally**. That is closer to Monkeytype/10FF “productive speed” than to classic Gross−errors Net WPM, but looser than TypeRacer (which blocks progress on typos).

---

## 2. Standard formula (5 characters = 1 word)

Industry convention for alphanumeric typing tests:

\[
\text{WPM} = \frac{(\text{character count} / 5)}{\text{minutes}}
\]

Equivalently: \(\text{WPM} = (\text{characters} \times 60 / \text{seconds}) / 5\).

- Wikipedia: for text-entry measurement, a “word” is often standardized to **five characters or keystrokes**, including spaces and punctuation. Example: “I run” = 1 word; “rhinoceros” and “let’s talk” = 2 words each.  
  Source: [Wikipedia — Words per minute](https://en.wikipedia.org/wiki/Words_per_minute)
- TypeRacer switched from counting linguistic words to **characters ÷ 5**, citing that Wikipedia convention.  
  Source: [TypeRacer Blog — New Speedometer (2008)](https://blog.typeracer.com/2008/05/19/new-speedometer-and-improved-cheat-protection/)
- SpeedTypingOnline: spaces, numbers, letters, punctuation count; **function keys such as Shift or Backspace do not** count as keyed entries in the character total.  
  Source: [SpeedTypingOnline — Typing Equations](https://www.speedtypingonline.com/typing-equations)
- 10FastFingers FAQ: “5 keystrokes equal 1 WPM,” with a pointer to Wikipedia.  
  Source: [10FastFingers FAQ](https://10fastfingers.com/faq)

**ISO/ANSI note:** Searches for an ISO/ANSI *typing-test scoring* standard that defines WPM did not turn up a widely cited normative document. “ANSI” in typing contexts usually refers to keyboard layout geometry, not WPM math. The durable convention is the **5-character word**, documented in Wikipedia and adopted by major products — not a single ISO typing-score standard found for this brief.

---

## 3. Gross vs Net WPM (and “raw” / “adjusted”)

### Classic employment / certification formulas

Well-cited teaching definitions (SpeedTypingOnline and similar guides):

| Metric | Formula | Meaning |
|--------|---------|---------|
| **Gross WPM** (also called **Raw** in some guides) | \((\text{all characters typed} / 5) / \text{minutes}\) | Finger speed; **no** error deduction |
| **Net WPM** | \(\text{Gross WPM} - (\text{uncorrected errors} / \text{minutes})\) | Productive speed; **one word penalty per uncorrected error per minute** |

Sources: [SpeedTypingOnline — Typing Equations](https://www.speedtypingonline.com/typing-equations); same Net formula summarized at [typingtesttool.com — Net vs Gross](https://www.typingtesttool.com/learn/net-wpm-vs-gross-wpm).

**Important nuance from SpeedTypingOnline:** only **uncorrected** errors should feed the Net penalty. Corrected mistakes already cost time (and Backspace is not a counted character), so double-penalizing them discourages fixing typos and can produce absurd Net scores (e.g. many corrections → Net ≈ 0 despite clean final text).

### Product naming (not always the same as “classic Net”)

| Product term | What it usually means |
|--------------|------------------------|
| **Gross WPM** | All keystrokes ÷ 5 ÷ minutes |
| **Net WPM** | Gross minus uncorrected-error rate **or** (in some UIs) only-correct-chars speed |
| **Raw WPM** (Monkeytype, 10FF) | Speed including incorrect/extra characters — closer to Gross |
| **WPM** (Monkeytype, 10FF) | Speed from **correct words** only — not the classic Net formula |
| **Adjusted** | Informal; sometimes means Net, sometimes accuracy-weighted; avoid without a cited definition |

**Typing.com:** documents Gross WPM as total words (5 keystrokes each) ÷ minutes, and Accuracy separately. They **removed** an older “Net WPM = WPM × Accuracy%” because it pushed students to chase speed while ignoring mistakes.  
Sources: [Typing.com support — How WPM and Accuracy are Calculated](https://support.typing.com/en/articles/9048321); [Typing.com blog — What is WPM?](https://www.typing.com/blog/what-is-words-per-minute/)

---

## 4. How errors affect WPM (wrong character left in place)

Depends entirely on the scoring model:

### A. Classic Net WPM

- Wrong characters that remain at the end count as **errors**.
- They still inflate **Gross** (if Gross counts all keystrokes).
- **Net** subtracts `errors / minutes` (each uncorrected error ≈ −1 WPM on a 1-minute test).  
  Source: [SpeedTypingOnline — Typing Equations](https://www.speedtypingonline.com/typing-equations)

### B. Correct-output WPM (Monkeytype / 10FastFingers style)

- **Monkeytype `wpm`:** characters in **fully correct words** (plus correct spaces), ÷ 5, normalized to 60 seconds. A word with any wrong letter contributes **0** to WPM (but still affects raw/accuracy).  
  Sources: [Monkeytype about / settings copy](https://dev.monkeytype.com/account-settings) (“wpm - total number of characters in the correctly typed words…”); implementation in [`test-stats.ts` `calculateWpmAndRaw` / `countChars`](https://github.com/monkeytypegame/monkeytype/blob/9799c386/frontend/src/ts/test/test-stats.ts)
- **Monkeytype `raw`:** includes correct chars + spaces + incorrect + extra.  
  Same sources.
- **10FastFingers:** WPM from **correct words’** expected keystrokes + spaces, ÷ 5 per minute; **WPM Raw** includes wrong words too.  
  Source: [10FastFingers FAQ](https://10fastfingers.com/faq) (WPM / WPM Raw sections)

### C. Forced-correct races (TypeRacer)

- You **cannot** leave a wrong character and continue: you must erase and type the right one before advancing.  
  Sources: [TeachMe — How to play TypeRacer](https://teachmehelp.zendesk.com/hc/en-us/articles/5877690491543-How-to-play-TypeRacer); community/dev writeups describing the same forced-correction model (e.g. [DEV — Clackpit / TypeRacer model](https://dev.to/clackpit_dev/i-built-a-typing-game-with-the-feature-rtyping-asked-for-heres-what-i-learned-1k5f))
- Finished race WPM is effectively **passage characters ÷ 5 ÷ minutes** (5-char word convention). Errors only hurt via **time**.  
  Source: [TypeRacer Blog — 5 characters per word](https://blog.typeracer.com/2008/05/19/new-speedometer-and-improved-cheat-protection/)

### D. Accuracy (separate from WPM)

Typical accuracy:

\[
\text{Accuracy} = \frac{\text{correct}}{\text{correct} + \text{incorrect}} \times 100\%
\]

- Monkeytype: from live correct/incorrect keystroke tallies.  
  Source: [`calculateAccuracy` in test-stats.ts](https://github.com/monkeytypegame/monkeytype/blob/9799c386/frontend/src/ts/test/test-stats.ts)
- SpeedTypingOnline: **all** errors (corrected or not) should count in accuracy, even though Net WPM only penalizes uncorrected ones.  
  Source: [SpeedTypingOnline — Typing Equations](https://www.speedtypingonline.com/typing-equations)
- 10FastFingers (text practice): accuracy folds in **mistakes and corrections** (corrections inflate the denominator).  
  Source: [10FastFingers FAQ](https://10fastfingers.com/faq)

---

## 5. How corrections / backspace affect WPM

### Always: elapsed time

Any pause to notice a typo, press Backspace (possibly many times), and retype **increases `minutes` in the denominator**. That alone lowers WPM for every formula that uses wall-clock (or test) duration. There is no separate “correction tax” required for this effect.

### Character / error accounting

| Question | Typical answer | Source |
|----------|----------------|--------|
| Does Backspace count as a character toward WPM? | **No** (not a typed entry) | [SpeedTypingOnline](https://www.speedtypingonline.com/typing-equations) |
| Do corrected errors reduce Net WPM? | **No** (only uncorrected); time already penalizes | Same |
| Do corrected errors hurt accuracy? | **Often yes** | SpeedTypingOnline; 10FF FAQ |
| After a successful fix, does the char/word count as correct for WPM? | **Yes** in correct-output and forced-correct models | Monkeytype word match; TypeRacer finish requires correct text |

### Monkeytype specifically

- Words are committed (typically with Space). If you backspace and fix **before** committing, the word can become fully correct and then count toward **wpm**.
- If you leave a wrong word and move on, that word’s characters do **not** add to **wpm**; they still feed **raw** / incorrect stats.
- Freedom settings can **limit or disable** backspacing to previous words (“when enabled, you will not be able to go back to previous words…”).  
  Source: [Monkeytype settings copy](https://dev.monkeytype.com/account-settings)

### 10FastFingers specifically

- Tracks corrected chars/keystrokes separately; leaderboard ties break on fewer wrong words, then fewer corrections.  
  Source: [10FastFingers FAQ](https://10fastfingers.com/faq)

---

## 6. How major products handle it

### Monkeytype

| Metric | Definition (product + code) |
|--------|-----------------------------|
| **wpm** | Correct-word characters + correct spaces, × (60 / seconds) / 5 |
| **raw** | allCorrectChars + spaces + incorrectChars + extraChars, same time scaling |
| **accuracy** | correct / (correct + incorrect) keystroke tallies |
| **consistency** | From variance of raw WPM (coefficient of variation → 0–100 scale) |

Sources: [Monkeytype about text](https://dev.monkeytype.com/account-settings); [DeepWiki result calculation](https://deepwiki.com/monkeytypegame/monkeytype/2.1.4-result-calculation-and-display); [test-stats.ts @ 9799c386](https://github.com/monkeytypegame/monkeytype/blob/9799c386/frontend/src/ts/test/test-stats.ts)

**Backspace:** allowed by default; fixing a word before submit restores WPM credit. Incorrect keystrokes count toward **raw** and **accuracy**, not toward **wpm**.

### TypeRacer

- WPM uses **5 characters = 1 word** over the race text and finish time.  
  Source: [TypeRacer Blog (2008)](https://blog.typeracer.com/2008/05/19/new-speedometer-and-improved-cheat-protection/)
- **Forced correction:** mistakes must be erased; you cannot skip ahead with wrong letters.  
  Source: [TeachMe TypeRacer guide](https://teachmehelp.zendesk.com/hc/en-us/articles/5877690491543-How-to-play-TypeRacer)
- Official score is server-side (includes network latency considerations).  
  Source: [TypeRacer Blog — Lag (2018)](https://blog.typeracer.com/2018/01/29/lag-on-typeracer-and-the-secret-to-unlocking-the-fastest-typeracer-scores/)

### 10FastFingers

- **WPM:** correct words’ keystrokes (+ spaces) per minute ÷ 5.  
- **WPM Raw:** all words’ chars/spaces ÷ 5 per minute.  
- Wrong words do not add to WPM; corrections affect accuracy / tie-breaks.  
  Source: [10FastFingers FAQ](https://10fastfingers.com/faq)

### Keybr

- Primarily a **tutor**, not a race benchmark: per-key confidence from inter-key timing mapped to a WPM-like scale (historically ~12 WPM → 0, ~35 WPM → 1 confidence), using the 5-letter-word assumption for timing.  
  Sources: [Google Groups — confidence calculation](https://groups.google.com/g/keybr/c/7e9KWp5Rxds/m/BEokRdiZBAAJ); [keybr.com GitHub](https://github.com/aradzie/keybr.com)
- Less useful as a Gross/Net reference; useful as “5 chars/word still assumed for speed math.”

### Typing.com

- Gross WPM + separate Accuracy; former Net×Accuracy removed.  
  Sources: [Support article](https://support.typing.com/en/articles/9048321); [Blog](https://www.typing.com/blog/what-is-words-per-minute/)

---

## 7. StationTypeRace current behavior

### Formula

```1:6:web/src/lib/wpm.ts
/** Standard typing metric: 5 characters = 1 word */
export function calcWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctChars <= 0) return 0
  const minutes = elapsedMs / 60_000
  return Math.round((correctChars / 5) / minutes)
}
```

So: **only `correctChars` enter the numerator**; incorrect keystrokes do **not** increase WPM. Time is wall-clock from first input to finish (`elapsedMs`).

### Correct-character counting (positional)

```52:61:web/src/App.tsx
/** Count characters that match the target at the same index (mistakes do not block later hits). */
function countCorrectChars(target: string, typed: string): number {
  const t = target.toLowerCase()
  const s = typed.toLowerCase()
  const len = Math.min(s.length, t.length)
  let n = 0
  for (let i = 0; i < len; i += 1) {
    if (s[i] === t[i]) n += 1
  }
  return n
}
```

- Case-insensitive.
- A wrong char at index `i` does not block credit for a later correct char at `i+1` (unlike “stop at first error” caret models).
- Extra characters beyond target length are sliced off on input (`value.slice(0, target.length)`), so you cannot type past the station length.

### Station advance (length, not perfection)

```172:178:web/src/App.tsx
  function advanceStation() {
    if (!race || phase !== 'racing') return

    const target = race.line.stations[race.stationIndex]!
    if (race.input.length !== target.length) return

    const nextCorrect = race.correctChars + countCorrectChars(target, race.input)
```

- Advance when **lengths match** (Space after complete length), **not** when all characters are correct.
- On advance, positional correct count is **banked** into `race.correctChars`.
- Live WPM uses banked correct chars + current station’s positional correct count over live elapsed time (`liveCorrect` / `liveWpm` around lines 292–299 in `App.tsx`).

### Implications for the five research questions (this project)

1. **Wrong char left in place:** Does not add to WPM; still occupies a slot so that position contributes 0. You can still advance and finish the line with typos.
2. **Backspace / fix:** Restores that position’s credit if fixed before advance; Backspace itself is not counted as a character; time spent fixing lowers WPM via `elapsedMs`.
3. **Gross / Net / raw / adjusted:** Only one metric today — effectively **correct-chars WPM** (neither classic Gross nor classic Net-with-error-rate). No raw/accuracy/consistency stats.
4. **Do incorrect keystrokes count toward character count?** **No** for WPM numerator.
5. **Does correction time affect WPM?** **Yes**, only through the time denominator (and by delaying finish). No separate error-rate subtraction.

**Closest analogues:** Monkeytype/10FF “correct output only” spirit, but StationTypeRace credits **partially correct stations** (positional chars) rather than requiring a **fully correct word/station**, and allows advancing with errors (unlike TypeRacer).

---

## 8. Implications / options if we change behavior (brief)

Not a plan — options only:

1. **Keep correct-chars WPM; require perfect station** before Space advances — closer to TypeRacer fairness; typos cannot be “length-skipped.”
2. **Keep length-advance; show Accuracy** separately (Typing.com style) so WPM stays speed-of-correct-chars and accuracy exposes sloppy finishes.
3. **Add Raw/Gross** = all typed chars (or all committed station lengths) ÷ 5 ÷ minutes — Monkeytype-like dual metric.
4. **Add classic Net** = Gross − (uncorrected errors / minutes) — employment-test familiar; needs a clear error definition (per wrong char? per imperfect station?).
5. **Whole-station credit only** (0 or full `target.length`) — closer to Monkeytype word rule; harsher than current positional credit.
6. **Forced correction caret** — block further input until Backspace fixes the current index — TypeRacer UX; largest gameplay change.

Tradeoff axis: **strictness of advance** vs **strictness of numerator** vs **extra metrics**. Current design is lenient on advance, strict on numerator (wrong chars don’t inflate WPM).

---

## 9. Sources

### Standards & definitions

- [Wikipedia — Words per minute](https://en.wikipedia.org/wiki/Words_per_minute) — 5-character word convention  
- [SpeedTypingOnline — Typing Equations](https://www.speedtypingonline.com/typing-equations) — Gross vs Net; corrected vs uncorrected errors; Backspace not counted; accuracy  
- [typingtesttool.com — Net WPM vs Gross WPM](https://www.typingtesttool.com/learn/net-wpm-vs-gross-wpm) — same Net formula with examples  

### Products

- [Monkeytype settings / about metrics](https://dev.monkeytype.com/account-settings) — wpm, raw, consistency definitions  
- [monkeytype `test-stats.ts` (commit 9799c386)](https://github.com/monkeytypegame/monkeytype/blob/9799c386/frontend/src/ts/test/test-stats.ts) — formulas in code  
- [DeepWiki — Monkeytype result calculation](https://deepwiki.com/monkeytypegame/monkeytype/2.1.4-result-calculation-and-display)  
- [TypeRacer Blog — 5 chars/word WPM](https://blog.typeracer.com/2008/05/19/new-speedometer-and-improved-cheat-protection/)  
- [TypeRacer Blog — server-side scoring / lag](https://blog.typeracer.com/2018/01/29/lag-on-typeracer-and-the-secret-to-unlocking-the-fastest-typeracer-scores/)  
- [TeachMe — How to play TypeRacer](https://teachmehelp.zendesk.com/hc/en-us/articles/5877690491543-How-to-play-TypeRacer) — must correct mistakes  
- [10FastFingers FAQ](https://10fastfingers.com/faq) — WPM, WPM Raw, accuracy with corrections  
- [Typing.com — How WPM and Accuracy are Calculated](https://support.typing.com/en/articles/9048321)  
- [Typing.com — What is WPM?](https://www.typing.com/blog/what-is-words-per-minute/) — removed Net×Accuracy  
- [Keybr confidence / WPM discussion](https://groups.google.com/g/keybr/c/7e9KWp5Rxds/m/BEokRdiZBAAJ)  
- [keybr.com source](https://github.com/aradzie/keybr.com)  

### This repo

- `web/src/lib/wpm.ts` — `calcWpm`  
- `web/src/App.tsx` — `countCorrectChars`, `advanceStation`, live WPM  

---

*End of research brief.*
