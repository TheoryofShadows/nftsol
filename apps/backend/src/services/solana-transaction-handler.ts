/**
 * 🚀 Solana Transaction Handler
 * Best practices for safe, reliable transaction management
 * - Proper error handling and recovery
 * - Transaction confirmation with retries
 * - Fee optimization
 * - Anchor/Web3.js best practices
 */

import {
  Connection,
  // PublicKey,
  Transaction,
  VersionedTransaction,
  // TransactionMessage,
  Commitment,
  // RpcResponseAndContext,
  SignatureStatus,
} from '@solana/web3.js';

interface TransactionConfig {
  connection: Connection;
  blockhashCacheTTL?: number; // milliseconds
  confirmationAttempts?: number;
  confirmationTimeout?: number; // milliseconds
}

interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  details?: any;
}

interface BlockhashCache {
  blockhash: string;
  lastValidBlockHeight: number;
  timestamp: number;
}

class SolanaTransactionHandler {
  private connection: Connection;
  private blockhashCache: BlockhashCache | null = null;
  private blockhashCacheTTL: number;
  private confirmationAttempts: number;
  private confirmationTimeout: number;

  constructor(config: TransactionConfig) {
    this.connection = config.connection;
    this.blockhashCacheTTL = config.blockhashCacheTTL || 60000; // 60 seconds
    this.confirmationAttempts = config.confirmationAttempts || 30;
    this.confirmationTimeout = config.confirmationTimeout || 30000;
  }

  /**
   * Get fresh blockhash with caching
   * - Reduces RPC calls
   * - Accounts for blockhash validity window (~2 minutes)
   */
  async getLatestBlockhash(
    commitment: Commitment = 'confirmed'
  ): Promise<BlockhashCache> {
    // Check if cache is still valid
    if (this.blockhashCache) {
      const age = Date.now() - this.blockhashCache.timestamp;
      if (age < this.blockhashCacheTTL) {
        return this.blockhashCache;
      }
    }

    try {
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash(commitment);

      this.blockhashCache = {
        blockhash,
        lastValidBlockHeight,
        timestamp: Date.now(),
      };

      return this.blockhashCache;
    } catch (error) {
      console.error('Failed to get blockhash:', error);
      throw new Error('Failed to retrieve latest blockhash');
    }
  }

