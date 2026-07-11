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
  // SVG paint — html-to-image foreignObject often drops stylesheet
  // `color-mix()` fills/strokes, which defaults SVG fill to black.
  'fill',
  'stroke',
  'strokeWidth',
  'strokeOpacity',
  'fillOpacity',
  'strokeLinecap',
  'strokeLinejoin',
  'strokeDasharray',
  'strokeDashoffset',
  'paintOrder',
  'stopColor',
  'stopOpacity',
  'animation',
  'animationName',
  'animationDuration',
  'animationPlayState',
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
 * html-to-image's SVG foreignObject often drops modern `color(srgb …)` /
 * `lab()` computed values. Convert to rgb/rgba when we can parse them.
 */
function modernColorToRgb(value: string): string {
  if (!value) return value
  const srgb = value.match(
    /color\(\s*srgb\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)/i,
  )
  if (!srgb) return value
  const r = Math.round(Number(srgb[1]) * 255)
  const g = Math.round(Number(srgb[2]) * 255)
  const b = Math.round(Number(srgb[3]) * 255)
  const a = srgb[4] !== undefined ? Number(srgb[4]) : 1
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return value
  }
  if (Number.isFinite(a) && a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  return `rgb(${r}, ${g}, ${b})`
}

function normalizeFrozenValue(prop: string, value: string): string {
  if (
    prop === 'color' ||
    prop === 'backgroundColor' ||
    prop === 'borderTopColor' ||
    prop === 'borderRightColor' ||
    prop === 'borderBottomColor' ||
    prop === 'borderLeftColor' ||
    prop === 'textDecorationColor' ||
    prop === 'fill' ||
    prop === 'stroke' ||
    prop === 'stopColor'
  ) {
    return modernColorToRgb(value)
  }
  if (
    prop === 'textShadow' ||
    prop === 'boxShadow' ||
    prop === 'backgroundImage' ||
    prop === 'filter'
  ) {
    return value.replace(
      /color\(\s*srgb\s+[0-9.]+\s+[0-9.]+\s+[0-9.]+(?:\s*\/\s*[0-9.]+)?\s*\)/gi,
      (match) => modernColorToRgb(match),
    )
  }
  return value
}

/**
 * Pin every descendant's computed layout/type to inline px values.
 * html-to-image goes through SVG foreignObject, where `cqw` / container
 * queries and mobile text inflation often diverge from the live preview.
 *
 * IMPORTANT: collect every computed value first, then write. Writing
 * inline widths/flex as we go reflows the tree and can collapse later
 * siblings (ticket barcode bars → 0px, brand flex → mid-word wrap).
 */
/** SVG paint attrs that foreignObject clones honor more reliably than CSS alone. */
const SVG_PAINT_ATTRS = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'fill-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'paint-order',
  'stop-color',
  'stop-opacity',
] as const

type FrozenStyleEntry = {
  node: Element
  styles: Array<{ kebab: string; value: string; priority: string }>
  svgPaint: Array<{ attr: string; value: string }> | null
  clearCssOpacity: boolean
  /** Extra typography/layout fixes applied after the generic freeze write. */
  textFix: TextFreezeFix | null
}

type TextFreezeFix = {
  fontFamily: string | null
  fontWeight: string | null
  fontStyle: string | null
  fontSize: string | null
  lineHeight: string | null
  letterSpacing: string | null
  /** Keep tabular-nums / OpenType features that `font` shorthand would wipe. */
  fontVariantNumeric: string | null
  fontFeatureSettings: string | null
  fontVariationSettings: string | null
  fontKerning: string | null
  /** Soften wrap modes that insert mid-glyph breaks in foreignObject. */
  overflowWrap: string | null
  wordBreak: string | null
  /** list-item / flow-root / -webkit-box repairs for FO. */
  display: string | null
  webkitBoxOrient: string | null
  webkitLineClamp: string | null
  /** nowrap chips: hug text so FO metric drift can't open word gaps. */
  width: string | null
  maxWidth: string | null
  minWidth: string | null
  whiteSpace: string | null
  /** Bake glyphs to an image so FO can't alter letter/word metrics. */
  rasterizeText: boolean
}

/**
 * html-to-image clones via SVG foreignObject and:
 * 1) rewrites font-size to `floor(px) - 0.1` unless we omit it from clone props
 * 2) mishandles `overflow-wrap: anywhere` / broken line-clamp boxes
 * 3) can open word gaps when a nowrap chip keeps a stale width inside a
 *    flex/grid formatting context while font metrics shift
 *
 * Snapshot live metrics first, then apply these FO-safe overrides.
 *
 * Do NOT assign `font: unset` — that inlines `font-variant`/`font-kerning`
 * as `unset` and strips stylesheet `tabular-nums` on big WPM numbers
 * (Minimal / Monas), changing digit metrics in the PNG.
 */
