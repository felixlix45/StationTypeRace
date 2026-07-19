# Rail map source (real geo)

GeoJSON in this folder is projected at build time into `../network.json` via:

```bash
npm run build:rail-map
```

Working bbox (approx): `[106.45, -6.75, 107.15, -5.95]` — land ring may extend slightly west so Rangkasbitung stays on-map.

## Expected files

| File | Role |
|------|------|
| `land.geojson` | Jabodetabek land Polygon (coastline / inland), clipped to bbox |
| `borders.geojson` | Kota admin polygons only (`id` + `name` properties) |
| `line-<lineId>.geojson` | One FeatureCollection per playable line: a `LineString` path (`lineId`, `kind: "path"`) plus station `Point`s (`lineId`, `name`, `kind: "station"`) |

Optional alternatives the builder also accepts: `stations-*.geojson` (Points with `lineId` + `name`), or a combined `rails.geojson` with `lineId` on each feature.

Playable `lineId`s: `bogor`, `cikarang`, `rangkasbitung`, `tangerang`, `tanjung-priok`, `mrt-ns`, `lrt-jakarta`, `lrt-cibubur`, `lrt-bekasi`.

Station `name` strings should match `web/src/data/stations.ts` exactly. Unmatched names warn at build time; runtime interpolates along the path.

## How to refresh from OSM / public admin data

1. **Kota borders (kota only, no kabupaten)**  
   Export admin polygons via Overpass, [geojson.io](https://geojson.io), Humanitarian Data, or Indonesia BPS geo:
   - DKI kota: OSM `admin_level=5` (`Jakarta Pusat`, `Jakarta Utara`, `Jakarta Barat`, `Jakarta Selatan`, `Jakarta Timur`)
   - Other kota: `admin_level=6` + `place=city` / `boundary=administrative` for `Depok`, `Bogor`, `Tangerang`, `Tangerang Selatan`, `Bekasi`  
   Include a kota only if the playable network enters it.  
   Simplify with [mapshaper](https://mapshaper.org): `-simplify 5% keep-shapes`.  
   Set properties `id` (slug) and `name` (display string above).

2. **Railway corridors**  
   Export railway ways for KRL / MRT / LRT; split or merge into per-`lineId` files named `line-bogor.geojson`, etc. Order vertices to follow the game station sequence as closely as practical.

3. **Stations**  
   Point features with property `name` exactly matching `stations.ts` (and `lineId` for the line file).

4. **Land**  
   Jabodetabek coastline polygon clipped to bbox approx `[106.45, -6.75, 107.15, -5.95]`.

5. **Regenerate authored simplified sources** (optional helper used for this repo’s simplified real-geo set):

```bash
node scripts/generate-rail-map-source.mjs
npm run build:rail-map
```

## Attribution

Station positions and corridor / admin outlines in the committed simplified GeoJSON are derived from publicly known coordinates and OpenStreetMap geometry.

© OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).

When replacing files with a fresh Overpass / mapshaper extract, keep this attribution.
