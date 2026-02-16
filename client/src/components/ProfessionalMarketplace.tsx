/**
 * Professional NFT Marketplace
 * Premium luxury design with gold accents
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

  useEffect(() => {
    if (collections.length > 0) {
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
          description: `${c.listedCount.toLocaleString()} listed \u2022 ${c.holders.toLocaleString()} holders`,
        }));

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTrendingCollections(featured);

      const movers = [...collections]
        .sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h))
        .slice(0, 8)
        .map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.priceChange24h >= 0 ? '\u2191' : '\u2193',
          value: c.floorPrice,
          change: c.priceChange24h,
          trend: (
            c.priceChange24h > 5 ? 'up' : c.priceChange24h < -5 ? 'down' : 'stable'
          ) as 'up' | 'down' | 'stable',
          description: `Floor: \u25CE${c.floorPrice.toFixed(2)}`,
        }));

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTopMovers(movers);
    }
  }, [collections]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-2 border-[#1e1e1e] border-t-[#c9a84c] rounded-full animate-spin"></div>
        <span className="ml-4 text-zinc-400 text-sm">Loading marketplace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1.5 font-display">NFT Marketplace</h1>
          <p className="text-zinc-500 text-sm">
            Browse and trade {collections.length.toLocaleString()} professional NFT collections
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex flex-wrap gap-2">
          {(['1h', '6h', '24h', '7d', '30d'] as TimeFilter[]).map((time) => (
            <button
              key={time}
              onClick={() => setSelectedTimeFilter(time)}
              className={`px-4 py-2 rounded-md font-medium text-xs transition-all ${
                selectedTimeFilter === time
                  ? 'bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/20'
                  : 'bg-[#111111] border border-[#1e1e1e] text-zinc-400 hover:text-white hover:border-[#2a2a2a]'
              }`}
            >
              {time}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search collections..."
            className="w-full px-5 py-3 bg-[#111111] border border-[#1e1e1e] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
          />
          <svg
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500"
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

      {/* Featured Carousel */}
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

      {/* Top Movers */}
      {topMovers.length > 0 && (
        <section className="border-t border-[#1e1e1e] pt-12">
          <MarketMetrics
            title="Biggest Movers"
            subtitle="Collections with the most significant price changes"
            metrics={topMovers}
            variant="movers"
          />
        </section>
      )}

      {/* Collections Table */}
      <section className="border-t border-[#1e1e1e] pt-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1.5 font-display">All Collections</h2>
          <p className="text-zinc-500 text-sm">
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
            <p className="text-zinc-500 text-sm">No collections available</p>
          </div>
        )}
      </section>

      {/* Market Stats Footer */}
      <section className="border-t border-[#1e1e1e] pt-12 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-[#111111] border border-[#1e1e1e] rounded-lg">
            <div className="text-zinc-500 text-[10px] mb-1 uppercase tracking-wider">Total Volume (24h)</div>
            <div className="text-xl font-bold text-white">
              {collections.reduce((sum, c) => sum + c.volume24h, 0).toLocaleString()} SOL
            </div>
          </div>
          <div className="p-4 bg-[#111111] border border-[#1e1e1e] rounded-lg">
            <div className="text-zinc-500 text-[10px] mb-1 uppercase tracking-wider">Total Sales (24h)</div>
            <div className="text-xl font-bold text-white">
              {collections.reduce((sum, c) => sum + c.salesCount24h, 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-[#111111] border border-[#1e1e1e] rounded-lg">
            <div className="text-zinc-500 text-[10px] mb-1 uppercase tracking-wider">Total Listed</div>
            <div className="text-xl font-bold text-white">
              {collections.reduce((sum, c) => sum + c.listedCount, 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-[#111111] border border-[#1e1e1e] rounded-lg">
            <div className="text-zinc-500 text-[10px] mb-1 uppercase tracking-wider">Active Holders</div>
            <div className="text-xl font-bold text-white">
              {collections.reduce((sum, c) => sum + c.holders, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfessionalMarketplace;
