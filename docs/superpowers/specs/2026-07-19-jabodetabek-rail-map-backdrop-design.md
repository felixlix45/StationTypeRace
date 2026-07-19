# Jabodetabek rail map backdrop — design

**Date:** 2026-07-19  
**Branch:** `feature/jabodetabek-rail-map-backdrop`  
**Status:** Approved for implementation planning  

## Goal

Replace the drone photo/video backdrop with a simple, real-geography schematic map of Greater Jakarta (Jabodetabek). The map shows playable rail tracks, highlights the selected line, draws kota borders along the network, and places race progress on that line. The existing bottom `StationProgressRail` remains as the precise 1D progress UI.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Race background | Map **replaces** drone entirely |
| Phases | Map in **idle, racing, and finished** (drone leaves live UX) |
| Bottom rail | **Keep both** — map is geographic; `StationProgressRail` stays |
| Network visibility | **All** playable lines muted; selected line bright/thicker |
| Station markers | Dots for **every stop on the selected line**; other lines track-only |
| Geographic extent | Jabodetabek-centered network extent (not all of Java) |
| Borders | Real **kota** borders: DKI’s 5 kota + other **kota** the playable network enters; **no kabupaten** |
| Labels / separators | Hairline/dashed kota borders on white land (not full Java admin clutter) |
| Camera idle | Frame the line currently selected/hovered in the picker |
| Camera race | Zoomed in; **follows** train progress along the selected path |
| Camera finished | Pull back to frame the **whole completed line** |
| Rendering approach | **Authored SVG / path JSON** from real geo at build time + animated `viewBox` (Approach 1) |
| Live OSM / map SDK | **Out of scope** — no runtime OSM, no MapLibre/Mapbox |
| Color contrast | **WCAG 2.2 Level AA** for text, UI chrome, and meaningful map graphics |

## Architecture

Replace `DroneBackdrop` as the global visual plane with `RailMapBackdrop`.

```
[RailMapBackdrop]          full-bleed map + camera
[scrim / readability tint]
[app chrome]               picker / race / results / share
[StationProgressRail]      race only — unchanged role
```

| Unit | Responsibility | Depends on |
|---|---|---|
| Map assets (`web/src/data/railMap/`) | Checked-in coast, kota borders, line paths, station points | Build-time geo extract |
| `RailMapBackdrop` | Render land, borders, muted network, highlight, dots, marker | Assets + selection + progress |
| Camera controller | Animate SVG `viewBox` (or equivalent) for idle / follow / finish | Selected line path + progress |
| Race state (existing) | `selectedLine`, station index, distance progress | Unchanged game logic |
| `StationProgressRail` | Precise 1D stop-by-stop progress | Existing `segmentKm` |

**Removed from live UX:** drone video/photo backdrop in all phases. Media under `web/public/drone/` may remain unused in v1 (no mandatory delete).

**Data flow**

- Idle: picker selection/hover → `lineId` → highlight + frame that path.
- Racing: same `lineId` + existing distance/station progress → marker on path + camera follow.
- Finished: marker at final station → camera eases to full-line frame.

## Map data & assets

### Build-time pipeline (real geo, not live)

1. Extract/simplify from OSM (or equivalent offline extract): land/coast for the framed extent, rail ways for playable lines, station nodes, kota admin boundaries.
2. Project into a shared SVG coordinate system.
3. Emit checked-in assets under `web/src/data/railMap/` (SVG and/or JSON). Runtime never fetches map tiles or OSM.

### What ships

| Asset | Content |
|---|---|
| Land silhouette | White / near-white filled coast shape |
| Kota borders | DKI: Jakarta Pusat, Utara, Barat, Selatan, Timur; plus every other **kota** that any playable line enters (e.g. Depok, Bogor, Tangerang, Bekasi, and further kota on long KRL legs). Thin dashed/hairline. |
| Line paths | One polyline/path per `StationLine.id` |
| Stations | `{ lineId, name, x, y }` aligned to names in `web/src/data/stations.ts` |

### Runtime model

- `RailMapNetwork`: paths, stations, border paths, default full-frame `viewBox`.
- Lookup by `lineId` for highlight, station dots, and path-length progress.
- Map progress uses the same ordering and distance progress as the race (`stations` / `segmentKm` → position along path).

### Out of scope (v1)

- Live OSM / network tile fetching
- Kabupaten borders
- Full Java island admin map
- Roads, POIs, non-playable rails
- User pan/zoom controls

## Camera & progress

### Idle

