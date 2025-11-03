import React, { useState } from 'react';
import { NFTCardSkeleton } from './SkeletonLoader';

interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  owner: string;
  mintAddress: string;
  signature?: string;
  price?: string;
  createdAt?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

interface NftGridProps {
  nfts: NFT[];
  loading?: boolean;
  error?: string | null;
}

export default function NftGrid({ nfts, loading = false, error = null }: NftGridProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  if (loading) {
    return <NFTCardSkeleton count={8} />;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="card-modern max-w-md mx-auto p-12">
          <div className="text-6xl mb-6">❌</div>
          <h3 className="text-heading text-white mb-4">Error Loading NFTs</h3>
          <p className="text-body mb-6">{error}</p>
          <button className="btn-modern" onClick={() => window.location.reload()}>
            <span className="relative z-10">Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (!nfts?.length) {
    return (
      <div className="text-center py-20">
        <div className="card-modern max-w-md mx-auto p-12">
          <div className="text-6xl mb-6 animate-pulse">🎨</div>
          <h3 className="text-heading text-white mb-4">No NFTs Yet</h3>
          <p className="text-body mb-6">
            Be the first to mint an NFT and start the marketplace!
          </p>
          <button className="btn-modern">
            <span className="relative z-10">Start Minting</span>
          </button>
        </div>
      </div>
    );
  }

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'epic':
        return 'from-purple-400 to-pink-500';
      case 'rare':
        return 'from-blue-400 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBadge = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return '👑 Legendary';
      case 'epic':
        return '💎 Epic';
      case 'rare':
        return '⭐ Rare';
      default:
        return '📦 Common';
    }
  };

  return (
    <div className="grid-modern">
      {nfts.map((nft, index) => (
        <div
          key={nft.id}
          className="card-modern glow-border scroll-reveal overflow-hidden cursor-pointer"
          style={{ animationDelay: `${index * 50}ms` }}
          onMouseEnter={() => setHoveredCard(nft.id)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => {
            // TODO: Implement NFT detail modal
            console.log('View NFT details:', nft);
          }}
        >
          {/* Rarity indicator */}
          {nft.rarity && (
            <div
              className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(nft.rarity)} text-white z-10`}
            >
              {getRarityBadge(nft.rarity)}
            </div>
          )}

          {/* NFT Image */}
          <div className="relative overflow-hidden rounded-xl mb-4 aspect-square">
            <img
              src={nft.imageUrl}
              alt={nft.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDEwMEgxMDBWNTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0xMDAgMTUwTDUwIDEwMEgxMDBWMTUwWiIgZmlsbD0iIzlCOUI5QiIvPgo8L3N2Zz4K';
              }}
            />

            {/* Overlay on hover - Modern */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-purple-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-4 backdrop-blur-sm">
              <div className="w-full space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Viewing ${nft.name} details`);
                  }}
                  className="w-full glass-modern px-4 py-2.5 text-white font-semibold hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <span className="text-lg">👁️</span> View Details
                </button>
                {nft.price ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Buying ${nft.name} for ${nft.price} SOL`);
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 rounded-2xl text-white font-bold hover:shadow-2xl hover:scale-105 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">💰</span> Buy {nft.price} SOL
                  </button>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Listing ${nft.name} for sale`);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2.5 rounded-2xl text-white font-bold hover:shadow-2xl hover:scale-105 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">📋</span> List for Sale
                  </button>
                )}
              </div>
            </div>

            {/* Solana badge - Modern */}
            <div className="absolute top-3 right-3 badge-modern text-xs">
              SOL ◎
            </div>
          </div>

          {/* NFT Details - Modern Typography */}
          <div className="space-y-3 p-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 truncate font-display">{nft.name}</h3>
              <p className="text-sm text-gray-400 line-clamp-2 text-body">{nft.description}</p>
            </div>

            {/* Creator info - Modern */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-xs font-bold">
                  {nft.creator.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-gray-400 font-mono text-xs">
                  {nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}
                </span>
              </div>
              {nft.price && <div className="gradient-text-modern font-bold text-lg">{nft.price} ◎</div>}
            </div>

            {/* Mint address (collapsible) */}
            {nft.mintAddress && (
              <details className="text-xs">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-300">
                  View Mint Address
                </summary>
                <div className="mt-2 p-2 bg-black/30 rounded text-gray-400 font-mono break-all">
                  {nft.mintAddress}
                </div>
              </details>
            )}
          </div>

          {/* Hover effect border */}
          <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-cyan-400/50 transition-colors duration-300 pointer-events-none"></div>
        </div>
      ))}
    </div>
  );
}
