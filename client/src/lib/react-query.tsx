/**
 * React Query configuration and setup
 * Provides intelligent caching, background refetching, and request deduplication
 */

import { QueryClient, QueryClientProvider, DefaultOptions } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

// Default query options optimized for our use case
const queryClientConfig: DefaultOptions = {
  queries: {
    // Stale time: data is considered fresh for this duration
    staleTime: 1000 * 60 * 5, // 5 minutes
    
    // Cache time: how long unused/inactive cache data remains in memory
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    
    // Refetch on window focus for real-time updates
    refetchOnWindowFocus: true,
    
    // Refetch on reconnect
    refetchOnReconnect: true,
    
    // Retry failed requests with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Use network-first strategy (stale-while-revalidate)
    refetchOnMount: true,
    
    // Structural sharing to prevent unnecessary re-renders
    structuralSharing: true,
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    retryDelay: 1000,
  },
};

// Create query client instance
export const queryClient = new QueryClient({
  defaultOptions: queryClientConfig,
});

// Query Client Provider Component
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

// Query keys factory for type-safe keys
export const queryKeys = {
  // Marketplace
  marketplace: (page = 1, limit = 20) => ['marketplace', page, limit] as const,
  
  // NFTs
  nft: (mintAddress: string) => ['nft', mintAddress] as const,
  nftsByOwner: (owner: string) => ['nfts', 'owner', owner] as const,
  
  // Wallet
  wallet: (address: string) => ['wallet', address] as const,
  walletBalance: (address: string) => ['wallet', address, 'balance'] as const,
  
  // CLOUT
  cloutBalance: (address: string) => ['clout', 'balance', address] as const,
  
  // Programs
  programs: () => ['programs'] as const,
  
  // Collections
  collections: () => ['collections'] as const,
  
  // Echo
  echo: (id: string) => ['echo', id] as const,
  echoTrending: () => ['echo', 'trending'] as const,
};

