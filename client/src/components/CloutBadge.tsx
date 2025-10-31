import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCloutBalance } from '../hooks/useCloutBalance';

/**
 * CloutBadge Component
 * Displays user's CLOUT token balance using custom hook
 * Positioned as a fixed badge in bottom-right corner
 *
 * @component
 */
export default function CloutBadge() {
  const { publicKey, connected } = useWallet();
  const { balance, isLoading, error } = useCloutBalance();

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div
      className="glass fixed right-4 bottom-4 px-4 py-3 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md z-50 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/25"
      style={{ minWidth: '200px' }}
      title={`CLOUT Token Balance${error ? ` - Error: ${error}` : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white font-bold text-sm">⭐</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 mb-0.5 font-medium">CLOUT Balance</div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-1" aria-label="Loading CLOUT balance">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span className="text-white text-sm">Loading...</span>
              </div>
            ) : error ? (
              <span className="text-red-400 text-xs" title={error}>
                ⚠️ Error
              </span>
            ) : (
              <span className="text-white font-bold text-lg">
                {balance.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate font-mono">
            {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}
          </div>
        </div>
      </div>
    </div>
  );
}
