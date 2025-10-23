import React, { useState } from 'react';
import './SmartContractPage.css';

export default function SmartContractPage() {
  const [activeSection, setActiveSection] = useState<'overview' | 'trust' | 'honor' | 'escrow' | 'disputes'>('overview');

  return (
    <div className="smart-contract-page">
      <div className="page-header">
        <div className="header-icon">🛡️</div>
        <h1>Smart Contract & Honor System</h1>
        <p className="header-subtitle">Revolutionary Trust-Based Payment System</p>
      </div>

      <div className="section-tabs">
        <button 
          className={`section-tab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button 
          className={`section-tab ${activeSection === 'trust' ? 'active' : ''}`}
          onClick={() => setActiveSection('trust')}
        >
          Trust System
        </button>
        <button 
          className={`section-tab ${activeSection === 'honor' ? 'active' : ''}`}
          onClick={() => setActiveSection('honor')}
        >
          Honor System
        </button>
        <button 
          className={`section-tab ${activeSection === 'escrow' ? 'active' : ''}`}
          onClick={() => setActiveSection('escrow')}
        >
          Escrow System
        </button>
        <button 
          className={`section-tab ${activeSection === 'disputes' ? 'active' : ''}`}
          onClick={() => setActiveSection('disputes')}
        >
          Dispute Resolution
        </button>
      </div>

      <div className="section-content">
        {activeSection === 'overview' && (
          <div className="content-section">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Revolutionary Smart Contracts</h3>
                <p>
                  Our smart contracts introduce the world's first trust-based payment system, 
                  where payment terms adapt based on user reputation and behavior.
                </p>
                <div className="features-list">
                  <div className="feature-item">✅ Dynamic payment terms</div>
                  <div className="feature-item">✅ Reputation-based benefits</div>
                  <div className="feature-item">✅ Automated escrow system</div>
                  <div className="feature-item">✅ On-chain dispute resolution</div>
                </div>
                
                <div className="contract-links">
                  <h4>View Smart Contracts on Solana Explorer</h4>
                  <div className="contract-grid">
                    <a 
                      href="https://explorer.solana.com/address/4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E?cluster=devnet" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="contract-link"
                    >
                      🏆 CLOUT Staking Program
                    </a>
                    <a 
                      href="https://explorer.solana.com/address/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?cluster=devnet" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="contract-link"
                    >
                      📊 Loyalty Registry
                    </a>
                    <a 
                      href="https://explorer.solana.com/address/9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?cluster=devnet" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="contract-link"
                    >
                      🔒 Market Escrow
                    </a>
                    <a 
                      href="https://explorer.solana.com/address/YBSSnuhAgYq6SN1yofjNt8XyLW7B3mQQQFUBF8gwH6J?cluster=devnet" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="contract-link"
                    >
                      💰 Rewards Vault
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="overview-card">
                <h3>How It Works</h3>
                <div className="workflow-steps">
                  <div className="workflow-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>User Registration</h4>
                      <p>Users connect their wallet and start with a neutral trust level</p>
                    </div>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Trust Building</h4>
                      <p>Fair transactions and positive interactions increase trust level</p>
                    </div>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Dynamic Payments</h4>
                      <p>Payment terms automatically adjust based on trust level</p>
                    </div>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h4>Honor Rewards</h4>
                      <p>High-trust users receive better benefits and lower fees</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'trust' && (
          <div className="content-section">
            <h3>Trust-Based Payment System</h3>
            <div className="trust-levels">
              <div className="trust-level">
                <div className="level-badge legendary">Legendary (90-100)</div>
                <div className="level-benefits">
                  <h4>Benefits:</h4>
                  <ul>
                    <li>20% upfront payment, 80% escrow</li>
                    <li>No release delay</li>
                    <li>24-hour dispute window</li>
                    <li>Maximum CLOUT multipliers</li>
                    <li>Priority support</li>
                  </ul>
                </div>
              </div>
              
              <div className="trust-level">
                <div className="level-badge excellent">Excellent (70-89)</div>
                <div className="level-benefits">
                  <h4>Benefits:</h4>
                  <ul>
                    <li>40% upfront payment, 60% escrow</li>
                    <li>1-hour release delay</li>
                    <li>48-hour dispute window</li>
                    <li>High CLOUT multipliers</li>
                    <li>Fast-track support</li>
                  </ul>
                </div>
              </div>
              
              <div className="trust-level">
                <div className="level-badge good">Good (50-69)</div>
                <div className="level-benefits">
                  <h4>Benefits:</h4>
                  <ul>
                    <li>60% upfront payment, 40% escrow</li>
                    <li>3-hour release delay</li>
                    <li>72-hour dispute window</li>
                    <li>Standard CLOUT multipliers</li>
                    <li>Standard support</li>
                  </ul>
                </div>
              </div>
              
              <div className="trust-level">
                <div className="level-badge fair">Fair (30-49)</div>
                <div className="level-benefits">
                  <h4>Benefits:</h4>
                  <ul>
                    <li>80% upfront payment, 20% escrow</li>
                    <li>24-hour release delay</li>
                    <li>7-day dispute window</li>
                    <li>Reduced CLOUT multipliers</li>
                    <li>Basic support</li>
                  </ul>
                </div>
              </div>
              
              <div className="trust-level">
                <div className="level-badge new">New (0-29)</div>
                <div className="level-benefits">
                  <h4>Benefits:</h4>
                  <ul>
                    <li>100% upfront payment</li>
                    <li>No escrow protection</li>
                    <li>14-day dispute window</li>
                    <li>Minimal CLOUT multipliers</li>
                    <li>Community support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'honor' && (
          <div className="content-section">
            <h3>Honor System</h3>
            <div className="honor-system">
              <div className="honor-card">
                <h4>How Honor is Calculated</h4>
                <div className="honor-factors">
                  <div className="honor-factor">
                    <div className="factor-icon">✅</div>
                    <div className="factor-content">
                      <h5>Successful Transactions</h5>
                      <p>+10 honor points per successful transaction</p>
                    </div>
                  </div>
                  <div className="honor-factor">
                    <div className="factor-icon">⭐</div>
                    <div className="factor-content">
                      <h5>Positive Reviews</h5>
                      <p>+5 honor points per positive review received</p>
                    </div>
                  </div>
                  <div className="honor-factor">
                    <div className="factor-icon">🏆</div>
                    <div className="factor-content">
                      <h5>Community Participation</h5>
                      <p>+3 honor points per governance vote</p>
                    </div>
                  </div>
                  <div className="honor-factor">
                    <div className="factor-icon">🎨</div>
                    <div className="factor-content">
                      <h5>Content Creation</h5>
                      <p>+15 honor points per NFT creation</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="honor-card">
                <h4>Honor Penalties</h4>
                <div className="honor-penalties">
                  <div className="penalty-item">
                    <div className="penalty-icon">❌</div>
                    <div className="penalty-content">
                      <h5>Failed Transactions</h5>
                      <p>-20 honor points per failed transaction</p>
                    </div>
                  </div>
                  <div className="penalty-item">
                    <div className="penalty-icon">⚠️</div>
                    <div className="penalty-content">
                      <h5>Dispute Involvement</h5>
                      <p>-30 honor points per dispute (if found at fault)</p>
                    </div>
                  </div>
                  <div className="penalty-item">
                    <div className="penalty-icon">🚫</div>
                    <div className="penalty-content">
                      <h5>Platform Violations</h5>
                      <p>-50 honor points per violation</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="honor-card">
                <h4>Honor Multipliers</h4>
                <div className="multiplier-table">
                  <div className="multiplier-row">
                    <span className="honor-range">90-100 Honor</span>
                    <span className="multiplier">2.0x CLOUT Rewards</span>
                  </div>
                  <div className="multiplier-row">
                    <span className="honor-range">70-89 Honor</span>
                    <span className="multiplier">1.5x CLOUT Rewards</span>
                  </div>
                  <div className="multiplier-row">
                    <span className="honor-range">50-69 Honor</span>
                    <span className="multiplier">1.25x CLOUT Rewards</span>
                  </div>
                  <div className="multiplier-row">
                    <span className="honor-range">30-49 Honor</span>
                    <span className="multiplier">1.1x CLOUT Rewards</span>
                  </div>
                  <div className="multiplier-row">
                    <span className="honor-range">0-29 Honor</span>
                    <span className="multiplier">1.0x CLOUT Rewards</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'escrow' && (
          <div className="content-section">
            <h3>Automated Escrow System</h3>
            <div className="escrow-system">
              <div className="escrow-card">
                <h4>How Escrow Works</h4>
                <div className="escrow-process">
                  <div className="process-step">
                    <div className="step-icon">💰</div>
                    <div className="step-content">
                      <h5>Payment Initiation</h5>
                      <p>Buyer initiates payment based on trust level terms</p>
                    </div>
                  </div>
                  <div className="process-step">
                    <div className="step-icon">🔒</div>
                    <div className="step-content">
                      <h5>Funds Locked</h5>
                      <p>Payment is automatically locked in smart contract escrow</p>
                    </div>
                  </div>
                  <div className="process-step">
                    <div className="step-icon">⏰</div>
                    <div className="step-content">
                      <h5>Release Delay</h5>
                      <p>Funds held for predetermined time based on trust level</p>
                    </div>
                  </div>
                  <div className="process-step">
                    <div className="step-icon">✅</div>
                    <div className="step-content">
                      <h5>Automatic Release</h5>
                      <p>Funds automatically released to seller after delay period</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="escrow-card">
                <h4>Escrow Terms by Trust Level</h4>
                <div className="escrow-terms">
                  <div className="term-row">
                    <span className="trust-level">Legendary (90-100)</span>
                    <span className="escrow-amount">80% Escrow</span>
                    <span className="release-delay">No Delay</span>
                  </div>
                  <div className="term-row">
                    <span className="trust-level">Excellent (70-89)</span>
                    <span className="escrow-amount">60% Escrow</span>
                    <span className="release-delay">1 Hour</span>
                  </div>
                  <div className="term-row">
                    <span className="trust-level">Good (50-69)</span>
                    <span className="escrow-amount">40% Escrow</span>
                    <span className="release-delay">3 Hours</span>
                  </div>
                  <div className="term-row">
                    <span className="trust-level">Fair (30-49)</span>
                    <span className="escrow-amount">20% Escrow</span>
                    <span className="release-delay">24 Hours</span>
                  </div>
                  <div className="term-row">
                    <span className="trust-level">New (0-29)</span>
                    <span className="escrow-amount">No Escrow</span>
                    <span className="release-delay">Immediate</span>
                  </div>
                </div>
              </div>
              
              <div className="escrow-card">
                <h4>Security Features</h4>
                <div className="security-features">
                  <div className="security-item">
                    <div className="security-icon">🛡️</div>
                    <div className="security-content">
                      <h5>Smart Contract Security</h5>
                      <p>All escrow logic is implemented in audited smart contracts</p>
                    </div>
                  </div>
                  <div className="security-item">
                    <div className="security-icon">🔐</div>
                    <div className="security-content">
                      <h5>Multi-Signature Protection</h5>
                      <p>Critical operations require multiple signatures for security</p>
                    </div>
                  </div>
                  <div className="security-item">
                    <div className="security-icon">⏰</div>
                    <div className="security-content">
                      <h5>Time-Locked Releases</h5>
                      <p>Automatic release prevents indefinite fund locking</p>
                    </div>
                  </div>
                  <div className="security-item">
                    <div className="security-icon">🔍</div>
                    <div className="security-content">
                      <h5>Transparent Operations</h5>
                      <p>All escrow operations are publicly verifiable on-chain</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'disputes' && (
          <div className="content-section">
            <h3>Dispute Resolution System</h3>
            <div className="dispute-system">
              <div className="dispute-card">
                <h4>How Disputes Work</h4>
                <div className="dispute-process">
                  <div className="dispute-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h5>Dispute Initiation</h5>
                      <p>Either party can initiate a dispute within the dispute window</p>
                    </div>
                  </div>
                  <div className="dispute-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h5>Evidence Submission</h5>
                      <p>Both parties submit evidence and documentation</p>
                    </div>
                  </div>
                  <div className="dispute-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h5>Community Arbitration</h5>
                      <p>High-honor community members vote on the resolution</p>
                    </div>
                  </div>
                  <div className="dispute-step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h5>Automatic Resolution</h5>
                      <p>Smart contract automatically executes the community decision</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="dispute-card">
                <h4>Arbitration Requirements</h4>
                <div className="arbitration-requirements">
                  <div className="requirement-item">
                    <div className="requirement-icon">🏆</div>
                    <div className="requirement-content">
                      <h5>High Honor Level</h5>
                      <p>Arbitrators must have 70+ honor points</p>
                    </div>
                  </div>
                  <div className="requirement-item">
                    <div className="requirement-icon">💰</div>
                    <div className="requirement-content">
                      <h5>Staked CLOUT</h5>
                      <p>Must stake 1000+ CLOUT tokens to participate</p>
                    </div>
                  </div>
                  <div className="requirement-item">
                    <div className="requirement-icon">⏰</div>
                    <div className="requirement-content">
                      <h5>Active Participation</h5>
                      <p>Must have been active on platform for 30+ days</p>
                    </div>
                  </div>
                  <div className="requirement-item">
                    <div className="requirement-icon">🎯</div>
                    <div className="requirement-content">
                      <h5>No Conflicts</h5>
                      <p>Cannot arbitrate disputes involving their own transactions</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="dispute-card">
                <h4>Resolution Outcomes</h4>
                <div className="resolution-outcomes">
                  <div className="outcome-item">
                    <div className="outcome-icon">✅</div>
                    <div className="outcome-content">
                      <h5>Buyer Wins</h5>
                      <p>Full refund to buyer, seller receives no payment</p>
                    </div>
                  </div>
                  <div className="outcome-item">
                    <div className="outcome-icon">💰</div>
                    <div className="outcome-content">
                      <h5>Seller Wins</h5>
                      <p>Full payment to seller, transaction completes normally</p>
                    </div>
                  </div>
                  <div className="outcome-item">
                    <div className="outcome-icon">⚖️</div>
                    <div className="outcome-content">
                      <h5>Split Decision</h5>
                      <p>Partial refund to buyer, partial payment to seller</p>
                    </div>
                  </div>
                  <div className="outcome-item">
                    <div className="outcome-icon">🔄</div>
                    <div className="outcome-content">
                      <h5>Escalation</h5>
                      <p>Complex disputes escalated to platform administrators</p>
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
