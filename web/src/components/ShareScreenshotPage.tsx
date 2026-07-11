import { useEffect, useRef, useState } from 'react'
import {
  ShareCard,
  SHARE_CARD_VARIANTS,
  type ShareCardVariant,
} from './ShareCard'
import {
  captureShareCardPng,
  clearSharePagePayload,
  downloadDataUrl,
  isShareCardRatio,
  loadSharePagePayload,
  saveSharePagePayload,
  shareFilename,
  shareResultImage,
  SHARE_CARD_RATIOS,
  type ShareCardRatio,
  type SharePagePayload,
  type ShareResult,
} from '../lib/shareCard'

function isShareVariant(value: string): value is ShareCardVariant {
  return SHARE_CARD_VARIANTS.some((opt) => opt.id === value)
}

/**
 * Full-viewport share card for a native OS screenshot.
 * Opened via `#/share` after a finished race stores the payload.
 */
export function ShareScreenshotPage() {
  const [payload] = useState<SharePagePayload | null>(() =>
    loadSharePagePayload(),
  )
  const [variant, setVariant] = useState<ShareCardVariant>(() => {
    const stored = loadSharePagePayload()?.variant
    return stored && isShareVariant(stored) ? stored : 'neon'
  })
  const [ratio, setRatio] = useState<ShareCardRatio>(() => {
    const stored = loadSharePagePayload()?.ratio
    return stored && isShareCardRatio(stored) ? stored : 'story'
  })
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const captureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'Share card · StationTypeRace'
    return () => {
      document.title = 'StationTypeRace'
    }
  }, [])

  useEffect(() => {
    if (!payload) return
    saveSharePagePayload({ result: payload.result, variant, ratio })
  }, [payload, variant, ratio])

  const result: ShareResult | null = payload?.result ?? null

  function goBack() {
    clearSharePagePayload()
    window.location.hash = ''
  }

  async function withCard(
    action: (dataUrl: string, result: ShareResult) => Promise<void>,
  ) {
    if (!result || !captureRef.current || busy) return
    setBusy(true)
    setNote(null)
    try {
      const dataUrl = await captureShareCardPng(captureRef.current, ratio)
      await action(dataUrl, result)
    } catch {
      setNote('Could not create image — try again, or screenshot this page')
    } finally {
      setBusy(false)
    }
  }

  function saveImage() {
    void withCard(async (dataUrl, next) => {
      await downloadDataUrl(
        dataUrl,
        shareFilename(next.line.id, next.wpm, variant, ratio),
      )
      setNote('Image saved')
    })
  }

  function shareImage() {
    void withCard(async (dataUrl, next) => {
      const outcome = await shareResultImage(
        next,
        dataUrl,
        shareFilename(next.line.id, next.wpm, variant, ratio),
      )
      setNote(outcome === 'shared' ? 'Shared' : 'Image saved')
    })
  }

  if (!result) {
    return (
      <div className="share-shot-page">
        <header className="share-shot-chrome">
          <button type="button" className="btn ghost" onClick={goBack}>
            ← Back
          </button>
        </header>
        <div className="share-shot-empty">
          <p className="share-shot-empty-title">No share card ready</p>
          <p className="share-shot-empty-copy">
            Finish a race, then open Full card page from the results screen.
          </p>
          <button type="button" className="btn primary" onClick={goBack}>
            Back to race
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="share-shot-page">
      <header className="share-shot-chrome">
        <button type="button" className="btn ghost share-shot-back" onClick={goBack}>
          ← Back
        </button>
        <p className="share-shot-hint">
          Screenshot this page for a pixel-perfect card
        </p>
      </header>

      <div
        className="share-format-picker share-shot-format"
        role="radiogroup"
        aria-label="Share card format"
      >
        {SHARE_CARD_RATIOS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={ratio === opt.id}
            className={
              ratio === opt.id ? 'share-format-opt is-active' : 'share-format-opt'
            }
            onClick={() => setRatio(opt.id)}
          >
            <span className="share-format-glyph" aria-hidden="true">
              <span
                className="share-format-glyph-shape"
                data-shape={opt.id}
              />
            </span>
            <span className="share-format-copy">
              <span className="share-format-opt-label">{opt.label}</span>
              <span className="share-format-opt-blurb">{opt.aspectLabel}</span>
            </span>
          </button>
        ))}
      </div>

      <div
        className="share-style-picker share-shot-picker"
        role="radiogroup"
        aria-label="Share card style"
      >
        {SHARE_CARD_VARIANTS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={variant === opt.id}
            className={
              variant === opt.id ? 'share-style-opt is-active' : 'share-style-opt'
            }
            onClick={() => setVariant(opt.id)}
          >
            <span className="share-style-opt-label">{opt.label}</span>
            <span className="share-style-opt-blurb">{opt.blurb}</span>
          </button>
        ))}
      </div>

      <div className="share-shot-stage">
        <div className="share-shot-frame-scale" data-ratio={ratio}>
          <div className="share-shot-frame">
            <ShareCard result={result} variant={variant} ratio={ratio} />
          </div>
        </div>
      </div>

      {/* Design-size twin for Save / Share — outside the scaled preview */}
      <div
        className="share-capture-host"
        data-ratio={ratio}
        aria-hidden="true"
      >
        <ShareCard
          ref={captureRef}
          result={result}
          variant={variant}
          ratio={ratio}
        />
      </div>

      <div className="cta-row share-actions share-shot-actions">
        <button
          type="button"
          className="btn primary"
          onClick={saveImage}
          disabled={busy}
        >
          {busy ? 'Preparing…' : 'Save image'}
        </button>
        <button
          type="button"
          className="btn neon"
          onClick={shareImage}
          disabled={busy}
        >
          Share
        </button>
      </div>
      {note && (
        <p className="share-note share-shot-note" role="status">
          {note}
        </p>
      )}
    </div>
  )
}
