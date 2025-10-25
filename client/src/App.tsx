import React, { useState, useEffect } from "react";
import { UniversalWalletProvider, WalletSelector } from "./wallet/UniversalWalletAdapter";
import MintForm from "./components/MintForm";
import NFTMarketplace from "./components/NFTMarketplace";
import ProxyCheck from "./components/ProxyCheck";
import CloutBadge from "./components/CloutBadge";
import HomePage from "./components/HomePage";
import CloutExplanation from "./components/CloutExplanation";
import SmartContractPage from "./components/SmartContractPage";
import TimeCapsuleSales from "./components/TimeCapsuleSales";
import CollectionManager from "./components/CollectionManager";
import InstallButton from "./components/InstallButton";
import OfflineIndicator from "./components/OfflineIndicator";
import UserAuth from "./components/UserAuth";
import UserDashboard from "./components/UserDashboard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import { logError } from "./utils/errorHandler";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'marketplace' | 'mint' | 'clout' | 'smart-contract' | 'time-capsules' | 'collections' | 'proxy' | 'dashboard' | 'analytics'>('home');
  const [user, setUser] = useState<any>(null);

  // Global error handling
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError(event.error, 'Global Error Handler');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError(new Error(event.reason), 'Unhandled Promise Rejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <UniversalWalletProvider>
      <div className="app">
        {/* PWA Components */}
        <OfflineIndicator />
        <InstallButton />
        
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
            onClick={() => setActiveTab('home')}
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
          >
            🏠 Home
          </button>
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
            onClick={() => setActiveTab('clout')}
            className={`nav-tab ${activeTab === 'clout' ? 'active' : ''}`}
          >
            ⚡ CLOUT Token
          </button>
          <button
            onClick={() => setActiveTab('smart-contract')}
            className={`nav-tab ${activeTab === 'smart-contract' ? 'active' : ''}`}
          >
            🛡️ Smart Contracts
          </button>
          <button
            onClick={() => setActiveTab('time-capsules')}
            className={`nav-tab ${activeTab === 'time-capsules' ? 'active' : ''}`}
          >
            ⏰ Time Capsules
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`nav-tab ${activeTab === 'collections' ? 'active' : ''}`}
          >
            🏗️ Collections
          </button>
          <button
            onClick={() => setActiveTab('proxy')}
            className={`nav-tab ${activeTab === 'proxy' ? 'active' : ''}`}
          >
            🔧 Proxy Test
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              👤 Dashboard
            </button>
          )}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            📊 Analytics
          </button>
        </nav>

        {/* Revolutionary Content */}
        <main className="content-section">
          {activeTab === 'home' && <HomePage />}

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

          {activeTab === 'clout' && <CloutExplanation />}

          {activeTab === 'smart-contract' && <SmartContractPage />}

          {activeTab === 'time-capsules' && (
            <div className="section-card fade-in-up">
              <h2 className="section-title">
                ⏰ Time Capsule Sales
              </h2>
              <TimeCapsuleSales />
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="section-card fade-in-up">
              <h2 className="section-title">
                🏗️ Collection Manager
              </h2>
              <CollectionManager />
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
          
          {activeTab === 'dashboard' && user && <UserDashboard user={user} />}
          
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          
          {!user && activeTab !== 'home' && activeTab !== 'marketplace' && activeTab !== 'mint' && activeTab !== 'clout' && activeTab !== 'smart-contract' && activeTab !== 'time-capsules' && activeTab !== 'collections' && activeTab !== 'proxy' && activeTab !== 'analytics' && (
            <UserAuth 
              onUserLogin={setUser}
              onUserLogout={() => setUser(null)}
            />
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
