import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useFavorites } from '../hooks/useFavorites';
import { useApp } from '../context/AppContext';
import NftGrid from './NftGrid';

export default function Favorites() {
  const { connected } = useWallet();
  const { favorites } = useFavorites();
  const { nfts } = useApp();

  if (!connected) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold gradient-text-primary mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-300 mb-6">
          Connect your wallet to view your favorite NFTs
        </p>
      </div>
    );
  }

  // Filter NFTs to only show favorites
  const favoriteNFTs = nfts.filter((nft) => 
    favorites.includes(nft.mintAddress || '')
  );

  if (favorites.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-8xl mb-6 animate-bounce">❤️</div>
        <h2 className="text-3xl font-bold gradient-text-modern mb-4">
          No Favorites Yet
        </h2>
        <p className="text-gray-300 text-lg mb-8">
          Start building your collection! Click the heart icon on any NFT to add it to your favorites.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all transform"
        >
          🏪 Browse Marketplace
        </button>
      </div>
    );
  }

  if (favoriteNFTs.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h2 className="text-3xl font-bold gradient-text-modern mb-4">
          Favorites Not Found
        </h2>
        <p className="text-gray-300 text-lg mb-8">
          Some of your favorite NFTs may no longer be available in the marketplace.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all transform"
        >
          🏪 Browse Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold gradient-text font-display mb-2">
            ❤️ My Favorites
          </h1>
          <p className="text-gray-300">
            {favoriteNFTs.length} {favoriteNFTs.length === 1 ? 'NFT' : 'NFTs'} saved
          </p>
        </div>
      </div>

      <NftGrid nfts={favoriteNFTs} loading={false} error={null} />
    </div>
  );
}

