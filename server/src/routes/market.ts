import { Router } from "express";
import { NFTMintingService } from "../services/nftMinting";
import { MarketplaceService } from "../services/marketplace";

const router = Router();
const nftMintingService = new NFTMintingService();
const marketplaceService = new MarketplaceService();

// Mint NFT
router.post("/mint", async (req, res) => {
  try {
    const { 
      creatorWallet, 
      name, 
      description, 
      imageUrl, 
      attributes = [],
      collection 
    } = req.body;

    if (!creatorWallet || !name || !description || !imageUrl) {
      return res.status(400).json({ 
        ok: false, 
        error: "Missing required fields: creatorWallet, name, description, imageUrl" 
      });
    }

    const result = await nftMintingService.mintNFT(
      creatorWallet,
      name,
      description,
      imageUrl,
      attributes,
      collection
    );

    res.json({ ok: true, ...result });

  } catch (error: any) {
    console.error('Mint error:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message || "Minting failed" 
    });
  }
});

// List NFT for sale
router.post("/list", async (req, res) => {
  try {
    const { mintAddress, price, sellerWallet } = req.body;

    if (!mintAddress || !price || !sellerWallet) {
      return res.status(400).json({ 
        ok: false, 
        error: "Missing required fields: mintAddress, price, sellerWallet" 
      });
    }

    const result = await marketplaceService.listNFT(mintAddress, price, sellerWallet);
    res.json({ ok: true, ...result });

  } catch (error: any) {
    console.error('List error:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message || "Listing failed" 
    });
  }
});

// Buy NFT
router.post("/buy", async (req, res) => {
  try {
    const { mintAddress, buyerWallet, price } = req.body;

    if (!mintAddress || !buyerWallet || !price) {
      return res.status(400).json({ 
        ok: false, 
        error: "Missing required fields: mintAddress, buyerWallet, price" 
      });
    }

    const result = await marketplaceService.buyNFT(mintAddress, buyerWallet, price);
    res.json({ ok: true, ...result });

  } catch (error: any) {
    console.error('Buy error:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message || "Purchase failed" 
    });
  }
});

// Get NFTs
router.get("/nfts", async (req, res) => {
  try {
    const { owner, status, collection, limit, offset } = req.query;
    
    const filters = {
      owner: owner as string,
      status: status as string,
      collection: collection as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const nfts = await marketplaceService.getNFTs(filters);
    res.json({ ok: true, nfts });

  } catch (error: any) {
    console.error('Get NFTs error:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message || "Failed to get NFTs" 
    });
  }
});

export default router;
