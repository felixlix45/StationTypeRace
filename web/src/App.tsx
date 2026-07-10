import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ShareCard } from './components/ShareCard'
import { pickRandomLine, type StationLine } from './data/stations'
import {
  captureShareCardPng,
  downloadDataUrl,
  shareFilename,
  shareResultImage,
  type ShareResult,
} from './lib/shareCard'
import { calcWpm, formatWpm } from './lib/wpm'
import './App.css'

type Phase = 'idle' | 'racing' | 'finished'

const SLIDE_MS = 480

function lineStyle(color: string): CSSProperties {
  return { ['--line' as string]: color } as CSSProperties
}

type RaceState = {
  line: StationLine
  stationIndex: number
  input: string
  startedAt: number | null
  correctChars: number
}

type SlideVisual = {
  outgoing: string
  key: number
}

function createRace(): RaceState {
  return {
    line: pickRandomLine(),
    stationIndex: 0,
    input: '',
    startedAt: null,
    correctChars: 0,
  }
}

function matchPrefix(target: string, typed: string): number {
  const t = target.toLowerCase()
  const s = typed.toLowerCase()
  let i = 0
  while (i < s.length && i < t.length && s[i] === t[i]) i += 1
  return i
}

function StationChars({
  word,
  matched,
  typedLength,
}: {
  word: string
  matched: number
  typedLength: number
}) {
  return (
    <>
      {word.split('').map((char, i) => {
        let cls = 'pending'
        if (i < matched) cls = 'ok'
        else if (i < typedLength) cls = 'bad'
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
  const [elapsedMs, setElapsedMs] = useState(0)
  const [slide, setSlide] = useState<SlideVisual | null>(null)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareNote, setShareNote] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const shareCardRef = useRef<HTMLDivElement>(null)
  const slideTimer = useRef<number | null>(null)

  useEffect(() => {
    if (phase !== 'racing') return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase === 'racing') inputRef.current?.focus()
  }, [phase, race?.stationIndex])

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

  function startRace() {
    clearSlideTimer()
    setSlide(null)
    setRace(createRace())
    setFinalWpm(0)
    setElapsedMs(0)
    setShareNote(null)
    setPhase('racing')
    setNow(Date.now())
  }

  function finishRace(state: RaceState, endedAt: number) {
    clearSlideTimer()
    setSlide(null)
    const elapsed = state.startedAt ? endedAt - state.startedAt : 0
    const wpm = calcWpm(state.correctChars, elapsed)
    setFinalWpm(wpm)
    setElapsedMs(elapsed)
    setRace(state)
    setShareNote(null)
    setPhase('finished')
  }

  function onInputChange(value: string) {
    if (!race || phase !== 'racing') return

    const target = race.line.stations[race.stationIndex]!
    const startedAt = race.startedAt ?? Date.now()
    // Allow wrong characters; only cap at the station name length
    const nextInput = value.slice(0, target.length)

    const completed = nextInput.toLowerCase() === target.toLowerCase()

    if (!completed) {
      setRace({
        ...race,
        input: nextInput,
        startedAt,
      })
      return
    }

    const nextCorrect = race.correctChars + target.length
    const nextIndex = race.stationIndex + 1
    const nextState: RaceState = {
      ...race,
      input: '',
      startedAt,
      correctChars: nextCorrect,
      stationIndex: nextIndex,
    }

    if (nextIndex >= race.line.stations.length) {
      finishRace(nextState, Date.now())
      return
    }

    // Advance input target immediately — slide is visual only
    playSlide(target)
    setRace(nextState)
  }

  async function withShareCard(
    action: (dataUrl: string, result: ShareResult) => Promise<void>,
  ) {
    if (!race || !shareCardRef.current || shareBusy) return
    const result: ShareResult = {
      line: race.line,
      wpm: finalWpm,
      correctChars: race.correctChars,
      elapsedMs,
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

  const matched = race ? matchPrefix(currentStation, race.input) : 0
  const typedLength = race?.input.length ?? 0

  const liveElapsed =
    race?.startedAt && phase === 'racing' ? Math.max(now - race.startedAt, 1) : 0
  const liveCorrect =
    (race?.correctChars ?? 0) + (phase === 'racing' ? matched : 0)
  const liveWpm = calcWpm(liveCorrect, liveElapsed)
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
          correctChars: race.correctChars,
          elapsedMs,
        }
      : null

  return (
    <div className="app" data-phase={phase}>
      <div className="atmosphere" aria-hidden="true" />
      <div className="track-glow" aria-hidden="true" />

      {phase === 'idle' && (
        <section className="hero">
          <p className="system-tag">Jakarta rail · typing race</p>
          <h1 className="brand">StationTypeRace</h1>
          <p className="lede">
            Type every stop on a random KRL, MRT, or LRT line — one station at a
            time.
          </p>
          <div className="cta-row">
            <button type="button" className="btn primary" onClick={startRace}>
              Board a line
            </button>
          </div>
        </section>
      )}

      {phase === 'racing' && race && (
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
            </div>
          </header>

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

          <p className="prompt-label">Type this station</p>

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
                  <StationChars
                    word={slide.outgoing}
                    matched={slide.outgoing.length}
                    typedLength={slide.outgoing.length}
                  />
                </p>
              </div>
            )}
            <div
              key={`cur-${race.stationIndex}`}
              className={[
                'station-slide',
                'is-current',
                isSliding ? 'is-entering' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <p className="prompt-word">
                <StationChars
                  word={currentStation}
                  matched={matched}
                  typedLength={typedLength}
                />
              </p>
            </div>
            {nextStation && !isSliding && (
              <div className="station-slide is-next" aria-hidden="true">
                <p className="prompt-word preview">{nextStation}</p>
              </div>
            )}
          </div>

          <label className="sr-only" htmlFor="station-input">
            Station name
          </label>
          <input
            id="station-input"
            ref={inputRef}
            className="station-input"
            value={race.input}
            onChange={(e) => onInputChange(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Start typing…"
          />
        </section>
      )}

      {phase === 'finished' && race && shareResult && (
        <section className="results" style={lineStyle(race.line.color)}>
          <p className="results-kicker">Line cleared — share your run</p>
          <h2 className="results-brand">StationTypeRace</h2>

          <div className="share-card-frame">
            <ShareCard ref={shareCardRef} result={shareResult} />
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

          <div className="cta-row">
            <button type="button" className="btn ghost" onClick={startRace}>
              Next random line
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setPhase('idle')
                setRace(null)
              }}
            >
              Back
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
