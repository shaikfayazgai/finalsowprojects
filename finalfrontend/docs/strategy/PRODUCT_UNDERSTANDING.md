# GlimmoraTeam — Product Understanding Document

> A designer's field guide to the product, the people who use it, the business it serves, and the design problems it creates. Written to make a designer fluent enough to defend any screen choice in a stakeholder meeting.

---

## 1. Product Vision

**GlimmoraTeam is a Global Workforce Operating System.** It is the layer that sits between a company's *intent to get work done* and a *worldwide pool of vetted people who can do it*. Where traditional staffing platforms stop at "find a freelancer," GlimmoraTeam keeps going — it parses the contract, breaks the work into pieces, assigns the right people, supervises delivery with AI agents, reviews the output, and pays out only when work is accepted, with every step auditable.

**Why it exists:** Companies are moving away from job-based hiring toward project-based, skill-based execution. Hiring a full-time employee for a six-week deliverable is wasteful; hiring an unvetted freelancer is risky; managing a marketplace of contributors at scale is impossible without governance. GlimmoraTeam is the product that makes "skills-based, governed, on-demand global work" actually usable by a large enterprise.

**How users interact with it:** Five distinct portals (Enterprise, Contributor, Mentor/Reviewer, Platform Admin, Public verification) wrap a single backbone — the SOW lifecycle. Every other feature exists to support, govern, or measure that backbone.

**Business value:** Replace permanent headcount and uncontrolled freelance spend with **outcome-priced, evidence-backed delivery**. The enterprise pays for accepted work, not seat-time; the contributor builds a verifiable reputation; the platform takes a fee for orchestrating and governing the system.

**UX challenge:** The product has to feel like a *consumer-grade SaaS tool* to enterprise PMs while behaving like a *regulated payments + compliance + AI governance system* underneath. Most users will never read the audit trail — but the audit trail has to exist, be reachable, and feel trustworthy when they do.

---

## 2. Business Problem

GlimmoraTeam solves four overlapping problems at once. A designer must hold all four in mind because each role's portal expresses one of them.

**For enterprises.** A signed Statement of Work today is a Word document with no enforced structure. Turning it into delivery requires manual scoping, ad-hoc resourcing, scattered review tools, and finance reconciling spreadsheets at the end. The result is *slow time-to-start, unpredictable delivery, and zero auditability when something goes wrong.*

**For contributors** (students, women returnees, freelancers, internal staff). The work-discovery layer for skilled labor is broken — LinkedIn is noise, Upwork is a race to the bottom, internal mobility is a black box. There is no portable, verifiable record of *what someone has actually delivered.*

**For mentors and reviewers.** Quality review is the most undervalued role in any delivery system. Reviewers today work in email threads with no rubrics, no SLA, no audit, and no incentive structure.

**For the platform itself.** Glimmora as a business needs to govern this two-sided marketplace at scale — pricing, compliance, fraud, payouts, KYC, sanctions screening — without turning into a manual ops shop.

**Why this matters for design.** Each role enters the product with a different mental model. The enterprise admin thinks "I have a project to ship." The contributor thinks "I need work." The mentor thinks "I have a queue." The product cannot collapse these into one universal dashboard — but it must share enough visual DNA that switching roles feels coherent.

---

## 3. Market Positioning

GlimmoraTeam is not a freelance marketplace and not an ATS. It positions in the white space between them, defined by three orthogonal axes.

| Axis | Where GlimmoraTeam sits |
|---|---|
| **Marketplace ↔ Managed Service** | Mostly marketplace, but with a managed governance layer (mentors, reviewers, AI agents). Closer to Toptal/Andela than to Fiverr. |
| **Generic Talent ↔ Skill-Specific** | Skill-graph driven; every contributor has a verified skill profile that is *earned* through delivery, not declared on a resume. |
| **Manual Ops ↔ AI-Governed** | Heavily AI-governed. Eight named AI agents do the work that human ops teams do at competitors. |

**Closest analogs and how Glimmora differs:**
- **Upwork / Fiverr** — Bid-based, resume-driven. Glimmora is outcome-based, evidence-driven. No bidding; pricing is computed.
- **Toptal / Andela** — Curated talent with human matchers. Glimmora replaces the human matcher with an agent + skill graph.
- **Workday / SAP SuccessFactors** — HRIS for permanent staff. Glimmora plugs *into* an HRIS but governs the extended workforce.
- **Bubble / Make / Zapier-style "AI workforce"** — Sells AI agents as the workforce. Glimmora sells *humans coordinated by AI agents* — the AI is the dispatcher, not the worker.

**Positioning statement a designer should be able to say in one sentence:** *"GlimmoraTeam is the Workday for project-based, on-demand work — except an AI runs the project, and the contributors are global."*

**UX challenge.** The product sits in unfamiliar conceptual territory. Users will project mental models from whichever tool they used last (Jira, Upwork, Workday). The IA has to teach the new model gently — through copy, empty states, onboarding, and the order in which information is revealed.

---

## 4. Business Model

The platform monetizes the *transaction* between enterprise and contributor, not the access. Revenue flows from four streams, with very different design implications.

