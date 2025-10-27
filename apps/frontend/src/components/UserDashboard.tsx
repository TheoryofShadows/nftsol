import React, { useState, useEffect } from 'react';
import { useWallet } from '../wallet/UniversalWalletAdapter';
import './UserDashboard.css';

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

interface UserActivity {
  id: string;
  type: 'mint' | 'sale' | 'purchase' | 'clout_earned' | 'trust_boost';
  description: string;
  timestamp: string;
  nftMint?: string;
  amount?: number;
  cloutAmount?: number;
}

interface UserDashboardProps {
  user: UserProfile;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'nfts' | 'clout' | 'reputation'>('overview');
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserActivity();
    }
  }, [user]);

  const loadUserActivity = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/activity/${publicKey.toString()}`);
      const data = await response.json();

      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to load user activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mint': return '🎨';
      case 'sale': return '💰';
      case 'purchase': return '🛒';
      case 'clout_earned': return '⭐';
      case 'trust_boost': return '📈';
      default: return '📝';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTrustLevel = (score: number) => {
    if (score >= 100) return { level: 'Legendary', color: '#ffd700' };
    if (score >= 80) return { level: 'Elite', color: '#ff6b6b' };
    if (score >= 60) return { level: 'Expert', color: '#4ecdc4' };
    if (score >= 40) return { level: 'Trusted', color: '#45b7d1' };
    if (score >= 20) return { level: 'Rising', color: '#96ceb4' };
    return { level: 'Newcomer', color: '#a0a0a0' };
  };

  const trustLevel = getTrustLevel(user.stats.trustScore);

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div className="profile-summary">
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
            <h2>{user.displayName}</h2>
            <p>@{user.username}</p>
            <div className="trust-level" style={{ color: trustLevel.color }}>
              {trustLevel.level} ({user.stats.trustScore} points)
            </div>
          </div>
        </div>
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-value">{user.stats.totalNfts}</div>
            <div className="stat-label">NFTs Created</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user.stats.cloutEarned}</div>
            <div className="stat-label">CLOUT Earned</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user.stats.totalSales}</div>
            <div className="stat-label">Sales</div>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📝 Activity
        </button>
        <button 
          className={`tab ${activeTab === 'nfts' ? 'active' : ''}`}
          onClick={() => setActiveTab('nfts')}
        >
          🎨 My NFTs
        </button>
        <button 
          className={`tab ${activeTab === 'clout' ? 'active' : ''}`}
          onClick={() => setActiveTab('clout')}
        >
          ⭐ CLOUT
        </button>
        <button 
          className={`tab ${activeTab === 'reputation' ? 'active' : ''}`}
          onClick={() => setActiveTab('reputation')}
        >
          🏆 Reputation
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Portfolio Summary</h3>
                <div className="portfolio-stats">
                  <div className="portfolio-stat">
                    <span className="label">Total NFTs:</span>
                    <span className="value">{user.stats.totalNfts}</span>
                  </div>
                  <div className="portfolio-stat">
                    <span className="label">Total Sales:</span>
                    <span className="value">{user.stats.totalSales}</span>
                  </div>
                  <div className="portfolio-stat">
                    <span className="label">Total Purchases:</span>
                    <span className="value">{user.stats.totalPurchases}</span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h3>CLOUT Rewards</h3>
                <div className="clout-summary">
                  <div className="clout-balance">
                    <span className="balance">{user.stats.cloutEarned}</span>
                    <span className="currency">CLOUT</span>
                  </div>
                  <div className="clout-benefits">
                    <div className="benefit">Fee Reduction: 50%</div>
                    <div className="benefit">Premium Features: ✅</div>
                    <div className="benefit">Governance Rights: ✅</div>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h3>Trust & Reputation</h3>
                <div className="trust-summary">
                  <div className="trust-score">
                    <span className="score">{user.stats.trustScore}</span>
                    <span className="level" style={{ color: trustLevel.color }}>
                      {trustLevel.level}
                    </span>
                  </div>
                  <div className="trust-badges">
                    {user.badges.map((badge, index) => (
                      <span key={index} className="badge">{badge}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-tab">
            <h3>Recent Activity</h3>
            {isLoading ? (
              <div className="loading">Loading activities...</div>
            ) : activities.length > 0 ? (
              <div className="activity-list">
                {activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-description">
                        {activity.description}
                      </div>
                      <div className="activity-meta">
                        <span className="activity-time">
                          {formatDate(activity.timestamp)}
                        </span>
                        {activity.cloutAmount && (
                          <span className="clout-amount">
                            +{activity.cloutAmount} CLOUT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No activity yet. Start by creating your first NFT!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nfts' && (
          <div className="nfts-tab">
            <h3>My NFTs</h3>
            <div className="nfts-grid">
              {user.stats.totalNfts > 0 ? (
                <div className="nft-placeholder">
                  <p>Your NFTs will appear here</p>
                </div>
              ) : (
                <div className="empty-state">
                  <p>You haven't created any NFTs yet.</p>
                  <button className="create-nft-button">
                    Create Your First NFT
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'clout' && (
          <div className="clout-tab">
            <h3>CLOUT Token</h3>
            <div className="clout-details">
              <div className="clout-balance-card">
                <div className="balance-header">
                  <h4>Your CLOUT Balance</h4>
                  <div className="balance-amount">
                    {user.stats.cloutEarned} CLOUT
                  </div>
                </div>
                <div className="balance-breakdown">
                  <div className="breakdown-item">
                    <span>Earned from NFTs:</span>
                    <span>{user.stats.cloutEarned}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Staking Rewards:</span>
                    <span>0</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Governance Rewards:</span>
                    <span>0</span>
                  </div>
                </div>
              </div>

              <div className="clout-benefits-card">
                <h4>CLOUT Benefits</h4>
                <div className="benefits-list">
                  <div className="benefit-item">
                    <span className="benefit-icon">💰</span>
                    <div className="benefit-content">
                      <div className="benefit-title">Fee Reduction</div>
                      <div className="benefit-description">Up to 50% off platform fees</div>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">⭐</span>
                    <div className="benefit-content">
                      <div className="benefit-title">Premium Features</div>
                      <div className="benefit-description">Access to exclusive features</div>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">🗳️</span>
                    <div className="benefit-content">
                      <div className="benefit-title">Governance Rights</div>
                      <div className="benefit-description">Vote on platform decisions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reputation' && (
          <div className="reputation-tab">
            <h3>Trust & Reputation</h3>
            <div className="reputation-details">
              <div className="reputation-card">
                <div className="reputation-header">
                  <h4>Your Trust Score</h4>
                  <div className="trust-display">
                    <span className="trust-number">{user.stats.trustScore}</span>
                    <span className="trust-level" style={{ color: trustLevel.color }}>
                      {trustLevel.level}
                    </span>
                  </div>
                </div>
                <div className="trust-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min(user.stats.trustScore, 100)}%`,
                        backgroundColor: trustLevel.color
                      }}
                    ></div>
                  </div>
                  <div className="progress-labels">
                    <span>0</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              <div className="badges-card">
                <h4>Badges & Achievements</h4>
                <div className="badges-grid">
                  {user.badges.length > 0 ? (
                    user.badges.map((badge, index) => (
                      <div key={index} className="badge-item">
                        <span className="badge-icon">🏆</span>
                        <span className="badge-name">{badge}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-badges">
                      <p>No badges yet. Start earning by creating NFTs and building trust!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
