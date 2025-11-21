/**
 * Tax Export Component
 * Export NFT transaction history for tax software
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { API_BASE } from '../config/api';

interface TaxSummary {
  wallet: string;
  year: number;
  totalBuys: number;
  totalSells: number;
  totalMints: number;
  totalCostBasis: number;
  totalProceeds: number;
  realizedPnL: number;
  totalFees: number;
  shortTermGains: number;
  longTermGains: number;
  transactionCount: number;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface TaxExportProps {
  defaultYear?: number;
}

const EXPORT_FORMATS: ExportFormat[] = [
  { id: 'csv', name: 'Generic CSV', description: 'Standard CSV format', icon: '📄' },
  { id: 'koinly', name: 'Koinly', description: 'Koinly-compatible format', icon: '🔵' },
  { id: 'cointracker', name: 'CoinTracker', description: 'CoinTracker import format', icon: '📊' },
  { id: 'tokentax', name: 'TokenTax', description: 'TokenTax format', icon: '💰' },
  { id: 'turbotax', name: 'TurboTax', description: 'TurboTax 8949 format', icon: '🏛️' },
];

export const TaxExport: React.FC<TaxExportProps> = ({
  defaultYear = new Date().getFullYear(),
}) => {
  const { publicKey, connected } = useWallet();
  const [year, setYear] = useState(defaultYear);
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => defaultYear - i);

  const fetchSummary = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/tax/summary/${publicKey.toBase58()}/${year}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setSummary(data.data);
      } else {
        setError(data.error || 'Failed to fetch tax summary');
      }
    } catch (err) {
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  }, [publicKey, year]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchSummary();
    }
  }, [connected, publicKey, fetchSummary]);

  const handleExport = async () => {
    if (!publicKey) return;

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/tax/export/${publicKey.toBase58()}?format=${selectedFormat}&year=${year}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      // Get the file blob
      const blob = await response.blob();
      const filename = `nft-tax-export-${publicKey.toBase58().slice(0, 8)}-${selectedFormat}-${year}.csv`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`Downloaded ${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatSOL = (value: number) => {
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(4);
  };

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (!connected) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-gray-400">Connect wallet to export tax data</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-blue-500/10 via-green-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <span className="font-semibold text-white">NFT Tax Export</span>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary */}
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-700/50 rounded"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-gray-700/50 rounded"></div>
              <div className="h-16 bg-gray-700/50 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        ) : summary ? (
          <>
            {/* P&L Card */}
            <div className={`rounded-lg p-4 ${
              summary.realizedPnL >= 0
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Realized P&L ({year})</p>
                <div className={`text-3xl font-bold ${
                  summary.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {summary.realizedPnL >= 0 ? '+' : ''}{formatSOL(summary.realizedPnL)} SOL
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.transactionCount} transactions
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Total Buys</p>
                <p className="text-lg font-semibold text-white">{summary.totalBuys}</p>
                <p className="text-xs text-red-400">-{formatSOL(summary.totalCostBasis)} SOL</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Total Sells</p>
                <p className="text-lg font-semibold text-white">{summary.totalSells}</p>
                <p className="text-xs text-green-400">+{formatSOL(summary.totalProceeds)} SOL</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Mints</p>
                <p className="text-lg font-semibold text-white">{summary.totalMints}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Fees Paid</p>
                <p className="text-lg font-semibold text-white">{formatSOL(summary.totalFees)} SOL</p>
              </div>
            </div>

            {/* Gains Breakdown */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Capital Gains Breakdown</p>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-500">Short-term (&lt;1yr): </span>
                  <span className={summary.shortTermGains >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {formatSOL(summary.shortTermGains)} SOL
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Long-term (&gt;1yr): </span>
                  <span className={summary.longTermGains >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {formatSOL(summary.longTermGains)} SOL
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Export Format Selection */}
        <div className="border-t border-gray-700/50 pt-4">
          <p className="text-sm font-semibold text-white mb-3">Export Format</p>
          <div className="grid grid-cols-2 gap-2">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  selectedFormat === format.id
                    ? 'bg-purple-500/20 border-2 border-purple-500'
                    : 'bg-gray-800/50 border-2 border-transparent hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{format.icon}</span>
                  <span className="text-sm font-medium text-white">{format.name}</span>
                </div>
                <p className="text-xs text-gray-400">{format.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting || loading || !summary}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {exporting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download {EXPORT_FORMATS.find((f) => f.id === selectedFormat)?.name} Export
            </>
          )}
        </button>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center">
          This export is for informational purposes only. Consult a tax professional for accurate tax advice.
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/20 flex items-center justify-between text-xs text-gray-500">
        <span>Data from on-chain transactions</span>
        <button
          onClick={fetchSummary}
          className="text-purple-400 hover:text-purple-300"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default TaxExport;