1. **Per-task commission** — A percentage of every accepted task. This is the dominant stream. Design implication: the *acceptance event* is the most commercially loaded moment in the product — it triggers payment, fee capture, reputation update, and credential issuance. The UI around acceptance must be deliberate.
2. **Enterprise subscription tiers** — Tiered access to advanced AI agents, analytics, compliance modules, and SLA guarantees. Design implication: feature gating must be graceful — locked features need preview screens that *sell* the upgrade rather than just block the user.
3. **Premium contributor services** — Verification, KYC, learning paths, premium credentials. Design implication: contributors who already trust the platform are the ones who pay — surface these offers after a positive event (a credential earned, a successful submission), not at registration.
4. **Procurement integration fees** — Charged per integration (ERP, HRIS, LMS). Design implication: integration is an admin journey, not an end-user journey — it lives in the platform admin portal, not the enterprise portal.

**Two pricing concepts inside the product that designers will touch constantly:**

- **Rate cards** (configured by enterprise + platform admin). Tables of price-per-skill-per-level-per-region. The UX challenge is making a multi-dimensional grid editable without becoming a spreadsheet from hell.
- **Dynamic / segment pricing** (configured by platform admin). Different commission tiers for student / women workforce / general contributors, with experience-based bands. This is socially loaded — the UI must not feel like it's discounting people.

**UX challenge.** Money is everywhere — every screen with a task, milestone, invoice, or payout — but the product cannot let the user feel like they are inside a billing console. Money should be *visible when relevant and silent when not.* The enterprise dashboard surfaces spend; the contributor dashboard surfaces earnings; neither shows the platform's commission unless asked.

---

## 5. User Ecosystem

There are five user types. A designer who confuses any two of them will design the wrong screen.

### 5.1 Enterprise Admin (`/enterprise/*`)
The buyer. Usually a project owner, PMO lead, or delivery manager at a mid-to-large company. Lives in the SOW + Decomposition + Projects + Billing flow. **Mental model:** *"I have a deliverable due in six weeks and a budget."* Cares about: predictability, risk visibility, compliance evidence, spend control. Does *not* care about: contributor identity, individual skill scores, the AI's reasoning chain (unless something breaks).

### 5.2 Contributor (`/contributor/*`)
The worker. Could be a student doing their first paid project, a returning-to-work professional, a moonlighting freelancer, or an internal employee on rotation. **Mental model:** *"I need to find work I can do, do it well, and get paid."* Cares about: clarity of expectations, fairness of review, speed of payout, growth of their credential wallet. Three tracks under one portal: **Student**, **Women Workforce**, **General** — same surface, segment-aware nudges.

### 5.3 Mentor / Reviewer (`/mentor/*` and `/enterprise/reviewer/*`)
The quality gatekeeper. A senior practitioner who reviews submissions, runs mentorship sessions, and resolves escalations. **Mental model:** *"I have a queue of reviews and an SLA."* Cares about: queue throughput, rubric clarity, evidence quality, low-friction decision UX. The product currently has *two overlapping surfaces* for this role — a unification opportunity for the designer.

### 5.4 Platform Admin / SuperAdmin (`/admin/*`)
Glimmora's internal operator. Handles the Glimmora-side commercial sign-off on SOWs, manages email templates, configures pricing, monitors audit. **Mental model:** *"I run the platform. Show me what's wrong, what needs my approval, what to configure."* Cares about: throughput, exceptions, compliance posture, revenue health.

### 5.5 Public Verifier (`/public/credentials/[shareId]`)
A recruiter, hiring manager, or academic verifier opening a credential link a contributor shared. **Mental model:** *"Is this credential real?"* One screen, one job: render the credential and confirm authenticity. Most-trafficked unauthenticated surface — design weight should reflect that.

**UX challenge.** The product *shares a chrome* (sidebar, top bar, theming) across all five roles. The challenge is differentiating *information density and tone* per role within shared components — an enterprise dashboard needs to feel powerful; a contributor dashboard needs to feel encouraging; a mentor dashboard needs to feel efficient.

---

## 6. End-to-End Workflow

The product is a state machine on the SOW. Every screen, every API, every store exists to advance an SOW through this nine-step lifecycle. Memorize it.

1. **Intake.** Enterprise creates an SOW two ways: (a) AI-Generated via a parameter wizard, or (b) Manual Upload (PDF/DOC, parsed with OCR + NLP). Status: `draft`.
2. **Parsing & Risk Scoring.** AI extracts structure (title, deliverables, dates, dependencies), computes a risk score (0–100), classifies data sensitivity (Public / Internal / Confidential / Restricted), and runs hallucination-prevention checks for AI-generated SOWs. Status: `parsing → review`.
3. **5-Stage Approval Pipeline.** Business Owner → Glimmora Commercial → Legal → Security → Final. Each stage produces an immutable audit entry. Rejection at any stage routes back to the submitter with structured feedback. Status: `approval → approved` (or `rejected`).
4. **Contract & Kickoff.** Approved SOW becomes a contract; kickoff initiates the decomposition flow.
5. **Decomposition (WBS).** Approved SOW is decomposed into milestones → tasks → subtasks, each tagged with skills and effort. Requires a separate "approve plan" gate.
6. **Team Formation.** Matching engine ranks contributors per task (skills × availability × reliability × cost). Enterprise confirms or overrides. Contributors accept/decline.
7. **Execution in Workrooms.** Each task gets a workroom: instructions, file uploads, Q&A, evidence checklist. Contributors submit; AI agents and humans (mentors, reviewers, client) review.
8. **Acceptance & Payment.** Accepted work triggers payout eligibility; milestone acceptance triggers invoice + Razorpay payment. Rejected work returns to the contributor as a rework loop with versioning.
9. **Credential Issuance & Reputation Update.** Accepted work updates the contributor's digital twin, issues a verifiable credential, and feeds the global talent graph.

