import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NFTMarketplace from '../../components/NFTMarketplace';

// Mock the wallet hook
vi.mock('../../wallet/UniversalWalletAdapter', () => ({
  useUniversalWallet: () => ({
    publicKey: { toString: () => 'mock-wallet-address' },
    connected: true,
  }),
}));

// Mock the WebSocket hooks
vi.mock('../../hooks/useWebSocket', () => ({
  useMarketplaceUpdates: () => ({
    recentActivity: [],
    nftListings: [],
    nftSales: [],
    isConnected: true,
  }),
  useWebSocket: () => ({
    isConnected: true,
  }),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('NFTMarketplace Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('loads and displays NFTs', async () => {
    const mockNFTs = {
      nfts: [
        {
          id: '1',
          name: 'Test NFT',
          image: 'test-image.jpg',
          price: '1.5',
          owner: 'owner-address',
          status: 'listed',
          collection: 'Test Collection',
        },
      ],
      hasMore: false,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNFTs,
    } as Response);

    renderWithQueryClient(<NFTMarketplace />);

    await waitFor(() => {
      expect(screen.getByText('Test NFT')).toBeInTheDocument();
      expect(screen.getByText('1.5 SOL')).toBeInTheDocument();
    });
  });

  it('handles filter changes', async () => {
    const mockNFTs = {
      nfts: [],
      hasMore: false,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockNFTs,
    } as Response);

    renderWithQueryClient(<NFTMarketplace />);

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Change status filter
    const statusFilter = screen.getByLabelText('Status');
    fireEvent.change(statusFilter, { target: { value: 'listed' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=listed'),
        expect.any(Object)
      );
    });
  });

  it('handles search input', async () => {
    const mockNFTs = {
      nfts: [],
      hasMore: false,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockNFTs,
    } as Response);

    renderWithQueryClient(<NFTMarketplace />);

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Type in search input
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test%20search'),
        expect.any(Object)
      );
    });
  });

  it('shows loading state', () => {
    vi.mocked(fetch).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithQueryClient(<NFTMarketplace />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    renderWithQueryClient(<NFTMarketplace />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('handles buy button click', async () => {
    const mockNFTs = {
      nfts: [
        {
          id: '1',
          name: 'Test NFT',
          image: 'test-image.jpg',
          price: '1.5',
          owner: 'owner-address',
          status: 'listed',
          collection: 'Test Collection',
        },
      ],
      hasMore: false,
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNFTs,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

    renderWithQueryClient(<NFTMarketplace />);

    await waitFor(() => {
      expect(screen.getByText('Test NFT')).toBeInTheDocument();
    });

    const buyButton = screen.getByText('Buy Now');
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/market/buy'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"mintAddress":"1"'),
        })
      );
    });
  });

  it('shows empty state when no NFTs', async () => {
    const mockNFTs = {
      nfts: [],
      hasMore: false,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNFTs,
    } as Response);

    renderWithQueryClient(<NFTMarketplace />);

    await waitFor(() => {
      expect(screen.getByText(/no nfts found/i)).toBeInTheDocument();
    });
  });
});
