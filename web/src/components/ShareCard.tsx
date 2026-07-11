import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { formatAccuracy, formatWpm } from '../lib/wpm'
import {
  formatElapsed,
  formatRaceDevice,
  type ShareResult,
} from '../lib/shareCard'
import { PixelTrain } from './PixelTrain'
import { PixelStationBuilding } from './PixelStationBuilding'

function lineStyle(color: string): CSSProperties {
  return { ['--line' as string]: color } as CSSProperties
}

export const SHARE_CARD_VARIANTS = [
  {
    id: 'neon',
    label: 'Neon Score',
    blurb: 'Big WPM brag',
  },
  {
    id: 'route',
    label: 'Route Cleared',
    blurb: 'Line + stops',
  },
  {
    id: 'minimal',
    label: 'Minimal Type',
    blurb: 'Stark WPM',
  },
  {
    id: 'ticket',
    label: 'Transit Ticket',
    blurb: 'Boarding pass',
  },
  {
    id: 'monas',
    label: 'Monas Poster',
    blurb: 'Jakarta monument',
  },
  {
    id: 'pixel',
    label: 'Pixel Rail',
    blurb: '8-bit train',
  },
] as const

export type ShareCardVariant = (typeof SHARE_CARD_VARIANTS)[number]['id']

type ShareCardProps = {
  result: ShareResult
  variant?: ShareCardVariant
}

/** Max stops shown in neon stations panel (2-col) before ellipsis */
const STATION_PREVIEW_CAP = 6
const ROUTE_DOT_CAP = 10

function BrandMark({ className = '' }: { className?: string }) {
  return (
    <h2 className={`share-card-brand ${className}`.trim()}>
      <span className="share-card-brand-primary">StationType</span>
      <span className="share-card-brand-accent">Race</span>
    </h2>
  )
}

function DeviceTag({
  device,
  className = '',
}: {
  device: ShareResult['device']
  className?: string
}) {
  return (
    <span
      className={`share-device-tag ${className}`.trim()}
      data-device={device}
    >
      {formatRaceDevice(device)}
    </span>
  )
}

function NeonScoreBody({ result }: { result: ShareResult }) {
  const { line, wpm, rawWpm, accuracy, elapsedMs } = result
  const stations = line.stations
  const preview =
    stations.length <= STATION_PREVIEW_CAP
      ? stations
      : [...stations.slice(0, STATION_PREVIEW_CAP - 1), '…']

  return (
    <>
      <div className="share-card-grid" aria-hidden="true" />
      <div className="share-card-scan" aria-hidden="true" />
      <div className="share-card-glow" aria-hidden="true" />

      <header className="share-card-top">
        <p className="share-card-kicker">Line cleared</p>
        <BrandMark />
        <DeviceTag device={result.device} />
      </header>

      <div className="share-card-train">
        <PixelTrain color={line.color} className="share-card-train-svg" />
      </div>

      <div className="share-card-line">
        <span className="share-card-dot" aria-hidden="true" />
        <div className="share-card-line-copy">
          <p className="share-card-system">{line.system}</p>
          <p className="share-card-line-name">{line.name}</p>
          <p className="share-card-route">{line.route}</p>
        </div>
      </div>

      <div className="share-card-score">
        <p className="share-card-wpm-label">Average WPM</p>
        <p className="share-card-wpm">{formatWpm(wpm)}</p>
        <div className="share-card-chips">
          <span className="share-card-chip">{formatAccuracy(accuracy)}</span>
          <span className="share-card-chip">{formatElapsed(elapsedMs)}</span>
          <span className="share-card-chip">{formatWpm(rawWpm)} raw</span>
        </div>
      </div>

      <section className="share-card-stations">
        <p className="share-card-stations-label">Stations typed</p>
        <ul className="share-card-station-list">
          {preview.map((name, i) =>
            name === '…' ? (
              <li key={`${name}-${i}`} className="is-ellipsis">
                …
              </li>
            ) : (
              <li key={`${name}-${i}`} className="share-card-station-chip">
                <PixelStationBuilding
                  color={line.color}
                  variant={i}
                  glowId={`station-glow-${i}`}
                  className="share-card-station-building"
                />
                <span className="share-card-station-name">{name}</span>
              </li>
            ),
          )}
        </ul>
      </section>

      <footer className="share-card-foot">
        <span className="share-card-foot-mark" aria-hidden="true">
          ◆
        </span>
        <span>Jakarta rail typing race</span>
      </footer>
    </>
  )
}

