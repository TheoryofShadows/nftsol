import { Pool, PoolClient, QueryResult, QueryResultRow, QueryConfig, } from 'pg';

// Create a simple mock pool that implements only what's needed for testing
const mockPool = {
  async query<R extends QueryResultRow = any, I extends any[] = any[]>(
    queryTextOrConfig: string | QueryConfig<I>,
    values?: I
  ): Promise<QueryResult<R>> {
    console.log('Mock DB Query:', queryTextOrConfig, values);
    return {
      command: 'SELECT',
      rowCount: 0,
      oid: 0,
      fields: [],
      rows: [] as R[],
    };
  },

  async connect(): Promise<PoolClient> {
    return {
      ...this,
      release: () => {},
      // Add other PoolClient methods as needed
    } as unknown as PoolClient;
  },

  async end(): Promise<void> {
    return Promise.resolve();
  },

  // Event emitter methods
  on: (_event: string, _listener: (...args: any[]) => void) => mockPool,
  once: (_event: string, _listener: (...args: any[]) => void) => mockPool,
  removeListener: (_event: string, _listener: (...args: any[]) => void) => mockPool,
  removeAllListeners: (_event?: string | symbol) => mockPool,
} as unknown as Pool;

export const pool = mockPool;
