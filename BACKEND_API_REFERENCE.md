# GlimmoraTeam — Backend API & Data Reference
**Connected APIs · routes · data handling · data-schema structures.** Companion to `FULL_E2E_TEST_MANUAL.md`. Captured from the live codebase + DB.

---

## 1. Architecture & data handling (how it all connects)

```
Browser (Next.js, :3000)
  └─ NextAuth session cookie (per-portal login; JWT holds backend access token)
       └─ Next.js API proxy routes  (src/app/api/**/route.ts, 302 routes)
            └─ adds  Authorization: Bearer <backend JWT>  +  forwards to…
                 └─ GATEWAY  (backends/gateway.py, :9000)   ── prefix-routes to ──►
                      ├─ mentor       :8101   (mentor_app)
                      ├─ super-admin  :8102   (superadmin_app)   ── "Glimmora"/admin
                      ├─ enterprise   :8103   (enterprise_app)
                      ├─ freelancer   :8104   (contributor_app)  ── "contributor"
                      └─ reviewer     :8105   (superadmin_app/reviewer router)
```

**Where data lives**
- **Postgres (Neon `glimmora`, shared by all 5 backends)** — the source of truth for business data (SOWs, plans, tasks, submissions, payouts, ratings, accounts, notifications…). 127 tables.
- **MongoDB** — audit logs (`write_audit` → Mongo; super-admin audit reads it). Set `MONGODB_URI`.
- **Blob storage** — uploaded files (SOW docs, task reference files, contributor evidence) via `shared/blob.py`; rows store the `url`.

**Auth** — shared JWT (`shared/security.py`, `create_access_token`, HS256, `API_SECRET_KEY`). A token minted by ANY backend decodes in ALL (same secret). `get_current_user` (`shared/deps.py`) reads `Authorization: Bearer …`; missing → 401 `"Missing bearer token"`. Claims: `{sub, email, role, tenant_id}`.

**psycopg2 gotcha** — freelancer `db.fetch_all/fetch_one` **FLATTEN the `data` JSONB to top-level keys**; other backends keep JSONB as nested dicts/lists. `db.execute(... RETURNING *)` returns the row.

**Notifications** — `shared/notify.py` (in all 4 delivery backends): `create_notification(account_id, …)` + `notify_role(roles, …)` write **directly** to `contributor_notifications` (no api-to-api). Read endpoint only in freelancer (`/api/v1/notifications`).

**Pricing/money** — contributor paid in FULL; `clientMinor = cost ÷ (1−commission%) × (1+gst%)`; commission 15%, GST 18% (super-admin-configurable via `platform_settings.data.commission`). Enterprise sees only client price + GST.

---

## 2. Backends & ports
| Backend | Port | App package | Owns (primary tables) |
|---|---|---|---|
| mentor | 8101 | `mentor_app` | mentor_reviews, mentor_escalations, mentor_sessions, mentor_notes, mentor_profiles |
| super-admin | 8102 | `superadmin_app` | admin_records, complaints, governance_cases, rubric_templates, kyc, payment_rails, platform_settings |
| enterprise | 8103 | `enterprise_app` | enterprise_sows, decomp_plans, decomp_tasks, decomp_milestones, enterprise_review_queue, enterprise_workforce_members |
| freelancer (contributor) | 8104 | `contributor_app` | contributor_tasks, submissions, contributor_uploads, payouts, contributor_notifications, contributor_* |
| reviewer | 8105 | `superadmin_app` (reviewer router) | reviewer_assignments, reviewer_recommendations, work_ratings |
| **gateway** | 9000 | `backends/gateway.py` | (router only — proxies by path prefix) |

Every backend ALSO serves shared auth `/api/v1/auth/*` so JWTs interoperate.

---

