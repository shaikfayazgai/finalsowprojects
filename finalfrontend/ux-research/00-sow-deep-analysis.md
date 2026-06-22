# GlimmoraTeam SOW Deep Analysis

**Source Document:** GLIMMORATEAM - Global Workforce Intelligence Platform_V2.0 Accelerated
**Previous Version:** V1.1 with MVP
**Analysis Date:** 2026-03-07 (updated from 2026-03-06 V1.1 analysis)
**Method:** Section-by-section analysis. Every statement below is directly from the SOW or clearly marked as [INFERENCE] when derived.
**V2.0 Key Deltas:** Dual SOW Intake (AI-Generated + Manual Upload), Hallucination Prevention Framework (8-layer), Ethics/Security/Risk Controls, SOW Generation Guardrails Engine, 30-day accelerated timeline (was 90 days), Python microservices for AI/NLP, Vector DB added, Multi-Stage Approval workflow, Figma as Design Authority.

---

## 1. WHAT IS GLIMMORATEAM (Section 1.3)

GlimmoraTeam converts traditional Scopes of Work (SOWs) into outcome-driven, AI-coordinated delivery pipelines executed by distributed contributor teams. The platform combines:
- Agentic AI
- Global Talent Intelligence Graph
- Autonomous Delivery Economy
- Global Workforce Operating System (GWOS)

To orchestrate work from intent to verifiable proof-of-delivery.

**Platform Owner:** Glimmora International
**Platform Type:** Global Workforce Intelligence Platform
**Subtitle:** Agentic AI, Talent Graph, Autonomous Delivery Economy & Global Workforce OS

---

## 2. BUSINESS CONTEXT (Section 1.2)

Enterprises are shifting from static job-based hiring to dynamic, skills-based, project-centric models where work is decomposed into tasks and matched to internal and external contributors in real time. GlimmoraTeam addresses this by enabling AI-governed workforce execution, integrating multi-source contributors (students, women workforce, freelancers, internal staff) into a governed delivery operating system.

---

## 3. PLATFORM VISION (Section 2.1)

Create a global labor operating system where:
- AI agents coordinate work
- Skills are validated through real deliveries
- Contributors participate in a governed task economy with verifiable outcomes and equitable compensation

---

## 4. OBJECTIVES AND SUCCESS CRITERIA (Section 1.4)

1. Reduce time-to-staff and time-to-start by at least [X]% via AI-driven team formation
2. Improve delivery predictability and on-time completion rates for SOW-linked projects by [Y]%
3. Establish a governed, evidence-based reputation ledger for contributors, replacing CV-only assessment with outcome-based credentials
4. Enable global scale participation (1M+ contributors) with enterprise-grade security, compliance, and observability

### 4.1 MVP Success Criteria (Section 1.4.1)

The Phase 1 deliverable is a production-usable MVP that can run real pilot projects end-to-end.

10 MVP success criteria — [V2.0: expanded from 7 to 10]:
1. **SOW to Task Graph:** Ingest SOWs (via AI-Generated wizard OR Manual Upload with OCR/NLP) and generate task plans (task graph + milestones + skills tags) with human approval and versioning — [V2.0: dual intake]
2. **Contributor Lifecycle:** Onboard contributors (internal + invited external), capture consent, verify identity at basic level, assign roles
3. **Matching & Assignment:** Recommend and assign contributors to tasks using skills and availability signals (baseline ranking)
4. **Review & Acceptance:** Submit work artifacts, route reviews (mentor/reviewer/client), complete acceptance with immutable audit trails
5. **Commercial Readiness:** Price tasks using configurable rate cards (not dynamic), generate payout eligibility, export billing/payout reports
6. **Security & Auditability:** SSO + RBAC + tenant isolation + audit logs + operational monitoring, aligned to Zero Trust principles
7. **Accessibility Baseline:** MVP UI adheres to WCAG-aligned practices for core journeys
8. **Hallucination Prevention Verification (NEW V2.0):** AI-generated SOWs must pass all 8 defense layers (input validation, template locking, clause library, completeness checks, 90%+ confidence scoring, pattern matching, human approval, audit logging) with documented test results
9. **Security and Ethics Gate Validation (NEW V2.0):** Prohibited content detection, data sensitivity classification, risk scoring (0-100), and jurisdiction screening must be functional and pass acceptance testing
10. **Manual Upload Processing 95%+ Accuracy (NEW V2.0):** OCR + NLP extraction pipeline achieves 95%+ accuracy on a defined test document corpus

---

## 5. KEY TERMINOLOGY (Section 1.5)

| Term | SOW Definition |
|------|---------------|
| Agentic AI | Autonomous/semi-autonomous AI agents executing tasks, making decisions, interacting with agents/humans under governance rules |
| Contributor | Any individual or AI agent performing tasks — includes internal employees, freelancers, students, women workforce, mentors, reviewers |
| Digital Twin | Structured digital representation containing verified skills, performance metrics, learning signals, behavioral attributes |
| Task | Discrete unit of work derived from SOW or project decomposition |
| Proof-of-Delivery | Verifiable record demonstrating completion and acceptance, linked to contributor reputation and credentials |
| GWOS | Platform control plane managing contributors, projects, economics, governance, intelligence services |
| Talent Intelligence Graph | Graph-based data structure: contributors, skills, projects, organizations, credentials |
| APG | Orchestration engine coordinating task execution, governance rules, SLA monitoring, escalation workflows |

---

## 6. TARGET USERS AND STAKEHOLDERS (Section 2.3)

