import { config } from 'dotenv';
import { AppConfig, SolanaConfig, DatabaseConfig, ProgramConfig } from '../types';
import { initializeSecrets } from '../lib/secrets-loader';

config();

// Initialize secrets from /etc/secrets/ or environment variables
initializeSecrets();

const requiredEnvVars = [
  'NODE_ENV',
  'PORT', // Render automatically sets this
  'SOLANA_RPC_URL',
  'ALLOWED_ORIGINS', // Required in production - server will throw error if missing
  // CLOUT_PROGRAM_ID has defaults, so it's optional
  // MARKET_PROGRAM_ID has defaults, so it's optional
  // LOYALTY_PROGRAM_ID has defaults, so it's optional
  // REWARDS_VAULT is auto-calculated from REWARDS_OWNER + CLOUT_MINT, so it's optional
];

if (process.env.NODE_ENV !== 'production') {
  process.env.SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  process.env.SOLANA_CLUSTER = process.env.SOLANA_CLUSTER || 'devnet';
  // Provide a safe default JWT secret in development to avoid 500s on auth routes
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-not-for-production';
}

// CLOUT token mint address (devnet: 26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab)
if (!process.env.CLOUT_MINT) {
  process.env.CLOUT_MINT = process.env.CLOUT_PROGRAM_ID || '26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab';
}
// CLOUT_PROGRAM_ID is kept for backward compatibility, but CLOUT_MINT is the actual token mint
if (!process.env.CLOUT_PROGRAM_ID) {
  process.env.CLOUT_PROGRAM_ID = process.env.CLOUT_MINT;
}

// Default program IDs (only if not set)
if (!process.env.MARKET_PROGRAM_ID) {
  process.env.MARKET_PROGRAM_ID = 'HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7';
}
if (!process.env.LOYALTY_PROGRAM_ID) {
  process.env.LOYALTY_PROGRAM_ID = '2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9';
}
// REWARDS_VAULT is auto-calculated from REWARDS_OWNER + CLOUT_MINT
// No need for hardcoded default - it will be calculated dynamically when needed

if (process.env.NODE_ENV === 'production') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      // ALLOWED_ORIGINS is checked separately in index.ts with better error message
      if (envVar === 'ALLOWED_ORIGINS') {
        continue; // Let index.ts handle this with clearer error
      }
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
  // Use CLOUT_MINT if available (actual token mint), otherwise CLOUT_PROGRAM_ID
  cloutProgramId: process.env.CLOUT_MINT || process.env.CLOUT_PROGRAM_ID || '',
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
