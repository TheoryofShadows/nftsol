import { Router } from "express";
import { z } from "zod";
import { NFTMintingService } from "../services/nftMinting";
import { MarketplaceService } from "../services/marketplace";
import { webSocketService } from "../app";
import { apiLimiter } from "../middleware/security";
import { nftMintSchema, listingSchema, purchaseSchema, searchSchema } from "../middleware/validation";
import { validateInput } from "../middleware/security";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response";
import { PAGINATION } from "../config/constants";

const router = Router();
const nftMintingService = new NFTMintingService();
const marketplaceService = new MarketplaceService();

// Query parameter validation schema for GET /nfts
const nftQuerySchema = z.object({
  owner: z.string().min(32).max(44).optional(),
  status: z.string().optional(),
  collection: z.string().optional(),
  limit: z.coerce.number().min(1).max(PAGINATION.MAX_LIMIT).optional().default(PAGINATION.DEFAULT_LIMIT),
  offset: z.coerce.number().min(0).optional().default(0)
});

// Mint NFT
router.post("/mint", apiLimiter as any, validateInput(nftMintSchema), async (req, res, next) => {
  try {
    const { 
      creatorWallet, 
      name, 
      description, 
      imageUrl, 
      attributes = [],
      collection 
    } = req.body;

    // Validation already done by Zod schema, but keeping for reference
    const result = await nftMintingService.mintNFT({
      name,
      description,
      imageUrl,
      creatorWallet,
      collection
    });

    return successResponse(res, result, 201);
  } catch (error: any) {
    console.error('Mint error:', error);
    next(error); // Pass to error handler
  }
});

// List NFT for sale
router.post("/list", apiLimiter as any, validateInput(listingSchema), async (req, res, next) => {
  try {
    const { mintAddress, price, sellerWallet } = req.body;

    const result = await marketplaceService.listNFT(mintAddress, price, sellerWallet);
    
    // Emit real-time update if WebSocket is available
    if (webSocketService && result.success) {
      // Get NFT details for the update
      const nft = await marketplaceService.getNFTByMintAddress(mintAddress);
      if (nft) {
        webSocketService.emitNFTListed(nft, 'nftsol');
        webSocketService.emitMarketplaceActivity('nft-listed', {
          nft,
          price,
          seller: sellerWallet,
          timestamp: Date.now()
        });
      }
    }
    
    return successResponse(res, result, 201);
  } catch (error: any) {
    console.error('List error:', error);
    next(error); // Pass to error handler
  }
});

// Buy NFT
router.post("/buy", apiLimiter as any, validateInput(purchaseSchema), async (req, res, next) => {
  try {
    const { mintAddress, buyerWallet, price } = req.body;

    const result = await marketplaceService.buyNFT(mintAddress, buyerWallet, price);
    
    // Emit real-time update if WebSocket is available
    if (webSocketService && result.success) {
      // Get NFT details for the update
      const nft = await marketplaceService.getNFTByMintAddress(mintAddress);
      if (nft) {
        webSocketService.emitNFTSold(nft, buyerWallet, price);
        webSocketService.emitMarketplaceActivity('nft-purchased', {
          nft,
          buyer: buyerWallet,
          price,
          timestamp: Date.now()
        });
      }
    }
    
    return successResponse(res, result);
  } catch (error: any) {
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
      return errorResponse(res, 'Invalid query parameters', 400, validated.error.errors);
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
    return paginatedResponse(res, result.data, Math.floor(offset / limit) + 1, limit, result.pagination.total);
  } catch (error: any) {
    console.error('Get NFTs error:', error);
    next(error); // Pass to error handler
  }
});

export default router;
