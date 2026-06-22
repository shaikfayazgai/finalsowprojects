# Phase 1 Scope Lockdown — 90-Day Execution Plan

> **Status:** Draft v1.0 — Phase 1 commitment record
> **SOW anchor:** GLIMMORATEAM™ Global Workforce Intelligence Platform v1.1, §22.1
> **Owner:** Product · Engineering · Glimmora Leadership
> **Last updated:** 2026-05-26
> **Source-of-truth for:** what we ship in Phase 1, in what order, and how we know we're done

---

## 0. Document control

| Field | Value |
|---|---|
| Document role | **The contract.** Every Phase 1 commitment from docs 01–05 is enumerated here with sequencing and exit criteria |
| Audience | Sponsor, PM, Engineering Manager, Engineering Leads, QA Lead, Security, SRE, Legal |
| Replaces | All prior phase-1 docs in `docs/phase-1/` |
| Locks down on sign-off | Once signed, scope changes require formal change order |
| Phase 1 horizon | 0–90 days from start |

### How to use this document

- **For Sponsor:** §3 (90-day timeline) and §10 (integrated exit criteria) — read these to decide go/no-go
- **For EM:** §4 (workstreams), §5 (week-by-week), §6 (dependencies), §11 (risks)
- **For Engineering Lead:** §4–6, plus §7 for the per-portal punch lists
- **For QA Lead:** §10 (exit criteria) becomes the master test plan
- **For Security:** §9 (security gates) — these are hard blockers for go-live

---

## 1. Executive summary

GlimmoraTeam Phase 1 ships a **production-usable MVP** of the Global Workforce Intelligence Platform that can run real pilot projects end-to-end with governed workflows, evidence-based delivery, and auditable operations.

**In 90 days we deliver:**

- 4 portals (Contributor · Enterprise · Mentor · Platform Admin) operating against real persistence
- The full SOW lifecycle: intake → 5-stage approval → decomposition → matching → execution → review → acceptance → payout → credential
- SSO (SAML + OIDC), MFA, server-side RBAC, tenant isolation, unified immutable audit
- 4 assistive AI agents (SOW Intake, Decomposition, Contributor Support, Review)
- Rate cards, payout eligibility, billing/payout export, Razorpay India payment rail
- HRIS sync (Workday/BambooHR/CSV), outbound webhooks (Jira/Slack/generic), ERP file drop
- WCAG 2.1 AA compliance for core journeys
- 2–3 real pilot projects executed and closed with accepted outcomes

**What we do NOT ship (Phase 2):**

- Autonomous Project Governor · Dynamic/surge pricing · Cryptographic credentials · Advanced fraud detection · Multi-region · Deep ERP automation · Full Analytics console · Full Compliance evidence locker · Bias-monitoring AI governance · Native mobile

**Confidence:** Phase 1 plan is bound by the SOW. Every commitment has a section reference in docs 01–05. Everything outside this document is Phase 2 or change-order.

---

## 2. Scope baseline (consolidated from docs 01–05)

### 2.1 Counts

| Source | Phase 1 capabilities |
|---|---|
| Contributor portal (doc 01 §2.1) | 29 |
| Enterprise portal (doc 02 §2.1) | 38 |
| Mentor portal (doc 03 §2.1) | 30 |
| Platform admin portal (doc 04 §2.1) | 18 |
| Cross-functional (doc 05 §14.1) | 19 |
| **Total** | **134 Phase 1 commitments** |

### 2.2 Effort distribution (approximate)

| Bucket | Items | What this means |
|---|---|---|
| ✅ KEEP (Phase 1-ready in code) | ~25 | Cosmetic polish only |
| 🔧 WIRE (mock today; persist + integrate) | ~50 | Backend work; UI mostly done |
| 🚧 BUILD (does not exist) | ~55 | Full new build (UI + backend) |
| 🔒 SEAL (over-scoped — hide for Phase 1) | ~14 | Remove from nav; route gates |

> Numbers are approximate — the per-doc tables in each portal spec are authoritative.

### 2.3 Personas served at Phase 1 go-live

| Portal | Personas |
|---|---|
| Contributor | Internal employee, External freelancer, Student, Women workforce |
| Enterprise | Admin, Sponsor, PMO, Finance, Compliance, Reviewer, Procurement, IT |
| Mentor | Mentor, Senior mentor, Lead mentor |
| Platform Admin | Platform admin, TSM, MPM, T&S, Compliance, Payments, Partnerships, AI Operator |

---

## 3. 90-day timeline

```
Week:   1   2   3   4   5   6   7   8   9   10  11  12  13
       └───────────┴───────────────┴───────────────┴─────┘
       FOUNDATIONS  ORIGINATION    DELIVERY        HARDENING
       (1A)         (1B)           (1C)            (1D)
       Days 1-30    Days 31-60     Days 61-80      Days 81-90

       ✅ W1 done
        (foundation backbone — see §10.0)
```

| Phase | Window | Theme | Status | Exit gate |
|---|---|---|---|---|
| **1A — Foundations** | Days 1–30 (Weeks 1–4) | Identity, RBAC, audit, AI orchestrator, notifications, file scan, skill taxonomy seed | 🟡 **W1 ✅** · W2–W4 pending | All four portals render with real auth + RBAC + tenant scope; audit writes for every state change |
| **1B — Origination** | Days 31–60 (Weeks 5–8) | SOW lifecycle (intake → approval → decomposition), contributor onboarding, mentor queue + review, HRIS sync | ⏳ Not started | A SOW can be uploaded, approved, decomposed; a contributor can onboard; a mentor can review; tasks flow between portals |
| **1C — Delivery** | Days 61–80 (Weeks 9–12) | Submission → two-stage review → acceptance → payout → credential; rate cards; mentorship sessions; governance triage; ERP export | ⏳ Not started | A complete SOW → submission → payout flow works end-to-end with real payment rail |
| **1D — Hardening** | Days 81–90 (Week 13) | WCAG audit, pen test, performance, pilot execution, training, go-live | ⏳ Not started | Two pilot SOWs executed end-to-end; security sign-off; UAT passed |

---

## 4. Workstreams

Eight parallel workstreams. Each has an owner, deliverables, and exit conditions. Mapping to SOW §22.1 explicit workstreams in column 3.

