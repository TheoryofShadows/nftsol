/**
 * 🎬 Echo Stats Widget for User Dashboard
 * Shows user's Echo NFT statistics and achievements
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useUniversalWallet } from '../wallet/UniversalWalletAdapter';
import './EchoStatsWidget.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const EchoStatsWidget: React.FC = () => {
  const { publicKey } = useUniversalWallet();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['echoStats', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return null;
      
      const response = await fetch(`${API_BASE}/api/echo/stats/${publicKey.toString()}`);
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: !!publicKey,
    staleTime: 60000, // 1 minute
  });

  if (!publicKey || isLoading) {
    return null;
  }

  if (!stats || stats.totalEchosMinted === 0 && stats.totalEchosContributed === 0) {
    return (
      <motion.div 
        className="echo-stats-widget empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="echo-empty-icon">🎬</div>
        <h3>Start Your Echo Journey!</h3>
        <p>Mint your first Eternal Echo and earn CLOUT rewards!</p>
        <button
          className="btn-start-echo"
          onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'echo-mint' }))}
        >
          🚀 Create First Echo
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="echo-stats-widget"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="widget-header">
        <h3>🎬 Your Echo Stats</h3>
        <div className="widget-badge">Eternal Echoes</div>
      </div>

      <div className="stats-grid">
        <motion.div 
          className="stat-card"
          whileHover={{ scale: 1.05 }}
        >
          <div className="stat-icon">🎭</div>
          <div className="stat-value">{stats.totalEchosMinted}</div>
          <div className="stat-label">Echoes Minted</div>
        </motion.div>

        <motion.div 
          className="stat-card"
          whileHover={{ scale: 1.05 }}
        >
          <div className="stat-icon">✨</div>
          <div className="stat-value">{stats.totalEchosContributed}</div>
          <div className="stat-label">Contributions</div>
        </motion.div>

        <motion.div 
          className="stat-card highlight"
          whileHover={{ scale: 1.05 }}
        >
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.avgTruthScore}%</div>
          <div className="stat-label">Avg Truth Score</div>
        </motion.div>

        <motion.div 
          className="stat-card highlight"
          whileHover={{ scale: 1.05 }}
        >
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{stats.totalCloutEarned}</div>
          <div className="stat-label">CLOUT Earned</div>
        </motion.div>
      </div>

      <div className="widget-actions">
        <button
          className="btn-view-echoes"
          onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'echo-marketplace' }))}
        >
          🎭 View My Echoes
        </button>
        <button
          className="btn-mint-more"
          onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'echo-mint' }))}
        >
          ➕ Mint More
        </button>
      </div>
    </motion.div>
  );
};

export default EchoStatsWidget;
