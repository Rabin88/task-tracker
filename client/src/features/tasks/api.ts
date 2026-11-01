import { request } from '../../api/client';
import type { NewTask, Task, TaskChanges, TaskQuery } from './types';

export async function getTasks(query: TaskQuery = {}) {
  // Only send the options that are set, e.g. no ?status= when showing all.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  const res = await request<{ data: Task[] }>(`/tasks${qs ? `?${qs}` : ''}`);
  return res.data;
}

export async function createTask(task: NewTask) {
  const res = await request<{ data: Task }>('/tasks', { method: 'POST', body: task });
  return res.data;
}

export async function updateTask(id: string, changes: TaskChanges) {
  const res = await request<{ data: Task }>(`/tasks/${id}`, { method: 'PATCH', body: changes });
  return res.data;
}

export async function deleteTask(id: string) {
  await request<void>(`/tasks/${id}`, { method: 'DELETE' });
}
