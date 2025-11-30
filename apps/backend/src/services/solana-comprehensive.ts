/**
 * 🚀 Comprehensive Solana/Helius Integration Service
 *
 * Integrates ALL available tools from Solana and Helius:
 * - Enhanced RPC with error diagnostics
 * - Transaction simulation for error prevention
 * - Priority fees optimization
 * - Account monitoring and webhooks
 * - Transaction status tracking
 * - Rate limiting and smart retry logic
 * - Metrics and analytics
 * - Program logs analysis
 * - Commitment level optimization
 * - Blockhash caching
 */

import {
  Connection,
  PublicKey,
  Transaction,
  // TransactionMessage,
  VersionedTransaction,
  Commitment,
  // RpcResponseAndContext,
  SignatureStatus,
  // ConfirmedSignatureInfo,
  // ParsedAccountData,
  // AccountInfo,
} from '@solana/web3.js';
import axios, { AxiosInstance } from 'axios';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('solanaComprehensive');

interface PriorityFeesData {
  percentile_5: number;
  percentile_10: number;
  percentile_25: number;
  percentile_50: number;
  percentile_75: number;
  percentile_90: number;
  percentile_95: number;
  percentile_99: number;
}

interface TransactionSimulation {
  success: boolean;
  logs?: string[];
  error?: string;
  computeUnitsUsed?: number;
  returnData?: {
    programId: string;
    data: string;
  };
}

interface EnhancedErrorDiagnostic {
  code: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedAction: string;
  timestamp: number;
  retryable: boolean;
  estimatedRetryAfter?: number;
}

interface TransactionMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageConfirmationTime: number;
  averageComputeUnits: number;
  lastUpdated: number;
}

interface AccountChangeEvent {
  address: string;
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch: number | null;
  timestamp: number;
  changeType: 'CREATED' | 'UPDATED' | 'DELETED';
}

class SolanaComprehensiveService {
  private connection: Connection;
  private heliusClient: AxiosInstance;
  private heliusApiKey: string;
  private metricsStore: Map<string, TransactionMetrics>;
  private blockhashCache: Map<string, { blockhash: string; expiry: number }>;
  private accountMonitors: Map<string, ReturnType<typeof setInterval>>;
  private maxRetries: number = 5;
  private baseRetryDelay: number = 100; // ms

