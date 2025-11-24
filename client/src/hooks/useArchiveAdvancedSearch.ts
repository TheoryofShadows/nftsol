/**
 * useArchiveAdvancedSearch Hook
 * Advanced search for Internet Archive with comprehensive filtering
 */

import { useState, useCallback, useEffect } from 'react';
import {
  archiveService,
  AdvancedSearchFilters,
  AdvancedSearchResponse,
  FilterOptions,
  SearchResult,
} from '../services/archiveService';
import { logger } from '../utils/logger';

export interface UseArchiveAdvancedSearchOptions {
  autoFetch?: boolean;
  debounceSuggestions?: number;
}

export interface UseArchiveAdvancedSearchReturn {
  // Search results
  results: SearchResult[];
  totalResults: number;
  pageCount: number;
  currentPage: number;
  facets?: Record<string, Record<string, number>>;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  search: (keyword: string, filters?: AdvancedSearchFilters) => Promise<void>;
  refetch: () => Promise<void>;

  // Filter helpers
  filterOptions: FilterOptions | null;
  loadingFilterOptions: boolean;

  // Trending & suggestions
  trending: string[];
  suggestions: string[];
  loadingTrending: boolean;
  loadingSuggestions: boolean;
  fetchSuggestions: (partial: string) => Promise<void>;

  // Current search state
  currentKeyword: string;
  currentFilters: AdvancedSearchFilters;
}

export function useArchiveAdvancedSearch(
  options: UseArchiveAdvancedSearchOptions = {}
): UseArchiveAdvancedSearchReturn {
  const { autoFetch: _autoFetch = false, debounceSuggestions: _debounceSuggestions = 300 } = options;

  // Search results
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [facets, setFacets] = useState<Record<string, Record<string, number>>>();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);

  // Trending & suggestions
  const [trending, setTrending] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Current search state
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentFilters, setCurrentFilters] = useState<AdvancedSearchFilters>({});

  // Debounce timer for suggestions
  useEffect(() => {
    let suggestionsTimer: NodeJS.Timeout | undefined;

    return () => {
      if (suggestionsTimer) {
        clearTimeout(suggestionsTimer);
      }
    };
  }, []);

  /**
   * Load filter options
   */
  const loadFilterOptions = useCallback(async () => {
    if (filterOptions) return; // Already loaded

    setLoadingFilterOptions(true);
    try {
      const options = await archiveService.getFilterOptions();
      setFilterOptions(options);
      logger.info('Filter options loaded');
    } catch (err) {
      logger.error('Failed to load filter options', err);
    } finally {
      setLoadingFilterOptions(false);
    }
  }, [filterOptions]);

  /**
   * Load trending searches
   */
  const loadTrending = useCallback(async () => {
    setLoadingTrending(true);
    try {
      const trendingSearches = await archiveService.getTrendingSearches();
      setTrending(trendingSearches);
      logger.info('Trending searches loaded', { count: trendingSearches.length });
    } catch (err) {
      logger.error('Failed to load trending searches', err);
    } finally {
      setLoadingTrending(false);
    }
  }, []);

  /**
   * Fetch autocomplete suggestions
   */
  const fetchSuggestions = useCallback(async (partial: string) => {
    if (!partial.trim()) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const sug = await archiveService.getSuggestions(partial);
      setSuggestions(sug);
    } catch (err) {
      logger.error('Failed to fetch suggestions', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  /**
   * Perform advanced search
   */
  const search = useCallback(async (keyword: string, filters?: AdvancedSearchFilters) => {
    if (!keyword.trim()) {
      setError('Please enter a search keyword');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: AdvancedSearchResponse = await archiveService.advancedSearch(
        keyword,
        filters || {}
      );

      setResults(response.results);
      setTotalResults(response.totalResults);
      setPageCount(response.pageCount);
      setCurrentPage(response.currentPage);
      setFacets(response.facets);
      setCurrentKeyword(keyword);
      setCurrentFilters(filters || {});

      logger.info('Advanced search completed', {
        keyword,
        resultCount: response.results.length,
        total: response.totalResults,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      logger.error('Advanced search error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetch current search
   */
  const refetch = useCallback(async () => {
    if (!currentKeyword) return;
    await search(currentKeyword, currentFilters);
  }, [currentKeyword, currentFilters, search]);

  /**
   * Load filter options and trending on mount
   */
  useEffect(() => {
    loadFilterOptions();
    loadTrending();
  }, [loadFilterOptions, loadTrending]);

  return {
    // Search results
    results,
    totalResults,
    pageCount,
    currentPage,
    facets,

    // State
    loading,
    error,

    // Actions
    search,
    refetch,

    // Filter helpers
    filterOptions,
    loadingFilterOptions,

    // Trending & suggestions
    trending,
    suggestions,
    loadingTrending,
    loadingSuggestions,
    fetchSuggestions,

    // Current search state
    currentKeyword,
    currentFilters,
  };
}