## 3. Gateway routing (path prefix → backend; longest prefix wins)
| Prefix | → Backend |
|---|---|
| `/api/v1/auth` | super-admin (any works) |
| `/api/superadmin`, `/api/admin`, `/api/v1/admin`, `/api/ai`, `/api/audit`, `/api/email`, `/api/file-scan`, `/api/breadcrumb`, `/api/v1/matching`, `/api/v1/settings`, `/api/v1/config` | super-admin |
| `/api/v1/reviewer` | reviewer |
| `/api/mentor`, `/api/v1/mentor`, `/api/v1/sessions`, `/api/sessions` | mentor |
| `/api/contributor`, `/api/public/credentials`, `/api/v1/submissions`, `/api/v1/notifications` | freelancer |
| `/api/v1/enterprise`, `/api/v1/sow`, `/api/v1/sows`, `/api/v1/approvals`, `/api/v1/users`, `/api/v1/wizards`, `/api/sow` | enterprise |

---

## 4. Endpoint catalog (by backend → router → method + path)
> Full path = gateway prefix isn't added; the path below already includes each router's `prefix`. (`{x}` = path param.)

### 4.1 Shared AUTH (every backend, `/api/v1/auth`)
`POST /login` · `/validate` · `/refresh` · `/logout` · `/logout-all` · `GET /me` · `GET /email-available` · `POST /register/{contributor|mentor|enterprise|reviewer}` · MFA: `/mfa/setup/init|confirm`, `/mfa/verify`, `/mfa/recovery` · Password: `/password/forgot|reset|change|setup-after-otp` · OTP: `/otp/send-email|verify-email|send-phone|verify-phone` · `/application-upload`. Sessions: `GET /api/v1/sessions`, `DELETE /api/v1/sessions/{id}`. SSO (super-admin): `/api/v1/auth/oidc/{tenantSlug}/callback`, `/saml/{tenantSlug}/callback`.

### 4.2 ENTERPRISE (`:8103`)
- **Approvals** `/api/v1/approvals`: `GET /{sow_id}` · `POST /{sow_id}/stage/{stage}/decide` (gate Approve/Send-back/Reject).
- **Manual SOW** `/api/v1/sow`: `GET /` · `POST /` · `POST /upload` · `POST /upload-file` · `POST /admin/create` · `POST /{id}/reviewer` (assign reviewer) · `GET/PATCH/DELETE /{id}` · extraction/gap/clauses/sections/commercial-details/approval-stages · `POST /{id}/{generate|close|confirm-and-submit|submit|approve|reject|send-back|withdraw|archive}` · `POST /{id}/approval-stage/{stage_key}/{approve|reject}` · approval-messages.
- **SOWs (list/read)** `/api/v1/sows`: `GET /` · `/enterprise/all` · `/admin/all` · `/{id}` · `POST /{id}/action` · risk/hallucination/export.
- **Decomposition (v2, live)** `/api/v1/enterprise/decomposition` (`decomp_plans.py`): `GET/POST /plans` · `GET /plans/{id}` · `GET /sows/{sow_id}/work-context` · `GET/POST /plans/{id}/tasks` · `GET /plans/{id}/tasks/{tid}/interests` · `/timeline` · `POST …/publish` · `POST …/select` (assign) · `POST /plans/{id}/submit` · `/send-back` · `/approve` · `GET /plans/{id}/payout-status` · `/payment-transactions` · `POST /plans/{id}/request-payout` · `/release-payment` · `/payout-contributors` · `/reprice` · `/activate` · `/archive` · `/copy`.
- **Review queue (enterprise acceptance, 3rd gate)** `/api/v1/enterprise/review-queue`: `GET /` · `/history` · `GET /{sid}` · `POST /{sid}/{claim|release|decide}`.
- **Workforce** `/api/v1/enterprise`: `GET/POST /workforce` · import preview/apply · `POST /tasks/{id}/assign|reassign`.
- **Users/Wizards** `/api/v1/users` (search, profile, picture) · `/api/v1/wizards` (SOW intake wizard steps 1–9).

