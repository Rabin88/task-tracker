import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';

// Runs when no route matched.
export const notFound: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
