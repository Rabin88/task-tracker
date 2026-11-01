-- Tasks belong to a user. Deleting a user deletes their tasks.
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  status      TEXT NOT NULL DEFAULT 'todo'
              CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The main query is "this user's tasks, newest first", so index for exactly that.
CREATE INDEX tasks_user_id_created_at_idx ON tasks (user_id, created_at DESC);
