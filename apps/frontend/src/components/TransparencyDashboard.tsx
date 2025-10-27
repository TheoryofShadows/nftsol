import React, { useState, useEffect } from 'react';
import './TransparencyDashboard.css';

interface FeeStats {
  totalCollected: number;
  totalTransactions: number;
  byType: Record<string, number>;
  byToken: Record<string, number>;
  dailyVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
  treasuryBalance: number;
  lastUpdated: number;
}

interface UsageStats {
  totalRequests: number;
  uniqueUsers: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
  hourlyStats: Array<{ hour: string; requests: number; errors: number }>;
  dailyStats: Array<{ date: string; requests: number; errors: number }>;
  statusCodeDistribution: Record<number, number>;
  userAgents: Array<{ userAgent: string; count: number }>;
  lastUpdated: number;
}

interface ContractInfo {
  cloutToken: {
    mint: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    solscanUrl: string;
    verified: boolean;
  };
  treasury: {
    address: string;
    name: string;
    purpose: string;
    solscanUrl: string;
    verified: boolean;
  };
  feeCollector: {
    address: string;
    name: string;
    purpose: string;
    solscanUrl: string;
    verified: boolean;
  };
  developer: {
    address: string;
    name: string;
    purpose: string;
    solscanUrl: string;
    verified: boolean;
  };
  stakingProgram: {
    address: string;
    name: string;
    purpose: string;
    solscanUrl: string;
    verified: boolean;
    network: string;
  };
}

