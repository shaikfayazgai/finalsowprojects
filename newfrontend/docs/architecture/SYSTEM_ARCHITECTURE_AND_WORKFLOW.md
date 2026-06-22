# GlimmoraTeam — System Architecture & Workflow Mapping

> A systems-thinking companion to the Product Understanding doc. Where that document explains *what the product is*, this one explains *how it behaves as a running system* — who acts on what, in what order, with what permissions, under what governance, with what failure modes. Written for a product designer who must reason about flows end-to-end, defend state-machine choices, and design under enterprise constraints.

---

## 1. Product Ecosystem Map

GlimmoraTeam is not one app — it is a *coordination layer* between people, AI agents, enterprise systems, payment rails, and compliance authorities. To design any single screen well, the designer needs the whole ecosystem in their head.

### 1.1 Actors

**Human actors**
- **Enterprise Admin** — buyer; owns SOW intake, decomposition, project monitoring, acceptance, payment release.
- **Contributor** — worker; three segments (Student, Women Workforce, General); owns task execution, submission, learning, profile.
- **Mentor** — quality coach; owns mentorship sessions, escalations, contributor growth.
- **Reviewer** — quality gatekeeper; owns review queue, rubric scoring, decisions.
- **Platform Admin / SuperAdmin** — Glimmora's internal operator; owns commercial sign-off, pricing config, email templates, audit oversight, roles.
- **Public Verifier** — unauthenticated third party verifying a shared credential.
- **Legal Officer** — gates the Legal stage in SOW approval.
- **Security Officer** — gates the Security stage in SOW approval.
- **Finance / Procurement** (downstream) — consumes invoices, reconciles to ERP.

**AI actors (8 agents; 4 in MVP)**
- SOW Intake Assistant — parses uploads, generates parameter-driven SOWs.
- Decomposition Assistant — suggests task graphs.
- Contributor Support Assistant — in-workroom Q&A.
- Review Assistant — rubric suggestions and feedback summarization.
- *(Phase 2)* Workforce Optimization Agent, Governance & Risk Agent, Learning Agent, Payment Agent, Proof-of-Delivery Agent.

**Algorithmic actors (non-LLM intelligence)**
- Matching Engine — ranks contributors against tasks.
- Reputation Engine — recomputes reliability/quality/collaboration/learning scores after every accepted task.
- Risk Scoring Engine — 0–100 score per SOW.
- Pricing Engine — rate-card-driven (MVP); dynamic (Phase 2).
- Guardrails Engine — 8-layer hallucination prevention.

### 1.2 Systems

**Internal core services**
- SOW Service (intake, parsing, versioning)
- Guardrails Service (Python/FastAPI; vector DB)
- Template Service (clause library, parameter wizard config)
- NLP Service (OCR + extraction)
- Decomposition Service
- Project Lifecycle Service
- Task Management Service
- Matching Service
- Assignment Service
- Workroom Service
- Submission Service
- Review Service
- Acceptance Service
- Pricing / Rate Card Service
- Payout Eligibility Ledger
- Contributor Profile Service
- Skill Genome Service
- IAM / RBAC Service
- Audit Log Service
- Notification Service
- Reporting / Export Service

**Data substrates**
- Relational store (PostgreSQL) — transactional state.
- Graph DB (Neo4j / JanusGraph) — talent intelligence graph.
- Vector DB (Pinecone / Weaviate / Qdrant) — semantic search over SOW templates and clause library.
- Event bus (Kafka) — state-change events.
- Cache / queue (Redis / BullMQ).

**External systems**
- Identity providers — Google OAuth, Microsoft Entra ID, custom Glimmora OAuth, SAML/OIDC enterprise IdPs.
- Payment rails — Razorpay (MVP); future PSPs + payroll partners.
- HRIS — for internal contributor sync.
- ERP / GL — for invoice posting (Phase 2 depth).
- LMS — for course completion events.
- Email — Nodemailer + React Email templates.
- Storage — for document uploads (SOWs, evidence, deliverables).

**Compliance / regulatory authorities (passive but real)**
- Tax jurisdictions (per-region payout compliance)
- Sanctioned-jurisdiction lists
- Data residency regulators (GDPR, India DPDP, etc.)
- ESG reporting frameworks

### 1.3 Relationships and value flow

Six value flows run continuously through the ecosystem. Each flow is a separate design concern.

| Flow | From | To | Currency |
|---|---|---|---|
| **Work intent** | Enterprise | Contributor (via SOW → tasks → assignments) | Specifications and acceptance criteria |
| **Delivered work** | Contributor | Enterprise (via submissions → reviews → acceptance) | Artifacts, evidence, proof |
| **Money** | Enterprise → Platform → Contributor | Razorpay → Wallet → Bank | INR (MVP); multi-currency later |
| **Reputation** | Acceptance events | Contributor digital twin | Reliability, quality, collaboration scores |
| **Credentials** | Acceptance events | Public verifier (via share link) | Verifiable proof of skill |
| **Audit & compliance** | Every action | Audit log → exports → regulators | Immutable event records |

**Design implication.** Every screen sits inside at least one of these flows. A designer who asks "which flow does this screen serve?" before drawing a frame will produce better work than one who treats screens as standalone.

### 1.4 Ecosystem diagram (text)

```
                                ┌──────────────────────┐
                                │   PUBLIC VERIFIER    │
                                │ (credential check)   │
                                └──────────▲───────────┘
                                           │ share link
                ┌──────────────┐    ┌──────┴──────┐
                │   MENTOR     │    │  CONTRIBUTOR │
                │  REVIEWER    │◄──►│   (Student/  │
                └──────┬───────┘    │   Women/Gen) │
                       │            └──────┬───────┘
                       │ reviews            │ submits
                       ▼                    ▼
        ┌─────────────────────────────────────────────┐
        │            GLIMMORATEAM PLATFORM            │
        │                                             │
        │  ┌─────────┐  ┌────────────┐  ┌──────────┐ │
        │  │  SOW    │─►│Decompose   │─►│Workroom  │ │
        │  │Lifecycle│  │  + Match   │  │+ Review  │ │
        │  └────▲────┘  └────────────┘  └────┬─────┘ │
        │       │                            │       │
        │  ┌────┴──────┐  ┌──────────────┐  │       │
        │  │ AI Agents │  │ Talent Graph │◄─┘       │
        │  │ (8 agents)│  │ + Digital    │          │
        │  └───────────┘  │   Twins      │          │
        │                 └──────────────┘          │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
        │  │ Audit /  │  │ Pricing/ │  │Guardrails│ │
        │  │Compliance│  │ Payouts  │  │ + Risk   │ │
        │  └──────────┘  └─────┬────┘  └──────────┘ │
        │                      │                     │
        └──────────────────────┼─────────────────────┘
              ▲                │              ▲
              │ SOW            │ payout       │ admin
              │                ▼              │
    ┌─────────┴──────┐  ┌──────────┐  ┌──────┴────────┐
    │   ENTERPRISE   │  │ Razorpay │  │ PLATFORM ADMIN│
    │   ADMIN (PMO)  │  │ PSP/Bank │  │  (Glimmora)   │
    └────────────────┘  └──────────┘  └───────────────┘
              │
              ▼
    ┌────────────────┐
    │ HRIS / ERP /   │
    │ LMS / SSO IdP  │
    └────────────────┘
```

