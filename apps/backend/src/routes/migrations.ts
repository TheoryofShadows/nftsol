/**
 * Database Migration Runner
 * Admin-only endpoint to run database migrations
 */

import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join, normalize, resolve, sep } from 'path';
import jwt from 'jsonwebtoken';
import { pool } from '../lib/db';
import { ApiResponse } from '../types';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('migrations');

/**
 * Validate migration file path to prevent directory traversal attacks
 * Ensures the resolved path is within the migrations directory
 */
function validateMigrationPath(baseDir: string, filePath: string): string {
  // Normalize and resolve the full path
  const fullPath = resolve(baseDir, filePath);
  const baseDirResolved = resolve(baseDir);

  // Ensure the path is within the migrations directory
  if (!fullPath.startsWith(baseDirResolved + sep) && fullPath !== baseDirResolved) {
    throw new Error(`Invalid migration path: path traversal detected`);
  }

  // Ensure no ../ sequences remain after normalization
  if (normalize(filePath).includes('..')) {
    throw new Error(`Invalid migration path: contains parent directory references`);
  }

  return fullPath;
}

// Authentication middleware (inline to avoid circular dependency)
const authenticate = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      const response: ApiResponse = {
        success: false,
        error: 'Access token required',
        code: 'NOT_AUTHENTICATED',
      };
      return res.status(401).json(response);
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const response: ApiResponse = {
        success: false,
        error: 'Server auth not configured',
        code: 'AUTH_MISCONFIGURED',
      };
      return res.status(500).json(response);
    }
    const decoded: any = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (_err) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    };
    return res.status(403).json(response);
  }
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !(req.user.isAdmin || req.user.role === 'admin')) {
    const response: ApiResponse = {
      success: false,
      error: 'Admin access required',
      code: 'FORBIDDEN',
    };
    return res.status(403).json(response);
  }
  next();
};

const router = Router();

interface Migration {
  name: string;
  file: string;
  description: string;
}

const MIGRATIONS: Migration[] = [
  {
    name: 'marketplace_tables',
    file: '004_marketplace_tables.sql',
    description: 'Creates marketplace tables (nft_listings, nft_sales) and adds marketplace columns to nfts table',
  },
  {
    name: 'performance_indexes',
    file: '005_add_performance_indexes.sql',
    description: 'Adds performance indexes for NFT queries',
  },
  {
    name: 'withdrawals',
    file: '20251028_add_withdrawals.sql',
    description: 'Creates withdrawals table and adds wallet columns',
  },
];

/**
 * GET /api/admin/migrations
 * List all available migrations
 */
router.get('/', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    // Check which migrations have been run
    const appliedMigrations = await getAppliedMigrations();

    const migrations = MIGRATIONS.map(migration => ({
      ...migration,
      applied: appliedMigrations.includes(migration.name),
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        migrations,
        total: migrations.length,
        applied: migrations.filter(m => m.applied).length,
        pending: migrations.filter(m => !m.applied).length,
      },
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list migrations',
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/admin/migrations/:name
 * Run a specific migration
 */
router.post('/:name', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const migration = MIGRATIONS.find(m => m.name === name);

    if (!migration) {
      const response: ApiResponse = {
        success: false,
        error: `Migration "${name}" not found`,
        code: 'MIGRATION_NOT_FOUND',
      };
      return res.status(404).json(response);
    }

    // Check if already applied
    const appliedMigrations = await getAppliedMigrations();
    if (appliedMigrations.includes(migration.name)) {
      const response: ApiResponse = {
        success: true,
        data: {
          message: `Migration "${name}" already applied`,
          migration: migration.name,
        },
      };
      return res.json(response);
    }

    // Read migration file (with path traversal protection)
    let migrationPath: string;
    let sql: string;
    try {
      const migrationsDir = join(process.cwd(), 'migrations');
      migrationPath = validateMigrationPath(migrationsDir, migration.file);
      sql = readFileSync(migrationPath, 'utf-8');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const response: ApiResponse = {
        success: false,
        error: `Failed to read migration file: ${errorMsg}`,
        code: 'FILE_ERROR',
      };
      return res.status(400).json(response);
    }

    // Run migration in transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Execute migration SQL
      await client.query(sql);

      // Record migration
      await client.query(
        `INSERT INTO schema_migrations (name, applied_at) 
         VALUES ($1, NOW()) 
         ON CONFLICT (name) DO NOTHING`,
        [migration.name]
      );

      await client.query('COMMIT');

      const response: ApiResponse = {
        success: true,
        data: {
          message: `Migration "${name}" applied successfully`,
          migration: migration.name,
        },
      };
      res.json(response);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
      code: 'MIGRATION_FAILED',
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/admin/migrations/run-all
 * Run all pending migrations
 */
router.post('/run-all', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const appliedMigrations = await getAppliedMigrations();
    const pendingMigrations = MIGRATIONS.filter(m => !appliedMigrations.includes(m.name));

    if (pendingMigrations.length === 0) {
      const response: ApiResponse = {
        success: true,
        data: {
          message: 'All migrations already applied',
          applied: 0,
        },
      };
      return res.json(response);
    }

    type MigrationResult = { migration: string; status: 'success' | 'failed'; error?: string };
    const results: MigrationResult[] = [];
    const migrationsDir = join(process.cwd(), 'migrations');

    for (const migration of pendingMigrations) {
      try {
        const migrationPath = validateMigrationPath(migrationsDir, migration.file);
        const sql = readFileSync(migrationPath, 'utf-8');

        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query(
            `INSERT INTO schema_migrations (name, applied_at) 
             VALUES ($1, NOW()) 
             ON CONFLICT (name) DO NOTHING`,
            [migration.name]
          );
          await client.query('COMMIT');
          results.push({ migration: migration.name, status: 'success' });
        } catch (error) {
          await client.query('ROLLBACK');
          results.push({
            migration: migration.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        } finally {
          client.release();
        }
      } catch (error) {
        results.push({
          migration: migration.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        message: `Ran ${pendingMigrations.length} migrations`,
        results,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
      },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run migrations',
      code: 'MIGRATION_FAILED',
    };
    res.status(500).json(response);
  }
});

async function getAppliedMigrations(): Promise<string[]> {
  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await pool.query('SELECT name FROM schema_migrations');
    return result.rows.map(row => row.name);
  } catch (error) {
    log.error('Failed to get applied migrations:', error);
    return [];
  }
}

export default router;

