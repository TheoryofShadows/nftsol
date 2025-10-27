import React, { useState, useEffect } from 'react';

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  bannerImage?: string;
  creator: string;
  totalSupply: number;
  minted: number;
  floorPrice: number;
  volume24h: number;
  marketCap: number;
  verified: boolean;
  featured: boolean;
  createdAt: number;
  socialLinks: {
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    instagram?: string;
  };
  launchConfig: {
    launchDate?: number;
    price: number;
    currency: 'SOL' | 'CLOUT';
    maxPerWallet: number;
    whitelistRequired: boolean;
    timeCapsuleEnabled: boolean;
  };
}

export default function CollectionManager() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-collections' | 'featured' | 'trending'>('my-collections');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadCollections();
  }, [activeTab]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      let url = '';
      
      switch (activeTab) {
        case 'my-collections':
          // Would need user wallet address
          url = `${import.meta.env.VITE_API_BASE}/api/collections/creator/placeholder`;
          break;
        case 'featured':
          url = `${import.meta.env.VITE_API_BASE}/api/collections/featured`;
          break;
        case 'trending':
          url = `${import.meta.env.VITE_API_BASE}/api/collections/trending`;
          break;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="collection-manager-container">
      <div className="collection-manager-header">
        <h2>🏗️ Collection Manager</h2>
        <p>Build and manage your NFT collections with revolutionary features!</p>
      </div>

      {/* Tab Navigation */}
      <div className="collection-tabs">
        <button 
          className={`tab-button ${activeTab === 'my-collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-collections')}
        >
          📁 My Collections
        </button>
        <button 
          className={`tab-button ${activeTab === 'featured' ? 'active' : ''}`}
          onClick={() => setActiveTab('featured')}
        >
          ⭐ Featured
        </button>
        <button 
          className={`tab-button ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          📈 Trending
        </button>
      </div>

      {/* Collections Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading collections...</p>
        </div>
      ) : (
        <div className="collections-grid">
          {collections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏗️</div>
              <h3>No Collections Found</h3>
              <p>Create your first collection and start building your NFT project!</p>
              <button 
                className="btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                🏗️ Create Collection
              </button>
            </div>
          ) : (
            collections.map((collection) => (
              <div key={collection.id} className="collection-card">
                <div className="collection-image">
                  <img src={collection.image} alt={collection.name} />
                  <div className="collection-badges">
                    {collection.verified && <span className="badge verified">✅ Verified</span>}
                    {collection.featured && <span className="badge featured">⭐ Featured</span>}
                  </div>
                </div>
                
                <div className="collection-content">
                  <h3 className="collection-name">{collection.name}</h3>
                  <p className="collection-symbol">{collection.symbol}</p>
                  <p className="collection-description">{collection.description}</p>
                  
                  <div className="collection-stats">
                    <div className="stat-item">
                      <span className="stat-label">📊 Supply:</span>
                      <span className="stat-value">{collection.minted}/{collection.totalSupply}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">💰 Floor:</span>
                      <span className="stat-value">{formatPrice(collection.floorPrice)} SOL</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">📈 Volume 24h:</span>
                      <span className="stat-value">{formatPrice(collection.volume24h)} SOL</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">🏆 Market Cap:</span>
                      <span className="stat-value">{formatPrice(collection.marketCap)} SOL</span>
                    </div>
                  </div>
                  
                  <div className="collection-social">
                    {collection.socialLinks.website && (
                      <a href={collection.socialLinks.website} target="_blank" rel="noopener noreferrer">
                        🌐 Website
                      </a>
                    )}
                    {collection.socialLinks.twitter && (
                      <a href={collection.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        🐦 Twitter
                      </a>
                    )}
                    {collection.socialLinks.discord && (
                      <a href={collection.socialLinks.discord} target="_blank" rel="noopener noreferrer">
                        💬 Discord
                      </a>
                    )}
                  </div>
                  
                  <div className="collection-actions">
                    <button className="btn-secondary">
                      👁️ View Collection
                    </button>
                    <button className="btn-primary">
                      🎨 Manage
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Collection Button */}
      <div className="collection-create">
        <button 
          className="btn-primary create-collection"
          onClick={() => setShowCreateForm(true)}
        >
          🏗️ Create New Collection
        </button>
      </div>

      {/* Create Collection Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🏗️ Create New Collection</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <form className="collection-form">
                <div className="form-group">
                  <label>Collection Name *</label>
                  <input type="text" placeholder="Enter collection name" required />
                </div>
                
                <div className="form-group">
                  <label>Symbol *</label>
                  <input type="text" placeholder="e.g., NFTSOL" required />
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea placeholder="Describe your collection..." required></textarea>
                </div>
                
                <div className="form-group">
                  <label>Collection Image *</label>
                  <input type="url" placeholder="https://example.com/image.png" required />
                </div>
                
                <div className="form-group">
                  <label>Banner Image</label>
                  <input type="url" placeholder="https://example.com/banner.png" />
                </div>
                
                <div className="form-group">
                  <label>Website</label>
                  <input type="url" placeholder="https://yourwebsite.com" />
                </div>
                
                <div className="form-group">
                  <label>Twitter</label>
                  <input type="url" placeholder="https://twitter.com/yourhandle" />
                </div>
                
                <div className="form-group">
                  <label>Discord</label>
                  <input type="url" placeholder="https://discord.gg/yourserver" />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    🏗️ Create Collection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
