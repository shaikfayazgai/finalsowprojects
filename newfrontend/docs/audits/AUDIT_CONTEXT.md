# Glimmora Teams — Complete Frontend Audit & Documentation

> Source of truth: live codebase at `/Users/kavi/GlimmoraTeam-Project` (branch `Phase-1-MVP`). Every finding below cites concrete files. Status labels used throughout: **Working** (real API + persistence), **Partial** (UI + some API, but gaps), **Toast Only** (button fires a sonner toast with no real action), **Visual Only** (mock/hardcoded, no backend), **Broken** (handler missing or returns null).

---

## 1. PROJECT OVERVIEW

### What the product is
**GlimmoraTeam** ("Glimmer Teams") is an **AI‑Governed Global Workforce Platform** that mediates between large enterprises and a distributed pool of vetted contributors/reviewers/mentors. It is structured as a **multi‑portal SaaS web app** delivered as a single Next.js 16 application.

### The problem it solves
1. **Enterprise problem** — turning a written Statement of Work into a fully resourced, governed, billable delivery plan: parsing SOWs, scoring risk, decomposing into tasks/milestones, staffing them, reviewing deliverables, paying contributors, and producing audit/compliance artifacts.
2. **Contributor problem** — discoverable freelance/gig work with a verifiable digital twin (skills, evidence, credentials, learning), structured task workrooms, review loops, and predictable payouts.
3. **Reviewer/Mentor problem** — a structured queue with rubrics, SLA tracking, mentorship logs and escalations.
4. **Platform problem** — admin oversight of SOW commercial sign‑off, email templates, pricing config, audit, compliance/ESG, and analytics.

### Target users (5 roles)
| Role | Path prefix | Primary purpose |
|---|---|---|
| **Enterprise admin** | `/enterprise/*` | Buy and govern delivery |
| **Contributor** | `/contributor/*` | Find work, deliver, earn |
| **Reviewer (Mentor)** | `/mentor/*` and `/enterprise/reviewer/*` (overlap) | Review submissions, mentor |
| **Platform Admin / SuperAdmin** | `/admin/*` | Commercial sign‑off, settings, audit |
| **Public** | `/public/credentials/[shareId]` | Verify a shared credential without login |

### Major modules
1. SOW lifecycle (intake → AI/manual generation → review → 5‑stage approval → contract → kickoff → archive/versions)
2. Decomposition (WBS) and Plan approval
3. Project portfolio, Milestones, Exceptions, Monitor, Tasks
4. Review & Acceptance (deliverable evidence review)
5. Reviewer hub (review-queue, qa-inbox, task-monitor, mentoring, metrics)
6. Mentor portal (queue, mentorship, escalation, history)
7. Billing (budget, invoices, pricing, rate cards, reports, Razorpay)
8. Compliance (documents, ESG, evidence, PODL)
9. Analytics (economic, governance, reports overview)
10. Team formation
11. Contributor workspace (tasks, submissions, profile, credentials, earnings, learning, community, messages, support)
12. Multi‑step onboarding (contributor + enterprise + reviewer)
13. Auth (NextAuth v5, Google, Microsoft, credentials, OTP, MFA, recovery codes, SSO intent cookie)
14. Admin (SOW oversight, email templates, roles, settings, audit)
15. Notifications & Toasts
16. Public credential sharing

---

## 2. TECH STACK

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** App Router, React 19, TypeScript |
| Routing | File‑system based; 134 `page.tsx` files |
| State (client) | **Zustand 5** with `persist` (localStorage) — 17 stores in `src/lib/stores/` |
| Server state / cache | **TanStack Query v5** (`src/components/providers/query-provider.tsx`) — 5 min stale, 15 min GC, no refetch on focus |
| Auth | **NextAuth v5** JWT 30‑day sessions; providers: Credentials, Google, Microsoft Entra ID, custom `glimmora-oauth` (see `src/auth.ts`) |
| DB | **Prisma + PostgreSQL** — minimal schema (User, ContributorProfile only); most data lives in the external Glimmora backend |
| External API | Glimmora REST backend behind `src/lib/api/client.ts` (BASE_URL via `base-url.ts`) |
| Internal API | 60 route handlers under `src/app/api/*` — mostly proxies/light wrappers; some real (auth, email, razorpay) |
| Styling | **Tailwind CSS 4**, **Radix UI** primitives, `cn()` helper |
| Components | `src/components/ui/` (primitives), `src/components/layout/` (Sidebar, TopBar, AI chat, add‑reviewer modal), `src/components/enterprise/` |
| Animation | Framer Motion + variants in `src/lib/utils/` |
| Charts | Recharts + Gantt |
| Validation | **Zod** in `src/lib/validations/` |
| Email | Nodemailer + React Email templates in `src/emails/` |
| Payment | **Razorpay** (`/api/razorpay/create-order`, browser script) — real order create, no server webhook verification yet |
| PDF/Docs | `pdf-lib` + `mammoth` (server‑side; some client export buttons attempt this and fail) |
| Auth flows | OTP (email + phone), MFA TOTP setup, recovery codes, OAuth via custom proxy `/api/auth/oauth/authorize` + `/exchange` |
| Data source overall | **Hybrid**: real APIs for SOW, projects, contributor workspace, auth, payments, email; mock for analytics, compliance, audit, mentor, most admin pages |

---

## 3. FULL INFORMATION ARCHITECTURE

### 3.1 Roles & Landing Dashboards
| Role | Landing route | File |
|---|---|---|
| Enterprise | `/enterprise/dashboard` | `src/app/enterprise/dashboard/page.tsx` |
| Contributor | `/contributor/dashboard` | `src/app/contributor/dashboard/page.tsx` |
| Mentor | `/mentor/dashboard` | `src/app/mentor/dashboard/page.tsx` |
| Reviewer | `/enterprise/reviewer` | `src/app/enterprise/reviewer/page.tsx` |
| Admin / SuperAdmin | `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` |
| Analytics (cross‑role) | `/analytics/overview` | `src/app/analytics/overview/page.tsx` |

Role routing is centralised in `src/app/auth/redirect/page.tsx` (server) and `src/app/page.tsx` (client redirect).

### 3.2 Sidebars (from `src/lib/config/navigation.ts`)

**Enterprise sidebar:** Dashboard · SOW (Repository, Approval Pipeline) · Planning (Decomposition, Teams) · Project Monitoring (Portfolio, Exceptions) · Review & Acceptance (Evidence Review, Acceptance Logs) · Billing · Organization (Settings).

**Contributor sidebar:** Dashboard · Work (Tasks, Submissions) · Growth (Earnings) · Connect (Support, Messages) · Profile · Settings.

**Mentor sidebar:** Dashboard · Reviews (Queue, Active Review, History) · Actions (Escalations, Mentorship) · Settings.

**Reviewer sidebar (under /enterprise/reviewer):** Dashboard · Active Work (Queue, Task Monitor, Q&A, Notifications) · Records (History, Mentoring Log) · Performance (My Metrics).

