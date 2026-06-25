/**
 * 🌐 Broader Web Search (license-safe, free APIs)
 *
 * Searches the open web for mintable media via Openverse — Creative Commons'
 * own API, which indexes ~700M openly-licensed images & audio from across the
 * web (Flickr, Wikimedia, Smithsonian, museums, …) with no API key. Video falls
 * back to the Internet Archive (Openverse has no video), so a single query spans
 * the open web while staying license-safe for NFT minting.
 *
 * Every result is normalised to the shared `SearchResult` shape so the existing
 * verify → mint pipeline works unchanged.
 */

import logger from '../utils/logger';
import ArchiveAdvancedSearchService, { SearchResult } from './archive-advanced-search';

// Outbound requests are pinned to this exact origin (defence-in-depth against
// SSRF — user input only ever fills the query string, never the host/path).
const OPENVERSE_ORIGIN = 'https://api.openverse.org';
const OPENVERSE_BASE_PATH = '/v1';
const USER_AGENT = 'NFTSol/1.0 (+https://nftsol.app)';
// Only surface results that are safe to mint & reuse commercially with modification.
const OPENVERSE_LICENSE_TYPE = 'commercial,modification';
const PROVIDER_TIMEOUT_MS = 8000;

export type WebSearchMediaType = 'all' | 'image' | 'audio' | 'video';

export interface WebSearchParams {
  query: string;
  mediaType?: WebSearchMediaType;
  limit?: number; // 1-50
  page?: number; // 1-based
}

export interface WebSearchResponse {
  query: string;
  totalResults: number;
  results: SearchResult[];
  sources: string[];
}

interface OpenverseResult {
  id: string;
  title?: string;
  creator?: string;
  url?: string; // direct media file
  thumbnail?: string; // openverse proxy thumbnail
  foreign_landing_url?: string;
  license?: string;
  license_version?: string;
  source?: string;
  filesize?: number;
  filetype?: string;
}

/** Map an Openverse license code to our internal licenseType vocabulary. */
function mapOpenverseLicense(license?: string): string {
  switch ((license || '').toLowerCase()) {
    case 'cc0':
    case 'pdm':
      return 'public-domain';
    case 'by':
      return 'cc-by';
    case 'by-sa':
      return 'cc-by-sa';
    case 'by-nd':
      return 'cc-by-nd';
    case 'by-nc':
    case 'by-nc-sa':
    case 'by-nc-nd':
      return 'cc-by-nc';
    default:
      return 'cc-by';
  }
}

export class WebSearchService {
  private archive = new ArchiveAdvancedSearchService();

  /**
   * GET JSON from Openverse with a hard timeout (uses built-in fetch).
   * The request target is built from a constant origin via the URL constructor —
   * user input only ever populates the query string — and the resolved origin is
   * asserted before the request, so a search term can never redirect the call.
   */
  private async openverseGet(path: '/images/' | '/audio/', query: Record<string, string>): Promise<any> {
    const url = new URL(`${OPENVERSE_BASE_PATH}${path}`, OPENVERSE_ORIGIN);
    url.search = new URLSearchParams(query).toString();
    if (url.origin !== OPENVERSE_ORIGIN) {
      throw new Error('Refusing request to non-Openverse host');
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Openverse ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Search the open web. Aggregates Openverse (image/audio) + Internet Archive
   * (video). Each provider is best-effort: if one fails, the others still return.
   */
  async search(params: WebSearchParams): Promise<WebSearchResponse> {
    const query = (params.query || '').trim();
    if (!query) {
      return { query: '', totalResults: 0, results: [], sources: [] };
    }

    const mediaType: WebSearchMediaType = params.mediaType || 'all';
    const limit = Math.min(Math.max(params.limit ?? 24, 1), 50);
    const page = Math.max(params.page ?? 1, 1);

    const tasks: Array<Promise<{ source: string; results: SearchResult[]; total: number }>> = [];

    if (mediaType === 'all' || mediaType === 'image') {
      tasks.push(this.searchOpenverse(query, 'image', limit, page));
    }
    if (mediaType === 'all' || mediaType === 'audio') {
      tasks.push(this.searchOpenverse(query, 'audio', limit, page));
    }
    if (mediaType === 'all' || mediaType === 'video') {
      tasks.push(this.searchArchiveVideo(query, limit, page));
    }

    const settled = await Promise.allSettled(tasks);
    const results: SearchResult[] = [];
    const sources = new Set<string>();
    let totalResults = 0;

    for (const s of settled) {
      if (s.status === 'fulfilled') {
        results.push(...s.value.results);
        totalResults += s.value.total;
        if (s.value.results.length) sources.add(s.value.source);
      } else {
        logger.warn('[WebSearch] a provider failed:', s.reason?.message || s.reason);
      }
    }

    // Interleave providers a bit by relevance: keep insertion order but cap output.
    return {
      query,
      totalResults,
      results: results.slice(0, limit),
      sources: [...sources],
    };
  }

  private async searchOpenverse(
    query: string,
    type: 'image' | 'audio',
    limit: number,
    page: number,
  ): Promise<{ source: string; results: SearchResult[]; total: number }> {
    const path = type === 'image' ? '/images/' : '/audio/';
    const data = await this.openverseGet(path, {
      q: query,
      page_size: String(Math.min(limit, 20)),
      page: String(page),
      license_type: OPENVERSE_LICENSE_TYPE,
      mature: 'false',
    });
    const rows: OpenverseResult[] = Array.isArray(data.results) ? data.results : [];

    const results: SearchResult[] = rows
      .filter((r) => r && r.id && (r.url || r.thumbnail))
      .map((r) => {
        const landing = r.foreign_landing_url || r.url || '';
        // For images use the real media URL as the NFT image; for audio prefer
        // the cover thumbnail (the url is an audio file, not an image).
        const image = type === 'image' ? r.url || r.thumbnail || '' : r.thumbnail || '';
        return {
          identifier: `openverse:${r.id}`,
          title: r.title || 'Untitled',
          description: `${type === 'image' ? 'Image' : 'Audio'} from ${r.source || 'the open web'} via Openverse.`,
          creator: r.creator || 'Unknown',
          mediaType: type,
          downloads: 0,
          url: r.url || landing,
          thumbnailUrl: image || r.thumbnail,
          fileSize: r.filesize,
          format: r.filetype,
          licenseType: mapOpenverseLicense(r.license),
          archiveUrl: landing,
          source: 'openverse',
        } as SearchResult;
      });

    return { source: 'openverse', results, total: Number(data.result_count) || results.length };
  }

  private async searchArchiveVideo(
    query: string,
    limit: number,
    page: number,
  ): Promise<{ source: string; results: SearchResult[]; total: number }> {
    const resp = await this.archive.advancedSearch(query, {
      mediaTypes: ['video'],
      sortBy: 'downloads',
      limit: Math.min(limit, 20),
      offset: (page - 1) * Math.min(limit, 20),
    });
    const results = (resp.results || []).map((r) => ({ ...r, source: 'internet-archive' }));
    return { source: 'internet-archive', results, total: resp.totalResults || results.length };
  }
}

export const webSearchService = new WebSearchService();
