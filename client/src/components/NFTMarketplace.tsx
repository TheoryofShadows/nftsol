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
      const params = new URLSearchParams();
      
      if (filter === 'listed') {
        params.append('status', 'listed');
      } else if (filter === 'my-nfts' && publicKey) {
        params.append('owner', publicKey.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setNfts(data.nfts || []);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const buyNFT = async (mintAddress: string, price: string) => {
    if (!publicKey) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress,
          buyerWallet: publicKey.toString(),
          price: parseFloat(price)
        })
      });

      const result = await response.json();
      if (result.ok) {
        alert('NFT purchased successfully!');
        fetchNFTs();
      } else {
        alert(`Purchase failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed');
    }
  };

  if (loading) {
    return <div>Loading NFTs...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <button 
          onClick={() => setFilter('all')}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: filter === 'all' ? '#007bff' : '#f8f9fa',
            color: filter === 'all' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          All NFTs
        </button>
        <button 
          onClick={() => setFilter('listed')}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: filter === 'listed' ? '#007bff' : '#f8f9fa',
            color: filter === 'listed' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          For Sale
        </button>
        {connected && (
          <button 
            onClick={() => setFilter('my-nfts')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: filter === 'my-nfts' ? '#007bff' : '#f8f9fa',
              color: filter === 'my-nfts' ? 'white' : 'black',
              border: '1px solid #dee2e6',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            My NFTs
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 20
      }}>
        {nfts.map((nft) => (
          <div key={nft.id} style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 16,
            backgroundColor: 'white'
          }}>
            <IpfsImage 
              src={nft.image} 
              alt={nft.name}
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
            />
            <h3 style={{ margin: '12px 0 8px 0', fontSize: 18, fontWeight: 600 }}>
              {nft.name}
            </h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>
              {nft.description}
            </p>
            {nft.price && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 700 }}>
                  {nft.price} SOL
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              {nft.status === 'listed' && nft.price && (
                <button
                  onClick={() => buyNFT(nft.mintAddress, nft.price!)}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  Buy Now
                </button>
              )}
              {nft.status === 'minted' && nft.owner === publicKey?.toString() && (
                <button
                  onClick={() => {/* Implement list for sale */}}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  List for Sale
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {nfts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
          No NFTs found
        </div>
      )}
    </div>
  );
}
