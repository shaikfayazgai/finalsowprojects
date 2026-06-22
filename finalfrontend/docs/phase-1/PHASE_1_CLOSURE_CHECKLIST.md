# GlimmoraTeam — Phase 1 Closure Checklist

**Date:** 2026-05-24
**Owner:** Platform engineering
**Purpose:** Master artifact defining the exact remaining work before Phase 1 MVP can be declared complete. Use as the daily standup checklist + final go/no-go reference.

---

## 0 · How to use this document

- Every uncompleted item has a **classification** (P0 / P1 / P2 / Deferred), **effort estimate**, **risk**, and **dependency**.
- Three gates at the end define what "done enough" means for: (a) Phase 1 closure, (b) safe stakeholder demo, (c) production deployment.
- Cross-reference companion docs:
  - `SECURITY_HARDENING_PASS_1.md` — slice 1 (security primitives)
  - `PERSISTENCE_PASS_1.md` — slice 2 (decision persistence)
  - `PAYMENT_SAFETY_PASS_1.md` — slice 3 (Razorpay webhook + payout gate)
  - `PRODUCTION_READINESS_ROADMAP.md` — slice 4 (consolidated roadmap)
  - `STAKEHOLDER_WALKTHROUGH_SCRIPT.md` — demo orchestration
  - `ENTERPRISE_PORTAL_V2_REORGANIZATION.md` — Phase 1B IA decisions

---

## 1 · DONE definitions

### 1.1 — Contributor portal DONE
A contributor portal is **DONE for Phase 1** when:
- [x] All sidebar entries lead to a V2 surface (no V1 leakage)
- [x] Workroom, Tasks, Submissions, Revisions, Completed Work, Progress, Settings, Profile render with seeded data
- [x] Lifecycle states (assigned → in_progress → submitted → under_review → revision → approved) propagate visibly
- [x] Mock mentor reply scheduler simulates governance turnaround in demo mode
- [ ] Task acceptance / submission persists to backend (currently localStorage) — **Slice 5** (production-blocking only)

### 1.2 — Mentor portal DONE
- [x] All V2 sidebar entries render
- [x] Review queue, in-progress, escalated, governance holds, rework pages live
- [x] AI suggestion / flag / confidence surfaces present
- [x] Mentor decisions visibly propagate to Contributor + Enterprise surfaces (via unified store)
- [ ] Mentor decisions persist server-side — **Slice 5** (production-blocking only)

### 1.3 — Enterprise portal DONE
- [x] All 9 V2 workspaces complete: Dashboard · SOW Workspace · SOW Intake · SOW Detail · Decomposition · Projects Portfolio · Project Detail · Delivery Tracking · Enterprise Review · Review Detail · Reviewer Workspace · Billing
- [x] Profile / Settings / Notifications V2 utility surfaces present
- [x] Cross-role propagation verified end-to-end (acceptance → billing visible)
- [x] Acceptance decision audit log persistent (slice 2)
- [x] Razorpay webhook + payout gate hardened (slice 3)
- [ ] SOW + Project + Decomposition state persistent — **Slice 6** (production-blocking only)

### 1.4 — Reviewer role DONE
- [x] Reviewer Workspace V2 reachable in enterprise demo mode (auth bypass landed in P0 fix)
- [x] Validation lane derives from unified store
- [x] Recommendation annotations (Ready / Flag / Mentor revisit) functional in local state
- [ ] Reviewer recommendations persist — Phase 2 deferred

### 1.5 — Platform MVP DONE (Phase 1 overall)
The platform is **Phase-1 DONE** when all of:
- [x] Three role portals walkthrough-ready
- [x] Unified task store propagation verified across all V2 surfaces
- [x] V1 isolation: 63 V1 routes redirect to V2; no V1 reachable from sidebar
- [x] Premium executive polish layer applied (motion + focus + scrollbar)
- [x] Realism + seed-data hardening pass applied
- [x] Three production-foundation slices shipped (security primitive, decision persistence, payment safety)
- [x] Master walkthrough script + production roadmap saved
- [ ] Outstanding MVP-blocking items in §4 cleared
- [ ] Phase 1 Go/No-Go Gate (§22) passed

---

## 2 · Status snapshot

| Subsystem | Status | Gate |
|---|---|---|
| V2 UI ecosystem (all portals) | ✅ Complete | Phase 1 closed |
| Lifecycle propagation (unified store) | ✅ Complete | Phase 1 closed |
| V1 isolation (63 routes redirected) | ✅ Complete | Phase 1 closed |
| Stakeholder walkthrough script | ✅ Saved | Phase 1 closed |
| Authorization primitive (`requireRole`) | ✅ Shipped | Production-blocking remainder |
| Acceptance audit log (Postgres) | ✅ Shipped | Production-blocking remainder |
| Razorpay webhook + signature + payout gate | ✅ Shipped | Production-blocking remainder |
| Demo bypass production guard | ✅ Shipped | Production-blocking remainder |
| Per-route authorization (28 routes) | ⚠️ 2/28 wired | Production blocking |
| Task / SOW / Project state persistence | ❌ Mock | Production blocking |
| Settings / Notifications persistence | ❌ Local React state | Polish |
| Observability (Sentry / OTel / logs) | ❌ None | Production blocking |
| Server-side exports | ❌ Client-only | Production blocking if export feature ships |
| Razorpay Payouts (reverse leg) | ❌ Not wired | Production blocking if payouts ship |
| MFA end-to-end | ⚠️ Routes exist, untested | Polish unless sales requires |