---

## 2. Role & Permission Matrix

Role design in GlimmoraTeam is non-negotiable — it is the substrate of trust. Five primary roles, each with distinct access, workflows, and visibility. The matrix below is the source of truth a designer should reference when designing any new screen.

### 2.1 Enterprise Admin

| Dimension | Specification |
|---|---|
| **Access level** | Full read/write within their tenant; zero visibility into other tenants. |
| **Permissions** | Create SOW; approve Business stage; create + approve decomposition plan; form teams; release milestone payments; close projects; configure rate cards (within enterprise scope); manage internal team members. |
| **Workflows owned** | SOW intake → Business stage approval → Decomposition → Team formation → Project monitoring → Deliverable acceptance → Payment release → Project closure. |
| **Approval powers** | Business stage on SOW (their own). Plan approval after decomposition. Final acceptance on each deliverable. Milestone release-of-funds. Exception resolution. |
| **Visibility scope** | Their own SOWs, projects, contributors assigned to their projects, their team members. Cannot see other enterprises' data. Limited contributor PII (operates against pseudonymous IDs where possible). |

### 2.2 Contributor

| Dimension | Specification |
|---|---|
| **Access level** | Personal workspace only — own profile, own assignments, own submissions, own earnings, own credentials. |
| **Permissions** | Update profile + skills + evidence; accept/decline assignments; submit work; resubmit; share credentials; open support tickets, grievances, safety reports. |
| **Workflows owned** | Registration → onboarding → task discovery → acceptance → execution → submission → resubmission → earning + credential. |
| **Approval powers** | None — accepts or declines work; cannot approve anything system-wide. |
| **Visibility scope** | Own tasks, own submissions, own digital twin, own credentials, own earnings, public community. Cannot see other contributors' private profiles. |

### 2.3 Mentor

| Dimension | Specification |
|---|---|
| **Access level** | Assigned queue + assigned contributors' relevant context (current task, submission, prior reviews). |
| **Permissions** | Open review items; submit rubric scores; leave feedback; conduct mentorship sessions; log session notes; raise escalations; resolve escalations within authority. |
| **Workflows owned** | Review queue → decision (Accept / Rework / Reject); mentorship session → notes; escalation → resolve or hand off. |
| **Approval powers** | First-pass review approval on submissions. Approval of mentor-side rework completion. |
| **Visibility scope** | Submissions in their queue. Contributors they're actively mentoring. Cannot see all contributors or all projects. |

### 2.4 Reviewer

> *Today there are two overlapping reviewer surfaces — `/mentor/*` and `/enterprise/reviewer/*`. The role permissions converge; the surfaces should too. Below describes the unified role.*

| Dimension | Specification |
|---|---|
| **Access level** | Review queue scoped to skills and assignments. Can be enterprise-aligned (reviewer assigned to one enterprise) or platform-aligned (Glimmora reviewer pool). |
| **Permissions** | Read submission + evidence; run rubric; Accept / Request Rework / Reject; leave reviewer-only internal notes; flag for escalation; download evidence; reply in QA inbox. |
| **Workflows owned** | Review queue → submission → rubric → decision → notification fan-out. QA inbox response. Task monitor visibility. |
| **Approval powers** | Submission-level Accept / Rework / Reject. (Enterprise admin still does final acceptance on deliverables.) |
| **Visibility scope** | Their queue. Tasks they're assigned. Their own performance metrics. Cannot see project portfolio or financials. |

### 2.5 Platform Admin / SuperAdmin

| Dimension | Specification |
|---|---|
| **Access level** | Cross-tenant; full platform visibility for governance purposes. Strict PII handling. |
| **Permissions** | Approve Glimmora Commercial stage on every SOW; configure platform-wide rate cards and segment pricing; manage email templates; manage roles & permissions; view audit logs; manage Organizations; manage system settings. |
| **Workflows owned** | Glimmora Commercial approval. Platform configuration. Audit oversight. Organization onboarding. |
| **Approval powers** | Glimmora Commercial stage of SOW pipeline. Email template publication. Role definitions. Pricing config publication. |
| **Visibility scope** | All tenants, all SOWs, all audit events. Pseudonymized contributor data unless investigation requires otherwise. |

### 2.6 Public Verifier

| Dimension | Specification |
|---|---|
| **Access level** | Single shared credential URL — `/public/credentials/[shareId]`. No login. |
| **Permissions** | View a single credential and verify authenticity. |
| **Workflows owned** | Open link → see credential → optionally verify. |
| **Approval powers** | None. |
| **Visibility scope** | One credential at a time. No discovery of other credentials, contributors, or projects. |

### 2.7 Permission matrix (compressed)

| Capability | Enterprise | Contributor | Mentor | Reviewer | Admin |
|---|---|---|---|---|---|
| Create SOW | ✓ | ✗ | ✗ | ✗ | ✗ |
| Approve Business stage | ✓ (own) | ✗ | ✗ | ✗ | ✗ |
| Approve Glimmora Commercial | ✗ | ✗ | ✗ | ✗ | ✓ |
| Approve Legal stage | ✗ | ✗ | ✗ | ✗ | via Legal Officer role |
| Approve Security stage | ✗ | ✗ | ✗ | ✗ | via Security Officer role |
| Final SOW approval | ✓ (own) | ✗ | ✗ | ✗ | ✗ |
| Approve decomposition plan | ✓ (own) | ✗ | ✗ | ✗ | ✗ |
| Confirm team formation | ✓ (own) | ✗ | ✗ | ✗ | ✗ |
| Accept assignment | ✗ | ✓ (own) | ✗ | ✗ | ✗ |
| Submit work | ✗ | ✓ (own) | ✗ | ✗ | ✗ |
| Review submission | ✗ | ✗ | ✓ | ✓ | ✗ |
| Final accept deliverable | ✓ (own) | ✗ | ✗ | ✗ | ✗ |
| Release milestone payment | ✓ (own) | ✗ | ✗ | ✗ | ✗ |
| Configure rate cards | ✓ (tenant) | ✗ | ✗ | ✗ | ✓ (platform) |
| View audit log | ✓ (tenant) | ✗ | ✗ | ✗ | ✓ (all) |
| Manage email templates | ✗ | ✗ | ✗ | ✗ | ✓ |
| Share credential | ✗ | ✓ (own) | ✗ | ✗ | ✗ |
| Verify credential | public | ✓ | ✓ | ✓ | ✓ |

