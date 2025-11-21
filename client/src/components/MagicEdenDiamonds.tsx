/**
 * Magic Eden Diamonds Component
 * Track and display Diamond rewards and tier progress
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { API_BASE } from '../config/api';

interface DiamondData {
  wallet: string;
  totalDiamonds: number;
  currentTier: string;
  nextTier: string | null;
  nextTierThreshold: number;
  progress: number;
  rank: number;
  weeklyDiamonds: number;
  multiplier: number;
  benefits: string[];
}

interface Quest {
  id: string;
  name: string;
  description: string;
  diamondReward: number;
  progress: number;
  target: number;
  completed: boolean;
  expiresAt?: number;
}

interface MagicEdenDiamondsProps {
  compact?: boolean;
  showQuests?: boolean;
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Bronze: { bg: 'from-amber-700/20 to-orange-600/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  Silver: { bg: 'from-gray-400/20 to-gray-300/20', text: 'text-gray-300', border: 'border-gray-400/30' },
  Gold: { bg: 'from-yellow-500/20 to-amber-400/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  Platinum: { bg: 'from-cyan-400/20 to-blue-400/20', text: 'text-cyan-300', border: 'border-cyan-400/30' },
  Diamond: { bg: 'from-purple-500/20 to-pink-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
};

export const MagicEdenDiamonds: React.FC<MagicEdenDiamondsProps> = ({
  compact = false,
  showQuests = true,
}) => {
  const { publicKey, connected } = useWallet();
  const [diamonds, setDiamonds] = useState<DiamondData | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiamonds = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/magic-eden/diamonds/${publicKey.toBase58()}`);
      const data = await response.json();

      if (data.success && data.data) {
        setDiamonds(data.data);
      } else {
        setError(data.error || 'Failed to fetch diamond data');
      }
    } catch (err) {
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  const fetchQuests = useCallback(async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`${API_BASE}/api/magic-eden/quests/${publicKey.toBase58()}`);
      const data = await response.json();

      if (data.success && data.data) {
        setQuests(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch quests:', err);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchDiamonds();
      if (showQuests) {
        fetchQuests();
      }
    }
  }, [connected, publicKey, fetchDiamonds, fetchQuests, showQuests]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const tierColors = diamonds ? TIER_COLORS[diamonds.currentTier] || TIER_COLORS.Bronze : TIER_COLORS.Bronze;

  if (!connected) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 text-center">
        <div className="text-4xl mb-3">💎</div>
        <p className="text-gray-400">Connect wallet to view Diamonds</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700/50 rounded w-1/2"></div>
          <div className="h-24 bg-gray-700/50 rounded"></div>
          <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !diamonds) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-red-500/30 p-6 text-center">
        <p className="text-red-400 mb-2">{error || 'Failed to load data'}</p>
        <button
          onClick={fetchDiamonds}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r ${tierColors.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <span className="font-semibold text-white">Magic Eden Diamonds</span>
          </div>
          <span className={`text-sm font-bold ${tierColors.text}`}>
            {diamonds.currentTier} Tier
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Diamond Count */}
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-1">
            {formatNumber(diamonds.totalDiamonds)}
            <span className="text-xl ml-2">💎</span>
          </div>
          <p className="text-sm text-gray-400">
            Rank #{diamonds.rank.toLocaleString()} | {diamonds.multiplier}x Multiplier
          </p>
        </div>

        {/* Progress to Next Tier */}
        {diamonds.nextTier && (
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={tierColors.text}>{diamonds.currentTier}</span>
              <span className="text-gray-400">
                {formatNumber(diamonds.totalDiamonds)} / {formatNumber(diamonds.nextTierThreshold)}
              </span>
              <span className={TIER_COLORS[diamonds.nextTier]?.text || 'text-gray-300'}>
                {diamonds.nextTier}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${Math.min(diamonds.progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {formatNumber(diamonds.nextTierThreshold - diamonds.totalDiamonds)} more to {diamonds.nextTier}
            </p>
          </div>
        )}

        {/* Weekly Stats */}
        {!compact && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-400">
                +{formatNumber(diamonds.weeklyDiamonds)}
              </div>
              <p className="text-xs text-gray-400">This Week</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-400">
                {diamonds.multiplier}x
              </div>
              <p className="text-xs text-gray-400">Multiplier</p>
            </div>
          </div>
        )}

        {/* Benefits */}
        {!compact && diamonds.benefits.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-white mb-2">Your Benefits</h4>
            <div className="space-y-1">
              {diamonds.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="text-green-400">✓</span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Quests */}
        {showQuests && quests.length > 0 && (
          <div className="border-t border-gray-700/50 pt-4">
            <h4 className="text-sm font-semibold text-white mb-3">Active Quests</h4>
            <div className="space-y-2">
              {quests.slice(0, compact ? 2 : 4).map((quest) => (
                <div
                  key={quest.id}
                  className={`bg-gray-800/50 rounded-lg p-2 ${
                    quest.completed ? 'border border-green-500/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">{quest.name}</span>
                    <span className="text-xs text-purple-400">
                      +{quest.diamondReward} 💎
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          quest.completed
                            ? 'bg-green-500'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}
                        style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {quest.progress}/{quest.target}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/20 flex items-center justify-between text-xs text-gray-500">
        <span>Updated hourly</span>
        <a
          href="https://magiceden.io/rewards"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-400 hover:text-pink-300 flex items-center gap-1"
        >
          View on ME
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default MagicEdenDiamonds;
