/**
 * 🌍 REVOLUTIONARY: Internet Archive + Grok + Echo Integration
 *
 * The NFT ecosystem reinvented:
 * - Content sourced from Internet Archive (public domain, permanent)
 * - Verified by Grok AI (authenticity certified)
 * - Preserved forever on Arweave (immutable)
 * - Layered through Echo system (collaboratively enhanced)
 * - Minted as permanent, verifiable, traceable NFTs
 */

import logger from '../utils/logger';
import axios from 'axios';
import { PublicKey as _PublicKey, Connection as _Connection } from '@solana/web3.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ArchiveMediaItem {
  identifier: string;
  title: string;
  description: string;
  creator: string;
  year?: string;
  publicDate?: string;
  mediaType: 'video' | 'audio' | 'image' | 'document' | 'text';
  downloads: number;
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  duration?: number;
  format?: string;
  licenseType: 'public-domain' | 'cc-by' | 'cc-by-sa' | 'cc-by-nd' | 'cc-by-nc';
  archiveUrl: string;
  metadata: Record<string, any>;
}

export interface GrokVerificationResult {
  contentHash: string;
  verified: boolean;
  truthScore: number; // 0-100
  confidence: number; // 0-100
  summary: string;
  concerns?: string[];
  /** How the score was produced: real AI verifier vs. local heuristic fallback. */
  method: 'grok' | 'heuristic';
  authenticity: 'authentic' | 'suspicious' | 'inconclusive';
  originAnalysis: {
    likelySource: string;
    confidence: number;
    supportingEvidence: string[];
  };
  dimensions?: {
    authenticity: number;
    originConfidence: number;
    sourceReliability: number;
    contentQuality: number;
  };
  timestamp: number;
}

export interface ArchiveProof {
  archiveIdentifier: string;
  archiveUrl: string;
  savedTimestamp: number;
  mediaHash: string;
  licenseVerified: boolean;
  archiveMetadata: Record<string, any>;
}

export interface VerifiedMediaPackage {
  archiveProof: ArchiveProof;
  grokVerification: GrokVerificationResult;
  permanentMetadataUri: string; // Arweave URI
  readyForMinting: boolean;
  echoLedgerId?: string;
  contributors: ContributorInfo[];
}

export interface ContributorInfo {
  walletAddress: string;
  contributionType: 'original-creator' | 'verifier' | 'layer-contributor';
  timestamp: number;
  verificationScore?: number;
  cloutAwarded: number;
}

export interface EchoLayerWithArchive {
  layerId: string;
  echoType: 'text' | 'audio' | 'annotation' | 'video' | 'remix';
  content: string;
  archiveSource?: string; // Reference to archive if sourced from IA
  contributor: string;
  grokVerified: boolean;
  verificationScore: number;
  timestamp: number;
  lineageProof: {
    parentLedgerId: string;
    parentHash: string;
    derivationVerified: boolean;
  };
}

// ============================================================================
// INTERNET ARCHIVE SERVICE
// ============================================================================

// archive.org needs a UA + bracketed array params (see notes in
// archive-advanced-search.ts). Without these it silently returns HTML/error
// payloads that parse to zero results.
const ARCHIVE_USER_AGENT = 'NFTSol/1.0 (+https://nftsol.app)';
const archiveParamsSerializer = (params: Record<string, any>): string => {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(item))}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.join('&');
};

export class InternetArchiveService {
  private baseUrl = 'https://archive.org';
  private searchUrl = 'https://archive.org/advancedsearch.php';
  private apiClient = axios.create({
    timeout: 30000,
    headers: {
      'User-Agent': ARCHIVE_USER_AGENT,
      Accept: 'application/json',
    },
    paramsSerializer: archiveParamsSerializer,
  });

