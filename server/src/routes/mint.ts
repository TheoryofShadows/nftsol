import express from "express";
import { NFTMintingService } from "../services/nftMinting";
import { CloutTokenService } from "../services/cloutToken";
import { HonorSystem } from "../services/honorSystem";

const router = express.Router();
const nftMintingService = new NFTMintingService();
const cloutService = new CloutTokenService();
const honorSystem = new HonorSystem();

// POST /api/mint { name, description, imageUrl, collection, creator }
router.post("/", async (req, res) => {
  try {
    const { name, description, imageUrl, collection, creator } = req.body || {};
    
    // Validate required fields
    if (!name || !description || !imageUrl || !creator) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: name, description, imageUrl, creator" 
      });
    }

    console.log(`🚀 Minting NFT: ${name} by ${creator}`);

    // Mint the NFT using the enhanced service
    const result = await nftMintingService.mintNFT(
      creator,
      name,
      description,
      imageUrl,
      [], // attributes
      collection
    );

    if (result.success) {
      // Award CLOUT tokens for NFT creation
      const cloutResult = await cloutService.distributeCloutRewards(
        creator,
        50, // 50 CLOUT for creating an NFT
        1.0 // base multiplier
      );

      // Update honor score
      await honorSystem.updateHonorScore(creator, 'nft_created', 1);

      console.log(`✅ NFT minted successfully: ${result.mintAddress}`);

      res.json({
        success: true,
        mintAddress: result.mintAddress,
        signature: result.signature,
        nft: result.nft,
        clout: cloutResult,
        reward: 50
      });
    } else {
      throw new Error('NFT minting failed');
    }

  } catch (error: any) {
    console.error('❌ NFT minting failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Minting failed'
    });
  }
});

export default router;
