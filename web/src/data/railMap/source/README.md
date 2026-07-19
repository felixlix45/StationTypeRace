# Rail map source (real geo)

GeoJSON in this folder is projected at build time into `../network.json` via:

```bash
npm run build:rail-map
```

Working bbox (approx): `[106.45, -6.75, 107.15, -5.95]` — land ring may extend slightly west so Rangkasbitung stays on-map.

## Expected files

| File | Role |
|------|------|
| `land.geojson` | West Java land Polygon — north coast along the Java Sea; inland extends past the bbox so the viewport is not an island-in-ocean |
| `borders.geojson` | Kota admin polygons only (`id` + `name` properties) |
| `line-<lineId>.geojson` | One FeatureCollection per playable line: a `LineString` path (`lineId`, `kind: "path"`) plus station `Point`s (`lineId`, `name`, `kind: "station"`) |

Optional alternatives the builder also accepts: `stations-*.geojson` (Points with `lineId` + `name`), or a combined `rails.geojson` with `lineId` on each feature.

Playable `lineId`s: `bogor`, `cikarang`, `rangkasbitung`, `tangerang`, `tanjung-priok`, `mrt-ns`, `lrt-jakarta`, `lrt-cibubur`, `lrt-bekasi`.

Station `name` strings should match `web/src/data/stations.ts` exactly. Unmatched names warn at build time; runtime interpolates along the path.

## Kota borders — intent & refresh

**What we draw:** thin dashed outlines for the ten **kota** the playable network enters — DKI’s five kota administrations plus Depok, Bogor, Tangerang, Tangerang Selatan, and Bekasi. **No kabupaten** (e.g. Kab. Bogor / Kab. Bekasi / Kab. Tangerang / Lebak), so Bogor kota reads as a separate pocket south of Depok with kabupaten land (undrawn) in between.

**What was wrong (2026-07):** hand-authored ~10-vertex “blob” rings overlapped neighbors, so SVG polylines **crossed** at nearly every shared DKI / Jabodetabek edge.

**Current approach:** Nominatim/OSM admin polygons → keep mainland ring only (drop Jakarta Utara bay islets) → [mapshaper](https://mapshaper.org) `-snap -clean -simplify 2.5% keep-shapes` so adjacent kota share topology and borders do not cross. Scripts:

```bash
node scripts/fetch-kota-borders.mjs      # → artifacts/kota-borders-raw.geojson
node scripts/simplify-kota-borders.mjs   # → source/borders.geojson + BORDERS in generate-rail-map-source.mjs
npm run build:rail-map
```

Or export manually via Overpass / BIG / BPS geo and simplify the same way. Set properties `id` (slug) and `name`.

## How to refresh other layers

1. **Railway corridors** — Export railway ways for KRL / MRT / LRT; split or merge into per-`lineId` files named `line-bogor.geojson`, etc. Order vertices to follow the game station sequence as closely as practical.

2. **Stations** — Point features with property `name` exactly matching `stations.ts` (and `lineId` for the line file).

3. **Land** — West Java mass for the working bbox: follow the Java Sea / Jakarta Bay coastline on the north; extend the polygon south/east/west **past** the bbox so inland Java fills the frame (do not close a southern “coast” inside the viewport — that reads as an island).

4. **Regenerate authored line/land helpers** (optional; also rewrites borders from the inlined OSM-simplified rings):

```bash
node scripts/generate-rail-map-source.mjs
npm run build:rail-map
```

## Attribution

Station positions are taken from OpenStreetMap `railway=station` / LRT nodes (Overpass + Nominatim cross-check, 2026-07). Paths are straight segments between consecutive game stops (not full track centreline polylines). Land remains a simplified West Java silhouette. Kota borders are simplified from OSM admin boundaries via Nominatim (2026-07).

Notable corrections from earlier authored approx: Jakarta Kota longitude, Cikarang latitude, LRT Cibubur corridor (Harjamukti / Ciracas / Kampung Rambutan), Fatmawati, Velodrome, and several Rangkasbitung-line stops; kota rings replaced after hand-authored blobs produced crossing separators.

© OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).

When replacing files with a fresh Overpass / Nominatim / mapshaper extract, keep this attribution.
