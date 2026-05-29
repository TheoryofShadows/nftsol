/**
 * Eternal Echoes persistence layer.
 *
 * Echoes were previously kept in a module-level `Map`, so every layer a user
 * contributed was lost when the server restarted. This store persists them to
 * the `echo_layers` Postgres table (migration 006) when a database is
 * configured, and transparently falls back to an in-memory map for local
 * development where no `DATABASE_URL` is set — preserving the prior dev
 * behaviour without losing data in production.
 */

import { pool } from '../lib/db';
import logger from '../utils/logger';

export type EchoType = 'Text' | 'Audio' | 'Annotation' | 'Video';

export interface EchoRow {
  id: string;
  ledgerId: string;
  echoData: string;
  echoType: EchoType;
  videoUri?: string;
  dataHash: number[];
  contributor: string;
  grokVerified: boolean;
  verificationScore: number;
  timestamp: Date;
}

// Persist to Postgres only when a database is actually configured. Local dev
// runs without one, in which case we keep the historical in-memory behaviour.
const persistent = Boolean(process.env.DATABASE_URL);

// In-memory fallback (dev / no DATABASE_URL).
const memory: Map<string, EchoRow[]> = new Map();

function mapRow(r: Record<string, any>): EchoRow {
  return {
    id: r.id,
    ledgerId: r.ledger_id,
    echoData: r.echo_data,
    echoType: r.echo_type as EchoType,
    videoUri: r.video_uri ?? undefined,
    dataHash: Array.isArray(r.data_hash)
      ? r.data_hash
      : JSON.parse(r.data_hash || '[]'),
    contributor: r.contributor,
    grokVerified: r.grok_verified,
    verificationScore: r.verification_score,
    timestamp: new Date(r.created_at),
  };
}

export const echoStore = {
  /** True when layers are persisted to Postgres rather than memory. */
  isPersistent(): boolean {
    return persistent;
  },

  /** Insert a single echo layer. */
  async insert(row: EchoRow): Promise<void> {
    if (persistent) {
      await pool.query(
        `INSERT INTO echo_layers
           (id, ledger_id, echo_data, echo_type, video_uri, data_hash,
            contributor, grok_verified, verification_score, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.ledgerId,
          row.echoData,
          row.echoType,
          row.videoUri ?? null,
          JSON.stringify(row.dataHash),
          row.contributor,
          row.grokVerified,
          row.verificationScore,
          row.timestamp,
        ],
      );
      return;
    }
    const list = memory.get(row.ledgerId) || [];
    list.push(row);
    memory.set(row.ledgerId, list);
  },

  /** All layers for a ledger, oldest first. */
  async getByLedger(ledgerId: string): Promise<EchoRow[]> {
    if (persistent) {
      const result = await pool.query(
        `SELECT * FROM echo_layers WHERE ledger_id = $1 ORDER BY created_at ASC`,
        [ledgerId],
      );
      return result.rows.map(mapRow);
    }
    return [...(memory.get(ledgerId) || [])].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  },

  /** Every layer across all ledgers. */
  async all(): Promise<EchoRow[]> {
    if (persistent) {
      const result = await pool.query(
        `SELECT * FROM echo_layers ORDER BY created_at ASC`,
      );
      return result.rows.map(mapRow);
    }
    return Array.from(memory.values()).flat();
  },

  /** Number of distinct ledgers. */
  async ledgerCount(): Promise<number> {
    if (persistent) {
      const result = await pool.query<{ n: number }>(
        `SELECT COUNT(DISTINCT ledger_id)::int AS n FROM echo_layers`,
      );
      return result.rows[0]?.n ?? 0;
    }
    return memory.size;
  },

  /** Find a layer by its id or by ledger id (oldest layer of that ledger). */
  async findById(idOrLedger: string): Promise<EchoRow | null> {
    if (persistent) {
      const result = await pool.query(
        `SELECT * FROM echo_layers
         WHERE id = $1 OR ledger_id = $1
         ORDER BY created_at ASC
         LIMIT 1`,
        [idOrLedger],
      );
      return result.rows[0] ? mapRow(result.rows[0]) : null;
    }
    for (const echoes of memory.values()) {
      const echo = echoes.find((e) => e.id === idOrLedger || e.ledgerId === idOrLedger);
      if (echo) return echo;
    }
    return null;
  },
};

logger.info(
  `[EchoStore] Initialized (${persistent ? 'postgres' : 'in-memory fallback'})`,
);
