/**
 * User Consent Modal - GDPR/Legal Compliance
 * Required before using AI verification or minting
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ConsentModal.css';

interface ConsentModalProps {
  onAccept: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ onAccept }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('eternal-echoes-consent');
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('eternal-echoes-consent', 'true');
    localStorage.setItem('eternal-echoes-consent-date', new Date().toISOString());
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    // User can't use the app without consent
    alert('You must accept our terms to use Eternal Echoes.');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="consent-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="consent-modal"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
          >
            <div className="consent-header">
              <h2>🔒 Privacy & Terms</h2>
              <span className="beta-badge">BETA</span>
            </div>

            <div className="consent-content">
              <p>
                <strong>Welcome to Eternal Echoes!</strong> Before you start, please review:
              </p>

              <div className="consent-section">
                <h3>🤖 AI Verification</h3>
                <p>
                  We use <strong>xAI Grok</strong> to verify historical content. 
                  Your video descriptions and echo text may be processed by AI.
                </p>
                <p className="disclaimer">
                  ⚠️ <strong>Truth scores are AI estimates, not verified facts.</strong> 
                  Always verify important information independently.
                </p>
              </div>

              <div className="consent-section">
                <h3>📊 Data Collection</h3>
                <p>We collect:</p>
                <ul>
                  <li>Wallet address (for NFT minting)</li>
                  <li>Echo content (stored on-chain)</li>
                  <li>Usage analytics (anonymized)</li>
                </ul>
                <p>
                  We <strong>do not</strong> sell your data. See our{' '}
                  <a href="/privacy" target="_blank">Privacy Policy</a>.
                </p>
              </div>

              <div className="consent-section">
                <h3>⚖️ Beta Software</h3>
                <p>
                  Eternal Echoes is in <strong>beta</strong>. Features may change, 
                  bugs may occur. NFTs are risky—only invest what you can afford to lose.
                </p>
              </div>

              <div className="consent-section">
                <h3>📜 Legal Compliance</h3>
                <p>By using this app, you agree to:</p>
                <ul>
                  <li>Only mint <strong>public domain</strong> content (pre-1923)</li>
                  <li>Not upload copyrighted or illegal material</li>
                  <li>Comply with our <a href="/terms" target="_blank">Terms of Service</a></li>
                  <li>Respect <a href="https://archive.org/about/terms.php" target="_blank">Internet Archive's terms</a></li>
                </ul>
              </div>

              <div className="consent-checkbox">
                <label>
                  <input
                    type="checkbox"
                    id="consent-checkbox"
                    required
                  />
                  I have read and agree to the above terms, including AI processing of my content.
                </label>
              </div>
            </div>

            <div className="consent-actions">
              <button
                className="btn-decline"
                onClick={handleDecline}
              >
                Decline
              </button>
              <button
                className="btn-accept"
                onClick={() => {
                  const checkbox = document.getElementById('consent-checkbox') as HTMLInputElement;
                  if (!checkbox?.checked) {
                    alert('Please check the consent box to continue.');
                    return;
                  }
                  handleAccept();
                }}
              >
                Accept & Continue
              </button>
            </div>

            <div className="consent-footer">
              <small>
                Questions? Contact us at{' '}
                <a href="mailto:support@nftsol.com">support@nftsol.com</a>
              </small>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConsentModal;
