# Contributor Portal — Detailed Specification

> **Status:** Draft v1.0 — Phase 1 rebuild reference
> **SOW anchor:** GLIMMORATEAM™ Global Workforce Intelligence Platform v1.1
> **Owner:** Product · Engineering · Design
> **Last updated:** 2026-05-26
> **Supersedes:** all prior `CONTRIBUTOR_PORTAL_V2_*` docs in `docs/audits/`, `docs/strategy/`, `docs/phase-1/`

---

## 0. Document control

| Field | Value |
|---|---|
| Document role | Source of truth for build-out and QA |
| Used by | Engineers building screens, designers reviewing, QA writing test cases |
| SOW anchor | §1.4.1, §3.1.MVP.3–MVP.7, §3.1.5, §4.1, §19.2, §20 |
| Phase 1 horizon | 0–90 days |
| Scope philosophy | SOW-binding capabilities only; over-scoping marked as **Phase 2 — defer** |

### How to use this document

- **For engineers:** the screen spec is the build target. Wireframes are layout intent (not pixel-perfect); states and edge cases are mandatory; UX rationale explains *why* — do not "fix" what looks odd without checking the rationale.
- **For designers:** treat the wireframes as the minimum viable layout. Tokens come from the Meridian design system (`bg-surface`, `ring-stroke-subtle`, etc.).
- **For QA:** every "States" and "Edge cases" line is a test case.
- **For PMs:** §2 lists everything we commit to Phase 1. Items not in §2 are **not** Phase 1.

### Reading conventions

- **§** = SOW section reference (e.g., §3.1.MVP.5)
- **P1 / P2** = Phase 1 / Phase 2
- **🔒 SEAL** = surface exists in code today but should be hidden / route-removed for Phase 1
- **🚧 BUILD** = does not exist in code; must be built for Phase 1
- **🔧 WIRE** = exists in code as mock; must be wired to real persistence for Phase 1
- **✅ KEEP** = exists in code and is Phase 1-ready (cosmetic polish only)

---

## 1. Purpose and personas

### 1.1 What this portal is for

The Contributor Portal is the **execution surface for any human or AI agent performing tasks** within GlimmoraTeam (§1.5). It is where:

- A contributor onboards, declares skills, gives consent
- Receives or discovers task assignments
- Executes the task in a focused workroom with brief, criteria, evidence, and reviewer dialogue
- Submits work for review
- Iterates through revisions if requested
- Tracks completed work, earnings, payouts, and credentials

It is **not** an admin console, not a mentor workspace, not an analytics dashboard. It is the contributor's daily workspace — calm, execution-focused, low-chrome.

### 1.2 Personas

| Persona | Source | Onboarding path | Identity verification | Payout method | SOW |
|---|---|---|---|---|---|
| **Internal employee** | HRIS sync or admin invite | SSO from corporate IdP | Inherited (enterprise-grade) | Internal payroll integration | §3.1.MVP.3, §3.1.MVP.9 |
| **External freelancer** | Self-register or invite | Email/OAuth + KYC-lite | Email + phone OTP + ID verify | Bank / wallet | §3.1.MVP.3 |
| **Student** | Institutional partner invite | Email + university handshake | Institutional verification | Bank or stipend rail; academic recognition mapping | §20.1 |
| **Women workforce** | Self-register or partner program | Email + flexible-track tailoring | Lightweight KYC + safety opt-ins | Local-rail payment (regional inclusion) | §20.2, §20.3 |

> **Persona X-mark:** an AI agent contributor is in scope per §1.5 definition, but the AI-as-contributor onboarding path is **deferred to Phase 2** (no MVP requirement). Wherever this doc says "contributor," read it as human.

### 1.2.1 One portal, persona-conditional modules

**Decision (locked):** all four personas use the **same dashboard layout and the same navigation shell**. Persona-specific affordances are added as **conditional modules** in known slots, not as separate dashboards or separate portals.

**Why same shell:**
- Core JTBD ("what should I work on next?") is identical across personas
- Personas can change over time (student → freelancer; internal → freelance) — a stable shell means no relearning
- One codebase, one design system, one QA surface — the standard pattern across enterprise SaaS

**Where the variance lives:**
- A single **persona slot** on the dashboard (see §5.C.3) — exactly one conditional card per active track
- The **identity step in onboarding** (§5.B.3) — form fields differ by persona
- **Payout method** (§5.L.4) — country/method defaults differ
- **Safety + grievance surfacing** (§5.O.4) — more prominent for women workforce
- **Profile detail fields** (§5.K.1) — students show institution; freelancers show client history

**Multi-track contributors:** a contributor can hold up to two active tracks simultaneously (e.g. "student + women workforce"). The dashboard renders one conditional module per active track, stacked. More than two tracks not supported — keeps the dashboard from getting noisy.

**Track changes:** when a contributor's primary track changes (graduation, leaving an enterprise), the conditional module updates automatically based on `contributor.tracks`. No portal switch, no relearning.

### 1.3 Jobs-to-be-done (per persona)

| JTBD | Who | Surface where solved |
|---|---|---|
| "Show me work I can pick up that matches my skills" | All | Assigned list, Dashboard hero |
| "Help me deliver this task correctly the first time" | All | Workroom, AI signals, criteria checklist |
| "Tell me what to fix when work is sent back" | All | Revisions feedback view, diff viewer |
| "Pay me on time and show me what I've earned" | All | Earnings, payout method, export |
| "Prove what I've delivered to outside parties" | All | Credentials wallet, public credential page |
| "Help me grow my skills and reputation" | Student, Women | Skills page, Digital twin (P1 baseline) |
| "Keep me safe from harassment and unsafe tasks" | Women, Student | Safety report, grievance, support tickets |
| "Don't make me think about platform mechanics" | All | Calm IA; AI assistance summoned, not pushed |

### 1.4 What this portal is NOT

