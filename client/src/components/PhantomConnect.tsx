import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

export default function PhantomConnect() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectClick = () => {
    setVisible(true);
  };

  // Fetch wallet balance
  useEffect(() => {
    if (connected && publicKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [publicKey.toBase58()],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.result?.value) {
            setBalance(data.result.value / 1e9); // Convert lamports to SOL
          }
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error('Failed to fetch wallet balance:', error);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [connected, publicKey]);

  if (connected && publicKey) {
    return (
      <div className="flex items-center space-x-4">
        {/* Wallet Info Card */}
        <div className="glass px-4 py-3 rounded-xl border border-cyan-400/30">
          <div className="flex items-center space-x-3">
            {/* Wallet Avatar */}
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">👛</span>
            </div>

            {/* Wallet Details */}
            <div className="text-left">
              <div className="text-sm font-mono text-cyan-300">
                {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </div>
              <div className="text-xs text-gray-400">
                {isLoading ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span>Loading...</span>
                  </div>
                ) : balance !== null ? (
                  `${balance.toFixed(4)} SOL`
                ) : (
                  'Balance unavailable'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Disconnect Button */}
        <button onClick={disconnect} className="btn-outline text-xs px-3 py-2">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleConnectClick}
        className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm md:text-base"
      >
        <span className="flex items-center gap-2">
          <span>Connect Wallet</span>
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </span>
      </button>
      {/* Hidden WalletMultiButton - we use custom button but need this for modal */}
      <WalletMultiButton className="!hidden" />
    </div>
  );
}
