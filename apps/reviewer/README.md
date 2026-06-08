# Reviewer — standalone app (frontend + backend + shared DB)

Self-contained vertical for the **Reviewer** (enterprise QA). Shares nothing with
other roles except the **database**.

```
  Reviewer browser
        ▼
  apps/reviewer/frontend  (Next.js :3105)
        ▼  /api/v1/reviewer/*, /api/v1/auth/*
  apps/reviewer/backend   (FastAPI :8105)
        ▼  psycopg2
  Shared Neon Postgres
```

## What this role is
A reviewer is **enterprise-assigned** to a SOW at intake (step 2). They perform
**second-stage QA**: after a mentor accepts a contributor's submission, the work
routes to the reviewer's queue for final quality sign-off. The reviewer is NOT
part of the approval pipeline.

## Features
- **Assigned SOWs** — SOWs this reviewer was assigned to at intake (visible
  immediately, before any delivery).
- **Queue** — mentor-approved submissions awaiting QA.
- **Acceptance / decision** — approve / request changes; approval marks the
  contributor submission + task accepted (final two-stage step).
- **History, metrics.**

## How the DB is connected
Backend reads `DATABASE_URL` (shared Neon) from `apps/reviewer/backend/.env`.
The backend bundles `superadmin_app` (origin of the reviewer code) but mounts
ONLY the reviewer router — no admin endpoints. Owns/writes: `reviewer_assignments`,
`reviewer_recommendations`. Reads `admin_records` (kind=`sow_reviewer`, written
by enterprise at intake) joined to `enterprise_sows`; on approval updates
`contributor_submissions` + `contributor_tasks`.

## Backend API (port 8105, prefix `/api/v1/reviewer`)
| Method | Path | In → Out |
|---|---|---|
| POST | `/api/v1/auth/login` | login (auth bundled) |
| GET | `/dashboard` | — → `{reviewer, stats, assignments}` |
| GET | `/assigned-sows` | — → SOWs assigned at intake (`sow_reviewer`→`enterprise_sows`) |
| GET | `/projects` | assignments grouped by project |
| PATCH | `/assignments/{id}` | `{status}` → claim/approve; on approve marks submission accepted |
| POST | `/evidence/{id}/recommend` | `{recommendation,score,comment}` → recommendation |

Bearer-protected; reviewer role (admins allowed) via `get_current_user`.

## Working flow (inputs → outputs)
1. **Login** at `/reviewer/login` → own backend.
2. **Assigned SOW appears** — enterprise picks this reviewer at intake step 2
   (`admin_records.sow_reviewer`); `/assigned-sows` shows it right away.
3. **QA queue fills** — when a mentor accepts a contributor submission on that
   SOW, a `reviewer_assignments` row routes it here.
4. **Decision** — `PATCH /assignments/{id}` approve/complete → marks the
   submission `accepted` + task `completed` (shared DB), closing two-stage review.
- **Inputs:** login, QA decision + score + comment.
- **Outputs:** assignment status, recommendations, accepted submissions/tasks.

## Run it
```powershell
cd apps/reviewer/backend ; python -m uvicorn app:app --host 127.0.0.1 --port 8105
cd apps/reviewer/frontend ; npm install ; npm run dev -- --port 3105
```
Open http://localhost:3105/reviewer/login. Test: `solutions0678@gmail.com` / `Fayaz@123`.
