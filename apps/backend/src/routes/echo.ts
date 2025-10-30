/**
 * 🎬 Eternal Echoes API Routes
 * Internet Archive + Grok Verification + cNFT Evolution
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { grokVerify, generateTruthHash, reverifyLedger, batchGrokVerify, getVerificationTeaser } from '../utils/grokpedia';
import { db } from '../db';
import { echoTable } from '../schema';
import { eq } from 'drizzle-orm';
import expressRateLimit from 'express-rate-limit';

const router = Router();

// ============================================================================
// Rate Limiting
// ============================================================================

const searchLimiter = expressRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many search requests, please try again later'
});

const mintLimiter = expressRateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many mint requests, please try again later'
});

const echoLimiter = expressRateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many echo requests, please try again later'
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
  walletAddress: z.string().refine(val => {
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
  echoType: z.enum(['Text', 'Audio', 'Annotation']),
  contributorWallet: z.string().refine(val => {
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
        'filter': 'publicdomain', // Only public domain content
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
    console.error('IA Search Error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
        details: error.errors,
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
    const { iaId, walletAddress } = mintSchema.parse(req.body);

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
    const mp4File = metadata.files.find((f: any) => 
      f.name.endsWith('.mp4') && !f.name.includes('thumbs')
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
    console.error('Mint Preparation Error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mint parameters',
        details: error.errors,
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

    // Fetch echoes from database
    const echoes = await db
      .select()
      .from(echoTable)
      .where(eq(echoTable.ledgerId, ledgerId))
      .orderBy(echoTable.timestamp);

    res.json({
      success: true,
      ledgerId,
      echoes,
      count: echoes.length,
    });

  } catch (error: any) {
    console.error('Fetch Echoes Error:', error);
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
    const { ledgerId, echoData, echoType, contributorWallet } = addEchoSchema.parse(req.body);

    // Verify the echo content
    const verification = await grokVerify(echoData);
    const verified = verification.verified;

    // Store echo in database
    const [insertedEcho] = await db
      .insert(echoTable)
      .values({
        ledgerId,
        echoData,
        echoType,
        dataHash: Array.from(generateTruthHash(echoData)),
        contributor: contributorWallet,
        grokVerified: verified,
        verificationScore: verification.score,
        timestamp: new Date(),
      })
      .returning();

    // Emit Socket.io event (if WebSocket service is available)
    // @ts-ignore - WebSocket service may not be typed
    if (global.webSocketService) {
      // @ts-ignore
      global.webSocketService.emitToRoom(`echo-room:${ledgerId}`, 'echoAdded', {
        echoId: insertedEcho.id,
        verified,
        contributor: contributorWallet,
      });
    }

    // TODO: Trigger CLOUT boost for verified echoes
    // if (verified) {
    //   await cloutService.boostUser(contributorWallet, 'echo_verified', 2);
    // }

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
    console.error('Add Echo Error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid echo parameters',
        details: error.errors,
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
 * POST /api/echo/verify
 * Re-verify an entire echo ledger (hybrid verification)
 */
router.post('/verify', echoLimiter, async (req: Request, res: Response) => {
  try {
    const { ledgerId } = z.object({ ledgerId: z.string() }).parse(req.body);

    // Fetch all echoes for this ledger
    const echoes = await db
      .select()
      .from(echoTable)
      .where(eq(echoTable.ledgerId, ledgerId))
      .orderBy(echoTable.timestamp);

    if (echoes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No echoes found for this ledger',
      });
    }

    // Get original content (would need to fetch from IA or cache)
    const originalContent = echoes[0]?.echoData || '';

    // Re-verify
    const echoData = echoes.map(e => ({
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
    console.error('Reverify Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reverify ledger',
      message: error.message,
    });
  }
});

export default router;
