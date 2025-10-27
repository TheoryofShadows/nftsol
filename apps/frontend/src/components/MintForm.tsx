import React, { useState, useRef } from "react";
import { useUniversalWallet } from '../wallet/UniversalWalletAdapter';

export default function MintForm() {
  const { publicKey, connected } = useUniversalWallet();
  const [form, setForm] = useState({ 
    name: "", 
    description: "", 
    imageUrl: "",
    collection: ""
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setStatus("❌ Please select a valid image file");
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setStatus("❌ File size must be less than 10MB");
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL input
  const handleUrlInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setForm({...form, imageUrl: url});
    if (url) {
      setImagePreview(url);
    }
  };

  // Upload file to IPFS
  const uploadFileToIPFS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success && data.ipfsUrl) {
        return data.ipfsUrl;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      throw new Error(`Failed to upload to IPFS: ${error}`);
    }
  };

  async function handleMint() {
    if (!connected || !publicKey) {
      setStatus("❌ Please connect your wallet first");
      return;
    }

    if (!form.name || !form.description) {
      setStatus("❌ Please fill in name and description");
      return;
    }

    if (inputType === 'upload' && !selectedFile) {
      setStatus("❌ Please select an image file");
      return;
    }

    if (inputType === 'url' && !form.imageUrl) {
      setStatus("❌ Please enter an image URL");
      return;
    }

    setLoading(true);
    setStatus("🚀 Processing your revolutionary NFT...");

    try {
      let finalImageUrl = form.imageUrl;

      // Handle file upload
      if (inputType === 'upload' && selectedFile) {
        setStatus("📤 Uploading image to IPFS...");
        finalImageUrl = await uploadFileToIPFS(selectedFile);
        setStatus("✅ Image uploaded! Minting NFT...");
      }

      // Mint the NFT
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          imageUrl: finalImageUrl,
          collection: form.collection,
          creator: publicKey.toString()
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setStatus("✅ NFT minted successfully! Your revolutionary creation is now live!");
        setForm({ name: "", description: "", imageUrl: "", collection: "" });
        setSelectedFile(null);
        setImagePreview('');
      } else {
        setStatus(`❌ Minting failed: ${data.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mint-container">
      {!connected ? (
        <div className="connect-wallet-prompt">
          <div className="prompt-icon">🔗</div>
          <h3>Connect Your Wallet</h3>
          <p>Connect your Solana wallet to create revolutionary NFTs and earn CLOUT rewards!</p>
        </div>
      ) : (
        <div className="mint-form">
          <div className="form-header">
            <h3>✨ Create Your Revolutionary NFT</h3>
            <p>Join the most innovative NFT platform on Solana and earn CLOUT tokens!</p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">NFT Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter a creative name for your NFT"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Describe your revolutionary NFT..."
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Image *</label>
              
              {/* Input Type Toggle */}
              <div className="input-type-toggle">
                <button 
                  type="button"
                  className={`toggle-btn ${inputType === 'upload' ? 'active' : ''}`}
                  onClick={() => setInputType('upload')}
                >
                  📁 Upload from Device
                </button>
                <button 
                  type="button"
                  className={`toggle-btn ${inputType === 'url' ? 'active' : ''}`}
                  onClick={() => setInputType('url')}
                >
                  🔗 Use Image URL
                </button>
              </div>

              {/* File Upload Input */}
              {inputType === 'upload' && (
                <div className="file-upload-container">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden-file-input"
                    aria-label="Upload image file"
                  />
                  <div 
                    className="file-upload-area"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="file-selected">
                        <div className="file-icon">📁</div>
                        <div className="file-info">
                          <div className="file-name">{selectedFile.name}</div>
                          <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <button 
                          type="button"
                          className="remove-file"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setImagePreview('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="file-upload-prompt">
                        <div className="upload-icon">📤</div>
                        <div className="upload-text">
                          <strong>Click to upload image</strong>
                          <span>or drag and drop</span>
                        </div>
                        <div className="upload-hint">
                          PNG, JPG, GIF up to 10MB
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* URL Input */}
              {inputType === 'url' && (
                <div className="url-input-container">
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/your-image.png"
                    value={form.imageUrl}
                    onChange={handleUrlInput}
                  />
                  <div className="form-help">
                    💡 Use IPFS, Arweave, or any public image URL
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="image-preview">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="preview-image"
                    onError={() => setImagePreview('')}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Collection (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Collection name"
                value={form.collection}
                onChange={(e) => setForm({...form, collection: e.target.value})}
              />
            </div>
          </div>

          {/* CLOUT Benefits */}
          <div className="clout-benefits">
            <h4>🏆 CLOUT Rewards for Creating NFTs</h4>
            <div className="benefits-grid">
              <div className="benefit-item">
                <div className="benefit-icon">⚡</div>
                <div className="benefit-text">
                  <strong>+50 CLOUT</strong>
                  <span>For each NFT created</span>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🎯</div>
                <div className="benefit-text">
                  <strong>Honor Boost</strong>
                  <span>Increases your reputation</span>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">💰</div>
                <div className="benefit-text">
                  <strong>Fee Discount</strong>
                  <span>Reduced platform fees</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              onClick={handleMint}
              disabled={loading}
              className="btn-primary mint-button revolutionary-button"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mint-spinner"></div>
                  <span>Minting Revolutionary NFT...</span>
                </>
              ) : (
                <>
                  <span className="button-icon">🚀</span>
                  <span>Mint Revolutionary NFT</span>
                  <span className="button-badge">+50 CLOUT</span>
                </>
              )}
            </button>
          </div>

          {status && (
            <div className={`status-message ${status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : 'info'}`}>
              {status}
            </div>
          )}
        </div>
      )}

      {/* Revolutionary Features */}
      <div className="mint-features">
        <h4>🚀 Why Choose NFTSol?</h4>
        <div className="features-list">
          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <div className="feature-content">
              <h5>Universal Wallet Support</h5>
              <p>Connect with Phantom, Solflare, and any Solana wallet</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🏆</div>
            <div className="feature-content">
              <h5>CLOUT Token Economy</h5>
              <p>Earn rewards for platform activity and good behavior</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🤝</div>
            <div className="feature-content">
              <h5>Honor-Based System</h5>
              <p>Trust-based payments and rewards based on reputation</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🌐</div>
            <div className="feature-content">
              <h5>Cross-Platform NFTs</h5>
              <p>View and trade NFTs from any Solana platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}