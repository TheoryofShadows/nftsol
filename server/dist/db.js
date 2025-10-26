"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.checkDatabaseHealth = exports.closeDatabase = exports.initializeDatabase = void 0;
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const schema = __importStar(require("./schema"));
// Connection state management
let postgresClient = null;
let dbInstance = null;
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
        onnotice: () => { }, // Suppress notices
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
const initializeDatabase = async () => {
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
        postgresClient = (0, postgres_1.default)(connectionString, config);
        // Test the connection with a simple query
        await postgresClient `SELECT 1`;
        // Initialize drizzle with the client
        dbInstance = (0, postgres_js_1.drizzle)(postgresClient, { schema });
        console.log('✅ Database connection established with connection pooling');
        // Handle connection errors - postgres.js doesn't have listen method
        // Errors are handled at the query level
    }
    catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown connection error');
        console.error('❌ Database connection failed:', err.message);
        postgresClient = null;
        dbInstance = null;
        throw err;
    }
    finally {
        isInitializing = false;
    }
};
exports.initializeDatabase = initializeDatabase;
// Handle connection errors and attempt reconnection
const handleConnectionError = async (err) => {
    console.log('🔧 Attempting to recover from database connection error...');
    try {
        // Close existing connection if it exists
        await (0, exports.closeDatabase)();
        // Wait before reconnecting to avoid hammering the database
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Attempt to reconnect
        await (0, exports.initializeDatabase)();
        console.log('✅ Database reconnection successful');
    }
    catch (reconnectError) {
        console.error('❌ Database reconnection failed:', reconnectError);
    }
};
// Close database connection
const closeDatabase = async () => {
    if (postgresClient) {
        try {
            await postgresClient.end({ timeout: 5 });
            console.log('✅ Database connection closed');
        }
        catch (error) {
            console.error('❌ Error closing database connection:', error);
        }
        finally {
            postgresClient = null;
            dbInstance = null;
        }
    }
};
exports.closeDatabase = closeDatabase;
// Check database connection health
const checkDatabaseHealth = async () => {
    if (!postgresClient || !dbInstance) {
        return { healthy: false, error: 'Database client not initialized' };
    }
    try {
        // Execute a simple query to verify the connection is alive
        // Use a short timeout to avoid blocking health checks
        await Promise.race([
            postgresClient `SELECT 1`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 3000))
        ]);
        return { healthy: true };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Database health check failed';
        // Don't store transient errors, just report them
        // The reconnection will happen in the background
        return { healthy: false, error: errorMessage };
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
// Initialize on module load
(0, exports.initializeDatabase)().catch(err => {
    console.error('Failed to initialize database:', err);
});
// Export db instance - simple pass-through
// Error handling is done at the application level
exports.db = dbInstance || {};
// Graceful shutdown handler
if (typeof process !== 'undefined') {
    process.on('SIGINT', async () => {
        console.log('Closing database connection...');
        await (0, exports.closeDatabase)();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        console.log('Closing database connection...');
        await (0, exports.closeDatabase)();
        process.exit(0);
    });
}
