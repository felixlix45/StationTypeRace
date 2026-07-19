/**
 * Project real-geo GeoJSON under src/data/railMap/source/ → network.json
 *
 * Reads: land.geojson, borders.geojson, line-*.geojson (and optional stations-*.geojson
 * or rails.geojson with lineId). Validates playable STATION_LINES paths.
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SOURCE = join(ROOT, 'src/data/railMap/source')
const OUT = join(ROOT, 'src/data/railMap/network.json')
const STATIONS_TS = join(ROOT, 'src/data/stations.ts')

const WIDTH = 1000
/**
 * Working lon/lat bbox (approx brief [106.45,-6.75,107.15,-5.95],
 * expanded west for Rangkasbitung). Aspect → height ≈ 800 at width=1000.
 */
const WORKING_BBOX = [106.2, -6.75, 107.2, -5.95]

const PLAYABLE_LINE_IDS = [
  'bogor',
  'cikarang',
  'rangkasbitung',
  'tangerang',
  'tanjung-priok',
  'mrt-ns',
  'lrt-jakarta',
  'lrt-cibubur',
  'lrt-bekasi',
]

function project(lon, lat, bbox, width, height) {
  const [west, south, east, north] = bbox
  const x = ((lon - west) / (east - west)) * width
  const y = ((north - lat) / (north - south)) * height
  return { x, y }
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function projectPoint(lon, lat, bbox, width, height) {
  const p = project(lon, lat, bbox, width, height)
  return { x: round2(p.x), y: round2(p.y) }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function ringFromPolygon(geom) {
  if (!geom) return null
  if (geom.type === 'Polygon') return geom.coordinates[0] ?? null
  if (geom.type === 'MultiPolygon') return geom.coordinates[0]?.[0] ?? null
  return null
}

function coordsFromLine(geom) {
  if (!geom) return []
  if (geom.type === 'LineString') return geom.coordinates
  if (geom.type === 'MultiLineString') return geom.coordinates.flat()
  return []
}

function bboxFromRing(ring) {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const [lon, lat] of ring) {
    if (lon < west) west = lon
    if (lon > east) east = lon
    if (lat < south) south = lat
    if (lat > north) north = lat
  }
  return [west, south, east, north]
}

/** Parse STATION_LINES ids + station name arrays from stations.ts text. */
function parseStationLines(src) {
  const lines = []
  const blockRe =
    /\{\s*id:\s*'([^']+)'[\s\S]*?stations:\s*\[([\s\S]*?)\]\s*,\s*segmentKm:/g
  let m
  while ((m = blockRe.exec(src))) {
    const id = m[1]
    const names = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])
    lines.push({ id, stations: names })
  }
  return lines
}

function loadFeatures() {
  const features = []
  const landPath = join(SOURCE, 'land.geojson')
  const bordersPath = join(SOURCE, 'borders.geojson')
  if (!existsSync(landPath)) {
    console.error(`Missing ${landPath}`)
    process.exit(1)
  }
  if (!existsSync(bordersPath)) {
    console.error(`Missing ${bordersPath}`)
    process.exit(1)
  }
  features.push(...readJson(landPath).features)
  features.push(...readJson(bordersPath).features)

  const files = readdirSync(SOURCE).filter((f) => f.endsWith('.geojson'))
  for (const f of files) {
    if (f === 'land.geojson' || f === 'borders.geojson') continue
    const data = readJson(join(SOURCE, f))
    if (data.type === 'FeatureCollection') features.push(...data.features)
    else if (data.type === 'Feature') features.push(data)
  }
  return features
}

