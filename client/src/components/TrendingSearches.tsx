/**
 * Trending Searches Component
 * Display popular searches to inspire users
 */

import React from 'react';

interface TrendingSearchesProps {
  trending: string[];
  onSelect: (keyword: string) => void;
  loading?: boolean;
}

export const TrendingSearches: React.FC<TrendingSearchesProps> = ({
  trending,
  onSelect,
  loading = false,
}) => {
  if (loading || !trending.length) {
    return null;
  }

  const emojis: Record<string, string> = {
    documentaries: '🎬',
    educational: '📚',
    historical: '📜',
    music: '🎵',
    speeches: '🎤',
    nature: '🌿',
    science: '🔬',
    art: '🎨',
    literature: '📖',
    technology: '💻',
    animals: '🦁',
    geography: '🗺️',
    astronomy: '🌌',
    history: '🏛️',
    culture: '🎭',
  };

  const getEmoji = (keyword: string): string => {
    const lower = keyword.toLowerCase();
    return emojis[lower] || '📌';
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">Trending Searches</h2>
      <div className="glass-card p-6 rounded-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {trending.map((keyword) => (
            <button
              key={keyword}
              onClick={() => onSelect(keyword)}
              className="group relative px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/40 hover:to-purple-500/40 text-white font-semibold transition-all transform hover:scale-105 border border-white/10 hover:border-cyan-500/50"
            >
              <span className="text-lg mr-2">{getEmoji(keyword)}</span>
              {keyword}
              <div className="absolute inset-0 rounded-lg bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingSearches;
