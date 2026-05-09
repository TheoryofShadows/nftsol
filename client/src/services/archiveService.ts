/**
 * Archive Service
 * Calls the Internet Archive API directly from the browser — no backend needed.
 * IA's advancedsearch.php endpoint supports CORS and is fully public.
 * The backend proxy (/api/v1/archive/advanced-search) is used as a fallback
 * only for verify-with-grok and prepare-for-mint which require server secrets.
 */

import { API_BASE } from '../config/api';
import { logger } from '../utils/logger';

export interface AdvancedSearchFilters {
  keyword?: string;
  phraseMatch?: boolean;
  mediaTypes?: ('video' | 'audio' | 'image' | 'document' | 'text')[];
  yearFrom?: number;
  yearTo?: number;
  dateAddedFrom?: string;
  dateAddedTo?: string;
  creator?: string;
  creators?: string[];
  licenses?: ('public-domain' | 'cc-by' | 'cc-by-sa' | 'cc-by-nd' | 'cc-by-nc' | 'cc0')[];
  minDownloads?: number;
  maxDownloads?: number;
  minDuration?: number;
  maxDuration?: number;
  languages?: string[];
  formats?: string[];
  subjects?: string[];
  tags?: string[];
  collections?: string[];
  hasDescription?: boolean;
  hasMetadata?: boolean;
  isVerified?: boolean;
  sortBy?: 'downloads' | 'date' | 'title' | 'relevance';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  identifier: string;
  title: string;
  description: string;
  creator: string;
  year?: string;
  publicDate?: string;
  mediaType: string;
  downloads: number;
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  duration?: number;
  format?: string;
  licenseType: string;
  language?: string;
  archiveUrl: string;
  matchScore?: number;
}

export interface AdvancedSearchResponse {
  query: string;
  filters: AdvancedSearchFilters;
  totalResults: number;
  pageCount: number;
  currentPage: number;
  results: SearchResult[];
  facets?: {
    mediaTypes: Record<string, number>;
    creators: Record<string, number>;
    years: Record<string, number>;
    licenses: Record<string, number>;
  };
}

