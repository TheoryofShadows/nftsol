import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';

interface SocialPost {
  id: string;
  platform: 'twitter' | 'discord';
  author: string;
  authorHandle: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  likes: number;
  retweets?: number;
  replies?: number;
  media?: {
    type: 'image' | 'video';
    url: string;
    alt?: string;
  }[];
  nftMention?: {
    name: string;
    image: string;
    collection: string;
    price?: string;
  };
}

interface SocialFeedProps {
  maxPosts?: number;
  platforms?: ('twitter' | 'discord')[];
  showNFTMentions?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function SocialFeed({
  maxPosts = 10,
  platforms = ['twitter', 'discord'],
  showNFTMentions = true,
  autoRefresh = true,
  refreshInterval = 30000
}: SocialFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'twitter' | 'discord'>('all');
  const { isConnected } = useWebSocket();

  // Mock data for demonstration - in production, this would come from APIs
  const mockPosts: SocialPost[] = [
    {
      id: '1',
      platform: 'twitter',
      author: 'NFTSol Official',
      authorHandle: '@NFTSolMarket',
      authorAvatar: 'https://via.placeholder.com/40x40/9945FF/FFFFFF?text=NS',
      content: '🚀 Just launched our revolutionary CLOUT token system! Earn rewards for every NFT trade. The future of trust-based payments is here! #NFTSol #CLOUT #Solana',
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      likes: 42,
      retweets: 18,
      replies: 7,
      nftMention: {
        name: 'Genesis CLOUT NFT',
        image: 'https://via.placeholder.com/200x200/9945FF/FFFFFF?text=CLOUT',
        collection: 'NFTSol Genesis',
        price: '0.5 SOL'
      }
    },
    {
      id: '2',
      platform: 'discord',
      author: 'CryptoTrader99',
      authorHandle: 'CryptoTrader99#1234',
      authorAvatar: 'https://via.placeholder.com/40x40/20F195/FFFFFF?text=CT',
      content: 'Just minted my first NFT on NFTSol! The process was so smooth and the CLOUT rewards are already stacking up 💎',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      likes: 15,
      replies: 3
    },
    {
      id: '3',
      platform: 'twitter',
      author: 'SolanaDev',
      authorHandle: '@SolanaDev',
      authorAvatar: 'https://via.placeholder.com/40x40/14F195/FFFFFF?text=SD',
      content: 'The universal wallet integration on NFTSol is game-changing. No more switching between different platforms! 🔥',
      timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
      likes: 28,
      retweets: 12,
      replies: 5
    }
  ];

  useEffect(() => {
    loadPosts();
    
    if (autoRefresh) {
      const interval = setInterval(loadPosts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter posts by platform
      const filteredPosts = selectedPlatform === 'all' 
        ? mockPosts 
        : mockPosts.filter(post => post.platform === selectedPlatform);
      
      setPosts(filteredPosts.slice(0, maxPosts));
    } catch (err) {
      setError('Failed to load social posts');
      console.error('Social feed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getPlatformIcon = (platform: string): string => {
    switch (platform) {
      case 'twitter': return '🐦';
      case 'discord': return '💬';
      default: return '📱';
    }
  };

  const getPlatformColor = (platform: string): string => {
    switch (platform) {
      case 'twitter': return '#1DA1F2';
      case 'discord': return '#5865F2';
      default: return '#9945FF';
    }
  };

  const filteredPosts = selectedPlatform === 'all' 
    ? posts 
    : posts.filter(post => post.platform === selectedPlatform);

  return (
    <div className="social-feed">
      <div className="social-feed-header">
        <h3 className="social-feed-title">
          <span className="social-icon">📱</span>
          Social Feed
          {isConnected && <span className="live-indicator">• LIVE</span>}
        </h3>
        
        <div className="platform-filters">
          <button
            className={`platform-filter ${selectedPlatform === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedPlatform('all')}
          >
            All
          </button>
          <button
            className={`platform-filter ${selectedPlatform === 'twitter' ? 'active' : ''}`}
            onClick={() => setSelectedPlatform('twitter')}
          >
            🐦 Twitter
          </button>
          <button
            className={`platform-filter ${selectedPlatform === 'discord' ? 'active' : ''}`}
            onClick={() => setSelectedPlatform('discord')}
          >
            💬 Discord
          </button>
        </div>
      </div>

      {loading && (
        <div className="social-feed-loading">
          <div className="loading-spinner"></div>
          <p>Loading social posts...</p>
        </div>
      )}

      {error && (
        <div className="social-feed-error">
          <p>❌ {error}</p>
          <button onClick={loadPosts} className="btn-secondary">
            Try Again
          </button>
        </div>
      )}

      <div className="social-posts">
        <AnimatePresence>
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              className="social-post"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="post-header">
                <div className="author-info">
                  <img 
                    src={post.authorAvatar} 
                    alt={post.author}
                    className="author-avatar"
                  />
                  <div className="author-details">
                    <div className="author-name">{post.author}</div>
                    <div className="author-handle">{post.authorHandle}</div>
                  </div>
                </div>
                
                <div className="post-meta">
                  <span 
                    className="platform-badge"
                    style={{ backgroundColor: getPlatformColor(post.platform) }}
                  >
                    {getPlatformIcon(post.platform)}
                  </span>
                  <span className="post-time">{formatTimestamp(post.timestamp)}</span>
                </div>
              </div>

              <div className="post-content">
                <p>{post.content}</p>
                
                {post.media && post.media.length > 0 && (
                  <div className="post-media">
                    {post.media.map((media, idx) => (
                      <img
                        key={idx}
                        src={media.url}
                        alt={media.alt || 'Post media'}
                        className="media-image"
                      />
                    ))}
                  </div>
                )}

                {post.nftMention && showNFTMentions && (
                  <div className="nft-mention">
                    <div className="nft-mention-header">
                      <span className="nft-icon">🖼️</span>
                      <span className="nft-label">NFT Mentioned</span>
                    </div>
                    <div className="nft-mention-content">
                      <img 
                        src={post.nftMention.image} 
                        alt={post.nftMention.name}
                        className="nft-image"
                      />
                      <div className="nft-details">
                        <div className="nft-name">{post.nftMention.name}</div>
                        <div className="nft-collection">{post.nftMention.collection}</div>
                        {post.nftMention.price && (
                          <div className="nft-price">{post.nftMention.price}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="post-actions">
                <button className="action-btn">
                  <span className="action-icon">💬</span>
                  <span className="action-count">{post.replies || 0}</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">🔄</span>
                  <span className="action-count">{post.retweets || 0}</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">❤️</span>
                  <span className="action-count">{post.likes}</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">📤</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredPosts.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📱</div>
          <h4>No posts found</h4>
          <p>Check back later for new social updates!</p>
        </div>
      )}
    </div>
  );
}
