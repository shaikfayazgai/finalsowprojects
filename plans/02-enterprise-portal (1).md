# Enterprise Portal — Detailed Specification

> **Status:** Draft v1.0 — Phase 1 rebuild reference
> **SOW anchor:** GLIMMORATEAM™ Global Workforce Intelligence Platform v1.1
> **Owner:** Product · Engineering · Design
> **Last updated:** 2026-05-26
> **Supersedes:** all prior `ENTERPRISE_PORTAL_V2_*` docs in `docs/architecture/`, `docs/audits/`

---

## 0. Document control

| Field | Value |
|---|---|
| Document role | Source of truth for build-out and QA |
| SOW anchor | §1.4.1, §3.1.MVP.1, §3.1.MVP.2, §3.1.MVP.6, §3.1.MVP.8, §3.1.MVP.9, §3.1.6, §3.1.7, §3.1.8, §4.1, §4.3, §14, §15, §19.1, §22.1 |
| Phase 1 horizon | 0–90 days |
| Scope philosophy | SOW-binding only; over-scoping flagged and deferred |

### Reading conventions

Same as contributor spec (§0):
- **§** = SOW section · **P1/P2** = Phase 1/2 · **🔒 SEAL** = hide for now
- **🚧 BUILD** = doesn't exist · **🔧 WIRE** = mock today · **✅ KEEP** = Phase 1-ready

---

## 1. Purpose and personas

### 1.1 What this portal is for

The Enterprise Portal is the **customer-side workspace** where an enterprise client of GlimmoraTeam:

- **Originates work** — uploads or authors SOWs, gets them approved through a 5-stage pipeline
- **Decomposes work** — converts approved SOWs into milestones and tasks with human gates
- **Delivers work** — monitors projects, reviews submissions (when two-stage review is configured), handles exceptions
- **Pays for work** — sets rate cards, reviews invoices, approves payouts, exports billing
- **Audits work** — reads an immutable log of every consequential action
- **Configures** — tenant, roles, SSO/HRIS integrations, SLA templates, governance thresholds

It is **the operator surface** for the SOW lifecycle (§4.1). Every other portal exists downstream of decisions made here.

### 1.2 Personas

Eight personas access this portal. Their visibility is governed by RBAC (§10). They use the same shell with role-conditional modules — never separate portals.

| Persona | Role code | What they own | SOW |
|---|---|---|---|
| **Enterprise Admin** | `ent.admin` | Everything: tenant, roles, billing, integrations | §3.1.6 |
| **Project Sponsor** | `ent.sponsor` | SOW authoring + approval; budget oversight per project | §3.1.MVP.1, §4.1 |
| **PMO / Project Manager** | `ent.pmo` | Decomposition, project monitoring, exception management | §3.1.MVP.2, §3.1.6 |
| **Finance Controller** | `ent.finance` | Rate cards, invoices, payout reports, ERP exports | §3.1.MVP.6, §3.1.7 |
| **Compliance Officer** | `ent.compliance` | Audit log, governance config, risk dashboards | §3.1.MVP.8, §14 |
| **Internal Client Reviewer** | `ent.reviewer` | Two-stage review: client-side accept/reject after mentor | §3.1.MVP.5 |
| **Procurement Lead** | `ent.procurement` | PO creation, vendor records, SOW-to-PO mapping | §3.1.7 |
| **IT / Security Admin** | `ent.it` | SSO, HRIS, webhooks, security policies | §3.1.MVP.8, §3.1.MVP.9 |

