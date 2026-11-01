# Task Tracker - Frontend

React 19 + TypeScript + Vite, with [MUI](https://mui.com) for components.

## Setup

Requires Node.js 20+ and the API running (see [`../server/README.md`](../server/README.md)).

```bash
cd client
npm install
cp .env.example .env      # VITE_API_URL, defaults to http://localhost:4000/api
npm run dev               # http://localhost:5173
```

The API only accepts requests from the origins in its `CORS_ORIGIN` setting, which defaults to `http://localhost:5173`.

## Scripts

| Script                  | What it does                                                |
| ----------------------- | ----------------------------------------------------------- |
| `npm run dev`           | Start the dev server with hot reload                        |
| `npm run build`         | Type-check, then build to `dist/`                           |
| `npm run preview`       | Serve the built `dist/` locally                             |
| `npm test`              | Run tests (Vitest + Testing Library)                        |
| `npm run typecheck`     | Type-check without building                                 |
| `npm run test:coverage` | Run tests with a coverage report (`coverage/index.html`)    |
| `npm run lint`          | Check code with ESLint                                      |
| `npm run format`        | Format all files with Prettier (`format:check` only checks) |

## Features

- Register and log in. The token is kept in `localStorage` and sent as `Authorization: Bearer <token>`.
- Form on the left, your tasks on the right (stacked on small screens).
- See your tasks, add a task, edit one in place, tick it to mark it done, and delete it (after confirming in a dialog).
- Short messages confirm each change (task added, updated, deleted) and logging out.
- Search task titles (ignores upper/lower case, searches once you pause typing).
- Filter by status, and sort by newest, oldest, recently updated, title (A-Z or Z-A) or status (To do first).
- Logged-out users are sent to `/login`. An expired token logs you out automatically.

## Structure

Code is grouped by **feature**: everything about tasks lives in `features/tasks/`, everything about logging in lives in `features/auth/`. Code used by more than one feature sits at the top level.

```
client/src/
├── main.tsx                 # Entry point: theme, router, auth provider
├── app/                     # App shell
│   ├── App.tsx              #   Routes
│   ├── AppLayout.tsx        #   Top bar + page frame for logged-in pages
│   └── theme.ts             #   MUI theme: colours, font, rounded corners
├── api/                     # Shared HTTP layer
│   ├── client.ts            #   request(): adds the token, parses JSON, throws ApiError
│   └── errors.ts            #   ApiError, toFormErrors()
├── features/
│   ├── auth/
│   │   ├── api.ts           #   register, login, getMe
│   │   ├── AuthContext.tsx  #   Current user + login/register/logout
│   │   ├── schemas.ts       #   Zod rules for the login and register forms
│   │   ├── types.ts         #   User, AuthResult
│   │   ├── components/      #   AuthLayout, RouteGuards, UserMenu
│   │   └── pages/           #   LoginPage, RegisterPage
│   └── tasks/
│       ├── api.ts           #   getTasks, createTask, updateTask, deleteTask
│       ├── schemas.ts       #   Zod rules for the task form
│       ├── status.ts        #   Status labels and colours
│       ├── types.ts         #   Task, TaskStatus, sort/filter types
│       ├── components/      #   TaskForm (add + edit), TaskItem, TaskFilters, TaskSearch
│       ├── hooks/           #   useTasks (load + reload the list)
│       └── pages/           #   TasksPage
├── components/              # Shared UI: ConfirmDialog, PasswordField
├── hooks/                   # Shared hooks: useForm (validation + submit + API errors), useDebouncedValue
└── lib/                     # Plain helpers, no app imports: validate(), FieldErrors, tokenStorage, initials()
```

**Rules that keep it maintainable**

- A feature only imports from its own folder or the shared folders (`api/`, `components/`, `hooks/`, `lib/`), never from another feature. Only `app/` puts features together.
- Imports only point downwards: `features -> hooks / components -> api -> lib`. `lib/` imports nothing from the app.
- Components never call `fetch`. They call a feature's `api.ts`, which calls `request()`.
- Every form uses `useForm` with a Zod schema, so validation and error display work the same everywhere.

Data flow: `page/component -> features/*/api.ts -> request() in api/client.ts -> API`

## Validation

Forms are checked in the browser before anything is sent, using the same rules and messages as the API (`features/*/schemas.ts` mirror `server/src/schemas/`):

| Form     | Rules                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------- |
| Register | Valid email; password 8 to 72 characters; passwords must match                                        |
| Log in   | Valid email; password required                                                                        |
| Task     | Title required, at most 200 characters; description at most 500; status is To do, In progress or Done |

Emails are trimmed and lowercased, titles trimmed, and an empty description is sent as `null`.

The API still checks everything. If it rejects a request, field errors (`details`) are shown under the matching input, and other errors (wrong password, email taken, server unreachable) appear above the form. Each field's error clears as soon as you edit it.
