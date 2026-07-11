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

/** Payload for the dedicated screenshot page (`#/share`). */
export type SharePagePayload = {
  result: ShareResult
  /** Matches `ShareCardVariant` ids from ShareCard.tsx */
  variant: string
}

const SHARE_PAGE_STORAGE_KEY = 'str-share-page-v1'
export const SHARE_PAGE_HASH = '#/share'

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

/** Layout/typography properties that must be px-frozen before html-to-image. */
const FREEZE_STYLE_PROPS = [
  'display',
  'position',
  'boxSizing',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderTopStyle',
  'borderRightStyle',
  'borderBottomStyle',
  'borderLeftStyle',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
  'gap',
  'rowGap',
  'columnGap',
  'flexDirection',
  'flexWrap',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignItems',
  'alignSelf',
  'justifyContent',
  'justifyItems',
  'justifySelf',
  'alignContent',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridAutoRows',
  'gridAutoColumns',
  'gridColumn',
  'gridRow',
  'placeItems',
  'placeContent',
  'overflow',
  'overflowX',
  'overflowY',
  'objectFit',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'fontVariant',
  'fontFeatureSettings',
  'fontVariationSettings',
  'lineHeight',
  'letterSpacing',
  'wordSpacing',
  'textAlign',
  'textTransform',
  'textDecoration',
  'textDecorationLine',
  'textDecorationColor',
  'textDecorationStyle',
  'textIndent',
  'whiteSpace',
  'wordBreak',
  'overflowWrap',
  'color',
  'opacity',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundClip',
  'backgroundOrigin',
  'boxShadow',
  'textShadow',
  'filter',
  'backdropFilter',
  'mixBlendMode',
  'transform',
  'transformOrigin',
  'clipPath',
  'maskImage',
  'webkitMaskImage',
  'zIndex',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'verticalAlign',
  'visibility',
] as const

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

function camelToKebab(prop: string): string {
  const kebab = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
  if (
    kebab.startsWith('webkit-') ||
    kebab.startsWith('moz-') ||
    kebab.startsWith('ms-')
  ) {
    return `-${kebab}`
  }
  return kebab
}

/**
 * Pin every descendant's computed layout/type to inline px values.
 * html-to-image goes through SVG foreignObject, where `cqw` / container
 * queries and mobile text inflation often diverge from the live preview.
 */
function freezeComputedStyles(root: HTMLElement): void {
  const nodes: Element[] = [root, ...root.querySelectorAll('*')]
  for (const node of nodes) {
    if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) continue
    const cs = window.getComputedStyle(node)
    for (const prop of FREEZE_STYLE_PROPS) {
      const kebab = camelToKebab(prop)
      let value = ''
      try {
        value = cs.getPropertyValue(kebab)
      } catch {
        continue
      }
      if (!value) continue
      // Skip shorthand leftovers that browsers leave empty or "normal"-ish noise
      if (prop === 'inset' && value === 'auto') continue
      try {
        node.style.setProperty(
          kebab,
          value,
          cs.getPropertyPriority(kebab) || undefined,
        )
      } catch {
        /* SVG may reject some CSS props — ignore */
      }
    }
    // Explicitly kill mobile text inflation on the freeze target.
    if (node instanceof HTMLElement) {
      node.style.setProperty('-webkit-text-size-adjust', '100%')
      node.style.setProperty('text-size-adjust', '100%')
      node.style.setProperty('zoom', '1')
    }
  }
}

type InlineStyleSnapshot = {
  cssText: string
}

function snapshotSubtreeInline(root: HTMLElement): Map<Element, InlineStyleSnapshot> {
  const map = new Map<Element, InlineStyleSnapshot>()
  const nodes: Element[] = [root, ...root.querySelectorAll('*')]
  for (const node of nodes) {
    if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) continue
    map.set(node, { cssText: node.style.cssText })
  }
  return map
}

