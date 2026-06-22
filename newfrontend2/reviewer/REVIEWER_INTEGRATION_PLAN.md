# Reviewer Portal — Frontend ↔ Backend Integration Plan

> Scope: **reviewer role only** (`newfrontend2/reviewer`). Do **not** touch other role
> apps (enterprise/mentor/contributor) — they are owned by others and are read-only
> reference here. **No DB deletes/drops** — additive only; ask before any removal.
> No datastore switch — keep the existing Neon Postgres `glimmora` DB.

_Last updated: 2026-06-11_

---

## 🔒 LOCKED — Reviewer Auth/Login system (DO NOT MODIFY)

The reviewer authentication system is **complete, tested, and FROZEN as of 2026-06-11.**
Do not change these files/flows again unless the user explicitly reopens them.

**Working & verified end-to-end (FE → proxy → BE → Neon):**
- ✅ **Login** — `/reviewer/login`, real backend (`credentials` provider → `POST /api/v1/auth/login`),
  local fallback, reviewer-role gate, redirect to `/enterprise/reviewer/queue`.
- ✅ **Default / temporary password → forced reset** — login returns `requiresPasswordChange`;
  routes to `/reviewer/change-password` (New + Confirm only — no temp-password field needed);
  backend enforces new ≠ current; flag cleared on success.
- ✅ **New-password login** — old/temp password stops working, new password works.
- ✅ **Reset password (Forgot password)** — `/reviewer/forgot-password`, **OTP** (send → verify →
  set), 5-min expiry, security-neutral messaging, busy states (Sending…/Verifying…/Saving…),
  new ≠ old enforced, OTP single-use bug fixed.
- ✅ **Logout** (both topbar `AccountMenu` and profile button) → clears localStorage /
  sessionStorage / caches / cookies + ends session → **`/reviewer/login`** (never the main login).
- ✅ **Session expiry** → proxy + layout guard redirect reviewer paths to `/reviewer/login`.

