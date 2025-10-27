/**
 * 🏗️ Collection Verification Component
 * Collection creation, verification, and management for compressed NFTs
 */

import React, { useState, useEffect } from 'react';
import './CollectionVerification.css';

interface CollectionMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
  };
}

interface CollectionInfo {
  collectionMint: string;
  collectionAuthority: string;
  collectionMetadata: string;
  collectionUri: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CollectionVerificationRequest {
  collectionMint: string;
  collectionAuthority: string;
  treeAddress: string;
  leafIndex: number;
  assetId: string;
}

interface CollectionStats {
  totalAssets: number;
  verifiedAssets: number;
  unverifiedAssets: number;
  verificationRate: number;
}

const CollectionVerification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'verify' | 'manage' | 'stats'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Collection creation state
  const [collectionMetadata, setCollectionMetadata] = useState<CollectionMetadata>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    externalUrl: '',
    attributes: [],
    properties: {}
  });
  
  // Collection verification state
  const [verificationRequest, setVerificationRequest] = useState<CollectionVerificationRequest>({
    collectionMint: '',
    collectionAuthority: '',
    treeAddress: '',
    leafIndex: 0,
    assetId: ''
  });
  
  // Collection management state
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionInfo | null>(null);
  const [collectionStats, setCollectionStats] = useState<CollectionStats | null>(null);
  
  // Batch verification state
  const [batchRequests, setBatchRequests] = useState<CollectionVerificationRequest[]>([]);
  const [batchResults, setBatchResults] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'manage') {
      loadCollections();
    }
  }, [activeTab]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      // In a real implementation, you'd fetch from the API
      // const response = await fetch('/api/collection-verification/collections/authority');
      // const data = await response.json();
      // setCollections(data.data.collections);
      
      // Mock data for now
      setCollections([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/collection-verification/create-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionMetadata),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Collection created successfully!');
        setCollectionMetadata({
          name: '',
          symbol: '',
          description: '',
          image: '',
          externalUrl: '',
          attributes: [],
          properties: {}
        });
      } else {
        setError(data.error || 'Failed to create collection');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/collection-verification/verify-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationRequest),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Collection verified successfully!');
        setVerificationRequest({
          collectionMint: '',
          collectionAuthority: '',
          treeAddress: '',
          leafIndex: 0,
          assetId: ''
        });
      } else {
        setError(data.error || 'Failed to verify collection');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCollectionBatch = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/collection-verification/verify-collection-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: batchRequests }),
      });

      const data = await response.json();

      if (data.success) {
        setBatchResults(data.data.results);
        setSuccess(`Batch verification completed: ${data.data.successful}/${data.data.total} successful`);
      } else {
        setError(data.error || 'Failed to verify collection batch');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionStats = async (collectionMint: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/collection-verification/collection/${collectionMint}/stats`);
      const data = await response.json();

      if (data.success) {
        setCollectionStats(data.data);
      } else {
        setError(data.error || 'Failed to load collection stats');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addBatchRequest = () => {
    setBatchRequests([...batchRequests, {
      collectionMint: '',
      collectionAuthority: '',
      treeAddress: '',
      leafIndex: 0,
      assetId: ''
    }]);
  };

  const removeBatchRequest = (index: number) => {
    setBatchRequests(batchRequests.filter((_, i) => i !== index));
  };

  const updateBatchRequest = (index: number, field: keyof CollectionVerificationRequest, value: any) => {
    const updated = [...batchRequests];
    updated[index] = { ...updated[index], [field]: value };
    setBatchRequests(updated);
  };

  const addAttribute = () => {
    setCollectionMetadata({
      ...collectionMetadata,
      attributes: [...(collectionMetadata.attributes || []), { trait_type: '', value: '' }]
    });
  };

  const removeAttribute = (index: number) => {
    const attributes = [...(collectionMetadata.attributes || [])];
    attributes.splice(index, 1);
    setCollectionMetadata({ ...collectionMetadata, attributes });
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const attributes = [...(collectionMetadata.attributes || [])];
    attributes[index] = { ...attributes[index], [field]: value };
    setCollectionMetadata({ ...collectionMetadata, attributes });
  };

  return (
    <div className="collection-verification">
      <div className="collection-verification-header">
        <h1>🏗️ Collection Verification</h1>
        <p>Create, verify, and manage collections for compressed NFTs</p>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      <div className="collection-verification-tabs">
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          🏗️ Create Collection
        </button>
        <button
          className={activeTab === 'verify' ? 'active' : ''}
          onClick={() => setActiveTab('verify')}
        >
          ✅ Verify Collection
        </button>
        <button
          className={activeTab === 'manage' ? 'active' : ''}
          onClick={() => setActiveTab('manage')}
        >
          📋 Manage Collections
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
      </div>

      <div className="collection-verification-content">
        {activeTab === 'create' && (
          <div className="create-collection-tab">
            <h2>Create New Collection</h2>
            
            <div className="form-group">
              <label>Collection Name *</label>
              <input
                type="text"
                value={collectionMetadata.name}
                onChange={(e) => setCollectionMetadata({ ...collectionMetadata, name: e.target.value })}
                placeholder="Enter collection name"
                required
              />
            </div>

            <div className="form-group">
              <label>Collection Symbol *</label>
              <input
                type="text"
                value={collectionMetadata.symbol}
                onChange={(e) => setCollectionMetadata({ ...collectionMetadata, symbol: e.target.value })}
                placeholder="Enter collection symbol"
                maxLength={10}
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={collectionMetadata.description}
                onChange={(e) => setCollectionMetadata({ ...collectionMetadata, description: e.target.value })}
                placeholder="Enter collection description"
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label>Collection Image *</label>
              <input
                type="url"
                value={collectionMetadata.image}
                onChange={(e) => setCollectionMetadata({ ...collectionMetadata, image: e.target.value })}
                placeholder="Enter image URL"
                required
              />
            </div>

            <div className="form-group">
              <label>External URL</label>
              <input
                type="url"
                value={collectionMetadata.externalUrl || ''}
                onChange={(e) => setCollectionMetadata({ ...collectionMetadata, externalUrl: e.target.value })}
                placeholder="Enter external URL"
              />
            </div>

            <div className="form-group">
              <label>Attributes</label>
              <div className="attributes-section">
                {collectionMetadata.attributes?.map((attr, index) => (
                  <div key={index} className="attribute-row">
                    <input
                      type="text"
                      value={attr.trait_type}
                      onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                      placeholder="Trait type"
                    />
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="btn-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addAttribute} className="btn-add">
                  + Add Attribute
                </button>
              </div>
            </div>

            <button
              onClick={createCollection}
              disabled={loading || !collectionMetadata.name || !collectionMetadata.symbol || !collectionMetadata.description || !collectionMetadata.image}
              className="btn-primary"
            >
              {loading ? '🔄 Creating...' : '🏗️ Create Collection'}
            </button>
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="verify-collection-tab">
            <h2>Verify Collection</h2>
            
            <div className="form-group">
              <label>Collection Mint *</label>
              <input
                type="text"
                value={verificationRequest.collectionMint}
                onChange={(e) => setVerificationRequest({ ...verificationRequest, collectionMint: e.target.value })}
                placeholder="Enter collection mint address"
                required
              />
            </div>

            <div className="form-group">
              <label>Collection Authority *</label>
              <input
                type="text"
                value={verificationRequest.collectionAuthority}
                onChange={(e) => setVerificationRequest({ ...verificationRequest, collectionAuthority: e.target.value })}
                placeholder="Enter collection authority address"
                required
              />
            </div>

            <div className="form-group">
              <label>Tree Address *</label>
              <input
                type="text"
                value={verificationRequest.treeAddress}
                onChange={(e) => setVerificationRequest({ ...verificationRequest, treeAddress: e.target.value })}
                placeholder="Enter tree address"
                required
              />
            </div>

            <div className="form-group">
              <label>Leaf Index *</label>
              <input
                type="number"
                value={verificationRequest.leafIndex}
                onChange={(e) => setVerificationRequest({ ...verificationRequest, leafIndex: parseInt(e.target.value) })}
                placeholder="Enter leaf index"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Asset ID *</label>
              <input
                type="text"
                value={verificationRequest.assetId}
                onChange={(e) => setVerificationRequest({ ...verificationRequest, assetId: e.target.value })}
                placeholder="Enter asset ID"
                required
              />
            </div>

            <button
              onClick={verifyCollection}
              disabled={loading || !verificationRequest.collectionMint || !verificationRequest.collectionAuthority || !verificationRequest.treeAddress || !verificationRequest.assetId}
              className="btn-primary"
            >
              {loading ? '🔄 Verifying...' : '✅ Verify Collection'}
            </button>

            <div className="batch-verification-section">
              <h3>Batch Verification</h3>
              <p>Verify multiple assets at once</p>
              
              {batchRequests.map((request, index) => (
                <div key={index} className="batch-request">
                  <h4>Request {index + 1}</h4>
                  <div className="batch-request-fields">
                    <input
                      type="text"
                      value={request.collectionMint}
                      onChange={(e) => updateBatchRequest(index, 'collectionMint', e.target.value)}
                      placeholder="Collection Mint"
                    />
                    <input
                      type="text"
                      value={request.collectionAuthority}
                      onChange={(e) => updateBatchRequest(index, 'collectionAuthority', e.target.value)}
                      placeholder="Collection Authority"
                    />
                    <input
                      type="text"
                      value={request.treeAddress}
                      onChange={(e) => updateBatchRequest(index, 'treeAddress', e.target.value)}
                      placeholder="Tree Address"
                    />
                    <input
                      type="number"
                      value={request.leafIndex}
                      onChange={(e) => updateBatchRequest(index, 'leafIndex', parseInt(e.target.value))}
                      placeholder="Leaf Index"
                    />
                    <input
                      type="text"
                      value={request.assetId}
                      onChange={(e) => updateBatchRequest(index, 'assetId', e.target.value)}
                      placeholder="Asset ID"
                    />
                    <button
                      type="button"
                      onClick={() => removeBatchRequest(index)}
                      className="btn-remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              <div className="batch-actions">
                <button type="button" onClick={addBatchRequest} className="btn-secondary">
                  + Add Request
                </button>
                <button
                  onClick={verifyCollectionBatch}
                  disabled={loading || batchRequests.length === 0}
                  className="btn-primary"
                >
                  {loading ? '🔄 Verifying...' : '✅ Verify Batch'}
                </button>
              </div>

              {batchResults.length > 0 && (
                <div className="batch-results">
                  <h4>Batch Results</h4>
                  {batchResults.map((result, index) => (
                    <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                      <span>{result.success ? '✅' : '❌'}</span>
                      <span>Asset {result.assetId}: {result.success ? 'Verified' : 'Failed'}</span>
                      {result.error && <span className="error-text">({result.error})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="manage-collections-tab">
            <h2>Manage Collections</h2>
            
            {loading ? (
              <div className="loading">Loading collections...</div>
            ) : collections.length === 0 ? (
              <div className="no-collections">
                <p>No collections found. Create a collection to get started.</p>
                <button onClick={() => setActiveTab('create')} className="btn-primary">
                  Create Collection
                </button>
              </div>
            ) : (
              <div className="collections-list">
                {collections.map((collection) => (
                  <div key={collection.collectionMint} className="collection-card">
                    <div className="collection-header">
                      <h3>{collection.collectionMint}</h3>
                      <span className={`status ${collection.verified ? 'verified' : 'unverified'}`}>
                        {collection.verified ? '✅ Verified' : '❌ Unverified'}
                      </span>
                    </div>
                    <div className="collection-details">
                      <p><strong>Authority:</strong> {collection.collectionAuthority}</p>
                      <p><strong>Created:</strong> {new Date(collection.createdAt).toLocaleDateString()}</p>
                      <p><strong>Updated:</strong> {new Date(collection.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="collection-actions">
                      <button
                        onClick={() => {
                          setSelectedCollection(collection);
                          loadCollectionStats(collection.collectionMint);
                        }}
                        className="btn-secondary"
                      >
                        View Stats
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-tab">
            <h2>Collection Statistics</h2>
            
            {selectedCollection ? (
              <div className="collection-stats">
                <h3>Statistics for {selectedCollection.collectionMint}</h3>
                
                {collectionStats ? (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h4>Total Assets</h4>
                      <p className="stat-value">{collectionStats.totalAssets}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Verified Assets</h4>
                      <p className="stat-value">{collectionStats.verifiedAssets}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Unverified Assets</h4>
                      <p className="stat-value">{collectionStats.unverifiedAssets}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Verification Rate</h4>
                      <p className="stat-value">{collectionStats.verificationRate.toFixed(2)}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="loading">Loading statistics...</div>
                )}
              </div>
            ) : (
              <div className="no-selection">
                <p>Select a collection from the Manage Collections tab to view statistics.</p>
                <button onClick={() => setActiveTab('manage')} className="btn-primary">
                  Manage Collections
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionVerification;
