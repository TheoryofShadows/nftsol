import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from './NotificationSystem';

interface Withdrawal {
  id: string;
  user_id: string;
  to_address: string;
  amount_lamports: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'rejected';
  created_at: string;
  admin_id?: string;
  processed_tx_sig?: string;
  failure_reason?: string;
  admin_reason?: string;
}

const AdminDashboard: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { addNotification } = useNotification();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending');

  const fetchWithdrawals = async (status?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const url = status 
        ? `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/admin/withdrawals?status=${status}`
        : `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/admin/withdrawals?status=pending';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch withdrawals');
      }

      const data = await response.json();
      setWithdrawals(data.data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load withdrawals',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab === 'pending') {
      fetchWithdrawals('pending');
    } else {
      fetchWithdrawals();
    }
  }, [selectedTab]);

  const handleAction = async (withdrawalId: string, action: 'approve' | 'process' | 'reject') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/admin/withdrawals/${withdrawalId}/${action}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: `${action} by admin` }),
        }
      );

      if (!response.ok) {
        throw new Error('Action failed');
      }

      addNotification({
        type: 'success',
        title: 'Success',
        message: `Withdrawal ${action}ed successfully`,
      });

      // Refresh the list
      fetchWithdrawals(selectedTab === 'pending' ? 'pending' : undefined);
    } catch (error) {
      console.error('Error performing action:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to ${action} withdrawal`,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (lamports: string) => {
    return (Number(lamports) / 1e9).toFixed(4);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-300',
      approved: 'bg-blue-500/20 text-blue-300',
      processing: 'bg-purple-500/20 text-purple-300',
      completed: 'bg-green-500/20 text-green-300',
      failed: 'bg-red-500/20 text-red-300',
      rejected: 'bg-gray-500/20 text-gray-300',
    };
    return colors[status] || colors.pending;
  };

  if (!connected) {
    return (
      <div className="glass p-12 rounded-2xl max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-2xl font-bold text-white mb-2">Admin Access Required</h3>
        <p className="text-gray-300 mb-6">
          Please connect your wallet to access the admin dashboard
        </p>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300 text-sm">
            ⚠️ Admin access is restricted to authorized wallets only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold gradient-text font-display mb-2">
            🔧 Admin Dashboard
          </h2>
          <p className="text-gray-300">Manage withdrawal requests</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSelectedTab('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedTab === 'pending'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                : 'glass text-gray-300 hover:bg-white/10'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedTab === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                : 'glass text-gray-300 hover:bg-white/10'
            }`}
          >
            All Withdrawals
          </button>
        </div>
      </div>

      {loading && withdrawals.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="loading-spinner"></div>
          <span className="ml-4 text-gray-300">Loading withdrawals...</span>
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="glass p-12 rounded-2xl text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-bold text-white mb-2">No Withdrawals Found</h3>
          <p className="text-gray-300">No withdrawals match the current filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="glass p-6 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(withdrawal.status)}`}>
                      {withdrawal.status.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-sm">ID: {withdrawal.id}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Amount</p>
                      <p className="text-xl font-bold text-white">{formatAmount(withdrawal.amount_lamports)} SOL</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Recipient</p>
                      <p className="text-sm font-mono text-cyan-400 break-all">{withdrawal.to_address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Created</p>
                      <p className="text-sm text-gray-300">{new Date(withdrawal.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {withdrawal.failure_reason && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-3">
                      <p className="text-red-300 text-sm">❌ {withdrawal.failure_reason}</p>
                    </div>
                  )}
                  {withdrawal.processed_tx_sig && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-3">
                      <p className="text-green-300 text-sm">
                        ✅ Transaction: <span className="font-mono">{withdrawal.processed_tx_sig}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {withdrawal.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(withdrawal.id, 'approve')}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleAction(withdrawal.id, 'reject')}
                      className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
                {withdrawal.status === 'approved' && (
                  <button
                    onClick={() => handleAction(withdrawal.id, 'process')}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                  >
                    🚀 Process & Send SOL
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

