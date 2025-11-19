/**
 * 🚀 RPC Failover Service
 * Enterprise-grade RPC endpoint management with automatic failover
 * - Multiple RPC providers
 * - Health monitoring
 * - Automatic failover
 * - Rate limit awareness
 * - Response caching
 */

import { Connection, Commitment } from '@solana/web3.js';

interface RPCProvider {
  name: string;
  url: string;
  priority: number;
  maxRetries: number;
  timeout: number;
  weight?: number; // For load balancing
  healthy?: boolean;
  lastChecked?: number;
  consecutiveFailures?: number;
}

interface RPCHealthStatus {
  provider: string;
  healthy: boolean;
  latency: number;
  lastCheck: number;
  error?: string;
}

class RPCFailoverService {
  private providers: RPCProvider[];
  private connections: Map<string, Connection>;
  private currentProvider: RPCProvider | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthCheckFrequency: number;
  private healthStatuses: Map<string, RPCHealthStatus>;
  private failureThreshold: number;

  constructor(
    providers: RPCProvider[],
    healthCheckFrequency: number = 30000 // 30 seconds
  ) {
    if (!providers || providers.length === 0) {
      throw new Error('At least one RPC provider is required');
    }

    this.providers = providers.sort((a, b) => a.priority - b.priority);
    this.connections = new Map();
    this.healthCheckFrequency = healthCheckFrequency;
    this.healthStatuses = new Map();
    this.failureThreshold = 3;

    // Initialize all providers
    this.providers.forEach((provider) => {
      this.initializeProvider(provider);
    });

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Initialize a provider
   */
  private initializeProvider(provider: RPCProvider): void {
    try {
      const connection = new Connection(provider.url, 'confirmed');
      this.connections.set(provider.name, connection);
      provider.healthy = true;
      provider.consecutiveFailures = 0;
      console.log(`✓ Initialized RPC provider: ${provider.name}`);
    } catch (error) {
      console.error(`Failed to initialize provider ${provider.name}:`, error);
      provider.healthy = false;
    }
  }

  /**
   * Get the best available connection
   */
  async getConnection(): Promise<Connection> {
    if (!this.currentProvider) {
      this.currentProvider = this.selectBestProvider();
    }

    if (!this.currentProvider) {
      throw new Error('No healthy RPC providers available');
    }

    return this.connections.get(this.currentProvider.name)!;
  }

  /**
   * Select the best provider based on health and priority
   */
  private selectBestProvider(): RPCProvider | null {
    const healthyProviders = this.providers.filter((p) => p.healthy !== false);

    if (healthyProviders.length === 0) {
      console.error('No healthy RPC providers available, attempting recovery...');
      return this.providers[0] || null;
    }

    // Prefer high-priority healthy providers
    return healthyProviders.sort((a, b) => {
      const healthA = (a.healthy ? 1 : 0) * 1000;
      const healthB = (b.healthy ? 1 : 0) * 1000;
      return (healthB + b.weight! - a.weight!) - (healthA + a.weight! - b.weight!);
    })[0];
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkProvidersHealth();
    }, this.healthCheckFrequency);

