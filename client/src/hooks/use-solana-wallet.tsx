import { PublicKey, Connection } from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from './use-toast';

export function useSolanaWallet() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const { toast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  
  // Create connection instance
  const connection = new Connection(
    import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );

  // Fetch SOL balance
  const fetchBalance = useCallback(async () => {
    if (publicKey && connected) {
      try {
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / 1000000000); // Convert lamports to SOL
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(null);
      }
    } else {
      setBalance(null);
    }
  }, [publicKey, connected, connection]);

  // Fetch balance when wallet connects or public key changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Show connection status toasts
  useEffect(() => {
    if (connected && publicKey) {
      toast({
        title: "Wallet Connected! 🎉",
        description: `Connected to ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
      });
    }
  }, [connected, publicKey, toast]);

  const handleDisconnect = useCallback(async () => {
    try {
      setConnected(false);
      setPublicKey(null);
      setBalance(null);
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleConnect = useCallback(async () => {
    try {
      // Simple connection simulation - in real app this would use wallet adapter
      const mockPublicKey = new PublicKey("11111111111111111111111111111112");
      setPublicKey(mockPublicKey);
      setConnected(true);
    } catch (error) {
      console.error('Connect error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    publicKey,
    connected,
    balance,
    connection,
    disconnect: handleDisconnect,
    connect: handleConnect,
    refreshBalance: fetchBalance,
    walletAddress: publicKey?.toString() || null,
  };
}