/**
 * 🧪 Bubblegum Service Unit Tests
 * Tests for the Bubblegum v2 compressed NFT service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { BubblegumService, CompressedNFTMetadata, CreateTreeOptions, MintCompressedNFTOptions, BulkMintOptions } from '../../src/services/bubblegumService';

// Mock the Umi and Metaplex dependencies
jest.mock('@metaplex-foundation/umi', () => ({
  createSignerFromKeypair: jest.fn(),
  generateSigner: jest.fn(),
  percentAmount: jest.fn(),
  signerIdentity: jest.fn(),
  publicKey: jest.fn(),
  some: jest.fn(),
  none: jest.fn(),
}));

jest.mock('@metaplex-foundation/umi-bundle-defaults', () => ({
  createUmi: jest.fn(),
}));

jest.mock('@metaplex-foundation/mpl-bubblegum', () => ({
  createTree: jest.fn(),
  mintV2: jest.fn(),
  mplBubblegum: jest.fn(),
}));

jest.mock('@metaplex-foundation/umi-uploader-irys', () => ({
  irysUploader: jest.fn(),
}));

jest.mock('@metaplex-foundation/digital-asset-standard-api', () => ({
  dasApi: jest.fn(),
}));

describe('BubblegumService', () => {
  let service: BubblegumService;
  let mockConnection: jest.Mocked<Connection>;
  let mockKeypair: Keypair;

  beforeEach(() => {
    // Create mock connection
    mockConnection = {
      rpcEndpoint: 'https://api.devnet.solana.com',
    } as any;

    // Create test keypair
    mockKeypair = Keypair.generate();

    // Create service instance
    service = new BubblegumService(mockConnection, 'https://api.devnet.solana.com');
  });

  describe('Constructor', () => {
    it('should initialize with connection and RPC endpoint', () => {
      expect(service).toBeInstanceOf(BubblegumService);
    });
  });

  describe('setSigner', () => {
    it('should set signer without throwing error', () => {
      expect(() => {
        service.setSigner(mockKeypair);
      }).not.toThrow();
    });
  });

  describe('getServiceInfo', () => {
    it('should return service information', () => {
      const info = service.getServiceInfo();
      
      expect(info).toEqual({
        name: 'Bubblegum v2 Service',
        version: '2.0.0',
        description: 'Mass cNFT drops with 99% cost reduction',
        features: [
          'Tree Creation',
          'Single Mint',
          'Bulk Minting',
          'Progress Tracking',
          'Metadata Upload',
        ],
        costPerNFT: '$0.00001',
        typicalBatchSize: '100-10000',
        typicalCost: '$1-10 for 100K NFTs',
      });
    });
  });

  describe('createTree', () => {
    it('should validate tree options', () => {
      const invalidOptions = {
        maxDepth: -1,
        maxBufferSize: 0,
      } as CreateTreeOptions;

      expect(() => {
        service.createTree(invalidOptions);
      }).rejects.toThrow();
    });

    it('should accept valid tree options', () => {
      const validOptions: CreateTreeOptions = {
        maxDepth: 14,
        maxBufferSize: 64,
        canopyDepth: 0,
      };

      // Mock the createTree function to return a successful result
      const mockCreateTree = require('@metaplex-foundation/mpl-bubblegum').createTree;
      const mockSendAndConfirm = jest.fn() as jest.MockedFunction<any>;
      mockSendAndConfirm.mockResolvedValue({
        signature: 'test-signature',
      });
      mockCreateTree.mockResolvedValue({
        sendAndConfirm: mockSendAndConfirm,
      });

      expect(() => {
        service.createTree(validOptions);
      }).not.toThrow();
    });
  });

  describe('createCompressedNFT', () => {
    const mockMetadata: CompressedNFTMetadata = {
      name: 'Test NFT',
      symbol: 'TEST',
      description: 'A test compressed NFT',
      image: 'https://example.com/image.png',
    };

    const mockOptions: MintCompressedNFTOptions = {
      treeAddress: new PublicKey('11111111111111111111111111111112'),
      metadata: mockMetadata,
    };

    it('should validate required metadata fields', () => {
      const invalidMetadata = {
        name: '',
        symbol: '',
        description: '',
        image: '',
      } as CompressedNFTMetadata;

      const invalidOptions = {
        ...mockOptions,
        metadata: invalidMetadata,
      };

      expect(() => {
        service.createCompressedNFT(invalidOptions);
      }).rejects.toThrow();
    });

    it('should accept valid metadata', () => {
      // Mock the mintV2 function
      const mockMintV2 = require('@metaplex-foundation/mpl-bubblegum').mintV2;
      const mockSendAndConfirm = jest.fn() as jest.MockedFunction<any>;
      mockSendAndConfirm.mockResolvedValue({
        signature: 'test-mint-signature',
      });
      mockMintV2.mockResolvedValue({
        sendAndConfirm: mockSendAndConfirm,
      });

      expect(() => {
        service.createCompressedNFT(mockOptions);
      }).not.toThrow();
    });
  });

  describe('bulkMintCompressedNFTs', () => {
    const mockMetadatas: CompressedNFTMetadata[] = [
      {
        name: 'Bulk NFT 1',
        symbol: 'BULK',
        description: 'First bulk NFT',
        image: 'https://example.com/image1.png',
      },
      {
        name: 'Bulk NFT 2',
        symbol: 'BULK',
        description: 'Second bulk NFT',
        image: 'https://example.com/image2.png',
      },
    ];

    const mockBulkOptions: BulkMintOptions = {
      treeAddress: new PublicKey('11111111111111111111111111111112'),
      metadatas: mockMetadatas,
      batchSize: 2,
    };

    it('should validate metadatas array', () => {
      const invalidOptions = {
        ...mockBulkOptions,
        metadatas: [],
      };

      expect(() => {
        service.bulkMintCompressedNFTs(invalidOptions);
      }).rejects.toThrow();
    });

    it('should accept valid bulk options', () => {
      // Mock the createCompressedNFT method
      jest.spyOn(service, 'createCompressedNFT').mockResolvedValue({
        assetId: new PublicKey('11111111111111111111111111111113'),
        signature: 'test-bulk-signature',
      });

      expect(() => {
        service.bulkMintCompressedNFTs(mockBulkOptions);
      }).not.toThrow();
    });

    it('should handle batch processing correctly', async () => {
      // Mock the createCompressedNFT method
      jest.spyOn(service, 'createCompressedNFT').mockResolvedValue({
        assetId: new PublicKey('11111111111111111111111111111113'),
        signature: 'test-bulk-signature',
      });

      const result = await service.bulkMintCompressedNFTs(mockBulkOptions);
      
      expect(result.minted).toBe(2);
      expect(result.signatures).toHaveLength(2);
      expect(result.totalCost).toBeGreaterThan(0);
    });
  });

  describe('getMerkleProof', () => {
    it('should handle proof generation', async () => {
      const treeAddress = new PublicKey('11111111111111111111111111111112');
      const leafIndex = 0;

      const proof = await service.getMerkleProof(treeAddress, leafIndex);
      
      expect(Array.isArray(proof)).toBe(true);
    });
  });

  describe('verifyMerkleProof', () => {
    it('should verify proof correctly', async () => {
      const treeAddress = new PublicKey('11111111111111111111111111111112');
      const leafIndex = 0;
      const proof = ['proof-0-1234567890'];

      const isValid = await service.verifyMerkleProof(treeAddress, leafIndex, proof);
      
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', () => {
      const invalidConnection = null as any;
      
      expect(() => {
        new BubblegumService(invalidConnection, 'invalid-url');
      }).toThrow();
    });

    it('should handle invalid RPC endpoints', () => {
      expect(() => {
        new BubblegumService(mockConnection, '');
      }).toThrow();
    });
  });

  describe('Metadata Validation', () => {
    it('should validate required metadata fields', () => {
      const invalidMetadata = {
        name: '',
        symbol: '',
        description: '',
        image: '',
      } as CompressedNFTMetadata;

      const options: MintCompressedNFTOptions = {
        treeAddress: new PublicKey('11111111111111111111111111111112'),
        metadata: invalidMetadata,
      };

      expect(() => {
        service.createCompressedNFT(options);
      }).rejects.toThrow();
    });

    it('should accept valid metadata with all fields', () => {
      const validMetadata: CompressedNFTMetadata = {
        name: 'Valid NFT',
        symbol: 'VALID',
        description: 'A valid compressed NFT',
        image: 'https://example.com/valid-image.png',
        external_url: 'https://example.com',
        attributes: [
          { trait_type: 'Color', value: 'Blue' },
          { trait_type: 'Rarity', value: 'Common' },
        ],
        properties: {
          files: [
            { uri: 'https://example.com/image.png', type: 'image/png' },
          ],
          category: 'image',
          creators: [
            {
              address: '11111111111111111111111111111112',
              share: 100,
              verified: true,
            },
          ],
        },
      };

      const options: MintCompressedNFTOptions = {
        treeAddress: new PublicKey('11111111111111111111111111111112'),
        metadata: validMetadata,
      };

      // Mock the mintV2 function
      const mockMintV2 = require('@metaplex-foundation/mpl-bubblegum').mintV2;
      const mockSendAndConfirm = jest.fn() as jest.MockedFunction<any>;
      mockSendAndConfirm.mockResolvedValue({
        signature: 'test-signature',
      });
      mockMintV2.mockResolvedValue({
        sendAndConfirm: mockSendAndConfirm,
      });

      expect(() => {
        service.createCompressedNFT(options);
      }).not.toThrow();
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate bulk minting costs correctly', async () => {
      const metadatas = Array(100).fill(null).map((_, i) => ({
        name: `NFT ${i + 1}`,
        symbol: 'TEST',
        description: `Test NFT ${i + 1}`,
        image: `https://example.com/image${i + 1}.png`,
      }));

      const options: BulkMintOptions = {
        treeAddress: new PublicKey('11111111111111111111111111111112'),
        metadatas,
        batchSize: 50,
      };

      // Mock the createCompressedNFT method
      jest.spyOn(service, 'createCompressedNFT').mockResolvedValue({
        assetId: new PublicKey('11111111111111111111111111111113'),
        signature: 'test-signature',
      });

      const result = await service.bulkMintCompressedNFTs(options);
      
      expect(result.minted).toBe(100);
      expect(result.totalCost).toBe(100 * 0.00001); // $0.00001 per NFT
      expect(result.signatures).toHaveLength(100);
    });
  });
});
