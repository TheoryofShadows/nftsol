import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NFTMintingService } from '../../src/services/nftMinting';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

// Mock dependencies
jest.mock('@solana/web3.js');
jest.mock('@solana/spl-token');
jest.mock('@metaplex-foundation/mpl-token-metadata');

describe('NFTMintingService', () => {
  let mintingService: NFTMintingService;
  let mockConnection: jest.Mocked<Connection>;

  beforeEach(() => {
    mockConnection = {
      sendTransaction: jest.fn(),
      getAccountInfo: jest.fn(),
    } as any;

    mintingService = new NFTMintingService();
  });

  describe('mintNFT', () => {
    it('should mint NFT with valid parameters', async () => {
      const mockTransaction = {
        add: jest.fn(),
      };

      const mockKeypair = Keypair.generate();
      const mockSignature = 'mock-signature-hash';

      jest.spyOn(Keypair, 'generate').mockReturnValue(mockKeypair);
      jest.spyOn(mockConnection, 'sendTransaction').mockResolvedValue(mockSignature);

      // Mock the uploadMetadata method
      jest.spyOn(mintingService as any, 'uploadMetadata').mockResolvedValue('https://ipfs.io/ipfs/mock-hash');

      const result = await mintingService.mintNFT(
        'creator-wallet-address',
        'Test NFT',
        'A test NFT description',
        'https://example.com/image.png',
        [{ trait_type: 'Color', value: 'Blue' }],
        'collection-address'
      );

      expect(result.success).toBe(true);
      expect(result.mintAddress).toBe(mockKeypair.publicKey.toString());
      expect(result.signature).toBe(mockSignature);
      expect(result.nft).toBeDefined();
    });

    it('should handle minting errors gracefully', async () => {
      jest.spyOn(mockConnection, 'sendTransaction').mockRejectedValue(new Error('Transaction failed'));

      await expect(
        mintingService.mintNFT(
          'creator-wallet',
          'Test NFT',
          'Description',
          'https://example.com/image.png'
        )
      ).rejects.toThrow('Failed to mint NFT: Transaction failed');
    });

    it('should validate required parameters', async () => {
      await expect(
        mintingService.mintNFT('', 'Test NFT', 'Description', 'https://example.com/image.png')
      ).rejects.toThrow();
    });
  });

  describe('uploadMetadata', () => {
    it('should upload metadata to IPFS successfully', async () => {
      const mockMetadata = {
        name: 'Test NFT',
        description: 'Test description',
        image: 'https://example.com/image.png',
        attributes: [{ trait_type: 'Color', value: 'Blue' }],
      };

      const mockIPFSResult = {
        hash: 'mock-ipfs-hash',
        url: 'https://ipfs.io/ipfs/mock-ipfs-hash',
        size: 1024,
        pinned: true,
      };

      // Mock the IPFS service
      const mockIPFSService = {
        uploadNFTMetadata: jest.fn().mockResolvedValue(mockIPFSResult),
      };

      jest.doMock('../../src/services/ipfsService', () => ({
        EnhancedIPFSService: jest.fn().mockImplementation(() => mockIPFSService),
        defaultIPFSConfig: {},
      }));

      const result = await (mintingService as any).uploadMetadata(mockMetadata);

      expect(result).toBe(mockIPFSResult.url);
      expect(mockIPFSService.uploadNFTMetadata).toHaveBeenCalledWith({
        name: mockMetadata.name,
        description: mockMetadata.description,
        image: mockMetadata.image,
        attributes: mockMetadata.attributes,
        collection: undefined,
        creator: undefined,
        properties: undefined,
      });
    });

    it('should fallback to Pinata on IPFS failure', async () => {
      const mockMetadata = {
        name: 'Test NFT',
        description: 'Test description',
        image: 'https://example.com/image.png',
      };

      // Mock IPFS service failure
      const mockIPFSService = {
        uploadNFTMetadata: jest.fn().mockRejectedValue(new Error('IPFS failed')),
      };

      jest.doMock('../../src/services/ipfsService', () => ({
        EnhancedIPFSService: jest.fn().mockImplementation(() => mockIPFSService),
        defaultIPFSConfig: {},
      }));

      // Mock Pinata API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ IpfsHash: 'pinata-hash' }),
      });

      const result = await (mintingService as any).uploadMetadata(mockMetadata);

      expect(result).toBe('https://gateway.pinata.cloud/ipfs/pinata-hash');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error when all upload methods fail', async () => {
      const mockMetadata = {
        name: 'Test NFT',
        description: 'Test description',
        image: 'https://example.com/image.png',
      };

      // Mock IPFS service failure
      const mockIPFSService = {
        uploadNFTMetadata: jest.fn().mockRejectedValue(new Error('IPFS failed')),
      };

      jest.doMock('../../src/services/ipfsService', () => ({
        EnhancedIPFSService: jest.fn().mockImplementation(() => mockIPFSService),
        defaultIPFSConfig: {},
      }));

      // Mock Pinata API failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Pinata failed'));

      await expect((mintingService as any).uploadMetadata(mockMetadata)).rejects.toThrow(
        'Failed to upload metadata to IPFS'
      );
    });
  });
});

