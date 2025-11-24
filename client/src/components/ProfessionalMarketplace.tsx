/**
 * Professional NFT Marketplace
 * Magic Eden-style marketplace with collections table, featured carousel, and filters
 */

import React, { useState, useEffect } from 'react';
import CollectionsTable, { Collection } from './CollectionsTable';
import FeaturedCarousel, { FeaturedCollection } from './FeaturedCarousel';
import MarketMetrics, { Metric } from './MarketMetrics';

type TimeFilter = '1h' | '6h' | '24h' | '7d' | '30d';

interface ProfessionalMarketplaceProps {
  collections: Collection[];
  loading?: boolean;
  onCollectionClick?: (collection: Collection) => void;
}

export const ProfessionalMarketplace: React.FC<ProfessionalMarketplaceProps> = ({
  collections,
  loading = false,
  onCollectionClick,
}) => {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('24h');
  const [trendingCollections, setTrendingCollections] = useState<FeaturedCollection[]>([]);
  const [topMovers, setTopMovers] = useState<Metric[]>([]);

  // Generate sample featured collections and trending data from available collections
  useEffect(() => {
    if (collections.length > 0) {
      // Featured collections: top 5 by volume
      const featured = [...collections]
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          name: c.name,
          image: c.image,
          floorPrice: c.floorPrice,
          volume24h: c.volume24h,
          priceChange24h: c.priceChange24h,
          description: `${c.listedCount.toLocaleString()} listed • ${c.holders.toLocaleString()} holders`,
        }));

      setTrendingCollections(featured);

      // Top movers: collections with biggest price changes (both up and down)
      const movers = [...collections]
        .sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h))
        .slice(0, 8)
        .map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.priceChange24h >= 0 ? '📈' : '📉',
          value: c.floorPrice,
          change: c.priceChange24h,
          trend: (
            c.priceChange24h > 5 ? 'up' : c.priceChange24h < -5 ? 'down' : 'stable'
          ) as 'up' | 'down' | 'stable',
          description: `Floor: ◎${c.floorPrice.toFixed(2)}`,
        }));

      setTopMovers(movers);
    }
  }, [collections]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        <span className="ml-4 text-gray-300 text-lg">Loading marketplace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header with Search and Filters */}
      <div className="space-y-4">
        {/* Title and Description */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">NFT Marketplace</h1>
          <p className="text-gray-400">
            Browse and trade {collections.length.toLocaleString()} professional NFT collections
          </p>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {(['1h', '6h', '24h', '7d', '30d'] as TimeFilter[]).map((time) => (
            <button
              key={time}
              onClick={() => setSelectedTimeFilter(time)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedTimeFilter === time
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {time}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search collections..."
            className="w-full px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all"
          />
          <svg
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Featured Collections Carousel */}
      {trendingCollections.length > 0 && (
        <section>
          <FeaturedCarousel
            collections={trendingCollections}
            onCollectionSelect={(c) => onCollectionClick?.({ ...c, listedCount: 0, salesCount24h: 0, holders: 0 } as Collection)}
            autoScroll={true}
            scrollInterval={6000}
          />
        </section>
      )}

      {/* Top Movers Section */}
      {topMovers.length > 0 && (
        <section className="border-t border-white/10 pt-12">
          <MarketMetrics
            title="🔥 Biggest Movers"
            subtitle="Collections with the most significant price changes"
            metrics={topMovers}
            variant="movers"
          />
        </section>
      )}

      {/* Collections Table */}
      <section className="border-t border-white/10 pt-12">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">All Collections</h2>
          <p className="text-gray-400">
            Sorted by {selectedTimeFilter} trading volume
          </p>
        </div>

        {collections.length > 0 ? (
          <CollectionsTable
            collections={collections}
            onCollectionClick={onCollectionClick}
            loading={loading}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No collections available</p>
          </div>
        )}
      </section>

      {/* Market Stats Footer */}
      <section className="border-t border-white/10 pt-12 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Total Volume (24h)</div>
            <div className="text-2xl font-bold text-white">
              ◎ {collections.reduce((sum, c) => sum + c.volume24h, 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Total Sales (24h)</div>
            <div className="text-2xl font-bold text-white">
              {collections.reduce((sum, c) => sum + c.salesCount24h, 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Total Listed</div>
            <div className="text-2xl font-bold text-white">
              {collections.reduce((sum, c) => sum + c.listedCount, 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Active Holders</div>
            <div className="text-2xl font-bold text-white">
              {collections.reduce((sum, c) => sum + c.holders, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfessionalMarketplace;
