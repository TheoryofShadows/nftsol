/**
 * Shared Types Package
 * Types shared between client and server
 * This ensures type safety across the entire application
 */

// ============================================================================
// Core Domain Types
// ============================================================================

export interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  owner: string;
  mintAddress: string;
  signature?: string;
  price?: string;
  createdAt?: string;
  updatedAt?: string;
  attributes?: NFTAttribute[];
  collection?: string;
  verified?: boolean;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  nftCount?: number;
  floorPrice?: string;
}

export interface WalletInfo {
  address: string;
  balance: number;
  nfts: NFT[];
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  from: string;
  to: string;
  amount: number;
  timestamp: string;
  signature?: string;
  status: TransactionStatus;
}

export type TransactionType = 
  | 'mint' 
  | 'transfer' 
  | 'sale' 
  | 'withdrawal' 
  | 'reward' 
  | 'stake';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Marketplace Types
// ============================================================================

export interface MarketData {
  nfts: NFT[];
  collections: Collection[];
  stats?: MarketplaceStats;
}

export interface MarketplaceStats {
  totalNFTs: number;
  listedNFTs: number;
  soldNFTs: number;
  totalVolume: number;
  floorPrice: number;
  averagePrice: number;
}

// ============================================================================
// Minting Types
// ============================================================================

export interface MintRequest {
  name: string;
  description: string;
  creatorWallet: string;
  file?: File;
  imageUrl?: string;
  attributes?: NFTAttribute[];
  collection?: string;
}

export interface MintResponse {
  mintAddress: string;
  signature: string;
  nft: NFT;
  transactionUrl?: string;
}

// ============================================================================
// Program Configuration
// ============================================================================

export interface ProgramConfig {
  mintProgram?: string;
  tokenProgram?: string;
  metadataProgram?: string;
  cloutProgramId?: string;
  marketProgramId?: string;
  loyaltyProgramId?: string;
  rewardsVault?: string;
  cluster: 'devnet' | 'testnet' | 'mainnet-beta';
  rpcUrl: string;
}

// ============================================================================
// Echo/Eternal Echoes Types
// ============================================================================

export interface Echo {
  id: string;
  ledgerId: string;
  echoData: string;
  echoType: EchoType;
  videoUri?: string;
  contributor: string;
  grokVerified: boolean;
  verificationScore: number;
  timestamp: string;
}

export type EchoType = 'Text' | 'Audio' | 'Annotation' | 'Video';

export interface EchoStats {
  totalLayers: number;
  totalLedgers: number;
  avgTruthScore: number;
  trendingCount: number;
}

// ============================================================================
// CLOUT Token Types
// ============================================================================

export interface CloutBalance {
  address: string;
  balance: number;
  token: string;
  lastUpdated?: string;
}

export interface CloutReward {
  type: CloutRewardType;
  amount: number;
  reason: string;
  timestamp: string;
}

export type CloutRewardType = 
  | 'dailyLogin' 
  | 'nftPurchase' 
  | 'nftSale' 
  | 'creatorRoyalty' 
  | 'referral' 
  | 'communityPost' 
  | 'nftCreation' 
  | 'firstSale' 
  | 'creatorMilestone';

// ============================================================================
// Error Types
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  stack?: string;
}

export type ErrorCode = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'WALLET_ERROR'
  | 'TRANSACTION_ERROR';

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  email?: string;
  createdAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  displayName?: string;
}

// ============================================================================
// Platform Wallet Types
// ============================================================================

export type PlatformWalletKey = 
  | 'DEVELOPER' 
  | 'CLOUT_TREASURY' 
  | 'MARKETPLACE_TREASURY' 
  | 'CREATOR_ESCROW';

export interface PlatformWallet {
  key: PlatformWalletKey;
  label: string;
  publicKey: string;
  purpose: string;
  source: 'env' | 'placeholder';
}

