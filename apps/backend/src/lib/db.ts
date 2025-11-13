import { Pool, PoolClient, QueryResult, QueryResultRow, PoolConfig, PoolClientConfig } from 'pg';
import { databaseConfig } from '../config/index';

/**
 * Types for our database operations
 */

type QueryFunction = <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
) => Promise<QueryResult<T>>;

interface DatabaseClient {
  query: QueryFunction;
  release: (err?: Error | boolean) => void;
  on: (event: string, listener: (...args: any[]) => void) => this;
}

interface DatabasePool {
  query: QueryFunction;
  connect: () => Promise<DatabaseClient>;
  end: () => Promise<void>;
  on: (event: string, listener: (...args: any[]) => void) => this;
  removeListener: (event: string, listener: (...args: any[]) => void) => this;
  removeAllListeners: (event?: string | symbol) => this;
}

// Extend the PoolClient interface to include our custom methods
interface ExtendedPoolClient extends PoolClient, DatabaseClient {}

// Helper type for the pool instance
type PoolType = DatabasePool & {
  _pool?: Pool;
};
}

interface DatabasePool {
  query: QueryFunction;
  connect: () => Promise<DatabaseClient>;
  end: () => Promise<void>;
  on: (event: string, listener: (...args: any[]) => void) => void;
}

// Simple mock database for development
class MockPool {
  private mockData: Record<string, any[]> = {};
  private connected = false;

  async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount?: number }> {
    console.log(`[Mock DB] Query: ${text}`, { params });
    
    // Handle common queries
    if (text.includes('SELECT') && text.includes('FROM')) {
      const tableMatch = text.match(/FROM\s+"?([^\s";,)]+)"?/i);
      if (tableMatch) {
        const table = tableMatch[1];
        if (!this.mockData[table]) {
          this.mockData[table] = [];
        }
        return { rows: [...this.mockData[table]], rowCount: this.mockData[table].length };
      }
    }
    
    return { rows: [], rowCount: 0 };
  }

  async connect() {
    this.connected = true;
    console.log('[Mock DB] Connected to mock database');
    
    return {
      ...this,
      release: () => {
        this.connected = false;
        console.log('[Mock DB] Connection released');
      },
      on: (event: string, callback: Function) => {
        console.log(`[Mock DB] Event: ${event}`);
        return this;
      },
      once: (event: string, callback: Function) => {
        console.log(`[Mock DB] Event (once): ${event}`);
        return this;
      },
      removeListener: () => this,
      removeAllListeners: () => this,
    };
  }

  async end() {
    this.connected = false;
    console.log('[Mock DB] Connection pool ended');
    return Promise.resolve();
  }

  // Event emitter methods
  on(event: string, listener: (...args: any[]) => void) {
    console.log(`[Mock DB] Added listener for ${event}`);
    return this;
  }

  once(event: string, listener: (...args: any[]) => void) {
    console.log(`[Mock DB] Added one-time listener for ${event}`);
    return this;
  }

  removeListener(event: string, listener: (...args: any[]) => void) {
    console.log(`[Mock DB] Removed listener for ${event}`);
    return this;
  }

  removeAllListeners(event?: string | symbol) {
    console.log(`[Mock DB] Removed all listeners${event ? ` for ${event.toString()}` : ''}`);
    return this;
  }
}

// Create a real database pool
const createRealPool = () => {
  return new Pool({
    connectionString: databaseConfig.url,
    max: databaseConfig.pool?.max || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: databaseConfig.ssl
  });
};

// Create a singleton database instance
let poolInstance: PoolType | null = null;

// Maximum number of connection retries
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Wraps a PoolClient to match our DatabaseClient interface
 */
function wrapPoolClient(client: PoolClient): ExtendedPoolClient {
  const extendedClient = client as ExtendedPoolClient;
  
  // Ensure the release method is properly typed
  const originalRelease = client.release.bind(client);
  extendedClient.release = (err?: Error | boolean) => {
    if (err instanceof Error) {
      console.error('Releasing client with error:', err.message);
    }
    originalRelease(err);
  };
  
  return extendedClient;
}

/**
 * Creates a new database pool with retry logic
 */
