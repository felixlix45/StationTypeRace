import { forwardRef } from 'react'
import type { CSSProperties } from 'react'
import { formatWpm } from '../lib/wpm'
import { formatElapsed, type ShareResult } from '../lib/shareCard'
import { PixelTrain } from './PixelTrain'
import { PixelStationBuilding } from './PixelStationBuilding'

function lineStyle(color: string): CSSProperties {
  return { ['--line' as string]: color } as CSSProperties
}

type ShareCardProps = {
  result: ShareResult
}

/** Fixed-aspect neon card used on-screen and for PNG export */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ result }, ref) {
    const { line, wpm, correctChars, elapsedMs } = result
    const stations = line.stations
    const preview =
      stations.length <= 8
        ? stations
        : [
            ...stations.slice(0, 4),
            '…',
            ...stations.slice(stations.length - 3),
          ]

    return (
      <div
        ref={ref}
        className="share-card"
        style={lineStyle(line.color)}
        data-share-card
      >
        <div className="share-card-grid" aria-hidden="true" />
        <div className="share-card-scan" aria-hidden="true" />

        <header className="share-card-top">
          <p className="share-card-kicker">Line cleared</p>
          <h2 className="share-card-brand">StationTypeRace</h2>
        </header>

        <div className="share-card-train">
          <PixelTrain color={line.color} className="share-card-train-svg" />
        </div>

        <div className="share-card-line">
          <span className="share-card-dot" />
          <div>
            <p className="share-card-system">{line.system}</p>
            <p className="share-card-line-name">{line.name}</p>
            <p className="share-card-route">{line.route}</p>
          </div>
        </div>

        <div className="share-card-score">
          <p className="share-card-wpm-label">Average WPM</p>
          <p className="share-card-wpm">{formatWpm(wpm)}</p>
          <p className="share-card-meta">
            {stations.length} stations · {correctChars} chars ·{' '}
            {formatElapsed(elapsedMs)}
          </p>
        </div>

        <div className="share-card-stations">
          <p className="share-card-stations-label">Stations typed</p>
          <ul className="share-card-station-list">
            {preview.map((name, i) =>
              name === '…' ? (
                <li key={`${name}-${i}`} className="is-ellipsis">
                  {name}
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
        </div>

        <footer className="share-card-foot">
          <span className="share-card-foot-mark">◆</span>
          <span>Jakarta rail typing race</span>
        </footer>
      </div>
    )
  },
)