**Why this matters for design.** Every screen in the product is "you are *here* in this nine-step pipeline." Breadcrumbs, status chips, pipeline visualizations, and progressive disclosure all anchor to this single timeline. If a screen does not clearly signal *which step the user is in*, it has failed.

**UX challenge.** The workflow is *linear in intent* but *parallel in execution.* A single SOW can have ten tasks in execution, two in review, three accepted, and one disputed — simultaneously. The UI must collapse this multiplicity into a single legible status while letting the user drill down per task. This is where dashboards earn their keep.

---

## 7. Core Product Modules

The product decomposes into roughly sixteen feature modules. Each maps to a section of the sidebar and a slice of the codebase.

| Module | Purpose | Primary role |
|---|---|---|
| **SOW Lifecycle** | Intake → parse → approve → contract → archive | Enterprise + Admin |
| **Decomposition / Planning** | Break SOW into tasks, dependencies, milestones | Enterprise |
| **Project Portfolio** | Portfolio of active projects with monitoring, exceptions, completed projects | Enterprise |
| **Review & Acceptance** | Deliverable evidence review, acceptance logs, rework loops | Enterprise + Reviewer |
| **Reviewer Hub** | Queue, QA inbox, task monitor, mentoring log, metrics | Reviewer |
| **Mentor Portal** | Queue, mentorship sessions, escalations, history | Mentor |
| **Billing & Payments** | Budget, invoices, rate cards, pricing, payouts, Razorpay | Enterprise + Admin |
| **Compliance** | Documents, ESG, evidence, PODL (Proof of Delivery Ledger) | Enterprise + Admin |
| **Analytics** | Economic, governance, operational, workforce dashboards | All roles, scoped |
| **Team Formation** | Match, confirm, manage teams per project | Enterprise |
| **Contributor Workspace** | Tasks, submissions, profile, digital twin, evidence | Contributor |
| **Credentials** | Earned credentials, share, verify | Contributor + Public |
| **Earnings** | Wallet, payouts, history | Contributor |
| **Learning** | AI-recommended courses, skill-gap closure | Contributor |
| **Community & Support** | Tickets, grievances, safety reports, FAQs | Contributor |
| **Auth & Onboarding** | Multi-step register, OAuth, MFA, role-specific onboarding | All |
| **Admin Configuration** | Email templates, roles, settings, audit, pricing | Platform Admin |
| **Notifications** | In-app + email, currently Zustand-driven | All |

**Two modules deserve special design attention** because they are *load-bearing*:
- **SOW Lifecycle.** Every other module exists to feed or consume an SOW. Get this right and the rest of the product feels coherent. Get it wrong and the user is lost.
- **Review & Acceptance.** This is where money moves and reputation updates. The decisions made here are irreversible in spirit. Confirmation, evidence display, and rubric design must be near-perfect.

---

## 8. AI Agent Ecosystem

GlimmoraTeam is *agentic by design*. There are eight named agents in the full platform spec; four are live in the MVP. A designer must understand which agent owns which screen and where the human is in the loop.

**MVP agents (assistive mode — human in the loop):**

| Agent | Where it shows up in UI | Designer's job |
|---|---|---|
| **SOW Intake Assistant** | SOW Generate wizard + Upload parsed-review screen | Show the agent's confidence score, flagged issues, and suggested edits without overwhelming the human approver. |
| **Decomposition Assistant** | Decomposition plan creation | Display suggested task graph as *editable proposal*, not as fact. Allow drag-edit-reject. |
| **Contributor Support Assistant** | Workroom side panel, AI chat widget in shell | Conversational UI, scoped to current task context. Cite sources where possible. |
| **Review Assistant** | Mentor queue + Reviewer hub | Suggest rubric scores and feedback summaries — the human reviewer accepts/adjusts. |

**Future agents (Phase 2):**

| Agent | Future role |
|---|---|
| **Workforce Optimization Agent** | Auto-rebalances teams when contributors drop out or SLAs slip |
| **Governance & Risk Agent** | Policy checks, escalation recommendations |
| **Learning Agent** | Generates next-best learning actions |
| **Payment Agent** | Validates completion, computes payout |
| **Proof-of-Delivery Agent** | Issues verifiable credentials |

