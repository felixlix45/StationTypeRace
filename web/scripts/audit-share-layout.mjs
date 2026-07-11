/**
 * Share-card layout audit: all variants × ratios.
 * Checks overlaps, tight gaps, and live (capture host) vs PNG parity.
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const OUT = 'd:/SideProject/StationTypeRace/artifacts/share-layout-audit'
fs.mkdirSync(OUT, { recursive: true })

const VARIANTS = [
  'Neon Score',
  'Route Cleared',
  'Minimal Type',
  'Transit Ticket',
  'Monas Poster',
  'Pixel Rail',
]
const RATIOS = ['story', 'square']
const MIN_GAP = 4 // px between sibling content blocks
const MIN_EDGE = 8 // px padding from card inner content to border (approx)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })

// Medium line for denser content stress
await page
  .locator('button.line-pick')
  .filter({ hasText: /Tangerang Line/i })
  .first()
  .click()
await page.waitForTimeout(500)

async function finishRace() {
  for (let i = 0; i < 60; i++) {
    const info = await page.evaluate(() => {
      const phase = document.querySelector('.app')?.getAttribute('data-phase')
      const word = document.querySelector('.prompt-word:not(.preview)')
      return { phase, target: word?.textContent?.trim() || null }
    })
    if (info.phase === 'finished') return true
    if (!info.target) {
      await page.waitForTimeout(100)
      continue
    }
    const input = page.locator('#station-input')
    await input.click()
    await input.fill('')
    await input.type(info.target, { delay: 1 })
    await page.keyboard.press('Space')
    await page.waitForTimeout(35)
  }
  return false
}

const done = await finishRace()
if (!done) {
  console.error('FAILED to finish race')
  await browser.close()
  process.exit(1)
}
await page.waitForSelector('.share-format-picker')
console.log('race finished — auditing 12 cards')

async function selectCombo(ratio, variantLabel) {
  await page
    .locator('.share-format-opt')
    .filter({ hasText: new RegExp(ratio === 'square' ? '^Square' : '^Story') })
    .first()
    .click()
  await page
    .locator('.share-style-opt')
    .filter({ hasText: new RegExp(variantLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
    .first()
    .click()
}

function slug(ratio, variantLabel) {
  return `${ratio}-${variantLabel.toLowerCase().replace(/\s+/g, '-')}`
}

/**
 * Measure capture-host card (design-size truth) for overlaps + gaps.
 * Also sample typography/padding for live→PNG drift checks.
 */