function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Source dir missing: ${SOURCE}`)
    process.exit(1)
  }

  const stationLines = parseStationLines(readFileSync(STATIONS_TS, 'utf8'))
  if (stationLines.length === 0) {
    console.error('Failed to parse STATION_LINES from stations.ts')
    process.exit(1)
  }

  const features = loadFeatures()
  const landFeat = features.find(
    (f) =>
      f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon',
  )
  // Prefer land feature: first polygon that is not a named kota border
  const landPoly =
    features.find(
      (f) =>
        (f.geometry?.type === 'Polygon' ||
          f.geometry?.type === 'MultiPolygon') &&
        !f.properties?.id &&
        (f.properties?.name === 'Jabodetabek land' || !f.properties?.name),
    ) ?? landFeat

  const landRing = ringFromPolygon(landPoly?.geometry)
  if (!landRing?.length) {
    console.error('land.geojson must contain a Polygon ring')
    process.exit(1)
  }

  // Prefer documented working bbox so canvas aspect stays stable (~1000×800).
  // Land ring extent is validated but not used to drive projection scale.
  const landBbox = bboxFromRing(landRing)
  if (!(landBbox[0] < landBbox[2] && landBbox[1] < landBbox[3])) {
    console.error('land.geojson ring has degenerate bbox')
    process.exit(1)
  }
  const useBbox = WORKING_BBOX
  const [west, south, east, north] = useBbox
  const height = Math.round(WIDTH * ((north - south) / (east - west)))

  const land = landRing.map(([lon, lat]) =>
    projectPoint(lon, lat, useBbox, WIDTH, height),
  )

  const borders = features
    .filter(
      (f) =>
        f.properties?.id &&
        f.properties?.name &&
        (f.geometry?.type === 'Polygon' ||
          f.geometry?.type === 'MultiPolygon'),
    )
    .map((f) => {
      const ring = ringFromPolygon(f.geometry)
      return {
        id: f.properties.id,
        name: f.properties.name,
        points: (ring ?? []).map(([lon, lat]) =>
          projectPoint(lon, lat, useBbox, WIDTH, height),
        ),
      }
    })

  /** @type {Map<string, { points: {x:number,y:number}[], stations: {name:string,x:number,y:number}[] }>} */
  const byLine = new Map()

  function ensureLine(lineId) {
    if (!byLine.has(lineId)) {
      byLine.set(lineId, { points: [], stations: [] })
    }
    return byLine.get(lineId)
  }

  for (const f of features) {
    const props = f.properties ?? {}
    const lineId = props.lineId
    if (!lineId) continue

    const geom = f.geometry
    if (!geom) continue

    if (
      geom.type === 'LineString' ||
      geom.type === 'MultiLineString' ||
      props.kind === 'path'
    ) {
      if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
        const coords = coordsFromLine(geom)
        if (coords.length >= 2) {
          const entry = ensureLine(lineId)
          entry.points = coords.map(([lon, lat]) =>
            projectPoint(lon, lat, useBbox, WIDTH, height),
          )
        }
      }
    }

    if (geom.type === 'Point' && props.name) {
      const [lon, lat] = geom.coordinates
      const entry = ensureLine(lineId)
      const p = projectPoint(lon, lat, useBbox, WIDTH, height)
      entry.stations.push({ name: props.name, x: p.x, y: p.y })
    }
  }

  // Also accept stations-*.geojson without kind
  for (const f of features) {
    const props = f.properties ?? {}
    if (
      f.geometry?.type === 'Point' &&
      props.name &&
      props.lineId &&
      props.kind !== 'station'
    ) {
      // already handled above for Point+name+lineId
    }
  }

  const lines = []
  const errors = []

  for (const id of PLAYABLE_LINE_IDS) {
    const entry = byLine.get(id)
    if (!entry || entry.points.length < 2) {
      errors.push(
        `lineId "${id}" missing path with ≥2 points (got ${entry?.points.length ?? 0})`,
      )
      continue
    }
    lines.push({
      lineId: id,
      points: entry.points,
      stations: entry.stations,
    })
  }

  if (errors.length) {
    for (const e of errors) console.error(`ERROR: ${e}`)
    process.exit(1)
  }

  // Warnings: station names in stations.ts not found in source for that line
  const warnings = []
  for (const sl of stationLines) {
    const entry = byLine.get(sl.id)
    if (!entry) continue
    const have = new Set(entry.stations.map((s) => s.name))
    for (const name of sl.stations) {
      if (!have.has(name)) {
        warnings.push(`${sl.id}: "${name}" not in source (will interpolate)`)
      }
    }
  }

  const network = {
    width: WIDTH,
    height,
    land,
    borders,
    lines,
  }

  writeFileSync(OUT, JSON.stringify(network, null, 2) + '\n', 'utf8')

  console.log(`Wrote ${OUT}`)
  console.log(
    `  size ${WIDTH}×${height}  bbox [${useBbox.map((n) => n.toFixed(2)).join(', ')}]`,
  )
  console.log(`  borders: ${borders.length}  lines: ${lines.length}`)
  if (warnings.length) {
    console.warn(`\n${warnings.length} unmatched station name(s):`)
    for (const w of warnings) console.warn(`  warn: ${w}`)
  } else {
    console.log('  all stations.ts names matched in source')
  }
}

main()
