# GlimmoraTeam UX Research Foundation

**Version:** 1.1
**Date:** 2026-03-07
**Basis:** Every element in this document is derived from SOW V2.0. Anything beyond the SOW is explicitly marked [UX RECOMMENDATION].
**Change Log:** V1.1 — Updated Priya Nair journey map (dual SOW intake mode), Enterprise Admin Console IA (AI Parameter Wizard, multi-stage approval), added AI Transparency design principle, updated screen inventory. Only Enterprise-facing sections affected; Contributor Portal, Mentor Workspace, and Analytics sections unchanged.

---

## PART 1: USER SEGMENTS (from SOW Section 2.3)

The SOW defines the following target users and stakeholders:

### Segment A: Enterprise Users
- Enterprise business owners and project sponsors
- HR, Talent, and Learning & Development teams
- Procurement and finance controllers
- **They use:** Enterprise Admin Console (Section 19.1)

### Segment B: Contributors (all types share the Contributor Portal)
The SOW defines "Contributor" as: any individual or AI agent performing tasks, including internal employees, freelancers, students, women workforce participants, mentors, and reviewers (Section 1.5).

Contributors are served by a single **Contributor Portal** (Section 19.2) with segment-based views:
- Student contributors (Student Contributor Track — Section 20.1)
- Women workforce contributors (Women Workforce Contributor Track — Section 20.2)
- Freelancers
- Internal employees (via HRIS sync)
- **They use:** Contributor Portal (Section 19.2)

### Segment C: Mentors and Reviewers
- Mentors, reviewers, and governance officers
- **They use:** Mentor & Reviewer Workspace (Section 19.3)

### Segment D: Analytics Users (cross-cutting)
- HR, PMO, Finance stakeholders who consume workforce intelligence
- **They use:** Analytics & Workforce Intelligence Dashboards (Section 19.4)
- [Note: This may be accessed as part of the Enterprise Admin Console or as a standalone module — SOW does not specify separation clearly]

---

## PART 2: PERSONA DEFINITIONS

### Persona 1: Priya Nair — Enterprise Project Sponsor / Procurement Lead

**Derived from SOW segments:** Enterprise business owners, project sponsors, procurement and finance controllers (Section 2.3)

**Demographics:**
- Age: 38
- Location: Mumbai, India
- Role: Senior Manager, IT Procurement at a mid-large enterprise (2,000+ employees)
- Education: MBA (Operations), B.E. (Information Technology)
- Experience: 14 years in IT procurement and vendor management
- Device: Company laptop (MacBook/Windows), work phone

**Professional Context:**
- Manages 15-20 active IT vendor contracts
- Responsible for SOW creation, vendor selection, delivery oversight, payment authorization
- Reports to VP of IT Operations
- Evaluated by: cost savings, delivery on-time %, vendor compliance scores

**Psychographic Profile:**
- Compliance-obsessed: career depends on audit-readiness
- Skeptical of AI claims: needs concrete results before trusting
- SOW interpretation is the trust fulcrum: if the platform correctly interprets her SOW, she trusts the rest
- Budget-conscious: every rupee must be accounted for
- Time-poor: 6-8 meetings/day, needs efficient interfaces
- Risk-averse: prefers proven over cheap
- Concerned about AI hallucination in generated content — demands visibility into AI confidence scores
- Wants risk assessments and compliance checks before approving AI-drafted SOWs

**Goals (mapped to SOW):**
1. Reduce time-to-staff (SOW Section 1.4, Objective 1)
2. Predictable delivery with clear accountability (SOW Section 1.4, Objective 2)
3. Audit-ready documentation (SOW Section 3.1.MVP.8)
4. Transparent pricing with no hidden fees (SOW Section 3.1.MVP.6)
5. Reduce vendor management overhead

**SOW Features She Uses:**
- SOW intake mode selection: AI Parameter Wizard OR manual upload — Section 3.1.MVP.1
- AI Parameter Wizard: template-based SOW generation from approved clause libraries — Section 3.1.MVP.1
- AI Draft Review: confidence scores, hallucination controls, risk assessment — Section 3.1.MVP.1
- SOW ingestion via manual upload (DOC/PDF + NLP/OCR enhancement) — Section 3.1.MVP.1
- Multi-stage SOW approval (Business → Legal → Security → Final) — Section 3.1.MVP.1
- Task decomposition review and approval — Section 3.1.MVP.2
- Team formation with human confirmation — Section 3.1.MVP.4
- Evidence pack review and acceptance decision — Section 3.1.MVP.5
- Rate card pricing and billing exports — Section 3.1.MVP.6
- Project/task/team monitoring views — Section 3.1.6
- Workforce insights dashboards — Section 19.1
- Governance configuration — Section 19.1

**Technology Expectations:**
- SSO login (SAML/OIDC) — will not create separate credentials
- Export capabilities (CSV, PDF) for everything
- Enterprise-grade data density in dashboards
- Integration with existing procurement systems

---

### Persona 2: Fatima Al-Hassan — Women Workforce Contributor

**Derived from SOW segment:** Women workforce contributors (Section 2.3), Women Workforce Contributor Track (Section 20.2)

**Demographics:**
- Age: 32
- Location: Karachi, Pakistan
- Education: B.Sc. Computer Science (graduated 8 years ago)
- Marital Status: Married, 2 children (ages 3 and 6)
- Work Status: Left corporate IT 5 years ago; occasional freelance data entry
- Device: Android smartphone (mid-range), shared family laptop
- Connectivity: 4G mobile data (inconsistent), home WiFi (moderate)
- Languages: Urdu (primary), English (professional reading/writing)

**IT Skills:**
- Frontend development (HTML/CSS/JS — somewhat dated)
- Data entry and processing
- QA testing (manual)
- Documentation and technical writing
- Basic Python scripting

**Psychographic Profile:**
- Trust deficit: has been scammed by work-from-home platforms before
- Privacy-conscious: cannot have public online profile due to family/cultural context
- Time-constrained: 3-4 hours/day in fragments
- Financial motivation: supplemental income ($200-300/month would be significant)
- Needs human support initially, not just AI chatbots

**Goals (mapped to SOW):**
1. Register and get onboarded through accessible flows — Section 3.1.MVP.3
2. Discover tasks matching her skills — Section 19.2 (task discovery)
3. Execute tasks with clear instructions via workroom — Section 3.1.MVP.5
4. Receive fair pay for accepted outcomes — Section 3.1.MVP.6
5. Build verified skills through delivery — Section 19.2 (credential wallet)

