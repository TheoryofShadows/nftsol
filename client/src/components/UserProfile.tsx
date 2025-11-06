import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from './NotificationSystem';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface UserPreferences {
  displayName: string;
  bio: string;
  favoriteCategories: string[];
  theme: 'dark' | 'light' | 'auto';
  notifications: {
    sales: boolean;
    purchases: boolean;
    rewards: boolean;
  };
  privacy: {
    showProfile: boolean;
    showStats: boolean;
  };
}

export default function UserProfile() {
  const { connected, publicKey } = useWallet();
  const { addNotification } = useNotification();
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>('user-preferences', {
    displayName: '',
    bio: '',
    favoriteCategories: [],
    theme: 'dark',
    notifications: {
      sales: true,
      purchases: true,
      rewards: true,
    },
    privacy: {
      showProfile: true,
      showStats: true,
    },
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate display name from wallet if not set
  const displayName = preferences.displayName || 
    (publicKey ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}` : 'Guest');

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save preferences to localStorage (client-side only - non-custodial)
      setPreferences(preferences);
      setIsEditing(false);
      addNotification({
        type: 'success',
        title: '✅ Preferences Saved',
        message: 'Your preferences have been saved locally',
        duration: 3000,
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save preferences',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-bold gradient-text-primary mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-300 mb-6">
          Connect your wallet to access your profile and preferences
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold gradient-text font-display mb-2">
            My Profile
          </h1>
          <p className="text-gray-300">
            Manage your preferences and personalize your experience
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary-modern"
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Display Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={preferences.displayName}
                  onChange={(e) => setPreferences({ ...preferences, displayName: e.target.value })}
                  placeholder="Enter your display name"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                />
              ) : (
                <div className="text-white text-lg">{displayName}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={preferences.bio}
                  onChange={(e) => setPreferences({ ...preferences, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none resize-none"
                />
              ) : (
                <div className="text-gray-300">
                  {preferences.bio || 'No bio yet. Add one to personalize your profile!'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Wallet Address
              </label>
              <div className="text-cyan-400 font-mono text-sm break-all">
                {publicKey?.toBase58()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                🔒 Your wallet is fully non-custodial - you control your keys
              </p>
            </div>
          </div>
        </div>

        {/* Preferences Sidebar */}
        <div className="space-y-6">
          {/* Theme */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Theme</h3>
            <label htmlFor="theme-select" className="sr-only">
              Theme selector
            </label>
            <select
              id="theme-select"
              aria-label="Theme selector"
              title="Theme selector"
              value={preferences.theme}
              onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as any })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Notifications</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300">Sales</span>
                <input
                  type="checkbox"
                  checked={preferences.notifications.sales}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, sales: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300">Purchases</span>
                <input
                  type="checkbox"
                  checked={preferences.notifications.purchases}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, purchases: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300">Rewards</span>
                <input
                  type="checkbox"
                  checked={preferences.notifications.rewards}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, rewards: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>
          </div>

          {/* Privacy */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Privacy</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300">Show Profile</span>
                <input
                  type="checkbox"
                  checked={preferences.privacy.showProfile}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    privacy: { ...preferences.privacy, showProfile: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-300">Show Stats</span>
                <input
                  type="checkbox"
                  checked={preferences.privacy.showStats}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    privacy: { ...preferences.privacy, showStats: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setIsEditing(false)}
            className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      )}

      {/* Non-Custodial Notice */}
      <div className="glass-card p-6 bg-green-500/10 border border-green-500/30">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🔒</div>
          <div>
            <h3 className="text-lg font-bold text-green-400 mb-2">Non-Custodial Platform</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your funds and NFTs are stored in your own wallet. We never hold your private keys or funds. 
              All transactions are signed directly by your wallet. You maintain full control at all times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

