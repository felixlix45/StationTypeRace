import { useEffect, useLayoutEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { PixelTrainHead } from './PixelTrain'

type StationProgressRailProps = {
  stations: string[]
  currentIndex: number
  /** Typed length on the current station (drives in-progress head/fill). */
  typedLength?: number
  color: string
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
  // Partway to the next char only — never the full next point until they type it.
  const idle =
    typed >= targetLen ? 1 : Math.min((typed + CREEP_FRACTION) / targetLen, 1)
  return { committed, idle }
}

export function StationProgressRail({
  stations,
  currentIndex,
  typedLength = 0,
  color,
}: StationProgressRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const fromRef = useRef<HTMLLIElement>(null)

  const count = stations.length
  const nodeCount = count + 1
  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(count - 1, 0))
  const prevIndexRef = useRef(safeIndex)
  const dense = count > 12

  const targetLen = stations[safeIndex]?.length ?? 0
  const { committed, idle } = stationPoints(typedLength, targetLen)
  const stationComplete = targetLen > 0 && typedLength >= targetLen
  const maxNodeIndex = Math.max(count, 0)
  const committedRail = Math.min(safeIndex + committed, maxNodeIndex)
  const idleRail = Math.min(safeIndex + idle, maxNodeIndex)
  const startDone = committedRail > 0 || idleRail > 0

  const committedRailRef = useRef(committedRail)
  const idleRailRef = useRef(idleRail)
  const displayRailRef = useRef(committedRail)
  const stationCompleteRef = useRef(stationComplete)
  const nodeCountRef = useRef(nodeCount)
  const targetLenRef = useRef(targetLen)

  committedRailRef.current = committedRail
  idleRailRef.current = idleRail
  stationCompleteRef.current = stationComplete
  nodeCountRef.current = nodeCount
  targetLenRef.current = targetLen

  useLayoutEffect(() => {
    const track = trackRef.current
    const fill = fillRef.current
    const head = headRef.current
    if (!track || !fill || !head) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let last = performance.now()

    const apply = (rail: number) => {
      displayRailRef.current = rail
      const nodes = Math.max(nodeCountRef.current, 1)
      const slot = track.offsetWidth / nodes
      fill.style.width = `${slot * rail}px`
      head.style.transform = `translate3d(${slot * (rail + 0.5)}px, 0, 0) translateX(-50%)`
    }

    apply(displayRailRef.current)

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const committedTarget = committedRailRef.current
      const idleTarget = idleRailRef.current
      const complete = stationCompleteRef.current
      let current = displayRailRef.current
      const eps = 0.00005

      let target = idleTarget
      let baseMs = CREEP_GLIDE_MS

      if (complete) {
        // Name finished — ignore creep, dash to the station node.
        target = committedTarget
        baseMs = FINISH_GLIDE_MS
      } else if (current < committedTarget - eps) {
        // Behind typed progress: stay late, but accelerate as debt grows.
        target = committedTarget
        const len = Math.max(targetLenRef.current, 1)
        const charsBehind = (committedTarget - current) * len
        baseMs = Math.max(
          COMMIT_MIN_MS,
          COMMIT_GLIDE_MS - charsBehind * COMMIT_DEBT_MS,
        )
      } else if (current > idleTarget + eps) {
        // Backspace / overshoot — pull back to the idle hold point.
        target = idleTarget
        baseMs = COMMIT_MIN_MS
      }

      const error = target - current
      if (Math.abs(error) > eps) {
        const isCreep = baseMs === CREEP_GLIDE_MS
        const isFinish = baseMs === FINISH_GLIDE_MS
        // Keep creep slow under reduced-motion; finish stays snappy.
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

    const onResize = () => apply(displayRailRef.current)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [nodeCount])

  useEffect(() => {
    const scroller = scrollerRef.current
    const el = fromRef.current
    if (!scroller || !el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const advanced = prevIndexRef.current !== safeIndex
    prevIndexRef.current = safeIndex
    const slotBias = idle * el.offsetWidth * 0.5
    const target =
      el.offsetLeft - scroller.clientWidth / 2 + el.offsetWidth / 2 + slotBias
    scroller.scrollTo({
      left: Math.max(0, target),
      behavior: reduceMotion || !advanced ? 'auto' : 'smooth',
    })
  }, [safeIndex, idle])

  if (count === 0) return null

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
              minWidth: `max(100%, calc(${nodeCount} * var(--station-slot)))`,
            } as CSSProperties
          }
        >
          <div className="station-progress__rail" aria-hidden="true" />
          <div ref={fillRef} className="station-progress__fill" aria-hidden="true" />
          <div ref={headRef} className="station-progress__head" aria-hidden="true">
            <PixelTrainHead color={color} className="station-progress__train" />
          </div>

          <ol className="station-progress__stops">
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
