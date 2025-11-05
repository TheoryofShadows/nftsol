/**
 * Optimized Solana Service with industry best practices
 * - RPC failover and load balancing
 * - Connection pooling
 * - Transaction optimization
 * - Account data caching
 * - Blockhash management
 * - Error handling and retries
 */

import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  LAMPORTS_PER_SOL,
  Commitment,
  SendTransactionError,
  TransactionError,
  VersionedTransaction,
  SendOptions,
} from '@solana/web3.js';
import { solanaConfig, programConfig } from '../config';
<<<<<<< HEAD
import { getRewardsVaultAddress } from '../utils/clout-vault';
=======
>>>>>>> origin/develop
import { cache, cached, cacheKeys } from '../utils/cache';
import { withRetry, requestDeduplicator } from '../utils/retry';
import logger from '../utils/logger';

// RPC endpoint configuration with fallback
const RPC_ENDPOINTS = [
  process.env.SOLANA_RPC_URL || solanaConfig.rpcUrl,
  process.env.SOLANA_RPC_BACKUP || 'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
].filter(Boolean);

interface ConnectionHealth {
  endpoint: string;
  healthy: boolean;
  latency: number;
  lastCheck: number;
}

class OptimizedSolanaService {
  private connections: Map<string, Connection> = new Map();
  private healthChecks: Map<string, ConnectionHealth> = new Map();
  private currentEndpointIndex = 0;
  private blockhashCache: { blockhash: string; expiresAt: number } | null = null;
  private readonly BLOCKHASH_TTL = 30 * 1000; // 30 seconds (blockhash expires after 60s)

  constructor() {
    // Initialize connections to all endpoints
    RPC_ENDPOINTS.forEach((endpoint) => {
      this.connections.set(
        endpoint,
        new Connection(endpoint, {
          commitment: solanaConfig.commitment as Commitment,
          confirmTransactionInitialTimeout: 60000, // 60 seconds
          disableRetryOnRateLimit: false, // Auto-retry on rate limit
        })
      );
      this.healthChecks.set(endpoint, {
        endpoint,
        healthy: true,
        latency: 0,
        lastCheck: 0,
      });
    });

    // Start health check monitoring
    this.startHealthCheckMonitoring();
  }

  /**
   * Get the best available connection (failover logic)
   */
  async getConnection(): Promise<Connection> {
    // Check for cached healthy connection
    const healthyEndpoint = this.getHealthiestEndpoint();
    if (healthyEndpoint) {
      return this.connections.get(healthyEndpoint)!;
    }

    // Rotate through endpoints
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % RPC_ENDPOINTS.length;
    return this.connections.get(RPC_ENDPOINTS[this.currentEndpointIndex])!;
  }

  /**
   * Get healthiest endpoint based on latency
   */
  private getHealthiestEndpoint(): string | null {
    const healthy = Array.from(this.healthChecks.values())
      .filter((h) => h.healthy && Date.now() - h.lastCheck < 60000) // Check within last minute
      .sort((a, b) => a.latency - b.latency);

    return healthy.length > 0 ? healthy[0].endpoint : null;
  }

  /**
   * Health check for RPC endpoints
   */
  private async checkEndpointHealth(endpoint: string): Promise<ConnectionHealth> {
    const connection = this.connections.get(endpoint)!;
    const start = Date.now();

    try {
      await connection.getVersion();
      const latency = Date.now() - start;

      return {
        endpoint,
        healthy: latency < 5000, // Consider healthy if < 5s
        latency,
        lastCheck: Date.now(),
      };
    } catch (error) {
      return {
        endpoint,
        healthy: false,
        latency: 9999,
        lastCheck: Date.now(),
      };
    }
  }

  /**
   * Monitor endpoint health periodically
   */
  private startHealthCheckMonitoring(): void {
    // Initial health check
    RPC_ENDPOINTS.forEach((endpoint) => {
      this.checkEndpointHealth(endpoint).then((health) => {
        this.healthChecks.set(endpoint, health);
      });
    });

    // Check every 30 seconds
    setInterval(() => {
      RPC_ENDPOINTS.forEach((endpoint) => {
        this.checkEndpointHealth(endpoint).then((health) => {
          this.healthChecks.set(endpoint, health);
        });
      });
    }, 30000);
  }

