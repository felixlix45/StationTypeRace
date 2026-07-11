import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, KeyboardEvent } from 'react'
import {
  DroneBackdrop,
  pickRandomLandmark,
  type LandmarkId,
} from './components/DroneBackdrop'
import { ResultsDiagnostics } from './components/ResultsDiagnostics'
import {
  ShareCard,
  SHARE_CARD_VARIANTS,
  type ShareCardVariant,
} from './components/ShareCard'
import { StationProgressRail } from './components/StationProgressRail'
import {
  LINE_CATEGORIES,
  linesByCategory,
  pickRandomLine,
  type StationLine,
} from './data/stations'
import {
  buildStationSample,
  countPerfectStations,
  type KeystrokeBaseline,
  type StationSample,
} from './lib/raceStats'
import {
  captureShareCardPng,
  detectRaceDevice,
  downloadDataUrl,
  shareFilename,
  shareResultImage,
  type RaceDevice,
  type ShareResult,
} from './lib/shareCard'
import {
  calcAccuracy,
  calcWpm,
  correctPrefixChars,
  formatAccuracy,
  formatWpm,
  isStationCorrect,
} from './lib/wpm'
import './App.css'

type Phase = 'idle' | 'racing' | 'finished'

const SLIDE_MS = 520
const LINE_GROUPS = linesByCategory()

function lineStyle(color: string): CSSProperties {
  return { ['--line' as string]: color } as CSSProperties
}

/** Split "Origin → Terminus" for the results route ribbon. */
function splitRoute(route: string): { origin: string; terminus: string } {
  const [origin, terminus] = route.split(/\s*→\s*/)
  return { origin, terminus: terminus ?? route }
}

type RaceState = {
  line: StationLine
  stationIndex: number
  input: string
  startedAt: number | null
  /** First keystroke time for the current station (typing-time clock). */
  stationStartedAt: number | null
  /** Keystroke tallies at the start of the current station. */
  stationKeystrokeBaseline: KeystrokeBaseline
  /** Banked chars from fully correct stations only (Monkeytype WPM numerator). */
  correctChars: number
  correctKeystrokes: number
  incorrectKeystrokes: number
  stationSamples: StationSample[]
  /** Snapshotted at race start — mobile vs computer for the share card. */
  device: RaceDevice
}

type SlideVisual = {
  outgoing: string
  key: number
}

function createRace(line?: StationLine): RaceState {
  return {
    line: line ?? pickRandomLine(),
    stationIndex: 0,
    input: '',
    startedAt: null,
    stationStartedAt: null,
    stationKeystrokeBaseline: { correct: 0, incorrect: 0 },
    correctChars: 0,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    stationSamples: [],
    device: detectRaceDevice(),
  }
}