**SOW Features She Uses:**
- Contributor registration (external via invite) — Section 3.1.MVP.3
- Profile + skills self-declaration + evidence attachments — Section 3.1.MVP.3
- Consent capture — Section 3.1.MVP.3
- Task discovery, assignment, workroom, submission — Section 3.1.5
- Earnings and payout view, credential wallet — Section 3.1.5
- Contributor Support Assistant (guided help inside workroom) — Section 3.1.MVP.7
- Flexible scheduling, remote-first task models, accessible UX — Section 20.2
- Mentorship, community support, upskilling pathways — Section 20.2
- Payment/financial inclusion mechanisms tailored to local contexts — Section 20.2
- Support channels and grievance redressal — Section 20.3
- Safe-work and anti-harassment governance — Section 20.3

**SOW-specified accommodations for this track:**
- Localization framework for multiple languages — Section 3.1.5
- WCAG-aligned accessibility — Section 3.1.5
- Mobile-responsive web UX — Section 3.1.5
- Inclusive design practices — Section 20.3

---

### Persona 3: Arjun Mehta — Student Contributor

**Derived from SOW segment:** Student contributors (Section 2.3), Student Contributor Track (Section 20.1)

**Demographics:**
- Age: 20
- Location: Bangalore, India
- Education: 3rd year B.Tech Computer Science at mid-tier engineering college
- Work Status: No formal work experience; hackathon projects
- Device: Android smartphone + personal laptop
- Connectivity: College WiFi + mobile data
- Languages: English (primary for tech), Hindi, Kannada

**IT Skills:**
- Full-stack web development (React, Node.js)
- Basic ML/data science (course projects)
- Git, CI/CD basics
- Quick learner for new frameworks

**Psychographic Profile:**
- Career-focused: filters every action through "will this help me get a job?"
- Wants real-world project experience, not training simulations
- Values verifiable credentials over generic certificates
- Time-aware: has college commitments (exams, labs)
- Income is secondary to credential/skill building

**Goals (mapped to SOW):**
1. Onboard through institutional model with university — Section 20.1
2. Execute real enterprise tasks — Section 3.1.MVP.5
3. Build outcome-based credentials — Section 19.2 (credential wallet)
4. Earn income from accepted outcomes — Section 20.1
5. Academic recognition mapping — Section 20.1

**SOW Features He Uses:**
- Contributor registration (institutional onboarding with university partners) — Section 20.1
- Profile + skills self-declaration — Section 3.1.MVP.3
- Task discovery with guardrails and supervision models for students — Section 20.1
- Workroom, submission, review — Section 3.1.MVP.5
- Assignment workflow (accept/decline) with SLA timers — Section 3.1.MVP.4
- Earnings and payout view, credential wallet — Section 3.1.5
- Digital twin v1 (skills list + activity metrics + reliability counters) — Section 3.1.MVP.3

---

### Persona 4: Rajesh Kumar — Mentor & Reviewer

**Derived from SOW segment:** Mentors, reviewers, and governance officers (Section 2.3)

**Demographics:**
- Age: 42
- Location: Pune, India
- Role: Senior Software Architect at an IT services company (15+ years experience)
- Device: Work laptop + smartphone
- Availability: 5-8 hours/week for mentoring/review

**Professional Context:**
- Deep expertise in backend systems, cloud architecture, code quality
- Interested in mentoring the next generation
- Values structured review processes
- Expects professional-grade tools, not consumer UX

**Goals (mapped to SOW):**
1. Efficiently review submitted work from queue — Section 19.3
2. Provide structured feedback using rubrics — Section 3.1.MVP.5
3. See contributor progress and learning signals — Section 3.1.5
4. Manage review capacity and SLAs — Section 3.1.MVP.4

**SOW Features He Uses:**
- Queues for assigned reviews and mentorship sessions — Section 3.1.5
- Review forms, rubrics, guided feedback flows — Section 3.1.5
- Acceptance decision with reasons; rework loop with versioning — Section 3.1.MVP.5
- Review rubrics/templates (configurable) — Section 3.1.MVP.5
- Review Assistant (rubric suggestions + summarization) — Section 3.1.MVP.7
- Visibility into contributor progress and learning signals — Section 3.1.5

---

## PART 3: THE 4 FRONTEND UI MODULES (from SOW Section 19)

The SOW defines exactly 4 frontend UI modules. This section maps each module to its SOW-defined capabilities.

### Module 1: Enterprise Admin Console (Section 19.1 + 3.1.6)

**Users:** Enterprise business owners, project sponsors, HR/Talent/L&D teams, procurement/finance controllers, enterprise PMO

**SOW-defined capabilities:**

From Section 19.1:
- SOW intake and project portfolio views
- Workforce insights dashboards (skills, capacity, performance)
- Governance configuration (policies, workflows, SLAs)

From Section 3.1.6 (3 sub-consoles):

**Admin and Configuration:**
- Tenant setup, role management, access control
- Configuration of policies (SLA templates, pricing rules, governance thresholds)
- Integration configuration (HRIS, ERP, LMS, identity)

**Operations and Delivery:**
- Project, task, team monitoring for enterprise PMO and operations
- Exception management (escalations, reassignments, risk flags)
- Real-time and historical views on throughput, quality, bottlenecks

**Analytics and Intelligence:**
- Workforce intelligence dashboards (skills inventory, gaps, learning needs)
- Economic dashboards (spend, savings, ROI, earning distribution)
- Export and self-service analytics (filters, drilldowns)

From Section 3.1.MVP.1:
- SOW intake mode selection: AI Parameter Wizard OR manual upload
- AI Parameter Wizard: template-based SOW generation from approved clause libraries
- AI Draft Review: confidence scores, hallucination controls, risk assessment
- Manual SOW upload (DOC/PDF) enhanced with NLP/OCR extraction
- Multi-stage SOW approval (Business → Legal → Security → Final)
- Configurable SOW intake forms (per client template)
- SOW repository + search + export

From Section 3.1.MVP.2:
- Planner UI (PMO/Admin) for task decomposition review
- Exportable plan (CSV/PDF)

From Section 3.1.MVP.3:
- Admin: contributor management + role assignment

From Section 3.1.MVP.4:
- Admin override for assignments
- Matching API with explainable "why matched" fields

