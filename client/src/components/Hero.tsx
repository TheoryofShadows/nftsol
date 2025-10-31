import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useCloutBalance } from '../hooks/useCloutBalance';

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
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto animate-fade-in">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold gradient-text font-display mb-6 drop-shadow-2xl">
          NFTSol + Eternal Echoes
        </h1>

        <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
          NFTSol: Mint NFTs, Capture Eternal Echoes, Verify History on Solana.
        </p>

        {/* Wallet Connect Button */}
        <div className="mb-16 animate-slide-up">
          {!connected ? (
            <div className="relative inline-block">
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-cyan-500 !text-white !font-bold !text-lg !px-8 !py-4 !rounded-xl !shadow-2xl !shadow-purple-500/25 hover:!scale-105 !transition-all !duration-300 hover:!shadow-purple-500/50 animate-pulse" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 opacity-20 blur-xl animate-pulse"></div>
            </div>
          ) : (
            <div className="glass px-6 py-4 rounded-xl backdrop-blur-md">
              <p className="text-white font-semibold">
                Connected:{' '}
                <span className="text-cyan-300 font-mono">
                  {publicKey
                    ? `${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-6)}`
                    : 'Unknown'}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Live Counters */}
        <div
          className="flex flex-wrap justify-center gap-8 md:gap-12 animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="glass px-6 py-4 rounded-xl backdrop-blur-md transform transition-all duration-300 hover:scale-110 hover:shadow-xl">
            <div className="text-4xl md:text-5xl font-bold gradient-text font-display mb-2 animate-counter-up">
              {loading ? '...' : nftCount.toLocaleString()}
            </div>
            <div className="text-sm md:text-base text-gray-300 font-semibold">🖼️ NFTs Minted</div>
          </div>

          <div className="glass px-6 py-4 rounded-xl backdrop-blur-md transform transition-all duration-300 hover:scale-110 hover:shadow-xl">
            <div
              className="text-4xl md:text-5xl font-bold gradient-text font-display mb-2 animate-counter-up"
              style={{ animationDelay: '0.1s' }}
            >
              {loading ? '...' : echoLayers.toLocaleString()}
            </div>
            <div className="text-sm md:text-base text-gray-300 font-semibold">🌌 Echo Layers</div>
          </div>

          <div className="glass px-6 py-4 rounded-xl backdrop-blur-md transform transition-all duration-300 hover:scale-110 hover:shadow-xl">
            <div
              className="text-4xl md:text-5xl font-bold gradient-text font-display mb-2 animate-counter-up"
              style={{ animationDelay: '0.2s' }}
            >
              {loading ? '...' : trendingToday.toLocaleString()}
            </div>
            <div className="text-sm md:text-base text-gray-300 font-semibold">
              🔥 Trending Today
            </div>
          </div>

          {connected && (
            <div className="glass px-6 py-4 rounded-xl backdrop-blur-md text-center transform transition-all duration-300 hover:scale-110 hover:shadow-xl">
              <div
                className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2 animate-counter-up"
                style={{ animationDelay: '0.3s' }}
              >
                {cloutBalance > 0
                  ? cloutBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : '—'}
              </div>
              <div className="text-sm md:text-base text-gray-300 font-semibold">⭐ CLOUT</div>
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 animate-bounce">
          <div className="text-gray-400 text-sm mb-2">Scroll to explore</div>
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full mx-auto flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-gray-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
