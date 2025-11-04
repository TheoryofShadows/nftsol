// src/lib/db.ts
import { Pool } from 'pg';

// Mock database for testing
const isTestMode = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

let pool: Pool;

if (isTestMode) {
  // Mock pool for testing
  pool = {
    query: async (text: string, params?: any[]) => {
      console.log('Mock DB Query:', text, params);

      // Mock responses for withdrawal testing
      if (text.includes('SELECT available_lamports')) {
        return {
          rowCount: 1,
          rows: [
            {
              available_lamports: 1000000000, // 1 SOL in lamports
              pending_withdrawal_lamports: 0,
            },
          ],
        };
      }

      if (text.includes('INSERT INTO withdrawals')) {
        return {
          rowCount: 1,
          rows: [
            {
              id: 'mock-withdrawal-id-123',
              created_at: new Date().toISOString(),
            },
          ],
        };
      }

      if (text.includes('UPDATE wallets SET available_lamports')) {
        return { rowCount: 1, rows: [] };
      }

      return { rowCount: 0, rows: [] };
    },
    connect: async () => ({
      query: pool.query,
      release: () => {},
    }),
  } as any;
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' +
        'Please set it in your .env file or environment variables.'
    );
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Connection pool configuration
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection cannot be established
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false // Accept Render's SSL certificate
    } : undefined,
  });

  // Handle connection errors
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
    // Don't exit process - let the app continue and retry
  });

  // Test connection on startup
  pool
    .query('SELECT NOW()')
    .then(() => {
      console.log('Database connection established');
    })
    .catch((err) => {
      console.error('Database connection failed:', err.message);
      console.error('Please check your DATABASE_URL environment variable');
    });
}

export { pool };

export async function withClient<T>(fn: (client: any) => Promise<T>) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
