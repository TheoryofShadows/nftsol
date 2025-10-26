"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const nftMinting_1 = require("../services/nftMinting");
const marketplace_1 = require("../services/marketplace");
const security_1 = require("../middleware/security");
const validation_1 = require("../middleware/validation");
const security_2 = require("../middleware/security");
const response_1 = require("../utils/response");
const constants_1 = require("../config/constants");
const router = (0, express_1.Router)();
const nftMintingService = new nftMinting_1.NFTMintingService();
const marketplaceService = new marketplace_1.MarketplaceService();
// Query parameter validation schema for GET /nfts
const nftQuerySchema = zod_1.z.object({
    owner: zod_1.z.string().min(32).max(44).optional(),
    status: zod_1.z.string().optional(),
    collection: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(constants_1.PAGINATION.MAX_LIMIT).optional().default(constants_1.PAGINATION.DEFAULT_LIMIT),
    offset: zod_1.z.coerce.number().min(0).optional().default(0)
});
// Mint NFT
router.post("/mint", security_1.apiLimiter, (0, security_2.validateInput)(validation_1.nftMintSchema), async (req, res, next) => {
    try {
        const { creatorWallet, name, description, imageUrl, attributes = [], collection } = req.body;
        // Validation already done by Zod schema, but keeping for reference
        const result = await nftMintingService.mintNFT({
            name,
            description,
            imageUrl,
            creatorWallet,
            collection
        });
        return (0, response_1.successResponse)(res, result, 201);
    }
    catch (error) {
        console.error('Mint error:', error);
        next(error); // Pass to error handler
    }
});
// List NFT for sale
router.post("/list", security_1.apiLimiter, (0, security_2.validateInput)(validation_1.listingSchema), async (req, res, next) => {
    try {
        const { mintAddress, price, sellerWallet } = req.body;
        const result = await marketplaceService.listNFT(mintAddress, price, sellerWallet);
        return (0, response_1.successResponse)(res, result, 201);
    }
    catch (error) {
        console.error('List error:', error);
        next(error); // Pass to error handler
    }
});
// Buy NFT
router.post("/buy", security_1.apiLimiter, (0, security_2.validateInput)(validation_1.purchaseSchema), async (req, res, next) => {
    try {
        const { mintAddress, buyerWallet, price } = req.body;
        const result = await marketplaceService.buyNFT(mintAddress, buyerWallet, price);
        return (0, response_1.successResponse)(res, result);
    }
    catch (error) {
        console.error('Buy error:', error);
        next(error); // Pass to error handler
    }
});
// Get NFTs
router.get("/nfts", async (req, res, next) => {
    try {
        // Validate query parameters
        const validated = nftQuerySchema.safeParse(req.query);
        if (!validated.success) {
            return (0, response_1.errorResponse)(res, 'Invalid query parameters', 400, validated.error.errors);
        }
        const { owner, status, collection, limit, offset } = validated.data;
        const filters = {
            owner,
            status,
            collection,
            limit,
            offset
        };
        const result = await marketplaceService.getNFTs(filters);
        // Return paginated response
        return (0, response_1.paginatedResponse)(res, result.data, Math.floor(offset / limit) + 1, limit, result.pagination.total);
    }
    catch (error) {
        console.error('Get NFTs error:', error);
        next(error); // Pass to error handler
    }
});
exports.default = router;