| WS | Workstream | SOW §22.1 | Owner | Phase 1A→1D involvement |
|---|---|---|---|---|
| **WS-1** | Platform Foundations | Platform Setup | EM Platform | 1A heavy, 1B+ maintenance |
| **WS-2** | Identity & Access | Identity & Access | EM Security | 1A heavy, 1B medium, 1C+ light |
| **WS-3** | Core Workflow (SOW/Decomp/Task) | Core Workflow | EM Enterprise | 1B heavy, 1C medium |
| **WS-4** | Contributor Experience | Contributor Experience | EM Contributor | 1A onboarding, 1B–1C heavy |
| **WS-5** | Mentor Experience | (implicit in §22.1) | EM Mentor | 1B–1C heavy |
| **WS-6** | Matching v1 | Matching v1 | EM Platform | 1B medium, 1C medium |
| **WS-7** | Commercial Baseline | Commercial Baseline | EM Finance | 1C heavy |
| **WS-8** | Observability + Pilot | Observability + Pilot Execution | SRE Lead + PM | 1A light, 1D heavy |

### 4.1 WS-1 — Platform Foundations

**Deliverables (across phases):**

- Postgres + Prisma schema with multi-tenant RLS (doc 05 §3.5, §8.1)
- Next.js middleware for auth + portal scope + tenant + MFA (doc 05 §3.3)
- Audit service: append-only Postgres + HMAC signing + S3 snapshot (doc 05 §4)
- AI orchestrator: 4 agents with confidence + override capture + graceful degrade (doc 05 §5)
- Notification service: in-app + email (SendGrid) + SMS (Twilio + MSG91) (doc 05 §6)
- File scan service: ClamAV + plagiarism provider (doc 05 §7.6)
- Structured logging + tracing + metrics (doc 05 §12)
- Secret management + TLS + dependency scanning (doc 05 §13.2)
- i18n framework (doc 05 §11)

**Exit conditions:** Cross-functional exit criteria in doc 05 §14.3.

---

### 4.2 WS-2 — Identity & Access

**Deliverables:**

- SAML 2.0 IdP integration (Azure AD, Okta, generic) (doc 05 §2.2)
- OIDC IdP integration (Google Workspace, generic) (doc 05 §2.2)
- Glimmora staff SSO (doc 04 §5.A.1)
- MFA: TOTP, SMS, email; backup codes; trusted device 30d (doc 01 §5.A.7, doc 05 §2.4)
- RBAC role taxonomy seed (doc 05 §3.1)
- Permission matrix + middleware enforcement (doc 05 §3.3)
- Tenant RLS policies (doc 05 §3.5)
- SoD warnings (doc 05 §3.6)

**Exit conditions:**
- SAML SSO works for ≥1 test enterprise tenant
- OIDC works for Glimmora staff
- RLS rejects cross-tenant queries in pen-test
- All four portals enforce server-side RBAC per their per-portal RBAC matrix

---

### 4.3 WS-3 — Core Workflow (SOW + Decomposition + Task)

**Deliverables:**

| Item | Doc |
|---|---|
| SOW intake (upload + author + template modes) | 02 §5.C.3–5.C.5 |
| AI metadata extraction (SOW Intake Assistant) | 02 §5.C.3, 05 §5 |
| SOW versioning + version history view | 02 §5.C.8 |
| 5-stage approval pipeline with audit + notifications | 02 §5.C.9 |
| SOW templates editor (2 default templates seeded) | 02 §5.C.10 |
| Decomposition workspace (AI suggestions + skills + dependencies + critical path) | 02 §5.D.2 |
| Decomposition approval gate | 02 §5.D.4 |
| Project provisioning on decomposition approval | 02 §5.E.1 |
| Project portfolio + tabs (Overview, Milestones, Tasks, Team, Exceptions, Budget) | 02 §5.E |
| Exception management (extend SLA, reassign, escalate) | 02 §5.E.7 |

**Exit conditions:**
- One SOW uploaded → AI extracted metadata → human approved → 5 stages passed → decomposition → tasks ready for matching
- Audit log shows every state transition
- Cross-portal: tasks visible in contributor matching surface

---

### 4.4 WS-4 — Contributor Experience

**Deliverables:**

| Item | Doc |
|---|---|
| Registration (credentials + OAuth) + email OTP verification | 01 §5.A.3–5.A.4 |
| Onboarding 9-step flow + persona variants | 01 §5.B |
| Dashboard with persona-conditional modules (Internal · Student · Women WF · Freelance) | 01 §5.C.1–5.C.3 |
| Assigned list with priority + filter + accept/decline | 01 §5.D |
| Workroom (4-zone: header + work pane + context rail + footer) | 01 §5.E.1 |
| Evidence upload with virus + plagiarism scan | 01 §5.E.1, 05 §7.6 |
| Q&A / clarification thread | 01 §5.E.3 |
| Submission flow with terminal confirmation | 01 §5.F |
| Revisions queue + 3-block feedback + diff viewer + resubmit | 01 §5.H |
| Completed work + credential issuance + share | 01 §5.I, §5.M |
| Earnings + history + payout method setup + withdrawal + export | 01 §5.L |
| Profile + skills + digital twin + availability | 01 §5.K |
| Settings + notifications + privacy + language | 01 §5.N |
| Support: FAQs + tickets + safety report + grievance | 01 §5.O |
| Notifications page | 01 §5.P |
| AI signals (Contributor Support Assistant) | 01 §5.E.1, 05 §5 |

**Exit conditions:** Per doc 01 §2.3 — 10 contributor exit criteria.

---

### 4.5 WS-5 — Mentor Experience

**Deliverables:**

| Item | Doc |
|---|---|
| Dashboard with role-conditional modules | 03 §5.B |
| Review queue (SLA-ranked) + filters + "why first?" + flags | 03 §5.C |
| Review detail cockpit (3-zone, AI rubric pre-fill, override capture, 3-block feedback, coaching note) | 03 §5.D.1 |
| Decision modals (Accept · Rework · Reject) with confidence + consequence preview | 03 §5.D.2–5.D.4 |
| Reassign + withdraw (conflict of interest) | 03 §5.D.5–5.D.6 |
| Diff viewer | 03 §5.D.7 |
| History + personal metrics (no peer comparison) | 03 §5.E |
| Escalation queue + adjudication (senior+) | 03 §5.F |
| Mentorship sessions (women WF + student) + coaching notes | 03 §5.G |
| Profile + availability + competency view | 03 §5.H |

**Exit conditions:** Per doc 03 §2.3 — 13 mentor exit criteria.

---

### 4.6 WS-6 — Matching v1

**Deliverables:**