Exact list from SOW:
1. Enterprise business owners and project sponsors
2. HR, Talent, and Learning & Development teams
3. Procurement and finance controllers
4. Mentors, reviewers, and governance officers
5. Student contributors, women workforce contributors, freelancers, and internal employees

---

## 7. CORE VALUE PROPOSITION (Section 2.4)

GlimmoraTeam replaces resume-based hiring and bid-based freelancing with evidence-based delivery, where SOWs are decomposed, matched, governed, and continuously learned from via agentic AI. This enables:
- Living skills inventory
- Dynamic pricing
- Autonomous workforce planning

---

## 8. MVP FUNCTIONAL SCOPE (Section 3.1.MVP) — [V2.0: significant expansion]

Delivered in two tracks:
- **Phase 1 (0-30 Days):** MVP — production-usable core platform for pilot execution — [V2.0 CHANGE: accelerated from 90 days to 30 days]
- **Phase 2 (3-6 Months):** Advanced — autonomous economy depth, advanced agent governance, multi-region scale, deep enterprise integrations

### 8.1 SOW Intake & Normalization (3.1.MVP.1)

**[V2.0 CHANGE] Dual SOW Intake Pathways:**

V2.0 introduces two distinct intake pathways (V1.1 only had manual upload):

**Pathway A — AI-Generated SOW (NEW in V2.0):**
- Parameter wizard with guided input (industry, scope, budget, timeline, team size)
- Template-locked generation with guardrails (prevents hallucination/drift)
- Clause library enforcement — AI selects from pre-approved clause library, no free-form generation
- Completeness checks — validates all required sections present before finalization
- Confidence scoring — minimum 90% confidence threshold for AI-generated content
- Pattern matching against historical SOWs for consistency validation
- Human approval gate — generated SOW requires explicit human sign-off
- Audit logging — full trace of generation parameters, template used, clauses selected

**Pathway B — Manual Upload (Enhanced in V2.0):**
- SOW ingestion via UI and API (DOC/PDF upload + structured form)
- Enhanced with OCR for scanned documents
- NLP-based extraction and gap analysis — identifies missing sections, ambiguous clauses
- Metadata extraction (title, dates, stakeholders, confidentiality, deliverables list)
- Clause tagging (dependencies, assumptions, constraints) with human validation
- SOW versioning (draft/approved) and audit history

**Deliverables:**
- Configurable SOW intake forms (per client template)
- AI SOW generation wizard with parameter-driven interface
- SOW repository + search + export
- Audit events for SOW lifecycle
- Gap analysis reports for manual uploads

### 8.2 Task Decomposition & Planning (3.1.MVP.2)
**Capabilities:**
- Semi-automated decomposition: SOW -> milestones -> tasks/subtasks
- Skills tagging per task (manual + assisted suggestions)
- Task dependencies and critical path (basic)
- Human approval gates before execution

**Deliverables:**
- Task graph model + APIs
- Planner UI (PMO/Admin)
- Exportable plan (CSV/PDF)

### 8.3 Contributor Onboarding & Digital Twin Baseline (3.1.MVP.3)
**Capabilities:**
- Contributor registration (internal via HRIS sync OR manual import; external via invite)
- Profile + skills self-declaration + evidence attachments (links/docs)
- Consent capture and role assignment
- Digital twin v1: skills list + activity metrics + basic reliability counters

**Deliverables:**
- Contributor portal: profile, skills, availability, timezone
- Admin: contributor management + role assignment

### 8.4 Matching, Team Formation & Assignment (3.1.MVP.4)
**Capabilities:**
- Matching engine v1: ranked recommendations based on skills match + availability + basic quality signals
- Team formation for a project (small team) with human confirmation
- Assignment workflow (accept/decline), reassignments, SLA timers

**Deliverables:**
- Matching API endpoint + explainable "why matched" fields (baseline)
- Assignment UI for contributors + admin override

### 8.5 Workroom, Submission, Review & Acceptance (3.1.MVP.5)
**Capabilities:**
- Task workroom: instructions, templates, uploads, links, Q&A
- Submission: file upload + structured responses + evidence checklist
- Review workflow: single-stage and two-stage review (mentor/reviewer + client)
- Acceptance decision with reasons; rework loop with versioning

**Deliverables:**
- Review rubrics/templates (configurable)
- Acceptance logs + evidence pack export

### 8.6 Pricing & Payout Eligibility Baseline (3.1.MVP.6)
**Capabilities:**
- Rate cards (role/skill/level/region) configured by admin
- Task pricing = rate card x effort (manual or assisted estimate)
- Payout eligibility upon acceptance; basic wallet ledger (internal)
- Export reports for billing and payouts (CSV + API)

**Explicit MVP Exclusion:** Dynamic market pricing, surge pricing, predictive economic optimization -> Phase 2

### 8.7 Core AI Agents — "Assistive Autonomy" (3.1.MVP.7)

**MVP Policy:** Agents operate in assistive mode for high-impact decisions; human approvals mandatory for: acceptance, payouts, sanctions, policy overrides.

**4 MVP Agents:**
1. SOW Intake Assistant — **[V2.0 CHANGE]** Now covers both AI-Generated and Manual Upload modes: extract/summarize/tag + recommendations for manual uploads; parameter validation + template selection + guardrail enforcement for AI generation mode
2. Decomposition Assistant (task plan suggestions)
3. Contributor Support Assistant (guided help inside workroom)
4. Review Assistant (rubric suggestions + summarization)

