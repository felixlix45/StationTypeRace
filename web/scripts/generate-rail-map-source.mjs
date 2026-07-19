/**
 * One-shot authoring helper: writes simplified real lon/lat GeoJSON under
 * src/data/railMap/source/ from known public station coordinates and
 * approximate kota / land outlines (OSM-derived / public gazetteer).
 *
 * Re-run when updating corridor geometry; then: npm run build:rail-map
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/railMap/source')

/** @type {Record<string, [number, number]>} lon, lat */
const COORDS = {
  // --- KRL shared / Bogor corridor ---
  'Jakarta Kota': [106.8314, -6.1376],
  Jayakarta: [106.8278, -6.1435],
  'Mangga Besar': [106.8265, -6.1497],
  'Sawah Besar': [106.8275, -6.1566],
  Juanda: [106.8303, -6.1667],
  Gondangdia: [106.8328, -6.1856],
  Cikini: [106.8410, -6.1983],
  Manggarai: [106.8503, -6.2100],
  Tebet: [106.8575, -6.2258],
  Cawang: [106.8589, -6.2425],
  'Duren Kalibata': [106.8547, -6.2550],
  'Pasar Minggu Baru': [106.8445, -6.2675],
  'Pasar Minggu': [106.8442, -6.2838],
  'Tanjung Barat': [106.8389, -6.3085],
  'Lenteng Agung': [106.8347, -6.3295],
  'Universitas Pancasila': [106.8322, -6.3385],
  'Universitas Indonesia': [106.8315, -6.3608],
  'Pondok Cina': [106.8320, -6.3695],
  'Depok Baru': [106.8235, -6.3910],
  Depok: [106.8185, -6.4045],
  Citayam: [106.8035, -6.4475],
  Bojonggede: [106.7950, -6.4895],
  Cilebut: [106.7945, -6.5305],
  Bogor: [106.7905, -6.5945],
  'Pondok Rajeg': [106.8505, -6.4650],
  Cibinong: [106.8620, -6.4815],
  Nambo: [106.9050, -6.4655],

  // --- Cikarang / loop ---
  Jatinegara: [106.8703, -6.2152],
  Klender: [106.8995, -6.2135],
  Buaran: [106.9235, -6.2158],
  'Klender Baru': [106.9355, -6.2145],
  Cakung: [106.9525, -6.2138],
  Kranji: [106.9805, -6.2215],
  Bekasi: [107.0005, -6.2365],
  'Bekasi Timur': [107.0185, -6.2485],
  Tambun: [107.0505, -6.2615],
  Cibitung: [107.0835, -6.2755],
  'Metland Telagamurni': [107.1125, -6.2885],
  Cikarang: [107.1485, -6.3015],
  'Kampung Bandan': [106.8285, -6.1295],
  Angke: [106.8015, -6.1445],
  Duri: [106.8018, -6.1555],
  'Tanah Abang': [106.8108, -6.1855],
  Karet: [106.8185, -6.2005],
  'BNI City': [106.8215, -6.2025],
  Sudirman: [106.8235, -6.2045],
  Matraman: [106.8585, -6.2045],
  Rajawali: [106.8355, -6.1455],
  Kemayoran: [106.8455, -6.1555],
  'Pasar Senen': [106.8445, -6.1765],
  'Gang Sentiong': [106.8505, -6.1855],
  Kramat: [106.8555, -6.1925],
  'Pondok Jati': [106.8625, -6.2055],

  // --- Rangkasbitung ---
  Palmerah: [106.7975, -6.2075],
  Kebayoran: [106.7835, -6.2375],
  'Pondok Ranji': [106.7445, -6.2755],
  Jurangmangu: [106.7285, -6.2885],
  Sudimara: [106.7125, -6.3015],
  'Rawa Buntu': [106.6855, -6.3185],
  Serpong: [106.6645, -6.3195],
  Cisauk: [106.6485, -6.3255],
  Cicayur: [106.6285, -6.3325],
  Jatake: [106.6055, -6.3455],
  'Parung Panjang': [106.5585, -6.3555],
  Cilejit: [106.5055, -6.3655],
  Daru: [106.4755, -6.3555],
  Tenjo: [106.4455, -6.3485],
  Tigaraksa: [106.4255, -6.3455],
  Cikoya: [106.3955, -6.3485],
  Maja: [106.3655, -6.3525],
  Citeras: [106.3055, -6.3555],
  Rangkasbitung: [106.2495, -6.3565],

  // --- Tangerang ---
  Grogol: [106.7895, -6.1615],
  Pesing: [106.7715, -6.1585],
  'Taman Kota': [106.7525, -6.1555],
  'Bojong Indah': [106.7355, -6.1525],
  'Rawa Buaya': [106.7185, -6.1555],
  Kalideres: [106.7055, -6.1555],
  Poris: [106.6685, -6.1685],
  'Batu Ceper': [106.6555, -6.1725],
  'Tanah Tinggi': [106.6385, -6.1755],
  Tangerang: [106.6305, -6.1785],

  // --- Tanjung Priok ---
  Ancol: [106.8455, -6.1265],
  'Jakarta International Stadium': [106.8955, -6.1185],
  'Tanjung Priok': [106.8815, -6.1105],

  // --- MRT NS ---
  'Lebak Bulus': [106.7755, -6.2895],
  Fatmawati: [106.7925, -6.2755],
  'Cipete Raya': [106.8015, -6.2625],
  'Haji Nawi': [106.8045, -6.2555],
  'Blok A': [106.8005, -6.2495],
  'Blok M': [106.7985, -6.2435],
  ASEAN: [106.7995, -6.2365],
  Senayan: [106.8025, -6.2265],
  Istora: [106.8075, -6.2215],
  'Bendungan Hilir': [106.8125, -6.2145],
  Setiabudi: [106.8215, -6.2085],
  'Dukuh Atas': [106.8225, -6.2035],
  'Bundaran HI': [106.8235, -6.1945],

  // --- LRT Jakarta ---
  'Pegangsaan Dua': [106.9125, -6.1585],
  'Boulevard Utara': [106.9055, -6.1655],
  'Boulevard Selatan': [106.8985, -6.1725],
  Pulomas: [106.8885, -6.1785],
  Equestrian: [106.8785, -6.1855],
  Velodrome: [106.8685, -6.1925],

  // --- LRT Jabodebek ---
  'Dukuh Atas BNI': [106.8228, -6.2028],
  'Rasuna Said': [106.8325, -6.2155],
  Kuningan: [106.8355, -6.2285],
  Pancoran: [106.8425, -6.2425],
  Cikoko: [106.8525, -6.2485],
  Ciliwung: [106.8585, -6.2455],
  TMII: [106.8955, -6.2925],
  'Kampung Rambutan': [106.9255, -6.3085],
  Ciracas: [106.9555, -6.3255],
  Harjamukti: [106.9855, -6.3485],
  Halim: [106.8855, -6.2625],
  'Jati Bening Baru': [106.9255, -6.2655],
  'Cikunir 1': [106.9555, -6.2685],
  'Cikunir 2': [106.9785, -6.2725],
  'Bekasi Barat': [107.0055, -6.2785],
  'Jati Mulya': [107.0355, -6.2855],
}

