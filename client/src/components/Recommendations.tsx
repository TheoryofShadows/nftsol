// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from './NotificationSystem';
import NftGrid from './NftGrid';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  owner: string;
  mintAddress: string;
  price?: string;
  rarity?: string;
  reason?: string;
  score?: number;
}

export default function Recommendations() {
  const { connected, publicKey } = useWallet();
  const { addNotification } = useNotification();
  const [recommendations, setRecommendations] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [algorithm, setAlgorithm] = useState('personalized');

  useEffect(() => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const userId = publicKey.toBase58();
        const response = await fetch(`${API_BASE}/api/recommendations/${userId}?limit=12&algorithm=${algorithm}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        setRecommendations(data || []);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        addNotification({
          type: 'warning',
          title: 'Recommendations Unavailable',
          message: 'Unable to load personalized recommendations. Showing trending NFTs instead.',
          duration: 5000,
        });
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [connected, publicKey, algorithm, addNotification]);

  if (!connected) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold gradient-text-primary mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-300 mb-6">
          Connect your wallet to get personalized NFT recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold gradient-text font-display mb-2">
            ✨ Recommended for You
          </h1>
          <p className="text-gray-300">
            Personalized NFT suggestions based on your preferences and activity
          </p>
        </div>

        {/* Algorithm Selector */}
        <div className="mt-4 md:mt-0">
          <label htmlFor="algorithm-select" className="block text-sm font-semibold text-white mb-2">
            Algorithm
          </label>
          <select
            id="algorithm-select"
            aria-label="Recommendation algorithm"
            title="Recommendation algorithm"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="personalized">🎯 Personalized</option>
            <option value="content">📊 Content-Based</option>
            <option value="collaborative">👥 Collaborative</option>
            <option value="trending">🔥 Trending</option>
            <option value="price">💰 Price Match</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading recommendations...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-8xl mb-6">🎲</div>
          <h2 className="text-3xl font-bold gradient-text-modern mb-4">
            No Recommendations Yet
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Start exploring the marketplace to get personalized recommendations!
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all transform"
          >
            🏪 Browse Marketplace
          </button>
        </div>
      ) : (
        <>
          {/* Show recommendation reasons */}
          {recommendations.some((nft) => nft.reason) && (
            <div className="glass-card p-4 mb-6 bg-purple-500/10 border border-purple-500/30">
              <p className="text-sm text-purple-300">
                💡 Recommendations are based on your preferences, viewing history, and similar users&apos; interests.
              </p>
            </div>
          )}

          <NftGrid nfts={recommendations} loading={false} error={null} />
        </>
      )}
    </div>
  );
}

