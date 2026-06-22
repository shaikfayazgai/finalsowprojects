# Enterprise Portal V2 — Operational Reorganization Strategy

**Phase:** 1B — Enterprise Portal V2 Reorganization
**Scope:** Operational architecture + Information Architecture + Lifecycle mapping. **No UI implementation.**
**Method:** Code-grounded audit of current V1 routes (77 pages) + nav config, then strategic reorganization for V2.

---

## 0 · Strategic frame

> "The Enterprise portal is not a client dashboard. It is the **upstream origin layer** of the GlimmoraTeam workforce ecosystem. It is where work is created, scoped, decomposed, governed, accepted, and paid. Everything the Contributor executes and the Mentor reviews flows downstream from here."

Contributor V2 = production. Mentor V2 = governance. **Enterprise V2 = orchestration.** The three together close the workforce ecosystem triangle.

---

## 1 · V1 Audit — Current Enterprise Structure

### 77 V1 pages across 12+ functional domains

```
/enterprise (root)
├── dashboard
├── sow/                    ← 18 sub-routes — over-fragmented intake flow
│   ├── [sowId]/(detail · approve · compare · contract · kickoff)
│   ├── approval/(list · [sowId])
│   ├── archive
│   ├── blueprint
│   ├── generate/(generate · review)
│   ├── intake
│   ├── upload/(9 sub-steps as separate routes)
│   └── versions
├── decomposition/          ← 5 sub-routes
│   ├── [planId]/(detail · approve · edit)
│   └── approval
├── team/[teamId]/(detail · confirm)
├── projects/               ← 6 sub-routes
│   ├── [projectId]/(detail · milestones · monitor · tasks/[taskId])
│   ├── completed
│   └── exceptions
├── review/                 ← 4 sub-routes
│   ├── [deliverableId]/(detail · feedback)
│   └── history
├── billing/                ← 6 sub-routes
│   ├── budget · history · invoices/[invoiceId]
│   ├── pricing · rate-cards · reports
├── compliance/             ← 4 sub-routes — NOT in current nav
│   ├── documents · esg · evidence · podl
├── analytics/              ← 3 sub-routes — NOT in current nav
│   ├── economic · governance · reports
├── audit                   ← NOT in current nav
├── notifications           ← NOT in current nav
├── onboarding              ← NOT in current nav
├── profile
├── settings/(general · security)
└── reviewer/               ← 10 sub-route sub-portal
    ├── mentoring-log · my-metrics · notifications · qa-inbox
    ├── review-history · review-queue/[reviewId] · task-monitor/[taskId]
```

### V1 Audit Findings — Critical Issues

| # | Finding | Severity |
|---|---|---|
| 1 | **SOW intake fragmented across 13+ routes.** Upload has 9 sub-steps as separate URL routes (`/upload/details`, `/upload/extraction-report`, `/upload/gap-analysis`, `/upload/gaps`, `/upload/generate`, `/upload/parsed-review`, `/upload/preview-confirm`, `/upload/report`, `/upload/review`). This is V1 wizard hell — every wizard step gets its own route. | **P0** |
| 2 | **SOW has 4 entry points** (intake / upload / generate / blueprint) with overlapping purpose. Unclear which is canonical. | **P0** |
| 3 | **Compliance domain exists with 4 pages but NOT in sidebar nav.** Hidden capability. | **P1** |
| 4 | **Analytics domain exists with 3 pages but NOT in sidebar nav.** Hidden capability. | **P1** |
| 5 | **Audit, Notifications, Onboarding pages exist but NOT in sidebar nav.** Orphaned. | **P1** |
| 6 | **Nav title "Enterprise Admin Console"** reads as platform tooling, not customer-facing workforce orchestration. | **P1** |
| 7 | **Project monitoring is thin** — `/projects` + `[id]` + `completed` + `exceptions`. No real delivery operations surface. | **P1** |
| 8 | **Review & Acceptance is split from Billing.** The accept-work → trigger-payment loop is two disconnected sections. | **P2** |
| 9 | **Reviewer sub-portal (10 pages) nests under enterprise** but uses its own `reviewerNav` config. Visually disconnected from parent shell. | **P2** |
| 10 | **Settings only has 2 routes** (general + security). Under-built or correctly minimal — unclear. | **P3** |
| 11 | **Brown accent color** is appropriate for Enterprise (matches CLAUDE.md `accentColor: "brown"`). No change needed. | OK |
| 12 | **No connection to Contributor/Mentor V2 store.** Enterprise still in its own data universe. | **P1** (Phase 1B architecture concern) |

