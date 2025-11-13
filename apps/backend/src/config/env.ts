import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Solana
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
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
