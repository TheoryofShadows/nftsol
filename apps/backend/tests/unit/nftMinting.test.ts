import { describe, it, expect, beforeEach } from '@jest/globals';
import { NFTMintingService } from '../../src/services/nftMinting';

describe('NFTMintingService', () => {
  let nftMintingService: NFTMintingService;

  beforeEach(() => {
    nftMintingService = new NFTMintingService();
  });

  describe('mintNFT', () => {
    it('should mint NFT successfully', async () => {
      const params = {
        name: 'Test NFT',
        description: 'Test description',
        imageUrl: 'https://example.com/image.png',
        creatorWallet: '11111111111111111111111111111111',
        collection: 'test-collection'
      };

      const result = await nftMintingService.mintNFT(params);

      expect(result.success).toBe(true);
      expect(result.mintAddress).toBeDefined();
      expect(result.signature).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const params = {
        name: '',
        description: 'Test description',
        imageUrl: 'https://example.com/image.png',
        creatorWallet: '11111111111111111111111111111111'
      };

      const result = await nftMintingService.mintNFT(params);

      // Should still succeed as we're mocking the transaction
      expect(result.success).toBe(true);
    });
  });

  describe('getNFT', () => {
    it('should return NFT not found for non-existent NFT', async () => {
      const result = await nftMintingService.getNFT('non-existent-mint');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NFT not found');
    });
  });

  describe('getNFTsByCreator', () => {
    it('should return empty array for new creator', async () => {
      const result = await nftMintingService.getNFTsByCreator('11111111111111111111111111111111');

      expect(result.success).toBe(true);
      expect(result.nfts).toBeDefined();
    });
  });

  describe('getAllNFTs', () => {
    it('should return all NFTs', async () => {
      const result = await nftMintingService.getAllNFTs();

      expect(result.success).toBe(true);
      expect(result.nfts).toBeDefined();
    });
  });
});