import { ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import "@solana/wallet-adapter-react-ui/styles.css";

type Props = {
  children: ReactNode;
};

export function SolanaWalletProvider({ children }: Props) {
  const network = (import.meta.env.VITE_SOLANA_NETWORK ?? "devnet") as WalletAdapterNetwork;
  const endpoint = import.meta.env.VITE_SOLANA_RPC_URL ?? clusterApiUrl(network);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new LedgerWalletAdapter(),
    ],
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useSolanaConnection() {
  return useConnection();
}
