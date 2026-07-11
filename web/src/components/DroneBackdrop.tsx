/** Jakarta aerial video plate + neon haze overlays; SVG skyline as load fallback */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react'

/** Self-hosted plate — see web/public/drone/ATTRIBUTION.md */
const DRONE_VIDEO_SRC = '/drone/jakarta-orbit.mp4'
const DRONE_POSTER_SRC = '/drone/jakarta-poster.jpg'

export type LandmarkId =
  | 'ancol'
  | 'bundaran-hi'
  | 'cathedral'
  | 'dukuh-atas'
  | 'fatahillah'
  | 'gbk'
  | 'glodok'
  | 'istiqlal'
  | 'jakarta-kota'
  | 'jis'
  | 'kota-tua'
  | 'kota-tua-aerial'
  | 'lapangan-banteng'
  | 'monas'
  | 'monas-plaza'
  | 'mrt'
  | 'museum-nasional'
  | 'night'
  | 'semanggi'
  | 'senayan'
  | 'skyline'
  | 'sudirman'
  | 'tugu-tani'
  | 'wisma46'

export type LandmarkCredit = {
  kind: 'Photo' | 'Video'
  creator: string
  /** Short venue label for HUD, e.g. Pexels / Wikimedia */
  source: string
  /** Short license name shown in credits */
  license: string
  url?: string
}

/** Idle/home aerial loop credit (same source as ATTRIBUTION.md) */
export const HOME_AERIAL_CREDIT: LandmarkCredit = {
  kind: 'Video',
  creator: 'Afif Ramdhasuma',
  source: 'Pexels',
  license: 'Pexels',
  url: 'https://www.pexels.com/video/cinematic-aerial-view-of-iconic-istiqlal-mosque-near-national-monument-of-jakarta-or-monas-16891597/',
}

export type Landmark = {
  id: LandmarkId
  name: string
  subtitle: string
  /** Focus point in panorama viewBox space (0–2400 × 0–900) */
  focusX: number
  focusY: number
  credit: LandmarkCredit
}

