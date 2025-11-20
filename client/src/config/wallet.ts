import { clusterApiUrl } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

export const SOLANA_NETWORK = 'mainnet-beta';

export const getRpcUrl = () => {
  // Priority 1: Helius with API key (if both available)
  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL as string;
  const heliusKey = import.meta.env.VITE_HELIUS_API_KEY as string;

  if (heliusKey && heliusKey !== '${HELIUS_API_KEY}' && heliusKey.trim()) {
    return `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  }

  // Priority 2: Use configured RPC URL
  if (rpcUrl && rpcUrl.trim() && rpcUrl !== '${HELIUS_API_KEY}') {
    return rpcUrl;
  }

  // Priority 3: Fallback to public Solana RPC
  return clusterApiUrl(SOLANA_NETWORK);
};

export const getWalletAdapters = () => {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];
};