### V1 Sidebar IA (current — 7 sections, 8 nav items)

```
Dashboard
SOW                  · SOW Repository · Approval Pipeline
Planning             · Decomposition · Teams
Project Monitoring   · Project Portfolio · Exceptions
Review & Acceptance  · Evidence Review · Acceptance Logs
Billing              · Billing
Organization         · Settings
```

**Critique:** 7 sections for 8 items is over-grouped. Compliance, Audit, Analytics, Notifications, Profile all missing from nav. Workflow grouping splits the orchestration story across multiple disconnected sections.

---

## 2 · Enterprise V2 Operational Philosophy

### Anchor framing
**Enterprise = orchestration layer.** The portal is the place where:
- Work originates (SOW intake)
- Scope decomposes into executable tasks
- Workforce is formed (teams)
- Delivery is tracked
- Outputs are reviewed and accepted
- Acceptance triggers payment
- Compliance + audit is visible by construction

### Five operating principles for Enterprise V2

| # | Principle | What it rejects |
|---|---|---|
| 1 | **Origination over administration.** Enterprise surfaces should start with "what work is being created" not "what settings exist." | Generic admin panel feel |
| 2 | **Lifecycle over modules.** Surfaces follow the orchestration lifecycle, not internal team boundaries. | Disconnected feature silos |
| 3 | **Governance is structural, not bolted-on.** Compliance, audit, and acceptance evidence are first-class navigation, not hidden subroutes. | Buried governance — the very thing enterprise buyers pay for |
| 4 | **Delivery transparency over surveillance.** Show progress as continuity (this task is in revision, that one cleared review), not as monitoring (employee productivity metrics). | Generic project tracker feel |
| 5 | **One ecosystem, three vantage points.** Enterprise reads from the same unified task store as Contributor and Mentor — different framing for the buyer/sponsor role, same operational truth. | Parallel data universe / V1 mock isolation |

### Tone target
Where Contributor portal = motivation + execution, and Mentor portal = governance + audit-grade, the Enterprise portal = **strategic visibility + operational orchestration**. Executive-grade. Not micromanagement.

### What Enterprise V2 must NOT feel like
- ❌ Generic SaaS client dashboard (Salesforce-clone)
- ❌ Static project tracker (Jira-clone)
- ❌ Shallow admin panel (Stripe Dashboard-clone)
- ❌ A different product from Contributor/Mentor V2 (visual mismatch)

### What Enterprise V2 SHOULD feel like
- ✅ A workforce orchestration cockpit
- ✅ A delivery governance surface
- ✅ A continuation of the V2 ecosystem with enterprise-grade chrome

---

## 3 · Enterprise V2 Information Architecture

### 6 sections, 14 nav items (matches V2 IA pattern from Contributor + Mentor)

```
OVERVIEW
─ Dashboard                          Operational overview · today's orchestration state

WORK ORIGINATION ★ (primary)
─ SOW Workspace                      Unified intake / generate / review / approve / archive
─ Decomposition                      SOW → tasks · scoping workspace
─ Teams                              Workforce formation

DELIVERY (★ primary)
─ Project Portfolio                  All in-flight projects
─ Evidence Review                    Enterprise-side acceptance
─ Exceptions                         Delivery escalations + blockers

FINANCIAL
─ Billing                            Budget · invoices · payouts · rate cards (consolidated)

GOVERNANCE
─ Compliance                         Documents · ESG · evidence · PODL (consolidated)
─ Audit Trail                        Operational record

REVIEWER (sub-portal — sub-section)
─ Reviewer Workspace                 (links into sub-portal — see §6)

ACCOUNT (footer)
─ Notifications
─ Profile                            Single-page operator surface (overview only)
─ Settings                           Two routes only: Preferences + Security
```

### Locked scope — Profile + Settings

These two surfaces are deliberately minimal in Phase 1B. The architecture
locks the exact route surface to prevent scope creep.

**Profile** — `/enterprise/profile`
- **Exactly one route.** No sub-pages.
- Renders: identity banner + KPI band + about card + scope-of-authority +
  recent decisions snapshot + recent interventions snapshot.
