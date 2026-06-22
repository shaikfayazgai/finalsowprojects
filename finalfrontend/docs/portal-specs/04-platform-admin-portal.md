# Platform Admin Portal — Detailed Specification

> **Status:** Draft v1.0 — Phase 1 rebuild reference
> **SOW anchor:** GLIMMORATEAM™ Global Workforce Intelligence Platform v1.1
> **Owner:** Product · Engineering · Design · Glimmora Operations
> **Last updated:** 2026-05-26

---

## 0. Document control

| Field | Value |
|---|---|
| Document role | Source of truth for build-out and QA of the internal Glimmora-side admin |
| Audience | **Glimmora staff only** — never an enterprise customer or contributor |
| SOW anchor | §3.1.MVP.3 (KYC), §3.1.MVP.7 (AI agent config), §3.1.MVP.8 (audit/observability), §3.1.MVP.9 (integrations), §3.1.1 (agent governance), §3.1.2 (skill taxonomy), §3.1.8 (compliance baseline), §14 (governance), §20.1 (university partnerships), §20.2 (women workforce program), §22.1 (operations rollout) |
| Phase 1 horizon | 0–90 days |
| Scope philosophy | **Minimum viable internal admin** — only surfaces required to support contributor + enterprise + mentor portals operating |

### Why a separate portal at all?

The SOW §19 lists four customer-facing UI modules (Enterprise Admin, Contributor, Mentor & Reviewer, Analytics). None of these is Glimmora's own ops surface. Yet several MVP capabilities **require** internal staff to:

- **Provision enterprise tenants** (§22.1 operations rollout)
- **Manage the global skill taxonomy** (§3.1.2 — Talent Intelligence Graph)
- **Manage the mentor pool + competencies** (§3.1.MVP.5 prerequisite)
- **Triage governance cases** (§14 — safety, disputes, grievances escalated from contributor + mentor portals)
- **Configure AI agents** (§3.1.MVP.7, §3.1.1)
- **Configure payment rails** (§3.1.MVP.6 prerequisite)
- **Maintain cross-tenant audit** (§3.1.MVP.8)

Phase 1 Platform Admin Portal exists **as the operational scaffolding** for those concerns. It is internal-only, never exposed to enterprise customers or contributors.

### Reading conventions

Same as previous specs:
- **§** = SOW · **P1/P2** = Phase 1/2 · **🔒 SEAL** = hide · **🚧 BUILD** · **🔧 WIRE** · **✅ KEEP**

---

## 1. Purpose and personas

### 1.1 What this portal is for

The Platform Admin Portal is **Glimmora's internal operating surface**. Glimmora staff use it to:

- **Provision** new enterprise tenants and onboard them
- **Manage** the mentor pool, skill taxonomy, and rubric templates that all tenants share
- **Triage** governance cases forwarded from contributor and mentor portals (safety reports, grievances, disputes, KYC reviews)
- **Configure** the AI agents, payment rails, and integration connectors that power the platform
- **Maintain** the cross-tenant audit log and system health visibility
- **Coordinate** the student and women-workforce partnership programs

It is **not** a marketing site, not a customer-facing dashboard, not a self-serve signup. Access is limited to Glimmora employees and contracted operators with role-appropriate permissions.

### 1.2 Personas

Eight internal personas. Same portal, role-conditional modules. The Platform Admin (super-admin) sees everything; others see only their scope.

| Persona | Role code | What they own | SOW |
|---|---|---|---|
| **Platform Admin** | `plat.admin` | Super-admin — full read/write across the portal | implicit |
| **Tenant Success Manager** | `plat.tsm` | Tenant onboarding, provisioning, customer health | §22.1 |
| **Mentor Program Manager** | `plat.mpm` | Mentor pool, competencies, pairings, mentorship coordination | §3.1.MVP.5, §20.2 |
| **Trust & Safety Officer** | `plat.tns` | Governance queue, dispute adjudication, safety case triage | §14, §20.3 |
| **Compliance Officer (Glimmora)** | `plat.compliance` | Cross-tenant audit, retention, regulatory evidence | §3.1.MVP.8, §3.1.8 |
| **Payments Operator** | `plat.payments` | Payment rail config, reconciliation, payout escalations | §3.1.MVP.6, §3.1.7 |
| **Partnership Manager** | `plat.partnerships` | University agreements, women-workforce org liaisons | §20.1, §20.2 |
| **AI Operator** | `plat.ai` | Agent configuration, prompt templates, model versioning | §3.1.MVP.7, §3.1.1 |

> Phase 2 only: **Fraud Analyst** (advanced anomaly review), **SRE / Infra** (multi-region deployment console), **Legal Counsel** (cryptographic credential admin).

### 1.2.1 One portal, role-conditional modules

**Decision (locked):** same shell, same navigation, sidebar items hidden by RBAC. Platform Admin role sees everything; specialist roles see only their sections. Multi-role users see the union.

### 1.3 Jobs-to-be-done

| JTBD | Who | Surface |
|---|---|---|
| "Stand up a new enterprise tenant" | TSM | Tenants · New |
| "Onboard a new mentor and set what they can review" | MPM | Mentors · New |
| "Add a new skill to the taxonomy" | MPM, Admin | Skill Taxonomy |
| "Provide reviewer rubric defaults" | MPM | Rubric Templates |
| "Triage a forwarded safety report" | T&S | Governance · Case |
| "Approve a KYC-flagged contributor manually" | T&S | KYC Review · Case |
| "Pull a cross-tenant audit slice for legal" | Compliance | Audit · Export |
| "Configure Razorpay credentials for India payouts" | Payments | Payment Rails |
| "Roll back an AI prompt that's misbehaving" | AI Op | AI Agents · Prompts |
| "Confirm a university partnership for student onboarding" | Partnerships | Partnerships · Universities |
| "Watch service health during an incident" | Admin | System Health |
| "Edit the welcome email contributors get" | Admin | Email Templates |

### 1.4 What this portal is NOT

- **Not** customer-facing — no enterprise customer logs in here
- **Not** a public site — no marketing, no signup, no SEO
- **Not** a substitute for the Enterprise Portal — Glimmora staff do not configure a tenant's rate cards or policies here; those are tenant-owned in the Enterprise Portal
- **Not** a primary analytics destination — Phase 2 will add cross-tenant analytics

### 1.5 Phase 1 scope philosophy

Every Phase 1 surface here answers one question: **"Without this, can the other three portals function correctly?"** If yes → Phase 1. If no → Phase 2. The result is a deliberately small Phase 1: 13 functional surfaces, most as list+detail pairs.

---

## 2. Phase 1 vs Phase 2 scope

### 2.1 Phase 1 — must ship (because the other portals depend on it)

| # | Capability | SOW | Why Phase 1 | Effort |
|---|---|---|---|---|
| 1 | Tenant onboarding + provisioning UI | §22.1 | Without it, no enterprise can exist | 🚧 BUILD |
| 2 | Tenant list + detail | §22.1 | Operate provisioned tenants | 🚧 BUILD |
| 3 | Mentor list + creation + competency editor | §3.1.MVP.5 | Without mentors, reviews can't route | 🚧 BUILD |
| 4 | Mentor pool management (assign mentors to pools) | §3.1.MVP.5 | Lead mentor + matching depend on pools | 🚧 BUILD |
| 5 | Skill taxonomy (CRUD + merge + deprecate) | §3.1.2 | Matching + onboarding skills depend on a single taxonomy | 🚧 BUILD |
| 6 | Rubric template library (CRUD) | §3.1.MVP.5 | Mentors need defaults to grade with | 🚧 BUILD |
| 7 | Governance queue (cases from contributor + mentor portals) | §14, §20.3 | Safety reports, grievances, mentor escalations land here | 🚧 BUILD |
| 8 | KYC review queue (manual ID review for contributors) | §3.1.MVP.3 | Some onboardings need manual review | 🚧 BUILD |
| 9 | Cross-tenant audit log | §3.1.MVP.8 | Compliance + legal evidence | 🚧 BUILD |
| 10 | AI agent configuration (basic: enable/disable, prompt version) | §3.1.MVP.7, §3.1.1 | Per-portal AI must be controllable | 🚧 BUILD |
| 11 | Payment rail configuration (Razorpay, banks, regional) | §3.1.MVP.6, §3.1.7 | Without configured rails, payouts fail | 🚧 BUILD |
| 12 | Email template library | §3.1.5 implicit | Existing — must work; affects every portal's transactional email | ✅ KEEP / 🔧 WIRE |
| 13 | Roles + RBAC schema (which roles exist platform-wide) | §3.1.MVP.8 | Foundation for all portal RBAC | 🚧 BUILD |
| 14 | System health (basic — service status + error feed) | §3.1.MVP.8 | Operational visibility during pilots | 🚧 BUILD |
| 15 | Partnership directory — universities (basic) | §20.1 | Student-track onboarding requires institutional verification | 🚧 BUILD (Phase 1 minimal: directory + manual add) |
| 16 | Partnership directory — women-workforce organizations (basic) | §20.2 | Women-workforce onboarding routes via partners | 🚧 BUILD (Phase 1 minimal: directory) |
| 17 | Platform admin's own profile + settings + notifications | implicit | Self-service basics | ✅ KEEP |
| 18 | WCAG-aligned core journeys | §1.4.1 | All Glimmora-built UI must meet baseline | 🚧 BUILD |

