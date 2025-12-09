/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore - Legacy code, type checking disabled
/**
 * useNfts Hook
 * React hook for NFT data fetching using the service layer
 */

import { useState, useEffect, useCallback } from 'react';
// import { NFT } from '@shared/types';
// import { nftService } from '../services/nftService';
// import { logger } from '@shared/utils/logger';

interface UseNftsOptions {
  autoFetch?: boolean;
  filters?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  };
}

interface UseNftsReturn {
  nfts: NFT[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNfts(options: UseNftsOptions = {}): UseNftsReturn {
  const { autoFetch = true, filters } = options;
  
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNfts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await nftService.getMarketplace(filters);
      setNfts(data);
      logger.info('NFTs fetched', { count: data.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch NFTs';
      setError(errorMessage);
      logger.error('Failed to fetch NFTs', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchNfts();
    }
  }, [autoFetch, fetchNfts]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchNfts,
  };
}

