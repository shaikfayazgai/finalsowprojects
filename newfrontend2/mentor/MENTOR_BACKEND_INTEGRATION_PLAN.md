# Mentor Portal — Backend Integration Plan

> Scope: the **mentor** portal only (`newfrontend2/mentor`). This plan does NOT
> touch enterprise / reviewer / contributor / super-admin modules. Mentor
> creation/provisioning lives in super-admin and is intentionally left alone.
>
> Hard constraints (carry through every task):
> - **No destructive DB ops.** Never DELETE/DROP/destructive-migrate anything in
>   Neon / MongoDB / Redis. Additive schema only. Ask before any removal.
> - **No new databases.** Use the existing Neon Postgres, MongoDB, and Redis
>   instances already wired in `backend/.env`. Do not switch providers.
> - **Write only inside `newfrontend2/mentor`.** Other folders are read-only.
>
> Last updated: 2026-06-11

---

## 🔒 LOCKED — do not modify again

The following are **complete, verified, and locked**. Do not change these files or
behaviors again unless the user explicitly asks:

- **Mentor login** (`src/app/mentor/login/page.tsx`) — login + OTP forgot-password
  (no register, no SSO).
- **OTP forgot-password** end-to-end: `send-email → verify-email →
  password/setup-after-otp` (no reset links; OTP-only; 5-min expiry).
- **First-login-only onboarding gate** — durable via
  `mentor_profiles.settings.onboarding_complete`
  (`src/app/api/mentor/me/route.ts` + backend `GET/POST /api/v1/mentor/me`).
- Supporting fixes: `backend/shared/config.py` (.env load),
  `backend/mentor_app/db_schema.py` (DDL order), `backend/app.py` + `run.py`
  (Selector loop), `backend/shared/db.py` (Redis keepalive),
  `backend/auth_app/routers/auth.py` + `shared/otp.py` (OTP double-consume +
  background email), `src/lib/api/backend-service.ts` (header strip),
  `.env.local` (→ :8101).

See §3 Phase 0 / Phase 1 for the detailed condition checklist (all ✅).

---

## 1. Current architecture (as-is)

### 1.1 Two backends are in play

| Layer | Where | Role |
|-------|-------|------|
| **Next.js API routes** | `mentor/src/app/api/**` | BFF — auth glue (NextAuth + durable session), Prisma reads, mock data, and a thin proxy to the FastAPI service. |
| **FastAPI mentor service** | `mentor/backend/` | The real mentor domain API. Standalone, runs on **:8101**. Mounts `auth_app` + `mentor_app`. Talks to shared Neon Postgres. |

### 1.2 The environment mismatch (must fix first)

`mentor/.env.local` currently points the Next proxies at the **super-admin
backend (:8102)**, not the bundled mentor service (:8101):

```
BACKEND_SERVICE_URL=http://127.0.0.1:8102      # ← should be the mentor svc
GLIMMORA_API_BASE_URL=http://127.0.0.1:8102
NEXT_PUBLIC_GLIMMORA_API_URL=http://127.0.0.1:8102
```

The bundled FastAPI service (`mentor/backend/app.py`) runs on **8101**. The Next
proxy helper `getBackendServiceUrl()` defaults to `http://localhost:4000` when
unset. → **Decide one source of truth and align all three** (see Phase 0).

### 1.3 Mentor frontend data sources today (mock vs. real)

| Mentor page | Source today | Target |
|-------------|--------------|--------|
| `/mentor/dashboard` | **mock** (`/api/mock/mentor/dashboard`) | real `GET /api/mentor/dashboard` (FastAPI) |
| `/mentor/queue` | proxy → backend `/api/v1/mentor/queue` | keep; point at :8101 |
| `/mentor/queue/[id]` + decision | **mock / runtime-store** | real `/api/v1/mentor/submissions/{id}` + `/decide` |
| `/mentor/mentorship` (sessions) | **real** (Prisma `Session` table via Next route) | reconcile with FastAPI `mentor_sessions` (pick ONE store) |
| `/mentor/escalation/[id]` | **mock** (`/api/mock/mentor/escalations`) | real `/api/mentor/escalation*` |
| `/mentor/history` (decisions) | **mock** (`/api/mock/mentor/decisions`) | derive from `mentor_reviews` decided rows |
| `/mentor/notifications` | **mock** | real notifications source (TBD — see open Q) |
| `/mentor/profile` | mixed: `/api/mentor/me` (real-ish) + runtime overrides | real `mentor_profiles` via `/api/v1/mentor/me` + `PATCH /profile` |
| `/mentor/settings/*` | in-memory PATCH (no-op on reload) | real `PATCH /api/mentor/settings` |
| `/mentor/onboarding` | Prisma flag + runtime store | real `POST /api/v1/mentor/me` (`settings.onboarding_complete`) |
| `/mentor/login` (NEW) | NextAuth `local-credentials` + OTP forgot | done; confirm against FastAPI `auth_app` |

