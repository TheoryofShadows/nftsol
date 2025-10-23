import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface IPFSUploadResult {
  hash: string;
  size: number;
  url: string;
  pinned: boolean;
}

export interface IPFSPinResult {
  hash: string;
  status: 'pinned' | 'pinning' | 'failed';
  size?: number;
}

export interface IPFSServiceConfig {
  primaryGateway: string;
  fallbackGateways: string[];
  timeout: number;
  retries: number;
  backoffMs: number;
  cacheDir: string;
  maxCacheSize: number;
  pinServices: PinServiceConfig[];
}

export interface PinServiceConfig {
  name: string;
  endpoint: string;
  apiKey: string;
  priority: number;
}

export class EnhancedIPFSService {
  private client: IPFSHTTPClient;
  private config: IPFSServiceConfig;
  private cache: Map<string, string> = new Map();
  private pinServices: PinServiceConfig[];

  constructor(config: IPFSServiceConfig) {
    this.config = config;
    this.pinServices = config.pinServices.sort((a, b) => a.priority - b.priority);
    
    // Initialize IPFS client with primary gateway
    this.client = create({
      url: config.primaryGateway,
      timeout: config.timeout,
    });
  }

  /**
   * Upload content to IPFS with automatic pinning
   */
  async uploadContent(
    content: Buffer | string | Readable,
    options: {
      pinToServices?: boolean;
      cacheLocally?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<IPFSUploadResult> {
    try {
      // Convert content to buffer if needed
      let buffer: Buffer;
      if (Buffer.isBuffer(content)) {
        buffer = content;
      } else if (typeof content === 'string') {
        buffer = Buffer.from(content, 'utf8');
      } else {
        // Handle Readable stream
        const chunks: Buffer[] = [];
        for await (const chunk of content) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        buffer = Buffer.concat(chunks);
      }

      // Upload to IPFS
      const result = await this.client.add(buffer, {
        pin: true,
        cidVersion: 1,
        hashAlg: 'sha2-256',
      });

      const hash = result.cid.toString();
      const size = result.size;

      // Cache locally if requested
      if (options.cacheLocally) {
        await this.cacheContent(hash, buffer);
      }

      // Pin to external services if requested
      let pinned = false;
      if (options.pinToServices) {
        pinned = await this.pinToServices(hash);
      }

      // Generate accessible URL
      const url = this.generateIPFSURL(hash);

      return {
        hash,
        size,
        url,
        pinned,
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload NFT metadata with proper structure
   */
  async uploadNFTMetadata(metadata: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{ trait_type: string; value: string }>;
    collection?: string;
    creator?: string;
    properties?: Record<string, any>;
  }): Promise<IPFSUploadResult> {
    const metadataJson = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      attributes: metadata.attributes || [],
      collection: metadata.collection,
      creator: metadata.creator,
      properties: {
        files: [{ uri: metadata.image, type: 'image/png' }],
        category: 'image',
        ...metadata.properties,
      },
      external_url: `https://nftsol.app/nft/${metadata.name.toLowerCase().replace(/\s+/g, '-')}`,
      seller_fee_basis_points: 250, // 2.5% royalty
    };

    return this.uploadContent(JSON.stringify(metadataJson, null, 2), {
      pinToServices: true,
      cacheLocally: true,
      metadata: {
        type: 'nft-metadata',
        name: metadata.name,
      },
    });
  }

  /**
   * Upload image with optimization
   */
  async uploadImage(
    imageBuffer: Buffer,
    options: {
      optimize?: boolean;
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {}
  ): Promise<IPFSUploadResult> {
    let processedBuffer = imageBuffer;

    // Image optimization (you'd integrate with sharp or similar)
    if (options.optimize) {
      processedBuffer = await this.optimizeImage(imageBuffer, {
        maxWidth: options.maxWidth || 2048,
        maxHeight: options.maxHeight || 2048,
        quality: options.quality || 85,
      });
    }

    return this.uploadContent(processedBuffer, {
      pinToServices: true,
      cacheLocally: true,
      metadata: {
        type: 'image',
        optimized: options.optimize || false,
      },
    });
  }

  /**
   * Retrieve content from IPFS
   */
  async getContent(hash: string): Promise<Buffer> {
    try {
      // Check cache first
      const cached = await this.getCachedContent(hash);
      if (cached) {
        return cached;
      }

      // Try primary gateway first
      try {
        const content = await this.client.cat(hash);
        const chunks: Buffer[] = [];
        for await (const chunk of content) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        
        // Cache the result
        await this.cacheContent(hash, buffer);
        return buffer;
      } catch (error) {
        console.warn(`Primary gateway failed for ${hash}, trying fallbacks`);
      }

      // Try fallback gateways
      for (const gateway of this.config.fallbackGateways) {
        try {
          const response = await fetch(`${gateway}/ipfs/${hash}`);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            await this.cacheContent(hash, buffer);
            return buffer;
          }
        } catch (error) {
          console.warn(`Fallback gateway ${gateway} failed for ${hash}`);
        }
      }

      throw new Error(`Failed to retrieve content for hash ${hash}`);
    } catch (error) {
      console.error('IPFS retrieval failed:', error);
      throw new Error(`Failed to retrieve from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pin content to external pinning services
   */
  async pinToServices(hash: string): Promise<boolean> {
    const results = await Promise.allSettled(
      this.pinServices.map(service => this.pinToService(hash, service))
    );

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value
    ).length;

    return successful > 0;
  }

  /**
   * Pin to a specific service
   */
  private async pinToService(hash: string, service: PinServiceConfig): Promise<boolean> {
    try {
      const response = await fetch(`${service.endpoint}/pins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${service.apiKey}`,
        },
        body: JSON.stringify({
          cid: hash,
          name: `nftsol-${hash}`,
          meta: {
            source: 'nftsol-platform',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        console.log(`Successfully pinned ${hash} to ${service.name}`);
        return true;
      } else {
        console.warn(`Failed to pin ${hash} to ${service.name}: ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error(`Error pinning to ${service.name}:`, error);
      return false;
    }
  }

  /**
   * Check pin status across services
   */
  async checkPinStatus(hash: string): Promise<IPFSPinResult[]> {
    const results = await Promise.allSettled(
      this.pinServices.map(service => this.checkServicePinStatus(hash, service))
    );

    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<IPFSPinResult>).value);
  }

  /**
   * Check pin status for a specific service
   */
  private async checkServicePinStatus(hash: string, service: PinServiceConfig): Promise<IPFSPinResult> {
    try {
      const response = await fetch(`${service.endpoint}/pins/${hash}`, {
        headers: {
          'Authorization': `Bearer ${service.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          hash,
          status: data.status || 'pinned',
          size: data.size,
        };
      } else {
        return {
          hash,
          status: 'failed',
        };
      }
    } catch (error) {
      return {
        hash,
        status: 'failed',
      };
    }
  }

  /**
   * Generate IPFS URL
   */
  private generateIPFSURL(hash: string): string {
    return `${this.config.primaryGateway}/ipfs/${hash}`;
  }

  /**
   * Cache content locally
   */
  private async cacheContent(hash: string, content: Buffer): Promise<void> {
    try {
      const cachePath = path.join(this.config.cacheDir, hash);
      await fs.writeFile(cachePath, content);
      this.cache.set(hash, cachePath);
      
      // Clean up old cache if needed
      await this.cleanupCache();
    } catch (error) {
      console.warn('Failed to cache content:', error);
    }
  }

  /**
   * Get cached content
   */
  private async getCachedContent(hash: string): Promise<Buffer | null> {
    try {
      const cachePath = this.cache.get(hash);
      if (cachePath) {
        const stats = await fs.stat(cachePath);
        if (stats.isFile()) {
          return await fs.readFile(cachePath);
        }
      }
    } catch (error) {
      // Cache miss or error
    }
    return null;
  }

  /**
   * Clean up old cache files
   */
  private async cleanupCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.cacheDir);
      const stats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.config.cacheDir, file);
          const stat = await fs.stat(filePath);
          return { file, path: filePath, size: stat.size, mtime: stat.mtime };
        })
      );

      // Sort by modification time (oldest first)
      stats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

      // Calculate total size
      let totalSize = stats.reduce((sum, stat) => sum + stat.size, 0);

      // Remove oldest files if over limit
      if (totalSize > this.config.maxCacheSize) {
        for (const stat of stats) {
          if (totalSize <= this.config.maxCacheSize) break;
          
          await fs.unlink(stat.path);
          this.cache.delete(stat.file);
          totalSize = totalSize - stat.size;
        }
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  /**
   * Optimize image (placeholder - integrate with sharp)
   */
  private async optimizeImage(
    buffer: Buffer,
    options: { maxWidth: number; maxHeight: number; quality: number }
  ): Promise<Buffer> {
    // This would integrate with sharp or similar image processing library
    // For now, return the original buffer
    return buffer;
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    primary: boolean;
    fallbacks: boolean[];
    pinServices: boolean[];
  }> {
    const primary = await this.checkGatewayHealth(this.config.primaryGateway);
    const fallbacks = await Promise.all(
      this.config.fallbackGateways.map(gateway => this.checkGatewayHealth(gateway))
    );
    const pinServices = await Promise.all(
      this.pinServices.map(service => this.checkServiceHealth(service))
    );

    return {
      primary,
      fallbacks,
      pinServices,
    };
  }

  /**
   * Check gateway health
   */
  private async checkGatewayHealth(gateway: string): Promise<boolean> {
    try {
      const response = await fetch(`${gateway}/api/v0/version`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check service health
   */
  private async checkServiceHealth(service: PinServiceConfig): Promise<boolean> {
    try {
      const response = await fetch(`${service.endpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${service.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Default configuration
export const defaultIPFSConfig: IPFSServiceConfig = {
  primaryGateway: 'https://w3s.link',
  fallbackGateways: [
    'https://ipfs.io',
    'https://cloudflare-ipfs.com',
    'https://gateway.pinata.cloud',
  ],
  timeout: 30000,
  retries: 3,
  backoffMs: 1000,
  cacheDir: './ipfs-cache',
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  pinServices: [
    {
      name: 'Pinata',
      endpoint: 'https://api.pinata.cloud',
      apiKey: process.env.PINATA_API_KEY || '',
      priority: 1,
    },
    {
      name: 'Web3.Storage',
      endpoint: 'https://api.web3.storage',
      apiKey: process.env.WEB3_STORAGE_API_KEY || '',
      priority: 2,
    },
  ],
};
