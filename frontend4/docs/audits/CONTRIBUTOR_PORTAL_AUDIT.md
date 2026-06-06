# Contributor Portal Audit — Phase 1

**Date:** 2026-05-30  
**Auditor:** Senior QA pass — full MCP Playwright walkthrough + code review  
**Session:** `priya@glimmora.dev` / `contrib1234` (after `ensure-contributor.ts`)  
**Spec reference:** `docs/portal-specs/01-contributor-portal.md`  
**RBAC cross-ref:** `docs/RBAC_MATRIX_V1.md`

---

## Executive summary

The contributor portal has **41 routes**, a polished Meridian shell, and a clear IA (Today → My work → My record → Help). A full browser audit found **critical blockers on the real-API path** (schema drift + shell mis-wiring) while **mock-backed pages demo well**.

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 P0 — Blocker | 4 | Real task/submission/payout APIs 500; workroom broken; core loop blocked |
| 🔴 P1 — Wrong UX | 6 | Profile identity mismatch; Settings hidden; ⌘K shows enterprise actions; notification links cross-portal |
| 🟡 P2 — Demo debt | 12 | Mock revisions/completed/credentials; mock settings saves; evidence 502 |
| ✅ Pass | 19 | Support forms, revision detail UI, sidebar nav, ticket success flow, delete guard |

**Verdict:** Demo-ready on **mock paths** (Revisions, Completed, Credentials, Support). **Not QA-ready on the real contributor loop** until DB migration runs and shell/palette/account-menu are contributor-scoped.

---

## Deep browser QA audit

### Test environment

| Item | Value |
|------|-------|
| URL | `http://localhost:3001` |
| Login | `priya@glimmora.dev` / `contrib1234` |
| Seed | `node -e "require('dotenv').config({path:'.env.local'}); … ensure-contributor.ts"` |
| Demo flags | `NEXT_PUBLIC_CONTRIBUTOR_DEMO=1` (layout role bypass only) |
| Blocker found | Prisma P2022: column `Tenant.subscriptionStartedAt` missing → all `requireRequest()` APIs return **500** |

---

### Route inventory (31 static + 10 dynamic patterns)

#### Sidebar navigation (8 links) — all resolve 200

| Link | Route | H1 / state | API | QA |
|------|-------|------------|-----|-----|
| Dashboard | `/contributor/dashboard` | "Good evening, Priya" | `/api/contributor/tasks`, `/api/payouts` → **500** | 🟡 Zero-state OK; counts stuck at 0 |
| Assigned | `/contributor/tasks` | "Your assigned workload" | tasks → **500** | 🔴 **Internal Server Error** banner |
| Submissions | `/contributor/tasks/submissions` | "Submissions" | `/api/submissions` → **500** | 🔴 **Internal Server Error** banner |
| Revisions | `/contributor/tasks/revisions` | "Revisions" | mock 200 | ✅ 4 mock items, pagination |
| Completed | `/contributor/tasks/completed` | "Completed work" | mock 200 | ✅ Links to detail + credentials |
| Earnings | `/contributor/earnings` | "Earnings" | payouts/methods → **500** | 🟡 Falls back to mock HDFC + demo amounts |
| Credentials | `/contributor/credentials` | "Credentials" | mock 200 | ✅ View/Share CTAs |
| Help | `/contributor/support` | "Help & safety" | mock 200 | ✅ FAQ accordions, ticket links |

#### Account menu (topbar avatar) — verified open

| Item | Works | Notes |
|------|-------|-------|
| Profile | ✅ | → `/contributor/profile` |
| Notifications | ✅ | Badge **4** unread → `/contributor/notifications` |
| **Settings** | 🔴 **Missing** | Hidden by `showSettings={canAccessSettings}` in `EnterpriseTopbar` — contributor has no enterprise tenant role |
| Switch to Night | ✅ | Theme toggle |
| Sign out | ✅ | → `/auth/login` |

#### Off-sidebar routes (account menu + in-page CTAs)

