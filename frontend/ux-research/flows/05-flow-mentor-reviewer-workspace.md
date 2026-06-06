# Flow Document: Mentor & Reviewer Workspace

**Version:** 1.0
**Date:** 2026-03-06
**SOW Module:** Mentor & Reviewer Workspace (Section 19.3 + 3.1.5)
**Target Users:** Mentors, reviewers, and governance officers (Section 2.3)
**Basis:** Every flow in this document is derived from SOW V1.1. Section numbers are cited inline. Nothing is invented.

---

## Table of Contents

- [A. Authentication & Access](#a-authentication--access)
- [B. Review Queue Management](#b-review-queue-management)
- [C. Review Detail & Decision](#c-review-detail--decision)
- [D. Single-Stage vs Two-Stage Review](#d-single-stage-vs-two-stage-review)
- [E. Rework Management](#e-rework-management)
- [F. Review History & Audit](#f-review-history--audit)
- [G. Escalation](#g-escalation)
- [H. Settings](#h-settings)

---

## Persona Reference

**Primary Persona:** Rajesh Kumar -- Mentor & Reviewer (from UX Research Foundation, Part 2)
- Senior Software Architect, 15+ years experience
- 5-8 hours/week for mentoring/review
- Expects professional-grade tools, structured review processes
- Deep expertise in backend systems, cloud architecture, code quality

---

## A. AUTHENTICATION & ACCESS

---

### A1: SSO Login Flow

**SOW References:** Section 3.1.MVP.8 (SSO integration -- SAML/OIDC, OAuth2-based API access, RBAC)

**Entry Point:** User navigates to the Mentor & Reviewer Workspace URL or clicks a login link.

**Pre-conditions:**
- User has been registered in the platform as a mentor, reviewer, or governance officer.
- User's enterprise identity provider (IdP) has been configured for SSO (SAML/OIDC) by a platform admin (Section 3.1.MVP.8).
- User has valid credentials in the enterprise IdP.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Login Page** | Platform logo, "Mentor & Reviewer Workspace" title, SSO login button ("Sign in with your organization"), optional email field for IdP discovery. | Click SSO login button; enter email for IdP routing. |
| 2 | **IdP Redirect** | Browser redirects to the enterprise identity provider login page (external to the platform). | User enters credentials at IdP (username/password, MFA if configured). |
| 3 | **IdP Authentication** | IdP authenticates user; SAML assertion or OIDC token returned to platform. | None -- automatic redirect. |
| 4 | **Platform Token Exchange** | Platform validates the assertion/token, extracts user identity, looks up RBAC role assignments. Loading indicator displayed. | None -- automatic processing. |
| 5a | **Success: Redirect to Workspace** | If user has mentor/reviewer/governance officer role: redirect to Review Queue (default landing page). Session established with JWT. | User lands on Review Queue. |
| 5b | **Failure: Access Denied** | If user does not have an assigned mentor/reviewer role: "Access Denied -- You do not have permission to access the Mentor & Reviewer Workspace. Contact your administrator." | Link to contact support; link to return to login. |
| 5c | **Failure: IdP Error** | If IdP rejects credentials or is unreachable: error message with IdP-specific context. | Retry login; contact support. |

**Decision Points:**
- Step 4: Does the user have an active mentor/reviewer/governance officer role in RBAC? YES -> Step 5a. NO -> Step 5b.
- Step 3: Does IdP authentication succeed? YES -> Step 4. NO -> Step 5c.

**Error/Edge Cases:**
- IdP session expired: user is prompted to re-authenticate at IdP.
- Multiple roles: if user also has contributor or enterprise roles, the platform routes them to the Mentor & Reviewer Workspace based on the URL they accessed. Other workspaces remain accessible via a workspace switcher if the user holds multiple roles.
- First-time login: platform creates a local user record linked to the IdP identity; default review preferences are initialized.
- MFA required by IdP: handled entirely at the IdP layer, transparent to the platform.

**Exit Points:**
- Successful login -> Review Queue (Flow B1).
- Access denied -> user contacts administrator.
- IdP failure -> user retries or contacts IT support.

**Audit:** Login events are logged immutably (Section 3.1.MVP.8): user ID, timestamp, IP address, authentication method, success/failure.

---

### A2: Role-Based Access -- What Mentors/Reviewers See vs. Don't See

**SOW References:** Section 3.1.MVP.8 (RBAC), Section 3.1.5 (Mentor & Reviewer Workspace scope), Section 15.2 (least-privilege access, Zero Trust)

**Entry Point:** Authenticated user session with mentor/reviewer/governance officer role.

**Pre-conditions:**
- User is authenticated (Flow A1 completed).
- RBAC role is assigned by platform admin (Section 3.1.MVP.3 -- admin contributor management + role assignment).

**What Mentors/Reviewers CAN See:**

| Area | Data Visible | SOW Reference |
|------|-------------|---------------|
| Review Queue | List of reviews assigned to them; mentorship sessions assigned to them | 19.3, 3.1.5 |
| Task Context | Task instructions, requirements, skills tags, templates, links | 3.1.MVP.5 |
| Submitted Artifacts | Files, structured responses, evidence checklist items from the contributor's submission | 3.1.MVP.5 |
| Contributor Progress | Verified skills, reliability profile (on-time delivery, acceptance rates, SLA compliance), learning velocity -- as exposed through the Digital Twin | 11, 3.1.5 |
| Review Rubrics | Configurable rubric templates for the task type | 3.1.MVP.5 |
| Review Assistant Output | AI-generated rubric suggestions and submission summarization | 3.1.MVP.7 |
| Review History | Their own completed reviews and associated audit trail | 3.1.MVP.8 |
| Rework History | Previous submission versions and feedback for the same task (versioning) | 3.1.MVP.5 |
| SLA Timers | Time remaining for the review to be completed | 3.1.MVP.4 |

**What Mentors/Reviewers CANNOT See:**

| Area | Reason | SOW Reference |
|------|--------|---------------|
| Contributor personal identity details beyond what is needed for review | Least-privilege, Zero Trust (Section 15.2); privacy by design | 15.1, 15.2 |
| Contributor earnings, payout amounts, rate card details | Economic data scoped to contributor and enterprise admin roles | 3.1.MVP.6 |
| Other reviewers' queues or in-progress reviews | Tenant isolation, least-privilege | 15.2 |
| SOW documents or enterprise project portfolio views | Scoped to Enterprise Admin Console (Section 19.1) | 19.1 |
| Admin configuration (rate cards, policies, tenant setup) | Scoped to Admin role (Section 3.1.6) | 3.1.6 |
| Task decomposition or planning tools | Scoped to PMO/Admin via Planner UI (Section 3.1.MVP.2) | 3.1.MVP.2 |
| Matching engine results or "why matched" explainability | Scoped to assignment UI for contributors + admin (Section 3.1.MVP.4) | 3.1.MVP.4 |

**Role Variants Within the Workspace:**

| Role | Scope | SOW Reference |
|------|-------|---------------|
| Mentor | Reviews contributor submissions; provides coaching feedback; sees contributor learning signals | 19.3, 3.1.5 |
| Reviewer | Reviews contributor submissions; scores against rubrics; makes acceptance decisions | 19.3, 3.1.MVP.5 |
| Governance Officer | Reviews flagged items (plagiarism, fraud, escalations); has visibility into governance dashboards | 14.2 |

**Navigation Structure Available to Mentor/Reviewer:**

```
Mentor & Reviewer Workspace
|-- Review Queue (default landing)
|   |-- Assigned Reviews
|   |-- Mentorship Sessions
|-- Review Detail (accessed from queue)
|-- Review History
|   |-- Completed Reviews
|   |-- Review Metrics
|-- Settings
|   |-- Review Preferences
|   |-- Notification Preferences
|   |-- Capacity/Availability
```

**Audit:** All access attempts (authorized and unauthorized) are logged immutably (Section 3.1.MVP.8).

---

## B. REVIEW QUEUE MANAGEMENT

---

### B1: Review Queue View Flow

**SOW References:** Section 19.3 (queue of review tasks), Section 3.1.5 (queues for assigned reviews and mentorship sessions), Section 3.1.MVP.4 (SLA timers)

**Flow Name:** Viewing and managing the assigned review queue.

**Entry Point:** User lands on the Mentor & Reviewer Workspace after login (default view), or clicks "Review Queue" in the sidebar navigation.

**Pre-conditions:**
- User is authenticated with mentor/reviewer role (Flow A1).
- Platform has assigned review items to this user via the assignment workflow (Section 3.1.MVP.4).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Review Queue -- Main View** | A list/table of all review items currently assigned to the user. Each row displays: task name, project name, contributor identifier (anonymized or role-based, per RBAC), submission date, SLA timer (time remaining), review stage (single-stage or which stage of two-stage), priority indicator, skill area tags, submission version number (if rework). Summary counts at top: total pending, overdue, due today, due this week. | Select a review item; filter the queue; sort the queue; switch between "Reviews" and "Mentorship Sessions" tabs. |
| 2 | **Empty State** | If no reviews are assigned: "No reviews in your queue. New reviews will appear here when assigned to you." | Navigate to Review History; adjust capacity settings. |

**Data Displayed Per Queue Item:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Task Name | task-mgmt-svc | 3.1.MVP.5 |
| Project Name | project-lifecycle-svc | 3.1.MVP.2 |
| Contributor Identifier | contributor-profile-svc (role-level, not personal details) | 15.2 |
| Submission Date | submission-svc | 3.1.MVP.5 |
| SLA Timer | assignment-svc (SLA timers) | 3.1.MVP.4 |
| Review Stage | review-svc (single-stage or stage 1/stage 2) | 3.1.MVP.5 |
| Priority Indicator | Derived from SLA urgency + task priority | 3.1.MVP.4 |
| Skill Area Tags | task-mgmt-svc (required_skills_json) | 3.1.MVP.2 |
| Submission Version | submission-svc (versioning for rework) | 3.1.MVP.5 |
| Rework Indicator | review-svc (is this a resubmission after rework?) | 3.1.MVP.5 |

**Summary Metrics at Top of Queue:**

| Metric | Description |
|--------|-------------|
| Total Pending | Count of all unreviewed items in queue |
| Overdue | Count of items past SLA deadline |
| Due Today | Count of items with SLA expiring today |
| Due This Week | Count of items with SLA expiring within 7 days |

**Decision Points:**
- User selects a review item -> proceed to Flow B4 (Queue Item Selection).
- User wants to filter/sort -> proceed to Flow B3.
- User switches to Mentorship Sessions tab -> proceed to Flow B2.

**Error/Edge Cases:**
- SLA has already expired for an item: item is marked with an "Overdue" badge in red; it remains in the queue until reviewed or reassigned.
- Review item was reassigned away from user while viewing queue: item disappears on next refresh; notification shown.
- Contributor withdrew the submission: item shows "Submission Withdrawn" status; no review action possible; item can be dismissed.

**Exit Points:**
- Select a review item -> Review Detail (Flow C1).
- Navigate to Review History -> Flow F1.
- Navigate to Settings -> Flow H1/H2/H3.

---

### B2: Mentorship Sessions Queue Flow

**SOW References:** Section 3.1.5 (queues for assigned reviews and mentorship sessions), Section 20.2 (mentorship, community support, upskilling pathways), Section 19.3 (coaching recommendations)

**Flow Name:** Viewing and managing assigned mentorship sessions.

**Entry Point:** User clicks "Mentorship Sessions" tab within the Review Queue view.

**Pre-conditions:**
- User is authenticated with mentor role.
- Mentorship sessions have been assigned to this user.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Mentorship Sessions Tab** | A list of mentorship items assigned to the user. Each row displays: contributor identifier (anonymized), session context (task-linked or general skill coaching), skill area, scheduled time or SLA window, status (pending, in-progress, completed), contributor's learning velocity indicator (Section 11). | Select a session; filter by status; sort by urgency. |
| 2 | **Session Detail** | Contributor's current progress: verified skills relevant to the session, reliability profile summary, learning velocity. Task context if session is linked to a specific task. Previous mentorship notes if any. Coaching recommendations from the platform (Section 19.3 -- feedback tools and coaching recommendations). | Begin session; add mentorship notes; mark session complete; escalate concern. |
| 3 | **Session Notes Input** | Free-form text field for mentorship notes. Structured coaching recommendation fields: skill gaps identified, recommended next actions, contributor strengths observed. | Save notes; attach to contributor's learning signals. |
| 4 | **Session Complete** | Confirmation: "Mentorship session marked as complete." Notes saved and linked to contributor's digital twin learning signals (Section 11 -- learning velocity). | Return to queue; start next session. |

**Data Displayed Per Mentorship Session:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Contributor Identifier | contributor-profile-svc | 15.2 |
| Session Context | workroom-svc / apg-orchestrator-svc | 3.1.5 |
| Skill Area | skill-genome-svc | 3.1.MVP.3 |
| SLA Window | assignment-svc | 3.1.MVP.4 |
| Learning Velocity | Digital Twin (Section 11) | 11 |
| Reliability Profile Summary | Digital Twin (Section 11) | 11 |
| Verified Skills (relevant) | Digital Twin (Section 11) | 11 |
| Previous Mentorship Notes | review-svc / workroom-svc | 3.1.5 |

**Decision Points:**
- Is the session linked to a specific task? YES -> show task context alongside contributor profile. NO -> show contributor profile and skill development context only.
- Does the mentor identify a concern requiring escalation? YES -> Flow G1. NO -> complete session normally.

**Error/Edge Cases:**
- Contributor is no longer active (offboarded): session shows "Contributor Unavailable" status; mentor can add final notes and close.
- Session SLA has expired: session is flagged as overdue but remains accessible for completion.
- No mentorship sessions assigned: empty state with message "No mentorship sessions currently assigned."

**Exit Points:**
- Complete session -> return to queue.
- Escalate concern -> Flow G1.
- Navigate back to Reviews tab -> Flow B1.

---

### B3: Queue Filtering and Sorting Flow

**SOW References:** Section 19.3 (queue of review tasks), Section 3.1.MVP.4 (SLA timers), Section 3.1.MVP.2 (skills tagging per task)

**Flow Name:** Filtering and sorting the review queue by priority, SLA urgency, or skill area.

**Entry Point:** User interacts with filter/sort controls on the Review Queue view (Flow B1 or B2).

**Pre-conditions:**
- Review Queue is loaded with at least one item.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Filter Controls** | Filter bar above the queue list. Available filter dimensions displayed as dropdowns or pill selectors. | Open filter dropdowns; apply filters; clear filters. |
| 2 | **Apply Filters** | Queue list updates in real time (or on "Apply" click) to show only items matching the selected criteria. Active filters shown as removable pills/chips above the list. Count of matching items displayed. | Remove individual filters; clear all filters; sort within filtered results. |
| 3 | **Sort Controls** | Sort dropdown or clickable column headers. Active sort indicated by arrow icon. | Select sort dimension; toggle ascending/descending. |
| 4 | **Filtered + Sorted View** | Queue list reflects both filter and sort selections. "Showing X of Y reviews" indicator. | Select a review item from filtered results; modify filters/sort; reset to default. |

**Available Filter Dimensions:**

| Filter | Values | SOW Reference |
|--------|--------|---------------|
| SLA Urgency | Overdue, Due Today, Due This Week, All | 3.1.MVP.4 |
| Review Stage | Single-stage, Two-stage (Stage 1), Two-stage (Stage 2) | 3.1.MVP.5 |
| Skill Area | Tags from task skill requirements (e.g., "React", "Data Analysis", "QA Testing") | 3.1.MVP.2 |
| Submission Type | First submission, Rework resubmission | 3.1.MVP.5 |
| Project | Project name dropdown (for reviewers assigned across projects) | 3.1.MVP.2 |

**Available Sort Dimensions:**

| Sort | Default Direction | SOW Reference |
|------|-------------------|---------------|
| SLA Deadline | Ascending (most urgent first) -- DEFAULT | 3.1.MVP.4 |
| Submission Date | Descending (newest first) | 3.1.MVP.5 |
| Priority | Descending (highest first) | 3.1.MVP.4 |
| Skill Area | Alphabetical | 3.1.MVP.2 |

**Decision Points:**
- Are there zero results after filtering? YES -> show "No reviews match your filters" with a "Clear Filters" button. NO -> show filtered list.

**Error/Edge Cases:**
- Filter combination produces zero results: show empty state with clear filters option.
- Queue updates while filters are active (new item assigned): new items that match active filters appear in the list; notification badge updates.

**Exit Points:**
- Select a review item -> Flow B4.
- Clear all filters -> return to unfiltered queue view.

---

### B4: Queue Item Selection Flow

**SOW References:** Section 19.3 (queue of review tasks), Section 3.1.MVP.5 (review workflow)

**Flow Name:** Selecting a review item from the queue to begin the review process.

**Entry Point:** User clicks on a review item row in the Review Queue (Flow B1).

**Pre-conditions:**
- At least one review item exists in the user's queue.
- The selected item has not been reassigned or withdrawn since the queue was loaded.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Queue Item Click** | User clicks on a row in the review queue. | Click/tap on the row. |
| 2 | **Loading State** | Brief loading indicator while the review detail is fetched. The system retrieves: task context, submitted artifacts, contributor progress data, applicable rubric template, any Review Assistant suggestions. | None -- loading. |
| 3a | **Review Detail View** | Full review detail screen loads (see Flow C1 for complete specification). The queue remains accessible via back navigation or a persistent sidebar. | All review detail actions (see Section C flows). |
| 3b | **Item Unavailable** | If the item was reassigned, withdrawn, or already reviewed between queue load and click: "This review is no longer available. It may have been reassigned or the submission was withdrawn." | Return to queue (queue refreshes automatically). |

**Decision Points:**
- Step 2: Is the item still valid and assigned to this reviewer? YES -> Step 3a. NO -> Step 3b.

**Error/Edge Cases:**
- Network failure during loading: "Unable to load review details. Please try again." with retry button.
- Concurrent access: if another reviewer (in edge cases of dual assignment errors) has begun reviewing the same item, the system should display a warning: "This item is currently being reviewed by another reviewer."
- Large file submissions: loading may take longer; progressive loading shows task context first, then artifacts.

**Exit Points:**
- Review Detail loads -> proceed through Section C flows.
- Item unavailable -> return to queue.

---

### B5: SLA Timer Display and Urgency Indicators Flow

**SOW References:** Section 3.1.MVP.4 (SLA timers), Section 4.3 (SLA templates per work type)

**Flow Name:** Understanding and responding to SLA urgency indicators on review items.

**Entry Point:** SLA timers are visible on every review item in the queue (Flow B1) and within the Review Detail view (Section C flows).

**Pre-conditions:**
- Review items have been assigned with SLA deadlines configured per SLA templates (Section 4.3).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **SLA Timer in Queue** | Each queue item shows a countdown or deadline indicator. Format: "Due in X hours/days" or "Due: [date/time]". Color-coded by urgency. | Hover for exact deadline timestamp. |
| 2 | **SLA Timer in Review Detail** | Prominent timer in the review detail header showing time remaining for this review. Updates in real time if the review session is open. | None -- informational. |
| 3 | **SLA Warning Notification** | When SLA is approaching threshold (configurable, e.g., 25% of time remaining): in-app notification + optional email/push notification. | Dismiss notification; open the review item directly from notification. |
| 4 | **SLA Breach State** | When SLA deadline passes without a decision: item badge changes to "Overdue" (red). Escalation may be triggered automatically per configurable escalation rules (Section 4.3). | Review item is still actionable; reviewer can still complete the review. Alternatively, the item may be reassigned by an admin or escalation workflow. |

**SLA Urgency Color Coding:**

| Time Remaining | Color | Label |
|---------------|-------|-------|
| > 50% of SLA window | Green | On Track |
| 25% - 50% of SLA window | Amber/Yellow | Approaching |
| < 25% of SLA window | Orange | Urgent |
| 0% (past deadline) | Red | Overdue |

**Data Displayed:**

| Field | Description | SOW Reference |
|-------|-------------|---------------|
| SLA Deadline | Absolute date/time when review must be completed | 3.1.MVP.4, 4.3 |
| Time Remaining | Countdown from now to deadline | 3.1.MVP.4 |
| SLA Template | The SLA template applied (e.g., "Standard Review -- 48 hours", "Urgent Review -- 24 hours") | 4.3 |
| Urgency Level | Derived from time remaining vs. total SLA window | 3.1.MVP.4 |

**Decision Points:**
- SLA breached: Does the configured escalation rule trigger reassignment? If YES -> item may be removed from this reviewer's queue and reassigned. If NO -> item remains but is flagged.

**Error/Edge Cases:**
- SLA timer shows negative time for overdue items (e.g., "2 hours overdue").
- Reviewer's timezone: SLA deadlines are displayed in the reviewer's local timezone.
- SLA paused: if the platform pauses an SLA (e.g., contributor withdrew and resubmitted), the timer resets appropriately.

**Exit Points:**
- Reviewer clicks on an urgent item -> Flow B4 -> Section C flows.
- SLA breach triggers reassignment -> item removed from queue; reviewer notified.

---

## C. REVIEW DETAIL & DECISION

---

### C1: Task Context View Flow

**SOW References:** Section 3.1.MVP.5 (task workroom: instructions, templates, uploads, links, Q&A), Section 3.1.MVP.2 (skills tagging per task)

**Flow Name:** Viewing the task context and requirements before reviewing the submission.

**Entry Point:** Reviewer selects a review item from the queue (Flow B4) and the Review Detail view loads.

**Pre-conditions:**
- Review item is loaded and valid.
- Task data, instructions, and requirements are available from the task management service.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Review Detail -- Task Context Panel** | The Review Detail view is organized into panels/tabs. The Task Context panel (leftmost or top tab) displays: task name, task description, project name, milestone context, required skills tags, estimated effort, task instructions (full text), templates provided to the contributor, reference links, any Q&A threads from the workroom (Section 3.1.MVP.5), acceptance criteria. | Expand/collapse sections; open linked resources in new tab; scroll through instructions. |
| 2 | **Acceptance Criteria Section** | Within the Task Context panel: a clearly demarcated section listing the acceptance criteria for this task. These are the criteria the reviewer must evaluate the submission against. May include: functional requirements, quality standards, completeness criteria, format requirements. | Read-only; referenced during rubric scoring (Flow C5). |
| 3 | **Skills Context** | Tags showing the skills required for this task (e.g., "React", "API Design", "Technical Writing"). Helps the reviewer understand what competencies the submission should demonstrate. | Read-only. |

**Data Displayed:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Task Name | task-mgmt-svc | 3.1.MVP.5 |
| Task Description | task-mgmt-svc | 3.1.MVP.5 |
| Project Name | project-lifecycle-svc | 3.1.MVP.2 |
| Milestone | project-lifecycle-svc | 3.1.MVP.2 |
| Required Skills Tags | task-mgmt-svc (required_skills_json) | 3.1.MVP.2 |
| Estimated Effort | task-mgmt-svc | 3.1.MVP.2 |
| Task Instructions | workroom-svc | 3.1.MVP.5 |
| Templates | workroom-svc | 3.1.MVP.5 |
| Reference Links | workroom-svc | 3.1.MVP.5 |
| Q&A Threads | workroom-svc (Q&A) | 3.1.MVP.5 |
| Acceptance Criteria | task-mgmt-svc / acceptance-svc | 3.1.MVP.5 |

**Decision Points:**
- Reviewer reads task context and proceeds to view submitted artifacts (Flow C2).
- Reviewer determines they lack expertise for this task -> Flow G2 (Reassignment Request).

**Error/Edge Cases:**
- Task instructions are empty or incomplete: display warning "Task instructions may be incomplete. Contact the project administrator if needed."
- Referenced links are broken: links render but show a warning icon if the platform detects they are unreachable.

**Exit Points:**
- Proceed to Submitted Artifacts panel -> Flow C2.
- Request reassignment -> Flow G2.
- Return to queue -> Flow B1.

---

### C2: Submitted Artifacts Review Flow

**SOW References:** Section 3.1.MVP.5 (submission: file upload + structured responses + evidence checklist)

**Flow Name:** Reviewing the contributor's submitted work artifacts.

**Entry Point:** Reviewer navigates to the Submitted Artifacts panel/tab within the Review Detail view.

**Pre-conditions:**
- A valid submission exists for the review item.
- Submitted files are accessible from storage (S3).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Submitted Artifacts Panel** | A structured view of everything the contributor submitted. Organized into three sections: (a) Uploaded Files, (b) Structured Responses, (c) Evidence Checklist. Submission timestamp displayed. Submission version number displayed (relevant for rework resubmissions). | Expand/collapse sections; download files; preview files inline. |
| 2 | **Uploaded Files Section** | List of all files uploaded by the contributor. Each file shows: filename, file type icon, file size, upload timestamp. Preview available for supported formats (images, PDFs, code files, text documents). | Click to preview inline; click to download; open in new tab. |
| 3 | **Structured Responses Section** | If the task required structured responses (form fields, questionnaires, text answers): each response displayed with the prompt/question and the contributor's answer. | Read-only; scroll through responses. |
| 4 | **Evidence Checklist Section** | The evidence checklist that was provided with the task, showing each checklist item and the contributor's indication of completion (checked/unchecked). Any notes or links the contributor attached to checklist items are shown. | Read-only. |
| 5 | **File Preview** | When a file is selected for preview: inline preview pane opens (right panel or modal). Supported formats rendered in-browser. Unsupported formats show download prompt. | Zoom; scroll; navigate pages (for multi-page docs); close preview; download. |

**Data Displayed:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Uploaded Files (list) | submission-svc / S3 storage | 3.1.MVP.5 |
| File Metadata (name, type, size) | submission-svc | 3.1.MVP.5 |
| Structured Responses | submission-svc | 3.1.MVP.5 |
| Evidence Checklist (with contributor status) | submission-svc | 3.1.MVP.5 |
| Submission Timestamp | submission-svc | 3.1.MVP.5 |
| Submission Version Number | submission-svc (versioning) | 3.1.MVP.5 |

**Decision Points:**
- Reviewer inspects all artifacts and proceeds to contributor progress view (Flow C3) or rubric scoring (Flow C5).
- Reviewer notices plagiarism or duplication concerns -> Flow G1 (Escalation).

**Error/Edge Cases:**
- File cannot be previewed (corrupted or unsupported format): show "Preview unavailable. Download to view." with download button.
- Large files (>50MB): progressive loading indicator; download may be preferred.
- Empty submission (contributor submitted without files): display warning "No files were uploaded with this submission."
- Evidence checklist shows incomplete items: this is informational for the reviewer but does not block review.

**Exit Points:**
- Proceed to Contributor Progress view -> Flow C3.
- Proceed to rubric scoring -> Flow C5.
- Escalate concern -> Flow G1.
- Return to queue -> Flow B1.

---

### C3: Contributor Progress & Learning Signals View Flow

**SOW References:** Section 3.1.5 (visibility into contributor progress and learning signals), Section 11 (Digital Twin: verified skills, reliability profile, learning velocity)

**Flow Name:** Viewing the contributor's progress, skills, and learning signals to contextualize the review.

**Entry Point:** Reviewer navigates to the Contributor Progress panel/tab within the Review Detail view.

**Pre-conditions:**
- Contributor has a digital twin record in the platform (Section 3.1.MVP.3).
- Reviewer has RBAC permission to view contributor progress data (Section A2).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Contributor Progress Panel** | A summary of the contributor's profile relevant to the review context. NOT the contributor's full personal profile -- only the data points defined in Section 11 (Digital Twin) and Section 3.1.5. Displayed in a read-only card format. | Expand sections for more detail; collapse. |
| 2 | **Verified Skills Section** | List of the contributor's verified skills relevant to this task. Each skill shows: skill name, proficiency level, how it was verified (certifications, project outcomes, endorsements -- Section 11). Skills that match the task's required skills are highlighted. | Read-only. |
| 3 | **Reliability Profile Section** | On-time delivery rate (percentage), acceptance rate (percentage of submissions accepted on first submission), SLA compliance rate (percentage). Displayed as simple metrics with trend indicators (improving, stable, declining). | Read-only. |
| 4 | **Learning Velocity Section** | Time to adopt new skills, performance trajectory over time (Section 11 -- learning velocity). Displayed as: number of tasks completed, progression across skill levels, trend line or simple indicator (fast learner, steady, needs support). | Read-only. |
| 5 | **Task History Summary** | Count of total tasks completed on the platform, acceptance rate, rework rate. Not the full list of tasks -- just aggregate metrics. | Read-only. |

**Data Displayed:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Verified Skills | skill-genome-svc / Digital Twin | 11 |
| Proficiency Levels | skill-genome-svc | 11 |
| Verification Method | credential / project outcome / endorsement | 11 |
| On-Time Delivery Rate | Digital Twin -- reliability profile | 11 |
| Acceptance Rate | Digital Twin -- reliability profile | 11 |
| SLA Compliance Rate | Digital Twin -- reliability profile | 11 |
| Learning Velocity Indicator | Digital Twin -- learning velocity | 11 |
| Tasks Completed Count | Digital Twin -- activity metrics | 3.1.MVP.3 |
| Rework Rate | Derived from review-svc data | 3.1.MVP.5 |

**Decision Points:**
- Contributor is new (first task): limited data available; display "New contributor -- limited history available. Consider providing detailed feedback."
- Contributor has high rework rate: display as informational context; reviewer should provide particularly clear and actionable feedback.

**Error/Edge Cases:**
- Digital twin data unavailable (service error): display "Contributor progress data is temporarily unavailable" with the ability to proceed with the review without this context.
- Contributor data is sparse (few completed tasks): show available data with a note about limited history.

**Exit Points:**
- Reviewer has sufficient context; proceeds to Review Assistant (Flow C4) or Rubric Scoring (Flow C5).
- Return to artifacts view -> Flow C2.

---

### C4: Review Assistant Interaction Flow

**SOW References:** Section 3.1.MVP.7 (Review Assistant -- rubric suggestions + summarization), Section 7.5 (explainability: reasoning summaries for review and auditability)

**Flow Name:** Using the AI Review Assistant for rubric suggestions and submission summarization.

**Entry Point:** Reviewer clicks "Review Assistant" button or panel within the Review Detail view. Alternatively, the Review Assistant panel is always visible as a sidebar element.

**Pre-conditions:**
- Review item is loaded.
- Submitted artifacts are available for AI analysis.
- Review Assistant agent is operational (Section 3.1.MVP.7).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Review Assistant Panel** | A dedicated panel (right sidebar or collapsible section) labeled "Review Assistant". Brief description: "AI-assisted rubric suggestions and submission summary. All suggestions are advisory -- your judgment is final." Two main sections: (a) Submission Summary, (b) Rubric Suggestions. | Expand/collapse panel; invoke assistant; dismiss suggestions. |
| 2 | **Submission Summary** | AI-generated summary of the submitted artifacts. Includes: key points from uploaded files and structured responses, completeness assessment against the evidence checklist, notable strengths or gaps identified. Clearly labeled as "AI-Generated Summary". | Read the summary; copy to clipboard for inclusion in feedback. |
| 3 | **Rubric Suggestions** | For each criterion in the applicable rubric template: the Review Assistant suggests a score with a brief reasoning explanation (Section 7.5 -- explainability). Each suggestion shows: rubric criterion name, suggested score (e.g., 3/5), reasoning text (1-2 sentences). Clearly labeled as "Suggested -- adjust as needed". | Accept individual suggestion (auto-fills rubric); modify suggestion; dismiss suggestion; accept all suggestions. |
| 4 | **Reviewer Applies Suggestions** | Reviewer can accept, modify, or reject each suggestion individually. Accepted suggestions pre-fill the rubric scoring form (Flow C5). Modified suggestions update the pre-fill. Rejected suggestions leave the rubric field empty for manual input. | Accept; modify; reject per criterion. |
| 5 | **Transparency Note** | At the bottom of the Review Assistant panel: "These suggestions are generated by the Review Assistant AI agent. Human reviewers make all final decisions. All AI suggestions and your final decisions are logged for audit." | Read-only. |

**Data Displayed:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Submission Summary | Review Assistant agent (AI) | 3.1.MVP.7 |
| Rubric Criterion Suggestions | Review Assistant agent (AI) | 3.1.MVP.7 |
| Suggested Scores | Review Assistant agent (AI) | 3.1.MVP.7 |
| Reasoning Text | Review Assistant agent (AI) -- explainability | 7.5 |
| Rubric Template | review-svc (configurable rubric) | 3.1.MVP.5 |

**Decision Points:**
- Does the reviewer agree with AI suggestions? If YES -> accept and proceed to rubric scoring with pre-filled values. If NO -> modify or reject and fill rubric manually.
- Is the Review Assistant unavailable (service down)? If YES -> reviewer proceeds without AI assistance; rubric scoring is fully manual.

**Error/Edge Cases:**
- Review Assistant service is unavailable: show "Review Assistant is temporarily unavailable. You can proceed with manual review." Rubric scoring remains fully functional.
- AI suggestions are clearly inaccurate: reviewer rejects all suggestions; this rejection is logged as part of the audit trail.
- Submission contains very large files that exceed AI processing limits: summary may be partial; display "Summary is based on partial analysis of submitted files."

**Audit:** All Review Assistant interactions are logged: which suggestions were generated, which were accepted/modified/rejected by the reviewer, and the reviewer's final scores (Section 3.1.MVP.8, Section 7.5).

**Exit Points:**
- Reviewer has reviewed AI suggestions; proceeds to Rubric Scoring (Flow C5) with or without pre-filled values.
- Dismiss assistant and score manually -> Flow C5.

---

### C5: Rubric Scoring Flow

**SOW References:** Section 19.3 (rubrics and scoring), Section 3.1.MVP.5 (review rubrics/templates -- configurable), Section 3.1.5 (review forms, rubrics)

**Flow Name:** Scoring the submission against a configurable rubric.

**Entry Point:** Reviewer navigates to the Rubric Scoring panel/tab within the Review Detail view, or proceeds from the Review Assistant (Flow C4).

**Pre-conditions:**
- A rubric template is configured for this task type (Section 3.1.MVP.5 -- configurable rubrics).
- Review item is loaded and artifacts have been reviewed.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Rubric Scoring Form** | A structured form displaying the rubric template. Each row represents one rubric criterion. Columns: criterion name, criterion description, score input, optional per-criterion comment field. If Review Assistant suggestions were accepted (Flow C4), fields are pre-filled but editable. Overall score may be auto-calculated from individual criterion scores. | Enter scores; enter per-criterion comments; accept/modify pre-filled AI suggestions. |
| 2 | **Criterion Detail** | For each rubric criterion: the name (e.g., "Code Quality", "Completeness", "Documentation"), the description/definition of what each score level means (e.g., 1 = "Does not meet requirements", 3 = "Meets requirements", 5 = "Exceeds requirements"), and the scoring scale (configurable per rubric template). | Select score from scale; enter optional comment. |
| 3 | **Score Entry** | Reviewer selects or enters a score for each criterion. Score input may be: numeric scale (1-5), descriptive scale (Unsatisfactory / Needs Improvement / Meets Expectations / Exceeds Expectations / Outstanding), or pass/fail per criterion. The input type depends on the rubric template configuration. | Select/enter score per criterion. |
| 4 | **Overall Score Calculation** | After all criteria are scored: an overall score is computed (weighted average or simple average, depending on rubric configuration). Displayed prominently: "Overall Score: X/Y" or "Overall: Meets Expectations". | Read-only (auto-calculated); reviewer can override overall score if rubric allows. |
| 5 | **Validation** | Before proceeding to feedback/decision: the form validates that all required criteria have scores. If any are missing: inline validation messages "Please score all criteria before proceeding." | Fix missing scores; proceed when complete. |

**Rubric Template Structure (configurable per task type -- Section 3.1.MVP.5):**

| Template Field | Description |
|---------------|-------------|
| Rubric Name | e.g., "Code Review Rubric", "Documentation Quality Rubric" |
| Criteria (ordered list) | Each criterion has: name, description, weight (optional), scoring scale |
| Scoring Scale | Numeric (1-5, 1-10) or descriptive labels |
| Weights | Optional per-criterion weight for overall score calculation |
| Pass Threshold | Minimum overall score required for approval |
| Required Comments | Whether per-criterion comments are mandatory |

**Data Displayed:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Rubric Template | review-svc (configurable) | 3.1.MVP.5 |
| Criterion Names | rubric template | 19.3 |
| Criterion Descriptions | rubric template | 19.3 |
| Scoring Scale | rubric template | 19.3 |
| Pre-filled Scores (if AI accepted) | Review Assistant | 3.1.MVP.7 |
| Overall Score (calculated) | Derived from individual scores | 19.3 |

**Decision Points:**
- All criteria scored? YES -> proceed to feedback input (Flow C6) and then decision (Flow C7/C8/C9). NO -> validation error, must complete all criteria.
- Overall score meets pass threshold? This is informational for the reviewer; the reviewer makes the final decision regardless of the score threshold (Section 3.1.MVP.7 -- human approvals mandatory for acceptance).

**Error/Edge Cases:**
- No rubric template configured for this task type: display a simplified scoring form with a single overall assessment (pass/fail + comments). Log a platform warning for admin.
- Rubric template was updated after assignment but before review: use the version of the rubric that was active when the task was assigned to avoid retroactive criteria changes.

**Exit Points:**
- Proceed to Written Feedback (Flow C6).
- Save draft scores and return later (if supported -- scores persist in review session).

---

### C6: Written Feedback / Coaching Input Flow

**SOW References:** Section 19.3 (feedback tools and coaching recommendations), Section 3.1.5 (guided feedback flows)

**Flow Name:** Providing written feedback and coaching guidance to the contributor.

**Entry Point:** Reviewer proceeds from Rubric Scoring (Flow C5) or navigates to the Feedback panel within the Review Detail view.

**Pre-conditions:**
- Rubric scoring is complete (or in progress).
- Reviewer has reviewed the submission artifacts.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Feedback Input Panel** | A structured feedback form with multiple fields. The form supports both free-form text and structured guidance aligned with the platform's coaching recommendation framework (Section 19.3). | Enter feedback; use text formatting; attach references. |
| 2 | **Overall Feedback Field** | Large text area for overall feedback on the submission. Placeholder guidance: "Provide constructive feedback on the submission. Consider strengths, areas for improvement, and specific guidance for the contributor." Character limit and current count displayed. | Type feedback; use basic formatting (bold, italic, bullet points); paste code snippets. |
| 3 | **Strengths Identified (structured)** | Optional structured field: "What did the contributor do well?" Encourages positive, specific feedback. | Enter strengths; skip if not applicable. |
| 4 | **Areas for Improvement (structured)** | Optional structured field: "What should the contributor improve?" Encourages actionable, specific guidance. | Enter improvement areas. |
| 5 | **Coaching Recommendations (structured)** | Optional structured field: "Recommended next steps for the contributor's development." Linked to the contributor's learning signals (Section 3.1.5). Suggestions may include: skills to develop, resources to review, practice areas. | Enter recommendations; reference specific skills from the task's skill tags. |
| 6 | **Feedback Preview** | Reviewer can preview how the feedback will appear to the contributor before submitting. Formatted view with all fields rendered. | Preview; edit; proceed to decision. |

**Data Displayed:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Feedback Form Template | review-svc (guided feedback flow) | 3.1.5 |
| Overall Feedback (input) | Reviewer-authored | 19.3 |
| Strengths (input) | Reviewer-authored | 19.3 |
| Areas for Improvement (input) | Reviewer-authored | 19.3 |
| Coaching Recommendations (input) | Reviewer-authored | 19.3 |
| Task Skill Tags (reference) | task-mgmt-svc | 3.1.MVP.2 |
| Contributor Learning Signals (reference) | Digital Twin | 3.1.5, 11 |

**Decision Points:**
- Is feedback required before a decision? For REWORK and REJECT decisions, substantive feedback is mandatory (the contributor needs guidance). For APPROVE decisions, feedback is strongly encouraged but may be optional depending on platform configuration.
- Does the reviewer want to save feedback as a draft? Feedback can be saved in the review session and finalized when the decision is submitted.

**Error/Edge Cases:**
- Feedback is empty when decision is REWORK or REJECT: validation error "Feedback is required for rework and rejection decisions. Please provide specific guidance for the contributor."
- Feedback exceeds character limit: inline warning with current count.
- Reviewer uses inappropriate language: the platform may apply content moderation rules (Section 14.3 -- code of conduct). Flagged content requires reviewer to revise.

**Exit Points:**
- Proceed to Decision flow: APPROVE (Flow C7), REWORK (Flow C8), or REJECT (Flow C9).
- Save draft feedback and return later.

---

### C7: Decision Flow -- APPROVE

**SOW References:** Section 3.1.MVP.5 (acceptance decision with reasons), Section 3.1.MVP.7 (human approvals mandatory for acceptance), Section 3.1.MVP.8 (immutable audit logging)

**Flow Name:** Approving a submission.

**Entry Point:** Reviewer clicks "Approve" after completing rubric scoring (Flow C5) and feedback (Flow C6).

**Pre-conditions:**
- Rubric scoring is complete.
- Feedback has been provided (or confirmed as not required for approval).
- This is either a single-stage review (reviewer has authority to approve) or Stage 1 of a two-stage review (reviewer recommends approval to client).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Approve Button Click** | Reviewer clicks "Approve" from the decision options (Approve / Rework / Reject). | Click Approve. |
| 2 | **Approval Confirmation Dialog** | Modal/dialog: "Confirm Approval". Summary displayed: task name, contributor identifier, overall rubric score, key feedback excerpt. For single-stage: "This submission will be marked as ACCEPTED. Payout eligibility will be triggered." For two-stage (Stage 1): "This submission will be recommended for acceptance to the client for final review." Checkbox: "I confirm this submission meets the acceptance criteria." | Confirm approval; cancel and return to review. |
| 3 | **Submission Processing** | Loading state: "Processing approval..." The system: (a) records the approval decision, (b) logs the full audit event (reviewer ID, timestamp, rubric scores, feedback, decision, reasoning), (c) for single-stage: triggers payout eligibility (Section 3.1.MVP.6), (d) for two-stage Stage 1: moves item to Stage 2 queue (client review). | None -- processing. |
| 4 | **Approval Complete** | Success screen: "Submission Approved." Summary: task name, decision, timestamp. For single-stage: "Payout eligibility has been triggered. The contributor will be notified." For two-stage: "The submission has been forwarded to the client for final review." Next actions displayed. | Return to queue; view audit record; proceed to next review. |

**Data Displayed at Confirmation (Step 2):**

| Field | Value |
|-------|-------|
| Task Name | From task-mgmt-svc |
| Contributor Identifier | Anonymized identifier |
| Overall Rubric Score | From Flow C5 |
| Feedback Summary | First 200 characters of overall feedback |
| Review Stage | Single-stage / Two-stage Stage 1 |
| Decision | APPROVE |

**Decision Points:**
- Single-stage review: approval is final; payout eligibility triggered (Section 3.1.MVP.6).
- Two-stage review, Stage 1: approval is a recommendation; item moves to client for Stage 2 review (Flow D3).

**Error/Edge Cases:**
- Network failure during submission: "Approval could not be processed. Your scores and feedback have been saved. Please try again." Retry button.
- Concurrent modification: if the submission was withdrawn during the review, show "This submission is no longer available for approval."

**Audit (Section 3.1.MVP.8):** Immutable audit log entry created:
- Event: REVIEW_DECISION_APPROVE
- Reviewer ID, timestamp, task ID, submission ID, submission version
- Full rubric scores (per criterion)
- Full feedback text
- Review Assistant suggestions received and reviewer's response to each (accepted/modified/rejected)
- Decision: APPROVE
- Review stage (single-stage or stage number)

**Exit Points:**
- Return to Review Queue -> Flow B1.
- Proceed to next review item (system auto-selects next by SLA urgency if available).
- View audit record -> Flow F2.

---

### C8: Decision Flow -- REWORK

**SOW References:** Section 3.1.MVP.5 (rework loop with versioning, acceptance decision with reasons)

**Flow Name:** Requesting rework on a submission.

**Entry Point:** Reviewer clicks "Rework" after completing rubric scoring (Flow C5) and feedback (Flow C6).

**Pre-conditions:**
- Rubric scoring is complete.
- Feedback has been provided (mandatory for rework decisions).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Rework Button Click** | Reviewer clicks "Rework" from the decision options. | Click Rework. |
| 2 | **Rework Reasons Form** | Modal/dialog: "Request Rework". Required fields: (a) Rework reason categories (multi-select from predefined list): Incomplete submission, Does not meet quality standards, Missing evidence items, Incorrect approach, Formatting/structural issues, Other. (b) Specific guidance: text field (pre-filled from Flow C6 "Areas for Improvement" if provided, editable). (c) Which artifacts need rework: checkbox list of submitted files/responses the contributor should revise. (d) Optional: reference to specific rubric criteria that were not met (auto-suggested from criteria scored below threshold). | Select reasons; enter guidance; select artifacts for rework; confirm. |
| 3 | **Rework Confirmation** | Summary: task name, contributor identifier, rework reasons selected, guidance excerpt, list of artifacts flagged for rework. "The contributor will be notified and can resubmit. Submission version will increment." | Confirm rework request; cancel and return to review. |
| 4 | **Rework Processing** | Loading state: "Processing rework request..." The system: (a) records the rework decision, (b) logs the full audit event, (c) notifies the contributor with reasons and guidance, (d) increments the submission version counter, (e) opens the workroom for the contributor to revise and resubmit. | None -- processing. |
| 5 | **Rework Request Complete** | Success screen: "Rework Requested." Summary: task name, rework reasons, timestamp. "The contributor has been notified and can resubmit a revised version. You will receive the resubmission in your review queue." | Return to queue; proceed to next review. |

**Rework Reason Categories:**

| Category | Description |
|----------|-------------|
| Incomplete submission | Missing required deliverables or sections |
| Quality below standard | Work does not meet the quality threshold defined by the rubric |
| Missing evidence items | Evidence checklist items are incomplete or absent |
| Incorrect approach | The solution approach does not address the task requirements |
| Formatting/structural issues | Output format does not match task specifications |
| Other | Free-text reason required |

**Decision Points:**
- Is this the first rework or a subsequent one? If subsequent: display rework count to the reviewer ("This is rework attempt #N"). This does not change the flow but informs the reviewer's decision.
- Maximum rework cycles: if a platform-configured maximum has been reached (e.g., 3 rework cycles), display a warning "Maximum rework cycles reached. Consider rejecting or escalating." (Section 4.3 -- configurable escalation rules).

**Error/Edge Cases:**
- Reviewer submits rework without selecting any reason categories: validation error "Please select at least one rework reason."
- Reviewer submits rework without specific guidance: validation error "Specific guidance is required for rework requests so the contributor can improve."
- Contributor has become inactive: rework request is recorded; the task may be reassigned by admin.

**Audit (Section 3.1.MVP.8):** Immutable audit log entry:
- Event: REVIEW_DECISION_REWORK
- Reviewer ID, timestamp, task ID, submission ID, submission version
- Full rubric scores, feedback text
- Rework reason categories selected
- Specific guidance text
- Artifacts flagged for rework
- Rework cycle number

**Exit Points:**
- Return to Review Queue -> Flow B1.
- Proceed to next review item.

---

### C9: Decision Flow -- REJECT

**SOW References:** Section 3.1.MVP.5 (acceptance decision with reasons), Section 3.1.MVP.8 (immutable audit logging), Section 14.2 (human oversight with clear escalation paths)

**Flow Name:** Rejecting a submission.

**Entry Point:** Reviewer clicks "Reject" after completing rubric scoring (Flow C5) and feedback (Flow C6).

**Pre-conditions:**
- Rubric scoring is complete.
- Feedback has been provided (mandatory for rejection decisions).
- Reviewer has sufficient justification (rejection is a high-impact decision -- Section 3.1.MVP.7: human approvals mandatory for acceptance; by extension, rejection is equally governed).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Reject Button Click** | Reviewer clicks "Reject" from the decision options. | Click Reject. |
| 2 | **Rejection Justification Form** | Modal/dialog: "Reject Submission -- Detailed Justification Required". Required fields: (a) Rejection reason categories (multi-select from predefined list): Plagiarism or duplication detected (Section 14.2), Fundamentally does not meet requirements, Fraudulent or fabricated content, Submitted content is not the contributor's own work, Unrelated to the task, Other. (b) Detailed justification: text field (minimum character count enforced, e.g., 100+ characters). (c) Evidence supporting rejection: optional file upload or screenshot for cases like plagiarism. (d) Recommendation: should this be escalated for governance review? (checkbox -- triggers Flow G1). | Select reasons; enter justification; attach evidence; check escalation box; confirm. |
| 3 | **Rejection Confirmation** | Warning-level dialog: "Are you sure you want to reject this submission? This decision is final for this submission version. The contributor will be notified." Summary: task name, contributor identifier, rejection reasons, justification excerpt. | Confirm rejection; cancel and return to review. |
| 4 | **Rejection Processing** | Loading state: "Processing rejection..." The system: (a) records the rejection decision, (b) logs the full audit event (comprehensive -- this is a high-impact decision), (c) notifies the contributor with reasons and justification, (d) if escalation checkbox was selected: creates an escalation case (Flow G1), (e) task may be reassigned or closed depending on project configuration. | None -- processing. |
| 5 | **Rejection Complete** | Success screen: "Submission Rejected." Summary: task name, rejection reasons, timestamp, escalation status (if applicable). "The contributor has been notified." | Return to queue; proceed to next review. |

**Rejection Reason Categories:**

| Category | Description | Governance Implication |
|----------|-------------|----------------------|
| Plagiarism or duplication detected | Content matches existing sources (Section 14.2) | Triggers fraud detection flag |
| Fundamentally does not meet requirements | Work is irredeemably off-target | No additional governance action |
| Fraudulent or fabricated content | Submission appears to be fabricated | Triggers fraud detection flag |
| Not the contributor's own work | Suspected work-for-hire or unauthorized collaboration | Triggers governance review |
| Unrelated to the task | Submission has no connection to assigned task | No additional governance action |
| Other | Free-text justification required | Reviewed by governance if escalation is checked |

**Decision Points:**
- Does the rejection involve plagiarism, fraud, or work integrity concerns? If YES -> escalation to governance is strongly recommended (Section 14.2). If NO -> standard rejection with justification.
- Is this a two-stage review? For Stage 1 of a two-stage review, the reviewer may reject outright (preventing it from reaching the client) if the submission clearly fails quality standards.

**Error/Edge Cases:**
- Reviewer attempts to reject with insufficient justification: validation error "Detailed justification is required for rejection decisions. Please provide at least [minimum] characters explaining the rejection."
- Reviewer selects plagiarism but does not provide evidence: warning "Please provide evidence supporting the plagiarism finding, or adjust your rejection reason."
- Contributor disputes the rejection: the dispute process is handled via the platform's grievance redressal mechanism (Section 20.3). The immutable audit trail of this rejection decision is the evidentiary basis.

**Audit (Section 3.1.MVP.8):** Immutable audit log entry (comprehensive):
- Event: REVIEW_DECISION_REJECT
- Reviewer ID, timestamp, task ID, submission ID, submission version
- Full rubric scores, feedback text
- Rejection reason categories selected
- Detailed justification text
- Evidence attachments (if any)
- Escalation flag (yes/no)
- Rework cycle number (how many attempts before rejection)

**Exit Points:**
- Return to Review Queue -> Flow B1.
- Proceed to next review item.
- If escalation was triggered -> escalation case created (visible in governance queue).

---

### C10: Decision Submission & Audit Logging Flow

**SOW References:** Section 3.1.MVP.8 (immutable audit logging for all review decisions), Section 7.5 (AI governance: decision logs, explainability)

**Flow Name:** The final submission of a review decision and the creation of the immutable audit record.

**Entry Point:** Reviewer confirms any decision (APPROVE, REWORK, or REJECT) in the confirmation dialog (Flows C7, C8, or C9).

**Pre-conditions:**
- Rubric scoring is complete.
- Feedback is provided (required for REWORK and REJECT).
- Decision type is selected and confirmed.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Decision Confirmation Click** | Reviewer clicks "Confirm" in the decision dialog. | Click Confirm. |
| 2 | **Decision Payload Assembly** | System assembles the complete decision payload. Not visible to user (backend). Payload includes: reviewer ID, timestamp (server-side), task ID, submission ID, submission version, rubric scores (all criteria), overall score, feedback (all fields), decision type, decision-specific data (approval confirmation / rework reasons + guidance + flagged artifacts / rejection reasons + justification + evidence), Review Assistant interaction log (suggestions received, reviewer responses). | None -- backend processing. |
| 3 | **Immutable Audit Log Write** | The complete decision payload is written to the immutable audit log (audit-log-svc). This is an append-only record that cannot be modified or deleted (Section 3.1.MVP.8). Audit event ID is generated. | None -- backend processing. |
| 4 | **State Transition** | The review-svc updates the submission/task state: APPROVE -> submission state moves to "Accepted" (single-stage) or "Stage 1 Approved" (two-stage); REWORK -> submission state moves to "Rework Requested"; REJECT -> submission state moves to "Rejected". | None -- backend processing. |
| 5 | **Downstream Triggers** | Based on the decision: APPROVE (single-stage) -> payout-eligibility-ledger-svc triggers payout eligibility; notification-svc notifies contributor. APPROVE (two-stage Stage 1) -> item queued for client Stage 2 review. REWORK -> contributor notified with rework details; workroom re-opened. REJECT -> contributor notified; task may be reassigned or closed. | None -- backend processing. |
| 6 | **Confirmation Screen** | Reviewer sees the success confirmation (as described in Flows C7/C8/C9 Step 4/5). Includes audit event reference ID for traceability. | Return to queue; proceed to next review; view audit record. |

**Complete Audit Record Structure:**

| Field | Description |
|-------|-------------|
| audit_event_id | Unique immutable identifier |
| event_type | REVIEW_DECISION_APPROVE / REVIEW_DECISION_REWORK / REVIEW_DECISION_REJECT |
| reviewer_id | The authenticated reviewer's user ID |
| timestamp | Server-generated UTC timestamp |
| task_id | The reviewed task |
| submission_id | The specific submission version reviewed |
| submission_version | Version number (1, 2, 3...) |
| rubric_template_id | Which rubric was used |
| rubric_scores | JSON: per-criterion scores |
| overall_score | Computed overall score |
| feedback_overall | Full feedback text |
| feedback_strengths | Strengths identified |
| feedback_improvements | Areas for improvement |
| feedback_coaching | Coaching recommendations |
| decision | APPROVE / REWORK / REJECT |
| decision_data | Decision-specific structured data (reasons, guidance, justification, evidence) |
| ai_assistant_log | Review Assistant suggestions and reviewer responses |
| review_stage | single-stage / two-stage-1 / two-stage-2 |
| sla_compliance | Was the review completed within SLA? |
| ip_address | Reviewer's IP at time of decision |

**Error/Edge Cases:**
- Audit log write fails: the decision submission is rolled back. The reviewer sees "Unable to record decision. Please try again." The decision is not applied until the audit record is successfully written. This ensures no decision exists without an audit trail.
- Network interruption during processing: decision state may be uncertain. The system uses idempotent processing (Section 6.3 -- idempotent consumers) to handle retries safely.

**Exit Points:**
- Decision recorded successfully -> confirmation screen -> return to queue or next review.
- Decision recording fails -> retry from the confirmation dialog.

---

## D. SINGLE-STAGE vs TWO-STAGE REVIEW

---

### D1: Single-Stage Review Flow

**SOW References:** Section 3.1.MVP.5 (review workflow: single-stage and two-stage review)

**Flow Name:** Complete review workflow when the mentor/reviewer is the sole decision-maker.

**Entry Point:** Reviewer selects a review item from the queue that is configured for single-stage review.

**Pre-conditions:**
- The task/project is configured for single-stage review (the mentor/reviewer decision is final).
- Review item is assigned to this reviewer.

**Step-by-step Flow:**

| Step | Flow Reference | Description |
|------|---------------|-------------|
| 1 | Flow B4 | Select review item from queue. Queue item shows "Single-Stage Review" indicator. |
| 2 | Flow C1 | Review task context (instructions, requirements, acceptance criteria). |
| 3 | Flow C2 | Review submitted artifacts (files, responses, evidence checklist). |
| 4 | Flow C3 | View contributor progress and learning signals (optional but recommended). |
| 5 | Flow C4 | Consult Review Assistant for rubric suggestions and summary (optional). |
| 6 | Flow C5 | Score submission against rubric. |
| 7 | Flow C6 | Provide written feedback and coaching input. |
| 8 | Flow C7, C8, or C9 | Make decision: APPROVE, REWORK, or REJECT. |
| 9 | Flow C10 | Decision submitted and audit logged. |
| 10 | -- | **For APPROVE:** Submission is ACCEPTED. Payout eligibility triggered (Section 3.1.MVP.6). Contributor notified. Evidence pack finalized. Task marked complete. |
| 11 | -- | **For REWORK:** Contributor notified with reasons and guidance. Submission version increments. Contributor revises in workroom. Resubmission appears in reviewer's queue (Flow E2). |
| 12 | -- | **For REJECT:** Submission is REJECTED. Contributor notified with justification. Task may be reassigned or closed. |

**Key Characteristic:** In single-stage review, the reviewer's APPROVE decision is the final acceptance. There is no subsequent client review stage. Payout eligibility is triggered immediately upon approval.

**Visual Indicator in Queue:** Single-stage items display a "Single Review" badge.

---

### D2: Two-Stage Review Flow -- Stage 1: Mentor/Reviewer

**SOW References:** Section 3.1.MVP.5 (review workflow: two-stage review -- mentor/reviewer + client)

**Flow Name:** Stage 1 of a two-stage review -- the mentor/reviewer evaluates before the client.

**Entry Point:** Reviewer selects a review item from the queue that is configured for two-stage review, Stage 1.

**Pre-conditions:**
- The task/project is configured for two-stage review.
- This review item is at Stage 1 (mentor/reviewer stage).
- The reviewer is assigned as the Stage 1 reviewer.

**Step-by-step Flow:**

| Step | Flow Reference | Description |
|------|---------------|-------------|
| 1 | Flow B4 | Select review item from queue. Queue item shows "Two-Stage Review -- Stage 1" indicator. |
| 2 | Flow C1 | Review task context. |
| 3 | Flow C2 | Review submitted artifacts. |
| 4 | Flow C3 | View contributor progress and learning signals. |
| 5 | Flow C4 | Consult Review Assistant (optional). |
| 6 | Flow C5 | Score submission against rubric. |
| 7 | Flow C6 | Provide written feedback and coaching input. |
| 8 | -- | **Decision options at Stage 1:** (a) APPROVE TO STAGE 2: Recommend for client review. Submission, rubric scores, and reviewer feedback are forwarded to the client. (b) REWORK: Request rework from contributor (same as Flow C8). Client never sees a submission that doesn't pass Stage 1. (c) REJECT: Reject outright (same as Flow C9). Submission does not proceed to client. |
| 9 | Flow C10 | Decision submitted and audit logged. |
| 10a | -- | **For APPROVE TO STAGE 2:** Submission moves to Stage 2 queue. Client/enterprise reviewer is notified that a submission is ready for their review. Stage 1 reviewer's scores and feedback are attached (visible to client reviewer). |
| 10b | -- | **For REWORK:** Same as single-stage rework (Flow C8 outcomes). Resubmission returns to this reviewer for Stage 1 re-review. |
| 10c | -- | **For REJECT:** Same as single-stage reject (Flow C9 outcomes). |

**Key Characteristics:**
- Stage 1 reviewer acts as a quality gate before the client sees the submission.
- The "Approve" action at Stage 1 is "Approve to Stage 2" -- not final acceptance.
- REWORK and REJECT at Stage 1 prevent the submission from reaching the client, saving the client's time.
- Stage 1 reviewer's scores and feedback are included as context for the Stage 2 (client) reviewer.

**Visual Indicator in Queue:** Two-stage Stage 1 items display a "Stage 1 of 2" badge.

---

### D3: Two-Stage Review Flow -- Stage 2: Client/Enterprise Review

**SOW References:** Section 3.1.MVP.5 (review workflow: two-stage review -- mentor/reviewer + client)

**Flow Name:** Stage 2 of a two-stage review -- the client/enterprise makes the final acceptance decision.

**Entry Point:** The client/enterprise reviewer accesses the review through the Enterprise Admin Console (Section 19.1) -- specifically the "Review & Acceptance" section (SOW Section 3.1.6). This flow documents what the client sees, as context for the mentor's understanding of the two-stage process.

**Pre-conditions:**
- Stage 1 has been completed with an APPROVE TO STAGE 2 decision (Flow D2).
- The client/enterprise reviewer has been notified and has access to the Enterprise Admin Console.

**Step-by-step Flow (Client-side, documented for mentor/reviewer awareness):**

| Step | Screen/State | Description |
|------|-------------|-------------|
| 1 | **Enterprise Console -- Pending Reviews** | Client sees submission in their review queue, marked "Stage 2 -- Pending Your Review". |
| 2 | **Stage 1 Review Summary** | Client sees the Stage 1 reviewer's rubric scores, feedback, and recommendation. This provides context for the client's evaluation. |
| 3 | **Submitted Artifacts** | Client reviews the same submitted artifacts the Stage 1 reviewer reviewed. |
| 4 | **Client Decision** | Client makes final decision: (a) ACCEPT: final acceptance. Payout eligibility triggered (Section 3.1.MVP.6). Evidence pack finalized. (b) REWORK: Client requests rework with specific reasons. Contributor revises and resubmits. Resubmission goes back through Stage 1 (mentor) first. (c) REJECT: Client rejects with justification. |
| 5 | **Audit Logging** | Client's decision is logged as a separate audit event, linked to the Stage 1 audit event. |

**Impact on Mentor/Reviewer:**
- When the client requests REWORK at Stage 2: the resubmission returns to the Stage 1 reviewer's queue. The reviewer sees the client's rework feedback alongside the original Stage 1 review.
- When the client ACCEPTS: the mentor/reviewer can see the final outcome in their Review History (Flow F1).
- When the client REJECTS: the mentor/reviewer can see this in their Review History. If the mentor had approved at Stage 1 but the client rejected, this discrepancy is tracked for review quality metrics.

**Data Available to Stage 1 Reviewer (in their Review History):**

| Field | Description |
|-------|-------------|
| Stage 2 Decision | ACCEPT / REWORK / REJECT |
| Stage 2 Reviewer | Client identifier |
| Stage 2 Timestamp | When client made the decision |
| Client Feedback | Client's feedback (if REWORK or REJECT) |
| Outcome | Final task status |

---

## E. REWORK MANAGEMENT

---

### E1: Rework History View Flow

**SOW References:** Section 3.1.MVP.5 (rework loop with versioning)

**Flow Name:** Viewing the history of previous submissions and feedback for a task that has gone through rework cycles.

**Entry Point:** Within the Review Detail view (when reviewing a resubmission), the reviewer navigates to a "Rework History" tab or section.

**Pre-conditions:**
- The current review item is a resubmission (version > 1).
- Previous submission versions and review decisions exist in the system.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Rework History Tab/Section** | A chronological timeline of all submission versions for this task. Each version shows: version number, submission date, reviewer who reviewed it, decision (REWORK / REJECT), rework reasons, feedback summary, rubric scores summary. Current submission (being reviewed now) is highlighted at the top or end of the timeline. | Expand any version to see full details; compare versions (Flow E2). |
| 2 | **Version Detail Expansion** | When a previous version is expanded: full rubric scores, complete feedback, rework reasons with specific guidance, list of artifacts flagged for rework, contributor's response to feedback (what they changed). | Read-only; collapse. |
| 3 | **Version Count Indicator** | Prominently displayed: "Submission Version X of [max allowed]". If approaching maximum rework cycles: warning displayed. | Read-only. |

**Data Displayed Per Version:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Version Number | submission-svc | 3.1.MVP.5 |
| Submission Date | submission-svc | 3.1.MVP.5 |
| Reviewer ID | review-svc | 3.1.MVP.8 |
| Decision | review-svc (REWORK / REJECT) | 3.1.MVP.5 |
| Rework Reasons | review-svc | 3.1.MVP.5 |
| Feedback Summary | review-svc | 19.3 |
| Rubric Scores | review-svc | 19.3, 3.1.MVP.5 |
| Artifacts Flagged | review-svc | 3.1.MVP.5 |

**Decision Points:**
- Does the rework history show a pattern (e.g., same issues recurring across versions)? This informs the reviewer's decision on the current submission.
- Has the maximum rework cycle been reached? If YES -> the reviewer should APPROVE or REJECT; further rework is not advisable.

**Error/Edge Cases:**
- First submission (no rework history): tab is hidden or shows "This is the first submission for this task. No rework history."
- Reviewer for a previous version is different from the current reviewer: previous reviewer's identity shown as role-level identifier.

**Exit Points:**
- Return to current submission review.
- Compare versions -> Flow E2.

---

### E2: Rework Resubmission Review Flow

**SOW References:** Section 3.1.MVP.5 (rework loop with versioning)

**Flow Name:** Reviewing a resubmission after rework, with the ability to compare to previous versions.

**Entry Point:** Reviewer selects a resubmission item from the queue (indicated by "Rework Resubmission" badge and version number > 1).

**Pre-conditions:**
- A rework decision was previously made on this task (Flow C8 or D3 client rework).
- The contributor has revised and resubmitted.
- The resubmission appears in the reviewer's queue.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Queue Item -- Rework Badge** | Queue item shows: "Rework Resubmission -- Version N", original rework date, original rework reasons (abbreviated). | Select item to begin review. |
| 2 | **Review Detail with Rework Context** | The Review Detail view loads with additional context: a "Previous Review" summary panel showing the last rework decision's reasons and guidance. The Rework History tab is available (Flow E1). | View previous review summary; view rework history; proceed to review current submission. |
| 3 | **Version Comparison View** | A side-by-side or diff-style comparison of the current submission vs. the previous version. For files: if the file type supports diff (text, code), show line-level differences. For non-diffable files (images, PDFs): show both versions side by side. For structured responses: highlight changed fields. For evidence checklist: show which items changed from incomplete to complete. | Toggle between side-by-side and current-only views; navigate through changed artifacts. |
| 4 | **Rework Guidance Checklist** | A panel showing the specific rework guidance that was given in the previous review, with the ability for the reviewer to check off whether each guidance item has been addressed by the resubmission. Fields: guidance item text, addressed? (yes/no/partially), reviewer notes. | Check off addressed items; add notes per item. |
| 5 | **Rubric Scoring** | Standard rubric scoring (Flow C5). Previous version's scores may be displayed as reference (grayed out) alongside the current scoring fields. | Score current submission; reference previous scores. |
| 6 | **Feedback & Decision** | Standard feedback (Flow C6) and decision flows (C7/C8/C9). Feedback can reference improvements made and remaining issues. | Standard decision actions. |

**Data Displayed:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Previous Submission Version | submission-svc | 3.1.MVP.5 |
| Previous Rework Reasons | review-svc | 3.1.MVP.5 |
| Previous Rework Guidance | review-svc | 3.1.MVP.5 |
| Previous Rubric Scores | review-svc | 3.1.MVP.5 |
| Current Submission Version | submission-svc | 3.1.MVP.5 |
| File Differences (if diffable) | Derived from submission-svc | 3.1.MVP.5 |
| Evidence Checklist Changes | submission-svc | 3.1.MVP.5 |

**Decision Points:**
- Has the contributor addressed all rework guidance items? If YES -> likely APPROVE. If PARTIALLY -> reviewer decides whether to approve with notes or request further rework. If NO -> REWORK again or REJECT.
- Is this the maximum rework cycle? If YES -> reviewer must APPROVE or REJECT.

**Error/Edge Cases:**
- Previous submission version files have been purged from storage: display "Previous version files are no longer available for comparison. Review the current submission independently."
- Contributor resubmitted without making changes: the comparison view shows no differences. Reviewer should note this in feedback.

**Exit Points:**
- Decision submitted -> Flow C10.
- Return to queue -> Flow B1.

---

## F. REVIEW HISTORY & AUDIT

---

### F1: Completed Reviews List Flow

**SOW References:** Section 3.1.MVP.8 (immutable audit logging), Section 19.3 (queue of review tasks)

**Flow Name:** Viewing a list of all reviews the mentor/reviewer has completed.

**Entry Point:** User clicks "Review History" in the sidebar navigation.

**Pre-conditions:**
- User is authenticated with mentor/reviewer role.
- User has completed at least one review.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Review History -- List View** | A table/list of all reviews completed by this reviewer. Each row shows: task name, project name, decision (Approve / Rework / Reject -- color-coded), review date, rubric overall score, review stage (single-stage / two-stage stage), final task outcome (if known -- e.g., for two-stage, was the client's final decision different?). Sorted by review date (newest first) by default. Summary statistics at top. | Sort by any column; filter by decision type, date range, project, skill area; click to view detail (Flow F2); export list. |
| 2 | **Summary Statistics** | At the top of the list: total reviews completed (all time), reviews this month, approval rate, rework rate, rejection rate, average review time (time from queue assignment to decision), SLA compliance rate (percentage of reviews completed within SLA). | Read-only; select time period for statistics (this month, last 30 days, last 90 days, all time). |
| 3 | **Filter Controls** | Filters available: decision type (Approve / Rework / Reject), date range (custom or presets), project, skill area, review stage. | Apply filters; clear filters. |
| 4 | **Empty State** | If no reviews completed: "You haven't completed any reviews yet. Reviews will appear here after you submit your first decision." | Navigate to Review Queue. |

**Data Displayed Per Row:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Task Name | task-mgmt-svc | 3.1.MVP.5 |
| Project Name | project-lifecycle-svc | 3.1.MVP.2 |
| Decision | review-svc | 3.1.MVP.5 |
| Review Date | review-svc (audit log timestamp) | 3.1.MVP.8 |
| Overall Rubric Score | review-svc | 19.3 |
| Review Stage | review-svc | 3.1.MVP.5 |
| Final Task Outcome | acceptance-svc | 3.1.MVP.5 |
| SLA Compliance | assignment-svc | 3.1.MVP.4 |

**Exit Points:**
- Click on a review -> Flow F2 (Review Decision Detail).
- Navigate to Review Queue -> Flow B1.
- Navigate to Review Metrics -> Flow F3.

---

### F2: Review Decision Detail Flow

**SOW References:** Section 3.1.MVP.8 (immutable audit logging, searchable/exportable), Section 14.2 (comprehensive audit logging)

**Flow Name:** Viewing the full detail and audit trail of a completed review decision.

**Entry Point:** Reviewer clicks on a completed review item in the Review History list (Flow F1).

**Pre-conditions:**
- The review decision exists in the audit log.
- The reviewer has permission to view their own review decisions.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Review Decision Detail View** | A read-only view of the complete review decision. Organized into sections matching the review workflow. | Scroll through sections; export as PDF; return to list. |
| 2 | **Decision Summary Header** | Task name, project name, contributor identifier, submission version, decision (Approve/Rework/Reject), review date, review stage, SLA compliance status, audit event ID. | Read-only. |
| 3 | **Task Context (snapshot)** | The task context as it existed at the time of review: instructions, requirements, acceptance criteria. This is a snapshot -- not the current state (the task may have been updated since). | Read-only. |
| 4 | **Submitted Artifacts (snapshot)** | The submitted artifacts that were reviewed: file list (with download links if still available), structured responses, evidence checklist status. | Download files (if still in storage); read-only. |
| 5 | **Rubric Scores** | Complete rubric scores: per-criterion scores, criterion descriptions, overall score. If Review Assistant suggestions were used: the AI suggestion vs. the reviewer's final score shown side by side for each criterion. | Read-only. |
| 6 | **Feedback** | Complete feedback: overall feedback, strengths, areas for improvement, coaching recommendations. | Read-only. |
| 7 | **Decision Details** | Decision type and decision-specific data: APPROVE -- confirmation. REWORK -- reasons, guidance, artifacts flagged. REJECT -- reasons, justification, evidence. | Read-only. |
| 8 | **Audit Trail** | Chronological audit trail for this task's review lifecycle: all review events (submissions, reviews, decisions, reworks) in order. Each event shows: event type, actor, timestamp, audit event ID. Current review is highlighted in the timeline. | Read-only; expand events for detail. |
| 9 | **Two-Stage Outcome (if applicable)** | If this was a two-stage review: the Stage 2 (client) decision is shown below the Stage 1 detail, including client's decision, feedback, and timestamp. | Read-only. |

**Data Displayed (complete audit record):**

All fields from the audit record structure defined in Flow C10, displayed in a human-readable format.

**Error/Edge Cases:**
- Submitted artifact files have been purged from storage (retention policy): file names shown but download unavailable. Note: "Files have been archived per data retention policy."
- The task or project has been deleted: review record still exists in the immutable audit log. Context may be limited.

**Exit Points:**
- Return to Review History list -> Flow F1.
- Export decision as PDF (for personal records or governance review).

---

### F3: Review Metrics View Flow

**SOW References:** Section 27.3 (KPIs: acceptance rate, rework percentages, SLA compliance rate), Section 3.1.5 (visibility into contributor progress -- the reviewer's own progress in this case)

**Flow Name:** Viewing personal review performance metrics.

**Entry Point:** Reviewer navigates to "Review Metrics" within the Review History section, or accesses it from the sidebar navigation.

**Pre-conditions:**
- User has completed at least one review.
- Metrics are aggregated from the user's review decision history.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Review Metrics Dashboard** | A personal dashboard showing the reviewer's performance metrics. Not visible to other reviewers (privacy). Organized into metric cards and trend charts. | Select time period (this week, this month, last 30 days, last 90 days, all time); read-only. |
| 2 | **Volume Metrics** | Total reviews completed, reviews per week/month trend, breakdown by decision type (pie/bar chart: Approve, Rework, Reject). | Read-only. |
| 3 | **Quality Metrics** | Approval rate (% of reviews resulting in approval), rework rate (% resulting in rework), rejection rate. For two-stage reviews: alignment rate (% of Stage 1 approvals that were also approved at Stage 2 by client). This indicates review quality. | Read-only. |
| 4 | **Timeliness Metrics** | SLA compliance rate (% of reviews completed within SLA), average review time (hours/days from assignment to decision), overdue review count. | Read-only. |
| 5 | **Skill Area Breakdown** | Reviews completed by skill area (based on task skill tags). Shows which domains the reviewer is most active in. | Read-only. |

**Data Displayed:**

| Metric | Description | SOW Reference |
|--------|-------------|---------------|
| Total Reviews | Count of all completed reviews | 27.3 |
| Reviews per Period | Trend over time | 27.3 |
| Decision Distribution | Approve/Rework/Reject percentages | 27.3 |
| SLA Compliance Rate | % within SLA | 27.3 |
| Average Review Time | Mean time to decision | 27.3 |
| Stage 1/Stage 2 Alignment | For two-stage reviews | 3.1.MVP.5 |
| Skill Area Distribution | Reviews by skill domain | 3.1.MVP.2 |

**Decision Points:** None -- this is an informational dashboard.

**Error/Edge Cases:**
- Insufficient data for trend charts (too few reviews): display "Complete more reviews to see trends" instead of charts.
- No reviews completed: empty state with guidance.

**Exit Points:**
- Navigate to Review History -> Flow F1.
- Navigate to Review Queue -> Flow B1.

---

## G. ESCALATION

---

### G1: Escalation Trigger Flow

**SOW References:** Section 14.2 (plagiarism and duplication detection, human oversight with clear escalation paths), Section 4.3 (configurable escalation and re-assignment rules), Section 3.1.6 (exception management -- escalations, reassignments, risk flags)

**Flow Name:** Triggering an escalation when the reviewer identifies issues beyond the scope of standard review.

**Entry Point:** Reviewer identifies an issue during the review process that requires governance attention. This can happen at any point during the Review Detail workflow (Flows C1-C9).

**Pre-conditions:**
- Reviewer is in the Review Detail view.
- An issue has been identified that goes beyond the standard Approve/Rework/Reject decision.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Escalation Trigger** | Reviewer clicks "Escalate" button (available in the Review Detail view alongside the decision options, or accessible from a "More Actions" menu). | Click Escalate. |
| 2 | **Escalation Form** | Modal/dialog: "Escalate to Governance". Fields: (a) Escalation category (select one): Plagiarism or duplication suspected (Section 14.2), Fraud or fabricated content suspected (Section 14.2), Contributor behavior concern (anti-harassment -- Section 14.3), Task definition issue (task requirements are unclear or incorrect), Technical/system issue (submission artifacts appear corrupted or tampered), Other. (b) Description: detailed text explanation of the concern. (c) Evidence: file upload or screenshots supporting the escalation. (d) Urgency: Normal / High / Critical. (e) Does this block your review? Yes (review paused) / No (review can continue independently). | Select category; enter description; upload evidence; select urgency; indicate review impact; submit escalation. |
| 3 | **Escalation Confirmation** | "Escalation submitted. Reference ID: [ESC-XXXX]. You will be notified of updates." If "blocks review" was selected: "Your review is paused pending escalation resolution. The SLA timer has been paused." If "does not block review": "You can continue your review while the escalation is processed." | Acknowledge confirmation; return to review or return to queue. |
| 4 | **Escalation Routing** | Backend: escalation is routed to the appropriate governance officer or admin based on the category (Section 3.1.6 -- exception management). Audit log entry created for the escalation event. | None -- backend processing. |

**Escalation Categories:**

| Category | Routed To | SOW Reference |
|----------|----------|---------------|
| Plagiarism or duplication suspected | Governance officer + fraud detection flag | 14.2 |
| Fraud or fabricated content suspected | Governance officer + fraud detection flag | 14.2 |
| Contributor behavior concern | Governance officer (anti-harassment) | 14.3 |
| Task definition issue | Project admin / PMO | 3.1.6 |
| Technical/system issue | Platform operations | 3.1.8 |
| Other | General governance queue | 14.2 |

**Decision Points:**
- Does the escalation block the review? If YES -> review is paused; SLA timer paused; item remains in queue with "Escalation Pending" status. If NO -> reviewer can continue and submit a decision independently of the escalation.
- Can the reviewer still make a decision while escalated? If the escalation does not block the review, the reviewer can APPROVE, REWORK, or REJECT normally. The escalation proceeds in parallel.

**Error/Edge Cases:**
- Escalation submitted without a description: validation error "Please provide a description of the concern."
- Duplicate escalation (same reviewer, same task, same category): warning "An escalation for this issue already exists (ESC-XXXX). Do you want to add to it or create a new one?"
- Escalation resolved while review is paused: reviewer is notified and the review becomes actionable again; SLA timer resumes.

**Audit (Section 3.1.MVP.8):** Immutable audit log entry:
- Event: ESCALATION_CREATED
- Reviewer ID, timestamp, task ID, submission ID
- Escalation category, description, evidence references
- Urgency level
- Review blocking status

**Exit Points:**
- Return to review (if not blocking) -> continue Flows C1-C9.
- Return to queue (if blocking) -> Flow B1. Item shows "Escalation Pending" status.
- Escalation resolved -> reviewer notified; review resumes.

---

### G2: Reassignment Request Flow

**SOW References:** Section 3.1.MVP.4 (reassignments), Section 4.3 (configurable re-assignment rules), Section 3.1.6 (exception management -- reassignments)

**Flow Name:** Requesting that a review item be reassigned to another reviewer.

**Entry Point:** Reviewer determines they cannot complete a review (lack of expertise, conflict of interest, capacity issue) and requests reassignment.

**Pre-conditions:**
- Reviewer has a review item assigned to them.
- Reviewer has identified a valid reason for not completing the review.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Reassignment Request Trigger** | From the Review Detail view or from the queue (right-click / actions menu on a queue item): reviewer selects "Request Reassignment". | Click Request Reassignment. |
| 2 | **Reassignment Form** | Modal/dialog: "Request Reassignment". Fields: (a) Reason (select one): Lack of expertise in the required skill area, Conflict of interest, Insufficient capacity / cannot meet SLA, Extended absence / unavailability, Other. (b) Additional context: text field for explanation. (c) Suggested reassignee (optional): if the reviewer knows a more suitable reviewer. | Select reason; enter context; optionally suggest reassignee; submit. |
| 3 | **Reassignment Confirmation** | "Reassignment request submitted. The review will remain in your queue until the reassignment is processed." | Acknowledge; return to queue. |
| 4 | **Admin Processing** | The reassignment request is routed to the assignment-svc and relevant admin. The admin or automated reassignment rules (Section 4.3) process the request: assign to a different reviewer based on skills, availability, and the reassignment reason. | None -- admin/system processes. |
| 5 | **Reassignment Complete** | Once reassigned: the item is removed from the original reviewer's queue. Notification: "Review [task name] has been reassigned to another reviewer." | Acknowledge notification. |
| 6 | **Reassignment Denied (edge case)** | If no suitable reviewer is available and the reassignment is denied: "Reassignment request could not be fulfilled. Please complete the review or contact your administrator." | Contact admin; attempt the review; request SLA extension. |

**Reassignment Reasons:**

| Reason | Impact |
|--------|--------|
| Lack of expertise | Reassign to reviewer with matching skill tags |
| Conflict of interest | Reassign to any other qualified reviewer |
| Insufficient capacity | Reassign based on reviewer availability/load |
| Extended absence | Reassign with urgency based on SLA remaining |
| Other | Manual admin review of the request |

**Decision Points:**
- Is automated reassignment possible (Section 4.3)? If YES -> system reassigns automatically. If NO -> admin manually processes.
- Does the SLA allow time for reassignment? If SLA is nearly expired -> urgent reassignment with notification to the new reviewer.

**Error/Edge Cases:**
- All qualified reviewers are at capacity: admin is alerted; SLA may need to be extended.
- Reviewer has partially completed the review (scores entered but no decision): partial progress is saved and made available to the new reviewer (or discarded per policy).

**Audit:** Reassignment events logged: original reviewer, reason, timestamp, new reviewer (once assigned).

**Exit Points:**
- Item removed from queue after reassignment -> Flow B1 (queue refreshes).
- Reassignment denied -> reviewer must complete the review or contact admin.

---

## H. SETTINGS

---

### H1: Review Preferences Flow

**SOW References:** Section 3.1.5 (review forms, rubrics, guided feedback flows -- configurable at reviewer level), Section 19.3 (feedback tools)

**Flow Name:** Configuring personal review preferences.

**Entry Point:** Reviewer navigates to Settings > Review Preferences from the sidebar navigation.

**Pre-conditions:**
- User is authenticated with mentor/reviewer role.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Review Preferences Page** | A settings form with the reviewer's current preferences. Organized into sections. | Edit fields; save changes; reset to defaults. |
| 2 | **Default Review View** | Preference for how the Review Detail view is organized on load: (a) Task Context first (default), (b) Submitted Artifacts first, (c) Contributor Progress first. | Select default view. |
| 3 | **Review Assistant Preferences** | (a) Auto-show Review Assistant panel: On / Off (default: On). (b) Pre-fill rubric with AI suggestions: On / Off (default: Off -- reviewer explicitly accepts suggestions per Flow C4). | Toggle settings. |
| 4 | **Feedback Defaults** | (a) Default feedback structure: show all structured fields (strengths, improvements, coaching) or show free-form only. (b) Feedback templates: option to save and reuse commonly used feedback snippets for similar task types. | Toggle structure preference; manage feedback templates (create, edit, delete). |
| 5 | **Queue Display Preferences** | (a) Default sort order for queue: SLA urgency (default), submission date, priority. (b) Items per page: 10, 25, 50 (default: 25). (c) Compact vs. expanded row display. | Select preferences. |
| 6 | **Save** | Save button. Confirmation: "Preferences saved." | Save; cancel (discard changes). |

**Decision Points:** None -- all settings are optional preferences.

**Error/Edge Cases:**
- Invalid combination (none expected for preferences, but form validates input types).
- Preferences fail to save: "Unable to save preferences. Please try again."

**Exit Points:**
- Save and return to previous view.
- Cancel and discard changes.

---

### H2: Notification Preferences Flow

**SOW References:** Section 3.1.MVP.9 (notification-svc -- email/in-app), Section 3.1.MVP.4 (SLA timers -- notifications)

**Flow Name:** Configuring notification preferences for review-related events.

**Entry Point:** Reviewer navigates to Settings > Notification Preferences.

**Pre-conditions:**
- User is authenticated with mentor/reviewer role.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Notification Preferences Page** | A table of notification event types with channel toggles. Channels: In-App, Email. | Toggle channels per event type; save. |
| 2 | **Notification Event Types** | Each row represents an event type with toggles for each channel. | Toggle individual settings. |

**Notification Event Types:**

| Event | Default: In-App | Default: Email | Description |
|-------|----------------|----------------|-------------|
| New review assigned | ON | ON | A new review item has been added to your queue |
| SLA warning (approaching deadline) | ON | ON | Review SLA is approaching its deadline |
| SLA breach (past deadline) | ON | ON | Review SLA has passed its deadline |
| Rework resubmission received | ON | ON | A contributor has resubmitted after rework |
| Escalation update | ON | ON | An escalation you created has been updated or resolved |
| Reassignment processed | ON | OFF | A reassignment request has been processed |
| Two-stage: client decision received | ON | OFF | The client has made a Stage 2 decision on a submission you reviewed |
| Mentorship session assigned | ON | ON | A new mentorship session has been assigned |
| System announcements | ON | OFF | Platform-wide announcements |

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 3 | **Quiet Hours** | Option to set quiet hours during which email notifications are suppressed (in-app still delivered). Fields: start time, end time, timezone. | Set quiet hours; enable/disable. |
| 4 | **Save** | Save button. Confirmation: "Notification preferences saved." | Save; cancel. |

**Error/Edge Cases:**
- Reviewer disables all notifications for SLA warnings: display a warning "Disabling SLA notifications may result in missed review deadlines."
- Email delivery issues are not managed here (infrastructure concern).

**Exit Points:**
- Save and return to previous view.
- Cancel and discard changes.

---

### H3: Capacity/Availability Settings Flow

**SOW References:** Section 3.1.MVP.4 (assignment workflow, SLA timers -- capacity affects assignment), Section 3.1.5 (profile management: availability), Section 3.1.MVP.3 (contributor portal: availability, timezone)

**Flow Name:** Setting review capacity and availability so the assignment system can appropriately distribute review items.

**Entry Point:** Reviewer navigates to Settings > Capacity & Availability.

**Pre-conditions:**
- User is authenticated with mentor/reviewer role.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Capacity & Availability Page** | Current capacity and availability settings. Organized into sections. | Edit fields; save changes. |
| 2 | **Weekly Capacity** | Current setting: maximum number of reviews per week the reviewer is willing to accept. Current load: number of reviews currently in queue. Display: "You have [X] reviews in your queue. Your weekly capacity is set to [Y]." | Set weekly capacity (numeric input). |
| 3 | **Skill Areas** | List of skill areas the reviewer is qualified to review. These match the skill taxonomy used for task skill tagging (Section 3.1.MVP.2). Displayed as a multi-select list. | Add/remove skill areas from their review profile. |
| 4 | **Availability Schedule** | Weekly availability: which days/hours the reviewer is available for review work. Displayed as a weekly calendar grid. | Set available hours per day; mark days as unavailable. |
| 5 | **Timezone** | Current timezone setting. Used for SLA timer display and availability calculations. | Select timezone from dropdown. |
| 6 | **Absence/Vacation** | Option to set a planned absence period during which no new reviews should be assigned. Fields: start date, end date, reason (optional). Active absence shown with a banner: "You are currently marked as unavailable until [date]. No new reviews will be assigned." | Set absence dates; clear absence. |
| 7 | **Current Queue Summary** | Read-only summary: reviews in queue, oldest item age, nearest SLA deadline. Helps the reviewer understand their current load before adjusting capacity. | Read-only. |
| 8 | **Save** | Save button. Confirmation: "Capacity and availability settings saved. New review assignments will reflect your updated availability." | Save; cancel. |

**Data Displayed:**

| Field | Source | SOW Reference |
|-------|--------|---------------|
| Weekly Capacity | Reviewer's setting | 3.1.MVP.4 |
| Current Queue Load | review-svc / assignment-svc | 19.3 |
| Skill Areas | skill-genome-svc | 3.1.MVP.2 |
| Availability Schedule | Reviewer's setting | 3.1.5 |
| Timezone | Reviewer's setting | 3.1.5 |
| Absence Dates | Reviewer's setting | 3.1.MVP.4 |

**Decision Points:**
- Reviewer reduces capacity below current queue load: warning "You currently have [X] reviews in your queue, which exceeds your new capacity of [Y]. Existing reviews will not be reassigned, but no new reviews will be assigned until your queue is below capacity."
- Reviewer sets absence while reviews are in queue: warning "You have [X] reviews in your queue. Setting an absence will not reassign existing reviews. Consider requesting reassignment for pending reviews before your absence."

**Error/Edge Cases:**
- Reviewer sets capacity to 0: treated as "temporarily unavailable" -- no new assignments. Existing queue items remain.
- Reviewer removes all skill areas: warning "You have no skill areas selected. You will not be assigned any reviews." This effectively pauses review assignments.
- Invalid absence dates (end before start): validation error.

**Exit Points:**
- Save and return to previous view.
- Cancel and discard changes.

---

## Appendix A: Navigation Map

```
MENTOR & REVIEWER WORKSPACE
|
|-- [DEFAULT] Review Queue .................. Flow B1
|   |-- Reviews Tab (assigned reviews)
|   |   |-- Filter & Sort .................. Flow B3
|   |   |-- SLA Indicators ................. Flow B5
|   |   |-- Select Item .................... Flow B4
|   |   |   |-- Review Detail
|   |   |   |   |-- Task Context ........... Flow C1
|   |   |   |   |-- Submitted Artifacts .... Flow C2
|   |   |   |   |-- Contributor Progress ... Flow C3
|   |   |   |   |-- Review Assistant ....... Flow C4
|   |   |   |   |-- Rubric Scoring ......... Flow C5
|   |   |   |   |-- Feedback Input ......... Flow C6
|   |   |   |   |-- Decision: Approve ...... Flow C7
|   |   |   |   |-- Decision: Rework ....... Flow C8
|   |   |   |   |-- Decision: Reject ....... Flow C9
|   |   |   |   |-- Audit Logging .......... Flow C10
|   |   |   |   |-- Rework History ......... Flow E1
|   |   |   |   |-- Version Comparison ..... Flow E2
|   |   |   |   |-- Escalate ............... Flow G1
|   |   |   |   |-- Request Reassignment ... Flow G2
|   |-- Mentorship Sessions Tab ............ Flow B2
|
|-- Review History .......................... Flow F1
|   |-- Review Decision Detail ............. Flow F2
|   |-- Review Metrics ..................... Flow F3
|
|-- Settings
|   |-- Review Preferences ................. Flow H1
|   |-- Notification Preferences ........... Flow H2
|   |-- Capacity & Availability ............ Flow H3
```

---

## Appendix B: Review Workflow State Diagram

```
SUBMISSION RECEIVED
       |
       v
  ASSIGNED TO REVIEWER (SLA timer starts)
       |
       v
  REVIEWER OPENS REVIEW DETAIL
       |
       v
  [Review: Context -> Artifacts -> Progress -> AI Assist -> Rubric -> Feedback]
       |
       v
  DECISION POINT
       |
  +----+----+--------+
  |         |        |
  v         v        v
APPROVE   REWORK   REJECT
  |         |        |
  v         v        v
[Single]  [Notify   [Notify
 or       contrib,  contrib,
[Stage1]  resubmit] close/
  |         |       reassign]
  v         v        |
[Single:  [Resub    v
 Accept,  returns   AUDIT
 payout]  to queue] LOG
  |         |
  v         v
[Stage1:  REPEAT
 Forward  REVIEW
 to       CYCLE
 Stage2]
  |
  v
CLIENT
REVIEW
(Stage2)
  |
  +----+----+--------+
  |         |        |
  v         v        v
ACCEPT   REWORK   REJECT
(final)  (back to  (final)
         Stage1)
```

---

## Appendix C: SOW Section Cross-Reference Index

| SOW Section | Flows That Reference It |
|-------------|------------------------|
| 2.3 (Target Users) | A2 |
| 3.1.5 (Contributor Portals -- Mentor Workspace) | A2, B1, B2, C3, C6, H3 |
| 3.1.MVP.2 (Task Decomposition) | B3, C1, C5, F1, F3, H3 |
| 3.1.MVP.3 (Contributor Onboarding / Digital Twin) | A2, C3 |
| 3.1.MVP.4 (Assignment, SLA Timers) | B1, B3, B5, C8, G2, H3 |
| 3.1.MVP.5 (Workroom, Submission, Review, Acceptance) | B1, C1, C2, C5, C7, C8, C9, C10, D1, D2, D3, E1, E2, F1 |
| 3.1.MVP.6 (Pricing / Payout Eligibility) | C7, D3 |
| 3.1.MVP.7 (AI Agents -- Review Assistant) | C4 |
| 3.1.MVP.8 (Security, IAM, Audit) | A1, A2, C7, C8, C9, C10, F1, F2, G1 |
| 4.3 (Configuration -- SLAs, Escalation) | B5, C8, G1, G2 |
| 7.5 (AI Governance -- Explainability) | C4, C10 |
| 9.1 (Economy Model) | C7, D3 |
| 11 (Digital Twin) | C3, B2 |
| 14.2 (Governance Mechanisms) | C9, G1 |
| 14.3 (Policy Framework) | C6, G1 |
| 15.2 (Security Controls -- RBAC, Zero Trust) | A1, A2, C3 |
| 19.3 (Mentor & Reviewer Workspace) | B1, B2, B3, C5, C6, F1, F3 |
| 20.2 (Women Workforce -- Mentorship) | B2 |
| 27.3 (KPIs) | F3 |

---

## Appendix D: Screen Inventory for Wireframing

### Tier 1: Critical Path Screens (MVP)

| # | Screen | Primary Flow |
|---|--------|-------------|
| 1 | SSO Login Page | A1 |
| 2 | Review Queue -- Main View (with tabs, filters, SLA indicators) | B1, B3, B5 |
| 3 | Review Detail -- Multi-Panel Layout (task context + artifacts + rubric + feedback + decision) | C1-C10 |
| 4 | Review Assistant Panel (within Review Detail) | C4 |
| 5 | Decision Confirmation Dialog -- Approve | C7 |
| 6 | Decision Confirmation Dialog -- Rework (with reasons form) | C8 |
| 7 | Decision Confirmation Dialog -- Reject (with justification form) | C9 |

### Tier 2: Important Supporting Screens

| # | Screen | Primary Flow |
|---|--------|-------------|
| 8 | Mentorship Sessions Tab | B2 |
| 9 | Contributor Progress Panel (within Review Detail) | C3 |
| 10 | Rework History / Version Comparison View | E1, E2 |
| 11 | Review History -- List View | F1 |
| 12 | Review Decision Detail (audit trail view) | F2 |
| 13 | Review Metrics Dashboard | F3 |
| 14 | Escalation Form | G1 |
| 15 | Reassignment Request Form | G2 |

### Tier 3: Settings & Configuration

| # | Screen | Primary Flow |
|---|--------|-------------|
| 16 | Review Preferences | H1 |
| 17 | Notification Preferences | H2 |
| 18 | Capacity & Availability Settings | H3 |
