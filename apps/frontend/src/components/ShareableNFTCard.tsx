import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import IpfsImage from './IpfsImage';

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: string;
  collection: string;
  owner: string;
  rarity?: number;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface ShareableNFTCardProps {
  nft: NFT;
  onShare?: (platform: string, url: string) => void;
  showShareButtons?: boolean;
  showQRCode?: boolean;
  customMessage?: string;
}

export default function ShareableNFTCard({
  nft,
  onShare,
  showShareButtons = true,
  showQRCode = false,
  customMessage
}: ShareableNFTCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    const nftUrl = `${baseUrl}/nft/${nft.id}`;
    setShareUrl(nftUrl);
    return nftUrl;
  };

  const generateQRCode = async () => {
    if (!shareUrl) {
      generateShareUrl();
    }
    
    setIsGenerating(true);
    try {
      // In production, this would call a QR code generation service
      const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
      setQrCodeUrl(qrCodeApiUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToTwitter = () => {
    const url = shareUrl || generateShareUrl();
    const text = customMessage || `Check out this amazing NFT: ${nft.name} from ${nft.collection}! 🚀 #NFTSol #NFT #Solana`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
    onShare?.('twitter', url);
  };

  const shareToDiscord = () => {
    const url = shareUrl || generateShareUrl();
    const text = customMessage || `**${nft.name}** from ${nft.collection}\n${url}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert('Discord message copied to clipboard!');
    });
    onShare?.('discord', url);
  };

  const shareToTelegram = () => {
    const url = shareUrl || generateShareUrl();
    const text = customMessage || `${nft.name} from ${nft.collection} - ${url}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
    onShare?.('telegram', url);
  };

  const copyLink = () => {
    const url = shareUrl || generateShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const downloadImage = () => {
    if (cardRef.current) {
      // In production, this would use html2canvas or similar
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // This is a simplified version - in production you'd render the card to canvas
        const link = document.createElement('a');
        link.download = `${nft.name}-nftsol-card.png`;
        link.href = nft.image;
        link.click();
      }
    }
  };

  const formatPrice = (price?: string) => {
    if (!price) return 'Not for sale';
    return `${price} SOL`;
  };

  const getRarityColor = (rarity?: number) => {
    if (!rarity) return '#666';
    if (rarity >= 90) return '#FFD700'; // Gold
    if (rarity >= 70) return '#C0C0C0'; // Silver
    if (rarity >= 50) return '#CD7F32'; // Bronze
    return '#666';
  };

  return (
    <div className="shareable-nft-card" ref={cardRef}>
      <div className="card-header">
        <div className="nft-info">
          <h3 className="nft-name">{nft.name}</h3>
          <p className="nft-collection">{nft.collection}</p>
        </div>
        <div className="nft-price">
          {nft.price && (
            <span className="price-amount">{formatPrice(nft.price)}</span>
          )}
        </div>
      </div>

      <div className="card-image">
        <IpfsImage
          src={nft.image}
          alt={nft.name}
          className="nft-image"
          quality={90}
          sizes="(max-width: 400px) 100vw, 400px"
        />
        {nft.rarity && (
          <div 
            className="rarity-badge"
            style={{ backgroundColor: getRarityColor(nft.rarity) }}
          >
            {nft.rarity}% Rare
          </div>
        )}
      </div>

      <div className="card-content">
        <p className="nft-description">{nft.description}</p>
        
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="nft-attributes">
            <h4>Attributes</h4>
            <div className="attributes-grid">
              {nft.attributes.slice(0, 4).map((attr, index) => (
                <div key={index} className="attribute-item">
                  <span className="attribute-type">{attr.trait_type}</span>
                  <span className="attribute-value">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="nft-meta">
          <div className="meta-item">
            <span className="meta-label">Owner:</span>
            <span className="meta-value">
              {nft.owner.slice(0, 4)}...{nft.owner.slice(-4)}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Platform:</span>
            <span className="meta-value">NFTSol</span>
          </div>
        </div>
      </div>

      {showShareButtons && (
        <div className="share-buttons">
          <motion.button
            className="share-btn twitter"
            onClick={shareToTwitter}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🐦 Twitter
          </motion.button>
          
          <motion.button
            className="share-btn discord"
            onClick={shareToDiscord}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💬 Discord
          </motion.button>
          
          <motion.button
            className="share-btn telegram"
            onClick={shareToTelegram}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📱 Telegram
          </motion.button>
          
          <motion.button
            className="share-btn copy"
            onClick={copyLink}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📋 Copy Link
          </motion.button>
          
          <motion.button
            className="share-btn download"
            onClick={downloadImage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💾 Download
          </motion.button>
        </div>
      )}

      {showQRCode && (
        <div className="qr-code-section">
          <button 
            className="qr-generate-btn"
            onClick={generateQRCode}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate QR Code'}
          </button>
          
          {qrCodeUrl && (
            <div className="qr-code">
              <img src={qrCodeUrl} alt="QR Code" />
              <p>Scan to view NFT</p>
            </div>
          )}
        </div>
      )}

      <div className="card-footer">
        <div className="nftsol-branding">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Powered by NFTSol</span>
        </div>
        <div className="share-url">
          {shareUrl || generateShareUrl()}
        </div>
      </div>
    </div>
  );
}
