/**
 * Environment Configuration
 * Centralized environment variable management with validation
 */

import { ENV } from '../constants';

type Environment = 'development' | 'production' | 'test';

interface EnvironmentConfig {
  nodeEnv: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  apiBase: string;
  solanaRpcUrl: string;
  solanaCluster: 'devnet' | 'testnet' | 'mainnet-beta';
  heliusApiKey?: string;
  magicEdenApiKey?: string;
}

function getEnvironment(): Environment {
  const env = process.env.NODE_ENV || process.env.ENV || 'development';
  
  if (env === 'production' || env === 'prod') return 'production';
  if (env === 'test') return 'test';
  return 'development';
}

function getApiBase(): string {
  // Server-side
  if (typeof process !== 'undefined' && process.env) {
    return process.env.API_BASE || process.env.VITE_API_BASE || 'http://localhost:3001';
  }
  
  // Client-side
  if (typeof window !== 'undefined') {
    // @ts-ignore - Vite env
    if (import.meta?.env?.VITE_API_BASE) {
      // @ts-ignore
      return import.meta.env.VITE_API_BASE;
    }
    
    // Production fallback
    if (window.location.hostname.includes('netlify.app')) {
      return 'https://nftsol.onrender.com';
    }
    
    return 'http://localhost:3001';
  }
  
  return 'http://localhost:3001';
}

function getSolanaRpcUrl(): string {
  const env = typeof process !== 'undefined' ? process.env : {};
  
  // Priority order:
  // 1. Explicit RPC URL
  if (env.SOLANA_RPC_URL) return env.SOLANA_RPC_URL;
  
  // 2. Helius RPC with API key
  if (env.HELIUS_API_KEY) {
    return `https://rpc.helius.xyz/?api-key=${env.HELIUS_API_KEY}`;
  }
  
  // 3. QuickNode
  if (env.QUICKNODE_API_KEY) {
    return `https://${env.QUICKNODE_ENDPOINT || 'solana-mainnet'}.quicknode.com/${env.QUICKNODE_API_KEY}`;
  }
  
  // 4. Default based on cluster
  const cluster = getSolanaCluster();
  const defaultUrls: Record<string, string> = {
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com',
    'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  };
  
  return defaultUrls[cluster] || defaultUrls['mainnet-beta'];
}

function getSolanaCluster(): 'devnet' | 'testnet' | 'mainnet-beta' {
  const env = typeof process !== 'undefined' ? process.env : {};
  const rpcUrl = getSolanaRpcUrl();
  
  if (env.SOLANA_CLUSTER) {
    const cluster = env.SOLANA_CLUSTER.toLowerCase();
    if (['devnet', 'testnet', 'mainnet-beta'].includes(cluster)) {
      return cluster as 'devnet' | 'testnet' | 'mainnet-beta';
    }
  }
  
  // Infer from RPC URL
  if (rpcUrl.includes('devnet')) return 'devnet';
  if (rpcUrl.includes('testnet')) return 'testnet';
  return 'mainnet-beta';
}

export const envConfig: EnvironmentConfig = (() => {
  const nodeEnv = getEnvironment();
  
  return {
    nodeEnv,
    isProduction: nodeEnv === ENV.PRODUCTION,
    isDevelopment: nodeEnv === ENV.DEVELOPMENT,
    isTest: nodeEnv === ENV.TEST,
    apiBase: getApiBase(),
    solanaRpcUrl: getSolanaRpcUrl(),
    solanaCluster: getSolanaCluster(),
    heliusApiKey: process.env.HELIUS_API_KEY,
    magicEdenApiKey: process.env.MAGIC_EDEN_API_KEY,
  };
})();

// Export individual values for convenience
export const {
  nodeEnv,
  isProduction,
  isDevelopment,
  isTest,
  apiBase,
  solanaRpcUrl,
  solanaCluster,
  heliusApiKey,
  magicEdenApiKey,
} = envConfig;

// Validation
if (isProduction) {
  const requiredEnvVars = ['DATABASE_URL'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(', ')}`
    );
  }
}

