/**
 * Archive Search Results Component
 * Display search results with item cards
 */

import React, { useState } from 'react';
import { SearchResult } from '../services/archiveService';
import ArchiveItemCard from './ArchiveItemCard';
import ArchiveItemModal from './ArchiveItemModal';

interface ArchiveSearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  totalResults: number;
  onItemSelect?: (identifier: string) => void;
}

export const ArchiveSearchResults: React.FC<ArchiveSearchResultsProps> = ({
  results,
  loading,
  totalResults,
  onItemSelect,
}) => {
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

  const handleItemClick = (item: SearchResult) => {
    setSelectedItem(item);
    onItemSelect?.(item.identifier);
  };

  if (loading) {
    return (
      <div className="glass-card p-12 rounded-2xl text-center">
        <div className="inline-block">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400">Searching Internet Archive...</p>
          <div className="mt-4 flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="glass-card p-12 rounded-2xl text-center">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
        <p className="text-gray-400">Try different keywords or adjust your filters</p>
      </div>
    );
  }

  return (
    <>
      {/* Results Header */}
      <div className="mb-6">
        <p className="text-gray-300">
          Showing <span className="text-cyan-400 font-semibold">{results.length}</span> of{' '}
          <span className="text-cyan-400 font-semibold">{totalResults}</span> results
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {results.map((result) => (
          <ArchiveItemCard
            key={result.identifier}
            item={result}
            onClick={() => handleItemClick(result)}
          />
        ))}
      </div>

      {/* Item Details Modal */}
      {selectedItem && <ArchiveItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </>
  );
};

export default ArchiveSearchResults;
