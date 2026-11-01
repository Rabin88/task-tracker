import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import type { User } from './users.service';

// Auth logic + SQL. This is the only file that reads or writes users.password.

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '1d';

// Used when the email doesn't exist, so a failed login takes the same time
// either way and can't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', SALT_ROUNDS);

export type AuthUser = { id: string };

export async function register(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const { rows } = await query<User>(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash],
    );
    const user = rows[0];
    return { user, token: signToken(user.id) };
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      throw AppError.conflict('Email is already registered');
    }
    throw err;
  }
}

export async function login(email: string, password: string) {
  const { rows } = await query<User & { password: string }>(
    // LOWER(email) matches the unique index, and finds users saved with capital letters.
    'SELECT id, email, created_at, password FROM users WHERE LOWER(email) = $1',
    [email],
  );
  const row = rows[0];
  const passwordMatches = await bcrypt.compare(password, row?.password ?? DUMMY_HASH);

  // Same message for "no such email" and "wrong password".
  if (!row || !passwordMatches) throw AppError.unauthorized('Invalid email or password');

  const user: User = { id: row.id, email: row.email, created_at: row.created_at };
  return { user, token: signToken(user.id) };
}

function signToken(userId: string) {
  return jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: TOKEN_EXPIRES_IN, algorithm: 'HS256' });
}

// Throws 401 for a missing, tampered or expired token.
export function verifyToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub) throw new Error('Token has no subject');
    return { id: payload.sub };
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
}
