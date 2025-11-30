/**
 * 🎬 Eternal Echoes API Routes
 * Internet Archive + Grok Verification + cNFT Evolution
 *
 * @module routes/echo
 * @creator NFTSol Team
 * @license MIT
 * @description Eternal Echoes is an NFTSol original feature enabling collaborative,
 *              layered NFT creation from public domain video archives with AI verification.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PublicKey } from '@solana/web3.js';
import axios from 'axios';
import {
  grokVerify,
  generateTruthHash,
  reverifyLedger,
  batchGrokVerify,
  getVerificationTeaser,
} from '../utils/grokpedia';
import { uploadMetadataToIrys } from '../utils/irysUpload';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { solanaConfig } from '../config';
import expressRateLimit from 'express-rate-limit';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('echo');
// Optional service (not required for dev/in-memory mode). Avoid importing to reduce build surface.

const router = Router();

// In-memory echo store for development
type EchoRow = {
  id: string;
  ledgerId: string;
  echoData: string;
  echoType: 'Text' | 'Audio' | 'Annotation' | 'Video';
  videoUri?: string; // For video echoes
  dataHash: number[];
  contributor: string;
  grokVerified: boolean;
  verificationScore: number;
  timestamp: Date;
};

const echoStore: Map<string, EchoRow[]> = new Map();

// Initialize service (optional)
let echoService: any = null;

// ============================================================================
// Rate Limiting
// ============================================================================

const searchLimiter = expressRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many search requests, please try again later',
});

const mintLimiter = expressRateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many mint requests, please try again later',
});

const echoLimiter = expressRateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many echo requests, please try again later',
});

// ============================================================================
// Validation Schemas
// ============================================================================

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  rows: z.coerce.number().min(1).max(100).optional().default(20),
});

const mintSchema = z.object({
  iaId: z.string().min(1).max(64),
  walletAddress: z.string().refine((val) => {
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid wallet address'),
});

const addEchoSchema = z.object({
  ledgerId: z.string().min(1),
  echoData: z.string().min(1).max(5000),
  echoType: z.enum(['Text', 'Audio', 'Annotation', 'Video']),
  videoUri: z.string().url().optional(), // For video echoes
  contributorWallet: z.string().refine((val) => {
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  }),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/echo/search
 * Search Internet Archive for public domain videos
 */
router.get('/search', searchLimiter, async (req: Request, res: Response) => {
  try {
    const { q, rows } = searchSchema.parse(req.query);

    // Query Internet Archive Advanced Search API
    const iaResponse = await axios.get('https://archive.org/advancedsearch.php', {
      params: {
        q: `${q} AND mediatype:movies AND format:mp4`,
        fl: 'identifier,title,description,year,creator,downloads,item_size',
        sort: 'downloads desc',
        rows,
        output: 'json',
        filter: 'publicdomain', // Only public domain content
      },
      timeout: 10000,
    });

    const docs = iaResponse.data.response?.docs || [];

    // Batch verify descriptions for teasers
    const itemsToVerify = docs
      .filter((doc: any) => doc.description)
      .map((doc: any) => ({
        id: doc.identifier,
        content: doc.description,
      }));

    const verifications = await batchGrokVerify(itemsToVerify);

    // Format results with thumbnails and verification teasers
    const results = docs.map((doc: any) => {
      const verification = verifications.get(doc.identifier);

      return {
        identifier: doc.identifier,
        title: doc.title || 'Untitled',
        description: doc.description,
        year: doc.year,
        creator: doc.creator,
        downloads: doc.downloads,
        thumbnail: `https://archive.org/services/img/${doc.identifier}`,
        verificationTeaser: verification ? getVerificationTeaser(verification.score) : null,
        truthScore: verification?.score,
      };
    });

    res.json({
      success: true,
      results,
      total: iaResponse.data.response?.numFound || 0,
    });
  } catch (error: any) {
    log.error('IA Search Error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
        details: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to search Internet Archive',
      message: error.message,
    });
  }
});

/**
 * POST /api/echo/mint
 * Prepare data for minting an Echo NFT
 */