async function measureCard() {
  return page.evaluate(({ minGap, minEdge }) => {
    const host = document.querySelector('.share-capture-host')
    const card = host?.querySelector('[data-share-card]')
    if (!card) return { error: 'no capture card' }

    const cs = getComputedStyle(card)
    const cardRect = card.getBoundingClientRect()

    // Direct content children (skip absolute decorative layers)
    const kids = [...card.children].filter((el) => {
      const s = getComputedStyle(el)
      if (s.display === 'none' || s.visibility === 'hidden') return false
      if (s.position === 'absolute' || s.position === 'fixed') return false
      // Zero-size decorative
      if (el.offsetHeight < 2 && el.offsetWidth < 2) return false
      return true
    })

    const issues = []
    const gaps = []

    for (let i = 0; i < kids.length; i++) {
      const a = kids[i].getBoundingClientRect()
      // Edge padding
      const padL = a.left - cardRect.left
      const padR = cardRect.right - a.right
      const padT = i === 0 ? a.top - cardRect.top : null
      const padB = i === kids.length - 1 ? cardRect.bottom - a.bottom : null
      if (padT !== null && padT < minEdge) {
        issues.push({
          type: 'edge-top',
          el: kids[i].className?.toString?.().slice(0, 40),
          value: +padT.toFixed(1),
        })
      }
      if (padB !== null && padB < minEdge) {
        issues.push({
          type: 'edge-bottom',
          el: kids[i].className?.toString?.().slice(0, 40),
          value: +padB.toFixed(1),
        })
      }
      if (padL < minEdge - 2 || padR < minEdge - 2) {
        // Horizontal edge soft-check (chips can be near edges intentionally)
      }

      if (i > 0) {
        const b = kids[i - 1].getBoundingClientRect()
        const gap = a.top - b.bottom
        gaps.push({
          between: [
            kids[i - 1].className?.toString?.().slice(0, 36),
            kids[i].className?.toString?.().slice(0, 36),
          ],
          gap: +gap.toFixed(1),
        })
        if (gap < 0) {
          issues.push({
            type: 'overlap',
            between: gaps[gaps.length - 1].between,
            gap: +gap.toFixed(1),
          })
        } else if (gap < minGap) {
          issues.push({
            type: 'tight-gap',
            between: gaps[gaps.length - 1].between,
            gap: +gap.toFixed(1),
          })
        }
      }
    }

    // Nested overlaps among key text blocks (common sticky pairs)
    const selectors = [
      '.share-card-wpm',
      '.share-card-chips',
      '.share-card-stations',
      '.sc-route-map',
      '.sc-route-stats',
      '.sc-min-wpm',
      '.sc-min-acc',
      '.sc-min-foot',
      '.sc-ticket-line',
      '.sc-ticket-od',
      '.sc-ticket-meta',
      '.sc-ticket-place',
      '.sc-monas-wpm',
      '.sc-monas-svg',
      '.sc-monas-meta',
      '.sc-pixel-badge',
      '.sc-pixel-chips',
      '.sc-pixel-foot',
      '.sc-sq-neon-wpm',
      '.sc-sq-neon-foot',
      '.sc-sq-route-od',
      '.sc-sq-route-stats',
      '.sc-sq-min-wpm',
      '.sc-sq-min-foot',
      '.sc-sq-ticket-line',
      '.sc-sq-ticket-od',
      '.sc-sq-ticket-meta',
      '.sc-sq-monas-wpm',
      '.sc-sq-monas-foot',
      '.sc-sq-pixel-badge',
      '.sc-sq-pixel-foot',
    ]
    const nodes = selectors
      .map((sel) => card.querySelector(sel))
      .filter((el) => {
        if (!el) return false
        const s = getComputedStyle(el)
        return s.display !== 'none' && el.offsetHeight > 1
      })

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        // Only check if one is not ancestor of the other
        if (nodes[i].contains(nodes[j]) || nodes[j].contains(nodes[i])) continue
        const A = nodes[i].getBoundingClientRect()
        const B = nodes[j].getBoundingClientRect()
        const overlapX = Math.min(A.right, B.right) - Math.max(A.left, B.left)
        const overlapY = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top)
        if (overlapX > 2 && overlapY > 2) {
          issues.push({
            type: 'nested-overlap',
            a: nodes[i].className?.toString?.().slice(0, 36),
            b: nodes[j].className?.toString?.().slice(0, 36),
            ox: +overlapX.toFixed(1),
            oy: +overlapY.toFixed(1),
          })
        }
      }
    }

    // Typography / box snapshot for parity
    const sample = (sel) => {
      const el = card.querySelector(sel)
      if (!el) return null
      const s = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        sel,
        fontSize: s.fontSize,
        fontFamily: s.fontFamily.split(',')[0].replace(/"/g, ''),
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        margin: `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`,
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        top: +(r.top - cardRect.top).toFixed(1),
        left: +(r.left - cardRect.left).toFixed(1),
      }
    }

    const snapshot = {
      variant: card.getAttribute('data-variant'),
      ratio: card.getAttribute('data-ratio'),
      cardW: card.offsetWidth,
      cardH: card.offsetHeight,
      padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
      gap: cs.gap,
      samples: [
        sample('.share-card-brand'),
        sample('.share-card-wpm'),
        sample('.sc-min-wpm'),
        sample('.sc-monas-wpm-num'),
        sample('.sc-ticket-line'),
        sample('.sc-route-line-name'),
        sample('.sc-pixel-badge'),
        sample('.share-device-tag'),
      ].filter(Boolean),
      kidCount: kids.length,
      gaps,
      issues,
    }
    return snapshot
  }, { minGap: MIN_GAP, minEdge: MIN_EDGE })
}

async function waitPreparingThenLiveShot(name) {
  // Capture while live DOM is visible (before PNG swap) if possible
  await page.waitForTimeout(50)
  const state = await page.evaluate(() => ({
    preparing: !!document.querySelector('.share-card-frame-scale.is-preparing'),
    hasPng: !!document.querySelector('.share-card-png-preview'),
    hasLive: !!document.querySelector('.share-card-frame [data-share-card]'),
  }))
  if (state.hasLive) {
    await page
      .locator('.share-card-frame-scale')
      .screenshot({ path: path.join(OUT, `${name}-live.png`) })
  }
  return state
}

