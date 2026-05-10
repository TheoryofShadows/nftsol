/**
 * Magic Eden-style Header
 * Premium luxury navigation with gold accent design
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
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const submitSearch = () => {
    const query = searchQuery.trim();
    window.dispatchEvent(
      new CustomEvent<string>('marketplace-search', { detail: query })
    );
    if (activeTab !== 'market') {
      onTabChange('market');
    }
  };

  // Fetch wallet balance using backend RPC proxy
  useEffect(() => {
    if (connected && publicKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    { id: 'discover', label: 'Discover & Mint' },
    { id: 'market', label: 'Marketplace' },
    { id: 'mint', label: 'Upload & Mint' },
    { id: 'my-nfts', label: 'My NFTs' },
  ];

  const advancedNavItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clout', label: 'CLOUT Token' },
    { id: 'collections', label: 'Collections' },
    { id: 'withdraw', label: 'Withdraw' },
    { id: 'admin', label: 'Admin' },
  ];

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setIsWalletDropdownOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('header')) {
        setIsDropdownOpen(false);
        setIsWalletDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-[#1e1e1e] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        {/* Main header flex container */}
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            onClick={() => handleNavClick('home')}
          >
            <div className="w-8 h-8 rounded-lg shadow-lg" style={{ background: 'linear-gradient(135deg, #c9a84c, #e8d48b, #c9a84c)', boxShadow: '0 4px 12px rgba(201, 168, 76, 0.3)' }}></div>
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
                    ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-b-2 border-[#c9a84c]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Advanced Features Dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2 rounded-lg font-medium text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
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
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#111111] border border-[#1e1e1e] rounded-lg shadow-xl py-2 z-50">
                  {advancedNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleNavClick(item.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-all ${
                        activeTab === item.id
                          ? 'text-[#c9a84c] bg-[#c9a84c]/10'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
              className="hidden sm:flex items-center bg-[#111111] border border-[#1e1e1e] rounded-lg px-3 py-2 focus-within:border-[#c9a84c]/50 transition-colors"
            >
              <button
                type="submit"
                aria-label="Search"
                className="flex items-center text-zinc-500 hover:text-[#c9a84c] transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collections..."
                className="ml-2 bg-transparent text-sm text-white placeholder-zinc-600 outline-none w-32"
              />
            </form>

            {/* Wallet Connection */}
            {connected && publicKey ? (
              <div className="relative">
                <button
                  onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#c9a84c] rounded-lg font-medium text-sm transition-all hover:bg-[#c9a84c]/15"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="hidden sm:inline">{publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}</span>
                  <span className="sm:hidden">{publicKey.toBase58().slice(0, 4)}...</span>
                </button>

                {/* Wallet Dropdown */}
                {isWalletDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-[#111111] border border-[#1e1e1e] rounded-lg shadow-xl py-2 z-50">
                    <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[#1e1e1e]">
                      <div className="text-xs text-zinc-500">Connected Wallet</div>
                      <button
                        onClick={() => setIsWalletDropdownOpen(false)}
                        aria-label="Close wallet menu"
                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white text-base leading-none transition-all"
                      >
                        ×
                      </button>
                    </div>
                    <div className="px-4 pb-3 border-b border-[#1e1e1e]">
                      <div className="font-mono text-xs text-zinc-400 break-all mb-2">{publicKey.toBase58()}</div>
                      {isLoadingBalance ? (
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-pulse"></div>
                          Loading balance...
                        </div>
                      ) : balance !== null ? (
                        <div className="text-sm font-semibold text-white">
                          {balance.toFixed(4)} SOL
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500">Balance unavailable</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        setIsWalletDropdownOpen(false);
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
                className="px-6 py-2 bg-[#c9a84c] hover:bg-[#b8973f] text-black rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
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
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-[#1e1e1e] pt-4">
            <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2">
                {[...primaryNavItems, ...advancedNavItems].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-b-2 border-[#c9a84c]'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default MagicEdenHeader;
