import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, renderApp, user } from './helpers';

describe('auth pages', () => {
  it('sends a logged-out user to the login page', async () => {
    mockFetch({});
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('shows validation errors without calling the API', async () => {
    const fetch = mockFetch({});
    renderApp('/login');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('clears a field error when the user types in it', async () => {
    mockFetch({});
    renderApp('/login');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await userEvent.type(screen.getByLabelText('Email'), 'a');

    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('shows the API error for a wrong password', async () => {
    mockFetch({ 'POST /auth/login': { status: 401, body: { error: { message: 'Invalid email or password' } } } });
    renderApp('/login');
    await userEvent.type(screen.getByLabelText('Email'), 'rabin@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('logs in, saves the token and opens the tasks page', async () => {
    const fetch = mockFetch({
      'POST /auth/login': { body: { data: { user, token: 'jwt-token' } } },
      'GET /tasks': { body: { data: [], count: 0 } },
    });
    renderApp('/login');
    await userEvent.type(screen.getByLabelText('Email'), '  Rabin@Example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('No tasks yet. Add your first one on the left.')).toBeInTheDocument();
    expect(localStorage.getItem('task-tracker-token')).toBe('jwt-token');
    expect(JSON.parse(fetch.mock.calls[0][1]!.body as string)).toEqual({
      email: 'rabin@example.com',
      password: 'password1',
    });
  });

  it('checks the passwords match before registering', async () => {
    const fetch = mockFetch({});
    renderApp('/register');
    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password1');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'password2');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows "already registered" from the API', async () => {
    mockFetch({ 'POST /auth/register': { status: 409, body: { error: { message: 'Email is already registered' } } } });
    renderApp('/register');
    await userEvent.type(screen.getByLabelText('Email'), 'taken@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password1');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered');
  });

  it('shows API field errors next to the field', async () => {
    mockFetch({
      'POST /auth/register': {
        status: 400,
        body: {
          error: { message: 'Validation failed', details: [{ field: 'email', message: 'Invalid email address' }] },
        },
      },
    });
    renderApp('/register');
    await userEvent.type(screen.getByLabelText('Email'), 'odd@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password1');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('drops an expired saved token and shows the login page', async () => {
    localStorage.setItem('task-tracker-token', 'expired');
    mockFetch({ 'GET /auth/me': { status: 401, body: { error: { message: 'Invalid or expired token' } } } });
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(localStorage.getItem('task-tracker-token')).toBeNull();
  });

  it('keeps the saved login when the server cannot be reached, and retries', async () => {
    localStorage.setItem('task-tracker-token', 'valid-token');
    let serverUp = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (!serverUp) throw new TypeError('Failed to fetch');
        const path = new URL(input).pathname;
        const body = path.endsWith('/auth/me') ? { data: user } : { data: [], count: 0 };
        return new Response(JSON.stringify(body), { status: 200 });
      }),
    );
    renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server');
    expect(localStorage.getItem('task-tracker-token')).toBe('valid-token');

    serverUp = true;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('No tasks yet. Add your first one on the left.')).toBeInTheDocument();
  });

  it('shows and hides the password with the eye button', async () => {
    mockFetch({});
    renderApp('/login');
    const password = screen.getByLabelText('Password');
    await userEvent.type(password, 'secret123');
    expect(password).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(password).toHaveValue('secret123');

    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});
