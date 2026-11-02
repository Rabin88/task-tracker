import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { useAuth } from '../useAuth';

function FullPage({ children }: { children: ReactNode }) {
  return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>{children}</Box>;
}

// Shown while checking the saved login, or if that check couldn't reach the server.
// Returns null once there's an answer, so the guard can decide where to go.
function SessionStatus() {
  const { loading, sessionError, retrySession } = useAuth();
  if (loading) {
    return (
      <FullPage>
        <CircularProgress aria-label="Loading" />
      </FullPage>
    );
  }
  if (sessionError) {
    return (
      <FullPage>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retrySession}>
              Retry
            </Button>
          }
        >
          {sessionError}
        </Alert>
      </FullPage>
    );
  }
  return null;
}

// Pages for logged-in users only. Others go to /login.
export function ProtectedRoute() {
  const { user, loading, sessionError } = useAuth();
  if (loading || sessionError) return <SessionStatus />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// Login and register: a logged-in user goes straight to their tasks.
export function GuestRoute() {
  const { user, loading, sessionError } = useAuth();
  if (loading || sessionError) return <SessionStatus />;
  return user ? <Navigate to="/tasks" replace /> : <Outlet />;
}
