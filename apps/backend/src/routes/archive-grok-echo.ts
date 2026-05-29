/**
 * 🌍 Internet Archive + Grok + Echo Integrated API Routes
 *
 * Revolutionary NFT workflow:
 * 1. Search Internet Archive (all media types)
 * 2. Verify with Grok AI
 * 3. Layer with Echo features
 * 4. Mint with full provenance
 */

import logger from '../utils/logger';
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import ArchiveGrokEchoIntegration from '../services/archive-grok-echo-integration';
import ArchiveAdvancedSearchService, { AdvancedSearchFilters } from '../services/archive-advanced-search';

const router = Router();

// Initialize the integration service
const grokApiKey = process.env.XAI_API_KEY || '';
const integration = new ArchiveGrokEchoIntegration(grokApiKey);
const advancedSearch = new ArchiveAdvancedSearchService();

// Rate limiting
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many search requests',
});

const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many verification requests',
});

const echoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many echo requests',
});

// ============================================================================
// 1. SEARCH INTERNET ARCHIVE
// ============================================================================

/**
 * GET /api/archive/search
 * Search Internet Archive for content (all media types: video, audio, image, document)
 *
 * Query Params:
 * - query: Search term (required)
 * - mediaType: 'all' | 'video' | 'audio' | 'image' | 'document' (default: 'all')
 * - limit: Number of results 1-50 (default: 20)
 *
 * Response: Array of ArchiveMediaItem with metadata
 */
router.get('/search', searchLimiter, async (req: Request, res: Response) => {
  try {
    const { query, mediaType = 'all', limit = '20' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Query parameter required' },
      });
    }

    const results = await integration['archiveService'].searchArchive(
      query,
      (mediaType as any) || 'all',
      Math.min(parseInt(limit as string) || 20, 50)
    );

    res.json({
      success: true,
      data: {
        query,
        mediaType,
        resultCount: results.length,
        results,
      },
    });
  } catch (error: any) {
    logger.error('Archive search error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Search failed',
        code: 'ARCHIVE_SEARCH_FAILED',
      },
    });
  }
});

// ============================================================================
// 1.5 ADVANCED SEARCH (with comprehensive filters)
// ============================================================================

/**
 * POST /api/archive/advanced-search
 * Comprehensive search with ALL filters
 *
 * Body Parameters (all optional except keyword):
 * - keyword: Search term (required)
 * - phraseMatch: Exact phrase match (optional)
 * - mediaTypes: ['video', 'audio', 'image', 'document', 'text']
 * - yearFrom, yearTo: Date range
 * - creator: Single creator or array of creators
 * - licenses: ['public-domain', 'cc-by', 'cc-by-sa', 'cc-by-nd', 'cc-by-nc', 'cc0']
 * - minDownloads, maxDownloads: Popularity range
 * - minDuration, maxDuration: Duration in seconds (for video/audio)
 * - languages: ['en', 'es', 'fr', 'de', etc.]
 * - formats: ['mp4', 'pdf', 'jpg', etc.]
 * - subjects, tags: Topic tags
 * - collections: ['community_texts', 'movingimage', 'audio', etc.]
 * - sortBy: 'downloads' | 'date' | 'title' | 'relevance'
 * - limit: Results per page (1-100, default 20)
 * - offset: Pagination offset
 *
 * Response: AdvancedSearchResponse with results and facets
 */
router.post('/advanced-search', searchLimiter, async (req: Request, res: Response) => {
  try {
    const { keyword, ...filters } = req.body;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Keyword is required' },
      });
    }

    const results = await advancedSearch.advancedSearch(keyword, filters as AdvancedSearchFilters);

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    logger.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Advanced search failed',
        code: 'ADVANCED_SEARCH_FAILED',
      },
    });
  }
});

/**
 * GET /api/archive/filter-options
 * Get available filter options for UI dropdowns
 */
router.get('/filter-options', searchLimiter, async (req: Request, res: Response) => {
  try {
    const options = await advancedSearch.getFilterOptions();

    res.json({
      success: true,
      data: {
        mediaTypes: options.mediaTypes,
        languages: options.languages,
        licenses: options.licenses,
        collections: options.collections,
        formats: options.formats,
      },
    });
  } catch (error: any) {
    logger.error('Filter options error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch filter options' },
    });
  }
});

/**
 * GET /api/archive/trending
 * Get trending/popular searches
 */
router.get('/trending', searchLimiter, async (req: Request, res: Response) => {
  try {
    const trending = await advancedSearch.getTrendingSearches();

    res.json({
      success: true,
      data: {
        trending,
      },
    });
  } catch (error: any) {
    logger.error('Trending error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch trending searches' },
    });
  }
});

