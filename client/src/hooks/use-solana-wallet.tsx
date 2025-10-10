import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSolanaConnection } from "@/components/solana-wallet-provider";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useToast } from "./use-toast";

export function useSolanaWallet() {
  const { toast } = useToast();
  const { connection } = useSolanaConnection();
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    sendTransaction,
    select,
    wallets,
  } = useWallet();
  const { setVisible } = useWalletModal();

  const [balance, setBalance] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!connected || !publicKey) {
      setBalance(null);
      return;
    }
    try {
      setRefreshing(true);
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("[useSolanaWallet] Failed to fetch balance:", error);
      setBalance(null);
    } finally {
      setRefreshing(false);
    }
  }, [connection, connected, publicKey]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (connected && publicKey) {
      toast({
        title: "Wallet connected",
        description: `${publicKey.toBase58().slice(0, 4)}...${publicKey
          .toBase58()
          .slice(-4)}`,
      });
    }
  }, [connected, publicKey, toast]);

  const openModal = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const connectWallet = useCallback(() => {
    if (!connected) {
      setVisible(true);
    }
  }, [connected, setVisible]);

  const disconnectWallet = useCallback(async () => {
    await disconnect();
    setBalance(null);
  }, [disconnect]);

  return {
    connection,
    publicKey,
    connected,
    connecting,
    connect: connectWallet,
    disconnect: disconnectWallet,
    openModal,
    selectWallet: select,
    wallets,
    sendTransaction,
    balance,
    refreshingBalance: refreshing,
    refreshBalance: fetchBalance,
    walletAddress: publicKey?.toBase58() ?? null,
  };
}