From Section 3.1.MVP.6:
- Rate cards configured by admin
- Export reports for billing and payouts (CSV + API)

### Module 2: Contributor Portal (Section 19.2 + 3.1.5 + 20)

**Users:** ALL contributor types — students, women workforce, freelancers, internal employees

**SOW-defined capabilities:**

From Section 19.2:
- Profile and digital twin view
- Task discovery, assignment, and submission flows
- Learning recommendations and credential wallet

From Section 3.1.5:
- Registration, identity verification, onboarding workflows
- Profile management (skills, preferences, availability, time zones)
- Task discovery, assignment, workroom, submission flows
- Earnings and payout view, credential wallet, history of contributions

From Section 3.1.MVP.3:
- Contributor registration (internal via HRIS sync OR manual import; external via invite)
- Profile + skills self-declaration + evidence attachments (links/docs)
- Consent capture and role assignment
- Digital twin v1: skills list + activity metrics + basic reliability counters

From Section 3.1.MVP.4:
- Assignment workflow (accept/decline), reassignments, SLA timers

From Section 3.1.MVP.5:
- Task workroom: instructions, templates, uploads, links, Q&A
- Submission: file upload + structured responses + evidence checklist

From Section 3.1.MVP.7:
- Contributor Support Assistant (guided help inside workroom)

**Segment-specific features within the portal:**

From Section 20.1 (Student Contributor Track):
- Institutional onboarding model with university partners
- Project types, guardrails, and supervision models for students
- Outcome-based payments and academic recognition mapping

From Section 20.2 (Women Workforce Contributor Track):
- Flexible scheduling, remote-first task models, accessible UX
- Mentorship, community support, upskilling pathways
- Payment and financial inclusion mechanisms tailored to local contexts

From Section 20.3 (Safeguards and Support):
- Inclusive design and accessibility practices
- Support channels and grievance redressal mechanisms
- Safe-work and anti-harassment governance

From Section 3.1.5 (Cross-cutting):
- Mobile-responsive web UX as baseline
- WCAG-aligned accessibility
- Localization framework for multiple languages

### Module 3: Mentor & Reviewer Workspace (Section 19.3 + 3.1.5)

**Users:** Mentors, reviewers, governance officers

**SOW-defined capabilities:**

From Section 19.3:
- Queue of review tasks, rubrics, and scoring
- Feedback tools and coaching recommendations

From Section 3.1.5:
- Queues for assigned reviews and mentorship sessions
- Review forms, rubrics, guided feedback flows
- Visibility into contributor progress and learning signals

From Section 3.1.MVP.5:
- Review workflow: single-stage and two-stage (mentor/reviewer + client)
- Acceptance decision with reasons; rework loop with versioning
- Review rubrics/templates (configurable)

From Section 3.1.MVP.7:
- Review Assistant (rubric suggestions + summarization)

### Module 4: Analytics & Workforce Intelligence Dashboards (Section 19.4)

**Users:** HR, Talent, PMO, Finance stakeholders (cross-cutting)

**SOW-defined capabilities:**

From Section 19.4:
- Skill heatmaps, utilization, and gap analysis
- Economic performance dashboards (earnings, rates, margins)
- Governance and risk dashboards (incidents, fraud flags, overrides)

From Section 3.1.6:
- Export and self-service analytics (filters, drilldowns)

---

## PART 4: USER JOURNEY MAPS

### Journey 1: Enterprise User — SOW Upload to First Accepted Deliverable

This maps the end-to-end workflow from Section 4.1.

| Stage | SOW Reference | Actions | Key SOW Capabilities Used |
|-------|--------------|---------|--------------------------|
| **Login** | 3.1.MVP.8 | Enterprise user logs in via SSO (SAML/OIDC) | SSO integration, RBAC |
| **Select SOW Intake Mode** | 3.1.MVP.1 | Chooses between AI Parameter Wizard (Path A) or Manual Upload (Path B) | Intake Mode Selector |
| **Path A: AI Parameter Wizard** | 3.1.MVP.1 | Generates SOW from approved templates and clause libraries via guided wizard | AI Parameter Wizard, template library, clause library |
| **Path A: AI Draft Review** | 3.1.MVP.1 | Reviews AI-generated SOW draft with confidence scores, hallucination controls, risk assessment | AI confidence scores, hallucination prevention, risk scoring |
| **Path B: Manual SOW Upload** | 3.1.MVP.1 | Uploads existing SOW document (DOC/PDF); enhanced with NLP/OCR extraction | SOW ingestion via UI and API, NLP/OCR enhancement |
| **AI Extraction** | 3.1.MVP.1, 3.1.MVP.7 | SOW Intake Assistant extracts metadata, tags clauses (both paths converge here) | Metadata extraction, clause tagging, SOW Intake Assistant |
| **Human Validation** | 3.1.MVP.1 | Enterprise user reviews and validates extracted data; verifies AI-generated content accuracy | Clause tagging with human validation, confidence score review |
| **Multi-Stage Approval** | 3.1.MVP.1 | SOW passes through Business → Legal → Security → Final approval gates | Multi-stage approval workflow, role-based sign-off |
| **SOW Versioning** | 3.1.MVP.1 | SOW moves from draft to approved | SOW versioning (draft/approved), audit history |
| **Decomposition** | 3.1.MVP.2 | AI suggests task plan: milestones, tasks, subtasks, skills tags | Semi-automated decomposition, Decomposition Assistant |
| **Plan Review** | 3.1.MVP.2 | Enterprise user reviews, adjusts, approves plan | Human approval gates, Planner UI |
| **Team Formation** | 3.1.MVP.4 | Matching engine recommends team; enterprise confirms | Ranked recommendations, explainable "why matched", human confirmation |
| **Execution** | 3.1.MVP.5 | Contributors work in task workrooms, submit deliverables | Task workroom, submission, evidence checklist |
| **Review** | 3.1.MVP.5 | Mentor/reviewer evaluates; single or two-stage review | Review workflow, rubrics, acceptance decision |
| **Acceptance** | 3.1.MVP.5 | Enterprise accepts or requests rework | Acceptance with reasons, rework loop with versioning |
| **Payment** | 3.1.MVP.6 | Payout eligibility triggered; billing reports exported | Rate card pricing, payout eligibility on acceptance, CSV/API export |
| **Monitoring** | 3.1.6 | Enterprise monitors project via operations console | Real-time/historical views, exception management |

