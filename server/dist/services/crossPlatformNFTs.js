"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossPlatformNFTService = void 0;
const web3_js_1 = require("@solana/web3.js");
const environment_1 = require("../config/environment");
const helius_api_1 = require("../helius-api");
class CrossPlatformNFTService {
    constructor() {
        this.heliusConfig = (0, environment_1.getHeliusConfig)();
        this.connection = new web3_js_1.Connection(this.heliusConfig.rpcUrl, 'confirmed');
    }
    // Get ALL Solana NFTs from multiple sources
    async getAllSolanaNFTs(filters = {}) {
        try {
            const sources = filters.sources || ['platform', 'helius', 'magic-eden'];
            const limit = filters.limit || 50;
            const offset = filters.offset || 0;
            // Fetch from multiple sources in parallel
            const sourcePromises = sources.map(source => {
                switch (source) {
                    case 'platform':
                        return this.getPlatformNFTs(filters);
                    case 'helius':
                        return this.getHeliusNFTs(filters);
                    case 'magic-eden':
                        return this.getMagicEdenNFTs(filters);
                    case 'solana-rpc':
                        return this.getSolanaRPCNFTs(filters);
                    default:
                        return Promise.resolve([]);
                }
            });
            const results = await Promise.all(sourcePromises);
            // Merge and deduplicate NFTs
            const allNFTs = results.flat();
            const uniqueNFTs = this.deduplicateNFTs(allNFTs);
            // Apply pagination
            return uniqueNFTs.slice(offset, offset + limit);
        }
        catch (error) {
            console.error('Failed to fetch cross-platform NFTs:', error);
            return [];
        }
    }
    // Get NFTs from your platform database
    async getPlatformNFTs(filters) {
        try {
            // This would query your database
            // For now, return empty array
            return [];
        }
        catch (error) {
            console.error('Failed to fetch platform NFTs:', error);
            return [];
        }
    }
    // Get NFTs from Helius API
    async getHeliusNFTs(filters) {
        try {
            if (!filters.owner)
                return [];
            const heliusNFTs = await (0, helius_api_1.getAssetsByOwner)(filters.owner);
            return heliusNFTs.map(nft => ({
                mint: nft.mint,
                name: nft.name,
                description: '',
                image: nft.image,
                collection: nft.collection,
                owner: filters.owner,
                status: 'available',
                source: 'helius',
                metadata: {},
                attributes: []
            }));
        }
        catch (error) {
            console.error('Failed to fetch Helius NFTs:', error);
            return [];
        }
    }
    // Get NFTs from Magic Eden API
    async getMagicEdenNFTs(filters) {
        try {
            // Magic Eden API integration
            const magicEdenUrl = 'https://api-mainnet.magiceden.io/v2';
            const params = new URLSearchParams();
            if (filters.owner) {
                params.append('owner', filters.owner);
            }
            if (filters.collection) {
                params.append('collection', filters.collection);
            }
            if (filters.limit) {
                params.append('limit', filters.limit.toString());
            }
            const response = await fetch(`${magicEdenUrl}/wallets/${filters.owner}/tokens?${params}`);
            if (!response.ok) {
                throw new Error(`Magic Eden API error: ${response.status}`);
            }
            const data = await response.json();
            return data.tokens?.map((token) => ({
                mint: token.mint,
                name: token.name || 'Unknown',
                description: token.description || '',
                image: token.image || '',
                collection: token.collection || 'Unknown Collection',
                owner: filters.owner,
                price: token.price ? token.price / 1e9 : undefined, // Convert lamports to SOL
                status: token.listed ? 'listed' : 'available',
                source: 'magic-eden',
                metadata: token.metadata,
                attributes: token.attributes
            })) || [];
        }
        catch (error) {
            console.error('Failed to fetch Magic Eden NFTs:', error);
            return [];
        }
    }
    // Get NFTs directly from Solana RPC
    async getSolanaRPCNFTs(filters) {
        try {
            if (!filters.owner)
                return [];
            const ownerPubkey = new web3_js_1.PublicKey(filters.owner);
            // Get token accounts for the owner
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(ownerPubkey, { programId: new web3_js_1.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') });
            const nfts = [];
            for (const account of tokenAccounts.value) {
                const tokenData = account.account.data.parsed.info;
                // Check if it's an NFT (amount = 1, decimals = 0)
                if (tokenData.tokenAmount.amount === '1' && tokenData.tokenAmount.decimals === 0) {
                    try {
                        // Get metadata for the NFT
                        const metadata = await this.getNFTMetadata(new web3_js_1.PublicKey(tokenData.mint));
                        nfts.push({
                            mint: tokenData.mint,
                            name: metadata.name || 'Unknown NFT',
                            description: metadata.description || '',
                            image: metadata.image || '',
                            collection: metadata.collection || 'Unknown Collection',
                            owner: filters.owner,
                            status: 'available',
                            source: 'solana-rpc',
                            metadata: metadata,
                            attributes: metadata.attributes
                        });
                    }
                    catch (metadataError) {
                        console.warn(`Failed to get metadata for ${tokenData.mint}:`, metadataError);
                    }
                }
            }
            return nfts;
        }
        catch (error) {
            console.error('Failed to fetch Solana RPC NFTs:', error);
            return [];
        }
    }
    // Get NFT metadata from blockchain
    async getNFTMetadata(mint) {
        try {
            // This would fetch metadata from the blockchain
            // For now, return basic info
            return {
                name: `NFT ${mint.toBase58().slice(0, 8)}`,
                description: 'NFT from Solana blockchain',
                image: 'https://placehold.co/400x400?text=NFT',
                collection: 'Unknown Collection',
                attributes: []
            };
        }
        catch (error) {
            console.error('Failed to get NFT metadata:', error);
            return {};
        }
    }
    // Import external NFT to your platform
    async importExternalNFT(mintAddress, ownerWallet) {
        try {
            // 1. Verify ownership on blockchain
            const isOwner = await this.verifyOwnership(mintAddress, ownerWallet);
            if (!isOwner) {
                return { success: false, error: 'User does not own this NFT' };
            }
            // 2. Fetch NFT metadata
            const metadata = await this.getNFTMetadata(new web3_js_1.PublicKey(mintAddress));
            // 3. Create UniversalNFT object
            const nft = {
                mint: mintAddress,
                name: metadata.name || 'Imported NFT',
                description: metadata.description || '',
                image: metadata.image || '',
                collection: metadata.collection || 'Imported Collection',
                owner: ownerWallet,
                status: 'available',
                source: 'platform',
                metadata: metadata,
                attributes: metadata.attributes || []
            };
            // 4. Add to your platform database
            // This would save to your database
            console.log('NFT imported to platform:', nft);
            return { success: true, nft };
        }
        catch (error) {
            console.error('Failed to import external NFT:', error);
            return { success: false, error: error.message };
        }
    }
    // Verify NFT ownership on blockchain
    async verifyOwnership(mintAddress, ownerWallet) {
        try {
            const mint = new web3_js_1.PublicKey(mintAddress);
            const owner = new web3_js_1.PublicKey(ownerWallet);
            // Get token accounts for the owner
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(owner, {
                programId: new web3_js_1.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
            });
            // Check if any account holds this specific NFT
            for (const account of tokenAccounts.value) {
                const tokenData = account.account.data.parsed.info;
                if (tokenData.mint === mintAddress && tokenData.tokenAmount.amount === '1') {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('Failed to verify ownership:', error);
            return false;
        }
    }
    // Deduplicate NFTs from multiple sources
    deduplicateNFTs(nfts) {
        const seen = new Set();
        const unique = [];
        for (const nft of nfts) {
            if (!seen.has(nft.mint)) {
                seen.add(nft.mint);
                unique.push(nft);
            }
        }
        return unique;
    }
    // Search NFTs across all platforms
    async searchNFTs(query, filters = {}) {
        try {
            const allNFTs = await this.getAllSolanaNFTs(filters);
            // Simple text search (in production, use proper search indexing)
            return allNFTs.filter(nft => nft.name.toLowerCase().includes(query.toLowerCase()) ||
                nft.description.toLowerCase().includes(query.toLowerCase()) ||
                nft.collection.toLowerCase().includes(query.toLowerCase()));
        }
        catch (error) {
            console.error('Failed to search NFTs:', error);
            return [];
        }
    }
    // Get trending NFTs across platforms
    async getTrendingNFTs(limit = 20) {
        try {
            // This would analyze trading volume, sales, etc.
            // For now, return a sample of NFTs
            const allNFTs = await this.getAllSolanaNFTs({ limit: 100 });
            // Simple "trending" algorithm (in production, use real metrics)
            return allNFTs
                .filter(nft => nft.status === 'listed')
                .sort((a, b) => (b.price || 0) - (a.price || 0))
                .slice(0, limit);
        }
        catch (error) {
            console.error('Failed to get trending NFTs:', error);
            return [];
        }
    }
}
exports.CrossPlatformNFTService = CrossPlatformNFTService;