export const JAKARTA_LANDMARKS: readonly Landmark[] = [
  {
    id: 'ancol',
    name: 'Ancol',
    subtitle: 'North bay edge',
    focusX: 180,
    focusY: 520,
    credit: {
      kind: 'Photo',
      creator: 'Midori',
      source: 'Wikimedia',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Festival_beach_Ancol_Jakarta.jpg',
    },
  },
  {
    id: 'kota-tua',
    name: 'Kota Tua',
    subtitle: 'Fatahillah Square',
    focusX: 420,
    focusY: 480,
    credit: {
      kind: 'Photo',
      creator: 'Andri Wijayanto',
      source: 'Pexels',
      license: 'Pexels',
      url: 'https://www.pexels.com/photo/historic-jakarta-landmark-with-colonial-architecture-38186513/',
    },
  },
  {
    id: 'kota-tua-aerial',
    name: 'Kota Tua Aerial',
    subtitle: 'Old Town from above',
    focusX: 380,
    focusY: 460,
    credit: {
      kind: 'Photo',
      creator: 'IndoDroneMan',
      source: 'Wikimedia',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:DJI_0123_-_Kota_Tua_Jakarta.jpg',
    },
  },
  {
    id: 'glodok',
    name: 'Glodok',
    subtitle: 'Chinatown temple',
    focusX: 300,
    focusY: 500,
    credit: {
      kind: 'Photo',
      creator: 'Gunawan Kartapranata',
      source: 'Wikimedia',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Klenteng_Jin_De_Yuan,_Glodok,_Jakarta.jpg',
    },
  },
  {
    id: 'fatahillah',
    name: 'Museum Fatahillah',
    subtitle: 'Jakarta History Museum',
    focusX: 450,
    focusY: 470,
    credit: {
      kind: 'Photo',
      creator: 'Dederohman',
      source: 'Wikimedia',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Museum_Fatahillah.jpg',
    },
  },
  {
    id: 'jakarta-kota',
    name: 'Jakarta Kota',
    subtitle: 'Heritage station',
    focusX: 500,
    focusY: 490,
    credit: {
      kind: 'Photo',
      creator: 'hiroo',
      source: 'Wikimedia',
      license: 'CC BY-SA 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Jakarta_Kota_Station.jpg',
    },
  },
  {
    id: 'lapangan-banteng',
    name: 'Lapangan Banteng',
    subtitle: 'West Irian Monument',
    focusX: 620,
    focusY: 450,
    credit: {
      kind: 'Photo',
      creator: 'Cun Cun',
      source: 'Wikimedia',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:West_Irian_Liberation_Monument_at_Lapangan_Banteng.jpg',
    },
  },
  {
    id: 'istiqlal',
    name: 'Istiqlal Mosque',
    subtitle: 'Merdeka axis',
    focusX: 720,
    focusY: 420,
    credit: {
      kind: 'Photo',
      creator: 'Afif Ramdhasuma',
      source: 'Pexels',
      license: 'Pexels',
      url: 'https://www.pexels.com/video/cinematic-aerial-view-of-iconic-istiqlal-mosque-near-national-monument-of-jakarta-or-monas-16891597/',
    },
  },
  {
    id: 'cathedral',
    name: 'Jakarta Cathedral',
    subtitle: 'Near Istiqlal',
    focusX: 780,
    focusY: 430,
    credit: {
      kind: 'Photo',
      creator: 'Gunawan Kartapranata',
      source: 'Wikimedia',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Jakarta_Cathedral_Afternoon.JPG',
    },
  },
  {
    id: 'monas',
    name: 'Monas',
    subtitle: 'National Monument',
    focusX: 1040,
    focusY: 360,
    credit: {
      kind: 'Photo',
      creator: 'Afif Ramdhasuma',
      source: 'Pexels',
      license: 'Pexels',
      url: 'https://www.pexels.com/video/cinematic-aerial-view-of-iconic-istiqlal-mosque-near-national-monument-of-jakarta-or-monas-16891597/',
    },
  },
  {
    id: 'monas-plaza',
    name: 'Monas Plaza',
    subtitle: 'Merdeka Square',
    focusX: 1100,
    focusY: 380,
    credit: {
      kind: 'Photo',
      creator: 'Michaelmeer',
      source: 'Wikimedia',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:National_Monument_Jakarta.jpg',
    },
  },
  {
    id: 'museum-nasional',
    name: 'Museum Nasional',
    subtitle: 'Elephant Building',
    focusX: 960,
    focusY: 440,
    credit: {
      kind: 'Photo',
      creator: 'Banacama',
      source: 'Wikimedia',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Museum_Nasional_Jakarta.jpg',
    },
  },
  {
    id: 'tugu-tani',
    name: 'Tugu Tani',
    subtitle: 'Farmer statue',
    focusX: 1180,
    focusY: 460,
    credit: {
      kind: 'Photo',
      creator: 'Yoga Putra Prathama',
      source: 'Wikimedia',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Tugu_Tani.jpg',
    },
  },
  {
    id: 'bundaran-hi',
    name: 'Bundaran HI',
    subtitle: 'Selamat Datang',
    focusX: 1320,
    focusY: 460,
    credit: {
      kind: 'Photo',
      creator: 'Adisurahman',
      source: 'Wikimedia',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Jakarta_Bundaran_HI_.jpg',
    },
  },
  {
    id: 'dukuh-atas',
    name: 'Dukuh Atas',
    subtitle: 'Rail interchange',
    focusX: 1580,
    focusY: 470,
    credit: {
      kind: 'Photo',
      creator: 'Slleong',
      source: 'Wikimedia',
      license: 'CC0',
      url: 'https://commons.wikimedia.org/wiki/File:Dukuh_Atas_1.jpg',
    },
  },
  {
    id: 'mrt',
    name: 'MRT Elevated',
    subtitle: 'North–South line',
    focusX: 1500,
    focusY: 480,
    credit: {
      kind: 'Photo',
      creator: 'Lima_Em_Railfans',
      source: 'Wikimedia',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Inside_the_elevated_MRT_Jakarta_Station.jpg',
    },
  },
  {
    id: 'wisma46',
    name: 'Wisma 46',
    subtitle: 'Thamrin tower',
    focusX: 1400,
    focusY: 360,
    credit: {
      kind: 'Photo',
      creator: 'Medelam',
      source: 'Wikimedia',
      license: 'CC BY 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Wisma_46_(Januari_2025).jpg',
    },
  },
  {
    id: 'sudirman',
    name: 'Sudirman–SCBD',
    subtitle: 'Golden Triangle',
    focusX: 1880,
    focusY: 380,
    credit: {
      kind: 'Photo',
      creator: 'Rantemario',
      source: 'Wikimedia',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:SCBD_Jakarta.jpg',
    },
  },
  {
    id: 'skyline',
    name: 'Jakarta Skyline',
    subtitle: 'CBD towers',
    focusX: 1750,
    focusY: 350,
    credit: {
      kind: 'Photo',
      creator: 'yohanes budiyanto',
      source: 'Wikimedia',
      license: 'CC BY 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Jakarta_Skyline_Part_2.jpg',
    },
  },
  {
    id: 'night',
    name: 'Jakarta Night',
    subtitle: 'City lights',
    focusX: 2000,
    focusY: 320,
    credit: {
      kind: 'Photo',
      creator: 'Sharon Sakbana',
      source: 'Wikimedia',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Jakarta_Night_sky.jpg',
    },
  },
  {
    id: 'semanggi',
    name: 'Semanggi',
    subtitle: 'Interchange',
    focusX: 2050,
    focusY: 420,
    credit: {
      kind: 'Photo',
      creator: 'Muhammad Rasyid Prabowo',
      source: 'Wikimedia',
      license: 'CC BY-SA 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Simpang_Semanggi,_Jakarta.jpg',
    },
  },
  {
    id: 'senayan',
    name: 'Bundaran Senayan',
    subtitle: 'TransJakarta hub',
    focusX: 2120,
    focusY: 470,
    credit: {
      kind: 'Photo',
      creator: 'Atmawinanda',
      source: 'Wikimedia',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Bis_Transjakarta_melewati_halte_Bundaran_Senayan_Jakarta.jpg',
    },
  },
  {
    id: 'gbk',
    name: 'Gelora Bung Karno',
    subtitle: 'Senayan stadium',
    focusX: 2180,
    focusY: 480,
    credit: {
      kind: 'Photo',
      creator: 'Davidelit',
      source: 'Wikimedia',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:GeloraBungKarno.jpg',
    },
  },
  {
    id: 'jis',
    name: 'Jakarta International Stadium',
    subtitle: 'North Jakarta',
    focusX: 200,
    focusY: 400,
    credit: {
      kind: 'Photo',
      creator: 'Rudiwaka',
      source: 'Wikimedia',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Jakarta_International_Stadium_from_Toll_road.jpg',
    },
  },
] as const

