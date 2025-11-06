import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import '../styles/WalletSetup.css';

export default function WalletSetup({ children }: { children: React.ReactNode }) {
  const cluster = (import.meta as any).env?.VITE_SOLANA_CLUSTER || 'devnet';
  const endpoint =
    cluster === 'mainnet-beta' ? clusterApiUrl('mainnet-beta') : clusterApiUrl('devnet');
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="wallet-setup-container">
            <WalletMultiButton />
            <span className="wallet-setup-network">Network: {cluster}</span>
          </div>
          <div className="wallet-setup-content">{children}</div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