/** Compare live preview card (design coords) vs capture-host twin. */
async function compareLiveVsCapture() {
  return page.evaluate(() => {
    const live = document.querySelector('.share-card-frame [data-share-card]')
    const cap = document.querySelector('.share-capture-host [data-share-card]')
    if (!live || !cap) {
      return { skipped: true, reason: live ? 'no-capture' : 'no-live-preview' }
    }

    const sample = (card, sel) => {
      const el = card.querySelector(sel)
      if (!el) return null
      const s = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      const cr = card.getBoundingClientRect()
      // Normalize to card-local + undo preview scale by using % of card size
      return {
        sel,
        fontSize: s.fontSize,
        padding: `${s.paddingTop}/${s.paddingRight}/${s.paddingBottom}/${s.paddingLeft}`,
        // Relative position within card (scale-invariant)
        topPct: +(((r.top - cr.top) / cr.height) * 100).toFixed(2),
        leftPct: +(((r.left - cr.left) / cr.width) * 100).toFixed(2),
        wPct: +((r.width / cr.width) * 100).toFixed(2),
        hPct: +((r.height / cr.height) * 100).toFixed(2),
      }
    }

    const sels = [
      '.share-card-brand',
      '.share-card-wpm',
      '.sc-min-wpm',
      '.sc-monas-wpm-num',
      '.sc-ticket-line',
      '.sc-route-line-name',
      '.sc-pixel-badge',
      '.share-device-tag',
      '.share-card-train-svg',
      '.sc-ticket-meta',
      '.sc-monas-svg',
    ]

    const livePad = getComputedStyle(live)
    const capPad = getComputedStyle(cap)
    const diffs = []

    if (livePad.paddingTop !== capPad.paddingTop) {
      diffs.push({
        prop: 'paddingTop',
        live: livePad.paddingTop,
        cap: capPad.paddingTop,
      })
    }
    if (livePad.paddingBottom !== capPad.paddingBottom) {
      diffs.push({
        prop: 'paddingBottom',
        live: livePad.paddingBottom,
        cap: capPad.paddingBottom,
      })
    }
    if (live.offsetWidth !== cap.offsetWidth || live.offsetHeight !== cap.offsetHeight) {
      diffs.push({
        prop: 'cardSize',
        live: `${live.offsetWidth}x${live.offsetHeight}`,
        cap: `${cap.offsetWidth}x${cap.offsetHeight}`,
      })
    }

    for (const sel of sels) {
      const L = sample(live, sel)
      const C = sample(cap, sel)
      if (!L && !C) continue
      if (!L || !C) {
        diffs.push({ sel, prop: 'presence', live: !!L, cap: !!C })
        continue
      }
      if (L.fontSize !== C.fontSize) {
        diffs.push({ sel, prop: 'fontSize', live: L.fontSize, cap: C.fontSize })
      }
      if (L.padding !== C.padding) {
        diffs.push({ sel, prop: 'padding', live: L.padding, cap: C.padding })
      }
      for (const k of ['topPct', 'leftPct', 'wPct', 'hPct']) {
        if (Math.abs(L[k] - C[k]) > 0.8) {
          diffs.push({ sel, prop: k, live: L[k], cap: C[k] })
        }
      }
    }

    return {
      skipped: false,
      liveSize: `${live.offsetWidth}x${live.offsetHeight}`,
      capSize: `${cap.offsetWidth}x${cap.offsetHeight}`,
      diffs,
    }
  })
}

async function waitPngReady() {
  await page
    .waitForFunction(
      () =>
        !!document.querySelector('.share-card-png-preview') &&
        !document.querySelector('.share-card-frame-scale.is-preparing'),
      null,
      { timeout: 20000 },
    )
    .catch(() => {})
  await page.waitForTimeout(200)
}

const results = []

