# Research Brief: Jakarta KRL Commuter Line (Jabodetabek)

**Date:** 2026-07-11  
**Purpose:** Source material for Station Type Race — Indonesian station names as typing prompts  
**Scope:** Electrified KRL Commuterline serving Greater Jakarta (Jabodetabek) and Lebak (Rangkasbitung), not Yogyakarta or other KAI Commuter regions  
**Status:** Research only — no application code

---

## 1. Operator & branding

| Item | Detail | Source |
|------|--------|--------|
| **Legal entity** | PT Kereta Commuter Indonesia | [KAI Commuter – Informasi Umum](https://kci.id/tentang-kami/informasi-umum), [Wikipedia: KAI Commuter](https://en.wikipedia.org/wiki/KAI_Commuter) |
| **Trade name** | **KAI Commuter** (rebranded 28 Sep 2020) | [Wikipedia: KAI Commuter](https://en.wikipedia.org/wiki/KAI_Commuter) |
| **Former names** | PT KAI Commuter Jabodetabek (KCJ, from 15 Sep 2008); renamed PT Kereta Commuter Indonesia (KCI) on 19 Sep 2017 | [Jakarta.go.id – Commuter Line](https://www.jakarta.go.id/index.php/commuter-line), [Wikipedia: KAI Commuter](https://en.wikipedia.org/wiki/KAI_Commuter) |
| **Parent** | PT Kereta Api Indonesia (Persero) | Same as above |
| **Service brand** | **KRL Commuter Line** / **Commuterline** / **KRL Commuterline** | [id.wikipedia.org/wiki/KRL_Commuter_Line](https://id.wikipedia.org/wiki/KRL_Commuter_Line), [kci.id](https://kci.id) |
| **“KRL” meaning** | *Kereta Rel Listrik* (electric rail train) | Standard Indonesian railway terminology; see [KRL Commuter Line (ID)](https://id.wikipedia.org/wiki/KRL_Commuter_Line) |
| **Official sites** | [https://kci.id](https://kci.id), also referenced as [commuterline.id](https://www.commuterline.id) | Operator sites |
| **Passenger app** | C-Access (schedules, maps) | [kci.id Peta Rute](https://kci.id/perjalanan-krl/peta-rute) |

**Historical branding arc (for game flavor / copy accuracy):**

- Colonial / early: *Elektrische Staatsspoorwegen* (from 1925)  
- Late 20th c.: KRL Jabotabek → KRL Jabodetabek (after Depok became a city, 1999)  
- 2011+ modernization: simplified colored lines, “Commuterline” branding  
- 2017+: KRL Commuter Line under KCI / KAI Commuter  

Sources: [Jakarta.go.id](https://www.jakarta.go.id/index.php/commuter-line), [id.wikipedia.org/wiki/KRL_Commuter_Line](https://id.wikipedia.org/wiki/KRL_Commuter_Line).

**Ridership (context only):** Operator site cites ~1,200,000 passengers/day; Jakarta.go.id (2023 page) cites ~700,000–850,000/day — figures vary by year and methodology. Prefer not to hard-code a single number in game UI without a dated citation. Sources: [kci.id Informasi Umum](https://kci.id/tentang-kami/informasi-umum), [Jakarta.go.id](https://www.jakarta.go.id/index.php/commuter-line).

---

## 2. Current lines / corridors (Jabodetabek)

As of the **May 2022 Manggarai switchover**, Jabodetabek KRL operates **five main electrified lines** (the former “Loop Line” was absorbed into Bogor + Cikarang). Sources: [id.wikipedia.org/wiki/KRL_Commuter_Line](https://id.wikipedia.org/wiki/KRL_Commuter_Line), [Tempo route summary](https://www.tempo.co/ekonomi/peta-rute-krl-jabodetabek-2024-terbaru-penumpang-wajib-tahu-25490), English line articles below.

| Map color | Official / common name | Code (post-2022) | Primary termini | Approx. length | Notes |
|-----------|------------------------|------------------|-----------------|----------------|-------|
| **Red** | Commuter Line Bogor / Bogor Line | B | Jakarta Kota ↔ Bogor; branch Jakarta Kota ↔ Nambo | ~54.8 km (Bogor); ~51 km (Nambo) | Busiest line; formerly “Central Line” (C) until May 2022 |
| **Blue** | Commuter Line Cikarang / Cikarang Loop Line | C | Cikarang / Bekasi ↔ loop via Jatinegara–Manggarai–Kampung Bandan (full/half “racket”) | ~87.4 km (full loop pattern) | Formerly Bekasi / Cikarang Line; loop pattern since 28 May 2022 |
| **Green** | Commuter Line Rangkasbitung / Rangkasbitung Line | R | Tanah Abang ↔ Rangkasbitung | ~72.8 km | Longest corridor; extends into Lebak, Banten |
| **Brown** | Commuter Line Tangerang / Tangerang Line | T | Duri ↔ Tangerang | ~19.3 km | Short western feeder |
| **Pink** | Commuter Line Tanjung Priok / Tanjung Priok Line | TP | Jakarta Kota ↔ Tanjung Priuk | ~8–15 km (sources differ on measured segment) | Shortest; feeder / port corridor |

**Line article sources:**

- Bogor: [en.wikipedia.org/wiki/KAI_Commuter_Bogor_Line](https://en.wikipedia.org/wiki/KAI_Commuter_Bogor_Line)  
- Cikarang: [en.wikipedia.org/wiki/KAI_Commuter_Cikarang_Loop_Line](https://en.wikipedia.org/wiki/KAI_Commuter_Cikarang_Loop_Line)  
- Rangkasbitung: [en.wikipedia.org/wiki/KAI_Commuter_Rangkasbitung_Line](https://en.wikipedia.org/wiki/KAI_Commuter_Rangkasbitung_Line)  
- Tangerang: [en.wikipedia.org/wiki/KAI_Commuter_Tangerang_Line](https://en.wikipedia.org/wiki/KAI_Commuter_Tangerang_Line)  
- Tanjung Priok: [en.wikipedia.org/wiki/KAI_Commuter_Tanjung_Priok_Line](https://en.wikipedia.org/wiki/KAI_Commuter_Tanjung_Priok_Line)  
- Network overview: [id.wikipedia.org/wiki/KRL_Commuter_Line](https://id.wikipedia.org/wiki/KRL_Commuter_Line)

**Uncertainty — “7 lines” vs “5 lines”:** Jakarta.go.id (Apr 2023) still says “7 jalur/lin” and “418 km,” which matches older counting (pre-2022 Loop Line + sometimes Merak/Airport). Prefer **5 electrified Jabodetabek KRL lines** for game filters. Source conflict: [Jakarta.go.id](https://www.jakarta.go.id/index.php/commuter-line) vs [id.wikipedia.org route table](https://id.wikipedia.org/wiki/KRL_Commuter_Line).

**Related KAI Commuter services often confused with KRL (exclude from core Jabodetabek KRL prompt set unless explicitly scoped):**

| Service | Why exclude from core KRL set |
|---------|-------------------------------|
| **KA Bandara Soekarno-Hatta** (Airport Rail Link) | Separate product; operated by KAI Commuter since 2023 but not a colored KRL line | [kci.id Informasi Umum](https://kci.id/tentang-kami/informasi-umum), [Wikipedia: KAI Commuter](https://en.wikipedia.org/wiki/KAI_Commuter) |
| **Merak Commuter Line** (Rangkasbitung–Merak) | Diesel local, not electrified KRL | [Tempo](https://www.tempo.co/ekonomi/peta-rute-krl-jabodetabek-2024-terbaru-penumpang-wajib-tahu-25490), [Wikipedia: KAI Commuter](https://en.wikipedia.org/wiki/KAI_Commuter) |
| **Yogyakarta Commuter Line** | Outside Jabodetabek | [id.wikipedia.org/wiki/KRL_Commuter_Line](https://id.wikipedia.org/wiki/KRL_Commuter_Line) |

---

## 3. Network facts

| Fact | Value | Confidence | Source |
|------|-------|------------|--------|
| Active Jabodetabek KRL lines | **5** | High | ID/EN Wikipedia line articles; Tempo 2024 map article |
| Station count (Jabodetabek KRL) | **~80** unique (EN Wikipedia / KAI Commuter services table); **93** (Jakarta.go.id & ID Wikipedia infobox) | **Medium — conflict** | [Wikipedia: KAI Commuter](https://en.wikipedia.org/wiki/KAI_Commuter) (80); [Jakarta.go.id](https://www.jakarta.go.id/index.php/commuter-line) (93); [id.wikipedia](https://id.wikipedia.org/wiki/KRL_Commuter_Line) (93) |
| Cities / regions served | Jakarta (DKI), Depok, Bogor (city + regency), Tangerang (city + regency), South Tangerang, Bekasi (city + regency), Lebak (Rangkasbitung) | High | Line locale tables on EN Wikipedia |
| Track gauge | 1,067 mm (Cape gauge) | High | Line articles |
| Electrification | 1,500 V DC overhead | High | Same |
| Major 2022 change | Loop Line deactivated; Cikarang becomes loop (“racket”); Bogor absorbs Nambo; Central→Bogor rename | High | [Bogor Line](https://en.wikipedia.org/wiki/KAI_Commuter_Bogor_Line), [Cikarang Loop Line](https://en.wikipedia.org/wiki/KAI_Commuter_Cikarang_Loop_Line), [id.wikipedia](https://id.wikipedia.org/wiki/KRL_Commuter_Line) |
| Recent station openings (2026) | **Jatake** (Rangkasbitung Line, 28 Jan 2026); **Jakarta International Stadium / JIS** (Tanjung Priok Line, limited ops from 22 Jun 2026) | High (news + Wikipedia) | [GNFI / CNN cite via Wikipedia](https://en.wikipedia.org/wiki/KAI_Commuter_Rangkasbitung_Line), [ANTARA JIS](https://www.antaranews.com/berita/5618336/stasiun-jis-mulai-layani-commuter-line-tanjung-priok-akses-ke-kawasan-stadion-makin-praktis), [JIS station Wikipedia](https://en.wikipedia.org/wiki/Jakarta_International_Stadium_railway_station) |
| Planned / not yet active | Gambir KRL stop (planned reopen for Commuterline); Sukaresmi (Bogor); Gunung Putri rebuild; extensions toward Serang/Merak, Cikampek, Sukabumi | Speculative for game | Line Wikipedia “proposed” sections |

**Recommended station-count wording for the game:** “About 80–90 stations on Jabodetabek KRL,” or compute a definitive unique set from the appendix below after one official map pass.

---

## 4. Station name quirks (typing-game gold)

### 4.1 Spelling / spacing variants (verify against official map before shipping)

| Preferred for game (Wikipedia EN station tables) | Common alternate | Risk |
|--------------------------------------------------|------------------|------|
| **Tanjung Priuk** (station / line articles often use *Priuk*) | Tanjung Priok (very common Indonesian place spelling) | High — players will type either |
| **Jurangmangu** | Jurang Mangu | Medium |
| **Metland Telagamurni** | Metland Telaga Murni | Medium–high |
| **Bojong Gede** | Bojonggede | Medium |
| **Parung Panjang** | Parungpanjang | Medium |
| **Pondok Cina** | Pondok China | Medium (English false friend) |
| **Rawa Buntu** | Rawabuntu | Low–medium |
| **Rawa Buaya** | Rawabuaya | Low–medium |
| **Jakarta Kota** | Kota, Batavia (historical) | Medium |
| **Jakarta International Stadium** | JIS, Stasiun JIS | High — English full name vs acronym |

Sources: EN Wikipedia station tables for each line; news articles for Jatake/JIS often mix spaced forms (e.g. “Jurang Mangu” in [GNFI Jatake](https://www.goodnewsfromindonesia.id/2026/01/30/stasiun-jatake-resmi-beroperasi-cek-rute-lengkapnya)).

### 4.2 Multi-word & long names (harder prompts)

- Pasar Minggu Baru, Pasar Minggu  
- Universitas Pancasila, Universitas Indonesia  
- Pondok Ranji, Pondok Cina, Pondok Jati, Pondok Rajeg  
- Gang Sentiong  
- Klender Baru, Bekasi Timur, Depok Baru  
- Tanah Abang, Tanah Tinggi  
- Jakarta International Stadium  
- Metland Telagamurni  

### 4.3 Similar / confusable pairs

| Pair | Why hard |
|------|----------|
| Depok / Depok Baru | Same city, different stops |
| Pasar Minggu / Pasar Minggu Baru | Differ by one word |
| Klender / Klender Baru | Same |
| Bekasi / Bekasi Timur | Same |
| Kampung Bandan / Mangga Besar / Manggarai | “Mangga-” / “Mang-” family |
| Rawa Buntu / Rawa Buaya | Same first word |
| Pondok * (Cina, Ranji, Jati, Rajeg) | Shared prefix |
| Cikarang / Cikoya / Cilejit / Cibinong / Cilebut / Cisauk / Cicayur / Citeras / Cakung | Many “Ci-” stations |
| Tangerang / Tanah Tinggi / Tanah Abang | “Tan-” cluster |
| Juanda / Jayakarta | Short “J-” names |

### 4.4 English / brand / institutional mix

- **BNI City** (airport-link interchange; formerly associated with Sudirman Baru / Kakap naming history) — English + bank brand  
- **Universitas Indonesia**, **Universitas Pancasila**  
- **Jakarta International Stadium**  
- **Metland Telagamurni** (property brand + place)  

Source: [Cikarang Loop Line stations](https://en.wikipedia.org/wiki/KAI_Commuter_Cikarang_Loop_Line), [Bogor Line](https://en.wikipedia.org/wiki/KAI_Commuter_Bogor_Line).

### 4.5 Pass-through / special cases (do not invent as normal stops)

| Station | Status | Note |
|---------|--------|------|
| **Gambir** | Pass-through for KRL (intercity focus); planned Commuterline stop | Do not treat as active KRL prompt unless confirmed open | [Bogor Line](https://en.wikipedia.org/wiki/KAI_Commuter_Bogor_Line) |
| **Pasar Senen** | One-way stop on Cikarang counterclockwise services | Still a real station name | [Cikarang Loop Line](https://en.wikipedia.org/wiki/KAI_Commuter_Cikarang_Loop_Line) |
| **JIS** | Limited / directional ops at opening (westbound-only temporary platform reported) | Flag as new / verify | [JIS Wikipedia](https://en.wikipedia.org/wiki/Jakarta_International_Stadium_railway_station) |
| Ghost / closed (not prompts) | Mampang, Cipinang (depot), Pondok Betung (closed), etc. | Exclude | Line articles |

### 4.6 Renames & branding history (optional lore / hard mode)

- Central Line → **Bogor Line** (2022)  
- Bekasi / Cikarang Line → **Cikarang Loop Line** (2022)  
- BNI City naming (branded station)  
- Historical: Batavia Zuid → Jakarta Kota; Meester Cornelis → Jatinegara  

---

## 5. Related systems — NOT KRL (keep app scope clear)

| System | Operator / owner | What it is | Official / gov ref |
|--------|------------------|------------|--------------------|
| **MRT Jakarta** | PT MRT Jakarta (Perseroda), Pemprov DKI | Metro (Lebak Bulus–Bundaran HI Phase 1, ~13 stations) | [jakarta.go.id/mrt](https://www.jakarta.go.id/mrt) |
| **LRT Jakarta** | PT LRT Jakarta / JakPro | Light rail within Jakarta (e.g. Pegangsaan Dua–Velodrome) | [jakarta.go.id/lrt](https://www.jakarta.go.id/lrt) |
| **LRT Jabodebek** | KAI LRT Jabodebek Division (central gov project) | Regional LRT Jakarta–Bogor–Depok–Bekasi | [Kompas explanation](https://www.kompas.id/artikel/en-lrt-jakarta-dan-lrt-jabodebek-serupa-tetapi-berbeda-karakter); overview [Greater Jakarta Integrated Mass Transit](https://en.wikipedia.org/wiki/Greater_Jakarta_Integrated_Mass_Transit_System) |
| **TransJakarta** | PT Transportasi Jakarta | BRT / bus network | Same integrated-transit overview |
| **Whoosh (KCIC)** | KCIC | High-speed Jakarta–Bandung | Same overview |
| **KA Bandara** | KAI Commuter (ops) | Airport rail link — related operator, different product | [kci.id](https://kci.id/tentang-kami/informasi-umum) |

**Game rule of thumb:** If it is not on the red/blue/green/brown/pink KRL map, it is out of scope for “KRL station” prompts.

---

## 6. Data sources for station name strings

| Source | Best for | Caveats | URL |
|--------|----------|---------|-----|
| **KAI Commuter official route map + C-Access** | Canonical display names & colors | Map is image-heavy on web; scrape carefully / manual transcription | [kci.id/perjalanan-krl/peta-rute](https://kci.id/perjalanan-krl/peta-rute) |
| **EN Wikipedia line station tables** | Structured ordered lists with codes | Community-edited; lag on brand-new stations; spelling may differ from signage | Line URLs in §2 |
| **ID Wikipedia KRL Commuter Line** | Network narrative, Indonesian naming | Station lists less complete than EN line pages | [id.wikipedia.org/wiki/KRL_Commuter_Line](https://id.wikipedia.org/wiki/KRL_Commuter_Line) |
| **Jakarta.go.id Commuter Line** | Gov summary stats | Station count / line count may be stale | [jakarta.go.id/commuter-line](https://www.jakarta.go.id/index.php/commuter-line) |
| **Hubnet Kemenhub – Daftar Stasiun KA** | National station registry fields (`namobj`, etc.) | Not KRL-line-scoped; includes all KA stations | [hubnet.kemenhub.go.id dataset](https://hubnet.kemenhub.go.id/dataset/content/dataset/424) |
| **OpenStreetMap** | Coordinates, `name` / `name:id` tags | Spelling inconsistent; good for geo, not sole authority for typing strings | [OSM Indonesia example](http://openstreetmap.or.id/blog/estimating-travel-time-for-the-krl-route-from-bogor-to-jakarta-kota-using-openstreetmap-data/) |
| **Public GTFS** | Ideal if available | **No widely cited official public KRL GTFS** found in this research; do not assume one exists | — |
| **Tempo / Antara / Detik** | Recent openings | Secondary; always cross-check map | e.g. [Tempo 2024 routes](https://www.tempo.co/ekonomi/peta-rute-krl-jabodetabek-2024-terbaru-penumpang-wajib-tahu-25490) |

### Recommendation for Station Type Race

1. **Primary string authority:** Official KAI Commuter route map / C-Access station labels (photograph or export).  
2. **Secondary structure:** EN Wikipedia ordered station tables (codes B01, C15, etc.).  
3. **Tertiary QA:** Hubnet `namobj` + OSM `name:id` for conflicts.  
4. Store **aliases** (Priok/Priuk, JIS/Jakarta International Stadium) for fuzzy accept / hard-mode exact match.  
5. **Do not invent** stations; exclude planned-only (Sukaresmi, Gunung Putri, etc.) until operational.

---

## Appendix A — Station lists by line

> **Method:** Compiled from English Wikipedia station tables (primary structured source), cross-checked against Tempo’s 2024 public route list and 2026 news for Jatake / JIS.  
> **Spelling:** As in EN Wikipedia tables unless noted.  
> **†** Shared interchange (appears on multiple lines).  
> **⚠** Uncertainty / verify on official map before shipping.  
> **Planned / inactive stations are listed separately and must not be used as prompts.**

### A.1 Bogor Line (Red) — Jakarta Kota → Bogor / Nambo

**Sources:** [KAI Commuter Bogor Line](https://en.wikipedia.org/wiki/KAI_Commuter_Bogor_Line), [Tempo](https://www.tempo.co/ekonomi/peta-rute-krl-jabodetabek-2024-terbaru-penumpang-wajib-tahu-25490)

**Core (toward Bogor/Nambo):**

1. Jakarta Kota †  
2. Jayakarta  
3. Mangga Besar  
4. Sawah Besar  
5. Juanda  
6. Gondangdia  
7. Cikini  
8. Manggarai †  
9. Tebet  
10. Cawang  
11. Duren Kalibata  
12. Pasar Minggu Baru  
13. Pasar Minggu  
14. Tanjung Barat  
15. Lenteng Agung  
16. Universitas Pancasila  
17. Universitas Indonesia  
18. Pondok Cina  
19. Depok Baru  
20. Depok  
21. Citayam  

**Bogor branch (from Citayam):**

22. Bojong Gede  
23. Cilebut  
24. Bogor  

**Nambo branch (from Citayam):**

22b. Pondok Rajeg  
23b. Cibinong  
24b. Nambo  

**Not active KRL prompts:**

- Gambir — pass-through / planned Commuterline stop ⚠  
- Sukaresmi — planned  
- Gunung Putri — planned / reconstruction  

**Active count (this line, unique names):** 27 (24 Bogor path including Jakarta Kota–Bogor, plus 3 Nambo-only: Pondok Rajeg, Cibinong, Nambo; Gambir excluded).

---

### A.2 Cikarang Loop Line (Blue)

**Sources:** [KAI Commuter Cikarang Loop Line](https://en.wikipedia.org/wiki/KAI_Commuter_Cikarang_Loop_Line), [Tempo](https://www.tempo.co/ekonomi/peta-rute-krl-jabodetabek-2024-terbaru-penumpang-wajib-tahu-25490)

**Loop / city section (order varies by clockwise vs counterclockwise):**

1. Jatinegara † (loop junction)  
2. Pondok Jati  
3. Kramat  
4. Gang Sentiong  
5. Pasar Senen ⚠ (typically counterclockwise / northbound only)  
6. Kemayoran  
7. Rajawali  
8. Kampung Bandan †  
9. Angke  
10. Duri †  
11. Tanah Abang †  
12. Karet  
13. BNI City † (Airport Rail Link interchange)  
14. Sudirman  
15. Manggarai †  
16. Matraman  

**East / Bekasi–Cikarang section:**

17. Klender  
18. Buaran  
19. Klender Baru  
20. Cakung  
21. Kranji  
22. Bekasi  
23. Bekasi Timur  
24. Tambun  
25. Cibitung  
26. Metland Telagamurni ⚠ (also seen as “Metland Telaga Murni”)  
27. Cikarang  

**Exclude:** Mampang (ghost), Cipinang (depot / ghost).

**Active count (this line):** ~27 named stops (including shared interchanges).

---

### A.3 Rangkasbitung Line (Green) — Tanah Abang → Rangkasbitung

**Sources:** [KAI Commuter Rangkasbitung Line](https://en.wikipedia.org/wiki/KAI_Commuter_Rangkasbitung_Line); Jatake: [GNFI 2026-01-30](https://www.goodnewsfromindonesia.id/2026/01/30/stasiun-jatake-resmi-beroperasi-cek-rute-lengkapnya), Wikipedia cites CNN Indonesia 2026-01-28

1. Tanah Abang †  
2. Palmerah  
3. Kebayoran  
4. Pondok Ranji  
5. Jurangmangu ⚠ (also “Jurang Mangu”)  
6. Sudimara  
7. Rawa Buntu  
8. Serpong  
9. Cisauk  
10. Cicayur  
11. **Jatake** (opened 28 Jan 2026)  
12. Parung Panjang  
13. Cilejit  
14. Daru  
15. Tenjo  
16. Tigaraksa  
17. Cikoya  
18. Maja  
19. Citeras  
20. Rangkasbitung  

**Planned (exclude):** Parayasa, Tigaraksa Podomoro, etc.

**Active count:** 20

---

### A.4 Tangerang Line (Brown) — Duri → Tangerang

**Sources:** [KAI Commuter Tangerang Line](https://en.wikipedia.org/wiki/KAI_Commuter_Tangerang_Line), [Tempo](https://www.tempo.co/ekonomi/peta-rute-krl-jabodetabek-2024-terbaru-penumpang-wajib-tahu-25490)

1. Duri †  
2. Grogol  
3. Pesing  
4. Taman Kota  
5. Bojong Indah  
6. Rawa Buaya  
7. Kalideres  
8. Poris  
9. Batu Ceper † (Airport Rail Link interchange)  
10. Tanah Tinggi  
11. Tangerang  

**Active count:** 11

---

### A.5 Tanjung Priok Line (Pink) — Jakarta Kota → Tanjung Priuk

**Sources:** [KAI Commuter Tanjung Priok Line](https://en.wikipedia.org/wiki/KAI_Commuter_Tanjung_Priok_Line); JIS: [ANTARA 2026-06-22](https://www.antaranews.com/berita/5618336/stasiun-jis-mulai-layani-commuter-line-tanjung-priok-akses-ke-kawasan-stadion-makin-praktis), [JIS station Wikipedia](https://en.wikipedia.org/wiki/Jakarta_International_Stadium_railway_station)

1. Jakarta Kota †  
2. Kampung Bandan †  
3. Ancol  
4. **Jakarta International Stadium** (JIS) — limited operations from 22 Jun 2026; ⚠ directional / temporary platform reported  
5. Tanjung Priuk ⚠ (place name often “Tanjung Priok”)  

**Active count:** 5 (verify JIS bidirectionality before treating as full stop)

---

### A.6 Approximate unique-station rollup (Jabodetabek KRL only)

Summing unique names from A.1–A.5 (shared hubs counted once) yields on the order of **~80–85** active passenger stations, consistent with the [KAI Commuter services table “80”](https://en.wikipedia.org/wiki/KAI_Commuter) and below the [Jakarta.go.id “93”](https://www.jakarta.go.id/index.php/commuter-line) figure (which may include other services or older counting).

**Do not treat this rollup as a certified official census** until reconciled against one official map export.

---

## Appendix B — Quick reference: line filters for the game

| Filter ID | Label (EN) | Label (ID) | Color |
|-----------|------------|------------|-------|
| `bogor` | Bogor Line | Lin Bogor | Red |
| `cikarang` | Cikarang Loop Line | Lin Lingkar Cikarang | Blue |
| `rangkasbitung` | Rangkasbitung Line | Lin Rangkasbitung | Green |
| `tangerang` | Tangerang Line | Lin Tangerang | Brown |
| `tanjung_priok` | Tanjung Priok Line | Lin Tanjung Priok | Pink |

Optional secondary filters: `jakarta_only`, `bekasi_corridor`, `banten_corridor`, `multi_word`, `ci_prefix`, `new_2026`.

---

## Appendix C — Source checklist

| # | Source | Type | Used for |
|---|--------|------|----------|
| 1 | https://kci.id/tentang-kami/informasi-umum | Official | Operator, ridership claim, history milestones |
| 2 | https://kci.id/perjalanan-krl/peta-rute | Official | Canonical map pointer |
| 3 | https://www.jakarta.go.id/index.php/commuter-line | Local gov | Station count 93, branding history, coverage |
| 4 | https://id.wikipedia.org/wiki/KRL_Commuter_Line | Encyclopedia | Network overview, 5-line post-2022 structure |
| 5 | https://en.wikipedia.org/wiki/KAI_Commuter | Encyclopedia | Legal name, services table (80 stations) |
| 6 | https://en.wikipedia.org/wiki/KAI_Commuter_Bogor_Line | Encyclopedia | Red line stations |
| 7 | https://en.wikipedia.org/wiki/KAI_Commuter_Cikarang_Loop_Line | Encyclopedia | Blue line stations / loop patterns |
| 8 | https://en.wikipedia.org/wiki/KAI_Commuter_Rangkasbitung_Line | Encyclopedia | Green line stations + Jatake |
| 9 | https://en.wikipedia.org/wiki/KAI_Commuter_Tangerang_Line | Encyclopedia | Brown line stations |
| 10 | https://en.wikipedia.org/wiki/KAI_Commuter_Tanjung_Priok_Line | Encyclopedia | Pink line stations |
| 11 | https://www.tempo.co/ekonomi/peta-rute-krl-jabodetabek-2024-terbaru-penumpang-wajib-tahu-25490 | News (secondary) | Public station order lists |
| 12 | https://www.antaranews.com/berita/5618336/stasiun-jis-mulai-layani-commuter-line-tanjung-priok-akses-ke-kawasan-stadion-makin-praktis | News | JIS opening 2026 |
| 13 | https://en.wikipedia.org/wiki/Jakarta_International_Stadium_railway_station | Encyclopedia | JIS operational caveats |
| 14 | https://www.goodnewsfromindonesia.id/2026/01/30/stasiun-jatake-resmi-beroperasi-cek-rute-lengkapnya | News | Jatake opening + green-line order |
| 15 | https://www.jakarta.go.id/mrt | Local gov | MRT ≠ KRL |
| 16 | https://www.jakarta.go.id/lrt | Local gov | LRT Jakarta ≠ KRL |
| 17 | https://en.wikipedia.org/wiki/Greater_Jakarta_Integrated_Mass_Transit_System | Encyclopedia | Modal distinction overview |
| 18 | https://hubnet.kemenhub.go.id/dataset/content/dataset/424 | Gov open data | National station registry |

---

## Implications for Station Type Race

1. **Content pack size:** Plan for roughly **80–90 unique Jabodetabek KRL station strings**, not hundreds. That is enough for long sessions if you rotate lines and difficulty, but small enough to curate spellings carefully.

2. **Line filters are first-class UX:** Five color lines map cleanly to game modes (Red = longest familiar corridor; Pink = tiny “speed round”; Green = Banten / long multi-word names; Blue = loop + confusable *Klender/Bekasi* pairs).

3. **Difficulty tiers (suggested):**
   - **Easy:** Short single tokens — *Depok, Bogor, Bekasi, Cisauk, Ancol, Poris*
   - **Medium:** Two-word commons — *Tanah Abang, Pasar Minggu, Bojong Gede, Rawa Buntu*
   - **Hard:** Long / institutional / brand — *Universitas Pancasila, Metland Telagamurni, Jakarta International Stadium, Gang Sentiong*
   - **Expert:** Confusable pairs & spelling traps — *Priok vs Priuk*, *Depok Baru*, *Pondok Cina*, *Jurangmangu*

4. **Alias table is mandatory:** Official signage, Wikipedia, and news disagree on spaces and *Priok/Priuk*. Decide one **canonical display string** per station, then accept documented aliases in casual mode.

5. **Exclude aggressively:** MRT/LRT/TransJakarta/Whoosh/Airport-only/Merak-local/Yogyakarta stations keep the brand coherent (“type KRL stations”). Also exclude Gambir until it actually serves Commuterline.

6. **Freshness:** Re-check official map after any GAPEKA (schedule pattern) change; 2026 already added **Jatake** and **JIS**. Prefer a quarterly map audit over scraping blogs.

7. **Best next implementation step:** Transcribe station labels from the current [KAI Commuter Peta Rute](https://kci.id/perjalanan-krl/peta-rute) / C-Access into a JSON seed, then diff against Appendix A; resolve every ⚠ spelling before enabling hard-mode exact match.

---

*End of research brief. No station names were invented beyond those attested in the cited sources; planned-only stations are flagged and excluded from active prompt recommendations.*
