# Glimmora Backend — Microservices Platform

Full microservices backend for the GlimmoraTeam frontend. Single public entry
through **Kong** on port **9000** (the frontend's `NEXT_PUBLIC_GLIMMORA_API_URL`).

## Architecture

```
                       ┌─────────────────────────────────────────┐
  Frontend  ─────────► │  Kong API Gateway  (:9000)               │
  (:3000)              └───────┬─────────────────────────────────┘
                               │ routes by path prefix
        ┌──────────────────────┼───────────────────────────────────────┐
        ▼          ▼           ▼            ▼          ▼        ▼        ▼
   auth-service  contributor enterprise superadmin universities women  mentor
                  (+ OAuth)                                              + email + file
        │
        ├── PostgreSQL (Neon)  → relational: accounts, profiles, SOW, plans, …
        ├── MongoDB (Atlas)    → audit logs + flexible documents
        ├── Redis              → OTP, sessions, rate-limit
        ├── Kafka              → domain event bus (audit.event, user.*, sow.*)
        └── Prometheus/Grafana → metrics & dashboards
```

## Services & routes (via Kong :9000)

| Service | Path prefix | Purpose |
|---|---|---|
| auth-service | `/api/v1/auth` | login, register, refresh, MFA, OTP, password (shared) |
| contributor-service | `/api/contributor`, `/api/public/credentials`, `/api/v1/auth/oauth`, `/api/v1/auth/contributor` | freelancer portal + **OAuth (contributors only)** |
| enterprise-service | `/api/v1/sow`, `/api/v1/sows`, `/api/v1/wizards`, `/api/v1/approvals`, `/api/v1/users`, `/api/enterprise` | SOW lifecycle, decomposition, projects |
| superadmin-service | `/api/superadmin`, `/api/admin`, `/api/v1/admin`, pricing, reviewer | Glimmora admin + **bulk CSV/Excel import** |
| universities-service | `/api/universities` | universities + **student bulk import** |
| women-service | `/api/women` | women teams + **member bulk import** |
| mentor-service | `/api/mentor` | review queue, mentorship, escalation |
| email-service | `/api/email` | SMTP send + templates |
| file-service | `/api/files` | Vercel Blob upload/download |

## Bulk import (universities / women / enterprise / superadmin)

Two-phase, reused from `shared/bulk_import.py`:
1. `commit=false` → preview parsed rows with per-row errors, **duplicate flags**
   (in-file + already-in-system), and a `selectable` hint for the per-row checkbox.
2. `commit=true` (+ optional `selectedRows`) → insert selected rows, generate
   temp passwords, optionally email credentials (`sendCredentials` toggle), audit.
   Supports `.csv` and `.xlsx`.

## Run

```bash
cd backend/infra
docker compose up --build
```

- Gateway:    http://localhost:9000
- Kong admin: http://localhost:9001
- Grafana:    http://localhost:3001  (admin / glimmora123)
- Prometheus: http://localhost:9090

Then point the frontend at it:

```
NEXT_PUBLIC_GLIMMORA_API_URL=http://localhost:9000
```

Config lives in `backend/.env`. Postgres (Neon) and Mongo (Atlas) are cloud;
Redis + Kafka run in the compose network.

Seeded on startup: super admin (`superadmin@glimmora.dev` / `glimmora123`) and
the two frontend service accounts.
