/**
 * 🎬 Echo NFT Marketplace Integration
 * Browse, buy, and list Echo NFTs with collaborative layers
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useUniversalWallet } from '../wallet/UniversalWalletAdapter';
import { toast } from 'react-toastify';
import './EchoMarketplace.css';

interface EchoNFT {
  id: string;
  mintAddress: string;
  name: string;
  description: string;
  image: string;
  price?: string;
  owner: string;
  status: string;
  echoCount?: number;
  avgTruthScore?: number;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const EchoMarketplace: React.FC = () => {
  const { publicKey, connected } = useUniversalWallet();
  const [filter, setFilter] = useState<'all' | 'listed' | 'mine'>('all');

  // Fetch Echo NFTs
  const { data: echoes, isLoading } = useQuery({
    queryKey: ['echoMarketplace', filter, publicKey?.toString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        collection: 'eternal-echoes',
        ...(filter === 'listed' && { status: 'listed' }),
        ...(filter === 'mine' && publicKey && { owner: publicKey.toString() }),
      });

      const response = await fetch(`${API_BASE}/api/nfts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch Echo NFTs');
      const data = await response.json();
      return data.nfts as EchoNFT[];
    },
    staleTime: 30000, // 30 seconds
  });

  // Fetch trending echoes
  const { data: trending } = useQuery({
    queryKey: ['trendingEchoes'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/echo/trending?limit=5`);
      if (!response.ok) throw new Error('Failed to fetch trending');
      const data = await response.json();
      return data.echoes as EchoNFT[];
    },
    staleTime: 60000, // 1 minute
  });

  const handleViewEcho = (ledgerId: string) => {
    localStorage.setItem('currentEchoLedger', ledgerId);
    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'echo-viewer' }));
  };

  const handleBuyEcho = async (mintAddress: string, price: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    // TODO: Implement purchase flow
    toast.info('Purchase flow coming soon!');
  };

  if (isLoading) {
    return (
      <div className="echo-marketplace-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          🎬
        </motion.div>
        <p>Loading Echo Marketplace...</p>
      </div>
    );
  }

  return (
    <div className="echo-marketplace-container">
      {/* Header */}
      <motion.div 
        className="marketplace-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="marketplace-title">
            🎬 Echo NFT Marketplace
            <span className="marketplace-subtitle">Collaborative History, Verifiable Truth</span>
          </h1>
        </div>

        {/* Filters */}
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Echoes
          </button>
          <button
            className={`filter-btn ${filter === 'listed' ? 'active' : ''}`}
            onClick={() => setFilter('listed')}
          >
            For Sale
          </button>
          {connected && (
            <button
              className={`filter-btn ${filter === 'mine' ? 'active' : ''}`}
              onClick={() => setFilter('mine')}
            >
              My Echoes
            </button>
          )}
        </div>
      </motion.div>

      {/* Trending Section */}
      {trending && trending.length > 0 && (
        <motion.div 
          className="trending-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2>🔥 Trending Echoes</h2>
          <div className="trending-grid">
            {trending.map((echo) => (
              <motion.div
                key={echo.id}
                className="trending-card"
                whileHover={{ scale: 1.05 }}
                onClick={() => handleViewEcho(echo.mintAddress)}
              >
                <img src={echo.image} alt={echo.name} />
                <div className="trending-info">
                  <h4>{echo.name}</h4>
                  <div className="trending-stats">
                    <span>📊 {echo.echoCount || 0} echoes</span>
                    <span>✅ {echo.avgTruthScore || 0}% truth</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Echo Grid */}
      <div className="echo-grid">
        <AnimatePresence>
          {echoes?.map((echo, index) => {
            const truthScore = echo.attributes?.find(a => a.trait_type === 'Truth Score')?.value as number || 0;
            const truthBadge = truthScore >= 90 ? '🏆' : truthScore >= 80 ? '✅' : '⚠️';

            return (
              <motion.div
                key={echo.id}
                className="echo-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
              >
                <div className="echo-image-wrapper">
                  <img src={echo.image} alt={echo.name} className="echo-image" />
                  <div className="truth-badge-overlay">
                    {truthBadge} {truthScore}%
                  </div>
                  {echo.echoCount && echo.echoCount > 0 && (
                    <div className="echo-count-badge">
                      📊 {echo.echoCount} echoes
                    </div>
                  )}
                </div>

                <div className="echo-card-content">
                  <h3 className="echo-name">{echo.name}</h3>
                  <p className="echo-description">
                    {echo.description?.substring(0, 100)}...
                  </p>

                  {echo.price && (
                    <div className="echo-price">
                      💎 {parseFloat(echo.price).toFixed(4)} SOL
                    </div>
                  )}

                  <div className="echo-actions">
                    <button
                      className="btn-view"
                      onClick={() => handleViewEcho(echo.mintAddress)}
                    >
                      👁️ View
                    </button>
                    {echo.price && echo.status === 'listed' && (
                      <button
                        className="btn-buy"
                        onClick={() => handleBuyEcho(echo.mintAddress, echo.price!)}
                        disabled={!connected}
                      >
                        🛒 Buy
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!isLoading && (!echoes || echoes.length === 0) && (
        <motion.div 
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="empty-icon">🎬</div>
          <h3>No Echo NFTs Found</h3>
          <p>Be the first to mint an Eternal Echo!</p>
          <button
            className="btn-mint-first"
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'echo-mint' }))}
          >
            🚀 Mint Your First Echo
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default EchoMarketplace;
