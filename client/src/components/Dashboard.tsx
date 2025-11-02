import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useApp } from '../context/AppContext';
import ModernWalletConnect from './ModernWalletConnect';
import DashboardStats from './DashboardStats';
import PortfolioOverview from './PortfolioOverview';
import ActivityFeed from './ActivityFeed';
import QuickActions from './QuickActions';

export default function Dashboard() {
  const { connected, publicKey } = useWallet();
  const connectionContext = useConnection();
  const connection = connectionContext?.connection;
  const { nfts, loading } = useApp();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    if (connected && publicKey && connection && 'getBalance' in connection) {
      setIsLoadingBalance(true);
      connection
        .getBalance(publicKey)
        .then((balance) => setSolBalance(balance / 1e9))
        .catch((err) => {
          if (import.meta.env.DEV) {
            console.error('Failed to fetch balance:', err);
          }
        })
        .finally(() => setIsLoadingBalance(false));
    }
  }, [connected, publicKey, connection]);

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card max-w-2xl w-full p-12 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg">
              👛
            </div>
            <h2 className="text-3xl font-bold gradient-text-primary mb-2">Connect Your Wallet</h2>
            <p className="text-gray-300 text-lg">
              Connect your Solana wallet to access your dashboard and manage your NFTs
            </p>
          </div>
          <ModernWalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="dashboard-section">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold gradient-text-primary mb-2">Dashboard</h1>
            <p className="text-gray-300">Welcome back! Here&apos;s your portfolio overview</p>
          </div>
          <ModernWalletConnect />
        </div>
      </div>

      {/* Stats Grid */}
      <div data-tour="stats-grid">
        <DashboardStats
          solBalance={solBalance}
          nftCount={nfts.length}
          isLoadingBalance={isLoadingBalance}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 dashboard-section">
        {/* Portfolio - Takes 2 columns on large screens */}
        <div className="lg:col-span-2" data-tour="portfolio">
          <PortfolioOverview nfts={nfts} loading={loading} />
        </div>

        {/* Sidebar - Quick Actions & Activity */}
        <div className="space-y-6">
          <div data-tour="quick-actions">
            <QuickActions />
          </div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