  /**
   * Get cached blockhash or fetch new one
   */
  async getRecentBlockhash(forceRefresh = false): Promise<string> {
    // Use cached blockhash if still valid
    if (
      !forceRefresh &&
      this.blockhashCache &&
      Date.now() < this.blockhashCache.expiresAt
    ) {
      return this.blockhashCache.blockhash;
    }

    // Fetch new blockhash with retry
    const connection = await this.getConnection();
    const { blockhash } = await withRetry(
      () => connection.getLatestBlockhash('finalized'),
      {
        maxRetries: 3,
        baseDelay: 500,
        retryable: (error) => {
          return (
            error?.code === 'ECONNRESET' ||
            error?.code === 'ETIMEDOUT' ||
            error?.message?.includes('429')
          );
        },
      }
    );

    // Cache blockhash
    this.blockhashCache = {
      blockhash,
      expiresAt: Date.now() + this.BLOCKHASH_TTL,
    };

    return blockhash;
  }

  /**
   * Get account balance with caching
   */
  async getBalance(publicKey: string): Promise<number> {
    const cacheKey = cacheKeys.cloutBalance(publicKey);

    return requestDeduplicator.dedupe(
      `balance:${publicKey}`,
      () =>
        cached(
          cacheKey,
          async () => {
            const pubKey = new PublicKey(publicKey);
            const connection = await this.getConnection();

            const balance = await withRetry(
              () => connection.getBalance(pubKey),
              {
                maxRetries: 2,
                retryable: (error) => {
                  return error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT';
                },
              }
            );

            return balance / LAMPORTS_PER_SOL;
          },
          30 * 1000 // 30 second cache
        )
    );
  }

  /**
   * Check if account exists (cached)
   */
  async accountExists(publicKey: string): Promise<boolean> {
    const cacheKey = `account:exists:${publicKey}`;

    return cached(
      cacheKey,
      async () => {
        const pubKey = new PublicKey(publicKey);
        const connection = await this.getConnection();

        const accountInfo = await withRetry(
          () => connection.getAccountInfo(pubKey),
          {
            maxRetries: 2,
            retryable: (error) => {
              return error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT';
            },
          }
        );

        return accountInfo !== null;
      },
      60 * 1000 // 1 minute cache
    );
  }

  /**
   * Simulate transaction before sending
   */
  async simulateTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<{
    success: boolean;
    err?: TransactionError | null;
    logs?: string[] | null;
  }> {
    const connection = await this.getConnection();

    try {
      const simulation = await connection.simulateTransaction(transaction as any, {
        commitment: 'confirmed',
        replaceRecentBlockhash: true,
        sigVerify: false,
      });

      return {
        success: simulation.value.err === null,
        err: simulation.value.err,
        logs: simulation.value.logs || null,
      };
    } catch (error) {
      logger.error('Transaction simulation failed', { error });
      return {
        success: false,
        err: error as TransactionError,
      };
    }
  }

