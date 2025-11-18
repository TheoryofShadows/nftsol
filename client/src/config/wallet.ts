import { clusterApiUrl } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

export const SOLANA_NETWORK = 'mainnet-beta';

export const getRpcUrl = () => {
  return (import.meta.env.VITE_SOLANA_RPC_URL as string) || clusterApiUrl(SOLANA_NETWORK);
};

export const getWalletAdapters = () => {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];
};
