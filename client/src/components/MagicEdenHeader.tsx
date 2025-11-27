/**
 * Magic Eden-style Header
 * Professional navigation matching industry standards
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { solanaRpcProxy } from '@/services/solanaRpcProxy';

interface MagicEdenHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MagicEdenHeader: React.FC<MagicEdenHeaderProps> = ({ activeTab, onTabChange }) => {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch wallet balance using backend RPC proxy
  useEffect(() => {
    if (connected && publicKey) {
      setIsLoadingBalance(true);
      solanaRpcProxy
        .getBalanceInSol(publicKey.toBase58())
        .then((solBalance) => {
          setBalance(solBalance);
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error('Failed to fetch wallet balance:', error);
          }
        })
        .finally(() => setIsLoadingBalance(false));
    }
  }, [connected, publicKey]);

  const primaryNavItems = [
    { id: 'market', label: 'Marketplace', icon: '🏪' },
    { id: 'mint', label: 'Mint', icon: '✨' },
    { id: 'my-nfts', label: 'Portfolio', icon: '👤' },
    { id: 'collections', label: 'Collections', icon: '📚' },
  ];

  const advancedNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'echo-marketplace', label: 'Echo Market', icon: '🎭' },
    { id: 'echo-mint', label: 'Mint Echo', icon: '🎬' },
    { id: 'echo-viewer', label: 'Echo Viewer', icon: '👁️' },
    { id: 'archive', label: 'Archive Search', icon: '📚' },
    { id: 'clout', label: 'CLOUT Token', icon: '⭐' },
    { id: 'referrals', label: 'Referrals', icon: '🎯' },
    { id: 'withdraw', label: 'Withdraw', icon: '💰' },
    { id: 'admin', label: 'Admin', icon: '🔧' },
  ];

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        {/* Main header flex container */}
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            onClick={() => handleNavClick('home')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-lg shadow-lg shadow-purple-500/30"></div>
            <span className="text-xl font-bold text-white hidden sm:inline">NFTSol</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {primaryNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === item.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Advanced Features Dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2 rounded-lg font-medium text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
              >
                More
                <svg
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-2 z-50">
                  {advancedNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleNavClick(item.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3"
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right side: Search + Wallet */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Search (hidden on mobile) */}
            <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 hover:border-white/20 transition-colors">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search collections..."
                className="ml-2 bg-transparent text-sm text-white placeholder-gray-500 outline-none w-32"
              />
            </div>

            {/* Wallet Connection */}
            {connected && publicKey ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-all"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="hidden sm:inline">{publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}</span>
                  <span className="sm:hidden">{publicKey.toBase58().slice(0, 4)}...</span>
                </button>

                {/* Wallet Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="text-xs text-gray-500 mb-2">Connected Wallet</div>
                      <div className="font-mono text-xs text-gray-300 break-all mb-2">{publicKey.toBase58()}</div>
                      {isLoadingBalance ? (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                          Loading balance...
                        </div>
                      ) : balance !== null ? (
                        <div className="text-sm font-semibold text-white">
                          ◎ {balance.toFixed(4)} SOL
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">Balance unavailable</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        setIsDropdownOpen(false);
                        setBalance(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setVisible(true)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2"
              >
                <span>Connect</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="grid grid-cols-2 gap-2">
              {[...primaryNavItems, ...advancedNavItems].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default MagicEdenHeader;
