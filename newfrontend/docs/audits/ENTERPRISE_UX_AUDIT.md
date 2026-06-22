# GlimmoraTeam — Enterprise UX & Operational Design Audit

> A senior enterprise designer's evaluation of GlimmoraTeam as an operational product. Where the prior documents explained *what the product is* and *how it behaves as a system*, this one judges *how well it works for the humans who run it.* Findings cite the live codebase state and SOW V2.0 scope. Status legend: **Strong**, **Adequate**, **Weak**, **Critical**.

---

## 1. Information Architecture Audit

### 1.1 Sidebar structure — overall verdict: **Weak**

The product has five sidebars (Enterprise, Contributor, Mentor, Reviewer, Admin, Analytics) defined in `src/lib/config/navigation.ts`. They are grouped sensibly within each role, but the *cross-role taxonomy is inconsistent* — the same concept (review, profile, settings) is treated differently per sidebar, which breaks muscle memory for users who hold multiple roles.

**Specific findings.**

| Issue | Where | Severity |
|---|---|---|
| Sidebar items point to nonexistent pages (Workforce dashboard, Operational dashboard, Report Builder, System Health, Organisations) | Multiple sidebars | **Critical** — every dead link is a trust failure |
| Reviewer hub duplicated across `/mentor/*` and `/enterprise/reviewer/*` | Mentor + Enterprise | **Critical** — two surfaces, divergent implementations |
| Enterprise sidebar mixes process verbs (SOW, Planning) with object nouns (Projects, Billing) | Enterprise | Weak — inconsistent mental model |
| Settings appears as a leaf node in some sidebars, a parent with children in others | All | Weak |
| Notifications surface as a top-bar bell *and* a sidebar entry | Enterprise + Contributor | Weak — two surfaces for the same content |
| Admin sidebar contains "Platform" and "System" sections that overlap conceptually | Admin | Weak |
| No global search across roles; ⌘K only on SOW list | Enterprise | Weak |

### 1.2 Navigation grouping — verdict: **Adequate**

Enterprise sidebar grouping (Dashboard · SOW · Planning · Project Monitoring · Review & Acceptance · Billing · Organization) reflects the SOW lifecycle reasonably well. Contributor sidebar (Work · Growth · Connect · Profile) is intuitive.

**But:** Mentor sidebar treats Reviews and Actions as separate clusters when they're operationally the same job. Reviewer sub-portal under Enterprise treats Active Work / Records / Performance as three buckets — better than mentor's grouping but still split.

### 1.3 Role separation — verdict: **Weak**

Roles aren't enforced at the route level — there's no `src/middleware.ts`. `useRoleGuard` is client-side only, which means a user with the wrong role can hit a screen they shouldn't see and only be redirected after render. This is a security gap *and* a UX confusion (flash of unauthorized content).

### 1.4 Discoverability — verdict: **Weak**

- Many critical actions are buried in kebab menus (project hold/resume/escalate, SOW delete, decomposition withdraw).
- The "AI assistant" chat widget floats persistently but its capabilities aren't surfaced.
- Compliance, audit, and ESG features are technically present but feel hidden — no dashboard tile or onboarding moment introduces them.
- Approval pipeline is reachable only by drilling into a specific SOW; there's no portfolio-wide pipeline view.

### 1.5 Scalability of navigation — verdict: **Weak**

Enterprise sidebar is already ~10 top-level items. As the product matures, every new module will push toward 15–20. Today's flat-ish structure won't scale. Need:

- Collapsible groupings with sticky headers.
- Pinning / favoriting of frequently used items.
- Role-aware filtering ("hide what I don't use").
- Persistent badge counts for actionable items.

### 1.6 Duplicated workflows — verdict: **Critical**

Six known duplications. These are the most visible IA failures in the product.

1. `/mentor/*` vs `/enterprise/reviewer/*` — same role, two implementations.
2. `/enterprise/sow/approval` vs `/enterprise/sow/[sowId]/approve` — duplicate approval routes.
3. `/enterprise/decomposition/approval` vs `/enterprise/decomposition/[planId]/approve` — same pattern.
4. `/enterprise/review/*` (deliverable review) vs `/enterprise/reviewer/*` (reviewer hub) — sound-alike, distinct concepts. Rename one.
5. `/enterprise/sow/upload/*` vs `/enterprise/sow/generate/*` vs `/enterprise/sow/intake` vs `/enterprise/sow/blueprint` — four SOW-creation surfaces; should be one canonical flow with two entry modes.
6. SOW versions and archive — two read-only list pages with overlapping purpose.

### 1.7 Menu hierarchy problems — verdict: **Weak**

- Two-level depth is used inconsistently (some sidebars have collapsible groups, others have flat items).
- Sub-page navigation inside enterprise routes (e.g., `/enterprise/sow/[sowId]/approve` vs `/contract` vs `/compare`) is implicit — no in-page tab nav makes it discoverable.
- Breadcrumbs are missing on deep flows.

---

## 2. Workflow UX Audit

### 2.1 SOW Lifecycle — verdict: **Adequate**

**User goal.** Enterprise admin wants to go from "I have a contract" to "approved, decomposed, ready to staff" with confidence and audit.

