import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { pickRandomLine, type StationLine } from './data/stations'
import { calcWpm, formatWpm } from './lib/wpm'
import './App.css'

type Phase = 'idle' | 'racing' | 'finished'

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

export default function App() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [race, setRace] = useState<RaceState | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [finalWpm, setFinalWpm] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase !== 'racing') return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase === 'racing') inputRef.current?.focus()
  }, [phase, race?.stationIndex])

  function startRace() {
    setRace(createRace())
    setFinalWpm(0)
    setPhase('racing')
    setNow(Date.now())
  }

  function finishRace(state: RaceState, endedAt: number) {
    const elapsed = state.startedAt ? endedAt - state.startedAt : 0
    const wpm = calcWpm(state.correctChars, elapsed)
    setFinalWpm(wpm)
    setRace(state)
    setPhase('finished')
  }

  function onInputChange(value: string) {
    if (!race || phase !== 'racing') return

    const target = race.line.stations[race.stationIndex]!
    const startedAt = race.startedAt ?? Date.now()
    const matched = matchPrefix(target, value)

    // Reject extra wrong characters beyond first mismatch (keep one error visible)
    let nextInput = value
    if (value.length > matched + 1) {
      nextInput = value.slice(0, matched + 1)
    }

    const completed =
      nextInput.length === target.length &&
      nextInput.toLowerCase() === target.toLowerCase()

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

    if (nextIndex >= race.line.stations.length) {
      finishRace(
        {
          ...race,
          input: '',
          startedAt,
          correctChars: nextCorrect,
          stationIndex: nextIndex,
        },
        Date.now(),
      )
      return
    }

    setRace({
      ...race,
      input: '',
      startedAt,
      correctChars: nextCorrect,
      stationIndex: nextIndex,
    })
  }

  const target = race?.line.stations[race.stationIndex] ?? ''
  const matched = race ? matchPrefix(target, race.input) : 0
  const liveElapsed =
    race?.startedAt && phase === 'racing' ? Math.max(now - race.startedAt, 1) : 0
  const liveCorrect =
    (race?.correctChars ?? 0) + (phase === 'racing' ? matched : 0)
  const liveWpm = calcWpm(liveCorrect, liveElapsed)
  const progress =
    race && race.line.stations.length > 0
      ? Math.min(race.stationIndex / race.line.stations.length, 1)
      : 0

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

          <div className="progress-rail" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="stop-count">
            Stop {Math.min(race.stationIndex + 1, race.line.stations.length)} of{' '}
            {race.line.stations.length}
          </p>

          <div className="prompt" key={race.stationIndex}>
            <p className="prompt-label">Type this station</p>
            <p className="prompt-word" aria-hidden="true">
              {target.split('').map((char, i) => {
                let cls = 'pending'
                if (i < matched) cls = 'ok'
                else if (i < race.input.length) cls = 'bad'
                return (
                  <span key={`${i}-${char}`} className={cls}>
                    {char === ' ' ? '\u00a0' : char}
                  </span>
                )
              })}
            </p>
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

      {phase === 'finished' && race && (
        <section className="results" style={lineStyle(race.line.color)}>
          <p className="results-kicker">Line cleared</p>
          <h2 className="results-brand">StationTypeRace</h2>
          <p className="results-line">
            <span className="line-dot" />
            {race.line.name}
          </p>
          <p className="results-wpm-label">Average WPM</p>
          <p className="results-wpm">{formatWpm(finalWpm)}</p>
          <p className="results-detail">
            {race.line.stations.length} stations · {race.correctChars} characters
          </p>
          <div className="cta-row">
            <button type="button" className="btn primary" onClick={startRace}>
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
