/**
 * 🌐 Broader web-search routes (license-safe, Grok-verified)
 *
 * - POST /api/v1/web-search          → search the open web (Openverse + Archive)
 * - POST /api/v1/web-search/verify   → Grok/heuristic truth-score for ANY result
 *
 * Verification reuses the same GrokArchiveVerificationService used by the Archive
 * flow, so web results carry the same honest truth score (real Grok when
 * XAI_API_KEY/GROK_API_KEY is set, deterministic heuristic otherwise).
 */

import logger from '../utils/logger';
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { webSearchService, WebSearchMediaType } from '../services/web-search';
import {
  GrokArchiveVerificationService,
  ArchiveMediaItem,
} from '../services/archive-grok-echo-integration';

const router = Router();

const grokService = new GrokArchiveVerificationService(
  process.env.XAI_API_KEY || process.env.GROK_API_KEY || '',
);

const searchLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: 'Too many search requests' });
const verifyLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, message: 'Too many verification requests' });

const ALLOWED_MEDIA: WebSearchMediaType[] = ['all', 'image', 'audio', 'video'];
const ALLOWED_LICENSES = ['public-domain', 'cc-by', 'cc-by-sa', 'cc-by-nd', 'cc-by-nc'] as const;
const ALLOWED_ARCHIVE_MEDIA = ['video', 'audio', 'image', 'document', 'text'] as const;

/**
 * POST /api/v1/web-search
 * Body: { query, mediaType?, limit?, page? }
 */
router.post('/', searchLimiter, async (req: Request, res: Response) => {
  try {
    const { query, mediaType, limit, page } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'A search query is required' });
    }

    const mt: WebSearchMediaType = ALLOWED_MEDIA.includes(mediaType) ? mediaType : 'all';
    const data = await webSearchService.search({
      query,
      mediaType: mt,
      limit: typeof limit === 'number' ? limit : undefined,
      page: typeof page === 'number' ? page : undefined,
    });

    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error('[WebSearch] search error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Web search failed' });
  }
});

/**
 * POST /api/v1/web-search/verify
 * Body: a search result item (identifier, title, description, creator,
 * mediaType, licenseType, downloads?, publicDate?, url?, archiveUrl?).
 * Returns the Grok/heuristic verification for that item.
 */
router.post('/verify', verifyLimiter, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    if (!body.identifier && !body.title) {
      return res.status(400).json({ success: false, error: 'A content item (identifier/title) is required' });
    }

    const mediaType = (ALLOWED_ARCHIVE_MEDIA as readonly string[]).includes(body.mediaType)
      ? body.mediaType
      : 'image';
    const licenseType = (ALLOWED_LICENSES as readonly string[]).includes(body.licenseType)
      ? body.licenseType
      : 'cc-by';

    const item: ArchiveMediaItem = {
      identifier: String(body.identifier || body.title),
      title: String(body.title || body.identifier || 'Untitled'),
      description: String(body.description || ''),
      creator: String(body.creator || 'Unknown'),
      year: body.year ? String(body.year) : undefined,
      publicDate: body.publicDate ? String(body.publicDate) : undefined,
      mediaType: mediaType as ArchiveMediaItem['mediaType'],
      downloads: Number(body.downloads) || 0,
      url: String(body.url || body.archiveUrl || ''),
      thumbnailUrl: body.thumbnailUrl ? String(body.thumbnailUrl) : undefined,
      licenseType: licenseType as ArchiveMediaItem['licenseType'],
      archiveUrl: String(body.archiveUrl || body.url || ''),
      metadata: { source: body.source || 'web' },
    };

    const verification = await grokService.verifyArchiveContent(item);
    return res.json({
      success: true,
      data: { identifier: item.identifier, verification, readyForMinting: verification.verified },
    });
  } catch (error: any) {
    logger.error('[WebSearch] verify error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Verification failed' });
  }
});

export default router;
