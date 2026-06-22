# Enterprise Integration — Plan Sheet

Frontend (`newfrontend2/enterprise`, Next.js 16) ↔ Backend (`backend/`, FastAPI, **:8103**, all paths `/api/v1`).
Scope: **enterprise only**. Rules: additive (no DB deletes), no DB-engine change, keep mocks as fallback.

Legend — State: 🔴 mock-only · 🟡 partial/hybrid · 🟢 live. Done: ☐ / ☑

---

## 🔒 LOCKED — DONE, DO NOT TOUCH AGAIN (verified 2026-06-11)

| ☑ | Module | State | Notes |
|---|--------|-------|-------|
| ☑ | **Enterprise login** (`/enterprise/login`) | 🟢 LIVE | `signIn("credentials")` → backend `/api/v1/auth/login` (Neon `login_accounts`). Super-admin-provisioned accounts log in. Renders bare (no shell). |
| ☑ | **Forced first-login reset** (`/enterprise/reset-password`) | 🟢 LIVE | Default/temp password → forced reset (`must_change_password`) → set new pw → dashboard. "Back to sign in" link. |
| ☑ | **Forgot password — OTP** (`/enterprise/forgot-password`) | 🟢 LIVE | OTP email (send/verify/set), 5-min expiry, single-use, security-neutral copy. Default-password reset verified working. |
| ☑ | **Logout / session-expiry** | 🟢 LIVE | Clears localStorage/cookies, non-blocking revoke (fast), redirects to `/enterprise/login`; guest can't see stale dashboard data. |
| ☑ | Foundation F1/F2/F4 + `DATABASE_URL` (Prisma) + Turbopack dev | 🟢 LIVE | Backend `:8103`, JWT injection, Neon `DATABASE_URL`, dev on Turbopack. |

Files (do not regress): `src/app/enterprise/{login,forgot-password,reset-password}/page.tsx`,
`src/app/enterprise/layout.tsx`, `src/proxy.ts`, `src/lib/api/backend-service.ts`,
`src/lib/auth/clear-client-session.ts`, `src/components/meridian/shell/AccountMenu.tsx`,
`src/auth.ts` (signout event), `.env.local`, `package.json` (dev script).
Full detail: `ENTERPRISE_LOGIN_FLOW_PLAN.md`.

---

## 0. Foundation (blocks everything — do first)

| ☐ | ID | Fix | File | Detail |
|---|----|-----|------|--------|
| ☐ | F1 | Point env at enterprise backend | `.env.local` | `BACKEND_SERVICE_URL=http://127.0.0.1:8103` (currently `:8102` = super-admin ❌) |
| ☐ | F2 | Inject backend JWT in proxy | `src/lib/api/backend-service.ts` | Read `auth()` session → set `Authorization: Bearer ${session.user.accessToken}`. **Without this every proxied call 401s.** |
| ☐ | F3 | Envelope unwrap helper | `src/lib/api/envelope.ts` (new) | `unwrap(j) = j.data ?? j` — some routers wrap `{success,data}`, others raw |
| ☐ | F4 | Boot backend on 8103, `/health` ok | `backend/app.py` | `python backend/app.py` → confirm reachable |
| ☐ | F5 | Demo fallback flag uniform | clients | `NEXT_PUBLIC_ENTERPRISE_DEMO=1` keeps mocks when backend down |

---

## 1. Module wiring matrix

