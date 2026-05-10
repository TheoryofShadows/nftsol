/**
 * Archive Item Modal — verify with Grok then mint directly from here.
 */
import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import confetti from 'canvas-confetti';
import { SearchResult, archiveService } from '../services/archiveService';
import { useNotification } from './NotificationSystem';

interface ArchiveItemModalProps {
  item: SearchResult;
  onClose: () => void;
}

interface VerifyResult {
  verified: boolean;
  truthScore: number;
  summary: string;
  concerns: string[];
}

interface MintResult {
  mintAddress?: string;
  signature?: string;
  costUSD?: number;
}

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://nftsol.onrender.com');

export const ArchiveItemModal: React.FC<ArchiveItemModalProps> = ({ item, onClose }) => {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { addNotification } = useNotification();

  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState('');

  const [minting, setMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError('');
    try {
      const raw = await archiveService.verifyWithGrok(item.identifier);
      const v = (raw as any).verification ?? raw;
      setVerifyResult({
        verified: !!(v?.verified ?? (raw as any).readyForMinting),
        truthScore: typeof v?.truthScore === 'number' ? v.truthScore
          : typeof v?.confidence === 'number' ? Math.round(v.confidence * 100)
          : 75,
        summary: v?.summary ?? '',
        concerns: Array.isArray(v?.concerns) ? v.concerns : [],
      });
    } catch {
      setVerifyError('Grok verification failed. You can still mint without a score.');
      setVerifyResult({ verified: false, truthScore: 0, summary: '', concerns: [] });
    } finally {
      setVerifying(false);
    }
  };

  const handleMint = async () => {
    if (!publicKey) return;
    setMinting(true);
    try {
      const attributes: { trait_type: string; value: string | number }[] = [
        { trait_type: 'Source', value: 'Internet Archive' },
        { trait_type: 'Archive ID', value: item.identifier },
        { trait_type: 'Media Type', value: item.mediaType },
        { trait_type: 'License', value: item.licenseType },
      ];
      if (item.year) attributes.push({ trait_type: 'Year', value: item.year });
      if (item.creator) attributes.push({ trait_type: 'Creator', value: item.creator });
      if (verifyResult) {
        attributes.push({ trait_type: 'Grok Truth Score', value: verifyResult.truthScore });
        attributes.push({ trait_type: 'Grok Verified', value: verifyResult.verified ? 'Yes' : 'No' });
      }

      const res = await fetch(`${API_BASE}/api/mint/ultra-cheap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress: publicKey.toBase58(),
          name: item.title.slice(0, 32),
          symbol: 'ARCH',
          description: [
            item.description || item.title,
            verifyResult?.summary ? `Grok: ${verifyResult.summary}` : '',
          ].filter(Boolean).join(' | ').slice(0, 400),
          imageUrl: item.thumbnailUrl || `https://archive.org/services/img/${item.identifier}`,
          externalUrl: item.archiveUrl,
          attributes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Mint failed');

      setMintResult({
        mintAddress: data.data?.mintAddress ?? data.data?.assetId,
        signature: data.data?.signature,
        costUSD: data.data?.costUSD,
      });

      // Award CLOUT best-effort
      if (verifyResult?.verified && verifyResult.truthScore >= 70) {
        fetch(`${API_BASE}/api/clout/reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientAddress: publicKey.toBase58(),
            amount: 10,
            multiplier: verifyResult.truthScore >= 90 ? 2.0 : 1.5,
          }),
        }).catch(() => {});
      }

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#c9a84c', '#14f195', '#9945ff'] });
      addNotification({
        type: 'success',
        title: 'NFT Minted!',
        message: `"${item.title.slice(0, 40)}" is live on Solana${data.data?.costUSD ? ` for $${data.data.costUSD.toFixed(4)}` : ''}.`,
        duration: 7000,
      });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Mint Failed', message: err.message || 'Please try again.', duration: 5000 });
    } finally {
      setMinting(false);
    }
  };

  const scoreColor = !verifyResult ? '' : verifyResult.truthScore >= 80 ? 'text-green-400' : verifyResult.truthScore >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#1e1e1e] rounded-2xl max-w-xl w-full my-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-[#1e1e1e] bg-[#111111] rounded-t-2xl">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-[#c9a84c] uppercase tracking-wider capitalize">{item.mediaType}</span>
            <h2 className="text-lg font-bold text-white truncate">{item.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="ml-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white text-lg transition-all flex-shrink-0">
            ×
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Thumbnail */}
          {item.thumbnailUrl && (
            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-48 object-cover rounded-xl" />
          )}

          {/* Description */}
          {item.description && (
            <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">{item.description}</p>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {item.creator && <div><p className="text-zinc-500 text-xs mb-0.5">Creator</p><p className="text-white font-medium truncate">{item.creator}</p></div>}
            {item.year && <div><p className="text-zinc-500 text-xs mb-0.5">Year</p><p className="text-white font-medium">{item.year}</p></div>}
            <div><p className="text-zinc-500 text-xs mb-0.5">Downloads</p><p className="text-white font-medium">{item.downloads.toLocaleString()}</p></div>
            <div><p className="text-zinc-500 text-xs mb-0.5">License</p><p className="text-white font-medium capitalize">{item.licenseType}</p></div>
          </div>

          {/* Archive ID */}
          <div className="px-3 py-2 bg-[#0c0c0c] border border-[#1e1e1e] rounded-lg">
            <p className="text-xs text-zinc-500 mb-0.5">Archive ID</p>
            <p className="text-zinc-300 font-mono text-xs break-all">{item.identifier}</p>
          </div>

          {/* Verify section */}
          {!mintResult && (
            <>
              {!verifyResult ? (
                <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-xl p-4 text-center">
                  <p className="text-zinc-400 text-sm mb-3">
                    Run Grok AI verification to embed a truth score in your NFT's metadata.
                  </p>
                  {verifyError && <p className="text-yellow-400 text-xs mb-2">{verifyError}</p>}
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    {verifying ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying with Grok…
                      </span>
                    ) : '🤖 Verify with Grok'}
                  </button>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border ${
                  verifyResult.verified ? 'bg-green-500/10 border-green-500/30'
                  : verifyResult.truthScore >= 50 ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-2xl font-black ${scoreColor}`}>{verifyResult.truthScore}%</span>
                    <div>
                      <div className={`font-semibold text-sm ${scoreColor}`}>
                        {verifyResult.verified ? '✓ Verified by Grok' : verifyResult.truthScore >= 50 ? '⚠ Partially verified' : '✗ Low confidence'}
                      </div>
                      <div className="text-xs text-zinc-500">Truth score will be embedded in NFT metadata</div>
                    </div>
                  </div>
                  {verifyResult.summary && <p className="text-zinc-300 text-xs">{verifyResult.summary}</p>}
                  {verifyResult.concerns.length > 0 && (
                    <ul className="mt-2 text-xs text-zinc-500 space-y-0.5">
                      {verifyResult.concerns.map((c, i) => <li key={i}>• {c}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {/* Mint button */}
              <div className="space-y-2">
                {!connected ? (
                  <button
                    onClick={() => setVisible(true)}
                    className="w-full py-3.5 bg-[#c9a84c] hover:bg-[#b8973f] text-black font-bold rounded-xl transition-colors"
                  >
                    Connect Wallet to Mint
                  </button>
                ) : (
                  <button
                    onClick={handleMint}
                    disabled={minting}
                    className="w-full py-3.5 bg-[#c9a84c] hover:bg-[#b8973f] disabled:opacity-50 text-black font-bold rounded-xl transition-colors"
                  >
                    {minting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Minting on Solana…
                      </span>
                    ) : verifyResult
                      ? `Mint NFT — ${verifyResult.truthScore}% verified — ~$0.0001`
                      : 'Mint NFT — ~$0.0001'}
                  </button>
                )}
                <a
                  href={item.archiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 text-center bg-[#1e1e1e] hover:bg-[#2a2a2a] text-zinc-400 hover:text-white text-sm font-medium rounded-xl transition-colors"
                >
                  View on Archive.org ↗
                </a>
              </div>
            </>
          )}

          {/* Mint success */}
          {mintResult && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-white font-bold text-lg mb-1">Minted!</h3>
              {mintResult.costUSD && (
                <p className="text-zinc-400 text-sm mb-3">Cost: ${mintResult.costUSD.toFixed(4)}</p>
              )}
              {mintResult.mintAddress && (
                <div className="text-left mb-2">
                  <p className="text-xs text-zinc-500 mb-0.5">Mint Address</p>
                  <p className="font-mono text-xs text-zinc-300 break-all">{mintResult.mintAddress}</p>
                </div>
              )}
              {mintResult.signature && (
                <div className="text-left mb-4">
                  <p className="text-xs text-zinc-500 mb-0.5">Transaction</p>
                  <a
                    href={`https://explorer.solana.com/tx/${mintResult.signature}?cluster=mainnet-beta`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#c9a84c] break-all hover:underline"
                  >
                    {mintResult.signature.slice(0, 20)}… ↗
                  </a>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('change-tab', { detail: 'my-nfts' })); }}
                  className="flex-1 py-2.5 bg-[#c9a84c] hover:bg-[#b8973f] text-black font-bold rounded-xl text-sm transition-colors"
                >
                  View My NFTs
                </button>
                <button onClick={onClose} className="flex-1 py-2.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white text-sm font-semibold rounded-xl transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveItemModal;
