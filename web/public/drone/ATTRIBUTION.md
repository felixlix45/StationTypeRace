# Aerial backdrop credit

All media under `web/public/drone/` is self-hosted and cleared for public web-app use
(Pexels License, CC0, Public Domain, or CC BY / CC BY-SA with attribution).

Race, home, and finished UIs show a top-left source line (`Photo:` / `Video: Creator · license · source`).

## Home loop (idle)

| Field | Value |
|-------|--------|
| Clip | Cinematic aerial view of Istiqlal Mosque near Monas (Jakarta) |
| Source page | https://www.pexels.com/video/cinematic-aerial-view-of-iconic-istiqlal-mosque-near-national-monument-of-jakarta-or-monas-16891597/ |
| Direct file (720p) | https://videos.pexels.com/video-files/16891597/16891597-hd_1280_720_24fps.mp4 |
| Creator | Afif Ramdhasuma (Pexels) |
| License | [Pexels License](https://www.pexels.com/license/) — free for websites/apps; attribution not required; do not resell unaltered as stock |
| Local files | `jakarta-orbit.mp4` (~2.4 MB, 1280×720 H.264, muted, ~24s loop), `jakarta-poster.jpg` (still from same clip) |

Compressed with ffmpeg (`libx264` CRF 28, `+faststart`) for web background use.

## Race landmarks (`landmarks/`)

Stills shown on race start (`phase === 'racing'` / backdrop `mode === 'zoom'`). Hosted under `web/public/drone/landmarks/`. Crossfade ~1.15s to/from the home aerial loop. Pool size: **24**. Web-resized (~1600px wide JPEG) with ffmpeg.

| ID | Local file | Title / subject | Creator | Source URL | License |
|----|------------|-----------------|---------|------------|---------|
| `monas` | `monas.jpg` | Still from Pexels aerial 16891597 (Monas) | Afif Ramdhasuma | https://www.pexels.com/video/cinematic-aerial-view-of-iconic-istiqlal-mosque-near-national-monument-of-jakarta-or-monas-16891597/ | [Pexels License](https://www.pexels.com/license/) |
| `istiqlal` | `istiqlal.jpg` | Still from same Pexels aerial 16891597 (Istiqlal) | Afif Ramdhasuma | https://www.pexels.com/video/cinematic-aerial-view-of-iconic-istiqlal-mosque-near-national-monument-of-jakarta-or-monas-16891597/ | [Pexels License](https://www.pexels.com/license/) |
| `kota-tua` | `kota-tua.jpg` | Historic Jakarta landmark with colonial architecture | Andri Wijayanto | https://www.pexels.com/photo/historic-jakarta-landmark-with-colonial-architecture-38186513/ | [Pexels License](https://www.pexels.com/license/) |
| `bundaran-hi` | `bundaran-hi.jpg` | Jakarta Bundaran HI | Adisurahman | https://commons.wikimedia.org/wiki/File:Jakarta_Bundaran_HI_.jpg | CC BY-SA 4.0 |
| `ancol` | `ancol.jpg` | Festival beach Ancol Jakarta | Midori | https://commons.wikimedia.org/wiki/File:Festival_beach_Ancol_Jakarta.jpg | CC BY-SA 3.0 |
| `dukuh-atas` | `dukuh-atas.jpg` | Dukuh Atas MRT Station | Slleong | https://commons.wikimedia.org/wiki/File:Dukuh_Atas_1.jpg | CC0 1.0 |
| `gbk` | `gbk.jpg` | Gelora Bung Karno aerial | Davidelit | https://commons.wikimedia.org/wiki/File:GeloraBungKarno.jpg | Public domain |
| `sudirman` | `sudirman.jpg` | Sudirman Central Business District (SCBD) | Rantemario | https://commons.wikimedia.org/wiki/File:SCBD_Jakarta.jpg | CC BY-SA 4.0 |
| `cathedral` | `cathedral.jpg` | Jakarta Cathedral Afternoon | Gunawan Kartapranata | https://commons.wikimedia.org/wiki/File:Jakarta_Cathedral_Afternoon.JPG | CC BY-SA 3.0 |
| `glodok` | `glodok.jpg` | Klenteng Jin De Yuan, Glodok | Gunawan Kartapranata | https://commons.wikimedia.org/wiki/File:Klenteng_Jin_De_Yuan,_Glodok,_Jakarta.jpg | CC BY-SA 3.0 |
| `jis` | `jis.jpg` | Jakarta International Stadium from Toll road | Rudiwaka | https://commons.wikimedia.org/wiki/File:Jakarta_International_Stadium_from_Toll_road.jpg | CC BY-SA 4.0 |
| `skyline` | `skyline.jpg` | Jakarta Skyline Part 2 | yohanes budiyanto | https://commons.wikimedia.org/wiki/File:Jakarta_Skyline_Part_2.jpg | CC BY 2.0 |
| `night` | `night.jpg` | Jakarta Night sky | Sharon Sakbana | https://commons.wikimedia.org/wiki/File:Jakarta_Night_sky.jpg | CC BY-SA 4.0 |
| `mrt` | `mrt.jpg` | Inside the elevated MRT Jakarta Station | Lima_Em_Railfans | https://commons.wikimedia.org/wiki/File:Inside_the_elevated_MRT_Jakarta_Station.jpg | CC BY-SA 4.0 |
| `jakarta-kota` | `jakarta-kota.jpg` | Jakarta Kota Station | hiroo | https://commons.wikimedia.org/wiki/File:Jakarta_Kota_Station.jpg | CC BY-SA 2.0 |
| `fatahillah` | `fatahillah.jpg` | Museum Fatahillah | Dederohman | https://commons.wikimedia.org/wiki/File:Museum_Fatahillah.jpg | CC BY-SA 3.0 |
| `tugu-tani` | `tugu-tani.jpg` | Tugu Tani | Yoga Putra Prathama | https://commons.wikimedia.org/wiki/File:Tugu_Tani.jpg | CC BY-SA 4.0 |
| `kota-tua-aerial` | `kota-tua-aerial.jpg` | DJI 0123 — Kota Tua Jakarta | IndoDroneMan | https://commons.wikimedia.org/wiki/File:DJI_0123_-_Kota_Tua_Jakarta.jpg | CC BY-SA 4.0 |
| `monas-plaza` | `monas-plaza.jpg` | National Monument Jakarta | Michaelmeer | https://commons.wikimedia.org/wiki/File:National_Monument_Jakarta.jpg | Public domain |
| `lapangan-banteng` | `lapangan-banteng.jpg` | West Irian Liberation Monument at Lapangan Banteng | Cun Cun | https://commons.wikimedia.org/wiki/File:West_Irian_Liberation_Monument_at_Lapangan_Banteng.jpg | CC BY-SA 4.0 |
| `museum-nasional` | `museum-nasional.jpg` | Museum Nasional Jakarta | Banacama | https://commons.wikimedia.org/wiki/File:Museum_Nasional_Jakarta.jpg | CC BY-SA 4.0 |
| `wisma46` | `wisma46.jpg` | Wisma 46 (Januari 2025) | Medelam | https://commons.wikimedia.org/wiki/File:Wisma_46_(Januari_2025).jpg | CC BY 4.0 |
| `senayan` | `senayan.jpg` | TransJakarta at Bundaran Senayan | Atmawinanda | https://commons.wikimedia.org/wiki/File:Bis_Transjakarta_melewati_halte_Bundaran_Senayan_Jakarta.jpg | CC BY-SA 4.0 |
| `semanggi` | `semanggi.jpg` | Simpang Semanggi, Jakarta | Muhammad Rasyid Prabowo | https://commons.wikimedia.org/wiki/File:Simpang_Semanggi,_Jakarta.jpg | CC BY-SA 2.0 |

## Other public assets

| File | Notes |
|------|--------|
| `web/public/favicon.svg` | Original StationTypeRace icon (project-owned) |

## Removed / replaced (license safety)

| Former asset | Issue | Action |
|--------------|-------|--------|
| `gbk.jpg` (Flickr stadium stand-in) | Vague Flickr credit; not true GBK | Replaced with Commons `GeloraBungKarno.jpg` (Public domain) |
| `sudirman.jpg` (Flickr sunset skyline) | Flickr-only copy; prefer Commons | Replaced with Commons `SCBD_Jakarta.jpg` (CC BY-SA 4.0) |
| Flickr Glodok Chinatown (`4497559200`) | Live Flickr page showed **All rights reserved** | Never shipped; used Commons Klenteng Jin De Yuan instead |
| Flickr `ancol-bay`, `gbk-bowl`, `istiqlal-courtyard`, `hi-circle` | Ambiguous / redundant / broken landing URL | Removed from `landmarks/` |
| `hi-busway.jpg` (Busway in Bundaran HI) | Commons page carries Indonesia FoP copyright warning | Removed; not in race pool |

No remote hotlinked media in app code — all plates are local under `/drone/`.
