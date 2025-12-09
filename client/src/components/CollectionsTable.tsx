/**
 * Professional Collections Table
 * Matches Magic Eden's marketplace display
 */

import React, { useState } from 'react';

export interface Collection {
  id: string;
  name: string;
  image: string;
  floorPrice: number;
  volume24h: number;
  priceChange24h: number;
  listedCount: number;
  salesCount24h: number;
  holders: number;
}

interface CollectionsTableProps {
  collections: Collection[];
  onCollectionClick?: (collection: Collection) => void;
  loading?: boolean;
}

type SortField = 'floorPrice' | 'volume24h' | 'priceChange24h' | 'listedCount' | 'salesCount24h';
type SortDirection = 'asc' | 'desc';

// Sort icon component (moved outside to avoid recreation on render)
const SortIcon: React.FC<{
  field: SortField;
  currentField: SortField;
  direction: SortDirection
}> = ({ field, currentField, direction }) => {
  if (currentField !== field) {
    return <span className="text-gray-500">⇅</span>;
  }
  return <span className="text-purple-400">{direction === 'desc' ? '↓' : '↑'}</span>;
};

export const CollectionsTable: React.FC<CollectionsTableProps> = ({
  collections,
  onCollectionClick,
  loading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Sort collections
  const sortedCollections = [...collections].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal !== 'number' || typeof bVal !== 'number') return 0;

    return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No collections found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-300">Collection</th>
            <th
              className="text-right px-4 py-4 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
              onClick={() => handleSort('floorPrice')}
            >
              <div className="flex items-center justify-end gap-2">
                Floor Price <SortIcon field="floorPrice" currentField={sortField} direction={sortDirection} />
              </div>
            </th>
            <th
              className="text-right px-4 py-4 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
              onClick={() => handleSort('volume24h')}
            >
              <div className="flex items-center justify-end gap-2">
                24h Volume <SortIcon field="volume24h" currentField={sortField} direction={sortDirection} />
              </div>
            </th>
            <th
              className="text-right px-4 py-4 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
              onClick={() => handleSort('priceChange24h')}
            >
              <div className="flex items-center justify-end gap-2">
                24h Change <SortIcon field="priceChange24h" currentField={sortField} direction={sortDirection} />
              </div>
            </th>
            <th
              className="text-right px-4 py-4 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
              onClick={() => handleSort('listedCount')}
            >
              <div className="flex items-center justify-end gap-2">
                Listed <SortIcon field="listedCount" currentField={sortField} direction={sortDirection} />
              </div>
            </th>
            <th
              className="text-right px-4 py-4 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
              onClick={() => handleSort('salesCount24h')}
            >
              <div className="flex items-center justify-end gap-2">
                Sales <SortIcon field="salesCount24h" currentField={sortField} direction={sortDirection} />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCollections.map((collection) => (
            <tr
              key={collection.id}
              onClick={() => onCollectionClick?.(collection)}
              className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
            >
              {/* Collection Name & Image */}
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-10 h-10 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                    }}
                  />
                  <div>
                    <p className="font-medium text-white text-sm">{collection.name}</p>
                    <p className="text-xs text-gray-500">{collection.holders.toLocaleString()} holders</p>
                  </div>
                </div>
              </td>

              {/* Floor Price */}
              <td className="px-4 py-4 text-right">
                <p className="font-medium text-white text-sm">
                  ◎ {collection.floorPrice.toFixed(2)}
                </p>
              </td>

              {/* 24h Volume */}
              <td className="px-4 py-4 text-right">
                <p className="font-medium text-white text-sm">
                  ◎ {(collection.volume24h / 1000).toFixed(1)}K
                </p>
              </td>

              {/* 24h Change */}
              <td className="px-4 py-4 text-right">
                <span
                  className={`font-medium text-sm px-2 py-1 rounded ${
                    collection.priceChange24h >= 0
                      ? 'text-green-400 bg-green-500/10'
                      : 'text-red-400 bg-red-500/10'
                  }`}
                >
                  {collection.priceChange24h >= 0 ? '+' : ''}
                  {collection.priceChange24h.toFixed(2)}%
                </span>
              </td>

              {/* Listed Count */}
              <td className="px-4 py-4 text-right">
                <p className="font-medium text-white text-sm">
                  {collection.listedCount.toLocaleString()}
                </p>
              </td>

              {/* Sales Count */}
              <td className="px-4 py-4 text-right">
                <p className="font-medium text-white text-sm">
                  {collection.salesCount24h.toLocaleString()}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CollectionsTable;
