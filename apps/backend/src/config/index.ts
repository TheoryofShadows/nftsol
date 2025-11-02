import { config } from 'dotenv';
import { AppConfig, SolanaConfig, DatabaseConfig, ProgramConfig } from '../types';

config();

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'SOLANA_RPC_URL',
  'CLOUT_PROGRAM_ID',
  'MARKET_PROGRAM_ID',
  'LOYALTY_PROGRAM_ID',
  'REWARDS_VAULT',
];

if (process.env.NODE_ENV !== 'production') {
  process.env.SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  process.env.SOLANA_CLUSTER = process.env.SOLANA_CLUSTER || 'devnet';
  process.env.CLOUT_PROGRAM_ID =
    process.env.CLOUT_PROGRAM_ID || '62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw';
  process.env.MARKET_PROGRAM_ID =
    process.env.MARKET_PROGRAM_ID || 'HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7';
  process.env.LOYALTY_PROGRAM_ID =
    process.env.LOYALTY_PROGRAM_ID || '2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9';
  process.env.REWARDS_VAULT =
    process.env.REWARDS_VAULT || '2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps';
}

if (process.env.NODE_ENV === 'production') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export const appConfig: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://nftsol.app',
      'https://www.nftsol.app',
      'https://market.nftsol.app',
      'https://nftsolmarket.netlify.app',
    ],
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};

export const solanaConfig: SolanaConfig = {
  rpcUrl: process.env.SOLANA_RPC_URL || process.env.SOLANA_RPC_DEVNET || 'https://api.devnet.solana.com',
  commitment: 'confirmed',
  cluster: (process.env.SOLANA_CLUSTER as 'mainnet-beta' | 'devnet' | 'testnet') || 'devnet',
};

export const databaseConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL || '',
  ssl: process.env.NODE_ENV === 'production',
  pool: {
    min: 2,
    max: 10,
  },
};

export const programConfig: ProgramConfig = {
  cloutProgramId: process.env.CLOUT_PROGRAM_ID || '',
  marketProgramId: process.env.MARKET_PROGRAM_ID || '',
  loyaltyProgramId: process.env.LOYALTY_PROGRAM_ID || '',
  rewardsVault: process.env.REWARDS_VAULT || '',
};

export const withdrawalConfig = {
  solanaRpcUrl: process.env.SOLANA_RPC_URL || process.env.SOLANA_RPC_DEVNET || 'https://api.devnet.solana.com',
  platformSecretKeyBase58: process.env.PLATFORM_SECRET_KEY_BASE58 || '',
  platformSecretKeyJson: process.env.PLATFORM_SECRET_KEY_JSON || '',
  autoApproveLamports: parseInt(process.env.WITHDRAWAL_AUTO_APPROVE_LAMPORTS || '100000000', 10), // 0.1 SOL
  dailyLimitLamports: parseInt(process.env.WITHDRAWAL_DAILY_LIMIT_LAMPORTS || '5000000000', 10), // 5 SOL
  rateLimitWindowMs: parseInt(process.env.WITHDRAWAL_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.WITHDRAWAL_RATE_LIMIT_MAX || '5', 10), // 5 requests per window
};

// Validation helpers
export const validateWalletAddress = (address: string): boolean => {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

export const validateFileType = (mimetype: string): boolean => {
  return appConfig.fileUpload.allowedTypes.includes(mimetype);
};

export const validateFileSize = (size: number): boolean => {
  return size <= appConfig.fileUpload.maxSize;
};