**Key gap:** the Next BFF has *two parallel session stores* — Prisma `Session`
(Next) and `mentor_sessions` (FastAPI). These must be unified to avoid drift.

---

## 2. Backend API surface (mentor FastAPI service)

Mounted in `mentor/backend/app.py` → `auth_app` + `mentor_app`. All mentor
endpoints require role ∈ `{mentor, reviewer, admin, superadmin}` via
`require_roles` (`backend/shared/deps.py`). JWT = HS256 signed with
`API_SECRET_KEY` (shared across services — this is why `AUTH_SECRET` on the
frontend must equal it).

### 2.1 Auth (`auth_app/routers/auth.py`) — already complete
- `POST /api/v1/auth/login` — password + MFA gate; OAuth-first → `needs_password_setup`.
- `POST /api/v1/auth/validate` — pre-NextAuth credential check (no session).
- `POST /api/v1/auth/refresh`, `/logout`, `/me`.
- MFA: `/mfa/setup/init`, `/mfa/setup/confirm`, `/mfa/verify`, `/mfa/recovery`.
- **OTP (used by `/mentor/login` forgot-password):**
  - `POST /api/v1/auth/otp/send-email`
  - `POST /api/v1/auth/otp/verify-email`
  - `POST /api/v1/auth/password/setup-after-otp`
- `POST /api/v1/auth/register/mentor` — invite-code gated (provisioning is
  super-admin's job; leave the endpoint, don't surface a register UI in mentor).

### 2.2 Mentor domain — legacy `/api/mentor/*` (`routers/mentor.py`)
- `GET /dashboard` — stats + recent queue (5).
- `GET /assigned-sows` — SOWs assigned at commercial gate.
- `GET /queue`, `GET /queue/{id}`, `POST /queue/{id}/decision` (accept|rework|escalate).
  - **accept** → inserts `reviewer_assignments` (handoff to reviewer tier).
- `GET /mentorship`, `GET /mentorship/{mentee}`, `POST /mentorship/{mentee}/note`.
- `GET|POST|GET|PATCH /escalation*`.
- Notes/sessions/profile/settings (see `notes_sessions.py`).

### 2.3 Mentor domain — v1 `/api/v1/mentor/*` (`routers/v1.py`) — preferred
- `GET /me`, `POST /me` (onboarding-complete flag).
- `GET /queue`.
- `GET /submissions/{id}`.
- `POST /submissions/{id}/claim` | `/release` | `/decide` (claim/release pool pattern).

### 2.4 Tables touched (Neon Postgres — additive only)
`mentor_reviews`, `mentor_sessions`, `mentor_mentorships`, `mentor_escalations`,
`mentor_notes`, `mentor_profiles`, plus cross-tier `reviewer_assignments`
(written on accept). Schema is created idempotently by `init_mentor_schema()`
on startup — never drop, only `ADD COLUMN IF NOT EXISTS`.

---

## 2.5 Module integration status (live, 2026-06-11)

