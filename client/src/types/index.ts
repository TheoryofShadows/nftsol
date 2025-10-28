// Core Types for NFTSol Frontend
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
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  itemCount: number;
  createdAt: string;
}

export interface WalletInfo {
  address: string;
  balance: number;
  exists: boolean;
  solBalance: string;
}

export interface ProgramConfig {
  cloutProgramId: string;
  marketProgramId: string;
  loyaltyProgramId: string;
  rewardsVault: string;
  cluster: 'devnet' | 'testnet' | 'mainnet-beta';
  rpcUrl: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface MintRequest {
  name: string;
  description: string;
  imageUrl?: string;
  file?: File;
  creatorWallet: string;
}

export interface MintResponse {
  success: boolean;
  mint?: string;
  uri?: string;
  mintAddress?: string;
  signature?: string;
  message?: string;
  error?: string;
}

export interface MarketData {
  nfts: NFT[];
  total: number;
  page: number;
  limit: number;
}

export interface AppState {
  nfts: NFT[];
  collections: Collection[];
  wallet: WalletInfo | null;
  programs: ProgramConfig | null;
  loading: boolean;
  error: string | null;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
  accent: string;
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
}
