/**
 * 🚀 Bubblegum API Routes - Mass cNFT Drops
 * Enables 99% cost reduction for NFT mints
 */

import { Router, Request, Response } from 'express';
import { CreateTreeOptions, MintCompressedNFTOptions, BulkMintOptions, CompressedNFTMetadata } from '../services/bubblegumService';
import { PublicKey } from '@solana/web3.js';
import expressRateLimit from 'express-rate-limit';
import { solanaServiceManager } from '../services/solanaServiceManager';

const router = Router();

// Initialize Solana services
let bubblegumService: any = null;

// Initialize services asynchronously
solanaServiceManager.initialize()
  .then(config => {
    bubblegumService = config.bubblegumService;
    console.log('✅ Bubblegum service initialized');
  })
  .catch(error => {
    console.error('❌ Failed to initialize Bubblegum service:', error);
  });

// Rate limiting for bulk mint endpoint
const bulkMintLimiter = expressRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many bulk mint requests, please try again later'
});

// Middleware to check if service is available
const checkServiceAvailability = (req: Request, res: Response, next: any) => {
  if (!bubblegumService) {
    return res.status(503).json({
      success: false,
      error: 'Bubblegum service not available',
      message: 'Service is still initializing. Please try again in a moment.'
    });
  }
  next();
};

/**
 * GET /api/bubblegum/info
 * Get Bubblegum service information
 */
router.get('/info', checkServiceAvailability, (req: Request, res: Response) => {
  try {
    const info = bubblegumService.getServiceInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get service info',
      details: error.message
    });
  }
});

/**
 * POST /api/bubblegum/create-tree
 * Create a new Bubblegum tree for compressed NFTs
 */
router.post('/create-tree', checkServiceAvailability, async (req: Request, res: Response) => {
  try {
    const { maxDepth = 14, maxBufferSize = 64, canopyDepth = 0 } = req.body;
    
    // Validate parameters
    if (typeof maxDepth !== 'number' || maxDepth < 0 || maxDepth > 30) {
      return res.status(400).json({
        success: false,
        error: 'maxDepth must be a number between 0 and 30'
      });
    }

    const options: CreateTreeOptions = {
      maxDepth,
      maxBufferSize: maxBufferSize || 64,
      canopyDepth: canopyDepth || 0
    };

    console.log(`🌳 Creating Bubblegum tree with maxDepth: ${maxDepth}`);

    const result = await bubblegumService.createTree(options);
    
    res.json({
      success: true,
      data: {
        treeAddress: result.treeAddress.toString(),
        signature: result.signature,
        capacity: Math.pow(2, maxDepth),
        maxDepth,
        maxBufferSize
      }
    });
  } catch (error: any) {
    console.error('❌ Error creating Bubblegum tree:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Bubblegum tree',
      details: error.message
    });
  }
});

/**
 * POST /api/bubblegum/mint
 * Create a single compressed NFT
 */
router.post('/mint', checkServiceAvailability, async (req: Request, res: Response) => {
  try {
    const { treeAddress, metadata, owner, collectionMint } = req.body;
    
    // Validate required fields
    if (!treeAddress || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: treeAddress, metadata'
      });
    }

    // Validate metadata
    if (!metadata.name || !metadata.description || !metadata.image) {
      return res.status(400).json({
        success: false,
        error: 'Metadata must include: name, description, image'
      });
    }

    const options: MintCompressedNFTOptions = {
      treeAddress: new PublicKey(treeAddress),
      metadata: metadata as CompressedNFTMetadata,
      owner: owner ? new PublicKey(owner) : undefined,
      collectionMint: collectionMint ? new PublicKey(collectionMint) : undefined
    };

    console.log(`🎨 Minting compressed NFT: ${metadata.name}`);

    const result = await bubblegumService.createCompressedNFT(options);
    
    res.json({
      success: true,
      data: {
        assetId: result.assetId.toString(),
        signature: result.signature,
        metadata: metadata
      }
    });
  } catch (error: any) {
    console.error('❌ Error minting compressed NFT:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint compressed NFT',
      details: error.message
    });
  }
});

/**
 * POST /api/bubblegum/bulk-mint
 * Bulk mint multiple compressed NFTs
 * Rate limited to prevent abuse
 */
router.post('/bulk-mint', bulkMintLimiter, async (req: Request, res: Response) => {
  try {
    const { treeAddress, metadatas, owner, batchSize } = req.body;
    
    // Validate required fields
    if (!treeAddress || !metadatas || !Array.isArray(metadatas)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: treeAddress, metadatas (array)'
      });
    }

    // Limit bulk mint size
    if (metadatas.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Bulk mint limit is 10,000 NFTs per request'
      });
    }

    const options: BulkMintOptions = {
      treeAddress: new PublicKey(treeAddress),
      metadatas: metadatas as CompressedNFTMetadata[],
      owner: owner ? new PublicKey(owner) : undefined,
      batchSize: batchSize || 50
    };

    console.log(`🎨 Bulk minting ${metadatas.length} compressed NFTs`);

    const result = await bubblegumService.bulkMintCompressedNFTs(options);
    
    res.json({
      success: true,
      data: {
        minted: result.minted,
        total: metadatas.length,
        signatures: result.signatures,
        totalCost: result.totalCost,
        averageCostPerNFT: result.minted > 0 ? result.totalCost / result.minted : 0
      }
    });
  } catch (error: any) {
    console.error('❌ Error bulk minting compressed NFTs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk mint compressed NFTs',
      details: error.message
    });
  }
});

/**
 * GET /api/bubblegum/merkle-proof
 * Get Merkle proof for a compressed NFT
 */
router.get('/merkle-proof', async (req: Request, res: Response) => {
  try {
    const { treeAddress, leafIndex } = req.query;
    
    // Validate required fields
    if (!treeAddress || leafIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: treeAddress, leafIndex'
      });
    }

    const proof = await bubblegumService.getMerkleProof(
      new PublicKey(treeAddress as string),
      parseInt(leafIndex as string)
    );
    
    res.json({
      success: true,
      data: {
        treeAddress: treeAddress,
        leafIndex: parseInt(leafIndex as string),
        proof: proof
      }
    });
  } catch (error: any) {
    console.error('❌ Error getting Merkle proof:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Merkle proof',
      details: error.message
    });
  }
});

/**
 * POST /api/bubblegum/verify-proof
 * Verify a Merkle proof
 */
router.post('/verify-proof', async (req: Request, res: Response) => {
  try {
    const { treeAddress, leafIndex, proof } = req.body;
    
    // Validate required fields
    if (!treeAddress || leafIndex === undefined || !proof || !Array.isArray(proof)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: treeAddress, leafIndex, proof (array)'
      });
    }

    const isValid = await bubblegumService.verifyMerkleProof(
      new PublicKey(treeAddress),
      leafIndex,
      proof
    );
    
    res.json({
      success: true,
      data: {
        valid: isValid,
        treeAddress: treeAddress,
        leafIndex: leafIndex
      }
    });
  } catch (error: any) {
    console.error('❌ Error verifying Merkle proof:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify Merkle proof',
      details: error.message
    });
  }
});

export default router;
