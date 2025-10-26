"use strict";
/**
 * 🏗️ Collection Management Routes
 * API endpoints for NFT project collection building and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const collectionManagement_1 = require("../services/collectionManagement");
const router = (0, express_1.Router)();
const collectionService = new collectionManagement_1.CollectionManagementService();
// Create a new collection
router.post('/create', async (req, res) => {
    try {
        const { name, symbol, description, image, bannerImage, creator, website, twitter, discord, socialLinks } = req.body;
        if (!name || !symbol || !description || !image || !creator) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        console.log(`🏗️ Creating collection: ${name}`);
        const collection = await collectionService.createCollection({
            name,
            symbol,
            description,
            image,
            bannerImage,
            creator,
            website,
            twitter,
            discord,
            socialLinks
        });
        res.json({
            success: true,
            collection: collection,
            message: 'Collection created successfully'
        });
    }
    catch (error) {
        console.error('❌ Error creating collection:', error);
        res.status(500).json({
            success: false,
            error: `Failed to create collection: ${error.message}`
        });
    }
});
// Update collection
router.put('/:collectionId', async (req, res) => {
    try {
        const { collectionId } = req.params;
        const updates = req.body;
        const { requester } = req.body;
        if (!requester) {
            return res.status(400).json({
                success: false,
                error: 'Requester address is required'
            });
        }
        console.log(`📝 Updating collection: ${collectionId}`);
        const collection = await collectionService.updateCollection(collectionId, updates, requester);
        res.json({
            success: true,
            collection: collection,
            message: 'Collection updated successfully'
        });
    }
    catch (error) {
        console.error('❌ Error updating collection:', error);
        res.status(500).json({
            success: false,
            error: `Failed to update collection: ${error.message}`
        });
    }
});
// Configure collection launch
router.post('/:collectionId/launch', async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { launchDate, price, currency, maxPerWallet, whitelistRequired, timeCapsuleEnabled, requester } = req.body;
        if (!requester) {
            return res.status(400).json({
                success: false,
                error: 'Requester address is required'
            });
        }
        console.log(`🚀 Configuring launch for collection: ${collectionId}`);
        const launch = await collectionService.configureLaunch(collectionId, {
            launchDate,
            price,
            currency,
            maxPerWallet,
            whitelistRequired,
            timeCapsuleEnabled
        }, requester);
        res.json({
            success: true,
            launch: launch,
            message: 'Collection launch configured successfully'
        });
    }
    catch (error) {
        console.error('❌ Error configuring collection launch:', error);
        res.status(500).json({
            success: false,
            error: `Failed to configure collection launch: ${error.message}`
        });
    }
});
// Batch mint NFTs
router.post('/:collectionId/mint', async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { assets, metadata, requester } = req.body;
        if (!requester) {
            return res.status(400).json({
                success: false,
                error: 'Requester address is required'
            });
        }
        console.log(`🎨 Batch minting NFTs for collection: ${collectionId}`);
        const result = await collectionService.batchMintNFTs(collectionId, {
            collectionId,
            assets,
            metadata
        }, requester);
        res.json({
            success: result.success,
            result: result,
            message: result.success ? 'NFTs minted successfully' : 'Failed to mint some NFTs'
        });
    }
    catch (error) {
        console.error('❌ Error batch minting NFTs:', error);
        res.status(500).json({
            success: false,
            error: `Failed to batch mint NFTs: ${error.message}`
        });
    }
});
// Get collection by ID
router.get('/:collectionId', async (req, res) => {
    try {
        const { collectionId } = req.params;
        console.log(`📋 Getting collection: ${collectionId}`);
        const collection = await collectionService.getCollection(collectionId);
        if (!collection) {
            return res.status(404).json({
                success: false,
                error: 'Collection not found'
            });
        }
        res.json({
            success: true,
            collection: collection
        });
    }
    catch (error) {
        console.error('❌ Error getting collection:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get collection: ${error.message}`
        });
    }
});
// Get collections by creator
router.get('/creator/:address', async (req, res) => {
    try {
        const { address } = req.params;
        console.log(`📋 Getting collections for creator: ${address}`);
        const collections = await collectionService.getCollectionsByCreator(address);
        res.json({
            success: true,
            creator: address,
            collections: collections,
            count: collections.length
        });
    }
    catch (error) {
        console.error('❌ Error getting creator collections:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get creator collections: ${error.message}`
        });
    }
});
// Get featured collections
router.get('/featured', async (req, res) => {
    try {
        console.log('⭐ Getting featured collections');
        const collections = await collectionService.getFeaturedCollections();
        res.json({
            success: true,
            collections: collections,
            count: collections.length
        });
    }
    catch (error) {
        console.error('❌ Error getting featured collections:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get featured collections: ${error.message}`
        });
    }
});
// Get trending collections
router.get('/trending', async (req, res) => {
    try {
        console.log('📈 Getting trending collections');
        const collections = await collectionService.getTrendingCollections();
        res.json({
            success: true,
            collections: collections,
            count: collections.length
        });
    }
    catch (error) {
        console.error('❌ Error getting trending collections:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get trending collections: ${error.message}`
        });
    }
});
// Search collections
router.get('/search', async (req, res) => {
    try {
        const { q, verified, featured, minFloorPrice, maxFloorPrice } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }
        console.log(`🔍 Searching collections with query: ${q}`);
        const filters = {
            verified: verified === 'true',
            featured: featured === 'true',
            minFloorPrice: minFloorPrice ? parseFloat(minFloorPrice) : undefined,
            maxFloorPrice: maxFloorPrice ? parseFloat(maxFloorPrice) : undefined
        };
        const collections = await collectionService.searchCollections(q, filters);
        res.json({
            success: true,
            query: q,
            filters: filters,
            collections: collections,
            count: collections.length
        });
    }
    catch (error) {
        console.error('❌ Error searching collections:', error);
        res.status(500).json({
            success: false,
            error: `Failed to search collections: ${error.message}`
        });
    }
});
// Get collection statistics
router.get('/:collectionId/stats', async (req, res) => {
    try {
        const { collectionId } = req.params;
        console.log(`📊 Getting collection stats for: ${collectionId}`);
        const stats = await collectionService.getCollectionStats(collectionId);
        res.json({
            success: true,
            collectionId: collectionId,
            stats: stats
        });
    }
    catch (error) {
        console.error('❌ Error getting collection stats:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get collection stats: ${error.message}`
        });
    }
});
exports.default = router;
