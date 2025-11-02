/**
 * Custom hooks for React Query with proper typing and error handling
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { queryKeys } from '../lib/react-query';
import { ApiResponse, NFT, WalletInfo, ProgramConfig, Collection } from '../types';

// Marketplace queries
export function useMarketplace(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.marketplace(page, limit),
    queryFn: async () => {
      const response = await apiService.getMarketplace();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load marketplace');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - marketplace updates frequently
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

// NFT queries
export function useNFT(mintAddress: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.nft(mintAddress),
    queryFn: async () => {
      const response = await apiService.getNFTMetadata(mintAddress);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load NFT');
      }
      return response.data;
    },
    enabled: enabled && !!mintAddress,
    staleTime: 1000 * 60 * 10, // 10 minutes - NFT metadata doesn't change often
  });
}

export function useNFTsByOwner(owner: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.nftsByOwner(owner),
    queryFn: async () => {
      const response = await apiService.getNFTsByOwner(owner);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load NFTs');
      }
      return response.data;
    },
    enabled: enabled && !!owner,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Wallet queries
export function useWalletInfo(address: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.wallet(address),
    queryFn: async () => {
      const response = await apiService.getWalletInfo(address);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load wallet info');
      }
      return response.data;
    },
    enabled: enabled && !!address,
    staleTime: 1000 * 30, // 30 seconds - balance changes frequently
    refetchInterval: 1000 * 60, // Refetch every minute for balance updates
  });
}

// Program config (very stable, cache for long time)
export function usePrograms() {
  return useQuery({
    queryKey: queryKeys.programs(),
    queryFn: async () => {
      const response = await apiService.getPrograms();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load programs');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour - program IDs rarely change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

// Collections
export function useCollections() {
  return useQuery({
    queryKey: queryKeys.collections(),
    queryFn: async () => {
      const response = await apiService.getCollections();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load collections');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Mutation for minting NFT
export function useMintNFT() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; description: string; imageUrl?: string; file?: File; creatorWallet: string }) => {
      const response = await apiService.mintNFT(data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to mint NFT');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate marketplace and collections to refetch
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

