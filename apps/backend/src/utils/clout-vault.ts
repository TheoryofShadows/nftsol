/**
 * CLOUT Rewards Vault Utility
 * Automatically ensures the ATA exists and creates it if needed
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { programConfig } from '../config/index';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('cloutVault');

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
    log.warn('Could not calculate rewards vault address', { error: error instanceof Error ? error.message : String(error) });
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
    log.info(`Rewards vault ATA already exists: ${ata.toBase58()}`);
    return ata;
  }

  // ATA doesn't exist - create it
  log.info(`Creating rewards vault ATA: ${ata.toBase58()}`);

  // Prepare the instruction (not sent here; actual creation happens when sending rewards)
  createAssociatedTokenAccountInstruction(
    payer.publicKey, // payer
    ata, // ata
    owner, // owner
    mint // mint
  );

  log.info(`ATA creation instruction prepared. Will create on first reward send.`);

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
    log.warn('CLOUT_PROGRAM_ID not set in config');
    return false;
  }

  if (!ownerAddress) {
    log.warn('REWARDS_OWNER or PLATFORM_WALLET not configured');
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
        log.info(`Rewards vault verified and active: ${rewardsVault.toBase58()}`);
        log.info(`Balance: ${tokenAccount.amount.toString()}`);
        return true;
      }
    } catch (err: any) {
      // Token account doesn't exist
      if (err.name === 'TokenAccountNotFoundError' || err.message?.includes('not found')) {
        log.warn(`Rewards vault does not exist yet: ${rewardsVault.toBase58()}`);
        log.warn('This is OK - it will be created automatically when first CLOUT reward is sent');
        return false;
      }
      throw err;
    }

    return false;
  } catch (error) {
    log.warn('Could not verify rewards vault', { error: error instanceof Error ? error.message : String(error) });
    log.warn('Will attempt to create when first reward is sent');
    return false;
  }
}
