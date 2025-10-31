import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './components/NotificationSystem';
import { usePerformance } from './hooks/usePerformance';
import { useApp } from './context/AppContext';
import { useNotification } from './components/NotificationSystem';
import CloutBadge from './components/CloutBadge';
import ContractInfo from './components/ContractInfo';
import CloutInfo from './components/CloutInfo';
import './styles/solana.css';
import './styles/design-system.css';

// Lazy load components for better performance
const Hero = lazy(() => import('./components/Hero'));
const PhantomConnect = lazy(() => import('./components/PhantomConnect'));
const MintForm = lazy(() => import('./components/MintForm'));
const NftGrid = lazy(() => import('./components/NftGrid'));
const WithdrawalForm = lazy(() => import('./components/WithdrawalForm'));
const ReferralSystem = lazy(() => import('./components/ReferralSystem'));
const WaitlistSignup = lazy(() => import('./components/WaitlistSignup'));
const EchoMint = lazy(() => import('./echo/EchoMint'));
const EchoViewer = lazy(() => import('./echo/EchoViewer'));
const EchoMarketplace = lazy(() => import('./echo/EchoMarketplace'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    <span className="ml-2 text-white">Loading...</span>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-lg mb-4">We&apos;re sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('market');
  const { nfts, loading, error, loadMarketplace, clearError } = useApp();
  const { addNotification } = useNotification();
  const { metrics, getPerformanceReport } = usePerformance();
  const { connected, publicKey, disconnect, connecting } = useWallet();

  // Load NFTs on mount
  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  // Performance monitoring
  useEffect(() => {
    const report = getPerformanceReport();
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.log('Performance Report:', report);
  }, [getPerformanceReport]);

  // Allow programmatic tab changes (used by Echo components)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if (typeof detail === 'string') setActiveTab(detail);
    };
    window.addEventListener('change-tab', handler as EventListener);
    return () => window.removeEventListener('change-tab', handler as EventListener);
  }, []);

  // Error handling
  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error,
      });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <header className="relative z-10 p-6 backdrop-blur-sm bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            {/* Solana-style logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-lg transform rotate-12 shadow-lg"></div>
                <div className="absolute top-1 left-1 w-8 h-8 bg-gradient-to-br from-purple-400 to-cyan-300 rounded-lg transform rotate-12"></div>
                <div className="absolute top-2 left-2 w-6 h-6 bg-gradient-to-br from-purple-300 to-cyan-200 rounded-lg transform rotate-12"></div>
              </div>
              <h1 className="text-4xl font-bold gradient-text font-display tracking-tight">
                NFTSol
              </h1>
            </div>

            {/* Performance indicator with Solana styling */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-black/30 rounded-full border border-cyan-400/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-cyan-300 font-mono">
                {metrics.loadTime.toFixed(0)}ms
              </span>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="btn-glass animate-pulse">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Loading...
              </div>
            }
          >
            <PhantomConnect />
          </Suspense>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Hero Section - Full Screen Animated Landing */}
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="loading-spinner"></div>
            </div>
          }
        >
          <Hero />
        </Suspense>

        {/* Enhanced Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { id: 'market', label: 'Marketplace', icon: '🏪', desc: 'Discover NFTs' },
            { id: 'mint', label: 'Mint NFT', icon: '✨', desc: 'Create new' },
            { id: 'echo-marketplace', label: 'Echo Market', icon: '🎭', desc: 'Collaborative' },
            { id: 'echo-mint', label: 'Mint Echo', icon: '🎬', desc: 'Eternal Echoes' },
            { id: 'echo-viewer', label: 'Echo Viewer', icon: '👁️', desc: 'Layers' },
            { id: 'clout', label: 'CLOUT Token', icon: '⭐', desc: 'Token Info' },
            { id: 'referrals', label: 'Referrals', icon: '🎯', desc: 'Earn rewards' },
            { id: 'waitlist', label: 'Waitlist', icon: '🚀', desc: 'Join early' },
            { id: 'withdraw', label: 'Withdraw SOL', icon: '💰', desc: 'Manage funds' },
            { id: 'my-nfts', label: 'My NFTs', icon: '👤', desc: 'Your collection' },
            { id: 'collections', label: 'Collections', icon: '📚', desc: 'Browse by type' },
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
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 opacity-20 animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[600px]">
          {activeTab === 'market' && (
            <div className="animate-fade-in animate-slide-up">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-bold gradient-text font-display">
                  🏪 NFT Marketplace
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="glass px-4 py-2 rounded-lg">
                    <span className="text-sm text-gray-300">Live on Solana Devnet</span>
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
                  <NftGrid nfts={nfts} />
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
                <EchoMint />
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
                <MintForm />
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
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-bold gradient-text font-display">👤 My NFTs</h2>
                <div className="glass px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-300">Your Collection</span>
                </div>
              </div>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center py-20">
                    <div className="loading-spinner"></div>
                    <span className="ml-4 text-gray-300">Loading your NFTs...</span>
                  </div>
                }
              >
                <NftGrid nfts={nfts} />
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
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold gradient-text font-display mb-4">
                  📚 Collections
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Browse NFTs by collection and discover curated digital art.
                </p>
              </div>
              <div className="text-center py-20">
                <div className="glass p-12 rounded-2xl max-w-md mx-auto">
                  <div className="text-6xl mb-4">🚀</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
                  <p className="text-gray-300">Collections feature is in development</p>
                </div>
              </div>
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
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-400">Live on Solana Devnet</span>
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
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
    new CoinbaseWalletAdapter(),
  ];

  return (
    <ErrorBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <AppProvider>
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </AppProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  );
}

export default App;
