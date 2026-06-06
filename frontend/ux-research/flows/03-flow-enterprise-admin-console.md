# Flow Document: Enterprise Admin Console

**Version:** 2.1
**Date:** 2026-03-09
**SOW Module:** Enterprise Admin Console (Section 19.1 + 3.1.6)
**Target Users:** Enterprise business owners, project sponsors, HR/Talent/L&D teams, procurement/finance controllers, PMO (Section 2.3)
**Basis:** Every flow in this document is derived from SOW V2.0. Section numbers are cited inline. Nothing is invented. V2.0 updates: Section B (SOW Management) rewritten for dual-mode SOW intake (AI-Generated + Manual Upload), multi-stage approval, and enhanced risk/compliance controls. Sections C-J unchanged (post-intake workflow is identical). V2.1 updates: UX audit corrections -- navigation restructured per UX principles (actions removed from sidebar, cognitive load reduced), SOW detail header actions refined (validation gating, confirmation modal for submission), SOW Repository columns/filters aligned to B1 spec.

---

## Table of Contents

- [A. Authentication & Access](#a-authentication--access)
- [B. SOW Management](#b-sow-management)
- [C. Task Decomposition & Planning](#c-task-decomposition--planning)
- [D. Team Formation & Assignment](#d-team-formation--assignment)
- [E. Project Monitoring](#e-project-monitoring)
- [F. Review & Acceptance (Enterprise Side)](#f-review--acceptance-enterprise-side)
- [G. Commercial & Billing](#g-commercial--billing)
- [H. Admin & Configuration](#h-admin--configuration)
- [I. Analytics & Intelligence](#i-analytics--intelligence-enterprise-scoped)
- [J. Audit & Compliance](#j-audit--compliance)

---

## Persona Reference

**Primary Persona:** Priya Nair -- Enterprise Project Sponsor / Procurement Lead (from UX Research Foundation, Part 2)
- Senior Manager, IT Procurement at mid-large enterprise (2,000+ employees), Mumbai, India
- Manages 15-20 active IT vendor contracts
- Compliance-obsessed: career depends on audit-readiness
- Skeptical of AI claims: needs concrete results before trusting
- SOW interpretation is the trust fulcrum: if the platform correctly interprets her SOW, she trusts the rest
- Budget-conscious, time-poor (6-8 meetings/day)
- Expects SSO login, CSV/PDF exports, enterprise-grade data density

---

## A. AUTHENTICATION & ACCESS

---

### A1: SSO Login Flow

**SOW References:** Section 3.1.MVP.8 (SSO integration -- SAML/OIDC, OAuth2-based API access, RBAC), Section 15.2 (MFA for privileged users)

**Entry Point:** User navigates to Enterprise Admin Console URL or clicks login link.

**Pre-conditions:**
- User has been registered as an enterprise user in the platform.
- Enterprise identity provider (IdP) configured for SSO (SAML/OIDC) by platform admin (Section 3.1.MVP.8).
- User has valid credentials in the enterprise IdP.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Login Page** | Platform logo, "Enterprise Admin Console" title, SSO login button ("Sign in with your organization"), optional email field for IdP discovery. | Click SSO button; enter email for IdP routing. |
| 2 | **IdP Redirect** | Browser redirects to enterprise identity provider login page (external). | User enters credentials (username/password, MFA if configured by IdP). |
| 3 | **IdP Authentication** | IdP authenticates user; SAML assertion or OIDC token returned to platform. | None -- automatic redirect. |
| 4 | **Platform Token Exchange** | Platform validates assertion/token, extracts identity, looks up RBAC role assignments. Loading indicator displayed. | None -- automatic processing. |
| 5a | **Success: Dashboard** | If user has enterprise role: redirect to Enterprise Dashboard (default landing). Session established with JWT. | User lands on Dashboard. |
| 5b | **Failure: Access Denied** | If user lacks enterprise role: "Access Denied -- You do not have permission to access the Enterprise Admin Console. Contact your administrator." | Link to contact support; return to login. |
| 5c | **Failure: IdP Error** | If IdP rejects credentials or is unreachable: error message with context. | Retry login; contact IT support. |

**Decision Points:**
- Step 4: Does user have an active enterprise role (business owner, project sponsor, PMO, procurement, finance, HR/Talent/L&D) in RBAC? YES -> 5a. NO -> 5b.
- Step 3: Does IdP authentication succeed? YES -> 4. NO -> 5c.

**Error/Edge Cases:**
- IdP session expired: user re-authenticates at IdP.
- Multiple roles: if user also has mentor or contributor roles, platform routes to Enterprise Admin Console based on URL accessed. Other workspaces accessible via workspace switcher.
- First-time login: platform creates local user record linked to IdP identity; default preferences initialized.
- MFA required by IdP: handled at IdP layer, transparent to platform.

**Exit Points:**
- Successful login -> Dashboard (Flow E1).
- Access denied -> user contacts administrator.
- IdP failure -> user retries or contacts IT support.

**Audit:** Login events logged immutably (Section 3.1.MVP.8): user ID, timestamp, IP address, authentication method, success/failure.

---

### A2: Role-Based Access -- What Enterprise Users See vs Don't See

**SOW References:** Section 3.1.MVP.8 (RBAC), Section 15.2 (least-privilege, Zero Trust), Section 3.1.6 (3 sub-consoles)

**Entry Point:** Authenticated user session with enterprise role.

**Pre-conditions:**
- User authenticated (Flow A1 completed).
- RBAC role assigned by platform admin (Section 3.1.MVP.3).

**What Enterprise Users CAN See:**

| Area | Data Visible | SOW Reference |
|------|-------------|---------------|
| SOW Management | SOW intake (AI-Generated wizard + Manual Upload), repository, detail, risk/compliance analysis, multi-stage approval, versions, export | 3.1.MVP.1, V2.0 |
| Task Decomposition | Planner UI: milestones, tasks, dependencies, skills tags, approval gates | 3.1.MVP.2 |
| Team Formation | Matching results, "why matched", team confirmation, admin override | 3.1.MVP.4 |
| Project Monitoring | Project/task/team status, SLA tracking, exceptions, throughput/quality views | 3.1.6 |
| Review & Acceptance | Evidence packs, acceptance decisions, rework tracking, acceptance logs export | 3.1.MVP.5 |
| Commercial & Billing | Rate card config, task pricing, payout eligibility, billing exports, invoices | 3.1.MVP.6, 3.1.7 |
| Admin & Config | Tenant setup, roles, policies (SLAs, pricing rules, governance), integrations, contributor management | 3.1.6 |
| Analytics | Workforce dashboards, economic dashboards, governance/risk dashboards, self-service analytics | 19.4, 3.1.6 |
| Audit Logs | Searchable/exportable audit trail for all critical actions | 3.1.MVP.8 |

**What Enterprise Users CANNOT See:**

| Area | Reason | SOW Reference |
|------|--------|---------------|
| Contributor personal identity beyond project context | Least-privilege, privacy by design | 15.1, 15.2 |
| Individual contributor earnings/payout amounts | Economic data scoped to contributor's own view | 3.1.5 |
| Other enterprises' SOWs, projects, or data | Tenant isolation | 15.2 |
| Mentor/reviewer queues or in-progress reviews | Scoped to Mentor & Reviewer Workspace | 19.3 |
| Internal platform configuration (cross-tenant) | Platform admin only | 3.1.6 |

**Role Variants Within the Console:**

| Role | Primary Access | SOW Reference |
|------|---------------|---------------|
| Project Sponsor / Business Owner | SOW management, task planning, team formation, project monitoring, review & acceptance | 19.1, 3.1.MVP.1-5 |
| Procurement / Finance Controller | Commercial & billing, rate cards, invoices, billing exports, economic dashboards | 3.1.MVP.6, 3.1.7, 3.1.6 |
| HR / Talent / L&D | Workforce intelligence dashboards, contributor management, skills analytics | 3.1.6, 3.1.MVP.3 |
| PMO / Operations | Project monitoring, exception management, throughput/quality views, analytics | 3.1.6 |

**Navigation Structure (V2.1 -- UX Audit Corrections):**

> **UX Principles Applied:**
> - Navigation = destinations (nouns), not actions (verbs). "New SOW" removed from sidebar -- it is a CTA button on the SOW Repository page header instead.
> - Progressive disclosure: sub-routes (SOW Detail, Approval Workflow) are drill-downs from list pages, not sidebar items.
> - Cognitive load (Miller's Law): no section exceeds 5 items. "Admin & Configuration" split into two sections. "Commercial & Billing" consolidated from 4 to 2 items.
> - Removed redundant entries: "Plan Approval" (filtered view of Decomposition, accessible via tab), "Team Confirmation" (drill-down from Matching Results).
> - Shortened labels for scannability.

```
Enterprise Admin Console
|-- Dashboard (default landing)
|-- SOW Management
|   |-- SOW Repository (contains "New SOW" CTA button -> Intake Mode Selector)
|   |   |-- [drill-down] SOW Detail
|   |   |-- [drill-down] Approval Workflow (progress tracker)
|   |   |-- [action] New SOW -> Intake Mode Selector (Flow B2)
|   |       |-- AI-Generated SOW (Parameter Wizard)
|   |       |-- Manual SOW Upload (DOC/PDF)
|-- Task Planning
|   |-- Decomposition (includes plan approval as tab/filter)
|-- Team Formation
|   |-- Matching Results (team confirmation is drill-down from here)
|   |-- Assignment Monitor
|-- Project Monitoring
|   |-- Project Portfolio
|   |-- Exceptions
|-- Review & Acceptance
|   |-- Evidence Review
|   |-- Acceptance Logs
|-- Billing
|   |-- Pricing (rate cards + task pricing consolidated)
|   |-- Billing & Invoices
|-- Administration
|   |-- Tenant Setup
|   |-- Roles & Access
|   |-- Policies
|   |-- Integrations
|   |-- Contributors
|-- Configuration
|   |-- SOW Intake Forms
|   |-- Clause Library
|   |-- SOW Templates
|   |-- Review Rubrics
|-- Analytics & Intelligence
|   |-- Workforce
|   |-- Economic
|   |-- Governance & Risk
|   |-- Self-service
|-- Audit Log
```

**Audit:** All access attempts (authorized and unauthorized) logged immutably (Section 3.1.MVP.8).

---

## B. SOW MANAGEMENT

**V2.0 Change Summary:** This section is significantly expanded from V1.1. SOW intake now supports two parallel pathways -- AI-Generated SOW (parameter wizard) and Manual Upload (enhanced with OCR, NLP, and gap analysis). A multi-stage approval workflow replaces the simple draft/approved toggle. Risk scoring, hallucination prevention controls, ethics screening, and data sensitivity classification are new cross-cutting concerns. 9 flows total (B1-B9), up from 7 in V1.1.

---

### B1: SOW Repository -- Browse, Search, Filter

**SOW References:** Section 3.1.MVP.1 (SOW repository + search + export), SOW V2.0 (dual intake modes)

**Entry Point:** Enterprise Admin Console > SOW Management > SOW Repository.

**Pre-conditions:**
- User authenticated with enterprise role.
- At least one SOW exists in the system (otherwise empty state).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **SOW Repository** | Page header: title "SOW Repository" + "New SOW" CTA button (primary action, links to Intake Mode Selector B2). Summary cards row: Total SOWs, Pending Action (review/approval count), Approved, Avg Risk Score, Total Budget. Table/list of all SOWs accessible to the user's tenant. Columns: Title (with SOW ID as secondary text), Client, **Intake Mode** (badge: "AI-Generated" / "Manual Upload"), Status (Draft / In Review / Approved / Rejected), **Data Sensitivity Classification** (badge: Public/Internal/Confidential/Restricted), Risk Score (0-100, color-coded), Version, Last Modified. Sortable column headers with ascending/descending indicators. Pagination controls shown only when items exceed page size. Default sort: most recently modified (descending). | Browse list; search; filter; sort by clicking column headers; click row to view detail (Flow B6); click "New SOW" button to start intake (Flow B2). |
| 2 | **Search** | Search bar at top. Searches across: SOW title, client name, SOW ID, deliverables text, stakeholder names. | Type search query; results filter in real-time or on submit. |
| 3 | **Filters** | Filter panel (sidebar or dropdown): Status (Draft / In Review / Approved / Rejected / All), **Intake Mode (AI-Generated / Manual Upload / All)**, Date range (created / modified), Data Sensitivity Classification, Risk Score range (Low 0-25 / Medium 26-50 / High 51-75 / Critical 76-100), Client/stakeholder. | Apply/clear filters; combine multiple filters. |
| 4 | **Sort** | Clickable column headers for sorting. Sort indicators (ascending/descending). | Sort by any column including Intake Mode and Risk Score. |
| 5 | **SOW Row Click** | Navigates to SOW Detail View (Flow B6). | View full SOW detail. |

**Decision Points:**
- Step 1: Any SOWs exist? YES -> display list. NO -> empty state with "Create your first SOW" call-to-action linking to Intake Mode Selector (Flow B2).

**Error/Edge Cases:**
- No search results: "No SOWs match your search. Try different keywords or clear filters."
- Large number of SOWs: pagination (configurable page size), performance optimization.
- Confidential/Restricted SOWs: only visible to users with appropriate access level (RBAC + data sensitivity-based access).

**Exit Points:**
- Click SOW -> Flow B6 (SOW Detail View).
- Click "New SOW" -> Flow B2 (Intake Mode Selector).

**Audit:** Repository access logged: user ID, timestamp, search queries, filters applied.

---

### B2: SOW Intake Mode Selector

**SOW References:** SOW V2.0 (dual intake pathways -- AI-Generated vs Manual Upload)

**Entry Point:** Enterprise Admin Console > SOW Management > "New SOW" button, OR SOW Repository > "New SOW".

**Pre-conditions:**
- User authenticated with enterprise role (Flow A1).
- User has SOW creation authority (RBAC).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Intake Mode Selection Page** | Page title: "Create New SOW -- Choose Your Intake Method". Two large visual cards side by side, each with icon, title, description, and CTA button. | Select one of the two intake modes. |
| 2a | **Card: AI-Generated SOW** | Icon: sparkle/magic wand. Title: "AI-Generated SOW". Description: "Answer a guided parameter wizard and let our AI generate a complete, standards-compliant SOW document. Includes built-in guardrails, hallucination prevention, and risk scoring. Best for: new SOWs, standard project types, teams without pre-existing SOW documents." Badge: "Recommended". CTA: "Start Wizard". | Click "Start Wizard" -> Flow B3 (AI Parameter Wizard). |
| 2b | **Card: Manual Upload** | Icon: upload/document. Title: "Manual SOW Upload". Description: "Upload an existing SOW document (DOCX, PDF, DOC). Our AI will parse, extract clauses, identify gaps, and score completeness. Best for: existing SOW documents, highly customized projects, enterprise templates." CTA: "Upload Document". | Click "Upload Document" -> Flow B5 (Manual SOW Upload). |
| 3 | **Contextual Help** | Collapsible FAQ section below cards: "Which method should I choose?", "Can I switch methods later?", "What file formats are supported for manual upload?". | Expand/collapse FAQ items. |

**Decision Points:**
- Step 1: Which intake mode? AI-Generated -> Flow B3. Manual Upload -> Flow B5.

**Error/Edge Cases:**
- User unsure which method to use: contextual help section provides guidance.
- One method temporarily unavailable (e.g., AI service down): card shows "Temporarily unavailable" with alternative method highlighted.

**Exit Points:**
- AI-Generated selected -> Flow B3 (AI Parameter Wizard).
- Manual Upload selected -> Flow B5 (Manual SOW Upload).
- Cancel -> return to SOW Repository (Flow B1).

**Audit:** Intake mode selection logged: user ID, timestamp, mode selected.

---

### B3: AI Parameter Wizard

**SOW References:** SOW V2.0 (AI-generated SOW via parameter wizard, template selection, clause library, guardrail status, 10-step progressive wizard)

**Entry Point:** Intake Mode Selector (Flow B2) > "Start Wizard".

**Pre-conditions:**
- User authenticated with enterprise role.
- AI SOW generation service available.
- Template library and clause library loaded.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Wizard Layout** | Three-column layout: LEFT = template selection sidebar (browse/search templates by industry, project type, complexity); CENTER = active wizard step form; RIGHT = guardrail status panel (indicators for each constraint category, updating as wizard progresses). Top: progress indicator showing current step out of 10, step names, completion percentage. | Navigate between steps; select template; monitor guardrails. |
| 2 | **Step 1: Business Context & Project Objectives** | Form fields: Project title, Business context (rich text), Primary objectives (multi-entry list), Success criteria, Industry/domain (dropdown), Project type (dropdown with template suggestions). Template sidebar highlights relevant templates based on selections. | Fill fields; select template to pre-fill; save draft; next step. |
| 3 | **Step 2: Commercial Terms** | Form fields: Total budget (amount + currency), Pricing model (fixed price / time & materials / outcome-based / hybrid), Payment terms (milestone-based / monthly / on acceptance), Payment schedule details, Cost center / GL code mapping. Guardrail: budget reasonability check against template benchmarks. | Fill fields; next/previous step. |
| 4 | **Step 3: Scope Boundaries** | Form fields: In-scope items (multi-entry with descriptions), Out-of-scope exclusions (multi-entry), Assumptions (multi-entry), Constraints (multi-entry). Guardrail: scope completeness indicator (warns if exclusions are empty or assumptions are missing). | Fill fields; use clause library to add standard scope items; next/previous step. |
| 5 | **Step 4: Delivery Model** | Form fields: Delivery phases (multi-entry with phase name, description, duration), Milestones (linked to phases), Acceptance criteria per milestone (multi-entry), Definition of done. Guardrail: timeline reasonability check (flags unrealistic durations relative to scope). | Fill fields; next/previous step. |
| 6 | **Step 5: Ethical Constraints** | Form fields: Non-discrimination requirements (checkboxes + free text), Labor standards compliance (dropdown: ILO/local regulations/custom), Accessibility requirements (WCAG level selection), Environmental considerations, Diversity targets (optional). Guardrail: minimum ethical constraints must be specified (cannot skip entirely). | Fill fields; accept defaults from template; next/previous step. |
| 7 | **Step 6: Security Classification** | Form fields: Data sensitivity level (radio: Public / Internal / Confidential / Restricted), Handling requirements per classification level (auto-populated from platform policy, editable), Data residency requirements (region selection), Encryption requirements. Guardrail: classification must be explicitly selected (no default). | Select classification; review handling requirements; next/previous step. |
| 8 | **Step 7: Privacy Posture** | Form fields: Personal data involved (yes/no + categories), GDPR/CCPA/local privacy law applicability, Data subject rights requirements, Data processing agreement needed (yes/no), Privacy impact assessment status. Guardrail: if personal data = yes, privacy controls are mandatory. | Fill fields; next/previous step. |
| 9 | **Step 8: Regulatory Expectations** | Form fields: Applicable regulations (multi-select from industry-specific list + free text), Compliance certifications required (ISO, SOC2, etc.), Audit requirements, Regulatory reporting obligations. Guardrail: regulatory expectations cross-checked against industry/domain from Step 1. | Fill fields; next/previous step. |
| 10 | **Step 9: Risk Appetite** | Form fields: Overall risk tolerance (slider: Conservative / Moderate / Aggressive), Acceptable delivery delay threshold (percentage), Quality threshold (minimum acceptance rate), Budget overrun tolerance (percentage), Escalation triggers (configurable thresholds). Guardrail: risk appetite informs risk scoring thresholds for the generated SOW. | Set parameters; next/previous step. |
| 11 | **Step 10: Approval Authorities** | Form fields: Business owner approver (user selector), Legal/compliance reviewer (user selector), Security reviewer (user selector), Final approver (user selector), Approval delegation rules (if approver unavailable). Guardrail: at least business owner and final approver must be specified. | Select approvers; configure delegation; next/previous step. |
| 12 | **Clause Library Browser** | Accessible from any step via sidebar toggle. Searchable library of standard clauses organized by category (liability, IP, confidentiality, SLA, warranty, termination). Each clause: title, text, usage count, last updated. | Search clauses; preview; insert into relevant wizard step; customize inserted clause. |
| 13 | **Wizard Summary & Generate** | Full summary of all wizard inputs across 10 steps. Guardrail status panel: all indicators shown (green = met, yellow = warning, red = missing/invalid). Editable -- click any section to jump back to that step. "Generate SOW" button (enabled only when all required guardrails are green). | Review summary; edit any section; generate SOW draft. |
| 14 | **AI Generation Processing** | Processing screen: "Generating your SOW..." with progress stages: "Applying template...", "Generating clauses...", "Running guardrail checks...", "Scoring risk...", "Finalizing document...". Estimated time indicator. | Wait; cancel (returns to summary with inputs preserved). |

**Decision Points:**
- Steps 2-11: At each step, user can proceed forward, go back, or save draft and return later.
- Step 12: Clause library is optional but available at any point.
- Step 13: All required guardrails must be green to generate. Yellow guardrails generate with warnings. Red guardrails block generation until resolved.
- Step 14: Generation complete -> Flow B4 (AI Draft Review).

**Error/Edge Cases:**
- Partial wizard completion: "Save Draft" available at any step. Draft accessible from SOW Repository with status "Draft (Wizard Incomplete)".
- Template not found for industry/type: wizard proceeds without template pre-fill; user fills all fields manually.
- Clause library empty or unavailable: wizard continues without clause suggestions; warning displayed.
- AI generation fails: error message with retry option; fallback to manual upload suggested.
- Session timeout during wizard: auto-save triggered; user can resume from last saved step.
- Very complex SOW (many phases/milestones): wizard supports unlimited entries but warns above 20 milestones "Consider breaking into multiple SOWs."

**Exit Points:**
- Generation complete -> Flow B4 (AI Draft Review).
- Save draft -> SOW Repository with incomplete wizard status.
- Cancel -> return to SOW Repository.

**Audit:** Wizard events logged: user ID, timestamp, SOW ID, each step completion, template selected, clauses inserted, guardrail status at generation time, generation trigger.

---

### B4: AI Draft Review

**SOW References:** SOW V2.0 (AI-generated draft review, 8-layer hallucination prevention, red-flag detection, risk scoring, risk-based routing, side-by-side template comparison)

**Entry Point:** Automatic redirect after AI generation completes (Flow B3, Step 14).

**Pre-conditions:**
- AI-generated SOW draft exists.
- Hallucination prevention checks completed.
- Risk scoring completed.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Draft Review Header** | SOW title (generated), status: "AI Draft -- Pending Review", confidence score (percentage, e.g., "92% confidence"), intake mode badge: "AI-Generated". Risk score (0-100) with color-coded severity (Green 0-25, Yellow 26-50, Orange 51-75, Red 76-100). Risk-based routing indicator: Low -> self-review sufficient, Medium -> peer review recommended, High -> legal review required, Critical -> executive review mandatory. | View details; begin review; export draft. |
| 2 | **Hallucination Prevention Status** | 8-layer hallucination prevention panel, each layer with status indicator (green checkmark / yellow warning / red alert): Layer 1: Source grounding (all generated text traceable to wizard inputs), Layer 2: Template conformity (structure matches selected template), Layer 3: Clause validity (all clauses from approved library or flagged as custom), Layer 4: Numerical consistency (budgets, dates, quantities internally consistent), Layer 5: Regulatory alignment (generated terms match regulatory expectations), Layer 6: Cross-reference integrity (internal references within document are valid), Layer 7: Semantic coherence (no contradictory statements detected), Layer 8: Completeness check (all required SOW sections present). Overall status: "All Clear" / "Warnings Detected" / "Issues Found". | Click any layer for detailed findings; dismiss warnings with justification; fix issues. |
| 3 | **Risk Score Breakdown** | Risk score (0-100) with weighted breakdown: Completeness (30% weight): are all required sections present and populated? Confidence (25% weight): AI confidence in generated content accuracy. Compliance (25% weight): alignment with regulatory/ethical/security requirements. Pattern Match (20% weight): similarity to historically successful SOWs. Each factor scored individually with drill-down detail. | View breakdown; understand which factors drive risk score; take action on low-scoring areas. |
| 4 | **Red-Flag Detections** | Highlighted sections in the generated document where potential issues were detected: ambiguous language flagged in yellow, missing required clauses flagged in red, unusual terms flagged in orange, prohibited clause patterns detected and flagged with explanation. Each flag: location in document, severity, description, suggested remediation. | Review each flag; accept/dismiss with reason; edit flagged section; add manual annotation. |
| 5 | **Side-by-Side Template Comparison** | Two-panel view: LEFT = generated SOW document (scrollable, editable); RIGHT = template document used as basis. Differences highlighted: additions (green), deviations from template (yellow), missing template sections (red). Synchronized scrolling between panels. | Scroll; click difference to review; accept template language; keep generated language; edit either panel. |
| 6 | **Ethics Screening Status** | Panel showing ethics screening results: non-discrimination language present (pass/fail), labor standards referenced (pass/fail), accessibility requirements addressed (pass/fail), prohibited terms scan (pass/fail with findings). | Review each screening result; fix failed items; dismiss false positives with justification. |
| 7 | **Data Sensitivity Classification Badge** | Prominent badge showing selected data sensitivity level (from wizard Step 6). Handling requirements summary. Warning if classification appears inconsistent with SOW content (e.g., personal data mentioned but classification is "Public"). | Verify classification; change if needed (returns to classification review). |
| 8 | **Document Editor** | Full document view with inline editing capabilities. Track changes mode available. Section navigation sidebar. Comment/annotation tools. | Edit any section; add comments; track changes; accept/reject AI suggestions. |
| 9 | **Review Actions** | Action bar: "Approve Draft & Submit for Approval" (proceeds to multi-stage approval -- Flow B7), "Save as Draft" (preserves edits, returns to repository), "Regenerate" (returns to wizard with inputs preserved for modification), "Reject & Discard" (permanently discards generated draft). | Select action. |

**Decision Points:**
- Step 2: Any red hallucination prevention layers? YES -> must resolve before approval submission. Yellow -> can proceed with acknowledgment. Green -> proceed.
- Step 4: Red flags present? Must review all before submission. Can dismiss with justification.
- Step 9: Ready for approval? YES -> Flow B7. Need more work? Save as draft. Fundamentally wrong? Regenerate or discard.

**Error/Edge Cases:**
- All 8 hallucination layers red: "Generated draft has significant issues. Consider regenerating with revised parameters or switching to manual upload."
- Risk score > 75 (Critical): mandatory legal/compliance review before any approval can proceed.
- Editor loses connection during review: auto-save every 30 seconds; recovery on reconnect.
- Template comparison not available (no template selected in wizard): right panel shows "No template selected" with option to select one now for comparison.
- Regeneration requested: wizard opens with all previous inputs preserved; user can modify and regenerate.

**Exit Points:**
- Submit for approval -> Flow B7 (Multi-Stage Approval Workflow).
- Save as draft -> SOW Repository.
- Regenerate -> Flow B3 (AI Parameter Wizard, inputs preserved).
- Discard -> SOW Repository (draft deleted).

**Audit:** Draft review events logged: user ID, timestamp, SOW ID, hallucination layer statuses, red flags reviewed/dismissed, risk score at review time, edits made (before/after), final action taken.

---

### B5: Manual SOW Upload (Enhanced)

**SOW References:** Section 3.1.MVP.1 (SOW ingestion via UI -- DOC/PDF upload), Section 3.1.MVP.7 (SOW Intake Assistant), SOW V2.0 (OCR processing, NLP parsing, gap analysis, template comparison, risk annotations, completeness scoring, remediation recommendations)

**Entry Point:** Intake Mode Selector (Flow B2) > "Upload Document".

**Pre-conditions:**
- User authenticated with enterprise role (Flow A1).
- User has SOW document in DOCX, PDF, or DOC format ready for upload.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Upload Page** | Page title: "Manual SOW Upload". Instructions: "Upload your existing SOW document for AI-powered analysis." Supported formats list: DOCX, PDF, DOC. Max file size indicator. | Proceed to upload area. |
| 2 | **Drag-and-Drop Upload** | Large drag-and-drop zone with dotted border. "Drag your SOW document here or click to browse" with file browser button. Accepted formats displayed inline. Animated upload indicator. | Drag file into zone; click to browse file system; select file. |
| 3 | **File Validation** | System validates file format, size, and integrity. Progress bar during upload. | None -- automatic validation. |
| 3a | **Validation Failure** | If file is wrong format or exceeds size: error message specifying the issue ("Unsupported format. Please upload DOCX, PDF, or DOC."). | Select different file; retry. |
| 4 | **OCR Processing Status** | If PDF (especially scanned): OCR processing indicator with stages: "Detecting document type...", "Running OCR...", "Extracting text layers...". OCR confidence score displayed upon completion. Warning if low confidence: "Scanned document detected. OCR confidence: X%. Some sections may require manual review." | Wait; cancel. |
| 5 | **NLP Parsing Progress** | Multi-stage NLP parsing progress: Stage 1: "Identifying document structure..." (sections, headings, paragraphs). Stage 2: "Extracting clauses..." (scope, deliverables, terms, conditions). Stage 3: "Tagging clause types..." (dependencies, assumptions, constraints, acceptance criteria). Stage 4: "Running semantic analysis...". Each stage shows progress bar and extracted item count. | Wait; view partial results as they appear. |
| 6 | **Extracted Clauses Review** | Two-panel layout: LEFT = original document preview (scrollable, with highlighted extracted sections); RIGHT = extracted clauses organized by category: metadata (title, dates, stakeholders), deliverables, dependencies, assumptions, constraints, commercial terms, acceptance criteria. Each clause shows: extracted text, confidence level (high/medium/low), source location in document (click to highlight in left panel). | Review each clause; edit extracted text; accept/reject AI extraction; add missing clauses manually; re-run extraction for specific sections. |
| 7 | **Gap Analysis Results Panel** | Gap analysis comparing uploaded SOW against platform SOW standard template. Missing sections highlighted in red with severity: Critical (must have), Important (should have), Optional (nice to have). Each gap: section name, description of what's missing, impact statement. Gap count summary: "X critical gaps, Y important gaps, Z optional gaps." | View each gap; add missing content inline; dismiss optional gaps; generate remediation suggestions. |
| 8 | **Template Comparison Side-by-Side** | Two-panel view: LEFT = uploaded SOW (parsed); RIGHT = closest matching template from library. Alignment analysis: matched sections (green), extra sections in SOW (blue), missing sections from template (red). Synchronized scrolling. | Compare section by section; adopt template language for missing sections; keep original language; merge content. |
| 9 | **Risk Annotations Overlay** | Risk annotations overlaid on the document preview: ambiguous clauses (yellow highlight), potentially problematic terms (orange highlight), liability concerns (red highlight), missing standard protections (red underline). Each annotation: risk type, severity, explanation, suggested remediation. Aggregate risk score (0-100) with breakdown matching AI-generated SOW scoring: Completeness 30%, Confidence 25%, Compliance 25%, Pattern Match 20%. | Review each annotation; accept suggestion; dismiss with reason; edit clause. |
| 10 | **Completeness Scoring** | Overall completeness score (percentage) with section-by-section breakdown: metadata (X%), scope (X%), commercial (X%), delivery (X%), legal (X%), compliance (X%). Progress bar for each section. Threshold indicator: "Minimum recommended completeness: 80%." | View breakdown; address low-scoring sections; accept current score. |
| 11 | **Remediation Recommendations** | AI-generated recommendations panel: ordered by priority (critical first). Each recommendation: what's missing, why it matters, suggested text (insertable), source template/clause library reference. "Apply All Recommendations" bulk action. | Review each recommendation; apply individually; apply all; dismiss; customize suggested text before applying. |
| 12 | **Save & Proceed** | Summary: completeness score, risk score, gap count, applied remediations. SOW status: "Draft". Actions: submit for approval or save as draft. | Submit for approval (Flow B7); save as draft; return to repository. |

**Decision Points:**
- Step 3: File valid? YES -> Step 4. NO -> Step 3a.
- Step 4: OCR needed (scanned PDF)? YES -> OCR processing. NO -> skip to NLP parsing.
- Step 7: Critical gaps found? User must address before proceeding to approval.
- Step 10: Completeness below 80%? Warning displayed; user can still proceed but with acknowledgment.
- Step 12: Ready for approval? YES -> Flow B7. Need more work? Save as draft.

**Error/Edge Cases:**
- Corrupt file: "Unable to process document. Please check file integrity and retry."
- Very large document (100+ pages): extended processing with progress indicator; timeout after configurable limit with notification.
- Scanned PDF with very low OCR confidence (<50%): "Document quality too low for automated extraction. Consider resubmitting a higher-quality scan or using the AI-Generated SOW wizard instead."
- Upload interrupted (network): system detects incomplete upload, prompts retry. Partial uploads cleaned up automatically.
- NLP parsing fails on section: that section flagged for manual review; other sections processed normally.
- No matching template found: template comparison panel shows "No matching template found. Gap analysis performed against platform standard."
- Non-English document: language detection with warning "Non-English document detected. Extraction accuracy may be reduced."

**Exit Points:**
- Submit for approval -> Flow B7 (Multi-Stage Approval Workflow).
- Save as draft -> SOW Repository.
- Cancel -> return to SOW Repository.

**Audit:** Upload and processing events logged: user ID, timestamp, file name, file hash, OCR confidence, NLP extraction results count, gap analysis results, completeness score, risk score, remediations applied, final action taken.

---

### B6: SOW Detail View (Enhanced)

**SOW References:** Section 3.1.MVP.1 (SOW repository, SOW versioning, audit history), SOW V2.0 (intake mode, confidence score, hallucination controls, risk scoring, ethics screening, data sensitivity, prohibited clause detection)

**Entry Point:** SOW Repository (Flow B1) > click SOW row, OR direct link from notification/dashboard.

**Pre-conditions:**
- SOW exists and user has access (RBAC + tenant isolation).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **SOW Detail Header** | SOW title, ID, status badge (Draft / In Review / Approved / Rejected), version number, **Intake Mode badge** ("AI-Generated" with sparkle icon / "Manual Upload" with document icon), **Data Sensitivity Classification badge** (color-coded: Public/Internal/Confidential/Restricted), **Risk Score** (0-100, color-coded), created/modified dates, creator/approver names. **Status-aware header actions:** (a) Draft + NOT validated (parsedSections = 0): "Continue Setup" button linking to intake flow (AI wizard or upload page depending on intakeMode). (b) Draft/Review + validated (parsedSections > 0): "Submit for Approval" button -- opens confirmation modal on this page (Flow B7 Step 1), does NOT navigate to approve page. (c) In Approval: "View Approval Progress" button linking to approval progress tracker page. (d) Approved + has planId: "View Plan" button linking to decomposition plan. (e) Approved + no planId: "Start Decomposition" button linking to decomposition flow. | Status-aware actions as described; edit (if Draft); export; view versions; view audit history. |
| 2 | **Metadata Tab** | All extracted/entered metadata: title, dates, stakeholders, data sensitivity classification, deliverables list, budget/commercial terms, ethics constraints, regulatory expectations. | Edit fields (creates new draft version if currently Approved). |
| 3 | **Clauses Tab** | Tagged clauses: dependencies, assumptions, constraints, acceptance criteria, ethical requirements, security requirements. Each clause with its tag type and source location in document. **Prohibited Clause Detection results**: list of any detected prohibited patterns with explanations. | View clause detail; add/edit/remove tags; review prohibited clause findings. |
| 4 | **Document Tab** | Original uploaded document preview (if Manual Upload) OR generated document preview (if AI-Generated). Scrollable, searchable. | Scroll; search within document; download original/generated document. |
| 5 | **AI Analysis Tab** (conditional) | Visible only for AI-Generated SOWs: **Confidence score** (percentage with breakdown), **Hallucination prevention controls panel** (8-layer status from Flow B4), **Generation parameters** (wizard inputs summary -- what the user specified), **Template used** (link to template). Visible for Manual Upload SOWs: **Completeness score**, **Gap analysis results**, **Remediation history**. | View analysis details; re-run analysis; export analysis report. |
| 6 | **Risk & Compliance Tab** | **Risk score display** with breakdown (Completeness 30%, Confidence 25%, Compliance 25%, Pattern Match 20%). **Ethics screening status** (pass/fail per criterion with detail). **Data sensitivity classification** with handling requirements. **Regulatory alignment** status. | View risk breakdown; drill into each factor; export compliance summary. |
| 7 | **Approval Status Tab** | Multi-stage approval workflow status (Flow B7): current stage, completed stages with approver and timestamp, pending stages, rejection history (if any). Comments/notes per stage. | View approval progress; add comments (if authorized); recall submission. |
| 8 | **Versions Tab** | List of all versions: version number, status, date, author, change summary, **intake mode indicator per version** (which versions were AI-generated vs manually uploaded). | Click to view any historical version; compare versions side-by-side (Flow B8). |
| 9 | **Audit History Tab** | Chronological audit trail: all events related to this SOW (creation, intake mode, wizard steps, upload, extraction, edits, approval stages, decomposition trigger). Each entry: timestamp, user, action, details. | Filter audit events by type; export audit log. |
| 10 | **Linked Projects Tab** | Projects created from this SOW (if any). Project name, status, progress. | Click to navigate to Project Detail (Flow E2). |

**Decision Points:**
- Is SOW in Draft status? YES -> edit/submit-for-approval actions available. NO (Approved) -> editing creates new draft version.
- Has decomposition been started? YES -> "View Task Plan" link shown. NO -> "Start Decomposition" button shown (only if Approved).
- Which AI Analysis to show? Determined by Intake Mode (AI-Generated vs Manual Upload).

**Error/Edge Cases:**
- SOW deleted/archived by another user: "This SOW is no longer available" message.
- Version comparison with different intake modes (one AI-generated, one manual): comparison still possible; intake mode difference highlighted.
- Hallucination prevention data unavailable for older SOWs (pre-V2.0): tab shows "Analysis not available for SOWs created before V2.0."

**Exit Points:**
- Navigate to decomposition (Flow C1, if Approved).
- Navigate to linked project (Flow E2).
- Return to SOW Repository (Flow B1).
- Submit for approval (Flow B7).
- Export SOW (Flow B9).

**Audit:** SOW detail view logged: user ID, timestamp, SOW ID, tabs accessed.

---

### B7: Multi-Stage Approval Workflow

**SOW References:** Section 3.1.MVP.1 (SOW versioning -- draft/approved, audit history), SOW V2.0 (multi-stage approval: business owner, legal/compliance, security, final; rejection routing with remediation; stage progress tracker)

**Entry Point:** SOW Detail View (Flow B6) > "Submit for Approval" button, OR AI Draft Review (Flow B4) > "Approve Draft & Submit for Approval", OR Manual Upload (Flow B5) > "Submit for Approval".

**Pre-conditions:**
- SOW exists in "Draft" status.
- All critical guardrails/gaps addressed (no red blockers).
- Approval authorities configured (either from wizard Step 10 or from enterprise admin settings).
- User has submission authority (RBAC).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Submission Confirmation** | Modal: "Submit SOW for Multi-Stage Approval?" Summary: SOW title, risk score, completeness score, data sensitivity classification. Approval stages listed: Stage 1 (Business Owner), Stage 2 (Legal & Compliance), Stage 3 (Security), Stage 4 (Final Approval). Estimated timeline based on historical average approval times. | Confirm submission; cancel; edit SOW before submitting. |
| 2 | **Stage Progress Tracker** | Horizontal progress bar showing all 4 stages: Stage 1: Business Owner Review (current/pending/complete), Stage 2: Legal & Compliance Review, Stage 3: Security Review, Stage 4: Final Approval. Current stage highlighted and expanded. Estimated time remaining per stage. Status changes to "In Review". | View progress; monitor; add comments. |
| 3 | **Stage 1: Business Owner Review** | Reviewer: designated business owner. Review panel: full SOW content, risk score, deliverables summary, commercial terms, timeline. Reviewer can add comments/annotations to any section. Decision options: "Approve & Advance to Stage 2" (green), "Request Changes" (yellow, with mandatory feedback), "Reject" (red, with mandatory reason). | Review SOW; annotate; approve/request changes/reject. |
| 4 | **Stage 2: Legal & Compliance Review** | Reviewer: designated legal/compliance reviewer. Review panel: full SOW with **annotation capabilities** (inline comments, clause-level notes, tracked suggestions). Focus areas highlighted: liability clauses, IP terms, confidentiality, regulatory compliance, ethical constraints, prohibited clause detections. Legal-specific checklist: "Terms acceptable (Y/N)", "Liability limited (Y/N)", "IP ownership clear (Y/N)", "Regulatory alignment confirmed (Y/N)". Decision: Approve / Request Changes / Reject (with mandatory notes per checklist item). | Annotate document; complete checklist; approve/request changes/reject. |
| 5 | **Stage 3: Security Review** | Reviewer: designated security reviewer. Review panel: focus on **data classification verification** (confirm or change classification assigned during intake). Security-specific checklist: "Data sensitivity classification appropriate (Y/N)", "Data handling requirements adequate (Y/N)", "Access control requirements defined (Y/N)", "Encryption requirements specified (Y/N)", "Data residency compliance (Y/N)". Decision: Approve / Request Changes / Reject. | Verify classification; complete checklist; approve/request changes/reject. |
| 6 | **Stage 4: Final Approval** | Reviewer: designated final approver (typically executive or delegate). Summary view: all previous stage decisions and comments. SOW content. Risk summary. **Digital signature capture** (typed name + timestamp, or certificate-based signature if configured). Decision: "Final Approve" (with digital signature) / "Send Back" (to specific stage with reason). | Review all stages; sign; approve/send back. |
| 6a | **Final Approval Confirmed** | SOW status changes to "Approved". Version number finalized (e.g., v1.0). Digital signature recorded with timestamp. All stakeholders notified. SOW now eligible for decomposition (Flow C1). | View approved SOW; proceed to decomposition; share with stakeholders. |
| 7 | **Rejection Routing** | If any stage rejects or requests changes: SOW status changes to "Changes Requested" (for rework) or "Rejected" (for terminal rejection). Feedback and remediation requirements displayed to SOW creator. Specific sections needing attention highlighted. Rejection reason, stage, reviewer all recorded. | View feedback; edit SOW to address feedback; resubmit (returns to Stage 1 or the rejecting stage, per configuration); abandon SOW. |
| 8 | **Stage Comments & Notes** | Each stage has a comments/notes panel: reviewer comments, creator responses, threaded discussion. Visible to all parties in the approval chain. Timestamped and attributed. | Add comment; reply to comment; tag reviewer; attach supporting document. |

**Decision Points:**
- Step 1: Confirm submission? YES -> Step 2. NO -> return to SOW detail.
- Steps 3-6: Each stage: Approve -> next stage. Request Changes -> Step 7 (rejection routing). Reject -> Step 7 (terminal).
- Step 6: Final approve? YES -> Step 6a. Send back? -> specific earlier stage.
- Step 7: After addressing feedback: resubmit -> restart at appropriate stage. Abandon -> SOW archived.

**Error/Edge Cases:**
- Reviewer unavailable: delegation rules apply (configured in wizard Step 10 or admin settings). Backup reviewer notified after configurable timeout. Escalation to next-level reviewer if no response.
- All stages approved except one: SOW waits at blocking stage. Progress tracker shows exactly where blocked.
- Concurrent approval and editing: if SOW edited after submission, reviewers notified "SOW content changed since your review began. Please re-review."
- Stage skipping: configurable per enterprise. Some enterprises may skip security review for "Public" classification SOWs. Skip requires admin configuration, not ad-hoc.
- Resubmission after changes: system tracks resubmission count. After 3 rejections from same stage, system flags for escalation.
- Digital signature infrastructure unavailable: fallback to typed name + timestamp + checkbox "I confirm this is my electronic approval."

**Exit Points:**
- All stages approved -> SOW status "Approved", eligible for Flow C1 (Decomposition).
- Rejected -> SOW status "Rejected" or "Changes Requested".
- Resubmitted -> restart approval process.

**Audit:** Each approval stage logged immutably: SOW ID, stage number, reviewer user ID, decision, comments, annotations, digital signature data, timestamp. Rejection routing logged: reason, feedback, resubmission count.

---

### B8: Version Comparison

**SOW References:** Section 3.1.MVP.1 (SOW versioning, audit history), SOW V2.0 (intake mode indicator per version)

**Entry Point:** SOW Detail View (Flow B6) > Versions Tab > "Compare Versions" button.

**Pre-conditions:**
- SOW has at least two versions.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Version Selector** | Dropdown selectors for "Compare Version A" and "Compare Version B". Each version shows: version number, status, date, author, **intake mode** (AI-Generated / Manual Upload). Default: latest two versions selected. | Select any two versions. |
| 2 | **Side-by-Side Comparison** | Two-panel view: LEFT = Version A; RIGHT = Version B. Diff highlighting: added text (green), removed text (red), modified text (yellow). Section-by-section navigation. **Intake mode badge** on each panel showing how that version was created. | Scroll; navigate by section; toggle diff highlights; switch between unified and side-by-side view. |
| 3 | **Change Summary** | Summary panel: total sections changed, total clauses added/removed/modified, metadata changes, risk score changes between versions, intake mode change (if applicable, e.g., v1 was AI-Generated, v2 was manually edited). | View summary; export comparison; close. |

**Decision Points:**
- Step 1: Which versions to compare? User selects.

**Error/Edge Cases:**
- Only one version exists: "Compare" button disabled with tooltip "At least two versions required for comparison."
- Very large version diff: section-by-section loading; summary-first view.
- Comparing AI-Generated vs Manual Upload versions: differences may be structural; system notes "Versions use different intake methods -- structural differences expected."

**Exit Points:**
- Comparison reviewed -> return to SOW Detail (Flow B6).
- Export comparison -> download as PDF.

**Audit:** Version comparison logged: user ID, timestamp, SOW ID, versions compared.

---

### B9: SOW Export

**SOW References:** Section 3.1.MVP.1 (SOW repository + export)

**Entry Point:** SOW Detail View (Flow B6) > "Export" button, OR SOW Repository (Flow B1) > bulk export.

**Pre-conditions:**
- SOW exists and user has access.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Export Options** | Modal/dropdown: Export format selection (PDF, CSV). Content selection: "Full SOW (metadata + clauses + risk analysis + audit)", "Metadata only", "Risk & Compliance report only", "Audit history only". Version selection: current or specific version. Include AI analysis data (hallucination status, confidence score) for AI-Generated SOWs (yes/no). | Select format; select content scope; select version; toggle AI analysis inclusion. |
| 2 | **Export Generation** | Processing indicator. | Wait; cancel. |
| 3 | **Download** | Download link/automatic browser download. File named: `SOW-{ID}-{title}-v{version}-{intake_mode}.{format}`. | Download file; export another. |

**Decision Points:**
- Step 1: Which format, content scope, and version? User selects.

**Error/Edge Cases:**
- Export of very large SOW: may take longer; async generation with notification when ready.
- PDF generation failure: fallback message with retry option.
- Exporting Restricted-classification SOW: watermark "RESTRICTED" on all pages; download logged with enhanced audit detail.

**Exit Points:**
- File downloaded -> return to SOW Detail or Repository.

**Audit:** Export event logged: user ID, timestamp, SOW ID, format, content scope, data sensitivity classification of exported SOW.

---

## C. TASK DECOMPOSITION & PLANNING

---

### C1: AI-Assisted Decomposition (SOW -> milestones -> tasks/subtasks)

**SOW References:** Section 3.1.MVP.2 (semi-automated decomposition, Planner UI), Section 3.1.MVP.7 (Decomposition Assistant -- task plan suggestions)

**Entry Point:** SOW Detail View > "Start Decomposition" button, OR Task Planning > "New Plan from SOW".

**Pre-conditions:**
- SOW in "Approved" status (Flow B7 completed).
- Decomposition Assistant available (Section 3.1.MVP.7).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Decomposition Trigger** | Confirmation: "Generate task plan from SOW: [title]?" SOW summary displayed for context. | Confirm; cancel. |
| 2 | **AI Processing** | Decomposition Assistant processes SOW. Progress indicator: "Analyzing SOW... Generating milestones... Creating tasks... Tagging skills..." | Wait; cancel (stops processing). |
| 3 | **Plan View (Planner UI)** | Three-level hierarchy displayed: Milestones (top level) -> Tasks (mid level) -> Subtasks (bottom level). For each item: name, description, estimated effort, required skills (auto-tagged), dependencies, status = "Proposed". Tree/outline view with expand/collapse. | Expand/collapse nodes; select item for detail; edit; add/remove items; reorder. |
| 4 | **Plan Detail Panel** | Side panel showing selected item detail: name, description, estimated effort (hours), required skills (chips), dependencies (linked items), acceptance criteria, AI confidence indicator. | Edit any field; accept AI suggestion; override; add notes. |
| 5 | **AI Recommendations** | Decomposition Assistant suggestions panel: "Consider splitting this task (high complexity)", "Missing dependency detected between Task A and Task B", "Skill gap: no contributor with [skill] currently available". | Accept/dismiss each recommendation. |
| 6 | **Plan Summary** | Summary bar: total milestones, total tasks, total subtasks, total estimated effort (hours), unique skills required, identified dependencies count. | Review totals; proceed to approval (Flow C4). |

**Decision Points:**
- Step 1: User confirms decomposition? YES -> Step 2. NO -> return to SOW Detail.
- Step 3-5: For each AI-generated item: Accept as-is, edit, or delete?

**Error/Edge Cases:**
- AI cannot parse SOW effectively: generates minimal/incomplete plan with warning "Low confidence decomposition. Significant manual editing may be required."
- SOW too vague for decomposition: AI flags specific sections needing clarification.
- Very large SOW: decomposition may take longer; progress bar with stage indicators.
- Previous decomposition exists for this SOW: system warns "A task plan already exists for this SOW. Create new plan or edit existing?"

**Exit Points:**
- Plan generated -> continue editing in Planner UI.
- Proceed to approval -> Flow C4.
- Save as draft plan -> return later.

**Audit:** Decomposition event logged: user ID, timestamp, SOW ID, plan ID, AI model version, number of items generated.

---

### C2: Skills Tagging per Task

**SOW References:** Section 3.1.MVP.2 (skills tagging per task -- manual + assisted suggestions)

**Entry Point:** Planner UI > select any task/subtask > Skills field.

**Pre-conditions:**
- Task plan exists (Flow C1 completed or in progress).
- Skills taxonomy available in the system.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Task Detail Panel** | Selected task with current skills tags displayed as chips. "AI Suggested" badge on auto-tagged skills. | Click skills field to edit. |
| 2 | **Skills Editor** | Combo box / autocomplete: type to search skills from taxonomy. AI-suggested skills shown at top with "Suggested" label. All available skills searchable. Proficiency level selector per skill (if applicable). | Type to search; select from suggestions; add custom skill (if not in taxonomy); remove existing tags. |
| 3 | **AI Suggestions** | Decomposition Assistant highlights: "Based on task description, recommended skills: [list]". Each with confidence level. | Accept all suggestions; accept individual; dismiss. |
| 4 | **Skills Saved** | Updated skills tags displayed on task. Matching engine (Section 3.1.MVP.4) uses these tags for team formation. | View updated task; move to next task. |

**Decision Points:**
- Step 2: Accept AI suggestions or manual selection? User chooses per skill.

**Error/Edge Cases:**
- Skill not in taxonomy: user can add free-text skill tag (flagged for taxonomy review).
- No AI suggestions available: manual tagging only.
- Task with no skills tagged: warning "Tasks without skills tags cannot be matched to contributors."

**Exit Points:**
- Skills saved -> return to Planner UI.

**Audit:** Skills tagging logged: task ID, skills added/removed, source (AI/manual), user ID, timestamp.

---

### C3: Task Dependencies & Critical Path

**SOW References:** Section 3.1.MVP.2 (task dependencies and critical path -- basic)

**Entry Point:** Planner UI > "Dependencies" view/tab.

**Pre-conditions:**
- Task plan exists with multiple tasks.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Dependency View** | Visual representation of task dependencies: either a Gantt-style timeline or a directed graph showing task relationships. Tasks as nodes, dependencies as arrows. Critical path highlighted. | Switch between timeline and graph view; zoom in/out; select tasks. |
| 2 | **Add Dependency** | Select source task, then target task. Dependency type: "blocks" (must complete before), "related" (soft dependency). | Draw dependency line; select from dropdown. |
| 3 | **Dependency Validation** | System checks for circular dependencies, unrealistic timelines (Task B starts before Task A ends but depends on it). Warnings displayed inline. | Fix circular dependency; adjust dates; accept warning. |
| 4 | **Critical Path Display** | Tasks on the critical path highlighted in distinct color. Total critical path duration shown. "Any delay to these tasks will delay the project." | Click critical path task for detail. |

**Decision Points:**
- Step 3: Circular dependency detected? YES -> must resolve before saving. NO -> save.

**Error/Edge Cases:**
- No dependencies defined: critical path equals longest single task; system suggests "Consider defining dependencies for better project planning."
- All tasks parallel (no dependencies): system shows all tasks in parallel lanes.
- Very complex dependency graph: zoom/filter controls; ability to view subset of tasks.

**Exit Points:**
- Dependencies saved -> return to Planner UI.
- Proceed to plan approval -> Flow C4.

**Audit:** Dependency changes logged: user ID, timestamp, plan ID, dependencies added/removed.

---

### C4: Plan Review & Approval (human approval gates)

**SOW References:** Section 3.1.MVP.2 (human approval gates before execution)

**Entry Point:** Planner UI > "Submit for Approval" button.

**Pre-conditions:**
- Task plan exists with milestones, tasks, skills tags.
- All required fields populated (system validates).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Pre-Approval Validation** | System checks plan completeness: all tasks have descriptions, effort estimates, skills tags. Validation results displayed: passed items (green), warnings (yellow), errors (red). | Fix errors; proceed if no errors. |
| 2 | **Approval Summary** | Full plan summary: milestone count, task count, total effort, skills required, dependencies, critical path duration, estimated timeline, estimated cost (rate card x effort). Side-by-side comparison with original SOW scope. | Review; edit plan (return to Planner); submit for approval. |
| 3 | **Submit for Approval** | Plan status changes to "Pending Approval". If approval workflow configured: notification sent to designated approver(s). If single-user (small enterprise): self-approval available. | Wait for approval; withdraw submission. |
| 4a | **Approved** | Approver reviews and approves plan. Status changes to "Approved". Notification sent to plan creator. Plan becomes executable -- team formation can begin. | Proceed to team formation (Flow D1). |
| 4b | **Rejected / Changes Requested** | Approver rejects with reasons or requests specific changes. Rejection reasons displayed. Status returns to "Draft". | Edit plan based on feedback; resubmit (return to Step 1). |

**Decision Points:**
- Step 1: Validation passes? YES -> Step 2. NO -> must fix errors before proceeding.
- Step 3: Approval required from another user? YES -> wait for approval. NO (self-approval) -> immediate approval.
- Step 4: Approver accepts? YES -> 4a. NO -> 4b.

**Error/Edge Cases:**
- Approver is unavailable: escalation rules apply (Section 4.3 -- configurable escalation rules); backup approver notified.
- Plan modified after submission: system warns approver "Plan was modified after submission. Please review latest version."
- Approval deadline exceeded: system sends reminder notifications.

**Exit Points:**
- Approved -> Flow D1 (Team Formation).
- Rejected -> edit plan, resubmit.

**Audit:** Approval events logged immutably: plan ID, submitter, approver, decision, reasons, timestamps.

---

### C5: Plan Export (CSV/PDF)

**SOW References:** Section 3.1.MVP.2 (exportable plan -- CSV/PDF)

**Entry Point:** Planner UI > "Export Plan" button.

**Pre-conditions:**
- Task plan exists.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Export Options** | Modal: Format selection (CSV, PDF). Content options: "Full plan (milestones + tasks + subtasks + dependencies)", "Tasks only", "Summary only". | Select format; select content scope. |
| 2 | **CSV Export** | If CSV: generates tabular data with columns: Milestone, Task, Subtask, Description, Effort, Skills, Dependencies, Status, Assigned To (if assigned). | Download CSV. |
| 2 | **PDF Export** | If PDF: formatted document with project title, SOW reference, milestone breakdown, task details, dependency diagram, effort summary, skills summary. | Download PDF. |
| 3 | **Download** | File downloaded: `Plan-{SOW_ID}-{title}-v{version}.{format}`. | Open file; export again with different options. |

**Decision Points:**
- Step 1: Format and scope selection by user.

**Error/Edge Cases:**
- Very large plan: CSV export may be large; PDF generation may take time.
- Plan in draft status: export includes "DRAFT" watermark on PDF.

**Exit Points:**
- File downloaded -> return to Planner UI.

**Audit:** Export logged: user ID, timestamp, plan ID, format, content scope.

---

### C6: Plan Revision (edit and re-approve)

**SOW References:** Section 3.1.MVP.2 (human approval gates), Section 3.1.MVP.1 (versioning pattern)

**Entry Point:** Planner UI > "Edit Plan" on an approved plan.

**Pre-conditions:**
- Approved plan exists.
- User has edit authority (RBAC).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Edit Warning** | Modal: "Editing an approved plan will create a new version and require re-approval. Existing assignments may be affected." | Confirm edit; cancel. |
| 2 | **Plan Editor** | Planner UI with all items editable. Original approved version preserved. New version created (e.g., v2.0-draft). Change tracking: added/modified/removed items highlighted. | Edit milestones/tasks/subtasks; add/remove items; modify skills/effort/dependencies. |
| 3 | **Change Summary** | Summary of changes from approved version: items added, removed, modified. Impact analysis: "3 tasks modified, 1 new task added, 2 assignments may need reassignment." | Review changes; revert individual changes; submit for re-approval (Flow C4). |

**Decision Points:**
- Step 1: User confirms edit? YES -> Step 2. NO -> return to approved plan.
- Step 3: Submit for re-approval -> Flow C4.

**Error/Edge Cases:**
- Tasks already in progress: system warns "Task [name] is currently assigned and in progress. Modifying it may affect delivery."
- Concurrent editing: system warns if another user is editing the same plan.

**Exit Points:**
- Submitted for re-approval -> Flow C4.
- Draft saved -> return later.

**Audit:** Plan revision logged: user ID, timestamp, plan ID, old version, new version, changes made.

---

## D. TEAM FORMATION & ASSIGNMENT

---

### D1: Matching Engine Results View

**SOW References:** Section 3.1.MVP.4 (matching engine v1 -- ranked recommendations based on skills match + availability + basic quality signals, explainable "why matched" fields)

**Entry Point:** Approved plan > "Form Team" button, OR Task Planning > select task > "Find Contributors".

**Pre-conditions:**
- Task plan approved (Flow C4).
- Tasks have skills tags (Flow C2).
- Contributors exist in the system with profiles and skills.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Matching Trigger** | "Find Contributors for [Project Name]" screen. Option to match for entire project (all tasks) or individual task. | Select scope: all tasks or specific task; trigger matching. |
| 2 | **Matching Processing** | Matching engine (Section 3.1.MVP.4) runs. Processing indicator. | Wait; cancel. |
| 3 | **Results View** | For each task: ranked list of recommended contributors. Each contributor shows: anonymized ID or name (per RBAC), skills match score, availability status, quality signal score, overall match rank. | View details; select/deselect contributors; view "why matched". |
| 4 | **"Why Matched" Panel** | For selected contributor-task pair: breakdown of match reasoning -- skills overlap (which skills matched and at what proficiency), availability window, historical quality metrics (acceptance rate, on-time delivery), overall score calculation. Explainability fields as specified in Section 3.1.MVP.4. | Accept match; skip to next candidate; request more candidates. |
| 5 | **Team Assembly** | Aggregate view of selected contributors across all tasks. Team composition summary: total team size, skill coverage, availability overlap, estimated cost (rate card x effort). | Review team; modify selections; proceed to team confirmation (Flow D2). |

**Decision Points:**
- Step 1: Match for all tasks or single task? User selects.
- Step 3-4: For each task: accept top-ranked contributor, select alternative, or skip?
- Step 5: Team complete? YES -> proceed to confirmation. NO -> fill remaining positions.

**Error/Edge Cases:**
- No matching contributors for a skill: "No contributors found with [skill]. Consider: broadening skill requirements, waiting for new contributor registrations, or manual assignment."
- Very few candidates: system shows all available with warning "Limited candidate pool."
- Contributor appears in multiple task matches: system flags potential overallocation.

**Exit Points:**
- Team assembled -> Flow D2 (Team Confirmation).
- Save draft selections -> return later.

**Audit:** Matching event logged: user ID, timestamp, plan ID, tasks matched, candidates shown, match algorithm version.

---

### D2: Team Confirmation (human confirmation of recommended team)

**SOW References:** Section 3.1.MVP.4 (team formation for a project with human confirmation)

**Entry Point:** Matching Results View > "Confirm Team" button.

**Pre-conditions:**
- Contributors selected for all tasks (Flow D1 completed).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Team Confirmation Page** | Full team roster: each task with assigned contributor, skills match, availability, estimated cost. Total project cost estimate. Timeline estimate based on availability. | Review roster; swap contributors; add notes; confirm team. |
| 2 | **Confirmation Dialog** | "Confirm team formation? Contributors will be notified and asked to accept/decline assignments." Summary of notifications to be sent. | Confirm; cancel; modify team. |
| 3 | **Assignments Created** | Assignment records created for each task-contributor pair. Assignment status: "Pending Acceptance". Notifications sent to contributors (Section 3.1.MVP.4 -- assignment workflow). SLA timers started for accept/decline response. | View assignment status (Flow D4); proceed to project monitoring. |

**Decision Points:**
- Step 2: User confirms? YES -> Step 3. NO -> return to team composition.

**Error/Edge Cases:**
- Contributor becomes unavailable between selection and confirmation: system warns "Contributor [X] is no longer available for task [Y]. Please select alternative."
- Budget exceeded: total cost exceeds SOW budget -> warning with breakdown.
- Duplicate assignment (same contributor to conflicting tasks): system prevents or warns.

**Exit Points:**
- Confirmed -> Flow D4 (Assignment Monitoring).
- Modified -> return to Flow D1.

**Audit:** Team confirmation logged immutably: user ID, timestamp, plan ID, all task-contributor assignments, total cost estimate.

---

### D3: Admin Override for Assignments

**SOW References:** Section 3.1.MVP.4 (admin override for assignments)

**Entry Point:** Assignment Monitoring > specific task > "Override Assignment" button.

**Pre-conditions:**
- User has admin role with override authority (RBAC).
- Task exists with current or no assignment.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Override Trigger** | Task detail showing current assignment (if any). "Override Assignment" button. | Click override. |
| 2 | **Override Form** | Search/select contributor to assign. Current assignment shown (if replacing). Mandatory "Override Reason" text field. Warning: "This action overrides the matching engine recommendation and will be logged in the audit trail." | Search contributors; select new assignee; enter reason; confirm. |
| 3 | **Confirmation** | Summary: task, previous assignee (if any), new assignee, reason. "Previous assignee will be notified of reassignment." | Confirm override; cancel. |
| 4 | **Override Applied** | Assignment updated. Previous assignee notified (if applicable). New assignee notified with accept/decline workflow. Audit trail updated with override flag. | View updated assignment. |

**Decision Points:**
- Step 3: Confirm override? YES -> Step 4. NO -> cancel.

**Error/Edge Cases:**
- Overriding to a contributor without required skills: system warns but allows (admin authority).
- Overriding a task in progress: additional warning "Task is currently in progress. Override may disrupt delivery."
- Override reason left blank: system requires non-empty reason.

**Exit Points:**
- Override applied -> Flow D4 (Assignment Monitoring).
- Cancelled -> return to assignment view.

**Audit:** Override logged with special flag: user ID, timestamp, task ID, previous assignee, new assignee, reason, "ADMIN_OVERRIDE" tag. This is a critical action per Section 3.1.MVP.8.

---

### D4: Assignment Monitoring (accept/decline tracking, SLA timers)

**SOW References:** Section 3.1.MVP.4 (assignment workflow -- accept/decline, reassignments, SLA timers)

**Entry Point:** Enterprise Admin Console > Team Formation > Assignment Monitoring, OR Project Detail > "Assignments" tab.

**Pre-conditions:**
- Assignments created (Flow D2 or D3 completed).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Assignment Dashboard** | Table of all assignments across active projects. Columns: Task, Project, Contributor, Status (Pending Acceptance / Accepted / Declined / Reassigned), SLA Timer (time remaining to respond), Assigned Date. Color-coded status indicators. | Filter by project/status; sort by SLA urgency; click row for detail. |
| 2 | **SLA Timer Display** | For "Pending Acceptance" assignments: countdown timer showing time remaining. Color: Green (>50% time left), Yellow (25-50%), Red (<25%). | No direct action on timer; triggers notifications automatically. |
| 3 | **Status Updates** | Real-time updates as contributors accept/decline. Accepted: status changes, SLA timer cleared. Declined: status changes, triggers reassignment need. | View update; trigger reassignment (Flow D5) for declined assignments. |
| 4 | **SLA Breach Alert** | If contributor doesn't respond within SLA: status changes to "SLA Breached". Alert banner. Auto-notification sent to contributor and admin. | Trigger reassignment (Flow D5); extend SLA; escalate. |

**Decision Points:**
- Step 3: Contributor accepted? YES -> task proceeds to execution. Declined? -> Flow D5 (Reassignment).
- Step 4: SLA breached -> reassign, extend, or escalate?

**Error/Edge Cases:**
- All recommended contributors decline: system suggests expanding search criteria or admin override.
- Contributor accepts then becomes unavailable: separate reassignment flow triggered.
- Bulk assignments (many tasks): aggregate status view with summary counts.

**Exit Points:**
- All assignments accepted -> project execution begins, Flow E2 (Project Monitoring).
- Declined/breached -> Flow D5 (Reassignment).

**Audit:** Assignment status changes logged: assignment ID, previous status, new status, timestamp, contributor ID.

---

### D5: Reassignment Flow

**SOW References:** Section 3.1.MVP.4 (reassignments), Section 4.3 (configurable escalation and re-assignment rules)

**Entry Point:** Assignment Monitoring > declined/breached assignment > "Reassign" button.

**Pre-conditions:**
- Assignment exists in "Declined" or "SLA Breached" status.
- Reassignment rules configured (Section 4.3).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Reassignment Trigger** | Task detail with declined/breached assignment. Previous assignee and decline reason (if provided). | Click "Reassign". |
| 2 | **Reassignment Options** | Options: "Next best match" (auto-select next ranked candidate from matching results), "Re-run matching" (fresh matching run), "Manual selection" (admin picks contributor), "Admin override" (Flow D3). | Select reassignment method. |
| 3a | **Next Best Match** | Next ranked candidate from original matching results displayed with "why matched" detail. | Confirm; skip to next candidate; choose different method. |
| 3b | **Re-run Matching** | Fresh matching run excluding previous assignee. New ranked results displayed. | Select from new results. |
| 3c | **Manual Selection** | Search all contributors. No matching engine ranking. | Search; select; assign. |
| 4 | **New Assignment Created** | New assignment record created. New contributor notified. SLA timer restarted. Previous assignment marked "Reassigned" in history. | Monitor new assignment (Flow D4). |

**Decision Points:**
- Step 2: Which reassignment method? User selects.
- Step 3: Accept suggested contributor? YES -> Step 4. NO -> try next/different method.

**Error/Edge Cases:**
- No more candidates available: "No additional contributors available. Consider broadening skill requirements or extending timeline."
- Multiple reassignments for same task: system tracks reassignment count; flags tasks with 3+ reassignments for attention.
- Reassignment rules auto-trigger: if configured (Section 4.3), system may auto-reassign on SLA breach without manual intervention.

**Exit Points:**
- New assignment created -> Flow D4 (Assignment Monitoring).
- No candidates -> escalate or modify task requirements.

**Audit:** Reassignment logged: task ID, previous assignee, new assignee, reassignment reason, method used, timestamp.

---

## E. PROJECT MONITORING

---

### E1: Project Portfolio View

**SOW References:** Section 3.1.6 (project, task, team monitoring for enterprise PMO and operations teams), Section 19.1 (SOW intake and project portfolio views)

**Entry Point:** Enterprise Admin Console > Project Monitoring > Project Portfolio (also serves as Dashboard default for PMO users).

**Pre-conditions:**
- User authenticated with enterprise role.
- At least one project exists.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Portfolio View** | Table/card view of all projects. Each project shows: name, linked SOW, status (Active / On Hold / Completed / Cancelled), progress (% tasks completed), team size, start/end dates, risk indicator (green/yellow/red), SLA compliance %. Summary statistics at top: total active projects, total tasks, overall SLA compliance. | Switch between table/card view; filter; sort; search; click project for detail. |
| 2 | **Filters** | Filter by: status, date range, risk level, SOW, project owner. | Apply/clear filters. |
| 3 | **Sort** | Sort by: status, progress, risk, start date, end date, SLA compliance. | Click column headers or sort controls. |
| 4 | **Project Click** | Navigate to Project Detail View (Flow E2). | View full project detail. |

**Decision Points:**
- Step 1: Any projects exist? YES -> display. NO -> empty state "No projects yet. Start by uploading a SOW."

**Error/Edge Cases:**
- Large number of projects: pagination; aggregate statistics help quick assessment.
- All projects healthy: positive reinforcement message.
- Multiple projects at risk: risk summary banner at top.

**Exit Points:**
- Click project -> Flow E2 (Project Detail).
- Click "New Project" -> Flow B2 (SOW Intake Mode Selector).

**Audit:** Portfolio view access logged: user ID, timestamp.

---

### E2: Project Detail View

**SOW References:** Section 3.1.6 (project, task, team monitoring), Section 3.1.MVP.5 (review/acceptance context)

**Entry Point:** Project Portfolio > click project, OR direct link from notification/dashboard.

**Pre-conditions:**
- Project exists and user has access.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Project Header** | Project name, linked SOW (clickable), status, overall progress bar, risk score, SLA compliance %, start/end dates, project owner. | Edit project metadata; change status; view linked SOW. |
| 2 | **Tasks Tab** | List of all tasks with: name, assignee, status (Not Started / In Progress / Submitted / In Review / Accepted / Rework / Blocked), effort estimate, SLA status, due date. Progress summary: tasks by status pie chart. | Filter tasks by status; click task for detail; bulk actions. |
| 3 | **Team Tab** | Team roster: contributor (anonymized or named per RBAC), role/skills, assigned tasks count, task completion rate, SLA compliance. | View contributor detail (limited); reassign (Flow D5). |
| 4 | **Timeline Tab** | Gantt chart or timeline view: milestones and tasks on time axis, dependencies shown, critical path highlighted, current date marker. | Zoom in/out; click task for detail; view dependencies. |
| 5 | **SLA Tab** | SLA summary: tasks within SLA (green), at risk (yellow), breached (red). SLA details per task: configured SLA, time elapsed, time remaining. | Filter by SLA status; click to view task detail. |
| 6 | **Exceptions Tab** | List of exceptions: escalations, risk flags, reassignments, SLA breaches. Each with: type, description, date, severity, resolution status. | View exception detail; resolve; escalate further. |
| 7 | **Deliverables Tab** | Submitted deliverables: task name, submission date, review status, acceptance decision. Evidence packs available for review. | View evidence pack (Flow F1); make acceptance decision (Flow F2). |

**Decision Points:**
- Which tab to view: user navigates between tabs based on need.

**Error/Edge Cases:**
- Project with no activity yet: tasks all "Not Started", timeline shows future dates.
- Project completed: all tasks accepted, celebratory state, final report available.
- Project at high risk: prominent risk banner with recommended actions.

**Exit Points:**
- Navigate to task detail, contributor detail, SOW detail, or exception detail.
- Return to Project Portfolio.

**Audit:** Project detail access logged: user ID, timestamp, project ID, tabs accessed.

---

### E3: Task Status Tracking (state machine view)

**SOW References:** Section 3.1.MVP.5 (task state lifecycle), Section 3.1.MVP.4 (assignment workflow)

**Entry Point:** Project Detail > Tasks Tab > click specific task, OR Task Planning > click task.

**Pre-conditions:**
- Task exists within a project.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Task Detail** | Task name, description, milestone, required skills, estimated effort, assigned contributor, current status, due date, SLA timer. | View status history; view submission; view review; reassign. |
| 2 | **Status Timeline** | Visual state machine showing task lifecycle: Not Started -> Assigned -> In Progress -> Submitted -> In Review -> Accepted / Rework -> (loop) / Rejected. Current state highlighted. Timestamps for each state transition. | Click any state for details of that transition. |
| 3 | **State Details** | For each state transition: who triggered it, when, associated data (e.g., submission artifacts for "Submitted", reviewer feedback for "Rework"). | View artifacts; view feedback. |

**Decision Points:**
- Task in "Submitted" status: enterprise user can view evidence (Flow F1) and make acceptance decision (Flow F2).

**Error/Edge Cases:**
- Task stuck in one state too long: SLA timer shows warning; escalation option available.
- Task cancelled: terminal state with cancellation reason.
- Multiple rework cycles: each cycle visible as a loop in the timeline.

**Exit Points:**
- View submission -> Flow F1.
- Make acceptance decision -> Flow F2.
- Return to project tasks list.

**Audit:** All state transitions logged immutably (Section 3.1.MVP.8).

---

### E4: Exception Management (escalations, reassignments, risk flags)

**SOW References:** Section 3.1.6 (exception management -- escalations, reassignments, risk flags), Section 4.3 (configurable escalation and re-assignment rules)

**Entry Point:** Project Detail > Exceptions Tab, OR Enterprise Admin Console > Project Monitoring > Exceptions.

**Pre-conditions:**
- Exceptions exist (SLA breaches, escalations, risk flags, reassignments).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Exception Queue** | List of all active exceptions across projects (or filtered to single project). Columns: type (Escalation / SLA Breach / Risk Flag / Reassignment), project, task, severity (Critical / High / Medium / Low), date raised, status (Open / In Progress / Resolved), assigned to. | Filter by type/severity/project/status; sort; click for detail. |
| 2 | **Exception Detail** | Full context: what happened, when, affected task/project, contributor involved (if applicable), SLA data, previous actions taken. Resolution history. | Resolve exception; escalate further; add notes; reassign handler. |
| 3 | **Resolution Actions** | Depending on exception type: Reassign task (Flow D5), Extend SLA, Adjust priority, Add resources, Flag for governance review, Close as resolved with resolution notes. | Select action; execute; confirm resolution. |
| 4 | **Resolution Confirmation** | Exception status updated. Resolution notes recorded. Affected parties notified. | View resolved exception in history. |

**Decision Points:**
- Step 3: Which resolution action? Depends on exception type and severity.

**Error/Edge Cases:**
- Cascade exceptions: one issue triggers multiple exceptions (e.g., SLA breach causes escalation which causes risk flag).
- Exception on completed project: should not occur; if it does, flag as data inconsistency.
- No exceptions: positive state "No active exceptions. All projects on track."

**Exit Points:**
- Exception resolved -> return to queue.
- Escalated -> higher-level review.

**Audit:** Exception creation, actions, and resolution logged: exception ID, type, actions taken, resolver, timestamps.

---

### E5: Real-time Throughput View

**SOW References:** Section 3.1.6 (real-time views on throughput, quality, bottlenecks)

**Entry Point:** Enterprise Admin Console > Project Monitoring > Real-time View.

**Pre-conditions:**
- Active projects with ongoing work.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Real-time Dashboard** | Live-updating metrics: Tasks completed today/this week, Tasks currently in progress, Tasks in review, Tasks submitted (awaiting review), Average time in each state, Current bottleneck identification (which state has most tasks waiting). | Refresh; filter by project; drill down on any metric. |
| 2 | **Bottleneck Analysis** | If bottleneck detected (e.g., many tasks waiting in review): highlighted section with count, average wait time, suggested action ("Consider adding reviewers or extending review SLAs"). | Click for detail on bottleneck tasks; take action. |
| 3 | **Throughput Chart** | Line/bar chart: tasks completed over time (daily/weekly). Trend line. Comparison to planned throughput. | Change time granularity; filter by project/task type. |

**Decision Points:**
- Bottleneck identified? YES -> drill down for action. NO -> monitor continues.

**Error/Edge Cases:**
- No active tasks: "No active tasks to monitor."
- Data delay: indicator showing data freshness ("Last updated: [timestamp]").

**Exit Points:**
- Drill down to specific task/project.
- Return to project portfolio.

**Audit:** Dashboard view access logged: user ID, timestamp.

---

### E6: Historical Performance View

**SOW References:** Section 3.1.6 (historical views on throughput, quality, bottlenecks)

**Entry Point:** Enterprise Admin Console > Project Monitoring > Historical Performance.

**Pre-conditions:**
- Completed or active projects with historical data.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Historical Dashboard** | Date range selector (default: last 30 days). Metrics: total tasks completed, average completion time, SLA compliance rate, acceptance rate, rework rate, average cost per task. | Change date range; filter by project; export. |
| 2 | **Trend Charts** | Line charts over time: completion rate, SLA compliance, quality (acceptance rate), cost efficiency. | Hover for exact values; zoom; compare periods. |
| 3 | **Project Comparison** | Side-by-side comparison of project performance: select 2-5 projects to compare on key metrics. | Select projects; compare; export comparison. |
| 4 | **Export** | Export historical data as CSV or PDF report. | Download. |

**Decision Points:**
- Step 1: Which date range and filters? User selects.

**Error/Edge Cases:**
- Insufficient historical data (new platform): "Limited data available. Performance trends will become more meaningful as more projects complete."
- Single project: comparison view disabled; single project trend shown.

**Exit Points:**
- Export data -> download file.
- Drill down to specific project.

**Audit:** Historical view access logged: user ID, timestamp, date range, filters.

---

## F. REVIEW & ACCEPTANCE (Enterprise Side)

---

### F1: Deliverable Review -- Evidence Pack View

**SOW References:** Section 3.1.MVP.5 (submission: evidence checklist, acceptance logs + evidence pack export)

**Entry Point:** Project Detail > Deliverables Tab > click submission, OR notification "New submission for review".

**Pre-conditions:**
- Contributor has submitted work for a task (status = "Submitted" or "In Review").
- Enterprise user has review/acceptance authority for this project.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Evidence Pack View** | Full submission package: Task context (instructions, requirements, acceptance criteria). Submitted artifacts: files (viewable/downloadable), structured responses, evidence checklist (items checked/unchecked by contributor). | View each artifact; download files; expand checklist items. |
| 2 | **Artifact Viewer** | For each submitted file: inline preview (if supported format: PDF, images, text, code). File metadata: name, size, upload date. | View full screen; download; annotate (if supported). |
| 3 | **Evidence Checklist** | Checklist items as defined for the task: each with contributor's response/evidence. Items marked complete/incomplete. | Review each item; note discrepancies. |
| 4 | **Review Context** | If two-stage review (Section 3.1.MVP.5): mentor/reviewer's assessment visible -- rubric scores, feedback, recommendation (accept/rework/reject). | Read mentor review; proceed to enterprise decision. |
| 5 | **Previous Versions** | If rework submission: previous submission versions visible for comparison. Change highlights between versions. | Compare versions; view feedback history. |

**Decision Points:**
- Step 4: Is this a two-stage review with mentor assessment complete? YES -> enterprise sees mentor recommendation. NO (single-stage or enterprise-first) -> enterprise reviews directly.

**Error/Edge Cases:**
- File format not previewable: download option only with "Preview not available for this format."
- Very large evidence pack: pagination or section-by-section loading.
- Incomplete checklist: warning "Evidence checklist is not fully completed by the contributor."

**Exit Points:**
- Proceed to acceptance decision -> Flow F2.
- Return to deliverables list.

**Audit:** Evidence pack view logged: user ID, timestamp, task ID, artifacts accessed.

---

### F2: Acceptance Decision (accept / rework with reasons)

**SOW References:** Section 3.1.MVP.5 (acceptance decision with reasons; rework loop with versioning), Section 3.1.MVP.7 (human approvals mandatory for acceptance)

**Entry Point:** Evidence Pack View > "Make Decision" button.

**Pre-conditions:**
- Evidence pack reviewed (Flow F1).
- User has acceptance authority (RBAC). Human approvals mandatory (Section 3.1.MVP.7).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Decision Form** | Three options: "Accept" (green), "Request Rework" (yellow), "Reject" (red). Task summary and evidence summary displayed for reference. | Select decision. |
| 2a | **Accept** | Confirmation: "Accept this deliverable? This will trigger payout eligibility for the contributor." Optional acceptance notes field. | Confirm acceptance; cancel. |
| 2b | **Request Rework** | Mandatory fields: Rework reason (text), Specific feedback (what needs to change), Updated acceptance criteria (if applicable). Optional: priority level, deadline for rework. | Fill feedback; submit rework request; cancel. |
| 2c | **Reject** | Mandatory fields: Rejection reason (text), Detailed explanation. Warning: "Rejection is final for this submission. The task may need to be reassigned." | Fill reason; confirm rejection; cancel. |
| 3 | **Decision Confirmed** | Decision recorded. Contributor notified. If accepted: payout eligibility triggered (Section 3.1.MVP.6). If rework: task returns to contributor with feedback. If rejected: task status updated. | View decision in audit trail; proceed to next deliverable. |

**Decision Points:**
- Step 1: Which decision? Accept / Rework / Reject.
- Step 2a: Acceptance triggers payout eligibility automatically (Section 3.1.MVP.6).

**Error/Edge Cases:**
- Rework with no feedback: system requires non-empty reason "Please provide feedback so the contributor can improve their submission."
- Acceptance of partial deliverable: if task allows partial acceptance, option to "Accept with conditions" (add conditions text).
- Decision conflict with mentor recommendation: if mentor recommended accept but enterprise rejects (or vice versa), system logs the divergence.

**Exit Points:**
- Accept -> payout eligibility triggered, task complete.
- Rework -> contributor notified, Flow F3 (Rework Tracking).
- Reject -> task marked rejected, may need reassignment.

**Audit:** Acceptance decision logged immutably (Section 3.1.MVP.8): task ID, reviewer user ID, decision, reasons, timestamp, payout eligibility status change.

---

### F3: Rework Loop Tracking

**SOW References:** Section 3.1.MVP.5 (rework loop with versioning)

**Entry Point:** Project Detail > Deliverables Tab > task with status "Rework", OR notification "Rework submitted".

**Pre-conditions:**
- Rework requested via Flow F2.
- Contributor has been notified.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Rework Status** | Task status: "Rework Requested" (waiting for contributor) or "Rework Submitted" (contributor resubmitted). Timeline showing: original submission -> rework request -> rework submission(s). Rework count (iteration number). | View feedback sent; view resubmission; compare versions. |
| 2 | **Version Comparison** | Side-by-side: original submission vs. rework submission. Changes highlighted. Rework feedback alongside showing what was requested vs. what was addressed. | Review changes; proceed to new decision (Flow F2). |
| 3 | **New Decision** | Same acceptance decision flow (Flow F2) for the rework submission. | Accept / Request Further Rework / Reject. |

**Decision Points:**
- Step 3: Accept rework, request further rework, or reject?

**Error/Edge Cases:**
- Multiple rework cycles: system tracks iteration count; after configurable threshold (e.g., 3 rework cycles), system flags for escalation.
- Rework SLA expired: contributor didn't resubmit within deadline -> escalation (Flow E4).
- Contributor disputes rework request: escalation to governance (Section 14).

**Exit Points:**
- Accepted -> task complete, payout triggered.
- Further rework -> loop continues.
- Rejected or escalated -> Flow E4 (Exception Management).

**Audit:** Each rework cycle logged: iteration number, feedback, resubmission, decision, timestamps.

---

### F4: Acceptance Logs & Evidence Pack Export

**SOW References:** Section 3.1.MVP.5 (acceptance logs + evidence pack export)

**Entry Point:** Project Detail > Deliverables Tab > "Export Evidence Pack", OR Audit Log > filter to acceptance events.

**Pre-conditions:**
- At least one acceptance decision has been made.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Export Options** | Scope: single task, multiple tasks, entire project. Format: PDF (formatted report), ZIP (all artifacts + metadata). Content: evidence pack (artifacts + checklist + review scores + decision), acceptance log only, full audit trail. | Select scope, format, content. |
| 2 | **Export Generation** | Processing indicator. For large exports: async with notification when ready. | Wait; cancel. |
| 3 | **Download** | File available for download. PDF: formatted with task details, evidence summary, review scores, decision, signatures/approvals, audit trail. ZIP: folder structure with artifacts, metadata JSON, acceptance log CSV. | Download; share link (if supported). |

**Decision Points:**
- Step 1: Scope, format, and content selection by user.

**Error/Edge Cases:**
- Very large evidence packs (many files): ZIP export with folder organization.
- Export for compliance/audit: PDF includes digital signatures and immutable audit references.

**Exit Points:**
- File downloaded -> return to project.

**Audit:** Export event logged: user ID, timestamp, scope, format, content selected.

---

## G. COMMERCIAL & BILLING

---

### G1: Rate Card Configuration

**SOW References:** Section 3.1.MVP.6 (rate cards -- role/skill/level/region -- configured by admin)

**Entry Point:** Enterprise Admin Console > Commercial & Billing > Rate Cards.

**Pre-conditions:**
- User has admin/finance role (RBAC).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Rate Card List** | Table of configured rate cards. Each card shows: name, applicable role(s), skill(s), level(s), region(s), rate (currency/hour or /task), effective date, status (Active/Draft/Archived). | Search; filter by role/skill/region; click to edit; create new. |
| 2 | **Rate Card Detail/Edit** | Form fields: Name, Role (dropdown), Skill category (multi-select), Level (Junior/Mid/Senior/Expert), Region (multi-select), Rate amount, Currency, Unit (per hour / per task), Effective from date, Effective to date (optional). | Edit fields; save draft; activate; archive. |
| 3 | **Rate Card Creation** | "New Rate Card" button -> empty form (same as Step 2). | Fill fields; save. |
| 4 | **Validation** | System validates: no conflicting active rate cards for same role/skill/level/region combination. Warns if new card would override existing. | Fix conflicts; confirm override; save. |
| 5 | **Activation** | Rate card status changes to "Active". All new task pricing calculations use this card. Existing task pricing unchanged. | Activate; keep as draft. |

**Decision Points:**
- Step 4: Conflicting rate card exists? YES -> resolve conflict. NO -> save normally.

**Error/Edge Cases:**
- No rate cards configured: task pricing cannot be calculated; system warns "Configure at least one rate card before pricing tasks."
- Currency mismatch: system handles multi-currency; rate cards can be in different currencies.
- Rate card changes after tasks priced: existing task prices locked; new tasks use updated rates.

**Exit Points:**
- Rate card saved/activated -> return to list.
- Navigate to task pricing -> Flow G2.

**Audit:** Rate card changes logged: user ID, timestamp, card ID, old values, new values, status change.

---

### G2: Task Pricing View (rate card x effort)

**SOW References:** Section 3.1.MVP.6 (task pricing = rate card x effort -- manual or assisted estimate)

**Entry Point:** Task Detail > "Pricing" section, OR Commercial & Billing > Task Pricing.

**Pre-conditions:**
- Task exists with effort estimate and skills tags.
- Applicable rate card exists (Flow G1).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Task Pricing View** | For selected task or all tasks: Task name, Required skill, Level, Region, Applicable rate card, Rate (per unit), Estimated effort (hours or units), Calculated price (rate x effort), Currency. | View breakdown; adjust effort estimate; override price (with reason). |
| 2 | **Price Calculation Detail** | Breakdown: Rate card name, Rate = [amount]/[unit], Effort = [estimate] [units], Price = Rate x Effort = [total]. If multiple skills: weighted or primary skill rate used. | View; accept; adjust. |
| 3 | **Project Price Summary** | Aggregate: total project cost across all tasks. By milestone, by skill category, by contributor. | View summary; export pricing report. |

**Decision Points:**
- Effort estimate source: AI-assisted (from Decomposition Assistant) or manual entry? User can override either way.

**Error/Edge Cases:**
- No matching rate card for task's skill/level/region: "No rate card found. Please configure a rate card or manually set pricing."
- Price seems unreasonable (very high or very low): system flags for review.
- Currency conversion needed: if rate card currency differs from project currency.

**Exit Points:**
- Pricing reviewed -> return to project.
- Export pricing -> Flow G4.

**Audit:** Pricing views and overrides logged: user ID, timestamp, task ID, pricing method, override reason (if applicable).

---

### G3: Payout Eligibility Dashboard

**SOW References:** Section 3.1.MVP.6 (payout eligibility upon acceptance; basic wallet ledger)

**Entry Point:** Enterprise Admin Console > Commercial & Billing > Payout Eligibility.

**Pre-conditions:**
- Tasks with acceptance decisions exist.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Payout Dashboard** | Summary: total payouts eligible, total pending acceptance, total paid (if payment processing integrated). Table: task, contributor, acceptance date, payout amount, payout status (Eligible / Processing / Paid / On Hold). | Filter by project/status/date; sort; export. |
| 2 | **Payout Detail** | For selected payout: task detail, acceptance decision reference, rate card applied, effort logged, amount calculation, contributor wallet balance (if visible to enterprise role). | View detail; place on hold (with reason); release hold. |
| 3 | **Bulk Actions** | Select multiple payouts for bulk actions: export selected, place on hold, approve for processing. | Select rows; apply bulk action. |

**Decision Points:**
- Payout on hold? Requires reason and can only be placed by authorized role.

**Error/Edge Cases:**
- Payout eligibility without acceptance: should not occur (system enforces acceptance-first).
- Disputed payout: escalation to governance.
- Very large number of payouts: pagination, aggregate totals, export.

**Exit Points:**
- Payout processed -> status updated.
- Export -> Flow G4.

**Audit:** Payout status changes logged: payout ID, user ID, action, reason, timestamp.

---

### G4: Billing Report Export (CSV + API)

**SOW References:** Section 3.1.MVP.6 (export reports for billing and payouts -- CSV + API)

**Entry Point:** Commercial & Billing > "Export Reports" button.

**Pre-conditions:**
- Billing/payout data exists.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Export Options** | Report type: Billing summary, Payout report, Task pricing report, Full financial report. Format: CSV, PDF. Scope: date range, project(s), all. API endpoint documentation link (for programmatic access). | Select report type, format, scope. |
| 2 | **Report Generation** | Processing indicator. | Wait; cancel. |
| 3 | **Download/API** | CSV/PDF file download. API endpoint: `GET /v1/reports/billing?filters=...` with authentication (Section 3.1.MVP.8). | Download file; copy API endpoint. |

**Decision Points:**
- Step 1: Report type, format, and scope selection.

**Error/Edge Cases:**
- No data for selected scope: "No billing data available for the selected period."
- API access requires separate authorization (OAuth2 scope).

**Exit Points:**
- File downloaded or API endpoint documented -> return to billing.

**Audit:** Export event logged: user ID, timestamp, report type, format, scope.

---

### G5: Invoice & PO Management

**SOW References:** Section 3.1.7 (SOW submission/approval/PO creation, mapping to cost centers/GL codes/vendor records, invoice/billing statement generation, export to ERP/finance)

**Entry Point:** Enterprise Admin Console > Commercial & Billing > Invoices & POs.

**Pre-conditions:**
- Projects with accepted deliverables and pricing data.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Invoice List** | Table of invoices: invoice ID, project, SOW reference, amount, currency, status (Draft / Issued / Paid), date, PO number (if linked). | Search; filter by status/project/date; click for detail; create new invoice. |
| 2 | **Invoice Detail** | Invoice header: client, project, SOW, PO number, cost center, GL code. Line items: accepted tasks, quantity, rate, amount. Totals: subtotal, taxes (if applicable), total. | Edit draft invoice; issue; export to ERP; download PDF. |
| 3 | **PO Mapping** | Link invoice to PO: PO number, cost center, GL code, vendor record. Configured per enterprise integration (Section 3.1.MVP.9). | Map PO; update cost center/GL; save. |
| 4 | **Invoice Generation** | "Generate Invoice" from project deliverables: system auto-populates line items from accepted tasks with pricing. | Generate; review; edit; issue. |
| 5 | **ERP Export** | Push invoice to ERP/finance system via integration (Section 3.1.7): POST /v1/integrations/erp/invoices. Status tracking for export: Pending / Sent / Acknowledged / Failed. | Push to ERP; retry failed; view status. |

**Decision Points:**
- Step 3: PO exists? YES -> link. NO -> create without PO or create PO reference.
- Step 5: ERP integration configured? YES -> push available. NO -> manual export (PDF/CSV).

**Error/Edge Cases:**
- ERP export failure: retry with error detail; manual fallback.
- Invoice amount mismatch with PO: warning "Invoice amount exceeds PO value."
- Duplicate invoice: system warns "An invoice for this scope already exists."

**Exit Points:**
- Invoice issued -> billing complete.
- ERP export -> integration status tracked.

**Audit:** Invoice lifecycle logged: creation, editing, issuance, PO mapping, ERP export, all with user ID and timestamp.

---

## H. ADMIN & CONFIGURATION

---

### H1: Tenant Setup

**SOW References:** Section 3.1.6 (tenant setup)

**Entry Point:** Enterprise Admin Console > Admin & Configuration > Tenant Setup.

**Pre-conditions:**
- User has tenant admin role (highest enterprise privilege).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Tenant Overview** | Tenant name, ID, creation date, subscription tier, active user count, active project count, storage usage. | View; edit tenant settings. |
| 2 | **Tenant Settings** | Organization name, logo upload, primary contact, billing contact, default timezone, default currency, data retention policy preferences. | Edit fields; save; upload logo. |
| 3 | **Subscription Info** | Current tier, features included, usage limits, renewal date. | View; contact sales for upgrades (link). |

**Decision Points:**
- None significant -- configuration flow.

**Error/Edge Cases:**
- Unauthorized user: settings page is read-only or inaccessible.
- Logo upload: format/size validation (PNG/JPG, max 2MB).

**Exit Points:**
- Settings saved -> return to admin dashboard.

**Audit:** Tenant setting changes logged: user ID, timestamp, field changed, old value, new value.

---

### H2: Role Management & Access Control

**SOW References:** Section 3.1.6 (role management, access control), Section 3.1.MVP.8 (RBAC), Section 15.2 (least-privilege, Zero Trust)

**Entry Point:** Admin & Configuration > Roles & Access.

**Pre-conditions:**
- User has admin role with role management authority.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Roles List** | Table of all roles: role name, description, user count, permissions summary, status (Active/Disabled). Default roles: Tenant Admin, Project Sponsor, PMO, Finance Controller, HR/Talent Admin. | View; edit; create new role; disable. |
| 2 | **Role Detail/Edit** | Role name, description, permissions matrix: for each module/feature, checkboxes for Read/Write/Admin/None. Preview of what users with this role can access. | Edit permissions; save; preview access. |
| 3 | **User-Role Assignment** | List of users with their assigned roles. Search/filter users. | Assign role to user; remove role; bulk assign. |
| 4 | **Create Custom Role** | New role form: name, description, permissions (start from blank or clone existing role). | Define permissions; save; assign to users. |

**Decision Points:**
- Step 2: Principle of least privilege (Section 15.2) -- system provides guidance on minimum required permissions.

**Error/Edge Cases:**
- Removing own admin role: system prevents "You cannot remove your own admin role."
- No users with admin role: system prevents removing last admin.
- Role conflict: if user has conflicting roles, higher permission wins.

**Exit Points:**
- Roles configured -> return to admin.

**Audit:** Role changes logged: user ID, timestamp, role ID, permissions changed, users affected.

---

### H3: Policy Configuration (SLA templates, pricing rules, governance thresholds)

**SOW References:** Section 3.1.6 (configuration of policies -- SLA templates, pricing rules, governance thresholds), Section 4.3 (configurable stage gates, SLA templates per work type, configurable escalation and re-assignment rules)

**Entry Point:** Admin & Configuration > Policies.

**Pre-conditions:**
- User has admin role with policy configuration authority.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Policy Dashboard** | Three sections: SLA Templates, Pricing Rules, Governance Thresholds. Each showing active policy count and last modified date. | Click section to manage. |
| 2a | **SLA Templates** | List of SLA templates: name, work type, turnaround time, quality threshold, escalation rules. Default templates provided. | View; edit; create new; clone; activate/deactivate. |
| 2b | **SLA Template Editor** | Form: template name, work type (dropdown), assignment response SLA (hours), task completion SLA (hours/days), review completion SLA (hours), quality threshold (minimum acceptance score), escalation rules (auto-escalate after X hours, notify Y person), re-assignment rules (auto-reassign on SLA breach: yes/no). | Edit fields; save; preview. |
| 3a | **Pricing Rules** | Rules for task pricing beyond rate cards: minimum/maximum price caps, effort estimation guidelines, pricing approval thresholds (require approval for tasks above $X). | View; edit; add rules. |
| 3b | **Pricing Rule Editor** | Form: rule name, condition (e.g., "task price > $5,000"), action (e.g., "require finance approval"), effective date. | Edit; save; activate. |
| 4a | **Governance Thresholds** | Configurable thresholds: max rework cycles before escalation, fraud detection sensitivity, quality score thresholds for sanctions, risk score thresholds for alerts. | View; edit; save. |
| 4b | **Stage Gates** | Configurable stage gates for project workflow (Section 4.3): which gates are active (SOW intake, decomposition, review, execution, QA, acceptance, billing). Gate requirements per gate. | Enable/disable gates; configure requirements. |

**Decision Points:**
- Which policy area to configure: SLAs, pricing, or governance.

**Error/Edge Cases:**
- Invalid SLA (e.g., review SLA shorter than assignment SLA): system warns of logical inconsistency.
- Policy change affecting active projects: system warns "This change will affect X active projects."
- No policies configured: system uses platform defaults.

**Exit Points:**
- Policies saved -> return to policy dashboard.

**Audit:** Policy changes logged: user ID, timestamp, policy type, old value, new value, affected scope.

---

### H4: Integration Configuration (HRIS, ERP, LMS, Identity)

**SOW References:** Section 3.1.6 (integration configuration -- HRIS, ERP, LMS, identity), Section 3.1.MVP.9 (SSO/IdP, HRIS import/sync, webhooks/API), Section 21 (integrations)

**Entry Point:** Admin & Configuration > Integrations.

**Pre-conditions:**
- User has admin role with integration configuration authority.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Integration Dashboard** | List of integration types: Identity/SSO (SAML/OIDC), HRIS (employee sync), ERP (finance/invoicing), LMS (learning), Project Tools (webhooks). Each showing: status (Connected / Not Configured / Error), last sync date, sync frequency. | Click to configure; test connection; view logs. |
| 2 | **SSO/Identity Configuration** | IdP type (SAML/OIDC), IdP metadata URL or certificate upload, client ID/secret (OIDC), attribute mapping (email, name, roles), test connection button. | Enter credentials; map attributes; test; save; enable. |
| 3 | **HRIS Configuration** | Connection type (API/SFTP/manual import), endpoint URL, authentication credentials, sync fields mapping (employee ID, role, org, manager, cost center -- Section 3.1.MVP.9), sync schedule (manual/daily/weekly), last sync status and results. | Configure connection; map fields; schedule sync; trigger manual sync; view sync history. |
| 4 | **ERP Configuration** | Invoice push endpoint, authentication, field mapping (GL codes, cost centers, vendor records), test transaction. | Configure; map fields; test; save. |
| 5 | **Webhook Configuration** | Webhook endpoints for project tools: events to subscribe (task state changes, project updates), endpoint URL, authentication, retry policy. | Add webhook; test; enable/disable; view delivery logs. |

**Decision Points:**
- Which integration to configure: user selects based on enterprise needs.

**Error/Edge Cases:**
- Connection test failure: detailed error message (timeout, auth failed, endpoint not found).
- HRIS sync conflicts: employee exists in platform but fields differ from HRIS -> conflict resolution UI.
- Integration credentials expired: alert and re-authentication flow.

**Exit Points:**
- Integration configured and tested -> return to dashboard.

**Audit:** Integration configuration changes logged: user ID, timestamp, integration type, action (configure/test/sync), result.

---

### H5: Contributor Management & Role Assignment

**SOW References:** Section 3.1.MVP.3 (admin: contributor management + role assignment)

**Entry Point:** Admin & Configuration > Contributor Management.

**Pre-conditions:**
- User has admin role with contributor management authority.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Contributor List** | Table: contributor ID, name/identifier, type (internal/external), segment (student/women workforce/freelancer/employee), status (Active/Inactive/Pending), roles assigned, skills count, join date. | Search; filter by type/segment/status; sort; click for detail; invite new; bulk import. |
| 2 | **Contributor Detail** | Profile summary: type, segment, status, roles, skills, availability, assigned tasks, activity metrics (completion rate, SLA compliance). | Edit roles; change status (activate/deactivate/suspend); view activity; assign to project. |
| 3 | **Role Assignment** | Current roles displayed. Add/remove roles: Contributor, Mentor, Reviewer, Governance Officer. Role effective dates. | Add role; remove role; set effective dates. |
| 4 | **Invite New Contributor** | Invite form: email, role, segment (if external), invitation message. Generates invite link for external registration (Section 3.1.MVP.3 -- external via invite). | Send invite; copy link; bulk invite via CSV. |
| 5 | **Bulk Import** | Upload CSV of contributors (for manual import -- Section 3.1.MVP.3). Field mapping: name, email, role, skills, segment. Validation results before import. | Upload CSV; map fields; validate; confirm import. |

**Decision Points:**
- Step 4: External or internal contributor? External -> invite link. Internal -> HRIS sync or manual import.

**Error/Edge Cases:**
- Duplicate email on invite: "This email is already registered."
- Deactivating contributor with active tasks: warning "Contributor has X active tasks. Deactivation will require reassignment."
- Bulk import errors: validation report showing which rows failed and why.

**Exit Points:**
- Contributor managed -> return to list.
- Invite sent -> track in pending invitations.

**Audit:** Contributor management actions logged: user ID, timestamp, contributor ID, action (invite/role change/status change/import).

---

### H6: SOW Intake Form Configuration (per client template)

**SOW References:** Section 3.1.MVP.1 (configurable SOW intake forms -- per client template)

**Entry Point:** Admin & Configuration > SOW Intake Forms.

**Pre-conditions:**
- User has admin role.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Template List** | List of SOW intake form templates: name, description, field count, usage count (how many SOWs used this template), status (Active/Draft). Default template always present. | View; edit; create new; clone; activate/deactivate. |
| 2 | **Template Editor** | Form builder: add/remove/reorder fields. Each field: label, type (text/date/dropdown/multi-select/file upload/number), required (yes/no), help text, validation rules. Sections for organizing fields. Preview mode. | Add field; edit field; reorder; set required; preview; save. |
| 3 | **Preview** | Preview how the form looks to enterprise users during SOW intake (Flow B3 wizard / Flow B5 manual upload). | Test fill; return to editor. |
| 4 | **Activate** | Template becomes available for SOW creation. | Activate; keep as draft. |

**Decision Points:**
- Step 2: Which fields to include per client's needs.

**Error/Edge Cases:**
- Editing active template: system warns "Changes will affect future SOW submissions. Existing SOWs are not affected."
- Deleting template: only if unused. If used, can deactivate but not delete.

**Exit Points:**
- Template saved -> return to list.

**Audit:** Template changes logged: user ID, timestamp, template ID, fields added/removed/modified.

---

### H7: Review Rubric/Template Configuration

**SOW References:** Section 3.1.MVP.5 (review rubrics/templates -- configurable)

**Entry Point:** Admin & Configuration > Review Rubrics.

**Pre-conditions:**
- User has admin role.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Rubric List** | Table of rubric templates: name, applicable work type/skill, criteria count, usage count, status (Active/Draft). | View; edit; create; clone; activate/deactivate. |
| 2 | **Rubric Editor** | Rubric name, applicable work types/skills (multi-select). Criteria list: each criterion has name, description, weight (percentage), scoring scale (1-5 / Pass-Fail / custom), guidance notes for reviewer. Total weight must equal 100%. | Add/remove/reorder criteria; set weights; set scale; add guidance; save; preview. |
| 3 | **Preview** | Preview how rubric appears to mentor/reviewer during review (Flow context from Mentor Workspace doc). | Test score; return to editor. |
| 4 | **Activate** | Rubric available for assignment to tasks/projects. | Activate; keep as draft. |

**Decision Points:**
- Step 2: Criteria weights must total 100%.

**Error/Edge Cases:**
- Weights don't total 100%: validation error, cannot save.
- Editing rubric in use: warning "This rubric is assigned to X active tasks. Changes affect future reviews only."
- No rubrics configured: reviews proceed without structured scoring; system recommends configuring rubrics.

**Exit Points:**
- Rubric saved -> return to list.

**Audit:** Rubric changes logged: user ID, timestamp, rubric ID, criteria changed.

---

## I. ANALYTICS & INTELLIGENCE (Enterprise-Scoped)

---

### I1: Workforce Intelligence Dashboard (skills, capacity, performance)

**SOW References:** Section 3.1.6 (workforce intelligence dashboards -- skills inventory, gaps, learning needs), Section 19.4 (skill heatmaps, utilization, gap analysis), Section 27.3 (workforce KPIs)

**Entry Point:** Enterprise Admin Console > Analytics & Intelligence > Workforce Intelligence.

**Pre-conditions:**
- User has analytics access (RBAC).
- Contributor data exists (profiles, skills, activity).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Workforce Dashboard** | KPI summary cards: total contributors (by segment), active contributors, skills coverage %, utilization rate. Contributor engagement levels (Section 27.3). Skill development progress (Section 27.3). Diversity and inclusion participation metrics (Section 27.3). | View; filter; drill down. |
| 2 | **Skills Section** | Skills inventory: top skills, skill distribution by proficiency, skill heatmap (Section 19.4), gap analysis (demand vs. supply of skills). | Filter by segment/region; drill down on skill; view heatmap. |
| 3 | **Capacity Section** | Contributor availability: total available hours, allocated hours, utilization rate. By segment, by skill, by region. | Filter; drill down. |
| 4 | **Performance Section** | Aggregate performance: acceptance rate, on-time delivery rate, SLA compliance, rework rate. By segment, by skill, over time (trend). | Filter; compare segments; export. |

**Decision Points:**
- Which section to explore: user navigates based on need.

**Error/Edge Cases:**
- Sparse data (new platform): "Limited data available" messages with projections as data grows.
- Data scoped to tenant: enterprise only sees their own contributor data + shared pool metrics (anonymized).

**Exit Points:**
- Drill down to specific skill/segment detail.
- Export -> Flow I5.

**Audit:** Dashboard view logged: user ID, timestamp, sections accessed, filters applied.

---

### I2: Economic Dashboard (spend, savings, ROI)

**SOW References:** Section 3.1.6 (economic dashboards -- spend, savings, ROI, earning distribution), Section 27.3 (economic KPIs: average cost per task, platform transaction volume, contributor earnings growth)

**Entry Point:** Analytics & Intelligence > Economic Performance.

**Pre-conditions:**
- User has analytics/finance access.
- Task pricing and acceptance data exists.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Economic Dashboard** | KPI summary cards: total spend (all projects), average cost per task (Section 27.3), platform transaction volume (Section 27.3), cost savings (compared to alternative -- if baseline configured). | View; filter by date range/project. |
| 2 | **Spend Analysis** | Spend by project, by skill category, by contributor segment, by time period. Trend charts. Budget vs. actual comparison. | Filter; drill down; compare periods. |
| 3 | **ROI Section** | Cost per accepted deliverable, cost per rework (waste), cost efficiency trend, estimated savings from platform vs. traditional staffing (if baseline data available). | View; configure baseline; export. |
| 4 | **Earning Distribution** | How spend distributes across contributor segments (students, women workforce, freelancers, internal). Anonymized and aggregated. | View distribution; filter by project. |

**Decision Points:**
- Date range and filter selections drive all displayed data.

**Error/Edge Cases:**
- No financial data: "No economic data yet. Complete your first project to see analytics."
- ROI without baseline: "Configure a cost baseline to see ROI comparisons."

**Exit Points:**
- Export -> Flow I5.
- Drill down to project financials.

**Audit:** Dashboard view logged: user ID, timestamp, filters applied.

---

### I3: Governance & Risk Dashboard (incidents, fraud flags, overrides)

**SOW References:** Section 19.4 (governance and risk dashboards -- incidents, fraud flags, overrides), Section 14 (governance framework), Section 3.1.MVP.8 (monitoring)

**Entry Point:** Analytics & Intelligence > Governance & Risk.

**Pre-conditions:**
- User has admin/governance access.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Risk Overview** | Summary: active incidents count, fraud flags count, admin overrides count (this period), SLA breach count, escalation count. Severity breakdown: Critical / High / Medium / Low. | Filter by date/type/severity; drill down. |
| 2 | **Incidents List** | Table of incidents: type, severity, project, task, contributor (if applicable), date, status (Open / Investigating / Resolved), resolution. | Click for detail; filter; export. |
| 3 | **Fraud Flags** | Plagiarism/duplication detections (Section 14), behavioral anomaly flags, identity verification issues. Each with: flag type, evidence, confidence level, status. | Review flag; dismiss (with reason); escalate; mark resolved. |
| 4 | **Override Audit** | All admin overrides (assignment overrides, policy exceptions): date, user, action, reason, affected entity. | View detail; filter; export. |
| 5 | **Trend Analysis** | Charts: incidents over time, fraud flags over time, SLA breaches trend. Identify improving or deteriorating patterns. | Change time period; compare periods. |

**Decision Points:**
- Which area to investigate: incidents, fraud, overrides, or trends.

**Error/Edge Cases:**
- No incidents: positive state "No active governance incidents."
- High fraud flag volume: prioritization by confidence level; bulk review options.

**Exit Points:**
- Incident detail -> investigation workflow.
- Export -> Flow I5.

**Audit:** Governance dashboard access and actions logged: user ID, timestamp, flags reviewed/dismissed/escalated.

---

### I4: Self-service Analytics (filters, drilldowns)

**SOW References:** Section 3.1.6 (export and self-service analytics -- filters, drilldowns)

**Entry Point:** Analytics & Intelligence > Self-service Analytics.

**Pre-conditions:**
- User has analytics access.
- Data exists to analyze.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Analytics Builder** | Data source selection: Projects, Tasks, Contributors, Financial, Reviews, SLAs. Dimension selectors: group by (project, skill, segment, region, time period). Metric selectors: count, sum, average, min, max for selected measures. | Select data source; add dimensions; add metrics. |
| 2 | **Visualization** | Auto-generated chart based on selections: bar, line, pie, table. Chart updates as user changes parameters. | Switch chart type; adjust parameters; drill down on data points. |
| 3 | **Drill Down** | Click any data point to see underlying records. E.g., click "Student contributors" bar to see individual tasks completed by student contributors. | Drill deeper; apply additional filters; export subset. |
| 4 | **Save & Share** | Save custom analytics view for future access. Name, description, visibility (personal/team). | Save; share link; schedule email report. |

**Decision Points:**
- Step 1: Which data source and dimensions? User builds query interactively.

**Error/Edge Cases:**
- Complex query with large dataset: performance warning; suggest adding filters.
- No data for selected combination: "No data available for this combination."
- Saved view references deleted data: "Some data in this view is no longer available."

**Exit Points:**
- View saved -> return to analytics.
- Export -> Flow I5.

**Audit:** Analytics queries logged: user ID, timestamp, data source, dimensions, metrics, export actions.

---

### I5: Analytics Export

**SOW References:** Section 3.1.6 (export), Section 3.1.MVP.6 (export reports -- CSV + API)

**Entry Point:** Any analytics dashboard > "Export" button.

**Pre-conditions:**
- Analytics data is displayed.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Export Options** | Format: CSV, PDF. Scope: current view (with applied filters), full dataset. Include: data only, data + charts (PDF only). | Select format; select scope. |
| 2 | **Generation** | Processing indicator. | Wait; cancel. |
| 3 | **Download** | File download with descriptive name. | Download; export again with different options. |

**Decision Points:**
- Format and scope by user.

**Error/Edge Cases:**
- Very large export: async generation with notification.
- PDF with complex charts: simplified chart rendering.

**Exit Points:**
- File downloaded -> return to analytics.

**Audit:** Export logged: user ID, timestamp, dashboard source, format, scope.

---

## J. AUDIT & COMPLIANCE

---

### J1: Audit Log View (searchable, filterable, exportable)

**SOW References:** Section 3.1.MVP.8 (immutable audit logging for all critical actions, searchable/exportable)

**Entry Point:** Enterprise Admin Console > Audit Log.

**Pre-conditions:**
- User has admin role with audit access.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Audit Log View** | Chronological table of audit events. Columns: timestamp, user, action type, resource (SOW/task/assignment/review/payment), resource ID, detail summary, IP address. Default: most recent first. Pagination for large datasets. | Search; filter; sort; export. |
| 2 | **Search** | Full-text search across: user name, action type, resource ID, detail text. | Type query; results filter. |
| 3 | **Filters** | Filter panel: date range, action type (login/SOW change/assignment/submission/review/acceptance/pricing/payout/admin override/configuration change), user, resource type, severity. | Apply/clear/combine filters. |
| 4 | **Event Detail** | Click any event for full detail: all fields including full "before" and "after" values for changes, request context, session ID. | View; copy event ID; export single event. |
| 5 | **Export** | Export filtered audit log: CSV, PDF, JSON. | Select format; download. |

**Decision Points:**
- Which events to examine: user filters based on audit/compliance need.

**Error/Edge Cases:**
- Massive audit log: pagination mandatory; date range filter recommended.
- Immutability guarantee: audit events cannot be edited or deleted (Section 3.1.MVP.8) -- UI shows read-only, no delete option.

**Exit Points:**
- Events examined -> return or export.
- Navigate to referenced resource (e.g., click SOW ID to view SOW).

**Audit:** Audit log access itself is logged (meta-audit): user ID, timestamp, filters applied, events viewed.

---

### J2: Critical Action Audit Trail

**SOW References:** Section 3.1.MVP.8 (immutable audit logging for: SOW changes, assignments, submissions, reviews, acceptances, pricing, payout eligibility)

**Entry Point:** Audit Log > "Critical Actions" filter, OR Audit & Compliance > Critical Action Trail.

**Pre-conditions:**
- User has admin/compliance role.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Critical Actions View** | Pre-filtered audit log showing only critical action types (as defined in Section 3.1.MVP.8): SOW changes (create, edit, approve), Assignments (create, override, reassign), Submissions (create, rework), Reviews (score, decision), Acceptances (accept, reject, rework request), Pricing changes (rate card change, price override), Payout eligibility changes (eligible, on hold, processed). Summary counts by type. | Filter further; drill down; export. |
| 2 | **Action Detail** | Full detail for selected critical action: who, what, when, before/after values, related entities (SOW, task, contributor), decision reasons. | View; export; navigate to related entity. |
| 3 | **Compliance Summary** | Summary statistics: critical actions by type (this period), by user, anomalies (unusual patterns -- e.g., high override count). | View; set date range; export. |

**Decision Points:**
- Which action type to investigate.

**Error/Edge Cases:**
- No critical actions in period: "No critical actions recorded in this period."
- Anomaly detection: if admin override count is unusually high, system flags for review.

**Exit Points:**
- Investigation complete -> export or return.
- Navigate to related entity for context.

**Audit:** Access to critical action trail logged.

---

### J3: Compliance Report Generation

**SOW References:** Section 3.1.MVP.8 (audit logs searchable/exportable), Section 17.4 (data governance -- data classification, lineage), Section 15 (security architecture)

**Entry Point:** Audit & Compliance > "Generate Compliance Report".

**Pre-conditions:**
- User has compliance/admin role.
- Sufficient audit and operational data exists.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Report Type Selection** | Available report types: Access Control Audit (RBAC effectiveness, login patterns, unauthorized access attempts), Data Handling Audit (data classification compliance, retention policy adherence), Financial Audit (all pricing, payout, invoice actions for period), Governance Audit (overrides, exceptions, escalations, resolutions), Custom (build from audit log filters). | Select report type. |
| 2 | **Report Parameters** | Date range, scope (all projects / specific project / specific user), detail level (summary / detailed), format (PDF / CSV / both). | Set parameters; generate. |
| 3 | **Report Generation** | Processing indicator. For large reports: async generation with notification. | Wait; cancel. |
| 4 | **Report Review** | Generated report displayed: executive summary, detailed findings, data tables, charts (for PDF). | Review; download; regenerate with different parameters; share. |

**Decision Points:**
- Step 1: Which report type? User selects based on compliance requirement.
- Step 2: Parameters determine scope and detail.

**Error/Edge Cases:**
- Insufficient data for meaningful report: "Not enough data for this report type in the selected period."
- Very large report: generated asynchronously; email notification when ready.
- Custom report too complex: performance warning with suggestion to narrow scope.

**Exit Points:**
- Report downloaded -> compliance documentation complete.
- Report shared with stakeholders.

**Audit:** Compliance report generation logged: user ID, timestamp, report type, parameters, generation result.

---

## APPENDIX A: Navigation Map

```
Enterprise Admin Console
|
|-- [Dashboard]
|   |-- Project summary cards
|   |-- Active exceptions count
|   |-- Pending approvals
|   |-- Quick actions
|
|-- [SOW Management]
|   |-- SOW Repository (B1) -- with Intake Mode column
|   |-- New SOW -> Intake Mode Selector (B2)
|   |   |-- AI-Generated SOW -> Parameter Wizard (B3) -> AI Draft Review (B4)
|   |   |-- Manual Upload (B5) -- enhanced with OCR, NLP, gap analysis
|   |-- SOW Detail (B6) -- with risk score, ethics, classification
|   |-- Multi-Stage Approval Workflow (B7)
|   |-- Version Comparison (B8) -- with intake mode indicator
|   |-- SOW Export (B9)
|
|-- [Task Planning]
|   |-- Decomposition (C1) -> Skills Tagging (C2) -> Dependencies (C3)
|   |-- Plan Approval (C4)
|   |-- Plan Export (C5)
|   |-- Plan Revision (C6)
|
|-- [Team Formation]
|   |-- Matching Results (D1)
|   |-- Team Confirmation (D2)
|   |-- Assignment Monitoring (D4)
|   |-- Admin Override (D3)
|   |-- Reassignment (D5)
|
|-- [Project Monitoring]
|   |-- Portfolio View (E1)
|   |-- Project Detail (E2) -> Task Status (E3)
|   |-- Exception Management (E4)
|   |-- Real-time View (E5)
|   |-- Historical View (E6)
|
|-- [Review & Acceptance]
|   |-- Evidence Pack View (F1)
|   |-- Acceptance Decision (F2)
|   |-- Rework Tracking (F3)
|   |-- Acceptance Logs Export (F4)
|
|-- [Commercial & Billing]
|   |-- Rate Cards (G1)
|   |-- Task Pricing (G2)
|   |-- Payout Eligibility (G3)
|   |-- Billing Export (G4)
|   |-- Invoices & POs (G5)
|
|-- [Admin & Configuration]
|   |-- Tenant Setup (H1)
|   |-- Roles & Access (H2)
|   |-- Policies (H3)
|   |-- Integrations (H4)
|   |-- Contributor Management (H5)
|   |-- SOW Intake Forms (H6)
|   |-- Review Rubrics (H7)
|
|-- [Analytics & Intelligence]
|   |-- Workforce Dashboard (I1)
|   |-- Economic Dashboard (I2)
|   |-- Governance & Risk (I3)
|   |-- Self-service Analytics (I4)
|   |-- Export (I5)
|
|-- [Audit Log]
|   |-- Audit Log View (J1)
|   |-- Critical Actions (J2)
|   |-- Compliance Reports (J3)
```

---

## APPENDIX B: SOW Section Cross-Reference Index

| SOW Section | Flows Referencing It |
|-------------|---------------------|
| 3.1.MVP.1 | B1, B5, B6, B7, B8, B9, H6 |
| 3.1.MVP.2 | C1, C2, C3, C4, C5, C6 |
| 3.1.MVP.3 | A2, H5 |
| 3.1.MVP.4 | D1, D2, D3, D4, D5 |
| 3.1.MVP.5 | E3, F1, F2, F3, F4, H7 |
| 3.1.MVP.6 | G1, G2, G3, G4, I2 |
| 3.1.MVP.7 | B5, C1 |
| 3.1.MVP.8 | A1, A2, E3, F2, J1, J2, J3 |
| 3.1.MVP.9 | H4 |
| 3.1.6 | A2, E1, E2, E4, E5, E6, H1, H2, H3, H4, I1, I2, I3, I4, I5 |
| 3.1.7 | G5 |
| 4.3 | D5, H3 |
| 9.1-9.5 | G1, G2, G3 |
| 14 | I3 |
| 15.2 | A2, H2 |
| 19.1 | E1 |
| 19.4 | I1, I2, I3 |
| 27.3 | I1, I2 |
| SOW V2.0 | B1, B2, B3, B4, B5, B6, B7, B8, B9 |

---

## APPENDIX C: Screen Inventory for Wireframing

### Tier 1: MVP Critical Path (Enterprise)
1. SOW Intake Mode Selector (B2)
2. AI Parameter Wizard -- 10-step progressive form (B3)
3. AI Draft Review -- hallucination controls, risk scoring (B4)
4. Manual SOW Upload -- drag-and-drop, OCR, NLP, gap analysis (B5)
5. Multi-Stage Approval Workflow -- 4-stage tracker (B7)
6. Task Decomposition / Planner UI (C1)
7. Matching Results + "Why Matched" (D1)
8. Team Confirmation (D2)
9. Project Detail (E2)
10. Evidence Pack Review (F1)
11. Acceptance Decision (F2)

### Tier 2: Important Supporting
12. SOW Repository -- with Intake Mode + Risk Score columns (B1)
13. SOW Detail -- enhanced with risk, ethics, classification tabs (B6)
14. Version Comparison -- with intake mode indicator (B8)
15. SOW Export (B9)
16. Assignment Monitoring (D4)
17. Exception Management (E4)
18. Rate Card Configuration (G1)
19. Billing Export (G4)

### Tier 3: Configuration & Analytics
20. Role Management (H2)
21. Policy Configuration (H3)
22. Integration Configuration (H4)
23. Workforce Dashboard (I1)
24. Economic Dashboard (I2)
25. Audit Log (J1)

## APPENDIX D: V2.0 Admin Configuration Flows (Brief Notes)

The following admin configuration flows support the new V2.0 SOW intake features. They are managed within the Admin & Configuration section (H) of the console.

### Template & Clause Library Management
- **Entry Point:** Admin & Configuration > SOW Templates & Clauses
- Template CRUD: create, edit, archive, clone templates by industry/project type/complexity
- Clause library CRUD: add standard clauses (liability, IP, confidentiality, SLA, warranty, termination), set categories, track usage
- Approval workflow for new/edited clauses before they appear in wizard
- Template versioning: published templates are immutable; edits create new versions

### Hallucination Prevention Threshold Configuration
- **Entry Point:** Admin & Configuration > AI Governance > Hallucination Thresholds
- Per-layer threshold configuration for the 8 hallucination prevention layers (Flow B4)
- Threshold levels: what triggers green/yellow/red status per layer
- Global strictness mode: Conservative (strict thresholds) / Standard / Permissive
- Override authority: who can dismiss red-flagged hallucination warnings (RBAC-controlled)
- Audit trail for all threshold changes

### Ethics Rule Configuration
- **Entry Point:** Admin & Configuration > Ethics & Compliance Rules
- Configure ethics screening criteria: non-discrimination, labor standards, accessibility, environmental
- Define prohibited clause patterns (regex or semantic matching)
- Set minimum ethical constraints per SOW classification level
- Industry-specific ethics rule sets (selectable per template)
- Ethics rule versioning and activation scheduling

### Risk Scoring Parameters
- **Entry Point:** Admin & Configuration > Risk Scoring
- Configure risk score weights: Completeness (default 30%), Confidence (default 25%), Compliance (default 25%), Pattern Match (default 20%)
- Define risk-based routing thresholds: Low (0-25), Medium (26-50), High (51-75), Critical (76-100) -- thresholds adjustable
- Configure actions per risk tier: which approval stages are mandatory, which can be skipped
- Historical risk score benchmarks: compare new SOWs against portfolio averages
- Audit trail for all parameter changes