| Aspect | Finding |
|---|---|
| Friction points | Multi-step wizards (7-step upload, multi-step generate) rely on `sessionStorage`. Refresh = lose progress. No autosave indicator. |
| Bottlenecks | 5-stage approval is sequential — no parallel stages even for independent stages (Legal + Security could run in parallel). |
| Confusion risks | Multiple SOW creation entry points (intake / upload / generate / blueprint) — user doesn't know which to pick. |
| Missing states | No "draft saved" confirmation; no resumption affordance after browser close; no "where in pipeline" badge on SOW list. |
| Operational risks | If guardrails fail mid-generation, the user loses context about *which layer* failed and *what to fix*. |

### 2.2 Decomposition — verdict: **Weak**

**User goal.** Convert an approved SOW into a Work Breakdown Structure with tasks, milestones, dependencies, and skills.

| Aspect | Finding |
|---|---|
| Friction points | Plan edit page is UI-complete but mutations are patchy — saves silently fail. |
| Bottlenecks | AI decomposition suggestion is take-it-or-leave-it; no partial accept. |
| Confusion risks | Two routes — `/decomposition/approval` and `/decomposition/[planId]/approve` — overlap. |
| Missing states | No "AI is suggesting" loading state with meaningful animation. No diff view between AI suggestion and edited plan. No "validate plan against budget" check. |
| Operational risks | A bad decomposition cascades — wrong skills tagged → wrong matches → wrong contributors. No quality gate beyond plan approval. |

### 2.3 Assignment — verdict: **Adequate**

**User goal.** Enterprise admin wants the right contributor on each task, fast.

| Aspect | Finding |
|---|---|
| Friction points | "Why matched" explainability is promised but minimally surfaced. |
| Bottlenecks | Contributor can decline; auto-reassignment exists but isn't visually traced. |
| Confusion risks | Acceptance flow on contributor side and confirmation flow on enterprise side aren't visually linked. |
| Missing states | No "awaiting acceptance" timer visible to enterprise. No reassignment history. |
| Operational risks | If a contributor goes dark mid-assignment, the SLA timer continues silently — no escalation surface yet. |

### 2.4 Workroom — verdict: **Adequate**

**User goal.** Contributor wants to understand the task, ask questions, upload work, and submit.

| Aspect | Finding |
|---|---|
| Friction points | Workroom is functional but lacks structured evidence checklist enforcement. |
| Bottlenecks | Q&A is in-app only; no email fallback for offline contributors. |
| Confusion risks | "Save draft" vs "Submit" distinction is present but visually weak. |
| Missing states | No "your reviewer is currently reviewing" status while waiting. No estimated review time. |
| Operational risks | If upload fails partway, the contributor doesn't always know — silent failures. |

### 2.5 Submission — verdict: **Weak**

**User goal.** Contributor commits a deliverable; reviewer is notified; review starts.

| Aspect | Finding |
|---|---|
| Friction points | Version history is captured but visually buried. |
| Bottlenecks | No "submission preview" before final submit — contributor can't sanity-check. |
| Confusion risks | If a rework loop has been through 3 cycles, the contributor sees a stack of feedback with no synthesis. |
| Missing states | No "this submission supersedes V2" diff view between submission versions. |
| Operational risks | A contributor can technically re-submit the same file; no diff check; reviewer must catch it. |

### 2.6 Review — verdict: **Critical**

**User goal.** Reviewer wants to make a fast, fair, well-documented decision.

| Aspect | Finding |
|---|---|
| Friction points | **All mentor decisions are toast-only — they don't persist.** Critical failure. |
| Bottlenecks | No keyboard shortcuts on the queue or in the rubric. |
| Confusion risks | Two reviewer surfaces (`/mentor/*` and `/enterprise/reviewer/*`) with different implementations. |
| Missing states | No "another reviewer is also viewing this" indicator. No SLA-breach warning until after breach. |
| Operational risks | Toast-only persistence means real reviewer decisions are lost. This is the highest-impact UX failure in the product. |

### 2.7 Acceptance — verdict: **Weak**

**User goal.** Enterprise admin gives final acceptance on a deliverable; payment is unblocked.

| Aspect | Finding |
|---|---|
| Friction points | "Mark UAT Complete" is toast-only — doesn't update milestone status. |
| Bottlenecks | Acceptance requires drilling into the project + milestone — no portfolio-level "needs my acceptance" queue. |
| Confusion risks | Deliverable review (`/enterprise/review/*`) and milestone acceptance (project detail page) are visually disconnected even though they're sequential. |
| Missing states | No "all acceptance criteria met" checklist confirmation. No evidence pack preview before acceptance. |
| Operational risks | Acceptance is the moment money commits — toast-only persistence here is a financial risk. |

### 2.8 Payout — verdict: **Critical**

**User goal.** Contributor gets paid promptly and transparently after acceptance.

| Aspect | Finding |
|---|---|
| Friction points | Razorpay order creates successfully but **no server-side verification webhook** — payment status can desync. |
| Bottlenecks | Manual reconciliation if a payment partially completes. |
| Confusion risks | Contributor sees "earnings" before "payout" — the distinction needs clearer UI. |
| Missing states | No "payment in transit" intermediate state visible to contributor. No retry affordance on failed payouts. |
| Operational risks | Double-release risk (no idempotency check visible). No appeal path for payment disputes. |

### 2.9 Governance — verdict: **Weak**

**User goal.** Enterprise admin can prove "we did this right" to auditors, regulators, and finance.

| Aspect | Finding |
|---|---|
| Friction points | Audit log is mock-only. Compliance pages (documents, ESG, evidence, PODL) are visual stubs. |
| Bottlenecks | No "export evidence pack" one-click from project closeout. |
| Confusion risks | Classification chips and risk scores aren't surfaced consistently across the SOW lifecycle. |
| Missing states | No "audit recorded" confirmation after governance-relevant actions. |
| Operational risks | If a regulator asks for proof tomorrow, the product can't produce a clean pack today. |

