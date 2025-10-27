/**
 * 🏗️ Collection Verification API Routes
 * Handles collection creation, verification, and management for compressed NFTs
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { CollectionVerificationService, CollectionMetadata, CollectionVerificationRequest } from '../services/collectionVerificationService';
import { validateRequest } from '../middleware/validation';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Initialize Collection Verification Service
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');
const collectionService = new CollectionVerificationService(connection, process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

// Set up signer if available
if (process.env.BUBBLEGUM_PRIVATE_KEY) {
  const { Keypair } = require('@solana/web3.js');
  const bs58 = require('bs58');
  const keypair = Keypair.fromSecretKey(
    bs58.decode(process.env.BUBBLEGUM_PRIVATE_KEY)
  );
  collectionService.setSigner(keypair);
}

// Rate limiting
const createCollectionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 collections per 15 minutes
  message: { success: false, error: 'Too many collection creation attempts' }
});

const verifyCollectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 verifications per minute
  message: { success: false, error: 'Too many verification attempts' }
});

const updateCollectionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 updates per 15 minutes
  message: { success: false, error: 'Too many collection update attempts' }
});

// Validation schemas
const collectionMetadataSchema = {
  type: 'object',
  required: ['name', 'symbol', 'description', 'image'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    symbol: { type: 'string', minLength: 1, maxLength: 10 },
    description: { type: 'string', minLength: 1, maxLength: 1000 },
    image: { type: 'string', format: 'uri' },
    externalUrl: { type: 'string', format: 'uri' },
    attributes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['trait_type', 'value'],
        properties: {
          trait_type: { type: 'string' },
          value: { type: 'string' }
        }
      }
    },
    properties: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            required: ['uri', 'type'],
            properties: {
              uri: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        category: { type: 'string' }
      }
    }
  }
};

const collectionVerificationSchema = {
  type: 'object',
  required: ['collectionMint', 'collectionAuthority', 'treeAddress', 'leafIndex', 'assetId'],
  properties: {
    collectionMint: { type: 'string', minLength: 32, maxLength: 44 },
    collectionAuthority: { type: 'string', minLength: 32, maxLength: 44 },
    treeAddress: { type: 'string', minLength: 32, maxLength: 44 },
    leafIndex: { type: 'number', minimum: 0 },
    assetId: { type: 'string', minLength: 1 }
  }
};

// Routes

/**
 * GET /api/collection-verification/info
 * Get collection verification service information
 */
router.get('/info', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        service: 'Collection Verification Service',
        version: '1.0.0',
        description: 'Collection creation, verification, and management for compressed NFTs',
        features: [
          'Collection Creation',
          'Collection Verification',
          'Collection Metadata Management',
          'Batch Verification',
          'Collection Statistics',
          'Verification Status Tracking'
        ],
        endpoints: [
          'POST /create-collection',
          'POST /verify-collection',
          'GET /collection/:mint',
          'GET /collections/:authority',
          'PUT /collection/:mint/metadata',
          'POST /verify-collection-batch',
          'GET /collection/:mint/stats',
          'GET /verification-status/:mint/:assetId'
        ],
        status: 'operational'
      }
    });
  } catch (error: any) {
    console.error('❌ Error getting collection verification info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collection verification info'
    });
  }
});

/**
 * POST /api/collection-verification/create-collection
 * Create a new collection for compressed NFTs
 */
