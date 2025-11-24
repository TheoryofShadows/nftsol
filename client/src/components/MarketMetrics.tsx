/**
 * Market Metrics Display
 * Shows trending NFT collections and market insights
 */

import React from 'react';

export interface Metric {
  id: string;
  name: string;
  icon: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  description?: string;
}

interface MarketMetricsProps {
  title: string;
  subtitle?: string;
  metrics: Metric[];
  onMetricClick?: (metric: Metric) => void;
  variant?: 'trending' | 'movers' | 'gainers';
}

export const MarketMetrics: React.FC<MarketMetricsProps> = ({
  title,
  subtitle,
  metrics,
  onMetricClick,
  variant = 'trending',
}) => {
  if (metrics.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400">No metrics available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-white mb-2">{title}</h3>
        {subtitle && <p className="text-gray-400">{subtitle}</p>}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            onClick={() => onMetricClick?.(metric)}
            className="group relative p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl hover:border-white/20 hover:bg-white/15 transition-all transform hover:scale-105"
          >
            {/* Background Gradient (subtle) */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            {/* Content */}
            <div className="relative z-10">
              {/* Icon and Name */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{metric.icon}</span>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-white text-sm line-clamp-2">
                    {metric.name}
                  </h4>
                </div>
              </div>

              {/* Main Value */}
              <div className="mb-4">
                <div className="text-2xl font-bold text-white">
                  {typeof metric.value === 'number'
                    ? metric.value > 1000
                      ? `${(metric.value / 1000).toFixed(1)}K`
                      : metric.value.toFixed(2)
                    : metric.value}
                </div>
              </div>

              {/* Change Indicator */}
              <div
                className={`flex items-center gap-2 text-sm font-semibold ${
                  metric.trend === 'up'
                    ? 'text-green-400'
                    : metric.trend === 'down'
                    ? 'text-red-400'
                    : 'text-gray-400'
                }`}
              >
                {metric.trend === 'up' && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414-1.414L13.586 7H12z" />
                  </svg>
                )}
                {metric.trend === 'down' && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v3.586l4.293-4.293a1 1 0 011.414 1.414L9.414 13H12z" />
                  </svg>
                )}
                {metric.trend === 'stable' && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                )}
                <span>
                  {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '' : ''}
                  {Math.abs(metric.change).toFixed(2)}%
                </span>
              </div>

              {/* Description */}
              {metric.description && (
                <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MarketMetrics;
