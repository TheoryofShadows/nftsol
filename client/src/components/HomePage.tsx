import React from 'react';
import './HomePage.css';

export default function HomePage() {
  const navigate = (tab: string) => {
    // Dispatch custom event to change tab
    window.dispatchEvent(new CustomEvent('change-tab', { detail: tab }));
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            🚀 Revolutionary NFT Platform
          </div>
          <h1 className="hero-title">
            The Future of NFTs is Here
          </h1>
          <p className="hero-description">
            NFTSol introduces the world's first trust-based payment system, 
            CLOUT token economy, and universal wallet support. Experience 
            NFTs like never before with our revolutionary platform.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">100%</div>
              <div className="stat-label">Universal Wallet Support</div>
            </div>
            <div className="stat">
              <div className="stat-number">50%</div>
              <div className="stat-label">Fee Reduction with CLOUT</div>
            </div>
            <div className="stat">
              <div className="stat-number">∞</div>
              <div className="stat-label">Cross-Platform NFTs</div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why NFTSol is Revolutionary</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Trust-Based Payments</h3>
              <p>
                Our smart contracts adapt payment terms based on your reputation. 
                High-trust users get better deals, creating a fair ecosystem.
              </p>
              <ul>
                <li>Dynamic payment terms</li>
                <li>Reputation-based benefits</li>
                <li>Dispute resolution system</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>CLOUT Token Economy</h3>
              <p>
                Earn CLOUT tokens for every action. Use them for fee reductions, 
                premium features, and governance voting.
              </p>
              <ul>
                <li>Earn CLOUT for transactions</li>
                <li>Up to 50% fee reduction</li>
                <li>Governance voting rights</li>
                <li>Staking rewards</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Universal Wallet Support</h3>
              <p>
                Connect with any Solana wallet - Phantom, Solflare, or any other. 
                Seamless experience across all devices and platforms.
              </p>
              <ul>
                <li>Any Solana wallet works</li>
                <li>Cross-device compatibility</li>
                <li>Easy wallet switching</li>
                <li>Secure transaction signing</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Honor System</h3>
              <p>
                Build your reputation over time. The more you participate fairly, 
                the better benefits you receive from our platform.
              </p>
              <ul>
                <li>Reputation tracking</li>
                <li>Honor multipliers</li>
                <li>Loyalty rewards</li>
                <li>Community recognition</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Cross-Platform NFTs</h3>
              <p>
                View and trade NFTs from any Solana platform. Our universal 
                marketplace brings all Solana NFTs together in one place.
              </p>
              <ul>
                <li>All Solana NFTs in one place</li>
                <li>Cross-platform trading</li>
                <li>Universal metadata</li>
                <li>Seamless integration</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Smart Contract Security</h3>
              <p>
                Built on Solana with enterprise-grade security. Your assets and 
                transactions are protected by advanced smart contract logic.
              </p>
              <ul>
                <li>On-chain security</li>
                <li>Automated escrow</li>
                <li>Dispute resolution</li>
                <li>Transparent transactions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Connect Your Wallet</h3>
                <p>Use any Solana wallet - Phantom, Solflare, or any other. No restrictions, no limitations.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Start Earning CLOUT</h3>
                <p>Every transaction earns you CLOUT tokens. The more you participate, the more you earn.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Build Your Reputation</h3>
                <p>Fair participation builds your honor level, unlocking better benefits and lower fees.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Enjoy the Benefits</h3>
                <p>Use your CLOUT tokens for fee reductions, premium features, and governance voting.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Experience the Future?</h2>
          <p>Join thousands of users already experiencing the most revolutionary NFT platform on Solana.</p>
          <div className="cta-buttons">
            <button 
              className="btn-primary" 
              onClick={() => navigate('marketplace')}
            >
              Start Trading
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('clout')}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
