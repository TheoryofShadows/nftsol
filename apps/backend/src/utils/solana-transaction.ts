/**
 * Solana Transaction Utilities
 * - Transaction building
 * - Fee estimation
 * - Priority fees
 * - Batch transactions
 */

import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import { createTransferInstruction as splCreateTransferInstruction } from '@solana/spl-token';
import { optimizedSolanaService } from '../services/solana-optimized';

/**
 * Build a transaction with optimal configuration
 */
export async function buildTransaction(
  instructions: TransactionInstruction[],
  feePayer: PublicKey
): Promise<Transaction> {
  const transaction = new Transaction();

  // Get fresh blockhash
  const blockhash = await optimizedSolanaService.getRecentBlockhash();

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = feePayer;
  transaction.add(...instructions);

  return transaction;
}

/**
 * Estimate transaction fee
 */
export async function estimateTransactionFee(
  transaction: Transaction
): Promise<number> {
  // Base fee: 5000 lamports per signature
  // Additional fees per instruction vary
  const baseFee = 5000 * transaction.signatures.length;
  
  // Estimate ~1000 lamports per instruction (varies)
  const instructionFee = transaction.instructions.length * 1000;
  
  return baseFee + instructionFee;
}

/**
 * Send SOL with optimized transaction
 */
export async function sendSOL(
  from: Keypair,
  to: PublicKey,
  amountLamports: number
): Promise<string> {
  // const connection = await optimizedSolanaService.getConnection();

  const transaction = new Transaction();
  
  // Get fresh blockhash
  const blockhash = await optimizedSolanaService.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = from.publicKey;

  // Add transfer instruction
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: amountLamports,
    })
  );

  // Simulate first
  const simulation = await optimizedSolanaService.simulateTransaction(transaction);
  if (!simulation.success) {
    throw new Error(`Transaction simulation failed: ${simulation.err}`);
  }

  // Sign and send
  transaction.sign(from);
  const signature = await optimizedSolanaService.sendTransaction(transaction, [from]);

  // Confirm transaction
  const confirmed = await optimizedSolanaService.confirmTransaction(signature);
  if (!confirmed) {
    throw new Error('Transaction confirmation failed');
  }

  return signature;
}

/**
 * Batch send transactions (optimized for multiple transfers)
 */
export async function batchSendTransactions(
  transactions: Transaction[],
  signer: Keypair
): Promise<string[]> {
  const signatures: string[] = [];

  // Process in batches of 3 (to avoid overwhelming the network)
  const batchSize = 3;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    
    const batchSignatures = await Promise.all(
      batch.map(async (tx) => {
        tx.sign(signer);
        return optimizedSolanaService.sendTransaction(tx, [signer]);
      })
    );

    signatures.push(...batchSignatures);

    // Small delay between batches
    if (i + batchSize < transactions.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return signatures;
}

/**
 * Create token transfer instruction (SPL Token)
 */
export function createTokenTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  amount: number,
  _mint: PublicKey,
  owner: PublicKey
): TransactionInstruction {
  return splCreateTransferInstruction(source, destination, owner, amount);
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(signature: string): Promise<{
  confirmed: boolean;
  finalized: boolean;
  err: any;
}> {
  const connection = await optimizedSolanaService.getConnection();

  const status = await connection.getSignatureStatus(signature);

  return {
    confirmed: status?.value?.confirmationStatus === 'confirmed' || 
               status?.value?.confirmationStatus === 'finalized',
    finalized: status?.value?.confirmationStatus === 'finalized',
    err: status?.value?.err || null,
  };
}

