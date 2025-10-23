import { Router } from "express";
import { CrossPlatformNFTService } from "../services/crossPlatformNFTs";

const router = Router();
const nftService = new CrossPlatformNFTService();

// Get all Solana NFTs from multiple sources
router.get("/", async (req, res) => {
  try {
    const { owner, collection, limit, offset, sources } = req.query;
    
    const filters = {
      owner: owner as string,
      collection: collection as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      sources: sources ? (sources as string).split(',') : undefined
    };

    const nfts = await nftService.getAllSolanaNFTs(filters);
    res.json({ success: true, nfts, count: nfts.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import external NFT to platform
router.post("/import", async (req, res) => {
  try {
    const { mintAddress, ownerWallet } = req.body;
    
    if (!mintAddress || !ownerWallet) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: mintAddress, ownerWallet" 
      });
    }

    const result = await nftService.importExternalNFT(mintAddress, ownerWallet);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search NFTs across all platforms
router.get("/search", async (req, res) => {
  try {
    const { q, owner, collection, limit } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required parameter: q (search query)" 
      });
    }

    const filters = {
      owner: owner as string,
      collection: collection as string,
      limit: limit ? parseInt(limit as string) : 20
    };

    const nfts = await nftService.searchNFTs(q as string, filters);
    res.json({ success: true, nfts, count: nfts.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trending NFTs
router.get("/trending", async (req, res) => {
  try {
    const { limit } = req.query;
    const nftLimit = limit ? parseInt(limit as string) : 20;
    
    const nfts = await nftService.getTrendingNFTs(nftLimit);
    res.json({ success: true, nfts, count: nfts.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get NFTs by collection
router.get("/collection/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const { limit, offset } = req.query;
    
    const filters = {
      collection,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const nfts = await nftService.getAllSolanaNFTs(filters);
    res.json({ success: true, nfts, count: nfts.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get NFT details by mint address
router.get("/:mintAddress", async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    // Search for the specific NFT across all sources
    const nfts = await nftService.getAllSolanaNFTs({ 
      limit: 1,
      sources: ['platform', 'helius', 'magic-eden', 'solana-rpc']
    });
    
    const nft = nfts.find(n => n.mint === mintAddress);
    
    if (!nft) {
      return res.status(404).json({ 
        success: false, 
        error: "NFT not found" 
      });
    }

    res.json({ success: true, nft });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
