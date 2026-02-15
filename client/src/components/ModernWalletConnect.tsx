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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
          className="bg-[#111111] border border-[#1e1e1e] rounded-lg p-4 cursor-pointer min-w-[200px] hover:border-[#c9a84c]/20 transition-colors"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-[#c9a84c]/15 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-white">{walletName}</div>
                <div className="text-xs text-zinc-500 font-mono">{shortAddress}</div>
              </div>
            </div>
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            ) : balance !== null ? (
              <div className="text-right">
                <div className="text-sm font-semibold text-[#c9a84c]">
                  {balance.toFixed(4)} SOL
                </div>
              </div>
            ) : null}
            <svg
              className={`w-4 h-4 text-zinc-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 mt-2 w-64 bg-[#111111] border border-[#1e1e1e] rounded-lg z-50 p-2 animate-fade-in shadow-xl">
              <div className="p-3 border-b border-[#1e1e1e]">
                <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Connected Wallet</div>
                <div className="font-mono text-xs text-zinc-400 break-all">{publicKey.toBase58()}</div>
              </div>

              <div className="p-3 border-b border-[#1e1e1e]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Balance</span>
                  {isLoading && (
                    <div className="w-3 h-3 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div className="text-lg font-bold text-[#c9a84c]">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  disconnect();
                }}
                className="w-full px-4 py-2 rounded-md bg-red-500/10 hover:bg-red-500/15 text-red-400 font-medium text-sm transition-colors mt-2"
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
        className="bg-[#c9a84c] hover:bg-[#b8973f] text-black px-6 py-3 text-sm font-semibold rounded-lg transition-colors"
      >
        <span className="flex items-center space-x-2">
          <span>Connect Wallet</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </span>
      </button>
      <WalletMultiButton className="hidden" />
    </div>
  );
}
