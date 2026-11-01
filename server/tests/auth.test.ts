import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { requireAuth, getAuthUser } from '../src/middleware/requireAuth';
import { errorHandler } from '../src/middleware/errorHandler';

// None of these tests reach the database: they cover validation and token checks.
const app = createApp();

const USER_ID = '8e811c53-ccf0-4990-bbce-b999b68fb655';
const sign = (options: jwt.SignOptions, secret = env.JWT_SECRET) =>
  jwt.sign({}, secret, { subject: USER_ID, algorithm: 'HS256', ...options });

describe('POST /api/auth/register validation', () => {
  it('rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'longenough' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'email', message: 'Invalid email address' }]);
  });

  it('rejects a short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'password', message: 'Password must be at least 8 characters' }]);
  });
});

describe('POST /api/auth/login validation', () => {
  it('requires a password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('password');
  });
});

describe('protected routes', () => {
  it('GET /api/tasks without a token is 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: 'Authentication required' } });
  });

  it('GET /api/auth/me without a token is 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('requireAuth', () => {
  const protectedApp = express();
  protectedApp.get('/private', requireAuth, (_req, res) => {
    res.json({ userId: getAuthUser(res).id });
  });
  protectedApp.use(errorHandler);

  it('accepts a valid token and exposes the user id', async () => {
    const res = await request(protectedApp).get('/private').set('Authorization', `Bearer ${sign({ expiresIn: '1h' })}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: USER_ID });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('rejects a token signed with a different secret', async () => {
    const token = sign({ expiresIn: '1h' }, 'some-other-secret-value');
    const res = await request(protectedApp).get('/private').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid or expired token');
  });

  it('rejects an expired token', async () => {
    const res = await request(protectedApp).get('/private').set('Authorization', `Bearer ${sign({ expiresIn: -10 })}`);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid or expired token');
  });

  it('rejects a header without the Bearer prefix', async () => {
    const res = await request(protectedApp).get('/private').set('Authorization', sign({ expiresIn: '1h' }));
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Authentication required');
  });
});

describe('request body', () => {
  it('explains when the body is missing', async () => {
    const res = await request(app).post('/api/auth/login');
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'body', message: 'Request body must be a JSON object' }]);
  });
});