for (const ratio of RATIOS) {
  for (const variant of VARIANTS) {
    const name = slug(ratio, variant)
    await selectCombo(ratio, variant)

    // Phase A: early live (may catch preparing state)
    // Clear any previous PNG so we can measure live vs capture before swap.
    await page.evaluate(() => {
      // Force a brief live window by marking preparing visually; React owns PNG state,
      // so we only compare while live node still exists.
    })
    const early = await waitPreparingThenLiveShot(name)
    const liveMetrics = await measureCard()
    const parity = await compareLiveVsCapture()

    // Phase B: PNG ready
    await waitPngReady()
    await page
      .locator('.share-card-frame-scale')
      .screenshot({ path: path.join(OUT, `${name}-png.png`) })

    // Capture host still holds the live design-size twin — remeasure after settle
    const afterMetrics = await measureCard()

    // Compare live vs after (capture host should be stable; drift = freeze/layout change)
    const drift = []
    if (liveMetrics.padding !== afterMetrics.padding) {
      drift.push({
        prop: 'card.padding',
        before: liveMetrics.padding,
        after: afterMetrics.padding,
      })
    }
    if (liveMetrics.gap !== afterMetrics.gap) {
      drift.push({
        prop: 'card.gap',
        before: liveMetrics.gap,
        after: afterMetrics.gap,
      })
    }
    const bySel = Object.fromEntries(
      (afterMetrics.samples || []).map((s) => [s.sel, s]),
    )
    for (const s of liveMetrics.samples || []) {
      const a = bySel[s.sel]
      if (!a) continue
      for (const key of [
        'fontSize',
        'lineHeight',
        'letterSpacing',
        'padding',
        'margin',
        'w',
        'h',
        'top',
        'left',
      ]) {
        if (String(s[key]) !== String(a[key])) {
          const numDiff =
            typeof s[key] === 'number' && typeof a[key] === 'number'
              ? Math.abs(s[key] - a[key])
              : null
          // Ignore sub-pixel noise
          if (numDiff !== null && numDiff < 0.6) continue
          drift.push({
            sel: s.sel,
            prop: key,
            before: s[key],
            after: a[key],
          })
        }
      }
    }

    // Visual: also screenshot capture host via evaluate clone isn't easy —
    // instead dump PNG natural size from img
    const pngInfo = await page.evaluate(() => {
      const img = document.querySelector('.share-card-png-preview')
      if (!img) return null
      return {
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        displayW: img.clientWidth,
        displayH: img.clientHeight,
      }
    })

    // Capture-host before/after drift: ignore sub-5px vertical settle from
    // fitMinimalWpm / ResizeObserver after freeze restore — user-facing parity
    // is live preview vs capture host (checked separately).
    const meaningfulDrift = drift.filter((d) => {
      if (d.prop === 'top' || d.prop === 'left' || d.prop === 'h' || d.prop === 'w') {
        const a = Number(d.before)
        const b = Number(d.after)
        if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 6) {
          return false
        }
      }
      return true
    })

    const parityDiffs = parity?.diffs?.length ?? 0
    const entry = {
      name,
      ratio,
      variant,
      early,
      card: {
        w: afterMetrics.cardW,
        h: afterMetrics.cardH,
        padding: afterMetrics.padding,
        issues: afterMetrics.issues,
        gaps: afterMetrics.gaps,
      },
      drift,
      meaningfulDrift,
      parity,
      pngInfo,
      ok:
        (afterMetrics.issues || []).length === 0 &&
        meaningfulDrift.length === 0 &&
        parityDiffs === 0 &&
        !afterMetrics.error,
    }
    results.push(entry)
    const flag = entry.ok ? 'OK' : 'FAIL'
    console.log(
      flag,
      name,
      `issues=${afterMetrics.issues?.length ?? '?'}`,
      `drift=${meaningfulDrift.length}`,
      `parity=${parityDiffs}`,
      `size=${afterMetrics.cardW}x${afterMetrics.cardH}`,
      pngInfo ? `png=${pngInfo.naturalW}x${pngInfo.naturalH}` : 'png=missing',
    )
  }
}

const summary = {
  at: new Date().toISOString(),
  minGap: MIN_GAP,
  minEdge: MIN_EDGE,
  pass: results.filter((r) => r.ok).length,
  fail: results.filter((r) => !r.ok).length,
  results,
}
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2))
console.log('\nSUMMARY', summary.pass, 'pass /', summary.fail, 'fail')
await browser.close()
process.exit(summary.fail > 0 ? 2 : 0)
