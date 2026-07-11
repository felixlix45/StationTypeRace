import { useEffect, useRef } from 'react'
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

export function StationProgressRail({
  stations,
  currentIndex,
  typedLength = 0,
  color,
}: StationProgressRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const fromRef = useRef<HTMLLIElement>(null)
  const count = stations.length
  const nodeCount = count + 1
  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(count - 1, 0))
  const prevIndexRef = useRef(safeIndex)
  const dense = count > 12
  const targetLen = stations[safeIndex]?.length ?? 0
  const stationProgress =
    targetLen > 0 ? Math.min(Math.max(typedLength / targetLen, 0), 1) : 0
  // Nodes: [start, ...stations]. Typing station s moves from node s → node s+1.
  const maxNodeIndex = Math.max(count, 0)
  const railIndex = Math.min(safeIndex + stationProgress, maxNodeIndex)
  const startDone = railIndex > 0

  useEffect(() => {
    const scroller = scrollerRef.current
    const el = fromRef.current
    if (!scroller || !el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const advanced = prevIndexRef.current !== safeIndex
    prevIndexRef.current = safeIndex
    // Bias scroll toward the train as it slides into the next node.
    const slotBias = stationProgress * el.offsetWidth * 0.5
    const target =
      el.offsetLeft - scroller.clientWidth / 2 + el.offsetWidth / 2 + slotBias
    scroller.scrollTo({
      left: Math.max(0, target),
      behavior: reduceMotion || !advanced ? 'auto' : 'smooth',
    })
  }, [safeIndex, stationProgress])

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
          className="station-progress__track"
          style={
            {
              ['--station-count' as string]: nodeCount,
              ['--station-index' as string]: railIndex,
              minWidth: `max(100%, calc(${nodeCount} * var(--station-slot)))`,
            } as CSSProperties
          }
        >
          <div className="station-progress__rail" aria-hidden="true" />
          <div className="station-progress__fill" aria-hidden="true" />
          <div className="station-progress__head" aria-hidden="true">
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
              // From-node for scroll: previous station when typing station i > 0.
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
