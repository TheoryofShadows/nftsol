import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { NFT } from '../types';
import { useNotification } from './NotificationSystem';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export default function MyNfts() {
  const { connected, publicKey } = useWallet();
  const { addNotification } = useNotification();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingNft, setListingNft] = useState<string | null>(null);
  const [listPrice, setListPrice] = useState<{ [key: string]: string }>({});

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
        
        // Handle both old format (data.nfts) and new format (data.data)
        const nftList = data.nfts || data.data || [];
        
        if (Array.isArray(nftList)) {
          setNfts(nftList);
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log(`[MyNFTs] Loaded ${nftList.length} NFTs from ${data.source || 'blockchain'}`);
          }
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

  const handleListNFT = async (nft: NFT) => {
    if (!publicKey) return;
    
    const price = listPrice[nft.mintAddress || ''];
    if (!price || parseFloat(price) <= 0) {
      addNotification({
        type: 'error',
        title: 'Invalid Price',
        message: 'Please enter a valid price greater than 0',
        duration: 4000,
      });
      return;
    }

    setListingNft(nft.mintAddress || '');
    
    try {
      const response = await fetch(`${API_BASE}/api/marketplace/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: nft.mintAddress,
          seller: publicKey.toBase58(),
          price: parseFloat(price),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        addNotification({
          type: 'success',
          title: '✅ NFT Listed!',
          message: `NFT listed for ${price} SOL successfully`,
          duration: 5000,
        });
        // Refresh NFTs
        window.location.reload();
      } else {
        addNotification({
          type: 'error',
          title: '❌ Listing Failed',
          message: data.error || 'Unknown error occurred',
          duration: 5000,
        });
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: '❌ Listing Error',
        message: err instanceof Error ? err.message : 'Failed to list NFT',
        duration: 5000,
      });
    } finally {
      setListingNft(null);
    }
  };

  const handleDelistNFT = async (nft: NFT) => {
    if (!publicKey) return;

    setListingNft(nft.mintAddress || '');
    
    try {
      const response = await fetch(`${API_BASE}/api/marketplace/delist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: nft.mintAddress,
          seller: publicKey.toBase58(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        addNotification({
          type: 'success',
          title: '✅ NFT Delisted!',
          message: 'NFT delisted successfully',
          duration: 4000,
        });
        window.location.reload();
      } else {
        addNotification({
          type: 'error',
          title: '❌ Delisting Failed',
          message: data.error || 'Unknown error occurred',
          duration: 5000,
        });
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: '❌ Delisting Error',
        message: err instanceof Error ? err.message : 'Failed to delist NFT',
        duration: 5000,
      });
    } finally {
      setListingNft(null);
    }
  };

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

            <div className="p-4 space-y-3">
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
              
              {/* Listing Status */}
              {(nft as any).isListed ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                    <span className="text-sm text-green-400">Listed for:</span>
                    <span className="text-lg font-bold text-green-400">
                      {nft.price} SOL
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelistNFT(nft);
                    }}
                    disabled={listingNft === nft.mintAddress}
                    className="w-full btn-secondary text-sm py-2"
                  >
                    {listingNft === nft.mintAddress ? 'Delisting...' : '🔻 Delist'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Price in SOL"
                    value={listPrice[nft.mintAddress || ''] || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      setListPrice({ ...listPrice, [nft.mintAddress || '']: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleListNFT(nft);
                    }}
                    disabled={listingNft === nft.mintAddress}
                    className="w-full btn-primary-modern text-sm py-2"
                  >
                    {listingNft === nft.mintAddress ? 'Listing...' : '🏷️ List for Sale'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

