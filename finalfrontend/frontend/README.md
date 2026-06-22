# Glimmora Frontend

Next.js 16 application — enterprise, contributor, mentor, and admin portals.

## Commands

From repo root: `npm run dev` / `npm run build` / `npm run lint`

Or from this folder: `npm run dev`

## Environment

Copy `frontend/.env.example` → `frontend/.env.local`:

- `DATABASE_URL` — PostgreSQL
- `AUTH_SECRET`, OAuth client IDs/secrets — NextAuth
- `BACKEND_SERVICE_URL` — optional; proxied routes target the backend service (default `http://localhost:4000`)

## Database

Prisma schema and migrations: `frontend/prisma/`

```bash
npm run db:generate    # from repo root
npm run db:migrate
npm run ensure:admin   # dev admin user
```

Dev seed scripts: `frontend/scripts/`

## API routes

Server routes live in `src/app/api/`. Proxied routes forward to the backend service; others use Prisma directly or mocks.
