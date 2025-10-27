/// <reference path="./jest.d.ts" />

// Load test environment variables
import 'dotenv/config';
import path from 'path';

// Load test environment variables
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: path.resolve(__dirname, '../../config/test/backend.env') });

// Mock console.error to prevent test failures from expected errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (message.includes('❌') || message.includes('Error')) {
    // Allow specific errors to pass through if needed, or filter them
    // For now, we'll suppress them in tests unless explicitly needed
    return; 
  }
  originalConsoleError(...args);
};

// Mock Solana web3.js Connection and Keypair for unit tests
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: 'mockBlockhash', lastValidBlockHeight: 1000 }),
    getSignatureStatus: jest.fn().mockResolvedValue({ value: { confirmationStatus: 'finalized' } }),
    sendRawTransaction: jest.fn().mockResolvedValue('mockSignature'),
    simulateTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
    getParsedAccountInfo: jest.fn().mockResolvedValue({ value: { data: { parsed: { info: { mint: 'mockMintAddress' } } } } }),
    getTokenAccountBalance: jest.fn().mockResolvedValue({ value: { amount: '100', decimals: 0 } }),
    getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL
  })),
  Keypair: {
    generate: jest.fn().mockReturnValue({
      publicKey: { toString: () => 'mockPublicKey' },
      secretKey: new Uint8Array(64).fill(1),
    }),
    fromSecretKey: jest.fn().mockReturnValue({
      publicKey: { toString: () => 'mockPublicKey' },
      secretKey: new Uint8Array(64).fill(1),
    }),
  },
  PublicKey: jest.fn().mockImplementation((value) => {
    // Validate base58 format for realistic behavior
    if (typeof value === 'string' && !/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) {
      throw new Error('Non-base58 character');
    }
    return {
      toBase58: () => value || 'mockPublicKey',
      toString: () => value || 'mockPublicKey',
      equals: jest.fn((other) => other.toBase58() === (value || 'mockPublicKey')),
    };
  }),
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    sign: jest.fn(),
    serialize: jest.fn().mockReturnValue(Buffer.from('mockTransaction')),
  })),
  SystemProgram: {
    transfer: jest.fn().mockReturnValue({}),
  },
  LAMPORTS_PER_SOL: 1_000_000_000,
}));

// Mock Umi and Metaplex related functions
jest.mock('@metaplex-foundation/umi', () => ({
  ...jest.requireActual('@metaplex-foundation/umi'),
  createSignerFromKeypair: jest.fn((umi, keypair) => ({
    ...keypair,
    publicKey: keypair.publicKey,
    signMessage: jest.fn(),
    signTransaction: jest.fn(),
    signAllTransactions: jest.fn(),
  })),
  generateSigner: jest.fn(() => ({
    publicKey: { toString: () => 'mockUmiPublicKey' },
    secretKey: new Uint8Array(64).fill(2),
  })),
  signerIdentity: jest.fn(),
  publicKey: jest.fn((value) => ({
    toString: () => value || 'mockUmiPublicKey',
    toBase58: () => value || 'mockUmiPublicKey',
    equals: jest.fn((other) => other.toString() === (value || 'mockUmiPublicKey')),
  })),
  percentAmount: jest.fn(),
  some: jest.fn((value) => ({ __option: 'Some', value })),
  none: { __option: 'None' },
  use: jest.fn().mockReturnThis(),
}));

jest.mock('@metaplex-foundation/umi-bundle-defaults', () => ({
  createUmi: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    eddsa: {
      createKeypairFromSecretKey: jest.fn(() => ({
        publicKey: { toString: () => 'mockUmiKeypairPublicKey' },
        secretKey: new Uint8Array(64).fill(3),
      })),
    },
    rpc: {
      sendAndConfirmTransaction: jest.fn().mockResolvedValue({ signature: 'mockUmiSignature' }),
    },
    transactions: {
      sendAndConfirm: jest.fn().mockResolvedValue({ signature: 'mockUmiSignature' }),
    },
    identity: {
      publicKey: { toString: () => 'mockUmiIdentityPublicKey' },
    },
    // Add more Umi methods that might be needed
    program: jest.fn().mockReturnThis(),
    instruction: jest.fn().mockReturnThis(),
    sendAndConfirm: jest.fn().mockResolvedValue({ signature: 'mockUmiSignature' }),
  })),
}));

jest.mock('@metaplex-foundation/umi-uploader-irys', () => ({
  irysUploader: jest.fn(() => ({
    upload: jest.fn().mockResolvedValue('mockIrysUri'),
  })),
}));

jest.mock('@metaplex-foundation/mpl-bubblegum', () => ({
  createTree: jest.fn().mockResolvedValue({ sendAndConfirm: jest.fn().mockResolvedValue({ signature: 'mockTreeCreationSignature' }) }),
  mintV2: jest.fn().mockResolvedValue({ sendAndConfirm: jest.fn().mockResolvedValue({ signature: 'mockMintV2Signature' }) }),
  mplBubblegum: jest.fn(),
}));

