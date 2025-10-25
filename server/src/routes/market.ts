import { Router } from "express";
import { NFTMintingService } from "../services/nftMinting";
import { MarketplaceService } from "../services/marketplace";
import { apiLimiter } from "../middleware/security";
import { nftMintSchema, listingSchema, purchaseSchema, searchSchema } from "../middleware/validation";
import { validateInput } from "../middleware/security";

const router = Router();
const nftMintingService = new NFTMintingService();
const marketplaceService = new MarketplaceService();

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

    res.json({ ok: true, ...result });
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
    res.json({ ok: true, ...result });
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
    res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Buy error:', error);
    next(error); // Pass to error handler
  }
});

// Get NFTs
router.get("/nfts", async (req, res, next) => {
  try {
    const { owner, status, collection, limit, offset } = req.query;
    
    // Validate and sanitize query parameters
    const filters = {
      owner: owner as string,
      status: status as string,
      collection: collection as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined
    };

    const nfts = await marketplaceService.getNFTs(filters);
    res.json({ ok: true, nfts });
  } catch (error: any) {
    console.error('Get NFTs error:', error);
    next(error); // Pass to error handler
  }
});

export default router;
