import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useCloutBalance } from '../hooks/useCloutBalance';
import { useMintCost } from '../hooks/useMintCost';

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
  const { estimate: mintCost, comparison: mintComparison } = useMintCost();
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
      } catch (_e) {
        // Silently fail - stats are nice-to-have
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const nftCount = platformStats.totalNFTs || 0;
  const echoLayers = echoStats.totalLayers || 0;
  const trendingToday = echoStats.trendingCount || 0;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden gradient-mesh">
      {/* Modern gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
<<<<<<< HEAD
        {/* Animated gradient orbs - Responsive sizes */}
        <div className="absolute -top-1/4 -right-1/4 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl float-animation"></div>
        <div 
          className="absolute -bottom-1/4 -left-1/4 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl float-animation delay-2s"
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl float-animation delay-4s"
=======
        {/* Animated gradient orbs */}
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl float-animation"></div>
        <div 
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl float-animation"
          style={{ animationDelay: '2s' }}
>>>>>>> origin/develop
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl float-animation"
          style={{ animationDelay: '4s' }}
        ></div>

<<<<<<< HEAD
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
          NFTSol + Eternal Echoes
        </h1>

        <p className="text-body text-sm sm:text-base md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-12 max-w-3xl mx-auto animate-fade-in px-2 md:px-4" style={{ animationDelay: '0.1s' }}>
          Create, collect, and immortalize moments on Solana.
          <span className="block mt-2 text-xs sm:text-sm md:text-lg text-gray-400">
=======
        {/* Floating particles with modern styling */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${8 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Badge */}
        <div className="mb-8 animate-fade-in">
          <div className="badge-modern inline-flex">
            <span className="text-2xl">⚡</span>
            <span>Powered by Solana & Helius</span>
          </div>
        </div>

        {/* Hero Title - Modern Typography */}
        <h1 className="text-display gradient-text-modern mb-6 animate-fade-in leading-none">
          NFTSol + Eternal Echoes
        </h1>

        <p className="text-body text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Create, collect, and immortalize moments on Solana.
          <span className="block mt-2 text-lg text-gray-400">
>>>>>>> origin/develop
            Next-generation NFTs with eternal on-chain memory.
          </span>
        </p>

<<<<<<< HEAD
        {/* Wallet Connect Button - Modern Design - Mobile Responsive */}
        <div className="mb-6 md:mb-16 animate-fade-in px-2 md:px-4" style={{ animationDelay: '0.2s' }}>
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
=======
        {/* Wallet Connect Button - Modern Design */}
        <div className="mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {!connected ? (
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <WalletMultiButton className="relative !bg-gradient-to-r !from-purple-600 !via-pink-600 !to-cyan-600 !text-white !font-bold !text-lg !px-10 !py-5 !rounded-2xl !shadow-2xl hover:!scale-105 !transition-all !duration-300" />
            </div>
          ) : (
            <div className="glass-modern inline-block px-8 py-4">
              <p className="text-white font-semibold flex items-center gap-3">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                Connected:{' '}
                <span className="text-cyan-300 font-mono text-lg">
>>>>>>> origin/develop
                  {publicKey
                    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
                    : 'Unknown'}
                </span>
              </p>
            </div>
          )}
        </div>

<<<<<<< HEAD
        {/* Live Counters - Modern Card Design - Mobile Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 lg:gap-6 mb-8 md:mb-12 animate-fade-in px-4" style={{ animationDelay: '0.3s' }}>
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
=======
        {/* Live Counters - Modern Card Design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="card-modern text-center p-6 glow-border">
            <div className="text-5xl mb-2">🖼️</div>
            <div className="text-4xl font-bold gradient-text-modern mb-2">
              {loading ? <div className="skeleton h-10 w-20 mx-auto"></div> : nftCount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 font-semibold uppercase tracking-wider">NFTs Minted</div>
          </div>

          <div className="card-modern text-center p-6 glow-border">
            <div className="text-5xl mb-2">🌌</div>
            <div className="text-4xl font-bold gradient-text-modern mb-2">
              {loading ? <div className="skeleton h-10 w-20 mx-auto"></div> : echoLayers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Echo Layers</div>
          </div>

          <div className="card-modern text-center p-6 glow-border">
            <div className="text-5xl mb-2">🔥</div>
            <div className="text-4xl font-bold gradient-text-modern mb-2">
              {loading ? <div className="skeleton h-10 w-20 mx-auto"></div> : trendingToday.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Trending</div>
          </div>

          {connected && (
            <div className="card-modern text-center p-6 glow-border">
              <div className="text-5xl mb-2">⭐</div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {cloutBalance > 0 ? cloutBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
              </div>
              <div className="text-sm text-gray-400 font-semibold uppercase tracking-wider">CLOUT</div>
>>>>>>> origin/develop
            </div>
          )}
        </div>

<<<<<<< HEAD
        {/* Quick Action Buttons - Modern Design - Mobile Responsive */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
            className="btn-modern text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
          >
            <span className="relative z-10 flex items-center gap-1 md:gap-2">
              <span className="text-lg md:text-2xl">🏪</span>
              <span className="hidden sm:inline">Browse</span>
              <span className="sm:hidden">Market</span>
=======
        {/* Quick Action Buttons - Modern Design */}
        <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
            className="btn-modern"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              Browse Marketplace
>>>>>>> origin/develop
            </span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'mint' }))}
<<<<<<< HEAD
            className="btn-modern text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
=======
            className="btn-modern"
>>>>>>> origin/develop
            style={{ 
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)'
            }}
          >
<<<<<<< HEAD
            <span className="relative z-10 flex items-center gap-1 md:gap-2">
              <span className="text-lg md:text-2xl">✨</span>
=======
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-2xl">✨</span>
>>>>>>> origin/develop
              Mint NFT
            </span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'echo-mint' }))}
<<<<<<< HEAD
            className="btn-modern text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
=======
            className="btn-modern"
>>>>>>> origin/develop
            style={{ 
              background: 'linear-gradient(135deg, #ec4899, #f97316)',
              boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)'
            }}
          >
<<<<<<< HEAD
            <span className="relative z-10 flex items-center gap-1 md:gap-2">
              <span className="text-lg md:text-2xl">🎬</span>
              <span className="hidden sm:inline">Create Echo</span>
              <span className="sm:hidden">Echo</span>
=======
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-2xl">🎬</span>
              Create Echo
>>>>>>> origin/develop
            </span>
          </button>
        </div>

<<<<<<< HEAD
        {/* Scroll indicator - Modern - Hidden on mobile */}
        <div className="hidden md:block mt-8 md:mt-20 animate-bounce opacity-60">
          <div className="text-gray-400 text-xs uppercase tracking-widest mb-3 font-semibold">Explore More</div>
          <div className="w-6 h-10 border-2 border-gray-500/50 rounded-full mx-auto flex items-start justify-center p-2 backdrop-blur-sm">
            <div className="w-1 h-3 bg-gradient-to-b from-purple-400 to-cyan-400 rounded-full"></div>
=======
        {/* Scroll indicator - Modern */}
        <div className="mt-20 animate-bounce opacity-60">
          <div className="text-gray-400 text-xs uppercase tracking-widest mb-3 font-semibold">Explore More</div>
          <div className="w-6 h-10 border-2 border-gray-500/50 rounded-full mx-auto flex items-start justify-center p-2 backdrop-blur-sm">
            <div className="w-1 h-3 bg-gradient-to-b from-purple-400 to-cyan-400 rounded-full animate-pulse"></div>
>>>>>>> origin/develop
          </div>
        </div>
      </div>
    </div>
  );
}
