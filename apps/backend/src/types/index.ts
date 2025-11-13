// Core Types for NFTSol Backend
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
  };
}

export interface MintRequest {
  name: string;
  description: string;
  imageUrl?: string;
  file?: Express.Multer.File;
  creatorWallet: string;
  owner?: string;
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

export interface ProgramConfig {
  cloutProgramId: string;
  marketProgramId: string;
  loyaltyProgramId: string;
  rewardsVault: string;
}

export interface SolanaConfig {
  rpcUrl: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
  cluster: 'devnet' | 'testnet' | 'mainnet-beta';
}

export interface DatabaseConfig {
  url: string;
  ssl: boolean | { rejectUnauthorized?: boolean };
  pool: {
    min: number;
    max: number;
  };
}

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  fileUpload: {
    maxSize: number;
    allowedTypes: string[];
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  requestId?: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
