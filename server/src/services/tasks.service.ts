import { query } from '../db/pool';
import { AppError } from '../utils/AppError';
import type { CreateTaskInput, GetTasksQuery, UpdateTaskInput } from '../schemas/tasks.schema';

// Tasks logic + SQL. Knows nothing about HTTP (req/res).

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: Date;
  updated_at: Date;
};

// What each ?sort option orders by. Status follows the workflow (To do, In progress,
// Done) instead of alphabetical order, and titles ignore upper/lower case.
// Only these fixed strings ever reach the SQL, never the raw query value.
const SORT_COLUMNS: Record<GetTasksQuery['sort'], string> = {
  created_at: 'created_at',
  updated_at: 'updated_at',
  title: 'LOWER(title)',
  status: "CASE status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END",
};

export function orderByClause(sort: GetTasksQuery['sort'], order: GetTasksQuery['order']) {
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  // Newest first breaks ties, e.g. between tasks with the same status.
  return sort === 'created_at' ? `created_at ${direction}` : `${SORT_COLUMNS[sort]} ${direction}, created_at DESC`;
}

// Turns search text into an ILIKE pattern that matches it anywhere in the title.
// % and _ are wildcards in LIKE, so they're escaped to match literally ("50%" finds "50%").
export function toSearchPattern(search: string) {
  return `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

// One user's tasks, optionally filtered by status and title search, and sorted
// (newest first by default).
export async function getTasksByUserId(userId: string, options: Partial<GetTasksQuery> = {}) {
  const { status = null, sort = 'created_at', order = 'desc', search } = options;

  // "$2 IS NULL OR ..." means: no status given = no status filter. Same for $3 and search.
  // ILIKE ignores upper/lower case. The search text is a parameter, never part of the SQL.
  const { rows } = await query<Task>(
    `SELECT * FROM tasks
     WHERE user_id = $1
       AND ($2::text IS NULL OR status = $2)
       AND ($3::text IS NULL OR title ILIKE $3)
     ORDER BY ${orderByClause(sort, order)}`,
    [userId, status, search ? toSearchPattern(search) : null],
  );
  return rows;
}

// Every query below includes user_id, so a user can only ever touch their own tasks.
// Someone else's task is reported as "not found", so its existence isn't revealed.

export async function getTaskById(userId: string, taskId: string) {
  const { rows } = await query<Task>('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
  if (!rows[0]) throw AppError.notFound('Task not found');
  return rows[0];
}

export async function createTask(userId: string, input: CreateTaskInput) {
  const { rows } = await query<Task>(
    'INSERT INTO tasks (user_id, title, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, input.title, input.description ?? null, input.status],
  );
  return rows[0];
}

// Loads the task, applies only the fields that were sent, then saves all of them.
export async function updateTask(userId: string, taskId: string, changes: UpdateTaskInput) {
  const task = await getTaskById(userId, taskId); // 404 if missing or not theirs
  const updated = { ...task, ...changes };

  const { rows } = await query<Task>(
    `UPDATE tasks SET title = $1, description = $2, status = $3, updated_at = now()
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [updated.title, updated.description, updated.status, taskId, userId],
  );
  return rows[0];
}

export async function deleteTask(userId: string, taskId: string) {
  const { rowCount } = await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
  if (rowCount === 0) throw AppError.notFound('Task not found');
}