export default function TransparencyDashboard() {
  const [feeStats, setFeeStats] = useState<FeeStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [treasuryBalance, setTreasuryBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'usage' | 'contracts'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchTransparencyData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchTransparencyData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchTransparencyData = async () => {
    try {
      setError(null);
      const [feeRes, usageRes, contractRes, treasuryRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE}/api/transparency/fees/stats`),
        fetch(`${import.meta.env.VITE_API_BASE}/api/transparency/usage/stats`),
        fetch(`${import.meta.env.VITE_API_BASE}/api/transparency/contracts/info`),
        fetch(`${import.meta.env.VITE_API_BASE}/api/transparency/treasury/balance`)
      ]);

      if (feeRes.ok) {
        const feeData = await feeRes.json();
        setFeeStats(feeData.data);
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsageStats(usageData.data);
      }

      if (contractRes.ok) {
        const contractData = await contractRes.json();
        setContractInfo(contractData.data);
      }

      if (treasuryRes.ok) {
        const treasuryData = await treasuryRes.json();
        setTreasuryBalance(treasuryData.data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch transparency data:', error);
      setError('Failed to load transparency data');
    } finally {
      setLoading(false);
    }
  };

  const simulateFeeCollection = async (type: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/transparency/fees/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        await fetchTransparencyData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to simulate fee collection:', error);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="transparency-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading transparency data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transparency-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🔍 Platform Transparency</h1>
          <p>Real-time fee collection, usage statistics, and smart contract information</p>
        </div>
        <div className="header-controls">
          <button 
            className={`refresh-button ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
          </button>
          <button onClick={fetchTransparencyData} className="refresh-button">
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={fetchTransparencyData} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="transparency-tabs">
        <button 
          className={`transparency-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`transparency-tab ${activeTab === 'fees' ? 'active' : ''}`}
          onClick={() => setActiveTab('fees')}
        >
          💰 Fees
        </button>
        <button 
          className={`transparency-tab ${activeTab === 'usage' ? 'active' : ''}`}
          onClick={() => setActiveTab('usage')}
        >
          📈 Usage
        </button>
        <button 
          className={`transparency-tab ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          🔗 Contracts
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="stats-grid">
            {/* Treasury Balance */}
            <div className="stat-card primary">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>Treasury Balance</h3>
                <div className="stat-value">
                  {treasuryBalance ? `${formatNumber(treasuryBalance)} SOL` : 'Loading...'}
                </div>
                <div className="stat-label">Total collected fees</div>
              </div>
            </div>

            {/* Total Fees Collected */}
            {feeStats && (
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Total Fees Collected</h3>
                  <div className="stat-value">
                    {formatNumber(feeStats.totalCollected)} SOL
                  </div>
                  <div className="stat-label">All time</div>
                </div>
              </div>
            )}

            {/* Total Transactions */}
            {feeStats && (
              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <h3>Total Transactions</h3>
                  <div className="stat-value">
                    {feeStats.totalTransactions.toLocaleString()}
                  </div>
                  <div className="stat-label">Fee-generating transactions</div>
                </div>
              </div>
            )}

            {/* Daily Volume */}
            {feeStats && (
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>Daily Volume</h3>
                  <div className="stat-value">
                    {formatNumber(feeStats.dailyVolume)} SOL
                  </div>
                  <div className="stat-label">Last 24 hours</div>
                </div>
              </div>
            )}

            {/* Active Users */}
            {usageStats && (
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>Active Users</h3>
                  <div className="stat-value">
                    {usageStats.uniqueUsers.toLocaleString()}
                  </div>
                  <div className="stat-label">Last 24 hours</div>
                </div>
              </div>
            )}

            {/* Response Time */}
            {usageStats && (
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <h3>Response Time</h3>
                  <div className="stat-value">
                    {usageStats.averageResponseTime.toFixed(0)}ms
                  </div>
                  <div className="stat-label">Average API response</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>🎮 Demo Actions</h3>
            <div className="action-buttons">
              <button 
                onClick={() => simulateFeeCollection('mint')}
                className="action-button"
              >
                🎨 Simulate Mint Fee
              </button>
              <button 
                onClick={() => simulateFeeCollection('trade')}
                className="action-button"
              >
                💱 Simulate Trade Fee
              </button>
              <button 
                onClick={() => simulateFeeCollection('staking')}
                className="action-button"
              >
                🔒 Simulate Staking Fee
              </button>
              <button 
                onClick={() => simulateFeeCollection('governance')}
                className="action-button"
              >
                🗳️ Simulate Governance Fee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === 'fees' && feeStats && (
        <div className="tab-content">
          <div className="fee-breakdown">
            <h3>💸 Fee Breakdown by Type</h3>
            <div className="breakdown-grid">
              {Object.entries(feeStats.byType).map(([type, amount]) => (
                <div key={type} className="breakdown-item">
                  <div className="breakdown-type">
                    {type === 'mint' && '🎨'}
                    {type === 'trade' && '💱'}
                    {type === 'staking' && '🔒'}
                    {type === 'governance' && '🗳️'}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                  <div className="breakdown-amount">{formatNumber(amount)} SOL</div>
                </div>
              ))}
            </div>
          </div>

          <div className="volume-stats">
            <h3>📊 Volume Statistics</h3>
            <div className="volume-grid">
              <div className="volume-item">
                <div className="volume-label">Daily Volume</div>
                <div className="volume-value">{formatNumber(feeStats.dailyVolume)} SOL</div>
              </div>
              <div className="volume-item">
                <div className="volume-label">Weekly Volume</div>
                <div className="volume-value">{formatNumber(feeStats.weeklyVolume)} SOL</div>
              </div>
              <div className="volume-item">
                <div className="volume-label">Monthly Volume</div>
                <div className="volume-value">{formatNumber(feeStats.monthlyVolume)} SOL</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && usageStats && (
        <div className="tab-content">
          <div className="usage-stats">
            <h3>📈 Platform Usage Statistics</h3>
            <div className="usage-grid">
              <div className="usage-item">
                <div className="usage-label">Total Requests</div>
                <div className="usage-value">{usageStats.totalRequests.toLocaleString()}</div>
              </div>
              <div className="usage-item">
                <div className="usage-label">Unique Users</div>
                <div className="usage-value">{usageStats.uniqueUsers.toLocaleString()}</div>
              </div>
              <div className="usage-item">
                <div className="usage-label">Average Response Time</div>
                <div className="usage-value">{usageStats.averageResponseTime.toFixed(0)}ms</div>
              </div>
              <div className="usage-item">
                <div className="usage-label">Error Rate</div>
                <div className="usage-value">{(usageStats.errorRate * 100).toFixed(2)}%</div>
              </div>
            </div>
          </div>

          <div className="endpoints-section">
            <h3>🔥 Most Used Endpoints</h3>
            <div className="endpoints-list">
              {usageStats.topEndpoints.map((endpoint, index) => (
                <div key={index} className="endpoint-item">
                  <div className="endpoint-info">
                    <span className="endpoint-path">{endpoint.endpoint}</span>
                    <span className="endpoint-count">{endpoint.count} requests</span>
                  </div>
                  <div className="endpoint-response-time">
                    {endpoint.avgResponseTime.toFixed(0)}ms avg
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && contractInfo && (
        <div className="tab-content">
          <div className="contracts-grid">
            <div className="contract-card">
              <div className="contract-header">
                <h3>🪙 CLOUT Token</h3>
                <span className="verified-badge">✅ Verified</span>
              </div>
              <div className="contract-details">
                <div className="contract-detail">
                  <span className="detail-label">Mint Address:</span>
                  <span className="detail-value">{contractInfo.cloutToken.mint}</span>
                </div>
                <div className="contract-detail">
                  <span className="detail-label">Total Supply:</span>
                  <span className="detail-value">{contractInfo.cloutToken.totalSupply}</span>
                </div>
                <div className="contract-detail">
                  <span className="detail-label">Decimals:</span>
                  <span className="detail-value">{contractInfo.cloutToken.decimals}</span>
                </div>
              </div>
              <a 
                href={contractInfo.cloutToken.solscanUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="solscan-link"
              >
                🔗 View on Solscan
              </a>
            </div>

            <div className="contract-card">
              <div className="contract-header">
                <h3>🏦 Treasury</h3>
                <span className="verified-badge">✅ Verified</span>
              </div>
              <div className="contract-details">
                <div className="contract-detail">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{contractInfo.treasury.address}</span>
                </div>
                <div className="contract-detail">
                  <span className="detail-label">Purpose:</span>
                  <span className="detail-value">{contractInfo.treasury.purpose}</span>
                </div>
                <div className="contract-detail">
                  <span className="detail-label">Balance:</span>
                  <span className="detail-value">{treasuryBalance ? `${formatNumber(treasuryBalance)} SOL` : 'Loading...'}</span>
                </div>
              </div>
              <a 
                href={contractInfo.treasury.solscanUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="solscan-link"
              >
                🔗 View on Solscan
              </a>
            </div>

            <div className="contract-card">
              <div className="contract-header">
                <h3>💸 Fee Collector</h3>
                <span className="verified-badge">✅ Verified</span>
              </div>
              <div className="contract-details">
                <div className="contract-detail">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{contractInfo.feeCollector.address}</span>
                </div>
                <div className="contract-detail">
                  <span className="detail-label">Purpose:</span>
                  <span className="detail-value">{contractInfo.feeCollector.purpose}</span>
                </div>
              </div>
              <a 
                href={contractInfo.feeCollector.solscanUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="solscan-link"
              >
                🔗 View on Solscan
              </a>
            </div>

            <div className="contract-card">
              <div className="contract-header">
                <h3>🔒 Staking Program</h3>
                <span className="verified-badge">✅ Verified</span>
              </div>
              <div className="contract-details">
                <div className="contract-detail">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{contractInfo.stakingProgram.address}</span>
                </div>
                <div className="contract-detail">
                  <span className="detail-label">Network:</span>
                  <span className="detail-value">{contractInfo.stakingProgram.network}</span>
                </div>
                <div className="contract-detail">
                  <span className="detail-label">Purpose:</span>
                  <span className="detail-value">{contractInfo.stakingProgram.purpose}</span>
                </div>
              </div>
              <a 
                href={contractInfo.stakingProgram.solscanUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="solscan-link"
              >
                🔗 View on Solscan
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="transparency-footer">
        <p>🔄 Data updates every 30 seconds • Last updated: {feeStats ? formatTime(feeStats.lastUpdated) : 'Never'}</p>
        <p>🔗 All smart contracts are verified and publicly auditable on Solscan</p>
      </div>
    </div>
  );
}
