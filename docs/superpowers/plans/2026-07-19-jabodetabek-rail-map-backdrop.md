# Jabodetabek Rail Map Backdrop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the drone backdrop with a real-geo-derived Jabodetabek SVG rail map that highlights the selected line, draws kota borders, and follows race progress with a camera, while keeping `StationProgressRail`.

**Architecture:** Build-time GeoJSON → projected `network.json`; runtime `RailMapBackdrop` renders SVG layers and animates `viewBox` from pure camera helpers fed by existing `distanceProgress` + picker preview line id. No MapLibre/OSM at runtime.

**Tech Stack:** React 19, Vite 8, TypeScript, Vitest (new), Node build script (no map SDK).

**Spec:** `docs/superpowers/specs/2026-07-19-jabodetabek-rail-map-backdrop-design.md`

## Global Constraints

- WCAG 2.2 Level AA: text ≥ 4.5:1 over composited scrim; selected stroke / marker / emphasis ≥ 3:1 vs adjacent land
- Map in idle + racing + finished; drone leaves live UX (files may remain unused)
- Keep `StationProgressRail` on race
- All playable lines muted; selected thicker + brand-derived AA-safe color
- Station dots only on selected/framed line
- Kota borders only (DKI 5 + other kota the network enters); no kabupaten
- Camera: idle frames picker line; race zooms + follows progress; finished frames whole line
- Path follows **game station order** in `stations.ts`, not raw OSM topology when they disagree
- Commit subjects: `add:` / `update:` / `fix:` only (one line)
- Never stage `.claude/` paths

## File structure

| Path | Responsibility |
|---|---|
| `web/src/data/railMap/types.ts` | Shared TS types for network asset |
| `web/src/data/railMap/network.json` | Checked-in projected map (runtime) |
| `web/src/data/railMap/source/` | Lon/lat GeoJSON inputs for the build script |
| `web/scripts/build-rail-map.mjs` | Project source → `network.json` |
| `web/src/lib/railMapGeometry.ts` | Polyline length, point-at-progress, bounds |
| `web/src/lib/railMapCamera.ts` | ViewBox framing for idle / race / finished |
| `web/src/lib/railMapContrast.ts` | AA-safe stroke color adjustment |
| `web/src/components/RailMapBackdrop.tsx` | Full-bleed SVG map + marker + viewBox |
| `web/src/App.tsx` | Swap backdrop; preview line; pass progress |
| `web/src/App.css` | Map/scrim styles; retire live drone dependency |
| `web/src/lib/*.test.ts` | Vitest unit tests |
| `web/vite.config.ts` | Vitest config |
| `web/package.json` | `test` script + vitest |

---

### Task 1: Add Vitest

**Files:**
- Modify: `web/package.json`
- Modify: `web/vite.config.ts`
- Create: `web/src/lib/railMapGeometry.test.ts` (placeholder assertion removed in Task 2)

**Interfaces:**
- Consumes: none
- Produces: `npm test` runs Vitest via Vite

- [ ] **Step 1: Install Vitest**

Run from `web/`:

```bash
npm install -D vitest
```

- [ ] **Step 2: Add test script and Vitest config**

In `web/package.json` scripts, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

In `web/vite.config.ts`, change the import and config to:

```ts
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8')) as {
  version: string
}

function gitShortSha(): string {
  const fromEnv =
    process.env.VITE_GIT_COMMIT?.trim() || process.env.CF_PAGES_COMMIT_SHA?.trim()
  if (fromEnv) return fromEnv.slice(0, 7)

  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'dev'
  }
}

const appVersion = pkg.version
const gitCommit = gitShortSha()

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __GIT_COMMIT__: JSON.stringify(gitCommit),
  },
  server: {
    allowedHosts: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

Add a triple-slash reference at the top of `vite.config.ts` if TS complains about `test`:

```ts
/// <reference types="vitest/config" />
```

- [ ] **Step 3: Smoke test file**

Create `web/src/lib/railMapGeometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Run tests**