**Autonomy tiers** — every AI action has one of three governance modes:
- **Fully automated** — low-risk decisions (tagging, search ranking, suggestion ordering)
- **Human-in-the-loop** — medium-risk (decomposition suggestions, contributor matching, rubric scores)
- **Notify-only** — high-risk (acceptance, payout, sanctions) — agent recommends, human decides

**Hallucination Prevention Framework** (8 layers, applied only to AI-generated SOWs):
1. Input validation
2. Template locking (no free-form generation)
3. Clause library (only pre-approved clauses)
4. Completeness checks
5. Confidence scoring (90% minimum)
6. Pattern matching against historical SOWs
7. Human approval gate
8. Audit logging

**UX challenge.** AI output must feel *useful but not authoritative.* Show confidence visibly. Make rejection or edit one click away. Never let an AI suggestion look like a system fact. When confidence is below threshold, surface that *before* the user reads the suggestion — not after they've already trusted it.

---

## 9. Governance & Security

Governance is not a feature — it is a tax on every other feature. A designer must internalize this because every screen has a governance shadow: audit log entries, RBAC checks, classification flags, retention policies.

**Identity & access.**
- NextAuth v5, JWT 30-day sessions.
- Four providers: Credentials (email/password), Google OAuth, Microsoft Entra ID, custom Glimmora OAuth.
- MFA via TOTP with recovery codes.
- Role-based access control: `enterprise`, `contributor`, `reviewer`, `admin`. Future: SCIM provisioning.

**Audit logging.** Every state change on an SOW, project, task, submission, review, acceptance, payment, or policy override produces an immutable audit event. Audit logs are queryable, exportable, and immutable.

**Data classification.** Four tiers applied at SOW intake and propagated through tasks and assignments: **Public, Internal, Confidential, Restricted**. Access controls enforce per-classification visibility. Design implication: every record that handles SOW data must surface its classification visibly (badge, color cue) — designers will need a *classification chip* in the design system.

**Risk scoring.** Numeric 0–100 risk score per SOW driven by data sensitivity, jurisdiction, industry, budget, and compliance requirements. Used to route approval (high risk → mandatory legal + security stages).

**Jurisdiction screening & sanctions.** Cross-border work regulations are checked at SOW intake; sanctioned jurisdictions block creation; export controls trigger compliance flags.

**Ethics gates.** Prohibited content detection (sanctioned activities, harassment, illegal work) automatically blocks SOWs.

**Compliance modules in the UI:** Documents (corporate policies), ESG, Evidence (audit-ready exports), PODL (Proof of Delivery Ledger). All currently visual stubs in MVP — design opportunity to define what "good" looks like here.

**UX challenge.** Governance must be *visible but never blocking.* Users should feel safer because of these controls, not slower. Best-in-class examples: GitHub's branch protection rules, Stripe's compliance posture in onboarding. Worst examples: enterprise security tools that interrupt every action. Aim for the former.

---

## 10. Economic System

The product runs an internal economy. Every accepted task generates value flows in four directions simultaneously: enterprise pays, contributor earns, platform takes a fee, governance receives an audit event.

**Pricing.**
- **Base pricing** = rate card × estimated effort. Configured by enterprise + platform admin.
- **Bonuses** for quality, early delivery, mentoring.
- **Penalties** / clawbacks for fraud or persistent low quality.
- **Dynamic pricing** is *out of MVP scope* — Phase 2.

**Rate cards.** Multi-dimensional grids: role × skill × level × geography. Currently editable in `/enterprise/billing/rate-cards` (persisted to a Zustand store, not the server — a gap). UX design opportunity: make this grid editable without a spreadsheet UX.

**Payment flow.**
1. SOW approved → budget reserved.
2. Task assigned → funds escrow-style hold.
3. Task accepted → payout eligibility triggered.
4. Milestone accepted → invoice generated + Razorpay order created.
5. Payment captured → contributor wallet credited.

**Wallets.** Each contributor has an internal ledger of earnings, payouts, adjustments. Surface: `/contributor/earnings`.

**Three contributor segments with different commission tiers:**
- **Student** — Lower commission, learning-supplemented
- **Women Workforce** — Lower commission, flexible scheduling
- **General** — Standard commission

**UX challenge.** Surfacing money is a trust-builder when done well and a manipulation cue when done badly. Earnings dashboards must feel honest (show fees, show net, show projected vs. realized). Invoices must look like documents, not screenshots. Refund and dispute flows are not built in MVP — and they are *the* place a missing flow becomes a customer-service nightmare.

---

## 11. Contributor Lifecycle

A contributor's journey through the platform is the longest user journey in the product. It spans months or years. Design must support each stage distinctly.

**Stage 1 — Discovery & Registration.**
Public landing → choose contributor → multi-step registration (basic info → password → OTP verify → consent). Two parallel tracks (Student, Women Workforce) follow the same UI but with segment-specific copy and pricing.

**Stage 2 — Onboarding.**
Multi-page wizard: identity verification → skills declaration → evidence upload → availability → consent → complete. Persistence is currently *partial* — a known UX risk because abandonment loses everything.

**Stage 3 — Digital Twin Baseline.**
Skills + evidence + history populate the contributor's *digital twin* — the canonical record used by the matching engine. Visible to the contributor at `/contributor/profile/digital-twin`.

