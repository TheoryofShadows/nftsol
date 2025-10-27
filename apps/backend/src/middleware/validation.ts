import { z } from 'zod';

// User validation schemas
export const userRegistrationSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  socialLinks: z.record(z.string().url()).optional()
});

export const userLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8)
});

export const userUpdateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  socialLinks: z.record(z.string().url()).optional()
});

// NFT validation schemas
export const nftMintSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  imageUrl: z.string().url(),
  creatorWallet: z.string().min(32).max(44),
  collection: z.string().max(100).optional(),
  attributes: z.array(z.object({
    trait_type: z.string(),
    value: z.union([z.string(), z.number()])
  })).optional()
});

export const nftUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
  price: z.number().positive().optional(),
  attributes: z.array(z.object({
    trait_type: z.string(),
    value: z.union([z.string(), z.number()])
  })).optional()
});

// Marketplace validation schemas
export const listingSchema = z.object({
  mintAddress: z.string().min(32).max(44),
  sellerWallet: z.string().min(32).max(44),
  price: z.number().positive(),
  currency: z.enum(['SOL', 'CLOUT']).default('SOL')
});

export const purchaseSchema = z.object({
  mintAddress: z.string().min(32).max(44),
  buyerWallet: z.string().min(32).max(44),
  paymentMethod: z.enum(['instant', 'escrow', 'clout']).default('instant')
});

// CLOUT token validation schemas
export const cloutTransferSchema = z.object({
  toWallet: z.string().min(32).max(44),
  amount: z.number().positive(),
  reason: z.string().max(200).optional()
});

export const cloutStakeSchema = z.object({
  amount: z.number().positive(),
  duration: z.number().positive().max(365) // days
});

// Collection validation schemas
export const collectionCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  imageUrl: z.string().url(),
  creatorWallet: z.string().min(32).max(44),
  maxSupply: z.number().positive().optional(),
  royalty: z.number().min(0).max(10).default(2.5)
});

export const collectionUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
  imageUrl: z.string().url().optional(),
  maxSupply: z.number().positive().optional(),
  royalty: z.number().min(0).max(10).optional()
});

// Time capsule validation schemas
export const timeCapsuleCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  imageUrl: z.string().url(),
  creatorWallet: z.string().min(32).max(44),
  unlockDate: z.string().datetime(),
  maxSupply: z.number().positive(),
  price: z.number().positive()
});

// Search and filter validation schemas
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  category: z.enum(['all', 'art', 'music', 'gaming', 'sports', 'collectibles']).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().positive().optional(),
  sortBy: z.enum(['newest', 'oldest', 'price_low', 'price_high', 'popularity']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/),
    size: z.number().max(10 * 1024 * 1024) // 10MB max
  })
});

// Wallet validation
export const walletAddressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

// Date range validation
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Advanced search validation
export const advancedSearchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  creator: z.string().min(32).max(44).optional(),
  collection: z.string().min(1).max(100).optional(),
  attributes: z.record(z.union([z.string(), z.number()])).optional(),
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().positive().optional()
  }).optional(),
  dateRange: dateRangeSchema.optional(),
  sortBy: z.enum(['newest', 'oldest', 'price_low', 'price_high', 'popularity', 'rarity']).optional(),
  pagination: paginationSchema.optional()
});

// Validation middleware function
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
};

// Export all schemas for use in routes
export const validationSchemas = {
  userRegistration: userRegistrationSchema,
  userLogin: userLoginSchema,
  userUpdate: userUpdateSchema,
  nftMint: nftMintSchema,
  nftUpdate: nftUpdateSchema,
  listing: listingSchema,
  purchase: purchaseSchema,
  cloutTransfer: cloutTransferSchema,
  cloutStake: cloutStakeSchema,
  collectionCreate: collectionCreateSchema,
  collectionUpdate: collectionUpdateSchema,
  timeCapsuleCreate: timeCapsuleCreateSchema,
  search: searchSchema,
  fileUpload: fileUploadSchema,
  walletAddress: walletAddressSchema,
  pagination: paginationSchema,
  dateRange: dateRangeSchema,
  advancedSearch: advancedSearchSchema
};