Run: `npm test`  
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add web/package.json web/package-lock.json web/vite.config.ts web/src/lib/railMapGeometry.test.ts
git commit -m "add: vitest for rail map unit tests"
```

---

### Task 2: Polyline geometry helpers

**Files:**
- Create: `web/src/lib/railMapGeometry.ts`
- Modify: `web/src/lib/railMapGeometry.test.ts`
- Create: `web/src/data/railMap/types.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export type RailMapPoint = { x: number; y: number }`
  - `export function polylineLength(points: RailMapPoint[]): number`
  - `export function pointAtProgress(points: RailMapPoint[], progress: number): RailMapPoint`
  - `export function boundsOfPoints(points: RailMapPoint[]): { minX: number; minY: number; maxX: number; maxY: number }`
  - `export function viewBoxFromBounds(bounds, padding: number, minSize: number): { x: number; y: number; w: number; h: number }`

- [ ] **Step 1: Write failing tests**

Replace `web/src/lib/railMapGeometry.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import {
  boundsOfPoints,
  pointAtProgress,
  polylineLength,
  viewBoxFromBounds,
} from './railMapGeometry'

const unit: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 50 },
]

describe('polylineLength', () => {
  it('sums segment lengths', () => {
    expect(polylineLength(unit)).toBe(150)
  })

  it('returns 0 for fewer than 2 points', () => {
    expect(polylineLength([{ x: 1, y: 1 }])).toBe(0)
  })
})

describe('pointAtProgress', () => {
  it('returns start at 0', () => {
    expect(pointAtProgress(unit, 0)).toEqual({ x: 0, y: 0 })
  })

  it('returns end at 1', () => {
    expect(pointAtProgress(unit, 1)).toEqual({ x: 100, y: 50 })
  })

  it('interpolates mid-path', () => {
    // 100/150 along first segment
    const p = pointAtProgress(unit, 100 / 150)
    expect(p.x).toBeCloseTo(100)
    expect(p.y).toBeCloseTo(0)
  })

  it('clamps out of range', () => {
    expect(pointAtProgress(unit, -1)).toEqual({ x: 0, y: 0 })
    expect(pointAtProgress(unit, 2)).toEqual({ x: 100, y: 50 })
  })
})