  /**
   * Send transaction with proper error handling
   */
  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    signers?: any[]
  ): Promise<TransactionResult> {
    try {
      // Ensure transaction has recent blockhash
      if (transaction instanceof Transaction) {
        const { blockhash } = await this.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        // Sign transaction if signers provided
        if (signers && signers.length > 0) {
          transaction.sign(...signers);
        }
      }

      // Send raw transaction with preflight checks
      const signature = await this.connection.sendRawTransaction(
        transaction instanceof VersionedTransaction
          ? transaction.serialize()
          : transaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3,
        }
      );

      return {
        success: true,
        signature,
      };
    } catch (error: any) {
      console.error('Failed to send transaction:', error);
      return {
        success: false,
        error: error.message || 'Unknown error sending transaction',
        details: error,
      };
    }
  }

  /**
   * Confirm transaction with retries and timeout
   * - Waits for transaction confirmation
   * - Handles timeout scenarios
   * - Implements exponential backoff
   */
  async confirmTransaction(
    signature: string,
    commitment: Commitment = 'confirmed'
  ): Promise<TransactionResult> {
    let attempts = 0;
    const startTime = Date.now();

    while (attempts < this.confirmationAttempts) {
      try {
        await this.getLatestBlockhash();

        const status = await this.connection.getSignatureStatus(signature);

        if (status.value === null) {
          // Transaction not found yet
          attempts++;
          const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
          await this.delay(delay);
          continue;
        }

        if (status.value.err) {
          return {
            success: false,
            signature,
            error: `Transaction failed: ${JSON.stringify(status.value.err)}`,
          };
        }

        if (
          status.value.confirmations &&
          status.value.confirmations >= this.getRequiredConfirmations(commitment)
        ) {
          return {
            success: true,
            signature,
            details: {
              confirmations: status.value.confirmations,
              finalized: status.value.confirmations >= 32,
            },
          };
        }

        // Check timeout
        if (Date.now() - startTime > this.confirmationTimeout) {
          return {
            success: false,
            signature,
            error: 'Transaction confirmation timeout',
          };
        }

        attempts++;
        await this.delay(2000);
      } catch (error) {
        console.error('Error confirming transaction:', error);
        attempts++;
        await this.delay(2000);
      }
    }

    return {
      success: false,
      signature,
      error: 'Transaction confirmation attempts exceeded',
    };
  }

  /**
   * Estimate transaction fee (using fee market)
   */
  async estimateTransactionFee(
    transaction: Transaction | VersionedTransaction
  ): Promise<number> {
    try {
      const fee = await this.connection.getFeeForMessage(
        transaction instanceof VersionedTransaction
          ? transaction.message
          : transaction.compileMessage(),
        'confirmed'
      );
      return fee.value || 5000; // Default 5000 lamports
    } catch (error) {
      console.warn('Failed to estimate fee, using default:', error);
      return 5000; // Default fallback
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(signature: string): Promise<any> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
      return transaction;
    } catch (error) {
      console.error('Failed to get transaction details:', error);
      return null;
    }
  }

  /**
   * Simulate transaction before sending
   * - Validates instructions
   * - Estimates compute units
   * - Detects common errors early
   */
  async simulateTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<{
    success: boolean;
    logs?: string[];
    computeUnitsUsed?: number;
    error?: string;
  }> {
    try {
      if (transaction instanceof Transaction) {
        const { blockhash } = await this.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
      }

      const simulationResult = await this.connection.simulateTransaction(
        transaction as Transaction
      );

      if (simulationResult.value.err) {
        return {
          success: false,
          logs: simulationResult.value.logs || undefined,
          error: `Simulation failed: ${JSON.stringify(simulationResult.value.err)}`,
        };
      }

      return {
        success: true,
        logs: simulationResult.value.logs || undefined,
        computeUnitsUsed:
          simulationResult.value.unitsConsumed || undefined,
      };
    } catch (error: any) {
      console.error('Failed to simulate transaction:', error);
      return {
        success: false,
        error: error.message || 'Transaction simulation failed',
      };
    }
  }

  /**
   * Check if transaction is likely to succeed
   */
  async validateTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Simulate transaction
    const simulation = await this.simulateTransaction(transaction);
    if (!simulation.success) {
      issues.push(`Simulation failed: ${simulation.error}`);
    }

    // Check for common issues
    if (transaction instanceof Transaction) {
      if (!transaction.recentBlockhash) {
        issues.push('No recent blockhash set');
      }
      if (transaction.instructions.length === 0) {
        issues.push('Transaction has no instructions');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    signature: string
  ): Promise<SignatureStatus | null> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return status.value;
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return null;
    }
  }

  /**
   * Cancel transaction (if possible - by letting it expire)
   * Note: Solana doesn't support true transaction cancellation
   * This method documents the best practice for handling stuck transactions
   */
  async handleStuckTransaction(signature: string): Promise<{
    advice: string;
    nextSteps: string[];
  }> {
    const status = await this.getTransactionStatus(signature);

    if (!status) {
      return {
        advice: 'Transaction not found on chain',
        nextSteps: [
          'Check if signature is correct',
          'Wait for blockhash to expire',
          'Resubmit with new blockhash',
        ],
      };
    }

    if (status.err) {
      return {
        advice: 'Transaction failed with error',
        nextSteps: [
          'Review error message',
          'Fix underlying issue (account state, balance, etc.)',
          'Resubmit transaction',
        ],
      };
    }

    return {
      advice: 'Transaction pending - wait for confirmation',
      nextSteps: [
        'Check network status',
        'Monitor transaction with getSignatureStatus',
        'Wait up to 2 minutes for confirmation',
        'If expires, resubmit with new blockhash',
      ],
    };
  }

  /**
   * Connection health check
   */
  async healthCheck(): Promise<{
    connected: boolean;
    latency: number;
    rpcHealth: boolean;
  }> {
    const start = Date.now();

    try {
      await Promise.race([
        this.connection.getSlot('confirmed'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        ),
      ]);

      const latency = Date.now() - start;

      return {
        connected: true,
        latency,
        rpcHealth: true,
      };
    } catch (error) {
      return {
        connected: false,
        latency: Date.now() - start,
        rpcHealth: false,
      };
    }
  }

  /**
   * Get required confirmations for commitment level
   */
  private getRequiredConfirmations(commitment: Commitment): number {
    switch (commitment) {
      case 'processed':
        return 0;
      case 'confirmed':
        return 6; // ~6-10 blocks
      case 'finalized':
        return 32; // Full finality
      default:
        return 6;
    }
  }

  /**
   * Utility delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear blockhash cache
   */
  clearCache(): void {
    this.blockhashCache = null;
  }
}

export default SolanaTransactionHandler;
export { TransactionConfig, TransactionResult, BlockhashCache };