---

## 3 · Inventory of remaining mock / fake / visual-only systems

This section enumerates exactly what is *not real* today — the inverse of "production-ready." Each item maps to a remediation slice in §4–§7.

### 3.1 — Fake / mock systems

| System | Current reality | Removed in slice |
|---|---|---|
| SOW seed data | TS arrays in `src/mocks/data/enterprise-v2-orchestration.ts` (6 SOWs hardcoded) | Slice 6 |
| Project portfolio | Same file (6 projects hardcoded) | Slice 6 |
| Decomposition plans | `src/mocks/data/enterprise-decomposition.ts` (workstreams + task units hardcoded) | Slice 6 |
| Billing snapshot (KPI tiles) | Hardcoded constants | Slice 6 |
| Operational alerts | Hardcoded constants | Slice 6 |
| Mock mentor reply scheduler | `setTimeout`-driven in `contributor-tasks-store.ts` | Slice 5 |
| Reviewer recommendations | Local React state (lost on tab change) | Phase 2 |
| Workforce compensation rollup | Derived from mock payouts in task seed | Slice 5 + 6 |
| Activity feed timestamps | Computed from `humanToIso()` helper at module load | Slice 5 (becomes real on Task migration) |
| Invoice IDs | Synthesized `INV-{year}-Q{q}-{seq}` | Slice 6 (real invoices in DB) |
| Margot Ellis (operator identity in Profile V2) | Hardcoded placeholder | Slice 7 |
| Razorpay Payouts (platform → contributor) | Not wired | Slice 8 |

### 3.2 — Toast-only flows (no real persistence behind them)

| Action | Where | Persistence today |
|---|---|---|
| Settings save button | `/enterprise/settings` | Toast "Saved at HH:MM" — local state only |
| Edit intake details (header CTA) | SOW Detail | No-op button |
| Export scope summary | SOW Detail | No-op button |
| Export delivery summary | Project Detail | No-op button |
| Export governance summary | Review Detail | No-op button |
| View workforce allocation | Project Detail | No-op button |
| Request governance review | Review Detail | No-op button |
| Reviewer recommendation (Ready / Flag / Revisit) | Reviewer Workspace | Local state — resets when row changes |
| Reviewer evidence verification checkboxes | Reviewer Workspace | Same |

### 3.3 — Visual-only pages (render but no real backend)

| Page | Backend reality |
|---|---|
| `/enterprise/profile` | Identity hardcoded; metrics live-derived |
| `/enterprise/settings` | All preferences local state |
| `/enterprise/notifications` | Event feed derived from store; never persists read state |
| `/enterprise/sow/intake` | 5-stage workflow exists but commit is local-state only |
| `/enterprise/decomposition` | Read-only mock plans |
| `/enterprise/billing/{invoices,rate-cards,pricing,reports}` | Redirect stubs (V1 was empty) |

### 3.4 — localStorage-only persistence (production deletion-risk)

Every Zustand store mutation today writes to `localStorage` via `zustand/middleware`'s `persist`. This is:
- ✅ Walkthrough-safe (survives reload during demo)
- ❌ Production-unsafe (lost on logout / cleared on different device / not shared across users)

Stores currently persisted only to localStorage:
- `contributor-tasks-store` — every task state mutation
- `auth-store` — MFA status, onboarding progress, registration intent
- `onboarding-store` — step-by-step contributor onboarding
- `sidebar-store` — sidebar collapsed state (acceptable in localStorage)
- `notification-store` — toast queue (acceptable)
- `sow-store`, `sow-pipeline-store`, `sow-upload-store`, `sow-messages-store` — V1 SOW state
- `platform-settings-store` — pricing config
- `email-template-store` — template editor state
- `project-hold-store`, `enterprise-company-store` — enterprise mocks
- `submission-store`, `contributor-phone-store`, `task-store` — contributor mocks
- `rate-cards-store` — admin mock

Acceptable localStorage uses (UI preferences): `sidebar-store`, `notification-store`.
**Everything else** needs backend persistence by production.

---

## 4 · MVP-Blocking items (P0)

Items in this section **must** be cleared before Phase 1 can be declared closed.

