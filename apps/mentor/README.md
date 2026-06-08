# Mentor — standalone app (frontend + backend + shared DB)

A fully self-contained vertical for the **Mentor** end user. It does not depend
on any other role's frontend or backend. The only thing shared with the other
roles is the **database**.

```
  Mentor browser
        │
        ▼
  apps/mentor/frontend   (Next.js, port 3101)
        │   server-side API proxies (/api/mentor/*, /api/v1/auth/*)
        ▼
  apps/mentor/backend    (FastAPI, port 8101)
        │   psycopg2
        ▼
  Shared Neon Postgres   (the ONLY shared resource)
```

## What this role is
A mentor is **Glimmora-assigned** to a SOW at the Commercial gate. The mentor
reviews contributor work (first-stage QA), runs mentorship sessions, and can
raise escalations. Mentors see the work and its state — **never payout/cost**.

## Features
- **Dashboard** — pending reviews, completed, mentees, open escalations + the
  next priority review (real, per-mentor; no mock).
- **Assigned SOWs** — SOWs assigned to this mentor (Commercial gate), clickable
  to a detail view of the SOW's decomposed tasks + statuses.
- **Queue** — review queue (own assigned reviews + unclaimed `pool` items).
- **SOW detail** — every decomposed task with status/assignee/effort/skills.
- **Mentorship** — mentees, sessions, notes.
- **Escalations** — raise / track / resolve.
- **History, Profile, Settings, Notifications.**

## How the DB is connected
The backend reads `DATABASE_URL` from `apps/mentor/backend/.env` (the **shared
Neon** instance) via `shared/db.py` → psycopg2. The mentor owns these tables
(scoped by `mentor_id` = the signed-in account id):

| Table                | Holds                                  |
|----------------------|----------------------------------------|
| `mentor_reviews`     | review items + decision/score/status   |
| `mentor_mentorships` | mentor ↔ mentee links                   |
| `mentor_escalations` | escalations raised by the mentor        |
| `mentor_notes`       | mentee notes                            |
| `mentor_profiles`    | the mentor's profile/settings           |

Cross-role data it READS (written by other roles, same DB):
- `admin_records` (kind=`sow_mentor`) — who assigned this mentor to which SOW
  (written by the super-admin Commercial gate).
- `enterprise_sows` / `enterprise_plans` — the SOW + its decomposed tasks
  (written by enterprise).

## Backend API (port 8101, prefix `/api/mentor`)
| Method | Path                         | In → Out |
|--------|------------------------------|----------|
| GET  | `/dashboard`                   | — → `{stats, recent_queue}` |
| GET  | `/assigned-sows`               | — → `{sows[], total}` (joined from `sow_mentor` → `enterprise_sows`) |
| GET  | `/queue`                       | `?status&priority&q&page` → paged reviews |
| GET  | `/sow/{sow_id}/tasks`          | sow_id → decomposed tasks (no payout) |
| GET  | `/queue/{review_id}`           | review_id → one review |
| POST | `/queue/{review_id}/decision`  | `{decision, score, comments}` → updated review |
| GET/POST | `/mentorship`, `/mentorship/{id}`, `/mentorship/{id}/note` | mentees + notes |
| GET/POST/PATCH | `/escalation*`        | escalations |
| GET  | `/history`                     | decided reviews |
| GET/PATCH | `/profile`, `/settings`    | profile + settings |
| POST | `/api/v1/auth/login`           | `{email, password}` → `{access_token, user}` (auth is bundled — no gateway) |

All endpoints are Bearer-protected (`shared/deps.get_current_user`); the JWT is
decoded with `API_SECRET_KEY` (same secret across roles so one login works).

## Working flow (inputs → outputs)
1. **Login** — mentor signs in at `/mentor/login`; frontend posts to its own
   backend `POST /api/v1/auth/login` → JWT stored in the NextAuth session.
2. **Assigned SOW appears** — super-admin assigns this mentor at the Commercial
   gate (writes `admin_records.sow_mentor`). Mentor's `/assigned-sows` joins
   that to `enterprise_sows` → SOW shows on Dashboard + Queue.
3. **Open SOW** → `/mentor/sow/{id}` calls `/sow/{id}/tasks` → shows the
   decomposed tasks + their live statuses (empty state if not decomposed yet).
4. **Review** — a contributor submission routed to this mentor lands in
   `/queue`; mentor opens it and `POST /queue/{id}/decision` (accept/rework/
   escalate) updates `mentor_reviews`; two-stage work then routes to the reviewer.

- **Inputs:** email/password (login), decision + score + comments (review),
  note text (mentorship), escalation fields.
- **Outputs:** dashboard stats, assigned SOW list, task statuses, review
  verdicts persisted to the shared DB.

## Run it
```powershell
# backend (port 8101) — from apps/mentor/backend
python -m uvicorn app:app --host 127.0.0.1 --port 8101

# frontend (port 3101) — from apps/mentor/frontend (needs its own npm install)
npm install
npm run dev -- --port 3101
```
`apps/mentor/frontend/.env.local` points ALL backend traffic at `:8101`
(`GLIMMORA_API_URL`, `*_API_URL`, gateway fallback) so this app talks only to
its own backend. Open http://localhost:3101/mentor/login.

Test account: `mywebsitebuilt@gmail.com` / `Fayaz@123`.
