import React, { useState, useEffect, Suspense, lazy } from "react";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './components/NotificationSystem';
import { usePerformance } from './hooks/usePerformance';
import { useApp } from './context/AppContext';
import { useNotification } from './components/NotificationSystem';
import './styles/solana.css';

// Lazy load components for better performance
const PhantomConnect = lazy(() => import('./components/PhantomConnect'));
const MintForm = lazy(() => import('./components/MintForm'));
const NftGrid = lazy(() => import('./components/NftGrid'));
const WithdrawalForm = lazy(() => import('./components/WithdrawalForm'));

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
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-lg mb-4">We're sorry, but something unexpected happened.</p>
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
  const [activeTab, setActiveTab] = useState("market");
  const { nfts, loading, error, loadMarketplace, clearError } = useApp();
  const { addNotification } = useNotification();
  const { metrics, getPerformanceReport } = usePerformance();

  // Load NFTs on mount
  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  // Performance monitoring
  useEffect(() => {
    const report = getPerformanceReport();
    console.log('Performance Report:', report);
  }, [getPerformanceReport]);

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <header className="p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-white">NFTSol</h1>
            <div className="text-sm text-white/70">
              Performance: {metrics.loadTime.toFixed(0)}ms
            </div>
          </div>
          <Suspense fallback={<div className="text-white">Loading wallet...</div>}>
            <PhantomConnect />
          </Suspense>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="flex space-x-4 mb-8">
          {[
            { id: "market", label: "🏪 Marketplace", icon: "🏪" },
            { id: "mint", label: "✨ Mint NFT", icon: "✨" },
            { id: "withdraw", label: "💰 Withdraw SOL", icon: "💰" },
            { id: "my-nfts", label: "👤 My NFTs", icon: "👤" },
            { id: "collections", label: "📚 Collections", icon: "📚" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20 hover:shadow-md"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {activeTab === "market" && (
            <div>
              <h2 className="text-white text-2xl font-bold mb-6">
                🏪 NFT Marketplace
              </h2>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <Suspense fallback={<LoadingSpinner />}>
                  <NftGrid nfts={nfts} />
                </Suspense>
              )}
            </div>
          )}

          {activeTab === "mint" && (
            <div>
              <h2 className="text-white text-2xl font-bold mb-6">
                ✨ Mint New NFT
              </h2>
              <Suspense fallback={<LoadingSpinner />}>
                <MintForm />
              </Suspense>
            </div>
          )}

          {activeTab === "withdraw" && (
            <div>
              <h2 className="text-white text-2xl font-bold mb-6">
                💰 Withdraw SOL
              </h2>
              <Suspense fallback={<LoadingSpinner />}>
                <WithdrawalForm />
              </Suspense>
            </div>
          )}

          {activeTab === "my-nfts" && (
            <div>
              <h2 className="text-white text-2xl font-bold mb-6">
                👤 My NFTs
              </h2>
              <Suspense fallback={<LoadingSpinner />}>
                <NftGrid nfts={nfts} />
              </Suspense>
            </div>
          )}

          {activeTab === "collections" && (
            <div>
              <h2 className="text-white text-2xl font-bold mb-6">
                📚 Collections
              </h2>
              <div className="text-white text-center py-8">
                Collections coming soon...
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  const endpoint = import.meta.env.VITE_SOLANA_CLUSTER === 'devnet'
    ? clusterApiUrl('devnet')
    : clusterApiUrl('mainnet-beta');

  const wallets = [new PhantomWalletAdapter()];

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