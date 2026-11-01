import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { updateTaskBodySchema } from '../src/schemas/tasks.schema';

// These tests cover validation only: every request is rejected before reaching the database.
const app = createApp();
const token = jwt.sign({}, env.JWT_SECRET, {
  subject: '8e811c53-ccf0-4990-bbce-b999b68fb655',
  expiresIn: '1h',
  algorithm: 'HS256',
});
const auth = { Authorization: `Bearer ${token}` };
const TASK_ID = '64290ae7-18ed-49b4-abe9-f0b0899c77cc';

describe('POST /api/tasks validation', () => {
  it('requires a title', async () => {
    const res = await request(app).post('/api/tasks').set(auth).send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'title', message: 'Title is required' }]);
  });

  it('rejects an unknown status', async () => {
    const res = await request(app).post('/api/tasks').set(auth).send({ title: 'Write tests', status: 'later' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'status', message: 'Status must be todo, in_progress or done' }]);
  });

  it('needs a logged-in user', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Write tests' });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/tasks/:id validation', () => {
  it('rejects an empty update', async () => {
    const res = await request(app).patch(`/api/tasks/${TASK_ID}`).set(auth).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'body', message: 'Provide at least one field to update' }]);
  });

  it('rejects an invalid task id', async () => {
    const res = await request(app).patch('/api/tasks/not-a-uuid').set(auth).send({ title: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'id', message: 'Invalid task id' }]);
  });

  it('only contains the fields that were sent', () => {
    // Important: missing fields must not appear, or the update would overwrite them.
    expect(updateTaskBodySchema.parse({ status: 'done' })).toEqual({ status: 'done' });
  });
});

describe('DELETE /api/tasks/:id validation', () => {
  it('rejects an invalid task id', async () => {
    const res = await request(app).delete('/api/tasks/123').set(auth);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/tasks filters and sorting validation', () => {
  it('rejects an unknown status filter', async () => {
    const res = await request(app).get('/api/tasks?status=later').set(auth);
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('status');
  });

  it('rejects sorting by a column that is not allowed', async () => {
    // Anything outside the list never reaches the SQL.
    const res = await request(app).get('/api/tasks?sort=password').set(auth);
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { field: 'sort', message: 'Sort must be created_at, updated_at, title or status' },
    ]);
  });

  it('rejects an unknown order', async () => {
    const res = await request(app).get('/api/tasks?order=up').set(auth);
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('order');
  });
});