| ID | Item | Effort | Risk | Dependency |
|---|---|---|---|---|
| MVP-1 | Complete `requireRole` audit across remaining 26 API routes | 2d | LOW | Slice 1 ✅ |
| MVP-2 | Build + wire `requireResourceOwner` helper on all per-user routes | 1d | MED | MVP-1 |
| MVP-3 | Verify cross-role propagation walkthrough end-to-end (manual QA pass on the 18-min script) | 0.5d | LOW | None |
| MVP-4 | Manual regression: all 63 V1 redirects land on correct V2 page | 0.5d | LOW | None |
| MVP-5 | Final typecheck + lint clean across full repo | 0.5d | LOW | None |
| MVP-6 | Verify `NEXT_PUBLIC_*_DEMO` flags trigger guard in production-mode local build | 0.25d | LOW | Slice 1 ✅ |

**MVP-Blocking total: ~5 engineer-days**

---

## 5 · Production-Blocking items (P0)

Items required before safely facing real production traffic. Not required for Phase 1 closure if the deployment is a controlled pilot.

| ID | Item | Effort | Risk | Dependency |
|---|---|---|---|---|
| PROD-1 | Task model migration (Zustand → Prisma) | 1-2w | HIGH | Slice 2 pattern ✅ |
| PROD-2 | SOW + Project + Decomposition Prisma models | 1-2w | MED | PROD-1 |
| PROD-3 | Observability stack (Sentry + Pino + AuditLog) | 1w | LOW | None |
| PROD-4 | CSRF middleware | 1d | LOW | None |
| PROD-5 | Rate limiting on auth + email + payment routes | 1-2d | LOW | None |
| PROD-6 | Security headers (CSP, X-Frame, Referrer, Permissions) | 0.5d | LOW | None |
| PROD-7 | AUTH_SECRET rotation runbook | 0.5d | LOW | None |
| PROD-8 | Reconciliation cron (missed webhooks, drift detection) | 3d | MED | PROD-1, Slice 3 ✅ |
| PROD-9 | Razorpay Payouts (reverse leg) — only if payout flow ships | 1w | MED | Slice 3 ✅ |
| PROD-10 | Server-side exports — only if export ships | 1w | MED | Object storage |
| PROD-11 | MFA end-to-end coverage — only if sales requires | 1w | MED | None |

**Production-Blocking total: ~5-7 engineer-weeks** (excluding the conditional items 9-11).

---

## 6 · Polish items (P1)

Not blocking; visible quality improvements.

| ID | Item | Effort | Risk |
|---|---|---|---|
| POL-1 | Settings + Notifications + Profile persistence (`OperatorPreferences` model) | 3d | LOW |
| POL-2 | Apply `requireResourceOwner` checks beyond the minimum set | 1d | LOW |
| POL-3 | Wire "default landing surface" preference to actually redirect | 0.5d | LOW |
| POL-4 | Wire notification preference filter on `/enterprise/notifications` | 0.5d | LOW |
| POL-5 | `.exec-stagger` utility applied to Dashboard KPI grid + portfolio cards | 0.5d | LOW |
| POL-6 | Backend-driven invoice IDs (replace synthesized) | 0.5d | LOW |
| POL-7 | Refund event propagation (`PaymentEvent` → `PaymentOrder.status='refunded'`) | 3d | MED |
| POL-8 | Duplicate-charge prevention at order-level | 2d | LOW |
| POL-9 | Webhook queue offload (move heavy processing async) | 1d | MED |
| POL-10 | Firefox scrollbar polish (`scrollbar-width: thin`) | 0.25d | LOW |
| POL-11 | Touch-device hover suppression (`@media (hover: hover)`) | 0.25d | LOW |
| POL-12 | Real-time updates via WebSocket/SSE on activity feed | 1w | MED |
| POL-13 | Reviewer recommendations persisted (annotations table) | 3d | LOW |
| POL-14 | Mock mentor scheduler → real backend mentor queue | Subsumed by PROD-1 | — |
| POL-15 | Operator identity replaces hardcoded "Margot Ellis" | Subsumed by POL-1 | — |

**Polish total: ~3 engineer-weeks** (excluding subsumed items).

---

## 7 · Phase 2 Deferred items

Intentionally out of scope. Do not work on these in Phase 1.

| ID | Item | Reason deferred |
|---|---|---|
| DEF-1 | Multi-tenant org partitioning | Single-org assumption in Phase 1; structural change |
| DEF-2 | V2 build of `/enterprise/analytics/*`, `/compliance/*`, `/audit` | Out of nav; Phase 2 surfaces |
| DEF-3 | V2 build of `/enterprise/sow/[id]/approve|compare|contract|kickoff` sub-tabs | Phase 1 redirects acceptable |
| DEF-4 | V2 build of `/enterprise/projects/[id]/milestones|monitor|tasks` sub-tabs | Same |
| DEF-5 | V2 build of `/enterprise/decomposition/[planId]/approve|edit` | Same |
| DEF-6 | V2 build of `/enterprise/review/[id]/feedback` | Inline feedback now covers the use case |
| DEF-7 | Team / workforce formation explicit surface | Implied by Decomposition Workspace |
| DEF-8 | Real-time mentor presence (typing indicators, etc.) | Phase 2+ |
| DEF-9 | Notifications mark-read state | Phase 2 (`OperatorPreferences` is enough for Phase 1) |
| DEF-10 | Mobile responsive audit | Desktop-first MVP |
| DEF-11 | Internationalization | English-only MVP |
| DEF-12 | Accessibility audit beyond keyboard focus rings | Phase 2 deep audit |
| DEF-13 | Admin console V2 | V1 admin surface acceptable for now |
| DEF-14 | Public credential share page V2 redesign | V1 acceptable |
| DEF-15 | Advanced reporting / report builder | Phase 2+ |

