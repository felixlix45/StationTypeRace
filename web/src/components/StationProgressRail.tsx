import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { StationLine } from '../data/stations'
import {
  nodeKmOffsets,
  startToFirstKm,
  totalKm,
} from '../lib/stationDistances'
import { PixelTrainHead } from './PixelTrain'

type StationProgressRailProps = {
  line: StationLine
  currentIndex: number
  /** Typed length on the current station (drives in-progress head/fill). */
  typedLength?: number
}

function shortStationName(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name
  const first = name.split(/\s+/)[0] ?? name
  if (first.length <= maxLen - 1) return `${first}…`
  return `${name.slice(0, maxLen - 1)}…`
}

function shouldShowLabel(index: number, current: number, total: number): boolean {
  if (total <= 12) return true
  if (index === 0 || index === total - 1) return true
  return Math.abs(index - current) <= 1
}

function formatGapKm(km: number): string {
  const rounded = Math.round(km * 10) / 10
  if (Number.isInteger(rounded)) return `${rounded} km`
  return `${rounded.toFixed(1)} km`
}

/** Mid-rail distance chips — full on short lines; nearby/long hops when dense. */
function shouldShowGapKm(
  stationIndex: number,
  current: number,
  dense: boolean,
  km: number,
): boolean {
  if (km < 0.5) return false
  if (!dense) return true
  if (km >= 4) return true
  return Math.abs(stationIndex - current) <= 1
}

/** How far (0–1) to creep into the next character slot while idle. */
const CREEP_FRACTION = 0.5
/**
 * Base catch-up lag while typing (ms). Higher = train feels later.
 * Effective time shortens as char-debt grows → slow-to-fast acceleration.
 */
const COMMIT_GLIDE_MS = 720
/** How much faster catch-up gets per character of debt (ms shaved off). */
const COMMIT_DEBT_MS = 110
/** Floor so catch-up never becomes an instant snap while typing. */
const COMMIT_MIN_MS = 300
/** Slow drift partway toward the next character while waiting for input. */
const CREEP_GLIDE_MS = 2800
/** Rocket to the station node once the name is fully typed. */
const FINISH_GLIDE_MS = 45

