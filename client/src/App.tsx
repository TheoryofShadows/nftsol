import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { getRpcUrl, getWalletAdapters } from './config/wallet';
import { AppProvider } from './context/AppContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { NotificationProvider } from './components/NotificationSystem';
import { usePerformance } from './hooks/usePerformance';
import { useApp } from './context/AppContext';
import { useNotification } from './components/NotificationSystem';
import { useOnboarding } from './context/OnboardingContext';
import { trackPageView, trackWalletConnect, trackTabChange } from './utils/analytics';
import { initScrollReveal } from './hooks/useScrollReveal';
import { logger } from './utils/logger';
import CloutBadge from './components/CloutBadge';
import ContractInfo from './components/ContractInfo';
import CloutInfo from './components/CloutInfo';
import MagicEdenHeader from './components/MagicEdenHeader';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better performance
// Wrap in error-handling lazy loaders
const lazyWithErrorBoundary = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return lazy(async () => {
    try {
      const module = await importFn();
      return { default: module.default } as { default: T };
    } catch (error: any) {
      console.error('Failed to load component:', error);
      // Log additional details for debugging
      if (import.meta.env.DEV) {
        console.error('Import error details:', {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        });
      }
      // Return a fallback component that still allows the app to function
      const FallbackComponent = () => (
        <div className="p-4 text-red-500">
          <div>Component failed to load. Please try refreshing the page.</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gold text-black rounded-lg hover:opacity-90 transition-opacity mt-2"
          >
            Reload Page
          </button>
        </div>
      );
      return { default: FallbackComponent as unknown as T };
    }
  });
};