router.post('/mint', mintLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = mintSchema.parse(req.body);
    const iaId = parsed.iaId;

    // Fetch full metadata from Internet Archive
    const metadataUrl = `https://archive.org/metadata/${iaId}`;
    const metadataResponse = await axios.get(metadataUrl, { timeout: 10000 });
    const metadata = metadataResponse.data;

    if (!metadata || !metadata.files) {
      return res.status(404).json({
        success: false,
        error: 'Item not found on Internet Archive',
      });
    }

    // Find MP4 video file
    const mp4File = metadata.files.find(
      (f: any) => f.name.endsWith('.mp4') && !f.name.includes('thumbs')
    );

    if (!mp4File) {
      return res.status(400).json({
        success: false,
        error: 'No video file found for this item',
      });
    }

    const videoUri = `https://archive.org/download/${iaId}/${mp4File.name}`;
    const thumbnailUri = `https://archive.org/services/img/${iaId}`;

    // Grok verify the content
    const description = metadata.metadata?.description || metadata.metadata?.title || '';
    const verificationResult = await grokVerify(description);
    const truthHash = generateTruthHash(verificationResult.summary);

    // Generate response
    const response = {
      success: true,
      iaId,
      title: metadata.metadata?.title || 'Untitled',
      description: metadata.metadata?.description,
      creator: metadata.metadata?.creator,
      year: metadata.metadata?.year,
      videoUri,
      thumbnailUri,
      grokTruthHash: Array.from(truthHash),
      truthScore: verificationResult.score,
      teaser: getVerificationTeaser(verificationResult.score),
      summary: verificationResult.summary,
      verified: verificationResult.verified,
      // Client will use this data to call the Anchor program
      ledgerPda: null, // Computed client-side
    };

    res.json(response);
  } catch (error: any) {
    log.error('Mint Preparation Error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mint parameters',
        details: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to prepare mint data',
      message: error.message,
    });
  }
});

/**
 * GET /api/echo/:ledgerId
 * Get echo ledger details and all echoes
 */
router.get('/:ledgerId', echoLimiter, async (req: Request, res: Response) => {
  try {
    const { ledgerId } = req.params;

    const echoes = (echoStore.get(ledgerId) || []).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    res.json({
      success: true,
      ledgerId,
      echoes,
      count: echoes.length,
    });
  } catch (error: any) {
    log.error('Fetch Echoes Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch echoes',
      message: error.message,
    });
  }
});

/**
 * POST /api/echo/add
 * Add a new echo to a ledger
 */
router.post('/add', echoLimiter, async (req: Request, res: Response) => {
  try {
    const { ledgerId, echoData, echoType, contributorWallet, videoUri } = addEchoSchema.parse(req.body);

    // Verify the echo content
    const verification = await grokVerify(echoData);
    const verified = verification.verified;

    const insertedEcho: EchoRow = {
      id: `${ledgerId}:${Date.now()}`,
      ledgerId,
      echoData,
      echoType,
      videoUri: echoType === 'Video' ? videoUri : undefined,
      dataHash: Array.from(generateTruthHash(echoData)),
      contributor: contributorWallet,
      grokVerified: verified,
      verificationScore: verification.score,
      timestamp: new Date(),
    };
    const list = echoStore.get(ledgerId) || [];
    list.push(insertedEcho);
    echoStore.set(ledgerId, list);

    // Real-time emit (optional, Socket.IO not initialized in minimal setup)
    // No-op for now. Hook up Socket.IO here if enabled.

    // Award CLOUT for verified echoes
    if (echoService) {
      await echoService.awardEchoClout(contributorWallet, verified, verification.score);
    }

    res.json({
      success: true,
      echoId: insertedEcho.id,
      verified,
      verificationScore: verification.score,
      message: verified
        ? '✨ Echo added and verified! CLOUT boost applied.'
        : '⚠️ Echo added but not verified.',
    });
  } catch (error: any) {
    log.error('Add Echo Error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid echo parameters',
        details: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add echo',
      message: error.message,
    });
  }
});

/**
 * POST /api/echo/remix
 * Create a remix (layered video) from an existing Echo
 */
const remixSchema = z.object({
  parentLedgerId: z.string().min(1),
  remixMetadata: z.object({
    layers: z.array(
      z.object({
        videoUri: z.string().url(),
        startTime: z.number().min(0),
        endTime: z.number().min(0),
        opacity: z.number().min(0).max(1),
        position: z.enum(['top', 'bottom', 'left', 'right', 'center']),
        scale: z.number().min(0.5).max(2),
        textOverlay: z
          .object({
            text: z.string(),
            position: z.enum(['top', 'bottom', 'center']),
            fontSize: z.number(),
            color: z.string(),
          })
          .optional(),
      })
    ),
    createdAt: z.string(),
    creator: z.string(),
  }),
  creatorWallet: z.string().refine((val) => {
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  }),
});

