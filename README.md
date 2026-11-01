# Task Tracker

A small full-stack task tracker: sign up, then create, edit, filter and complete your tasks.

| Part     | Tech                                        | Folder               |
| -------- | ------------------------------------------- | -------------------- |
| Frontend | React + TypeScript (Vite), MUI              | `client/`            |
| Backend  | Node.js + Express + TypeScript              | `server/`            |
| Database | PostgreSQL (Neon) with plain SQL migrations | `server/migrations/` |

## Run locally

You need Node.js 20+ and a PostgreSQL database. Use two terminals:

```bash
# 1. API: http://localhost:4000
cd server
npm install
cp .env.example .env      # set DATABASE_URL and JWT_SECRET
npm run migrate
npm run dev

# 2. Frontend: http://localhost:5173
cd client
npm install
cp .env.example .env
npm run dev
```

Then open http://localhost:5173 and create an account.

More detail: [`server/README.md`](server/README.md) (API, error format, logging) and [`client/README.md`](client/README.md) (structure, validation).

## Tests and code quality

```bash
cd server && npm test
cd client && npm test
```

Both projects also have `npm run lint` (ESLint), `npm run format` (Prettier, shared config in `.prettierrc.json`), `npm run typecheck` and `npm run test:coverage`.