### 2.2 Phase 2 — deferred

| Surface | SOW | Why Phase 2 |
|---|---|---|
| **Fraud detection dashboard** | §3.2.4 | Phase 2 explicitly |
| **Behavioral anomaly models + anti-collusion** | §3.2.4 | Phase 2 explicitly |
| **Cross-tenant analytics** (workforce intelligence aggregated across all tenants) | §3.1.6 baseline only in Phase 1 | Phase 2 deep |
| **Multi-region deployment console** | §3.2.5 | Phase 2 |
| **Bias monitoring + AI risk classification UI** | §3.1.1, §7.5 | Phase 2 |
| **Autonomy tier configuration** (per-agent rules: full / human-in-loop / notify-only) | §3.1.1 | Phase 1 = enable/disable only; tier config is Phase 2 |
| **Cryptographic credential admin** (verifiable credentials issuance keys) | §3.2 | Phase 2 |
| **AI model lifecycle UI** (eval, A/B, rollback dashboards) | §3.1.1 | Phase 2 — Phase 1 = prompt + model id only |
| **Compliance evidence locker** (full document workflow) | §3.1.8 | Phase 2 |
| **Multi-tenant tenancy hierarchy** (parent / sub-org) | §3.2.5 implicit | Phase 2 |
| **Self-serve tenant signup** | not in SOW | Phase 2 |
| **SLA monitoring dashboard** (cross-tenant) | implicit | Phase 2 |

### 2.3 Phase 1 exit criteria — platform admin portal

Phase 1 acceptance when **all** of these are true:

1. Glimmora staff can create a new enterprise tenant, set its admin user, and the tenant can log in
2. Glimmora staff can create a new mentor, set their competency (role × skill × level matrix), assign them to one or more pools — the mentor can then be matched to reviews
3. Skill taxonomy has at least 200 seeded skills; staff can add a new skill, merge duplicates, deprecate stale ones
4. At least 5 default rubric templates exist (Software, Design, Data, Marketing, Documentation); enterprises can copy and customize
5. Governance queue receives cases from contributor + mentor portals; T&S can assign, work, and close each
6. KYC review queue receives flagged contributor onboardings; T&S can approve or reject with reason
7. Cross-tenant audit log is searchable by actor/resource/time and exportable
8. AI agent configuration shows the 4 MVP agents (SOW Intake, Decomposition, Contributor Support, Review Assistant) with enable/disable + active prompt version
9. At least one payment rail (Razorpay India) is configured; payouts route through it
10. Email template library has all transactional templates and they render correctly
11. RBAC schema is editable by Platform Admin only
12. System health page shows live service status for ≥5 critical services
13. At least 3 universities + 3 women-workforce partner organizations are seeded
14. Three core internal journeys pass WCAG 2.1 AA (Tenant new, Governance case, Mentor new)

### 2.4 Out of scope entirely

- Self-serve enterprise signup (Glimmora is invitation/sales-led in Phase 1)
- Contributor admin (contributors manage themselves; only KYC + governance affect them platform-side)
- Direct ledger reconciliation UI (Phase 2 — Phase 1 = file-drop reconciliation from payment provider)
- Customer support ticketing UI (Phase 1 uses external tool e.g. Intercom; admin only sees governance + KYC queues)

---

## 3. Information architecture

### 3.1 Sidebar (full Platform Admin role)

```
┌─────────────────────────────────┐
│ ▢ Glimmora · Operations          │
├─────────────────────────────────┤
│ OVERVIEW                         │
│   • Dashboard                    │  /admin/dashboard
├─────────────────────────────────┤
│ CUSTOMERS                        │
│   • Tenants                      │  /admin/tenants
├─────────────────────────────────┤
│ TALENT                           │
│   • Mentors                      │  /admin/mentors
│   • Mentor Pools                 │  /admin/mentors/pools
│   • Skill Taxonomy               │  /admin/skill-taxonomy
├─────────────────────────────────┤
│ STANDARDS                        │
│   • Rubric Templates             │  /admin/rubric-templates
│   • Email Templates              │  /admin/email-templates
├─────────────────────────────────┤
│ GOVERNANCE                       │
│   • Cases                        │  /admin/governance         [3]
│   • KYC Reviews                  │  /admin/kyc                 [1]
│   • Audit (cross-tenant)         │  /admin/audit
├─────────────────────────────────┤
│ INFRASTRUCTURE                   │
│   • AI Agents                    │  /admin/ai
│   • Payment Rails                │  /admin/payment-rails
│   • System Health                │  /admin/system-health
├─────────────────────────────────┤
│ PROGRAMS                         │
│   • Universities                 │  /admin/partnerships/universities
│   • Women Workforce              │  /admin/partnerships/women-workforce
├─────────────────────────────────┤
│ SECURITY                         │
│   • Roles & Permissions          │  /admin/roles
├─────────────────────────────────┤
│   • Profile                      │  /admin/profile
│   • Settings                     │  /admin/settings
├─────────────────────────────────┤
│ [<<] collapse                    │
└─────────────────────────────────┘
```

### 3.2 RBAC: which roles see which sections

| Section | admin | tsm | mpm | tns | compliance | payments | partnerships | ai |
|---|---|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tenants | ✓ | ✓ | view | view | view | view | — | — |
| Mentors / Pools | ✓ | view | ✓ | view | — | — | — | — |
| Skill Taxonomy | ✓ | — | ✓ | — | view | — | — | — |
| Rubric Templates | ✓ | — | ✓ | view | — | — | — | — |
| Email Templates | ✓ | view | — | view | — | — | — | — |
| Governance Cases | ✓ | view | view | ✓ | view | — | view | — |
| KYC Reviews | ✓ | — | — | ✓ | view | — | view | — |
| Audit | ✓ | view | — | view | ✓ | view | — | — |
| AI Agents | ✓ | — | — | — | view | — | — | ✓ |
| Payment Rails | ✓ | — | — | — | view | ✓ | — | — |
| System Health | ✓ | view | — | — | — | view | — | view |
| Universities | ✓ | view | view | — | — | — | ✓ | — |
| Women Workforce | ✓ | view | view | view | — | — | ✓ | — |
| Roles & Permissions | ✓ | — | — | — | view | — | — | — |

### 3.3 Route map (Phase 1)

