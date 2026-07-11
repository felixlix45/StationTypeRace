/**
 * Guard: Android-style resizes-content keyboard (layout viewport shrinks,
 * visualViewport tracks it) must still keep prompt + input clustered.
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
  server: { host: '127.0.0.1', port: 5179, strictPort: true },
  logLevel: 'error',
})
await vite.listen()
const baseUrl = vite.resolvedUrls?.local?.[0] ?? 'http://127.0.0.1:5179/'

const browser = await chromium.launch()
const context = await browser.newContext({
  ...devices['Pixel 5'],
  hasTouch: true,
  isMobile: true,
})
const page = await context.newPage()

await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.locator('button.line-pick').first().click()
await page.waitForSelector('#station-input')
await page.locator('#station-input').tap({ force: true })
await page.waitForTimeout(80)

// Simulate resizes-content: shrink the layout viewport (innerHeight).
await page.evaluate(() => {
  const kh = 320
  const nextH = window.innerHeight - kh
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    get() {
      return nextH
    },
  })
  // visualViewport usually tracks the resized layout viewport on Android.
  window.dispatchEvent(new Event('resize'))
  window.visualViewport?.dispatchEvent(new Event('resize'))
})
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
  const gap = ir.top - pr.bottom
  const visibleBottom = window.innerHeight
  return {
    kb: app?.getAttribute('data-kb'),
    innerHeight: window.innerHeight,
    gap: +gap.toFixed(1),
    roomBelowRail: +(visibleBottom - rr.bottom).toFixed(1),
    promptInView: pr.top >= -2 && pr.bottom <= window.innerHeight + 2,
    inputInView: ir.top >= -2 && ir.bottom <= window.innerHeight + 2,
    inputAboveRail: ir.bottom <= rr.top + 10,
    inputBelowPrompt: ir.top >= pr.bottom - 2,
    promptNearTop: pr.top <= 120,
    dockNearKeyboard: visibleBottom - rr.bottom <= 24,
  }
})

console.log('LAYOUT', JSON.stringify(layout, null, 2))

const ok =
  layout.kb === 'open' &&
  layout.promptInView &&
  layout.inputInView &&
  layout.inputBelowPrompt &&
  layout.inputAboveRail &&
  layout.gap >= 40 &&
  layout.promptNearTop &&
  layout.dockNearKeyboard

if (!ok) {
  console.error('RED: Android resize keyboard layout broken')
  process.exitCode = 1
} else {
  console.log('GREEN: Android resize keyboard splits prompt top / dock bottom')
}

await browser.close()
await vite.close()