| ☐ | Module | State | FE client (mock→fetch) | Next route to add/use | Backend endpoint(s) `/api/v1` | Envelope |
|---|--------|-------|------------------------|------------------------|-------------------------------|----------|
| ☐ | **SOW** | 🔴 | `lib/api/sow-v2.ts` | `api/sow/route.ts`, `api/sow/[sowId]/route.ts`, action routes | `/sow` (list/create/get/patch), `/sow/{id}/{submit,approve,reject,send-back,withdraw,archive}`, `/sows/*` (AI) | wrapped |
| ☐ | **Decomposition** | 🔴 | `lib/api/decomposition-v2.ts` | `api/decomposition/plans/route.ts` + `[planId]/...` | `/enterprise/decomposition/plans` (decomp_plans wins), `/{approve,activate,archive,copy}` | **raw** |
| ☐ | **Projects/Tasks** | 🔴 | `lib/projects/projects-mock.ts` | `api/enterprise/projects/route.ts` + `[projectId]/...` | `/projects`, `/projects/{id}/milestones/{mid}/{accept,pay}`, team/skill | **raw** |
| ☐ | **Review queue** | 🟡 | `lib/api/enterprise-review.ts` | add `review-queue/history`, `review-queue/[submissionId]` | `/enterprise/review-queue` (list/history/get/claim/release/decide) | **raw** |
| ☐ | **Reviewer** | 🟡 | `lib/api/reviewer.ts` | (direct `/api/v1/reviewer/*`) | `/reviewer/{dashboard,projects,evidence}` | mixed |
| ☐ | **Workforce** | 🟡 | `lib/api/workforce.ts` (list still mock) | `api/enterprise/workforce` (exists) | `/enterprise/workforce` (list/add), `/import/{preview,apply}`, `/tasks/{id}/{assign,reassign}` | **raw** |
| ☐ | **Billing: payouts** | 🟢 | `lib/api/enterprise-billing.ts` | `api/payouts/tenant` (exists) | `/payouts/tenant` | raw |
| ☐ | **Billing: rate-cards** | 🟢 | — | `api/enterprise/rate-cards` (Prisma) | (Prisma-direct) | — |
| ☐ | **Billing: invoices** | 🔴 | `lib/billing/invoices-mock.ts` | `api/enterprise/invoices/route.ts` + `[invoiceId]` | `/billing/invoices` (+`/summary`, `/{id}` patch) | **raw** |
| ☐ | **Billing: CSV export** | 🔴 | `enterprise-billing.ts:downloadBillingCsv` | `api/enterprise/billing/export` | `/billing/export` | file |
| ☐ | **Compliance** | 🟢 | (Prisma routes) | `api/enterprise/compliance/*` | (Prisma; backend mirror optional) | — |
| ☐ | **Audit** | 🟢 | `lib/api/audit-view.ts` | `api/audit/export` (Prisma) | (Prisma-direct) | — |
| ☐ | **Analytics** | 🔴 | `lib/analytics/analytics-mock.ts` | derive client-side | `/billing/summary` + queue stats (no new BE) | — |
| ☐ | **Notifications** | 🟡 | `lib/api/notifications.ts` | add `[id]/read`, `mark-all-read` | `/notifications` (GET live) | — |
| ☐ | **Settings** | 🟡 | `lib/api/settings.ts` + stores | audit each save | tenant/plan/security/policies/integrations | mixed |
| ☐ | **Profile/Onboarding** | 🟢 | `useProfileStoreV3` | `api/users/me/profile` proxy | `/users/me/profile`, `/me/profile-picture` | wrapped |
| ☐ | **Dashboard** | 🟡 | composes others | — | goes 🟢 when above wired; KPIs from `/billing/summary` | — |

---

## 2. Known backend stubs (don't expect real data)

| Endpoint | Returns |
|----------|---------|
| `/sows/{id}/hallucination-analysis` | stored layers or `[]`, confidence 0.9 |
| `/sows/{id}/risk-assessment` | `{overall:"low", factors:[]}` |
| `/enterprise/compliance/overview` | rolled-up counts (fail-open) |
| `/razorpay/*`, `/payouts/webhook` | simulated, no live gateway |
| `/sow export pdf\|docx` | returns row, no real file gen |

---

## 3. Execution order

1. ☐ **F1–F5** foundation (env, JWT, unwrap, boot, fallback)
2. ☐ **SOW → Decomposition → Projects** (core chain; backend auto-creates next step)
3. ☐ **Review queue + Workforce**
4. ☐ **Invoices + CSV + Notifications mark-read**
5. ☐ **Analytics (derived) + Settings persistence audit**
6. ☐ Retire redundant compliance mock wrappers (`enterprise-consent/retention/compliance.ts`)

---

## 4. End-to-end verification

☐ Backend up on `:8103` (`/health`) · ☐ `.env.local` fixed · ☐ login at `/enterprise/login` (stores `accessToken`)
☐ Walk: **SOW create → 5-gate approve → plan auto-created → activate → project → assign workforce → contributor submit → review claim/decide → milestone accept/pay → invoice → payout** — each hits FastAPI (watch logs), no mock fallback.
☐ `NEXT_PUBLIC_ENTERPRISE_DEMO=1` → graceful mock fallback when backend down.

---

_Companion: see `ENTERPRISE_INTEGRATION_PLAN.md` for full per-module detail._
