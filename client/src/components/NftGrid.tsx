import React, { useState } from "react";

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
}

export default function NftGrid({ nfts }: NftGridProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  if (!nfts?.length) {
    return (
      <div className="text-center py-20">
        <div className="glass p-12 rounded-2xl max-w-md mx-auto">
          <div className="text-6xl mb-6 animate-pulse">🎨</div>
          <h3 className="text-2xl font-bold text-white mb-4">No NFTs Yet</h3>
          <p className="text-gray-300 mb-6">
            Be the first to mint an NFT and start the marketplace!
          </p>
          <div className="btn-primary">
            Start Minting
          </div>
        </div>
      </div>
    );
  }

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBadge = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return '👑 Legendary';
      case 'epic': return '💎 Epic';
      case 'rare': return '⭐ Rare';
      default: return '📦 Common';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {nfts.map((nft, index) => (
        <div
          key={nft.id}
          className={`group relative card-gradient transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
            hoveredCard === nft.id ? 'animate-glow' : ''
          }`}
          style={{ animationDelay: `${index * 100}ms` }}
          onMouseEnter={() => setHoveredCard(nft.id)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          {/* Rarity indicator */}
          {nft.rarity && (
            <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(nft.rarity)} text-white z-10`}>
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
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDEwMEgxMDBWNTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0xMDAgMTUwTDUwIDEwMEgxMDBWMTUwWiIgZmlsbD0iIzlCOUI5QiIvPgo8L3N2Zz4K';
              }}
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex space-x-2">
                  <button className="btn-primary text-xs px-3 py-1">
                    View
                  </button>
                  <button className="btn-secondary text-xs px-3 py-1">
                    Buy
                  </button>
                </div>
              </div>
            </div>

            {/* Solana badge */}
            <div className="absolute top-3 right-3 glass px-2 py-1 rounded-full text-xs font-bold text-cyan-300">
              SOL
            </div>
          </div>
          
          {/* NFT Details */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 truncate">
                {nft.name}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">
                {nft.description}
              </p>
            </div>
            
            {/* Creator info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"></div>
                <span className="text-gray-400">
                  {nft.creator.slice(0, 8)}...{nft.creator.slice(-4)}
                </span>
              </div>
              {nft.price && (
                <div className="text-cyan-400 font-bold">
                  {nft.price} SOL
                </div>
              )}
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