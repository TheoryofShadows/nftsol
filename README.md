# NFTSol Platform

Clean Solana tooling for the NFTSol stack. The repository now ships as a
two-package workspace:

- `server/` – Express API with Helius-powered NFT lookups
- `client/` – Vite/React front-end wired for the proxy + wallet demo

The root `package.json` orchestrates both packages (`npm run dev`, `npm run build`, etc.).

## Quick start

```bash
git clone https://github.com/TheoryofShadows/nftsol.git
cd nftsol

# install root + workspace dependencies
npm install
npm run bootstrap

# run both server and client together
npm run dev
```

The dev command launches:

- Express API on `http://127.0.0.1:3000`
- Vite client on `http://127.0.0.1:5173`

Use `npm run dev:server` or `npm run dev:client` to run them individually.

## Environment configuration

- Copy `.env.example` → `.env` at the repository root for server defaults.
- Copy `client/.env.example` → `client/.env` for client settings.
- Render/Netlify deployment variables are defined in `render.yaml`.

Key server variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `3000`) |
| `ALLOWED_ORIGINS` | Comma-separated production origins |
| `DEV_ALLOWED_ORIGINS` | Comma-separated development origins |
| `SOLANA_CLUSTER` | `mainnet-beta`, `devnet`, etc. |
| `HELIUS_API_KEY` | Secret API key for Helius |
| `HELIUS_RPC_URL` / `HELIUS_REST_URL` | Override RPC/REST endpoints (optional) |

The new `server/src/config/environment.ts` normalises and validates these values
using `zod`, guaranteeing consistent runtime behaviour.

## Production builds

```bash
npm run build        # builds server + client
npm run build:server # server only
npm run build:client # client only
npm run start        # start compiled server (uses /server/dist)
```

## Deployment

- Render deployment definitions live in `render.yaml` (staging + prod).
- `npm run bootstrap` is used by the Render build command to install server dependencies.
- Netlify clients can use `client/vite.config.netlify.js` for environment-specific builds.

Refer to `docs/environment-setup.md` (added in this cleanup) for a full matrix of
development vs. production variables and helper scripts.

## Cleaning & structure

This cleanup removed legacy artifacts:

- Old monolithic server TypeScript files (now superseded by `server/src`)
- Checked-in secret keypairs (`secrets/` now ignored with a README placeholder)
- Routes/solana-worker scaffolding, build logs, and `.bak` files
- React component backups (`client/src/App.bak`, etc.)

The repository only tracks source code, documentation, and deployment manifests,
making dev/prod separation explicit.
