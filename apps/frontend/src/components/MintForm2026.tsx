import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useUniversalWallet } from '../wallet/UniversalWalletAdapter';
import MetaplexClient, { NFT2026Metadata, MintOptions } from '../services/metaplexClient';
import { Connection, clusterApiUrl } from '@solana/web3.js';

interface Creator {
  address: string;
  share: number;
  verified: boolean;
}

interface Attribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_percentage' | 'boost_number' | 'date';
}

export default function MintForm2026() {
  const { publicKey, connected, signTransaction } = useUniversalWallet();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [step, setStep] = useState(1);
  const [mintType, setMintType] = useState<'regular' | 'compressed'>('regular');
  
  // Form state
  const [form, setForm] = useState({
    // Basic info
    name: "",
    symbol: "",
    description: "",
    image: "",
    animation_url: "",
    external_url: "",
    youtube_url: "",
    
    // Collection
    collection: "",
    collectionMint: "",
    
    // Royalties
    seller_fee_basis_points: 500, // 5%
    
    // Social links
    twitter: "",
    discord: "",
    website: "",
    
    // Category
    category: 'image' as 'image' | 'video' | 'audio' | '3d' | 'html'
  });

  // Creators and attributes
  const [creators, setCreators] = useState<Creator[]>([
    { address: publicKey?.toString() || '', share: 100, verified: true }
  ]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  
  // File handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update creator address when wallet changes
  useEffect(() => {
    if (publicKey && creators.length === 1 && creators[0].address === '') {
      setCreators([{ address: publicKey.toString(), share: 100, verified: true }]);
    }
  }, [publicKey, creators]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/', 'video/', 'audio/', 'model/gltf', 'text/html'];
      if (!validTypes.some(type => file.type.startsWith(type))) {
        setStatus("❌ Please select a valid file (image, video, audio, 3D model, or HTML)");
        return;
      }
      
      // Validate file size (max 50MB for videos/3D models)
      const maxSize = file.type.startsWith('video/') || file.type.includes('gltf') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setStatus(`❌ File size must be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setForm({...form, image: e.target?.result as string});
      };
      reader.readAsDataURL(file);
    }
  };

  // Add creator
  const addCreator = () => {
    setCreators([...creators, { address: '', share: 0, verified: false }]);
  };

  // Remove creator
  const removeCreator = (index: number) => {
    if (creators.length > 1) {
      setCreators(creators.filter((_, i) => i !== index));
    }
  };

  // Update creator
  const updateCreator = (index: number, field: keyof Creator, value: string | number | boolean) => {
    const newCreators = [...creators];
    newCreators[index] = { ...newCreators[index], [field]: value };
    setCreators(newCreators);
  };

  // Add attribute
  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  // Remove attribute
  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  // Update attribute
  const updateAttribute = (index: number, field: keyof Attribute, value: string | number) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setAttributes(newAttributes);
  };

  // Create metadata object
  const createMetadata = (): NFT2026Metadata => {
    return {
      name: form.name,
      symbol: form.symbol || form.name.substring(0, 4).toUpperCase(),
      description: form.description,
      image: form.image,
      animation_url: form.animation_url || undefined,
      external_url: form.external_url || undefined,
      youtube_url: form.youtube_url || undefined,
      properties: {
        files: selectedFile ? [{
          uri: form.image,
          type: selectedFile.type,
          cdn: false
        }] : [],
        category: form.category,
        creators: creators
      },
      attributes: attributes,
      collection: form.collectionMint ? {
        name: form.collection,
        family: 'NFTSol',
        verified: false
      } : undefined,
      seller_fee_basis_points: form.seller_fee_basis_points,
      twitter: form.twitter || undefined,
      discord: form.discord || undefined,
      website: form.website || undefined
    };
  };

  // Handle mint
  const handleMint = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setStatus("❌ Please connect your wallet first");
      return;
    }

    if (!form.name || !form.description || !form.image) {
      setStatus("❌ Please fill in name, description, and image");
      return;
    }

    setLoading(true);
    setStatus("🚀 Creating your revolutionary NFT...");

    try {
      const connection = new Connection(
        import.meta.env.VITE_SOLANA_CLUSTER === 'mainnet-beta' 
          ? clusterApiUrl('mainnet-beta')
          : clusterApiUrl('devnet')
      );

      const metaplexClient = new MetaplexClient(connection);

      // Validate metadata
      const metadata = createMetadata();
      const validation = metaplexClient.validateMetadata(metadata);
      
      if (!validation.valid) {
        setStatus(`❌ Validation failed: ${validation.errors.join(', ')}`);
        setLoading(false);
        return;
      }

      // Upload metadata to IPFS
      setStatus("📤 Uploading metadata to IPFS...");
      const metadataUri = await metaplexClient.uploadMetadata(metadata);

      // Update metadata with URI
      const finalMetadata = { ...metadata };
      // Note: In a real implementation, you'd update the metadata account with the URI

      // Create NFT
      setStatus("🎨 Minting NFT on Solana...");
      const mintOptions: MintOptions = {
        metadata: finalMetadata,
        collectionMint: form.collectionMint ? new (await import('@solana/web3.js')).PublicKey(form.collectionMint) : undefined,
        compressed: mintType === 'compressed'
      };

      const result = await metaplexClient.createNFT(
        publicKey,
        signTransaction,
        mintOptions
      );

      setStatus(`✅ NFT minted successfully! Mint: ${result.mint.toBase58()}`);
      
      // Reset form
      setForm({
        name: "",
        symbol: "",
        description: "",
        image: "",
        animation_url: "",
        external_url: "",
        youtube_url: "",
        collection: "",
        collectionMint: "",
        seller_fee_basis_points: 500,
        twitter: "",
        discord: "",
        website: "",
        category: 'image'
      });
      setCreators([{ address: publicKey.toString(), share: 100, verified: true }]);
      setAttributes([]);
      setSelectedFile(null);
      setImagePreview('');
      setStep(1);

    } catch (error: any) {
      console.error('Mint error:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="mint-form-container">
        <div className="connect-wallet-prompt">
          <h3>🔗 Connect Your Wallet</h3>
          <p>Connect your Solana wallet to start minting NFTs with 2026 standards!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mint-form-container">
      <div className="mint-form-header">
        <h2>✨ Create Revolutionary NFT - 2026 Standards</h2>
        <p>Mint with full Metaplex v3 support, collections, royalties, and multi-media content</p>
      </div>

      {/* Step indicator */}
      <div className="step-indicator">
        {[1, 2, 3, 4].map((stepNum) => (
          <div
            key={stepNum}
            className={`step ${step >= stepNum ? 'active' : ''}`}
            onClick={() => setStep(stepNum)}
          >
            {stepNum}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mint-step"
        >
          <h3>📝 Basic Information</h3>
          
          <div className="form-group">
            <label>NFT Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              placeholder="Enter NFT name"
              maxLength={32}
            />
          </div>

          <div className="form-group">
            <label>Symbol</label>
            <input
              type="text"
              value={form.symbol}
              onChange={(e) => setForm({...form, symbol: e.target.value})}
              placeholder="Auto-generated from name"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Describe your NFT"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({...form, category: e.target.value as any})}
            >
              <option value="image">🖼️ Image</option>
              <option value="video">🎥 Video</option>
              <option value="audio">🎵 Audio</option>
              <option value="3d">🎮 3D Model</option>
              <option value="html">🌐 HTML</option>
            </select>
          </div>

          <button onClick={() => setStep(2)} className="btn-primary">
            Next: Upload Media
          </button>
        </motion.div>
      )}

      {/* Step 2: Media Upload */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mint-step"
        >
          <h3>📁 Media Upload</h3>
          
          <div className="file-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.gltf,.glb,.html"
              style={{ display: 'none' }}
            />
            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="preview-container">
                  <img src={imagePreview} alt="Preview" className="preview-image" />
                  <p>Click to change file</p>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <p>📁 Click to upload file</p>
                  <p>Supports: Images, Videos, Audio, 3D Models, HTML</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Animation URL (Optional)</label>
            <input
              type="url"
              value={form.animation_url}
              onChange={(e) => setForm({...form, animation_url: e.target.value})}
              placeholder="https://example.com/animation.mp4"
            />
          </div>

          <div className="form-group">
            <label>External URL (Optional)</label>
            <input
              type="url"
              value={form.external_url}
              onChange={(e) => setForm({...form, external_url: e.target.value})}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label>YouTube URL (Optional)</label>
            <input
              type="url"
              value={form.youtube_url}
              onChange={(e) => setForm({...form, youtube_url: e.target.value})}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="step-buttons">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button onClick={() => setStep(3)} className="btn-primary">
              Next: Creators & Royalties
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Creators & Royalties */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mint-step"
        >
          <h3>👥 Creators & Royalties</h3>
          
          <div className="creators-section">
            <h4>Creators</h4>
            {creators.map((creator, index) => (
              <div key={index} className="creator-row">
                <input
                  type="text"
                  value={creator.address}
                  onChange={(e) => updateCreator(index, 'address', e.target.value)}
                  placeholder="Creator wallet address"
                  className="creator-address"
                />
                <input
                  type="number"
                  value={creator.share}
                  onChange={(e) => updateCreator(index, 'share', parseInt(e.target.value) || 0)}
                  placeholder="Share %"
                  min="0"
                  max="100"
                  className="creator-share"
                />
                <label className="creator-verified">
                  <input
                    type="checkbox"
                    checked={creator.verified}
                    onChange={(e) => updateCreator(index, 'verified', e.target.checked)}
                  />
                  Verified
                </label>
                {creators.length > 1 && (
                  <button
                    onClick={() => removeCreator(index)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button onClick={addCreator} className="btn-add">
              + Add Creator
            </button>
          </div>

          <div className="form-group">
            <label>Royalty Percentage</label>
            <div className="royalty-input">
              <input
                type="range"
                min="0"
                max="1000"
                value={form.seller_fee_basis_points}
                onChange={(e) => setForm({...form, seller_fee_basis_points: parseInt(e.target.value)})}
                className="royalty-slider"
              />
              <span className="royalty-value">
                {(form.seller_fee_basis_points / 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="step-buttons">
            <button onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button onClick={() => setStep(4)} className="btn-primary">
              Next: Attributes & Collection
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Attributes & Collection */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mint-step"
        >
          <h3>🏷️ Attributes & Collection</h3>
          
          <div className="attributes-section">
            <h4>Attributes (Optional)</h4>
            {attributes.map((attr, index) => (
              <div key={index} className="attribute-row">
                <input
                  type="text"
                  value={attr.trait_type}
                  onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                  placeholder="Trait type (e.g., Color, Rarity)"
                  className="attribute-type"
                />
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="attribute-value"
                />
                <select
                  value={attr.display_type || ''}
                  onChange={(e) => updateAttribute(index, 'display_type', e.target.value as any)}
                  className="attribute-display"
                >
                  <option value="">Default</option>
                  <option value="number">Number</option>
                  <option value="boost_percentage">Boost %</option>
                  <option value="boost_number">Boost #</option>
                  <option value="date">Date</option>
                </select>
                <button
                  onClick={() => removeAttribute(index)}
                  className="btn-remove"
                >
                  Remove
                </button>
              </div>
            ))}
            <button onClick={addAttribute} className="btn-add">
              + Add Attribute
            </button>
          </div>

          <div className="form-group">
            <label>Collection (Optional)</label>
            <input
              type="text"
              value={form.collection}
              onChange={(e) => setForm({...form, collection: e.target.value})}
              placeholder="Collection name"
            />
          </div>

          <div className="form-group">
            <label>Collection Mint Address (Optional)</label>
            <input
              type="text"
              value={form.collectionMint}
              onChange={(e) => setForm({...form, collectionMint: e.target.value})}
              placeholder="Collection mint address"
            />
          </div>

          <div className="social-links">
            <h4>Social Links (Optional)</h4>
            <div className="form-group">
              <label>Twitter</label>
              <input
                type="url"
                value={form.twitter}
                onChange={(e) => setForm({...form, twitter: e.target.value})}
                placeholder="https://twitter.com/username"
              />
            </div>
            <div className="form-group">
              <label>Discord</label>
              <input
                type="url"
                value={form.discord}
                onChange={(e) => setForm({...form, discord: e.target.value})}
                placeholder="https://discord.gg/invite"
              />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({...form, website: e.target.value})}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="step-buttons">
            <button onClick={() => setStep(3)} className="btn-secondary">
              Back
            </button>
            <button onClick={handleMint} className="btn-primary" disabled={loading}>
              {loading ? 'Minting...' : '🚀 Mint NFT'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Status */}
      {status && (
        <div className={`status-message ${status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : 'info'}`}>
          {status}
        </div>
      )}
    </div>
  );
}
