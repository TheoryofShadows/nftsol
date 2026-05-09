/**
 * Hook to fetch real-time minting cost and comparisons.
 * Uses CoinGecko public API directly — no backend needed.
 */

import { useState, useEffect } from 'react';

interface CostEstimate {
  solCost: number;
  usdCost: number;
  network: string;
  message: string;
}

interface CostComparison {
  nftSol: { cost: number; time: string; network: string };
  openSea: { cost: number; time: string; network: string };
  pumpFun: { cost: number; time: string; network: string };
  savings: { vsOpenSea: number; vsPumpFun: string };
}

const MINT_SOL_COST = 0.00204; // ~0.00144 SOL rent + ~0.0006 tx fees

async function fetchSolPrice(): Promise<number> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return 150;
    const json = await res.json() as { solana?: { usd?: number } };
    return json.solana?.usd ?? 150;
  } catch {
    return 150;
  }
}

export function useMintCost() {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [comparison, setComparison] = useState<CostComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        setLoading(true);
        const solPrice = await fetchSolPrice();
        const usdCost = parseFloat((MINT_SOL_COST * solPrice).toFixed(2));

        setEstimate({
          solCost: MINT_SOL_COST,
          usdCost,
          network: 'Solana',
          message: `Only $${usdCost.toFixed(2)} to mint!`,
        });

        const openSeaUsd = 50;
        setComparison({
          nftSol: { cost: usdCost, time: '< 1 second', network: 'Solana' },
          openSea: { cost: openSeaUsd, time: '~15 minutes', network: 'Ethereum' },
          pumpFun: { cost: 0.02 * solPrice, time: '< 1 second', network: 'Solana' },
          savings: {
            vsOpenSea: Math.round(((openSeaUsd - usdCost) / openSeaUsd) * 100),
            vsPumpFun: `${Math.round((0.02 * solPrice) / usdCost)}x cheaper`,
          },
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch costs');
        setEstimate({ solCost: MINT_SOL_COST, usdCost: 0.30, network: 'Solana', message: 'Only $0.30 to mint!' });
      } finally {
        setLoading(false);
      }
    };

    fetchCosts();
    const interval = setInterval(fetchCosts, 60000);
    return () => clearInterval(interval);
  }, []);

  return { estimate, comparison, loading, error };
}
