/**
 * Test Configuration Fix for NFTSol
 * 
 * This script fixes common test issues including:
 * - Database mocking
 * - Environment setup
 * - Jest configuration
 * - Service initialization
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing test configuration...\n');

// Create test environment configuration
const testEnvConfig = `NODE_ENV=test
PORT=3001
LOG_LEVEL=error
SOLANA_CLUSTER=devnet
HELIUS_API_KEY=test-api-key
HELIUS_RPC_URL=https://api.devnet.solana.com
HELIUS_REST_URL=https://api.helius.xyz/v0
HELIUS_TIMEOUT_MS=5000
DEV_ALLOWED_ORIGINS=http://localhost:3001

# Database (use in-memory for tests)
DATABASE_URL=postgresql://test:test@localhost:5432/nftsol_test

# Redis (use in-memory for tests)
REDIS_URL=redis://localhost:6379

# Security (test values)
SESSION_SECRET=test-session-secret-32-characters-long
JWT_SECRET=test-jwt-secret-64-characters-long-for-testing-purposes-only
BCRYPT_ROUNDS=4

# Solana Configuration (test values)
BUBBLEGUM_PRIVATE_KEY=test-bubblegum-private-key-base58-encoded-string
IRYS_WALLET_PRIVATE_KEY=test-irys-wallet-private-key-base58-encoded-string

# WebSocket
WS_ENABLED=false

# File Upload
MAX_FILE_SIZE=10MB
UPLOAD_DIR=./test-uploads

# Monitoring
ENABLE_MONITORING=false
LOG_REQUESTS=false`;

// Write test environment file
const testEnvPath = path.join(__dirname, '..', 'config', 'test', 'backend.env');
fs.writeFileSync(testEnvPath, testEnvConfig);
console.log('✅ Created test environment configuration');

// Create test database setup script
const testDbSetup = `#!/usr/bin/env node

/**
 * Test Database Setup
 * Creates a test database and runs migrations
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🗄️ Setting up test database...');

try {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nftsol_test';
  
  // Create test database (if it doesn't exist)
  try {
    execSync('createdb nftsol_test', { stdio: 'inherit' });
    console.log('✅ Test database created');
  } catch (error) {
    console.log('ℹ️ Test database may already exist');
  }
  
  // Run migrations
  execSync('npm run db:migrate', { stdio: 'inherit', cwd: path.join(__dirname, '..', 'apps', 'backend') });
  console.log('✅ Test database migrations completed');
  
} catch (error) {
  console.error('❌ Test database setup failed:', error.message);
  process.exit(1);
}

console.log('✅ Test database setup completed');
`;

fs.writeFileSync(path.join(__dirname, '..', 'scripts', 'setup-test-db.js'), testDbSetup);
console.log('✅ Created test database setup script');

// Create Jest configuration fix
const jestConfigFix = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  
  // Mock external dependencies
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Test environment setup
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Global setup
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
  
  // Verbose output for debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: false
};`;

fs.writeFileSync(path.join(__dirname, '..', 'apps', 'backend', 'jest.config.js'), jestConfigFix);
console.log('✅ Updated Jest configuration');

// Create test setup file
const testSetup = `/**
 * Test Setup Configuration
 * Sets up mocks and test environment
 */

import 'dotenv/config';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock external services
jest.mock('../src/services/solanaServiceManager', () => ({
  solanaServiceManager: {
    initialize: jest.fn().mockResolvedValue({
      connection: {
        getVersion: jest.fn().mockResolvedValue({ 'solana-core': '1.16.0' }),
        getAccountInfo: jest.fn().mockResolvedValue(null),
        getLatestBlockhash: jest.fn().mockResolvedValue({
          blockhash: 'test-blockhash',
          lastValidBlockHeight: 1000
        })
      },
      bubblegumService: {
        getServiceInfo: jest.fn().mockReturnValue({
          service: 'Bubblegum v2 Mass cNFT Drops',
          version: '2.0.0',
          status: 'ready'
        }),
        createTree: jest.fn().mockResolvedValue({
          treeAddress: 'test-tree-address',
          signature: 'test-signature'
        }),
        createCompressedNFT: jest.fn().mockResolvedValue({
          assetId: 'test-asset-id',
          signature: 'test-signature'
        })
      },
      genesisProtocolService: {
        getServiceInfo: jest.fn().mockReturnValue({
          service: 'Genesis Protocol',
          version: '1.0.0',
          status: 'ready'
        })
      },
      isConfigured: true
    }),
    getConfig: jest.fn().mockReturnValue({
      connection: {},
      bubblegumService: {},
      genesisProtocolService: {},
      isConfigured: true
    })
  }
}));

