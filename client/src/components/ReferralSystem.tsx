import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface ReferralData {
  code: string;
  totalReferrals: number;
  totalEarnings: number;
  referralLink: string;
}

export default function ReferralSystem() {
  const { publicKey, connected } = useWallet();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate referral code from wallet address
  const generateReferralCode = (walletAddress: string) => {
    return walletAddress.slice(0, 8).toUpperCase();
  };

  // Get referral data
  useEffect(() => {
    if (connected && publicKey) {
      const code = generateReferralCode(publicKey.toBase58());
      const referralLink = `https://nftsol.app?ref=${code}`;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReferralData({
        code,
        totalReferrals: 0, // This would come from your database
        totalEarnings: 0, // This would come from your database
        referralLink,
      });
    }
  }, [connected, publicKey]);

  // Copy referral link
  const copyReferralLink = async () => {
    if (referralData) {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Share on Twitter
  const shareOnTwitter = () => {
    if (referralData) {
      const tweetText = `🚀 Just discovered NFTSol - the fastest NFT marketplace on @solana! 

✨ Mint NFTs in seconds
💰 Earn 5% from referrals  
🎨 Beautiful glassmorphic UI

Join me: ${referralData.referralLink}

#NFTSol #Solana #NFTs`;

      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
        '_blank'
      );
    }
  };

  if (!connected) {
    return (
      <div className="card-glass p-6 text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h3 className="text-xl font-bold text-white mb-2">Referral System</h3>
        <p className="text-gray-300 mb-4">Connect your wallet to start earning from referrals!</p>
        <p className="text-sm text-cyan-400 mb-4">
          Click the &quot;Select Wallet&quot; button in the header to connect
        </p>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="card-glass p-6 text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-300">Loading referral data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold gradient-text">Referral Program</h3>
          <div className="text-4xl">🎯</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-cyan-400">{referralData.totalReferrals}</div>
            <div className="text-sm text-gray-400">Total Referrals</div>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">
              {referralData.totalEarnings.toFixed(4)} SOL
            </div>
            <div className="text-sm text-gray-400">Total Earnings</div>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">5%</div>
            <div className="text-sm text-gray-400">Commission Rate</div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Your Referral Link</h4>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 glass p-3 rounded-lg">
              <code className="text-cyan-300 break-all">{referralData.referralLink}</code>
            </div>
            <button
              onClick={copyReferralLink}
              className={`btn-secondary px-4 py-3 ${copied ? 'bg-green-600' : ''}`}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>

          <div className="flex space-x-3">
            <button onClick={shareOnTwitter} className="btn-primary flex-1">
              🐦 Share on Twitter
            </button>
            <button
              onClick={() => navigator.share?.({ url: referralData.referralLink })}
              className="btn-outline flex-1"
            >
              📱 Share
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-semibold text-white mb-4">How It Works</h4>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <div>
              <h5 className="font-semibold text-white">Share Your Link</h5>
              <p className="text-sm text-gray-400">Share your unique referral link with friends</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <div>
              <h5 className="font-semibold text-white">They Mint NFTs</h5>
              <p className="text-sm text-gray-400">
                When they mint NFTs using your link, you earn 5% of their fees
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
              3
            </div>
            <div>
              <h5 className="font-semibold text-white">Earn Automatically</h5>
              <p className="text-sm text-gray-400">
                Earnings are automatically credited to your wallet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Leaderboard */}
      <div className="card-glass p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Top Referrers</h4>

        <div className="space-y-3">
          {[
            { rank: 1, name: 'CryptoKing', referrals: 127, earnings: 2.45 },
            { rank: 2, name: 'NFTMaster', referrals: 98, earnings: 1.89 },
            { rank: 3, name: 'SolanaPro', referrals: 76, earnings: 1.52 },
            {
              rank: 4,
              name: 'You',
              referrals: referralData.totalReferrals,
              earnings: referralData.totalEarnings,
              isYou: true,
            },
          ].map((user) => (
            <div
              key={user.rank}
              className={`flex items-center justify-between p-3 rounded-lg ${user.isYou ? 'bg-gradient-to-r from-purple-500/20 to-cyan-400/20 border border-purple-400/30' : 'glass'}`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    user.rank <= 3
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {user.rank}
                </div>
                <span className={`font-semibold ${user.isYou ? 'text-cyan-300' : 'text-white'}`}>
                  {user.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">{user.referrals} referrals</div>
                <div className="text-cyan-400 font-semibold">{user.earnings.toFixed(3)} SOL</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
