/**
 * Test Setup Configuration
 * Configures test environment to avoid external dependencies
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.PINATA_API_KEY = 'test-api-key';
process.env.PINATA_SECRET_KEY = 'test-secret-key';
process.env.HELIUS_API_KEY = 'test-helius-key';
process.env.SESSION_SECRET = 'test-session-secret-32-chars-long';
process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long';

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

console.error = (...args: any[]) => {
  // Only log errors that aren't expected test errors
  const message = args[0]?.toString() || '';
  if (!message.includes('Failed to create user') && 
      !message.includes('IPFS JSON upload failed') &&
      !message.includes('Failed to upload metadata') &&
      !message.includes('NFT minting failed') &&
      !message.includes('Failed to get NFT') &&
      !message.includes('Failed to get NFTs by creator') &&
      !message.includes('Failed to get all NFTs')) {
    originalConsoleError(...args);
  }
};

console.log = (...args: any[]) => {
  // Only log important messages
  const message = args[0]?.toString() || '';
  if (message.includes('✅') || message.includes('❌') || message.includes('Test')) {
    originalConsoleLog(...args);
  }
};

// Global test timeout
jest.setTimeout(30000);

// Mock external services
jest.mock('../src/services/simpleIPFSService', () => ({
  SimpleIPFSService: jest.fn().mockImplementation(() => ({
    uploadJSON: jest.fn().mockResolvedValue({
      success: true,
      ipfsHash: 'test-ipfs-hash',
      url: 'https://test-ipfs-url.com/metadata.json'
    }),
    uploadImage: jest.fn().mockResolvedValue({
      success: true,
      ipfsHash: 'test-image-hash',
      url: 'https://test-ipfs-url.com/image.png'
    })
  }))
}));

jest.mock('../src/config/database', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
    execute: jest.fn().mockResolvedValue([])
  }
}));

// Mock Solana connection
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: 'test-blockhash',
      lastValidBlockHeight: 1000000
    }),
    sendTransaction: jest.fn().mockResolvedValue('test-signature'),
    confirmTransaction: jest.fn().mockResolvedValue({
      value: { err: null }
    }),
    getSignatureStatus: jest.fn().mockResolvedValue({
      value: { confirmationStatus: 'confirmed' }
    }),
    simulateTransaction: jest.fn().mockResolvedValue({
      value: { err: null, unitsConsumed: 5000 }
    })
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: () => key || 'test-public-key',
    toBase58: () => key || 'test-public-key'
  })),
  Keypair: {
    generate: jest.fn().mockReturnValue({
      publicKey: { toString: () => 'test-generated-key' },
      secretKey: new Uint8Array(64)
    })
  },
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockReturnThis(),
    feePayer: null,
    recentBlockhash: null
  })),
  SystemProgram: {
    transfer: jest.fn().mockReturnValue({})
  }
}));

// Mock Helius API
jest.mock('../src/helius-api', () => ({
  getNFTsByOwner: jest.fn().mockResolvedValue([]),
  getNFTMetadata: jest.fn().mockResolvedValue({
    name: 'Test NFT',
    description: 'Test Description',
    image: 'https://test-image.com/image.png'
  })
}));

export {};