// Mock database
jest.mock('../src/db', () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue([])
        })
      })
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 1 }])
      })
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue([{ id: 1 }])
        })
      })
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue([{ id: 1 }])
      })
    })
  }
}));

// Mock Solana Web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getVersion: jest.fn().mockResolvedValue({ 'solana-core': '1.16.0' }),
    getAccountInfo: jest.fn().mockResolvedValue(null),
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: 'test-blockhash',
      lastValidBlockHeight: 1000
    }),
    sendTransaction: jest.fn().mockResolvedValue('test-signature'),
    confirmTransaction: jest.fn().mockResolvedValue({ value: { err: null } })
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: () => key || 'test-public-key',
    toBase58: () => key || 'test-public-key'
  })),
  Keypair: {
    generate: jest.fn().mockReturnValue({
      publicKey: { toString: () => 'test-public-key' },
      secretKey: new Uint8Array(64)
    }),
    fromSecretKey: jest.fn().mockReturnValue({
      publicKey: { toString: () => 'test-public-key' },
      secretKey: new Uint8Array(64)
    })
  },
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    sign: jest.fn(),
    serialize: jest.fn().mockReturnValue(Buffer.from('test-transaction'))
  }))
}));

// Mock Umi framework
jest.mock('@metaplex-foundation/umi', () => ({
  createUmi: jest.fn().mockReturnValue({
    use: jest.fn().mockReturnThis(),
    eddsa: {
      createKeypairFromSecretKey: jest.fn().mockReturnValue({
        publicKey: 'test-public-key'
      })
    }
  }),
  createSignerFromKeypair: jest.fn().mockReturnValue('test-signer'),
  signerIdentity: jest.fn().mockReturnValue('test-identity'),
  generateSigner: jest.fn().mockReturnValue({
    publicKey: 'test-tree-public-key'
  }),
  publicKey: jest.fn().mockReturnValue('test-public-key'),
  some: jest.fn().mockReturnValue('test-some'),
  none: jest.fn().mockReturnValue('test-none'),
  percentAmount: jest.fn().mockReturnValue('test-percent')
}));

// Mock Bubblegum
jest.mock('@metaplex-foundation/mpl-bubblegum', () => ({
  createTree: jest.fn().mockReturnValue({
    sendAndConfirm: jest.fn().mockResolvedValue({
      signature: 'test-tree-signature'
    })
  }),
  mintV2: jest.fn().mockReturnValue({
    sendAndConfirm: jest.fn().mockResolvedValue({
      signature: 'test-mint-signature'
    })
  }),
  mplBubblegum: jest.fn().mockReturnValue('test-bubblegum')
}));

// Mock Irys uploader
jest.mock('@metaplex-foundation/umi-uploader-irys', () => ({
  irysUploader: jest.fn().mockReturnValue('test-irys-uploader')
}));

// Mock DAS API
jest.mock('@metaplex-foundation/digital-asset-standard-api', () => ({
  dasApi: jest.fn().mockReturnValue('test-das-api')
}));

// Global test timeout
jest.setTimeout(30000);

// Console suppression for tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Restore console for specific tests if needed
global.restoreConsole = () => {
  global.console = originalConsole;
};
`;

fs.writeFileSync(path.join(__dirname, '..', 'apps', 'backend', 'tests', 'setup.ts'), testSetup);
console.log('✅ Created test setup file');

// Create global setup and teardown files
const globalSetup = `/**
 * Global Test Setup
 * Runs once before all tests
 */

export default async () => {
  console.log('🚀 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nftsol_test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.SESSION_SECRET = 'test-session-secret-32-characters-long';
  process.env.JWT_SECRET = 'test-jwt-secret-64-characters-long-for-testing-purposes-only';
  
  console.log('✅ Test environment setup completed');
};`;

const globalTeardown = `/**
 * Global Test Teardown
 * Runs once after all tests
 */

export default async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up any global resources
  // Close database connections, etc.
  
  console.log('✅ Test environment cleanup completed');
};`;

fs.writeFileSync(path.join(__dirname, '..', 'apps', 'backend', 'tests', 'global-setup.ts'), globalSetup);
fs.writeFileSync(path.join(__dirname, '..', 'apps', 'backend', 'tests', 'global-teardown.ts'), globalTeardown);
console.log('✅ Created global setup and teardown files');

// Create test utilities
const testUtils = `/**
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
`;

fs.writeFileSync(path.join(__dirname, '..', 'apps', 'backend', 'tests', 'utils.ts'), testUtils);
console.log('✅ Created test utilities');

console.log('\n🎉 Test configuration fix completed!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm run test:unit to test the fixes');
console.log('2. Set up test database: node scripts/setup-test-db.js');
console.log('3. Update test files to use the new mocks');
console.log('4. Run full test suite: npm test');