**Critical Moments (derived from SOW capabilities):**
1. SOW intake mode selection — user must clearly understand trade-offs between AI-generated vs. manual upload paths
2. AI Draft Review trust — confidence scores and hallucination controls must be transparent and actionable; if AI-generated content feels opaque, trust breaks immediately
3. SOW extraction accuracy — if metadata extraction is wrong, trust breaks (both paths)
4. Multi-stage approval flow — each approver (Business, Legal, Security) must see relevant context without bottleneck delays
5. Task plan quality — decomposition must make domain sense
6. Team match explainability — enterprise must understand "why matched"
7. Evidence pack completeness — acceptance logs + evidence pack export must satisfy audit needs
8. Export format — billing exports must integrate with enterprise procurement

---

### Journey 2: Contributor (Women Workforce Track) — Registration to First Accepted Task

| Stage | SOW Reference | Actions | Key SOW Capabilities Used |
|-------|--------------|---------|--------------------------|
| **Registration** | 3.1.MVP.3 | Registers as external contributor (via invite) | External registration via invite |
| **Profile Setup** | 3.1.MVP.3 | Creates profile: skills self-declaration, evidence attachments | Profile + skills self-declaration + evidence |
| **Consent** | 3.1.MVP.3 | Completes consent capture | Consent capture and role assignment |
| **Onboarding** | 3.1.5 | Identity verification, onboarding workflows | Registration, identity verification, onboarding |
| **Profile Config** | 3.1.5 | Sets skills, preferences, availability, time zones | Profile management |
| **Task Discovery** | 19.2 | Browses available tasks matching skills | Task discovery |
| **Assignment** | 3.1.MVP.4 | Accepts task assignment | Assignment workflow (accept/decline), SLA timers |
| **Workroom** | 3.1.MVP.5 | Works on task: reads instructions, uses templates, uploads files | Task workroom: instructions, templates, uploads, links, Q&A |
| **AI Help** | 3.1.MVP.7 | Uses Contributor Support Assistant for guidance | Contributor Support Assistant (guided help) |
| **Submission** | 3.1.MVP.5 | Submits deliverable with evidence checklist | File upload + structured responses + evidence checklist |
| **Review** | 3.1.MVP.5 | Waits for mentor/reviewer decision | Review workflow |
| **Outcome: Accept** | 3.1.MVP.5, 3.1.MVP.6 | Work accepted; payout eligibility triggered | Acceptance, payout eligibility on acceptance |
| **Outcome: Rework** | 3.1.MVP.5 | Receives feedback; revises and resubmits | Rework loop with versioning |
| **Earnings** | 3.1.5 | Views earnings and payout status | Earnings and payout view |
| **Credentials** | 19.2 | Credential added to wallet | Credential wallet |

**Women Workforce Track specifics from Section 20.2:**
- Flexible scheduling, remote-first task models
- Accessible UX
- Mentorship, community support, upskilling pathways
- Payment/financial inclusion for local contexts

**Safeguards from Section 20.3:**
- Inclusive design and accessibility
- Support channels and grievance redressal
- Safe-work and anti-harassment governance

---

### Journey 3: Contributor (Student Track) — University Onboarding to Credential

| Stage | SOW Reference | Actions | Key SOW Capabilities Used |
|-------|--------------|---------|--------------------------|
| **University Onboarding** | 20.1 | Onboards through institutional model with university partner | Institutional onboarding model |
| **Registration** | 3.1.MVP.3 | Contributor registration (could be via HRIS sync from university or invite) | Registration, identity verification |
| **Profile + Skills** | 3.1.MVP.3 | Skills self-declaration, evidence attachments | Profile + skills + evidence |
| **Consent** | 3.1.MVP.3 | Consent capture | Consent capture |
| **Task Discovery** | 19.2, 20.1 | Discovers tasks with student-appropriate guardrails and supervision | Task discovery, project types/guardrails for students |
| **Assignment** | 3.1.MVP.4 | Accepts task | Assignment workflow |
| **Execution** | 3.1.MVP.5 | Works in task workroom | Workroom, templates, uploads |
| **Submission** | 3.1.MVP.5 | Submits with evidence | Evidence checklist |
| **Review** | 3.1.MVP.5 | Mentor reviews with supervision model | Review workflow, rubrics |
| **Acceptance** | 3.1.MVP.5 | Work accepted | Acceptance with audit trail |
| **Payment** | 20.1 | Outcome-based payment | Outcome-based payments |
| **Credential** | 19.2, 20.1 | Credential in wallet; academic recognition mapping | Credential wallet, academic recognition |
| **Digital Twin Update** | 3.1.MVP.3 | Skills list, activity metrics, reliability counters updated | Digital twin v1 |

**Student Track specifics from Section 20.1:**
- Institutional onboarding with university partners
- Project types, guardrails, and supervision models for students
- Outcome-based payments
- Academic recognition mapping where applicable

---

### Journey 4: Mentor/Reviewer — Review Queue to Decision

| Stage | SOW Reference | Actions | Key SOW Capabilities Used |
|-------|--------------|---------|--------------------------|
| **Login** | 3.1.MVP.8 | Logs in to Mentor & Reviewer Workspace | SSO/RBAC |
| **Queue** | 19.3 | Views queue of assigned reviews and mentorship sessions | Review queues |
| **Select Task** | 19.3 | Picks review item from queue | Queue of review tasks |
| **Review Context** | 3.1.5 | Views contributor progress and learning signals | Visibility into contributor progress |
| **Evidence Review** | 3.1.MVP.5 | Reviews submitted work artifacts | Task workroom submissions |
| **AI Assist** | 3.1.MVP.7 | Review Assistant suggests rubric scores and summarizes submission | Review Assistant |
| **Rubric Scoring** | 19.3, 3.1.MVP.5 | Scores against rubric, writes feedback | Rubrics, scoring, feedback tools |
| **Decision** | 3.1.MVP.5 | Approves, requests rework (with reasons), or rejects | Acceptance decision with reasons, rework loop |
| **Audit** | 3.1.MVP.8 | Decision logged immutably | Immutable audit logging |
| **Next** | 19.3 | Moves to next item in queue | Queue management |

---

## PART 5: DESIGN PRINCIPLES (Derived from SOW)

Each principle below cites the SOW section it derives from.