**Locked files (don't touch):** `src/app/reviewer/login/*`, `src/app/reviewer/forgot-password/*`,
`src/app/reviewer/change-password/*`, `src/lib/reviewer/logout.ts`, `src/proxy.ts` (auth/redirect
parts), `src/components/auth/auth-screen.tsx` (loadingLabel), `src/components/meridian/shell/AccountMenu.tsx`
(reviewer logout branch), and backend `auth_app/routers/auth.py` (login/otp/password endpoints),
`shared/{config,db,otp}.py`. Config: `.env.local` has `DATABASE_URL` (Prisma) + `BACKEND_SERVICE_URL=:8105`
+ `AUTH_SECRET==API_SECRET_KEY`. Test account: `mychatgptcourse@gmail.com / Fayaz@123`.

---

## 1. What exists today (current state)

### Frontend (Next.js 16, app router, `next dev --webpack`)

The reviewer experience is split across **two URL families** with very different wiring:

| Area | Route | Data source | State |
|------|-------|-------------|-------|
| QA Reviewer queue (home) | `/enterprise/reviewer` , `/enterprise/reviewer/queue` | `GET /api/mock/reviewer/reviews` | **MOCK** |
| QA review detail | `/enterprise/reviewer/queue/[reviewId]` | `GET /api/mock/reviewer/reviews/{id}` | **MOCK** |
| QA submit decision | (on detail page) | `POST /api/mock/reviewer/reviews/{id}/decision` | **MOCK** |
| QA history | `/enterprise/reviewer/history` | `GET /api/mock/reviewer/history` | **MOCK** |
| QA metrics | `/enterprise/reviewer/metrics` | `GET /api/mock/reviewer/history` | **MOCK** |
| Notifications | `/enterprise/reviewer/notifications` | hardcoded array in page | **MOCK** |
| Profile | `/enterprise/reviewer/profile` | NextAuth session + hardcoded profile | **PARTIAL** |
| Enterprise acceptance queue | `/enterprise/review` | `GET /api/enterprise/review-queue` → proxy → BE | **REAL** |
| Acceptance detail | `/enterprise/review/[submissionId]` | `GET /api/enterprise/review-queue/{id}` → BE | **REAL** |
| Acceptance claim | (on detail) | `POST /api/enterprise/review-queue/{id}/claim` → BE | **REAL** |
| Acceptance decide | (on detail) | `POST /api/enterprise/review-queue/{id}/decide` → BE | **REAL** |
| Acceptance history | `/enterprise/review/history` | `GET /api/enterprise/review-queue/history` → BE | **REAL** |

**New (added 2026-06-10):** dedicated reviewer auth surface
- `/reviewer/login` — email+password sign-in only (no register, no OAuth); "Forgot?" → OTP flow.
- `/reviewer/forgot-password` — OTP-based reset (email → 6-digit code → new password). **No reset link.**
- Both made public in `src/proxy.ts` (`PUBLIC_EXACT_PATHS`).

### Backend (FastAPI, `backend/app.py`, **port 8105**)

- Mounts only `auth_app.router` (`/api/v1/auth/*`) + `reviewer.router` (`/api/v1/reviewer/*`).
- JWT HS256 signed with `API_SECRET_KEY`; `_require_reviewer` allows `reviewer|admin|superadmin|super_admin`.
- DB: Neon Postgres `glimmora` (`DATABASE_URL` in `backend/.env`). Singleton psycopg2 conn with reconnect.

**Reviewer endpoints already implemented** (`backend/superadmin_app/routers/reviewer.py`):

| Method | Path | Purpose | Repo fn |
|--------|------|---------|---------|
| GET | `/api/v1/reviewer/dashboard` | stats + assignments | `reviewer_assignment_counts`, `list_assignments_for_reviewer` |
| GET | `/api/v1/reviewer/assigned-sows` | SOWs assigned at intake (`admin_records` kind=`sow_reviewer`) | inline SQL |
| GET | `/api/v1/reviewer/projects` | assignments grouped by project | `list_assignments_for_reviewer` |
| GET | `/api/v1/reviewer/queue` | open assignments in `MockReviewerItem` shape | `list_assignments_for_reviewer` |
| GET | `/api/v1/reviewer/queue/{id}` | single queue item | `get_assignment` |
| PATCH | `/api/v1/reviewer/assignments/{id}` | claim/update status; on accept → flips `contributor_submissions`/`contributor_tasks` | `update_assignment` |
| GET | `/api/v1/reviewer/history` | completed decisions + 30d metrics | `list_assignments_for_reviewer` |
| GET | `/api/v1/reviewer/metrics` | aggregate metrics | `list_assignments_for_reviewer` |
| POST | `/api/v1/reviewer/evidence/{id}/recommend` | record recommendation | `create_recommendation` |

**Tables** (`backend/superadmin_app/schema.py`, created on startup):
- `reviewer_assignments` (id, reviewer_id→login_accounts, reviewer_email, project_id/name, title, status, priority, data JSONB, timestamps). `reviewer_id NULL` = unclaimed **pool**.
- `reviewer_recommendations` (id, evidence_id, assignment_id→reviewer_assignments, reviewer_id, reviewer_email, recommendation, score, comment, data JSONB, created_at).

---

## 2. The core gap

The reviewer **QA portal UI** (`/enterprise/reviewer/*`) is fully built but talks to
**in-memory mock routes** (`/api/mock/reviewer/*`). The **backend already implements the
matching real endpoints** (`/api/v1/reviewer/*`) returning the **same `MockReviewerItem`
shape**. So integration is mostly: **swap the mock Next routes for proxy routes to the
backend**, then verify the shapes line up.

`/enterprise/review/*` (enterprise acceptance) is already real and is the *second* gate —
out of primary scope but documented for the end-to-end picture.

---

## 3. Integration plan (phased)

### Phase 0 — Environment / boot (prerequisite)
- [ ] `newfrontend2` is an npm **workspace** root with hoisted `node_modules`. Run the
      reviewer dev server **from the root**: `npm run dev -w reviewer -- --port 3007`
      (running from inside `reviewer/` fails to resolve `next-auth`).
- [ ] Generate Prisma client (required by `src/auth.ts` → `src/lib/session`):
      `npx prisma generate --schema=prisma/schema.prisma` (output → `src/generated/prisma`).
      **Blocker seen 2026-06-10:** hoisted `node_modules` was mid-install; let install finish
      so `postinstall` (`prisma generate`) runs, then boot.
- [ ] Boot backend: `cd backend && uvicorn app:app --host 127.0.0.1 --port 8105`.
- [ ] `.env.local` already points proxies at `:8102` (super-admin). **Decide**: point reviewer
      proxies at the reviewer BE `:8105` (set `BACKEND_SERVICE_URL=http://127.0.0.1:8105`)
      or keep a single combined BE. (Reviewer router also lives in super-admin BE, so `:8102`
      may already serve `/api/v1/reviewer/*` — confirm before switching.)

### Phases 1–3 — QA queue / detail / decision / history wired to real BE — ✅ DONE 2026-06-11
- [x] Auth-injecting proxy helper `src/lib/api/reviewer-proxy.ts` — reads the NextAuth
      session token server-side (`auth()` → `session.user.accessToken`) and forwards it as a
      Bearer to the Python backend (which gates every `/api/v1/reviewer/*` with get_current_user).
- [x] BFF routes (mirror the mock paths so the client barely changes):
      `GET /api/reviewer/reviews` → BE `/queue`;
      `GET /api/reviewer/reviews/[id]` → BE `/queue/{id}`;
      `POST /api/reviewer/reviews/[id]/decision` → maps accept/rework/reject → status and
      `PATCH /api/v1/reviewer/assignments/{id}` (BE finalises submission+task on accept);
      `GET /api/reviewer/history` → BE `/history`.
- [x] Client `src/lib/api/reviewer-mock.ts` now defaults to `/api/reviewer` (real), with an
      automatic fallback to `/api/mock/reviewer` ONLY on 503 (backend down). Force mock with
      `NEXT_PUBLIC_REVIEWER_USE_MOCK=true`. Pages unchanged (same fn names).
- [x] Shapes verified compatible: BE `/queue` → `{items: MockReviewerItem[], total}`,
      `/queue/{id}` → `{review}`, `/history` → `{items, total, metrics}`; metrics fields
      (reviewCount/avgTimeMin/slaHitPct/acceptPct/agreementWithMentorPct/decisionsByKind) all
      match what the metrics page reads.
- [x] Live-verified with a real token: seeded `reviewer_assignment` id=1 for the
      tenant reviewer (id=9, mychatgptcourse@gmail.com / tnt-fayaz-test-tenant) →
      `GET /api/v1/reviewer/queue` returns it as a MockReviewerItem (state=open, sla=healthy,
      criteria=3, mentorOverall=4.2). Seed: `backend/seed_reviewer_assignment.py` (additive).
- [ ] Pages still mock for now: notifications (hardcoded), profile (partly hardcoded), dashboard
      (redirects to queue; not wired). See Phase 4.

### Phase 1 (original notes) — Wire the QA queue + detail to real BE (highest value)
Add **reviewer-owned** Next BFF routes that proxy to the backend (mirror the existing
`/api/enterprise/review-queue/route.ts` proxy pattern — `proxyToBackendService`):

- [ ] `src/app/api/reviewer/dashboard/route.ts` → `GET /api/v1/reviewer/dashboard`
- [ ] `src/app/api/reviewer/queue/route.ts` → `GET /api/v1/reviewer/queue`
- [ ] `src/app/api/reviewer/queue/[reviewId]/route.ts` → `GET /api/v1/reviewer/queue/{id}`
- [ ] `src/app/api/reviewer/assignments/[id]/route.ts` (PATCH) → `PATCH /api/v1/reviewer/assignments/{id}`
- [ ] Repoint the client fetchers in `src/lib/api/reviewer-mock.ts` (or a new
      `src/lib/api/reviewer.ts`) from `/api/mock/reviewer/*` → `/api/reviewer/*`.
      Keep the mock module importable behind a `NEXT_PUBLIC_REVIEWER_DEMO` flag fallback
      (do not delete the mocks — additive).
- [ ] Confirm BE `queue` item shape == FE `MockReviewerItem` (it is built to match; verify
      `slaTier`, `state`, `criteria[]`, `evidence[]`, `mentorOverall`).

### Phase 2 — Decisions + recommendations
- [ ] `src/app/api/reviewer/reviews/[id]/decision/route.ts` (POST):
      map FE decision (`accept|rework|reject`) → `PATCH /api/v1/reviewer/assignments/{id}`
      with `status` (`approved|rework|rejected`) **and** optionally
      `POST /api/v1/reviewer/evidence/{evidenceId}/recommend` for the rubric/score/comment.
- [ ] Verify the accept path server-side flips `contributor_submissions.status='accepted'`
      and `contributor_tasks.status='completed'` (already coded in `patch_assignment`).
- [ ] Enforce FE rule: comment required for `rework`/`reject` (already in mock route — port it).

### Phase 3 — History + metrics
- [ ] `src/app/api/reviewer/history/route.ts` → `GET /api/v1/reviewer/history`
- [ ] `src/app/api/reviewer/metrics/route.ts` → `GET /api/v1/reviewer/metrics`
- [ ] Repoint `/enterprise/reviewer/history` + `/metrics` pages.
- [ ] Note BE TODOs: `avgTimeMin` and `slaHitPct` are hardcoded `0` — decide whether to
      compute (needs `decidedAt - submittedAt` + SLA breach tracking) or hide in UI.

### Phase 4 — Notifications + profile — ✅ DONE 2026-06-11
- [x] Notifications: new BE `GET /api/v1/reviewer/notifications` **derives** the feed from the
      reviewer's assignments (no new table): `assignment` (new submission), `sla` (open + at-risk
      tier), `decision` (completed) → `{items:[{id,title,body,kind,read,at}], total, unread}`.
      Proxy `GET /api/reviewer/notifications`; page fetches it (hardcoded array kept only as a
      fallback if the backend is unreachable). API-tested direct + via session proxy.