function buildTextFreezeFix(
  node: Element,
  cs: CSSStyleDeclaration,
): TextFreezeFix | null {
  if (!(node instanceof HTMLElement)) return null

  const fix: TextFreezeFix = {
    fontFamily: null,
    fontWeight: null,
    fontStyle: null,
    fontSize: null,
    lineHeight: null,
    letterSpacing: null,
    fontVariantNumeric: null,
    fontFeatureSettings: null,
    fontVariationSettings: null,
    fontKerning: null,
    overflowWrap: null,
    wordBreak: null,
    display: null,
    webkitBoxOrient: null,
    webkitLineClamp: null,
    width: null,
    maxWidth: null,
    minWidth: null,
    whiteSpace: null,
    rasterizeText: false,
  }

  if (cs.fontSize) fix.fontSize = cs.fontSize
  const fam = cs.fontFamily?.trim()
  if (fam) fix.fontFamily = fam
  if (cs.fontWeight) fix.fontWeight = cs.fontWeight
  if (cs.fontStyle) fix.fontStyle = cs.fontStyle
  if (cs.lineHeight) fix.lineHeight = cs.lineHeight
  const ls = cs.letterSpacing
  fix.letterSpacing = !ls || ls === 'normal' ? '0px' : ls
  const variantNumeric = cs.fontVariantNumeric?.trim()
  if (variantNumeric && variantNumeric !== 'normal') {
    fix.fontVariantNumeric = variantNumeric
  }
  const features = cs.fontFeatureSettings?.trim()
  if (features && features !== 'normal') {
    fix.fontFeatureSettings = features
  }
  const variations = cs.fontVariationSettings?.trim()
  if (variations && variations !== 'normal') {
    fix.fontVariationSettings = variations
  }
  const kerning = cs.fontKerning?.trim()
  if (kerning && kerning !== 'auto') {
    fix.fontKerning = kerning
  }

  const ow = cs.overflowWrap || cs.getPropertyValue('overflow-wrap')
  if (ow === 'anywhere') fix.overflowWrap = 'break-word'
  if (cs.wordBreak === 'break-all') fix.wordBreak = 'normal'

  const clamp = cs.webkitLineClamp
  if (clamp && clamp !== 'none') {
    // Computed display is often `flow-root` for -webkit-box; freeze that
    // and line-clamp collapses into huge vertical gaps on long names.
    fix.display = '-webkit-box'
    fix.webkitBoxOrient = 'vertical'
    fix.webkitLineClamp = String(clamp)
  } else if (cs.display === 'list-item') {
    fix.display = 'block'
  }

  const nowrap = (cs.whiteSpace || '').includes('nowrap')
  const chipLike =
    nowrap &&
    node.matches(
      [
        '.sc-pixel-chips li',
        '.sc-route-stop-name',
        '.sc-ticket-place',
        '.sc-ticket-line',
        '.share-card-line-name',
        '.sc-route-line-name',
        '.sc-min-foot span',
      ].join(', '),
    )

  if (chipLike) {
    fix.width = 'max-content'
    fix.maxWidth = '100%'
    fix.minWidth = '0'
    fix.whiteSpace = 'nowrap'
    if (!fix.display) fix.display = 'block'
    fix.rasterizeText = true
  }

  return fix
}

/**
 * Replace a leaf text label with a canvas raster of the same glyphs.
 * foreignObject often shifts JetBrains Mono metrics; baking the ink avoids
 * post-render letter/word gaps while keeping the live DOM untouched after restore.
 */
function rasterizeLabelText(el: HTMLElement): void {
  const text = el.textContent ?? ''
  if (!text || el.querySelector('img[data-share-text-raster]')) return

  const cs = window.getComputedStyle(el)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const ratio = Math.max(2, Math.min(4, window.devicePixelRatio || 2))
  ctx.font = cs.font
  const metrics = ctx.measureText(text)
  const textW = Math.ceil(metrics.width)
  const ascent = metrics.actualBoundingBoxAscent || 0
  const descent = metrics.actualBoundingBoxDescent || 0
  const textH = Math.ceil(
    ascent + descent > 0
      ? ascent + descent
      : parseFloat(cs.fontSize) * 1.2,
  )
  const padX = 0
  const padY = 0
  const cssW = Math.max(1, textW + padX * 2)
  const cssH = Math.max(1, textH + padY * 2)

  canvas.width = Math.ceil(cssW * ratio)
  canvas.height = Math.ceil(cssH * ratio)
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.font = cs.font
  ctx.fillStyle = cs.color
  ctx.textBaseline = 'alphabetic'
  const baseline =
    metrics.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.8
  ctx.fillText(text, padX, padY + baseline)

  const img = document.createElement('img')
  img.dataset.shareTextRaster = '1'
  img.alt = text
  img.src = canvas.toDataURL('image/png')
  img.style.display = 'block'
  img.style.width = `${cssW}px`
  img.style.height = `${cssH}px`
  img.style.maxWidth = '100%'
  img.draggable = false

  el.textContent = ''
  el.style.display = 'block'
  el.style.width = 'max-content'
  el.style.maxWidth = '100%'
  el.style.lineHeight = '0'
  el.appendChild(img)
}