> A single user can hold multiple roles (e.g., `ent.sponsor + ent.reviewer`). Some roles are mutually exclusive by SOX-style policy (e.g., `ent.finance + ent.procurement` should not be the same person — surface a warning, don't block).

### 1.2.1 One portal, role-conditional modules

**Decision (locked):** same shell, same navigation, same dashboard layout. Role-specific affordances added as conditional modules in known slots, not as separate portals.

**Where the variance lives:**
- **Dashboard "Your role" module** — different KPI emphasis per role (sponsor sees SOW pipeline; PMO sees project health; finance sees payouts pending; etc.)
- **Sidebar visibility** — RBAC hides sections the role can't access (e.g. finance doesn't see "Decomposition"; PMO doesn't see "Billing")
- **Action affordances within shared screens** — a project page is identical; PMO sees "Reassign" buttons; sponsor sees "Approve" buttons; finance sees the budget line
- **Audit log filters** — every role sees the audit log; default filter is "events I can act on"

### 1.3 Jobs-to-be-done (per role)

| JTBD | Who | Surface |
|---|---|---|
| "Upload a SOW and get it approved" | Sponsor | SOW Workspace · Approval Pipeline |
| "Turn an approved SOW into a buildable plan" | PMO | Decomposition |
| "Know which projects are at risk this week" | PMO, Sponsor | Dashboard · Projects · Exceptions |
| "Sign off on a delivered task" | Reviewer | Reviewer queue |
| "Configure how we pay contributors per skill" | Finance | Rate Cards |
| "Pull a payout/billing report for finance" | Finance | Billing · Export |
| "Show auditors every consequential action" | Compliance | Audit |
| "Connect our HRIS / IdP / Jira" | IT | Integrations |
| "Set policies for SLA / pricing / governance" | Admin, Compliance | Settings · Policies |

### 1.4 What this portal is NOT

- **Not** a contributor workspace (contributors live in their own portal)
- **Not** a mentor workspace (mentor reviews live in their portal; enterprise sees the *outcome*, not the rubric authoring)
- **Not** a public-facing site (no marketing, no public profiles)
- **Not** an analytics-only console — analytics are present, but they're embedded in the operating context, not a separate destination

---

## 2. Phase 1 vs Phase 2 scope

### 2.1 Phase 1 — must ship (SOW-binding)

| # | Capability | SOW | Today | Phase 1 effort |
|---|---|---|---|---|
| 1 | SOW intake (UI upload + structured form) | §3.1.MVP.1 | Exists | 🔧 WIRE persistence |
| 2 | Metadata extraction (AI-assistive, human-validated) | §3.1.MVP.1 | Partial — AI stub | 🔧 WIRE real extraction service |
| 3 | Clause tagging (deps, assumptions, constraints) | §3.1.MVP.1 | Mock UI | 🔧 WIRE |
| 4 | SOW versioning + audit history | §3.1.MVP.1 | Sealed in V2 | 🚧 BUILD versioning UI |
| 5 | 5-stage approval pipeline (Business → Commercial → Legal → Security → Final) | §3.1.MVP.1, §4.1 | Exists, polished | 🔧 WIRE backend transitions + audit |
| 6 | Configurable SOW intake forms (per client template) | §3.1.MVP.1 | Not built | 🚧 BUILD template editor |
| 7 | Semi-automated decomposition (SOW → milestones → tasks) | §3.1.MVP.2 | Exists | 🔧 WIRE AI suggestions + persistence |
| 8 | Skills tagging per task | §3.1.MVP.2 | Exists | 🔧 WIRE taxonomy lookup |
| 9 | Task dependencies + critical path (basic) | §3.1.MVP.2 | Partial UI | 🚧 BUILD critical path calculation |
| 10 | Human approval gates before execution | §3.1.MVP.2 | Exists | 🔧 WIRE |
| 11 | Exportable plan (CSV/PDF) | §3.1.MVP.2 | Missing | 🚧 BUILD |
| 12 | Project portfolio (active SOWs, status, ownership) | §3.1.6 | Exists | 🔧 WIRE |
| 13 | Project monitoring (throughput, quality, bottlenecks) | §3.1.6 | Partial | 🔧 WIRE; consolidate Delivery Tracking into Projects |
| 14 | Exception management (escalations, reassignments, risk flags) | §3.1.6 | Exists | 🔧 WIRE |
| 15 | Internal client reviewer queue (two-stage review) | §3.1.MVP.5 | Exists (`/enterprise/reviewer`) | 🔧 WIRE |
| 16 | Reviewer rubric + accept/reject/rework with reasons | §3.1.MVP.5 | Exists | 🔧 WIRE |
| 17 | Configurable rate cards (role/skill/level/region) | §3.1.MVP.6 | 🔒 SEALED currently | 🚧 BUILD config UI |
| 18 | Task pricing = rate card × effort | §3.1.MVP.6 | Missing | 🚧 BUILD engine |
| 19 | Payout eligibility on acceptance + ledger | §3.1.MVP.6 | Missing | 🚧 BUILD |
| 20 | Billing list + invoice detail | §3.1.MVP.6, §3.1.7 | Exists | 🔧 WIRE |
| 21 | Payout / billing report export (CSV + API) | §3.1.MVP.6 | Missing | 🚧 BUILD |
| 22 | Procurement: PO mapping, GL codes, vendor records | §3.1.7 | Missing | 🚧 BUILD (Phase 1 baseline: PO linking, not full ERP) |
| 23 | SSO config (SAML/OIDC) | §3.1.MVP.8 | Missing | 🚧 BUILD |
| 24 | Server-side RBAC (Next.js middleware) | §3.1.MVP.8, §15 | Client-side only | 🚧 BUILD middleware |
| 25 | Tenant isolation in data model | §3.1.MVP.8 | Single-tenant | 🚧 BUILD multi-tenant scoping |
| 26 | Immutable audit log (top-level surface) | §3.1.MVP.8, §14 | Fragmented per-domain | 🚧 BUILD unified Audit surface |
| 27 | Operational monitoring (service health, error alerting) | §3.1.MVP.8 | Missing | 🚧 BUILD (basic — full SRE is Phase 2) |
| 28 | HRIS sync UI (min fields: employee ID, role, org, manager, cost center) | §3.1.MVP.9 | Missing | 🚧 BUILD |
| 29 | Webhook / API config for project tools (Jira, Azure DevOps) | §3.1.MVP.9 | Missing | 🚧 BUILD |
| 30 | Configurable SLA templates per work type | §4.3 | Missing | 🚧 BUILD |
| 31 | Configurable escalation / reassignment rules | §4.3 | Missing | 🚧 BUILD |
| 32 | Notification centre | implicit | Exists | 🔧 WIRE delivery |
| 33 | Settings (tenant, roles, policies, integrations) | §3.1.6 | Minimal | 🔧 EXPAND |
| 34 | Workforce intelligence dashboard (skills inventory, gaps) | §3.1.6, §19.4 | Sealed | 🚧 BUILD (basic Phase 1; deep Phase 2) |
| 35 | Economic dashboard (spend, savings, ROI baseline) | §3.1.6, §19.4 | Sealed | 🚧 BUILD (basic Phase 1) |
| 36 | Compliance baseline (consent, data minimization, retention) | §3.1.8 | Sealed | 🚧 BUILD (configuration UI; full console Phase 2) |
| 37 | OpenAPI 3.1 documentation surface | §3.1.MVP.8 | Missing | 🚧 BUILD (link to docs portal) |
| 38 | WCAG-aligned core journeys | §1.4.1 | Implicit | 🚧 BUILD audit + remediation |

### 2.2 Phase 2 — deferred (with rationale)

| Surface | SOW | Why Phase 2 |
|---|---|---|
| **Autonomous Project Governor (APG)** | §3.2.2 explicitly | Phase 2 — autonomous orchestration is excluded from MVP |
| **Dynamic / surge pricing** | §3.2 explicitly | Phase 2 — MVP uses static rate cards only |
| **Deep ERP automation** (GL posting, multi-entity invoicing) | §3.2.6 | Phase 2 |
| **Multi-region active-active deployment** | §3.2.5 | Phase 2 |
| **Cryptographic credentialing + verifiable credentials** | §3.2 | Phase 2 |
| **Advanced fraud detection** (anomaly models at scale) | §3.2.4 | Phase 2 |
| **Full Compliance console** (ESG, PODL, evidence packs) | §3.1.8 partial | Phase 1 baseline only; full Phase 2 |
| **Full Analytics console** (workforce IQ + economic deep dashboards) | §3.1.6, §19.4 | Phase 1 baseline only; deep Phase 2 |
| **Delivery Tracking as a separate surface** | not in SOW | **Over-scoped — collapse into Projects** |
| **Teams page** | not in SOW MVP | Phase 2 |

### 2.3 Phase 1 exit criteria — enterprise portal

A new enterprise tenant passes Phase 1 acceptance when **all** of these are true:

1. IT admin can configure SAML/OIDC SSO and have employees sign in
2. IT admin can map HRIS fields (employee ID, role, org, manager, cost center) and sync at least once
3. Finance admin can create at least one rate card (role × skill × level × region)
4. Sponsor can upload a SOW, see AI-extracted metadata, validate it, advance it through the 5-stage pipeline
5. PMO can decompose an approved SOW into ≥3 milestones with ≥10 tasks with skills tagged
6. Approved tasks appear in contributor matching (cross-portal)
7. When a task is submitted, two-stage review (when configured) routes to an enterprise reviewer queue
8. Reviewer can accept, reject (with reason), or request rework
9. On final acceptance, payout eligibility is set and the contributor receives credit
10. Finance can pull a billing/payout CSV with at least the SOW's task ledger
11. Every action above writes an audit event visible in the unified Audit surface
12. Compliance officer can view audit, search by actor + resource + time, export CSV
13. Three core journeys pass a WCAG 2.1 AA audit (SOW intake → approval; Decomposition → tasks ready; Rate card config)

### 2.4 Out of scope entirely

- Public RFP marketplaces (enterprises invite contributors, not bid)
- Cross-tenant data sharing
- Native mobile app (responsive web baseline)

---

## 3. Information architecture

### 3.1 Sidebar (full role)

```
┌─────────────────────────────────┐
│ ▢ Acme Corp · Enterprise         │
├─────────────────────────────────┤
│ OVERVIEW                         │
│   • Dashboard                    │  /enterprise/dashboard
├─────────────────────────────────┤
│ ORIGINATION                      │
│   • SOW Workspace                │  /enterprise/sow
│   • Decomposition                │  /enterprise/decomposition
├─────────────────────────────────┤
│ DELIVERY                         │
│   • Projects                     │  /enterprise/projects
│   • Reviews                      │  /enterprise/reviewer (sub-portal)
├─────────────────────────────────┤
│ FINANCE                          │
│   • Billing                      │  /enterprise/billing
│   • Rate Cards                   │  /enterprise/billing/rate-cards
│   • Payouts                      │  /enterprise/billing/payouts
├─────────────────────────────────┤
│ GOVERNANCE                       │
│   • Audit                        │  /enterprise/audit
│   • Compliance                   │  /enterprise/compliance
├─────────────────────────────────┤
│ INSIGHTS                         │
│   • Analytics                    │  /enterprise/analytics
├─────────────────────────────────┤
│ SETTINGS                         │
│   • Tenant & Roles               │  /enterprise/settings/tenant
│   • Integrations                 │  /enterprise/settings/integrations
│   • Policies                     │  /enterprise/settings/policies
│   • Security                     │  /enterprise/settings/security
├─────────────────────────────────┤
│   • Profile                      │  /enterprise/profile
│   • Notifications                │  /enterprise/notifications
├─────────────────────────────────┤
│ [<<] collapse                    │
└─────────────────────────────────┘
```

### 3.2 RBAC: which roles see which sections

| Section | admin | sponsor | pmo | finance | compliance | reviewer | procurement | it |
|---|---|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SOW Workspace | ✓ | ✓ | ✓ | view | view | — | ✓ | — |
| Decomposition | ✓ | view | ✓ | — | — | — | — | — |
| Projects | ✓ | ✓ | ✓ | view | view | — | view | — |
| Reviews | ✓ | — | — | — | — | ✓ | — | — |
| Billing | ✓ | view | — | ✓ | — | — | view | — |
| Rate Cards | ✓ | — | — | ✓ | — | — | — | — |
| Payouts | ✓ | — | — | ✓ | view | — | — | — |
| Audit | ✓ | view | view | view | ✓ | view | view | view |
| Compliance | ✓ | — | — | — | ✓ | — | — | — |
| Analytics | ✓ | ✓ | ✓ | ✓ | view | — | view | — |
| Settings · Tenant | ✓ | — | — | — | — | — | — | view |
| Settings · Integrations | ✓ | — | — | — | — | — | — | ✓ |
| Settings · Policies | ✓ | — | — | — | ✓ | — | — | — |
| Settings · Security | ✓ | — | — | — | — | — | — | ✓ |

`✓` = full read/write · `view` = read-only · `—` = hidden from sidebar

### 3.3 Route map (Phase 1)

| Route | Screen | Phase | SOW | Roles (see RBAC) |
|---|---|---|---|---|
| `/enterprise/dashboard` | Dashboard | P1 | §3.1.6 | all |
| `/enterprise/sow` | SOW list | P1 | §3.1.MVP.1 | admin, sponsor, pmo, finance, compliance, procurement |
| `/enterprise/sow/new` | SOW intake (upload or author) | P1 | §3.1.MVP.1 | admin, sponsor |
| `/enterprise/sow/[sowId]` | SOW detail | P1 | §3.1.MVP.1 | admin, sponsor, pmo |
| `/enterprise/sow/[sowId]/edit` | SOW edit | P1 | §3.1.MVP.1 | admin, sponsor |
| `/enterprise/sow/[sowId]/versions` | Version history | P1 | §3.1.MVP.1 | admin, sponsor, pmo, compliance |
| `/enterprise/sow/[sowId]/approve` | Approval pipeline (5-stage) | P1 | §3.1.MVP.1 | admin, sponsor, stage-specific approvers |
| `/enterprise/sow/templates` | SOW intake templates | P1 | §3.1.MVP.1 | admin |
| `/enterprise/decomposition` | Decomposition list | P1 | §3.1.MVP.2 | admin, pmo |
| `/enterprise/decomposition/[planId]` | Decomposition workspace | P1 | §3.1.MVP.2 | admin, pmo |
| `/enterprise/decomposition/[planId]/edit` | Decomposition edit | P1 | §3.1.MVP.2 | admin, pmo |
| `/enterprise/decomposition/[planId]/approve` | Decomposition approval | P1 | §3.1.MVP.2 | admin, sponsor, pmo |
| `/enterprise/projects` | Projects list | P1 | §3.1.6 | admin, sponsor, pmo, finance, compliance |
| `/enterprise/projects/[projectId]` | Project detail | P1 | §3.1.6 | admin, sponsor, pmo |
| `/enterprise/projects/[projectId]/milestones` | Milestones tab | P1 | §3.1.6 | admin, sponsor, pmo |
| `/enterprise/projects/[projectId]/tasks` | Tasks tab | P1 | §3.1.6 | admin, sponsor, pmo |
| `/enterprise/projects/[projectId]/tasks/[taskId]` | Task drill-in | P1 | §3.1.6 | admin, sponsor, pmo |
| `/enterprise/projects/[projectId]/exceptions` | Exceptions tab | P1 | §3.1.6 | admin, sponsor, pmo |
| `/enterprise/projects/[projectId]/team` | Team view | P1 | §3.1.6 | admin, sponsor, pmo |
| `/enterprise/projects/[projectId]/budget` | Budget tab | P1 | §3.1.MVP.6 | admin, sponsor, finance |
| `/enterprise/projects/completed` | Completed projects | P1 | §3.1.6 | admin, sponsor, pmo |
| `/enterprise/reviewer` | Reviewer dashboard | P1 | §3.1.MVP.5 | admin, reviewer |
| `/enterprise/reviewer/queue` | Review queue | P1 | §3.1.MVP.5 | admin, reviewer |
| `/enterprise/reviewer/queue/[reviewId]` | Review detail (decision) | P1 | §3.1.MVP.5 | admin, reviewer |
| `/enterprise/reviewer/history` | Review history | P1 | §3.1.MVP.5 | admin, reviewer |
| `/enterprise/billing` | Billing overview | P1 | §3.1.7 | admin, finance, sponsor (view), procurement (view) |
| `/enterprise/billing/invoices` | Invoices list | P1 | §3.1.7 | admin, finance, procurement (view) |
| `/enterprise/billing/invoices/[invoiceId]` | Invoice detail | P1 | §3.1.7 | admin, finance, procurement (view) |
| `/enterprise/billing/rate-cards` | Rate cards list | P1 | §3.1.MVP.6 | admin, finance |
| `/enterprise/billing/rate-cards/new` | New rate card | P1 | §3.1.MVP.6 | admin, finance |
| `/enterprise/billing/rate-cards/[cardId]` | Rate card detail / edit | P1 | §3.1.MVP.6 | admin, finance |
| `/enterprise/billing/payouts` | Payouts ledger | P1 | §3.1.MVP.6 | admin, finance, compliance (view) |
| `/enterprise/billing/payouts/[payoutId]` | Payout detail | P1 | §3.1.MVP.6 | admin, finance |
| `/enterprise/billing/export` | Billing/payout export | P1 | §3.1.MVP.6 | admin, finance |
| `/enterprise/audit` | Audit log (unified) | P1 | §3.1.MVP.8, §14 | all (own scope) |
| `/enterprise/audit/[eventId]` | Audit event detail | P1 | §3.1.MVP.8 | all (own scope) |
| `/enterprise/audit/export` | Audit export | P1 | §3.1.MVP.8 | admin, compliance |
| `/enterprise/compliance` | Compliance overview (P1 baseline) | P1 | §3.1.8 | admin, compliance |
| `/enterprise/compliance/consent` | Consent inventory | P1 | §3.1.8, §3.1.MVP.3 | admin, compliance |
| `/enterprise/compliance/retention` | Data retention rules | P1 | §3.1.8 | admin, compliance |
| `/enterprise/analytics` | Analytics index | P1 | §3.1.6 | admin, sponsor, pmo, finance |
| `/enterprise/analytics/workforce` | Workforce intelligence (basic) | P1 | §3.1.6, §19.4 | admin, sponsor, pmo |
| `/enterprise/analytics/economic` | Economic (basic) | P1 | §3.1.6, §19.4 | admin, finance, sponsor |
| `/enterprise/settings/tenant` | Tenant + roles | P1 | §3.1.6 | admin |
| `/enterprise/settings/integrations` | Integrations | P1 | §3.1.MVP.9 | admin, it |
| `/enterprise/settings/integrations/sso` | SSO config | P1 | §3.1.MVP.8 | admin, it |
| `/enterprise/settings/integrations/hris` | HRIS config | P1 | §3.1.MVP.9 | admin, it |
| `/enterprise/settings/integrations/webhooks` | Webhooks | P1 | §3.1.MVP.9 | admin, it |
| `/enterprise/settings/integrations/erp` | ERP / procurement (basic) | P1 | §3.1.7 | admin, it, finance |
| `/enterprise/settings/policies` | Policy templates | P1 | §4.3 | admin, compliance |
| `/enterprise/settings/policies/sla` | SLA templates | P1 | §4.3 | admin, compliance |
| `/enterprise/settings/policies/escalation` | Escalation rules | P1 | §4.3 | admin, compliance |
| `/enterprise/settings/policies/governance` | Governance thresholds | P1 | §14 | admin, compliance |
| `/enterprise/settings/security` | Security settings | P1 | §3.1.MVP.8 | admin, it |
| `/enterprise/profile` | User profile | P1 | implicit | self |
| `/enterprise/notifications` | Notifications | P1 | implicit | self |

**Sealed for Phase 1 (route hidden or removed):**

| Route | Reason |
|---|---|
| `/enterprise/delivery-tracking` | Collapse into Projects — over-scoped |
| `/enterprise/teams` | Phase 2 — not in SOW MVP |
| `/enterprise/compliance/esg` | Phase 2 |
| `/enterprise/compliance/podl` | Phase 2 |
| `/enterprise/compliance/documents/*` deep | Phase 2 |
| `/enterprise/analytics/reports` deep | Phase 2 |
| `/enterprise/analytics/governance` | Phase 2 (use Audit instead) |

### 3.4 Navigation patterns

- **Sidebar:** persistent on lg+; mobile drawer. RBAC hides items the role can't access.
- **Topbar:** sticky, 60px. Contains tenant chip (multi-tenant later), global search (⌘K), notification bell, account menu.
- **Breadcrumbs:** required for `/sow/[sowId]/*`, `/decomposition/[planId]/*`, `/projects/[projectId]/*`, `/billing/invoices/[invoiceId]`, `/settings/*` deep paths.
- **Deep links:** every filter/sort/page is URL-state'd. Sharing a URL reproduces the exact view.
- **Tabs within entities:** Projects has tabs (Overview · Milestones · Tasks · Team · Exceptions · Budget). Tabs use URL segments not query params (`/projects/p1/milestones`).

---

## 4. End-to-end user journeys

### Journey A — SOW lifecycle (Sponsor + PMO)

```
[Sponsor]            [PMO]               [Approvers]          [Contributor]
   │                   │                      │                    │
   ├ New SOW (upload)  │                      │                    │
   ├ AI extracts       │                      │                    │
   ├ Validate metadata │                      │                    │
   ├ Submit for approval                      │                    │
   │                   │                      ├ Business approves  │
   │                   │                      ├ Commercial         │
   │                   │                      ├ Legal              │
   │                   │                      ├ Security           │
   │                   │                      ├ Final              │
   ├ SOW approved      │                      │                    │
   │                   ├ Open decomposition   │                    │
   │                   ├ AI suggests tasks    │                    │
   │                   ├ Tag skills           │                    │
   │                   ├ Set dependencies     │                    │
   │                   ├ Submit decomposition for sponsor approval  │
   ├ Approve plan      │                      │                    │
   │                   ├ Project provisioned  │                    │
   │                   │                      │                    ├ Tasks appear in matching
   │                   │                      │                    ├ Contributor accepts
   │                   │                      │                    ├ Submits work
   │                   │                      ├ Reviewer accepts   │
   │                   ├ Project closes       │                    │
   ├ Final acceptance  │                      │                    │
   │                   │                      ├ Finance generates invoice
   │                   │                      │                    ├ Contributor paid
```

### Journey B — Two-stage review (Reviewer)

```
[Contributor submits → Mentor accepts → reaches Enterprise Reviewer]

Reviewer dashboard ─→ Queue ─→ Review detail
                                    │
                                    ├ Read mentor's rubric scores
                                    ├ Inspect evidence
                                    ├ Make decision:
                                    │    ◉ Accept            → payout triggered
                                    │    ○ Reject + reason   → contributor sees
                                    │    ○ Request rework    → revision round +1
                                    │
                                    └ Decision audited
```

### Journey C — Rate card setup (Finance)

```
Settings · Rate cards ─→ New rate card
                              │
                              ├ Name + scope (org / project / global)
                              ├ Currency
                              ├ Rows: Role × Skill × Level × Region → ₹/effort
                              ├ Effective from / to
                              ├ Bulk upload (CSV)
                              ├ Preview affected tasks
                              └ Save (audit event)
```

### Journey D — Audit pull (Compliance)

```
Audit ─→ Filter (actor=anyone, resource=SOW-1042, time=last 30 days)
            │
            ├ Result list (paged)
            ├ Drill into event → see actor, action, before/after diff
            ├ Export CSV/JSON for legal
```

### Journey E — Project monitoring (PMO)

```
Dashboard ─→ "3 projects at risk" tile
                  │
                  ▼
            Projects · filter=at-risk
                  │
                  ▼
            Project detail · Exceptions tab
                  │
                  ├ View flagged tasks
                  ├ Reassign / extend SLA / escalate
                  └ Resolution audited
```

### Journey F — Integration setup (IT)

```
Settings · Integrations ─→ SSO
                              │
                              ├ Choose provider (SAML / OIDC)
                              ├ Upload IdP metadata
                              ├ Map claims → roles
                              ├ Test login
                              └ Enable for tenant

                          ─→ HRIS
                              │
                              ├ Connect (API key / OAuth)
                              ├ Map fields (employeeId, role, org, manager, cost center)
                              ├ Schedule sync (cron)
                              └ First sync (preview before commit)
```

### Journey G — Billing close (Finance)

```
Billing ─→ Invoices · this period
              │
              ├ Approve invoices
              ├ Generate CSV/PDF
              ├ Export to ERP (basic — file drop or API)
              └ Audit event
```

---

## 5. Screen-by-screen specification

### 5.A Authentication

Same shared auth screens as contributor (see contributor spec §5.A). Enterprise users land at `/enterprise/dashboard` post-auth. SSO required when tenant policy demands it.

The only enterprise-specific addition:

#### 5.A.1 Tenant selector — `/auth/select-tenant`
**Phase 1, conditional** · 🚧 BUILD

**Use case:** a user belonging to multiple tenants (rare in Phase 1; common Phase 2) selects which tenant to enter.

```
┌──────────────────────────────────────────────────────────────┐
│  You're a member of multiple organizations.                   │
│  Choose where to continue.                                    │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 🏢 Acme Corp                                       [ → ] ││
│  │     12 active projects · last visit yesterday             ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 🏢 Helios Studios                                  [ → ] ││
│  │     3 active projects · last visit last week              ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

**Edge:** single tenant → auto-skip.

---

### 5.B Dashboard

#### 5.B.1 Dashboard — `/enterprise/dashboard`
**Phase 1** · SOW §3.1.6 · 🔧 WIRE

**Use case:** orient any enterprise user to the state of work that matters to their role.

**Wireframe (Sponsor view shown; role-conditional modules render per role):**
```
┌──────────────────────────────────────────────────────────────┐
│ Acme Corp · This week                                          │
│ Good morning, Sandeep                                          │
│ 14 SOWs in flight · 3 pipelines need your attention            │
├──────────────────────────────────────────────────────────────┤
│ ATTENTION ZONE (top of screen)                                 │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ⚠ 2 SOWs waiting for your approval                        │ │
│ │   • Helios Q3 modernization · Business stage · 2d         │ │
│ │   • Reporting V2 · Final stage · today                    │ │
│ │   [ Open queue → ]                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ ROLE MODULE (Sponsor)                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │SOWs in   │ │Pipelines │ │Projects  │ │Acceptance│         │
│ │approval  │ │pending   │ │on-track  │ │last 30d  │         │
│ │   8      │ │   3      │ │  9/12    │ │   87%    │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
├──────────────────────────────────────────────────────────────┤
│ SOW PIPELINE STAGE BAR                                         │
│ ● Draft 4 — ● Review 3 — ● Approval 5 — ● Active 12 — ● Done 38│
├──────────────────────────────────────────────────────────────┤
│ ACTIVE PROJECTS (top 5)                                        │
│ Helios Q3      ▓▓▓▓▓░░░ 62%  on-track   PMO Anjali             │
│ Reporting V2   ▓▓▓▓▓▓▓▓ 81%  at-risk    PMO Sandeep            │
│ Auth modernize ▓▓░░░░░░ 22%  on-track   PMO Lakshmi            │
│ ...                                                            │
│ [ See all projects → ]                                         │
├──────────────────────────────────────────────────────────────┤
│ RECENT ACTIVITY                                                │
│ • Helios Q3 SOW moved to Legal · 14m ago                       │
│ • Auth modernize task t-4811 reassigned · 1h ago               │
│ • Invoice INV-3082 issued · 3h ago                             │
│ [ See in audit → ]                                             │
├──────────────────────────────────────────────────────────────┤
│ AI SIGNALS                                                     │
│ › 2 SOWs awaiting your approval have been waiting > 48h.       │
│ › Reporting V2 is forecast to miss its milestone by 3 days.   │
└──────────────────────────────────────────────────────────────┘
```

**Role-conditional modules (replaces the KPI row + middle section per role):**

| Role | KPI emphasis | Mid-section emphasis |
|---|---|---|
| Sponsor | SOWs awaiting my approval, projects I own | SOW pipeline stage bar |
| PMO | Projects at risk, exceptions open, tasks reassigned | Project health grid |
| Finance | Invoices pending, payouts to release, budget burn | Billing snapshot |
| Compliance | Audit alerts, policy violations, consent gaps | Compliance digest |
| Reviewer | Pending reviews, SLA-at-risk | Queue glance |
| IT | Sync errors, sessions, SSO health | Integration status |
| Admin | Tenant health, all sections summary | Multi-row snapshot |
| Procurement | POs pending, vendor records to update | Procurement queue |

**States:** default · empty (no SOWs yet for new tenant) · loading · degraded · error

**Edge cases:**
- New tenant (0 SOWs) → "Welcome to Acme Corp on Glimmora" walkthrough + "Upload your first SOW" CTA
- Role lost mid-session (e.g. RBAC change) → soft refresh; module updates
- Multi-role user → "Showing dashboard for: [role ▾]" switcher in top-right

**Cognitive load:**
- ONE attention zone at the top — surfaces only items the user can act on right now
- KPI row anchored to the role's primary metric — sponsors care about SOWs, finance about money
- AI signals quiet at the bottom

**Decision heuristic:** "What needs me right now?" → attention zone always.

---

### 5.C SOW Workspace

The SOW lifecycle is the heart of this portal. Routes are scoped under `/enterprise/sow`.

#### 5.C.1 SOW list — `/enterprise/sow`
**Phase 1** · SOW §3.1.MVP.1 · ✅ KEEP polish

**Use case:** browse and find any SOW in the tenant.

```
┌──────────────────────────────────────────────────────────────┐
│ SOW Workspace                                                  │
│ All Statements of Work in this tenant                          │
│ [ + New SOW ]                                                  │
├──────────────────────────────────────────────────────────────┤
│ [ All ] [ Draft 4 ] [ Review 3 ] [ Approval 5 ] [ Active 12 ] │
│                                          [ Search... ] [⚙filter]│
├──────────────────────────────────────────────────────────────┤
│ TITLE              │ STATUS    │ STAGE      │ OWNER  │ UPDATED│
│ ───────────────────┼───────────┼────────────┼────────┼───────│
│ Helios Q3 modern.. │ Approval  │ Business   │ Sandeep│ 14m   │
│ Reporting V2       │ Approval  │ Final      │ Anjali │ 1h    │
│ Auth modernize     │ Active    │ —          │ PMO    │ 1h    │
│ Marketing site Q3  │ Draft     │ —          │ Sandeep│ 3h    │
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ Rows per page [12] · 1–8 of 24                                │
└──────────────────────────────────────────────────────────────┘
```

**States:** default · empty (CTA to create first SOW) · loading · filter_empty

**Edge cases:**
- Filter results in 0 rows → "No SOWs match these filters" with [ Clear filters ]
- Long titles → truncate with tooltip on hover
- Rejected SOWs visually quieter (gray tone)

**Cognitive load:** filter chips show counts; sortable columns; URL-persisted filters; one primary CTA at top.

---

#### 5.C.2 New SOW — `/enterprise/sow/new`
**Phase 1** · SOW §3.1.MVP.1 · ✅ KEEP polish + 🚧 BUILD template selector

**Use case:** start a new SOW via three methods (Upload, Author, Template).

```
┌──────────────────────────────────────────────────────────────┐
│ ← SOW Workspace                                                │
├──────────────────────────────────────────────────────────────┤
│  Start a new SOW                                               │
│                                                                │
│  ┌───────────────────┐ ┌───────────────────┐ ┌─────────────┐│
│  │ 📄                 │ │ ✍                 │ │ 📋          ││
│  │ Upload             │ │ Author             │ │ Template    ││
│  │                    │ │                    │ │             ││
│  │ Drop a DOC/PDF;    │ │ Fill out a         │ │ Start from  ││
│  │ AI extracts        │ │ structured form    │ │ an Acme     ││
│  │ metadata.          │ │ ourselves.         │ │ template.   ││
│  │                    │ │                    │ │             ││
│  │ [ Choose file ]    │ │ [ Start authoring ]│ │ [ Pick one ]││
│  └───────────────────┘ └───────────────────┘ └─────────────┘│
│                                                                │
│  Need to set up a new template? [ Templates → ]               │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.C.3 SOW intake — Upload mode — `/enterprise/sow/new?mode=upload`
**Phase 1** · SOW §3.1.MVP.1 · ✅ KEEP polish

**Wireframe (3-step wizard):**

**Step 1 — Upload:**
```
┌──────────────────────────────────────────────────────────────┐
│ Step 1 of 3 · Upload your SOW                  [Save & exit] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│      ┌────────────────────────────────────────────────┐       │
│      │                                                 │       │
│      │         📄  Drop a DOC, DOCX, or PDF            │       │
│      │             or click to choose                  │       │
│      │                                                 │       │
│      │         Max 20 MB · Encrypted in transit        │       │
│      └────────────────────────────────────────────────┘       │
│                                                                │
│  Confidentiality                                               │
│  ◉ Standard   ○ Confidential   ○ Restricted                   │
│                                                                │
│  Optional context                                              │
│  Project / Initiative tag                                      │
│  [ Helios Q3 modernization ▾ ] or [ + Create new ]            │
│                                                                │
│  [ Cancel ]                              [ Upload + Extract → ]│
└──────────────────────────────────────────────────────────────┘
```

**Step 2 — Review extracted metadata:**
```
┌──────────────────────────────────────────────────────────────┐
│ Step 2 of 3 · Review what we extracted        [Save & exit] │
├──────────────────────────────────────────────────────────────┤
│ ✦ AI extracted the following. Confirm or correct.             │
│                                                                │
│ Title                                                          │
│ [ Helios Q3 design system modernization                    ]   │
│                                                                │
│ Start date          End date                                   │
│ [ 2026-06-01 ]      [ 2026-09-30 ]                            │
│                                                                │
│ Sponsor                Stakeholders                            │
│ [ Sandeep Kumar ]      [ Anjali Reddy, Priya Iyer        ]   │
│                                                                │
│ Deliverables (8)                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ▣ D1 · Token system refresh                               │ │
│ │ ▣ D2 · Component audit + remediation                      │ │
│ │ ▣ D3 · Storybook v8 migration                             │ │
│ │ ...                                          [ + Add ]    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ Clauses extracted                                              │
│ ▶ Dependencies (3)                                             │
│ ▶ Assumptions (5)                                              │
│ ▶ Constraints (4)                                              │
│                                                                │
│ AI confidence: medium-high                                    │
│ ⚠ 2 sections flagged for hallucination risk — see review      │
│                                                                │
│ [ ← Back ]                              [ Continue → ]        │
└──────────────────────────────────────────────────────────────┘
```

**Step 3 — Submit for approval:**
```
┌──────────────────────────────────────────────────────────────┐
│ Step 3 of 3 · Submit for approval             [Save & exit] │
├──────────────────────────────────────────────────────────────┤
│ Your SOW will go through these 5 stages:                      │
│                                                                │
│   ① Business        [ Sandeep Kumar ]                         │
│   ② Commercial      [ Glimmora Commercial team — auto ]       │
│   ③ Legal           [ Aishwarya Rao ▾ ]                       │
│   ④ Security        [ Karthik Iyer ▾ ]                        │
│   ⑤ Final           [ Sandeep Kumar ]                         │
│                                                                │
│ SLA per stage: 48h (from policy templates)                    │
│ Notify on stage changes: ☑                                    │
│                                                                │
│ Cover note (optional, visible to approvers)                   │
│ [ textarea ]                                                   │
│                                                                │
│ [ Save as draft ]      [ Submit for approval ]                │
└──────────────────────────────────────────────────────────────┘
```

**States:** upload_default · uploading · extracting · extracted · extraction_failed · saving_draft · submitting

**Edge cases:**
- File > 20MB → reject with size message
- Unsupported format → reject
- Extraction fails → fall back to manual form (Author mode), keep file linked
- Approver field empty / invalid → block submit
- Save draft mid-way → restorable from SOW list

**Cognitive load:**
- 3 clear steps with progress indicator
- Save & exit at any point — no lost work
- AI extraction shown for review, never accepted blindly
- Hallucination warnings inline, not just at end

**Decision heuristic:** "Trust the AI?" → confidence score + hallucination flags answer it.

---

#### 5.C.4 SOW intake — Author mode — `/enterprise/sow/new?mode=author`
**Phase 1**

Structured multi-section form mirroring Upload Step 2, plus a richer body editor for clauses. Same Step 3 finale.

---

#### 5.C.5 SOW intake — Template mode — `/enterprise/sow/new?mode=template`
**Phase 1** · 🚧 BUILD

Pick a configured template (per Acme), pre-fills sections. Templates managed at `/enterprise/sow/templates`.

---

#### 5.C.6 SOW detail — `/enterprise/sow/[sowId]`
**Phase 1** · ✅ KEEP polish

**Use case:** read the SOW, see its current state, take next action.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← SOW · Helios Q3 modernization · v3                                          │
│ Status: Approval · Stage: Business · Owner: Sandeep · Updated 14m ago         │
│ [ Edit ]  [ Versions ]  [ Audit trail ]  [ Submit for approval → ]            │
├──────────────────────────────────────────────────────────────────────────────┤
│ APPROVAL PIPELINE                                                              │
│ ① ✓ Business      ② ◉ Commercial    ③ ○ Legal   ④ ○ Security   ⑤ ○ Final     │
│   (you, 2h ago)    (waiting)                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ OVERVIEW                                                                       │
│ Title         Helios Q3 design system modernization                            │
│ Dates         2026-06-01 → 2026-09-30                                         │
│ Sponsor       Sandeep Kumar                                                    │
│ Stakeholders  Anjali Reddy, Priya Iyer                                        │
│ Confidentiality   Standard                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ DELIVERABLES (8)                                                              │
│ D1 · Token system refresh                                                      │
│ D2 · Component audit + remediation                                            │
│ ...                                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ CLAUSES                                                                        │
│ ▼ Dependencies (3)                                                             │
│   - Storybook v8 release timeline (external)                                   │
│   - Design tokens spec approval by 2026-06-15                                 │
│   - ...                                                                        │
│ ▼ Assumptions (5)                                                              │
│ ▼ Constraints (4)                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ RISK BREAKDOWN                                                                │
│ Completeness   ▓▓▓▓▓▓▓▓░░ 82%                                                 │
│ Confidence     ▓▓▓▓▓▓▓░░░ 71%                                                 │
│ Compliance     ▓▓▓▓▓▓▓▓▓░ 94%                                                 │
│ Pattern match  ▓▓▓▓▓░░░░░ 53% (rare clause patterns)                          │
│ Overall risk   medium                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ ATTACHMENTS                                                                   │
│ 📄 Helios-Q3-SOW.docx (original) · 1.2MB                                      │
│ 📄 Architecture-diagram.pdf · 380KB                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ DISCUSSION (per-stage threads — collapsed by default)                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States:** default · editing · stage_in_progress · approved · rejected · withdrawn · archived

**Edge cases:**
- User in role with view-only access → all CTAs hidden; "View only" banner
- SOW rejected at any stage → status badge, reason, "Resubmit" CTA
- Version > 1 → show "v3" + diff toggle "Compare to v2"

**Cognitive load:** approval pipeline always visible at top; risk visualized via bars not numbers.

---

#### 5.C.7 SOW edit — `/enterprise/sow/[sowId]/edit`
**Phase 1**

Same form as Author mode (5.C.4) but populated. Editing creates a new draft version; the prior version is preserved.

---

#### 5.C.8 Version history — `/enterprise/sow/[sowId]/versions`
**Phase 1** · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ ← SOW · Helios Q3 modernization · Versions                    │
├──────────────────────────────────────────────────────────────┤
│ v3 (current) · Sandeep · 14m ago · Approval                   │
│   Changes: title polished, D3 added, dependencies updated     │
│   [ View ]  [ Compare to v2 ]  [ Restore as new draft ]       │
├──────────────────────────────────────────────────────────────┤
│ v2 · Sandeep · 3d ago · Rejected at Legal                     │
│   Changes: D5 reworded, confidentiality moved to Restricted   │
│   [ View ]  [ Compare to v1 ]  [ Restore as new draft ]       │
├──────────────────────────────────────────────────────────────┤
│ v1 · Sandeep · 5d ago · Approved → superseded                 │
│   [ View ]                                                     │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** restore creates a new draft v(n+1); never overwrites.

---

#### 5.C.9 Approval pipeline — `/enterprise/sow/[sowId]/approve`
**Phase 1** · SOW §3.1.MVP.1, §4.1 · ✅ KEEP polish

**Use case:** stage-by-stage approval with sign-offs, comments, and the ability to send back.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← SOW · Helios Q3 modernization · Approval                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ ① ✓ Business        ② ◉ Commercial      ③ ○ Legal    ④ ○ Security    ⑤ ○ Final│
│   Sandeep · 2h ago    waiting · Glimmora                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ CURRENT STAGE · COMMERCIAL                                                    │
│                                                                                │
│ Approver: Glimmora Commercial Team (auto-assigned)                            │
│ SLA: 48h · 22h remaining                                                      │
│                                                                                │
│ ── Stage checklist (visible to approver) ──                                   │
│ ☐ Rate cards apply to the in-scope skill set                                  │
│ ☐ Effort estimates fall within ±15% of historical                             │
│ ☐ Payment terms align with master agreement                                   │
│                                                                                │
│ ── Approve or send back ──                                                    │
│ Decision                                                                       │
│ ◉ Approve   ○ Send back   ○ Reject                                            │
│                                                                                │
│ Comment (visible in audit + on SOW)                                           │
│ [ textarea ]                                                                   │
│                                                                                │
│ ☐ Notify sponsor on decision                                                  │
│                                                                                │
│ [ Cancel ]                                          [ Submit decision ]       │
├──────────────────────────────────────────────────────────────────────────────┤
│ STAGE HISTORY                                                                  │
│ ① Business · Sandeep approved 2h ago                                          │
│    "Aligned with Q3 OKRs; budget pre-committed via PO-9421."                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States:**
- waiting (no approver activity yet)
- in_progress (approver opened it)
- decided (passed to next stage)
- sent_back (returned to sponsor)
- rejected (terminal — sponsor must clone to retry)

**Edge cases:**
- Approver delegates → delegate badge; delegate may approve on behalf of
- Stage SLA breached → escalation per policy (auto-notify next-up)
- Send back from stage 4 → SOW returns to sponsor with stage history preserved; sponsor resubmits as v(n+1)
- Two approvers configured for stage → require both sign-offs

**Cognitive load:** approver only sees their stage's controls (other stages read-only). Stage checklist makes the policy-required checks explicit.

**Cross-portal:** audit event per stage decision; notifications to sponsor; on Final approval, project provisioning kicks off (cross-fn doc 05).

---

#### 5.C.10 SOW templates — `/enterprise/sow/templates`
**Phase 1** · SOW §3.1.MVP.1 · 🚧 BUILD

**Use case:** admin defines SOW intake templates per client business unit / project type.

```
┌──────────────────────────────────────────────────────────────┐
│ SOW Templates                                  [ + New template ]
├──────────────────────────────────────────────────────────────┤
│ NAME                  │ USE CASE        │ APPROVERS  │ USED   │
│ ──────────────────────┼─────────────────┼────────────┼───────│
│ Design System Q-cycle │ Design / DevX   │ 5-stage    │ 12     │
│ Marketing campaign    │ MarTech         │ 3-stage    │ 8      │
│ Engineering project   │ Default         │ 5-stage    │ 24     │
└──────────────────────────────────────────────────────────────┘
```

Template editor (per template):
- Sections + required fields
- Default approver chain
- Default risk thresholds
- Default SLA
- Sample clauses pre-populated

---

### 5.D Decomposition

#### 5.D.1 Decomposition list — `/enterprise/decomposition`
**Phase 1** · SOW §3.1.MVP.2 · ✅ KEEP polish

**Use case:** browse decomposition plans (one per approved SOW that's been or is being decomposed).

```
┌──────────────────────────────────────────────────────────────┐
│ Decomposition                                                  │
│ Approved SOWs ready to be broken into work plans              │
├──────────────────────────────────────────────────────────────┤
│ [ Ready 3 ] [ In progress 2 ] [ Approved 8 ] [ All 13 ]      │
├──────────────────────────────────────────────────────────────┤
│ SOW              │ STATE       │ MILESTONES │ TASKS │ PMO    │
│ ─────────────────┼─────────────┼────────────┼───────┼───────│
│ Helios Q3        │ Ready       │      —     │   —   │  —    │
│ Reporting V2     │ In progress │      3     │  18   │ Anjali│
│ Auth modernize   │ Approved    │      4     │  22   │ Lakshmi│
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.D.2 Decomposition workspace — `/enterprise/decomposition/[planId]`
**Phase 1** · SOW §3.1.MVP.2 · ✅ KEEP polish

**Use case:** the PMO turns a SOW into a milestone + task graph with AI assist.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Decomposition · Reporting V2                                                │
│ Status: In progress · 3 milestones · 18 tasks · ready for approval at 100%   │
│ [ Save as draft ]   [ Submit for sponsor approval → ]                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ SOW SUMMARY (collapsed by default)                          [ ▾ Expand ]      │
├──────────────────────────────────────────────────────────────────────────────┤
│ MILESTONES                                                                     │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ M1 · Data plumbing                            [ Edit ] [ Tasks (6) ▾ ]   │ │
│ │  Owner: Anjali · Due: 2026-06-30                                          │ │
│ │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │  │ T1 · Connect Snowflake source         · React,SQL,L3  · 8h         │  │ │
│ │  │ T2 · ETL spec                          · SQL,L3        · 12h        │  │ │
│ │  │ T3 · Data validation suite             · Python,L2     · 16h        │  │ │
│ │  │ ...                                                                  │  │ │
│ │  └────────────────────────────────────────────────────────────────────┘  │ │
│ │  [ + Add task ]                                                            │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ M2 · Report builder UI                       [ Edit ] [ Tasks (8) ▾ ]    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ M3 · Export & schedules                      [ Edit ] [ Tasks (4) ▾ ]    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ [ + Add milestone ]                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ ── DEPENDENCIES & CRITICAL PATH ──                                            │
│ [ Graph view ] [ List view ]                                                  │
│ Critical path: M1 → M2 → M3 (estimated 67 days)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ ── AI ASSIST ──                                                               │
│ ✦ Suggested missing task: "Stakeholder acceptance walkthrough" (M3)          │
│ ✦ T7 may have an unmet dependency on T2 — review                             │
│ [ Show all 4 suggestions ]                                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States:** draft · in_progress · ready_for_approval · approved · rejected

**Edge cases:**
- Task without skill tag → soft warn at the row level
- Cycle in dependencies → block submit with explicit error and graph highlight
- PMO adds 100+ tasks → keep performance OK; paginated view
- Concurrent edit by two PMOs → last-write-wins with conflict toast (cross-fn doc 05)

**Cognitive load:**
- Milestones collapsible; default expanded only for the one being worked on
- Critical path computed on save
- AI assist quiet on the right, doesn't interrupt

---

#### 5.D.3 Task editor (within decomposition)
**Phase 1**

Modal or inline expansion when "Edit" on a task row:
```
┌──────────────────────────────────────────────────────────────┐
│ Edit task                                                      │
│                                                                │
│ Title                                                          │
│ [ Connect Snowflake source                                  ]  │
│                                                                │
│ Brief                                                          │
│ [ textarea ]                                                   │
│                                                                │
│ Acceptance criteria                                            │
│ ✓ Read access from analytics warehouse                        │
│ ✓ Network policy whitelisted                                  │
│ ✓ Connection pool configured                                  │
│ [ + Add criterion ]                                            │
│                                                                │
│ Skills required                  Skill level                  │
│ [ Python ▾ ]                     [ L2 ▾ ]                     │
│ [ + Add another skill ]                                        │
│                                                                │
│ Effort estimate (hours)          Priority                     │
│ [ 8 ]                            [ P1 ▾ ]                     │
│                                                                │
│ Depends on                                                    │
│ [ — none — ▾ ]                                                 │
│                                                                │
│ Reviewer routing                                              │
│ ◉ Mentor only                                                  │
│ ○ Mentor + Internal reviewer (two-stage)                      │
│   Internal reviewer: [ ▾ ]                                    │
│                                                                │
│ [ Cancel ]                              [ Save task ]         │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.D.4 Decomposition approval — `/enterprise/decomposition/[planId]/approve`
**Phase 1**

Standard sponsor approval surface — review plan, comments, approve or send back.

---

### 5.E Projects

#### 5.E.1 Projects list — `/enterprise/projects`
**Phase 1** · SOW §3.1.6 · ✅ KEEP polish

```
┌──────────────────────────────────────────────────────────────┐
│ Projects                                                       │
│ Active delivery projects (decomposed and provisioned SOWs)    │
├──────────────────────────────────────────────────────────────┤
│ Summary                                                        │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│ │Active  │ │On-track│ │At-risk │ │Done 30d│                  │
│ │  12    │ │   9    │ │   3    │ │   8    │                  │
│ └────────┘ └────────┘ └────────┘ └────────┘                  │
├──────────────────────────────────────────────────────────────┤
│ [ All ] [ At-risk ] [ My projects ] [ Completed ]            │
├──────────────────────────────────────────────────────────────┤
│ NAME              │ HEALTH    │ PROGRESS │ PMO    │ DUE     │
│ ──────────────────┼───────────┼──────────┼────────┼─────────│
│ Helios Q3         │ on-track  │ ▓▓▓▓ 62% │ Anjali │ Sep 30  │
│ Reporting V2      │ at-risk   │ ▓▓▓▓▓ 81%│ Sandeep│ Jul 15  │
│ Auth modernize    │ on-track  │ ▓▓ 22%   │ Lakshmi│ Aug 30  │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.E.2 Project detail (Overview) — `/enterprise/projects/[projectId]`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Projects · Reporting V2                                                     │
│ Sponsor: Sandeep · PMO: Anjali · Started Jun 1 · Due Jul 15 · at-risk          │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ Overview ][ Milestones ][ Tasks ][ Team ][ Exceptions ][ Budget ][ Audit ] │
├──────────────────────────────────────────────────────────────────────────────┤
│ HEALTH SUMMARY                                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│ │Progress  │ │SLA at-risk│ │Quality   │ │Burn      │                         │
│ │ 81%      │ │ 2 tasks   │ │ 92% acc  │ │ ₹4.2L/6L │                         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ MILESTONES OVERVIEW                                                           │
│ ● M1 Data plumbing       ▓▓▓▓▓▓▓▓▓▓ 100%  done                                │
│ ● M2 Report builder UI   ▓▓▓▓▓▓▓░░░  72%  on-track                            │
│ ○ M3 Export & schedules  ▓▓▓░░░░░░░  30%  at-risk · 2 blocked tasks           │
├──────────────────────────────────────────────────────────────────────────────┤
│ RECENT ACTIVITY                                                              │
│ • Task t-4821 reassigned to Kavi · 1h ago                                    │
│ • Task t-4811 submitted by Sneha · 3h ago                                    │
│ • Milestone M1 closed · yesterday                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ AI SIGNALS                                                                    │
│ › Forecast slip: M3 likely 3 days late at current pace                       │
│ › 2 tasks blocked on external dependency (Snowflake schema)                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

#### 5.E.3 Project — Milestones tab
**Phase 1**

Tabular and timeline (Gantt-lite) view of milestones in the project.

---

#### 5.E.4 Project — Tasks tab
**Phase 1**

Tabular view of all tasks; filter by state, assignee, milestone. Click row → task drill-in.

---

#### 5.E.5 Project — Task drill-in — `/enterprise/projects/[projectId]/tasks/[taskId]`
**Phase 1** · ✅ KEEP polish

Read-only view of a task from the enterprise perspective: brief, criteria, assigned contributor, current state, evidence (if submitted), reviewer activity, payout status.

---

#### 5.E.6 Project — Team tab
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Reporting V2 · Team                                            │
├──────────────────────────────────────────────────────────────┤
│ CONTRIBUTORS (8)                                              │
│ [Avatar] Sneha M.       Designer · L3 · 4 tasks ·  acceptance 100%
│ [Avatar] Kavi S.        Designer · L2 · 3 tasks ·  acceptance 85%
│ [Avatar] Yusuf O.       Backend  · L3 · 5 tasks ·  acceptance 95%
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ REVIEWERS (2)                                                 │
│ [Avatar] Priya I. (Mentor)  · 5 tasks reviewed                │
│ [Avatar] Karthik I. (Internal client reviewer) · 5 reviewed   │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** click any row → contributor's project-scoped profile (limited fields, no PII beyond what's needed for delivery).

---

#### 5.E.7 Project — Exceptions tab
**Phase 1** · SOW §3.1.6 · ✅ KEEP polish

```
┌──────────────────────────────────────────────────────────────┐
│ Reporting V2 · Exceptions                                      │
├──────────────────────────────────────────────────────────────┤
│ Open (3)                                                       │
│ ⚠ SLA at-risk · t-4811 · due in 4h · 80% complete             │
│   [ Extend SLA ] [ Reassign ] [ Escalate to mentor ]          │
│ ⚠ Blocked     · t-4823 · 2d blocked on Snowflake schema       │
│   [ Resolve dependency ] [ Reassign ]                         │
│ ⚠ Revision overdue · t-4801 · round 3 · 1d overdue            │
│   [ Discuss with reviewer ]                                   │
│                                                                │
│ Resolved (12)                                       [ Show ▾ ] │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** each action (extend, reassign, escalate) opens a confirm modal with audit reason.

---

#### 5.E.8 Project — Budget tab
**Phase 1** · SOW §3.1.MVP.6 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Reporting V2 · Budget                                          │
├──────────────────────────────────────────────────────────────┤
│ Budget        ₹6,00,000                                       │
│ Committed     ₹4,80,000  (80%)                                │
│ Paid          ₹2,40,000  (40%)                                │
│ Pending       ₹2,40,000                                       │
│ Forecast      ₹6,12,000  ⚠ 2% over                            │
├──────────────────────────────────────────────────────────────┤
│ BY MILESTONE                                                   │
│ M1 ₹2,00,000 committed · ₹2,00,000 paid · 100% closed         │
│ M2 ₹2,40,000 committed · ₹40,000 paid · 17% paid              │
│ M3 ₹40,000 committed · ₹0 paid · 0% paid                     │
├──────────────────────────────────────────────────────────────┤
│ BY ROLE / SKILL                                               │
│ Designer L2-L3   ₹1,80,000 (38%)                              │
│ Backend L3       ₹2,40,000 (50%)                              │
│ Data L2          ₹60,000 (12%)                                │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.E.9 Completed projects — `/enterprise/projects/completed`
**Phase 1**

List of closed projects with summary metrics.

---

### 5.F Reviewer (sub-portal)

The reviewer sub-portal is for the **internal client reviewer** (Persona `ent.reviewer`) — the second stage of two-stage review per SOW §3.1.MVP.5.

#### 5.F.1 Reviewer dashboard — `/enterprise/reviewer`
**Phase 1** · ✅ KEEP polish

```
┌──────────────────────────────────────────────────────────────┐
│ Reviewer queue                                                │
│ Welcome, Karthik. You have 4 pending reviews.                 │
├──────────────────────────────────────────────────────────────┤
│ Summary                                                        │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│ │Pending │ │SLA risk│ │Done 7d │ │Avg time│                  │
│ │   4    │ │   1    │ │   12   │ │ 28 min │                  │
│ └────────┘ └────────┘ └────────┘ └────────┘                  │
├──────────────────────────────────────────────────────────────┤
│ [ Queue ]  [ History ]  [ My metrics ]                       │
├──────────────────────────────────────────────────────────────┤
│ PENDING (4)                                                    │
│ ⚠ Date Picker · Helios · Sneha · due 2h    [ Review → ]       │
│   Mentor accepted · 4 of 6 criteria validated                 │
│ ⚠ CSV export · Reporting · Yusuf · due 5h   [ Review → ]      │
│ ⚪ Auth modal · Helios · Kavi · due 2d        [ Review → ]      │
│ ⚪ Search shortcuts · Helios · Sneha · due 3d [ Review → ]      │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.F.2 Review queue — `/enterprise/reviewer/queue`
**Phase 1**

Full queue with filters (state, project, mentor, contributor, SLA).

---

#### 5.F.3 Review detail — `/enterprise/reviewer/queue/[reviewId]`
**Phase 1** · SOW §3.1.MVP.5 · ✅ KEEP polish

**Use case:** reviewer decides accept / reject / rework on a mentor-approved submission.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Queue · Date Picker · Helios Q3 · Sneha M.                                  │
│ Submitted: Round 2 · 14m ago · Mentor accepted 12m ago · SLA: 2h              │
├──────────────────────────────────────────────────────────────────────────────┤
│ EVIDENCE                                                                       │
│ ┌──────────────────────────────────────────────────────────┐                  │
│ │ 📄 spec.md             [ View ]                          │                  │
│ │ 📄 demo.mp4            [ Play ]                          │                  │
│ │ 📄 tests.txt           [ View ]                          │                  │
│ │ 📄 aria-test.md        [ View ]                          │                  │
│ └──────────────────────────────────────────────────────────┘                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ACCEPTANCE CRITERIA                                                            │
│ ✓ Focus trap on open                          (Mentor: ⭐⭐⭐⭐⭐)              │
│ ✓ ESC closes and restores focus               (Mentor: ⭐⭐⭐⭐⭐)              │
│ ✓ TAB cycles within picker                    (Mentor: ⭐⭐⭐⭐☆)              │
│ ✓ SHIFT-TAB reverses cycle                    (Mentor: ⭐⭐⭐⭐⭐)              │
│ ✓ Screen reader announces month change        (Mentor: ⭐⭐⭐⭐☆)              │
│ ✓ Mobile touch outside dismisses              (Mentor: ⭐⭐⭐⭐⭐)              │
│                                                                                │
│ Mentor's note: "Strong submission. All criteria met. Recommend acceptance."   │
├──────────────────────────────────────────────────────────────────────────────┤
│ YOUR DECISION                                                                 │
│ ◉ Accept   ○ Request rework   ○ Reject                                        │
│                                                                                │
│ Comment (required for rework/reject; visible to contributor)                  │
│ [ textarea ]                                                                   │
│                                                                                │
│ [ Cancel ]                                          [ Submit decision ]       │
├──────────────────────────────────────────────────────────────────────────────┤
│ COVER NOTE FROM CONTRIBUTOR                                                   │
│ "Tested in Chrome, Firefox, Safari + mobile Safari. Added aria-live region   │
│  for month change as per round 1 feedback."                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States:** default · submitting · accepted · rejected · rework_requested

**Edge cases:**
- Mentor rejected → review skipped (never reaches enterprise reviewer)
- Reviewer reject reason empty → block submit
- SLA breached → escalation banner; default to mentor's decision after grace period (per policy)
- Two reviewers configured for same task (rare) → require both, surface partial state

**Cognitive load:** mentor's scoring shown but not editable; reviewer makes a yes/no/back decision, not re-grade.

**Cross-portal:** decision writes audit event; on accept → payout eligible (cross-fn doc 05); on reject/rework → contributor revision flow.

---

#### 5.F.4 Review history — `/enterprise/reviewer/history`
**Phase 1**

Paginated list of past decisions; reviewer-personal metrics block.

---

#### 5.F.5 Reviewer metrics
**Phase 1**

Personal page: avg review time, agreement with mentor, accept rate, SLA hit rate. Read-only.

---

### 5.G Billing

#### 5.G.1 Billing overview — `/enterprise/billing`
**Phase 1** · SOW §3.1.7 · ✅ KEEP polish

```
┌──────────────────────────────────────────────────────────────┐
│ Billing                                                        │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ This period: Jun 2026                                     │ │
│ │ Invoiced            ₹14,80,400                            │ │
│ │ Paid                ₹12,00,000                            │ │
│ │ Pending             ₹2,80,400                             │ │
│ │ Contributor payouts ₹9,60,000 (committed)                 │ │
│ │ Platform fees       ₹1,44,000 (15%)                       │ │
│ └──────────────────────────────────────────────────────────┘ │
│ [ Invoices ]  [ Rate Cards ]  [ Payouts ]  [ Export ]        │
├──────────────────────────────────────────────────────────────┤
│ RECENT INVOICES                                                │
│ INV-3082 · ₹2,40,000 · paid · May 28                          │
│ INV-3081 · ₹1,80,000 · pending · May 25                       │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.G.2 Invoices list — `/enterprise/billing/invoices`
**Phase 1**

Standard list with filters: status, project, date range, amount range. Export button at top-right.

---

#### 5.G.3 Invoice detail — `/enterprise/billing/invoices/[invoiceId]`
**Phase 1** · ✅ KEEP polish

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Invoices · INV-3082                                                         │
│ ₹2,40,000 · paid May 28 · For: Reporting V2 · Period: May 1–31                │
│ [ Download PDF ] [ Download CSV ] [ Audit trail ]                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ LINE ITEMS                                                                    │
│ TASK             │ ROLE      │ SKILL/LEVEL │ HOURS │ RATE   │ AMOUNT          │
│ ─────────────────┼───────────┼─────────────┼───────┼────────┼───────         │
│ Connect Snowflake│ Backend   │ Python L2   │  8    │ ₹1,500 │ ₹12,000         │
│ ETL spec         │ Backend   │ SQL L3      │ 12    │ ₹2,000 │ ₹24,000         │
│ ...                                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ TOTALS                                                                        │
│ Subtotal              ₹2,08,696                                               │
│ Platform fee (15%)    ₹31,304                                                 │
│ Total                 ₹2,40,000                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ PAYMENT                                                                       │
│ Method: Bank transfer to Acme corporate account                               │
│ Reference: TRX-9421                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

#### 5.G.4 Rate cards list — `/enterprise/billing/rate-cards`
**Phase 1** · SOW §3.1.MVP.6 · 🚧 BUILD (unseal)

```
┌──────────────────────────────────────────────────────────────┐
│ Rate Cards                                  [ + New rate card ]
│ Effective and historical rate cards                            │
├──────────────────────────────────────────────────────────────┤
│ [ Active 2 ] [ Draft 1 ] [ Expired 4 ] [ All 7 ]             │
├──────────────────────────────────────────────────────────────┤
│ NAME              │ SCOPE      │ EFFECTIVE   │ ROWS │ STATUS │
│ ──────────────────┼────────────┼─────────────┼──────┼────────│
│ Standard 2026     │ Global     │ Jan 1, 2026 │  84  │ Active │
│ Helios Q3 special │ Project    │ Jun 1, 2026 │  18  │ Active │
│ Reporting V2 spec │ Project    │ Jul 15-Aug  │  12  │ Draft  │
│ Standard 2025     │ Global     │ Jan-Dec '25 │  76  │ Expired│
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.G.5 New rate card — `/enterprise/billing/rate-cards/new`
**Phase 1** · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ New rate card                                                  │
├──────────────────────────────────────────────────────────────┤
│ NAME                                                           │
│ [ Standard 2026                                            ]   │
│                                                                │
│ SCOPE                                                          │
│ ◉ Tenant-wide   ○ Specific projects [ select ]   ○ Per SOW    │
│                                                                │
│ CURRENCY                                                       │
│ [ INR (₹) ▾ ]                                                 │
│                                                                │
│ EFFECTIVE                                                      │
│ From [ 2026-06-01 ]    To [ no expiry  ▾ ]                    │
├──────────────────────────────────────────────────────────────┤
│ RATES                                                          │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Role          │ Skill         │ Level │ Region │ Rate    │ │
│ │ ──────────────┼───────────────┼───────┼────────┼─────────│ │
│ │ Designer      │ Figma         │ L2    │ India  │ ₹1,200/h│ │
│ │ Designer      │ Figma         │ L3    │ India  │ ₹1,800/h│ │
│ │ Backend       │ Python        │ L2    │ India  │ ₹1,500/h│ │
│ │ Backend       │ Python        │ L3    │ India  │ ₹2,200/h│ │
│ │ ...                                                       │ │
│ └──────────────────────────────────────────────────────────┘ │
│ [ + Add row ]   [ Bulk upload CSV ]   [ Use template ▾ ]    │
├──────────────────────────────────────────────────────────────┤
│ PREVIEW                                                       │
│ This rate card would have priced 24 active tasks at total     │
│ ₹4,80,000 vs prior rate card's ₹4,12,000 (+16.5%).            │
├──────────────────────────────────────────────────────────────┤
│ [ Cancel ]   [ Save as draft ]      [ Save & activate ]      │
└──────────────────────────────────────────────────────────────┘
```

**Edge cases:**
- Overlapping active card (same scope + same effective range) → block save, surface conflict
- Bulk upload validation fails → show row-level errors with line numbers
- Preview shows large delta (> 20%) → soft warn "Significant change — confirm?"

**Cognitive load:** preview answers "what does this change cost?" before commit.

**Cross-portal:** audit event; affects future task pricing.

---

#### 5.G.6 Rate card detail — `/enterprise/billing/rate-cards/[cardId]`
**Phase 1**

Read-mode view; "Edit" duplicates as new draft; archive when expired.

---

#### 5.G.7 Payouts ledger — `/enterprise/billing/payouts`
**Phase 1** · SOW §3.1.MVP.6 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Payouts                                                        │
├──────────────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│ │Eligible│ │Pending │ │Paid 30d│ │Reversed│                  │
│ │ ₹2,40k │ │ ₹80k   │ │ ₹12,0L │ │ ₹14k   │                  │
│ └────────┘ └────────┘ └────────┘ └────────┘                  │
├──────────────────────────────────────────────────────────────┤
│ [ All ] [ Eligible ] [ Pending ] [ Paid ] [ Reversed ]       │
├──────────────────────────────────────────────────────────────┤
│ DATE    │ CONTRIBUTOR │ TASK         │ AMOUNT │ STATUS  │ REF │
│ ────────┼─────────────┼──────────────┼────────┼─────────┼────│
│ May 28  │ Sneha M.    │ Date Picker  │ ₹1,800 │ paid    │9421│
│ May 28  │ Yusuf O.    │ ETL spec     │ ₹2,400 │ paid    │9420│
│ May 26  │ Kavi S.     │ Auth modal   │ ₹1,500 │ pending │ —  │
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ [ Release pending batch ] [ Export ]                          │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** release pending batch → confirmation modal listing count + total; admin signs off; cross-fn calls payment rail.

---

#### 5.G.8 Payout detail — `/enterprise/billing/payouts/[payoutId]`
**Phase 1**

Single payout view: task link, contributor, amount, ledger trail (eligible → pending → paid), reversal option (admin).

---

#### 5.G.9 Billing export — `/enterprise/billing/export`
**Phase 1** · SOW §3.1.MVP.6 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Export billing                                                 │
│                                                                │
│ Time range                                                     │
│ [ This period ▾ ]                                             │
│                                                                │
│ Scope                                                          │
│ ☑ Invoices                                                     │
│ ☑ Payouts                                                      │
│ ☐ Per-task ledger                                             │
│ ☐ Audit events (separate from /audit/export)                 │
│                                                                │
│ Format                                                         │
│ ◉ CSV   ○ PDF   ○ JSON                                         │
│                                                                │
│ ERP destination (optional)                                     │
│ ◉ Download only                                                │
│ ○ Push to ERP via configured integration                       │
│                                                                │
│ [ Cancel ]                              [ Generate ]          │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.H Audit (unified)

#### 5.H.1 Audit log — `/enterprise/audit`
**Phase 1** · SOW §3.1.MVP.8, §14 · 🚧 BUILD (consolidate fragmented audit)

**Use case:** every consequential action in the tenant, immutable, searchable, exportable.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Audit log                                                                     │
│ Immutable record of every consequential action in Acme Corp                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ FILTERS                                                                       │
│ Actor      [ Any ▾ ]                                                          │
│ Resource   [ Any ▾ ]    Specific  [ ____________ ]                            │
│ Action     [ Any ▾ ]                                                          │
│ Time       [ Last 30 days ▾ ]                                                 │
│ Severity   [ Any ▾ ]                                                          │
│            [ Apply ]   [ Clear ]   [ Save filter ]                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIMESTAMP        │ ACTOR        │ ACTION         │ RESOURCE      │ SEVERITY  │
│ ──────────────────┼──────────────┼────────────────┼───────────────┼──────────│
│ 12:14:32 May 26   │ Sandeep K.   │ sow.approve    │ sow:1042      │ info      │
│ 12:10:08 May 26   │ Anjali R.    │ task.reassign  │ task:t-4811   │ info      │
│ 12:02:55 May 26   │ Karthik I.   │ review.accept  │ review:r-202  │ info      │
│ 11:48:01 May 26   │ Glimmora     │ sow.advance    │ sow:1042      │ info      │
│ 11:30:14 May 26   │ Finance auto │ payout.release │ payout:p-981  │ info      │
│ ⚠ 10:22:55 May 26 │ Kavi S.      │ payout.method  │ payout:method │ warning   │
│   .added         │              │                │               │           │
│ 09:50:12 May 26   │ Anjali R.    │ task.create    │ task:t-4823   │ info      │
│ ...                                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ Rows per page [25]                     [ Export results ]  [ Subscribe RSS ] │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Edge cases:**
- Compliance / Admin → see all events; other roles → scoped to actions affecting their resources
- Search by exact ID → highlights match
- Time range > 90 days → warn about volume, suggest export instead

**Cognitive load:** simple table; one event per row; click for detail.

---

#### 5.H.2 Audit event detail — `/enterprise/audit/[eventId]`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ ← Audit                                                        │
├──────────────────────────────────────────────────────────────┤
│ EVENT  sow.approve                                             │
│ At     2026-05-26 12:14:32 IST                                 │
│ Actor  Sandeep Kumar (sponsor)                                 │
│ Source IP: 203.0.113.42 · UA: Chrome 137                       │
│                                                                │
│ Resource  sow:1042 (Helios Q3 modernization)                  │
│ Stage     Business                                             │
│                                                                │
│ Payload                                                        │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ { "decision": "approve",                                   │ │
│ │   "comment": "Aligned with Q3 OKRs; PO-9421",             │ │
│ │   "stageFrom": "business",                                │ │
│ │   "stageTo": "commercial" }                               │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ Before / after (diff)                                          │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ - stage: "business" (waiting)                              │ │
│ │ + stage: "commercial" (waiting)                            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ [ Copy event JSON ]                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.H.3 Audit export — `/enterprise/audit/export`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Export audit                                                   │
│                                                                │
│ Time range                                                     │
│ [ Last 30 days ▾ ]                                            │
│                                                                │
│ Filter same as current view ☑                                 │
│                                                                │
│ Format                                                         │
│ ◉ CSV   ○ JSON   ○ NDJSON                                      │
│                                                                │
│ Sign with tenant key (for legal evidence) ☐                   │
│                                                                │
│ [ Cancel ]                              [ Generate ]          │
└──────────────────────────────────────────────────────────────┘
```

**Cross-portal:** signed exports are tamper-evident; integrates with cross-fn audit signing service (doc 05).

---

### 5.I Compliance (Phase 1 baseline)

#### 5.I.1 Compliance overview — `/enterprise/compliance`
**Phase 1** · SOW §3.1.8 · 🚧 BUILD (baseline)

```
┌──────────────────────────────────────────────────────────────┐
│ Compliance                                                     │
│ Baseline controls for Phase 1; deep features in Phase 2       │
├──────────────────────────────────────────────────────────────┤
│ CONSENT INVENTORY                          [ Manage → ]       │
│ 84 contributors with consent on file                          │
│ 0 missing required consents                                   │
│                                                                │
│ DATA RETENTION                             [ Configure → ]    │
│ Audit events: indefinite                                      │
│ Task evidence: 7 years                                        │
│ Withdrawn submissions: 90 days                                │
│                                                                │
│ DELETION REQUESTS                          [ Review → ]       │
│ 0 pending                                                     │
│ 2 completed last 30 days                                      │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.I.2 Consent inventory — `/enterprise/compliance/consent`
**Phase 1**

List of contributors × consents (T&Cs version, Privacy, AI guidance, notification channels). Search, export.

---

#### 5.I.3 Data retention — `/enterprise/compliance/retention`
**Phase 1**

Per-entity retention rules. Read-modify-write requires admin + compliance role.

---

### 5.J Analytics (Phase 1 baseline)

#### 5.J.1 Analytics index — `/enterprise/analytics`
**Phase 1** · SOW §3.1.6 · 🚧 BUILD (baseline; deep Phase 2)

Two basic dashboards: Workforce + Economic.

---

#### 5.J.2 Workforce intelligence — `/enterprise/analytics/workforce`
**Phase 1** · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Workforce intelligence · Last 90 days                          │
├──────────────────────────────────────────────────────────────┤
│ Skills inventory (top 10)                                     │
│ React        ████████████████ 48 contributors                 │
│ Python       ████████████ 36                                  │
│ Figma        █████████ 28                                     │
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ Skill gaps (tasks waiting > 48h to match)                    │
│ Snowflake L3      8 tasks                                     │
│ Rust L2           3 tasks                                     │
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ Throughput by week                                            │
│ [bar chart: tasks completed per week]                         │
├──────────────────────────────────────────────────────────────┤
│ Acceptance rate                                               │
│ Overall: 87% · Trend: +3pt vs last quarter                   │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.J.3 Economic — `/enterprise/analytics/economic`
**Phase 1** · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Economic · Last 90 days                                        │
├──────────────────────────────────────────────────────────────┤
│ Spend                                                          │
│ Total committed: ₹48,40,000                                   │
│ Total paid:      ₹42,80,000                                   │
│ Platform fees:   ₹6,06,000 (15%)                              │
├──────────────────────────────────────────────────────────────┤
│ Cost per skill (top 10)                                       │
│ [stacked bar by skill]                                        │
├──────────────────────────────────────────────────────────────┤
│ Cost per project (top 5)                                      │
│ Reporting V2     ₹14,40,000                                   │
│ Helios Q3        ₹12,80,000                                   │
│ Auth modernize   ₹6,40,000                                    │
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ Savings vs traditional (baseline estimate)                    │
│ vs salaried headcount: ~34% (rough)                          │
└──────────────────────────────────────────────────────────────┘
```

> **Note:** SOW (§19.4) calls for economic dashboards with "spend, savings, ROI." Phase 1 = these three views. Phase 2 = drilldowns, forecasts, scenario modeling.

---

### 5.K Settings

#### 5.K.1 Tenant & roles — `/enterprise/settings/tenant`
**Phase 1** · SOW §3.1.6 · 🔧 EXPAND

```
┌──────────────────────────────────────────────────────────────┐
│ Tenant & roles                                                 │
├──────────────────────────────────────────────────────────────┤
│ TENANT                                                         │
│ Name        [ Acme Corp                                ]      │
│ Tenant ID   acme-corp                                         │
│ Domain      acme.com  (verified)                              │
│ Subscription Enterprise · renew Dec 2026                      │
│ [ Edit tenant info ]                                          │
├──────────────────────────────────────────────────────────────┤
│ ROLES & MEMBERS                            [ + Invite ]       │
│ NAME              │ EMAIL              │ ROLES        │ STATUS│
│ ───────────────────┼────────────────────┼──────────────┼──────│
│ Sandeep Kumar     │ sandeep@acme.com   │ sponsor      │ active│
│ Anjali Reddy      │ anjali@acme.com    │ pmo, admin   │ active│
│ Karthik Iyer      │ karthik@acme.com   │ reviewer, it │ active│
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.K.2 Invite member modal
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Invite a member                                                │
│                                                                │
│ Email                                                          │
│ [ ________________________________ ]                          │
│                                                                │
│ Roles                                                          │
│ ☐ Admin                                                        │
│ ☐ Sponsor                                                      │
│ ☑ PMO                                                          │
│ ☐ Finance                                                      │
│ ☐ Compliance                                                   │
│ ☐ Reviewer                                                     │
│ ☐ Procurement                                                  │
│ ☐ IT                                                           │
│                                                                │
│ Personal note (optional)                                       │
│ [ textarea ]                                                   │
│                                                                │
│ [ Cancel ]                              [ Send invite ]       │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** SoD warning if user selects mutually exclusive roles (finance + procurement).

---

#### 5.K.3 Integrations — `/enterprise/settings/integrations`
**Phase 1** · SOW §3.1.MVP.9 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Integrations                                                   │
├──────────────────────────────────────────────────────────────┤
│ IDENTITY & ACCESS                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🔐 SSO (SAML / OIDC)                              [ ✓ ]  │ │
│ │     Connected to Acme Azure AD                            │ │
│ │     [ Manage ]                                            │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ HR & TALENT                                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 👥 HRIS                                            [ — ]  │ │
│ │     Not connected. Connect to sync employees.            │ │
│ │     [ Connect ]                                           │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ PROJECT TOOLS                                                  │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🛠 Webhooks (Jira / Azure DevOps / generic)        [ ✓ ]  │ │
│ │     3 webhooks active                                     │ │
│ │     [ Manage ]                                            │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ FINANCE & PROCUREMENT                                          │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 💰 ERP (basic)                                     [ — ]  │ │
│ │     Connect to push invoices/payouts.                    │ │
│ │     [ Connect ]                                           │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.K.4 SSO config — `/enterprise/settings/integrations/sso`
**Phase 1** · SOW §3.1.MVP.8 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ SSO configuration                                              │
├──────────────────────────────────────────────────────────────┤
│ PROVIDER                                                       │
│ ◉ SAML 2.0   ○ OIDC                                           │
│                                                                │
│ IdP METADATA                                                   │
│ ◉ Upload metadata XML                                          │
│ ○ Paste URL                                                    │
│ ○ Manual entry                                                 │
│ [ Choose file ]                                                │
│                                                                │
│ CLAIM MAPPING                                                  │
│ Email             [ NameID                              ]     │
│ Display name      [ http://schemas...givenname          ]     │
│ Roles             [ groups (mapped to Glimmora roles)   ]     │
│   ┌────────────────────────────────────────────────────┐     │
│   │ IdP group           → Glimmora role                 │     │
│   │ glm-sponsors        → sponsor                       │     │
│   │ glm-pmo             → pmo                           │     │
│   │ glm-finance         → finance                       │     │
│   │ ...                                                  │     │
│   └────────────────────────────────────────────────────┘     │
│                                                                │
│ TESTING                                                        │
│ [ Test login as Sandeep ]                                     │
│                                                                │
│ ENFORCEMENT                                                    │
│ ☐ Require SSO for all members (block password login)         │
│                                                                │
│ [ Cancel ]                              [ Save & activate ]   │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** test login → side-panel with success/failure + claim inspection.

---

#### 5.K.5 HRIS config — `/enterprise/settings/integrations/hris`
**Phase 1** · SOW §3.1.MVP.9 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ HRIS sync                                                      │
├──────────────────────────────────────────────────────────────┤
│ PROVIDER                                                       │
│ [ Workday ▾ ]   (also: BambooHR, SAP SuccessFactors, custom)  │
│                                                                │
│ AUTH                                                           │
│ ◉ API key      ○ OAuth                                         │
│ API key  [ ********************** ]   [ Test ]                │
│                                                                │
│ FIELD MAPPING (min required fields)                           │
│ Employee ID     [ workday.employeeNumber          ]   ✓       │
│ Display name    [ workday.preferredName           ]   ✓       │
│ Role            [ workday.jobTitle                ]   ✓       │
│ Org / dept      [ workday.organization            ]   ✓       │
│ Manager         [ workday.manager.employeeNumber  ]   ✓       │
│ Cost center     [ workday.costCenter              ]   ✓       │
│                                                                │
│ FILTER (which employees to sync)                              │
│ [ All / department=Engineering / status=Active ▾ ]            │
│                                                                │
│ SCHEDULE                                                       │
│ ◉ Daily 03:00 IST   ○ Weekly   ○ Manual only                  │
│                                                                │
│ PREVIEW                                                        │
│ [ Preview next sync ] → shows 248 employees to add/update/remove
│                                                                │
│ [ Cancel ]                              [ Save & enable ]     │
└──────────────────────────────────────────────────────────────┘
```

**Edge cases:**
- Preview detects > 10% deletions → safety warning, requires confirm
- Field mapping invalid → block save with row-level error
- Sync runs → progress in real-time at top of integrations page

---

#### 5.K.6 Webhooks — `/enterprise/settings/integrations/webhooks`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Webhooks                                   [ + New webhook ]  │
├──────────────────────────────────────────────────────────────┤
│ EVENT                       │ URL                  │ ENABLED  │
│ ────────────────────────────┼──────────────────────┼─────────│
│ task.completed              │ https://jira.acme... │   ✓     │
│ task.created                │ https://jira.acme... │   ✓     │
│ project.health.changed      │ https://hooks.slack..│   ✓     │
└──────────────────────────────────────────────────────────────┘
```

New webhook modal: event type → URL → secret → headers → test fire.

---

#### 5.K.7 ERP / procurement (basic) — `/enterprise/settings/integrations/erp`
**Phase 1** · SOW §3.1.7 · 🚧 BUILD (basic)

```
┌──────────────────────────────────────────────────────────────┐
│ ERP & procurement (basic)                                      │
├──────────────────────────────────────────────────────────────┤
│ MODE                                                           │
│ ◉ File drop (SFTP / S3)   ○ API push   ○ Manual export only   │
│                                                                │
│ FILE DROP DESTINATION                                          │
│ [ sftp://erp.acme.com/glimmora/billing                     ]  │
│ Auth: [ SSH key ▾ ]                                           │
│                                                                │
│ FREQUENCY                                                      │
│ ◉ Weekly Mon 06:00 IST   ○ Monthly                            │
│                                                                │
│ INCLUDE                                                        │
│ ☑ Invoices  ☑ Payouts  ☐ Audit                                │
│                                                                │
│ GL CODE MAPPING                                                │
│ Skill bucket → GL code                                        │
│ ┌────────────────────────────────────────────────────┐         │
│ │ Engineering   → 5100                               │         │
│ │ Design        → 5200                               │         │
│ │ Data          → 5300                               │         │
│ │ ...                                                 │         │
│ └────────────────────────────────────────────────────┘         │
│                                                                │
│ PO MAPPING                                                     │
│ ☑ Each project must have a PO before tasks can be priced     │
│                                                                │
│ [ Cancel ]                              [ Save & enable ]     │
└──────────────────────────────────────────────────────────────┘
```

> **SOW positioning:** §3.1.7 calls for procurement connectivity in MVP. Phase 1 = file drop + GL mapping + PO requirement flag. Phase 2 = real-time API + multi-entity invoicing.

---

#### 5.K.8 Policies — `/enterprise/settings/policies`
**Phase 1** · SOW §4.3 · 🚧 BUILD

Sub-routes:
- `policies/sla` — SLA templates per work type
- `policies/escalation` — escalation chain on SLA breach
- `policies/governance` — risk thresholds, AI confidence floors, audit retention

#### 5.K.8.a SLA templates — `/enterprise/settings/policies/sla`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ SLA templates                              [ + New template ] │
├──────────────────────────────────────────────────────────────┤
│ WORK TYPE         │ INTAKE │ DECOMP │ REVIEW │ ACCEPT │ TOTAL │
│ ───────────────────┼────────┼────────┼────────┼────────┼──────│
│ Software project  │  3d    │  5d    │  2d    │  1d    │  30d  │
│ Design system     │  2d    │  3d    │  1d    │  1d    │  21d  │
│ Marketing         │  1d    │  2d    │  1d    │  0.5d  │  14d  │
└──────────────────────────────────────────────────────────────┘
```

#### 5.K.8.b Escalation rules
**Phase 1**

Per work type: on SLA breach → notify (PMO / sponsor) → if unresolved (4h) → notify admin → if unresolved (8h) → auto-reassign attempt.

#### 5.K.8.c Governance thresholds
**Phase 1**

- Min AI confidence to surface a suggestion: [ 70% ▾ ]
- Min mentor stars to auto-route to client reviewer: [ 4 ▾ ]
- Audit retention: [ Indefinite ▾ ]
- Consent expiry: [ Never / 1yr / 2yr ▾ ]

---

#### 5.K.9 Security — `/enterprise/settings/security`
**Phase 1** · SOW §3.1.MVP.8 · ✅ KEEP

Existing MFA card + Sessions card; extended with:
- IP allowlist (optional, off by default)
- Session timeout policy (default 30 days; admin can shorten)
- Audit signing key management

---

### 5.L Notifications

#### 5.L.1 Notifications page — `/enterprise/notifications`
**Phase 1** · ✅ KEEP

Same pattern as contributor notifications: filterable list with mark-read; click row → context.

---

### 5.M Profile

#### 5.M.1 User profile — `/enterprise/profile`
**Phase 1**

Lightweight: name, email, roles, MFA status, sessions, language, link to tenant settings.

---

## 6. Shared component patterns

References (all defined in contributor spec §6 or here):
- Status chips · readiness bars · version conflict · empty state · toast · scan modal · confirmation modal

### 6.1 Approval pipeline component
Reusable across SOW approval, Decomposition approval, and project closure. 5-stage version is the canonical pattern; 3-stage variant for simpler workflows.

### 6.2 Resource-with-tabs layout
Used by Project detail. Tabs are URL segments. Default tab is Overview. Tab badges show counts.

### 6.3 Filter drawer
Same pattern as contributor §6 with role-aware default filters.

### 6.4 Bulk import modal
Used by rate cards (CSV) and HRIS (preview). Surfaces row-level validation errors with line numbers.

### 6.5 SoD warning
Modal pattern when an admin assigns mutually-exclusive roles to a user.

---

## 7. State machines

### 7.1 SOW lifecycle

```
[Draft] ── submit ──> [Review · Business] ─ approve ─> [Commercial] ─ ... ─> [Final] ─ approve ─> [Approved]
                                │                                                │
                                │ send back                                       │ send back
                                ▼                                                ▼
                          [Draft] (v+1)                                    [Draft] (v+1)
                                │
                                │ reject (terminal)
                                ▼
                          [Rejected]
                                │
                                │ clone
                                ▼
                          [Draft] (new SOW)
```

### 7.2 Decomposition lifecycle

```
[Pending] (after SOW approved) ── open ──> [In progress]
                                                │
                                                ▼
                                          [Ready for sponsor approval]
                                                │ approve            │ send back
                                                ▼                    ▼
                                          [Approved]         [In progress]
                                                │
                                                ▼
                                          [Project provisioned]
```

### 7.3 Project lifecycle

```
[Provisioned] ── tasks executed ──> [Active]
                                          │
                                          ├ on-track │ at-risk │ blocked (signals, not states)
                                          │
                                          ▼ all milestones done
                                    [Pending close]
                                          │
                                          ▼ sponsor confirms
                                    [Closed]
```

### 7.4 Reviewer decision lifecycle

```
[Queued] (after mentor accepts) ── reviewer opens ──> [In review]
                                                          │
                                                          ├ accept ──> [Closed: accepted]
                                                          ├ rework ──> contributor revision
                                                          └ reject ──> contributor sees, can dispute
```

---

## 8. Cross-portal touchpoints

| Event in enterprise portal | Affects | Cross-fn doc |
|---|---|---|
| SOW approved (final) | Decomposition provisioning starts | 05 |
| Decomposition approved | Tasks become available for matching | 05 |
| Task created in decomposition | Contributor matching surface | 01 |
| Reviewer accepts | Payout becomes eligible; credential issuance | 01, 05 |
| Reviewer rejects/rework | Contributor revision flow | 01 |
| Rate card created/changed | Future task pricing recalculated | 05 |
| Payout released | Payment rail call; contributor sees in earnings | 01, 05 |
| HRIS sync | Internal contributors appear/update in cross-tenant identity | 01, 05 |
| SSO config saved | Tenant identity provider switches | 05 |
| Audit signing key rotated | All future audit events use new key | 05 |
| Webhook fire | External system (Jira, Slack, etc.) | 05 |
| ERP export | External finance system | — |
| Contributor safety report | Compliance / governance queue | 04 |

---

## 9. Data model sketch (enterprise-relevant entities)

| Entity | Key fields | Notes |
|---|---|---|
| Tenant | id, name, domain, subscriptionTier | Multi-tenant root |
| EnterpriseUser | id, tenantId, email, displayName, roles[] (RBAC), mfaConfig, status | Multi-role array |
| Role | code (ent.admin, ent.sponsor, …), permissions[] | Static taxonomy |
| SOW | id, tenantId, version, title, status, stage, owner, dates, deliverables[], clauses[], riskScores, confidentiality | Versioned via SowVersion |
| SowVersion | sowId, version, payload, createdBy, createdAt, supersededAt | Immutable snapshots |
| Approval | id, sowId, stage, approver, decision, comment, decidedAt | Per-stage record |
| DecompositionPlan | id, sowId, status, milestones[], tasks[] | One per SOW |
| Milestone | id, planId, projectId, name, dueAt, owner, tasks[] | Group of tasks |
| Project | id, tenantId, planId, name, status, sponsor, pmo, budget, startedAt, dueAt | Active delivery |
| Task | (see contributor doc 01 §9) | Shared entity; enterprise-side adds budgetLineId |
| RateCard | id, tenantId, name, scope, rows[], effectiveFrom, effectiveTo, status | Versioned via RateCardVersion |
| RateCardRow | cardId, role, skill, level, region, rate, currency | Composite key |
| Invoice | id, tenantId, period, lineItems[], total, status, paidAt, ref | Periodic |
| Payout | id, contributorId, taskId, amount, status, releasedAt, ref | One per accepted task |
| AuditEvent | id, tenantId, actor, action, resource, payload, before, after, severity, timestamp (immutable, signed) | Cross-tenant model in doc 05 |
| Integration | id, tenantId, type (sso/hris/webhook/erp), config, status | Per integration |
| Policy | id, tenantId, kind (sla/escalation/governance), config | Configurable rules |
| Notification | id, recipient, kind, payload, readAt, dispatchedAt | Per-user |

Full schema in cross-functional doc 05 §9.

---

## 10. RBAC matrix (full)

Defined in §3.2 sidebar mapping. Additional action-level rules:

| Action | Required role(s) |
|---|---|
| Create SOW | ent.admin, ent.sponsor |
| Approve stage X | configured stage approver (varies per stage) |
| Edit rate card | ent.admin, ent.finance |
| Approve rate card | ent.admin |
| Sync HRIS | ent.admin, ent.it |
| Manually trigger payout release | ent.admin, ent.finance |
| Override mentor decision | ent.admin, ent.reviewer (with comment) |
| Reassign task | ent.admin, ent.pmo |
| Extend SLA | ent.admin, ent.pmo |
| Escalate exception | ent.admin, ent.pmo, ent.sponsor |
| Configure SSO | ent.admin, ent.it |
| Read audit (own scope) | all |
| Read audit (full tenant) | ent.admin, ent.compliance |
| Export audit | ent.admin, ent.compliance |

Server-side enforcement is mandatory (cross-fn doc 05 §3 — Next.js middleware).

---

## 11. Open decisions

1. **Reviewer sub-portal at `/enterprise/reviewer`** — kept as a sidebar sub-portal under DELIVERY. Alternative: collapse into a `Reviews` page within projects. Confirm.

2. **Audit unified vs fragmented** — proposed unified at `/enterprise/audit`. Per-domain mini-audit tabs (SOW · Project · Billing) link into the unified view with a filter pre-applied. Confirm.

3. **Delivery Tracking** — proposed to collapse into Projects (Exceptions tab + Project Overview health). Sidebar item removed. Confirm.

4. **Rate card scope** — proposed three scopes: Tenant / Project / SOW. Confirm whether per-SOW is overkill for Phase 1 (could be Phase 2).

5. **SLA template granularity** — proposed per "work type" (Software / Design / Marketing). Alternative: per-project-template. Confirm.

6. **Two-stage review default** — Phase 1 proposed: configured per project at decomposition time (PMO toggles two-stage on the project). Default off. Confirm.

7. **Audit export signing** — proposed: optional tenant-key signing for legal evidence. Default unsigned for casual export. Confirm whether Phase 1 needs cryptographic signing (depends on customer compliance posture).

8. **Compliance Phase 1 baseline** — proposed: consent inventory + retention rules + deletion request handling. Phase 2: ESG, PODL, evidence packs. Confirm Phase 1 floor.

9. **Analytics Phase 1 baseline** — proposed: skills inventory + skill gaps + throughput (workforce) and spend + cost per skill + cost per project (economic). Confirm whether savings/ROI estimate is required for Phase 1.

10. **Tenant model** — proposed: single-org-per-tenant in Phase 1 (no sub-tenancy / business units). Confirm.

11. **Procurement Phase 1 baseline** — proposed: PO mapping at the project level + GL code mapping at the rate card level + file drop ERP export. No real-time invoicing. Confirm Phase 1 floor.

12. **SOW intake template editor** — proposed Phase 1: ship with 2 default templates (Software, Design); admin can clone and edit. Custom template authoring is a polished feature. Confirm.

13. **Reviewer override of mentor** — proposed: enterprise reviewer can override mentor's accept (reject anyway) but not the inverse (cannot force-accept what mentor rejected). Confirm.

14. **Decomposition human approval gate** — proposed: required (per SOW §3.1.MVP.2 "human approval gates before execution"). Sponsor approves before tasks become available. Confirm role.

15. **SoD policy enforcement** — proposed: warn (not block) when mutually-exclusive roles are assigned. Some orgs have one-person finance teams. Confirm.

---

## End of enterprise portal spec

Next docs:
- `03-mentor-portal.md` — Mentor & reviewer workspace
- `04-platform-admin-portal.md` — Glimmora-side admin
- `05-cross-functional.md` — Auth, RBAC, audit, AI, notifications, integrations
- `06-phase-1-scope-lockdown.md` — Consolidated 90-day checklist
