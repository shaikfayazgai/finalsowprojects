# Flow Document: Enterprise Admin Console

**Version:** 1.0
**Date:** 2026-03-06
**SOW Module:** Enterprise Admin Console (Section 19.1 + 3.1.6)
**Target Users:** Enterprise business owners, project sponsors, HR/Talent/L&D teams, procurement/finance controllers, PMO (Section 2.3)
**Basis:** Every flow in this document is derived from SOW V1.1. Section numbers are cited inline. Nothing is invented.

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
| SOW Management | SOW upload, repository, detail, versions, export | 3.1.MVP.1 |
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

**Navigation Structure:**

```
Enterprise Admin Console
|-- Dashboard (default landing)
|-- SOW Management
|   |-- Upload SOW
|   |-- SOW Repository
|   |-- SOW Detail
|-- Task Planning
|   |-- Decomposition View
|   |-- Plan Approval
|   |-- Plan Export
|-- Team Formation
|   |-- Matching Results
|   |-- Team Confirmation
|   |-- Assignment Monitoring
|-- Project Monitoring
|   |-- Project Portfolio
|   |-- Project Detail
|   |-- Exception Management
|-- Review & Acceptance
|   |-- Evidence Pack Review
|   |-- Acceptance Logs
|-- Commercial & Billing
|   |-- Rate Cards
|   |-- Task Pricing
|   |-- Billing & Exports
|   |-- Invoices
|-- Admin & Configuration
|   |-- Tenant Setup
|   |-- Roles & Access
|   |-- Policies (SLAs, Governance)
|   |-- Integrations
|   |-- Contributor Management
|-- Analytics & Intelligence
|   |-- Workforce Dashboards
|   |-- Economic Dashboards
|   |-- Governance & Risk
|   |-- Self-service Analytics
|-- Audit Log
```

**Audit:** All access attempts (authorized and unauthorized) logged immutably (Section 3.1.MVP.8).

---

## B. SOW MANAGEMENT

---

### B1: SOW Upload -- Document Upload Flow (DOC/PDF)

**SOW References:** Section 3.1.MVP.1 (SOW ingestion via UI -- DOC/PDF upload), Section 3.1.MVP.7 (SOW Intake Assistant)

**Entry Point:** Enterprise Admin Console > SOW Management > Upload SOW > "Upload Document" tab.

**Pre-conditions:**
- User authenticated with enterprise role (Flow A1).
- User has SOW document in DOC or PDF format ready for upload.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Upload SOW Page** | Two options: "Upload Document (DOC/PDF)" and "Fill Structured Form". Instructions explaining supported formats. | Select "Upload Document" tab. |
| 2 | **File Upload Area** | Drag-and-drop zone with file browser button. Accepted formats: DOC, DOCX, PDF. Max file size indicator. | Drag file or click to browse; select file from local system. |
| 3 | **File Validation** | System validates file format and size. Progress bar during upload. | None -- automatic validation. |
| 3a | **Validation Failure** | If file is wrong format or exceeds size: error message specifying the issue ("Unsupported format. Please upload DOC, DOCX, or PDF."). | Select different file; retry. |
| 4 | **Upload Confirmation** | File name, size, and format displayed. "Processing..." status indicator. | Cancel upload; wait for processing. |
| 5 | **AI Extraction** | SOW Intake Assistant (Section 3.1.MVP.7) processes the document: extracts metadata (title, dates, stakeholders, confidentiality level, deliverables list), tags clauses (dependencies, assumptions, constraints). Processing progress indicator. | None -- automatic AI processing. |
| 6 | **Extraction Results** | AI-extracted data displayed for human validation (see Flow B3). SOW status set to "Draft" (Section 3.1.MVP.1 -- SOW versioning: draft/approved). | Proceed to review extracted data (Flow B3). |

**Decision Points:**
- Step 3: Is file valid format and within size limit? YES -> Step 4. NO -> Step 3a.

**Error/Edge Cases:**
- Corrupt file: system displays "Unable to process document. Please check file integrity and retry."
- Very large document: extended processing time with progress indicator; timeout after configurable limit with notification.
- Scanned PDF (image-based): SOW Intake Assistant attempts OCR; if low confidence, warns user "Low extraction confidence. Please review all fields carefully."
- Upload interrupted (network): system detects incomplete upload, prompts retry.

**Exit Points:**
- Successful upload -> Flow B3 (AI Extraction Review).
- Failed upload -> retry or cancel.

**Audit:** SOW upload event logged (Section 3.1.MVP.1 -- audit events for SOW lifecycle): user ID, timestamp, file name, file hash, status = "uploaded".

---

### B2: SOW Upload -- Structured Form Flow

**SOW References:** Section 3.1.MVP.1 (SOW ingestion via UI -- structured form, configurable SOW intake forms per client template)

