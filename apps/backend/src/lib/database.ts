import logger from '../utils/logger';
import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { databaseConfig } from '../config/index';

// Types
type _QueryFunction = <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
) => Promise<QueryResult<T>>;

interface DatabaseClient extends PoolClient {
  release: (err?: Error | boolean) => void;
}

// Configuration
const poolConfig: PoolConfig = {
  connectionString: databaseConfig.url,
  max: 20, // databaseConfig.pool?.max is not available in the config
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: databaseConfig.ssl as any // Type assertion for SSL config
};

// Create the database pool
const pool = new Pool(poolConfig);

// Handle connection errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Health check
const healthCheck = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error };
  } finally {
    client.release();
  }
};

// Transaction helper
const withTransaction = async <T>(
  callback: (client: DatabaseClient) => Promise<T>
): Promise<T> => {
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
};

// Query helper
const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.info('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, params, error });
    throw error;
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down database pool...');
  await pool.end();
  logger.info('Database pool has been shut down');};

// Handle process termination
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { pool, query, withTransaction, healthCheck };
export type { DatabaseClient };
