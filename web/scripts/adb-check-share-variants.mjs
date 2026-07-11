/**
 * For every share-card variant on a real mobile Chrome (CDP):
 * compare on-screen preview (pinned to design size) vs downloaded PNG.
 *
 * GREEN when: PNG is 1080×1920 and visual mean abs diff vs preview < threshold.
 *
 *   adb reverse tcp:5173 tcp:5173
 *   adb forward tcp:9222 localabstract:chrome_devtools_remote
 *   npm run dev
 *   node scripts/adb-check-share-variants.mjs
 */
import { chromium } from 'playwright'
import fs from 'fs'
import { spawnSync } from 'child_process'
import path from 'path'

const out = 'd:/SideProject/StationTypeRace/artifacts/adb-share-variants'
fs.mkdirSync(out, { recursive: true })

const VARIANTS = ['neon', 'route', 'minimal', 'ticket', 'monas', 'pixel']
const DESIGN_W = 280
const DESIGN_H = Math.round((DESIGN_W * 16) / 9)
const PNG_W = 1080
const PNG_H = 1920
/** Mean channel abs diff (0–255). Preview vs downscaled PNG. */
const MAX_MEAN_DIFF = 12

function pngSizeFromDataUrl(dataUrl) {
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length,
  }
}

function compareImages(previewPath, pngPath, reportPath) {
  const py = `
from PIL import Image, ImageChops, ImageStat, ImageDraw, ImageFont
import json, sys

preview = Image.open(r'${previewPath.replace(/\\/g, '/')}').convert('RGB')
png = Image.open(r'${pngPath.replace(/\\/g, '/')}').convert('RGB')
# Compare at design resolution
size = (${DESIGN_W}, ${DESIGN_H})
a = preview.resize(size, Image.Resampling.LANCZOS)
b = png.resize(size, Image.Resampling.LANCZOS)
diff = ImageChops.difference(a, b)
stat = ImageStat.Stat(diff)
mean = sum(stat.mean) / 3
# Side-by-side report
pad = 8
report = Image.new('RGB', (size[0] * 2 + pad * 3, size[1] + pad * 2 + 28), (12, 16, 22))
report.paste(a, (pad, pad + 24))
report.paste(b, (pad * 2 + size[0], pad + 24))
draw = ImageDraw.Draw(report)
draw.text((pad, 4), 'preview', fill=(180, 220, 255))
draw.text((pad * 2 + size[0], 4), f'png mean={mean:.2f}', fill=(255, 200, 120))
report.save(r'${reportPath.replace(/\\/g, '/')}')
# Also save a boosted diff map
boost = diff.point(lambda p: min(255, int(p * 4)))
boost.save(r'${reportPath.replace(/\\/g, '/').replace('-compare.png', '-diff.png')}')
print(json.dumps({
  'mean': mean,
  'previewSize': list(preview.size),
  'pngSize': list(png.size),
}))
`
  const r = spawnSync('python', ['-c', py], { encoding: 'utf-8' })
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout)
    throw new Error('python compare failed')
  }
  return JSON.parse((r.stdout || '').trim().split('\n').pop())
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
const page =
  context.pages().find((p) => p.url().includes('5173')) || context.pages()[0]
await page.bringToFront()
await page.goto('http://127.0.0.1:5173/?v=' + Date.now(), {
  waitUntil: 'networkidle',
})

await page
  .locator('button.line-pick', { hasText: 'Tanjung Priok' })
  .first()
  .click()
await page.waitForSelector('#station-input')
try {
  await page.locator('#station-input').tap({ force: true })
} catch {
  await page.locator('#station-input').click({ force: true })
}

let guard = 0
while (guard++ < 40) {
  const phase = await page.getAttribute('.app', 'data-phase')
  if (phase === 'finished') break
  const target = await page.evaluate(() => {
    const slide = document.querySelector(
      '.station-slide:not(.is-next) .prompt-word',
    )
    return (slide?.textContent ?? '').replace(/\u00a0/g, ' ')
  })
  if (!target) break
  const input = page.locator('#station-input')
  await input.fill('')
  await input.pressSequentially(target, { delay: 3 })
  await page.keyboard.press('Space')
  await page.waitForTimeout(50)
}

await page.waitForSelector('.share-card', { timeout: 10000 })
await page.waitForTimeout(500)

const results = []