**Explicit MVP Exclusion:** Fully autonomous project governor, automated sanctions, autonomous payouts -> Phase 2

### 8.8 Security, IAM, Audit & Observability (3.1.MVP.8)
- SSO integration (SAML/OIDC), OAuth2-based API access, RBAC
- Tenant isolation and least-privilege access (Zero Trust)
- Immutable audit logging for: SOW changes, assignments, submissions, reviews, acceptances, pricing, payout eligibility
- Monitoring: service health dashboards, error alerting, basic tracing
- OpenAPI 3.1 for platform APIs

### 8.9 Hallucination Prevention Framework (NEW in V2.0)

**[V2.0 NEW SECTION]** 8-layer defense system for AI-generated SOW content:

| Layer | Function |
|-------|----------|
| 1. Input Validation | Validate all wizard parameters before generation begins |
| 2. Template Locking | AI operates within locked templates — no free-form document generation |
| 3. Clause Library | All clauses selected from pre-approved library; no novel clause creation |
| 4. Completeness Checks | Validates all required SOW sections are present and populated |
| 5. Confidence Scoring | Minimum 90% confidence threshold — below threshold triggers human review |
| 6. Pattern Matching | Cross-reference against historical SOW patterns for consistency |
| 7. Human Approval | Mandatory human sign-off before any AI-generated SOW is finalized |
| 8. Audit Logging | Full trace: generation parameters, template version, clauses used, confidence scores, approval chain |

### 8.10 Ethics, Security & Risk Controls (NEW in V2.0)

**[V2.0 NEW SECTION]** Controls applied during SOW intake and throughout platform:

**Prohibited Content Detection:**
- Automated screening for prohibited/unethical content in SOW submissions
- Flag and block SOWs containing sanctioned activities or jurisdictional violations

**Data Sensitivity Classification:**
- 4-tier classification: Public, Internal, Confidential, Restricted
- Classification assigned during SOW intake and propagated to tasks/assignments
- Access controls enforced per classification level

**Risk Scoring Model:**
- Numeric risk score (0-100) calculated per SOW/project
- Factors: data sensitivity, jurisdiction, industry, budget, compliance requirements
- Approval routing based on risk score thresholds

**Jurisdiction Screening:**
- Automated screening against sanctioned jurisdictions
- Export control compliance checks
- Cross-border work regulation validation

### 8.11 Multi-Stage Approval Workflow (NEW in V2.0)

**[V2.0 NEW SECTION]** SOW approval follows a defined multi-stage pipeline:

1. **Business Owner Approval** — Validates scope, budget, timeline
2. **Legal/Compliance Review** — Verifies regulatory compliance, contract terms
3. **Security Review** — Assesses data sensitivity, risk score, access requirements
4. **Final Approval** — Digital signature from authorized approver

Each stage produces an audit trail entry. Rejection at any stage returns to the submitter with structured feedback.

### 8.12 Integrations — MVP (3.1.MVP.9)
**Included:**
- SSO/IdP
- HRIS import/sync (minimum viable: employee ID, role, org, manager, cost center)
- Webhooks/API for project tools (basic push/pull of task status)

**Deferred:** Deep ERP GL posting, complex invoicing/tax engines, multi-provider payout rails -> Phase 2+

---

## 9. FULL SCOPE COMPONENTS (Sections 3.1.1-3.1.8)

### 9.1 Agentic AI Orchestration Layer (3.1.1)

**8 Specialized Agents (full platform):**
1. Enterprise Orchestration Agent (intake, planning, prioritization)
2. Contributor Support Agent (Q&A, guidance, context delivery)
3. Mentor & Reviewer Agent (review assistance, rubric suggestions, summarization)
4. Workforce Optimization Agent (staffing, rebalancing, scenario simulation)
5. Governance & Risk Agent (policy checks, risk scoring, escalation recommendations)
6. Learning Agent (next-best learning actions, skill-gap closure)
7. Payment Agent (completion validation, pricing/payout checks)
8. Proof-of-Delivery Agent (credential issuance, ledger updates)

**Orchestration Framework:**
- Event-driven orchestration patterns for AI/human decision-making
- Decision logs, prompts, guardrails, policy rule sets
- Autonomy tiers: fully automated, human-in-the-loop, notify-only
- Governance dashboards for monitoring agent activity, overrides, exceptions

**AI Governance Framework (Section 7.5):**
- Model version control, testing, approval workflows before production
- Human oversight for critical decisions (acceptance, financial, sanctions)
- Explainability: reasoning summaries for review and auditability
- Bias monitoring for: contributor selection, pricing recommendations, reputation scoring
- Risk classification: Low (automated), Medium (human-in-the-loop), High (human approval)
- Immutable audit logs: decision inputs, model versions, execution context, output recommendations

### 9.2 Global Talent Intelligence Graph (3.1.2)

**Node types:** Contributors, Skills, Roles, Projects, Industries, Credentials, Organizations, Technologies
**Edge types:** has_skill, performed_task, belongs_to_org, mentored_by, credential_issued_for, uses_tech, part_of_team
**Attributes:** Proficiency, recency, reliability, preference signals

**Services:**
- APIs for candidate search, skill discovery, similarity queries, team recommendations
- Ranking logic: skills + performance + availability + cost
- Graph analytics: workforce insights, heatmaps, gap analysis

### 9.3 Autonomous Delivery Economy Engine (3.1.3)

**Pricing models:** By task type, skill level, geography, urgency
**Incentives:** Bonuses for quality, early delivery, mentoring; penalties for fraud, persistent low quality
**Rate cards:** Discount structures, enterprise-specific commercial rules

