# Task Tracker - API

Node.js + Express 5 + TypeScript + PostgreSQL (plain SQL via `pg`).

## Setup

Requires Node.js 20+ and a PostgreSQL 13+ database (a local install or a free [Neon](https://neon.tech) database both work).

```bash
cd server
npm install
cp .env.example .env      # set DATABASE_URL to your database, and JWT_SECRET to a random string
npm run migrate           # creates the users and tasks tables
npm run dev               # http://localhost:4000
```

Check it works: open http://localhost:4000/api/health. You should see `{"status":"ok","database":"connected",...}`

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with auto-reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server (used on Render) |
| `npm run migrate` | Apply new SQL migrations to the database in `DATABASE_URL` |
| `npm run migrate:prod` | Same, using the compiled JS (used on Render) |
| `npm test` | Run tests (Vitest + Supertest) |
| `npm run typecheck` | Type-check without building |

## Structure

```
server/
├── migrations/            # Plain SQL, applied in filename order, each runs once
├── src/
│   ├── config/env.ts      # Validates environment variables at startup (Zod)
│   ├── db/pool.ts         # Shared Postgres connection pool + query helper
│   ├── db/migrate.ts      # Tiny migration runner (tracks applied files in schema_migrations)
│   ├── middleware/        # errorHandler, notFound, requireAuth, requestLogger
│   ├── routes/            # URL + middleware -> controller wiring, mounted under /api
│   ├── schemas/           # Zod request schemas (body/params/query)
│   ├── controllers/       # HTTP layer: validate input (schema.parse), call service, send res
│   ├── services/          # Business logic + SQL queries, no HTTP
│   ├── utils/AppError.ts  # Typed HTTP errors (400, 401, 404, 409)
│   ├── app.ts             # Builds the Express app (imported by tests)
│   └── server.ts          # Starts listening + graceful shutdown
└── tests/
```

Request flow: `routes -> controller (validates with Zod) -> service (logic + SQL) -> Postgres`

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | – | API + database status |
| POST | `/api/auth/register` | – | `{ email, password }` → `201 { data: { user, token } }` |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ data: { user, token } }` |
| GET | `/api/auth/me` | ✅ | The logged-in user |
| GET | `/api/tasks` | ✅ | The logged-in user's tasks. Optional: `?status=todo\|in_progress\|done`, `?sort=created_at\|updated_at\|title\|status`, `?order=asc\|desc` (default: newest first) |
| POST | `/api/tasks` | ✅ | `{ title, description?, status? }` → `201 { data: task }` (status defaults to `todo`) |
| GET | `/api/tasks/:id` | ✅ | One task |
| PATCH | `/api/tasks/:id` | ✅ | Send only the fields to change; `description: null` clears it |
| DELETE | `/api/tasks/:id` | ✅ | `204 No Content` |

Protected routes need the token from register/login in a header: `Authorization: Bearer <token>`. Tokens expire after 1 day. Emails are trimmed and lowercased; passwords are stored as bcrypt hashes in `users.password`.

## Logging

[pino](https://getpino.io) via `src/utils/logger.ts`. Every request is logged once when it finishes (`src/middleware/requestLogger.ts`): 2xx/3xx as `info`, 4xx as `warn`, 5xx as `error` with the stack.

- **Local:** readable lines in the terminal, e.g. `[16:47:59] INFO: GET /api/tasks 200 19ms`
- **Render:** one JSON object per line in the service's **Logs** tab
- **Tests:** silent

Logs go to stdout only (no log files). Authorization headers and `password` fields are redacted. Use `logger.info/warn/error` instead of `console.log`.

## Error format

Every error response has the same shape:

```json
{ "error": { "message": "Validation failed", "details": [{ "field": "title", "message": "Title is required" }] } }
```

| Status | When |
|---|---|
| 400 | Invalid input (with `details` per field), malformed JSON |
| 401 | Missing/invalid/expired token, wrong email or password |
| 404 | Task not found (or belongs to another user), unknown route |
| 409 | Email already registered |
| 500 | Unexpected error: the client only sees `"Internal server error"`; details go to the logs |