/** Station order per playable lineId (matches stations.ts). */
const LINES = {
  bogor: [
    'Jakarta Kota',
    'Jayakarta',
    'Mangga Besar',
    'Sawah Besar',
    'Juanda',
    'Gondangdia',
    'Cikini',
    'Manggarai',
    'Tebet',
    'Cawang',
    'Duren Kalibata',
    'Pasar Minggu Baru',
    'Pasar Minggu',
    'Tanjung Barat',
    'Lenteng Agung',
    'Universitas Pancasila',
    'Universitas Indonesia',
    'Pondok Cina',
    'Depok Baru',
    'Depok',
    'Citayam',
    'Bojonggede',
    'Cilebut',
    'Bogor',
    'Pondok Rajeg',
    'Cibinong',
    'Nambo',
  ],
  cikarang: [
    'Jatinegara',
    'Klender',
    'Buaran',
    'Klender Baru',
    'Cakung',
    'Kranji',
    'Bekasi',
    'Bekasi Timur',
    'Tambun',
    'Cibitung',
    'Metland Telagamurni',
    'Cikarang',
    'Kampung Bandan',
    'Angke',
    'Duri',
    'Tanah Abang',
    'Karet',
    'BNI City',
    'Sudirman',
    'Manggarai',
    'Matraman',
    'Rajawali',
    'Kemayoran',
    'Pasar Senen',
    'Gang Sentiong',
    'Kramat',
    'Pondok Jati',
    'Jakarta Kota',
  ],
  rangkasbitung: [
    'Tanah Abang',
    'Palmerah',
    'Kebayoran',
    'Pondok Ranji',
    'Jurangmangu',
    'Sudimara',
    'Rawa Buntu',
    'Serpong',
    'Cisauk',
    'Cicayur',
    'Jatake',
    'Parung Panjang',
    'Cilejit',
    'Daru',
    'Tenjo',
    'Tigaraksa',
    'Cikoya',
    'Maja',
    'Citeras',
    'Rangkasbitung',
  ],
  tangerang: [
    'Duri',
    'Grogol',
    'Pesing',
    'Taman Kota',
    'Bojong Indah',
    'Rawa Buaya',
    'Kalideres',
    'Poris',
    'Batu Ceper',
    'Tanah Tinggi',
    'Tangerang',
  ],
  'tanjung-priok': [
    'Jakarta Kota',
    'Kampung Bandan',
    'Ancol',
    'Jakarta International Stadium',
    'Tanjung Priok',
  ],
  'mrt-ns': [
    'Lebak Bulus',
    'Fatmawati',
    'Cipete Raya',
    'Haji Nawi',
    'Blok A',
    'Blok M',
    'ASEAN',
    'Senayan',
    'Istora',
    'Bendungan Hilir',
    'Setiabudi',
    'Dukuh Atas',
    'Bundaran HI',
  ],
  'lrt-jakarta': [
    'Pegangsaan Dua',
    'Boulevard Utara',
    'Boulevard Selatan',
    'Pulomas',
    'Equestrian',
    'Velodrome',
  ],
  'lrt-cibubur': [
    'Dukuh Atas BNI',
    'Setiabudi',
    'Rasuna Said',
    'Kuningan',
    'Pancoran',
    'Cikoko',
    'Ciliwung',
    'Cawang',
    'TMII',
    'Kampung Rambutan',
    'Ciracas',
    'Harjamukti',
  ],
  'lrt-bekasi': [
    'Dukuh Atas BNI',
    'Setiabudi',
    'Rasuna Said',
    'Kuningan',
    'Pancoran',
    'Cikoko',
    'Ciliwung',
    'Cawang',
    'Halim',
    'Jati Bening Baru',
    'Cikunir 1',
    'Cikunir 2',
    'Bekasi Barat',
    'Jati Mulya',
  ],
}

