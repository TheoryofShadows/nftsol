/**
 * 🌊 Eternal Echoes Component
 * Frontend interface for collaborative history remixing
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';

interface IAVideo {
  identifier: string;
  title: string;
  description: string;
  creator: string;
  date: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
}

interface EchoLedger {
  id: string;
  iaId: string;
  truthHash: string;
  owner: string;
  echoCount: number;
  maxEchoes: number;
  videoUri: string;
  truthScore: number;
  createdAt: number;
  echoes: any[];
}

interface GrokVerification {
  summary: string;
  score: number;
  verified: boolean;
  timestamp: number;
}

const EternalEchoes: React.FC = () => {
  const { publicKey, connected, wallet, connect } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IAVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<IAVideo | null>(null);
  const [echoLedger, setEchoLedger] = useState<EchoLedger | null>(null);
  const [newEcho, setNewEcho] = useState('');
  const [echoType, setEchoType] = useState<'text' | 'audio' | 'annotation'>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [verification, setVerification] = useState<GrokVerification | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'create' | 'explore'>('search');
  const [isMobile, setIsMobile] = useState(false);
  const [walletDetectionError, setWalletDetectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  // Mobile detection and wallet enhancement
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileDevice || isTouchDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced wallet connection with retry logic
  const connectWallet = async () => {
    if (!wallet) {
      setWalletDetectionError('No wallet detected. Please install Phantom, Solflare, or another Solana wallet.');
      return;
    }

    setIsConnecting(true);
    setWalletDetectionError(null);

    try {
      await connect();
      setRetryCount(0);
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      setWalletDetectionError(error.message || 'Failed to connect wallet. Please try again.');
      
      // Retry logic for mobile wallets
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connectWallet();
        }, 2000);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto-retry wallet connection on mobile
  useEffect(() => {
    if (isMobile && !connected && !wallet && retryCount === 0) {
      const timer = setTimeout(() => {
        connectWallet();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, connected, wallet, retryCount]);

  // Search Internet Archive videos with enhanced error handling
  const searchVideos = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/eternal-echoes/search?query=${encodeURIComponent(searchQuery)}&rows=20`);
      setSearchResults(response.data.videos || []);
    } catch (error: any) {
      console.error('Search failed:', error);
      
      // Enhanced error handling for different scenarios
      if (error.response?.status === 429) {
        alert('⚠️ Too many requests. Please wait a moment and try again.');
      } else if (error.response?.status >= 500) {
        alert('🔧 Server error. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        alert('⏰ Request timeout. Please check your connection and try again.');
      } else if (error.response?.status === 404) {
        alert('❌ Search service not available. Please try again later.');
      } else {
        alert('❌ Search failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mint base echo from selected video
  const mintBaseEcho = async () => {
    if (!selectedVideo || !publicKey) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post('/api/eternal-echoes/mint-base', {
        iaId: selectedVideo.identifier,
        creatorWallet: publicKey.toString(),
        iaVideo: selectedVideo
      });
      
      if (response.data.success) {
        setEchoLedger({
          id: response.data.ledgerId,
          iaId: selectedVideo.identifier,
          truthHash: '',
          owner: publicKey.toString(),
          echoCount: 0,
          maxEchoes: 100,
          videoUri: '',
          truthScore: 85,
          createdAt: Date.now(),
          echoes: []
        });
        setActiveTab('create');
      }
    } catch (error) {
      console.error('Mint failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add echo to ledger
  const addEcho = async () => {
    if (!echoLedger || !newEcho.trim() || !publicKey) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post('/api/eternal-echoes/add-echo', {
        ledgerId: echoLedger.id,
        echoData: newEcho,
        contributor: publicKey.toString(),
        echoType
      });
      
      if (response.data.success) {
        setNewEcho('');
        // Refresh ledger
        loadEchoLedger(echoLedger.id);
      }
    } catch (error) {
      console.error('Add echo failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load echo ledger
  const loadEchoLedger = async (ledgerId: string) => {
    try {
      const response = await axios.get(`/api/eternal-echoes/ledger/${ledgerId}`);
      if (response.data.success) {
        setEchoLedger(response.data.ledger);
      }
    } catch (error) {
      console.error('Load ledger failed:', error);
    }
  };

  // Verify content
  const verifyContent = async (content: string) => {
    try {
      const response = await axios.post('/api/eternal-echoes/verify-content', { content });
      if (response.data.success) {
        setVerification(response.data.verification);
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  // Re-verify all echoes
  const reVerifyEchoes = async () => {
    if (!echoLedger) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/eternal-echoes/verify/${echoLedger.id}`);
      if (response.data.success) {
        loadEchoLedger(echoLedger.id);
      }
    } catch (error) {
      console.error('Re-verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            🌊 Eternal Echoes
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transform public domain videos into collaborative, on-chain cNFTs. 
            Remix history with verified truth and earn CLOUT tokens.
          </p>
        </motion.div>

        {/* Enhanced Wallet Connection Check */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center mb-8"
          >
            <h3 className="text-xl font-semibold mb-2">🔗 Wallet Required</h3>
            <p className="text-gray-300 mb-4">
              Connect your Solana wallet to create and contribute to Eternal Echoes.
            </p>
            
            {/* Mobile-specific wallet detection */}
            {isMobile && (
              <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
                <h4 className="text-lg font-semibold mb-2">📱 Mobile Wallet Detection</h4>
                <p className="text-sm text-gray-300 mb-3">
                  {wallet ? `Detected: ${wallet.adapter.name}` : 'Scanning for wallets...'}
                </p>
                {walletDetectionError && (
                  <p className="text-red-400 text-sm mb-3">{walletDetectionError}</p>
                )}
                {retryCount > 0 && (
                  <p className="text-yellow-400 text-sm mb-3">
                    Retry attempt {retryCount}/3...
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={connectWallet}
                disabled={isConnecting || !wallet}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
              
              <button
                onClick={() => window.location.href = '/#/mobile'}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                {isMobile ? 'Open Wallet App' : 'Mobile Wallet Setup'}
              </button>
            </div>

            {/* Wallet installation guide for mobile */}
            {isMobile && !wallet && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-lg font-semibold mb-2">📲 Install a Solana Wallet</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <a
                    href="https://phantom.app/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-purple-600/20 border border-purple-500 rounded hover:bg-purple-600/30 transition-colors"
                  >
                    <span>👻</span>
                    <span>Phantom</span>
                  </a>
                  <a
                    href="https://solflare.com/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-blue-600/20 border border-blue-500 rounded hover:bg-blue-600/30 transition-colors"
                  >
                    <span>🔥</span>
                    <span>Solflare</span>
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 rounded-lg p-1 flex">
            {[
              { id: 'search', label: '🔍 Search Archive', icon: '🔍' },
              { id: 'create', label: '✨ Create Echo', icon: '✨' },
              { id: 'explore', label: '🌊 Explore Echoes', icon: '🌊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Search Form */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Search Internet Archive</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for public domain videos..."
                  className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                />
                <button
                  onClick={searchVideos}
                  disabled={isLoading || !searchQuery.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-purple-600 transition-all"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((video) => (
                  <motion.div
                    key={video.identifier}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 rounded-lg overflow-hidden hover:bg-gray-700/50 transition-all cursor-pointer"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
                      <p className="text-gray-400 text-sm mb-2 line-clamp-3">{video.description}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{video.creator}</span>
                        <span>{video.date}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Selected Video */}
            {selectedVideo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800/50 rounded-lg p-6"
              >
                <h3 className="text-2xl font-semibold mb-4">Selected Video</h3>
                <div className="flex gap-6">
                  <img
                    src={selectedVideo.thumbnail}
                    alt={selectedVideo.title}
                    className="w-64 h-48 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold mb-2">{selectedVideo.title}</h4>
                    <p className="text-gray-300 mb-4">{selectedVideo.description}</p>
                    <div className="flex gap-4">
                      <button
                        onClick={mintBaseEcho}
                        disabled={!connected || isLoading}
                        className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-blue-600 transition-all"
                      >
                        {isLoading ? 'Minting...' : 'Mint Base Echo'}
                      </button>
                      <button
                        onClick={() => verifyContent(selectedVideo.description)}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all"
                      >
                        Verify Content
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Create Tab */}
        {activeTab === 'create' && echoLedger && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Echo Ledger Info */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Echo Ledger</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-cyan-400">Truth Score</h3>
                  <p className="text-3xl font-bold">{echoLedger.truthScore}/100</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-400">Echoes</h3>
                  <p className="text-3xl font-bold">{echoLedger.echoCount}/{echoLedger.maxEchoes}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-400">Status</h3>
                  <p className="text-lg font-semibold">Active</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={reVerifyEchoes}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-600 hover:to-orange-600 transition-all"
                >
                  {isLoading ? 'Re-verifying...' : 'Re-verify All Echoes'}
                </button>
              </div>
            </div>

            {/* Add Echo Form */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Add New Echo</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Echo Type</label>
                  <select
                    value={echoType}
                    onChange={(e) => setEchoType(e.target.value as any)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="text">📝 Text Echo</option>
                    <option value="audio">🎵 Audio Echo</option>
                    <option value="annotation">📋 Annotation</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Echo Content</label>
                  <textarea
                    value={newEcho}
                    onChange={(e) => setNewEcho(e.target.value)}
                    placeholder="Add your echo to the collaborative history..."
                    rows={4}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={addEcho}
                    disabled={!newEcho.trim() || isLoading}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-purple-600 transition-all"
                  >
                    {isLoading ? 'Adding...' : 'Add Echo'}
                  </button>
                  <button
                    onClick={() => verifyContent(newEcho)}
                    disabled={!newEcho.trim()}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-600 hover:to-orange-600 transition-all"
                  >
                    Verify Content
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Result */}
            {verification && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg p-6 ${
                  verification.verified 
                    ? 'bg-green-900/20 border border-green-500' 
                    : 'bg-red-900/20 border border-red-500'
                }`}
              >
                <h3 className="text-xl font-semibold mb-2">
                  {verification.verified ? '✅ Verified Content' : '❌ Unverified Content'}
                </h3>
                <p className="text-gray-300 mb-2">
                  <strong>Score:</strong> {verification.score}/100
                </p>
                <p className="text-gray-300">
                  <strong>Summary:</strong> {verification.summary}
                </p>
              </motion.div>
            )}

            {/* Echoes List */}
            {echoLedger.echoes.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Echoes ({echoLedger.echoes.length})</h3>
                <div className="space-y-4">
                  {echoLedger.echoes.map((echo, index) => (
                    <div key={echo.id} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-gray-400">
                          Echo #{index + 1} • {echo.echoType} • {new Date(echo.timestamp).toLocaleString()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          echo.grokVerified 
                            ? 'bg-green-900/50 text-green-400' 
                            : 'bg-red-900/50 text-red-400'
                        }`}>
                          {echo.grokVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      <p className="text-gray-300">{echo.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Explore Tab */}
        {activeTab === 'explore' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <h2 className="text-3xl font-semibold mb-4">Explore Echoes</h2>
            <p className="text-gray-300 mb-8">
              Discover collaborative history remixes from the community.
            </p>
            <div className="bg-gray-800/50 rounded-lg p-8">
              <p className="text-gray-400">
                Coming soon: Browse and explore existing Eternal Echoes from the community.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EternalEchoes;