**Analytics sidebar:** Overview · Dashboards (Workforce, Economic, Operational, Governance) · Tools (Report Builder, System Health) · Settings.

**Admin sidebar:** Dashboard · User Management (Roles & Permissions) · Platform (Organisations, SOW Oversight, Audit Log) · Configuration (Email Templates) · System (Health, Analytics, Settings).

> Note: several sidebar items point to pages that **do not exist** (Workforce dashboard, Operational dashboard, Report Builder, System Health, Organisations) — see §6 Confusing navigation.

### 3.3 Complete Page Index (134 pages)

#### Auth (9 pages)
| Route | Status |
|---|---|
| `/auth/login` | Working |
| `/auth/register` (contributor multi‑step) | Working |
| `/auth/register/enterprise` | Working |
| `/auth/register/reviewer` | Partial (mock submit, 1.2 s setTimeout) |
| `/auth/forgot-password` | Working |
| `/auth/reset-password` | Working |
| `/auth/mfa-setup` | Working (sessionStorage dependency) |
| `/auth/change-password` | Working (forced first login) |
| `/auth/activate` | Partial (mocked invite info, no token validation) |
| `/auth/oauth/callback` | Working |
| `/auth/redirect` | Working (server‑side role router) |

#### Shared onboarding (8 pages)
`/onboarding/verify`, `/skills`, `/evidence`, `/availability`, `/consent`, `/complete`, `/student`, `/women` — flow is page‑per‑step driven by `onboarding-store` + `contributor-phone-store`. Most pages render mock content and call into Zustand actions; the "Continue" button advances step but persistence to backend is **partial**.

#### Enterprise (77 pages, full list)
Dashboard · SOW list/detail/approve/kickoff/compare/contract/intake/blueprint/archive/versions/generate(+review)/upload (page, details, extraction-report, gap-analysis, gaps, generate, preview-confirm, report, parsed-review, review)/approval (+[sowId]) · Decomposition (list, [planId], [planId]/edit, [planId]/approve, approval) · Projects (list, [projectId], completed, exceptions, [projectId]/milestones, [projectId]/monitor, [projectId]/tasks/[taskId]) · Review (list, [deliverableId], [deliverableId]/feedback, history) · Reviewer (page, review-queue, review-queue/[reviewId], qa-inbox, task-monitor, task-monitor/[taskId], mentoring-log, my-metrics, review-history, notifications) · Billing (page, budget, history, invoices, invoices/[invoiceId], pricing, rate-cards, reports) · Compliance (documents, esg, evidence, podl) · Analytics (page, economic, governance, reports) · Audit · Profile · Settings (+security) · Team (list, [teamId], [teamId]/confirm) · Notifications · Onboarding.

#### Contributor (15 pages)
Dashboard · Tasks (list, [taskId], submissions, submissions/[submissionId]) · Profile (page, edit, digital-twin, evidence) · Credentials (list, [credentialId]) · Earnings · Learning · Community · Messages · Notifications · Support · Settings · Onboarding.

#### Mentor (8 pages)
Dashboard · Queue (list, [reviewId]) · Mentorship · Escalation · History · Profile (page, edit) · Settings.

#### Admin (7 pages)
Dashboard · SOW (list, [sowId]/approve) · Email Templates · Roles · Settings · Audit.

#### Analytics & Public & Root
`/analytics/overview`, `/public/credentials/[shareId]`, `/` (marketing landing).

### 3.4 Drawers / Modals / Popups (master list)

| Modal/Drawer | Where | Triggered from | Implementation |
|---|---|---|---|
| Delete SOW confirmation | SOW list | row kebab → Delete | **Working** — API call |
| Recently Viewed panel | SOW list | clock icon | Working |
| Add Reviewer Modal | Enterprise Settings → Team tab + multiple "invite" CTAs | "Add Reviewer" | `src/components/layout/add-reviewer-modal.tsx` — Toast Only (fires `toast.success`, no email send via SMTP from this path) |
| ActionValidationModal (Hold / Escalate) | Projects list, Project detail | Card kebab → Put on Hold / Escalate | Working — calls `useHoldProject()` mutation |
| ResumeConfirmModal | Projects list | Card kebab → Resume Project | Working — calls `useResumeProject()` |
| MilestonePaymentModal (Razorpay) | Project detail / Projects list | Milestone "Release Payment" | Partial — Razorpay script loads & order created, **no server‑side verification webhook** |
| Withdraw plan confirmation | Decomposition list | "Withdraw" CTA | Working |
| Decision confirmation (Accept/Rework/Reject) | Mentor queue detail | Decision buttons | **Toast Only** — `toast.success`, no API |
| Session notes drawer | Mentor mentorship | "Begin Session" / "Add Notes" | **Toast Only** |
| Resolve escalation drawer | Mentor escalation | "Resolve" | **Toast Only** |
| Preview registration modal | Contributor register | "Preview" | Working (visual confirmation) |
| Onboarding wizard modal | Enterprise onboarding flow | Multiple entry points | Components exist; main route `/enterprise/onboarding/page.tsx` returns `null` → **Broken** |
| SOW chat panel attach files | SOW approve | Paperclip | Working (in chat UX) |
| Rejection form (inline) | SOW approve, deliverable review | "Request Changes" | Working in SOW; partial in deliverable |
| Profile photo uploader | Enterprise profile | Camera | Partial — saves to localStorage only |
| MFA QR + recovery codes display | `/auth/mfa-setup` | Auto | Working |
| Logout dropdown | Sidebar user menu | Avatar | Working (NextAuth signOut) |
| Recently viewed (SOW) | SOW list | clock icon | Working (localStorage) |
| Notification dropdown (top bar) | Top bar bell | bell icon | Working via `useNotificationStore` |

### 3.5 Tables (and their action gaps)
| Table | Page | Sort | Filter | Search | Pagination | Bulk | Row actions |
|---|---|---|---|---|---|---|---|
| SOW list | `/enterprise/sow` | ✓ | ✓ | ✓ ⌘K | ✓ | ✗ | View / Edit / Approval / Delete |
| Admin SOW oversight | `/admin/sow` | ✓ | ✓ tabs | ✓ | ✓ | ✗ | Review / View |
| Projects (table mode) | `/enterprise/projects` | ✓ | ✓ multi-select | ✓ | ✗ (cards mode) | ✗ | Hold/Resume/Escalate (kebab) |
| Decomposition plans | `/enterprise/decomposition` | partial | ✓ | ✗ | ✗ | ✗ | Kickoff / View / Withdraw |
| Mentor Queue | `/mentor/queue` | ✓ | ✓ | ✓ | ✓ | ✗ | Click → detail |
| Mentor Mentorship | `/mentor/mentorship` | ✓ | ✓ | ✓ | ✓ | ✗ | Begin Session / Add Notes |
| Mentor Escalation | `/mentor/escalation` | ✓ | ✓ | ✓ | ✓ | ✗ | Resolve / Reassign |
| Mentor History | `/mentor/history` | ✓ | ✓ | ✓ | ✓ | ✗ | None (read‑only) |
| Contributor Tasks | `/contributor/tasks` | ✓ | ✓ | ✓ | ✓ | ✗ | Click → detail |
| Invoices | `/enterprise/billing/invoices` | partial | ✗ | ✗ | ✗ | ✗ | Click → detail |
| Team members (Settings) | `/enterprise/settings` Team tab | ✗ | ✗ | ✗ | ✗ | ✗ | Remove / Resend (Toast Only) |
| Audit log | `/enterprise/audit` | partial | ✓ | ✗ | ✗ | ✗ | Export (Toast Only) |
| Notifications list | `/enterprise/notifications`, `/contributor/notifications` | ✗ | ✓ tabs | ✗ | ✗ | partial (Mark all read) | Mark read / Dismiss |

