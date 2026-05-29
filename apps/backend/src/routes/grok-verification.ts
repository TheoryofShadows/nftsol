/**
 * 🤖 Grok AI Verification Service
 * Verify content authenticity and generate truth scores for Eternal Echoes
 */

import logger from '../utils/logger';
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { verifyWithGrok } from '../utils/grokpedia-production';

const router = Router();

interface GrokVerificationRequest {
  content: string;
  contentType: 'text' | 'video' | 'image' | 'url';
  metadata?: {
    source?: string;
    timestamp?: string;
    creator?: string;
  };
}

interface GrokVerificationResult {
  score: number; // 0-100, where 100 is highest truth/authenticity
  confidence: number; // 0-1, confidence in the score
  analysis: {
    factualAccuracy: number;
    sourceReliability: number;
    contentAuthenticity: number;
    biasDetection: number;
  };
  flags: string[]; // Any red flags or concerns
  recommendations: string[];
  verifiedFacts: Array<{
    claim: string;
    verified: boolean;
    sources: string[];
  }>;
  summary: string;
}

/**
 * POST /api/grok/verify
 * Verify content using Grok AI
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { content, contentType, metadata }: GrokVerificationRequest = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required for verification',
      });
    }

    // For now, we'll use a mock verification system
    // In production, integrate with actual Grok API
    const verificationResult = await verifyContentWithGrok(content, contentType, metadata);

    res.json({
      success: true,
      data: verificationResult,
    });
  } catch (error) {
    logger.error('[Grok] Verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
    });
  }
});

/**
 * POST /api/grok/verify-video
 * Verify video NFT using production Grok API
 */
router.post('/verify-video', async (req: Request, res: Response) => {
  try {
    const { videoUri, nftId } = req.body;

    if (!videoUri) {
      return res.status(400).json({
        success: false,
        error: 'Video URI is required for verification',
      });
    }

    // Use production Grok verification
    const verificationResult = await verifyWithGrok(
      videoUri,
      nftId || `video-${Date.now()}`
    );

    res.json({
      success: true,
      data: verificationResult,
    });
  } catch (error) {
    logger.error('[Grok] Video verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Video verification failed',
    });
  }
});

/**
 * POST /api/grok/analyze-eternal-echo
 * Analyze content for Eternal Echo minting
 */
router.post('/analyze-eternal-echo', async (req: Request, res: Response) => {
  try {
    const { archiveUrl, description, creator } = req.body;

    if (!archiveUrl) {
      return res.status(400).json({
        success: false,
        error: 'Archive URL is required',
      });
    }

    // Fetch content from Internet Archive
    const archiveContent = await fetchArchiveContent(archiveUrl);

    // Verify with Grok
    const verification = await verifyContentWithGrok(
      archiveContent.text || description,
      'url',
      {
        source: 'Internet Archive',
        timestamp: archiveContent.timestamp,
        creator,
      }
    );

    res.json({
      success: true,
      data: {
        verification,
        archiveMetadata: archiveContent.metadata,
        mintRecommendation: verification.score >= 70 ? 'approved' : 'review',
        estimatedValue: calculateEstimatedValue(verification.score),
      },
    });
  } catch (error) {
    logger.error('[Grok] Eternal Echo analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
    });
  }
});

/**
 * GET /api/grok/archive/live-feed
 * Get live feed from Internet Archive for Eternal Echoes
 */
router.get('/archive/live-feed', async (req: Request, res: Response) => {
  try {
    const { category = 'all', limit = 20 } = req.query;

    // Fetch recent items from Internet Archive
    const liveFeed = await fetchInternetArchiveLiveFeed(
      category as string,
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: liveFeed,
    });
  } catch (error) {
    logger.error('[Grok] Live feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live feed',
    });
  }
});

/**
 * Helper: Verify content with Grok AI
 * Uses xAI Grok API with Cloudflare AI fallback
 */