router.post('/create-collection', createCollectionLimiter, validateRequest(collectionMetadataSchema), (req, res) => {
  (async () => {
    try {
      const metadata: CollectionMetadata = req.body;
      const { collectionAuthority } = req.query;

      console.log('🏗️ Creating collection for compressed NFTs...');

      const authority = collectionAuthority ? new PublicKey(collectionAuthority as string) : undefined;
      const collectionInfo = await collectionService.createCollection(metadata, authority);

      res.json({
        success: true,
        data: {
          collectionMint: collectionInfo.collectionMint.toString(),
          collectionAuthority: collectionInfo.collectionAuthority.toString(),
          collectionMetadata: collectionInfo.collectionMetadata,
          collectionUri: collectionInfo.collectionUri,
          verified: collectionInfo.verified,
          createdAt: collectionInfo.createdAt,
          updatedAt: collectionInfo.updatedAt
        },
        message: 'Collection created successfully'
      });
    } catch (error: any) {
      console.error('❌ Error creating collection:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create collection'
      });
    }
  })();
});

/**
 * POST /api/collection-verification/verify-collection
 * Verify a compressed NFT belongs to a collection
 */
router.post('/verify-collection', verifyCollectionLimiter, validateRequest(collectionVerificationSchema), (req, res) => {
  (async () => {
    try {
      const request: CollectionVerificationRequest = {
        collectionMint: new PublicKey(req.body.collectionMint),
        collectionAuthority: new PublicKey(req.body.collectionAuthority),
        treeAddress: new PublicKey(req.body.treeAddress),
        leafIndex: req.body.leafIndex,
        assetId: req.body.assetId
      };

      console.log(`🔍 Verifying collection for asset ${request.assetId}...`);

      const result = await collectionService.verifyCollection(request);

      res.json({
        success: result.success,
        data: {
          verified: result.verified,
          signature: result.signature,
          assetId: result.assetId,
          collectionMint: result.collectionMint.toString()
        },
        message: result.success ? 'Collection verified successfully' : 'Collection verification failed',
        error: result.error
      });
    } catch (error: any) {
      console.error('❌ Error verifying collection:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to verify collection'
      });
    }
  })();
});

/**
 * GET /api/collection-verification/collection/:mint
 * Get collection information
 */
router.get('/collection/:mint', (req, res) => {
  (async () => {
    try {
      const { mint } = req.params;
      const collectionMint = new PublicKey(mint);

      console.log(`🔍 Getting collection info for ${mint}...`);

      const collectionInfo = await collectionService.getCollectionInfo(collectionMint);

      if (!collectionInfo) {
        return res.status(404).json({
          success: false,
          error: 'Collection not found'
        });
      }

      res.json({
        success: true,
        data: {
          collectionMint: collectionInfo.collectionMint.toString(),
          collectionAuthority: collectionInfo.collectionAuthority.toString(),
          collectionMetadata: collectionInfo.collectionMetadata,
          collectionUri: collectionInfo.collectionUri,
          verified: collectionInfo.verified,
          createdAt: collectionInfo.createdAt,
          updatedAt: collectionInfo.updatedAt
        }
      });
    } catch (error: any) {
      console.error('❌ Error getting collection info:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get collection info'
      });
    }
  })();
});

/**
 * GET /api/collection-verification/collections/:authority
 * List collections created by an authority
 */
router.get('/collections/:authority', (req, res) => {
  (async () => {
    try {
      const { authority } = req.params;
      const authorityPubkey = new PublicKey(authority);

      console.log(`🔍 Listing collections for authority ${authority}...`);

      const collections = await collectionService.listCollections(authorityPubkey);

      res.json({
        success: true,
        data: {
          collections: collections.map(collection => ({
            collectionMint: collection.collectionMint.toString(),
            collectionAuthority: collection.collectionAuthority.toString(),
            collectionMetadata: collection.collectionMetadata,
            collectionUri: collection.collectionUri,
            verified: collection.verified,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt
          })),
          count: collections.length
        }
      });
    } catch (error: any) {
      console.error('❌ Error listing collections:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list collections'
      });
    }
  })();
});

/**
 * PUT /api/collection-verification/collection/:mint/metadata
 * Update collection metadata
 */