**Task lifecycle:** Acceptance criteria templates, scoring mechanisms, partial acceptance, rework loops, dispute resolution
**Wallet:** Virtual wallet / internal ledger, adjustments, reversals, manual corrections

### 9.4 GWOS (3.1.4)
- Workforce digital twins with skill, reliability, learning profiles
- Role-based and segment-based views (students, women workforce, internal employees, external freelancers)
- Central project/workstream registry mapped to SOWs and enterprise portfolios
- Program-level views of capacity, demand, risks, progress
- Project knowledge graph integrated with talent graph and SOW library
- Dashboards for utilization, performance, diversity, geography, skill gaps
- Export and reporting for HR, Finance, PMO stakeholders

### 9.5 Contributor Portals and Mobile Experiences (3.1.5)

**Web-based contributor portal:**
- Registration, identity verification, onboarding workflows
- Profile management (skills, preferences, availability, time zones)
- Task discovery, assignment, workroom, submission flows
- Earnings and payout view, credential wallet, history of contributions

**Mentor & reviewer workspace:**
- Queues for assigned reviews and mentorship sessions
- Review forms, rubrics, guided feedback flows
- Visibility into contributor progress and learning signals

**Mobile-optimized experiences:**
- Mobile-responsive web UX as baseline
- Optionally, API-ready design for future native mobile apps (Android/iOS)

**Accessibility and inclusivity:**
- Baseline adherence to WCAG-aligned guidelines
- Localization framework for multiple languages

### 9.6 Enterprise Admin, Operations, and Analytics Consoles (3.1.6)

**Admin and configuration console:**
- Tenant setup, role management, access control
- Configuration of policies (SLA templates, pricing rules, governance thresholds)
- Integration configuration (HRIS, ERP, LMS, identity)

**Operations and delivery console:**
- Project, task, team monitoring for enterprise PMO and operations teams
- Exception management (escalations, reassignments, risk flags)
- Real-time and historical views on throughput, quality, bottlenecks

**Analytics and intelligence console:**
- Workforce intelligence dashboards (skills inventory, gaps, learning needs)
- Economic dashboards (spend, savings, ROI, earning distribution)
- Export and self-service analytics (filters, drilldowns)

### 9.7 Payment and Procurement Integrations (3.1.7)
- Procurement: SOW submission/approval/PO creation, mapping to cost centers/GL codes/vendor records
- Billing: Invoice/billing statement generation, export to ERP/finance
- Payment & payout: PSP/payment rail integration, basic tax/compliance/reporting

### 9.8 Security, Compliance, Observability, DevSecOps (3.1.8)
- Access control, logging, encryption, environment hardening
- Privacy controls: consent management, data minimization, retention
- Centralized logging, metrics, distributed tracing
- CI/CD pipelines with SAST/DAST, dependency scanning
- Dev/Test/Staging/Production environments with promotion workflows
- Runbooks, on-call procedures, incident management

---

## 10. OUT OF SCOPE — Phase 1 MVP (Section 3.2)

Explicitly excluded from Phase 1:
1. **Autonomous Delivery Economy (Advanced):** Dynamic market pricing, automated incentives/penalties optimization, predictive margin optimization
2. **Autonomous Project Governor (Full):** Full autonomous orchestration without human approval
3. **Proof-of-Delivery Ledger (Immutable Credentialing):** Cryptographic credentialing, verifiable credentials, external credential wallet
4. **Advanced Fraud & Trust:** Behavioral anomaly models at scale, anti-collusion, advanced KYC/KYB
5. **Multi-region + Multi-tenant Global Scale:** Active-active multi-region, complex residency orchestration
6. **Deep Enterprise Integrations:** Full ERP automation, multi-entity invoicing, complex procurement, SCIM at scale

Also excluded (Section 3.2.1-3.2.5):
- Long-term BPO/managed services
- Custom HRIS/ERP feature development
- On-premise deployments (unless explicitly agreed)
- Non-workforce AI use cases
- Custom product development unrelated to platform roadmap

---

## 11. END-TO-END DELIVERY WORKFLOW (Section 4)

**8-step workflow (Section 4.1) — [V2.0: Step 1 expanded for dual intake]:**
1. Enterprise creates SOW via **AI-Generated pathway (parameter wizard)** OR **Manual Upload (DOC/PDF with OCR + NLP gap analysis)** — [V2.0 CHANGE: dual intake replaces upload-only]
2. AI interprets scope and constraints; hallucination prevention framework validates AI-generated content (8-layer defense) — [V2.0 CHANGE: guardrails layer added]
3. Multi-stage approval: Business Owner -> Legal/Compliance -> Security -> Final (digital signature) — [V2.0 NEW STEP: was implicit, now formalized]
4. Project decomposed into tasks and subtasks
5. Teams automatically assembled from global contributor pools
6. APG orchestrates execution
7. Deliverables validated by AI plus human reviewers
8. Payments and reputational updates triggered post-acceptance
9. Proof-of-Delivery credentials issued and linked to talent graph

**[V2.0 NOTE]** Post-intake workflow (steps 4-9) is unchanged from V1.1. The V2.0 changes are concentrated in SOW intake and approval (steps 1-3).

**Workflow variants (Section 4.2):**
- Software development and IT projects
- Data, analytics, and AI projects
- Business process and documentation tasks
- L&D content creation and internal change projects