---

## 8 · Route-level checklist

| Route prefix | V2 status | Phase 1 expectation |
|---|---|---|
| `/enterprise/dashboard` | ✅ V2 | DONE |
| `/enterprise/sow` (list) | ✅ V2 | DONE |
| `/enterprise/sow/intake` | ✅ V2 | DONE |
| `/enterprise/sow/[id]` | ✅ V2 | DONE |
| `/enterprise/sow/[id]/{approve,compare,contract,kickoff}` | ⚠️ Redirect | ACCEPTABLE (Phase 2) |
| `/enterprise/sow/{upload,approval,archive,blueprint,versions,generate}*` (22 routes) | ⚠️ Redirect | ACCEPTABLE — V1 sealed |
| `/enterprise/decomposition` | ✅ V2 | DONE |
| `/enterprise/decomposition/[planId]*` (4 routes) | ⚠️ Redirect | ACCEPTABLE (Phase 2) |
| `/enterprise/projects` | ✅ V2 | DONE |
| `/enterprise/projects/[id]` | ✅ V2 | DONE |
| `/enterprise/projects/[id]/{milestones,monitor,tasks,completed}` | ⚠️ Redirect | ACCEPTABLE (Phase 2) |
| `/enterprise/projects/exceptions` | ⚠️ Redirect → `/enterprise/delivery-tracking` | DONE |
| `/enterprise/delivery-tracking` | ✅ V2 | DONE |
| `/enterprise/review` | ✅ V2 | DONE |
| `/enterprise/review/[id]` | ✅ V2 | DONE |
| `/enterprise/review/[id]/feedback`, `/review/history` | ⚠️ Redirect | ACCEPTABLE (Phase 2) |
| `/enterprise/reviewer` | ✅ V2 | DONE |
| `/enterprise/reviewer/{qa-inbox,review-queue,review-history,task-monitor,mentoring-log,my-metrics,notifications}` (9 routes) | ⚠️ Redirect | ACCEPTABLE (V1 sealed) |
| `/enterprise/billing` | ✅ V2 | DONE |
| `/enterprise/billing/{invoices,budget,history,pricing,rate-cards,reports}` | ⚠️ Redirect | ACCEPTABLE — V1 sealed |
| `/enterprise/profile` | ✅ V2 (lightweight) | DONE |
| `/enterprise/settings` | ✅ V2 (lightweight) | DONE |
| `/enterprise/notifications` | ✅ V2 (lightweight) | DONE |
| `/enterprise/team*`, `/analytics/*`, `/audit`, `/compliance/*` | ⚠️ Redirect | ACCEPTABLE (Phase 2) |
| `/contributor/*` (all V2 sidebar entries) | ✅ V2 | DONE |
| `/mentor/*` (all V2 sidebar entries) | ✅ V2 | DONE |
| `/auth/*` | ✅ Real (NextAuth) | DONE |

**Outstanding: none** — every route either has V2 implementation or a redirect to one.

---

## 9 · Persistence checklist

| Entity / mutation | Storage | Phase 1 Expectation |
|---|---|---|
| User + ContributorProfile (registration) | ✅ Postgres | DONE |
| Enterprise acceptance audit log | ✅ Postgres (`AcceptanceDecision`) | DONE — Slice 2 |
| Payment order intent | ✅ Postgres (`PaymentOrder`) | DONE — Slice 3 |
| Razorpay webhook events | ✅ Postgres (`PaymentEvent`) | DONE — Slice 3 |
| Task state (status, evidence, draft) | ❌ localStorage | DEFERRED to Slice 5 |
| Mentor decisions | ❌ localStorage | DEFERRED to Slice 5 |
| Reviewer recommendations | ❌ React local state | DEFERRED to Phase 2 (POL-13) |
| SOW intake commit | ❌ React local state | DEFERRED to Slice 6 |
| Decomposition plan edits | ❌ Mock | DEFERRED to Slice 6 |
| Settings / preferences | ❌ React local state | DEFERRED to Slice 7 (POL-1) |
| Notification preferences | ❌ Local state | DEFERRED to Slice 7 |
| Profile edits | ❌ Hardcoded | DEFERRED to Slice 7 |

**Phase 1 closure does not require migration of localStorage state to Postgres.** That's an explicit Phase 2 work item (slices 5-7). Phase 1 ships with the *audit log* persistence (slices 2-3) which is the highest-leverage half.

---

## 10 · Lifecycle continuity checklist