for (const variant of VARIANTS) {
  console.log(`\n=== ${variant} ===`)
  await page
    .locator('.share-style-opt', {
      has: page.locator('.share-style-opt-label', {
        hasText:
          {
            neon: 'Neon Score',
            route: 'Route Cleared',
            minimal: 'Minimal Type',
            ticket: 'Transit Ticket',
            monas: 'Monas Poster',
            pixel: 'Pixel Rail',
          }[variant],
      }),
    })
    .click()
  await page.waitForTimeout(350)

  // Pin to design size (same as capture) and screenshot the card for "preview truth"
  const previewMeta = await page.evaluate(({ DESIGN_W, DESIGN_H }) => {
    const card = document.querySelector('.share-card')
    const frame = document.querySelector('.share-card-frame')
    const snaps = []
    const snap = (el) => {
      if (!el) return null
      const s = {
        width: el.style.width,
        height: el.style.height,
        maxWidth: el.style.maxWidth,
        minWidth: el.style.minWidth,
        transform: el.style.transform,
      }
      snaps.push({ el, s })
      return s
    }
    const frameSnap = snap(frame)
    const cardSnap = snap(card)
    if (frame) {
      frame.style.width = `${DESIGN_W}px`
      frame.style.maxWidth = `${DESIGN_W}px`
      frame.style.minWidth = `${DESIGN_W}px`
      frame.style.transform = 'none'
    }
    card.style.width = `${DESIGN_W}px`
    card.style.maxWidth = `${DESIGN_W}px`
    card.style.minWidth = `${DESIGN_W}px`
    card.style.height = `${DESIGN_H}px`
    card.style.transform = 'none'
    return {
      offsetWidth: card.offsetWidth,
      offsetHeight: card.offsetHeight,
      variant: card.getAttribute('data-variant'),
      frameSnap,
      cardSnap,
    }
  }, { DESIGN_W, DESIGN_H })

  await page.waitForTimeout(80)
  const previewPath = path.join(out, `${variant}-preview.png`)
  await page.locator('.share-card').screenshot({ path: previewPath })

  // Restore visual scale before download (captureShareCardPng pins itself)
  await page.evaluate(() => {
    const card = document.querySelector('.share-card')
    const frame = document.querySelector('.share-card-frame')
    // Clear inline pins — CSS scale wrapper takes over again
    for (const el of [card, frame]) {
      if (!el) continue
      el.style.width = ''
      el.style.height = ''
      el.style.maxWidth = ''
      el.style.minWidth = ''
      el.style.transform = ''
    }
  })

  const dataUrls = await page.evaluate(async () => {
    const captured = []
    const proto = HTMLAnchorElement.prototype
    const orig = proto.click
    proto.click = function clickPatched() {
      if (this.download && typeof this.href === 'string') {
        captured.push({ href: this.href, download: this.download })
      }
      return orig.apply(this, arguments)
    }
    const btn = document.querySelector('.share-actions .btn.primary')
    if (!(btn instanceof HTMLButtonElement)) throw new Error('Save missing')
    btn.click()
    const start = Date.now()
    while (captured.length === 0 && Date.now() - start < 20000) {
      await new Promise((r) => setTimeout(r, 100))
    }
    proto.click = orig
    if (captured.length === 0) return []
    const { href, download } = captured[0]
    if (href.startsWith('data:image')) {
      return [{ dataUrl: href, filename: download }]
    }
    if (href.startsWith('blob:')) {
      const res = await fetch(href)
      const blob = await res.blob()
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      return [{ dataUrl, filename: download }]
    }
    return []
  })

  if (dataUrls.length === 0) {
    results.push({
      variant,
      ok: false,
      error: 'no PNG captured',
      previewMeta,
    })
    console.log('RED: no PNG')
    continue
  }

  const { dataUrl, filename } = dataUrls[0]
  const pngPath = path.join(out, `${variant}-download.png`)
  fs.writeFileSync(pngPath, Buffer.from(dataUrl.split(',')[1], 'base64'))
  const png = pngSizeFromDataUrl(dataUrl)
  console.log('FILENAME', filename)

  const comparePath = path.join(out, `${variant}-compare.png`)
  const cmp = compareImages(previewPath, pngPath, comparePath)

  // Downscale for human glance
  spawnSync(
    'python',
    [
      '-c',
      `from PIL import Image; Image.open(r'${comparePath.replace(/\\/g, '/')}').resize((568, 526)).save(r'${path.join(out, variant + '-compare-sm.png').replace(/\\/g, '/')}')`,
    ],
    { stdio: 'inherit' },
  )

  const sizeOk = png.width === PNG_W && png.height >= PNG_H - 5 && png.height <= PNG_H + 5
  const visualOk = cmp.mean <= MAX_MEAN_DIFF
  const ok = sizeOk && visualOk && previewMeta.offsetWidth === DESIGN_W

  results.push({
    variant,
    ok,
    sizeOk,
    visualOk,
    mean: cmp.mean,
    png: `${png.width}x${png.height}`,
    preview: `${previewMeta.offsetWidth}x${previewMeta.offsetHeight}`,
  })
  console.log(
    ok ? 'GREEN' : 'RED',
    JSON.stringify(results[results.length - 1]),
  )
}

const allOk = results.every((r) => r.ok)
fs.writeFileSync(
  path.join(out, 'summary.json'),
  JSON.stringify({ allOk, threshold: MAX_MEAN_DIFF, results }, null, 2),
)
console.log('\nSUMMARY', JSON.stringify({ allOk, results }, null, 2))
process.exit(allOk ? 0 : 1)