---

## 3. Cognitive Load Analysis

### 3.1 Overloaded dashboards — verdict: **Weak**

The enterprise dashboard (`/enterprise/dashboard`) tries to show portfolio counters, attention panel, financial snapshot, and activity feed — all on first paint, all mocked, all undifferentiated. The user can't tell *what needs attention now* vs *what's just status*.

**Fix.** Reorganize against the user's actual decision hierarchy:

1. **Needs my action now** — top of page, filtered list of approvals waiting, exceptions escalated, milestones to accept.
2. **At risk** — projects with SLA slipping, budget overrun warnings, contributor dropouts.
3. **In flight** — active projects, summarized.
4. **Recently completed** — closeout, credentials issued, invoices paid.

### 3.2 Excessive KPIs — verdict: **Weak**

The analytics overview, enterprise dashboard, and reviewer metrics all suffer from "tile soup" — too many KPIs with no hierarchy. Users can't tell which numbers matter.

**Fix.** Per dashboard, declare *one primary KPI* (e.g., on-time milestone completion rate) and treat everything else as supporting metrics. Visually separate.

### 3.3 Table complexity — verdict: **Weak**

The SOW list, projects table, mentor queue, and reviewer queue all do reasonable filter/sort/search. But:

- Filter state is not always persisted to URL — refresh loses it.
- Bulk actions are missing on every table.
- Saved views ("My open SOWs", "High-risk projects") don't exist.
- Column customization (show/hide, reorder) isn't supported.

Enterprise users *expect* these from Jira/Linear/Asana. Their absence reads as immature.

### 3.4 Too many actions — verdict: **Adequate**

Per-row kebab menus on projects and SOWs are reasonably concise. The bigger problem is *unprioritized* actions — primary actions (Approve, Submit, Release Payment) don't visually dominate over secondary actions (Edit, Compare, Download).

**Fix.** Establish a 3-tier visual hierarchy: primary button (filled, brand color), secondary button (outlined), tertiary (text link or kebab item).

### 3.5 Notification overload — verdict: **Weak**

- Notifications come from Zustand (local) — no server delivery, no SSE/WebSocket.
- No categorization (action-required vs informational vs system).
- No batching ("you have 12 new task assignments" instead of 12 separate items).
- No quiet hours, digest mode, or preference granularity.
- Toasts are used for *terminal actions* (save success) — these should be replaced with confirmed-by-server states, with toasts reserved for transient feedback.

### 3.6 Poor prioritization — verdict: **Critical**

The clearest sign of weak prioritization: nothing on any dashboard tells the user *what to do next.* "Next action" is the most missing affordance in the product.

**Fix.** Every landing surface (dashboard per role) should answer the question "what do I do now?" with one or two clear cards. Linear's homepage is the model.

### 3.7 Unclear hierarchy — verdict: **Weak**

- Type scale is consistent but not expressive — h1, h2, h3 visually too close.
- Color palette uses status colors (red/yellow/green) for both alerts and labels, creating noise.
- Cards and panels often have similar weight, making it hard to tell what's primary.

**Fix.** Tighten type scale; reserve status colors for status only; introduce a "primary content / supporting content" visual distinction.

---

## 4. Role-Based Experience Audit

### 4.1 Enterprise Admin — verdict: **Adequate, with sharp edges**

**Strengths.**
- SOW list is mature: search, filter, sort, pagination, kebab actions all work.
- Projects portfolio supports card + table views with multi-select filter.
- Real API integration on SOW, decomposition, projects, billing (mostly).
- Approval pipeline visualization is clear within a single SOW.

**Weaknesses.**
- Dashboard is mock-only, fails the "what to do now" test.
- Exceptions screen is entirely toast — every action button fakes success.
- Settings page mixes Company / Team / Notifications / Security tabs, several of which don't persist.
- Onboarding wizard is broken (root page returns null).
- PDF/CSV exports often toast or fail.

**Mental load.** The portfolio view is dense but legible; the approval pipeline is the cognitive peak — too much per screen.

**Optimization opportunities.**
- Portfolio-wide approval queue (cross-SOW pipeline view).
- Acceptance inbox (deliverables awaiting your acceptance, across projects).
- Real-time budget tracker on dashboard.

### 4.2 Contributor — verdict: **Strong**

**Strengths.**
- Dashboard has real KPIs (earnings, active tasks, credentials) from real APIs.
- Task list is fully featured: search, filter, sort, pagination, real backend.
- Workroom flow (accept → submit → resubmit) is wired end-to-end.
- Profile, digital twin, evidence, skills, credentials all integrate with real APIs.
- Support tickets, grievances, safety reports work.

**Weaknesses.**
- No unsaved-changes guard on profile edit — data loss risk.
- Credentials list shows cards but detail page is thin.
- Community page is mostly visual.
- Messaging UI partial.
- Onboarding `/verify` step has non-functional Continue button in some branches.

**Mental load.** Lower than enterprise — the contributor surface is correctly leaner.

**Optimization opportunities.**
- Earnings projector ("if you accept all open tasks, you'd earn ~X by Y").
- Credential moment — celebrate issuance.
- Skill-gap nudges integrated into task discovery.

### 4.3 Mentor / Reviewer — verdict: **Critical**

