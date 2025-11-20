/**
 * Archive Item Card Component
 * Display individual archive item in a card
 */

import React from 'react';
import { SearchResult } from '../services/archiveService';

interface ArchiveItemCardProps {
  item: SearchResult;
  onClick: () => void;
}

export const ArchiveItemCard: React.FC<ArchiveItemCardProps> = ({ item, onClick }) => {
  const getMediaIcon = (mediaType: string): string => {
    const lower = mediaType.toLowerCase();
    if (lower.includes('video') || lower === 'movingimage') return '🎬';
    if (lower.includes('audio')) return '🎵';
    if (lower.includes('image')) return '🖼️';
    if (lower.includes('text') || lower === 'document') return '📄';
    return '📦';
  };

  const getLicenseColor = (license: string): string => {
    const lower = license.toLowerCase();
    if (lower.includes('public')) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (lower.includes('cc-by')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <button
      onClick={onClick}
      className="group relative glass-card rounded-xl overflow-hidden hover:bg-white/10 transition-all transform hover:scale-105 hover:shadow-xl text-left h-full flex flex-col"
    >
      {/* Thumbnail */}
      {item.thumbnailUrl && (
        <div className="relative w-full h-40 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 overflow-hidden">
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
          />
          {/* Media Type Badge */}
          <div className="absolute top-2 right-2 text-2xl">
            {getMediaIcon(item.mediaType)}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Title */}
        <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-cyan-300 transition-colors">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 line-clamp-2 mb-3 flex-1">
          {item.description || 'No description available'}
        </p>

        {/* Meta Info */}
        <div className="space-y-2 mb-3 text-xs">
          {/* Creator */}
          {item.creator && (
            <div className="flex items-center gap-1 text-gray-400">
              <span>👤</span>
              <span className="truncate">{item.creator}</span>
            </div>
          )}

          {/* Year */}
          {item.year && (
            <div className="flex items-center gap-1 text-gray-400">
              <span>📅</span>
              <span>{item.year}</span>
            </div>
          )}

          {/* Downloads */}
          <div className="flex items-center gap-1 text-gray-400">
            <span>⬇️</span>
            <span>{formatNumber(item.downloads)} downloads</span>
          </div>

          {/* Duration */}
          {item.duration && (
            <div className="flex items-center gap-1 text-gray-400">
              <span>⏱️</span>
              <span>{Math.floor(item.duration / 60)} min</span>
            </div>
          )}
        </div>

        {/* License Badge */}
        <div className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getLicenseColor(item.licenseType)} w-fit`}>
          {item.licenseType}
        </div>
      </div>

      {/* Click Indicator */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
        <span className="text-cyan-300 font-semibold text-sm">View Details →</span>
      </div>
    </button>
  );
};

export default ArchiveItemCard;
