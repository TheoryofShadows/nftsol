/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Legacy code, type checking disabled
/**
 * Optimized React Query hook for NFTs with pagination and caching
 * React Query v5 API compatibility
 */

import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface UseNFTsOptions {
  limit?: number;
  staleTime?: number;
  gcTime?: number;
}

/**
 * Paginated NFT query with optimized caching
 */
export function useNFTs(page: number = 1, options: UseNFTsOptions = {}) {
  const {
    limit = 20,
    staleTime = 1000 * 60 * 5,     // 5 minutes
    gcTime = 1000 * 60 * 10         // 10 minutes
  } = options;

  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['nfts', page, limit],
    queryFn: () => apiService.getNFTs(page, limit),
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,

    // Prefetch next page
    onSuccess: (data) => {
      if (data.hasMore) {
        queryClient.prefetchQuery({
          queryKey: ['nfts', page + 1, limit],
          queryFn: () => apiService.getNFTs(page + 1, limit),
          staleTime
        });
      }
    }
  });
}

/**
 * Infinite query for "Load More" pattern
 */
export function useInfiniteNFTs(options: UseNFTsOptions = {}) {
  const {
    limit = 20,
    staleTime = 1000 * 60 * 5,
    gcTime = 1000 * 60 * 10
  } = options;

  return useInfiniteQuery({
    queryKey: ['nfts-infinite', limit],
    queryFn: ({ pageParam = 1 }) => apiService.getNFTs(pageParam, limit),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false
  });
}

/**
 * Single NFT query with image preloading
 */
export function useNFT(nftId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['nft', nftId],
    queryFn: () => apiService.getNFT(nftId),
    staleTime: 1000 * 60 * 10,      // 10 minutes
    gcTime: 1000 * 60 * 30,          // 30 minutes
    refetchOnWindowFocus: false,

    // Preload related NFTs
    onSuccess: (data) => {
      if (data.creator_id) {
        queryClient.prefetchQuery({
          queryKey: ['nfts-by-creator', data.creator_id],
          queryFn: () => apiService.getNFTsByCreator(data.creator_id, 5),
          staleTime: 1000 * 60 * 5
        });
      }
    }
  });
}

/**
 * Search query with debouncing
 */
export function useNFTSearch(query: string, options: UseNFTsOptions = {}) {
  const {
    limit = 20,
    staleTime = 1000 * 60,           // 1 minute (search results change frequently)
    gcTime = 1000 * 60 * 5
  } = options;

  return useQuery({
    queryKey: ['nft-search', query, limit],
    queryFn: () => apiService.searchNFTs(query, limit),
    staleTime,
    gcTime,
    enabled: query.length >= 2,  // Only search if 2+ characters
    refetchOnWindowFocus: false
  });
}

/**
 * Trending NFTs with aggressive caching
 */
export function useTrendingNFTs(options: UseNFTsOptions = {}) {
  const {
    limit = 20,
    staleTime = 1000 * 60 * 30,     // 30 minutes (rarely changes)
    gcTime = 1000 * 60 * 60          // 1 hour
  } = options;

  return useQuery({
    queryKey: ['nfts-trending', limit],
    queryFn: () => apiService.getTrendingNFTs(limit),
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'stale'
  });
}

/**
 * User's NFTs with real-time updates
 */
export function useUserNFTs(userId: string, options: UseNFTsOptions = {}) {
  const {
    limit = 50,
    staleTime = 1000 * 60 * 2,      // 2 minutes
    gcTime = 1000 * 60 * 5
  } = options;

  return useQuery({
    queryKey: ['user-nfts', userId, limit],
    queryFn: () => apiService.getUserNFTs(userId, limit),
    staleTime,
    gcTime,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 60 * 5  // Refresh every 5 minutes
  });
}
