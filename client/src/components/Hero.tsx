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
        {/* Animated gradient orbs */}
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl float-animation"></div>
        <div 
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl float-animation"
          style={{ animationDelay: '2s' }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl float-animation"
          style={{ animationDelay: '4s' }}
        ></div>

        {/* Floating particles removed - too distracting */}
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
            Next-generation NFTs with eternal on-chain memory.
          </span>
        </p>

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
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                Connected:{' '}
                <span className="text-cyan-300 font-mono text-lg">
                  {publicKey
                    ? `${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-6)}`
                    : 'Unknown'}
                </span>
              </p>
            </div>
          )}
        </div>

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
            </div>
          )}
        </div>

        {/* Quick Action Buttons - Modern Design */}
        <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
            className="btn-modern"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              Browse Marketplace
            </span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'mint' }))}
            className="btn-modern"
            style={{ 
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)'
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Mint NFT
            </span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'echo-mint' }))}
            className="btn-modern"
            style={{ 
              background: 'linear-gradient(135deg, #ec4899, #f97316)',
              boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)'
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-2xl">🎬</span>
              Create Echo
            </span>
          </button>
        </div>

        {/* Scroll indicator - Modern */}
        <div className="mt-20 animate-bounce opacity-60">
          <div className="text-gray-400 text-xs uppercase tracking-widest mb-3 font-semibold">Explore More</div>
          <div className="w-6 h-10 border-2 border-gray-500/50 rounded-full mx-auto flex items-start justify-center p-2 backdrop-blur-sm">
            <div className="w-1 h-3 bg-gradient-to-b from-purple-400 to-cyan-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