**Design implication.** Permission-aware UI is not optional. Every CTA in the product should be conditional on the current role *and* the current state of the entity. A "Release Payment" button shown to a contributor is a bug; a "Submit Work" button shown to an enterprise admin is a bug. The design system needs a *role-aware Button* component, or at minimum a documented gating pattern.

---

## 3. End-to-End Workflow Architecture

The product is, at root, *one workflow with many branches.* Below is the canonical state machine. A designer who internalizes this can navigate any screen in the product.

### 3.1 Canonical SOW lifecycle

```
   ┌──────────┐
   │  draft   │  ← Enterprise creates SOW (AI-gen or manual upload)
   └────┬─────┘
        │ submit for processing
        ▼
   ┌──────────┐
   │ parsing  │  ← AI parses, OCR/NLP extracts, guardrails run
   └────┬─────┘
        │ parse complete
        ▼
   ┌──────────┐
   │  review  │  ← human review of parsed structure
   └────┬─────┘
        │ submit for approval
        ▼
   ┌──────────────────────┐
   │   approval (5-stage) │
   │ Business → Commercial│  ← any stage can reject → status = rejected
   │ → Legal → Security   │
   │ → Final              │
   └────┬─────────────────┘
        │ all stages approved
        ▼
   ┌──────────┐
   │ approved │  ← contract render + e-sign (Phase 2)
   └────┬─────┘
        │ kickoff
        ▼
   ┌─────────────────┐
   │ decomposition   │  ← AI suggests WBS, human edits, plan-approve gate
   └────┬────────────┘
        │ plan approved
        ▼
   ┌─────────────────┐
   │ team formation  │  ← matching engine ranks, enterprise confirms
   └────┬────────────┘
        │ team confirmed → assignments dispatched
        ▼
   ┌─────────────────┐
   │ execution       │  ← per-task workrooms; submissions; reviews
   └────┬────────────┘
        │ all milestones accepted
        ▼
   ┌─────────────────┐
   │ closeout        │  ← final invoice, evidence pack, credentials issued
   └─────────────────┘
```

### 3.2 Per-task sub-workflow (runs in parallel per task within execution)

```
       assigned
          │ accept                       decline
          ▼                                  │
       in_progress                           ▼
          │ submit                       reassignment
          ▼
       under_review
       /     │      \
  accept  rework   reject
     │      │         │
     ▼      ▼         ▼
  accepted  in_rework reassignment / dispute
                │
                ▼
            re-submitted
                │
                ▼
            under_review (loop)
```

### 3.3 Approval pipeline detail (the 5 stages)

| Stage | Approver | Checks performed | Typical SLA | Rejection routing |
|---|---|---|---|---|
| **1. Business Owner** | Enterprise admin (the buyer) | Scope, budget, timeline, internal sign-off | 1–3 days | Back to draft, with structured feedback |
| **2. Glimmora Commercial** | Platform admin | Pricing fit, contributor pool availability, platform commitment | 1–2 days | Back to enterprise with commercial counter |
| **3. Legal / Compliance** | Legal officer (sub-role) | Contract clauses, regulatory compliance, IP terms | 2–5 days | Back to enterprise with redlines |
| **4. Security** | Security officer (sub-role) | Data sensitivity classification, risk score, access requirements | 1–3 days | Back with security gates required |
| **5. Final** | Authorized signatory | Digital signature, final sign-off | 1 day | Rarely rejected — formality |

Each stage produces an immutable audit event. The pipeline is *strictly sequential* in MVP; parallel stages are a Phase 2 enhancement.

### 3.4 Failure states and escalation paths

| Failure | Where it can happen | Designed response |
|---|---|---|
| **Guardrails fail on AI-generated SOW** | Stage 1 of generation | Block the draft from leaving the wizard; show layer-by-layer failure with remediation hints |
| **Confidence score below 90%** | After AI generation | Mandatory human review banner; cannot submit for approval until cleared |
| **Sanctioned jurisdiction detected** | At intake | Hard block; show why; appeals path through support |
| **Risk score > threshold** | At intake | Auto-route to Legal + Security with elevated SLA; lock to senior approver pool |
| **Stage rejection** | Any approval stage | Return to draft; preserve all prior approvals; show structured rejection reasons; require re-submission with remediation |
| **Decomposition plan rejected** | Plan approval gate | Edit mode reopened; AI re-suggests; resubmit |
| **Contributor declines assignment** | Assignment stage | Trigger reassignment to next-ranked contributor; SLA timer resets |
| **Submission rejected by reviewer** | Review stage | Rework loop; new submission version; review SLA resets |
| **Repeated rework (≥3 cycles)** | Review stage | Auto-escalate to mentor or enterprise admin; flag in monitoring |
| **SLA breach on review** | Reviewer queue | Auto-escalate to reviewer pool lead; reassign; notify enterprise |
| **Payment failure (Razorpay)** | Milestone release | Show error state; retry; manual reconciliation path |
| **Dispute on accepted work** | Post-acceptance | Open dispute case; freeze payout; route to Glimmora ops |
| **Contributor fraud flag** | Anomaly detection | Suspend contributor; freeze pending payouts; investigation case |

### 3.5 Rework loop design

The rework loop is the highest-friction interaction in the product. A contributor's submission has been rejected; the reviewer wants changes. Three constraints must be balanced:

1. **Clarity** — what exactly needs to change? Rubric scores + structured feedback per criterion + freeform note.
2. **Continuity** — the contributor should not start over. Workroom state, prior submission, prior reviewer notes must all remain visible.
3. **Pace** — the SLA timer continues. Rework must not feel like a punishment.

**Design principle.** Treat rework like a *next iteration*, not a *failure*. The version number ticks up. The history shows the journey. The contributor sees growth signals (skills practiced) even on rejected work.

### 3.6 Escalation paths (cross-cutting)

