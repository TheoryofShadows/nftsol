import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function ModernWalletConnect() {
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const connectionContext = useConnection();
  const connection = connectionContext?.connection;
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (connected && publicKey && connection && 'getBalance' in connection) {
      setIsLoading(true);
      connection
        .getBalance(publicKey)
        .then((lamports) => setBalance(lamports / LAMPORTS_PER_SOL))
        .catch((err) => {
          if (import.meta.env.DEV) {
            console.error('Failed to fetch balance:', err);
          }
        })
        .finally(() => setIsLoading(false));

      // Subscribe to balance changes
      const subscription = connection.onAccountChange(
        publicKey,
        (accountInfo) => {
          setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
        },
        'confirmed'
      );

      return () => {
        connection.removeAccountChangeListener(subscription);
      };
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, connection]);

  if (connected && publicKey) {
    const shortAddress = `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`;
    const walletName = wallet?.adapter?.name || 'Wallet';

    return (
      <div className="relative" data-tour="wallet-connect">
        <div
          className="glass-card-hover p-4 cursor-pointer min-w-[200px]"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                <span className="text-xl">👛</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-white">{walletName}</div>
                <div className="text-xs text-gray-400 font-mono">{shortAddress}</div>
              </div>
            </div>
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : balance !== null ? (
              <div className="text-right">
                <div className="text-sm font-bold gradient-text-primary">
                  {balance.toFixed(4)} SOL
                </div>
              </div>
            ) : null}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-2 w-64 glass-card z-50 p-2 animate-fade-in">
              <div className="p-3 border-b border-white/10">
                <div className="text-xs text-gray-400 mb-1">Connected Wallet</div>
                <div className="font-mono text-sm text-white break-all">{publicKey.toBase58()}</div>
              </div>
              
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Balance</span>
                  {isLoading && (
                    <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div className="text-lg font-bold gradient-text-primary">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  disconnect();
                }}
                className="w-full px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold transition-all duration-200 mt-2"
              >
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setVisible(true)}
        className="btn-primary-modern px-6 py-3 text-base font-semibold"
      >
        <span className="flex items-center space-x-2">
          <span>Connect Wallet</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </span>
      </button>
      <WalletMultiButton className="hidden" />
    </div>
  );
}