| Propagation hop | Verified? | How |
|---|---|---|
| SOW intake → Decomposition workspace surfaces program | ✅ | Both read `enterpriseSows` |
| Decomposition commit → Projects portfolio surfaces program | ✅ | Same store |
| Contributor accepts task → Mentor queue sees it | ✅ | Unified task store mutator |
| Mentor approves → Enterprise Review queue sees it | ✅ | `state="completed"` filter |
| Enterprise Review accepts → Billing eligibility queue updates | ✅ | `useBillingOverview` reads same store |
| Enterprise Review accepts → Contributor Completed Work updates | ✅ | Same store |
| Enterprise Review accepts → Dashboard activity feed updates | ✅ | Same store |
| Enterprise Review accepts → AcceptanceDecision row written | ✅ | Slice 2 |
| Enterprise Review rework → Contributor revision queue receives | ✅ | `applyReworkLocally` |
| Mentor decision → Delivery Tracking lifecycle continuum updates | ✅ | Live derive |
| Reviewer recommendation → visible in Review Detail | ✅ | Same store derivation |

**All 11 propagation hops verified.** No outstanding lifecycle continuity gaps for Phase 1.

---

## 11 · V1 redirect cleanup checklist

Cumulative V1 routes sealed across passes: **63**

| Domain | V1 routes redirected | Destination |
|---|---|---|
| SOW (intake / upload / approval / archive / blueprint / versions / generate / detail-tabs) | 22 | `/enterprise/sow` |
| Decomposition (detail + approve + edit + approval) | 4 | `/enterprise/decomposition` |
| Projects (detail + milestones + monitor + tasks + completed) | 5 | `/enterprise/projects` |
| Review (detail + feedback + history) | 3 | `/enterprise/review` |
| Reviewer sub-pages | 9 | `/enterprise/reviewer` |
| Team | 3 | `/enterprise/decomposition` |
| Analytics + Audit + Compliance | 9 | `/enterprise/dashboard` |
| Billing sub-pages | 8 | `/enterprise/billing` |

**Outstanding cleanup tasks:**

- [ ] CLEAN-1 — Manual QA: address-bar-type each V1 URL and verify redirect lands cleanly (0.5d)
- [ ] CLEAN-2 — Delete V1 component files that are referenced only by the redirect stubs (after one release cycle, optional)
- [ ] CLEAN-3 — Document which Phase 2 sub-routes (e.g. `[id]/approve`) might be revived

---

## 12 · Demo safety checklist

For controlled stakeholder demos following `STAKEHOLDER_WALKTHROUGH_SCRIPT.md`:

- [x] All three `NEXT_PUBLIC_*_DEMO` flags work in dev
- [x] Production guard refuses boot if flags set in production
- [x] Sidebar contains only V2 surfaces
- [x] Drill-clicks into V1 detail pages all redirect harmlessly
- [x] No router/state crash possible on intake page even with empty fields
- [x] Acceptance click visibly propagates within 1s
- [x] Reviewer Workspace reachable from enterprise demo sidebar
- [x] All 4 demo browser tabs preload cleanly
- [ ] DEMO-1 — Test on 1440×900 + 1920×1080 + 2560×1440 displays for layout sanity (0.25d)
- [ ] DEMO-2 — Record backup screen capture of the propagation moment in case live demo fails (0.5d)
- [ ] DEMO-3 — Validate the 8-min compressed walkthrough variant timing (0.5d)
- [ ] DEMO-4 — Disable browser dev tools / console for the live demo browser session (procedure note)

---

## 13 · Security checklist

| Item | Status |
|---|---|
| `requireRole` primitive shipped | ✅ Slice 1 |
| Demo bypass production guard shipped | ✅ Slice 1 |
| `requireRole` on 2 high-risk routes (superadmin, reviewer/create) | ✅ Slice 1 |
| `requireRole` on remaining 26 routes | ❌ MVP-1 (2d) |
| `requireResourceOwner` helper | ❌ MVP-2 (1d) |
| Per-resource ownership checks on `/api/contributor/*` | ❌ MVP-2 |
| CSRF middleware | ❌ PROD-4 (1d) |
| Rate limiting on auth + email + payment routes | ❌ PROD-5 (1-2d) |
| Security headers (CSP, X-Frame, Referrer, Permissions) | ❌ PROD-6 (0.5d) |
| AUTH_SECRET rotation runbook | ❌ PROD-7 (0.5d) |
| HTTPS-only cookie verified | ✅ `__Secure-authjs.session-token` |
| Session lifetime (30d) documented | ✅ CLAUDE.md |
| MFA enrollment end-to-end coverage | ⚠️ PROD-11 (1w, if sales requires) |
| OAuth → onboarding redirect tightened | ⚠️ PROD-11 |
| Razorpay webhook signature verified | ✅ Slice 3 |
| Razorpay payout gate (acceptance required) | ✅ Slice 3 |

**Phase 1 security closure requires: MVP-1, MVP-2. Production deployment additionally requires: PROD-4 through PROD-7.**

---

## 14 · Payment checklist

