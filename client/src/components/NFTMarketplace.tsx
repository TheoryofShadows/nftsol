import React, { useState, useEffect } from 'react';
import { useUniversalWallet } from '../wallet/UniversalWalletAdapter';
import IpfsImage from './IpfsImage';

interface NFT {
  id: string;
  mintAddress: string;
  name: string;
  description: string;
  image: string;
  price?: string;
  owner: string;
  status: string;
  collection?: string;
}

export default function NFTMarketplace() {
  const { publicKey, connected } = useUniversalWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'listed' | 'my-nfts'>('all');

  useEffect(() => {
    fetchNFTs();
  }, [filter, publicKey]);

  const fetchNFTs = async () => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE}/api/nfts`;
      
      if (filter === 'listed') {
        url += '?status=listed';
      } else if (filter === 'my-nfts' && publicKey) {
        url += `?owner=${publicKey.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setNfts(data.nfts || []);
    } catch (error: any) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const buyNFT = async (nft: NFT) => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftId: nft.id,
          buyerWallet: publicKey?.toString(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('NFT purchased successfully!');
        fetchNFTs();
      } else {
        alert('Purchase failed: ' + result.error);
      }
    } catch (error: any) {
      console.error('Error buying NFT:', error);
      alert('Purchase failed: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading revolutionary NFTs...</p>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      {/* Revolutionary Filter Section */}
      <div className="filter-section">
        <div className="filter-buttons">
          <button
            onClick={() => setFilter('all')}
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            🌟 All NFTs
          </button>
          <button
            onClick={() => setFilter('listed')}
            className={`filter-btn ${filter === 'listed' ? 'active' : ''}`}
          >
            💰 For Sale
          </button>
          {connected && (
            <button
              onClick={() => setFilter('my-nfts')}
              className={`filter-btn ${filter === 'my-nfts' ? 'active' : ''}`}
            >
              👤 My NFTs
            </button>
          )}
        </div>
        
        {/* CLOUT Stats */}
        {connected && (
          <div className="clout-stats">
            <div className="stat-item">
              <div className="stat-value">1,000</div>
              <div className="stat-label">CLOUT Balance</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">85</div>
              <div className="stat-label">Honor Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">15%</div>
              <div className="stat-label">Fee Discount</div>
            </div>
          </div>
        )}
      </div>

      {/* Revolutionary NFT Grid */}
      {nfts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3>No NFTs Found</h3>
          <p>Be the first to create a revolutionary NFT on this platform!</p>
          {!connected && (
            <button className="btn-primary">
              Connect Wallet to Get Started
            </button>
          )}
        </div>
      ) : (
        <div className="nft-grid">
          {nfts.map((nft) => (
            <div key={nft.id} className="nft-card">
              <div className="nft-image-container">
                <IpfsImage 
                  src={nft.image} 
                  alt={nft.name}
                  className="nft-image"
                />
                {nft.status === 'listed' && (
                  <div className="nft-badge">For Sale</div>
                )}
                {nft.collection && (
                  <div className="collection-badge">{nft.collection}</div>
                )}
              </div>
              
              <div className="nft-info">
                <h3 className="nft-name">{nft.name}</h3>
                <p className="nft-description">{nft.description}</p>
                
                {nft.price && (
                  <div className="nft-price-section">
                    <div className="nft-price">
                      {nft.price} SOL
                    </div>
                    <div className="clout-discount">
                      Save 15% with CLOUT
                    </div>
                  </div>
                )}
                
                <div className="nft-actions">
                  {nft.status === 'listed' ? (
                    <button 
                      onClick={() => buyNFT(nft)}
                      className="btn-primary"
                      disabled={!connected}
                    >
                      {connected ? 'Buy Now' : 'Connect Wallet'}
                    </button>
                  ) : (
                    <div className="nft-status">
                      {nft.status === 'minted' ? 'Minted' : nft.status}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revolutionary Features Showcase */}
      <div className="features-showcase">
        <h3>🚀 Revolutionary Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h4>Universal Wallets</h4>
            <p>Connect with Phantom, Solflare, and any Solana wallet</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h4>CLOUT Rewards</h4>
            <p>Earn CLOUT tokens for platform activity and good behavior</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h4>Honor System</h4>
            <p>Trust-based payments and rewards based on your reputation</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h4>Universal NFTs</h4>
            <p>View and trade NFTs from any Solana platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}