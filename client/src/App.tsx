import React, { useState } from "react";
import { UniversalWalletProvider, WalletSelector } from "./wallet/UniversalWalletAdapter";
import MintForm from "./components/MintForm";
import NFTMarketplace from "./components/NFTMarketplace";
import ProxyCheck from "./components/ProxyCheck";
import CloutBadge from "./components/CloutBadge";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'mint' | 'proxy'>('marketplace');

  return (
    <UniversalWalletProvider>
      <div className="app">
        {/* Revolutionary Header */}
        <header className="hero-header">
          <div className="hero-content">
            <div className="logo-section">
              <div className="solana-logo">
                <div className="solana-icon">⚡</div>
                <h1 className="brand-title">NFTSol</h1>
              </div>
              <div className="tagline">
                The Most Revolutionary NFT Platform on Solana
              </div>
            </div>
            
            <div className="wallet-section">
              <WalletSelector />
              <CloutBadge />
            </div>
          </div>
        </header>

        {/* Revolutionary Navigation */}
        <nav className="nav-tabs">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`nav-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
          >
            🏪 Marketplace
          </button>
          <button
            onClick={() => setActiveTab('mint')}
            className={`nav-tab ${activeTab === 'mint' ? 'active' : ''}`}
          >
            ✨ Create NFT
          </button>
          <button
            onClick={() => setActiveTab('proxy')}
            className={`nav-tab ${activeTab === 'proxy' ? 'active' : ''}`}
          >
            🔧 Proxy Test
          </button>
        </nav>

        {/* Revolutionary Content */}
        <main className="content-section">
          {activeTab === 'marketplace' && (
            <div className="section-card fade-in-up">
              <h2 className="section-title">
                🏪 Revolutionary NFT Marketplace
              </h2>
              <NFTMarketplace />
            </div>
          )}

          {activeTab === 'mint' && (
            <div className="section-card fade-in-up">
              <h2 className="section-title">
                ✨ Create Your Revolutionary NFT
              </h2>
              <MintForm />
            </div>
          )}

          {activeTab === 'proxy' && (
            <div className="section-card fade-in-up">
              <h2 className="section-title">
                🔧 IPFS Proxy Test
              </h2>
              <ProxyCheck />
            </div>
          )}
        </main>

        {/* Revolutionary Footer */}
        <footer className="hero-header" style={{ marginTop: '4rem', padding: '3rem 0' }}>
          <div className="hero-content">
            <div className="logo-section">
              <div className="solana-logo">
                <div className="solana-icon">⚡</div>
                <h3 className="brand-title" style={{ fontSize: '1.5rem' }}>NFTSol</h3>
              </div>
              <div className="tagline" style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                The Most Revolutionary NFT Platform on Solana
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--solana-green)' }}>CLOUT</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Revolutionary Token</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--solana-blue)' }}>Honor</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Trust-Based Rewards</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--solana-purple)' }}>Universal</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>All Solana NFTs</div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </UniversalWalletProvider>
  );
}
