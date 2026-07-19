export type StationLine = {
  id: string
  name: string
  system: 'KRL' | 'MRT' | 'LRT Jakarta' | 'LRT Jabodebek'
  color: string
  route: string
  stations: string[]
  /**
   * Approximate km between consecutive stations.
   * Length = stations.length - 1; segmentKm[i] = stations[i] → stations[i + 1].
   * See docs/research/2026-07-11-station-stops-catalog.md § Inter-station distances.
   */
  segmentKm: number[]
}

/** Operational stop names only — from docs/research/2026-07-11-station-stops-catalog.md */
export const STATION_LINES: StationLine[] = [
  {
    id: 'bogor',
    name: 'Bogor Line',
    system: 'KRL',
    color: '#E53935',
    route: 'Jakarta Kota → Bogor / Nambo',
    stations: [
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
    segmentKm: [
      1.4, 1.0, 1.1, 0.7, 2.2, 1.7, 1.6, 2.6, 1.3, 1.4, 1.5, 1.7, 3.0, 2.4, 1.0,
      2.2, 1.1, 2.5, 1.7, 5.0, 5.2, 4.3, 7.5,
      // List discontinuity: Bogor terminus → Nambo branch (real branch is from Citayam)
      20.3, 3.2, 6.3,
    ],
  },
  {
    id: 'cikarang',
    name: 'Cikarang Loop Line',
    system: 'KRL',
    color: '#1E88E5',
    route: 'Jatinegara → Cikarang + loop',
    stations: [
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
    segmentKm: [
      3.4, 3.1, 1.3, 1.3, 3.1, 2.5, 2.8, 4.8, 4.8, 4.8, 4.8,
      // List discontinuity: Cikarang → Kampung Bandan via Jatinegara + Pasar Senen
      47.4, 4.1, 1.2, 3.6, 2.0, 1.2, 0.8, 3.2, 1.3,
      // List discontinuity: Matraman → Rajawali (Pasar Senen corridor)
      8.3, 1.9, 1.4, 1.6, 1.0, 1.8,
      // List discontinuity: Pondok Jati → Jakarta Kota via Kampung Bandan
      10.5,
    ],
  },
  {
    id: 'rangkasbitung',
    name: 'Rangkasbitung Line',
    system: 'KRL',
    color: '#43A047',
    route: 'Tanah Abang → Rangkasbitung',
    stations: [
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
    segmentKm: [
      3.2, 3.7, 6.2, 2.2, 2.0, 4.6, 2.4, 1.8, 2.5, 2.5, 3.5, 7.0, 2.7, 3.9, 3.0,
      2.7, 1.9, 8.5, 8.7,
    ],
  },
  {
    id: 'tangerang',
    name: 'Tangerang Line',
    system: 'KRL',
    color: '#8D6E63',
    route: 'Duri → Tangerang',
    stations: [
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
    segmentKm: [1.7, 2.0, 1.5, 2.4, 1.2, 2.5, 2.5, 1.8, 2.0, 1.6],
  },
  {
    id: 'tanjung-priok',
    name: 'Tanjung Priok Line',
    system: 'KRL',
    color: '#EC407A',
    route: 'Jakarta Kota → Tanjung Priok',
    stations: [
      'Jakarta Kota',
      'Kampung Bandan',
      'Ancol',
      'Jakarta International Stadium',
      'Tanjung Priok',
    ],
    segmentKm: [1.4, 2.2, 3.5, 8.3],
  },
  {
    id: 'mrt-ns',
    name: 'MRT North–South',
    system: 'MRT',
    color: '#AD1457',
    route: 'Lebak Bulus → Bundaran HI',
    stations: [
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
    segmentKm: [2.2, 1.8, 1.3, 1.2, 1.3, 0.6, 2.0, 0.9, 1.4, 1.1, 1.0, 0.9],
  },
  {
    id: 'lrt-jakarta',
    name: 'LRT Jakarta South',
    system: 'LRT Jakarta',
    color: '#F9A825',
    route: 'Pegangsaan Dua → Velodrome',
    stations: [
      'Pegangsaan Dua',
      'Boulevard Utara',
      'Boulevard Selatan',
      'Pulomas',
      'Equestrian',
      'Velodrome',
    ],
    segmentKm: [1.2, 1.1, 1.2, 1.1, 1.2],
  },
  {
    id: 'lrt-cibubur',
    name: 'LRT Cibubur Line',
    system: 'LRT Jabodebek',
    color: '#FB8C00',
    route: 'Dukuh Atas BNI → Harjamukti',
    stations: [
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
    segmentKm: [1.2, 1.3, 1.4, 1.5, 1.5, 1.5, 1.6, 4.0, 3.5, 3.5, 4.0],
  },
  {
    id: 'lrt-bekasi',
    name: 'LRT Bekasi Line',
    system: 'LRT Jabodebek',
    color: '#EF6C00',
    route: 'Dukuh Atas BNI → Jati Mulya',
    stations: [
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
    segmentKm: [1.2, 1.3, 1.4, 1.5, 1.5, 1.5, 1.6, 4.0, 3.5, 2.8, 2.2, 3.0, 3.0],
  },
]

export type LineCategory = 'KRL' | 'MRT' | 'LRT'

export const LINE_CATEGORIES: LineCategory[] = ['KRL', 'MRT', 'LRT']

function categoryForSystem(system: StationLine['system']): LineCategory {
  if (system === 'KRL') return 'KRL'
  if (system === 'MRT') return 'MRT'
  return 'LRT'
}

/** Lines grouped for the homepage picker (LRT Jakarta + Jabodebek under LRT). */
export function linesByCategory(): Record<LineCategory, StationLine[]> {
  const groups: Record<LineCategory, StationLine[]> = {
    KRL: [],
    MRT: [],
    LRT: [],
  }
  for (const line of STATION_LINES) {
    groups[categoryForSystem(line.system)].push(line)
  }
  return groups
}

export function pickRandomLine(): StationLine {
  const index = Math.floor(Math.random() * STATION_LINES.length)
  return STATION_LINES[index]!
}
