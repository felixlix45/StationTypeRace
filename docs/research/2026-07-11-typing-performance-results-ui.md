# Research Brief: End-of-Session Performance UI

**Date:** 2026-07-11  
**Purpose:** How major typing products present post-session results (stats, charts, error/accuracy), and what StationTypeRace should show on the finished / share-card page.  
**Status:** Research only — no UI implementation

---

## 1. Executive summary + recommendation

Typing products split results into two jobs:

| Job | What users need | Typical surface |
|-----|-----------------|-----------------|
| **Brag / share** | One hero number + 1–3 supporting facts + identity of the run | Share card, caption, Story PNG |
| **Understand / improve** | Breakdown, chart, where errors happened | On-screen results panel (often below or instead of the card) |

Monkeytype is the gold standard for **understand**: large WPM, raw, accuracy, consistency, `correct / incorrect / extra / missed` chars, plus a time-series chart (global avg WPM vs momentary raw, error markers). 10FastFingers and TypeRacer keep the **immediate** finish screen leaner (WPM + accuracy + word/keystroke counts or place). Employment-style tests emphasize Gross / Net / errors-per-minute.

**StationTypeRace today** already ships share-first: 9:16 card with Average WPM, accuracy, raw, elapsed, station list (`web/src/components/ShareCard.tsx`), plus save/share/retry. Scoring already matches Monkeytype-style dual speed + keystroke accuracy (`web/src/lib/wpm.ts`, `App.tsx` race state). What is missing is the **understand** layer: no chart, no per-station timing/errors, no error-rate / perfect-station count beyond what’s inferable from WPM vs raw.

### Recommendation (for a later implementation pass)

1. **Keep the share card lean** — do not put a full Monkeytype chart on the PNG. Stories need a readable hero at arm’s length: brand, line, **WPM**, accuracy, time (raw optional in the meta row — already there).
2. **Add an interactive results panel below the card** on the finished page — this is where charts and diagnostics belong.
3. **Primary chart: per-station WPM bars** (discrete X = stations), not a per-second Monkeytype clone. Lines are 5–24+ stops; station boundaries are the product’s natural unit of progress (same rail metaphor as `StationProgressRail`).
4. **Must-show metrics on-screen:** WPM, raw WPM, accuracy, elapsed, incorrect keystrokes (or error rate), perfect-station count / rate.  
   **Nice-to-have:** consistency, cumulative WPM line, slowest/error stations callouts, classic EPM / Net only if we define uncorrected errors clearly.
5. **Instrument during the race** (minimal): timestamp + error delta + perfect flag **per station advance** — enough for charts without full keystroke replay.

---

## 2. Metrics worth showing (given data we can track)

### Already computed at finish

From `finishRace` / `ShareResult` (`web/src/App.tsx`, `web/src/lib/shareCard.ts`):

| Metric | Source | Share card today |
|--------|--------|------------------|
| **WPM** | `calcWpm(correctChars, elapsed)` — banked chars from **fully correct** stations only | Hero |
| **Raw WPM** | `calcWpm(correctKeystrokes + incorrectKeystrokes, elapsed)` | Meta row |
| **Accuracy** | `correct / (correct + incorrect)` keystrokes | Meta row |
| **Elapsed** | `endedAt - startedAt` | Meta row |
| **Correct chars** | Banked perfect-station lengths | In `ShareResult`, not prominently labeled on card |
| **Line / stations** | Route identity + name list | Yes |

Keystroke tallies already exist live (`correctKeystrokes`, `incorrectKeystrokes`); backspace does not change them (`onInputChange`).

### Must-have (finished page — on-screen)

| Metric | Why | Data needed |
|--------|-----|-------------|
| **WPM** | Primary competitive score (already share hero) | Have |
| **Accuracy %** | Separates clean runs from sloppy ones at same WPM | Have |
| **Raw WPM** | Shows “error tax” vs WPM (Monkeytype / 10FF pattern) | Have |
| **Time** | Context for short vs long lines | Have |
| **Incorrect keystrokes** (or **errors**) | Concrete count; accuracy alone is abstract | Have (`incorrectKeystrokes`) |
| **Perfect stations / total** | Product-specific: WPM only banks perfect stations — users need to see how many stops “counted” | Derive: bank on advance when `isStationCorrect` (today only banked into `correctChars`; need a count or reconstruct) |

### Nice-to-have