/**
 * GET /api/archive/suggestions
 * Get search suggestions based on partial keyword
 *
 * Query Params:
 * - q: Partial keyword (required)
 */
router.get('/suggestions', searchLimiter, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Query parameter "q" is required' },
      });
    }

    const suggestions = await advancedSearch.getSuggestions(q);

    res.json({
      success: true,
      data: {
        query: q,
        suggestions,
      },
    });
  } catch (error: any) {
    logger.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch suggestions' },
    });
  }
});

// ============================================================================
// 2. GET ARCHIVE ITEM METADATA
// ============================================================================

/**
 * GET /api/archive/:identifier
 * Get full metadata for an Internet Archive item
 *
 * URL Params:
 * - identifier: Archive item identifier (required)
 *
 * Response: Complete ArchiveMediaItem with all metadata
 */
router.get('/:identifier', searchLimiter, async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    // Validate that identifier is strictly alphanumeric (plus dash/underscore), no slashes, etc.
    if (
      !identifier ||
      identifier.length === 0 ||
      !/^[a-zA-Z0-9\-_]+$/.test(identifier)
    ) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid identifier: must only contain letters, numbers, "-", and "_"'},
      });
    }

    const metadata = await integration['archiveService'].getArchiveMetadata(identifier);

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    logger.error('Metadata retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to retrieve metadata',
        code: 'ARCHIVE_METADATA_FAILED',
      },
    });
  }
});

// ============================================================================
// 3. GET ALL MEDIA FILES FOR AN ARCHIVE ITEM
// ============================================================================

/**
 * GET /api/archive/:identifier/media
 * Get all viewable media files (video, audio, image, document) for an archive item
 * Enables "view all media types on internet archive"
 *
 * URL Params:
 * - identifier: Archive item identifier (required)
 *
 * Response: Array of media files with download URLs
 */
router.get('/:identifier/media', searchLimiter, async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    // Validate that identifier is strictly alphanumeric (plus dash/underscore), no slashes, etc.
    if (
      !identifier ||
      identifier.length === 0 ||
      !/^[a-zA-Z0-9\-_]+$/.test(identifier)
    ) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid identifier: must only contain letters, numbers, "-", and "_"'},
      });
    }

    const mediaFiles = await integration.getAllMediaForEcho(identifier);

    res.json({
      success: true,
      data: {
        identifier,
        mediaCount: mediaFiles.length,
        mediaFiles,
        description: 'All available media files for this archive item',
      },
    });
  } catch (error: any) {
    logger.error('Media files error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to retrieve media files',
        code: 'ARCHIVE_MEDIA_FAILED',
      },
    });
  }
});

// ============================================================================
// 4. PREPARE VERIFIED MEDIA FOR MINTING
// ============================================================================

/**
 * POST /api/archive/:identifier/prepare-for-mint
 * Complete workflow: Archive → Grok Verification → Prepare for Echo/Minting
 *
 * URL Params:
 * - identifier: Archive item identifier (required)
 *
 * Body:
 * - walletAddress: Creator's Solana wallet (required)
 *
 * Response: VerifiedMediaPackage with archive proof, Grok verification, and metadata URI
 *
 * This is the KEY endpoint that prepares content for:
 * 1. Creating an Echo base ledger
 * 2. Minting an NFT with full provenance
 * 3. Enabling collaborative layering
 */
router.post(
  '/:identifier/prepare-for-mint',
  verifyLimiter,
  async (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;
      const { walletAddress } = req.body;

      if (!identifier || !walletAddress) {
        return res.status(400).json({
          success: false,
          error: { message: 'Identifier and walletAddress required' },
        });
      }

      // Main workflow: Archive → Grok → Arweave
      const verifiedPackage = await integration.prepareVerifiedMediaForMinting(
        identifier,
        walletAddress,
        process.env.XAI_API_KEY
      );

      res.json({
        success: true,
        data: {
          ...verifiedPackage,
          readyForMinting: verifiedPackage.readyForMinting,
          nextStep: verifiedPackage.readyForMinting
            ? 'Create Echo ledger and mint NFT'
            : 'Content requires manual verification before minting',
        },
      });
    } catch (error: any) {
      logger.error('Prepare for mint error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to prepare media for minting',
          code: 'PREPARE_MINT_FAILED',
        },
      });
    }
  }
);

// ============================================================================
// 5. VERIFY ARCHIVE CONTENT WITH GROK
// ============================================================================

/**
 * POST /api/archive/:identifier/verify-with-grok
 * Grok AI verification of archive content authenticity
 *
 * URL Params:
 * - identifier: Archive item identifier (required)
 *
 * Response: GrokVerificationResult with authenticity score and analysis
 */