router.put('/collection/:mint/metadata', updateCollectionLimiter, validateRequest(collectionMetadataSchema), (req, res) => {
  (async () => {
    try {
      const { mint } = req.params;
      const collectionMint = new PublicKey(mint);
      const metadata: CollectionMetadata = req.body;

      console.log(`🔄 Updating collection metadata for ${mint}...`);

      const collectionInfo = await collectionService.updateCollectionMetadata(collectionMint, metadata);

      res.json({
        success: true,
        data: {
          collectionMint: collectionInfo.collectionMint.toString(),
          collectionAuthority: collectionInfo.collectionAuthority.toString(),
          collectionMetadata: collectionInfo.collectionMetadata,
          collectionUri: collectionInfo.collectionUri,
          verified: collectionInfo.verified,
          createdAt: collectionInfo.createdAt,
          updatedAt: collectionInfo.updatedAt
        },
        message: 'Collection metadata updated successfully'
      });
    } catch (error: any) {
      console.error('❌ Error updating collection metadata:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update collection metadata'
      });
    }
  })();
});

/**
 * POST /api/collection-verification/verify-collection-batch
 * Verify multiple assets belong to a collection
 */
router.post('/verify-collection-batch', verifyCollectionLimiter, (req, res) => {
  (async () => {
    try {
      const { requests } = req.body;

      if (!Array.isArray(requests)) {
        return res.status(400).json({
          success: false,
          error: 'Requests must be an array'
        });
      }

      console.log(`🔍 Verifying ${requests.length} assets for collection...`);

      const verificationRequests: CollectionVerificationRequest[] = requests.map((req: any) => ({
        collectionMint: new PublicKey(req.collectionMint),
        collectionAuthority: new PublicKey(req.collectionAuthority),
        treeAddress: new PublicKey(req.treeAddress),
        leafIndex: req.leafIndex,
        assetId: req.assetId
      }));

      const results = await collectionService.verifyCollectionBatch(verificationRequests);

      res.json({
        success: true,
        data: {
          results: results.map(result => ({
            success: result.success,
            verified: result.verified,
            signature: result.signature,
            assetId: result.assetId,
            collectionMint: result.collectionMint.toString(),
            error: result.error
          })),
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        },
        message: `Batch verification completed: ${results.filter(r => r.success).length}/${results.length} successful`
      });
    } catch (error: any) {
      console.error('❌ Error verifying collection batch:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to verify collection batch'
      });
    }
  })();
});

/**
 * GET /api/collection-verification/collection/:mint/stats
 * Get collection statistics
 */
router.get('/collection/:mint/stats', (req, res) => {
  (async () => {
    try {
      const { mint } = req.params;
      const collectionMint = new PublicKey(mint);

      console.log(`📊 Getting collection stats for ${mint}...`);

      const stats = await collectionService.getCollectionStats(collectionMint);

      res.json({
        success: true,
        data: {
          collectionMint: mint,
          totalAssets: stats.totalAssets,
          verifiedAssets: stats.verifiedAssets,
          unverifiedAssets: stats.unverifiedAssets,
          verificationRate: stats.verificationRate
        }
      });
    } catch (error: any) {
      console.error('❌ Error getting collection stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get collection stats'
      });
    }
  })();
});

/**
 * GET /api/collection-verification/verification-status/:mint/:assetId
 * Get collection verification status for a specific asset
 */
router.get('/verification-status/:mint/:assetId', (req, res) => {
  (async () => {
    try {
      const { mint, assetId } = req.params;
      const collectionMint = new PublicKey(mint);

      console.log(`🔍 Getting verification status for asset ${assetId}...`);

      const status = await collectionService.getCollectionVerificationStatus(collectionMint, assetId);

      res.json({
        success: true,
        data: {
          verified: status.verified,
          collectionMint: status.collectionMint.toString(),
          assetId: status.assetId,
          verifiedAt: status.verifiedAt
        }
      });
    } catch (error: any) {
      console.error('❌ Error getting verification status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get verification status'
      });
    }
  })();
});

export default router;
