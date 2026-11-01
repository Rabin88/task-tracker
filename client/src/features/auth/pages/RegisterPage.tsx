import { Link as RouterLink } from 'react-router';
import { Alert, Button, Link, Stack, TextField } from '@mui/material';
import { PasswordField } from '../../../components/PasswordField';
import { useForm } from '../../../hooks/useForm';
import { useAuth } from '../useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { registerSchema } from '../schemas';

export function RegisterPage() {
  const { register } = useAuth();
  const form = useForm({
    schema: registerSchema,
    initialValues: { email: '', password: '', confirmPassword: '' },
    onSubmit: ({ email, password }) => register(email, password), // GuestRoute then redirects to /
  });

  return (
    <AuthLayout
      title="Create an account"
      footer={
        <>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login">
            Log in
          </Link>
        </>
      }
    >
      <Stack component="form" onSubmit={form.handleSubmit} noValidate spacing={2}>
        {form.formError && <Alert severity="error">{form.formError}</Alert>}
        <TextField label="Email" type="email" autoComplete="email" {...form.field('email')} />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          {...form.field('password')}
          helperText={form.errors.password || 'At least 8 characters'}
        />
        <PasswordField label="Confirm password" autoComplete="new-password" {...form.field('confirmPassword')} />
        <Button type="submit" variant="contained" loading={form.submitting} fullWidth>
          Create account
        </Button>
      </Stack>
    </AuthLayout>
  );
}
