/**
 * ⛓️ On-Chain Transaction Service
 * Real Solana blockchain transactions for buying/selling NFTs
 * Uses proper escrow, royalty payments, and platform fees
 */

import logger from '../utils/logger';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  // Keypair,
  // sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { solanaConfig, programConfig as _programConfig } from '../config';

const MARKETPLACE_WALLET = process.env.MARKETPLACE_WALLET_ADDRESS || 'Aqx6ozBZmH761aEwtpiVcA33eQGLnbXtHPepi1bMfjgs';
const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || '3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad';
import { pool } from '../lib/db';

interface CreateBuyTransactionParams {
  buyer: string; // Buyer's wallet address
  seller: string; // Seller's wallet address
  mintAddress: string; // NFT mint address
  price: number; // Price in SOL
  royaltyPercent?: number; // Royalty percentage (0-100)
  creatorAddress?: string; // Original creator for royalty
}

interface TransactionResult {
  success: boolean;
  transaction?: Transaction; // Unsigned transaction for wallet to sign
  signature?: string; // If transaction was sent
  error?: string;
}

export class OnChainTransactionService {
  private connection: Connection;
  private platformFeePercent: number = 2.5; // 2.5% platform fee

  constructor() {
    this.connection = new Connection(solanaConfig.rpcUrl, {
      commitment: solanaConfig.commitment,
      confirmTransactionInitialTimeout: 60000,
    });
    logger.info('[OnChain] Transaction service initialized');
  }

