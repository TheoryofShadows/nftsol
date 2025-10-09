# Optimization, Security, and Solana Integration Roadmap

## Priorities (P0 → P2)

- P0: Ship-ready hardening and live data
  - Enable prod rate limiting and correct middleware order (DONE)
  - Serve built client assets in production via Express (DONE)
  - Cross-platform Anchor build script (DONE)
  - Dev DB fallback without crashing (DONE)
  - Vite bundle split for wallet/recharts/react (DONE)
  - Set mainnet RPC defaults with env overrides (DONE)
- P1: Replace mocks and finalize data flow
  - Social trading: backfill from real endpoints; keep demo fallback
  - Replace remaining placeholder images/links with collection images
  - Finish IDL generation path and runtime checks
- P2: Observability and CI
  - Add minimal smoke tests for APIs
  - Add bundle analyzer and size budgets
  - Add dependency audit and weekly renovate

## Concrete Tasks

- Client bundle and UX
  - Add React/Recharts/Wallet chunks; keep sourcemaps off in prod
  - Lazy-load large dashboards and wallet UI (already lazy pages)
  - Track analytics only in prod
- Server performance
  - Cache Magic Eden responses for 60–120s
  - Add ETag/Cache-Control for public endpoints (partially done)
  - Stream logs with request IDs (DONE)
- Security
  - CORS via ALLOWED_ORIGINS env (DONE)
  - Helmet CSP tightened; keep minimal GA origin if needed
  - Enable rate limit in prod (DONE)
  - Sanitize inputs + validation (DONE)
  - JWT handling and admin IP gate present
- Solana integration
  - Use mainnet RPC by default; dev can override with VITE_SOLANA_RPC_URL (DONE)
  - Anchor IDLs present; service loads them at runtime
  - Rewards vault/staking provider is wired with env overrides

## Cleanups/Infra

- Remove unused legacy frontend folder references over time
- Verify domains and secrets in deployment provider; remove redundant integrations

## Next Up

- Add simple in-memory cache for Magic Eden endpoints
- Add minimal health checks for RPC and Helius on boot
- Add script: `npm run analyze` for bundle visualization