/**
 * Simplified kota rings [lon, lat][] — first===last.
 * Approximate real admin extents (8–16 verts), not axis-aligned boxes. Kota only.
 */
const BORDERS = [
  {
    id: 'jakarta-pusat',
    name: 'Jakarta Pusat',
    ring: [
      [106.805, -6.148],
      [106.828, -6.142],
      [106.852, -6.145],
      [106.872, -6.158],
      [106.868, -6.178],
      [106.855, -6.198],
      [106.838, -6.210],
      [106.818, -6.208],
      [106.800, -6.192],
      [106.795, -6.168],
      [106.805, -6.148],
    ],
  },
  {
    id: 'jakarta-utara',
    name: 'Jakarta Utara',
    ring: [
      [106.735, -6.108],
      [106.762, -6.092],
      [106.798, -6.085],
      [106.845, -6.088],
      [106.892, -6.095],
      [106.938, -6.102],
      [106.972, -6.115],
      [106.978, -6.138],
      [106.955, -6.152],
      [106.910, -6.155],
      [106.860, -6.148],
      [106.812, -6.142],
      [106.768, -6.145],
      [106.742, -6.132],
      [106.735, -6.108],
    ],
  },
  {
    id: 'jakarta-barat',
    name: 'Jakarta Barat',
    ring: [
      [106.688, -6.118],
      [106.722, -6.112],
      [106.758, -6.122],
      [106.792, -6.135],
      [106.798, -6.162],
      [106.790, -6.192],
      [106.772, -6.218],
      [106.742, -6.228],
      [106.708, -6.222],
      [106.682, -6.198],
      [106.675, -6.165],
      [106.680, -6.138],
      [106.688, -6.118],
    ],
  },
  {
    id: 'jakarta-selatan',
    name: 'Jakarta Selatan',
    ring: [
      [106.758, -6.208],
      [106.798, -6.202],
      [106.838, -6.208],
      [106.868, -6.222],
      [106.872, -6.255],
      [106.862, -6.292],
      [106.845, -6.325],
      [106.818, -6.338],
      [106.782, -6.335],
      [106.752, -6.312],
      [106.742, -6.275],
      [106.748, -6.238],
      [106.758, -6.208],
    ],
  },
  {
    id: 'jakarta-timur',
    name: 'Jakarta Timur',
    ring: [
      [106.858, -6.168],
      [106.902, -6.162],
      [106.948, -6.172],
      [106.982, -6.188],
      [106.995, -6.225],
      [106.988, -6.268],
      [106.968, -6.308],
      [106.942, -6.338],
      [106.908, -6.342],
      [106.875, -6.325],
      [106.858, -6.288],
      [106.852, -6.245],
      [106.855, -6.205],
      [106.858, -6.168],
    ],
  },
  {
    id: 'depok',
    name: 'Depok',
    ring: [
      [106.752, -6.348],
      [106.798, -6.342],
      [106.848, -6.348],
      [106.888, -6.362],
      [106.902, -6.395],
      [106.895, -6.432],
      [106.868, -6.458],
      [106.825, -6.465],
      [106.782, -6.455],
      [106.752, -6.428],
      [106.742, -6.392],
      [106.748, -6.365],
      [106.752, -6.348],
    ],
  },
  {
    id: 'bogor',
    name: 'Bogor',
    ring: [
      [106.762, -6.562],
      [106.788, -6.552],
      [106.818, -6.558],
      [106.838, -6.578],
      [106.842, -6.608],
      [106.828, -6.635],
      [106.798, -6.648],
      [106.768, -6.638],
      [106.752, -6.612],
      [106.755, -6.582],
      [106.762, -6.562],
    ],
  },
  {
    id: 'tangerang',
    name: 'Tangerang',
    ring: [
      [106.598, -6.148],
      [106.635, -6.138],
      [106.672, -6.142],
      [106.698, -6.158],
      [106.705, -6.182],
      [106.692, -6.208],
      [106.668, -6.225],
      [106.632, -6.228],
      [106.602, -6.212],
      [106.588, -6.185],
      [106.592, -6.162],
      [106.598, -6.148],
    ],
  },
  {
    id: 'tangerang-selatan',
    name: 'Tangerang Selatan',
    ring: [
      [106.658, -6.258],
      [106.702, -6.252],
      [106.748, -6.262],
      [106.778, -6.285],
      [106.782, -6.318],
      [106.765, -6.345],
      [106.728, -6.358],
      [106.688, -6.352],
      [106.655, -6.328],
      [106.648, -6.295],
      [106.652, -6.272],
      [106.658, -6.258],
    ],
  },
  {
    id: 'bekasi',
    name: 'Bekasi',
    ring: [
      [106.948, -6.198],
      [106.992, -6.188],
      [107.032, -6.195],
      [107.062, -6.218],
      [107.072, -6.255],
      [107.058, -6.292],
      [107.028, -6.318],
      [106.988, -6.328],
      [106.955, -6.312],
      [106.938, -6.278],
      [106.935, -6.238],
      [106.942, -6.212],
      [106.948, -6.198],
    ],
  },
]