async function verifyContentWithGrok(
  content: string,
  contentType: string,
  metadata?: Record<string, string | undefined>
): Promise<GrokVerificationResult> {
  const xaiApiKey = process.env.XAI_API_KEY;
  const hasSource = metadata?.source !== undefined;
  const hasTimestamp = metadata?.timestamp !== undefined;

  // Try real xAI Grok API first
  if (xaiApiKey) {
    try {
      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-4-latest',
          messages: [
            {
              role: 'system',
              content: `You are Grok, AI verifier for NFTSol. Analyze content for authenticity, factual accuracy, source reliability, and bias. Respond ONLY with valid JSON matching this schema: {"score":85,"factualAccuracy":90,"sourceReliability":80,"contentAuthenticity":85,"biasDetection":75,"flags":[],"summary":"Brief analysis"}`,
            },
            {
              role: 'user',
              content: `ContentType: ${contentType}\nSource: ${metadata?.source || 'Unknown'}\nTimestamp: ${metadata?.timestamp || 'Unknown'}\n\nContent: ${content.slice(0, 1500)}`,
            },
          ],
          max_tokens: 300,
          temperature: 0,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${xaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const raw = JSON.parse(response.data.choices[0]?.message?.content || '{}');
      const score = Math.max(0, Math.min(100, raw.score || 70));
      const flags: string[] = raw.flags || [];
      if (score < 80) flags.push('Requires manual review');
      if (!hasSource) flags.push('No source attribution');

      const recommendations = score >= 90
        ? ['High quality content - recommended for minting']
        : score >= 70
        ? ['Good content - suitable for minting with disclosure']
        : ['Content needs additional verification'];

      return {
        score,
        confidence: score / 100,
        analysis: {
          factualAccuracy: Math.max(0, Math.min(100, raw.factualAccuracy || score)),
          sourceReliability: Math.max(0, Math.min(100, raw.sourceReliability || (hasSource ? score + 5 : score - 10))),
          contentAuthenticity: Math.max(0, Math.min(100, raw.contentAuthenticity || score)),
          biasDetection: Math.max(0, Math.min(100, raw.biasDetection || 75)),
        },
        flags,
        recommendations,
        verifiedFacts: [
          { claim: 'Content source is verifiable', verified: hasSource, sources: metadata?.source ? [metadata.source] : [] },
          { claim: 'Content has timestamp', verified: hasTimestamp, sources: [] },
        ],
        summary: raw.summary || generateSummary(score, flags, recommendations),
      };
    } catch (apiError: unknown) {
      const msg = apiError instanceof Error ? apiError.message : 'unknown error';
      logger.warn('[Grok] xAI API failed, using heuristic fallback:', msg);
    }
  }

  // Heuristic fallback when no API key or API fails
  const hasLinks = content.includes('http');
  const baseScore = 65 + (hasLinks ? 5 : 0) + (hasSource ? 10 : 0) + (hasTimestamp ? 5 : 0);
  const score = Math.min(100, baseScore);

  const factualAccuracy = Math.min(100, score + (hasLinks ? 5 : 0));
  const sourceReliability = hasSource ? Math.min(100, score + 10) : Math.max(0, score - 10);
  const contentAuthenticity = hasTimestamp ? Math.min(100, score + 5) : score;
  const biasDetection = 75;

  const flags: string[] = [];
  if (score < 80) flags.push('Requires manual review');
  if (!hasSource) flags.push('No source attribution');
  if (content.length < 50) flags.push('Content too short for full analysis');
  if (!xaiApiKey) flags.push('AI verification unavailable - heuristic used');

  const recommendations = score >= 90
    ? ['High quality content - recommended for minting']
    : score >= 70
    ? ['Good content - suitable for minting with disclosure']
    : ['Content needs additional verification'];

  return {
    score: Math.round((factualAccuracy * 0.4 + sourceReliability * 0.3 + contentAuthenticity * 0.2 + biasDetection * 0.1)),
    confidence: score / 100,
    analysis: { factualAccuracy, sourceReliability, contentAuthenticity, biasDetection },
    flags,
    recommendations,
    verifiedFacts: [
      { claim: 'Content source is verifiable', verified: hasSource, sources: metadata?.source ? [metadata.source] : [] },
      { claim: 'Content has timestamp', verified: hasTimestamp, sources: [] },
    ],
    summary: generateSummary(score, flags, recommendations),
  };
}

/**
 * Helper: Fetch content from Internet Archive
 */
async function fetchArchiveContent(archiveUrl: string): Promise<any> {
  try {
    // Validate that archiveUrl is a URL pointing to archive.org
    let urlObj: URL;
    try {
      urlObj = new URL(archiveUrl);
    } catch (e: unknown) {
      throw new Error('Invalid archive URL format');
    }
    if (urlObj.hostname !== 'archive.org') {
      throw new Error('Invalid archive hostname');
    }

    // Extract item identifier from path
    const pathnameParts = urlObj.pathname.split('/');
    const itemId = pathnameParts[pathnameParts.length - 1] || '';
    // Enforce that the itemId contains only safe characters (letters, digits, hyphens, underscores)
    if (!/^[a-zA-Z0-9\-_]+$/.test(itemId)) {
      throw new Error('Invalid or unsafe archive item identifier');
    }

    // Fetch metadata from Internet Archive
    const metadataUrl = `https://archive.org/metadata/${itemId}`;
    const response = await axios.get(metadataUrl, { timeout: 10000 });

    const metadata = response.data;

    return {
      text: metadata.metadata?.description || '',
      timestamp: metadata.metadata?.date || new Date().toISOString(),
      metadata: {
        title: metadata.metadata?.title || '',
        creator: metadata.metadata?.creator || '',
        subject: metadata.metadata?.subject || [],
        description: metadata.metadata?.description || '',
        mediatype: metadata.metadata?.mediatype || '',
      },
    };
  } catch (error) {
    logger.error('[Grok] Failed to fetch archive content:', error);
    return {
      text: '',
      timestamp: new Date().toISOString(),
      metadata: {},
      error: error instanceof Error ? error.message : 'Archive fetch failed',
    };
  }
}

/**
 * Helper: Fetch Internet Archive live feed
 */
async function fetchInternetArchiveLiveFeed(category: string, limit: number): Promise<any[]> {
  try {
    // Fetch recent uploads from Internet Archive
    const searchUrl = 'https://archive.org/advancedsearch.php';
    const params = {
      q: category === 'all' ? '*:*' : `mediatype:${category}`,
      fl: 'identifier,title,description,creator,date,mediatype,downloads,item_size',
      sort: 'addeddate desc',
      rows: limit,
      output: 'json',
    };

    const response = await axios.get(searchUrl, { params, timeout: 15000 });
    const docs = response.data?.response?.docs || [];

    return docs.map((doc: any) => ({
      id: doc.identifier,
      title: doc.title || 'Untitled',
      description: doc.description || '',
      creator: doc.creator || 'Unknown',
      date: doc.date || '',
      mediaType: doc.mediatype || '',
      downloads: doc.downloads || 0,
      size: doc.item_size || 0,
      archiveUrl: `https://archive.org/details/${doc.identifier}`,
      thumbnailUrl: `https://archive.org/services/img/${doc.identifier}`,
    }));
  } catch (error) {
    logger.error('[Grok] Failed to fetch live feed:', error);
    return [];
  }
}

/**
 * Helper: Calculate estimated value based on verification score
 */
function calculateEstimatedValue(score: number): number {
  // Higher scores = higher estimated value
  if (score >= 95) return 10.0; // 10 SOL for exceptional content
  if (score >= 90) return 5.0;
  if (score >= 85) return 2.5;
  if (score >= 80) return 1.0;
  if (score >= 75) return 0.5;
  return 0.1; // Minimum value
}

/**
 * Helper: Generate summary text
 */
function generateSummary(score: number, flags: string[], recommendations: string[]): string {
  let summary = `Content verification score: ${score}/100. `;

  if (score >= 90) {
    summary += 'This content demonstrates high authenticity and factual accuracy. ';
  } else if (score >= 75) {
    summary += 'This content shows good reliability with some areas for improvement. ';
  } else {
    summary += 'This content requires additional verification. ';
  }

  if (flags.length > 0) {
    summary += `Flags: ${flags.join(', ')}. `;
  }

  if (recommendations.length > 0) {
    summary += recommendations[0];
  }

  return summary;
}

export default router;