```
Contributor stuck            ───► Mentor (mentorship session)
                                   │
                                   └── unresolved ──► Enterprise admin
                                                       │
                                                       └── unresolved ──► Platform admin

Reviewer disputes           ───► Reviewer pool lead
                                   │
                                   └── unresolved ──► Mentor escalation queue

Enterprise dispute          ───► Platform admin
                                   │
                                   └── unresolved ──► Glimmora ops / contract review

Payment dispute             ───► Platform admin → Finance reconciliation

Safety / Grievance          ───► Platform admin (priority); separate audit trail
```

**Design implication.** Every state has an escalation path. The UI must surface "stuck? here's what to do next" — not leave the user wondering whose problem this is.

---

## 4. Contributor Lifecycle Map

A contributor's relationship with the platform spans months or years. The lifecycle is not a single linear flow but a series of *recurring loops* layered on a long arc.

### 4.1 The long arc

```
discovery → registration → onboarding → digital-twin baseline →
        ┌─────────────────────────────────────┐
        │  active loop (repeats per task):    │
        │  match → accept → work → submit →   │
        │  review → accept/rework → earn →    │
        │  credential → reputation update     │
        └─────────────────────────────────────┘
                  │
                  ├──► growth loop (parallel): learning recs → upskilling → expanded matching
                  ├──► community loop (parallel): mentorship, support, peer interaction
                  ├──► escalation loop (when triggered): support → grievance → safety
                  │
                  ▼
            voluntary exit OR fraud suspension OR alumni status
```

### 4.2 Stage-by-stage detail

**Stage A — Discovery (pre-account).** Marketing site, referral, university partnership, women returnship program. Design surface: landing pages, segment-specific copy. Conversion metric: registration starts.

**Stage B — Registration (multi-step).** Email → password → OTP verify → consent → segment choice. Three parallel paths (Student / Women Workforce / General) with the same shell. Drop-off risk: high — every additional step costs a percentage. Design discipline: minimum viable steps, progress indicator, save-and-resume.

**Stage C — Onboarding wizard.** Identity verification → skills declaration → evidence upload → availability → consent → complete. Persistence is currently *partial* (Zustand + some API) — a significant abandonment risk because mid-flow loss erases progress. **Highest-leverage redesign target.**

**Stage D — Digital twin baseline.** Skills + evidence + history are loaded into the canonical contributor record. This is the moment the contributor becomes *matchable*. UI signal: clear "you're ready to receive work" state.

**Stage E — First task acceptance.** Critical moment. First task should be confidence-building — small, well-scoped, with a mentor available. Bad first task = churn.

**Stage F — Active execution loop.** Browse tasks → accept → workroom → submit → feedback → resubmit OR accept. Loop continues indefinitely. Earnings accrue.

**Stage G — Growth signals.** After every accepted task: reputation update, possible credential issue, possible skill unlock, possible learning recommendation. Designer's job: make growth feel *visible* — micro-celebrations, progress visualizations.

**Stage H — Mentorship.** Triggered by repeated low scores, repeated rework, or contributor-initiated request. Mentor pairs with contributor for 1:1 session. Outcome logged in mentoring log.

**Stage I — Escalation.** Either contributor escalates (dispute, safety, grievance) or system escalates (fraud flag, SLA breach pattern). Always handled by humans with audit trail.

**Stage J — Plateau / Specialization.** Contributor finds their niche; skill graph deepens in a vertical; reputation crystallizes. Design surface: specialization-aware task discovery, expert credential paths.

**Stage K — Voluntary exit.** Data export, settings teardown, alumni status retained. Re-entry must be friction-free if they return.

**Stage L — Forced exit (fraud / repeated violations).** Account suspended; payouts frozen; appeals path. Sensitive UX — must be fair, documented, reversible if appealed successfully.

### 4.3 Design implications across the lifecycle

- **First 7 days** is the make-or-break window. Every interaction must reduce uncertainty.
- **Digital twin** is the contributor's identity. Treat it like a portfolio (proud), not a settings page (forgettable).
- **Earnings clarity** is the trust foundation. Show fees, show net, show projected, show realized.
- **Credentials** should feel earned. Issuance should have a moment.
- **Exit gracefully** — locked-out contributors talk publicly and damage trust.

---

## 5. Mentor & Reviewer Operational Flow

This is the highest-leverage area of the platform — quality of review *is* quality of delivery — and currently the most under-designed (toast-only flows, two overlapping surfaces). A designer focused here can disproportionately improve the product.

### 5.1 Queue model

The reviewer queue is the primary work surface. Items land in the queue from multiple sources:

```
Sources of queue items:
  - new submission (per task)
  - resubmission (after rework)
  - escalated review (from peer reviewer or AI confidence flag)
  - dispute (from contributor)
  - mentorship request (from contributor)

Queue sort & priority:
  - SLA urgency (closest-to-breach first)
  - escalation level
  - reviewer skill match
  - explicit pin / star

Queue UI requirements:
  - keyboard navigable
  - peek panel without losing position
  - filter by status / project / contributor / skill
  - bulk actions (assign-to-self, mark-priority)
  - SLA timer visible per item
```

### 5.2 Review action flow

```
Open queue item
   ▼
Read task spec, prior reviews, contributor context
   ▼
Open submission + evidence
   ▼
AI Review Assistant suggests rubric scores + summary
   ▼
Reviewer adjusts rubric (5 criteria × 5 stars)
   ▼
Reviewer writes feedback (contributor-visible) + optional internal note
   ▼
Reviewer decides: Accept | Request Rework | Reject
   ▼
Confirmation modal (irreversible action)
   ▼
Decision persisted, fan-out:
  - contributor notified
  - reputation engine recalculates
  - if Accept → payout eligibility triggered → enterprise notified for final acceptance
  - if Rework → workroom reopens for contributor, version increments
  - if Reject → task reassignment OR escalation
```

### 5.3 Acceptance / Rejection / Rework semantics

| Decision | Meaning | Downstream effects |
|---|---|---|
| **Accept** | Submission meets criteria | Payout eligibility, reputation +, credential progress |
| **Request Rework** | Submission has fixable gaps | Workroom reopens, contributor sees structured feedback, version increments, reviewer SLA resets |
| **Reject** | Submission fundamentally fails | Task may be reassigned, reputation impact, possible escalation, no payout |

**Critical UX detail.** "Rework" and "Reject" are different actions with different downstream consequences. The UI must make this *unambiguous.* A reviewer who picks the wrong button costs the contributor money and morale.

