import { useEffect, useMemo, useRef, useState } from 'react'
import networkData from '../data/railMap/network.json'
import type { RailMapNetwork, RailMapPoint } from '../data/railMap/types'
import { STATION_LINES } from '../data/stations'
import {
  clampViewBox,
  frameAroundPoint,
  frameForFinishedLine,
  viewBoxToString,
  type ViewBox,
} from '../lib/railMapCamera'
import { mapStrokeColor } from '../lib/railMapContrast'
import {
  markerPointFromStations,
  markerTravelHeadingDeg,
  trainMarkerTransform,
} from '../lib/railMapProgress'
import { getLinePath, resolveStationPoints } from '../lib/railMapNetwork'
import { PixelTrainHeadGlyph } from './PixelTrain'

/** Medium race follow-zoom (plan: ~40–45% of min world dim). */
const RACE_ZOOM_FRAC = 0.42
const SELECTED_STROKE_IDLE = 5
const SELECTED_STROKE_RACE = 0.8
const STATION_DOT_R_RACE = 0.9
const STATION_DOT_STROKE_RACE = 0.5
const STATION_DOT_R_FINISH = 4
/**
 * Map marker size in world units (glyph viewBox is 56×36, nose faces −X).
 * Keep near station-dot scale so the thin race stroke stays readable.
 */
const TRAIN_HEAD_SCALE = 0.14
const TRAIN_GLYPH_CX = 28
const TRAIN_GLYPH_CY = 18

export type RailMapBackdropProps = {
  phase: 'idle' | 'racing' | 'finished'
  lineId: string | null
  /** Station currently being typed (racing). Ignored for idle/finished. */
  stationIndex?: number
  /** Chars typed / name length for current station (racing). */
  typedFraction?: number
  reducedMotion?: boolean
}

const network = networkData as RailMapNetwork

const LAND_FILL = '#F7F7F5'
/** Cool sea — distinct from white land; letterbox bands use the same fill. */
const WATER_FILL = '#6f8fa6'
const MUTED_STROKE = '#5c6570'
const BORDER_STROKE = '#d4d4d0'

/** Per-frame blend toward target viewBox (higher = snappier). */
const VIEWBOX_LERP = 0.14
const VIEWBOX_SNAP_EPS = 0.35

let warnedEmptyNetwork = false

function pointsToPolyline(points: RailMapPoint[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

function pointsToPolygonPath(points: RailMapPoint[]): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  return `M ${first!.x},${first!.y} ${rest.map((p) => `L ${p.x},${p.y}`).join(' ')} Z`
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function viewBoxDistance(a: ViewBox, b: ViewBox): number {
  return (
    Math.abs(a.x - b.x) +
    Math.abs(a.y - b.y) +
    Math.abs(a.w - b.w) +
    Math.abs(a.h - b.h)
  )
}

function blendViewBox(from: ViewBox, to: ViewBox, t: number): ViewBox {
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    w: lerp(from.w, to.w, t),
    h: lerp(from.h, to.h, t),
  }
}

function useSnapCamera(reducedMotion?: boolean): boolean {
  const [mediaReduce, setMediaReduce] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (reducedMotion != null) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setMediaReduce(mq.matches)
    setMediaReduce(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [reducedMotion])

  if (reducedMotion != null) return reducedMotion
  return mediaReduce
}

function useEasedViewBox(target: ViewBox, snap: boolean): ViewBox {
  const [current, setCurrent] = useState(target)
  const currentRef = useRef(target)
  const targetRef = useRef(target)
  targetRef.current = target

  useEffect(() => {
    if (snap) {
      currentRef.current = target
      setCurrent(target)
      return
    }

    let raf = 0
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const goal = targetRef.current
      const from = currentRef.current
      if (viewBoxDistance(from, goal) < VIEWBOX_SNAP_EPS) {
        currentRef.current = goal
        setCurrent(goal)
        return
      }
      const next = blendViewBox(from, goal, VIEWBOX_LERP)
      currentRef.current = next
      setCurrent(next)
      raf = window.requestAnimationFrame(tick)
    }

    raf = window.requestAnimationFrame(tick)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(raf)
    }
  }, [snap, target.x, target.y, target.w, target.h])

  return snap ? target : current
}

