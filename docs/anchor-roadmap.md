# Solana Rewards Anchor Integration Roadmap

This document records the on-chain migration plan for NFTSol. We will keep it
updated as the Anchor workspace evolves so that engineering, product, and audit
stakeholders can stay aligned.

## 0. Current State (2025-10-07)

- `anchor_test_project/` exists but only contains a tutorial-style NFT mint
  program. It is not wired into the runtime.
- The production app (`server/`, `client/`) relies on `@solana/web3.js` helpers
  plus off-chain bookkeeping for rewards, staking, and escrow.
- We have the full React/Node marketplace and Clout reward UX live and backed by
  REST APIs.

## 1. Anchor Workspace Strategy

| Goal                             | Action                                                                 | Owner |
|----------------------------------|------------------------------------------------------------------------|-------|
| Clean baseline                   | Replace the tutorial program with a new workspace named `solana_rewards` scoped to our org. | Anchor team |
| Tooling alignment                | Pin Anchor, Solana, Rust toolchain versions; update `Anchor.toml`.     | Anchor team |
| Client generation                | Decide on `anchor build --ts` vs `@coral-xyz/anchor-client-gen`; script it into the build. | Full-stack |

### Workspace TODOs
- [ ] Run `anchor init solana_rewards` (or refactor existing workspace) and move
      it under `anchor/` to separate from legacy tests.
- [ ] Update `Anchor.toml` to include localnet, devnet, mainnet sections and
      specify provider wallet env variable.
- [ ] Add CI job for `anchor test` once programs are written.

## 2. On-chain Architecture

We will implement four core programs/modules under one workspace:

1. **Rewards Vault (`rewards_vault`)**
   - Accounts: `VaultConfig`, `EmissionSchedule`, `RewardClaim`.
   - Instructions: `init_vault`, `fund_vault`, `distribute_rewards`,
     `claim_rewards`, `slash_rewards`.
   - CPI targets: `token::mint_to`, `token::transfer`.

2. **Staking Pools (`clout_staking`)**
   - Supports time/amount-weighted staking of CLOUT + optional NFT deposits.
   - Accounts: `Pool`, `PoolAuthority`, `StakePosition`.
   - Instructions: `create_pool`, `stake`, `unstake`, `harvest`.
   - Integrates with Rewards Vault via CPI for payouts.

3. **Marketplace Escrow (`market_escrow`)**
   - Handles sale settlement and royalty splits for developer, treasury, creator,
     seller.
   - Accounts: `Escrow`, `Listing`, `SaleReceipt`.
   - Instructions: `list`, `cancel`, `execute_sale`.
   - Emits events consumed by our analytics service.

4. **Loyalty & Reputation (`loyalty_registry`)**
   - Tracks cross-marketplace activity and achievements.
  - Accounts: `LoyaltyProfile`, `Tier`, `BonusDistribution`.
   - Instructions: `register`, `record_activity`, `upgrade_tier`,
     `grant_bonus`.

## 3. Integration Plan

1. **Server (`server/`)**
   - Wrap Anchor clients inside a `SolanaRewardsService` with methods like
     `stakeClout`, `claimRewards`, `settleSale`.
   - Retrofit `/api/clout/*` routes and marketplace controllers to delegate to
     the service.
   - Maintain backward-compatible fallbacks during transition (feature flags).

2. **Client (`client/`)**
   - Use wallet adapter to sign Anchor transactions (via generated IDL).
   - Read PDAs for portfolio/marketplace state; cache via react-query.
   - Update Clout Utility Center to display on-chain balances and pool stats.

3. **Migration**
   - Phase 0: localnet + devnet testing with feature flag off.
   - Phase 1: dual-write off-chain + Anchor (shadow mode) to validate data.
   - Phase 2: cut-over to Anchor-only settlement, remove legacy bookkeeping.

## 4. Immediate Tasks (Sprint 1)

- [ ] Scaffold new Anchor workspace (`anchor/solana_rewards`) replacing the
      tutorial program.
- [ ] Draft account/instruction schemas for all four modules.
- [ ] Create base tests for `rewards_vault` (init/distribute/claim flows).
- [ ] Add build scripts (`anchor build`, `anchor test`, client generation) to
      repo CI.

## 5. Tooling & References

- Anchor docs: <https://book.anchor-lang.com/>
- Solana Program Library (SPL) token interface: `anchor-spl` crate.
- Existing off-chain reward flows: `client/src/components/clout-utility-center.tsx`,
  `server/clout-system.ts`, `client/src/utils/real-solana-transactions.ts`.

---

We’ll update this roadmap at the end of each sprint. For any questions or to
volunteer for a module, ping the `#solana-anchor` channel.
