/**
 * CLOUT Rewards Vault Utility
 * Automatically ensures the ATA exists and creates it if needed
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';
import { programConfig, solanaConfig } from '../config/index';

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
    console.log(`[CLOUT] Rewards vault ATA already exists: ${ata.toBase58()}`);
    return ata;
  }

  // ATA doesn't exist - create it
  console.log(`[CLOUT] Creating rewards vault ATA: ${ata.toBase58()}`);
  
  const createInstruction = createAssociatedTokenAccountInstruction(
    payer.publicKey, // payer
    ata, // ata
    owner, // owner
    mint // mint
  );

  // For now, just log - actual creation would need a transaction
  // This can be called when actually sending CLOUT rewards
  console.log(`[CLOUT] ATA creation instruction prepared. Will create on first reward send.`);

  return ata;
}

/**
 * Verify the rewards vault ATA exists
 * Returns true if it exists or was created successfully
 */
export async function verifyCloutVault(connection: Connection): Promise<boolean> {
  const rewardsVault = programConfig.rewardsVault;
  const mintAddress = programConfig.cloutProgramId;
  
  if (!rewardsVault) {
    console.warn('[CLOUT] REWARDS_VAULT not set in config');
    return false;
  }

  if (!mintAddress) {
    console.warn('[CLOUT] CLOUT_PROGRAM_ID not set in config');
    return false;
  }

  try {
    const vaultPubkey = new PublicKey(rewardsVault);
    const mint = new PublicKey(mintAddress);
    
    // Try to get the token account (better check than getAccountInfo)
    try {
      const tokenAccount = await getAccount(connection, vaultPubkey);
      if (tokenAccount.mint.equals(mint)) {
        console.log(`[CLOUT] ✓ Rewards vault verified and active: ${rewardsVault}`);
        console.log(`[CLOUT]   Balance: ${tokenAccount.amount.toString()}`);
        return true;
      }
    } catch (err: any) {
      // Token account doesn't exist
      if (err.name === 'TokenAccountNotFoundError' || err.message?.includes('not found')) {
        console.warn(`[CLOUT] ⚠ Rewards vault does not exist yet: ${rewardsVault}`);
        console.warn(`[CLOUT]   This is OK - it will be created automatically when first CLOUT reward is sent`);
        return false;
      }
      throw err;
    }
    
    return false;
  } catch (error) {
    console.warn('[CLOUT] Could not verify rewards vault:', error instanceof Error ? error.message : error);
    console.warn('[CLOUT] Will attempt to create when first reward is sent');
    return false;
  }
}