- **Not** a community / social network (no public profiles for browsing, no feeds, no follows)
- **Not** a job board (tasks are assigned via matching; contributors can browse opportunities but not bid)
- **Not** an admin console (no tenant config, no role management, no integration setup here)
- **Not** a mentor surface (mentors have a separate portal; contributor sees only their assigned reviewer's feedback)
- **Not** a learning platform (Phase 1 has skills capture; full LMS is Phase 2)

---

## 2. Phase 1 vs Phase 2 scope

### 2.1 Phase 1 — must ship (SOW-binding)

| # | Capability | SOW | Today | Phase 1 effort |
|---|---|---|---|---|
| 1 | SSO (SAML / OIDC) login | §3.1.MVP.8 | NextAuth credentials + Google/Microsoft OAuth | 🚧 BUILD enterprise SAML/OIDC |
| 2 | Email/password + MFA | §3.1.MVP.8 | Exists | ✅ KEEP, polish error states |
| 3 | Contributor registration + invite flow | §3.1.MVP.3 | Exists as mock | 🔧 WIRE to real persistence |
| 4 | Onboarding (identity, skills, consent, role) | §3.1.MVP.3 | Exists as mock (modal) | 🔧 WIRE to backend + add institutional verification |
| 5 | Profile + skills + availability + timezone | §3.1.5 | Exists | 🔧 WIRE |
| 6 | Digital twin v1 (skills + reliability counters) | §3.1.MVP.3 | Mock only | 🔧 WIRE to live derivation from completed tasks |
| 7 | Task discovery + assignment list | §3.1.MVP.4 | Exists | 🔧 WIRE matching API; add "why matched" |
| 8 | Accept / decline assignment | §3.1.MVP.4 | Exists | 🔧 WIRE |
| 9 | Workroom (brief, criteria, uploads, Q&A) | §3.1.MVP.5 | Exists, polished | 🔧 WIRE evidence storage, Q&A thread, virus scan |
| 10 | Evidence upload + virus + plagiarism scan | §3.1.MVP.5 | Drag-drop UI only | 🚧 BUILD scan integration |
| 11 | Submission with structured response + evidence checklist | §3.1.MVP.5 | UI exists | 🔧 WIRE submission API; add success terminal state |
| 12 | Submit confirmation (terminal state with SLA window) | §3.1.MVP.5 | Missing — routes back to workroom | 🚧 BUILD |
| 13 | Single-stage AND two-stage review routing | §3.1.MVP.5 | Routing default exists; UI to choose missing | 🚧 BUILD routing selector |
| 14 | Revision feedback view (3-block: what worked / corrections / suggestions) | §3.1.MVP.5 | Exists, polished | ✅ KEEP |
| 15 | Corrections checklist (per criterion) | §3.1.MVP.5 | Exists | ✅ KEEP |
| 16 | Diff viewer (v1 vs v2) | §3.1.MVP.5 | Stub | 🚧 BUILD |
| 17 | Resubmit (versioning) | §3.1.MVP.5 | Exists as mock | 🔧 WIRE |
| 18 | Completed work archive + read-only detail | §3.1.MVP.5 | Exists | 🔧 WIRE |
| 19 | Earnings overview + history | §3.1.MVP.6 | Mock | 🔧 WIRE to acceptance events |
| 20 | Payout method setup (bank / wallet / regional) | §3.1.MVP.6 | Missing | 🚧 BUILD |
| 21 | Earnings export (CSV) | §3.1.MVP.6 | Missing | 🚧 BUILD |
| 22 | Credentials wallet + share | §3.1.5 | Exists | 🔧 WIRE to acceptance events |
| 23 | Public credential page (share link) | §3.1.5 | Exists at /public/credentials | ✅ KEEP |
| 24 | Notifications (in-app, email) | §3.1.5 implicit | Exists | 🔧 WIRE delivery |
| 25 | Settings (account, notification prefs, privacy/consent, language) | §3.1.5 | Exists, partial | 🔧 WIRE preferences API |
| 26 | Support: FAQs + tickets + safety report + grievance | §20.3 | Exists, mock | 🔧 WIRE ticket persistence + routing |
| 27 | Localization framework (i18n + RTL + currency/timezone) | §3.1.5 | Missing | 🚧 BUILD framework (English-only ship is OK; framework must exist) |
| 28 | WCAG-aligned accessibility for core journeys | §1.4.1 | Implicit; not audited | 🚧 BUILD audit + remediation pass |
| 29 | Immutable audit trail of contributor actions | §3.1.MVP.8 | Missing | 🚧 BUILD (cross-functional — see doc 05) |

### 2.2 Phase 2 — deferred (with rationale)

| Surface | SOW | Why Phase 2 |
|---|---|---|
| **Community section** — Mentorship · Discussions · Messages | §3.1.5 places mentor workspace in a separate portal; contributor-side community has no SOW basis | Out of Phase 1 |
| **Learning recommendations** (full LMS-style) | §1.5 mentions learning agent; full system is Phase 2 governance/L&D scope | Out of Phase 1 |
| **Tax document generation** | Requires ERP / tax engine integration explicitly deferred to Phase 2 (§3.2.6) | Out of Phase 1 |
| **AI agent contributor onboarding** | §1.5 names AI as contributor but no MVP path defined | Out of Phase 1 |
| **Skill ladder visualization** (dedicated surface) | §3.1.MVP.3 only requires skills list inside digital twin | Out of Phase 1 |
| **Multi-tab workroom switcher** | §5.3 explicitly: "single task per workroom; no tabbed multi-task interface" | Out of Phase 1 |
| **Native mobile apps** | §3.1.5: mobile-responsive web is baseline; native is "optional, API-ready design" | Out of Phase 1 |
| **Cryptographic credential issuance / verifiable credentials** | §3.2 explicitly excludes | Out of Phase 1 |

### 2.3 Phase 1 exit criteria — contributor portal

A contributor portal passes Phase 1 acceptance when **all** of these are true:

1. A new contributor can register, onboard, declare skills, and reach an empty dashboard
2. An internal contributor can log in via enterprise SSO (SAML or OIDC)
3. Matching produces a ranked list with at least one "why matched" attribution per task
4. A contributor can accept a task, enter the workroom, upload evidence (scanned), submit, and reach a terminal "under review" confirmation
5. When a mentor returns the task with revision feedback, the contributor sees the 3-block view, marks corrections addressed, resubmits, and reaches a completed state
6. On acceptance, the contributor sees the earnings entry, can set up a payout method, and can export earnings as CSV
7. On acceptance, a credential is issued and shareable via public URL
8. Notifications dispatch for all critical state transitions
9. All actions write to the immutable audit trail
10. Core journeys (register, onboard, accept→submit, view earnings, claim credential) pass a WCAG 2.1 AA audit at the contributor-portal surface

### 2.4 Out of scope entirely

These do not appear in any phase of the contributor portal:

- Bidding on tasks (the platform assigns; contributors accept/decline, never bid)
- Negotiating rates (rates come from enterprise rate cards via §3.1.MVP.6)
- Public contributor profiles for hiring (the portal is execution-focused; reputation is mentor/enterprise-side via Digital Twin in their views)
- Direct contributor-to-contributor messaging outside a task context (Phase 2 if at all)

---

## 3. Information architecture

### 3.1 Sidebar

```
┌─────────────────────────────────┐
│ ▢ Glimmora                       │  ← brand strip
├─────────────────────────────────┤
│ TODAY                            │
│   • Dashboard                    │  /contributor/dashboard
├─────────────────────────────────┤
│ MY WORK                          │
│   • Assigned                     │  /contributor/tasks
│   • Submissions                  │  /contributor/tasks/submissions
│   • Revisions                    │  /contributor/tasks/revisions
│   • Completed                    │  /contributor/tasks/completed
├─────────────────────────────────┤
│ MY RECORD                        │
│   • Earnings                     │  /contributor/earnings
│   • Credentials                  │  /contributor/credentials
├─────────────────────────────────┤
│ SUPPORT                          │
│   • Help                         │  /contributor/support
├─────────────────────────────────┤
│   • Profile                      │  /contributor/profile
│   • Settings                     │  /contributor/settings
├─────────────────────────────────┤
│ [<<] collapse                    │
└─────────────────────────────────┘
```

**Rationale:**
- **TODAY** = orient. Single item (Dashboard). The Workroom menu page was removed (it duplicated Assigned).
- **MY WORK** = pipeline by lifecycle state. Each item answers a different question.
- **MY RECORD** = reward + reputation. Earnings + Credentials only — Progress page is deferred to Phase 2 (was over-scoped).
- **SUPPORT** = safety net.
- **Account tail** (Profile, Settings) = unlabeled tail, no section header.

Five visible sections, max two clicks to anything. Cognitive load: the contributor never has to "decide which section" because each item is a distinct lifecycle state.

### 3.2 Route map (Phase 1)

| Route | Screen | Phase | SOW |
|---|---|---|---|
| `/auth/login` | Login | P1 | §3.1.MVP.8 |
| `/auth/register` | Register | P1 | §3.1.MVP.3 |
| `/auth/forgot-password` | Forgot password | P1 | §3.1.MVP.8 |
| `/auth/reset-password` | Reset password | P1 | §3.1.MVP.8 |
| `/auth/verify-otp` | OTP verification | P1 | §3.1.MVP.8 |
| `/auth/mfa` | MFA challenge / setup | P1 | §3.1.MVP.8 |
| `/auth/sso/[provider]` | SSO redirect interstitial | P1 | §3.1.MVP.8 |
| `/contributor/onboarding` | Onboarding shell | P1 | §3.1.MVP.3 |
| `/contributor/dashboard` | Dashboard | P1 | §3.1.5 |
| `/contributor/tasks` | Assigned list | P1 | §3.1.MVP.4 |
| `/contributor/tasks/[taskId]` | Workroom | P1 | §3.1.MVP.5 |
| `/contributor/tasks/[taskId]/submit` | Submission | P1 | §3.1.MVP.5 |
| `/contributor/tasks/[taskId]/submit/success` | Submission success | P1 | §3.1.MVP.5 |
| `/contributor/tasks/submissions` | Submissions queue | P1 | §3.1.MVP.5 |
| `/contributor/tasks/submissions/[submissionId]` | Submission detail | P1 | §3.1.MVP.5 |
| `/contributor/tasks/revisions` | Revisions queue | P1 | §3.1.MVP.5 |
| `/contributor/tasks/revisions/[taskId]` | Revision workroom | P1 | §3.1.MVP.5 |
| `/contributor/tasks/completed` | Completed list | P1 | §3.1.MVP.5 |
| `/contributor/tasks/completed/[taskId]` | Completed detail | P1 | §3.1.MVP.5 |
| `/contributor/earnings` | Earnings overview | P1 | §3.1.MVP.6 |
| `/contributor/earnings/history` | History | P1 | §3.1.MVP.6 |
| `/contributor/earnings/payout-method` | Payout method | P1 | §3.1.MVP.6 |
| `/contributor/earnings/export` | Export | P1 | §3.1.MVP.6 |
| `/contributor/credentials` | Credentials wallet | P1 | §3.1.5 |
| `/contributor/credentials/[id]` | Credential detail | P1 | §3.1.5 |
| `/public/credentials/[shareId]` | Public credential | P1 | §3.1.5 |
| `/contributor/notifications` | Notifications | P1 | implicit |
| `/contributor/profile` | Profile view | P1 | §3.1.MVP.3 |
| `/contributor/profile/edit` | Profile edit | P1 | §3.1.MVP.3 |
| `/contributor/profile/skills` | Skills | P1 | §3.1.MVP.3 |
| `/contributor/profile/digital-twin` | Digital twin summary | P1 | §3.1.MVP.3 |
| `/contributor/settings` | Settings index | P1 | §3.1.5 |
| `/contributor/settings/account` | Account | P1 | §3.1.5 |
| `/contributor/settings/notifications` | Notification prefs | P1 | §3.1.5 |
| `/contributor/settings/privacy` | Privacy & consent | P1 | §3.1.5, §20.3 |
| `/contributor/settings/language` | Language & region | P1 | §3.1.5 |
| `/contributor/support` | FAQ + tickets index | P1 | §20.3 |
| `/contributor/support/tickets/new` | New ticket | P1 | §20.3 |
| `/contributor/support/tickets/[id]` | Ticket detail | P1 | §20.3 |
| `/contributor/support/safety-report` | Safety report | P1 | §20.3 |
| `/contributor/support/grievance` | Grievance | P1 | §20.3 |

**Sealed for Phase 1 (route removed or behind feature flag):**

| Route | Reason |
|---|---|
| `/contributor/community/*` | Phase 2 — no SOW basis |
| `/contributor/messages/*` | Phase 2 |
| `/contributor/learning/*` | Phase 2 |
| `/contributor/progress` | Phase 2 — over-scoped |

### 3.3 Navigation patterns

- **Sidebar:** always visible on lg+; drawer on mobile. Active item: white card lift (`bg-surface ring-1 ring-stroke-subtle shadow-xs`).
- **Topbar:** sticky, 60px. Contains: mobile menu, search (⌘K), notification bell, account menu.
- **Breadcrumbs:** only inside `/contributor/tasks/[taskId]` and deep `/contributor/settings/*` paths. Otherwise the sidebar alone provides location.
- **Back navigation:** the browser back button is always safe (no destructive consequences); explicit back buttons appear only inside multi-step flows (onboarding, submission).
- **Deep linking:** every route is bookmarkable; reload preserves filter and pagination state in URL query params (`?status=in_progress&page=2`).

---

## 4. End-to-end user journeys

These are the named journeys we verify in Phase 1 UAT. Each is a sequence of screens with decision points and edge cases.

### Journey A — First-time user: register → onboard → first task → submit → paid

```
[Landing] ─→ Register ─→ Email OTP ─→ Onboarding shell
                                           ├─ Step 1: Welcome + role
                                           ├─ Step 2: Identity
                                           ├─ Step 3: Skills
                                           ├─ Step 4: Evidence
                                           ├─ Step 5: Availability
                                           ├─ Step 6: Track selection
                                           ├─ Step 7: Consent
                                           ├─ Step 8: Payout method (optional, can defer)
                                           └─ Step 9: Completion
                                                  │
                                                  ▼
                                            Dashboard (empty-but-ready)
                                                  │
                                                  ▼
                                            Assigned list ──→ Accept task
                                                  │
                                                  ▼
                                            Workroom ──→ Upload evidence ──→ Submit
                                                  │
                                                  ▼
                                            Submit success (under review)
                                                  │
                                                  ▼ (mentor accepts off-portal)
                                            Notification: "Accepted"
                                                  │
                                                  ▼
                                            Earnings shows new entry
                                            Credential issued (if applicable)
```

Decision points: declining a task (returns to Assigned), unaddressed criteria (warns at submit), no payout method (warn at acceptance, link to setup).

### Journey B — Returning user: daily flow

```
[SSO login] ─→ MFA (if required) ─→ Dashboard
                                       │
                                       ├─ "Continue working" hero → top-priority task
                                       │      ▼
                                       │   Workroom (resume)
                                       │
                                       ├─ Actionable inbox → revision feedback
                                       │      ▼
                                       │   Revision workroom → diff → corrections → resubmit
                                       │
                                       └─ Earnings strip glance
```

### Journey C — Revision recovery

```
Notification: "Revision requested" ─→ Revisions queue ─→ Revision detail
                                                              │
                                                              ▼
                                                       3-block feedback view
                                                              │
                                                              ├─ "What worked" (read)
                                                              ├─ "Required corrections" (checklist)
                                                              └─ "Optional suggestions" (read)
                                                              │
                                                              ▼
                                                       Diff viewer (v1 ↔ working)
                                                              │
                                                              ▼
                                                       Mark each correction addressed
                                                              │
                                                              ▼
                                                       Resubmit
```

Edge: if final round (round = totalRounds) and unaddressed corrections, harder warn — requires reason.

### Journey D — Blocker / clarification

```
Workroom ─→ "Request clarification" ─→ Q&A thread opens
                                            │
                                            ▼ (await reviewer reply)
                                       State: awaiting_clarification
                                            │
                                            ▼ (reviewer replies)
                                       Notification: "Reviewer responded"
                                            │
                                            ▼
                                       Resume workroom; state → in_progress
```

OR

```
Workroom ─→ "Report blocker" modal ─→ Reason + expected resolution
                                            │
                                            ▼
                                       State: blocked
                                            │
                                            ▼ (mentor or platform unblocks)
                                       Notification: "Unblocked"
                                            │
                                            ▼
                                       Resume workroom
```

### Journey E — Payout setup + withdrawal

```
Earnings overview ─→ "Set up payout" ─→ Choose method (bank/wallet/regional)
                                              │
                                              ▼
                                       Method form ─→ Verify ─→ Saved
                                              │
                                              ▼
                                       Earnings overview shows withdrawable balance
                                              │
                                              ▼
                                       Withdrawal request ─→ Confirm ─→ Pending
                                              │
                                              ▼ (admin / rail processes)
                                       Notification: "Payout sent"
```

### Journey F — Safety report (women workforce track required)

```
Support ─→ Safety report ─→ Form (optionally anonymous)
                                  │
                                  ▼
                             Submit ─→ Confirmation: case ID + 24h SLA promise
                                  │
                                  ▼ (governance team triages off-portal)
                             Notification: "Safety case update"
```

### Journey G — Credential share

```
Credentials wallet ─→ Credential detail ─→ "Share"
                                                │
                                                ▼
                                          Share modal (copy link, social, email)
                                                │
                                                ▼
                                          Public URL: /public/credentials/[shareId]
```

---

## 5. Screen-by-screen specification

> **Format:** every Phase 1 screen has the full block. Phase 2 stubs at the end have a one-line marker only. Shared patterns (e.g., scan-failed modal) are defined once in §6 and referenced by name.

### 5.A Authentication

#### 5.A.1 Landing / pre-auth handoff — `/`
**Phase 1** · SOW §3.1.MVP.8 (implicit)

**Use case:** unauthenticated user lands; route them to login or register based on intent.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ ▢ Glimmora                                          [ Help ] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│                  AI-governed work, evidence-paid               │
│                                                                │
│         A workspace where work is decomposed, matched,         │
│         delivered, and verified — end to end.                  │
│                                                                │
│              [ Log in ]        [ Create account ]              │
│                                                                │
│         Have an invite link? Open it from your email.          │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**States:** default · authenticated (auto-redirect to `/contributor/dashboard` or appropriate portal home).

**Edge cases:**
- User has a valid session → auto-redirect, do not show landing
- User has a pending invite token in URL → carry to register

**Cognitive load:** two clear choices (login / create). No marketing copy that requires reading.

**Accessibility:** focus on first CTA after mount; ESC does nothing (no modal).

---

#### 5.A.2 Login — `/auth/login`
**Phase 1** · SOW §3.1.MVP.8 · ✅ KEEP polish

**Use case:** authenticated identity exchange. Supports password, SSO, OAuth.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ ▢ Glimmora                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│                          Welcome back                          │
│                                                                │
│   ┌──────────────────────────────────────────────────────┐    │
│   │ Email                                                 │    │
│   │ [____________________________________]               │    │
│   │                                                       │    │
│   │ Password                            [ Forgot? ]      │    │
│   │ [____________________________________] [👁]          │    │
│   │                                                       │    │
│   │ ☐ Keep me signed in for 30 days                      │    │
│   │                                                       │    │
│   │             [    Log in    ]                          │    │
│   │                                                       │    │
│   │ ─────────────  or  ─────────────                     │    │
│   │                                                       │    │
│   │ [ 🔐 Continue with SSO ]                              │    │
│   │ [ 🅖 Continue with Google ]                           │    │
│   │ [ 🪟 Continue with Microsoft ]                        │    │
│   │                                                       │    │
│   │ New here? [ Create account ]                          │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**States:**
- default
- submitting (button spinner; inputs disabled)
- invalid_credentials (error banner above form)
- account_locked (banner with "contact support")
- mfa_required (auto-route to `/auth/mfa`)
- sso_required (banner: "Your organization requires SSO — click below")
- password_expired (auto-route to reset)

**Edge cases:**
- 3 failed attempts → soft rate limit (10s); 5 → hard lock (15 min) → escalation surface
- Email is enrolled in SSO-only org → password fields disabled, SSO CTA highlighted
- User opens login while already logged in → redirect
- User submits while keyboard layout differs (capslock) → hint banner

**Cognitive load:**
- Email + password is the default path because it's the most common; SSO is one click below
- "Forgot?" is inline near the field, not buried
- "Create account" lives at the bottom so it doesn't compete with login

**Decision heuristic:** "Which auth method?" → if invited by enterprise, SSO. Otherwise email/password.

**Accessibility:** focus order email → password → forgot → keep → submit → SSO buttons → register. ESC clears focused field. Password reveal toggle has `aria-pressed`.

**Cross-portal:** on successful auth, route to `/<portal>/dashboard` based on role (`session.user.role`).

---

#### 5.A.3 Register — `/auth/register`
**Phase 1** · SOW §3.1.MVP.3 · 🔧 WIRE

**Use case:** new user creates an account; route to onboarding after email verification.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ ▢ Glimmora                                                    │
├──────────────────────────────────────────────────────────────┤
│                       Create your account                      │
│                                                                │
│   ┌──────────────────────────────────────────────────────┐    │
│   │ Full name                                             │    │
│   │ [____________________________________]               │    │
│   │                                                       │    │
│   │ Email                                                 │    │
│   │ [____________________________________]               │    │
│   │                                                       │    │
│   │ Password                                              │    │
│   │ [____________________________________] [👁]          │    │
│   │ ▓▓▓▓░░░░░░ Strong enough                              │    │
│   │                                                       │    │
│   │ ☐ I agree to the Terms and Privacy Policy            │    │
│   │                                                       │    │
│   │           [   Create account   ]                      │    │
│   │                                                       │    │
│   │ ─────────────  or  ─────────────                     │    │
│   │                                                       │    │
│   │ [ 🅖 Continue with Google ]                           │    │
│   │ [ 🪟 Continue with Microsoft ]                        │    │
│   │                                                       │    │
│   │ Already have an account? [ Log in ]                   │    │
│   └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

**States:** default · submitting · email_already_exists · invalid_password (with specific reason) · captcha_required · invite_token_present (banner: "You've been invited by [org]")

**Edge cases:**
- Email already exists → "Already have an account? Log in" with email pre-filled
- Password fails strength → list of unmet criteria inline (not after submit)
- Invite token in URL → mark account as pre-attached to enterprise/track on creation
- Terms unchecked at submit → highlight checkbox, no submit

**Cognitive load:**
- Single column, no decorative fields, no captcha by default (added only if abuse detected server-side)
- Password strength meter is live, not on blur — feedback before friction
- One T&C checkbox; details linked, not nested

**Accessibility:** field labels above inputs; password meter announces via `aria-live="polite"`; required fields marked with `aria-required` and visual asterisk.

**Post-condition:** on success → `/auth/verify-otp?email=<email>` and a verification code is emailed.

---

#### 5.A.4 Email OTP verification — `/auth/verify-otp`
**Phase 1** · SOW §3.1.MVP.3, §3.1.MVP.8 · ✅ KEEP

**Use case:** prove the user owns the email address before they can proceed to onboarding.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back                                                        │
│                                                                │
│              Check your inbox                                  │
│              We sent a 6-digit code to                         │
│              kavi@example.com  [edit]                          │
│                                                                │
│              [ _ ][ _ ][ _ ][ _ ][ _ ][ _ ]                   │
│                                                                │
│              Resend code in 0:47                               │
│                                                                │
│                    [   Verify   ]                              │
│                                                                │
│              Trouble? [ Contact support ]                      │
└──────────────────────────────────────────────────────────────┘
```

**States:** default · submitting · invalid_code · expired_code · max_attempts · resending · resent_success

**Edge cases:**
- User pastes code from email → auto-split across 6 boxes; auto-submit if length is 6
- Code expired (>10 min) → show "Code expired. Resend?"
- Wrong code 5x → lock 15 min, contact support
- User edits email → returns to register screen with email pre-filled
- User landed here without a pending verification → redirect to login

**Cognitive load:** countdown reduces "did the email get lost?" anxiety. Edit link prevents lockout from a typo.

**Accessibility:** boxes focus left-to-right; backspace deletes and moves left; aria-label per box ("Digit 1 of 6").

**Post-condition:** on verify → if onboarding incomplete `/contributor/onboarding`, else `/contributor/dashboard`.

---

#### 5.A.5 Forgot password — `/auth/forgot-password`
**Phase 1** · SOW §3.1.MVP.8 · ✅ KEEP

**Use case:** user can't log in; request reset code.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to log in                                              │
│                                                                │
│              Reset your password                               │
│              Enter the email on your account.                  │
│                                                                │
│              [____________________________________]            │
│                                                                │
│                    [ Send reset code ]                         │
└──────────────────────────────────────────────────────────────┘
```

**States:** default · submitting · sent (regardless of whether the email exists — security: don't leak account existence)

**Edge cases:**
- Email doesn't exist → still show "If we have an account for this email, you'll get a code" — never leak
- Email exists but is SSO-only → message: "Your organization manages this account. Contact your admin."

**Cross-portal:** for SSO-only emails, also dispatch a notification to the enterprise admin (cross-functional concern).

---

#### 5.A.6 Reset password — `/auth/reset-password?token=...`
**Phase 1** · SOW §3.1.MVP.8 · ✅ KEEP

**Use case:** token from email arrives at this route; user sets new password.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│              Set a new password                                │
│                                                                │
│   New password                                                 │
│   [____________________________________] [👁]                  │
│   ▓▓▓▓░░░░ Strong enough                                       │
│                                                                │
│   Confirm new password                                         │
│   [____________________________________] [👁]                  │
│                                                                │
│              [   Update password   ]                           │
└──────────────────────────────────────────────────────────────┘
```

**States:** default · token_expired (link to request again) · token_invalid · submitting · success (auto-route to login with success banner)

**Edge cases:** token used twice → invalid; passwords don't match → inline error not on submit.

---

#### 5.A.7 MFA setup — `/auth/mfa/setup`
**Phase 1** · SOW §3.1.MVP.8 · 🔧 WIRE (UI exists, backend partial)

**Use case:** one-time configuration of a second factor.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│  Add a second factor                                           │
│                                                                │
│  Choose how you want to confirm it's you when you sign in.    │
│                                                                │
│  ◉ Authenticator app   (recommended)                          │
│      Use Google Authenticator, 1Password, etc.                │
│  ○ SMS code                                                    │
│      Get a code by text. Less secure.                         │
│  ○ Email code                                                  │
│      Get a code by email. Use as a fallback.                  │
│                                                                │
│              [   Continue   ]                                  │
└──────────────────────────────────────────────────────────────┘
```

Then, on Authenticator app:
```
┌──────────────────────────────────────────────────────────────┐
│  Scan this QR code in your authenticator app                  │
│                                                                │
│         ▓▓▓▓▓▓▓ QR ▓▓▓▓▓▓▓                                    │
│         ▓               ▓                                      │
│         ▓               ▓                                      │
│         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                       │
│                                                                │
│  Or enter the code manually: ABCD-EFGH-IJKL-MNOP             │
│                                                                │
│  Enter the 6-digit code from your app:                        │
│  [ _ ][ _ ][ _ ][ _ ][ _ ][ _ ]                               │
│                                                                │
│              [   Verify and enable   ]                         │
└──────────────────────────────────────────────────────────────┘
```

Then backup codes:
```
┌──────────────────────────────────────────────────────────────┐
│  Save these backup codes                                       │
│                                                                │
│  Use a code if you lose access to your authenticator.         │
│                                                                │
│  ┌─────────────────────────────────────────┐                  │
│  │ 1AB2-CD3E   2FG4-HI5J   6KL7-MN8O       │                  │
│  │ 3PQ4-RS5T   7UV6-WX7Y   8YZ9-AB0C       │                  │
│  │ 4DE5-FG6H   9IJ0-KL1M   0NO1-PQ2R       │                  │
│  │ 5RS6-TU7V                                │                  │
│  └─────────────────────────────────────────┘                  │
│                                                                │
│  [ Copy codes ]   [ Download as .txt ]                        │
│                                                                │
│  ☐ I've saved these somewhere safe                            │
│                                                                │
│              [   Finish   ]                                    │
└──────────────────────────────────────────────────────────────┘
```

**States:** method_choice · authenticator_setup · sms_setup (with phone OTP) · email_setup · backup_codes · success

**Edge cases:** user closes mid-setup → method stays unselected, can retry; backup codes shown only once.

**Cognitive load:** recommend the best option (authenticator), but allow fallbacks. Backup codes presented before completion, not buried in settings.

---

#### 5.A.8 MFA challenge — `/auth/mfa`
**Phase 1** · SOW §3.1.MVP.8 · ✅ KEEP

**Use case:** during login, prompt for second factor.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│  Confirm it's you                                              │
│                                                                │
│  Enter the 6-digit code from your authenticator app.          │
│                                                                │
│  [ _ ][ _ ][ _ ][ _ ][ _ ][ _ ]                               │
│                                                                │
│  ☐ Trust this device for 30 days                              │
│                                                                │
│              [   Verify   ]                                    │
│                                                                │
│  Use a [ backup code ] · [ SMS instead ]                      │
└──────────────────────────────────────────────────────────────┘
```

**States:** default · submitting · invalid · max_attempts (lock out)
**Edge:** trusted device → next 30 days skip MFA from same fingerprint.

---

#### 5.A.9 SSO redirect interstitial — `/auth/sso/[provider]`
**Phase 1** · SOW §3.1.MVP.8 · 🚧 BUILD (SAML/OIDC enterprise)

**Use case:** while NextAuth exchanges code with IdP, show a friendly waiting screen.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│                                                                │
│              Redirecting to [Provider]…                        │
│                                                                │
│              [spinner]                                         │
│                                                                │
│              Taking longer than usual? [ Try again ]           │
└──────────────────────────────────────────────────────────────┘
```

**States:** redirecting · success (route on) · provider_error (banner with retry)

---

#### 5.A.10 First-time SSO completion — `/contributor/onboarding?sso=true`
**Phase 1** · SOW §3.1.MVP.3 · 🔧 WIRE

**Use case:** an SSO user lands and has never onboarded. Most identity is pre-filled from the IdP claims.

Wireframe: same as onboarding shell (§5.B.1) but with banner:
```
┌──────────────────────────────────────────────────────────────┐
│ ℹ Welcome from [Acme Corp]. Some details have been           │
│   pre-filled from your sign-in. Review and continue.         │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.A.11 Session expired modal (global pattern)
**Phase 1** · ✅ KEEP

**Use case:** background API call returns 401; surface a non-destructive prompt.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│  Session expired                                               │
│                                                                │
│  For your security, your session ended. Please sign in        │
│  again to continue. Your work is saved.                       │
│                                                                │
│              [ Sign in again ]                                 │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** save unsaved local form state before redirect (Workroom draft notes).

---

### 5.B Onboarding

The onboarding flow is a shell with 9 sequential steps. Skipping is allowed for steps 4 (evidence), 6 (track), 8 (payout). Required: steps 1, 2, 3, 5, 7, 9.

#### 5.B.1 Onboarding shell — `/contributor/onboarding`
**Phase 1** · SOW §3.1.MVP.3 · 🔧 WIRE

**Use case:** wraps every onboarding step with progress, persistent save, and exit handling.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ ▢ Glimmora                                          [ Exit ]  │
├──────────────────────────────────────────────────────────────┤
│ Step 3 of 9 · Skills                                  ●●●○○○○○○│
├──────────────────────────────────────────────────────────────┤
│                                                                │
│       [   STEP CONTENT GOES HERE   ]                           │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│ [ ← Back ]                          [ Skip ] [ Continue → ]   │
└──────────────────────────────────────────────────────────────┘
```

**States:** in_progress · saving_step · step_error

**Edge cases:**
- User clicks Exit → modal "Save progress and come back later?" with Save / Discard / Cancel
- Browser refresh → resume from last completed step
- User completes step 9 → redirect to `/contributor/dashboard`
- Onboarding-required attribute missing later → re-enter onboarding at the missing step

**Cognitive load:** progress dots visible always; "Step X of 9" anchors location. Skip is visually quieter than Continue (decision asymmetry — we prefer completion).

**Accessibility:** step indicator has `role="progressbar"` with `aria-valuenow`/`aria-valuemax`.

---

#### 5.B.2 Step 1: Welcome + role confirmation
**Phase 1** · SOW §3.1.MVP.3

**Use case:** confirm the contributor's track at the start. For SSO/invited users, pre-selected.

**Wireframe (content inside shell):**
```
        Welcome, Kavi

        How will you contribute?

        ┌────────────────┐  ┌────────────────┐
        │ 💼              │  │ 🎓              │
        │ Internal       │  │ Student         │
        │ employee       │  │                 │
        │                │  │                 │
        │ My company     │  │ Through my      │
        │ uses Glimmora  │  │ university      │
        └────────────────┘  └────────────────┘

        ┌────────────────┐  ┌────────────────┐
        │ 👩              │  │ 🌍              │
        │ Women          │  │ Freelance       │
        │ workforce      │  │                 │
        │                │  │                 │
        │ Flexible work, │  │ Independent     │
        │ supported      │  │ contributor     │
        └────────────────┘  └────────────────┘
```

**Edge:** if invited via partner program, lock track and explain why.

**Cognitive load:** four large cards with icon + verb + one-line description. No long copy.

---

#### 5.B.3 Step 2: Identity verification
**Phase 1** · SOW §3.1.MVP.3, §20.1 · 🚧 BUILD

**Use case:** confirm legal identity to the level required by the track.

**Wireframe (Internal employee — minimal; identity flows from HRIS):**
```
        Confirm your identity

        Name (from your company directory)
        Kavi Senthil — Designer · Acme Corp

        Employee ID
        AC-04812

        ✓ Verified by Acme Corp HRIS

        [ Continue → ]
```

**Wireframe (Student — institutional verification):**
```
        Confirm your student status

        We'll send a verification request to your university.

        University
        [ Anna University ▾ ]

        University email
        [____________________________________]

        Student ID (if known)
        [____________________________________]

        ℹ Your university will confirm your enrollment within
          24 hours. You can keep going while we wait.

        [ Continue → ]
```

**Wireframe (Women workforce — lightweight KYC):**
```
        Confirm your identity

        Full legal name
        [____________________________________]

        Date of birth
        [ DD / MM / YYYY ]

        Country of residence
        [ India ▾ ]

        Upload ID (Aadhaar / PAN / Passport)
        [ + Drag a photo or PDF ]   max 5 MB

        ℹ Your ID is encrypted and used only for verification.
          We never share it.

        [ Continue → ]
```

**States:** form_default · uploading_id · id_scan_pending · id_scan_complete · id_scan_failed · waiting_for_university_confirmation

**Edge cases:**
- Internal: HRIS data missing → fall back to manual form with admin notification
- Student: university not in dropdown → free-text "Other" with manual review queue
- Women: ID upload corrupt / unreadable → reupload with hint
- Underage (< 18) → block with explanatory message

**Cognitive load:** persona-specific form; the contributor never sees fields irrelevant to their track. KYC explanation inline, not modal.

**Accessibility:** file uploads have visible filename + remove button; ID inputs masked but reveal-toggle present.

**Cross-portal:** writes to immutable audit (`identity_verification_submitted`); platform admin (Glimmora-side) sees a manual-review queue for fallbacks.

---

#### 5.B.4 Step 3: Skills self-declaration
**Phase 1** · SOW §3.1.MVP.3 · 🔧 WIRE

**Use case:** capture the initial skill set that seeds matching.

**Wireframe:**
```
        What can you do?

        Add up to 12 skills. You can refine these later.

        ┌──────────────────────────────────────────────┐
        │ Search skills...                              │
        │ [____________________________________] 🔍    │
        └──────────────────────────────────────────────┘

        Suggested for you:
        [ React ] [ TypeScript ] [ UX design ] [ +5 more ]

        Your skills (3 of 12):

        ┌──────────────────────────────────────────────┐
        │ React                              [Level: L2 ▾] │
        │ ●●○○                                       [✕] │
        ├──────────────────────────────────────────────┤
        │ Figma                              [Level: L3 ▾] │
        │ ●●●○                                       [✕] │
        ├──────────────────────────────────────────────┤
        │ Accessibility (WCAG)               [Level: L2 ▾] │
        │ ●●○○                                       [✕] │
        └──────────────────────────────────────────────┘

        [ Continue → ]
```

**Level meanings (tooltips):**
- L1 — Familiar (have done it; need supervision)
- L2 — Competent (can deliver to spec)
- L3 — Strong (can deliver to spec and help others)
- L4 — Expert (can shape the spec)

**States:** default · searching · adding · saving · max_reached (>12)

**Edge cases:**
- Skill doesn't exist in taxonomy → "Suggest a new skill" with manual review (admin-side)
- Two skills with similar names → deduplicate suggestion ("React = ReactJS")
- Levels all set to L4 → soft hint: "Level honesty improves matching"

**Cognitive load:** suggestions reduce the cold-start problem. Search-as-you-type. Level dropdown is in-place, not a modal.

**Decision heuristic:** "Which level am I?" → tooltip with one-line guidance + a Bayesian framing ("Most contributors start at L1-L2")

**Cross-portal:** skills feed the Talent Intelligence Graph (cross-functional doc 05).

---

#### 5.B.5 Step 4: Evidence attachments
**Phase 1, optional** · SOW §3.1.MVP.3

**Use case:** attach evidence (links, files) backing one or more declared skills. Skippable.

**Wireframe:**
```
        Show your work (optional)

        Attach links or files for any of your skills. Reviewers
        can see these later.

        ┌──────────────────────────────────────────────┐
        │ React                                          │
        │ ┌──────────────────────────────────────────┐ │
        │ │ Link  ▾  https://github.com/me/portfolio │ │
        │ └──────────────────────────────────────────┘ │
        │ [ + Add another for React ]                   │
        ├──────────────────────────────────────────────┤
        │ Figma                                          │
        │ ┌──────────────────────────────────────────┐ │
        │ │ Drop a file or paste a link               │ │
        │ └──────────────────────────────────────────┘ │
        ├──────────────────────────────────────────────┤
        │ Accessibility (WCAG)                           │
        │ ┌──────────────────────────────────────────┐ │
        │ │ Drop a file or paste a link               │ │
        │ └──────────────────────────────────────────┘ │
        └──────────────────────────────────────────────┘

        [ Skip ]                            [ Continue → ]
```

**States:** default · uploading_file · scanning · scan_failed · link_invalid

**Edge cases:**
- File > 20 MB → reject with size message
- Scan finds malware → drop, message
- Link returns 404 → save anyway but warn

---

#### 5.B.6 Step 5: Availability + timezone
**Phase 1** · SOW §3.1.5 · ✅ KEEP

**Use case:** declare working hours and timezone — feeds matching availability signal.

**Wireframe:**
```
        When are you available?

        Timezone
        [ Asia/Kolkata (IST, UTC+5:30) ▾ ]

        Working hours
        ┌────┬────┬────┬────┬────┬────┬────┐
        │Mon │Tue │Wed │Thu │Fri │Sat │Sun │
        ├────┼────┼────┼────┼────┼────┼────┤
        │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │    │    │
        └────┴────┴────┴────┴────┴────┴────┘
        From [ 09:00 ▾ ]  to  [ 18:00 ▾ ]

        Approximate hours per week
        ○ < 10 hrs   ◉ 10–20 hrs   ○ 20–40 hrs   ○ Full time

        [ Continue → ]
```

**Edge:** timezone auto-detected from browser; user can override.

**Cognitive load:** working-hours grid is the same shape as a calendar. No precise minute granularity — buckets are enough for matching.

---

#### 5.B.7 Step 6: Track-specific tailoring
**Phase 1, optional** · SOW §20.1, §20.2

**Use case:** track-conditional questions. For students: supervisor consent. For women workforce: optional safety opt-ins.

**Wireframe (Women workforce):**
```
        A few preferences

        We use these to tailor what we surface to you.
        You can change them anytime.

        ☐ Prefer tasks I can do in shorter sessions
            (≤ 2 hours per work block)

        ☐ Prefer tasks where the reviewer is also a woman
            (when available)

        ☐ Show me only tasks with verified enterprises

        ☐ I'd like a peer mentor to check in monthly

        [ Skip ]                            [ Continue → ]
```

**Wireframe (Student):**
```
        University supervision

        Most student tasks need supervisor sign-off.

        Supervisor name
        [____________________________________]

        Supervisor email
        [____________________________________]

        ☐ My supervisor has approved my participation

        [ Skip ]                            [ Continue → ]
```

**Cognitive load:** opt-in checkboxes, no pressure to fill. Quiet language.

---

#### 5.B.8 Step 7: Consent capture
**Phase 1** · SOW §3.1.MVP.3, §20.3 · 🔧 WIRE

**Use case:** explicit consent for terms, data use, payout, and (where applicable) AI assistance.

**Wireframe:**
```
        Consent

        ☐ I agree to the Terms of Service
            [ Read the terms ↗ ]
        ☐ I agree to the Privacy Policy
            [ How we handle your data ↗ ]
        ☐ I consent to receive task-related notifications
            (email, SMS for critical updates)
        ☐ I consent to AI-assisted work guidance
            (you can turn this off in settings)

        Optional:
        ☐ I'm willing to be contacted for short surveys (≤ 4 / yr)

        [ Continue → ]
```

**Edge cases:**
- Any required (top 4) unchecked → continue button disabled
- Click outbound link → opens in new tab; consent state preserved

**Cross-portal:** writes consent record to immutable audit (cross-functional doc 05).

---

#### 5.B.9 Step 8: Payout method (deferable)
**Phase 1, deferable** · SOW §3.1.MVP.6 · 🚧 BUILD

**Use case:** set up how you'll get paid. Skippable — you only need it when your first task is accepted.

See §5.L.4 for the full payout method form. Onboarding step 8 is a thin wrapper around that form with a "Skip for now, I'll set it up later" link.

---

#### 5.B.10 Step 9: Completion
**Phase 1** · ✅ KEEP

**Wireframe:**
```
        You're set up.

        [✓] Identity confirmed
        [✓] Skills added (3)
        [✓] Availability set
        [✓] Consent recorded
        [—] Payout method (set up later)

        We're matching you to tasks now. You'll see them in
        your dashboard within a minute.

        [ Take me to my dashboard → ]
```

**Edge:** if matching needs time, the dashboard shows an "empty but ready" state (§5.C.2).

---

#### 5.B.11 Onboarding incomplete — exit modal
**Phase 1** · ✅ KEEP

**Use case:** user clicks Exit mid-onboarding.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│  Come back later?                                              │
│                                                                │
│  We'll save your progress. You can finish from your           │
│  dashboard next time.                                         │
│                                                                │
│              [ Cancel ]      [ Save and exit ]                │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.C Dashboard

#### 5.C.1 Dashboard (home) — `/contributor/dashboard`
**Phase 1** · SOW §3.1.5 · 🔧 WIRE

**Use case:** orient a returning contributor; surface the single highest-value action.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ Today · Tuesday, May 26                                        │
│ Good afternoon, Kavi                                           │
│ 3 tasks active · 1 needs your attention                       │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ CONTINUE WORKING                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ HERO TASK CARD                                            │ │
│ │  Date Picker · FocusScope sketch · Revision · Round 2   │ │
│ │  ▓▓▓▓▓▓▓░░░ 65% ready · 3h to deadline                  │ │
│ │  Mentor: Priya Iyer                                       │ │
│ │  [ Open workroom → ]                                      │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────┐ ┌──────────────┐                            │
│ │ Supporting 1 │ │ Supporting 2 │                            │
│ │ Empty state  │ │ Empty state  │                            │
│ │ illust.      │ │ illust.      │                            │
│ │ Reporting    │ │ Auth modal   │                            │
│ │ CSV export   │ │ ↗ Workroom   │                            │
│ │ ↗ Workroom   │ │              │                            │
│ └──────────────┘ └──────────────┘                            │
├──────────────────────────────────────────────────────────────┤
│ LIFECYCLE                                                      │
│ ● Assigned 2 — ● In progress 3 — ● Submitted 1 — ● Accepted 14│
├──────────────────────────────────────────────────────────────┤
│ EARNINGS                                                       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │This week │ │This month│ │Acceptance│ │ Streak   │         │
│ │ ₹12,400  │ │ ₹42,800  │ │   92%    │ │ 8 days   │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
├──────────────────────────────────────────────────────────────┤
│ INBOX                                                          │
│ ⚠ Revision requested · Date Picker · 1h ago             [ → ] │
│ 💬 Reviewer replied · CSV export · 5h ago               [ → ] │
│ ✓ Task accepted · Auth modal · yesterday                [ → ] │
├──────────────────────────────────────────────────────────────┤
│ AI SIGNALS                                                     │
│ › 4 criteria still unaddressed on Date Picker.                │
│ › Your acceptance rate this month (92%) is your best yet.     │
└──────────────────────────────────────────────────────────────┘
```

**States:** default · empty (no tasks) · loading · degraded (some data missing)

**Edge cases:**
- No active tasks → see §5.C.2
- All tasks have 0% readiness → "Continue working" hides hero, shows "Start a task" CTA
- Earnings = 0 → show "When you complete tasks, earnings appear here"
- Inbox > 10 items → show top 5 with "See all"

**Cognitive load:**
- ONE hero CTA, never two — the dashboard's job is to pick the single best next action and surface it
- KPIs are observations, not targets (no progress bars threatening incompleteness)
- AI signals quiet at the bottom, not interrupting flow

**Decision heuristic:** "What should I do now?" → answered by the hero. Always.

---

#### 5.C.2 Dashboard — empty-but-ready
**Phase 1** · SOW §3.1.5

**Use case:** just-onboarded contributor with no tasks yet.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ Today · Tuesday, May 26                                        │
│ Welcome, Kavi.                                                 │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│            [illustration: empty desk, calm]                    │
│                                                                │
│            You're ready to receive work.                       │
│            We're matching you to tasks now —                   │
│            you'll usually see something within an hour.        │
│                                                                │
│            While you wait:                                     │
│            [ Polish your profile ]                             │
│            [ Add more evidence to your skills ]                │
│            [ Set up your payout method ]                       │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**Cognitive load:** sets expectation (within an hour); offers productive waiting options; no false sense of being broken.

---

#### 5.C.3 Persona-conditional dashboard modules
**Phase 1** · SOW §20.1, §20.2, §20.3

**Use case:** the same dashboard shell renders a track-specific module in one slot, between **Lifecycle** and **Earnings**. The module appears only when the contributor's track requires it. Multi-track contributors see one module per active track, stacked (max 2).

##### 5.C.3.a Internal employee — no extra module

Internal contributors get an **org chip in the header**, not a separate card. The dashboard is otherwise identical to the base layout.

```
┌──────────────────────────────────────────────────────────────┐
│ Today · Tuesday, May 26   [Acme Corp · Design org]           │
│ Good afternoon, Kavi                                           │
└──────────────────────────────────────────────────────────────┘
```

**Rationale:** internal employees have all org context from their corporate identity; the dashboard doesn't need to remind them. Adding a card would be redundant noise.

---

##### 5.C.3.b Student — Supervision module

```
┌──────────────────────────────────────────────────────────────┐
│ SUPERVISION                                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Dr. Murthy · Anna University                              │ │
│ │ ✓ Approved your participation this term                  │ │
│ │                                                            │ │
│ │ Academic recognition                                       │ │
│ │ ▓▓▓▓▓▓░░░░ 3 of 5 tasks counting toward                  │ │
│ │            your internship credit                          │ │
│ │                                                            │ │
│ │ Term ends: July 15, 2026                                  │ │
│ │ [ Contact supervisor ]   [ View academic mapping ]        │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Edge cases:**
- Supervisor approval expired → card switches to warning: "Renew supervisor approval to continue"
- No academic credit configured → hide "Academic recognition" sub-block
- Term ending in < 7 days → soft reminder "Wrap up tasks before [date]"

**Decision heuristic:** "Am I on track for credit?" → progress bar answers in one glance.

**Cross-portal:** supervisor approval and credit mapping come from the platform admin's university-partnership console (doc 04).

---

##### 5.C.3.c Women workforce — Check-in module

```
┌──────────────────────────────────────────────────────────────┐
│ YOUR SUPPORT                                                   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Peer mentor                                                │ │
│ │ [LA] Lakshmi Ananth                                       │ │
│ │ Next check-in: this Friday, 30 min                        │ │
│ │ [ Reschedule ]   [ Skip this one ]                        │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ Preferences active                                         │ │
│ │ ✓ Short-session tasks (≤2h blocks) preferred              │ │
│ │ ✓ Women reviewers when available                          │ │
│ │ [ Adjust preferences ]                                     │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ Safety & support always available                          │ │
│ │ [ Report concern ]   [ Open grievance ]                   │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Edge cases:**
- Peer mentor not yet assigned → card shows "We're matching you to a mentor; expect within 48h"
- No active preferences → "Set preferences to tailor your work" with link to settings
- Recent safety report open → status pill at top: "Case GR-1042 · in progress · response due in 18h"

**Decision heuristic:** "Where do I go if something's wrong?" → safety/grievance always one click, never buried.

**Cross-portal:** peer mentor sessions live in the mentor portal (doc 03); the safety/grievance backend lives in platform admin governance (doc 04).

---

##### 5.C.3.d External freelancer — no Phase 1 module

Phase 1: no extra module. The dashboard shell is sufficient.

Phase 2 module preview (not built in Phase 1):
- **Cross-client context** when working with multiple enterprises
- **Tax & compliance reminders** (e.g. quarterly filings, 1099/Form 16 generation)
- **Reputation summary** for portfolio export

---

##### 5.C.3.e Multi-track stacking

A contributor with two active tracks (e.g. "student + women workforce") sees both modules stacked, student first:

```
[Continue working]
[Lifecycle]
[Supervision module]        ← student
[Your support module]       ← women workforce
[Earnings strip]
[Inbox]
[AI signals]
```

**Rationale for the stack order:** track with the most pending action goes first. Default rule: supervision (time-bound) → support → others.

**Cognitive load:** capping at two prevents the dashboard from becoming a noticeboard. If a future track count grows, we surface a "All my tracks" link instead of stacking three.

---

### 5.D Assigned work (queue)

#### 5.D.1 Assigned list — `/contributor/tasks`
**Phase 1** · SOW §3.1.MVP.4 · ✅ KEEP polish

**Use case:** the queue of every task currently assigned to the contributor (any state pre-completion).

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ My Work                                                        │
│ Your assigned workload                                         │
│ [ Scope: My work ] [ Project: All ] [ Skill: All ] [ This wk ]│
├──────────────────────────────────────────────────────────────┤
│ Summary                                                        │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │ Active │ │Awaiting│ │ Ready  │ │Revision│ │ Capacity│       │
│ │   4    │ │   1    │ │   2    │ │   1    │ │ 70%    │       │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
├──────────────────────────────────────────────────────────────┤
│ [All 8] [In progress 4] [Awaiting 1] [Ready 2] [Revision 1]  │
├──────────────────────────────────────────────────────────────┤
│ TASK             │ STATUS    │ DUE   │ READINESS │LAST│ →    │
│ ─────────────────┼───────────┼───────┼───────────┼────┼─────  │
│ Date Picker      │ Revision  │  3h   │ ▓▓▓ 65%   │ 1h │[→]   │
│ CSV export       │ Awaiting  │  2d   │ ▓░░ 30%   │ 5h │[→]   │
│ Auth modal       │ In prog.  │  4d   │ ▓▓░ 50%   │ 2d │[→]   │
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ Rows per page [12] · 1–8 of 8                                 │
└──────────────────────────────────────────────────────────────┘
```

**States:** default · empty · loading · filter_no_results

**Edge cases:**
- Capacity > 90% → soft warn at top (not blocking): "You may be overcommitted. Consider declining new tasks."
- Task hits deadline → row shows "Overdue Xh" in error tone
- Bulk actions: not supported in Phase 1 (one task = one workroom)

**Cognitive load:**
- Summary KPIs answer "how busy am I?"
- Filter pills answer "what state am I looking for?"
- Sortable by Due, Readiness — sticky default sort by priority (revision → ready → in_progress → blocked → awaiting → assigned → accepted)

**Decision heuristic:** rows ordered so the row that needs you most is on top.

**Cross-portal:** task data sourced from cross-functional Task store (doc 05); status chips and SLA logic from cross-functional state machine.

---

#### 5.D.2 Filter drawer
**Phase 1** · ✅ KEEP

**Use case:** narrow the queue.

**Wireframe (slides in from right):**
```
┌──────────────────────────────────────────┐
│  Filters                            [ ✕ ] │
├──────────────────────────────────────────┤
│  State                                    │
│  ☐ Assigned                               │
│  ☐ Accepted                               │
│  ☑ In progress                            │
│  ☐ Blocked                                │
│  ☐ Awaiting clarification                 │
│  ☑ Ready to submit                        │
│  ☑ Revision requested                     │
│                                            │
│  Project                                   │
│  [ All projects ▾ ]                       │
│                                            │
│  Skill                                     │
│  [ All skills ▾ ]                         │
│                                            │
│  Priority                                  │
│  ◉ Any  ○ P0 only  ○ P0 + P1              │
│                                            │
│  Due                                       │
│  ○ Any   ◉ This week   ○ Overdue          │
│                                            │
│  [ Reset ]               [ Apply 3 filters ]│
└──────────────────────────────────────────┘
```

**Edge:** filters persisted in URL query string.

---

#### 5.D.3 Task row preview popover
**Phase 1** · ✅ KEEP

**Use case:** hover/focus a row → see project + mentor + brief excerpt without leaving the list.

**Wireframe:**
```
┌──────────────────────────────────────────┐
│  Date Picker · FocusScope sketch          │
│  Project · Helios Design System           │
│  Mentor · Priya Iyer                      │
│  Skill · React · L2                       │
│                                            │
│  "Implement focus management for the      │
│  date picker overlay. Trap focus on open  │
│  and restore on close."                   │
│                                            │
│  [ Open workroom → ]                      │
└──────────────────────────────────────────┘
```

---

#### 5.D.4 Accept / decline modal
**Phase 1** · SOW §3.1.MVP.4 · 🔧 WIRE

**Use case:** assigned (not yet accepted) tasks need an explicit accept or decline.

**Accept (one-click + confirm):**
```
┌──────────────────────────────────────────────────────────────┐
│  Accept this task?                                             │
│                                                                │
│  Date Picker · FocusScope sketch                              │
│  Due in 4 days · ₹1,200 on acceptance                         │
│                                                                │
│  You'll have 30 minutes to step back if you change your mind. │
│                                                                │
│  [ Cancel ]                              [ Accept and open ]  │
└──────────────────────────────────────────────────────────────┘
```

**Decline:**
```
┌──────────────────────────────────────────────────────────────┐
│  Decline this task?                                            │
│                                                                │
│  Help us improve matching — why are you declining?            │
│                                                                │
│  ○ I don't have the right skills                              │
│  ○ I don't have capacity                                       │
│  ○ The deadline is too tight                                   │
│  ○ Conflict with another task                                  │
│  ○ Other — [ ______________ ]                                 │
│                                                                │
│  [ Cancel ]                              [ Decline task ]     │
└──────────────────────────────────────────────────────────────┘
```

**Edge cases:**
- 3+ declines in a week from one contributor → matching weight adjusts (cross-functional doc 05)
- Decline within 30 min of acceptance → soft "Are you sure? You just accepted this."

**Cognitive load:** reasons feed the matching engine; choosing is one click each.

---

### 5.E Workroom (per task)

The workroom is the most important screen in the portal. It's a 4-zone layout:
- **A. Header** (sticky top) — context + state
- **B. Work pane** (~60%) — brief, criteria, evidence, working notes
- **C. Context rail** (~40%, sticky) — progress, mentor, AI signals, references
- **D. Action footer** (sticky bottom) — readiness + Save draft + Submit

#### 5.E.1 Workroom overview — `/contributor/tasks/[taskId]`
**Phase 1** · SOW §3.1.MVP.5 · ✅ KEEP (already polished V3)

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Tasks · Helios · Date Picker · FocusScope sketch                            │
│ Round 2 of 3 · Revision requested · Mentor: Priya Iyer · Due in 3h            │
├──────────────────────────────────────────────────────────────────────────────┤
│ WORK PANE (60%)                          │ CONTEXT RAIL (40%)                  │
│ ┌─────────────────────────────────────┐ │ ┌─────────────────────────────────┐│
│ │ Brief                                │ │ │ Progress                         ││
│ │ Implement focus management for the   │ │ │ ● Accepted                       ││
│ │ date picker overlay. Trap focus on   │ │ │ ● In progress                    ││
│ │ open and restore on close...         │ │ │ ◉ Revision (current)             ││
│ │                                       │ │ │ ○ Submitted                       ││
│ │ Acceptance criteria (4 of 6)         │ │ │ ○ Accepted                        ││
│ │ ✓ Focus trap on open                 │ │ ├─────────────────────────────────┤│
│ │ ✓ ESC closes and restores focus      │ │ │ Reviewer                         ││
│ │ ✓ TAB cycles within picker            │ │ │ [PI] Priya Iyer                  ││
│ │ ✓ SHIFT-TAB reverses cycle            │ │ │      Lead · Design Systems       ││
│ │ ☐ Screen reader announces month change│ │ │ [Ask reviewer]                   ││
│ │ ☐ Mobile touch outside dismisses     │ │ ├─────────────────────────────────┤│
│ │                                       │ │ │ ✦ AI signals                     ││
│ │ Reviewer feedback (round 1)          │ │ │ › 2 criteria unaddressed —       ││
│ │ ▶ What worked                        │ │ │   fastest path to acceptance.    ││
│ │ ▶ Required corrections (2)           │ │ │ › Readiness 65% — almost ready.  ││
│ │ ▶ Optional suggestions (1)           │ │ ├─────────────────────────────────┤│
│ │                                       │ │ │ References                       ││
│ │ Working notes                        │ │ │ ↗ FocusScope MDN                 ││
│ │ [textarea: 412 / 5000]               │ │ │ ↗ WAI-ARIA dialog pattern        ││
│ │                                       │ │ └─────────────────────────────────┘│
│ │ Evidence (3 files)                   │ │                                      │
│ │ ┌────────────────────────────────┐  │ │                                      │
│ │ │ 📄 spec.md       42KB  ✓ scan  │  │ │                                      │
│ │ │ 📄 demo.mp4      18MB  ✓ scan  │  │ │                                      │
│ │ │ 📄 tests.txt     2KB   ✓ scan  │  │ │                                      │
│ │ └────────────────────────────────┘  │ │                                      │
│ │ [ + Drag a file or click to upload ] │ │                                      │
│ └─────────────────────────────────────┘ │                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ ⚪⚪⚪  4 of 6 criteria addressed · readiness 65%  [Save draft] [Submit →]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States:** default · saving · upload_in_progress · scan_in_progress · scan_failed · concurrent_edit_detected · withdrawn · awaiting_clarification · blocked

**Edge cases:**
- User has the same task open in 2 tabs → cross-tab BroadcastChannel locks the second to read-only with "Open in primary tab" CTA
- Network drops while typing notes → autosave queues; banner "Draft will save when connection returns"
- Mentor edits criteria mid-work → soft notification; criteria diff highlighted
- Task auto-withdraws (deadline + grace period passed without submit) → workroom becomes read-only with "Withdrawn" banner
- Awaiting clarification → submit disabled; Q&A thread is the focus

**Cognitive load:**
- Single most-recent state at the top (Round 2 of 3 · Revision requested · etc.)
- 60/40 split: enough room for evidence on the left, enough context on the right without scrolling
- AI signals are quiet, in the rail, never blocking the work
- Save draft never feels destructive — it's an additive action

**Decision heuristics:**
- "What do I need to do?" → criteria checklist (visible, with addressed state)
- "Is reviewer feedback addressed?" → 3-block view with checkboxes
- "Am I ready to submit?" → readiness number in the footer

**Accessibility:**
- Tab order: header → criteria → reviewer feedback → working notes → evidence → footer actions
- Each criterion is its own region with `aria-labelledby`
- Evidence drop zone has visible focus ring + keyboard upload (Enter on focused zone opens file picker)

**Cross-portal:**
- Brief, criteria, mentor identity sourced from cross-functional Task store
- Evidence uploads write to cross-functional file storage (with virus + plagiarism scan)
- Submit writes audit event + triggers mentor portal queue insertion
- AI signals derived from rule-based observation of the task state (not LLM generation)

---

#### 5.E.2 Workroom — empty brief
**Phase 1**

**Use case:** rare; task has no brief content (admin error). Show graceful message.

```
┌────────────────────────────────────────────┐
│ Brief                                       │
│ No brief content yet.                       │
│ The reviewer is preparing it.               │
│ [ Notify the reviewer ]                     │
└────────────────────────────────────────────┘
```

---

#### 5.E.3 Workroom — Q&A / clarification thread
**Phase 1** · SOW §3.1.MVP.5 · 🚧 BUILD

**Use case:** structured back-and-forth with the reviewer about the task.

**Wireframe (replaces the working-notes area when "Request clarification" is opened):**
```
┌──────────────────────────────────────────────────────────────┐
│ Q&A with Priya Iyer                                            │
├──────────────────────────────────────────────────────────────┤
│  [You · 2h ago]                                                │
│  Should the focus trap also include the date input or only    │
│  the popover?                                                  │
│                                                                │
│  [Priya · 1h ago]                                              │
│  Only the popover. The input stays outside the trap.          │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  [Type your question…]                              [ Send ]  │
└──────────────────────────────────────────────────────────────┘
```

**State changes:**
- When user opens a Q&A thread → task state goes to `awaiting_clarification` (visible in dashboard inbox)
- When reviewer replies → state returns to `in_progress`
- Notification fires on each side

**Edge:** thread is per-task, scoped; no DMs.

---

#### 5.E.4 Workroom — request clarification modal
**Phase 1** · ✅ KEEP

Same as Q&A but with a prompt for the first question.

---

#### 5.E.5 Workroom — report blocker
**Phase 1** · SOW §3.1.MVP.5

**Use case:** contributor can't proceed for an external reason.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│  Report a blocker                                              │
│                                                                │
│  What's blocking you?                                          │
│  [ textarea ]                                                  │
│                                                                │
│  When do you expect this to be resolved?                      │
│  ○ Today · ○ This week · ○ Unsure                             │
│                                                                │
│  Who can help unblock you? (optional)                         │
│  [ ______________________________ ]                           │
│                                                                │
│  [ Cancel ]                              [ Report blocker ]   │
└──────────────────────────────────────────────────────────────┘
```

**Post-condition:** task state → `blocked`; appears on mentor's escalation queue.

---

#### 5.E.6 Workroom — scan failed modal
**Phase 1** · SOW §3.1.MVP.5 · 🚧 BUILD

See §6.2 (shared pattern).

---

#### 5.E.7 Workroom — withdraw task modal
**Phase 1**

**Use case:** contributor decides they shouldn't keep this task (couldn't be done in time, scope unclear, etc.).

```
┌──────────────────────────────────────────────────────────────┐
│  Withdraw from this task?                                      │
│                                                                │
│  You won't earn the payout, and matching will record this.    │
│                                                                │
│  Why are you withdrawing?                                     │
│  [ select reason ▾ ]                                          │
│                                                                │
│  [ Cancel ]                              [ Withdraw ]         │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** if already submitted (under review), use "Withdraw submission" instead (§5.G.2).

---

### 5.F Submission

#### 5.F.1 Submission screen — `/contributor/tasks/[taskId]/submit`
**Phase 1** · SOW §3.1.MVP.5 · 🚧 BUILD (replaces current inline submit)

**Use case:** package evidence + notes + routing → submit for review.

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│ ← Workroom · Date Picker · Round 2 of 3                       │
├──────────────────────────────────────────────────────────────┤
│ Submit for review                                              │
│                                                                │
│ Readiness  ▓▓▓▓▓▓▓░░░ 78%  4 of 6 criteria addressed         │
│                                                                │
│ ─── Evidence (3 files, 21 MB total) ───                       │
│ 📄 spec.md          42 KB  ✓ scanned                          │
│ 📄 demo.mp4         18 MB  ✓ scanned · large, will compress   │
│ 📄 tests.txt         2 KB  ✓ scanned                          │
│                                                                │
│ ─── Cover note (optional) ───                                 │
│ [ textarea: 0 / 2000 ]                                        │
│                                                                │
│ ─── Route to ───                                              │
│ ◉ Mentor (default)                                            │
│   Priya Iyer reviews; if accepted, you're done.              │
│ ○ Mentor + Client                                             │
│   Two-stage: mentor first, then client sign-off.             │
│                                                                │
│ ─── Acceptance criteria ───                                   │
│ ✓ Focus trap on open                                          │
│ ✓ ESC closes and restores focus                               │
│ ✓ TAB cycles within picker                                    │
│ ✓ SHIFT-TAB reverses cycle                                    │
│ ☐ Screen reader announces month change                       │
│ ☐ Mobile touch outside dismisses                              │
│                                                                │
│ ⚠ 2 criteria are not yet marked addressed.                    │
│                                                                │
│ [ Save draft ]   [ Cancel ]              [ Submit for review ]│
└──────────────────────────────────────────────────────────────┘
```

**States:** default · submitting (button spinner) · success (redirects) · error · readiness_warning_modal_open · routing_unavailable

**Edge cases:**
- Submit clicked with unaddressed criteria → confirmation modal (§5.F.2)
- Submit on round = totalRounds with unaddressed criteria → harder modal requiring reason
- Mentor offline / capacity exceeded → fall back to mentor pool with explanation
- Two-stage routing requested but no client reviewer configured → fall back to single-stage with notice
- Concurrent edit (someone else changed the task mid-submit) → version_conflict modal (§6.5)
- Submit fails on backend → revert, retain inputs, surface specific error

**Cognitive load:**
- Three sections, top-down: evidence (proof) → cover note (context) → routing (where)
- Acceptance criteria visible at bottom as a final check
- Single primary CTA on the right; less-important actions on the left

**Decision heuristics:**
- "Am I ready?" → readiness % + unaddressed count
- "Single or two-stage?" → radio with one-line rationale each

**Accessibility:**
- Focus on readiness bar on mount; tab order top-to-bottom
- Submit button announces final state on confirmation
- Routing selection has `role="radiogroup"` with labels

---

#### 5.F.2 Submission — readiness warning modal
**Phase 1**

**Use case:** unaddressed criteria; warn but allow.

```
┌──────────────────────────────────────────────────────────────┐
│  Submit with unaddressed criteria?                             │
│                                                                │
│  2 criteria are not yet marked addressed:                     │
│   • Screen reader announces month change                      │
│   • Mobile touch outside dismisses                            │
│                                                                │
│  You can submit anyway — the reviewer may request revisions. │
│                                                                │
│  [ Go back and address ]              [ Submit anyway ]       │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** if round = totalRounds, change copy to "This is your final round. Unaddressed criteria are likely to cause rejection." and require a reason textarea before "Submit anyway" enables.

---

#### 5.F.3 Submission — in-flight + success — `/contributor/tasks/[taskId]/submit/success`
**Phase 1** · 🚧 BUILD

**Use case:** terminal confirmation after submit.

```
┌──────────────────────────────────────────────────────────────┐
│                                                                │
│                         ✓ Submitted                            │
│                                                                │
│                  Date Picker — round 2                         │
│              Sent to Priya Iyer for review                     │
│                                                                │
│        Expected response: within 24 hours                      │
│                                                                │
│   ┌─────────────────────────────────────────────────────┐    │
│   │ What happens next?                                    │    │
│   │                                                        │    │
│   │ 1. Priya reviews your submission                      │    │
│   │ 2. You'll get a notification with the outcome         │    │
│   │ 3. If accepted, payout becomes eligible               │    │
│   │ 4. If revision requested, we'll show you what to fix  │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                                │
│             [ Back to my work ]   [ See submissions ]         │
└──────────────────────────────────────────────────────────────┘
```

**Cognitive load:** explicit "what happens next" answers the most common post-submit question. SLA window manages expectations.

**Cross-portal:** writes audit event `submission_v{N}` and creates row in mentor queue.

---

#### 5.F.4 Submission — error
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ Couldn't submit                                             │
│                                                                │
│  We hit a snag sending this to Priya. Your work is safe.     │
│                                                                │
│  Error: [specific message]                                    │
│                                                                │
│  [ Try again ]   [ Save as draft and continue later ]         │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.G Under review (waiting state)

#### 5.G.1 Workroom — under review pane
**Phase 1**

**Use case:** task is awaiting reviewer decision. Show read-only view; no edits.

```
┌──────────────────────────────────────────────────────────────┐
│ Date Picker · Round 2 · Under review                          │
│ Submitted to Priya Iyer 14m ago · Expected response in 23h    │
├──────────────────────────────────────────────────────────────┤
│ [Read-only view of submission packet]                          │
│                                                                │
│ [ Withdraw submission ]                                        │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.G.2 Withdraw submission modal
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│  Withdraw this submission?                                     │
│                                                                │
│  The reviewer won't see it. You can edit and resubmit.       │
│                                                                │
│  [ Cancel ]                              [ Withdraw ]         │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.H Revisions

#### 5.H.1 Revisions queue — `/contributor/tasks/revisions`
**Phase 1** · SOW §3.1.MVP.5 · ✅ KEEP

**Use case:** every task currently in `revision_requested` or `ready_for_submission` (resubmit-ready).

Same structure as §5.D.1 list, scoped to revision states. Hero row: tasks where all corrections are addressed and ready to resubmit.

---

#### 5.H.2 Revision detail (workroom in revision mode) — `/contributor/tasks/revisions/[taskId]`
**Phase 1** · SOW §3.1.MVP.5 · ✅ KEEP

Same as workroom (§5.E.1) but with these additions in the work pane:

- Mentor feedback block shows the full 3-block view (what worked, corrections, suggestions)
- Each correction is a row with a checkbox ("Addressed") and a "Add note" affordance
- Diff viewer accessible via "Compare v1 ↔ working"

Wireframe (feedback block expanded):
```
┌──────────────────────────────────────────────────────────────┐
│ Reviewer feedback · Round 1 · Priya Iyer · 1h ago             │
├──────────────────────────────────────────────────────────────┤
│ ▼ What worked                                                  │
│   Strong implementation of focus trap on open. The TAB cycle  │
│   handling is clean and the code reads well.                  │
├──────────────────────────────────────────────────────────────┤
│ ▼ Required corrections (2)                                    │
│   ┌────────────────────────────────────────────────────┐     │
│   │ ☐ Screen reader announces month change             │     │
│   │   Major · The picker has visible month changes but │     │
│   │   they aren't announced via aria-live.             │     │
│   │   [ Add resolution note ]                          │     │
│   ├────────────────────────────────────────────────────┤     │
│   │ ☐ Mobile touch outside dismisses                   │     │
│   │   Major · On mobile, tapping outside the popover   │     │
│   │   doesn't close it. iOS Safari specifically.       │     │
│   │   [ Add resolution note ]                          │     │
│   └────────────────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────────────┤
│ ▼ Optional suggestions (1)                                    │
│   Consider documenting the focus restoration target in JSDoc. │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** dispute → §5.H.4.

---

#### 5.H.3 Diff viewer
**Phase 1** · SOW §3.1.MVP.5 · 🚧 BUILD

**Use case:** see what changed between submission v1 and the current working state.

**Wireframe (modal or full-page):**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Compare · v1 (submitted) ↔ working draft                              [ ✕ ]   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Evidence                                                                       │
│ ┌──────────────────────────────┐  ┌──────────────────────────────┐          │
│ │ v1                            │  │ Working                       │          │
│ │ ├─ spec.md                    │  │ ├─ spec.md  (modified · +12 lines)      │
│ │ ├─ demo.mp4                   │  │ ├─ demo.mp4 (replaced · new file)        │
│ │ └─ tests.txt                  │  │ ├─ tests.txt                  │          │
│ │                                │  │ └─ aria-test.md  (added)      │          │
│ └──────────────────────────────┘  └──────────────────────────────┘          │
│                                                                                │
│ Notes                                                                          │
│ ┌──────────────────────────────┐  ┌──────────────────────────────┐          │
│ │ v1                            │  │ Working                       │          │
│ │ Trap implemented; tested in   │  │ Trap implemented; tested in   │          │
│ │ Chrome and Firefox.           │  │ Chrome, Firefox, Safari +     │          │
│ │                                │  │ mobile Safari. Added aria-    │          │
│ │                                │  │ live region for month change. │          │
│ └──────────────────────────────┘  └──────────────────────────────┘          │
│                                                                                │
│ Criteria addressed                                                             │
│ v1: 4 / 6   →   Working: 6 / 6                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Edge:** v1 ↔ v2 ↔ working when multiple resubmissions exist.

---

#### 5.H.4 Dispute modal
**Phase 1, conditional** · SOW §20.3 · 🚧 BUILD

**Use case:** contributor believes the rejection is unfair. Opens a governance review.

```
┌──────────────────────────────────────────────────────────────┐
│  Dispute this decision?                                        │
│                                                                │
│  A governance officer will review the feedback and your       │
│  work. You'll hear back within 3 business days.               │
│                                                                │
│  Tell us why you're disputing:                                │
│  [ textarea ]                                                  │
│                                                                │
│  Attach evidence (optional)                                   │
│  [ + Drag a file ]                                            │
│                                                                │
│  [ Cancel ]                              [ Open dispute ]     │
└──────────────────────────────────────────────────────────────┘
```

**Cross-portal:** writes to governance queue (platform admin doc 04 — Phase 1 minimal: just creates an entry; full triage Phase 2).

---

#### 5.H.5 Resubmit confirmation
**Phase 1**

Same as §5.F.3 success but with round counter incremented.

---

### 5.I Completed

#### 5.I.1 Completed tasks list — `/contributor/tasks/completed`
**Phase 1** · ✅ KEEP

**Use case:** archive of accepted work.

```
┌──────────────────────────────────────────────────────────────┐
│ Completed work                                                 │
│ 14 tasks accepted · ₹42,800 earned                            │
├──────────────────────────────────────────────────────────────┤
│ TASK             │ PROJECT     │ ACCEPTED  │ PAYOUT  │ CRED  │
│ ────────────────┼─────────────┼───────────┼─────────┼──────│
│ Auth modal       │ Helios DS   │ May 18    │ ₹1,800  │ ↗    │
│ CSV export       │ Reporting   │ May 12    │ ₹1,400  │      │
│ Search shortcuts │ Helios DS   │ May 8     │ ₹1,200  │ ↗    │
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ Rows per page [12]                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.I.2 Completed detail (read-only) — `/contributor/tasks/completed/[taskId]`
**Phase 1**

Same workroom shell, read-only. Adds:
- Mentor's "what worked" message
- Payout status (eligible / paid)
- Credential issued (if applicable) with "View" link
- "Add to portfolio" toggle (cross-functional doc 05)

---

#### 5.I.3 Credential issued modal
**Phase 1** · ✅ KEEP

```
┌──────────────────────────────────────────────────────────────┐
│  🏅 You earned a credential                                    │
│                                                                │
│            Date Picker · FocusScope                            │
│           Issued May 18 · Verified by Helios                  │
│                                                                │
│  [ View credential ]   [ Share now ]   [ Later ]              │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.J Submissions queue

#### 5.J.1 Submissions list — `/contributor/tasks/submissions`
**Phase 1** · SOW §3.1.MVP.5 · ✅ KEEP

**Use case:** every task currently in `under_review` (submitted, waiting for reviewer).

Standard list layout with: task, reviewer, submitted-at, SLA window remaining.

---

#### 5.J.2 Submission detail — `/contributor/tasks/submissions/[id]`
**Phase 1**

Read-only view of the submitted packet (evidence, notes, criteria status at time of submit, routing).

---

### 5.K Profile / digital twin

#### 5.K.1 Profile view — `/contributor/profile`
**Phase 1** · SOW §3.1.MVP.3 · ✅ KEEP

```
┌──────────────────────────────────────────────────────────────┐
│ [Avatar]  Kavi Senthil                                        │
│           Designer · L2                                        │
│           Joined April 2026 · India / Asia/Kolkata             │
│           [ Edit profile ]                                     │
├──────────────────────────────────────────────────────────────┤
│ Skills (3)                                          [ Edit ↗ ]│
│ React · L2  · Figma · L3  · Accessibility · L2                │
├──────────────────────────────────────────────────────────────┤
│ Digital twin                                                   │
│   Tasks completed: 14                                          │
│   Acceptance rate: 92%                                         │
│   First-try acceptance: 71%                                    │
│   On-time delivery: 89%                                        │
│   Reliability: high                                            │
├──────────────────────────────────────────────────────────────┤
│ Recent contributions (last 5)                                  │
│ ✓ Auth modal · Helios · May 18                                │
│ ✓ CSV export · Reporting · May 12                             │
│ ✓ Search shortcuts · Helios · May 8                           │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

**Cognitive load:** numbers are observations, not targets. No leaderboard, no "X% better than peers."

---

#### 5.K.2 Profile edit — `/contributor/profile/edit`
**Phase 1**

Standard form: name, bio (one paragraph), avatar, location, timezone.

---

#### 5.K.3 Skills page — `/contributor/profile/skills`
**Phase 1** · 🔧 WIRE

Adds/removes skills; same UX as onboarding step 3 + per-skill evidence attachment.

---

#### 5.K.4 Skill detail with evidence — `/contributor/profile/skills/[skillId]`
**Phase 1**

Per-skill page: level, attached evidence (links/files), tasks completed using this skill, credentials earned.

---

#### 5.K.5 Digital twin summary — `/contributor/profile/digital-twin`
**Phase 1, baseline** · SOW §3.1.MVP.3

**Use case:** the SOW digital-twin v1: skills list + activity metrics + reliability counters. Phase 1 = static + derived from completed tasks. Phase 2 = learning trajectory + adjacency suggestions.

```
┌──────────────────────────────────────────────────────────────┐
│ Your digital twin                                              │
│ A summary of your activity, used to match you to work.        │
├──────────────────────────────────────────────────────────────┤
│ SKILLS                                                         │
│   3 declared · 14 tasks reinforcing                            │
│                                                                │
│ ACTIVITY                                                       │
│   Last 30 days: 14 tasks completed, 1 in flight, 0 declined   │
│                                                                │
│ RELIABILITY                                                    │
│   On-time: 89%  ·  First-try accept: 71%  ·  Withdrawals: 0   │
│                                                                │
│ AVAILABILITY                                                   │
│   Mon–Fri · 09:00–18:00 IST · ~20 hrs/wk                      │
│                                                                │
│ ℹ This summary updates as you complete tasks.                 │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.L Earnings & payouts

#### 5.L.1 Earnings overview — `/contributor/earnings`
**Phase 1** · SOW §3.1.MVP.6 · 🔧 WIRE

**Use case:** what you've earned and what you can withdraw.

```
┌──────────────────────────────────────────────────────────────┐
│ Earnings                                                       │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Withdrawable balance                                       │ │
│ │ ₹14,200                                                    │ │
│ │ [ Withdraw ]                                               │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│ │ This wk  │ │ This mo  │ │ All time │                       │
│ │ ₹12,400  │ │ ₹42,800  │ │ ₹186,400 │                       │
│ └──────────┘ └──────────┘ └──────────┘                       │
├──────────────────────────────────────────────────────────────┤
│ Pending (1)                                                    │
│ • Date Picker · ₹1,200 · payable on acceptance                │
├──────────────────────────────────────────────────────────────┤
│ Recent (5)                                                     │
│ • Auth modal · ₹1,800 · paid May 22 · TRX-9421                │
│ • CSV export · ₹1,400 · paid May 16 · TRX-9012                │
│ ...                                                            │
│ [ See history → ]                                              │
├──────────────────────────────────────────────────────────────┤
│ Payout method: [HDFC Bank ****1234]                [ Manage ] │
│ [ Export earnings as CSV ]                                     │
└──────────────────────────────────────────────────────────────┘
```

**Edge cases:**
- No payout method → "Set up payout to enable withdrawal"
- Balance < minimum withdrawal → "Minimum ₹500 to withdraw"
- Withdrawal pending → balance shows reserved amount in parentheses

---

#### 5.L.2 Earnings history — `/contributor/earnings/history`
**Phase 1** · 🔧 WIRE

Paginated table: task, project, amount, status (pending/paid/reversed), reference, date.

---

#### 5.L.3 Payout method list — `/contributor/earnings/payout-method`
**Phase 1** · SOW §3.1.MVP.6 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Payout method                                                  │
├──────────────────────────────────────────────────────────────┤
│ Primary                                                        │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ HDFC Bank ****1234 · IFSC HDFC0001234                    │ │
│ │ Verified May 8 · India · INR                             │ │
│ │                              [ Verify again ]  [ Remove ]│ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ [ + Add another method ]                                       │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.L.4 Add payout method
**Phase 1** · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Add a payout method                                            │
│                                                                │
│ Country                                                        │
│ [ India ▾ ]                                                   │
│                                                                │
│ Method                                                         │
│ ◉ Bank account (NEFT/IMPS)                                    │
│ ○ UPI                                                          │
│ ○ Razorpay wallet                                              │
│                                                                │
│ Account holder name                                            │
│ [ ________________________________ ]                          │
│                                                                │
│ Account number                                                 │
│ [ ________________________________ ]                          │
│                                                                │
│ IFSC code                                                      │
│ [ __________ ]                                                 │
│                                                                │
│ ℹ We'll send ₹1 to verify the account. It'll be reversed.    │
│                                                                │
│ [ Cancel ]                              [ Verify and save ]   │
└──────────────────────────────────────────────────────────────┘
```

**States:** form_default · verifying · verify_failed · verified

**Edge cases:**
- Account number / IFSC mismatch → backend validates; surface specific error
- Penny verification fails → 24h cooldown; allow re-entry

**Cross-portal:** payout rail integration (Razorpay / bank API) is a cross-functional concern.

---

#### 5.L.5 Withdraw — request
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Withdraw to HDFC Bank ****1234                                 │
│                                                                │
│ Available: ₹14,200                                             │
│                                                                │
│ Amount                                                         │
│ [ ₹ __________ ]   [ Withdraw all ]                           │
│                                                                │
│ Fee: ₹0 (covered by Glimmora)                                 │
│ You'll receive: ₹14,200                                       │
│ Expected: 1–2 business days                                    │
│                                                                │
│ [ Cancel ]                              [ Confirm withdraw ]  │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.L.6 Withdraw — success
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ ✓ Withdrawal requested                                         │
│                                                                │
│ ₹14,200 will arrive in 1–2 business days.                     │
│ Reference: TRX-W-9482                                          │
│                                                                │
│ [ Back to earnings ]                                           │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.L.7 Export earnings — `/contributor/earnings/export`
**Phase 1** · SOW §3.1.MVP.6 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Export earnings                                                │
│                                                                │
│ Time range                                                     │
│ [ This month ▾ ]   or   [ Custom range ]                      │
│                                                                │
│ Format                                                         │
│ ◉ CSV   ○ PDF                                                  │
│                                                                │
│ Include                                                        │
│ ☑ Paid                                                         │
│ ☑ Pending                                                      │
│ ☐ Reversed                                                     │
│                                                                │
│ [ Cancel ]                              [ Download ]          │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.M Credentials

#### 5.M.1 Credentials wallet — `/contributor/credentials`
**Phase 1** · SOW §3.1.5 · ✅ KEEP

Grid of credentials issued for accepted tasks. Each card: skill, project, date, share button.

---

#### 5.M.2 Credential detail — `/contributor/credentials/[id]`
**Phase 1**

Per-credential page: what it certifies, the task that earned it, verifier (mentor/enterprise), evidence link, share controls.

---

#### 5.M.3 Share credential modal
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Share credential                                               │
│                                                                │
│ Date Picker · FocusScope                                       │
│                                                                │
│ Public link                                                    │
│ [ https://glimmora.app/c/AB12CDE...           ]  [ Copy ]    │
│                                                                │
│ [ Email ]   [ LinkedIn ]   [ Twitter / X ]                    │
│                                                                │
│ ⚙ Privacy: anyone with the link can view                      │
│ [ Revoke link ]                                                │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.M.4 Public credential page — `/public/credentials/[shareId]`
**Phase 1** · ✅ KEEP (already built)

Public read-only page showing the credential to anyone with the link. Branded, verified-by signal, evidence link.

---

### 5.N Settings

#### 5.N.1 Settings index — `/contributor/settings`
**Phase 1**

Top-level sections: Account · Notifications · Privacy · Language · Connected accounts · Sessions.

---

#### 5.N.2 Account settings — `/contributor/settings/account`
**Phase 1**

Change email, password, MFA management.

---

#### 5.N.3 Notification preferences — `/contributor/settings/notifications`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Notifications                                                  │
├──────────────────────────────────────────────────────────────┤
│ Channels                                                       │
│              In-app  Email  SMS                                │
│ Critical      ☑      ☑     ☑   (locked — required)            │
│ Task updates  ☑      ☑     ☐                                  │
│ Reviewer msgs ☑      ☑     ☐                                  │
│ Payout        ☑      ☑     ☐                                  │
│ Marketing     ☐      ☐     ☐                                  │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.N.4 Privacy & consent — `/contributor/settings/privacy`
**Phase 1** · SOW §3.1.MVP.3 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Privacy & consent                                              │
├──────────────────────────────────────────────────────────────┤
│ ✓ Terms of Service           accepted May 2                   │
│ ✓ Privacy Policy              accepted May 2                   │
│ ✓ AI-assisted guidance        on                              │
│   [ Turn off ]                                                 │
│ ✓ Task notifications          on                              │
│   [ Manage channels ]                                          │
│ ☐ Optional surveys (≤ 4/yr)   off                             │
│   [ Opt in ]                                                   │
├──────────────────────────────────────────────────────────────┤
│ Your data                                                      │
│ [ Download my data (JSON) ]                                    │
│ [ Request deletion ]                                           │
└──────────────────────────────────────────────────────────────┘
```

**Edge cases:**
- Turn off AI guidance → AI signals disappear from workroom/dashboard
- Delete account → grace period 30 days; banner on every screen; data retained per legal/audit rules

---

#### 5.N.5 Language & region — `/contributor/settings/language`
**Phase 1** · 🚧 BUILD framework (English-only ship is OK)

```
┌──────────────────────────────────────────────────────────────┐
│ Language                                                       │
│ [ English ▾ ]                                                 │
│                                                                │
│ Date format                                                    │
│ ◉ DD MMM YYYY (26 May 2026)                                   │
│ ○ MM/DD/YYYY (05/26/2026)                                     │
│ ○ YYYY-MM-DD (2026-05-26)                                     │
│                                                                │
│ Time format                                                    │
│ ◉ 24-hour    ○ 12-hour                                        │
│                                                                │
│ Currency display                                               │
│ [ INR (₹) — auto from timezone ▾ ]                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.N.6 Account deletion request
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ Delete your account?                                           │
│                                                                │
│ This will:                                                     │
│  • Cancel any pending withdrawals                              │
│  • Make your credentials un-shareable                          │
│  • Remove you from all active tasks                            │
│                                                                │
│ Some data is retained for audit and legal reasons.            │
│                                                                │
│ Your data will be deleted in 30 days. You can cancel until    │
│ then by logging in.                                            │
│                                                                │
│ Type DELETE to confirm:                                        │
│ [ ________________________________ ]                          │
│                                                                │
│ [ Cancel ]                              [ Delete account ]    │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.O Support & safety

#### 5.O.1 Support index — `/contributor/support`
**Phase 1** · SOW §20.3 · ✅ KEEP

```
┌──────────────────────────────────────────────────────────────┐
│ Support                                                        │
├──────────────────────────────────────────────────────────────┤
│ Browse FAQs                                                    │
│ ▸ Getting started                                              │
│ ▸ Tasks & submissions                                          │
│ ▸ Payouts                                                      │
│ ▸ Credentials                                                  │
│ ▸ Account & privacy                                            │
├──────────────────────────────────────────────────────────────┤
│ Can't find what you need?                                     │
│ [ Open a ticket → ]                                            │
├──────────────────────────────────────────────────────────────┤
│ Concerned about safety?                                        │
│ [ Submit a safety report (anonymous option) → ]               │
│ [ Open a grievance → ]                                         │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.O.2 New ticket — `/contributor/support/tickets/new`
**Phase 1**

Standard form: category, subject, description, attachments. Auto-fills task context if opened from a workroom "Need help" link.

---

#### 5.O.3 Ticket detail — `/contributor/support/tickets/[id]`
**Phase 1**

Thread view between contributor and support; status (open / in progress / waiting / resolved).

---

#### 5.O.4 Safety report — `/contributor/support/safety-report`
**Phase 1** · SOW §20.3 · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│ Safety report                                                  │
│                                                                │
│ Use this if you've experienced or witnessed something          │
│ unsafe on the platform.                                        │
│                                                                │
│ Type                                                           │
│ ○ Harassment                                                   │
│ ○ Unsafe task content                                          │
│ ○ Discrimination                                               │
│ ○ Other                                                        │
│                                                                │
│ Tell us what happened                                          │
│ [ textarea ]                                                   │
│                                                                │
│ When did this happen?                                         │
│ [ date ]                                                       │
│                                                                │
│ Who else was involved? (optional)                             │
│ [ ________________________________ ]                          │
│                                                                │
│ ☐ Submit anonymously                                          │
│   (we won't see your name; we won't be able to follow up)     │
│                                                                │
│ Attach evidence (optional)                                     │
│ [ + Drag a file ]                                              │
│                                                                │
│ [ Cancel ]                              [ Submit report ]     │
└──────────────────────────────────────────────────────────────┘
```

**Post-condition:** case ID issued; visible in support index. SLA: 24h initial response promised. Anonymous reports skip the response loop.

**Cross-portal:** writes to governance queue (platform admin doc 04).

---

#### 5.O.5 Grievance — `/contributor/support/grievance`
**Phase 1** · SOW §20.3

Similar to safety report but framed as a process grievance (e.g. unfair rejection, payment dispute outside a single task).

---

### 5.P Notifications

#### 5.P.1 Notifications page — `/contributor/notifications`
**Phase 1** · ✅ KEEP

```
┌──────────────────────────────────────────────────────────────┐
│ Notifications                                                  │
│ [ All ] [ Unread ] [ Task ] [ Reviewer ] [ Payout ]           │
├──────────────────────────────────────────────────────────────┤
│ ● Revision requested · Date Picker · 1h ago                   │
│ ● Reviewer replied · CSV export · 5h ago                      │
│ ○ Task accepted · Auth modal · yesterday                      │
│ ○ Payout sent · ₹14,200 · 2 days ago                          │
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ Notification preferences in [ Settings → Notifications ]      │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** "Mark all read" affordance; click row → routes to relevant context.

---

### 5.Z Phase 2 stubs

These surfaces are explicitly out of Phase 1. Listed here for completeness so engineers don't accidentally rebuild them.

- **5.Z.1 Messages list** — `/contributor/messages`. Phase 2.
- **5.Z.2 Message thread** — `/contributor/messages/[id]`. Phase 2.
- **5.Z.3 Community discussions** — `/contributor/community`. Phase 2.
- **5.Z.4 Mentorship sessions (contributor-facing)** — Phase 2.
- **5.Z.5 Learning recommendations (full)** — `/contributor/learning`. Phase 2.
- **5.Z.6 Tax documents** — `/contributor/earnings/tax`. Phase 2.
- **5.Z.7 Progress page (skill ladder dedicated surface)** — `/contributor/progress`. Phase 2 — over-scoped in current build.
- **5.Z.8 Portfolio public page** — Phase 2 (public credential page is the Phase 1 substitute).

---

## 6. Shared component patterns

Defined once; referenced from screens above.

### 6.1 Evidence drop zone
- Drag-drop or click to upload
- Multi-file accepted
- Per-file progress bar
- Virus + plagiarism scan badges
- Replace / delete actions

### 6.2 Scan failed modal
```
┌──────────────────────────────────────────────────────────────┐
│ ⚠ File flagged                                                 │
│                                                                │
│ We couldn't accept demo.mp4 because:                          │
│  • Virus signature detected                                   │
│                                                                │
│ Please remove this file and try a different one.              │
│                                                                │
│              [ Remove file ]                                  │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Status chips
- Same tone palette used across portals (cross-functional doc 05 §2)
- Heights fixed at 18px, padding 1.5px horizontal, leading none, font-weight 700, uppercase

### 6.4 Readiness bar
- 0–100, three thresholds: <50 warning, 50–80 brand, ≥80 success
- Fill animates only on initial mount, not on every state update

### 6.5 Version conflict modal
```
┌──────────────────────────────────────────────────────────────┐
│ Someone else changed this task                                 │
│                                                                │
│ A reviewer updated the criteria while you were working.       │
│ Refresh to see the latest before submitting.                  │
│                                                                │
│ [ Discard my changes ]      [ Save mine + refresh ]           │
└──────────────────────────────────────────────────────────────┘
```

### 6.6 Empty state
- Centered illustration (calm, not playful), one-line headline, one-line subtext, single CTA

### 6.7 Toast
- Top-right, auto-dismiss 4s, max 3 stacked, only for completion events (not state changes)

### 6.8 Confirmation modal pattern
- Title verb-led ("Withdraw from this task?")
- One supporting sentence
- Primary action right; cancel left; destructive actions get error-tone primary

---

## 7. State machines

### 7.1 Task lifecycle (contributor-facing slice)

```
            ┌──────────┐
            │ assigned │
            └─────┬────┘
                  │ accept                         decline
                  ▼                                  │
            ┌──────────┐                            ▼
            │ accepted │                       [removed]
            └─────┬────┘
                  │ first draft save
                  ▼
            ┌──────────────┐
       ┌────▶ in_progress  ◀───────┐
       │    └─────┬────────┘       │
       │          │                 │
       │          ▼                 │
       │    ┌──────────┐            │
       │    │ blocked  │ ───────────┘  unblock
       │    └──────────┘
       │          ▲
       │          │ report blocker
       │          │
       │    ┌──────────────────────┐
       │    │ awaiting_clarification │ ──┐
       │    └──────────────────────┘    │
       │          ▲                     │  reviewer reply
       │          │ ask reviewer        │
       │          └─────────────────────┘
       │
       │    ┌─────────────────────┐
       │    │ ready_for_submission │ ──── submit
       │    └─────────────────────┘
       │
       │  submit                          revision_requested
       └──────────────┐                 ┌────────────────────┐
                      ▼                 ▼                    │
                ┌──────────────┐                            │
                │ under_review │ ─── revision ──────────────┘
                └──────┬───────┘
                       │ accept
                       ▼
                ┌───────────┐
                │ completed │
                └───────────┘
```

### 7.2 Onboarding lifecycle

```
[Register] → email_verified → onboarding_step_1 → ...step_9 → onboarded
                  │                                                │
                  │ skip / save                                   │
                  ▼                                                ▼
            partial_onboarding ◀──── resume ──── dashboard (read-only mode)
```

### 7.3 Payout lifecycle

```
task_accepted → payout_eligible → payout_pending → payout_paid
                                       │
                                       ▼
                                  payout_failed (retry)
                                       │
                                       ▼
                                  payout_reversed (admin)
```

---

## 8. Cross-portal touchpoints

| Event in contributor portal | Affects | Surface | Cross-fn doc |
|---|---|---|---|
| Submission | Mentor portal | New row in `/mentor/queue` | 03 |
| Two-stage routing | Enterprise portal | Pipeline stage advances; client reviewer queue | 02 |
| Acceptance (mentor decision) | This portal | State → completed; earnings + credential created | — |
| Revision requested | This portal | State → revision_requested; revisions queue + notification | — |
| Withdrawal | Mentor portal | Submission removed from queue; audit logged | 03 |
| Q&A request | Mentor portal | Reviewer notification + thread | 03 |
| Blocker reported | Mentor portal | Escalation queue | 03 |
| Safety report | Platform admin | Governance queue | 04 |
| Grievance | Platform admin | Governance queue | 04 |
| Earnings export | This portal only | — | — |
| Credential share | Public web | `/public/credentials/[shareId]` | — |
| Account deletion | Platform admin | Compliance queue | 04 |

---

## 9. Data model sketch (contributor-relevant entities)

| Entity | Key fields | Notes |
|---|---|---|
| Contributor | id, name, email, role, tracks (Track[]), primaryTrack, timezone, consentRecords[], mfaConfig | Identity record. `tracks` is an array (max 2 active simultaneously). Persona-conditional modules render off this. |
| Track | name (internal\|student\|womenWorkforce\|freelancer), activatedAt, source (invite\|hris\|institutional\|self) | One per active track on a contributor |
| SupervisorLink | contributorId, supervisorId, institution, approvedAt, expiresAt, academicCreditMapping[] | Student-track only |
| PeerMentorAssignment | contributorId, mentorId, nextSessionAt, preferencesActive[] | Women-workforce-track only |
| Skill | id, name, level, evidence[] | Skill declarations |
| Task | id, title, brief, criteria[], project, mentorId, contributorId, state, reworkRound, totalRounds, deadline, payoutAmount | Lifecycle entity |
| Submission | id, taskId, version, evidence[], notes, routing, submittedAt, outcome | One per round |
| Evidence | id, type, url, scanStatus, scanResult, uploadedAt | File or link |
| MentorFeedback | submissionId, whatWorked, requiredCorrections[], suggestions[] | Per round |
| Correction | id, criterion, description, severity, addressed, resolutionNote | Within feedback |
| Credential | id, taskId, skillId, issuedBy, issuedAt, shareId, evidenceUrl | Public-shareable |
| Earnings | id, taskId, amount, status, reference, paidAt | Per accepted task |
| PayoutMethod | id, type, accountDetails (encrypted), verifiedAt | Per contributor |
| Notification | id, recipient, kind, payload, readAt, dispatchedAt | Cross-portal event sink |
| AuditEvent | id, actorId, action, resourceId, payload, timestamp (immutable) | Cross-functional |

Full schema is in cross-functional doc 05 §9.

---

## 10. Open decisions

These are scope or design questions I (the spec author) made a call on, but flagged for confirmation:

1. **Workroom menu page** — Removed. Sidebar item "Workroom" was deleted; `/contributor/workroom` route removed. Active queue duty handled by `/contributor/tasks` (Assigned). ✅ DECIDED.

2. **Persona-conditional dashboard (not separate portals)** — same shell, conditional modules per active track. Multi-track stacking capped at 2. ✅ DECIDED (industry-standard mental model).

3. **Phase 1 sidebar — Earnings + Credentials promoted from "My record"** to top-level visibility. Progress page removed (Phase 2). Confirm.

4. **Community section sealed** in Phase 1 (Messages, Mentorship contributor-side, Discussions). Phase 2 reintroduces if SOW change order allows. Confirm.

5. **Onboarding step count: 9** — proposed. Could compress to 5 (combine identity + skills, consent + payout). Trade-off: progress feels longer with 9 steps; each step is shorter. Confirm.

7. **Persona selection at step 1** — proposed for new self-register contributors. For SSO/invited users, locked from invite metadata. Confirm.

8. **Q&A thread location** — proposed inline in workroom (replaces working notes area when opened). Alternative: side panel. Confirm interaction.

9. **Two-stage routing — default off** — Phase 1 defaults to mentor-only; two-stage opt-in by contributor at submit. Alternative: enterprise admin pre-configures per project. The SOW §3.1.MVP.5 supports both; need confirmation which is canonical.

10. **Dispute flow** — Phase 1 entry point added (modal opens governance case). Triage UI lives in platform admin doc 04 — Phase 1 minimal: case is logged + governance team responds via email. Phase 2: full triage UI. Confirm Phase 1 minimum.

11. **Account deletion grace period: 30 days** — proposed. Industry common is 14–30 days. Confirm.

12. **AI guidance opt-out** — proposed as a privacy toggle. When off, AI signals + suggestions disappear entirely. Confirm whether AI is mandatory (some matching depends on AI) or fully optional.

13. **Withdrawal minimum: ₹500** — proposed. Confirm.

14. **Maximum skills per contributor: 12** — proposed during onboarding. Confirm.

---

## End of contributor portal spec

Next docs in series:
- `02-enterprise-portal.md` — Enterprise admin, SOW workspace, decomposition, reviews, billing, audit
- `03-mentor-portal.md` — Mentor & reviewer workspace
- `04-platform-admin-portal.md` — Glimmora-side admin (most Phase 2)
- `05-cross-functional.md` — Auth, RBAC, audit, AI, notifications, integrations, accessibility, data model
- `06-phase-1-scope-lockdown.md` — Consolidated 90-day checklist across all portals
