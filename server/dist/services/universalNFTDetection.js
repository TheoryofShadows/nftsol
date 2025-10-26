"use strict";
/**
 * 🌐 Universal NFT Detection Service
 * Detects and aggregates NFTs from all Solana platforms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalNFTDetectionService = void 0;
const web3_js_1 = require("@solana/web3.js");
const environment_1 = require("../config/environment");
class UniversalNFTDetectionService {
    constructor() {
        this.heliusConfig = (0, environment_1.getHeliusConfig)();
        this.connection = new web3_js_1.Connection(this.heliusConfig.rpcUrl, 'confirmed');
    }
    /**
     * Get all NFTs for a wallet across all platforms
     */
    async getAllNFTsForWallet(walletAddress) {
        console.log(`🔍 Detecting NFTs for wallet: ${walletAddress}`);
        const allNFTs = [];
        try {
            // Get NFTs from all platforms in parallel
            const [nftsolNFTs, magicEdenNFTs, metaplexNFTs, crossPlatformNFTs] = await Promise.allSettled([
                this.getNFTSolNFTs(walletAddress),
                this.getMagicEdenNFTs(walletAddress),
                this.getMetaplexNFTs(walletAddress),
                this.getCrossPlatformNFTs(walletAddress)
            ]);
            // Combine results
            if (nftsolNFTs.status === 'fulfilled') {
                allNFTs.push(...nftsolNFTs.value);
            }
            if (magicEdenNFTs.status === 'fulfilled') {
                allNFTs.push(...magicEdenNFTs.value);
            }
            if (metaplexNFTs.status === 'fulfilled') {
                allNFTs.push(...metaplexNFTs.value);
            }
            if (crossPlatformNFTs.status === 'fulfilled') {
                allNFTs.push(...crossPlatformNFTs.value);
            }
            // Remove duplicates based on mint address
            const uniqueNFTs = this.removeDuplicates(allNFTs);
            console.log(`✅ Found ${uniqueNFTs.length} unique NFTs across all platforms`);
            return uniqueNFTs;
        }
        catch (error) {
            console.error('❌ Error detecting NFTs:', error);
            throw new Error(`Failed to detect NFTs: ${error}`);
        }
    }
    /**
     * Get NFTs from NFTSol platform
     */
    async getNFTSolNFTs(walletAddress) {
        try {
            // Query NFTSol database for user's NFTs
            const response = await fetch(`${process.env.API_BASE || 'http://localhost:3000'}/api/nfts/user/${walletAddress}`);
            const data = await response.json();
            return data.nfts?.map((nft) => ({
                mint: nft.mint,
                name: nft.name,
                description: nft.description,
                image: nft.image,
                collection: nft.collection || 'Unknown Collection',
                owner: nft.owner,
                price: nft.price,
                status: nft.listed ? 'listed' : 'available',
                platform: 'nftsol',
                metadata: nft.metadata,
                attributes: nft.attributes,
                lastUpdated: Date.now()
            })) || [];
        }
        catch (error) {
            console.error('❌ Error fetching NFTSol NFTs:', error);
            return [];
        }
    }
    /**
     * Get NFTs from Magic Eden
     */
    async getMagicEdenNFTs(walletAddress) {
        try {
            const magicEdenUrl = 'https://api-mainnet.magiceden.io/v2';
            const response = await fetch(`${magicEdenUrl}/wallets/${walletAddress}/tokens`);
            const data = await response.json();
            return data.tokens?.map((token) => ({
                mint: token.mint,
                name: token.name || 'Unknown',
                description: token.description || '',
                image: token.image || '',
                collection: token.collection || 'Unknown Collection',
                owner: walletAddress,
                price: token.price ? token.price / 1e9 : undefined,
                status: token.listed ? 'listed' : 'available',
                platform: 'magic-eden',
                metadata: token.metadata,
                attributes: token.attributes,
                lastUpdated: Date.now()
            })) || [];
        }
        catch (error) {
            console.error('❌ Error fetching Magic Eden NFTs:', error);
            return [];
        }
    }
    /**
     * Get NFTs from Metaplex standard
     */
    async getMetaplexNFTs(walletAddress) {
        try {
            const wallet = new web3_js_1.PublicKey(walletAddress);
            // Get token accounts for the wallet
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(wallet, { programId: new web3_js_1.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') });
            const nfts = [];
            for (const account of tokenAccounts.value) {
                const tokenData = account.account.data.parsed.info;
                // Check if it's an NFT (amount = 1, decimals = 0)
                if (tokenData.tokenAmount.amount === '1' && tokenData.tokenAmount.decimals === 0) {
                    try {
                        const metadata = await this.getNFTMetadata(new web3_js_1.PublicKey(tokenData.mint));
                        nfts.push({
                            mint: tokenData.mint,
                            name: metadata.name || 'Unknown NFT',
                            description: metadata.description || '',
                            image: metadata.image || '',
                            collection: metadata.collection?.name || 'Unknown Collection',
                            owner: walletAddress,
                            status: 'available',
                            platform: 'metaplex',
                            metadata: metadata,
                            attributes: metadata.attributes,
                            lastUpdated: Date.now()
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
            console.error('❌ Error fetching Metaplex NFTs:', error);
            return [];
        }
    }
    /**
     * Get NFTs from cross-platform sources
     */
    async getCrossPlatformNFTs(walletAddress) {
        try {
            // Use Helius API for comprehensive NFT detection
            const heliusUrl = `${this.heliusConfig.restUrl}getAssetsByOwner`;
            const response = await fetch(heliusUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.heliusConfig.apiKey}`
                },
                body: JSON.stringify({
                    ownerAddress: walletAddress,
                    page: 1,
                    limit: 1000
                })
            });
            const data = await response.json();
            return data.items?.map((item) => ({
                mint: item.id,
                name: item.content?.metadata?.name || 'Unknown',
                description: item.content?.metadata?.description || '',
                image: item.content?.files?.[0]?.uri || '',
                collection: item.grouping?.[0]?.group_value || 'Unknown Collection',
                owner: walletAddress,
                status: 'available',
                platform: 'unknown',
                metadata: item,
                attributes: item.content?.metadata?.attributes,
                lastUpdated: Date.now()
            })) || [];
        }
        catch (error) {
            console.error('❌ Error fetching cross-platform NFTs:', error);
            return [];
        }
    }
    /**
     * Get NFT metadata
     */
    async getNFTMetadata(mintAddress) {
        try {
            // Get metadata account
            const [metadataPDA] = web3_js_1.PublicKey.findProgramAddressSync([
                Buffer.from('metadata'),
                new web3_js_1.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
                mintAddress.toBuffer(),
            ], new web3_js_1.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'));
            const accountInfo = await this.connection.getAccountInfo(metadataPDA);
            if (!accountInfo)
                return {};
            // Parse metadata (simplified)
            const data = accountInfo.data;
            const nameLength = data.readUInt32LE(4);
            const name = data.slice(4, 4 + nameLength).toString();
            const symbolLength = data.readUInt32LE(4 + nameLength);
            const symbol = data.slice(4 + nameLength, 4 + nameLength + symbolLength).toString();
            const uriLength = data.readUInt32LE(4 + nameLength + symbolLength);
            const uri = data.slice(4 + nameLength + symbolLength, 4 + nameLength + symbolLength + uriLength).toString();
            return {
                name,
                symbol,
                uri,
                // Additional metadata would be fetched from the URI
            };
        }
        catch (error) {
            console.error('❌ Error getting NFT metadata:', error);
            return {};
        }
    }
    /**
     * Remove duplicate NFTs based on mint address
     */
    removeDuplicates(nfts) {
        const seen = new Set();
        return nfts.filter(nft => {
            if (seen.has(nft.mint)) {
                return false;
            }
            seen.add(nft.mint);
            return true;
        });
    }
    /**
     * Get collection information
     */
    async getCollectionInfo(collectionAddress) {
        try {
            // This would integrate with various collection APIs
            // For now, return basic info
            return {
                name: 'Unknown Collection',
                symbol: 'UNK',
                description: 'Collection detected on NFTSol',
                image: '',
                totalSupply: 0,
                floorPrice: 0,
                volume24h: 0,
                marketCap: 0,
                verified: false,
                socialLinks: {}
            };
        }
        catch (error) {
            console.error('❌ Error getting collection info:', error);
            return null;
        }
    }
    /**
     * Search NFTs across all platforms
     */
    async searchNFTs(query, filters) {
        try {
            console.log(`🔍 Searching NFTs with query: ${query}`);
            // This would implement cross-platform search
            // For now, return empty array
            return [];
        }
        catch (error) {
            console.error('❌ Error searching NFTs:', error);
            return [];
        }
    }
}
exports.UniversalNFTDetectionService = UniversalNFTDetectionService;