### 3.6 Forms (master list with persistence status)
| Form | Page | Persists? | How |
|---|---|---|---|
| Login | `/auth/login` | Yes | `/api/auth/validate` + NextAuth |
| Forgot password | `/auth/forgot-password` | Yes | `/api/auth/forgot-password` |
| Reset password | `/auth/reset-password` | Yes | `/api/auth/password/change` |
| Change password | `/auth/change-password` | Yes | same |
| Contributor 4‑step registration | `/auth/register` | Yes | `registerContributor` server action + Prisma + Glimmora API |
| Enterprise 4‑step registration | `/auth/register/enterprise` | Yes | `registerEnterprise` server action |
| Reviewer activation | `/auth/register/reviewer` | **No** | setTimeout mock |
| MFA setup (TOTP code) | `/auth/mfa-setup` | Yes | `/api/auth/mfa-confirm` |
| OTP email send/verify | various | Yes | JWT‑signed cookie strategy |
| Contributor onboarding steps | `/onboarding/*` | Partial | mostly Zustand, only some commit to API |
| Contributor profile edit | `/contributor/profile/edit` | Yes | `/api/contributor/profile` (PATCH) |
| Evidence upload | `/contributor/profile/evidence` | Yes | `/api/contributor/profile/evidence` |
| Skills update | profile/edit | Yes | `/api/contributor/profile/skills` |
| Task submission | `/contributor/tasks/[taskId]` | Yes | `/api/contributor/tasks/[taskId]/submissions` |
| Resubmit | `/contributor/tasks/submissions/[submissionId]` | Yes | `/api/contributor/submissions/[submissionId]/resubmit` |
| Support ticket create | `/contributor/support` | Yes | `/api/contributor/support/tickets` |
| Grievance | support | Yes | `/api/contributor/support/grievances` |
| Safety report | support | Yes | `/api/contributor/support/safety-reports` |
| Credential share | `/contributor/credentials/[credentialId]` | Yes | `/api/contributor/credentials/[credentialId]/share` |
| Company profile | `/enterprise/settings` Company tab | Partial | hits `sowApi.updateCompanyProfile` + toast; backend wiring unclear |
| Notifications preferences | Settings → Notifications tab | **No** | local state only |
| Security: password / 2FA / sessions | `/enterprise/settings/security` | **No** | mock |
| SOW manual upload (7‑step wizard) | `/enterprise/sow/upload/*` | Partial | Zustand + sessionStorage + Glimmora API on submit |
| SOW AI generate wizard | `/enterprise/sow/generate*` | Partial | Glimmora SOW API; intermediate state in sessionStorage |
| Approval checklist + notes | SOW approve | Yes | `useApproveStage` / `useRejectStage` |
| Approval chat composer | SOW approve | Yes | `useRecordApprovalDecision` (type=comment) |
| Decomposition plan edit | `/enterprise/decomposition/[planId]/edit` | Partial | UI complete, mutations exist; save handlers patchy |
| Project hold/escalate reason | Projects | Yes | API |
| Milestone UAT sign‑off | Project detail | **No** | Toast Only |
| Deliverable feedback | `/enterprise/review/[deliverableId]/feedback` | **No** | mock |
| Mentor rubric + decision | `/mentor/queue/[reviewId]` | **No** | Toast Only |
| Mentor session notes drawer | `/mentor/mentorship` | **No** | Toast Only |
| Escalation resolve drawer | `/mentor/escalation` | **No** | Toast Only |
| Mentor profile edit | `/mentor/profile/edit` | **No** | setTimeout mock |
| Mentor settings | `/mentor/settings` | **No** | setTimeout mock |
| Add Reviewer modal | Sidebar / Settings Team / Reviewer dashboard | Partial | `/api/reviewers/invitations` exists but UI generally calls toast |
| Email template editor | `/admin/email-templates` | Partial | saves to Zustand `email-template-store` (localStorage) — not server |
| Admin platform pricing | `/admin/settings` | Yes | `/api/settings/contributor-pricing` |
| Roles | `/admin/roles` | Visual Only | — |
| Compliance documents upload | `/enterprise/compliance/documents` | **No** | form with no handler |
| ESG / Evidence / PODL | compliance/* | Visual Only | — |
| Analytics report builder | `/enterprise/analytics/reports` | Visual Only | — |

### 3.7 Toasts inventory (every place a sonner toast is fired)
The audit found toasts as the **terminal action** (no real API write) at:
- Mentor: queue detail decisions, session‑notes drawer save, escalation resolve, escalation reassign, profile edit save, settings save, file download stub.
- Enterprise: project export PDF/CSV, project "Download Report", milestone UAT sign‑off, exception management (resolve / dispute / accept / reassign / request info / escalate), settings team‑member invite (welcome email "sent"), settings company profile save (the request fires but success comes from toast not server confirmation), compliance document upload (no handler), audit log export PDF/CSV.
- Admin: settings pricing updates (these *do* call the API), settings audit/Roles/Email‑templates Save → toast.
- Auth: **zero toasts** — auth errors are surfaced only via inline `state.error` (gap — silent failures possible).
- Contributor: profile save (toast on success of real API); credentials share copy‑link (toast + clipboard); learning recommendation dismiss/mark-opened (toast + real API).

---

## 4. ROLE‑WISE FLOW EXPLANATION

### 4.1 Enterprise Admin

**Login flow:** `/auth/login` → email + password → `/api/auth/validate` → (if MFA enabled → TOTP step) → `signIn("glimmora-oauth")` → `/auth/redirect` → `/enterprise/dashboard`. SSO via Google/Microsoft uses `/api/auth/oauth/authorize` → Glimmora authorize → `/auth/oauth/callback` → `/api/auth/oauth/exchange` → session.

**Landing dashboard:** Portfolio counters, attention panel, financial snapshot, activity feed — **all visual / mock**.

**Available menus:** see §3.2.

**Main responsibilities:** Create SOW → drive 5‑stage approval (Business → Glimmora Commercial → Legal → Security → Final) → decompose into plan/tasks → form teams → monitor projects/exceptions → review deliverables → pay milestones → close out.

**Step‑by‑step journey (golden path):**
1. New SOW: `/enterprise/sow/intake` → choose AI or Manual.
2. AI: `/enterprise/sow/generate` → wizard → `/enterprise/sow/generate/review`.
3. Manual: `/enterprise/sow/upload` → details → extraction-report → parsed-review → gap-analysis → preview-confirm.
4. Submit → `/enterprise/sow/[sowId]` → `/approve` (5‑stage pipeline; admin owns the Commercial stage, enterprise owns Business).
5. Approved SOW → `/enterprise/sow/[sowId]/contract` → `/kickoff` → `/enterprise/decomposition/[planId]` → `/approve`.
6. Plan executes → `/enterprise/team` to staff → `/enterprise/projects/[projectId]` to monitor.
7. Deliverables arrive → `/enterprise/review` → approve/rework/reject.
8. Milestone met → Release Payment modal (Razorpay) → invoice in `/enterprise/billing/invoices`.

**Important CTAs:** New SOW, Submit for Approval, Approve Stage, Request Changes, Release Payment, Put on Hold/Resume, Approve Plan, Acknowledge Exception.

**Gaps:**
- Decomposition edits not all persisting.
- Razorpay payment lacks server verification.
- UAT sign‑off is toast only.
- Exceptions screen entirely toast only.
- Most analytics/compliance/audit pages mock only.
- `/enterprise/onboarding/page.tsx` returns `null` (wizard inaccessible).
- Compliance documents upload form has no handler.

### 4.2 Contributor

**Login flow:** identical NextAuth pathway; new SSO users with `isNewSsoUser=true` → `/contributor/onboarding`.

**Landing:** `/contributor/dashboard` — KPIs (earnings, tasks active, credentials), notifications, active tasks. Mostly read from real APIs.

**Journey:** browse `/contributor/tasks` → open `[taskId]` → Accept → Workroom (uploads + Q&A + checklist) → Submit → submission appears under `/contributor/tasks/submissions` → reviewer feedback → optional Resubmit → on acceptance, payout in `/contributor/earnings`. Profile → Digital twin / Evidence / Credentials grow over time. Support tickets/grievances/safety reports go through real API.

**Important CTAs:** Accept Task, Decline Task, Save Draft, Submit, Resubmit, Withdraw, Share Credential, Verify Credential, Open Ticket, Mark Recommendation Done.

**Gaps:**
- Profile edit has no "Discard changes?" confirmation → easy data loss.
- Credentials list has no rich detail page (cards are partial).
- Support ticket detail/messaging UI partial.
- Onboarding `/verify` continue button is non‑functional in some branches (still client‑side mock).
- Community page is mostly visual.

### 4.3 Mentor / Reviewer

The product has **two overlapping reviewer surfaces**: `/mentor/*` (purpose‑built mentor portal) and `/enterprise/reviewer/*` (reviewer sub‑portal embedded in enterprise shell). They share concepts (queue, history, mentoring log, metrics) but **the mentor portal is entirely mock + toast**, while the reviewer sub‑portal has partial API integration.

**Login:** same NextAuth; `role=mentor` → `/mentor/dashboard`; `role=reviewer` → `/enterprise/reviewer`.

**Journey:** Land on queue → pick item → review rubric (5 criteria × 5 stars) → leave feedback + internal note → Accept / Rework / Reject → mentorship sessions logged → escalations handled.

**Gaps:** essentially nothing in `/mentor/*` writes to a backend. The reviewer sub‑portal partially writes (assignments, metrics fetched via `reviewerApi`).

### 4.4 Platform Admin / SuperAdmin

**Landing:** `/admin/dashboard` — visual KPIs.

**Journey:** Admin owns the Glimmora Commercial approval stage. `/admin/sow` lists SOWs with awaiting‑commercial pipeline. `/admin/sow/[sowId]/approve` mirrors the enterprise approval shell but operates as Glimmora‑side reviewer. Email templates editable (Zustand persisted only). Settings update contributor pricing (real API). Audit log is mock.

**Gaps:** Roles page is visual stub. Email‑template save is local‑only. Audit is mock. No real Users/Organisations management screen even though sidebar links exist.

### 4.5 Public

`/public/credentials/[shareId]` — fully working; calls `/api/public/credentials/[shareId]` and renders credential. Loading skeleton + 404 state present.

---

## 5. BUTTON / CTA AUDIT (key items, structured)

> Full table is huge; this is the **action‑critical** subset where status ≠ Working.

| # | Page | CTA | Current | Expected | Status | Fix | File |
|---|---|---|---|---|---|---|---|
| 1 | `/enterprise/projects` list | Export PDF | toast.success | Generate & download PDF | Toast Only | Move PDF gen to server route, stream via `/api/projects/export` | `src/app/enterprise/projects/page.tsx` |
| 2 | `/enterprise/projects` list | Export CSV | builds CSV in browser | Confirmed working | Working | — | same |
| 3 | `/enterprise/projects/[projectId]` | Mark UAT Complete | toast.success | PATCH milestone status; trigger billing | Toast Only | Add `useUpdateMilestoneStatus` mutation + invoice creation | `src/app/enterprise/projects/[projectId]/page.tsx` |
| 4 | Project detail | Release Payment | Razorpay order created via `/api/razorpay/create-order` | Verify webhook server‑side, mark invoice paid | Partial | Add `/api/razorpay/verify` webhook + payment status mutation | `src/app/api/razorpay/create-order/route.ts` |
| 5 | `/enterprise/projects/exceptions` | Resolve / Reject / Dispute / Reassign / Request Info / Escalate | toast | Real workflow with state changes | Toast Only | Replace with mutations to project exceptions endpoint | `src/app/enterprise/projects/exceptions/page.tsx` |
| 6 | `/enterprise/audit` | Export PDF / CSV | toast | Stream audit log file | Toast Only | Server route for audit export | `src/app/enterprise/audit/page.tsx` |
| 7 | `/enterprise/billing` | Export PDF | calls pdfkit in browser (fails) | Server PDF | Broken | Move to server route | `src/app/enterprise/billing/page.tsx` |
| 8 | `/enterprise/settings` Team tab | Add Reviewer | toast.success | Send invite email + DB row | Toast Only | Wire to `/api/reviewers/invitations` POST | `src/app/enterprise/settings/page.tsx` |
| 9 | Settings Team tab | Remove / Resend Invite | toast | DELETE / re‑POST invitation | Toast Only | Implement | same |
| 10 | Settings Notifications tab | Toggles | local state | Persist to user prefs | Visual Only | New endpoint + store | same |
| 11 | `/enterprise/settings/security` | Change password / Enable 2FA / Revoke session / Download recovery codes | inline UI | Real auth API | Visual Only | Use existing `authApi.changePassword`, `authApi.revokeSession`, `authApi.initMfaSetup` (already in `src/lib/api/auth.ts`) | `src/app/enterprise/settings/security/page.tsx` |
| 12 | `/enterprise/profile` | Save Profile | toast (handler unclear) | PATCH user profile | Partial | Wire to `useUpdateProfile`; show field errors | `src/app/enterprise/profile/page.tsx` |
| 13 | `/enterprise/onboarding` | (root page) | returns `null` | Render `OnboardingModal` flow | Broken | Render `<OnboardingModal />` from page; verify wizard step API hooks | `src/app/enterprise/onboarding/page.tsx` |
| 14 | `/enterprise/compliance/documents` | Upload | nothing | Upload + index document | Visual Only | Implement upload endpoint + UI handler | `src/app/enterprise/compliance/documents/page.tsx` |
| 15 | `/enterprise/sow/[sowId]` | Download Report | fires email template if enabled | Real PDF generation | Partial | Server‑side PDF generation | `src/app/enterprise/sow/[sowId]/page.tsx` |
| 16 | `/enterprise/review/[deliverableId]` | Approve/Reject/Rework | state change, no save | Real persistence + notify submitter | Partial | Add API mutations | `src/app/enterprise/review/[deliverableId]/page.tsx` |
| 17 | `/mentor/queue/[reviewId]` | Accept / Request Rework / Reject | toast | Real review decision API | Toast Only | Reuse contributor `tasks/[taskId]/review-feedback` route | `src/app/mentor/queue/[reviewId]/page.tsx` |
| 18 | `/mentor/queue/[reviewId]` | Download file | toast | actual file download | Toast Only | Use signed URL from API | same |
| 19 | `/mentor/mentorship` | Save Session Notes | toast | persist note + learning% | Toast Only | New endpoint or attach to submission feedback | `src/app/mentor/mentorship/page.tsx` |
| 20 | `/mentor/escalation` | Resolve / Reassign | toast | persist resolution | Toast Only | new endpoint | `src/app/mentor/escalation/page.tsx` |
| 21 | `/mentor/profile/edit` | Save | setTimeout + toast | PATCH profile | Toast Only | Wire to auth API | `src/app/mentor/profile/edit/page.tsx` |
| 22 | `/mentor/settings` | Save Settings | setTimeout + toast | persist prefs | Toast Only | new endpoint | `src/app/mentor/settings/page.tsx` |
| 23 | `/admin/email-templates` | Save / Test send | persists to `email-template-store` (localStorage) | Should write to a templates DB; test send through `/api/email/send` | Partial | DB‑backed templates + real test send | `src/app/admin/email-templates/page.tsx` |
| 24 | `/admin/roles` | Any CRUD | visual | role CRUD | Visual Only | Build endpoint + UI | `src/app/admin/roles/page.tsx` |
| 25 | `/admin/audit` | Filters / Export | visual | real data | Visual Only | new endpoint | `src/app/admin/audit/page.tsx` |
| 26 | `/auth/register/reviewer` | Submit | setTimeout, then `/auth/mfa-setup` | Real reviewer activation against invite token | Partial | Use `authApi.createReviewer` + token from URL | `src/app/auth/register/reviewer/page.tsx` |
| 27 | `/auth/activate` | Set Password | setTimeout | Validate invite token + set password | Partial | Read `?token=` from URL, call backend | `src/app/auth/activate/page.tsx` |
| 28 | `/contributor/profile/edit` | Save | PATCH API success | works, but no "discard?" guard | Working* | Add unsaved‑changes prompt | `src/app/contributor/profile/edit/page.tsx` |
| 29 | `/contributor/community` | Most actions | visual | community feed actions | Visual Only | Need scope decision | `src/app/contributor/community/page.tsx` |
| 30 | `/onboarding/verify` | Continue | client mock | actually verify email/phone | Partial | Tie to OTP endpoints already present | `src/app/onboarding/verify/page.tsx` |
| 31 | All Auth pages | Form errors | inline state only | Should toast + inline | Partial | Use `useToastStore` from `src/lib/stores/toast-store.ts` | `src/app/auth/*` |
| 32 | Top bar bell | Notification dropdown | works (zustand) | Real push notifications | Partial | Wire SSE/WebSocket → notification-store | `src/components/layout/top-bar.tsx` |
| 33 | Sidebar | Sign out | `signOut({ callbackUrl: "/" })` | works | Working | — | `src/components/layout/sidebar.tsx` |
| 34 | Analytics overview | Build Report | no handler | export builder | Broken (no onClick) | Implement | `src/app/analytics/overview/page.tsx` |

---

## 6. UX FLOW GAP AUDIT

### Dead‑end pages (no clear next step)
- `/enterprise/onboarding` (returns `null`).
- `/enterprise/sow/blueprint` (placeholder).
- `/enterprise/sow/[sowId]/kickoff` (placeholder; real kickoff lives in decomposition).
- `/enterprise/sow/archive`, `/sow/versions` (lists but no actions).
- `/enterprise/analytics/*` sub‑pages — informational only, no drill-down.
- `/admin/roles`, `/admin/audit`, `/admin/dashboard` quick actions → some target nonexistent routes (Organisations, System Health).
- Mentor `/mentor/history` — read‑only with no export.

### Missing back actions
- Auth multi‑step pages have "Back" but onboarding `/onboarding/*` does not consistently expose a back button.
- Mentor profile edit returns to profile but doesn't pre‑select tab.
- SOW upload flow steps don't preserve back navigation if user lands mid‑flow without sessionStorage.

### Missing confirmation modals
- Mentor decisions (Accept/Rework/Reject) — there IS a confirmation modal, but the action is toast only.
- Contributor profile edit save — no "Discard unsaved changes?" prompt.
- Project hold/resume — modal present (good).
- Delete SOW — modal present (good).
- Withdraw plan — confirm modal present (good).
- Logout — no confirmation (low risk).

### Toast‑only actions that need real flows
See §5 rows 1, 3, 5, 6, 7, 8, 9, 17–22, 31. Critical: Mentor rubric decisions, Settings team invitation, UAT sign‑off, Exceptions resolve, Audit export.

### Forms that do not save data
- All Mentor forms (rubric, session notes, escalation, profile, settings).
- Enterprise Settings notifications tab.
- Enterprise security page (entire page is mock).
- Admin email templates (saves to localStorage only).
- Admin roles.
- Compliance document upload.

### Tables without meaningful actions
- Mentor history table.
- Audit log table.
- Invoices table (no download, no resend).
- Compliance documents (no row actions).
- Team members table in Settings (Remove / Resend are toast only).

### Missing empty states
- Mentor mentorship "no sessions" exists.
- Reviewer review-history, qa-inbox, task-monitor — most lack explicit empty states.
- Contributor community, messages — partial.
- Compliance pages — no empty state.

### Missing loading states
- Most pages use skeleton loaders (good). Pages that lack them: `/admin/dashboard`, `/analytics/overview`, all `/enterprise/compliance/*`, `/enterprise/analytics/*`, `/enterprise/audit`.

### Missing error states
- API errors are mostly silent on auth pages.
- SOW detail has no error boundary if `useSOWDetail()` fails.
- TanStack Query hooks generally surface errors via banners only in projects list; elsewhere, the page often renders mock fallback or stays in skeleton.

### Missing success states
- Mentor "decisions" rely on toast alone — no inline "review submitted" state.
- Forgot‑password "Check your email" exists.
- SOW approval — relies on pipeline polling but no celebratory success state when all 5 stages approved.

### Confusing navigation
- Sidebar entries that 404 (Workforce, Operational, Report Builder, System Health, Organisations).
- Reviewer features duplicated in `/mentor/*` and `/enterprise/reviewer/*` with different implementations.
- `/enterprise/sow/approval` vs `/enterprise/sow/[sowId]/approve` — two distinct routes with overlapping purpose.
- `/enterprise/decomposition/approval` vs `/enterprise/decomposition/[planId]/approve` — same issue.
- `/enterprise/review/*` (deliverable review) vs `/enterprise/reviewer/*` (reviewer hub) — sound‑alike, distinct concepts.

### Role permission issues
- **No `src/middleware.ts`** — API routes (e.g. `/api/auth/mfa-confirm`, `/api/contributor/*`) are not protected at the edge.
- `useRoleGuard` enforces page‑level access **client‑side only**, which is bypassable.
- Admin commercial sign‑off stage assumes admin role but the approve page is also reachable by enterprise users via the same shell.
- Mentor pages do not gate non‑mentors.

---

## 7. PAGE‑BY‑PAGE DOCUMENTATION (condensed; status, gaps, suggestions per page)

Status legend per page: **W**=Working · **P**=Partial · **T**=Toast Only · **V**=Visual Only · **B**=Broken.

### Enterprise
| Page | Status | Key gaps | Suggestion |
|---|---|---|---|
| dashboard | V | mock counters, no drill-down | Wire to `useDashboardMetrics` if backend exists; make tiles filter targets |
| sow (list) | W | no bulk actions, no export | Add bulk delete + CSV |
| sow/[sowId] | W | glimmora_commercial read‑only is correct; download report partial | Server PDF |
| sow/[sowId]/approve | W | no expedited‑review path | Optional |
| sow/[sowId]/compare | V | shell | Build diff view |
| sow/[sowId]/contract | V | shell | Build contract render + e‑sign hook |
| sow/[sowId]/kickoff | V | placeholder | Redirect to decomposition |
| sow/approval, sow/approval/[sowId] | P | duplicate of approve | Consolidate routes |
| sow/archive | V | list only | Add restore action |
| sow/blueprint | V | shell | Decide whether to keep |
| sow/generate, /review | P | wizard works, intermediate steps brittle | Replace sessionStorage with backend draft endpoints |
| sow/intake | W | landing page only | OK |
| sow/upload/* (10 sub‑pages) | P | mostly UI complete, persistence partial | Add a draft API; auto‑save indicator |
| sow/versions | V | list only | Add view, restore, diff |
| decomposition (list) | W | no plan cost validation | Optional |
| decomposition/[planId] | P | partial save | Wire all field saves |
| decomposition/[planId]/edit | P | UI complete | Hook up mutations |
| decomposition/[planId]/approve, /approval | P | duplicate of [planId]/approve | Consolidate |
| projects (list) | W | export PDF toast, kebab Download Report toast | Server export |
| projects/[projectId] | P | UAT toast, payment unverified | Add milestone status mutation + Razorpay verify |
| projects/[projectId]/milestones | P | partial | Same |
| projects/[projectId]/monitor | P | live charts via mock | wire to telemetry |
| projects/[projectId]/tasks/[taskId] | V | shell | Build task detail |
| projects/completed | W | read‑only | OK |
| projects/exceptions | T | all actions toast | Build full workflow |
| review (list) | V | mock | Wire to deliverables API |
| review/[deliverableId] | P | no persistence | Build review API |
| review/[deliverableId]/feedback | V | mock | Same |
| review/history | V | mock | Same |
| reviewer (page) | W | partial | OK |
| reviewer/review-queue, /[reviewId] | W | API hooks | Continue |
| reviewer/qa-inbox | P | message reply unclear | Wire send |
| reviewer/task-monitor, /[taskId] | P | task list partial | Build detail |
| reviewer/mentoring-log | V | mock | Build |
| reviewer/my-metrics | V | mock | Build |
| reviewer/review-history | V | mock | Build |
| reviewer/notifications | P | uses notification-store | OK |
| billing (page) | P | PDF export broken | Server export |
| billing/budget | V | mock | Build |
| billing/history | V | mock | Build |
| billing/invoices, /[invoiceId] | V | mock | Build CRUD |
| billing/pricing | V | mock | Build |
| billing/rate-cards | V | uses `rate-cards-store` (local) | Persist server‑side |
| billing/reports | V | mock | Build |
| compliance/documents | V | upload no handler | Implement |
| compliance/esg | V | mock | Build |
| compliance/evidence | V | mock | Build |
| compliance/podl | V | mock | Build |
| analytics (page) | V | mock | Wire |
| analytics/economic | V | mock | Wire |
| analytics/governance | V | mock | Wire |
| analytics/reports | V | mock | Build report builder |
| audit | V | mock | Wire to audit endpoint |
| profile | P | save handler unclear | Wire `useUpdateProfile` |
| settings | T | Company save toast, Team toast, Notifications no save | Per §5 |
| settings/security | V | entire page mock | Wire to `authApi` (already exists) |
| team (list) | W | API integration | OK |
| team/[teamId] | P | grid only | Add team mgmt actions |
| team/[teamId]/confirm | P | confirmation form | Wire to API |
| notifications | W | Zustand | Add server delivery |
| onboarding | B | returns null | Render `<OnboardingModal/>` |

### Contributor
| Page | Status | Notes |
|---|---|---|
| dashboard | W | KPIs via real API |
| tasks (list) | W | search/filter/sort/pagination, real |
| tasks/[taskId] | W | accept/decline/start/submit/workroom flows work |
| tasks/submissions | W | versioning, drafts |
| tasks/submissions/[submissionId] | W | feedback view + resubmit |
| profile | W | read‑only |
| profile/edit | W* | no unsaved‑changes guard |
| profile/digital-twin | W | history + skills |
| profile/evidence | W | upload + list real |
| credentials (list) | P | ledger; detail page partial |
| credentials/[credentialId] | P | share + verify partial |
| earnings | W | chart + payouts real |
| learning | W | recommendations dismiss/open real |
| community | V | mostly visual |
| messages | P | thread UI; sending partial |
| notifications | W | Zustand + real fetch |
| support | P | FAQs read; tickets/grievances/safety reports create works; ticket messaging incomplete |
| settings | P | toggle prefs partial |
| onboarding | P | step navigation works, persistence partial |

### Mentor (all but profile read‑only)
| Page | Status |
|---|---|
| dashboard | V |
| queue (list) | P |
| queue/[reviewId] | T |
| mentorship | T |
| escalation | T |
| history | V |
| profile | V |
| profile/edit | T |
| settings | T |

### Admin
| Page | Status |
|---|---|
| dashboard | V |
| sow (list) | P (real API hooks) |
| sow/[sowId]/approve | P (heavy normalization) |
| email-templates | P (Zustand only) |
| roles | V |
| settings | P (pricing real) |
| audit | V |

### Other
| Page | Status |
|---|---|
| `/analytics/overview` | V |
| `/public/credentials/[shareId]` | W |
| `/` (marketing landing + role redirect) | W |
| `/onboarding/*` (8 pages) | P |

---

## 8. DATA & CRUD AUDIT

| Feature | Create | Read | Update | Delete | Search | Filter | Sort | Export | Bulk | Status change | Approval / Rejection |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **SOW (AI + Manual)** | ✓ real (Glimmora) | ✓ | ✓ | ✓ confirm modal | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ via pipeline | ✓ 5‑stage real |
| **Approval pipeline** | ✓ | ✓ poll 15s | ✓ approve/reject | — | ✗ | ✗ | — | ✗ | ✗ | ✓ | ✓ |
| **Decomposition plan** | ✓ kickoff | ✓ | partial | partial (withdraw) | ✗ | ✓ | partial | ✗ | ✗ | ✓ | ✓ (approve plan) |
| **Projects** | derived from plan | ✓ | hold/resume real | ✗ | ✓ | ✓ multi | ✓ | toast | ✗ | ✓ (hold/escalate) | — |
| **Milestones** | — | ✓ mock | UAT toast | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | partial | — |
| **Exceptions** | mock | ✓ mock | toast | toast | ✗ | partial | ✗ | ✗ | ✗ | toast | toast |
| **Deliverable Review** | — | ✓ mock | mock | ✗ | ✗ | tabs | ✗ | ✗ | ✗ | mock | mock |
| **Reviewer Queue** | — | ✓ partial | partial | ✗ | partial | partial | partial | ✗ | ✗ | partial | partial |
| **Mentor Queue** | — | ✓ mock | toast | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | toast | toast |
| **Mentorship sessions** | toast | mock | toast | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | toast | — |
| **Escalations** | mock | ✓ mock | toast | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | toast | — |
| **Team members (Settings)** | toast | ✓ mock | ✗ | toast | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| **Reviewer invitations** | partial API exists | partial | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| **Invoices** | — | ✓ mock | ✗ | ✗ | ✗ | ✗ | partial | broken PDF | ✗ | ✗ | — |
| **Rate cards** | local | ✓ local | local | local | ✗ | ✗ | ✗ | ✗ | ✗ | — | — |
| **Compliance docs** | ✗ form no save | mock | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — | — |
| **Audit log** | — | mock | — | — | ✗ | partial | partial | toast | — | — | — |
| **Email templates** | local (Zustand) | local | local | local | ✗ | ✗ | ✗ | ✗ | ✗ | — | — |
| **Admin pricing** | ✓ real | ✓ real | ✓ real | ✓ real | ✗ | ✗ | ✗ | ✗ | ✗ | — | — |
| **Contributor profile** | ✓ via register | ✓ real | ✓ real | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — | — |
| **Digital twin / Evidence** | ✓ real | ✓ real | ✓ real | ✓ real (evidence) | ✗ | ✗ | ✗ | ✗ | ✗ | — | — |
| **Credentials** | derived | ✓ real | share ✓ real | ✗ | ✗ | ✗ | ✗ | partial cert/portfolio | ✗ | verify partial | — |
| **Tasks** | ✓ enterprise side; ✓ acceptance contributor side | ✓ real | ✓ real | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | accept/decline real | — |
| **Submissions** | ✓ real | ✓ real | ✓ resubmit real | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | — | reviewer feedback exists |
| **Support tickets** | ✓ real | ✓ real | partial messages | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | partial | — |
| **Grievances / Safety reports** | ✓ real | ✓ real | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — | — |
| **Learning recs** | — | ✓ real | dismiss/open real | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — | — |
| **Notifications** | — | ✓ Zustand | read/dismiss Zustand | ✗ | ✗ | ✓ tabs | ✗ | ✗ | mark‑all‑read | — | — |
| **Payments (Razorpay)** | ✓ order create real | — | ✗ no verify | ✗ | — | — | — | — | — | partial | — |

---

## 9. PRIORITY FIXING ROADMAP

### P0 — Critical blockers (do first)
1. **Render the enterprise onboarding wizard** — `src/app/enterprise/onboarding/page.tsx` currently returns `null`. Mount `OnboardingModal`/step components.
2. **Add `src/middleware.ts`** with NextAuth `auth()` to gate `/enterprise/*`, `/admin/*`, `/mentor/*`, `/contributor/*` routes and all sensitive `/api/*` routes.
3. **Verify Razorpay payments server‑side** — add `/api/razorpay/verify` webhook handler, update invoice/milestone status, prevent double‑release.
4. **Wire Mentor decision flow** — `/mentor/queue/[reviewId]` Accept/Rework/Reject must POST to a real endpoint (reuse `/api/contributor/tasks/[taskId]/review-feedback` or build `/api/reviewer/decisions`). Without this the entire mentor surface is decorative.
5. **Replace `pdfkit` in‑browser export** in `/enterprise/billing` and `/enterprise/audit` with server route streaming a PDF — current implementation will fail in browser.
6. **Wire Settings → Team Add Reviewer** to `/api/reviewers/invitations` (route already exists). Today it only fires a toast.
7. **Fix nav links to non‑existent pages** (Workforce dashboard, Operational dashboard, Report Builder, System Health, Organisations) — either build stubs with "coming soon" empty states or remove from `src/lib/config/navigation.ts`.
8. **Auth pages → surface errors via toasts** — `useToastStore` exists but is unused in auth. Today network/credential errors are easy to miss.
9. **Complete `/auth/activate` and `/auth/register/reviewer`** — both are setTimeout mocks. Read `?token=` from URL and call backend.
10. **Persist Mentor session notes / escalation resolutions** — currently toast only; add a `mentorship-sessions` and `escalations` API.

### P1 — Important UX/flow gaps
1. **UAT milestone sign‑off** must update milestone status (real PATCH).
2. **Project Exceptions screen** — convert every action button from toast to real workflow.
3. **Enterprise Settings → Notifications tab** — persist user preferences server‑side.
4. **`/enterprise/settings/security`** — connect to `authApi.changePassword`, `authApi.revokeSession`, `authApi.initMfaSetup` (already implemented in `src/lib/api/auth.ts`).
5. **Deliverable Review** (`/enterprise/review/[deliverableId]`) — wire Approve/Reject/Rework to real API; notify contributor.
6. **Profile edit unsaved‑changes guard** (contributor + enterprise + mentor).
7. **Consolidate duplicate routes**: `/enterprise/sow/approval` vs `/sow/[sowId]/approve`; `/enterprise/decomposition/approval` vs `/decomposition/[planId]/approve`.
8. **Add empty/loading/error states** to reviewer sub‑pages (qa-inbox, task-monitor, mentoring-log, my-metrics, review-history), compliance pages, analytics pages, audit.
9. **Email template editor** should persist to server (currently localStorage only); add a real "Send test email" button using `/api/email/send`.
10. **Notifications** — wire SSE/WebSocket to replace local Zustand store as source of truth.
11. **Recovery codes auto‑download** at end of MFA setup.
12. **Replace sessionStorage handoffs** between `/auth/login` → `/auth/mfa-setup` / `/auth/change-password` with server cookies (data is lost on refresh).
13. **Contributor support ticket detail/messaging** — finish thread UI; API endpoints exist (`/api/contributor/support/tickets/[ticketId]/messages`).
14. **Decomposition plan edit page** — wire all inline field saves to existing mutations.

### P2 — Nice‑to‑have improvements
1. Bulk SOW delete, bulk notification mark‑read, bulk approval comments.
2. CSV/PDF export on Audit, Invoices, Mentor history.
3. Drill‑down from dashboard KPI tiles to filtered tables.
4. Compliance documents upload + viewer.
5. Analytics charts wired to real telemetry.
6. Admin Roles & Permissions full CRUD.
7. Rate cards persistence server‑side (currently `rate-cards-store` local).
8. Account linking UI when an SSO email already exists on another provider.
9. Rate‑limit `/api/auth/otp/send-email` and `/api/auth/validate`.
10. Add "Discard" / "Save" sticky bar on long edit forms.

### P3 — Polish & visual consistency
1. Consistent skeleton heights on dashboards.
2. ARIA labels on icon‑only buttons.
3. Keyboard shortcuts beyond ⌘K on SOW list.
4. Focus traps in all modals.
5. Sidebar badge counts on contributor and mentor (already on enterprise SOW).
6. Consistent toast titles/copy (some say "Saved!", others "Settings Saved").
7. Standardise empty states (single component).
8. Replace `setTimeout` stubs with real mutations (cleanup: `/mentor/profile/edit`, `/mentor/settings`, `/auth/activate`, `/auth/register/reviewer`).
9. Remove dead local components in `/enterprise/onboarding/components/` if they will not be wired up.
10. Consolidate "reviewer" terminology (mentor vs reviewer) into a single concept across UI.

---

## 10. APPENDICES — Implementation Reference

### A. Real backend integration points (already wired)
- `src/lib/api/auth.ts` — login, register (contributor + enterprise), email/password validate, MFA init/confirm/verify, recovery code redeem, password change, sessions list/revoke, current user, reviewer invitation create/resend.
- `src/lib/api/sow.ts` + `/sow-transformers.ts` — full SOW lifecycle (AI + manual), version history, approval stages, comments.
- `src/lib/api/decomposition.ts` + `/decomposition-plans.ts` — plan CRUD, kickoff, withdraw, approve.
- `src/lib/api/contributor.ts` — ~80 endpoints (profile, digital twin, skills, evidence, credentials, learning, tasks, submissions, support tickets, grievances, safety reports, workroom uploads).
- `src/lib/api/teams.ts` — portfolio + team formation.
- `src/lib/api/reviewer.ts` — reviewer assignments, metrics, notifications.
- `src/lib/api/portfolio.ts` — projects portfolio + metrics + hold/resume/status.
- `src/lib/api/admin-sow.ts` — admin SOW oversight + commercial sign-off.
- `src/lib/api/oauth-login.ts` — OAuth id_token exchange + automatic TOTP for MFA‑required SSO.
- `src/lib/api/settings.ts` — contributor pricing config.

### B. Stores (17) — persistence semantics
All persist to `localStorage` via Zustand `persist`. None of these are a server source of truth; treat them as **client cache + UI state**. Relevant: `auth-store`, `contributor-phone-store`, `email-template-store`, `enterprise-company-store`, `notification-store`, `onboarding-store`, `platform-settings-store`, `project-hold-store`, `rate-cards-store`, `sidebar-store`, `sow-messages-store`, `sow-pipeline-store`, `sow-store`, `sow-upload-store`, `submission-store`, `task-store`, `toast-store`.

### C. Internal API routes (60) — real vs. proxy vs. stub
- **Real:** all `/api/auth/*` (login validate, OTP send/verify, password change/reset, MFA confirm, OAuth authorize/exchange, sso-intent), `/api/email/send`, `/api/razorpay/create-order` (order only), `/api/public/credentials/[shareId]`, `/api/reviewers/invitations`, `/api/superadmin/users`.
- **Proxy:** `/api/sow/proxy`, `/api/decomposition/proxy`, `/api/sow/token` — forward to Glimmora backend with token injection.
- **Wrappers around Glimmora:** all `/api/contributor/*` (profile, skills, evidence, credentials, learning, tasks, submissions, support).
- **Document utility:** `/api/nda-document`, `/api/nda-download`.
- **Config:** `/api/config/contributor-pricing`, `/api/settings/contributor-pricing`.

### D. Prisma models (local DB only)
The local DB is intentionally minimal — only `User` and `ContributorProfile` exist for NextAuth + registration. All domain data lives in the Glimmora API. Implication: any "missing persistence" must be solved by adding a backend endpoint or a new Prisma model — choose carefully.

### E. Cross‑cutting recommendations for ChatGPT step‑by‑step fixing
When handing this to ChatGPT, request fixes in **this exact order** to avoid rework:
1. Middleware + auth toasts (security & user feedback).
2. Make `/enterprise/onboarding` render the wizard.
3. Persist Mentor/Review actions (this unblocks the mentor portal).
4. Razorpay verify webhook (unblocks safe payment).
5. Settings security wiring (uses APIs that already exist).
6. Server‑side PDF/CSV export route.
7. Consolidate duplicate routes.
8. Wire UAT/Exceptions/Notifications prefs.
9. Polish empty/loading/error states across reviewer + compliance + analytics + audit.
10. Replace local‑only stores (email templates, rate cards) with server persistence.

---

**End of audit.** Total scope inspected: 134 pages, 60 API routes, 17 Zustand stores, 13 API client modules, 12 mock data files, NextAuth + 5 provider strategies, Razorpay + Nodemailer + React Email + Prisma. The platform is roughly **45–55 % production‑ready**: the SOW → Approval → Decomposition → Projects → Contributor delivery spine is real and wired; the mentor portal, analytics, compliance, audit, billing reports, security settings, and most admin functions are visual/toast mocks awaiting backend integration.
