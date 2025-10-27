/**
 * 📱 Mobile Wallet Callback Handler
 * Handles deep link callbacks from mobile wallets
 */

import React, { useEffect, useState } from 'react';
import { mobileWalletService } from '../services/mobileWalletService';
import './MobileWalletCallback.css';

interface MobileWalletCallbackProps {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

const MobileWalletCallback: React.FC<MobileWalletCallbackProps> = ({ 
  onSuccess, 
  onError 
}) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('loading');
  const [message, setMessage] = useState<string>('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = () => {
    try {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      
      // Handle the callback
      mobileWalletService.handleCallback(urlParams);
      
      // Check for success/error parameters
      const success = urlParams.get('success');
      const error = urlParams.get('error');
      const sessionId = urlParams.get('session');
      const type = urlParams.get('type');
      
      if (success === 'true') {
        setStatus('success');
        setMessage('Mobile wallet operation completed successfully!');
        setData({
          sessionId,
          type,
          success: true
        });
        
        if (onSuccess) {
          onSuccess({ sessionId, type, success: true });
        }
      } else if (error) {
        setStatus('error');
        setMessage(`Mobile wallet operation failed: ${error}`);
        setData({
          sessionId,
          type,
          error
        });
        
        if (onError) {
          onError(error);
        }
      } else {
        setStatus('idle');
        setMessage('No callback data received');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(`Error handling callback: ${err.message}`);
      
      if (onError) {
        onError(err.message);
      }
    }
  };

  const closeCallback = () => {
    // Close the callback window/tab
    if (window.opener) {
      window.close();
    } else {
      // Redirect back to the main app
      window.location.href = '/';
    }
  };

  return (
    <div className="mobile-wallet-callback">
      <div className="callback-container">
        <div className="callback-header">
          <h1>📱 Mobile Wallet</h1>
          <p>Processing wallet response...</p>
        </div>

        <div className="callback-content">
          {status === 'loading' && (
            <div className="callback-loading">
              <div className="loading-spinner"></div>
              <p>Processing wallet response...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="callback-success">
              <div className="success-icon">✅</div>
              <h2>Success!</h2>
              <p>{message}</p>
              {data && (
                <div className="callback-data">
                  <h3>Transaction Details:</h3>
                  <ul>
                    {data.sessionId && <li>Session ID: {data.sessionId}</li>}
                    {data.type && <li>Type: {data.type}</li>}
                    <li>Status: Success</li>
                  </ul>
                </div>
              )}
              <button onClick={closeCallback} className="btn-primary">
                Continue
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="callback-error">
              <div className="error-icon">❌</div>
              <h2>Error</h2>
              <p>{message}</p>
              {data && (
                <div className="callback-data">
                  <h3>Error Details:</h3>
                  <ul>
                    {data.sessionId && <li>Session ID: {data.sessionId}</li>}
                    {data.type && <li>Type: {data.type}</li>}
                    <li>Error: {data.error}</li>
                  </ul>
                </div>
              )}
              <button onClick={closeCallback} className="btn-primary">
                Try Again
              </button>
            </div>
          )}

          {status === 'idle' && (
            <div className="callback-idle">
              <div className="idle-icon">ℹ️</div>
              <h2>No Response</h2>
              <p>{message}</p>
              <button onClick={closeCallback} className="btn-primary">
                Close
              </button>
            </div>
          )}
        </div>

        <div className="callback-footer">
          <p>This window will close automatically or you can close it manually.</p>
        </div>
      </div>
    </div>
  );
};

export default MobileWalletCallback;
