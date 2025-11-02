/**
 * Optimized Solana client-side utilities
 * - Connection management with WebSocket subscriptions
 * - Account data caching
 * - Transaction building helpers
 * - Wallet integration optimization
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Commitment,
  clusterApiUrl,
  Keypair,
} from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { queryClient, queryKeys } from './react-query.tsx';

// Connection configuration
export const getOptimizedConnection = (endpoint: string): Connection => {
  return new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
    wsEndpoint: endpoint.replace('https://', 'wss://').replace('http://', 'ws://'),
  });
};

// Account balance hook with caching
export function useSolanaBalance(address?: string) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const walletAddress = address || publicKey?.toBase58();

  return useQuery({
    queryKey: queryKeys.walletBalance(walletAddress || ''),
    queryFn: async () => {
      if (!walletAddress || !connection) return 0;

      const pubKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(pubKey);
      return balance / LAMPORTS_PER_SOL;
    },
    enabled: !!walletAddress && !!connection,
    staleTime: 10 * 1000, // 10 seconds (balance changes frequently)
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Account exists check with caching
export function useAccountExists(address: string, enabled = true) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['account', 'exists', address],
    queryFn: async () => {
      if (!connection) return false;

      const pubKey = new PublicKey(address);
      const accountInfo = await connection.getAccountInfo(pubKey);
      return accountInfo !== null;
    },
    enabled: enabled && !!address && !!connection,
    staleTime: 60 * 1000, // 1 minute (account existence rarely changes)
  });
}

// Transaction simulation helper
export async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment = 'confirmed'
): Promise<{
  success: boolean;
  err?: any;
  logs?: string[] | null;
}> {
  try {
    const simulation = await connection.simulateTransaction(transaction, {
      commitment,
      replaceRecentBlockhash: true,
      sigVerify: false,
    });

    return {
      success: simulation.value.err === null,
      err: simulation.value.err,
      logs: simulation.value.logs || null,
    };
  } catch (error) {
    return {
      success: false,
      err: error,
    };
  }
}

// Build optimized transaction
export async function buildTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  feePayer: PublicKey
): Promise<Transaction> {
  const transaction = new Transaction();

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = feePayer;
  transaction.add(...instructions);

  return transaction;
}

// Send transaction with confirmation
export async function sendAndConfirmTransactionOptimized(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment = 'confirmed',
  confirmOptions?: { skipPreflight?: boolean }
): Promise<string> {
  // Simulate first (optional)
  if (confirmOptions?.skipPreflight !== true) {
    const simulation = await simulateTransaction(connection, transaction);
    if (!simulation.success) {
      throw new Error(`Transaction simulation failed: ${simulation.err}`);
    }
  }

  // Send transaction
  const signature = await connection.sendRawTransaction(
    transaction.serialize(),
    {
      skipPreflight: confirmOptions?.skipPreflight || false,
      maxRetries: 3,
    }
  );

  // Confirm with optimized strategy
  const confirmation = await connection.confirmTransaction(signature, commitment);

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${confirmation.value.err}`);
  }

  // Invalidate balance cache
  if (transaction.feePayer) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.walletBalance(transaction.feePayer.toBase58()),
    });
  }

  return signature;
}

// Batch get account info
export async function getMultipleAccountsOptimized(
  connection: Connection,
  addresses: string[]
): Promise<Array<{ address: string; data: Buffer | null }>> {
  const pubKeys = addresses.map((addr) => new PublicKey(addr));
  const accounts = await connection.getMultipleAccountsInfo(pubKeys);

  return addresses.map((addr, index) => ({
    address: addr,
    data: accounts[index]?.data || null,
  }));
}

// Priority fee calculation (for high-priority transactions)
export function calculatePriorityFee(
  baseFee: number = 5000,
  priorityMultiplier: number = 1
): number {
  // Priority fees are optional but can speed up transactions
  // Base fee: 5000 lamports (~0.000005 SOL)
  // Priority: 1x to 10x base fee
  return Math.floor(baseFee * priorityMultiplier);
}

// Estimate transaction fee
export async function estimateTransactionFee(
  connection: Connection,
  transaction: Transaction
): Promise<number> {
  try {
    const feeForMessage = await connection.getFeeForMessage(transaction.compileMessage());
    return feeForMessage?.value || 5000; // Default 5000 lamports
  } catch (error) {
    return 5000; // Default fallback
  }
}

// Validate wallet address
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Format SOL amount
export function formatSOL(lamports: number, decimals = 4): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  return sol.toFixed(decimals);
}

// Parse SOL amount to lamports
export function parseSOL(sol: string | number): number {
  const amount = typeof sol === 'string' ? parseFloat(sol) : sol;
  return Math.floor(amount * LAMPORTS_PER_SOL);
}

// Export connection helpers
export { useWallet, useConnection } from '@solana/wallet-adapter-react';
export { clusterApiUrl } from '@solana/web3.js';

