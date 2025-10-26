import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy initialization - only connect when DATABASE_URL is provided
let dbInstance: ReturnType<typeof drizzle> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    // Lazy initialization
    if (!dbInstance) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString || connectionString.trim() === '') {
        console.warn('⚠️ DATABASE_URL not provided, database operations disabled');
        return () => Promise.resolve([]);
      }
      try {
        const client = postgres(connectionString);
        dbInstance = drizzle(client, { schema });
        console.log('✅ Database connection established');
      } catch (error) {
        console.error('❌ Database connection failed:', error);
        return () => Promise.resolve([]);
      }
    }
    return (dbInstance as any)[prop];
  }
});
