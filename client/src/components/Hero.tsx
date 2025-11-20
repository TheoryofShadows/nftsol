import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useCloutBalance } from '../hooks/useCloutBalance';
// import { useMintCost } from '../hooks/useMintCost'; // Unused for now

type PlatformStats = {
  totalNFTs?: number;
  listedNFTs?: number;
  soldNFTs?: number;
  totalVolume?: number;
};

type EchoStats = {
  totalLayers?: number;
  totalLedgers?: number;
  avgTruthScore?: number;
  trendingCount?: number;
};

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export default function Hero() {
  const { connected, publicKey } = useWallet();
  const { balance: cloutBalance } = useCloutBalance();
  // const { estimate: mintCost, comparison: mintComparison } = useMintCost(); // Unused for now
  const [platformStats, setPlatformStats] = useState<PlatformStats>({});
  const [echoStats, setEchoStats] = useState<EchoStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        // Fetch platform stats
        const platformRes = await fetch(`${API_BASE}/api/public/stats`);
          if (platformRes.ok) {
            const platformData = await platformRes.json();
            if (!cancelled && platformData.platform) {
              setPlatformStats(platformData.platform);
            }
          }

        // Fetch Echo stats
        const echoRes = await fetch(`${API_BASE}/api/echo/stats`);
          if (echoRes.ok) {
            const echoData = await echoRes.json();
            if (!cancelled && echoData.success) {
              setEchoStats(echoData);
            }
          }
      } catch {
        // Silently fail - stats are nice-to-have
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats();
    let interval: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        if (!document.hidden && !cancelled) {
          fetchStats();
        }
      }, 300000); // 5 minutes (optimized from 1 minute)
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      } else if (!cancelled) {
        fetchStats();
        startPolling();
      }
    };
    
    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const nftCount = platformStats.totalNFTs || 0;
  const echoLayers = echoStats.totalLayers || 0;
  const trendingToday = echoStats.trendingCount || 0;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden gradient-mesh">
      {/* Modern gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs - Responsive sizes */}
        <div className="absolute -top-1/4 -right-1/4 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl float-animation"></div>
        <div 
          className="absolute -bottom-1/4 -left-1/4 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl float-animation delay-2s"
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl float-animation delay-4s"
        ></div>

        {/* Floating particles removed - too distracting */}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto py-8 md:py-0">
        {/* Badge */}
        <div className="mb-4 md:mb-8 animate-fade-in">
          <div className="badge-modern inline-flex text-xs md:text-sm">
            <span className="text-lg md:text-2xl">⚡</span>
            <span className="hidden sm:inline">Powered by Solana & Helius</span>
            <span className="sm:hidden">Solana & Helius</span>
          </div>
        </div>

        {/* Hero Title - Modern Typography - Responsive */}
        <h1 className="text-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl gradient-text-modern mb-3 md:mb-6 animate-fade-in leading-tight md:leading-none px-2 md:px-4">
          Mint NFTs from 20M+ Public Domain Items
        </h1>

        <p className="text-body text-sm sm:text-base md:text-xl lg:text-2xl text-gray-300 mb-2 md:mb-4 max-w-3xl mx-auto animate-fade-in animate-delay-100 px-2 md:px-4">
          Powered by Internet Archive + Grok AI + Eternal Echoes
        </p>

        <p className="text-xs sm:text-sm md:text-lg text-gray-400 mb-6 md:mb-12 max-w-3xl mx-auto animate-fade-in animate-delay-100 px-2 md:px-4">
          Discover, verify, and create collaborative NFTs on Solana. Lightning-fast. Community-driven. Revolutionary.
        </p>

        {/* Wallet Connect Button - Modern Design - Mobile Responsive */}
        <div className="mb-6 md:mb-16 animate-fade-in animate-delay-200 px-2 md:px-4">
          {!connected ? (
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-xl md:rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <WalletMultiButton className="relative !bg-gradient-to-r !from-purple-600 !via-pink-600 !to-cyan-600 !text-white !font-bold !text-sm md:!text-lg !px-4 md:!px-10 !py-2.5 md:!py-5 !rounded-xl md:!rounded-2xl !shadow-2xl hover:!scale-105 !transition-all !duration-300 !min-w-[140px] md:!min-w-[200px]" />
            </div>
          ) : (
            <div className="glass-modern inline-block px-3 md:px-8 py-2 md:py-4">
              <p className="text-white font-semibold flex items-center gap-2 md:gap-3 text-xs md:text-base">
                <span className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full"></span>
                <span className="hidden md:inline">Connected:</span>
                <span className="text-cyan-300 font-mono text-xs md:text-lg">
                  {publicKey
                    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
                    : 'Unknown'}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Live Counters - Modern Card Design - Mobile Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 lg:gap-6 mb-8 md:mb-12 animate-fade-in animate-delay-300 px-4">
          <div className="card-modern text-center p-3 md:p-6 glow-border">
            <div className="text-2xl md:text-5xl mb-1 md:mb-2">🖼️</div>
            <div className="text-xl md:text-3xl lg:text-4xl font-bold gradient-text-modern mb-1 md:mb-2">
              {loading ? <div className="skeleton h-6 md:h-10 w-12 md:w-20 mx-auto"></div> : nftCount.toLocaleString()}
            </div>
            <div className="text-xs md:text-sm text-gray-400 font-semibold uppercase tracking-wider">NFTs</div>
          </div>

          <div className="card-modern text-center p-3 md:p-6 glow-border">
            <div className="text-2xl md:text-5xl mb-1 md:mb-2">🌌</div>
            <div className="text-xl md:text-3xl lg:text-4xl font-bold gradient-text-modern mb-1 md:mb-2">
              {loading ? <div className="skeleton h-6 md:h-10 w-12 md:w-20 mx-auto"></div> : echoLayers.toLocaleString()}
            </div>
            <div className="text-xs md:text-sm text-gray-400 font-semibold uppercase tracking-wider">Echoes</div>
          </div>

          <div className="card-modern text-center p-3 md:p-6 glow-border">
            <div className="text-2xl md:text-5xl mb-1 md:mb-2">🔥</div>
            <div className="text-xl md:text-3xl lg:text-4xl font-bold gradient-text-modern mb-1 md:mb-2">
              {loading ? <div className="skeleton h-6 md:h-10 w-12 md:w-20 mx-auto"></div> : trendingToday.toLocaleString()}
            </div>
            <div className="text-xs md:text-sm text-gray-400 font-semibold uppercase tracking-wider">Trending</div>
          </div>

          {connected && (
            <div className="card-modern text-center p-3 md:p-6 glow-border">
              <div className="text-2xl md:text-5xl mb-1 md:mb-2">⭐</div>
              <div className="text-xl md:text-3xl lg:text-4xl font-bold text-yellow-400 mb-1 md:mb-2">
                {cloutBalance > 0 ? cloutBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
              </div>
              <div className="text-xs md:text-sm text-gray-400 font-semibold uppercase tracking-wider">CLOUT</div>
            </div>
          )}
        </div>

        {/* Unique Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-12 animate-fade-in animate-delay-400 px-4 max-w-4xl mx-auto">
          <div className="glass-card p-4 md:p-6 rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all">
            <div className="text-3xl md:text-4xl mb-2">📚</div>
            <h3 className="text-sm md:text-base font-bold text-white mb-1">Archive Search</h3>
            <p className="text-xs md:text-sm text-gray-400">Access 20M+ public domain items with 15+ advanced filters</p>
          </div>
          <div className="glass-card p-4 md:p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition-all">
            <div className="text-3xl md:text-4xl mb-2">🤖</div>
            <h3 className="text-sm md:text-base font-bold text-white mb-1">Grok Verification</h3>
            <p className="text-xs md:text-sm text-gray-400">AI-powered authenticity verification for every NFT</p>
          </div>
          <div className="glass-card p-4 md:p-6 rounded-xl border border-pink-500/20 hover:border-pink-500/50 transition-all">
            <div className="text-3xl md:text-4xl mb-2">🎭</div>
            <h3 className="text-sm md:text-base font-bold text-white mb-1">Eternal Echoes</h3>
            <p className="text-xs md:text-sm text-gray-400">Collaborative NFT layers with contributor rewards</p>
          </div>
        </div>

        {/* Quick Action Buttons - Modern Design - Mobile Responsive */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 animate-fade-in animate-delay-400 px-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'archive' }))}
            className="btn-modern text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
          >
            <span className="relative z-10 flex items-center gap-1 md:gap-2">
              <span className="text-lg md:text-2xl">🔍</span>
              <span className="hidden sm:inline">Search Archive</span>
              <span className="sm:hidden">Archive</span>
            </span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'mint' }))}
            className="btn-modern btn-gradient-cyan text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
          >
            <span className="relative z-10 flex items-center gap-1 md:gap-2">
              <span className="text-lg md:text-2xl">✨</span>
              Mint NFT
            </span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
            className="btn-modern btn-gradient-pink text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
          >
            <span className="relative z-10 flex items-center gap-1 md:gap-2">
              <span className="text-lg md:text-2xl">🏪</span>
              <span className="hidden sm:inline">Browse Market</span>
              <span className="sm:hidden">Market</span>
            </span>
          </button>
        </div>

        {/* Scroll indicator - Modern - Hidden on mobile */}
        <div className="hidden md:block mt-8 md:mt-20 animate-bounce opacity-60">
          <div className="text-gray-400 text-xs uppercase tracking-widest mb-3 font-semibold">Explore More</div>
          <div className="w-6 h-10 border-2 border-gray-500/50 rounded-full mx-auto flex items-start justify-center p-2 backdrop-blur-sm">
            <div className="w-1 h-3 bg-gradient-to-b from-purple-400 to-cyan-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