**Strengths.**
- Queue UI is reasonably structured.
- Rubric form exists.
- Mentor history is read-only but informative.

**Weaknesses.**
- **All mentor decisions are toast-only** — the entire mentor surface is decorative.
- Two overlapping surfaces (`/mentor/*` and `/enterprise/reviewer/*`).
- No keyboard navigation in the queue.
- Profile edit, settings, escalation resolve — all setTimeout mocks.
- No "currently reviewing" indicator to prevent two reviewers grabbing the same item.

**Mental load.** Reviewers work under SLA pressure but the UI doesn't help them go fast — no keyboard shortcuts, no AI rubric pre-fill, no inline evidence.

**Optimization opportunities.**
- *Highest-leverage redesign target in the entire product.* Converge the two surfaces; persist decisions; add keyboard shortcuts; inline evidence; AI rubric pre-fill.

### 4.4 Platform Admin / SuperAdmin — verdict: **Weak**

**Strengths.**
- Admin SOW oversight has real API integration.
- Pricing config (`/admin/settings`) persists to real API.
- Email template editor renders correctly.

**Weaknesses.**
- Dashboard is mock.
- Roles & Permissions page is a visual stub.
- Audit log is mock.
- Email templates persist to *localStorage only*, not server.
- No real Users/Organisations management screen even though sidebar links exist.

**Mental load.** Low — but mostly because there's not much real functionality yet.

**Optimization opportunities.**
- Make this the *operations control tower* — incident dashboard, audit overview, pricing health, reviewer pool capacity, fraud flags, system health.
- Currently the least-loved portal; biggest design opportunity per square inch.

### 4.5 Finance / Operations — verdict: **Weak (not yet a real surface)**

Finance isn't a distinct role yet; finance concerns live inside the Enterprise admin's Billing module. As scale grows, finance will need its own surface.

**Current gaps.**
- No reconciliation view (invoices vs payouts vs Razorpay receipts).
- No exception report for failed payments.
- No revenue dashboard for platform admin.
- No subscription-tier management UI.
- No tax / compliance reporting.

**Optimization opportunities.**
- Carve out a Finance sub-role under Enterprise admin with its own dashboard.
- Build a Platform Revenue console for Glimmora-side finance.

---

## 5. State Management Audit

### 5.1 Loading states — verdict: **Adequate**

Skeleton loaders exist on most pages and are correctly tuned to page structure (per CLAUDE.md convention). Missing on: `/admin/dashboard`, `/analytics/overview`, `/enterprise/compliance/*`, `/enterprise/analytics/*`, `/enterprise/audit`.

Tables use spinners (per convention) but some tables lack any loading state — they render empty rows during fetch.

### 5.2 Empty states — verdict: **Weak**

| Surface | Empty state quality |
|---|---|
| First-time SOW list | Adequate |
| Mentor mentorship (no sessions) | Present |
| Reviewer review-history, qa-inbox, task-monitor | **Missing** |
| Contributor community, messages | Partial |
| Compliance pages | **Missing** |
| Enterprise exceptions | Partial |
| Analytics dashboards | **Missing** |
| Notifications | Adequate |

**Pattern recommendation.** Every empty state should answer three questions: *Why is this empty? What can I do? What will happen?* Today most empty states answer none.

### 5.3 Error states — verdict: **Critical**

- Auth pages surface errors *only* via inline `state.error` — no toasts. Network failures look like silent rejections.
- SOW detail has no error boundary if `useSOWDetail()` fails.
- TanStack Query errors surface as banners in some places (projects list) and as fallback-to-mock in others — inconsistent.
- No retry affordances on most failure states.

**Pattern recommendation.** Every API call has three outcomes — success, expected error (validation), unexpected error (network/500). Each needs a distinct UI treatment, and unexpected errors must always offer retry + support escalation.

### 5.4 Rejected states — verdict: **Weak**

- SOW stage rejection routes back to draft but the *previously approved stages* aren't visually marked as "still approved."
- Submission rejection routes back to contributor but the rubric scores aren't always preserved in the UI.
- Decomposition plan rejection has no UI distinction from withdrawal.

### 5.5 Escalated states — verdict: **Weak**

- Escalations exist in the data model but escalation status isn't surfaced on the parent record (project, contributor, SOW).
- Mentor escalation table is read-only with toast actions.
- No "this item is escalated" badge on the queue.

### 5.6 Approval states — verdict: **Adequate**

- 5-stage approval is visually represented per SOW.
- Stage colors and completion ticks are clear.
- But: portfolio-level "stage X has N waiting" isn't surfaced anywhere.

### 5.7 Partially completed states — verdict: **Critical**

This is the single weakest state category in the product.

- SOW upload wizard uses sessionStorage — refresh loses progress.
- Onboarding flow uses Zustand — partial server persistence.
- Decomposition plan edits sometimes silently don't save.
- Contributor profile edit has no unsaved-changes guard.

**Pattern recommendation.** Every multi-step flow needs server-backed drafts, autosave with visible "Saved 3s ago" indicator, and explicit "resume where you left off" affordances when the user returns.

---

## 6. Governance & Trust UX Audit

### 6.1 Audit visibility — verdict: **Weak**

Audit logs exist in the data model but the audit page (`/enterprise/audit`) is mock. Audit affordances ("view audit") are absent from most governance-relevant screens. The user cannot answer "what happened to this SOW yesterday?" from the UI.

**Fix.** Every entity with audit history (SOW, project, submission, review) needs a "View audit" panel — collapsible, filterable, exportable. Lives inline, not as a separate page.

