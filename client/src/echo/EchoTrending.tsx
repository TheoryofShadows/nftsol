import React, { useEffect, useState } from 'react';
import TruthBadge from '../components/TruthBadge';

type TrendingLedger = {
  ledgerId: string;
  title?: string;
  echoCount?: number;
  contributorCount?: number;
  avgTruthScore?: number;
  verified?: boolean;
  lastEcho?: {
    timestamp: string;
    contributor: string;
  };
};

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export default function EchoTrending() {
  const [trending, setTrending] = useState<TrendingLedger[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/echo/trending?limit=10`);
        if (!res.ok) throw new Error('Failed to fetch trending');
        const data = await res.json();

        if (!cancelled) {
          // Transform echoes into ledger summaries
          const ledgerMap = new Map<string, TrendingLedger>();

          if (Array.isArray(data.echoes)) {
            // Track unique contributors per ledger
            const contributorSets = new Map<string, Set<string>>();

            data.echoes.forEach((echo: any) => {
              const ledgerId = echo.ledgerId || echo.id?.split(':')[0] || 'unknown';

              if (!ledgerMap.has(ledgerId)) {
                ledgerMap.set(ledgerId, {
                  ledgerId,
                  echoCount: 0,
                  contributorCount: 0,
                  avgTruthScore: 0,
                  verified: false,
                });
                contributorSets.set(ledgerId, new Set());
              }

              const ledger = ledgerMap.get(ledgerId)!;
              ledger.echoCount = (ledger.echoCount || 0) + 1;

              // Track unique contributors
              if (echo.contributor) {
                const contributors = contributorSets.get(ledgerId)!;
                if (!contributors.has(echo.contributor)) {
                  contributors.add(echo.contributor);
                  ledger.contributorCount = contributors.size;
                }
              }

              if (echo.verificationScore) {
                const currentAvg = ledger.avgTruthScore || 0;
                ledger.avgTruthScore = Math.round(
                  (currentAvg * (ledger.echoCount - 1) + echo.verificationScore) / ledger.echoCount
                );
              }

              if (echo.grokVerified) {
                ledger.verified = true;
              }

              if (
                !ledger.lastEcho ||
                (echo.timestamp && new Date(echo.timestamp) > new Date(ledger.lastEcho.timestamp))
              ) {
                ledger.lastEcho = {
                  timestamp: echo.timestamp || new Date().toISOString(),
                  contributor: echo.contributor || 'Unknown',
                };
              }
            });
          }

          // Sort by echo count and recency, then take top 10
          const sorted = Array.from(ledgerMap.values())
            .sort((a, b) => {
              const aScore = (a.echoCount || 0) * 10 + (a.avgTruthScore || 0);
              const bScore = (b.echoCount || 0) * 10 + (b.avgTruthScore || 0);
              return bScore - aScore;
            })
            .slice(0, 10);

          setTrending(sorted);
        }
      } catch {
        if (!cancelled) setTrending([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTrending();
    const interval = setInterval(fetchTrending, 30000); // Refresh every 30s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleViewLedger = (ledgerId: string) => {
    localStorage.setItem('currentEchoLedger', ledgerId);
    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'echo-viewer' }));
  };

  if (loading && trending.length === 0) {
    return (
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4">🔥 Trending Echoes</h3>
        <div className="text-gray-300 text-center py-8">Loading trending ledgers...</div>
      </div>
    );
  }

  if (trending.length === 0) {
    return (
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4">🔥 Trending Echoes</h3>
        <div className="text-gray-300 text-center py-8">
          No trending echoes yet. Be the first to mint!
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>🔥</span>
        <span>Trending Echoes</span>
      </h3>
      <div className="space-y-3">
        {trending.map((ledger, index) => (
          <div
            key={ledger.ledgerId}
            className="glass p-4 rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-purple-400/50 border border-white/10"
            data-animation-delay={Math.round((index * 100) / 50) * 50}
            onClick={() => handleViewLedger(ledger.ledgerId)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold truncate mb-1">
                  {ledger.title || `Ledger ${ledger.ledgerId.slice(0, 8)}...`}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <span>📊 {ledger.echoCount || 0} echoes</span>
                  {ledger.contributorCount ? (
                    <span>👥 {ledger.contributorCount} contributors</span>
                  ) : null}
                </div>
              </div>
              {ledger.avgTruthScore !== undefined && (
                <div className="flex-shrink-0 ml-3">
                  <TruthBadge score={ledger.avgTruthScore} verified={ledger.verified} size="sm" />
                </div>
              )}
            </div>
            {ledger.lastEcho && (
              <div className="text-xs text-gray-400 mt-2">
                Last echo: {new Date(ledger.lastEcho.timestamp).toLocaleDateString()} by{' '}
                {ledger.lastEcho.contributor.slice(0, 8)}...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