**Configuration (Section 4.3):**
- Configurable stage gates (SOW intake, decomposition, review, execution, QA, acceptance, billing)
- SLA templates per work type (turnaround, quality thresholds)
- Configurable escalation and re-assignment rules under APG

---

## 12. CORE PLATFORM ARCHITECTURE (Section 5)

### Architecture Principles (5.1)
- Microservices-first, domain-driven design with clear bounded contexts
- API-first integration
- Event-driven orchestration for agents and workflows
- Zero trust security posture with least privilege
- Cloud-agnostic deployment patterns

### Backend Stack — [V2.0 CHANGES]

**[V2.0 NEW]** The following technology additions are specified in V2.0:

- **Python microservices for AI/NLP services** — sow-nlp-svc, sow-guardrails-svc use Python (FastAPI) instead of Node.js/NestJS. NLP libraries: spaCy, NLTK, HuggingFace Transformers for SOW text processing, gap analysis, clause extraction.
- **Vector Database added** — Pinecone, Weaviate, or Qdrant for semantic search over SOW templates, clause library, and historical SOW corpus. Used by guardrails engine for pattern matching and similarity scoring.
- **Existing stack unchanged** — Node.js/NestJS remains for core business services. PostgreSQL + Graph DB (Neo4j/Janus) + Redis/BullMQ + Kafka remain as specified in V1.1.

### Four Platform Layers (5.2)
1. **Experience Layer:** Web portals, mobile apps, admin consoles
2. **Intelligence & Orchestration Layer:** Agentic AI, APG, economic intelligence, SOW Guardrails Engine (V2.0)
3. **Core Services Layer:** SOW, tasks, talent graph, reputation, payments
4. **Infrastructure & Platform Layer:** Kubernetes, message bus, data platform, observability, Vector DB (V2.0)

### 13 Core Engines (5.3) — [V2.0: was 12, now 13]
1. SOW Intelligence Engine — NLP/NLU to parse/normalize SOW documents
2. **SOW Generation Guardrails Engine (NEW in V2.0)** — Parameter validation, template locking, clause library enforcement, hallucination prevention (8-layer defense), confidence scoring
3. Project Decomposition Engine — Convert scope into tasks, milestones, dependency graphs
4. Instant Team Formation Engine — Matching using talent graph data
5. Autonomous Project Governor (APG) — Multi-agent governance framework
6. Learning-by-Delivery Engine — Capture learnings, update skills, trigger interventions
7. Skill Genome Engine — Skills taxonomies, adjacencies, proficiencies
8. Proof-of-Delivery Ledger — Immutable record of outcomes, sign-offs, credentials
9. Workforce Reputation Engine — Reliability, quality, collaboration, learning velocity scoring
10. Fraud Detection Engine — Anomaly detection on identity, submissions, behavior
11. Task Pricing Intelligence — Dynamic pricing based on demand/supply/complexity/performance
12. Enterprise Procurement Interface — POs, approvals, invoicing
13. Global Payment Infrastructure — PSP connectors, payroll, cross-border settlement

---

## 13. MICROSERVICE ARCHITECTURE (Section 6)

### 6 Domains (6.1)
1. SOW & Project Domain Services
2. Talent Graph & Contributor Domain Services
3. Execution & Governance Domain Services
4. Economic & Payments Domain Services
5. Security, Identity & Compliance Domain Services
6. Observability & Platform Domain Services

### Example Catalogue (6.2) — [V2.0: 3 new services added]
| Domain | Service | Responsibilities |
|--------|---------|-----------------|
| SOW & Project | sow-ingestion-svc | Upload, OCR, parsing, metadata extraction |
| SOW & Project | **sow-guardrails-svc (NEW V2.0)** | Hallucination prevention, confidence scoring, template locking, clause library enforcement, 8-layer defense pipeline |
| SOW & Project | **sow-template-svc (NEW V2.0)** | SOW template management, versioning, parameter wizard configuration, clause library CRUD |
| SOW & Project | **sow-nlp-svc (NEW V2.0)** | NLP processing for manual uploads — gap analysis, ambiguity detection, clause extraction, completeness validation (Python-based) |
| SOW & Project | project-decomposition-svc | Task graph decomposition and dependencies |
| Talent & Contributor | contributor-profile-svc | Profiles, identity linkage, demographics |
| Talent & Contributor | skill-genome-svc | Skills taxonomy, proficiencies, adjacencies |
| Execution & Governance | apg-orchestrator-svc | Workflow orchestration, SLA monitoring, escalations |
| Economic & Payments | task-pricing-svc | Dynamic price calculation and adjustments |
| Economic & Payments | payment-gateway-svc | Payment orchestration and PSP connectors |
| Security & Compliance | iam-rbac-svc | Authentication, authorization, role/policy management |
| Observability | audit-log-svc | Immutable audit logging, query APIs |

### Communication Patterns (6.3)
- Synchronous REST/gRPC for real-time queries (skill lookups)
- Asynchronous messaging (Kafka/Service Bus) for events (task state changes, reputation, payments)
- Outbox pattern and idempotent consumers

### MVP Microservices — Phase 1 (Annexure A) — [V2.0: 3 new services added]
sow-ingestion-svc, sow-normalization-svc, **sow-guardrails-svc (NEW V2.0)**, **sow-template-svc (NEW V2.0)**, **sow-nlp-svc (NEW V2.0)**, decomposition-svc, project-lifecycle-svc, task-mgmt-svc, matching-svc (v1), assignment-svc, workroom-svc, submission-svc, review-svc, acceptance-svc, pricing-ratecard-svc, payout-eligibility-ledger-svc, contributor-profile-svc, consent-svc, iam-rbac-svc, audit-log-svc, notification-svc (email/in-app), reporting-export-svc, api-gateway-svc, observability-collector-svc

