"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nftMinting_1 = require("../services/nftMinting");
const cloutToken_1 = require("../services/cloutToken");
const honorSystem_1 = require("../services/honorSystem");
const router = express_1.default.Router();
const nftMintingService = new nftMinting_1.NFTMintingService();
const cloutService = new cloutToken_1.CloutTokenService();
const honorSystem = new honorSystem_1.HonorSystem();
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
        const result = await nftMintingService.mintNFT({
            name,
            description,
            imageUrl,
            creatorWallet: creator,
            collection
        });
        if (result.success) {
            // Award CLOUT tokens for NFT creation
            const cloutResult = await cloutService.distributeCloutRewards(creator, 50, // 50 CLOUT for creating an NFT
            1.0 // base multiplier
            );
            // Update honor score
            await honorSystem.updateHonorScore(creator, 'nft_created', 1);
            console.log(`✅ NFT minted successfully: ${result.mintAddress}`);
            res.json({
                success: true,
                mintAddress: result.mintAddress,
                signature: result.signature,
                clout: cloutResult,
                reward: 50
            });
        }
        else {
            throw new Error('NFT minting failed');
        }
    }
    catch (error) {
        console.error('❌ NFT minting failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Minting failed'
        });
    }
});
exports.default = router;
