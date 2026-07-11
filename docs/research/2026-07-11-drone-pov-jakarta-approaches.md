# Research: Drone-POV Jakarta Background — Alternatives to Hand-Drawn SVG

**Date:** 2026-07-11  
**Repo:** StationTypeRace (`web/`, React + Vite)  
**Current implementation:** `web/src/components/DroneBackdrop.tsx` + orbit CSS in `web/src/App.css`  
**Prior brief:** [`2026-07-11-jakarta-landmarks-drone-bg.md`](./2026-07-11-jakarta-landmarks-drone-bg.md)  
**Status:** Research brief (no full rewrite)

---

## 1. Executive summary + recommendation

The hand-drawn neon SVG skyline is the right *aesthetic* for StationTypeRace, but it cannot deliver a convincing “drone circle” because soft silhouettes + heavy blur + a ~48s transform loop produce almost no perceptible optical flow. Users correctly read it as mostly static.

**Primary path (recommended): Hybrid looping aerial video plate + neon CSS overlays**

1. License or download a short Jakarta aerial/drone loop (prefer **Pexels** first; **Artgrid**/Pond5 if you need a true orbit and better night footage).
2. Self-host a heavily compressed **muted** `<video autoplay muted loop playsinline>` under `web/public/`.
3. Keep the existing vignette / haze / amber–cyan scrims; optionally layer thin neon road ribbons or landmark “ping” rings from the current SVG as overlays.
4. On race start, CSS `scale`/`translate` (or swap to a landmark-specific plate) to retain the zoom-to-landmark beat.

This gives real camera motion, keeps the neon game look, needs no API keys, and fits a side-project budget.

**Lightweight fallback: Ken Burns multi-layer stills**

Two or three high-res aerial stills (Monas / Sudirman / bay) with staggered CSS `translate`/`scale` parallax. Zero video bandwidth; less “drone,” still obviously moving. Good offline / reduced-data path and `poster` fallback when video autoplay fails.

**Do not pursue for v1:** Google Earth Studio exports as a web-game backdrop (ToS/commercial restrictions), Unreal Pixel Streaming (cost/scale), DIY Three.js photogrammetry (effort), or AI “Jakarta orbit” loops as the sole plate (consistency + rights risk).

**Interim (<30 min, optional):** Amplify motion on the *current* SVG stack (shorter loop, less blur, higher-frequency light pulse). See §2 and §5. This does not replace a real plate.

---

## 2. Why the current SVG/CSS still feels motionless (code diagnosis)

Relevant code:

- Orbit stage: `.drone-backdrop__orbit` with `filter: blur(5.5px–7px)` and `animation: drone-orbit 48s linear infinite`
- Secondary layers: `drone-world-drift` (48s), `drone-parallax` (72s), `drone-haze-drift` (36s)
- Keyframes intentionally large (~±16–17% pan, ±3.2–3.4° bank) after a prior “invisible” ~3%/1° loop

**Why it still reads as static:**

| Factor | Effect |
|--------|--------|
| **Heavy Gaussian blur** | Blur destroys high-frequency edges. Optical flow needs contrast edges; soft neon blobs look like a fixed wash even when translating. |
| **Low spatial frequency art** | The SVG is large flat rects/ellipses, not textured rooftops/streets. Translate does not create new detail sliding under the camera. |
| **Long period (48–72s)** | Angular velocity is tiny (~7.5° of “bank” over 12s per quadrant). Humans under-detect slow global drift behind UI. |
| **Parent + child cancel partially** | `drone-orbit` pans one way while `drone-world-drift` counter-pans; designed for depth, but net landmark motion vs viewport can look weaker than either alone. |
| **Vignette + haze overlays** | Fixed radial vignette and drifting haze sit *above* the world; they mask peripheral motion where orbit is strongest. |
| **No time-varying local cues** | No moving headlights, water shimmer, or window flicker at 1–4 Hz — those would sell motion even with blur. |
| **`prefers-reduced-motion`** | Correctly kills orbit; if OS/browser has reduce-motion on, the backdrop is intentionally static. |

**Bottom line:** CSS orbit on a soft illustration can never feel like a drone reel. The amplitude bump helped math; perception still fails because the *signal* (texture + local motion) is missing.

