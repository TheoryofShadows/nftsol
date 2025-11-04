/**
 * 🎯 Unified Dashboard - The Hub for Everything
 * - Create NFTs with ultra-cheap minting
 * - Browse Eternal Echoes live feed
 * - Grok AI verification
 * - View all Solana NFTs from any marketplace
 * - CLOUT token info
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMintCost } from '../hooks/useMintCost';
import { useCloutBalance } from '../hooks/useCloutBalance';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  creator: string;
  date: string;
  mediaType: string;
  archiveUrl: string;
  thumbnailUrl: string;
}

interface VerificationResult {
  score: number;
  confidence: number;
  analysis: {
    factualAccuracy: number;
    sourceReliability: number;
    contentAuthenticity: number;
    biasDetection: number;
  };
  recommendations: string[];
  summary: string;
}

export default function UnifiedDashboard() {
  const { publicKey, connected } = useWallet();
  const { estimate } = useMintCost();
  const { balance: cloutBalance } = useCloutBalance();

  const [activeTab, setActiveTab] = useState<'create' | 'browse' | 'echoes' | 'marketplace'>('echoes');
  const [liveFeed, setLiveFeed] = useState<ArchiveItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Fetch Eternal Echoes live feed
  useEffect(() => {
    if (activeTab === 'echoes') {
      fetchLiveFeed();
    }
  }, [activeTab]);

  const fetchLiveFeed = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/grok/archive/live-feed?limit=20`);
      const data = await response.json();
      if (data.success) {
        setLiveFeed(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch live feed:', error);
    }
  };

  const verifyWithGrok = async (item: ArchiveItem) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`${API_BASE}/api/grok/analyze-eternal-echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archiveUrl: item.archiveUrl,
          description: item.description,
          creator: item.creator,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setVerification(data.data.verification);
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const mintEternalEcho = async () => {
    if (!connected || !publicKey || !selectedItem) return;

    setIsMinting(true);
    try {
      const response = await fetch(`${API_BASE}/api/mint/nft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress: publicKey.toBase58(),
          name: selectedItem.title,
          symbol: 'ECHO',
          description: `${selectedItem.description} | Verified Score: ${verification?.score || 0}/100`,
          imageUrl: selectedItem.thumbnailUrl,
          externalUrl: selectedItem.archiveUrl,
          attributes: [
            { trait_type: 'Type', value: 'Eternal Echo' },
            { trait_type: 'Verification Score', value: `${verification?.score || 0}` },
            { trait_type: 'Source', value: 'Internet Archive' },
            { trait_type: 'Original Date', value: selectedItem.date },
          ],
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Eternal Echo minted! Cost: $${data.costUSD?.toFixed(4) || '0.001'}`);
        setSelectedItem(null);
        setVerification(null);
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert('❌ Minting failed. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header with new CLOUT logo */}
      <div className="glass-modern sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 p-0.5 shadow-neon-lg">
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    NS
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  NFTSOL
                </h1>
                <p className="text-xs text-gray-400">Powered by CLOUT</p>
              </div>
            </div>

            {/* CLOUT Balance */}
            {connected && (
              <div className="glass rounded-xl px-4 py-2 border border-cyan-400/30">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500" />
                  <div>
                    <div className="text-xs text-gray-400">Your CLOUT</div>
                    <div className="text-lg font-bold text-cyan-400">
                      {cloutBalance?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex space-x-2 mb-8">
          {[
            { key: 'echoes', label: '🌌 Eternal Echoes', desc: 'Create & Verify' },
            { key: 'create', label: '⚡ Quick Mint', desc: 'Ultra-Cheap' },
            { key: 'marketplace', label: '🏪 Browse All NFTs', desc: 'Solana-Wide' },
            { key: 'browse', label: '💎 My Collection', desc: 'Your NFTs' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all ${
                activeTab === tab.key
                  ? 'glass-modern border-2 border-cyan-400 text-cyan-400 shadow-neon-lg'
                  : 'glass border border-white/10 text-gray-400 hover:border-purple-500/50'
              }`}
            >
              <div className="text-lg">{tab.label}</div>
              <div className="text-xs opacity-75">{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Eternal Echoes Tab */}
        {activeTab === 'echoes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Feed */}
            <div className="lg:col-span-2">
              <div className="glass-modern rounded-xl p-6 border border-cyan-400/30">
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  🌐 Internet Archive Live Feed
                </h2>
                <p className="text-gray-400 mb-6">
                  Browse historical content from Internet Archive. Select an item to verify with Grok AI.
                </p>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {liveFeed.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`glass rounded-xl p-4 cursor-pointer transition-all hover:border-cyan-400/50 ${
                        selectedItem?.id === item.id
                          ? 'border-2 border-cyan-400 shadow-neon'
                          : 'border border-white/10'
                      }`}
                    >
                      <div className="flex space-x-4">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-20 h-20 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Echo';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-white mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                            {item.description || 'No description available'}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>📅 {item.date}</span>
                            <span>👤 {item.creator}</span>
                            <span className="px-2 py-1 bg-purple-500/20 rounded text-purple-400">
                              {item.mediaType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verification & Minting Panel */}
            <div className="space-y-6">
              {selectedItem ? (
                <>
                  {/* Selected Item */}
                  <div className="glass-modern rounded-xl p-6 border border-purple-500/30">
                    <h3 className="text-xl font-bold mb-4 text-purple-400">
                      📋 Selected Content
                    </h3>
                    <img
                      src={selectedItem.thumbnailUrl}
                      alt={selectedItem.title}
                      className="w-full h-40 rounded-lg object-cover mb-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Echo';
                      }}
                    />
                    <h4 className="font-bold text-white mb-2">{selectedItem.title}</h4>
                    <p className="text-sm text-gray-400 mb-4">{selectedItem.description}</p>

                    {!verification && (
                      <button
                        onClick={() => verifyWithGrok(selectedItem)}
                        disabled={isVerifying}
                        className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-neon-lg disabled:opacity-50"
                      >
                        {isVerifying ? '🤖 Verifying with Grok...' : '🤖 Verify with Grok AI'}
                      </button>
                    )}
                  </div>

                  {/* Verification Results */}
                  {verification && (
                    <div className="glass-modern rounded-xl p-6 border border-green-500/30">
                      <h3 className="text-xl font-bold mb-4 text-green-400">
                        ✅ Verification Results
                      </h3>

                      {/* Overall Score */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400">Truth Score</span>
                          <span className="text-3xl font-bold text-green-400">
                            {verification.score}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-400 to-cyan-400 h-3 rounded-full transition-all"
                            style={{ width: `${verification.score}%` }}
                          />
                        </div>
                      </div>

                      {/* Analysis Breakdown */}
                      <div className="space-y-3 mb-6">
                        {Object.entries(verification.analysis).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm text-gray-400 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-sm font-bold text-cyan-400">{value}/100</span>
                          </div>
                        ))}
                      </div>

                      {/* Recommendations */}
                      <div className="bg-purple-500/10 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-300">{verification.summary}</p>
                      </div>

                      {/* Mint Button */}
                      {verification.score >= 70 ? (
                        <button
                          onClick={mintEternalEcho}
                          disabled={!connected || isMinting}
                          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-600 hover:to-cyan-700 text-white font-bold rounded-xl transition-all shadow-neon-lg disabled:opacity-50"
                        >
                          {isMinting
                            ? '⚡ Minting...'
                            : `✨ Mint Eternal Echo (~$${estimate?.usdCost.toFixed(4) || '0.001'})`}
                        </button>
                      ) : (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                          <p className="text-red-400 font-semibold">
                            ⚠️ Score too low for minting
                          </p>
                          <p className="text-sm text-gray-400 mt-2">
                            Content needs score ≥70 for minting
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="glass-modern rounded-xl p-12 border border-white/10 text-center">
                  <div className="text-6xl mb-4">🌌</div>
                  <h3 className="text-xl font-bold text-gray-400 mb-2">
                    Select an item from the feed
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose content to verify with Grok AI
                  </p>
                </div>
              )}

              {/* Cost Info */}
              <div className="glass rounded-xl p-4 border border-cyan-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Mint Cost</span>
                  <span className="text-lg font-bold text-cyan-400">
                    ${estimate?.usdCost.toFixed(4) || '0.001'}
                  </span>
                </div>
                <div className="text-xs text-green-400 mt-2">
                  95%+ cheaper than competitors!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs */}
        {activeTab !== 'echoes' && (
          <div className="glass-modern rounded-xl p-12 border border-white/10 text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              {activeTab === 'create' && 'Quick Mint - Coming Soon'}
              {activeTab === 'marketplace' && 'Marketplace Browser - Coming Soon'}
              {activeTab === 'browse' && 'My Collection - Coming Soon'}
            </h3>
            <p className="text-gray-500">
              This feature is being integrated
            </p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #a855f7);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

