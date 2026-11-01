import { Outlet } from 'react-router';
import { AppBar, Container, Toolbar, Typography } from '@mui/material';
import { UserMenu } from '../features/auth/components/UserMenu';

// Frame for every logged-in page: top bar, then the page itself.
export function AppLayout() {
  return (
    <>
      <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span" color="primary" sx={{ fontWeight: 700 }}>
            Task Tracker
          </Typography>
          <UserMenu />
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </>
  );
}
