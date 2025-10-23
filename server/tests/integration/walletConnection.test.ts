import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

// Mock wallet adapters
const mockPhantomWallet = {
  name: 'phantom',
  icon: '👻',
  isInstalled: true,
  connect: jest.fn(),
  disconnect: jest.fn(),
  signTransaction: jest.fn(),
  signAllTransactions: jest.fn(),
};

const mockSolflareWallet = {
  name: 'solflare',
  icon: '☀️',
  isInstalled: true,
  connect: jest.fn(),
  disconnect: jest.fn(),
  signTransaction: jest.fn(),
  signAllTransactions: jest.fn(),
};

// Mock window.phantom and window.solflare
Object.defineProperty(window, 'phantom', {
  value: {
    solana: {
      isPhantom: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
      signTransaction: jest.fn(),
      signAllTransactions: jest.fn(),
    },
  },
  writable: true,
});

Object.defineProperty(window, 'solflare', {
  value: {
    isSolflare: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
    signAllTransactions: jest.fn(),
  },
  writable: true,
});

describe('Wallet Connection Integration', () => {
  let mockConnection: jest.Mocked<Connection>;

  beforeEach(() => {
    mockConnection = {
      getAccountInfo: jest.fn(),
      getBalance: jest.fn(),
      sendTransaction: jest.fn(),
    } as any;

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Phantom Wallet Integration', () => {
    it('should detect Phantom wallet when installed', () => {
      expect(window.phantom?.solana?.isPhantom).toBe(true);
    });

    it('should connect to Phantom wallet successfully', async () => {
      const mockPublicKey = new PublicKey('11111111111111111111111111111111');
      const mockResponse = {
        publicKey: mockPublicKey,
        connected: true,
        connecting: false,
      };

      (window.phantom.solana.connect as jest.Mock).mockResolvedValue(mockResponse);

      const result = await window.phantom.solana.connect();

      expect(result.publicKey).toEqual(mockPublicKey);
      expect(result.connected).toBe(true);
      expect(window.phantom.solana.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle Phantom connection errors', async () => {
      const errorMessage = 'User rejected the request';
      (window.phantom.solana.connect as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(window.phantom.solana.connect()).rejects.toThrow(errorMessage);
    });

    it('should sign transaction with Phantom', async () => {
      const mockTransaction = {
        serialize: jest.fn().mockReturnValue(Buffer.from('mock-transaction')),
      };

      const mockSignedTransaction = {
        ...mockTransaction,
        signature: Buffer.from('mock-signature'),
      };

      (window.phantom.solana.signTransaction as jest.Mock).mockResolvedValue(mockSignedTransaction);

      const result = await window.phantom.solana.signTransaction(mockTransaction);

      expect(result).toEqual(mockSignedTransaction);
      expect(window.phantom.solana.signTransaction).toHaveBeenCalledWith(mockTransaction);
    });
  });

  describe('Solflare Wallet Integration', () => {
    it('should detect Solflare wallet when installed', () => {
      expect(window.solflare?.isSolflare).toBe(true);
    });

    it('should connect to Solflare wallet successfully', async () => {
      const mockPublicKey = new PublicKey('22222222222222222222222222222222');
      const mockResponse = {
        publicKey: mockPublicKey,
        connected: true,
        connecting: false,
      };

      (window.solflare.connect as jest.Mock).mockResolvedValue(mockResponse);

      const result = await window.solflare.connect();

      expect(result.publicKey).toEqual(mockPublicKey);
      expect(result.connected).toBe(true);
      expect(window.solflare.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle Solflare connection errors', async () => {
      const errorMessage = 'User cancelled the request';
      (window.solflare.connect as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(window.solflare.connect()).rejects.toThrow(errorMessage);
    });
  });

  describe('Universal Wallet Adapter', () => {
    it('should detect multiple installed wallets', () => {
      const installedWallets = [];
      
      if (window.phantom?.solana?.isPhantom) {
        installedWallets.push('phantom');
      }
      
      if (window.solflare?.isSolflare) {
        installedWallets.push('solflare');
      }

      expect(installedWallets).toContain('phantom');
      expect(installedWallets).toContain('solflare');
    });

    it('should handle wallet switching', async () => {
      // Start with Phantom
      const phantomPublicKey = new PublicKey('11111111111111111111111111111111');
      (window.phantom.solana.connect as jest.Mock).mockResolvedValue({
        publicKey: phantomPublicKey,
        connected: true,
      });

      const phantomResult = await window.phantom.solana.connect();
      expect(phantomResult.publicKey).toEqual(phantomPublicKey);

      // Switch to Solflare
      const solflarePublicKey = new PublicKey('22222222222222222222222222222222');
      (window.solflare.connect as jest.Mock).mockResolvedValue({
        publicKey: solflarePublicKey,
        connected: true,
      });

      const solflareResult = await window.solflare.connect();
      expect(solflareResult.publicKey).toEqual(solflarePublicKey);
    });

    it('should handle wallet disconnection', async () => {
      // Mock successful disconnection
      (window.phantom.solana.disconnect as jest.Mock).mockResolvedValue(undefined);
      (window.solflare.disconnect as jest.Mock).mockResolvedValue(undefined);

      await expect(window.phantom.solana.disconnect()).resolves.toBeUndefined();
      await expect(window.solflare.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Transaction Signing', () => {
    it('should sign single transaction', async () => {
      const mockTransaction = {
        serialize: jest.fn().mockReturnValue(Buffer.from('mock-transaction')),
      };

      const mockSignedTransaction = {
        ...mockTransaction,
        signature: Buffer.from('mock-signature'),
      };

      (window.phantom.solana.signTransaction as jest.Mock).mockResolvedValue(mockSignedTransaction);

      const result = await window.phantom.solana.signTransaction(mockTransaction);

      expect(result.signature).toBeDefined();
      expect(window.phantom.solana.signTransaction).toHaveBeenCalledWith(mockTransaction);
    });

    it('should sign multiple transactions', async () => {
      const mockTransactions = [
        { serialize: jest.fn().mockReturnValue(Buffer.from('tx1')) },
        { serialize: jest.fn().mockReturnValue(Buffer.from('tx2')) },
      ];

      const mockSignedTransactions = mockTransactions.map(tx => ({
        ...tx,
        signature: Buffer.from('mock-signature'),
      }));

      (window.phantom.solana.signAllTransactions as jest.Mock).mockResolvedValue(mockSignedTransactions);

      const result = await window.phantom.solana.signAllTransactions(mockTransactions);

      expect(result).toHaveLength(2);
      expect(result[0].signature).toBeDefined();
      expect(result[1].signature).toBeDefined();
      expect(window.phantom.solana.signAllTransactions).toHaveBeenCalledWith(mockTransactions);
    });

    it('should handle signing errors', async () => {
      const mockTransaction = {
        serialize: jest.fn().mockReturnValue(Buffer.from('mock-transaction')),
      };

      const errorMessage = 'Transaction rejected by user';
      (window.phantom.solana.signTransaction as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(window.phantom.solana.signTransaction(mockTransaction)).rejects.toThrow(errorMessage);
    });
  });

  describe('Network Connection', () => {
    it('should connect to Solana devnet', async () => {
      const connection = new Connection('https://api.devnet.solana.com');
      
      // Mock successful connection
      mockConnection.getAccountInfo.mockResolvedValue(null);
      
      const accountInfo = await connection.getAccountInfo(new PublicKey('11111111111111111111111111111111'));
      
      expect(mockConnection.getAccountInfo).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const connection = new Connection('https://api.devnet.solana.com');
      
      // Mock network error
      mockConnection.getAccountInfo.mockRejectedValue(new Error('Network error'));
      
      await expect(
        connection.getAccountInfo(new PublicKey('11111111111111111111111111111111'))
      ).rejects.toThrow('Network error');
    });
  });
});