| Item | Doc |
|---|---|
| Skills-based recommendation engine (ranking by skills × availability × quality signals) | 02 §3.1.MVP.4 |
| "Why matched" explainable fields surfaced in contributor task preview | 01 §5.D.3 |
| Team formation (small team) with human confirmation | 02 §3.1.MVP.4 |
| Assignment workflow (accept/decline, reassignments, SLA timers) | 01 §5.D.4, 02 §5.E.7 |
| Mentor routing (by competency + pool + availability) | 03 §3.1 |
| Two-stage review routing (configurable at decomposition) | 02 §5.D.3, 03 §5.D.2 |

**Exit conditions:**
- Decomposition output produces ≥10 tasks; matching ranks ≥5 candidates per task
- Each ranked candidate shows ≥1 "why matched" reason
- Mentor competency matrix routes review to eligible mentors only

---

### 4.7 WS-7 — Commercial Baseline

**Deliverables:**

| Item | Doc |
|---|---|
| Rate cards: tenant + project scope, role × skill × level × region | 02 §5.G.4–5.G.6 |
| Pricing engine: rate × effort → task payout | 02 §3.1.MVP.6 |
| Payout eligibility on acceptance + ledger | 02 §5.G.7 |
| Billing list + invoice detail | 02 §5.G.1–5.G.3 |
| Payout release (manual batch) + reversal | 02 §5.G.7–5.G.8 |
| Billing/payout export (CSV/PDF/JSON) | 02 §5.G.9 |
| Contributor earnings overview + history + withdrawal | 01 §5.L |
| Razorpay India integration (bank/UPI/wallet) | 05 §7.5 |
| Wise integration (global, basic) | 05 §7.5 |
| ERP file drop (SFTP/S3) + GL code mapping + PO mapping | 02 §5.K.7 |
| Procurement: PO requirement flag per project | 02 §3.1.7 |
| Contributor payout method setup + verification | 01 §5.L.3–5.L.4 |

**Exit conditions:**
- One rate card created → applied to ≥10 tasks → priced correctly
- One contributor onboarded a bank/UPI payout method → verified
- One real payout completed end-to-end via Razorpay
- Finance can export CSV for billing + payout for a complete period
- ERP file drop delivers weekly CSV to a configured SFTP destination

---

### 4.8 WS-8 — Observability + Pilot

**Deliverables:**

| Item | Doc |
|---|---|
| Service health page (admin) | 04 §5.M |
| Error reporting + alerting on critical services | 05 §12.1 |
| Metrics dashboards (Prometheus + Grafana) | 05 §12.2 |
| Synthetic monitoring (login, SOW upload, submission) | implicit |
| Pilot project #1: real customer SOW, executed end-to-end | 22.1 §22.1 |
| Pilot project #2: 2nd customer or 2nd SOW within first customer | 22.1 §22.1 |
| Hypercare runbook | 22.1 |
| Training materials (admin, sponsor, mentor, contributor) | implicit |
| Documentation: OpenAPI 3.1 + user guides | 02 §3.1.MVP.8 |

**Exit conditions:**
- Two pilot SOWs run to acceptance with exported financial reports
- All P0/P1 bugs from pilots resolved
- Customer signs off on pilot acceptance pack

---

### 4.9 WS-9 — UI Polish Sprint

> Added 2026-05-26 after a mid-build review. Phase 1 feature wiring is
> producing functional but visually-mixed screens — Meridian-style v2
> surfaces alongside legacy V3 mock pages. This workstream is the
> scheduled correction so the pilot demo lands as a coherent product,
> not a patchwork.

**Why now (mid-Phase-1):**
Backend criteria 1–20 gate pilot acceptance more directly than visual
polish; pausing for UI redesign mid-build would force rework when
downstream data contracts settle. But shipping pilot demos on the
current mixed UI risks an "obviously half-built" perception. The
polish sprint resolves this by scheduling the visual pass for the
window after data contracts stabilize and before pilot execution.

**Deliverables:**

| Item | Doc |
|---|---|
| Apply Meridian design tokens consistently across all live screens | docs 01–04 §UI |
| Convert remaining V3 mock dashboards to live-data Meridian surfaces | 01 §3 / 02 §3 / 03 §3 / 04 §3 |
| Replace placeholder skeletons with proper structure-shaped loaders | (per page) |
| Empty states + zero-data fallbacks for every list/table | (per page) |
| Error surfaces wired through SowApiError-style discriminator pattern | 05 §11.3 |
| Sidebar navigation aligned with role-scoped portal specs | 05 §3.2 |
| Mobile breakpoint pass for contributor portal | 01 §11 |
| WCAG 2.1 AA visual checks (contrast, focus rings, motion) | 10.2 #25 |

**Timing:**
- Design audit + token coverage map: Week 6 (starts in parallel with WS-3)
- Per-portal pass scheduled as features land:
  - Contributor portal: Week 9–10 (after evidence/submission lands)
  - Enterprise portal: Week 10–11 (after acceptance + billing lands)
  - Mentor portal: Week 11 (after review wiring lands)
  - Platform admin portal: Week 12 (alongside governance baseline)
- Cross-portal consistency sweep + visual QA: Week 12

**Owner:** Design lead with one front-end engineer; feature engineers
provide hooks/contracts but do not own visual work directly.

**Exit conditions:**
- All Phase 1 live routes pass a 4-portal visual diff against the
  portal-specs documents (01–04). Outstanding gaps logged with rationale.
- Zero pages in pilot scope still rendering pre-rebuild V3 mock data.
- WCAG 2.1 AA automated checks pass; manual review of golden-path
  flows finds no critical findings.

**What this is NOT:**
- Not a re-architecture. The portal-specs are the design baseline;
  this sprint executes against them, doesn't redesign them.
- Not a feature freeze. WS-1 through WS-8 keep wiring features in
  parallel; polish work merges via small PRs not big rewrites.

---

## 5. Week-by-week deliverable plan

> Format: each week's deliverable highlights. Detailed sub-tasks live in the engineering tracker (Linear/Jira), not here.

### Phase 1A — Foundations (Weeks 1–4)

#### Week 1 — Identity + Audit foundations
- Postgres + Prisma schema for User, Tenant, Role, AuditEvent, Session
- NextAuth v5 base config; password + OAuth working in dev
- Audit service skeleton (append-only insert + HMAC sign)
- Logging + tracing infra wired
- Repo + CI/CD baseline; environments DEV/STAGING/PROD set up

#### Week 2 — RBAC + Tenant isolation
- Role taxonomy seeded (doc 05 §3.1)
- Next.js middleware for auth + portal scope + tenant scope (doc 05 §3.3)
- Postgres RLS policies for tenant-scoped tables
- Login flow end-to-end with role-based portal routing
- Initial tenant seeding fixtures

