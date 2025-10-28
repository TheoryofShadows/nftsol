import "./styles/solana.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";

const endpoint = import.meta.env.VITE_SOLANA_CLUSTER === 'devnet'
  ? clusterApiUrl('devnet')
  : clusterApiUrl('mainnet-beta');

const wallets = [new PhantomWalletAdapter()];

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>
);
