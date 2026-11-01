import { useState } from 'react';
import { IconButton, InputAdornment, TextField, Tooltip, type TextFieldProps } from '@mui/material';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

// A TextField for passwords with an eye button to show or hide what's typed.
export function PasswordField(props: Omit<TextFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Hide password' : 'Show password';

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={label}>
                <IconButton
                  aria-label={label}
                  aria-pressed={visible}
                  onClick={() => setVisible((v) => !v)}
                  onMouseDown={(e) => e.preventDefault()} // keep focus (and the cursor) in the field
                  edge="end"
                  size="small"
                >
                  {visible ? (
                    <VisibilityOffOutlinedIcon fontSize="small" />
                  ) : (
                    <VisibilityOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