- All "deep" profile flows (governance editor, permissions matrix, activity
  timeline, edit-profile dialog) are **Phase 2**.

**Settings** — `/enterprise/settings`, `/enterprise/settings/security`
- **Exactly two routes.** Shell tabs: Preferences · Security.
- Preferences scope: governance posture (require double-accept · min
  readiness score · max rounds before escalation), SLA thresholds (watch ·
  breach), review visibility toggles (reviewer recommendations · AI signals ·
  audit trail), AI posture defaults (level · confidence filter), workspace
  defaults (default landing surface · density).
- Security scope: **Two-factor authentication** (MFA enrollment · backup
  codes · revoke) and **Active sessions** (per-device list with device · IP ·
  last-active timestamp · revoke action). The Active Sessions panel is the
  canonical modern pattern that consolidates what older surfaces split into
  "trusted devices + recent sign-ins + session timeout." Read-mostly surface
  — operator confirms identity posture and revokes any session they don't
  recognize. Future Phase 2 extensions (idle-timeout config · SSO enforcement
  · IP allowlisting) are explicitly out of Phase 1B.
- **Everything else is Phase 2**: notification routing matrix, integrations
  (Slack/Teams/webhook/GitHub/Linear), branding (workspace name · accent ·
  logo), compliance (data residency · retention · export windows), API
  tokens. These surfaces exist in the V2 spec as "deep customization" but
  are explicitly out of Phase 1B per §7.

This scope was previously breached — 4 Profile sub-pages and 5 Settings
sub-pages were built and then removed during the May 26, 2026 stabilization
pass to bring the implementation back in line with this section.

### Key IA decisions

| Decision | Rationale |
|---|---|
| **Two "primary" sections** (Work Origination + Delivery) | Mirrors the orchestration arc — origin → delivery — and matches Contributor V2's "Work Execution ★" emphasis pattern |
| **SOW collapsed from 18 routes to one "SOW Workspace"** | Eliminates V1 wizard hell. The 13+ upload sub-steps become a single multi-stage workspace, not 13 URLs |
| **Compliance promoted to nav** | Currently hidden; governance must be first-class for enterprise buyers |
| **Analytics removed from Enterprise V2 nav** | Cross-role; will live in dedicated `/analytics/*` Phase 2 surface. Dashboard absorbs operational summary for Phase 1B |
| **Audit Trail promoted to nav** | Audit is the proof-by-construction story for governance — must be visible |
| **Billing consolidated to one nav item** | Budget/invoices/pricing/rate-cards/reports flatten into one Billing surface with tabs (matches V2 Earnings panel pattern from Contributor) |
| **Project Portfolio replaces "Project Monitoring"** | Tone shift: portfolio = strategic visibility; monitoring = surveillance |
| **Reviewer sub-portal exposed as a sidebar item** | Currently nested but invisible at the top level; promoting makes the sub-portal discoverable while preserving its scoped chrome |
| **Notifications promoted to footer** | Universal operational concern; should not be hidden |
| **Onboarding removed from runtime nav** | One-time SSO flow; not a recurring destination |

---

## 4 · Enterprise Lifecycle Map

The end-to-end orchestration lifecycle Enterprise V2 must make observable:

```
SOW INTAKE
   ↓ (upload / generate / manual)
SOW REVIEW & APPROVAL
   ↓ (commercial · legal · security gates)
DECOMPOSITION
   ↓ (scope → milestones → tasks)
TEAM FORMATION
   ↓ (workforce assignment)
─────────────── handoff to Contributor V2 ───────────────
CONTRIBUTOR EXECUTION
   ↓ (workroom · drafts · evidence)
SUBMISSION
   ↓
─────────────── handoff to Mentor V2 ───────────────
MENTOR GOVERNANCE
   ↓ (review · revision cycles · acceptance)
─────────────── handback to Enterprise V2 ───────────────
ENTERPRISE REVIEW & ACCEPTANCE
   ↓ (deliverable evidence · sign-off)
ACCEPTANCE LOG
   ↓
BILLING / INVOICING
   ↓
COMPLETION
   ↓
AUDIT TRAIL (cross-cutting · records everything)
```

### Where Enterprise V2 owns the lifecycle