describe('viewBoxFromBounds', () => {
  it('pads and enforces min size', () => {
    const b = boundsOfPoints([
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ])
    const vb = viewBoxFromBounds(b, 5, 40)
    expect(vb.w).toBeGreaterThanOrEqual(40)
    expect(vb.h).toBeGreaterThanOrEqual(40)
    expect(vb.x).toBeLessThanOrEqual(10)
    expect(vb.y).toBeLessThanOrEqual(10)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test`  
Expected: FAIL — cannot find module `./railMapGeometry`

- [ ] **Step 3: Add types + implementation**

Create `web/src/data/railMap/types.ts`:

```ts
export type RailMapPoint = { x: number; y: number }

export type RailMapStation = {
  name: string
  x: number
  y: number
}

export type RailMapLinePath = {
  lineId: string
  points: RailMapPoint[]
  stations: RailMapStation[]
}

export type RailMapBorder = {
  id: string
  name: string
  points: RailMapPoint[] // ring; first === last optional
}

export type RailMapNetwork = {
  width: number
  height: number
  land: RailMapPoint[]
  borders: RailMapBorder[]
  lines: RailMapLinePath[]
}
```

Create `web/src/lib/railMapGeometry.ts`:

```ts
import type { RailMapPoint } from '../data/railMap/types'

export type { RailMapPoint }

export function polylineLength(points: RailMapPoint[]): number {
  if (points.length < 2) return 0
  let sum = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    sum += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return sum
}

export function pointAtProgress(
  points: RailMapPoint[],
  progress: number,
): RailMapPoint {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length === 1) return { ...points[0]! }
  const t = Math.min(1, Math.max(0, progress))
  const total = polylineLength(points)
  if (total <= 0) return { ...points[0]! }
  let dist = t * total
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (dist <= seg || i === points.length - 1) {
      const u = seg === 0 ? 0 : Math.min(dist / seg, 1)
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }
    }
    dist -= seg
  }
  return { ...points[points.length - 1]! }
}

export function boundsOfPoints(points: RailMapPoint[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }
  return { minX, minY, maxX, maxY }
}

export function viewBoxFromBounds(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  padding: number,
  minSize: number,
): { x: number; y: number; w: number; h: number } {
  let w = bounds.maxX - bounds.minX + padding * 2
  let h = bounds.maxY - bounds.minY + padding * 2
  let x = bounds.minX - padding
  let y = bounds.minY - padding
  if (w < minSize) {
    x -= (minSize - w) / 2
    w = minSize
  }
  if (h < minSize) {
    y -= (minSize - h) / 2
    h = minSize
  }
  return { x, y, w, h }
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/data/railMap/types.ts web/src/lib/railMapGeometry.ts web/src/lib/railMapGeometry.test.ts
git commit -m "add: rail map polyline geometry helpers"
```

---

### Task 3: Camera framing helpers

**Files:**
- Create: `web/src/lib/railMapCamera.ts`
- Create: `web/src/lib/railMapCamera.test.ts`

**Interfaces:**
- Consumes: `pointAtProgress`, `boundsOfPoints`, `viewBoxFromBounds` from `railMapGeometry.ts`
- Produces:
  - `export type RailMapCameraMode = 'idle' | 'racing' | 'finished'`
  - `export type ViewBox = { x: number; y: number; w: number; h: number }`
  - `export function frameForLine(points, opts): ViewBox` — whole line + padding
  - `export function frameForProgress(points, progress, opts): ViewBox` — zoomed around marker
  - `export function clampViewBox(vb, world): ViewBox` — keep inside network width/height

- [ ] **Step 1: Write failing tests**

Create `web/src/lib/railMapCamera.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { clampViewBox, frameForLine, frameForProgress } from './railMapCamera'

const line = [
  { x: 0, y: 50 },
  { x: 200, y: 50 },
  { x: 200, y: 150 },
]

describe('frameForLine', () => {
  it('contains the full line with padding', () => {
    const vb = frameForLine(line, { padding: 10, minSize: 20 })
    expect(vb.x).toBeLessThanOrEqual(0)
    expect(vb.y).toBeLessThanOrEqual(50)
    expect(vb.x + vb.w).toBeGreaterThanOrEqual(200)
    expect(vb.y + vb.h).toBeGreaterThanOrEqual(150)
  })
})

describe('frameForProgress', () => {
  it('is smaller than full-line frame when zoomed', () => {
    const full = frameForLine(line, { padding: 10, minSize: 40 })
    const zoom = frameForProgress(line, 0.5, {
      padding: 10,
      minSize: 40,
      zoomSize: 80,
    })
    expect(zoom.w).toBeLessThanOrEqual(full.w)
    expect(zoom.h).toBeLessThanOrEqual(full.h)
  })

  it('centers near the marker', () => {
    const zoom = frameForProgress(line, 0, {
      padding: 0,
      minSize: 40,
      zoomSize: 40,
    })
    const cx = zoom.x + zoom.w / 2
    const cy = zoom.y + zoom.h / 2
    expect(cx).toBeCloseTo(0, 0)
    expect(cy).toBeCloseTo(50, 0)
  })
})

describe('clampViewBox', () => {
  it('keeps view inside world', () => {
    const vb = clampViewBox(
      { x: -50, y: -50, w: 100, h: 100 },
      { width: 200, height: 200 },
    )
    expect(vb.x).toBeGreaterThanOrEqual(0)
    expect(vb.y).toBeGreaterThanOrEqual(0)
    expect(vb.x + vb.w).toBeLessThanOrEqual(200)
    expect(vb.y + vb.h).toBeLessThanOrEqual(200)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm test -- src/lib/railMapCamera.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `web/src/lib/railMapCamera.ts`:

```ts
import {
  boundsOfPoints,
  pointAtProgress,
  viewBoxFromBounds,
  type RailMapPoint,
} from './railMapGeometry'

export type RailMapCameraMode = 'idle' | 'racing' | 'finished'

export type ViewBox = { x: number; y: number; w: number; h: number }

export function frameForLine(
  points: RailMapPoint[],
  opts: { padding: number; minSize: number },
): ViewBox {
  return viewBoxFromBounds(boundsOfPoints(points), opts.padding, opts.minSize)
}

export function frameForProgress(
  points: RailMapPoint[],
  progress: number,
  opts: { padding: number; minSize: number; zoomSize: number },
): ViewBox {
  const marker = pointAtProgress(points, progress)
  const half = opts.zoomSize / 2
  const bounds = {
    minX: marker.x - half,
    minY: marker.y - half,
    maxX: marker.x + half,
    maxY: marker.y + half,
  }
  return viewBoxFromBounds(bounds, opts.padding, opts.minSize)
}

export function clampViewBox(
  vb: ViewBox,
  world: { width: number; height: number },
): ViewBox {
  let { x, y, w, h } = vb
  w = Math.min(w, world.width)
  h = Math.min(h, world.height)
  x = Math.min(Math.max(0, x), world.width - w)
  y = Math.min(Math.max(0, y), world.height - h)
  return { x, y, w, h }
}

export function viewBoxToString(vb: ViewBox): string {
  return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/railMapCamera.ts web/src/lib/railMapCamera.test.ts
git commit -m "add: rail map camera framing helpers"
```

---

### Task 4: WCAG contrast helper for map strokes

**Files:**
- Create: `web/src/lib/railMapContrast.ts`
- Create: `web/src/lib/railMapContrast.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `export function mapStrokeColor(brandHex: string, landHex?: string): string` — returns brand or darkened/lightened hex with relative luminance contrast ≥ 3:1 vs land (default `#F7F7F5`)

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { contrastRatio, mapStrokeColor } from './railMapContrast'

describe('contrastRatio', () => {
  it('is high for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeGreaterThan(20)
  })
})

describe('mapStrokeColor', () => {
  it('keeps a dark brand on light land', () => {
    const out = mapStrokeColor('#AD1457', '#F7F7F5')
    expect(contrastRatio(out, '#F7F7F5')).toBeGreaterThanOrEqual(3)
  })

  it('darkens a light brand that fails AA non-text', () => {
    const out = mapStrokeColor('#F9A825', '#F7F7F5')
    expect(contrastRatio(out, '#F7F7F5')).toBeGreaterThanOrEqual(3)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

Create `web/src/lib/railMapContrast.ts` with sRGB relative luminance + binary search darken toward `#111111` until contrast ≥ 3, or lighten toward `#FFFFFF` if brand is on dark land (land is light in v1 — darken path is enough):

```ts
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim()
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const light = Math.max(l1, l2)
  const dark = Math.min(l1, l2)
  return (light + 0.05) / (dark + 0.05)
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a)
  const [br, bg, bb] = parseHex(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/** AA non-text (≥3:1) stroke against land. */
export function mapStrokeColor(
  brandHex: string,
  landHex = '#F7F7F5',
): string {
  if (contrastRatio(brandHex, landHex) >= 3) return brandHex
  let best = brandHex
  for (let i = 1; i <= 20; i++) {
    const candidate = mix(brandHex, '#111111', i / 20)
    if (contrastRatio(candidate, landHex) >= 3) return candidate
    best = candidate
  }
  return best
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/railMapContrast.ts web/src/lib/railMapContrast.test.ts
git commit -m "add: WCAG AA map stroke contrast helper"
```

---

### Task 5: Fixture network + lookup helpers

**Files:**
- Create: `web/src/data/railMap/network.json` (fixture; replaced by real geo in Task 7)
- Create: `web/src/lib/railMapNetwork.ts`
- Create: `web/src/lib/railMapNetwork.test.ts`

**Interfaces:**
- Consumes: `RailMapNetwork` types; `STATION_LINES` ids
- Produces:
  - `export function getLinePath(network, lineId): RailMapLinePath | null`
  - `export function resolveStationPoints(path, stationNames: string[]): RailMapStation[]` — match by name; missing names interpolated along path by index ratio

- [ ] **Step 1: Write fixture JSON**

Create `web/src/data/railMap/network.json` with a small but complete schema sample (world 1000×800) including:
- `land` rectangle-ish coast
- `borders` for `jakarta-pusat`, `jakarta-selatan` (simple rectangles)
- `lines` entries for every `STATION_LINES` id (`bogor`, `cikarang`, `rangkasbitung`, `tangerang`, `tanjung-priok`, `mrt-ns`, `lrt-jakarta`, `lrt-cibubur`, `lrt-bekasi`) with ≥2 points each and stations arrays that include at least first/last names from `stations.ts` for that id

Minimal line example (repeat pattern for all ids with distinct corridors):

```json
{
  "width": 1000,
  "height": 800,
  "land": [
    { "x": 50, "y": 40 },
    { "x": 950, "y": 40 },
    { "x": 920, "y": 760 },
    { "x": 80, "y": 740 },
    { "x": 50, "y": 40 }
  ],
  "borders": [
    {
      "id": "jakarta-selatan",
      "name": "Jakarta Selatan",
      "points": [
        { "x": 400, "y": 300 },
        { "x": 550, "y": 300 },
        { "x": 550, "y": 450 },
        { "x": 400, "y": 450 },
        { "x": 400, "y": 300 }
      ]
    }
  ],
  "lines": [
    {
      "lineId": "mrt-ns",
      "points": [
        { "x": 480, "y": 520 },
        { "x": 500, "y": 400 },
        { "x": 520, "y": 300 }
      ],
      "stations": [
        { "name": "Lebak Bulus", "x": 480, "y": 520 },
        { "name": "Bundaran HI", "x": 520, "y": 300 }
      ]
    }
  ]
}
```

Fill **all nine** `lineId`s before finishing the task (schematic positions OK in this task).

- [ ] **Step 2: Failing tests for lookup + interpolation**

```ts
import { describe, expect, it } from 'vitest'
import network from '../data/railMap/network.json'
import { getLinePath, resolveStationPoints } from './railMapNetwork'
import { STATION_LINES } from '../data/stations'
import type { RailMapNetwork } from '../data/railMap/types'

const net = network as RailMapNetwork

describe('getLinePath', () => {
  it('finds every playable line id', () => {
    for (const line of STATION_LINES) {
      expect(getLinePath(net, line.id)?.lineId).toBe(line.id)
    }
  })
})

describe('resolveStationPoints', () => {
  it('interpolates missing middle stops', () => {
    const path = getLinePath(net, 'mrt-ns')!
    const names = STATION_LINES.find((l) => l.id === 'mrt-ns')!.stations
    const resolved = resolveStationPoints(path, names)
    expect(resolved).toHaveLength(names.length)
    expect(resolved[0]!.name).toBe(names[0])
    expect(resolved[resolved.length - 1]!.name).toBe(names[names.length - 1])
  })
})
```

- [ ] **Step 3: Implement `railMapNetwork.ts`**

```ts
import type {
  RailMapLinePath,
  RailMapNetwork,
  RailMapStation,
} from '../data/railMap/types'
import { pointAtProgress } from './railMapGeometry'

export function getLinePath(
  network: RailMapNetwork,
  lineId: string,
): RailMapLinePath | null {
  return network.lines.find((l) => l.lineId === lineId) ?? null
}

export function resolveStationPoints(
  path: RailMapLinePath,
  stationNames: string[],
): RailMapStation[] {
  const byName = new Map(path.stations.map((s) => [s.name, s]))
  const n = stationNames.length
  return stationNames.map((name, i) => {
    const hit = byName.get(name)
    if (hit) return hit
    const t = n <= 1 ? 0 : i / (n - 1)
    const p = pointAtProgress(path.points, t)
    return { name, x: p.x, y: p.y }
  })
}
```

Enable JSON module resolve in TS if needed (`resolveJsonModule` should already be on in Vite projects).

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add web/src/data/railMap/network.json web/src/lib/railMapNetwork.ts web/src/lib/railMapNetwork.test.ts
git commit -m "add: rail map network fixture and lookups"
```

---

### Task 6: `RailMapBackdrop` component (static camera first)

**Files:**
- Create: `web/src/components/RailMapBackdrop.tsx`
- Modify: `web/src/App.css` (add `.rail-map-backdrop` rules)

**Interfaces:**
- Consumes: `network.json`, geometry/camera/contrast/network helpers, `STATION_LINES` for colors
- Produces:

```ts
export type RailMapBackdropProps = {
  phase: 'idle' | 'racing' | 'finished'
  lineId: string | null
  progress: number
  reducedMotion?: boolean
}
```

- [ ] **Step 1: Implement component**

`RailMapBackdrop`:
- Import network JSON
- Resolve `lineId` → path; if null, use first network line
- Compute target viewBox:
  - `idle` / `finished` → `frameForLine` + `clampViewBox`
  - `racing` → `frameForProgress` with `zoomSize` ≈ 22% of world min dimension (tune), `minSize` ≥ 120
- Render SVG `viewBox={viewBoxToString(vb)}` `preserveAspectRatio="xMidYMid slice"` full-bleed
- Layers: water rect (world), land fill `#F7F7F5`, border polylines dashed, all lines muted stroke, selected line thick `mapStrokeColor(brand)`, station circles for selected, progress marker at `pointAtProgress(points, phase==='idle' ? 0 : progress)`
- `aria-hidden="true"` on decorative SVG
- If network missing lines: render solid `#F7F7F5` fallback only

CSS (in `App.css`):

```css
.rail-map-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background: #1a2332;
}

.rail-map-backdrop__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.rail-map-backdrop__scrim {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 35%, rgb(10 16 28 / 0.15), rgb(10 16 28 / 0.55) 70%),
    linear-gradient(180deg, rgb(10 16 28 / 0.35), rgb(10 16 28 / 0.65));
  pointer-events: none;
}
```

Tune scrim so idle brand text still reads; verify later with contrast (Task 9).

- [ ] **Step 2: Temporary mount in App for visual check**

In `App.tsx`, above `DroneBackdrop`, render:

```tsx
<RailMapBackdrop phase="idle" lineId="mrt-ns" progress={0} />
```

Run `npm run dev`, confirm map paints behind UI. Then remove this temporary double-mount in Step 3 of Task 8 (do not leave both).

- [ ] **Step 3: Commit**

```bash
git add web/src/components/RailMapBackdrop.tsx web/src/App.css
git commit -m "add: RailMapBackdrop SVG layer"
```

---

### Task 7: Real-geo build pipeline → replace fixture

**Files:**
- Create: `web/scripts/build-rail-map.mjs`
- Create: `web/src/data/railMap/source/README.md` (download + attribution notes)
- Create: `web/src/data/railMap/source/*.geojson` (land, borders, per-line or combined rails)
- Modify: `web/package.json` (`"build:rail-map": "node scripts/build-rail-map.mjs"`)
- Replace: `web/src/data/railMap/network.json`

**Interfaces:**
- Consumes: GeoJSON lon/lat in `source/`
- Produces: projected `network.json` matching `RailMapNetwork`

**Kota borders to include (kota only):**
`Jakarta Pusat`, `Jakarta Utara`, `Jakarta Barat`, `Jakarta Selatan`, `Jakarta Timur`, `Depok`, `Bogor`, `Tangerang`, `Tangerang Selatan`, `Bekasi` — include a kota only if the playable network enters it; omit kabupaten (e.g. no Kabupaten Bogor / Lebak polygons).

**Line paths:** one Feature (or merged LineString) per `lineId`, ordered to match game station sequence as closely as practical; station Points with `name` properties matching `stations.ts` strings.

- [ ] **Step 1: Add source README with exact extract steps**

Document in `web/src/data/railMap/source/README.md`:
1. Export admin kota polygons (OSM `admin_level=5` for DKI kota; `admin_level=6` + `place=city` / `boundary=administrative` for other kota) via Overpass or [geojson.io](https://geojson.io) / Humanitarian Data / Indonesia BPS geo — simplify with [mapshaper](https://mapshaper.org) `-simplify 5% keep-shapes`.
2. Export railway ways for KRL/MRT/LRT corridors; split/merge into per-`lineId` files named `line-bogor.geojson`, etc.
3. Station nodes: Point features, property `name` exact match to `stations.ts`.
4. Land: Jabodetabek coastline polygon clipped to bbox approx `[106.45, -6.75, 107.15, -5.95]`.
5. Attribution: © OpenStreetMap contributors, ODbL — note in README.

- [ ] **Step 2: Implement `build-rail-map.mjs`**

Script must:
- Read `land.geojson`, `borders.geojson`, `line-*.geojson`, `stations-*.geojson` (or a combined `rails.geojson` with `lineId` property)
- Compute bbox from land (or fixed bbox above)
- Project with equirectangular to width=1000, height≈800 (aspect from bbox):

```js
function project(lon, lat, bbox, width, height) {
  const [west, south, east, north] = bbox
  const x = ((lon - west) / (east - west)) * width
  const y = ((north - lat) / (north - south)) * height
  return { x, y }
}
```

- Emit `network.json`
- Exit non-zero if any `STATION_LINES` id missing a path with &lt;2 points
- Print warnings for station names in `stations.ts` not found in source (interpolation will handle at runtime)

- [ ] **Step 3: Obtain/simplify real source files and run build**

```bash
npm run build:rail-map
```

Expected: writes `src/data/railMap/network.json`; lists any unmatched station warnings.

- [ ] **Step 4: Re-run unit tests**

Run: `npm test`  
Expected: PASS (lookups still find all line ids)

- [ ] **Step 5: Visual check in dev** — corridors should resemble real Jabodetabek (Bogor south, Tangerang west, Cikarang east, MRT central spine).

- [ ] **Step 6: Commit**

```bash
git add web/scripts/build-rail-map.mjs web/package.json web/src/data/railMap/
git commit -m "add: real-geo rail map asset pipeline"
```

---

### Task 8: Wire App — replace drone, preview line, progress camera

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/RailMapBackdrop.tsx` (smooth viewBox if not done)

**Interfaces:**
- Consumes: existing `phase`, `race`, `progress`, `distanceProgress`
- Produces: `previewLineId` state for idle framing

- [ ] **Step 1: Add preview state**

Near other state in `App.tsx`:

```ts
const [previewLineId, setPreviewLineId] = useState(
  () => pickRandomLine().id,
)
```

On idle line-pick buttons:

```tsx
onMouseEnter={() => setPreviewLineId(line.id)}
onFocus={() => setPreviewLineId(line.id)}
onClick={() => startRace(line)}
```

- [ ] **Step 2: Replace `DroneBackdrop`**

Remove `DroneBackdrop` usage and unused landmark state/imports **only if** nothing else needs them. Keep drone files on disk.

```tsx
const mapLineId =
  phase === 'idle'
    ? previewLineId
    : race?.line.id ?? previewLineId

const mapProgress =
  phase === 'finished' ? 1 : phase === 'racing' ? progress : 0

<RailMapBackdrop
  phase={phase}
  lineId={mapLineId}
  progress={mapProgress}
/>
```

Remove `landmarkId` / drone credit UI from race chrome if it only served the drone plate.

- [ ] **Step 3: Animate viewBox in `RailMapBackdrop`**

Use a small `useEffect` + `requestAnimationFrame` (or CSS-free lerp) to ease current viewBox toward target each time target changes. If `window.matchMedia('(prefers-reduced-motion: reduce)')`, snap immediately.

- [ ] **Step 4: Manual pass**

- Idle: hover lines → camera frames each corridor  
- Race: marker moves; camera follows; bottom rail still present  
- Finish: pull back to full line  

- [ ] **Step 5: Commit**

```bash
git add web/src/App.tsx web/src/components/RailMapBackdrop.tsx
git commit -m "update: race UI uses rail map backdrop"
```

---

### Task 9: Scrim, chrome contrast, CSS cleanup

**Files:**
- Modify: `web/src/App.css`
- Modify: `web/src/components/RailMapBackdrop.tsx` if stroke widths need tweaks

- [ ] **Step 1: Adjust scrim + text colors** so hero title, lede, race stats, and station prompt meet **4.5:1** against the composited map+scrim (sample with browser DevTools contrast or a contrast checker on screenshots).

- [ ] **Step 2: Selected stroke / marker** — confirm ≥ 3:1 on land via `mapStrokeColor`; bump stroke width if needed (selected ≥ 3.5px at default view, muted ≤ 1.25px).

- [ ] **Step 3: Hide or neutralize `.track-glow` if it fights the map; do not remove `StationProgressRail` styles.

- [ ] **Step 4: Commit**

```bash
git add web/src/App.css web/src/components/RailMapBackdrop.tsx
git commit -m "update: rail map scrim and WCAG AA contrast polish"
```

---

### Task 10: Integration verification

**Files:** none required (checklist); fix bugs in place with `fix:` commits if needed

- [ ] **Step 1: Run automated tests**

```bash
npm test
npm run build
npm run lint
```

Expected: all pass / build succeeds

- [ ] **Step 2: Manual matrix**

For each of the 9 lines:
1. Idle hover/focus frames the line  
2. Start race → zoom + follow  
3. Finish → full-line frame  
4. Bottom `StationProgressRail` still visible and in sync directionally  

Also: mobile width + soft keyboard; `prefers-reduced-motion: reduce` snaps camera.

- [ ] **Step 3: Final commit only if fixes were needed**

```bash
git commit -m "fix: rail map camera or contrast edge cases"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Replace drone in idle/race/finished | 8 |
| Keep StationProgressRail | 8 (no removal) |
| All lines muted + selected highlight | 6, 7 |
| Station dots on selected only | 6 |
| Kota borders (DKI 5 + network kota, no kabupaten) | 7 |
| Real geo, build-time, no live OSM | 7 |
| Idle frame picker line | 8 |
| Race zoom + follow progress | 6, 8 |
| Finished full-line frame | 8 |
| WCAG 2.2 AA | 4, 9 |
| Game order / interpolate missing stops | 5 |
| Fallback if asset bad | 6 |
| Reduced motion | 8 |
| Unit tests for geometry/camera | 2, 3 |

## Plan self-review notes

- No MapLibre path; Approach 1 only  
- Commit message prefix aligned to repo (`add:`/`update:`/`fix:`)  
- Fixture in Task 5 unblocks UI before real geo in Task 7  
- `previewLineId` added because idle picker had no hover state before  
