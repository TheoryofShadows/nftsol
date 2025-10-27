import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './CloutQuickStart.css';

interface CloutQuickStartProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function CloutQuickStart({ onClose, showCloseButton = false }: CloutQuickStartProps) {
  const [activeSection, setActiveSection] = useState<'earn' | 'benefits' | 'tokenomics'>('earn');

  const sections = [
    {
      id: 'earn' as const,
      title: 'How to Earn',
      icon: '⚡',
      color: '#14F195'
    },
    {
      id: 'benefits' as const,
      title: 'Benefits',
      icon: '🎯',
      color: '#9945FF'
    },
    {
      id: 'tokenomics' as const,
      title: 'Tokenomics',
      icon: '📊',
      color: '#FF6B35'
    }
  ];

  const earnMethods = [
    {
      action: 'Mint NFTs',
      reward: '50 CLOUT',
      description: 'Create and mint NFTs on the platform',
      multiplier: '1x-3x based on trust score'
    },
    {
      action: 'Buy NFTs',
      reward: '25 CLOUT',
      description: 'Purchase NFTs from other users',
      multiplier: 'Additional trust bonus'
    },
    {
      action: 'Sell NFTs',
      reward: '25 CLOUT',
      description: 'Sell your NFTs to other users',
      multiplier: 'Higher rewards for popular NFTs'
    },
    {
      action: 'Daily Login',
      reward: '5 CLOUT',
      description: 'Check in daily to earn rewards',
      multiplier: 'Consistent daily rewards'
    },
    {
      action: 'Social Features',
      reward: '10 CLOUT',
      description: 'Follow users, like, and comment',
      multiplier: 'Community engagement bonus'
    },
    {
      action: 'Governance',
      reward: '20 CLOUT',
      description: 'Vote on platform proposals',
      multiplier: 'Democracy participation'
    }
  ];

  const benefits = [
    {
      title: 'Fee Reduction',
      icon: '💰',
      levels: [
        { clout: '0-100', reduction: '0%', color: '#666' },
        { clout: '100-1,000', reduction: '10%', color: '#14F195' },
        { clout: '1,000-10,000', reduction: '25%', color: '#9945FF' },
        { clout: '10,000-100,000', reduction: '50%', color: '#FF6B35' },
        { clout: '100,000+', reduction: '75%', color: '#FFD700' }
      ]
    },
    {
      title: 'Premium Features',
      icon: '⭐',
      features: [
        'Advanced Analytics Dashboard',
        'Priority Customer Support',
        'Exclusive NFT Drops',
        'Custom Profile Themes',
        'Early Feature Access'
      ]
    },
    {
      title: 'Governance Rights',
      icon: '🗳️',
      features: [
        'Vote on Platform Proposals',
        'Create Improvement Proposals',
        'Treasury Fund Allocation',
        'Feature Prioritization',
        'Community Moderation'
      ]
    },
    {
      title: 'Staking Rewards',
      icon: '🏦',
      features: [
        '5-15% APY depending on staking period',
        'Compound rewards automatically',
        'Flexible 1 month to 2 year terms',
        'Governance voting power',
        'Fee reduction multipliers'
      ]
    }
  ];

  const tokenomics = {
    totalSupply: '1,000,000,000 CLOUT',
    distribution: [
      { category: 'Platform Treasury', percentage: 40, amount: '400M CLOUT', color: '#9945FF' },
      { category: 'Community Rewards', percentage: 30, amount: '300M CLOUT', color: '#14F195' },
      { category: 'Team & Advisors', percentage: 15, amount: '150M CLOUT', color: '#FF6B35' },
      { category: 'Liquidity & Partnerships', percentage: 10, amount: '100M CLOUT', color: '#FFD700' },
      { category: 'Reserve Fund', percentage: 5, amount: '50M CLOUT', color: '#666' }
    ],
    features: [
      'Deflationary burns on transactions',
      'Governance-driven tokenomics',
      'Community-controlled treasury',
      'Transparent distribution model',
      'Long-term sustainability focus'
    ]
  };

