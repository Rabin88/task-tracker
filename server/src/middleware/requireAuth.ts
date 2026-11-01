import type { RequestHandler, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyToken, type AuthUser } from '../services/auth.service';

// Lets TypeScript know about res.locals.user.
declare global {
  namespace Express {
    interface Locals {
      user?: AuthUser;
    }
  }
}

// Protects a route: expects "Authorization: Bearer <token>".
// On success the logged-in user is available as res.locals.user.
export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  if (!token) throw AppError.unauthorized('Authentication required');

  res.locals.user = verifyToken(token);
  // Responses contain this user's private data: browsers must not cache them.
  res.set('Cache-Control', 'no-store');
  next();
};

// Use in controllers behind requireAuth to get the logged-in user.
export function getAuthUser(res: Response): AuthUser {
  const user = res.locals.user;
  if (!user) throw new Error('getAuthUser() called on a route without requireAuth');
  return user;
}
