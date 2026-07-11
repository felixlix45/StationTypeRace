/**
 * Verify race input rejects suggestion / swipe / paste bulk inserts.
 * Uses Chrome on device via CDP (adb forward tcp:9222 …).
 *
 *   adb reverse tcp:5173 tcp:5173
 *   adb forward tcp:9222 localabstract:chrome_devtools_remote
 *   npm run dev
 *   node scripts/adb-check-no-suggestions.mjs
 */
import { chromium } from 'playwright'
import fs from 'fs'
import { spawnSync } from 'child_process'

const out = 'd:/SideProject/StationTypeRace/artifacts/adb-no-suggestions'
fs.mkdirSync(out, { recursive: true })

function screencap(name) {
  spawnSync(
    'cmd',
    [
      '/c',
      `adb exec-out screencap -p > d:\\SideProject\\StationTypeRace\\artifacts\\adb-no-suggestions\\${name}.png`,
    ],
    { stdio: 'inherit' },
  )
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
const page =
  context.pages().find((p) => p.url().includes('5173')) || context.pages()[0]
console.log('page', page.url())

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
await page.waitForTimeout(600)

const attrs = await page.evaluate(() => {
  const el = document.querySelector('#station-input')
  return {
    autocomplete: el.getAttribute('autocomplete'),
    autocorrect: el.getAttribute('autocorrect'),
    autocapitalize: el.getAttribute('autocapitalize'),
    spellcheck: el.spellcheck,
    writingsuggestions: el.getAttribute('writingsuggestions'),
    inputmode: el.getAttribute('inputmode'),
  }
})
console.log('attrs', JSON.stringify(attrs, null, 2))

const results = await page.evaluate(async () => {
  const el = document.querySelector('#station-input')
  el.focus()

  const fireBefore = (inputType, data) => {
    const ev = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType,
      data,
    })
    return el.dispatchEvent(ev)
  }

  const read = () => el.value

  const allowedReplace = fireBefore('insertReplacementText', 'Jakarta Kota')
  if (allowedReplace) {
    el.value = 'Jakarta Kota'
    el.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertReplacementText',
        data: 'Jakarta Kota',
      }),
    )
  }
  await new Promise((r) => setTimeout(r, 50))
  const afterReplace = read()

  const allowedSwipe = fireBefore('insertText', 'Jakarta')
  if (allowedSwipe) {
    el.value = 'Jakarta'
    el.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: 'Jakarta',
      }),
    )
  }
  await new Promise((r) => setTimeout(r, 50))
  const afterSwipe = read()

  const allowedPaste = fireBefore('insertFromPaste', 'Jakarta Kota')
  if (allowedPaste) {
    el.value = 'Jakarta Kota'
    el.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertFromPaste',
        data: 'Jakarta Kota',
      }),
    )
  }
  await new Promise((r) => setTimeout(r, 50))
  const afterPaste = read()

  // Single char must still be allowed through beforeinput
  const allowedChar = fireBefore('insertText', 'J')
  if (allowedChar) {
    // Drive React via the native setter + input so controlled state updates
    const proto = window.HTMLInputElement.prototype
    const desc = Object.getOwnPropertyDescriptor(proto, 'value')
    desc.set.call(el, 'J')
    el.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: 'J',
      }),
    )
  }
  await new Promise((r) => setTimeout(r, 80))
  const afterChar = read()

  return {
    afterReplace,
    afterSwipe,
    afterPaste,
    afterChar,
    prevented: {
      replace: !allowedReplace,
      swipe: !allowedSwipe,
      paste: !allowedPaste,
      char: allowedChar,
    },
  }
})

console.log('results', JSON.stringify(results, null, 2))

screencap('01-focused')

const ok =
  results.prevented.replace &&
  results.prevented.swipe &&
  results.prevented.paste &&
  results.prevented.char &&
  results.afterReplace === '' &&
  results.afterSwipe === '' &&
  results.afterPaste === '' &&
  results.afterChar === 'J'

console.log(
  ok
    ? 'GREEN: suggestion / swipe / paste blocked'
    : 'RED: bulk insert still accepted',
)
fs.writeFileSync(
  `${out}/result.json`,
  JSON.stringify({ attrs, results, ok }, null, 2),
)
process.exit(ok ? 0 : 1)