function freezeComputedStyles(root: HTMLElement): void {
  const nodes: Element[] = [root, ...root.querySelectorAll('*')]
  const pending: FrozenStyleEntry[] = []

  // Pass 1 — snapshot against the undisturbed layout.
  for (const node of nodes) {
    if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) continue
    const cs = window.getComputedStyle(node)
    const styles: FrozenStyleEntry['styles'] = []
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
      // Freeze animations off so flame/glow frames don't flicker mid-capture.
      if (prop === 'animation' || prop === 'animationName') {
        value = 'none'
      }
      if (prop === 'animationPlayState') {
        value = 'paused'
      }
      value = normalizeFrozenValue(prop, value)
      styles.push({
        kebab,
        value,
        priority: cs.getPropertyPriority(kebab),
      })
    }

    let svgPaint: FrozenStyleEntry['svgPaint'] = null
    let clearCssOpacity = false
    // Mirror resolved SVG paint onto presentation attributes. Stylesheet
    // `color-mix()` / `currentColor` often fail inside html-to-image's
    // foreignObject clone; without concrete attrs, fill falls back to black
    // (Monas) or shifts hue (Pixel train).
    if (node instanceof SVGElement) {
      svgPaint = []
      let resolvedColor = ''
      try {
        resolvedColor = modernColorToRgb(cs.getPropertyValue('color'))
      } catch {
        resolvedColor = ''
      }
      for (const attr of SVG_PAINT_ATTRS) {
        let value = ''
        try {
          value = cs.getPropertyValue(attr)
        } catch {
          continue
        }
        if (!value || value === 'normal') continue
        // Bake currentColor to a concrete rgb/hex so the clone cannot
        // re-resolve against a different inherited color.
        if (
          (attr === 'fill' || attr === 'stroke' || attr === 'stop-color') &&
          /currentColor/i.test(value) &&
          resolvedColor
        ) {
          value = resolvedColor
        } else {
          value = modernColorToRgb(value)
        }
        svgPaint.push({ attr, value })
      }
      // Prefer attribute opacity over a frozen CSS opacity that can stack
      // with the presentation attribute inside foreignObject serialization.
      clearCssOpacity = node.hasAttribute('opacity')
    }

    pending.push({
      node,
      styles,
      svgPaint,
      clearCssOpacity,
      textFix: buildTextFreezeFix(node, cs),
    })
  }

  // Pass 2 — apply snapshots without intermediate reflows changing reads.
  for (const entry of pending) {
    const { node, styles, svgPaint, clearCssOpacity, textFix } = entry
    if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) {
      continue
    }
    for (const { kebab, value, priority } of styles) {
      try {
        node.style.setProperty(kebab, value, priority || undefined)
      } catch {
        /* SVG may reject some CSS props — ignore */
      }
    }
    if (svgPaint && node instanceof SVGElement) {
      for (const { attr, value } of svgPaint) {
        try {
          node.setAttribute(attr, value)
        } catch {
          /* ignore */
        }
      }
      if (clearCssOpacity) {
        try {
          node.style.removeProperty('opacity')
        } catch {
          /* ignore */
        }
      }
    }
    // Explicitly kill mobile text inflation on the freeze target.
    if (node instanceof HTMLElement) {
      node.style.setProperty('-webkit-text-size-adjust', '100%')
      node.style.setProperty('text-size-adjust', '100%')
      node.style.setProperty('zoom', '1')
      // Keep spaces from stretching when FO font metrics diverge.
      node.style.setProperty('word-spacing', '0px')
      node.style.setProperty('text-align-last', 'auto')
      node.style.setProperty('text-justify', 'none')
      if (textFix) {
        // Re-assert type longhands only — never `font: unset`, which inlines
        // font-variant/kerning as unset and kills tabular-nums on WPM scores.
        // `font` is already omitted from html-to-image includeStyleProperties.
        if (textFix.fontFamily) {
          node.style.setProperty('font-family', textFix.fontFamily)
        }
        if (textFix.fontSize) {
          node.style.setProperty('font-size', textFix.fontSize)
        }
        if (textFix.fontWeight) {
          node.style.setProperty('font-weight', textFix.fontWeight)
        }
        if (textFix.fontStyle) {
          node.style.setProperty('font-style', textFix.fontStyle)
        }
        if (textFix.lineHeight) {
          node.style.setProperty('line-height', textFix.lineHeight)
        }
        if (textFix.letterSpacing) {
          node.style.setProperty('letter-spacing', textFix.letterSpacing)
        }
        if (textFix.fontVariantNumeric) {
          node.style.setProperty(
            'font-variant-numeric',
            textFix.fontVariantNumeric,
          )
        }
        if (textFix.fontFeatureSettings) {
          node.style.setProperty(
            'font-feature-settings',
            textFix.fontFeatureSettings,
          )
        }
        if (textFix.fontVariationSettings) {
          node.style.setProperty(
            'font-variation-settings',
            textFix.fontVariationSettings,
          )
        }
        if (textFix.fontKerning) {
          node.style.setProperty('font-kerning', textFix.fontKerning)
        }
        if (textFix.overflowWrap) {
          node.style.setProperty('overflow-wrap', textFix.overflowWrap)
        }
        if (textFix.wordBreak) {
          node.style.setProperty('word-break', textFix.wordBreak)
        }
        if (textFix.display) {
          node.style.setProperty('display', textFix.display)
        }
        if (textFix.webkitBoxOrient) {
          node.style.setProperty('-webkit-box-orient', textFix.webkitBoxOrient)
        }
        if (textFix.webkitLineClamp) {
          node.style.setProperty('-webkit-line-clamp', textFix.webkitLineClamp)
          node.style.setProperty('line-clamp', textFix.webkitLineClamp)
        }
        if (textFix.width) node.style.setProperty('width', textFix.width)
        if (textFix.maxWidth) {
          node.style.setProperty('max-width', textFix.maxWidth)
        }
        if (textFix.minWidth) {
          node.style.setProperty('min-width', textFix.minWidth)
        }
        if (textFix.whiteSpace) {
          node.style.setProperty('white-space', textFix.whiteSpace)
        }
      }
    }
  }

  // Pass 3 — bake nowrap label glyphs so FO cannot alter spacing.
  for (const entry of pending) {
    if (
      entry.textFix?.rasterizeText &&
      entry.node instanceof HTMLElement
    ) {
      rasterizeLabelText(entry.node)
    }
  }
}

