# CLAUDE.md — AI Assistant Guide for NFTSol

**Version:** 3.0
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
│       ├── hooks/         # Custom hooks (useCloutBalance, useNfts, useWallet)
│       ├── services/      # API client layer
│       ├── context/       # React contexts
│       ├── echo/          # Eternal Echoes feature
│       └── wallet/        # Wallet adapters
│
├── server/                # Legacy server (still partly active)
│   ├── routes/           # ai-features, ai-metadata, clout-deployment, solana-rewards, wallet-config
│   └── services/         # clout-system, ai-features-service, enhanced-solana-api, recommendation-engine, etc.
│
├── apps/
│   ├── backend/          # Main backend (Express + Drizzle)
│   │   └── src/{routes,services,middleware,config,lib,index.ts}
│   └── smart-contracts/  # Anchor programs (eternal_echoes)
│
├── shared/               # Cross-cutting code (types, constants, config, validation, utils)
├── docs/                 # User-facing guides → published to GitHub Pages
└── .github/workflows/    # ci.yml, deploy.yml, pages.yml, rust-clippy.yml, codeql.yml
```

**Dual server caveat:** `server/` and `apps/backend/` coexist during migration. When touching backend code, check `git log -- <path>` to see which copy is live.

---

## AI-specific conventions

These supplement (don't replace) [CONTRIBUTING.md](CONTRIBUTING.md).

### When you must check before editing
- **`server/` vs `apps/backend/`** — Before modifying a backend file, confirm which copy is wired up (look at `apps/backend/src/index.ts` mounts and `server/index.ts` mounts).
- **Solana mainnet code** — This handles real assets. Don't change RPC URLs, mint addresses, or vault addresses without explicit confirmation. Constants of note:
  - CLOUT mint: `26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab`
  - Rewards vault: `7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v`
  - Platform secret: `PLATFORM_SECRET_KEY_BASE58` — never log, never commit, never include in outputs.

### Path aliases
```typescript
import { Button } from '@/components/Button';      // client/src/*
import { NFT } from '@shared/types';                // shared/*
```

### Prefer existing utilities over new ones
- Errors: `@shared/utils/errors` (`AppError`, `NotFoundError`, `ValidationError`)
- Logging: `@shared/utils/logger` — not `console.log`
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
1. Create handler in `server/routes/` *or* `apps/backend/src/routes/` — match the surrounding pattern.
2. Mount in the corresponding `index.ts`.
3. Document the endpoint in `TECHNICAL-DOCS.md` under "API Reference".

**Adding a React component**
1. New file under `client/src/components/` (or feature folder like `echo/`, `wallet/`).
2. Function component, named export, props interface above.
3. Use Tailwind utility classes — the design system already exists; don't add ad-hoc CSS files unless necessary.

**Working with the wallet**
- Use `useWallet()` from `@solana/wallet-adapter-react` — don't roll your own connection logic.
- Connection RPC: `import.meta.env.VITE_SOLANA_RPC_URL` on client, `process.env.SOLANA_RPC_URL` on server.

**Working with CLOUT**
- Backend: call `cloutService.distributeReward(address, amount, reason)` — don't manually craft SPL transfers.

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
- [ ] No new files in the deprecated `server/` tree if `apps/backend/` already has the equivalent
- [ ] Updated `TECHNICAL-DOCS.md` if you added/changed an API endpoint
- [ ] Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- [ ] Tests added or updated where logic changed

---

**Maintainer:** NFTSol Team · **License:** MIT
