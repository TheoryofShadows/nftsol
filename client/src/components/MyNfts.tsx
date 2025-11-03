import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { NFT } from '../types';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export default function MyNfts() {
  const { connected, publicKey } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyNfts = async () => {
      if (!connected || !publicKey) {
        setNfts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const address = publicKey.toBase58();
        const response = await fetch(`${API_BASE}/api/nfts?owner=${address}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setNfts(data.data);
        } else {
          setNfts([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load NFTs');
        setNfts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyNfts();
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold gradient-text-primary mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-300 mb-6">
          Please connect your wallet to view your NFT collection
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <span className="ml-4 text-white text-lg">Loading your NFTs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading NFTs</h2>
        <p className="text-gray-300">{error}</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h2 className="text-2xl font-bold gradient-text-primary mb-4">
          No NFTs Yet
        </h2>
        <p className="text-gray-300 mb-6">
          You don&apos;t have any NFTs yet. Start building your collection by minting your first NFT!
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'mint' }))}
          className="btn-primary-modern"
        >
          ✨ Mint Your First NFT
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold gradient-text font-display mb-2">
            My NFT Collection
          </h1>
          <p className="text-gray-300">
            {nfts.length} {nfts.length === 1 ? 'NFT' : 'NFTs'} in your wallet
          </p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'mint' }))}
          className="btn-primary-modern"
        >
          ✨ Mint New NFT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft, index) => (
          <div
            key={nft.id || index}
            className="glass-card-hover group cursor-pointer transform transition-all duration-300 hover:scale-105"
          >
            <div className="relative overflow-hidden rounded-t-xl aspect-square">
              {nft.imageUrl ? (
                <img
                  src={nft.imageUrl}
                  alt={nft.name || 'NFT'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-6xl">
                  🖼️
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="w-full">
                  <button className="w-full btn-primary-modern text-sm py-2">
                    View Details
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <h3 className="font-bold text-white text-lg truncate">
                {nft.name || `NFT #${index + 1}`}
              </h3>
              {nft.description && (
                <p className="text-gray-400 text-sm line-clamp-2">{nft.description}</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs text-gray-500">Mint Address:</span>
                <span className="text-xs font-mono text-cyan-400">
                  {nft.mintAddress?.slice(0, 8)}...
                </span>
              </div>
              {nft.price && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Current Price:</span>
                  <span className="text-lg font-bold gradient-text-primary">
                    {nft.price} SOL
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

