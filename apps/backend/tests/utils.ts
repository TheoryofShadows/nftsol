/**
 * Test Utilities
 * Common functions for testing
 */

import { PublicKey, Keypair } from '@solana/web3.js';

export const createMockKeypair = (): Keypair => {
  return {
    publicKey: new PublicKey('11111111111111111111111111111112'),
    secretKey: new Uint8Array(64)
  } as Keypair;
};

export const createMockPublicKey = (key?: string): PublicKey => {
  return new PublicKey(key || '11111111111111111111111111111112');
};

export const createMockMetadata = () => ({
  name: 'Test NFT',
  symbol: 'TEST',
  description: 'A test NFT for unit testing',
  image: 'https://example.com/test-image.png',
  attributes: [
    { trait_type: 'Color', value: 'Blue' },
    { trait_type: 'Rarity', value: 'Common' }
  ]
});

export const createMockTreeOptions = () => ({
  maxDepth: 14,
  maxBufferSize: 64,
  canopyDepth: 0
});

export const createMockMintOptions = () => ({
  treeAddress: createMockPublicKey(),
  metadata: createMockMetadata(),
  owner: createMockPublicKey(),
  collectionMint: createMockPublicKey()
});

export const createMockBulkMintOptions = () => ({
  treeAddress: createMockPublicKey(),
  metadatas: [createMockMetadata(), createMockMetadata()],
  owner: createMockPublicKey(),
  batchSize: 2
});

export const waitForAsync = (ms: number = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const mockConsole = () => {
  const originalConsole = console;
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  };
  return originalConsole;
};

export const restoreConsole = (originalConsole: any) => {
  global.console = originalConsole;
};