### 5.4 Mentorship flow

Mentorship is conversational, not transactional. It runs alongside (and triggered by) reviews.

```
Trigger:
  - reviewer flags contributor for support
  - contributor self-initiates
  - automated trigger (repeated rework on same skill)

Session flow:
  - mentor opens contributor profile + recent work history
  - schedules session (or starts ad-hoc)
  - session UI: notes, learning resources, action items
  - session closes with: notes saved, skills tagged, follow-up scheduled
  - logged in /mentor/mentorship table

Outcome signal:
  - contributor's learning velocity score updates
  - subsequent submissions tracked for improvement
```

### 5.5 Escalation handling

When a review can't conclude — disputed score, ambiguous criteria, suspected fraud — the reviewer escalates.

```
Escalation lifecycle:
  - reviewer raises escalation with reason + evidence
  - lands in escalation queue (mentor or pool lead)
  - escalation owner investigates, may interview both sides
  - resolution: uphold original / overturn / reassign / sanction
  - immutable audit entry created
  - resolution communicated to all parties
```

### 5.6 Mentor-Reviewer surface convergence (design recommendation)

Today: two routes (`/mentor/*` and `/enterprise/reviewer/*`), divergent implementations, overlapping concepts.

Recommended IA:

```
/review-hub
  ├── /queue              (active items + SLA timers)
  ├── /history            (decisions made; searchable)
  ├── /metrics            (your throughput, quality scores)
  ├── /qa-inbox           (questions from contributors)
  ├── /mentorship         (active mentees + sessions)
  ├── /escalations        (escalations assigned to you)
  └── /profile + /settings
```

One surface. Role detects whether mentorship + escalations are visible. Shared rubric model. Shared decision flow.

---

## 6. AI Decision Architecture

The "AI-governed" claim is the product's primary differentiator. The architecture below describes *what AI decides, where humans approve, and how autonomy is bounded.* Every screen that surfaces AI must conform.

### 6.1 Where AI operates (by surface)

| Surface | AI agent | What it does |
|---|---|---|
| SOW Generate wizard | Intake Assistant | Parameter-to-document generation under Guardrails |
| SOW Upload parser | Intake Assistant + NLP service | Extract structure, flag gaps, classify clauses |
| Decomposition editor | Decomposition Assistant | Suggest WBS, dependencies, skill tags |
| Matching results | Matching engine + ranking model | Rank contributors per task with explainability |
| Workroom side panel | Contributor Support Assistant | Task-scoped Q&A |
| Reviewer queue item | Review Assistant | Pre-fill rubric, summarize submission, flag risks |
| Learning recommendations | Learning Agent *(Phase 2)* | Skill-gap closure suggestions |
| Risk score | Risk model | 0–100 score on SOW |
| Confidence score | Guardrails engine | Per-clause and overall confidence |

### 6.2 Autonomy tiers

Every AI action sits in one of three tiers. The UI must reflect the tier.

| Tier | Definition | Examples | UI treatment |
|---|---|---|---|
| **Fully automated** | Low-risk, reversible | Tagging, search ranking, ordering of cards | No special UI — happens silently |
| **Human-in-the-loop** | Medium-risk; AI proposes, human edits | Decomposition suggestions, matching ranks, rubric pre-fill, SOW generation | Show as *editable proposal*; "AI suggested" label; one-click edit/reject |
| **Notify-only / advisory** | High-risk; AI recommends, human decides | Acceptance, payouts, sanctions, policy overrides | Recommendation shown but action stays manual; explicit human confirmation |

### 6.3 Human approval gates

The product is engineered so that *no money moves and no credential issues without a human in the loop.* The gates:

- SOW approval (5 stages, all human)
- Decomposition plan approval (human)
- Team confirmation (human)
- Final acceptance per deliverable (human)
- Milestone payment release (human)
- Sanction / suspension of contributor (human + audit)

### 6.4 Governance boundaries

| Boundary | Rule |
|---|---|
| **AI cannot finalize an SOW** | Human approval required at every stage |
| **AI cannot accept a deliverable** | Acceptance is always human (reviewer first, enterprise final) |
| **AI cannot release payment** | Always human-triggered |
| **AI cannot override classification** | Data sensitivity, jurisdiction, sanctions are deterministic; not adjustable by LLM |
| **AI cannot edit audit log** | Audit log is append-only; AI can write, never modify |
| **AI must surface confidence** | Any AI-generated content must carry a confidence score |
| **AI must be explainable** | "Why" must be one click away on every recommendation |

### 6.5 Explainability requirements

A designer working on any AI surface must enforce these patterns:

1. **Sourced.** Every score has a "what drove this" affordance — hover, click, or expand.
2. **Editable.** Every recommendation has a one-click edit or reject affordance.
3. **Versioned.** Yesterday's recommendation and today's must both be retrievable.
4. **Bounded by confidence.** Below threshold → human banner appears *before* the user reads the suggestion.
5. **Audit-traced.** Every AI decision logs prompts, model version, output, downstream action.

### 6.6 The Hallucination Prevention Framework (UI surfacing)

8 layers, in order. The UI for AI-generated SOWs must visibly walk through these:

1. Input validation — wizard validates inputs before generation begins.
2. Template locking — UI shows "generating within template X".
3. Clause library — UI shows "selected from N pre-approved clauses".
4. Completeness check — UI shows missing sections in red.
5. Confidence scoring — UI shows per-section confidence, overall ≥ 90%.
6. Pattern matching — UI shows similarity to historical SOWs.
7. Human approval — explicit sign-off button required.
8. Audit logging — "audit recorded" confirmation after sign-off.

**Design implication.** This pipeline is invisible to users in most products. In GlimmoraTeam it must be *partially visible* — enough to build trust, not so much that it overwhelms. The visual metaphor: a "8-step health check" badge on every AI-generated SOW.

---

## 7. Governance & Risk System

Governance is not a module — it's a layer that touches every screen. The product is enterprise-grade *because* governance is first-class, not because it's hidden.

### 7.1 RBAC (Role-Based Access Control)

- Roles: `enterprise`, `contributor`, `reviewer`, `mentor` (often unified with reviewer), `admin`.
- Sub-roles within enterprise: business owner, legal officer, security officer, finance.
- Permissions are *additive* — a user may have multiple roles (e.g., enterprise admin + finance).
- Enforcement: server-side at API boundary; client-side at route guard. (Current gap: no `middleware.ts` — flagged as P0 in audit.)
- Tenant isolation: every record carries a tenant ID; queries scoped at service layer.

### 7.2 Audit logging

