# Solana Rewards Integration Summary

This document captures the current integration state between the on-chain
programs (`rewards_vault`, `clout_staking`, `market_escrow`,
`loyalty_registry`) and the NFTSol Node/React runtimes.

## 1. Backend Surface Area

- **Service Layer** (`server/solana-rewards-service.ts`)
  - Fetches staking pools and user positions via Anchor IDLs.
  - Builds unsigned stake/unstake/harvest transactions for wallet signing and
    partially signs flows that require the platform authority (harvest, loyalty
    bonuses, marketplace settlements).
  - Derives PDAs for vault signers, settlement receipts, and loyalty profiles.
- **Express Router** (`server/routes/solana-rewards.ts`)
  - `GET /api/solana/rewards/staking/:mint?owner=<pubkey>` – pool snapshot +
    optional position.
  - `POST /api/solana/rewards/staking/transactions/stake` – base64 stake tx.
  - `POST /api/solana/rewards/staking/transactions/unstake` – base64 unstake tx.
  - `POST /api/solana/rewards/staking/transactions/harvest` – harvest tx
    pre-signed by the platform authority.
  - `POST /api/solana/rewards/loyalty/transactions/record` – loyalty activity
    tx with authority partial signature.
  - `POST /api/solana/rewards/market/transactions/settle` – escrow settlement
    tx with authority partial signature.
- **Provider Wiring** (`server/solana-rewards-provider.ts`)
  - Centralises RPC URL, program IDs, and optional admin keypair.
  - Loads the generated IDLs under `anchor/solana_rewards/generated` and exposes
    a memoised singleton service.

## 2. Generated Artifacts

- Versioned IDLs live under `anchor/solana_rewards/generated/idl` with matching
  TypeScript stubs in `generated/types`.
- `npm run anchor:build` (with the Solana SBF toolchain installed) compiles the
  workspace; `npm run anchor:generate` copies IDLs and emits the TS bindings.
- `scripts/generate-anchor-clients.mjs`, `scripts/solana/deploy-devnet.sh`, and
  `scripts/solana/setup-toolchain.ps1` automate IDL generation, devnet deploys,
  and toolchain setup.

## 3. React Experience

- **Hook** (`client/src/hooks/use-solana-rewards.ts`)
  - Retrieves pool/position data, derives token accounts, and requests
    stake/unstake/harvest transactions from the backend.
  - Signs via the connected wallet (`window.solana.signAndSendTransaction`) and
  confirms before refreshing local state.
- **UI** (`client/src/components/clout-utility-center.tsx`)
  - “On-chain” tab displays staking totals, pending rewards, and last update.
  - Provides stake/unstake inputs plus a harvest action that consumes the new
    REST endpoints.
  - Shows contextual messaging when rewards are pending and requires users to
    co-sign authority-partial transactions.
- **Configuration**
  - `VITE_CLOUT_STAKING_MINT` selects the staking mint (defaults to the
    placeholder PDA).
  - `VITE_SOLANA_RPC_URL` controls the connection endpoint (devnet by default).

## 4. Remaining Work

1. **Toolchain & CI**
   - Install `cargo-build-sbf` (or Anchor Docker) locally and in CI so `anchor
     build` produces real IDLs.
   - Wire `npm run anchor:build && npm run anchor:generate` + `anchor test` into
     the pipeline with cacheable artifacts.
2. **Program Coverage**
   - Expand Anchor programs with fully wired CPI flows (escrow → loyalty,
     staking → rewards vault) and add integration tests to guard regressions.
   - Add settlement builders for listings/escrow PDAs to reduce manual PDA
     derivation on the client.
3. **Runtime Convergence**
   - Migrate legacy `/api/clout/*` routes to the Anchor-backed implementations,
     deprecating the in-memory reward bookkeeping.
   - Extend the React experience to cover marketplace settlement, loyalty
     leaderboards, and governance once on-chain flows are production-ready.
   - Validate the devnet UX end-to-end and plan a mainnet deployment with
     environment-driven program IDs.

Keep `docs/anchor-roadmap.md` updated as new milestones land, and coordinate any
breaking program ID changes via the shared deployment scripts.
