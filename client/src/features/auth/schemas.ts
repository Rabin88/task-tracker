import { z } from 'zod';

// Same rules and messages as server/src/schemas/auth.schema.ts, so the user sees
// the error before submitting. The server still checks everything again.

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .pipe(z.email('Invalid email address').max(254, 'Email must be at most 254 characters'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(72, 'Password must be at most 72 characters'),
});

// Register also asks for the password twice. Only the client checks that.
export const registerSchema = z
  .object({
    email,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
