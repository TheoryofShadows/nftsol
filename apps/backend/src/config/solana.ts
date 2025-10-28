import { Connection, PublicKey } from '@solana/web3.js';

// Solana configuration
export function getSolanaConnection(): Connection {
  const rpcUrl = process.env.HELIUS_RPC_URL || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  return new Connection(rpcUrl, 'confirmed');
}

// CLOUT token configuration
export const CLOUT_CONFIG = {
  mint: new PublicKey('4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf'),
  treasury: new PublicKey('J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh'),
  feeCollector: new PublicKey('5Gu3RnFApFEDmMJj5czHTFPRf6A5xNypSRPrqewmPLHW'),
  developer: new PublicKey('7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio'),
};

// Governance program configuration
export const GOVERNANCE_CONFIG = {
  programId: new PublicKey('GvnmNTy8XJ3c2d4K9vR7wE1sP5qA8bC2fH6jL9mN3pQ7'),
};

// Bubblegum configuration
export const BUBBLEGUM_CONFIG = {
  programId: new PublicKey('BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY'),
};

export default {
  getSolanaConnection,
  CLOUT_CONFIG,
  GOVERNANCE_CONFIG,
  BUBBLEGUM_CONFIG,
};
