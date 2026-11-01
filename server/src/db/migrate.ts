import fs from 'node:fs';
import path from 'node:path';
import { pool } from './pool';
import { logger } from '../utils/logger';

// Minimal migration runner for plain .sql files.
// - Files in /migrations run in filename order (001_, 002_, ...).
// - Each applied file is recorded in schema_migrations, so it never runs twice.
// - Each file runs inside a transaction: it either fully applies or not at all.
//
// Works from both src/db (tsx) and dist/db (compiled): both are two levels below server/.
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query<{ filename: string }>('SELECT filename FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.filename));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      logger.info(`Applying ${file}...`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
      }
    }

    logger.info(count === 0 ? 'Database is up to date.' : `Applied ${count} migration(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
