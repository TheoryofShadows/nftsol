import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { NFTMintingService } from '../../src/services/nftMinting';
import { CloutTokenService } from '../../src/services/cloutToken';
import { SmartContractService } from '../../src/services/smartContractService';
import { EnhancedIPFSService } from '../../src/services/ipfsService';

// Mock all services
jest.mock('../../src/services/nftMinting');
jest.mock('../../src/services/cloutToken');
jest.mock('../../src/services/smartContractService');
jest.mock('../../src/services/ipfsService');
jest.mock('@solana/web3.js');
jest.mock('@solana/spl-token');

describe('Complete NFT Platform Flow - End-to-End', () => {
  let app: express.Application;
  let mockNFTMintingService: jest.Mocked<NFTMintingService>;
  let mockCloutTokenService: jest.Mocked<CloutTokenService>;
  let mockSmartContractService: jest.Mocked<SmartContractService>;
  let mockIPFSService: jest.Mocked<EnhancedIPFSService>;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock services
    mockNFTMintingService = new NFTMintingService() as jest.Mocked<NFTMintingService>;
    mockCloutTokenService = new CloutTokenService() as jest.Mocked<CloutTokenService>;
    mockSmartContractService = new SmartContractService() as jest.Mocked<SmartContractService>;
    mockIPFSService = new EnhancedIPFSService({} as any) as jest.Mocked<EnhancedIPFSService>;

    // Setup complete API routes
    this.setupRoutes();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  setupRoutes() {
    // NFT Creation endpoint
    app.post('/api/mint', async (req, res) => {
      try {
        const { name, description, imageUrl, creator, collection } = req.body;

        if (!name || !description || !imageUrl || !creator) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Upload image to IPFS
        const imageResult = await mockIPFSService.uploadImage(
          Buffer.from('mock-image-data'),
          { optimize: true, maxWidth: 2048, maxHeight: 2048 }
        );

        // 2. Upload metadata to IPFS
        const metadataResult = await mockIPFSService.uploadNFTMetadata({
          name,
          description,
          image: imageResult.url,
          collection,
          creator,
        });

        // 3. Mint NFT on Solana
        const mintResult = await mockNFTMintingService.mintNFT(
          creator,
          name,
          description,
          imageResult.url,
          [],
          collection
        );

        if (!mintResult.success) {
          return res.status(500).json({ error: 'NFT minting failed' });
        }

        // 4. Award CLOUT tokens
        const cloutResult = await mockCloutTokenService.distributeCloutRewards(
          creator,
          50, // Base CLOUT amount
          1.0 // Honor multiplier
        );

        // 5. Update loyalty profile
        const trustLevel = await mockSmartContractService.getUserTrustLevel(creator);

        res.json({
          success: true,
          nft: {
            mintAddress: mintResult.mintAddress,
            signature: mintResult.signature,
            metadataUri: metadataResult.url,
            imageUrl: imageResult.url,
          },
          clout: {
            earned: cloutResult.amount,
            total: cloutResult.amount,
            multiplier: cloutResult.honorMultiplier,
          },
          trust: {
            level: trustLevel,
            benefits: await mockCloutTokenService.calculateCloutBenefits(cloutResult.amount),
          },
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // NFT Purchase endpoint
    app.post('/api/purchase', async (req, res) => {
      try {
        const { buyerWallet, sellerWallet, nftMint, price } = req.body;

        if (!buyerWallet || !sellerWallet || !nftMint || !price) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Get buyer's trust level
        const buyerTrustLevel = await mockSmartContractService.getUserTrustLevel(buyerWallet);
        const sellerTrustLevel = await mockSmartContractService.getUserTrustLevel(sellerWallet);

        // 2. Create trust-based escrow
        const escrowResult = await mockSmartContractService.createTrustEscrow({
          buyerWallet,
          sellerWallet,
          nftMint,
          price,
          trustLevel: Math.min(buyerTrustLevel, sellerTrustLevel),
          paymentTerms: {
            initialPayment: price * 50 / 100,
            escrowAmount: price * 50 / 100,
            releaseDelay: 24 * 60 * 60,
            disputeWindow: 72 * 60 * 60,
          },
        });

        if (!escrowResult.success) {
          return res.status(500).json({ error: 'Failed to create escrow' });
        }

        // 3. Process initial payment
        const paymentResult = await mockSmartContractService.processInitialPayment(
          escrowResult.escrowAddress!,
          buyerWallet,
          sellerWallet
        );

        if (!paymentResult.success) {
          return res.status(500).json({ error: 'Payment processing failed' });
        }

        // 4. Award CLOUT tokens for purchase
        const buyerCloutResult = await mockSmartContractService.awardCloutForTransaction(
          buyerWallet,
          25, // Base CLOUT for purchase
          'nft_purchase'
        );

        const sellerCloutResult = await mockSmartContractService.awardCloutForTransaction(
          sellerWallet,
          25, // Base CLOUT for sale
          'nft_sale'
        );

        res.json({
          success: true,
          escrow: {
            address: escrowResult.escrowAddress,
            status: 'payment_made',
            transaction: paymentResult.transaction,
          },
          clout: {
            buyer: {
              earned: buyerCloutResult.amount,
              transaction: buyerCloutResult.transaction,
            },
            seller: {
              earned: sellerCloutResult.amount,
              transaction: sellerCloutResult.transaction,
            },
          },
          trust: {
            buyer: buyerTrustLevel,
            seller: sellerTrustLevel,
          },
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // CLOUT Staking endpoint
    app.post('/api/stake', async (req, res) => {
      try {
        const { wallet, amount } = req.body;

        if (!wallet || !amount) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Get user's trust level for staking multiplier
        const trustLevel = await mockSmartContractService.getUserTrustLevel(wallet);
        const stakingMultiplier = this.calculateStakingMultiplier(trustLevel);

        // 2. Process staking transaction
        const stakeResult = await mockSmartContractService.awardCloutForTransaction(
          wallet,
          amount * stakingMultiplier / 100,
          'staking'
        );

        if (!stakeResult.success) {
          return res.status(500).json({ error: 'Staking failed' });
        }

        // 3. Update loyalty profile
        const loyaltyResult = await mockSmartContractService.awardCloutForTransaction(
          wallet,
          10, // Loyalty bonus
          'governance'
        );

        res.json({
          success: true,
          staking: {
            amount: amount,
            multiplier: stakingMultiplier,
            transaction: stakeResult.transaction,
          },
          loyalty: {
            bonus: loyaltyResult.amount,
            transaction: loyaltyResult.transaction,
          },
          trust: {
            level: trustLevel,
            benefits: await mockCloutTokenService.calculateCloutBenefits(amount),
          },
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Dispute resolution endpoint
    app.post('/api/dispute/resolve', async (req, res) => {
      try {
        const { escrowAddress, arbitratorWallet, resolution, refundAmount } = req.body;

        if (!escrowAddress || !arbitratorWallet || !resolution) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Resolve dispute
        const resolveResult = await mockSmartContractService.resolveDispute(
          escrowAddress,
          arbitratorWallet,
          resolution,
          refundAmount
        );

        if (!resolveResult.success) {
          return res.status(500).json({ error: 'Dispute resolution failed' });
        }

        res.json({
          success: true,
          resolution: {
            status: resolution,
            transaction: resolveResult.transaction,
            refundAmount: refundAmount || 0,
          },
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  calculateStakingMultiplier(trustLevel: number): number {
    if (trustLevel >= 80) return 200; // 2x
    if (trustLevel >= 60) return 150; // 1.5x
    if (trustLevel >= 40) return 125; // 1.25x
    if (trustLevel >= 20) return 110; // 1.1x
    return 100; // 1x
  }

  describe('Complete NFT Creation and Trading Flow', () => {
    it('should handle full NFT creation flow with all services', async () => {
      // Mock all service responses
      mockIPFSService.uploadImage.mockResolvedValue({
        hash: 'mock-image-hash',
        size: 1024,
        url: 'https://ipfs.io/ipfs/mock-image-hash',
        pinned: true,
      });

      mockIPFSService.uploadNFTMetadata.mockResolvedValue({
        hash: 'mock-metadata-hash',
        size: 512,
        url: 'https://ipfs.io/ipfs/mock-metadata-hash',
        pinned: true,
      });

      mockNFTMintingService.mintNFT.mockResolvedValue({
        success: true,
        mintAddress: 'mock-mint-address',
        signature: 'mock-signature',
        nft: {
          id: 1,
          mintAddress: 'mock-mint-address',
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'https://ipfs.io/ipfs/mock-image-hash',
          creator: 'creator-wallet',
        },
      });

      mockCloutTokenService.distributeCloutRewards.mockResolvedValue({
        success: true,
        amount: 50,
        recipient: 'creator-wallet',
        honorMultiplier: 1.0,
        message: 'Distributed 50 CLOUT tokens',
      });

      mockSmartContractService.getUserTrustLevel.mockResolvedValue(75);
      mockCloutTokenService.calculateCloutBenefits.mockResolvedValue({
        feeReduction: 25,
        premiumFeatures: false,
        governanceWeight: 2,
        stakingRewards: 2,
        creatorBonuses: 5,
      });

      const nftData = {
        name: 'Revolutionary NFT',
        description: 'The most amazing NFT ever created',
        imageUrl: 'https://example.com/image.png',
        creator: 'creator-wallet',
        collection: 'test-collection',
      };

      const response = await request(app)
        .post('/api/mint')
        .send(nftData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.nft.mintAddress).toBe('mock-mint-address');
      expect(response.body.nft.metadataUri).toBe('https://ipfs.io/ipfs/mock-metadata-hash');
      expect(response.body.clout.earned).toBe(50);
      expect(response.body.trust.level).toBe(75);
      expect(response.body.trust.benefits.feeReduction).toBe(25);

      // Verify all services were called
      expect(mockIPFSService.uploadImage).toHaveBeenCalled();
      expect(mockIPFSService.uploadNFTMetadata).toHaveBeenCalled();
      expect(mockNFTMintingService.mintNFT).toHaveBeenCalled();
      expect(mockCloutTokenService.distributeCloutRewards).toHaveBeenCalled();
      expect(mockSmartContractService.getUserTrustLevel).toHaveBeenCalled();
    });

    it('should handle NFT purchase with trust-based escrow', async () => {
      // Mock service responses
      mockSmartContractService.getUserTrustLevel
        .mockResolvedValueOnce(80) // Buyer trust level
        .mockResolvedValueOnce(60); // Seller trust level

      mockSmartContractService.createTrustEscrow.mockResolvedValue({
        success: true,
        escrowAddress: 'mock-escrow-address',
        transaction: 'mock-escrow-tx',
      });

      mockSmartContractService.processInitialPayment.mockResolvedValue({
        success: true,
        transaction: 'mock-payment-tx',
      });

      mockSmartContractService.awardCloutForTransaction
        .mockResolvedValueOnce({
          success: true,
          amount: 50,
          transaction: 'mock-buyer-clout-tx',
        })
        .mockResolvedValueOnce({
          success: true,
          amount: 50,
          transaction: 'mock-seller-clout-tx',
        });

      const purchaseData = {
        buyerWallet: 'buyer-wallet',
        sellerWallet: 'seller-wallet',
        nftMint: 'nft-mint-address',
        price: 1000000000, // 1 SOL in lamports
      };

      const response = await request(app)
        .post('/api/purchase')
        .send(purchaseData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.escrow.address).toBe('mock-escrow-address');
      expect(response.body.escrow.status).toBe('payment_made');
      expect(response.body.clout.buyer.earned).toBe(50);
      expect(response.body.clout.seller.earned).toBe(50);
      expect(response.body.trust.buyer).toBe(80);
      expect(response.body.trust.seller).toBe(60);

      // Verify all services were called
      expect(mockSmartContractService.getUserTrustLevel).toHaveBeenCalledTimes(2);
      expect(mockSmartContractService.createTrustEscrow).toHaveBeenCalled();
      expect(mockSmartContractService.processInitialPayment).toHaveBeenCalled();
      expect(mockSmartContractService.awardCloutForTransaction).toHaveBeenCalledTimes(2);
    });

    it('should handle CLOUT staking with trust multipliers', async () => {
      // Mock service responses
      mockSmartContractService.getUserTrustLevel.mockResolvedValue(85);
      mockSmartContractService.awardCloutForTransaction
        .mockResolvedValueOnce({
          success: true,
          amount: 200, // 100 * 2.0 multiplier
          transaction: 'mock-stake-tx',
        })
        .mockResolvedValueOnce({
          success: true,
          amount: 10,
          transaction: 'mock-loyalty-tx',
        });

      mockCloutTokenService.calculateCloutBenefits.mockResolvedValue({
        feeReduction: 30,
        premiumFeatures: true,
        governanceWeight: 3,
        stakingRewards: 3,
        creatorBonuses: 6,
      });

      const stakingData = {
        wallet: 'staker-wallet',
        amount: 100,
      };

      const response = await request(app)
        .post('/api/stake')
        .send(stakingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.staking.amount).toBe(100);
      expect(response.body.staking.multiplier).toBe(200); // 2x for high trust
      expect(response.body.loyalty.bonus).toBe(10);
      expect(response.body.trust.level).toBe(85);
      expect(response.body.trust.benefits.premiumFeatures).toBe(true);
    });

    it('should handle dispute resolution', async () => {
      // Mock service responses
      mockSmartContractService.resolveDispute.mockResolvedValue({
        success: true,
        transaction: 'mock-resolution-tx',
      });

      const disputeData = {
        escrowAddress: 'escrow-address',
        arbitratorWallet: 'arbitrator-wallet',
        resolution: 'favor_buyer',
        refundAmount: 500000000, // 0.5 SOL
      };

      const response = await request(app)
        .post('/api/dispute/resolve')
        .send(disputeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.resolution.status).toBe('favor_buyer');
      expect(response.body.resolution.transaction).toBe('mock-resolution-tx');
      expect(response.body.resolution.refundAmount).toBe(500000000);

      expect(mockSmartContractService.resolveDispute).toHaveBeenCalledWith(
        'escrow-address',
        'arbitrator-wallet',
        'favor_buyer',
        500000000
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle IPFS upload failures gracefully', async () => {
      // Mock IPFS failure
      mockIPFSService.uploadImage.mockRejectedValue(new Error('IPFS upload failed'));

      const nftData = {
        name: 'Test NFT',
        description: 'A test NFT',
        imageUrl: 'https://example.com/image.png',
        creator: 'creator-wallet',
      };

      const response = await request(app)
        .post('/api/mint')
        .send(nftData)
        .expect(500);

      expect(response.body.error).toBe('IPFS upload failed');
    });

    it('should handle Solana transaction failures', async () => {
      // Mock successful IPFS uploads
      mockIPFSService.uploadImage.mockResolvedValue({
        hash: 'mock-image-hash',
        size: 1024,
        url: 'https://ipfs.io/ipfs/mock-image-hash',
        pinned: true,
      });

      mockIPFSService.uploadNFTMetadata.mockResolvedValue({
        hash: 'mock-metadata-hash',
        size: 512,
        url: 'https://ipfs.io/ipfs/mock-metadata-hash',
        pinned: true,
      });

      // Mock NFT minting failure
      mockNFTMintingService.mintNFT.mockResolvedValue({
        success: false,
        error: 'Insufficient funds',
      });

      const nftData = {
        name: 'Test NFT',
        description: 'A test NFT',
        imageUrl: 'https://example.com/image.png',
        creator: 'creator-wallet',
      };

      const response = await request(app)
        .post('/api/mint')
        .send(nftData)
        .expect(500);

      expect(response.body.error).toBe('NFT minting failed');
    });

    it('should handle network timeouts', async () => {
      // Mock timeout error
      mockSmartContractService.getUserTrustLevel.mockRejectedValue(
        new Error('Network timeout')
      );

      const stakingData = {
        wallet: 'staker-wallet',
        amount: 100,
      };

      const response = await request(app)
        .post('/api/stake')
        .send(stakingData)
        .expect(500);

      expect(response.body.error).toBe('Network timeout');
    });

    it('should validate required fields', async () => {
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
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent NFT creations', async () => {
      // Mock all services
      mockIPFSService.uploadImage.mockResolvedValue({
        hash: 'mock-image-hash',
        size: 1024,
        url: 'https://ipfs.io/ipfs/mock-image-hash',
        pinned: true,
      });

      mockIPFSService.uploadNFTMetadata.mockResolvedValue({
        hash: 'mock-metadata-hash',
        size: 512,
        url: 'https://ipfs.io/ipfs/mock-metadata-hash',
        pinned: true,
      });

      mockNFTMintingService.mintNFT.mockResolvedValue({
        success: true,
        mintAddress: 'mock-mint-address',
        signature: 'mock-signature',
        nft: {
          id: 1,
          mintAddress: 'mock-mint-address',
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'https://ipfs.io/ipfs/mock-image-hash',
          creator: 'creator-wallet',
        },
      });

      mockCloutTokenService.distributeCloutRewards.mockResolvedValue({
        success: true,
        amount: 50,
        recipient: 'creator-wallet',
        honorMultiplier: 1.0,
        message: 'Distributed 50 CLOUT tokens',
      });

      mockSmartContractService.getUserTrustLevel.mockResolvedValue(75);
      mockCloutTokenService.calculateCloutBenefits.mockResolvedValue({
        feeReduction: 25,
        premiumFeatures: false,
        governanceWeight: 2,
        stakingRewards: 2,
        creatorBonuses: 5,
      });

      // Create multiple concurrent requests
      const requests = Array.from({ length: 5 }, (_, i) => ({
        name: `NFT ${i}`,
        description: `Description ${i}`,
        imageUrl: `https://example.com/image${i}.png`,
        creator: `creator-wallet-${i}`,
      }));

      const responses = await Promise.all(
        requests.map(data =>
          request(app)
            .post('/api/mint')
            .send(data)
        )
      );

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify services were called for each request
      expect(mockNFTMintingService.mintNFT).toHaveBeenCalledTimes(5);
      expect(mockCloutTokenService.distributeCloutRewards).toHaveBeenCalledTimes(5);
    });
  });
});

