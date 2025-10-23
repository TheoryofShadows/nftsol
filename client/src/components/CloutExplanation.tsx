import React, { useState } from 'react';
import './CloutExplanation.css';

export default function CloutExplanation() {
  const [activeTab, setActiveTab] = useState<'overview' | 'earn' | 'use' | 'governance'>('overview');

  return (
    <div className="clout-explanation">
      <div className="clout-header">
        <div className="clout-icon">⚡</div>
        <h1>CLOUT Token</h1>
        <p className="clout-subtitle">The Revolutionary Utility Token Powering NFTSol</p>
      </div>

      <div className="clout-tabs">
        <button 
          className={`clout-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`clout-tab ${activeTab === 'earn' ? 'active' : ''}`}
          onClick={() => setActiveTab('earn')}
        >
          How to Earn
        </button>
        <button 
          className={`clout-tab ${activeTab === 'use' ? 'active' : ''}`}
          onClick={() => setActiveTab('use')}
        >
          How to Use
        </button>
        <button 
          className={`clout-tab ${activeTab === 'governance' ? 'active' : ''}`}
          onClick={() => setActiveTab('governance')}
        >
          Governance
        </button>
      </div>

      <div className="clout-content">
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>What is CLOUT?</h3>
                <p>
                  CLOUT is the native utility token of the NFTSol platform. It's designed to reward 
                  active users and provide real utility within our ecosystem. Unlike other tokens, 
                  CLOUT has immediate, tangible benefits.
                </p>
              </div>
              
              <div className="overview-card">
                <h3>Token Details</h3>
                <div className="token-details">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">CLOUT Token</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Symbol:</span>
                    <span className="detail-value">CLOUT</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Decimals:</span>
                    <span className="detail-value">9</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Supply:</span>
                    <span className="detail-value">1,000,000,000 CLOUT</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Mint Address:</span>
                    <span className="detail-value">4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="utilities-section">
              <h3>CLOUT Utilities</h3>
              <div className="utilities-grid">
                <div className="utility-item">
                  <div className="utility-icon">💰</div>
                  <h4>Fee Reduction</h4>
                  <p>Reduce platform fees by up to 50% when paying with CLOUT tokens</p>
                </div>
                <div className="utility-item">
                  <div className="utility-icon">⭐</div>
                  <h4>Premium Features</h4>
                  <p>Access exclusive marketplace features and advanced trading tools</p>
                </div>
                <div className="utility-item">
                  <div className="utility-icon">🗳️</div>
                  <h4>Governance Voting</h4>
                  <p>Vote on platform decisions and help shape the future of NFTSol</p>
                </div>
                <div className="utility-item">
                  <div className="utility-icon">🏆</div>
                  <h4>Staking Rewards</h4>
                  <p>Stake CLOUT tokens to earn additional rewards and benefits</p>
                </div>
                <div className="utility-item">
                  <div className="utility-icon">🎨</div>
                  <h4>Creator Bonuses</h4>
                  <p>Earn bonus CLOUT for creating and selling NFTs on the platform</p>
                </div>
                <div className="utility-item">
                  <div className="utility-icon">🚀</div>
                  <h4>Early Access</h4>
                  <p>Get early access to new features and exclusive NFT drops</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'earn' && (
          <div className="tab-content">
            <h3>How to Earn CLOUT Tokens</h3>
            <div className="earn-methods">
              <div className="earn-method">
                <div className="method-icon">🛒</div>
                <div className="method-content">
                  <h4>Buying NFTs</h4>
                  <p>Earn CLOUT tokens every time you purchase an NFT on our platform</p>
                  <div className="reward-amount">+25 CLOUT per purchase</div>
                </div>
              </div>
              
              <div className="earn-method">
                <div className="method-icon">💎</div>
                <div className="method-content">
                  <h4>Selling NFTs</h4>
                  <p>Get rewarded for selling your NFTs to other users</p>
                  <div className="reward-amount">+25 CLOUT per sale</div>
                </div>
              </div>
              
              <div className="earn-method">
                <div className="method-icon">🔒</div>
                <div className="method-content">
                  <h4>Staking CLOUT</h4>
                  <p>Stake your existing CLOUT tokens to earn additional rewards</p>
                  <div className="reward-amount">Up to 20% APY</div>
                </div>
              </div>
              
              <div className="earn-method">
                <div className="method-icon">🗳️</div>
                <div className="method-content">
                  <h4>Governance Participation</h4>
                  <p>Participate in governance votes and community decisions</p>
                  <div className="reward-amount">+10 CLOUT per vote</div>
                </div>
              </div>
              
              <div className="earn-method">
                <div className="method-icon">🎨</div>
                <div className="method-content">
                  <h4>Creating NFTs</h4>
                  <p>Earn bonus CLOUT for minting and listing new NFTs</p>
                  <div className="reward-amount">+50 CLOUT per creation</div>
                </div>
              </div>
              
              <div className="earn-method">
                <div className="method-icon">⭐</div>
                <div className="method-content">
                  <h4>Honor System Rewards</h4>
                  <p>Build your reputation to earn honor multipliers on all rewards</p>
                  <div className="reward-amount">Up to 2x multiplier</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'use' && (
          <div className="tab-content">
            <h3>How to Use CLOUT Tokens</h3>
            <div className="use-categories">
              <div className="use-category">
                <h4>💰 Fee Payments</h4>
                <div className="use-items">
                  <div className="use-item">
                    <span className="use-label">Platform Fees:</span>
                    <span className="use-value">Up to 50% reduction</span>
                  </div>
                  <div className="use-item">
                    <span className="use-label">Trading Fees:</span>
                    <span className="use-value">Up to 30% reduction</span>
                  </div>
                  <div className="use-item">
                    <span className="use-label">Minting Fees:</span>
                    <span className="use-value">Up to 40% reduction</span>
                  </div>
                </div>
              </div>
              
              <div className="use-category">
                <h4>⭐ Premium Features</h4>
                <div className="use-items">
                  <div className="use-item">
                    <span className="use-label">Advanced Analytics:</span>
                    <span className="use-value">100 CLOUT/month</span>
                  </div>
                  <div className="use-item">
                    <span className="use-label">Priority Support:</span>
                    <span className="use-value">50 CLOUT/month</span>
                  </div>
                  <div className="use-item">
                    <span className="use-label">Bulk Operations:</span>
                    <span className="use-value">25 CLOUT/operation</span>
                  </div>
                </div>
              </div>
              
              <div className="use-category">
                <h4>🎨 Creator Tools</h4>
                <div className="use-items">
                  <div className="use-item">
                    <span className="use-label">Collection Management:</span>
                    <span className="use-value">200 CLOUT/month</span>
                  </div>
                  <div className="use-item">
                    <span className="use-label">Advanced Minting:</span>
                    <span className="use-value">100 CLOUT/feature</span>
                  </div>
                  <div className="use-item">
                    <span className="use-label">Marketing Tools:</span>
                    <span className="use-value">150 CLOUT/month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'governance' && (
          <div className="tab-content">
            <h3>CLOUT Governance</h3>
            <div className="governance-info">
              <div className="governance-card">
                <h4>Voting Power</h4>
                <p>
                  Your voting power is proportional to the amount of CLOUT tokens you hold. 
                  The more CLOUT you have, the more influence you have on platform decisions.
                </p>
                <div className="voting-examples">
                  <div className="voting-example">
                    <span className="voting-amount">1,000 CLOUT</span>
                    <span className="voting-power">1 vote</span>
                  </div>
                  <div className="voting-example">
                    <span className="voting-amount">10,000 CLOUT</span>
                    <span className="voting-power">10 votes</span>
                  </div>
                  <div className="voting-example">
                    <span className="voting-amount">100,000 CLOUT</span>
                    <span className="voting-power">100 votes</span>
                  </div>
                </div>
              </div>
              
              <div className="governance-card">
                <h4>What You Can Vote On</h4>
                <ul className="voting-topics">
                  <li>Platform fee structures and changes</li>
                  <li>New feature implementations</li>
                  <li>Partnership proposals</li>
                  <li>Tokenomics adjustments</li>
                  <li>Community fund allocations</li>
                  <li>Technical upgrades and improvements</li>
                </ul>
              </div>
              
              <div className="governance-card">
                <h4>Governance Process</h4>
                <div className="governance-steps">
                  <div className="governance-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h5>Proposal Submission</h5>
                      <p>Community members can submit proposals for platform changes</p>
                    </div>
                  </div>
                  <div className="governance-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h5>Discussion Period</h5>
                      <p>7-day discussion period for community feedback and refinement</p>
                    </div>
                  </div>
                  <div className="governance-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h5>Voting Period</h5>
                      <p>3-day voting period where CLOUT holders cast their votes</p>
                    </div>
                  </div>
                  <div className="governance-step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h5>Implementation</h5>
                      <p>Approved proposals are implemented by the development team</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
