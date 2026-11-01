import { useCallback, useEffect, useState } from 'react';
import * as tasksApi from '../api';
import type { Task, TaskQuery } from '../types';

type Result = { key: string | null; tasks: Task[]; error: string | null };

// Loads the user's tasks for the current filter/sort, and reloads when it changes.
// After a create/update/delete the page calls reload(), so the list always
// matches the server's filtering and order.
export function useTasks(query: TaskQuery) {
  const { status, sort, order, search } = query;
  const [version, setVersion] = useState(0);
  // Each result remembers which request it answers. While the latest request is
  // still loading, the previous tasks stay on screen and `loading` is true.
  const key = [status, sort, order, search, version].join('|');
  const [result, setResult] = useState<Result>({ key: null, tasks: [], error: null });

  useEffect(() => {
    let ignore = false; // drop the answer if the filter changed while it was loading
    tasksApi
      .getTasks({ status, sort, order, search })
      .then((tasks) => !ignore && setResult({ key, tasks, error: null }))
      .catch((err: Error) => !ignore && setResult((prev) => ({ key, tasks: prev.tasks, error: err.message })));
    return () => {
      ignore = true;
    };
  }, [key, status, sort, order, search]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { tasks: result.tasks, loading: result.key !== key, error: result.error, reload };
}
