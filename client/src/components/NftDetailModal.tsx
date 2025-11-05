import React, { useEffect } from 'react';
import { useNotification } from './NotificationSystem';

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

interface NftDetailModalProps {
  nft: NFT | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy?: (nft: NFT) => void;
  onList?: (nft: NFT) => void;
}

export default function NftDetailModal({
  nft,
  isOpen,
  onClose,
  onBuy,
  onList,
}: NftDetailModalProps) {
  const { addNotification } = useNotification();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !nft) return null;

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

  const handleBuy = () => {
    if (onBuy) {
      onBuy(nft);
    } else {
      addNotification({
        type: 'info',
        title: 'Purchase NFT',
        message: `Buy functionality for "${nft.name}" will be implemented soon.`,
        duration: 4000,
      });
    }
    onClose();
  };

  const handleList = () => {
    if (onList) {
      onList(nft);
    } else {
      addNotification({
        type: 'info',
        title: 'List NFT',
        message: `Listing functionality for "${nft.name}" will be implemented soon.`,
        duration: 4000,
      });
    }
    onClose();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        addNotification({
          type: 'success',
          title: 'Copied!',
          message: `${label} copied to clipboard`,
          duration: 2000,
        });
      },
      () => {
        addNotification({
          type: 'error',
          title: 'Failed to copy',
          message: 'Could not copy to clipboard',
          duration: 3000,
        });
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-modern rounded-2xl p-6 md:p-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nft-detail-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close modal"
        >
          <span className="text-2xl">×</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Image Section */}
          <div className="relative">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
              <img
                src={nft.imageUrl}
                alt={nft.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDEwMEgxMDBWNTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0xMDAgMTUwTDUwIDEwMEgxMDBWMTUwWiIgZmlsbD0iIzlCOUI5QiIvPgo8L3N2Zz4K';
                }}
              />
              {nft.rarity && (
                <div
                  className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r ${getRarityColor(nft.rarity)} text-white shadow-lg`}
                >
                  {getRarityBadge(nft.rarity)}
                </div>
              )}
              {nft.price && (
                <div className="absolute top-4 right-4 glass-modern px-4 py-2 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Price</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {nft.price} SOL
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h2 id="nft-detail-title" className="text-3xl md:text-4xl font-bold gradient-text-modern font-display mb-2">
                {nft.name}
              </h2>
              <p className="text-gray-300 text-base leading-relaxed">
                {nft.description || 'No description available'}
              </p>
            </div>

            {/* Attributes */}
            {nft.attributes && nft.attributes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Attributes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {nft.attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="glass-modern p-3 rounded-xl text-center"
                    >
                      <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                        {attr.trait_type}
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {attr.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Addresses */}
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  Creator
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-xs font-bold">
                    {nft.creator.slice(0, 2).toUpperCase()}
                  </div>
                  <code className="text-sm text-gray-300 font-mono flex-1">
                    {nft.creator}
                  </code>
                  <button
                    onClick={() => copyToClipboard(nft.creator, 'Creator address')}
                    className="px-3 py-1 text-xs glass-modern rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="Copy creator address to clipboard"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  Owner
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-400 rounded-full flex items-center justify-center text-xs font-bold">
                    {nft.owner.slice(0, 2).toUpperCase()}
                  </div>
                  <code className="text-sm text-gray-300 font-mono flex-1 truncate">
                    {nft.owner}
                  </code>
                  <button
                    onClick={() => copyToClipboard(nft.owner, 'Owner address')}
                    className="px-3 py-1 text-xs glass-modern rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="Copy owner address to clipboard"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {nft.mintAddress && (
                <div>
                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                    Mint Address
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs text-gray-300 font-mono flex-1 truncate">
                      {nft.mintAddress}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(nft.mintAddress, 'Mint address')
                      }
                      className="px-3 py-1 text-xs glass-modern rounded-lg hover:bg-white/20 transition-colors"
                      aria-label="Copy mint address to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {nft.createdAt && (
                <div>
                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                    Created
                  </div>
                  <div className="text-sm text-gray-300">
                    {new Date(nft.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
              {nft.price ? (
                <button
                  onClick={handleBuy}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                  aria-label={`Buy ${nft.name} for ${nft.price} SOL`}
                >
                  <span className="text-xl" aria-hidden="true">💰</span>
                  <span>Buy for {nft.price} SOL</span>
                </button>
              ) : (
                <button
                  onClick={handleList}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                  aria-label={`List ${nft.name} for sale`}
                >
                  <span className="text-xl" aria-hidden="true">📋</span>
                  <span>List for Sale</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (nft.mintAddress) {
                    window.open(
                      `https://solscan.io/token/${nft.mintAddress}`,
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }
                }}
                className="flex-1 glass-modern hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                aria-label={`View ${nft.name} on Solscan`}
              >
                <span className="text-xl" aria-hidden="true">🔍</span>
                <span>View on Solscan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

