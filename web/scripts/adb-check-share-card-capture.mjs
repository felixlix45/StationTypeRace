/**
 * On-device verify: share card PNG is always 1080×1920 and layout uses 280px design width.
 * Requires: adb device, adb reverse 5173, Chrome CDP on 9222, vite on 5173.
 */
import { chromium } from 'playwright'
import fs from 'fs'
import { spawnSync } from 'child_process'

const out = 'd:/SideProject/StationTypeRace/artifacts/adb-share-card'
fs.mkdirSync(out, { recursive: true })

function adbShot(name) {
  spawnSync(
    'cmd',
    [
      '/c',
      `adb exec-out screencap -p > d:\\SideProject\\StationTypeRace\\artifacts\\adb-share-card\\${name}.png`,
    ],
    { stdio: 'inherit' },
  )
  spawnSync(
    'python',
    [
      '-c',
      `from PIL import Image; im=Image.open(r'd:/SideProject/StationTypeRace/artifacts/adb-share-card/${name}.png'); im.resize((390,844)).save(r'd:/SideProject/StationTypeRace/artifacts/adb-share-card/${name}-sm.png'); print('${name}', im.size)`,
    ],
    { stdio: 'inherit' },
  )
}

function pngSizeFromDataUrl(dataUrl) {
  const b64 = dataUrl.split(',')[1]
  const buf = Buffer.from(b64, 'base64')
  // PNG IHDR: width/height at bytes 16–23
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf.length }
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
let page =
  context.pages().find((p) => p.url().includes('5173')) || context.pages()[0]
await page.bringToFront()
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })

await page.locator('button.line-pick', { hasText: 'Tanjung Priok' }).first().click()
await page.waitForSelector('#station-input')
try {
  await page.locator('#station-input').tap({ force: true })
} catch {
  await page.locator('#station-input').click({ force: true })
}

// Finish the short line
let guard = 0
while (guard++ < 40) {
  const phase = await page.getAttribute('.app', 'data-phase')
  if (phase === 'finished') break
  const target = await page.evaluate(() => {
    const slide = document.querySelector('.station-slide:not(.is-next) .prompt-word')
    return (slide?.textContent ?? '').replace(/\u00a0/g, ' ')
  })
  if (!target) break
  const input = page.locator('#station-input')
  await input.fill('')
  await input.pressSequentially(target, { delay: 4 })
  await page.keyboard.press('Space')
  await page.waitForTimeout(60)
}

await page.waitForSelector('.share-card', { timeout: 10000 })
await page.waitForTimeout(400)

const preview = await page.evaluate(() => {
  const card = document.querySelector('.share-card')
  const frame = document.querySelector('.share-card-frame')
  const scale = document.querySelector('.share-card-frame-scale')
  const cr = card.getBoundingClientRect()
  const brand = document.querySelector('.share-card-brand-primary, .sc-min-brand, .sc-pixel-brand')
  const brandFs = brand ? getComputedStyle(brand).fontSize : null
  return {
    cardOffsetWidth: card.offsetWidth,
    cardRectW: +cr.width.toFixed(1),
    frameOffsetWidth: frame?.offsetWidth ?? null,
    scaleClientWidth: scale?.clientWidth ?? null,
    brandFontSize: brandFs,
    transform: frame ? getComputedStyle(frame).transform : null,
  }
})
console.log('PREVIEW', JSON.stringify(preview, null, 2))

// Intercept Save image — prefers blob: (mobile-safe) or data: hrefs
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
  if (!(btn instanceof HTMLButtonElement)) throw new Error('Save button missing')
  btn.click()
  const start = Date.now()
  while (captured.length === 0 && Date.now() - start < 15000) {
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
  console.error('RED: no PNG data URL captured from Save image')
  process.exitCode = 1
  await browser.close()
  process.exit(1)
}

const { dataUrl, filename } = dataUrls[0]
const png = pngSizeFromDataUrl(dataUrl)
fs.writeFileSync(
  `${out}/share-card-mobile.png`,
  Buffer.from(dataUrl.split(',')[1], 'base64'),
)
console.log('PNG', JSON.stringify(png))
console.log('FILENAME', filename)

const uniqueName =
  typeof filename === 'string' &&
  /-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-[a-z0-9]+\.png$/i.test(filename)

adbShot('06-finished-preview')

const layoutOk = preview.cardOffsetWidth === 280
const pngOk =
  png.width === 1080 && png.height >= 1915 && png.height <= 1925

console.log(
  JSON.stringify(
    {
      layoutOk,
      pngOk,
      uniqueName,
      filename,
      previewWidth: preview.cardOffsetWidth,
      pngSize: `${png.width}x${png.height}`,
      brandFontSize: preview.brandFontSize,
    },
    null,
    2,
  ),
)

if (!layoutOk || !pngOk || !uniqueName) {
  console.error('RED: share card capture / filename check failed')
  process.exitCode = 1
} else {
  console.log('GREEN: mobile preview layout 280px; PNG 1080×1920; unique filename')
}

await browser.close()
