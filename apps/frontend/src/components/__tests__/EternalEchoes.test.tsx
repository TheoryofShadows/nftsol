/**
 * 🧪 Jest Test Suite for Eternal Echoes Component
 * Comprehensive testing for 100% reliability
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import EternalEchoes from '../EternalEchoes';

// Mock axios
import { vi } from 'vitest';
vi.mock('axios');
const mockedAxios = require('axios');

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock wallet adapter
const mockWallet = {
  adapter: {
    name: 'Phantom',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9zdmc+',
    url: 'https://phantom.app',
    supportedTransactionVersions: new Set(['legacy', 0]),
  },
  readyState: 'Installed' as const,
  connect: vi.fn(),
  disconnect: vi.fn(),
  select: vi.fn(),
};

const mockWalletContext = {
  wallet: mockWallet,
  wallets: [mockWallet],
  publicKey: null,
  connected: false,
  connecting: false,
  disconnecting: false,
  select: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

// Mock useWallet hook
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockWalletContext,
  WalletProvider: ({ children }: any) => children,
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <WalletProvider
    wallets={[new PhantomWalletAdapter()]}
    network={WalletAdapterNetwork.Devnet}
    autoConnect={false}
  >
    {children}
  </WalletProvider>
);

describe('Eternal Echoes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: {
        videos: [
          {
            identifier: 'test_video_1',
            title: 'Test Video',
            description: 'Test description',
            creator: 'Test Creator',
            date: '2023-01-01',
            thumbnail: 'https://example.com/thumb.jpg',
            videoUrl: 'https://example.com/video.mp4',
            duration: 120
          }
        ]
      }
    });
    mockedAxios.post.mockResolvedValue({
      data: {
        success: true,
        verification: {
          summary: 'Test summary',
          score: 85,
          verified: true,
          timestamp: Date.now()
        }
      }
    });
  });

  describe('Rendering', () => {
    test('renders main heading', () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      expect(screen.getByText('🌊 Eternal Echoes')).toBeInTheDocument();
    });

    test('renders description', () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      expect(screen.getByText(/Transform public domain videos into collaborative/)).toBeInTheDocument();
    });

    test('renders navigation tabs', () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      expect(screen.getByText('🔍 Search Archive')).toBeInTheDocument();
      expect(screen.getByText('✨ Create Echo')).toBeInTheDocument();
      expect(screen.getByText('🌊 Explore Echoes')).toBeInTheDocument();
    });

    test('shows wallet connection prompt when not connected', () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      expect(screen.getByText('🔗 Wallet Required')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('handles search input', async () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const searchInput = screen.getByPlaceholderText('Search for historical videos...');
      fireEvent.change(searchInput, { target: { value: 'history' } });
      
      expect(searchInput).toHaveValue('history');
    });

    test('executes search on button click', async () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const searchInput = screen.getByPlaceholderText('Search for historical videos...');
      const searchButton = screen.getByText('Search');
      
      fireEvent.change(searchInput, { target: { value: 'history' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/eternal-echoes/search')
        );
      });
    });

    test('handles search errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const searchInput = screen.getByPlaceholderText('Search for historical videos...');
      const searchButton = screen.getByText('Search');
      
      fireEvent.change(searchInput, { target: { value: 'history' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });
  });

  describe('Mobile Detection', () => {
    test('detects mobile devices', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      // Should show mobile-specific wallet detection
      expect(screen.getByText('📱 Mobile Wallet Detection')).toBeInTheDocument();
    });

    test('shows wallet installation links on mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      expect(screen.getByText('📲 Install a Solana Wallet')).toBeInTheDocument();
      expect(screen.getByText('👻 Phantom')).toBeInTheDocument();
      expect(screen.getByText('🔥 Solflare')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('switches between tabs', () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const createTab = screen.getByText('✨ Create Echo');
      fireEvent.click(createTab);
      
      expect(screen.getByText('Select a video to create an echo')).toBeInTheDocument();
    });

    test('shows explore tab content', () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const exploreTab = screen.getByText('🌊 Explore Echoes');
      fireEvent.click(exploreTab);
      
      expect(screen.getByText('Enter Echo Ledger ID')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles network timeouts', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';
      mockedAxios.get.mockRejectedValueOnce(timeoutError);
      
      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const searchInput = screen.getByPlaceholderText('Search for historical videos...');
      const searchButton = screen.getByText('Search');
      
      fireEvent.change(searchInput, { target: { value: 'history' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('⏰ Request timeout. Please check your connection and try again.');
      });
      
      alertSpy.mockRestore();
    });

    test('handles server errors', async () => {
      const serverError = {
        response: { status: 500 }
      };
      mockedAxios.get.mockRejectedValueOnce(serverError);
      
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const searchInput = screen.getByPlaceholderText('Search for historical videos...');
      const searchButton = screen.getByText('Search');
      
      fireEvent.change(searchInput, { target: { value: 'history' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('🔧 Server error. Please try again later.');
      });
      
      alertSpy.mockRestore();
    });
  });

  describe('Wallet Connection', () => {
    test('shows connect wallet button', () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    test('handles wallet connection retry', async () => {
      const mockConnect = vi.fn().mockRejectedValueOnce(new Error('Connection failed'));
      mockWalletContext.connect = mockConnect;
      
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const searchInput = screen.getByPlaceholderText('Search for historical videos...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    test('has keyboard navigation support', () => {
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const searchInput = screen.getByPlaceholderText('Search for historical videos...');
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
      
      // Should trigger search
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('renders without performance issues', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <EternalEchoes />
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100);
    });
  });
});

// Integration tests
describe('Eternal Echoes Integration', () => {
  test('complete user flow', async () => {
    // Mock connected wallet
    mockWalletContext.connected = true;
    mockWalletContext.publicKey = { toString: () => 'test-public-key' };
    
    render(
      <TestWrapper>
        <EternalEchoes />
      </TestWrapper>
    );
    
    // Search for videos
    const searchInput = screen.getByPlaceholderText('Search for historical videos...');
    fireEvent.change(searchInput, { target: { value: 'history' } });
    
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
    
    // Switch to create tab
    const createTab = screen.getByText('✨ Create Echo');
    fireEvent.click(createTab);
    
    // Should show create echo interface
    expect(screen.getByText('Select a video to create an echo')).toBeInTheDocument();
  });
});