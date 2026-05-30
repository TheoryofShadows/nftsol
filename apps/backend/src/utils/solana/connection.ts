import logger, { redactRpcUrl } from '../logger';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import config from '../../config';

// Create and export a singleton connection instance
let connection: Connection | null = null;

/**
 * Get or create a Solana connection
 * @returns A singleton Connection instance
 */
export function getConnection(): Connection {
  if (!connection) {
    const rpcUrl = config.solanaConfig.rpcUrl || clusterApiUrl('mainnet-beta');
    
    connection = new Connection(rpcUrl, {
      commitment: config.solanaConfig.commitment,
      wsEndpoint: config.solanaConfig.wsUrl,
      httpHeaders: process.env.HELIUS_API_KEY 
        ? { 'Authorization': `Bearer ${process.env.HELIUS_API_KEY}` } 
        : undefined,
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60_000, // 60 seconds
    });
    
    // Log connection info
    logger.info(`Connected to Solana ${getNetwork()} at ${redactRpcUrl(rpcUrl)}`);
  }
  return connection;
}

// Helper function to get the current network
export function getNetwork(): string {
  return config.solanaConfig.cluster || 'mainnet-beta';
}

// Helper function to check if connected to devnet
export const isDevnet = (): boolean => {
  return getNetwork() === 'devnet';
};

// Helper function to get the explorer URL for an address
export function getExplorerUrl(address: string, type: 'address' | 'tx' = 'address'): string {
  const baseUrl = isDevnet() 
    ? 'https://explorer.solana.com'
    : 'https://explorer.solana.com';
  
  return `${baseUrl}/${type}/${address}?cluster=${getNetwork()}`;
}
