import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { NFTMintingService } from '../../src/services/nftMinting';
import { CloutTokenService } from '../../src/services/cloutToken';

// Mock the services
jest.mock('../../src/services/nftMinting');
jest.mock('../../src/services/cloutToken');
jest.mock('../../src/services/ipfsService');

describe('NFT Creation End-to-End Flow', () => {
  let app: express.Application;
  let mockNFTMintingService: jest.Mocked<NFTMintingService>;
  let mockCloutTokenService: jest.Mocked<CloutTokenService>;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock services
    mockNFTMintingService = new NFTMintingService() as jest.Mocked<NFTMintingService>;
    mockCloutTokenService = new CloutTokenService() as jest.Mocked<CloutTokenService>;

    // Setup routes
    app.post('/api/mint', async (req, res) => {
      try {
        const { name, description, imageUrl, creator } = req.body;

        if (!name || !description || !imageUrl || !creator) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Mock NFT minting
        const mintResult = await mockNFTMintingService.mintNFT(
          creator,
          name,
          description,
          imageUrl,
          [],
          undefined
        );

        if (mintResult.success) {
          // Award CLOUT tokens for NFT creation
          const cloutResult = await mockCloutTokenService.distributeCloutRewards(
            creator,
            50, // Base CLOUT amount for NFT creation
            1.0 // Honor multiplier
          );

          res.json({
            success: true,
            mintAddress: mintResult.mintAddress,
            signature: mintResult.signature,
            cloutEarned: cloutResult.amount,
            cloutTotal: cloutResult.amount,
          });
        } else {
          res.status(500).json({ error: 'NFT minting failed' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/clout/balance/:wallet', async (req, res) => {
      try {
        const { wallet } = req.params;
        const balance = await mockCloutTokenService.getCloutBalance(wallet);
        res.json({ success: true, ...balance });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete NFT Creation Flow', () => {
    it('should create NFT and award CLOUT tokens', async () => {
      // Mock successful NFT minting
      mockNFTMintingService.mintNFT.mockResolvedValue({
        success: true,
        mintAddress: 'mock-mint-address',
        signature: 'mock-signature',
        nft: {
          id: 1,
          mintAddress: 'mock-mint-address',
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'https://example.com/image.png',
          creator: 'test-wallet-address',
        },
      });

      // Mock CLOUT token distribution
      mockCloutTokenService.distributeCloutRewards.mockResolvedValue({
        success: true,
        amount: 50,
        recipient: 'test-wallet-address',
        honorMultiplier: 1.0,
        message: 'Distributed 50 CLOUT tokens',
      });

      const nftData = {
        name: 'Test NFT',
        description: 'A revolutionary test NFT',
        imageUrl: 'https://example.com/image.png',
        creator: 'test-wallet-address',
      };

      const response = await request(app)
        .post('/api/mint')
        .send(nftData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mintAddress).toBe('mock-mint-address');
      expect(response.body.signature).toBe('mock-signature');
      expect(response.body.cloutEarned).toBe(50);
      expect(response.body.cloutTotal).toBe(50);

      // Verify service calls
      expect(mockNFTMintingService.mintNFT).toHaveBeenCalledWith(
        'test-wallet-address',
        'Test NFT',
        'A revolutionary test NFT',
        'https://example.com/image.png',
        [],
        undefined
      );

      expect(mockCloutTokenService.distributeCloutRewards).toHaveBeenCalledWith(
        'test-wallet-address',
        50,
        1.0
      );
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        name: 'Test NFT',
        // Missing description, imageUrl, creator
      };

      const response = await request(app)
        .post('/api/mint')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should handle NFT minting failure', async () => {
      // Mock NFT minting failure
      mockNFTMintingService.mintNFT.mockResolvedValue({
        success: false,
        error: 'Insufficient funds',
      });

      const nftData = {
        name: 'Test NFT',
        description: 'A test NFT',
        imageUrl: 'https://example.com/image.png',
        creator: 'test-wallet-address',
      };

      const response = await request(app)
        .post('/api/mint')
        .send(nftData)
        .expect(500);

      expect(response.body.error).toBe('NFT minting failed');
    });

    it('should handle CLOUT distribution failure gracefully', async () => {
      // Mock successful NFT minting
      mockNFTMintingService.mintNFT.mockResolvedValue({
        success: true,
        mintAddress: 'mock-mint-address',
        signature: 'mock-signature',
        nft: {
          id: 1,
          mintAddress: 'mock-mint-address',
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'https://example.com/image.png',
          creator: 'test-wallet-address',
        },
      });

      // Mock CLOUT distribution failure
      mockCloutTokenService.distributeCloutRewards.mockResolvedValue({
        success: false,
        error: 'Insufficient vault balance',
      });

      const nftData = {
        name: 'Test NFT',
        description: 'A test NFT',
        imageUrl: 'https://example.com/image.png',
        creator: 'test-wallet-address',
      };

      // Should still succeed with NFT creation even if CLOUT fails
      const response = await request(app)
        .post('/api/mint')
        .send(nftData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mintAddress).toBe('mock-mint-address');
    });
  });

  describe('CLOUT Balance Integration', () => {
    it('should retrieve CLOUT balance for wallet', async () => {
      // Mock CLOUT balance
      mockCloutTokenService.getCloutBalance.mockResolvedValue({
        balance: 1000,
        decimals: '4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf',
        wallet: 'test-wallet-address',
      });

      const response = await request(app)
        .get('/api/clout/balance/test-wallet-address')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.balance).toBe(1000);
      expect(response.body.wallet).toBe('test-wallet-address');

      expect(mockCloutTokenService.getCloutBalance).toHaveBeenCalledWith('test-wallet-address');
    });

    it('should handle balance retrieval errors', async () => {
      // Mock balance retrieval failure
      mockCloutTokenService.getCloutBalance.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .get('/api/clout/balance/test-wallet-address')
        .expect(500);

      expect(response.body.error).toBe('Network error');
    });
  });

  describe('Honor System Integration', () => {
    it('should apply honor multiplier to CLOUT rewards', async () => {
      // Mock NFT minting
      mockNFTMintingService.mintNFT.mockResolvedValue({
        success: true,
        mintAddress: 'mock-mint-address',
        signature: 'mock-signature',
        nft: {
          id: 1,
          mintAddress: 'mock-mint-address',
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'https://example.com/image.png',
          creator: 'high-honor-wallet',
        },
      });

      // Mock CLOUT distribution with honor multiplier
      mockCloutTokenService.distributeCloutRewards.mockResolvedValue({
        success: true,
        amount: 100, // 50 * 2.0 honor multiplier
        recipient: 'high-honor-wallet',
        honorMultiplier: 2.0,
        message: 'Distributed 100 CLOUT tokens',
      });

      const nftData = {
        name: 'Honor NFT',
        description: 'An NFT from a high-honor user',
        imageUrl: 'https://example.com/image.png',
        creator: 'high-honor-wallet',
      };

      const response = await request(app)
        .post('/api/mint')
        .send(nftData)
        .expect(200);

      expect(response.body.cloutEarned).toBe(100);
      expect(response.body.cloutTotal).toBe(100);

      expect(mockCloutTokenService.distributeCloutRewards).toHaveBeenCalledWith(
        'high-honor-wallet',
        50,
        2.0
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts', async () => {
      // Mock timeout error
      mockNFTMintingService.mintNFT.mockRejectedValue(new Error('Request timeout'));

      const nftData = {
        name: 'Test NFT',
        description: 'A test NFT',
        imageUrl: 'https://example.com/image.png',
        creator: 'test-wallet-address',
      };

      const response = await request(app)
        .post('/api/mint')
        .send(nftData)
        .expect(500);

      expect(response.body.error).toBe('Request timeout');
    });

    it('should handle invalid image URLs', async () => {
      const nftData = {
        name: 'Test NFT',
        description: 'A test NFT',
        imageUrl: 'invalid-url',
        creator: 'test-wallet-address',
      };

      // Mock IPFS upload failure due to invalid image
      mockNFTMintingService.mintNFT.mockRejectedValue(new Error('Invalid image URL'));

      const response = await request(app)
        .post('/api/mint')
        .send(nftData)
        .expect(500);

      expect(response.body.error).toBe('Invalid image URL');
    });

    it('should handle wallet connection issues', async () => {
      // Mock wallet-related error
      mockNFTMintingService.mintNFT.mockRejectedValue(new Error('Wallet not connected'));

      const nftData = {
        name: 'Test NFT',
        description: 'A test NFT',
        imageUrl: 'https://example.com/image.png',
        creator: 'disconnected-wallet',
      };

      const response = await request(app)
        .post('/api/mint')
        .send(nftData)
        .expect(500);

      expect(response.body.error).toBe('Wallet not connected');
    });
  });
});
