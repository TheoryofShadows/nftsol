/**
 * Jest Setup for Contract Testing
 * Initializes Pact and configures test environment
 */

import { Result } from '@pact-foundation/pact';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'warn';

// Extend Jest matchers
expect.extend({
  toBeValidContract(received: any) {
    const pass =
      received &&
      typeof received === 'object' &&
      received.interactions &&
      Array.isArray(received.interactions);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a valid Pact contract`
          : `Expected ${JSON.stringify(received)} to be a valid Pact contract with interactions array`
    };
  }
});

// Global test hooks
beforeAll(() => {
  // Log test environment
  console.log(`\n📋 Contract Testing Environment:`);
  console.log(`   Node: ${process.version}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Log Level: ${process.env.LOG_LEVEL}`);
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllMocks();
});

afterAll(() => {
  // Final cleanup
  console.log(`\n✅ Contract tests completed\n`);
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock HTTP client if needed
global.fetch = jest.fn() as jest.Mock;

// Custom matchers type definitions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidContract(): R;
    }
  }
}