Every state change produces an immutable audit event:

```
audit_event = {
  id: uuid,
  timestamp: iso,
  actor_id: uuid,
  actor_role: enum,
  action: string,          // "sow.approve.business"
  entity_type: string,     // "sow"
  entity_id: uuid,
  before: jsonb,           // prior state
  after: jsonb,            // new state
  context: jsonb,          // request metadata, AI model version, etc.
  signature: string        // optional cryptographic signature (Phase 2)
}
```

**Audited entities (MVP):** SOWs, projects, milestones, tasks, assignments, submissions, reviews, acceptances, pricing changes, payout eligibility, policy overrides, role changes.

**Designer's responsibility.** Surfaces that *show* audit (compliance pages, audit log page, evidence pack export) must be designed to make audit *useful, not noise* — filterable, exportable, contextualized.

### 7.3 Fraud prevention

| Layer | Mechanism |
|---|---|
| **Identity** | KYC at registration (Phase 2 deepens); document upload, OTP, MFA |
| **Behavioral** | Anomaly detection on submission patterns (Phase 2 advanced) |
| **Collusion** | Anti-collusion checks on reviewer-contributor pairing (Phase 2) |
| **Plagiarism** | Duplication checks on submissions |
| **Account takeover** | MFA, session monitoring, suspicious-login alerts |
| **Payout** | Wallet-level controls, escrow until acceptance, manual reconciliation |

### 7.4 Compliance checks

- **Data classification** (Public / Internal / Confidential / Restricted) — applied at SOW intake, propagated through all derived records.
- **Jurisdiction screening** — sanctioned-country list, cross-border work rules.
- **Export controls** — flag SOWs covered by export regulations.
- **GDPR / DPDP / regional privacy** — consent capture, data minimization, retention, right-to-erasure.
- **Tax** — region-aware payout compliance.
- **ESG** — reporting framework; current MVP is visual stub.

### 7.5 Evidence trails

For every accepted deliverable, an *evidence pack* can be exported:
- The task spec
- The submission(s) with versions
- The review(s) with rubric scores
- The acceptance record
- The payment record
- The credential issued
- Any escalations
- Audit events spanning the lifecycle

This pack is the artifact a regulator, auditor, or enterprise finance team consumes. Designer's job: make the export human-readable, not just complete.

### 7.6 Operational monitoring

- Service health dashboards
- Error rates, latency, throughput
- AI agent activity, override rates, confidence distributions
- Reviewer queue health (SLA hit rate, backlog)
- Payment success / failure
- Incident escalation runbooks

**For a designer:** the *internal* operations console (Platform Admin) needs as much design love as the *external* enterprise console. Currently it's the most mock-only surface in the product.

---

## 8. UX Complexity Analysis

The product has eight categories of UX risk that designers must actively manage. Each is a place the product can collapse under its own weight if designed casually.

### 8.1 Cognitive overload risks

- **SOW approval pipeline** — 5 stages × checklists × comments × attachments × chat. Without compression, this becomes a wall of UI.
- **Decomposition WBS editor** — drag-and-drop task tree + dependencies + skills + effort. Borderline a product within a product.
- **Reviewer queue with rubric** — multi-criterion scoring under SLA pressure; cognitive cost of each item compounds across the queue.
- **Enterprise dashboard** — risk of becoming a stats grid that says everything and means nothing.
- **Contributor onboarding** — 8 steps; each adds drop-off; risk of decision fatigue.

**Mitigations:** progressive disclosure, sensible defaults, AI pre-fill where confidence is high, single-action-per-screen patterns in flows.

### 8.2 Enterprise usability risks

Enterprise users bring expectations from Jira, Workday, Salesforce, Smartsheet. The product must clear that floor *before* introducing novel ideas.

- Tables must have: saved filters, multi-sort, multi-select, export, keyboard navigation.
- Forms must have: validation summaries, error recovery, unsaved-changes guards.
- Navigation must have: breadcrumbs in deep flows, back-button reliability.
- Permissions must be: visible (you can see why an action is disabled), not just enforced.
- Bulk actions must exist where enterprise volume demands them.

### 8.3 Workflow bottlenecks

| Bottleneck | Why it bottlenecks | Design lever |
|---|---|---|
| Approval pipeline | Sequential, multi-stakeholder | Stage-skipping rules for low-risk SOWs; parallel stages where independent |
| Reviewer queue | Bound by reviewer throughput | Smarter queue prioritization; AI rubric pre-fill; keyboard speed |
| Onboarding | High abandonment | Reduce steps; save-and-resume; segment-specific shortcuts |
| Decomposition | Manual editing required | Smarter AI suggestions; bulk task edit; templates |
| Milestone acceptance | Enterprise admin attention | Notifications + drill-down from dashboard; "ready for acceptance" filter |

### 8.4 Navigation complexity

The current product has six known IA confusions:

1. `/mentor/*` vs `/enterprise/reviewer/*` — two surfaces, one role. Converge.
2. `/enterprise/sow/approval` vs `/enterprise/sow/[sowId]/approve` — duplicate routes. Pick one.
3. `/enterprise/decomposition/approval` vs `/enterprise/decomposition/[planId]/approve` — same issue.
4. `/enterprise/review/*` (deliverable review) vs `/enterprise/reviewer/*` (reviewer hub) — sound-alike, different concepts. Rename one.
5. Sidebar items pointing to nonexistent pages (Workforce, Operational, Report Builder, System Health, Organisations). Remove or build stubs.
6. SOW lifecycle has multiple shells (`/sow/upload`, `/sow/generate`, `/sow/intake`, `/sow/blueprint`) — consolidate to a single canonical creation flow.

### 8.5 Operational confusion

- *Multiple sources of truth* — Zustand localStorage vs server API. Users see stale data after cache invalidation. Design principle: server is the source of truth; client caches for UX; conflicts resolve to server.
- *Toast-only success states* — gives users false confidence that work persisted. Replace with confirmed-by-server states.
- *Hidden status transitions* — SOW moves from one stage to another with no acknowledgment. Add transition celebrations and clear stage markers.

### 8.6 State management complexity

This product is *unusually state-heavy*. State lives in:

- Server (the canonical source)
- TanStack Query cache (read cache)
- Zustand stores (UI state + cache + drafts) — 17 stores
- sessionStorage (multi-step flow drafts)
- localStorage (persisted Zustand)
- URL params (route state)
- Component state (transient)

**Designer's discipline.** For every screen, ask: where does state live? When does it sync? What happens if the user refreshes? What happens if the API fails mid-action? If you can't answer these, the screen is not designed.

