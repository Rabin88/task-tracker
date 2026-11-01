// Shapes used by /api/tasks (see server/README.md). Dates arrive as ISO strings.

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

export type TaskSort = 'created_at' | 'updated_at' | 'title' | 'status';
export type SortOrder = 'asc' | 'desc';

export type TaskQuery = {
  status?: TaskStatus;
  sort?: TaskSort;
  order?: SortOrder;
  search?: string; // text to find in titles
};

// What the task list is showing. No status means all tasks.
export type TaskListQuery = { status?: TaskStatus; sort: TaskSort; order: SortOrder };

export type NewTask = { title: string; description?: string | null; status?: TaskStatus };
export type TaskChanges = Partial<NewTask>;