router.post('/:identifier/verify-with-grok', verifyLimiter, async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    const archiveItem = await integration['archiveService'].getArchiveMetadata(identifier);
    const verification = await integration['grokService'].verifyArchiveContent(archiveItem);

    res.json({
      success: true,
      data: {
        identifier,
        verification,
        readyForMinting: verification.verified,
      },
    });
  } catch (error: any) {
    logger.error('Grok verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Verification failed',
        code: 'GROK_VERIFY_FAILED',
      },
    });
  }
});

// ============================================================================
// 6. CREATE ECHO LEDGER FROM ARCHIVE
// ============================================================================

/**
 * POST /api/archive/:identifier/create-echo-ledger
 * Create an Echo base ledger from verified archive content
 * Enables collaborative layering on top of permanent archive media
 *
 * URL Params:
 * - identifier: Archive item identifier (required)
 *
 * Body:
 * - verifiedPackage: The VerifiedMediaPackage from prepare-for-mint (required)
 * - creatorWallet: Creator's Solana wallet (required)
 *
 * Response: New Echo ledger ID for layering and minting
 */
router.post(
  '/:identifier/create-echo-ledger',
  echoLimiter,
  async (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;
      const { verifiedPackage, creatorWallet } = req.body;

      if (!verifiedPackage || !creatorWallet) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'verifiedPackage and creatorWallet required',
          },
        });
      }

      const ledgerId = await integration.createEchoLedgerFromArchive(
        verifiedPackage,
        creatorWallet
      );

      res.json({
        success: true,
        data: {
          identifier,
          ledgerId,
          message: '✨ Echo ledger created! Ready for collaborative layering and minting.',
          nextSteps: [
            'Add Echo layers (text, audio, annotation, video, remix)',
            'Verify each layer with Grok',
            'Mint as NFT with full Echo lineage',
            'Enable contributors to earn CLOUT tokens',
          ],
        },
      });
    } catch (error: any) {
      logger.error('Create echo ledger error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to create echo ledger',
          code: 'CREATE_LEDGER_FAILED',
        },
      });
    }
  }
);

// ============================================================================
// 7. ADD VERIFIED ECHO LAYER
// ============================================================================

/**
 * POST /api/archive/echo/:ledgerId/add-layer
 * Add a verified Echo layer to an archive-based ledger
 *
 * URL Params:
 * - ledgerId: Echo ledger ID (required)
 *
 * Body:
 * - layerType: 'text' | 'audio' | 'annotation' | 'video' | 'remix' (required)
 * - content: Layer content (required)
 * - contributorWallet: Contributor's Solana wallet (required)
 * - archiveIdentifier: Original archive item identifier (optional, for derivation verification)
 *
 * Response: Created EchoLayerWithArchive with verification score and lineage proof
 */
router.post(
  '/echo/:ledgerId/add-layer',
  echoLimiter,
  async (req: Request, res: Response) => {
    try {
      const { ledgerId } = req.params;
      const { layerType, content, contributorWallet, archiveIdentifier } = req.body;

      if (!ledgerId || !layerType || !content || !contributorWallet) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              'ledgerId, layerType, content, and contributorWallet required',
          },
        });
      }

      let archiveParent: any = undefined;
      if (archiveIdentifier) {
        archiveParent = await integration['archiveService'].getArchiveMetadata(
          archiveIdentifier
        );
      }

      const layer = await integration.addVerifiedEchoLayer(
        ledgerId,
        layerType,
        content,
        contributorWallet,
        archiveParent
      );

      res.json({
        success: true,
        data: {
          layer,
          cloutAwarded: layer.verificationScore >= 70 ? Math.round(layer.verificationScore / 10) * 10 : 0,
          message: `✨ Echo layer added! (${layer.verificationScore}% verified)`,
        },
      });
    } catch (error: any) {
      logger.error('Add echo layer error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to add echo layer',
          code: 'ADD_LAYER_FAILED',
        },
      });
    }
  }
);

// ============================================================================
// 8. DOCUMENTATION ENDPOINT
// ============================================================================

/**
 * GET /api/archive/docs
 * Complete documentation of the Archive + Grok + Echo system
 */