| Route | Screen | Phase | SOW | Roles |
|---|---|---|---|---|
| `/admin/dashboard` | Dashboard | P1 | implicit | all |
| `/admin/tenants` | Tenants list | P1 | §22.1 | admin, tsm |
| `/admin/tenants/new` | New tenant wizard | P1 | §22.1 | admin, tsm |
| `/admin/tenants/[tenantId]` | Tenant detail | P1 | §22.1 | admin, tsm |
| `/admin/tenants/[tenantId]/provisioning` | Provisioning steps | P1 | §22.1 | admin, tsm |
| `/admin/mentors` | Mentor list | P1 | §3.1.MVP.5 | admin, mpm |
| `/admin/mentors/new` | New mentor | P1 | §3.1.MVP.5 | admin, mpm |
| `/admin/mentors/[mentorId]` | Mentor detail | P1 | §3.1.MVP.5 | admin, mpm |
| `/admin/mentors/[mentorId]/competency` | Competency editor | P1 | §3.1.MVP.5 | admin, mpm |
| `/admin/mentors/pools` | Pool list | P1 | §3.1.MVP.5 | admin, mpm |
| `/admin/mentors/pools/[poolId]` | Pool detail | P1 | §3.1.MVP.5 | admin, mpm |
| `/admin/skill-taxonomy` | Taxonomy list | P1 | §3.1.2 | admin, mpm |
| `/admin/skill-taxonomy/[skillId]` | Skill detail | P1 | §3.1.2 | admin, mpm |
| `/admin/skill-taxonomy/merge` | Merge skills | P1 | §3.1.2 | admin, mpm |
| `/admin/rubric-templates` | Rubric template library | P1 | §3.1.MVP.5 | admin, mpm |
| `/admin/rubric-templates/[templateId]` | Template editor | P1 | §3.1.MVP.5 | admin, mpm |
| `/admin/email-templates` | Email template list | P1 | implicit | admin |
| `/admin/email-templates/[templateId]` | Template editor | P1 | implicit | admin |
| `/admin/governance` | Governance queue | P1 | §14, §20.3 | admin, tns |
| `/admin/governance/[caseId]` | Case detail | P1 | §14 | admin, tns |
| `/admin/kyc` | KYC queue | P1 | §3.1.MVP.3 | admin, tns |
| `/admin/kyc/[caseId]` | KYC case detail | P1 | §3.1.MVP.3 | admin, tns |
| `/admin/audit` | Cross-tenant audit | P1 | §3.1.MVP.8 | admin, compliance |
| `/admin/audit/[eventId]` | Event detail | P1 | §3.1.MVP.8 | admin, compliance |
| `/admin/audit/export` | Audit export | P1 | §3.1.MVP.8 | admin, compliance |
| `/admin/ai` | AI agent list | P1 | §3.1.MVP.7 | admin, ai |
| `/admin/ai/[agentId]` | Agent detail | P1 | §3.1.MVP.7 | admin, ai |
| `/admin/ai/prompts` | Prompt template list | P1 | §3.1.MVP.7 | admin, ai |
| `/admin/ai/prompts/[promptId]` | Prompt editor + version history | P1 | §3.1.MVP.7 | admin, ai |
| `/admin/payment-rails` | Payment rail list | P1 | §3.1.MVP.6 | admin, payments |
| `/admin/payment-rails/[railId]` | Rail config | P1 | §3.1.MVP.6 | admin, payments |
| `/admin/system-health` | Service status | P1 | §3.1.MVP.8 | admin, ai, payments |
| `/admin/partnerships/universities` | University directory | P1 | §20.1 | admin, partnerships |
| `/admin/partnerships/universities/[uniId]` | University detail | P1 | §20.1 | admin, partnerships |
| `/admin/partnerships/women-workforce` | WW partners directory | P1 | §20.2 | admin, partnerships |
| `/admin/partnerships/women-workforce/[orgId]` | Partner detail | P1 | §20.2 | admin, partnerships |
| `/admin/roles` | RBAC schema | P1 | §3.1.MVP.8 | admin |
| `/admin/profile` | Profile | P1 | implicit | self |
| `/admin/settings` | Settings | P1 | implicit | self |
| `/admin/notifications` | Notifications | P1 | implicit | self |

**Sealed for Phase 1:**

| Route | Reason |
|---|---|
| `/admin/fraud/*` | Phase 2 — advanced fraud detection |
| `/admin/analytics/*` | Phase 2 — cross-tenant analytics |
| `/admin/regions/*` | Phase 2 — multi-region console |
| `/admin/ai/governance/*` | Phase 2 — bias monitoring, risk classification |
| `/admin/compliance/evidence/*` | Phase 2 — full evidence locker |
| `/admin/credentials/admin/*` | Phase 2 — cryptographic key admin |

### 3.4 Navigation patterns

- **Sidebar:** persistent on lg+; mobile drawer (rare — admins use desktop). Sections in IA order: Customers → Talent → Standards → Governance → Infrastructure → Programs → Security.
- **Topbar:** sticky 60px. Includes a prominent **environment chip** (PROD / STAGING / DEV) — admins switch tabs all day across environments.
- **Search (⌘K):** scoped to admin entities (tenant, mentor, case, skill, audit event).
- **Deep audit links:** every entity has an "Audit trail" link in its header → opens audit pre-filtered to that resource.

---

## 4. End-to-end internal journeys

### Journey A — Tenant onboarding (TSM)

```
Tenants ─→ New tenant
              │
              ├ Step 1: Tenant info (name, domain, subscription)
              ├ Step 2: Primary admin user (email → invite)
              ├ Step 3: Initial RBAC roles (which roles to enable for this tenant)
              ├ Step 4: Region + currency
              ├ Step 5: Compliance baseline (retention defaults, consent versions)
              ├ Step 6: Review and provision
              ▼
        Tenant created · admin invited via email
              │
              ▼
        Provisioning status page (monitors first sync, first user, etc.)
```

### Journey B — Mentor onboarding (MPM)

```
Mentors ─→ New mentor
              │
              ├ Identity (name, email, country)
              ├ Background (org, mentor since)
              ├ Competency (role × skill × level matrix)
              ├ Pool assignment (which review pools they join)
              ├ Availability (initial)
              ├ Send invite
              ▼
        Mentor invited · receives email · signs in to mentor portal
              │
              ▼
        Status: pending first sign-in → active
```

### Journey C — Safety case triage (T&S)

```
Governance queue ─→ Open case · Type: Safety report
                            │
                            ├ Read contributor's report (anonymous or named)
                            ├ Check audit trail for context
                            ├ Inspect related tasks / mentor / enterprise
                            ▼
                      Decision:
                        • Resolve (no action — false positive)
                        • Take action (warn / suspend mentor / unassign task / contact enterprise)
                        • Escalate to legal
                            │
                            ▼
                      Audit + notification to reporter (if non-anonymous)
```

### Journey D — KYC manual review (T&S)

```
KYC queue ─→ Case detail
                  │
                  ├ Contributor identity submission
                  ├ Uploaded ID (encrypted view)
                  ├ Cross-check: name vs ID, photo match (manual)
                  ▼
              Decision:
                • Approve (contributor onboarding completes)
                • Request more info (contributor re-uploads)
                • Reject (contributor onboarding fails; appealable)
                  │
                  ▼
              Audit + contributor notification
```

### Journey E — Skill taxonomy maintenance (MPM)

```
Skill Taxonomy ─→ Search / browse
                       │
                       ├ Spot duplicate ("React" vs "ReactJS")
                       │   → Merge skills → audit
                       │
                       ├ Add new skill (request from contributor onboarding)
                       │   → Define name, category, adjacency, level definitions
                       │
                       ├ Deprecate stale skill ("Adobe Flash")
                       │   → Mark deprecated; cannot be selected for new contributors
                       │   → Existing holders flagged for migration
```

### Journey F — AI agent prompt rollback (AI Operator)

```
AI Agents ─→ Review Assistant ─→ Prompts
                                      │
                                      ▼
                                Prompts list (version history)
                                      │
                                      ├ v4 (current) — released May 24 — drift detected
                                      │
                                      ▼ rollback
                                v3 reactivated as current
                                Audit logged
                                Next AI invocation uses v3
```

### Journey G — Payment rail incident (Payments Operator)

```
Notification: "Razorpay 5xx error rate elevated"
        │
        ▼
Payment Rails ─→ Razorpay India ─→ Status: degraded
        │
        ├ View error feed (last 1h)
        ├ Pause new payouts on this rail
        │   → Pending payouts queue holds; alerts to finance teams
        ├ Test rail with synthetic payout
        ├ Re-enable when stable
```

---

## 5. Screen-by-screen specification

> **Format note:** Phase 1 platform admin is internal tooling — the bar for craft is "clear and audited," not "delight." Wireframes prioritize information density and traceability.

### 5.A Authentication

Same shared auth screens as contributor (doc 01 §5.A) with two additions:

#### 5.A.1 Glimmora-staff SSO required
**Phase 1**

All `/admin/*` routes require Glimmora's IdP. No password fallback for staff. The login route auto-routes to Glimmora SSO with no email entry step (recognized via domain).

#### 5.A.2 Environment switcher
**Phase 1** · 🚧 BUILD

Topbar chip shows current environment with a click-switcher:
```
[ PROD ▾ ]   ←   [ STAGING ]   [ DEV ]
```
Switching opens the same path in another environment in a new tab (no in-place swap — prevents accidental cross-env writes).

---

### 5.B Dashboard