- [x] Profile: new BE `GET /api/v1/reviewer/profile` returns real account + workspace
      (tenant name from `Tenant`) + member-since (`created_at`) + assignment stats. Proxy
      `GET /api/reviewer/profile`; page uses real workspace/role/joinedAt (falls back to session
      + sample). Verified: workspace="Fayaz Test Tenant", joinedAt=real, role="Enterprise Reviewer".
- [ ] Dashboard route still just redirects to the queue (BE `/dashboard` exists if a real
      dashboard is wanted later).

### Phase 4 (original notes) — Notifications + profile (lower priority)
- [ ] Notifications page is a hardcoded array — needs a real source (no BE endpoint yet).
      Option: derive from `reviewer.assignment_updated` / `reviewer.evidence_recommended`
      kafka-style events, or a new `GET /api/v1/reviewer/notifications`. **Additive** new table
      or reuse `data` JSONB. (Defer; mark as known mock.)
- [ ] Profile: replace hardcoded `MOCK_REVIEWER_PROFILE` fields with `/api/me` data; keep
      session-derived identity.

### Phase 5 — Auth end-to-end (login + forgot-password) — ✅ DONE & TESTED (2026-06-10)
- [x] `/reviewer/login` authenticates via the **real BE** `credentials` provider
      (→ `authApi.login` → `POST /api/v1/auth/login`) with a `local-credentials` fallback;
      detects pending states via `/api/auth/validate`; role-gates to reviewer-capable roles;
      redirects to `/enterprise/reviewer/queue`.
