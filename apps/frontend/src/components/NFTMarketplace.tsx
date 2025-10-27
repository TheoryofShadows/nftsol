import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useUniversalWallet } from '../wallet/UniversalWalletAdapter';
import { useMarketplaceUpdates, useWebSocket } from '../hooks/useWebSocket';
import IpfsImage from './IpfsImage';

interface NFT {
  id: string;
  mintAddress: string;
  name: string;
  description: string;
  image: string;
  price?: string;
  owner: string;
  status: string;
  collection?: string;
  platform?: string;
  rarity?: number;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  lastSale?: {
    price: string;
    timestamp: number;
  };
}

interface FilterState {
  status: 'all' | 'listed' | 'my-nfts';
  priceRange: [number, number];
  collection: string;
  platform: string;
  sortBy: 'price' | 'rarity' | 'recent' | 'name';
  sortOrder: 'asc' | 'desc';
}

export default function NFTMarketplace() {
  const { publicKey, connected } = useUniversalWallet();
  const { recentActivity, nftListings, nftSales } = useMarketplaceUpdates();
  const { isConnected } = useWebSocket();
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    priceRange: [0, 100],
    collection: '',
    platform: '',
    sortBy: 'recent',
    sortOrder: 'desc'
  });
  const [showActivityFeed, setShowActivityFeed] = useState(false);

  // Infinite scroll setup
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Fetch NFTs with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['nfts', filters, publicKey?.toString()],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.collection && { collection: filters.collection }),
        ...(filters.platform && { platform: filters.platform }),
        ...(filters.priceRange[0] > 0 && { minPrice: filters.priceRange[0].toString() }),
        ...(filters.priceRange[1] < 100 && { maxPrice: filters.priceRange[1].toString() }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
        ...(filters.status === 'my-nfts' && publicKey && { owner: publicKey.toString() })
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/nfts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch NFTs');
      return response.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
    staleTime: 30000, // 30 seconds
  });

  // Flatten all pages into a single array
  const allNFTs = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.nfts || []) || [];
  }, [data]);

  // Load more when in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const buyNFT = async (nft: NFT) => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftId: nft.id,
          buyerWallet: publicKey?.toString(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('NFT purchased successfully!');
        refetch();
      } else {
        alert('Purchase failed: ' + result.error);
      }
    } catch (error: any) {
      console.error('Error buying NFT:', error);
      alert('Purchase failed: ' + error.message);
    }
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading NFTs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Error Loading NFTs</h3>
        <p>Something went wrong. Please try again.</p>
        <button onClick={() => refetch()} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (allNFTs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🖼️</div>
        <h3>No NFTs Found</h3>
        <p>Try adjusting your filters or check back later for new listings.</p>
        <button onClick={() => refetch()} className="btn-primary">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      {/* Enhanced Filter Section */}
      <motion.div 
        className="filter-section"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="filter-buttons">
          <button
            onClick={() => updateFilters({ status: 'all' })}
            className={`filter-btn ${filters.status === 'all' ? 'active' : ''}`}
            aria-label="Show all NFTs"
          >
            🌟 All NFTs
          </button>
          <button
            onClick={() => updateFilters({ status: 'listed' })}
            className={`filter-btn ${filters.status === 'listed' ? 'active' : ''}`}
            aria-label="Show NFTs for sale"
          >
            💰 For Sale
          </button>
          {connected && (
            <button
              onClick={() => updateFilters({ status: 'my-nfts' })}
              className={`filter-btn ${filters.status === 'my-nfts' ? 'active' : ''}`}
              aria-label="Show my NFTs"
            >
              👤 My NFTs
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        <div className="advanced-filters">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
            className="filter-select"
            aria-label="Sort by"
          >
            <option value="recent">Recently Added</option>
            <option value="price">Price</option>
            <option value="rarity">Rarity</option>
            <option value="name">Name</option>
          </select>
          
          <select
            value={filters.sortOrder}
            onChange={(e) => updateFilters({ sortOrder: e.target.value as any })}
            className="filter-select"
            aria-label="Sort order"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <input
            type="text"
            placeholder="Search collections..."
            value={filters.collection}
            onChange={(e) => updateFilters({ collection: e.target.value })}
            className="filter-input"
            aria-label="Filter by collection"
          />
        </div>

        {/* Real-time Activity Feed */}
        <div className="activity-section">
          <button
            className={`activity-toggle ${showActivityFeed ? 'active' : ''}`}
            onClick={() => setShowActivityFeed(!showActivityFeed)}
            aria-label="Toggle activity feed"
          >
            🔴 Live Activity ({recentActivity.length})
            <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          </button>

          <AnimatePresence>
            {showActivityFeed && (
              <motion.div
                className="activity-feed"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="activity-header">
                  <h4>Live Marketplace Activity</h4>
                  <span className="activity-count">{recentActivity.length} events</span>
                </div>
                <div className="activity-list">
                  {recentActivity.slice(0, 10).map((activity, index) => (
                    <motion.div
                      key={`${activity.timestamp}-${index}`}
                      className="activity-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="activity-icon">
                        {activity.type === 'nft-listed' ? '📝' : 
                         activity.type === 'nft-sold' ? '💰' : '🔔'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">
                          {activity.type === 'nft-listed' && `New listing: ${activity.data.nft.name}`}
                          {activity.type === 'nft-sold' && `${activity.data.nft.name} sold for ${activity.data.price} SOL`}
                          {activity.type === 'marketplace-activity' && activity.data.type}
                        </div>
                        <div className="activity-time">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CLOUT Stats */}
        {connected && (
          <div className="clout-stats">
            <div className="stat-item">
              <div className="stat-value">1,000</div>
              <div className="stat-label">CLOUT Balance</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">85</div>
              <div className="stat-label">Honor Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">15%</div>
              <div className="stat-label">Fee Discount</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* NFT Grid with Animations */}
      <motion.div 
        className="nft-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnimatePresence>
          {allNFTs.map((nft, index) => (
            <motion.div
              key={nft.id}
              className="nft-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ 
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 }
              }}
              layout
            >
              <div className="nft-image-container">
                <IpfsImage
                  src={nft.image}
                  alt={nft.name}
                  className="nft-image"
                  loading="lazy"
                />
                {nft.status === 'listed' && (
                  <motion.div 
                    className="nft-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    For Sale
                  </motion.div>
                )}
                {nft.collection && (
                  <motion.div 
                    className="collection-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {nft.collection}
                  </motion.div>
                )}
                {nft.platform && (
                  <div className="platform-badge">
                    {nft.platform}
                  </div>
                )}
              </div>
              
              <div className="nft-info">
                <h3 className="nft-name">{nft.name}</h3>
                <p className="nft-description">{nft.description}</p>
                
                {nft.attributes && nft.attributes.length > 0 && (
                  <div className="nft-attributes">
                    {nft.attributes.slice(0, 3).map((attr, idx) => (
                      <span key={idx} className="attribute-tag">
                        {attr.trait_type}: {attr.value}
                      </span>
                    ))}
                  </div>
                )}

                {nft.price && (
                  <div className="nft-price-section">
                    <div className="nft-price">{nft.price} SOL</div>
                    <div className="clout-discount">Save 50% with CLOUT</div>
                  </div>
                )}

                {nft.rarity && (
                  <div className="rarity-score">
                    Rarity: {nft.rarity}%
                  </div>
                )}

                <div className="nft-actions">
                  {nft.status === 'listed' ? (
                    <motion.button
                      onClick={() => buyNFT(nft)}
                      className="btn-primary"
                      disabled={!connected}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Buy ${nft.name} for ${nft.price} SOL`}
                    >
                      {connected ? 'Buy Now' : 'Connect Wallet'}
                    </motion.button>
                  ) : (
                    <div className="nft-status">Not for sale</div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Infinite Scroll Loader */}
      <div ref={loadMoreRef} className="load-more-trigger">
        {isFetchingNextPage && (
          <motion.div 
            className="loading-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="loading-spinner"></div>
            <p>Loading more NFTs...</p>
          </motion.div>
        )}
      </div>

      {/* End of results */}
      {!hasNextPage && allNFTs.length > 0 && (
        <motion.div 
          className="end-of-results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>You've reached the end! 🎉</p>
        </motion.div>
      )}
    </div>
  );
}