#### 5.B.1 Dashboard — `/admin/dashboard`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Glimmora Operations · PROD                                     │
│ Welcome, Aishwarya (T&S Officer · plat.tns + plat.admin)      │
├──────────────────────────────────────────────────────────────┤
│ OPERATIONAL HEALTH                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │Services  │ │Tenants   │ │Mentors   │ │Active SOW│         │
│ │ 12/12 ✓ │ │  18      │ │ 142      │ │   84     │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
├──────────────────────────────────────────────────────────────┤
│ ATTENTION                                                      │
│ ⚠ 3 governance cases assigned to you · oldest 4h               │
│ ⚠ 1 KYC review pending · 8h SLA                                │
│ ⚠ Razorpay India · error rate elevated (last 1h)              │
│ [ Go to queue → ]                                              │
├──────────────────────────────────────────────────────────────┤
│ RECENT ACTIVITY (last 24h)                                    │
│ • Tenant 'Helios Studios' provisioned · 3h ago                │
│ • Mentor 'Rajesh Verma' competency updated · 5h ago           │
│ • AI prompt 'review-assistant.summarize' rolled to v4 · 8h    │
│ • Skill 'Rust' added · yesterday                              │
├──────────────────────────────────────────────────────────────┤
│ AI SIGNALS                                                     │
│ › Average KYC resolution this week: 6h (target: 8h) ✓         │
│ › Governance backlog growth +2 cases over baseline             │
└──────────────────────────────────────────────────────────────┘
```

**Role-conditional modules:**
- TSM: "Tenants onboarding in progress" card
- MPM: "Mentors awaiting first sign-in" card
- T&S: "Cases awaiting me" prominent (default)
- Compliance: "Audit volume + retention status" card
- Payments: "Payment rail health" card
- AI Op: "Agent activity + prompt versions" card

---

### 5.C Tenants

#### 5.C.1 Tenants list — `/admin/tenants`
**Phase 1** · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Tenants                                       [ + New tenant ] │
├──────────────────────────────────────────────────────────────┤
│ [ All 18 ] [ Active 14 ] [ Provisioning 3 ] [ Paused 1 ]      │
├──────────────────────────────────────────────────────────────┤
│ NAME              │ DOMAIN       │ STATE      │ USERS │ SOWS  │
│ ───────────────────┼──────────────┼────────────┼───────┼───────│
│ Acme Corp          │ acme.com     │ Active     │  84   │  12   │
│ Helios Studios     │ helios.io    │ Active     │  22   │   8   │
│ Reporting Inc.     │ reporting.tv │ Provis.    │   1   │   0   │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.C.2 New tenant wizard — `/admin/tenants/new`
**Phase 1** · 🚧 BUILD

6-step wizard. Each step saves draft on continue.

**Step 1 — Tenant info:**
```
┌──────────────────────────────────────────────────────────────┐
│ Step 1 of 6 · Tenant info                                      │
├──────────────────────────────────────────────────────────────┤
│ Tenant name                                                    │
│ [ Acme Corp                                              ]    │
│                                                                │
│ Tenant ID (URL slug)                                          │
│ [ acme-corp ]    [ ✓ available ]                              │
│                                                                │
│ Primary domain                                                 │
│ [ acme.com ]                                                   │
│                                                                │
│ Subscription tier                                              │
│ [ Enterprise ▾ ] (sets feature flags + commercial terms)      │
│                                                                │
│ Contract reference                                             │
│ [ MSA-2026-0182 ]                                             │
│                                                                │
│                                              [ Continue → ]    │
└──────────────────────────────────────────────────────────────┘
```

**Step 2 — Primary admin user:** email + name → invite sent.

**Step 3 — Initial RBAC roles:** which `ent.*` roles enabled for this tenant; admin can prune ones the customer didn't buy.

**Step 4 — Region + currency:** primary region, currency, timezone defaults.

**Step 5 — Compliance baseline:** retention defaults, consent versions to require, data residency region.

**Step 6 — Review and provision:**
```
┌──────────────────────────────────────────────────────────────┐
│ Step 6 of 6 · Review and provision                             │
├──────────────────────────────────────────────────────────────┤
│ Tenant      Acme Corp · acme-corp                              │
│ Domain      acme.com (verified)                                │
│ Tier        Enterprise · MSA-2026-0182                         │
│ Admin       sandeep@acme.com                                   │
│ Roles       admin, sponsor, pmo, finance, reviewer, it        │
│ Region      Asia-South · INR                                   │
│ Retention   Audit indefinite · Evidence 7 years                │
│                                                                │
│ Provisioning will create:                                     │
│   ✓ Tenant database scope                                     │
│   ✓ Default policies (SLA, escalation, governance)            │
│   ✓ Primary admin invitation                                  │
│   ✓ Glimmora Commercial team auto-assigned for stage 2        │
│                                                                │
│ [ ← Back ]                              [ Provision tenant ]  │
└──────────────────────────────────────────────────────────────┘
```

**Edge cases:**
- Tenant ID collision → suggest alternates inline
- Domain not verified → warning, allow proceed
- MSA reference doesn't exist in legal system → soft warn (no hard block — Phase 1 ops are partly manual)

---

#### 5.C.3 Tenant detail — `/admin/tenants/[tenantId]`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ ← Tenants · Acme Corp · Active                                 │
│ Provisioned May 12, 2026 · MSA-2026-0182                       │
├──────────────────────────────────────────────────────────────┤
│ [ Overview ][ Users ][ Provisioning ][ Audit ]                │
├──────────────────────────────────────────────────────────────┤
│ HEALTH                                                         │
│ Users active 30d  78 of 84                                    │
│ SOWs in flight    12                                          │
│ Tasks completed   362                                         │
│ Payouts (30d)     ₹14,80,400                                  │
│ Last sync (HRIS)  6h ago · 0 errors                           │
├──────────────────────────────────────────────────────────────┤
│ ACTIONS                                                        │
│ [ Pause tenant ]   [ Edit subscription ]   [ Open audit ]     │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** "Pause tenant" → modal with reason; suspends all user logins for this tenant; audit logged.

---

#### 5.C.4 Provisioning status — `/admin/tenants/[tenantId]/provisioning`
**Phase 1**

Step-by-step status of provisioning side effects:
```
┌──────────────────────────────────────────────────────────────┐
│ Provisioning · Helios Studios                                  │
├──────────────────────────────────────────────────────────────┤
│ ✓ Tenant scope created                       May 12 09:00     │
│ ✓ Default policies applied                   May 12 09:00     │
│ ✓ Admin invite sent (helios@helios.io)        May 12 09:01     │
│ ⏳ First admin sign-in                         pending          │
│ ⏳ First SOW upload                            pending          │
│ ⏳ HRIS connection                             pending          │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.D Mentors

#### 5.D.1 Mentor list — `/admin/mentors`
**Phase 1** · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Mentors                                       [ + New mentor ] │
│ 142 mentors · 138 active · 4 pending first sign-in            │
├──────────────────────────────────────────────────────────────┤
│ [ All ] [ Active ] [ Pending ] [ Paused ] [ Senior ] [ Lead ] │
├──────────────────────────────────────────────────────────────┤
│ NAME             │ ROLES             │ POOLS         │ STATUS │
│ ──────────────────┼───────────────────┼───────────────┼────────│
│ Priya Iyer       │ mentor.lead       │ Helios        │ active │
│ Rajesh Verma     │ mentor            │ Helios, Rep.. │ active │
│ Amelia Stone     │ mentor.senior     │ Cross-pool    │ active │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.D.2 New mentor — `/admin/mentors/new`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Invite a new mentor                                            │
├──────────────────────────────────────────────────────────────┤
│ Name                                                           │
│ [ ______________________________ ]                            │
│                                                                │
│ Email                                                          │
│ [ ______________________________ ]                            │
│                                                                │
│ Country                                                        │
│ [ India ▾ ]                                                    │
│                                                                │
│ Roles                                                          │
│ ☑ mentor                                                       │
│ ☐ mentor.senior                                                │
│ ☐ mentor.lead                                                  │
│                                                                │
│ Competency (set roles first — competency picker depends on it)│
│ [ Open competency editor → ]                                  │
│                                                                │
│ Pool assignment                                                │
│ ☑ Helios review pool                                          │
│ ☐ Reporting V2 review pool                                    │
│ ☐ Cross-pool (senior+ only)                                   │
│                                                                │
│ Personal note (visible to mentor in their welcome email)      │
│ [ textarea ]                                                   │
│                                                                │
│ [ Cancel ]                              [ Send invite ]       │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.D.3 Mentor detail — `/admin/mentors/[mentorId]`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ ← Mentors · Priya Iyer                                         │
│ mentor.lead · Helios pool · Active since Jan 2025             │
├──────────────────────────────────────────────────────────────┤
│ [ Overview ][ Competency ][ Activity ][ Audit ]               │
├──────────────────────────────────────────────────────────────┤
│ ACTIVITY (30d)                                                 │
│   18 reviews · 12 mentorship sessions · 0 escalations         │
│   Avg review time: 22 min · SLA hit: 94%                      │
│                                                                │
│ CURRENT POOLS                                                  │
│   • Helios review pool (lead)                                 │
│                                                                │
│ ACTIONS                                                        │
│ [ Pause mentor ] [ Edit roles ] [ Change pools ] [ Audit ]    │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.D.4 Competency editor — `/admin/mentors/[mentorId]/competency`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Competency · Priya Iyer                                        │
├──────────────────────────────────────────────────────────────┤
│ Define which (role × skill × level) combinations Priya can    │
│ review. Used by matching to route assignments.                │
│                                                                │
│ ROLE        │ SKILL              │ LEVELS                     │
│ ────────────┼────────────────────┼──────────────────────────  │
│ Designer    │ React              │ ☑L1 ☑L2 ☑L3 ☑L4            │
│ Designer    │ Figma              │ ☑L1 ☑L2 ☑L3 ☑L4            │
│ Designer    │ Accessibility      │ ☐L1 ☑L2 ☑L3 ☑L4            │
│ Designer    │ TypeScript         │ ☐L1 ☑L2 ☑L3 ☐L4            │
│ ...                                                            │
│ [ + Add row ]                                                  │
│                                                                │
│ [ Cancel ]                              [ Save competency ]   │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.D.5 Pool list — `/admin/mentors/pools`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Mentor pools                                       [ + New ]  │
├──────────────────────────────────────────────────────────────┤
│ NAME              │ TENANT     │ MENTORS │ LEAD       │ LOAD  │
│ ───────────────────┼────────────┼─────────┼────────────┼───────│
│ Helios review     │ Acme Corp  │   8     │ Priya I.   │ 60%   │
│ Reporting V2      │ Acme Corp  │   5     │ Anjali R.  │ 40%   │
│ Cross-pool        │ Any        │  12     │ Amelia S.  │ 30%   │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.D.6 Pool detail — `/admin/mentors/pools/[poolId]`
**Phase 1**

