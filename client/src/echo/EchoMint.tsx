/* eslint-disable react/forbid-dom-props */
// Microsoft Edge Tools: All inline styles have been moved to external CSS file (EchoMint.css)

/**
 * 🎬 EchoMint Component
 * NFTSol's Eternal Echoes minting interface for creating layered video NFTs
 *
 * @component
 * @creator NFTSol Team
 * @license MIT
 * @description Eternal Echoes is an original NFTSol feature enabling collaborative
 *              creation of layered NFTs from Internet Archive public domain videos
 *              with AI verification via Grok and compression via Metaplex Bubblegum.
 */
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import confetti from 'canvas-confetti';
import { useNotification } from '../components/NotificationSystem';
import TruthBadge from '../components/TruthBadge';
import { logger } from '../utils/logger';
import '../styles/EchoMint.css';

// Lazy load video upload component
const VideoUpload = lazy(() => import('./VideoUpload'));

type IASearchResult = {
  identifier: string;
  title: string;
  description?: string;
  year?: string;
  creator?: string;
  thumbnail?: string;
  verificationTeaser?: string;
  truthScore?: number;
};

type MintData = {
  iaId: string;
  title: string;
  description?: string;
  videoUri: string;
  thumbnailUri?: string;
  grokTruthHash: number[];
  truthScore: number;
  teaser: string;
  verified: boolean;
};

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export default function EchoMint() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<IASearchResult[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mintData, setMintData] = useState<MintData | null>(null);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [prefetchedThumbnails, setPrefetchedThumbnails] = useState<Map<string, string>>(new Map());
  const [uploadMode, setUploadMode] = useState<'archive' | 'upload'>('archive');
  const [, setUploadedVideoUrl] = useState<string | null>(null); // Reserved for future use
  const [, setUploadedMetadataUri] = useState<string | null>(null);
  const { publicKey } = useWallet();
  const { addNotification } = useNotification();

  // Prefetch thumbnails for search results
  useEffect(() => {
    if (!results || results.length === 0) return;

    const prefetch = async () => {
      const thumbnailMap = new Map<string, string>();

      for (const result of results) {
        if (result.thumbnail) {
          try {
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = result.thumbnail!;
            });
            thumbnailMap.set(result.identifier, result.thumbnail);
          } catch {
            // Thumbnail failed to load, skip
          }
        }
      }

      setPrefetchedThumbnails(thumbnailMap);
    };

    prefetch();
  }, [results]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 3) {
      setResults(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/echo/search?q=${encodeURIComponent(debounced)}&rows=20`
        );
        const data = await res.json();
        if (!cancelled) setResults(data.results || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    if (!selected || !publicKey) {
      setMintData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/echo/mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ iaId: selected, walletAddress: publicKey.toBase58() }),
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) setMintData(data as MintData);
      } catch {
        if (!cancelled) setMintData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, publicKey]);

  const handleMint = async () => {
    if (!mintData || !publicKey) return;
    setMinting(true);

    try {
      // Build attributes including Grok truth score so it lands on-chain
      const attributes = [
        { trait_type: 'Source', value: 'Internet Archive' },
        { trait_type: 'Archive ID', value: mintData.iaId },
        { trait_type: 'Grok Truth Score', value: mintData.truthScore },
        { trait_type: 'Grok Verified', value: mintData.verified ? 'Yes' : 'No' },
      ];

      const mintRes = await fetch(`${API_BASE}/api/mint/ultra-cheap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress: publicKey.toBase58(),
          name: mintData.title.slice(0, 32),
          symbol: 'ECHO',
          description: [
            mintData.description || mintData.title,
            mintData.teaser ? `Grok: ${mintData.teaser}` : '',
          ].filter(Boolean).join(' | ').slice(0, 400),
          imageUrl: mintData.thumbnailUri || `https://archive.org/services/img/${mintData.iaId}`,
          externalUrl: `https://archive.org/details/${mintData.iaId}`,
          attributes,
        }),
      });

      const mintJson = await mintRes.json();
      if (!mintJson.success) throw new Error(mintJson.error || 'Mint failed');

      const txSig = mintJson.data?.signature ?? null;

      // Award CLOUT for verified high-score content (best-effort)
      if (mintData.verified && mintData.truthScore >= 70) {
        try {
          await fetch(`${API_BASE}/api/clout/reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientAddress: publicKey.toBase58(),
              amount: 10,
              multiplier: mintData.truthScore >= 90 ? 2.0 : 1.5,
            }),
          });
        } catch { /* CLOUT is best-effort */ }
      }

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#9945FF', '#14F195', '#00D4FF', '#c9a84c', '#ffffff'],
      });

      addNotification({
        type: 'success',
        title: 'Echo Minted!',
        message: `"${mintData.title.slice(0, 40)}" minted on Solana with ${mintData.truthScore}% truth score${mintData.verified ? ' — CLOUT reward sent!' : ''}.`,
        duration: 7000,
      });

      // Navigate to portfolio so user can see their new NFT
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('change-tab', { detail: 'my-nfts' }));
      }, 1000);

      // Keep txSig available in console for debugging
      if (txSig) logger.info('[EchoMint] tx:', txSig);
    } catch (error: any) {
      console.error('[EchoMint] Error:', error);
      addNotification({
        type: 'error',
        title: 'Echo Mint Failed',
        message: error.message || 'Failed to mint echo. Please check your wallet is connected and try again.',
        duration: 5000,
      });
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">🎬 Eternal Echoes</h2>
        <WalletMultiButton className="btn-glass" />
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4 glass p-2 rounded-lg" data-tour="video-upload-toggle">
        <button
          onClick={() => {
            setUploadMode('archive');
            setUploadedVideoUrl(null);
            setUploadedMetadataUri(null);
            setMintData(null);
          }}
          className={`flex-1 py-2 px-4 rounded transition-all ${
            uploadMode === 'archive'
              ? 'bg-purple-500 text-white font-semibold'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          📚 Internet Archive
        </button>
        <button
          onClick={() => {
            setUploadMode('upload');
            setSelected(null);
            setMintData(null);
          }}
          className={`flex-1 py-2 px-4 rounded transition-all ${
            uploadMode === 'upload'
              ? 'bg-purple-500 text-white font-semibold'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          📹 Upload Video
        </button>
      </div>

      {uploadMode === 'archive' ? (
      <div className="glass p-3 rounded mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Internet Archive…"
          className="w-full bg-transparent outline-none text-white placeholder-gray-400"
        />
      </div>
      ) : (
        <div className="mb-4" data-tour="video-upload-area">
          <Suspense fallback={<div className="p-4 text-center text-gray-400">Loading uploader...</div>}>
            <VideoUpload
              onSuccess={(videoUrl, metadataUri, verification) => {
                setUploadedVideoUrl(videoUrl);
                setUploadedMetadataUri(metadataUri);
                // Create mint data from uploaded video with verification
                setMintData({
                  iaId: `upload-${Date.now()}`,
                  title: 'Uploaded Video NFT',
                  description: 'Your uploaded video',
                  videoUri: videoUrl,
                  grokTruthHash: [],
                  truthScore: verification?.score || 0,
                  teaser: verification?.summary || 'Video uploaded successfully',
                  verified: verification?.verified || false,
                });
              }}
            />
          </Suspense>
        </div>
      )}

      {loading && <div className="text-gray-300 mb-2">Searching…</div>}

      {results && (
        <div className="space-y-2 mb-4">
          {results.map((r, index) => {
            const thumbnail = prefetchedThumbnails.get(r.identifier);
            return (
              <button
                key={r.identifier}
                className={`w-full text-left glass p-3 rounded transform transition-all duration-300 hover:scale-105 hover:shadow-lg echo-mint-result-card ${
                  selected === r.identifier
                    ? 'bg-white/10 border-2 border-purple-400/50'
                    : 'border border-white/10'
                }`}
                onClick={() => setSelected(r.identifier)}
                data-animation-delay={Math.round((index * 50) / 50) * 50}
              >
                <div className="flex items-start gap-3">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={r.title}
                      className="w-20 h-20 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded flex-shrink-0 flex items-center justify-center">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold mb-1 truncate">{r.title}</div>
                    <div className="text-gray-300 text-sm mb-2">
                      {r.year ? `📅 ${r.year} ` : ''}
                      {r.creator ? `👤 ${r.creator}` : ''}
                    </div>
                    {r.truthScore !== undefined && <TruthBadge score={r.truthScore} size="sm" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {mintData && (
        <div className="glass p-4 rounded-xl animate-slide-up">
          <div className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span>✨</span>
            <span>Preview Your Echo</span>
          </div>

          {/* Video Preview with Loading */}
          <div className="relative mb-4 rounded-lg overflow-hidden">
            {minting && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="loading-spinner mx-auto mb-2"></div>
                  <div className="text-white font-semibold">Minting on Solana...</div>
                </div>
              </div>
            )}
            <video
              src={mintData.videoUri}
              controls
              className="w-full rounded-lg mb-3"
              poster={mintData.thumbnailUri}
              preload="metadata"
            />
          </div>

          <div className="text-white font-semibold text-xl mb-2">{mintData.title}</div>
          {mintData.description && (
            <div className="text-gray-300 text-sm mb-4 line-clamp-3">{mintData.description}</div>
          )}

          {/* Truth Score Badge */}
          <div className="mb-4 flex items-center gap-3">
            <TruthBadge
              score={mintData.truthScore}
              verified={mintData.verified}
              showPulse={mintData.verified}
            />
            <span className="text-gray-400 text-sm">
              {mintData.verified ? '✓ Verified Content' : '⚠ Requires Review'}
            </span>
          </div>

          {/* Mint Button with Progress */}
          <button
            className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            disabled={!publicKey || minting}
            onClick={handleMint}
          >
            {minting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="loading-spinner w-5 h-5"></div>
                <span>Minting...</span>
              </span>
            ) : publicKey ? (
              '🚀 Mint Echo – CLOUT x2!'
            ) : (
              'Connect Wallet to Mint'
            )}
          </button>

          {mintData.teaser && (
            <div className="mt-4 glass p-3 rounded-lg text-sm text-gray-300">
              <strong>Verification Summary:</strong> {mintData.teaser}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
