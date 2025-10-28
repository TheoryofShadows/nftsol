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
          rows: [{
            available_lamports: 1000000000, // 1 SOL in lamports
            pending_withdrawal_lamports: 0
          }]
        };
      }
      
      if (text.includes('INSERT INTO withdrawals')) {
        return {
          rowCount: 1,
          rows: [{
            id: 'mock-withdrawal-id-123',
            created_at: new Date().toISOString()
          }]
        };
      }
      
      if (text.includes('UPDATE wallets SET available_lamports')) {
        return { rowCount: 1, rows: [] };
      }
      
      return { rowCount: 0, rows: [] };
    },
    connect: async () => ({
      query: pool.query,
      release: () => {}
    })
  } as any;
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
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