| Route | H1 | Status | Notes |
|-------|-----|--------|-------|
| `/contributor/notifications` | "Your notifications" | 🟡 | **15+ CTAs link to `/enterprise/*`** → `portal_mismatch` for contributor |
| `/contributor/profile` | **"Kavi Senthil"** | 🔴 | Mock persona (`freelancer` default), **not** session user Priya |
| `/contributor/profile/edit` | "Edit profile" | 🟡 | Save → mock toast; no persistence |
| `/contributor/profile/digital-twin` | "Your digital twin" | ✅ | Mock metrics render |
| `/contributor/profile/evidence` | "Evidence & Portfolio" | 🔴 | `/api/contributor/profile/evidence` → **502**; Retry/Add Evidence visible |
| `/contributor/profile/skills` | "Skills" | ✅ | Add skill, 4 skill rows, detail links |
| `/contributor/profile/skills/skill-react` | "React" | ✅ | Skill detail loads |
| `/contributor/settings` | "Settings" | ✅ | Hub with 6 sub-pages (direct URL only — not in account menu) |
| `/contributor/settings/account` | "Account" | 🟡 | Send verification / Update password / Turn off MFA — mock actions |
| `/contributor/settings/notifications` | "Notifications" | 🟡 | Save preferences → mock toast |
| `/contributor/settings/privacy` | "Privacy & consent" | 🟡 | View `#` placeholders; export/delete flow links work |
| `/contributor/settings/sessions` | "Sessions" | 🟡 | Sign out per device — mock |
| `/contributor/settings/connected` | "Connected accounts" | 🟡 | Connect/Disconnect — mock |
| `/contributor/settings/language` | "Language & region" | 🟡 | Save preferences — mock |
| `/contributor/settings/delete` | "Delete your account?" | ✅ | Delete **disabled** until confirm typed |
| `/contributor/earnings/history` | "Earnings history" | ✅ | Mock pagination |
| `/contributor/earnings/withdraw` | "Withdraw" | 🟡 | Loads; payout API 500 |
| `/contributor/earnings/payout-method` | "Payout method" | ✅ | Verify again / Remove / Add another |
| `/contributor/earnings/payout-method/new` | "Add a payout method" | 🟡 | Form renders; Verify and save — mock |
| `/contributor/earnings/export` | "Export earnings" | 🟡 | Generate file — mock download |
| `/contributor/support/tickets/new` | "Open a ticket" | ✅ | See form QA below |
| `/contributor/support/tickets/ticket-1042` | "Withdrawal stuck in pending" | ✅ | Thread mock loads |
| `/contributor/support/safety-report` | "Safety report" | 🟡 | Form renders; submit mock |
| `/contributor/support/grievance` | "Open a grievance" | 🟡 | Form renders; submit mock |
| `/contributor/onboarding` | _(modal only)_ | 🟡 | Empty shell + `OnboardingModal` (SSO path) |

#### Dynamic detail routes

| Route | H1 | Status |
|-------|-----|--------|
| `/contributor/tasks/revisions/task-006` | "Auth modal UX polish" | ✅ Mentor feedback, Compare, Resubmit CTAs |
| `/contributor/tasks/completed/task-008` | "Decomposition unit tests" | ✅ |
| `/contributor/credentials/cred-001` | "Decomposition unit tests" | ✅ Credential detail (task title as cert name in mock) |
| `/contributor/tasks/task-006` (workroom) | _(breadcrumb Task 006)_ | 🔴 **Main pane: Internal Server Error** (real API) |

Patterns not exercised (no seeded real tasks): `[taskId]/submit`, `[taskId]/submit/success`, `submissions/[submissionId]`, `completed/[taskId]` beyond mock IDs.

---

### Shell, chrome & global controls