**Stage 4 — Active Work.**
Browse `/contributor/tasks` → accept → workroom → submit → review feedback → resubmit or accept. Earnings accrue. Credentials issue on acceptance.

**Stage 5 — Growth.**
Learning recommendations close skill gaps. Mentorship sessions deepen quality. The reputation engine continuously updates reliability, quality, collaboration, and learning-velocity scores.

**Stage 6 — Escalation or Offboarding.**
Repeated SLA breaches → fraud flags → temporary suspension → permanent offboarding. Or voluntary exit → data export → alumni status.

**Design implications.**
- Onboarding must support resume-after-interrupt. Currently broken — fix is a high-priority design opportunity.
- The digital twin is a *living dossier* — design it like a portfolio, not a settings page.
- Credential wallet should *feel like an achievement* — small celebrations on issuance, visible sharing affordances.
- The platform must support graceful exit. Contributors who feel trapped don't come back.

**UX challenge.** The contributor is the user with the most varied background — could be a 19-year-old student, a 45-year-old returning professional, a senior freelancer. Tone, density, and onboarding pace must flex per segment without splitting the codebase.

---

## 12. Mentor & Review System

This is the most under-designed and highest-leverage area of the product. Quality of review *is* quality of delivery.

**Two surfaces, one job (today).**
- `/mentor/*` — Standalone Mentor portal. Currently *toast-only* — clicks fire toasts but persist nothing.
- `/enterprise/reviewer/*` — Reviewer sub-portal under Enterprise shell. Partially wired to real APIs.

These should converge in design — one canonical "Review Hub" surface with shared sidebar, shared queue model, shared rubric.

**Reviewer workflow.**
1. Item lands in queue (auto-assigned by reviewer pool + skill match).
2. Reviewer opens item → sees task spec, contributor profile, submission, evidence checklist, AI-generated rubric suggestion.
3. Reviewer scores against rubric (typically 5 criteria × 5 stars).
4. Reviewer leaves feedback + optional internal note.
5. Reviewer decides: Accept / Request Rework / Reject.
6. Decision triggers downstream events: contributor notified, payout state changes, reputation updates.

**Mentor workflow.**
- Picks up *mentorship sessions* (1:1 guided sessions with contributors).
- Logs session notes, tags skills covered, recommends next steps.
- Handles escalations (when a contributor disputes a review or asks for help).

**Metrics surface.**
- `/enterprise/reviewer/my-metrics` — reviewer's own throughput, SLA hit rate, decision distribution, quality of feedback.

**Design implications.**
- Queue UX is *the* primary work surface. It must feel like Linear, not like Jira — fast, keyboard-driven, scannable.
- Rubric design must be *consistent and reusable.* A bad rubric pollutes the entire economy.
- The Accept / Rework / Reject decision needs a confirmation step (currently exists) *and* real persistence (currently missing).
- Mentorship is relational; reviews are transactional. The UI should signal this difference — mentorship sessions look like conversations; reviews look like forms.

**UX challenge.** Reviewers under SLA pressure default to lazy decisions. The UI's job is to *make the right decision the fast decision* — pre-populated rubric suggestions, evidence inline (not in a popup), keyboard shortcuts, one-key approve/reject.

---

## 13. Enterprise Operations Model

The enterprise portal is the largest and most feature-dense surface in the product. It runs as a delivery operations console with seven major work areas.

**1. SOW Repository.** Single source of truth for all SOWs across statuses. Search, filter, sort, drill down. Bulk actions are missing — opportunity.

**2. Approval Pipeline.** The 5-stage approval kanban. Currently shown as a single SOW's pipeline detail; could be visualized as a portfolio-wide kanban (opportunity).

**3. Decomposition Planning.** Convert approved SOW into WBS. Each plan goes through its own "approve plan" gate.

**4. Project Monitoring.** Portfolio view + per-project view with milestones, tasks, exceptions, monitoring telemetry. The portfolio table supports card view and table view.

**5. Review & Acceptance.** Enterprise-side review of deliverables (after reviewer-side review). Final acceptance unlocks payment.

**6. Billing.** Budget tracking, invoice list, payment history, rate cards, pricing config, reports.

**7. Compliance & Audit.** Documents repository, ESG dashboard, evidence pack export, audit log, PODL.

**Cross-cutting features.**
- **Settings** — Company profile, Team management, Security, Notifications preferences.
- **Onboarding** — One-time enterprise setup wizard. Currently broken (`/enterprise/onboarding` returns null — high-priority bug).
- **Analytics** — Economic, governance, operational dashboards.

**Hierarchy of attention** (for the enterprise admin user). On any given day they want to see, in order:
1. What needs my approval right now? (SOW awaiting Business stage, plan awaiting approval, milestone awaiting acceptance)
2. What's at risk? (Project exceptions, SLA breaches, budget overrun warnings)
3. What's flowing? (Active projects in delivery)
4. What's done? (Completed projects, credentials issued, invoices paid)

The dashboard should be designed against this hierarchy, not as a generic stats grid.