| Metric | Why | Data needed |
|--------|-----|-------------|
| **Error rate (EPM)** | Employment-test language: errors ÷ minutes | `incorrectKeystrokes / minutes` (or uncorrected only — see prior WPM brief) |
| **Consistency** | Monkeytype differentiator; rewards steady rhythm | Variance of per-station or per-second raw WPM |
| **Per-station WPM** | “Which stop slowed you down?” | Duration + credited chars per station |
| **Per-station errors** | Error heatmap / callouts | Incorrect keystroke delta per station |
| **Char stats** (correct / incorrect / extra / missed) | Monkeytype depth | Extra/missed less natural here (input capped to station length); correct vs incorrect keystrokes + imperfect-station leftover chars are enough |
| **Classic Net WPM** | Familiar in hiring tests | Needs clear *uncorrected* error definition; optional later |
| **PB / Δ vs last run on same line** | Retention loop | Local storage of best WPM per `line.id` |

### Not worth leading with (for v1)

- Full Monkeytype **extra / missed** (advance is length-capped; missed chars are rare).
- Per-key Keybr heatmaps (tutor product; weak fit for a shareable rail race).
- Placement / multiplayer place (no race opponents yet).
- Gross−errors Net as the *primary* number (would conflict with current Monkeytype-style WPM; keep as optional footnote if ever added).

---

## 3. How major products display results

### Monkeytype (benchmark for analytics)

**Finish screen content** (product about copy + result pipeline):

- Large **wpm**, **raw**, **accuracy**, **consistency**
- **Character stats:** correct / incorrect / extra / missed
- Test length / mode info; hover for decimals
- **Chart:** solid line = global average WPM over time; dashed = local/momentary raw (drops to 0 if you stop); error scatter on a second axis; optional PB horizontal line

Sources:

- [Monkeytype about / metric definitions](https://dev.monkeytype.com/account-settings) — “After completing a test you will be able to see your wpm, raw wpm, accuracy, character stats… You can also see a graph of your wpm and raw… the wpm line is a global average, while the raw wpm line is a local, momentary value”
- [DeepWiki — Result calculation and display](https://deepwiki.com/monkeytypegame/monkeytype/2.1.4-result-calculation-and-display) — chart datasets (`wpm`, `raw`, `burst`, `error`), `charStats`, consistency via coefficient of variation
- [`result.ts` / `test-stats.ts` / `chart-controller.ts`](https://github.com/monkeytypegame/monkeytype) — implementation

**UX takeaway:** Analytics *are* the finish screen. Sharing is secondary (screenshot / history). Charts assume continuous time samples (~1 Hz WPM history).

### 10FastFingers

**Immediate result** (widget / test completion):

- **WPM** (hero)
- **Keystrokes** as `(correct | wrong) total`
- **Correct words** / **Wrong words**

Accuracy is documented mainly for **text practice** (mistakes + corrections in the denominator). No rich post-test time-series chart on the classic 60s test.

Sources:

- [10FastFingers FAQ](https://10fastfingers.com/faq) — WPM, WPM Raw, accuracy formulas
- [Custom typing-test widget result table](https://10fastfingers.com/widget/typingtest?dur=60&rand=1&words=a) — WPM + keystrokes + correct/wrong words

**UX takeaway:** Fast, countable summary; charts not required for “I just finished.”

### TypeRacer

**Per-race presentation:**

- During race: progress along the track (forced correction — cannot leave typos).
- After race: **WPM**, **accuracy**, **points**, **place** (multiplayer).
- Profile / history: tabular race list (speed, accuracy, place, date) — rich charts mostly via third-party tools.

Sources:

- [TeachMe — How to play TypeRacer](https://teachmehelp.zendesk.com/hc/en-us/articles/5877690491543-How-to-play-TypeRacer) — must erase mistakes
- [TypeRacer profile / race history UI](https://data.typeracer.com/pit/profile?user=frnklin) — WPM + accuracy + place rows
- [TypeRacer Blog — 5 chars/word](https://blog.typeracer.com/2008/05/19/new-speedometer-and-improved-cheat-protection/)

**UX takeaway:** Race identity + WPM + accuracy is enough for the moment; deep charts live in history, not the share moment.

### Keybr

**Lesson / profile analytics** (tutor, not race):

- Per-key speed, accuracy, miss-to-hit histograms
- Learning-progress / frequency heatmaps
- Adaptive weak-key practice

Sources:

- [keybr.com](https://www.keybr.com/)
- [aradzie/keybr.com README](https://github.com/aradzie/keybr.com)

**UX takeaway:** Heatmaps teach *keys*, not *runs*. Useful inspiration for “where did I struggle?” only if remapped to **stations**, not letters.

### SpeedTypingOnline / employment-style

**Reported metrics:**

- **Gross (Raw) WPM** — all keyed characters ÷ 5 ÷ minutes (Shift/Backspace not counted)
- **Net WPM** — Gross − (uncorrected errors / minutes)
- **Accuracy** — correct / total entries (counts corrected errors too)
- **Error rate** — errors per minute

Source: [SpeedTypingOnline — Typing Equations](https://www.speedtypingonline.com/typing-equations)

**UX takeaway:** Net + EPM speak to “productivity” audiences; StationTypeRace already chose Monkeytype-style correct-output WPM (see prior brief). Prefer showing **raw vs WPM + accuracy** over renaming the hero score to Net.

### Share-card pattern (adjacent products)

Share surfaces optimize for **one glance**: big WPM/grade, accuracy, short context; detailed charts stay on the results screen. Examples: CookTap (terminal typing) generates separate share PNGs from a richer results screen; Monkeytype-style clones keep the chart interactive on-page.

Sources (illustrative, not StationTypeRace competitors): [CookTap share modes](https://github.com/0xagentkitchen/cooktap); [VeloType results](https://github.com/Mohit-Bagri/velotype) (chart + stats on results page).

---

## 4. Chart types that fit short station-by-station races

Lines in this app are **discrete stops** (~5–24+ stations), not a fixed 15–60s continuous stream. That changes chart choice.

| Chart | Fit for StationTypeRace | Notes |
|-------|-------------------------|-------|
| **Per-station WPM bar** | **Best primary chart** | X = station index/name; Y = WPM for that stop (`creditedChars / 5 / stationMinutes`). Highlights long names / typos. Works at n=5 and n=20. |
| **Cumulative / running WPM line** | Strong secondary | Monkeytype’s “global average” idea, but sampled at station boundaries instead of every second. Smooths noise on very short stops. |
| **Per-station error bars / dots** | Strong diagnostic | Incorrect keystrokes (or imperfect flag) per stop — rail-themed “heatmap” without a keyboard. |
| **Per-second WPM + raw (Monkeytype)** | Optional later | Needs continuous sampling; overkill for a 20s–2min rail race unless we want parity with Monkeytype fans. |
| **Sparkline on share PNG** | Weak | Hard to read at Story size; export cost; conflicts with card’s brand composition. Prefer numeric meta. |
| **Key heatmap** | Poor fit for v1 | Keybr territory; station names repeat letters unevenly. |

**Recommended combo for the on-screen panel:**

1. Bar chart: per-station WPM (color bars for imperfect stations differently).
2. Optional overlay or second row: error count per station.
3. Small sparkline *only* in the interactive panel (SVG), never as the share hero.

---

## 5. Share card vs results page split

### Stay on the 9:16 PNG (share card)

Preserve current composition (`ShareCard.tsx`): brand → train → line identity → **hero WPM** → meta → station chips.

| Include | Reason |
|---------|--------|
| Average WPM | Social currency |
| Accuracy | One-glance quality |
| Elapsed | Fairness context across short/long lines |
| Raw (compact meta) | Already present; optional to demote if meta feels crowded |
| Line name / system / route | Product identity (Jakarta rail) |
| Station preview chips | Flavor, not analytics |

| Avoid on PNG | Reason |
|--------------|--------|
| Full WPM/raw dual chart | Unreadable in Stories; clutters brand-first card |
| Char breakdown tables | Too dense for 9:16 |
| Consistency / EPM / tooltips | Interactive-only |
| Long station list beyond preview cap | Already capped at 8 |

Caption already carries WPM + accuracy (`shareCaption` in `shareCard.ts`) — keep aligned with card hero.

### Below the card (interactive results panel)

| Include | Reason |
|---------|--------|
| Repeat headline stats (WPM / raw / acc / time) | Don’t force zoom into the card |
| Incorrect keystrokes + perfect stations X/N | Explains WPM banking rule |
| Per-station WPM chart | “How did I perform along the line?” |
| Slowest station / most errors callout | Actionable without a full history product |
| Retry / next line CTAs | Already present — keep adjacent |

Layout sketch (not implementing):

```text
[ results kicker + brand ]
[ ShareCard 9:16 ]
[ Save | Share ]
[ Stats strip: WPM · Raw · Acc · Time · Errors · Perfect stops ]
[ Per-station WPM chart ]
[ Retry | Next | Back ]
```

---

## 6. Implementation sketch (instrumentation only)

No UI code in this task — data to collect during the race so charts are possible later.

### Per-station sample (on each successful `advanceStation`)

```ts
type StationSample = {
  index: number
  name: string
  startedAt: number      // when this station became current (or first key)
  endedAt: number        // advance time
  durationMs: number
  targetLen: number
  perfect: boolean       // isStationCorrect
  creditedChars: number  // targetLen if perfect else 0 (matches WPM bank)
  incorrectDelta: number // incorrectKeystrokes since station start
  correctDelta: number   // correctKeystrokes since station start
  stationWpm: number     // calcWpm(creditedChars, durationMs) — or use correctPrefix policy
}
```

### Race-level aggregates (finish)

- Existing: `correctChars`, keystroke tallies, elapsed, WPM / raw / accuracy  
- Add: `stationSamples: StationSample[]`, `perfectStations`, `errorRate = incorrectKeystrokes / (elapsedMs/60000)`  
- Optional consistency: `kogasa`-style CV of `stationWpm` or of per-station raw (Monkeytype maps CV → 0–100)

### Sampling notes

- Start station clock on first key of that station (or on previous advance) — document the choice; first-key matches “typing time” better than including idle between Space and next key.
- Do **not** need full keystroke replay for v1 charts.
- Share card can keep using `ShareResult` as-is; panel reads `stationSamples` from race state.

### Mapping to current code

| Location | Change (later) |
|----------|----------------|
| `RaceState` | Add `stationSamples`, per-station counters |
| `advanceStation` | Push sample; bank perfect count |
| `finishRace` | Attach samples to finished state / panel props |
| `ShareCard` / `ShareResult` | Unchanged for v1 PNG |
| New `ResultsPanel` | Consume samples + headline stats |

Prior scoring research: [`docs/research/2026-07-11-wpm-errors-and-corrections.md`](./2026-07-11-wpm-errors-and-corrections.md).

---

## 7. Sources

### Products & formulas

- [Monkeytype about — result metrics & graph semantics](https://dev.monkeytype.com/account-settings)
- [DeepWiki — Monkeytype result calculation and display](https://deepwiki.com/monkeytypegame/monkeytype/2.1.4-result-calculation-and-display)
- [Monkeytype `test-stats.ts` / `result.ts` (GitHub)](https://github.com/monkeytypegame/monkeytype)
- [10FastFingers FAQ](https://10fastfingers.com/faq)
- [10FastFingers widget result fields](https://10fastfingers.com/widget/typingtest?dur=60&rand=1&words=a)
- [TypeRacer — How to play](https://teachmehelp.zendesk.com/hc/en-us/articles/5877690491543-How-to-play-TypeRacer)
- [TypeRacer Blog — WPM = chars/5](https://blog.typeracer.com/2008/05/19/new-speedometer-and-improved-cheat-protection/)
- [TypeRacer profile / race history](https://data.typeracer.com/pit/profile?user=frnklin)
- [SpeedTypingOnline — Typing Equations](https://www.speedtypingonline.com/typing-equations) — Gross / Net / accuracy / EPM
- [keybr.com](https://www.keybr.com/) / [keybr source](https://github.com/aradzie/keybr.com)

### Adjacent UX (share vs analytics)

- [CookTap — results screen vs share PNG](https://github.com/0xagentkitchen/cooktap)
- [VeloType — post-test chart + stats](https://github.com/Mohit-Bagri/velotype)

### This repo

- `web/src/lib/wpm.ts` — `calcWpm`, `calcAccuracy`, `isStationCorrect`
- `web/src/lib/shareCard.ts` — `ShareResult`, caption, PNG capture
- `web/src/components/ShareCard.tsx` — finished card layout
- `web/src/App.tsx` — race state, keystroke tallies, finished section
- `docs/research/2026-07-11-wpm-errors-and-corrections.md` — scoring model background
- `web/src/data/stations.ts` — line lengths (discrete station counts)

---

*End of research brief.*