- [x] Reviewer test account seeded (additive, idempotent —
      `backend/seed_reviewer_test.py`): **`reviewer.test@glimmora.dev` / `Reviewer@123`**
      (role=reviewer). No other-role code touched.
- [x] OTP forgot-password fully wired FE→proxy→BE `:8105`:
      `/api/auth/otp/send-email` + `/otp/verify-email` + `/password/setup-after-otp`.

#### Forgot-password / reset conditions — all verified ✅
- [x] **Forgot password** label kept on the reset screen (title = "Forgot password").
- [x] **Sending** busy state — "Send code" button shows "Sending…" while in flight.
- [x] **Sending failure** surfaced — "Sending the code isn't working right now…" on non-2xx/5xx.
- [x] **Verifying** busy state — "Verify code" button shows "Verifying…".
- [x] **Verifying failure** surfaced — "Verifying the code isn't working right now…" on 5xx/network.
- [x] **Security message** — "If an account exists for <email>, a code is on its way" (never
      reveals whether the account exists; BE responds identically for unknown emails).
- [x] **OTP must verify** — wrong code → HTTP 400 (rejected); correct code → 200 verified.
- [x] **OTP expires after 5 min** — `OTP_TTL_SECONDS = 300` (Redis or in-process fallback).
- [x] **New password must differ from old** — BE `setup-after-otp` rejects with
      "New password must be different from your old password"; FE surfaces it inline.
- [x] **Old password stops working** after reset (login → 401); **new password works** (login → 200).

#### Forced password reset (admin-provisioned reviewers) — ✅ DONE & TESTED
- [x] Login returns `requiresPasswordChange=true` when the account has
      `must_change_password` set; the flag rides the NextAuth session.
- [x] Reviewer login routes such users to **`/reviewer/change-password`** (new page)
      instead of the queue.
- [x] Change-password page authenticates via the session access token →
      `POST /api/auth/password/change`; enforces new ≠ temporary password; on success
      signs out and returns to `/reviewer/login`.
- [x] BE `set_password(clear_must_change=True)` clears the flag; old (temp) password
      stops working, new works, flag cleared. Verified via `backend/test_reviewer_auth.py`.

#### Bug fixed — "OTP correct but can't set new password"
- [x] Root cause: OTP is single-use; `/otp/verify-email` consumed it, then
      `/password/setup-after-otp` re-verified the *same* (now-deleted) code → 400.
