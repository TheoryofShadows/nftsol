import React, { useState } from 'react';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  onClear: () => void;
}

export interface FilterOptions {
  priceMin: number | '';
  priceMax: number | '';
  rarity: string;
  sortBy: 'price-asc' | 'price-desc' | 'newest' | 'oldest';
}

export default function SearchFilters({ onSearch, onFilterChange, onClear }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    priceMin: '',
    priceMax: '',
    rarity: '',
    sortBy: 'newest',
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    setSearchQuery('');
    setFilters({
      priceMin: '',
      priceMax: '',
      rarity: '',
      sortBy: 'newest',
    });
    onClear();
  };

  return (
    <div className="glass-card p-6 mb-6">
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search NFTs by name, description, or creator..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'} ⚙️
        </button>
        {(searchQuery || filters.priceMin || filters.priceMax || filters.rarity) && (
          <button
            onClick={handleClear}
            className="px-6 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Min Price (SOL)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.01"
              value={filters.priceMin}
              onChange={(e) => handleFilterChange('priceMin', e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Max Price (SOL)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="100"
              value={filters.priceMax}
              onChange={(e) => handleFilterChange('priceMax', e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Rarity */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Rarity</label>
            <select
              value={filters.rarity}
              onChange={(e) => handleFilterChange('rarity', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Rarities</option>
              <option value="common">📦 Common</option>
              <option value="rare">⭐ Rare</option>
              <option value="epic">💎 Epic</option>
              <option value="legendary">👑 Legendary</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="newest">🆕 Newest</option>
              <option value="oldest">📅 Oldest</option>
              <option value="price-asc">💰 Price: Low to High</option>
              <option value="price-desc">💰 Price: High to Low</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