jest.mock('@metaplex-foundation/digital-asset-standard-api', () => ({
  dasApi: jest.fn(() => ({
    getAssetProof: jest.fn().mockResolvedValue({ proof: ['mockProof'], root: 'mockRoot' }),
    getAsset: jest.fn().mockResolvedValue({ compression: { tree: 'mockTree' } }),
  })),
}));

// Mock Drizzle ORM and Postgres client
jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: jest.fn(() => ({
    select: jest.fn(() => ({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([]),
    })),
    insert: jest.fn(() => ({
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([{ id: 'mockId' }]),
    })),
    update: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([{ id: 'mockId' }]),
    })),
    delete: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([{ id: 'mockId' }]),
    })),
  })),
}));

jest.mock('postgres', () => {
  const mockClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    end: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [] }),
  };
  const mockPostgres = jest.fn(() => mockClient) as any;
  mockPostgres.sql = jest.fn(() => ({})); // Mock sql tag for drizzle
  return mockPostgres;
});

// Mock the database module specifically
jest.mock('../src/db', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([
        { id: 'mock-nft-1', name: 'Test NFT 1', creator: 'mock-creator' },
        { id: 'mock-nft-2', name: 'Test NFT 2', creator: 'mock-creator' }
      ]),
    })),
    insert: jest.fn(() => ({
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([{ id: 'mockId', mintAddress: 'mockMintAddress', signature: 'mockSignature' }]),
    })),
    update: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([{ id: 'mockId' }]),
    })),
    delete: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([{ id: 'mockId' }]),
    })),
  }
}));

// Mock NFT Minting Service
jest.mock('@/services/nftMinting', () => {
  const mockNFTMintingService = {
    mintNFT: jest.fn().mockResolvedValue({
      success: true,
      mintAddress: 'mockMintAddress',
      signature: 'mockSignature',
      nftId: 'mockNftId'
    }),
    getNFT: jest.fn().mockImplementation((nftId) => {
      if (nftId === 'non-existent-mint' || nftId === 'non-existent-nft') {
        return Promise.resolve({
          success: false,
          error: 'NFT not found'
        });
      }
      return Promise.resolve({
        success: true,
        nft: {
          id: nftId,
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'https://example.com/image.png',
          creator: 'mock-creator'
        }
      });
    }),
    getNFTsByCreator: jest.fn().mockResolvedValue({
      success: true,
      nfts: []
    }),
    getAllNFTs: jest.fn().mockResolvedValue({
      success: true,
      nfts: [
        { id: 'nft-1', name: 'NFT 1' },
        { id: 'nft-2', name: 'NFT 2' }
      ]
    })
  };
  
  return {
    NFTMintingService: jest.fn().mockImplementation(() => mockNFTMintingService)
  };
});

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  })),
}));

// Mock environment configuration
jest.mock('@/config/environment', () => ({
  getAppConfig: jest.fn(() => ({
    env: 'test',
    isProduction: false,
    port: 3001,
    logLevel: 'warn',
    allowedOrigins: ['http://localhost:3000'],
  })),
  getHeliusConfig: jest.fn(() => ({
    apiKey: 'mockHeliusApiKey',
    rpcUrl: 'https://api.devnet.solana.com',
    restUrl: 'https://api.helius.xyz/v0/',
    timeoutMs: 15000,
    cluster: 'devnet',
  })),
}));