**UX challenge.** Enterprise users come from Jira, Asana, Smartsheet, Workday — they will expect filtered tables with saved views, exportable everything, and keyboard shortcuts. The product must clear this baseline before it does anything novel.

---

## 14. Data & Intelligence Layer

Beneath the UI is a graph of entities — contributors, skills, projects, credentials, organizations, tasks, submissions. The intelligence layer turns this graph into recommendations, scores, and predictions. Designers don't build this — but they surface it on every screen.

**Core data structures.**
- **SOW & Project Domain** — sow, project, milestone, task, dependency
- **Talent Graph** — contributor, skill, credential, reputation_metric
- **Execution Domain** — assignment, submission, review, incident, audit_event
- **Economic Domain** — rate_card, invoice, payment, payout, tax_record

**The talent graph.** Contributors connect to skills; skills connect to other skills (adjacencies); contributors connect to projects they performed; credentials issue against project completions. The graph is the *substrate* of matching, ranking, and credential verification.

**Intelligence services design surfaces in the UI:**

| Surface | Underlying intelligence |
|---|---|
| Contributor recommendations on a task | Skill match + availability + reliability + cost ranking |
| "Why matched" explainability fields | The matching engine's reasoning output |
| Risk score on an SOW | Risk model fed by data sensitivity, jurisdiction, budget |
| Confidence score on an AI-generated SOW | The Guardrails Engine's 8-layer output |
| Skill heatmaps in analytics | Graph analytics over the talent graph |
| Learning recommendations | Skill-gap inference from digital twin |
| Reputation score | Reliability + quality + collaboration + learning velocity |

**Design implication.** Every score, every recommendation, every "AI says" claim must be:
- **Sourced** — a hover or expand reveals what drove the number.
- **Editable / overridable** — humans must always be able to override (and override must audit).
- **Versioned** — yesterday's score and today's score must both be retrievable.

**UX challenge.** Numbers without explanation feel arbitrary. Numbers with explanations feel transparent. This is where the product earns the "AI-governed" claim or loses it.

---

## 15. MVP vs Future Vision

Designers must hold two horizons in their head: what to design for Phase 1 (live in 30 days from SOW signing) and what to design for Phase 2 (3–6 months) without locking the MVP into a corner.

### MVP (Phase 1) — in scope today

| Module | MVP capability |
|---|---|
| SOW Intake | Dual pathway: AI-Generated wizard + Manual Upload (OCR + NLP) |
| Hallucination Prevention | All 8 layers operational |
| Multi-Stage Approval | Business → Glimmora Commercial → Legal → Security → Final |
| Ethics / Risk Gates | Prohibited content, data classification, risk scoring, jurisdiction screening |
| Decomposition | Semi-automated, human-approved |
| Matching | Skills-based ranking v1 + explainability fields |
| Workroom + Review | Single-stage and two-stage review with rework loops |
| Pricing | Static rate cards (no dynamic pricing) |
| Payout | Eligibility on acceptance, basic wallet ledger |
| AI Agents | 4 of 8 (Intake, Decomposition, Support, Review) in assistive mode |
| Security & IAM | SSO, RBAC, audit logs, MFA |
| Accessibility | WCAG-aligned core journeys |

### Out of MVP — Phase 2 and beyond

- **Dynamic market pricing** and surge pricing
- **Autonomous Project Governor** (full agent autonomy without human approval)
- **Cryptographic credentials** / verifiable credential wallet
- **Advanced fraud detection** (behavioral anomaly, anti-collusion)
- **Multi-region active-active**
- **Deep ERP integration** (full GL posting, multi-entity invoicing)
- **Advanced learning paths** with curriculum generation
- **Mobile-native apps** (mobile-responsive web is the MVP baseline)
- **Community feed and contributor messaging** at scale

**Design implication.** MVP screens should *anticipate* Phase 2 surfaces — leave room in the IA for dynamic pricing, agent autonomy dashboards, credential blockchain views — but ship the MVP without these and avoid building structural debt that blocks them.

**UX challenge.** Stakeholders will pressure designers to "show the future" in MVP. Resist. The MVP needs to ship and run real pilots. The Phase 2 screens earn their place after Phase 1 succeeds.

---

## 16. UX Complexity Areas

Six places where the product is genuinely hard to design and where most teams fail.

### 16.1 The SOW Wizard
A 7-step manual upload flow and a separate AI-generation wizard. Both produce the same target artifact (an SOW). Both must support partial save, browser refresh, mid-flow exit, and back navigation. Currently uses `sessionStorage` — fragile. Design opportunity: a *single canonical SOW creation flow* with two entry modes, server-backed drafts, autosave indicator.

### 16.2 The Approval Pipeline
Five stages, each with its own approver, checklist, comments, attachments, and chat thread. Visual challenge: how do you show *where the SOW is, who is waiting, and what the bottleneck is* without a wall of timeline UI? Reference: Linear's status bar, Stripe's payment timeline.

### 16.3 Decomposition (WBS Editor)
Drag-and-drop task tree, dependencies between tasks, effort estimation, skill tagging. This is borderline a product within the product. Currently UI-complete but persistence is patchy. Design must balance *editing power* with *AI-suggested structure.*