### Phase 2 Additions (Annexure A)
apg-orchestrator-svc (full), proof-of-delivery-ledger-svc, fraud-detection-svc (advanced), dynamic-pricing-svc, incentive-penalty-svc, credential-wallet-integration-svc, multi-region-policy-svc

---

## 14. FRONTEND UI MODULES (Section 19)

**[V2.0 NEW] Design Authority:**
- **Figma** is explicitly stated as the design authority — all UI specifications, component designs, and interaction patterns are defined in Figma
- **Storybook** for component documentation — all UI components must have Storybook stories for visual testing and developer reference
- Design-to-code handoff workflow: Figma (source of truth) -> Storybook (component docs) -> Implementation

**The SOW defines exactly 4 frontend UI modules (unchanged from V1.1):**

### 14.1 Enterprise Admin Console (19.1)
- SOW intake and project portfolio views
- Workforce insights dashboards (skills, capacity, performance)
- Governance configuration (policies, workflows, SLAs)

Expanded in Section 3.1.6 into 3 sub-consoles:
- Admin and configuration console (tenant setup, role management, access control, policy config, integration config)
- Operations and delivery console (project/task/team monitoring, exception management, real-time/historical views)
- Analytics and intelligence console (workforce dashboards, economic dashboards, self-service analytics)

### 14.2 Contributor Portal (19.2)
- Profile and digital twin view
- Task discovery, assignment, and submission flows
- Learning recommendations and credential wallet

Expanded in Section 3.1.5:
- Registration, identity verification, onboarding workflows
- Profile management (skills, preferences, availability, time zones)
- Task discovery, assignment, workroom, submission flows
- Earnings and payout view, credential wallet, history of contributions

### 14.3 Mentor & Reviewer Workspace (19.3)
- Queue of review tasks, rubrics, and scoring
- Feedback tools and coaching recommendations

Expanded in Section 3.1.5:
- Queues for assigned reviews and mentorship sessions
- Review forms, rubrics, guided feedback flows
- Visibility into contributor progress and learning signals

### 14.4 Analytics & Workforce Intelligence Dashboards (19.4)
- Skill heatmaps, utilization, and gap analysis
- Economic performance dashboards (earnings, rates, margins)
- Governance and risk dashboards (incidents, fraud flags, overrides)

---

## 15. WORKFORCE ECOSYSTEM: STUDENT & WOMEN CONTRIBUTORS (Section 20)

These are TRACKS within the Contributor Portal, not separate portals.

### 15.1 Student Contributor Track (20.1)
- Institutional onboarding model with university partners
- Project types, guardrails, and supervision models for students
- Outcome-based payments and academic recognition mapping where applicable

### 15.2 Women Workforce Contributor Track (20.2)
- Flexible scheduling, remote-first task models, and accessible UX
- Mentorship, community support, and upskilling pathways
- Payment and financial inclusion mechanisms tailored to local contexts

### 15.3 Safeguards and Support (20.3)
- Inclusive design and accessibility practices in UI
- Support channels and grievance redressal mechanisms
- Safe-work and anti-harassment governance

---

## 16. WORKFORCE DIGITAL TWINS (Section 11)

Each contributor (human or AI agent) represented by a digital twin.

**Attributes:**
- Verified skills (certifications, project outcomes, endorsements)
- Reliability profile (on-time delivery, acceptance rates, SLA compliance)
- Collaboration signals (feedback, peer ratings, mentor involvement)
- Learning velocity (time to adopt skills, performance over time)
- Availability and engagement patterns

**Lifecycle Events:**
- Onboarding (identity verification, baseline assessment)
- Active contribution (assignments, mentoring, feedback)
- Escalations and sanctions (fraud flags, temporary suspensions)
- Offboarding and alumni status

---

## 17. ECONOMIC MODEL (Section 9)

### Economy Model (9.1)
Task-based economy: enterprises submit work, AI decomposes it, contributors execute, payments occur only for accepted outcomes.

### Economic Roles (9.2)
- Enterprise clients (project owners, sponsors)
- Contributors (students, women workforce, internal employees, freelancers)
- Mentors and reviewers
- Platform infrastructure and governance entities (fees and charges)

### Pricing & Incentives (9.3)
- Base pricing: complexity, estimated effort, scarcity of skills, urgency
- Bonuses: high quality, early delivery, mentoring roles
- Penalties/clawbacks: fraud, persistent low quality

### Payment Flows (9.4)
- Escrow-like model: funds reserved on assignment, released on acceptance
- Support for local payout methods per geography
- Tax and reporting compliance

### Financial Governance (9.5)
- Platform fees (active contributor volume, task volume, enterprise subscription tiers)
- Contributor earnings (accepted outcomes, mentoring, performance incentives)
- Enterprise billing (task costs, subscription, premium services)
- Transparent financial ledgers for task-level pricing, payment allocations, commissions, payout history

---

## 18. GOVERNANCE FRAMEWORK (Section 14)

**Objectives:** Fairness, transparency, integrity; fraud/plagiarism/abuse mitigation; auditability and compliance

**Mechanisms:**
- Plagiarism and duplication detection
- KYC/KYB identity verification
- Fraud detection via behavioral anomaly models
- Comprehensive audit logging
- Human oversight with escalation paths

