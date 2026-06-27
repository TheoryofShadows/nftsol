/**
 * CLOUT Rewards Vault Utility
 * Automatically ensures the ATA exists and creates it if needed
 */

import logger from './logger';
import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { programConfig } from '../config/index';

/**
 * Calculate the rewards vault ATA address (deterministic)
 * This is a synchronous helper that returns the address without needing a connection
 * @returns PublicKey of the rewards vault ATA, or null if configuration is missing
 */
export async function getRewardsVaultAddress(): Promise<PublicKey | null> {
  const mintAddress = programConfig.cloutProgramId;
  const ownerAddress = process.env.REWARDS_OWNER || process.env.PLATFORM_WALLET || '';

  if (!mintAddress || !ownerAddress) {
    return null;
  }

  try {
    const mint = new PublicKey(mintAddress);
    const owner = new PublicKey(ownerAddress);
    return await getAssociatedTokenAddress(mint, owner);
  } catch (error) {
    logger.warn('Could not calculate rewards vault address:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get or create the CLOUT rewards vault ATA
 * @param connection - Solana connection
 * @param payer - Keypair to pay for creation if needed
 * @returns PublicKey of the rewards vault ATA
 */
export async function getOrCreateCloutVault(
  connection: Connection,
  payer: Keypair
): Promise<PublicKey> {
  const mintAddress = programConfig.cloutProgramId;
  const ownerAddress = process.env.REWARDS_OWNER || process.env.PLATFORM_WALLET || '';

  if (!mintAddress) {
    throw new Error('CLOUT_PROGRAM_ID not configured');
  }

  if (!ownerAddress) {
    throw new Error('REWARDS_OWNER or PLATFORM_WALLET not configured');
  }

  const mint = new PublicKey(mintAddress);
  const owner = new PublicKey(ownerAddress);

  // Calculate the ATA address (deterministic)
  const ata = await getAssociatedTokenAddress(mint, owner);

  // Check if ATA already exists
  const accountInfo = await connection.getAccountInfo(ata);

  if (accountInfo) {
    logger.info(`Rewards vault ATA already exists: ${ata.toBase58()}`);
    return ata;
  }

  // ATA doesn't exist - create it
  logger.info(`Creating rewards vault ATA: ${ata.toBase58()}`);

  const instruction = createAssociatedTokenAccountInstruction(
    payer.publicKey, // payer
    ata, // ata
    owner, // owner
    mint // mint
  );

  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
  logger.info(`Rewards vault ATA created. Signature: ${signature}`);

  return ata;
}

/**
 * Verify the rewards vault ATA exists
 * Returns true if it exists or was created successfully
 */
export async function verifyCloutVault(connection: Connection): Promise<boolean> {
  const mintAddress = programConfig.cloutProgramId;
  const ownerAddress = process.env.REWARDS_OWNER || process.env.PLATFORM_WALLET || '';

  if (!mintAddress) {
    logger.warn('CLOUT_PROGRAM_ID not set in config');
    return false;
  }

  if (!ownerAddress) {
    logger.warn('REWARDS_OWNER or PLATFORM_WALLET not configured');
    return false;
  }

  try {
    const mint = new PublicKey(mintAddress);
    const owner = new PublicKey(ownerAddress);
    
    // Auto-calculate the vault ATA (deterministic)
    const rewardsVault = await getAssociatedTokenAddress(mint, owner);
    const vaultPubkey = rewardsVault;

    // Try to get the token account (better check than getAccountInfo)
    try {
      const tokenAccount = await getAccount(connection, vaultPubkey);
      if (tokenAccount.mint.equals(mint)) {
        logger.info(`Rewards vault verified and active: ${rewardsVault.toBase58()}`);
        logger.info(`Balance: ${tokenAccount.amount.toString()}`);
        return true;
      }
    } catch (err: any) {
      // Token account doesn't exist
      if (err.name === 'TokenAccountNotFoundError' || err.message?.includes('not found')) {
        logger.warn(`Rewards vault does not exist yet: ${rewardsVault.toBase58()}`);
        logger.warn('This is OK - it will be created automatically when first CLOUT reward is sent');
        return false;
      }
      throw err;
    }

    return false;
  } catch (error) {
    logger.warn('Could not verify rewards vault:', error instanceof Error ? error.message : error);
    logger.warn('Will attempt to create when first reward is sent');
    return false;
  }
}