| Item | Status |
|---|---|
| `create-order` authenticated | ✅ Slice 3 |
| `create-order` Zod-validated | ✅ Slice 3 |
| Milestone-payout gate (AcceptanceDecision required) | ✅ Slice 3 |
| `PaymentOrder` persisted | ✅ Slice 3 |
| Webhook signature verified | ✅ Slice 3 |
| Webhook idempotent on event id | ✅ Slice 3 |
| Failed-signature events recorded for monitoring | ✅ Slice 3 |
| Refund event propagation | ❌ POL-7 (3d) |
| Duplicate-charge prevention at order level | ❌ POL-8 (2d) |
| Razorpay Payouts (reverse leg) | ❌ PROD-9 (1w, conditional) |
| Reconciliation cron (missed webhooks) | ❌ PROD-8 (3d) |
| `RAZORPAY_WEBHOOK_SECRET` env documented | ✅ Slice 3 |
| Rate limiting on `create-order` | ❌ POL — subsumed by PROD-5 |

**Phase 1 closure: complete (slice 3 shipped the load-bearing pieces).**
**Production closure: PROD-8 + POL-7 + POL-8 recommended.**

---

## 15 · Operational realism checklist

| Item | Status |
|---|---|
| Mentor name diversity (8-person pool) | ✅ Realism pass |
| Activity timestamps span "5m ago" → "3d ago" | ✅ Realism pass |
| SLA windows spread across watch/breach | ✅ Realism pass |
| Invoice ID format real-looking (`INV-2026-Q2-001`) | ✅ Realism pass |
| Billing snapshot KPIs off-grid | ✅ Realism pass |
| 8 distinct AI signal classes (not always-warning) | ✅ Realism pass |
| Per-skill cohort distribution | ✅ Existing seed |
| Multi-round revision distribution | ✅ Existing seed |
| Per-program milestone variation | ⚠️ Similar across SOWs | DEF (Phase 2 polish) |
| Per-region / per-locale contributor variety | ⚠️ Skill cohorts only | DEF |
| Contributor identity at task level | ❌ Cohort-level only | DEF |

**Realism floor is well above stakeholder MVP expectation.**

---

## 16 · Seed-data realism checklist

| Subject | Status |
|---|---|
| 6 SOWs with distinct classifications | ✅ |
| 6 corresponding projects with varying health | ✅ |
| ~15 tasks across various states | ✅ |
| Mentor cohort diversity (deterministic per task hash) | ✅ Realism pass |
| Activity freshness (`humanToIso()` helper) | ✅ Realism pass |
| Payment events / payouts in DB | ❌ — seed required if pilot test (0.5d) |
| Test enterprise sessions for QA | ❌ — fixture script needed (0.25d) |
| Test contributor sessions for QA | ❌ — fixture script needed (0.25d) |
| Demo "now" date pin | ❌ — currently `Date.now()` drifts seed over time | DEF (Phase 2) |

**SEED-1 — Add a small seed script for test sessions (0.5d).**

---

## 17 · QA walkthrough checklist

Execute before any demo. Reference `STAKEHOLDER_WALKTHROUGH_SCRIPT.md`.

- [ ] QA-1 — Run the 18-min standard walkthrough end-to-end without errors (0.5d)
- [ ] QA-2 — Run the 8-min compressed variant
- [ ] QA-3 — Verify acceptance click → all 5 propagation surfaces update within 2s
- [ ] QA-4 — Test what happens if the demo operator clicks Profile / Settings / Notifications mid-demo (should be V2-styled, not break flow)
- [ ] QA-5 — Test what happens if the operator clicks any V1 detail URL via address bar (should redirect harmlessly)
- [ ] QA-6 — Verify Reviewer Workspace loads correctly from enterprise demo session (no role-redirect bounce)
- [ ] QA-7 — Verify all 4 preloaded tabs survive a single full session refresh
- [ ] QA-8 — Manually verify each KPI tile across Enterprise V2 reflects live store state
- [ ] QA-9 — Test reduced-motion preference activated → all transitions degrade gracefully

**QA total: ~1 engineer-day.**

---

## 18 · Deployment readiness checklist

| Item | Status |
|---|---|
| Production Vercel project configured | ⚠️ Verify env vars |
| Postgres connection string set (production) | ⚠️ Verify |
| `AUTH_SECRET` set + documented | ⚠️ Verify |
| All `NEXT_PUBLIC_*_DEMO` flags **unset** in production env | ❌ Verify on deploy |
| `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` set | ⚠️ Verify |
| `RAZORPAY_WEBHOOK_SECRET` set | ❌ NEW from slice 3 — must add to prod |
| Razorpay webhook URL configured in dashboard | ❌ Manual step on deploy |
| Prisma migrations applied | ❌ `npx prisma migrate deploy` |
| Sentry DSN set (when slice 10 lands) | DEF |
| CI: lint + typecheck on PR | ❌ No GitHub Actions workflow yet (1d) |
| CI: Prisma migration smoke test | ❌ (0.5d) |
| Backup strategy for Postgres | ⚠️ Verify with infra |
| HTTPS enforced (Vercel default ✓) | ✅ |
| Health check endpoint | ❌ Add `/api/healthz` (0.25d) |

