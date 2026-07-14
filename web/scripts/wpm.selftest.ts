import assert from 'node:assert/strict'
import {
  creditedWordChars,
  correctPrefixChars,
  isStationCorrect,
  calcWpm,
} from '../src/lib/wpm.ts'

function check(name: string, fn: () => void) {
  try {
    fn()
    console.log(`ok  ${name}`)
  } catch (err) {
    console.error(`fail  ${name}`)
    throw err
  }
}

check('perfect multi-word station banks full length', () => {
  assert.equal(creditedWordChars('Jakarta Kota', 'Jakarta Kota'), 12)
  assert.equal(isStationCorrect('Jakarta Kota', 'Jakarta Kota'), true)
})

check('typo in middle word excludes only that word', () => {
  assert.equal(creditedWordChars('A Diesel B', 'A Diesal B'), 3)
})

check('typo in second of three words excludes only that word', () => {
  const target = 'Foo Diesel Bar'
  const typed = 'Foo Diesal Bar'
  // Foo(3) + space(1) + Bar(3) = 7; Diesel/Diesal excluded
  assert.equal(creditedWordChars(target, typed), 7)
  assert.equal(isStationCorrect(target, typed), false)
})

check('typo in first word still credits later correct words', () => {
  // Same length (substitution): positions of "Kota" still align
  assert.equal(creditedWordChars('Jakarta Kota', 'Xakarta Kota'), 4)
})

check('typo in last word credits earlier correct word + space', () => {
  assert.equal(creditedWordChars('Jakarta Kota', 'Jakarta Kpta'), 8)
})

check('single-word typo banks zero', () => {
  assert.equal(creditedWordChars('Jayakarta', 'Jayakarka'), 0)
})

check('case insensitive', () => {
  assert.equal(creditedWordChars('Jakarta Kota', 'jakarta kota'), 12)
})

check('live: correct prefix of current word after completed words', () => {
  assert.equal(creditedWordChars('Jakarta Kota', 'Jakarta Ko'), 10)
})

check('live: typo in current word keeps prior word credit', () => {
  assert.equal(creditedWordChars('Jakarta Kota', 'Jakarta Kx'), 8)
})

check('live: typo early in first word banks zero until fixed', () => {
  assert.equal(creditedWordChars('Jakarta Kota', 'Jakr'), 0)
})

check('correctPrefixChars aliases creditedWordChars', () => {
  assert.equal(
    correctPrefixChars('A Diesel B', 'A Diesal B'),
    creditedWordChars('A Diesel B', 'A Diesal B'),
  )
})

check('calcWpm still uses char/5 formula', () => {
  assert.equal(calcWpm(100, 60_000), 20)
})

console.log('\nAll wpm word-credit checks passed.')
