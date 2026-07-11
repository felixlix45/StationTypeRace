import { chromium } from 'playwright'
import fs from 'fs'
import { spawnSync } from 'child_process'

const out = 'd:/SideProject/StationTypeRace/artifacts/adb-autofill'
fs.mkdirSync(out, { recursive: true })

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
const page =
  context.pages().find((p) => p.url().includes('5173')) || context.pages()[0]
console.log('page', page.url(), await page.title())

await page.bringToFront()
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })

await page.locator('button.line-pick', { hasText: 'Tanjung Priok' }).first().click()
await page.waitForSelector('#station-input')

const attrsBefore = await page.evaluate(() => {
  const el = document.querySelector('#station-input')
  return {
    type: el.type,
    name: el.name,
    autocomplete: el.getAttribute('autocomplete'),
    readOnly: el.readOnly,
    placeholder: el.placeholder,
    decoys: [...document.querySelectorAll('.autofill-decoy input')].map((i) => ({
      name: i.name,
      ac: i.autocomplete,
    })),
  }
})
console.log('attrsBefore', JSON.stringify(attrsBefore, null, 2))

try {
  await page.locator('#station-input').tap({ force: true })
} catch {
  await page.locator('#station-input').click({ force: true })
}
await page.waitForTimeout(1000)

const attrsAfter = await page.evaluate(() => {
  const el = document.querySelector('#station-input')
  return {
    readOnly: el.readOnly,
    placeholder: el.placeholder,
    active: document.activeElement === el,
  }
})
console.log('attrsAfter', JSON.stringify(attrsAfter))

spawnSync(
  'cmd',
  [
    '/c',
    'adb exec-out screencap -p > d:\\SideProject\\StationTypeRace\\artifacts\\adb-autofill\\02-focused.png',
  ],
  { stdio: 'inherit' },
)
spawnSync(
  'python',
  [
    '-c',
    "from PIL import Image; im=Image.open(r'd:/SideProject/StationTypeRace/artifacts/adb-autofill/02-focused.png'); print(im.size); im.resize((390,844)).save(r'd:/SideProject/StationTypeRace/artifacts/adb-autofill/02-focused-sm.png')",
  ],
  { stdio: 'inherit' },
)

spawnSync('adb', ['shell', 'uiautomator', 'dump', '/sdcard/uidump2.xml'], {
  stdio: 'inherit',
})
spawnSync('adb', ['pull', '/sdcard/uidump2.xml', `${out}/uidump2.xml`], {
  stdio: 'inherit',
})

const dump = fs.readFileSync(`${out}/uidump2.xml`, 'utf8')
const hits = [
  'Autofill',
  'autofill',
  'Password',
  'Credit',
  'Address',
  'Contact',
  'Save',
  'key',
  'Keyboard',
].filter((k) => dump.toLowerCase().includes(k.toLowerCase()))
console.log('uidump keyword hits:', hits)

// Don't disconnect the device browser session
await browser.close()
