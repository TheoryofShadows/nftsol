/**
 * Optimized database connection with connection pooling, query optimization, and prepared statements
 */

import { Pool, QueryResult, QueryResultRow } from 'pg';
import { databaseConfig } from '../config';

// Enhanced connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool optimization
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN || '2', 10), // Minimum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout for connection attempts
  statement_timeout: 30000, // Query timeout (30 seconds)
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false, // Accept self-signed certificates
  } : false,
};

let pool: Pool;

// Initialize pool
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set - using mock database for development');
  // Create mock pool
  pool = {
    query: async () => ({ rows: [], rowCount: 0 }),
    connect: async () => ({ query: pool.query, release: () => {} }),
  } as any;
} else {
  pool = new Pool(poolConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
    // Don't exit - let app continue and retry
  });

  // Test connection on startup
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('Database connection pool established');
      console.log(`Pool config: min=${poolConfig.min}, max=${poolConfig.max}`);
    })
    .catch((err) => {
      console.error('Database connection failed:', err.message);
      console.error('Please check your DATABASE_URL environment variable');
    });
}

/**
 * Execute query with retry logic
 */
export async function queryWithRetry<T extends QueryResultRow = any>(
  text: string,
  params?: any[],
  retries = 2
): Promise<QueryResult<T>> {
  try {
    return await pool.query<T>(text, params);
  } catch (error: any) {
    // Retry on connection errors
    if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return queryWithRetry<T>(text, params, retries - 1);
    }
    throw error;
  }
}

/**
 * Execute transaction with automatic rollback on error
 */
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
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

/**
 * Get connection with automatic release
 */
export async function withClient<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Export pool
export { pool };
export default pool;