Membership list, lead designation, scope (tenant-scoped vs cross-tenant), load gauge, recent reassign history.

---

### 5.E Skill taxonomy

#### 5.E.1 Skill taxonomy — `/admin/skill-taxonomy`
**Phase 1** · SOW §3.1.2 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Skill taxonomy                       [ + New skill ] [ Merge ]│
│ 248 skills · 12 deprecated · 4 pending review                 │
├──────────────────────────────────────────────────────────────┤
│ [ All ] [ Active 232 ] [ Deprecated 12 ] [ Pending 4 ]        │
├──────────────────────────────────────────────────────────────┤
│ [ Search... ]                              Category [ All ▾ ] │
├──────────────────────────────────────────────────────────────┤
│ SKILL             │ CATEGORY     │ HOLDERS │ STATUS           │
│ ───────────────────┼──────────────┼─────────┼──────────────── │
│ React              │ Frontend     │  48     │ Active          │
│ Figma              │ Design       │  28     │ Active          │
│ Accessibility (WCAG)│ Design     │  18     │ Active          │
│ Adobe Flash        │ Design       │   2     │ Deprecated      │
│ Rust               │ Backend      │   8     │ Pending review  │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.E.2 Skill detail — `/admin/skill-taxonomy/[skillId]`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ ← Skill taxonomy · React                                       │
├──────────────────────────────────────────────────────────────┤
│ Display name      React                                       │
│ Internal id       skill.react                                 │
│ Category          Frontend                                    │
│ Aliases           ReactJS, React.js                           │
│ Status            Active                                      │
│                                                                │
│ LEVEL DEFINITIONS                                             │
│ L1 — Familiar (have done it; need supervision)               │
│ L2 — Competent (can deliver to spec)                          │
│ L3 — Strong (can deliver + help others)                       │
│ L4 — Expert (can shape the spec)                              │
│                                                                │
│ ADJACENCY                                                      │
│ Adjacent skills (matching uses for fallback):                 │
│   • Vue, Svelte, Solid (frontend frameworks)                  │
│   • Next.js (framework on top of React)                       │
│                                                                │
│ HOLDERS                                                        │
│ 48 contributors hold this skill                               │
│                                                                │
│ ACTIONS                                                        │
│ [ Edit ] [ Deprecate ] [ Merge with another skill ]           │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.E.3 Merge skills — `/admin/skill-taxonomy/merge`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Merge skills                                                   │
├──────────────────────────────────────────────────────────────┤
│ This is a permanent operation. All holders of the source     │
│ skill will be moved to the target. The source becomes an     │
│ alias of the target.                                          │
│                                                                │
│ Source (will become an alias)                                  │
│ [ ReactJS ▾ ]                                                  │
│                                                                │
│ Target (kept, gains holders)                                  │
│ [ React ▾ ]                                                    │
│                                                                │
│ Affected holders                                              │
│ 12 contributors will be moved to "React"                      │
│ Their level on ReactJS will be preserved                      │
│                                                                │
│ Reason for merge (audit)                                      │
│ [ textarea ]                                                   │
│                                                                │
│ [ Cancel ]                              [ Merge skills ]      │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.F Rubric templates

#### 5.F.1 Library — `/admin/rubric-templates`
**Phase 1** · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Rubric templates                          [ + New template ]  │
│ Defaults used by all tenants; enterprises can copy + customize│
├──────────────────────────────────────────────────────────────┤
│ NAME              │ FOR             │ CRITERIA │ USED BY      │
│ ───────────────────┼─────────────────┼──────────┼──────────────│
│ Software default  │ Code tasks      │   8      │ 12 tenants   │
│ Design default    │ Design tasks    │   6      │ 14 tenants   │
│ Data default      │ Data tasks      │   7      │  8 tenants   │
│ Marketing default │ Marketing       │   5      │  6 tenants   │
│ Documentation     │ Doc tasks       │   5      │  9 tenants   │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.F.2 Template editor — `/admin/rubric-templates/[templateId]`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Template · Software default                                    │
├──────────────────────────────────────────────────────────────┤
│ NAME      [ Software default                              ]   │
│ APPLIES   [ Code / engineering tasks ▾ ]                      │
│                                                                │
│ CRITERIA                                                       │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 1. Correctness                                            │ │
│ │    Description: Code produces expected output for all     │ │
│ │    documented inputs.                                     │ │
│ │    Weight: 25%                                            │ │
│ │    Scale: 1–5                                             │ │
│ │    [ Edit ] [ ↑↓ Reorder ] [ Remove ]                     │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 2. Tests                                                  │ │
│ │    Description: ...                                       │ │
│ │    Weight: 20%                                            │ │
│ │    Scale: 1–5                                             │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ ...                                                       │ │
│ └──────────────────────────────────────────────────────────┘ │
│ [ + Add criterion ]                                            │
│                                                                │
│ TOTAL WEIGHT  100%  ✓                                         │
│                                                                │
│ FEEDBACK TEMPLATES (used by mentors as starting points)       │
│ [ Edit feedback library → ]                                    │
│                                                                │
│ [ Cancel ]                              [ Save template ]     │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.G Email templates

#### 5.G.1 Email template list — `/admin/email-templates`
**Phase 1** · ✅ KEEP (exists)

Existing surface — works. Categories: Auth, Onboarding, SOW lifecycle, Review, Payout, Mentorship, Governance.

---

#### 5.G.2 Template editor — `/admin/email-templates/[templateId]`
**Phase 1** · ✅ KEEP

Subject + body editor (React Email components); merge variables sidebar; preview pane; test send to admin email.

---

### 5.H Governance