/** Race-start landmark stills (hosted locally). Credits in ATTRIBUTION.md */
export const LANDMARK_MEDIA: Record<
  LandmarkId,
  { src: string; objectPosition?: string }
> = {
  ancol: { src: '/drone/landmarks/ancol.jpg', objectPosition: 'center 45%' },
  'bundaran-hi': {
    src: '/drone/landmarks/bundaran-hi.jpg',
    objectPosition: 'center 45%',
  },
  cathedral: {
    src: '/drone/landmarks/cathedral.jpg',
    objectPosition: 'center 35%',
  },
  'dukuh-atas': {
    src: '/drone/landmarks/dukuh-atas.jpg',
    objectPosition: 'center 42%',
  },
  fatahillah: {
    src: '/drone/landmarks/fatahillah.jpg',
    objectPosition: 'center 40%',
  },
  gbk: { src: '/drone/landmarks/gbk.jpg', objectPosition: 'center 48%' },
  glodok: { src: '/drone/landmarks/glodok.jpg', objectPosition: 'center 40%' },
  istiqlal: {
    src: '/drone/landmarks/istiqlal.jpg',
    objectPosition: 'center 42%',
  },
  'jakarta-kota': {
    src: '/drone/landmarks/jakarta-kota.jpg',
    objectPosition: 'center 45%',
  },
  jis: { src: '/drone/landmarks/jis.jpg', objectPosition: 'center 45%' },
  'kota-tua': {
    src: '/drone/landmarks/kota-tua.jpg',
    objectPosition: 'center 40%',
  },
  'kota-tua-aerial': {
    src: '/drone/landmarks/kota-tua-aerial.jpg',
    objectPosition: 'center 45%',
  },
  'lapangan-banteng': {
    src: '/drone/landmarks/lapangan-banteng.jpg',
    objectPosition: 'center 30%',
  },
  monas: { src: '/drone/landmarks/monas.jpg', objectPosition: 'center 40%' },
  'monas-plaza': {
    src: '/drone/landmarks/monas-plaza.jpg',
    objectPosition: 'center 35%',
  },
  mrt: { src: '/drone/landmarks/mrt.jpg', objectPosition: 'center 45%' },
  'museum-nasional': {
    src: '/drone/landmarks/museum-nasional.jpg',
    objectPosition: 'center 42%',
  },
  night: { src: '/drone/landmarks/night.jpg', objectPosition: 'center 40%' },
  semanggi: {
    src: '/drone/landmarks/semanggi.jpg',
    objectPosition: 'center 45%',
  },
  senayan: {
    src: '/drone/landmarks/senayan.jpg',
    objectPosition: 'center 48%',
  },
  skyline: {
    src: '/drone/landmarks/skyline.jpg',
    objectPosition: 'center 40%',
  },
  sudirman: {
    src: '/drone/landmarks/sudirman.jpg',
    objectPosition: 'center 45%',
  },
  'tugu-tani': {
    src: '/drone/landmarks/tugu-tani.jpg',
    objectPosition: 'center 35%',
  },
  wisma46: {
    src: '/drone/landmarks/wisma46.jpg',
    objectPosition: 'center 30%',
  },
}

