import { describe, expect, it } from 'vitest'
import { contrastRatio, mapStrokeColor } from './railMapContrast'

describe('contrastRatio', () => {
  it('is high for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeGreaterThan(20)
  })
})

describe('mapStrokeColor', () => {
  it('keeps a dark brand on light land', () => {
    const out = mapStrokeColor('#AD1457', '#F7F7F5')
    expect(contrastRatio(out, '#F7F7F5')).toBeGreaterThanOrEqual(3)
  })

  it('darkens a light brand that fails AA non-text', () => {
    const out = mapStrokeColor('#F9A825', '#F7F7F5')
    expect(contrastRatio(out, '#F7F7F5')).toBeGreaterThanOrEqual(3)
  })
})
