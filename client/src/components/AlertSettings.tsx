/**
 * Alert Settings Component
 * Configure push notification alerts for NFT events
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { API_BASE } from '../config/api';

interface AlertType {
  type: string;
  name: string;
  description: string;
}

interface AlertSubscription {
  id: string;
  wallet: string;
  alertType: string;
  collection?: string;
  targetPrice?: number;
  threshold?: number;
  isActive: boolean;
  createdAt: number;
}

interface AlertSettingsProps {
  collectionSlug?: string;
  onClose?: () => void;
  compact?: boolean;
}

export const AlertSettings: React.FC<AlertSettingsProps> = ({
  collectionSlug,
  onClose,
  compact = false,
}) => {
  const { publicKey, connected } = useWallet();
  const [alertTypes, setAlertTypes] = useState<AlertType[]>([]);
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New alert form state
  const [selectedType, setSelectedType] = useState<string>('floor_drop');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [threshold, setThreshold] = useState<string>('10');
  const [collection, setCollection] = useState<string>(collectionSlug || '');

  const fetchAlertTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/alerts/types`);
      const data = await response.json();
      if (data.success && data.data) {
        setAlertTypes(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch alert types:', err);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/alerts/subscriptions/${publicKey.toBase58()}`);
      const data = await response.json();
      if (data.success && data.data) {
        setSubscriptions(data.data);
      }
    } catch {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchAlertTypes();
    if (connected && publicKey) {
      fetchSubscriptions();
    } else {
      setLoading(false);
    }
  }, [fetchAlertTypes, fetchSubscriptions, connected, publicKey]);

  const handleSubscribe = async () => {
    if (!publicKey) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/alerts/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          alertType: selectedType,
          collection: collection || undefined,
          targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
          threshold: threshold ? parseFloat(threshold) : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchSubscriptions();
        // Reset form
        setTargetPrice('');
        setThreshold('10');
      } else {
        setError(data.error || 'Failed to create alert');
      }
    } catch {
      setError('Network error - please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async (subscriptionId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/alerts/unsubscribe/${subscriptionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSubscriptions((prev) => prev.filter((s) => s.id !== subscriptionId));
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'floor_drop':
        return (
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'floor_pump':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'whale_buy':
      case 'whale_sell':
        return (
          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case 'outbid':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  if (!connected) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 text-center">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <p className="text-gray-400 mb-2">Connect your wallet to set up alerts</p>
        <p className="text-xs text-gray-500">Get notified about floor drops, whale moves, and more</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="font-semibold text-white">Price Alerts</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Create Alert Form */}
      <div className="p-4 border-b border-gray-700/50">
        <h4 className="text-sm font-medium text-white mb-3">Create New Alert</h4>

        <div className="space-y-3">
          {/* Alert Type */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Alert Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            >
              {alertTypes.map((type) => (
                <option key={type.type} value={type.type}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Collection (optional) */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Collection (optional)</label>
            <input
              type="text"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              placeholder="e.g., mad-lads, tensorians"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Target Price or Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Target Price (SOL)</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g., 5.0"
                step="0.1"
                min="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Threshold (%)</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g., 10"
                step="1"
                min="1"
                max="100"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={saving}
            className="w-full py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Alert
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className={`${compact ? 'max-h-[200px]' : 'max-h-[300px]'} overflow-y-auto`}>
        <div className="px-4 py-2 bg-gray-800/30 text-xs font-medium text-gray-400 sticky top-0">
          Active Alerts ({subscriptions.length})
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 py-2">
                <div className="w-8 h-8 bg-gray-700/50 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-700/50 rounded"></div>
              </div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <p className="text-sm">No active alerts</p>
            <p className="text-xs mt-1">Create your first alert above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  {getAlertIcon(sub.alertType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {alertTypes.find((t) => t.type === sub.alertType)?.name || sub.alertType}
                  </div>
                  <div className="text-xs text-gray-500">
                    {sub.collection || 'All collections'}
                    {sub.targetPrice && ` | Target: ${sub.targetPrice} SOL`}
                    {sub.threshold && ` | ${sub.threshold}%`}
                  </div>
                </div>
                <button
                  onClick={() => handleUnsubscribe(sub.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors p-1"
                  title="Delete alert"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/20 text-xs text-gray-500 text-center">
        Powered by Push Protocol
      </div>
    </div>
  );
};

export default AlertSettings;
