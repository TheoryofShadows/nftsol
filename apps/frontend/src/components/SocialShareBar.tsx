import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import analytics from '../utils/analytics';
import './SocialShareBar.css';

interface SocialShareBarProps {
  content: {
    title: string;
    description: string;
    url: string;
    image?: string;
    hashtags?: string[];
  };
  contentType: 'nft' | 'marketplace' | 'mint' | 'clout' | 'general';
  position?: 'floating' | 'inline';
  showScreenshot?: boolean;
  onScreenshot?: () => void;
}

interface ShareTemplate {
  platform: string;
  icon: string;
  color: string;
  url: string;
  text: string;
}

export default function SocialShareBar({
  content,
  contentType,
  position = 'floating',
  showScreenshot = false,
  onScreenshot
}: SocialShareBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate share templates based on content type
  const getShareTemplates = (): ShareTemplate[] => {
    const baseUrl = content.url || window.location.href;
    const baseText = content.title;
    const hashtags = content.hashtags || ['NFTSol', 'Solana', 'NFTs', 'Web3'];

    const templates: ShareTemplate[] = [
      {
        platform: 'Twitter',
        icon: '🐦',
        color: '#1DA1F2',
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(baseText)}&url=${encodeURIComponent(baseUrl)}&hashtags=${hashtags.join(',')}`,
        text: baseText
      },
      {
        platform: 'Discord',
        icon: '💬',
        color: '#5865F2',
        url: `https://discord.com/channels/@me`,
        text: `Check this out: ${baseText} ${baseUrl}`
      }
    ];

    // Add content-specific templates
    switch (contentType) {
      case 'nft':
        templates.push({
          platform: 'Reddit',
          icon: '🤖',
          color: '#FF4500',
          url: `https://reddit.com/submit?title=${encodeURIComponent(baseText)}&url=${encodeURIComponent(baseUrl)}`,
          text: baseText
        });
        break;
      case 'mint':
        templates.unshift({
          platform: 'Twitter',
          icon: '🚀',
          color: '#1DA1F2',
          url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just minted on @NFTSol for 0.0001 SOL! 🔥 Compressed NFTs + CLOUT rewards. Try it: ${baseUrl}`)}&hashtags=${hashtags.join(',')}`,
          text: `Just minted on @NFTSol for 0.0001 SOL! 🔥 Compressed NFTs + CLOUT rewards. Try it: ${baseUrl}`
        });
        break;
      case 'marketplace':
        templates.unshift({
          platform: 'Twitter',
          icon: '🏪',
          color: '#1DA1F2',
          url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this NFT on @NFTSol - the revolutionary Solana marketplace with Metaplex v3: ${baseUrl}`)}&hashtags=${hashtags.join(',')}`,
          text: `Check out this NFT on @NFTSol - the revolutionary Solana marketplace with Metaplex v3: ${baseUrl}`
        });
        break;
      case 'clout':
        templates.unshift({
          platform: 'Twitter',
          icon: '⚡',
          color: '#1DA1F2',
          url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Earning CLOUT on @NFTSol! ⚡ Revolutionary token economy with fee reductions and governance. Join: ${baseUrl}`)}&hashtags=${hashtags.join(',')}`,
          text: `Earning CLOUT on @NFTSol! ⚡ Revolutionary token economy with fee reductions and governance. Join: ${baseUrl}`
        });
        break;
    }

    return templates;
  };

  const shareTemplates = getShareTemplates();

  const handleShare = (template: ShareTemplate) => {
    // Track analytics
    analytics.trackSocialShare(template.platform, contentType);

    // Open share URL
    window.open(template.url, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(content.url || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Track analytics
      analytics.trackSocialShare('copy_link', contentType);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleScreenshot = () => {
    if (onScreenshot) {
      onScreenshot();
      analytics.trackCustomEvent('screenshot_captured', {
        content_type: contentType,
        content_title: content.title
      });
    }
  };

  const containerClass = `social-share-bar ${position} ${isOpen ? 'open' : ''}`;

  return (
    <div className={containerClass}>
      {/* Toggle Button */}
      <motion.button
        className="share-toggle"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Share content"
      >
        <span className="share-icon">📤</span>
        <span className="share-text">Share</span>
      </motion.button>

      {/* Share Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="share-options"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="share-header">
              <h4>Share on Social Media</h4>
              <button
                className="close-options"
                onClick={() => setIsOpen(false)}
                aria-label="Close share options"
              >
                ✕
              </button>
            </div>

            <div className="share-buttons">
              {shareTemplates.map((template, index) => (
                <motion.button
                  key={template.platform}
                  className="share-button"
                  style={{ '--platform-color': template.color } as React.CSSProperties}
                  onClick={() => handleShare(template)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="platform-icon">{template.icon}</span>
                  <span className="platform-name">{template.platform}</span>
                </motion.button>
              ))}

              <motion.button
                className="share-button copy-link"
                onClick={handleCopyLink}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: shareTemplates.length * 0.1 }}
              >
                <span className="platform-icon">{copied ? '✅' : '🔗'}</span>
                <span className="platform-name">{copied ? 'Copied!' : 'Copy Link'}</span>
              </motion.button>

              {showScreenshot && onScreenshot && (
                <motion.button
                  className="share-button screenshot"
                  onClick={handleScreenshot}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (shareTemplates.length + 1) * 0.1 }}
                >
                  <span className="platform-icon">📸</span>
                  <span className="platform-name">Screenshot</span>
                </motion.button>
              )}
            </div>

            {/* Content Preview */}
            <div className="content-preview">
              <div className="preview-image">
                {content.image ? (
                  <img src={content.image} alt="Content preview" />
                ) : (
                  <div className="placeholder-image">
                    <span>🖼️</span>
                  </div>
                )}
              </div>
              <div className="preview-text">
                <h5>{content.title}</h5>
                <p>{content.description}</p>
                <div className="preview-url">
                  <span>🔗</span>
                  <span>{content.url || window.location.href}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button
                className="quick-action"
                onClick={() => {
                  const text = `Check out ${content.title} on NFTSol! ${content.url || window.location.href}`;
                  navigator.share?.({
                    title: content.title,
                    text: text,
                    url: content.url || window.location.href
                  });
                }}
                disabled={!navigator.share}
              >
                <span>📱</span>
                Native Share
              </button>
              
              <button
                className="quick-action"
                onClick={() => {
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(content.url || window.location.href)}`;
                  window.open(qrUrl, '_blank');
                }}
              >
                <span>📱</span>
                QR Code
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
