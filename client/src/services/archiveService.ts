/**
 * Archive Service
 * API integration for Internet Archive advanced search with 15+ filters
 */

import { API_BASE } from '../config/api';
import { logger } from '../utils/logger';

export interface AdvancedSearchFilters {
  keyword?: string;
  phraseMatch?: boolean;
  mediaTypes?: ('video' | 'audio' | 'image' | 'document' | 'text')[];
  yearFrom?: number;
  yearTo?: number;
  dateAddedFrom?: string; // ISO date: YYYY-MM-DD
  dateAddedTo?: string;
  creator?: string;
  creators?: string[];
  licenses?: ('public-domain' | 'cc-by' | 'cc-by-sa' | 'cc-by-nd' | 'cc-by-nc' | 'cc0')[];
  minDownloads?: number;
  maxDownloads?: number;
  minDuration?: number; // seconds
  maxDuration?: number;
  languages?: string[]; // ISO 639-1 codes: en, es, fr, etc.
  formats?: string[]; // mp4, pdf, jpg, etc.
  subjects?: string[];
  tags?: string[];
  collections?: string[];
  hasDescription?: boolean;
  hasMetadata?: boolean;
  isVerified?: boolean;
  sortBy?: 'downloads' | 'date' | 'title' | 'relevance';
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

export interface FilterOptions {
  mediaTypes: string[];
  languages: string[];
  licenses: string[];
  collections: string[];
  formats: string[];
}

class ArchiveService {
  private apiBase = API_BASE;

  /**
   * Advanced search with comprehensive filters
   */
  async advancedSearch(
    keyword: string,
    filters: AdvancedSearchFilters = {}
  ): Promise<AdvancedSearchResponse> {
    try {
      const response = await fetch(`${this.apiBase}/api/archive/advanced-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          ...filters,
        }),
      });

      if (!response.ok) {
        throw new Error(`Archive search failed: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('Archive advanced search completed', {
        query: keyword,
        results: data.data?.results?.length || 0,
      });

      return data.data;
    } catch (error) {
      logger.error('Archive advanced search error', error);
      throw error;
    }
  }

  /**
   * Get available filter options for UI dropdowns
   */
  async getFilterOptions(): Promise<FilterOptions> {
    try {
      const response = await fetch(`${this.apiBase}/api/archive/filter-options`);

      if (!response.ok) {
        throw new Error('Failed to fetch filter options');
      }

      const data = await response.json();
      logger.info('Filter options fetched');

      return data.data;
    } catch (error) {
      logger.error('Failed to fetch filter options', error);
      throw error;
    }
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiBase}/api/archive/trending`);

      if (!response.ok) {
        throw new Error('Failed to fetch trending searches');
      }

      const data = await response.json();
      logger.info('Trending searches fetched', {
        count: data.data?.length || 0,
      });

      return data.data || [];
    } catch (error) {
      logger.error('Failed to fetch trending searches', error);
      return [];
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getSuggestions(partial: string): Promise<string[]> {
    try {
      const params = new URLSearchParams({ q: partial });
      const response = await fetch(`${this.apiBase}/api/archive/suggestions?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      logger.info('Suggestions fetched', {
        query: partial,
        count: data.data?.length || 0,
      });

      return data.data || [];
    } catch (error) {
      logger.error('Failed to fetch suggestions', error);
      return [];
    }
  }

  /**
   * Get full metadata for an item
   */
  async getItemMetadata(identifier: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiBase}/api/archive/${identifier}`);

      if (!response.ok) {
        throw new Error('Failed to fetch item metadata');
      }

      const data = await response.json();
      logger.info('Item metadata fetched', { identifier });

      return data.data;
    } catch (error) {
      logger.error('Failed to fetch item metadata', error);
      throw error;
    }
  }

  /**
   * Get all media files for an item
   */
  async getItemMedia(identifier: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBase}/api/archive/${identifier}/media`);

      if (!response.ok) {
        throw new Error('Failed to fetch item media');
      }

      const data = await response.json();
      logger.info('Item media fetched', {
        identifier,
        mediaCount: data.data?.length || 0,
      });

      return data.data || [];
    } catch (error) {
      logger.error('Failed to fetch item media', error);
      throw error;
    }
  }

  /**
   * Verify item with Grok AI
   */
  async verifyWithGrok(identifier: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiBase}/api/archive/${identifier}/verify-with-grok`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to verify with Grok');
      }

      const data = await response.json();
      logger.info('Grok verification completed', { identifier });

      return data.data;
    } catch (error) {
      logger.error('Grok verification error', error);
      throw error;
    }
  }

  /**
   * Prepare item for minting
   */
  async prepareForMint(identifier: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiBase}/api/archive/${identifier}/prepare-for-mint`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to prepare for mint');
      }

      const data = await response.json();
      logger.info('Prepared for minting', { identifier });

      return data.data;
    } catch (error) {
      logger.error('Prepare for mint error', error);
      throw error;
    }
  }

  /**
   * Create Echo ledger from archive item
   */
  async createEchoLedger(identifier: string, walletAddress: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiBase}/api/archive/${identifier}/create-echo-ledger`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create Echo ledger');
      }

      const data = await response.json();
      logger.info('Echo ledger created', { identifier });

      return data.data;
    } catch (error) {
      logger.error('Create Echo ledger error', error);
      throw error;
    }
  }

  /**
   * Add layer to Echo ledger
   */
  async addEchoLayer(
    ledgerId: string,
    layerData: {
      content: string;
      mediaHash: string;
      creator: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiBase}/api/archive/echo/${ledgerId}/add-layer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(layerData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add Echo layer');
      }

      const data = await response.json();
      logger.info('Echo layer added', { ledgerId });

      return data.data;
    } catch (error) {
      logger.error('Add Echo layer error', error);
      throw error;
    }
  }
}

export const archiveService = new ArchiveService();
