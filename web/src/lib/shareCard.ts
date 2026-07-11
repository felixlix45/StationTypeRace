import { toPng } from 'html-to-image'
import type { StationLine } from '../data/stations'

/** Device class for the race run — snapshotted at race start. */
export type RaceDevice = 'mobile' | 'computer'

export type ShareResult = {
  line: StationLine
  wpm: number
  rawWpm: number
  accuracy: number
  correctChars: number
  elapsedMs: number
  /** Where the race was typed (mobile soft-keyboard vs computer). */
  device: RaceDevice
}

/**
 * Classify the current client as mobile or computer for the share card.
 *
 * Important: touchscreen laptops/desktops must stay "computer".
 * Use the *primary* pointer (`pointer`, not `any-pointer`) plus hover.
 * A Surface/laptop with a trackpad reports `(pointer: fine)` and
 * `(hover: hover)` even when `(any-pointer: coarse)` is also true.
 */
export function detectRaceDevice(): RaceDevice {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'computer'
  }

  const ua = navigator.userAgent
  const primaryFine = window.matchMedia('(pointer: fine)').matches
  const primaryCoarse = window.matchMedia('(pointer: coarse)').matches
  const canHover = window.matchMedia('(hover: hover)').matches
  const noHover = window.matchMedia('(hover: none)').matches
  const touchPoints = navigator.maxTouchPoints ?? 0

  // Clear phone UAs only (not bare "Android" — that also matches tablets)
  if (/iPhone|iPod|Android.+Mobile|Windows Phone|webOS|BlackBerry|IEMobile/i.test(ua)) {
    return 'mobile'
  }

  // iPad / iPadOS 13+ (reports as MacIntel + touch)
  const iPad =
    /iPad/i.test(ua) ||
    (navigator.platform === 'MacIntel' && touchPoints > 1)
  if (iPad) return 'mobile'

  // Touchscreen computer: fine primary pointer + real hover = desktop/laptop
  // even if fingers can also touch the screen.
  if (primaryFine && canHover) return 'computer'

  // Phone / pure-tablet posture: coarse primary, no hover
  if (primaryCoarse && noHover) return 'mobile'

  return 'computer'
}

export function formatRaceDevice(device: RaceDevice): string {
  return device === 'mobile' ? 'Mobile' : 'Computer'
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m <= 0) return `${s}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export function shareCaption(result: ShareResult): string {
  return `Cleared ${result.line.name} at ${result.wpm} WPM (${result.accuracy}% acc) on ${formatRaceDevice(result.device)} · StationTypeRace`
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