- Highlight and frame the picker-selected/hovered line (padding around path).
- Other lines muted; station dots only on the framed line.
- Progress marker parked at the first station of the framed line (not animating).
- Mobile (no hover): frame the currently selected / start-target line.

### Racing

- Tighter zoom on the active corridor.
- Camera follows the progress marker with smooth easing (not hard snap per stop).
- Selected line: brand color from `stations.ts`, thicker stroke, all station dots.
- Other lines: muted tracks only.
- `StationProgressRail` remains at the bottom.

### Finished

- Ease camera out to frame the entire completed line.
- Marker rests at the final station.

### Shared camera rules

- Implementation: animated SVG `viewBox` (or equivalent transform).
- Clamp framing so the view stays on land/network context (avoid empty ocean).
- Minimum zoom so short downtown lines (e.g. MRT) do not over-zoom into illegible mush.
- `prefers-reduced-motion`: reduce/disable easing; still show the correct frame.

## UI layering & visual treatment

**Look**

- Land: flat white / near-white; water: slightly cooler or darker void.
- Kota borders: thin dashed hairlines (decorative; may sit below AA if they are non-essential).
- Muted lines: thin, lower emphasis — treated as **non-essential decoration**; must not be the only way to understand selection.
- Selected line: line `color` from `stations.ts`, thicker; must meet non-text contrast (below). Adjust shade if brand hex fails on white land.
- Station dots: small; current stop may be slightly emphasized; selected-line dots/marker must meet non-text contrast.
- Progress marker: small filled dot on the path (v1). Must not compete with the typing prompt; pixel-train accent is optional later.

**Color contrast (WCAG 2.2 Level AA)**

| Surface | Requirement |
|---|---|
| Body / UI text over map + scrim | ≥ **4.5:1** against the effective background behind the text |
| Large text / bold display (≥18pt or ≥14pt bold) | ≥ **3:1** |
| Meaningful non-text graphics (selected line stroke, progress marker, current-station emphasis, primary controls/icons) | ≥ **3:1** against adjacent colors (land and/or scrim as drawn) |
| Focus indicators on interactive chrome | ≥ **3:1** |

Rules:

- Scrim opacity/color is part of contrast: measure text against the **composited** backdrop (map + scrim), not against pure white in isolation.
- If a line brand color fails 3:1 on white land, use a darkened/lightened AA-safe variant for the map stroke while keeping the brand identity recognizable; document the map stroke hex next to the brand color if they differ.
- Muted network + kota borders may be softer than AA **only if** selection/progress remain clear via the AA-compliant selected stroke, marker, and chrome (color is not the sole cue — thickness/weight also differ).
- Do not rely on color alone for “which line is selected”: selected line is also thicker; marker + station dots reinforce state.

**Readability**

- Soft scrim/gradient above the map so prompt, input, and chrome remain readable over dense central Jakarta, while meeting the AA table above.
- Preserve existing mobile keyboard / `visualViewport` behavior; map is non-interactive for pointer focus.

## Edge cases & failures

| Case | Behavior |
|---|---|
| OSM/game station name mismatch | Build warns or fails CI check where possible; runtime interpolates missing stops along the path between neighbors — typing never blocked |
| List hops ≠ real graph (e.g. Bogor→Nambo, Cikarang loop) | Path follows **game station order** |
| Missing / corrupt map asset | Flat fallback background + warning; race remains playable |
| Zero-length / bad path | Hide marker; keep network if possible |
| Reduced motion | Instant or shortened camera transitions |

## Testing

- **Unit:** progress → path point; viewBox framing for idle / mid-race / finished; line id → path/stations lookup.
- **Manual:** each playable line — idle frame, race follow, finish pullback; confirm bottom rail still agrees directionally with map marker; mobile keyboard usability.
- **Visual smoke:** white land, kota borders visible, selected line highlighted, muted network present.
- **Contrast check:** verify selected stroke, progress marker, and primary race/idle text against composited scrim meet WCAG 2.2 AA (4.5:1 text / 3:1 non-text).

## Non-goals / YAGNI

- Replacing or redesigning share cards around the map
- Interactive map gestures
- Real-time vehicle positions
- Redrawing non-playable national rail
- Deleting drone media in the first implementation PR (optional cleanup later)

## Implementation notes (for planning)

- Prefer a focused `RailMapBackdrop` (+ small camera/progress helpers) over expanding `App.tsx` further.
- Keep `stations.ts` as the game authority for stop names and colors; map assets must key off those ids/names.
- Approach explicitly rejects MapLibre/Mapbox for this schematic backdrop (bundle, WebGL, prior research direction).