### 4.3 SUPER-ADMIN / GLIMMORA (`:8102`)
- **SOW commercial gate** `/api/superadmin`: `GET /sows` · `GET /sows/{id}/mentor` · `POST /sows/{id}/assign-mentor` · `GET /sows/{id}/reviewer` · `POST /sows/{id}/assign-reviewer` · `GET /mentors|contributors|reviewers|all-users` · `GET/POST/PATCH/DELETE /records/{kind}` (admin_records, incl. `sow_mentor`).
- **Audit/dashboard** `/api/superadmin`: `GET /dashboard` · `/audit-log` · `/audit-log/export` · `DELETE /audit-log/{id}` · `/notifications` · `POST /notifications/{id}/dismiss`.
- **Pricing/SOW decision** front-door also via `/api/admin/sow*` proxies → these.
- **Governance/KYC/Complaints/Rubrics/Partnerships/Payment-rails/Email-templates/Roles** — `/api/superadmin/{governance|kyc|complaints|rubric-templates|partnerships/*}`, `/api/payment-rails/*`, `/api/admin/email-templates/*`, `GET /api/superadmin/roles`.
- **AI/Matching** `/api/admin/agents/*`, `POST /api/ai/invoke`, `GET /api/v1/matching/tasks/{id}/candidates`.
- **Reviewer router lives here** (served on :8105) `/api/v1/reviewer`: `GET /dashboard` · `/assigned-sows` · `/projects` · `PATCH /assignments/{id}` (QA Accept/Rework/Reject + rating) · `POST /evidence/{id}/recommend`.

### 4.4 MENTOR (`:8101`)
- **v1 (live decisions)** `/api/v1/mentor`: `GET /me` · `POST /me` (onboarding) · `GET /queue` · `/assigned-sows` · `GET /submissions/{id}` · `POST /submissions/{id}/{claim|release|decide}` (Accept/Rework/Reject + 5★).
- **mentor** `/api/mentor`: `GET /dashboard` · `/assigned-sows` · `/queue` · `/queue/{id}` · `POST /queue/{id}/decision` · mentorship/escalation/history/profile/settings.
- **portal** `/api/mentor/portal`: dashboard, decisions, escalations, mentorship-stats, adjudicate.
- **notes/sessions** `/api/mentor`: notes CRUD, sessions CRUD.

### 4.5 FREELANCER / CONTRIBUTOR (`:8104`)  — `/api/contributor` (115+ endpoints)
- **Core**: `GET /dashboard` · `GET /notifications` · `PATCH /notifications/{id}/read` · `POST /notifications/read-all` · settings (account/notifications/locale/2fa/change-password).
- **Tasks (delivery)**: `GET /tasks` · `/tasks/summary` · `/tasks/completed` · `GET /tasks/{id}` · `/tasks/{id}/history` · `/timeline` · `/review-feedback` · `/latest-submission` · workroom (`/workroom`, `/links`, `/templates`, `/messages`, `POST /uploads`, `DELETE /uploads/{uid}`, `PATCH /checklist/{item}`) · `POST /tasks/{id}/{start|accept|decline|request-extension}` · `GET /tasks/{id}/accept-impact` · `POST /tasks/{id}/submissions`.
- **Submissions**: `GET /submissions` · `GET /submissions/{id}` · `PATCH /submissions/{id}` · `POST /submissions/{id}/resubmit`.
- **Earnings/Payouts**: `/earnings/{summary|overview|chart|export}` · `/earnings/kyc/{status|start}` · `GET /payouts` · `/payouts/{id}` · `/payouts/{id}/receipt` · `GET/PUT /payout-preferences`.
- **Opportunities (interest marketplace)**: `GET /opportunities` · `POST /opportunities/{taskId}/interest` · `/withdraw`.
- **Profile/Credentials/Skills/Messages/Support/Learning/Mentorship** — profile (skills, evidence, projects, experience, education, expertise, digital-twin, **stats**), credentials wallet, support tickets/grievances/safety-reports, learning recs, mentorship opt-in.
- **Notifications read API** (separate router): `GET /api/v1/notifications` (`{notifications, unreadCount}`, `?unreadOnly`, `?category` via `_to_summary`).
- **Submissions routing** (internal, `submissions.py`): on submit, `_route_to_mentor` inserts a `mentor_reviews` row (reads `admin_records sow_mentor` → mentorId) → fires `submission.received`.

---

