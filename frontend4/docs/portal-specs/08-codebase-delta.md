# Codebase Delta Report — Phase 1 Audit

> **Status:** Stage 1 deliverable — read-only audit; no code changed
> **Last updated:** 2026-05-26
> **Sources:** four parallel audit passes against locked specs 01–05
> **Consumed by:** Stage 2 (foundations build)

---

## 0. Document control

| Field | Value |
|---|---|
| Document role | Single source of truth for what stays / changes / replaces / deletes in the existing codebase |
| Lock status | Locked at sign-off; revisions tracked via change order |
| Mark schema | ✅ KEEP · 🔧 REFACTOR · 🔁 REPLACE · 🗑 DELETE · ❌ MISSING |

---

## 1. Executive summary

### 1.1 Top-level numbers

| Category | Existing files | Notes |
|---|---|---|
| **Contributor portal** | ~78 affected | 16 KEEP, 42 REFACTOR, 8 REPLACE, 12 DELETE |
| **Enterprise portal** | ~37 affected | 12 KEEP, 18 REFACTOR, 0 REPLACE, 7 DELETE |
| **Mentor portal** | ~130 affected | 50 KEEP, 0 REFACTOR-only (most need wiring), 0 REPLACE, ~80 DELETE |
| **Platform admin** | ~7 affected | 4 KEEP, 0 REFACTOR-only, 2 REPLACE, 0 DELETE |
| **Cross-functional** | ~20 affected + 18 missing systems | 12 KEEP, 8 REFACTOR, 2 REPLACE, ≥15 MISSING tables |
| **New files needed** | ~120 surfaces | Across all four portals |
| **Files to delete** | ~106 | Phase 2 over-scope + sealed routes |

### 1.2 The honest read

Most of the **UI work is in good shape**. The contributor + enterprise + mentor portals have polished V3 surfaces for the surfaces the spec retains. The big effort is in two areas:

1. **Cross-functional infrastructure is largely absent.** No middleware.ts. Prisma schema has 5 tables; we need 25+. No audit service. No AI orchestrator. No notification dispatch. No HRIS/webhooks/payment-rail adapters. No RLS. No i18n framework. No structured logging.
2. **Platform admin portal is mostly empty.** Existing `/admin/*` is 4 surfaces (dashboard stub, email templates, roles, settings). Spec calls for 18 surfaces — almost all need new build.

