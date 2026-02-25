/**
 * Floor Price Chart Component
 * Uses TradingView Lightweight Charts for floor price history
 *
 * Note: Requires lightweight-charts package
 * npm install lightweight-charts
 *
 * DISABLED: Component not currently used
 * TypeScript checking disabled below due to missing lightweight-charts dependency
 */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Component disabled, lightweight-charts not installed

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE } from '../config/api';

interface PricePoint {
  timestamp: number;
  floorPrice: number;
  volume: number;
  numSales: number;
}

interface FloorPriceChartProps {
  collectionSlug: string;
  height?: number;
  showVolume?: boolean;
  period?: '24h' | '7d' | '30d' | 'all';
  onPeriodChange?: (period: '24h' | '7d' | '30d' | 'all') => void;
}

// TradingView Lightweight Charts types (simplified)
interface IChartApi {
  remove: () => void;
  timeScale: () => {
    fitContent: () => void;
    scrollToPosition: (position: number, animated?: boolean) => void;
  };
  resize: (width: number, height: number) => void;
  addAreaSeries: (options?: any) => ISeriesApi;
  addHistogramSeries: (options?: any) => ISeriesApi;
}

interface ISeriesApi {
  setData: (data: any[]) => void;
  update: (data: any) => void;
  priceScale: () => { applyOptions: (options: any) => void };
}

export const FloorPriceChart: React.FC<FloorPriceChartProps> = ({
  collectionSlug,
  height = 300,
  showVolume = true,
  period: initialPeriod = '7d',
  onPeriodChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi | null>(null);

  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>(initialPeriod);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    currentPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    avgVolume: number;
  } | null>(null);

  const fetchPriceHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/tensor/history/${collectionSlug}?period=${period}`);
      const data = await response.json();

      if (!data.success || !data.data?.history) {
        throw new Error(data.error || 'Failed to fetch price history');
      }

      const history: PricePoint[] = data.data.history;

      if (history.length === 0) {
        setError('No price history available');
        setLoading(false);
        return;
      }

      // Calculate stats
      const prices = history.map((p) => p.floorPrice);
      const volumes = history.map((p) => p.volume);
      const currentPrice = prices[prices.length - 1];
      const startPrice = prices[0];
      const change = currentPrice - startPrice;
      const changePercent = (change / startPrice) * 100;

      setStats({
        currentPrice,
        change,
        changePercent,
        high: Math.max(...prices),
        low: Math.min(...prices),
        avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      });

      // Format data for charts
      const priceData = history.map((p) => ({
        time: Math.floor(p.timestamp / 1000) as any,
        value: p.floorPrice,
      }));

      const volumeData = history.map((p) => ({
        time: Math.floor(p.timestamp / 1000) as any,
        value: p.volume,
        color: p.volume > (volumes.reduce((a, b) => a + b, 0) / volumes.length)
          ? 'rgba(147, 51, 234, 0.5)'
          : 'rgba(147, 51, 234, 0.2)',
      }));

      // Update chart series
      if (priceSeriesRef.current) {
        priceSeriesRef.current.setData(priceData);
      }
      if (volumeSeriesRef.current && showVolume) {
        volumeSeriesRef.current.setData(volumeData);
      }

      // Fit content
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [collectionSlug, period, showVolume]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const initChart = async () => {
      try {
        // Dynamic import for lightweight-charts
        const { createChart, ColorType, LineStyle } = await import('lightweight-charts');

        // Create chart
        const chart = createChart(chartContainerRef.current!, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#9CA3AF',
          },
          grid: {
            vertLines: { color: 'rgba(107, 114, 128, 0.1)' },
            horzLines: { color: 'rgba(107, 114, 128, 0.1)' },
          },
          width: chartContainerRef.current!.clientWidth,
          height,
          crosshair: {
            vertLine: {
              color: 'rgba(147, 51, 234, 0.5)',
              width: 1,
              style: LineStyle.Dashed,
              labelBackgroundColor: '#7C3AED',
            },
            horzLine: {
              color: 'rgba(147, 51, 234, 0.5)',
              width: 1,
              style: LineStyle.Dashed,
              labelBackgroundColor: '#7C3AED',
            },
          },
          rightPriceScale: {
            borderColor: 'rgba(107, 114, 128, 0.2)',
          },
          timeScale: {
            borderColor: 'rgba(107, 114, 128, 0.2)',
            timeVisible: true,
            secondsVisible: false,
          },
        });

        chartRef.current = chart;

        // Add price area series
        const priceSeries = chart.addAreaSeries({
          lineColor: '#7C3AED',
          topColor: 'rgba(124, 58, 237, 0.4)',
          bottomColor: 'rgba(124, 58, 237, 0.0)',
          lineWidth: 2,
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });
        priceSeriesRef.current = priceSeries;

        // Add volume histogram if enabled
        if (showVolume) {
          const volumeSeries = chart.addHistogramSeries({
            color: 'rgba(147, 51, 234, 0.3)',
            priceFormat: {
              type: 'volume',
            },
            priceScaleId: 'volume',
          });
          volumeSeries.priceScale().applyOptions({
            scaleMargins: {
              top: 0.8,
              bottom: 0,
            },
          });
          volumeSeriesRef.current = volumeSeries;
        }

        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.resize(
              chartContainerRef.current.clientWidth,
              height
            );
          }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          chart.remove();
        };
      } catch (err) {
        console.error('Failed to initialize chart:', err);
        setError('Chart library not available. Install: npm install lightweight-charts');
      }
    };

    initChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [height, showVolume]);

  // Fetch data when period changes
  useEffect(() => {
    if (chartRef.current) {
      fetchPriceHistory();
    }
  }, [fetchPriceHistory]);

  const handlePeriodChange = (newPeriod: '24h' | '7d' | '30d' | 'all') => {
    setPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const formatPrice = (price: number) => `${price.toFixed(2)} SOL`;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-white">Floor Price</h3>
            {stats && (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{formatPrice(stats.currentPrice)}</span>
                <span
                  className={`text-sm font-medium px-2 py-0.5 rounded ${
                    stats.changePercent >= 0
                      ? 'text-green-400 bg-green-500/20'
                      : 'text-red-400 bg-red-500/20'
                  }`}
                >
                  {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
            {(['24h', '7d', '30d', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  period === p
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>High: <span className="text-green-400">{formatPrice(stats.high)}</span></span>
            <span>Low: <span className="text-red-400">{formatPrice(stats.low)}</span></span>
            <span>Avg Vol: <span className="text-blue-400">{stats.avgVolume.toFixed(1)} SOL</span></span>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading chart...
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <button
                onClick={fetchPriceHistory}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/20 flex items-center justify-between text-xs text-gray-500">
        <span>Data from Tensor Trade API</span>
        <span>Powered by TradingView</span>
      </div>
    </div>
  );
};

export default FloorPriceChart;
