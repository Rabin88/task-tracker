import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

// App-level behaviour that doesn't need a database.
const app = createApp();

describe('app', () => {
  it('returns 404 with a consistent error shape for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { message: 'Route GET /api/does-not-exist not found' },
    });
  });

  it('returns 400 for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"bad json');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Invalid JSON body');
  });
});
