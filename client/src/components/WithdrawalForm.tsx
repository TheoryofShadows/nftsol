import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from './NotificationSystem';

export default function WithdrawalForm() {
  const { publicKey, connected } = useWallet();
  const { addNotification } = useNotification();
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // Check wallet balance
  const checkBalance = async () => {
    if (!publicKey) return;

    try {
      const res = await fetch(
        (await import('../config/api')).API_ENDPOINTS.withdrawals.balance(publicKey.toBase58())
      );
      const data = await res.json();

      if (data.success) {
        setBalance(data.data.balance);
      }
    } catch (e) {
      console.error('Failed to check balance:', e);
    }
  };

  // Create withdrawal request
  const createWithdrawal = async () => {
    if (!amount || !toAddress || !connected) return;
    setLoading(true);

    try {
      const { API_ENDPOINTS } = await import('../config/api');
      const res = await fetch(API_ENDPOINTS.withdrawals.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_sol: parseFloat(amount),
          to_address: toAddress,
          userId: publicKey!.toBase58(), // Using wallet address as user ID for demo
        }),
      });

      const data = await res.json();

      if (data.success) {
        addNotification({
          type: 'success',
          title: '✅ Withdrawal Request Created!',
          message: `Amount: ${amount} SOL\nTo: ${toAddress}\nStatus: ${data.data.status}\n\nYour withdrawal is pending admin approval.`,
          duration: 6000,
        });
        setAmount('');
        setToAddress('');
      } else {
        addNotification({
          type: 'error',
          title: 'Withdrawal Failed',
          message: data.error || 'Unknown error occurred',
          duration: 5000,
        });
      }
    } catch (e: any) {
      addNotification({
        type: 'error',
        title: 'Withdrawal Failed',
        message: e.message || 'An unexpected error occurred',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify destination wallet
  const verifyAddress = async () => {
    if (!toAddress) return;

    try {
      const { API_ENDPOINTS } = await import('../config/api');
      const res = await fetch(API_ENDPOINTS.withdrawals.verify(toAddress));
      const data = await res.json();

      if (data.success && data.data.exists) {
        addNotification({
          type: 'success',
          title: '✅ Wallet Verified',
          message: 'Wallet address is valid and exists on Solana network',
          duration: 3000,
        });
      } else {
        addNotification({
          type: 'error',
          title: '❌ Invalid Wallet',
          message: 'Invalid wallet address or wallet does not exist',
          duration: 4000,
        });
      }
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Verification Failed',
        message: 'Failed to verify wallet address',
        duration: 4000,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-glass p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-3xl font-bold gradient-text font-display mb-2">Withdraw SOL</h3>
          <p className="text-gray-300">Transfer SOL from the platform wallet</p>
        </div>

        <div className="space-y-6">
          {/* Balance Check */}
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-white">Wallet Balance</h4>
              <button onClick={checkBalance} className="btn-secondary text-sm px-4 py-2">
                🔄 Check Balance
              </button>
            </div>
            {balance !== null ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-2xl font-bold text-cyan-400">{balance.toFixed(4)} SOL</span>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Click to check your balance</p>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Amount (SOL)</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input pr-12"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 font-bold">
                SOL
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Minimum: 0.001 SOL</p>
          </div>

          {/* Destination Address */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Destination Wallet
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter Solana wallet address..."
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                className="input flex-1"
              />
              <button onClick={verifyAddress} className="btn-outline px-4 py-3 whitespace-nowrap">
                ✓ Verify
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Enter a valid Solana wallet address</p>
          </div>

          {/* Submit Button */}
          <button
            onClick={createWithdrawal}
            disabled={!connected || loading || !amount || !toAddress}
            className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-spinner w-5 h-5"></div>
                <span>Creating Withdrawal...</span>
              </div>
            ) : (
              '🚀 Create Withdrawal Request'
            )}
          </button>

          {/* Status Messages */}
          {!connected && (
            <div className="text-center">
              <div className="glass px-4 py-3 rounded-lg border border-red-400/30">
                <p className="text-red-400 text-sm">⚠️ Connect your wallet to withdraw</p>
              </div>
            </div>
          )}

          {connected && (!amount || !toAddress) && (
            <div className="text-center">
              <p className="text-gray-400 text-sm">📝 Please fill in all fields to continue</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h4 className="font-semibold text-white mb-4 text-center">Withdrawal Process</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="glass p-4 rounded-lg">
              <div className="text-2xl mb-2">📝</div>
              <h5 className="font-semibold text-white mb-1">1. Submit Request</h5>
              <p className="text-xs text-gray-400">Fill out the form above</p>
            </div>
            <div className="glass p-4 rounded-lg">
              <div className="text-2xl mb-2">⏳</div>
              <h5 className="font-semibold text-white mb-1">2. Admin Review</h5>
              <p className="text-xs text-gray-400">Requires approval</p>
            </div>
            <div className="glass p-4 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <h5 className="font-semibold text-white mb-1">3. Process</h5>
              <p className="text-xs text-gray-400">20-30 seconds</p>
            </div>
          </div>

          <div className="mt-6 glass p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-400 text-lg">ℹ️</div>
              <div className="text-sm text-gray-300">
                <p className="font-semibold mb-2">Important Notes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Withdrawals require admin approval for security</li>
                  <li>• Minimum withdrawal: 0.001 SOL</li>
                  <li>• Processing time: 20-30 seconds after approval</li>
                  <li>• All transactions are recorded on Solana blockchain</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
