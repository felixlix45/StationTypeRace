import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.tsx'
import { BuildWatermark } from './components/BuildWatermark.tsx'
import { ShareScreenshotPage } from './components/ShareScreenshotPage.tsx'
import { isSharePageHash } from './lib/shareCard'

function Root() {
  const [sharePage, setSharePage] = useState(() => isSharePageHash())

  useEffect(() => {
    const sync = () => setSharePage(isSharePageHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return (
    <>
      {/* Keep App mounted so finished-race state survives Full card page */}
      <div hidden={sharePage}>
        <App />
      </div>
      {sharePage ? <ShareScreenshotPage /> : null}
      <BuildWatermark />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