**Policy Framework:**
- Terms of use for contributors and enterprises
- Code of conduct and anti-harassment policy
- Data protection and privacy policies

**Risk Categories:**
- Operational: system downtime, task delays, contributor shortages
- Financial: payment fraud, pricing volatility, invoice disputes
- Compliance: cross-border work regulations, data protection obligations

---

## 19. SECURITY ARCHITECTURE (Section 15)

**Principles:** Defense-in-depth, zero-trust, privacy by design and default

**Controls:**
- Tenant isolation and data partitioning
- Encryption at rest and in transit (TLS 1.2+, KMS-managed keys)
- RBAC + attribute-based policies
- MFA for privileged users
- Continuous vulnerability management (SAST/DAST)
- Security event logging with SIEM
- Periodic penetration tests

**Data Governance (Section 17.4):**
- Data classification: Public, Internal, Confidential, Restricted — [V2.0: classification now applied at SOW intake via data sensitivity classification gate, propagated to tasks/assignments]
- Data lineage tracking
- Automated validation (schema, duplicate detection, skill normalization, economic integrity)
- Retention/archival/deletion policies
- Joint governance committee

---

## 20. DATABASE SCHEMA (Section 17, Annexure C)

### Core Schemas
- SOW & Project: Sow, Project, Milestone, Task, Dependency
- Contributor & Talent Graph: Contributor, Skill, Credential, ReputationMetric
- Execution & Governance: Assignment, Submission, Review, Incident, AuditEvent
- Economic & Payment: RateCard, Invoice, Payment, Payout, TaxRecord

### Example Tables (Annexure C)
| Table | Key Fields |
|-------|-----------|
| sow | sow_id, client_id, title, status, classification, confidentiality_flag |
| project | project_id, sow_id, owner_user_id, start_date, end_date, status, risk_score |
| task | task_id, project_id, name, description, estimated_effort, required_skills_json, state, due_date |
| assignment | assignment_id, task_id, contributor_id, assigned_at, accepted_at, completed_at, score |
| contributor | contributor_id, identity_source, hris_id, external_id, status, join_date, risk_level |
| payout | payout_id, contributor_id, amount, currency, method, status, initiated_at, completed_at |

### Graph Schema
- **Nodes:** Contributor, Skill, Project, Task, Credential, Org, Role
- **Edges:** HAS_SKILL, PERFORMED_TASK, BELONGS_TO_ORG, MENTORED_BY, CRED_ISSUED_FOR

---

## 21. API SPECIFICATIONS (Section 18, Annexure B)

### Principles
- REST over HTTPS (JSON), limited gRPC for high-throughput
- OpenAPI 3.x for all APIs
- OAuth2/OIDC, JWT, scopes by resource type and action

### Key Endpoints (Annexure B)
| Category | Endpoint | Purpose |
|----------|----------|---------|
| SOW | POST /v1/sows | Create SOW (upload or structured) |
| SOW | POST /v1/sows/generate | **[V2.0 NEW]** AI-Generate SOW from parameter wizard input |
| SOW | POST /v1/sows/validate | **[V2.0 NEW]** Run hallucination prevention + guardrails checks on SOW |
| SOW | POST /v1/sows/{id}/approve | **[V2.0 NEW]** Multi-stage approval action (per stage) |
| SOW | GET /v1/sows/{id} | Retrieve SOW with parsed structure |
| SOW | GET /v1/sows/{id}/risk-score | **[V2.0 NEW]** Get risk score and classification |
| Projects | POST /v1/projects | Create project from SOW |
| Projects | GET /v1/projects?filters= | List/filter projects |
| Talent | POST /v1/contributors | Create/update contributor |
| Talent | GET /v1/contributors/{id} | Profile + digital twin summary |
| Matching | POST /v1/match/tasks/{taskId} | Ranked contributors for task |
| Execution | POST /v1/tasks/{id}/assign | Assignment or override |
| Execution | POST /v1/tasks/{id}/submit | Submit work artifact |
| Execution | POST /v1/tasks/{id}/review | Submit review scores/feedback |
| Payments | GET /v1/pricing/tasks/{id} | Price breakdown and rates |
| Payments | POST /v1/invoices/generate | Trigger invoice generation |
| Payments | GET /v1/payouts/{id} | Payout status |
| HRIS | POST /v1/integrations/hris/sync | Bulk employee sync |
| LMS | POST /v1/integrations/lms/events | Course completions |
| ERP | POST /v1/integrations/erp/invoices | Push invoice |

---

## 22. INTEGRATIONS (Section 21)

| System | Purpose |
|--------|---------|
| HRIS & Talent Systems | Two-way sync of employees and org structures; map internal roles to skills |
| Project & Work Management | Integration with Jira, Azure DevOps or similar; sync issues/tasks/statuses |
| Procurement & Finance | SOW approval, PO management, vendor controls; invoicing, GL postings, chargebacks |
| Identity & Access | SSO via SAML/OIDC; SCIM-based user provisioning/de-provisioning |

---

## 23. IMPLEMENTATION ROADMAP (Section 22)

### Phase 1 — MVP Foundation (0-30 Days) — [V2.0 CHANGE: accelerated from 90 days to 30 days]
**Goal:** Production-usable MVP for pilot delivery projects end-to-end

