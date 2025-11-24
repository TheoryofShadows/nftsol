import { clusterApiUrl } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

/**
 * Determine network based on environment
 * Development = Devnet, Production = Mainnet
 */
export const SOLANA_NETWORK = import.meta.env.DEV ? 'devnet' : 'mainnet-beta';

/**
 * Get RPC URL with best practices:
 * 1. Helius API (best for production - fast, reliable, no rate limits)
 * 2. Configured RPC URL
 * 3. Never use public RPC in dev (rate limited)
 */
export const getRpcUrl = () => {
  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL as string;
  const heliusKey = import.meta.env.VITE_HELIUS_API_KEY as string;

  // Priority 1: Helius with API key (best practice - no rate limiting)
  if (heliusKey && heliusKey.trim() && heliusKey !== '${HELIUS_API_KEY}') {
    const network = import.meta.env.DEV ? 'devnet' : 'mainnet';
    return `https://${network}.helius-rpc.com/?api-key=${heliusKey}`;
  }

  // Priority 2: Use configured RPC URL (e.g., QuickNode, custom)
  if (rpcUrl && rpcUrl.trim() && !rpcUrl.includes('${')) {
    return rpcUrl;
  }

  // Priority 3: Use clusterApiUrl but log warning about rate limiting
  const fallback = clusterApiUrl(SOLANA_NETWORK);
  if (import.meta.env.DEV) {
    console.warn(
      '⚠️ Using public Solana RPC. This is rate-limited and may cause issues.\n' +
      'Set VITE_HELIUS_API_KEY or VITE_SOLANA_RPC_URL in .env for better reliability.'
    );
  }
  return fallback;
};

/**
 * Get wallet adapters following industry best practices
 * The wallet adapter react library now includes Phantom and Solflare as
 * standard wallets by default, so we can return an empty array to let
 * the WalletProvider handle initialization automatically.
 *
 * If you need additional wallet adapters, add them here.
 */
export const getWalletAdapters = () => {
  // Return empty array - WalletProvider now includes standard wallets automatically
  // This suppresses the "registered as Standard Wallet" warnings
  return [];
};

/**
 * Get cluster configuration
 */
export const getCluster = () => {
  return import.meta.env.DEV ? 'devnet' : 'mainnet-beta';
};