### 6.2 Evidence visibility — verdict: **Weak**

Evidence (uploads, deliverables, supporting docs) is captured but not packaged. The "evidence pack" — the artifact that proves a project ran cleanly — doesn't exist as a UI export.

**Fix.** From project closeout: one-click "Generate Evidence Pack" → PDF + ZIP with task specs, submissions, reviews, acceptance, payments, audit events.

### 6.3 Approval confidence — verdict: **Adequate**

The 5-stage approval pipeline does build confidence — sequential stages, sign-offs visible, comments threaded. But:

- No confidence indicator on the *AI-generated* portions of an SOW.
- No "this stage was approved by X on Y" hover detail.
- Rejection reasons aren't always structured — sometimes free-text only.

### 6.4 Fraud / risk visibility — verdict: **Weak**

- Risk score is computed but inconsistently surfaced.
- No "high-risk SOWs" filter on the list.
- No contributor-level fraud signals visible (low quality patterns, suspicious submission timing).
- No reviewer-level pattern detection (always approves, never rejects).

**Fix.** Risk should be a *chip* visible everywhere a risky entity appears, with one-click drill-down to "what makes this risky."

### 6.5 Traceability — verdict: **Weak**

- A submission's lineage (which task, which contributor, which reviewer, which acceptance) is computable but not visualized as a single trace.
- No "show me everything connected to this credential" view.
- The talent graph exists in the backend but isn't visualized in the UI.

### 6.6 Compliance clarity — verdict: **Critical**

- Compliance pages (documents, ESG, evidence, PODL) are visual stubs.
- Data classification chips don't appear on most screens.
- Jurisdiction screening happens at intake but isn't surfaced after — no "this SOW is restricted to EU contributors" banner on subsequent screens.

**Fix.** Build a *classification badge component* and apply it ruthlessly across every screen that handles SOW data.

### 6.7 Override workflows — verdict: **Weak**

When a human overrides an AI recommendation, the audit captures it — but the UI doesn't make the override *easy* or *justifiable*. There's no "I'm overriding because…" structured input. Overrides become free-text comments.

**Fix.** Structured override modal: select reason from list, optional note, automatic audit entry, optional escalation flag.

---

## 7. AI Explainability UX Audit

The most important UX category for this product's differentiation, and currently the most underdeveloped.

### 7.1 Explainable matching — verdict: **Weak**

The matching engine returns ranked contributors. The "why matched" fields exist in the API but are *minimally* surfaced in UI.

**Current state.** A simple list of contributors with scores.

**What's needed.**
- Per-contributor "why matched" expansion: skill match %, availability match, reliability score, cost fit.
- Comparative view: "Contributor A is stronger on X, Contributor B is stronger on Y."
- Override path: enterprise admin can pick a non-top-ranked contributor with a captured reason.

### 7.2 Explainable pricing — verdict: **Weak**

Rate-card-driven pricing is deterministic, but the UI presents prices as bare numbers.

**What's needed.**
- "How is this priced?" hover on every price: rate card × effort estimate × geography × urgency.
- Per-task pricing breakdown visible before assignment.
- Total project cost projection with assumptions visible.

### 7.3 Explainable reviews — verdict: **Weak**

The Review Assistant agent suggests rubric scores; the human adjusts. But:

- AI suggestions are presented as if they're the reviewer's own — no clear visual distinction.
- No "why did the AI suggest this score" detail.
- No record of "AI suggested 3, reviewer set to 5" delta.

**What's needed.**
- AI suggestion badge on each rubric criterion.
- Hover: "AI suggested 3 because submission lacks evidence X."
- Audit: capture AI suggestion + human override for later analysis.

### 7.4 Explainable AI decisions broadly — verdict: **Weak**

Across SOW generation, decomposition, matching, and review, AI outputs are presented as suggestions but the *reasoning* is opaque.

**Pattern recommendation.** Every AI output needs three affordances:

1. **Source** — what data drove this? (hover or expand)
2. **Confidence** — how sure is the model? (visible inline)
3. **Override** — one-click reject/edit (always available)

### 7.5 Trust and override systems — verdict: **Adequate (by intent), Weak (by execution)**

The architecture supports human-in-the-loop everywhere money or credentials move. But:

- Confidence scores aren't visible on most surfaces.
- Override paths exist but aren't structured (free-text comments).
- AI vs human authorship isn't visually distinguished in many surfaces.

**Highest-leverage fix.** A reusable "AI Suggestion" component: badge, confidence chip, source affordance, edit and reject actions. Apply across SOW generation, decomposition, matching, review.

---

## 8. Enterprise Operations UX Audit

### 8.1 Operational monitoring — verdict: **Critical**

There is no system health dashboard, no incident view, no service status surface. The Platform Admin portal — which should be the operations control tower — is mock.

**What's needed (in order of leverage).**

1. **Incident dashboard** — active incidents, SLA breaches, escalations.
2. **Reviewer pool health** — queue depth, average decision time, throughput, SLA hit rate.
3. **AI agent health** — confidence distributions, override rates, error rates.
4. **Payment health** — success/failure rates, pending reconciliation.
5. **System status** — service uptime, error rates, latency.

### 8.2 Scalability of dashboards — verdict: **Weak**

Today's dashboards show small numbers. At scale (1M+ contributors, 100M+ tasks), the same UI patterns won't survive:

- KPI tiles need filtering / time-range controls.
- Lists need virtualization.
- Charts need drilldown + zoom.
- Tables need server-side pagination + saved views.

