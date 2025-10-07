# Anchor Program Specifications

This document describes the proposed on-chain architecture for the `solana_rewards`
workspace. It is the single source of truth for accounts, instruction flows, and
cross-program relationships prior to full implementation.

---

## 1. Rewards Vault (`rewards_vault`)

| Component | PDA / Account | Description |
|-----------|---------------|-------------|
| `VaultConfig` | `["vault", reward_mint, "config"]` | Global state for a reward mint. Stores authority, emission schedule and signer bump. |
| `VaultSigner` | `["vault", reward_mint, "signer"]` | PDA that acts as mint authority for reward distributions. |
| `RewardClaim` (future) | `["vault", reward_mint, user, "claim"]` | Tracks individual user claim state / cooldowns. |

### Instructions

1. `initialize_vault(config_bump, signer_bump)`
   - Accounts: `VaultConfig`, `VaultSigner`, `RewardMint`, `Authority`.
   - Initializes the config and seeds the signer PDA.

2. `set_emission_rate(new_rate)`
   - Authority-only update to emissions (tokens per slot or per epoch).

3. `mint_rewards(amount)`
   - Authority signs; vault signer PDA mints tokens to recipient ATA.
   - Used by staking/escrow CPI calls in production.

4. `distribute_epoch_rewards` *(future)*
   - Aggregates pending rewards for pools / loyalty bonuses on a schedule.

5. `slash_rewards(target, amount)` *(future)*
   - Reduces outstanding rewards for fraud mitigation.

---

## 2. CLOUT Staking (`clout_staking`)

| Component | PDA / Account | Description |
|-----------|---------------|-------------|
| `StakingPool` | `["pool", clout_mint]` | Defines reward rates, vault connection, accepted assets. |
| `PoolAuthority` | `["pool", clout_mint, "authority"]` | PDA controlling pool token vaults. |
| `StakePosition` | `["position", pool, owner]` | Tracks user balances, reward debt, timestamps. |
| `RewardShare` *(optional)* | `["share", pool, emission_epoch]` | Stores aggregated emissions for time slicing. |

### Instructions

1. `create_pool(reward_rate, options)`
   - Sets pool config, reward vault linkage, optional lock periods.

2. `stake(amount, asset_type)`
   - Transfers CLOUT (or NFT LP tokens) into pool vault, updates position.

3. `unstake(amount)`
   - Withdraws staked assets, handles lock / penalty logic.

4. `harvest()`
   - Computes pending rewards, CPI into `rewards_vault::mint_rewards`.

5. `compound()` *(future)*
   - Stakes harvested rewards automatically.

---

## 3. Marketplace Escrow (`market_escrow`)

| Component | PDA / Account | Description |
|-----------|---------------|-------------|
| `Listing` | `["listing", seller, mint, listing_id]` | Listing state, price, royalty info. |
| `EscrowVault` | `["escrow", listing]` | PDA that holds SOL / token payments. |
| `SaleReceipt` | `["receipt", listing, buyer]` | Immutable record of settlement. |
| `RoyaltyConfig` | `["royalty", collection]` | Defines creator split, developer fee, treasury share. |

### Instructions

1. `create_listing(price, expiration, currency)`
   - Initializes `Listing`, optionally transfers NFT into escrow.

2. `cancel_listing()`
   - Seller-only, releases NFT back if no active sale.

3. `execute_sale(buyer, price_override?)`
   - Buyer funds escrow; program verifies price, royalties, optional currency.

4. `settle_sale()`
   - Distributes funds: seller payout, developer royalty, CLOUT vault.
   - Transfers NFT to buyer if in escrow.

5. `dispute_sale()` *(future)*
   - Locks settlement, interacts with governance for arbitration.

---

## 4. Loyalty Registry (`loyalty_registry`)

| Component | PDA / Account | Description |
|-----------|---------------|-------------|
| `LoyaltyProfile` | `["profile", owner]` | Aggregate activity stats, tier, lifetime points. |
| `TierConfig` | `["tier", tier_name]` | Defines thresholds & benefits for Bronze/Silver/... |
| `BonusDistribution` | `["bonus", epoch]` | Records bonus emission events for auditing. |
| `Achievement` *(future)* | `["achievement", owner, badge_id]` | Tracks on-chain badges for achievements. |

### Instructions

1. `register_profile()`
   - Creates new profile; invoked automatically on first interaction.

2. `record_activity(volume, points)`
   - Called by marketplace/escrow program via CPI after a sale or action.

3. `upgrade_tier()`
   - Recalculates tier based on points/volume thresholds.

4. `grant_bonus(amount, reason)`
   - Adds bonus points or CLOUT via rewards vault CPI.

5. `mint_badge(badge_id)` *(future)*
   - Issues NFTs / SBTs representing achievements.

---

## 5. Cross-Program Relationships

```
clout_staking ----------> rewards_vault (harvest)
market_escrow ----------> rewards_vault (seller/buyer bonuses)
market_escrow ----------> loyalty_registry (record_activity)
loyalty_registry -------> rewards_vault (grant_bonus)
```

- All reward emissions ultimately flow through `rewards_vault`, ensuring a single source of supply control.
- `market_escrow` emits events and CPI calls to both `rewards_vault` and `loyalty_registry` so off-chain analytics remain optional.
- `loyalty_registry` can inform front-end access controls (tiers unlocking premium features).

---

## 6. Implementation Notes

1. **Governance hooks**: store authorities as PDAs controlled by future DAO/governance program.
2. **Upgradeable vs. immutable**: consider making core programs upgradeable initially, then freeze once audited.
3. **Error handling**: define shared error enums for consistent messaging across programs.
4. **Testing strategy**:
   - Unit tests in Rust for critical math (staking reward calculation).
   - Anchor TypeScript integration tests for full transaction flows.
   - End-to-end tests orchestrated from the Node server using Anchor client.

---

This spec will evolve as we implement features. Any changes should be reflected
both here and in `docs/anchor-roadmap.md`.