export interface FilterOptions {
  mediaTypes: string[];
  languages: string[];
  licenses: string[];
  collections: string[];
  formats: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers — build a Solr query string from our filter object
// ────────────────────────────────────────────────────────────────────────────

function buildQuery(keyword: string, filters: AdvancedSearchFilters): string {
  const parts: string[] = [];

  if (keyword.trim()) {
    parts.push(filters.phraseMatch ? `"${keyword}"` : `(${keyword})`);
  }

  if (filters.mediaTypes && filters.mediaTypes.length > 0) {
    const typeMap: Record<string, string> = {
      video: 'movies',
      audio: 'audio',
      image: 'image',
      document: 'texts',
      text: 'texts',
    };
    const types = filters.mediaTypes.map(t => typeMap[t] || t).join(' OR ');
    parts.push(`mediatype:(${types})`);
  } else {
    parts.push('NOT (mediatype:software OR mediatype:collection)');
  }

  if (filters.yearFrom || filters.yearTo) {
    parts.push(`date:[${filters.yearFrom ?? '*'} TO ${filters.yearTo ?? '*'}]`);
  }

  if (filters.creator) {
    parts.push(`creator:"${filters.creator}"`);
  } else if (filters.creators?.length) {
    parts.push(`creator:(${filters.creators.map(c => `"${c}"`).join(' OR ')})`);
  }

  if (filters.subjects?.length) {
    parts.push(`subject:(${filters.subjects.join(' OR ')})`);
  }

  if (filters.collections?.length) {
    parts.push(`collection:(${filters.collections.join(' OR ')})`);
  }

  if (filters.languages?.length) {
    parts.push(`language:(${filters.languages.join(' OR ')})`);
  }

  return parts.join(' AND ');
}

function sortParam(sortBy?: string): string {
  switch (sortBy) {
    case 'downloads': return 'downloads desc';
    case 'date':      return 'date desc';
    case 'title':     return 'titleSorter asc';
    default:          return '';
  }
}

function transformDoc(doc: Record<string, unknown>): SearchResult {
  const identifier = String(doc.identifier ?? '');
  const mediaType  = String(doc.mediatype ?? 'unknown');
  return {
    identifier,
    title:       String(doc.title ?? 'Untitled'),
    description: String(doc.description ?? ''),
    creator:     String(doc.creator ?? 'Unknown'),
    year:        doc.year ? String(doc.year) : undefined,
    publicDate:  doc.date ? String(doc.date) : undefined,
    mediaType,
    downloads:   Number(doc.downloads ?? 0),
    url:         `https://archive.org/details/${identifier}`,
    archiveUrl:  `https://archive.org/details/${identifier}`,
    thumbnailUrl: `https://archive.org/services/img/${identifier}`,
    licenseType: String(doc.licenseurl ?? 'public-domain'),
    language:    doc.language ? String(doc.language) : undefined,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Main service class
// ────────────────────────────────────────────────────────────────────────────

class ArchiveService {
  private readonly IA_SEARCH = 'https://archive.org/advancedsearch.php';
  private readonly FIELDS = [
    'identifier','title','description','creator','mediatype',
    'date','year','downloads','language','licenseurl','subject',
  ];

  /**
   * Advanced search — calls Internet Archive directly from the browser.
   */
  async advancedSearch(
    keyword: string,
    filters: AdvancedSearchFilters = {}
  ): Promise<AdvancedSearchResponse> {
    const q      = buildQuery(keyword, filters);
    const limit  = filters.limit  ?? 20;
    const offset = filters.offset ?? 0;
    const sort   = sortParam(filters.sortBy);

    const params = new URLSearchParams({
      q,
      output: 'json',
      rows:   String(limit),
      start:  String(offset),
    });
    this.FIELDS.forEach(f => params.append('fl[]', f));
    if (sort) params.set('sort[]', sort);

    try {
      const res  = await fetch(`${this.IA_SEARCH}?${params.toString()}`);
      if (!res.ok) throw new Error(`Archive.org returned ${res.status}`);

      const json = await res.json() as {
        response?: { numFound?: number; docs?: Record<string, unknown>[] };
      };

      const docs     = json.response?.docs ?? [];
      const numFound = json.response?.numFound ?? 0;
      const results  = docs.map(transformDoc);

      logger.info('Archive search completed', { query: keyword, numFound });

      return {
        query:        keyword,
        filters,
        totalResults: numFound,
        pageCount:    Math.ceil(numFound / limit),
        currentPage:  Math.floor(offset / limit) + 1,
        results,
      };
    } catch (error) {
      logger.error('Archive search error', error);
      throw error;
    }
  }

  /**
   * Filter options — static, no API call needed.
   */
  async getFilterOptions(): Promise<FilterOptions> {
    return {
      mediaTypes:  ['video', 'audio', 'image', 'document', 'text'],
      languages:   ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar', 'ru', 'it'],
      licenses:    ['public-domain', 'cc0', 'cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nd'],
      collections: ['community_texts', 'movingimage', 'audio', 'image', 'opensource'],
      formats:     ['mp4', 'ogv', 'mp3', 'ogg', 'jpg', 'png', 'pdf', 'epub'],
    };
  }

  /**
   * Trending searches — static curated list, no backend needed.
   */
  async getTrendingSearches(): Promise<string[]> {
    return [
      'NASA space footage',
      'silent films 1920s',
      'jazz recordings',
      'public domain books',
      'historical speeches',
      'nature documentaries',
      'vintage cartoons',
      'world music',
    ];
  }

  /**
   * Autocomplete suggestions via IA's suggest endpoint.
   */
  async getSuggestions(partial: string): Promise<string[]> {
    if (!partial.trim()) return [];
    try {
      const res = await fetch(
        `https://archive.org/suggest?q=${encodeURIComponent(partial)}&output=json`
      );
      if (!res.ok) return [];
      const json = await res.json() as [string, string[]];
      return Array.isArray(json[1]) ? json[1].slice(0, 8) : [];
    } catch {
      return [];
    }
  }

  /**
   * Full item metadata — calls backend (needs no secrets, just proxied).
   * Falls back to direct IA metadata API if backend is down.
   */
  async getItemMetadata(identifier: string): Promise<Record<string, unknown>> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/archive/${identifier}`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return (await res.json() as { data: Record<string, unknown> }).data;
    } catch { /* fall through */ }

    // Direct fallback
    const res = await fetch(`https://archive.org/metadata/${identifier}`);
    if (!res.ok) throw new Error('Failed to fetch item metadata');
    return res.json();
  }

  /**
   * Media files for an item — same backend-then-fallback pattern.
   */
  async getItemMedia(identifier: string): Promise<unknown[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/archive/${identifier}/media`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json = await res.json() as { data?: { mediaFiles?: unknown[] } };
        return json.data?.mediaFiles ?? [];
      }
    } catch { /* fall through */ }

    // Direct IA files endpoint
    const res = await fetch(`https://archive.org/metadata/${identifier}/files`);
    if (!res.ok) return [];
    const json = await res.json() as { result?: unknown[] };
    return json.result ?? [];
  }

  /**
   * Grok verification — requires backend (uses XAI_API_KEY server-side).
   */
  async verifyWithGrok(identifier: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/v1/archive/${identifier}/verify-with-grok`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to verify with Grok');
    return (await res.json() as { data: Record<string, unknown> }).data;
  }

  /**
   * Prepare for mint — requires backend.
   */
  async prepareForMint(identifier: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/v1/archive/${identifier}/prepare-for-mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to prepare for mint');
    return (await res.json() as { data: Record<string, unknown> }).data;
  }

  /**
   * Create Echo ledger — requires backend.
   */
  async createEchoLedger(identifier: string, walletAddress: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/v1/archive/${identifier}/create-echo-ledger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });
    if (!res.ok) throw new Error('Failed to create Echo ledger');
    return (await res.json() as { data: Record<string, unknown> }).data;
  }

  /**
   * Add Echo layer — requires backend.
   */
  async addEchoLayer(
    ledgerId: string,
    layerData: { content: string; mediaHash: string; creator: string; metadata?: Record<string, unknown> }
  ): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/v1/archive/echo/${ledgerId}/add-layer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(layerData),
    });
    if (!res.ok) throw new Error('Failed to add Echo layer');
    return (await res.json() as { data: Record<string, unknown> }).data;
  }
}

export const archiveService = new ArchiveService();
