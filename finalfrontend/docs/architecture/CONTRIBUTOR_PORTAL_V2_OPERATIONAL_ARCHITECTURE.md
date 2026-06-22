# Contributor Portal V2 — Operational UX Architecture

> **Series position.** Second document in the Contributor Portal V2 set.
> - `CONTRIBUTOR_PORTAL_V2_STRATEGY.md` — the *why* (Phase 0)
> - `CONTRIBUTOR_PORTAL_V2_OPERATIONAL_ARCHITECTURE.md` — *this document* — the *operational reorg* (Phase 1)
> - The execution blueprint and screen library follow in Phases 2 and 3.
>
> **Source ground truth.** The strategy doc plus the existing `src/app/contributor/*` routes (`tasks`, `submissions`, `earnings`, `messages`, `support`, `community`, `profile`, `credentials`, `learning`, `onboarding`).
>
> **Operating thesis.** *Before a single contributor screen is built, the operational architecture must already be cohesive: one IA, one lifecycle, one state system, one productivity philosophy, one AI assistance contract. This document is that architecture.*

---

## Table of Contents

1. [Contributor Operational Philosophy](#1-contributor-operational-philosophy)
2. [Contributor Information Architecture Reorganization](#2-contributor-information-architecture-reorganization)
3. [Contributor Workflow Lifecycle](#3-contributor-workflow-lifecycle)
4. [Contributor State System Architecture](#4-contributor-state-system-architecture)
5. [Workroom UX Architecture](#5-workroom-ux-architecture)
6. [Productivity & Momentum Systems](#6-productivity--momentum-systems)
7. [AI Assistance Architecture](#7-ai-assistance-architecture)
8. [Revision & Feedback Philosophy](#8-revision--feedback-philosophy)
9. [Enterprise Workforce UX Principles](#9-enterprise-workforce-ux-principles)
10. [Implementation Direction](#10-implementation-direction)
11. [Appendix · System Tables](#appendix--system-tables)

---

## 1. Contributor Operational Philosophy

### 1.1 The opening contract

> *"The contributor portal is the platform's productivity surface — built for momentum, confidence, and clear next steps. It must feel like a delivery cockpit, not a control center."*

Where the mentor portal is the platform's **irreversibility surface** (governance, audit, enforcement), the contributor portal is the **delivery surface** (execution, momentum, growth). The two share infrastructure but must feel fundamentally different.

### 1.2 Contributor experience principles

The five operating principles that shape every contributor surface:

1. **One next step is always obvious.** A contributor never asks "what should I do now?" The platform answers it before they ask.
2. **The work is the centerpiece.** Everything else (chat, governance, analytics) lives behind a click. The workroom is uncluttered.
3. **Feedback feels like guidance, not surveillance.** Mentor notes lead with "what worked"; AI suggestions are summoned, not pushed.
4. **Predictability earns trust.** Same Submit flow every time. Same review window. Same payout cadence. Same revision UX.
5. **Quiet motivation, not loud gamification.** No confetti, no leaderboards, no badges with shouty copy. Dignity over fanfare.

### 1.3 Workforce productivity philosophy

A workforce productivity surface optimizes for **delivered work per contributor-day**, not for **screens viewed per session**. That changes design defaults:

- Pages do not compete for attention. Each surface answers exactly one question.
- The workroom hides everything that isn't part of the work.
- Notifications are bundled, not interruptive. Real-time push is reserved for **acceptance / payment / urgent revision request** — nothing else.
- The platform is happy to be invisible during focused execution.

### 1.4 Operational clarity philosophy

Clarity is the inverse of overload. A contributor cannot deliver if they're unsure:

- **What is expected** — acceptance criteria are visible before accepting the task
- **What is enough** — readiness signals tell the contributor when their work is submission-ready
- **What comes next** — every state has a single next-action surfaced as the primary CTA
- **When something blocks** — blocked states explicitly assign the cause to the platform, not the contributor

Clarity is a design constraint enforced at the system level. Every screen must answer those four questions or be redesigned.

### 1.5 Contributor confidence systems

Confidence is built by **removing surprise**:

- Acceptance criteria are visible before commitment.
- Deadlines are calibrated to historical velocity, not arbitrary.
- Mentor review windows are estimated based on pool capacity, not vague.
- Payment timing is stated in days, not "soon".
- Revision feedback is anchored to specific criteria, not free-text walls.

A confident contributor delivers faster and more accurately. Confidence is the most direct productivity lever the platform has.

### 1.6 Execution continuity philosophy

Continuity is the **promise that nothing is lost between sessions**:

- The workroom restores exact state on reopen — notes, draft, evidence, AI conversation, scroll position.
- Multi-device sync — start on laptop, continue on tablet, finish on laptop.
- Reopened tasks return the contributor to the precise next-action they left, never to a generic landing.
- The journey across rework rounds preserves v1 → v2 → v3 history without rebuilding context.

Continuity is invisible when it works; catastrophic when it doesn't.

### 1.7 AI-assisted productivity philosophy

AI in the contributor portal is a **summoned collaborator**, not a pushed observer:

- AI features are explicit (Draft outline, Check coverage, Suggest evidence, Explain feedback). Each is invoked deliberately.
- AI never appears as a chat thread. The chatbot metaphor is wrong for delivery work.
- AI suggestions carry a **confidence chip** — High · Medium · Low — not a percentage. Contributors don't need calibration arithmetic.
- AI tone is colleague, not auditor. "You might want to consider…" not "We detected…".
- AI accent color is **teal** (productivity-blue), deliberately different from the mentor portal's forest (governance-green).

---

## 2. Contributor Information Architecture Reorganization

### 2.1 The IA tree

Five sections plus an Account footer. Eighteen routes. Productivity-first.

```
┌─ TODAY                                  ◄ daily entry point
│  ── Home                                ◄ "what's next" + today's commitments
│  ── My Schedule                         ◄ deadlines, reviews, mentorship slots
│
├─ WORK                                   ◄ active operational core
│  ── Available Tasks                     ◄ discover + accept
│  ── Active Tasks                        ◄ in-progress workrooms
│  ── Submissions                         ◄ submitted, awaiting review
│  ── Revisions                           ◄ rework requested — action needed
│  ── Completed Work                      ◄ archive + portfolio source
│
├─ GROWTH                                 ◄ longitudinal trajectory
│  ── Skill Ladder                        ◄ visible per-skill progression
│  ── Credentials                         ◄ issued verifiable credentials
│  ── Learning Recommendations            ◄ targeted near-ladder gaps
│  ── Portfolio                           ◄ shareable evidence
│
├─ EARNINGS                               ◄ predictable money surface
│  ── Earnings Overview                   ◄ pending + disbursed + projected
│  ── Payout History                      ◄ line-item with refs
│  ── Tax Documents                       ◄ year-end docs
│
├─ COMMUNITY                              ◄ soft belonging layer
│  ── Mentorship                          ◄ scheduled sessions + gentle watchlist signals
│  ── Discussions                         ◄ peer community
│  ── Messages                            ◄ inbox (mentor / system / peer)
│
└─ ACCOUNT                                ◄ housekeeping footer
   ── Profile
   ── Settings
   ── Support
```

### 2.2 Hierarchy reasoning

**TODAY is primary** because the contributor's session always starts with "what should I be working on right now?". A dashboard label would imply a data tool; Today implies daily delivery. Primary sections carry sidebar emphasis (slightly bolder label, brand-accent dot).

**WORK is the operational anchor** — the five operational surfaces covering the entire lifecycle. Most active hours are spent inside this section. It is the largest section by route count by design.

**GROWTH lifts the gaze** from this week to this year. Reliability isn't a number to fear; it's a trajectory to maintain. Growth surfaces are quiet, narrative, and respectful.

**EARNINGS is concrete and short**. Three routes: overview, history, tax. No analytics, no projections gymnastics. Predictability is the design goal.

**COMMUNITY is the belonging layer**. Soft, not transactional. Mentorship invitations and peer discussions feel social, not managerial.

**ACCOUNT is a footer**. Profile, Settings, Support. Visually subdued. Never the operational entry point.

### 2.3 Operational grouping logic

Every contributor surface answers exactly **one operational question**:

| Section | Surface | Question it answers |
|---|---|---|
| Today | Home | "What should I work on now?" |
| Today | My Schedule | "What's coming up this week?" |
| Work | Available Tasks | "What can I take on?" |
| Work | Active Tasks | "What am I in the middle of?" |
| Work | Submissions | "What's pending review?" |
| Work | Revisions | "What needs my attention?" |
| Work | Completed Work | "What have I delivered?" |
| Growth | Skill Ladder | "How am I leveling up?" |
| Growth | Credentials | "What have I earned?" |
| Growth | Learning | "What should I learn next?" |
| Growth | Portfolio | "What can I show people?" |
| Earnings | Overview | "How am I getting paid?" |
| Earnings | History | "What was I paid for?" |
| Earnings | Tax | "Where are my tax docs?" |
| Community | Mentorship | "Who's coaching me?" |
| Community | Discussions | "What are peers talking about?" |
| Community | Messages | "What needs my response?" |

If a screen cannot answer one question cleanly, it is the wrong screen.

### 2.4 Contributor psychology considerations

The IA respects three psychological realities:

1. **Decision fatigue is real.** A contributor working 4–6 tasks a week shouldn't choose between 12 sidebar items. Five sections + Account is the ceiling.
2. **Anxiety amplifies in queue-shaped UI.** Mentor portals lean on dense tables; contributor portals lean on card-forward layouts that show one item at a time when possible.
3. **Pride is fragile and quiet.** Growth surfaces are framed as trajectories, not scores. Earnings are framed as predictability, not race-to-the-top.

### 2.5 What's deliberately absent

- **No "Dashboard"** label. Today replaces it.
- **No "Notifications"** route. Notifications integrate into Messages and Home.
- **No "Analytics"**. Contributor doesn't analyze themselves — Growth surfaces trends in context.
- **No "Governance" zone**. Governance is mentor portal territory; contributors see soft banners only.
- **No global "Chat" or "Assistant"**. AI is feature-scoped per surface.
- **No "Reputation" page**. Reputation is implicit in the Growth + Earnings sections; surfacing it as a destination amplifies anxiety.

---

## 3. Contributor Workflow Lifecycle

### 3.1 Full lifecycle map

```
                      ┌──────────────────────┐
                      │   Onboarding         │  ◄ one-time
                      └──────────┬───────────┘
                                 ▼
                      ┌──────────────────────┐
   ┌─────────────────►│   Task Discovery     │  ◄ recurring
   │                  └──────────┬───────────┘
   │                             ▼
   │                  ┌──────────────────────┐
   │                  │   Task Assignment    │  ← can be platform-routed
   │                  └──────────┬───────────┘  or self-claimed
   │                             ▼
   │                  ┌──────────────────────┐
   │                  │   Task Acceptance    │  ← soft commitment
   │                  └──────────┬───────────┘
   │                             ▼
   │                  ┌──────────────────────┐
   │   ┌─────────────►│   Active Execution   │  ← workroom
   │   │              └──────────┬───────────┘
   │   │                         │
   │   │      ┌──────────────────┼─────────────────┐
   │   │      ▼                  ▼                 ▼
   │   │  ┌───────┐         ┌─────────┐       ┌─────────┐
   │   │  │Blocked│         │Awaiting │       │Evidence │
   │   │  │       │         │Clarif.  │       │Upload   │
   │   │  └───┬───┘         └────┬────┘       └────┬────┘
   │   │      │                  │                 │
   │   └──────┴──────────────────┴─────────────────┘
   │                             │
   │                             ▼
   │                  ┌──────────────────────┐
   │                  │   Submission         │  ← single moment
   │                  └──────────┬───────────┘
   │                             ▼
   │                  ┌──────────────────────┐
   │                  │   Under Review       │  ← mentor-side
   │                  └──────────┬───────────┘
   │                             │
   │             ┌───────────────┼────────────────┐
   │             ▼               ▼                ▼
   │      ┌───────────┐   ┌─────────────┐  ┌───────────┐
   │      │ Approved  │   │  Revision   │  │ Escalated │
   │      │           │   │  Requested  │  │  (rare)   │
   │      └─────┬─────┘   └──────┬──────┘  └─────┬─────┘
   │            │                │               │
   │            ▼                ▼               ▼
   │      ┌───────────┐    ┌──────────┐    ┌─────────────┐
   │      │ Completed │    │ Rework   │    │ Awaiting    │
   │      │ + Payout  │    │ (v2/v3)──┼──► │ Platform    │
   │      └─────┬─────┘    └──────────┘    │ Resolution  │
   │            │                          └─────────────┘
   │            ▼
   └────────────┘  ◄ contributor loops to next task
```

### 3.2 Phase-by-phase journey

**Onboarding** (one-time). Identity & skills → calibration task → first match → first accept. Confidence-building; escorted not tested.

**Task Discovery** (recurring). Algorithmic matches + skill-based browse + saved searches. Inviting card-forward UX; quality signals visible but quiet.

**Task Assignment**. Platform can route to the contributor based on match; the contributor can also self-claim from Available Tasks. Either path lands in the same Pending Acceptance state.

**Task Acceptance**. Pre-accept clarity — criteria, skill alignment, deadline, payout, required artifacts. A soft commitment moment ("I'll deliver by X"). No countdown panic.

**Active Execution**. The workroom takes over. The contributor focuses; the platform recedes. See [Section 5](#5-workroom-ux-architecture).

**Mid-flight states**. *Blocked* (platform-caused) · *Awaiting Clarification* (Q&A with mentor) · *Evidence Upload* (artifact collection in progress). These are transient sub-states of Active Execution, not separate journeys.

**Submission**. A single Submit moment. Pre-submit readiness check; confirmation modal listing what's being submitted; clear post-submit state.

**Under Review**. The contributor's workroom enters a quiet waiting state. Estimated review window visible. No anxiety triggers. Other tasks remain available.

**Decision** → one of three:
- **Approved** → Completed → Payout → loop back to discovery.
- **Revision Requested** → Rework cycle (v2, v3). Each round preserves history, anchors corrections, offers AI fix suggestions.
- **Escalated** (rare) → contributor sees "under platform review" — the full governance routing is invisible to them; only resolution status surfaces.

### 3.3 Loop-back behavior

After Completed, the platform proactively surfaces **two suggested next tasks** on Home — algorithmic matches that maintain momentum. This is the loop-back signal: delivery → recognition → next task.

The contributor never feels they've "finished for the day" until they choose to. Momentum is sustained, not forced.

### 3.4 Decision points the contributor controls

- Accept this task? (Yes / Not now)
- Submit now or save draft?
- Reply to clarification or pause SLA?
- Resubmit or request more help?
- Take next suggested task or browse?

Every decision point carries a clear default and a graceful alternative. Nothing is binary-coercive.

---

## 4. Contributor State System Architecture

### 4.1 The eleven states

Every task the contributor has touched lives in exactly one of these states.

| State | Operational meaning | UX accent | Contributor copy |
|---|---|---|---|
| **Assigned** | Platform routed this to you; not yet accepted | Calm teal | "New task suggested for you" |
| **Accepted** | You committed; workroom is opened but no work yet | Soft teal | "Let's get started" |
| **In Progress** | Active execution; the workroom is open and work has begun | Deep teal | "You're making progress" |
| **Blocked** | Outside your control (hold, upstream dependency, contract pause) | Calm gray | "Paused — we'll let you know when ready" |
| **Awaiting Clarification** | You asked a mentor question or mentor asked you; SLA may be paused | Soft amber | "Awaiting reply" |
| **Ready for Submission** | Workroom shows ≥ readiness threshold; you haven't hit submit | Forest soft | "Ready to submit" |
| **Under Review** | Submitted; mentor is reviewing | Quiet gray-blue | "We'll review within X hours" |
| **Revision Requested** | Mentor asked for changes; corrections are anchored | Friendly amber | "Let's polish this together" |
| **Approved** | Mentor accepted; payout is in flight | Forest | "Submission accepted" |
| **Completed** | Closed; portfolio-eligible | Soft sage | "Done · added to portfolio" |
| **Escalated** | Rare; in platform governance review | Calm muted blue | "Under platform review · we'll follow up" |

### 4.2 Transition rules

```
Assigned ──[accept]──► Accepted ──[start working]──► In Progress
                                                         │
                                                         ├──[blocking event]──► Blocked
                                                         │      ▲              │
                                                         │      └──[unblock]───┘
                                                         │
                                                         ├──[ask question]────► Awaiting Clarification
                                                         │      ▲              │
                                                         │      └──[reply]─────┘
                                                         │
                                                         ├──[readiness ≥ X]──► Ready for Submission
                                                         │
                                                         └──[submit]─────────► Under Review
                                                                                 │
                                                  ┌──────────────────────────────┤
                                                  ▼                              ▼
                                            Approved ──► Completed         Revision Requested ──► In Progress (v2)
                                                                                 │
                                                                                 ▼
                                                                            Escalated (rare)
```

### 4.3 Operational continuity rules

- **State is durable across sessions.** Closing the browser and reopening 3 days later returns the contributor to the exact state.
- **State changes are notifications, not interruptions.** Approved / Revision Requested generate a notification; Blocked / Escalated generate a notification. In Progress → Ready for Submission is a soft UI change inside the workroom, not a notification.
- **State changes are visible on Today.** The Home page surfaces every state change since last visit so the contributor can scan their morning.
- **State is reversible upstream.** A submitted task that the contributor accidentally submitted can be withdrawn within a short window (e.g., 5 minutes) before the mentor sees it.

### 4.4 Contributor guidance behavior per state

| State | Primary CTA | AI behavior | Notification policy |
|---|---|---|---|
| Assigned | Review task | Recommend reading the brief first | Soft notice on Home |
| Accepted | Open workroom | Suggest similar accepted past work | Soft notice on Home |
| In Progress | Resume | AI assistant available on demand | None — focus protected |
| Blocked | (no CTA — platform owns next move) | Explain what's blocking, in plain language | Push when state changes |
| Awaiting Clarification | View thread / Reply | None during await — re-engages on reply | Push when reply arrives |
| Ready for Submission | Review and submit | Pre-submit readiness summary | Soft nudge in workroom only |
| Under Review | (no CTA — waiting) | None | None |
| Revision Requested | See what to fix | Offer fix suggestions per correction | Push (highest-priority contributor notification) |
| Approved | View portfolio entry | Suggest next 2 tasks | Push (happy notification) |
| Completed | View portfolio entry | None | None |
| Escalated | (no CTA — platform owns next move) | Plain-language status | Push (gentle) |

### 4.5 Anti-state principles

- **The contributor is never made to feel at fault for Blocked or Escalated states.** Copy explicitly assigns the cause to the platform.
- **No "stalled" state is exposed to the contributor.** Stalled detection exists internally (for the platform to surface to mentors) but the contributor sees "In Progress" or "Awaiting Clarification" framed in their own time.
- **No "overdue" state on the contributor side.** Deadlines are stated; passing one becomes a "let's plan a resubmit" conversation, not a red badge.

---

## 5. Workroom UX Architecture

The contributor's operational cockpit. The single most important screen in the entire portal.

### 5.1 Workroom philosophy

> *"The workroom is where the contributor delivers. Nothing on screen should compete with delivery."*

The workroom is **the only contributor surface that hides global navigation by default**. It's a focused environment, not a page.

### 5.2 Three-zone layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  THIN HEADER · task title · deadline · skill ladder · save status        │
├───────────────────────────────────────┬──────────────────────────────────┤
│                                       │                                  │
│   WORK PANE (60%)                     │   CONTEXT PANE (40%)             │
│   ─────────────────                   │   ─────────────────              │
│                                       │                                  │
│   • spec brief (collapsed by default) │   • acceptance criteria          │
│   • working notes editor              │   • evidence collector           │
│   • inline AI assistant               │   • spec-coverage map            │
│   • artifact drop zone                │   • mentor feedback (when present)│
│                                       │   • AI assistant (collapsed)     │
│                                       │                                  │
├───────────────────────────────────────┴──────────────────────────────────┤
│  FOOTER · readiness % · save draft · submit                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Focused task execution

- **Single task per workroom.** No tabbed multi-task UI.
- **Distraction-free toggle.** A single button collapses the Context Pane and expands the Work Pane to full width.
- **Autosave every 30 seconds**, with visible save status. Manual save also available (`⌘S`).
- **No notifications interrupt the workroom.** Everything queues to Messages.
- **No global sidebar by default.** A pinnable corner button restores it if the contributor wants to navigate away.

### 5.4 Evidence workflow

- **Drag-and-drop into a single drop zone** in the Context Pane.
- **Auto-detect file type** and route into the right artifact slot (code, doc, screenshot, video, link, etc.).
- **Per-file progress** during upload.
- **Plagiarism + virus scan run invisibly.** Results surface only if there's an issue, and even then, the framing is "let's review together" not "we detected".
- **Evidence checklist** ticks off as each artifact lands.
- **Soft warning if an artifact is missing** at submit time — not a hard block.

### 5.5 AI productivity assistance (in-workroom)

The workroom AI is **summoned, not pushed**. A small AI icon in the corner of the Work Pane expands an inline assistant:

| Feature | Invocation | Output |
|---|---|---|
| **Draft outline** | "Draft outline" button | Bullet outline of typical structure for this task type |
| **Show similar accepted work** | "Show similar" button | 2–3 anonymized past accepted submissions |
| **Check spec coverage** | "Check coverage" button | List of acceptance criteria with addressed / pending status |
| **Suggest evidence** | "Suggest evidence" button | List of artifacts that similar tasks included |
| **Explain feedback** | (appears when mentor feedback arrives) | Plain-language explanation of why a correction was flagged |

The AI never auto-suggests when the contributor hasn't asked. The AI never has a chat persona. It has *features*.

### 5.6 Mentor feedback visibility

When mentor feedback arrives during active work:

- The workroom shows a **soft banner at the top**: "Feedback received from {mentor}".
- Click the banner → the feedback opens in the Context Pane (not as a modal, never as an interrupt).
- Feedback is rendered in three blocks:
  1. **What worked** (positive anchor, forest tint)
  2. **Required corrections** (anchored to criteria, friendly amber tint)
  3. **Suggestions** (optional, gray tint)
- Each correction has a small checkbox the contributor can tick as they address it. The tick state is purely the contributor's — it doesn't reach the mentor.

### 5.7 Progress continuity

- Reopening the workroom restores **everything**: notes, draft, evidence, AI conversation, scroll position, expanded sections.
- Multi-device sync via WebSocket — start on laptop, resume on tablet seamlessly.
- A small "last edited Xm ago · synced" line in the header confirms continuity.
- The browser tab title reflects the task name so the contributor can context-switch without losing track.

### 5.8 Revision handling

When a task moves from Revision Requested back into In Progress for round 2:

- The workroom opens as **v2** (or v3) — the v1 work is preserved and viewable.
- A **"Diff v1 ↔ v2"** toggle reveals what the contributor changed.
- Each correction (from the mentor) becomes a checklist item in the Context Pane. As work addresses it, the contributor ticks it.
- The AI can offer a **fix suggestion** per correction (e.g., "the previous submission was missing X; here's where similar accepted work added it").
- The Submit flow shows **"addressed" badges** next to corrections that the contributor ticked.

### 5.9 Submission preparation

The Footer surfaces a **Readiness Score** (0–100):

- Evidence completeness (0–40)
- Spec coverage (0–40)
- AI readiness check (0–20)

Submit is enabled at any readiness, but the score is shown — **soft pressure, no hard block**. The contributor decides.

Click Submit → a confirmation modal lists:
- What gets submitted (file list)
- Spec coverage summary
- Estimated review window (based on pool capacity)
- A **Confirm** button or **Back to workroom**

### 5.10 Operational guidance per state

Inside the workroom, a small status pill always indicates the current state with a single line of guidance:

- **Just opened**: "Take a moment with the spec, then start drafting"
- **Mid-work**: "Looking good — you've covered X of Y criteria"
- **Near readiness**: "You're close to ready — last check on evidence?"
- **Awaiting clarification**: "Waiting on a reply from {mentor}"
- **Blocked**: "Paused — we'll reach out when this unblocks"
- **After mentor feedback**: "Let's review the corrections together"

The guidance pill is the workroom's voice. It is calm, helpful, and never alarming.

---

## 6. Productivity & Momentum Systems

### 6.1 The momentum stack

Three layers of motivation, surfaced gently:

```
┌─────────────────────────────────────┐
│  Layer 3 · Trajectory (yearly)      │  ← Growth section
│   skill ladder · credentials · YTD  │
├─────────────────────────────────────┤
│  Layer 2 · Velocity (weekly)        │  ← Home section
│   items this week · streak · trend  │
├─────────────────────────────────────┤
│  Layer 1 · Focus (daily)            │  ← Home + Workroom
│   what's next · what's due · ready  │
└─────────────────────────────────────┘
```

Each layer answers a different time horizon. Crucially, **layer 1 is loudest** (most visible), and **layer 3 is quietest** (lives behind a click). This inverts the usual SaaS instinct to show all-time stats; for a working professional, today is what matters.

### 6.2 Workload visibility

A **Capacity Meter** on Home shows the contributor's current commitments against their **historical capacity** (rolling 4-week average). This is shown as a soft horizontal bar, not a percentage gauge.

- Below historical → "Room to take on more if you'd like"
- At historical → "Good steady week"
- Above historical → "More than your usual week — heads up"

The platform **proactively warns at task-accept time** if accepting would push the contributor above historical capacity. This is a trust signal: the platform is honest about pressure.

### 6.3 Velocity signals

On Home:
- "**This week**" count of completed submissions
- "**Last week**" count for comparison
- A small trend arrow when the delta is meaningful (≥30%)

Velocity is shown when positive or stable. The platform does not amplify a slow week with red arrows — that's surveillance UX, not productivity UX.

### 6.4 Completion psychology

Every completion event triggers **a small acknowledgment**:

- A one-line confirmation ("Submission accepted")
- Reliability delta (+0.5 if it's a clean accept, +1 if it broke a streak in a good way)
- Credential evidence issued (with a "view in portfolio" link)
- Two suggested next tasks immediately offered (loop-back)

No confetti. No leaderboards. No animations longer than 200ms. Dignity.

### 6.5 Streak handling

A **streak** is consecutive accepted submissions without a rework round. It's a real signal of consistency.

- Streaks are **only surfaced after the 5th consecutive accept**. Before that, they read as pressure.
- Streaks **never display "you broke your streak"** when interrupted. The platform celebrates a streak quietly while it lasts and disappears it without comment when it ends.
- Streak copy: "5 clean accepts in a row — strong week."

### 6.6 Milestone visibility

| Milestone | Surfacing |
|---|---|
| First accepted submission | Brief inline acknowledgment on Home + credential evidence issued |
| First skill level-up (e.g., L2 → L3) | Inline acknowledgment + credential evidence + a soft "share to portfolio" prompt |
| Reliability crosses a band (e.g., 80 → 85) | Inline acknowledgment in Growth section |
| Earnings milestone (e.g., $5k YTD, $10k YTD) | Single inline line in Earnings header |
| Anniversary (1y, 2y, etc.) | One-line "you've been with GlimmoraTeam for a year" |

All milestones are **inline, not modal**. They're noticed, not celebrated-at. Contributors can take a screenshot if they want to celebrate themselves.

### 6.7 Contributor confidence signals

Three signals that confidence is healthy:

1. **Reliability trend** — chart on Growth, gently rising or stable
2. **Acceptance rate** — last 10 submissions, percentage accepted on first try
3. **Average rework rounds** — declining or low

When confidence dips (e.g., two consecutive revisions), the platform surfaces a **"recovery panel"** on Home that frames the dip as ordinary and offers a path: "Most contributors see this pattern after taking on a new skill level. Here's a learning recommendation that helps." No shame, no urgency.

### 6.8 Productivity guidance principles

- **Guide forward, never backward.** "Here's what's next" beats "here's what went wrong".
- **Frame outcomes as patterns.** "Contributors who level up usually take on a slightly easier task next" — not "you should take an easier task".
- **Default to optimism in copy.** "You're close to ready" beats "you have 3 items missing".
- **Make help one click away.** Never two.

---

## 7. AI Assistance Architecture

### 7.1 The AI feature taxonomy

The contributor portal AI has five operational moments. Each carries its own features.

```
┌─ DISCOVER ─┬─ PREPARE ─┬─ EXECUTE ─┬─ SUBMIT ─┬─ RECOVER ─┐
│            │           │           │          │            │
│  match     │  brief    │  inline   │  pre-    │  explain   │
│  rec.      │  digest   │  helpers  │  submit  │  feedback  │
│            │           │           │  check   │            │
│  effort    │  past     │  evidence │          │  fix       │
│  estimate  │  work     │  suggest  │  cover-  │  suggest   │
│            │  surfacer │           │  age     │            │
│            │           │  coverage │  summary │  next      │
│            │           │  check    │          │  steps     │
│            │           │           │          │            │
└────────────┴───────────┴───────────┴──────────┴────────────┘
```

### 7.2 Feature-by-feature contract

| Feature | Moment | Input | Output | Tone |
|---|---|---|---|---|
| **Match recommendation** | Discover | Skill ladder + history + interests + current load | Ranked task cards | "Recommended for you based on your strength in X" |
| **Effort estimate** | Discover / Pre-accept | Task + contributor's historical velocity | Range estimate (e.g., 4–7h) | "Most contributors at your level finish this in 4–7 hours" |
| **Brief digest** | Prepare | Task spec | One-paragraph summary + acceptance criteria highlighted | "Here's the core of what's being asked" |
| **Past work surfacer** | Prepare / Execute | Task + contributor's accepted history | 2–3 anonymized examples of similar accepted work | "Here's how others approached this" |
| **Inline helpers** | Execute | Workroom context | Draft outline / suggestion / pattern | (only on click — never pushed) |
| **Evidence suggest** | Execute | Task type + spec | Checklist of typical evidence | "Tasks like this usually include…" |
| **Coverage check** | Execute / Submit | Work + acceptance criteria | Coverage map (addressed / pending) | "5 of 6 criteria covered" |
| **Pre-submit check** | Submit | Work + spec + evidence | Readiness score (0–100) + gaps | "You're at 87% — here are the last two items" |
| **Explain feedback** | Recover | Mentor's correction | Plain-language explanation | "The mentor's flagging this because…" |
| **Fix suggest** | Recover | Correction + similar past fixes | Suggested starting point for fix | "A pattern that often resolves this is…" |
| **Next steps** | Recover | Approved task | 2 suggested next tasks | "Want to keep momentum? Try these next." |

### 7.3 Tone canon (do / don't)

| Don't write | Do write |
|---|---|
| "We detected a plagiarism risk." | "A few patterns here look similar to a public repo — want to check the originality view together?" |
| "Your submission is incomplete." | "Looks like 2 of the acceptance criteria don't have evidence yet. Add now or submit as draft?" |
| "Your reliability score dropped." | "Reliability dipped this week — usually a small thing. Here's the most likely cause." |
| "You missed the deadline." | "This one ran past the deadline. Want help planning the resubmit?" |
| "Submission failed AI review." | "There's one thing to look at before you submit — let's go through it together." |
| "AI suggests rework." | (this phrase is never used. AI doesn't suggest rework. Mentors do.) |

### 7.4 Confidence labeling

AI suggestions carry a **one-word confidence chip**, not a percentage:

- **High** — "matches a strong pattern from your past accepted work"
- **Medium** — "this might help; up to you"
- **Low** — "rough draft idea; treat as starting point"

The chip is small, teal, and lives at the corner of each AI suggestion. Confidence shapes how seriously the contributor should take the suggestion — never how seriously the platform takes the contributor.

### 7.5 Invocation rules

| Rule | Why |
|---|---|
| AI never pops up unsolicited *except* when the contributor is in the Submit flow and readiness < 80% | Submit-moment readiness is high-stakes for the contributor; one gentle interjection is acceptable |
| AI never has a global chat thread | Chat invites endless conversation; the contributor's time is the resource |
| AI features live on the surface they apply to | Coverage check lives in workroom; effort estimate lives at task-accept; explain feedback lives in revision |
| AI is always one click to expand and one click to collapse | Reversibility builds trust |
| AI surfaces close automatically when the contributor moves to a different action | The AI doesn't follow the contributor around |

### 7.6 What AI never does

- **AI never commits** on behalf of the contributor (no auto-submit, no auto-accept-task).
- **AI never accuses** ("we detected…").
- **AI never measures** the contributor with public-feeling scores.
- **AI never moralizes** ("you should…").
- **AI never speaks first-person plural** ("we"). It speaks suggestion-first ("a pattern that often helps…").
- **AI never invents work** that the contributor didn't ask for.

### 7.7 AI accent and visual treatment

- AI surfaces use a **teal** accent, distinct from the mentor portal's forest.
- AI cards have a small **"AI"** glyph (one square box, no robot, no sparkles).
- AI suggestions appear as **collapsed-by-default inline panels**, never as modals.
- AI confidence is a **one-word chip**, never a percentage bar.
- No avatars, no chat-style bubbles, no "AI is thinking…" animations.

---

## 8. Revision & Feedback Philosophy

### 8.1 The framing flip

Mentor portal feedback is a **decision audit** (what was reviewed, what scored, what overrode). Contributor portal feedback is a **collaborative correction conversation**. The same data renders differently.

### 8.2 The three-block structure

Every revision feedback the contributor sees follows this structure, in this order:

```
┌─────────────────────────────────────────────────┐
│  1 · WHAT WORKED                                │  ← always first
│      (positive anchor, forest tint)             │
├─────────────────────────────────────────────────┤
│  2 · REQUIRED CORRECTIONS                       │
│      • criterion + ask + suggestion (per item)  │  ← bulk of content
│      (friendly amber tint, checklist)           │
├─────────────────────────────────────────────────┤
│  3 · OPTIONAL SUGGESTIONS                       │
│      (gray tint, never required)                │
└─────────────────────────────────────────────────┘
```

The order matters psychologically. Leading with "what worked" prevents the correction from feeling like a verdict.

### 8.3 Anchored corrections

Every required correction is anchored to:

- **A specific acceptance criterion** from the original spec
- **The mentor's note** explaining the gap
- **An evidence reference** when applicable
- **A severity** (Blocker · Major · Nit) — but never shown to the contributor as a colored alarm; shown as "this one is required" vs "this one is nice-to-fix"

Anchoring eliminates ambiguity. The contributor never wonders "what part of my work is this about".

### 8.4 Confidence-preserving revision UX

When the contributor opens a revision:

- The workroom reopens at v2.
- The original v1 work is preserved and viewable.
- The **what-worked** block is visible at the top of the Context Pane.
- The required-corrections list appears as a checklist.
- Each correction has a "fix suggestion" link (powered by AI) and a checkbox.
- The Submit flow shows "addressed" badges as the contributor ticks corrections.

Confidence is preserved by **leading with positive feedback** and **giving the contributor agency** — they tick each correction as they handle it.

### 8.5 Correction continuity across rounds

If a v2 submission still requires a v3:

- The new round preserves v1 → v2 → v3 history.
- Corrections that were resolved in v2 don't reappear; only new or unresolved corrections show.
- The Diff viewer shows v2 → v3 in addition to v1 → v2.
- AI surfaces a gentle "this is round 3; let's get it right" message — not "you've failed twice".

### 8.6 Resubmission workflow

Same Submit flow as the initial submission, plus:

- "Addressed" badges next to corrections the contributor ticked
- Updated readiness score reflecting the revision work
- An optional **note to mentor** field — short, plain-text, contributor can add context ("rewrote section 4 per feedback")

The note is contributor-visible to mentor only on the resubmission; it's not a public record.

### 8.7 What the contributor never sees on the revision side

- AI's calibration data
- Mentor's internal notes
- Routing chain if there was an escalation about this item
- Severity rails or red urgency markers
- "Round 3 auto-escalates" copy (this is mentor-side intelligence)

The contributor sees their work and their corrections. The platform handles everything else.

### 8.8 Feedback that arrives during active work

If a mentor leaves feedback while the contributor is mid-task (e.g., a clarification or mid-review note):

- A soft banner appears at the top of the workroom: "Note from {mentor}".
- The work is not interrupted.
- The note lives in the Context Pane until the contributor reads it.
- Acknowledgment is one click; no formal "read receipt" UX.

---

## 9. Enterprise Workforce UX Principles

### 9.1 Principle 1 — Reduce contributor overwhelm

**Test.** On opening any contributor screen, can the operator identify the next action in under 3 seconds?

**How V2 enforces this:**
- Home shows ≤ 3 items above the fold
- Active Tasks shows one card per task with a single primary CTA
- Workroom hides all non-work UI
- Revisions queue surfaces one correction list per task, not a wall of text

### 9.2 Principle 2 — Improve execution confidence

**Test.** When a contributor accepts a task, do they know exactly what acceptance looks like?

**How V2 enforces this:**
- Acceptance criteria visible **before** acceptance
- Skill ladder alignment shown ("you're qualified")
- Past similar accepted work surfaced as reference
- Effort estimate calibrated to historical velocity, not generic

### 9.3 Principle 3 — Improve operational trust

**Test.** Does the platform feel reliable across a 30-day window?

**How V2 enforces this:**
- Same Submit flow every time
- Same review-window estimate every time
- Same feedback structure every time
- Same payout cadence every time
- Same revision UX every time

Reliability is the deepest motivator. The contributor portal optimizes for predictability over novelty.

### 9.4 Principle 4 — Improve productivity continuity

**Test.** Can a contributor close their browser mid-task and resume seamlessly tomorrow on a different device?

**How V2 enforces this:**
- Autosave + state restoration in the workroom
- Multi-device sync via WebSocket
- Task state preserved across rework rounds
- Notification queue doesn't lose events across sessions

### 9.5 Principle 5 — Improve contributor motivation

**Test.** Does the contributor feel like a respected professional or a gig worker?

**How V2 enforces this:**
- Quiet acknowledgments, never confetti
- Earnings predictability over earnings race
- Skill ladder progression over leaderboards
- Feedback as collaboration, not verdict
- AI as helper, not auditor

### 9.6 Anti-patterns explicitly forbidden

- **Red-everywhere dashboards.** No urgency without consent.
- **Gamification noise.** No XP bars, no shouty achievements, no streak-broken sadness.
- **Surveillance copy.** Never "we detected", "AI flagged", "your reliability dropped".
- **Stress-architected layouts.** No multi-column dense tables on contributor-facing pages.
- **Open-ended chat.** AI is feature-scoped; no global chat thread.
- **Forced engagement.** No nags, no streaks-at-risk warnings, no "you haven't logged in in 3 days" emails.

### 9.7 Trust signals to surface continuously

- Estimated review window
- Pool capacity context ("most reviews this week complete in 18h")
- Honest blocked-state attribution
- Honest "we ran over the SLA — your task is still safe"
- Honest payment status ("disbursing on the 15th")

---

## 10. Implementation Direction

### 10.1 Reusable workflow systems

The contributor portal will share the *infrastructure* of the mentor portal's `_shared/workflow/` layer, but each shared primitive needs a **contributor-side variant** with different tone, accent, and behavior.

| Mentor primitive | Contributor variant | What changes |
|---|---|---|
| `OperationalCard` | `WorkroomCard` | Larger padding, softer shadow, larger type scale |
| `WorkflowStateChip` | `ContributorStateChip` | Different state taxonomy, gentler tone words, teal accent |
| `AuditableBadge` | (do not reuse) | Contributor portal doesn't surface auditability; the trust is implicit |
| `ConfidenceGauge` | `SuggestionConfidence` | One-word chip (High/Medium/Low), no percentage |
| `RecommendationBlock` | `AiSuggestionBlock` | Teal accent, gentler copy framing |
| `GovernanceTimeline` | `ProgressTimeline` | Milestones (not audit events), forward-looking, no signed-event glyphs |
| `GovernanceBanner` | `FeedbackBanner` / `MilestoneBanner` | Collaborative tone, no enforcement language |
| `SeverityRail` | `StateRail` | Calmer palette, no red urgency by default |
| `OpsBreadcrumb` | `ContributorBreadcrumb` | Same shape, different home (Today vs Dashboard) |

### 10.2 Scalable contributor architecture

The contributor portal must scale across three dimensions:

| Dimension | Scale challenge | Architecture answer |
|---|---|---|
| **Contributor count** | 10,000 active contributors | All surfaces are contributor-scoped, not pool-scoped. No "leaderboards", no cross-contributor comparison views. |
| **Task volume per contributor** | 100+ tasks per lifetime | Completed Work has filter/group/search. Portfolio is curated, not exhaustive. |
| **AI feature complexity** | Multiple AI features per surface | Feature-scoped invocation (no global chat). Each feature has its own visible boundary. |

### 10.3 Workforce ecosystem thinking

The contributor portal is part of a three-portal ecosystem:

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Enterprise     │      │     Mentor       │      │   Contributor    │
│   (defines work, │ ───► │   (reviews work, │ ───► │   (does the work)│
│    accepts work) │      │    governs work) │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

Each portal shares:
- Identity and credentials
- Task / submission / review records
- Audit and compliance signals

Each portal differs in:
- Tone (formal · operational · encouraging)
- Density (signature · sophisticated · spacious)
- Hierarchy (strategic · severity · momentum)
- AI relationship (orchestrator · colleague · helper)

### 10.4 Contributor vs mentor UX differences (quick reference)

| Axis | Mentor portal | Contributor portal |
|---|---|---|
| **Primary stance** | Governance, audit, enforcement | Delivery, momentum, growth |
| **Primary entry** | Operational Dashboard | Home (Today) |
| **Density** | Sophisticated, table-heavy | Calm, card-forward |
| **Hierarchy** | Severity-first | Momentum-first |
| **AI tone** | Auditable colleague | Supportive collaborator |
| **AI accent** | Forest (governance-green) | Teal (productivity-blue) |
| **AI invocation** | Always-on with badge | Summoned per feature |
| **State indicator** | Severity rail | Soft state chip |
| **Banner** | Hold / blocked / policy | Feedback / milestone |
| **Empty state** | "Select a row to investigate" | "All caught up — here's what's next" |
| **Visual rhythm** | Dense rows, sticky filters, drawers | Spacious sections, inline progress |
| **Decision support** | Audit timeline | Spec coverage + evidence checklist |
| **Voice** | Operational, formal | Encouraging, professional |
| **Severity color** | Red for breach | Calm teal for action needed |
| **Completion feel** | Signed and ledger-anchored | Quietly celebrated |

### 10.5 Reorganization phase plan

| Phase | Scope | Deliverable |
|---|---|---|
| **Phase 0** | Strategy | `CONTRIBUTOR_PORTAL_V2_STRATEGY.md` ✓ |
| **Phase 1** | Operational Architecture | *This document* ✓ |
| **Phase 2** | IA wiring | Sidebar reorganization in `navigation.ts` + placeholder routes for the 18 surfaces |
| **Phase 3** | Home (Today) | Daily productivity hub — what's next, today's commitments, gentle velocity |
| **Phase 4** | Workroom | The cockpit — 3-zone layout, AI assistant inline, evidence drop zone, submit flow |
| **Phase 5** | Revisions | Anchored corrections, three-block feedback, AI fix suggestions, resubmit |
| **Phase 6** | Submission lifecycle | Pre-submit readiness check, post-submit quiet state, approval acknowledgment |
| **Phase 7** | Growth & Earnings | Skill ladder, credentials, portfolio, earnings overview |
| **Phase 8** | Cross-screen consistency | Tokens, vocabulary, visual rhythm canon for the contributor portal |

---

## Appendix · System Tables

### A. Contributor state system (canonical)

| State | Accent | Primary CTA | Notification | AI behavior |
|---|---|---|---|---|
| Assigned | Calm teal | Review task | Soft | Recommend reading brief |
| Accepted | Soft teal | Open workroom | Soft | Suggest similar past work |
| In Progress | Deep teal | Resume | None | Available on demand |
| Blocked | Calm gray | — | Push | Explain blocker |
| Awaiting Clarification | Soft amber | View thread | Push on reply | None during await |
| Ready for Submission | Forest soft | Review and submit | None | Pre-submit summary |
| Under Review | Quiet gray-blue | — | None | None |
| Revision Requested | Friendly amber | See what to fix | Push (priority) | Fix suggestions |
| Approved | Forest | View portfolio entry | Push (happy) | Suggest next 2 tasks |
| Completed | Soft sage | View portfolio entry | None | None |
| Escalated | Calm muted blue | — | Push (gentle) | Plain-language status |

### B. AI feature taxonomy (canonical)

| Moment | Feature | Invocation | Output type |
|---|---|---|---|
| Discover | Match recommendation | Auto (Home) | Ranked task cards |
| Discover | Effort estimate | Auto (pre-accept) | Range estimate |
| Prepare | Brief digest | Click | Paragraph summary |
| Prepare | Past work surfacer | Click | 2–3 anonymized examples |
| Execute | Draft outline | Click | Bullet outline |
| Execute | Evidence suggest | Click | Artifact checklist |
| Execute | Coverage check | Click | Coverage map |
| Submit | Pre-submit check | Click (or auto if < 80%) | Readiness score + gaps |
| Recover | Explain feedback | Auto (with revision) | Plain-language explanation |
| Recover | Fix suggest | Click | Starting-point suggestion |
| Recover | Next steps | Auto (after accept) | 2 suggested tasks |

### C. Contributor vocabulary canon

| Concept | Mentor portal language | Contributor portal language |
|---|---|---|
| The work | "Submission", "Item", "Review" | "Task", "Work", "Submission" |
| The other party | "Contributor" | "Mentor", "Reviewer" |
| The clock | "SLA", "Resolution SLA" | "Deadline", "Review window" |
| AI source | "AI v3.2 · Auditable" | "AI suggestion" |
| Risk surfacing | "Severity", "Policy risk" | (absent — replaced with "readiness", "coverage") |
| State chip | "Escalated", "Governance hold" | "Under review", "Action needed" |
| Action | "Resolve", "Escalate", "Hold" | "Submit", "Resume", "Fix" |
| Mistake | "Override", "Calibration event" | "Revision", "Adjustment" |
| Completion | "Signed", "Audit anchored" | "Accepted", "Done" |
| Stalled-state | "Stalled > 4h" | (never exposed — replaced with "Awaiting Clarification") |
| Block | "Restricted action" | "Paused — we'll reach out" |
| Confidence | "94% high" | "High" |

### D. Productivity metrics surfaced (and not surfaced)

**Surfaced to contributor:**
- Items completed this week
- Items completed last week
- Reliability trend (chart, not number-shouting)
- Acceptance rate (last 10)
- Average rework rounds
- Skill ladder position per skill
- Pending payouts
- YTD earnings
- Streak (only when ≥5)

**Not surfaced to contributor:**
- Pool capacity
- Mentor SLA hit rate
- Reviewer-level calibration
- Cross-contributor leaderboards
- Time-to-review distribution
- AI override rate
- Governance backlog
- Platform-level KPIs

### E. Closing line for the operational architecture

> *"The contributor portal's operational architecture is built on a single conviction: a professional doing real paid work deserves a delivery cockpit, not a control center. Every system — IA, lifecycle, state, workroom, momentum, AI, revision — is the mechanical expression of that conviction."*
