/**
 * CLOUT distribution safety limits — backend enforcement copy.
 *
 * These are the values the backend enforces at runtime in
 * `CloutTokenService`. They mirror `CLOUT_DISTRIBUTION_LIMITS` in
 * `shared/constants/fees.ts` (the documented single source of truth), but are
 * defined here so the backend build does not have to reach outside its
 * `rootDir` (which broke `tsc`, see TS6059). A guard test
 * (`src/__tests__/unit/cloutLimits.drift.test.ts`) fails if these ever drift
 * from the shared definition, so the two cannot silently diverge.
 */
export const CLOUT_DISTRIBUTION_LIMITS = {
  /** Total supply in whole tokens */
  TOTAL_SUPPLY: 1_000_000_000,

  /** Max community rewards pool (60% of supply) */
  MAX_COMMUNITY_POOL: 600_000_000,

  /** Max CLOUT any single wallet can receive per day */
  DAILY_WALLET_LIMIT: 1_000,

  /** Max CLOUT in a single distribution call */
  MAX_SINGLE_REWARD: 500,

  /** Max total CLOUT distributed across all wallets per day */
  DAILY_GLOBAL_LIMIT: 100_000,
} as const;
