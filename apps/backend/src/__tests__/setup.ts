/**
 * Jest Test Setup
 * Configure test environment variables and mocks
 */

import { jest } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.SOLANA_CLUSTER = 'devnet';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
process.env.PLATFORM_SECRET_KEY_BASE58 = 'test-secret-key-base58';
process.env.PINATA_JWT = 'test-pinata-jwt';
process.env.XAI_API_KEY = 'test-xai-api-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as any;