### Principle 1: Evidence-Based, Not Promise-Based
**Source:** Section 2.4 — "replaces resume-based hiring and bid-based freelancing with evidence-based delivery"
- Every claim backed by verifiable proof (credentials, evidence packs)
- Transparent pricing: rate card x effort, visible breakdowns
- Acceptance logs + evidence pack export for audit

### Principle 2: Human-in-the-Loop for High-Impact Decisions
**Source:** Section 3.1.MVP.7 — "human approvals mandatory for: acceptance, payouts, sanctions, policy overrides"
- AI assists but humans decide on acceptance, payments, sanctions
- All AI outputs include reasoning summaries (Section 7.5)
- Override controls at platform and project levels (Section 7.3)

### Principle 3: AI Transparency
**Source:** Section 3.1.MVP.1 (AI Parameter Wizard, AI Draft Review), Section 7.5 (AI reasoning summaries), Section 7.3 (override controls)
- All AI-generated content must be clearly labeled and visually distinguished from human-authored content
- Confidence scores must be visible for every AI output (clause generation, metadata extraction, risk assessment)
- Hallucination prevention controls must be accessible: users can flag, edit, or reject AI-generated content at any point
- Risk assessments and compliance checks must accompany AI-drafted SOWs before approval
- Human override is always available — AI suggests, humans decide
- AI reasoning summaries must explain why specific content was generated (Section 7.5)

### Principle 4: Governed by Design
**Source:** Sections 14, 7.3 — governance framework and guardrails
- Immutable audit logging for all critical actions (Section 3.1.MVP.8)
- Plagiarism detection, fraud detection, identity verification (Section 14.2)
- Configurable stage gates, SLA templates, escalation rules (Section 4.3)
- Code of conduct, anti-harassment policy (Section 14.3)

### Principle 5: Inclusive and Accessible
**Source:** Sections 3.1.5, 20.2, 20.3
- WCAG-aligned accessibility for core journeys (Section 1.4.1)
- Localization framework for multiple languages (Section 3.1.5)
- Mobile-responsive web UX as baseline (Section 3.1.5)
- Inclusive design practices in UI (Section 20.3)
- Flexible scheduling, remote-first task models (Section 20.2)

### Principle 6: Segment-Aware, Single Portal
**Source:** Sections 19.2, 20.1, 20.2, 3.1.4
- ONE Contributor Portal with role-based and segment-based views (Section 3.1.4)
- Student track: institutional onboarding, guardrails, supervision (Section 20.1)
- Women track: flexible scheduling, accessible UX, financial inclusion (Section 20.2)
- Same core features (task discovery, workroom, submission, credentials) for all contributors

### Principle 7: Enterprise-Grade Infrastructure
**Source:** Sections 15, 3.1.MVP.8
- Zero trust security posture (Section 5.1)
- Tenant isolation, encryption, RBAC (Section 15.2)
- SSO via SAML/OIDC, MFA for privileged users (Section 15.2)
- Export everything: CSV, PDF, API (Sections 3.1.MVP.1, 3.1.MVP.2, 3.1.MVP.6)

### Principle 8: Outcome-Only Economics
**Source:** Sections 9.1, 3.1.MVP.6
- Payment only for accepted outcomes (Section 9.1)
- Rate card x effort pricing, not bidding (Section 3.1.MVP.6)
- Escrow-like: funds reserved on assignment, released on acceptance (Section 9.4)
- Payout eligibility triggered only upon acceptance (Section 3.1.MVP.6)

---

## PART 6: INFORMATION ARCHITECTURE

### Module 1: Enterprise Admin Console

```
Enterprise Admin Console
|
|-- SOW Management
|   |-- Intake Mode Selector (AI Parameter Wizard / Manual Upload) [3.1.MVP.1]
|   |-- AI Parameter Wizard [3.1.MVP.1]
|   |   |-- Template Selection (approved SOW templates)
|   |   |-- Clause Library (approved clause catalog)
|   |   |-- Parameter Configuration (guided wizard)
|   |   |-- AI Draft Generation
|   |-- AI Draft Review [3.1.MVP.1]
|   |   |-- Confidence Scores Display
|   |   |-- Hallucination Controls (flag/edit AI-generated content)
|   |   |-- Risk Score & Assessment
|   |-- Manual Upload (DOC/PDF + NLP/OCR enhancement) [3.1.MVP.1]
|   |-- Multi-Stage Approval [3.1.MVP.1]
|   |   |-- Business Approval
|   |   |-- Legal Approval
|   |   |-- Security Approval
|   |   |-- Final Sign-off
|   |-- SOW Repository (search + filter + export) [3.1.MVP.1]
|   |-- SOW Detail (metadata, clauses, versions, audit history) [3.1.MVP.1]
|
|-- Task Planning
|   |-- Task Decomposition View (milestones, tasks, subtasks, skills tags) [3.1.MVP.2]
|   |-- Plan Approval (human approval gates) [3.1.MVP.2]
|   |-- Plan Export (CSV/PDF) [3.1.MVP.2]
|
|-- Team Formation
|   |-- Matching Results (ranked recommendations + "why matched") [3.1.MVP.4]
|   |-- Team Confirmation (human confirmation) [3.1.MVP.4]
|   |-- Assignment Override (admin override) [3.1.MVP.4]
|
|-- Project Monitoring [3.1.6 Operations Console]
|   |-- Project List (active, completed, on-hold)
|   |-- Project Detail (tasks, team, progress, SLA status)
|   |-- Exception Management (escalations, reassignments, risk flags)
|   |-- Real-time and Historical Views (throughput, quality, bottlenecks)
|
|-- Review & Acceptance
|   |-- Deliverable Review (evidence pack) [3.1.MVP.5]
|   |-- Acceptance Decision (accept/rework with reasons) [3.1.MVP.5]
|   |-- Acceptance Logs + Evidence Pack Export [3.1.MVP.5]
|
|-- Commercial & Billing [3.1.MVP.6]
|   |-- Rate Card Configuration
|   |-- Task Pricing View
|   |-- Payout Eligibility Status
|   |-- Billing/Payout Export (CSV + API)
|
|-- Admin & Configuration [3.1.6 Admin Console]
|   |-- Tenant Setup
|   |-- Role Management & Access Control
|   |-- Policy Configuration (SLAs, pricing rules, governance thresholds)
|   |-- Integration Configuration (HRIS, ERP, LMS, identity)
|   |-- Contributor Management + Role Assignment [3.1.MVP.3]
|
|-- Analytics & Intelligence [3.1.6 Analytics Console, 19.4]
|   |-- Workforce Intelligence Dashboards (skills inventory, gaps, learning needs)
|   |-- Economic Dashboards (spend, savings, ROI, earning distribution)
|   |-- Skill Heatmaps, Utilization, Gap Analysis
|   |-- Governance & Risk Dashboards (incidents, fraud flags, overrides)
|   |-- Self-service Analytics (filters, drilldowns, export)
```

