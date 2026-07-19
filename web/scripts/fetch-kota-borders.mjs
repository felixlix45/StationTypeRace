/**
 * Fetch OSM/Nominatim admin kota polygons for Jabodetabek rail-map borders.
 * Writes artifacts/kota-borders-raw.geojson
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const OUT = join(ROOT, 'artifacts/kota-borders-raw.geojson')

/** Nominatim queries → our border id / display name */
const KOTA = [
  { id: 'jakarta-pusat', name: 'Jakarta Pusat', q: 'Jakarta Pusat, Daerah Khusus Ibukota Jakarta, Indonesia' },
  { id: 'jakarta-utara', name: 'Jakarta Utara', q: 'Jakarta Utara, Daerah Khusus Ibukota Jakarta, Indonesia' },
  { id: 'jakarta-barat', name: 'Jakarta Barat', q: 'Jakarta Barat, Daerah Khusus Ibukota Jakarta, Indonesia' },
  { id: 'jakarta-selatan', name: 'Jakarta Selatan', q: 'Jakarta Selatan, Daerah Khusus Ibukota Jakarta, Indonesia' },
  { id: 'jakarta-timur', name: 'Jakarta Timur', q: 'Jakarta Timur, Daerah Khusus Ibukota Jakarta, Indonesia' },
  { id: 'depok', name: 'Depok', q: 'Kota Depok, Jawa Barat, Indonesia' },
  { id: 'bogor', name: 'Bogor', q: 'Kota Bogor, Jawa Barat, Indonesia' },
  { id: 'tangerang', name: 'Tangerang', q: 'Kota Tangerang, Banten, Indonesia' },
  { id: 'tangerang-selatan', name: 'Tangerang Selatan', q: 'Kota Tangerang Selatan, Banten, Indonesia' },
  { id: 'bekasi', name: 'Bekasi', q: 'Kota Bekasi, Jawa Barat, Indonesia' },
]

const UA = 'StationTypeRace/1.0 (rail-map border refresh; local build)'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchOne(kota) {
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: kota.q,
      format: 'json',
      polygon_geojson: '1',
      limit: '1',
    })
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`${kota.id}: HTTP ${res.status}`)
  const rows = await res.json()
  if (!rows[0]?.geojson) throw new Error(`${kota.id}: no geojson`)
  return {
    type: 'Feature',
    properties: {
      id: kota.id,
      name: kota.name,
      osm_id: rows[0].osm_id,
      osm_type: rows[0].osm_type,
      display_name: rows[0].display_name,
    },
    geometry: rows[0].geojson,
  }
}

mkdirSync(dirname(OUT), { recursive: true })
const features = []
for (const kota of KOTA) {
  process.stdout.write(`fetch ${kota.id}… `)
  const f = await fetchOne(kota)
  const g = f.geometry
  const n =
    g.type === 'Polygon'
      ? g.coordinates[0].length
      : g.type === 'MultiPolygon'
        ? g.coordinates.reduce((s, p) => s + p[0].length, 0)
        : 0
  console.log(g.type, n, 'verts')
  features.push(f)
  await sleep(1100) // Nominatim usage policy
}

const fc = { type: 'FeatureCollection', features }
writeFileSync(OUT, JSON.stringify(fc))
console.log('wrote', OUT)
