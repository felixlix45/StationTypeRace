# AGENTS.md

## Cursor Cloud specific instructions

StationTypeRace is a single static Vite + React 19 (TypeScript) SPA. All app code and tooling live in `web/`; run every command from there.

- Dev server: `npm run dev` (Vite on `http://localhost:5173`). `server.allowedHosts` is `true` in `web/vite.config.ts` for tunnel/LAN previews.
- Lint: `npm run lint` (oxlint). A handful of `react`/`react-hooks` warnings are pre-existing and non-blocking; exit code is 0.
- Build: `npm run build` (`tsc -b && vite build`, outputs to `web/dist`).
- Deploy commands (`npm run deploy`, `npm run cf:dev`) target Cloudflare Workers via Wrangler and need Cloudflare credentials — not needed for local development.

Notes:
- `web/vite.config.ts` reads the git short SHA via `git rev-parse` (falls back to `dev`); the repo is a git checkout so this works without extra setup.
- Scripts in `web/scripts/*.mjs` are ADB/Playwright mobile-audit repros; they require a device/emulator or Playwright browsers and are not part of the normal dev/test loop.