export function formatLandmarkCredit(credit: LandmarkCredit): string {
  const licenseBit =
    credit.license === credit.source || credit.license === 'Pexels'
      ? credit.source
      : `${credit.license} · ${credit.source}`
  return `${credit.kind}: ${credit.creator} · ${licenseBit}`
}

const VIEW_W = 2400
const VIEW_H = 900

export function pickRandomLandmark(excludeId?: LandmarkId | null): Landmark {
  const pool =
    excludeId != null
      ? JAKARTA_LANDMARKS.filter((l) => l.id !== excludeId)
      : [...JAKARTA_LANDMARKS]
  const list = pool.length > 0 ? pool : [...JAKARTA_LANDMARKS]
  return list[Math.floor(Math.random() * list.length)]!
}

function landmarkById(id: LandmarkId | null): Landmark | null {
  if (!id) return null
  return JAKARTA_LANDMARKS.find((l) => l.id === id) ?? null
}

type DroneBackdropProps = {
  /** idle = orbit overview; racing/finished = zoomed landmark */
  mode: 'orbit' | 'zoom'
  landmarkId: LandmarkId | null
  /** Show source credit (top-left) on home, race, and results */
  showCredit?: boolean
}

export function DroneBackdrop({
  mode,
  landmarkId,
  showCredit = false,
}: DroneBackdropProps) {
  const landmark = landmarkById(landmarkId)
  const [heldLandmark, setHeldLandmark] = useState<Landmark | null>(null)
  const focusLandmark = landmark ?? heldLandmark
  const credit =
    mode === 'zoom' && focusLandmark
      ? focusLandmark.credit
      : HOME_AERIAL_CREDIT
  const creditKey =
    mode === 'zoom' && focusLandmark ? focusLandmark.id : 'home-aerial'
  const focusX = focusLandmark?.focusX ?? VIEW_W * 0.5
  const focusY = focusLandmark?.focusY ?? VIEW_H * 0.48
  const focusXPct = (focusX / VIEW_W) * 100
  const focusYPct = (focusY / VIEW_H) * 100

  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    if (landmark) setHeldLandmark(landmark)
  }, [landmark])

  useEffect(() => {
    for (const media of Object.values(LANDMARK_MEDIA)) {
      const img = new Image()
      img.src = media.src
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || videoFailed || reducedMotion) return

    let cancelled = false

    const shouldPlay = () =>
      !cancelled &&
      mode === 'orbit' &&
      document.visibilityState === 'visible'

    const tryPlay = () => {
      if (!shouldPlay()) {
        video.pause()
        return
      }
      // Always 1x — never leave a non-default rate from prior state / browser quirks.
      video.defaultPlaybackRate = 1
      video.playbackRate = 1
      void video.play().catch((err: unknown) => {
        // AbortError: interrupted by Strict Mode / re-play — retry later.
        // NotAllowedError: wait for visibility / user gesture — do NOT swap to SVG.
        const name =
          err && typeof err === 'object' && 'name' in err
            ? String((err as { name: string }).name)
            : ''
        if (name === 'AbortError' || name === 'NotAllowedError') return
      })
    }

    tryPlay()
    video.addEventListener('canplay', tryPlay)
    document.addEventListener('visibilitychange', tryPlay)
    window.addEventListener('pointerdown', tryPlay)
    window.addEventListener('keydown', tryPlay)

    return () => {
      cancelled = true
      video.removeEventListener('canplay', tryPlay)
      document.removeEventListener('visibilitychange', tryPlay)
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('keydown', tryPlay)
    }
  }, [reducedMotion, videoFailed, mode])

  const useSvgFallback = videoFailed
  const showStaticPoster = !videoFailed && reducedMotion
  const plateLandmark = landmark ?? heldLandmark
  const landmarkMedia = plateLandmark ? LANDMARK_MEDIA[plateLandmark.id] : null
  const showLandmarkPlate = mode === 'zoom' && landmark != null && landmarkMedia != null
  const homePlate = useSvgFallback
    ? 'svg'
    : showStaticPoster
      ? 'poster'
      : 'video'

  return (
    <div
      className="drone-backdrop"
      data-mode={mode}
      data-home={homePlate}
      data-landmark={showLandmarkPlate ? 'on' : 'off'}
      style={
        {
          ['--drone-focus-x' as string]: `${focusXPct}%`,
          ['--drone-focus-y' as string]: `${focusYPct}%`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <div className="drone-backdrop__stage">
        <div className="drone-backdrop__orbit">
          <div className="drone-backdrop__parallax" />

          <div
            className={`drone-backdrop__plate drone-backdrop__plate--home${
              !showLandmarkPlate ? ' is-active' : ''
            }`}
          >
            {!useSvgFallback && (
              <div className="drone-backdrop__video-wrap">
                {showStaticPoster ? (
                  <img
                    className="drone-backdrop__poster"
                    src={DRONE_POSTER_SRC}
                    alt=""
                    draggable={false}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="drone-backdrop__video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    poster={DRONE_POSTER_SRC}
                    onError={() => setVideoFailed(true)}
                  >
                    <source src={DRONE_VIDEO_SRC} type="video/mp4" />
                  </video>
                )}
              </div>
            )}

            {useSvgFallback && (
              <div className="drone-backdrop__world">
                <JakartaPanoramaSvg />
              </div>
            )}
          </div>

          {landmarkMedia && (
            <div
              className={`drone-backdrop__plate drone-backdrop__plate--landmark${
                showLandmarkPlate ? ' is-active' : ''
              }`}
            >
              <img
                className="drone-backdrop__landmark"
                src={landmarkMedia.src}
                alt=""
                draggable={false}
                style={
                  landmarkMedia.objectPosition
                    ? { objectPosition: landmarkMedia.objectPosition }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="drone-backdrop__haze" />
      <div className="drone-backdrop__vignette" />

      {mode === 'zoom' && landmark && (
        <div className="drone-backdrop__label" key={landmark.id}>
          <span className="drone-backdrop__label-kicker">Approaching</span>
          <span className="drone-backdrop__label-name">{landmark.name}</span>
          <span className="drone-backdrop__label-sub">{landmark.subtitle}</span>
        </div>
      )}

      {showCredit && (
        <p
          className="drone-backdrop__credit"
          key={`credit-${creditKey}`}
          title={credit.url}
        >
          {formatLandmarkCredit(credit)}
        </p>
      )}
    </div>
  )
}

function JakartaPanoramaSvg() {
  return (
    <svg
      className="drone-backdrop__svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="drone-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1a28" />
          <stop offset="45%" stopColor="#0d1520" />
          <stop offset="100%" stopColor="#050b10" />
        </linearGradient>
        <linearGradient id="drone-glow-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb020" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffb020" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="drone-glow-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ef9ff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#7ef9ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="drone-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e2a38" />
          <stop offset="100%" stopColor="#061018" />
        </linearGradient>
        <radialGradient id="drone-hi-ring" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#7ef9ff" stopOpacity="0" />
          <stop offset="78%" stopColor="#7ef9ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffb020" stopOpacity="0.15" />
        </radialGradient>
        <filter id="drone-soft" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
      </defs>

      {/* Sky */}
      <rect width={VIEW_W} height={VIEW_H} fill="url(#drone-sky)" />

      {/* Distant haze bands */}
      <ellipse
        cx="1200"
        cy="380"
        rx="1100"
        ry="120"
        fill="#1e88e5"
        opacity="0.06"
      />
      <ellipse
        cx="400"
        cy="320"
        rx="400"
        ry="80"
        fill="#ffb020"
        opacity="0.07"
      />
      <ellipse
        cx="2000"
        cy="300"
        rx="450"
        ry="90"
        fill="#7ef9ff"
        opacity="0.05"
      />

      {/* Ground plane */}
      <rect y="620" width={VIEW_W} height="280" fill="#060d14" />
      <path
        d="M0 620 Q600 590 1200 610 T2400 600 L2400 900 L0 900 Z"
        fill="#08121a"
        opacity="0.9"
      />

      {/* Road / rail glow ribbons */}
      <path
        d="M0 680 Q400 660 800 675 T1600 665 T2400 680"
        fill="none"
        stroke="#ffb020"
        strokeWidth="2.5"
        opacity="0.22"
      />
      <path
        d="M0 700 Q500 690 1000 705 T2000 695 T2400 710"
        fill="none"
        stroke="#7ef9ff"
        strokeWidth="1.5"
        opacity="0.14"
      />

      {/* —— Ancol / bay —— */}
      <g id="landmark-ancol">
        <path
          d="M20 640 Q120 600 280 620 Q360 635 420 625 L420 900 L20 900 Z"
          fill="url(#drone-water)"
          opacity="0.85"
        />
        <path
          d="M40 655 Q160 630 300 648"
          fill="none"
          stroke="#7ef9ff"
          strokeWidth="1.2"
          opacity="0.25"
        />
        {/* Pier lights */}
        {[80, 140, 200, 260, 320].map((x) => (
          <rect
            key={x}
            x={x}
            y="610"
            width="3"
            height="28"
            fill="#9eb3c2"
            opacity="0.5"
          />
        ))}
        <rect x="60" y="600" width="90" height="18" rx="2" fill="#122030" />
        <rect x="70" y="592" width="14" height="10" fill="#ffb020" opacity="0.4" />
        <rect x="100" y="588" width="20" height="14" fill="#1a3040" />
      </g>

      {/* —— Kota Tua —— */}
      <g id="landmark-kota-tua">
        <rect x="360" y="540" width="48" height="90" fill="#1a2834" />
        <rect x="370" y="520" width="28" height="20" fill="#243444" />
        <polygon
          points="360,540 384,510 408,540"
          fill="#2a3a48"
        />
        <rect x="420" y="555" width="55" height="75" fill="#162430" />
        <polygon
          points="420,555 447,525 475,555"
          fill="#2e4050"
        />
        <rect x="485" y="545" width="40" height="85" fill="#1c2c38" />
        <polygon
          points="485,545 505,518 525,545"
          fill="#334858"
        />
        {/* Plaza glow */}
        <ellipse
          cx="440"
          cy="640"
          rx="70"
          ry="18"
          fill="#ffb020"
          opacity="0.12"
        />
        {/* Warm windows */}
        {[370, 385, 430, 450, 495, 510].map((x, i) => (
          <rect
            key={x}
            x={x}
            y={560 + (i % 3) * 14}
            width="5"
            height="7"
            fill="#ffb020"
            opacity="0.45"
          />
        ))}
      </g>

      {/* —— Istiqlal —— */}
      <g id="landmark-istiqlal">
        <rect x="650" y="480" width="140" height="150" fill="#152028" />
        {/* Dome */}
        <ellipse cx="720" cy="470" rx="72" ry="48" fill="#1e3040" />
        <ellipse cx="720" cy="455" rx="48" ry="32" fill="#2a4458" />
        <circle cx="720" cy="420" r="10" fill="#7ef9ff" opacity="0.55" />
        {/* Minarets */}
        <rect x="640" y="400" width="12" height="210" fill="#1a2e3c" />
        <rect x="638" y="390" width="16" height="14" fill="#7ef9ff" opacity="0.35" />
        <rect x="808" y="400" width="12" height="210" fill="#1a2e3c" />
        <rect x="806" y="390" width="16" height="14" fill="#7ef9ff" opacity="0.35" />
        <rect x="680" y="430" width="8" height="180" fill="#162830" />
        <rect x="752" y="430" width="8" height="180" fill="#162830" />
        {/* Courtyard wash */}
        <rect
          x="660"
          y="620"
          width="120"
          height="8"
          fill="#7ef9ff"
          opacity="0.15"
        />
      </g>

      {/* —— Monas —— */}
      <g id="landmark-monas">
        {/* Plaza */}
        <ellipse
          cx="1040"
          cy="620"
          rx="110"
          ry="28"
          fill="#0f2a18"
          opacity="0.7"
        />
        <ellipse
          cx="1040"
          cy="618"
          rx="90"
          ry="20"
          fill="#ffb020"
          opacity="0.08"
        />
        {/* Obelisk shaft */}
        <polygon
          points="1028,600 1052,600 1046,280 1034,280"
          fill="#c8d4dc"
          opacity="0.85"
        />
        <polygon
          points="1034,280 1046,280 1043,220 1037,220"
          fill="#dce4ea"
        />
        {/* Flame */}
        <ellipse cx="1040" cy="200" rx="18" ry="28" fill="#ffb020" opacity="0.9" />
        <ellipse cx="1040" cy="190" rx="10" ry="16" fill="#fff0c0" opacity="0.85" />
        <rect
          x="1030"
          y="160"
          width="20"
          height="80"
          fill="url(#drone-glow-amber)"
          opacity="0.6"
        />
        {/* Base cupola */}
        <rect x="1010" y="580" width="60" height="28" fill="#9eb3c2" opacity="0.5" />
        <rect x="1020" y="560" width="40" height="22" fill="#b0c0cc" opacity="0.45" />
      </g>

      {/* Mid towers between Monas and HI */}
      <g opacity="0.85">
        <rect x="1120" y="420" width="36" height="210" fill="#121e28" />
        <rect x="1165" y="380" width="28" height="250" fill="#152430" />
        <rect x="1200" y="450" width="42" height="180" fill="#101c26" />
        {windowGrid(1125, 430, 3, 8, 8, 14, '#ffb020', 0.25)}
        {windowGrid(1170, 390, 2, 10, 8, 14, '#7ef9ff', 0.22)}
      </g>

      {/* —— Bundaran HI —— */}
      <g id="landmark-bundaran-hi">
        <circle cx="1320" cy="600" r="70" fill="url(#drone-hi-ring)" />
        <circle
          cx="1320"
          cy="600"
          r="48"
          fill="none"
          stroke="#7ef9ff"
          strokeWidth="3"
          opacity="0.35"
        />
        <circle
          cx="1320"
          cy="600"
          r="28"
          fill="#0a1620"
          stroke="#ffb020"
          strokeWidth="2"
          opacity="0.7"
        />
        {/* Selamat Datang figures (simplified) */}
        <rect x="1314" y="545" width="5" height="40" fill="#e8f0f4" opacity="0.7" />
        <rect x="1322" y="548" width="5" height="37" fill="#e8f0f4" opacity="0.65" />
        <circle cx="1316" cy="540" r="5" fill="#ffb020" opacity="0.6" />
        <circle cx="1325" cy="542" r="5" fill="#ffb020" opacity="0.55" />
        {/* Surrounding hotels */}
        <rect x="1240" y="400" width="40" height="210" fill="#142230" />
        <rect x="1360" y="380" width="48" height="230" fill="#122028" />
        <rect x="1415" y="430" width="32" height="180" fill="#182838" />
        {windowGrid(1245, 410, 3, 9, 8, 14, '#7ef9ff', 0.28)}
        {windowGrid(1368, 395, 3, 10, 9, 14, '#ffb020', 0.22)}
      </g>

      {/* —— Dukuh Atas —— */}
      <g id="landmark-dukuh-atas">
        {/* Elevated deck */}
        <rect x="1510" y="560" width="140" height="16" rx="2" fill="#2a3a4a" />
        <rect
          x="1520"
          y="555"
          width="120"
          height="6"
          fill="#ffb020"
          opacity="0.45"
        />
        <rect x="1535" y="500" width="90" height="55" fill="#1a2834" />
        <rect x="1545" y="510" width="24" height="18" fill="#7ef9ff" opacity="0.3" />
        <rect x="1580" y="510" width="24" height="18" fill="#7ef9ff" opacity="0.25" />
        {/* Pillars */}
        <rect x="1530" y="576" width="10" height="50" fill="#1e2e38" />
        <rect x="1620" y="576" width="10" height="50" fill="#1e2e38" />
        {/* Rail lines */}
        <path
          d="M1480 568 H1680"
          stroke="#7ef9ff"
          strokeWidth="1.5"
          opacity="0.35"
        />
        <path
          d="M1480 574 H1680"
          stroke="#ffb020"
          strokeWidth="1"
          opacity="0.25"
        />
        <rect x="1660" y="420" width="36" height="200" fill="#121e28" />
        {windowGrid(1665, 430, 2, 8, 8, 14, '#ffb020', 0.2)}
      </g>

      {/* —— Sudirman / SCBD —— */}
      <g id="landmark-sudirman">
        <rect x="1740" y="300" width="44" height="330" fill="#101c28" />
        <rect x="1795" y="260" width="38" height="370" fill="#142230" />
        <rect x="1845" y="320" width="52" height="310" fill="#0e1a24" />
        <rect x="1910" y="240" width="34" height="390" fill="#162838" />
        <rect x="1955" y="350" width="48" height="280" fill="#121e2a" />
        <rect x="2015" y="290" width="40" height="340" fill="#152430" />
        {/* Spire accents */}
        <polygon
          points="1810,260 1818,200 1826,260"
          fill="#7ef9ff"
          opacity="0.4"
        />
        <polygon
          points="1922,240 1927,175 1932,240"
          fill="#ffb020"
          opacity="0.45"
        />
        {windowGrid(1748, 320, 3, 14, 9, 16, '#7ef9ff', 0.28)}
        {windowGrid(1802, 280, 2, 16, 10, 16, '#ffb020', 0.22)}
        {windowGrid(1855, 340, 4, 12, 9, 16, '#7ef9ff', 0.2)}
        {windowGrid(1916, 260, 2, 18, 9, 15, '#fff0c0', 0.18)}
        {windowGrid(1965, 370, 3, 10, 9, 16, '#7ef9ff', 0.24)}
        {/* Street canyon glow */}
        <rect
          x="1780"
          y="620"
          width="220"
          height="6"
          fill="url(#drone-glow-cyan)"
          opacity="0.5"
        />
      </g>

      {/* —— Gelora Bung Karno —— */}
      <g id="landmark-gbk">
        <ellipse
          cx="2180"
          cy="580"
          rx="95"
          ry="55"
          fill="#0d1a14"
          stroke="#3dd68c"
          strokeWidth="3"
          opacity="0.7"
        />
        <ellipse
          cx="2180"
          cy="580"
          rx="70"
          ry="38"
          fill="#12241a"
          stroke="#3dd68c"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <ellipse
          cx="2180"
          cy="580"
          rx="40"
          ry="20"
          fill="#1a3020"
          opacity="0.8"
        />
        {/* Floodlights */}
        {[
          [2100, 530],
          [2260, 530],
          [2100, 630],
          [2260, 630],
        ].map(([x, y], i) => (
          <g key={i}>
            <rect
              x={x! - 2}
              y={y! - 40}
              width="4"
              height="40"
              fill="#9eb3c2"
              opacity="0.5"
            />
            <circle cx={x} cy={y! - 42} r="5" fill="#ffb020" opacity="0.55" />
          </g>
        ))}
        {/* Park trees hint */}
        <circle cx="2080" cy="640" r="12" fill="#0f2818" opacity="0.7" />
        <circle cx="2280" cy="645" r="14" fill="#0f2818" opacity="0.65" />
        <circle cx="2120" cy="655" r="10" fill="#123020" opacity="0.6" />
      </g>

      {/* Ambient window sparkle across mid skyline */}
      <g filter="url(#drone-soft)" opacity="0.5">
        {[
          [300, 580],
          [550, 560],
          [900, 500],
          [1100, 480],
          [1500, 520],
          [1700, 400],
          [2050, 360],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2 + (i % 3)}
            fill={i % 2 === 0 ? '#ffb020' : '#7ef9ff'}
          />
        ))}
      </g>
    </svg>
  )
}

function windowGrid(
  x: number,
  y: number,
  cols: number,
  rows: number,
  gapX: number,
  gapY: number,
  color: string,
  opacity: number,
) {
  const cells: ReactElement[] = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((r + c) % 3 === 0) continue
      cells.push(
        <rect
          key={`${x}-${y}-${r}-${c}`}
          x={x + c * gapX}
          y={y + r * gapY}
          width="4"
          height="5"
          fill={color}
          opacity={opacity * (0.6 + ((r * cols + c) % 5) * 0.08)}
        />,
      )
    }
  }
  return <g>{cells}</g>
}
