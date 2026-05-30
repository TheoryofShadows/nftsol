# CLAUDE.md — AI Assistant Guide for NFTSol

**Version:** 3.1
**Last Updated:** May 2026
**Purpose:** Orientation for AI assistants working on the NFTSol codebase

> For setup, tech stack, commit rules, and deployment — see [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [TECHNICAL-DOCS.md](TECHNICAL-DOCS.md). This file covers only what's specific to working with AI tools on this repo.

---

## Repository Overview

**NFTSol** is an enterprise NFT marketplace on Solana — minting, marketplace, video NFTs with AI verification, CLOUT reward token, compressed NFTs via Bubblegum, and the collaborative Eternal Echoes feature.

**Production URLs**
- App: https://nftsol.app (Netlify, custom domain)
- Backend API: https://nftsol.onrender.com (Render)
- Docs site: https://theoryofshadows.github.io/nftsol/ (GitHub Pages)
- Repo: https://github.com/TheoryofShadows/nftsol

For full architecture, system diagrams, and API reference, see [TECHNICAL-DOCS.md](TECHNICAL-DOCS.md).

---

## Codebase map (where to find things)

```
nftsol/
├── client/                 # Frontend React app (Vite)
│   └── src/
│       ├── components/    # Shared UI
│       ├── hooks/         # Custom hooks (useCloutBalance, useNfts, etc.)
│       ├── services/      # API client layer
│       ├── context/       # React contexts
│       ├── config/        # Client config (wallet adapters, RPC)
│       ├── echo/          # Eternal Echoes feature
│       └── wallet/        # Phantom provider helper (modal wallets configured via @solana/wallet-adapter-wallets in config/wallet.ts)
│
├── apps/
│   ├── backend/          # Main backend (Express + Drizzle)
│   │   └── src/{routes,controllers,services,middleware,config,db,lib,utils,workers,types,index.ts}
│   └── smart-contracts/  # Anchor workspace
│       ├── Anchor.toml
│       └── programs/eternal_echoes/   # Anchor 0.29 program
│
├── shared/               # Cross-cutting code (types, constants, config, validation, utils, services)
├── docs/                 # User-facing guides → published to GitHub Pages (Jekyll, Cayman theme)
└── .github/workflows/    # ci.yml, deploy.yml, pages.yml, rust-clippy.yml, codeql.yml
```

> The legacy top-level `server/` directory has been removed. All backend code now lives under `apps/backend/`.

---

## AI-specific conventions

These supplement (don't replace) [CONTRIBUTING.md](CONTRIBUTING.md).

### When you must check before editing
- **Solana mainnet code** — This handles real assets. Don't change RPC URLs, mint addresses, or vault addresses without explicit confirmation. Constants of note:
  - CLOUT mint: `26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab` (env: `CLOUT_MINT` / `CLOUT_PROGRAM_ID`)
  - Rewards owner: `3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad` (env: `REWARDS_OWNER`)
  - Rewards vault: **auto-derived** as the deterministic ATA of `REWARDS_OWNER + CLOUT_MINT` via `getRewardsVaultAddress()` / `getOrCreateCloutVault()` in `apps/backend/src/utils/clout-vault.ts` — do not hardcode.
  - Platform secret: `PLATFORM_SECRET_KEY_BASE58` — never log, never commit, never include in outputs.

### Path aliases
```typescript
import { Button } from '@/components/Button';      // client/src/*
import { NFT } from '@shared/types';                // shared/*
```

### Prefer existing utilities over new ones
- Errors: `@shared/utils/errors` (`AppError`, `NotFoundError`, `ValidationError`)
- Logging — not `console.log`. Backend/shared code: `@shared/utils/logger` (structured logs). Client code: `client/src/utils/logger.ts` (`logger`, styled console output, dev-gated).
- Validation: `@shared/validation/schemas` (Zod)
- Constants: `@shared/constants` — no inline magic numbers

### Don't introduce
- New backend frameworks or ORMs (stay on Express + Drizzle)
- Direct `console.log` in committed code (use `logger`)
- Bare `throw new Error(...)` in service/route code (use the custom error classes)
- `.js` extensions in TypeScript local imports
- New API response shapes — stick to the `{ success, data }` / `{ success, error }` envelope

---

## Common task playbook

**Adding an API endpoint**
1. Create the handler under `apps/backend/src/routes/` — match the surrounding pattern (Express `Router`, export default).
2. Mount it in `apps/backend/src/index.ts` (search for `app.use('/api/...')`). Versioned endpoints go on the `apiV1` router; feature routers mount under `/api/<feature>`.
3. Document the endpoint in `TECHNICAL-DOCS.md` under "API Reference" and, if user-facing, add an example to `docs/API_EXAMPLES.md`.

**Adding a React component**
1. New file under `client/src/components/` (or feature folder like `echo/`, `wallet/`).
2. Function component, named export, props interface above.
3. Use Tailwind utility classes — the design system already exists; don't add ad-hoc CSS files unless necessary.

**Working with the wallet**
- Use `useWallet()` from `@solana/wallet-adapter-react` — don't roll your own connection logic. Adapters are configured in `client/src/config/wallet.ts` (`getWalletAdapters()`).
- The `client/src/wallet/` folder contains a Phantom-specific provider helper (`getProvider.ts`, `usePhantom.tsx`) used in a few places; new code should prefer the standard wallet-adapter hooks.
- Connection RPC: `import.meta.env.VITE_SOLANA_RPC_URL` (or `VITE_HELIUS_API_KEY`) on the client, `process.env.SOLANA_RPC_URL` on the server.

**Working with CLOUT**
- Backend: instantiate `CloutTokenService` from `apps/backend/src/services/cloutToken.ts` and call `distributeCloutRewards(...)` — don't manually craft SPL transfers. The service handles ATA creation, vault derivation, and decimals (CLOUT uses 9).

---

## Troubleshooting cheatsheet

| Symptom | First thing to check |
| --- | --- |
| `EADDRINUSE` on 3001 | `npx kill-port 3001` |
| TS path-alias not resolving | tsconfig `paths` and Vite `resolve.alias` |
| Wallet adapter not connecting | Wallet extension installed + unlocked, RPC URL reachable, cluster matches |
| RPC rate-limiting | Switch to Helius/QuickNode RPC, never public RPC in prod |
| DB connection refused | `DATABASE_URL` set, Postgres running, migrations applied |
| Pages workflow failing | See `.github/workflows/pages.yml`; common: theme not in `_config.yml`, or Pages source not set to "GitHub Actions" in repo settings |

For deeper troubleshooting, see [TECHNICAL-DOCS.md → Troubleshooting](TECHNICAL-DOCS.md#troubleshooting).

---

## Pre-PR checklist for AI changes

- [ ] `npm run lint` passes in the directory(ies) you touched
- [ ] `npm run build` passes for client and/or backend
- [ ] No new `console.log`s; use `logger`
- [ ] No secrets in code or commits
- [ ] Updated `TECHNICAL-DOCS.md` if you added/changed an API endpoint
- [ ] Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- [ ] Tests added or updated where logic changed

---

**Maintainer:** NFTSol Team · **License:** MIT