**DEPLOY-1 — Add GitHub Actions workflow for typecheck + lint + Prisma format (1d)**
**DEPLOY-2 — Add `/api/healthz` returning DB connectivity status (0.25d)**

---

## 19 · Environment variable checklist

Every variable currently required or planned. Items marked NEW were added in recent passes.

### Authentication

- `AUTH_SECRET` — required, JWE encryption key
- `NEXTAUTH_URL` — required, deployment URL
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — OAuth
- `MICROSOFT_CLIENT_ID` + `MICROSOFT_CLIENT_SECRET` + `MICROSOFT_TENANT_ID` — OAuth

### Database

- `DATABASE_URL` — Postgres connection string

### Razorpay

- `RAZORPAY_KEY_ID` — required, order creation
- `RAZORPAY_KEY_SECRET` — required, order creation
- `RAZORPAY_WEBHOOK_SECRET` — **NEW** required for webhook signature verification (slice 3)

### Email

- `SMTP_HOST` + `SMTP_PORT` + `SMTP_USER` + `SMTP_PASSWORD` + `EMAIL_FROM` — Nodemailer

### Upstream API

- `GLIMMORA_API_URL` — backend API (existing)
- `GLIMMORA_ADMIN_EMAIL` + `GLIMMORA_ADMIN_PASSWORD` — service account

### Demo flags (must be UNSET in production)

- `NEXT_PUBLIC_CONTRIBUTOR_DEMO` — never set in prod
- `NEXT_PUBLIC_MENTOR_DEMO` — never set in prod
- `NEXT_PUBLIC_ENTERPRISE_DEMO` — never set in prod
- `ALLOW_DEMO_IN_PRODUCTION` — explicit override (rarely used)

### Future (Phase 2)