router.post('/remix', echoLimiter, async (req: Request, res: Response) => {
  try {
    const { parentLedgerId, remixMetadata, creatorWallet } = remixSchema.parse(req.body);

    // Verify parent ledger exists
    const parentEchoes = echoStore.get(parentLedgerId);
    if (!parentEchoes || parentEchoes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Parent Echo ledger not found',
      });
    }

    // Get base video URI from parent
    const baseVideo = parentEchoes.find((e) => e.echoType === 'Video' || e.videoUri);
    if (!baseVideo?.videoUri && remixMetadata.layers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No base video found in parent Echo',
      });
    }

    // Create new ledger ID for remix
    const remixLedgerId = `remix-${parentLedgerId}-${Date.now()}`;

    // Upload remix metadata to Irys
    const connection = new Connection(solanaConfig.rpcUrl, solanaConfig.commitment);
    const platformSecretKey = process.env.PLATFORM_SECRET_KEY_BASE58;
    if (!platformSecretKey) {
      throw new Error('PLATFORM_SECRET_KEY_BASE58 not configured');
    }
    const secretKeyBytes = bs58.decode(platformSecretKey);
    const keypair = Keypair.fromSecretKey(secretKeyBytes);

    const metadataResult = await uploadMetadataToIrys(
      {
        name: `Echo Remix #${Date.now()}`,
        symbol: 'ECHO',
        description: 'Layered video remix of Eternal Echo',
        animation_url: remixMetadata.layers[0]?.videoUri || baseVideo?.videoUri,
        attributes: [
          { trait_type: 'Type', value: 'Remix' },
          { trait_type: 'Parent Ledger', value: parentLedgerId },
          { trait_type: 'Layers', value: remixMetadata.layers.length.toString() },
        ],
        properties: {
          remix: {
            parentLedgerId,
            layers: remixMetadata.layers,
            createdAt: remixMetadata.createdAt,
            creator: remixMetadata.creator,
          },
        },
      },
      {
        connection,
        keypair,
        network: solanaConfig.cluster as 'mainnet-beta' | 'devnet',
      }
    );

    // Create initial remix echo entry
    const remixEcho: EchoRow = {
      id: `${remixLedgerId}:${Date.now()}`,
      ledgerId: remixLedgerId,
      echoData: `Remix of ${parentLedgerId} with ${remixMetadata.layers.length} layers`,
      echoType: 'Video',
      videoUri: remixMetadata.layers[0]?.videoUri || baseVideo?.videoUri,
      dataHash: Array.from(generateTruthHash(remixLedgerId)),
      contributor: creatorWallet,
      grokVerified: true, // Remix metadata is considered verified
      verificationScore: 85, // High score for remixes
      timestamp: new Date(),
    };

    // Store remix
    echoStore.set(remixLedgerId, [remixEcho]);

    res.json({
      success: true,
      ledgerId: remixLedgerId,
      metadataUri: metadataResult.uri,
      message: 'Remix created successfully',
    });
  } catch (error: any) {
    log.error('[Echo] Remix creation error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid remix parameters',
        details: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create remix',
      message: error.message,
    });
  }
});

/**
 * POST /api/echo/verify
 * Re-verify an entire echo ledger (hybrid verification)
 */
router.post('/verify', echoLimiter, async (req: Request, res: Response) => {
  try {
    const { ledgerId } = z.object({ ledgerId: z.string() }).parse(req.body);

    // Fetch all echoes for this ledger
    const echoes = (echoStore.get(ledgerId) || []).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    if (echoes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No echoes found for this ledger',
      });
    }

    // Get original content (would need to fetch from IA or cache)
    const originalContent = echoes[0]?.echoData || '';

    // Re-verify
    const echoData = echoes.map((e: EchoRow) => ({
      content: e.echoData,
      verified: e.grokVerified,
    }));

    const verification = await reverifyLedger(originalContent, echoData);

    res.json({
      success: true,
      ledgerId,
      newTruthScore: verification.score,
      verified: verification.verified,
      summary: verification.summary,
      echoCount: echoes.length,
    });
  } catch (error: any) {
    log.error('Reverify Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reverify ledger',
      message: error.message,
    });
  }
});

/**
 * GET /api/echo/stats
 * Get overall Echo platform statistics
 */
router.get('/stats', echoLimiter, async (req: Request, res: Response) => {
  try {
    // Calculate stats from in-memory store
    const allEchoes: EchoRow[] = Array.from(echoStore.values()).flat();
    const totalLayers = allEchoes.length;
    const totalLedgers = echoStore.size;

    // Calculate average truth score
    let avgTruthScore = 0;
    if (totalLayers > 0) {
      const totalScore = allEchoes.reduce((sum, echo) => sum + echo.verificationScore, 0);
      avgTruthScore = Math.round(totalScore / totalLayers);
    }

    // Get trending count (limit to top 10 for consistency)
    const trendingLimit = 10;
    const trendingEchoes = allEchoes
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, trendingLimit);
    const trendingCount = trendingEchoes.length;

    res.json({
      success: true,
      totalLayers,
      totalLedgers,
      avgTruthScore,
      trendingCount,
    });
  } catch (error: any) {
    log.error('Get Echo stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Echo statistics',
      message: error.message,
    });
  }
});

