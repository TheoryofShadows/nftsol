/**
 * PnL Leaderboard Component
 * Daily/Weekly/Monthly portfolio profit & loss rankings
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { API_BASE } from '../config/api';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName?: string;
  pnl: number;
  pnlPercent: number;
  currentValue: number;
  nftCount: number;
  streak?: number;
  lastUpdated: number;
}

interface UserPnL {
  wallet: string;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  pnlPercent24h: number;
  pnlPercent7d: number;
  pnlPercent30d: number;
  currentValue: number;
  nftCount: number;
  rank: number;
}

interface PnLLeaderboardProps {
  limit?: number;
  showUserCard?: boolean;
  compact?: boolean;
  onWalletClick?: (wallet: string) => void;
}

export const PnLLeaderboard: React.FC<PnLLeaderboardProps> = ({
  limit = 20,
  showUserCard = true,
  compact = false,
  onWalletClick,
}) => {
  const { publicKey, connected } = useWallet();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPnL, setUserPnL] = useState<UserPnL | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/pnl/leaderboard?period=${period}&limit=${limit}`);
      const data = await response.json();

      if (data.success && data.data?.entries) {
        setLeaderboard(data.data.entries);
      } else {
        setError(data.error || 'Failed to fetch leaderboard');
      }
    } catch {
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  }, [period, limit]);

  const fetchUserPnL = useCallback(async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`${API_BASE}/api/pnl/wallet/${publicKey.toBase58()}`);
      const data = await response.json();

      if (data.success && data.data) {
        setUserPnL(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch user PnL:', err);
    }
  }, [publicKey]);

  const startTracking = async () => {
    if (!publicKey) return;
    setTracking(true);

    try {
      const response = await fetch(`${API_BASE}/api/pnl/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchUserPnL();
        await fetchLeaderboard();
      }
    } catch (err) {
      console.error('Failed to start tracking:', err);
    } finally {
      setTracking(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserPnL();
    }
  }, [connected, publicKey, fetchUserPnL]);

  const formatSOL = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(2);
  };

  const formatPercent = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-yellow-400 text-lg">1</span>;
    if (rank === 2) return <span className="text-gray-300 text-lg">2</span>;
    if (rank === 3) return <span className="text-amber-600 text-lg">3</span>;
    return <span className="text-gray-400">{rank}</span>;
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-400';
    if (pnl < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-green-500/10 via-purple-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="font-semibold text-white">PnL Leaderboard</span>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded capitalize transition-colors ${
                  period === p
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Card */}
      {showUserCard && connected && publicKey && (
        <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
          {userPnL ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  #{userPnL.rank || '?'}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Your Portfolio</div>
                  <div className="text-xs text-gray-400">{shortenAddress(publicKey.toBase58())}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getPnLColor(userPnL.pnl24h)}`}>
                  {userPnL.pnl24h >= 0 ? '+' : ''}{formatSOL(userPnL.pnl24h)} SOL
                </div>
                <div className={`text-xs ${getPnLColor(userPnL.pnlPercent24h)}`}>
                  {formatPercent(userPnL.pnlPercent24h)} today
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Track Your Portfolio</div>
                <div className="text-xs text-gray-400">Join the leaderboard and compete</div>
              </div>
              <button
                onClick={startTracking}
                disabled={tracking}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {tracking ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Tracking...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Start Tracking
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard List */}
      <div className={`${compact ? 'max-h-[300px]' : 'max-h-[500px]'} overflow-y-auto`}>
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 py-2">
                <div className="w-8 h-8 bg-gray-700/50 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-700/50 rounded"></div>
                <div className="w-20 h-4 bg-gray-700/50 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">No leaderboard data yet</p>
            <p className="text-xs mt-1">Be the first to track your portfolio!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {leaderboard.map((entry) => (
              <div
                key={entry.wallet}
                onClick={() => onWalletClick?.(entry.wallet)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30 transition-colors ${
                  onWalletClick ? 'cursor-pointer' : ''
                } ${
                  publicKey && entry.wallet === publicKey.toBase58()
                    ? 'bg-purple-500/10 border-l-2 border-purple-500'
                    : ''
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center font-bold">
                  {getRankIcon(entry.rank)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">
                      {entry.displayName || shortenAddress(entry.wallet)}
                    </span>
                    {entry.streak && entry.streak >= 3 && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
                        {entry.streak} streak
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.nftCount} NFTs | {formatSOL(entry.currentValue)} SOL
                  </div>
                </div>

                {/* PnL */}
                <div className="text-right">
                  <div className={`font-bold ${getPnLColor(entry.pnl)}`}>
                    {entry.pnl >= 0 ? '+' : ''}{formatSOL(entry.pnl)} SOL
                  </div>
                  <div className={`text-xs ${getPnLColor(entry.pnlPercent)}`}>
                    {formatPercent(entry.pnlPercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/20 flex items-center justify-between text-xs text-gray-500">
        <span>Updated every 5 minutes</span>
        <button
          onClick={fetchLeaderboard}
          className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default PnLLeaderboard;