const Hero = lazyWithErrorBoundary(() => import('./components/Hero'));
const MintForm = lazyWithErrorBoundary(() => import('./components/MintForm'));
const WithdrawalForm = lazyWithErrorBoundary(() => import('./components/WithdrawalForm'));
const AdminDashboard = lazyWithErrorBoundary(() => import('./components/AdminDashboard'));
const Dashboard = lazyWithErrorBoundary(() => import('./components/Dashboard'));
const WelcomeOnboarding = lazyWithErrorBoundary(() => import('./components/WelcomeOnboarding'));
const FeatureTour = lazyWithErrorBoundary(() => import('./components/FeatureTour'));
const OnboardingProgress = lazyWithErrorBoundary(() => import('./components/OnboardingProgress'));
const MyNfts = lazyWithErrorBoundary(() => import('./components/MyNfts'));
const Collections = lazyWithErrorBoundary(() => import('./components/Collections'));
const ProfessionalMarketplace = lazyWithErrorBoundary(() => import('./components/ProfessionalMarketplace'));
const DiscoverMintPage = lazyWithErrorBoundary(() => import('./components/DiscoverMintPage'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
    <span className="ml-2 text-white">Loading...</span>
  </div>
);

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { nfts, loading, error, loadMarketplace, clearError } = useApp();
  const { addNotification } = useNotification();
  const { metrics: _metrics, getPerformanceReport } = usePerformance();
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

  // Initialize logger banner and scroll reveal
  useEffect(() => {
    // Display welcome banner in console
    logger.banner();
    logger.info('NFTSol Platform initialized');
    logger.debug('Environment:', import.meta.env.MODE);
    logger.debug('Cluster:', solanaCluster);

    // Initialize scroll reveal animations
    const cleanup = initScrollReveal();
    return cleanup;
  }, [solanaCluster]);

  // Load NFTs on mount
  useEffect(() => {
    logger.timeStart('Marketplace Load');
    loadMarketplace();
    logger.timeEnd('Marketplace Load');
  }, [loadMarketplace]);

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
      } catch {
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
        // By the time we surface an error the API layer has already retried
        // several times with backoff, so don't claim we're still retrying.
        const isNetworkError = error.includes('Unable to reach server') ||
                               error.includes('Failed to load');
        const normalizedError = isNetworkError
          ? 'Could not reach the NFTSol backend. Some data may be unavailable — try refreshing in a moment.'
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

  // Memoize collections data with stable random values
  const collectionsData = useMemo(() => {
    return nfts.map((nft, index) => {
      // Use index as seed for consistent random values per NFT
      const seed = index + 1;
      return {
        id: nft.id || 'unknown',
        name: nft.name || 'Unknown NFT',
        image: nft.imageUrl || '/placeholder-nft.png',
        floorPrice: parseFloat(nft.price || '0'),
        volume24h: (seed * 123.45) % 1000, // Stable pseudo-random value
        priceChange24h: ((seed * 67.89) % 40) - 20, // Range: -20 to 20
        listedCount: (seed * 7) % 100 + 1,
        salesCount24h: (seed * 13) % 50 + 1,
        holders: (seed * 37) % 1000 + 100,
      };
    });
  }, [nfts]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    clearError();
  };

  return (
    <div className="min-h-screen bg-[#050505] relative">
      {/* Professional Magic Eden-style Header */}
      <MagicEdenHeader activeTab={activeTab} onTabChange={handleTabChange} />

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

        <div className="min-h-[600px]">
          {activeTab === 'discover' && (
            <div className="animate-fade-in animate-slide-up">
              <Suspense fallback={<LoadingSpinner />}>
                <DiscoverMintPage />
              </Suspense>
            </div>
          )}

          {activeTab === 'home' && (
            <div className="animate-fade-in animate-slide-up mt-12">
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { id: 'discover', label: 'Search & Mint' },
                  { id: 'market', label: 'Browse Marketplace' },
                  { id: 'mint', label: 'Upload & Mint' },
                  { id: 'my-nfts', label: 'My NFTs' },
                ].map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleTabChange(action.id)}
                    className="bg-[#111111] border border-[#1e1e1e] rounded-lg p-6 transform transition-all duration-300 hover:scale-105 hover:border-gold/25 hover:shadow-2xl"
                  >
                    <div className="text-lg font-bold text-white">{action.label}</div>
                  </button>
                ))}
              </div>
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
              <Suspense
                fallback={
                  <div className="flex justify-center items-center py-20">
                    <div className="loading-spinner"></div>
                    <span className="ml-4 text-gray-300">Loading marketplace...</span>
                  </div>
                }
              >
                <ProfessionalMarketplace
                  collections={collectionsData}
                  loading={loading}
                />
              </Suspense>
            </div>
          )}

          {activeTab === 'clout' && (
            <div className="animate-fade-in animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white font-display mb-4">
                  CLOUT Token
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
                <h2 className="text-4xl font-bold text-white font-display mb-4">
                  Upload & Mint
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Upload your own image and mint it as a compressed Solana NFT for fractions of a cent.
                  Want to mint from the open web instead? Use{' '}
                  <button onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'discover' }))} className="text-gold underline hover:opacity-80">
                    Discover &amp; Mint
                  </button>.
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
                <h2 className="text-4xl font-bold text-white font-display mb-4">
                  Withdraw SOL
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
                <h2 className="text-4xl font-bold text-white font-display mb-4">
                  Admin Dashboard
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
      <footer className="relative z-10 mt-20 border-t border-[#1e1e1e] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gold rounded-md flex items-center justify-center shadow-lg">
                  <div className="w-4 h-4 bg-black/20 rounded-sm"></div>
                </div>
                <span className="text-2xl font-bold text-white font-display">NFTSol</span>
              </div>
              <p className="text-zinc-500 text-sm">
                Lightning-fast NFT marketplace on Solana. Create, discover, and trade digital assets
                with unprecedented speed.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => handleTabChange('market')} className="text-zinc-500 hover:text-gold transition-colors">
                    Marketplace
                  </button>
                </li>
                <li>
                  <button onClick={() => handleTabChange('mint')} className="text-zinc-500 hover:text-gold transition-colors">
                    Mint NFT
                  </button>
                </li>
                <li>
                  <button onClick={() => handleTabChange('collections')} className="text-zinc-500 hover:text-gold transition-colors">
                    Collections
                  </button>
                </li>
                <li>
                  <button onClick={() => handleTabChange('my-nfts')} className="text-zinc-500 hover:text-gold transition-colors">
                    My NFTs
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-zinc-500 hover:text-gold transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-zinc-500 hover:text-gold transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-zinc-500 hover:text-gold transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="text-zinc-500 hover:text-gold transition-colors">
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
                  <span className="text-sm text-zinc-500">Live on {solanaCluster}</span>
                </div>
                <div className="flex space-x-3">
                  <a href="#" className="text-zinc-500 hover:text-gold transition-colors">
                    Twitter
                  </a>
                  <a href="#" className="text-zinc-500 hover:text-gold transition-colors">
                    Discord
                  </a>
                  <a href="#" className="text-zinc-500 hover:text-gold transition-colors">
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1e1e1e] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-zinc-500 text-sm">2026 NFTSol. Built on Solana</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-xs text-zinc-500">Powered by</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gold rounded"></div>
                <span className="text-sm font-semibold text-gold">Solana</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* CloutBadge - Fixed position showing user's CLOUT balance */}
      <CloutBadge />

      {/* ContractInfo - Shows CLOUT contract addresses (hidden on mobile to avoid blocking) */}
      <div className="hidden sm:block fixed left-4 bottom-4 z-40 max-w-xs">
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
  // Get RPC URL and wallet adapters from config. Memoize the adapter array so
  // WalletProvider sees a stable reference across renders.
  const endpoint = useMemo(() => getRpcUrl(), []);
  const wallets = useMemo(() => getWalletAdapters(), []);

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
