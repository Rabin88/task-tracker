import { Avatar, Button, Stack, Tooltip } from '@mui/material';
import { initials } from '../../../lib/initials';
import { useAuth } from '../useAuth';

// Top-bar avatar (initials, email on hover) and the log out button.
export function UserMenu() {
  const { user, logout } = useAuth();
  const email = user?.email ?? '';

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Tooltip title={email}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.95rem', cursor: 'default' }}>
          {initials(email)}
        </Avatar>
      </Tooltip>
      <Button variant="outlined" color="inherit" onClick={logout}>
        Log out
      </Button>
    </Stack>
  );
}