#### 5.H.1 Governance queue — `/admin/governance`
**Phase 1** · SOW §14, §20.3 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Governance cases                                               │
│ 3 open assigned to me · 8 unassigned · 24 closed (30d)        │
├──────────────────────────────────────────────────────────────┤
│ [ My open ] [ Unassigned ] [ All open ] [ Closed ]            │
├──────────────────────────────────────────────────────────────┤
│ [ Filter: Type ▾ ] [ Severity ▾ ] [ Source ▾ ]                │
├──────────────────────────────────────────────────────────────┤
│ ID       │ TYPE          │ SOURCE         │ OPENED  │ STATUS  │
│ ─────────┼───────────────┼────────────────┼─────────┼─────────│
│ GR-1042  │ Safety report │ Contributor   │ 1h ago  │ Open    │
│ GR-1041  │ Dispute       │ Contributor   │ 4h ago  │ In rev. │
│ GR-1040  │ Mentor escal. │ Mentor portal │ 6h ago  │ Open    │
│ GR-1039  │ Grievance     │ Contributor   │ 1d ago  │ Closed  │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.H.2 Case detail — `/admin/governance/[caseId]`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Governance · GR-1042 · Safety report                                        │
│ Opened 1h ago · Source: Contributor (anonymous)                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ ASSIGNMENT                                                                    │
│ Assigned to: Aishwarya Rao (T&S) · since 30m ago                              │
│ [ Reassign ]   [ Take case ]                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ REPORT (verbatim from contributor)                                            │
│ Type: Harassment                                                              │
│ Date of incident: May 25                                                      │
│ Description: "During a mentorship session, the mentor made                    │
│  inappropriate comments about my appearance. I was uncomfortable             │
│  for the rest of the session."                                                │
│ Anonymous: yes                                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ CONTEXT (auto-populated from audit)                                           │
│ Probable mentorship session: ms-2092 · May 25, 14:00 IST · 30 min            │
│ Mentor: Rajesh Verma (mentor.senior)                                          │
│ Contributor identity: REDACTED (anonymous case)                               │
│ [ Open session record ] [ Open mentor profile ]                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ INVESTIGATION                                                                 │
│ ▶ Notes (internal — not visible to anyone outside T&S)                       │
│ [ + Add internal note ]                                                       │
│                                                                                │
│ ▶ Actions taken                                                                │
│  • [ Pause mentor pending review ]                                            │
│  • [ Send formal warning ]                                                    │
│  • [ Suspend mentor ]                                                         │
│  • [ Forward to legal ]                                                       │
│  • [ Notify enterprise (if applicable) ]                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ RESOLUTION                                                                    │
│ Decision                                                                       │
│ ○ Resolved (no action — investigated, not substantiated)                     │
│ ○ Resolved (action taken — describe)                                          │
│ ○ Escalated to legal                                                          │
│                                                                                │
│ Resolution summary (visible to reporter if non-anonymous)                    │
│ [ textarea ]                                                                   │
│                                                                                │
│ [ Cancel ]                                          [ Close case ]            │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States:** open · in_review · pending_legal · resolved · escalated

**Edge cases:**
- Anonymous case → contributor identity redacted from T&S view; only audit trail can recover (compliance + legal access only)
- Legal escalation → case routes out of admin queue; status "Escalated"; no further T&S edits
- Mentor suspension → cross-portal effect (mentor portal blocks login + active reviews reassign)

**Cognitive load:** action options are explicit — not buried in a free-text field.

---

### 5.I KYC review

#### 5.I.1 KYC queue — `/admin/kyc`
**Phase 1** · SOW §3.1.MVP.3 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ KYC reviews                                                    │
│ 1 pending · 12 approved (30d) · 2 rejected (30d)              │
├──────────────────────────────────────────────────────────────┤
│ [ Pending ] [ Approved ] [ Rejected ] [ Re-uploaded ]         │
├──────────────────────────────────────────────────────────────┤
│ ID       │ CONTRIBUTOR  │ TRACK    │ SUBMITTED  │ SLA   │ →   │
│ ─────────┼──────────────┼──────────┼────────────┼───────┼─────│
│ KYC-892  │ Anita R.     │ Women WF │ 4h ago     │ 8h    │ [→] │
│ KYC-891  │ Vivek M.     │ Freelnce │ 1d ago     │ done  │ [→] │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.I.2 KYC case detail — `/admin/kyc/[caseId]`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ ← KYC · KYC-892 · Anita R.                                     │
├──────────────────────────────────────────────────────────────┤
│ Submitted: 4h ago · SLA: 8h (4h remaining)                    │
│                                                                │
│ IDENTITY                                                       │
│ Name        Anita Ramesh                                      │
│ DOB         15-Mar-1995                                       │
│ Country     India                                             │
│ Track       Women workforce                                   │
│                                                                │
│ ID UPLOAD                                                     │
│ Type        Aadhaar                                           │
│ Number      ****-****-1234 (last 4 visible only)              │
│ Photo       [ View encrypted ]                                │
│                                                                │
│ AUTOMATED CHECKS                                              │
│ ✓ ID format valid                                             │
│ ✓ Name match (90% confidence)                                 │
│ ⚠ Photo clarity: medium (manual review recommended)          │
│ ✓ No watchlist match                                          │
│                                                                │
│ DECISION                                                       │
│ ○ Approve                                                      │
│ ○ Request more info (specify what)                            │
│ ○ Reject (specify reason)                                     │
│                                                                │
│ Note (audit + visible to contributor on approval/rejection)   │
│ [ textarea ]                                                   │
│                                                                │
│ [ Cancel ]                              [ Submit decision ]   │
└──────────────────────────────────────────────────────────────┘
```

**Edge cases:**
- Underage at submission → auto-reject (system; case doesn't reach admin)
- Watchlist match → flagged immediately to compliance, not in normal queue
- Photo unreadable → "Request more info" path

---

### 5.J Cross-tenant audit

#### 5.J.1 Audit — `/admin/audit`
**Phase 1** · SOW §3.1.MVP.8 · 🚧 BUILD

Same shape as enterprise audit (doc 02 §5.H.1) but **cross-tenant** — every event from every tenant, plus internal Glimmora actions.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Cross-tenant audit                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ FILTERS                                                                       │
│ Tenant       [ All ▾ ]                                                        │
│ Actor        [ Any ▾ ]                                                        │
│ Resource     [ Any ▾ ]                                                        │
│ Action       [ Any ▾ ]                                                        │
│ Severity     [ Any ▾ ]                                                        │
│ Time         [ Last 7 days ▾ ]                                                │
│              [ Apply ]   [ Clear ]   [ Save filter ]                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIMESTAMP        │ TENANT       │ ACTOR        │ ACTION        │ SEVERITY   │
│ ──────────────────┼──────────────┼──────────────┼───────────────┼───────────│
│ 12:14 May 26      │ Acme Corp    │ Sandeep K.   │ sow.approve   │ info       │
│ 12:08             │ Helios Stud. │ Priya I.     │ review.accept │ info       │
│ 11:45             │ —            │ Aishwarya R. │ mentor.suspend│ warning    │
│ ...                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Compliance access:** can see all tenants' events. Other roles: only events affecting their domain.

---

### 5.K AI agents

#### 5.K.1 AI agents list — `/admin/ai`
**Phase 1** · SOW §3.1.MVP.7 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ AI agents                                                      │
│ 4 MVP agents (per SOW §3.1.MVP.7)                              │
├──────────────────────────────────────────────────────────────┤
│ AGENT                  │ STATUS  │ MODEL          │ PROMPT v   │
│ ────────────────────────┼─────────┼────────────────┼───────────│
│ SOW Intake Assistant   │ Enabled │ claude-haiku-4-5 │ v3       │
│ Decomposition Assist.  │ Enabled │ claude-sonnet-4-6│ v2       │
│ Contributor Support    │ Enabled │ claude-haiku-4-5 │ v5       │
│ Review Assistant       │ Enabled │ claude-sonnet-4-6│ v4       │
└──────────────────────────────────────────────────────────────┘
```

**Phase 1 affordances per agent:** enable/disable, model id, active prompt version, rollback prompt, view recent invocations. Bias monitoring + risk tier config = Phase 2.

---

#### 5.K.2 Agent detail — `/admin/ai/[agentId]`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ ← AI · Review Assistant                                        │
├──────────────────────────────────────────────────────────────┤
│ STATUS         [ ✓ Enabled ]    [ Pause agent ]                │
│ MODEL          [ claude-sonnet-4-6 ▾ ]                         │
│ ACTIVE PROMPT  [ review-assistant.score-rubric ] v4            │
│                [ Switch prompt version → ]                     │
│                                                                │
│ AUTONOMY POLICY                                                │
│ Phase 1: assistive only — every output is reviewed by a       │
│ human. No autonomous decisions are taken. (§3.1.MVP.7)        │
│                                                                │
│ RECENT INVOCATIONS (last 24h)                                 │
│ 142 invocations · avg latency 2.1s · 0 errors                 │
│ [ Open invocation log → ]                                      │
│                                                                │
│ OVERRIDE STATS (mentor portal)                                │
│ Accepted as-is: 61% · Modified: 28% · Overridden: 11%         │
│ [ View AI override deltas in audit → ]                        │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.K.3 Prompt templates — `/admin/ai/prompts`
**Phase 1**

List of all prompt templates across agents. Each has version history.

---

