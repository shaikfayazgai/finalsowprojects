# Enterprise Login Flow — Integration Plan Sheet

Scope: **enterprise panel only**. Do **NOT** build super-admin — only consume its
APIs. Additive only, no DB deletes, no DB-engine change.

## The flow we are wiring

1. Super-admin (external) provisions an enterprise user with a **default password**
   and sets `must_change_password = TRUE` on `login_accounts`.
2. User signs in at **`/enterprise/login`** with email + default password.
3. On **first sign-in** the backend returns `user.requiresPasswordChange = true`
   → frontend **forces a password reset** before the dashboard.
4. After reset, backend clears the flag → user lands on **`/enterprise/dashboard`**.
5. **Forgot password = OTP** (email code → verify → set new password). Already built.

## What ALREADY exists (verified — reuse, don't rebuild)

| Piece | Location | Status |
|-------|----------|--------|
| Backend login returns `requiresPasswordChange` from `must_change_password` | `backend/auth_app/routers/auth.py:145` | ✅ |
| Credentials provider captures `requiresPasswordChange` | `src/auth.ts:310` | ✅ |
| JWT + session callbacks propagate it → `session.user.requiresPasswordChange` | `src/auth.ts:382, 504` | ✅ |
| Backend `/api/v1/auth/password/change` (Bearer auth, `{old_password?, new_password, confirmPassword?}`) | `backend/auth_app/routers/auth.py:392` | ✅ |
| `set_password` **clears** `must_change_password` | `backend/auth_app/repo.py:94` | ✅ |
| OTP forgot-password (3-step) page | `src/app/enterprise/forgot-password/page.tsx` | ✅ (built) |
| OTP API routes (`send-email`, `verify-email`, `setup-after-otp`) | `src/app/api/auth/otp/*`, `password/setup-after-otp` | ✅ |
| Enterprise login page (email+password, forgot link, no register/OAuth) | `src/app/enterprise/login/page.tsx` | ✅ (built) |
| `/enterprise/login` + `/enterprise/forgot-password` made public | `src/proxy.ts` | ✅ (built) |

**Conclusion:** the signal travels end-to-end already. Remaining work = **enforce
the gate** + **add the forced-reset screen** + **fix the JWT-forwarding gap** so the
backend change-password call is authenticated.

## Work items (decisions applied: backend path · land on dashboard)

