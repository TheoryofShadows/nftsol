import React, { useState } from "react";
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

  async function handleMint() {
    if (!connected || !publicKey) {
      setStatus("❌ Please connect your wallet first");
      return;
    }

    if (!form.name || !form.description || !form.imageUrl) {
      setStatus("❌ Please fill in all required fields");
      return;
    }

    setLoading(true);
    setStatus("🚀 Minting your revolutionary NFT...");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          creator: publicKey.toString()
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setStatus("✅ NFT minted successfully! Your revolutionary creation is now live!");
        setForm({ name: "", description: "", imageUrl: "", collection: "" });
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
              <label className="form-label">Image URL *</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/your-image.png"
                value={form.imageUrl}
                onChange={(e) => setForm({...form, imageUrl: e.target.value})}
              />
              <div className="form-help">
                💡 Use IPFS, Arweave, or any public image URL
              </div>
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
              className="btn-primary mint-button"
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: '0.5rem' }}></div>
                  Minting...
                </>
              ) : (
                '🚀 Mint Revolutionary NFT'
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