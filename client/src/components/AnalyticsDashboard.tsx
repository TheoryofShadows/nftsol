import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

interface Metrics {
  totals: {
    nfts: number;
    users: number;
    transactions: number;
  };
  last24Hours: {
    nfts: number;
    transactions: number;
    revenue: number;
  };
  last7Days: {
    nfts: number;
    transactions: number;
    revenue: number;
  };
  topCreators: Array<{
    creator: string;
    count: number;
  }>;
  transactionTypes: Array<{
    type: string;
    count: number;
  }>;
}

interface UserAnalytics {
  userTrends: Array<{
    date: string;
    count: number;
  }>;
  activeUsers: number;
  avgNFTsPerUser: number;
}

interface NFTAnalytics {
  nftTrends: Array<{
    date: string;
    count: number;
  }>;
  collectionStats: Array<{
    collection: string;
    count: number;
  }>;
  priceStats: {
    avg: number;
    min: number;
    max: number;
  };
}

interface TransactionAnalytics {
  volumeTrends: Array<{
    date: string;
    count: number;
    volume: number;
  }>;
  typeBreakdown: Array<{
    type: string;
    count: number;
    volume: number;
  }>;
  topTraders: Array<{
    wallet: string;
    count: number;
    volume: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [nftAnalytics, setNftAnalytics] = useState<NFTAnalytics | null>(null);
  const [transactionAnalytics, setTransactionAnalytics] = useState<TransactionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'nfts' | 'transactions'>('overview');

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch all analytics data in parallel
      const [metricsRes, usersRes, nftsRes, transactionsRes] = await Promise.all([
        fetch('/api/monitoring/metrics'),
        fetch('/api/monitoring/users/analytics'),
        fetch('/api/monitoring/nfts/analytics'),
        fetch('/api/monitoring/transactions/analytics')
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUserAnalytics(usersData.analytics);
      }

      if (nftsRes.ok) {
        const nftsData = await nftsRes.json();
        setNftAnalytics(nftsData.analytics);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactionAnalytics(transactionsData.analytics);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="error-message">
          <h3>❌ Error Loading Analytics</h3>
          <p>{error}</p>
          <button onClick={fetchAnalytics} className="retry-button">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>📊 Analytics Dashboard</h1>
        <div className="refresh-info">
          <span>🔄 Auto-refreshes every minute</span>
          <button onClick={fetchAnalytics} className="refresh-button">
            🔄 Refresh Now
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`tab ${activeTab === 'nfts' ? 'active' : ''}`}
          onClick={() => setActiveTab('nfts')}
        >
          🎨 NFTs
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          💰 Transactions
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && metrics && (
          <div className="overview-tab">
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>📊 Total NFTs</h3>
                <div className="metric-value">{formatNumber(metrics.totals.nfts)}</div>
                <div className="metric-change">
                  +{formatNumber(metrics.last24Hours.nfts)} in 24h
                </div>
              </div>
              
              <div className="metric-card">
                <h3>👥 Total Users</h3>
                <div className="metric-value">{formatNumber(metrics.totals.users)}</div>
                <div className="metric-change">
                  Active platform users
                </div>
              </div>
              
              <div className="metric-card">
                <h3>💸 Total Transactions</h3>
                <div className="metric-value">{formatNumber(metrics.totals.transactions)}</div>
                <div className="metric-change">
                  +{formatNumber(metrics.last24Hours.transactions)} in 24h
                </div>
              </div>
              
              <div className="metric-card">
                <h3>💰 24h Revenue</h3>
                <div className="metric-value">{formatCurrency(metrics.last24Hours.revenue)}</div>
                <div className="metric-change">
                  Platform earnings
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>🏆 Top Creators</h3>
                <div className="top-creators">
                  {metrics.topCreators.slice(0, 5).map((creator, index) => (
                    <div key={creator.creator} className="creator-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="wallet">{creator.creator.slice(0, 8)}...{creator.creator.slice(-4)}</span>
                      <span className="count">{creator.count} NFTs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>📈 Transaction Types</h3>
                <div className="transaction-types">
                  {metrics.transactionTypes.map((type) => (
                    <div key={type.type} className="type-item">
                      <span className="type">{type.type}</span>
                      <span className="count">{type.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && userAnalytics && (
          <div className="users-tab">
            <div className="users-metrics">
              <div className="metric-card">
                <h3>👥 Active Users (7d)</h3>
                <div className="metric-value">{formatNumber(userAnalytics.activeUsers)}</div>
              </div>
              
              <div className="metric-card">
                <h3>📊 Avg NFTs per User</h3>
                <div className="metric-value">{userAnalytics.avgNFTsPerUser.toFixed(1)}</div>
              </div>
            </div>

            <div className="chart-card">
              <h3>📈 User Registration Trends (30d)</h3>
              <div className="trend-chart">
                {userAnalytics.userTrends.map((trend) => (
                  <div key={trend.date} className="trend-item">
                    <span className="date">{new Date(trend.date).toLocaleDateString()}</span>
                    <div className="bar">
                      <div 
                        className="bar-fill" 
                        style={{ height: `${(trend.count / Math.max(...userAnalytics.userTrends.map(t => t.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="count">{trend.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nfts' && nftAnalytics && (
          <div className="nfts-tab">
            <div className="nft-metrics">
              <div className="metric-card">
                <h3>💰 Average Price</h3>
                <div className="metric-value">{formatCurrency(nftAnalytics.priceStats.avg)}</div>
              </div>
              
              <div className="metric-card">
                <h3>📊 Price Range</h3>
                <div className="metric-value">
                  {formatCurrency(nftAnalytics.priceStats.min)} - {formatCurrency(nftAnalytics.priceStats.max)}
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>📈 NFT Creation Trends (30d)</h3>
                <div className="trend-chart">
                  {nftAnalytics.nftTrends.map((trend) => (
                    <div key={trend.date} className="trend-item">
                      <span className="date">{new Date(trend.date).toLocaleDateString()}</span>
                      <div className="bar">
                        <div 
                          className="bar-fill" 
                          style={{ height: `${(trend.count / Math.max(...nftAnalytics.nftTrends.map(t => t.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="count">{trend.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>🏆 Top Collections</h3>
                <div className="top-collections">
                  {nftAnalytics.collectionStats.slice(0, 5).map((collection, index) => (
                    <div key={collection.collection} className="collection-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{collection.collection}</span>
                      <span className="count">{collection.count} NFTs</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && transactionAnalytics && (
          <div className="transactions-tab">
            <div className="transaction-metrics">
              <div className="metric-card">
                <h3>💸 Total Volume (30d)</h3>
                <div className="metric-value">
                  {formatCurrency(transactionAnalytics.volumeTrends.reduce((sum, trend) => sum + trend.volume, 0))}
                </div>
              </div>
              
              <div className="metric-card">
                <h3>📊 Transaction Types</h3>
                <div className="type-breakdown">
                  {transactionAnalytics.typeBreakdown.map((type) => (
                    <div key={type.type} className="type-item">
                      <span className="type">{type.type}</span>
                      <span className="count">{type.count}</span>
                      <span className="volume">{formatCurrency(type.volume)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h3>📈 Volume Trends (30d)</h3>
              <div className="trend-chart">
                {transactionAnalytics.volumeTrends.map((trend) => (
                  <div key={trend.date} className="trend-item">
                    <span className="date">{new Date(trend.date).toLocaleDateString()}</span>
                    <div className="bar">
                      <div 
                        className="bar-fill" 
                        style={{ height: `${(trend.volume / Math.max(...transactionAnalytics.volumeTrends.map(t => t.volume))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="volume">{formatCurrency(trend.volume)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <h3>🏆 Top Traders (30d)</h3>
              <div className="top-traders">
                {transactionAnalytics.topTraders.slice(0, 5).map((trader, index) => (
                  <div key={trader.wallet} className="trader-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="wallet">{trader.wallet.slice(0, 8)}...{trader.wallet.slice(-4)}</span>
                    <span className="volume">{formatCurrency(trader.volume)}</span>
                    <span className="count">{trader.count} txns</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
