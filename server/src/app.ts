import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { requireAuth } from './middleware/requireAuth';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { tasksRouter } from './routes/tasks.routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

// Builds the Express app without starting it, so tests can import it
// with Supertest and no real port is opened.
export function createApp() {
  const app = express();

  app.use(requestLogger); // first, so every request is logged (including 404s and errors)
  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  // Routes: each router is mounted at its resource prefix; paths inside are relative.
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', requireAuth, tasksRouter); // every task route needs a logged-in user

  app.use(notFound);
  app.use(errorHandler); // must be registered last

  return app;
}