### 16.4 The Multi-Role Reviewer Surface
Same person can be a reviewer in `/enterprise/reviewer/*` and a mentor in `/mentor/*`. Two surfaces today. Convergence to one is a design opportunity. Watch for: confusion between *deliverable review* (per artifact) and *task review* (per assignment).

### 16.5 The Digital Twin
Living, evolving record. Must feel like a portfolio (proud, shareable) on the contributor side, like a candidate profile (filterable, sortable) on the enterprise side, and like a credential (immutable, verifiable) on the public verification side. *Three views of one record.*

### 16.6 Empty States and Error States
The product runs off real APIs in some areas and mocks in others. Designers must produce empty states for: no SOWs, no projects, no tasks, no reviews, no credentials, no notifications, no team members, no compliance documents. Today many of these are missing — first impression risk.

**UX challenge across all six.** Each one carries multi-step flows with branching and rework. *State is the enemy.* The designer must collaborate with engineering to define a single state machine per flow, expose status as a primary affordance, and never let the user wonder "where am I."

---

## 17. Operational Risks

These are not bugs — they are systemic risks that show up *as UX failures* and that designers must mitigate through interaction design.

| Risk | UX symptom | Design mitigation |
|---|---|---|
| **AI hallucination on SOW generation** | User trusts a wrong clause | Confidence score visible inline; mandatory human approval gate; diff view against templates |
| **Mock-only mentor flows** (toast-only actions today) | Decisions don't persist, contributors get inconsistent feedback | Optimistic UI with rollback on API failure; confirmation modals before destructive decisions |
| **Razorpay payment with no server verification** | Double-release, race conditions | Lock UI state during payment, server-confirm before showing "paid" |
| **Audit gaps in compliance module** | "Show me proof" requests fail | Surface what *is* logged and don't promise audit on screens that don't actually log |
| **Onboarding abandonment** | Partial sessionStorage state lost on refresh | Server-backed drafts, resume affordance, "we saved your progress" copy |
| **Reviewer queue overload** | Mentors miss SLA, contributors wait | Queue prioritization UI; clear SLA timers; reassignment affordances |
| **Sanctioned content slipping through** | Compliance incident | Hard block at intake; clear rejection messaging; appeals path |
| **Cross-border tax / payout failures** | Contributor isn't paid | Surface payout method requirements early in onboarding; clear error states; support escalation path |
| **Bias in matching** | Same contributors win every match; new contributors never get work | "Why matched" explainability; diversity signals in ranking; designer must advocate for fairness affordances |
| **Reputation gaming / fake reviews** | Trust erodes | Sample-based mentor re-review; suspicious-pattern flagging; audit trail on every rubric submission |

**Design as a risk-mitigation discipline.** Most of these risks are *invisible until they bite.* A good designer's job is to make them visible early — through copy, status, audit affordances, and confirmation patterns.

---

## 18. Product Differentiators

What makes GlimmoraTeam defensible? A designer should be able to explain this to a stakeholder, an investor, or a candidate in under a minute.

1. **AI-governed, not AI-decorated.** Other platforms add chatbots. Glimmora has eight named agents with defined autonomy tiers, audit logs, and human-in-the-loop gates.
2. **Outcome-priced, not seat-priced.** Enterprises pay for accepted work. Contributors are paid for delivery. Nobody pays for "hours worked."
3. **Evidence-based reputation.** A credential on Glimmora is backed by a real project delivery with a real review trail. Verifiable by URL.
4. **5-stage SOW approval as a product, not a process.** Most platforms treat contracts as PDFs. Glimmora treats SOWs as structured, governed, scoreable artifacts.
5. **Dual SOW intake** (AI-generate + manual upload) with hallucination prevention. Competitors either generate freely (unsafe) or only accept uploads (slow).
6. **Three contributor segments** (students, women workforce, general) with segment-specific economics. Enables institutional partnerships universities, women-returnship programs, government workforce schemes can't get elsewhere.
7. **Talent graph as substrate.** Skills, projects, credentials, organizations connected in a graph — not a flat list. Powers matching, learning, reputation.
8. **Compliance as a first-class surface.** ESG, PODL, audit, jurisdiction screening — visible, not buried.

**For a designer interviewing on this product**, the *single* differentiator to lead with is: *"Glimmora treats a Statement of Work as a live, governed, AI-coordinated workflow — not as a paper contract followed by manual delivery."* Everything else follows.

---

## 19. Success Metrics

A designer must know what the business measures, because every design decision shifts at least one of these.

**Operational metrics.**
- Time-to-staff (SOW signed → team formed) — target reduction ≥ X%
- Time-to-start (team formed → first task started)
- On-time milestone completion rate
- SLA compliance rate (reviewer queue)

**Workforce metrics.**
- Contributor engagement (active days / month)
- Skill development progress (skills earned per active contributor)
- Diversity & inclusion (segment representation in delivered work)
- Mentorship session completion rate

**Economic metrics.**
- Average cost per task
- Platform transaction volume
- Contributor earnings growth
- Margin per SOW

