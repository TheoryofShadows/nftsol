import React, { useState, useEffect } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';

// Mobile wallet connection component
export const MobileWalletConnect: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mobile-wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        setPublicKey(data.data.publicKey);
      }
    } catch (error) {
      console.error('Failed to connect mobile wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mobile-wallet/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(false);
        setPublicKey(null);
      }
    } catch (error) {
      console.error('Failed to disconnect mobile wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-wallet-connect">
      <div className="wallet-status">
        {isConnected ? (
          <div className="connected-state">
            <div className="wallet-info">
              <span className="wallet-icon">📱</span>
              <span className="wallet-address">
                {publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}` : 'Connected'}
              </span>
            </div>
            <button 
              onClick={disconnectWallet}
              disabled={isLoading}
              className="disconnect-btn"
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <button 
            onClick={connectWallet}
            disabled={isLoading}
            className="connect-btn"
          >
            {isLoading ? 'Connecting...' : 'Connect Mobile Wallet'}
          </button>
        )}
      </div>
    </div>
  );
};

// Mobile-optimized transaction component
export const MobileTransaction: React.FC<{
  transaction: Transaction;
  onSign: (signedTransaction: Transaction) => void;
}> = ({ transaction, onSign }) => {
  const [isSigning, setIsSigning] = useState(false);

  const signTransaction = async () => {
    setIsSigning(true);
    try {
      const transactionData = Buffer.from(transaction.serialize()).toString('base64');
      
      const response = await fetch('/api/mobile-wallet/sign-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionData })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const signedTransaction = Transaction.from(
          Buffer.from(data.data.signedTransaction, 'base64')
        );
        onSign(signedTransaction);
      }
    } catch (error) {
      console.error('Failed to sign transaction:', error);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="mobile-transaction">
      <div className="transaction-details">
        <h3>Transaction Details</h3>
        <div className="transaction-info">
          <p><strong>Instructions:</strong> {transaction.instructions.length}</p>
          <p><strong>Fee Payer:</strong> {transaction.feePayer?.toString().slice(0, 8)}...</p>
        </div>
      </div>
      
      <button 
        onClick={signTransaction}
        disabled={isSigning}
        className="sign-btn"
      >
        {isSigning ? 'Signing...' : 'Sign Transaction'}
      </button>
    </div>
  );
};

// Mobile fair launch participation component
export const MobileFairLaunch: React.FC<{
  fairLaunch: string;
  onParticipate: (amount: number) => void;
}> = ({ fairLaunch, onParticipate }) => {
  const [amount, setAmount] = useState<number>(0);
  const [isParticipating, setIsParticipating] = useState(false);
  const [fairLaunchData, setFairLaunchData] = useState<any>(null);

  useEffect(() => {
    fetchFairLaunchData();
  }, [fairLaunch]);

  const fetchFairLaunchData = async () => {
    try {
      const response = await fetch(`/api/genesis-protocol/${fairLaunch}`);
      const data = await response.json();
      
      if (data.success) {
        setFairLaunchData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch fair launch data:', error);
    }
  };

  const participate = async () => {
    if (!amount || amount <= 0) return;
    
    setIsParticipating(true);
    try {
      onParticipate(amount);
    } catch (error) {
      console.error('Failed to participate:', error);
    } finally {
      setIsParticipating(false);
    }
  };

  if (!fairLaunchData) {
    return <div className="loading">Loading fair launch data...</div>;
  }

  return (
    <div className="mobile-fair-launch">
      <div className="fair-launch-header">
        <h2>Fair Launch</h2>
        <div className="status-badge">
          {fairLaunchData.status}
        </div>
      </div>
      
      <div className="fair-launch-info">
        <div className="info-item">
          <span className="label">Total Supply:</span>
          <span className="value">{fairLaunchData.config.totalSupply.toLocaleString()}</span>
        </div>
        <div className="info-item">
          <span className="label">Min Allocation:</span>
          <span className="value">{fairLaunchData.config.minAllocation.toLocaleString()}</span>
        </div>
        <div className="info-item">
          <span className="label">Max Allocation:</span>
          <span className="value">{fairLaunchData.config.maxAllocation.toLocaleString()}</span>
        </div>
        <div className="info-item">
          <span className="label">Participants:</span>
          <span className="value">{fairLaunchData.totalParticipants}</span>
        </div>
      </div>

      <div className="participation-form">
        <label htmlFor="amount">Allocation Amount:</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min={fairLaunchData.config.minAllocation}
          max={fairLaunchData.config.maxAllocation}
          placeholder="Enter amount"
        />
        
        <button 
          onClick={participate}
          disabled={isParticipating || !amount}
          className="participate-btn"
        >
          {isParticipating ? 'Participating...' : 'Participate'}
        </button>
      </div>
    </div>
  );
};

// Mobile push notification component
export const MobilePushNotifications: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    try {
      const response = await fetch('/api/mobile-wallet/notifications/permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPermission(data.data.permission ? 'granted' : 'denied');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      await fetch('/api/mobile-wallet/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test notification from NFTSol',
          data: { type: 'test' }
        })
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  if (!isSupported) {
    return (
      <div className="notifications-unsupported">
        <p>Push notifications are not supported on this device.</p>
      </div>
    );
  }

  return (
    <div className="mobile-push-notifications">
      <h3>Push Notifications</h3>
      
      <div className="permission-status">
        <span className="status-label">Status:</span>
        <span className={`status-value ${permission}`}>
          {permission === 'granted' ? '✅ Enabled' : 
           permission === 'denied' ? '❌ Denied' : '⚠️ Not Set'}
        </span>
      </div>

      {permission === 'default' && (
        <button onClick={requestPermission} className="request-permission-btn">
          Enable Notifications
        </button>
      )}

      {permission === 'granted' && (
        <button onClick={sendTestNotification} className="test-notification-btn">
          Send Test Notification
        </button>
      )}
    </div>
  );
};

// Mobile deep link component
export const MobileDeepLink: React.FC<{
  type: 'wallet' | 'transaction' | 'fair-launch';
  data: any;
}> = ({ type, data }) => {
  const [deepLink, setDeepLink] = useState<string>('');

  useEffect(() => {
    generateDeepLink();
  }, [type, data]);

  const generateDeepLink = async () => {
    try {
      let endpoint = '';
      let body: any = {};

      switch (type) {
        case 'wallet':
          endpoint = '/api/mobile-wallet/deep-link/wallet-connect';
          body = { walletType: data.walletType, returnUrl: data.returnUrl };
          break;
        case 'transaction':
          endpoint = '/api/mobile-wallet/deep-link/transaction';
          body = { transactionData: data.transactionData, returnUrl: data.returnUrl };
          break;
        case 'fair-launch':
          endpoint = '/api/mobile-wallet/deep-link/fair-launch';
          body = { fairLaunch: data.fairLaunch, returnUrl: data.returnUrl };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDeepLink(result.data.deepLink);
      }
    } catch (error) {
      console.error('Failed to generate deep link:', error);
    }
  };

  const openDeepLink = () => {
    if (deepLink) {
      window.open(deepLink, '_blank');
    }
  };

  return (
    <div className="mobile-deep-link">
      <h3>Deep Link</h3>
      
      <div className="deep-link-content">
        <p className="deep-link-url">{deepLink}</p>
        
        <button 
          onClick={openDeepLink}
          disabled={!deepLink}
          className="open-deep-link-btn"
        >
          Open in Mobile Wallet
        </button>
      </div>
    </div>
  );
};

// Mobile-optimized layout component
export const MobileLayout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="mobile-layout">
      <div className="mobile-header">
        <h1>NFTSol Mobile</h1>
        <MobileWalletConnect />
      </div>
      
      <div className="mobile-content">
        {children}
      </div>
      
      <div className="mobile-footer">
        <MobilePushNotifications />
      </div>
    </div>
  );
};

// Mobile-specific styles
export const mobileStyles = `
  .mobile-layout {
    max-width: 100%;
    margin: 0 auto;
    padding: 16px;
    background: #f5f5f5;
    min-height: 100vh;
  }

  .mobile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #ddd;
    margin-bottom: 20px;
  }

  .mobile-header h1 {
    font-size: 24px;
    margin: 0;
    color: #333;
  }

  .mobile-content {
    flex: 1;
    padding: 20px 0;
  }

  .mobile-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #ddd;
  }

  .mobile-wallet-connect {
    margin: 16px 0;
  }

  .wallet-status {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .connected-state {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #e8f5e8;
    border-radius: 8px;
    border: 1px solid #4caf50;
  }

  .wallet-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .wallet-icon {
    font-size: 20px;
  }

  .wallet-address {
    font-family: monospace;
    font-size: 14px;
    color: #333;
  }

  .connect-btn, .disconnect-btn, .sign-btn, .participate-btn {
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .connect-btn {
    background: #4caf50;
    color: white;
  }

  .connect-btn:hover:not(:disabled) {
    background: #45a049;
  }

  .disconnect-btn {
    background: #f44336;
    color: white;
  }

  .disconnect-btn:hover:not(:disabled) {
    background: #da190b;
  }

  .sign-btn, .participate-btn {
    background: #2196f3;
    color: white;
  }

  .sign-btn:hover:not(:disabled), .participate-btn:hover:not(:disabled) {
    background: #1976d2;
  }

  .mobile-transaction, .mobile-fair-launch {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin: 16px 0;
  }

  .transaction-details h3, .fair-launch-header h2 {
    margin: 0 0 16px 0;
    color: #333;
  }

  .transaction-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
  }

  .fair-launch-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }

  .label {
    font-weight: 600;
    color: #666;
  }

  .value {
    font-family: monospace;
    color: #333;
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    background: #e3f2fd;
    color: #1976d2;
  }

  .participation-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .participation-form label {
    font-weight: 600;
    color: #333;
  }

  .participation-form input {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
  }

  .mobile-push-notifications {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .mobile-push-notifications h3 {
    margin: 0 0 16px 0;
    color: #333;
  }

  .permission-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .status-label {
    font-weight: 600;
    color: #666;
  }

  .status-value.granted {
    color: #4caf50;
  }

  .status-value.denied {
    color: #f44336;
  }

  .status-value.default {
    color: #ff9800;
  }

  .request-permission-btn, .test-notification-btn {
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    background: #2196f3;
    color: white;
  }

  .request-permission-btn:hover, .test-notification-btn:hover {
    background: #1976d2;
  }

  .mobile-deep-link {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin: 16px 0;
  }

  .mobile-deep-link h3 {
    margin: 0 0 16px 0;
    color: #333;
  }

  .deep-link-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .deep-link-url {
    padding: 12px;
    background: #f5f5f5;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    word-break: break-all;
    margin: 0;
  }

  .open-deep-link-btn {
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    background: #4caf50;
    color: white;
  }

  .open-deep-link-btn:hover:not(:disabled) {
    background: #45a049;
  }

  .open-deep-link-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .notifications-unsupported {
    text-align: center;
    padding: 20px;
    color: #666;
    background: #f5f5f5;
    border-radius: 8px;
  }

  @media (max-width: 768px) {
    .mobile-layout {
      padding: 12px;
    }
    
    .mobile-header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }
    
    .mobile-header h1 {
      text-align: center;
    }
  }
`;

export default {
  MobileWalletConnect,
  MobileTransaction,
  MobileFairLaunch,
  MobilePushNotifications,
  MobileDeepLink,
  MobileLayout,
  mobileStyles
};
