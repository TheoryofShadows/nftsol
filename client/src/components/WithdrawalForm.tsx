import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function WithdrawalForm() {
  const { publicKey, connected } = useWallet();
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // Check wallet balance
  const checkBalance = async () => {
    if (!publicKey) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/nfts/balance/${publicKey.toBase58()}`);
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/wallets/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_sol: parseFloat(amount),
          to_address: toAddress,
          userId: publicKey!.toBase58() // Using wallet address as user ID for demo
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ Withdrawal Request Created!\n\nAmount: ${amount} SOL\nTo: ${toAddress}\nStatus: ${data.data.status}\n\nYour withdrawal is pending admin approval.`);
        setAmount('');
        setToAddress('');
      } else {
        alert(`Withdrawal failed: ${data.error}`);
      }
    } catch (e: any) {
      alert('Withdrawal failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify destination wallet
  const verifyAddress = async () => {
    if (!toAddress) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/nfts/verify/${toAddress}`);
      const data = await res.json();
      
      if (data.success && data.data.exists) {
        alert('✅ Wallet address is valid and exists on Solana network');
      } else {
        alert('❌ Invalid wallet address or wallet does not exist');
      }
    } catch (e) {
      alert('Failed to verify wallet address');
    }
  };

  return (
    <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl">
      <h3 className="text-xl font-bold mb-4">Withdraw SOL</h3>
      
      {/* Balance Check */}
      <div className="mb-4">
        <button
          onClick={checkBalance}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Check Balance
        </button>
        {balance !== null && (
          <p className="text-sm mt-2 text-green-400">
            Balance: {balance.toFixed(4)} SOL
          </p>
        )}
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amount (SOL)</label>
        <input
          type="number"
          step="0.001"
          min="0.001"
          placeholder="0.001"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/20 placeholder-gray-400"
        />
      </div>

      {/* Destination Address */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Destination Wallet</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Solana wallet address"
            value={toAddress}
            onChange={e => setToAddress(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-white/20 placeholder-gray-400"
          />
          <button
            onClick={verifyAddress}
            className="bg-yellow-600 text-white px-4 py-3 rounded-lg text-sm"
          >
            Verify
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={createWithdrawal}
        disabled={!connected || loading || !amount || !toAddress}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {loading ? 'Creating Withdrawal...' : 'Create Withdrawal Request'}
      </button>

      {!connected && (
        <p className="text-red-400 text-sm mt-2">Connect wallet to withdraw</p>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-gray-300">
        <p>• Withdrawals require admin approval</p>
        <p>• Minimum withdrawal: 0.001 SOL</p>
        <p>• Processing time: 20-30 seconds after approval</p>
      </div>
    </div>
  );
}
