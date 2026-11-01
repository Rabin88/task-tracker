import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { errorHandler } from '../src/middleware/errorHandler';
import { AppError } from '../src/utils/AppError';

// A tiny app with routes that throw each kind of error, so we can check
// exactly what the client receives. No database needed.
function buildApp() {
  const app = express();
  app.use(express.json({ limit: '1kb' }));
  app.get('/app-error', () => {
    throw AppError.notFound('Task not found');
  });
  app.get('/zod-error', () => {
    z.object({ title: z.string() }).parse({});
  });
  app.get('/unexpected', () => {
    throw new Error('duplicate key value violates unique constraint "users_email_unique"');
  });
  app.post('/echo', (req, res) => {
    res.json(req.body);
  });
  app.use(errorHandler);
  return app;
}

const app = buildApp();

describe('errorHandler', () => {
  it('sends AppError status and message', async () => {
    const res = await request(app).get('/app-error');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Task not found' } });
  });

  it('sends 400 with field details for Zod errors', async () => {
    const res = await request(app).get('/zod-error');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
    expect(res.body.error.details[0].field).toBe('title');
  });

  it('never leaks the message of an unexpected error', async () => {
    const res = await request(app).get('/unexpected');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { message: 'Internal server error' } });
  });

  it('sends 413 (not 500) for a body that is too large', async () => {
    const res = await request(app)
      .post('/echo')
      .send({ text: 'a'.repeat(2000) });
    expect(res.status).toBe(413);
    expect(res.body.error.message).toBe('request entity too large');
  });

  it('sends 415 (not 500) for an unsupported content encoding', async () => {
    const res = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .set('Content-Encoding', 'foo')
      .send('{}');
    expect(res.status).toBe(415);
  });
});
