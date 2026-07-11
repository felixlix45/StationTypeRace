# Mobile responsive audit — 2026-07-11

**Scope:** Idle / Racing / Finished (+ share card, diagnostics, StationProgressRail)  
**Viewports tested:** 390×844, 360×640 (Playwright Chromium, `isMobile` + touch)  
**Also:** short-viewport race shell at 390×400 (soft-keyboard stand-in)

## Checklist

| Screen | Mobile ready? | Issues |
|--------|---------------|--------|
| **Idle / home** | **Yes** | Stacked line picker, full-width CTA, safe-area padding, no content overflow. Brand clamps cleanly. Backdrop credit dimmed / tucked (by design). |
| **Racing** | **Yes** (after fix) | HUD stacks; controls ≥44px tall; input `font-size ≥16px` (17.6px measured); fixed rail does **not** cover input at normal phone heights (gap ~80–270px). Soft-keyboard / short height: race shell now `height/max-height: 100dvh` + internal scroll so input can clear the rail. |
| **Finished / results** | **Mostly yes** | Board stacks to 1 col; share card ~280px / 9:16 fits; CTAs full-width (primary was narrower than siblings — fixed). Diagnostics panel usable; chart scrolls horizontally when needed. **Mid-redesign:** `ResultsDiagnostics` + share-card variants in flight (`SHARE_CARD_VARIANTS` / `shareVariant` unused in `App.tsx` → `tsc` fails). Do not restyle results heavily until that lands. |
| **Other full-page UI** | N/A | No share overlay / modal beyond in-flow finished. |

## What was already solid

- Viewport meta: `width=device-width, initial-scale=1, viewport-fit=cover`
- Breakpoints: 900 / 640 / 560 / 400 + landscape `max-height: 480px` + coarse-pointer tap rules
- Safe-area insets on app padding and fixed rail
- `overflow-x: clip` on html/body; racing overflow-y for keyboard
- Line picker → single column ≤640px; results board → single column ≤900px
- Station input iOS zoom guard: `font-size: max(1.1rem, 16px)`

## Gaps (non-critical / recommended)

1. **Rail label crowding** — current-station label widens (`max-width ~6.75rem`) over dense slots; neighbors can visually collide on long names. Acceptable for a map chrome; optional: hide non-current labels under ~400px or shrink current max-width.
2. **Perf stats 3×2 grid** — five metrics in three columns leaves an uneven last row; fine, not broken. Optional: 2-col on ≤360px for larger type.
3. **Duplicate `@media (max-width: 560px)` rail padding rules** — earlier block sets `5.75rem`, later sets `6.25rem` (winner). Consolidate when touching that area.
4. **Backdrop credit on finished** — “Approaching …” still shows (faded). Intentional landmark flavor; hide entirely on finished if it fights the CTA stack.
5. **Real-device keyboard** — Playwright short viewport ≠ iOS visualViewport. Spot-check Safari once; `scrollIntoView` on focus is a fallback if needed.

## Fixes applied this pass (CSS only)

| Fix | Why |
|-----|-----|
| `.app[data-phase='racing']` → `height/max-height: 100dvh` (+ landscape) | Short viewports grew `.app` past the window; internal scroll was ineffective. Now HUD scrolls above the fixed rail. |
| Idle/finished `overflow-x: clip` (explicit with `overflow-y: auto`) | Backdrop Ken Burns bleed widened `scrollWidth` when Y became a scroll container. |
| `.drone-backdrop` → `position: fixed` | Keeps bleed out of flow; backdrop stays viewport-pinned while results scroll. |
| Scope `max-width: 22rem` to **idle** primaries only | Finished “Save image” / “Retry” were ~22px narrower than sibling CTAs. |
| `.results { overflow-x: clip }` | SVG chart `<text>` nodes report inflated `scrollWidth` that can widen `.app` even when painted bounds fit. |

**Residual quirk:** `.app.scrollWidth` can still read ~402 on finished while `html.scrollWidth` stays 390 and painted UI stays in-bounds (SVG `<text>` scrollWidth inflation). Not user-visible horizontal scroll; left as-is rather than fighting the mid-flight results chart markup.

## Build note

`npm run build` currently fails on **unused** `SHARE_CARD_VARIANTS` / `shareVariant` in `App.tsx` from a concurrent share-card redesign — unrelated to these CSS fixes. Clear or wire those symbols when the redesign settles.
