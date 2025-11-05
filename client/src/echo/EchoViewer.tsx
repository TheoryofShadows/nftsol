import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import confetti from 'canvas-confetti';
import { useNotification } from '../components/NotificationSystem';
import TruthBadge from '../components/TruthBadge';

const EchoRemix = lazy(() => import('./EchoRemix'));

type Echo = {
  id: string;
  echoData: string;
  echoType: 'Text' | 'Audio' | 'Annotation' | 'Video';
  videoUri?: string; // For video echoes
  contributor: string;
  grokVerified: boolean;
  verificationScore: number;
  timestamp: string;
};

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export default function EchoViewer() {
  const { publicKey } = useWallet();
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [previousAvgScore, setPreviousAvgScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [newEcho, setNewEcho] = useState('');
  const [echoType, setEchoType] = useState<'Text' | 'Audio' | 'Annotation' | 'Video'>('Text');
  const [newVideoUri, setNewVideoUri] = useState<string>('');
  const [showRemix, setShowRemix] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    const stored = localStorage.getItem('currentEchoLedger');
    if (stored) setLedgerId(stored);
  }, []);

  const fetchEchoes = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/echo/${id}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const newEchoes = Array.isArray(data.echoes) ? data.echoes : [];
      // Calculate current avg score before updating
      const currentAvg = echoes.length
        ? Math.round(echoes.reduce((s, e) => s + e.verificationScore, 0) / echoes.length)
        : 0;
      setPreviousAvgScore(currentAvg);
      setEchoes(newEchoes);
    } catch (_e) {
      setEchoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ledgerId) return;
    fetchEchoes(ledgerId);
    const t = setInterval(() => fetchEchoes(ledgerId), 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerId]);

  const verifiedCount = useMemo(() => echoes.filter((e) => e.grokVerified).length, [echoes]);
  const avgScore = useMemo(
    () =>
      echoes.length
        ? Math.round(echoes.reduce((s, e) => s + e.verificationScore, 0) / echoes.length)
        : 0,
    [echoes]
  );

  // Check for score improvement and trigger confetti
  useEffect(() => {
    if (previousAvgScore > 0 && avgScore > previousAvgScore && avgScore > 70) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#14F195', '#9945FF'],
      });
      addNotification({
        type: 'success',
        title: '🎉 Verification Score Improved!',
        message: `Average truth score increased to ${avgScore}%`,
        duration: 4000,
      });
    }
  }, [avgScore, previousAvgScore, addNotification]);

  const addEcho = async () => {
    if (!ledgerId || !publicKey || !newEcho.trim()) return;

    try {
      const body: any = {
        ledgerId,
        echoData: newEcho,
        echoType,
        contributorWallet: publicKey.toBase58(),
      };

      // Add videoUri if echoType is Video
      if (echoType === 'Video' && newVideoUri) {
        body.videoUri = newVideoUri;
      }

      const res = await fetch(`${API_BASE}/api/echo/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setNewEcho('');

        addNotification({
          type: data.verified ? 'success' : 'warning',
          title: data.verified ? '✅ Echo Added & Verified!' : '⚠️ Echo Added',
          message: data.message || 'Echo layer added successfully',
          duration: 4000,
        });

        // Refresh echoes
        setTimeout(() => fetchEchoes(ledgerId), 500);
      } else {
        throw new Error('Failed to add echo');
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to Add Echo',
        message: error.message || 'Please try again',
        duration: 4000,
      });
    }
  };

  const getContributorInitial = (address: string) => {
    return address.slice(0, 2).toUpperCase();
  };

  const getContributorColor = (address: string) => {
    // Generate a color based on address
    const hash = address.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  if (!ledgerId) {
    return (
      <div className="p-4 text-gray-300">
        Select an Echo from the marketplace or mint one to view.
      </div>
    );
  }

  // Get base video URI for remix
  const baseVideoUri = echoes.find((e) => e.echoType === 'Video' || e.videoUri)?.videoUri || '';

  // Show remix interface if enabled
  if (showRemix && baseVideoUri) {
    return (
      <Suspense fallback={<div className="p-4 text-center text-gray-400">Loading remix editor...</div>}>
        <EchoRemix
          parentLedgerId={ledgerId}
          parentVideoUri={baseVideoUri}
          onRemixComplete={(newLedgerId) => {
            setShowRemix(false);
            addNotification({
              type: 'success',
              title: '🎉 Remix Created!',
              message: 'Your remix has been created. View it in the marketplace.',
              duration: 5000,
            });
            // Optionally navigate to the new remix
            localStorage.setItem('currentEchoLedger', newLedgerId);
            window.dispatchEvent(new CustomEvent('change-tab', { detail: 'echo-viewer' }));
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-2xl font-bold text-white">🎬 Eternal Echo</div>
          <div className="text-gray-400 text-sm">Ledger: {ledgerId.slice(0, 8)}…</div>
        </div>
        <div className="flex items-center gap-2">
          {baseVideoUri && (
            <button
              onClick={() => setShowRemix(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all text-white font-semibold text-sm"
            >
              🎨 Remix
            </button>
          )}
        <WalletMultiButton className="btn-glass" />
        </div>
      </div>

      <div className="glass p-3 rounded mb-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-white text-xl font-semibold">{echoes.length}</div>
          <div className="text-gray-400 text-sm">Total Echoes</div>
        </div>
        <div>
          <div className="text-white text-xl font-semibold">{verifiedCount}</div>
          <div className="text-gray-400 text-sm">Verified</div>
        </div>
        <div>
          <div className="text-white text-xl font-semibold">{avgScore}%</div>
          <div className="text-gray-400 text-sm">Avg Truth Score</div>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-300 text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div>Loading Echo layers…</div>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {echoes.length === 0 ? (
            <div className="text-center py-12 text-gray-300">
              <div className="text-6xl mb-4">🌌</div>
              <div className="text-lg font-semibold mb-2">No Echo Layers Yet</div>
              <div className="text-sm">Be the first to add a layer to this Eternal Echo!</div>
            </div>
          ) : (
            echoes.map((e, index) => {
              const isLeft = index % 2 === 0;
              const isLowTrust = e.verificationScore < 50;

              return (
                <div
                  key={e.id}
                  className={`
                    glass p-4 rounded-xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-xl
                    ${isLeft ? 'animate-slide-in-left' : 'animate-slide-in-right'}
                    ${e.grokVerified ? 'border-2 border-green-400/50 bg-green-500/5' : ''}
                    ${isLowTrust ? 'border-2 border-red-400/30 bg-red-500/5' : ''}
                    border border-white/10
                  `}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-start gap-3">
                    {/* Contributor Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: getContributorColor(e.contributor) }}
                    >
                      {getContributorInitial(e.contributor)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div className="flex-1">
                          <div className="text-xs text-gray-400 mb-1">
                            {new Date(e.timestamp).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 font-mono truncate">
                            {e.contributor.slice(0, 8)}...{e.contributor.slice(-6)}
                          </div>
                        </div>

                        {/* Verification Badge */}
                        <div className="flex-shrink-0" data-tour="echo-verification">
                          <TruthBadge
                            score={e.verificationScore}
                            verified={e.grokVerified}
                            showPulse={e.grokVerified}
                            size="sm"
                          />
                        </div>
                      </div>

                      <div className={`text-white mb-2 ${isLowTrust ? 'text-red-200' : ''}`}>
                        {e.echoData}
                      </div>

                      {/* Video display for Video echoes */}
                      {e.echoType === 'Video' && e.videoUri && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          <video
                            src={e.videoUri}
                            controls
                            className="w-full rounded-lg"
                            loading="lazy"
                            preload="metadata"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <span className="glass px-2 py-1 rounded text-gray-300">{e.echoType}</span>
                        {isLowTrust && (
                          <span className="text-red-300 text-xs font-semibold">
                            ⚠️ Low Trust Content
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Prominent "Echo It" section */}
      <div className="glass p-4 rounded-xl mb-4 border-2 border-purple-400/50 bg-gradient-to-r from-purple-500/10 to-cyan-500/10" data-tour="echo-it-button">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white font-bold text-lg mb-1">🎯 Echo This NFT</div>
            <div className="text-gray-400 text-sm">Add your layer to this collaborative NFT</div>
          </div>
          <WalletMultiButton className="btn-glass" />
        </div>

        <div className="space-y-3">
          <select
            className="w-full glass px-3 py-2 rounded text-white bg-transparent"
            value={echoType}
            onChange={(e) => {
              setEchoType(e.target.value as any);
              if (e.target.value !== 'Video') {
                setNewVideoUri('');
              }
            }}
          >
            <option value="Text">📝 Text Echo</option>
            <option value="Audio">🎵 Audio Echo</option>
            <option value="Annotation">📌 Annotation</option>
            <option value="Video">📹 Video Echo</option>
          </select>

          {echoType === 'Video' ? (
            <div className="space-y-2">
              <input
                className="w-full bg-transparent outline-none text-white placeholder-gray-400 glass px-3 py-2 rounded"
                placeholder="Video URL (Pinata IPFS link)"
                value={newVideoUri}
                onChange={(e) => setNewVideoUri(e.target.value)}
              />
              <input
                className="w-full bg-transparent outline-none text-white placeholder-gray-400 glass px-3 py-2 rounded"
                placeholder="Video description or caption"
                value={newEcho}
                onChange={(e) => setNewEcho(e.target.value)}
              />
            </div>
          ) : (
          <input
              className="w-full bg-transparent outline-none text-white placeholder-gray-400 glass px-3 py-2 rounded"
            placeholder="Add your layer…"
            value={newEcho}
            onChange={(e) => setNewEcho(e.target.value)}
          />
          )}

          <button
            className="w-full btn-primary py-3 font-bold text-lg"
            onClick={addEcho}
            disabled={!publicKey || !newEcho.trim() || (echoType === 'Video' && !newVideoUri)}
          >
            {echoType === 'Video' ? '📹 Add Video Echo' : '✨ Add Echo'}
          </button>
        </div>
      </div>

      {/* Legacy add echo section (kept for compatibility) */}
      <div className="glass p-3 rounded">
        <div className="mb-2 text-white font-semibold text-sm">Quick Add</div>
        {!publicKey && <div className="text-gray-400 text-sm">Connect wallet to add echo.</div>}
      </div>
    </div>
  );
}
