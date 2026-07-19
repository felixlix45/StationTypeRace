/**
 * Convert Nominatim/OSM kota polygons → simplified, topology-clean borders.geojson
 * and update BORDERS rings inside generate-rail-map-source.mjs.
 *
 * Input:  artifacts/kota-borders-raw.geojson  (from fetch-kota-borders.mjs)
 * Output: web/src/data/railMap/source/borders.geojson
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const RAW = join(ROOT, 'artifacts/kota-borders-raw.geojson')
const TMP = join(ROOT, 'artifacts/kota-borders-mainland.geojson')
const TMP_SIMP = join(ROOT, 'artifacts/kota-borders-simplified.geojson')
const OUT = join(__dirname, '../src/data/railMap/source/borders.geojson')
const GEN = join(__dirname, 'generate-rail-map-source.mjs')

const ORDER = [
  'jakarta-pusat',
  'jakarta-utara',
  'jakarta-barat',
  'jakarta-selatan',
  'jakarta-timur',
  'depok',
  'bogor',
  'tangerang',
  'tangerang-selatan',
  'bekasi',
]

function ringArea(ring) {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return Math.abs(a / 2)
}

/** Largest outer ring only (drops Jakarta Utara bay islets). */
function mainlandPolygon(geom) {
  if (geom.type === 'Polygon') {
    return { type: 'Polygon', coordinates: [geom.coordinates[0]] }
  }
  if (geom.type === 'MultiPolygon') {
    let best = null
    let bestA = -1
    for (const poly of geom.coordinates) {
      const a = ringArea(poly[0])
      if (a > bestA) {
        bestA = a
        best = poly[0]
      }
    }
    return { type: 'Polygon', coordinates: [best] }
  }
  throw new Error(`unsupported ${geom.type}`)
}

function roundRing(ring, decimals = 5) {
  const f = 10 ** decimals
  const out = ring.map(([lon, lat]) => [Math.round(lon * f) / f, Math.round(lat * f) / f])
  // drop consecutive duplicates after rounding
  const dedup = [out[0]]
  for (let i = 1; i < out.length; i++) {
    const prev = dedup[dedup.length - 1]
    if (prev[0] !== out[i][0] || prev[1] !== out[i][1]) dedup.push(out[i])
  }
  if (
    dedup.length > 1 &&
    (dedup[0][0] !== dedup[dedup.length - 1][0] ||
      dedup[0][1] !== dedup[dedup.length - 1][1])
  ) {
    dedup.push([...dedup[0]])
  }
  return dedup
}

const raw = JSON.parse(readFileSync(RAW, 'utf8'))
const byId = new Map(raw.features.map((f) => [f.properties.id, f]))

const mainland = {
  type: 'FeatureCollection',
  features: ORDER.map((id) => {
    const f = byId.get(id)
    if (!f) throw new Error(`missing ${id}`)
    return {
      type: 'Feature',
      properties: { id, name: f.properties.name },
      geometry: mainlandPolygon(f.geometry),
    }
  }),
}
writeFileSync(TMP, JSON.stringify(mainland))

// Topological simplify: snap + clean + Visvalingam via mapshaper.
// ~2.5% keeps recognizable kota shapes without dense zigzags at race zoom.
const ms = spawnSync(
  `npx --yes mapshaper "${TMP}" -snap interval=0.00015 -clean -simplify 2.5% keep-shapes weighted -o "${TMP_SIMP}" format=geojson geojson-type=FeatureCollection precision=0.00001`,
  { cwd: ROOT, encoding: 'utf8', shell: true },
)
if (ms.status !== 0) {
  console.error(ms.stdout)
  console.error(ms.stderr)
  process.exit(ms.status ?? 1)
}
console.log(ms.stderr || ms.stdout || 'mapshaper ok')

const simplified = JSON.parse(readFileSync(TMP_SIMP, 'utf8'))
const simpById = new Map(
  simplified.features.map((f) => [f.properties.id, f]),
)

const borders = {
  type: 'FeatureCollection',
  features: ORDER.map((id) => {
    const f = simpById.get(id)
    if (!f) throw new Error(`simplified missing ${id}`)
    const ring = roundRing(f.geometry.coordinates[0], 5)
    console.log(id, ring.length - 1, 'unique verts')
    return {
      type: 'Feature',
      properties: { id, name: f.properties.name },
      geometry: { type: 'Polygon', coordinates: [ring] },
    }
  }),
}

writeFileSync(OUT, JSON.stringify(borders, null, 2) + '\n')
console.log('wrote', OUT)

// Patch BORDERS constant in generate-rail-map-source.mjs so re-runs stay in sync.
const genSrc = readFileSync(GEN, 'utf8')
const start = genSrc.indexOf('const BORDERS = [')
const end = genSrc.indexOf('\n]\n\n/**\n * West Java land', start)
if (start < 0 || end < 0) {
  console.error('Could not locate BORDERS block in generate-rail-map-source.mjs')
  process.exit(1)
}

function fmtRing(ring) {
  return ring
    .map(
      ([lon, lat]) =>
        `      [${lon}, ${lat}],`,
    )
    .join('\n')
}

const bordersJs = borders.features
  .map((f) => {
    const ring = f.geometry.coordinates[0]
    return `  {
    id: '${f.properties.id}',
    name: '${f.properties.name}',
    ring: [
${fmtRing(ring)}
    ],
  }`
  })
  .join(',\n')

const next =
  genSrc.slice(0, start) +
  `const BORDERS = [\n${bordersJs},\n` +
  genSrc.slice(end)

writeFileSync(GEN, next)
console.log('updated BORDERS in generate-rail-map-source.mjs')
