/**
 * 🔍 Internet Archive Advanced Search
 *
 * Comprehensive filtering system for discovering content:
 * - Keywords and phrase search
 * - Date range filtering
 * - Media type filtering
 * - Duration filtering (videos/audio)
 * - Creator/Author filtering
 * - License type filtering
 * - Popularity/Downloads filtering
 * - Language filtering
 * - File format filtering
 * - Collection filtering
 * - And more...
 */

import logger from '../utils/logger';
import axios from 'axios';

// archive.org serves its advanced search via a Solr-style endpoint that expects
// repeated-array params to use bracket notation (`fl[]=a&fl[]=b`). Axios does
// not do this by default — it emits `fl=a&fl=b` — which archive.org silently
// ignores, and it has also been observed to gate requests from cloud provider
// IPs without a proper User-Agent, returning an HTML error page that makes
// `response.data.response` undefined (→ 0 results, no thrown error).
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

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AdvancedSearchFilters {
  // Basic Search
  keyword?: string;
  phraseMatch?: string; // Exact phrase

  // Media Type
  mediaTypes?: ('video' | 'audio' | 'image' | 'document' | 'text')[];

  // Date Range
  yearFrom?: number;
  yearTo?: number;
  dateAddedFrom?: string; // ISO date: YYYY-MM-DD
  dateAddedTo?: string;

  // Creator/Author
  creator?: string;
  creators?: string[];

  // License
  licenses?: ('public-domain' | 'cc-by' | 'cc-by-sa' | 'cc-by-nd' | 'cc-by-nc' | 'cc0')[];

  // Popularity
  minDownloads?: number;
  maxDownloads?: number;
  sortBy?: 'downloads' | 'date' | 'title' | 'relevance';

  // Duration (for video/audio)
  minDuration?: number; // seconds
  maxDuration?: number;

  // Language
  languages?: string[]; // ISO 639-1 codes: en, es, fr, etc.

  // File Format
  formats?: string[]; // mp4, pdf, jpg, etc.

  // Subject/Tags
  subjects?: string[];
  tags?: string[];

  // Collection
  collections?: string[]; // community_texts, movingimage, audio, etc.

  // Quality/Special Filters
  hasDescription?: boolean;
  hasMetadata?: boolean;
  isVerified?: boolean; // Verified archive item

  // Pagination
  limit?: number; // 1-100
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

// ============================================================================
// ADVANCED SEARCH SERVICE
// ============================================================================

export class ArchiveAdvancedSearchService {
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
   * 🔍 MAIN: Advanced search with comprehensive filters
   * Builds complex query from filter parameters
   */
  async advancedSearch(
    keyword: string,
    filters: AdvancedSearchFilters = {}
  ): Promise<AdvancedSearchResponse> {
    try {
      const query = this.buildAdvancedQuery(keyword, filters);
      const params = this.buildSearchParams(query, filters);

      const response = await this.apiClient.get(this.searchUrl, { params });

      // archive.org sometimes responds 200 with an HTML interstitial (string)
      // instead of JSON. Treat that as a hard failure so the caller sees it
      // instead of silently returning an empty result set.
      if (!response.data || typeof response.data !== 'object' || !response.data.response) {
        logger.error('Advanced search returned unexpected payload', {
          contentType: response.headers?.['content-type'],
          query: params.q,
          sample:
            typeof response.data === 'string'
              ? response.data.slice(0, 200)
              : JSON.stringify(response.data).slice(0, 200),
        });
        throw new Error('Archive.org returned an unexpected response');
      }

      const docs = response.data.response.docs || [];
      const results = docs.map((doc: any) => this.transformSearchResult(doc));
      const numFound = response.data.response.numFound || 0;
      const limit = filters.limit || 20;

      return {
        query: keyword,
        filters,
        totalResults: numFound,
        pageCount: Math.ceil(numFound / limit),
        currentPage: Math.floor((filters.offset || 0) / limit) + 1,
        results,
        facets: response.data.facets,
      };
    } catch (error) {
      logger.error('Advanced search failed:', error);
      throw new Error(`Advanced search failed: ${error}`);
    }
  }

  /**
   * Build advanced query from filters
   */
  private buildAdvancedQuery(keyword: string, filters: AdvancedSearchFilters): string[] {
    const queryParts: string[] = [];

    // Keyword/Phrase search
    if (keyword && keyword.trim()) {
      if (filters.phraseMatch) {
        // Exact phrase search
        queryParts.push(`"${keyword}"`);
      } else {
        // Standard keyword search (any word)
        queryParts.push(`(${keyword})`);
      }
    }

    // Media type filter
    if (filters.mediaTypes && filters.mediaTypes.length > 0) {
      const types = filters.mediaTypes
        .map(t => {
          const typeMap: Record<string, string> = {
            video: 'video',
            audio: 'audio',
            image: 'image',
            document: 'texts',
            text: 'texts',
          };
          return typeMap[t] || t;
        })
        .join(' OR ');
      queryParts.push(`(mediatype:(${types}))`);
    } else {
      // Default: exclude software and interactive items
      queryParts.push('NOT (mediatype:software OR mediatype:collection)');
    }

    // Date range filter
    if (filters.yearFrom || filters.yearTo) {
      const from = filters.yearFrom || '*';
      const to = filters.yearTo || '*';
      queryParts.push(`date:[${from} TO ${to}]`);
    }

    // Creator/Author filter
    if (filters.creator) {
      queryParts.push(`creator:"${filters.creator}"`);
    } else if (filters.creators && filters.creators.length > 0) {
      const creators = filters.creators.map(c => `"${c}"`).join(' OR ');
      queryParts.push(`(creator:(${creators}))`);
    }

    // License filter
    if (filters.licenses && filters.licenses.length > 0) {
      const licenses = filters.licenses
        .map(l => {
          const licenseMap: Record<string, string> = {
            'public-domain': 'public domain',
            'cc-by': 'creativecommons.org/licenses/by',
            'cc-by-sa': 'creativecommons.org/licenses/by-sa',
            'cc-by-nd': 'creativecommons.org/licenses/by-nd',
            'cc-by-nc': 'creativecommons.org/licenses/by-nc',
            cc0: 'creativecommons.org/publicdomain/zero',
          };
          return `"${licenseMap[l] || l}"`;
        })
        .join(' OR ');
      queryParts.push(`(licenseurl:(${licenses}))`);
    }

    // Language filter
    if (filters.languages && filters.languages.length > 0) {
      const langs = filters.languages.map(l => `"${l}"`).join(' OR ');
      queryParts.push(`(language:(${langs}))`);
    }

    // Format filter
    if (filters.formats && filters.formats.length > 0) {
      const formats = filters.formats.map(f => `"${f}"`).join(' OR ');
      queryParts.push(`(format:(${formats}))`);
    }

    // Subject/Tags filter
    if (filters.subjects && filters.subjects.length > 0) {
      const subjects = filters.subjects.map(s => `"${s}"`).join(' OR ');
      queryParts.push(`(subject:(${subjects}))`);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tags = filters.tags.map(t => `"${t}"`).join(' OR ');
      queryParts.push(`(tags:(${tags}))`);
    }

    // Collection filter
    if (filters.collections && filters.collections.length > 0) {
      const collections = filters.collections.map(c => `"${c}"`).join(' OR ');
      queryParts.push(`(collection:(${collections}))`);
    }

    // Downloads/Popularity filter
    if (filters.minDownloads !== undefined || filters.maxDownloads !== undefined) {
      const min = filters.minDownloads || 0;
      const max = filters.maxDownloads || Number.MAX_SAFE_INTEGER;
      queryParts.push(`downloads:[${min} TO ${max}]`);
    }

    return queryParts;
  }

  /**
   * Build search parameters for API call
   */
  private buildSearchParams(
    queryParts: string[],
    filters: AdvancedSearchFilters
  ): Record<string, any> {
    return {
      q: queryParts.join(' AND '),
      fl: [
        'identifier',
        'title',
        'description',
        'creator',
        'date',
        'publicdate',
        'mediatype',
        'downloads',
        'language',
        'format',
        'licenseurl',
        'subject',
        'collection',
        'runtime',
        'year',
      ],
      output: 'json',
      rows: Math.min(filters.limit || 20, 100),
      start: filters.offset || 0,
      sort: this.mapSortField(filters.sortBy || 'downloads'),
      // Request facets for filtering
      'facet': 'true',
      'facet.field': ['mediatype', 'creator', 'year', 'licenseurl'],
      'facet.limit': 10,
    };
  }

  /**
   * Map sort field to Archive API field
   */
  private mapSortField(sortBy: string): string {
    const sortMap: Record<string, string> = {
      downloads: 'downloads desc',
      date: 'publicdate desc',
      title: 'title asc',
      relevance: 'score desc',
    };
    return sortMap[sortBy] || sortMap.downloads;
  }

  /**
   * Transform raw API result to SearchResult
   */
  private transformSearchResult(doc: any): SearchResult {
    return {
      identifier: doc.identifier,
      title: doc.title || 'Untitled',
      description: doc.description || '',
      creator: Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || 'Unknown',
      year: doc.year || doc.date?.split('-')[0],
      publicDate: doc.publicdate || doc.date,
      mediaType: this.inferMediaType(doc.mediatype),
      downloads: parseInt(doc.downloads || '0'),
      url: `${this.baseUrl}/download/${doc.identifier}`,
      thumbnailUrl: `${this.baseUrl}/services/img/${doc.identifier}`,
      language: Array.isArray(doc.language) ? doc.language[0] : doc.language,
      format: Array.isArray(doc.format) ? doc.format[0] : doc.format,
      licenseType: this.extractLicenseType(
        Array.isArray(doc.licenseurl) ? doc.licenseurl[0] : doc.licenseurl
      ),
      archiveUrl: `${this.baseUrl}/details/${doc.identifier}`,
    };
  }

  /**
   * Infer media type from mediatype field
   */
  private inferMediaType(mediatype: string): string {
    if (!mediatype) return 'unknown';
    const lower = mediatype.toLowerCase();
    if (lower.includes('video') || lower === 'movingimage') return 'video';
    if (lower.includes('audio') || lower === 'audio') return 'audio';
    if (lower.includes('image')) return 'image';
    if (lower.includes('text') || lower === 'texts') return 'document';
    return mediatype;
  }

  /**
   * Extract license type from license URL
   */
  private extractLicenseType(licenseUrl?: string): string {
    if (!licenseUrl) return 'unknown';
    const lower = licenseUrl.toLowerCase();
    if (lower.includes('public-domain') || lower.includes('publicdomain'))
      return 'public-domain';
    if (lower.includes('by-sa')) return 'cc-by-sa';
    if (lower.includes('by-nd')) return 'cc-by-nd';
    if (lower.includes('by-nc')) return 'cc-by-nc';
    if (lower.includes('by')) return 'cc-by';
    if (lower.includes('zero') || lower.includes('cc0')) return 'cc0';
    return 'other';
  }

  /**
   * Get available filter options (facets)
   * Used to populate filter dropdowns
   */
  async getFilterOptions(): Promise<{
    mediaTypes: string[];
    languages: string[];
    licenses: string[];
    collections: string[];
    formats: string[];
  }> {
    return {
      mediaTypes: ['video', 'audio', 'image', 'document', 'text'],
      languages: [
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'ru',
        'ja',
        'zh',
        'ar',
        'hi',
        'ko',
        'other',
      ],
      licenses: ['public-domain', 'cc-by', 'cc-by-sa', 'cc-by-nd', 'cc-by-nc', 'cc0'],
      collections: [
        'community_texts',
        'movingimage',
        'audio',
        'web',
        'community_software',
        'opensource_audio',
        'texts',
      ],
      formats: ['mp4', 'webm', 'ogv', 'mp3', 'ogg', 'flac', 'wav', 'jpg', 'png', 'gif', 'pdf', 'epub'],
    };
  }

  /**
   * Popular searches/trending
   */
  async getTrendingSearches(): Promise<string[]> {
    return [
      'documentaries',
      'educational',
      'historical',
      'music',
      'speeches',
      'nature',
      'science',
      'art',
      'literature',
      'technology',
    ];
  }

  /**
   * Suggested searches based on keyword
   */
  async getSuggestions(partial: string): Promise<string[]> {
    // In production, could query Archive's search suggestions
    const suggestions = [
      'documentary films',
      'educational videos',
      'historical photographs',
      'music recordings',
      'speeches and lectures',
      'nature documentaries',
      'science videos',
      'public domain art',
      'classic literature',
      'technical manuals',
    ];

    return suggestions.filter(s => s.includes(partial.toLowerCase())).slice(0, 5);
  }
}

export default ArchiveAdvancedSearchService;
