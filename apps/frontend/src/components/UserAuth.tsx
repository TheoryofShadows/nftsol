import React, { useState, useEffect } from 'react';
import { useWallet } from '../wallet/UniversalWalletAdapter';
import './UserAuth.css';

interface UserProfile {
  walletAddress: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  socialLinks: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  preferences: {
    notifications: boolean;
    privacy: 'public' | 'private' | 'friends';
    theme: 'light' | 'dark' | 'auto';
  };
  stats: {
    totalNfts: number;
    totalSales: number;
    totalPurchases: number;
    cloutEarned: number;
    trustScore: number;
    joinDate: string;
  };
  badges: string[];
  followers: string[];
  following: string[];
}

interface UserAuthProps {
  onUserLogin: (user: UserProfile) => void;
  onUserLogout: () => void;
}

export default function UserAuth({ onUserLogin, onUserLogout }: UserAuthProps) {
  const { connected, publicKey, connect, disconnect } = useWallet();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatar: '',
    socialLinks: {
      twitter: '',
      discord: '',
      website: ''
    }
  });

  useEffect(() => {
    if (connected && publicKey) {
      loadUserProfile();
    } else {
      setUser(null);
    }
  }, [connected, publicKey]);

  const loadUserProfile = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/profile/${publicKey.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        onUserLogin(data.user);
      } else {
        // User doesn't exist, show profile creation form
        setShowProfileForm(true);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setShowProfileForm(true);
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          ...profileData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setShowProfileForm(false);
        onUserLogin(data.user);
      } else {
        console.error('Failed to create user profile:', data.error);
      }
    } catch (error) {
      console.error('Failed to create user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await disconnect();
      setUser(null);
      onUserLogout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleConnect = async () => {
    try {
      // Try to connect to the first available wallet
      if (connected && publicKey) {
        return; // Already connected
      }
      
      // For now, we'll use a default wallet name
      // In a real implementation, you'd show a wallet selection UI
      const defaultWallet = 'phantom'; // or get from user selection
      await connect(defaultWallet);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (!connected) {
    return (
      <div className="user-auth">
        <div className="auth-card">
          <h3>Welcome to NFTSol</h3>
          <p>Connect your wallet to get started</p>
          <button 
            className="connect-button"
            onClick={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  if (showProfileForm) {
    return (
      <div className="user-auth">
        <div className="profile-form">
          <h3>Create Your Profile</h3>
          <p>Set up your NFTSol profile to get started</p>
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={profileData.username}
              onChange={(e) => setProfileData({...profileData, username: e.target.value})}
              placeholder="Choose a unique username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              value={profileData.displayName}
              onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
              placeholder="Your display name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="avatar">Avatar URL</label>
            <input
              type="url"
              id="avatar"
              value={profileData.avatar}
              onChange={(e) => setProfileData({...profileData, avatar: e.target.value})}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="social-links">
            <h4>Social Links</h4>
            <div className="form-group">
              <label htmlFor="twitter">Twitter</label>
              <input
                type="text"
                id="twitter"
                value={profileData.socialLinks.twitter}
                onChange={(e) => setProfileData({
                  ...profileData, 
                  socialLinks: {...profileData.socialLinks, twitter: e.target.value}
                })}
                placeholder="@username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="discord">Discord</label>
              <input
                type="text"
                id="discord"
                value={profileData.socialLinks.discord}
                onChange={(e) => setProfileData({
                  ...profileData, 
                  socialLinks: {...profileData.socialLinks, discord: e.target.value}
                })}
                placeholder="Discord username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                value={profileData.socialLinks.website}
                onChange={(e) => setProfileData({
                  ...profileData, 
                  socialLinks: {...profileData.socialLinks, website: e.target.value}
                })}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="create-profile-button"
              onClick={createUserProfile}
              disabled={isLoading || !profileData.username || !profileData.displayName}
            >
              {isLoading ? 'Creating...' : 'Create Profile'}
            </button>
            <button 
              className="skip-button"
              onClick={() => setShowProfileForm(false)}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="user-auth">
        <div className="user-profile">
          <div className="profile-header">
            <div className="avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.displayName} />
              ) : (
                <div className="avatar-placeholder">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h3>{user.displayName}</h3>
              <p>@{user.username}</p>
              <div className="stats">
                <span>Trust Score: {user.stats.trustScore}</span>
                <span>CLOUT: {user.stats.cloutEarned}</span>
              </div>
            </div>
          </div>
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-auth">
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    </div>
  );
}
