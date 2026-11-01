import { MenuItem, Stack, TextField } from '@mui/material';
import { STATUS_OPTIONS } from '../status';
import type { SortOrder, TaskListQuery, TaskSort, TaskStatus } from '../types';

// One "Sort by" list. Each choice sets both the API's sort and order, so every
// option does what its label says (a separate order box made "Title" show Z-A).
const SORT_CHOICES: { value: string; label: string; sort: TaskSort; order: SortOrder }[] = [
  { value: 'newest', label: 'Newest first', sort: 'created_at', order: 'desc' },
  { value: 'oldest', label: 'Oldest first', sort: 'created_at', order: 'asc' },
  { value: 'updated', label: 'Recently updated', sort: 'updated_at', order: 'desc' },
  { value: 'title-asc', label: 'Title (A-Z)', sort: 'title', order: 'asc' },
  { value: 'title-desc', label: 'Title (Z-A)', sort: 'title', order: 'desc' },
  { value: 'status', label: 'Status (To do first)', sort: 'status', order: 'asc' },
];

type Props = { query: TaskListQuery; onChange: (query: TaskListQuery) => void };

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <TextField select label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function TaskFilters({ query, onChange }: Props) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <Filter
        label="Show"
        value={query.status ?? 'all'}
        options={[{ value: 'all', label: 'All tasks' }, ...STATUS_OPTIONS]}
        onChange={(v) => onChange({ ...query, status: v === 'all' ? undefined : (v as TaskStatus) })}
      />
      <Filter
        label="Sort by"
        value={SORT_CHOICES.find((c) => c.sort === query.sort && c.order === query.order)?.value ?? 'newest'}
        options={SORT_CHOICES}
        onChange={(v) => {
          const { sort, order } = SORT_CHOICES.find((c) => c.value === v)!;
          onChange({ ...query, sort, order });
        }}
      />
    </Stack>
  );
}
