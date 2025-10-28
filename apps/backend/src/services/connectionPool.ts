import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { logError } from '../utils/errorHandler';

export interface PooledConnection {
  connection: Connection;
  isHealthy: boolean;
  lastUsed: number;
  requestCount: number;
  errorCount: number;
}

export class SolanaConnectionPool {
  private connections: PooledConnection[] = [];
  private currentIndex = 0;
  private readonly maxConnections: number;
  private readonly healthCheckInterval: number;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(
    rpcUrls: string[],
    maxConnections: number = 5,
    healthCheckInterval: number = 30000 // 30 seconds
  ) {
    this.maxConnections = Math.min(maxConnections, rpcUrls.length);
    this.healthCheckInterval = healthCheckInterval;
    
    // Initialize connections
    this.initializeConnections(rpcUrls);
    
    // Start health check
    this.startHealthCheck();
  }

  private initializeConnections(rpcUrls: string[]): void {
    for (let i = 0; i < this.maxConnections; i++) {
      const rpcUrl = rpcUrls[i % rpcUrls.length];
      this.connections.push({
        connection: new Connection(rpcUrl, {
          commitment: 'confirmed',
          wsEndpoint: rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://'),
          fetch: this.createFetchWithTimeout(10000), // 10 second timeout
        }),
        isHealthy: true,
        lastUsed: 0,
        requestCount: 0,
        errorCount: 0
      });
    }
  }

  private createFetchWithTimeout(timeout: number): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const options = init;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    const healthCheckPromises = this.connections.map(async (pooledConn, index) => {
      try {
        const startTime = Date.now();
        await pooledConn.connection.getSlot();
        const responseTime = Date.now() - startTime;
        
        // Mark as healthy if response time is reasonable
        pooledConn.isHealthy = responseTime < 5000; // 5 seconds max
        pooledConn.errorCount = 0;
        
        if (responseTime > 2000) {
          console.warn(`RPC ${index} slow response: ${responseTime}ms`);
        }
      } catch (error) {
        console.error(`RPC ${index} health check failed:`, error);
        pooledConn.isHealthy = false;
        pooledConn.errorCount++;
        
        // If too many errors, temporarily disable
        if (pooledConn.errorCount > 5) {
          pooledConn.isHealthy = false;
        }
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  private getHealthyConnection(): PooledConnection | null {
    const healthyConnections = this.connections.filter(conn => conn.isHealthy);
    
    if (healthyConnections.length === 0) {
      return null;
    }

    // Use round-robin with least recently used
    const sortedConnections = healthyConnections.sort((a, b) => a.lastUsed - b.lastUsed);
    return sortedConnections[0];
  }

  private updateConnectionStats(connection: PooledConnection): void {
    connection.lastUsed = Date.now();
    connection.requestCount++;
  }

  // Public methods for different types of operations
  async getAccountInfo(publicKey: PublicKey): Promise<any> {
    const pooledConn = this.getHealthyConnection();
    if (!pooledConn) {
      throw new Error('No healthy RPC connections available');
    }

    try {
      this.updateConnectionStats(pooledConn);
      return await pooledConn.connection.getAccountInfo(publicKey);
    } catch (error) {
      pooledConn.errorCount++;
      logError(error as Error, 'ConnectionPool.getAccountInfo');
      throw error;
    }
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    const pooledConn = this.getHealthyConnection();
    if (!pooledConn) {
      throw new Error('No healthy RPC connections available');
    }

    try {
      this.updateConnectionStats(pooledConn);
      return await pooledConn.connection.getBalance(publicKey);
    } catch (error) {
      pooledConn.errorCount++;
      logError(error as Error, 'ConnectionPool.getBalance');
      throw error;
    }
  }

  async getTokenAccountsByOwner(ownerAddress: PublicKey, filter: any): Promise<any> {
    const pooledConn = this.getHealthyConnection();
    if (!pooledConn) {
      throw new Error('No healthy RPC connections available');
    }

    try {
      this.updateConnectionStats(pooledConn);
      return await pooledConn.connection.getTokenAccountsByOwner(ownerAddress, filter);
    } catch (error) {
      pooledConn.errorCount++;
      logError(error as Error, 'ConnectionPool.getTokenAccountsByOwner');
      throw error;
    }
  }

  async sendTransaction(transaction: Transaction | VersionedTransaction): Promise<string> {
    const pooledConn = this.getHealthyConnection();
    if (!pooledConn) {
      throw new Error('No healthy RPC connections available');
    }

    try {
      this.updateConnectionStats(pooledConn);
      return await pooledConn.connection.sendTransaction(transaction as any);
    } catch (error) {
      pooledConn.errorCount++;
      logError(error as Error, 'ConnectionPool.sendTransaction');
      throw error;
    }
  }

  async getSlot(): Promise<number> {
    const pooledConn = this.getHealthyConnection();
    if (!pooledConn) {
      throw new Error('No healthy RPC connections available');
    }

    try {
      this.updateConnectionStats(pooledConn);
      return await pooledConn.connection.getSlot();
    } catch (error) {
      pooledConn.errorCount++;
      logError(error as Error, 'ConnectionPool.getSlot');
      throw error;
    }
  }

  async getRecentBlockhash(): Promise<any> {
    const pooledConn = this.getHealthyConnection();
    if (!pooledConn) {
      throw new Error('No healthy RPC connections available');
    }

    try {
      this.updateConnectionStats(pooledConn);
      return await pooledConn.connection.getRecentBlockhash();
    } catch (error) {
      pooledConn.errorCount++;
      logError(error as Error, 'ConnectionPool.getRecentBlockhash');
      throw error;
    }
  }

  // Batch operations for better performance
  async batchGetAccountInfo(publicKeys: PublicKey[]): Promise<(any | null)[]> {
    const pooledConn = this.getHealthyConnection();
    if (!pooledConn) {
      throw new Error('No healthy RPC connections available');
    }

    try {
      this.updateConnectionStats(pooledConn);
      return await pooledConn.connection.getMultipleAccountsInfo(publicKeys);
    } catch (error) {
      pooledConn.errorCount++;
      logError(error as Error, 'ConnectionPool.batchGetAccountInfo');
      throw error;
    }
  }

  // Get connection statistics
  getStats(): {
    totalConnections: number;
    healthyConnections: number;
    totalRequests: number;
    averageResponseTime: number;
    connections: Array<{
      index: number;
      isHealthy: boolean;
      requestCount: number;
      errorCount: number;
      lastUsed: number;
    }>;
  } {
    const healthyConnections = this.connections.filter(conn => conn.isHealthy).length;
    const totalRequests = this.connections.reduce((sum, conn) => sum + conn.requestCount, 0);
    const totalErrors = this.connections.reduce((sum, conn) => sum + conn.errorCount, 0);

    return {
      totalConnections: this.connections.length,
      healthyConnections,
      totalRequests,
      averageResponseTime: 0, // Could be calculated if we track response times
      connections: this.connections.map((conn, index) => ({
        index,
        isHealthy: conn.isHealthy,
        requestCount: conn.requestCount,
        errorCount: conn.errorCount,
        lastUsed: conn.lastUsed
      }))
    };
  }

  // Cleanup
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    this.connections = [];
  }
}

// Create singleton instance
const rpcUrls = [
  process.env.HELIUS_RPC_URL || 'https://api.devnet.solana.com',
  process.env.HELIUS_RPC_URL_2 || 'https://api.mainnet-beta.solana.com',
  'https://api.devnet.solana.com',
  'https://api.mainnet-beta.solana.com'
].filter(Boolean);

export const connectionPool = new SolanaConnectionPool(rpcUrls, 4, 30000);
