/**
 * Hook to fetch real-time minting cost and comparisons
 */

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

interface CostEstimate {
  solCost: number;
  usdCost: number;
  network: string;
  message: string;
}

interface CostComparison {
  nftSol: {
    cost: number;
    time: string;
    network: string;
  };
  openSea: {
    cost: number;
    time: string;
    network: string;
  };
  pumpFun: {
    cost: number;
    time: string;
    network: string;
  };
  savings: {
    vsOpenSea: number;
    vsPumpFun: string;
  };
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
        
        // Fetch both estimate and comparison
        const [estimateRes, comparisonRes] = await Promise.all([
          fetch(`${API_BASE}/api/mint/estimate`),
          fetch(`${API_BASE}/api/mint/compare`),
        ]);

        if (estimateRes.ok) {
          const estimateData = await estimateRes.json();
          setEstimate(estimateData.data);
        }

        if (comparisonRes.ok) {
          const comparisonData = await comparisonRes.json();
          setComparison(comparisonData.data);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch costs');
        // Set fallback values
        setEstimate({
          solCost: 0.002,
          usdCost: 0.20,
          network: 'Solana',
          message: 'Only $0.20 to mint!',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCosts();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchCosts, 60000);
    return () => clearInterval(interval);
  }, []);

  return { estimate, comparison, loading, error };
}

