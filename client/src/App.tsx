import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  MathWalletAdapter,
  TokenPocketWalletAdapter,
  TrustWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { AppProvider } from './context/AppContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { NotificationProvider } from './components/NotificationSystem';
import { usePerformance } from './hooks/usePerformance';
import { useApp } from './context/AppContext';
import { useNotification } from './components/NotificationSystem';
import { useOnboarding } from './context/OnboardingContext';
import { trackPageView, trackWalletConnect, trackTabChange } from './utils/analytics';
import { initScrollReveal } from './hooks/useScrollReveal';
import CloutBadge from './components/CloutBadge';
import ContractInfo from './components/ContractInfo';
import CloutInfo from './components/CloutInfo';
import './styles/solana.css';
import './styles/design-system.css';
import './styles/mobile-fixes.css';
import './styles/modern-design.css';

// Lazy load components for better performance
// Wrap in error-handling lazy loaders
const lazyWithErrorBoundary = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return lazy(() =>
    importFn().catch((error) => {
      console.error('Failed to load component:', error);
      // Return a fallback component
      return {
        default: () => (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-400 mb-4">Failed to load component</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        ),
      } as { default: T };
    })
  );
};

const Hero = lazyWithErrorBoundary(() => import('./components/Hero'));
const PhantomConnect = lazyWithErrorBoundary(() => import('./components/PhantomConnect'));
const MintForm = lazyWithErrorBoundary(() => import('./components/MintForm'));
const NftGrid = lazyWithErrorBoundary(() => import('./components/NftGrid'));
const WithdrawalForm = lazyWithErrorBoundary(() => import('./components/WithdrawalForm'));
const ReferralSystem = lazyWithErrorBoundary(() => import('./components/ReferralSystem'));
const WaitlistSignup = lazyWithErrorBoundary(() => import('./components/WaitlistSignup'));
const EchoViewer = lazyWithErrorBoundary(() => import('./echo/EchoViewer'));
const EchoMarketplace = lazyWithErrorBoundary(() => import('./echo/EchoMarketplace'));
const AdminDashboard = lazyWithErrorBoundary(() => import('./components/AdminDashboard'));
const Dashboard = lazyWithErrorBoundary(() => import('./components/Dashboard'));
const WelcomeOnboarding = lazyWithErrorBoundary(() => import('./components/WelcomeOnboarding'));
const FeatureTour = lazyWithErrorBoundary(() => import('./components/FeatureTour'));
const OnboardingProgress = lazyWithErrorBoundary(() => import('./components/OnboardingProgress'));
const MyNfts = lazyWithErrorBoundary(() => import('./components/MyNfts'));
const Collections = lazyWithErrorBoundary(() => import('./components/Collections'));
const UnifiedDashboard = lazyWithErrorBoundary(() => import('./components/UnifiedDashboard'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    <span className="ml-2 text-white">Loading...</span>
  </div>
);

// Import enhanced ErrorBoundary
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { nfts, loading, error, loadMarketplace, clearError } = useApp();
  const { addNotification } = useNotification();
  const { metrics, getPerformanceReport } = usePerformance();
  const { connected, publicKey } = useWallet();
  const { startOnboarding, isStepCompleted, completeStep } = useOnboarding();
  
  // Error notification deduplication
  const lastErrorRef = useRef<string | null>(null);
  const lastErrorTimeRef = useRef<number>(0);

  // Dynamically determine cluster based on RPC URL
  const solanaCluster = import.meta.env.VITE_SOLANA_RPC_URL?.includes('mainnet')
    ? 'Solana Mainnet'
    : import.meta.env.VITE_SOLANA_RPC_URL?.includes('testnet')
    ? 'Solana Testnet'
    : 'Solana Devnet';

  // Load NFTs on mount
  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  // Initialize scroll reveal animations
  useEffect(() => {
    const cleanup = initScrollReveal();
    return cleanup;
  }, []);

  // Track page views
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  // Track wallet connections and trigger onboarding
  useEffect(() => {
    if (connected && publicKey) {
      // Try to detect wallet type from available adapters
      const walletType = 'Solana Wallet'; // Default, could be enhanced
      trackWalletConnect(walletType);

      // Complete wallet connection step
      if (!isStepCompleted('wallet-connect')) {
        completeStep('wallet-connect');

        // Start dashboard tour after wallet connection if not completed
        if (!isStepCompleted('dashboard-tour')) {
          setTimeout(() => {
            startOnboarding('dashboard-tour');
          }, 1000);
        }
      }
    }
  }, [connected, publicKey, isStepCompleted, completeStep, startOnboarding]);

  // Track tab changes and trigger relevant tours
  useEffect(() => {
    trackTabChange(activeTab);

    // Trigger tours based on tab selection if not completed
    if (activeTab === 'market' && !isStepCompleted('marketplace-tour')) {
      setTimeout(() => {
        startOnboarding('marketplace-tour');
      }, 500);
    } else if (activeTab === 'mint' && !isStepCompleted('mint-tour')) {
      setTimeout(() => {
        startOnboarding('mint-tour');
      }, 500);
    } else if (activeTab === 'my-nfts' && !isStepCompleted('portfolio-tour')) {
      setTimeout(() => {
        startOnboarding('portfolio-tour');
      }, 500);
    }
  }, [activeTab, isStepCompleted, startOnboarding]);

  // Performance monitoring
  useEffect(() => {
    if (import.meta.env.DEV) {
      getPerformanceReport();
      // Performance metrics available for development
    }
  }, [getPerformanceReport]);

  // Allow programmatic tab changes (used by Echo components)
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const customEvent = e as CustomEvent<string>;
        const detail = customEvent?.detail;
        if (typeof detail === 'string') {
          setActiveTab(detail);
          trackTabChange(detail);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Error handling tab change:', err);
        }
      }
    };
    window.addEventListener('change-tab', handler as EventListener);
    return () => {
      try {
        window.removeEventListener('change-tab', handler as EventListener);
      } catch (err) {
        // Silently fail on cleanup
      }
    };
  }, []);

  // Error handling with deduplication
  useEffect(() => {
    if (error) {
      const now = Date.now();
      const timeSinceLastError = now - lastErrorTimeRef.current;
      
      // Only show error notification if:
      // 1. It's a different error message, OR
      // 2. At least 10 seconds have passed since the last error
      if (error !== lastErrorRef.current || timeSinceLastError > 10000) {
        // Normalize server unreachable errors to a single message
        const normalizedError = error.includes('Unable to reach server') || 
                               error.includes('Failed to load')
          ? 'Server temporarily unavailable. Retrying in background...'
          : error;
        
      addNotification({
        type: 'error',
          title: 'Connection Issue',
          message: normalizedError,
          duration: 8000,
      });
        
        lastErrorRef.current = error;
        lastErrorTimeRef.current = now;
      }
    }
  }, [error, addNotification]);

  // Handle wallet disconnection
  useEffect(() => {
    if (!connected && publicKey === null) {
      // Wallet was disconnected - notify user if they were previously connected
      const wasConnected = sessionStorage.getItem('wallet_was_connected') === 'true';
      if (wasConnected) {
        addNotification({
          type: 'warning',
          title: 'Wallet Disconnected',
          message: 'Your wallet has been disconnected. Please reconnect to continue.',
          duration: 5000,
        });
        sessionStorage.removeItem('wallet_was_connected');
      }
    } else if (connected && publicKey) {
      // Wallet is connected - mark it
      sessionStorage.setItem('wallet_was_connected', 'true');
    }
  }, [connected, publicKey, addNotification]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    clearError();
  };

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      {/* Modern background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl float-animation"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl float-animation delay-2s"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl float-animation delay-4s"></div>
      </div>

      <header className="relative z-10 p-3 md:p-6 glass-modern border-b border-white/5 sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 md:space-x-6">
            {/* Modern logo */}
            <div className="flex items-center space-x-2 md:space-x-3 cursor-pointer group" onClick={() => handleTabChange('home')}>
              <div className="relative">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-xl md:rounded-2xl transform group-hover:rotate-12 transition-transform shadow-lg shadow-purple-500/30"></div>
                <div className="absolute top-1 left-1 md:top-1.5 md:left-1.5 w-6 h-6 md:w-9 md:h-9 bg-gradient-to-br from-purple-400 to-cyan-300 rounded-lg md:rounded-xl"></div>
                <div className="absolute top-2 left-2 md:top-3 md:left-3 w-4 h-4 md:w-6 md:h-6 bg-gradient-to-br from-purple-300 to-cyan-200 rounded md:rounded-lg flex items-center justify-center text-[8px] md:text-xs font-bold text-white">
                  NS
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold gradient-text-modern font-display tracking-tight leading-none">
                  NFTSol
                </h1>
                <p className="text-[10px] md:text-xs text-gray-400 font-mono hidden sm:block">Solana NFT Platform</p>
              </div>
            </div>

            {/* Performance indicator - Modern */}
            <div className="hidden md:flex items-center space-x-2 badge-modern">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs font-mono">
                {metrics.loadTime.toFixed(0)}ms
              </span>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="skeleton h-10 w-40 rounded-2xl"></div>
            }
          >
            <PhantomConnect />
          </Suspense>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-3 md:p-6">
        {/* Hero Section - Full Screen Animated Landing (Only on home) */}
        {activeTab === 'home' && (
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
              </div>
            }
          >
            <Hero />
          </Suspense>
        )}

        {/* Enhanced Navigation - Responsive */}
        <div className="mb-8">
          {/* Mobile Menu Toggle (only visible on mobile) */}
          <div className="md:hidden mb-4 flex justify-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="glass-modern px-6 py-3 rounded-xl font-semibold text-white flex items-center space-x-2"
            >
              <span className="text-xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
              <span>{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>

          {/* Desktop Navigation - Full buttons */}
          <div className="hidden md:flex flex-wrap justify-center gap-3 mb-12">
          {[
            { id: 'home', label: 'Home', icon: '🏠', desc: 'Landing' },
            { id: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'Overview' },
            { id: 'market', label: 'Marketplace', icon: '🏪', desc: 'Discover NFTs' },
            { id: 'mint', label: 'Mint NFT', icon: '✨', desc: 'Create new' },
            { id: 'echo-marketplace', label: 'Echo Market', icon: '🎭', desc: 'Collaborative' },
            { id: 'echo-mint', label: 'Mint Echo', icon: '🎬', desc: 'Eternal Echoes' },
            { id: 'echo-viewer', label: 'Echo Viewer', icon: '👁️', desc: 'Layers' },
            { id: 'my-nfts', label: 'My NFTs', icon: '👤', desc: 'Your collection' },
            { id: 'collections', label: 'Collections', icon: '📚', desc: 'Browse by type' },
            { id: 'clout', label: 'CLOUT Token', icon: '⭐', desc: 'Token Info' },
            { id: 'referrals', label: 'Referrals', icon: '🎯', desc: 'Earn rewards' },
            { id: 'withdraw', label: 'Withdraw SOL', icon: '💰', desc: 'Manage funds' },
            { id: 'admin', label: 'Admin', icon: '🔧', desc: 'Admin tools' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-xl shadow-purple-500/25'
                  : 'glass text-white hover:bg-white/20 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{tab.icon}</span>
                <div className="text-left">
                  <div className="font-bold">{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.desc}</div>
                </div>
              </div>
              {activeTab === tab.id && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 opacity-20"></div>
              )}
            </button>
          ))}
          </div>

          {/* Mobile Navigation - Compact scrollable */}
          <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
            <div className="glass-modern p-4 rounded-2xl max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'home', label: 'Home', icon: '🏠' },
                  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                  { id: 'market', label: 'Market', icon: '🏪' },
                  { id: 'mint', label: 'Mint', icon: '✨' },
                  { id: 'echo-marketplace', label: 'Echo Market', icon: '🎭' },
                  { id: 'echo-mint', label: 'Mint Echo', icon: '🎬' },
                  { id: 'echo-viewer', label: 'Echo Viewer', icon: '👁️' },
                  { id: 'my-nfts', label: 'My NFTs', icon: '👤' },
                  { id: 'collections', label: 'Collections', icon: '📚' },
                  { id: 'clout', label: 'CLOUT', icon: '⭐' },
                  { id: 'referrals', label: 'Referrals', icon: '🎯' },
                  { id: 'withdraw', label: 'Withdraw', icon: '💰' },
                  { id: 'admin', label: 'Admin', icon: '🔧' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      handleTabChange(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`relative px-3 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-xl">{tab.icon}</span>
                      <span className="text-xs font-medium">{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Quick Navigation - Always visible compact bar */}
          {!isMobileMenuOpen && (
            <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
              <div className="flex gap-2 min-w-max">
                {[
                  { id: 'home', icon: '🏠', label: 'Home' },
                  { id: 'market', icon: '🏪', label: 'Market' },
                  { id: 'mint', icon: '✨', label: 'Mint' },
                  { id: 'echo-marketplace', icon: '🎭', label: 'Echo' },
                  { id: 'my-nfts', icon: '👤', label: 'My NFTs' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                        : 'glass text-white'
                    }`}
                  >
                    <span className="mr-1.5">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="min-h-[600px]">
          {activeTab === 'home' && (
            <div className="animate-fade-in animate-slide-up mt-12">
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { id: 'market', label: 'Browse Marketplace', icon: '🏪', color: 'from-purple-500 to-pink-500' },
                  { id: 'mint', label: 'Mint NFT', icon: '✨', color: 'from-cyan-500 to-blue-500' },
                  { id: 'echo-mint', label: 'Create Echo', icon: '🎬', color: 'from-green-500 to-emerald-500' },
                  { id: 'echo-marketplace', label: 'Echo Market', icon: '🎭', color: 'from-orange-500 to-red-500' },
                ].map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleTabChange(action.id)}
                    className={`group relative overflow-hidden glass p-6 rounded-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-20 transition-opacity`}></div>
                    <div className="relative z-10">
                      <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">{action.icon}</div>
                      <div className="text-lg font-bold text-white">{action.label}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Featured NFTs Preview */}
              {!loading && nfts.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold gradient-text font-display">✨ Featured NFTs</h2>
                    <button
                      onClick={() => handleTabChange('market')}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {nfts.slice(0, 4).map((nft) => (
                      <div
                        key={nft.id}
                        onClick={() => handleTabChange('market')}
                        className="group glass rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                      >
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={nft.imageUrl || '/placeholder-nft.png'}
                            alt={nft.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-nft.svg';
                            }}
                          />
                          {nft.price && (
                            <div className="absolute top-2 right-2 glass px-2 py-1 rounded-lg">
                              <span className="text-yellow-400 font-bold text-sm">{nft.price} SOL</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-bold text-white text-sm truncate">{nft.name}</h3>
                          <p className="text-gray-400 text-xs truncate">{nft.description || 'No description'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="animate-fade-in animate-slide-up">
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="animate-fade-in animate-slide-up">
              <div
                className="flex items-center justify-between mb-8"
                data-tour="marketplace-header"
              >
                <h2 className="text-4xl font-bold gradient-text font-display">
                  🏪 NFT Marketplace
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="glass px-4 py-2 rounded-lg">
                    <span className="text-sm text-gray-300">Live on {solanaCluster}</span>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="loading-spinner"></div>
                  <span className="ml-4 text-gray-300">Loading marketplace...</span>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center py-20">
                      <div className="loading-spinner"></div>
                      <span className="ml-4 text-gray-300">Loading NFTs...</span>
                    </div>
                  }
                >
                  <div data-tour="nft-grid">
                    <NftGrid nfts={nfts} />
                  </div>
                </Suspense>
              )}
            </div>
          )}

          {activeTab === 'echo-marketplace' && (
            <div className="animate-fade-in animate-slide-up">
              <Suspense fallback={<LoadingSpinner />}>
                <EchoMarketplace />
              </Suspense>
            </div>
          )}

          {activeTab === 'echo-mint' && (
            <div className="animate-fade-in animate-slide-up">
              <Suspense fallback={<LoadingSpinner />}>
                <UnifiedDashboard />
              </Suspense>
            </div>
          )}

          {activeTab === 'echo-viewer' && (
            <div className="animate-fade-in animate-slide-up">
              <Suspense fallback={<LoadingSpinner />}>
                <EchoViewer />
              </Suspense>
            </div>
          )}

          {activeTab === 'clout' && (
            <div className="animate-fade-in animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold gradient-text font-display mb-4">
                  ⭐ CLOUT Token
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Learn about the CLOUT token, its utilities, and how to earn rewards on the NFTSol
                  platform.
                </p>
              </div>
              <CloutInfo />
            </div>
          )}

          {activeTab === 'mint' && (
            <div className="animate-fade-in animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold gradient-text font-display mb-4">
                  ✨ Mint New NFT
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Create your unique digital asset on the Solana blockchain. Fast, secure, and
                  cost-effective.
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center py-20">
                    <div className="loading-spinner"></div>
                    <span className="ml-4 text-gray-300">Loading mint form...</span>
                  </div>
                }
              >
                <div data-tour="mint-form">
                  <MintForm />
                </div>
              </Suspense>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="animate-fade-in animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold gradient-text font-display mb-4">
                  💰 Withdraw SOL
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Manage your SOL balance and withdraw funds from the platform wallet.
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center py-20">
                    <div className="loading-spinner"></div>
                    <span className="ml-4 text-gray-300">Loading withdrawal form...</span>
                  </div>
                }
              >
                <WithdrawalForm />
              </Suspense>
            </div>
          )}

          {activeTab === 'my-nfts' && (
            <div className="animate-fade-in animate-slide-up">
              <Suspense fallback={<LoadingSpinner />}>
                <MyNfts />
              </Suspense>
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="animate-fade-in animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold gradient-text font-display mb-4">
                  🎯 Referral System
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Earn 5% from every NFT minted through your referral link. Build your empire!
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center py-20">
                    <div className="loading-spinner"></div>
                    <span className="ml-4 text-gray-300">Loading referral system...</span>
                  </div>
                }
              >
                <ReferralSystem />
              </Suspense>
            </div>
          )}

          {activeTab === 'waitlist' && (
            <div className="animate-fade-in animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold gradient-text font-display mb-4">
                  🚀 Join the Waitlist
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Be the first to experience the future of NFT marketplaces. Early access, exclusive
                  rewards, and more!
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center py-20">
                    <div className="loading-spinner"></div>
                    <span className="ml-4 text-gray-300">Loading waitlist...</span>
                  </div>
                }
              >
                <WaitlistSignup />
              </Suspense>
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="animate-fade-in animate-slide-up">
              <Suspense fallback={<LoadingSpinner />}>
                <Collections />
              </Suspense>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="animate-fade-in animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold gradient-text font-display mb-4">
                  🔧 Admin Dashboard
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Manage platform operations, withdrawals, and system settings
                </p>
              </div>
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDashboard />
              </Suspense>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="relative z-10 mt-20 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-lg transform rotate-12 shadow-lg"></div>
                  <div className="absolute top-1 left-1 w-6 h-6 bg-gradient-to-br from-purple-400 to-cyan-300 rounded-lg transform rotate-12"></div>
                </div>
                <span className="text-2xl font-bold gradient-text font-display">NFTSol</span>
              </div>
              <p className="text-gray-400 text-sm">
                Lightning-fast NFT marketplace on Solana. Create, discover, and trade digital assets
                with unprecedented speed.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    Marketplace
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    Mint NFT
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    Collections
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    My NFTs
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>

            {/* Social & Status */}
            <div>
              <h3 className="text-white font-semibold mb-4">Connect</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Live on {solanaCluster}</span>
                </div>
                <div className="flex space-x-3">
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    Twitter
                  </a>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    Discord
                  </a>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 NFTSol. Built on Solana with ❤️</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-xs text-gray-500">Powered by</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-cyan-400 rounded"></div>
                <span className="text-sm font-semibold gradient-text">Solana</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* CloutBadge - Fixed position showing user's CLOUT balance */}
      <CloutBadge />

      {/* ContractInfo - Shows CLOUT contract addresses */}
      <div className="fixed left-4 bottom-4 z-40 max-w-xs">
        <ContractInfo />
      </div>

      {/* Onboarding Components */}
      <Suspense fallback={null}>
        <WelcomeOnboarding />
        <FeatureTour />
        <OnboardingProgress />
      </Suspense>
    </div>
  );
}

function App() {
  // Use environment variable for RPC URL or fallback to mainnet
  // Note: In Vite, use import.meta.env, not process.env
  const endpoint = (import.meta.env.VITE_SOLANA_RPC_URL as string) || clusterApiUrl('mainnet-beta');

  // Initialize all wallet adapters
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TrustWalletAdapter(),
    new TokenPocketWalletAdapter(),
    new LedgerWalletAdapter(),
    new MathWalletAdapter(),
    new TorusWalletAdapter(),
  ];

  return (
    <ErrorBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <AppProvider>
              <OnboardingProvider>
                <NotificationProvider>
                  <AppContent />
                </NotificationProvider>
              </OnboardingProvider>
            </AppProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  );
}

export default App;
