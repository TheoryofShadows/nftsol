import { Pool, QueryResult, QueryResultRow } from 'pg';
import { databaseConfig } from '../config/index';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('dbOptimized');

const pool = new Pool({
  connectionString: databaseConfig.url,
  ssl: databaseConfig.ssl,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => log.info('✅ Database connection pool established'))
  .catch(err => log.error('❌ Database connection failed:', { message: err?.message }));

// Helper function for transactions
export const withTransaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

// Helper function for queries
export const query = async <T extends QueryResultRow>(
  text: string,
  params?: any[],
  client?: any
): Promise<QueryResult<T>> => {
  try {
    if (client) {
      const result = await client.query(text, params);
      return result as QueryResult<T>;
    } else {
      const result = await pool.query(text, params);
      return result as QueryResult<T>;
    }
  } catch (error) {
    log.error('Database query error:', { query: text, error });
    throw error;
  }
};

export { pool };
