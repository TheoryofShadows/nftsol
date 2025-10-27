import React, { useState, useEffect } from 'react';

interface TimeCapsuleSale {
  id: string;
  mint: string;
  seller: string;
  buyer?: string;
  price: number;
  currency: 'SOL' | 'CLOUT';
  releaseDate: number;
  partialPayment: number;
  status: 'active' | 'reserved' | 'released' | 'cancelled';
  createdAt: number;
  metadata: {
    name: string;
    description: string;
    image: string;
    collection: string;
  };
}

export default function TimeCapsuleSales() {
  const [sales, setSales] = useState<TimeCapsuleSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'my-sales' | 'my-reservations'>('active');

  useEffect(() => {
    loadTimeCapsuleSales();
  }, [activeTab]);

  const loadTimeCapsuleSales = async () => {
    try {
      setLoading(true);
      let url = '';
      
      switch (activeTab) {
        case 'active':
          url = `${import.meta.env.VITE_API_BASE}/api/time-capsules/active`;
          break;
        case 'my-sales':
          // Would need user wallet address
          url = `${import.meta.env.VITE_API_BASE}/api/time-capsules/seller/placeholder`;
          break;
        case 'my-reservations':
          // Would need user wallet address
          url = `${import.meta.env.VITE_API_BASE}/api/time-capsules/buyer/placeholder`;
          break;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setSales(data.sales || []);
      }
    } catch (error) {
      console.error('Error loading time capsule sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'reserved': return 'text-blue-500';
      case 'released': return 'text-purple-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '⏰';
      case 'reserved': return '🎯';
      case 'released': return '🚀';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="time-capsule-container">
      <div className="time-capsule-header">
        <h2>⏰ Time Capsule Sales</h2>
        <p>The revolutionary way to sell future NFTs with anticipation and community building!</p>
      </div>

      {/* Tab Navigation */}
      <div className="time-capsule-tabs">
        <button 
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          🔍 Active Sales
        </button>
        <button 
          className={`tab-button ${activeTab === 'my-sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-sales')}
        >
          📤 My Sales
        </button>
        <button 
          className={`tab-button ${activeTab === 'my-reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-reservations')}
        >
          🎯 My Reservations
        </button>
      </div>

      {/* Sales Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading time capsule sales...</p>
        </div>
      ) : (
        <div className="time-capsule-grid">
          {sales.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⏰</div>
              <h3>No Time Capsule Sales Found</h3>
              <p>Be the first to create a revolutionary time-locked NFT sale!</p>
            </div>
          ) : (
            sales.map((sale) => (
              <div key={sale.id} className="time-capsule-card">
                <div className="time-capsule-image">
                  <img src={sale.metadata.image} alt={sale.metadata.name} />
                  <div className="time-capsule-status">
                    <span className={`status-badge ${getStatusColor(sale.status)}`}>
                      {getStatusIcon(sale.status)} {sale.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="time-capsule-content">
                  <h3 className="time-capsule-name">{sale.metadata.name}</h3>
                  <p className="time-capsule-collection">{sale.metadata.collection}</p>
                  <p className="time-capsule-description">{sale.metadata.description}</p>
                  
                  <div className="time-capsule-details">
                    <div className="detail-item">
                      <span className="detail-label">💰 Price:</span>
                      <span className="detail-value">{sale.price} {sale.currency}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">💳 Partial Payment:</span>
                      <span className="detail-value">{sale.partialPayment}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">📅 Release Date:</span>
                      <span className="detail-value">{formatDate(sale.releaseDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">👤 Seller:</span>
                      <span className="detail-value">{sale.seller.slice(0, 8)}...{sale.seller.slice(-8)}</span>
                    </div>
                  </div>
                  
                  <div className="time-capsule-actions">
                    {sale.status === 'active' && (
                      <button className="btn-primary reserve-button">
                        🎯 Reserve Now
                      </button>
                    )}
                    {sale.status === 'reserved' && (
                      <div className="reserved-info">
                        <p>✅ Reserved by {sale.buyer?.slice(0, 8)}...{sale.buyer?.slice(-8)}</p>
                        <p>Release: {formatDate(sale.releaseDate)}</p>
                      </div>
                    )}
                    {sale.status === 'released' && (
                      <div className="released-info">
                        <p>🚀 Released!</p>
                        <p>NFT transferred to buyer</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Time Capsule Button */}
      <div className="time-capsule-create">
        <button className="btn-primary create-time-capsule">
          ⏰ Create Time Capsule Sale
        </button>
      </div>
    </div>
  );
}
