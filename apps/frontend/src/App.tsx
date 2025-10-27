import React, { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { UniversalWalletProvider, WalletSelector } from "./wallet/UniversalWalletAdapter";
import CloutBadge from "./components/CloutBadge";
import InstallButton from "./components/InstallButton";
import OfflineIndicator from "./components/OfflineIndicator";
import { logError } from "./utils/errorHandler";
import "./App.css";

// Lazy load components for code splitting
const HomePage = lazy(() => import("./components/HomePage"));
const NFTMarketplace = lazy(() => import("./components/NFTMarketplace"));
const MintForm = lazy(() => import("./components/MintForm"));
const CloutExplanation = lazy(() => import("./components/CloutExplanation"));
const SmartContractPage = lazy(() => import("./components/SmartContractPage"));
const TimeCapsuleSales = lazy(() => import("./components/TimeCapsuleSales"));
const CollectionManager = lazy(() => import("./components/CollectionManager"));
const ProxyCheck = lazy(() => import("./components/ProxyCheck"));
const UserAuth = lazy(() => import("./components/UserAuth"));
const UserDashboard = lazy(() => import("./components/UserDashboard"));
const AnalyticsDashboard = lazy(() => import("./components/AnalyticsDashboard"));
const TransparencyDashboard = lazy(() => import("./components/TransparencyDashboard"));

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'marketplace' | 'mint' | 'clout' | 'smart-contract' | 'time-capsules' | 'collections' | 'proxy' | 'dashboard' | 'analytics' | 'transparency'>('home');
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen for custom tab change events from buttons
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const tab = event.detail as any;
      setActiveTab(tab);
    };

    window.addEventListener('change-tab', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('change-tab', handleTabChange as EventListener);
    };
  }, []);

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

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close mobile menu on Escape
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
      
      // Navigate with number keys (1-9 for different tabs)
      if (event.key >= '1' && event.key <= '9' && !event.ctrlKey && !event.metaKey) {
        const tabIndex = parseInt(event.key) - 1;
        const tabs = ['home', 'marketplace', 'mint', 'clout', 'smart-contract', 'time-capsules', 'collections', 'proxy', 'dashboard'];
        if (tabs[tabIndex]) {
          setActiveTab(tabs[tabIndex] as any);
          setIsMobileMenuOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading NFTSol...</p>
        </div>
      </div>
    );
  }

  return (
    <UniversalWalletProvider>
      <div className="app">
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        
        {/* PWA Components */}
        <OfflineIndicator />
        <InstallButton />
        
        {/* Revolutionary Header */}
        <header className="hero-header">
          <div className="hero-content">
            <div className="logo-section">
              <div className="solana-logo">
                <img 
                  src="/assets/nftsol-logo.svg" 
                  alt="NFTSol Logo" 
                  className="custom-logo"
                  style={{ width: '60px', height: '60px', marginRight: '12px' }}
                />
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
          {/* Mobile Hamburger Menu */}
          {isClient && isMobile && (
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <motion.span
                className="hamburger-line"
                animate={isMobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="hamburger-line"
                animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="hamburger-line"
                animate={isMobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
            </button>
          )}

          {/* Desktop Navigation */}
          {isClient && !isMobile && (
            <div className="desktop-nav">
              <button
                onClick={() => setActiveTab('home')}
                className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
                aria-label="Navigate to Home"
              >
                🏠 Home
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`nav-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
                aria-label="Navigate to Marketplace"
              >
                🏪 Marketplace
              </button>
              <button
                onClick={() => setActiveTab('mint')}
                className={`nav-tab ${activeTab === 'mint' ? 'active' : ''}`}
                aria-label="Navigate to Create NFT"
              >
                ✨ Create NFT
              </button>
              <button
                onClick={() => setActiveTab('clout')}
                className={`nav-tab ${activeTab === 'clout' ? 'active' : ''}`}
                aria-label="Navigate to CLOUT Token"
              >
                ⚡ CLOUT Token
              </button>
              <button
                onClick={() => setActiveTab('smart-contract')}
                className={`nav-tab ${activeTab === 'smart-contract' ? 'active' : ''}`}
                aria-label="Navigate to Smart Contracts"
              >
                🛡️ Smart Contracts
              </button>
              <button
                onClick={() => setActiveTab('time-capsules')}
                className={`nav-tab ${activeTab === 'time-capsules' ? 'active' : ''}`}
                aria-label="Navigate to Time Capsules"
              >
                ⏰ Time Capsules
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`nav-tab ${activeTab === 'collections' ? 'active' : ''}`}
                aria-label="Navigate to Collections"
              >
                🏗️ Collections
              </button>
              <button
                onClick={() => setActiveTab('proxy')}
                className={`nav-tab ${activeTab === 'proxy' ? 'active' : ''}`}
                aria-label="Navigate to Proxy Test"
              >
                🔧 Proxy Test
              </button>
              {user && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                  aria-label="Navigate to Dashboard"
                >
                  👤 Dashboard
                </button>
              )}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                aria-label="Navigate to Analytics"
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setActiveTab('transparency')}
                className={`nav-tab ${activeTab === 'transparency' ? 'active' : ''}`}
                aria-label="Navigate to Transparency"
              >
                🔍 Transparency
              </button>
            </div>
          )}

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {isClient && isMobile && isMobileMenuOpen && (
              <motion.div
                className="mobile-nav-menu"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }}
                  className={`mobile-nav-tab ${activeTab === 'home' ? 'active' : ''}`}
                  aria-label="Navigate to Home"
                >
                  🏠 Home
                </button>
                <button
                  onClick={() => { setActiveTab('marketplace'); setIsMobileMenuOpen(false); }}
                  className={`mobile-nav-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
                  aria-label="Navigate to Marketplace"
                >
                  🏪 Marketplace
                </button>
                <button
                  onClick={() => { setActiveTab('mint'); setIsMobileMenuOpen(false); }}
                  className={`mobile-nav-tab ${activeTab === 'mint' ? 'active' : ''}`}
                  aria-label="Navigate to Create NFT"
                >
                  ✨ Create NFT
                </button>
                <button
                  onClick={() => { setActiveTab('clout'); setIsMobileMenuOpen(false); }}
                  className={`mobile-nav-tab ${activeTab === 'clout' ? 'active' : ''}`}
                  aria-label="Navigate to CLOUT Token"
                >
                  ⚡ CLOUT Token
                </button>
                <button
                  onClick={() => { setActiveTab('smart-contract'); setIsMobileMenuOpen(false); }}
                  className={`mobile-nav-tab ${activeTab === 'smart-contract' ? 'active' : ''}`}
                  aria-label="Navigate to Smart Contracts"
                >
                  🛡️ Smart Contracts
                </button>
                <button
                  onClick={() => { setActiveTab('time-capsules'); setIsMobileMenuOpen(false); }}
                  className={`mobile-nav-tab ${activeTab === 'time-capsules' ? 'active' : ''}`}
                  aria-label="Navigate to Time Capsules"
                >
                  ⏰ Time Capsules
                </button>
                <button
                  onClick={() => { setActiveTab('collections'); setIsMobileMenuOpen(false); }}
                  className={`mobile-nav-tab ${activeTab === 'collections' ? 'active' : ''}`}
                  aria-label="Navigate to Collections"
                >
                  🏗️ Collections
                </button>
                <button
                  onClick={() => { setActiveTab('proxy'); setIsMobileMenuOpen(false); }}
                  className={`mobile-nav-tab ${activeTab === 'proxy' ? 'active' : ''}`}
                  aria-label="Navigate to Proxy Test"
                >
                  🔧 Proxy Test
                </button>
                {user && (
                  <button
                    onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                    className={`mobile-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                    aria-label="Navigate to Dashboard"
                  >
                    👤 Dashboard
                  </button>
                )}
                <button
                  onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
                  className={`mobile-nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                  aria-label="Navigate to Analytics"
                >
                  📊 Analytics
                </button>
                <button
                  onClick={() => { setActiveTab('transparency'); setIsMobileMenuOpen(false); }}
                  className={`mobile-nav-tab ${activeTab === 'transparency' ? 'active' : ''}`}
                  aria-label="Navigate to Transparency"
                >
                  🔍 Transparency
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Revolutionary Content */}
        <main id="main-content" className="content-section" role="main" aria-label="Main content">
          <Suspense fallback={
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          }>
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
          
          {activeTab === 'transparency' && <TransparencyDashboard />}
          
          {!user && activeTab !== 'home' && activeTab !== 'marketplace' && activeTab !== 'mint' && activeTab !== 'clout' && activeTab !== 'smart-contract' && activeTab !== 'time-capsules' && activeTab !== 'collections' && activeTab !== 'proxy' && activeTab !== 'analytics' && activeTab !== 'transparency' && (
            <UserAuth 
              onUserLogin={setUser}
              onUserLogout={() => setUser(null)}
            />
          )}
          </Suspense>
        </main>

        {/* Revolutionary Footer */}
        <footer className="hero-header" style={{ marginTop: '4rem', padding: '3rem 0' }}>
          <div className="hero-content">
            <div className="logo-section">
              <div className="solana-logo">
                <img 
                  src="/assets/nftsol-logo.svg" 
                  alt="NFTSol Logo" 
                  className="custom-logo"
                  style={{ width: '40px', height: '40px', marginRight: '8px' }}
                />
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
