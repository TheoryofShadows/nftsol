import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import confetti from 'canvas-confetti';
import { useNotification } from './NotificationSystem';

export default function MintForm() {
  const { publicKey, connected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  const mint = async () => {
    if (!file || !name || !connected) return;
    setLoading(true);

    try {
      // First, verify wallet exists
      const verifyRes = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/nfts/verify/${publicKey!.toBase58()}`
      );
      const verifyData = await verifyRes.json();

      if (!verifyData.success || !verifyData.data.exists) {
        addNotification({
          type: 'error',
          title: 'Wallet Verification Failed',
          message:
            'Wallet not found on Solana network. Please ensure your wallet is properly connected.',
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      // Create image URL (in production, upload to IPFS first)
      const imageUrl = URL.createObjectURL(file);

      // Mint NFT using real Solana blockchain
      const mintRes = await fetch(`${import.meta.env.VITE_API_BASE}/api/nfts/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toAddress: publicKey!.toBase58(),
          name: name,
          description: `Minted NFT: ${name}`,
          imageUrl: imageUrl,
        }),
      });

      const mintData = await mintRes.json();

      if (mintData.success) {
        // Trigger confetti celebration
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#9945FF', '#14F195', '#00D4FF', '#FF6B9D'],
        });

        // Show success notification
        addNotification({
          type: 'success',
          title: '🎉 NFT Minted Successfully!',
          message: `Your NFT "${name}" has been minted on Solana. Mint Address: ${mintData.data.mintAddress.slice(0, 8)}...`,
          duration: 6000,
        });

        // Auto-navigate to "My NFTs" tab after a short delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('change-tab', { detail: 'my-nfts' }));
        }, 1500);

        // Reset form
        setFile(null);
        setName('');
      } else {
        addNotification({
          type: 'error',
          title: 'Mint Failed',
          message: mintData.error || 'Failed to mint NFT. Please try again.',
          duration: 5000,
        });
      }
    } catch (e: any) {
      addNotification({
        type: 'error',
        title: 'Mint Failed',
        message: e.message || 'An unexpected error occurred. Please try again.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-glass p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-3xl font-bold gradient-text font-display mb-2">Mint Your NFT</h3>
          <p className="text-gray-300">Create your unique digital asset on Solana</p>
        </div>

        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Upload Image</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-cyan-400/50 rounded-xl cursor-pointer hover:border-cyan-400 transition-colors"
              >
                {file ? (
                  <div className="text-center">
                    <div className="text-2xl mb-2">📁</div>
                    <p className="text-sm text-cyan-300">{file.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-sm text-gray-400">Click to upload image</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* NFT Name */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">NFT Name</label>
            <input
              placeholder="Enter your NFT name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>

          {/* Mint Button */}
          <button
            onClick={mint}
            disabled={!connected || loading || !file || !name}
            className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-spinner w-5 h-5"></div>
                <span>Minting on Solana...</span>
              </div>
            ) : (
              '🚀 Mint NFT'
            )}
          </button>

          {/* Status Messages */}
          {!connected && (
            <div className="text-center">
              <div className="glass px-4 py-3 rounded-lg border border-red-400/30">
                <p className="text-red-400 text-sm">⚠️ Connect your wallet to start minting</p>
              </div>
            </div>
          )}

          {connected && !file && (
            <div className="text-center">
              <p className="text-gray-400 text-sm">📸 Please upload an image to continue</p>
            </div>
          )}

          {connected && file && !name && (
            <div className="text-center">
              <p className="text-gray-400 text-sm">✏️ Please enter a name for your NFT</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="glass p-4 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-semibold text-white mb-1">Lightning Fast</h4>
              <p className="text-xs text-gray-400">Mint in seconds on Solana</p>
            </div>
            <div className="glass p-4 rounded-lg">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="font-semibold text-white mb-1">Secure</h4>
              <p className="text-xs text-gray-400">Blockchain verified</p>
            </div>
            <div className="glass p-4 rounded-lg">
              <div className="text-2xl mb-2">💰</div>
              <h4 className="font-semibold text-white mb-1">Low Cost</h4>
              <p className="text-xs text-gray-400">Minimal fees</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
