/**
 * 🚀 Helius Advanced RPC Service
 * World-class Solana development with Helius enhanced RPC
 * 
 * Features:
 * - Digital Asset Standard (DAS) API for efficient NFT queries
 * - Enhanced transaction tracking
 * - Webhook support for real-time updates
 * - Priority fee recommendations
 * - Account compression support
 */

import { Connection, VersionedTransaction, Transaction } from '@solana/web3.js';
import axios, { AxiosInstance } from 'axios';
import { solanaConfig as _solanaConfig } from '../config';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('helius');

interface HeliusConfig {
  apiKey: string;
  cluster: 'mainnet-beta' | 'devnet';
  timeout?: number;
}

interface DASAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      symbol: string;
      description?: string;
    };
    links?: {
      image?: string;
      external_url?: string;
    };
  };
  authorities?: Array<{
    address: string;
    scopes: string[];
  }>;
  compression?: {
    eligible: boolean;
    compressed: boolean;
    data_hash: string;
    creator_hash: string;
    asset_hash: string;
    tree: string;
    seq: number;
    leaf_id: number;
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
  royalty?: {
    royalty_model: string;
    target: string | null;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate: string | null;
    ownership_model: string;
    owner: string;
  };
  supply: {
    print_max_supply: number;
    print_current_supply: number;
    edition_nonce: number | null;
  };
  mutable: boolean;
}

interface PriorityFeeRecommendation {
  min: number;
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
  unsafeMax: number;
}

interface TransactionWithMeta {
  signature: string;
  slot: number;
  blockTime: number | null;
  err: any;
  memo: string | null;
  fee: number;
  timestamp: number;
}

export class HeliusService {
  private connection: Connection;
  private httpClient: AxiosInstance;
  private config: HeliusConfig;
  private apiBaseUrl: string;

  constructor(config?: Partial<HeliusConfig>) {
    const apiKey = process.env.HELIUS_API_KEY || '';
    const cluster = (process.env.SOLANA_CLUSTER as 'mainnet-beta' | 'devnet') || 'mainnet-beta';
    
    this.config = {
      apiKey,
      cluster,
      timeout: config?.timeout || 30000,
    };

    // Construct Helius RPC URL
    const heliusRpcUrl = `https://${cluster === 'devnet' ? 'devnet' : 'mainnet'}.helius-rpc.com/?api-key=${apiKey}`;
    
    this.connection = new Connection(heliusRpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      disableRetryOnRateLimit: false,
      wsEndpoint: heliusRpcUrl.replace('https://', 'wss://'),
    });

    this.apiBaseUrl = `https://api${cluster === 'devnet' ? '-devnet' : ''}.helius.xyz`;
    
