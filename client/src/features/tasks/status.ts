import type { ChipProps } from '@mui/material';
import type { TaskStatus } from './types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const STATUS_COLORS: Record<TaskStatus, ChipProps['color']> = {
  todo: 'info',
  in_progress: 'warning',
  done: 'success',
};

export const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as TaskStatus[]).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));
