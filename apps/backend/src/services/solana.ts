import {
  Connection,
  PublicKey,
  Transaction,
  // SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { solanaConfig, programConfig } from '../config';
import { getRewardsVaultAddress } from '../utils/clout-vault';
import logger from '../utils/logger';
import { ApiResponse as _ApiResponse, MintResponse as _MintResponse } from '../types';

class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(solanaConfig.rpcUrl, {
      commitment: solanaConfig.commitment,
    });
  }

  // Get connection instance
  getConnection(): Connection {
    return this.connection;
  }

  // Get account balance
  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      logger.error('Error getting balance', { publicKey, error });
      throw new Error('Failed to get account balance');
    }
  }

  // Check if account exists
  async accountExists(publicKey: string): Promise<boolean> {
    try {
      const pubKey = new PublicKey(publicKey);
      const accountInfo = await this.connection.getAccountInfo(pubKey);
      return accountInfo !== null;
    } catch (error) {
      logger.error('Error checking account existence', { publicKey, error });
      return false;
    }
  }

  // Get program account info
  async getProgramAccount(programId: string): Promise<any> {
    try {
      const pubKey = new PublicKey(programId);
      const accountInfo = await this.connection.getAccountInfo(pubKey);
      return accountInfo;
    } catch (error) {
      logger.error('Error getting program account', { programId, error });
      throw new Error('Failed to get program account info');
    }
  }

  // Validate program IDs
  async validatePrograms(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check Clout Program
      const cloutAccount = await this.getProgramAccount(programConfig.cloutProgramId);
      if (!cloutAccount) {
        errors.push('Clout program not found on chain');
      }

      // Check Market Program
      const marketAccount = await this.getProgramAccount(programConfig.marketProgramId);
      if (!marketAccount) {
        errors.push('Market program not found on chain');
      }

      // Check Loyalty Program
      const loyaltyAccount = await this.getProgramAccount(programConfig.loyaltyProgramId);
      if (!loyaltyAccount) {
        errors.push('Loyalty program not found on chain');
      }

      // Check Rewards Vault (auto-calculated from REWARDS_OWNER + CLOUT_MINT)
      const rewardsVault = await getRewardsVaultAddress();
      if (rewardsVault) {
        const vaultAccount = await this.getProgramAccount(rewardsVault.toBase58());
        if (!vaultAccount) {
          errors.push('Rewards vault not found on chain (it will be created on first use)');
        }
      } else {
        errors.push('Rewards vault address could not be calculated (missing REWARDS_OWNER or CLOUT_MINT)');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Error validating programs', { error });
      return {
        valid: false,
        errors: ['Failed to validate programs'],
      };
    }
  }

  // Get recent blockhash
  async getRecentBlockhash(): Promise<string> {
    try {
      const { blockhash } = await this.connection.getLatestBlockhash();
      return blockhash;
    } catch (error) {
      logger.error('Error getting recent blockhash', { error });
      throw new Error('Failed to get recent blockhash');
    }
  }

  // Estimate transaction fees
  async estimateTransactionFee(transaction: Transaction): Promise<number> {
    try {
      const feeCalculator = await this.connection.getFeeForMessage(transaction.compileMessage());
      return feeCalculator?.value || 5000; // Default fee
    } catch (error) {
      logger.error('Error estimating transaction fee', { error });
      return 5000; // Default fee
    }
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const start = Date.now();
      const version = await this.connection.getVersion();
      const duration = Date.now() - start;

      // Basic health check - just verify RPC connection works
      // Program validation is too strict for health checks
      const healthy = version && duration < 10000;

      return {
        healthy,
        details: {
          rpcUrl: solanaConfig.rpcUrl,
          cluster: solanaConfig.cluster,
          version,
          responseTime: `${duration}ms`,
        },
      };
    } catch (error) {
      logger.error('Solana health check failed', { error });
      return {
        healthy: false,
        details: {
          error: 'Connection failed',
          rpcUrl: solanaConfig.rpcUrl,
        },
      };
    }
  }
}

export const solanaService = new SolanaService();
export default solanaService;