| Control | Expected | Actual | Severity |
|---------|----------|--------|----------|
| Skip to main content | Focus skip link | ✅ Present | — |
| Sidebar collapse/expand | Toggle labels | ✅ Works | — |
| Mobile nav button | Opens drawer | Not tested (desktop viewport) | — |
| Breadcrumbs | Deep routes | ✅ e.g. Assigned → Task 006 | — |
| Search / ⌘K | Contributor pages + actions | 🔴 **Enterprise palette** (Create SOW, acceptance queue, billing…) | P1 |
| `ContributorTopbar.tsx` | Contributor-scoped search | 🔴 **Not wired** — layout uses `EnterpriseTopbar` + global `CommandPalette` | P1 |
| Persona switcher (dev) | Flip persona overlays | ✅ "Persona: Freelancer" floating button | 🟡 Dev-only; drives wrong profile name |
| Dashboard CTAs | Update profile, View all earnings, See all notifications | ✅ All navigate correctly | — |
| Earnings Withdraw | → withdraw page when eligible | 🟡 `href="#"` when balance &lt; ₹500 or no verified method (expected); mock shows HDFC but API 500 may block real eligibility | P2 |

**Root cause — ⌘K:** `getPaletteBundle()` in `palette-config.tsx` only branches `admin` vs **default enterprise**. No contributor bundle. `CommandPalette` always injects enterprise quick actions for contributor shell.

**Root cause — Settings hidden:** `EnterpriseTopbar` line 121: `showSettings={config.id === "admin" ? true : canAccessSettings}`. Contributors fail `canAccessSettings` → Settings omitted despite `/contributor/settings` existing.

---

### Form & validation QA

| Form | Empty submit | Valid submit | Validation UX | Persistence |
|------|--------------|--------------|---------------|-------------|
| Login | Sign in disabled until fields filled | ✅ → dashboard | "email/password don't match" when user missing | Real (NextAuth) |
| New support ticket | Submit **disabled** | ✅ Success "Ticket submitted" + redirect | Category + subject + description required | Mock only (`setTimeout` + fake ref) |
| Safety report | Submit enabled; needs fields | Not fully submitted in pass | Textarea + category | Mock |
| Grievance | Same pattern | Not fully submitted | Same | Mock |
| Payout method new | Verify disabled until fields | Not completed | Type/method selects | Mock |
| Profile edit | Save enabled | Clicked; no visible toast | Text inputs accept edits | Mock (local state) |
| Settings notifications | Save preferences | Mock toast expected | Toggle switches | Mock |
| Settings language | Save preferences | Mock toast expected | Selects | Mock |
| Settings delete | Delete **disabled** | N/A until "DELETE" typed | Guard works | Mock |
| Account password | Update password button | Opens inline/mock flow | — | Mock |
| Export earnings | Generate file | Mock download trigger | Date range selects | Mock |

**Ticket form flow (happy path verified):**
1. Category → Payout  
2. Subject → "QA payout stuck"  
3. Description → 50+ chars  
4. Submit enabled → success screen → redirects to `/contributor/support`

---

### Data-layer split (verified in browser)

| Surface | Browser data source | Consistent with Assigned? |
|---------|--------------------|-----------------------------|
| Assigned / Workroom / Submissions | Real `/api/contributor/*` | — |
| Revisions / Completed | `/api/mock/contributor/*` | 🔴 **No** — shows tasks while Assigned empty |
| Credentials wallet | Mock | 🔴 Real `/api/contributor/credentials` unused |
| Profile / twin / skills | Mock personas | 🔴 Session name ≠ profile name |
| Earnings | Real API attempt → mock fallback | 🟡 Hybrid |
| Notifications | Real `/api/notifications` | 🔴 Enterprise action URLs |
| Support | Mock | 🟡 Real ticket APIs exist but unused |

---

### P0 blockers (fix before next QA cycle)

1. **Run subscription migration** — `prisma/migrations/20260528120000_tenant_subscription/` adds `Tenant.subscriptionStartedAt`. Without it, `validateSession` → `requireRequest` → 500 on tasks, submissions, payouts, workroom.

2. **Seed contributor RBAC** — `ensure-contributor.ts` creates `User` only; no `UserRole` → contributor permissions. Even post-migration, payouts may 403 without role assignment.

