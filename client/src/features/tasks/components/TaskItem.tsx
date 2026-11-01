import { useState } from 'react';
import { Alert, Box, Button, Card, CardActions, CardContent, Checkbox, Chip, Stack, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { STATUS_COLORS, STATUS_LABELS } from '../status';
import type { NewTask, Task, TaskChanges } from '../types';
import { TaskForm } from './TaskForm';

type Props = {
  task: Task;
  onUpdate: (id: string, changes: TaskChanges) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function TaskItem({ task, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = task.status === 'done';

  // For the quick actions (checkbox, delete). The edit form shows its own errors.
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false); // re-enable the buttons whether it worked or not
    }
  }

  if (editing) {
    return (
      <Card component="li">
        <CardContent>
          <TaskForm
            submitLabel="Save"
            initialValues={{ title: task.title, description: task.description ?? '', status: task.status }}
            onSubmit={async (changes: NewTask) => {
              await onUpdate(task.id, changes);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    // A done task is dimmed (grey card, faded content) but stays editable and deletable.
    <Card component="li" sx={done ? { bgcolor: 'grey.50' } : undefined}>
      <CardContent sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', pb: 0, opacity: done ? 0.7 : 1 }}>
        <Checkbox
          checked={done}
          disabled={busy}
          onChange={() => run(() => onUpdate(task.id, { status: done ? 'todo' : 'done' }))}
          slotProps={{
            input: { 'aria-label': done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done` },
          }}
          sx={{ mt: -1, ml: -1 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h3"
            sx={{
              overflowWrap: 'anywhere',
              textDecoration: done ? 'line-through' : 'none',
              color: done ? 'text.secondary' : 'text.primary',
            }}
          >
            {task.title}
          </Typography>
          {task.description && (
            <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: 0.5 }}>
              {task.description}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
            <Chip size="small" label={STATUS_LABELS[task.status]} color={STATUS_COLORS[task.status]} />
            <Typography variant="caption" color="text.secondary">
              Created {formatDate(task.created_at)}
            </Typography>
          </Stack>
        </Box>
      </CardContent>
      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
          {error}
        </Alert>
      )}
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 1.5 }}>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<EditOutlinedIcon />}
          onClick={() => setEditing(true)}
          disabled={busy}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteOutlineIcon />}
          onClick={() => setConfirmingDelete(true)}
          disabled={busy}
        >
          Delete
        </Button>
      </CardActions>
      <ConfirmDialog
        open={confirmingDelete}
        title="Delete task?"
        message={`"${task.title}" will be deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          run(() => onDelete(task.id));
        }}
      />
    </Card>
  );
}