## 5. Next.js proxy layer (`src/app/api/**/route.ts`, 302 routes)
Every backend call goes through a thin Next route that: (1) reads the NextAuth session, (2) attaches the backend Bearer token, (3) forwards to the gateway, (4) returns the JSON. Key FE-facing paths (≠ backend paths):
- `/api/notifications`, `/api/notifications/[id]/read`, `/api/notifications/mark-all-read` → freelancer `/api/v1/notifications`.
- `/api/sow*`, `/api/admin/sow*` → enterprise/super-admin SOW + commercial gate.
- `/api/mentor/*`, `/api/contributor/*`, `/api/enterprise/*`, `/api/reviewer/*` → respective backends.
- `/api/auth/[...nextauth]` (NextAuth) + `/api/sow/upload-file` (blob upload, returns `{data:{fileName,fileUrl,fileSize}}`).
- `/api/me`, `/api/mentor/me` (graceful — skips backend if no token).

---

## 6. Data-schema structures (key delivery tables)

### login_accounts (24) — every user, all roles
`id` (bigint PK), `email`, `password_hash`, `provider`, `first_name`/`last_name`/`name`, **`role`** (contributor|mentor|reviewer|enterprise|superadmin), `phone`, **`tenant_id`** (text), `department`, `email_verified`, `mfa_enabled`, `mfa_secret`, `is_active`, **`approval_status`**, **`extra_roles[]`** (multi-role), timestamps.

### enterprise_sows (7) — SOW (thin row + JSONB)
`id` (text PK, `sow_…`), `owner_id`, `owner_email`, `source`, **`data` (jsonb)** = `{title, status (draft|submitted|approved|rejected), reviewer:{id,name,email}, mentor:{…}, pricing:{proposedValue,fee,clientMinor,gstPct}, confidentiality, scope, gates:[…], …}`, timestamps.

### decomp_plans (19) — decomposition work plan
`id` (text, `dp_…`), `tenant_id`, **`sow_id`**, `version`, **`status`** (draft|submitted|active|archived), `summary`, `approved_at/by`, `activated_at`, **`created_by`**, `deleted_at`, `revision_note`.

### decomp_tasks (28) — canonical task (the "task matrix" row)
`id` (text, `tsk_…`), **`plan_id`**, `milestone_id`, `tenant_id`, `title`, `description`, **`required_skills` (jsonb[])**, `estimated_hours`, `acceptance_criteria`, `complexity`, `order`, **`status`** (draft→ready→assigned→…→payment_pending→paid / req_check_failed / qa_review_failed / declined), `workforce_sourcing`, `review_path`, **`attachments` (jsonb)** (reference files), `pay_type`, **`contributor_amount_minor` (bigint)**, `pay_currency`, `priced_at/by`, `interest_open_until`, `interest_published_at`.

### contributor_tasks (12) — contributor's working copy
`id` (bigint), **`account_id`**, `title`, **`status`** (assigned|in_progress|submitted|…), `priority`, `category`, **`reward` (numeric)**, `currency`, `due_at`, **`data` (jsonb)** = `{taskId, planId, sowId, skills_required, referenceFiles, description, acceptanceCriteria, sourcedFromInterest, …}` (FLATTENED on read).

### task_interests (11) — "I'm interested" pool
`id`, **`plan_id`, `task_id`, `account_id`**, `contributor_name/email`, **`status`** (interested|selected|rejected), `data`.

### submissions (17) — contributor work submission
`id`, **`account_id`**, `task_definition_id`, `tenant_id`, `version`, **`status`**, `body`, **`payload` (jsonb)** (github url, completion %, notes, artifacts), `reviewer_id`, `submitted_at`, `decided_at`, `ai_*`.

### contributor_uploads (9) — evidence files
`id`, `account_id`, `task_id`, `filename`, **`url`** (blob), `content_type`, `size_bytes`, `data`.

### mentor_reviews (20) — mentor gate (gate 1)
`id`, **`mentor_id`** (text, account id or "pool"), `mentor_email`, `title`, `submission_type`, **`contributor_id`** (set by routing), **`mentee_id`** (bigint — *may be NULL; resolve to contributor_id*), `priority`, **`status`** (pending|accepted|rework|rejected), `decision`, `score`, `comments`, **`payload` (jsonb)** (sowId, taskId, canonicalTaskId, accountId, submissionId, artifacts, qualityRatings…), `rubric`, `decided_at`, `claimed_by`.

