function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim()
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const light = Math.max(l1, l2)
  const dark = Math.min(l1, l2)
  return (light + 0.05) / (dark + 0.05)
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a)
  const [br, bg, bb] = parseHex(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/** AA non-text (≥3:1) stroke against land. */
export function mapStrokeColor(
  brandHex: string,
  landHex = '#F7F7F5',
): string {
  if (contrastRatio(brandHex, landHex) >= 3) return brandHex
  let best = brandHex
  for (let i = 1; i <= 20; i++) {
    const candidate = mix(brandHex, '#111111', i / 20)
    if (contrastRatio(candidate, landHex) >= 3) return candidate
    best = candidate
  }
  return best
}
