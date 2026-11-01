import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Grid, Snackbar, Stack, Typography } from '@mui/material';
import * as tasksApi from '../api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { TaskFilters } from '../components/TaskFilters';
import { TaskForm } from '../components/TaskForm';
import { TaskItem } from '../components/TaskItem';
import { TaskSearch } from '../components/TaskSearch';
import { useTasks } from '../hooks/useTasks';
import type { TaskListQuery } from '../types';

// Form on the left half, list on the right half. Stacks on small screens.
export function TasksPage() {
  const [query, setQuery] = useState<TaskListQuery>({ sort: 'created_at', order: 'desc' });
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim()); // waits until typing pauses
  const { tasks, loading, error, reload } = useTasks({ ...query, search: search || undefined });
  const [notice, setNotice] = useState<string | null>(null); // "Task added" etc., shown for a few seconds

  const afterChange = (message: string) => {
    reload();
    setNotice(message);
  };

  return (
    <>
      <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ position: { md: 'sticky' }, top: { md: 16 } }}>
          <Card>
            <CardContent>
              <Typography variant="h2" gutterBottom>
                Add a task
              </Typography>
              <TaskForm
                submitLabel="Add task"
                resetOnSuccess
                onSubmit={async (task) => {
                  await tasksApi.createTask(task);
                  afterChange('Task added');
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} component="section">
          <Typography variant="h2" gutterBottom>
            Your tasks{' '}
            {!loading && (
              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                ({tasks.length})
              </Box>
            )}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Stack spacing={1.5}>
              <TaskSearch value={searchInput} onChange={setSearchInput} />
              <TaskFilters query={query} onChange={setQuery} />
            </Stack>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={reload}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          {loading && tasks.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Loading tasks…
            </Typography>
          ) : !error && tasks.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              {query.status || search
                ? 'No tasks match your search or filters.'
                : 'No tasks yet. Add your first one on the left.'}
            </Typography>
          ) : (
            <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }} aria-busy={loading}>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={async (id, changes) => {
                    await tasksApi.updateTask(id, changes);
                    afterChange('Task updated');
                  }}
                  onDelete={async (id) => {
                    await tasksApi.deleteTask(id);
                    afterChange('Task deleted');
                  }}
                />
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={notice !== null}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </>
  );
}
