# Phase 2 — Backend extraction

Phase 2 introduced a standalone backend service with frontend proxies. **As of the backend handoff decoupling**, the previous Hono implementation was archived in git history; `backend/` is a clean scaffold for the backend team.

## Current state

- **Frontend** owns Prisma (`frontend/prisma/`), NextAuth, and direct DB routes.
- **Backend** implements `/api/v1/*` per `backend/README.md` (health scaffold only today).
- Proxies remain in `frontend/src/lib/api/backend-service.ts`.

## Key files

| File | Purpose |
|------|---------|
| `backend/README.md` | API contract for backend team |
| `docs/architecture/MONOREPO_ARCHITECTURE.md` | Monorepo layout + request flow |
| `frontend/src/lib/api/backend-service.ts` | `proxyToBackendService()` helper |
| `frontend/prisma/schema.prisma` | Database schema (source of truth) |

## Local development

```bash
npm run dev          # frontend only (works without backend)
npm run dev:all      # frontend + backend scaffold
```

Set `BACKEND_SERVICE_URL=http://localhost:4000` in `frontend/.env.local`.

## Backend team next steps

1. Implement routes in `backend/README.md`
2. Validate JWT from forwarded NextAuth session (same `AUTH_SECRET`)
3. Coordinate schema changes with frontend (Prisma owner: frontend)

## Reference

Previous backend code (session-auth, route handlers, smoke tests): see git commits before the handoff decoupling.