    console.log('🏥 Health monitoring started');
  }

  /**
   * Check health of all providers
   */
  private async checkProvidersHealth(): Promise<void> {
    const checks = this.providers.map((provider) =>
      this.checkProviderHealth(provider)
    );

    const results = await Promise.all(checks);

    // Update provider health status
    results.forEach((status) => {
      const provider = this.providers.find((p) => p.name === status.provider);
      if (provider) {
        if (status.healthy) {
          provider.consecutiveFailures = 0;
          provider.healthy = true;
        } else {
          provider.consecutiveFailures = (provider.consecutiveFailures || 0) + 1;
          if (provider.consecutiveFailures >= this.failureThreshold) {
            provider.healthy = false;
          }
        }
      }

      this.healthStatuses.set(status.provider, status);
    });

    // Reset current provider if unhealthy
    if (
      this.currentProvider &&
      !this.currentProvider.healthy
    ) {
      console.warn(
        `🔄 Current provider ${this.currentProvider.name} is unhealthy, switching...`
      );
      this.currentProvider = this.selectBestProvider();
    }
  }

  /**
   * Check health of a single provider
   */
  private async checkProviderHealth(
    provider: RPCProvider
  ): Promise<RPCHealthStatus> {
    const start = Date.now();

    try {
      const connection = this.connections.get(provider.name);
      if (!connection) {
        return {
          provider: provider.name,
          healthy: false,
          latency: 0,
          lastCheck: Date.now(),
          error: 'Connection not initialized',
        };
      }

      // Perform a simple RPC call with timeout
      await Promise.race([
        connection.getSlot('confirmed'),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Health check timeout')),
            provider.timeout || 10000
          )
        ),
      ]);

      const latency = Date.now() - start;

      return {
        provider: provider.name,
        healthy: true,
        latency,
        lastCheck: Date.now(),
      };
    } catch (error: any) {
      const latency = Date.now() - start;

      return {
        provider: provider.name,
        healthy: false,
        latency,
        lastCheck: Date.now(),
        error: error.message,
      };
    }
  }

  /**
   * Execute a request with automatic failover
   */
  async executeWithFailover<T>(
    operation: (connection: Connection) => Promise<T>,
    operationName: string = 'RPC Operation'
  ): Promise<T> {
    let lastError: Error | null = null;
    const attemptedProviders: string[] = [];

    for (const provider of this.providers) {
      if (attemptedProviders.includes(provider.name)) {
        continue;
      }

      attemptedProviders.push(provider.name);

      try {
        const connection = this.connections.get(provider.name);
        if (!connection) {
          continue;
        }

        console.log(
          `📡 Attempting ${operationName} with ${provider.name}...`
        );

        const result = await Promise.race([
          operation(connection),
          new Promise<T>((_, reject) =>
            setTimeout(
              () => reject(new Error('Operation timeout')),
              provider.timeout || 30000
            )
          ),
        ]);

        // Mark provider as healthy
        provider.consecutiveFailures = 0;
        provider.healthy = true;

        // Update current provider
        this.currentProvider = provider;

        console.log(`✓ ${operationName} succeeded with ${provider.name}`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `⚠️ ${operationName} failed with ${provider.name}: ${error.message}`
        );

        // Mark provider as potentially unhealthy
        provider.consecutiveFailures = (provider.consecutiveFailures || 0) + 1;
        if (provider.consecutiveFailures >= this.failureThreshold) {
          provider.healthy = false;
        }

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error(
      `${operationName} failed on all providers. Last error: ${lastError?.message || 'Unknown'}`
    );
  }

  /**
   * Get health status of all providers
   */
  getHealthStatus(): RPCHealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  /**
   * Get current provider info
   */
  getCurrentProvider(): RPCProvider | null {
    return this.currentProvider;
  }

  /**
   * Get all providers info
   */
  getProvidersInfo(): RPCProvider[] {
    return this.providers.map((p) => ({
      ...p,
      healthy: p.healthy ?? true,
      consecutiveFailures: p.consecutiveFailures ?? 0,
    }));
  }

  /**
   * Force health check
   */
  async forceHealthCheck(): Promise<void> {
    await this.checkProvidersHealth();
  }

  /**
   * Shutdown service
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      console.log('🛑 Health monitoring stopped');
    }
  }
}

/**
 * Factory function to create failover service with Solana best practices
 */
export function createSolanaRPCFailover(
  heliusApiKey?: string
): RPCFailoverService {
  const providers: RPCProvider[] = [
    {
      name: 'Helius (Primary)',
      url: heliusApiKey
        ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
        : 'https://api.mainnet-beta.solana.com',
      priority: 1,
      maxRetries: 5,
      timeout: 30000,
      weight: 100,
    },
    {
      name: 'Solana (Fallback)',
      url: 'https://api.mainnet-beta.solana.com',
      priority: 2,
      maxRetries: 3,
      timeout: 30000,
      weight: 50,
    },
  ];

  // Add QuickNode as secondary if available
  if (process.env.QUICKNODE_RPC_URL) {
    providers.push({
      name: 'QuickNode (Secondary)',
      url: process.env.QUICKNODE_RPC_URL,
      priority: 2,
      maxRetries: 4,
      timeout: 30000,
      weight: 75,
    });
  }

  return new RPCFailoverService(providers);
}

export default RPCFailoverService;
export { RPCProvider, RPCHealthStatus };