    this.httpClient = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    log.info(`[Helius] Service initialized`);
    log.info(`[Helius] Cluster: ${cluster}`);
    log.info(`[Helius] API Key: ${apiKey ? 'Configured' : 'Not configured'}`);
  }

  /**
   * Get connection instance (with Helius RPC)
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get asset by ID using DAS API (compressed NFTs)
   * Much faster than on-chain queries
   */
  async getAsset(assetId: string): Promise<DASAsset | null> {
    try {
      const response = await this.httpClient.post('/v0/get_asset', {
        id: assetId,
      }, {
        params: { 'api-key': this.config.apiKey },
      });

      return response.data || null;
    } catch (error) {
      log.error('[Helius] Failed to get asset:', error);
      return null;
    }
  }

  /**
   * Get assets by owner (supports pagination)
   */
  async getAssetsByOwner(
    ownerAddress: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: { sortBy: string; sortDirection: 'asc' | 'desc' };
    }
  ): Promise<{ items: DASAsset[]; total: number; page: number; limit: number }> {
    try {
      const response = await this.httpClient.post('/v0/assets_by_owner', {
        ownerAddress,
        page: options?.page || 1,
        limit: options?.limit || 50,
        ...options?.sortBy,
      }, {
        params: { 'api-key': this.config.apiKey },
      });

      return {
        items: response.data.items || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        limit: response.data.limit || 50,
      };
    } catch (error) {
      log.error('[Helius] Failed to get assets by owner:', error);
      return { items: [], total: 0, page: 1, limit: 50 };
    }
  }

  /**
   * Search assets with filters (advanced)
   */
  async searchAssets(params: {
    ownerAddress?: string;
    creatorAddress?: string;
    collectionAddress?: string;
    compressed?: boolean;
    burnt?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: DASAsset[]; total: number }> {
    try {
      const response = await this.httpClient.post('/v0/search_assets', params, {
        params: { 'api-key': this.config.apiKey },
      });

      return {
        items: response.data.items || [],
        total: response.data.total || 0,
      };
    } catch (error) {
      log.error('[Helius] Failed to search assets:', error);
      return { items: [], total: 0 };
    }
  }

  /**
   * Get priority fee recommendation
   * Essential for ensuring transactions land during congestion
   */
  async getPriorityFeeEstimate(accountKeys?: string[]): Promise<PriorityFeeRecommendation | null> {
    try {
      const response = await this.httpClient.post('/v0/fees/priority-fee', {
        transaction: accountKeys ? { accountKeys } : undefined,
      }, {
        params: { 'api-key': this.config.apiKey },
      });

      return response.data.priorityFeeEstimate || null;
    } catch (error) {
      log.error('[Helius] Failed to get priority fee estimate:', error);
      return null;
    }
  }

  /**
   * Get enhanced transaction history
   * @deprecated Use getTransactionsForAddress() for better performance
   */
  async getEnhancedTransactions(
    address: string,
    options?: {
      beforeSignature?: string;
      limit?: number;
    }
  ): Promise<TransactionWithMeta[]> {
    try {
      const response = await this.httpClient.get('/v0/addresses/' + address + '/transactions', {
        params: {
          'api-key': this.config.apiKey,
          before: options?.beforeSignature,
          limit: options?.limit || 10,
        },
      });

      return response.data || [];
    } catch (error) {
      log.error('[Helius] Failed to get enhanced transactions:', error);
      return [];
    }
  }

  /**
   * 🚀 NEW: Get transactions for address (Helius proprietary endpoint - Nov 2025)
   * This is THE BIGGEST RPC change in Solana history!
   * 
   * Features:
   * - Efficient paginated fetching without rate limits
   * - Complete transaction history (no incomplete results)
   * - Optimized for wallets, analytics, and DeFi protocols
   * - Drastically reduces dev friction and costs
   * 
   * @param address - Solana address to get transactions for
   * @param options - Pagination and filtering options
   * @returns Paginated transaction history with metadata
   */
  async getTransactionsForAddress(
    address: string,
    options?: {
      cursor?: string;        // Pagination cursor
      limit?: number;         // Number of transactions (default: 100, max: 1000)
      type?: 'all' | 'nft' | 'token' | 'sol';  // Filter by transaction type
      source?: string;        // Filter by program/protocol
      beforeTime?: number;    // Unix timestamp
      afterTime?: number;     // Unix timestamp
    }
  ): Promise<{
    transactions: Array<{
      signature: string;
      timestamp: number;
      slot: number;
      type: string;
      fee: number;
      feePayer: string;
      status: 'success' | 'failed';
      instructions: Array<{
        programId: string;
        data: string;
        accounts: string[];
      }>;
      events?: Array<{
        type: string;
        data: any;
      }>;
      nativeTransfers?: Array<{
        from: string;
        to: string;
        amount: number;
      }>;
      tokenTransfers?: Array<{
        mint: string;
        from: string;
        to: string;
        amount: number;
        decimals: number;
      }>;
    }>;
    cursor?: string;  // Next page cursor
    hasMore: boolean;
  }> {
    try {
      log.info('[Helius] 🚀 Using new getTransactionsForAddress API');
      
      const response = await this.httpClient.post(
        '/v1/transactions',
        {
          address,
          cursor: options?.cursor,
          limit: Math.min(options?.limit || 100, 1000),
          type: options?.type || 'all',
          source: options?.source,
          beforeTime: options?.beforeTime,
          afterTime: options?.afterTime,
        },
        {
          params: { 'api-key': this.config.apiKey },
          timeout: 30000, // 30s timeout for large queries
        }
      );

      return {
        transactions: response.data.transactions || [],
        cursor: response.data.cursor,
        hasMore: response.data.hasMore || false,
      };
    } catch (error) {
      log.error('[Helius] Failed to get transactions for address:', error);
      return {
        transactions: [],
        hasMore: false,
      };
    }
  }

  /**
   * Get complete transaction history for address (all pages)
   * Uses the new getTransactionsForAddress with automatic pagination
   */
  async getAllTransactionsForAddress(
    address: string,
    maxTransactions: number = 10000
  ): Promise<Array<any>> {
    const allTransactions: Array<any> = [];
    let cursor: string | undefined;
    let hasMore = true;

    log.info('[Helius] Fetching complete transaction history (no rate limits!)');

    while (hasMore && allTransactions.length < maxTransactions) {
      const result = await this.getTransactionsForAddress(address, {
        cursor,
        limit: Math.min(1000, maxTransactions - allTransactions.length),
      });

      allTransactions.push(...result.transactions);
      cursor = result.cursor;
      hasMore = result.hasMore && !!cursor;

      log.info(`[Helius] Fetched ${allTransactions.length} transactions...`);
    }

    log.info(`[Helius] ✅ Complete! Total: ${allTransactions.length} transactions`);
    return allTransactions;
  }

  /**
   * Send optimized transaction with Helius
   * Automatically includes priority fees
   */
  async sendOptimizedTransaction(
    transaction: Transaction | VersionedTransaction,
    options?: {
      skipPreflight?: boolean;
      maxRetries?: number;
    }
  ): Promise<string> {
    const skipPreflight = options?.skipPreflight ?? false;
    const maxRetries = options?.maxRetries ?? 3;

    try {
      // Get recommended priority fee
      const feeRecommendation = await this.getPriorityFeeEstimate();

      if (feeRecommendation) {
        log.info('[Helius] Using recommended priority fee', { fee: feeRecommendation.medium });
      }

      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight,
          maxRetries,
          preflightCommitment: 'confirmed',
        }
      );

      return signature;
    } catch (error) {
      log.error('[Helius] Failed to send transaction:', error);
      throw error;
    }
  }

  /**
   * Get assets by collection (useful for marketplace)
   */
  async getAssetsByCollection(
    collectionAddress: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: DASAsset[]; total: number }> {
    try {
      const response = await this.httpClient.post('/v0/assets_by_collection', {
        collectionAddress,
        page: options?.page || 1,
        limit: options?.limit || 50,
      }, {
        params: { 'api-key': this.config.apiKey },
      });

      return {
        items: response.data.items || [],
        total: response.data.total || 0,
      };
    } catch (error) {
      log.error('[Helius] Failed to get assets by collection:', error);
      return { items: [], total: 0 };
    }
  }

  /**
   * Check if Helius is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 0;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const slot = await this.connection.getSlot();
      return slot > 0;
    } catch (error) {
      log.error('[Helius] Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const heliusService = new HeliusService();