3. **Seed smoke tasks** — `prisma/seed-smoke-contributor.sql` targets a fixed user id; re-map to Priya's id or run assignment API so Assigned/Workroom have real rows.

4. **Unify My Work data** — Revisions/Completed must read same source as Assigned or users see contradictory queues.

---

### P1 fixes (UX / trust)

1. Wire `ContributorTopbar` **or** fix `EnterpriseTopbar` + `CommandPalette` for `config.id === "contributor"`.
2. Show Settings in account menu for contributors: `showSettings={config.id === "contributor" || canAccessSettings}`.
3. Profile pages: read `session.user` for display name, not `MOCK_PROFILES.freelancer` (Kavi).
4. Filter notification CTAs to contributor-safe routes or hide enterprise links.
5. Wire credentials wallet to real API once RBAC + seed exist.

---

### P2 polish

- Remove or gate `PersonaSwitcher` outside dev/demo.
- Evidence page: handle 502 with clearer copy; wire upload when backend ready.
- Add Profile + Notifications to sidebar utility zone (spec optional).
- Document QA login in README / seed script alongside enterprise admin.

---

## Architecture snapshot (code review)

---

## Architecture snapshot

| Layer | Implementation |
|-------|----------------|
| Shell | `EnterpriseShell` + `contributorNav` (Meridian) |
| Role gate | `useRoleGuard(["contributor"])` — bypassed when `NEXT_PUBLIC_CONTRIBUTOR_DEMO=1` |
| Edge gate | `proxy.ts` portal prefix `/contributor` → role `contributor` only |
| Onboarding | SSO users → `OnboardingModal`; credentials users auto-complete |
| Demo overlays | `demo-task-assignments`, `payoutOverlay` merged client-side by email |
| Personas | `PersonaSwitcher` (bottom-right) for mock student/women/general tracks |

**Not in sidebar (reachable via account menu / direct URL):** Profile, Settings, Notifications, Onboarding.

---

## Audit matrix — primary journeys

| # | Area | Route | Data source | Loading | Empty | Error | API guard | Status |
|---|------|-------|-------------|---------|-------|-------|-----------|--------|
| 1 | Dashboard | `/contributor/dashboard` | Hybrid: `/api/contributor/tasks` + demo assignments; payouts API | ✅ route `loading.tsx` + inline skeleton | ✅ zero-state copy | 🟡 silent if API 401 merges demo only | `read.submission` | ✅ |
| 2 | Assigned tasks | `/contributor/tasks` | Hybrid tasks API + demo | 🟡 inline skeleton | ✅ | ✅ API error banner | contributor role | ✅ |
| 3 | Task workroom | `/contributor/tasks/[id]` | Real task API; demo short-circuit for demo IDs | ✅ skeleton | ✅ not found | ✅ | accept/submit APIs | ✅ |
| 4 | Submit flow | `.../submit`, `.../success` | Real submission APIs | 🟡 partial | — | ✅ | `submit.submission` | 🟡 |
| 5 | Submissions list | `/contributor/tasks/submissions` | Real `/api/contributor` submissions | ✅ skeleton | ✅ | ✅ | `read.submission` | ✅ |
| 6 | Revisions queue | `/contributor/tasks/revisions` | **Mock only** `/api/mock/contributor/tasks/revisions` | 🟡 none | ✅ | ✅ | — | 🔴 |
| 7 | Revision detail | `/contributor/tasks/revisions/[id]` | Mock | 🟡 | — | ✅ | — | 🔴 |
| 8 | Completed tasks | `/contributor/tasks/completed` | Mock list API | 🟡 | ✅ | ✅ | — | 🟡 |
| 9 | Earnings overview | `/contributor/earnings` | Real payouts + demo overlay | ✅ dedicated skeleton | ✅ | ✅ refetch | `read.payout` | ✅ |
| 10 | Earnings history | `/contributor/earnings/history` | Real/mock payouts | 🟡 | ✅ | ✅ | — | 🟡 |
| 11 | Withdraw / payout method | `/contributor/earnings/withdraw*` | Real payout method APIs + mock fallback | 🟡 | — | ✅ | `manage.payout_method` | 🟡 |
| 12 | Credentials wallet | `/contributor/credentials` | **Mock** `/api/mock/contributor/credentials` | ✅ wallet skeleton | ✅ | ✅ | Real route exists but unused | 🔴 |
| 13 | Credential detail | `/contributor/credentials/[id]` | Mock | ✅ skeleton | — | ✅ | Real `/api/contributor/credentials/[id]` exists | 🟡 |
| 14 | Profile | `/contributor/profile` | Mock skills + digital twin + tasks | 🟡 none | — | ✅ | Real profile routes exist | 🟡 |
| 15 | Profile edit / evidence / skills | `/contributor/profile/*` | Mixed: evidence → real API; rest mock | 🟡 | — | ✅ | partial | 🟡 |
| 16 | Support hub | `/contributor/support` | Mock support index | 🟡 | ✅ | ✅ | Real ticket APIs exist | 🟡 |
| 17 | Tickets / safety / grievance | `/contributor/support/*` | Mock + some real API stubs | 🟡 | — | ✅ | — | 🟡 |
| 18 | Settings | `/contributor/settings/*` | Mock save toasts | 🟡 | — | — | — | 🟡 |
| 19 | Notifications | `/contributor/notifications` | Real `NotificationsList` → `/api/notifications` | 🟡 | ✅ | 🟡 | contributor | ✅ |
| 20 | Onboarding | `/contributor/onboarding` + modal | Real onboarding service (SSO) | 🟡 | — | — | session | 🟡 |

