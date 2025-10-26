"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultIPFSConfig = exports.EnhancedIPFSService = void 0;
const ipfs_http_client_1 = require("ipfs-http-client");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class EnhancedIPFSService {
    constructor(config) {
        this.cache = new Map();
        this.config = config;
        this.pinServices = config.pinServices.sort((a, b) => a.priority - b.priority);
        // Initialize IPFS client with primary gateway
        this.client = (0, ipfs_http_client_1.create)({
            url: config.primaryGateway,
            timeout: config.timeout,
        });
    }
    /**
     * Upload content to IPFS with automatic pinning
     */
    async uploadContent(content, options = {}) {
        try {
            // Convert content to buffer if needed
            let buffer;
            if (Buffer.isBuffer(content)) {
                buffer = content;
            }
            else if (typeof content === 'string') {
                buffer = Buffer.from(content, 'utf8');
            }
            else {
                // Handle Readable stream
                const chunks = [];
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
        }
        catch (error) {
            console.error('IPFS upload failed:', error);
            throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Upload NFT metadata with proper structure
     */
    async uploadNFTMetadata(metadata) {
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
    async uploadImage(imageBuffer, options = {}) {
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
    async getContent(hash) {
        try {
            // Check cache first
            const cached = await this.getCachedContent(hash);
            if (cached) {
                return cached;
            }
            // Try primary gateway first
            try {
                const content = await this.client.cat(hash);
                const chunks = [];
                for await (const chunk of content) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
                const buffer = Buffer.concat(chunks);
                // Cache the result
                await this.cacheContent(hash, buffer);
                return buffer;
            }
            catch (error) {
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
                }
                catch (error) {
                    console.warn(`Fallback gateway ${gateway} failed for ${hash}`);
                }
            }
            throw new Error(`Failed to retrieve content for hash ${hash}`);
        }
        catch (error) {
            console.error('IPFS retrieval failed:', error);
            throw new Error(`Failed to retrieve from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Pin content to external pinning services
     */
    async pinToServices(hash) {
        const results = await Promise.allSettled(this.pinServices.map(service => this.pinToService(hash, service)));
        const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
        return successful > 0;
    }
    /**
     * Pin to a specific service
     */
    async pinToService(hash, service) {
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
            }
            else {
                console.warn(`Failed to pin ${hash} to ${service.name}: ${response.statusText}`);
                return false;
            }
        }
        catch (error) {
            console.error(`Error pinning to ${service.name}:`, error);
            return false;
        }
    }
    /**
     * Check pin status across services
     */
    async checkPinStatus(hash) {
        const results = await Promise.allSettled(this.pinServices.map(service => this.checkServicePinStatus(hash, service)));
        return results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
    }
    /**
     * Check pin status for a specific service
     */
    async checkServicePinStatus(hash, service) {
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
            }
            else {
                return {
                    hash,
                    status: 'failed',
                };
            }
        }
        catch (error) {
            return {
                hash,
                status: 'failed',
            };
        }
    }
    /**
     * Generate IPFS URL
     */
    generateIPFSURL(hash) {
        return `${this.config.primaryGateway}/ipfs/${hash}`;
    }
    /**
     * Cache content locally
     */
    async cacheContent(hash, content) {
        try {
            const cachePath = path_1.default.join(this.config.cacheDir, hash);
            await promises_1.default.writeFile(cachePath, content);
            this.cache.set(hash, cachePath);
            // Clean up old cache if needed
            await this.cleanupCache();
        }
        catch (error) {
            console.warn('Failed to cache content:', error);
        }
    }
    /**
     * Get cached content
     */
    async getCachedContent(hash) {
        try {
            const cachePath = this.cache.get(hash);
            if (cachePath) {
                const stats = await promises_1.default.stat(cachePath);
                if (stats.isFile()) {
                    return await promises_1.default.readFile(cachePath);
                }
            }
        }
        catch (error) {
            // Cache miss or error
        }
        return null;
    }
    /**
     * Clean up old cache files
     */
    async cleanupCache() {
        try {
            const files = await promises_1.default.readdir(this.config.cacheDir);
            const stats = await Promise.all(files.map(async (file) => {
                const filePath = path_1.default.join(this.config.cacheDir, file);
                const stat = await promises_1.default.stat(filePath);
                return { file, path: filePath, size: stat.size, mtime: stat.mtime };
            }));
            // Sort by modification time (oldest first)
            stats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
            // Calculate total size
            let totalSize = stats.reduce((sum, stat) => sum + stat.size, 0);
            // Remove oldest files if over limit
            if (totalSize > this.config.maxCacheSize) {
                for (const stat of stats) {
                    if (totalSize <= this.config.maxCacheSize)
                        break;
                    await promises_1.default.unlink(stat.path);
                    this.cache.delete(stat.file);
                    totalSize = totalSize - stat.size;
                }
            }
        }
        catch (error) {
            console.warn('Cache cleanup failed:', error);
        }
    }
    /**
     * Optimize image (placeholder - integrate with sharp)
     */
    async optimizeImage(buffer, options) {
        // This would integrate with sharp or similar image processing library
        // For now, return the original buffer
        return buffer;
    }
    /**
     * Get service health status
     */
    async getHealthStatus() {
        const primary = await this.checkGatewayHealth(this.config.primaryGateway);
        const fallbacks = await Promise.all(this.config.fallbackGateways.map(gateway => this.checkGatewayHealth(gateway)));
        const pinServices = await Promise.all(this.pinServices.map(service => this.checkServiceHealth(service)));
        return {
            primary,
            fallbacks,
            pinServices,
        };
    }
    /**
     * Check gateway health
     */
    async checkGatewayHealth(gateway) {
        try {
            const response = await fetch(`${gateway}/api/v0/version`);
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check service health
     */
    async checkServiceHealth(service) {
        try {
            const response = await fetch(`${service.endpoint}/health`, {
                headers: {
                    'Authorization': `Bearer ${service.apiKey}`,
                },
            });
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
}
exports.EnhancedIPFSService = EnhancedIPFSService;
// Default configuration
exports.defaultIPFSConfig = {
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
