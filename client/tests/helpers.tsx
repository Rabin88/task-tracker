import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { App } from '../src/app/App';
import { AuthProvider } from '../src/features/auth/AuthProvider';

// Renders the whole app at a URL, with the real router and auth.
export function renderApp(url = '/tasks') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

type MockResponse = { status?: number; body?: unknown };

// Replaces fetch with a function that answers by "METHOD /path". Returns the mock
// so tests can check what was sent.
export function mockFetch(routes: Record<string, MockResponse | ((init: RequestInit) => MockResponse)>) {
  const fn = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const key = `${init.method ?? 'GET'} ${url.pathname.replace(/^\/api/, '')}`;
    const route = routes[key];
    if (!route) throw new Error(`Unexpected request: ${key}`);
    const { status = 200, body } = typeof route === 'function' ? route(init) : route;
    return new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export const user = { id: 'u1', email: 'rabin@example.com', created_at: '2026-01-01T00:00:00.000Z' };

export function makeTask(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: crypto.randomUUID(),
    user_id: user.id,
    title: 'Write tests',
    description: null,
    status: 'todo',
    created_at: '2026-01-02T10:00:00.000Z',
    updated_at: '2026-01-02T10:00:00.000Z',
    ...overrides,
  };
}

// MUI dropdowns aren't native <select>s: open the list, then click the option.
export async function chooseOption(label: string | RegExp, option: string, container: HTMLElement = document.body) {
  await userEvent.click(within(container).getByRole('combobox', { name: label }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}