type InlineStyleSnapshot = {
  cssText: string
  /** SVG presentation attrs present before freeze (null = was absent). */
  svgPaint: Partial<Record<(typeof SVG_PAINT_ATTRS)[number], string | null>> | null
}

function snapshotSubtreeInline(root: HTMLElement): Map<Element, InlineStyleSnapshot> {
  const map = new Map<Element, InlineStyleSnapshot>()
  const nodes: Element[] = [root, ...root.querySelectorAll('*')]
  for (const node of nodes) {
    if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) continue
    let svgPaint: InlineStyleSnapshot['svgPaint'] = null
    if (node instanceof SVGElement) {
      svgPaint = {}
      for (const attr of SVG_PAINT_ATTRS) {
        svgPaint[attr] = node.hasAttribute(attr) ? node.getAttribute(attr) : null
      }
    }
    map.set(node, { cssText: node.style.cssText, svgPaint })
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
    if (node instanceof SVGElement && prev?.svgPaint) {
      for (const attr of SVG_PAINT_ATTRS) {
        const was = prev.svgPaint[attr]
        if (was === null || was === undefined) node.removeAttribute(attr)
        else node.setAttribute(attr, was)
      }
    }
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

    // html-to-image's cloneCSSStyle does `floor(fontSizePx) - 0.1`, which
    // desyncs frozen chip widths from glyph metrics and opens word gaps.
    // Keep our frozen inline font-size by omitting those props from the clone
    // overwrite pass (inline styles from the DOM clone are preserved).
    const includeStyleProperties = Array.from(
      window.getComputedStyle(document.documentElement),
    ).filter((prop) => prop !== 'font-size' && prop !== 'font')

    const options = {
      cacheBust: true,
      // One scaling path only — combining pixelRatio with canvasWidth multiplies
      // again on mobile WebKit/Chrome and produces ~4k PNGs.
      pixelRatio: SHARE_PIXEL_RATIO,
      width: SHARE_DESIGN_WIDTH,
      height: SHARE_DESIGN_HEIGHT,
      backgroundColor: '#050b12',
      preferredFontFormat: 'woff2' as const,
      includeStyleProperties,
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
