import { toPng } from 'html-to-image'
import type { StationLine } from '../data/stations'

export type ShareResult = {
  line: StationLine
  wpm: number
  rawWpm: number
  accuracy: number
  correctChars: number
  elapsedMs: number
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m <= 0) return `${s}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export function shareCaption(result: ShareResult): string {
  return `Cleared ${result.line.name} at ${result.wpm} WPM (${result.accuracy}% acc) on StationTypeRace`
}

async function waitForFonts(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready
  }
}

/** Instagram Stories / Reels portrait export width (height follows 9:16) */
const STORY_WIDTH = 1080

export async function captureShareCardPng(
  node: HTMLElement,
): Promise<string> {
  await waitForFonts()
  const width = Math.max(node.offsetWidth, 1)
  const pixelRatio = Math.min(4, Math.max(2, STORY_WIDTH / width))

  return toPng(node, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: '#050b12',
  })
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function dataUrlToFile(
  dataUrl: string,
  filename: string,
): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], filename, { type: 'image/png' })
}

export function canNativeShareFiles(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  )
}

export async function shareResultImage(
  result: ShareResult,
  dataUrl: string,
  filename: string,
): Promise<'shared' | 'downloaded'> {
  const file = await dataUrlToFile(dataUrl, filename)
  const caption = shareCaption(result)

  if (canNativeShareFiles()) {
    const payload: ShareData = {
      files: [file],
      title: 'StationTypeRace',
      text: caption,
    }
    if (navigator.canShare(payload)) {
      await navigator.share(payload)
      return 'shared'
    }
  }

  downloadDataUrl(dataUrl, filename)
  return 'downloaded'
}

export function shareFilename(lineId: string, wpm: number): string {
  return `station-type-race-${lineId}-${wpm}wpm.png`
}
