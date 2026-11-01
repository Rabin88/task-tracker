import { Router } from 'express';
import * as tasksController from '../controllers/tasks.controller';

// Mounted at /api/tasks behind requireAuth in app.ts, so every route here
// needs a logged-in user and paths are relative to /api/tasks.
export const tasksRouter = Router();

tasksRouter.get('/', tasksController.getMyTasks); // GET /api/tasks?status=&sort=&order=
tasksRouter.post('/', tasksController.createTask); // POST /api/tasks
tasksRouter.get('/:id', tasksController.getTask); // GET /api/tasks/:id
tasksRouter.patch('/:id', tasksController.updateTask); // PATCH /api/tasks/:id
tasksRouter.delete('/:id', tasksController.deleteTask); // DELETE /api/tasks/:id