### reviewer_assignments (11) — QA gate (gate 2)
`id`, **`reviewer_id`** (bigint), `reviewer_email`, `project_id`, `project_name`, `title`, **`status`** (pending|approved|rework|rejected), `priority`, **`data` (jsonb)** (accountId, canonicalTaskId, sowId, submissionId, mentorOverall, mentorRatings, stage).

### work_ratings (11) — combined quality rating
`id`, **`task_id`**, `submission_id`, **`account_id`**, **`mentor_overall`**, **`qa_overall`**, **`final_rating`** (= avg), `mentor_ratings` (jsonb dims), `qa_ratings` (jsonb dims). Unique on (task_id, account_id).

### payouts (15) — 3-party payout
`id` (text/uuid), **`account_id`** (contributor), `task_id`, `task_title`, **`amount_minor`** (full contributor pay), `currency`, **`status`** (eligible→requested→released→paid / sent), `eligible_at`, `paid_at`, `external_ref`, `method_id`, **`data` (jsonb)** = `{canonicalTaskId, submissionId, grossMinor, netMinor, gstPct, commissionPct, clientMinor, source ("reviewer_qa_approval"|"enterprise_acceptance"), requestedAt}`.

### contributor_notifications (16) — in-app notifications (all roles, global account_id)
`id`, **`account_id`** (bigint global), `title`, `body`, **`category`** (action|update|payment|complaint|security), `is_read`, `data`, **`kind`** (dotted event), **`severity`** (informational|important|critical), `action_url`, `action_label`, `resource_type`, `resource_id`, **`channels[]`** (in_app), `read_at`.

### admin_records (8) — generic super-admin records (incl. mentor routing)
`id` (text), **`kind`** (e.g. `sow_mentor`), **`name`** (e.g. the SOW id), `status`, **`data` (jsonb)** (e.g. `{mentorId, mentorEmail}`), `deleted_at`.

### platform_settings (2) — global config
`id` (=1), **`data` (jsonb)** = `{commission:{commissionPct, gstPct}, …}`.

> **Note — two table families**: lower_snake tables (`enterprise_sows`, `decomp_*`, `contributor_*`, `mentor_reviews`, `reviewer_assignments`, `payouts`, …) are the **live FastAPI/Postgres** path. PascalCase tables (`Sow`, `User`, `Tenant`, `Submission`, `AcceptanceDecision`, `AuditEvent`, `Notification`, `DecompositionPlan`, …) are the **Prisma** schema used by the Next.js side (NextAuth/session, tenant, some acceptance/audit). Both share the one Postgres DB. The delivery flow runs on the snake_case tables.

---

## 7. Delivery data-flow (one task, end-to-end)
```
enterprise_sows(approved) + admin_records(sow_mentor→mentorId) + sows.data.reviewer
  → decomp_plans(active) + decomp_tasks(ready, contributor_amount_minor)
  → [enterprise select] task_interests(selected) + contributor_tasks(assigned) + decomp_tasks(assigned)  →notif task.assigned
  → [contributor accept] contributor_tasks(in_progress)
  → [contributor submit] submissions + contributor_uploads + mentor_reviews(pending)  →notif submission.received(mentor)
  → [mentor decide] mentor_reviews(accepted) + reviewer_assignments(pending) + decomp_tasks(qa_review_pending)
        →notif qa.ready(reviewer) + mentor.accepted(contributor)   [rework→back; reject→req_check_failed]
  → [reviewer QA accept] reviewer_assignments(approved) + work_ratings(final=avg) + payouts(eligible, source=reviewer_qa_approval) + decomp_tasks(payment_pending)
        →notif qa.accepted(contributor) + payout.eligible(super-admins)   [rework→back to reviewer; reject→qa_review_failed]
  → [Glimmora request] payouts(requested)  →notif payout.requested(enterprise)
  → [enterprise release on Billing] payouts(released)
  → [Glimmora disburse] payouts(paid) + decomp_tasks(paid)  →notif (contributor paid)
```
Audit (`AuditEvent`/Mongo) is written at each consequential action; the enterprise + super-admin audit views read it.
