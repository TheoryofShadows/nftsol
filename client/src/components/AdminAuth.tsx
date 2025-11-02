import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from './NotificationSystem';

interface AdminAuthProps {
  onAuthSuccess: () => void;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthSuccess }) => {
  const { connected, publicKey, signMessage } = useWallet();
  const { addNotification } = useNotification();
  const [authenticating, setAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAdminLogin = async () => {
    if (!connected || !publicKey || !signMessage) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please connect your wallet first',
      });
      return;
    }

    setAuthenticating(true);

    try {
      // Create a challenge message
      const challenge = `Admin authentication for NFTSol\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`;

      // Request signature from wallet
      const signature = await signMessage(new TextEncoder().encode(challenge));

      // Send to backend for verification
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/auth/admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: publicKey.toBase58(),
            signature: Array.from(signature),
            message: challenge,
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Admin authentication successful!',
        });
        onAuthSuccess();
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Admin auth error:', error);
      addNotification({
        type: 'error',
        title: 'Authentication Failed',
        message: error.message || 'You do not have admin privileges',
      });
    } finally {
      setAuthenticating(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="glass p-8 rounded-2xl text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-white mb-2">Authenticated</h3>
        <p className="text-gray-300">You have admin access</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="glass p-12 rounded-2xl max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-2xl font-bold text-white mb-2">Admin Access Required</h3>
        <p className="text-gray-300 mb-6">
          Please connect your authorized admin wallet to continue
        </p>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300 text-sm">
            ⚠️ Only authorized admin wallets can access this area
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-12 rounded-2xl max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🛡️</div>
        <h3 className="text-3xl font-bold text-white mb-2">Admin Authentication</h3>
        <p className="text-gray-300">Sign the message to verify admin privileges</p>
      </div>

      <div className="space-y-4">
        <div className="bg-black/30 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Connected Wallet:</p>
          <p className="font-mono text-cyan-400 break-all">{publicKey?.toBase58()}</p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-300 text-sm">
            ⚠️ Admin access is restricted to authorized wallets only
          </p>
        </div>

        <button
          onClick={handleAdminLogin}
          disabled={authenticating}
          className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {authenticating ? (
            <span className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Authenticating...
            </span>
          ) : (
            '🔐 Authenticate as Admin'
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminAuth;
