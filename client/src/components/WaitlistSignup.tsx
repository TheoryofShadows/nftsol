import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface WaitlistData {
  email: string;
  walletAddress?: string;
  referralCode?: string;
  source: 'landing' | 'referral' | 'social';
}

export default function WaitlistSignup() {
  const { publicKey, connected } = useWallet();
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill wallet address if connected
  React.useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toBase58());
    }
  }, [connected, publicKey]);

  // Get referral code from URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const waitlistData: WaitlistData = {
        email,
        walletAddress: walletAddress || undefined,
        referralCode: referralCode || undefined,
        source: referralCode ? 'referral' : 'landing',
      };

      // Submit to ConvertKit (or your preferred service)
      const response = await fetch('/api/waitlist/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(waitlistData),
      });

      if (response.ok) {
        setSubmitted(true);

        // Track conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'waitlist_signup', {
            event_category: 'engagement',
            event_label: referralCode ? 'referral' : 'organic',
          });
        }
      } else {
        throw new Error('Failed to subscribe');
      }
    } catch (err) {
      setError('Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="card-glass p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold gradient-text mb-4">You&apos;re In!</h3>
        <p className="text-gray-300 mb-6">
          Welcome to the NFTSol community! You&apos;ll be the first to know when we launch.
        </p>

        <div className="space-y-4">
          <div className="glass p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">What&apos;s Next?</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Early access to new features</li>
              <li>• Exclusive airdrops and rewards</li>
              <li>• Direct line to our team</li>
              <li>• Beta testing opportunities</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => window.open('https://twitter.com', '_blank', 'noopener,noreferrer')}
              className="btn-primary flex-1"
            >
              🐦 Follow on Twitter
            </button>
            <button
              onClick={() => window.open('https://discord.com', '_blank', 'noopener,noreferrer')}
              className="btn-secondary flex-1"
            >
              💬 Join Discord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass p-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🚀</div>
        <h3 className="text-3xl font-bold gradient-text mb-2">Join the Waitlist</h3>
        <p className="text-gray-300">Be the first to experience the future of NFT marketplaces</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="input"
            required
          />
        </div>

        {/* Wallet Address (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            Solana Wallet Address {connected ? '(Connected)' : '(Optional)'}
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="7boWRDfn3aPE88jt5qpiryPLw56EneXhEMUdfbd5TR9f"
            className={`input ${connected ? 'bg-green-500/20 border-green-400/50' : ''}`}
            readOnly={connected}
          />
          <p className="text-xs text-gray-400 mt-1">
            {connected
              ? '✓ Auto-filled from connected wallet'
              : 'Get early access to exclusive airdrops'}
          </p>
        </div>

        {/* Referral Code (Auto-filled if from referral link) */}
        {referralCode && (
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Referral Code</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="input bg-green-500/20 border-green-400/50"
              readOnly
            />
            <p className="text-xs text-green-400 mt-1">
              🎉 You were referred! Both you and your referrer will get bonus rewards.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="glass p-3 rounded-lg border border-red-400/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="loading-spinner w-5 h-5"></div>
              <span>Joining Waitlist...</span>
            </div>
          ) : (
            '🚀 Join the Waitlist'
          )}
        </button>
      </form>

      {/* Benefits */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h4 className="font-semibold text-white mb-4 text-center">Waitlist Benefits</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass p-4 rounded-lg text-center">
            <div className="text-2xl mb-2">🎁</div>
            <h5 className="font-semibold text-white mb-1">Early Access</h5>
            <p className="text-xs text-gray-400">First to try new features</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <div className="text-2xl mb-2">💰</div>
            <h5 className="font-semibold text-white mb-1">Exclusive Rewards</h5>
            <p className="text-xs text-gray-400">Special airdrops & bonuses</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h5 className="font-semibold text-white mb-1">Priority Support</h5>
            <p className="text-xs text-gray-400">Direct access to our team</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <div className="text-2xl mb-2">🔮</div>
            <h5 className="font-semibold text-white mb-1">Future Features</h5>
            <p className="text-xs text-gray-400">Shape the platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