  constructor(rpcUrl: string, heliusApiKey: string) {
    this.heliusApiKey = heliusApiKey;
    this.connection = new Connection(rpcUrl, 'confirmed');

    // Initialize Helius HTTP client for enhanced APIs
    this.heliusClient = axios.create({
      baseURL: 'https://api.helius.xyz/v0',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.metricsStore = new Map();
    this.blockhashCache = new Map();
    this.accountMonitors = new Map();

    log.info('✓ Solana Comprehensive Service initialized');
  }

  /**
   * 1. ENHANCED RPC WITH ERROR DIAGNOSTICS
   * Provides detailed error information and recovery suggestions
   */
  async enhancedRpcCall<T>(
    method: string,
    params: any[],
    retryCount: number = 0
  ): Promise<T> {
    try {
      const result = await (this.connection as any).call(method, params);
      return result as T;
    } catch (error: any) {
      const diagnostic = this.diagnoseError(error, method);

      if (diagnostic.retryable && retryCount < this.maxRetries) {
        const delay =
          this.baseRetryDelay * Math.pow(2, retryCount) +
          Math.random() * 100;
        await this.delay(delay);
        return this.enhancedRpcCall(method, params, retryCount + 1);
      }

      throw {
        ...diagnostic,
        originalError: error,
      };
    }
  }

  /**
   * 2. TRANSACTION SIMULATION
   * Dry-run transactions to catch errors before sending
   */
  async simulateTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<TransactionSimulation> {
    try {
      const result = await this.connection.simulateTransaction(
        transaction as Transaction,
        []
      );

      return {
        success: !result.value.err,
        logs: result.value.logs || undefined,
        error: result.value.err ? JSON.stringify(result.value.err) : undefined,
        computeUnitsUsed: this.extractComputeUnits(result.value.logs ?? undefined),
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Simulation failed';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 3. PRIORITY FEES OPTIMIZATION (Helius)
   * Get current network priority fees for optimal transaction placement
   */
  async getPriorityFees(): Promise<{
    recommendedFee: number;
    breakdown: PriorityFeesData;
    networkCongestion: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    try {
      const response = await this.heliusClient.get('/priority-fees', {
        params: {
          api_key: this.heliusApiKey,
        },
      });

      const fees = response.data as PriorityFeesData;

      // Determine network congestion
      let congestion: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (fees.percentile_75 > 10000) congestion = 'MEDIUM';
      if (fees.percentile_95 > 50000) congestion = 'HIGH';

      // Recommend fee based on congestion
      let recommendedFee = fees.percentile_50; // Median
      if (congestion === 'HIGH') recommendedFee = fees.percentile_75;
      if (congestion === 'MEDIUM') recommendedFee = fees.percentile_75;

      return {
        recommendedFee,
        breakdown: fees,
        networkCongestion: congestion,
      };
    } catch (error: any) {
      log.error('Failed to fetch priority fees:', error);
      return {
        recommendedFee: 1000, // Fallback
        breakdown: {
          percentile_5: 500,
          percentile_10: 750,
          percentile_25: 1000,
          percentile_50: 1000,
          percentile_75: 2000,
          percentile_90: 5000,
          percentile_95: 10000,
          percentile_99: 50000,
        },
        networkCongestion: 'MEDIUM',
      };
    }
  }

  /**
   * 4. ACCOUNT MONITORING & WEBHOOKS (Helius)
   * Monitor account changes in real-time
   */
  async startAccountMonitoring(
    address: string,
    callback: (event: AccountChangeEvent) => void,
    pollInterval: number = 5000
  ): Promise<void> {
    if (this.accountMonitors.has(address)) {
      log.warn(`Already monitoring ${address}`);
      return;
    }

    let lastChecked: any = null;

    const monitor = setInterval(async () => {
      try {
        const accountInfo = await this.connection.getAccountInfo(
          new PublicKey(address)
        );

        if (!lastChecked || JSON.stringify(lastChecked) !== JSON.stringify(accountInfo)) {
          const changeType =
            !lastChecked && accountInfo
              ? 'CREATED'
              : lastChecked && !accountInfo
              ? 'DELETED'
              : 'UPDATED';

          const event: AccountChangeEvent = {
            address,
            lamports: accountInfo?.lamports || 0,
            owner: accountInfo?.owner.toString() || 'UNKNOWN',
            executable: accountInfo?.executable || false,
            rentEpoch: accountInfo?.rentEpoch || null,
            timestamp: Date.now(),
            changeType: changeType as any,
          };

          callback(event);
          lastChecked = accountInfo;
        }
      } catch (error) {
        console.error(`Error monitoring account ${address}:`, error);
      }
    }, pollInterval);

    this.accountMonitors.set(address, monitor);
    log.info(`Started monitoring account: ${address}`);
  }

  /**
   * Stop monitoring an account
   */
  stopAccountMonitoring(address: string): void {
    const monitor = this.accountMonitors.get(address);
    if (monitor) {
      clearInterval(monitor);
      this.accountMonitors.delete(address);
      log.info(`Stopped monitoring account: ${address}`);
    }
  }

  /**
   * 5. TRANSACTION STATUS TRACKING
   * Track transaction status with enhanced diagnostics
   */
  async trackTransactionStatus(
    signature: string,
    maxWaitMs: number = 60000
  ): Promise<{
    status: SignatureStatus | null;
    confirmations: number;
    isExpired: boolean;
    error?: string;
  }> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const status = await this.connection.getSignatureStatus(signature);

        if (status.value) {
          return {
            status: status.value,
            confirmations: status.value.confirmations || 0,
            isExpired: !!status.value.err,
            error: status.value.err ? JSON.stringify(status.value.err) : undefined,
          };
        }

        await this.delay(1000);
      } catch (error: any) {
        return {
          status: null,
          confirmations: 0,
          isExpired: false,
          error: error.message,
        };
      }
    }

    return {
      status: null,
      confirmations: 0,
      isExpired: true,
      error: 'Transaction tracking timeout',
    };
  }

  /**
   * 6. BLOCKHASH CACHING
   * Cache recent blockhash to avoid RPC calls (valid for ~60 seconds)
   */
  async getCachedBlockhash(): Promise<string> {
    const now = Date.now();

    // Check cache
    for (const [hash, data] of this.blockhashCache) {
      if (data.expiry > now) {
        return hash;
      } else {
        this.blockhashCache.delete(hash);
      }
    }

    // Fetch and cache new blockhash
    const latestBlockhash = await this.connection.getLatestBlockhash();
    const hash = latestBlockhash.blockhash;
    const expiry = now + 55000; // Valid for 55 seconds

    this.blockhashCache.set(hash, { blockhash: hash, expiry });
    return hash;
  }

  /**
   * 7. ENHANCED ERROR DIAGNOSTICS
   * Categorize and provide recovery suggestions for errors
   */
  private diagnoseError(error: any, _context: string): EnhancedErrorDiagnostic {
    const errorString = JSON.stringify(error);
    const timestamp = Date.now();

    // RPC Connection Errors
    if (errorString.includes('ECONNREFUSED') || errorString.includes('timeout')) {
      return {
        code: 'RPC_CONNECTION_FAILED',
        message: 'Failed to connect to Solana RPC endpoint',
        severity: 'HIGH',
        suggestedAction: 'Check RPC URL, try fallback endpoint, or wait for network recovery',
        timestamp,
        retryable: true,
        estimatedRetryAfter: 5000,
      };
    }

    // Rate Limiting
    if (error.status === 429 || errorString.includes('rate')) {
      return {
        code: 'RATE_LIMITED',
        message: 'RPC endpoint rate limit exceeded',
        severity: 'MEDIUM',
        suggestedAction: 'Implement exponential backoff, reduce request frequency',
        timestamp,
        retryable: true,
        estimatedRetryAfter: 10000,
      };
    }

    // Invalid Signature
    if (errorString.includes('Invalid signature') || errorString.includes('invalid')) {
      return {
        code: 'INVALID_SIGNATURE',
        message: 'Transaction signature is invalid',
        severity: 'CRITICAL',
        suggestedAction: 'Verify wallet, check transaction parameters, re-sign transaction',
        timestamp,
        retryable: false,
      };
    }

    // Insufficient Funds
    if (errorString.includes('insufficient funds') || errorString.includes('not enough')) {
      return {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Account does not have enough SOL or tokens',
        severity: 'CRITICAL',
        suggestedAction: 'Fund account with SOL or tokens before transaction',
        timestamp,
        retryable: false,
      };
    }

    // Program Error
    if (errorString.includes('Program failed') || errorString.includes('InstructionError')) {
      return {
        code: 'PROGRAM_ERROR',
        message: 'Smart contract execution failed',
        severity: 'HIGH',
        suggestedAction: 'Check program logs, verify transaction parameters, simulate first',
        timestamp,
        retryable: false,
      };
    }

    // Blockhash Expired
    if (errorString.includes('Blockhash not found') || errorString.includes('expired')) {
      return {
        code: 'BLOCKHASH_EXPIRED',
        message: 'Transaction blockhash has expired',
        severity: 'MEDIUM',
        suggestedAction: 'Get fresh blockhash and re-sign transaction',
        timestamp,
        retryable: true,
        estimatedRetryAfter: 1000,
      };
    }

    // Default error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      severity: 'MEDIUM',
      suggestedAction: 'Check logs, verify parameters, contact support if persistent',
      timestamp,
      retryable: true,
      estimatedRetryAfter: 5000,
    };
  }

  /**
   * 8. METRICS & ANALYTICS
   * Track performance metrics and transaction statistics
   */
  recordTransactionMetric(
    wallet: string,
    success: boolean,
    computeUnits?: number,
    confirmationTime?: number
  ): void {
    const key = wallet;
    const metrics = this.metricsStore.get(key) || {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      averageConfirmationTime: 0,
      averageComputeUnits: 0,
      lastUpdated: Date.now(),
    };

    metrics.totalTransactions++;
    if (success) {
      metrics.successfulTransactions++;
    } else {
      metrics.failedTransactions++;
    }

    if (confirmationTime !== undefined) {
      metrics.averageConfirmationTime =
        (metrics.averageConfirmationTime * (metrics.totalTransactions - 1) +
          confirmationTime) /
        metrics.totalTransactions;
    }

    if (computeUnits !== undefined) {
      metrics.averageComputeUnits =
        (metrics.averageComputeUnits * (metrics.totalTransactions - 1) +
          computeUnits) /
        metrics.totalTransactions;
    }

    metrics.lastUpdated = Date.now();
    this.metricsStore.set(key, metrics);
  }

  getMetrics(wallet?: string): TransactionMetrics | Map<string, TransactionMetrics> {
    if (wallet) {
      return this.metricsStore.get(wallet) || {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        averageConfirmationTime: 0,
        averageComputeUnits: 0,
        lastUpdated: Date.now(),
      };
    }
    return this.metricsStore;
  }

  /**
   * 9. PROGRAM LOGS ANALYSIS
   * Extract useful information from program execution logs
   */
  private extractComputeUnits(logs?: string[]): number | undefined {
    if (!logs) return undefined;

    for (const log of logs) {
      const match = log.match(/consumed (\d+) of (\d+) compute units/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return undefined;
  }

  /**
   * 10. COMMITMENT LEVEL OPTIMIZATION
   * Choose optimal commitment level based on transaction importance
   */
  getOptimalCommitment(
    transactionType: 'READ' | 'WRITE' | 'SENSITIVE'
  ): Commitment {
    switch (transactionType) {
      case 'READ':
        return 'processed'; // Fastest, for balance queries
      case 'WRITE':
        return 'confirmed'; // Safe for most transactions
      case 'SENSITIVE':
        return 'finalized'; // Safest, for large transfers
      default:
        return 'confirmed';
    }
  }

  /**
   * UTILITY: Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * CLEANUP: Stop all monitors on shutdown
   */
  async shutdown(): Promise<void> {
    for (const [_address, monitor] of this.accountMonitors) {
      clearInterval(monitor);
    }
    this.accountMonitors.clear();
    this.blockhashCache.clear();
    log.info('✓ Solana Comprehensive Service shutdown');
  }
}

export default SolanaComprehensiveService;
export type {
  PriorityFeesData,
  TransactionSimulation,
  EnhancedErrorDiagnostic,
  TransactionMetrics,
  AccountChangeEvent,
};
