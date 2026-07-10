# StationTypeRace

Type Jakarta rail station names one by one. A random KRL, MRT, or LRT line is picked; you type each stop while live WPM updates, then see your average WPM at the end.

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
