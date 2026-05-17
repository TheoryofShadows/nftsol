import { pool, query, withTransaction, healthCheck, DatabaseClient as _DatabaseClient } from '../lib/database';
import { mockDatabase } from '../__mocks__/pg';

// Mock the database before importing the actual database module
jest.mock('pg');

describe('Database', () => {
  beforeEach(() => {
    mockDatabase.resetMocks();
    // Setup default mock implementations
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
      on: jest.fn()
    };
    mockDatabase.mockPool.connect.mockResolvedValue(mockClient);
  });

  // Test database connection
  it('should connect to the database', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [{ now: new Date() }], rowCount: 1 }),
      release: jest.fn(),
      on: jest.fn()
    };

    mockDatabase.mockPool.connect.mockResolvedValueOnce(mockClient);
    
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].now).toBeDefined();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
    } finally {
      await client.release();
      expect(mockClient.release).toHaveBeenCalled();
    }
  });

  // Test basic query
  it('should execute a simple query', async () => {
    const _mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [{ message: 'Hello, World!' }], rowCount: 1 }),
      release: jest.fn(),
      on: jest.fn()
    };

    mockDatabase.mockPool.query.mockResolvedValueOnce({ rows: [{ message: 'Hello, World!' }], rowCount: 1 });
    
    const result = await query('SELECT $1::text as message', ['Hello, World!']);
    expect(result.rows[0].message).toBe('Hello, World!');
    expect(mockDatabase.mockPool.query).toHaveBeenCalledWith('SELECT $1::text as message', ['Hello, World!']);
  });

  // Test transaction
  it('should handle transactions', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, value: 'test-value' }], rowCount: 1 }) // INSERT
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // COMMIT
      release: jest.fn(),
      on: jest.fn()
    };

    mockDatabase.mockPool.connect.mockResolvedValueOnce(mockClient);
    
    await withTransaction(async (client) => {
      const result = await client.query(
        'INSERT INTO test_table (value) VALUES ($1) RETURNING *',
        ['test-value']
      );
      expect(result.rows[0].value).toBe('test-value');
    });
    
    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClient.query).toHaveBeenNthCalledWith(2, 'INSERT INTO test_table (value) VALUES ($1) RETURNING *', ['test-value']);
    expect(mockClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  // Test transaction rollback on error
  it('should rollback transactions on error', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // ROLLBACK
      release: jest.fn(),
      on: jest.fn()
    };

    mockDatabase.mockPool.connect.mockResolvedValueOnce(mockClient);
    
    await expect(
      withTransaction(async (client) => {
        await client.query('INSERT INTO test_table (value) VALUES ($1)', ['should-rollback']);
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');
    
    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  // Test health check
  it('should return healthy status', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [{ now: new Date() }], rowCount: 1 }),
      release: jest.fn(),
      on: jest.fn()
    };

    mockDatabase.mockPool.connect.mockResolvedValueOnce(mockClient);
    
    const health = await healthCheck();
    expect(health.status).toBe('healthy');
    expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
    expect(mockClient.release).toHaveBeenCalled();
  });

  // Test connection pool
  it('should handle multiple concurrent connections', async () => {
    // Create test data and expected results
    const testValues = [10, 20, 30, 40, 50];
    const expectedResults = [...testValues].sort((a, b) => a - b);
    
    // Create mock clients for each test value
    const mockClients = testValues.map(value => ({
      query: jest.fn().mockResolvedValue({
        rows: [{ num: value }],
        rowCount: 1
      }),
      release: jest.fn(),
      on: jest.fn()
    }));
    
    // Track which clients are used
    let clientIndex = 0;
    
    // Mock the pool's connect method to return different clients
    mockDatabase.mockPool.connect.mockImplementation(() => {
      if (clientIndex >= mockClients.length) {
        throw new Error('No more mock clients available');
      }
      return Promise.resolve(mockClients[clientIndex++]);
    });
    
    // Mock the pool's query method to use the direct query function
    mockDatabase.mockPool.query.mockImplementation(async (queryText, params) => {
      // For direct pool queries, just return a simple response
      return {
        rows: [{ num: params ? params[0] : 0 }],
        rowCount: 1
      };
    });
    
    // Run concurrent queries using pool.connect()
    const promises = testValues.map(async (value) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT $1::int as num', [value]);
        return result.rows[0].num;
      } finally {
        client.release();
      }
    });

    // Wait for all queries to complete
    const results = (await Promise.all(promises)).sort((a, b) => a - b);

    // Verify results
    expect(results).toEqual(expectedResults);

    // Verify each client was used and released
    mockClients.forEach((client, index) => {
      expect(client.query).toHaveBeenCalledWith('SELECT $1::int as num', [testValues[index]]);
      expect(client.release).toHaveBeenCalled();
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    await pool.end();
  });
});
