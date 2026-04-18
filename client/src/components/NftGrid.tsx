/* eslint-disable react/forbid-dom-props */
import React, { useState, useRef, useCallback, memo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { NFTCardSkeleton } from './SkeletonLoader';
import NftDetailModal from './NftDetailModal';
import NftPreviewCard from './NftPreviewCard';
import { useNotification } from './NotificationSystem';
import { API_ENDPOINTS } from '../config/api';
import '../styles/NftGrid.css';

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

const getRarityBadgeClasses = (rarity?: string) => {
  switch (rarity) {
    case 'legendary':
      return 'text-gold bg-gold/10 border border-gold/20';
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
    case 'legendary':
      return 'Legendary';
    case 'epic':
      return 'Epic';
    case 'rare':
      return 'Rare';
    default:
      return 'Common';
  }
};

const NftGrid = memo(function NftGrid({ nfts, loading = false, error = null }: NftGridProps) {
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [previewNft, setPreviewNft] = useState<NFT | null>(null);
  const [previewRect, setPreviewRect] = useState<DOMRect | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addNotification } = useNotification();
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const handleCardMouseEnter = useCallback((nft: NFT, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    hoverTimerRef.current = setTimeout(() => {
      setPreviewNft(nft);
      setPreviewRect(rect);
    }, 450);
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const handleBuy = async (nft: NFT) => {
    if (!connected || !publicKey || !signTransaction) {
      addNotification({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to buy NFTs.',
        duration: 4000,
      });
      return;
    }

    if (!nft.price) {
      addNotification({
        type: 'error',
        title: 'No Price Set',
        message: 'This NFT is not listed for sale.',
        duration: 4000,
      });
      return;
    }

    setIsBuying(true);
    try {
      // Step 1: Create unsigned buy transaction
      const prepareRes = await fetch(API_ENDPOINTS.marketplaceActions.createBuyTransaction, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer: publicKey.toBase58(),
          seller: nft.owner,
          mintAddress: nft.mintAddress,
          price: parseFloat(nft.price),
        }),
      });
      const prepareData = await prepareRes.json();

      if (!prepareData.success || !prepareData.data?.transaction) {
        throw new Error(prepareData.error || 'Failed to prepare buy transaction');
      }

      // Step 2: Deserialize and sign the transaction
      const txBuffer = Buffer.from(prepareData.data.transaction, 'base64');
      const transaction = Transaction.from(txBuffer);
      const signedTx = await signTransaction(transaction);

      // Step 3: Submit to blockchain
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(signature, 'confirmed');

      // Step 4: Record the sale
      await fetch(API_ENDPOINTS.marketplaceActions.confirmSale, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: nft.mintAddress,
          buyer: publicKey.toBase58(),
          seller: nft.owner,
          price: parseFloat(nft.price),
          signature,
        }),
      });

      addNotification({
        type: 'success',
        title: '🎉 Purchase Successful!',
        message: `You bought "${nft.name}" for ${nft.price} SOL`,
        duration: 6000,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed';
      addNotification({
        type: 'error',
        title: 'Purchase Failed',
        message,
        duration: 5000,
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleList = async (nft: NFT) => {
    if (!connected || !publicKey) {
      addNotification({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to list NFTs.',
        duration: 4000,
      });
      return;
    }

    const priceInput = window.prompt(`Enter listing price in SOL for "${nft.name}":`);
    if (!priceInput) return;

    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
      addNotification({
        type: 'error',
        title: 'Invalid Price',
        message: 'Please enter a valid price greater than 0.',
        duration: 4000,
      });
      return;
    }

    setIsListing(true);
    try {
      const res = await fetch(API_ENDPOINTS.marketplaceActions.list, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: nft.mintAddress,
          seller: publicKey.toBase58(),
          price,
        }),
      });
      const data = await res.json();

      if (data.success) {
        addNotification({
          type: 'success',
          title: '✅ NFT Listed!',
          message: `"${nft.name}" is now listed for ${price} SOL`,
          duration: 5000,
        });
      } else {
        throw new Error(data.error || 'Failed to list NFT');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Listing failed';
      addNotification({
        type: 'error',
        title: 'Listing Failed',
        message,
        duration: 5000,
      });
    } finally {
      setIsListing(false);
    }
  };

  if (loading) {
    return <NFTCardSkeleton count={8} />;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-lg max-w-md mx-auto p-12">
          <h3 className="text-xl font-semibold text-white mb-3">Error Loading NFTs</h3>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{error}</p>
          <button
            className="px-6 py-2.5 bg-gold text-black font-semibold rounded-md hover:bg-gold-light transition-colors text-sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!nfts?.length) {
    return (
      <div className="text-center py-20">
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-lg max-w-md mx-auto p-12">
          <h3 className="text-xl font-semibold text-white mb-3">No NFTs Yet</h3>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Be the first to mint an NFT and start the marketplace!
          </p>
          <button className="px-6 py-2.5 bg-gold text-black font-semibold rounded-md hover:bg-gold-light transition-colors text-sm">
            Start Minting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {nfts.map((nft, index) => (
        <div
          key={nft.id}
          className="group relative bg-[#111111] border border-[#1e1e1e] rounded-lg overflow-hidden cursor-pointer hover:border-gold/25 transition-colors duration-300 nft-grid-card"
          data-animation-delay={Math.round((index * 50) / 50) * 50}
          onClick={() => {
            setSelectedNft(nft);
            setIsModalOpen(true);
          }}
          onMouseEnter={(e) => handleCardMouseEnter(nft, e)}
          onMouseLeave={handleCardMouseLeave}
        >
          {/* Rarity badge */}
          {nft.rarity && (
            <div
              className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-medium z-10 ${getRarityBadgeClasses(nft.rarity)}`}
            >
              {getRarityLabel(nft.rarity)}
            </div>
          )}

          {/* NFT Image */}
          <div className="relative overflow-hidden aspect-square">
            <img
              src={nft.imageUrl}
              alt={nft.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDEwMEgxMDBWNTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0xMDAgMTUwTDUwIDEwMEgxMDBWMTUwWiIgZmlsbD0iIzlCOUI5QiIvPgo8L3N2Zz4K';
              }}
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-4">
              <div className="w-full space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNft(nft);
                    setIsModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-md hover:bg-white/20 transition-colors"
                >
                  View Details
                </button>
                {nft.price ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuy(nft);
                    }}
                    disabled={isBuying}
                    className="w-full px-4 py-2.5 bg-gold text-black text-sm font-semibold rounded-md hover:bg-gold-light transition-colors disabled:opacity-50"
                  >
                    {isBuying ? 'Buying...' : `Buy ${nft.price} SOL`}
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleList(nft);
                    }}
                    disabled={isListing}
                    className="w-full px-4 py-2.5 bg-gold text-black text-sm font-semibold rounded-md hover:bg-gold-light transition-colors disabled:opacity-50"
                  >
                    {isListing ? 'Listing...' : 'List for Sale'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* NFT Details */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white truncate">{nft.name}</h3>
              <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">{nft.description}</p>
            </div>

            {/* Creator and price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-gold/20 text-gold rounded-md flex items-center justify-center text-xs font-semibold">
                  {nft.creator.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-zinc-500 font-mono text-xs">
                  {nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}
                </span>
              </div>
              {nft.price && (
                <div className="text-gold font-semibold text-sm">
                  {nft.price} SOL
                </div>
              )}
            </div>

            {/* Mint address */}
            {nft.mintAddress && (
              <details className="text-xs">
                <summary className="text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">
                  View Mint Address
                </summary>
                <div className="mt-2 p-2 bg-black/40 rounded-md text-zinc-500 font-mono break-all text-[11px] leading-relaxed">
                  {nft.mintAddress}
                </div>
              </details>
            )}
          </div>
        </div>
      ))}

      {/* NFT Detail Modal */}
      <NftDetailModal
        nft={selectedNft}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNft(null);
        }}
        onBuy={handleBuy}
        onList={handleList}
      />

      {/* NFT Quick Preview */}
      {previewNft && previewRect && (
        <NftPreviewCard
          nft={previewNft}
          anchorRect={previewRect}
          onClose={() => {
            setPreviewNft(null);
            setPreviewRect(null);
          }}
          onViewDetails={() => {
            setSelectedNft(previewNft);
            setIsModalOpen(true);
            setPreviewNft(null);
            setPreviewRect(null);
          }}
          onBuy={handleBuy}
          onList={handleList}
        />
      )}
    </div>
  );
});

NftGrid.displayName = 'NftGrid';

export default NftGrid;