| Phase | Enterprise V2 surface |
|---|---|
| **Origination** | SOW Workspace |
| **Scoping** | Decomposition |
| **Resourcing** | Teams |
| **Delivery visibility** | Project Portfolio |
| **Exception handling** | Exceptions |
| **Acceptance** | Evidence Review |
| **Financial settlement** | Billing |
| **Compliance proof** | Compliance |
| **Audit record** | Audit Trail |

### Cross-ecosystem handoffs (where Enterprise touches Contributor + Mentor)

| Handoff | From | To | Mechanism (Phase 1B store) |
|---|---|---|---|
| Task assignment | Enterprise Decomposition | Contributor Assigned Work | Unified task store · enterprise creates task, contributor sees it |
| Submission received | Contributor Workroom | Mentor Pending Reviews | Same store transition: `under_review` |
| Mentor decision | Mentor Workspace | Contributor + Enterprise | `completed` / `revision_requested` state propagates to both portals |
| Enterprise acceptance | Enterprise Review | Billing trigger | Acceptance event → invoice generation |
| Escalation | Mentor Escalated | Enterprise Exceptions | Cross-portal escalation visibility |
| Compliance flag | Mentor Governance Holds | Enterprise Compliance | Same governance event visible from both sides |

**Critical architectural commitment for Phase 1B:** the unified contributor-task store built for Contributor V2 must extend to absorb Enterprise-originated tasks. Same store, same state machine, three operational vantage points.

---

## 5 · MVP-Critical Surfaces (Phase 1B build priority)

Ordered by demo + business value. Each surface in this table is **required** for Phase 1B MVP completion.

| # | Surface | Why MVP-critical | Existing V1 routes to consolidate |
|---|---|---|---|
| 1 | **Dashboard** | First impression. Operational orchestration overview. Cross-lifecycle visibility. | `/dashboard` |
| 2 | **SOW Workspace** | Origin of work. Without this, the workforce platform has no buyer-side story. | Consolidates 18 V1 SOW routes into one workspace |
| 3 | **Decomposition** | The SOW → tasks bridge. This is where the Contributor's "Assigned Work" originates. | `/decomposition/*` (5 V1 routes) |
| 4 | **Teams** | Workforce formation. Connects to Contributor identity model. | `/team/*` (3 V1 routes) |
| 5 | **Project Portfolio** | Delivery visibility. The "where are my projects" surface. | `/projects/*` (6 V1 routes) |
| 6 | **Evidence Review** | Enterprise-side acceptance. Closes the lifecycle loop. | `/review/*` (4 V1 routes) |
| 7 | **Billing** | Payment transparency. Trust-building. | `/billing/*` (6 V1 routes — consolidated) |
| 8 | **Exceptions** | Where things go wrong. Enterprise-grade incident visibility. | `/projects/exceptions` |
| 9 | **Reviewer Workspace** | Sub-portal for enterprise-side reviewers. Already 10 V1 pages — wrap in V2 shell. | `/reviewer/*` (10 V1 routes) |
| 10 | **Audit Trail** | Governance proof. Cross-cutting operational record. | `/audit` |
| 11 | **Compliance** | Documents, ESG, evidence, PODL. Enterprise buyer concern. | `/compliance/*` (4 V1 routes) |

### Build priority (recommended sequence)

**Wave 1 — Origination chain** (the upstream story stakeholders see first)
1. Dashboard (operational tone)
2. SOW Workspace (consolidated)
3. Decomposition
4. Teams

**Wave 2 — Delivery chain** (the downstream story)
5. Project Portfolio
6. Evidence Review
7. Exceptions

**Wave 3 — Financial + Governance**
8. Billing (consolidated)
9. Audit Trail
10. Compliance (consolidated)

**Wave 4 — Sub-portals + utility**
11. Reviewer Workspace (V2 shell wrapping existing 10 pages)
12. Notifications + Profile + Settings (footer surfaces)

---

## 6 · Reviewer Sub-Portal Strategy

### Current state
- `/enterprise/reviewer/*` — 10 V1 pages
- Uses its own `reviewerNav` config (separate from `enterpriseNav`)
- Nested URL path under Enterprise but **visually disconnected** from Enterprise shell
- Routes: review-queue, task-monitor, qa-inbox, notifications, review-history, mentoring-log, my-metrics