/**
 * West Java land within / beyond the working viewport.
 * North edge ≈ real Java Sea coastline (incl. Jakarta Bay); south/east/west
 * extend past the bbox so inland Java fills the frame (not a Jabodetabek island).
 */
const LAND_RING = [
  // North coast west → east (Java Sea), simplified but bay-shaped
  [106.1, -5.99],
  [106.25, -6.0],
  [106.4, -6.01],
  [106.55, -6.03],
  [106.65, -6.06], // toward Muara Angke
  [106.72, -6.09], // Ancol / Jakarta Bay
  [106.78, -6.1],
  [106.85, -6.105], // Tanjung Priok bay
  [106.92, -6.09],
  [106.98, -6.07],
  [107.05, -6.04],
  [107.12, -6.02],
  [107.2, -6.01],
  [107.3, -6.0], // east of Cikarang / Karawang coast
  // Inland: extend past bbox so the whole south of the viewport is land
  [107.3, -6.95],
  [106.1, -6.95],
  [106.1, -5.99],
]

function fc(features) {
  return { type: 'FeatureCollection', features }
}

function writeJson(name, data) {
  writeFileSync(join(OUT, name), JSON.stringify(data, null, 2) + '\n', 'utf8')
}

mkdirSync(OUT, { recursive: true })

writeJson(
  'land.geojson',
  fc([
    {
      type: 'Feature',
      properties: { name: 'West Java land' },
      geometry: { type: 'Polygon', coordinates: [LAND_RING] },
    },
  ]),
)

writeJson(
  'borders.geojson',
  fc(
    BORDERS.map((b) => ({
      type: 'Feature',
      properties: { id: b.id, name: b.name },
      geometry: { type: 'Polygon', coordinates: [b.ring] },
    })),
  ),
)

for (const [lineId, names] of Object.entries(LINES)) {
  const missing = names.filter((n) => !COORDS[n])
  if (missing.length) {
    console.error(`Missing coords for ${lineId}:`, missing)
    process.exit(1)
  }
  const pathCoords = names.map((n) => COORDS[n])
  const features = [
    {
      type: 'Feature',
      properties: { lineId, kind: 'path' },
      geometry: { type: 'LineString', coordinates: pathCoords },
    },
    ...names.map((name) => ({
      type: 'Feature',
      properties: { lineId, name, kind: 'station' },
      geometry: { type: 'Point', coordinates: COORDS[name] },
    })),
  ]
  writeJson(`line-${lineId}.geojson`, fc(features))
}

console.log(`Wrote land, borders, and ${Object.keys(LINES).length} line-*.geojson → ${OUT}`)