### 8.3 PMO visibility — verdict: **Adequate**

The Enterprise admin gets reasonable portfolio visibility via the projects list and per-project detail. But:

- No cross-project Gantt or timeline view.
- No resource utilization view ("contributor X is allocated to 4 tasks").
- No predictive risk view ("project Y is likely to slip").

### 8.4 Finance oversight — verdict: **Weak**

Billing module shows invoice list and budget but:

- No reconciliation view.
- No spend-vs-budget burnup chart.
- No vendor (contributor) payment status overview.
- No tax/compliance summary.

### 8.5 Bottleneck detection — verdict: **Weak**

The product doesn't surface bottlenecks proactively. A bottleneck (review queue full, contributor pool thin, approver out of office) only becomes visible when SLAs already broke.

**Fix.** Build a leading-indicator dashboard for the Platform Admin: queue depth trend, approval cycle time trend, contributor acceptance rate trend. Alert before breach, not after.

### 8.6 Workflow monitoring — verdict: **Weak**

Each workflow (SOW → tasks → submissions → reviews) is monitored only via its own page. There's no cross-workflow trace — "this SOW is stuck because reviewer X has 12 items in queue."

### 8.7 Escalation management — verdict: **Critical**

Escalations exist as a concept (mentor escalation queue, project exceptions) but:

- Mentor escalations are toast-only.
- Project exceptions are toast-only.
- No SLA on escalation resolution.
- No escalation history per entity.

**Fix.** A unified Escalations console for Platform Admin: every active escalation, owner, age, SLA, resolution path.

---

## 9. UX Prioritization Matrix

### P0 — Critical operational risks (do first)

| # | Issue | Why P0 |
|---|---|---|
| 1 | Mentor decisions toast-only (no persistence) | Reviewer decisions are the load-bearing event in the product; today they evaporate |
| 2 | Razorpay payments without server verification | Money risk; double-release possible |
| 3 | No `src/middleware.ts` for route-level auth | Security gap; client-side guard is bypassable |
| 4 | Enterprise onboarding returns `null` | New customers cannot onboard |
| 5 | UAT acceptance toast-only | Milestone acceptance is the trigger for payment — losing it is a financial risk |
| 6 | Project exceptions all toast | Operational risk events have no persistence |
| 7 | Compliance pages mock-only | Cannot serve audit / regulator request |
| 8 | Auth errors silent (no toasts) | Users miss failures; support tickets multiply |
| 9 | Sidebar links to nonexistent pages | Trust failure on every dead click |
| 10 | Onboarding flow loses progress on refresh | Highest-leverage funnel; abandonment risk |

### P1 — Major UX improvements

| # | Improvement | Why P1 |
|---|---|---|
| 1 | Converge mentor + reviewer surfaces into Review Hub | Eliminates IA confusion, doubles design leverage |
| 2 | "What needs my action now" cards on every dashboard | Solves the "next action" gap across portals |
| 3 | Portfolio-wide approval queue | Cross-SOW pipeline visibility |
| 4 | Acceptance inbox for enterprise admin | Deliverables awaiting acceptance, queryable |
| 5 | Classification chips applied everywhere | Compliance visibility baseline |
| 6 | AI Suggestion component | Reusable explainability primitive |
| 7 | Server-backed drafts on multi-step flows | Solves onboarding + SOW wizard abandonment |
| 8 | Notification preferences + categories + digest | Solves notification overload |
| 9 | Settings security page wired to real APIs (already in client lib) | Quick win — APIs exist, only UI integration missing |
| 10 | Empty states across reviewer, compliance, analytics | Eliminates first-impression risk |

### P2 — Workflow enhancements

| # | Enhancement | Why P2 |
|---|---|---|
| 1 | Bulk actions on tables (SOW, projects, notifications) | Enterprise expectation |
| 2 | Saved filters / views per user | Enterprise expectation |
| 3 | Keyboard shortcuts in reviewer queue | Throughput |
| 4 | Cross-project Gantt + resource utilization view | PMO sophistication |
| 5 | Evidence pack export from project closeout | Audit value |
| 6 | Structured override modal for AI overrides | Audit + governance |
| 7 | Reconciliation view in billing | Finance value |
| 8 | Predictive risk dashboard | Leading indicator |
| 9 | "Why matched" expansion on contributor ranking | Trust + transparency |
| 10 | Diff view between submission versions in rework loop | Reviewer efficiency |

### P3 — Polish

| # | Polish | Why P3 |
|---|---|---|
| 1 | Consistent toast titles ("Saved!", "Settings Saved" — standardize) | Brand polish |
| 2 | ARIA labels on icon-only buttons | Accessibility baseline |
| 3 | Focus traps in all modals | Accessibility baseline |
| 4 | Type-scale tightening | Visual hierarchy |
| 5 | Reserve status colors for status only | Visual hierarchy |
| 6 | Sidebar badge counts on contributor + mentor | Parity with enterprise |
| 7 | Recovery-codes auto-download at MFA setup | Small UX win |
| 8 | "Recently viewed" panels on more list pages | Discoverability |
| 9 | Onboarding "Back" buttons consistent | Navigation reliability |
| 10 | Logout dropdown consistency across roles | Brand polish |

---

## 10. Product Design Recommendations

### 10.1 Enterprise UX improvements

