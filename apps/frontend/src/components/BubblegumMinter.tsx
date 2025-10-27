/**
 * 🚀 Bubblegum Minter Component
 * Mass cNFT Drop Interface
 * Enables 99% cost reduction for NFT mints
 */

import { useState, useEffect } from 'react';
import { bubblegumService, CompressedNFTMetadata } from '../services/bubblegumService';
import './BubblegumMinter.css';

interface BubblegumMinterProps {
  onMintSuccess?: (result: any) => void;
}

export default function BubblegumMinter({ onMintSuccess }: BubblegumMinterProps) {
  const [activeTab, setActiveTab] = useState<'tree' | 'single' | 'bulk'>('tree');
  
  // Tree creation state
  const [treeConfig, setTreeConfig] = useState({
    maxDepth: 14,
    maxBufferSize: 64,
    canopyDepth: 0,
  });
  const [treeAddress, setTreeAddress] = useState('');
  const [treeCapacity, setTreeCapacity] = useState(0);
  const [isCreatingTree, setIsCreatingTree] = useState(false);

  // Single mint state
  const [singleMintMetadata, setSingleMintMetadata] = useState<CompressedNFTMetadata>({
    name: '',
    symbol: '',
    description: '',
    image: '',
  });
  const [isMintingSingle, setIsMintingSingle] = useState(false);

  // Bulk mint state
  const [bulkMetadata, setBulkMetadata] = useState<CompressedNFTMetadata[]>([]);
  const [isBulkMinting, setIsBulkMinting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ minted: 0, total: 0 });

  // Service info state
  const [serviceInfo, setServiceInfo] = useState<any>(null);

  useEffect(() => {
    loadServiceInfo();
  }, []);

  const loadServiceInfo = async () => {
    try {
      const info = await bubblegumService.getInfo();
      setServiceInfo(info);
    } catch (error) {
      console.error('Failed to load service info:', error);
    }
  };

  const handleCreateTree = async () => {
    try {
      setIsCreatingTree(true);
      const result = await bubblegumService.createTree(treeConfig);
      setTreeAddress(result.treeAddress);
      setTreeCapacity(result.capacity);
      alert(`✅ Tree created! Capacity: ${result.capacity.toLocaleString()} NFTs`);
    } catch (error: any) {
      alert(`❌ Failed to create tree: ${error.message}`);
    } finally {
      setIsCreatingTree(false);
    }
  };

  const handleSingleMint = async () => {
    if (!treeAddress) {
      alert('Please create a tree first');
      return;
    }

    try {
      setIsMintingSingle(true);
      const result = await bubblegumService.mintCompressedNFT({
        treeAddress,
        metadata: singleMintMetadata,
      });
      
      if (onMintSuccess) {
        onMintSuccess(result);
      }
      
      alert(`✅ Compressed NFT minted! Signature: ${result.signature.substring(0, 8)}...`);
      
      // Reset form
      setSingleMintMetadata({
        name: '',
        symbol: '',
        description: '',
        image: '',
      });
    } catch (error: any) {
      alert(`❌ Failed to mint: ${error.message}`);
    } finally {
      setIsMintingSingle(false);
    }
  };

  const handleBulkMint = async () => {
    if (!treeAddress) {
      alert('Please create a tree first');
      return;
    }

    if (bulkMetadata.length === 0) {
      alert('Please add metadata for NFTs to mint');
      return;
    }

    try {
      setIsBulkMinting(true);
      setBulkProgress({ minted: 0, total: bulkMetadata.length });

      const result = await bubblegumService.bulkMint({
        treeAddress,
        metadatas: bulkMetadata,
        batchSize: 50,
      });

      setBulkProgress({ minted: result.minted, total: result.total });

      alert(
        `✅ Bulk mint complete!\n` +
        `Minted: ${result.minted}/${result.total}\n` +
        `Total cost: $${result.totalCost.toFixed(2)}\n` +
        `Cost per NFT: $${result.averageCostPerNFT.toFixed(6)}`
      );

      if (onMintSuccess) {
        onMintSuccess(result);
      }
    } catch (error: any) {
      alert(`❌ Failed to bulk mint: ${error.message}`);
    } finally {
      setIsBulkMinting(false);
    }
  };

  const addBulkMetadata = () => {
    setBulkMetadata([
      ...bulkMetadata,
      { name: '', symbol: '', description: '', image: '' },
    ]);
  };

  const updateBulkMetadata = (index: number, field: string, value: string) => {
    const updated = [...bulkMetadata];
    (updated[index] as any)[field] = value;
    setBulkMetadata(updated);
  };

  const removeBulkMetadata = (index: number) => {
    setBulkMetadata(bulkMetadata.filter((_, i) => i !== index));
  };

  return (
    <div className="bubblegum-minter">
      <div className="bubblegum-header">
        <h2>🌳 Bubblegum v2 - Mass cNFT Drops</h2>
        <p className="bubblegum-subtitle">99% Cost Reduction • 1M+ NFTs at &lt;$0.01 each</p>
      </div>

      {serviceInfo && (
        <div className="service-info">
          <h3>{serviceInfo.name}</h3>
          <p>{serviceInfo.description}</p>
          <div className="info-features">
            {serviceInfo.features.map((feature: string, i: number) => (
              <span key={i} className="feature-badge">{feature}</span>
            ))}
          </div>
          <p className="cost-info">
            💰 {serviceInfo.costPerNFT} per NFT • {serviceInfo.typicalCost} for 1M NFTs
          </p>
        </div>
      )}

      <div className="tab-navigation">
        <button
          className={activeTab === 'tree' ? 'active' : ''}
          onClick={() => setActiveTab('tree')}
        >
          🌳 Create Tree
        </button>
        <button
          className={activeTab === 'single' ? 'active' : ''}
          onClick={() => setActiveTab('single')}
          disabled={!treeAddress}
        >
          🎨 Single Mint
        </button>
        <button
          className={activeTab === 'bulk' ? 'active' : ''}
          onClick={() => setActiveTab('bulk')}
          disabled={!treeAddress}
        >
          📦 Bulk Mint
        </button>
      </div>

      <div className="tab-content">
        {/* Tree Creation Tab */}
        {activeTab === 'tree' && (
          <div className="tree-creation">
            <h3>Create Bubblegum Tree</h3>
            <p className="info-text">
              Trees enable efficient storage of millions of NFTs at near-zero cost.
            </p>

            <div className="form-group">
              <label htmlFor="max-depth">Max Depth (2^depth = capacity)</label>
              <input
                id="max-depth"
                type="number"
                value={treeConfig.maxDepth}
                onChange={(e) =>
                  setTreeConfig({ ...treeConfig, maxDepth: parseInt(e.target.value) || 0 })
                }
                min="1"
                max="30"
              />
              <small>
                Capacity: {Math.pow(2, treeConfig.maxDepth).toLocaleString()} NFTs
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="max-buffer-size">Max Buffer Size</label>
              <input
                id="max-buffer-size"
                type="number"
                value={treeConfig.maxBufferSize}
                onChange={(e) =>
                  setTreeConfig({ ...treeConfig, maxBufferSize: parseInt(e.target.value) || 0 })
                }
                min="1"
              />
            </div>

            {treeAddress && (
              <div className="tree-info">
                <h4>✅ Tree Created</h4>
                <p><strong>Address:</strong> {treeAddress}</p>
                <p><strong>Capacity:</strong> {treeCapacity.toLocaleString()} NFTs</p>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleCreateTree}
              disabled={isCreatingTree}
            >
              {isCreatingTree ? 'Creating Tree...' : 'Create Tree'}
            </button>
          </div>
        )}

        {/* Single Mint Tab */}
        {activeTab === 'single' && (
          <div className="single-mint">
            <h3>Mint Single Compressed NFT</h3>
            <p className="info-text">Mint one compressed NFT at a time</p>

            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={singleMintMetadata.name}
                onChange={(e) =>
                  setSingleMintMetadata({ ...singleMintMetadata, name: e.target.value })
                }
                placeholder="My Awesome NFT"
              />
            </div>

            <div className="form-group">
              <label>Symbol *</label>
              <input
                type="text"
                value={singleMintMetadata.symbol}
                onChange={(e) =>
                  setSingleMintMetadata({ ...singleMintMetadata, symbol: e.target.value })
                }
                placeholder="MANFT"
                maxLength={10}
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={singleMintMetadata.description}
                onChange={(e) =>
                  setSingleMintMetadata({ ...singleMintMetadata, description: e.target.value })
                }
                placeholder="A cool compressed NFT"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Image URL *</label>
              <input
                type="url"
                value={singleMintMetadata.image}
                onChange={(e) =>
                  setSingleMintMetadata({ ...singleMintMetadata, image: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            {singleMintMetadata.image && (
              <div className="image-preview">
                <img src={singleMintMetadata.image} alt="Preview" />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleSingleMint}
              disabled={isMintingSingle || !singleMintMetadata.name || !singleMintMetadata.image}
            >
              {isMintingSingle ? 'Minting...' : 'Mint Compressed NFT'}
            </button>
          </div>
        )}

        {/* Bulk Mint Tab */}
        {activeTab === 'bulk' && (
          <div className="bulk-mint">
            <h3>Bulk Mint Compressed NFTs</h3>
            <p className="info-text">
              Mint multiple compressed NFTs efficiently. Up to 10,000 per request.
            </p>

            <div className="bulk-controls">
              <button className="btn btn-secondary" onClick={addBulkMetadata}>
                + Add NFT Metadata
              </button>
              <span className="count">{bulkMetadata.length} NFTs ready to mint</span>
            </div>

            <div className="bulk-metadata-list">
              {bulkMetadata.map((metadata, index) => (
                                 <div key={index} className="bulk-item">
                   <h4>NFT #{index + 1}</h4>
                   <button
                     className="btn-remove"
                     onClick={() => removeBulkMetadata(index)}
                     aria-label="Remove NFT"
                     title="Remove NFT"
                   >
                     ✕
                   </button>

                   <input
                     type="text"
                     placeholder="Name"
                     value={metadata.name}
                     onChange={(e) =>
                       updateBulkMetadata(index, 'name', e.target.value)
                     }
                     aria-label={`NFT ${index + 1} Name`}
                   />
                   <input
                     type="text"
                     placeholder="Symbol"
                     value={metadata.symbol}
                     onChange={(e) =>
                       updateBulkMetadata(index, 'symbol', e.target.value)
                     }
                     aria-label={`NFT ${index + 1} Symbol`}
                   />
                   <input
                     type="text"
                     placeholder="Description"
                     value={metadata.description}
                     onChange={(e) =>
                       updateBulkMetadata(index, 'description', e.target.value)
                     }
                     aria-label={`NFT ${index + 1} Description`}
                   />
                   <input
                     type="url"
                     placeholder="Image URL"
                     value={metadata.image}
                     onChange={(e) =>
                       updateBulkMetadata(index, 'image', e.target.value)
                     }
                     aria-label={`NFT ${index + 1} Image URL`}
                   />
                 </div>
              ))}
            </div>

            {isBulkMinting && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(bulkProgress.minted / bulkProgress.total) * 100}%`,
                  }}
                />
                <span className="progress-text">
                  {bulkProgress.minted} / {bulkProgress.total} minted
                </span>
              </div>
            )}

            <button
              className="btn btn-primary btn-large"
              onClick={handleBulkMint}
              disabled={isBulkMinting || bulkMetadata.length === 0}
            >
              {isBulkMinting
                ? `Bulk Minting... (${bulkProgress.minted}/${bulkProgress.total})`
                : `Bulk Mint ${bulkMetadata.length} NFTs`}
            </button>
          </div>
        )}
      </div>

      {!treeAddress && (
        <div className="warning-banner">
          ⚠️ Please create a tree first before minting NFTs
        </div>
      )}
    </div>
  );
}
