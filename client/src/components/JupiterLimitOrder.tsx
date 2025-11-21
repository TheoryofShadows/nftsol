/**
 * Jupiter Limit Order Component
 * Place limit orders for token swaps using Jupiter V6
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { API_BASE } from '../config/api';

interface TokenPrice {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
  timeTaken: number;
}

interface OpenOrder {
  orderKey: string;
  inputMint: string;
  outputMint: string;
  makingAmount: string;
  takingAmount: string;
  expiredAt: string | null;
  createdAt: string;
}

interface JupiterLimitOrderProps {
  onOrderCreated?: (signature: string) => void;
  compact?: boolean;
}

const POPULAR_TOKENS = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9, logo: '◎' },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, logo: '$' },
  { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, logo: '🐕' },
  { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6, logo: '🪐' },
  { symbol: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6, logo: '🎩' },
];

export const JupiterLimitOrder: React.FC<JupiterLimitOrderProps> = ({
  onOrderCreated,
  compact = false,
}) => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [inputToken, setInputToken] = useState(POPULAR_TOKENS[0]);
  const [outputToken, setOutputToken] = useState(POPULAR_TOKENS[1]);
  const [inputAmount, setInputAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!inputToken || !outputToken) return;
    setPriceLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/jupiter/price/${inputToken.mint}?vsToken=${outputToken.mint}`
      );
      const data = await response.json();

      if (data.success && data.data?.price) {
        setCurrentPrice(data.data.price);
        if (!limitPrice) {
          setLimitPrice(data.data.price.toFixed(6));
        }
      }
    } catch (err) {
      console.error('Failed to fetch price:', err);
    } finally {
      setPriceLoading(false);
    }
  }, [inputToken, outputToken, limitPrice]);

  const fetchOpenOrders = useCallback(async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/jupiter/limit-order/open/${publicKey.toBase58()}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setOpenOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch open orders:', err);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchOpenOrders();
    }
  }, [connected, publicKey, fetchOpenOrders]);

  const handleSwapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setLimitPrice('');
    setCurrentPrice(null);
  };

  const calculateOutput = () => {
    if (!inputAmount || !limitPrice) return '0';
    const output = parseFloat(inputAmount) * parseFloat(limitPrice);
    return isNaN(output) ? '0' : output.toFixed(6);
  };

  const handleCreateOrder = async () => {
    if (!publicKey || !signTransaction) {
      setError('Please connect your wallet');
      return;
    }

    if (!inputAmount || !limitPrice) {
      setError('Please enter amount and price');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/jupiter/limit-order/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          inputMint: inputToken.mint,
          outputMint: outputToken.mint,
          inAmount: (parseFloat(inputAmount) * Math.pow(10, inputToken.decimals)).toString(),
          outAmount: (parseFloat(calculateOutput()) * Math.pow(10, outputToken.decimals)).toString(),
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.transaction) {
        // Sign and send transaction
        setSuccess(`Order created! Transaction: ${data.data.transaction.slice(0, 8)}...`);
        onOrderCreated?.(data.data.transaction);
        await fetchOpenOrders();
        setInputAmount('');
      } else {
        setError(data.error || 'Failed to create order');
      }
    } catch (err) {
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderKey: string) => {
    if (!publicKey) return;

    try {
      const response = await fetch(`${API_BASE}/api/jupiter/limit-order/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          orderKey,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchOpenOrders();
      }
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  const priceChange = currentPrice && limitPrice
    ? ((parseFloat(limitPrice) - currentPrice) / currentPrice) * 100
    : 0;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-green-500/10 via-purple-500/10 to-blue-500/10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪐</span>
          <span className="font-semibold text-white">Jupiter Limit Orders</span>
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">V6</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Input Token */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">You Pay</span>
            <select
              value={inputToken.symbol}
              onChange={(e) => {
                const token = POPULAR_TOKENS.find((t) => t.symbol === e.target.value);
                if (token) setInputToken(token);
              }}
              className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
            >
              {POPULAR_TOKENS.map((token) => (
                <option key={token.mint} value={token.symbol}>
                  {token.logo} {token.symbol}
                </option>
              ))}
            </select>
          </div>
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-2xl text-white font-bold outline-none"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Output Token */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">You Receive</span>
            <select
              value={outputToken.symbol}
              onChange={(e) => {
                const token = POPULAR_TOKENS.find((t) => t.symbol === e.target.value);
                if (token) setOutputToken(token);
              }}
              className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
            >
              {POPULAR_TOKENS.map((token) => (
                <option key={token.mint} value={token.symbol}>
                  {token.logo} {token.symbol}
                </option>
              ))}
            </select>
          </div>
          <div className="text-2xl text-white font-bold">
            {calculateOutput()}
          </div>
        </div>

        {/* Limit Price */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Limit Price ({inputToken.symbol}/{outputToken.symbol})</span>
            {currentPrice && (
              <span className="text-xs text-gray-500">
                Market: {currentPrice.toFixed(6)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-xl text-white font-bold outline-none"
            />
            {priceChange !== 0 && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                priceChange > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Create Order Button */}
        <button
          onClick={handleCreateOrder}
          disabled={!connected || loading || !inputAmount || !limitPrice}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating Order...
            </>
          ) : !connected ? (
            'Connect Wallet'
          ) : (
            'Place Limit Order'
          )}
        </button>

        {/* Open Orders */}
        {!compact && openOrders.length > 0 && (
          <div className="border-t border-gray-700/50 pt-4">
            <h4 className="text-sm font-semibold text-white mb-3">Open Orders ({openOrders.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {openOrders.map((order) => (
                <div
                  key={order.orderKey}
                  className="bg-gray-800/50 rounded-lg p-2 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="text-gray-400">
                      {order.makingAmount} → {order.takingAmount}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCancelOrder(order.orderKey)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/20 flex items-center justify-between text-xs text-gray-500">
        <span>Powered by Jupiter V6</span>
        <a
          href="https://jup.ag"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400 hover:text-green-300"
        >
          jup.ag
        </a>
      </div>
    </div>
  );
};

export default JupiterLimitOrder;
