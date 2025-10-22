
import React, { useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  CloverWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Import the CSS styles for the wallet adapter UI
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletConnectProps {
  children?: React.ReactNode;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ children }) => {
  const endpoint = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta");
  
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
    new CloverWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="wallet-connect-container">
            <WalletMultiButton className="wallet-adapter-button-trigger" />
            {children}
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnect;