### Strategic relationship to Enterprise
Reviewer is **not a peer role** to Enterprise/Contributor/Mentor. It is a **sub-role under Enterprise** — for enterprise-side reviewers (not Glimmora mentors). When Acme Corp signs up as an enterprise, Acme's internal reviewers use the Reviewer sub-portal to review their team's work.

### V2 Reviewer Strategy: scoped shell inheritance

| Decision | Rationale |
|---|---|
| **Reviewer inherits Enterprise V2 shell** (same sidebar, same chrome) | Reviewer IS enterprise-side; visual disconnection in V1 is a mistake |
| **Reviewer-scoped sidebar** activates when entering `/enterprise/reviewer/*` | Sidebar shows reviewer-specific items only when the reviewer is in their workspace |
| **"Back to Enterprise" toggle** in Reviewer shell | Enterprise admins viewing the reviewer workflow can return to the main enterprise view |
| **Reviewer surfaces use Mentor V2 primitives** (severity rails, SLA timers, governance markers) | Reviewers do similar work to mentors; reuse the proven V2 governance patterns |
| **Reviewer reads from the same unified task store** | One source of truth — reviewer sees the same tasks the enterprise sees, with reviewer-appropriate framing |
| **Reviewer V2 is Wave 4** (after Enterprise main lifecycle is built) | Sub-portal can't be styled until parent shell exists |

### Reviewer V2 scope (Phase 1B)
- Visual shell migration only (Wave 4)
- Existing 10 V1 routes get V2 chrome (`ContributorPageHeader`-equivalent)
- Internal page bodies kept; no functional rebuild in Phase 1B
- Full Reviewer V2 rebuild is **Phase 2 work** (post-MVP)

---

## 7 · Out-of-Scope for Phase 1B

Strictly excluded from Phase 1B:

| Excluded | Why deferred |
|---|---|
| **Analytics deep dashboards** (`/enterprise/analytics/*`) | Needs real operational data; mock analytics distract from the lifecycle story |
| **Onboarding wizard V2** (`/enterprise/onboarding`) | One-time flow; not part of recurring enterprise operations |
| **Multi-tenant org switching** | Phase 3+ scaling concern |
| **Deep automation rules** (auto-routing, auto-approval logic) | Configuration surface, not lifecycle surface |
| **SOW versioning / blueprint / archive** as separate top-level routes | Consolidate into SOW Workspace as views/tabs |
| **Settings deep customization** (notification rules, integrations, webhooks) | Phase 2 — keep Settings to profile + security + basic preferences |
| **AI generation features** beyond basic decomposition assistance | No new AI surfaces; reuse Contributor/Mentor V2 AI patterns where applicable |
| **Reviewer V2 functional rebuild** | Wave 4 visual shell only; functional rebuild = Phase 2 |
| **Enterprise-facing notifications system** | Use existing notifications page; no new design |
| **Public-facing pages** (`/public/*`) | Already V1; unchanged |

---

## 8 · V1 Cleanup Recommendations

Specific V1 routes to consolidate/hide/remove during Phase 1B:

### Consolidate into single workspaces
| V1 routes | V2 destination | Action |
|---|---|---|
| `/sow/intake`, `/sow/upload/*` (9 routes), `/sow/generate/*` (2 routes), `/sow/blueprint`, `/sow/archive`, `/sow/versions` | **`/sow` (V2 SOW Workspace)** | Collapse 16 routes into one workspace with stages, NOT separate URLs |
| `/billing/budget`, `/billing/history`, `/billing/invoices/*`, `/billing/pricing`, `/billing/rate-cards`, `/billing/reports` | **`/billing` (V2 Billing)** | Single page with internal tab view (matches Contributor V2 Earnings Panel pattern) |
| `/compliance/documents`, `/compliance/esg`, `/compliance/evidence`, `/compliance/podl` | **`/compliance` (V2 Compliance)** | Single page, sub-views |

### Hide from V2 nav (preserve URL access)
- `/enterprise/analytics/*` — not Phase 1B
- `/enterprise/onboarding` — one-time
- Deep SOW sub-routes (parsed-review, gaps, extraction-report, etc.) — internal stages of the workspace

### Promote to V2 nav (currently hidden)
- Compliance
- Audit Trail
- Notifications (footer)
- Reviewer Workspace (with scoped sub-shell)

---

## 9 · Phase 1B Scope Boundaries

