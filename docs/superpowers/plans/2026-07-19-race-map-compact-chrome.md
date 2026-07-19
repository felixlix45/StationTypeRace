# Race map–first compact chrome

**Status:** implemented  
**Branch:** `feature/jabodetabek-rail-map-backdrop` (or follow-up branch)  
**Date:** 2026-07-19  

## Goal

Make the typing (race) screen **map-first**: more of the rail map visible, progress shown with a **train head** on the map, selected line less heavy, and typing UI compacted into a **slim top header + bottom strip** above the progress rail — friendly on **mobile and desktop**.

## Locked decisions

| Topic | Choice |
|---|---|
| Layout priority | Map is the main view |
| Typing chrome | **Option C** — slim top header (line name + WPM) + compact prompt/input above bottom progress rail |
| Map progress marker | Reuse `PixelTrainHead` (same as `StationProgressRail`) |
| Race camera zoom | **Medium** — `zoomSize` ≈ **40–45%** of min world dimension (today ~22%) |
| Selected line stroke | Thinner — ≈ **2.5px** overlay (today 5px); muted stays ~1.25px |
| Platforms | Mobile-first; desktop uses the same structure with wider strip |

## Current state (baseline)

- `RailMapBackdrop` race zoom: `zoomSize = minDim * 0.22`, marker = filled circle (`RailMapBackdrop.tsx`)
- Overlay selected stroke width `5`
- Race UI stacks vertically: `.race-top` + controls + prompt panel + input dock + `.progress-rail` (`App.tsx` / `App.css`) — consumes vertical space over the map
- Soft keyboard: `[data-kb='open']` docks prompt/input; must keep usable after compaction

## Design

### Visual hierarchy (race)

```
┌─────────────────────────────────────┐
│ Slim header: line meta · WPM/acc   │  short (~40–48px)
├─────────────────────────────────────┤
│                                     │
│         MAP (dominant)              │  medium follow-zoom
│         PixelTrainHead on path      │
│                                     │
├─────────────────────────────────────┤
│ Compact strip: prompt | input       │  horizontal, low height
├─────────────────────────────────────┤
│ StationProgressRail (unchanged)     │
└─────────────────────────────────────┘
```

Idle / finished: unchanged by this plan (full network idle; finished full-line frame).

### Map behavior (race only)

1. Increase `zoomSize` from `0.22` → **`0.42`** (tunable constant `RACE_ZOOM_FRAC`).
2. Replace circle marker with **`PixelTrainHead`** positioned at `markerPoint`, oriented along path tangent when cheap (optional v1: fixed upright; v1.1: rotate by segment angle).
3. Selected stroke **5 → 2.5**; keep AA via existing overlay-above-scrim + `mapStrokeColor`.
4. Station dots: slightly smaller on race (e.g. r 3) so line reads thinner/realistic.

### Chrome compaction

1. **Slim header** — keep line system/name (truncated) + live WPM/accuracy; fold or shrink session controls into a compact overflow/menu or icon row so they don’t steal map height.
2. **Bottom strip** — single horizontal band: station prompt (left/center) + input (flex grow); reduce paddings/fonts vs current `.station-prompt-panel`.
3. **Desktop** — same bands; strip can be wider/max-width centered; map still fills behind.
4. **Mobile keyboard open** — preserve dock-above-keyboard behavior: header can hide or shrink further; strip + rail stay above `visualViewport`; map still visible in remaining area when possible.

### Non-goals

- Removing `StationProgressRail`
- Changing idle wide-map / hover-highlight behavior
- Replacing share card / finished layout
- Full OSM track centreline polylines

## Implementation tasks

### Task 1 — Race camera + train head marker

**Files:** `web/src/components/RailMapBackdrop.tsx`, `web/src/lib/railMapCamera.ts` (only if constants/helpers), `PixelTrain.tsx` (import)

- Add `RACE_ZOOM_FRAC = 0.42`, `SELECTED_STROKE_RACE = 2.5`
- Render `PixelTrainHead` at marker; size ~14–18px CSS so it doesn’t dominate
- Unit/manual: marker still follows `stationIndex`/`typedFraction`

### Task 2 — Compact race chrome (layout C)

**Files:** `web/src/App.tsx`, `web/src/App.css`

- Restructure racing section into: `race-header-slim` + map (backdrop already full-bleed) + `race-type-strip` + keep `StationProgressRail`
- Reduce vertical padding; horizontal flex for prompt/input
- Retune `[data-kb='open']` rules for the new strip (no regression on iOS/Android keyboard)

### Task 3 — Mobile + desktop verification

- Manual: short line (Tanjung Priok) + longer (MRT) on ~390px width and desktop
- Keyboard open: prompt/input usable; train head visible on map when kb closed / partially when open
- WCAG: header/strip text still ≥4.5:1 over map+scrim (adjust strip scrim/plate if needed)

## Test plan

- [x] Race zoom feels medium (more corridor than today, not full-line idle)
- [x] Selected line thinner; still clearly the active line
- [x] `PixelTrainHead` moves with typing; bottom rail train still works
- [x] Option C layout on mobile + desktop
- [x] Soft keyboard: can type and advance; no overlap with rail
- [x] `npm test` / `npm run build` / `npm run lint` green

## Risks

| Risk | Mitigation |
|---|---|
| Compact strip too small to type on mobile | Min tap height 44px on input; prompt can shrink to one line |
| Train head hard to see under scrim | Draw on overlay SVG (above scrim), slight land stroke |
| Keyboard mode hides map completely | Prefer shrinking header first; keep strip+rail docked |

## Out of scope follow-ups

- Path-tangent rotation for train head
- Hiding bottom rail entirely (user said keep map progress + rail earlier)