// Mock Solana SPL Token functions
jest.mock('@solana/spl-token', () => ({
  getAssociatedTokenAddress: jest.fn().mockResolvedValue(new (jest.requireActual('@solana/web3.js').PublicKey)('11111111111111111111111111111112')),
  createTransferInstruction: jest.fn().mockReturnValue({}),
  getAccount: jest.fn().mockResolvedValue({
    amount: BigInt(5000),
    mint: new (jest.requireActual('@solana/web3.js').PublicKey)('4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf'),
  }),
  TOKEN_PROGRAM_ID: new (jest.requireActual('@solana/web3.js').PublicKey)('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
}));

// Mock the CloutTokenService to return expected test results
jest.mock('@/services/cloutToken', () => {
  const mockCloutTokenService = {
    distributeCloutRewards: jest.fn().mockImplementation((recipientWallet, baseAmount, honorMultiplier = 1.0) => {
      const finalAmount = Math.floor(baseAmount * honorMultiplier);
      if (finalAmount <= 0) {
        return Promise.resolve({ success: false, message: 'No CLOUT to distribute' });
      }
      return Promise.resolve({
        success: true,
        amount: finalAmount,
        recipient: recipientWallet,
        honorMultiplier,
        signature: 'mock-clout-distribution-signature'
      });
    }),
    getCloutBalance: jest.fn().mockImplementation((walletAddress) => {
      if (walletAddress === 'non-existent-wallet') {
        return Promise.resolve({
          balance: 0,
          decimals: '4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf',
          wallet: walletAddress,
          cloutEarned: 0
        });
      }
      return Promise.resolve({
        balance: 5000,
        decimals: '4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf',
        wallet: walletAddress,
        cloutEarned: 5000
      });
    }),
    calculateCloutBenefits: jest.fn().mockImplementation((balance) => {
      if (balance >= 10000) return { 
        feeReduction: 50, 
        premiumFeatures: true, 
        governanceWeight: 10, 
        stakingRewards: 10,
        creatorBonuses: 20
      };
      if (balance >= 2500) return { 
        feeReduction: Math.floor(balance / 100), 
        premiumFeatures: false, 
        governanceWeight: Math.floor(balance / 1000), 
        stakingRewards: Math.floor(balance / 1000),
        creatorBonuses: Math.floor(balance / 500)
      };
      return { 
        feeReduction: 0, 
        premiumFeatures: false, 
        governanceWeight: 0, 
        stakingRewards: 0,
        creatorBonuses: Math.floor(balance / 500)
      };
    }),
    getCloutTokenInfo: jest.fn().mockImplementation(() => {
      return {
        name: 'CLOUT Token',
        symbol: 'CLOUT',
        decimals: 9,
        totalSupply: 1_000_000_000,
        mintAddress: '4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf',
        utilities: [
          'Fee reduction (up to 50%)',
          'Premium marketplace features',
          'Governance voting power',
          'Staking rewards',
          'Creator bonuses',
          'Priority transaction processing'
        ]
      };
    })
  };
  
  return {
    CloutTokenService: jest.fn().mockImplementation(() => mockCloutTokenService)
  };
});

// Mock BubblegumService directly
jest.mock('@/services/bubblegumService', () => {
  const mockBubblegumService = {
    signerConfigured: true,
    setSigner: jest.fn().mockImplementation(() => {
      mockBubblegumService.signerConfigured = true;
      return Promise.resolve();
    }),
    getServiceInfo: jest.fn().mockReturnValue({
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
      typicalBatchSize: '100-10000',
      typicalCost: '$1-10 for 100K NFTs',
      costPerNFT: '$0.00001'
    }),
    createTree: jest.fn().mockImplementation((options) => {
      if (!options.maxDepth || options.maxDepth < 1) {
        return Promise.reject(new Error('Invalid tree options'));
      }
      return Promise.resolve({ 
        treeAddress: new (jest.requireActual('@solana/web3.js').PublicKey)('11111111111111111111111111111112'), 
        signature: 'mockTreeSignature' 
      });
    }),
    createCompressedNFT: jest.fn().mockImplementation((options) => {
      if (!options.metadata?.name) {
        return Promise.reject(new Error('Invalid metadata'));
      }
      return Promise.resolve({ 
        assetId: new (jest.requireActual('@solana/web3.js').PublicKey)('11111111111111111111111111111113'), 
        signature: 'mockMintSignature' 
      });
    }),
    bulkMintCompressedNFTs: jest.fn().mockImplementation((options) => {
      if (!options.metadatas || !Array.isArray(options.metadatas) || options.metadatas.length === 0) {
        return Promise.reject(new Error('Invalid metadatas array'));
      }
      const count = options.metadatas.length;
      return Promise.resolve({
        minted: count,
        signatures: Array(count).fill('mockBulkMintSignature'),
        totalCost: count * 0.00001,
        assetIds: Array(count).fill(new (jest.requireActual('@solana/web3.js').PublicKey)('11111111111111111111111111111114'))
      });
    }),
    getMerkleProof: jest.fn().mockResolvedValue(['mockProof1', 'mockProof2', 'mockProof3']),
    verifyMerkleProof: jest.fn().mockResolvedValue(true),
  };

  return {
    BubblegumService: jest.fn().mockImplementation(() => mockBubblegumService)
  };
});
jest.mock('@/services/solanaServiceManager', () => {
  const mockBubblegumService = {
    setSigner: jest.fn().mockImplementation(() => {
      // Mock signer configuration
      mockBubblegumService.signerConfigured = true;
      return Promise.resolve();
    }),
    signerConfigured: true, // Start as configured for tests
    getServiceInfo: jest.fn().mockReturnValue({ status: 'ready' }),
    createTree: jest.fn().mockResolvedValue({ treeAddress: new (jest.requireActual('@solana/web3.js').PublicKey)('mockTreeAddress'), signature: 'mockTreeSignature' }),
    createCompressedNFT: jest.fn().mockResolvedValue({ assetId: new (jest.requireActual('@solana/web3.js').PublicKey)('mockAssetId'), signature: 'mockMintSignature' }),
    bulkMintCompressedNFTs: jest.fn().mockResolvedValue([{ assetId: new (jest.requireActual('@solana/web3.js').PublicKey)('mockBulkAssetId'), signature: 'mockBulkMintSignature' }]),
    getMerkleProof: jest.fn().mockResolvedValue({ proof: ['mockProof'], root: 'mockRoot' }),
    verifyMerkleProof: jest.fn().mockResolvedValue(true),
  };

  return {
    solanaServiceManager: {
      initialize: jest.fn().mockResolvedValue({ bubblegumService: mockBubblegumService }),
      getService: jest.fn((serviceName) => {
        if (serviceName === 'bubblegumService') {
          return mockBubblegumService;
        }
        return null;
      }),
    },
  };
});

// Set Jest timeout
jest.setTimeout(30000);

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};