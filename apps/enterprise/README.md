# Enterprise — standalone app (frontend + backend + shared DB)

Self-contained vertical for the **Enterprise** user (the client buying work).
Shares nothing with other roles except the **database**.

```
  Enterprise browser
        ▼
  apps/enterprise/frontend  (Next.js :3103)
        ▼  /api/v1/sows*, /api/v1/decomposition*, /api/v1/auth/*
  apps/enterprise/backend   (FastAPI :8103)
        ▼  psycopg2
  Shared Neon Postgres
```

## What this role is
The enterprise admin uploads a SOW, assigns a **reviewer** at intake (step 2),
runs the internal approval pipeline (Finance → Legal → Security → Final), then
hands off to Glimmora's Commercial gate. After approval the SOW is decomposed
into tasks; the enterprise manages delivery, acceptance, billing, and its tenant.

## Features
- **SOW workspace / intake** — upload SOW + Vercel Blob file, assign reviewer.
- **Approvals** — Finance→Legal→Security→Final sign-off (Commercial is Glimmora).
- **Decomposition** — break the SOW into tasks/milestones; assign tasks.
- **Delivery / Projects / Acceptance / QA review.**
- **Finance** — billing, rate cards, payouts (deal price; profit hidden by role).
- **Settings → Tenant** — members + roles (tenant-scoped to this enterprise).

## How the DB is connected
Backend reads `DATABASE_URL` (shared Neon) from `apps/enterprise/backend/.env`.
Owns/writes: `enterprise_sows`, `enterprise_plans` (JSONB tasks),
`contributor_submissions` (acceptance). Account/tenant data in `login_accounts`
is shared; reviewer/mentor assignment records (`admin_records`) are written here
(reviewer at intake) and by super-admin (mentor at Commercial gate).

## Backend API (port 8103)
| Method | Path | In → Out |
|---|---|---|
| POST | `/api/v1/auth/login` | login (auth bundled) |
| GET | `/api/v1/sows/admin/all`, `/enterprise/all`, `/enterprise/{id}` | SOW lists/detail |
| POST | `/api/v1/sows` | create SOW |
| approvals | `/api/v1/...approvals...` | stage approve / send-back |
| GET | `/api/v1/decomposition/plans[/{id}]` | plans + tasks + milestones |
| POST | `.../plans/{planId}/tasks/{taskId}/assign` | assign a task |
| billing | `/api/v1/billing*` | billing + review |

Bearer-protected.

## Working flow (inputs → outputs)
1. **Login** at `/enterprise/login`.
2. **Intake** — upload SOW (file → Vercel Blob), pick a **reviewer** (mandatory,
   step 2 → `admin_records.sow_reviewer`), set approvers, submit.
3. **Approvals** — Finance→Legal→Security→Final advance the SOW; then it leaves
   for the Glimmora Commercial gate.
4. **Decompose** — after approval, break into tasks (`enterprise_plans.tasks`),
   which mentors/contributors/reviewers then see.
- **Inputs:** SOW doc + metadata, reviewer pick, approval decisions, task defs.
- **Outputs:** `enterprise_sows`/`enterprise_plans` rows, assignment records,
  acceptance updates — all in the shared DB, read by mentor/reviewer/contributor.

## Run it
```powershell
cd apps/enterprise/backend ; python -m uvicorn app:app --host 127.0.0.1 --port 8103
cd apps/enterprise/frontend ; npm install ; npm run dev -- --port 3103
```
Open http://localhost:3103/enterprise/login.