#### 5.K.4 Prompt editor + version — `/admin/ai/prompts/[promptId]`
**Phase 1** · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Prompts · review-assistant.score-rubric · v4 (active)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ PROMPT BODY                                                                   │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ You are a reviewer assistant helping a human mentor grade...            │ │
│ │ [ ... multi-line prompt ... ]                                            │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│ VARIABLES                                                                     │
│   {{taskBrief}} {{criteria[]}} {{evidence[]}} {{contributorDigitalTwin}}     │
│                                                                                │
│ EXPECTED OUTPUT SCHEMA (JSON)                                                 │
│ { suggestions: [{ criterionId, score, confidence, sources[] }] }              │
├──────────────────────────────────────────────────────────────────────────────┤
│ VERSION HISTORY                                                               │
│ ● v4 (active) — May 24 by Aishwarya — "tuned confidence calibration"         │
│ ○ v3 — May 18 by Aishwarya — "broader source attribution"                    │
│ ○ v2 — May 8 — "initial production"                                          │
│ ○ v1 — Apr 22 — "pilot"                                                       │
│ [ Roll back to selected version ]                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ Save as new version ]   [ Test in sandbox ]                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Edge:** rollback writes audit; next agent invocation picks the new active.

---

### 5.L Payment rails

#### 5.L.1 Payment rails — `/admin/payment-rails`
**Phase 1** · SOW §3.1.MVP.6 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Payment rails                                                  │
├──────────────────────────────────────────────────────────────┤
│ RAIL              │ COUNTRY │ STATUS    │ ERROR RATE (1h)    │
│ ───────────────────┼─────────┼───────────┼────────────────────│
│ Razorpay (NEFT)   │ India   │ Active    │ 0.0%               │
│ Razorpay (UPI)    │ India   │ ⚠ Degraded│ 4.2%               │
│ Razorpay (Wallet) │ India   │ Active    │ 0.1%               │
│ Wise              │ Global  │ Active    │ 0.0%               │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.L.2 Rail detail — `/admin/payment-rails/[railId]`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ ← Razorpay (UPI) · ⚠ Degraded                                  │
├──────────────────────────────────────────────────────────────┤
│ CREDENTIALS                                                    │
│ Key ID        [ ****1234 ]   [ Rotate key ]                   │
│ Secret        ******** (last rotated 60d ago)                 │
│ Webhook URL   https://api.glimmora.app/rails/razorpay-upi    │
│                                                                │
│ STATUS                                                         │
│ Current: ⚠ Degraded · since 1h ago                            │
│ Error rate (1h): 4.2% · 5xx primarily                         │
│ [ Test rail ]   [ Pause new payouts ]   [ Re-enable ]         │
│                                                                │
│ HOLD POLICY                                                    │
│ When degraded:                                                │
│  ◉ Hold new payouts until error rate < 1% for 10 min          │
│  ○ Continue routing despite errors (not recommended)          │
│                                                                │
│ PENDING PAYOUTS ON THIS RAIL                                  │
│ 42 payouts · ₹68,400 total · oldest 1h held                   │
│ [ Drain to fallback rail → ]                                  │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** "Drain to fallback" → moves pending payouts to another rail of the same currency/country if configured; audited.

---

### 5.M System health

#### 5.M.1 System health — `/admin/system-health`
**Phase 1** · SOW §3.1.MVP.8 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ System health · PROD                                           │
├──────────────────────────────────────────────────────────────┤
│ SERVICES                                                       │
│ ● auth-service        healthy · p95 80ms · 0 errors (10m)     │
│ ● tenant-service      healthy · p95 60ms · 0 errors           │
│ ● task-service        healthy · p95 110ms · 2 errors          │
│ ● review-service      healthy · p95 90ms · 0 errors           │
│ ● audit-service       healthy · p95 40ms · 0 errors           │
│ ⚠ payment-router      degraded · p95 2.1s · 12 errors         │
│ ● notification-svc    healthy · p95 110ms · 0 errors          │
│ ● ai-orchestrator     healthy · p95 1.8s · 0 errors           │
│ ● file-scan-service   healthy · p95 5s · 0 errors             │
│ ● skill-graph-service healthy · p95 150ms · 0 errors          │
│ ● kyc-service         healthy · p95 200ms · 0 errors          │
│ ● email-service       healthy · p95 800ms · 0 errors          │
├──────────────────────────────────────────────────────────────┤
│ RECENT ALERTS                                                  │
│ ⚠ payment-router error rate elevated · 1h ago · ongoing       │
│ ✓ task-service latency recovered · 6h ago                     │
│ ✓ ai-orchestrator cold-start spike resolved · yesterday       │
└──────────────────────────────────────────────────────────────┘
```

**Phase 1:** read-only status. Full SRE control plane = Phase 2.

---

### 5.N Partnerships

#### 5.N.1 Universities — `/admin/partnerships/universities`
**Phase 1** · SOW §20.1 · 🚧 BUILD (minimal)

```
┌──────────────────────────────────────────────────────────────┐
│ Universities                                  [ + New partner ]│
│ 8 active · 24 student onboardings in flight                   │
├──────────────────────────────────────────────────────────────┤
│ UNIVERSITY        │ COUNTRY │ AGREEMENT     │ STUDENTS │ LEAD │
│ ───────────────────┼─────────┼───────────────┼──────────┼──────│
│ Anna University   │ India   │ MOU-2026-014  │   42     │ ...  │
│ IIT Madras        │ India   │ MOU-2026-019  │   18     │ ...  │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.N.2 University detail — `/admin/partnerships/universities/[uniId]`
**Phase 1**

Agreement reference, contact persons, supervisor list, student cohort, academic recognition rules (Phase 2: full mapping; Phase 1: text fields).

---

#### 5.N.3 Women workforce partners — `/admin/partnerships/women-workforce`
**Phase 1** · SOW §20.2 · 🚧 BUILD (minimal)

```
┌──────────────────────────────────────────────────────────────┐
│ Women workforce partners                       [ + New ]      │
│ 5 active · 38 contributors via partners                       │
├──────────────────────────────────────────────────────────────┤
│ ORG               │ COUNTRY │ CONTRIBUTORS │ PROGRAMS         │
│ ───────────────────┼─────────┼──────────────┼──────────────── │
│ Sheroes.in        │ India   │     18       │ Mentorship pair  │
│ WomenWhoCode      │ Global  │     12       │ Outreach         │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.N.4 Partner detail — `/admin/partnerships/women-workforce/[orgId]`
**Phase 1**

Contact, program description, contributor cohort, peer-mentor pairings (with link to /mentor portal coordination).

---

### 5.O Roles & permissions

#### 5.O.1 Roles — `/admin/roles`
**Phase 1** · SOW §3.1.MVP.8 · ✅ KEEP (exists, minimal)

Lists every role across all portals (`ent.*`, `mentor.*`, `plat.*`, contributor). Per-role permissions visible read-only; Platform Admin can add new platform-side roles.

Phase 2: full permission editing UI. Phase 1: roles are mostly seed-data + protected.

---

### 5.P Profile / Settings / Notifications

#### 5.P.1 Profile — `/admin/profile`
**Phase 1**

Lightweight: name, email, roles, MFA status, sessions, last activity.

---

#### 5.P.2 Settings — `/admin/settings`
**Phase 1**

Notification prefs · default environment on login · timezone display preference.

---

#### 5.P.3 Notifications — `/admin/notifications`
**Phase 1**

Filter: All · Cases · System · Tenants. Click → context.

---

## 6. Shared component patterns

Same primitives as previous docs. Admin-specific:

### 6.1 Environment chip
Topbar element. Color-coded: PROD red-ringed, STAGING amber, DEV blue. Click → switcher.

### 6.2 Cross-tenant audit row
Includes tenant column. PII redaction respected per case (anonymous reports).

### 6.3 KYC redacted view
ID numbers show last 4 digits only; full reveal requires a second click + audit event.

### 6.4 Wizard for provisioning
Same 6-step pattern reused for tenant onboarding and mentor onboarding.

### 6.5 Activity feed
Reusable component for "last 24h activity" on Dashboard, Tenant detail, Mentor detail, Agent detail.

---

## 7. State machines

### 7.1 Tenant lifecycle

```
[Draft] ── provision ──> [Provisioning] ── admin signs in ──> [Active]
                              │                                    │
                              ▼ failure                            ▼ pause
                          [Failed]                            [Paused]
                                                                   │
                                                                   ▼ resume
                                                              [Active]
                                                                   │
                                                                   ▼ termination
                                                              [Closed]
```

### 7.2 Mentor lifecycle

```
[Invited] ── first sign-in ──> [Active] ── pause ──> [Paused]
                                  │                       │
                                  ▼ suspend               ▼ reinstate
                              [Suspended]             [Active]
                                  │
                                  ▼ terminate
                              [Closed]
