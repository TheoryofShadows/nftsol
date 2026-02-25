import { config } from 'dotenv';
import path from 'path';
import { AppConfig, SolanaConfig, DatabaseConfig, ProgramConfig } from '../types';
import { initializeSecrets } from '../lib/secrets-loader';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../../.env') });

// Initialize any secrets if needed
initializeSecrets();

// Validate required environment variables at startup (fail fast in production)
const REQUIRED_PROD_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SOLANA_RPC_URL',
] as const;

if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_PROD_ENV_VARS.filter(
    (key) => !process.env[key] || process.env[key] === ''
  );
  if (missing.length > 0) {
    throw new Error(
      `[Config] Missing required environment variables for production: ${missing.join(', ')}`
    );
  }
  // Warn if using default insecure JWT secret
  if (process.env.JWT_SECRET === 'your-jwt-secret-minimum-32-characters') {
    throw new Error('[Config] JWT_SECRET must be changed from the default value in production');
  }
}

// Helper to safely parse environment variables
const getEnv = (key: string, defaultValue: string): string => 
  process.env[key] !== undefined ? process.env[key]! : defaultValue;

// Environment configuration
export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Solana
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  SOLANA_WS_URL: process.env.SOLANA_WS_URL,
  SOLANA_COMMITMENT: (process.env.SOLANA_COMMITMENT || 'confirmed') as 'confirmed' | 'processed' | 'finalized',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-minimum-32-characters',
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  
  // Helius
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
  
  // Other environment variables
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
};

export default env;

export const appConfig: AppConfig = {
  port: parseInt(getEnv('PORT', '3001'), 10),
  nodeEnv: (getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test'),
  cors: {
    origin: getEnv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://localhost:3000')
      .split(',')
      .map(o => o.trim()),
    credentials: true,
  },
  rateLimit: {
    windowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '60000'), 10),
    max: parseInt(getEnv('RATE_LIMIT_MAX', '2000'), 10),
  },
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};

export const solanaConfig: SolanaConfig = {
  rpcUrl: getEnv('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com'),
  commitment: 'confirmed',
  cluster: (getEnv('SOLANA_CLUSTER', 'mainnet-beta') as 'devnet' | 'testnet' | 'mainnet-beta'),
};

// Database configuration with proper SSL handling
type SslConfig = boolean | { rejectUnauthorized?: boolean };

export const databaseConfig: DatabaseConfig = {
  // Always use a real PostgreSQL URL (from env or a sane localhost default)
  url: getEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/nftsol'),
  // Always enable SSL if DATABASE_URL contains 'neon' or 'pooler' (cloud-hosted), otherwise only in production
  ssl: (getEnv('DATABASE_URL', '').includes('neon') || getEnv('DATABASE_URL', '').includes('pooler') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false) as SslConfig,
  pool: {
    min: 2,
    max: 10,
  },
};

export const programConfig: ProgramConfig = {
  cloutProgramId: getEnv('CLOUT_MINT', getEnv('CLOUT_PROGRAM_ID', '')),
  marketProgramId: getEnv('MARKET_PROGRAM_ID', ''),
  loyaltyProgramId: getEnv('LOYALTY_PROGRAM_ID', ''),
  rewardsVault: getEnv('REWARDS_VAULT', ''),
};
