# 🔒 Integration Lock — Super-admin · Enterprise · Mentor · Reviewer

Unified frontend = `newfrontend/frontend` (one app, all role logins) · Backend = `backends/super-admin/backend` (`:8102`, all role services in one process) · Shared Neon Postgres.

**LOCKED & verified as of 2026-06-12 — do NOT regress.**

---

## Super-admin
| ✅ | Feature | Notes |
|---|---------|-------|
| ☑ | **Login** `/admin/login` | backend credentials → real JWT; "Verifying…" |
| ☑ | **Forgot password** | OTP (send → verify → set), 5-min expiry, security-neutral |
| ☑ | **Forced first-login reset** `/admin/reset-password` | default password → set new (session-token via proxy) → portal |
| ☑ | **Tenant dashboard** | tenant KPIs from LIVE list; other mock values reset to 0 (clean zero-state) |
| ☑ | **Tenant creation** | auto-unique ID (`name-<rand>`, checked on Continue), onboarding email + **role-based login link**, forced reset, **global email uniqueness** |
| ☑ | **Tenant deletion** | soft-delete (recoverable) + **offboard accounts (emails freed)** + **CASCADE all tenant-scoped data by `tenant_id`** (workforce/profiles/sows/decomp/mentor/reviewer/subs/sso) |
| ☑ | **Tenant detail** | live (no "not found"); shows **Admin email**, onboarding-derived status, provisioning page wired |
| ☑ | **Mentor creation** | invite + temp password emailed + forced reset + uniqueness |
| ☑ | **Mentor deletion** | soft offboard + email freed |
| ☑ | **Mentor status update** | pause / resume (`is_active`) + role tier (PATCH) |
| ☑ | **Mentor resend invite** | regenerate temp pw + re-email |

## Enterprise
| ✅ | Feature | Notes |
|---|---------|-------|
| ☑ | **Login** `/enterprise/login` + **Forgot** `/enterprise/forgot-password` (OTP) + **Forced reset** `/enterprise/reset-password` | |
| ☑ | **Settings → Tenant & roles → Team** | gated by real RBAC (`/me` returns enterprise role: owner→admin, members→ent.*) |
| ☑ | **Member (role) creation** | invite with role (`ent.admin/sponsor/pmo/finance/legal/reviewer/it`); temp password + **role-based login link**; forced reset; email globally unique |
| ☑ | **Member status update** | activate / suspend |
| ☑ | **Member deletion** | soft offboard + email freed (owner hidden from the list) |
| ☑ | **Member resend** | fresh temp pw + re-email |

## Mentor
| ✅ | Feature | Notes |
|---|---------|-------|
| ☑ | **Login** `/mentor/login` + **Forgot** (inline OTP) | |
| ☑ | **Default password → forced first-login reset** | `/mentor/reset-password` (was missing; added) |
| ☑ | **Status update** | via super-admin Mentors (pause/resume/roles) |

## Reviewer
| ✅ | Feature | Notes |
|---|---------|-------|
| ☑ | **Login** `/reviewer/login` + **Forgot** `/reviewer/forgot-password` (OTP) | |
| ☑ | **Default password → forced first-login reset** | `/reviewer/reset-password` |
| ☑ | **Status update** | reviewer = `ent.reviewer` team member → enterprise Team status/delete |

## Cross-cutting (locked)
- **Unified frontend** — all role logins in ONE app; `proxy.ts` + `normalizeRole` route each role to its portal.
- **Global email uniqueness** across all users (DB unique `LOWER(email)` index + app checks).
- **Single-use temp password** — works once; reused temp → 403 (`temp_password_used`); use Forgot for a fresh code.
- **Role-based login links** in every credential email → unified `:3300` (admin/enterprise/mentor/reviewer).
- **No hard DB deletes** for accounts/tenants — soft offboard + email tombstone (recoverable); tenant *operational data* is the deliberate exception (cascaded on tenant delete, per requirement).

---

## Scope: LOGIN FLOWS + LIFECYCLE UPDATES only
SOW / Decomposition / Projects / Billing / Analytics and the enterprise **settings**
modules are explicitly **out of scope** — not tracked here.

### ✅ Tenant suspend/resume + tier — DONE (2026-06-13)
`PATCH /api/superadmin/tenants/{id}` persists status (active/**suspended**) + tier.
**Suspend = block:** the tenant + all its users are blocked — they authenticate but
every portal shows the **"Workspace suspended — contact the platform admin"** screen
(enforced via `/me tenant.status`, **polled every 20s** so already-logged-in accounts
are bounced live). Resume restores. Change-tier persists via the subscription endpoint.

### ✅ Tenant complaints / contact-the-admin — DONE (2026-06-13)
Enterprise users file a ticket at **`/enterprise/support`** with **Reason** (dropdown,
incl. Other), **Priority** (low/medium/high/urgent), **"when did it start?"** date,
subject + details → `POST /api/v1/enterprise/complaints` (tenant-scoped). Suspended
tenants get the **same form on the suspended-workspace screen** ("Raise a ticket") since
the rest of the portal is blocked — the submit token stays valid. Tickets land in the new
super-admin **Complaints** section **`/admin/complaints`** (`GET /api/superadmin/complaints`
with open/in-progress/resolved filters + counts; rows show reason + priority badge +
start date), where the platform admin can **resolve / mark in-progress / reopen** and
leave a note (`PATCH …/{id}`). The tenant sees status + admin note back on Support.
Options live in `src/lib/config/complaints.ts` (shared, matches backend valid-sets).
Table = `complaints` (+`priority`,`issue_started_on` — additive ALTERs). E2E verified:
submit (with priority+date) → admin-list → resolve → tenant sees note; bad values fall
back to defaults (no 4xx/5xx).

### ✅ Multi-role members + role-change — DONE (2026-06-13)
A member can hold several roles (e.g. PMO + Reviewer): `login_accounts.extra_roles TEXT[]`
(additive) merged into `/me` `roles[]`. **Manage roles** drawer (Settings → Tenant & roles
→ ⋯) now PERSISTS via `POST /api/v1/enterprise/team/{id}/roles` (one enterprise role stays
primary for routing, rest become extras). Team list shows all role chips (`roleCodes[]`).

### ✅ Two enterprise login doors + reviewer panel — DONE (2026-06-14)
- **`/enterprise/login`** = workspace **ADMIN only** (owner/ent.admin). A non-admin is
  signed out + told to use the users door.
- **`/enterprise/users/login`** = tenant **users** (PMO/Finance/Security/Legal/Sponsor) →
  `/enterprise/dashboard`. **Reviewers are NOT here** — they sign in at **`/reviewer/login`**.
- Reviewer panel renders only for session role `reviewer` (login role bare `reviewer`); a
  reviewer stored as `ent.reviewer` normalizes to `enterprise` and would get the enterprise
  sidebar (latent quirk — keep reviewer accounts as `reviewer`).
- E2E verified (2026-06-14, live API): reviewer login 200 → session role `reviewer` →
  `/enterprise/reviewer/queue` 200 (reviewer panel); `/enterprise/dashboard` 307 (bounced).

Everything in scope is done + verified — every role's **login / forgot / forced-reset /
single-use default-password**, plus **create / delete / status / resend / role-change**
for tenants (incl. **suspend/resume + tier**, complaints), mentors, and enterprise members.

_Last verified 2026-06-12: login + forgot + forced-reset (all roles), tenant create/delete(+cascade), mentor create/delete/status/resend, enterprise team invite/status/delete/resend, single-use temp, email uniqueness, role-based login links. Backend `:8102` + frontend `:3300` up; end-to-end auth + data proxy confirmed._