```

### 7.3 Governance case lifecycle

```
[Open] ── assign ──> [In review] ── resolve ──> [Resolved: action]
   │                                              [Resolved: no action]
   ▼ escalate                                     [Escalated to legal]
[Pending legal]
```

### 7.4 KYC case lifecycle

```
[Submitted] ── auto-checks ──> [Pending review] ── approve ──> [Approved]
                                                       │
                                                       ├ request more ──> [Awaiting info] ── re-upload ──> [Pending review]
                                                       │
                                                       └ reject ──> [Rejected] ── contributor appeals ──> [Pending review]
```

### 7.5 AI agent prompt lifecycle

```
[Draft] ── activate ──> [Active] (one per agent)
                            │
                            ▼ rollback / replace
                       [Inactive] (prior versions retained)
```

---

## 8. Cross-portal touchpoints

| Event in admin portal | Affects | Cross-fn doc |
|---|---|---|
| Tenant provisioned | Enterprise portal becomes accessible for that tenant | 02, 05 |
| Mentor invited | Mentor portal access for that user | 03 |
| Mentor suspended | Mentor portal logout + queue reassignment | 03 |
| Skill added | Onboarding skill picker (all tenants) + matching | 01, 05 |
| Skill merged | Existing contributors' skills migrated | 01 |
| Rubric template change | Mentors' default rubric updates for new reviews | 03 |
| Governance case resolved (action: suspend mentor) | Mentor portal block | 03 |
| Governance case (notify enterprise) | Enterprise audit + notification | 02 |
| KYC approved | Contributor onboarding completes | 01 |
| KYC rejected | Contributor sees rejection + appeal path | 01 |
| AI agent disabled | Affected portal loses AI suggestions (graceful degrade) | 01, 02, 03 |
| Prompt rolled back | Next AI invocation uses new active prompt | all |
| Payment rail paused | Pending payouts hold | 02 |
| University agreement added | Student onboarding can select this university | 01 |

---

## 9. Data model sketch (admin-relevant entities)

| Entity | Key fields | Notes |
|---|---|---|
| Tenant | (see doc 02) | Created here |
| EnterpriseUser | (see doc 02) | Invited here |
| Mentor | (see doc 03) | Onboarded here |
| MentorPool | id, name, scope (tenantId | "cross-tenant"), leadMentorId, members[] | Admin-set |
| Skill | id, name, category, aliases[], adjacency[], status (active/deprecated/pending), createdBy, createdAt | Single global taxonomy |
| SkillMerge | sourceSkillId, targetSkillId, mergedAt, mergedBy, reason | Audit-grade |
| RubricTemplate | id, name, appliesTo, criteria[], feedbackLibrary[], version | Versioned |
| RubricCriterion | id, label, description, weight, scaleMax | Within template |
| EmailTemplate | id, kind, subject, body (MJML/React), variables[], version | Existing |
| GovernanceCase | id, type, source, severity, openedAt, assignedTo, status, notes[], resolution | Internal + audit |
| KycCase | id, contributorId, submittedAt, status, decision, decisionNote, decidedAt, decidedBy | One per contributor |
| AuditEvent | (cross-tenant — see doc 05) | Aggregated here |
| Agent | id, name, status (enabled/paused), modelId, activePromptId | 4 in Phase 1 |
| PromptTemplate | id, agentId, name, body, variables, expectedSchema, version, status (active/draft/archived), createdBy | Versioned |
| PaymentRail | id, provider, country, currency, status, errorRate, credentialsRef, holdPolicy | Encrypted credentials reference |
| University | id, name, country, agreementRef, contactPersons[], supervisors[], academicRecognitionRules | Phase 1 minimal |
| WomenWorkforcePartner | id, name, country, contactPersons[], programs[], mentorshipPairings[] | Phase 1 minimal |
| Role | code, scope (plat/ent/mentor/contributor), permissions[], description | Static taxonomy + admin-extensible plat.* |
| ServiceHealthCheck | service, status, p95Latency, errorCount, checkedAt | Aggregated by health collector |

Full schema in cross-functional doc 05.

---

## 10. RBAC matrix (Platform-side)

| Action | admin | tsm | mpm | tns | compliance | payments | partnerships | ai |
|---|---|---|---|---|---|---|---|---|
| Provision tenant | ✓ | ✓ | — | — | — | — | — | — |
| Suspend tenant | ✓ | ✓ | — | — | — | — | — | — |
| Create mentor | ✓ | — | ✓ | — | — | — | — | — |
| Suspend mentor | ✓ | — | ✓ | ✓ (via governance) | — | — | — | — |
| Edit competency | ✓ | — | ✓ | — | — | — | — | — |
| Add skill | ✓ | — | ✓ | — | — | — | — | — |
| Deprecate skill | ✓ | — | ✓ | — | — | — | — | — |
| Merge skills | ✓ | — | ✓ | — | — | — | — | — |
| Edit rubric template | ✓ | — | ✓ | — | — | — | — | — |
| Triage governance case | ✓ | — | — | ✓ | view | — | — | — |
| KYC decision | ✓ | — | — | ✓ | view | — | — | — |
| Read cross-tenant audit | ✓ | — | — | view | ✓ | view | — | — |
| Export audit | ✓ | — | — | — | ✓ | — | — | — |
| Configure AI agent | ✓ | — | — | — | view | — | — | ✓ |
| Rollback prompt | ✓ | — | — | — | — | — | — | ✓ |
| Configure payment rail | ✓ | — | — | — | view | ✓ | — | — |
| Pause / drain rail | ✓ | — | — | — | — | ✓ | — | — |
| Add university | ✓ | — | view | — | — | — | ✓ | — |
| Add WW partner | ✓ | — | view | — | — | — | ✓ | — |
| Add platform-side role | ✓ | — | — | — | — | — | — | — |
| View system health | ✓ | view | — | — | — | view | — | view |

---

## 11. Open decisions

1. **Glimmora SSO only for staff** — proposed: no password fallback for `/admin/*`; all staff use enterprise IdP. Confirm.

2. **Anonymous safety case handling** — proposed: contributor identity redacted from T&S view; only audit trail can recover with compliance + legal access. Confirm acceptable for safety SLA.

3. **KYC SLA** — proposed: 8h business hours from submission. Confirm.

4. **KYC manual review trigger threshold** — proposed: auto-checks pass → no manual review; flag ≥ 1 issue → manual review queue. Confirm. (Alternative: random 5% manual audit even on clean cases — for assurance.)

5. **Cross-tenant audit retention** — proposed: indefinite (subject to legal hold). Confirm.

6. **Skill taxonomy "pending review" status** — proposed: new skill suggested by contributor or mentor goes to pending → MPM reviews → active or rejected. Confirm.

7. **Rubric template editing scope** — proposed: Phase 1 = MPM can edit global templates; enterprises copy and customize on their side. Phase 2: per-enterprise rubric authoring lives in enterprise admin. Confirm Phase 1.

8. **AI agent Phase 1 controls** — proposed: enable/disable + model id + active prompt version + rollback only. Bias monitoring + risk tier config = Phase 2. Confirm minimum.

9. **Prompt sandbox testing** — proposed: in-app sandbox to test a new prompt against last 10 real (anonymized) invocations. Phase 1 nice-to-have. Confirm whether required.

10. **Payment rail fallback rules** — proposed: per-rail "drain to fallback rail" affordance; admin-initiated, not automatic. Phase 2: auto-failover. Confirm.

11. **System health Phase 1 floor** — proposed: status + p95 latency + error count per critical service; no graphs. Full SRE = Phase 2. Confirm.

12. **University agreement enforcement** — proposed: Phase 1 = directory only (no machine-readable enforcement); supervisor approval still happens via human handshake. Phase 2: structured academic-credit rules. Confirm Phase 1.

13. **Women workforce program design** — proposed: Phase 1 = directory + peer-mentor pairing list (no scheduled programs UI). Confirm.

14. **Roles editing in Phase 1** — proposed: only Platform Admin can edit; UI mostly read-only except for new platform-side roles. Confirm.

15. **Environment switcher behavior** — proposed: new tab on switch, never in-place. Prevents accidental cross-env writes. Confirm.

---

## End of platform admin portal spec

Next docs:
- `05-cross-functional.md` — Auth, RBAC enforcement, audit system, AI service contracts, notifications, integrations, accessibility, immutable data model
- `06-phase-1-scope-lockdown.md` — Consolidated 90-day checklist across all four portals + cross-functional
