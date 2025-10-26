import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiscordMessage {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  channel: string;
  reactions?: Array<{
    emoji: string;
    count: number;
  }>;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  memberCount: number;
  unreadCount?: number;
}

interface DiscordWidgetProps {
  serverId?: string;
  maxMessages?: number;
  channels?: DiscordChannel[];
  showOnlineCount?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function DiscordWidget({
  serverId = 'nftsol-community',
  maxMessages = 20,
  channels = [
    { id: 'general', name: 'general', type: 'text', memberCount: 1250, unreadCount: 3 },
    { id: 'nft-chat', name: 'nft-chat', type: 'text', memberCount: 890, unreadCount: 0 },
    { id: 'trading', name: 'trading', type: 'text', memberCount: 650, unreadCount: 1 },
    { id: 'announcements', name: 'announcements', type: 'announcement', memberCount: 1250, unreadCount: 0 }
  ],
  showOnlineCount = true,
  autoRefresh = true,
  refreshInterval = 15000
}: DiscordWidgetProps) {
  const [selectedChannel, setSelectedChannel] = useState(channels[0]?.id || 'general');
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock data for demonstration
  const mockMessages: DiscordMessage[] = [
    {
      id: '1',
      author: 'NFTSolBot',
      authorAvatar: 'https://via.placeholder.com/32x32/9945FF/FFFFFF?text=NS',
      content: 'Welcome to the NFTSol Discord! 🚀 Our revolutionary NFT platform is now live with CLOUT token rewards!',
      timestamp: Date.now() - 1000 * 60 * 5,
      channel: 'announcements',
      reactions: [
        { emoji: '🚀', count: 15 },
        { emoji: '💎', count: 8 },
        { emoji: '🔥', count: 12 }
      ]
    },
    {
      id: '2',
      author: 'CryptoWhale',
      authorAvatar: 'https://via.placeholder.com/32x32/20F195/FFFFFF?text=CW',
      content: 'Just minted 5 NFTs on the platform! The CLOUT rewards are insane 🔥',
      timestamp: Date.now() - 1000 * 60 * 15,
      channel: 'nft-chat',
      reactions: [
        { emoji: '🔥', count: 5 },
        { emoji: '💎', count: 3 }
      ]
    },
    {
      id: '3',
      author: 'NFTCollector',
      authorAvatar: 'https://via.placeholder.com/32x32/14F195/FFFFFF?text=NC',
      content: 'The universal wallet integration is so smooth! No more switching between platforms',
      timestamp: Date.now() - 1000 * 60 * 30,
      channel: 'general',
      reactions: [
        { emoji: '👍', count: 7 },
        { emoji: '💯', count: 4 }
      ]
    },
    {
      id: '4',
      author: 'SolanaDev',
      authorAvatar: 'https://via.placeholder.com/32x32/9945FF/FFFFFF?text=SD',
      content: 'Anyone else excited about the upcoming features? Time capsules and AI rarity scoring sound amazing!',
      timestamp: Date.now() - 1000 * 60 * 45,
      channel: 'general',
      reactions: [
        { emoji: '🤖', count: 6 },
        { emoji: '⏰', count: 3 },
        { emoji: '✨', count: 8 }
      ]
    }
  ];

  useEffect(() => {
    loadMessages();
    loadOnlineCount();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadMessages();
        loadOnlineCount();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedChannel, autoRefresh, refreshInterval]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const channelMessages = mockMessages
        .filter(msg => msg.channel === selectedChannel)
        .slice(0, maxMessages);
      
      setMessages(channelMessages);
    } catch (error) {
      console.error('Failed to load Discord messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineCount = async () => {
    // Simulate online count
    setOnlineCount(Math.floor(Math.random() * 200) + 150);
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const getChannelIcon = (channel: DiscordChannel): string => {
    switch (channel.type) {
      case 'text': return '#';
      case 'voice': return '🔊';
      case 'announcement': return '📢';
      default: return '#';
    }
  };

  const selectedChannelData = channels.find(ch => ch.id === selectedChannel);

  return (
    <div className={`discord-widget ${isExpanded ? 'expanded' : ''}`}>
      <div className="discord-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="discord-logo">
          <span className="discord-icon">💬</span>
          <div className="discord-info">
            <h4>NFTSol Community</h4>
            {showOnlineCount && (
              <span className="online-count">
                <span className="online-dot"></span>
                {onlineCount} online
              </span>
            )}
          </div>
        </div>
        <motion.button
          className="expand-button"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="discord-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="discord-channels">
              <h5>Channels</h5>
              {channels.map(channel => (
                <button
                  key={channel.id}
                  className={`channel-item ${selectedChannel === channel.id ? 'active' : ''}`}
                  onClick={() => setSelectedChannel(channel.id)}
                >
                  <span className="channel-icon">
                    {getChannelIcon(channel)}
                  </span>
                  <span className="channel-name">{channel.name}</span>
                  {channel.unreadCount && channel.unreadCount > 0 && (
                    <span className="unread-badge">{channel.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="discord-messages">
              <div className="messages-header">
                <h5>
                  {getChannelIcon(selectedChannelData!)}
                  {selectedChannelData?.name}
                </h5>
                <span className="member-count">
                  {selectedChannelData?.memberCount} members
                </span>
              </div>

              {loading ? (
                <div className="messages-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading messages...</p>
                </div>
              ) : (
                <div className="messages-list">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        className="discord-message"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <img 
                          src={message.authorAvatar} 
                          alt={message.author}
                          className="message-avatar"
                        />
                        <div className="message-content">
                          <div className="message-header">
                            <span className="message-author">{message.author}</span>
                            <span className="message-time">
                              {formatTimestamp(message.timestamp)}
                            </span>
                          </div>
                          <div className="message-text">{message.content}</div>
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="message-reactions">
                              {message.reactions.map((reaction, idx) => (
                                <button key={idx} className="reaction">
                                  <span className="reaction-emoji">{reaction.emoji}</span>
                                  <span className="reaction-count">{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {messages.length === 0 && !loading && (
                <div className="empty-messages">
                  <p>No messages in this channel yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
