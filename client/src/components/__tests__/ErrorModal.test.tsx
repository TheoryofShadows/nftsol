import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorModal, { ErrorInfo } from '../ErrorModal';

// Mock the wallet hook
vi.mock('../../wallet/UniversalWalletAdapter', () => ({
  useUniversalWallet: () => ({
    connected: true,
    publicKey: { toString: () => 'mock-wallet-address' },
  }),
}));

describe('ErrorModal', () => {
  const mockError: ErrorInfo = {
    type: 'wallet',
    title: 'Wallet Connection Error',
    message: 'Failed to connect to wallet',
    details: 'Error details here',
    retryable: true,
    showTopUp: false,
  };

  const mockOnClose = vi.fn();
  const mockOnRetry = vi.fn();
  const mockOnAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error modal when error is provided', () => {
    render(
      <ErrorModal
        error={mockError}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onAction={mockOnAction}
      />
    );

    expect(screen.getByText('Wallet Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to connect to wallet')).toBeInTheDocument();
  });

  it('does not render when error is null', () => {
    const { container } = render(
      <ErrorModal
        error={null}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onAction={mockOnAction}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ErrorModal
        error={mockError}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onAction={mockOnAction}
      />
    );

    const closeButton = screen.getByLabelText('Close error modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when retry button is clicked', async () => {
    render(
      <ErrorModal
        error={mockError}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onAction={mockOnAction}
      />
    );

    const retryButton = screen.getByText('🔄 Try Again');
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('shows details when toggle is clicked', async () => {
    render(
      <ErrorModal
        error={mockError}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onAction={mockOnAction}
      />
    );

    const toggleButton = screen.getByText('Show Details');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
      expect(screen.getByText('Error details here')).toBeInTheDocument();
    });
  });

  it('shows wallet help for wallet errors', () => {
    render(
      <ErrorModal
        error={mockError}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onAction={mockOnAction}
      />
    );

    expect(screen.getByText('💡 Wallet Connection Help')).toBeInTheDocument();
  });

  it('shows top-up section when showTopUp is true', () => {
    const topUpError: ErrorInfo = {
      ...mockError,
      showTopUp: true,
    };

    render(
      <ErrorModal
        error={topUpError}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onAction={mockOnAction}
      />
    );

    expect(screen.getByText('💰 Low SOL Balance')).toBeInTheDocument();
    expect(screen.getByText('Buy SOL with Jupiter')).toBeInTheDocument();
  });

  it('shows action button when action is provided', () => {
    const actionError: ErrorInfo = {
      ...mockError,
      action: 'Reconnect Wallet',
    };

    render(
      <ErrorModal
        error={actionError}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onAction={mockOnAction}
      />
    );

    const actionButton = screen.getByText('Reconnect Wallet');
    fireEvent.click(actionButton);

    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  it('disables retry button when retrying', () => {
    render(
      <ErrorModal
        error={mockError}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onAction={mockOnAction}
      />
    );

    const retryButton = screen.getByText('🔄 Try Again');
    fireEvent.click(retryButton);

    // The button should be disabled during retry
    expect(retryButton).toBeDisabled();
  });

  it('shows error code when provided', () => {
    const errorWithCode: ErrorInfo = {
      ...mockError,
      errorCode: 'WALLET_001',
    };

    render(
      <ErrorModal
        error={errorWithCode}
        onClose={mockOnClose}
        onRetry={mockOnRetry}
        onAction={mockOnAction}
      />
    );

    expect(screen.getByText('Code: WALLET_001')).toBeInTheDocument();
  });
});
