/**
 * Repro: soft-keyboard Space (beforeinput/input only, no keydown) must advance.
 * Exit 0 = advanced (green). Exit 1 = stuck (red / bug present).
 *
 * Usage: node scripts/repro-mobile-space-advance.mjs [baseUrl]
 */
import { chromium } from 'playwright'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5173/'

function currentStationFromDom() {
  const slide = document.querySelector('.station-slide:not(.is-next) .prompt-word')
  if (!slide) return ''
  return (slide.textContent ?? '').replace(/\u00a0/g, ' ')
}

function stopLabel() {
  const el = document.querySelector('.race-progress, .race-hud, .race')
  const text = el?.textContent ?? document.body.textContent ?? ''
  const m = text.match(/Stop\s+(\d+)\s+of\s+(\d+)/i)
  return m ? { stop: Number(m[1]), total: Number(m[2]) } : null
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
})

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const priok = page.locator('button.line-pick', { hasText: 'Tanjung Priok' })
  if ((await priok.count()) > 0) await priok.first().click()
  else await page.locator('button.primary').click()

  await page.waitForSelector('#station-input')
  const target = await page.evaluate(currentStationFromDom)
  if (!target) throw new Error('Could not read current station')

  const before = await page.evaluate(stopLabel)
  const input = page.locator('#station-input')
  await input.click()
  // Type full station without Space-as-advance (spaces inside names are fine)
  await input.pressSequentially(target, { delay: 5 })

  const typed = await input.inputValue()
  if (typed.length !== target.length) {
    throw new Error(`Expected full length ${target.length}, got ${typed.length} (${JSON.stringify(typed)})`)
  }

  // Soft-keyboard path: beforeinput + input only — no keydown/keyup
  const advancedViaBeforeInput = await page.evaluate(() => {
    const el = document.querySelector('#station-input')
    if (!(el instanceof HTMLInputElement)) return false
    const beforeEvt = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      composed: true,
      data: ' ',
      inputType: 'insertText',
    })
    const cancelled = !el.dispatchEvent(beforeEvt)
    if (cancelled || beforeEvt.defaultPrevented) {
      // Handler should have advanced already
      return true
    }
    // Fallback path browsers that ignore beforeinput: mutate via native setter + input
    const desc = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )
    desc?.set?.call(el, `${el.value} `)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })

  await page.waitForTimeout(200)
  const after = await page.evaluate(stopLabel)
  const afterStation = await page.evaluate(currentStationFromDom)
  const phase = await page.getAttribute('.app', 'data-phase')

  const moved =
    phase === 'finished' ||
    (before &&
      after &&
      (after.stop > before.stop || afterStation !== target))

  console.log(
    JSON.stringify(
      {
        target,
        before,
        after,
        afterStation,
        phase,
        advancedViaBeforeInput,
        moved,
      },
      null,
      2,
    ),
  )

  if (!moved) {
    console.error('RED: Space via beforeinput/input did not advance station')
    process.exitCode = 1
  } else {
    console.log('GREEN: station advanced without keydown Space')
  }
} finally {
  await browser.close()
}