### What Phase 1B MUST deliver
1. **Enterprise V2 IA** — 6 sections, 14 nav items as specified above
2. **11 V2 surfaces** built across Waves 1–3 (Dashboard, SOW Workspace, Decomposition, Teams, Project Portfolio, Evidence Review, Exceptions, Billing, Audit Trail, Compliance, Reviewer shell)
3. **Unified store integration** — Enterprise reads from + mutates the same store Contributor and Mentor V2 use
4. **Visual consistency** — same primitives (`ContributorCard`, `ContributorPageHeader`, etc.), brown accent (enterprise color per `accentColor: "brown"`)
5. **Lifecycle continuity** — handoffs to Contributor + Mentor V2 verified end-to-end

### What Phase 1B MUST NOT deliver
- New roles (no inventing personas beyond `UserRole` union)
- Backend integration (frontend mock-only, like Contributor + Mentor V2)
- Analytics dashboards (deferred)
- Multi-tenant features (deferred)
- Reviewer functional rebuild (shell only)
- Settings deep customization (keep minimal)

### Phase 1B success criteria
- ✅ Enterprise sidebar reads cohesively with Contributor + Mentor V2
- ✅ A stakeholder demo can start at SOW intake and follow a piece of work all the way to acceptance + billing
- ✅ All three portals (Enterprise, Contributor, Mentor) read from the unified task store
- ✅ Cross-portal handoffs propagate state in real time (same architecture as Contributor + Mentor V2)
- ✅ Visual consistency across all V2 surfaces
- ✅ Reviewer sub-portal accessible from Enterprise with consistent chrome

---

## 10 · Implementation Priority Order

Ranked by **stakeholder demo value × build effort**:

### Highest priority (Wave 1 — must ship first)
1. **Enterprise Dashboard V2** — sets operational tone; first impression
2. **SOW Workspace consolidated** — biggest V1 consolidation win (18 routes → 1 workspace)
3. **Decomposition V2** — the SOW → contributor handoff; connects to Contributor V2 store

### High priority (Wave 2)
4. **Teams V2** — workforce formation visibility
5. **Project Portfolio V2** — delivery visibility
6. **Evidence Review V2** — enterprise acceptance loop

### Medium priority (Wave 3)
7. **Billing V2 consolidated** — financial trust
8. **Exceptions V2** — escalation visibility
9. **Audit Trail V2** — governance proof
10. **Compliance V2 consolidated** — enterprise buyer concern

### Lower priority (Wave 4)
11. **Reviewer V2 shell** — wrap existing 10 pages with V2 chrome
12. **Notifications V2** — footer utility
13. **Profile V2** — footer utility
14. **Settings V2** — footer utility (minimal scope)

---

## 11 · Risk Register for Phase 1B

| Risk | Mitigation |
|---|---|
| **SOW Workspace consolidation is the biggest scope risk** (18 V1 routes → 1 workspace) | Treat as a multi-stage workspace, not a single page. Stages are tabs/states, not URLs |
| **Unified store extension for Enterprise tasks** | Architecturally aligned to existing store; new task `origin: enterprise` field, no new store |
| **Reviewer sub-portal visual conflict** | Wave 4 — wait until Enterprise shell is stable before nesting |
| **77 V1 pages of cleanup work** | Most stay; only ~20 routes need active consolidation/removal |
| **Cross-portal handoff testing** | Use Contributor + Mentor V2 demo flow as the spec for Enterprise V2 integration |
| **Brown accent visual fatigue** | Already in V1; tested at scale |
| **Mock data volume** | Reuse the unified task store seed; add ~3-5 SOW-shaped mock entries |

---

## 12 · Closing Strategic Frame

When Enterprise Portal V2 ships, the platform transforms from:

> **"Two thirds of a workforce ecosystem"**
> (Contributor + Mentor V2 demonstrate execution and governance — but where does the work come from?)

Into:

> **"A complete workforce orchestration and delivery governance ecosystem"**
> (Enterprise originates → Contributor executes → Mentor governs → Enterprise accepts → Billing settles → Audit records)

The same unified data model. Three role-appropriate UX philosophies. One operational truth.

**This is the Phase 1B mandate.**

---

**End of Enterprise Portal V2 reorganization strategy.**

No UI implementation produced. No architecture redesign. Strictly: audit + philosophy + IA + lifecycle map + scope boundary.
