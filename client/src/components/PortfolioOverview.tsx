import React from 'react';
import { NFT } from '../types';

interface PortfolioOverviewProps {
  nfts: NFT[];
  loading: boolean;
}

export default function PortfolioOverview({ nfts, loading }: PortfolioOverviewProps) {
  if (loading) {
    return (
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold gradient-text-primary mb-6">Portfolio Overview</h2>
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold gradient-text-primary mb-6">Portfolio Overview</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-white mb-2">No NFTs Yet</h3>
          <p className="text-gray-400 mb-6">
            Start building your collection by minting your first NFT
          </p>
          <button className="btn-primary-modern">Mint Your First NFT</button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold gradient-text-primary">Portfolio Overview</h2>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">
            View All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.slice(0, 6).map((nft, index) => (
          <div key={nft.id || index} className="glass-card-hover p-4 group cursor-pointer">
            {nft.image ? (
              <div className="relative overflow-hidden rounded-lg mb-3 aspect-square">
                <img
                  src={nft.image}
                  alt={nft.name || 'NFT'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ) : (
              <div className="aspect-square bg-gradient-primary rounded-lg mb-3 flex items-center justify-center text-4xl">
                🖼️
              </div>
            )}

            <div className="space-y-1">
              <h3 className="font-semibold text-white truncate">
                {nft.name || `NFT #${index + 1}`}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{nft.collection || 'Unlisted'}</span>
                {nft.price && (
                  <span className="text-sm font-bold gradient-text-primary">{nft.price} SOL</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {nfts.length > 6 && (
        <div className="mt-6 text-center">
          <button className="text-purple-400 hover:text-purple-300 font-semibold">
            View {nfts.length - 6} more NFTs →
          </button>
        </div>
      )}
    </div>
  );
}