**Quick interim levers (if keeping SVG for a few days):**

1. Cut orbit to **18–24s**; world drift to **half** that (different rates, less cancel).
2. Orbit blur **≤3px** (or blur only vignette, not the stage).
3. Add a looping CSS “traffic streak” or Monas flame pulse at 2–3s so *something* obviously animates.
4. Slightly desync scale (1.05→1.22) so zoom breathing is visible.

---

## 3. Option matrix

| Option | How “drone circle” is achieved | Realism vs neon fit | Perf / bundle / mobile | Cost & keys | Licensing / ToS risk | Effort in this codebase | Blur + UI readability |
|--------|--------------------------------|---------------------|------------------------|-------------|----------------------|-------------------------|------------------------|
| **A. Looping stock aerial video** | Real camera path in the plate; optional slow CSS rotate/scale | High realism; neon via overlays/tint | Medium bytes (~2–8 MB webm/mp4); decode cost; no JS deps | Free (Pexels/Pixabay/Coverr) or paid (Artgrid/Pond5) | Low if license checked per clip; host locally | **Low–med** (~0.5–1 day) | Excellent with existing haze/vignette |
| **B. Google Earth Studio export** | Keyframed orbit in Earth Studio → MP4 | Photoreal Earth look; weak neon unless graded | Same as video once exported | Free tool | **High for web game UI** — Earth imagery not for commercial/promotional web embeds | Med (authoring) | Attribution must stay visible |
| **C. Mapbox / MapLibre 3D** | Programmatic `easeTo` / bearing spin over extruded buildings | Stylized 3D map; can night-tint; not photoreal drone | GL JS ~bundle; GPU; tile network | Mapbox: free ≤50k map loads/mo then paid; API token | Medium (ToS, attribution, token leakage) | Med–high | Good with CSS overlay; map labels may fight UI |
| **D. CesiumJS + Google Photorealistic 3D Tiles** | True 3D mesh orbit (`lookAt` + `rotateRight`) | Max realism | Heavy GPU/network; Cesium weight | API key; Photorealistic 3D billed per root tileset (~$6/1k after free cap) | Med–high (Maps Platform policies, attribution on-screen) | High | Possible but busy; Indonesia **Maps JS 3D** coverage listed as unavailable — verify mesh before investing |
| **E. Three.js + DEM/satellite** | DIY terrain mesh + camera path | Custom neon shaders possible | Large assets; authoring hell | Mostly free data (Sentinel) + time | Low for Copernicus if attributed; high if scraping photos | **Very high** | Controllable |
| **F. Ken Burns stills / parallax** | Multi-layer CSS transform on aerial photos | Fake orbit; stylizable | Tiny vs video; great mobile | Free/paid stills | Low (Pexels/Unsplash/Sentinel) | **Low** | Excellent |
| **G. Unreal Pixel Streaming** | Cloud-rendered cinematic camera | AAA | Per-user GPU $; latency | High ongoing | Engine EULA | Extreme | Overkill |
| **H. AI looping aerial** | Gen video with loop/keyframe tricks | Hit-or-miss Jakarta identity; temporal wobble | Same as video | Gen tool subscription | **Medium–high** (training data, no indemnification, landmark likeness) | Low–med | OK if graded |
| **I. Hybrid video + neon CSS** (A+current) | Real plate + StationTypeRace chrome | **Best fit** | Same as A | Same as A | Same as A | Low–med | Best of both |
| **J. Current SVG/CSS** (status quo) | Fake orbit transforms | Neon-native; zero realism | Excellent | $0 | None | Done | Good readability; poor motion |

---

## 4. Deep dives (top options)

### 4.1 Primary: Looping aerial / drone video (+ hybrid neon)

**How it works:** A short clip of Jakarta from altitude plays full-bleed, muted, looping. Optional slow CSS `scale(1.05→1.12)` / micro-rotate sells “still circling” even if the plate is a forward flyover. Neon scrims, vignette, and optional SVG accents sit on top (z-index above video, below UI).

**Jakarta-specific assets (confirmed exist):**