### Module 2: Contributor Portal

```
Contributor Portal
|
|-- Registration & Onboarding [3.1.MVP.3, 3.1.5]
|   |-- Registration (internal via HRIS sync OR external via invite)
|   |-- Identity Verification
|   |-- Consent Capture
|   |-- Profile Setup (skills self-declaration, evidence attachments)
|   |-- Availability & Timezone Configuration
|   |-- [Student Track] Institutional Onboarding with University [20.1]
|   |-- [Women Track] Flexible Scheduling Setup [20.2]
|
|-- Dashboard / Home
|   |-- Active Tasks Summary
|   |-- Earnings Summary
|   |-- Digital Twin Summary (skills, activity metrics, reliability) [3.1.MVP.3]
|
|-- Profile & Digital Twin [19.2, 3.1.MVP.3]
|   |-- Profile View/Edit (skills, preferences, availability, timezone)
|   |-- Skills Self-declaration + Evidence
|   |-- Digital Twin v1 (skills list + activity metrics + reliability counters)
|
|-- Task Discovery & Assignment [19.2, 3.1.MVP.4]
|   |-- Browse Available Tasks
|   |-- Task Detail (requirements, skills needed, effort estimate, pricing)
|   |-- Accept/Decline Assignment
|   |-- SLA Timer Display
|   |-- [Student Track] Tasks with Guardrails & Supervision [20.1]
|
|-- Task Workroom [3.1.MVP.5]
|   |-- Instructions & Templates
|   |-- File Upload Area
|   |-- Links & References
|   |-- Q&A / Contributor Support Assistant [3.1.MVP.7]
|   |-- Evidence Checklist
|   |-- Submit Button
|
|-- Submissions & Review Status [3.1.MVP.5]
|   |-- Submission History
|   |-- Review Status (pending, accepted, rework)
|   |-- Feedback from Reviewer
|   |-- Rework Loop (versioned resubmissions)
|
|-- Earnings & Payouts [3.1.5, 3.1.MVP.6]
|   |-- Earnings View
|   |-- Payout Status
|   |-- Payout History
|   |-- [Women Track] Financial Inclusion / Local Payout Methods [20.2]
|
|-- Credential Wallet [19.2]
|   |-- Credentials List
|   |-- Credential Detail
|   |-- [Student Track] Academic Recognition Mapping [20.1]
|
|-- Learning Recommendations [19.2]
|   |-- Recommended Next Tasks/Skills
|   |-- [Women Track] Upskilling Pathways [20.2]
|
|-- Support [20.3]
|   |-- Support Channels
|   |-- Grievance Redressal
|   |-- [Women Track] Mentorship & Community Support [20.2]
|
|-- Settings
|   |-- Profile Settings
|   |-- Notification Preferences
|   |-- Language/Locale [3.1.5]
```

### Module 3: Mentor & Reviewer Workspace

```
Mentor & Reviewer Workspace
|
|-- Review Queue [19.3, 3.1.5]
|   |-- Assigned Reviews List (with SLA indicators)
|   |-- Mentorship Sessions Queue
|   |-- Filter/Sort (by priority, SLA, skill area)
|
|-- Review Detail [3.1.MVP.5]
|   |-- Task Context (instructions, requirements, skills)
|   |-- Submitted Artifacts (files, responses, evidence checklist)
|   |-- Contributor Progress & Learning Signals [3.1.5]
|   |-- Review Assistant Suggestions [3.1.MVP.7]
|   |-- Rubric Scoring Form [19.3]
|   |-- Feedback / Coaching Input [19.3]
|   |-- Decision: Accept / Rework (with reasons) / Reject
|
|-- Review History
|   |-- Completed Reviews
|   |-- Decision Audit Trail [3.1.MVP.8]
|
|-- Settings
|   |-- Review Preferences
|   |-- Notification Preferences
```

### Module 4: Analytics & Workforce Intelligence Dashboards

```
Analytics Dashboards [19.4]
|
|-- Skill Heatmaps & Utilization
|-- Gap Analysis
|-- Economic Performance (earnings, rates, margins)
|-- Governance & Risk (incidents, fraud flags, overrides)
|-- Export & Self-service Analytics (filters, drilldowns)
```

---

## PART 7: RESEARCH QUESTIONS

Organized by the SOW's key capability areas.

### SOW Intake & Decomposition (Section 3.1.MVP.1-2)
1. What SOW formats do enterprises commonly upload? (DOC, PDF, structured form usage ratio)
2. How accurate must AI metadata extraction be before enterprises trust it?
3. Do enterprise users prefer to edit AI-generated task plans or rebuild from scratch?
4. What export formats for task plans are most useful for enterprise PMO? (CSV, PDF, Jira export)
4a. [V2.0] What proportion of enterprises will prefer AI Parameter Wizard vs. manual upload? What factors drive the choice?
4b. [V2.0] What confidence score threshold makes enterprise users comfortable approving AI-generated SOW content?
4c. [V2.0] How should hallucination flags be presented — inline annotations, summary panel, or both?
4d. [V2.0] What is the optimal multi-stage approval flow? Do all four stages (Business → Legal → Security → Final) apply to every SOW, or should stages be configurable per template?

### Contributor Onboarding (Section 3.1.MVP.3, 20.1, 20.2)
5. What is the minimum registration flow that achieves consent capture without abandonment?
6. How do women workforce contributors prefer to receive the initial platform invite?
7. What does "institutional onboarding with university partners" look like in practice? (SSO? bulk import? faculty-initiated?)
8. How many profile fields are required vs optional at registration for each contributor segment?
9. Does skills self-declaration with evidence produce better matching than self-declaration alone?

### Task Discovery & Assignment (Section 3.1.MVP.4)
10. What task card information is essential for contributors to decide accept/decline?
11. Do contributors prefer to browse all tasks or receive curated recommendations?
12. How should SLA timers be presented to avoid stress while maintaining accountability?
13. What does the "why matched" explainability field need to show?

