import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WelcomeModal.css';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Check if user has seen the modal before
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('welcomeShown');
    if (hasSeenWelcome && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('welcomeShown', 'true');
    }
    onClose();
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    handleClose();
  };

  const steps = [
    {
      icon: '🔗',
      title: 'Connect Your Wallet',
      description: 'Use any Solana wallet - Phantom, Solflare, or any other. No restrictions, no limitations.',
      details: [
        'Universal wallet support',
        'Easy wallet switching',
        'Secure transaction signing',
        'Cross-device compatibility'
      ],
      highlight: 'Any Solana wallet works seamlessly'
    },
    {
      icon: '✨',
      title: 'Mint Revolutionary NFTs',
      description: 'Create NFTs for just 0.01 SOL (regular) or 0.0001 SOL (compressed) with full 2026 standards.',
      details: [
        '0.01 SOL for regular NFTs',
        '0.0001 SOL for compressed NFTs (1000x cheaper!)',
        'Full Metaplex v3 support',
        'Multi-media content support'
      ],
      highlight: '1000x cost savings with compressed NFTs'
    },
    {
      icon: '⚡',
      title: 'Earn CLOUT Rewards',
      description: 'Every transaction earns you CLOUT tokens. Use them for fee reductions, governance, and staking.',
      details: [
        'Earn CLOUT for every action',
        'Up to 75% fee reduction',
        'Governance voting rights',
        'Staking rewards (5-15% APY)'
      ],
      highlight: 'Turn participation into rewards'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="welcome-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="welcome-modal"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="welcome-header">
            <div className="welcome-logo">
              <img 
                src="/assets/nftsol-logo.svg" 
                alt="NFTSol Logo" 
                className="logo-image"
              />
              <h1>Welcome to NFTSol</h1>
            </div>
            <button 
              className="close-button"
              onClick={handleClose}
              aria-label="Close welcome modal"
            >
              ✕
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="progress-indicator">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${currentStep > index ? 'completed' : ''} ${currentStep === index + 1 ? 'active' : ''}`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="step-content">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="step-card"
            >
              <div className="step-icon">
                {steps[currentStep - 1].icon}
              </div>
              
              <h2 className="step-title">
                {steps[currentStep - 1].title}
              </h2>
              
              <p className="step-description">
                {steps[currentStep - 1].description}
              </p>

              <div className="step-highlight">
                💡 {steps[currentStep - 1].highlight}
              </div>

              <div className="step-details">
                <h4>What you get:</h4>
                <ul>
                  {steps[currentStep - 1].details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="step-navigation">
            <div className="nav-buttons">
              {currentStep > 1 && (
                <button 
                  className="btn-secondary"
                  onClick={prevStep}
                >
                  ← Back
                </button>
              )}
              
              <button 
                className="btn-skip"
                onClick={skipTutorial}
              >
                Skip Tutorial
              </button>
              
              <button 
                className="btn-primary"
                onClick={nextStep}
              >
                {currentStep === 3 ? 'Get Started!' : 'Next →'}
              </button>
            </div>

            {/* Don't show again checkbox */}
            <div className="dont-show-again">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                <span className="checkmark"></span>
                Don't show this again
              </label>
            </div>
          </div>

          {/* Features Preview */}
          <div className="features-preview">
            <div className="feature-badge">
              <span className="badge-icon">🚀</span>
              <span>Revolutionary NFT Platform</span>
            </div>
            <div className="feature-badge">
              <span className="badge-icon">⚡</span>
              <span>CLOUT Token Economy</span>
            </div>
            <div className="feature-badge">
              <span className="badge-icon">🔗</span>
              <span>Universal Wallet Support</span>
            </div>
            <div className="feature-badge">
              <span className="badge-icon">🏆</span>
              <span>Trust-Based Payments</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
