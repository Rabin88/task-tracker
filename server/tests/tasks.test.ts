import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { updateTaskBodySchema } from '../src/schemas/tasks.schema';
import { orderByClause, toSearchPattern } from '../src/services/tasks.service';

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

  it('limits the description to 500 characters', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(auth)
      .send({ title: 'Write tests', description: 'a'.repeat(501) });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { field: 'description', message: 'Description must be at most 500 characters' },
    ]);
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

describe('task sorting', () => {
  it('sorts status in workflow order, not alphabetically', () => {
    expect(orderByClause('status', 'asc')).toBe(
      "CASE status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END ASC, created_at DESC",
    );
  });

  it('sorts titles ignoring case', () => {
    expect(orderByClause('title', 'asc')).toBe('LOWER(title) ASC, created_at DESC');
  });

  it('sorts by date created without a tie-breaker', () => {
    expect(orderByClause('created_at', 'desc')).toBe('created_at DESC');
  });
});

describe('task search', () => {
  it('matches the text anywhere in the title', () => {
    expect(toSearchPattern('milk')).toBe('%milk%');
  });

  it('treats % and _ as normal characters, not wildcards', () => {
    expect(toSearchPattern('50%_off')).toBe('%50\\%\\_off%');
  });

  it('rejects search text longer than 200 characters', async () => {
    const res = await request(app)
      .get(`/api/tasks?search=${'a'.repeat(201)}`)
      .set(auth);
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'search', message: 'Search must be at most 200 characters' }]);
  });
});
