import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUniversalWallet } from '../wallet/UniversalWalletAdapter';

export interface ErrorInfo {
  type: 'wallet' | 'transaction' | 'network' | 'validation' | 'general';
  title: string;
  message: string;
  details?: string;
  action?: string;
  retryable?: boolean;
  showTopUp?: boolean;
  errorCode?: string;
}

interface ErrorModalProps {
  error: ErrorInfo | null;
  onClose: () => void;
  onRetry?: () => void;
  onAction?: () => void;
}

export default function ErrorModal({ 
  error, 
  onClose, 
  onRetry, 
  onAction 
}: ErrorModalProps) {
  const { connected, publicKey } = useUniversalWallet();
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (error) {
      setShowDetails(false);
      setIsRetrying(false);
    }
  }, [error]);

  const handleRetry = async () => {
    if (!error?.retryable || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry?.();
      onClose();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleTopUp = () => {
    // Open SOL top-up options
    const topUpUrl = 'https://jup.ag/swap/SOL-USDC';
    window.open(topUpUrl, '_blank');
  };

  const getErrorIcon = (type: string): string => {
    switch (type) {
      case 'wallet': return '🔗';
      case 'transaction': return '💸';
      case 'network': return '🌐';
      case 'validation': return '⚠️';
      default: return '❌';
    }
  };

  const getErrorColor = (type: string): string => {
    switch (type) {
      case 'wallet': return '#FF6B6B';
      case 'transaction': return '#FFD93D';
      case 'network': return '#6BCF7F';
      case 'validation': return '#FF8E53';
      default: return '#9945FF';
    }
  };

  const getActionButton = () => {
    if (error?.showTopUp && !connected) {
      return (
        <motion.button
          className="error-action-btn top-up"
          onClick={handleTopUp}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          💰 Get SOL
        </motion.button>
      );
    }

    if (error?.action) {
      return (
        <motion.button
          className="error-action-btn primary"
          onClick={onAction}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {error.action}
        </motion.button>
      );
    }

    return null;
  };

  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="error-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="error-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="error-modal-header">
            <div className="error-icon-container">
              <motion.div
                className="error-icon"
                style={{ color: getErrorColor(error.type) }}
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                {getErrorIcon(error.type)}
              </motion.div>
            </div>
            
            <div className="error-title-section">
              <h2 className="error-title">{error.title}</h2>
              {error.errorCode && (
                <span className="error-code">Code: {error.errorCode}</span>
              )}
            </div>
            
            <button
              className="error-close-btn"
              onClick={onClose}
              aria-label="Close error modal"
            >
              ✕
            </button>
          </div>

          <div className="error-modal-content">
            <p className="error-message">{error.message}</p>
            
            {error.details && (
              <div className="error-details-section">
                <button
                  className="error-details-toggle"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                  <motion.span
                    animate={{ rotate: showDetails ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ▼
                  </motion.span>
                </button>
                
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      className="error-details"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <pre>{error.details}</pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Context-specific help */}
            {error.type === 'wallet' && !connected && (
              <div className="error-help">
                <h4>💡 Wallet Connection Help</h4>
                <ul>
                  <li>Make sure you have a Solana wallet installed (Phantom, Solflare, etc.)</li>
                  <li>Check if your wallet is unlocked</li>
                  <li>Try refreshing the page and connecting again</li>
                </ul>
              </div>
            )}

            {error.type === 'transaction' && (
              <div className="error-help">
                <h4>💡 Transaction Help</h4>
                <ul>
                  <li>Check your SOL balance - you need SOL for transaction fees</li>
                  <li>Make sure you have enough SOL for the transaction amount</li>
                  <li>Try increasing the transaction priority fee</li>
                  <li>Check if the network is congested</li>
                </ul>
              </div>
            )}

            {error.type === 'network' && (
              <div className="error-help">
                <h4>💡 Network Help</h4>
                <ul>
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Our servers might be temporarily unavailable</li>
                </ul>
              </div>
            )}

            {error.showTopUp && connected && (
              <div className="error-top-up">
                <div className="top-up-info">
                  <h4>💰 Low SOL Balance</h4>
                  <p>You need SOL to complete transactions. Get some SOL to continue trading!</p>
                </div>
                <div className="top-up-options">
                  <button
                    className="top-up-btn"
                    onClick={handleTopUp}
                  >
                    Buy SOL with Jupiter
                  </button>
                  <a
                    href="https://coinbase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="top-up-link"
                  >
                    Buy on Coinbase
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="error-modal-actions">
            {error.retryable && (
              <motion.button
                className="error-action-btn retry"
                onClick={handleRetry}
                disabled={isRetrying}
                whileHover={{ scale: isRetrying ? 1 : 1.05 }}
                whileTap={{ scale: isRetrying ? 1 : 0.95 }}
              >
                {isRetrying ? (
                  <>
                    <div className="loading-spinner"></div>
                    Retrying...
                  </>
                ) : (
                  '🔄 Try Again'
                )}
              </motion.button>
            )}

            {getActionButton()}

            <motion.button
              className="error-action-btn secondary"
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
