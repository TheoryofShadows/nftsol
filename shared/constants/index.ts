/**
 * Shared Constants Package
 * Centralized constants used across client and server
 */

// ============================================================================
// API Configuration
// ============================================================================

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// ============================================================================
// Time Constants (in milliseconds)
// ============================================================================

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

// Polling intervals (optimized for performance)
export const POLLING_INTERVALS = {
  STATS: 5 * TIME.MINUTE,
  ECHOES: 1 * TIME.MINUTE,
  BALANCE: 2 * TIME.MINUTE,
  VAULT_BALANCE: 5 * TIME.MINUTE,
  MINT_COSTS: 5 * TIME.MINUTE,
  TRENDING: 2 * TIME.MINUTE,
} as const;

// Cache TTL
export const CACHE_TTL = {
  MARKETPLACE: 5 * TIME.MINUTE,
  COLLECTIONS: 10 * TIME.MINUTE,
  NFT_DETAILS: 15 * TIME.MINUTE,
  USER_PROFILE: 5 * TIME.MINUTE,
} as const;

// ============================================================================
// Request Timeouts
// ============================================================================

export const REQUEST_TIMEOUT = {
  DEFAULT: 30 * TIME.SECOND,
  LONG: 60 * TIME.SECOND,
  SHORT: 10 * TIME.SECOND,
} as const;

// ============================================================================
// Rate Limiting
// ============================================================================

export const RATE_LIMITS = {
  API: {
    WINDOW_MS: 60 * TIME.SECOND,
    MAX_REQUESTS: 100,
  },
  MARKETPLACE: {
    WINDOW_MS: 60 * TIME.SECOND,
    MAX_REQUESTS: 30,
  },
  MINT: {
    WINDOW_MS: 60 * TIME.SECOND,
    MAX_REQUESTS: 5,
  },
} as const;

// ============================================================================
// CLOUT Token Configuration
// ============================================================================

export const CLOUT_CONFIG = {
  DECIMALS: 9,
  SYMBOL: 'CLOUT',
  NAME: 'Community CLOUT Token',
  TOTAL_SUPPLY: 1_000_000_000, // 1 Billion
  
  REWARD_RATES: {
    DAILY_LOGIN: 10,
    NFT_PURCHASE: 50,
    NFT_SALE: 100,
    CREATOR_ROYALTY: 200,
    REFERRAL: 25,
    COMMUNITY_POST: 5,
    NFT_CREATION: 50,
    FIRST_SALE: 300,
    CREATOR_MILESTONE: 500,
  },
  
  DISTRIBUTION: {
    COMMUNITY_REWARDS: 0.60,
    TEAM_DEVELOPMENT: 0.20,
    MARKETING_PARTNERSHIPS: 0.15,
    RESERVE_FUND: 0.05,
  },
} as const;

// ============================================================================
// Pagination
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ============================================================================
// NFT Metadata
// ============================================================================

export const NFT_METADATA = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_ATTRIBUTES: 50,
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Invalid input. Please check your data and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
} as const;

// ============================================================================
// Environment
// ============================================================================

export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

// ============================================================================
// Solana Cluster
// ============================================================================

export type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta';

export const SOLANA_CLUSTERS: Record<SolanaCluster, string> = {
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
} as const;

