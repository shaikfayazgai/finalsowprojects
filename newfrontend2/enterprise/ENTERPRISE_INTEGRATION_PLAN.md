# Enterprise Portal — Frontend ↔ Backend Integration Plan

> Scope: **enterprise panel only** (`newfrontend2/enterprise`). Other role
> modules are out of scope. No DB deletes, no DB engine changes — use the
> existing Neon Postgres / Mongo / Redis the backend already wires.

---

## Context

The enterprise frontend (Next.js 16) is built and visually complete, but most
feature modules run on **client-side mocks** (`src/lib/enterprise/mocks/*`,
`localStorage` overlay) instead of the **FastAPI enterprise backend**
(`newfrontend2/enterprise/backend`, runs on port **8103**, all paths under
`/api/v1`). A thin proxy layer exists (`proxyToBackendService`) and NextAuth
already mints + refreshes a backend JWT on login — but the wiring is incomplete
and, in places, misconfigured. This plan connects each module end-to-end.

### Three blocking issues that affect *every* proxied call

1. **Wrong backend URL.** `.env.local` has
   `BACKEND_SERVICE_URL=http://127.0.0.1:8102` (that's the super-admin service).
   The enterprise backend runs on **`:8103`**. → Fix env to `http://127.0.0.1:8103`.
   Proxy default in code is `:4000` (`src/lib/api/backend-service.ts:3`) — also wrong; env override is what matters.
2. **JWT not forwarded.** `proxyToBackendService` forwards browser headers
   (NextAuth **session cookie**) but the backend expects an
   `Authorization: Bearer <jwt>`. NextAuth already stores the backend token at
   `session.user.accessToken` (`src/auth.ts:501`, claim `glimmoraAccessToken`).
   The proxy must read the session server-side and inject
   `Authorization: Bearer ${session.user.accessToken}`. **Without this, every
   proxied enterprise call 401s.**
3. **Response-envelope mismatch.** Some backend routers wrap payloads in
   `{success, message, data}` (sows, wizards, approvals, users, legacy
   decomposition); others return **raw** (`decomp_plans`, portfolio/projects,
   billing invoices, review-queue, workforce). Frontend clients must unwrap
   consistently — standardize on a small `unwrap()` helper.

---

## Foundation work (do first — unblocks all modules)

| # | Change | File |
|---|--------|------|
| F1 | Point env at enterprise backend `:8103` | `.env.local` → `BACKEND_SERVICE_URL=http://127.0.0.1:8103` |
| F2 | Inject backend JWT in proxy: read `auth()` session, set `Authorization: Bearer <accessToken>` before `fetch` | `src/lib/api/backend-service.ts` |
| F3 | Add `unwrap(json)` helper that returns `json.data ?? json` for enveloped routers | new `src/lib/api/envelope.ts` |
| F4 | Confirm backend boots standalone on 8103 (`python backend/app.py`) and `/health` responds | backend (read-only run) |
| F5 | Keep a **demo fallback flag** (`NEXT_PUBLIC_ENTERPRISE_DEMO`) so mocks still work when backend is down — wire it uniformly | clients |

Pattern for each module below: **replace the mock body in the FE client with a
`fetch()` to the existing Next.js `/api/...` route** (creating the route as a
one-line `proxyToBackendService` forward when missing), keeping hooks/pages
unchanged. The mock stays as the `DEMO` fallback.

---

## Module-by-module integration

Legend — **State**: 🔴 mock-only · 🟡 hybrid/partial · 🟢 proxied & working (after F1–F2).

### 1. SOW Management 🔴
- **FE client**: `src/lib/api/sow-v2.ts` (explicit "MOCK MODE", reads `mocks/sows.ts`).
- **Backend**: `/api/v1/sow` (manual_sow.py) + `/api/v1/sows` (sows.py, AI) +
  singular alias `POST /api/v1/sow/{id}/approve`. Enveloped.
- **Routes to add**: `src/app/api/sow/route.ts` (GET list, POST create),
  `src/app/api/sow/[sowId]/route.ts` (GET, PATCH), and action routes
  (`/submit /approve /reject /send-back /withdraw /archive`) — each a
  `proxyToBackendService(req, "/api/v1/sow/...")` forward.
- **Work**: swap each `sow-v2.ts` function from `*Mock()` to `fetch()` +
  `unwrap()`. Map FE `SowStatus/SowStage` to backend's 5-stage canonical
  pipeline (legal→finance→security→final→commercial).
- **Verify**: create draft → submit → approve 5 stages → SOW `approved` →
  backend auto-creates decomposition plan.

### 2. Decomposition 🔴
- **FE client**: `src/lib/api/decomposition-v2.ts` (mock, reads `mocks/decompositions.ts`).
- **Backend**: `/api/v1/enterprise/decomposition/plans` — **two** implementations;
  `decomp_plans.py` (normalised tables) **wins** for GET/POST `/plans`;
  legacy `decomposition.py` (JSONB) serves the sub-resources. `decomp_plans` is **raw** (`{plan}` / `{items,nextCursor}`).
- **Routes to add**: `src/app/api/decomposition/plans/route.ts` (GET, POST) +
  `[planId]/route.ts` (GET, PATCH) + `[planId]/{approve,activate,archive,copy}`.
- **Work**: swap `decomposition-v2.ts` to fetch; align to `decomp_plans` raw
  shapes (milestones/tasks/dependencies). Honor cursor pagination.
- **Verify**: approved SOW → plan appears → edit structure → approve → activate.

### 3. Projects & Tasks 🔴
- **FE client**: `src/lib/projects/projects-mock.ts` (pure mock + localStorage).
- **Backend**: `/api/v1/projects` (list/detail, **raw**) +
  `/api/v1/projects/{id}/milestones/{mid}/{accept,pay}` + team-composition,
  skill-coverage. Source row created by SOW `promote-to-portfolio`.
- **Routes to add**: `src/app/api/enterprise/projects/route.ts` + `[projectId]/...`.
- **Work**: replace mock list/detail; wire milestone accept→pay chain to backend.
- **Verify**: project from promoted SOW → accept milestone → pay milestone.

### 4. Review / Acceptance Queue 🟡→🟢
- **FE client**: `src/lib/api/enterprise-review.ts` (hybrid; tries API, mock fallback).
- **Backend**: `/api/v1/enterprise/review-queue` (list/history/detail/claim/release/decide), **raw** `{items}`.
- **Routes**: list/claim/release/decide already exist as proxies; **add**
  `history/route.ts` and `[submissionId]/route.ts` (currently mock-only).
- **Work**: after F2, drop the mock fallback for list/decide; add the two
  missing proxy routes so history + detail go live.
- **Verify**: contributor submits → item in queue → claim → decide accept/rework.

### 5. Reviewer sub-portal 🟡
- **FE client**: `src/lib/api/reviewer.ts` calls `/api/v1/reviewer/*` **directly**
  (bypasses Next proxy) with a Bearer token.
- **Note**: reviewer dashboard/metrics are mock; queue is real. Confirm the
  reviewer backend router exists on `:8103`; if reviewer endpoints live in a
  separate service, route them through a Next proxy too for a consistent origin.
- **Work (enterprise-owned only)**: wire reviewer queue/history via proxy;
  leave cross-role reviewer service untouched.

### 6. Workforce 🟡
- **FE client**: `src/lib/api/workforce.ts` — **list still mock**; CSV
  import/preview/apply already proxied.
- **Backend**: `/api/v1/enterprise/workforce` (GET list, POST add) + import +
  `/api/v1/enterprise/tasks/{id}/{assign,reassign}`. Raw `{items,total}`.
- **Work**: swap `listWorkforce` mock → `GET /api/enterprise/workforce` proxy
  (route exists). Member detail page → wire to list item / add detail endpoint.
- **Verify**: CSV preview diff → apply → roster reflects; assign task to member.

### 7. Billing 🟡
- **Payouts** 🟢: `/api/payouts/tenant` proxied — works after F1/F2.
- **Rate cards** 🟢: `/api/enterprise/rate-cards` (Prisma-direct) — already real.
- **Invoices** 🔴: `src/lib/billing/invoices-mock.ts`. Backend has
  `/api/v1/billing/invoices` (+ summary), **raw**. Add
  `src/app/api/enterprise/invoices/route.ts` + `[invoiceId]` + record-payment;
  swap mock → fetch.
- **CSV export** 🔴: backend `/api/v1/billing/export` exists; wire
  `downloadBillingCsv` to a proxy route instead of mock.
- **Verify**: invoices list/detail/mark-paid; export downloads from backend.

### 8. Compliance 🟢 (Prisma-direct, already real)
- consent / overview / retention are Prisma routes under
  `src/app/api/enterprise/compliance/*` and **work today**. The duplicate
  legacy mock wrappers (`enterprise-consent.ts`, `enterprise-retention.ts`,
  `enterprise-compliance.ts`) are redundant — point pages at the real routes,
  retire wrappers (no deletes needed if pages just stop importing them).
- **Optional**: the backend also exposes `/api/v1/enterprise/compliance/*`
  (consent from `contributor_profiles`). Decide one source of truth — keep
  Prisma-direct unless backend version is richer.

### 9. Audit 🟢 (Prisma-direct)
- `/api/audit/export` + audit views query `AuditEvent` via Prisma. Real.
  No work beyond confirming tenant scoping.

### 10. Analytics 🔴
- **FE client**: `src/lib/analytics/analytics-mock.ts` (all 3 pages mock).
- **Backend**: no analytics endpoint yet. Either (a) compute from
  `/api/v1/billing/summary` + review-queue stats client-side, or (b) add a
  backend `/api/v1/enterprise/analytics/overview`. **Recommend (a) for Phase 1**
  to avoid new backend work; mark economic/workforce intelligence as derived.

### 11. Settings 🟡
- tenant/plan/security/policies + integrations (erp/sso/webhooks). Most are
  Prisma/auth-backed and real; `contributor-pricing` is a shared admin proxy.
  **Confirm** each settings save actually persists (memory note flags
  Policies as a prior mock no-op) — wire any remaining no-op saves to the
  matching backend/Prisma route.

### 12. Notifications 🟡
- **GET** `/api/notifications` proxied (works after F1/F2). **mark-read** /
  **mark-all-read** are client-only — add
  `src/app/api/notifications/[id]/read/route.ts` +
  `mark-all-read/route.ts` proxying to backend (or Prisma) so reads persist.

### 13. Dashboard 🟡
- No dedicated endpoint; composes review-queue + payouts + notifications.
  Goes green automatically once those modules are wired. Replace the
  `analytics-mock` KPI block with derived values (per module 10a).

### 14. Onboarding / Profile 🟢
- Profile via `/api/v1/users/me/profile` + picture upload; onboarding via
  profile store. Wire `useProfileStoreV3` save to `PUT /api/v1/users/me/profile`
  through a proxy route if not already.

---

## Suggested execution order

1. **F1–F4 foundation** (env, JWT injection, unwrap, backend boots).
2. **SOW → Decomposition → Projects** (the core SOW→plan→project chain; each
   unlocks the next via backend auto-creation).
3. **Review queue + Workforce** (delivery + acceptance).
4. **Billing invoices + CSV + Notifications mark-read** (finance + UX polish).
5. **Analytics derived KPIs + Settings persistence audit** (last mile).
6. Retire redundant compliance mock wrappers.

## Verification (end-to-end)

- `python backend/app.py` → backend on `:8103`, `/health` ok.
- `npm install && npm run dev` (enterprise app) with corrected `.env.local`.
- Log in at `/enterprise/login` → NextAuth stores `accessToken`.
- Walk the chain: **SOW create → 5-gate approve → plan auto-created → activate →
  project → assign workforce → contributor submit → review claim/decide →
  milestone accept/pay → invoice → payout**. Each step should hit the backend
  (watch the FastAPI logs) with no mock fallback.
- Toggle `NEXT_PUBLIC_ENTERPRISE_DEMO=1` to confirm graceful mock fallback when
  backend is down.

## Guardrails

- Only edit files under `newfrontend2/enterprise`. Other roles read-only.
- Additive only — **no DB deletes/drops**; ask before any removal.
- Reuse the existing proxy + NextAuth token; don't introduce a second auth path.
- Keep mocks as the demo fallback, don't delete them.
