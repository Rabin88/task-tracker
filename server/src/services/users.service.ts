import { query } from '../db/pool';

// Users logic + SQL. Knows nothing about HTTP (req/res).

// Public shape of a user. The password column is never selected, so it can't leak.
export type User = {
  id: string;
  email: string;
  created_at: Date;
};

export async function getUserById(id: string) {
  const { rows } = await query<User>('SELECT id, email, created_at FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}