The portal UI specs are mostly **WIRE work** (existing UI needs to call real APIs instead of Zustand-persist localStorage). The platform infrastructure is **BUILD work** (largely doesn't exist). Phase 1 success depends on Stage 2 building foundations first; otherwise WIRE work has nothing to wire to.

### 1.3 Phase 1 readiness today

| Phase 1 exit criterion | Status |
|---|---|
| Server-side RBAC for all four portals | ❌ middleware.ts missing |
| Postgres RLS tenant isolation | ❌ no policies in any migration |
| SAML/OIDC enterprise SSO | ❌ NextAuth has Google+MS+credentials only |
| Immutable audit log | ❌ no audit_event table; no signing |
| 4 MVP AI agents | ❌ no orchestrator |
| Notification dispatch (in-app + email + SMS) | 🔧 email transport exists; in-app + SMS missing |
| Razorpay payouts end-to-end | 🔧 webhook receiver exists; adapter pattern + Wise missing |
| HRIS sync | ❌ entirely missing |
| File scan (virus + plagiarism) | ❌ entirely missing |
| WCAG 2.1 AA audit | ❌ no a11y tooling in CI |

**Verdict: today we're at ~30% of Phase 1 by exit criteria. The portal UIs flatter the actual state.**

---

## 2. Critical blockers (must-fix-first)

These five items block every other Phase 1 deliverable. They're the Stage 2 Week 1–4 backbone.

### B-1. `src/middleware.ts` does not exist

Any authenticated user can navigate to any portal. A `contributor` can open `/enterprise/*`; API calls fail but UI loads. **Security vulnerability.** Must be the very first build in Stage 2.

### B-2. Prisma schema has 5 tables; need 25+

Current: `User`, `ContributorProfile`, `AcceptanceDecision`, `PaymentOrder`, `PaymentEvent`.

Missing: `Tenant`, `Role`, `Session`, `AuditEvent`, `Skill`, `Mentor`, `MentorPool`, `MentorCompetency`, `RateCard`, `RateCardVersion`, `RateCardRow`, `Invoice`, `Payout`, `PayoutEligibility`, `GovernanceCase`, `KycCase`, `Agent`, `PromptTemplate`, `PromptVersion`, `PaymentRail`, `Integration`, `Webhook`, `Notification`, `NotificationPreference`, `EmailTemplate`, `Submission`, `SubmissionEvidence`, `ReviewAssignment`, `ReviewDecision`, `MentorshipSession`, `CoachingNote`, `Sow`, `SowVersion`, `Approval`, `DecompositionPlan`, `Milestone`, `Task`.

### B-3. No Postgres RLS policies

Per locked decision #1 (RLS at DB level). No migrations contain `CREATE POLICY ... ON ... USING (tenant_id = current_setting(...))`. Even if middleware blocks bad portal routes, RLS catches missed `WHERE tenant_id` filters. Defense in depth.

### B-4. Audit service missing entirely

SOW §3.1.MVP.8 + §14 make immutable audit MVP-binding. No `AuditEvent` table; no signing; no export; no daily S3 snapshot. Every state change should write an audit event — currently zero write the audit.

### B-5. AI orchestrator missing entirely

Four MVP agents (SOW Intake, Decomposition, Contributor Support, Review Assistant) are core to the experience. No `AgentRequest/Response` envelope; no confidence scoring; no override capture; no fallback. UI already references "AI signals" but they're hardcoded.

---

## 3. Per-portal delta

### 3.1 Contributor portal

#### ✅ KEEP (16 files)
- Dashboard v3 components: `continue-working`, `earnings-strip`, `lifecycle-timeline`, `actionable-inbox`, `ai-signals` and the orchestrating page
- `/contributor/tasks/page.tsx` (Assigned list)
- `/contributor/tasks/revisions/page.tsx`
- `/contributor/tasks/completed/page.tsx`
- `/contributor/tasks/[taskId]/v3-components/*` (4 files: workroom-header, work-pane, context-rail, action-footer)
- `/contributor/profile/page.tsx`
- `/contributor/credentials/page.tsx`
- `/public/credentials/[shareId]`

#### 🔧 REFACTOR (42 files) — major categories
- **Onboarding** — all 9 steps + shell: wire to real backend; add institutional verification (students); add KYC for women workforce; write consent to audit
- **Workroom** — wire evidence upload to real file scan; implement Q&A thread; concurrent-edit handling
- **Submission** — rebuild submit page per §5.F.1; add routing selector + readiness modal
- **Revisions** — wire diff viewer; build dispute modal
- **Earnings** — wire to real Postgres; build payout method + withdrawal flows
- **Profile / Digital twin** — wire to live derivation from completed tasks
- **Settings / Support / Notifications** — wire all to real services
- **Stores** — `contributor-tasks-store.ts` localStorage → Postgres + optimistic UI

#### 🔁 REPLACE (8 V2 components)
- All `/contributor/dashboard/v2-components/*` (V2 components superseded by v3)
- All `/contributor/tasks/v2-components/*`
- All `/contributor/tasks/[taskId]/v2-components/*`
- All `/contributor/tasks/[taskId]/submit/v2-components/*`
- All `/contributor/tasks/[taskId]/revision/v2-components/*`

#### 🗑 DELETE (12 surfaces)
- `/contributor/community/*` (Phase 2)
- `/contributor/messages/*` (Phase 2)
- `/contributor/learning/*` (Phase 2)
- `/contributor/progress/*` (Phase 2 — over-scoped)
- `/contributor/ai/guidance`, `/contributor/ai/readiness` (AI is sidebar/inline, not dedicated pages)
- `/lib/stores/contributor-phone-store.ts` (session-level state, not persisted)
- Mock data: `contributor-progress.ts`, others migrate to Postgres seed

#### 🆕 NEW (11 surfaces)
- §5.A.7–5.A.8 MFA setup + challenge polish
- §5.B.3 persona-specific identity verification forms (3 variants)
- §5.E.3 Q&A clarification thread (component)
- §5.F.1–5.F.3 submission screen + warning + success
- §5.H.3 diff viewer
- §5.H.4 dispute modal
- §5.L.3–5.L.7 payout method, withdraw, export
- §5.N.2–5.N.5 settings sub-pages
- §5.O.4–5.O.5 safety report + grievance forms

---

### 3.2 Enterprise portal

#### ✅ KEEP (12 broad areas, ~140 files at fine granularity)
- SOW workspace (~71 files: upload, author, review, stage progression)
- Decomposition workspace (~48 files)
- Projects (~45 files: portfolio, exceptions, milestones)
- Reviewer sub-portal (~78 files: queue, decision rail, history)
- Billing invoices + payouts directories (~44 files)
- Dashboard role-conditional modules
- Notifications, Profile
- Audit unified ledger (partial work started)
- `/types/enterprise.ts`
- `/components/enterprise/*`
- `/lib/stores/sow-store-v3.ts`, `/lib/stores/decomposition-store-v3.ts` (localStorage → migrate)

#### 🔧 REFACTOR (18 areas)
- **Rate cards UI** — unseal + build full config UI per §5.G.4–5.G.6
- **Payouts ledger** — add detail drill-in, batch release, reversal per §5.G.7–5.G.8
- **SOW approval backend** — wire state transitions + audit per §5.C.9
- **Decomposition AI** — wire real Claude API per §5.D.2
- **Integrations Settings** — build SSO/HRIS/webhooks/ERP UIs per §5.K.3–5.K.7
- **Policies Settings** — build SLA/escalation/governance per §5.K.8
- **Tenant & roles Settings** — invite flow + role modal per §5.K.1–5.K.2
- **Billing export** — build CSV/PDF/JSON exporter per §5.G.9
- **Analytics** — unseal + build workforce + economic basics per §5.J
- **Compliance baseline** — build consent + retention + deletion per §5.I
- **Delivery-tracking consolidation** — merge into Projects · Exceptions (~40 files to relocate/delete)

#### 🗑 DELETE (7)
- `/enterprise/team/*` (4 files; Phase 2)
- `/enterprise/compliance/podl`, `/esg`, `/evidence`, `/documents` (redirects; Phase 2)
- `/enterprise/analytics/reports` (Phase 2)
- `/enterprise/analytics/governance` (Phase 2; use Audit)
- `/enterprise/billing/pricing` (redirect; clean up)

#### 🆕 NEW (22 routes)
Listed in detail in §3.2 of the enterprise audit. Highlights: rate-cards/new, rate-cards/[cardId], payouts/[payoutId], billing/export, sow/templates, sow/[sowId]/versions, decomposition/[planId]/approve, project tabs (milestones, tasks, team, budget), all settings sub-routes, compliance + analytics surfaces, audit/[eventId] + audit/export.

---

### 3.3 Mentor portal

#### ✅ KEEP (~50 files)
- `/mentor/dashboard` (strip Phase 2 cards)
- `/mentor/queue/*` (review detail, decision flow)
- `/mentor/history`
- `/mentor/mentorship`
- `/mentor/escalation` (wire to backend; senior+ only)
- `/mentor/profile`, `/mentor/settings`
- `/mentor/_shared/workflow/*`

#### 🗑 DELETE (~80 files across 9 route trees)
- `/mentor/ai/*` (3 routes — confidence, flags, suggestions)
- `/mentor/analytics/*` (3 routes — quality, sla, throughput)
- `/mentor/contributors/*` (3 routes — profiles, risk, submissions)
- `/mentor/governance/*` (3 routes — audit, escalation-logs, policy)
- `/mentor/reviews/escalated/*`, `/governance-holds/*`, `/in-progress/*`, `/rework/*`
- `/mentor/sla-monitor/*` (full APG feature)

These are the over-scope cuts. They confuse the architectural shape of the mentor portal; deleting them clears the path to Phase 1.

#### 🆕 NEW (4 surfaces)
- `/mentor/queue/[reviewId]/diff` — v1↔v2 diff
- `/mentor/queue/[reviewId]/audit` — per-review audit
- `/mentor/history/[decisionId]` — read-only past decision detail
- `/mentor/history/metrics` — personal metrics

---

### 3.4 Platform admin portal

#### ✅ KEEP (4 files)
- `/admin/email-templates/*` (exists, works)
- `/admin/roles` (exists, minimal)
- `/admin/settings`

#### 🔁 REPLACE (2 files)
- `/admin/dashboard` — needs operational health cards per §5.B.1
- `/admin/audit` — needs cross-tenant + signed export per §5.J.1

#### 🆕 NEW (~60–80 files across 16 surfaces)
Highlights:
- **Tenants** (list, new 6-step wizard, detail, provisioning status) — §5.C
- **Mentors** (list, new, detail, competency editor, pools) — §5.D
- **Skill taxonomy** (CRUD, merge, deprecate) — §5.E
- **Rubric templates** (library, editor) — §5.F
- **Governance** (queue, case detail) — §5.H
- **KYC** (queue, case detail) — §5.I
- **AI agents** (list, detail, prompts, prompt editor + version history) — §5.K
- **Payment rails** (list, rail detail) — §5.L
- **System health** — §5.M
- **Partnerships** (universities + women-workforce) — §5.N
- **Auth env switcher chip** (topbar) — §5.A.2

---

## 4. Cross-functional delta

### 4.1 Auth

| Item | Status | Action |
|---|---|---|
| NextAuth core config | ✅ KEEP | `src/auth.ts` solid base |
| Google + Microsoft OAuth | ✅ KEEP | Working |
| Email/password + credentials provider | ✅ KEEP | Working |
| SAML 2.0 enterprise SSO | ❌ MISSING | Build SAML adapter |
| OIDC enterprise SSO | ❌ MISSING | Build OIDC provider factory |
| Glimmora staff SSO (Google Workspace OIDC) | ❌ MISSING | Build |
| MFA TOTP setup | 🔧 REFACTOR | Pending checks exist; setup flow missing |
| MFA SMS (Twilio + MSG91) | ❌ MISSING | Build SMS rail |
| MFA email OTP | 🔧 REFACTOR | Exists in places; consolidate |
| MFA backup codes | ❌ MISSING | Build |
| Session model | 🔁 REPLACE | Currently stateless JWT; need JWT + Redis blacklist + Postgres session table per §2.5 |
| Session revocation on logout | ❌ MISSING | Build |
| First-time SSO routing | ❌ MISSING | Build |
| Account-to-portal routing | 🔧 REFACTOR | Add logic to route to primary portal post-auth |
| Tenant selector page (multi-tenant user) | ❌ MISSING | Build |

### 4.2 RBAC + Middleware

| Item | Status | Action |
|---|---|---|
| `src/middleware.ts` | ❌ MISSING | **BLOCKER B-1** — build per §3.3 |
| Role taxonomy seed | ❌ MISSING | Seed `Role` table with `plat.*`, `ent.*`, `mentor.*`, contributor implicit |
| Permission matrix | ❌ MISSING | Code-level permission model + DB seed |
| Tenant scope enforcement | ❌ MISSING | Middleware + Postgres RLS |
| SoD warnings | ❌ MISSING | Build in admin invite flows |
| Client-side gates | 🔧 REFACTOR | Existing client-side role checks; keep for UX, but add server-side everywhere |

### 4.3 Database / Prisma

| Item | Status | Action |
|---|---|---|
| Postgres connection | ✅ KEEP | Working |
| Prisma client | ✅ KEEP | Working |
| Current schema (5 tables) | 🔁 REPLACE | **BLOCKER B-2** — expand to 25+ tables per spec |
| Migrations | 🔧 REFACTOR | Add new migrations for all missing tables |
| RLS policies | ❌ MISSING | **BLOCKER B-3** — add to all tenant-scoped migrations |
| Universal timestamps + soft delete | 🔧 REFACTOR | Add `created_at/updated_at/deleted_at/created_by/updated_by` to every table |
| FK referential integrity | 🔧 REFACTOR | Audit existing FKs; add cascade rules per §8.5 |
| Versioning tables | ❌ MISSING | Add `sow_version`, `rate_card_version`, `prompt_version`, etc. |

### 4.4 Audit

| Item | Status | Action |
|---|---|---|
| `AuditEvent` table | ❌ MISSING | **BLOCKER B-4** — append-only table per §4.2 |
| HMAC signing | ❌ MISSING | Build signing service; key rotation quarterly |
| Daily S3 snapshot | ❌ MISSING | Cron job |
| Audit emit from services | ❌ MISSING | Wrap every state-change with `audit.emit()` |
| Search (Postgres FTS) | ❌ MISSING | Build query layer with tenant scoping |
| Export (CSV/JSON/NDJSON) | ❌ MISSING | Build per §4.6 |
| Audit UI (enterprise + admin) | 🔧 REFACTOR | Wire UI to real audit service |

### 4.5 AI orchestrator

| Item | Status | Action |
|---|---|---|
| Shared `AgentRequest/Response` envelope | ❌ MISSING | **BLOCKER B-5** — build per §5.2 |
| SOW Intake Assistant | ❌ MISSING | Build prompt + integration |
| Decomposition Assistant | ❌ MISSING | Build |
| Contributor Support Assistant | ❌ MISSING | Build |
| Review Assistant | ❌ MISSING | Build |
| Confidence scoring | ❌ MISSING | Required on every output |
| Override capture (`AgentOverrideDelta`) | ❌ MISSING | Audit-grade |
| Graceful degrade | ❌ MISSING | UI fallback when LLM unavailable |
| Prompt versioning + rollback | ❌ MISSING | Build `prompt_template` + `prompt_version` tables |
| Per-invocation audit (`agent.invoke` + `agent.respond`) | ❌ MISSING | Build |

### 4.6 Notifications

| Item | Status | Action |
|---|---|---|
| Email transporter (Nodemailer) | ✅ KEEP | Working |
| Email templates store | 🔁 REPLACE | Currently Zustand; move to `EmailTemplate` Postgres table |
| Notification dispatch service | ❌ MISSING | Build per §6.5 |
| In-app notification table + websocket/poll | ❌ MISSING | Build |
| SMS rail (Twilio + MSG91) | ❌ MISSING | Build |
| Per-user preferences matrix | ❌ MISSING | Build `NotificationPreference` table |
| Critical-only SMS routing | ❌ MISSING | Build per locked decision (password change, safety ack, payout failure) |
| Delivery retry + DLQ | ❌ MISSING | Build |
| Bounce/complaint webhook | ❌ MISSING | Build |

### 4.7 Integrations

| Item | Status | Action |
|---|---|---|
| Uniform `Integration` contract | ❌ MISSING | Build per §7.2 |
| HRIS sync (Workday/BambooHR/SAP/CSV) | ❌ MISSING | Build |
| Webhook outbound (Jira/Slack/generic) | ❌ MISSING | Build per §7.4 |
| Payment rail adapter pattern | 🔧 REFACTOR | Razorpay webhook exists; build adapter + add Wise |
| Razorpay India (NEFT/UPI/wallet) | 🔧 REFACTOR | Wire payouts, not just webhook |
| Wise global | ❌ MISSING | Build |
| File scan — virus (ClamAV) | ❌ MISSING | Build sidecar |
| File scan — plagiarism | ❌ MISSING | Provider TBD; build adapter |
| ERP file drop (SFTP/S3) | ❌ MISSING | Build |
| KYC manual review (Phase 1 baseline) | 🔧 REFACTOR | UI exists in admin spec; build backend |

### 4.8 Observability

| Item | Status | Action |
|---|---|---|
| Structured logging | ❌ MISSING | Add pino/winston; JSON to stdout |
| OpenTelemetry / W3C TraceContext | ❌ MISSING | Add SDK |
| Prometheus `/metrics` per service | ❌ MISSING | Build |
| `/healthz` + `/readyz` | ❌ MISSING | Build |
| Sentry / error reporting | ❌ MISSING | Wire |
| Service status feed (admin) | ❌ MISSING | Build per `/admin/system-health` |

### 4.9 Other cross-functional

| Item | Status | Action |
|---|---|---|
| i18n framework (next-intl) | ❌ MISSING | Build per §11 (English content OK to ship) |
| Accessibility tooling (axe-core in CI) | ❌ MISSING | Wire |
| Rate limiting per route | ❌ MISSING | Build |
| Idempotency-Key middleware | ❌ MISSING | Build per §9.1 (24h window) |
| OpenAPI 3.1 spec | ❌ MISSING | Build per §3.1.MVP.8 |
| Secret management (KMS) | 🔧 REFACTOR | Move from env files |
| Dependency scanning (Dependabot) | ❌ MISSING | Configure |
| TLS + HSTS | ✅ KEEP | Next.js defaults sufficient |

---

## 5. Database migration plan (high-level)

Order matters. Migrations must run in this order to satisfy FK constraints.

### 5.1 Migration sequence

| # | Migration | Adds |
|---|---|---|
| M1 | `tenant_setup` | `Tenant` table; tenant_id FK column on existing `User`, `ContributorProfile`, `AcceptanceDecision`, `PaymentOrder` |
| M2 | `rbac_seed` | `Role`, `Permission`, `UserRole`, `RolePermission`; seed taxonomy from doc 05 §3.1 |
| M3 | `session_persistence` | `Session` table for revocation; remove pure-JWT |
| M4 | `audit_log` | `AuditEvent` (append-only); HMAC signing column; daily-snapshot tracking |
| M5 | `skill_taxonomy` | `Skill`, `SkillAlias`, `SkillAdjacency`, `SkillMergeLog`; seed ≥200 starter skills |
| M6 | `mentor_pool` | `Mentor`, `MentorPool`, `MentorCompetency` |
| M7 | `rubric_templates` | `RubricTemplate`, `RubricCriterion`, `RubricTemplateVersion`, `FeedbackTemplate` |
| M8 | `sow_lifecycle` | `Sow`, `SowVersion`, `Approval`, `SowTemplate` |
| M9 | `decomposition` | `DecompositionPlan`, `Milestone`, `Task`, `TaskDependency`, `TaskSkillTag` |
| M10 | `submission_review` | `Submission`, `SubmissionEvidence`, `ReviewAssignment`, `ReviewDecision`, `AiOverrideDelta` |
| M11 | `rate_cards_billing` | `RateCard`, `RateCardVersion`, `RateCardRow`, `Invoice`, `InvoiceLineItem` |
| M12 | `payouts` | `Payout`, `PayoutEligibility`, `PaymentMethod` (contributor side) |
| M13 | `governance_kyc` | `GovernanceCase`, `KycCase`, `SafetyReport` |
| M14 | `ai_agents` | `Agent`, `PromptTemplate`, `PromptVersion`, `AgentInvocation` |
| M15 | `payment_rails_integrations` | `PaymentRail`, `Integration`, `Webhook`, `WebhookDelivery`, `HrisSyncLog` |
| M16 | `notifications` | `Notification`, `NotificationPreference`, `EmailTemplate` (move from Zustand), `EmailDelivery` |
| M17 | `mentorship` | `MentorshipSession`, `CoachingNote`, `PeerMentorAssignment` |
| M18 | `partnerships` | `University`, `WomenWorkforcePartner`, `SupervisorLink` |
| M19 | `rls_policies` | RLS policies on every tenant-scoped table |
| M20 | `universal_columns` | Add `created_at/updated_at/deleted_at/created_by/updated_by` where missing |

### 5.2 RLS strategy

For each tenant-scoped table:
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON <table>
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```
App sets `SET LOCAL app.tenant_id = '<uuid>'` at the start of every request inside a transaction.

### 5.3 Mock-to-real migration

| Existing mock | Target | Approach |
|---|---|---|
| `contributor-workspace.ts` tasks | `Task` + `Submission` tables | Seed at first tenant creation |
| `contributor-revision-queue.ts` | `ReviewDecision` + `Submission` | Seed |
| `contributor-completed-work.ts` | Same | Seed |
| `enterprise-sow.ts`, `enterprise-sow-detail.ts` | `Sow` + `SowVersion` | Seed |
| `enterprise-projects.ts` | `Project` + `Milestone` + `Task` | Seed |
| `enterprise-reviewer.ts` | `ReviewAssignment` | Seed |
| `enterprise-billing.ts` | `Invoice` + `Payout` | Seed |
| `sow-wizard-data.ts` | `SowTemplate` | Seed |
| Email templates (Zustand) | `EmailTemplate` | Migrate; Zustand becomes a UI editor on top |

All Zustand stores using `persist` to localStorage become **client-side cache layers** that read from Postgres on mount and write through to API endpoints.

---

## 6. Files to delete (consolidated, ~106 surfaces)

### 6.1 Contributor (12)
- `/contributor/community/*`, `/messages/*`, `/learning/*`, `/progress/*`, `/ai/guidance`, `/ai/readiness`
- `/lib/stores/contributor-phone-store.ts`
- Mock data: `contributor-progress.ts`

### 6.2 Enterprise (~7 surfaces, ~40 files including /delivery-tracking files relocated)
- `/enterprise/team/*` (4 files)
- `/enterprise/compliance/podl`, `/esg`, `/evidence`, `/documents` (Phase 2)
- `/enterprise/analytics/reports`, `/analytics/governance`
- `/enterprise/billing/pricing` (redirect)
- `/enterprise/delivery-tracking/*` — relocate contents to `/enterprise/projects/[id]/exceptions` then delete

### 6.3 Mentor (~80 files across 9 route trees)
- `/mentor/ai/*`
- `/mentor/analytics/*`
- `/mentor/contributors/*`
- `/mentor/governance/*`
- `/mentor/reviews/escalated`, `/governance-holds`, `/in-progress`, `/rework`
- `/mentor/sla-monitor/*`

### 6.4 Sealed routes (added to middleware as 404 / hide from nav)
All routes listed in the per-portal §3.3 of each spec. The deletes above remove the code; sealing handles routes that exist but should be invisible.

---

## 7. New files to create (consolidated, ~120 surfaces)

Detailed inventory in each portal's §5. Categorized counts:

| Category | Count |
|---|---|
| Contributor — auth/onboarding/submission/payout/settings/support polish | 11 |
| Enterprise — rate cards/payouts/integrations/policies/compliance/analytics/audit/SOW templates/version history/project tabs | 22 |
| Mentor — diff/audit/decision detail/personal metrics | 4 |
| Platform admin — tenants/mentors/skill taxonomy/rubric templates/governance/KYC/AI/payment rails/system health/partnerships | 16 surfaces, ~60–80 files |
| Cross-functional — middleware/audit service/AI orchestrator/notifications/integrations/observability/i18n/accessibility | infrastructure |

---

## 8. Build sequence recommendation (Stage 2)

Given the dependency map, the right sequence for Stage 2 is:

### Week 1 — Identity + Audit + Schema foundation
1. Prisma schema migrations M1–M4 (tenant + RBAC + session + audit)
2. `src/middleware.ts` skeleton (auth + portal scope + tenant scope)
3. Audit service skeleton (`auditEmit()` + HMAC signing + table)
4. Role taxonomy seed

### Week 2 — Tenant isolation + Session + SSO scaffolding
1. RLS policies on tables from M1–M4
2. Session persistence + revocation list
3. SAML provider stub (test connection with one IdP)
4. OIDC provider stub (Glimmora Google Workspace)
5. Middleware enforces tenant scope

### Week 3 — Schema expansion + Notifications + Skill taxonomy
1. Migrations M5–M10 (skills + mentor pool + rubric + SOW + decomposition + submission)
2. Notification service skeleton (in-app table + email dispatcher wired)
3. Skill taxonomy seed (≥200 skills)
4. RLS on new tables

### Week 4 — AI orchestrator + File scan + Remaining schema
1. AI orchestrator with shared envelope (`AgentRequest/Response`)
2. 4 agent stubs (return confidence-scored mock output for now)
3. ClamAV sidecar + file scan service
4. Migrations M11–M18 (billing + payouts + governance + KYC + AI + integrations + mentorship + partnerships)
5. RLS on new tables

### 1A Exit gate (end of Week 4)
- Every portal renders with real RBAC + tenant scope
- Audit fires on a test mutation; signature verifies
- AI agent returns a mock confidence-scored response
- Notification dispatches in-app + email for a test event
- ClamAV catches an EICAR test virus

After 1A foundations are solid, weeks 5–13 follow doc 06 §5 (Origination → Delivery → Hardening) with portal-by-portal wiring.

---

## 9. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Schema migration churn — 20 migrations is a lot for 4 weeks | High | Medium | Migrations are append-only; each migration is small and reversible; do them daily not weekly |
| Zustand-to-Postgres rewiring breaks features mid-flight | High | Medium | Dual-write strategy during transition; flip read source last; one store at a time |
| SSO + SAML configuration takes longer than Week 3 | Medium | High | Start vendor sandbox conversations in Week 1; have one tenant ready to test by Week 3 |
| AI orchestrator latency unacceptable | Medium | Medium | Stub returns mock until Week 4; latency budget set early; cache layer for repeated requests |
| File scan provider for plagiarism not selected | Medium | Low | Provider selected in Stage 0; virus-only as Phase 1 fallback if plagiarism slips |
| RLS policies cause Prisma query bugs (forgetting `SET LOCAL`) | Medium | High | Wrap every request handler with a transaction helper that sets tenant_id; test cross-tenant block in pen test |
| Existing UI breaks during deletion (orphan imports) | Medium | Low | Delete in dependency order; CI catches broken imports |
| Audit signature key rotation complexity | Low | Medium | Use cloud KMS from Week 1; rotation is admin-action with two-person review |
| Per-portal teams blocked by foundations slipping | Medium | High | WS-1 + WS-2 are the critical path; protect their resources first |
| Pilot customer not ready when 1C ends | Medium | High | Customer commitment locked pre-Phase-1; backup identified |

---

## 10. Recommended Stage 2 entry point

**Start with M1 (`tenant_setup`) and the `Tenant` Prisma model.**

Why: it's the foundation that every other migration depends on. Once `Tenant` exists, `User` can have `tenantId`, sessions can be tenant-scoped, audit events can be tenant-scoped, and middleware can enforce tenant boundaries.

This is the smallest atomic deliverable that unlocks the rest. Estimated time: half a session to write + review.

The conversation pattern from here forward (per locked decision: "one deliverable at a time, review each"):

1. I propose the migration / file / change
2. I write it
3. You review in browser/DB
4. Mark done in tasks; move to the next

---

## End of codebase delta report

Next: Stage 2 build begins with the `Tenant` table migration.