1. **Reorganize the enterprise dashboard around the user's decision hierarchy** — "needs my action" first, "at risk" second, "in flight" third, "completed" fourth.
2. **Build a portfolio-level approval queue** — one screen that lists every SOW awaiting any approval stage, sortable by stage / SLA / risk.
3. **Build an acceptance inbox** — every deliverable awaiting your acceptance, across all your projects, with previews inline.
4. **Add saved views to every table** — "My open SOWs," "High-risk projects," "Awaiting acceptance," etc.
5. **Bulk actions everywhere a table makes them obvious** — bulk SOW delete, bulk notification mark-read, bulk approval comments.
6. **Cross-project Gantt + utilization view** — PMOs expect this; the data is there.

### 10.2 Workflow simplifications

1. **Consolidate SOW creation into one canonical flow** — `/sow/new` with a step-1 branch: AI-generate or upload. Remove `/sow/intake`, `/sow/blueprint`, `/sow/approval` as separate routes.
2. **Consolidate decomposition routes** — one `/decomposition/[planId]` with internal tabs for view/edit/approve.
3. **Consolidate review surfaces** — one `/review-hub` for the unified reviewer/mentor role.
4. **Server-backed drafts** — replace sessionStorage handoffs with backend draft endpoints.
5. **Autosave indicator** — "Saved 3s ago" on every long edit form.
6. **Resume affordance** — on landing, if the user has an in-progress draft, offer "Resume where you left off."

### 10.3 Governance improvements

1. **Classification chip component** — apply to every screen showing SOW-derived data.
2. **Risk chip with drill-down** — "Risk 67 (high) — click to see why."
3. **Inline "View audit" panel** — on every governance-relevant entity.
4. **Evidence pack export** — one-click from project closeout.
5. **Structured override modal** — captures reason, audit-logs automatically.
6. **Compliance documents — real upload + index** — the form currently has no handler; building it is foundational.
7. **Audit-as-narrative** — humanize audit entries ("Aarti approved Business stage at 10:42 IST") rather than raw JSON.

### 10.4 Dashboard redesign suggestions

For each portal:

**Enterprise dashboard.**
- Hero card: "X deliverables awaiting your acceptance" + "Y SOWs awaiting Business stage" + "Z projects at risk."
- Secondary: budget burnup, on-time milestone rate, active contributor count.
- Tertiary: recent activity feed.

**Contributor dashboard.**
- Hero card: "X tasks open to you, with average payout $Y."
- Secondary: earnings this month vs last, credentials earned, skill growth.
- Tertiary: learning recommendations, support tickets.

**Reviewer dashboard (post-convergence).**
- Hero card: "X items in your queue, Y close to SLA breach."
- Secondary: throughput today vs average, decision distribution, quality score.
- Tertiary: mentorship sessions due, escalations assigned.

**Platform admin dashboard.**
- Hero card: active incidents, escalations, payment failures.
- Secondary: queue health (reviewer pool), pipeline cycle times.
- Tertiary: revenue summary, system uptime.

### 10.5 AI trust improvements

1. **Reusable AI Suggestion component** — badge, confidence chip, source affordance, edit/reject actions. Apply across SOW gen, decomposition, matching, review.
2. **Visible confidence bands** — green / yellow / red on every AI output.
3. **Source-on-hover** — what data drove this recommendation, in plain language.
4. **Override capture** — structured "I'm overriding because…" modal.
5. **AI vs human authorship distinction** — visually mark AI-authored content (in SOW sections, in review feedback summaries).
6. **Hallucination prevention transparency** — show the user that the 8-layer pipeline ran, with a green-check summary.

### 10.6 Scalability recommendations

1. **Virtualized lists** for tables that will grow (contributors, audit, notifications).
2. **Server-side pagination + sorting + filtering** for all enterprise tables.
3. **Saved-view layer** that persists per user and per role.
4. **Notification fan-out via SSE/WebSocket** — replace Zustand-only notifications.
5. **Audit log archival tiering** — hot / warm / cold storage with appropriate query UX.
6. **Role-aware sidebar collapsing** — as modules grow, group them and let users pin frequents.
7. **Theming layer for tenants** — enterprise customers will want their brand on contributor-facing surfaces.
8. **Localization scaffolding** — global workforce demands multi-language UX; design strings as keys from day one.

---

## 11. Interview Preparation Insights

### 11.1 What product design skills this project demonstrates

A designer who has worked on GlimmoraTeam can credibly claim:

1. **Multi-role product design.** Designing for five distinct user roles within one product — proving the ability to build shared design systems that flex by user context.
2. **Enterprise workflow design.** SOW lifecycle, 5-stage approvals, decomposition, review queues — these are the bread-and-butter of enterprise SaaS design.
3. **Governance and compliance UX.** RBAC, audit trails, classification, risk scoring — surfacing these without overwhelming the user.
4. **AI-augmented UX.** Confidence scoring, explainability patterns, autonomy tiers, human-in-the-loop gates — defending AI design choices against both "too much" and "not enough" critiques.
5. **State machine thinking.** Every entity has lifecycle states; every screen represents a slice of that lifecycle.
6. **Operational design.** Building for ops teams (Platform Admin) — incident dashboards, escalation queues, system health.
7. **Two-sided marketplace UX.** Contributor-side and enterprise-side experiences with shared infrastructure but distinct mental models.
8. **Financial UX.** Pricing transparency, escrow logic, payouts, invoices — money UX done with restraint and trust.
9. **Long-running flow design.** SOWs, mentorship arcs, contributor lifecycles — flows that span days to years.
10. **IA at scale.** Five sidebars, 134 pages, six known duplications — navigating complex IA decisions.

