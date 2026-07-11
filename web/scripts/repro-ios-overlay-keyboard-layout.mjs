/**
 * Repro: iOS-style overlay soft keyboard (layout viewport unchanged,
 * visualViewport shrinks) must keep station prompt + input clustered
 * above the line map — not split top/bottom across the visible area.
 *
 * Android (resizes-content) already works; this mocks WebKit overlay behavior.
 */
import { chromium, devices } from 'playwright'
import { createServer } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const vite = await createServer({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 5177, strictPort: true },
  logLevel: 'error',
})
await vite.listen()
const viteUrls = vite.resolvedUrls?.local ?? []
const baseUrl = viteUrls[0] ?? 'http://127.0.0.1:5177/'

const browser = await chromium.launch()
const context = await browser.newContext({
  ...devices['iPhone 13'],
  // Force coarse pointer so the race input stays readOnly until tap (mobile path).
  hasTouch: true,
  isMobile: true,
})
const page = await context.newPage()

// Overlay keyboard: innerHeight stays put; visualViewport.height shrinks.
await page.addInitScript(() => {
  let vvHeight = window.innerHeight
  let vvTop = 0
  const resizeListeners = new Set()
  const scrollListeners = new Set()

  const fakeVV = {
    get width() {
      return window.innerWidth
    },
    get height() {
      return vvHeight
    },
    get offsetTop() {
      return vvTop
    },
    get offsetLeft() {
      return 0
    },
    get pageLeft() {
      return 0
    },
    get pageTop() {
      return vvTop
    },
    get scale() {
      return 1
    },
    addEventListener(type, fn) {
      if (type === 'resize') resizeListeners.add(fn)
      if (type === 'scroll') scrollListeners.add(fn)
    },
    removeEventListener(type, fn) {
      if (type === 'resize') resizeListeners.delete(fn)
      if (type === 'scroll') scrollListeners.delete(fn)
    },
  }

  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    get() {
      return fakeVV
    },
  })

  window.__mockOverlayKeyboard = (open, keyboardPx = 320) => {
    if (open) {
      vvHeight = Math.max(200, window.innerHeight - keyboardPx)
      vvTop = 0
    } else {
      vvHeight = window.innerHeight
      vvTop = 0
    }
    const ev = new Event('resize')
    resizeListeners.forEach((fn) => fn(ev))
  }
})

await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.locator('button.line-pick').first().click()
await page.waitForSelector('#station-input')

// Unlock readOnly guard (mobile) then open overlay keyboard.
await page.locator('#station-input').tap({ force: true })
await page.waitForTimeout(80)
await page.evaluate(() => window.__mockOverlayKeyboard(true, 320))
await page.waitForTimeout(200)

const layout = await page.evaluate(() => {
  const app = document.querySelector('.app')
  const input = document.querySelector('#station-input')
  const prompt = document.querySelector(
    '.station-slide.is-current .prompt-word',
  )
  const rail = document.querySelector('.station-progress')
  const ir = input.getBoundingClientRect()
  const pr = prompt.getBoundingClientRect()
  const rr = rail.getBoundingClientRect()
  const vv = window.visualViewport
  const visibleBottom = (vv?.offsetTop ?? 0) + (vv?.height ?? window.innerHeight)
  const visibleTop = vv?.offsetTop ?? 0
  const gap = ir.top - pr.bottom
  return {
    kb: app?.getAttribute('data-kb'),
    vvHeight: vv?.height ?? null,
    prompt: { top: +pr.top.toFixed(1), bottom: +pr.bottom.toFixed(1) },
    input: { top: +ir.top.toFixed(1), bottom: +ir.bottom.toFixed(1) },
    rail: { top: +rr.top.toFixed(1), bottom: +rr.bottom.toFixed(1) },
    gap: +gap.toFixed(1),
    promptInView: pr.bottom > visibleTop + 4 && pr.top < visibleBottom - 4,
    inputInView: ir.bottom > visibleTop + 4 && ir.top < visibleBottom - 4,
    inputAboveRail: ir.bottom <= rr.top + 10,
    inputBelowPrompt: ir.top >= pr.bottom - 2,
    // Cluster should sit near the top of the visual viewport (not packed to the keyboard).
    clusterNearTop: pr.top - visibleTop <= 120,
  }
})

console.log('LAYOUT', JSON.stringify(layout, null, 2))

const ok =
  layout.kb === 'open' &&
  layout.promptInView &&
  layout.inputInView &&
  layout.inputBelowPrompt &&
  layout.inputAboveRail &&
  layout.gap >= 0 &&
  layout.gap <= 160 &&
  layout.clusterNearTop

if (!ok) {
  console.error('RED: iOS overlay keyboard splits prompt and input')
  process.exitCode = 1
} else {
  console.log('GREEN: prompt + input stay clustered above line map')
}

await browser.close()
await vite.close()
