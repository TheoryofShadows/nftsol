import React, { useState, useEffect } from "react";
import PhantomConnect from "./components/PhantomConnect";
import MintForm from "./components/MintForm";
import NftGrid from "./components/NftGrid";
import "./styles/solana.css";

const API = import.meta.env.VITE_API_BASE || "https://nftsol-dev.onrender.com";

interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  mintAddress?: string;
  signature?: string;
}

export default function App() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'mint' | 'my-nfts'>('marketplace');

  // Load NFTs on component mount
  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API}/nfts`);
      const data = await response.json();
      setNfts(data.items || []);
    } catch (err) {
      setError('Failed to load NFTs');
      console.error('Error loading NFTs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMintSuccess = (newNFT: NFT) => {
    setNfts(prev => [newNFT, ...prev]);
    setActiveTab('marketplace');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            margin: 0, 
            color: 'white', 
            fontSize: '1.8rem',
            fontWeight: 'bold'
          }}>
            🎨 NFTSol
          </h1>
          <PhantomConnect />
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            { id: 'marketplace', label: '🏪 Marketplace' },
            { id: 'mint', label: '✨ Mint NFT' },
            { id: 'my-nfts', label: '👤 My NFTs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '1rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {activeTab === 'marketplace' && (
          <div>
            <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>
              🏪 NFT Marketplace
            </h2>
            {loading ? (
              <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>
                Loading NFTs...
              </div>
            ) : error ? (
              <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '2rem' }}>
                {error}
              </div>
            ) : (
              <NftGrid nfts={nfts} />
            )}
          </div>
        )}

        {activeTab === 'mint' && (
          <div>
            <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>
              ✨ Mint New NFT
            </h2>
            <MintForm />
          </div>
        )}

        {activeTab === 'my-nfts' && (
          <div>
            <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>
              👤 My NFTs
            </h2>
            <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>
              Connect your wallet to view your NFTs
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
