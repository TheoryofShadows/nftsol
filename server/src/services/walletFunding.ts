import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as bs58 from 'bs58';

export interface FundWalletRequest {
  walletAddress: string;
  amount: number; // Amount in SOL
  fundingSource?: 'treasury' | 'airdrop'; // Default: airdrop on devnet, treasury on mainnet
}

export interface FundWalletResponse {
  success: boolean;
  signature?: string;
  balance?: number;
  error?: string;
}

export class WalletFundingService {
  private connection: Connection;
  private fundingWallet: Keypair | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
    this.loadFundingWallet();
  }

  private loadFundingWallet() {
    // Load funding wallet from environment variables
    const fundingWalletSecret = process.env.FUNDING_WALLET_SECRET;
    if (fundingWalletSecret) {
      try {
        const secretKey = bs58.decode(fundingWalletSecret);
        this.fundingWallet = Keypair.fromSecretKey(secretKey);
        console.log('✅ Funding wallet loaded:', this.fundingWallet.publicKey.toString());
      } catch (error) {
        console.error('❌ Failed to load funding wallet:', error);
      }
    } else {
      console.warn('⚠️ FUNDING_WALLET_SECRET not set, airdrops will only work on devnet');
    }
  }

  async fundWallet(request: FundWalletRequest): Promise<FundWalletResponse> {
    try {
      const recipientPublicKey = new PublicKey(request.walletAddress);
      const amountInLamports = request.amount * LAMPORTS_PER_SOL;

      // Validate amount
      if (request.amount <= 0) {
        return {
          success: false,
          error: 'Amount must be greater than 0'
        };
      }

      if (amountInLamports > 10 * LAMPORTS_PER_SOL) {
        return {
          success: false,
          error: 'Cannot transfer more than 10 SOL per request'
        };
      }

      // Determine funding method
      const cluster = process.env.SOLANA_CLUSTER || 'devnet';
      const method = request.fundingSource || (cluster === 'devnet' ? 'airdrop' : 'treasury');

      let signature: string;

      if (method === 'airdrop' && cluster === 'devnet') {
        // Use airdrop for devnet
        console.log(`🪂 Requesting airdrop of ${request.amount} SOL to ${request.walletAddress}`);
        signature = await this.requestAirdrop(recipientPublicKey, amountInLamports);
      } else if (method === 'treasury' && this.fundingWallet) {
        // Use treasury wallet for mainnet
        console.log(`💰 Transferring ${request.amount} SOL from treasury to ${request.walletAddress}`);
        signature = await this.transferFromTreasury(recipientPublicKey, amountInLamports);
      } else {
        return {
          success: false,
          error: `Funding method '${method}' not available. Check FUNDING_WALLET_SECRET configuration.`
        };
      }

      // Wait for confirmation
      await this.connection.confirmTransaction(signature, 'confirmed');

      // Get updated balance
      const balance = await this.connection.getBalance(recipientPublicKey);
      const balanceInSOL = balance / LAMPORTS_PER_SOL;

      console.log(`✅ Successfully funded wallet: ${request.walletAddress} with ${request.amount} SOL`);
      console.log(`   New balance: ${balanceInSOL} SOL`);

      return {
        success: true,
        signature,
        balance: balanceInSOL
      };
    } catch (error) {
      console.error('❌ Wallet funding failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Wallet funding failed'
      };
    }
  }

  private async requestAirdrop(recipient: PublicKey, lamports: number): Promise<string> {
    const signature = await this.connection.requestAirdrop(recipient, lamports);
    return signature;
  }

  private async transferFromTreasury(recipient: PublicKey, lamports: number): Promise<string> {
    if (!this.fundingWallet) {
      throw new Error('Funding wallet not initialized');
    }

    // Create transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: this.fundingWallet.publicKey,
      toPubkey: recipient,
      lamports,
    });

    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction);
    const signature = await this.connection.sendTransaction(
      transaction,
      [this.fundingWallet],
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      }
    );

    return signature;
  }

  async getFundingWalletBalance(): Promise<number | null> {
    if (!this.fundingWallet) {
      return null;
    }

    try {
      const balance = await this.connection.getBalance(this.fundingWallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get funding wallet balance:', error);
      return null;
    }
  }

  async getWalletBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return 0;
    }
  }
}
