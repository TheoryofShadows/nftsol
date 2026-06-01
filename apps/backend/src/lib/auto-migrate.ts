/**
 * Auto-migration runner — applies pending SQL migrations on server startup.
 *
 * The legacy `routes/migrations.ts` endpoint requires admin auth and was never
 * triggered in production, so the marketplace tables defined by
 * `004_marketplace_tables.sql` never existed and `GET /api/marketplace/listings`
 * returned 500. Running pending migrations at startup ensures the schema is
 * always in sync with the deployed code.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve, sep, normalize } from 'path';
import { pool } from './db';

export interface MigrationDef {
  name: string;
  file: string;
  description: string;
}

export const MIGRATIONS: MigrationDef[] = [
  {
    name: 'base_tables',
    file: '001_base_tables.sql',
    description: 'Creates core nfts and wallets tables',
  },
  {
    name: 'marketplace_tables',
    file: '004_marketplace_tables.sql',
    description: 'Creates nft_listings, nft_sales and marketplace columns on nfts',
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
  {
    name: 'echo_layers',
    file: '006_echo_layers.sql',
    description: 'Creates echo_layers table for persistent Eternal Echoes layers',
  },
];

function safeResolve(baseDir: string, file: string): string {
  const fullPath = resolve(baseDir, file);
  const baseResolved = resolve(baseDir);
  if (!fullPath.startsWith(baseResolved + sep) && fullPath !== baseResolved) {
    throw new Error('Invalid migration path');
  }
  if (normalize(file).includes('..')) {
    throw new Error('Invalid migration path');
  }
  return fullPath;
}

async function ensureTracker(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function getApplied(): Promise<Set<string>> {
  const result = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  return new Set(result.rows.map(r => r.name));
}

function findMigrationsDir(): string | null {
  const candidates = [
    join(process.cwd(), 'migrations'),
    join(__dirname, '..', '..', 'migrations'),
    join(__dirname, '..', 'migrations'),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return null;
}

export async function runPendingMigrations(): Promise<void> {
  const migrationsDir = findMigrationsDir();
  if (!migrationsDir) {
    process.stderr.write('[migrate] migrations directory not found — skipping\n');
    return;
  }

  await ensureTracker();
  const applied = await getApplied();
  const pending = MIGRATIONS.filter(m => !applied.has(m.name));

  if (pending.length === 0) {
    process.stdout.write('[migrate] schema up to date\n');
    return;
  }

  process.stdout.write(`[migrate] applying ${pending.length} pending migration(s)\n`);

  for (const migration of pending) {
    const path = safeResolve(migrationsDir, migration.file);
    if (!existsSync(path)) {
      process.stderr.write(`[migrate] missing file ${migration.file} — skipping\n`);
      continue;
    }
    const sql = readFileSync(path, 'utf-8');
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
      process.stdout.write(`[migrate] ✓ ${migration.name}\n`);
    } catch (error) {
      await client.query('ROLLBACK');
      const msg = error instanceof Error ? error.message : String(error);
      process.stderr.write(`[migrate] ✗ ${migration.name}: ${msg}\n`);
    } finally {
      client.release();
    }
  }
}