function StationChars({ word, typed }: { word: string; typed: string }) {
  const t = typed.toLowerCase()
  const w = word.toLowerCase()
  return (
    <>
      {word.split('').map((char, i) => {
        let cls = 'pending'
        if (i < typed.length) cls = t[i] === w[i] ? 'ok' : 'bad'
        return (
          <span key={`${i}-${char}`} className={cls}>
            {char === ' ' ? '\u00a0' : char}
          </span>
        )
      })}
    </>
  )
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [race, setRace] = useState<RaceState | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [finalWpm, setFinalWpm] = useState(0)
  const [finalRawWpm, setFinalRawWpm] = useState(0)
  const [finalAccuracy, setFinalAccuracy] = useState(100)
  const [elapsedMs, setElapsedMs] = useState(0)
  /** Snapshot at finish — survives any stale setRace after the run ends. */
  const [finishedSamples, setFinishedSamples] = useState<StationSample[]>([])
  const [slide, setSlide] = useState<SlideVisual | null>(null)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareNote, setShareNote] = useState<string | null>(null)
  const [shareVariant, setShareVariant] = useState<ShareCardVariant>('neon')
  const [landmarkId, setLandmarkId] = useState<LandmarkId | null>(null)
  /** Blocks mobile Contact/Autofill heuristics until the field is activated. */
  const [autofillGuard, setAutofillGuard] = useState(true)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const shareCardRef = useRef<HTMLDivElement>(null)
  const slideTimer = useRef<number | null>(null)
  /** Layout height before the soft keyboard — used to detect kb open on mobile. */
  const raceViewportBaseline = useRef<number | null>(null)
  /** Sync mirrors — Space/input can race; closures alone drop stationSamples. */
  const raceRef = useRef<RaceState | null>(null)
  const phaseRef = useRef<Phase>('idle')

  function commitRace(next: RaceState | null) {
    raceRef.current = next
    setRace(next)
  }

  function commitPhase(next: Phase) {
    phaseRef.current = next
    setPhase(next)
  }

  useEffect(() => {
    if (phase !== 'racing') return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'racing') return
    // Phones: stay readOnly until a real tap so Contact/Autofill never classifies
    // an editable name-like field on autofocus. Desktop: unlock and focus now.
    const coarse =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches
    if (coarse) {
      setAutofillGuard(true)
      return
    }
    setAutofillGuard(false)
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'racing' || autofillGuard) return
    inputRef.current?.focus({ preventScroll: true })
  }, [phase, race?.stationIndex, autofillGuard])

  /** Keep the fixed line map + type dock above the soft keyboard. */
  useEffect(() => {
    if (phase !== 'racing') {
      document.documentElement.style.removeProperty('--kb-inset')
      raceViewportBaseline.current = null
      setKeyboardOpen(false)
      return
    }

    const root = document.documentElement
    // Capture pre-keyboard layout height once per race (before first focus).
    if (raceViewportBaseline.current === null) {
      raceViewportBaseline.current = window.innerHeight
    }

    const syncKeyboardInset = () => {
      const vv = window.visualViewport
      const baseline = raceViewportBaseline.current ?? window.innerHeight
      // Overlay keyboards (iOS): gap between layout viewport and visual viewport.
      const overlayInset = vv
        ? Math.max(0, window.innerHeight - (vv.height + vv.offsetTop))
        : 0
      // resizes-content (Android Chrome): layout height shrinks — do NOT add that
      // into --kb-inset or fixed bottom docks jump to the top of the screen.
      const resizedInset = Math.max(0, baseline - window.innerHeight)
      root.style.setProperty('--kb-inset', `${Math.round(overlayInset)}px`)
      setKeyboardOpen(overlayInset > 120 || resizedInset > 120)
    }

    syncKeyboardInset()
    const vv = window.visualViewport
    vv?.addEventListener('resize', syncKeyboardInset)
    vv?.addEventListener('scroll', syncKeyboardInset)
    window.addEventListener('resize', syncKeyboardInset)
    return () => {
      vv?.removeEventListener('resize', syncKeyboardInset)
      vv?.removeEventListener('scroll', syncKeyboardInset)
      window.removeEventListener('resize', syncKeyboardInset)
      root.style.removeProperty('--kb-inset')
      setKeyboardOpen(false)
    }
  }, [phase])

  function unlockPromptField(el?: HTMLInputElement | null) {
    if (el) el.readOnly = false
    setAutofillGuard(false)
    window.requestAnimationFrame(() => {
      el?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    })
  }

  /** When the keyboard docks the type field, keep the station prompt above it. */
  useEffect(() => {
    if (phase !== 'racing' || !keyboardOpen) return
    const stage = document.querySelector('.station-stage')
    stage?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' })
  }, [phase, keyboardOpen, race?.stationIndex])

  useEffect(() => {
    return () => {
      if (slideTimer.current !== null) window.clearTimeout(slideTimer.current)
    }
  }, [])

  function clearSlideTimer() {
    if (slideTimer.current !== null) {
      window.clearTimeout(slideTimer.current)
      slideTimer.current = null
    }
  }

  function playSlide(outgoing: string) {
    clearSlideTimer()
    setSlide({ outgoing, key: Date.now() })
    slideTimer.current = window.setTimeout(() => {
      setSlide(null)
      slideTimer.current = null
    }, SLIDE_MS)
  }

  function goHome() {
    clearSlideTimer()
    setSlide(null)
    commitRace(null)
    setFinalWpm(0)
    setFinalRawWpm(0)
    setFinalAccuracy(100)
    setElapsedMs(0)
    setFinishedSamples([])
    setShareNote(null)
    setLandmarkId(null)
    commitPhase('idle')
  }

  function startRace(line?: StationLine) {
    clearSlideTimer()
    setSlide(null)
    commitRace(createRace(line))
    setFinalWpm(0)
    setFinalRawWpm(0)
    setFinalAccuracy(100)
    setElapsedMs(0)
    setFinishedSamples([])
    setShareNote(null)
    setLandmarkId(pickRandomLandmark(landmarkId).id)
    commitPhase('racing')
    setNow(Date.now())
  }

  function restartSameLine() {
    if (!race) {
      startRace()
      return
    }
    startRace(race.line)
  }

  function startRandomLine() {
    startRace()
  }

  function finishRace(state: RaceState, endedAt: number) {
    clearSlideTimer()
    setSlide(null)
    const elapsed = state.startedAt ? endedAt - state.startedAt : 0
    const rawChars = state.correctKeystrokes + state.incorrectKeystrokes
    setFinalWpm(calcWpm(state.correctChars, elapsed))
    setFinalRawWpm(calcWpm(rawChars, elapsed))
    setFinalAccuracy(
      calcAccuracy(state.correctKeystrokes, state.incorrectKeystrokes),
    )
    setElapsedMs(elapsed)
    setFinishedSamples(state.stationSamples)
    setShareNote(null)
    commitRace(state)
    commitPhase('finished')
  }

  /** Bank the current station sample and move the caret to the next stop. */
  function commitStationAdvance(
    state: RaceState,
    endedAt: number,
  ): RaceState {
    const target = state.line.stations[state.stationIndex]!
    const perfect = isStationCorrect(target, state.input)
    const stationStartedAt =
      state.stationStartedAt ?? state.startedAt ?? endedAt
    const sample = buildStationSample({
      index: state.stationIndex,
      name: target,
      target,
      perfect,
      startedAt: stationStartedAt,
      endedAt,
      correctKeystrokes: state.correctKeystrokes,
      incorrectKeystrokes: state.incorrectKeystrokes,
      baseline: state.stationKeystrokeBaseline,
    })

    return {
      ...state,
      input: '',
      correctChars: state.correctChars + (perfect ? target.length : 0),
      stationIndex: state.stationIndex + 1,
      stationSamples: [...state.stationSamples, sample],
      stationStartedAt: null,
      stationKeystrokeBaseline: {
        correct: state.correctKeystrokes,
        incorrect: state.incorrectKeystrokes,
      },
    }
  }

  function advanceStation() {
    const current = raceRef.current
    if (!current || phaseRef.current !== 'racing') return

    const target = current.line.stations[current.stationIndex]!
    // Advance when length is filled (wrong chars OK); WPM only banks perfect stations
    if (current.input.length !== target.length) return

    const endedAt = Date.now()
    const nextState = commitStationAdvance(current, endedAt)

    if (nextState.stationIndex >= current.line.stations.length) {
      finishRace(nextState, endedAt)
      return
    }

    playSlide(target)
    commitRace(nextState)
  }

  function onInputChange(value: string) {
    const current = raceRef.current
    if (!current || phaseRef.current !== 'racing') return

    const target = current.line.stations[current.stationIndex]!
    const prev = current.input

    // Soft keyboards often insert Space via input only (no keydown). When the
    // station is already full-length, treat that Space as advance — do not
    // count it as a keystroke error (slice would otherwise drop it silently).
    if (
      prev.length === target.length &&
      (value.length > target.length || value.endsWith(' '))
    ) {
      advanceStation()
      return
    }

    const nowTs = Date.now()
    const startedAt = current.startedAt ?? nowTs
    const stationStartedAt = current.stationStartedAt ?? nowTs
    const nextInput = value.slice(0, target.length)

    let correctKeystrokes = current.correctKeystrokes
    let incorrectKeystrokes = current.incorrectKeystrokes

    // New character attempts only — backspace does not change accuracy tallies
    if (nextInput.length > prev.length) {
      const expected = target.toLowerCase()
      for (let i = prev.length; i < nextInput.length; i += 1) {
        if (nextInput[i]!.toLowerCase() === expected[i]) {
          correctKeystrokes += 1
        } else {
          incorrectKeystrokes += 1
        }
      }
    }

    const updated: RaceState = {
      ...current,
      input: nextInput,
      startedAt,
      stationStartedAt,
      correctKeystrokes,
      incorrectKeystrokes,
    }

    const isLast =
      current.stationIndex === current.line.stations.length - 1
    // Last station: perfect match at full length finishes without Space
    if (isLast && isStationCorrect(target, nextInput)) {
      const endedAt = Date.now()
      finishRace(commitStationAdvance(updated, endedAt), endedAt)
      return
    }

    commitRace(updated)
  }

  /** Soft-keyboard Space/Enter — beforeinput fires when keydown often does not. */
  function onStationBeforeInput(e: FormEvent<HTMLInputElement>) {
    const current = raceRef.current
    if (!current || phaseRef.current !== 'racing') return

    const target = current.line.stations[current.stationIndex]!
    const canAdvance = current.input.length === target.length
    if (!canAdvance) return

    const ne = e.nativeEvent as InputEvent
    const insertingSpace =
      ne.inputType === 'insertText' && ne.data === ' '
    const insertingBreak =
      ne.inputType === 'insertLineBreak' ||
      ne.inputType === 'insertParagraph'
    const isLast =
      current.stationIndex === current.line.stations.length - 1

    if (insertingSpace || (insertingBreak && isLast)) {
      e.preventDefault()
      advanceStation()
    }
  }

  function onStationKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const current = raceRef.current
    if (!current || phaseRef.current !== 'racing') return

    const target = current.line.stations[current.stationIndex]!
    const canAdvance = current.input.length === target.length
    const isLast =
      current.stationIndex === current.line.stations.length - 1

    if (e.key === 'Escape') {
      e.preventDefault()
      goHome()
      return
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      startRandomLine()
      return
    }

    if (e.key === 'r' && e.altKey) {
      e.preventDefault()
      restartSameLine()
      return
    }

    // Space advances any full station; Enter also finishes last station
    if (e.key === ' ' && canAdvance) {
      e.preventDefault()
      advanceStation()
      return
    }

    if (e.key === 'Enter' && isLast && canAdvance) {
      e.preventDefault()
      advanceStation()
    }
  }

  async function withShareCard(
    action: (dataUrl: string, result: ShareResult) => Promise<void>,
  ) {
    if (!race || !shareCardRef.current || shareBusy) return
    const result: ShareResult = {
      line: race.line,
      wpm: finalWpm,
      rawWpm: finalRawWpm,
      accuracy: finalAccuracy,
      correctChars: race.correctChars,
      elapsedMs,
      device: race.device,
    }
    setShareBusy(true)
    setShareNote(null)
    try {
      const dataUrl = await captureShareCardPng(shareCardRef.current)
      await action(dataUrl, result)
    } catch {
      setShareNote('Could not create image — try again')
    } finally {
      setShareBusy(false)
    }
  }

  function saveShareImage() {
    void withShareCard(async (dataUrl, result) => {
      downloadDataUrl(dataUrl, shareFilename(result.line.id, result.wpm))
      setShareNote('Image saved')
    })
  }

  function shareShareImage() {
    void withShareCard(async (dataUrl, result) => {
      const outcome = await shareResultImage(
        result,
        dataUrl,
        shareFilename(result.line.id, result.wpm),
      )
      setShareNote(outcome === 'shared' ? 'Shared' : 'Image saved')
    })
  }

  const currentStation = race?.line.stations[race.stationIndex] ?? ''
  const nextStation =
    race && race.stationIndex + 1 < race.line.stations.length
      ? race.line.stations[race.stationIndex + 1]!
      : null

  const stationComplete =
    phase === 'racing' &&
    !!race &&
    race.input.length === currentStation.length
  const stationPerfect =
    stationComplete && !!race && isStationCorrect(currentStation, race.input)
  const isLastStation =
    !!race && race.stationIndex === race.line.stations.length - 1

  const liveElapsed =
    race?.startedAt && phase === 'racing' ? Math.max(now - race.startedAt, 1) : 0
  const liveCorrect =
    (race?.correctChars ?? 0) +
    (phase === 'racing' && race
      ? correctPrefixChars(currentStation, race.input)
      : 0)
  const liveRawChars =
    phase === 'racing' && race
      ? race.correctKeystrokes + race.incorrectKeystrokes
      : 0
  const liveWpm = calcWpm(liveCorrect, liveElapsed)
  const liveRawWpm = calcWpm(liveRawChars, liveElapsed)
  const liveAccuracy =
    phase === 'racing' && race
      ? calcAccuracy(race.correctKeystrokes, race.incorrectKeystrokes)
      : 100
  const progress =
    race && race.line.stations.length > 0
      ? Math.min(race.stationIndex / race.line.stations.length, 1)
      : 0

  const isSliding = slide !== null

  const shareResult: ShareResult | null =
    race && phase === 'finished'
      ? {
          line: race.line,
          wpm: finalWpm,
          rawWpm: finalRawWpm,
          accuracy: finalAccuracy,
          correctChars: race.correctChars,
          elapsedMs,
          device: race.device,
        }
      : null

  const finishedRoute = race ? splitRoute(race.line.route) : null

  return (
    <div
      className="app"
      data-phase={phase}
      data-kb={phase === 'racing' && keyboardOpen ? 'open' : 'closed'}
    >
      <DroneBackdrop
        mode={phase === 'idle' ? 'orbit' : 'zoom'}
        landmarkId={landmarkId}
        showCredit
      />
      <div className="track-glow" aria-hidden="true" />

      {phase === 'idle' && (
        <section className="hero">
          <p className="system-tag">Jakarta rail · typing race</p>
          <h1 className="brand">StationTypeRace</h1>
          <p className="lede">
            Type every stop on a KRL, MRT, or LRT line — one station at a time.
          </p>
          <div className="cta-row">
            <button
              type="button"
              className="btn primary"
              onClick={startRandomLine}
            >
              Random line
            </button>
          </div>

          <div className="line-picker">
            <p className="line-picker-label">Or choose a line</p>
            <div className="line-picker-columns">
              {LINE_CATEGORIES.map((category) => {
                const lines = LINE_GROUPS[category]
                if (lines.length === 0) return null
                return (
                  <div key={category} className="line-group">
                    <h2 className="line-group-title">{category}</h2>
                    <ul className="line-group-list">
                      {lines.map((line) => (
                        <li key={line.id}>
                          <button
                            type="button"
                            className="line-pick"
                            style={lineStyle(line.color)}
                            onClick={() => startRace(line)}
                          >
                            <span className="line-pick-dot" aria-hidden="true" />
                          <span className="line-pick-body">
                            <span className="line-pick-name">{line.name}</span>
                            <span className="line-pick-route">{line.route}</span>
                            <span className="line-pick-meta">
                              {line.stations.length} stops
                            </span>
                          </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {phase === 'racing' && race && (
        <>
          <section className="race" style={lineStyle(race.line.color)}>
            <header className="race-top">
              <div className="line-meta">
                <span className="line-dot" />
                <div>
                  <p className="line-system">{race.line.system}</p>
                  <h2 className="line-name">{race.line.name}</h2>
                  <p className="line-route">{race.line.route}</p>
                </div>
              </div>
              <div className="stat-block" aria-live="polite">
                <span className="stat-label">WPM</span>
                <span className="stat-value">{formatWpm(liveWpm)}</span>
                <span className="stat-sub">
                  {formatAccuracy(liveAccuracy)}
                  <span className="stat-sub-sep" aria-hidden="true">
                    ·
                  </span>
                  {formatWpm(liveRawWpm)} raw
                </span>
              </div>
            </header>

            <div className="race-controls" role="toolbar" aria-label="Session controls">
              <button
                type="button"
                className="btn ghost btn-compact"
                onClick={goHome}
                title="Esc"
              >
                Home
                <kbd className="key-hint">Esc</kbd>
              </button>
              <button
                type="button"
                className="btn ghost btn-compact"
                onClick={restartSameLine}
                title="Alt+R"
              >
                Restart
                <kbd className="key-hint">Alt+R</kbd>
              </button>
              <button
                type="button"
                className="btn ghost btn-compact"
                onClick={startRandomLine}
                title="Ctrl+Enter"
              >
                New line
                <kbd className="key-hint">Ctrl+↵</kbd>
              </button>
            </div>

            <div
              className="progress-rail"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="stop-count">
              Stop {Math.min(race.stationIndex + 1, race.line.stations.length)} of{' '}
              {race.line.stations.length}
            </p>

            <p className="prompt-label">
              {stationComplete
                ? nextStation
                  ? 'Press Space for next station'
                  : stationPerfect
                    ? 'Finishing…'
                    : 'Press Space or Enter to finish'
                : 'Type this station'}
            </p>

            <div
              className={['station-stage', isSliding ? 'is-sliding' : '']
                .filter(Boolean)
                .join(' ')}
              aria-live="polite"
            >
              {slide && (
                <div
                  key={`out-${slide.key}`}
                  className="station-slide is-outgoing"
                  aria-hidden="true"
                >
                  <p className="prompt-word">
                    <StationChars word={slide.outgoing} typed={slide.outgoing} />
                  </p>
                </div>
              )}
              <div
                key={`cur-${race.stationIndex}`}
                className={[
                  'station-slide',
                  'is-current',
                  isSliding ? 'is-entering' : '',
                  stationComplete ? 'is-ready' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <p className="prompt-word">
                  <StationChars word={currentStation} typed={race.input} />
                </p>
              </div>
              {nextStation && (
                <div
                  key={`next-${race.stationIndex}`}
                  className="station-slide is-next"
                  aria-hidden="true"
                >
                  <p className="prompt-word preview">{nextStation}</p>
                </div>
              )}
            </div>

            <div className="race-type-dock">
              <form
                className="station-type-form"
                autoComplete="off"
                onSubmit={(e) => e.preventDefault()}
              >
                {/*
                  Safari Contact AutoFill + Android Autofill classify bare text
                  inputs as name/address fields. one-time-code still invites the
                  Autofill chrome. Decoy name/email fields absorb heuristics;
                  the real prompt stays autocomplete=off + readOnly until focus.
                */}
                <div className="autofill-decoy" aria-hidden="true">
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    tabIndex={-1}
                    defaultValue=""
                    readOnly
                  />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    tabIndex={-1}
                    defaultValue=""
                    readOnly
                  />
                </div>
                <label className="sr-only" htmlFor="station-input">
                  Type the stop shown above
                </label>
                <input
                  id="station-input"
                  ref={inputRef}
                  className="station-input"
                  type="search"
                  name="str-x7k2-prompt"
                  value={race.input}
                  readOnly={autofillGuard}
                  onChange={(e) => onInputChange(e.target.value)}
                  onBeforeInput={onStationBeforeInput}
                  onKeyDown={onStationKeyDown}
                  onPointerDown={(e) => unlockPromptField(e.currentTarget)}
                  // Do not unlock on focus alone — programmatic focus must stay readOnly
                  // on phones or Safari Contact AutoFill still attaches.
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  inputMode="text"
                  enterKeyHint="next"
                  aria-autocomplete="none"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  data-bwignore="true"
                  placeholder={
                    stationComplete
                      ? isLastStation
                        ? stationPerfect
                          ? 'Finishing…'
                          : 'Space or Enter to finish…'
                        : 'Space to continue…'
                      : autofillGuard
                        ? 'Tap to type…'
                        : 'Start typing…'
                  }
                />
              </form>
              {stationComplete && !(isLastStation && stationPerfect) && (
                <p className="space-hint" role="status">
                  {isLastStation ? (
                    <>
                      <kbd className="key-hint">Space</kbd>
                      {' or '}
                      <kbd className="key-hint">Enter</kbd>
                      {' finish line'}
                    </>
                  ) : (
                    <>
                      <kbd className="key-hint">Space</kbd>
                      {' next station'}
                    </>
                  )}
                </p>
              )}
            </div>
          </section>

          <StationProgressRail
            stations={race.line.stations}
            currentIndex={race.stationIndex}
            typedLength={race.input.length}
            color={race.line.color}
          />
        </>
      )}

      {phase === 'finished' && race && shareResult && (
        <section className="results" style={lineStyle(race.line.color)}>
          <header className="results-hero">
            <p className="results-kicker">
              <span className="results-kicker-dot" aria-hidden="true" />
              Line cleared
            </p>
            <p className="results-brand" aria-label="StationType Race">
              <span className="results-brand-primary">StationType</span>
              <span className="results-brand-accent">Race</span>
            </p>
            <div
              className="results-line-id"
              role="group"
              aria-label={`${race.line.system} ${race.line.name}, ${race.line.route}`}
            >
              <div className="results-line-id-head">
                <span className="results-line-system">{race.line.system}</span>
                <h2 className="results-line-name">{race.line.name}</h2>
              </div>
              <span className="results-line-rule" aria-hidden="true" />
              {finishedRoute && (
                <p className="results-line-route">
                  <span className="results-line-endpoint results-line-origin">
                    {finishedRoute.origin}
                  </span>
                  <span className="results-line-path" aria-hidden="true">
                    <span className="results-line-path-track" />
                    <span className="results-line-path-arrow">→</span>
                  </span>
                  <span className="results-line-endpoint results-line-terminus">
                    {finishedRoute.terminus}
                  </span>
                </p>
              )}
            </div>
          </header>

          <div className="results-board">
            <div className="results-share-col">
              <div
                className="share-style-picker"
                role="radiogroup"
                aria-label="Share card style"
              >
                {SHARE_CARD_VARIANTS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={shareVariant === opt.id}
                    className={
                      shareVariant === opt.id
                        ? 'share-style-opt is-active'
                        : 'share-style-opt'
                    }
                    onClick={() => setShareVariant(opt.id)}
                  >
                    <span className="share-style-opt-label">{opt.label}</span>
                    <span className="share-style-opt-blurb">{opt.blurb}</span>
                  </button>
                ))}
              </div>

              <div className="share-card-frame">
                <ShareCard
                  ref={shareCardRef}
                  result={shareResult}
                  variant={shareVariant}
                />
              </div>

              <div className="cta-row share-actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={saveShareImage}
                  disabled={shareBusy}
                >
                  {shareBusy ? 'Preparing…' : 'Save image'}
                </button>
                <button
                  type="button"
                  className="btn neon"
                  onClick={shareShareImage}
                  disabled={shareBusy}
                >
                  Share
                </button>
              </div>
              {shareNote && (
                <p className="share-note" role="status">
                  {shareNote}
                </p>
              )}
            </div>

            <ResultsDiagnostics
              wpm={finalWpm}
              rawWpm={finalRawWpm}
              accuracy={finalAccuracy}
              elapsedMs={elapsedMs}
              incorrectKeystrokes={race.incorrectKeystrokes}
              perfectStations={countPerfectStations(finishedSamples)}
              totalStations={race.line.stations.length}
              samples={finishedSamples}
            />
          </div>

          <div className="cta-row results-nav">
            <button
              type="button"
              className="btn primary"
              onClick={restartSameLine}
            >
              Retry same line
            </button>
            <button type="button" className="btn ghost" onClick={startRandomLine}>
              Next random line
            </button>
            <button type="button" className="btn ghost" onClick={goHome}>
              Back
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
