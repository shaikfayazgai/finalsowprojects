# Super Admin — standalone app (frontend + backend + shared DB)

Self-contained vertical for the **Super Admin / Platform Operations** user.
Shares nothing with other roles except the **database**.

```
  Super Admin browser
        ▼
  apps/super-admin/frontend  (Next.js :3102)
        ▼  /api/superadmin/*, /api/v1/auth/*
  apps/super-admin/backend   (FastAPI :8102)
        ▼  psycopg2
  Shared Neon Postgres
```

## What this role is
Glimmora's platform operator. Provisions all accounts, runs the **Commercial
gate** (final approval + assigns the mentor), reviews KYC, manages mentors/pools,
tenants, rubric/email templates, audit log, and governance.

## Features
- **Dashboard** — platform-wide counts.
- **Tenants** — enterprise workspaces + provisioning status.
- **Commercial gate** — final SOW approval; assigns the Glimmora mentor.
- **Mentors / Mentor pools** — provision + manage mentors.
- **KYC reviews** — approve/reject contributor identity (women track).
- **Users** — create/delete any role (credential provisioning, no invite links).
- **Audit log, rubric/email templates, AI agents, payment rails, system health.**

## How the DB is connected
Backend reads `DATABASE_URL` (shared Neon) from `apps/super-admin/backend/.env`
via `shared/db.py`. Owns/writes: `login_accounts` (all users), `admin_records`
(kind=`sow_mentor`/`sow_reviewer` — assignments), `contributor_kyc`,
`reviewer_assignments`, `audit_log`, `tenants`. Reads `enterprise_sows` for the
Commercial gate.

## Backend API (port 8102)
| Method | Path | In → Out |
|---|---|---|
| POST | `/api/v1/auth/login` | `{email,password}` → `{access_token,user}` (auth bundled) |
| GET | `/api/superadmin/dashboard` | — → platform counts |
| GET | `/api/superadmin/all-users` | `?caller_email` → tenant-scoped members |
| POST/DELETE | `/api/superadmin/users[/{id}]` | provision / delete account |
| GET | `/api/superadmin/mentors` / `/reviewers` / `/contributors` | rosters |
| GET/POST | `/api/superadmin/sows/{id}/mentor` | assign Glimmora mentor (Commercial gate) |
| GET | `/api/superadmin/kyc[/{id}]` | KYC queue + decisions |
| GET | `/api/superadmin/audit-log` | audit trail |

All Bearer-protected; requires admin/superadmin role (`get_current_admin`).

## Working flow (inputs → outputs)
1. **Login** at `/admin/login` → own backend `POST /api/v1/auth/login`.
2. **Provision users** — `POST /api/superadmin/users` writes `login_accounts`
   (random temp password emailed, forced reset). Output: a usable account in
   the shared DB visible to that role's app.
3. **Commercial gate** — an enterprise SOW that passed Finance→Legal→Security→
   Final lands here; super-admin approves and assigns a mentor
   (`POST /api/superadmin/sows/{id}/mentor` → `admin_records.sow_mentor`), which
   the mentor app then reads.
- **Inputs:** new-user fields, approval decision + mentor choice, KYC verdict.
- **Outputs:** accounts, SOW approvals, mentor/reviewer assignments, audit rows.

## Run it
```powershell
# backend :8102
cd apps/super-admin/backend ; python -m uvicorn app:app --host 127.0.0.1 --port 8102
# frontend :3102
cd apps/super-admin/frontend ; npm install ; npm run dev -- --port 3102
```
Open http://localhost:3102/admin/login.
