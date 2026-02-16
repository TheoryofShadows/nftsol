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
        const platformRes = await fetch(`${API_BASE}/api/public/stats`);
          if (platformRes.ok) {
            const platformData = await platformRes.json();
            if (!cancelled && platformData.platform) {
              setPlatformStats(platformData.platform);
            }
          }

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
      }, 300000);
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
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050505]">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(201,168,76,0.04)_0%,transparent_70%)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-8 md:py-0">
        {/* Badge */}
        <div className="mb-6 md:mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-full text-xs md:text-sm font-medium text-[#c9a84c]">
            Powered by Solana &amp; Helius
          </div>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 animate-fade-in leading-tight md:leading-none px-2 md:px-4 font-display tracking-tight">
          Mint NFTs from 20M+ Public Domain Items
        </h1>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-400 mb-3 md:mb-5 max-w-3xl mx-auto animate-fade-in animate-delay-100 px-2 md:px-4">
          Powered by Internet Archive + Grok AI + Eternal Echoes
        </p>

        <p className="text-xs sm:text-sm md:text-base text-zinc-500 mb-8 md:mb-14 max-w-3xl mx-auto animate-fade-in animate-delay-100 px-2 md:px-4">
          Discover, verify, and create collaborative NFTs on Solana. Lightning-fast. Community-driven.
        </p>

        {/* Wallet Connect */}
        <div className="mb-10 md:mb-16 animate-fade-in animate-delay-200 px-2 md:px-4">
          {!connected ? (
            <div className="relative inline-block">
              <WalletMultiButton className="relative !bg-[#c9a84c] hover:!bg-[#b8973f] !text-black !font-semibold !text-sm md:!text-base !px-6 md:!px-10 !py-3 md:!py-4 !rounded-lg !shadow-lg !transition-all !duration-200 !min-w-[160px] md:!min-w-[200px] !border-none" />
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 px-5 md:px-8 py-3 md:py-4 bg-[#111111] border border-[#1e1e1e] rounded-lg">
              <p className="text-white font-medium flex items-center gap-2 md:gap-3 text-xs md:text-base">
                <span className="w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-400 rounded-full"></span>
                <span className="hidden md:inline text-zinc-400">Connected:</span>
                <span className="text-[#c9a84c] font-mono text-xs md:text-sm">
                  {publicKey
                    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
                    : 'Unknown'}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-10 md:mb-14 animate-fade-in animate-delay-300 px-4 max-w-3xl mx-auto">
          <div className="border-l-2 border-[#c9a84c]/30 pl-4 text-left">
            <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">NFTs</div>
            <div className="text-2xl md:text-3xl font-bold text-white">
              {loading ? <div className="skeleton h-7 w-16"></div> : nftCount.toLocaleString()}
            </div>
          </div>

          <div className="border-l-2 border-[#c9a84c]/30 pl-4 text-left">
            <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">Echoes</div>
            <div className="text-2xl md:text-3xl font-bold text-white">
              {loading ? <div className="skeleton h-7 w-16"></div> : echoLayers.toLocaleString()}
            </div>
          </div>

          <div className="border-l-2 border-[#c9a84c]/30 pl-4 text-left">
            <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">Trending</div>
            <div className="text-2xl md:text-3xl font-bold text-white">
              {loading ? <div className="skeleton h-7 w-16"></div> : trendingToday.toLocaleString()}
            </div>
          </div>

          {connected && (
            <div className="border-l-2 border-[#c9a84c]/30 pl-4 text-left">
              <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">CLOUT</div>
              <div className="text-2xl md:text-3xl font-bold text-[#c9a84c]">
                {cloutBalance > 0 ? cloutBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '\u2014'}
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-10 md:mb-14 animate-fade-in animate-delay-400 px-4 max-w-4xl mx-auto">
          <div className="bg-[#111111] border border-[#1e1e1e] p-5 md:p-6 rounded-lg hover:border-[#c9a84c]/20 transition-colors">
            <h3 className="text-sm md:text-base font-semibold text-white mb-1.5">Archive Search</h3>
            <p className="text-xs md:text-sm text-zinc-500">Access 20M+ public domain items with 15+ advanced filters</p>
          </div>
          <div className="bg-[#111111] border border-[#1e1e1e] p-5 md:p-6 rounded-lg hover:border-[#c9a84c]/20 transition-colors">
            <h3 className="text-sm md:text-base font-semibold text-white mb-1.5">Grok Verification</h3>
            <p className="text-xs md:text-sm text-zinc-500">AI-powered authenticity verification for every NFT</p>
          </div>
          <div className="bg-[#111111] border border-[#1e1e1e] p-5 md:p-6 rounded-lg hover:border-[#c9a84c]/20 transition-colors">
            <h3 className="text-sm md:text-base font-semibold text-white mb-1.5">Eternal Echoes</h3>
            <p className="text-xs md:text-sm text-zinc-500">Collaborative NFT layers with contributor rewards</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 animate-fade-in animate-delay-400 px-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'archive' }))}
            className="px-5 md:px-7 py-2.5 md:py-3 bg-[#c9a84c] text-black font-semibold rounded-lg hover:bg-[#b8973f] transition-colors text-sm md:text-base"
          >
            Search Archive
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'mint' }))}
            className="px-5 md:px-7 py-2.5 md:py-3 bg-[#c9a84c] text-black font-semibold rounded-lg hover:bg-[#b8973f] transition-colors text-sm md:text-base"
          >
            Mint NFT
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
            className="px-5 md:px-7 py-2.5 md:py-3 border border-[#c9a84c]/25 text-[#c9a84c] font-semibold rounded-lg hover:bg-[#c9a84c]/10 transition-colors text-sm md:text-base"
          >
            Browse Market
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="hidden md:block mt-16 opacity-40">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-3 font-medium">Explore More</div>
          <div className="w-5 h-8 border border-zinc-600 rounded-full mx-auto flex items-start justify-center pt-1.5">
            <div className="w-0.5 h-2 bg-[#c9a84c]/60 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
