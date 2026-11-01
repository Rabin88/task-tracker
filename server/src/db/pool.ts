import { Pool, type QueryResultRow } from 'pg';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// A single shared connection pool for the whole app.
// SSL settings come from the connection string (Neon uses ?sslmode=require).
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  // Fail fast instead of hanging if the database is down or every connection is busy.
  // 5s leaves room for a Neon cold start (usually well under a second).
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  // An idle client errored (e.g. Neon suspended the compute). The pool
  // replaces it on the next query, so log it rather than crash.
  logger.error({ err }, 'Unexpected Postgres pool error');
});

// Thin helper so services can write: query<Task>('SELECT ...', [id])
export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}