### 8.7 Multi-role state ambiguity

A single user may hold multiple roles (enterprise admin + finance, reviewer + mentor). The UI must:

- Show the *active* role context clearly.
- Let the user switch roles without re-login.
- Persist last-active role per user.
- Prevent action confusion (you can't "approve" while in contributor view).

### 8.8 Long-running flows

Some flows take days or weeks: SOW approval, project execution, mentorship arcs. These need:

- Persistent state (server-side drafts, not browser).
- Clear "next action" cues on landing.
- Notifications when *your* action is needed.
- Resumable sessions across devices.

---

## 9. Product Architecture Insights

What makes this product enterprise-grade, what makes it operationally complex, and why is it hard to design? Three lenses.

### 9.1 What makes it enterprise-grade

1. **Tenant isolation** — multi-tenant from day one, with strict data boundaries.
2. **5-stage approval pipeline** — formalizes what most platforms leave to email.
3. **Immutable audit log** — every action traceable.
4. **Data classification + risk scoring** — first-class, not buried.
5. **SSO + MFA + RBAC** — standard enterprise security posture.
6. **Hallucination prevention framework** — AI use is governed, not freeform.
7. **Evidence packs** — the audit artifact a regulator can consume.
8. **Configurable rate cards and SLAs** — enterprises can express their own rules.
9. **Compliance modules** — ESG, PODL, jurisdiction screening, retention.
10. **API-first** — OpenAPI 3.x, OAuth2/OIDC, programmable.

### 9.2 What makes it operationally complex

1. **Five distinct portals** — each with its own navigation, dashboards, and IA.
2. **Eight AI agents** with autonomy tiers and governance boundaries.
3. **Three contributor segments** with segment-specific economics.
4. **Multi-jurisdiction payout** — tax, compliance, currency, regulation per region.
5. **Continuous reputation engine** — recomputes after every accepted task.
6. **Long-running flows** spanning days/weeks/months.
7. **Real-time + asynchronous coordination** — workrooms have chat-like interactions, reviews have batch-like queues.
8. **Hybrid data store** — relational + graph + vector + event bus.
9. **Multi-source intake** — AI generation + manual upload with OCR/NLP.
10. **Concurrent state** — same SOW has tasks in execution, review, accepted, disputed simultaneously.

### 9.3 What design challenges exist

| Challenge | Where it bites |
|---|---|
| **Showing pipeline state at a glance** | Approval pipeline, project portfolio, contributor dashboard |
| **Surfacing AI without overwhelming** | SOW generation, decomposition, matching, reviewer rubric |
| **Cross-role consistency vs role-specific tone** | Shared chrome but distinct mental models |
| **Compliance visible without nagging** | Classification chips, audit affordances, jurisdiction flags |
| **Empty states that teach the model** | First SOW, first task, first review, first credential |
| **Errors that don't lose work** | Multi-step flows, autosave, retry semantics |
| **Permission-aware affordances** | Disabled vs hidden vs explained — pick one pattern |
| **Money that feels honest** | Earnings dashboards, fee transparency, invoice clarity |
| **Reviewer SLA + quality tradeoff** | Queue UX must reward both speed and care |
| **Onboarding without abandonment** | Server-backed drafts, segment-appropriate pacing |

### 9.4 What makes it difficult to scale

- **Reviewer pool is the throughput ceiling.** As volume grows, reviewer queue depth grows; SLAs slip. Mitigation: smarter routing, AI pre-fill, mentor escalation, training pipelines for new reviewers.
- **Onboarding bottleneck.** Each new contributor needs verification, skill capture, evidence review. Manual verification at scale = ops nightmare. Mitigation: tiered verification, progressive trust.
- **Compliance volume.** Cross-border, multi-jurisdiction compliance scales as contributor and enterprise geographies expand. Mitigation: region-aware policies, automated screening, partner network for local compliance.
- **Audit log size.** Immutable audit grows unboundedly. Mitigation: archival tiers, indexed search, sampling for high-volume events.
- **AI cost.** Every SOW generation, every rubric suggestion, every Q&A consumes inference. Mitigation: tiered models, caching, deterministic fallbacks.

---

## 10. Product Designer Interview Preparation

This section gives a designer the language, frames, and anchors to talk confidently about this product in interviews. Use the phrases verbatim or adapt — but internalize the *thinking* first.

### 10.1 How to talk about this project

**Opener (30 seconds).**
> "I worked on GlimmoraTeam, an AI-governed workforce operating system that sits between enterprises and a global pool of vetted contributors. Think of it as a Workday-meets-Toptal-meets-AI-PMO. My job was to design the workflows that turn a signed Statement of Work into delivered, paid, and credentialed work — across five distinct user portals, eight AI agents, and a five-stage governance pipeline."

**Framing the scope.**
> "The product has five roles — enterprise admins, contributors, mentors, reviewers, platform admins. The core workflow is one nine-step pipeline: SOW intake, parsing, five-stage approval, decomposition into tasks, team formation, execution in workrooms, review, acceptance, and credential issuance. Every screen exists to advance an SOW through that pipeline."

**Where you added value.**
> "I focused on the surfaces where humans interact with AI — the SOW generation wizard, the decomposition editor, the reviewer rubric, the matching results. The design challenge in each was: how do you make AI output useful but not authoritative? My rule was confidence-visible, edit-in-one-click, source-on-hover."

### 10.2 Key UX decisions you can claim ownership of (or reason through)

1. **Single canonical SOW creation flow with two entry modes.** Rather than separate "AI generate" and "manual upload" surfaces, a single flow that branches at the first step. Lower cognitive cost; one mental model.
2. **Confidence as a first-class UI element.** Every AI-generated section carries a visible confidence score. Below threshold, a banner appears *before* the user reads — reframing the suggestion as "needs review."
3. **Permission-aware buttons.** Every CTA is conditional on role + state. The button isn't hidden when disabled — it's shown with a tooltip explaining why. Teaches the user the model.
4. **Pipeline as primary navigation.** Project status is the most-checked information in the product. The pipeline visualization (5 stages of approval; 9 steps of lifecycle) is the anchor of every dashboard.
5. **Rework as iteration, not failure.** Version numbers tick up; history is preserved; growth signals visible even on rejected work.
6. **Convergence of mentor and reviewer surfaces.** One Review Hub, role-aware. Reduces IA confusion, improves discoverability of related actions.
7. **Audit affordances on every governance-relevant screen.** "View audit" is a present, not a hidden feature. Trust is built by visibility.
8. **Empty states that teach.** First-time experiences for first SOW, first task, first review, first credential — each empty state explains the model, not just the absence.

### 10.3 Workflow design thinking

When asked "how do you design a workflow," answer with this skeleton:

1. **Identify the state machine.** Every workflow is a graph of states + transitions. Draw it before drawing screens.
2. **Identify the actors per state.** Who can act? With what permission?
3. **Identify the failure states.** What can go wrong at each step? What's the recovery path?
4. **Identify the parallel processes.** What runs alongside the main flow (notifications, audit, escalation)?
5. **Identify the time horizon.** Seconds? Days? Months? Long flows need persistence + resumption.
6. **Design the primary path first.** Don't over-design edge cases until the happy path is clean.
7. **Design the next-action affordance.** The user should always know what to do next.
8. **Test the resumption point.** Refresh the page mid-flow — does it recover? Close and reopen tomorrow — does it remember?

Worked example to walk through in interview: the SOW approval pipeline. Five stages, sequential, with rejection at any stage routing back to draft, with all prior approvals preserved, with audit per stage, with SLA tracking, with parallel chat threads, with attachment management.

### 10.4 Governance thinking

If asked "how do you design for governance and compliance":

> "Governance must be visible but not blocking. The product earns the 'enterprise-grade' label by making audit, permission, classification, and risk visible *at the moments they matter* — not by gating every screen with paperwork. I designed for two states: the calm state where governance is a faint chip in the corner, and the alert state where governance is the foreground because something needs human attention."

Specific patterns:

- Classification chip (Public / Internal / Confidential / Restricted) on every record.
- Risk score on every SOW with a "what drove this" expansion.
- "Audit log" affordance on every governance-relevant screen.
- Confirmation modals only for irreversible actions, with reason capture.
- Permission tooltips on disabled actions.
- Evidence pack as a one-click export from the project closeout screen.

### 10.5 Systems thinking

If asked "how do you think about systems":

> "I think about value flows, not screens. The product has six flows that run continuously — work intent, delivered work, money, reputation, credentials, audit. Every screen sits inside at least one flow. When I design a screen, I ask: which flow does it advance? Where does the state come from and where does it go after? Who else is downstream of this action? What audit trail must this leave?"

Be prepared to draw the ecosystem diagram from Section 1.4 on a whiteboard.

### 10.6 AI workflow thinking

If asked "how do you design products that use AI":

> "Three rules. First, AI output must be sourced — every claim has a 'why this' affordance one click away. Second, AI output must be editable — every recommendation has a one-click reject or modify. Third, AI output must be confidence-bounded — below threshold, the UI reframes the suggestion as 'needs review' before the user reads it."

> "And on autonomy: I categorize every AI action into one of three tiers. Fully automated for low-risk, reversible actions. Human-in-the-loop for medium-risk, where AI proposes and human edits. Notify-only for high-risk — acceptance, payouts, sanctions — where AI recommends but never decides. The UI must visibly reflect the tier. A 'suggested by AI' label is not optional; it's a trust-building primitive."

> "On hallucination: the product has an 8-layer prevention framework — input validation, template locking, clause library, completeness checks, confidence scoring, pattern matching, human approval, audit logging. The UI surfaces the relevant layers — not all of them, not none, but enough to build trust without overwhelming."

### 10.7 Likely interview questions and prepared responses

**Q: "What's the hardest thing you designed?"**
A: "The SOW approval pipeline. Five sequential stakeholders, each with their own checklist, chat thread, attachments, and rejection path. The challenge was compressing all that into a screen that lets each approver focus on what's theirs, while making the overall pipeline state legible at a glance to anyone else who looks at it."

**Q: "What would you redesign?"**
A: "The mentor and reviewer surfaces. Today they're two routes with overlapping concepts. I'd converge them into a single Review Hub with role-aware visibility, a shared queue model, and shared rubric. Quality of review is quality of delivery in this product, so this is the highest-leverage area."

**Q: "How did you measure success?"**
A: "I'd watch onboarding completion (highest-leverage funnel), time-to-first-task for new contributors, approval-stage cycle time, reviewer decision time per item, and empty-state-to-action conversion. The first four are operational; the last is design-specific — does the user move forward from a blank screen, or bounce?"

**Q: "Tell me about a tradeoff."**
A: "Reviewer speed vs review quality. Faster decisions clear the queue and contributors get paid sooner. Slower decisions yield better feedback and better reputation signals. My design tried to absorb the tension into the rubric: AI pre-fills the rubric with confidence, the reviewer adjusts. The fast path is one click; the careful path is a few more. Speed is the default; quality is the override."

**Q: "How do you handle ambiguity?"**
A: "I start with the state machine. Whatever the screen is, it represents some state. I draw the states and the transitions. Once those are clear, the ambiguity collapses — most ambiguity is actually about hidden states or undefined transitions."

**Q: "What's a principle you'd never compromise on for this product?"**
A: "Explainability of AI. Every recommendation must be sourced, editable, and confidence-bounded. The moment AI looks like fact instead of proposal, the product loses its trust differentiator."

**Q: "How do you collaborate with engineering on a product this complex?"**
A: "Shared vocabulary for state machines and shared diagrams for flows. I'd rather argue over a whiteboard for an hour than ship a screen where the designer and engineer have different mental models of what's happening underneath."

### 10.8 What to avoid saying

- Don't say "I designed all five portals." You designed *for* the system; you collaborated on the portals.
- Don't claim the AI agents as your design — the agent architecture is a product/engineering decision; you designed the surfaces.
- Don't oversell the compliance work — many compliance modules are MVP stubs.
- Don't pretend the mentor surface is finished — it's a known gap; speak about it as a design opportunity, not a delivered feature.
- Don't over-praise the company's vision — interviewers want to hear *your* craft, not your loyalty.

---

## Appendix — Phrases worth memorizing

1. **"Every screen advances the SOW through its lifecycle."**
2. **"Confidence visible, edit in one click, source on hover."**
3. **"Governance must be visible but never blocking."**
4. **"Rework is iteration, not failure."**
5. **"Quality of review is quality of delivery."**
6. **"State machine first, screens second."**
7. **"AI proposes, human decides — every time money moves or credentials issue."**
8. **"The product earns 'enterprise-grade' by making audit, classification, and risk first-class."**
9. **"The reviewer queue is the highest-leverage surface in the product."**
10. **"Where am I in the pipeline, and what is my next action — every screen must answer this."**

---

*End of System Architecture & Workflow Mapping Document.*
