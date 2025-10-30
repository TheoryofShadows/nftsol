/**
 * 🎬 Social Share Component for Echo NFTs
 * Share your Eternal Echoes on social media
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import './EchoSocialShare.css';

interface EchoSocialShareProps {
  echoId: string;
  title: string;
  truthScore: number;
  thumbnailUrl?: string;
}

export const EchoSocialShare: React.FC<EchoSocialShareProps> = ({
  echoId,
  title,
  truthScore,
  thumbnailUrl,
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareUrl = `${window.location.origin}?echo=${echoId}`;
  const shareText = `Check out my Eternal Echo: "${title}" with ${truthScore}% truth score! 🎬✨ #EternalEchoes #NFTSol #Solana`;

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    toast.success('Opening X/Twitter...');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('🔗 Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDownloadCard = () => {
    // TODO: Generate share card image
    toast.info('Share card generation coming soon!');
  };

  return (
    <div className="echo-social-share">
      <motion.button
        className="share-button"
        onClick={() => setShowShareMenu(!showShareMenu)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        📤 Share Echo
      </motion.button>

      {showShareMenu && (
        <motion.div
          className="share-menu"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="share-option twitter" onClick={handleTwitterShare}>
            <span className="share-icon">𝕏</span>
            Share on X/Twitter
          </button>

          <button className="share-option" onClick={handleCopyLink}>
            <span className="share-icon">🔗</span>
            Copy Link
          </button>

          <button className="share-option" onClick={handleDownloadCard}>
            <span className="share-icon">📸</span>
            Download Card
          </button>

          <div className="share-preview">
            <div className="preview-text">{shareText.substring(0, 100)}...</div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EchoSocialShare;