/**
 * GET /api/echo/trending
 * Get trending Echo NFTs for marketplace
 */
router.get('/trending', echoLimiter, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!echoService) {
      // Fallback if service not initialized: compute trending from in-memory store
      const allEchoes: EchoRow[] = Array.from(echoStore.values()).flat();
      const sorted = allEchoes
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
      return res.json({ success: true, echoes: sorted });
    }

    const trending = await echoService.getTrendingEchoes(limit);

    res.json({
      success: true,
      echoes: trending,
    });
  } catch (error: any) {
    log.error('Get trending echoes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending echoes',
    });
  }
});

/**
 * GET /api/echo/stats
 * Get overall Echo platform statistics
 */
router.get('/stats', echoLimiter, async (req: Request, res: Response) => {
  try {
    // Calculate stats from in-memory store
    const allEchoes: EchoRow[] = Array.from(echoStore.values()).flat();
    const totalLayers = allEchoes.length;
    const totalLedgers = echoStore.size;
    
    const verifiedCount = allEchoes.filter(e => e.grokVerified).length;
    const avgScore = allEchoes.length > 0
      ? allEchoes.reduce((sum, e) => sum + e.verificationScore, 0) / allEchoes.length
      : 0;

    res.json({
      success: true,
      data: {
        totalLayers,
        totalLedgers,
        verifiedCount,
        avgVerificationScore: Math.round(avgScore * 100) / 100,
        platformStats: {
          totalEchoes: totalLedgers,
          totalContributions: totalLayers,
          verificationRate: totalLayers > 0 ? (verifiedCount / totalLayers) * 100 : 0,
        },
      },
    });
  } catch (error) {
    log.error('Get echo stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    });
  }
});

/**
 * GET /api/echo/:id
 * Get specific Echo NFT by ID (must be after /stats route)
 */
router.get('/:id', echoLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Echo ID is required',
      });
    }

    // Search in-memory store
    let foundEcho: EchoRow | null = null;
    for (const echoes of echoStore.values()) {
      const echo = echoes.find(e => e.id === id || e.ledgerId === id);
      if (echo) {
        foundEcho = echo;
        break;
      }
    }

    if (!foundEcho) {
      // Try database if available
      if (echoService) {
        try {
          const dbEcho = await echoService.getEchoById(id);
          if (dbEcho) {
            return res.json({
              success: true,
              data: dbEcho,
            });
          }
        } catch (e) {
          // Database query failed, continue to 404
        }
      }

      return res.status(404).json({
        success: false,
        error: 'Echo not found',
      });
    }

    // Get all layers for this ledger
    const ledgerEchoes = echoStore.get(foundEcho.ledgerId) || [];
    
    res.json({
      success: true,
      data: {
        id: foundEcho.id,
        ledgerId: foundEcho.ledgerId,
        echoData: foundEcho.echoData,
        echoType: foundEcho.echoType,
        dataHash: foundEcho.dataHash,
        contributor: foundEcho.contributor,
        grokVerified: foundEcho.grokVerified,
        verificationScore: foundEcho.verificationScore,
        timestamp: foundEcho.timestamp,
        totalLayers: ledgerEchoes.length,
        allLayers: ledgerEchoes.map(e => ({
          id: e.id,
          echoType: e.echoType,
          contributor: e.contributor,
          grokVerified: e.grokVerified,
          verificationScore: e.verificationScore,
        })),
      },
    });
  } catch (error) {
    log.error('[Echo] Get by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Echo',
    });
  }
});

/**
 * GET /api/echo/stats/:wallet
 * Get user's Echo NFT statistics
 */
router.get('/stats/:wallet', echoLimiter, async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;

    if (!echoService) {
      return res.json({
        success: true,
        totalEchosMinted: 0,
        totalEchosContributed: 0,
        avgTruthScore: 0,
        totalCloutEarned: 0,
      });
    }

    const stats = await echoService.getUserEchoStats(wallet);

    res.json({
      success: true,
      ...stats,
    });
  } catch (error: any) {
    log.error('Get echo stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    });
  }
});

// Export service setter for initialization
export function setEchoService(service: any) {
  echoService = service;
}

export default router;
