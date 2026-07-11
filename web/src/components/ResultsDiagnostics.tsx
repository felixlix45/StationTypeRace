import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { formatAccuracy, formatWpm } from '../lib/wpm'
import { formatElapsed } from '../lib/shareCard'
import type { StationSample } from '../lib/raceStats'

export type ResultsDiagnosticsProps = {
  wpm: number
  rawWpm: number
  accuracy: number
  elapsedMs: number
  incorrectKeystrokes: number
  perfectStations: number
  totalStations: number
  samples: StationSample[]
}

function shortStationLabel(name: string, maxChars: number): string {
  if (name.length <= maxChars) return name
  return `${name.slice(0, Math.max(1, maxChars - 1))}…`
}

function StationWpmChart({ samples }: { samples: StationSample[] }) {
  const tipId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null)

  const activeIndex = pinnedIndex ?? hoverIndex
  const active = activeIndex !== null ? samples[activeIndex] : null

  useEffect(() => {
    if (pinnedIndex === null) return

    function onPointerDown(e: PointerEvent) {
      const root = rootRef.current
      if (!root || root.contains(e.target as Node)) return
      setPinnedIndex(null)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPinnedIndex(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [pinnedIndex])

  if (samples.length === 0) {
    return (
      <p className="results-diag-empty">No per-station data for this run.</p>
    )
  }

  const n = samples.length
  const maxWpm = Math.max(1, ...samples.map((s) => s.stationWpm))

  /*
   * Axis labels: truncate + angle so long stop names never collide.
   * Full name lives in the hover/click tip — axis can stay abbreviated.
   *  ≤4 stops: more chars, −40°
   *  5–8:  truncate + −40°
   *  >8:   shorter truncate + steeper angle (−45°/−48°)
   *  >14:  index-only (tip has the name)
   */
  const indexOnly = n > 14
  const rotateLabels = !indexOnly && n >= 4
  const labelAngle = n > 10 ? -48 : n > 8 ? -45 : -40
  const labelMax = indexOnly
    ? 0
    : n <= 4
      ? 12
      : n <= 6
        ? 10
        : n <= 8
          ? 9
          : n <= 11
            ? 8
            : 7

  const chartH = 268
  const padTop = 16
  const padBottom = indexOnly ? 36 : n > 10 ? 72 : n > 8 ? 66 : 62
  /* Angled end-anchored labels extend left (~cosθ · textWidth); give them room. */
  const padLeft = rotateLabels ? 56 : 14
  const padRight = rotateLabels ? 20 : 14
  const barAreaH = chartH - padTop - padBottom

  const gap = n > 18 ? 4 : n > 12 ? 6 : n > 7 ? 8 : 10
  const minBar = n > 16 ? 18 : n > 10 ? 22 : 28
  const idealBar = Math.floor(
    (520 - padLeft - padRight - (n - 1) * gap) / n,
  )
  const barW = Math.min(44, Math.max(minBar, idealBar))
  const width = Math.max(
    520,
    padLeft + padRight + n * barW + (n - 1) * gap,
  )

  function togglePin(i: number) {
    setPinnedIndex((prev) => (prev === i ? null : i))
  }

  function onBarKeyDown(e: ReactKeyboardEvent, i: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      togglePin(i)
    }
  }

  return (
    <div className="results-chart-wrap" ref={rootRef}>
      <div className="results-chart-scroll">
        <svg
          className={[
            'results-chart',
            rotateLabels ? 'is-angled' : '',
            n > 8 ? 'is-dense' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          viewBox={`0 0 ${width} ${chartH}`}
          role="group"
          aria-label="Per-station WPM chart. Hover or focus a bar for details; click or press Enter to pin."
        >
          <title>Per-station WPM</title>

          {[0.25, 0.5, 0.75, 1].map((t) => {
            const y = padTop + barAreaH * (1 - t)
            return (
              <line
                key={t}
                className="results-chart-grid"
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
              />
            )
          })}

          <line
            className="results-chart-rail"
            x1={padLeft}
            y1={padTop + barAreaH + 0.5}
            x2={width - padRight}
            y2={padTop + barAreaH + 0.5}
          />

          {samples.map((s, i) => {
            const x = padLeft + i * (barW + gap)
            const h =
              s.stationWpm <= 0
                ? 4
                : Math.max(6, (s.stationWpm / maxWpm) * barAreaH)
            const y = padTop + barAreaH - h
            const isActive = activeIndex === i
            const isDimmed = activeIndex !== null && !isActive
            const label =
              labelMax === 0
                ? String(i + 1)
                : shortStationLabel(s.name, labelMax)
            const hitY = padTop
            const hitH = barAreaH + (rotateLabels ? 48 : 28)
            const labelX = x + barW / 2
            const labelY = rotateLabels
              ? chartH - padBottom + 12
              : chartH - 12

            return (
              <g
                key={`${s.index}-${s.name}`}
                className={[
                  'results-chart-item',
                  isActive ? 'is-active' : '',
                  isDimmed ? 'is-dimmed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <rect
                  className="results-chart-hit"
                  x={x - gap / 2}
                  y={hitY}
                  width={barW + gap}
                  height={hitH}
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.name}: ${s.stationWpm} WPM, ${
                    s.perfect ? 'perfect' : 'not credited'
                  }, ${s.incorrectDelta} errors`}
                  aria-pressed={pinnedIndex === i}
                  aria-describedby={isActive ? tipId : undefined}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() =>
                    setHoverIndex((h) => (h === i ? null : h))
                  }
                  onFocus={() => setHoverIndex(i)}
                  onBlur={() =>
                    setHoverIndex((h) => (h === i ? null : h))
                  }
                  onClick={() => togglePin(i)}
                  onKeyDown={(e) => onBarKeyDown(e, i)}
                />
                <rect
                  className={[
                    'results-chart-bar',
                    s.perfect ? 'is-perfect' : 'is-imperfect',
                  ].join(' ')}
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={3}
                  pointerEvents="none"
                />
                <text
                  className="results-chart-label"
                  x={labelX}
                  y={labelY}
                  textAnchor={rotateLabels ? 'end' : 'middle'}
                  transform={
                    rotateLabels
                      ? `rotate(${labelAngle} ${labelX} ${labelY})`
                      : undefined
                  }
                  pointerEvents="none"
                >
                  {label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div
        id={tipId}
        className={[
          'results-chart-tip',
          active ? 'is-visible' : 'is-idle',
          pinnedIndex !== null ? 'is-pinned' : '',
          active && !active.perfect ? 'is-missed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="status"
        aria-live="polite"
      >
        <span className="results-chart-tip-edge" aria-hidden="true" />
        <span className="results-chart-tip-scan" aria-hidden="true" />
        {active ? (
          <div className="results-chart-tip-body">
            <div className="results-chart-tip-call">
              <span className="results-chart-tip-dot" aria-hidden="true" />
              <span className="results-chart-tip-pa">
                {pinnedIndex !== null ? 'Pinned stop' : 'Now approaching'}
              </span>
              <span className="results-chart-tip-index">
                {String(active.index + 1).padStart(2, '0')}/
                {String(samples.length).padStart(2, '0')}
              </span>
            </div>
            <div className="results-chart-tip-main">
              <p className="results-chart-tip-name">{active.name}</p>
              <dl className="results-chart-tip-stats">
                <div>
                  <dt>WPM</dt>
                  <dd>{formatWpm(active.stationWpm)}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{formatElapsed(active.durationMs)}</dd>
                </div>
                <div>
                  <dt>Err</dt>
                  <dd>{active.incorrectDelta}</dd>
                </div>
                <div>
                  <dt>Credit</dt>
                  <dd className={active.perfect ? 'is-ok' : 'is-bad'}>
                    {active.perfect ? 'Perfect' : 'Missed'}
                  </dd>
                </div>
              </dl>
            </div>
            {pinnedIndex !== null && (
              <p className="results-chart-tip-hint">
                Tap again or outside to release
              </p>
            )}
          </div>
        ) : (
          <div className="results-chart-tip-idle">
            <span className="results-chart-tip-dot is-idle" aria-hidden="true" />
            <div className="results-chart-tip-idle-copy">
              <p className="results-chart-tip-idle-label">Awaiting stop</p>
              <p className="results-chart-tip-placeholder">
                Hover or tap a bar · platform readout tunes in
              </p>
            </div>
            <span className="results-chart-tip-idle-track" aria-hidden="true">
              <span className="results-chart-tip-idle-cursor" />
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function ResultsDiagnostics({
  wpm,
  rawWpm,
  accuracy,
  elapsedMs,
  incorrectKeystrokes,
  perfectStations,
  totalStations,
  samples,
}: ResultsDiagnosticsProps) {
  const allPerfect =
    totalStations > 0 && perfectStations === totalStations

  return (
    <section className="results-perf" aria-label="Run performance">
      <div className="results-perf-head">
        <p className="results-perf-eyebrow">Platform metrics</p>
        <p className="results-perf-title">Your run</p>
        {allPerfect && (
          <p className="results-perf-badge" role="status">
            Clean line · all stops credited
          </p>
        )}
      </div>

      <div className="results-perf-hero">
        <p className="results-perf-wpm-label">Average WPM</p>
        <p className="results-perf-wpm">{formatWpm(wpm)}</p>
      </div>

      <dl className="results-perf-stats">
        <div className="results-perf-stat">
          <dt>Raw</dt>
          <dd>{formatWpm(rawWpm)}</dd>
        </div>
        <div className="results-perf-stat">
          <dt>Accuracy</dt>
          <dd>{formatAccuracy(accuracy)}</dd>
        </div>
        <div className="results-perf-stat">
          <dt>Time</dt>
          <dd>{formatElapsed(elapsedMs)}</dd>
        </div>
        <div className="results-perf-stat">
          <dt>Errors</dt>
          <dd>{incorrectKeystrokes}</dd>
        </div>
        <div className="results-perf-stat results-perf-stat--perfect">
          <dt>Perfect</dt>
          <dd>
            {perfectStations}
            <span className="results-perf-of">/{totalStations}</span>
          </dd>
        </div>
      </dl>

      <div className="results-perf-chart">
        <div className="results-perf-chart-head">
          <p className="results-perf-chart-label">WPM by station</p>
          <p className="results-perf-chart-hint">
            Hover or tap a stop · only perfect credits race WPM
          </p>
        </div>
        <StationWpmChart samples={samples} />
      </div>
    </section>
  )
}