  /**
   * Send transaction with optimized confirmation strategy
   */
  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    signers: Keypair[],
    options?: SendOptions
  ): Promise<string> {
    const connection = await this.getConnection();

    // Get fresh blockhash
    const blockhash = await this.getRecentBlockhash();

    // Prepare transaction
    if (transaction instanceof Transaction) {
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = signers[0]?.publicKey;
      transaction.sign(...signers);
    } else {
      // VersionedTransaction
      transaction.sign(signers);
    }

    // Simulate first (optional but recommended)
    if (options?.skipPreflight !== true) {
      const simulation = await this.simulateTransaction(transaction);
      if (!simulation.success) {
        throw new Error(`Transaction simulation failed: ${simulation.err}`);
      }
    }

    // Send transaction
    const signature = await withRetry(
      () => connection.sendRawTransaction(transaction.serialize(), options),
      {
        maxRetries: 3,
        baseDelay: 1000,
        retryable: (error: any) => {
          // Retry on network errors or rate limits
          return (
            error?.code === 'ECONNRESET' ||
            error?.code === 'ETIMEDOUT' ||
            error?.message?.includes('429') ||
            error?.message?.includes('rate limit')
          );
        },
      }
    );

    return signature;
  }

  /**
   * Confirm transaction with optimized strategy
   */
  async confirmTransaction(
    signature: string,
    commitment: Commitment = 'confirmed'
  ): Promise<boolean> {
    const connection = await this.getConnection();

    try {
      const confirmation = await connection.confirmTransaction(signature, commitment);
      return confirmation.value.err === null;
    } catch (error) {
      logger.error('Transaction confirmation failed', { signature, error });
      return false;
    }
  }

  /**
   * Batch get account info (optimized for multiple accounts)
   */
  async getMultipleAccounts(
    publicKeys: string[]
  ): Promise<(Buffer | null)[]> {
    const connection = await this.getConnection();
    const pubKeys = publicKeys.map((pk) => new PublicKey(pk));

    const accounts = await withRetry(
      () => connection.getMultipleAccountsInfo(pubKeys),
      {
        maxRetries: 2,
        retryable: (error) => {
          return error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT';
        },
      }
    );

    return accounts.map((acc) => acc?.data || null);
  }

  /**
   * Get program accounts (optimized with filters)
   */
  async getProgramAccounts(
    programId: string,
    filters?: any[]
  ): Promise<Array<{ pubkey: PublicKey; account: any }>> {
    const connection = await this.getConnection();
    const programPubkey = new PublicKey(programId);

    const accounts = await withRetry(
      () => connection.getProgramAccounts(programPubkey, { filters }),
      {
        maxRetries: 2,
        retryable: (error) => {
          return error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT';
        },
      }
    );

    return [...accounts];
  }

  /**
   * Health check with detailed status
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const connection = await this.getConnection();
      const start = Date.now();

      const [version, blockhash] = await Promise.all([
        connection.getVersion(),
        connection.getLatestBlockhash('processed'),
      ]);

      const latency = Date.now() - start;

      // Validate programs
      const programs = await this.validatePrograms();

      return {
        healthy: programs.valid && latency < 5000,
        details: {
          rpcUrl: Array.from(this.connections.keys()),
          currentEndpoint: await this.getConnection().then((c) => {
            for (const [endpoint, conn] of this.connections.entries()) {
              if (conn === c) return endpoint;
            }
            return 'unknown';
          }),
          cluster: solanaConfig.cluster,
          version,
          latency: `${latency}ms`,
          blockhash: blockhash.blockhash,
          programs: programs.valid ? 'All valid' : programs.errors,
          endpointHealth: Array.from(this.healthChecks.values()),
        },
      };
    } catch (error) {
      logger.error('Solana health check failed', { error });
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoints: Array.from(this.connections.keys()),
        },
      };
    }
  }

  /**
   * Validate program IDs
   */
  private async validatePrograms(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const connection = await this.getConnection();

<<<<<<< HEAD
    // Calculate rewards vault dynamically
    const rewardsVault = await getRewardsVaultAddress();

    const checks = [
      { id: programConfig.cloutProgramId, name: 'Clout Program' },
      { id: programConfig.marketProgramId, name: 'Market Program' },
      { id: programConfig.loyaltyProgramId, name: 'Loyalty Program' },
      // Only include rewards vault if it can be calculated
      ...(rewardsVault ? [{ id: rewardsVault.toBase58(), name: 'Rewards Vault' }] : []),
    ];

    await Promise.all(
      checks.map(async ({ id, name }) => {
        try {
          const pubKey = new PublicKey(id);
          const accountInfo = await connection.getAccountInfo(pubKey);
          if (!accountInfo) {
            // For rewards vault, it's OK if it doesn't exist yet (will be created on first use)
            if (name === 'Rewards Vault') {
              logger.warn('Rewards vault not found on chain (will be created on first use)');
            } else {
              errors.push(`${name} not found on chain`);
            }
          }
        } catch (error) {
          errors.push(`${name} validation failed`);
        }
      })
    );

    // Add error if vault address couldn't be calculated
    if (!rewardsVault) {
      errors.push('Rewards vault address could not be calculated (missing REWARDS_OWNER or CLOUT_MINT)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const optimizedSolanaService = new OptimizedSolanaService();
export default optimizedSolanaService;

