import type { RequestHandler } from 'express';
import * as authService from '../services/auth.service';
import * as usersService from '../services/users.service';
import { getAuthUser } from '../middleware/requireAuth';
import { AppError } from '../utils/AppError';
import { loginBodySchema, registerBodySchema } from '../schemas/auth.schema';

// Controllers: validate the input, call the service, send the response.
// No SQL, no business rules. Invalid input throws a ZodError -> errorHandler -> 400.

// POST /api/auth/register
export const register: RequestHandler = async (req, res) => {
  const { email, password } = registerBodySchema.parse(req.body);
  const result = await authService.register(email, password);
  res.status(201).json({ data: result });
};

// POST /api/auth/login
export const login: RequestHandler = async (req, res) => {
  const { email, password } = loginBodySchema.parse(req.body);
  const result = await authService.login(email, password);
  res.json({ data: result });
};

// GET /api/auth/me
export const getMe: RequestHandler = async (_req, res) => {
  const user = await usersService.getUserById(getAuthUser(res).id);
  // Valid token, but the account was deleted since it was issued.
  if (!user) throw AppError.unauthorized('User no longer exists');
  res.json({ data: user });
};
