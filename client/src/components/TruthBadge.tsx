import React from 'react';

interface TruthBadgeProps {
  score: number;
  verified?: boolean;
  summary?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export default function TruthBadge({
  score,
  verified,
  summary,
  size = 'md',
  showPulse = false,
}: TruthBadgeProps) {
  const isVerified = verified !== undefined ? verified : score > 70;
  const isModerate = !isVerified && score >= 50;

  const getColorClasses = () => {
    if (isVerified) {
      return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-300';
    } else if (isModerate) {
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/50 text-yellow-300';
    } else {
      return 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/50 text-red-300';
    }
  };

  const getIcon = () => {
    if (isVerified) {
      return '✅';
    } else if (isModerate) {
      return '⚠️';
    } else {
      return '⚠️';
    }
  };

  const getLabel = () => {
    if (isVerified) {
      return 'Verified';
    } else if (isModerate) {
      return 'Moderate';
    } else {
      return 'Low Trust';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border-2 font-semibold transition-all duration-300
        ${getColorClasses()}
        ${sizeClasses[size]}
        ${showPulse ? 'animate-pulse' : ''}
        hover:scale-105 cursor-help
      `}
      title={summary ? `${getLabel()}: ${score}% - ${summary}` : `${getLabel()}: ${score}%`}
    >
      <span className="text-base">{getIcon()}</span>
      <span>{getLabel()}</span>
      <span className="opacity-75">({score}%)</span>
    </div>
  );
}
