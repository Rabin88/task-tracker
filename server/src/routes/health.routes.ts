import { Router } from 'express';
import { query } from '../db/pool';

export const healthRouter = Router();

// GET /api/health - confirms the API is up and can reach the database.
// Useful for Render health checks and for waking the free instance before a demo.
healthRouter.get('/', async (_req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
});