function restoreSubtreeInline(
  root: HTMLElement,
  snap: Map<Element, InlineStyleSnapshot>,
) {
  const nodes: Element[] = [root, ...root.querySelectorAll('*')]
  for (const node of nodes) {
    if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) continue
    const prev = snap.get(node)
    node.style.cssText = prev?.cssText ?? ''
  }
}

function pinDesignBox(el: HTMLElement) {
  el.style.width = `${SHARE_DESIGN_WIDTH}px`
  el.style.maxWidth = `${SHARE_DESIGN_WIDTH}px`
  el.style.minWidth = `${SHARE_DESIGN_WIDTH}px`
  el.style.height = `${SHARE_DESIGN_HEIGHT}px`
  el.style.maxHeight = `${SHARE_DESIGN_HEIGHT}px`
  el.style.minHeight = `${SHARE_DESIGN_HEIGHT}px`
  el.style.transform = 'none'
  el.style.margin = '0'
  el.style.zoom = '1'
  el.style.setProperty('-webkit-text-size-adjust', '100%')
  el.style.setProperty('text-size-adjust', '100%')
}

/**
 * Capture the share card at a fixed CSS design size so mobile/desktop PNGs
 * share the same typography and padding as the web preview.
 *
 * Prefer a node from `.share-capture-host` (no preview scale / drop-shadow).
 * Falls back to pinning the live preview node when needed.
 */
export async function captureShareCardPng(
  node: HTMLElement,
): Promise<string> {
  await waitForShareFonts()

  const host = node.closest('.share-capture-host') as HTMLElement | null
  const frame = node.closest('.share-card-frame') as HTMLElement | null
  const subtreeSnap = snapshotSubtreeInline(node)
  const hostSnap = host ? host.style.cssText : null
  const frameSnap = frame ? frame.style.cssText : null

  if (host) {
    host.style.width = `${SHARE_DESIGN_WIDTH}px`
    host.style.height = `${SHARE_DESIGN_HEIGHT}px`
    host.style.transform = 'none'
    host.style.filter = 'none'
    host.style.opacity = '1'
  }
  if (frame) {
    frame.style.width = `${SHARE_DESIGN_WIDTH}px`
    frame.style.maxWidth = `${SHARE_DESIGN_WIDTH}px`
    frame.style.minWidth = `${SHARE_DESIGN_WIDTH}px`
    frame.style.transform = 'none'
    frame.style.filter = 'none'
  }
  pinDesignBox(node)

  try {
    // Settle container queries + React layout effects (pixel chip fitting).
    await nextFrame()
    await new Promise((r) => window.setTimeout(r, 80))
    await nextFrame()

    // Resolve cqw / % padding to concrete px while still in a real DOM layout.
    freezeComputedStyles(node)
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
        zoom: '1',
        // Avoid iOS Safari shrinking the clone with page zoom / text size.
        webkitTextSizeAdjust: '100%',
        textSizeAdjust: '100%',
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
    restoreSubtreeInline(node, subtreeSnap)
    if (host && hostSnap !== null) host.style.cssText = hostSnap
    if (frame && frameSnap !== null) frame.style.cssText = frameSnap
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

export function isSharePageHash(hash = window.location.hash): boolean {
  return hash === SHARE_PAGE_HASH || hash.startsWith(`${SHARE_PAGE_HASH}?`)
}

export function saveSharePagePayload(payload: SharePagePayload): void {
  try {
    sessionStorage.setItem(SHARE_PAGE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* private mode / quota — page will show empty state */
  }
}

export function loadSharePagePayload(): SharePagePayload | null {
  try {
    const raw = sessionStorage.getItem(SHARE_PAGE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SharePagePayload
    if (!parsed?.result?.line?.id || !parsed.variant) return null
    return parsed
  } catch {
    return null
  }
}

export function clearSharePagePayload(): void {
  try {
    sessionStorage.removeItem(SHARE_PAGE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function openShareScreenshotPage(payload: SharePagePayload): void {
  saveSharePagePayload(payload)
  window.location.hash = SHARE_PAGE_HASH
}
