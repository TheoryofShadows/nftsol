import { 
  Pool, 
  PoolClient, 
  QueryResult, 
  QueryResultRow, 
  PoolConfig, 
  ClientConfig, 
  QueryConfig, 
  QueryArrayConfig 
} from 'pg';
import { databaseConfig } from '../config/index';

/**
 * Types for our database operations
 */

// Use the full query function type from pg to ensure compatibility
type QueryFunction = {
  <T extends QueryResultRow = any>(
    queryTextOrConfig: string | QueryConfig,
    values?: any[]
  ): Promise<QueryResult<T>>;
  <T extends QueryResultRow = any, I extends any[] = any[]>(
    config: QueryArrayConfig<I>,
    values?: I
  ): Promise<QueryResult<T>>;
};

// DatabaseClient extends PoolClient with our custom methods
interface DatabaseClient extends Omit<PoolClient, 'query' | 'release'> {
  query: QueryFunction;
  release: (err?: Error | boolean) => void;
  // Add these methods to match PoolClient's event emitter interface
  on(event: 'drain', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'notice', listener: (notice: any) => void): this;
  on(event: 'notification', listener: (message: any) => void): this;
  on(event: 'end', listener: () => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
  
  removeListener(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string | symbol): this;
}

interface DatabasePool {
  query: QueryFunction;
  connect: () => Promise<ExtendedPoolClient>;
  end: () => Promise<void>;
  on: (event: string, listener: (...args: any[]) => void) => void;
  removeListener: (event: string, listener: (...args: any[]) => void) => void;
  removeAllListeners: (event?: string | symbol) => void;
  healthCheck: () => Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      message: string;
      error?: any;
      timestamp: string;
      responseTime?: string;
    };
  }>;
  getStats: () => {
    total: number;
    idle: number;
    waiting: number;
  } | null;
  _pool?: Pool; // Add this line to include the _pool property
}

// Extend the PoolClient interface to include our custom methods
interface ExtendedPoolClient extends PoolClient {}

// Helper type for the pool instance
type PoolType = DatabasePool & {
  _pool?: Pool;
};

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
  // Create a proxy that forwards all properties and methods to the original client
  // but ensures the return types match our DatabaseClient interface
  const handler: ProxyHandler<PoolClient> = {
    get(target: PoolClient, prop: string | symbol, receiver: any) {
      const value = Reflect.get(target, prop, receiver);
      
      // Handle special cases for methods we need to wrap
      if (prop === 'query') {
        return (text: string | QueryConfig, values?: any[]) => {
          return (target.query as any)(text, values);
        };
      }
      
      if (prop === 'release') {
        return (err?: Error | boolean) => target.release(err);
      }
      
      if (prop === 'on' || prop === 'addListener') {
        return (event: string, listener: (...args: any[]) => void) => {
          target.on(event as any, listener);
          return proxyClient;
        };
      }
      
      if (prop === 'removeListener') {
        return (event: string, listener: (...args: any[]) => void) => {
          target.removeListener(event as any, listener);
          return proxyClient;
        };
      }
      
      if (prop === 'removeAllListeners') {
        return (event?: string | symbol) => {
          if (event) {
            target.removeAllListeners(event);
          } else {
            target.removeAllListeners();
          }
          return proxyClient;
        };
      }
      
      // For all other properties/methods, return as is
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    },
  };
  
  const proxyClient = new Proxy(client, handler) as unknown as ExtendedPoolClient;
  return proxyClient;
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
        },
        healthCheck: async () => {
          const start = Date.now();
          try {
            await pgPool.query('SELECT 1');
            const duration = Date.now() - start;
            return {
              status: 'healthy' as const,
              details: {
                message: 'Database is responding normally',
                timestamp: new Date().toISOString(),
                responseTime: `${duration}ms`
              }
            };
          } catch (error) {
            return {
              status: 'unhealthy' as const,
              details: {
                message: 'Database connection failed',
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
              }
            };
          }
        },
        getStats: () => {
          if (!('totalCount' in pgPool)) return null;
          const pool = pgPool as any;
          return {
            total: pool.totalCount || 0,
            idle: pool.idleCount || 0,
            waiting: pool.waitingCount || 0
          };
        }
      };
    }
    
    // Set up error handling
    if (poolInstance) {
      poolInstance.on('error', (err: Error) => {
        console.error('Unexpected error on database client:', err);
      });
    }
  }
  
  return poolInstance as DatabasePool;
}

// Public API
export const pool: DatabasePool = {
  // Event emitter methods
  on: (event: string, listener: (...args: any[]) => void) => {
    getPool().then(p => p.on(event, listener));
    return pool;
  },
  removeListener: (event: string, listener: (...args: any[]) => void) => {
    getPool().then(p => p.removeListener(event, listener));
    return pool;
  },
  removeAllListeners: (event?: string | symbol) => {
    getPool().then(p => event ? p.removeAllListeners(event) : p.removeAllListeners());
    return pool;
  },
  /**
   * Execute a database query
   */
  query: async <T extends QueryResultRow = any>(
    queryTextOrConfig: string | QueryConfig,
    values?: any[]
  ): Promise<QueryResult<T>> => {
    const pool = await getPool();
    try {
      if (typeof queryTextOrConfig === 'string') {
        return await pool.query(queryTextOrConfig, values);
      } else {
        return await pool.query(queryTextOrConfig);
      }
    } catch (error) {
      console.error('Query failed:', { 
        query: typeof queryTextOrConfig === 'string' ? queryTextOrConfig : queryTextOrConfig.text,
        params: values || (typeof queryTextOrConfig === 'object' ? queryTextOrConfig.values : []),
        error 
      });
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
      responseTime?: string;
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
const initializeDatabase = async () => {
  if (process.env.NODE_ENV === 'test') return;
  
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
};

// Initialize the database
initializeDatabase().catch(console.error);

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
    const result = await callback(client as PoolClient);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
