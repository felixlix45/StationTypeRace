# Research: Jakarta Landmarks for Drone Backdrop

**Date:** 2026-07-11  
**Purpose:** Landmark set + asset strategy for StationTypeRace home atmosphere (blurred circling cityscape → zoom on race start)  
**Status:** Research + implementation brief

---

## 1. Chosen landmarks (aerial / drone POV)

| ID | Landmark | Why it works from the air | Visual silhouette cues |
|----|----------|---------------------------|------------------------|
| `monas` | **Monas** (National Monument, Merdeka Square) | Tallest civic icon; needle + gold flame reads instantly from altitude; open plaza gives clear negative space | Vertical obelisk, flame tip, wide green square |
| `bundaran-hi` | **Bundaran HI** / Selamat Datang Monument | Circular fountain + Welcome Monument at the Thamrin–Sudirman hinge; classic drone orbit subject | Roundabout ring, twin figures, hotel towers |
| `istiqlal` | **Istiqlal Mosque** (+ Cathedral adjacency) | Massive dome + minarets; unique among Jakarta skyline shots; sits near Gambir / Merdeka axis | Broad dome, vertical minarets, pale massing |
| `gbk` | **Gelora Bung Karno** (Senayan) | Oval stadium bowl + sports complex; strong geometric read from above | Elliptical bowl, floodlight masts, open park |
| `kota-tua` | **Kota Tua** / Fatahillah Square | Low colonial fabric vs modern towers; warm roof tones; historic north Jakarta | Low pitched roofs, plaza, museum blocks |
| `sudirman` | **Sudirman–Thamrin / SCBD** corridor | Dense glass towers = “Jakarta night” from a drone; corridor rhythm along the golden triangle | Clustered skyscrapers, canyon streets, neon windows |
| `ancol` | **Ancol** / north bay edge | Water + shoreline contrast; bay haze; breaks pure tower density | Water plane, pier/park edge, horizon glow |
| `dukuh-atas` | **Dukuh Atas** interchange (MRT / KRL / BRT flavor) | Ties the game’s rail identity to place; elevated station geometry reads as transit hub | Elevated deck, rail lines, mid-rise cluster |

**Optional flavor (not in v1 zoom set):** Gambir station façade, Jakarta Cathedral twin spires (paired with Istiqlal), Autograph Tower / Gama Tower as anonymous CBD height markers inside `sudirman`.

---

## 2. Asset strategy (legal + performance)

**Decision: stylized neon SVG / CSS cityscape — no scraped photos, no hotlinked stock.**

| Approach | Verdict |
|----------|---------|
| Copyrighted drone stills / video scraped from web | **Reject** — rights unclear, heavy bytes, broken hotlinks |
| Unsplash / Pexels photos | Viable later with attribution; still heavy for a blurred full-bleed loop; licensing must be checked per asset |
| Three.js / real 3D city | Overkill for atmosphere; bundle + GPU cost not justified |
| **Generative SVG silhouette + CSS transforms** | **Chosen** — zero new deps, Jakarta-readable icons (Monas needle, HI ring, Istiqlal dome, GBK oval), neon palette matches StationTypeRace |

**Attribution note:** No third-party photographic assets in v1. If photo layers are added later, prefer Unsplash/Pexels with photographer credit listed here (name, URL, license) and host copies under `web/public/` — never hotlink.

**Palette alignment:** Existing tokens (`--ink`, `--signal` amber, cyan glass `#7ef9ff`, fog `#9eb3c2`) — nocturnal rail neon, not purple-gradient AI slop.

---

## 3. Motion design (implementation contract)

1. **Idle (home):** Soft-blurred panorama; slow continuous “drone orbit” via CSS `translate` + tiny `rotate` + gentle scale (≈40–60s loop). Cinematic, not dizzy.
2. **Race start:** Ease orbit → **zoom into a random landmark** from the table above; optional subtle name label. One intentional transition (~1.2–1.6s).
3. **Return home (`goHome`):** Ease zoom back to overview orbit.
4. **`prefers-reduced-motion: reduce`:** Static overview; skip orbit; instant or near-instant focus change without continuous animation.
5. **Legibility:** Strong vignette / gradient scrim over the skyline so hero type and race UI stay readable.

---

## 4. Sources (context)

- Aerial / drone coverage of Jakarta landmarks commonly features Monas, Bundaran HI, Gelora Bung Karno, Sudirman–SCBD towers, Kota Tua, and bay edges (e.g. AirVūz Jakarta drone collections; travel aerial stock of Monas and Bundaran HI).
- Product context: StationTypeRace is Jakarta rail typing — Dukuh Atas included as transit-flavored landmark even if less “postcard” than Monas.
