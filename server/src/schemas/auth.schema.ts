import { z } from 'zod';

// Request schemas for /api/auth. Controllers call schema.parse(req.body).

const bodyError = { error: 'Request body must be a JSON object' };

// Emails are trimmed and lowercased so "Bob@X.com " and "bob@x.com" are the same account.
const email = z.string({ error: 'Email is required' }).trim().toLowerCase().pipe(z.email('Invalid email address').max(254));

export const registerBodySchema = z.object(
  {
    email,
    // bcrypt only uses the first 72 bytes of a password, so cap it there.
    password: z
      .string({ error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
  },
  bodyError,
);

// No minimum length on login: just check it was sent.
export const loginBodySchema = z.object(
  {
    email,
    password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(72),
  },
  bodyError,
);
