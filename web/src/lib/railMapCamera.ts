import {
  boundsOfPoints,
  pointAtProgress,
  viewBoxFromBounds,
  type RailMapPoint,
} from './railMapGeometry'

export type RailMapCameraMode = 'idle' | 'racing' | 'finished'

export type ViewBox = { x: number; y: number; w: number; h: number }

/** Comfortable margin around the completed line on results. */
export const FINISHED_FRAME_PADDING = 100
/** Floor so short lines (e.g. Tanjung Priok) stay readable, not tight-cropped. */
export const FINISHED_FRAME_MIN_SIZE = 240

export function frameForLine(
  points: RailMapPoint[],
  opts: { padding: number; minSize: number },
): ViewBox {
  return viewBoxFromBounds(boundsOfPoints(points), opts.padding, opts.minSize)
}

/**
 * Finished/results camera: frame the full selected path plus every station
 * (stations can sit slightly off path polyline endpoints).
 */
export function frameForFinishedLine(
  pathPoints: RailMapPoint[],
  stationPoints: RailMapPoint[] = [],
  opts: { padding: number; minSize: number } = {
    padding: FINISHED_FRAME_PADDING,
    minSize: FINISHED_FRAME_MIN_SIZE,
  },
): ViewBox {
  const points =
    stationPoints.length > 0
      ? [...pathPoints, ...stationPoints]
      : pathPoints
  return frameForLine(points, opts)
}

/** Wide idle frame covering every line path in the network. */
export function frameForNetwork(
  lines: { points: RailMapPoint[] }[],
  opts: { padding: number; minSize: number },
): ViewBox {
  const all = lines.flatMap((line) => line.points)
  if (all.length === 0) {
    return { x: 0, y: 0, w: opts.minSize, h: opts.minSize }
  }
  return viewBoxFromBounds(boundsOfPoints(all), opts.padding, opts.minSize)
}

export function frameAroundPoint(
  point: { x: number; y: number },
  opts: { padding: number; minSize: number; zoomSize: number },
): ViewBox {
  const half = opts.zoomSize / 2
  const bounds = {
    minX: point.x - half,
    minY: point.y - half,
    maxX: point.x + half,
    maxY: point.y + half,
  }
  return viewBoxFromBounds(bounds, opts.padding, opts.minSize)
}

export function frameForProgress(
  points: RailMapPoint[],
  progress: number,
  opts: { padding: number; minSize: number; zoomSize: number },
): ViewBox {
  return frameAroundPoint(pointAtProgress(points, progress), opts)
}

export function clampViewBox(
  vb: ViewBox,
  world: { width: number; height: number },
): ViewBox {
  let { x, y, w, h } = vb
  w = Math.min(w, world.width)
  h = Math.min(h, world.height)
  x = Math.min(Math.max(0, x), world.width - w)
  y = Math.min(Math.max(0, y), world.height - h)
  return { x, y, w, h }
}

export function viewBoxToString(vb: ViewBox): string {
  return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`
}
