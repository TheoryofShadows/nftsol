/**
 * Archive Advanced Search Form
 * Comprehensive search interface for Internet Archive with 15+ filters
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useArchiveAdvancedSearch } from '../hooks/useArchiveAdvancedSearch';
import { AdvancedSearchFilters, FilterOptions } from '../services/archiveService';
import ArchiveSearchResults from './ArchiveSearchResults';
import TrendingSearches from './TrendingSearches';
import AutocompleteSuggestions from './AutocompleteSuggestions';

interface ArchiveAdvancedSearchFormProps {
  onItemSelect?: (identifier: string) => void;
}

export const ArchiveAdvancedSearchForm: React.FC<ArchiveAdvancedSearchFormProps> = ({
  onItemSelect,
}) => {
  const {
    results,
    totalResults,
    loading,
    error,
    search,
    filterOptions,
    loadingFilterOptions,
    trending,
    suggestions,
    loadingSuggestions,
    fetchSuggestions,
  } = useArchiveAdvancedSearch();

  // Form state
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    limit: 20,
    offset: 0,
  });

  /**
   * Handle search submission
   */
  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setShowSuggestions(false);
      await search(keyword, filters);
    },
    [keyword, filters, search]
  );

  /**
   * Handle trending search click
   */
  const handleTrendingClick = useCallback(
    async (trendingKeyword: string) => {
      setKeyword(trendingKeyword);
      setShowSuggestions(false);
      await search(trendingKeyword, filters);
    },
    [filters, search]
  );

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = useCallback(
    async (suggestion: string) => {
      setKeyword(suggestion);
      setShowSuggestions(false);
      await search(suggestion, filters);
    },
    [filters, search]
  );

  /**
   * Handle keyword input change
   */
  const handleKeywordChange = useCallback(
    async (value: string) => {
      setKeyword(value);

      if (value.trim().length > 2) {
        setShowSuggestions(true);
        await fetchSuggestions(value);
      } else {
        setShowSuggestions(false);
      }
    },
    [fetchSuggestions]
  );

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback(
    (filterKey: keyof AdvancedSearchFilters, value: any) => {
      setFilters((prev) => ({
        ...prev,
        [filterKey]: value,
        offset: 0, // Reset pagination on filter change
      }));
    },
    []
  );

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setKeyword('');
    setFilters({ limit: 20, offset: 0 });
    setShowFilters(false);
    setShowSuggestions(false);
  }, []);

  /**
   * Close suggestions on escape
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Close suggestions on outside click
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Internet Archive Search</h1>
        <p className="text-gray-400">
          Discover public domain content from 20M+ items with advanced filtering
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="glass-card p-6 rounded-2xl">
          {/* Search Input */}
          <div className="relative mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for documentaries, music, videos, images, documents..."
                  value={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 pl-12 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg">
                  🔍
                </span>
              </div>
              <button
                type="submit"
                disabled={loading || !keyword.trim()}
                className="px-6 py-4 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 text-white font-semibold transition-all flex items-center gap-2"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && (
              <AutocompleteSuggestions
                suggestions={suggestions}
                loading={loadingSuggestions}
                onSelect={handleSuggestionClick}
              />
            )}
          </div>

          {/* Filter Toggle & Results Count */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all flex items-center gap-2"
              >
                ⚙️ {showFilters ? 'Hide' : 'Show'} Filters
              </button>

              {Object.keys(filters).length > 2 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            {totalResults > 0 && (
              <p className="text-sm text-gray-300">
                Found <span className="text-cyan-400 font-semibold">{totalResults}</span> results
              </p>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              filterOptions={filterOptions}
              loadingFilterOptions={loadingFilterOptions}
              onFilterChange={handleFilterChange}
            />
          )}
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
          {error}
        </div>
      )}

      {/* Trending Searches */}
      {!keyword && results.length === 0 && (
        <TrendingSearches trending={trending} onSelect={handleTrendingClick} />
      )}

      {/* Results */}
      {keyword && (
        <ArchiveSearchResults
          results={results}
          loading={loading}
          totalResults={totalResults}
          onItemSelect={onItemSelect}
        />
      )}
    </div>
  );
};

/**
 * Filter Panel Component
 */
interface FilterPanelProps {
  filters: AdvancedSearchFilters;
  filterOptions: FilterOptions | null;
  loadingFilterOptions: boolean;
  onFilterChange: (key: keyof AdvancedSearchFilters, value: any) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  filterOptions,
  loadingFilterOptions,
  onFilterChange,
}) => {
  if (loadingFilterOptions) {
    return <div className="mt-6 text-gray-400">Loading filter options...</div>;
  }

  return (
    <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Media Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Media Type</label>
        <select
          multiple
          value={filters.mediaTypes || []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (option) => option.value);
            onFilterChange('mediaTypes', selected.length > 0 ? selected : undefined);
          }}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
        >
          {filterOptions?.mediaTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* License */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">License</label>
        <select
          multiple
          value={filters.licenses || []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (option) => option.value);
            onFilterChange('licenses', selected.length > 0 ? selected : undefined);
          }}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
        >
          {filterOptions?.licenses.map((license) => (
            <option key={license} value={license}>
              {license}
            </option>
          ))}
        </select>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Language</label>
        <select
          multiple
          value={filters.languages || []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (option) => option.value);
            onFilterChange('languages', selected.length > 0 ? selected : undefined);
          }}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
        >
          {filterOptions?.languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Sort By</label>
        <select
          value={filters.sortBy || 'downloads'}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
        >
          <option value="downloads">Most Downloaded</option>
          <option value="date">Newest First</option>
          <option value="title">Title (A-Z)</option>
          <option value="relevance">Most Relevant</option>
        </select>
      </div>

      {/* Year Range */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Year From</label>
        <input
          type="number"
          value={filters.yearFrom || ''}
          onChange={(e) => onFilterChange('yearFrom', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="e.g., 1990"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Year To</label>
        <input
          type="number"
          value={filters.yearTo || ''}
          onChange={(e) => onFilterChange('yearTo', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="e.g., 2024"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
        />
      </div>

      {/* Min Downloads */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Min Downloads</label>
        <input
          type="number"
          value={filters.minDownloads || ''}
          onChange={(e) =>
            onFilterChange('minDownloads', e.target.value ? parseInt(e.target.value) : undefined)
          }
          placeholder="e.g., 100"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
        />
      </div>

      {/* Results Per Page */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Results Per Page</label>
        <select
          value={filters.limit || 20}
          onChange={(e) => onFilterChange('limit', parseInt(e.target.value))}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
};

export default ArchiveAdvancedSearchForm;
