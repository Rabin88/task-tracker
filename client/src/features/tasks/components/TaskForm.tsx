import { Alert, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useForm } from '../../../hooks/useForm';
import { DESCRIPTION_MAX, TITLE_MAX, taskFormSchema, type TaskFormValues } from '../schemas';
import { STATUS_OPTIONS } from '../status';
import type { NewTask } from '../types';

const EMPTY: TaskFormValues = { title: '', description: '', status: 'todo' };

type Props = {
  initialValues?: TaskFormValues;
  submitLabel: string;
  onSubmit: (task: NewTask) => Promise<void>;
  onCancel?: () => void;
  resetOnSuccess?: boolean; // the "add" form clears itself, the "edit" form closes instead
};

// Used both to add a task and to edit one.
export function TaskForm({ initialValues = EMPTY, submitLabel, onSubmit, onCancel, resetOnSuccess = false }: Props) {
  const form = useForm({ schema: taskFormSchema, initialValues, onSubmit, resetOnSuccess });

  return (
    <Stack component="form" onSubmit={form.handleSubmit} noValidate spacing={2}>
      {form.formError && <Alert severity="error">{form.formError}</Alert>}
      <TextField
        label="Title"
        placeholder="What needs doing?"
        {...form.field('title')}
        slotProps={{ htmlInput: { maxLength: TITLE_MAX } }}
      />
      <TextField
        label="Description (optional)"
        multiline
        minRows={3}
        {...form.field('description')}
        helperText={form.errors.description || `${form.values.description.length}/${DESCRIPTION_MAX}`}
      />
      <TextField select label="Status" {...form.field('status')}>
        {STATUS_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" loading={form.submitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="outlined" color="inherit" onClick={onCancel} disabled={form.submitting}>
            Cancel
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