- [x] Fix: `setup-after-otp` accepts the short-lived **"recently verified" marker**
      (`is_recently_verified`) set by verify-email, falling back to raw-code verify for
      single-call flows. Full send→verify→set now succeeds.

#### Verification harness
- `backend/test_reviewer_auth.py` — runs all conditions against the live BE.
  Latest run: **14/14 PASS** (forgot-password flow, new≠old, old-fails/new-works,
  security-neutral send, wrong/correct OTP, forced-reset flag + clear, OTP TTL=300).

#### Performance (per "both FE + BE must be fast" rule)
- [x] OTP send: ~5s → **~440ms** — Redis **circuit-breaker** in `shared/db.py` (skip
      unreachable Redis for a 60s cooldown, auto-recover) + OTP email dispatched via FastAPI
      `BackgroundTasks` (no SMTP block) + in-process OTP fallback when Redis is down.
- [x] Login: deferred non-critical audit/event to background. Steady-state **~1.9s**, floored
      by Neon (ap-southeast-1) network latency (~512ms/query × 2) + bcrypt (~250ms) — infra,
      not code (existing DB kept per directive). `mark_login` stays on the critical path to
      avoid sharing the single PG connection across threads.

Files changed this phase (reviewer-scoped only): `src/app/reviewer/login/_components/reviewer-login-screen.tsx`,
`src/app/reviewer/forgot-password/page.tsx`, `backend/auth_app/routers/auth.py`,
`backend/shared/config.py` (load `.env`), `backend/shared/db.py` (Redis breaker),
`backend/shared/otp.py` (fallback on Redis failure), `backend/seed_reviewer_test.py` (new).

---

## 4. Shape contract (FE `MockReviewerItem` ↔ BE `/queue` item)

BE `_assignment_to_queue_item` already emits exactly these keys (verify on first integration):
```
id, taskTitle, taskSubtitle, project, tenant, contributorName, mentorName,
round, totalRounds, submittedAt, mentorAcceptedAt, dueAt,
slaTier (healthy|watch|warning|critical|breached),
state  (open|decided_accept|decided_reject),
evidence[], criteria[], mentorOverall, mentorNote,
contributorCoverNote, criteriaValidatedCount
```
History item (`MockReviewerDecision`): `id, reviewId, taskTitle, contributorName,
mentorName, project, decision (accept|rework|reject), agreedWithMentor, decidedAt, comment`.

---

## 5. Data flow (how a review reaches the reviewer)

```
Contributor submits  ──► (freelancer BE) mentor_reviews ──► Mentor accepts
        └─► reviewer_assignments row created (status=pending, reviewer_id=NULL = POOL)
              │
Reviewer signs in (/reviewer/login) ──► GET /api/v1/reviewer/queue (pool + own)
              │  PATCH /assignments/{id} (first action claims: reviewer_id := me)
              ▼
   accept/rework/reject  ──► status update (+ recommendation)
              │  on accept: contributor_submissions='accepted', contributor_tasks='completed'
              ▼
   Enterprise acceptance gate (/enterprise/review/*) — second, already-real gate
```
SOW-level intake assignment is separate: `admin_records` kind=`sow_reviewer` →
surfaced by `GET /api/v1/reviewer/assigned-sows` (visible before any delivery).

---

## 6. Open decisions for the user
1. **Which backend** do reviewer proxies target — standalone reviewer BE `:8105`, or the
   combined super-admin BE `:8102` (which also mounts the reviewer router)?
2. **Reviewer test account** — create one via the (untouched) enterprise/admin invite flow,
   or should I add a reviewer-only seed in the reviewer BE? (additive; needs your OK.)
3. **`avgTimeMin` / `slaHitPct`** — compute real values (needs timestamp tracking) or hide?
4. **Notifications** — build a real BE source now or leave as known-mock for later?
5. Keep mock routes as a `NEXT_PUBLIC_REVIEWER_DEMO` fallback (recommended) vs remove —
   I will **not remove** unless you confirm.

---

## 7. Files this plan will add/change (reviewer folder only)
- ADD: `src/app/api/reviewer/{dashboard,queue,queue/[reviewId],assignments/[id],reviews/[id]/decision,history,metrics}/route.ts`
- ADD/EDIT: `src/lib/api/reviewer.ts` (real fetchers) — keep `reviewer-mock.ts` as fallback
- EDIT: reviewer pages under `src/app/enterprise/reviewer/*` to call the new fetchers
- DONE: `src/app/reviewer/login/*`, `src/app/reviewer/forgot-password/*`, `src/proxy.ts`
- NO changes outside `newfrontend2/reviewer/`.
