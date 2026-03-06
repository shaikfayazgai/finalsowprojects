# Flow Document: Contributor Portal

**Version:** 1.0
**Date:** 2026-03-06
**SOW Module:** Contributor Portal (Section 19.2 + 3.1.5 + 20)
**Target Users:** All contributor types -- students, women workforce, freelancers, internal employees (Section 2.3)
**Basis:** Every flow in this document is derived from SOW V1.1. Section numbers are cited inline. Nothing is invented.

**Important:** Students and Women Workforce are TRACKS within the single Contributor Portal (Section 20), NOT separate portals. Flows marked [Student Track] or [Women Track] indicate segment-specific variations within the shared portal.

---

## Table of Contents

- [A. Registration & Onboarding](#a-registration--onboarding)
- [B. Dashboard / Home](#b-dashboard--home)
- [C. Profile & Digital Twin](#c-profile--digital-twin)
- [D. Task Discovery & Assignment](#d-task-discovery--assignment)
- [E. Task Workroom & Submission](#e-task-workroom--submission)
- [F. Review Status & Rework](#f-review-status--rework)
- [G. Earnings & Payouts](#g-earnings--payouts)
- [H. Credential Wallet](#h-credential-wallet)
- [I. Learning & Development](#i-learning--development)
- [J. Support & Safety](#j-support--safety)
- [K. Settings](#k-settings)

---

## Persona Reference

### Persona 1: Fatima Al-Hassan -- Women Workforce Contributor
- Age 32, Karachi, Pakistan. B.Sc. Computer Science (graduated 8 years ago).
- Left corporate IT 5 years ago; 2 children (ages 3 and 6).
- Android smartphone (mid-range), shared family laptop. 4G mobile data (inconsistent).
- Trust deficit: scammed by work-from-home platforms before.
- Privacy-conscious: cannot have public online profile due to family/cultural context.
- Time-constrained: 3-4 hours/day in fragments.
- Financial motivation: $200-300/month supplemental income.
- Skills: frontend dev (HTML/CSS/JS), data entry, QA testing, documentation, basic Python.

### Persona 2: Arjun Mehta -- Student Contributor
- Age 20, Bangalore, India. 3rd year B.Tech Computer Science.
- No formal work experience; hackathon projects.
- Career-focused: wants real-world project experience + verifiable credentials.
- Time-aware: college commitments (exams, labs).
- Income secondary to credential/skill building.
- Skills: React, Node.js, basic ML/data science, Git, CI/CD.

---

## A. REGISTRATION & ONBOARDING

---

### A1: External Contributor Registration (via invite link)

**SOW References:** Section 3.1.MVP.3 (contributor registration -- external via invite), Section 3.1.5 (registration, identity verification, onboarding workflows)

**Entry Point:** Contributor clicks invite link received via email (sent by enterprise admin -- Flow H5 in Enterprise Console doc).

**Pre-conditions:**
- Enterprise admin has sent an invite to the contributor's email (Section 3.1.MVP.3 -- external via invite).
- Contributor has a device with internet access.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Invite Landing Page** | Platform branding. Welcome message: "You've been invited to join GlimmoraTeam." Invite context: who invited, for what purpose (if provided). Language selector (Section 3.1.5 -- localization framework). | Select language; click "Create Account". |
| 2 | **Registration Form** | Fields: email (pre-filled from invite), full name, password (or SSO option if enterprise IdP configured), phone number (optional), country/region. Terms of use and privacy policy links (Section 14.3 -- terms of use). | Fill fields; read terms; submit. |
| 3 | **Email Verification** | "We've sent a verification code to [email]. Enter the code below." Input field for verification code. Resend option with cooldown timer. | Enter code; resend; change email. |
| 4 | **Account Created** | Success message: "Account created. Let's set up your profile." | Proceed to profile setup (Flow A5). |

**Decision Points:**
- Step 2: SSO available for this invite? YES -> "Sign in with your organization" option. NO -> email/password registration.
- Step 3: Code valid? YES -> Step 4. NO -> "Invalid code. Please try again."

**Error/Edge Cases:**
- Invite link expired: "This invite has expired. Please contact [inviter] for a new invite."
- Email already registered: "This email is already registered. Sign in instead?" with login link.
- Weak password: inline validation with requirements display.
- Network interruption during registration: form state preserved; retry on reconnect.

**Exit Points:**
- Account created -> Flow A5 (Profile Setup).
- Abandoned registration -> can resume via invite link.

**Audit:** Registration event logged: user ID (new), timestamp, invite source, registration method.

---

### A2: Internal Contributor Registration (via HRIS sync)

**SOW References:** Section 3.1.MVP.3 (contributor registration -- internal via HRIS sync OR manual import), Section 3.1.MVP.9 (HRIS import/sync)

**Entry Point:** Internal employee's account is auto-created via HRIS sync. Employee receives notification (email/internal system) that their GlimmoraTeam account is ready.

**Pre-conditions:**
- Enterprise admin has configured HRIS integration (Enterprise Console Flow H4).
- HRIS sync has run and created the employee's contributor record.
- Employee has SSO credentials via enterprise IdP.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Notification** | Email or internal notification: "Your GlimmoraTeam contributor account has been created. Sign in to complete your profile." Link to Contributor Portal. | Click link. |
| 2 | **SSO Login** | Standard SSO login (SAML/OIDC). Enterprise IdP authentication. | Enter enterprise credentials; authenticate. |
| 3 | **Welcome / First Login** | "Welcome to GlimmoraTeam, [Name]." Pre-populated fields from HRIS: name, email, role, department, cost center. "Please review and complete your profile." | Review pre-populated data; proceed to profile setup. |
| 4 | **Profile Completion** | Redirected to consent capture (Flow A4) and then profile setup (Flow A5) to add skills and preferences not available from HRIS. | Complete profile setup flow. |

**Decision Points:**
- Step 3: HRIS data correct? YES -> proceed. NO -> flag discrepancy for admin review (contributor cannot edit HRIS-sourced fields directly).

**Error/Edge Cases:**
- HRIS sync error (employee not found): "Your account could not be created. Contact your HR administrator."
- Partial HRIS data: some fields pre-populated, others blank for manual entry.
- Employee already has external contributor account: account linking flow (merge profiles) or admin resolution.

**Exit Points:**
- Profile completion -> Flow A4 (Consent) then Flow A5 (Skills Setup).

**Audit:** Account creation logged: user ID, timestamp, source = "HRIS_sync", HRIS record ID.

---

### A3: Identity Verification Flow

**SOW References:** Section 3.1.5 (identity verification), Section 3.1.MVP.3 (contributor registration -- identity verification)

**Entry Point:** After registration (Flow A1 or A2), as part of onboarding sequence.

**Pre-conditions:**
- Contributor account exists.
- Identity verification required by platform policy.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Verification Prompt** | "To ensure platform safety, we need to verify your identity." Explanation of why verification is needed and what data is collected. Privacy assurance: "Your documents are used for verification only and stored securely (Section 15 -- encryption at rest)." | Proceed; skip for now (if policy allows). |
| 2 | **Verification Method** | Options based on platform configuration: Government ID upload (photo of ID document), Email verification (already completed in A1), Phone verification (SMS code), Institutional verification (for student track -- university email/ID). | Select method; proceed. |
| 3a | **ID Upload** | Camera capture or file upload for ID document. Guidelines: "Ensure document is clearly visible, all corners in frame." | Take photo / upload file; retake. |
| 3b | **Phone Verification** | Enter phone number; receive SMS code; enter code. | Send code; enter code; resend. |
| 3c | **Institutional Verification** | Enter university email or student ID. Verification link/code sent to institutional email. | Enter email/ID; verify code. |
| 4 | **Processing** | "Verifying your identity..." Processing indicator. Timeframe: "This may take a few minutes to a few hours." | Wait; continue with limited access. |
| 5a | **Verified** | "Identity verified!" Green checkmark. Full platform access granted. | Continue to profile setup or dashboard. |
| 5b | **Verification Failed** | "We couldn't verify your identity. Please try again or contact support." Reason (if safe to disclose). | Retry; contact support; upload different document. |

**Decision Points:**
- Step 2: Which verification method? Depends on contributor type and platform policy.
- Step 4: Verification successful? YES -> 5a. NO -> 5b.

**Error/Edge Cases:**
- Blurry ID photo: "Image quality too low. Please retake with better lighting."
- SMS not received: resend option; alternative method fallback.
- Verification service timeout: "Verification taking longer than expected. We'll notify you when complete."
- Skip allowed: contributor can use platform with limited access (e.g., can browse but not accept tasks) until verified.

**Exit Points:**
- Verified -> continue onboarding.
- Failed -> retry or support.

**Audit:** Verification attempt logged: user ID, timestamp, method, result, verification provider (if external).

---

### A4: Consent Capture Flow

**SOW References:** Section 3.1.MVP.3 (consent capture and role assignment)

**Entry Point:** Part of onboarding sequence, after registration and identity verification.

**Pre-conditions:**
- Contributor account exists.
- Identity verification completed or in progress.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Consent Page** | Platform terms of use (full text, scrollable). Privacy policy. Data processing agreement. Clear language (localized per Section 3.1.5): what data is collected, how it's used, contributor rights, opt-out options. Section headings for easy scanning. | Read; scroll; expand sections. |
| 2 | **Consent Checkboxes** | Individual consent items (each must be explicitly accepted): "I agree to the Terms of Use" (required), "I agree to the Privacy Policy" (required), "I consent to data processing as described" (required), "I agree to the Code of Conduct and Anti-Harassment Policy" (required -- Section 14.3). Optional: "I consent to receiving notifications via email/SMS." | Check/uncheck each item. |
| 3 | **Consent Confirmation** | All required consents checked. "Submit Consent" button enabled. | Submit; go back to re-read. |
| 4 | **Consent Recorded** | "Consent recorded. Thank you." Timestamp and consent version recorded. Contributor can view/revoke consent later in Settings. | Proceed to profile setup (Flow A5). |

**Decision Points:**
- Step 2: All required consents checked? YES -> can submit. NO -> "Submit" button disabled.

**Error/Edge Cases:**
- Contributor declines required consent: cannot proceed; message "Platform access requires acceptance of terms. If you have questions, contact support."
- Terms updated since last consent: returning users prompted to re-consent to new terms.
- Consent revoked later: triggers account status review; may limit platform access.

**Exit Points:**
- Consent given -> Flow A5 (Profile Setup).
- Consent declined -> account limited; support contact provided.

**Audit:** Consent event logged immutably: user ID, timestamp, consent items accepted/declined, terms version, IP address.

---

### A5: Profile Setup -- Skills Self-Declaration

**SOW References:** Section 3.1.MVP.3 (profile + skills self-declaration), Section 19.2 (profile and digital twin view)

**Entry Point:** After consent capture (Flow A4), as part of onboarding, OR Profile > Edit Skills.

**Pre-conditions:**
- Contributor account exists with consent recorded.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Skills Setup Page** | Introduction: "Tell us about your skills. This helps us match you with the right tasks." Skills taxonomy displayed as searchable categories (Section 3.1.2 -- skills taxonomy). | Browse categories; search skills. |
| 2 | **Skill Selection** | Autocomplete search field. Skill categories: e.g., Frontend Development, Backend Development, Data Entry, QA Testing, Documentation, Design, Data Science. As user types, matching skills appear. | Type to search; select skills from taxonomy; browse by category. |
| 3 | **Proficiency Level** | For each selected skill: proficiency level selector (Beginner / Intermediate / Advanced / Expert). Optional: years of experience with this skill. | Set proficiency; adjust; remove skill. |
| 4 | **Skills Summary** | List of all declared skills with proficiency levels. Minimum skills required: system indicates if minimum met (e.g., "Add at least 1 skill to continue"). | Add more; edit; remove; proceed to evidence (Flow A6). |
| 5 | **Save** | Skills saved to contributor profile. Digital twin v1 initialized (Section 3.1.MVP.3 -- skills list). | Continue onboarding; skip evidence for now. |

**Decision Points:**
- Step 4: Minimum skills declared? YES -> can proceed. NO -> prompted to add more.

**Error/Edge Cases:**
- Skill not in taxonomy: "Can't find your skill? Request to add it." Free-text entry flagged for taxonomy review.
- Too many skills selected (potential gaming): system may limit or flag excessive declarations.
- Returning to edit skills later: same flow, existing skills pre-loaded.

**Exit Points:**
- Skills saved -> Flow A6 (Evidence) or Flow A7 (Availability) or Dashboard.

**Audit:** Skills declaration logged: user ID, timestamp, skills added/removed, proficiency levels.

---

### A6: Profile Setup -- Evidence Attachments (links/docs)

**SOW References:** Section 3.1.MVP.3 (evidence attachments -- links/docs)

**Entry Point:** After skills declaration (Flow A5), OR Profile > Evidence.

**Pre-conditions:**
- At least one skill declared.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Evidence Page** | "Add evidence to support your skills. This strengthens your profile and helps matching." Per-skill evidence section. | Select skill to add evidence for. |
| 2 | **Evidence Upload** | For selected skill: two options -- "Upload Document" (PDF, DOC, images -- certificates, portfolios) and "Add Link" (GitHub, portfolio URL, LinkedIn project). | Upload file; paste URL; add description. |
| 3 | **Evidence Detail** | For each evidence item: title/description field, associated skill(s), upload date. Preview for uploaded documents (if supported). | Edit description; remove; add more. |
| 4 | **Evidence Summary** | All evidence items listed by skill. "X skills with evidence, Y skills without evidence." | Add more evidence; proceed; skip for now. |

**Decision Points:**
- Evidence is optional but recommended. System may display: "Profiles with evidence get matched X% more often" (if platform tracks this -- derived from Section 3.1.MVP.4 matching quality signals).

**Error/Edge Cases:**
- File too large: "File exceeds maximum size of [X]MB. Please compress or upload a smaller file."
- Invalid URL: "This URL doesn't appear to be valid. Please check and retry."
- Privacy concern: message "Evidence is only visible to authorized platform reviewers and is not publicly displayed" (reinforces privacy -- Section 20.3).

**Exit Points:**
- Evidence saved -> Flow A7 (Availability) or Dashboard.
- Skipped -> can add later from Profile.

**Audit:** Evidence upload logged: user ID, timestamp, skill, evidence type (file/link), file hash (for files).

---

### A7: Availability & Timezone Configuration

**SOW References:** Section 3.1.5 (profile management -- availability, time zones), Section 3.1.MVP.4 (matching engine uses availability)

**Entry Point:** Onboarding sequence after skills/evidence, OR Profile > Availability.

**Pre-conditions:**
- Contributor account exists.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Timezone Selection** | Dropdown/search for timezone. Auto-detected from browser with manual override. | Select timezone; confirm auto-detection. |
| 2 | **Availability Schedule** | Weekly availability grid: days of week x time blocks. Visual calendar where contributor marks available hours. Default: full-time (40 hrs/week). | Click to toggle availability blocks; set recurring schedule; set specific dates. |
| 3 | **Hours per Week** | Summary: total available hours per week based on schedule. Option for simple entry: "I'm available approximately [X] hours per week" instead of detailed schedule. | Enter hours; use detailed schedule; save. |
| 4 | **Availability Saved** | Confirmation. Matching engine will use this to recommend appropriate tasks. | Continue onboarding; adjust later. |

**Decision Points:**
- Step 2: Detailed schedule or simple hours entry? User chooses.

**Error/Edge Cases:**
- Zero availability: warning "With zero available hours, you won't be matched to tasks."
- Very limited availability (e.g., 5 hrs/week): system notes this for matching; only short/small tasks recommended.
- Timezone change: affects SLA calculations for assigned tasks.

**Exit Points:**
- Saved -> next onboarding step or Dashboard.

**Audit:** Availability change logged: user ID, timestamp, timezone, hours per week, schedule details.

---

### A8: [Student Track] Institutional Onboarding with University Partner

**SOW References:** Section 20.1 (institutional onboarding model with university partners)

**Entry Point:** Student receives invite through university partnership program, OR navigates to platform via university portal link.

**Pre-conditions:**
- University partner agreement exists with platform.
- Student is enrolled at partner university.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **University Landing Page** | Platform branding + university co-branding. "Welcome, [University Name] students!" Explanation of the program: real-world project experience, outcome-based credentials, academic recognition. | Click "Join as Student Contributor". |
| 2 | **Institutional Verification** | "Verify your student status." Options: university email verification (enter .edu email, receive code), student ID upload, SSO via university IdP (if configured). | Select verification method; complete verification. |
| 3 | **Student Registration** | Registration form (similar to A1) with pre-filled university name. Additional fields: program/major, expected graduation year, faculty advisor (optional). | Fill fields; submit. |
| 4 | **Student-Specific Consent** | Standard consent (Flow A4) plus student-specific terms: supervision model acknowledgment, academic integrity policy, understanding that tasks have student guardrails (Section 20.1 -- guardrails and supervision models). | Read; accept; proceed. |
| 5 | **Profile Setup** | Standard skills/evidence/availability flows (A5-A7) with student context: "Select skills you've developed through coursework or projects." | Complete profile setup. |
| 6 | **Onboarding Complete** | "Welcome aboard! You'll see student-appropriate tasks in your task discovery. Your work will count toward your professional credentials." Dashboard redirect. | Go to Dashboard (Flow B1). |

**Decision Points:**
- Step 2: Institutional verification succeeds? YES -> Step 3. NO -> "Could not verify student status. Ensure you're using your university email or contact your program coordinator."

**Error/Edge Cases:**
- University not in partner list: "Your university is not yet a GlimmoraTeam partner. Contact us to express interest."
- Student already graduated: "This program is for currently enrolled students. Alumni can register as general contributors."
- University SSO integration failure: fallback to email verification.

**Exit Points:**
- Onboarding complete -> Dashboard with student-filtered task view.

**Audit:** Institutional onboarding logged: user ID, timestamp, university, verification method, student ID (hashed).

---

### A9: [Women Track] Flexible Scheduling & Accessibility Setup

**SOW References:** Section 20.2 (flexible scheduling, remote-first task models, accessible UX), Section 20.3 (inclusive design and accessibility practices)

**Entry Point:** During onboarding for women workforce contributors (after standard profile setup), OR Settings > Accessibility.

**Pre-conditions:**
- Contributor registered as women workforce track participant.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Flexible Schedule Setup** | "We understand your time may be fragmented. Let's set up a schedule that works for you." Simplified availability input: "When are you typically available?" with morning/afternoon/evening checkboxes per day. Option for "Variable schedule -- I'll update weekly." | Select time blocks; set variable schedule; skip for now. |
| 2 | **Task Preference** | "What type of tasks work best for you?" Options based on schedule: Short tasks (< 2 hours), Flexible deadline tasks, Tasks with no real-time meetings required. | Select preferences; these feed into matching (Section 3.1.MVP.4). |
| 3 | **Accessibility Settings** | "Customize your experience." Options: Text size (small/medium/large), High contrast mode, Screen reader optimization note, Language selection with RTL support (for Urdu, Arabic). Mobile-first layout confirmation. | Set preferences; save. |
| 4 | **Support Introduction** | "You're not alone. Here's how to get help:" Mentorship access info (Section 20.2), Community support channels (Section 20.2), Grievance redressal (Section 20.3), Safe-work policy summary (Section 20.3). | Bookmark support; proceed to dashboard. |

**Decision Points:**
- All settings optional but recommended.

**Error/Edge Cases:**
- Contributor doesn't identify as women workforce track: these settings are available to all contributors but highlighted for women track participants during onboarding.
- Accessibility settings need for specific needs not covered: "Tell us about your accessibility needs" free-text field -> routed to support.

**Exit Points:**
- Settings saved -> Dashboard (Flow B1).

**Audit:** Accessibility/scheduling preferences logged: user ID, timestamp, preferences set.

---

## B. DASHBOARD / HOME

---

### B1: Contributor Dashboard View

**SOW References:** Section 19.2 (profile and digital twin view), Section 3.1.5 (task discovery, earnings, credential wallet)

**Entry Point:** Contributor Portal default landing page after login.

**Pre-conditions:**
- Contributor authenticated and onboarding completed.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Dashboard** | Personalized greeting. Summary cards: Active tasks (count + status indicators), Earnings summary (total earned, pending payout), Skills count, Credentials count. Quick actions: "Browse Tasks", "View Earnings", "Update Profile". | Click any summary card to navigate; use quick actions. |
| 2 | **Active Tasks Section** | List of currently assigned tasks: task name, project name, status (In Progress / Submitted / In Review / Rework), SLA countdown, due date. | Click task to go to Workroom (Flow E1); view all tasks. |
| 3 | **Notifications** | Recent notifications: new task recommendations, review decisions, payout updates, platform announcements. Unread count badge. | Click notification to navigate; mark as read; view all. |
| 4 | **[Student Track] Academic Progress** | If student: tasks completed, credentials earned, skills validated -- linked to academic recognition (Section 20.1). | View credentials; view skills. |
| 5 | **[Women Track] Community & Support** | If women track: quick access to mentorship, community support, next recommended task matching flexible schedule. | Access support (Flow J3); browse tasks. |

**Decision Points:**
- Dashboard adapts based on contributor segment (student, women, freelancer, internal) -- same portal, different emphasis.

**Error/Edge Cases:**
- New contributor (no activity): empty state with onboarding guidance "Complete your profile to start receiving task recommendations."
- All tasks completed: celebratory state with "Great work! Browse new tasks."

**Exit Points:**
- Navigate to any section: Tasks, Earnings, Profile, Credentials, Settings.

**Audit:** Dashboard view logged: user ID, timestamp.

---

### B2: Digital Twin Summary Display

**SOW References:** Section 3.1.MVP.3 (digital twin v1: skills list + activity metrics + basic reliability counters), Section 11 (digital twin attributes)

**Entry Point:** Dashboard > "Your Digital Twin" card, OR Profile > Digital Twin tab.

**Pre-conditions:**
- Contributor has profile data (even if minimal).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Digital Twin Summary** | Visual representation of contributor's digital twin. Sections: Skills (list with proficiency levels), Activity Metrics (tasks completed, submissions, acceptance rate), Reliability Counters (on-time delivery rate, SLA compliance rate), Collaboration Signals (feedback received, mentor interactions -- Section 11). | View each section; expand for detail; navigate to full digital twin (Flow C5). |
| 2 | **Skills Snapshot** | Top skills with proficiency indicators. "Skills validated through delivery" vs "self-declared" distinction (validated = accepted task used this skill). | View all skills (Flow C1). |
| 3 | **Metrics Snapshot** | Key numbers: total tasks completed, acceptance rate %, on-time delivery %, learning velocity indicator (Section 11 -- time to adopt skills, performance over time). | View detailed metrics (Flow C5). |

**Decision Points:**
- None -- informational display.

**Error/Edge Cases:**
- New contributor: "Complete tasks to build your Digital Twin. Your skills and metrics will grow with every accepted deliverable."
- Low metrics: no judgment shown; constructive message like "Your acceptance rate is building. Focus on evidence quality."

**Exit Points:**
- Navigate to full Profile (Flow C1) or Digital Twin Detail (Flow C5).

**Audit:** Digital twin view logged: user ID, timestamp.

---

## C. PROFILE & DIGITAL TWIN

---

### C1: Profile View

**SOW References:** Section 19.2 (profile and digital twin view), Section 3.1.5 (profile management)

**Entry Point:** Contributor Portal > Profile.

**Pre-conditions:**
- Contributor authenticated.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Profile Page** | Personal information: name, email, contributor type, segment (student/women/freelancer/internal), join date, verification status. Profile completeness indicator (% complete). | View; edit (Flow C2). |
| 2 | **Skills Section** | All declared skills with proficiency levels. Evidence count per skill. Skills with accepted task validation marked distinctly. | View skills; add/edit (Flow C3); manage evidence (Flow C4). |
| 3 | **Availability Section** | Current timezone, weekly availability schedule or hours per week. | Edit (Flow C2). |
| 4 | **Preferences Section** | Task preferences (if set), notification preferences, language/locale. | Edit (Flow K1-K3). |

**Decision Points:**
- None -- view flow.

**Error/Edge Cases:**
- Incomplete profile: highlighted sections with "Complete this section to improve task matching."
- HRIS-sourced fields (internal contributors): displayed but not directly editable by contributor; note "Managed by your organization."

**Exit Points:**
- Edit profile (Flow C2); manage skills (Flow C3); manage evidence (Flow C4).

**Audit:** Profile view logged: user ID, timestamp.

---

### C2: Profile Edit (skills, preferences, availability, timezone)

**SOW References:** Section 3.1.5 (profile management -- skills, preferences, availability, time zones)

**Entry Point:** Profile View > "Edit" button on any section.

**Pre-conditions:**
- Contributor authenticated.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Edit Mode** | Profile fields become editable. Editable: name (personal), skills, preferences, availability, timezone, notification preferences. Non-editable: email (change requires verification), contributor type, HRIS-sourced fields. | Edit fields; save; cancel. |
| 2 | **Validation** | Inline validation on edited fields. Required fields cannot be left blank. | Fix validation errors. |
| 3 | **Save** | Changes saved. Confirmation: "Profile updated." Matching engine will use updated data for future recommendations. | View updated profile. |

**Decision Points:**
- Save valid? YES -> saved. NO -> validation errors shown.

**Error/Edge Cases:**
- Email change: triggers new verification flow.
- Timezone change with active tasks: warning "Changing timezone may affect SLA calculations for your current tasks."

**Exit Points:**
- Profile saved -> return to Profile View.

**Audit:** Profile edit logged: user ID, timestamp, fields changed (before/after).

---

### C3: Skills Self-Declaration Update

**SOW References:** Section 3.1.MVP.3 (skills self-declaration)

**Entry Point:** Profile > Skills Section > "Add/Edit Skills".

**Pre-conditions:**
- Contributor authenticated.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Skills Editor** | Current skills list with proficiency levels. Search/add field (same as Flow A5). Skills with delivery validation marked (cannot be removed -- earned through accepted tasks). | Add new skills; edit proficiency; remove self-declared skills. |
| 2 | **Add Skill** | Autocomplete search from taxonomy. Select skill -> set proficiency level. | Search; select; set level; save. |
| 3 | **Edit Proficiency** | Change proficiency level for existing skill. | Select new level; save. |
| 4 | **Remove Skill** | Remove self-declared skill (only if no evidence or active tasks linked). Delivery-validated skills cannot be removed. | Confirm removal. |
| 5 | **Save** | Skills updated. Digital twin updated (Section 3.1.MVP.3). | View updated profile. |

**Decision Points:**
- Step 4: Skill has evidence or active tasks? YES -> cannot remove; message "This skill is linked to evidence/active tasks." NO -> can remove.

**Error/Edge Cases:**
- Removing skill with upcoming task recommendation: "Removing this skill may affect your task recommendations."
- Adding duplicate skill: prevented by autocomplete.

**Exit Points:**
- Skills saved -> Profile View.

**Audit:** Skills change logged: user ID, timestamp, skills added/removed/proficiency changed.

---

### C4: Evidence Management (add/remove evidence attachments)

**SOW References:** Section 3.1.MVP.3 (evidence attachments -- links/docs)

**Entry Point:** Profile > Skills > specific skill > "Manage Evidence", OR Profile > Evidence tab.

**Pre-conditions:**
- At least one skill declared.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Evidence List** | All evidence items organized by skill. Each item: title, type (file/link), upload date, associated skill(s). | View; add new; edit; delete. |
| 2 | **Add Evidence** | Same as Flow A6: upload file or add link, associate with skill(s), add description. | Upload; save. |
| 3 | **Edit Evidence** | Edit title/description. Cannot change the file itself (upload new instead). Can change skill association. | Edit; save. |
| 4 | **Delete Evidence** | Confirmation: "Remove this evidence? This cannot be undone." | Confirm delete; cancel. |

**Decision Points:**
- Step 4: Confirm deletion? YES -> removed. NO -> cancel.

**Error/Edge Cases:**
- Evidence referenced in active review: "This evidence is part of an active submission review and cannot be removed until the review is complete."
- Storage quota exceeded: "You've reached your evidence storage limit. Remove some items or contact support."

**Exit Points:**
- Evidence managed -> Profile View.

**Audit:** Evidence changes logged: user ID, timestamp, action (add/edit/delete), evidence ID, file hash.

---

### C5: Digital Twin Detail View

**SOW References:** Section 3.1.MVP.3 (digital twin v1: skills list + activity metrics + basic reliability counters), Section 11 (digital twin full attributes)

**Entry Point:** Profile > Digital Twin tab, OR Dashboard > Digital Twin card.

**Pre-conditions:**
- Contributor has some platform activity (or at least completed profile).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Digital Twin Overview** | Visual summary: overall "twin health" indicator. Sections organized by Section 11 attributes. | Navigate between sections. |
| 2 | **Verified Skills** | Skills validated through accepted deliverables. Each skill shows: proficiency (self-declared + delivery-validated), tasks completed using this skill, acceptance rate for this skill. Distinct from self-declared-only skills. | View skill detail. |
| 3 | **Reliability Profile** | On-time delivery rate, SLA compliance rate, acceptance rate. Trends over time (improving/declining/stable). Section 11: on-time delivery, acceptance rates, SLA compliance. | View trends. |
| 4 | **Collaboration Signals** | Feedback received from mentors/reviewers (aggregated, not individual), peer rating summary (if applicable), mentor interaction count. Section 11: feedback, peer ratings, mentor involvement. | View detail. |
| 5 | **Learning Velocity** | Time to adopt new skills, performance improvement over time. Section 11: time to adopt skills, performance over time. "You're improving fastest in [skill]." | View learning path. |
| 6 | **Activity Summary** | Total tasks completed, total submissions, total accepted, total rework cycles, active duration on platform. Section 11: availability and engagement patterns. | View task history. |

**Decision Points:**
- None -- informational display. Contributor cannot edit digital twin directly (it's computed from activity).

**Error/Edge Cases:**
- New contributor: most sections show "Not enough data yet. Complete tasks to build your digital twin."
- Declining metrics: shown factually without judgment; optional constructive guidance.

**Exit Points:**
- Navigate to tasks, skills, or learning recommendations.

**Audit:** Digital twin detail view logged: user ID, timestamp.

---

## D. TASK DISCOVERY & ASSIGNMENT

---

### D1: Task Discovery -- Browse Available Tasks

**SOW References:** Section 19.2 (task discovery), Section 3.1.5 (task discovery, assignment flows), Section 3.1.MVP.4 (matching engine recommendations)

**Entry Point:** Contributor Portal > Tasks > "Browse Tasks" or "Available Tasks".

**Pre-conditions:**
- Contributor authenticated, profile complete (skills declared), identity verified.
- Available tasks exist matching contributor's skills.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Task Discovery Page** | List/card view of available tasks matched to contributor's skills. Each task card shows: task name, project name (anonymized if confidential), required skills (chips), estimated effort (hours), task pricing (rate for this task), due date, match score ("Great match" / "Good match"). Sorted by match relevance. | Browse; filter; sort; search; click for detail. |
| 2 | **Filters** | Filter by: skill category, effort range (hours), due date range, project type, task status (open for assignment). | Apply/clear filters. |
| 3 | **Sort** | Sort by: match score (default), due date, effort, price. | Select sort option. |
| 4 | **Task Card Click** | Navigate to Task Detail View (Flow D2). | View full task detail. |

**Decision Points:**
- Step 1: Tasks displayed are pre-filtered by matching engine (Section 3.1.MVP.4) based on contributor's skills + availability + quality signals.

**Error/Edge Cases:**
- No matching tasks: "No tasks match your current skills and availability. Try updating your skills profile or check back later."
- Very many tasks: pagination; "Recommended for you" section at top with best matches.
- Confidential projects: task visible but project name anonymized; details revealed after assignment.

**Exit Points:**
- Click task -> Flow D2 (Task Detail).
- Return to Dashboard.

**Audit:** Task discovery access logged: user ID, timestamp, tasks displayed count, filters applied.

---

### D2: Task Detail View

**SOW References:** Section 3.1.MVP.5 (task workroom -- instructions, templates), Section 3.1.MVP.4 (assignment workflow), Section 3.1.MVP.6 (task pricing)

**Entry Point:** Task Discovery > click task card, OR notification "New task available".

**Pre-conditions:**
- Task exists and is available for assignment.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Task Detail Page** | Task name, description, project context (brief, anonymized if needed). Required skills with match indicator (matched/partial match/no match against contributor's profile). Estimated effort (hours). Task pricing: how much contributor will earn upon acceptance (rate card x effort -- Section 3.1.MVP.6). Due date and SLA. Acceptance criteria summary. | Read detail; accept assignment (Flow D3); decline (Flow D4); back to browse. |
| 2 | **Requirements Section** | Detailed task instructions (if visible before assignment -- may be partial until accepted). Required deliverables list. Evidence checklist preview. Templates available (if any). | Read requirements. |
| 3 | **Match Explanation** | Why this task was recommended to the contributor. Skills overlap shown. | Review match reasoning. |

**Decision Points:**
- Contributor decides: accept or decline this task assignment?

**Error/Edge Cases:**
- Task assigned to someone else while contributor is viewing: "This task is no longer available."
- Task requires skills contributor doesn't have: match indicator shows "partial match" with note "You may need [skill] for this task."
- Confidential task: limited detail until assignment accepted.

**Exit Points:**
- Accept -> Flow D3.
- Decline -> Flow D4.
- Back to browse -> Flow D1.

**Audit:** Task detail view logged: user ID, timestamp, task ID.

---

### D3: Accept Assignment Flow

**SOW References:** Section 3.1.MVP.4 (assignment workflow -- accept/decline)

**Entry Point:** Task Detail > "Accept Assignment" button.

**Pre-conditions:**
- Task available for assignment to this contributor.
- Contributor has capacity (availability allows).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Acceptance Confirmation** | "Accept this task?" Summary: task name, estimated effort, earnings upon acceptance, due date, SLA requirements. "By accepting, you commit to delivering by the due date." | Confirm accept; cancel. |
| 2 | **Assignment Created** | Task assigned to contributor. Status: "Assigned / In Progress". Full task instructions now visible. Workroom access granted. SLA timer started. Confirmation: "Task accepted! Go to your workroom to get started." | Go to Workroom (Flow E1); view task list. |

**Decision Points:**
- Step 1: Confirm? YES -> Step 2. NO -> return to task detail.

**Error/Edge Cases:**
- Task no longer available (race condition): "This task has already been assigned to another contributor."
- Contributor at capacity (too many active tasks): warning "You have X active tasks. Accepting this may affect your delivery timelines."
- SLA conflict with other tasks: warning "This task's deadline overlaps with [other task]. Ensure you can manage both."

**Exit Points:**
- Accepted -> Workroom (Flow E1).
- Cancelled -> Task Detail (Flow D2).

**Audit:** Assignment acceptance logged: user ID, task ID, timestamp, assignment ID created.

---

### D4: Decline Assignment Flow

**SOW References:** Section 3.1.MVP.4 (assignment workflow -- accept/decline)

**Entry Point:** Task Detail > "Decline" button, OR assignment notification > "Decline".

**Pre-conditions:**
- Task assignment pending contributor response.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Decline Reason** | "Why are you declining this task?" Reason options: "Not enough time", "Skills don't match", "Task description unclear", "Personal reasons", "Other" (free text). Reason is optional but encouraged. | Select reason; add comment; confirm decline. |
| 2 | **Decline Confirmed** | "Task declined." Task removed from contributor's pending list. Matching engine will recommend the task to next best candidate. | Return to task browse; view other tasks. |

**Decision Points:**
- Step 1: Reason provided? Optional but system may use for matching improvement.

**Error/Edge Cases:**
- Frequently declining tasks: system does not penalize but may adjust matching (fewer recommendations for this skill/type if consistently declined).
- Decline after SLA expiry: treated as SLA breach, not a decline.

**Exit Points:**
- Declined -> Task Discovery (Flow D1).

**Audit:** Decline logged: user ID, task ID, timestamp, reason (if provided).

---

### D5: SLA Timer Display & Notifications

**SOW References:** Section 3.1.MVP.4 (SLA timers)

**Entry Point:** Task Detail, Workroom, Dashboard -- SLA timers visible wherever active task is displayed.

**Pre-conditions:**
- Contributor has active task assignment with SLA.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **SLA Timer Display** | For each active task: countdown showing time remaining until due date. Visual indicator: Green (> 50% time remaining), Yellow (25-50%), Red (< 25%). Displayed on: Dashboard task cards, Workroom header, Task list. | View; no direct action on timer. |
| 2 | **SLA Notifications** | Automatic notifications at configurable thresholds: 50% time elapsed, 75% time elapsed, 24 hours remaining, SLA breached. Notification channels: in-app, email, SMS (per contributor preferences -- Flow K2). | View notification; navigate to task. |
| 3 | **SLA Breach** | If due date passes without submission: status changes to "SLA Breached". Alert on Dashboard. Enterprise admin notified. | Submit ASAP; contact support; request extension (if supported by policy -- Section 4.3). |

**Decision Points:**
- Notifications automatic based on configured thresholds.

**Error/Edge Cases:**
- SLA extension requested: if configured escalation rules allow (Section 4.3), contributor may request extension through support.
- Multiple tasks with overlapping SLAs: prioritized display with most urgent first.
- Timezone-related SLA confusion: all SLAs shown in contributor's local timezone.

**Exit Points:**
- Navigate to task Workroom from any SLA notification.

**Audit:** SLA events logged: task ID, threshold reached, notification sent, breach (if applicable), timestamp.

---

### D6: [Student Track] Tasks with Guardrails & Supervision

**SOW References:** Section 20.1 (project types, guardrails, and supervision models for students)

**Entry Point:** Task Discovery for student contributors -- tasks filtered to show student-appropriate tasks.

**Pre-conditions:**
- Contributor verified as student (Flow A8).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Student Task Discovery** | Same as Flow D1 but with additional filtering: tasks tagged as "student-appropriate" shown prominently. Guardrails visible: complexity level indicator, supervision model (mentor-reviewed, faculty-supervised), estimated learning value. | Browse student tasks; filter by complexity/supervision level. |
| 2 | **Task Detail -- Student View** | Same as Flow D2 plus: Guardrails section showing -- "This task is reviewed by a mentor before client acceptance" (supervision model), Complexity level (beginner/intermediate), Learning objectives (what skills this task develops), Academic recognition eligibility (if applicable -- Section 20.1). | Accept; decline; view learning objectives. |
| 3 | **Supervision Indicator** | After acceptance: workroom shows "Mentor supervision active" badge. Student knows their work will be reviewed by a mentor before reaching the client (two-stage review per Section 3.1.MVP.5). | View mentor info; access Q&A. |

**Decision Points:**
- Tasks automatically filtered for student track; student can also browse general tasks if skills match.

**Error/Edge Cases:**
- Student qualifies for advanced tasks: system allows access with note "This task is beyond typical student level. Mentor supervision will be applied."
- No student-appropriate tasks: "No student tasks available right now. Check back soon or update your skills to broaden matches."

**Exit Points:**
- Accept task -> Workroom with supervision active.
- Browse general tasks (if permitted by university partnership terms).

**Audit:** Student task discovery logged: user ID, timestamp, student flag, tasks shown, guardrails applied.

---

### D7: Reassignment Notification Flow

**SOW References:** Section 3.1.MVP.4 (reassignments)

**Entry Point:** Contributor receives notification that they've been reassigned from or to a task.

**Pre-conditions:**
- Admin or system has triggered reassignment (Enterprise Console Flow D5).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Notification** | If reassigned FROM task: "Task [name] has been reassigned. Reason: [reason if provided]. Your work-in-progress has been saved." If reassigned TO task: "You've been assigned a new task: [name]." | View task detail; acknowledge. |
| 2a | **Removed from Task** | Task removed from active tasks. Any work-in-progress preserved in submission history (versioning). No penalty applied if reassignment is admin-initiated. | Acknowledge; browse new tasks. |
| 2b | **Assigned New Task** | New task appears in active tasks. Standard accept/decline workflow (Flows D3/D4) if assignment requires acceptance. If admin override: auto-assigned. | Accept/decline (if applicable); go to Workroom. |

**Decision Points:**
- Step 2b: Does new assignment require acceptance? Depends on configuration (admin override may auto-assign).

**Error/Edge Cases:**
- Reassignment while contributor is mid-submission: work preserved; contributor notified before removal.
- Multiple reassignments: each logged and notified separately.

**Exit Points:**
- Acknowledge -> Dashboard or new task Workroom.

**Audit:** Reassignment notification logged: user ID, task ID, direction (from/to), reason, timestamp.

---

## E. TASK WORKROOM & SUBMISSION

---

### E1: Workroom -- View Instructions & Templates

**SOW References:** Section 3.1.MVP.5 (task workroom: instructions, templates, uploads, links, Q&A)

**Entry Point:** Dashboard > active task > "Go to Workroom", OR Tasks > assigned task > "Open Workroom".

**Pre-conditions:**
- Task assigned to contributor and accepted.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Workroom Landing** | Task header: name, project, SLA timer, status. Navigation tabs: Instructions, Templates, Uploads, Links, Q&A, Evidence Checklist, Submit. | Navigate between tabs. |
| 2 | **Instructions Tab** | Full task instructions: what to deliver, acceptance criteria, formatting requirements, any constraints. Structured format with sections. | Read; bookmark sections; copy text. |
| 3 | **Templates Tab** | Downloadable templates provided for the task (if any): document templates, code scaffolds, data formats. Each with: name, description, download button. | Download template; preview. |

**Decision Points:**
- None -- informational. Contributor reads before starting work.

**Error/Edge Cases:**
- No templates provided: "No templates for this task. Follow the instructions to create your deliverable."
- Instructions unclear: contributor can use Q&A tab (Flow E4) to ask questions.

**Exit Points:**
- Begin work using other workroom tabs (E2-E6).

**Audit:** Workroom access logged: user ID, task ID, timestamp, tabs accessed.

---

### E2: Workroom -- File Upload

**SOW References:** Section 3.1.MVP.5 (task workroom: uploads)

**Entry Point:** Workroom > Uploads tab.

**Pre-conditions:**
- Contributor is working on an assigned task.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Uploads Area** | Drag-and-drop zone + file browser button. List of previously uploaded files (if any). Accepted formats and size limits displayed. | Drag file; click to browse; upload. |
| 2 | **Upload Progress** | Progress bar per file. File name, size, format validation. | Cancel upload; upload another. |
| 3 | **Uploaded Files List** | All uploaded files: name, size, date, format icon. Preview available for supported formats. | Preview; download; delete; rename; add description. |

**Decision Points:**
- Files uploaded here are work-in-progress. They become part of submission when contributor submits (Flow E6).

**Error/Edge Cases:**
- Wrong format: "This file format is not accepted. Supported formats: [list]."
- File too large: "File exceeds maximum size. Please compress or split."
- Upload interrupted: partial upload detected; retry option.
- Storage quota: "You've reached the upload limit for this task. Remove files or contact support."

**Exit Points:**
- Files uploaded -> continue working or proceed to submission (Flow E6).

**Audit:** File upload logged: user ID, task ID, file name, file hash, size, timestamp.

---

### E3: Workroom -- Links & References

**SOW References:** Section 3.1.MVP.5 (task workroom: links)

**Entry Point:** Workroom > Links tab.

**Pre-conditions:**
- Task assigned.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Links Section** | Two subsections: "Reference Links" (provided by task creator/project -- read-only) and "Your Links" (contributor can add). Reference links: documentation, design specs, API endpoints, etc. | View reference links; add own links. |
| 2 | **Add Link** | Form: URL, title/description, link type (GitHub repo, portfolio, documentation, other). | Paste URL; add description; save. |
| 3 | **Links List** | All links displayed: reference links (locked icon) and contributor links (editable). | Click to open link; edit/delete own links. |

**Decision Points:**
- None significant.

**Error/Edge Cases:**
- Invalid URL: "This URL doesn't appear valid."
- Link no longer accessible: contributor responsibility; platform doesn't validate link availability.

**Exit Points:**
- Links managed -> continue working.

**Audit:** Link additions logged: user ID, task ID, URL, timestamp.

---

### E4: Workroom -- Q&A / Contributor Support Assistant

**SOW References:** Section 3.1.MVP.7 (Contributor Support Assistant -- guided help inside workroom), Section 3.1.MVP.5 (task workroom: Q&A)

**Entry Point:** Workroom > Q&A tab, OR "Ask AI" button (always visible in workroom).

**Pre-conditions:**
- Task assigned. Contributor Support Assistant available.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Q&A Interface** | Chat-style interface. Two sections: "Ask AI Assistant" (Contributor Support Assistant) and "Questions to Project Team" (human Q&A thread). | Type question; select recipient (AI or human). |
| 2 | **AI Assistant Interaction** | Contributor types question. AI Contributor Support Assistant responds with: task-specific guidance (drawing from instructions, templates, acceptance criteria), general platform help, submission tips. AI responses marked with "AI Assistant" badge. | Ask follow-up; rate response (helpful/not helpful). |
| 3 | **Human Q&A** | If contributor needs human help: question posted to Q&A thread visible to project team/mentor. Notification sent. Previous Q&A history visible. | Post question; view responses; follow up. |
| 4 | **Q&A History** | All Q&A exchanges (AI and human) preserved for task duration. Searchable. | Search history; reference previous answers. |

**Decision Points:**
- Step 1: Ask AI or ask human? Contributor chooses. AI for instant help; human for task-specific clarification.

**Error/Edge Cases:**
- AI cannot answer: "I'm not sure about that. Consider posting to the Q&A thread for human help."
- No response from human Q&A within reasonable time: contributor can escalate or continue working.
- AI provides incorrect guidance: rate as "not helpful"; feedback used to improve (Section 7.5 -- AI governance).

**Exit Points:**
- Answer received -> continue working.
- Escalate -> Support (Flow J1).

**Audit:** Q&A interactions logged: user ID, task ID, question, response, source (AI/human), timestamp.

---

### E5: Evidence Checklist Completion

**SOW References:** Section 3.1.MVP.5 (submission: evidence checklist)

**Entry Point:** Workroom > Evidence Checklist tab.

**Pre-conditions:**
- Task has an evidence checklist defined (configured by admin -- Enterprise Console Flow H7 rubrics).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Checklist View** | List of evidence items required for submission. Each item: description, required (yes/no), status (complete/incomplete). Progress indicator: "X of Y items complete." | Check off items; add evidence per item. |
| 2 | **Item Detail** | For each checklist item: what's required, how to provide it (upload file, enter text, paste link), acceptance criteria for this item. | Provide evidence (upload/text/link); mark complete. |
| 3 | **Completion Status** | Visual progress: items completed vs. remaining. All required items must be complete before submission. | Complete remaining items; proceed to submit (Flow E6). |

**Decision Points:**
- All required items complete? YES -> can submit. NO -> "Complete all required items before submitting."

**Error/Edge Cases:**
- No checklist defined: submission proceeds without checklist (task may only require file upload).
- Checklist item unclear: use Q&A (Flow E4) to clarify.
- Partial completion saved: contributor can return to checklist at any time.

**Exit Points:**
- All items complete -> Flow E6 (Submission).
- In progress -> save and return later.

**Audit:** Checklist completion logged: user ID, task ID, items completed, timestamps per item.

---

### E6: Submission Flow (file upload + structured responses + evidence)

**SOW References:** Section 3.1.MVP.5 (submission: file upload + structured responses + evidence checklist)

**Entry Point:** Workroom > "Submit" tab or "Submit Deliverable" button.

**Pre-conditions:**
- Task assigned and work completed.
- Required evidence checklist items completed (if checklist exists).
- At least one file uploaded or structured response provided.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Submission Review** | Pre-submission checklist: Uploaded files (list with size/format), Structured responses (if task requires -- form answers), Evidence checklist status (complete/incomplete), Links provided. Validation: all required items present? | Review; add missing items; proceed to submit. |
| 2 | **Structured Responses** | If task requires structured answers (e.g., "Describe your approach", "List tools used"): form fields to fill. | Fill responses; save draft. |
| 3 | **Final Confirmation** | "Submit your deliverable for review?" Summary of what will be submitted. Warning: "Once submitted, you cannot edit until review is complete (unless rework is requested)." | Confirm submit; cancel (continue editing). |
| 4 | **Submission Complete** | "Deliverable submitted! Your submission is now pending review." Task status changes to "Submitted". SLA timer paused (contributor's part done). Reviewer notified. Submission ID generated. | View submission status (Flow F1); return to Dashboard. |

**Decision Points:**
- Step 1: All required items present? YES -> can submit. NO -> must complete missing items.
- Step 3: Confirm? YES -> submit. NO -> continue editing.

**Error/Edge Cases:**
- Accidental submission (incomplete work): cannot undo, but rework cycle allows revision.
- Large file upload slow: progress indicator; submission not finalized until all uploads complete.
- Network failure during submission: system detects and prompts retry; draft preserved.
- Evidence checklist incomplete: submission blocked with message "Complete all required evidence checklist items."

**Exit Points:**
- Submitted -> Flow F1 (Submission Status).
- Cancelled -> return to Workroom.

**Audit:** Submission logged immutably (Section 3.1.MVP.8): user ID, task ID, submission ID, files (hashes), responses, checklist status, timestamp.

---

### E7: Submission Confirmation & Status

**SOW References:** Section 3.1.MVP.5 (review workflow status)

**Entry Point:** After submission (Flow E6) or Tasks > submitted task.

**Pre-conditions:**
- Submission exists.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Submission Status Page** | Task name, submission ID, submitted date/time, current status: "Submitted" (waiting for review assignment), "In Review" (reviewer is evaluating), review stage (if two-stage: mentor stage / client stage). | View status; view submitted artifacts (read-only). |
| 2 | **Timeline** | Visual timeline: Submitted -> [In Review -> Decision]. Timestamps for each stage. Estimated review time (if configured). | View timeline. |
| 3 | **Notification Preferences** | "We'll notify you when a decision is made." Notification channel preferences. | Adjust notification preferences (Flow K2). |

**Decision Points:**
- None -- waiting state.

**Error/Edge Cases:**
- Review taking longer than expected: "Your submission is still being reviewed. Average review time for this task type is [X]."
- Reviewer assigned but no decision yet: status shows "In Review" with reviewer-anonymized info.

**Exit Points:**
- Decision received -> Flow F1 (status update) or F2 (feedback view) or F5 (acceptance notification).
- Return to Dashboard.

**Audit:** Status check logged: user ID, task ID, timestamp.

---

### E8: [Women Track] Mobile-Optimized Workroom Experience

**SOW References:** Section 3.1.5 (mobile-responsive web UX as baseline), Section 20.2 (accessible UX, remote-first task models)

**Entry Point:** Same as Flow E1 but accessed from mobile device (Android smartphone -- as per Fatima persona).

**Pre-conditions:**
- Contributor accessing workroom from mobile device.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Mobile Workroom** | Same content as desktop workroom but optimized layout: single-column, larger touch targets, simplified navigation (tabs become vertical sections or swipeable panels). | Navigate sections; all functionality preserved. |
| 2 | **Mobile File Upload** | Camera integration: "Take Photo" option alongside file upload. Useful for uploading handwritten work, whiteboard photos, etc. | Take photo; upload from gallery; upload from files. |
| 3 | **Mobile Q&A** | Chat interface optimized for mobile: full-screen chat, voice-to-text input option. AI Contributor Support Assistant available. | Type or voice input; ask AI; post question. |
| 4 | **Mobile Submission** | Streamlined submission: large "Submit" button, clear status indicators, simplified review of attached items. | Review; submit; confirm. |

**Decision Points:**
- Mobile vs. desktop: automatic responsive detection. Same functionality, different layout.

**Error/Edge Cases:**
- Slow network: progressive loading; offline draft saving.
- Small screen: critical information prioritized; secondary info available via expand/scroll.
- File upload from phone storage: clear path to photos, downloads, and document folders.

**Exit Points:**
- Same as desktop workroom flows.

**Audit:** Mobile access logged: user ID, task ID, device type, timestamp.

---

## F. REVIEW STATUS & REWORK

---

### F1: Submission Status Tracking

**SOW References:** Section 3.1.MVP.5 (review workflow: acceptance decision, rework loop)

**Entry Point:** Tasks > submitted task, OR Dashboard > active task card, OR notification.

**Pre-conditions:**
- Submission exists (Flow E6 completed).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Status View** | Current status prominently displayed: Submitted (blue), In Review (yellow), Accepted (green), Rework Requested (orange), Rejected (red). Status change history with timestamps. | View status; view submitted artifacts. |
| 2 | **Status Details** | Per status: Submitted -- "Waiting for reviewer assignment." In Review -- "Being reviewed by [role]." Accepted -- "Congratulations! Your work has been accepted." Rework -- "Changes requested. See feedback below." Rejected -- "Submission not accepted. See reasons below." | Navigate to appropriate action per status. |

**Decision Points:**
- Status drives available actions: Accepted -> earnings (Flow G1). Rework -> view feedback (Flow F3). Rejected -> review reasons.

**Error/Edge Cases:**
- Status stuck in "Submitted" for too long: "Your submission is in the review queue. We'll notify you when it's picked up."

**Exit Points:**
- Accepted -> Flow F5 (Acceptance Notification) then Flow G1 (Earnings).
- Rework -> Flow F3 (Rework Request).
- Rejected -> support or browse new tasks.

**Audit:** Status views logged: user ID, task ID, timestamp.

---

### F2: Review Feedback View

**SOW References:** Section 3.1.MVP.5 (acceptance decision with reasons), Section 3.1.5 (visibility into contributor progress)

**Entry Point:** Submission Status > "View Feedback" (available after review decision).

**Pre-conditions:**
- Review decision made (accept, rework, or reject).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Feedback Page** | Reviewer's feedback: overall decision, rubric scores (if rubric used), detailed comments per criterion, general feedback text. Reviewer identity anonymized (shown as "Reviewer" or "Mentor"). | Read feedback; view rubric scores. |
| 2 | **Rubric Scores** | If rubric used: each criterion with score, weight, and reviewer's notes. Total score. | View scores; compare to passing threshold. |
| 3 | **Constructive Guidance** | "Areas of strength" and "Areas for improvement" sections (from reviewer feedback). | Read; use for improvement. |

**Decision Points:**
- If rework: contributor uses feedback to improve (Flow F3).
- If accepted: feedback is for learning; view and move on.

**Error/Edge Cases:**
- No detailed feedback (reviewer only selected accept/reject without comments): "No detailed feedback provided."
- Feedback seems unfair: contributor can access grievance redressal (Flow J2).

**Exit Points:**
- Rework -> Flow F3.
- Accepted -> Dashboard.
- Dispute -> Flow J2.

**Audit:** Feedback view logged: user ID, task ID, timestamp.

---

### F3: Rework Request -- View Feedback & Reasons

**SOW References:** Section 3.1.MVP.5 (rework loop with versioning)

**Entry Point:** Submission Status > status = "Rework Requested" > "View Rework Request".

**Pre-conditions:**
- Rework requested by reviewer or enterprise (Enterprise Console Flow F2).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Rework Request Detail** | Rework reason (from reviewer), specific feedback on what needs to change, updated acceptance criteria (if modified), deadline for rework submission, rework iteration number (1st rework, 2nd rework, etc.). | Read feedback; view original submission; start rework. |
| 2 | **Original Submission Reference** | Side-by-side or linked view: original submission artifacts alongside rework feedback. Highlights what specifically needs changing. | View original; download original files. |
| 3 | **Rework Workroom** | Workroom reopens for editing. Previous submission preserved. Contributor can upload new files, edit responses, update evidence checklist. "Rework" badge visible. | Upload new files; edit responses; submit rework (Flow F4). |

**Decision Points:**
- Contributor understands feedback and can act on it? YES -> proceed with rework. NO -> ask Q&A (Flow E4) or contact support.

**Error/Edge Cases:**
- Unclear rework feedback: use Q&A to ask for clarification.
- Rework deadline too tight: request extension via support (if policy allows -- Section 4.3).
- Contributor disagrees with rework decision: grievance redressal (Flow J2).

**Exit Points:**
- Begin rework -> Workroom (Flow E1-E6 cycle).
- Submit rework -> Flow F4.
- Dispute -> Flow J2.

**Audit:** Rework request view logged: user ID, task ID, rework iteration, timestamp.

---

### F4: Rework Submission (versioned resubmission)

**SOW References:** Section 3.1.MVP.5 (rework loop with versioning)

**Entry Point:** Rework Workroom > "Submit Rework" button.

**Pre-conditions:**
- Rework changes made. Evidence checklist re-completed.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Rework Submission Review** | Same as Flow E6 but marked as rework: "Rework Submission (Version 2)". Shows what changed from original. Summary of addressed feedback points. | Review changes; submit. |
| 2 | **Version Comparison** | Optional: contributor can view diff between original and rework submission. | View comparison; proceed. |
| 3 | **Submit Rework** | "Submit rework for review?" Confirmation. | Confirm; cancel. |
| 4 | **Rework Submitted** | Status changes to "Submitted (Rework v2)". Same review cycle begins again. Reviewer sees both versions for comparison. | View status; return to Dashboard. |

**Decision Points:**
- Step 3: Confirm? YES -> submitted. NO -> continue editing.

**Error/Edge Cases:**
- Rework submission identical to original: system doesn't prevent but reviewer will notice.
- Maximum rework cycles reached: system may flag for escalation per governance policy.

**Exit Points:**
- Submitted -> Flow F1 (status tracking).

**Audit:** Rework submission logged: user ID, task ID, submission version, files (hashes), timestamp.

---

### F5: Acceptance Notification

**SOW References:** Section 3.1.MVP.5 (acceptance decision), Section 3.1.MVP.6 (payout eligibility upon acceptance)

**Entry Point:** Notification received when task is accepted.

**Pre-conditions:**
- Reviewer/enterprise accepted the submission.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Acceptance Notification** | Prominent notification: "Your work on [task name] has been accepted!" Earnings amount confirmed. Credential added to wallet (if applicable). | View earnings; view credential; view feedback; dismiss. |
| 2 | **Earnings Update** | Earnings view updated: this task's payout amount added to "Eligible" payouts. | View Earnings (Flow G1). |
| 3 | **Digital Twin Update** | Skills validated through this delivery. Reliability metrics updated. Activity counters incremented. | View Digital Twin (Flow C5). |
| 4 | **Credential** | If credential issued for this task: "New credential earned!" notification with credential detail. | View Credential Wallet (Flow H1). |

**Decision Points:**
- None -- celebratory/informational flow.

**Error/Edge Cases:**
- Acceptance without credential (not all tasks generate credentials): only earnings update shown.
- Multiple tasks accepted simultaneously: consolidated notification.

**Exit Points:**
- Earnings -> Flow G1.
- Credential -> Flow H1.
- Browse new tasks -> Flow D1.

**Audit:** Acceptance notification delivery logged: user ID, task ID, timestamp, channels (in-app/email/SMS).

---

### F6: Two-Stage Review Status (mentor stage + client stage)

**SOW References:** Section 3.1.MVP.5 (review workflow: single-stage and two-stage -- mentor/reviewer + client)

**Entry Point:** Submission Status for tasks with two-stage review.

**Pre-conditions:**
- Task configured for two-stage review (mentor/reviewer first, then client/enterprise).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Stage Indicator** | Two-stage progress bar: Stage 1: Mentor/Reviewer Review -> Stage 2: Client/Enterprise Review. Current stage highlighted. | View current stage detail. |
| 2 | **Stage 1: Mentor Review** | Status: "In Review by Mentor" or "Mentor Decision: [Accept/Rework/Reject]". If mentor accepts: moves to Stage 2. If mentor requests rework: contributor revises before Stage 2. | View mentor feedback (if available); proceed to rework if needed. |
| 3 | **Stage 2: Client Review** | Status: "In Review by Client" or "Client Decision: [Accept/Rework/Reject]". Final decision. | View client feedback; proceed based on decision. |
| 4 | **Final Decision** | Accepted by both stages -> payout triggered. Rework at either stage -> rework loop. Rejected -> task closed. | View final status; navigate to earnings or rework. |

**Decision Points:**
- Mentor accepts but client requests rework: contributor must rework (both stages must accept).
- Mentor rejects: does not proceed to client stage.

**Error/Edge Cases:**
- Long review at either stage: SLA tracking shows which stage is pending.
- Conflicting feedback between stages: contributor receives feedback from both for comprehensive guidance.

**Exit Points:**
- Accepted -> Flow F5 then Flow G1.
- Rework -> Flow F3.
- Rejected -> browse new tasks.

**Audit:** Each stage transition logged: task ID, stage, reviewer role, decision, timestamp.

---

## G. EARNINGS & PAYOUTS

---

### G1: Earnings Overview

**SOW References:** Section 3.1.5 (earnings and payout view), Section 3.1.MVP.6 (payout eligibility upon acceptance; basic wallet ledger)

**Entry Point:** Contributor Portal > Earnings, OR Dashboard > Earnings summary card.

**Pre-conditions:**
- Contributor authenticated.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Earnings Dashboard** | Summary cards: Total earned (all time), Eligible for payout (accepted but not yet paid), Pending (in review -- not yet eligible), Paid out (completed payouts). Currency displayed in contributor's local currency. | View each category; filter by date range. |
| 2 | **Earnings List** | Table of earnings: task name, project, amount, currency, status (Eligible / Pending / Paid), acceptance date, payout date (if paid). | Sort by date/amount/status; click for detail (Flow G4). |
| 3 | **Earnings Chart** | Visual: earnings over time (monthly bar chart), cumulative earnings line chart. | Change time period; filter by project. |

**Decision Points:**
- None -- informational display.

**Error/Edge Cases:**
- No earnings yet: "Complete and get your first task accepted to start earning!"
- Payout delayed: status shows "Eligible" with note "Payouts are processed according to the payout schedule."

**Exit Points:**
- Payout status -> Flow G2.
- Task detail -> Flow G4.

**Audit:** Earnings view logged: user ID, timestamp.

---

### G2: Payout Status View

**SOW References:** Section 3.1.MVP.6 (payout eligibility, basic wallet ledger)

**Entry Point:** Earnings > "Payout Status" tab.

**Pre-conditions:**
- Contributor has payout-eligible earnings.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Payout Status** | Current payout status: Next payout date (scheduled), Amount eligible for next payout, Payout method configured (or "Set up payout method" prompt). Wallet balance (internal ledger -- Section 3.1.MVP.6). | View; set up payout method. |
| 2 | **Payout Method** | If not configured: prompt to set up payout method (bank transfer, mobile money, etc. -- platform supports per-geography methods -- Section 20.2). If configured: method summary (last 4 digits, method type). | Add/change payout method; verify. |
| 3 | **Payout Processing** | When payout initiates: status changes through Processing -> Completed -> (or Failed). Estimated processing time. | View status; contact support if failed. |

**Decision Points:**
- Payout method configured? YES -> payouts processed automatically. NO -> must configure before payout.

**Error/Edge Cases:**
- Payout method verification required: "Please verify your payout method before we can send payments."
- Payout failed: "Payout failed. Reason: [reason]. Please update your payout method or contact support."
- Minimum payout threshold: "Earnings below [amount] will be included in the next payout cycle."

**Exit Points:**
- Payout method setup -> verification flow.
- Payout history -> Flow G3.

**Audit:** Payout status views and method changes logged: user ID, timestamp, action.

---

### G3: Payout History

**SOW References:** Section 3.1.5 (history of contributions), Section 3.1.MVP.6 (basic wallet ledger)

**Entry Point:** Earnings > "Payout History" tab.

**Pre-conditions:**
- At least one payout completed.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Payout History List** | Table: payout ID, date, amount, currency, method, status (Completed / Failed / Reversed), tasks included (count). | Sort by date; filter by status; click for detail. |
| 2 | **Payout Detail** | Breakdown: tasks included in this payout (list), amount per task, deductions (if any -- platform fees), net amount, payout method, transaction reference. | View detail; download receipt (PDF). |

**Decision Points:**
- None -- historical record.

**Error/Edge Cases:**
- No payout history: "No payouts yet. Earnings become eligible for payout when tasks are accepted."
- Payout reversal: shown with reason and adjusted balance.

**Exit Points:**
- Download receipt -> PDF file.
- Return to Earnings.

**Audit:** Payout history access logged: user ID, timestamp.

---

### G4: Task-Level Earnings Breakdown

**SOW References:** Section 3.1.MVP.6 (task pricing = rate card x effort), Section 9.5 (transparent financial ledgers for task-level pricing)

**Entry Point:** Earnings > click specific task earning row.

**Pre-conditions:**
- Task has been accepted and earnings calculated.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Earnings Detail** | Task name, project, acceptance date. Pricing breakdown: rate card applied, rate per unit, effort units, gross amount = rate x effort. Deductions: platform fee (if applicable), tax withholding (if applicable). Net earnings. Payout status. | View breakdown; view task detail. |

**Decision Points:**
- None -- informational.

**Error/Edge Cases:**
- Pricing dispute: "If you believe this pricing is incorrect, contact support."
- Bonus applied: shown as separate line item "Quality bonus" or "Early delivery bonus" (Section 9.3).

**Exit Points:**
- Return to Earnings.
- Navigate to task.

**Audit:** Earnings detail view logged: user ID, task ID, timestamp.

---

### G5: [Women Track] Financial Inclusion / Local Payout Methods

**SOW References:** Section 20.2 (payment and financial inclusion mechanisms tailored to local contexts)

**Entry Point:** Earnings > Payout Method setup (for women track contributors).

**Pre-conditions:**
- Contributor is women workforce track participant in a geography requiring alternative payout methods.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Payout Method Selection** | Available methods based on contributor's region: bank transfer, mobile money (e.g., JazzCash, EasyPaisa for Pakistan -- Section 20.2), mobile wallet, prepaid card. Each method: name, processing time, minimum amount, fees (if any). | Select method; proceed to setup. |
| 2 | **Method Setup** | Fields based on selected method: bank transfer (account number, IBAN, bank name), mobile money (phone number, provider), etc. Verification required (SMS code to registered phone). | Enter details; verify; save. |
| 3 | **Verification** | Method verified. Test transaction (small amount) to confirm details. "Your payout method is set up. You'll receive payouts through [method]." | Confirm; change method. |

**Decision Points:**
- Step 1: Which payout method? Based on regional availability and contributor preference.

**Error/Edge Cases:**
- No local methods available: fallback to bank transfer; message "We're working on adding more payout options for your region."
- Verification failure: "Could not verify this account/number. Please check details and retry."
- Shared bank account: system allows (common in some contexts per Section 20.2) with appropriate consent.

**Exit Points:**
- Method configured -> payouts will use this method.
- Return to Earnings.

**Audit:** Payout method setup logged: user ID, timestamp, method type, verification status.

---

## H. CREDENTIAL WALLET

---

### H1: Credentials List View

**SOW References:** Section 19.2 (credential wallet), Section 3.1.5 (credential wallet, history of contributions)

**Entry Point:** Contributor Portal > Credentials.

**Pre-conditions:**
- Contributor authenticated.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Credentials List** | List/card view of all earned credentials. Each credential: title (derived from task/project), skills validated, date earned, issuing context (project name, enterprise -- anonymized if confidential). Badge/certificate visual. | Click for detail (Flow H2); filter by skill/date. |
| 2 | **Summary Stats** | Total credentials earned, skills validated through credentials, most recent credential. | View stats. |

**Decision Points:**
- None -- informational.

**Error/Edge Cases:**
- No credentials: "Complete tasks to earn credentials. Each accepted deliverable validates your skills."
- Credential for confidential project: credential exists but project details anonymized.

**Exit Points:**
- Click credential -> Flow H2 (Detail).
- Return to Dashboard.

**Audit:** Credential wallet access logged: user ID, timestamp.

---

### H2: Credential Detail View

**SOW References:** Section 19.2 (credential wallet)

**Entry Point:** Credentials List > click credential.

**Pre-conditions:**
- Credential exists.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Credential Detail** | Credential title, description of work completed, skills validated (list), proficiency level demonstrated, date issued, issuing context (project/enterprise -- anonymized if needed). Acceptance record reference (immutable -- Section 3.1.MVP.8). | View; share (if supported); download certificate (PDF). |
| 2 | **Skills Validated** | Skills this credential validates, linked to contributor's digital twin. Shows how this credential contributed to skill proficiency. | View linked skills. |
| 3 | **Certificate Download** | Downloadable PDF certificate with: credential title, contributor name, skills, date, platform verification reference. | Download PDF. |

**Decision Points:**
- None -- informational.

**Error/Edge Cases:**
- Credential for revoked acceptance (rare): "This credential has been revoked" with reason.

**Exit Points:**
- Download certificate.
- Return to Credentials List.

**Audit:** Credential detail view logged: user ID, credential ID, timestamp, download action.

---

### H3: [Student Track] Academic Recognition Mapping

**SOW References:** Section 20.1 (academic recognition mapping where applicable)

**Entry Point:** Credential Detail > "Academic Recognition" section (visible for student contributors).

**Pre-conditions:**
- Student contributor with earned credentials.
- University partnership includes academic recognition mapping.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Academic Mapping** | How this credential maps to academic requirements: course equivalence (if mapped by university), credit-hours equivalent (if agreed), portfolio evidence for academic assessment, faculty verification status. | View mapping; download academic portfolio. |
| 2 | **Academic Portfolio Export** | Generate academic portfolio document: list of completed tasks, credentials earned, skills validated, hours contributed, mentor feedback summary. Formatted for university submission. | Generate portfolio; download PDF. |
| 3 | **Share with University** | If university integration exists: "Share credentials with [University Name]". Consent required: "Do you want to share these credentials with your university?" | Consent to share; select which credentials; submit. |

**Decision Points:**
- Step 3: Consent to share? YES -> credentials shared. NO -> kept private.

**Error/Edge Cases:**
- University doesn't have recognition mapping: "Academic recognition is not yet configured for your university. Contact your program coordinator."
- No credentials to map: "Earn credentials by completing tasks to build your academic portfolio."

**Exit Points:**
- Portfolio downloaded.
- Credentials shared with university.

**Audit:** Academic mapping access and sharing logged: user ID, timestamp, credentials shared, university.

---

## I. LEARNING & DEVELOPMENT

---

### I1: Learning Recommendations (next tasks/skills)

**SOW References:** Section 19.2 (learning recommendations), Section 3.1.5 (learning recommendations)

**Entry Point:** Contributor Portal > Learning, OR Dashboard > "Recommended for You" section.

**Pre-conditions:**
- Contributor has profile with skills.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Recommendations Page** | Two sections: "Recommended Tasks" (tasks that would develop new skills or strengthen existing ones) and "Recommended Skills" (skills to add based on adjacent/complementary skills in the taxonomy). | View recommendations; browse tasks; add skills. |
| 2 | **Task Recommendations** | Tasks selected to match contributor's growth trajectory: slightly above current skill level, in areas of demonstrated interest, building toward in-demand skills. Each with: task name, skills developed, learning value indicator. | View task detail (Flow D2); accept. |
| 3 | **Skill Recommendations** | Skills that complement contributor's existing profile: "Based on your [existing skill], consider learning [recommended skill]." Demand indicator: how many tasks require this skill. | Add skill to profile; browse tasks requiring this skill. |

**Decision Points:**
- Which recommendations to follow: contributor chooses.

**Error/Edge Cases:**
- New contributor with few skills: broader recommendations; "Complete a few tasks to get personalized recommendations."
- All recommendations declined/not relevant: "Tell us what you want to learn" free-text input for future recommendation tuning.

**Exit Points:**
- Task detail -> Flow D2.
- Add skill -> Flow C3.

**Audit:** Recommendations view logged: user ID, timestamp, recommendations shown, actions taken.

---

### I2: [Women Track] Upskilling Pathways & Mentorship

**SOW References:** Section 20.2 (mentorship, community support, upskilling pathways)

**Entry Point:** Learning > "Upskilling Pathways" section (highlighted for women track contributors).

**Pre-conditions:**
- Women workforce track contributor.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Upskilling Pathways** | Structured learning pathways: sequences of tasks that progressively build skills. Each pathway: title (e.g., "Frontend Development Path"), skills covered, tasks in sequence, estimated time, progress (% complete). | View pathway; enroll; continue pathway. |
| 2 | **Pathway Detail** | Steps in the pathway: each step is a task type with required skills and skills gained. Current position in pathway. Next recommended task. | Start next step; view completed steps; view earned credentials from pathway. |
| 3 | **Mentorship Access** | "Connect with a mentor" option. Mentor matching based on skills and track. Available mentorship sessions. Previous mentor interactions. | Request mentorship session; view available mentors (anonymized); schedule session. |
| 4 | **Mentor Session** | Session detail: mentor expertise areas, session format (chat/video), scheduled time, topic. | Join session; reschedule; cancel. |

**Decision Points:**
- Step 1: Which pathway to follow? Contributor selects based on interest and goals.
- Step 3: Request mentorship? Optional but encouraged.

**Error/Edge Cases:**
- No pathways defined: "We're building upskilling pathways. In the meantime, browse available tasks to build skills."
- No mentors available: "Mentor availability is limited. We'll notify you when a mentor is available."
- Pathway task not currently available: "The next task in your pathway isn't available right now. Continue with other tasks or check back soon."

**Exit Points:**
- Start task from pathway -> Flow D2.
- Mentorship session -> session interface.

**Audit:** Upskilling pathway enrollment and mentorship requests logged: user ID, timestamp, pathway ID, mentor request.

---

## J. SUPPORT & SAFETY

---

### J1: Support Channels Access

**SOW References:** Section 20.3 (support channels), Section 3.1.MVP.7 (Contributor Support Assistant)

**Entry Point:** Contributor Portal > Support, OR help icon (always visible in navigation).

**Pre-conditions:**
- Contributor authenticated.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Support Hub** | Available support channels: AI Assistant (Contributor Support Assistant -- Section 3.1.MVP.7), Help center / FAQ, Submit support ticket, Emergency contact (for safety issues). | Select channel. |
| 2 | **AI Assistant** | Chat interface with Contributor Support Assistant. Can help with: platform usage questions, task guidance, submission tips, navigation help. | Ask question; get instant response. |
| 3 | **Support Ticket** | Form: subject, category (Technical issue / Account issue / Task question / Payment issue / Safety concern), description, priority, attachments. | Fill form; submit ticket; view existing tickets. |
| 4 | **Ticket Status** | After submission: ticket ID, status (Open / In Progress / Resolved), expected response time. | View updates; add comments; close resolved ticket. |

**Decision Points:**
- Step 1: Which channel? AI for instant help; ticket for complex issues; emergency for safety.

**Error/Edge Cases:**
- AI cannot resolve: "I recommend submitting a support ticket for this issue." Link to ticket form.
- Urgent safety concern: immediate routing to safety team (see Flow J4).

**Exit Points:**
- Issue resolved -> return to portal.
- Ticket submitted -> wait for resolution.

**Audit:** Support interactions logged: user ID, timestamp, channel, topic (not content for privacy).

---

### J2: Grievance Redressal Flow

**SOW References:** Section 20.3 (grievance redressal mechanisms)

**Entry Point:** Support > "File a Grievance", OR Settings > "Grievance Redressal".

**Pre-conditions:**
- Contributor has a grievance (unfair treatment, review dispute, payment dispute, etc.).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Grievance Form** | Category: Review decision dispute, Payment dispute, Unfair treatment, Accessibility issue, Other. Description (detailed text field). Related task/project (optional link). Evidence/documentation upload. Confidentiality preference: "Keep my identity anonymous to the other party." | Fill form; attach evidence; set confidentiality; submit. |
| 2 | **Confirmation** | "Grievance submitted. Reference: [ID]. Expected response time: [X business days]. Your grievance will be reviewed by an independent team." | View status; add additional information. |
| 3 | **Resolution Process** | Status updates: Submitted -> Under Review -> Investigation -> Resolution. Contributor notified at each stage. Resolution may include: decision reversal, compensation, policy clarification, mediation. | View updates; accept resolution; appeal (if not satisfied). |
| 4 | **Resolution** | Final resolution communicated with explanation. If accepted: grievance closed. If not accepted: appeal option within [X] days. | Accept; appeal; close. |

**Decision Points:**
- Step 3: Resolution satisfactory? YES -> close. NO -> appeal.

**Error/Edge Cases:**
- Grievance against platform itself: routed to governance team.
- Multiple grievances for same issue: system links related grievances.
- Anonymous grievance: supported per confidentiality preference.

**Exit Points:**
- Resolution accepted -> grievance closed.
- Appeal -> escalated review.

**Audit:** Grievance lifecycle logged (confidentially): grievance ID, category, status changes, resolution, timestamps.

---

### J3: [Women Track] Community Support & Mentorship Access

**SOW References:** Section 20.2 (mentorship, community support)

**Entry Point:** Dashboard > Community Support widget (women track), OR Support > Community.

**Pre-conditions:**
- Women workforce track contributor.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Community Hub** | Access to: Peer community space (discussion forums/groups for women contributors), Mentor directory (anonymized), Upcoming community events/sessions, Resources (guides, tips, success stories). | Browse community; connect with mentor; join event. |
| 2 | **Peer Community** | Discussion threads organized by topic: getting started, task tips, technical help, work-life balance. Privacy-first: no real names required, avatar-based profiles. | Read; post; reply; like. |
| 3 | **Mentor Connection** | Request one-on-one mentorship: match based on skills and availability. Mentor profiles (anonymized): expertise areas, availability, rating. | Request mentor; schedule session. |

**Decision Points:**
- Which community resource to access: contributor chooses.

**Error/Edge Cases:**
- No community content yet (early platform): seed content with platform-provided resources.
- Inappropriate content in community: reporting mechanism; moderated by support team (Section 20.3).

**Exit Points:**
- Community engagement -> return to portal.
- Mentor session -> mentorship interface.

**Audit:** Community access logged (anonymized): interaction type, timestamp. Individual content not logged for privacy.

---

### J4: Safe-Work & Anti-Harassment Reporting

**SOW References:** Section 20.3 (safe-work and anti-harassment governance), Section 14.3 (code of conduct and anti-harassment policy)

**Entry Point:** Support > "Report Safety Concern", OR prominent "Safety" button in navigation (always visible).

**Pre-conditions:**
- Contributor experiencing or witnessing harassment, unsafe behavior, or policy violation.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Safety Report Form** | Category: Harassment, Threatening behavior, Inappropriate content, Discrimination, Fraud/scam, Other safety concern. Description field. Related person/task/project (optional). Evidence upload. Confidentiality: report is confidential by default. | Fill form; attach evidence; submit. |
| 2 | **Immediate Actions** | If urgent: "If you are in immediate danger, contact local authorities." Platform emergency contact displayed. Option: "Block this person from contacting me" (if applicable). | Submit report; block; contact emergency. |
| 3 | **Report Confirmation** | "Your safety report has been received. Reference: [ID]. Our safety team will review within [X hours]." "You can continue using the platform. The reported person will not be informed of the reporter's identity." | View status; add information. |
| 4 | **Investigation & Resolution** | Safety team investigates. Possible outcomes: warning to offender, suspension, permanent ban, task reassignment, additional support offered to reporter. Reporter notified of resolution (without disclosing specifics about actions against offender for privacy). | View resolution; access support resources. |

**Decision Points:**
- Step 1: Urgency level determines routing speed.
- Step 4: Resolution satisfactory? If not -> escalation to governance officers (Section 14).

**Error/Edge Cases:**
- False report: investigation determines no violation; no penalty to reporter (to encourage reporting).
- Reporter is the subject of the report: handled by impartial team.
- Cross-border implications: platform coordinates with legal/compliance.

**Exit Points:**
- Report submitted -> confirmation and follow-up.
- Resolution communicated.

**Audit:** Safety report logged confidentially: report ID, category, status, resolution. Reporter identity protected.

---

## K. SETTINGS

---

### K1: Profile Settings

**SOW References:** Section 3.1.5 (profile management)

**Entry Point:** Contributor Portal > Settings > Profile.

**Pre-conditions:**
- Contributor authenticated.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Profile Settings** | Account information: name, email (verified), phone, profile photo (optional). Password change (for non-SSO accounts). Two-factor authentication (if available). Account deactivation option. | Edit fields; change password; enable/disable 2FA; deactivate account. |
| 2 | **Save** | Changes saved with confirmation. Some changes (email) require re-verification. | Confirm changes. |

**Decision Points:**
- Email change: triggers verification flow.
- Account deactivation: confirmation required with consequences explained.

**Error/Edge Cases:**
- Active tasks during deactivation: "You have X active tasks. Complete or transfer them before deactivating."
- SSO account: password change not available (managed by IdP).

**Exit Points:**
- Settings saved -> return to Settings.

**Audit:** Profile setting changes logged: user ID, timestamp, fields changed.

---

### K2: Notification Preferences

**SOW References:** Section 3.1.5 (notification preferences implied by contributor portal functionality)

**Entry Point:** Settings > Notifications.

**Pre-conditions:**
- Contributor authenticated.

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Notification Settings** | Notification categories: Task assignments, Review decisions, SLA reminders, Payout updates, Learning recommendations, Platform announcements, Community updates. Per category: channel toggles (In-app / Email / SMS). | Toggle channels per category; set quiet hours. |
| 2 | **Quiet Hours** | "Don't send notifications during:" time range selector (e.g., 10pm - 8am local time). | Set quiet hours; save. |
| 3 | **Save** | Preferences saved. "Notifications will be delivered according to your preferences." | Confirm. |

**Decision Points:**
- Per-category and per-channel customization.

**Error/Edge Cases:**
- All notifications disabled: warning "You've turned off all notifications. You may miss important task and payment updates."
- SMS not available in region: SMS toggle disabled with note.

**Exit Points:**
- Settings saved -> return to Settings.

**Audit:** Notification preference changes logged: user ID, timestamp, categories changed.

---

### K3: Language / Locale Selection

**SOW References:** Section 3.1.5 (localization framework for multiple languages)

**Entry Point:** Settings > Language, OR initial landing page language selector (Flow A1).

**Pre-conditions:**
- Contributor authenticated (or on landing page before login).

**Step-by-step Flow:**

| Step | Screen/State | Data Displayed | Actions Available |
|------|-------------|----------------|-------------------|
| 1 | **Language Selection** | Available languages (platform-supported per localization framework): English, Urdu, Arabic, Hindi, others as configured. Current selection highlighted. Preview text in selected language. RTL layout indicator for Arabic/Urdu. | Select language; preview; save. |
| 2 | **Locale Settings** | Date format (DD/MM/YYYY vs MM/DD/YYYY), number format (1,000.00 vs 1.000,00), currency display preference. | Set locale preferences; save. |
| 3 | **Apply** | Interface immediately switches to selected language. All UI elements, labels, and system messages translated. User-generated content (task descriptions, reviews) remains in original language. | Confirm; revert if needed. |

**Decision Points:**
- Language selection affects all UI elements.

**Error/Edge Cases:**
- Incomplete translation: untranslated strings shown in English with note "Translation in progress."
- RTL layout: interface mirrors for Arabic/Urdu (Section 3.1.5 -- localization framework).
- Language change mid-task: workroom content (instructions, templates) stays in original language; only UI chrome changes.

**Exit Points:**
- Language applied -> all portal pages now in selected language.

**Audit:** Language/locale change logged: user ID, timestamp, previous language, new language.

---

## APPENDIX A: Navigation Map

```
Contributor Portal
|
|-- [Dashboard] (B1)
|   |-- Active tasks summary
|   |-- Earnings summary
|   |-- Digital twin summary (B2)
|   |-- Notifications
|   |-- [Student] Academic progress
|   |-- [Women] Community & support quick access
|
|-- [Tasks]
|   |-- Available Tasks / Browse (D1)
|   |-- Task Detail (D2)
|   |-- Active Tasks (assigned, in progress)
|   |   |-- Workroom (E1-E8)
|   |   |-- Submission (E6)
|   |-- Completed Tasks
|   |-- [Student] Student-appropriate tasks (D6)
|
|-- [Profile] (C1)
|   |-- Profile View / Edit (C2)
|   |-- Skills (C3)
|   |-- Evidence (C4)
|   |-- Digital Twin Detail (C5)
|   |-- Availability (A7)
|
|-- [Earnings] (G1)
|   |-- Earnings Overview
|   |-- Payout Status (G2)
|   |-- Payout History (G3)
|   |-- Task Earnings Detail (G4)
|   |-- [Women] Payout Methods (G5)
|
|-- [Credentials] (H1)
|   |-- Credentials List
|   |-- Credential Detail (H2)
|   |-- [Student] Academic Recognition (H3)
|
|-- [Learning] (I1)
|   |-- Recommendations
|   |-- [Women] Upskilling Pathways (I2)
|   |-- [Women] Mentorship
|
|-- [Support] (J1)
|   |-- AI Assistant
|   |-- Support Tickets
|   |-- Grievance Redressal (J2)
|   |-- [Women] Community (J3)
|   |-- Safety Reporting (J4)
|
|-- [Settings]
|   |-- Profile Settings (K1)
|   |-- Notifications (K2)
|   |-- Language / Locale (K3)
```

---

## APPENDIX B: SOW Section Cross-Reference Index

| SOW Section | Flows Referencing It |
|-------------|---------------------|
| 3.1.MVP.3 | A1, A2, A3, A4, A5, A6, C3, C4, C5 |
| 3.1.MVP.4 | D1, D2, D3, D4, D5, D6, D7 |
| 3.1.MVP.5 | D2, E1, E2, E3, E4, E5, E6, E7, F1, F2, F3, F4, F5, F6 |
| 3.1.MVP.6 | D2, G1, G2, G3, G4, G5 |
| 3.1.MVP.7 | E4, J1 |
| 3.1.MVP.8 | A1, E6, F5 |
| 3.1.5 | A1, A7, B1, C1, C2, E8, G1, H1, K2, K3 |
| 11 | B2, C5 |
| 14.3 | A4, J4 |
| 19.2 | B1, C1, D1, H1, H2, I1 |
| 20.1 | A8, D6, H3 |
| 20.2 | A9, E8, G5, I2, J3 |
| 20.3 | A6, A9, J1, J2, J3, J4 |
| 27.3 | (metrics referenced in digital twin displays) |

---

## APPENDIX C: Screen Inventory for Wireframing

### Tier 1: MVP Critical Path
1. Registration / Invite Landing (A1)
2. Profile Setup -- Skills Declaration (A5)
3. Contributor Dashboard (B1)
4. Task Discovery -- Browse (D1)
5. Task Detail (D2)
6. Task Workroom (E1-E5 combined)
7. Submission Flow (E6)
8. Submission Status / Review Feedback (F1/F2)
9. Earnings Overview (G1)

### Tier 2: Important Supporting
10. Consent Capture (A4)
11. Digital Twin Detail (C5)
12. Rework Workroom (F3/F4)
13. Payout Status (G2)
14. Credential Wallet (H1)
15. Credential Detail (H2)
16. Support Hub (J1)

### Tier 3: Segment-Specific & Settings
17. [Student] Institutional Onboarding (A8)
18. [Student] Academic Recognition (H3)
19. [Women] Flexible Scheduling Setup (A9)
20. [Women] Mobile Workroom (E8)
21. [Women] Financial Inclusion Payout Setup (G5)
22. [Women] Community Hub (J3)
23. Safety Reporting (J4)
24. Language/Locale Settings (K3)