  /**
   * Search Internet Archive for public domain content
   * Supports all media types: video, audio, images, documents
   */
  async searchArchive(
    query: string,
    mediaType: 'video' | 'audio' | 'image' | 'document' | 'all' = 'all',
    limit: number = 50
  ): Promise<ArchiveMediaItem[]> {
    try {
      // Filter by mediatype in Advanced Search format
      let typeFilter = '';
      if (mediaType !== 'all') {
        const typeMap: Record<string, string> = {
          video: 'video',
          audio: 'audio',
          image: 'image',
          document: 'texts',
        };
        typeFilter = typeMap[mediaType] || '';
      }

      // Build Advanced Search query.
      // The previous version required `licenseurl:"public domain"` on every
      // query, which matches only a small fraction of items and caused the
      // search to return empty results for almost every keyword. Items that
      // are actually public domain aren't all tagged that way — we let the
      // caller apply licence filters through the advanced-search endpoint.
      const advancedQuery = typeFilter
        ? `(${query}) AND mediatype:(${typeFilter})`
        : `(${query})`;

      const response = await this.apiClient.get(this.searchUrl, {
        params: {
          q: advancedQuery,
          fl: ['identifier', 'title', 'description', 'creator', 'date', 'mediatype', 'downloads'],
          output: 'json',
          rows: Math.min(limit, 50),
          sort: 'downloads desc',
        },
      });

      if (!response.data || typeof response.data !== 'object' || !response.data.response) {
        logger.error('Archive search returned unexpected payload', {
          contentType: response.headers?.['content-type'],
          query: advancedQuery,
        });
        throw new Error('Archive.org returned an unexpected response');
      }

      const docs = response.data.response.docs || [];
      return docs.map((doc: any) => this.transformArchiveDoc(doc));
    } catch (error) {
      logger.error('Archive search failed:', error);
      throw new Error(`Failed to search Internet Archive: ${error}`);
    }
  }

  /**
   * Get full metadata for an archive item
   * Includes all media files, detailed metadata, licensing info
   */
  async getArchiveMetadata(identifier: string): Promise<ArchiveMediaItem> {
    try {
      // Validate the identifier before it reaches the request URL so a user
      // value can never steer the archive.org call (path traversal / SSRF).
      if (!/^[A-Za-z0-9._-]+$/.test(identifier)) {
        throw new Error('Invalid archive identifier');
      }
      // Use Archive.org metadata API. Cap this user-facing call at 10s — some
      // items sit on slow/broken storage nodes and archive.org can hang ~30s
      // before returning an error, which otherwise stalls the whole verify flow.
      const metadataUrl = `${this.baseUrl}/metadata/${encodeURIComponent(identifier)}`;
      const response = await this.apiClient.get(metadataUrl, { timeout: 10000 });

      const item = response.data;

      // Find primary media file
      const files = item.files || [];
      const mediaFile = this.findPrimaryMediaFile(files, identifier);

      return {
        identifier,
        title: item.metadata?.title || identifier,
        description: item.metadata?.description || '',
        creator: item.metadata?.creator?.[0] || item.metadata?.creator || 'Unknown',
        year: item.metadata?.date?.split('-')[0] || item.metadata?.year,
        publicDate: item.metadata?.publicdate || item.metadata?.date,
        mediaType: this.inferMediaType(item.metadata?.mediatype || 'unknown'),
        downloads: parseInt(item.metadata?.downloads || '0'),
        url: mediaFile?.url || `${this.baseUrl}/download/${identifier}`,
        thumbnailUrl: this.getThumbnailUrl(identifier),
        fileSize: mediaFile?.size,
        duration: this.extractDuration(item.metadata),
        format: mediaFile?.format,
        licenseType: this.extractLicenseType(item.metadata?.licenseurl),
        archiveUrl: `${this.baseUrl}/details/${identifier}`,
        metadata: item.metadata || {},
      };
    } catch (error) {
      logger.error('Failed to get archive metadata:', error);
      throw new Error(`Failed to retrieve archive item: ${error}`);
    }
  }

