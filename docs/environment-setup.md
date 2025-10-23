# Environment Setup

This document outlines the expectations for the two major environments the
repository targets.

## Development (`npm run dev`)

| Area | Details |
| --- | --- |
| API | Runs on `http://127.0.0.1:3000` |
| Client | Runs on `http://127.0.0.1:5173` |
| CORS | Defaults to `DEV_ALLOWED_ORIGINS` (`http://localhost:5173,http://localhost:3000`) |
| Solana | Cluster defaults to `devnet` unless overridden |
| Helius | Optional in dev – set `HELIUS_API_KEY` for live RPC queries |

Steps:

```bash
cp .env.example .env                # configure server
cp client/.env.example client/.env  # configure client
npm run dev
```

## Production

| Area | Details |
| --- | --- |
| Build | `npm run build` produces `server/dist` and `client/dist` |
| Server | `npm run start` (or the Render blueprint) serves the compiled API |
| CORS | Driven by `ALLOWED_ORIGINS` |
| Helius | `HELIUS_API_KEY` **must** be provided |
| Deployment | Render manifests live in `render.yaml`; Netlify builds use `client/vite.config.netlify.js` |

### Minimum variable checklist

```
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
ALLOWED_ORIGINS=https://nftsol.app,https://market.nftsol.app
SOLANA_CLUSTER=mainnet-beta
HELIUS_API_KEY=xxxxx
```

Optional overrides (`HELIUS_RPC_URL`, `HELIUS_REST_URL`, `HELIUS_TIMEOUT_MS`)
fine-tune RPC routing without touching code.

## Helper scripts

| Command | Description |
| --- | --- |
| `npm run bootstrap` | Installs `server` and `client` dependencies (used in CI/deploys) |
| `npm run dev:server` / `dev:client` | Run a single workspace |
| `npm run build:server` / `build:client` | Build a single workspace |

The new `server/src/config/environment.ts` centralises runtime validation, so
the API fails fast if production secrets are missing.
