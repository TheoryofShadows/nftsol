import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CloutBadge from '../CloutBadge';

// Mock the wallet hook
vi.mock('../../wallet/UniversalWalletAdapter', () => ({
  useUniversalWallet: () => ({
    publicKey: { toString: () => 'mock-wallet-address' },
    connected: true,
  }),
}));

// Mock the WebSocket hooks
vi.mock('../../hooks/useWebSocket', () => ({
  useCloutUpdates: () => ({
    balance: 1000,
    cloutEarned: 500,
    globalStats: {
      totalClout: 10000,
      activeUsers: 150,
      transactions24h: 25,
    },
  }),
  useWebSocket: () => ({
    isConnected: true,
  }),
}));

describe('CloutBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when wallet is connected', () => {
    render(<CloutBadge />);
    
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('CLOUT')).toBeInTheDocument();
  });

  it('does not render when wallet is not connected', () => {
    vi.mocked(require('../../wallet/UniversalWalletAdapter').useUniversalWallet).mockReturnValue({
      publicKey: null,
      connected: false,
    });

    const { container } = render(<CloutBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('shows connection indicator', () => {
    render(<CloutBadge />);
    
    const connectionIndicator = screen.getByRole('button').querySelector('.connection-indicator');
    expect(connectionIndicator).toHaveClass('connected');
  });

  it('toggles details when clicked', async () => {
    render(<CloutBadge />);
    
    const badge = screen.getByRole('button');
    fireEvent.click(badge);
    
    await waitFor(() => {
      expect(screen.getByText('Earned:')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('Global Total:')).toBeInTheDocument();
      expect(screen.getByText('10,000')).toBeInTheDocument();
    });
  });

  it('shows wallet address in details', async () => {
    render(<CloutBadge />);
    
    const badge = screen.getByRole('button');
    fireEvent.click(badge);
    
    await waitFor(() => {
      expect(screen.getByText('mock...ress')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<CloutBadge />);
    
    const badge = screen.getByRole('button');
    expect(badge).toHaveAttribute('aria-label');
  });
});