function RouteClearedBody({ result }: { result: ShareResult }) {
  const { line, wpm, accuracy, elapsedMs } = result
  const stations = line.stations
  const show =
    stations.length <= ROUTE_DOT_CAP
      ? stations
      : [
          ...stations.slice(0, 4),
          `+${stations.length - 8} more`,
          ...stations.slice(-3),
        ]

  return (
    <>
      <div className="sc-route-bg" aria-hidden="true" />
      <header className="sc-route-head">
        <p className="sc-route-kicker">{line.system} · cleared</p>
        <BrandMark className="sc-route-brand" />
        <DeviceTag device={result.device} />
      </header>

      <div className="sc-route-hero-line">
        <span className="sc-route-line-name">{line.name}</span>
        <span className="sc-route-count">{stations.length} stops</span>
      </div>

      <div className="sc-route-map">
        <div className="sc-route-spine" aria-hidden="true" />
        <ol className="sc-route-stops">
          {show.map((name, i) => {
            const isMore = name.startsWith('+')
            return (
              <li
                key={`${name}-${i}`}
                className={isMore ? 'is-more' : undefined}
              >
                <span className="sc-route-node" aria-hidden="true" />
                <span className="sc-route-stop-name">{name}</span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="sc-route-stats">
        <div className="sc-route-stat">
          <span className="sc-route-stat-label">WPM</span>
          <span className="sc-route-stat-value">{formatWpm(wpm)}</span>
        </div>
        <div className="sc-route-stat">
          <span className="sc-route-stat-label">Acc</span>
          <span className="sc-route-stat-value">{formatAccuracy(accuracy)}</span>
        </div>
        <div className="sc-route-stat">
          <span className="sc-route-stat-label">Time</span>
          <span className="sc-route-stat-value">
            {formatElapsed(elapsedMs)}
          </span>
        </div>
      </div>
    </>
  )
}

/** Shrink Minimal Type WPM until scrollWidth fits the hero (preview + PNG capture). */
function fitMinimalWpm(el: HTMLElement) {
  // Clear prior fit so we measure against the CSS baseline size.
  el.style.fontSize = ''
  const hero = el.parentElement
  if (!hero || hero.clientWidth < 4) return
  // Syne ExtraBold ink can overhang advance width; keep a real margin for
  // mobile / html-to-image font embedding variance (prior fix had ~3px).
  const budget = Math.max(0, hero.clientWidth - 10)
  let natural = el.scrollWidth
  try {
    const range = document.createRange()
    range.selectNodeContents(el)
    const ink = range.getBoundingClientRect().width
    if (ink > 0) natural = Math.max(natural, ink)
  } catch {
    /* ignore */
  }
  const basePx = parseFloat(getComputedStyle(el).fontSize)
  if (!Number.isFinite(basePx) || basePx <= 0) return
  // Always pin px. Capture freeze + ResizeObserver can clear inline font-size
  // right before html-to-image; without an inline size the FO clone falls back
  // to clamp(cqw) (broken in foreignObject) and the WPM collapses to the floor.
  if (natural <= budget) {
    el.style.fontSize = `${basePx}px`
    return
  }
  el.style.fontSize = `${(basePx * budget) / natural}px`
}

function MinimalTypeBody({ result }: { result: ShareResult }) {
  const { line, wpm, accuracy } = result
  const wpmLabel = formatWpm(wpm)
  const wpmRef = useRef<HTMLParagraphElement>(null)
  const wpmStyle = {
    ['--sc-min-wpm-chars' as string]: String(Math.max(2, wpmLabel.length)),
  } as CSSProperties

  useLayoutEffect(() => {
    const el = wpmRef.current
    if (!el) return
    fitMinimalWpm(el)

    const hero = el.parentElement
    if (!hero || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => fitMinimalWpm(el))
    ro.observe(hero)
    return () => ro.disconnect()
  }, [wpmLabel])

  return (
    <>
      <div className="sc-min-texture" aria-hidden="true" />
      <div className="sc-min-scan" aria-hidden="true" />

      <header className="sc-min-head">
        <p className="sc-min-brand">StationTypeRace</p>
        <DeviceTag device={result.device} className="sc-min-device" />
        <div className="sc-min-rule" aria-hidden="true" />
      </header>

      <div className="sc-min-hero">
        <p className="sc-min-label">WPM</p>
        <p className="sc-min-wpm" ref={wpmRef} style={wpmStyle}>
          {wpmLabel}
        </p>
        <p className="sc-min-acc">{formatAccuracy(accuracy)}</p>
      </div>

      <footer className="sc-min-foot">
        <span className="sc-min-dot" aria-hidden="true" />
        <span>
          {line.system} · {line.name}
        </span>
      </footer>
    </>
  )
}

function TransitTicketBody({ result }: { result: ShareResult }) {
  const { line, wpm, accuracy, elapsedMs } = result
  const stations = line.stations
  const origin = stations[0] ?? '—'
  const dest = stations[stations.length - 1] ?? '—'
  const wpmLabel = formatWpm(wpm)

  return (
    <>
      <div className="sc-ticket-stub">
        <div className="sc-ticket-stub-top">
          <p className="sc-ticket-carrier">
            <span className="sc-ticket-carrier-primary">StationType</span>
            <span className="sc-ticket-carrier-accent">Race</span>
          </p>
          <p className="sc-ticket-pass-type">Boarding pass</p>
        </div>
        <div className="sc-ticket-fare">
          <span className="sc-ticket-fare-label">WPM</span>
          <span className="sc-ticket-fare-value">{wpmLabel}</span>
        </div>
      </div>

      <div className="sc-ticket-perf" aria-hidden="true" />

      <div className="sc-ticket-body">
        <p className="sc-ticket-system">{line.system}</p>
        <p className="sc-ticket-line">{line.name}</p>
        <p className="sc-ticket-route-hint">{line.route}</p>

        <div className="sc-ticket-od">
          <div className="sc-ticket-leg">
            <span className="sc-ticket-field">From</span>
            <span className="sc-ticket-place">{origin}</span>
          </div>
          <div className="sc-ticket-connector" aria-hidden="true">
            <span className="sc-ticket-connector-line" />
            <span className="sc-ticket-connector-arrow">↓</span>
          </div>
          <div className="sc-ticket-leg">
            <span className="sc-ticket-field">To</span>
            <span className="sc-ticket-place">{dest}</span>
          </div>
        </div>

        <div className="sc-ticket-meta">
          <div>
            <span className="sc-ticket-field">Stops</span>
            <span className="sc-ticket-val">{stations.length}</span>
          </div>
          <div>
            <span className="sc-ticket-field">Acc</span>
            <span className="sc-ticket-val">{formatAccuracy(accuracy)}</span>
          </div>
          <div>
            <span className="sc-ticket-field">Time</span>
            <span className="sc-ticket-val">{formatElapsed(elapsedMs)}</span>
          </div>
        </div>

        <div className="sc-ticket-barcode" aria-hidden="true">
          {Array.from({ length: 32 }, (_, i) => (
            <span
              key={i}
              style={{
                width: i % 7 === 0 ? '3px' : i % 4 === 0 ? '2px' : '1px',
              }}
            />
          ))}
        </div>
        <p className="sc-ticket-serial">
          STR · {line.id.toUpperCase()} · {formatRaceDevice(result.device).toUpperCase()} · JAKARTA
        </p>
      </div>
    </>
  )
}

/** CSS/SVG Monas silhouette — WPM as the glowing flame tip */
function MonasPosterBody({ result }: { result: ShareResult }) {
  const { line, wpm, accuracy, elapsedMs } = result

  return (
    <>
      <div className="sc-monas-sky" aria-hidden="true" />
      <div className="sc-monas-stars" aria-hidden="true" />
      <div className="sc-monas-glow" aria-hidden="true" />

      <header className="sc-monas-head">
        <p className="sc-monas-kicker">Jakarta · cleared</p>
        <BrandMark className="sc-monas-brand" />
        <DeviceTag device={result.device} />
      </header>

      <div className="sc-monas-stage">
        <p className="sc-monas-wpm" aria-label={`${formatWpm(wpm)} WPM`}>
          <span className="sc-monas-wpm-num">{formatWpm(wpm)}</span>
          <span className="sc-monas-wpm-unit">WPM</span>
        </p>
        <svg
          className="sc-monas-svg"
          viewBox="0 0 120 200"
          aria-hidden="true"
        >
          {/* Flame / tip light */}
          <ellipse
            className="sc-monas-flame"
            cx="60"
            cy="18"
            rx="10"
            ry="14"
          />
          <ellipse cx="60" cy="16" rx="4" ry="7" fill="#fff8e0" opacity="0.85" />
          {/* Obelisk shaft */}
          <path
            className="sc-monas-shaft"
            d="M54 34 L66 34 L72 148 L48 148 Z"
          />
          {/* Mid cupola ring */}
          <rect
            className="sc-monas-ring"
            x="46"
            y="78"
            width="28"
            height="8"
            rx="1"
          />
          {/* Observation cupola */}
          <path
            className="sc-monas-cupola"
            d="M42 148 L78 148 L74 162 L46 162 Z"
          />
          {/* Base pedestal */}
          <path
            className="sc-monas-base"
            d="M28 162 L92 162 L98 178 L22 178 Z"
          />
          <rect
            className="sc-monas-plinth"
            x="14"
            y="178"
            width="92"
            height="10"
          />
          {/* Plaza ellipse */}
          <ellipse
            className="sc-monas-plaza"
            cx="60"
            cy="192"
            rx="52"
            ry="6"
          />
        </svg>
      </div>

      <div className="sc-monas-meta">
        <p className="sc-monas-line">
          <span className="sc-monas-line-name">{line.name}</span>
        </p>
        <p className="sc-monas-system">{line.system}</p>
        <div className="sc-monas-chips">
          <span>{formatAccuracy(accuracy)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatElapsed(elapsedMs)}</span>
          <span aria-hidden="true">·</span>
          <span>{line.stations.length} stops</span>
          <span aria-hidden="true">·</span>
          <span>{formatRaceDevice(result.device)}</span>
        </div>
      </div>
    </>
  )
}

/** How many chip children fully fit inside the list's visible height. */
function countFullyVisibleChips(list: HTMLElement): number {
  const limit = list.clientHeight
  let n = 0
  for (const child of list.children) {
    const el = child as HTMLElement
    if (el.offsetTop + el.offsetHeight > limit + 0.5) break
    n += 1
  }
  return n
}

function PixelRailBody({ result }: { result: ShareResult }) {
  const { line, wpm, accuracy, elapsedMs } = result
  const stations = line.stations
  const listRef = useRef<HTMLUListElement>(null)
  /** Station names shown before an optional +N overflow chip. */
  const [nameCount, setNameCount] = useState(stations.length)

  const preview =
    nameCount >= stations.length
      ? stations
      : [...stations.slice(0, nameCount), `+${stations.length - nameCount}`]

  useLayoutEffect(() => {
    setNameCount(stations.length)
  }, [line.id, stations])

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list || list.clientHeight < 4) return

    const childCount = list.children.length
    const fit = countFullyVisibleChips(list)

    if (nameCount >= stations.length) {
      if (fit < childCount) {
        // Leave one slot for the +N chip.
        setNameCount(Math.max(0, fit - 1))
      }
      return
    }

    if (fit < childCount && nameCount > 0) {
      setNameCount((n) => Math.max(0, n - 1))
    }
  }, [line.id, stations, nameCount, preview.length])

  return (
    <>
      <div className="sc-pixel-grid" aria-hidden="true" />
      <header className="sc-pixel-head">
        <BrandMark className="sc-pixel-brand" />
        <p className="sc-pixel-kicker">PIXEL CLEAR</p>
        <DeviceTag device={result.device} className="sc-pixel-device" />
      </header>
      <div className="sc-pixel-stage">
        <PixelTrain color={line.color} className="sc-pixel-train" />
        <div className="sc-pixel-track" aria-hidden="true" />
      </div>
      <div className="sc-pixel-badge">
        <span className="sc-pixel-badge-label">WPM</span>
        <span className="sc-pixel-badge-wpm">{formatWpm(wpm)}</span>
      </div>
      <p className="sc-pixel-line">
        <span className="sc-pixel-dot" aria-hidden="true" />
        {line.name}
      </p>
      <ul ref={listRef} className="sc-pixel-chips">
        {preview.map((name, i) => (
          <li key={`${name}-${i}`}>{name}</li>
        ))}
      </ul>
      <footer className="sc-pixel-foot">
        <span>{formatAccuracy(accuracy)}</span>
        <span aria-hidden="true">·</span>
        <span>{formatElapsed(elapsedMs)}</span>
        <span aria-hidden="true">·</span>
        <span>{formatRaceDevice(result.device)}</span>
      </footer>
    </>
  )
}

/** Fixed-aspect neon card used on-screen and for PNG export (Instagram Story 9:16) */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ result, variant = 'neon' }, ref) {
    const { line } = result

    return (
      <div
        ref={ref}
        className="share-card"
        style={lineStyle(line.color)}
        data-share-card
        data-variant={variant}
      >
        {variant === 'neon' && <NeonScoreBody result={result} />}
        {variant === 'route' && <RouteClearedBody result={result} />}
        {variant === 'minimal' && <MinimalTypeBody result={result} />}
        {variant === 'ticket' && <TransitTicketBody result={result} />}
        {variant === 'monas' && <MonasPosterBody result={result} />}
        {variant === 'pixel' && <PixelRailBody result={result} />}
      </div>
    )
  },
)
