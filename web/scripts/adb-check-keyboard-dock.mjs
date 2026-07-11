import { chromium } from 'playwright'
import fs from 'fs'
import { spawnSync } from 'child_process'

const out = 'd:/SideProject/StationTypeRace/artifacts/adb-autofill'
fs.mkdirSync(out, { recursive: true })

function adbShot(name) {
  spawnSync(
    'cmd',
    [
      '/c',
      `adb exec-out screencap -p > d:\\SideProject\\StationTypeRace\\artifacts\\adb-autofill\\${name}.png`,
    ],
    { stdio: 'inherit' },
  )
  spawnSync(
    'python',
    [
      '-c',
      `from PIL import Image; im=Image.open(r'd:/SideProject/StationTypeRace/artifacts/adb-autofill/${name}.png'); im.resize((390,844)).save(r'd:/SideProject/StationTypeRace/artifacts/adb-autofill/${name}-sm.png'); print('${name}', im.size)`,
    ],
    { stdio: 'inherit' },
  )
}

function layout(page) {
  return page.evaluate(() => {
    const input = document.querySelector('#station-input')
    const prompt = document.querySelector(
      '.station-slide:not(.is-next) .prompt-word',
    )
    const rail = document.querySelector('.station-progress')
    const app = document.querySelector('.app')
    const ir = input.getBoundingClientRect()
    const pr = prompt?.getBoundingClientRect()
    const rr = rail.getBoundingClientRect()
    const overlapPrompt =
      pr &&
      !(ir.bottom <= pr.top + 1 || ir.top >= pr.bottom - 1 || ir.right <= pr.left || ir.left >= pr.right)
    const overlapRail = !(ir.bottom <= rr.top + 1 || ir.top >= rr.bottom - 1)
    return {
      kb: app?.getAttribute('data-kb'),
      readOnly: input.readOnly,
      promptText: (prompt?.textContent ?? '').replace(/\u00a0/g, ' '),
      input: { top: +ir.top.toFixed(1), bottom: +ir.bottom.toFixed(1) },
      prompt: pr
        ? { top: +pr.top.toFixed(1), bottom: +pr.bottom.toFixed(1) }
        : null,
      rail: { top: +rr.top.toFixed(1), bottom: +rr.bottom.toFixed(1) },
      overlapPrompt,
      overlapRail,
      inputBelowPrompt: !pr || ir.top >= pr.bottom - 2,
    }
  })
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
const page =
  context.pages().find((p) => p.url().includes('5173')) || context.pages()[0]
await page.bringToFront()
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.locator('button.line-pick', { hasText: 'Tanjung Priok' }).first().click()
await page.waitForSelector('#station-input')
await page.waitForTimeout(400)

const closed = await layout(page)
console.log('KB_CLOSED', JSON.stringify(closed, null, 2))
adbShot('04-kb-closed')

try {
  await page.locator('#station-input').tap({ force: true })
} catch {
  await page.locator('#station-input').click({ force: true })
}
await page.waitForTimeout(1200)

const open = await layout(page)
console.log('KB_OPEN', JSON.stringify(open, null, 2))
adbShot('05-kb-open')

const closedOk =
  closed.kb === 'closed' &&
  !closed.overlapPrompt &&
  closed.inputBelowPrompt &&
  !closed.overlapRail
const openOk =
  open.kb === 'open' &&
  !open.overlapPrompt &&
  !open.overlapRail &&
  open.input.bottom <= open.rail.top + 8

if (!closedOk || !openOk) {
  console.error('RED', { closedOk, openOk })
  process.exitCode = 1
} else {
  console.log('GREEN: prompt readable when kb closed; docked cleanly when open')
}

await browser.close()
