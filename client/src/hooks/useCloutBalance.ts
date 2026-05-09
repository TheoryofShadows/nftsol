import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { heliusService } from '../services/heliusService';

interface CloutBalanceData {
  address: string;
  balance: number;
  token: string;
}

export function useCloutBalance() {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const address = publicKey.toBase58();
      const bal = await heliusService.getCloutBalance(address);
      setBalance(bal);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connected]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(() => {
      if (connected && publicKey) fetchBalance();
    }, 30000);
    return () => clearInterval(interval);
  }, [connected, publicKey, fetchBalance]);

  return { balance, isLoading, error, refetch: fetchBalance };
}

export function useCloutVaultBalance() {
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVaultBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const VAULT = '7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v';
      const bal = await heliusService.getCloutBalance(VAULT);
      setVaultBalance(bal);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setVaultBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaultBalance();
    const interval = setInterval(fetchVaultBalance, 60000);
    return () => clearInterval(interval);
  }, [fetchVaultBalance]);

  return { vaultBalance, isLoading, error, refetch: fetchVaultBalance };
}

export type { CloutBalanceData };
