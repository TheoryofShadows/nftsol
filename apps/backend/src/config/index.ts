import { config } from 'dotenv';
import { AppConfig, SolanaConfig, DatabaseConfig, ProgramConfig } from '../types';

config();

// Environment validation with defaults
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'SOLANA_RPC_DEVNET',
  'CLOUT_PROGRAM_ID',
  'MARKET_PROGRAM_ID',
  'LOYALTY_PROGRAM_ID',
  'REWARDS_VAULT'
];

// Set defaults for development
if (process.env.NODE_ENV !== 'production') {
  process.env.SOLANA_RPC_DEVNET = process.env.SOLANA_RPC_DEVNET || 'https://api.devnet.solana.com';
  process.env.CLOUT_PROGRAM_ID = process.env.CLOUT_PROGRAM_ID || 'CE9VN3Bkh4Mn77GSTdfhf7KNpUKeqpmMX7s8463EFvJE';
  process.env.MARKET_PROGRAM_ID = process.env.MARKET_PROGRAM_ID || 'HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7';
  process.env.LOYALTY_PROGRAM_ID = process.env.LOYALTY_PROGRAM_ID || '2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9';
  process.env.REWARDS_VAULT = process.env.REWARDS_VAULT || 'EkwwFmeS32L7Lei1vMwF66LCN2RuM7kfNZZ6HCmyvwuN';
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const appConfig: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://nftsol.app'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  }
};

export const solanaConfig: SolanaConfig = {
  rpcUrl: process.env.SOLANA_RPC_DEVNET || 'https://api.devnet.solana.com',
  commitment: 'confirmed',
  cluster: 'devnet'
};

export const databaseConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL || '',
  ssl: process.env.NODE_ENV === 'production',
  pool: {
    min: 2,
    max: 10
  }
};

export const programConfig: ProgramConfig = {
  cloutProgramId: process.env.CLOUT_PROGRAM_ID || '',
  marketProgramId: process.env.MARKET_PROGRAM_ID || '',
  loyaltyProgramId: process.env.LOYALTY_PROGRAM_ID || '',
  rewardsVault: process.env.REWARDS_VAULT || ''
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
