/**
 * Featured Collections Carousel
 * Rotating showcase of top NFT collections
 */

import React, { useState, useEffect } from 'react';

export interface FeaturedCollection {
  id: string;
  name: string;
  image: string;
  floorPrice: number;
  volume24h: number;
  priceChange24h: number;
  description?: string;
}

interface FeaturedCarouselProps {
  collections: FeaturedCollection[];
  onCollectionSelect?: (collection: FeaturedCollection) => void;
  autoScroll?: boolean;
  scrollInterval?: number;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  collections,
  onCollectionSelect,
  autoScroll = true,
  scrollInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll functionality
  useEffect(() => {
    if (!autoScroll || collections.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % collections.length);
    }, scrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, collections.length, scrollInterval]);

  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No featured collections available</p>
      </div>
    );
  }

  const current = collections[currentIndex];
  const nextIndex = (currentIndex + 1) % collections.length;
  const next = collections[nextIndex];

  return (
    <div className="w-full">
      {/* Main Featured Card */}
      <div className="relative mb-6 overflow-hidden rounded-2xl">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${current.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 md:p-12 flex items-center gap-8 min-h-64">
          {/* Left: Collection Info */}
          <div className="flex-1 text-white">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-purple-600/80 rounded-full text-sm font-semibold mb-4">
                Featured Collection
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4">{current.name}</h2>

            {current.description && (
              <p className="text-gray-300 text-lg mb-6 max-w-lg">{current.description}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {/* Floor Price */}
              <div>
                <div className="text-sm text-gray-400 mb-1">Floor Price</div>
                <div className="text-2xl font-bold text-white">
                  ◎ {current.floorPrice.toFixed(2)}
                </div>
              </div>

              {/* 24h Volume */}
              <div>
                <div className="text-sm text-gray-400 mb-1">24h Volume</div>
                <div className="text-2xl font-bold text-white">
                  ◎ {(current.volume24h / 1000).toFixed(1)}K
                </div>
              </div>

              {/* Price Change */}
              <div>
                <div className="text-sm text-gray-400 mb-1">24h Change</div>
                <div
                  className={`text-2xl font-bold ${
                    current.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {current.priceChange24h >= 0 ? '+' : ''}
                  {current.priceChange24h.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => onCollectionSelect?.(current)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
            >
              View Collection →
            </button>
          </div>

          {/* Right: Collection Image */}
          <div className="hidden lg:block flex-shrink-0">
            <img
              src={current.image}
              alt={current.name}
              className="w-64 h-64 rounded-xl object-cover shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-nft.png';
              }}
            />
          </div>
        </div>
      </div>

      {/* Carousel Controls */}
      <div className="flex items-center justify-between">
        {/* Thumbnail Strip */}
        <div className="flex gap-3 overflow-x-auto flex-1">
          {collections.map((collection, index) => (
            <button
              key={collection.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all transform ${
                index === currentIndex
                  ? 'ring-2 ring-purple-500 scale-105'
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img
                src={collection.image}
                alt={collection.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                }}
              />
            </button>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 ml-4">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + collections.length) % collections.length)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % collections.length)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {collections.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? 'w-8 bg-purple-500' : 'w-2 bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedCarousel;
