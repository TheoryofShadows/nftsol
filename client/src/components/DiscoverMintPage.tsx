/**
 * DiscoverMintPage — unified Search → Verify → Mint flow.
 * Replaces the disconnected Archive Search, Echo Mint, and Unified Dashboard tabs.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import confetti from 'canvas-confetti';
import { archiveService, SearchResult } from '../services/archiveService';
import { useNotification } from './NotificationSystem';

type Step = 'search' | 'verify' | 'mint' | 'done';

interface VerifyResult {
  verified: boolean;
  truthScore: number;
  summary: string;
  concerns: string[];
  confidence?: number;
  /** 'grok' = real AI verifier; 'heuristic' = local fallback when AI is unavailable. */
  method?: 'grok' | 'heuristic';
}

interface MintResult {
  mintAddress?: string;
  assetId?: string;
  signature?: string;
  costUSD?: number;
  name: string;
  imageUrl?: string;
}

const MEDIA_TYPES = [
  { value: '', label: 'All types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'date', label: 'Newest First' },
];

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#14f195' : score >= 60 ? '#c9a84c' : '#ef4444';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

export default function DiscoverMintPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { addNotification } = useNotification();

  // Step state
  const [step, setStep] = useState<Step>('search');

  // Search state
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

  // Verify state
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState('');

  // Mint state
  const [minting, setMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);

  const sortedResults = useMemo(() => {
    if (sortBy === 'downloads') {
      return [...results].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    }
    if (sortBy === 'date') {
      return [...results].sort((a, b) => (b.year || 0) - (a.year || 0));
    }
    return results;
  }, [results, sortBy]);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setResults([]);
    setSelectedItem(null);
    setVerifyResult(null);
    setStep('search');
    try {
      // Broader web search across the open web (Openverse) + Internet Archive
      // video, all license-safe for minting.
      const res = await archiveService.webSearch(query, {
        mediaType: (mediaType || 'all') as 'all' | 'image' | 'audio' | 'video',
        limit: 24,
      });
      setResults(res.results);
      setTotalResults(res.totalResults);
    } catch {
      setSearchError('Search failed — check your connection and try again.');
    } finally {
      setSearching(false);
    }
  }, [query, mediaType]);

  const handleSelectItem = (item: SearchResult) => {
    setSelectedItem(item);
    setVerifyResult(null);
    setVerifyError('');
    setStep('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVerify = async () => {
    if (!selectedItem) return;
    setVerifying(true);
    setVerifyError('');
    try {
      // Web results (Openverse/etc.) verify by passing the full item; Internet
      // Archive items can still verify by identifier. Either way Grok/heuristic
      // returns the same shape.
      const raw = selectedItem.source && selectedItem.source !== 'internet-archive'
        ? await archiveService.verifyWebContent(selectedItem)
        : await archiveService.verifyWithGrok(selectedItem.identifier);
      // Normalise across both response shapes the backend can return
      const v = (raw as any).verification ?? raw;
      setVerifyResult({
        verified: !!(v?.verified ?? (raw as any).readyForMinting),
        truthScore: typeof v?.truthScore === 'number' ? v.truthScore
          : typeof v?.confidence === 'number' ? Math.round(v.confidence * 100)
          : 75,
        summary: v?.summary ?? (raw as any).summary ?? '',
        concerns: Array.isArray(v?.concerns) ? v.concerns : [],
        confidence: v?.confidence,
        method: v?.method === 'grok' ? 'grok' : v?.method === 'heuristic' ? 'heuristic' : undefined,
      });
      setStep('mint');
    } catch {
      setVerifyError('Verification is unavailable right now. You can still mint — the item just won\'t carry a truth score.');
      // Allow minting without verification. Use null (not a fake 0%) so the UI
      // shows "No verification score" instead of a misleading zero.
      setVerifyResult(null);
      setStep('mint');
    } finally {
      setVerifying(false);
    }
  };

  const handleMint = async () => {
    if (!selectedItem || !publicKey) return;
    setMinting(true);
    try {
      // Build metadata — include Grok truth score as an attribute
      const sourceLabel = selectedItem.source === 'openverse'
        ? 'Openverse (open web)'
        : selectedItem.source === 'internet-archive' || !selectedItem.source
        ? 'Internet Archive'
        : selectedItem.source;
      const attributes: { trait_type: string; value: string | number }[] = [
        { trait_type: 'Source', value: sourceLabel },
        { trait_type: 'Source ID', value: selectedItem.identifier },
        { trait_type: 'Media Type', value: selectedItem.mediaType },
        { trait_type: 'License', value: selectedItem.licenseType },
      ];
      if (selectedItem.year) attributes.push({ trait_type: 'Year', value: selectedItem.year });
      if (selectedItem.creator) attributes.push({ trait_type: 'Creator', value: selectedItem.creator });
      if (verifyResult) {
        const scoreLabel = verifyResult.method === 'heuristic' ? 'Estimated Score' : 'Grok Truth Score';
        attributes.push({ trait_type: scoreLabel, value: verifyResult.truthScore });
        attributes.push({
          trait_type: 'Grok Verified',
          value: verifyResult.method === 'heuristic' ? 'Heuristic' : verifyResult.verified ? 'Yes' : 'No',
        });
      }

      const res = await fetch(
        `${(import.meta.env.VITE_API_BASE as string) || 'https://nftsol.onrender.com'}/api/mint/ultra-cheap`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toAddress: publicKey.toBase58(),
            name: selectedItem.title.slice(0, 32),
            symbol: 'ECHO',
            description: [
              selectedItem.description || selectedItem.title,
              verifyResult?.summary ? `Grok: ${verifyResult.summary}` : '',
            ].filter(Boolean).join(' | ').slice(0, 400),
            imageUrl: selectedItem.thumbnailUrl || `https://archive.org/services/img/${selectedItem.identifier}`,
            externalUrl: selectedItem.archiveUrl,
            attributes,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Mint failed');

      setMintResult({
        mintAddress: data.data?.mintAddress,
        assetId: data.data?.assetId,
        signature: data.data?.signature,
        costUSD: data.data?.costUSD,
        name: selectedItem.title,
        imageUrl: selectedItem.thumbnailUrl,
      });

      setStep('done');

      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#c9a84c', '#14f195', '#9945ff', '#ffffff'],
      });

      // Award CLOUT if verified
      if (verifyResult?.verified && verifyResult.truthScore >= 70) {
        try {
          await fetch(
            `${(import.meta.env.VITE_API_BASE as string) || 'https://nftsol.onrender.com'}/api/clout/reward`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientAddress: publicKey.toBase58(),
                amount: 10,
                multiplier: verifyResult.truthScore >= 90 ? 2.0 : 1.5,
              }),
            }
          );
        } catch { /* CLOUT reward is best-effort */ }
      }

      addNotification({
        type: 'success',
        title: 'NFT Minted!',
        message: `"${selectedItem.title.slice(0, 40)}" minted on Solana${data.data?.costUSD ? ` for $${data.data.costUSD.toFixed(4)}` : ''}.`,
        duration: 7000,
      });
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'Mint Failed',
        message: err.message || 'Something went wrong. Please try again.',
        duration: 5000,
      });
    } finally {
      setMinting(false);
    }
  };

  const handleReset = () => {
    setStep('search');
    setSelectedItem(null);
    setVerifyResult(null);
    setMintResult(null);
    setResults([]);
    setQuery('');
  };

  // ── Breadcrumb ──────────────────────────────────────────────────────────────
  const steps: { key: Step; label: string }[] = [
    { key: 'search', label: 'Search' },
    { key: 'verify', label: 'Verify' },
    { key: 'mint', label: 'Mint' },
  ];
  const stepIndex = step === 'done' ? 2 : steps.findIndex(s => s.key === step);

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-0">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-white font-display mb-3">
          Search. Verify. <span className="text-[#c9a84c]">Mint.</span>
        </h1>
        <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
          Search the open web — hundreds of millions of openly-licensed images, audio &amp; video
          (Openverse + Internet Archive) — verify authenticity with Grok AI, then mint it as a
          compressed Solana NFT for fractions of a cent.
        </p>
      </div>

      {/* ── Progress breadcrumb ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <button
              onClick={() => {
                if (i < stepIndex || (i === 0)) {
                  if (s.key === 'search') { setStep('search'); setSelectedItem(null); setVerifyResult(null); }
                  else if (s.key === 'verify' && selectedItem) { setStep('verify'); setVerifyResult(null); }
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i <= stepIndex
                  ? 'bg-[#c9a84c] text-black'
                  : 'bg-[#1e1e1e] text-zinc-500'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                i < stepIndex ? 'bg-black/20' : i === stepIndex ? 'bg-black/20' : 'bg-[#2a2a2a]'
              }`}>
                {i < stepIndex ? '✓' : i + 1}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 ${i < stepIndex ? 'bg-[#c9a84c]' : 'bg-[#2a2a2a]'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 1 — SEARCH
      ══════════════════════════════════════════════════════════════════════ */}
      {(step === 'search') && (
        <div>
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search anything — NASA footage, jazz recordings, silent films…"
                  className="w-full pl-12 pr-4 py-4 bg-[#111111] border border-[#2a2a2a] focus:border-[#c9a84c]/60 rounded-xl text-white placeholder-zinc-600 outline-none text-base transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!query.trim() || searching}
                className="px-6 py-4 bg-[#c9a84c] hover:bg-[#b8973f] disabled:opacity-40 text-black font-bold rounded-xl transition-colors flex-shrink-0"
              >
                {searching ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : 'Search'}
              </button>
            </div>

            {/* Filters row */}
            <div className="flex gap-3 mt-3 flex-wrap">
              <select
                value={mediaType}
                onChange={e => setMediaType(e.target.value)}
                className="px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-zinc-300 text-sm outline-none"
              >
                {MEDIA_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-zinc-300 text-sm outline-none"
              >
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {results.length > 0 && (
                <span className="text-zinc-500 text-sm self-center ml-auto">
                  {totalResults.toLocaleString()} results
                </span>
              )}
            </div>
          </form>

          {/* Trending chips */}
          {results.length === 0 && !searching && (
            <div className="mb-6">
              <p className="text-zinc-600 text-xs uppercase tracking-wider mb-3">Trending</p>
              <div className="flex flex-wrap gap-2">
                {['NASA space footage', 'silent films 1920s', 'jazz recordings', 'historical speeches', 'nature documentaries', 'vintage cartoons', 'public domain books', 'world music'].map(t => (
                  <button
                    key={t}
                    onClick={() => { setQuery(t); setTimeout(() => handleSearch(), 50); }}
                    className="px-3 py-1.5 bg-[#111111] border border-[#2a2a2a] hover:border-[#c9a84c]/40 text-zinc-400 hover:text-white text-sm rounded-lg transition-all"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
              {searchError}
            </div>
          )}

          {/* Results grid */}
          {sortedResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {sortedResults.map(item => (
                <button
                  key={item.identifier}
                  onClick={() => handleSelectItem(item)}
                  className="group text-left bg-[#111111] border border-[#1e1e1e] hover:border-[#c9a84c]/40 active:border-[#c9a84c]/60 rounded-xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video relative overflow-hidden bg-[#0a0a0a]">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 bg-black/70 rounded text-[10px] sm:text-xs text-zinc-300 capitalize">
                        {item.mediaType}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 bg-black/70 rounded text-[10px] sm:text-xs text-[#c9a84c] capitalize">
                        {item.source === 'openverse' ? 'web' : 'archive'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3">
                    <h3 className="text-white font-semibold text-xs sm:text-sm leading-tight line-clamp-2 mb-1 group-hover:text-[#c9a84c] transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs text-zinc-500">
                      <span className="truncate">{item.creator && item.creator !== 'Unknown' ? item.creator.slice(0, 18) : item.year || ''}</span>
                      <span className="shrink-0 uppercase tracking-wide">{item.licenseType.replace('cc-', 'CC ').replace('public-domain', 'PD')}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 2 — VERIFY
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'verify' && selectedItem && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            {/* Item preview */}
            <div className="relative">
              <img
                src={selectedItem.thumbnailUrl}
                alt={selectedItem.title}
                className="w-full h-56 object-cover"
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs text-[#c9a84c] uppercase tracking-wider font-medium capitalize">{selectedItem.mediaType}</span>
                  <h2 className="text-xl font-bold text-white mt-1 leading-tight">{selectedItem.title}</h2>
                  {(selectedItem.creator || selectedItem.year) && (
                    <p className="text-zinc-500 text-sm mt-1">
                      {[selectedItem.creator, selectedItem.year].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <a
                  href={selectedItem.archiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex-shrink-0 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-zinc-400 hover:text-white text-xs rounded-lg transition-colors"
                >
                  Archive.org ↗
                </a>
              </div>

              {selectedItem.description && (
                <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3">
                  {selectedItem.description}
                </p>
              )}

              {/* Metadata pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-2 py-1 bg-[#1e1e1e] rounded text-xs text-zinc-400">
                  {selectedItem.downloads.toLocaleString()} downloads
                </span>
                <span className="px-2 py-1 bg-[#1e1e1e] rounded text-xs text-zinc-400 capitalize">
                  {selectedItem.licenseType}
                </span>
                {selectedItem.language && (
                  <span className="px-2 py-1 bg-[#1e1e1e] rounded text-xs text-zinc-400 uppercase">
                    {selectedItem.language}
                  </span>
                )}
                <span className="px-2 py-1 bg-[#1e1e1e] rounded text-xs text-zinc-400 font-mono">
                  {selectedItem.identifier}
                </span>
              </div>

              {/* Verify CTA */}
              {!verifyResult && (
                <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-xl p-5 text-center">
                  <div className="text-3xl mb-2">🤖</div>
                  <h3 className="text-white font-semibold mb-1">Verify with Grok AI</h3>
                  <p className="text-zinc-500 text-sm mb-4">
                    Grok analyses the content&apos;s authenticity, source reliability, and factual accuracy.
                    The truth score gets embedded in your NFT&apos;s metadata on-chain.
                  </p>
                  {verifyError && (
                    <p className="text-yellow-400 text-xs mb-3">{verifyError}</p>
                  )}
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                  >
                    {verifying ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Grok is analysing…
                      </span>
                    ) : '🔍 Run Grok Verification'}
                  </button>
                </div>
              )}

              {/* Verify result */}
              {verifyResult && (
                <div className={`rounded-xl p-5 border mb-4 ${
                  verifyResult.verified
                    ? 'bg-green-500/10 border-green-500/30'
                    : verifyResult.truthScore >= 50
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-4 mb-3">
                    <ScoreRing score={verifyResult.truthScore} />
                    <div>
                      <div className={`text-lg font-bold ${
                        verifyResult.verified ? 'text-green-400'
                        : verifyResult.truthScore >= 50 ? 'text-yellow-400'
                        : 'text-red-400'
                      }`}>
                        {verifyResult.method === 'heuristic' ? '◷ Heuristic estimate (AI unavailable)'
                          : verifyResult.verified ? '✓ Verified by Grok'
                          : verifyResult.truthScore >= 50 ? '⚠ Partially verified'
                          : '✗ Low confidence'}
                      </div>
                      <div className="text-zinc-400 text-sm">
                        {verifyResult.method === 'heuristic' ? 'Estimated score' : 'Truth score'}: <strong className="text-white">{verifyResult.truthScore}%</strong>
                        {verifyResult.verified && verifyResult.truthScore >= 70 && (
                          <span className="ml-2 text-[#c9a84c] font-medium">+CLOUT reward</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {verifyResult.summary && (
                    <p className="text-sm text-zinc-300 mb-2">{verifyResult.summary}</p>
                  )}
                  {verifyResult.concerns.length > 0 && (
                    <ul className="text-xs text-zinc-500 space-y-1">
                      {verifyResult.concerns.map((c, i) => <li key={i}>• {c}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {/* Continue to mint */}
              {verifyResult && (
                <button
                  onClick={() => setStep('mint')}
                  className="w-full py-3.5 bg-[#c9a84c] hover:bg-[#b8973f] text-black font-bold rounded-xl transition-colors text-base"
                >
                  Continue to Mint →
                </button>
              )}

              {/* Back */}
              <button
                onClick={() => { setStep('search'); setSelectedItem(null); }}
                className="w-full mt-3 py-2.5 text-zinc-500 hover:text-white text-sm transition-colors"
              >
                ← Back to results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 3 — MINT
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'mint' && selectedItem && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6">
            {/* Preview */}
            <div className="flex gap-4 mb-6">
              <img
                src={selectedItem.thumbnailUrl}
                alt={selectedItem.title}
                className="w-24 h-24 object-cover rounded-xl flex-shrink-0 bg-[#0a0a0a]"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-1">
                  {selectedItem.title}
                </h2>
                {verifyResult && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      verifyResult.verified ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                    <span className="text-sm text-zinc-400">
                      {verifyResult.method === 'heuristic' ? 'Estimated score' : 'Grok score'}: <strong className={verifyResult.verified ? 'text-green-400' : 'text-yellow-400'}>
                        {verifyResult.truthScore}%
                      </strong>
                    </span>
                  </div>
                )}
                {!verifyResult && (
                  <span className="text-xs text-zinc-600">No verification score</span>
                )}
              </div>
            </div>

            {/* What gets minted */}
            <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-xl p-4 mb-6">
              <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-medium mb-3">What&apos;s included in the NFT</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Title</span>
                  <span className="text-white font-medium truncate ml-4">{selectedItem.title.slice(0, 32)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Source</span>
                  <span className="text-white">{selectedItem.source === 'openverse' ? 'Openverse (open web)' : 'Internet Archive'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">License</span>
                  <span className="text-white uppercase text-xs">{selectedItem.licenseType.replace('cc-', 'CC ').replace('public-domain', 'Public Domain')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Source ID</span>
                  <span className="text-zinc-300 font-mono text-xs truncate ml-4 max-w-[60%]">{selectedItem.identifier}</span>
                </div>
                {verifyResult && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{verifyResult.method === 'heuristic' ? 'Estimated Score' : 'Grok Truth Score'}</span>
                    <span className={`font-bold ${verifyResult.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                      {verifyResult.truthScore}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Standard</span>
                  <span className="text-white">Compressed NFT (cNFT)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Blockchain</span>
                  <span className="text-white">Solana Mainnet</span>
                </div>
              </div>
            </div>

            {/* Cost */}
            <div className="flex items-center justify-between bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl px-4 py-3 mb-6">
              <div>
                <div className="text-xs text-[#c9a84c] uppercase tracking-wider font-medium">Mint Cost</div>
                <div className="text-2xl font-bold text-white">~$0.0001</div>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <div>vs $50–100 on ETH</div>
                <div>vs $0.02 on pump.fun</div>
              </div>
            </div>

            {/* CLOUT bonus */}
            {verifyResult?.verified && verifyResult.truthScore >= 70 && (
              <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3 mb-6">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="text-purple-300 font-semibold text-sm">CLOUT Reward Unlocked</div>
                  <div className="text-zinc-500 text-xs">
                    {verifyResult.truthScore >= 90 ? '2x bonus' : '1.5x bonus'} for high-confidence verified content
                  </div>
                </div>
              </div>
            )}

            {/* Wallet / Mint button */}
            {!connected ? (
              <button
                onClick={() => setVisible(true)}
                className="w-full py-4 bg-[#c9a84c] hover:bg-[#b8973f] text-black font-bold rounded-xl text-base transition-colors"
              >
                Connect Wallet to Mint
              </button>
            ) : (
              <button
                onClick={handleMint}
                disabled={minting}
                className="w-full py-4 bg-[#c9a84c] hover:bg-[#b8973f] disabled:opacity-50 text-black font-bold rounded-xl text-base transition-colors"
              >
                {minting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Minting on Solana…
                  </span>
                ) : `Mint NFT — ~$0.0001`}
              </button>
            )}

            <button
              onClick={() => setStep('verify')}
              className="w-full mt-3 py-2.5 text-zinc-500 hover:text-white text-sm transition-colors"
            >
              ← Back to verification
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 4 — DONE
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'done' && mintResult && (
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-[#111111] border border-[#c9a84c]/30 rounded-2xl p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">Minted!</h2>
            <p className="text-zinc-400 mb-6">
              Your NFT is live on Solana mainnet{mintResult.costUSD ? ` for $${mintResult.costUSD.toFixed(4)}` : ''}.
            </p>

            {mintResult.imageUrl && (
              <img
                src={mintResult.imageUrl}
                alt={mintResult.name}
                className="w-40 h-40 object-cover rounded-xl mx-auto mb-6 border border-[#c9a84c]/20"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}

            <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-xl p-4 mb-6 text-left space-y-2">
              {mintResult.mintAddress && (
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">Mint Address</div>
                  <div className="font-mono text-xs text-zinc-300 break-all">{mintResult.mintAddress}</div>
                </div>
              )}
              {mintResult.signature && (
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">Transaction</div>
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
              {verifyResult && (
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">{verifyResult.method === 'heuristic' ? 'Estimated Score (on-chain)' : 'Grok Truth Score (on-chain)'}</div>
                  <div className={`text-sm font-bold ${verifyResult.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                    {verifyResult.truthScore}%
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'my-nfts' }))}
                className="flex-1 py-3 bg-[#c9a84c] hover:bg-[#b8973f] text-black font-bold rounded-xl transition-colors"
              >
                View My NFTs
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white font-semibold rounded-xl transition-colors"
              >
                Mint Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