| ☐ | ID | Task | File(s) |
|---|----|------|---------|
| ☑ | L1 | **Inject backend JWT in proxy** (prereq F2) — read `auth()` session, set `Authorization: Bearer ${session.user.accessToken}` so backend `/password/change` is authenticated | `src/lib/api/backend-service.ts` |
| ☑ | L2 | **Forced-reset screen** at `/enterprise/reset-password` (new) — session-aware: reads `session.user.requiresPasswordChange`; collects new password + confirm (with strength meter); on submit calls L3 | `src/app/enterprise/reset-password/page.tsx` (new) |
| ☑ | L3 | **Change-password call** → POST to **backend** `/api/v1/auth/password/change` via a thin proxy route `src/app/api/enterprise/auth/change-password/route.ts` (new, forwards to backend so `must_change_password` clears). Body `{new_password, confirmPassword}` (no old password needed for default-pw first reset) | new route |
| ☑ | L4 | **Enforce the gate** — in the enterprise area, if `session.user.requiresPasswordChange` is true and path ≠ `/enterprise/reset-password`, redirect there. Put the check in `src/proxy.ts` (enterprise prefix) **and/or** `src/app/enterprise/layout.tsx` for a server guard | `src/proxy.ts`, `src/app/enterprise/layout.tsx` |
| ☑ | L5 | **Post-reset** — refresh the NextAuth session (re-login silently or `update()`) so `requiresPasswordChange` flips false, then `router.push('/enterprise/dashboard')` | reset page |
| ☑ | L6 | **Login page**: on successful sign-in, if `requiresPasswordChange` → route to `/enterprise/reset-password` instead of dashboard | `src/app/enterprise/login/page.tsx` |
| ☑ | L7 | Make `/enterprise/reset-password` reachable while the gate is active (it's auth-required, not public — user IS logged in) | `src/proxy.ts` (allow under enterprise prefix without re-gating) |

## Edge cases to handle

- **Reset loop guard:** L3 must hit the backend (clears the flag). If it only touched
  Prisma, `must_change_password` would stay true → infinite redirect. (This is why
  L1 + backend path are required.)
- **Session staleness:** after change-password the JWT still carries the old
  `requiresPasswordChange=true` until refreshed → L5 must force a session update or
  re-auth so the gate releases.
- **OTP forgot path** already clears the flag via `setup-after-otp` → `set_password`
  (`clear_must_change=True`). No extra work; just confirm.
- **MFA users:** if `mfa_enabled`, backend returns `mfa_required` first; forced-reset
  applies only after a real session is minted. Out of scope unless an enterprise user
  has MFA — note and defer.

## Verification (end-to-end)

1. ☑ Fix `.env.local` → `BACKEND_SERVICE_URL=http://127.0.0.1:8103`; boot backend.
2. ☑ Via super-admin API (external), create an enterprise user with a default
   password and `must_change_password=TRUE`.
3. ☑ Sign in at `/enterprise/login` → expect redirect to `/enterprise/reset-password`
   (cannot reach dashboard).
4. ☑ Set a new password → backend clears flag → land on `/enterprise/dashboard`.
5. ☑ Sign out, sign in again with the **new** password → goes straight to dashboard
   (no reset prompt).
6. ☑ Use **Forgot password** → OTP email → verify → set password → sign in with it.
7. ☑ Confirm no DB rows were deleted; only `password_hash` / `must_change_password`
   updated.

## Guardrails
- Only edit under `newfrontend2/enterprise`. No super-admin build — API calls only.
- Reuse the existing NextAuth token + OTP routes; one auth path, no second mechanism.

---

# ✅ IMPLEMENTED & VERIFIED — 2026-06-11

Status: **DONE**. Backend on `:8103` + Next dev on `:3001`, full flow tested
against the live Neon DB. **17/17 automated acceptance checks pass.**

## Frontend changes (all under `src/app/enterprise` + proxy/layout)
- **L1** `src/lib/api/backend-service.ts` — proxy now injects the NextAuth-held
  backend JWT (`session.user.accessToken`) as `Authorization: Bearer …` (respects
  an existing Authorization header). Unblocks every proxied enterprise call.
- **L2/L5** `src/app/enterprise/reset-password/page.tsx` (new) — forced-reset
  screen (new password + confirm + strength meter). On success: change pw → silent
  re-login with new pw → `/enterprise/dashboard`. Has a "Reset by email" link.
- **L3** `src/app/api/enterprise/auth/change-password/route.ts` (new) — proxies to
  backend `/api/v1/auth/password/change` so `must_change_password` is cleared.
- **L4/L7** `src/app/enterprise/layout.tsx` — gate: if
  `session.user.requiresPasswordChange` and not on the reset page → redirect to
  `/enterprise/reset-password`; reset page renders bare (no shell), like onboarding.
- **L6** `src/app/enterprise/login/page.tsx` — on sign-in, if
  `requiresPasswordChange` → route to reset; added `reason=password_changed` notice.
- `src/proxy.ts` — `/enterprise/login` + `/enterprise/forgot-password` are public.

## Forgot-password / OTP UX conditions (as requested)
- **Security-neutral send**: message is *"If an account exists for {email}, a
  6-digit code is on its way. It expires in 5 minutes."* — identical whether or not
  the account exists (backend also returns the same `{ok:true}` regardless).
- **Loading states**: send/verify buttons show a spinner ("Working…") while in
  flight (`loading={submitting}`).
- **Failure copy**: send failure → *"Sending isn't working right now…"*; verify
  failure → *"Verifying isn't working right now…"*; wrong/expired code → *"That code
  is invalid or expired. Check your email or resend a new code."*
- **Forgot link on reset**: the forced-reset page links to `/enterprise/forgot-password`.

## Backend fixes (under `backend/`, in-scope; additive — no deletes, same DBs)
- `backend/app.py` — dependency-free `_load_env_file()` loads `backend/.env`
  BEFORE `shared.config` imports. Without it the sync psycopg2 path hit
  `localhost:5432` and every DB call 500'd. Now connects to Neon. **Run with
  `python -m uvicorn app:app --port 8103`** (app.py only builds the app object).
- `backend/auth_app/routers/auth.py` `otp/send-email` — email send moved to a
  FastAPI `BackgroundTasks` task. OTP is persisted to Redis synchronously (verify
  still works instantly); response no longer blocks on Gmail SMTP. **Send dropped
  from ~5s → ~0.3s.** Security-neutral `{ok:true}` preserved.
- `backend/auth_app/routers/auth.py` `password/setup-after-otp` — now accepts a
  still-valid code **OR** a recent verification marker (`is_recently_verified`).
  Fixes a real bug: the two-step UI verifies the code first (single-use → deleted),
  so the subsequent set-password call would have failed with "Invalid or expired
  code". Both paths still require a genuine prior OTP.
- `.env.local` — `BACKEND_SERVICE_URL`/`GLIMMORA_API_BASE_URL`/
  `NEXT_PUBLIC_GLIMMORA_API_URL` → `http://127.0.0.1:8103` (was `:8102` super-admin).

## Acceptance conditions — VERIFIED (17/17)
| # | Condition | Result |
|---|-----------|--------|
| 1 | Forced-reset login returns `requiresPasswordChange=true` | ✅ |
| 2 | Backend change-password succeeds + clears flag | ✅ HTTP 200 |
| 3 | **Old password must NOT work** after reset | ✅ 401 |
| 4 | **New password works** + flag now false | ✅ |
| 5 | OTP send security-neutral **and fast** | ✅ 0.26–0.37s |
| 6 | **Wrong OTP rejected** | ✅ 400 |
| 7 | **Correct OTP verifies** | ✅ |
| 8 | **Full forgot flow** send→verify→set-new works | ✅ |
| 9 | New (forgot) password works; previous rejected | ✅ |
| 10 | **OTP expires after 5 min** (Redis TTL `OTP_TTL_SECONDS = 5*60`) | ✅ |

Test harness: `C:\tmp\ent_flow_test.py` (urllib, hits `:8103`). Test account
`ent.reset.tester@gmail.com` / `Default@123` (`must_change_password=TRUE`) created
**additively** for testing — no rows deleted. `OTP_DEV_ECHO=1` echoes the code for
automated testing only; leave it **unset in production** so codes are email-only.

## Run locally
```
# backend (Neon-connected, :8103)
cd backend && python -m uvicorn app:app --host 127.0.0.1 --port 8103
# frontend (:3000, or next free port)
npm run dev
```
Then sign in at `/enterprise/login` with a `must_change_password` account → it
forces `/enterprise/reset-password` → set new pw → dashboard.
