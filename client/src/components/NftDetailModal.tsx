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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  const getRarityClasses = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-[#c9a84c] bg-[#c9a84c]/10 border border-[#c9a84c]/20';
      case 'epic':
        return 'text-purple-300 bg-purple-500/10 border border-purple-500/20';
      case 'rare':
        return 'text-blue-300 bg-blue-500/10 border border-blue-500/20';
      default:
        return 'text-zinc-400 bg-zinc-500/10 border border-zinc-500/20';
    }
  };

  const getRarityLabel = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return 'Legendary';
      case 'epic': return 'Epic';
      case 'rare': return 'Rare';
      default: return 'Common';
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
        className="absolute inset-0 bg-black/85 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#111111] border border-[#1e1e1e] rounded-lg p-6 md:p-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nft-detail-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-md bg-[#1e1e1e] hover:bg-[#2a2a2a] text-zinc-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Image Section */}
          <div className="relative">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-[#0c0c0c]">
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
                <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-medium ${getRarityClasses(nft.rarity)}`}>
                  {getRarityLabel(nft.rarity)}
                </div>
              )}
              {nft.price && (
                <div className="absolute top-3 right-3 bg-[#111111] border border-[#1e1e1e] px-3 py-1.5 rounded-md">
                  <div className="text-[10px] text-zinc-500 mb-0.5">Price</div>
                  <div className="text-lg font-bold text-[#c9a84c]">{nft.price} SOL</div>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <h2 id="nft-detail-title" className="text-2xl md:text-3xl font-bold text-white font-display mb-2">
                {nft.name}
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {nft.description || 'No description available'}
              </p>
            </div>

            {/* Attributes */}
            {nft.attributes && nft.attributes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2.5">Attributes</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {nft.attributes.map((attr, idx) => (
                    <div key={idx} className="bg-[#0c0c0c] border border-[#1e1e1e] p-2.5 rounded-md text-center">
                      <div className="text-[10px] text-zinc-500 mb-0.5 uppercase tracking-wider">{attr.trait_type}</div>
                      <div className="text-xs font-semibold text-white">{attr.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Addresses */}
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Creator</div>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-[#c9a84c]/15 rounded-md flex items-center justify-center text-[10px] font-semibold text-[#c9a84c]">
                    {nft.creator.slice(0, 2).toUpperCase()}
                  </div>
                  <code className="text-xs text-zinc-400 font-mono flex-1 truncate">{nft.creator}</code>
                  <button
                    onClick={() => copyToClipboard(nft.creator, 'Creator address')}
                    className="px-2.5 py-1 text-[10px] bg-[#1e1e1e] hover:bg-[#2a2a2a] text-zinc-400 rounded-md transition-colors"
                    aria-label="Copy creator address to clipboard"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Owner</div>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-[#c9a84c]/15 rounded-md flex items-center justify-center text-[10px] font-semibold text-[#c9a84c]">
                    {nft.owner.slice(0, 2).toUpperCase()}
                  </div>
                  <code className="text-xs text-zinc-400 font-mono flex-1 truncate">{nft.owner}</code>
                  <button
                    onClick={() => copyToClipboard(nft.owner, 'Owner address')}
                    className="px-2.5 py-1 text-[10px] bg-[#1e1e1e] hover:bg-[#2a2a2a] text-zinc-400 rounded-md transition-colors"
                    aria-label="Copy owner address to clipboard"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {nft.mintAddress && (
                <div>
                  <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Mint Address</div>
                  <div className="flex items-center space-x-2">
                    <code className="text-[11px] text-zinc-400 font-mono flex-1 truncate">{nft.mintAddress}</code>
                    <button
                      onClick={() => copyToClipboard(nft.mintAddress, 'Mint address')}
                      className="px-2.5 py-1 text-[10px] bg-[#1e1e1e] hover:bg-[#2a2a2a] text-zinc-400 rounded-md transition-colors"
                      aria-label="Copy mint address to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {nft.createdAt && (
                <div>
                  <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Created</div>
                  <div className="text-xs text-zinc-400">
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
            <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-[#1e1e1e]">
              {nft.price ? (
                <button
                  onClick={handleBuy}
                  className="flex-1 bg-[#c9a84c] hover:bg-[#b8973f] text-black font-semibold py-3 px-5 rounded-md transition-colors flex items-center justify-center gap-2"
                  aria-label={`Buy ${nft.name} for ${nft.price} SOL`}
                >
                  Buy for {nft.price} SOL
                </button>
              ) : (
                <button
                  onClick={handleList}
                  className="flex-1 bg-[#c9a84c] hover:bg-[#b8973f] text-black font-semibold py-3 px-5 rounded-md transition-colors flex items-center justify-center gap-2"
                  aria-label={`List ${nft.name} for sale`}
                >
                  List for Sale
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
                className="flex-1 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#1e1e1e] hover:border-[#c9a84c]/20 text-white font-medium py-3 px-5 rounded-md transition-colors flex items-center justify-center gap-2"
                aria-label={`View ${nft.name} on Solscan`}
              >
                View on Solscan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