---

## Data source map (for backend handoff)

### Real APIs in use (wire these first)

| Domain | Client | API prefix |
|--------|--------|------------|
| Tasks & submissions | `src/lib/api/contributor-tasks.ts` | `/api/contributor/tasks`, `/api/contributor/submissions` |
| Payouts & methods | `src/lib/api/contributor-payouts.ts` | `/api/payouts` (via contributor client) |
| Profile evidence | contributor profile pages | `/api/contributor/profile/evidence` |
| Notifications | `NotificationsList` | `/api/notifications` |
| Credentials (unused by wallet UI) | `contributor-payouts.ts` | `/api/contributor/credentials` |

### Mock-only (replace in Phase 1B)

| Domain | Mock client | Mock route |
|--------|-------------|------------|
| Revisions queue | `contributor-mock.ts` | `/api/mock/contributor/tasks/revisions` |
| Completed tasks list | `contributor-mock.ts` | `/api/mock/contributor/tasks/completed` |
| Credentials wallet UI | `contributor-mock.ts` | `/api/mock/contributor/credentials` |
| Profile / digital twin / skills | `contributor-mock.ts` | `/api/mock/contributor/*` |
| Support index & tickets | `contributor-mock.ts` | `/api/mock/contributor/support` |

### Demo overlay (keep until real assignments exist)

- `src/lib/enterprise/mocks/demo-task-assignments.ts` — merges tasks by contributor email
- `src/lib/enterprise/mocks/payouts.ts` — merges payout rows for demo

---

## Findings — 🔴 Red (fix before pilot)

1. **Revisions queue is 100% mock** while Submissions list uses Postgres. Contributors see inconsistent truth between tabs.  
   **Fix:** Drive revisions from `/api/contributor/submissions?status=feedback_requested` or task filter.

2. **Credentials wallet ignores real API** — page calls mock fetch; `/api/contributor/credentials` already exists.  
   **Fix:** Switch wallet + detail to `listMyCredentials` / TanStack hooks in `use-contributor-payouts.ts`.

3. **No contributor test login in default seed** — browser/QA blocked unless `ensure-contributor.ts` is run.  
   **Fix:** Document in README + add to `db:seed:local` or dev onboarding doc.

4. **Profile / Settings / Notifications missing from sidebar** — discoverability relies on account menu (easy to miss in demos).  
   **Fix:** Add “Profile” under My record or account dropdown link audit.

