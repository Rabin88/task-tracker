import type { RequestHandler } from 'express';
import * as tasksService from '../services/tasks.service';
import { getAuthUser } from '../middleware/requireAuth';
import {
  createTaskBodySchema,
  getTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskBodySchema,
} from '../schemas/tasks.schema';

// Controllers: validate the input, call the service, send the response.
// No SQL, no business rules. Invalid input throws a ZodError -> errorHandler -> 400.

// GET /api/tasks?status=&sort=&order=&search= - the logged-in user's tasks
export const getMyTasks: RequestHandler = async (req, res) => {
  const options = getTasksQuerySchema.parse(req.query);
  const tasks = await tasksService.getTasksByUserId(getAuthUser(res).id, options);
  res.json({ data: tasks, count: tasks.length });
};

// GET /api/tasks/:id
export const getTask: RequestHandler = async (req, res) => {
  const { id } = taskIdParamsSchema.parse(req.params);
  const task = await tasksService.getTaskById(getAuthUser(res).id, id);
  res.json({ data: task });
};

// POST /api/tasks
export const createTask: RequestHandler = async (req, res) => {
  const input = createTaskBodySchema.parse(req.body);
  const task = await tasksService.createTask(getAuthUser(res).id, input);
  res.status(201).json({ data: task });
};

// PATCH /api/tasks/:id
export const updateTask: RequestHandler = async (req, res) => {
  const { id } = taskIdParamsSchema.parse(req.params);
  const changes = updateTaskBodySchema.parse(req.body);
  const task = await tasksService.updateTask(getAuthUser(res).id, id, changes);
  res.json({ data: task });
};

// DELETE /api/tasks/:id
export const deleteTask: RequestHandler = async (req, res) => {
  const { id } = taskIdParamsSchema.parse(req.params);
  await tasksService.deleteTask(getAuthUser(res).id, id);
  res.status(204).end();
};
