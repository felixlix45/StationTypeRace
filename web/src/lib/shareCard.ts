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

/** Canonical on-screen + export CSS width (cqw typography is keyed to this). */
export const SHARE_DESIGN_WIDTH = 280
/** 9:16 Instagram Stories portrait */
export const SHARE_DESIGN_HEIGHT = Math.round((SHARE_DESIGN_WIDTH * 16) / 9)
/** Final PNG pixel width */
const STORY_WIDTH = 1080
const SHARE_PIXEL_RATIO = STORY_WIDTH / SHARE_DESIGN_WIDTH

async function waitForShareFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  await document.fonts.ready
  // Force-load weights used on the card so mobile Safari embeds them in the PNG.
  await Promise.all([
    document.fonts.load('600 64px Syne'),
    document.fonts.load('700 64px Syne'),
    document.fonts.load('800 64px Syne'),
    document.fonts.load('400 32px "JetBrains Mono"'),
    document.fonts.load('600 32px "JetBrains Mono"'),
    document.fonts.load('700 32px "JetBrains Mono"'),
  ]).catch(() => {
    /* keep going — system fallback is better than failing the share */
  })
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

type InlineStyleSnapshot = {
  width: string
  height: string
  maxWidth: string
  minWidth: string
  transform: string
}

function snapshotInline(el: HTMLElement): InlineStyleSnapshot {
  return {
    width: el.style.width,
    height: el.style.height,
    maxWidth: el.style.maxWidth,
    minWidth: el.style.minWidth,
    transform: el.style.transform,
  }
}

function restoreInline(el: HTMLElement, snap: InlineStyleSnapshot) {
  el.style.width = snap.width
  el.style.height = snap.height
  el.style.maxWidth = snap.maxWidth
  el.style.minWidth = snap.minWidth
  el.style.transform = snap.transform
}

/**
 * Capture the share card at a fixed CSS design size so mobile/desktop PNGs
 * share the same cqw typography and padding (preview width must not leak in).
 */
export async function captureShareCardPng(
  node: HTMLElement,
): Promise<string> {
  await waitForShareFonts()

  const frame = node.closest('.share-card-frame') as HTMLElement | null
  const nodeSnap = snapshotInline(node)
  const frameSnap = frame ? snapshotInline(frame) : null

  // Pin layout to the canonical design box (same as desktop preview).
  if (frame) {
    frame.style.width = `${SHARE_DESIGN_WIDTH}px`
    frame.style.maxWidth = `${SHARE_DESIGN_WIDTH}px`
    frame.style.minWidth = `${SHARE_DESIGN_WIDTH}px`
    frame.style.transform = 'none'
  }
  node.style.width = `${SHARE_DESIGN_WIDTH}px`
  node.style.maxWidth = `${SHARE_DESIGN_WIDTH}px`
  node.style.minWidth = `${SHARE_DESIGN_WIDTH}px`
  node.style.height = `${SHARE_DESIGN_HEIGHT}px`
  node.style.transform = 'none'

  try {
    // Settle container queries + React layout effects (pixel chip fitting).
    await nextFrame()
    await new Promise((r) => window.setTimeout(r, 64))
    await nextFrame()

    const options = {
      cacheBust: true,
      // One scaling path only — combining pixelRatio with canvasWidth multiplies
      // again on mobile WebKit/Chrome and produces ~4k PNGs.
      pixelRatio: SHARE_PIXEL_RATIO,
      width: SHARE_DESIGN_WIDTH,
      height: SHARE_DESIGN_HEIGHT,
      backgroundColor: '#050b12',
      preferredFontFormat: 'woff2' as const,
      style: {
        width: `${SHARE_DESIGN_WIDTH}px`,
        height: `${SHARE_DESIGN_HEIGHT}px`,
        maxWidth: `${SHARE_DESIGN_WIDTH}px`,
        minWidth: `${SHARE_DESIGN_WIDTH}px`,
        transform: 'none',
        margin: '0',
        // Avoid iOS Safari shrinking the clone with page zoom / text size.
        zoom: '1',
      },
    }

    try {
      return await toPng(node, options)
    } catch {
      // Mobile WebKit sometimes fails the first font-embed pass — retry once.
      await waitForShareFonts()
      await nextFrame()
      return await toPng(node, options)
    }
  } finally {
    restoreInline(node, nodeSnap)
    if (frame && frameSnap) restoreInline(frame, frameSnap)
  }
}

export async function downloadDataUrl(
  dataUrl: string,
  filename: string,
): Promise<void> {
  // Mobile Chrome often ignores <a download> for large data: URLs.
  // Blob object URLs are reliable and keep the chosen filename.
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    // Delay revoke so the browser can start the download first.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000)
  }
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

  await downloadDataUrl(dataUrl, filename)
  return 'downloaded'
}

/** Unique per save so mobile browsers do not collide / silently skip overwrites. */
export function shareFilename(
  lineId: string,
  wpm: number,
  variant?: string,
): string {
  const safeLine = lineId.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()
  const safeVariant = (variant ?? 'card')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .toLowerCase()
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '-')
    .slice(0, 19)
  const uniq = Math.random().toString(36).slice(2, 8)
  return `station-type-race-${safeLine}-${safeVariant}-${wpm}wpm-${stamp}-${uniq}.png`
}
