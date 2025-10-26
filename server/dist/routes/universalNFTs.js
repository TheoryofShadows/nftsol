"use strict";
/**
 * 🌐 Universal NFT Routes
 * API endpoints for cross-platform NFT detection and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const universalNFTDetection_1 = require("../services/universalNFTDetection");
const router = (0, express_1.Router)();
const nftDetectionService = new universalNFTDetection_1.UniversalNFTDetectionService();
// Get all NFTs for a wallet across all platforms
router.get('/wallet/:address', async (req, res) => {
    try {
        const { address } = req.params;
        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address is required'
            });
        }
        console.log(`🔍 Detecting NFTs for wallet: ${address}`);
        const nfts = await nftDetectionService.getAllNFTsForWallet(address);
        res.json({
            success: true,
            wallet: address,
            nfts: nfts,
            count: nfts.length,
            platforms: [...new Set(nfts.map(nft => nft.platform))]
        });
    }
    catch (error) {
        console.error('❌ Error detecting NFTs:', error);
        res.status(500).json({
            success: false,
            error: `Failed to detect NFTs: ${error.message}`
        });
    }
});
// Get NFTs by collection
router.get('/collection/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const { page = 1, limit = 20 } = req.query;
        console.log(`📋 Getting NFTs for collection: ${collection}`);
        // This would implement collection-based NFT retrieval
        // For now, return empty array
        const nfts = [];
        res.json({
            success: true,
            collection: collection,
            nfts: nfts,
            count: nfts.length,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    }
    catch (error) {
        console.error('❌ Error getting collection NFTs:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get collection NFTs: ${error.message}`
        });
    }
});
// Search NFTs across all platforms
router.get('/search', async (req, res) => {
    try {
        const { q, collection, minPrice, maxPrice, platform } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }
        console.log(`🔍 Searching NFTs with query: ${q}`);
        const filters = {
            collection: collection,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            platform: platform
        };
        const nfts = await nftDetectionService.searchNFTs(q, filters);
        res.json({
            success: true,
            query: q,
            filters: filters,
            nfts: nfts,
            count: nfts.length
        });
    }
    catch (error) {
        console.error('❌ Error searching NFTs:', error);
        res.status(500).json({
            success: false,
            error: `Failed to search NFTs: ${error.message}`
        });
    }
});
// Get collection information
router.get('/collection-info/:address', async (req, res) => {
    try {
        const { address } = req.params;
        console.log(`📊 Getting collection info for: ${address}`);
        const collectionInfo = await nftDetectionService.getCollectionInfo(address);
        if (!collectionInfo) {
            return res.status(404).json({
                success: false,
                error: 'Collection not found'
            });
        }
        res.json({
            success: true,
            collection: collectionInfo
        });
    }
    catch (error) {
        console.error('❌ Error getting collection info:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get collection info: ${error.message}`
        });
    }
});
// Get platform statistics
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Getting universal NFT statistics');
        const stats = {
            totalNFTs: 0,
            platforms: {
                nftsol: 0,
                magicEden: 0,
                metaplex: 0,
                crossPlatform: 0
            },
            collections: 0,
            totalVolume: 0,
            lastUpdated: Date.now()
        };
        res.json({
            success: true,
            stats: stats
        });
    }
    catch (error) {
        console.error('❌ Error getting NFT statistics:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get NFT statistics: ${error.message}`
        });
    }
});
exports.default = router;
