import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { chooseOption, makeTask, mockFetch, renderApp, user } from './helpers';
import { initials } from '../src/lib/initials';

beforeEach(() => {
  localStorage.setItem('task-tracker-token', 'jwt-token');
});

const me = { body: { data: user } };

describe('initials', () => {
  it('uses up to two parts of the name before the @', () => {
    expect(initials('test123@test.com')).toBe('T');
    expect(initials('john.smith@example.com')).toBe('JS');
    expect(initials('mary-jane_watson@example.com')).toBe('MJ');
    expect(initials('')).toBe('');
  });
});

describe('tasks page', () => {
  it("lists the user's tasks and sends the token", async () => {
    const fetch = mockFetch({
      'GET /auth/me': me,
      'GET /tasks': { body: { data: [makeTask({ title: 'First' }), makeTask({ title: 'Second' })], count: 2 } },
    });
    renderApp('/tasks');

    expect(await screen.findByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();

    // The top bar shows initials; the email appears in a tooltip on hover.
    const avatar = screen.getByText('R');
    await userEvent.hover(avatar);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('rabin@example.com');
    expect(fetch.mock.calls[0][1]!.headers).toMatchObject({ Authorization: 'Bearer jwt-token' });
  });

  it('validates the add form before calling the API', async () => {
    const fetch = mockFetch({ 'GET /auth/me': me, 'GET /tasks': { body: { data: [], count: 0 } } });
    renderApp('/tasks');
    await screen.findByText('No tasks yet. Add your first one on the left.');
    const callsBefore = fetch.mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(fetch.mock.calls.length).toBe(callsBefore);
  });

  it('adds a task, clears the form and reloads the list', async () => {
    let tasks: ReturnType<typeof makeTask>[] = [];
    const fetch = mockFetch({
      'GET /auth/me': me,
      'GET /tasks': () => ({ body: { data: tasks, count: tasks.length } }),
      'POST /tasks': (init) => {
        const created = makeTask(JSON.parse(init.body as string));
        tasks = [created];
        return { status: 201, body: { data: created } };
      },
    });
    renderApp('/tasks');
    await screen.findByText('No tasks yet. Add your first one on the left.');

    await userEvent.type(screen.getByLabelText('Title'), '  Buy milk  ');
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByRole('heading', { name: 'Buy milk' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('');
    const post = fetch.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({ title: 'Buy milk', description: null, status: 'todo' });
  });

  it('marks a task as done with the checkbox', async () => {
    const task = makeTask({ title: 'Finish report' });
    const fetch = mockFetch({
      'GET /auth/me': me,
      'GET /tasks': { body: { data: [task], count: 1 } },
      [`PATCH /tasks/${task.id}`]: { body: { data: { ...task, status: 'done' } } },
    });
    renderApp('/tasks');

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Mark "Finish report" as done' }));

    const patch = fetch.mock.calls.find(([, init]) => init?.method === 'PATCH')!;
    expect(JSON.parse(patch[1]!.body as string)).toEqual({ status: 'done' });
  });

  it('keeps Edit and Delete usable after ticking an in-progress task', async () => {
    let task = makeTask({ title: 'Half done', status: 'in_progress' });
    const fetch = mockFetch({
      'GET /auth/me': me,
      'GET /tasks': () => ({ body: { data: [task], count: 1 } }),
      [`PATCH /tasks/${task.id}`]: (init) => {
        task = { ...task, ...JSON.parse(init.body as string) };
        return { body: { data: task } };
      },
    });
    renderApp('/tasks');

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Mark "Half done" as done' }));

    // Ticking means done, even from in progress.
    expect(await screen.findByRole('checkbox', { name: 'Mark "Half done" as not done' })).toBeChecked();
    const patch = fetch.mock.calls.find(([, init]) => init?.method === 'PATCH')!;
    expect(JSON.parse(patch[1]!.body as string)).toEqual({ status: 'done' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled());
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Mark "Half done" as not done' })).toBeEnabled();
  });

  it('edits a task and validates the edit form', async () => {
    const task = makeTask({ title: 'Old title', description: 'Some notes' });
    const fetch = mockFetch({
      'GET /auth/me': me,
      'GET /tasks': { body: { data: [task], count: 1 } },
      [`PATCH /tasks/${task.id}`]: { body: { data: task } },
    });
    renderApp('/tasks');
    const item = (await screen.findByRole('heading', { name: 'Old title' })).closest('li')!;
    await userEvent.click(within(item).getByRole('button', { name: 'Edit' }));

    const title = within(item).getByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.click(within(item).getByRole('button', { name: 'Save' }));
    expect(within(item).getByText('Title is required')).toBeInTheDocument();

    await userEvent.type(title, 'New title');
    await userEvent.clear(within(item).getByLabelText('Description (optional)'));
    await chooseOption('Status', 'In progress', item);
    await userEvent.click(within(item).getByRole('button', { name: 'Save' }));

    const patch = fetch.mock.calls.find(([, init]) => init?.method === 'PATCH')!;
    expect(JSON.parse(patch[1]!.body as string)).toEqual({
      title: 'New title',
      description: null,
      status: 'in_progress',
    });
  });

  it('deletes a task after confirming', async () => {
    const task = makeTask({ title: 'Old task' });
    let tasks = [task];
    mockFetch({
      'GET /auth/me': me,
      'GET /tasks': () => ({ body: { data: tasks, count: tasks.length } }),
      [`DELETE /tasks/${task.id}`]: () => {
        tasks = [];
        return { status: 204 };
      },
    });
    renderApp('/tasks');

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete task?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('No tasks yet. Add your first one on the left.')).toBeInTheDocument();
    expect(screen.getByText('Task deleted')).toBeInTheDocument();
  });

  it('sends the filter and sort options to the API', async () => {
    const fetch = mockFetch({ 'GET /auth/me': me, 'GET /tasks': { body: { data: [], count: 0 } } });
    renderApp('/tasks');
    await screen.findByText('No tasks yet. Add your first one on the left.');

    await chooseOption('Show', 'Done');
    await chooseOption('Sort by', 'Title (A-Z)');

    await screen.findByText('No tasks match your search or filters.');
    const lastUrl = new URL(String(fetch.mock.calls.at(-1)![0]));
    expect(Object.fromEntries(lastUrl.searchParams)).toEqual({ status: 'done', sort: 'title', order: 'asc' });
  });

  it('shows an error when the server cannot be reached, and Retry reloads the list', async () => {
    let serverUp = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (String(input).endsWith('/auth/me')) return new Response(JSON.stringify(me.body), { status: 200 });
        if (!serverUp) throw new TypeError('Failed to fetch');
        return new Response(JSON.stringify({ data: [makeTask({ title: 'Back online' })], count: 1 }), { status: 200 });
      }),
    );
    renderApp('/tasks');

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server');

    serverUp = true;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Back online')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('searches titles once typing pauses, and clears the search', async () => {
    const tasks = [makeTask({ title: 'Buy milk' }), makeTask({ title: 'Walk the dog' })];
    // A small fake server: /tasks returns only the titles that contain ?search=.
    const fetch = vi.fn(async (input: string) => {
      const url = new URL(input);
      if (url.pathname.endsWith('/auth/me')) return new Response(JSON.stringify(me.body), { status: 200 });
      const search = url.searchParams.get('search')?.toLowerCase();
      const data = search ? tasks.filter((t) => t.title.toLowerCase().includes(search)) : tasks;
      return new Response(JSON.stringify({ data, count: data.length }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetch);
    renderApp('/tasks');
    await screen.findByText('Walk the dog');

    await userEvent.type(screen.getByLabelText('Search'), 'MILK');

    await waitFor(() => expect(screen.queryByText('Walk the dog')).not.toBeInTheDocument());
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    const searches = fetch.mock.calls.map(([input]) => new URL(input).searchParams.get('search')).filter(Boolean);
    expect(searches).toEqual(['MILK']); // one request for the whole word, not one per letter

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(await screen.findByText('Walk the dog')).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toHaveValue('');
  });

  it('cancels an edit without saving', async () => {
    const task = makeTask({ title: 'Keep me' });
    const fetch = mockFetch({ 'GET /auth/me': me, 'GET /tasks': { body: { data: [task], count: 1 } } });
    renderApp('/tasks');
    const item = (await screen.findByRole('heading', { name: 'Keep me' })).closest('li')!;

    await userEvent.click(within(item).getByRole('button', { name: 'Edit' }));
    await userEvent.type(within(item).getByLabelText('Title'), ' changed');
    await userEvent.click(within(item).getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('heading', { name: 'Keep me' })).toBeInTheDocument();
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false);
  });

  it('logs out when the token expires mid-session', async () => {
    mockFetch({
      'GET /auth/me': me,
      'GET /tasks': { status: 401, body: { error: { message: 'Invalid or expired token' } } },
    });
    renderApp('/tasks');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(localStorage.getItem('task-tracker-token')).toBeNull();
    expect(screen.queryByText('You have been logged out.')).not.toBeInTheDocument(); // only for clicking Log out
  });

  it('logs out and confirms it on the login page', async () => {
    mockFetch({ 'GET /auth/me': me, 'GET /tasks': { body: { data: [], count: 0 } } });
    renderApp('/tasks');
    await screen.findByText('No tasks yet. Add your first one on the left.');

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('You have been logged out.');
    expect(localStorage.getItem('task-tracker-token')).toBeNull();
  });
});