### Workroom & Submission (Section 3.1.MVP.5)
14. How detailed should workroom instructions be for each work type variant?
15. Does the Contributor Support Assistant reduce support ticket volume?
16. What is the optimal evidence checklist design? (Structured checkboxes vs. freeform)
17. How many rework cycles before contributors disengage?

### Review & Acceptance (Section 3.1.MVP.5, 19.3)
18. How fast must review feedback arrive to maintain contributor engagement?
19. Do mentors prefer queue-based (one at a time) or batch-based review?
20. What information do mentors need alongside the submission to make a quality decision?
21. How should the Review Assistant present rubric suggestions without biasing the mentor?

### Pricing & Payouts (Section 3.1.MVP.6)
22. What payment timeline expectations do women workforce contributors have?
23. What local payout methods are required per geography (Section 20.2)?
24. How should rate card pricing transparency be displayed to contributors vs. enterprises?

### Security & Access (Section 3.1.MVP.8)
25. What is the SSO integration experience for first-time enterprise users?
26. How should RBAC be configured without overwhelming enterprise admins?
27. How should audit logs be presented for compliance review?

### Accessibility & Inclusivity (Sections 3.1.5, 20.2, 20.3)
28. What languages are required for localization at MVP? [SOW says "where required" — needs specification]
29. What is the target WCAG level? [SOW says "WCAG-aligned" — needs specification: A, AA, AAA]
30. What support channels do women workforce contributors prefer for grievance redressal?

---

## PART 8: UX RISK REGISTER

| # | Risk | SOW Source | Likelihood | Impact | Mitigation (from SOW capabilities) |
|---|------|-----------|-----------|--------|-------------------------------------|
| R1 | SOW AI extraction produces inaccurate results, breaking enterprise trust | 3.1.MVP.1 | MEDIUM | CRITICAL | Human validation step for clause tagging; SOW Intake Assistant operates in assistive mode |
| R1a | AI Parameter Wizard generates hallucinated or non-compliant SOW content | 3.1.MVP.1 | MEDIUM | CRITICAL | Confidence scores visible on all AI-generated content; hallucination controls (flag/edit/reject); multi-stage approval gates (Business → Legal → Security); risk assessment before final approval |
| R2 | Contributors abandon registration due to complex onboarding | 3.1.MVP.3 | MEDIUM | HIGH | Progressive profile setup; consent capture is lightweight |
| R3 | No matching tasks available for a contributor's skills | 3.1.MVP.4 | MEDIUM | HIGH | Skills self-declaration + evidence to widen matching; learning recommendations |
| R4 | Review SLA breaches causing contributor disengagement | 3.1.MVP.5 | MEDIUM | HIGH | SLA timers, reassignment rules, escalation workflows |
| R5 | Rework loops demoralize contributors | 3.1.MVP.5 | MEDIUM | MEDIUM | Rework with versioning; configurable rubrics for clear expectations |
| R6 | Payment delays erode trust | 3.1.MVP.6 | MEDIUM | CRITICAL | Payout eligibility triggered automatically on acceptance; transparent payment status |
| R7 | Women contributors feel unsafe on platform | 20.3 | LOW | CRITICAL | Anti-harassment governance; grievance redressal; support channels; safe-work policies |
| R8 | Enterprise refuses to onboard due to security gaps | 3.1.MVP.8 | LOW | CRITICAL | SSO + RBAC + tenant isolation + audit logs from MVP; Zero Trust alignment |
| R9 | Mentor queue overwhelm causes quality drop | 19.3 | MEDIUM | HIGH | Queue management; Review Assistant for rubric suggestions; configurable review templates |
| R10 | Localization/accessibility gaps exclude contributor segments | 3.1.5, 20.2 | MEDIUM | HIGH | Localization framework; WCAG-aligned practices; mobile-responsive baseline |

---

## PART 9: SUCCESS METRICS (from SOW Section 27.3 + 1.4)

### SOW-Defined KPIs (Section 27.3)

| Category | KPI | Source |
|----------|-----|--------|
| Operational | Task completion rate | 27.3 |
| Operational | Average time to assignment | 27.3 |
| Operational | SLA compliance rate | 27.3 |
| Workforce | Contributor engagement levels | 27.3 |
| Workforce | Skill development progress | 27.3 |
| Workforce | Diversity and inclusion participation metrics | 27.3 |
| Economic | Average cost per task | 27.3 |
| Economic | Platform transaction volume | 27.3 |
| Economic | Contributor earnings growth | 27.3 |
| Quality | Acceptance rate of submitted work | 27.3 |
| Quality | Rework percentages | 27.3 |
| Quality | Customer satisfaction scores | 27.3 |

### SOW-Defined Objectives (Section 1.4)

| Objective | Target |
|-----------|--------|
| Reduce time-to-staff and time-to-start | At least [X]% reduction |
| Improve delivery predictability / on-time completion | [Y]% improvement |
| Evidence-based reputation replacing CV-only assessment | Qualitative |
| Global scale participation | 1M+ contributors |

### MVP Acceptance Criteria (Section 25.3)

| Criterion | Pass/Fail |
|-----------|-----------|
| SOW ingestion produces structured output for agreed formats | Pass/Fail |
| Task state machine works end-to-end | Pass/Fail |
| Contributor onboarding + role assignment works (internal + external) | Pass/Fail |
| Matching returns ranked candidates with explainability | Pass/Fail |
| Submission/review/acceptance completes with evidence pack export | Pass/Fail |
| Rate card pricing + payout eligibility on acceptance | Pass/Fail |
| SSO works; RBAC blocks unauthorized actions | Pass/Fail |
| Audit logs searchable/exportable for all critical actions | Pass/Fail |
| Monitoring for uptime/error rates exists | Pass/Fail |
| Core journeys follow WCAG-aligned practices | Pass/Fail |
| API docs published in OpenAPI; OAuth2/OIDC auth | Pass/Fail |

---

## PART 10: MVP vs PHASE 2 BOUNDARY (Section 3.1.X, 3.2)

This table determines what UX must be designed for Phase 1 vs deferred.