**Entry Point:** Enterprise Admin Console > SOW Management > Upload SOW > "Fill Structured Form" tab.

**Pre-conditions:**
- User authenticated with enterprise role.
- SOW intake form template configured by admin (Flow H6) or default template available.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Upload SOW Page** | Two options displayed. | Select "Fill Structured Form" tab. |
| 2 | **Template Selection** | If multiple intake form templates configured (per client template -- Section 3.1.MVP.1): list of available templates. If only one: auto-selected. | Select template; proceed. |
| 3 | **Structured Form** | Form fields based on template: Title, Client name, Start date, End date, Stakeholders, Confidentiality level, Deliverables list (multi-entry), Dependencies, Assumptions, Constraints, Budget/commercial terms, Additional notes. Required fields marked with asterisks. | Fill in fields; add multiple deliverables; save draft; submit. |
| 4 | **Form Validation** | System validates required fields. Highlights missing/invalid fields with inline error messages. | Fix validation errors; resubmit. |
| 5 | **SOW Created** | SOW record created with status "Draft". Confirmation message with SOW ID. All entered data saved. | View SOW detail (Flow B6); edit further; proceed to decomposition. |

**Decision Points:**
- Step 2: Multiple templates available? YES -> user selects. NO -> auto-selected default.
- Step 4: All required fields valid? YES -> Step 5. NO -> highlight errors, stay on form.

**Error/Edge Cases:**
- Partially filled form: user can "Save Draft" at any point and return later.
- Duplicate SOW title: system warns "A SOW with this title already exists" but allows proceeding (different SOWs may have same title).
- Session timeout during form fill: draft auto-saved periodically; user can resume.

**Exit Points:**
- SOW created -> Flow B6 (SOW Detail View) or Flow C1 (Decomposition).
- Draft saved -> SOW Repository with status "Draft".

**Audit:** SOW creation event logged: user ID, timestamp, SOW ID, method = "structured_form", status = "draft".

---

### B3: SOW AI Extraction Review (metadata, clauses, human validation)

**SOW References:** Section 3.1.MVP.1 (metadata extraction, clause tagging with human validation), Section 3.1.MVP.7 (SOW Intake Assistant -- extract/summarize/tag + recommendations)

**Entry Point:** Automatic redirect after document upload (Flow B1, Step 6) OR SOW Repository > select draft SOW > "Review Extraction".

**Pre-conditions:**
- SOW document uploaded and AI extraction completed (Flow B1).
- SOW status is "Draft".

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Extraction Review Page** | Two-panel layout: LEFT = original document preview (scrollable); RIGHT = AI-extracted fields. | Scroll document; review extracted data. |
| 2 | **Metadata Section** | Extracted metadata displayed as editable fields: Title, Dates (start/end), Stakeholders (list), Confidentiality level, Deliverables list. Each field shows AI confidence indicator (high/medium/low). | Edit any field; accept AI suggestion; flag for manual review. |
| 3 | **Clause Tags Section** | Tagged clauses displayed: Dependencies, Assumptions, Constraints. Each clause linked to its location in the original document (click to highlight). AI-generated tags shown as removable chips. | Accept/reject individual tags; add new tags manually; edit clause text. |
| 4 | **AI Recommendations** | SOW Intake Assistant recommendations panel: suggested clarifications, identified ambiguities, risk flags (e.g., "Deadline appears tight given scope"), summary of SOW scope. | Accept recommendation; dismiss; add note. |
| 5 | **Validation Actions** | Validation status per section: "Validated" / "Needs Review" / "Edited". Overall validation progress bar. | Mark sections as validated; request re-extraction for specific sections; add comments. |
| 6 | **Save & Proceed** | All changes saved. SOW remains in "Draft" status until explicitly approved (Flow B4). | Save validated data; proceed to approval (Flow B4); return to repository. |

**Decision Points:**
- Step 2-3: For each field/clause: Is AI extraction correct? YES -> accept. NO -> edit manually.
- Step 4: Are AI recommendations actionable? YES -> accept and adjust SOW. NO -> dismiss.

**Error/Edge Cases:**
- AI extraction completely wrong (e.g., wrong document type): user can clear all extracted fields and fill manually, effectively converting to structured form flow.
- Low confidence extraction (scanned PDF): multiple fields marked "low confidence" with warning banner "Several fields have low extraction confidence. Please review carefully."
- User disagrees with AI clause tagging: can remove all AI tags and tag manually.
- Very long SOW: pagination or section-by-section review mode.

**Exit Points:**
- Validated -> Flow B4 (SOW Versioning/Approval).
- Save as draft -> return later from SOW Repository.

**Audit:** Extraction review events logged: user ID, timestamp, SOW ID, fields edited (before/after), AI recommendations accepted/dismissed.

---

### B4: SOW Versioning (draft -> approved)

