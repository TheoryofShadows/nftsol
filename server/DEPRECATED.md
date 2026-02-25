# ⚠️ DEPRECATED — Legacy Server Directory

This directory contains the **legacy server** code that is no longer the active production server.

## Current Production Server

All active backend code has been consolidated into:

```
apps/backend/src/
```

## Migration Status

| Legacy Route | Status | apps/backend Equivalent |
|---|---|---|
| `routes/ai-features.ts` | ✅ Migrated | `src/routes/ai-features.ts` |
| `routes/ai-metadata.ts` | ✅ Superseded | `src/routes/grok-verification.ts` |
| `routes/clout-deployment.ts` | ✅ Superseded | `src/routes/clout.ts` |
| `routes/solana-rewards.ts` | ✅ Superseded | `src/routes/solana-tools.ts` |
| `routes/wallet-config.ts` | ✅ Superseded | `src/routes/auth.ts` |
| `routes/mint.ts` | ✅ Superseded | `src/routes/mint.ts` |
| `routes/nfts-validated.ts` | ✅ Superseded | `src/routes/nfts.ts` |
| `clout-system.ts` | ✅ Superseded | `src/services/cloutToken.ts` |
| `ai-features-service.ts` | ✅ Superseded | `src/utils/grokpedia-production.ts` |
| `enhanced-solana-api.ts` | ✅ Superseded | `src/services/rpc-failover.ts` |
| `recommendation-engine.ts` | ✅ Superseded | `src/routes/recommendations.ts` |

## Do NOT use this directory for new development.

All new features should be added to `apps/backend/src/`.

**Last updated:** February 2026
