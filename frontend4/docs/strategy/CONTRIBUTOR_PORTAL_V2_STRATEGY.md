# Contributor Portal V2 — Strategy & Reorganization

> **Surface in scope.** The Contributor Portal in GlimmoraTeam — the daily home of every contributor working tasks decomposed from enterprise SOWs.
>
> **Companion to.** The Mentor Workspace V2 series (`MENTOR_REVIEW_REDESIGN_STRATEGY.md`, `MENTOR_REVIEW_UX_ARCHITECTURE.md`, `MENTOR_WORKSPACE_UX_EXECUTION_BLUEPRINT.md`, `MENTOR_WORKSPACE_WIREFRAMES_AND_SCREEN_ARCHITECTURE.md`, `MENTOR_WORKSPACE_V2_STAKEHOLDER_DEMO.md`).
>
> **Operating thesis.** *The mentor portal is the platform's irreversibility surface — built for governance, audit, and enforcement. The contributor portal is the platform's productivity surface — built for momentum, confidence, and clear next steps. The two must feel fundamentally different even though they share infrastructure.*

---

## Table of Contents

1. [Contributor Experience Strategy](#1-contributor-experience-strategy)
2. [Contributor Workflow Lifecycle](#2-contributor-workflow-lifecycle)
3. [Contributor Information Architecture](#3-contributor-information-architecture)
4. [Contributor Operational Ecosystem](#4-contributor-operational-ecosystem)
5. [Workroom UX Strategy](#5-workroom-ux-strategy)
6. [Contributor AI Experience](#6-contributor-ai-experience)
7. [Productivity & Motivation UX](#7-productivity--motivation-ux)
8. [Contributor State Systems](#8-contributor-state-systems)
9. [Enterprise Workforce UX Principles](#9-enterprise-workforce-ux-principles)
10. [Implementation Direction](#10-implementation-direction)
11. [Appendix · Mentor vs Contributor UX Reference](#appendix--mentor-vs-contributor-ux-reference)

---

## 1. Contributor Experience Strategy

### 1.1 Opening sentence

> *"The Contributor Portal is the platform's productivity surface — where vetted global contributors come every day to know what to do next, how to do it well, and whether they're getting better. Every pixel must serve one of three masters: momentum, confidence, or growth."*

### 1.2 Who is the contributor

A vetted contributor on GlimmoraTeam is a **professional doing real paid work** — student, women returner, freelancer, internal staff — matched to tasks decomposed from enterprise Statements of Work. They are not gig workers, not crowd labor. They have skills, history, reputation, and earnings on the platform. Their daily question is *"what should I be working on, and how do I do it well?"*

### 1.3 Contributor goals (in priority order)

| # | Goal | What it means |
|---|---|---|
| 1 | **Earn predictably** | The work I commit to today turns into payment I can count on |
| 2 | **Deliver on the first try** | Submissions accepted without rework — high reliability score, fewer cycles |
| 3 | **Grow my reputation** | Verifiable credentials, portfolio evidence, increasing skill levels |
| 4 | **Reduce friction** | Less time on tooling, more time on the work itself |
| 5 | **Understand expectations** | Clear specs, clear acceptance criteria, clear feedback when revisions are needed |
| 6 | **Feel respected** | The platform treats me like a professional, not a gig worker |

### 1.4 Contributor psychology

Contributors arrive with **a delivery mindset**, not a triage mindset. They do not want a dashboard that shows them 47 things across 6 priority buckets. They want to know:

- **What's next?** — the one task I should pick up now
- **Am I on track?** — am I going to deliver this on time
- **Did I do well?** — feedback from my last submission
- **Am I growing?** — what skills did I level up, what's my reliability trend

Anything else is friction or anxiety. The portal is not a control surface for the contributor — it is their **delivery cockpit**.

### 1.5 Workforce productivity needs

Workforce productivity for a contributor is the inverse of operational monitoring for a mentor:

- **Mentor needs** *visibility into the pool*. **Contributor needs** *focus on the one item in front of them.*
- **Mentor needs** *severity hierarchy*. **Contributor needs* **momentum hierarchy** — what done, what's next, what's coming.*
- **Mentor needs** *governance routing*. **Contributor needs** *workflow guidance — the next step is always one click away.*
- **Mentor needs** *audit timeline*. **Contributor needs** *progress timeline — milestones, not events.*

### 1.6 Operational clarity needs

Clarity for a contributor means **the platform tells me what to do without making me ask**:

- The task I should pick up next is surfaced, not buried.
- The acceptance criteria are visible before I start, not discovered during rework.
- The deadline is a confident countdown, not an anxious red number.
- The mentor's feedback is presented as actionable items, not a wall of text.
- The AI's suggestions are framed as help, not as supervision.

### 1.7 Motivation systems

Sustained motivation comes from three signals, surfaced gently:

| Signal | What it looks like |
|---|---|
| **Momentum** | A streak of accepted submissions; a velocity meter showing this week vs last; a "you're on a roll" tone when reliability climbs |
| **Progress** | A skill ladder that levels up visibly; portfolio evidence accumulating; verifiable credentials issued at milestones |
| **Recognition** | Mentor commendations on accepted submissions; surfaced as a small "what worked" callout |

Motivation is *quiet*. Loud gamification (badges, confetti, leaderboards) reads as condescending to a professional contributor. The platform should feel like a colleague who notices, not a teacher who rewards.

### 1.8 Confidence systems

Confidence is built through **predictability** and **clear feedback**:

- The contributor knows what acceptance looks like before they start.
- The contributor knows when they'll get reviewed (SLA visible, never anxious).
- The contributor knows what went wrong the moment something needs revision.
- The contributor knows their reliability is trending up or down — and *why*.
- The contributor knows their AI assistant is on their side, not watching for mistakes.

### 1.9 AI assistance expectations

Contributors expect AI to:

- **Suggest** — relevant patterns, similar past work, missing evidence
- **Check** — submission readiness before they hit submit
- **Explain** — when something flagged or queried by mentor, AI helps the contributor understand why
- **Support** — when stuck, AI offers next-step guidance, not a chatbot

AI must **never** feel like surveillance. The phrase to avoid is "AI detected X". The phrase to lean on is "you might want to consider Y".

---

## 2. Contributor Workflow Lifecycle

A contributor's lifecycle on the platform — from arrival to delivery to growth.

### 2.1 Lifecycle stages

```
   Onboarding
        │
        ▼
   Task Discovery  ◄─────────────────────┐
        │                                │
        ▼                                │
   Task Acceptance                       │
        │                                │
        ▼                                │
   Workroom (Active Work)                │
        │                                │
        ▼                                │
   Submission                            │
        │                                │
        ├──► Approved ──► Payout         │
        │                                │
        ├──► Revision Requested          │
        │       │                        │
        │       ▼                        │
        │   Rework Cycle ────────────────┘
        │
        └──► Escalated (rare · routes to mentor governance)
```

### 2.2 Onboarding

**Goal.** Get the contributor from sign-up to first accepted submission as fast as possible.

**Phases.**
1. **Identity & skills.** Pseudonym, verified skill ladder (e.g., React L3, A11y L2), areas of interest.
2. **Calibration.** A starter task at L2 or L1 of their declared skill, reviewed with extra coaching.
3. **First match.** Algorithmically routed to a low-risk SOW slot in their primary skill.
4. **First accept.** Issued first credential evidence; reliability score initialized.

**UX feel.** Welcoming, low-stakes, confidence-building. Onboarding is **not** a tutorial of every feature — it's an escorted first delivery.

### 2.3 Task discovery

**Goal.** Surface tasks the contributor is qualified for and motivated to take.

**Surfaces.**
- **Recommended for you** — algorithmic matches based on skill ladder, past acceptance, current load
- **By skill** — browse by skill domain
- **By project** — see which enterprise projects are hiring
- **Saved searches** — recurring queries the contributor wants to monitor

**UX feel.** Inviting. Cards over tables. Quality signals (project tier, acceptance rate) gently visible.

### 2.4 Task acceptance

**Goal.** A confident commitment to deliver.

**Pre-accept clarity.**
- Acceptance criteria visible up front (no surprises during rework)
- Skill-level alignment shown (this is L3; you're L3 in React)
- Deadline confidence (calibrated to your historical velocity)
- Payout amount visible
- Required artifacts list visible

**UX feel.** Like accepting a job, not picking a coupon. The contributor signs a soft commitment ("I'll deliver by X").

### 2.5 Workroom experience

**Goal.** Focus. The workroom is where the actual work happens.

See [Section 5](#5-workroom-ux-strategy) for the full strategy.

### 2.6 Progress tracking

**Goal.** The contributor always knows where they are in the work.

**Indicators.**
- Milestone progress (e.g., "Drafted 3 of 5 acceptance criteria")
- Time-on-task vs estimated effort
- Evidence collection checklist (uploaded / pending)
- Spec-coverage map (covered / not yet covered)

### 2.7 Submission lifecycle

**Goal.** A clear, confidence-building submission moment.

**Pre-submit checks.**
- AI submission readiness check (covered in [Section 6](#6-contributor-ai-experience))
- Evidence completeness ≥ threshold
- Spec coverage ≥ threshold
- Tests / docs / artifacts present

**Submit moment.**
- Single Submit CTA with the readiness score visible
- Confirmation modal listing what gets submitted + estimated review window
- Post-submit state shows "Submitted · review window: 24h"

### 2.8 Revision / rework cycle

**Goal.** Make corrections feel like guidance, not punishment.

**Anchored corrections.**
- Each rework item is anchored to a criterion (the same criterion the mentor flagged)
- Mentor's "what worked" appears first (positive anchor)
- Mentor's required corrections appear as a checklist
- AI offers a "fix suggestion" per correction where applicable

**Re-submission.**
- The contributor can compare v1 vs v2 of their own work
- The platform shows which corrections were addressed
- A small "you're on track" indicator appears when ≥80% of corrections are addressed

### 2.9 Approval & completion

**Goal.** Celebrate quietly, then point to what's next.

**Acceptance moment.**
- Brief acknowledgment ("Submission accepted")
- Payout confirmation
- Reliability delta (+1, +0.5, etc.)
- Credential evidence issued, with a "view in portfolio" link
- Two suggested next tasks to maintain momentum

### 2.10 Payout / progress tracking

**Goal.** Predictability over surprise.

**Earnings.**
- Pending payouts (work accepted, not yet disbursed)
- Disbursed payouts (with reference IDs)
- Projected payouts (committed work, estimated to land)
- Year-to-date earnings with tax-doc download

**Progress.**
- Reliability score trend chart
- Skill ladder progression (L2 → L3 visible)
- Credentials issued (verifiable portfolio entries)
- Acceptance rate, average rework rounds, average review window

---

## 3. Contributor Information Architecture

The reorganized contributor sidebar — 5 sections, 18 routes, productivity-first.

### 3.1 Section overview

```
┌─ TODAY                          Productivity dashboard
│  ── Home                        ← single most important screen for daily use
│  ── My Schedule                 ← deadlines, upcoming reviews, mentorship slots
│
├─ WORK                           Active and discoverable tasks
│  ── Available Tasks             ← discover and accept
│  ── Active Tasks                ← in progress workrooms
│  ── Submissions                 ← submitted, awaiting review
│  ── Revisions                   ← rework requested, action needed
│  ── Completed Work              ← archive + portfolio source
│
├─ GROWTH                         Skill, credentials, learning
│  ── Skill Ladder                ← visible progression per skill
│  ── Credentials                 ← issued verifiable credentials
│  ── Learning Recommendations    ← targeted at near-ladder gaps
│  ── Portfolio                   ← shareable evidence
│
├─ EARNINGS                       Money and predictability
│  ── Earnings Overview           ← pending + disbursed + projected
│  ── Payout History              ← line-item history with refs
│  ── Tax Documents               ← end-of-year docs
│
├─ COMMUNITY                      Peer + mentor connection
│  ── Mentorship                  ← scheduled sessions + watchlist signals (gentle)
│  ── Discussions                 ← peer community
│  ── Messages                    ← inbox for mentor / system / peer
│
└─ ACCOUNT
   ── Profile                     ← digital twin, identity, skills
   ── Settings                    ← preferences, notifications, payouts
   ── Support                     ← FAQs, tickets, safety
```

### 3.2 Why this order

Top section is **TODAY** — what matters now. The contributor's daily entry point is the Home page; everything else is reference or growth. This mirrors how a freelancer opens a delivery tool: glance at today, then dive into the one task.

**WORK** is the operational core — five surfaces covering the entire workflow lifecycle (available → active → submitted → revisions → completed). This is where most of the productive day is spent.

**GROWTH** lifts the contributor's eyes from this week to this year. Reliability isn't a number to fear; it's a trajectory.

**EARNINGS** answers "did I get paid" cleanly, with no friction.

**COMMUNITY** is the soft layer — mentorship, peers, messages — designed to feel like belonging, not management.

**ACCOUNT** is the housekeeping footer.

### 3.3 What's notably absent

- No "Dashboard" labeled as such. The Home page is **TODAY · Home** because dashboards imply data tools; "Today" implies daily work.
- No "Notifications" route. Notifications are integrated into Messages; if they need attention they appear inline on Home.
- No "Analytics". The contributor doesn't analyze themselves — Growth surfaces the trends gently in context.
- No "Governance" zone. Governance happens elsewhere (mentor portal). The contributor only sees it as occasional banners, never as a navigation destination.

### 3.4 Visual sidebar weight

- **TODAY** is visually primary (subtle background tint, slightly bolder section label).
- **WORK** is the operational anchor (largest section by item count).
- **GROWTH**, **EARNINGS**, **COMMUNITY** read as supporting sections.
- **ACCOUNT** is a footer (visually subdued).

---

## 4. Contributor Operational Ecosystem

The systems that make the portal feel like a true workforce productivity platform.

### 4.1 Productivity systems

- **Daily focus** — a single "what's next" recommendation on Home
- **Workload meter** — current commitments vs your historical capacity
- **Velocity tracker** — items completed this week vs last
- **Deadline radar** — upcoming deadlines softly visualized (not as red alarms)
- **Distraction-free workroom** — the work surface itself, with non-work UI hidden by default

### 4.2 Workroom systems

- **Task brief** — the spec, acceptance criteria, skill level, deadline, all in one structured pane
- **Evidence collector** — drag-drop artifact upload with type checking
- **Spec-coverage map** — visual showing which acceptance criteria are addressed
- **Progress journal** — optional notes the contributor writes as they go (visible to mentor on submit if shared)
- **AI assistant** — embedded, not modal; suggestions appear inline where work happens

### 4.3 Submission systems

- **Pre-submit readiness check** — AI scans the work against acceptance criteria
- **Evidence checklist** — all required artifacts ticked off
- **Single Submit CTA** with confirmation modal
- **Post-submit state** — "Submitted · review window: 24h" with a polite waiting state

### 4.4 Revision systems

- **Revision inbox** — when rework is requested, a single screen shows what to fix
- **Anchored corrections** — each correction tied to a specific criterion, with mentor's note
- **AI fix suggestions** — where applicable, AI offers a starting point
- **Diff viewer** — compare v1 vs v2 of the contributor's own work
- **Resubmit flow** — same as submit, with "addressed" badges next to corrections

### 4.5 Contributor intelligence systems

- **Reliability trend** — your acceptance rate over the last 90 days, charted gently
- **Skill velocity** — your level-up trajectory per skill
- **Strength signals** — areas you consistently nail
- **Growth opportunities** — areas where rework patterns suggest learning targets (framed as growth, never as deficiency)

### 4.6 AI assistance systems

See [Section 6](#6-contributor-ai-experience) for the full philosophy.

Briefly:
- AI suggests, never commits
- AI explains, never accuses
- AI surfaces fix patterns, not violations
- AI tone is colleague, not auditor

### 4.7 Reliability systems

- **Reliability score** (0–100) calibrated on accept rate, rework rounds, on-time delivery
- **Trend arrow** — improving / flat / declining, with gentle copy
- **Why it changed** — when reliability moves, a tiny "what caused this" tooltip explains
- **Recovery messaging** — when reliability dips, the message is "here's how to recover" not "your score dropped"

---

## 5. Workroom UX Strategy

The single most important contributor screen. Where the work actually happens.

### 5.1 Workroom philosophy

> *"The workroom is where the contributor delivers. Nothing on screen should compete with delivery."*

Everything in the workroom serves the act of doing the work:
- the spec is visible
- the evidence accumulates
- the AI helps when asked
- the submit button waits patiently

### 5.2 Layout principle

Three vertical zones, focus-optimized:

```
┌───────────────────────────────────────────────────────────────┐
│ THIN HEADER · task title · deadline · skill ladder · save     │
├──────────────────────┬────────────────────────────────────────┤
│                      │                                        │
│  WORK PANE (60%)     │  CONTEXT PANE (40%)                   │
│  ────────────────    │  ────────────────────                 │
│  spec (collapsed)    │  acceptance criteria                  │
│  notes editor        │  evidence collector                   │
│  artifact uploads    │  spec-coverage map                    │
│                      │  AI assistant (collapsed by default)  │
│                      │                                        │
├──────────────────────┴────────────────────────────────────────┤
│ FOOTER · readiness % · save draft · submit                    │
└───────────────────────────────────────────────────────────────┘
```

### 5.3 Focused task execution

- **One task per workroom.** No tabbed multi-task interface.
- **Distraction-free toggle.** A single button hides the side context pane, expanding the work pane to full-width.
- **Autosave every 30 seconds.** Visible save status.
- **No notifications interrupt** the workroom. Everything queues to Messages.

### 5.4 AI-assisted work

The AI in the workroom is **summoned, not pushed**:

- A small AI icon in the corner of the work pane
- Click it to expand the AI assistant inline (not modal)
- The AI knows the spec, the contributor's prior submissions, and similar accepted work
- The AI offers: "show me a similar accepted submission" · "draft an outline" · "check my coverage of criteria"
- The AI never auto-suggests when the contributor hasn't asked

### 5.5 Evidence upload

- Drag-and-drop into a single drop zone
- Auto-detect file type and route into the right artifact slot
- Show progress per file
- Plagiarism + virus scan happen invisibly; only surface results if there's an issue
- File sizes, types, checksums visible (but not loud)

### 5.6 Submission flow

- **Readiness bar** at the bottom shows a 0–100 score (evidence completeness, spec coverage, AI readiness)
- **Submit** is enabled at any readiness, but the score is shown — soft pressure, no hard block
- Click Submit → confirmation modal:
  - "What you're submitting" — file list
  - "What gets shared with the reviewer" — full spec coverage
  - "Estimated review window" — based on pool capacity
  - **Confirm** or **Back to workroom**

### 5.7 Mentor feedback visibility

When feedback arrives:
- The workroom carries a soft banner at top: "Feedback received from {Mentor}"
- Click the banner → opens the feedback inline
- Feedback is presented as **what worked** first, then required corrections, then suggestions
- Each correction is anchored to a criterion in the spec

### 5.8 Revision handling

- Revision opens a **new version** in the same workroom (v2, v3)
- The original v1 work is preserved and viewable
- Each correction has a checkbox the contributor ticks as they address it
- AI can offer a "fix suggestion" per correction
- Submit-for-revision reuses the same submission flow

### 5.9 Progress continuity

- Closing and reopening the workroom restores the exact state (notes, evidence, AI conversation, scroll position)
- Multi-device continuity — the work-in-progress syncs across the contributor's devices
- A small "last edited" timestamp in the header confirms continuity

---

## 6. Contributor AI Experience

### 6.1 The contract

The contributor AI has one job: **help the contributor deliver**.

- **Supportive**, not surveillance
- **Suggestive**, not prescriptive
- **Inline**, not modal
- **Summoned**, not pushed
- **Auditable**, not opaque (but the auditability is in service of trust, not control)

### 6.2 What AI does

| Surface | What AI does |
|---|---|
| Task discovery | Recommends tasks aligned to skill ladder + history + interests |
| Pre-acceptance | Estimates effort vs the contributor's historical velocity |
| Workroom | On request — surfaces similar accepted work, drafts outlines, checks spec coverage, suggests evidence |
| Submission | Runs a pre-submit readiness check (evidence completeness, spec coverage, missing artifacts) |
| Revision | Offers a fix suggestion per correction; explains why mentor flagged something |
| Post-acceptance | Suggests next tasks; surfaces skill-ladder progression opportunities |
| Confidence | Explains reliability changes; offers recovery paths when score dips |

### 6.3 What AI doesn't do

- **No autonomy.** AI never submits, never commits on behalf of the contributor.
- **No accusation.** AI never says "we detected X". It says "you might want to consider Y".
- **No nagging.** AI doesn't pop up unsolicited unless there's a critical readiness gap *and* the contributor is in the submit flow.
- **No chatbot.** AI doesn't have a chat persona. It has *features* — "check coverage", "draft outline", "explain feedback" — each invoked deliberately.

### 6.4 AI tone reference

| Don't say | Say instead |
|---|---|
| "We detected a plagiarism risk." | "A few patterns here look similar to a public repo — want to check the originality view together?" |
| "Your submission is incomplete." | "Looks like 2 of the acceptance criteria don't have evidence yet. Add now or submit as draft?" |
| "Your reliability score dropped." | "Reliability dipped this week — usually a small thing. Here's the most likely cause." |
| "You missed the deadline." | "This one ran past the deadline. Want help planning the resubmit?" |

### 6.5 Confidence signals

Every AI suggestion carries a **confidence**:

- **High** — "this matches a strong pattern from your past accepted work"
- **Medium** — "this might help; up to you"
- **Low** — "rough draft idea; treat as starting point"

The contributor sees the confidence as a small label, never as a number-shaped accusation.

### 6.6 Visual treatment

- AI surfaces use a **teal** accent (productivity-blue) — not the mentor portal's forest accent (governance-green).
- AI cards have a small **"AI"** glyph, never a robot avatar or sparkles.
- AI suggestions appear in a **collapsed-by-default** drawer, expanded on click.
- AI confidence is a one-word chip, not a percentage bar.

This is deliberately gentler than mentor portal AI. Contributors should feel *helped*, not *measured*.

---

## 7. Productivity & Motivation UX

Sustained delivery is a function of motivation. Motivation is built quietly.

### 7.1 Progress visibility

**Daily** — On Home: today's commitments, what's due, what's next
**Weekly** — On Home: items completed this week, vs last week
**Monthly** — On Growth pages: skill ladder progression, credentials earned
**Yearly** — On Earnings: YTD earnings, tax-doc lineup, anniversary callout

Progress is layered by time horizon, not crammed onto one screen.

### 7.2 Milestone systems

- **First accepted submission** — credential evidence issued, small acknowledgment
- **First level-up** in a skill — credential evidence + portfolio entry
- **Reliability milestone** (e.g., crossing 90) — gentle notification
- **Earnings milestone** (e.g., crossing $5k YTD) — congratulatory line in Earnings header
- **Anniversary** — "you've been with GlimmoraTeam for a year"

All milestones are **quiet by default**. Confetti is consumer UX; professional contributors prefer dignity over fanfare.

### 7.3 Workload clarity

- **Current commitments** — the count of tasks the contributor has accepted but not submitted
- **Capacity meter** — current commitments vs the contributor's historical average
- **Soft load warning** — when commitments exceed historical capacity, a gentle "this is more than you usually take on" note appears at task-accept time

The platform protects the contributor from over-commitment — that's a long-term trust signal.

### 7.4 Momentum indicators

- **Velocity bar** on Home — items completed this week, with a soft trend line
- **Streak** — accepted submissions in a row, without a rework round (visible only after the first 5; never displayed if 0)
- **Recent wins** — last 3 accepted submissions, briefly listed

Momentum indicators are surfaced when they're positive. The platform doesn't rub it in when momentum is low.

### 7.5 Completion tracking

For each active task:
- Milestone count (5 of 7 criteria addressed)
- Time-on-task vs estimate
- Readiness score climbing as work progresses

These are not gamification — they're a real signal to the contributor about where they are.

### 7.6 Contributor confidence systems

Confidence is built through consistency of experience:

- The same Submit flow every time
- The same review-window estimate every time
- The same feedback structure every time
- The same revision UX every time
- The same payment cadence every time

The platform feels **predictable**. Predictability is the deepest motivator.

---

## 8. Contributor State Systems

Every task the contributor has touched lives in exactly one of these states.

### 8.1 State definitions

| State | What it means (contributor view) | UX handling |
|---|---|---|
| **Assigned** | A task has been routed to you; you haven't accepted yet | Lives on Available Tasks; soft "review and accept" CTA |
| **In Progress** | You've accepted; the workroom is open | Lives on Active Tasks; "resume" CTA opens the workroom |
| **Awaiting Submission** | The workroom is mostly complete; you haven't hit submit yet | Lives on Active Tasks with a "ready to submit" tag |
| **Submitted** | You've submitted; the mentor is reviewing | Lives on Submissions; "submitted · review window: 24h" copy; no anxiety triggers |
| **Revision Requested** | Mentor asked for changes | Lives on Revisions; "see what to fix" CTA; corrections framed as guidance |
| **Approved** | Mentor accepted; payment in flight | Lives on Completed Work; quiet celebration; payout reference |
| **Blocked** | Something out of your control (hold, dependency, contract pause) | Lives on Active Tasks with a "we'll let you know" message; SLA paused; not your fault made explicit |
| **Escalated** | Rare — a dispute or governance situation | Lives on Active Tasks; mentor portal handles the actual workflow; you see the status, not the routing chain |
| **Completed** | Closed and archived | Lives on Completed Work; portfolio-eligible |

### 8.2 State transitions visible to the contributor

```
Assigned → In Progress → Awaiting Submission → Submitted
                                              ├──► Approved → Completed
                                              ├──► Revision Requested → In Progress (round 2+)
                                              └──► Escalated (rare; mostly invisible to contributor)

Any active state → Blocked (rare; signals platform handling)
```

### 8.3 UX rules per state

- **Assigned** uses a calm teal accent. CTA: "Review task".
- **In Progress** uses a productive deep-teal accent. CTA: "Open workroom".
- **Awaiting Submission** carries a soft "ready" badge. CTA: "Review and submit".
- **Submitted** is intentionally serene — soft gray. Copy: "We'll review within X hours."
- **Revision Requested** uses a friendly amber accent. CTA: "See what to fix" (not "Fix this").
- **Approved** uses forest with a small celebration line. CTA: "View portfolio entry".
- **Blocked** uses a calm gray with an explanatory line. **The contributor is never made to feel at fault.**
- **Escalated** is the most carefully framed. Copy: "Under review by GlimmoraTeam — we'll follow up."
- **Completed** is gentle archive gray.

### 8.4 What the contributor never sees

- Governance routing chains
- AI escalation forecasts
- Mentor calibration data
- Reviewer pool capacity
- SLA breach forecasts

These belong to the mentor portal. The contributor's view of the same data is **softer, framed, and time-bound**.

---

## 9. Enterprise Workforce UX Principles

The five operating principles that shape every contributor screen.

### 9.1 Principle 1 — Reduce contributor overwhelm

A contributor opening the platform should see **at most three things** on the first fold of Home:

1. What's due today (1–2 items max)
2. What's pending review
3. What's next (recommended tasks · max 3 cards)

Everything else lives behind a click. Information is layered; nothing is crammed.

### 9.2 Principle 2 — Improve execution clarity

Every active task carries:
- A one-sentence "what to deliver"
- A list of acceptance criteria
- A deadline
- A list of required artifacts
- A confidence score that updates as work progresses

There is **no ambiguity** about what acceptance looks like.

### 9.3 Principle 3 — Improve task confidence

Confidence comes from removing friction:

- Acceptance criteria visible before accepting
- Deadline calibrated to actual historical velocity
- Skill alignment shown (you're qualified)
- Past similar accepted work surfaced as reference
- AI assistance one click away

### 9.4 Principle 4 — Improve workflow continuity

The workflow lifecycle (Section 2) is **explicit and visible**:

- Every task lives in exactly one state at a time
- State transitions feel gradual, not abrupt
- The platform always tells the contributor what comes next
- Workrooms preserve state across sessions and devices

### 9.5 Principle 5 — Improve operational trust

The platform earns trust by:

- Paying on time
- Reviewing within stated SLAs
- Framing feedback constructively
- Explaining when something blocks
- Never blaming the contributor for platform problems

This is the deepest principle — the others orbit it. Trust is the compounding asset of any workforce platform.

---

## 10. Implementation Direction

### 10.1 How contributor UX differs from mentor UX

| Axis | Mentor portal (V2) | Contributor portal (V2) |
|---|---|---|
| **Operational stance** | Governance, audit, enforcement | Productivity, momentum, delivery |
| **Density** | Sophisticated, table-heavy | Calm, card-forward |
| **Hierarchy** | Severity-first | Momentum-first |
| **AI tone** | Auditable colleague | Supportive collaborator |
| **AI accent** | Forest (governance-green) | Teal (productivity-blue) |
| **State indicator** | Severity rail, breach urgency | Soft state chip with friendly tone |
| **Empty state** | "Select a row to investigate" | "You're all caught up — here's what's next" |
| **Banner** | Governance enforcement, hold reasons | Mentor commendation, milestone reached |
| **Visual rhythm** | Dense rows, sticky filters, drawers | Spacious sections, inline progress, no drawers |
| **Decision support** | Audit timeline, signed events | Spec coverage, evidence checklist |
| **Voice** | Operational, formal | Encouraging, professional |

### 10.2 Reusable workflow patterns

What can be reused from the mentor workspace shared layer (`_shared/workflow/`):

| Primitive | Reuse plan |
|---|---|
| `OperationalCard` | Reuse for card containers |
| `Section primitives` (headers, dividers) | Reuse |
| `WorkflowStateChip` | **Restyle** — different state taxonomy, gentler tones |
| `AuditableBadge` | **Do not reuse** — contributor portal doesn't surface "Auditable" |
| `ConfidenceGauge` | Reuse for AI suggestions but **rename** to `SuggestionConfidence` and rework copy |
| `RecommendationBlock` | Reuse for AI suggestions but recolor to **teal** accent |
| `GovernanceTimeline` | **Do not reuse** — replace with `ProgressTimeline` (milestones, not audit events) |
| `GovernanceBanner` | **Do not reuse** — replace with `FeedbackBanner` or `MilestoneBanner` |
| Severity tokens | **Reuse the file**, but contributor portal opts into a different palette mapping |

The shared severity-token canon and vocabulary file remain authoritative; the contributor portal extends them with its own labels and tones.

### 10.3 Productivity-first design direction

Every contributor screen passes through these filters:

1. **What does the contributor do here?** If it's not a delivery action, it's a reference page.
2. **Can the next step always be found in one glance?** If not, redesign the section hierarchy.
3. **Is the AI summoned or pushed?** Summoned only.
4. **Is the feedback framed as guidance or surveillance?** Guidance only.
5. **Does the screen feel calm at peak load?** If not, density is wrong.

### 10.4 Scalable workforce platform thinking

The contributor portal scales with the platform's contributor count and task volume. Three scale tests:

- **10,000 contributors active.** The Home page must still feel personal. It does — every surface is contributor-scoped, not pool-scoped.
- **100 tasks per contributor lifetime.** Completed Work and Portfolio must remain navigable. They do — search, filter, and grouping by skill / project / year.
- **AI assistance handling complex tasks.** AI must remain explainable and summoned. It does — per-feature invocation, no global chat.

### 10.5 Reorganization phases

| Phase | Scope |
|---|---|
| **Phase 1 · IA reorganization** | Sidebar restructure to the 5-section model in Section 3 |
| **Phase 2 · Home (Today)** | The productivity hub — "what's next" surface + daily progress |
| **Phase 3 · Workroom** | The delivery cockpit — 3-zone layout with embedded AI |
| **Phase 4 · Revision flow** | Anchored corrections + AI fix suggestions + resubmit |
| **Phase 5 · Growth & Earnings** | Skill ladder, credentials, portfolio, earnings overview |
| **Phase 6 · Submission & Approval** | Pre-submit readiness check + post-accept quiet celebration |
| **Phase 7 · Cross-screen consistency** | Tokens, vocabulary, visual rhythm across the contributor portal |

---

## Appendix · Mentor vs Contributor UX Reference

Quick visual reference for designers and engineers building contributor screens.

### A. Tone reference

| Concept | Mentor portal language | Contributor portal language |
|---|---|---|
| The work | "Submission", "Item", "Review" | "Task", "Work", "Submission" |
| The other party | "Contributor" | "Mentor" / "Reviewer" |
| The clock | "SLA", "Resolution SLA" | "Deadline", "Review window" |
| AI source | "AI v3.2 · Auditable" | "AI suggestion" |
| Risk | "Severity", "Policy risk", "Impact tier" | (absent — replaced with "readiness" and "coverage") |
| State chip | "Escalated", "Governance hold" | "Under review", "Action needed" |
| Action | "Resolve", "Escalate", "Hold" | "Submit", "Resume", "Fix" |
| Mistake | "Override", "Calibration event" | "Revision", "Adjustment" |
| Completion | "Signed", "Audit anchored" | "Accepted", "Done" |

### B. Visual reference

| Element | Mentor portal | Contributor portal |
|---|---|---|
| Primary brand accent | Brown | Teal |
| Governance accent | Forest | (absent) |
| AI accent | Forest with Auditable badge | Teal with AI glyph |
| Severity rail | 3px red/gold/teal rail on rows | (absent on most surfaces · used only for active state in workroom) |
| Card style | Dense, bordered, low-padding | Spacious, soft-shadow, larger-padding |
| Type scale | 10–13px dense | 12–15px comfortable |
| Tone copy | Operational, terse | Encouraging, professional |
| Empty state | "Select a row to investigate" | "All caught up — here's what's next" |

### C. Sidebar comparison

| Mentor V2 | Contributor V2 |
|---|---|
| Overview · Reviews · Contributor Insights · AI Assistance · Governance · Analytics | Today · Work · Growth · Earnings · Community · Account |
| 6 sections, 19 routes | 6 sections, 18 routes |
| Primary section: **Reviews** (operational core) | Primary section: **Today** (daily entry) |
| Heavy governance emphasis | No governance section |
| Sidebar accent: Brown / Forest | Sidebar accent: Teal |

### D. Closing line for the contributor portal storyline

> *"GlimmoraTeam's redesigned Contributor Portal is the platform's productivity surface — built so a professional contributor knows what to do next, how to do it well, and whether they're getting better. Where the mentor portal earns enterprise trust through governance maturity, the contributor portal earns contributor loyalty through delivery clarity and quiet respect."*
