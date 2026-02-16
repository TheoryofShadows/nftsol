import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
// Connection and PublicKey not needed - using wallet adapter
// import { Connection, PublicKey } from '@solana/web3.js';
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
      // Note: This setState in effect is intentional for loading state
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-lg max-w-2xl w-full p-12 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-[#c9a84c]/15 rounded-lg flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-display">Connect Your Wallet</h2>
            <p className="text-zinc-400 text-sm">
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
            <h1 className="text-3xl font-bold text-white mb-1 font-display">Dashboard</h1>
            <p className="text-zinc-400 text-sm">Welcome back! Here&apos;s your portfolio overview</p>
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