#### Week 3 — SSO + MFA + Skill Taxonomy
- SAML 2.0 IdP integration (Azure AD or Okta test connection)
- OIDC IdP integration (Glimmora Google Workspace)
- MFA: TOTP setup + challenge; backup codes
- Skill taxonomy seed (≥200 starter skills)
- Skill taxonomy admin UI (doc 04 §5.E)

#### Week 4 — AI Orchestrator + Notifications + File Scan
- AI orchestrator with shared request/response envelope (doc 05 §5.2)
- 4 agent stubs registered (SOW Intake, Decomp, Contributor Support, Review)
- Notification service: in-app + email (SendGrid) working
- SMS rail (Twilio + MSG91) for critical only
- File scan: ClamAV sidecar working; virus detection verified

**1A exit gate (end of Week 4):**
- ⏳ All four portals render at their `/dashboard` route with real auth + RBAC + tenant scope _(middleware ✅; portal-specific route conversions pending)_
- ⏳ An admin can create a test tenant + invite a user + that user signs in _(schema ✅; provisioning UI not built)_
- ✅ A submitted form writes an audit event with valid signature _(verified via `/api/enterprise/acceptance` + `/api/sessions` + `/api/ai/invoke`)_
- ✅ AI orchestrator returns mock confidence-scored output for one agent _(all 4 agents live; smoke-verified contributor-support)_
- ⏳ Notification dispatches in-app + email for a test event _(notification service not yet built)_

---

### Phase 1B — Origination (Weeks 5–8)

#### Week 5 — SOW Intake + Approval
- SOW intake (Upload + Author modes); AI extraction wired to SOW Intake Assistant
- 5-stage approval pipeline UI; per-stage decision audit
- SOW versioning + history view
- Email templates for SOW lifecycle ready

#### Week 6 — Decomposition + Project Provisioning
- Decomposition workspace with milestones + tasks + skills + dependencies
- Critical path calculation (basic)
- Decomposition Assistant AI suggestions wired
- Decomposition approval gate
- Project provisioning on final SOW approval

#### Week 7 — Contributor Onboarding + Tasks list + Workroom shell
- Registration + OTP + 9-step onboarding flow
- Persona variants (Internal, Student, Women WF, Freelance)
- Dashboard with persona-conditional modules
- Assigned tasks list + filter + accept/decline modal
- Workroom layout (read-only — no submission yet)
- Contributor Support Assistant AI signals

#### Week 8 — Mentor Queue + Review Detail + HRIS Sync
- Mentor dashboard + queue + filters + "why first?"
- Review detail cockpit (rubric + 3-block feedback + AI assist + decision modal)
- Continuity / fresh / paired flags
- HRIS sync: Workday connector + manual CSV upload mode
- Webhook outbound (Jira sample fire)

**1B exit gate (end of Week 8):**
- A sponsor uploads a SOW → 5 stages pass → decomposed → tasks ready
- A contributor onboards → sees tasks → accepts one → opens workroom
- A mentor sees the assignment in queue → opens review → makes a decision
- HRIS sync ingests ≥5 employees from a CSV
- Audit log shows every transition

---

### Phase 1C — Delivery (Weeks 9–12)

#### Week 9 — Submission + Evidence Scan + Diff Viewer
- Workroom evidence upload with scan integration
- Q&A / clarification thread
- Submission screen with routing + readiness warnings
- Submission success confirmation (terminal state)
- Diff viewer (v1 ↔ v2)
- Resubmit flow
- **WS-9 parallel:** Contributor portal visual pass starts (token coverage on dashboard, tasks, earnings, profile)

#### Week 10 — Two-stage Review + Acceptance + Payout Eligibility
- Mentor decision triggers acceptance → payout eligible
- Two-stage routing: mentor → enterprise reviewer queue (doc 02 §5.F)
- Enterprise reviewer detail + decision
- Credential issuance on acceptance
- Public credential share page
- **WS-9 parallel:** Enterprise portal visual pass starts (SOW workspace, decomposition, billing, audit)

#### Week 11 — Rate Cards + Payouts + Razorpay + ERP
- Rate card creation UI (per doc 02 §5.G.5)
- Pricing engine: rate × effort → task payout
- Payouts ledger + manual batch release
- Razorpay India integration end-to-end
- Billing/payout export CSV/PDF
- Contributor payout method setup + first withdrawal
- ERP file drop (SFTP) weekly export
- Earnings + credentials surfaces wired live
- **WS-9 parallel:** Mentor portal visual pass (review cockpit, queue, mentorship, escalation)

#### Week 12 — Mentorship + Governance + Audit Unified + Compliance Baseline
- Mentorship sessions list + detail + coaching notes (women WF + student)
- Governance queue (Platform Admin) + case detail + decision flow
- KYC review queue + manual review flow
- Audit unified view (Enterprise) + export
- Compliance baseline (consent inventory + retention)
- Escalation queue (mentor.senior)
- Service health page
- **WS-9 parallel:** Platform admin visual pass + cross-portal consistency sweep + WCAG checks

**1C exit gate (end of Week 12):**
- Complete loop: SOW upload → contributor submit → mentor accept → enterprise reviewer accept → payout via Razorpay → credential issued → ERP export delivered
- Mentorship session held with coaching note written
- Safety report processed via governance triage
- Cross-tenant audit visible to compliance role

---

### Phase 1D — Hardening (Week 13)

#### Week 13 — Audit + Pen Test + Pilot + Go-Live

| Day | Activity |
|---|---|
| 81–82 | WCAG 2.1 AA audit (automated + manual + external) |
| 81–84 | External penetration test |
| 83–86 | Pilot #1 execution: real customer SOW end-to-end |
| 84–87 | Pilot #2 execution |
| 85–87 | Performance / load testing |
| 87–88 | P0/P1 bug fixes from pilots |
| 88 | Security sign-off |
| 89 | UAT sign-off |
| 90 | Go-live |

**1D exit gate (Day 90):**
- WCAG audit passed (no critical findings; high findings remediated)
- Pen test passed (high+ findings remediated)
- Two pilot SOWs run to acceptance with exported financial reports
- Security sign-off
- UAT sign-off
- Hypercare team standing by

---

## 6. Dependency map

