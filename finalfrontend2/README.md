# GlimmoraTeam-Project

Global Workforce Intelligence Platform — monorepo layout.

## Structure

```
├── frontend/     Next.js app (UI, NextAuth, Prisma, API proxies, client state)
├── backend/      Backend team scaffold (Hono API — implement /api/v1/*)
├── docs/         Specs, guides, architecture (see docs/README.md)
├── samples/      Sample datasets
└── ux-research/  UX research artifacts
```

## Quick start

```bash
npm install          # installs workspaces + generates Prisma client
npm run dev          # frontend only (:3000)
npm run dev:all      # frontend + backend scaffold (:4000)
```

Environment: copy `frontend/.env.example` to `frontend/.env.local` (database, OAuth, `AUTH_SECRET`). Optional: `BACKEND_SERVICE_URL=http://localhost:4000` when the backend service is running.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run dev:backend` | Start backend scaffold on port 4000 |
| `npm run dev:all` | Start frontend + backend together |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Apply DB migrations |
| `npm run db:seed:local` | Seed local PostgreSQL |
| `npm run ensure:admin` | Upsert platform admin dev user |

## Architecture

**Frontend** owns the UI, NextAuth, Prisma schema (`frontend/prisma/`), and thin API proxies. **Backend** implements proxied business routes documented in `backend/README.md`.

See `docs/architecture/MONOREPO_ARCHITECTURE.md` and `CLAUDE.md` for details.

## Deployment (Vercel)

Set the Vercel project **Root Directory** to `frontend`. `frontend/vercel.json` runs install and build from the frontend workspace.
