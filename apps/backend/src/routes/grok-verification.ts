/**
 * 🤖 Grok AI Verification Service
 * Verify content authenticity and generate truth scores for Eternal Echoes
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { verifyWithGrok } from '../utils/grokpedia-production';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('grokVerification');

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
    log.error('[Grok] Verification error:', error);
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
    log.error('[Grok] Video verification error:', error);
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
    log.error('[Grok] Eternal Echo analysis error:', error);
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
    log.error('[Grok] Live feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live feed',
    });
  }
});

/**
 * Helper: Verify content with Grok AI
 * TODO: Integrate with actual Grok API when available
 */
async function verifyContentWithGrok(
  content: string,
  contentType: string,
  metadata?: any
): Promise<GrokVerificationResult> {
  // Mock implementation for now
  // In production, replace with actual Grok API calls

  // Simulate AI processing
  const baseScore = Math.floor(Math.random() * 30) + 70; // 70-100
  const noise = Math.random() * 10 - 5;

  // Analyze content characteristics
  const hasLinks = content.includes('http');
  const hasTimestamp = metadata?.timestamp !== undefined;
  const hasSource = metadata?.source !== undefined;

  // Calculate sub-scores
  const factualAccuracy = Math.min(100, baseScore + (hasLinks ? 10 : 0));
  const sourceReliability = hasSource ? Math.min(100, baseScore + 15) : baseScore - 10;
  const contentAuthenticity = hasTimestamp ? Math.min(100, baseScore + 5) : baseScore;
  const biasDetection = Math.max(0, 100 - Math.abs(noise));

  // Overall score is weighted average
  const score = Math.round(
    (factualAccuracy * 0.4 +
     sourceReliability * 0.3 +
     contentAuthenticity * 0.2 +
     biasDetection * 0.1)
  );

  const flags: string[] = [];
  if (score < 80) flags.push('Requires manual review');
  if (!hasSource) flags.push('No source attribution');
  if (content.length < 50) flags.push('Content too short for full analysis');

  const recommendations: string[] = [];
  if (score >= 90) {
    recommendations.push('High quality content - recommended for minting');
  } else if (score >= 70) {
    recommendations.push('Good content - suitable for minting with disclosure');
  } else {
    recommendations.push('Content needs additional verification');
  }

  return {
    score,
    confidence: Math.random() * 0.2 + 0.8, // 0.8-1.0
    analysis: {
      factualAccuracy,
      sourceReliability,
      contentAuthenticity,
      biasDetection,
    },
    flags,
    recommendations,
    verifiedFacts: [
      {
        claim: 'Content source is verifiable',
        verified: hasSource,
        sources: metadata?.source ? [metadata.source] : [],
      },
      {
        claim: 'Content has timestamp',
        verified: hasTimestamp,
        sources: [],
      },
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
    log.error('[Grok] Failed to fetch archive content:', error);
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
    log.error('[Grok] Failed to fetch live feed:', error);
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

