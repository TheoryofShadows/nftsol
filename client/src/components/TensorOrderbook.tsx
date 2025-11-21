/**
 * Tensor Orderbook Component
 * Displays real-time bids and asks from Tensor marketplace
 */

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config/api';

interface TensorBid {
  price: number;
  priceLamports: string;
  bidder: string;
  quantity: number;
}

interface TensorListing {
  price: number;
  priceLamports: string;
  seller: string;
  mint: string;
  name?: string;
  image?: string;
}

interface TensorOrderbook {
  collection: string;
  slug: string;
  floorPrice: number;
  topBid: number;
  bids: TensorBid[];
  listings: TensorListing[];
  spread: number;
  spreadPercent: number;
  volume24h: number;
  numListed: number;
  numOwners: number;
  updatedAt: number;
}

interface TensorOrderbookProps {
  collectionSlug: string;
  onBuyClick?: (listing: TensorListing) => void;
  onBidClick?: () => void;
  compact?: boolean;
  refreshInterval?: number;
}

export const TensorOrderbook: React.FC<TensorOrderbookProps> = ({
  collectionSlug,
  onBuyClick,
  onBidClick,
  compact = false,
  refreshInterval = 15000,
}) => {
  const [orderbook, setOrderbook] = useState<TensorOrderbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchOrderbook = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tensor/orderbook/${collectionSlug}?limit=10`);
      const data = await response.json();

      if (data.success && data.data) {
        setOrderbook(data.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch orderbook');
      }
    } catch (err) {
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  }, [collectionSlug]);

  useEffect(() => {
    fetchOrderbook();
    const interval = setInterval(fetchOrderbook, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchOrderbook, refreshInterval]);

  const shortenAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  const formatSOL = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-700/50 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-700/30 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
        <div className="text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
        <button
          onClick={fetchOrderbook}
          className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!orderbook) return null;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16v16H4z" opacity="0.3" />
              <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16z" />
            </svg>
            <span className="font-semibold text-white">Tensor Orderbook</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Live
          </div>
        </div>
        {lastUpdate && (
          <div className="text-xs text-gray-500 mt-1">
            Updated {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-2 p-3 bg-gray-800/30 text-center text-xs">
        <div>
          <div className="text-gray-400">Floor</div>
          <div className="text-white font-semibold">{formatSOL(orderbook.floorPrice)} SOL</div>
        </div>
        <div>
          <div className="text-gray-400">Top Bid</div>
          <div className="text-green-400 font-semibold">{formatSOL(orderbook.topBid)} SOL</div>
        </div>
        <div>
          <div className="text-gray-400">Spread</div>
          <div className={`font-semibold ${orderbook.spreadPercent > 5 ? 'text-yellow-400' : 'text-gray-300'}`}>
            {orderbook.spreadPercent.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-gray-400">24h Vol</div>
          <div className="text-blue-400 font-semibold">{formatSOL(orderbook.volume24h)} SOL</div>
        </div>
      </div>

      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} divide-x divide-gray-700/50`}>
        {/* Bids (Buy Orders) */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">Bids</span>
            {onBidClick && (
              <button
                onClick={onBidClick}
                className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30 transition-colors"
              >
                Place Bid
              </button>
            )}
          </div>
          <div className="space-y-1">
            {orderbook.bids.length === 0 ? (
              <div className="text-gray-500 text-xs py-2 text-center">No active bids</div>
            ) : (
              orderbook.bids.slice(0, compact ? 3 : 5).map((bid, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 px-2 rounded bg-green-500/5 hover:bg-green-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-mono text-sm">{bid.price.toFixed(2)}</span>
                    <span className="text-gray-500 text-xs">SOL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">x{bid.quantity}</span>
                    <span className="text-gray-500 text-xs">{shortenAddress(bid.bidder)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Asks (Sell Orders / Listings) */}
        {!compact && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Listings</span>
              <span className="text-xs text-gray-500">{orderbook.numListed} listed</span>
            </div>
            <div className="space-y-1">
              {orderbook.listings.length === 0 ? (
                <div className="text-gray-500 text-xs py-2 text-center">No active listings</div>
              ) : (
                orderbook.listings.slice(0, 5).map((listing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 rounded bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer group"
                    onClick={() => onBuyClick?.(listing)}
                  >
                    <div className="flex items-center gap-2">
                      {listing.image && (
                        <img
                          src={listing.image}
                          alt={listing.name || 'NFT'}
                          className="w-6 h-6 rounded object-cover"
                        />
                      )}
                      <div>
                        <span className="text-red-400 font-mono text-sm">{listing.price.toFixed(2)}</span>
                        <span className="text-gray-500 text-xs ml-1">SOL</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs truncate max-w-20">{listing.name || shortenAddress(listing.mint)}</span>
                      {onBuyClick && (
                        <button className="opacity-0 group-hover:opacity-100 text-xs bg-purple-500 text-white px-2 py-0.5 rounded transition-opacity">
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/20 flex items-center justify-between">
        <a
          href={`https://tensor.so/trade/${orderbook.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
        >
          View on Tensor
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <span className="text-xs text-gray-500">{orderbook.numOwners} owners</span>
      </div>
    </div>
  );
};

export default TensorOrderbook;
