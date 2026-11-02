import { Link as RouterLink } from 'react-router';
import { Alert, Button, Link, Snackbar, Stack, TextField } from '@mui/material';
import { PasswordField } from '../../../components/PasswordField';
import { useForm } from '../../../hooks/useForm';
import { useAuth } from '../useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { loginSchema } from '../schemas';

export function LoginPage() {
  const { login, justLoggedOut, clearLoggedOutMessage } = useAuth();

  const form = useForm({
    schema: loginSchema,
    initialValues: { email: '', password: '' },
    onSubmit: ({ email, password }) => login(email, password), // GuestRoute then redirects to /tasks
  });

  return (
    <AuthLayout
      title="Log in"
      footer={
        <>
          No account yet?{' '}
          <Link component={RouterLink} to="/register">
            Create one
          </Link>
        </>
      }
    >
      <Stack component="form" onSubmit={form.handleSubmit} noValidate spacing={2}>
        {form.formError && <Alert severity="error">{form.formError}</Alert>}
        <TextField label="Email" type="email" autoComplete="email" {...form.field('email')} />
        <PasswordField label="Password" autoComplete="current-password" {...form.field('password')} />
        <Button type="submit" variant="contained" loading={form.submitting} fullWidth>
          Log in
        </Button>
      </Stack>

      <Snackbar
        open={justLoggedOut}
        autoHideDuration={3000}
        onClose={clearLoggedOutMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={clearLoggedOutMessage}>
          You have been logged out.
        </Alert>
      </Snackbar>
    </AuthLayout>
  );
}
