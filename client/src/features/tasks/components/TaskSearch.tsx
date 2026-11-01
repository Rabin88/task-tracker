import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { SEARCH_MAX } from '../schemas';

type Props = { value: string; onChange: (value: string) => void };

// Search box for task titles, with a button to clear it.
export function TaskSearch({ value, onChange }: Props) {
  return (
    <TextField
      label="Search"
      placeholder="Search by title"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        htmlInput: { maxLength: SEARCH_MAX },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <Tooltip title="Clear search">
                <IconButton aria-label="Clear search" onClick={() => onChange('')} edge="end" size="small">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