**SOW References:** Section 3.1.MVP.1 (SOW versioning -- draft/approved, audit history)

**Entry Point:** SOW Detail View > "Approve SOW" button (available when SOW status is "Draft" and extraction review completed).

**Pre-conditions:**
- SOW exists in "Draft" status.
- Extraction review completed (all sections validated or manually filled).
- User has approval authority (RBAC-based).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **SOW Detail** | SOW metadata, clauses, deliverables, validation status. Current status: "Draft". Version number displayed (e.g., v1.0-draft). | Click "Approve SOW" button. |
| 2 | **Approval Confirmation** | Modal/dialog: "Approve this SOW? Once approved, changes will create a new version." Summary of SOW scope. Optional approval notes field. | Confirm approval; cancel; request changes (return to draft). |
| 3 | **Version Created** | SOW status changes from "Draft" to "Approved". Version number updated (e.g., v1.0). Timestamp and approver recorded. | View approved SOW; proceed to decomposition (Flow C1); share with stakeholders. |

**Decision Points:**
- Step 2: User confirms approval? YES -> Step 3. NO -> return to SOW Detail in Draft status.

**Error/Edge Cases:**
- SOW has unvalidated sections: system prevents approval with message "All sections must be validated before approval."
- User lacks approval authority: "Approve" button disabled with tooltip "You do not have permission to approve SOWs. Contact your administrator."
- Editing an approved SOW: creates new version (e.g., v2.0-draft) while preserving the approved version. Previous approved version remains accessible in version history.
- Concurrent editing: if another user is editing the same SOW, system warns "This SOW is being edited by [user]. Your changes may conflict."

**Exit Points:**
- Approved -> Flow C1 (Decomposition) or SOW Repository.
- Cancelled -> SOW remains Draft.

**Audit:** Approval event logged immutably: user ID, timestamp, SOW ID, version number, previous status, new status = "approved", approval notes.

---

### B5: SOW Repository -- Browse, Search, Filter

**SOW References:** Section 3.1.MVP.1 (SOW repository + search + export)

**Entry Point:** Enterprise Admin Console > SOW Management > SOW Repository.

**Pre-conditions:**
- User authenticated with enterprise role.
- At least one SOW exists in the system (otherwise empty state).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **SOW Repository** | Table/list of all SOWs accessible to the user's tenant. Columns: SOW ID, Title, Client, Status (Draft/Approved), Created Date, Last Modified, Version, Confidentiality Level. Pagination controls. Default sort: most recently modified. | Browse list; search; filter; sort; click row to view detail. |
| 2 | **Search** | Search bar at top. Searches across: SOW title, client name, SOW ID, deliverables text, stakeholder names. | Type search query; results filter in real-time or on submit. |
| 3 | **Filters** | Filter panel (sidebar or dropdown): Status (Draft / Approved / All), Date range (created / modified), Confidentiality level, Client/stakeholder. | Apply/clear filters; combine multiple filters. |
| 4 | **Sort** | Clickable column headers for sorting. Sort indicators (ascending/descending). | Sort by any column. |
| 5 | **SOW Row Click** | Navigates to SOW Detail View (Flow B6). | View full SOW detail. |

**Decision Points:**
- Step 1: Any SOWs exist? YES -> display list. NO -> empty state with "Upload your first SOW" call-to-action.

**Error/Edge Cases:**
- No search results: "No SOWs match your search. Try different keywords or clear filters."
- Large number of SOWs: pagination (configurable page size), performance optimization.
- Confidential SOWs: only visible to users with appropriate access level (RBAC + confidentiality-based access).

**Exit Points:**
- Click SOW -> Flow B6 (SOW Detail View).
- Click "Upload SOW" -> Flow B1 or B2.

**Audit:** Repository access logged: user ID, timestamp, search queries, filters applied.

---

### B6: SOW Detail View (metadata, clauses, versions, audit history)

**SOW References:** Section 3.1.MVP.1 (SOW repository, SOW versioning, audit history)

**Entry Point:** SOW Repository > click SOW row, OR direct link from notification/dashboard.

**Pre-conditions:**
- SOW exists and user has access (RBAC + tenant isolation).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **SOW Detail Header** | SOW title, ID, status badge (Draft/Approved), version number, confidentiality level, created/modified dates, creator/approver names. | Edit (if Draft); approve (if Draft + validated); export; view versions; view audit history. |
| 2 | **Metadata Tab** | All extracted/entered metadata: title, dates, stakeholders, confidentiality, deliverables list, budget/commercial terms. | Edit fields (creates new draft version if currently Approved). |
| 3 | **Clauses Tab** | Tagged clauses: dependencies, assumptions, constraints. Each clause with its tag type and source location in document. | View clause detail; add/edit/remove tags. |
| 4 | **Document Tab** | Original uploaded document preview (if uploaded via DOC/PDF). Scrollable, searchable. | Scroll; search within document; download original. |
| 5 | **Versions Tab** | List of all versions: version number, status, date, author, change summary. | Click to view any historical version; compare versions side-by-side. |
| 6 | **Audit History Tab** | Chronological audit trail: all events related to this SOW (upload, edits, approval, decomposition trigger). Each entry: timestamp, user, action, details. | Filter audit events by type; export audit log. |
| 7 | **Linked Projects Tab** | Projects created from this SOW (if any). Project name, status, progress. | Click to navigate to Project Detail (Flow E2). |