  const renderEarnSection = () => (
    <div className="earn-section">
      <h3>⚡ How to Earn CLOUT</h3>
      <p className="section-description">
        Every action on NFTSol earns you CLOUT tokens. The more you participate, the more you earn!
      </p>
      
      <div className="earn-methods">
        {earnMethods.map((method, index) => (
          <motion.div
            key={method.action}
            className="earn-method"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="method-header">
              <div className="method-icon">⚡</div>
              <div className="method-info">
                <h4>{method.action}</h4>
                <span className="reward">{method.reward}</span>
              </div>
            </div>
            <p className="method-description">{method.description}</p>
            <div className="method-multiplier">{method.multiplier}</div>
          </motion.div>
        ))}
      </div>

      <div className="trust-score-info">
        <h4>🏆 Trust Score Multipliers</h4>
        <p>Your trust score affects CLOUT rewards:</p>
        <div className="trust-levels">
          <div className="trust-level">
            <span className="level">Newcomer</span>
            <span className="multiplier">1x</span>
          </div>
          <div className="trust-level">
            <span className="level">Rising</span>
            <span className="multiplier">1.2x</span>
          </div>
          <div className="trust-level">
            <span className="level">Trusted</span>
            <span className="multiplier">1.5x</span>
          </div>
          <div className="trust-level">
            <span className="level">Expert</span>
            <span className="multiplier">2x</span>
          </div>
          <div className="trust-level">
            <span className="level">Elite</span>
            <span className="multiplier">2.5x</span>
          </div>
          <div className="trust-level">
            <span className="level">Legendary</span>
            <span className="multiplier">3x</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBenefitsSection = () => (
    <div className="benefits-section">
      <h3>🎯 CLOUT Benefits</h3>
      <p className="section-description">
        Use your CLOUT tokens to unlock exclusive benefits and reduce platform fees.
      </p>
      
      <div className="benefits-grid">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            className="benefit-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="benefit-header">
              <span className="benefit-icon">{benefit.icon}</span>
              <h4>{benefit.title}</h4>
            </div>
            
            {benefit.levels ? (
              <div className="benefit-levels">
                {benefit.levels.map((level, levelIndex) => (
                  <div key={levelIndex} className="level-row">
                    <span className="level-clout">{level.clout}</span>
                    <div className="level-bar">
                      <div 
                        className="level-fill" 
                        style={{ 
                          width: `${(levelIndex + 1) * 20}%`,
                          backgroundColor: level.color
                        }}
                      />
                    </div>
                    <span className="level-reduction">{level.reduction}</span>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="benefit-features">
                {benefit.features.map((feature, featureIndex) => (
                  <li key={featureIndex}>{feature}</li>
                ))}
              </ul>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderTokenomicsSection = () => (
    <div className="tokenomics-section">
      <h3>📊 CLOUT Tokenomics</h3>
      <p className="section-description">
        Transparent, community-driven tokenomics designed for long-term sustainability.
      </p>
      
      <div className="tokenomics-overview">
        <div className="total-supply">
          <h4>Total Supply</h4>
          <span className="supply-amount">{tokenomics.totalSupply}</span>
        </div>
      </div>

      <div className="distribution-chart">
        <h4>Token Distribution</h4>
        <div className="chart-container">
          {tokenomics.distribution.map((item, index) => (
            <motion.div
              key={item.category}
              className="chart-segment"
              style={{ '--segment-color': item.color } as React.CSSProperties}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="segment-bar" style={{ width: `${item.percentage}%` }} />
              <div className="segment-info">
                <span className="segment-category">{item.category}</span>
                <span className="segment-percentage">{item.percentage}%</span>
                <span className="segment-amount">{item.amount}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="tokenomics-features">
        <h4>Key Features</h4>
        <ul>
          {tokenomics.features.map((feature, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              ✓ {feature}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="clout-quick-start">
      {showCloseButton && onClose && (
        <button className="close-button" onClick={onClose} aria-label="Close CLOUT quick start">
          ✕
        </button>
      )}
      
      <div className="quick-start-header">
        <h2>⚡ CLOUT Quick Start</h2>
        <p>Earn CLOUT, Reduce Fees, Govern the Platform</p>
      </div>

      <div className="section-tabs">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`section-tab ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
            style={{ '--tab-color': section.color } as React.CSSProperties}
          >
            <span className="tab-icon">{section.icon}</span>
            <span className="tab-title">{section.title}</span>
          </button>
        ))}
      </div>

      <div className="section-content">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeSection === 'earn' && renderEarnSection()}
          {activeSection === 'benefits' && renderBenefitsSection()}
          {activeSection === 'tokenomics' && renderTokenomicsSection()}
        </motion.div>
      </div>

      <div className="quick-start-footer">
        <p>
          Ready to start earning CLOUT? 
          <a href="#mint" className="cta-link"> Mint your first NFT</a> or 
          <a href="#marketplace" className="cta-link"> explore the marketplace</a>.
        </p>
        <p className="whitepaper-link">
          For complete details, read our 
          <a href="/whitepaper" className="whitepaper-link-text"> full whitepaper</a>.
        </p>
      </div>
    </div>
  );
}