| Landmark / area | Free / stock examples |
|-----------------|------------------------|
| Monas + Istiqlal | [Pexels — cinematic aerial Istiqlal / Monas](https://www.pexels.com/video/cinematic-aerial-view-of-iconic-istiqlal-mosque-near-national-monument-of-jakarta-or-monas-16891597/) |
| General Jakarta drone | [Pexels — Jakarta drone dusk](https://www.pexels.com/video/jakarta-drone-20513186/); [Pexels search: Jakarta drone](https://www.pexels.com/search/videos/jakarta%20drone/) (large result set) |
| Monas / skyline (paid) | Envato, iStock, Shutterstock, Pond5 marketplaces (search “Jakarta drone”, “Monas aerial”) |
| Sudirman / CBD / bay | Abundant on paid stock; fewer perfect free *orbit* loops — may need Artgrid/Pond5 or accept a linear flyover + CSS bank |

**Autoplay / bandwidth (primary sources):**

- Chrome: **muted autoplay always allowed** ([Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay)).
- Use `autoplay muted loop playsinline` ([Mux background video guide](https://www.mux.com/articles/add-background-video-website-hls-performance); [Apple Safari video delivery](https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari)).
- Target **≤3–5 MB** compressed 720p–1080p H.264/WebM; avoid 4K for a blurred backdrop. Prefer `preload="metadata"` + poster still; pause when tab hidden (`document.visibilityState`).
- `prefers-reduced-motion: reduce` → show poster only.

**Licensing:**

- **Pexels:** Free use on websites/apps; attribution not required; do not resell unaltered as stock ([Pexels License](https://www.pexels.com/license/)). Suitable for a game UI background.
- **Pixabay:** Separate Content License — commercial use generally allowed with similar redistribution limits (verify current license page at download time).
- **Coverr:** Markets free personal/commercial use, no attribution ([Coverr](https://coverr.co/)).
- **Artgrid:** Subscription RF; commercial/video/game-style use covered under their license FAQ for proper use; downloads remain licensed after sub ends if downloaded while active ([Artgrid commercial FAQ](https://artgrid.zendesk.com/hc/en-us/articles/8022778156829-Can-I-use-the-footage-in-my-commercial-projects-or-advertising); [How to use footage](https://artgrid.zendesk.com/hc/en-us/articles/8069563020701-How-to-Find-Download-and-Use-Footage)).
- **Pond5:** Per-clip [Content License Agreement](https://www.pond5.com/legal/license) — OK inside a Production (site/game); do not redistribute raw files as stock.

**Fit for StationTypeRace:** Strong. Grade toward cool shadows + amber/cyan color overlays so photoreal plate doesn’t clash with rail-neon UI. Blur 2–4px on the video (not 7px) so motion survives.

**Implementation sketch:**

```tsx
<video
  className="drone-backdrop__video"
  autoPlay
  muted
  loop
  playsInline
  preload="metadata"
  poster="/drone/jakarta-poster.webp"
>
  <source src="/drone/jakarta-orbit.webm" type="video/webm" />
  <source src="/drone/jakarta-orbit.mp4" type="video/mp4" />
</video>
```

Keep landmark zoom by scaling the video wrapper toward approximate screen positions, or crossfade to landmark-specific plates.

---

### 4.2 Google Earth Studio / Earth API

**How it works:** Author a circular camera path over Jakarta in [Earth Studio](https://www.google.com/earth/studio/), export MP4, host like any video.

**Licensing (blocking for this use case):**

- Earth Studio FAQ: **no commercial license** for Google Earth imagery; attribution required for allowed uses ([Earth Studio FAQ](https://www.google.com/earth/studio/faq/)).
- Google Geo guidelines: Earth/Earth Studio OK for research, education, film, nonprofit — **“Google Earth content may not be used for any commercial or promotional purposes.”** Web/apps: **“Google Earth may not be embedded online or in apps”**; static exports only for limited non-commercial uses; explicitly lists website headers / promotional web imagery as don’ts ([Geo Guidelines](https://about.google/brand-resource-center/products-and-services/geo-guidelines/)).
- Film/TV/online *entertainment video* with attribution is carved out differently from **embedding in a commercial web app / game chrome**.

**Verdict for StationTypeRace:** Treat as **not viable** for the live product background. Do not export Earth Studio and ship it as the home backdrop. Use Maps Platform 3D products under API terms if you need Google 3D legally (see §4.3).

---

### 4.3 Mapbox / MapLibre / Cesium / Google Photorealistic 3D

#### Mapbox GL JS + Standard 3D

- **Circle:** Animate `bearing` (and slight `pitch`/`zoom`) around a center (e.g. Monas `[-6.1754, 106.8272]`).
- **Jakarta:** Mapbox explicitly added **Jakarta** to cities with custom 3D landmarks in Standard ([Mapbox blog — global cities 3D landmarks](https://www.mapbox.com/blog/global-cities-3d-landmarks)).
- **Cost:** Mapbox GL JS map loads free up to **50,000 / month**, then paid ([Mapbox pricing](https://www.mapbox.com/pricing)).
- **Fit:** Night/dusk config + building flood lights can approach neon; still reads as **map**, not drone footage.
- **Effort:** New dependency (`mapbox-gl`), token in env, attribution control, pause GL when not on home screen.
- **Blur:** CSS overlay works; don’t over-blur or buildings turn to mush.

#### MapLibre

- Free/open vector maps; 3D buildings possible with fill-extrusion; **no** Google photoreal mesh without a tiles backend you pay for. Good if avoiding Mapbox billing; weaker “wow” than photoreal.

#### CesiumJS + Google Photorealistic 3D Tiles

- **Circle:** Documented camera orbit pattern (`lookAtTransform` + `rotateRight`) ([Google Map Tiles — use a renderer](https://developers.google.com/maps/documentation/tile/use-renderer)).
- **Cost:** Photorealistic 3D Tiles are an **Enterprise** Map Tiles SKU — free cap then **~$6 per 1,000 root tile requests** ([Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/pricing); [usage & billing](https://developers.google.com/maps/documentation/tile/usage-and-billing)). Each session/root request can stream many mesh tiles for up to ~3 hours.
- **Coverage risk:** Platform coverage table shows Indonesia **Map Tiles 2D/3D ●** but **Maps JavaScript 3D —** ([coverage details](https://developers.google.com/maps/coverage)). Photorealistic surface mesh is **not worldwide** — verify Jakarta on the [Photorealistic 3D Maps coverage map](https://developers.google.com/maps/documentation/javascript/3d/coverage) before committing.
- **Perf:** Cesium + mesh streaming is heavy for a decorative backdrop behind a typing game on mid mobile GPUs.
- **Verdict:** Excellent for a dedicated “explore Jakarta” mode; **overkill and risky** as always-on home atmosphere for this side project.

---

### 4.4 Three.js + photogrammetry / satellite / DEM

- Pull Copernicus Sentinel-2 (free, open, commercial OK with attribution: *“Copernicus Sentinel data [Year]”* / modified variant) ([Copernicus access](https://www.copernicus.eu/en/terms-use/how-access-data); [Sentinel legal notice](https://cds.climate.copernicus.eu/licences/ec-sentinel)).
- Drape on DEM (e.g. SRTM/Copernicus DEM), fake buildings with boxes or OSM extrusions, orbit with Three.js.
- **Effort:** Weeks for something that still looks worse than a $0–$30 stock drone clip.
- **Verdict:** Reject for StationTypeRace atmosphere.

---

### 4.5 Ken Burns / multi-layer parallax stills

- Sources: Pexels/Unsplash aerial Jakarta stills; Mapbox Static Images (API + attribution); Sentinel for abstract satellite texture (low altitude detail).
- Stack 2–3 layers at different pan speeds + slow scale; optional SVG neon on top.
- **Pros:** Tiny payload, always “moving,” trivial React, great fallback/poster.
- **Cons:** Not a true orbit; limited depth.
- **Verdict:** Best **fallback** and reduced-motion/data path.

---

### 4.6 Unreal Pixel Streaming

- Cloud GPU renders Unreal; browser gets a video stream.
- Per-concurrent-user cost and latency; absurd for a static home backdrop ([comparative discussions](https://svilenkovic.com/3d/three-js-vs-unreal-pixel-streaming)).
- **Verdict:** Overkill — note only.

---

### 4.7 AI-generated looping aerial

- Tools (Runway, Luma, etc.): paid plans often allow commercial use of outputs, but terms change; typically **no indemnification**; training-on-inputs varies ([summaries of Runway commercial terms](https://terms.law/ai-output-rights/runway/) — always re-read current ToS).
- **Quality:** Temporal flicker, morphing towers, “almost Monas” uncanny valley — bad when the game’s identity is Jakarta rail.
- Looping is improving (end-frame pinning / loop toggles) but still weaker than a real drone plate for recognizable skyline.
- **Verdict:** Optional experimental texture under heavy blur; do **not** rely on as sole identifiable Jakarta plate.

---

### 4.8 Hybrid (recommended synthesis)

| Layer | Role |
|-------|------|
| Video or Ken Burns still | Real motion / place identity |
| CSS color grade (cyan/amber multiply) | Brand palette |
| Soft vignette + bottom scrim | Type legibility (already in `App.css`) |
| Optional thin SVG accents (Monas flame, HI ring, rail glow) | Neon game signal without carrying the whole skyline |
| Landmark label on zoom | Already implemented |

This matches the prior landmark brief’s neon direction while fixing the motion complaint.

---

## 5. Recommended implementation plan (no full build required)

### Phase 0 — Interim (optional, &lt;30 min)

Only if shipping before assets arrive:

1. `drone-orbit` → **20s**; reduce blur to **~3px** in orbit mode.
2. Add a 2.5s opacity pulse on Monas flame / road stroke in SVG.
3. Verify `prefers-reduced-motion` isn’t forcing static during tests.

### Phase 1 — Primary path (1–2 evenings)

1. **Acquire plate:** Download 2–3 Pexels Jakarta drone clips; pick the one with continuous camera motion (not a hover). If none orbit cleanly, buy one Artgrid/Pond5 night Sudirman/Monas orbit.
2. **Compress:** HandBrake/ffmpeg → 720p or 1080p, ~2–5 Mbps H.264 + WebM; strip audio; target **&lt;5 MB**.
3. **Host:** `web/public/drone/jakarta-orbit.{mp4,webm}` + `jakarta-poster.webp`.
4. **Wire:** Replace or underlay SVG in `DroneBackdrop` with `<video>`; keep haze/vignette/label.
5. **Grade:** CSS `filter` on video (`brightness`, `saturate`, slight `hue`) + existing amber/cyan gradients.
6. **Zoom:** On `mode === 'zoom'`, scale video toward landmark focus (reuse `--drone-focus-*`) or crossfade landmark posters.
7. **Fallbacks:** Poster still + Ken Burns if `video.play()` rejects or `prefers-reduced-motion` / Save-Data.
8. **Credits:** Optional footer “Aerial: [creator] / Pexels” even when not required — good citizenship; store license URLs in this doc or `web/public/drone/ATTRIBUTION.md`.

### Phase 2 — Lightweight fallback always-on

- Ship Ken Burns stills as the reduced-motion / failed-autoplay path (not a second product).

### Phase 3 — Only if you later want interactive 3D

- Spike Mapbox Standard dusk orbit for 1 hour; measure FPS on a mid Android phone and map-load cost.
- Skip Cesium/Google photoreal until Jakarta mesh coverage is confirmed on Google’s coverage map.

### Explicit non-goals

- Earth Studio exports in production.
- Pixel Streaming.
- Full Three.js city rebuild.

---

## 6. Sources

### Current codebase

- `web/src/components/DroneBackdrop.tsx`
- `web/src/App.css` (`.drone-backdrop*`, `@keyframes drone-orbit`, etc.)
- `docs/research/2026-07-11-jakarta-landmarks-drone-bg.md`

### Stock video & licenses

- [Pexels License](https://www.pexels.com/license/)
- [Pexels — Jakarta drone](https://www.pexels.com/video/jakarta-drone-20513186/)
- [Pexels — Istiqlal / Monas aerial](https://www.pexels.com/video/cinematic-aerial-view-of-iconic-istiqlal-mosque-near-national-monument-of-jakarta-or-monas-16891597/)
- [Pexels search — Jakarta drone](https://www.pexels.com/search/videos/jakarta%20drone/)
- [Coverr](https://coverr.co/)
- [Artgrid commercial use FAQ](https://artgrid.zendesk.com/hc/en-us/articles/8022778156829-Can-I-use-the-footage-in-my-commercial-projects-or-advertising)
- [Artgrid — how to use footage](https://artgrid.zendesk.com/hc/en-us/articles/8069563020701-How-to-Find-Download-and-Use-Footage)
- [Pond5 Content License](https://www.pond5.com/legal/license)

### Autoplay / video delivery

- [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay)
- [Mux — background video on the web](https://www.mux.com/articles/add-background-video-website-hls-performance)
- [Apple — Delivering Video Content for Safari](https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari)

### Google Earth / Maps / 3D

- [Earth Studio FAQ](https://www.google.com/earth/studio/faq/)
- [Earth Studio Attribution](https://earth.google.com/studio/docs/attribution/)
- [Google Geo Brand Guidelines](https://about.google/brand-resource-center/products-and-services/geo-guidelines/)
- [Photorealistic 3D Tiles overview](https://developers.google.com/maps/documentation/tile/3d-tiles-overview)
- [Photorealistic 3D Tiles guide](https://developers.google.com/maps/documentation/tile/3d-tiles)
- [Map Tiles usage & billing](https://developers.google.com/maps/documentation/tile/usage-and-billing)
- [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Maps Platform coverage](https://developers.google.com/maps/coverage)
- [Photorealistic 3D Maps coverage](https://developers.google.com/maps/documentation/javascript/3d/coverage)
- [CesiumJS Photorealistic 3D Tiles quickstart](https://cesium.com/learn/cesiumjs-learn/cesiumjs-photorealistic-3d-tiles/)
- [Work with a 3D Tiles renderer (orbit sample)](https://developers.google.com/maps/documentation/tile/use-renderer)

### Mapbox

- [Mapbox pricing](https://www.mapbox.com/pricing)
- [Mapbox Standard — 3D landmarks blog (includes Jakarta)](https://www.mapbox.com/blog/global-cities-3d-landmarks)
- [Mapbox Standard style config](https://docs.mapbox.com/map-styles/standard/api)
- [Mapbox Terms of Service](https://www.mapbox.com/legal/tos)

### Satellite / open data

- [Copernicus — how to access data](https://www.copernicus.eu/en/terms-use/how-access-data)
- [Copernicus Sentinel data licence](https://cds.climate.copernicus.eu/licences/ec-sentinel)
- [Sentinel-2 on Copernicus Data Space](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2)

### AI video (secondary; verify live ToS)

- [Runway output rights overview (third-party summary)](https://terms.law/ai-output-rights/runway/) — re-check Runway’s current Terms before shipping.

---

## 7. Decision record

| Decision | Choice |
|----------|--------|
| Primary atmosphere tech | **Self-hosted looping Jakarta aerial video + neon CSS hybrid** |
| Fallback | **Ken Burns aerial stills** (+ poster when video blocked) |
| Rejected for v1 | Earth Studio web embed, Cesium/photoreal always-on, Three.js city, Pixel Streaming, AI-only plate |
| SVG neon skyline | Retain as optional accent / emergency offline art, not the motion engine |
| Next action | Source & compress 1–2 clips; wire `<video>` under existing scrims |

*Not committed to git — research artifact only.*

---

## 8. Implementation note (2026-07-11)

Hybrid path wired in `DroneBackdrop.tsx`:

- Plate: Pexels 16891597 (Istiqlal / Monas aerial) → `web/public/drone/jakarta-orbit.mp4` + poster; credit in `web/public/drone/ATTRIBUTION.md`
- Idle: muted looping `<video>` + slow `drone-video-drift` Ken Burns; neon haze / vignette / amber–cyan parallax scrims retained
- Race: CSS `translate` + `scale` on `.drone-backdrop__orbit` toward `--drone-focus-*` landmark coords
- `prefers-reduced-motion`: pause video, show poster still
- Load / autoplay failure: SVG neon skyline fallback (`data-plate="svg"`)
