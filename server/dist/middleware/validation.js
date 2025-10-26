"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchemas = exports.advancedSearchSchema = exports.dateRangeSchema = exports.paginationSchema = exports.walletAddressSchema = exports.fileUploadSchema = exports.searchSchema = exports.timeCapsuleCreateSchema = exports.collectionUpdateSchema = exports.collectionCreateSchema = exports.cloutStakeSchema = exports.cloutTransferSchema = exports.purchaseSchema = exports.listingSchema = exports.nftUpdateSchema = exports.nftMintSchema = exports.userUpdateSchema = exports.userLoginSchema = exports.userRegistrationSchema = void 0;
const zod_1 = require("zod");
// User validation schemas
exports.userRegistrationSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(32).max(44),
    username: zod_1.z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    displayName: zod_1.z.string().min(1).max(50).optional(),
    bio: zod_1.z.string().max(500).optional(),
    avatar: zod_1.z.string().url().optional(),
    socialLinks: zod_1.z.record(zod_1.z.string().url()).optional()
});
exports.userLoginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8)
});
exports.userUpdateSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(50).optional(),
    bio: zod_1.z.string().max(500).optional(),
    avatar: zod_1.z.string().url().optional(),
    socialLinks: zod_1.z.record(zod_1.z.string().url()).optional()
});
// NFT validation schemas
exports.nftMintSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(1000),
    imageUrl: zod_1.z.string().url(),
    creatorWallet: zod_1.z.string().min(32).max(44),
    collection: zod_1.z.string().max(100).optional(),
    attributes: zod_1.z.array(zod_1.z.object({
        trait_type: zod_1.z.string(),
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()])
    })).optional()
});
exports.nftUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().min(1).max(1000).optional(),
    price: zod_1.z.number().positive().optional(),
    attributes: zod_1.z.array(zod_1.z.object({
        trait_type: zod_1.z.string(),
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()])
    })).optional()
});
// Marketplace validation schemas
exports.listingSchema = zod_1.z.object({
    mintAddress: zod_1.z.string().min(32).max(44),
    sellerWallet: zod_1.z.string().min(32).max(44),
    price: zod_1.z.number().positive(),
    currency: zod_1.z.enum(['SOL', 'CLOUT']).default('SOL')
});
exports.purchaseSchema = zod_1.z.object({
    mintAddress: zod_1.z.string().min(32).max(44),
    buyerWallet: zod_1.z.string().min(32).max(44),
    paymentMethod: zod_1.z.enum(['instant', 'escrow', 'clout']).default('instant')
});
// CLOUT token validation schemas
exports.cloutTransferSchema = zod_1.z.object({
    toWallet: zod_1.z.string().min(32).max(44),
    amount: zod_1.z.number().positive(),
    reason: zod_1.z.string().max(200).optional()
});
exports.cloutStakeSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    duration: zod_1.z.number().positive().max(365) // days
});
// Collection validation schemas
exports.collectionCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(1000),
    imageUrl: zod_1.z.string().url(),
    creatorWallet: zod_1.z.string().min(32).max(44),
    maxSupply: zod_1.z.number().positive().optional(),
    royalty: zod_1.z.number().min(0).max(10).default(2.5)
});
exports.collectionUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().min(1).max(1000).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    maxSupply: zod_1.z.number().positive().optional(),
    royalty: zod_1.z.number().min(0).max(10).optional()
});
// Time capsule validation schemas
exports.timeCapsuleCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(1000),
    imageUrl: zod_1.z.string().url(),
    creatorWallet: zod_1.z.string().min(32).max(44),
    unlockDate: zod_1.z.string().datetime(),
    maxSupply: zod_1.z.number().positive(),
    price: zod_1.z.number().positive()
});
// Search and filter validation schemas
exports.searchSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(100),
    category: zod_1.z.enum(['all', 'art', 'music', 'gaming', 'sports', 'collectibles']).optional(),
    priceMin: zod_1.z.number().min(0).optional(),
    priceMax: zod_1.z.number().positive().optional(),
    sortBy: zod_1.z.enum(['newest', 'oldest', 'price_low', 'price_high', 'popularity']).optional(),
    limit: zod_1.z.number().min(1).max(100).default(20),
    offset: zod_1.z.number().min(0).default(0)
});
// File upload validation
exports.fileUploadSchema = zod_1.z.object({
    file: zod_1.z.object({
        fieldname: zod_1.z.string(),
        originalname: zod_1.z.string(),
        encoding: zod_1.z.string(),
        mimetype: zod_1.z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/),
        size: zod_1.z.number().max(10 * 1024 * 1024) // 10MB max
    })
});
// Wallet validation
exports.walletAddressSchema = zod_1.z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
// Pagination validation
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(100).default(20)
});
// Date range validation
exports.dateRangeSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional()
});
// Advanced search validation
exports.advancedSearchSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(100).optional(),
    creator: zod_1.z.string().min(32).max(44).optional(),
    collection: zod_1.z.string().min(1).max(100).optional(),
    attributes: zod_1.z.record(zod_1.z.union([zod_1.z.string(), zod_1.z.number()])).optional(),
    priceRange: zod_1.z.object({
        min: zod_1.z.number().min(0).optional(),
        max: zod_1.z.number().positive().optional()
    }).optional(),
    dateRange: exports.dateRangeSchema.optional(),
    sortBy: zod_1.z.enum(['newest', 'oldest', 'price_low', 'price_high', 'popularity', 'rarity']).optional(),
    pagination: exports.paginationSchema.optional()
});
// Export all schemas for use in routes
exports.validationSchemas = {
    userRegistration: exports.userRegistrationSchema,
    userLogin: exports.userLoginSchema,
    userUpdate: exports.userUpdateSchema,
    nftMint: exports.nftMintSchema,
    nftUpdate: exports.nftUpdateSchema,
    listing: exports.listingSchema,
    purchase: exports.purchaseSchema,
    cloutTransfer: exports.cloutTransferSchema,
    cloutStake: exports.cloutStakeSchema,
    collectionCreate: exports.collectionCreateSchema,
    collectionUpdate: exports.collectionUpdateSchema,
    timeCapsuleCreate: exports.timeCapsuleCreateSchema,
    search: exports.searchSchema,
    fileUpload: exports.fileUploadSchema,
    walletAddress: exports.walletAddressSchema,
    pagination: exports.paginationSchema,
    dateRange: exports.dateRangeSchema,
    advancedSearch: exports.advancedSearchSchema
};