```
                    ┌─────────────────┐
                    │ WS-1 Foundations │
                    │  (DB, Audit, AI, │
                    │  Notif, Scan)    │
                    └────────┬─────────┘
                             │ blocks everything
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ WS-2     │   │ WS-8     │   │ WS-3     │
        │ Identity │──>│ Observ.  │   │ Workflow │
        │ + RBAC   │   │ (light)  │   │ (SOW etc)│
        └────┬─────┘   └──────────┘   └────┬─────┘
             │                              │ provides tasks for matching
             │                              ▼
             │                         ┌──────────┐
             │                         │ WS-6     │
             │                         │ Matching │
             │                         └────┬─────┘
             │                              │ feeds contributor + mentor
             ▼                              ▼
        ┌──────────┐                  ┌──────────┐
        │ WS-4     │                  │ WS-5     │
        │ Contrib. │<──────reviews───>│ Mentor   │
        └────┬─────┘                  └────┬─────┘
             │ submit                       │ accept
             ▼                              ▼
                  ┌──────────────┐
                  │ WS-7         │
                  │ Commercial   │  (rate cards, payouts, ERP)
                  │ Baseline     │
                  └────────┬─────┘
                           │
                           ▼
                  ┌──────────────┐
                  │ WS-8 (heavy) │
                  │ Pilot + Hard.│
                  └──────────────┘
```

### 6.1 Hard blockers (cannot start without)

| If you want to ship... | You must first ship... |
|---|---|
| Any portal at production-grade | WS-1 foundations + WS-2 identity |
| Decomposition | SOW intake + AI orchestrator |
| Matching | Skill taxonomy + decomposition output |
| Contributor onboarding (live) | Identity + Notifications + KYC manual review surface |
| Mentor queue | Matching v1 + competency editor (doc 04 §5.D.4) |
| Submission with evidence | File scan service |
| Acceptance → payout | Rate cards + payment rail + audit |
| Two-stage review | Mentor decision flow + enterprise reviewer surface |
| Credential issuance | Acceptance flow + public credential page |
| Pilot execution | Everything above + observability + hypercare runbook |

### 6.2 Parallelizable work

| Workstream A | Workstream B | Why parallel-safe |
|---|---|---|
| WS-3 (SOW workflow) | WS-4 (Contributor onboarding) | Different portals; tasks-from-decomposition is the join |
| WS-4 (Contributor) | WS-5 (Mentor) | Different portals; submission-handoff is the join |
| WS-6 (Matching) | WS-3 (SOW workflow) | Matching needs decomposition output but can be built against fixtures |
| WS-7 (Commercial) | WS-3, WS-4, WS-5 | Rate cards + pricing don't need workflow features to design |
| WS-8 (Observability) | All others | Cross-cutting; ride along throughout |

---

## 7. Per-portal punch lists

### 7.1 Contributor portal — 29 items

(See doc 01 §2.1 for the canonical list. Numbered there 1–29.)

Sealed for Phase 1 (must hide/remove):
- `/contributor/community/*` — Phase 2
- `/contributor/messages/*` — Phase 2
- `/contributor/learning/*` — Phase 2
- `/contributor/progress` — Phase 2 (over-scoped)

### 7.2 Enterprise portal — 38 items

(See doc 02 §2.1.)

Sealed for Phase 1:
- `/enterprise/delivery-tracking` — collapsed into Projects · Exceptions
- `/enterprise/teams` — Phase 2
- `/enterprise/compliance/esg`, `/podl`, `/documents/*` deep — Phase 2
- `/enterprise/analytics/reports`, `/governance` — Phase 2 (basic analytics ships)

### 7.3 Mentor portal — 30 items

(See doc 03 §2.1.)

Sealed for Phase 1:
- `/mentor/analytics/*`
- `/mentor/calibration`
- `/mentor/pool-health`
- `/mentor/bottleneck`
- `/mentor/sla-monitor`
- `/mentor/reviews` deep analytics
- `/mentor/contributors` deep analytics

### 7.4 Platform admin portal — 18 items

(See doc 04 §2.1.)

Sealed for Phase 1:
- `/admin/fraud/*`
- `/admin/analytics/*`
- `/admin/regions/*`
- `/admin/ai/governance/*` (bias, risk tiers)
- `/admin/compliance/evidence/*`
- `/admin/credentials/admin/*` (crypto keys)

### 7.5 Cross-functional — 19 items

(See doc 05 §14.1.)

---

## 8. Decisions required before Phase 1 starts

These decisions are open across docs 01–05's §11 / §16 sections. They must be **signed off by Sponsor + EM** before Phase 1 begins, because the answers shape architecture.

