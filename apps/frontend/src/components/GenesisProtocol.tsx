/**
 * 🌟 Genesis Protocol Component
 * Fair launch management for compressed NFT drops
 */

import React, { useState, useEffect } from 'react';
import './GenesisProtocol.css';

interface GenesisLaunch {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  maxSupply: number;
  totalMinted: number;
  pricePerNFT: number;
  totalRevenue: number;
  launchDate: string;
  whitelistRequired: boolean;
  whitelistSize: number;
  createdAt: string;
  updatedAt: string;
}

interface GenesisTier {
  name: string;
  maxMints: number;
  priceMultiplier: number;
  whitelistSlots: number;
  earlyAccessMinutes: number;
}

const GenesisProtocol: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'launches' | 'create' | 'whitelist' | 'stats'>('launches');
  const [launches, setLaunches] = useState<GenesisLaunch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create launch form state
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    maxSupply: 1000,
    pricePerNFT: 0.01,
    launchDate: '',
    endDate: '',
    whitelistRequired: false,
    maxMintsPerWallet: 1,
    maxMintsPerTransaction: 1,
    antiBotProtection: true,
    tieredAccess: false,
    tiers: [] as GenesisTier[]
  });

  // Whitelist state
  const [whitelistForm, setWhitelistForm] = useState({
    launchId: '',
    walletAddress: '',
    tier: 'default',
    maxMints: 1
  });

  const [selectedLaunch, setSelectedLaunch] = useState<GenesisLaunch | null>(null);

  useEffect(() => {
    loadLaunches();
  }, []);

  const loadLaunches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/genesis/launches');
      const data = await response.json();
      
      if (data.success) {
        setLaunches(data.data);
      } else {
        setError(data.error || 'Failed to load launches');
      }
    } catch (err) {
      setError('Network error loading launches');
    } finally {
      setLoading(false);
    }
  };

  const createLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/genesis/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();
      
      if (data.success) {
        setCreateForm({
          name: '',
          description: '',
          maxSupply: 1000,
          pricePerNFT: 0.01,
          launchDate: '',
          endDate: '',
          whitelistRequired: false,
          maxMintsPerWallet: 1,
          maxMintsPerTransaction: 1,
          antiBotProtection: true,
          tieredAccess: false,
          tiers: []
        });
        await loadLaunches();
        setActiveTab('launches');
        alert('Launch created successfully!');
      } else {
        setError(data.error || 'Failed to create launch');
      }
    } catch (err) {
      setError('Network error creating launch');
    } finally {
      setLoading(false);
    }
  };

  const activateLaunch = async (launchId: string) => {
    try {
      const response = await fetch(`/api/genesis/launch/${launchId}/activate`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        await loadLaunches();
        alert('Launch activated successfully!');
      } else {
        setError(data.error || 'Failed to activate launch');
      }
    } catch (err) {
      setError('Network error activating launch');
    }
  };

  const pauseLaunch = async (launchId: string) => {
    try {
      const response = await fetch(`/api/genesis/launch/${launchId}/pause`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        await loadLaunches();
        alert('Launch paused successfully!');
      } else {
        setError(data.error || 'Failed to pause launch');
      }
    } catch (err) {
      setError('Network error pausing launch');
    }
  };

  const addToWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/genesis/launch/${whitelistForm.launchId}/whitelist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: whitelistForm.walletAddress,
          tier: whitelistForm.tier,
          maxMints: whitelistForm.maxMints
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setWhitelistForm({
          launchId: '',
          walletAddress: '',
          tier: 'default',
          maxMints: 1
        });
        alert('Wallet added to whitelist successfully!');
      } else {
        setError(data.error || 'Failed to add to whitelist');
      }
    } catch (err) {
      setError('Network error adding to whitelist');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'scheduled': return '#3B82F6';
      case 'paused': return '#F59E0B';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSOL = (amount: number) => {
    return `${amount.toFixed(4)} SOL`;
  };

  return (
    <div className="genesis-protocol">
      <div className="genesis-header">
        <h1>🌟 Genesis Protocol</h1>
        <p>Fair launch mechanisms for compressed NFT drops</p>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="genesis-tabs">
        <button
          className={activeTab === 'launches' ? 'active' : ''}
          onClick={() => setActiveTab('launches')}
        >
          📋 Launches
        </button>
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          ➕ Create Launch
        </button>
        <button
          className={activeTab === 'whitelist' ? 'active' : ''}
          onClick={() => setActiveTab('whitelist')}
        >
          👥 Whitelist
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
      </div>

      <div className="genesis-content">
        {activeTab === 'launches' && (
          <div className="launches-tab">
            <div className="launches-header">
              <h2>Launch Management</h2>
              <button onClick={loadLaunches} disabled={loading}>
                {loading ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
            </div>

            <div className="launches-grid">
              {launches.map((launch) => (
                <div key={launch.id} className="launch-card">
                  <div className="launch-header">
                    <h3>{launch.name}</h3>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(launch.status) }}
                    >
                      {launch.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="launch-description">{launch.description}</p>
                  
                  <div className="launch-stats">
                    <div className="stat">
                      <span className="stat-label">Supply:</span>
                      <span className="stat-value">
                        {launch.totalMinted.toLocaleString()} / {launch.maxSupply.toLocaleString()}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Price:</span>
                      <span className="stat-value">{formatSOL(launch.pricePerNFT)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Revenue:</span>
                      <span className="stat-value">{formatSOL(launch.totalRevenue)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Whitelist:</span>
                      <span className="stat-value">
                        {launch.whitelistRequired ? `${launch.whitelistSize} wallets` : 'Not required'}
                      </span>
                    </div>
                  </div>

                  <div className="launch-actions">
                    {launch.status === 'scheduled' && (
                      <button 
                        onClick={() => activateLaunch(launch.id)}
                        className="btn-primary"
                      >
                        🚀 Activate
                      </button>
                    )}
                    {launch.status === 'active' && (
                      <button 
                        onClick={() => pauseLaunch(launch.id)}
                        className="btn-warning"
                      >
                        ⏸️ Pause
                      </button>
                    )}
                    {launch.status === 'paused' && (
                      <button 
                        onClick={() => activateLaunch(launch.id)}
                        className="btn-primary"
                      >
                        ▶️ Resume
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedLaunch(launch)}
                      className="btn-secondary"
                    >
                      📊 Details
                    </button>
                  </div>

                  <div className="launch-meta">
                    <small>Created: {formatDate(launch.createdAt)}</small>
                    <small>Launch: {formatDate(launch.launchDate)}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-tab">
            <h2>Create New Launch</h2>
            <form onSubmit={createLaunch} className="create-form">
              <div className="form-group">
                <label>Launch Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  required
                  placeholder="My Awesome Launch"
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  required
                  placeholder="Describe your launch..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Supply *</label>
                  <input
                    type="number"
                    value={createForm.maxSupply}
                    onChange={(e) => setCreateForm({...createForm, maxSupply: parseInt(e.target.value)})}
                    required
                    min="1"
                    max="1000000"
                  />
                </div>

                <div className="form-group">
                  <label>Price per NFT (SOL) *</label>
                  <input
                    type="number"
                    step="0.001"
                    value={createForm.pricePerNFT}
                    onChange={(e) => setCreateForm({...createForm, pricePerNFT: parseFloat(e.target.value)})}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Launch Date *</label>
                  <input
                    type="datetime-local"
                    value={createForm.launchDate}
                    onChange={(e) => setCreateForm({...createForm, launchDate: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({...createForm, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Mints per Wallet</label>
                  <input
                    type="number"
                    value={createForm.maxMintsPerWallet}
                    onChange={(e) => setCreateForm({...createForm, maxMintsPerWallet: parseInt(e.target.value)})}
                    min="1"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label>Max Mints per Transaction</label>
                  <input
                    type="number"
                    value={createForm.maxMintsPerTransaction}
                    onChange={(e) => setCreateForm({...createForm, maxMintsPerTransaction: parseInt(e.target.value)})}
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={createForm.whitelistRequired}
                    onChange={(e) => setCreateForm({...createForm, whitelistRequired: e.target.checked})}
                  />
                  Require Whitelist
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={createForm.antiBotProtection}
                    onChange={(e) => setCreateForm({...createForm, antiBotProtection: e.target.checked})}
                  />
                  Anti-Bot Protection
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={createForm.tieredAccess}
                    onChange={(e) => setCreateForm({...createForm, tieredAccess: e.target.checked})}
                  />
                  Tiered Access
                </label>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? '🔄 Creating...' : '🌟 Create Launch'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'whitelist' && (
          <div className="whitelist-tab">
            <h2>Whitelist Management</h2>
            <form onSubmit={addToWhitelist} className="whitelist-form">
              <div className="form-group">
                <label>Select Launch</label>
                <select
                  value={whitelistForm.launchId}
                  onChange={(e) => setWhitelistForm({...whitelistForm, launchId: e.target.value})}
                  required
                >
                  <option value="">Choose a launch...</option>
                  {launches
                    .filter(launch => launch.whitelistRequired)
                    .map(launch => (
                      <option key={launch.id} value={launch.id}>
                        {launch.name} ({launch.status})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Wallet Address *</label>
                <input
                  type="text"
                  value={whitelistForm.walletAddress}
                  onChange={(e) => setWhitelistForm({...whitelistForm, walletAddress: e.target.value})}
                  required
                  placeholder="Enter wallet address..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tier</label>
                  <select
                    value={whitelistForm.tier}
                    onChange={(e) => setWhitelistForm({...whitelistForm, tier: e.target.value})}
                  >
                    <option value="default">Default</option>
                    <option value="vip">VIP</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Max Mints</label>
                  <input
                    type="number"
                    value={whitelistForm.maxMints}
                    onChange={(e) => setWhitelistForm({...whitelistForm, maxMints: parseInt(e.target.value)})}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? '🔄 Adding...' : '➕ Add to Whitelist'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-tab">
            <h2>Launch Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Launches</h3>
                <div className="stat-number">{launches.length}</div>
              </div>
              <div className="stat-card">
                <h3>Active Launches</h3>
                <div className="stat-number">
                  {launches.filter(l => l.status === 'active').length}
                </div>
              </div>
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <div className="stat-number">
                  {formatSOL(launches.reduce((sum, l) => sum + l.totalRevenue, 0))}
                </div>
              </div>
              <div className="stat-card">
                <h3>Total Minted</h3>
                <div className="stat-number">
                  {launches.reduce((sum, l) => sum + l.totalMinted, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenesisProtocol;
