/**
 * Unit Tests: CloutBadge Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock wallet adapter
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(),
}));

// Mock clout balance hook
vi.mock('../../hooks/useCloutBalance', () => ({
  useCloutBalance: vi.fn(),
}));

// Mock CSS import
vi.mock('../../styles/CloutBadge.css', () => ({}));

import CloutBadge from '../../components/CloutBadge';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCloutBalance } from '../../hooks/useCloutBalance';
import { PublicKey } from '@solana/web3.js';

const mockUseWallet = useWallet as ReturnType<typeof vi.fn>;
const mockUseCloutBalance = useCloutBalance as ReturnType<typeof vi.fn>;

describe('CloutBadge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when wallet is not connected', () => {
    mockUseWallet.mockReturnValue({ publicKey: null, connected: false });
    mockUseCloutBalance.mockReturnValue({ balance: 0, isLoading: false, error: null });

    const { container } = render(<CloutBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders badge when wallet is connected', () => {
    const mockPublicKey = new PublicKey('11111111111111111111111111111111');
    mockUseWallet.mockReturnValue({ publicKey: mockPublicKey, connected: true });
    mockUseCloutBalance.mockReturnValue({ balance: 1250.5, isLoading: false, error: null });

    render(<CloutBadge />);

    expect(screen.getByText('CLOUT Balance')).toBeInTheDocument();
    expect(screen.getByText('1,250.5')).toBeInTheDocument();
  });

  it('shows loading state while balance is loading', () => {
    const mockPublicKey = new PublicKey('11111111111111111111111111111111');
    mockUseWallet.mockReturnValue({ publicKey: mockPublicKey, connected: true });
    mockUseCloutBalance.mockReturnValue({ balance: 0, isLoading: true, error: null });

    render(<CloutBadge />);

    expect(screen.getByLabelText('Loading CLOUT balance')).toBeInTheDocument();
  });

  it('shows error state when balance fetch fails', () => {
    const mockPublicKey = new PublicKey('11111111111111111111111111111111');
    mockUseWallet.mockReturnValue({ publicKey: mockPublicKey, connected: true });
    mockUseCloutBalance.mockReturnValue({ balance: 0, isLoading: false, error: 'Network error' });

    render(<CloutBadge />);

    expect(screen.getByText('⚠️ Error')).toBeInTheDocument();
  });

  it('truncates wallet address for display', () => {
    const mockPublicKey = new PublicKey('So11111111111111111111111111111111111111112');
    mockUseWallet.mockReturnValue({ publicKey: mockPublicKey, connected: true });
    mockUseCloutBalance.mockReturnValue({ balance: 500, isLoading: false, error: null });

    render(<CloutBadge />);

    const addressText = screen.getByText(/So1111.*1112/);
    expect(addressText).toBeInTheDocument();
  });

  it('has correct ARIA attributes for accessibility', () => {
    const mockPublicKey = new PublicKey('11111111111111111111111111111111');
    mockUseWallet.mockReturnValue({ publicKey: mockPublicKey, connected: true });
    mockUseCloutBalance.mockReturnValue({ balance: 100, isLoading: false, error: null });

    render(<CloutBadge />);

    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-live', 'polite');
  });

  it('formats large balances with commas', () => {
    const mockPublicKey = new PublicKey('11111111111111111111111111111111');
    mockUseWallet.mockReturnValue({ publicKey: mockPublicKey, connected: true });
    mockUseCloutBalance.mockReturnValue({ balance: 1234567.89, isLoading: false, error: null });

    render(<CloutBadge />);

    expect(screen.getByText('1,234,567.89')).toBeInTheDocument();
  });
});
