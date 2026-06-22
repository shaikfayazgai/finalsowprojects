# Super-Admin Integration — Plan Sheet

Frontend (`newfrontend/frontend`, Next.js) ↔ Backend (`backends/super-admin/backend`, FastAPI, **:8102**, paths `/api/v1` + `/api/superadmin` + `/api/admin`).
Scope: **super-admin only**. Rules: additive (no DB deletes), no DB-engine change, keep mocks as fallback, **UI + backend must be FAST**.

Legend — State: 🔴 mock-only · 🟡 partial/hybrid · 🟢 live. Done: ☐ / ☑

> **Access:** use `http://localhost:3300` (NOT `127.0.0.1` — blocked by Next cross-origin → React won't hydrate).
> **Super-admin test account:** `sfayazmr@gmail.com` / `Fayaz@123` (real inbox for OTP). Alt: `superadmin@glimmora.dev`.
> `.env.local`: `BACKEND_SERVICE_URL=http://127.0.0.1:8102`, `AUTH_SECRET` = backend `API_SECRET_KEY`.

---

## ✅ LOCKED — DONE, do NOT touch again

| ☑ | Feature | What was done | Verified |
|---|---------|---------------|----------|
| ☑ | **Admin login** (`/admin/login`) | Dedicated admin-only sign-in page. Email + password + show/hide only — **no SSO, no "create account", no "main sign in"**. Standalone (bypasses admin shell via `BARE_ADMIN_ROUTES` in admin-client-layout + `/admin/login` added to proxy `PUBLIC_EXACT_PATHS`). Uses backend `signIn("credentials")` → real `glimmoraAccessToken`. Role normalized (`superadmin`→`super_admin`) in `auth.ts normalizeRole()` so it routes to `/admin/dashboard` (fixed `portal_mismatch`). Footer: "Forgot your password? **Reset it**" → `/auth/forgot-password?return=/admin/login`. | Browser: hydrates on localhost, login → `role=superadmin`, lands on `/admin/dashboard`. |
| ☑ | **Forgot password (OTP)** (`/auth/forgot-password`) | 3-step OTP flow (NO reset-link): **enter email → enter 6-digit OTP → set new password**. Proxies: `/api/auth/otp/send-email`, `/otp/verify-email`, `/password/setup-after-otp` → backend `/api/v1/auth/*`. Returns to `?return=` path (admins → `/admin/login`, others → `/auth/login`). Wrapped in `Suspense` (build-safe `useSearchParams`). | Backend E2E + real email delivery confirmed (code received in inbox). |

### Auth-flow behaviors verified (conditionals — all pass, locked)
| ☑ | Condition | Result |
|---|-----------|--------|
| ☑ | Wrong OTP rejected | "verifying not working" / invalid-code error |
| ☑ | Valid OTP works | verify succeeds |
| ☑ | New password works after reset | login OK |
| ☑ | **Old password does NOT work after reset** | login rejected |
| ☑ | OTP expires after **5 minutes** | `OTP_TTL_SECONDS = 300` |
| ☑ | Security: never reveal account existence | send shows "If an account exists for <email>, you'll receive a 6-digit code. It expires in 5 minutes." |
| ☑ | Fast UX states | button text: **"Sending…"** (send), **"Verifying…"** (verify), **"Saving…"** (set password) |

**Backend fix shipped:** `password/setup-after-otp` accepts EITHER a valid code OR a recent verification (`is_recently_verified`) — `verify-email` consumes the code, so the final step must not require it again. (`auth_app/routers/auth.py`)

---

## ✅ LOCKED — Tenants (create / onboarding / delete+cascade / email-uniqueness / status / dashboard) — 2026-06-11

These tenant flows are wired to the backend, verified end-to-end, and **LOCKED — do NOT touch again**:

| ☑ | Feature | What was done | Verified |
|---|---------|---------------|----------|
| ☑ | **Tenant list** (`/admin/tenants`) | Reads LIVE backend (`GET /api/superadmin/tenants`, proxy injects admin bearer). No mock fallback — skeleton while loading (no flash). On backend-unreachable shows **"Couldn't load tenants — connection issue" + Retry** (never a false "no tenants"). Prisma `"Tenant"` is source of truth. | Real tenants only; backend-down shows retry, not empty. |
| ☑ | **Create tenant** (`/admin/tenants/new`) | 6-step wizard POSTs full draft → `POST /api/superadmin/tenants` → Prisma `"Tenant"` row. **Tenant ID auto-generated = `<slug>-<5–6 char random>`** (unique by design); uniqueness re-checked + regenerated **on Continue** (not live). Backend email send is a **BackgroundTask** (create returns fast ~2–3s). Wizard surfaces backend errors. Button reads **"Send onboarding"**. | Create fast + persists; no false "ID taken"; errors surfaced. |
| ☑ | **Onboarding (first admin)** | Provisions first **enterprise** admin: default temp password → **emailed** → `must_change_password=TRUE` → **forced reset on first login**. Email login URL = `http://localhost:3001/enterprise/login` (env `ENTERPRISE_LOGIN_URL`); also used by resend. | Real email received w/ temp pw + enterprise login link. |
| ☑ | **EMAIL UNIQUENESS (all users)** | Email must be **globally unique across every role/tenant**. DB: **UNIQUE index on `LOWER(email)`** (`idx_login_accounts_email_lower`). create-tenant validates the admin email **before** creating the tenant (no orphan) → 409 "email already in use" if taken; register/contributor/enterprise/reviewer + users-create also reject dups. | Dup email → 409 (no orphan tenant); fresh → 201. |
| ☑ | **Delete tenant (SOFT) + CASCADE-offboard users** | `DELETE /api/superadmin/tenants/{id}` → tenant `deletedAt`+`status=closed` (row retained, never hard-delete). **ALL the tenant's user accounts** (admin + every enterprise user, no role filter) are offboarded: `is_active=FALSE` + email **tombstoned** (`x@y.com.deleted.<ts>`) so **all those emails free up for reuse**. Delete button on detail + provisioning pages (confirm). | create→delete→email freed→re-create same email = 201, full cycle. |
| ☑ | **Status reflects ONBOARDING** | List/detail status is **derived**: `active` only once the first admin signed in AND reset the temp password; else `provisioning`; `paused`/`closed` preserved. | kavi (admin not reset) → provisioning; Fayaz (reset) → active. |
| ☑ | **Provisioning page** (`/[id]/provisioning`) | Wired to backend: resolves tenant via `useAdminTenant` (no "tenant not found" for backend ids), steps from `GET /provisioning-status` (15s refresh; first-sign-in flips done after reset), admin email + Resend from backend. 401 → clear session + `/admin/login`. | kavi provisioning loads w/ real status + admin email. |
| ☑ | **Dashboard tenant values** | `kpis.tenants` + `pipeline.tenantsActive` derive from the LIVE tenant list. | Matches the live list. |
| ☑ | **Logout / session-expiry** | `clearClientSession()` wipes localStorage + sessionStorage + cookies + Cache Storage. Admin sign-out → `/admin/login`; tenant 401 → clear + `/admin/login`. | — |
| ☑ | **Login UX** | Admin login button shows **"Verifying…"** while signing in. | — |

**Files (locked):** FE — `app/api/superadmin/tenants/route.ts` (GET/POST), `…/tenants/[tenantId]/route.ts` (GET/DELETE), `…/tenants/[tenantId]/provisioning-status/route.ts`, `…/users/resend-credentials/route.ts`, `lib/hooks/use-admin-tenants.ts`, `lib/hooks/use-admin-tenant.ts`, `lib/auth/clear-session.ts`, tenants-workspace / new-tenant-workspace / tenant-detail-workspace / tenant-provisioning-workspace, dashboard-workspace, admin/login/page.tsx, AccountMenu + AdminTopbar. BE — `superadmin_app/routers/tenants_list.py` (create + soft-delete + email-uniqueness + onboarding-derived status), `superadmin_app/routers/audit.py` (provisioning-status + adminEmail), `auth_app/repo.py` (`create_tenant`/`get_tenant`/`soft_delete_tenant` cascade-offboard/`link_tenant`).

### ⏳ Tenants — NOT done yet (fix LATER, intentionally deferred)
- **Full tenant detail sub-sections** — detail page still uses mock/partial data for: tenant **users list**, tenant-scoped **audit**, **subscription/plan history**, **SSO**, **rate-cards**, **workforce policy**. Core MockTenant fields are live. Wire these later.
- **Tenant PATCH** (update status/tier/plan) — pause/change-tier still use the local store, not the backend.
- **Resend credentials on the detail page** (currently only on provisioning page; works there).

---

## Remaining super-admin modules (to integrate next)

> Backend APIs already built + live (`backends/super-admin`, all shape-aligned to the frontend mocks). Frontend still reads `src/lib/admin/mocks/*` — swap each `*-service.ts` to fetch the backend.

| ☐ | Module | State | Backend endpoint(s) | Notes |
|---|--------|-------|---------------------|-------|
| ☐ | Dashboard | 🔴 | `GET /api/superadmin/dashboard` | rebuilt to MockAdminDashboard shape (env/kpis/pipeline/attention/recent/aiSignals) |
| 🔶 | Tenants | 🟢 list/create/delete · 🟡 detail | `GET/POST/DELETE /api/superadmin/tenants`, `/{id}` | **LOCKED for create/onboarding/delete/dashboard-values** (see section above). LATER: resend-credentials on detail, full detail sub-sections (users/audit/plan/SSO), PATCH update. |
| ☐ | Mentors | 🔴 | `GET /api/superadmin/mentors`, `/{id}` | list returns roles[]/country/pools/30d metrics |
| ☐ | KYC | 🔴 | `GET /api/superadmin/kyc`, `/{id}`, `POST /{id}/decision` | list emits id/contributorName/track; decision accepts outcome+more_info |
| ☐ | Governance | 🔴 | 6× `/api/superadmin/governance` | MockGovCase, 8 seeded |
| ☐ | Roles | 🔴 | `GET /api/superadmin/roles` | 19 role defs |
| ☐ | Rubrics | 🔴 | 6× `/api/superadmin/rubric-templates` | MockRubricTemplate + feedback |
| ☐ | Payment rails | 🔴 | 6× `/api/payment-rails` | MockPaymentRail, 4 seeded |
| ☐ | Partnerships | 🔴 | 13× `/api/superadmin/partnerships/*` | universities + women-workforce |
| ☐ | Email templates | 🔴 | 3× `/api/admin/email-templates` | 10 seeded |
| ☐ | Email settings (SMTP) | 🟡 | `/api/admin/email-settings/smtp` (+`/test`) | test returns `success` alias |
| ☐ | AI agents | 🔴 | `/api/admin/agents` + prompt versions | version fields aligned |
| ☐ | Audit log | 🔴 | `/api/superadmin/audit-log` (+`/export`) | |
| ☐ | Users mgmt | 🔴 | `/api/superadmin/users` (+resend-credentials, check-email), `/api/v1/users/search` | resend-credentials + forced-reset wired |
| ☐ | System health | 🔴 | — (not built) | only missing backend domain |

---

_Last updated: 2026-06-11. LOCKED & verified — do NOT touch: **Auth** (login + forgot-password OTP) and **Tenants** (create + auto unique tenant-ID, onboarding email + forced reset, **global email uniqueness across all users**, soft-delete that **cascade-offboards all the tenant's user accounts & frees their emails**, onboarding-derived status, provisioning page backend-wired, dashboard tenant values, logout/session cleanup, "Verifying…" login). Deferred: full tenant-detail sub-sections (users/audit/plan/SSO/rate-cards), tenant PATCH, resend-credentials on detail page. Then: all other modules (mentors, KYC, governance, rubrics, rails, partnerships, AI, audit, roles, system-health)._
