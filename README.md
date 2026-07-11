# StationTypeRace

Type Jakarta rail station names one by one. Pick a **KRL**, **MRT**, or **LRT** line (or go random), type each stop while live WPM updates, then share a neon result card with your average WPM.

## How to play

1. On the homepage, choose **Random line** or pick a line under **KRL**, **MRT**, or **LRT**.
2. Type the current station name. Mistakes do not block later characters.
3. When the name is complete, press **Space** to advance (or finish the line).
4. During a race:
   - **Home** / `Esc` — back to homepage
   - **Restart** / `Alt+R` — restart the same line
   - **New line** / `Ctrl+Enter` — start a random line
5. After clearing the line, save or share the result card.

## Run locally

```bash
cd web
npm install
npm run dev
```

## Deploy to Cloudflare

The app is a static Vite SPA. It deploys with **Cloudflare Workers static assets** via Wrangler (`web/wrangler.jsonc`).

### One-time setup

1. Create a [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with **Edit Cloudflare Workers** permission.
2. Note your [Account ID](https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/).
3. Log in locally (or set secrets for CI):

```bash
cd web
npx wrangler login
```

For GitHub Actions, add repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Pushes to `main` run [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml).

### Deploy from your machine

```bash
cd web
npm install
npm run deploy
```

Preview the production build on the Workers runtime:

```bash
npm run cf:dev
```

### Alternative: Cloudflare Pages (dashboard)

Connect the GitHub repo in the Cloudflare dashboard:

| Setting | Value |
|---------|--------|
| Root directory | `web` |
| Build command | `npm run build` |
| Build output directory | `dist` |

Station list source: `docs/research/2026-07-11-station-stops-catalog.md` (operational stops only).
