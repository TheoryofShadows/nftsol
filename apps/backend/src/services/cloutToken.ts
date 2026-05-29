/**
 * 💰 CLOUT Token Service
 * Handles sending CLOUT token rewards to users on Solana
 *
 * @module services/cloutToken
 * @creator NFTSol Team
 * @license MIT
 * @description CLOUT is the native reward token of the NFTSol platform.
 *              This service manages token distribution and balance tracking.
 */

import logger from '../utils/logger';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  transfer,
  getMint,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { getPlatformKeypair } from '../lib/platformKeypair';
import { programConfig, solanaConfig } from '../config/index';
import { getOrCreateCloutVault } from '../utils/clout-vault';

export interface CloutRewardResult {
  success: boolean;
  txSignature?: string;
  error?: string;
  amount?: number;
}

export interface CloutBalanceResult {
  success: boolean;
  balance?: number;
  error?: string;
}

/**
 * CLOUT Token Service
 * Manages CLOUT token distribution and balance queries
 */
export class CloutTokenService {
  private readonly mint: PublicKey;
  private readonly connection: Connection;
  private mintInfoCache: { decimals?: number; cachedAt?: number } = {};
  private readonly MINT_INFO_CACHE_TTL = 60000; // 1 minute

  constructor() {
    // Use CLOUT_MINT if available, otherwise fall back to CLOUT_PROGRAM_ID
    const mintAddress = process.env.CLOUT_MINT || programConfig.cloutProgramId;
    if (!mintAddress) {
      throw new Error('[CLOUT] CLOUT_MINT or CLOUT_PROGRAM_ID not configured in environment');
    }

    this.mint = new PublicKey(mintAddress);
    this.connection = new Connection(solanaConfig.rpcUrl, solanaConfig.commitment);

    logger.info(`[CLOUT] Service initialized`);
    logger.info(`[CLOUT] Mint address: ${this.mint.toBase58()}`);
    logger.info(`[CLOUT] RPC URL: ${solanaConfig.rpcUrl}`);
    logger.info(`[CLOUT] Cluster: ${solanaConfig.cluster}`);
  }

