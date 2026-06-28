/**
 * 💰 NFTSol Fee Configuration
 * Single source of truth for all marketplace fees and payments
 *
 * @creator NFTSol Team
 * @license MIT
 */

/**
 * Marketplace Fee Structure
 * Applied to all NFT sales on the platform
 *
 * Example: 10 SOL sale
 * - Seller: 9.55 SOL (95.5%)
 * - Creator: 0.25 SOL (2.5%)
 * - Developer: 0.10 SOL (1.0%)
 * - CLOUT Treasury: 0.10 SOL (1.0%)
 * - TOTAL: 10.00 SOL ✓
 */
export const MARKETPLACE_FEES = {
  /** Amount to seller (95.5%) */
  SELLER: 0.955,

  /** Creator royalty percentage (2.5%) */
  CREATOR: 0.025,

  /** Developer/platform revenue (1.0%) */
  DEVELOPER: 0.01,

  /** CLOUT community rewards funding (1.0%) */
  CLOUT_TREASURY: 0.01,

  /** Compressed NFT basis points (500 bps = 5%) */
  COMPRESSED_NFT_BPS: 500,

  /** Standard NFT basis points (250 bps = 2.5%) */
  STANDARD_NFT_BPS: 250,

  /** Maximum creator royalty (50%) */
  MAX_CREATOR_ROYALTY: 0.5,

  /** Minimum transaction threshold for royalties */
  MIN_ROYALTY_THRESHOLD: 0.0001, // 0.0001 SOL

  /** Minimum payout to prevent dust */
  MIN_PAYOUT_AMOUNT: 0.001, // 0.001 SOL
} as const;

/**
 * Verify fee structure sums to 100%
 */
export const verifyFeeStructure = (): boolean => {
  const total = MARKETPLACE_FEES.SELLER +
                MARKETPLACE_FEES.CREATOR +
                MARKETPLACE_FEES.DEVELOPER +
                MARKETPLACE_FEES.CLOUT_TREASURY;

  return Math.abs(total - 1.0) < 0.0001; // Allow for floating point errors
};

/**
 * Calculate fees for a transaction
 */
export function calculateMarketplaceFees(priceInSol: number) {
  return {
    sellerAmount: priceInSol * MARKETPLACE_FEES.SELLER,
    creatorAmount: priceInSol * MARKETPLACE_FEES.CREATOR,
    developerAmount: priceInSol * MARKETPLACE_FEES.DEVELOPER,
    cloutTreasuryAmount: priceInSol * MARKETPLACE_FEES.CLOUT_TREASURY,
    totalFees: priceInSol * (MARKETPLACE_FEES.CREATOR + MARKETPLACE_FEES.DEVELOPER + MARKETPLACE_FEES.CLOUT_TREASURY),
  };
}

/**
 * CLOUT Token Reward Rates
 * Incentivize different platform activities
 */
export const CLOUT_REWARDS = {
  /** Daily login bonus */
  DAILY_LOGIN: 10,

  /** Reward for purchasing NFT */
  NFT_PURCHASE: 50,

  /** Reward for selling NFT */
  NFT_SALE: 100,

  /** Bonus for receiving creator royalties */
  CREATOR_ROYALTY_RECEIPT: 200,

  /** Reward for successful referral */
  REFERRAL: 25,

  /** Reward for minting Echo NFT */
  ECHO_MINT: 50,

  /** Reward for verified echo contribution (min-max range) */
  ECHO_VERIFICATION_MIN: 20,
  ECHO_VERIFICATION_MAX: 50,

  /** One-time bonus for creator's first sale */
  FIRST_SALE_BONUS: 300,

  /** Creator milestone bonuses (at 10, 50, 100+ sales) */
  CREATOR_MILESTONE: 500,

  /** Reward for community engagement */
  COMMUNITY_POST: 5,

  /** Reward for marketplace review */
  MARKETPLACE_REVIEW: 10,
} as const;

/**
 * CLOUT Token Supply Allocation
 * Total: 1 billion CLOUT tokens
 */
export const CLOUT_SUPPLY_ALLOCATION = {
  /** Community rewards and user incentives */
  COMMUNITY_REWARDS: 0.60, // 600M tokens (60%)

  /** Team development and operations */
  TEAM_DEVELOPMENT: 0.20, // 200M tokens (20%)

  /** Marketing and strategic partnerships */
  MARKETING: 0.15, // 150M tokens (15%)

  /** Emergency reserve and stability */
  RESERVE: 0.05, // 50M tokens (5%)
} as const;

/**
 * CLOUT Distribution Safety Limits
 * Prevent runaway token distribution and abuse
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

/**
 * Verify supply allocation sums to 100%
 */
export const verifySupplyAllocation = (): boolean => {
  const total = Object.values(CLOUT_SUPPLY_ALLOCATION).reduce((a, b) => a + b, 0);
  return Math.abs(total - 1.0) < 0.0001;
};

/**
 * Platform Wallet Configuration
 * These addresses receive platform fees and manage treasuries
 */
export const PLATFORM_WALLET_PURPOSES = {
  DEVELOPER: 'Platform operations, development, and revenue',
  CLOUT_TREASURY: 'Community rewards and CLOUT token distribution',
  MARKETPLACE_TREASURY: 'Operational reserves and contingency fund',
  CREATOR_ESCROW: 'Temporary holding for creator royalty payouts',
} as const;

/**
 * Transaction Confirmation Settings
 */
export const TRANSACTION_SETTINGS = {
  /** Commitment level for confirmations */
  COMMITMENT: 'confirmed' as const,

  /** Number of confirmations to wait */
  MIN_CONFIRMATIONS: 6,

  /** Maximum retries for transaction sending */
  MAX_RETRIES: 3,

  /** Timeout for transaction confirmation (ms) */
  CONFIRMATION_TIMEOUT: 30000,

  /** Default transaction fee buffer (lamports) */
  FEE_BUFFER: 5000,
} as const;

/**
 * Example: Calculate fees for different sale prices
 */
export function feeExamples() {
  const prices = [1, 10, 100, 1000];

  return prices.map(price => ({
    salePrice: `${price} SOL`,
    breakdown: calculateMarketplaceFees(price),
  }));
}

// Verify on import
if (!verifyFeeStructure()) {
  console.warn('⚠️ WARNING: Marketplace fees do not sum to 100%');
}

if (!verifySupplyAllocation()) {
  console.warn('⚠️ WARNING: CLOUT supply allocation does not sum to 100%');
}
