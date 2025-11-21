/**
 * Whale Tracker Component
 * Monitor and follow whale wallet activity
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { API_BASE } from '../config/api';

interface WhaleEntry {
  rank: number;
  address: string;
  displayName?: string;
  totalHoldings: number;
  nftCount: number;
  volume24h: number;
  topCollections: string[];
  lastActivity: number;
  isFollowed?: boolean;
}

interface WhaleActivity {
  whale: string;
  whaleName?: string;
  action: 'buy' | 'sell' | 'list' | 'delist' | 'bid';
  collection: string;
  nftName?: string;
  mint: string;
  price: number;
  timestamp: number;
  signature: string;
}

interface WhaleTrackerProps {
  limit?: number;
  showActivity?: boolean;
  compact?: boolean;
  onWhaleClick?: (address: string) => void;
}

export const WhaleTracker: React.FC<WhaleTrackerProps> = ({
  limit = 10,
  showActivity = true,
  compact = false,
  onWhaleClick,
}) => {
  const { publicKey, connected } = useWallet();
  const [whales, setWhales] = useState<WhaleEntry[]>([]);
  const [activity, setActivity] = useState<WhaleActivity[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'top' | 'activity' | 'following'>('top');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWhales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/whales/top?limit=${limit}`);
      const data = await response.json();

      if (data.success && data.data) {
        setWhales(data.data);
      } else {
        setError(data.error || 'Failed to fetch whale data');
      }
    } catch (err) {
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const fetchActivity = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/whales/activity?limit=20`);
      const data = await response.json();

      if (data.success && data.data) {
        setActivity(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    }
  }, []);

  const fetchFollowing = useCallback(async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`${API_BASE}/api/whales/following/${publicKey.toBase58()}`);
      const data = await response.json();

      if (data.success && data.data) {
        setFollowing(new Set(data.data.map((w: any) => w.address)));
      }
    } catch (err) {
      console.error('Failed to fetch following:', err);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchWhales();
    if (showActivity) {
      fetchActivity();
    }
  }, [fetchWhales, fetchActivity, showActivity]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchFollowing();
    }
  }, [connected, publicKey, fetchFollowing]);

  const handleFollow = async (whaleAddress: string) => {
    if (!publicKey) return;

    const isFollowing = following.has(whaleAddress);
    const endpoint = isFollowing ? 'unfollow' : 'follow';

    try {
      const response = await fetch(`${API_BASE}/api/whales/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          whaleAddress,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFollowing((prev) => {
          const next = new Set(prev);
          if (isFollowing) {
            next.delete(whaleAddress);
          } else {
            next.add(whaleAddress);
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to update follow:', err);
    }
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  const formatSOL = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(2);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy': return '🛒';
      case 'sell': return '💰';
      case 'list': return '📋';
      case 'delist': return '❌';
      case 'bid': return '🎯';
      default: return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'text-green-400';
      case 'sell': return 'text-red-400';
      case 'list': return 'text-blue-400';
      case 'delist': return 'text-gray-400';
      case 'bid': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐋</span>
            <span className="font-semibold text-white">Whale Tracker</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-gray-400">Live</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {!compact && (
        <div className="flex border-b border-gray-700/50">
          {(['top', 'activity', 'following'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-purple-500 bg-purple-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {tab}
              {tab === 'following' && following.size > 0 && (
                <span className="ml-1 text-xs bg-purple-500/30 px-1.5 rounded">
                  {following.size}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
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
              onClick={fetchWhales}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Top Whales */}
            {(activeTab === 'top' || compact) && (
              <div className="divide-y divide-gray-700/30">
                {whales.map((whale) => (
                  <div
                    key={whale.address}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30 transition-colors cursor-pointer"
                    onClick={() => onWhaleClick?.(whale.address)}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center">
                      {whale.rank <= 3 ? (
                        <span className={`text-lg ${
                          whale.rank === 1 ? 'text-yellow-400' :
                          whale.rank === 2 ? 'text-gray-300' : 'text-amber-600'
                        }`}>
                          {whale.rank === 1 ? '🥇' : whale.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">{whale.rank}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {whale.displayName || shortenAddress(whale.address)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {whale.nftCount} NFTs | {whale.topCollections[0] || 'Various'}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {formatSOL(whale.totalHoldings)} SOL
                      </div>
                      <div className="text-xs text-green-400">
                        24h: {formatSOL(whale.volume24h)}
                      </div>
                    </div>

                    {/* Follow Button */}
                    {connected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(whale.address);
                        }}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          following.has(whale.address)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {following.has(whale.address) ? '✓' : '+'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Activity Feed */}
            {activeTab === 'activity' && !compact && (
              <div className="divide-y divide-gray-700/30">
                {activity.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    No recent whale activity
                  </div>
                ) : (
                  activity.map((item, i) => (
                    <div
                      key={`${item.signature}-${i}`}
                      className="px-4 py-3 hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getActionIcon(item.action)}</span>
                        <span className="font-medium text-white">
                          {item.whaleName || shortenAddress(item.whale)}
                        </span>
                        <span className={`text-sm ${getActionColor(item.action)}`}>
                          {item.action}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {item.nftName || shortenAddress(item.mint)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.collection}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-white">{item.price.toFixed(2)} SOL</span>
                          <span>{formatTimeAgo(item.timestamp)}</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Following */}
            {activeTab === 'following' && !compact && (
              <div className="divide-y divide-gray-700/30">
                {following.size === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p className="mb-2">Not following any whales yet</p>
                    <p className="text-xs">Click + to follow whales and track their activity</p>
                  </div>
                ) : (
                  whales
                    .filter((w) => following.has(w.address))
                    .map((whale) => (
                      <div
                        key={whale.address}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white">
                            {whale.displayName || shortenAddress(whale.address)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Last active: {formatTimeAgo(whale.lastActivity)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleFollow(whale.address)}
                          className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                        >
                          Unfollow
                        </button>
                      </div>
                    ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/20 flex items-center justify-between text-xs text-gray-500">
        <span>Tracking top {limit} wallets</span>
        <button
          onClick={() => {
            fetchWhales();
            fetchActivity();
          }}
          className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
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

export default WhaleTracker;