5. **`proxy.ts` blocks cross-portal QA** — admin users cannot preview contributor without second login (correct for prod, friction for audit).  
   **Fix:** QA playbook: dedicated contributor login; optional `DEV_AUTH_BYPASS` only for internal audit.

---

## Findings — 🟡 Yellow (demo OK, polish later)

- Workroom: mentor name, references, structured feedback are **placeholders** (documented in page header comment).
- Settings pages show **“Saved (mock)”** — no persistence.
- Revisions detail uses **v2 mock components** alongside v3 workroom — parallel UI generations.
- Dashboard skeleton uses `@/components/ui/skeleton` while rest of portal uses Meridian — minor visual inconsistency.
- `useSearchParams` on tasks list — mitigated by layout `Suspense`; no dedicated `loading.tsx` on tasks route.
- Earnings **export** page — verify against real export API when billing slice lands.
- Persona switcher is **dev-only mock** — remove when session carries `tracks[]`.

---

## Findings — ✅ Green (ship for demo)

- IA matches spec: Dashboard → task pipeline → earnings/credentials → support.
- TanStack Query on tasks, submissions, payouts with cache invalidation on mutations.
- Accept / decline / draft / submit / withdraw flows wired to real API routes.
- Role guard + portal middleware correctly scoped.
- Error surfaces on list pages (`ContributorApiError` banners).
- Empty states on dashboard, credentials, support.
- Notifications integrated with shared component.
- No platform subscription paywalls (correct — subscription is tenant/enterprise only).

---

## Browser verification log

| Step | Result |
|------|--------|
| `/contributor/dashboard` as admin | ❌ Redirect → `/admin/dashboard?reason=portal_mismatch` (expected) |
| Login `priya@glimmora.dev` | ❌ Stayed on login (user not in DB in this environment) |
| Code review of 41 pages | ✅ Complete |
| Env | `NEXT_PUBLIC_CONTRIBUTOR_DEMO=1` set (layout bypass only, not proxy) |

**To complete browser audit locally:**

```bash
npx tsx scripts/ensure-contributor.ts
# Login: priya@glimmora.dev / contrib1234
# Walk: dashboard → tasks → workroom → earnings → credentials → support
```

---

## Recommended fix order (contributor sprint)

| Week | Task |
|------|------|
| 1 | Seed contributor dev user + QA login doc |
| 1 | Wire credentials wallet to real `/api/contributor/credentials` |
| 2 | Unify revisions queue on real submission status filter |
| 2 | Replace completed tasks mock with `status=accepted` task query |
| 3 | Profile page: wire digital twin + skills to real profile APIs |
| 3 | Support: switch index to real ticket list API |
| 4 | Sidebar: add Profile + Notifications under My record |

---

## Backend handoff tickets (contributor v1)

1. **GET /api/contributor/tasks** — ensure seeded contributor has ≥1 assigned task in dev  
2. **Submission lifecycle** — feedback_requested → resubmit → under_review (drives revisions UI)  
3. **GET /api/contributor/credentials** — wallet grid shape stable for UI swap  
4. **GET /api/contributor/profile/digital-twin** — replace mock twin stats  
5. **Support tickets CRUD** — replace mock support index  
6. **Payout withdraw** — end-to-end with Razorpay rail (already partially wired)

---

## Files reference

| Purpose | Path |
|---------|------|
| Navigation | `src/lib/config/navigation.ts` → `contributorNav` |
| Layout + guard | `src/app/contributor/layout.tsx` |
| Task client | `src/lib/api/contributor-tasks.ts` |
| Mock client | `src/lib/api/contributor-mock.ts` |
| Hooks | `src/lib/hooks/use-contributor-tasks.ts`, `use-contributor-payouts.ts` |
| Dev contributor seed | `scripts/ensure-contributor.ts` |

---

## Next audit

After contributor fixes: **Mentor / Reviewer portal audit** using the same matrix template.
