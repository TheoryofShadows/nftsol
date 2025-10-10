# Clout Rewards Economics

This document captures the fee model and reward distribution formula that the
NFTSol platform uses. The goals are:

1. **Sustainable incentives** – platform fees stay below competing marketplaces
   while seeding a reward pool for engaged users.
2. **Perpetual developer royalty** – the creator wallet receives a 1% cut on
   every transaction, hard-baked into the on-chain programs so forks inherit it.
3. **Transparent reward math** – every user can calculate their monthly payout
   based on on-chain activity (buying, selling, creating, and social actions).

## 1. Platform Fee Split

Let `gross_price` be the amount paid by the buyer for any transaction executed
on the marketplace (primary or secondary sale). The platform fee is defined as:

```
platform_fee(gross_price) = gross_price * F
```

Where `F` (the fee rate) satisfies:

- `F <= 1.75%` (kept below the lowest major competitor fee to stay attractive).
- Default configuration: `F = 1.50%`.

The platform fee is split into the following fixed buckets:

| Component                  | Formula                                   | Purpose                                       |
|---------------------------|--------------------------------------------|-----------------------------------------------|
| **Developer Royalty**     | `dev_cut = gross_price * 1.00%`            | Hard-baked payout to the project creater; immutable for forks |
| **Rewards Pool Funding**  | `rewards_cut = gross_price * (F - 1.00%) * R` | Sends capital to the monthly Clout rewards pool |
| **Ops/Treasury Reserve**  | `ops_cut = gross_price * (F - 1.00%) * (1 - R)` | Funds maintenance, liquidity, and emergency buffers |

Where `R` (reward funding ratio) defaults to `75%`. This produces:

```
dev_cut          = gross_price * 0.0100
rewards_cut      = gross_price * 0.00375  // if F = 1.5% and R = 75%
ops_cut          = gross_price * 0.00125
```

All fee math is performed in lamports. The 0.50% residual (after the developer cut)
is split 75/25 between rewards and ops; any rounding dust is assigned to the ops
treasury so totals always balance.

Any program or fork must enforce the `dev_cut` transfer prior to settlement to
uphold the royalty guarantee.

## 2. Clout Score Accumulation

Each wallet earns **Clout Points** for actions performed on the platform within
the monthly reward cycle. Actions are weighted to reflect their platform value
and encourage diverse participation.

Let:

- `B` = number of NFTs bought
- `S` = number of NFTs sold
- `C` = number of NFT collections/items created
- `L` = number of listings created that receive engagement (views/favourites)
- `I` = number of social interactions (comments, follows, shares) that pass quality filters

Weights (tunable via governance):

| Action                | Variable | Weight (`w`) |
|-----------------------|----------|--------------|
| Purchase NFT          | `B`      | `w_B = 8`    |
| Sell NFT              | `S`      | `w_S = 5`    |
| Create NFT/Collection | `C`      | `w_C = 12`   |
| Listing Engagement    | `L`      | `w_L = 3`    |
| Social Interaction    | `I`      | `w_I = 1`    |

The base monthly Clout score for wallet `u` is:

```
clout_raw(u) = w_B * B_u + w_S * S_u + w_C * C_u + w_L * L_u + w_I * I_u
```

To discourage spam, the system applies diminishing returns beyond activity
thresholds. Define soft caps:

- `cap_B = 200` buys
- `cap_S = 200` sells
- `cap_I = 1000` social interactions

For activity above a cap, only 25% of the excess contributes to points. (Example: `(B_u - cap_B) * w_B * 0.25`). Listing engagement only counts if the listing receives a minimum number of unique visitors or favourites, filtered via analytics.

The final monthly score normalises the raw score by active days to reward
consistency:

```
active_days(u) = number of days in the reward cycle with ≥ 1 qualifying action
clout_score(u) = clout_raw(u) * log1p(active_days(u))
```

Using `log1p` prevents streak-gaming while still increasing rewards for users
active throughout the month.

## 3. Monthly Reward Distribution

Let `P_month` be the reward pool balance allocated for the monthly payout
(aggregate of `rewards_cut` lambdas plus carryover). Define:

```
total_score = Σ clout_score(u) over all users with clout_score > 0
user_share(u) = clout_score(u) / total_score
reward(u) = user_share(u) * P_month * payout_ratio
```

Where `payout_ratio` defaults to `0.9` (90% of the pool distributed monthly;
10% carried forward or reserved for audits). Users with `clout_score(u) < threshold` (e.g., 25 points) only earn non-monetary badges to prevent micro-payout overhead.

## 4. Implementation Notes

- The fee splits must live in `market_escrow` settlement to guarantee the dev fee and reward funding. Hardcode the dev wallet Pubkey at the program level. Forks inherit this constant.
- Clout scoring uses Analytics/SQL in the short term. For full decentralisation, emit events (e.g., `CloutAction`) and compute `clout_raw` via an off-chain indexer feeding into the loyalty registry CPI.
- Store monthly reward snapshots in `loyalty_registry` (new account type) so payouts can be audited and replayed.
- Provide a `/api/solana/rewards/monthly` endpoint that surfaces `clout_score(u)`, rank, and projected reward before payouts close.
- Sale receipts include the lamports transferred to the developer wallet so downstream analytics can reconcile the hard-baked royalty.

## 5. Future Enhancements

1. **Real-world assets (RWA)** – introduce an RWA activity multiplier for compliant, high-value transactions (e.g., property tokens) while maintaining the fee ceiling.
2. **Quadratic bonus** – add a community bonus where top contributors vote to double a small percentage of the reward pool for curated creators.
3. **Fraud guard** – integrate reputation or machine-learning detection to discount Sybil behaviour before finalising `clout_score(u)`.

---

This formula set gives the project creator a guaranteed revenue stream, keeps the platform fee lower than competitors, and drives sustained user engagement with clear maths. Update Anchor programs and builders to reference these constants directly so forks can’t override them without modifying the on-chain code. 
