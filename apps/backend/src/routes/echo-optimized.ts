/**
 * 🎬 Eternal Echoes API Routes - OPTIMIZED VERSION
 * FREE Grok + Redis caching + Irys uploads
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PublicKey } from '@solana/web3.js';
import axios from 'axios';
import crypto from 'crypto';
import {
  grokVerify,
  generateTruthHash,
  getVerificationTeaser,
  batchGrokVerify,
} from '../utils/grokpedia-free';
import expressRateLimit from 'express-rate-limit';

const router = Router();

// ============================================================================
// Rate Limiting
// ============================================================================

const searchLimiter = expressRateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many search requests',
});

const mintLimiter = expressRateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many mint requests',
});

// ============================================================================
// Validation Schemas
// ============================================================================

const searchSchema = z.object({
  q: z.string().default(''),
  rows: z.coerce.number().min(1).max(50).default(20),
});

const mintSchema = z.object({
  iaId: z.string().min(1).max(64),
});

// ============================================================================
// Helper: Build Internet Archive Search URL
// ============================================================================

function buildIaSearchUrl(userQuery: string, rows: number): string {
  // Base query for public domain movies only
  const baseQuery = 'mediatype:movies AND licenseurl:*publicdomain*';

  // Add user query if provided
  const fullQuery = userQuery
    ? `${baseQuery} AND (title:(${userQuery}) OR description:(${userQuery}))`
    : baseQuery;

  const url = new URL('https://archive.org/advancedsearch.php');
  url.searchParams.append('q', fullQuery);
  url.searchParams.append('rows', rows.toString());
  url.searchParams.append('output', 'json');
  url.searchParams.append('sort[]', 'downloads desc');

  // Fields to retrieve
  const fields = [
    'identifier',
    'title',
    'creator',
    'description',
    'date',
    'licenseurl',
    'mediatype',
  ];
  fields.forEach((f) => url.searchParams.append('fl[]', f));

  return url.toString();
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/echo/search
 * Search Internet Archive with FREE Grok verification teasers
 */
router.get('/search', searchLimiter, async (req: Request, res: Response) => {
  try {
    const { q, rows } = searchSchema.parse(req.query);

    // Build and execute search
    const searchUrl = buildIaSearchUrl(q, rows);
    const { data } = await axios.get(searchUrl, { timeout: 8000 });

    const docs = data.response?.docs || [];

    // Enrich with Grok verification teasers (in parallel)
    const enriched = await Promise.all(
      docs.map(async (doc: any) => {
        const input = `${doc.title || ''} ${doc.description || ''}`.trim();

        if (!input) {
          return {
            ...doc,
            thumbnail: `https://archive.org/services/img/${doc.identifier}`,
            grokTeaser: null,
            grokScore: 0,
          };
        }

        // Get verification teaser
        const verification = await grokVerify(input);

        return {
          ...doc,
          thumbnail: `https://archive.org/services/img/${doc.identifier}`,
          grokTeaser: getVerificationTeaser(verification.score),
          grokScore: verification.score,
        };
      })
    );

    res.json({
      success: true,
      numFound: data.response?.numFound || 0,
      docs: enriched,
    });
  } catch (error: any) {
    console.error('Search error:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Search failed',
    });
  }
});

/**
 * POST /api/echo/mint
 * Prepare mint data with FREE Grok verification + Irys upload
 */
router.post('/mint', mintLimiter, async (req: Request, res: Response) => {
  try {
    const { iaId } = mintSchema.parse(req.body);

    // Fetch Internet Archive metadata
    const metadataUrl = `https://archive.org/metadata/${iaId}`;
    const { data: meta } = await axios.get(metadataUrl, { timeout: 8000 });

    if (!meta || !meta.files) {
      return res.status(404).json({
        success: false,
        error: 'Item not found on Internet Archive',
      });
    }

    // Extract metadata
    const title = meta.metadata?.title || 'Untitled';
    const description = meta.metadata?.description || '';
    const creator = meta.metadata?.creator || '';
    const licenseUrl = meta.metadata?.licenseurl || '';

    // Verify public domain
    if (!licenseUrl.includes('publicdomain') && !licenseUrl.includes('cc0')) {
      return res.status(400).json({
        success: false,
        error: 'Not public domain - must have CC0 or public domain license',
      });
    }

    // Find MP4 video file
    const files: any[] = Object.values(meta.files || {});
    const mp4File = files.find(
      (f: any) => f.format === 'MPEG4' && f.name?.endsWith('.mp4') && !f.name.includes('_thumbs')
    );

    if (!mp4File) {
      return res.status(400).json({
        success: false,
        error: 'No MP4 video file found',
      });
    }

    const videoUri = `https://archive.org/download/${iaId}/${mp4File.name}`;
    const thumbnailUri = `https://archive.org/services/img/${iaId}`;

    // FREE Grok verification
    const contentToVerify = `${title} ${description} ${creator}`.trim();
    const verification = await grokVerify(contentToVerify);
    const truthHash = generateTruthHash(verification.summary);

    // Create metadata for NFT
    const nftMetadata = {
      name: `Eternal Echo: ${title}`,
      symbol: 'ECHO',
      description: `Internet Archive: ${iaId}\nTruth Score: ${verification.score}%\n\n${description}`,
      external_url: `https://archive.org/details/${iaId}`,
      image: thumbnailUri,
      animation_url: videoUri,
      attributes: [
        { trait_type: 'IA ID', value: iaId },
        { trait_type: 'Truth Score', value: verification.score },
        { trait_type: 'Verified', value: verification.verified ? 'Yes' : 'No' },
        { trait_type: 'Creator', value: creator || 'Unknown' },
      ],
    };

    // TODO: Upload to Irys (optional - can be done client-side too)
    // const irysUri = await uploadToIrys(nftMetadata);

    res.json({
      success: true,
      iaId,
      title,
      description,
      creator,
      videoUri,
      thumbnailUri,
      grokTruthHash: Array.from(truthHash),
      truthScore: verification.score,
      teaser: getVerificationTeaser(verification.score),
      summary: verification.summary,
      verified: verification.verified,
      sources: verification.sources,
      metadata: nftMetadata,
      // irysUri, // Uncomment when Irys integration added
    });
  } catch (error: any) {
    console.error('Mint preparation error:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mint parameters',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Mint preparation failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/echo/verify
 * Verify content with FREE Grok
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { content } = z.object({ content: z.string() }).parse(req.body);

    const verification = await grokVerify(content);

    res.json({
      success: true,
      ...verification,
      teaser: getVerificationTeaser(verification.score),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
