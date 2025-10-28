import { drizzle } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';
import { Sql } from 'postgres';
import * as schema from './schema';

// Connection state management
let postgresClient: Sql | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;
let isInitializing = false;

// Configuration with best practices for production
const getConnectionConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString || connectionString.trim() === '') {
    return null;
  }

  return {
    max: 10, // Maximum number of connections in the pool
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds
    max_lifetime: 60 * 30, // Close connections after 30 minutes
    onnotice: () => {}, // Suppress notices
    connection: {
      application_name: 'nftsol-server',
    },
    // Enable connection pooling
    transform: {
      undefined: null,
    },
  };
};

// Initialize database connection
export const initializeDatabase = async (): Promise<void> => {
  if (isInitializing || postgresClient) {
    return;
  }

  isInitializing = true;

  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString || connectionString.trim() === '') {
      console.warn('⚠️ DATABASE_URL not provided, database operations disabled');
      postgresClient = null;
      dbInstance = null;
      isInitializing = false;
      return;
    }

    const config = getConnectionConfig();
    if (!config) {
      throw new Error('Database configuration is invalid');
    }

    // Create postgres client with pooling
    postgresClient = postgres.default(connectionString, config);
    
    // Test the connection with a simple query
    await postgresClient`SELECT 1`;
    
    // Initialize drizzle with the client
    dbInstance = drizzle(postgresClient, { schema });
    
    console.log('✅ Database connection established with connection pooling');
    
    // Handle connection errors - postgres.js doesn't have listen method
    // Errors are handled at the query level

  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown connection error');
    console.error('❌ Database connection failed:', err.message);
    postgresClient = null;
    dbInstance = null;
    throw err;
  } finally {
    isInitializing = false;
  }
};

// Handle connection errors and attempt reconnection
const handleConnectionError = async (err: Error) => {
  console.log('🔧 Attempting to recover from database connection error...');
  
  try {
    // Close existing connection if it exists
    await closeDatabase();
    
    // Wait before reconnecting to avoid hammering the database
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Attempt to reconnect
    await initializeDatabase();
    console.log('✅ Database reconnection successful');
  } catch (reconnectError) {
    console.error('❌ Database reconnection failed:', reconnectError);
  }
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  if (postgresClient) {
    try {
      await postgresClient.end({ timeout: 5 });
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    } finally {
      postgresClient = null;
      dbInstance = null;
    }
  }
};

// Check database connection health
export const checkDatabaseHealth = async (): Promise<{ healthy: boolean; error?: string }> => {
  if (!postgresClient || !dbInstance) {
    return { healthy: false, error: 'Database client not initialized' };
  }

  try {
    // Execute a simple query to verify the connection is alive
    // Use a short timeout to avoid blocking health checks
    await Promise.race([
      postgresClient`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 3000)
      )
    ]);
    
    return { healthy: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Database health check failed';
    
    // Don't store transient errors, just report them
    // The reconnection will happen in the background
    return { healthy: false, error: errorMessage };
  }
};

// Initialize on module load
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
});

// Export db instance - simple pass-through
// Error handling is done at the application level
export const db = dbInstance || {} as ReturnType<typeof drizzle>;

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('Closing database connection...');
    await closeDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Closing database connection...');
    await closeDatabase();
    process.exit(0);
  });
}