async function createPoolWithRetry(attempt = 1): Promise<Pool> {
  try {
    const pool = new Pool({
      connectionString: databaseConfig.url,
      max: databaseConfig.pool?.max || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: databaseConfig.ssl
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    console.log('✅ Database connection established successfully');
    return pool;
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      console.error('❌ Failed to connect to database after multiple attempts:', error);
      throw error;
    }
    
    console.warn(`⚠️  Database connection attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return createPoolWithRetry(attempt + 1);
  }
}

/**
 * Gets or creates the database pool instance
 */
async function getPool(): Promise<DatabasePool> {
  if (!poolInstance) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔹 Using mock database for development');
      poolInstance = new MockPool() as unknown as PoolType;
    } else {
      console.log('🔹 Connecting to production database...');
      const pgPool = await createPoolWithRetry();
      
      poolInstance = {
        _pool: pgPool,
        query: pgPool.query.bind(pgPool) as QueryFunction,
        connect: async () => {
          try {
            const client = await pgPool.connect();
            return wrapPoolClient(client);
          } catch (error) {
            console.error('Failed to get database client:', error);
            throw error;
          }
        },
        end: async () => {
          if (pgPool) {
            await pgPool.end();
            poolInstance = null;
          }
        },
        on: (event: string, listener: (...args: any[]) => void) => {
          pgPool.on(event as any, listener);
          return poolInstance!;
        },
        removeListener: (event: string, listener: (...args: any[]) => void) => {
          pgPool.removeListener(event as any, listener);
          return poolInstance!;
        },
        removeAllListeners: (event?: string | symbol) => {
          if (event) {
            pgPool.removeAllListeners(event as any);
          } else {
            pgPool.removeAllListeners();
          }
          return poolInstance!;
        }
      };
    }
    
    // Set up error handling
    poolInstance.on('error', (err: Error) => {
      console.error('Unexpected error on database client:', err);
    });
  }
  
  return poolInstance as DatabasePool;
}

// Public API
export const pool = {
  /**
   * Execute a database query
   */
  query: async <T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> => {
    const pool = await getPool();
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error('Query failed:', { query: text, params, error });
      throw error;
    }
  },
  
  /**
   * Get a database client from the pool
   */
  connect: async (): Promise<DatabaseClient> => {
    const pool = await getPool();
    try {
      const client = await pool.connect();
      // Add a small delay to ensure connection is ready
      await new Promise(resolve => setTimeout(resolve, 50));
      return client;
    } catch (error) {
      console.error('Failed to get database client:', error);
      throw error;
    }
  },
  
  /**
   * Close the database pool
   */
  end: async (): Promise<void> => {
    if (poolInstance) {
      try {
        await poolInstance.end();
        console.log('Database pool closed successfully');
      } catch (error) {
        console.error('Error closing database pool:', error);
        throw error;
      } finally {
        poolInstance = null;
      }
    }
  },
  
  /**
   * Check if the database is healthy
   */
  healthCheck: async (): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      message: string;
      error?: any;
      timestamp: string;
    };
  }> => {
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        details: {
          message: 'Database is responding normally',
          timestamp: new Date().toISOString(),
          responseTime: `${duration}ms`
        }
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          message: 'Database is not responding',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }
      };
    }
  },
  
  /**
   * Get pool statistics (if available)
   */
  getStats: () => {
    if (!poolInstance || !('_pool' in poolInstance) || !poolInstance._pool) {
      return null;
    }
    
    const pool = poolInstance._pool as any;
    return {
      total: pool.totalCount || 0,
      idle: pool.idleCount || 0,
      waiting: pool.waitingCount || 0,
    };
  }
};

// Initialize the database connection when this module is loaded
(async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔹 Initializing development database...');
      await pool.connect();
      console.log('✅ Development database initialized');
    } else {
      // In production, just test the connection
      console.log('🔹 Testing production database connection...');
      const health = await pool.healthCheck();
      console.log(`✅ Database connection ${health.status}: ${health.details.message}`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    // Don't throw here to allow the application to start
    // The first actual query will fail if there are connection issues
  }
})();

// Ensure we clean up connections on process exit
process.on('SIGINT', async () => {
  console.log('\n🔴 Received SIGINT. Closing database connections...');
  try {
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('🛑 Uncaught exception:', error);
  try {
    await pool.end();
  } catch (e) {
    console.error('Error closing database connections during uncaught exception:', e);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

    // In production, test the real connection
    console.log('🔹 Testing database connection...');
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('✅ Database connection successful');
    } finally {
      client.release();
    }

  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW()');
      console.log('✅ Database connection established at:', res.rows[0].now);
    } finally {
      client.release();
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Database connection failed:', errorMessage);
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Only initialize in non-test environments
if (process.env.NODE_ENV !== 'test') {
  initializeDatabase();
}

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle database client', err.message);
});

/**
 * Executes a function within a database transaction
 * @param callback - Function that receives a client and returns a Promise
 */
export async function withClient<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Export the pool and utility functions
export { pool };