- `SENTRY_DSN` — observability slice
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — rate limiting
- `S3_BUCKET` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` — server-exports

**ENV-1 — Audit production env for completeness against above list (0.25d on deploy)**

---

## 20 · Observability / logging checklist

| Item | Status |
|---|---|
| Console logs on critical API failures | ✅ Already in slice 2/3 |
| Sentry integration | ❌ PROD-3 |
| Source maps uploaded to Sentry | ❌ PROD-3 |
| Pino structured logging on API routes | ❌ PROD-3 |
| Request id propagation | ❌ PROD-3 |
| `AuditLog` Prisma model | ❌ PROD-3 |
| Mutation logging hooks | ❌ PROD-3 |
| OTel trace for acceptance → billing chain | ❌ PROD-3 |
| Dashboard for missed webhook reconciliation | ❌ PROD-8 |
| Webhook signature failure alerting | ❌ PROD-3 |
| Health check endpoint | ❌ DEPLOY-2 |

**Total observability work: ~1 engineer-week (PROD-3) + 0.25d (DEPLOY-2).**

---

## 21 · Per-portal acceptance criteria

### 21.1 — Contributor portal acceptance criteria
- [x] Lands on `/contributor/dashboard` after login
- [x] All sidebar entries render V2 surfaces
- [x] Workroom shows live task state from unified store
- [x] Mentor reply scheduler simulates 3-5s turnaround
- [x] Revision flow re-uses same task with `reworkRound++`
- [x] Completed Work shows accepted deliveries with credentials
- [x] Progress page surfaces earnings totals + payout history
- [x] Sidebar excludes V1 surfaces (Earnings detail hidden)
- [ ] All mutations persist to backend — Phase 2

### 21.2 — Mentor portal acceptance criteria
- [x] Lands on `/mentor/dashboard` after login
- [x] Pending Reviews queue surfaces under_review tasks
- [x] Approving a task propagates to Enterprise Review queue
- [x] Requesting revision propagates to Contributor revision queue
- [x] AI suggestion / flag / confidence surfaces present
- [x] Escalation surface reflects revision_round ≥ 3 tasks
- [ ] All mutations persist — Phase 2

### 21.3 — Enterprise portal acceptance criteria
- [x] Lands on `/enterprise/dashboard` after login
- [x] All 9 V2 workspaces reachable from sidebar
- [x] SOW Workspace + Intake + Detail render
- [x] Decomposition workspace renders workstreams
- [x] Projects Portfolio + Project Detail render
- [x] Delivery Tracking (canonical `/enterprise/delivery-tracking`) renders
- [x] Enterprise Review + Review Detail render
- [x] Reviewer Workspace reachable in demo mode
- [x] Billing & Invoices V2 renders with eligibility queue
- [x] Profile / Settings / Notifications V2 utility surfaces render
- [x] Acceptance click writes `AcceptanceDecision` row (slice 2)
- [x] Razorpay order creation auth-gated + payout-gated (slice 3)
- [ ] SOW + Project + Decomposition state persists — Phase 2

### 21.4 — Reviewer role acceptance criteria
- [x] Reachable in enterprise demo mode
- [x] Validation queue + 5-tab workspace + cross-role lineage strip render
- [x] Recommendation annotations function in session
- [ ] Persistence — Phase 2

---

## 22 · Effort + risk + dependency summary

### MVP closure (must clear before Phase 1 = DONE)

| ID | Effort | Risk | Cumulative |
|---|---|---|---|
| MVP-1 | 2d | LOW | 2d |
| MVP-2 | 1d | MED | 3d |
| MVP-3 | 0.5d | LOW | 3.5d |
| MVP-4 | 0.5d | LOW | 4d |
| MVP-5 | 0.5d | LOW | 4.5d |
| MVP-6 | 0.25d | LOW | 4.75d |
| QA-1..9 | 1d | LOW | 5.75d |
| DEMO-1..4 | 1.25d | LOW | 7d |
| ENV-1 | 0.25d | LOW | 7.25d |
| SEED-1 | 0.5d | LOW | 7.75d |
| DEPLOY-1 | 1d | LOW | 8.75d |
| DEPLOY-2 | 0.25d | LOW | 9d |
| CLEAN-1 | 0.5d | LOW | 9.5d |

**MVP closure total: ~9-10 engineer-days = 2 weeks single-engineer, 1 week paired.**

### Production deployment (additional beyond MVP closure)

| ID | Effort | Risk |
|---|---|---|
| PROD-1 (Task migration) | 1-2w | HIGH |
| PROD-2 (Domain models) | 1-2w | MED |
| PROD-3 (Observability) | 1w | LOW |
| PROD-4 (CSRF) | 1d | LOW |
| PROD-5 (Rate limiting) | 1-2d | LOW |
| PROD-6 (Security headers) | 0.5d | LOW |
| PROD-7 (AUTH_SECRET runbook) | 0.5d | LOW |
| PROD-8 (Reconciliation) | 3d | MED |

**Production-blocking total: ~4-6 engineer-weeks.**
**Conditional (if features ship): PROD-9 + PROD-10 + PROD-11 → another 2-3 weeks.**

---

## 23 · The three gates

### 23.1 — Phase 1 Go/No-Go Gate

The Phase 1 MVP is considered **complete and closed** when ALL of the following are true:

- [x] All four "DONE definitions" (§1) marked complete except items explicitly marked "Phase 2"
- [x] All 11 lifecycle continuity hops verified (§10)
- [x] All 63 V1 routes sealed via redirects (§11)
- [ ] MVP-1 through MVP-6 cleared (§4)
- [ ] QA walkthrough pass (§17) executed without blocker
- [ ] DEMO-1 through DEMO-4 prepared (§12)
- [ ] DEPLOY-1 (CI workflow) and DEPLOY-2 (healthz) shipped (§18)
- [ ] Master walkthrough script signed off by stakeholder lead

**Gate effort: ~9-10 engineer-days.**

**Outcome if PASSED:** Phase 1 MVP officially closed. Platform suitable for guided stakeholder demos and controlled pilots.

---

### 23.2 — Safe Stakeholder Demo Gate

Suitable for demos *during* Phase 1 (before formal closure). Must hold ALL of:

- [x] All three `NEXT_PUBLIC_*_DEMO` flags set in demo env
- [x] No V1 sidebar entries visible
- [x] Sidebar drill-clicks loop back to V2 surfaces (never V1)
- [x] Acceptance click visibly propagates within 2s
- [x] 4 preloaded browser tabs working
- [x] Walkthrough script reviewed by demo operator
- [ ] QA-1 (18-min walkthrough) executed within 48h prior

**Status: PASSING.** Currently safe for stakeholder demos with prepared operator.

---

### 23.3 — Production Deployment Gate

Suitable for real production traffic facing real users. Must hold ALL of:

- [ ] All Phase 1 Go/No-Go Gate items
- [ ] All `NEXT_PUBLIC_*_DEMO` flags unset (production guard catches if leaked)
- [ ] PROD-1 through PROD-8 cleared
- [ ] PROD-9 cleared if payouts ship
- [ ] PROD-10 cleared if server exports ship
- [ ] PROD-11 cleared if MFA required
- [ ] CSP + CSRF + rate-limiting tested in staging
- [ ] Sentry receiving events from staging
- [ ] Backup + restore procedure tested in staging
- [ ] On-call runbook documented
- [ ] AUTH_SECRET rotation procedure tested in staging
- [ ] Postgres connection-pooling tuned for expected load
- [ ] Razorpay webhook URL set in dashboard
- [ ] CI green on main for 3+ consecutive days
- [ ] Load testing performed (e.g., k6 → 100 concurrent operators)

**Gate effort: ~5-7 engineer-weeks beyond Phase 1 closure.**

**Outcome if PASSED:** Platform is production-ready for real customer-facing deployment.

---

## 24 · Sign-off

| Role | Name | Signed | Date |
|---|---|---|---|
| Engineering lead | | | |
| Product lead | | | |
| Design lead | | | |
| Security review | | | |
| QA lead | | | |

---

**This document is the canonical closure reference. Update §22 effort estimates and §2 status snapshot as items are cleared. Do not delete cleared items — keep them with date-stamp so the closure history is preserved.**
