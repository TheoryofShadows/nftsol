import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUniversalWallet } from "../wallet/UniversalWalletAdapter";
import { useCloutUpdates, useWebSocket } from "../hooks/useWebSocket";

export default function CloutBadge() {
  const { publicKey, connected } = useUniversalWallet();
  const { balance, cloutEarned, globalStats } = useCloutUpdates(publicKey?.toString());
  const { isConnected } = useWebSocket();
  const [showDetails, setShowDetails] = useState(false);

  if (!connected || !publicKey) return null;

  return (
    <motion.div
      className="clout-badge"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="clout-main">
        <div className="clout-icon">⚡</div>
        <div className="clout-info">
          <div className="clout-balance">
            {balance.toLocaleString()}
          </div>
          <div className="clout-label">CLOUT</div>
        </div>
        <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="clout-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="detail-item">
              <span className="detail-label">Earned:</span>
              <span className="detail-value">{cloutEarned.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Global Total:</span>
              <span className="detail-value">{globalStats.totalClout.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Active Users:</span>
              <span className="detail-value">{globalStats.activeUsers}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">24h Transactions:</span>
              <span className="detail-value">{globalStats.transactions24h}</span>
            </div>
            <div className="wallet-info">
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