| Module | Frontend route | Backend endpoint | State |
|--------|----------------|------------------|-------|
| Login + OTP forgot | `/mentor/login` | `/api/v1/auth/*` | ✅ DONE (locked) |
| Onboarding gate | `/api/mentor/me` | `/api/v1/mentor/me` | ✅ DONE (durable, first-login-only) |
| Logout / expiry wipe | AccountMenu / proxy | NextAuth signOut | ✅ DONE |
| Queue list | `/api/mentor/queue` | `/api/v1/mentor/queue` | ✅ FIXED 2026-06-11 — proxy was 401'ing (forwarded session cookie, no Bearer token). Now injects the session's backend access token. Verified: `success=true`. |
| Submission detail + claim/release/decide | `/api/mentor/submissions/*` | `/api/v1/mentor/submissions/*` | ✅ FIXED 2026-06-11 — same missing-token bug; all 4 routes now inject the Bearer token. Verified: auth passes (404 for missing id, not 401). |
| **Profile** (read+write) | `/api/mentor/profile` PATCH + `/api/mentor/me` GET | `/api/mentor/profile` GET/PATCH + `/settings` | ✅ DONE 2026-06-11 — round-trips through Postgres (`mentor_profiles`); verified bio/languages/timezone/mentorshipIntro persist |
| **Settings** (availability + notifications) | `/api/mentor/settings/*` PATCH | `/api/mentor/settings` PATCH (JSONB) | ✅ write-through DONE 2026-06-11 (persists to `mentor_profiles.settings`). ⚠️ pages still seed defaults on load — read-back GET on the settings pages is the remaining step |
| **Mentorship sessions** | `/api/mentor/sessions` + `/[sessionId]` | backend `/api/mentor/sessions` (`mentor_sessions`) | ✅ DONE 2026-06-11 — Prisma replaced with backend proxy + snake→camel adapter. Verified live: schedule → list → mark held. (Contributor name not yet enriched — shows contributorId; backend join pending.) |
| **Notes** | `/api/mentor/notes*` + `/contributors/[id]/notes` | backend `/api/mentor/notes` (`mentor_notes`) | ✅ DONE 2026-06-11 — Prisma replaced with backend proxy. Verified live: write → list (soft-delete preserved). |
| Dashboard | `/api/mock/mentor/dashboard` | `/api/mentor/dashboard` | ❌ MOCK — **shape gap**. Backend returns only `{stats, recent_queue}`; UI expects hero review + SLA timers + today's sessions + team load. **DECISION NEEDED**: degrade UI to real-but-minimal, or enrich backend. |
| History / decisions | `/api/mock/mentor/decisions` | (none dedicated) | ❌ MOCK — backend has no decisions endpoint. Could derive from decided `mentor_reviews`. **Needs backend work.** |
| Escalations | `/api/mock/mentor/escalations` | `/api/mentor/escalation*` | ❌ MOCK — **shape gap**. Backend row is generic (subject/category/priority/status/timeline); the UI models a dispute-resolution workflow (taskTitle, contributorName, originalDecision, contributorDispute, severity) + metrics the backend lacks. **DECISION NEEDED**: degrade UI, or enrich backend + wire the review→escalate creation flow. |
| Notifications | `/api/mock/mentor/notifications` | (none) | ❌ MOCK. No backend source — needs additive `mentor_notifications` or events feed (product decision) |

**Helper added:** `src/lib/api/mentor-backend.ts` — `callMentorBackend(token, path, init)` calls
the bundled backend with the session's access token and unwraps `{success,message,data}`.

**Critical fix (2026-06-11): Prisma-crash on authenticated mentor routes.** The Next app has
**no `DATABASE_URL`** (it runs on the FastAPI backend, not Prisma). `requireRequest` called
`resolveTenantForUser` (Prisma) and `/api/mentor/me` called `resolveMentorRoleForUser` (Prisma),
both of which **threw `SASL: client password must be a string` and 500'd every authenticated
mentor route**. When `/api/mentor/me` 500'd, `useActiveMentor` fell back to
`onboardingComplete=false` → the gate forced onboarding. This was a real root cause of the
onboarding bounce. Fix: both functions are now fail-safe (return null / base "mentor" when Prisma
is unavailable) — mentors are tenant-less anyway. Files: `src/lib/tenant/resolve.ts`,
`src/lib/mentor/resolve-mentor-role.ts`. **Verified live through the frontend** (:3100): profile
round-trip (bio/languages/timezone persist + read back) and settings write-through (availability
capacity lands in `mentor_profiles.settings`).

---

## 3. Integration phases

### Phase 0 — Align environment & boot both servers ✅ DONE (2026-06-11)
- [x] Canonical mentor backend URL = **:8101** (bundled mentor service).
- [x] `mentor/.env.local`: `BACKEND_SERVICE_URL`, `GLIMMORA_API_BASE_URL`,
      `NEXT_PUBLIC_GLIMMORA_API_URL` all → `http://127.0.0.1:8101` (was :8102).
- [x] `AUTH_SECRET` (frontend) == `API_SECRET_KEY` (`backend/.env`) — verified
      (`8f3d9b2c…`), so JWTs + OTP verify both ways.
