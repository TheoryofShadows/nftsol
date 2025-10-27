/**
 * 📱 Mobile Wallet Component
 * Solana Mobile Stack (SMS) integration for mobile wallet support
 */

import React, { useState, useEffect } from 'react';
import { mobileWalletService, MobileWalletInfo, MobileWalletConnection } from '../services/mobileWalletService';
import './MobileWallet.css';

const MobileWallet: React.FC = () => {
  const [wallets, setWallets] = useState<MobileWalletInfo[]>([]);
  const [installedWallets, setInstalledWallets] = useState<MobileWalletInfo[]>([]);
  const [currentConnection, setCurrentConnection] = useState<MobileWalletConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wallets' | 'connect' | 'transactions'>('wallets');

  useEffect(() => {
    loadWallets();
    checkCurrentConnection();
  }, []);

  const loadWallets = () => {
    const allWallets = mobileWalletService.getSupportedWallets();
    const installed = mobileWalletService.getInstalledWallets();
    
    setWallets(allWallets);
    setInstalledWallets(installed);
  };

  const checkCurrentConnection = () => {
    const connection = mobileWalletService.getCurrentConnection();
    setCurrentConnection(connection);
  };

  const connectWallet = async (wallet: MobileWalletInfo) => {
    try {
      setLoading(true);
      setError(null);

      const connection = await mobileWalletService.connectWallet(wallet);
      setCurrentConnection(connection);
      
      console.log(`✅ Connected to ${wallet.name}`);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to wallet');
      console.error('❌ Connection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    mobileWalletService.disconnectWallet();
    setCurrentConnection(null);
    console.log('✅ Disconnected from mobile wallet');
  };

  const mintNFT = async () => {
    if (!currentConnection) return;

    try {
      setLoading(true);
      setError(null);

      const metadata = {
        name: 'Mobile Minted NFT',
        symbol: 'MOBILE',
        description: 'NFT minted through mobile wallet',
        image: 'https://via.placeholder.com/300x300/667eea/ffffff?text=Mobile+NFT'
      };

      const signature = await mobileWalletService.mintNFT(metadata);
      console.log('✅ NFT minted:', signature);
    } catch (err: any) {
      setError(err.message || 'Failed to mint NFT');
      console.error('❌ Mint failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const transferTokens = async () => {
    if (!currentConnection) return;

    try {
      setLoading(true);
      setError(null);

      const signature = await mobileWalletService.transferTokens(
        0.1, // 0.1 SOL
        '11111111111111111111111111111112', // Mock recipient
        'So11111111111111111111111111111111111111112' // SOL mint
      );
      
      console.log('✅ Tokens transferred:', signature);
    } catch (err: any) {
      setError(err.message || 'Failed to transfer tokens');
      console.error('❌ Transfer failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAppStore = (wallet: MobileWalletInfo) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS ? wallet.appStoreUrl : wallet.playStoreUrl;
    window.open(url, '_blank');
  };

  const isMobile = mobileWalletService.isMobile();
  const uiRecommendations = mobileWalletService.getMobileUIRecommendations();

  return (
    <div className="mobile-wallet">
      <div className="mobile-wallet-header">
        <h1>📱 Mobile Wallet</h1>
        <p>Solana Mobile Stack (SMS) integration for seamless mobile experiences</p>
        
        {isMobile && (
          <div className="mobile-indicator">
            <span className="mobile-badge">📱 Mobile Device Detected</span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="mobile-wallet-tabs">
        <button
          className={activeTab === 'wallets' ? 'active' : ''}
          onClick={() => setActiveTab('wallets')}
        >
          📱 Wallets
        </button>
        <button
          className={activeTab === 'connect' ? 'active' : ''}
          onClick={() => setActiveTab('connect')}
        >
          🔗 Connect
        </button>
        <button
          className={activeTab === 'transactions' ? 'active' : ''}
          onClick={() => setActiveTab('transactions')}
        >
          💸 Transactions
        </button>
      </div>

      <div className="mobile-wallet-content">
        {activeTab === 'wallets' && (
          <div className="wallets-tab">
            <h2>Supported Mobile Wallets</h2>
            
            <div className="wallets-grid">
              {wallets.map((wallet) => (
                <div key={wallet.name} className="wallet-card">
                  <div className="wallet-header">
                    <img src={wallet.icon} alt={wallet.name} className="wallet-icon" />
                    <div className="wallet-info">
                      <h3>{wallet.name}</h3>
                      <div className="wallet-status">
                        {wallet.isInstalled ? (
                          <span className="status-installed">✅ Installed</span>
                        ) : (
                          <span className="status-not-installed">❌ Not Installed</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="wallet-features">
                    <h4>Supported Features:</h4>
                    <div className="features-list">
                      {wallet.supportedFeatures.map((feature) => (
                        <span key={feature} className="feature-tag">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="wallet-actions">
                    {wallet.isInstalled ? (
                      <button
                        onClick={() => connectWallet(wallet)}
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? '🔄 Connecting...' : '🔗 Connect'}
                      </button>
                    ) : (
                      <button
                        onClick={() => openAppStore(wallet)}
                        className="btn-secondary"
                      >
                        📥 Install
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'connect' && (
          <div className="connect-tab">
            <h2>Wallet Connection</h2>
            
            {currentConnection ? (
              <div className="connection-status">
                <div className="connected-wallet">
                  <img 
                    src={currentConnection.wallet.icon} 
                    alt={currentConnection.wallet.name} 
                    className="wallet-icon-large"
                  />
                  <div className="wallet-details">
                    <h3>Connected to {currentConnection.wallet.name}</h3>
                    <p className="wallet-address">
                      {currentConnection.publicKey.slice(0, 8)}...{currentConnection.publicKey.slice(-8)}
                    </p>
                    <p className="session-id">Session: {currentConnection.sessionId}</p>
                  </div>
                </div>

                <div className="connection-actions">
                  <button onClick={disconnectWallet} className="btn-warning">
                    🔌 Disconnect
                  </button>
                </div>

                <div className="wallet-capabilities">
                  <h4>Wallet Capabilities:</h4>
                  <div className="capabilities-list">
                    {currentConnection.wallet.supportedFeatures.map((feature) => (
                      <span key={feature} className="capability-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-connection">
                <div className="no-connection-icon">📱</div>
                <h3>No Wallet Connected</h3>
                <p>Connect to a mobile wallet to start using mobile features</p>
                <button 
                  onClick={() => setActiveTab('wallets')}
                  className="btn-primary"
                >
                  Browse Wallets
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-tab">
            <h2>Mobile Transactions</h2>
            
            {currentConnection ? (
              <div className="transaction-options">
                <div className="transaction-card">
                  <h3>🎨 Mint NFT</h3>
                  <p>Mint a compressed NFT through your mobile wallet</p>
                  <button 
                    onClick={mintNFT}
                    className="btn-primary"
                    disabled={loading || !mobileWalletService.isFeatureSupported('mint')}
                  >
                    {loading ? '🔄 Minting...' : '🎨 Mint NFT'}
                  </button>
                </div>

                <div className="transaction-card">
                  <h3>💸 Transfer Tokens</h3>
                  <p>Transfer SOL or SPL tokens through your mobile wallet</p>
                  <button 
                    onClick={transferTokens}
                    className="btn-primary"
                    disabled={loading || !mobileWalletService.isFeatureSupported('transfer')}
                  >
                    {loading ? '🔄 Transferring...' : '💸 Transfer Tokens'}
                  </button>
                </div>

                <div className="transaction-card">
                  <h3>🔄 Swap Tokens</h3>
                  <p>Swap tokens through your mobile wallet</p>
                  <button 
                    className="btn-secondary"
                    disabled={!mobileWalletService.isFeatureSupported('swap')}
                  >
                    🔄 Swap Tokens
                  </button>
                </div>

                <div className="transaction-card">
                  <h3>🥩 Stake SOL</h3>
                  <p>Stake SOL through your mobile wallet</p>
                  <button 
                    className="btn-secondary"
                    disabled={!mobileWalletService.isFeatureSupported('stake')}
                  >
                    🥩 Stake SOL
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-connection">
                <div className="no-connection-icon">💸</div>
                <h3>Connect Wallet to Use Transactions</h3>
                <p>You need to connect a mobile wallet to perform transactions</p>
                <button 
                  onClick={() => setActiveTab('connect')}
                  className="btn-primary"
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {uiRecommendations.useBottomSheet && (
        <div className="mobile-bottom-sheet">
          <div className="bottom-sheet-handle"></div>
          <div className="bottom-sheet-content">
            <h3>Mobile Optimizations</h3>
            <ul>
              <li>✅ Touch-optimized interface</li>
              <li>✅ Bottom sheet navigation</li>
              <li>✅ Compact layout</li>
              <li>✅ Deep link integration</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileWallet;
