import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// const API_BASE =
//   (import.meta.env.VITE_API_BASE as string) ||
//   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'); // Unused for now

interface Transaction {
  id: string;
  type: 'mint' | 'buy' | 'sell' | 'transfer' | 'list' | 'delist';
  amount?: number;
  currency?: string;
  nftName?: string;
  nftImage?: string;
  fromAddress?: string;
  toAddress?: string;
  timestamp: string;
  signature?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export default function TransactionHistory() {
  const { connected, publicKey } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    // In a real app, this would fetch from blockchain/indexer
    // For now, we'll use localStorage to track transactions
    const loadTransactions = () => {
      try {
        const stored = localStorage.getItem(`transactions-${publicKey.toBase58()}`);
        if (stored) {
          const txs = JSON.parse(stored);
          setTransactions(txs.sort((a: Transaction, b: Transaction) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ));
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();

    // Listen for new transactions
    const handleTransaction = (event: CustomEvent) => {
      const newTx = event.detail;
      setTransactions((prev) => [newTx, ...prev].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    };

    window.addEventListener('nft-transaction' as any, handleTransaction as EventListener);
    return () => window.removeEventListener('nft-transaction' as any, handleTransaction as EventListener);
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold gradient-text-primary mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-300 mb-6">
          Connect your wallet to view your transaction history
        </p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mint': return '✨';
      case 'buy': return '💰';
      case 'sell': return '💸';
      case 'transfer': return '📤';
      case 'list': return '🏷️';
      case 'delist': return '❌';
      default: return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mint': return 'from-purple-500 to-pink-500';
      case 'buy': return 'from-green-500 to-emerald-500';
      case 'sell': return 'from-yellow-500 to-orange-500';
      case 'transfer': return 'from-blue-500 to-cyan-500';
      case 'list': return 'from-cyan-500 to-blue-500';
      case 'delist': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter((tx) => tx.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold gradient-text font-display mb-2">
            📜 Transaction History
          </h1>
          <p className="text-gray-300">
            View all your NFT transactions and activity
          </p>
        </div>

        {/* Filter */}
        <div className="mt-4 md:mt-0">
          <label htmlFor="filter-select" className="block text-sm font-semibold text-white mb-2">
            Filter
          </label>
          <select
            id="filter-select"
            aria-label="Transaction filter"
            title="Transaction filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Transactions</option>
            <option value="mint">✨ Mint</option>
            <option value="buy">💰 Buy</option>
            <option value="sell">💸 Sell</option>
            <option value="list">🏷️ List</option>
            <option value="delist">❌ Delist</option>
            <option value="transfer">📤 Transfer</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading transactions...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-8xl mb-6">📋</div>
          <h2 className="text-3xl font-bold gradient-text-modern mb-4">
            No Transactions Yet
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Your transaction history will appear here once you start minting, buying, or selling NFTs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'mint' }))}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all transform"
            >
              ✨ Mint NFT
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
              className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-lg transition-all"
            >
              🏪 Browse Marketplace
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="glass-card p-6 hover:bg-white/5 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Type Icon */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${getTypeColor(tx.type)} flex items-center justify-center text-3xl flex-shrink-0`}>
                  {getTypeIcon(tx.type)}
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white capitalize">
                        {tx.type} {tx.nftName && `• ${tx.nftName}`}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {tx.amount && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-cyan-400">
                          {tx.amount} {tx.currency || 'SOL'}
                        </p>
                        {tx.status === 'pending' && (
                          <p className="text-xs text-yellow-400">Pending</p>
                        )}
                        {tx.status === 'confirmed' && (
                          <p className="text-xs text-green-400">Confirmed</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Addresses */}
                  {(tx.fromAddress || tx.toAddress) && (
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
                      {tx.fromAddress && (
                        <span>
                          From: <span className="font-mono text-cyan-400">{tx.fromAddress.slice(0, 8)}...{tx.fromAddress.slice(-4)}</span>
                        </span>
                      )}
                      {tx.toAddress && (
                        <span>
                          To: <span className="font-mono text-cyan-400">{tx.toAddress.slice(0, 8)}...{tx.toAddress.slice(-4)}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Signature */}
                  {tx.signature && (
                    <a
                      href={`https://solscan.io/tx/${tx.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-block"
                    >
                      View on Solscan →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

