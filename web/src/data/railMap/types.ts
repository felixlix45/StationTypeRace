export type RailMapPoint = { x: number; y: number }

export type RailMapStation = {
  name: string
  x: number
  y: number
}

export type RailMapLinePath = {
  lineId: string
  points: RailMapPoint[]
  stations: RailMapStation[]
}

export type RailMapBorder = {
  id: string
  name: string
  points: RailMapPoint[] // ring; first === last optional
}

export type RailMapNetwork = {
  width: number
  height: number
  land: RailMapPoint[]
  borders: RailMapBorder[]
  lines: RailMapLinePath[]
}
