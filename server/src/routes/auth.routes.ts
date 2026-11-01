import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import * as authController from '../controllers/auth.controller';

// Mounted at /api/auth in app.ts, so paths here are relative to that.
export const authRouter = Router();

authRouter.post('/register', authController.register); // POST /api/auth/register
authRouter.post('/login', authController.login); // POST /api/auth/login
authRouter.get('/me', requireAuth, authController.getMe); // GET /api/auth/me
