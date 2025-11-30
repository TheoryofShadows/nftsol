import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as bs58 from 'bs58';
import { createModuleLogger } from '../../utils/logger';

const log = createModuleLogger('wallets');

/**
 * Wallet utilities for the backend
 */

export interface WalletBalance {
  sol: number;
  lamports: number;
}

/**
 * Get the balance of a wallet
 * @param connection Solana connection
 * @param publicKey Public key of the wallet
 * @returns Wallet balance in SOL and lamports
 */
export async function getWalletBalance(connection: Connection, publicKey: PublicKey): Promise<WalletBalance> {
  try {
    const lamports = await connection.getBalance(publicKey);
    return {
      sol: lamports / LAMPORTS_PER_SOL,
      lamports
    };
  } catch (error: unknown) {
    log.error('Error getting wallet balance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get wallet balance: ${errorMessage}`);
  }
}

/**
 * Transfer SOL from one wallet to another
 * @param connection Solana connection
 * @param fromKeypair Keypair of the sender
 * @param toPublicKey Public key of the recipient
 * @param amount Amount of SOL to send
 * @returns Transaction signature
 */
export async function transferSol(
  connection: Connection,
  fromKeypair: Keypair,
  toPublicKey: PublicKey,
  amount: number
): Promise<string> {
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const signature = await connection.sendTransaction(transaction, [fromKeypair]);
    return signature;
  } catch (error: unknown) {
    log.error('Error transferring SOL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to transfer SOL: ${errorMessage}`);
  }
}

/**
 * Create a new keypair from a base58 encoded private key
 * @param privateKey Base58 encoded private key
 * @returns Keypair
 */
export function getKeypairFromPrivateKey(privateKey: string): Keypair {
  try {
    const secretKey = bs58.decode(privateKey);
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    log.error('Error creating keypair from private key:', error);
    throw new Error('Invalid private key');
  }
}

/**
 * Generate a new Solana keypair
 * @returns New keypair and mnemonic (if applicable)
 */
export function generateNewWallet(): {
  keypair: Keypair;
  publicKey: string;
  privateKey: string;
} {
  try {
    const keypair = Keypair.generate();
    return {
      keypair,
      publicKey: keypair.publicKey.toBase58(),
      privateKey: bs58.encode(keypair.secretKey)
    };
  } catch (error) {
    log.error('Error generating new wallet:', error);
    throw new Error('Failed to generate new wallet');
  }
}

/**
 * Check if a string is a valid Solana address
 * @param address Address to validate
 * @returns True if valid, false otherwise
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

// Get the public key from a keypair
export function getPublicKey(keypair: Keypair): PublicKey {
  return keypair.publicKey;
}

// Get the connection details
export function getConnectionDetails(connection: Connection) {
  return {
    rpcEndpoint: connection.rpcEndpoint,
    commitment: connection.commitment,
    // Add other relevant connection details
  };
}
