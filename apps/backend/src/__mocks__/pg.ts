// Simple mock for the pg module
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

// Mock PoolClient
class MockClient {
  query = jest.fn();
  release = jest.fn();
  on = jest.fn();
}

// Default mock implementations
mockPool.connect.mockImplementation(() => Promise.resolve(new MockClient()));
mockPool.query.mockImplementation((text, params) => {
  if (text && typeof text === 'string') {
    if (text.includes('SELECT NOW()')) {
      return Promise.resolve({ rows: [{ now: new Date() }], rowCount: 1 });
    }
    if (text.includes('SELECT $1::text')) {
      return Promise.resolve({ rows: [{ message: params ? params[0] : null }], rowCount: 1 });
    }
  }
  return Promise.resolve({ rows: [], rowCount: 0 });
});

// Mock the Pool class
const Pool = jest.fn(() => mockPool);

// Export mocks
export const mockDatabase = {
  mockPool,
  MockClient,
  resetMocks: () => {
    mockPool.query.mockClear();
    mockPool.connect.mockClear();
    mockPool.end.mockClear();
    mockPool.on.mockClear();
    mockPool.removeListener.mockClear();
    mockPool.removeAllListeners.mockClear();
  },
};

// Default export for the module
export default {
  Pool,
  PoolClient: MockClient,
  types: {
    // Add any needed type mocks here
  },
};

// Export the Pool class
export { Pool };

// This is needed to make TypeScript happy
export {};
