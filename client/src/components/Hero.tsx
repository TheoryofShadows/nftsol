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
          Mint NFTs from 700M+ Openly-Licensed Works
        </h1>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-400 mb-3 md:mb-5 max-w-3xl mx-auto animate-fade-in animate-delay-100 px-2 md:px-4">
          Search the open web — Openverse + Internet Archive — verified by Grok AI
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
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'discover' }))}
            className="group bg-[#111111] border border-[#1e1e1e] p-5 md:p-6 rounded-xl hover:border-[#c9a84c]/30 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center mb-3 group-hover:bg-[#c9a84c]/20 transition-colors">
              <svg className="w-4 h-4 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h3 className="text-sm md:text-base font-semibold text-white mb-1.5 group-hover:text-[#c9a84c] transition-colors">Search &amp; Discover</h3>
            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">700M+ openly-licensed works from Openverse &amp; Internet Archive</p>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'discover' }))}
            className="group bg-[#111111] border border-[#1e1e1e] p-5 md:p-6 rounded-xl hover:border-purple-500/30 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-sm md:text-base font-semibold text-white mb-1.5 group-hover:text-purple-400 transition-colors">AI Verification</h3>
            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">Grok-powered authenticity scoring embedded on-chain</p>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'mint' }))}
            className="group bg-[#111111] border border-[#1e1e1e] p-5 md:p-6 rounded-xl hover:border-green-500/30 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-sm md:text-base font-semibold text-white mb-1.5 group-hover:text-green-400 transition-colors">Mint for ~$0.0001</h3>
            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">Compressed NFTs on Solana — 500,000x cheaper than Ethereum</p>
          </button>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 animate-fade-in animate-delay-400 px-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'discover' }))}
            className="px-6 md:px-8 py-3 md:py-3.5 bg-[#c9a84c] text-black font-semibold rounded-xl hover:bg-[#b8973f] transition-colors text-sm md:text-base"
          >
            Start Discovering
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
            className="px-6 md:px-8 py-3 md:py-3.5 border border-[#2a2a2a] text-zinc-300 font-medium rounded-xl hover:border-[#c9a84c]/30 hover:text-white transition-all text-sm md:text-base"
          >
            Browse Marketplace
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
