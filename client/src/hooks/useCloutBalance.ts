import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

interface CloutBalanceData {
  address: string;
  balance: number;
  token: string;
}

interface CloutBalanceResponse {
  success: boolean;
  data?: CloutBalanceData;
  error?: string;
}

/**
 * Custom hook for fetching CLOUT balance
 * Uses the same pattern as other hooks in the codebase (useState + useEffect)
 *
 * @returns { balance, isLoading, error, refetch }
 */
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
      const response = await fetch(`${API_BASE}/api/clout/balance/${address}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: CloutBalanceResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch CLOUT balance');
      }

      setBalance(result.data.balance);
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

    // Poll balance every 30 seconds when connected
    const interval = setInterval(() => {
      if (connected && publicKey) {
        fetchBalance();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [connected, publicKey, fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}

/**
 * Hook for fetching vault balance (admin/public info)
 */
export function useCloutVaultBalance() {
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVaultBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/clout/vault-balance`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch vault balance');
      }

      setVaultBalance(result.data.balance as number);
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

    // Poll vault balance every minute
    const interval = setInterval(fetchVaultBalance, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchVaultBalance]);

  return {
    vaultBalance,
    isLoading,
    error,
    refetch: fetchVaultBalance,
  };
}
