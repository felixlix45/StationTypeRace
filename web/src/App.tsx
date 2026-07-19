import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, KeyboardEvent } from 'react'
import { RailMapBackdrop } from './components/RailMapBackdrop'
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
  openShareScreenshotPage,
  shareExportSize,
  shareFilename,
  shareResultImage,
  SHARE_CARD_RATIOS,
  type RaceDevice,
  type ShareCardRatio,
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
  const [shareRatio, setShareRatio] = useState<ShareCardRatio>('story')
  /** Pre-rendered PNG for the visible preview — same bytes Save/Share use. */
  const [sharePngDataUrl, setSharePngDataUrl] = useState<string | null>(null)
  const [sharePngPreparing, setSharePngPreparing] = useState(false)
  /** Idle picker hover/focus — highlights that line on the zoomed-out map. */
  const [hoverLineId, setHoverLineId] = useState<string | null>(null)
  /** Blocks mobile Contact/Autofill heuristics until the field is activated. */
  const [autofillGuard, setAutofillGuard] = useState(true)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  /** Live preview card (scaled) — fallback while PNG is preparing. */
  const shareCardRef = useRef<HTMLDivElement>(null)
  /** Offscreen design-size twin — source of truth for Save / Share PNG. */
  const shareCaptureRef = useRef<HTMLDivElement>(null)
  /** Bumps to cancel in-flight preview captures when variant/result changes. */
  const sharePngGenRef = useRef(0)
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

  /** Sync visual-viewport metrics so iOS overlay keyboards keep the typing UI in view. */
  const syncKeyboardInsetRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (phase !== 'racing') {
      const root = document.documentElement
      root.style.removeProperty('--kb-inset')
      root.style.removeProperty('--vv-top')
      root.style.removeProperty('--vv-height')
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
      const vvTop = vv?.offsetTop ?? 0
      const rawVvHeight = vv?.height ?? window.innerHeight
      // Overlay keyboards (iOS Safari/Chrome): layout viewport stays tall; visual
      // viewport shrinks. Gap below the visual viewport is the keyboard chrome.
      const overlayInset = vv
        ? Math.max(0, window.innerHeight - (rawVvHeight + vvTop))
        : 0
      // resizes-content (Android Chrome): layout height shrinks — do NOT add that
      // into --kb-inset or fixed bottom docks jump to the top of the screen.
      const resizedInset = Math.max(0, baseline - window.innerHeight)
      // Visible typing shell: use visual viewport on overlay keyboards; when the
      // layout viewport itself resized (Android), prefer innerHeight so a stale
      // visualViewport cannot leave the shell taller than the screen.
      const shellHeight =
        overlayInset > 40 ? rawVvHeight : window.innerHeight
      const shellTop = overlayInset > 40 ? vvTop : 0
      // Set on <html> — .app must NOT redefine --kb-inset or these are ignored.
      root.style.setProperty('--kb-inset', `${Math.round(overlayInset)}px`)
      root.style.setProperty('--vv-top', `${Math.round(shellTop)}px`)
      root.style.setProperty('--vv-height', `${Math.round(shellHeight)}px`)
      setKeyboardOpen(overlayInset > 120 || resizedInset > 120)
    }

    syncKeyboardInsetRef.current = syncKeyboardInset
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
      root.style.removeProperty('--vv-top')
      root.style.removeProperty('--vv-height')
      setKeyboardOpen(false)
    }
  }, [phase])

  function unlockPromptField(el?: HTMLInputElement | null) {
    if (el) el.readOnly = false
    setAutofillGuard(false)
    // Do not scrollIntoView — on iOS that pans the visual viewport and splits
    // the station prompt (top) from the docked input (bottom).
    // Re-measure after the soft-keyboard animation (iOS ~250–350ms).
    window.setTimeout(() => syncKeyboardInsetRef.current(), 50)
    window.setTimeout(() => syncKeyboardInsetRef.current(), 350)
  }

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
    commitPhase('idle')
  }

  function startRace(line?: StationLine) {
    clearSlideTimer()
    setSlide(null)
    const next = createRace(line)
    commitRace(next)
    setHoverLineId(null)
    setFinalWpm(0)
    setFinalRawWpm(0)
    setFinalAccuracy(100)
    setElapsedMs(0)
    setFinishedSamples([])
    setShareNote(null)
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
    const stationStartedAt =
      state.stationStartedAt ?? state.startedAt ?? endedAt
    const sample = buildStationSample({
      index: state.stationIndex,
      name: target,
      target,
      typed: state.input,
      startedAt: stationStartedAt,
      endedAt,
      correctKeystrokes: state.correctKeystrokes,
      incorrectKeystrokes: state.incorrectKeystrokes,
      baseline: state.stationKeystrokeBaseline,
    })

    return {
      ...state,
      input: '',
      correctChars: state.correctChars + sample.creditedChars,
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
    // Advance when length is filled (wrong chars OK); WPM banks per correct word
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

    // Safety net when beforeinput is non-cancelable (some Android IMEs):
    // suggestion / swipe / paste can dump many chars in one change — keep at
    // most one new character so the race stays keystroke-by-keystroke.
    let accepted = value
    if (accepted.length > prev.length + 1) {
      const prefixOk = accepted.startsWith(prev)
      accepted = prefixOk
        ? prev + accepted.slice(prev.length, prev.length + 1)
        : prev
    }
    const nextInput = accepted.slice(0, target.length)

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
    // IME may have already written bulk text into the DOM before React commits.
    if (inputRef.current && inputRef.current.value !== nextInput) {
      inputRef.current.value = nextInput
    }
  }

  /**
   * Native `beforeinput` (not React's onBeforeInput — that maps to keypress/paste
   * only). Blocks suggestion-strip / swipe / paste commits; advances on Space.
   */
  const nativeBeforeInputGuardRef = useRef<(e: InputEvent) => void>(() => {})
  nativeBeforeInputGuardRef.current = (e: InputEvent) => {
    if (phaseRef.current !== 'racing' || !raceRef.current) return

    const inputType = e.inputType
    const data = e.data ?? ''

    if (
      inputType === 'insertReplacementText' ||
      inputType === 'insertFromPaste' ||
      inputType === 'insertFromDrop' ||
      inputType === 'insertFromYank' ||
      inputType === 'insertTranspose'
    ) {
      e.preventDefault()
      return
    }

    // Swipe-typing / suggestion commit: multi-char insert in one event.
    if (
      (inputType === 'insertText' || inputType === 'insertCompositionText') &&
      data.length > 1
    ) {
      e.preventDefault()
      return
    }

    const current = raceRef.current
    const target = current.line.stations[current.stationIndex]!
    if (current.input.length !== target.length) return

    const insertingSpace = inputType === 'insertText' && data === ' '
    const insertingBreak =
      inputType === 'insertLineBreak' || inputType === 'insertParagraph'
    const isLast =
      current.stationIndex === current.line.stations.length - 1

    if (insertingSpace || (insertingBreak && isLast)) {
      e.preventDefault()
      advanceStation()
    }
  }

  useEffect(() => {
    if (phase !== 'racing') return
    const el = inputRef.current
    if (!el) return
    const listener = (e: Event) =>
      nativeBeforeInputGuardRef.current(e as InputEvent)
    el.addEventListener('beforeinput', listener)
    return () => el.removeEventListener('beforeinput', listener)
  }, [phase])

  /** React onBeforeInput — covers paste (and legacy keypress) paths. */
  function onStationBeforeInput(e: FormEvent<HTMLInputElement>) {
    const ne = e.nativeEvent
    if (ne instanceof InputEvent) {
      nativeBeforeInputGuardRef.current(ne)
      return
    }
    // React maps paste → onBeforeInput with a ClipboardEvent.
    if (ne instanceof ClipboardEvent || ne.type === 'paste') {
      e.preventDefault()
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
    const captureNode = shareCaptureRef.current ?? shareCardRef.current
    if (!race || !captureNode || shareBusy) return
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
      // Prefer the already-rendered preview PNG so Save matches what you see.
      const dataUrl =
        sharePngDataUrl ?? (await captureShareCardPng(captureNode, shareRatio))
      await action(dataUrl, result)
    } catch {
      setShareNote('Could not create image — try Full card page')
    } finally {
      setShareBusy(false)
    }
  }

  function saveShareImage() {
    void withShareCard(async (dataUrl, result) => {
      const filename = shareFilename(
        result.line.id,
        result.wpm,
        shareVariant,
        shareRatio,
      )
      await downloadDataUrl(dataUrl, filename)
      setShareNote('Image saved')
    })
  }

  function shareShareImage() {
    void withShareCard(async (dataUrl, result) => {
      const outcome = await shareResultImage(
        result,
        dataUrl,
        shareFilename(result.line.id, result.wpm, shareVariant, shareRatio),
      )
      setShareNote(outcome === 'shared' ? 'Shared' : 'Image saved')
    })
  }

  function openFullSharePage() {
    if (!race || phase !== 'finished') return
    openShareScreenshotPage({
      result: {
        line: race.line,
        wpm: finalWpm,
        rawWpm: finalRawWpm,
        accuracy: finalAccuracy,
        correctChars: race.correctChars,
        elapsedMs,
        device: race.device,
      },
      variant: shareVariant,
      ratio: shareRatio,
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
  const mapLineId =
    phase === 'idle' ? hoverLineId : (race?.line.id ?? null)
  const mapStationIndex = race?.stationIndex ?? 0
  const mapTypedFraction =
    phase === 'racing' && race && currentStation.length > 0
      ? race.input.length / currentStation.length
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

  // Pre-render the share PNG once per result/variant so the on-screen card is
  // the real export (long-press save on mobile) and Save/Share reuse it.
  useEffect(() => {
    if (phase !== 'finished' || !shareResult) {
      sharePngGenRef.current += 1
      setSharePngDataUrl(null)
      setSharePngPreparing(false)
      return
    }

    const gen = ++sharePngGenRef.current
    setSharePngPreparing(true)
    setSharePngDataUrl(null)

    const timer = window.setTimeout(() => {
      void (async () => {
        const node = shareCaptureRef.current
        if (!node) {
          if (gen === sharePngGenRef.current) setSharePngPreparing(false)
          return
        }
        try {
          const dataUrl = await captureShareCardPng(node, shareRatio)
          if (gen !== sharePngGenRef.current) return
          setSharePngDataUrl(dataUrl)
        } catch {
          if (gen !== sharePngGenRef.current) return
          setSharePngDataUrl(null)
        } finally {
          if (gen === sharePngGenRef.current) setSharePngPreparing(false)
        }
      })()
    }, 120)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    phase,
    shareVariant,
    shareRatio,
    shareResult?.line.id,
    shareResult?.wpm,
    shareResult?.accuracy,
    shareResult?.elapsedMs,
    shareResult?.device,
  ])

  const finishedRoute = race ? splitRoute(race.line.route) : null

  return (
    <div
      className="app"
      data-phase={phase}
      data-kb={phase === 'racing' && keyboardOpen ? 'open' : 'closed'}
    >
      <RailMapBackdrop
        phase={phase}
        lineId={mapLineId}
        stationIndex={mapStationIndex}
        typedFraction={mapTypedFraction}
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

          <div
            className="line-picker"
            onMouseLeave={() => setHoverLineId(null)}
          >
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
                            onMouseEnter={() => setHoverLineId(line.id)}
                            onFocus={() => setHoverLineId(line.id)}
                            onBlur={(e) => {
                              const next = e.relatedTarget as Node | null
                              if (
                                next &&
                                e.currentTarget
                                  .closest('.line-picker')
                                  ?.contains(next)
                              ) {
                                return
                              }
                              setHoverLineId(null)
                            }}
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
          <section className="race race--map-first" style={lineStyle(race.line.color)}>
            <header className="race-header-slim">
              <div className="line-meta line-meta--slim">
                <span className="line-dot" />
                <div className="line-meta-text">
                  <p className="line-system">{race.line.system}</p>
                  <h2 className="line-name">{race.line.name}</h2>
                </div>
              </div>
              <div className="stat-block stat-block--slim" aria-live="polite">
                <span className="stat-value">{formatWpm(liveWpm)}</span>
                <span className="stat-sub">
                  WPM
                  <span className="stat-sub-sep" aria-hidden="true">
                    ·
                  </span>
                  {formatAccuracy(liveAccuracy)}
                </span>
              </div>
              <div
                className="race-controls race-controls--slim"
                role="toolbar"
                aria-label="Session controls"
              >
                <button
                  type="button"
                  className="btn ghost btn-compact"
                  onClick={goHome}
                  title="Esc"
                >
                  Home
                </button>
                <button
                  type="button"
                  className="btn ghost btn-compact"
                  onClick={restartSameLine}
                  title="Alt+R"
                >
                  Restart
                </button>
                <button
                  type="button"
                  className="btn ghost btn-compact"
                  onClick={startRandomLine}
                  title="Ctrl+Enter"
                >
                  New
                </button>
              </div>
            </header>

            {/* Map shows through; keeps chrome pinned top/bottom */}
            <div className="race-map-spacer" aria-hidden="true" />

            <div className="race-bottom-chrome">
              <p className="stop-count stop-count--strip">
                Stop {Math.min(race.stationIndex + 1, race.line.stations.length)} of{' '}
                {race.line.stations.length}
                {liveRawWpm > 0 ? (
                  <>
                    <span className="stat-sub-sep" aria-hidden="true">
                      ·
                    </span>
                    {formatWpm(liveRawWpm)} raw
                  </>
                ) : null}
              </p>

              <div className="race-type-strip">
                <div className="station-prompt-panel station-prompt-panel--strip">
                  <p className="prompt-label">
                    {stationComplete
                      ? nextStation
                        ? 'Space → next'
                        : stationPerfect
                          ? 'Finishing…'
                          : 'Space / Enter finish'
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
                </div>

                <div className="race-type-dock race-type-dock--strip">
                  <form
                    className="station-type-form"
                    autoComplete="off"
                    onSubmit={(e) => e.preventDefault()}
                  >
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
                      onPaste={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      onKeyDown={onStationKeyDown}
                      onPointerDown={(e) => unlockPromptField(e.currentTarget)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      {...{ writingsuggestions: 'false' }}
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
                              : 'Space or Enter…'
                            : 'Space…'
                          : autofillGuard
                            ? 'Tap to type…'
                            : 'Type…'
                      }
                    />
                  </form>
                  {stationComplete && !(isLastStation && stationPerfect) && (
                    <p className="space-hint" role="status">
                      {isLastStation ? (
                        <>
                          <kbd className="key-hint">Space</kbd>
                          {' / '}
                          <kbd className="key-hint">Enter</kbd>
                        </>
                      ) : (
                        <>
                          <kbd className="key-hint">Space</kbd>
                          {' next'}
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <StationProgressRail
            line={race.line}
            currentIndex={race.stationIndex}
            typedLength={race.input.length}
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
                className="share-format-picker"
                role="radiogroup"
                aria-label="Share card format"
              >
                {SHARE_CARD_RATIOS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={shareRatio === opt.id}
                    className={
                      shareRatio === opt.id
                        ? 'share-format-opt is-active'
                        : 'share-format-opt'
                    }
                    onClick={() => setShareRatio(opt.id)}
                  >
                    <span className="share-format-glyph" aria-hidden="true">
                      <span
                        className="share-format-glyph-shape"
                        data-shape={opt.id}
                      />
                    </span>
                    <span className="share-format-copy">
                      <span className="share-format-opt-label">{opt.label}</span>
                      <span className="share-format-opt-blurb">
                        {opt.aspectLabel}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

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

              <div
                className={
                  sharePngPreparing
                    ? 'share-card-frame-scale is-preparing'
                    : 'share-card-frame-scale'
                }
                data-ratio={shareRatio}
              >
                {sharePngDataUrl ? (
                  <img
                    className="share-card-png-preview"
                    src={sharePngDataUrl}
                    alt="Share card — long-press to save on mobile"
                    width={shareExportSize(shareRatio).width}
                    height={shareExportSize(shareRatio).height}
                    draggable={false}
                  />
                ) : (
                  <div className="share-card-frame">
                    <ShareCard
                      ref={shareCardRef}
                      result={shareResult}
                      variant={shareVariant}
                      ratio={shareRatio}
                    />
                  </div>
                )}
              </div>

              {/* Design-size twin for PNG export — no preview scale / drop-shadow */}
              <div
                className="share-capture-host"
                data-ratio={shareRatio}
                aria-hidden="true"
              >
                <ShareCard
                  ref={shareCaptureRef}
                  result={shareResult}
                  variant={shareVariant}
                  ratio={shareRatio}
                />
              </div>

              <div className="cta-row share-actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={saveShareImage}
                  disabled={shareBusy || sharePngPreparing}
                >
                  {shareBusy || sharePngPreparing ? 'Preparing…' : 'Save image'}
                </button>
                <button
                  type="button"
                  className="btn neon"
                  onClick={shareShareImage}
                  disabled={shareBusy || sharePngPreparing}
                >
                  Share
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={openFullSharePage}
                  disabled={shareBusy}
                >
                  Full card page
                </button>
              </div>
              {(shareNote || sharePngDataUrl) && (
                <p className="share-note" role="status">
                  {shareNote ??
                    (sharePngDataUrl
                      ? 'Long-press the card to save on mobile'
                      : null)}
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
