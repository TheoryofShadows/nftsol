/**
 * 🎬 Eternal Echoes - Viewer Component
 * View base NFT + collaborative echo layers
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from 'react-toastify';
import './EchoViewer.css';

interface Echo {
  id: string;
  echoData: string;
  echoType: 'Text' | 'Audio' | 'Annotation';
  contributor: string;
  grokVerified: boolean;
  verificationScore: number;
  timestamp: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const EchoViewer: React.FC = () => {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();
  const [ledgerId, setLedgerId] = useState<string | null>(null);

  // Get ledger ID from localStorage or URL hash
  useEffect(() => {
    const storedLedger = localStorage.getItem('currentEchoLedger');
    if (storedLedger) {
      setLedgerId(storedLedger);
    }
  }, []);

  const [newEchoData, setNewEchoData] = useState('');
  const [echoType, setEchoType] = useState<'Text' | 'Audio' | 'Annotation'>('Text');
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch echoes for this ledger
  const { data: echoesData, isLoading } = useQuery({
    queryKey: ['echoes', ledgerId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/echo/${ledgerId}`);
      if (!response.ok) throw new Error('Failed to fetch echoes');
      const data = await response.json();
      return data.echoes as Echo[];
    },
    enabled: !!ledgerId,
    refetchInterval: 10000, // Refresh every 10s
  });

  // Add echo mutation
  const addEchoMutation = useMutation({
    mutationFn: async (data: { echoData: string; echoType: string }) => {
      if (!publicKey) throw new Error('Wallet not connected');

      const response = await fetch(`${API_BASE}/api/echo/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ledgerId,
          echoData: data.echoData,
          echoType: data.echoType,
          contributorWallet: publicKey.toBase58(),
        }),
      });

      if (!response.ok) throw new Error('Failed to add echo');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['echoes', ledgerId] });
      toast.success(data.verified ? '✨ Echo verified and added!' : '⚠️ Echo added (unverified)');
      setNewEchoData('');
      setShowAddForm(false);
      
      // Confetti effect (optional)
      if (data.verified) {
        // Add confetti animation here
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to add echo: ${error.message}`);
    },
  });

  const handleAddEcho = () => {
    if (!newEchoData.trim()) {
      toast.error('Echo content cannot be empty');
      return;
    }

    addEchoMutation.mutate({
      echoData: newEchoData,
      echoType,
    });
  };

  if (isLoading) {
    return (
      <div className="echo-viewer-loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          🎬
        </motion.div>
        <p>Loading Eternal Echo...</p>
      </div>
    );
  }

  const echoes = echoesData || [];
  const verifiedCount = echoes.filter(e => e.grokVerified).length;
  const avgScore = echoes.length > 0
    ? Math.round(echoes.reduce((sum, e) => sum + e.verificationScore, 0) / echoes.length)
    : 0;

  return (
    <div className="echo-viewer-container">
      {/* Header */}
      <motion.div 
        className="viewer-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-content">
          <h1 className="viewer-title">
            🎬 Eternal Echo
            <span className="viewer-subtitle">Ledger: {ledgerId?.slice(0, 8)}...</span>
          </h1>
          <WalletMultiButton className="wallet-button" />
        </div>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-value">{echoes.length}</div>
            <div className="stat-label">Total Echoes</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{verifiedCount}</div>
            <div className="stat-label">Verified</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{avgScore}%</div>
            <div className="stat-label">Avg Truth Score</div>
          </div>
        </div>
      </motion.div>

      {/* Base Video Layer */}
      <motion.div 
        className="base-layer"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="base-layer-placeholder">
          🎬 Base NFT Video Would Display Here
          <p className="base-note">(Connect to on-chain metadata for video URI)</p>
        </div>
      </motion.div>

      {/* Echo Layers */}
      <div className="echo-layers">
        <h2 className="layers-title">Echo Layers ({echoes.length}/100)</h2>
        
        <AnimatePresence>
          {echoes.map((echo, index) => (
            <motion.div
              key={echo.id}
              className={`echo-card ${echo.grokVerified ? 'verified' : 'unverified'}`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="echo-header-row">
                <div className="echo-type-badge">{echo.echoType}</div>
                {echo.grokVerified && (
                  <div className="verified-badge">
                    ✓ Verified {echo.verificationScore}%
                  </div>
                )}
              </div>
              
              <div className="echo-content">{echo.echoData}</div>
              
              <div className="echo-footer">
                <span className="echo-contributor">
                  👤 {echo.contributor.slice(0, 6)}...{echo.contributor.slice(-4)}
                </span>
                <span className="echo-timestamp">
                  📅 {new Date(echo.timestamp).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {echoes.length === 0 && (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>🎭 No echoes yet. Be the first to add one!</p>
          </motion.div>
        )}
      </div>

      {/* Add Echo Button */}
      {!showAddForm && (
        <motion.button
          className="add-echo-button"
          onClick={() => setShowAddForm(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!publicKey}
        >
          {publicKey ? '✨ Add Your Echo' : 'Connect Wallet to Add Echo'}
        </motion.button>
      )}

      {/* Add Echo Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="add-echo-form"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <h3>Add Your Echo Layer</h3>
            
            <div className="form-group">
              <label>Echo Type</label>
              <select
                value={echoType}
                onChange={(e) => setEchoType(e.target.value as any)}
                className="echo-type-select"
              >
                <option value="Text">📝 Text</option>
                <option value="Audio">🎵 Audio</option>
                <option value="Annotation">📌 Annotation</option>
              </select>
            </div>

            <div className="form-group">
              <label>Echo Content</label>
              <textarea
                value={newEchoData}
                onChange={(e) => setNewEchoData(e.target.value)}
                placeholder="Add your layer... (verified echoes get 2x CLOUT!)"
                className="echo-textarea"
                rows={6}
              />
              <div className="char-count">
                {newEchoData.length} / 5000 characters
              </div>
            </div>

            <div className="form-actions">
              <button
                className="submit-button"
                onClick={handleAddEcho}
                disabled={addEchoMutation.isPending || !newEchoData.trim()}
              >
                {addEchoMutation.isPending ? '⏳ Verifying & Adding...' : '🚀 Add Echo'}
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewEchoData('');
                }}
              >
                Cancel
              </button>
            </div>

            <div className="form-info">
              ✨ Your echo will be verified by Grokipedia for truth score!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <div className="progress-container">
        <div className="progress-label">Echo Capacity</div>
        <div className="progress-bar">
          <motion.div 
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(echoes.length / 100) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="progress-text">{echoes.length} / 100 echoes</div>
      </div>
    </div>
  );
};

export default EchoViewer;
