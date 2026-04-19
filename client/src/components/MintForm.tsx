import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import confetti from 'canvas-confetti';
import { useNotification } from './NotificationSystem';
import { useMintCost } from '../hooks/useMintCost';

export default function MintForm() {
  const { publicKey, connected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();
  const { estimate, comparison, loading: costLoading } = useMintCost();

  const mint = async () => {
    if (!file || !name || !connected) return;
    setLoading(true);

    try {
      const { API_ENDPOINTS } = await import('../config/api');

      console.log('Starting NFT mint...');
      console.log('  Name:', name);
      console.log('  File:', file.name, `(${(file.size / 1024).toFixed(2)}KB)`);
      console.log('  Wallet:', publicKey?.toBase58());

      console.log('Fetching CSRF token...');
      const csrfRes = await fetch(API_ENDPOINTS.mint, {
        method: 'GET',
        credentials: 'include',
      });

      if (!csrfRes.ok) {
        throw new Error(`Failed to obtain CSRF token (HTTP ${csrfRes.status})`);
      }

      // Read the token from the JSON response. The XSRF-TOKEN cookie is set by
      // the backend (nftsol.onrender.com), but when the frontend is on a
      // different origin (nftsol.app) the browser will not expose that cookie
      // via document.cookie — so we must use the response body.
      const csrfJson = await csrfRes.json().catch(() => ({}));
      const csrfToken: string | undefined = csrfJson?.csrfToken;

      if (!csrfToken) {
        throw new Error('Failed to obtain CSRF token');
      }

      console.log('CSRF token obtained');

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', `Minted NFT: ${name}`);
      formData.append('creatorWallet', publicKey!.toBase58());
      formData.append('file', file, file.name);
      formData.append('_csrf', csrfToken);

      console.log('Sending to:', API_ENDPOINTS.mint);

      const mintRes = await fetch(API_ENDPOINTS.mint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        body: formData,
      });

      const mintData = await mintRes.json();

      if (mintData.success) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#c9a84c', '#dbb85a', '#a88a3a', '#f5f5f5'],
        });

        const mintAddress = mintData.data?.mintAddress || mintData.data?.mint;
        addNotification({
          type: 'success',
          title: 'NFT Minted Successfully!',
          message: mintAddress
            ? `Your NFT "${name}" has been minted on Solana. Mint Address: ${mintAddress.slice(0, 8)}...`
            : `Your NFT "${name}" has been minted on Solana.`,
          duration: 6000,
        });

        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('change-tab', { detail: 'my-nfts' }));
        }, 1500);

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
      <div className="bg-[#111111] border border-[#1e1e1e] rounded-lg p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white font-display mb-2">Mint Your NFT</h3>
          <p className="text-zinc-400 text-sm mb-5">Create your unique digital asset on Solana</p>

          {/* Cost badge */}
          {!costLoading && estimate && (
            <div className="inline-flex items-center gap-2.5 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-md px-5 py-2.5">
              <div className="text-left">
                <div className="text-[10px] text-[#c9a84c] font-medium uppercase tracking-wider">Mint Cost</div>
                <div className="text-base font-bold text-white">${estimate.usdCost.toFixed(4)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Cost Comparison */}
        {!costLoading && comparison && (
          <div className="mb-8 p-5 bg-[#0c0c0c] border border-[#1e1e1e] rounded-lg">
            <h4 className="text-center text-xs font-medium text-zinc-400 mb-4 uppercase tracking-wider">
              Why Choose NFTSol?
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[10px] text-zinc-500 mb-1">NFTSol</div>
                <div className="text-xl font-bold text-[#c9a84c]">${comparison.nftSol.cost.toFixed(4)}</div>
                <div className="text-[10px] text-zinc-600">{comparison.nftSol.time}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 mb-1">OpenSea + ETH</div>
                <div className="text-xl font-bold text-zinc-400">${comparison.openSea.cost.toFixed(2)}</div>
                <div className="text-[10px] text-zinc-600">{comparison.openSea.time}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 mb-1">pump.fun</div>
                <div className="text-xl font-bold text-zinc-400">${comparison.pumpFun.cost.toFixed(2)}</div>
                <div className="text-[10px] text-zinc-600">{comparison.pumpFun.time}</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1e1e1e] text-center">
              <span className="text-[#c9a84c] font-semibold text-sm">
                {comparison.savings.vsOpenSea}% cheaper than Ethereum NFTs
              </span>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {/* File Upload */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Upload Image</label>
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
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#2a2a2a] hover:border-[#c9a84c]/40 rounded-lg cursor-pointer bg-[#0c0c0c] transition-colors"
              >
                {file ? (
                  <div className="text-center">
                    <svg className="w-6 h-6 mx-auto mb-2 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-[#c9a84c] font-medium">{file.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto mb-2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-zinc-500">Click to upload image</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* NFT Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">NFT Name</label>
            <input
              placeholder="Enter your NFT name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#0c0c0c] border border-[#1e1e1e] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
            />
          </div>

          {/* Mint Button */}
          <button
            onClick={mint}
            disabled={!connected || loading || !file || !name}
            className="w-full bg-[#c9a84c] hover:bg-[#b8973f] text-black py-3.5 text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                <span>Minting on Solana...</span>
              </div>
            ) : (
              'Mint NFT'
            )}
          </button>

          {/* Status Messages */}
          {!connected && (
            <div className="text-center">
              <div className="bg-red-500/5 border border-red-500/10 px-4 py-2.5 rounded-md">
                <p className="text-red-400 text-xs">Connect your wallet to start minting</p>
              </div>
            </div>
          )}

          {connected && !file && (
            <div className="text-center">
              <p className="text-zinc-500 text-xs">Please upload an image to continue</p>
            </div>
          )}

          {connected && file && !name && (
            <div className="text-center">
              <p className="text-zinc-500 text-xs">Please enter a name for your NFT</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 pt-6 border-t border-[#1e1e1e]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <div className="bg-[#0c0c0c] border border-[#1e1e1e] p-4 rounded-lg">
              <h4 className="font-medium text-white text-xs mb-1">Lightning Fast</h4>
              <p className="text-[10px] text-zinc-500">Mint in seconds on Solana</p>
            </div>
            <div className="bg-[#0c0c0c] border border-[#1e1e1e] p-4 rounded-lg">
              <h4 className="font-medium text-white text-xs mb-1">Secure</h4>
              <p className="text-[10px] text-zinc-500">Blockchain verified</p>
            </div>
            <div className="bg-[#0c0c0c] border border-[#c9a84c]/10 p-4 rounded-lg">
              <h4 className="font-medium text-[#c9a84c] text-xs mb-1">Ultra-Cheap</h4>
              <p className="text-[10px] text-[#c9a84c]/60">
                {!costLoading && estimate
                  ? `$${estimate.usdCost.toFixed(4)} per mint`
                  : 'Pennies per mint'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