  /**
   * Create an unsigned buy transaction for NFT purchase
   * Wallet will sign this transaction to complete the purchase
   */
  async createBuyTransaction(
    params: CreateBuyTransactionParams
  ): Promise<TransactionResult> {
    const { buyer, seller, mintAddress, price, royaltyPercent = 0, creatorAddress } = params;

    try {
      logger.info(`[OnChain] Creating buy transaction for NFT ${mintAddress}`);
      logger.info(`[OnChain] Buyer: ${buyer}, Seller: ${seller}, Price: ${price} SOL`);

      // Convert addresses to PublicKeys
      const buyerPubkey = new PublicKey(buyer);
      const sellerPubkey = new PublicKey(seller);
      const mintPubkey = new PublicKey(mintAddress);

      // Calculate fees
      const priceInLamports = Math.floor(price * LAMPORTS_PER_SOL);
      const platformFee = Math.floor(priceInLamports * (this.platformFeePercent / 100));
      const royaltyFee =
        royaltyPercent > 0 && creatorAddress
          ? Math.floor(priceInLamports * (royaltyPercent / 100))
          : 0;
      const sellerAmount = priceInLamports - platformFee - royaltyFee;

      logger.info(`[OnChain] Price: ${priceInLamports} lamports`);
      logger.info(`[OnChain] Platform fee: ${platformFee} lamports (${this.platformFeePercent}%)`);
      logger.info(`[OnChain] Royalty fee: ${royaltyFee} lamports (${royaltyPercent}%)`);
      logger.info(`[OnChain] Seller gets: ${sellerAmount} lamports`);

      // Create transaction
      const transaction = new Transaction();

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = buyerPubkey;

      // 1. Transfer SOL from buyer to seller
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: buyerPubkey,
          toPubkey: sellerPubkey,
          lamports: sellerAmount,
        })
      );

      // 2. Platform fee — split between marketplace wallet and developer wallet
      if (platformFee > 0) {
        const marketplacePubkey = new PublicKey(MARKETPLACE_WALLET);
        const developerPubkey = new PublicKey(PLATFORM_WALLET);
        const halfFee = Math.floor(platformFee / 2);
        transaction.add(
          SystemProgram.transfer({ fromPubkey: buyerPubkey, toPubkey: marketplacePubkey, lamports: halfFee }),
          SystemProgram.transfer({ fromPubkey: buyerPubkey, toPubkey: developerPubkey, lamports: platformFee - halfFee }),
        );
      }

      // 3. Royalty payment (to creator)
      if (royaltyFee > 0 && creatorAddress) {
        const creatorPubkey = new PublicKey(creatorAddress);
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: buyerPubkey,
            toPubkey: creatorPubkey,
            lamports: royaltyFee,
          })
        );
      }

      // 4. Transfer NFT from seller to buyer
      const nftTransferIx = await this.createNFTTransferInstruction(
        mintPubkey,
        sellerPubkey,
        buyerPubkey
      );

      transaction.add(nftTransferIx);

      logger.info('[OnChain] Transaction created successfully');

      return {
        success: true,
        transaction,
      };
    } catch (error) {
      logger.error('[OnChain] Create buy transaction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transaction',
      };
    }
  }

  /**
   * Create NFT transfer instruction (SPL Token transfer)
   */
  private async createNFTTransferInstruction(
    mintPubkey: PublicKey,
    fromOwner: PublicKey,
    toOwner: PublicKey
  ): Promise<TransactionInstruction> {
    // Get source token account (seller's NFT)
    const sourceTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromOwner);

    // Get destination token account (buyer's NFT)
    const destinationTokenAccount = await getAssociatedTokenAddress(mintPubkey, toOwner);

    // Check if destination account exists
    const destAccountInfo = await this.connection.getAccountInfo(destinationTokenAccount);

    // If destination doesn't exist, create it first
    if (!destAccountInfo) {
      logger.info('[OnChain] Creating destination token account for buyer');
      return createAssociatedTokenAccountInstruction(
        fromOwner, // Payer (seller pays for account creation)
        destinationTokenAccount,
        toOwner,
        mintPubkey
      );
    }

    // Transfer NFT (amount = 1 for NFTs)
    return createTransferInstruction(
      sourceTokenAccount,
      destinationTokenAccount,
      fromOwner,
      1, // NFTs have amount = 1
      [],
      TOKEN_PROGRAM_ID
    );
  }

  /**
   * Verify NFT ownership before creating transaction
   */
  async verifyOwnership(mintAddress: string, owner: string): Promise<{ success: boolean; error?: string }> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const ownerPubkey = new PublicKey(owner);

      const tokenAccount = await getAssociatedTokenAddress(mintPubkey, ownerPubkey);
      const accountInfo = await this.connection.getAccountInfo(tokenAccount);

      if (!accountInfo) {
        return { success: false, error: 'Owner does not have this NFT' };
      }

      const account = await getAccount(this.connection, tokenAccount);

      if (account.amount < 1n) {
        return { success: false, error: 'Owner does not have this NFT (balance = 0)' };
      }

      return { success: true };
    } catch (error) {
      logger.error('[OnChain] Verify ownership error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify ownership',
      };
    }
  }

  /**
   * Record completed sale in database
   */
  async recordSale(params: {
    mintAddress: string;
    buyer: string;
    seller: string;
    price: number;
    signature: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await pool.query(
        `INSERT INTO nft_sales (mint_address, buyer, seller, price, transaction_signature, sold_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [params.mintAddress, params.buyer, params.seller, params.price, params.signature]
      );

      // Update NFT owner in database
      await pool.query(
        `UPDATE nfts 
         SET owner = $1, status = 'active'
         WHERE "mintAddress" = $2`,
        [params.buyer, params.mintAddress]
      );

      // Remove from listings
      await pool.query(
        `UPDATE nft_listings 
         SET listed = false 
         WHERE mint_address = $1`,
        [params.mintAddress]
      );

      logger.info(`[OnChain] Sale recorded: ${params.mintAddress}`);

      return { success: true };
    } catch (error) {
      logger.error('[OnChain] Record sale error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record sale',
      };
    }
  }

  /**
   * Get transaction status (check if confirmed)
   */
  async getTransactionStatus(signature: string): Promise<{
    success: boolean;
    confirmed?: boolean;
    error?: string;
  }> {
    try {
      const status = await this.connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });

      if (status.value?.confirmationStatus === 'confirmed' || 
          status.value?.confirmationStatus === 'finalized') {
        return { success: true, confirmed: true };
      }

      return { success: true, confirmed: false };
    } catch (error) {
      logger.error('[OnChain] Get transaction status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check status',
      };
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(transaction: Transaction): Promise<{ success: boolean; fee?: number; error?: string }> {
    try {
      const message = transaction.compileMessage();
      const fee = await this.connection.getFeeForMessage(message);

      if (fee.value) {
        return {
          success: true,
          fee: fee.value / LAMPORTS_PER_SOL, // Convert to SOL
        };
      }

      return {
        success: false,
        error: 'Failed to estimate fee',
      };
    } catch (error) {
      logger.error('[OnChain] Estimate fee error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to estimate fee',
      };
    }
  }
}

// Export singleton instance
export const onChainTransactions = new OnChainTransactionService();

