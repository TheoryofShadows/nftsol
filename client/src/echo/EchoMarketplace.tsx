/* eslint-disable react/forbid-dom-props */
// Microsoft Edge Tools: All inline styles have been moved to external CSS file (EchoMarketplace.css)
import React, { useEffect, useMemo, useState } from 'react';
import { lazy, Suspense } from 'react';
import TruthBadge from '../components/TruthBadge';
import '../styles/EchoMarketplace.css';

const EchoTrending = lazy(() => import('./EchoTrending'));

type EchoNFT = {
  id: string;
  mintAddress: string;
  name: string;
  description?: string;
  image: string;
  price?: string;
  owner: string;
  status: string;
  echoCount?: number;
  avgTruthScore?: number;
  clout?: number;
  verified?: boolean;
};

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export default function EchoMarketplace() {
  const [filter, setFilter] = useState<'all' | 'listed' | 'mine'>('all');
  const [items, setItems] = useState<EchoNFT[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ collection: 'eternal-echoes' });
        if (filter === 'listed') params.set('status', 'listed');
        const res = await fetch(`${API_BASE}/api/nfts?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch Echo NFTs');
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data.nfts) ? data.nfts : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const visible = useMemo(() => items, [items]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Marketplace Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">🎬 Echo NFT Marketplace</h2>
            <div className="flex gap-2">
              <button
                className={`glass px-3 py-1 rounded transition-all duration-300 ${filter === 'all' ? 'bg-white/20 shadow-lg' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`glass px-3 py-1 rounded transition-all duration-300 ${filter === 'listed' ? 'bg-white/20 shadow-lg' : ''}`}
                onClick={() => setFilter('listed')}
              >
                For Sale
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-300 text-center py-12">Loading Echoes…</div>
          ) : visible.length === 0 ? (
            <div className="text-gray-300 text-center py-12">No Echo NFTs found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((e, index) => (
                <div
                  key={e.id}
                  className="glass p-4 rounded-xl transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-xl hover:border-purple-400/50 border border-white/10 echo-marketplace-card"
                  data-animation-delay={Math.round((index * 100) / 50) * 50}
                >
                  <div className="relative">
                    <img
                      src={e.image}
                      alt={e.name}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    {/* Clout Badge */}
                    {e.clout !== undefined && e.clout > 0 && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 text-white px-2 py-1 rounded-full text-xs font-bold">
                        ⭐ CLOUT {e.clout}
                      </div>
                    )}
                    {/* Truth Score Badge */}
                    {typeof e.avgTruthScore === 'number' && (
                      <div className="absolute top-3 left-3">
                        <TruthBadge score={e.avgTruthScore} verified={e.verified} size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-white font-semibold text-lg">{e.name}</div>
                  <div className="text-gray-300 text-sm line-clamp-2 mb-3">{e.description}</div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-300 mb-3">
                    {e.echoCount ? (
                      <span className="glass px-2 py-1 rounded">📊 {e.echoCount} echoes</span>
                    ) : (
                      <span />
                    )}
                    {e.price && <span className="font-bold text-cyan-300">{e.price} SOL</span>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="btn-glass flex-1"
                      onClick={() => {
                        localStorage.setItem('currentEchoLedger', e.mintAddress);
                        window.dispatchEvent(
                          new CustomEvent('change-tab', { detail: 'echo-viewer' })
                        );
                      }}
                    >
                      👁️ View
                    </button>
                    {e.price && e.status === 'listed' && (
                      <button className="btn-primary flex-1">🛒 Buy</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trending Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0">
          <Suspense
            fallback={
              <div className="glass p-6 rounded-xl">
                <div className="text-gray-300">Loading trending...</div>
              </div>
            }
          >
            <EchoTrending />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
