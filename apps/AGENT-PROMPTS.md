# Per-role development prompts (hand one to each agent)

Platform: **GTPROJECT (GlimmoraTeam)** — AI-governed workforce platform.
Architecture: each role = its own **frontend (Next.js) + backend (FastAPI)**;
the ONLY shared resource is the **Neon Postgres DB**. No shared gateway.

| Role | Frontend dir | Backend dir | FE port | BE port | FE routes |
|------|--------------|-------------|---------|---------|-----------|
| Super Admin | apps/super-admin/frontend | apps/super-admin/backend | 3102 | 8102 | src/app/admin/* |
| Enterprise  | apps/enterprise/frontend  | apps/enterprise/backend  | 3103 | 8103 | src/app/enterprise/* |
| Mentor      | apps/mentor/frontend      | apps/mentor/backend      | 3101 | 8101 | src/app/mentor/* |
| Reviewer    | apps/reviewer/frontend    | apps/reviewer/backend    | 3105 | 8105 | src/app/enterprise/reviewer/* |
| Freelancer  | apps/freelancer/frontend  | apps/freelancer/backend  | 3104 | 8104 | src/app/contributor/* |

## 🚧 HARD BOUNDARY RULE (applies to EVERY agent)
- You may **WRITE / EDIT ONLY inside your own role's two folders**:
  `apps/<your-role>/frontend/**` and `apps/<your-role>/backend/**`.
- You may **READ any other folder** (other roles, `backend/services/*`,
  `frontend4/`, `plans/`) for reference / to understand shared contracts — but
  you must **NEVER create, edit, move, or delete files outside your own role
  folder.** Not other roles, not `backend/`, not `frontend4/`, not the repo root.
- The DB is shared: you may read/write DB tables your role owns and READ tables
  other roles own — but you do this only through code **inside your own backend**.
  Never edit another role's backend to change its tables.
- If you need a change in another role's app or in shared code, do NOT make it —
  write it as a note in your role's README "Needs from other roles" and stop.
- Each app is self-contained (own `node_modules`, own `.env*`). Do not symlink
  or reach into another app's `node_modules`/config.

Shared rules for EVERY agent:
- Frontend = `apps/<role>/frontend` (Next.js 16, App Router, NextAuth v5, Tailwind, `@/components/meridian` design system). API calls go through `src/app/api/**` proxies → the role's own backend (base URL from `.env.local`, all `*_API_URL` point at the role's BE port). Auth via `requireRole()` (server) / NextAuth session (client).
- Backend = `apps/<role>/backend` (FastAPI). Routers in `<role>_app/routers/`. DB via `shared/db.py` (psycopg2) against `DATABASE_URL`. Auth: Bearer JWT decoded with `API_SECRET_KEY` in `shared/deps.py` (`get_current_user` / `get_current_admin`). `auth_app` already mounted (login). Run: `python -m uvicorn app:app --port <BE port>`.
- Verify with `npx tsc --noEmit` (frontend) before committing. Never commit `.env`/`.env.local`/`node_modules`/`.next` (gitignored). End commits with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- The DB is shared, so data written by one role is read by another (SOW → mentor/reviewer/contributor). Do NOT create a second DB.

---

## 1) SUPER ADMIN agent

✅ **WRITE ONLY in:** `apps/super-admin/frontend/**` and `apps/super-admin/backend/**`.
👀 **READ-ONLY (reference, never edit):** every other folder.

You own **apps/super-admin** (FE :3102 `src/app/admin/*`, BE :8102 `superadmin_app`). Login: `/admin/login`. Test acct: `superadmin@glimmora.dev`.

Role: Glimmora platform operator. Provisions all accounts, runs the **Commercial gate** (LAST approval stage — assigns the Glimmora mentor), reviews KYC, manages mentors/pools/tenants/templates/audit.

Backend endpoints (prefix `/api/superadmin`, port 8102): `dashboard`, `all-users?caller_email=` (tenant-scoped), `users` (POST create / DELETE `/users/{id}`), `mentors`, `reviewers`, `contributors`, `sows`, `sows/{id}/mentor` (GET/POST assign mentor), `sows/{id}/reviewer`, `kyc` + `kyc/{id}` (decision), `applications`, `audit-log`, `records/{kind}`, `tenants/{id}/provisioning-status`. Plus `/api/v1/auth/login`.
DB owns: `login_accounts`, `admin_records` (kind=sow_mentor/sow_reviewer), `contributor_kyc`, `audit_log`, `tenants`. Reads `enterprise_sows` (Commercial gate).
FE routes: `/admin/dashboard`, `/admin/tenants`, `/admin/sow` (Commercial gate workspace + decision modal), `/admin/mentors` (+ `[mentorId]`, pools), `/admin/kyc`, `/admin/users`, `/admin/audit`, rubric/email templates.

Known bugs / gaps to fix:
- **Admin KYC queue shows hardcoded MOCK cases** (Priya Venkat KYC-894 / Anita Ramesh KYC-892). Wire it to real `contributor_kyc` rows (real pending: Asha Devi, Womn Ok). Endpoint `/api/superadmin/kyc` exists.
- Commercial-gate approve comment **textarea drops all but the first char** (onChange/remount bug) → approve stays disabled. Fix in the commercial decision modal.
- Verify mentor-registry detail `/admin/mentors/{id}` loads REAL mentors (falls back to `/api/superadmin/mentors`), not only mock.
Deliver: real KYC queue, working Commercial gate (assign mentor persists to `admin_records.sow_mentor`), real users/mentors/tenants lists.

---

## 2) ENTERPRISE agent

✅ **WRITE ONLY in:** `apps/enterprise/frontend/**` and `apps/enterprise/backend/**`.
👀 **READ-ONLY (reference, never edit):** every other folder.

You own **apps/enterprise** (FE :3103 `src/app/enterprise/*`, BE :8103 `enterprise_app`). Login: `/enterprise/login`. Test acct: `iotcourseiot@gmail.com`.

Role: the client. Uploads a SOW, assigns a **reviewer at intake step 2 (MANDATORY)**, runs internal approvals **Finance → Legal → Security → Final sign-off** (Commercial is Glimmora/super-admin, LAST), then decomposes the SOW into tasks and manages delivery/billing/tenant.

Backend (prefix mostly `/api/v1`, port 8103): `sows/admin/all`, `sows/enterprise/all`, `sows/enterprise/{id}`, `POST sows`, approvals routers (stage approve/send-back), `decomposition/plans[/{id}]` (+ tasks/milestones/critical-path/review/checklist), `.../plans/{planId}/tasks/{taskId}/assign`, `billing*`, `portfolio`/`projects`. Plus `/api/v1/auth/login`.
DB owns: `enterprise_sows`, `enterprise_plans` (JSONB `tasks`), `contributor_submissions` (acceptance). Writes `admin_records.sow_reviewer` at intake. SOW title field is `projectTitle` (NOT `title`).
FE routes: `/enterprise/dashboard`, `/enterprise/sow/intake` (4-step wizard), `/enterprise/decomposition`, `/enterprise/projects`, `/enterprise/acceptance`, `/enterprise/review` + `/enterprise/reviewer/*`, `/enterprise/billing/*`, `/enterprise/settings/tenant` (members), analytics, compliance, audit.

Known rules / bugs:
- **Approval order LOCKED:** Finance → Legal → Security → Final sign-off → Commercial(Glimmora). Commercial is ALWAYS last; show "Stage 4/5 · Commercial pending" while awaiting.
- **Reviewer assignment is MANDATORY** at intake step 2 (cannot submit without it).
- **Tenant members list must be tenant-scoped** (inviter-based `tenant_id`) — show only this enterprise's members + reviewers, not all platform accounts.
- Enterprise **Policies** settings save is a mock no-op (reverts on reload) — make it persist.
- Pricing/margin: enterprise sees the DEAL price; Glimmora's actual cost + profit% is hidden from this role. GST both sides.
Deliver: working intake (file→Vercel Blob, mandatory reviewer), correct approval pipeline, decomposition that produces tasks visible to mentor/contributor, tenant-scoped members.

---

## 3) MENTOR agent

✅ **WRITE ONLY in:** `apps/mentor/frontend/**` and `apps/mentor/backend/**`.
👀 **READ-ONLY (reference, never edit):** every other folder.

You own **apps/mentor** (FE :3101 `src/app/mentor/*`, BE :8101 `mentor_app`). Login: `/mentor/login`. Test acct: `mywebsitebuilt@gmail.com` / `Fayaz@123`.

Role: Glimmora-assigned (at Commercial gate) first-stage QA. Reviews contributor submissions, runs mentorship, raises escalations. **Never sees payout/cost.**

Backend (prefix `/api/mentor`, port 8101): `dashboard`, `assigned-sows` (joins `admin_records.sow_mentor`→`enterprise_sows`), `queue` (`?status&priority&q&page`; includes unclaimed `pool`), `sow/{id}/tasks` (decomposed tasks, NO payout), `queue/{id}` + `queue/{id}/decision` (accept/rework/escalate), `mentorship*`, `escalation*`, `history`, `profile`, `settings`. Plus `/api/v1/auth/login`.
DB owns (scoped by `mentor_id` = account id): `mentor_reviews`, `mentor_mentorships`, `mentor_escalations`, `mentor_notes`, `mentor_profiles`. Reads `admin_records.sow_mentor`, `enterprise_plans`.
FE routes: `/mentor/dashboard`, `/mentor/queue` (+ `[reviewId]` diff/audit), `/mentor/sow/[sowId]` (assigned-SOW tasks+status), `/mentor/mentorship`, `/mentor/escalation`, `/mentor/history`, `/mentor/profile`, `/mentor/settings/*`.

Known state / gaps:
- Demo SEEDING is DISABLED (`_ensure_seeded` is a no-op) and dashboard is real per-mentor. Keep it real — no mock personas (the old "Priya" leak is fixed; `useActiveMentor` derives name from session).
- **SOW→mentor queue routing still PENDING:** assigning a mentor at Commercial writes `sow_mentor` and the SOW shows under "Assigned SOWs", but a contributor submission does NOT yet create a `mentor_reviews` row in the mentor's queue. Build that routing (submission on an assigned SOW → `mentor_reviews` for that mentor). This is the top task.
- Two-stage: after mentor accepts, work must route to the SOW's chosen reviewer.
Deliver: live queue fed by real submissions, working decision→reviewer handoff, real mentorship/escalation.

---

## 4) REVIEWER agent

✅ **WRITE ONLY in:** `apps/reviewer/frontend/**` and `apps/reviewer/backend/**`.
👀 **READ-ONLY (reference, never edit):** every other folder.

You own **apps/reviewer** (FE :3105, BE :8105). **FE routes live under `src/app/enterprise/reviewer/*`** (portal mounted there). Login: `/reviewer/login`. Test acct: `solutions0678@gmail.com` / `Fayaz@123`.

Role: enterprise-assigned (at intake step 2) second-stage QA. After a mentor accepts, work routes here for final sign-off. NOT in the approval pipeline.

Backend (prefix `/api/v1/reviewer`, port 8105 — bundles `superadmin_app` but mounts ONLY the reviewer router): `dashboard` (stats+assignments), `assigned-sows` (joins `sow_reviewer`→`enterprise_sows`), `projects`, `PATCH assignments/{id}` (claim/approve; on approve marks `contributor_submissions` accepted + `contributor_tasks` completed), `POST evidence/{id}/recommend`. Plus `/api/v1/auth/login`.
DB owns: `reviewer_assignments`, `reviewer_recommendations`. Reads `admin_records.sow_reviewer`, `enterprise_sows`; updates contributor submission/task on approve.
FE routes: `/enterprise/reviewer/dashboard`, `/enterprise/reviewer` (queue), `/enterprise/reviewer/delivery`, `/enterprise/reviewer/history`, `/enterprise/reviewer/metrics`. (Login at `/reviewer/login`.)

Known state / gaps:
- "Assigned SOWs" section + endpoint exist and work (shows SOWs from intake immediately).
- QA queue (`reviewer_assignments`) only fills when a mentor hands off — depends on the MENTOR agent's submission→review→handoff routing. Coordinate.
- Build a reviewer **SOW detail** (tasks+status) like the mentor's `/mentor/sow/[sowId]` — reviewer needs its own tasks endpoint (reviewer role can't call `/api/mentor/*`).
- Blank "'s queue" name when reviewer has no display name — derive from email (already patched in layout; keep).
Deliver: clickable assigned-SOW detail, working QA decision that closes the two-stage flow.

---

## 5) FREELANCER / CONTRIBUTOR agent

✅ **WRITE ONLY in:** `apps/freelancer/frontend/**` and `apps/freelancer/backend/**`.
👀 **READ-ONLY (reference, never edit):** every other folder.

You own **apps/freelancer** (FE :3104 `src/app/contributor/*`, BE :8104 `contributor_app`). Login: `/contributor/login`. Test acct: `mychatgptcourse@gmail.com` / `Fayaz@123`.

Role: the worker. Self-registers (**freelancers need NO KYC** — only women-workforce track is KYC-gated). Declares skills, expresses interest in decomposed tasks, works in a workroom, submits deliverables, tracks earnings/payouts.

Backend (prefix `/api/contributor`, port 8104): `dashboard`, `tasks` (+ `/tasks/{id}`, `/workroom`, discovery/summary), `notifications`, `settings` (+ `security/2fa/*`, `change-password`), `earnings/kyc/status`, profile/credentials/learning/support. Plus `oauth` (Google/MS) + `/api/v1/auth/login` + `public_router`.
DB owns: contributor profile, `contributor_submissions`, `contributor_tasks`, earnings/payout tables, `contributor_kyc` (women only). Reads `enterprise_plans.tasks` (work to pick up).
FE routes: `/contributor/dashboard`, `/contributor/tasks/*` (discovery, workroom, submit), `/onboarding/*` (consent→skills→availability→evidence→payout→done — NO KYC step for freelancers), `/contributor/earnings`, `/contributor/credentials`, `/contributor/settings`, etc.

Known state / bugs:
- Freelancer KYC gate is REMOVED (`requiresKycAdminApproval` = women_wf only); freelancers land on the dashboard directly. Keep it.
- Onboarding skills page: hydration bug fixed (init empty, hydrate draft in useEffect); skills grouped by domain (Engineering/Data/Design/Content). Keep.
- **"I'm interested" → task assignment → submit → routes to mentor queue is the main flow to finish.** Express-interest on a decomposed task, get assigned, do work, submit a deliverable that lands in the assigned mentor's queue (coordinate with MENTOR agent on the submission→`mentor_reviews` routing).
- KYC submission step is mock (doesn't persist to `contributor_kyc`) — only matters for women track.
Deliver: working task discovery + interest + workroom + deliverable submission feeding the mentor/reviewer two-stage flow; real earnings/payout views.

---

## Running an app (any role)
```powershell
# backend
cd apps/<role>/backend ; python -m uvicorn app:app --host 127.0.0.1 --port <BE port>
# frontend (first time: npm install)
cd apps/<role>/frontend ; npm install ; npm run dev -- --port <FE port>
```
Or all at once from repo root:
```powershell
powershell -ExecutionPolicy Bypass -File apps\run_all.ps1            # 5 backends
powershell -ExecutionPolicy Bypass -File apps\run_all_frontends.ps1  # 5 frontends
```
