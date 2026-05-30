/**
 * Solana RPC Manager with Failover & Load Balancing
 * Automatically switches between RPC providers for optimal performance
 */

import logger from './logger';
import { Connection, PublicKey as _PublicKey } from '@solana/web3.js';

interface RPCProvider {
  url: string;
  priority: number;
  weight: number;
  isHealthy: boolean;
  responseTime: number;
}

const RPC_ENDPOINTS: Array<{ url: string; priority: number; weight: number }> = [
  { url: process.env.HELIUS_RPC_URL || '', priority: 1, weight: 0.5 },
  { url: process.env.QUICKNODE_RPC_URL || '', priority: 2, weight: 0.3 },
  { url: 'https://api.mainnet-beta.solana.com', priority: 3, weight: 0.2 }
];

class SolanaRPCManager {
  private providers: Map<string, RPCProvider> = new Map();
  private requestStats: Map<string, { total: number; success: number; totalTime: number }> = new Map();
  private lastBlockhash: { hash: string; lastValidBlockHeight: number; timestamp: number } | null = null;

  constructor() {
    RPC_ENDPOINTS.forEach(endpoint => {
      if (!endpoint.url) return;

      this.providers.set(endpoint.url, {
        url: endpoint.url,
        priority: endpoint.priority,
        weight: endpoint.weight,
        isHealthy: true,
        responseTime: 0
      });
      this.requestStats.set(endpoint.url, { total: 0, success: 0, totalTime: 0 });
    });

    // Health check every 30 seconds
    setInterval(() => this.healthCheck(), 30000);

    // Refresh blockhash every 20 seconds
    setInterval(() => this.refreshBlockhash(), 20000);
  }

  /**
   * Get best RPC provider based on health and response time
   */
  getBestProvider(): Connection {
    const candidates = Array.from(this.providers.values())
      .filter(p => p.isHealthy && p.url)
      .sort((a, b) => a.responseTime - b.responseTime);

    if (candidates.length === 0) {
      const firstHealthy = Array.from(this.providers.values()).find(p => p.url);
      if (firstHealthy) {
        return new Connection(firstHealthy.url, 'confirmed');
      }
      throw new Error('No RPC endpoints available');
    }

    return new Connection(candidates[0].url, 'confirmed');
  }

  /**
   * Get cached blockhash for transaction signing
   */
  async getBlockhash() {
    if (
      this.lastBlockhash &&
      Date.now() - this.lastBlockhash.timestamp < 30000
    ) {
      return this.lastBlockhash;
    }

    await this.refreshBlockhash();
    return this.lastBlockhash;
  }

  private async refreshBlockhash() {
    try {
      const connection = this.getBestProvider();
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      this.lastBlockhash = { hash: blockhash, lastValidBlockHeight, timestamp: Date.now() };
    } catch (error) {
      logger.error('Failed to refresh blockhash:', error);
    }
  }

  private async healthCheck() {
    for (const provider of this.providers.values()) {
      if (!provider.url) continue;

      try {
        const start = Date.now();
        const connection = new Connection(provider.url, 'confirmed');
        await connection.getSlot();
        provider.isHealthy = true;
        provider.responseTime = Date.now() - start;
        if (process.env.DEBUG_RPC) {
          logger.info(`✅ RPC healthy: ${provider.url} (${provider.responseTime}ms)`);
        }
      } catch (error) {
        provider.isHealthy = false;
        logger.warn(`❌ RPC unhealthy: ${provider.url}`);
      }
    }
  }
}

export const solanaRPCManager = new SolanaRPCManager();