| # | Decision | Default proposed | Owner |
|---|---|---|---|
| 1 | Postgres RLS vs application-layer tenant filter | RLS at DB level (doc 05 §3.5) | Security + EM |
| 2 | Session length policy | 30 days (existing); tenants can override down to 8h | Security |
| 3 | MFA enforcement: Glimmora staff mandatory, tenant-optional for enterprise, recommended for contributors | As proposed (doc 05 §2.4) | Security |
| 4 | SOW approval — 5 stages canonical | Yes (doc 02 §5.C.9) | Sponsor |
| 5 | Two-stage review default | Off by default; PMO toggles per project at decomposition | Sponsor + EM |
| 6 | Round cap (mentor rework rounds) | 3 by default; configurable per work-type policy | Sponsor |
| 7 | Anonymous safety report — identity redaction | Yes; only compliance+legal can recover (doc 04 §5.H.2) | Legal |
| 8 | KYC SLA | 8 business hours (doc 04 §5.I.1) | T&S Lead |
| 9 | Compliance Phase 1 floor | Consent inventory + retention + deletion requests (doc 02 §5.I) | Compliance |
| 10 | Analytics Phase 1 floor | Workforce IQ basic + Economic basic, no deep reports (doc 02 §5.J) | Sponsor |
| 11 | Architecture Phase 1 | Monolithic Next.js + Postgres with selected sidecars (audit, AI orch, notifications); microservices = Phase 2 | EM Platform |
| 12 | Payment rail Phase 1 | Razorpay India + Wise (global basic); Phase 2 = more rails | Finance + EM |
| 13 | Localization Phase 1 | Framework only; English content shipped | Product |
| 14 | Persona-conditional dashboard (contributor) | Same shell + role modules (doc 01 §1.2.1) | Product (✅ DECIDED) |
| 15 | Workroom menu page | Removed (doc 01 §10 #1) | Product (✅ DECIDED) |
| 16 | Mentor self-metrics | Own numbers only; no peer comparison; no leaderboard (doc 03 §11 #6) | Product |
| 17 | Plagiarism scan behavior | Warn + flag, not block; tenant-overridable | Product + Security |
| 18 | Idempotency window | 24h | EM Platform |
| 19 | Audit retention floor | 7 years; tenant configurable to longer | Compliance + Legal |
| 20 | External pen test provider | TBD before Phase 1 starts | Security |

**Gate:** until #1–#20 are signed off, Phase 1 doesn't start. PM owns chasing these to closure.

---

## 9. Security gates (hard blockers)

These cannot be deferred. Failing any one blocks Phase 1 go-live.

| Gate | Verification |
|---|---|
| **G-1** All four portals enforce server-side RBAC | RLS test + pen test confirms no cross-tenant read |
| **G-2** SSO works for ≥1 SAML and ≥1 OIDC tenant | E2E test from real IdP |
| **G-3** MFA works for TOTP, SMS, email + backup codes | Manual QA pass |
| **G-4** Audit log captures every action in doc 05 §4.4 | QA matrix walk-through |
| **G-5** Audit signatures verify; tampering detected | Synthetic tamper test |
| **G-6** Secrets are in cloud secret manager, not env files | Code scan |
| **G-7** TLS 1.3 enforced; HSTS; no HTTP | TLS audit |
| **G-8** File uploads scanned for viruses; EICAR test catches | Synthetic test |
| **G-9** Dependency scan: no high+ unpatched | Snapshot before go-live |
| **G-10** External pen test report: no high+ unaddressed findings | Vendor report |
| **G-11** Vulnerability disclosure channel live | `security.txt` published |
| **G-12** Personal data redacted from logs | Code review + synthetic test |
| **G-13** Tenant data RLS-isolated | Pen test confirms |
| **G-14** Session revocation effective within 60s | Test |

---

## 10. Integrated exit criteria (Phase 1 acceptance)

A single consolidated list. Phase 1 is COMPLETE when **all of these are true**.

### 10.0 Progress checkpoint — 2026-05-26

**Foundation layer: COMPLETE.** ✅

The foundation deliverables below aren't numbered exit criteria in
§10.1–§10.4 — but every numbered criterion depends on them. With
foundation done, the remaining work is feature wiring against a
stable platform.

#### Foundation deliverables (all live in `glimmora_dev` Postgres)

| Layer | Status |
|---|---|
| Prisma schema — 17 tables across 6 migrations | ✅ M1–M6 applied + verified |
| Postgres RLS on tenant-scoped tables | ✅ 4 policies enforce isolation under non-superuser role; smoke-verified |
| Append-only audit table | ✅ M4 triggers reject `UPDATE`/`DELETE`/`TRUNCATE` at DB engine |
| HMAC-signed audit events | ✅ Service + canonical JSON + key-rotation hook |
| RBAC — 20 roles, 28 baseline permissions, 286 mappings | ✅ Seeded in M2 |
| Durable Session table + revocation flows | ✅ M3 + auth.ts wired (Session created on login, revoked on signout) |
| Edge middleware (auth + portal scope + headers) | ✅ |
| Tenant resolver + accessibility classifier + RLS helper | ✅ |
| Session validator + 3 revocation flavors | ✅ All emit audit events |
| AI orchestrator | ✅ 4 agents seeded, mock LLM, audit-emitting, idempotency-keyed |
| `requireRequest` / `requireTenantRequest` handler template | ✅ `withTx` binds `app.tenant_id` for RLS |
| API endpoints exercising the full chain | ✅ 5 routes: `/api/me`, `/api/sessions` (GET+DELETE), `/api/enterprise/acceptance/[taskId]` (refactored), `/api/ai/invoke` |
| UI features exercising the full chain | ✅ 3 features: SessionsCard, DecisionHistoryPanel, real Workroom AI signals |
| Non-superuser DB role for prod-grade RLS testing | ✅ `glimmora_app NOBYPASSRLS` created |

**The five Phase 1 critical blockers from doc 08 §2 — all closed:**

| Blocker | Status |
|---|---|
| B-1 `src/middleware.ts` missing | ✅ |
| B-2 Prisma schema scope (5/25+ tables) | ✅ 17 tables, 6 migrations |
| B-3 No Postgres RLS | ✅ Verified blocking cross-tenant access |
| B-4 Audit service missing | ✅ Live; 4 features writing events |
| B-5 AI orchestrator missing | ✅ Live smoke test; mock + real-LLM-ready |

#### §10.1–§10.4 criteria status by category

| Category | Total | ✅ Done | 🟡 Partial | ⏳ Pending |
|---|---|---|---|---|
| §10.1 Functional | 20 | 0 | 7 | 13 |
| §10.2 Non-functional | 8 | 0 | 1 | 7 |
| §10.3 Pilot | 4 | 0 | 0 | 4 |
| §10.4 Documentation + training | 4 | 0 | 0 | 4 |
| **Total** | **36** | **0** | **8** | **28** |

Most criteria require feature work that wasn't possible until the
foundation existed. With M1–M6 + the helper layer in place, the
~50 existing API routes can now be converted to the new template,
new UI surfaces can be wired through, and product features unblock
progressively. See inline annotations below for per-item status.

#### Honest reading

- Calendar: ~Week 1 of 13 (one week in; foundation done).
- Foundation effort outsized vs commodity feature work — the next weeks should compound faster.
- Doc 08 (codebase delta) listed ~120 new files / ~106 deletes / ~250 affected. Foundations cover the new files at the bottom of the stack; most of the deletes + refactors are still pending. The pattern (request-context + audit + RLS) is locked in; replication is volume not architecture.

#### Recommended next priorities (in this order)

1. **Notification service** (criterion #22) — ✅ DONE (M6)
2. **SOW backend + UI conversion** (criteria #3, #4) — ✅ DONE (M8/M9a/M9b/M9c)
3. **Migrations M10–M11** — skill taxonomy, mentor pool, rubric templates, decomposition tables
4. **Decomposition UI conversion** (criterion #5) — Decomposition Assistant is built, route needs wiring
5. **Enterprise SSO (SAML + OIDC)** (criterion #1) — gates tenant onboarding
6. **Contributor onboarding wiring** (criterion #7) — V2 onboarding flow exists; needs Session/Tenant/audit integration

#### UI redesign decision (locked 2026-05-26)

Reviewed mid-build: live screens are a mix of new Meridian v2 surfaces
(SOW v2, SessionsCard, NotificationBell, etc.) and legacy V3 mock pages.
Decision: **continue backend buildout; schedule UI polish sprint for
weeks 9–12 in parallel with feature wiring.** Captured as WS-9 (§4.9).
Rationale: redesigning UI before data contracts settle creates rework;
backend criteria 1–20 gate pilot acceptance more directly than polish.

---

### 10.1 Functional

1. ⏳ A new enterprise tenant is provisioned by Glimmora staff; tenant admin signs in via SSO _(Tenant schema ✅; provisioning UI + SAML/OIDC pending)_
2. ⏳ Tenant admin configures rate cards, SSO, HRIS sync, integrations _(none built yet)_
3. 🟡 Sponsor uploads a SOW; AI extracts metadata; sponsor validates and submits for approval _(SOW Intake Assistant ✅; UI conversion pending)_
4. ⏳ 5-stage approval pipeline runs to completion; each stage audited _(UI exists, backend transitions + audit emit pending)_
5. 🟡 PMO opens decomposition workspace; AI suggests tasks; PMO refines; sponsor approves; project provisions _(Decomposition Assistant ✅; UI conversion + persistence pending)_
6. ⏳ Matching v1 ranks ≥5 candidates per task with ≥1 "why matched" reason each _(no matching engine yet)_
7. ⏳ Contributor (internal, student, women WF, freelance) onboards, declares skills, gives consent, lands on dashboard _(V2 onboarding UI exists; needs Session/Tenant/audit integration)_
8. 🟡 Contributor accepts a task; workroom opens with brief + criteria + evidence drop zone + Q&A _(workroom UI exists w/ AI signals; Q&A thread + tenant-scoped persistence pending)_
9. ⏳ Contributor uploads evidence; virus + plagiarism scan completes _(file scan service not built)_
10. ⏳ Contributor submits; reaches "Under review" confirmation; mentor queue updates _(submission terminal state not built; mentor queue not wired to Postgres)_
11. 🟡 Mentor reviews with AI assistive rubric; makes decision; AI override delta captured _(Review Assistant agent ✅; mentor UI not yet calling /api/ai/invoke)_
12. 🟡 On accept (two-stage), enterprise reviewer sees in queue; makes final decision _(`/api/enterprise/acceptance/[taskId]` refactored ✅; DecisionHistoryPanel ✅; two-stage routing config pending)_
13. ⏳ On final acceptance: payout becomes eligible; credential issued; contributor sees both _(no payout pipeline; no credential issuance)_
14. ⏳ Contributor sets up payout method; withdraws via Razorpay India; receives funds _(Razorpay webhook exists; payout flow not wired)_
15. ⏳ Finance exports billing + payouts CSV; pushes to ERP via SFTP _(not built)_
16. ⏳ Mentor holds a mentorship session with a women-WF contributor; writes a coaching note visible in the contributor's profile _(UI mocks exist; persistence not wired)_
17. ⏳ Contributor submits a safety report; T&S triages via governance queue; action taken with audit _(not built)_
18. ⏳ KYC-flagged contributor reviewed manually; decision recorded with audit _(not built)_
19. 🟡 AI agent prompt rolled back; subsequent invocations use prior version; audited _(schema + service ✅; admin rollback UI not built — direct DB update works)_
20. ⏳ Payment rail degraded; payouts on that rail held; admin drains to fallback rail _(not built)_

### 10.2 Non-functional (cross-functional)

21. 🟡 All actions write audit events; signatures verify; export works in CSV/JSON/NDJSON _(write + sign + verify ✅ — 4 features emitting; CSV/JSON/NDJSON export endpoint pending)_
22. ⏳ Notification dispatch hits ≥99% in-app within 60s; ≥95% email within 5 min _(no notification service yet; existing email transport unscoped)_
23. ⏳ Service health page shows all 12 critical services healthy _(not built)_
24. ⏳ Pen test report: no high+ unaddressed findings _(pen test not yet run)_
25. ⏳ WCAG 2.1 AA audit: core journeys pass with no critical findings _(no a11y CI tooling yet)_
26. ⏳ Performance: p95 < 500ms for non-AI endpoints; p95 < 3s for AI endpoints _(not measured; AI handlers run <200ms locally for now)_
27. ⏳ Logs structured; tenant-redacted as required; aggregated dashboard available _(no structured logger; no aggregation)_
28. ⏳ CI/CD: green builds; deployments automated; rollback path tested _(not set up for this branch)_

### 10.3 Pilot

29. ⏳ Pilot SOW #1 executed end-to-end with accepted outcomes; financial report exported _(no pilot run yet)_
30. ⏳ Pilot SOW #2 executed similarly
31. ⏳ Pilot customers sign off acceptance pack
32. ⏳ Hypercare team standing by for 30 days post go-live

### 10.4 Documentation + training

33. ⏳ OpenAPI 3.1 spec published _(not generated)_
34. ⏳ Admin / Sponsor / PMO / Mentor / Contributor user guides written _(portal specs in `docs/portal-specs/` are the design baseline; user-facing guides not yet authored)_
35. ⏳ Training videos (or live training) delivered to pilot customers
36. ⏳ Runbook for on-call published

---

## 11. Risk register

Top 10 risks ranked by likelihood × impact. Mitigations are committed actions, not aspirations.

| ID | Risk | Status (2026-05-26) | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R-1 | Server-side RBAC middleware ships late, blocks portal deploys | ✅ **Mitigated** — middleware live | Medium | High | Front-loaded to Week 2 (1A); blocker for everything else | EM Security |
| R-2 | SSO IdP integration with first enterprise tenant fails E2E | ⏳ Active | Medium | High | Begin sandbox testing in Week 3; SAML response edge cases catalogued; vendor escalation path identified | EM Security |
| R-3 | AI orchestrator latency unacceptable (>5s p95) | 🟡 Reduced — mock handlers <200ms; real LLM unknown | Medium | Medium | Latency budget in Week 4; fallback to cached suggestions; rate limit; graceful degrade contract (doc 05 §5.5) | EM Platform |
| R-4 | Razorpay integration certification delayed | ⏳ Active | Low | High | Engage Razorpay in Week 1; submit certification docs by Week 4; Wise as fallback rail | EM Finance |
| R-5 | File scan provider for plagiarism not selected | ⏳ Active | Medium | Medium | Provider selected by Week 1; integration spec by Week 4; fallback = virus-only Phase 1 if needed | EM Platform |
| R-6 | HRIS sync of real customer data reveals undocumented fields | ⏳ Active | High | Medium | Customer-specific mapping in Week 7; "generic + CSV" mode covers gaps; tenant can manually configure | EM Platform |
| R-7 | Audit signing key management complexity delays go-live | 🟡 Reduced — service + env-based key live; KMS migration still pending | Low | High | Use cloud KMS from Week 1; rotation policy documented; two-person key access | Security |
| R-8 | Pen test surfaces high-severity findings late | ⏳ Active | High | High | Engage pen tester by Week 1 to schedule for Week 13 start; pre-pen-test internal audit in Week 11 | Security |
| R-9 | Pilot customer not ready by Week 12 | ⏳ Active | Medium | High | Customer commitment locked in pre-Phase-1 kickoff; backup customer identified | PM |
| R-10 | Scope creep — "just one more feature" requests | ⏳ Active | High | Medium | This document locked at sign-off; change orders required for any additions; weekly scope check-in | PM + Sponsor |

**New risks surfaced during execution:**

| ID | Risk | Status | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R-11 | Pre-existing Prisma migration history is broken (duplicate User migration with mismatched shape) — production-grade migration deploy can't apply the current history | ⏳ Active | High | Medium | Workaround: dev uses `prisma db push` + manual seed/trigger SQL. Pre-prod task: delete duplicate `20260325143008_add_user`, rewrite `20260324075737_add_user_table` to match actual schema, validate fresh `migrate deploy` works | EM Platform |
| R-12 | Local dev uses Postgres superuser which bypasses RLS — false sense of security from local testing | 🟡 Reduced — `glimmora_app NOBYPASSRLS` role created + smoke tests run as non-superuser | Medium | High | App connects via non-superuser role in staging + prod from Week 4 onward | EM Security |
| R-13 | `.env.local` isn't loaded by Prisma CLI — Prisma config uses `dotenv/config` which loads `.env` only | 🟡 Reduced — passing `DATABASE_URL` inline for now | Low | Low | Update `prisma.config.ts` to also load `.env.local` in Week 2 | EM Platform |

---

## 12. Out of scope (reaffirmed)

These are explicitly OUT of Phase 1. Building any of these triggers a change-order conversation, not a code change.

### 12.1 Per SOW §3.2 (excluded by contract)

- Autonomous Project Governor (full)
- Dynamic / surge / predictive pricing
- Cryptographic credentialing + verifiable credentials
- Advanced fraud + anti-collusion + behavioral anomaly models
- Multi-region active-active deployment
- Deep ERP automation (multi-entity invoicing, complex procurement, full GL posting)
- BPO / managed services
- Custom HRIS/ERP feature development
- On-premise deployment
- Non-workforce AI use cases

### 12.2 Reorganized-architecture over-scope (cut from Phase 1)

- Contributor: Community section (Messages, Discussions, contributor-side Mentorship)
- Contributor: Learning recommendations (full)
- Contributor: Progress page (skill ladder dedicated)
- Contributor: Tax documents
- Contributor: AI agent contributor onboarding
- Contributor: Multi-tab workroom switcher
- Enterprise: Delivery Tracking (collapsed into Projects)
- Enterprise: Teams page
- Enterprise: Full Compliance console (ESG, PODL, evidence locker)
- Enterprise: Full Analytics deep reports
- Mentor: Bottleneck Spotlight, Pool Health, Capacity Rebalancing
- Mentor: AI Partnership calibration KPIs (trending)
- Mentor: My Pace gauge
- Mentor: SLA forecast
- Mentor: Cross-reviewer calibration dashboard
- Mentor: Contributor anomaly continuous badge (keep one-time pairing caution only)
- Platform Admin: Fraud detection dashboard
- Platform Admin: Cross-tenant analytics
- Platform Admin: Multi-region console
- Platform Admin: Bias monitoring + AI risk classification
- Platform Admin: Cryptographic credential admin
- Platform Admin: Compliance evidence locker

### 12.3 Capability sealed for Phase 1 — to be unblocked Phase 2

The 14 sealed surfaces listed in §7.1–§7.5.

---

## 13. Phase 1 success metric

A single number to track Phase 1 outcome.

**Definition of Done:** Two pilot SOWs executed end-to-end with:
- All audit events written
- Financial reports exported and accepted by customer finance
- Zero high-severity security findings open
- Customer signs the acceptance pack

**Stretch:** One pilot customer commits to expansion / Phase 2 within 30 days of Phase 1 close.

---

## 14. Sign-off

By signing this document, the following parties commit:

| Role | Commits to | Signature |
|---|---|---|
| Sponsor (Glimmora CEO) | Phase 1 scope is locked; change orders required for additions | _________ |
| Product Lead | Open decisions in §8 are answered before kickoff | _________ |
| EM Platform | WS-1 + WS-6 + WS-8 deliverables; security gates §9 | _________ |
| EM Enterprise | WS-3 + WS-7 deliverables | _________ |
| EM Contributor | WS-4 deliverables | _________ |
| EM Mentor | WS-5 deliverables | _________ |
| Security | Security gates §9 verified before go-live | _________ |
| Compliance | Compliance + audit readiness §10.2 | _________ |
| Pilot Customer #1 | Engagement scheduled for Weeks 9–13 | _________ |
| Pilot Customer #2 | Engagement scheduled for Weeks 9–13 | _________ |

**Sign-off date target:** within 1 week of this draft being finalized; before Week 1 kickoff.

---

## 15. Post-Phase-1 trajectory (Phase 2 preview, non-binding)

Phase 2 (3–6 months) addresses what we deliberately deferred. **This section is non-binding** — Phase 2 scope will be set in a separate planning cycle informed by pilot learnings.

Likely Phase 2 themes (per SOW §22.2):

- Autonomous Project Governor expansion
- Proof-of-Delivery ledger + cryptographic credentials
- Advanced fraud + trust scoring
- Dynamic pricing engine
- ERP / procurement automation
- Advanced AI governance (bias monitoring, risk tiers, model lifecycle)
- Compliance evidence locker (ESG, PODL)
- Cross-tenant analytics
- Multi-region deployment
- Native mobile (iOS, Android)

Phase 3 (6–12 months, per §22.3): global scale, multi-tenant hardening, expanded student/women workforce programs.

---

## 16. Reference index

Every Phase 1 commitment can be traced to its source:

| Source doc | Owner | Phase 1 capability list |
|---|---|---|
| `01-contributor-portal.md` | Product · EM Contributor | §2.1 (29 items) |
| `02-enterprise-portal.md` | Product · EM Enterprise | §2.1 (38 items) |
| `03-mentor-portal.md` | Product · EM Mentor | §2.1 (30 items) |
| `04-platform-admin-portal.md` | Product · EM Platform | §2.1 (18 items) |
| `05-cross-functional.md` | EM Platform · Security | §14.1 (19 items) |

If something isn't in those tables, it isn't Phase 1.

---

## End of Phase 1 Scope Lockdown

> This document is the contract. Once signed, all execution flows from here. The five upstream specs (01–05) define *what* each surface looks like; this document defines *when* and *how we know we're done*.

> Any deviation requires a written change order signed by Sponsor + Product Lead + EM Platform.