**Workstreams:**
- Platform Setup: tenant, environments (DEV/TEST/PROD), CI/CD baseline
- Identity & Access: SSO + RBAC, admin roles, audit log baseline
- Core Workflow: SOW ingestion (dual pathway: AI-Generated + Manual Upload) -> decomposition -> assignment -> submission -> review -> acceptance — [V2.0: dual intake added]
- SOW Guardrails: hallucination prevention framework, template locking, clause library, confidence scoring — [V2.0 NEW]
- Ethics & Risk Controls: prohibited content detection, data sensitivity classification, risk scoring, jurisdiction screening — [V2.0 NEW]
- Multi-Stage Approval: Business Owner -> Legal/Compliance -> Security -> Final (digital signature) — [V2.0 NEW]
- Contributor Experience: contributor portal, workroom, notifications
- Matching v1: skills-based recommendation + explainability fields
- Commercial Baseline: rate cards, task pricing, payout eligibility ledger, exports
- Observability: logging/metrics/alerts for critical services
- Pilot Execution: 2-3 pilot SOWs configured, executed, closed with acceptance packs

**Exit Criteria — [V2.0: expanded with new success criteria]:**
- All critical journeys pass UAT
- Security sign-off for SSO/RBAC/audit logs
- Pilot completion with accepted outcomes and exported financial reports
- **Hallucination Prevention Verification** — AI-generated SOWs pass all 8 defense layers with documented test results [V2.0 NEW]
- **Security and Ethics Gate Validation** — Prohibited content detection, risk scoring, and jurisdiction screening functional and tested [V2.0 NEW]
- **Manual Upload Processing 95%+ accuracy** — OCR + NLP extraction achieves 95%+ accuracy on test document corpus [V2.0 NEW]

### Phase 2 — Advanced Governance & Autonomous Economy (3-6 Months)
- APG (expanded orchestration + SLA automation)
- Proof-of-Delivery ledger + credential issuance
- Advanced fraud detection and trust scoring
- Dynamic pricing and incentives engine
- Expanded integrations (ERP/procurement, HRIS/LMS)
- Advanced AI governance (risk tiers, bias monitoring, model lifecycle)

### Phase 3 — Global Scale (6-12 Months)
- Multi-region deployments and DR maturity
- Multi-tenant scale hardening, performance engineering, SRE operating model
- Ecosystem programs expansion (students/women workforce) with broader partner model

---

## 24. TESTING & ACCEPTANCE (Section 25)

### Testing Types
- Unit, integration, system testing
- Performance, load, stress testing
- Security testing (SAST, DAST, penetration)
- UAT and pilot testing with live user cohorts

### MVP Acceptance Criteria (Section 25.3)

**Functional:**
- SOW ingestion succeeds for agreed formats, produces structured output — [V2.0: both AI-Generated and Manual Upload pathways]
- AI-Generated SOWs pass all 8 hallucination prevention layers [V2.0 NEW]
- Manual Upload achieves 95%+ OCR/NLP extraction accuracy [V2.0 NEW]
- Multi-stage approval workflow (Business Owner -> Legal -> Security -> Final) completes with digital signatures [V2.0 NEW]
- Ethics/security gates block prohibited content and flag high-risk SOWs [V2.0 NEW]
- Task plans created/edited/approved; task state machine works end-to-end
- Contributor onboarding + role assignment works for internal and invited external
- Matching returns ranked candidates with explainability fields
- Submission/review/acceptance completes with evidence pack export
- Pricing uses configured rate cards; payout eligibility triggered only on acceptance

**Non-Functional:**
- SSO works for all enterprise users; RBAC blocks unauthorized actions
- Audit logs exist for all critical actions, searchable/exportable
- Monitoring for uptime/error rates; incident workflow documented
- Accessibility: core journeys follow WCAG-aligned practices
- API documentation published in OpenAPI format; OAuth2/OIDC auth
- Confidence scoring consistently above 90% threshold for AI-generated content [V2.0 NEW]
- Risk scoring model (0-100) produces consistent, repeatable scores [V2.0 NEW]

---

## 25. KPIs (Section 27.3)

| Category | KPIs |
|----------|------|
| Operational | Task completion rate, average time to assignment, SLA compliance rate |
| Workforce | Contributor engagement levels, skill development progress, diversity/inclusion metrics |
| Economic | Average cost per task, platform transaction volume, contributor earnings growth |
| Quality | Acceptance rate of submitted work, rework percentages, customer satisfaction scores |

---

## 26. COMMERCIALS & CONSTRAINTS (Section 28)

**Licensing:** Per tenant, per active contributor, per project, or hybrid
**Assumptions:** Client provides timely access to systems/stakeholders/data; client ensures internal policy alignment for external contributors
**Constraints:** Cross-border work regulations; data residency in specific jurisdictions

**Exit & Transition (28.4):**
- Data export: contributor profiles, project records, task history, economic transactions
- Knowledge transfer documentation
- 90-day transition assistance period
- Data deletion post-transition per agreed policies

---

## 27. PLATFORM OWNERSHIP (Section 3.4)

**Glimmora International owns:**
- Agentic AI orchestration framework
- Global Talent Intelligence Graph
- Workforce Digital Twin framework
- Autonomous Delivery Economy engine
- GWOS
- Core microservice architecture

**Client owns:** Proprietary datasets, taxonomies, domain rules integrated into platform

**Client can customize:** Workflow configurations, policy frameworks, integration mappings, role definitions, custom dashboards/reporting (deployed as extensions, not ownership transfer)

---

## 28. SCALE TARGETS (Section 16.1)

- 1M+ contributors
- 100M+ tasks
- Thousands of concurrent enterprise clients at steady state
- Multi-region availability
- 99.9% uptime for core services