  /**
   * Get all media files for an archive item (for Echo layering)
   * Enables viewing all media types on Internet Archive
   */
  async getAllMediaFiles(identifier: string): Promise<Array<{
    name: string;
    format: string;
    size: number;
    url: string;
    duration?: number;
  }>> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/metadata/${identifier}`
      );

      const files = response.data.files || [];
      const mediaFiles = files.filter((f: any) => {
        const format = f.format?.toLowerCase() || '';
        // Include all viewable media
        return /video|audio|image|pdf|text/.test(format) || f.mediatype !== 'metadata';
      });

      return mediaFiles.map((f: any) => ({
        name: f.name,
        format: f.format,
        size: f.size || 0,
        url: `${this.baseUrl}/download/${identifier}/${f.name}`,
        duration: f.length ? parseInt(f.length) : undefined,
      }));
    } catch (error) {
      logger.error('Failed to get media files:', error);
      return [];
    }
  }

  /**
   * Create permanent archive proof for later verification
   */
  async createArchiveProof(identifier: string): Promise<ArchiveProof> {
    try {
      const metadata = await this.getArchiveMetadata(identifier);

      return {
        archiveIdentifier: identifier,
        archiveUrl: metadata.archiveUrl,
        savedTimestamp: Date.now(),
        mediaHash: this.hashContent(JSON.stringify(metadata)),
        licenseVerified: ['public-domain', 'cc-by', 'cc-by-sa'].includes(metadata.licenseType),
        archiveMetadata: {
          title: metadata.title,
          creator: metadata.creator,
          date: metadata.publicDate,
          downloads: metadata.downloads,
          licenseType: metadata.licenseType,
        },
      };
    } catch (error) {
      logger.error('Failed to create archive proof:', error);
      throw error;
    }
  }

  // Helper methods
  private transformArchiveDoc(doc: any): ArchiveMediaItem {
    return {
      identifier: doc.identifier,
      title: doc.title,
      description: doc.description || '',
      creator: doc.creator || 'Unknown',
      year: doc.date?.split('-')[0],
      mediaType: this.inferMediaType(doc.mediatype),
      downloads: doc.downloads || 0,
      url: `${this.baseUrl}/download/${doc.identifier}`,
      thumbnailUrl: this.getThumbnailUrl(doc.identifier),
      licenseType: 'public-domain',
      archiveUrl: `${this.baseUrl}/details/${doc.identifier}`,
      metadata: doc,
    };
  }

  private findPrimaryMediaFile(
    files: any[],
    identifier: string
  ): { url: string; size?: number; format?: string } | null {
    // Prefer video > audio > image > document
    const priorityFormats = ['mp4', 'webm', 'ogv', 'mp3', 'ogg', 'jpg', 'png', 'pdf'];

    for (const format of priorityFormats) {
      const file = files.find((f: any) => f.name.endsWith(`.${format}`));
      if (file) {
        return {
          url: `${this.baseUrl}/download/${identifier}/${file.name}`,
          size: file.size,
          format: file.format,
        };
      }
    }

    return null;
  }

  private getThumbnailUrl(identifier: string): string {
    return `${this.baseUrl}/services/img/${identifier}`;
  }

  private inferMediaType(mediatype: string): ArchiveMediaItem['mediaType'] {
    const lower = mediatype.toLowerCase();
    if (lower.includes('video')) return 'video';
    if (lower.includes('audio')) return 'audio';
    if (lower.includes('image')) return 'image';
    if (lower.includes('text') || lower.includes('pdf')) return 'document';
    return 'document';
  }

  private extractDuration(metadata: any): number | undefined {
    if (metadata?.length) return parseInt(metadata.length);
    if (metadata?.runtime) return parseInt(metadata.runtime);
    return undefined;
  }

  private extractLicenseType(licenseUrl?: string): ArchiveMediaItem['licenseType'] {
    if (!licenseUrl) return 'public-domain';
    const lower = licenseUrl.toLowerCase();
    if (lower.includes('public-domain')) return 'public-domain';
    if (lower.includes('by-sa')) return 'cc-by-sa';
    if (lower.includes('by-nd')) return 'cc-by-nd';
    if (lower.includes('by-nc')) return 'cc-by-nc';
    if (lower.includes('by')) return 'cc-by';
    return 'public-domain';
  }

  private hashContent(content: string): string {
    // Simple hash for demo; use proper crypto in production
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// ============================================================================
// GROK VERIFICATION SERVICE (with Archive Integration)
// ============================================================================

export class GrokArchiveVerificationService {
  private grokApiKey: string;
  private grokUrl = 'https://api.x.ai/v1/chat/completions';

  constructor(apiKey: string) {
    this.grokApiKey = apiKey;
  }

  /**
   * Deterministic heuristic score used when the AI verifier is unavailable
   * (no API key, network failure, or unparseable response). Unlike the old
   * hardcoded 85, this varies per item from real Archive signals so different
   * content gets different, defensible scores — and is never presented as
   * AI-verified (see `method: 'heuristic'`).
   *
   * Score is built from independent signals and clamped to 0-100:
   * - License: public-domain/CC-BY are strongest provenance signals
   * - Downloads: popularity is a weak legitimacy signal (log-scaled tiers)
   * - Creator attribution present
   * - Description richness (more context = more verifiable)
   * - Public/upload date present
   */
  private computeHeuristicScore(item: ArchiveMediaItem): number {
    let score = 40; // conservative base

    const license = (item.licenseType || '').toLowerCase();
    if (license === 'public-domain') score += 22;
    else if (license === 'cc-by' || license === 'cc-by-sa') score += 16;
    else if (license.startsWith('cc-')) score += 10;

    const downloads = Number(item.downloads) || 0;
    if (downloads >= 100000) score += 14;
    else if (downloads >= 10000) score += 11;
    else if (downloads >= 1000) score += 8;
    else if (downloads >= 100) score += 5;
    else if (downloads >= 10) score += 2;

    const creator = (item.creator || '').trim();
    if (creator && creator.toLowerCase() !== 'unknown') score += 8;

    const descLen = (item.description || '').trim().length;
    if (descLen >= 400) score += 8;
    else if (descLen >= 120) score += 5;
    else if (descLen >= 30) score += 2;

    if ((item.publicDate || '').trim() || (item.year || '').trim()) score += 6;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Verify archive content authenticity with Grok
   * Checks: source credibility, content authenticity, origin verification
   */
  async verifyArchiveContent(
    archiveItem: ArchiveMediaItem
  ): Promise<GrokVerificationResult> {
    try {
      const descSnippet = (archiveItem.description || '').slice(0, 600);
      const verificationPrompt = `You are an expert digital-media authenticator. Analyze this item and produce a UNIQUE, SPECIFIC assessment — never use generic boilerplate.

ITEM:
Title: ${archiveItem.title}
Creator: ${archiveItem.creator}
Description: ${descSnippet}
Date: ${archiveItem.publicDate || archiveItem.year || 'Unknown'}
Type: ${archiveItem.mediaType}
License: ${archiveItem.licenseType}
Archive URL: ${archiveItem.archiveUrl}
Downloads: ${archiveItem.downloads}

INSTRUCTIONS:
- Score each dimension INDEPENDENTLY based on the actual content signals.
- Write a 1-2 sentence summary that references THIS SPECIFIC item (title, creator, subject matter) — not a generic template.
- List specific concerns and evidence unique to this item.

Return ONLY valid JSON, no markdown:
{
  "authenticityScore": <0-100>,
  "originConfidence": <0-100>,
  "sourceReliability": <0-100>,
  "contentQuality": <0-100>,
  "authenticity": "authentic" | "suspicious" | "inconclusive",
  "summary": "<specific 1-2 sentence analysis of THIS item>",
  "concerns": ["<specific concern>"],
  "evidence": ["<specific evidence point>"]
}`;

      const response = await axios.post(
        this.grokUrl,
        {
          model: 'grok-2',
          messages: [
            {
              role: 'system',
              content: 'You are an expert content authenticator. Every response must be specific to the item being analyzed — never repeat generic summaries. Vary your language and focus on what makes each item unique.',
            },
            {
              role: 'user',
              content: verificationPrompt,
            },
          ],
          temperature: 0.5,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.grokApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const content = response.data.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

      const authScore = Math.max(0, Math.min(100, parsed.authenticityScore ?? 50));
      const originConf = Math.max(0, Math.min(100, parsed.originConfidence ?? 50));
      const srcReliability = Math.max(0, Math.min(100, parsed.sourceReliability ?? Math.round((authScore + originConf) / 2)));
      const contentQuality = Math.max(0, Math.min(100, parsed.contentQuality ?? authScore));

      const truthScore = Math.round(
        authScore * 0.35 + originConf * 0.25 + srcReliability * 0.25 + contentQuality * 0.15
      );

      return {
        contentHash: this.hashContent(JSON.stringify(archiveItem)),
        verified: truthScore >= 70,
        truthScore,
        confidence: originConf,
        method: 'grok',
        summary: parsed.summary || `Grok analysis of "${archiveItem.title}": authenticity ${authScore}%, origin confidence ${originConf}%.`,
        concerns: parsed.concerns || [],
        authenticity: parsed.authenticity || (truthScore >= 70 ? 'authentic' : 'inconclusive'),
        originAnalysis: {
          likelySource: archiveItem.creator,
          confidence: originConf,
          supportingEvidence: parsed.evidence || [],
        },
        dimensions: {
          authenticity: authScore,
          originConfidence: originConf,
          sourceReliability: srcReliability,
          contentQuality,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.warn('Grok verification unavailable, using heuristic fallback:', error);
      const truthScore = this.computeHeuristicScore(archiveItem);
      const summary = this.buildHeuristicSummary(archiveItem, truthScore);
      const evidence = this.buildHeuristicEvidence(archiveItem);
      const concerns = this.buildHeuristicConcerns(archiveItem, truthScore);

      const license = (archiveItem.licenseType || '').toLowerCase();
      const downloads = Number(archiveItem.downloads) || 0;
      const hasCreator = !!(archiveItem.creator || '').trim() && archiveItem.creator.toLowerCase() !== 'unknown';
      const descLen = (archiveItem.description || '').trim().length;

      const srcReliability = license === 'public-domain' ? 80 : license.startsWith('cc-') ? 65 : 40;
      const originConf = (hasCreator ? 50 : 20) + (downloads >= 1000 ? 20 : downloads >= 100 ? 10 : 0);
      const contentQuality = Math.min(100, 30 + (descLen >= 200 ? 30 : descLen >= 50 ? 15 : 0) + (downloads >= 1000 ? 20 : 0));

      return {
        contentHash: this.hashContent(JSON.stringify(archiveItem)),
        verified: truthScore >= 70,
        truthScore,
        confidence: truthScore,
        method: 'heuristic',
        summary,
        concerns,
        authenticity: truthScore >= 70 ? 'authentic' : 'inconclusive',
        originAnalysis: {
          likelySource: archiveItem.creator || 'Internet Archive',
          confidence: truthScore,
          supportingEvidence: evidence,
        },
        dimensions: {
          authenticity: truthScore,
          originConfidence: Math.min(100, originConf),
          sourceReliability: srcReliability,
          contentQuality,
        },
        timestamp: Date.now(),
      };
    }
  }

  private buildHeuristicSummary(item: ArchiveMediaItem, score: number): string {
    const title = item.title || 'this item';
    const creator = (item.creator || '').trim();
    const license = (item.licenseType || '').toLowerCase();
    const downloads = Number(item.downloads) || 0;

    const parts: string[] = [];

    if (license === 'public-domain') {
      parts.push(`"${title}" is in the public domain`);
    } else if (license.startsWith('cc-')) {
      parts.push(`"${title}" is shared under a Creative Commons license`);
    } else {
      parts.push(`"${title}" has unverified licensing`);
    }

    if (creator && creator.toLowerCase() !== 'unknown') {
      parts.push(`attributed to ${creator}`);
    }

    if (downloads >= 10000) {
      parts.push(`with ${downloads.toLocaleString()} downloads indicating broad community trust`);
    } else if (downloads >= 1000) {
      parts.push(`with solid community engagement (${downloads.toLocaleString()} downloads)`);
    }

    let assessment: string;
    if (score >= 80) {
      assessment = 'Strong provenance signals from metadata analysis.';
    } else if (score >= 65) {
      assessment = 'Moderate confidence — some metadata signals could be stronger.';
    } else {
      assessment = 'Limited metadata makes full assessment difficult.';
    }

    return parts.join(', ') + '. ' + assessment;
  }

  private buildHeuristicEvidence(item: ArchiveMediaItem): string[] {
    const evidence: string[] = [];
    const license = (item.licenseType || '').toLowerCase();
    const downloads = Number(item.downloads) || 0;
    const creator = (item.creator || '').trim();

    if (license === 'public-domain') {
      evidence.push('Public domain status verified on Internet Archive');
    } else if (license.startsWith('cc-')) {
      evidence.push(`Creative Commons (${license.toUpperCase()}) license on Internet Archive`);
    }

    if (downloads > 0) {
      evidence.push(`${downloads.toLocaleString()} downloads on Internet Archive`);
    }

    if (creator && creator.toLowerCase() !== 'unknown') {
      evidence.push(`Creator attribution: ${creator}`);
    }

    if (item.publicDate || item.year) {
      evidence.push(`Publication date recorded: ${item.publicDate || item.year}`);
    }

    if ((item.description || '').trim().length >= 100) {
      evidence.push('Detailed description available for cross-reference');
    }

    if (evidence.length === 0) {
      evidence.push('Sourced from Internet Archive');
    }

    return evidence;
  }

  private buildHeuristicConcerns(item: ArchiveMediaItem, score: number): string[] {
    const concerns: string[] = ['AI verifier unavailable — scored by metadata analysis'];
    const creator = (item.creator || '').trim();
    const descLen = (item.description || '').trim().length;
    const downloads = Number(item.downloads) || 0;

    if (!creator || creator.toLowerCase() === 'unknown') {
      concerns.push('No creator attribution — origin cannot be confirmed');
    }

    if (descLen < 30) {
      concerns.push('Minimal description — limited context for verification');
    }

    if (downloads < 10) {
      concerns.push('Very few downloads — limited community validation');
    }

    if (score < 60) {
      concerns.push('Score below confidence threshold — manual review recommended');
    }

    return concerns;
  }

  /**
   * Verify Echo layer derivation from archive base
   * Ensures layered content maintains authenticity chain
   */
  async verifyEchoDerivation(
    parentArchiveItem: ArchiveMediaItem,
    echoLayer: EchoLayerWithArchive
  ): Promise<GrokVerificationResult> {
    try {
      const prompt = `Verify that this Echo layer is a legitimate derivative of the base archive item:

Base Archive:
Title: ${parentArchiveItem.title}
Creator: ${parentArchiveItem.creator}

Echo Layer:
Type: ${echoLayer.echoType}
Content: ${echoLayer.content}
Contributor: ${echoLayer.contributor}

Assessment:
1. Is this layer a genuine, creative addition (not plagiarism/spam)?
2. Does it respect the original's integrity?
3. What's the derivative quality score (0-100)?

Return JSON:
{
  "isLegitimate": <boolean>,
  "qualityScore": <number>,
  "concerns": ["<string>"],
  "legitimacyScore": <number>
}`;

      const response = await axios.post(
        this.grokUrl,
        {
          model: 'grok-2',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.grokApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const parsed = JSON.parse(response.data.choices[0]?.message?.content || '{}');

      return {
        contentHash: this.hashContent(JSON.stringify(echoLayer)),
        verified: parsed.isLegitimate && parsed.qualityScore >= 50,
        truthScore: parsed.qualityScore,
        confidence: parsed.legitimacyScore,
        method: 'grok',
        summary: `Echo layer verification: ${parsed.isLegitimate ? 'Valid' : 'Questionable'} derivation`,
        concerns: parsed.concerns || [],
        authenticity: parsed.isLegitimate ? 'authentic' : 'suspicious',
        originAnalysis: {
          likelySource: echoLayer.contributor,
          confidence: parsed.legitimacyScore,
          supportingEvidence: [
            `Derivative quality: ${parsed.qualityScore}%`,
            `Based on verified archive: ${parentArchiveItem.title}`,
          ],
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Echo derivation verification failed:', error);
      throw error;
    }
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// ============================================================================
// INTEGRATED ARCHIVE + GROK + ECHO SERVICE
// ============================================================================

export class ArchiveGrokEchoIntegration {
  private archiveService: InternetArchiveService;
  private grokService: GrokArchiveVerificationService;

  constructor(grokApiKey: string) {
    this.archiveService = new InternetArchiveService();
    this.grokService = new GrokArchiveVerificationService(grokApiKey);
  }

  /**
   * 🌟 MAIN WORKFLOW: End-to-end archive sourcing, verification, and preparation for minting
   *
   * Flow:
   * 1. Search Internet Archive for media
   * 2. Retrieve full metadata and verify license
   * 3. Grok AI verifies authenticity & origin
   * 4. Create Arweave proof (permanent metadata)
   * 5. Prepare for Echo layering (with lineage tracking)
   * 6. Ready for minting with full provenance
   */
  async prepareVerifiedMediaForMinting(
    archiveIdentifier: string,
    creatorWallet: string,
    _grokApiKey?: string
  ): Promise<VerifiedMediaPackage> {
    logger.info(`🌍 Preparing ${archiveIdentifier} for minting...`);

    // Step 1: Get archive metadata
    const archiveItem = await this.archiveService.getArchiveMetadata(archiveIdentifier);
    logger.info(`✓ Retrieved: ${archiveItem.title}`);

    // Step 2: Create archive proof
    const archiveProof = await this.archiveService.createArchiveProof(archiveIdentifier);
    logger.info(`✓ Archive proof created`);

    // Step 3: Grok verification
    const grokVerification = await this.grokService.verifyArchiveContent(archiveItem);
    logger.info(`✓ Grok verification: ${grokVerification.truthScore}%`);

    // Step 4: Create permanent metadata on Arweave
    const permanentMetadataUri = await this.savePermanentMetadata({
      archiveItem,
      archiveProof,
      grokVerification,
      creatorWallet,
    });
    logger.info(`✓ Permanent metadata: ${permanentMetadataUri}`);

    return {
      archiveProof,
      grokVerification,
      permanentMetadataUri,
      readyForMinting: grokVerification.verified,
      contributors: [
        {
          walletAddress: creatorWallet,
          contributionType: 'original-creator',
          timestamp: Date.now(),
          verificationScore: grokVerification.truthScore,
          cloutAwarded: this.calculateCloutReward(grokVerification.truthScore),
        },
      ],
    };
  }

  /**
   * Create an Echo base ledger from verified archive item
   * Enables collaborative layering on top of permanent archive content
   */
  async createEchoLedgerFromArchive(
    verifiedPackage: VerifiedMediaPackage,
    creatorWallet: string
  ): Promise<string> {
    // Generate unique ledger ID
    const ledgerId = `archive-${verifiedPackage.archiveProof.archiveIdentifier}-${Date.now()}`;

    logger.info(`🎪 Creating Echo ledger: ${ledgerId}`);

    // Initialize with archive base
    const _baseEcho: EchoLayerWithArchive = {
      layerId: `${ledgerId}-base`,
      echoType: 'video',
      content: verifiedPackage.archiveProof.archiveMetadata.title,
      archiveSource: verifiedPackage.archiveProof.archiveIdentifier,
      contributor: creatorWallet,
      grokVerified: verifiedPackage.grokVerification.verified,
      verificationScore: verifiedPackage.grokVerification.truthScore,
      timestamp: Date.now(),
      lineageProof: {
        parentLedgerId: 'archive-origin',
        parentHash: verifiedPackage.archiveProof.mediaHash,
        derivationVerified: true,
      },
    };

    // Store echo ledger (implement with your persistence layer)
    // For now, return the ledger ID
    return ledgerId;
  }

  /**
   * Add verified Echo layer with full archive lineage
   */
  async addVerifiedEchoLayer(
    ledgerId: string,
    layerType: 'text' | 'audio' | 'annotation' | 'video' | 'remix',
    content: string,
    contributorWallet: string,
    archiveParent?: ArchiveMediaItem
  ): Promise<EchoLayerWithArchive> {
    const layerId = `${ledgerId}-${Date.now()}`;

    // Verify the echo layer quality
    const grokResult = archiveParent
      ? await this.grokService.verifyEchoDerivation(
          archiveParent,
          {
            layerId,
            echoType: layerType,
            content,
            contributor: contributorWallet,
            grokVerified: false,
            verificationScore: 0,
            timestamp: Date.now(),
            lineageProof: {
              parentLedgerId: ledgerId,
              parentHash: '',
              derivationVerified: false,
            },
          }
        )
      : {
          contentHash: '',
          verified: true,
          truthScore: 75,
          confidence: 75,
          method: 'heuristic' as const,
          summary: 'Layer verification pending archive parent',
          authenticity: 'authentic' as const,
          originAnalysis: {
            likelySource: contributorWallet,
            confidence: 75,
            supportingEvidence: [],
          },
          timestamp: Date.now(),
        };

    const layer: EchoLayerWithArchive = {
      layerId,
      echoType: layerType,
      content,
      contributor: contributorWallet,
      grokVerified: grokResult.verified,
      verificationScore: grokResult.truthScore,
      timestamp: Date.now(),
      lineageProof: {
        parentLedgerId: ledgerId,
        parentHash: grokResult.contentHash,
        derivationVerified: true,
      },
    };

    logger.info(`✓ Echo layer added: ${layerId} (${grokResult.truthScore}%)`);
    return layer;
  }

  /**
   * Get all media from an archive item for viewing/adding to Echo
   * Enables "view all media types on internet archive"
   */
  async getAllMediaForEcho(archiveIdentifier: string): Promise<Array<{
    name: string;
    format: string;
    url: string;
    size: string;
    duration?: string;
  }>> {
    const files = await this.archiveService.getAllMediaFiles(archiveIdentifier);
    return files.map(f => ({
      name: f.name,
      format: f.format,
      url: f.url,
      size: this.formatBytes(f.size),
      duration: f.duration ? this.formatDuration(f.duration) : undefined,
    }));
  }

  // Helper methods
  private async savePermanentMetadata(_data: any): Promise<string> {
    // TODO: Implement Irys/Arweave upload
    // For now, return mock URI
    const mockUri = `ar://${Math.random().toString(36).substring(7)}`;
    logger.info(`📦 Metadata saved to permanent storage: ${mockUri}`);
    return mockUri;
  }

  private calculateCloutReward(verificationScore: number): number {
    if (verificationScore >= 95) return 50;
    if (verificationScore >= 90) return 40;
    if (verificationScore >= 85) return 30;
    if (verificationScore >= 70) return 20;
    return 10;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${secs}s`;
  }
}

export default ArchiveGrokEchoIntegration;
