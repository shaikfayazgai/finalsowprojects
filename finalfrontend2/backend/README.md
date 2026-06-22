# Glimmora Backend — handoff scaffold

This folder is a **clean starting point** for the backend team. The previous Hono implementation was removed from this workspace; reference the git history on branch `archive/backend-handoff-*` (or commits before this decoupling) if you need the old code.

The **frontend owns Prisma** (`frontend/prisma/`). The backend service should talk to PostgreSQL via its own data layer (Prisma, Drizzle, raw SQL, etc.) — coordinate schema ownership with the frontend team.

## Quick start

```bash
cp backend/.env.example backend/.env
npm install          # from repo root (workspaces)
npm run dev:backend  # http://localhost:4000
```

Health check: `GET http://localhost:4000/api/v1/health`

## Frontend integration

The Next.js app proxies selected routes to this service via `frontend/src/lib/api/backend-service.ts`.

Set in `frontend/.env.local`:

```env
BACKEND_SERVICE_URL=http://localhost:4000
```

Proxied public URLs stay at `/api/*` on the frontend (`:3000`). Implement the **backend paths** below under `/api/v1/*`.

## API contract (implement these)

| Backend route | Frontend proxy | Notes |
|---------------|----------------|-------|
| `POST /api/v1/auth/register` | `POST /api/auth/register` | |
| `POST /api/v1/auth/validate` | `POST /api/auth/validate` | |
| `POST /api/v1/auth/otp/*` | `POST /api/auth/otp/*` | |
| `POST /api/v1/auth/password/forgot` | `POST /api/auth/forgot-password` | |
| `POST /api/v1/auth/password/reset` | `POST /api/auth/password/reset` | |
| `GET /api/v1/auth/sso/discover` | `GET /api/auth/sso/discover` | |
| `POST /api/v1/auth/sso-intent` | `POST /api/auth/sso-intent` | |
| `POST /api/v1/auth/password/change` | `POST /api/auth/password/change` | |
| `GET /api/v1/me` | `GET /api/me` | |
| `GET /api/v1/sessions` | `GET /api/sessions` | |
| `DELETE /api/v1/sessions/:id` | `DELETE /api/sessions/:id` | |
| `GET/POST/PATCH /api/v1/submissions` | `/api/submissions` | Full CRUD + submit/withdraw/artifacts |
| `GET/PATCH /api/v1/notifications` | `/api/notifications` | |
| `GET/POST/PATCH /api/v1/sow` | `/api/sow` | Lifecycle: submit, approve, reject, archive, withdraw, send-back |
| `GET /api/v1/enterprise/workforce` | `GET /api/enterprise/workforce` | |
| `POST /api/v1/enterprise/tasks/:id/assign` | `POST /api/enterprise/tasks/:id/assign` | |
| `POST /api/v1/enterprise/tasks/:id/reassign` | `POST /api/enterprise/tasks/:id/reassign` | |
| `GET /api/v1/matching/tasks/:id/candidates` | `GET /api/matching/tasks/:id/candidates` | |
| `GET/POST /api/v1/enterprise/review-queue` | `/api/enterprise/review-queue` | claim, release, decide |
| `POST /api/v1/contributor/tasks/:id/accept` | `POST /api/contributor/tasks/:id/accept` | |
| `POST /api/v1/contributor/tasks/:id/decline` | `POST /api/contributor/tasks/:id/decline` | |
| `GET/POST /api/v1/mentor/queue` | `/api/mentor/queue` | submissions claim/release/decide |
| `GET/POST/PATCH /api/v1/payouts` | `/api/payouts` | methods, hold, retry, release-hold |
| `POST /api/v1/razorpay/*` | `/api/razorpay/*` | create-order, webhooks |
| `GET /api/v1/health` | — | Liveness |

## Auth model

- NextAuth stays in the **frontend** (`frontend/src/auth.ts`).
- Proxied requests forward the session cookie / JWT. Validate using the same `AUTH_SECRET` as NextAuth.
- See `docs/architecture/MONOREPO_ARCHITECTURE.md` and `docs/phase-2/README.md`.

## What stays in the frontend (not your scope initially)

- `/api/auth/[...nextauth]` and OAuth/SAML/OIDC callbacks
- Contributor profile, credentials, decomposition, admin mocks
- Routes that still use Prisma directly in `frontend/src/lib/` and `frontend/src/app/api/`

## Dev scripts (frontend-owned)

Database seeds and demo users live in `frontend/scripts/`:

```bash
npm run ensure:admin
npm run ensure:enterprise
npm run ensure:contributor
```

Requires `frontend/.env.local` with `DATABASE_URL`.
