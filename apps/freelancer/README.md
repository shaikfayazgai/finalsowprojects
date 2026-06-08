# Freelancer / Contributor — standalone app (frontend + backend + shared DB)

Self-contained vertical for the **Freelancer / Contributor** (the worker who
does the tasks). Shares nothing with other roles except the **database**.

```
  Contributor browser
        ▼
  apps/freelancer/frontend  (Next.js :3104)
        ▼  /api/contributor/*, /api/public/*, /api/v1/auth/*
  apps/freelancer/backend    (FastAPI :8104)
        ▼  psycopg2
  Shared Neon Postgres
```

## What this role is
The contributor self-registers (freelancers need **no KYC** — they work
directly; only the women-workforce track is KYC-gated). They declare skills,
discover/express interest in decomposed SOW tasks, do the work in a workroom,
submit deliverables, and track earnings/payouts.

## Features
- **Dashboard** — tasks, earnings, recent activity (real, per-account).
- **Tasks** — discovery, "I'm interested", workroom, submit deliverable.
- **Onboarding** — consent → skills (grouped by domain) → availability →
  evidence → payout → done (NO KYC step for freelancers).
- **Earnings / payouts, credentials, learning, support, profile, settings, 2FA.**

## How the DB is connected
Backend reads `DATABASE_URL` (shared Neon) from `apps/freelancer/backend/.env`.
Owns/writes: contributor profile, `contributor_submissions`, `contributor_tasks`,
earnings/payout tables, `contributor_kyc` (women track only). Reads decomposed
tasks from `enterprise_plans` (written by enterprise); submissions flow to the
mentor/reviewer queues via the shared DB.

## Backend API (port 8104, prefix `/api/contributor`)
| Method | Path | In → Out |
|---|---|---|
| POST | `/api/v1/auth/login` | login (auth bundled) |
| POST | `/api/v1/auth/oauth/*` | Google/Microsoft sign-in |
| GET | `/dashboard` | — → `{contributor, stats, recent_tasks, recent_earnings}` |
| GET | `/tasks`, `/tasks/{id}`, `/tasks/{id}/workroom` | task discovery + work |
| GET | `/earnings/kyc/status` | KYC status (women track) |
| POST | `/settings/security/*` | 2FA, change password |

Bearer-protected via `get_current_user`.

## Working flow (inputs → outputs)
1. **Register / login** at `/contributor/login` (freelancers self-serve, no KYC
   gate → straight to dashboard).
2. **Onboard** — declare skills (grouped: Engineering / Data / Design / Content),
   availability, evidence, payout.
3. **Find work** — browse decomposed tasks (`enterprise_plans.tasks`), express
   interest; enterprise assigns.
4. **Work + submit** — workroom → submit deliverable (`contributor_submissions`),
   which routes to the assigned mentor's queue, then the reviewer.
- **Inputs:** login/registration, skills + level, interest, deliverable.
- **Outputs:** profile, submissions, task status, earnings — in the shared DB,
  read by mentor (review) and reviewer (QA).

## Run it
```powershell
cd apps/freelancer/backend ; python -m uvicorn app:app --host 127.0.0.1 --port 8104
cd apps/freelancer/frontend ; npm install ; npm run dev -- --port 3104
```
Open http://localhost:3104/contributor/login. Test: `mychatgptcourse@gmail.com` / `Fayaz@123`.