### 11.2 How to present these UX decisions

**Frame each decision as a tradeoff.** Don't say "I designed X." Say "I had to choose between X and Y. I chose X because of Z. Here's what we learned."

Examples:

- *"The 5-stage approval pipeline could have been a simple linear progress bar. I chose a structured kanban-style view because users were getting stuck not knowing which stage they were waiting on. The tradeoff is more pixels; the gain is users always know what's blocking them."*
- *"AI-generated SOW content could have looked like the user's own writing. I chose to mark it visually with a confidence band and 'AI generated' badge. The tradeoff is more visual noise; the gain is trust — users don't accidentally ship hallucinated clauses."*
- *"The contributor onboarding could have been one long page. I chose multi-step with explicit save-and-resume. The tradeoff is more navigation; the gain is lower abandonment for the 8-step compliance and skill capture."*

### 11.3 How to explain operational thinking

The phrase to anchor on: **"I design for the operator, not just the user."**

> "Most consumer products optimize for the moment-to-moment user. Enterprise products have a second audience — the operator who runs the platform. In GlimmoraTeam, the operator is the Platform Admin. Their job is to keep the marketplace running: review queue healthy, payments flowing, incidents resolved. I designed dashboards that surface leading indicators, not lagging ones — queue-depth trends, approval cycle-time trends, contributor acceptance-rate trends. Alert before breach, not after."

When asked "what does operational design mean to you," answer:

1. **Surface state continuously.** Not just snapshots.
2. **Show throughput and bottlenecks.** Not just totals.
3. **Make escalation paths visible.** Stuck users don't open support tickets; they leave.
4. **Build for the 3am incident.** Can someone unfamiliar with the system diagnose and act?

### 11.4 How to explain enterprise complexity

The phrase: **"Enterprise products earn their density. They don't hide complexity — they make it navigable."**

> "Consumer products simplify by removing. Enterprise products simplify by *organizing*. The user is sophisticated; the business is complex; my job isn't to dumb it down — it's to make every action discoverable, every state legible, every decision auditable. The design test isn't 'is it minimal?' It's 'can the user accomplish what they need, in the time they have, without being misled?'"

Three principles to cite:

1. **Permissions are visible, not just enforced.** The user sees *why* they can't do something — that teaches the model.
2. **Audit is a feature, not a footnote.** Every governance-relevant action surfaces "view audit."
3. **State drives layout, not the other way around.** A screen's shape follows the entity's lifecycle state.

### 11.5 How to handle "this is a lot" — defending complexity

Interviewers will sometimes push back: "Isn't this too complex? Couldn't you simplify?"

Have a prepared answer:

> "The complexity is real. Statements of Work are real legal documents. Audit trails are required by enterprise customers. AI hallucination is a genuine risk. My job isn't to pretend the complexity doesn't exist — it's to make it tractable. The product simplifies by *layering* — the surface is simple, the depths are available when needed. A first-time enterprise admin sees 'New SOW.' An auditor sees the full 8-layer guardrails trace. Same product, different layers."

### 11.6 The interview-ready summary of UX strengths and gaps

**Strengths to claim.**
- Multi-role design system that flexes by context.
- State-machine-driven workflow design.
- Explainability patterns for AI surfaces.
- Governance-as-UX (audit, classification, risk surfacing).
- Long-running flow design (SOW pipeline, contributor lifecycle).

**Gaps to acknowledge (and own as next steps).**
- Mentor / reviewer surface convergence is the highest-leverage redesign.
- "Next action" affordance is the most missing pattern across dashboards.
- State-management discipline (drafts, autosave, resume) is uneven.
- Empty states are inconsistent.
- Operational console for Platform Admin is the least-loved portal.

**The line to land in any interview.**
> "GlimmoraTeam is the most demanding product I've worked on — five roles, eight AI agents, five-stage approvals, money-moves-real, audit-is-real. What it taught me is that enterprise design isn't about prettier screens. It's about making complex systems legible to the humans who run them, and trustworthy to the humans who depend on them."

---

## Appendix — Audit scorecard at a glance

| Category | Verdict |
|---|---|
| Information Architecture | Weak |
| SOW Lifecycle workflow | Adequate |
| Decomposition workflow | Weak |
| Assignment workflow | Adequate |
| Workroom workflow | Adequate |
| Submission workflow | Weak |
| Review workflow | **Critical** |
| Acceptance workflow | Weak |
| Payout workflow | **Critical** |
| Governance workflow | Weak |
| Cognitive load | Weak |
| Enterprise admin role UX | Adequate |
| Contributor role UX | Strong |
| Mentor / Reviewer role UX | **Critical** |
| Platform admin role UX | Weak |
| Finance role UX | Weak (not yet a real surface) |
| Loading states | Adequate |
| Empty states | Weak |
| Error states | **Critical** |
| Partially completed states | **Critical** |
| Audit visibility | Weak |
| Evidence visibility | Weak |
| Risk visibility | Weak |
| Compliance clarity | **Critical** |
| AI explainability | Weak |
| Operational monitoring | **Critical** |
| Bottleneck detection | Weak |
| Escalation management | **Critical** |

**Overall product maturity (UX lens): ~45%.** The contributor surface and the SOW lifecycle backbone are strong. The mentor surface, the operational console, the governance-as-UX layer, and the AI explainability patterns are where the next phase of design investment will produce the highest leverage.

---

*End of Enterprise UX & Operational Design Audit.*