function stationPoints(typedLength: number, targetLen: number) {
  if (targetLen <= 0) return { committed: 0, idle: 0 }
  const typed = Math.min(Math.max(typedLength, 0), targetLen)
  const committed = typed / targetLen
  const idle =
    typed >= targetLen ? 1 : Math.min((typed + CREEP_FRACTION) / targetLen, 1)
  return { committed, idle }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Map route km onto pixel X using measured stop centers. */
function kmToX(km: number, offsets: number[], centers: number[]): number {
  if (centers.length === 0) return 0
  if (centers.length === 1) return centers[0]!
  const maxKm = offsets[offsets.length - 1] ?? 0
  const clamped = Math.min(Math.max(km, 0), maxKm)
  let i = 0
  while (i < offsets.length - 2 && clamped > (offsets[i + 1] ?? 0)) i++
  const a = offsets[i] ?? 0
  const b = offsets[i + 1] ?? a
  const ca = centers[i] ?? 0
  const cb = centers[i + 1] ?? ca
  const t = b > a ? (clamped - a) / (b - a) : 0
  return lerp(ca, cb, t)
}

export function StationProgressRail({
  line,
  currentIndex,
  typedLength = 0,
}: StationProgressRailProps) {
  const stations = line.stations
  const color = line.color
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const stopsRef = useRef<HTMLOListElement>(null)
  const gapsRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const fromRef = useRef<HTMLLIElement>(null)

  const count = stations.length
  const nodeCount = count + 1
  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(count - 1, 0))
  const prevIndexRef = useRef(safeIndex)
  const dense = count > 12

  const offsets = useMemo(() => nodeKmOffsets(line), [line])
  const startKm = useMemo(() => startToFirstKm(line), [line])
  const lineTotalKm = useMemo(() => totalKm(line), [line])

  /** km for each hop: Start→first, then each station→next. */
  const gapKmList = useMemo(() => [startKm, ...line.segmentKm], [line.segmentKm, startKm])

  const targetLen = stations[safeIndex]?.length ?? 0
  const { committed, idle } = stationPoints(typedLength, targetLen)
  const stationComplete = targetLen > 0 && typedLength >= targetLen
  // Typing station i moves from node i (Start or previous station) → node i+1
  const fromKm = offsets[safeIndex] ?? 0
  const toKm = offsets[safeIndex + 1] ?? fromKm
  const segmentKmSpan = Math.max(toKm - fromKm, 0.0001)
  const committedKm = lerp(fromKm, toKm, committed)
  const idleKm = lerp(fromKm, toKm, idle)
  const startDone = committedKm > 0 || idleKm > 0

  const committedKmRef = useRef(committedKm)
  const idleKmRef = useRef(idleKm)
  const displayKmRef = useRef(committedKm)
  const stationCompleteRef = useRef(stationComplete)
  const offsetsRef = useRef(offsets)
  const segmentKmSpanRef = useRef(segmentKmSpan)
  const targetLenRef = useRef(targetLen)

  committedKmRef.current = committedKm
  idleKmRef.current = idleKm
  stationCompleteRef.current = stationComplete
  offsetsRef.current = offsets
  segmentKmSpanRef.current = segmentKmSpan
  targetLenRef.current = targetLen

  const kmPercent = (km: number) => {
    const total = Math.max(lineTotalKm, 0.0001)
    return `${(km / total) * 100}%`
  }

  useLayoutEffect(() => {
    const track = trackRef.current
    const stops = stopsRef.current
    const gaps = gapsRef.current
    const fill = fillRef.current
    const head = headRef.current
    if (!track || !stops || !fill || !head) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let last = performance.now()

    const measureCenters = () => {
      const trackRect = track.getBoundingClientRect()
      const items = stops.querySelectorAll<HTMLLIElement>('.station-progress__stop')
      const centers: number[] = []
      items.forEach((el) => {
        const r = el.getBoundingClientRect()
        centers.push(r.left + r.width / 2 - trackRect.left)
      })
      return centers
    }

    const placeGapLabels = (centers: number[]) => {
      if (!gaps) return
      const chips = gaps.querySelectorAll<HTMLElement>('.station-progress__gap-km')
      chips.forEach((chip) => {
        const i = Number(chip.dataset.seg)
        if (!Number.isFinite(i)) return
        const a = centers[i]
        const b = centers[i + 1]
        if (a == null || b == null) return
        chip.style.left = `${(a + b) / 2}px`
      })
    }

    const apply = (km: number) => {
      displayKmRef.current = km
      const centers = measureCenters()
      placeGapLabels(centers)
      const x = kmToX(km, offsetsRef.current, centers)
      const origin = centers[0] ?? 0
      fill.style.left = `${origin}px`
      fill.style.width = `${Math.max(0, x - origin)}px`
      head.style.transform = `translate3d(${x}px, 0, 0) translateX(-50%)`
    }

    apply(displayKmRef.current)

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const committedTarget = committedKmRef.current
      const idleTarget = idleKmRef.current
      const complete = stationCompleteRef.current
      let current = displayKmRef.current
      const eps = 0.00005

      let target = idleTarget
      let baseMs = CREEP_GLIDE_MS

      if (complete) {
        target = committedTarget
        baseMs = FINISH_GLIDE_MS
      } else if (current < committedTarget - eps) {
        target = committedTarget
        const len = Math.max(targetLenRef.current, 1)
        const span = Math.max(segmentKmSpanRef.current, 0.0001)
        const charsBehind = ((committedTarget - current) / span) * len
        baseMs = Math.max(
          COMMIT_MIN_MS,
          COMMIT_GLIDE_MS - charsBehind * COMMIT_DEBT_MS,
        )
      } else if (current > idleTarget + eps) {
        target = idleTarget
        baseMs = COMMIT_MIN_MS
      }

      const error = target - current
      if (Math.abs(error) > eps) {
        const isCreep = baseMs === CREEP_GLIDE_MS
        const isFinish = baseMs === FINISH_GLIDE_MS
        const ms =
          media.matches && isCreep
            ? baseMs
            : media.matches && !isFinish
              ? Math.max(baseMs * 0.75, COMMIT_MIN_MS)
              : baseMs
        const tau = ms / 1000
        current += error * Math.min(1, dt / tau)
        if (Math.abs(target - current) < eps) current = target
      } else {
        current = target
      }

      apply(current)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    const onResize = () => apply(displayKmRef.current)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [line.id, nodeCount])

  useEffect(() => {
    const scroller = scrollerRef.current
    const el = fromRef.current
    if (!scroller || !el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const advanced = prevIndexRef.current !== safeIndex
    prevIndexRef.current = safeIndex
    const slotBias = idle * el.offsetWidth * 0.5
    const scrollerRect = scroller.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const elCenter =
      elRect.left - scrollerRect.left + scroller.scrollLeft + elRect.width / 2
    const target = elCenter - scroller.clientWidth / 2 + slotBias
    scroller.scrollTo({
      left: Math.max(0, target),
      behavior: reduceMotion || !advanced ? 'auto' : 'smooth',
    })
  }, [safeIndex, idle])

  if (count === 0) return null

  // ~1.15rem per km, floored so short lines still scroll-friendly
  const minTrackPx = Math.max(nodeCount * 3.2, lineTotalKm * 1.15)

  return (
    <nav
      className={['station-progress', dense ? 'is-dense' : ''].filter(Boolean).join(' ')}
      aria-label="Station progress"
      style={{ ['--line' as string]: color } as CSSProperties}
    >
      <div className="station-progress__chrome" aria-hidden="true">
        <span className="station-progress__kicker">Line map</span>
        <span className="station-progress__count">
          {safeIndex + 1}/{count}
        </span>
      </div>

      <div className="station-progress__scroller" ref={scrollerRef}>
        <div
          ref={trackRef}
          className="station-progress__track"
          style={
            {
              ['--station-count' as string]: nodeCount,
              minWidth: `max(100%, ${minTrackPx}rem)`,
            } as CSSProperties
          }
        >
          <div className="station-progress__rail" aria-hidden="true" />
          <div ref={fillRef} className="station-progress__fill" aria-hidden="true" />
          <div ref={headRef} className="station-progress__head" aria-hidden="true">
            <PixelTrainHead color={color} className="station-progress__train" />
          </div>

          <div className="station-progress__gaps" ref={gapsRef} aria-hidden="true">
            {gapKmList.map((gapKm, index) => {
              if (!shouldShowGapKm(index, safeIndex, dense, gapKm)) return null
              return (
                <span
                  key={`gap-${index}`}
                  className={[
                    'station-progress__gap-km',
                    index === safeIndex ? 'is-current' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-seg={index}
                >
                  {formatGapKm(gapKm)}
                </span>
              )
            })}
          </div>

          <ol className="station-progress__stops" ref={stopsRef}>
            <li
              ref={safeIndex === 0 ? fromRef : undefined}
              className={[
                'station-progress__stop',
                'is-start',
                startDone ? 'is-done' : '',
                'has-label',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ left: kmPercent(0) }}
              aria-label="Start"
            >
              <span className="station-progress__dot" aria-hidden="true" />
              <span className="station-progress__label" title="Start">
                Start
              </span>
            </li>

            {stations.map((name, index) => {
              const done = index < safeIndex
              const current = index === safeIndex
              const upcoming = index > safeIndex
              const showLabel = shouldShowLabel(index, safeIndex, count)
              const label = dense && !current ? shortStationName(name, 9) : name
              const isFromStop = index === safeIndex - 1
              const nodeKm = offsets[index + 1] ?? 0

              return (
                <li
                  key={`${index}-${name}`}
                  ref={isFromStop ? fromRef : undefined}
                  className={[
                    'station-progress__stop',
                    done ? 'is-done' : '',
                    current ? 'is-current' : '',
                    upcoming ? 'is-upcoming' : '',
                    showLabel ? 'has-label' : 'no-label',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ left: kmPercent(nodeKm) }}
                  aria-current={current ? 'step' : undefined}
                  aria-label={`${name}${current ? ', current' : done ? ', cleared' : ', upcoming'}`}
                >
                  <span className="station-progress__dot" aria-hidden="true" />
                  <span
                    className="station-progress__label"
                    title={name}
                    aria-hidden={!showLabel}
                  >
                    {showLabel ? label : ''}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </nav>
  )
}