router.get('/docs', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'Internet Archive + Grok AI + Echo Integration',
      description:
        'Revolutionary NFT ecosystem enabling permanent, verified, collaborative media NFTs',
      version: '1.0.0',
      vision: {
        title: 'Reinventing How People See and Use NFTs',
        components: [
          {
            name: 'Internet Archive Integration',
            description:
              'Access all public domain media: videos, audio, images, documents',
            benefits: [
              'Content preserved forever',
              'Verified public domain status',
              'Massive catalog (20M+ items)',
              'Free, open access',
            ],
          },
          {
            name: 'Grok AI Verification',
            description:
              'Verify content authenticity, origin, and quality with xAI Grok',
            benefits: [
              'Authenticity score (0-100%)',
              'Origin analysis & confidence',
              'Concern detection',
              'Immutable verification record',
            ],
          },
          {
            name: 'Echo Layering',
            description:
              'Build upon verified content with collaborative additions',
            benefits: [
              'Multiple contributors',
              'Full lineage tracking',
              'Derivative verification',
              'CLOUT rewards',
            ],
          },
          {
            name: 'NFT Minting',
            description: 'Mint verified, layered content as permanent NFTs',
            benefits: [
              'Full provenance chain',
              'Archive permanence',
              'Grok verification proof',
              'Echo lineage',
            ],
          },
        ],
      },
      endpoints: {
        discovery: [
          {
            method: 'GET',
            path: '/api/archive/search',
            description: 'Search Internet Archive for content',
            params: {
              query: 'Search term (required)',
              mediaType: "all | video | audio | image | document (default: 'all')",
              limit: '1-50 (default: 20)',
            },
          },
          {
            method: 'GET',
            path: '/api/archive/:identifier',
            description: 'Get full metadata for an archive item',
            params: { identifier: 'Archive item ID (required)' },
          },
          {
            method: 'GET',
            path: '/api/archive/:identifier/media',
            description: 'View all media files in an archive item',
            params: { identifier: 'Archive item ID (required)' },
          },
        ],
        verification: [
          {
            method: 'POST',
            path: '/api/archive/:identifier/verify-with-grok',
            description: 'Verify archive content authenticity with Grok AI',
            params: { identifier: 'Archive item ID (required)' },
          },
        ],
        preparation: [
          {
            method: 'POST',
            path: '/api/archive/:identifier/prepare-for-mint',
            description:
              'Complete workflow: Archive → Grok Verification → Arweave Storage',
            body: { walletAddress: 'Creator wallet (required)' },
            returns: 'VerifiedMediaPackage ready for Echo/Minting',
          },
        ],
        echo: [
          {
            method: 'POST',
            path: '/api/archive/:identifier/create-echo-ledger',
            description: 'Create Echo ledger from verified archive content',
            body: {
              verifiedPackage: 'From prepare-for-mint (required)',
              creatorWallet: 'Creator wallet (required)',
            },
            returns: 'Echo ledger ID for layering',
          },
          {
            method: 'POST',
            path: '/api/archive/echo/:ledgerId/add-layer',
            description: 'Add verified Echo layer to ledger',
            body: {
              layerType: "text | audio | annotation | video | remix (required)",
              content: 'Layer content (required)',
              contributorWallet: 'Contributor wallet (required)',
              archiveIdentifier: 'Original archive (optional)',
            },
            returns: 'EchoLayer with verification & CLOUT',
          },
        ],
      },
      workflow: {
        title: 'End-to-End: Archive → Grok → Echo → Mint',
        steps: [
          {
            number: 1,
            name: 'Search Internet Archive',
            endpoint: 'GET /api/archive/search',
            purpose: 'Discover content to build upon',
          },
          {
            number: 2,
            name: 'Get Archive Metadata',
            endpoint: 'GET /api/archive/:identifier',
            purpose: 'Review full details & media files',
          },
          {
            number: 3,
            name: 'Prepare for Minting',
            endpoint: 'POST /api/archive/:identifier/prepare-for-mint',
            purpose:
              'Archive proof + Grok verification + Arweave storage',
          },
          {
            number: 4,
            name: 'Create Echo Ledger',
            endpoint: 'POST /api/archive/:identifier/create-echo-ledger',
            purpose: 'Enable collaborative layering',
          },
          {
            number: 5,
            name: 'Add Echo Layers',
            endpoint: 'POST /api/archive/echo/:ledgerId/add-layer',
            purpose: 'Layers verified & contributors rewarded',
          },
          {
            number: 6,
            name: 'Mint NFT',
            endpoint: 'Existing mint endpoints (with Echo ledger)',
            purpose: 'NFT with full provenance & permanence',
          },
        ],
      },
      result: {
        title: 'Revolutionary NFTs',
        properties: [
          'Permanent (Internet Archive)',
          'Verified (Grok AI)',
          'Layered (Echo system)',
          'Traceable (Full lineage)',
          'Rewarding (CLOUT for contributors)',
          'Collaborative (Community-built)',
        ],
      },
      rateLimit: {
        search: '30 requests/minute',
        verification: '10 requests/minute',
        echo: '20 requests/minute',
      },
    },
  });
});

export default router;