| Capability | Phase 1 (MVP) | Phase 2+ |
|-----------|---------------|----------|
| SOW Intake | Dual-mode intake (AI Parameter Wizard + manual upload), AI draft review with confidence scores & hallucination controls, NLP/OCR enhancement, multi-stage approval (Business → Legal → Security → Final), metadata extraction, clause tagging, versioning | - |
| Decomposition | Semi-automated with human approval gates | - |
| Matching | Skills + availability + basic quality signals; explainability fields | Advanced graph-based matching |
| Pricing | Configurable rate cards; rate card x effort | Dynamic market pricing, surge pricing, predictive optimization |
| AI Agents | 4 assistive agents (SOW Intake, Decomposition, Contributor Support, Review) | Full 8 agents including autonomous APG, Payment, PoDL agents |
| Review | Single-stage and two-stage; rework loop with versioning | - |
| APG | Assistive mode only; human approval required | Full autonomous orchestration, automated sanctions |
| PoDL | Basic acceptance logs + evidence pack export | Cryptographic credentialing, verifiable credentials, external wallet |
| Fraud | Basic identity verification | Behavioral anomaly models, anti-collusion, advanced KYC/KYB |
| Payouts | Payout eligibility ledger + CSV/API export | Multi-provider payout rails, complex tax engines |
| Integrations | SSO/IdP + basic HRIS sync + webhooks for project tools | Deep ERP, complex invoicing, SCIM at scale |
| Scale | Single region, pilot load | Multi-region, 1M+ contributors |
| Contributor Portal | Full: registration, profile, task discovery, workroom, submission, earnings, credentials | Enhanced with advanced features |
| Enterprise Console | Full: dual-mode SOW intake (AI Wizard + manual), AI draft review, multi-stage approval, monitoring, admin, analytics | Enhanced integrations |
| Mentor Workspace | Full: queues, rubrics, scoring, feedback | Enhanced with advanced tooling |

---

## APPENDIX A: GLOSSARY (from SOW Section 1.5 + throughout)

| Term | Definition | SOW Source |
|------|-----------|-----------|
| Agentic AI | Autonomous/semi-autonomous AI agents under governance rules | 1.5 |
| AI Parameter Wizard | Guided SOW generation tool using approved templates and clause libraries; produces AI draft with confidence scores | 3.1.MVP.1 |
| AI Draft Review | Review interface for AI-generated SOW content with hallucination controls, confidence scores, and risk assessment | 3.1.MVP.1 |
| APG | Autonomous Project Governor — orchestration engine for task execution, SLAs, escalations | 1.5 |
| Contributor | Any individual or AI agent performing tasks (employees, freelancers, students, women workforce, mentors, reviewers) | 1.5 |
| Digital Twin | Structured digital representation: verified skills, performance, learning signals, behavioral attributes | 1.5 |
| Confidence Score | Numerical indicator (0-100%) of AI certainty for generated content; visible on all AI outputs | 3.1.MVP.1 |
| GWOS | Global Workforce Operating System — platform control plane | 1.5 |
| Intake Mode Selector | Entry point for SOW management: choose AI Parameter Wizard (Path A) or Manual Upload (Path B) | 3.1.MVP.1 |
| Multi-Stage Approval | SOW approval workflow: Business → Legal → Security → Final sign-off gates | 3.1.MVP.1 |
| PoDL / Proof-of-Delivery | Verifiable record of completion and acceptance, linked to reputation and credentials | 1.5 |
| Skill Genome | Skills taxonomies, adjacencies, proficiencies across human and AI agents | 5.3 |
| SOW | Statement of Work — enterprise document defining project scope | Throughout |
| Talent Intelligence Graph | Graph-based data structure: contributors, skills, projects, organizations, credentials | 1.5 |
| Task | Discrete unit of work from SOW or project decomposition | 1.5 |
| Workroom | Interface where contributors execute tasks (instructions, templates, uploads, Q&A) | 3.1.MVP.5 |
| Evidence Pack | Submitted artifacts + evidence checklist demonstrating task completion | 3.1.MVP.5 |
| Rate Card | Pricing table: role x skill x level x region = price | 3.1.MVP.6 |
| Rework Loop | Cycle where submission is returned with reasons for revision and resubmission | 3.1.MVP.5 |

---

## APPENDIX B: SCREEN INVENTORY FOR WIREFRAMING

Prioritized by MVP critical path (SOW Section 22.1 workstreams).

### Tier 1: MVP Critical Path Screens
1. Enterprise Console — SOW Intake Mode Selector (AI Parameter Wizard / Manual Upload)
2. Enterprise Console — AI Parameter Wizard (template selection, clause library, parameter config, draft generation)
3. Enterprise Console — AI Draft Review (confidence scores, hallucination controls, risk assessment)
4. Enterprise Console — Manual SOW Upload (DOC/PDF + NLP/OCR enhancement)
5. Enterprise Console — SOW AI Extraction Review (metadata, clauses, validation — both paths converge)
6. Enterprise Console — Multi-Stage SOW Approval (Business → Legal → Security → Final)
7. Enterprise Console — Task Decomposition View (milestones, tasks, dependencies, approval)
8. Enterprise Console — Team Formation (matching results + "why matched" + confirmation)
9. Enterprise Console — Project Monitoring (task status, team, SLAs, exceptions)
10. Enterprise Console — Deliverable Review & Acceptance (evidence pack, accept/rework)
11. Contributor Portal — Registration & Onboarding
12. Contributor Portal — Dashboard / Home
13. Contributor Portal — Task Discovery (browse, filter, task detail, accept/decline)
14. Contributor Portal — Task Workroom (instructions, upload, Q&A, evidence checklist, submit)
15. Contributor Portal — Earnings & Payout View
16. Mentor Workspace — Review Queue
17. Mentor Workspace — Review Detail (context, artifacts, rubric, feedback, decision)

### Tier 2: Important Supporting Screens
18. Enterprise Console — Rate Card Configuration
19. Enterprise Console — Billing/Payout Export
20. Enterprise Console — Admin Configuration (roles, policies, integrations)
21. Contributor Portal — Profile & Digital Twin View
22. Contributor Portal — Credential Wallet
23. Contributor Portal — Submission History & Review Status
24. Mentor Workspace — Review History

### Tier 3: Analytics & Intelligence
25. Analytics — Workforce Intelligence Dashboard (skills, gaps, utilization)
26. Analytics — Economic Dashboard (spend, savings, ROI)
27. Analytics — Governance & Risk Dashboard (incidents, fraud, overrides)
