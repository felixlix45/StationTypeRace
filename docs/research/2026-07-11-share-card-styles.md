# Research Brief: Instagram Stories Share Cards for Typing / Score Games

**Date:** 2026-07-11  
**Purpose:** What belongs on a Story-sized share card for StationTypeRace, which visual archetypes work, and how to layout for Instagram chrome.  
**Status:** Research + implementation guide (variants ship in `web/src/components/ShareCard.tsx`)

---

## 1. Executive summary

Share cards and results panels do different jobs:

| Surface | Job | Content budget |
|---------|-----|----------------|
| **Story PNG (9:16)** | Brag in one glance | Brand + one hero number + 1–3 chips + run identity |
| **Finished page diagnostics** | Understand / improve | Charts, error counts, per-station WPM |

Typing products (Monkeytype results UI, community Monkeytype SVG cards, TypeRacer finish screens) converge on the same share pattern: **WPM is the hero**, accuracy and time are supporting, and deep stats stay off the export.

For StationTypeRace, the product differentiator on Stories is **Jakarta rail identity** (line color, route, stations cleared) — not another generic WPM rectangle.

---

## 2. Metrics: Story card vs clutter

### Belong on the card (pick by style)

| Metric | Role on Stories | Notes |
|--------|-----------------|-------|
| **WPM** | Primary brag number | Always readable at arm’s length; ~48–72px+ equivalent on 1080 canvas |
| **Accuracy %** | Credibility chip | Separates clean runs from raw speed |
| **Elapsed** | Context chip | Short vs long line |
| **Line name + system** | Run identity | Ties score to a route (“Bogor Line · KRL”) |
| **Station count** | Scale flex | “24 stations” without listing all |
| **Brand** | Attribution | StationTypeRace wordmark somewhere in safe zone |

### Style-dependent (include when that style’s job needs them)

| Metric | When |
|--------|------|
| **Route string** | Route Cleared / Transit Ticket |
| **Station list / map** | Route Cleared / Pixel Rail (cap ~6–8 names or dots) |
| **Raw WPM** | Neon Score meta row only — optional; clutter elsewhere |
| **Origin → destination** | Ticket stub metaphor |

### Keep off the PNG (finished-page only)

- Per-station WPM chart, error markers, consistency
- Incorrect keystroke counts / EPM
- Perfect-station rate detail beyond a single chip
- Captions / URLs / QR codes (Stories UI already covers share; caption goes with native share text)

**Rule of thumb:** if a viewer must squint, it does not belong on the card.

---

## 3. Instagram Stories geometry & safe zones

Industry consensus (2025–2026 creator guides; IG does not publish a fixed pixel spec that never changes):

| Spec | Value |
|------|-------|
| Canvas | **1080 × 1920** (9:16) |
| Top chrome | ~**250 px** (~13%) — profile, handle, progress, close |
| Bottom chrome | ~**250 px** (~13%) — reply bar, stickers, share |
| Usable “safe” band | ~**1080 × 1420** center |

**Layout implications for StationTypeRace:**

1. Export stays **9:16** (already: `aspect-ratio: 9/16`, `captureShareCardPng` targets 1080 wide).
2. Treat **top ~12–14% and bottom ~11–13%** as chrome buffers: ambient glow, grid, ticket perforations — not the only place for WPM or brand.
3. Put **WPM / primary headline in the vertical middle third**.
4. Prefer **PNG** for neon text edges (already `html-to-image` → PNG).
5. High contrast on dark ink; line color as accent, not low-contrast fill behind small type.

Sources: [CampaignSwift safe zones](https://campaignswift.com/blog/instagram-safe-zone-sizes), [Inrō Story size 2026](https://www.inro.social/blog/instagram-story-size), [QuillBot Story size](https://quillbot.com/blog/social-media/instagram-story-size/), [Typography Master social type](https://www.typographymaster.com/guide/typography-for-social-media).

---

## 4. Style archetypes (what works & why)

| Archetype | Purpose | Hero | Support | Mood |
|-----------|---------|------|---------|------|
| **Neon Score** | Brag WPM | Giant WPM | Acc / time / raw chips, line name | Arcade scoreboard — matches existing STR neon rail |
| **Route Cleared** | Show route conquered | Vertical line + station dots | WPM + acc as side chips | Map flex — unique to this game |
| **Minimal Type** | Aesthetic / typographic flex | Oversized WPM only | Tiny brand + line | Quiet flex; high contrast, lots of negative space |
| **Transit Ticket** | Playful identity | Boarding-pass stub + big WPM fare | Vertical FROM→TO legs, stops/acc/time | Collectible stub; stacked route avoids name collision |
| **Monas Poster** | Jakarta landmark flex | WPM as monument flame | Line + acc/time chips | Night sky silhouette poster |
| **Pixel Rail** | Brand mascot flex | Pixel train + rail | WPM badge, station chips | 8-bit Jakarta neon — product signature |

Each style should change **layout hierarchy**, not only palette. Recolor-only “themes” underperform as a picker because the Story still reads as the same card.

### Aesthetic lock for this product

- **Keep:** dark ink (`#050b12` / `#071018`), Syne + JetBrains Mono, `--line` color, cyan/pink neon accents, amber `--signal`.
- **Avoid:** purple-on-white gradients, cream editorial serif/terracotta (wrong domain), stock landmark photos (copyright + clutter at Story size).

---

## 5. What competitors imply (typing share patterns)

- **Monkeytype on-screen:** rich diagnostics; share/community cards still lead with WPM + accuracy + mode — not the full chart ([monkeytypecard](https://github.com/Xander-Murray/monkeytypecard)-style SVGs).
- **StationTypeRace prior brief** (`2026-07-11-typing-performance-results-ui.md`): share stays lean; chart stays on finished page — still correct.

---

## 6. Implementation mapping (shipped)

| Variant id | Label | Primary job |
|------------|-------|-------------|
| `neon` | Neon Score | Brag WPM |
| `route` | Route Cleared | Show line + stops |
| `minimal` | Minimal Type | Typographic WPM |
| `ticket` | Transit Ticket | Boarding-pass metaphor |
| `monas` | Monas Poster | Night silhouette; WPM as monument light |
| `pixel` | Pixel Rail | Pixel train brand |

UX: finished page style picker updates live `ShareCard` preview; Save/Share still use `data-share-card` + `captureShareCardPng`.

---

## 7. Checklist for any new variant

- [ ] 9:16, container queries for type scale  
- [ ] Brand present  
- [ ] `--line` used as accent  
- [ ] Hero readable when preview is ~280px wide (and at 1080 export)  
- [ ] Critical type outside top/bottom chrome buffers  
- [ ] No new raster assets required  
- [ ] Distinct layout from other variants  
