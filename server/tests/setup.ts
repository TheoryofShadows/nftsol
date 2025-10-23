import { jest, beforeAll, afterEach, afterAll } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.SOLANA_CLUSTER = 'devnet';
  process.env.HELIUS_API_KEY = 'test-api-key';
  process.env.PORT = '3001';
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock crypto for consistent hashing in tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid',
    getRandomValues: (arr: any) => arr.map(() => Math.floor(Math.random() * 256)),
  },
});

// Mock Buffer for Node.js compatibility
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Mock process.exit to prevent tests from exiting
const originalExit = process.exit;
process.exit = jest.fn() as any;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Restore process.exit after all tests
afterAll(() => {
  process.exit = originalExit;
});