- [x] Boot FastAPI: **`cd backend && python run.py`** (new launcher — installs the
      Windows Selector event loop so the remote-Redis TLS resets don't stall
      responses; on Linux it's a plain uvicorn run). Plain `uvicorn app:app
      --port 8101` also works but is slower/flaky on Windows.
- [x] Boot Next: `npm run dev` (workspace-root hoisted `node_modules`).
- [x] Smoke: `GET :8101/health` → `{status:ok}`; `/mentor/login` serves 200.

**Fixes made in Phase 0 (mentor folder only):**
- `backend/shared/config.py` — now loads `backend/.env` via `env_file` (was
  defaulting `DATABASE_URL` empty → connecting to localhost:5432; now Neon).
- `backend/mentor_app/db_schema.py` — fixed DDL ordering bug: the
  `ALTER TABLE mentor_notes …` ran *before* `CREATE TABLE mentor_notes`, so on a
  fresh DB the whole batch aborted and no mentor tables were created. Moved the
  ALTERs after the CREATE. Additive only, no drops.
- `backend/app.py` + `backend/run.py` — Windows Selector event loop policy.
- `backend/shared/db.py` — Redis client `socket_keepalive` + `retry_on_timeout`.

### Phase 1 — Auth end-to-end (login + OTP forgot) ✅ DONE (2026-06-11)
- [x] `/mentor/login` sign-in: authenticates against the **real FastAPI backend**
      `credentials` provider (`POST /api/v1/auth/login`) first, falling back to
      `local-credentials` (Prisma) only if the backend is unreachable. Mentor-role
      check enforced; non-mentors are rejected with a clear message.
- [x] OTP forgot-password verified live end-to-end against FastAPI:
      `send-email` → `verify-email` → `password/setup-after-otp` → login with the
      new password. **No reset links anywhere — OTP only.**
- [x] Post-login routing: mentor → `/mentor/dashboard`; first-run (onboarding
      incomplete) → `/mentor/onboarding`.

#### Bug fixed during Phase 1 — OTP double-consume (backend)
The two-step UI verifies the code first (`/otp/verify-email`), which **deletes**
the single-use code from Redis and sets a 30-min "verified" marker. The final
`/password/setup-after-otp` then re-verified the *same* code → always failed with
"Invalid or expired code". Fix (`backend/auth_app/routers/auth.py`):
`setup-after-otp` now accepts **either** a still-valid code **or** a recent
verification (`is_recently_verified`), then calls `consume_verified()`
(new helper in `shared/otp.py`) so the reset can't be replayed. This is the same
verified-marker pattern registration already uses.

#### Speed fixes (per "UI + backend must be fast")
- `send-email` was ~8.9 s (synchronous Gmail SMTP). Now the SMTP send runs as a
  FastAPI **BackgroundTask** (threadpool), so the endpoint returns in ~1 s and the
  email lands a moment later. Backend log timings after fixes: verify ≈1.6 s,
  setup ≈3 s, login ≈3 s.
- Windows Selector loop + Redis keepalive removed the multi-second response stalls.

#### Frontend proxy hardening
`src/lib/api/backend-service.ts` now strips hop-by-hop / unsupported headers
(`expect`, `connection`, `content-length`, `transfer-encoding`, …) before
forwarding. Node's undici `fetch` rejects `Expect` with `UND_ERR_NOT_SUPPORTED`,
which had surfaced as spurious 503s when a client sent `Expect: 100-continue`.

#### Mentor `/mentor/login` UX + security CONDITIONS (all implemented)
The page (`src/app/mentor/login/page.tsx`) shows **only Login + Forgot password**
(no register, no SSO). Forgot-password is a 4-step inline flow with these
conditions enforced:

| Condition | Status | Where |
|-----------|--------|-------|
| Steps: **forgot password → OTP verification → new (reset) password → done** | ✅ | step titles "Forgot password" / "OTP verification" / "Reset password" |
| **"Reset" screen keeps the "Forgot password" wording/heading** | ✅ | email step titled "Forgot password" |
| While sending OTP, button shows **"Sending…"**; on failure → **"Sending the code didn't work…"** | ✅ | `FpButton loadingLabel="Sending…"` + error copy |
| **"Send code"** also reflects the sending state | ✅ | same button |
| While verifying OTP, button shows **"Verifying…"**; on failure → **"Verifying the code didn't work…"** | ✅ | `FpButton loadingLabel="Verifying…"` + error copy |
| **Security: "If an account exists … a code is on its way"** (never reveal whether the account exists) | ✅ | success/info copy on send |
| **OTP must work** | ✅ | verified live (verify-email → 200) |
| **OTP expires after 5 min** | ✅ | backend `OTP_TTL_SECONDS = 300` (`shared/otp.py`) |
| **New password must work** | ✅ | login with new password → 200 |
| **Old password must NOT work after reset** | ✅ | `repo.set_password` overwrites the hash; old hash gone |
| After setting password → **"Your password was set" + "Back to sign in"** that returns to mentor login | ✅ | `done` step + `goToSignIn()` |
| **Resend code** actually re-sends (own "Resending…" state) | ✅ | `onResend()` |

#### Logout & session-expiry → mentor login + client wipe (DONE 2026-06-11)
Requirement: on **logout OR session expiry**, return to the mentor login page and
clear **cache, localStorage, sessionStorage, and cookies**.

Implementation (mentor app only):
- `src/lib/auth/session-cleanup.ts` (new) — `clearClientState()` wipes
  localStorage, sessionStorage, JS-readable cookies, and Cache Storage;
  `signOutAndClear()` clears then `signOut()` (which drops the httpOnly NextAuth
  cookie); `loginUrlForPath()` maps `/mentor/*` → `/mentor/login`.
- Logout: `components/meridian/shell/AccountMenu.tsx` Sign-out now calls
  `signOutAndClear()` → lands on `/mentor/login`.
- Expiry (client): `lib/hooks/use-role-guard.ts` redirects an unauthenticated
  mentor to `/mentor/login`.
- Expiry (server): `proxy.ts` `loginRedirect()` sends unauthenticated `/mentor/*`
  to `/mentor/login?returnTo=…&reason=unauthenticated` (verified: 307 →
  `/mentor/login`).
- Belt-and-suspenders: `app/mentor/login/page.tsx` calls `clearClientState()` on
  mount, so the expiry path (server redirect, where JS logout never ran) is also
  wiped. (httpOnly cookies aren't JS-clearable, but an expired session cookie is
  already invalid and `signOut` clears it on the logout path.)

#### Onboarding = first-login-only gate (FIXED + verified, LOCKED)
Requirement: the mentor onboarding wizard must appear **only at the first login**
(fresh/default-password account that hasn't onboarded), and must **NOT** reappear
after a password reset or on normal subsequent logins.

Bug: `src/app/api/mentor/me/route.ts` read/wrote the completion flag from an
**in-memory** store (`runtime-store`), which reset on every server restart → so
onboarding kept reappearing. Fix: the Next route now reads/writes the **durable**
flag from the backend (`mentor_profiles.settings.onboarding_complete` via
`GET/POST /api/v1/mentor/me`), using the session's backend access token; the
in-memory store remains only as a token-less fallback. Verified live:
me#1 `False` → POST mark → me#2 `True` (persists across reset/re-login).

### Phase 2 — Read paths (dashboard, queue, history, profile)
- [ ] `/mentor/dashboard`: swap `/api/mock/mentor/dashboard` → Next route that
      proxies FastAPI `GET /api/mentor/dashboard`.
- [ ] `/mentor/queue` + detail: route through `/api/v1/mentor/queue` and
      `/submissions/{id}` (already proxied; verify shape matches the UI types).
- [ ] `/mentor/history`: derive from decided `mentor_reviews` rows.
- [ ] `/mentor/profile`: `GET /api/v1/mentor/me` + competency (read-only,
      admin-set). Drop the runtime-store overrides once `PATCH /profile` is live.

### Phase 3 — Write paths (decisions, claim/release, notes, sessions, settings)
- [ ] Review decision modal → `POST /api/v1/mentor/submissions/{id}/decide`
      (accept|rework|reject|escalate). Verify the **accept → reviewer_assignments**
      handoff lands in the reviewer tier.
- [ ] Claim/Release queue actions → `/claim`, `/release`.
- [ ] Notes CRUD → `/api/mentor/notes*` (soft-delete via `deleted_at`; NO hard
      delete — honors the no-DB-delete rule).
- [ ] Mentorship sessions: **unify the two stores.** Choose FastAPI
      `mentor_sessions` as canonical; have the Next `/api/mentor/sessions`
      route proxy FastAPI instead of writing Prisma `Session`. (Or vice-versa —
      but pick ONE. Document the decision here once made.)
- [ ] Settings PATCH (availability, notifications) → `PATCH /api/mentor/settings`
      (persists to `mentor_profiles.settings` JSONB). Fixes the
      "reverts on reload" mock no-op.

### Phase 4 — Escalations & notifications
- [ ] `/mentor/escalation*` → real `mentor_escalations` endpoints (list/create/
      get/patch with timeline trail). Senior/lead gating stays client-side +
      enforced server-side by role.
- [ ] `/mentor/notifications`: **OPEN** — no backend source identified yet.
      Decide: derive from audit/events, or add a `mentor_notifications` table
      (additive). Needs product input.

### Phase 5 — Hardening & verification
- [ ] Contract test each Next route ↔ FastAPI shape (Pydantic ↔ TS types).
- [ ] Playwright smoke: `e2e/mentor.spec.ts` green against live :8101.
- [ ] Confirm rate-limit + audit fire on mentor actions (Mongo `audit_log`).
- [ ] Confirm no mock route is reachable in the mentor portal once real wired
      (keep `/api/mock/*` for offline demo behind a flag, don't delete).

---

## 4. Backend API testing checklist (mentor service)

Run against `:8101` with a mentor JWT (obtain via login). Use the existing DBs.

| # | Endpoint | Method | Expect | Notes |
|---|----------|--------|--------|-------|
| 1 | `/health` | GET | 200 `{status:ok}` | service up |
| 2 | `/api/v1/auth/login` | POST | 200 token OR `mfa_required` | seeded superadmin works |
| 3 | `/api/v1/auth/otp/send-email` | POST | 200 | OTP emailed (or `OTP_DEV_ECHO=1`) |
| 4 | `/api/v1/auth/otp/verify-email` | POST | 200 `{verified:true}` | forgot-password step 2 |
| 5 | `/api/v1/auth/password/setup-after-otp` | POST | 200 token | forgot-password step 3 |
| 6 | `/api/mentor/dashboard` | GET | 200 stats + recent_queue | empty arrays OK for fresh mentor |
| 7 | `/api/v1/mentor/me` | GET | 200 profile + onboardingComplete | |
| 8 | `/api/v1/mentor/me` | POST | 200 | sets onboarding_complete |
| 9 | `/api/v1/mentor/queue` | GET | 200 list | filters: status/priority/search |
| 10 | `/api/v1/mentor/submissions/{id}` | GET | 200 detail + notes | |
| 11 | `/api/v1/mentor/submissions/{id}/claim` | POST | 200, status→in_review | |
| 12 | `/api/v1/mentor/submissions/{id}/release` | POST | 200, status→pending | |
| 13 | `/api/v1/mentor/submissions/{id}/decide` | POST | 200; accept→reviewer_assignments row | verify handoff |
| 14 | `/api/mentor/mentorship` | GET | 200 list | |
| 15 | `/api/mentor/escalation` | GET/POST | 200 | timeline trail on create |
| 16 | `/api/mentor/sessions` | GET/POST | 200 | session lifecycle (held/no_show/cancel/reschedule) |
| 17 | `/api/mentor/notes` | POST/PATCH/DELETE | 200; DELETE = soft (deleted_at) | NO hard delete |
| 18 | `/api/mentor/profile` | GET/PATCH | 200 | persists to mentor_profiles |
| 19 | `/api/mentor/settings` | GET/PATCH | 200 | persists to settings JSONB |
| 20 | role guard | any mentor route w/ contributor JWT | 403 | RBAC enforced |

Suggested harness: a small `pytest` + `httpx` suite under `backend/` (additive),
or extend `e2e/mentor.spec.ts`. Do NOT seed/teardown by deleting rows — create
test rows with a recognizable prefix and leave them (no-DB-delete rule).

---

## 5. Open decisions (need your input)

1. **Canonical mentor backend port** — :8101 (bundled mentor svc, recommended)
   vs. :8102 (super-admin, current `.env.local`).
2. **Credentials provider** — keep NextAuth Prisma-local password, or route
   login through FastAPI `auth_app` (recommended for one source of truth).
3. **Session store unification** — Prisma `Session` (Next) vs. FastAPI
   `mentor_sessions`. Pick one.
4. **Notifications source** — derive from events/audit, or add an additive
   `mentor_notifications` table.

---

## 6. Guardrails (repeat — do not violate)

- No DB deletes/drops. Additive migrations only. Ask first if removal seems needed.
- No switching off the existing Neon / MongoDB / Redis instances.
- All file writes stay inside `newfrontend2/mentor`. Other role folders read-only.
- Don't build or modify mentor provisioning (it's super-admin's domain).