  /**
   * Get mint information (with caching)
   */
  private async getMintInfo() {
    const now = Date.now();
    if (
      this.mintInfoCache.decimals &&
      this.mintInfoCache.cachedAt &&
      now - this.mintInfoCache.cachedAt < this.MINT_INFO_CACHE_TTL
    ) {
      return { decimals: this.mintInfoCache.decimals };
    }

    try {
      const mintInfo = await getMint(this.connection, this.mint);
      this.mintInfoCache = {
        decimals: mintInfo.decimals,
        cachedAt: now,
      };
      return mintInfo;
    } catch (error) {
      throw new Error(
        `Failed to fetch CLOUT mint info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Ensure rewards vault exists and is funded
   */
  private async ensureRewardsVault(platformKeypair: Keypair): Promise<PublicKey> {
    try {
      // Get or create vault address
      const rewardsVault = await getOrCreateCloutVault(this.connection, platformKeypair);

      // Check if vault exists
      try {
        await getAccount(this.connection, rewardsVault);
        return rewardsVault;
      } catch (error: any) {
        // Vault doesn't exist - create it
        if (error.name === 'TokenAccountNotFoundError' || error.message?.includes('not found')) {
          logger.info('[CLOUT] Creating rewards vault ATA...');

          const vaultATA = await getAssociatedTokenAddress(this.mint, platformKeypair.publicKey);

          const createInstruction = createAssociatedTokenAccountInstruction(
            platformKeypair.publicKey, // payer
            vaultATA, // ata
            platformKeypair.publicKey, // owner
            this.mint // mint
          );

          const createTx = new Transaction().add(createInstruction);
          const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
          createTx.recentBlockhash = blockhash;
          createTx.feePayer = platformKeypair.publicKey;
          createTx.sign(platformKeypair);

          const signature = await sendAndConfirmTransaction(
            this.connection,
            createTx,
            [platformKeypair],
            {
              commitment: 'confirmed',
              maxRetries: 3,
            }
          );

          logger.info(`[CLOUT] ✓ Rewards vault created: ${vaultATA.toBase58()}`);
          logger.info(`[CLOUT] Transaction: https://solscan.io/tx/${signature}`);

          return vaultATA;
        }
        throw error;
      }
    } catch (error) {
      throw new Error(
        `Failed to ensure rewards vault: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Distribute CLOUT rewards to a user
   *
   * @param recipientAddress - Wallet address to receive CLOUT (base58 string)
   * @param baseAmount - Base amount of CLOUT tokens (will be multiplied)
   * @param multiplier - Multiplier for the reward (default: 1.0)
   * @returns Result with transaction signature or error
   */
  async distributeCloutRewards(
    recipientAddress: string,
    baseAmount: number,
    multiplier: number = 1.0
  ): Promise<CloutRewardResult> {
    try {
      // Validate inputs
      if (!recipientAddress || typeof recipientAddress !== 'string') {
        return { success: false, error: 'Invalid recipient address' };
      }

      if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
        return { success: false, error: 'Amount must be a positive number' };
      }

      if (!Number.isFinite(multiplier) || multiplier <= 0) {
        return { success: false, error: 'Multiplier must be a positive number' };
      }

      // Get platform keypair
      const platformKeypair = getPlatformKeypair();
      if (!platformKeypair) {
        return {
          success: false,
          error:
            'Platform keypair not configured. Set PLATFORM_SECRET_KEY_BASE58 or PLATFORM_SECRET_KEY_JSON',
        };
      }

      // Calculate final amount
      const finalAmount = Math.floor(baseAmount * multiplier);
      if (finalAmount <= 0) {
        return { success: false, error: 'Final reward amount must be greater than 0' };
      }

      // Get mint info
      const mintInfo = await this.getMintInfo();
      const amountLamports = BigInt(finalAmount) * BigInt(10 ** mintInfo.decimals);

      // Parse recipient address
      let recipient: PublicKey;
      try {
        recipient = new PublicKey(recipientAddress);
      } catch (error) {
        return { success: false, error: 'Invalid Solana address format' };
      }

      // Ensure rewards vault exists
      let rewardsVault: PublicKey;
      try {
        rewardsVault = await this.ensureRewardsVault(platformKeypair);
      } catch (error) {
        return {
          success: false,
          error: `Rewards vault error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }

      // Check vault balance
      try {
        const vaultAccount = await getAccount(this.connection, rewardsVault);
        if (vaultAccount.amount < amountLamports) {
          const currentBalance =
            Number(vaultAccount.amount) / Number(BigInt(10 ** mintInfo.decimals));
          return {
            success: false,
            error: `Insufficient CLOUT in rewards vault. Need ${finalAmount}, have ${currentBalance.toFixed(4)}`,
          };
        }
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to check vault balance: ${error.message || 'Unknown error'}`,
        };
      }

      // Get or create recipient's ATA
      let recipientATA;
      try {
        recipientATA = await getOrCreateAssociatedTokenAccount(
          this.connection,
          platformKeypair, // payer
          this.mint,
          recipient
        );
      } catch (error) {
        return {
          success: false,
          error: `Failed to create recipient token account: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }

      // Transfer CLOUT
      logger.info(
        `[CLOUT] Transferring ${finalAmount} CLOUT to ${recipientAddress.slice(0, 8)}...`
      );

      const txSignature = await transfer(
        this.connection,
        platformKeypair, // payer
        rewardsVault, // source
        recipientATA.address, // destination
        platformKeypair, // owner of source (rewards vault)
        amountLamports // amount
      );

      logger.info(
        `[CLOUT] ✓ Successfully sent ${finalAmount} CLOUT to ${recipientAddress.slice(0, 8)}...`
      );
      logger.info(`[CLOUT] Transaction: https://solscan.io/tx/${txSignature}`);

      return {
        success: true,
        txSignature,
        amount: finalAmount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[CLOUT] Reward distribution error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get CLOUT balance for a wallet
   *
   * @param walletAddress - Solana wallet address
   * @returns Balance in CLOUT tokens (0 if no ATA exists)
   */
  async getCloutBalance(walletAddress: string): Promise<number> {
    try {
      const wallet = new PublicKey(walletAddress);
      const ata = await getAssociatedTokenAddress(this.mint, wallet);

      try {
        const account = await getAccount(this.connection, ata);
        const mintInfo = await this.getMintInfo();
        const balance = Number(account.amount) / Number(BigInt(10 ** mintInfo.decimals));
        
        logger.info(`[CLOUT] Balance for ${walletAddress.slice(0, 8)}...: ${balance} CLOUT`);
        return balance;
      } catch (error: any) {
        // Log the error for debugging
        if (error.name === 'TokenAccountNotFoundError' || error.message?.includes('not found')) {
          logger.info(`[CLOUT] No token account found for ${walletAddress.slice(0, 8)}... (ATA: ${ata.toBase58()})`);
        } else {
          logger.error('[CLOUT] Error fetching balance for %s...:', walletAddress.slice(0, 8), error.message || error);
        }
        return 0; // ATA doesn't exist, balance is 0
      }
    } catch (error: any) {
      logger.error('[CLOUT] Error in getCloutBalance for %s:', walletAddress, error.message || error);
      return 0;
    }
  }

  /**
   * Get rewards vault balance
   *
   * @returns Balance in CLOUT tokens
   */
  async getVaultBalance(): Promise<number> {
    try {
      const platformKeypair = getPlatformKeypair();
      if (!platformKeypair) {
        return 0;
      }

      const rewardsVault = await getOrCreateCloutVault(this.connection, platformKeypair);

      try {
        const account = await getAccount(this.connection, rewardsVault);
        const mintInfo = await this.getMintInfo();
        return Number(account.amount) / Number(BigInt(10 ** mintInfo.decimals));
      } catch {
        return 0; // Vault doesn't exist yet
      }
    } catch {
      return 0;
    }
  }
}
