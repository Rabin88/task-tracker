import { z } from 'zod';

// Request schemas for task routes. Controllers call schema.parse(...).
// The same limits exist as CHECK constraints in the database (migrations/002_create_tasks.sql);
// checking here first turns bad input into a clear 400 instead of a database error.

const bodyError = { error: 'Request body must be a JSON object' };

const title = z
  .string({ error: 'Title is required' })
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Title must be at most 200 characters');

// null clears the description.
const description = z.string().trim().max(500, 'Description must be at most 500 characters').nullable();

const status = z.enum(['todo', 'in_progress', 'done'], { error: 'Status must be todo, in_progress or done' });

// POST /api/tasks
export const createTaskBodySchema = z.object(
  {
    title,
    description: description.optional(),
    status: status.default('todo'),
  },
  bodyError,
);

// PATCH /api/tasks/:id - send only the fields you want to change.
export const updateTaskBodySchema = z
  .object(
    {
      title: title.optional(),
      description: description.optional(),
      status: status.optional(),
    },
    bodyError,
  )
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' });

// GET /api/tasks?status=done&sort=title&order=asc&search=milk - all optional.
// sort and order are enums, which is what makes it safe to put them into the SQL.
export const getTasksQuerySchema = z.object({
  status: status.optional(),
  sort: z
    .enum(['created_at', 'updated_at', 'title', 'status'], {
      error: 'Sort must be created_at, updated_at, title or status',
    })
    .default('created_at'),
  order: z.enum(['asc', 'desc'], { error: 'Order must be asc or desc' }).default('desc'),
  // Text to look for in titles. Blank means no search.
  search: z
    .string({ error: 'Search must be text' })
    .trim()
    .max(200, 'Search must be at most 200 characters')
    .optional()
    .transform((v) => v || undefined),
});

// /api/tasks/:id
export const taskIdParamsSchema = z.object({
  id: z.uuid('Invalid task id'),
});

export type GetTasksQuery = z.infer<typeof getTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskBodySchema>;