**Decision Points:**
- Is SOW in Draft status? YES -> edit/approve actions available. NO (Approved) -> editing creates new draft version.
- Has decomposition been started? YES -> "View Task Plan" link shown. NO -> "Start Decomposition" button shown.

**Error/Edge Cases:**
- SOW deleted/archived by another user: "This SOW is no longer available" message.
- Version comparison with significant changes: side-by-side diff highlighting added/removed/changed content.

**Exit Points:**
- Navigate to decomposition (Flow C1).
- Navigate to linked project (Flow E2).
- Return to SOW Repository.
- Export SOW (Flow B7).

**Audit:** SOW detail view logged: user ID, timestamp, SOW ID, tabs accessed.

---

### B7: SOW Export

**SOW References:** Section 3.1.MVP.1 (SOW repository + export)

**Entry Point:** SOW Detail View > "Export" button, OR SOW Repository > bulk export.

**Pre-conditions:**
- SOW exists and user has access.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Export Options** | Modal/dropdown: Export format selection (PDF, CSV). Content selection: "Full SOW (metadata + clauses + audit)", "Metadata only", "Audit history only". Version selection: current or specific version. | Select format; select content scope; select version. |
| 2 | **Export Generation** | Processing indicator. | Wait; cancel. |
| 3 | **Download** | Download link/automatic browser download. File named: `SOW-{ID}-{title}-v{version}.{format}`. | Download file; export another. |

**Decision Points:**
- Step 1: Which format and content scope? User selects.

**Error/Edge Cases:**
- Export of very large SOW: may take longer; async generation with notification when ready.
- PDF generation failure: fallback message with retry option.

**Exit Points:**
- File downloaded -> return to SOW Detail or Repository.

**Audit:** Export event logged: user ID, timestamp, SOW ID, format, content scope.

---

## C. TASK DECOMPOSITION & PLANNING

---

### C1: AI-Assisted Decomposition (SOW -> milestones -> tasks/subtasks)

**SOW References:** Section 3.1.MVP.2 (semi-automated decomposition, Planner UI), Section 3.1.MVP.7 (Decomposition Assistant -- task plan suggestions)

**Entry Point:** SOW Detail View > "Start Decomposition" button, OR Task Planning > "New Plan from SOW".

**Pre-conditions:**
- SOW in "Approved" status (Flow B4 completed).
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
- Click "New Project" -> Flow B1 (SOW Upload).

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
| 3 | **Preview** | Preview how the form looks to enterprise users during SOW creation (Flow B2). | Test fill; return to editor. |
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
|   |-- Upload SOW (B1: Doc Upload, B2: Structured Form)
|   |-- SOW Repository (B5)
|   |-- SOW Detail (B6) -> AI Extraction Review (B3) -> Approval (B4)
|   |-- SOW Export (B7)
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
| 3.1.MVP.1 | B1, B2, B3, B4, B5, B6, B7, H6 |
| 3.1.MVP.2 | C1, C2, C3, C4, C5, C6 |
| 3.1.MVP.3 | A2, H5 |
| 3.1.MVP.4 | D1, D2, D3, D4, D5 |
| 3.1.MVP.5 | E3, F1, F2, F3, F4, H7 |
| 3.1.MVP.6 | G1, G2, G3, G4, I2 |
| 3.1.MVP.7 | B1, B3, C1 |
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

---

## APPENDIX C: Screen Inventory for Wireframing

### Tier 1: MVP Critical Path (Enterprise)
1. SOW Upload Page (B1/B2)
2. AI Extraction Review (B3)
3. Task Decomposition / Planner UI (C1)
4. Matching Results + "Why Matched" (D1)
5. Team Confirmation (D2)
6. Project Detail (E2)
7. Evidence Pack Review (F1)
8. Acceptance Decision (F2)

### Tier 2: Important Supporting
9. SOW Repository (B5)
10. SOW Detail (B6)
11. Assignment Monitoring (D4)
12. Exception Management (E4)
13. Rate Card Configuration (G1)
14. Billing Export (G4)

### Tier 3: Configuration & Analytics
15. Role Management (H2)
16. Policy Configuration (H3)
17. Integration Configuration (H4)
18. Workforce Dashboard (I1)
19. Economic Dashboard (I2)
20. Audit Log (J1)