export function RailMapBackdrop({
  phase,
  lineId,
  stationIndex = 0,
  typedFraction = 0,
  reducedMotion,
}: RailMapBackdropProps) {
  const snapCamera = useSnapCamera(reducedMotion)
  // Idle may pass null (no hover) — do not fall back to a default line.
  // Race/finished fall back to the first network line if id is missing.
  const effectiveLineId =
    lineId ?? (phase === 'idle' ? null : (network.lines[0]?.lineId ?? null))
  const selectedPath = effectiveLineId
    ? getLinePath(network, effectiveLineId)
    : null
  const brandLine = STATION_LINES.find((l) => l.id === effectiveLineId)
  const selectedStroke = mapStrokeColor(brandLine?.color ?? '#666666')

  const stationPoints = useMemo(() => {
    if (!selectedPath || !brandLine) return []
    return resolveStationPoints(selectedPath, brandLine.stations)
  }, [selectedPath, brandLine])

  const markerPoint = useMemo(() => {
    if (stationPoints.length === 0) return null
    // Idle: highlight only — no progress marker on the wide network view.
    if (phase === 'idle') return null
    if (phase === 'finished') {
      return { ...stationPoints[stationPoints.length - 1]! }
    }
    return markerPointFromStations(stationPoints, stationIndex, typedFraction)
  }, [stationPoints, phase, stationIndex, typedFraction])

  const markerTransform = useMemo(() => {
    if (stationPoints.length < 2 || phase === 'idle') {
      return { rotateDeg: 0, scaleX: 1 }
    }
    const idx =
      phase === 'finished' ? stationPoints.length - 1 : stationIndex
    const frac = phase === 'finished' ? 1 : typedFraction
    return trainMarkerTransform(
      markerTravelHeadingDeg(stationPoints, idx, frac),
    )
  }, [stationPoints, phase, stationIndex, typedFraction])

  const selectedStrokeWidth =
    phase === 'racing' ? SELECTED_STROKE_RACE : SELECTED_STROKE_IDLE
  const stationDotR =
    phase === 'racing' ? STATION_DOT_R_RACE : STATION_DOT_R_FINISH

  const targetViewBox = useMemo(() => {
    const world = { width: network.width, height: network.height }
    const minDim = Math.min(world.width, world.height)
    const zoomSize = minDim * RACE_ZOOM_FRAC

    // Idle: full canvas so every corridor is end-to-end and sea surrounds land.
    if (phase === 'idle') {
      return { x: 0, y: 0, w: world.width, h: world.height }
    }

    if (phase === 'racing' && markerPoint) {
      return clampViewBox(
        frameAroundPoint(markerPoint, {
          padding: 28,
          minSize: 160,
          zoomSize,
        }),
        world,
      )
    }

    // Finished (or racing without marker): full line + stations, zoomed out.
    if (selectedPath) {
      return clampViewBox(
        frameForFinishedLine(selectedPath.points, stationPoints),
        world,
      )
    }

    return { x: 0, y: 0, w: world.width, h: world.height }
  }, [selectedPath, stationPoints, phase, markerPoint])

  const viewBox = useEasedViewBox(targetViewBox, snapCamera)
  const viewBoxStr = viewBoxToString(viewBox)
  // Idle + finished: `meet` so content is not cropped. Race fills with `slice`.
  const preserveAspectRatio =
    phase === 'racing' ? 'xMidYMid slice' : 'xMidYMid meet'

  if (!network.lines?.length) {
    if (!warnedEmptyNetwork) {
      warnedEmptyNetwork = true
      console.warn(
        '[RailMapBackdrop] rail map network has no lines; showing solid fallback background',
      )
    }
    return (
      <div
        className="rail-map-backdrop"
        aria-hidden="true"
        style={{ background: LAND_FILL }}
      />
    )
  }

  return (
    <div
      className="rail-map-backdrop"
      data-phase={phase}
      aria-hidden="true"
      style={{ background: WATER_FILL }}
    >
      {/* Base layer: land, borders, muted network — under scrim */}
      <svg
        className="rail-map-backdrop__svg rail-map-backdrop__svg--base"
        viewBox={viewBoxStr}
        preserveAspectRatio={preserveAspectRatio}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width={network.width} height={network.height} fill={WATER_FILL} />
        <path d={pointsToPolygonPath(network.land)} fill={LAND_FILL} />

        {network.borders.map((border) => (
          <polyline
            key={border.id}
            points={pointsToPolyline(border.points)}
            fill="none"
            stroke={BORDER_STROKE}
            strokeWidth={1}
            strokeDasharray="4 3"
            strokeLinejoin="round"
          />
        ))}

        {network.lines.map((line) => {
          // Skip selected in base layer when it is drawn thicker in the overlay.
          if (selectedPath && line.lineId === effectiveLineId) return null
          return (
            <polyline
              key={line.lineId}
              points={pointsToPolyline(line.points)}
              fill="none"
              stroke={MUTED_STROKE}
              strokeWidth={1.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.45}
            />
          )
        })}
      </svg>

      <div className="rail-map-backdrop__scrim" />

      {/* Selected line + stations + marker above scrim for AA contrast */}
      <svg
        className="rail-map-backdrop__svg rail-map-backdrop__svg--overlay"
        viewBox={viewBoxStr}
        preserveAspectRatio={preserveAspectRatio}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {selectedPath && (
          <polyline
            points={pointsToPolyline(selectedPath.points)}
            fill="none"
            stroke={selectedStroke}
            strokeWidth={selectedStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Station dots on race/finish; idle hover is line highlight only. */}
        {phase !== 'idle' &&
          stationPoints.map((station) => (
            <circle
              key={station.name}
              cx={station.x}
              cy={station.y}
              r={stationDotR}
              fill={LAND_FILL}
              stroke={selectedStroke}
              strokeWidth={
                phase === 'racing' ? STATION_DOT_STROKE_RACE : 2
              }
            />
          ))}

        {markerPoint && phase !== 'idle' && (
          <g
            className="rail-map-backdrop__train-mark"
            transform={`translate(${markerPoint.x} ${markerPoint.y}) rotate(${markerTransform.rotateDeg}) scale(${TRAIN_HEAD_SCALE * markerTransform.scaleX} ${TRAIN_HEAD_SCALE}) translate(${-TRAIN_GLYPH_CX} ${-TRAIN_GLYPH_CY})`}
          >
            <PixelTrainHeadGlyph color={selectedStroke} bodyFill={LAND_FILL} />
          </g>
        )}
      </svg>
    </div>
  )
}
