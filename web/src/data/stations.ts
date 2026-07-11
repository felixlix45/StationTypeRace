export type StationLine = {
  id: string
  name: string
  system: 'KRL' | 'MRT' | 'LRT Jakarta' | 'LRT Jabodebek'
  color: string
  route: string
  stations: string[]
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