**Quality metrics.**
- Acceptance rate of submitted work
- Rework percentage
- Enterprise customer satisfaction (CSAT/NPS)
- Contributor satisfaction

**AI / Governance metrics.**
- Hallucination prevention pass rate
- Confidence score distribution
- Override frequency (human overrides AI recommendation)
- Risk score accuracy (model predictions vs. observed incidents)

**Design's measurable contribution.**
- Onboarding completion rate (highest-leverage funnel)
- Time-to-first-task for new contributors
- Approval-stage cycle time
- Reviewer decision time per item (lower = better, with quality held constant)
- Empty-state-to-action conversion (does the user act, or bounce?)

**UX challenge.** Many of these metrics conflict. Faster reviews vs. higher quality. More automation vs. more human-in-the-loop. The designer's job is to surface the tension and design for the right tradeoff — and to make the tradeoff *legible* to the team measuring it.

---

## 20. How to Explain This Product in Product Design Interviews

Use this section verbatim if helpful. Keep the answer under two minutes.

### The 30-second pitch

> "GlimmoraTeam is an AI-governed workforce operating system. Enterprises bring in a Statement of Work, our AI breaks it down into tasks, matches it to vetted global contributors — students, women returners, freelancers, internal staff — and supervises delivery with eight specialized AI agents. Reviewers and mentors stay in the loop for quality. Payment happens only on accepted outcomes. Every step is auditable, every credential is verifiable. We're somewhere between Toptal, Workday, and an AI-native PMO."

### The 2-minute pitch

> "Think of GlimmoraTeam as Workday for project-based work. Most companies today either hire full-time employees they don't fully utilize, or they hire freelancers they can't govern. Glimmora replaces both with a third model: a marketplace of vetted contributors, orchestrated by AI agents, where every piece of work is a defined task with a defined price, a defined reviewer, and a defined acceptance criterion.
>
> The product is five portals on one backbone. Enterprises create Statements of Work — either through an AI wizard with a hallucination-prevention framework, or by uploading their own PDFs that we parse with OCR. The SOW goes through a five-stage approval pipeline — business owner, our commercial team, legal, security, and final sign-off. Once approved, it's decomposed into tasks, matched to contributors, executed in workrooms, reviewed by mentors, accepted, and paid out — automatically.
>
> Contributors carry a 'digital twin' — a verifiable record of every task they've completed, every credential earned, every skill demonstrated. That digital twin powers matching for future work.
>
> The design challenge: this is a high-stakes enterprise tool — money moves, compliance matters, audit is real — but it has to feel like a consumer SaaS product to the people who use it daily. My job as a designer is to make the governance invisible until it's needed, and obvious when it is."

### Likely follow-ups and how to handle them

**Q: "What's the hardest UX challenge in this product?"**
A: "The SOW approval pipeline. Five sequential approvers, each with their own checklist, comment thread, and rejection path. The challenge is showing the user *where the document is in the pipeline, who is waiting, what the bottleneck is*, and giving each approver only what they need — without making the screen feel like Salesforce. I'd compare it to Stripe's payment status timeline, but with five actors instead of two."

**Q: "How do you think about the contributor experience versus the enterprise experience?"**
A: "Same chrome, different tone and density. Enterprise dashboards are dense, filter-heavy, action-oriented — these are users who manage portfolios. Contributor dashboards are encouraging, narrative, achievement-oriented — these are users who want to grow. The design system has to flex enough to express both without forking."

**Q: "Where does AI show up in the interface?"**
A: "Everywhere it makes a recommendation — SOW generation, decomposition, matching, review rubric scoring, learning recommendations. The rule I'd hold: every AI output must be sourced, editable, and versioned. Confidence is visible. Override is one click away. AI never looks like fact — it looks like a *useful proposal*."

**Q: "What would you redesign first?"**
A: "The mentor / reviewer surface. Today the product has two overlapping surfaces — `/mentor/*` and `/enterprise/reviewer/*` — with different implementations. Quality of review *is* quality of delivery in this product, so converging these into one fast, keyboard-driven queue with a shared rubric model is high-leverage."

**Q: "What's the biggest risk you'd flag to stakeholders?"**
A: "Trust in the AI. If contributors believe matching is biased, or enterprises believe AI-generated SOWs are unreliable, the product loses its differentiator. Explainability isn't a feature — it's a survival mechanism. I'd push hard on confidence scores, 'why matched' affordances, and audit visibility everywhere AI shows up."

---

## Appendix — Quick reference for the designer

**Five portals:**
- `/enterprise/*` — buyer
- `/contributor/*` — worker
- `/mentor/*` and `/enterprise/reviewer/*` — quality gatekeeper (two surfaces today, should converge)
- `/admin/*` — Glimmora platform operator
- `/public/credentials/[shareId]` — public verifier

**The one diagram to internalize:**
```
SOW intake → AI/manual parse → 5-stage approval → contract → kickoff →
decomposition → team formation → execution in workrooms → review →
acceptance → payment + credential issuance + reputation update → close
```

**The one phrase to anchor every screen:**
> "Where am I in this nine-step pipeline, and what is my next action?"

If a screen can't answer that, it isn't done.

---

*End of Product Understanding Document.*
