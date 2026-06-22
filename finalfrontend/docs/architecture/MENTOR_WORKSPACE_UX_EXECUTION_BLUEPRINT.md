# Mentor Workspace — UX Execution Blueprint

> **Companion to:** `MENTOR_REVIEW_REDESIGN_STRATEGY.md` (the *why*) and `MENTOR_REVIEW_UX_ARCHITECTURE.md` (the *how, IA-level*).
> **This document:** the *execution* — pixel-aware layouts, state-by-state behavior contracts, interaction specs, ready for a designer or front-end engineer to build against.
>
> **Source ground truth:** `PRODUCT_UNDERSTANDING.md`, `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md`, `ENTERPRISE_UX_AUDIT.md`, the prior two docs, and the existing `src/app/mentor/*` + `src/app/enterprise/reviewer/*` implementation.
>
> **Operating thesis:** *This is the blueprint for building the surface. Every section here is an instruction, not a discussion. Where decisions remain open, they are flagged.*

---

## Table of Contents

1. Mentor Dashboard Execution
2. Review Queue Execution
3. Submission Review Page Execution
4. Rework & Rejection UX
5. Escalation & Governance UX
6. AI Explainability UX Execution
7. State-by-State UX Execution
8. Wireframe-Level Layout Structures
9. Enterprise UX Design System Guidance
10. Product Design Execution Insights

Appendices: A. Layout grid · B. Component contracts · C. Empty / error / loading states · D. Telemetry events · E. Acceptance criteria checklist

---

## 0. Foundational Grid & Layout System

Before any page-level wireframe, fix the grid. Every subsequent layout in this document assumes:

```
Viewport widths supported:           1280, 1440, 1680, 1920 (primary), 2560 (ultra-wide)
Sidebar:                              240 px collapsed-expanded → 64 px collapsed
Content max-width:                    1440 px (centered above 1680)
Gutter:                               24 px
Column system (content area):         12-col, 24 px gutter, fluid
Vertical rhythm:                      8 px base; spacing scale 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64
Z-index scale:                        sticky=10, dropdown=20, drawer=30, modal=40, toast=50, command=60
Border radius:                        sm=4, md=8, lg=12, pill=999
Font scale (px):                      11, 12, 13 (body), 14, 16, 20 (h3), 24 (h2), 32 (h1)
Line-height:                          1.4 body, 1.2 headings, 1.5 long-form
```

**Density mode:** the workspace ships in *compact density* by default (32px row height, 13px body, 8px vertical padding) — enterprise operators do high-volume reading. A "comfortable" toggle is available under Preferences but not the default.

**Token references** in this document use the names from `MENTOR_REVIEW_UX_ARCHITECTURE.md` Appendix B (e.g., `color.sla.warning`, `color.confidence.medium`).

---

## 1. Mentor Dashboard Execution

### 1.1 Page Identity

- **Route:** `/review-hub` (was `/mentor/dashboard` and `/enterprise/reviewer`)
- **Title:** "Today"
- **Role:** the single landing surface for mentor + reviewer modes
- **Job-to-be-done:** answer *"what needs my attention right now?"* in **3 seconds** and *"am I on track?"* in **10 seconds**.

### 1.2 Layout Structure (1440px viewport, mentor mode)

```
┌─ Sidebar 240 ──┬─ Content 1176 (with 24px L/R padding inside 1200 content frame) ──────┐
│                │                                                                       │
│  Review Hub    │ ┌─ TOP STRIP (full width, 56 px) ──────────────────────────────────┐ │
│                │ │ Today, Sat May 23, 2026         Mentor mode 🔁    🔔 9    👤 RV  │ │
│  🏠 Today  *   │ └──────────────────────────────────────────────────────────────────┘ │
│                │                                                                       │
│  📥 Queue (14) │ ┌─ SECTION 1 · NEEDS YOU NOW (full width, 120 px) ──────────────────┐ │
│                │ │ ⚠  3 critical items   ·   1 escalation past SLA   ·   2 round-3  │ │
│  ✅ Decisions  │ │ [ Go to queue ]   [ Resolve escalations ]   [ See round-3s ]    │ │
│                │ └───────────────────────────────────────────────────────────────────┘ │
│  🧭 Mentorship │                                                                       │
│                │ ┌─ SECTION 2 · MY WORK (8-col, 736 px wide) ─┬─ SECTION 3 · MY PACE ┐ │
│  🚨 Esc (5)    │ │                                              │ (4-col, 392 px)     │ │
│                │ │  My queue at a glance                        │                     │ │
│  📬 Inbox (9)  │ │   14 pending · 5 at-risk · 3 reworks         │  Today              │ │
│                │ │                                              │  ▰▰▰▰▰▰░░░░  6/10   │ │
│  📊 Insights   │ │  Next 3 (priority order):                    │  Target 5:30 PM     │ │
│                │ │   1. 🔴 Refactor billing       8h overdue    │                     │ │
│  ⚙️ Me         │ │   2. ⚠  Date picker             2h left      │  Avg decision time  │ │
│                │ │   3. ⚠  Auth modal              3h round 2/3 │  1.8 h              │ │
│                │ │                                              │                     │ │
│                │ │  [ Open queue ]  [ Quick-confirm (3) ]       │  SLA hit            │ │
│                │ └─────────────────────────────────────────────┴─ 94% (week)         │ │
│                │                                                  └─────────────────────┘ │
│                │                                                                       │
│                │ ┌─ SECTION 4 · KPI STRIP (12-col, 1128px, 3 cards 360px each) ─────┐ │
│                │ │ Throughput        Quality          AI partnership                │ │
│                │ │ 18/25 this week   accept 81%       agree 73% · override 27%     │ │
│                │ │ SLA 94%           rework 16%       conf calibration 88%         │ │
│                │ │                   reject  3%                                     │ │
│                │ └───────────────────────────────────────────────────────────────────┘ │
│                │                                                                       │
│                │ ┌─ SECTION 5 · BOTTLENECK SPOTLIGHT [mentor] (12-col) ─────────────┐ │
│                │ │  Top 3 causes this week                                          │ │
│                │ │   1. Spec ambiguity     14 (28%) ▲5                              │ │
│                │ │   2. Reviewer capacity   9 (18%) ▲3                              │ │
│                │ │   3. Contributor evid    7 (14%) ▼2                              │ │
│                │ │  Forecast: capacity exceeded by Tue                              │ │
│                │ │  [ Add reviewer ]  [ Pause ingestion ]  [ See full analysis ]   │ │
│                │ └───────────────────────────────────────────────────────────────────┘ │
│                │                                                                       │
│                │ ┌─ SECTION 6 · POOL HEALTH [mentor] (12-col) ────────────────────┐  │
│                │ │  4 reviewers · 53/60 capacity · pool SLA 91% (▼3%)              │  │
│                │ │  R. Verma   ████████░░  18/25  ●●● online                       │  │
│                │ │  K. Singh   ███████░░░  11/25  ●●● online                       │  │
│                │ │  L. Mehta   ██████████▲ 24/20  ●●○ over capacity                │  │
│                │ │  A. Iyer    ░░░░░░░░░░   0/25  ⚫⚫⚫ PTO until May 25            │  │
│                │ │  [ Rebalance L. Mehta → R. Verma ]                              │  │
│                │ └─────────────────────────────────────────────────────────────────┘  │
│                │                                                                       │
│                │ ┌─ SECTION 7 · MENTORSHIP TODAY (6-col) ─┬─ WATCHLIST (6-col) ────┐  │
│                │ │  3 sessions                              │  4 contributors       │  │
│                │ │   ▸ c4821 · A11y coaching · 4 PM         │   ▸ c5102 ⚠ 2 reject  │  │
│                │ │   ▸ c5102 · Test strategy · 5 PM         │   ▸ c4821             │  │
│                │ │   ▸ c6710 · Onboarding · 6 PM            │   ▸ c6710             │  │
│                │ └─────────────────────────────────────────┴────────────────────────┘  │
│                │                                                                       │
└────────────────┴───────────────────────────────────────────────────────────────────────┘
```

### 1.3 Section-by-Section Layout Explanation

| # | Section | Why this position | Vertical anchor |
|---|---|---|---|
| 1 | **Needs You Now** | Crisis surface. Always first. Hides if zero. | Sticks below top strip; never below the fold on 1080+ screens |
| 2 | **My Work** | Personal queue summary; the operator's primary verb | 8 of 12 columns (the "doing zone") |
| 3 | **My Pace** | Throughput feedback alongside My Work | 4 of 12 columns (the "feedback zone") |
| 4 | **KPI Strip** | Self-monitoring metrics | Three equal cards; no card dominates |
| 5 | **Bottleneck Spotlight** | Mentor's operator view; below personal data | Full width because the recommendation block needs room |
| 6 | **Pool Health** | Mentor's reviewer-pool view | Below bottleneck because bottleneck answers "where do I look first?" |
| 7 | **Mentorship + Watchlist** | Passive monitoring; lowest urgency | Bottom of fold; 50/50 split |

### 1.4 KPI Hierarchy

Three KPI cards in Section 4, each carrying a primary + two secondary metrics:

| Card | Primary | Secondary | Trend |
|---|---|---|---|
| **Throughput** | 18 / 25 (week target) | SLA hit 94% | Δ vs last week |
| **Quality** | Accept rate 81% | Rework 16% · Reject 3% | Δ vs last week |
| **AI Partnership** | Agree rate 73% | Override 27% · Conf calibration 88% | Δ vs last quarter |

**KPI layout primitive (one card):**

```
┌─ KPI card (360 × 120) ────────────────────────────────────────┐
│  THROUGHPUT                                          ▲ 4%      │   ← label (11px) + delta
│                                                                │
│  18 / 25                                                       │   ← primary (32px)
│  this week                                                     │   ← caption (12px)
│                                                                │
│  SLA hit 94%      ●  Pace on track                             │   ← secondary row (13px)
└────────────────────────────────────────────────────────────────┘
```

### 1.5 Operational Priority Hierarchy

The dashboard enforces a strict attention gradient:

```
Tier 1 (red zone)    Needs You Now                — auto-show, never hide
Tier 2 (active)      My Work + My Pace            — always present
Tier 3 (monitor)     KPI Strip                    — always present
Tier 4 (operator)    Bottleneck + Pool [mentor]   — show in mentor mode
Tier 5 (passive)     Mentorship + Watchlist       — show if non-empty
```

A Tier 1 absent-state never reveals empty: if zero crises, Section 1 collapses to a single subtle line *"All clear. 0 critical items."* — present so the operator can confirm at a glance.

### 1.6 Workload Visibility (mentor mode)

```
┌─ Pool workload table (compact, 32px rows) ──────────────────────────────────┐
│  Reviewer        Capacity bar           Active    Today    SLA hit  Status  │
│  ──────────────────────────────────────────────────────────────────────────  │
│  R. Verma        ████████░░░░░░  18/25    1*       6        96%     ●●●     │
│  K. Singh        ███████░░░░░░░  11/25    -        4        94%     ●●●     │
│  L. Mehta        ██████████▲▲    24/20    1        0        72% ⚠   ●●○     │
│  A. Iyer         ░░░░░░░░░░░░░    0/25    -        -        -       ⚫⚫⚫    │
│  ──────────────────────────────────────────────────────────────────────────  │
│  * indicates currently active session                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Interaction:** click a reviewer row → opens a side drawer with their queue, recent decisions, and rebalance affordance.

### 1.7 SLA Visibility on Dashboard

SLA visibility is split across three sections:

| Section | What it shows |
|---|---|
| Section 1 (Needs You Now) | Count of breached + critical items |
| Section 2 (My Work) | The next 3 items with SLA chips |
| Section 4 (KPI strip) | SLA hit % over the week |

The dashboard never shows the *list* of all SLA-at-risk items — that lives in the queue. The dashboard only shows *whether to worry*.

### 1.8 Risk Visibility

Risks surface in three lanes on the dashboard:

```
Crisis risks       → Section 1 (Needs You Now)
Forward risks      → Section 5 (Bottleneck Spotlight, with forecast)
Personal risks     → Section 2 (My Work — anti-rubber-stamp pairs flagged)
```

### 1.9 AI Insight Placement

| AI insight | Where on dashboard |
|---|---|
| AI partnership agreement % | KPI Strip card 3 |
| AI confidence calibration | KPI Strip card 3 |
| AI risks caught | Linked in KPI strip (click to drill) |
| AI low-confidence inbound items | Section 2 (My Work) — listed with conf badge |
| AI bottleneck contribution | Section 5 (rare; only if AI is identified as the cause) |

The dashboard does **not** show AI rationale or per-suggestion data — those live on the review detail page. Dashboard is summary only.

### 1.10 Interaction Hierarchy

```
Click target                          → Outcome
────────────────────────────────────────────────────────────────────────────
Section 1 buttons                     → navigate to queue / escalations / round-3 list
Next-3 item rows                      → open review detail page
"Open queue"                          → Queue list
"Quick-confirm lane (N)"              → Queue filtered to AI-ready items
KPI card click                        → drill to Insights / corresponding view
Bottleneck top row                    → drill to bottleneck analytics
Pool reviewer row                     → side drawer with reviewer detail
"Rebalance" recommendation            → modal with preview
Mentorship row                        → mentorship session detail
Watchlist row                         → contributor profile
🔔 (notification bell)                → Inbox dropdown
👤 (avatar)                            → Me menu (profile, role toggle, sign out)
```

### 1.11 Action Hierarchy

```
TIER A (primary, in Section 1)        Go to queue · Resolve escalations
TIER B (primary, in Section 2)        Open queue · Quick-confirm lane
TIER C (secondary, in Section 5)      Add reviewer · Pause ingestion
TIER D (secondary, in Section 6)      Rebalance
TIER E (utility, top strip)           Notifications · Role toggle · Me menu
```

No tertiary actions on dashboard. Anything that needs Tier 3 lives on a deeper page.

### 1.12 Notification Logic

```
Where notifications appear on dashboard:

  Bell badge (top strip)          → count of unread, all categories
  Inbox dropdown                  → grouped by category
                                     - Mentions
                                     - SLA breaches (yours + pool [mentor])
                                     - Escalation routings
                                     - AI flagged risks
                                     - Contributor questions
                                     - System (capacity, holds)
  Section 1 (Needs You Now)       → mirrored only for crisis-tier
  Push notifications              → Critical + Breached SLA only
  Email digest                    → end-of-shift summary (opt-in)
```

**Notification thresholds** (avoiding fatigue):

| Event | In-app | Push | Email |
|---|---|---|---|
| New item in queue | ✓ (silent counter) | — | — |
| SLA Warning tier | ✓ | — | — |
| SLA Critical tier | ✓ | ✓ | — |
| SLA Breached | ✓ | ✓ | ✓ |
| Escalation routed to me | ✓ | ✓ | — |
| Escalation past SLA | ✓ | ✓ | ✓ |
| AI risk flag | ✓ | — | — |
| Contributor question | ✓ | — | — |
| Pool capacity breach [mentor] | ✓ | ✓ | — |

---

## 2. Review Queue Execution

### 2.1 Page Identity

- **Route:** `/review-hub/queue?segment=...&group=...`
- **Title:** "My queue" / "Team queue" / "Watch list"
- **Job-to-be-done:** triage and decide; scan in <2 sec; pick in <5 sec.

### 2.2 Page Layout (1440px)

```
┌─ TOP STRIP (full width, 56px) ─────────────────────────────────────────────────┐
│  Today, Sat May 23, 2026          Mentor mode 🔁     🔔 9    👤 RV               │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ QUEUE HEADER (full width, 88px, sticky) ──────────────────────────────────────┐
│  MY QUEUE (14)                                            [ Refresh ] [ ⚙ ]     │
│  Avg age 8h · At-risk 5 · Decided today 6 · Pace ▰▰▰▰▰▰░░░░ 60%                  │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ SEGMENT CHIPS (full width, 48px, sticky) ─────────────────────────────────────┐
│  [ 🔴 Breached 2 ] [ ⚠ Critical 5 ] [ ▲ Warning 8 ] [ ● Normal 14 ]              │
│  [ Mine 14 ] [ Team 37 ] [ My pool 51 ]                       ⌨ / to focus      │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ FILTER ROW (full width, 48px, sticky on scroll) ──────────────────────────────┐
│  [Skill▾] [Project▾] [Enterprise▾] [Type▾] [AI conf▾] [Round▾] [⚙ More]         │
│  Group: ( Flat ) Project Contributor Skill          Sort: SLA urgency ▾         │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ QUEUE TABLE (full width, rows 88px) ──────────────────────────────────────────┐
│   ▢   SLA       Task / Project           Contributor   Type    AI    Why first? │
│   ☐   🔴 -8h    Refactor billing svc      c1142          v2-R   78%   SLA+P0+r2  │
│       Node, Stripe · Acme · P0           Reliab 71      round 2  med            │
│       ─────────────────────────────────────────────────────────────────────── │
│   ☐   ⚠ 2h     Build a11y date picker     c4821          v2-R   94%   AI ready  │
│       React, A11y · Acme · P0            Reliab 87      round 2  high  [Q]     │
│       ─────────────────────────────────────────────────────────────────────── │
│   ☐   ▲ 6h     Refactor analytics svc     c2390          v1     71%             │
│       Python, ETL · BetaCo · P1          Reliab 92               med            │
│       ─────────────────────────────────────────────────────────────────────── │
│   ...                                                                          │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ FOOTER (full width, 40px) ────────────────────────────────────────────────────┐
│  Showing 14 of 14    ⌨ / focus · J/K nav · Enter open · A claim · ? help        │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Queue Table — Column Hierarchy

Eight columns, ordered by scan priority:

| Position | Column | Width | Content | Why this priority |
|---|---|---|---|---|
| 1 | Checkbox | 32 px | multi-select | Power users select-then-act |
| 2 | SLA chip | 96 px | tier + countdown | Highest scan value |
| 3 | Task title + project | flex (350 px+) | bold title, project line | Identity of the work |
| 4 | Contributor + reliability | 140 px | pseudonym + score | Context for decision speed |
| 5 | Type + round | 96 px | Initial / Rework v2 | Surface anti-rubber-stamp signals |
| 6 | AI confidence + ready chip | 96 px | conf badge | Quick-confirm eligibility |
| 7 | Why first? | 180 px | composite-score breakdown | Transparency on ranking |
| 8 | Row actions | 56 px | "..." menu | Snooze, release, escalate |

**Row hover state:** subtle background fill (`color.surface.hover`); cursor:pointer on title; secondary actions reveal in column 8.

### 2.4 Row Anatomy (in detail)

```
┌─ Row (88px height, compact density) ────────────────────────────────────────────┐
│ ☐  ┌─ SLA Chip ─┐   ┌─ Title block (flex) ────────────┐  ┌─ Contributor ┐ ...   │
│    │ 🔴 -8h     │   │ Refactor billing service          │  │ c1142          │   │
│    │ OVERDUE    │   │ Node · Stripe · Acme · P0         │  │ Reliab 71      │   │
│    └────────────┘   └───────────────────────────────────┘  └────────────────┘   │
│                                                                                  │
│   Sub-line:  v2 · round 2/3 · last reviewer: you · ⚠ auto-escalate in 1h         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Strict typography rules per row:**
- Title: 14px, weight 600
- Project/skill line: 12px, weight 400, `color.text.muted`
- SLA chip: 11px uppercase
- Sub-line: 12px, weight 400, `color.text.muted`
- Sub-line risks (auto-escalate): `color.sla.critical`, weight 500

### 2.5 Urgency Indicators

The five-tier SLA system (canonical):

```
Healthy    "8h"           forest dot · 11px chip   · subtle
Watch      "6h ●"         teal dot                 · subtle
Warning    "▲ 3h"         amber triangle           · medium
Critical   "⚠ 1h"         crimson alert            · bold
Breached   "🔴 -8h OVERDUE"  crimson flash         · bold + animated
```

**Animation policy:** only **Breached** rows pulse (1.5s ease loop, opacity 0.6 ↔ 1.0). Critical does not animate — animation budget reserved for the worst tier.

### 2.6 Risk Indicators (badges next to title)

Right of title, badges (max 3 visible, "+N" overflow):

```
[Q]      open question thread from contributor
[🛡]     plagiarism flag
[👁]     anomaly pairing (you reviewed last 4/5 of this contributor)
[⏱]     timing anomaly (suspicious submission cadence)
[🔥]     contributor flagged "needs check-in"
```

Hover any badge → 200ms tooltip with the specific reason.

### 2.7 Filters Execution

**Filter chip behavior:**

| Filter | Component | Multi-select? | URL key |
|---|---|---|---|
| Segment (SLA tier) | chip row | yes | `tier` |
| Mine / Team / Pool | chip row | no (radio) | `scope` |
| Skill | dropdown | yes | `skill[]` |
| Project | dropdown | yes | `project[]` |
| Enterprise | dropdown | yes | `enterprise[]` |
| Review type | dropdown | yes | `type[]` |
| AI confidence | dropdown | yes | `conf[]` |
| Round | dropdown | no (range) | `round` |
| Continuity | toggle | n/a | `continuity` |
| Anomaly | toggle | n/a | `anomaly` |
| Contributor | autocomplete | yes | `contrib[]` |
| Date range | date picker | n/a | `from`, `to` |
| Saved view | dropdown | n/a | `view` |

**Persistence:**
- All filter state lives in the URL.
- "Saved view" stores the URL params under a named slug per user.
- Saved views can be shared (URL is portable).

**Clearing filters:** "Reset" link appears next to filter row when any filter is non-default.

### 2.8 Grouping Execution

```
Group toggle:   [ Flat | Project | Contributor | Skill ]

Flat grouping:           single list, sorted
Project grouping:        collapsible group headers, project KPI row per group
Contributor grouping:    collapsible group headers, reliability + recent decisions
Skill grouping:          collapsible group headers, rubric template suggestion
```

**Group header layout:**

```
┌─ Group header (40px) ──────────────────────────────────────────────────────────┐
│ ▾  Project: Acme-Helios       8 items   ·   SLA at-risk 3   ·   P0 strategic   │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 2.9 Sorting Execution

Default sort: composite priority (the formula from `MENTOR_REVIEW_UX_ARCHITECTURE.md § 2.1`).

Alternative sorts available in dropdown:

```
Sort options
  ● SLA urgency           (default)
  ○ Composite priority    (most informative)
  ○ Submission age
  ○ Round (rework-deep first)
  ○ AI confidence (low first — reviewer attention prioritized)
  ○ Contributor reliability (low first — fairness)
  ○ Recency (just-arrived first)
```

### 2.10 Bulk Actions

**Allowed** bulk actions (multi-select via checkbox):

```
Bulk action bar (appears when ≥1 selected, replaces filter row temporarily)

┌─ 3 selected ────────────────────────────────────────────────────────────────┐
│   [ Claim ]   [ Snooze ]   [ Release ]   [ Watch ]   [ Cancel selection ]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Forbidden** bulk actions: Accept, Reject, Rework. Each decision must be individual (governance constraint).

**Bulk snooze modal:**

```
Snooze 3 items
  Reason (required):
    ( ) Waiting on contributor reply
    ( ) Waiting on spec clarification
    ( ) Dependency on prior milestone
    ( ) Out of office
    ( ) Other (free text)
  Auto-unsnooze date: [ default = +48h ]
  [ Cancel ]    [ Snooze ]
```

### 2.11 Contributor Quick Insights

When the reviewer hovers a contributor cell for >400ms, a peek card appears:

```
┌─ Peek (320×220, anchored to cell) ──────────┐
│  c4821 · joined 7 mo                         │
│  Verified: React L3 · A11y L2 · Tailwind L2  │
│  Reliability 87/100 (▲4 q)                   │
│                                              │
│  Last 5 decisions                            │
│   ✓ ✓ ↺ ✓ ✗                                  │
│   (most recent ← oldest)                     │
│                                              │
│  Anomaly: none                               │
│  Watch: no                                   │
│                                              │
│  [ See profile ]                             │
└──────────────────────────────────────────────┘
```

This is the antidote to opening a profile page just to recall context.

### 2.12 Scanning Optimization

| Lever | Implementation |
|---|---|
| **Left-anchor highest-value column** | SLA chip is column 2 (after checkbox) |
| **Color outranks position** | Crimson rows always read first regardless of sort |
| **One bold, one muted** per row | Title 600, sub-line 400 — eye finds title first |
| **Whitespace cadence** | 8px between sub-line and next row; 24px between groups |
| **Vertical scan column** | "Why first?" column lets the eye scan downward to compare ranking reasons |
| **No icon overload** | Max 3 inline risk badges per row; "+N" beyond that |
| **No alternating row backgrounds** | Eye anchors lost; instead, use 1px divider |

### 2.13 Review Fatigue Reduction

| Lever | Implementation |
|---|---|
| **Pace gauge in header** | "6/10, on track" — visual without shaming |
| **Quick-confirm lane chip** | Top-right of header: "[ Quick-confirm (3) ]" |
| **Varietal routing hint** | "You've reviewed 4 React in a row — next: switch to Python?" suggested after every 5 |
| **Pomodoro nudge** | After 12 consecutive decisions in <2h, soft modal "Take a 10-min break?" |
| **End-of-shift soft cap** | Last 2h of declared availability: warn before claim |
| **Save-and-come-back** | Drafts autosave; reviewer can step away mid-rubric without loss |
| **Snooze with reason** | Defer items legitimately without losing them |

### 2.14 Operational Prioritization

When the reviewer hits `Enter` on the top item, the system *commits to that order*. The next-item action (after decision) returns to the *re-computed* top.

```
Decision flow continuity:
  Enter on item #1  →  Decide  →  Confirm  →  Auto-advance to new #1
                                                (could be old #2, or could be
                                                 a newly-arrived breached item)
  [Esc] anywhere    →  Return to queue list, position preserved
```

---

## 3. Submission Review Page Execution

### 3.1 Page Identity

- **Route:** `/review-hub/queue/[reviewId]`
- **Title:** "{Task title} · v{N} · {Review type}"
- **Job-to-be-done:** make a defensible decision in 8–15 minutes (full) or 90 seconds (quick-confirm).

### 3.2 Page Layout (1440px, 3-pane workspace)

```
┌─ TOP STRIP (full width, 56px) ────────────────────────────────────────────────────┐
│  ← Queue          Build accessible date picker · v2 · Rework round 2/3            │
│  ⚠ 2h SLA · 🤖 94% high · c4821 · Acme · P0          [Release][Escalate][More▾]   │
└───────────────────────────────────────────────────────────────────────────────────┘

┌─ ROUND-2 BANNER (full width, 64px, appears for round > 1) ───────────────────────┐
│  Rework round 2 of 3 · Round 3 will auto-escalate to mentor                       │
│  Previous reviewer: you · 4/5 of c4821's recent reviews were yours                │
│  [ See v1 vs v2 diff ]   [ Release to fresh reviewer ]                            │
└───────────────────────────────────────────────────────────────────────────────────┘

┌─ THREE-PANE WORKSPACE (full width, fills remaining vertical) ─────────────────────┐
│ ┌─ PANE A · SUBMISSION (50%, 700px wide) ─┐ ┌─ PANE B · DECISION (30%, 420px) ─┐ │
│ │                                          │ │                                  │ │
│ │  TABS: Overview · Artifacts · Q&A ·      │ │  Rubric · Feedback · Decide      │ │
│ │        Evidence · Compare · History      │ │                                  │ │
│ │  ─────────────────────────────           │ │  RUBRIC                          │ │
│ │                                          │ │  ▸ Criterion 1: Code Quality     │ │
│ │  Task description                        │ │    ★★★★☆  AI: ★★★★☆ ✓           │ │
│ │  Build an accessible date picker         │ │  ▸ Criterion 2: Completeness     │ │
│ │  React, TypeScript, A11y                 │ │    ★★★★★  AI: ★★★★★ ✓           │ │
│ │                                          │ │  ▸ Criterion 3: Requirements     │ │
│ │  Artifacts (3)                           │ │    ☆☆☆☆☆  AI: ★★★☆☆ (71%)        │ │
│ │  ┌──────────────────────────┐            │ │    [Accept (3)][Edit][Reject]    │ │
│ │  │ artifact.zip · 2.4 MB     │            │ │  ▸ Criterion 4: Testing          │ │
│ │  │ SHA: 7a9c…b2d1 ✓          │            │ │    ★★★★☆  AI: ★★★★☆ ✓           │ │
│ │  │ Plagiarism: 94% original  │            │ │  ▸ Criterion 5: Accessibility    │ │
│ │  │ [Preview] [Download]      │            │ │    ★★☆☆☆  AI: ★★★☆☆              │ │
│ │  └──────────────────────────┘            │ │                                  │ │
│ │  ┌──────────────────────────┐            │ │  FEEDBACK (contributor-visible)  │ │
│ │  │ spec.pdf · 480 KB · ✓     │            │ │  Templates: [Missing req▾]       │ │
│ │  └──────────────────────────┘            │ │  ┌────────────────────────────┐ │ │
│ │  ┌──────────────────────────┐            │ │  │                            │ │ │
│ │  │ notes.pdf · 120 KB · ✓    │            │ │  └────────────────────────────┘ │ │
│ │  └──────────────────────────┘            │ │                                  │ │
│ │                                          │ │  INTERNAL NOTE                   │ │
│ │  External links                          │ │  ┌────────────────────────────┐ │ │
│ │  ▸ Storybook   ▸ GitHub PR               │ │  │                            │ │ │
│ │                                          │ │  └────────────────────────────┘ │ │
│ │  Structured responses                    │ │                                  │ │
│ │   Q1: How did you approach a11y?         │ │  YOUR CONFIDENCE                 │ │
│ │   A:  Used react-aria + focus-trap...    │ │  ● High  ○ Med  ○ Low            │ │
│ │   Q2: Server-side mode?                  │ │                                  │ │
│ │   A:  Implemented via SSR shim...        │ │  ─────────────────────────────  │ │
│ │   Q3: Testing strategy?                  │ │                                  │ │
│ │   A:  vitest + axe-core + storybook...   │ │  ┌──────────────────────────┐   │ │
│ │                                          │ │  │ ✓ Accept                 │   │ │
│ │  Evidence checklist (7/8)                │ │  └──────────────────────────┘   │ │
│ │   ✓ Unit tests · ✓ Stories · ✓ Spec ack  │ │  ┌──────────────────────────┐   │ │
│ │   ✓ Visual QA  · ✓ A11y test · ✗ Demo    │ │  │ ↺ Request Rework         │   │ │
│ │   ✓ Doc · ✓ Self-review                  │ │  └──────────────────────────┘   │ │
│ │                                          │ │  [ More ▾ ]                      │ │
│ └──────────────────────────────────────────┘ └──────────────────────────────────┘ │
│ ┌─ PANE C · CONTEXT (20%, 280px) ─────────────────────────────────────────────┐  │
│ │ CONTRIBUTOR                                                                  │  │
│ │  c4821 · L3 React · Reliab 87                                                │  │
│ │  Last 5: ✓ ✓ ↺ ✓ ✗   (most recent ← oldest)                                 │  │
│ │  Watch: yes (a11y coaching active)                                           │  │
│ │  [ See profile ]                                                             │  │
│ │                                                                              │  │
│ │ AI EVIDENCE SUMMARY                                                          │  │
│ │  🤖 94% high · v3.2                                                          │  │
│ │  ✓ Code quality 95%                                                          │  │
│ │  ✓ Completeness 88%                                                          │  │
│ │  ◐ Requirements 71% · gap                                                   │  │
│ │  ✓ Testing 88%                                                               │  │
│ │  ◐ Accessibility 54% · gap                                                  │  │
│ │  🚩 Plagiarism: 3 funcs                                                       │  │
│ │  [ Full rationale ]                                                          │  │
│ │                                                                              │  │
│ │ COMPLIANCE GATES                                                             │  │
│ │  ✓ SOW chain complete                                                        │  │
│ │  ✓ Terms accepted                                                            │  │
│ │  ⚠ Data sensitivity: Medium                                                  │  │
│ │  ✓ GDPR · India PDPB                                                         │  │
│ │                                                                              │  │
│ │ AUDIT [ expand ]                                                             │  │
│ │  4 events · last @14:08                                                      │  │
│ └──────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Pane A — Submission (the "what")

**Tabs (sub-navigation inside Pane A):**

```
Overview   default landing tab
Artifacts  file-by-file viewer with integrity cards
Q&A        contributor's structured responses
Evidence   the checklist
Compare    v1 vs v2 diff (only if round > 1)
History    full version timeline, prior reviewers, prior feedback
```

**Tab behavior:** keyboard `[`, `]` to cycle; `1..6` to jump.

### 3.4 Pane B — Decision (the "what you do")

**Sections, in vertical order:**

1. Rubric (5 criteria, each with AI proposal)
2. Feedback (contributor-visible)
3. Internal note
4. Reviewer confidence declaration
5. Decision toolbar (Accept, Rework, More)

**Sticky behavior:** decision toolbar sticks to bottom of Pane B when scrolling so the action is always reachable.

### 3.5 Pane C — Context (the "who and how")

**Sections, in vertical order:**

1. Contributor (identity + recent decisions strip)
2. AI evidence summary (compact, expand to full report)
3. Compliance gates (compact)
4. Audit (collapsed by default; expand drawer)

### 3.6 Evidence Panel (Pane A · Artifacts tab)

Per-artifact card layout:

```
┌─ Artifact card (full pane A width, 144px) ──────────────────────────────────┐
│ ┌─ Thumb 96×96 ┐  artifact.zip                                               │
│ │              │  2.4 MB · uploaded May 22 18:04                             │
│ │   📦         │  ─────────────────────────────                               │
│ │              │  SHA-256: 7a9c…b2d1  ✓  matches submission record           │
│ └──────────────┘  Virus scan: clean                                          │
│                  Plagiarism: 94% original [3 funcs overlap public-repo X]   │
│                                                                              │
│                  [ Preview inline ]  [ Download (signed) ]  [ Reports ]      │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Inline preview:** clicking "Preview inline" opens a drawer over Pane A with the artifact (PDF viewer for PDFs, code viewer for source, image viewer for images). The drawer dismisses on Esc or click-outside.

### 3.7 Rubric Panel (Pane B · Rubric section)

Per-criterion expandable card. **Collapsed state:**

```
┌─ Criterion (collapsed) ──────────────────────────────────────────────────────┐
│ ▸  Criterion 3 of 5 · Requirements Adherence                                  │
│    Your score: ☆☆☆☆☆       AI: ★★★☆☆ (71%)        [ Score now ]               │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Expanded state:**

```
┌─ Criterion (expanded) ───────────────────────────────────────────────────────┐
│ ▾  Criterion 3 of 5 · Requirements Adherence            Weight: 25%           │
│                                                                              │
│    YOUR SCORE                                                                │
│    ★ ★ ★ ★ ★                                                                 │
│    1   2   3   4   5                                                         │
│    Below          Meets          Exceeds                                     │
│                                                                              │
│    🤖 AI SUGGESTS  ★★★☆☆ (3/5) · 71% medium                                  │
│    "Covers 4 of 6 stated requirements. Missing: keyboard nav, SR labels"    │
│    Source: spec §4.2, requirement matrix lines 12–17                         │
│    Examined: Storybook stories, component code                               │
│    Not reviewed: live demo, video walkthrough  ⚠ needs human                 │
│                                                                              │
│    [ Accept suggestion (3) ]   [ Edit ]   [ Reject suggestion ]              │
│                                                                              │
│    YOUR REASONING (contributor-visible)                                      │
│    Templates: [ Missing req ▾ ] [ Quality concern ▾ ] [ Nit ▾ ]              │
│    ┌──────────────────────────────────────────────────────────┐             │
│    │                                                            │             │
│    └──────────────────────────────────────────────────────────┘             │
│                                                                              │
│    INTERNAL NOTE                                                             │
│    ┌──────────────────────────────────────────────────────────┐             │
│    │                                                            │             │
│    └──────────────────────────────────────────────────────────┘             │
│                                                                              │
│    SEVERITY IF REWORK   ( ) Blocker  ( ) Major  ( ) Nit                      │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Click star to set score; click number 1–5 keyboard to set without mouse.
- AI suggestion section background is `color.surface.ai` (a subtle 2% tint, distinct from reviewer input).
- Templates dropdown injects starter text into the reasoning field at cursor position.
- Severity field appears only if score < 4.

### 3.8 Contributor Context Panel (Pane C)

```
┌─ Contributor (280×220) ────────────────────────────────────┐
│  c4821 · joined 7 mo ago                                    │
│                                                             │
│  Verified skills                                            │
│   React L3 · A11y L2 · Tailwind L2                         │
│                                                             │
│  Reliability       87/100  (▲4 q)                           │
│  Acceptance        80%   (last 5)                           │
│  Avg rework rounds 1.4                                      │
│                                                             │
│  Last 5 decisions                                           │
│   ✓ ✓ ↺ ✓ ✗   (most recent ← oldest)                       │
│                                                             │
│  Anomaly        none                                        │
│  Mentor watch   yes — a11y coaching                         │
│                                                             │
│  [ See profile ]                                            │
└─────────────────────────────────────────────────────────────┘
```

### 3.9 AI Review Assistant Panel (Pane C)

```
┌─ AI evidence summary (compact, 280×320) ──────────────────┐
│  🤖 v3.2 · 94% high · 2026-05-23 14:08                     │
│                                                            │
│  Covered                                                   │
│   ✓ Code quality          95%                              │
│   ✓ Completeness          88%                              │
│   ◐ Requirements          71%  · gap                      │
│   ✓ Testing               88%                              │
│   ◐ Accessibility         54%  · gap                      │
│                                                            │
│  Coverage gaps                                             │
│   Live demo not run · video walkthrough not analyzed      │
│   → needs human review                                     │
│                                                            │
│  Risk flags                                                │
│   🚩 Plagiarism: 3 funcs overlap public-repo X            │
│   ⏱ Timing: v2 4 min after v1 feedback (possible auto)    │
│                                                            │
│  ⏱ Saved you ~28 min of evidence inspection                │
│                                                            │
│  [ Full rationale ]   [ Override log ]                     │
└────────────────────────────────────────────────────────────┘
```

### 3.10 Approval Controls (Pane B bottom)

```
┌─ Decision toolbar (sticky, 96px) ───────────────────────────┐
│                                                              │
│  YOUR CONFIDENCE                                             │
│  ● High   ○ Medium   ○ Low                                   │
│                                                              │
│  ┌──────────────────────────┐                                │
│  │  ✓  Accept                │  ← primary, forest, 44px      │
│  └──────────────────────────┘                                │
│  ┌──────────────────────────┐                                │
│  │  ↺  Request Rework        │  ← secondary, amber outline   │
│  └──────────────────────────┘                                │
│  [ More ▾ ]   reject · escalate · release · save draft       │
└──────────────────────────────────────────────────────────────┘
```

**Pre-conditions for Accept to be enabled:**

- All 5 rubric criteria scored (or AI proposals accepted)
- Feedback field ≥ 20 chars (or template-populated)
- Reviewer confidence declared
- No active risk flag requiring full review

**If conditions unmet:** button disabled with tooltip listing missing conditions.

### 3.11 Evidence Comparison UX (Pane A · Compare tab)

Tab visible only when `round > 1`. Layout inside the tab:

```
┌─ Compare v1 vs v2 ──────────────────────────────────────────────────────────┐
│  Compare:  ( v1 ↔ v2 )   v1 ↔ current draft (if drafted v3 exists)           │
│  Mode:     ( Unified )   Split   Word-level                                  │
│                                                                              │
│  artifact.zip                                                                │
│  ─────────────                                                               │
│  src/components/Login.tsx                                                    │
│   + 32 lines, − 6 lines                                                      │
│                                                                              │
│   124 │  function Login() {                                                  │
│   125 │    const [open, setOpen] = useState(false)                           │
│   126 │+   const focusRef = useRef<HTMLButtonElement>(null)                  │
│   127 │+   useEffect(() => focusRef.current?.focus(), [open])                │
│   128 │    return (                                                          │
│   129 │      <Dialog                                                         │
│   130 │+       aria-label="Sign in"                                          │
│   131 │+       initialFocus={focusRef}                                       │
│   132 │      >                                                               │
│                                                                              │
│  ───────────────────────────────────────                                     │
│  Prior reviewer feedback on criterion 5 (Accessibility):                     │
│  "Missing focus trap and aria-label on date picker"                          │
│  Status: ✓ Addressed in v2                                                   │
│                                                                              │
│  AI re-analysis: criterion 5 score updated 3 → 5 (high confidence)           │
│  "Focus trap implemented; aria-label added"                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.12 Version Tracking UX (Pane A · History tab)

```
┌─ Version timeline ──────────────────────────────────────────────────────────┐
│                                                                              │
│  v3 (draft)         in progress · contributor working                         │
│                                                                              │
│  v2 ←── you are here, currently reviewing                                    │
│   submitted        2026-05-22 18:04                                           │
│   reviewer         R. Verma (continuity flag)                                │
│   status           in review                                                  │
│   prior round      rework on v1                                              │
│                                                                              │
│  v1                                                                          │
│   submitted        2026-05-12 11:00                                          │
│   reviewer         R. Verma                                                  │
│   decision         Rework requested  (May 13)                                │
│     ↳ Criterion 5 (A11y): 2/5 · blocker · "missing keyboard nav"            │
│     ↳ Criterion 4 (Testing): 3/5 · major · "low coverage"                   │
│     ↳ What worked: "good component composition"                              │
│   rework deadline  May 25                                                    │
│                                                                              │
│  Audit chain (4 events)  [ expand ]                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.13 Audit Visibility on the Page

The inline audit lives in Pane C, collapsed:

```
┌─ Audit (collapsed) ─────────┐
│  4 events · last @14:08      │
│  [ expand ]                  │
└──────────────────────────────┘
```

**Expanded:**

```
┌─ Audit (expanded, opens as right drawer over Pane C) ───────────────────────┐
│  Decision audit · review item r-4821                                         │
│  ─────────────                                                               │
│  May 23 14:08  AI Review Assistant v3.2 generated rubric proposal            │
│                Conf 71% medium · 4/5 criteria pre-filled                     │
│  May 23 14:21  R. Verma claimed item (presence lock)                         │
│  May 23 14:23  R. Verma overrode criterion 3 (AI:3 → R:5, +2)                │
│  May 23 14:24  R. Verma added 2 feedback items                               │
│  May 23 14:25  R. Verma confirmed Rework (round 2)                           │
│  ─────────────                                                               │
│  [ Export audit JSON ]   [ Verify signature ]   [ See ledger entry ]         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.14 Decision Confidence UX

The reviewer confidence declaration is **gating**, not optional:

```
YOUR CONFIDENCE   ● High   ○ Med   ○ Low

   Why it matters: at Medium/Low, downstream consumers (enterprise final
   acceptance, dispute review) see your uncertainty marker. This is a feature.
```

**Behavior of confidence on confirmation:**

| Combination | Behavior |
|---|---|
| High + Accept | One-step confirm |
| Medium + Accept | One-step confirm; mark deliverable as "reviewer flagged uncertainty" |
| Low + Accept | Two-step confirm: "Consider escalation instead?" + force re-confirm |
| High + Reject | One-step confirm |
| Low + Reject | Two-step confirm: "Low confidence on reject is unusual — escalate?" |
| any + Rework | One-step confirm |

---

## 4. Rework & Rejection UX

### 4.1 Rework Composer — Full Layout

Trigger: click **Request Rework** in Pane B decision toolbar. Opens modal (640px wide, content-tall).

```
┌─ Modal · Request Rework ────────────────────────────────────────────────────────┐
│  Request rework · v2 → v3                                                        │
│  Round 2 of 3  ⚠ Round 3 will auto-escalate                            [ ✕ ]    │
│  ─────────────────────────────                                                   │
│                                                                                  │
│  ANCHORED REWORK ITEMS                                                           │
│  Auto-populated from rubric criteria below 4. Each item is contributor-visible. │
│                                                                                  │
│  ┌─ Item 1 · Criterion 5: Accessibility (your score 2/5) ──────────────────┐   │
│  │  Severity:  ● Blocker   ○ Major   ○ Nit                                  │   │
│  │                                                                            │   │
│  │  What needs to change (contributor sees this):                            │   │
│  │  Templates: [ Missing req ▾ ] [ Suggested fix ▾ ]                         │   │
│  │  ┌──────────────────────────────────────────────────────────┐            │   │
│  │  │                                                            │            │   │
│  │  └──────────────────────────────────────────────────────────┘            │   │
│  │                                                                            │   │
│  │  Internal note (only you see):                                            │   │
│  │  ┌──────────────────────────────────────────────────────────┐            │   │
│  │  │                                                            │            │   │
│  │  └──────────────────────────────────────────────────────────┘            │   │
│  │  [ Remove this item ]                                                     │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─ Item 2 · Criterion 4: Testing (your score 3/5) ────────────────────────┐   │
│  │  Severity:  ○ Blocker   ● Major   ○ Nit                                  │   │
│  │  ...                                                                       │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  [ + Add criterion ]                                                             │
│                                                                                  │
│  ─────────────────                                                               │
│  WHAT WORKED (required · contributor sees this)                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │                                                                        │      │
│  └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│  REWORK DEADLINE                                                                 │
│  [ 2026-05-26 ]  (auto-suggested 3 days; adjustable)                             │
│                                                                                  │
│  ROUTING ON RESUBMIT                                                             │
│   ( ) Same reviewer (continuity)                                                 │
│   (●) Fresh reviewer (anti-rubber-stamp) — default after round 1                 │
│                                                                                  │
│  YOUR CONFIDENCE   ● High   ○ Med   ○ Low                                        │
│                                                                                  │
│  Downstream impact                                                               │
│   ↺ Contributor workroom reopens with criterion-anchored items                  │
│   ↺ Submission version increments to v3                                          │
│   ↺ SLA timer resets                                                              │
│   ⚠ Round 3 (if needed) auto-escalates to mentor                                 │
│                                                                                  │
│  [ Cancel ]    [ Save draft ]    [ Confirm Rework ]                              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Structured Feedback UX

**Templates** for the "what needs to change" field, scoped by criterion:

| Criterion | Sample templates |
|---|---|
| Code Quality | "Refactor for readability: …" / "Inconsistent naming: …" / "Performance concern: …" |
| Completeness | "Missing requirement: …" / "Out of scope: …" / "Partial implementation: …" |
| Requirements | "Spec §… not addressed" / "Acceptance criterion N failing: …" |
| Testing | "Test coverage below threshold: …" / "Missing edge-case test: …" |
| Accessibility | "WCAG criterion N failing: …" / "Keyboard nav broken: …" / "ARIA missing: …" |

Templates are populated based on the criterion the rework item is anchored to — the reviewer never sees irrelevant templates.

### 4.3 Rework Tracking (contributor side; reviewer references)

The reviewer can preview what the contributor sees:

```
┌─ Contributor preview (right-drawer) ─────────────────────────────────────────┐
│  This is what c4821 will see:                                                 │
│  ─────────────                                                               │
│                                                                              │
│  Your submission needs revision · Round 2 of 3                               │
│                                                                              │
│  What worked                                                                 │
│  ▸ Strong component composition                                              │
│  ▸ Clean test structure                                                      │
│                                                                              │
│  What needs to change (2 blockers, 1 major)                                  │
│  ▸ Accessibility (BLOCKER)                                                   │
│     Missing keyboard navigation; date picker has no aria-label.              │
│     Suggested: implement focus trap; add aria-label following WCAG 2.1 SR.   │
│  ▸ Testing (MAJOR)                                                           │
│     Test coverage 62%, threshold 80%.                                        │
│     Suggested: add unit tests for edge cases in DatePicker.calculate()       │
│                                                                              │
│  Resubmit by: 2026-05-26                                                     │
│  Round 3 will be escalated to a mentor.                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Rejection Composer — Full Layout

Trigger: **More ▾ → Reject**. Opens modal (640px wide).

```
┌─ Modal · Reject submission ─────────────────────────────────────────────────────┐
│  Reject submission                                                       [ ✕ ]   │
│  ⚠ Rejection is irreversible without dispute                                     │
│  ─────────────────                                                               │
│                                                                                  │
│  REJECTION REASON (required)                                                     │
│   ( ) Scope failure — submission doesn't address the task                        │
│   ( ) Quality failure — execution below acceptable threshold                     │
│   ( ) Evidence failure — required artifacts missing or unverifiable              │
│   ( ) Conduct failure — plagiarism, fraud, policy violation                      │
│                                                                                  │
│  DOWNSTREAM ROUTE                                                                │
│   ( ) Reassign — task returns to pool                                            │
│   ( ) Terminate task — no reassignment                                           │
│                                                                                  │
│  WHAT WORKED (required · contributor sees this)                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │  Even rejection requires identifying what went right.                  │      │
│  └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│  REASONING (required · contributor sees this · ≥ 50 chars)                       │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │                                                                        │      │
│  └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│  INTERNAL NOTE                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │                                                                        │      │
│  └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│  YOUR CONFIDENCE   ○ High   ○ Med   ○ Low                                        │
│                                                                                  │
│  Downstream impact                                                               │
│   ✗ No payout for this submission                                                │
│   ✗ Reputation: contributor Δ −3, you Δ +1                                       │
│   ⚠ Contributor may dispute → routes to mentor for review                        │
│   This decision will be signed and audited                                       │
│                                                                                  │
│  [ Cancel ]              [ Confirm Reject ]                                      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Special case — Low confidence on Reject:**

After "Confirm Reject" click, a secondary confirmation appears:

```
┌─ Confirm reject at low confidence ──────────────────────┐
│  You declared LOW confidence on a reject.                │
│  This is unusual — consider escalation instead.          │
│                                                          │
│  Options:                                                │
│   [ Cancel ]                                             │
│   [ Escalate instead ]                                   │
│   [ Reject anyway ]                                      │
└──────────────────────────────────────────────────────────┘
```

### 4.5 Contributor Clarification UX (the QA-inbox path)

If the reviewer is uncertain about scope or interpretation, they can ask the contributor *before* deciding:

```
┌─ Ask contributor for clarification (right-drawer, 360px) ──────────────────┐
│  Your question (contributor sees this):                                     │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │  Could you walk me through the keyboard nav decisions │                  │
│  │  in the date picker?                                   │                  │
│  └──────────────────────────────────────────────────────┘                  │
│                                                                              │
│  Pause review SLA while waiting?                                            │
│   ( ) Yes — pauses SLA timer                                                │
│   (●) No — keep SLA running                                                  │
│                                                                              │
│  Expected response by: [ 2026-05-24 ]                                       │
│                                                                              │
│  [ Cancel ]   [ Send question ]                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

The question lives in the contributor's QA inbox and as a thread on this review item. Reviewer sees responses inline in Pane A (Q&A tab gets a "1 new" badge).

### 4.6 SLA Extension Handling

A mentor (not reviewer) can extend SLA. Modal:

```
┌─ Extend SLA · review item r-4821 ────────────────────────────────────┐
│  Current deadline: May 23 18:00                                       │
│  New deadline:     [ May 24 12:00 ]                                   │
│                                                                       │
│  Reason (required, audited):                                          │
│   ( ) Spec ambiguity awaiting clarification                           │
│   ( ) Reviewer pool capacity                                          │
│   ( ) Contributor reported blocker                                    │
│   ( ) Enterprise-requested pause                                      │
│   ( ) Other (free text)                                               │
│                                                                       │
│  Notify enterprise admin?                                             │
│   (●) Yes (recommended)                                               │
│   ( ) No                                                              │
│                                                                       │
│  [ Cancel ]   [ Extend SLA ]                                          │
└───────────────────────────────────────────────────────────────────────┘
```

Every SLA extension is an audit event with reason, actor, and notification record.

---

## 5. Escalation & Governance UX

### 5.1 Escalation Triggers

Five triggers raise an escalation:

| Trigger | Source | Behavior |
|---|---|---|
| **Reviewer-raised** | reviewer clicks "Escalate" | Opens composer |
| **Auto: SLA breach** | system | Auto-routes to reviewer pool lead; banner appears on item |
| **Auto: rework round 3** | system | Auto-routes to mentor; round-3 banner |
| **Auto: dispute** | contributor / enterprise raises | Routes to mentor / admin |
| **Mentor-bulk** | mentor escalates N items | Modal with target + cause + reason |

### 5.2 Escalation Composer

```
┌─ Modal · Raise escalation ──────────────────────────────────────────────────────┐
│  Raise escalation                                                       [ ✕ ]    │
│  Item: Build accessible date picker · v2 · c4821                                 │
│  ─────────────────                                                               │
│                                                                                  │
│  TYPE (required)                                                                 │
│   ( ) SLA breach risk        ( ) Quality dispute                                 │
│   ( ) Spec ambiguity         ( ) Contributor conduct                             │
│   ( ) Reassignment needed    ( ) Tooling / platform failure                      │
│                                                                                  │
│  ROOT CAUSE (required · drives analytics)                                        │
│   ( ) Reviewer capacity         ( ) Quality threshold unclear                    │
│   ( ) Timeline infeasibility    ( ) Ambiguous specification                      │
│   ( ) Contributor conduct       ( ) Tooling failure                              │
│   ( ) Cross-team dependency     ( ) Policy gap                                   │
│                                                                                  │
│  TARGET TIER  (auto-selected from type · editable)                               │
│   (●) Reviewer pool lead   ( ) Mentor                                            │
│   ( ) Enterprise admin     ( ) Platform admin                                    │
│                                                                                  │
│  PAUSE REVIEW WHILE ESCALATED?                                                   │
│   (●) Pause review and SLA                                                       │
│   ( ) Continue review in parallel                                                │
│                                                                                  │
│  Resolution SLA  (auto-computed from tier)                                       │
│  24 hours · breach at 2026-05-24 14:25                                           │
│                                                                                  │
│  DESCRIPTION (≥ 20 chars, required)                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │                                                                        │      │
│  └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│  Frozen snapshot of the review item will be attached to this escalation.        │
│                                                                                  │
│  [ Cancel ]                  [ Raise escalation ]                                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Escalation List Layout

```
┌─ ESCALATIONS · Open (5) ────────────────────────────────────────────────────────┐
│                                                                                  │
│  [ Open 5 ]  [ Watching 2 ]  [ History ]                                         │
│                                                                                  │
│  [ Type ▾ ]  [ Root cause ▾ ]  [ Urgency ▾ ]  [ Resolution SLA ▾ ]              │
│                                                                                  │
│  ┌─ Escalation row (88px) ─────────────────────────────────────────────────┐   │
│  │ 🔴 18h of 24h used  · Spec ambiguity · Auth modal redesign               │   │
│  │   Raised by R. Verma · routed to you (mentor)                           │   │
│  │   Root cause: ambiguous specification                                    │   │
│  │   ⚠ Resolution SLA at risk                                               │   │
│  │   [ Resolve ]  [ Reassign ]  [ Escalate further ]                       │   │
│  ├──────────────────────────────────────────────────────────────────────────┤   │
│  │ ⚠ 8h of 48h    · Reviewer capacity · Acme-Helios pool                   │   │
│  │   Raised by system · routed to you (mentor)                              │   │
│  │   Root cause: reviewer capacity (L. Mehta over cap)                      │   │
│  │   [ Resolve ]  [ Reassign reviewer ]                                    │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Governance Alerts

Governance alerts appear at three levels:

| Level | Where | Trigger |
|---|---|---|
| **Banner on item** | review detail top | Governance hold, legal hold, security flag |
| **Banner on dashboard** | Today section 1 | Active governance event affecting reviewer's queue |
| **Modal block** | on decision attempt | Tries to act on a held item |

**Block modal example:**

```
┌─ Governance hold ───────────────────────────────────────┐
│  This item is on hold by compliance.                     │
│                                                          │
│  Hold reason: Legal review of data sensitivity            │
│  Hold by: J. Khan (Legal officer)                        │
│  Hold since: 2026-05-22 09:00                            │
│  Expected release: 2026-05-25                            │
│                                                          │
│  You cannot decide on held items.                        │
│  [ Watch this item ]   [ Contact J. Khan ]   [ Close ]  │
└──────────────────────────────────────────────────────────┘
```

### 5.5 Blocked Workflow Handling

Six "blocked" states, each with a clear resolution path:

| Blocked because | Block holder | Resolution UI |
|---|---|---|
| File integrity | system | Contributor re-uploads → unblock |
| Evidence missing | contributor | Contributor completes checklist → unblock |
| Dispute active | mentor / admin | Mentor resolves dispute → unblock |
| Capacity | mentor | Mentor expands pool or rebalances → unblock |
| Upstream dependency | enterprise | Enterprise acts on prior milestone → unblock |
| Legal / compliance hold | compliance officer | Officer releases → unblock |

Each blocked item shows a **resolution timeline** widget on its detail page:

```
┌─ Blocked: legal hold ──────────────────────────────────────────────────┐
│  Held since   May 22 09:00                                              │
│  Held by      J. Khan (Legal)                                           │
│  Reason       Data sensitivity classification review                    │
│  Expected     May 25                                                    │
│  ─────────────                                                          │
│  Timeline                                                               │
│   May 22 09:00  Hold placed                                             │
│   May 22 11:30  Legal team notified                                     │
│   May 23 09:00  Awaiting external classifier response                   │
│   ...                                                                   │
│                                                                         │
│  [ Watch ]   [ Notify on release ]                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Risk Review Visibility

When the AI raises a high-risk flag (plagiarism, conduct, hash mismatch), a dedicated panel appears in Pane C:

```
┌─ Risk flags raised by AI ─────────────────────────────────┐
│  🚩 Plagiarism: 3 functions overlap public-repo X          │
│      Confidence: 88% match                                  │
│      [ View report ]   [ Investigate origin ]              │
│                                                            │
│  ⏱ Timing anomaly: v2 submitted 4 min after v1 feedback   │
│      Likely automated response                              │
│      [ View timing pattern ]                                │
└────────────────────────────────────────────────────────────┘
```

**Behavior on Accept attempt:** soft block requires reviewer to acknowledge each risk flag with a one-sentence reasoning ("Reviewed and determined fair-use" / "Reviewed; timing was tool-assisted but legitimate") which becomes part of the audit.

### 5.7 Policy Violation UX

When a policy violation is detected (e.g., reviewer attempting to decide on an enterprise they're conflicted with):

```
┌─ Modal · Policy block ──────────────────────────────────────┐
│  Cannot decide on this item                                  │
│                                                              │
│  Reason: conflict of interest                                │
│  You have flagged Acme as a related party in your profile.   │
│                                                              │
│  This item will be reassigned to another reviewer.           │
│                                                              │
│  [ Release and reassign ]   [ Contest classification ]       │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. AI Explainability UX Execution

### 6.1 AI Reasoning Panel (placement and layers)

The AI reasoning has three layers, each with a specific UI placement:

| Layer | Location | Trigger | Latency budget |
|---|---|---|---|
| **Glance** | inline on rubric criterion + queue row | always visible | 0 |
| **Peek** | tooltip / popover | hover (>300ms) or click "Why?" | <100ms |
| **Full report** | modal | click "Full rationale" | <300ms initial load |

### 6.2 Glance — Inline AI Suggestion

```
🤖  ★★★☆☆ (3/5)  ·  71% medium  ·  "missing keyboard nav, screen reader labels"
```

**Strict rules:**
- 🤖 icon always present (visual marker AI vs human)
- Score in stars matches the rubric's star pattern
- Confidence numeric + bucket
- One-line summary (≤ 80 chars; truncate with ellipsis)

### 6.3 Peek — Hover / "Why?" Popover

```
┌─ AI Why? (peek, 360 × 320, anchored to suggestion) ─────────┐
│  🤖 Why ★★★☆☆?                                                │
│  ─────────────                                                │
│  ✓ Requirement 1 (auth flow)         satisfied                │
│  ✓ Requirement 2 (input validation)  satisfied                │
│  ✓ Requirement 3 (error handling)    satisfied                │
│  ✓ Requirement 4 (responsive)        satisfied                │
│  ✗ Requirement 5 (keyboard nav)      missing                  │
│  ✗ Requirement 6 (screen reader)     missing                  │
│  ─────────────                                                │
│  Source: spec §4.2, requirement matrix lines 12–17            │
│  Examined: Storybook stories, component code                  │
│  Not reviewed: live demo, video walkthrough                   │
│  ─────────────                                                │
│  [ Full rationale ]   [ Override log ]                        │
└───────────────────────────────────────────────────────────────┘
```

### 6.4 Full Report — Modal

```
┌─ AI rationale · review item r-4821 · criterion 3 ──────────────────────────────┐
│                                                                                 │
│  Model: review-assistant-v3.2 · Prompt: v17 · Generated: 2026-05-23 14:08 UTC  │
│  Tokens: 4,210 / 8,192 (51%)                                                    │
│                                                                                 │
│  INPUTS ANALYZED                                                                │
│  ▸ Task spec                   4,800 tokens                                     │
│  ▸ Submission code (src/)      3,200 tokens                                     │
│  ▸ Test files                  1,800 tokens                                     │
│  ▸ Storybook stories             900 tokens                                     │
│  ▸ Evidence checklist            220 tokens                                     │
│                                                                                 │
│  PER-CRITERION DETAIL                                                           │
│  [ ... full breakdown with citations, lines, snippets ... ]                    │
│                                                                                 │
│  CONFIDENCE CALIBRATION                                                         │
│  When AI says "medium" on similar tasks, human's final rating is within ±1 star│
│  in 88% of cases (last 90d, n=412). Calibration is stable.                     │
│                                                                                 │
│  RISK FLAGS                                                                     │
│  ▸ Plagiarism: 3 functions overlap public-repo X                                │
│  ▸ Submission timing anomaly: v2 4 min after v1 feedback                        │
│                                                                                 │
│  HUMAN OVERRIDE HISTORY (this item)                                             │
│  ▸ R. Verma overrode criterion 3 (AI:3 → R:5, +2) — reasoning logged           │
│                                                                                 │
│  [ Export rationale ]   [ Close ]                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Confidence Indicators (canonical, applied everywhere)

```
Visual treatment per bucket:

HIGH    ≥90%   [ 🤖 94% high   ]   forest    solid badge       → quick-confirm eligible
MEDIUM  70-89% [ 🤖 71% medium ]   amber     outlined badge    → full review required
LOW     <70%   [ 🤖 54% low    ]   crimson   outlined + banner → cannot quick-confirm

Reviewer confidence uses same visual vocabulary:
[ 👤 You: High ]    [ 👤 You: Med ]    [ 👤 You: Low ]
```

### 6.6 Explainability Hierarchy

```
LEVEL 1   ALWAYS VISIBLE
          Score + confidence + 1-line summary

LEVEL 2   ONE INTERACTION
          Per-requirement breakdown + source + coverage gap

LEVEL 3   DEEP DIVE
          Model version, prompt version, token cost, calibration data,
          override history, risk flag details

LEVEL 4   AUDIT
          Per-decision delta payload (queryable in audit panel)
```

### 6.7 Override UX

Every AI suggestion has three explicit actions:

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 AI suggests ★★★☆☆ (3/5) · 71% medium                     │
│                                                              │
│  [ ✓ Accept suggestion (3) ]                                 │
│  [ ✎ Edit ]                                                  │
│  [ ✗ Reject suggestion ]                                     │
└──────────────────────────────────────────────────────────────┘
```

**Audit payload per action:**

| Action | Logged delta | Optional reason |
|---|---|---|
| Accept | `{ai:3, human:3, delta:0}` | no |
| Edit | `{ai:3, human:5, delta:+2}` | yes, prompt for ≥10 char reason |
| Reject | `{ai:3, human:5, delta:+2, rejected:true}` | required, ≥20 char reason |

**Edit reason prompt:**

```
┌─ Why did you change from 3 to 5? (optional) ─┐
│  ┌──────────────────────────────────────┐    │
│  │  Spec §4.3 added a new requirement   │    │
│  │  after AI's cutoff that this addr…   │    │
│  └──────────────────────────────────────┘    │
│  Skip · [ Save ]                              │
└───────────────────────────────────────────────┘
```

### 6.8 Trust Indicators (in Insights / AI partnership)

```
┌─ Your AI partnership (last 90d) ─────────────────────────────────────────────┐
│                                                                              │
│  AGREEMENT                                                                   │
│   Decisions AI pre-filled         287                                        │
│   You accepted suggestion         210 (73%)                                  │
│   You edited                       63 (22%)                                  │
│   You rejected                     14 (5%)                                   │
│                                                                              │
│  CALIBRATION                                                                 │
│   AI said HIGH      (≥90%):   you agreed 91% of the time                     │
│   AI said MEDIUM    (70-89%): you agreed 68% of the time                     │
│   AI said LOW       (<70%):   you agreed 41% of the time                     │
│                                                                              │
│   Verdict: HIGH is well-calibrated; MEDIUM is over-confident                 │
│                                                                              │
│  SYSTEMATIC DISAGREEMENT                                                     │
│   Criterion 5 (Accessibility) on React work: you are +1.2 above AI           │
│   Criterion 3 (Requirements) on rework v2+: you are −0.4 below AI            │
│                                                                              │
│  IMPACT                                                                      │
│   Estimated time saved: ~14 h/week                                           │
│   Risks caught: by AI 18 · by you 9 · by both 4                              │
│                                                                              │
│  [ See decision log ]   [ Tune AI partnership preferences ]                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 6.9 AI Recommendation Visibility

Across the workspace, AI recommendations appear in **eight defined locations** — and only there:

| # | Location | What |
|---|---|---|
| 1 | Queue row | Confidence chip + "AI ready" if pre-filled |
| 2 | Review detail header | Confidence chip |
| 3 | Pane B Rubric criterion | Per-criterion suggestion + actions |
| 4 | Pane C AI evidence summary | Roll-up of coverage and risks |
| 5 | Pane A Compare tab | AI re-analysis delta |
| 6 | Decision toolbar (quick-confirm) | "AI ready" lane chip |
| 7 | Insights / AI partnership | Aggregate metrics |
| 8 | Audit panel | AI-delta entries |

Nowhere else. This prevents AI noise from creeping into surfaces where it doesn't add decision value.

---

## 7. State-by-State UX Execution

For each state, this section specifies: **layout behavior, action changes, visual priority, system responses, escalation logic**.

### 7.1 State · Pending

**Operational meaning:** in queue, not yet claimed.

```
Layout behavior:
   Appears in queue list with SLA chip
   No detail page open unless reviewer clicks
   Detail page available read-only (cannot edit rubric)

Action changes:
   Primary action: [ Claim ]
   Secondary: snooze, watch, escalate-from-list (mentor only)

Visual priority:
   SLA chip color tier sets priority
   Slate base background

System responses:
   SLA timer running
   AI pre-rubric generated and cached
   Available to all reviewers in pool

Escalation logic:
   Auto-escalate on SLA breach
```

### 7.2 State · Reviewing (Claimed → In Review → Decision Pending)

**Operational meaning:** locked to this reviewer; actively drafting.

```
Layout behavior:
   Detail page fully editable in Pane B
   Presence lock badge in header
   Other reviewers see "claimed by R. Verma · 23 min ago"
   Autosave indicator in top strip ("Saved 2s ago")

Action changes:
   Primary action: rubric scoring, feedback, decide
   Secondary: release (returns to Pending), escalate, save draft, snooze

Visual priority:
   Indigo presence badge in header
   SLA chip continues to color the urgency

System responses:
   Presence lock held N minutes; auto-release on idle
   Draft autosaved every 10s
   AI re-evaluation if contributor pushes new version (banner)

Escalation logic:
   Same as Pending (SLA breach auto-escalates)
   Plus: reviewer can manually escalate
```

### 7.3 State · Accepted

**Operational meaning:** reviewer-accepted; awaits enterprise final acceptance.

```
Layout behavior:
   Detail page becomes read-only
   Header: forest "Accepted" pill + signed audit hash
   Pane B replaced by "Decision summary" card
   Cannot un-accept; only dispute

Action changes:
   Primary action: [ See enterprise acceptance status ]
   Secondary: dispute (only if contributor or mentor)

Visual priority:
   Forest pill
   Lower in queue (terminal)

System responses:
   Reputation engine fires
   Payout eligibility = ENGAGED
   Audit signed
   Contributor notified
   Bundle rollup recomputed
   AI delta logged

Escalation logic:
   N/A unless disputed
```

### 7.4 State · Rejected

**Operational meaning:** terminally rejected (recoverable via dispute).

```
Layout behavior:
   Detail page becomes read-only
   Header: crimson "Rejected" pill + reason + signature
   Pane B shows reasoning + "what worked" prominently
   Contributor banner: "Dispute available within 7 days"

Action changes:
   Primary action: (none for reviewer)
   Secondary: see dispute status, view in history

Visual priority:
   Crimson pill
   Lower in queue (terminal)

System responses:
   Reputation engine fires
   Payout = NONE
   Audit signed
   Contributor notified
   If "reassign" route chosen: new queue entry for new reviewer
   AI delta logged

Escalation logic:
   Contributor dispute → mentor escalation queue
```

### 7.5 State · Rework Requested

**Operational meaning:** workroom reopens for contributor; version increments anticipated.

```
Layout behavior:
   Detail page becomes read-only (this version)
   Header: amber "Rework requested" pill
   Pane B shows rework composer output (anchored items)
   Round counter prominent

Action changes:
   Primary action: (waits for contributor)
   Secondary: extend deadline (mentor), withdraw rework (reviewer, within 1h grace)

Visual priority:
   Amber pill
   Maintains queue presence (yours, status "awaiting contributor")

System responses:
   Contributor workroom reopens
   Round counter incremented
   SLA timer resets for next round
   Audit logged

Escalation logic:
   Round ≥ 3: auto-escalate to mentor
```

### 7.6 State · Escalated

**Operational meaning:** an escalation is in resolution; review may be paused or parallel.

```
Layout behavior:
   Banner on detail page: "Escalation in progress · routed to {tier} · {SLA}"
   Frozen snapshot link
   Original review state preserved underneath

Action changes:
   If paused: rubric and decision disabled
   If parallel: reviewer can continue but cannot finalize

Visual priority:
   Crimson banner above all other content
   SLA chip overlay continues

System responses:
   Escalation ticket created with own SLA
   Resolver notified
   Original SLA paused or continues per pause flag

Escalation logic:
   Further escalation possible (mentor → admin)
```

### 7.7 State · Blocked

**Operational meaning:** progress halted by a specific reason.

```
Layout behavior:
   Banner on detail page indicating block reason + holder
   Pane B controls disabled (rubric can be drafted, decision cannot be confirmed)
   Resolution timeline widget on detail page

Action changes:
   Primary action: [ Watch ]   [ Notify on release ]
   Reviewer cannot confirm any decision

Visual priority:
   Crimson banner
   Item stays in queue but with block badge

System responses:
   Status set to blocked
   SLA timer pauses
   Block holder notified

Escalation logic:
   If block exceeds N days, auto-escalate to platform admin
```

### 7.8 State · SLA Breach Risk (overlay)

**Operational meaning:** parallel state to primary; tier-dependent visual.

```
Layout behavior:
   Overlay on chip wherever item appears
   On detail page: warning banner at tier Critical+

Action changes:
   At Critical: push notification triggered
   At Breached: auto-escalation triggers

Visual priority:
   Tier color overrides primary state's calm tones

System responses:
   Tier transitions are audited
   Auto-escalation on Breached

Escalation logic:
   Breached → reviewer pool lead + reassign + enterprise notify
```

### 7.9 State · Governance Hold

**Operational meaning:** compliance/legal/security halted progress.

```
Layout behavior:
   Block modal on any decision attempt
   Banner on detail page with hold reason, holder, since, expected release
   Resolution timeline widget

Action changes:
   All decision actions disabled
   "Contact holder" affordance available

Visual priority:
   Crimson highest-priority banner
   Item flagged in queue with shield icon

System responses:
   Status set to governance_hold
   SLA paused
   Audit event with hold metadata

Escalation logic:
   N/A — hold is the escalation
```

### 7.10 State · Partially Approved (bundle level)

**Operational meaning:** bundle has mixed sub-decisions.

```
Layout behavior:
   Bundle view at /review-hub/decisions/bundles/[bundleId]
   Per-sub-submission status grid
   Bundle decision modal: hold / partial accept / renegotiate

Action changes:
   Primary action: enterprise admin only (final acceptance gate)
   Reviewers can see bundle context from their item

Visual priority:
   Amber bundle pill
   Sub-items each show their own state

System responses:
   Bundle rollup recomputed on each sub-decision
   "Bundle ready for enterprise" event fires when all subs settled

Escalation logic:
   Mixed states past deadline → mentor escalation
```

### 7.11 State Transition Cheat-Sheet

```
Pending          → Claimed         (claim action)
Claimed          → In Review       (open + edit)
Claimed          → Pending         (lock timeout)
In Review        → Decision Pending (decide action)
In Review        → Claimed         (release)
Decision Pending → Accepted        (confirm Accept)
Decision Pending → Rework          (confirm Rework)
Decision Pending → Rejected        (confirm Reject)
Decision Pending → In Review       (cancel modal)
Accepted         → Disputed        (contributor disputes)
Rejected         → Disputed        (contributor disputes)
Rework           → Pending (v++)   (contributor resubmits)
Rework           → Escalated       (round 3)
Disputed         → Accepted/Rejected (mentor resolves)
* (non-terminal) → Blocked         (block placed)
* (non-terminal) → Escalated       (escalation raised)
Blocked          → Pending         (block released)
Escalated        → return-to-flow  (escalation resolved)
```

---

## 8. Wireframe-Level Layout Structures

### 8.1 Spacing Hierarchy

```
4 px       icon-to-text within a chip
8 px       within-component padding
12 px      between sibling controls
16 px      between sub-sections of a card
24 px      between cards within a section
32 px      between sections of a page
48 px      between major regions
64 px      page top padding under top strip
```

### 8.2 Information Priority (canonical reading order)

```
Within a page:           top-left → bottom-right
Within a card:           title → primary metric → secondary metrics → action
Within a row:            SLA → identity → context → action
Within a modal:          purpose → required fields → optional fields → impact → action
Within a confirmation:   what → who → impact → consequences → action
```

### 8.3 Action Placement

```
Primary action      bottom-right of a card / modal (closest to the eye's exit point)
Cancel              bottom-left
Secondary action    next to primary (left side of primary)
Destructive         behind "More ▾" or with a soft confirm
Lateral action      header or top-right strip
Utility             icon-only, top-right corner
```

### 8.4 Wireframe — Insights / Pool Health (mentor mode)

```
┌─ POOL HEALTH ────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  ┌─ Capacity tile ─┐ ┌─ SLA hit tile ─┐ ┌─ Throughput tile ┐ ┌─ AI partner ─┐  │
│  │  53/60 (88%)    │ │  91%  ▼3%      │ │  127 / 175 wk    │ │  74% agree   │  │
│  └─────────────────┘ └─────────────────┘ └───────────────────┘ └───────────────┘  │
│                                                                                  │
│  ─── Per-reviewer (table, 32px rows) ───                                         │
│  Reviewer       Cap          Active   Today   Wk    SLA hit  Avg time   Status   │
│  R. Verma       █████░ 18/25   1       6      28     96%      1.7h      ●●●      │
│  K. Singh       ████░░ 11/25   -       4      19     94%      1.9h      ●●●      │
│  L. Mehta       ██████▲ 24/20   1       0      8      72% ⚠   3.4h ⚠   ●●○      │
│  A. Iyer        ░░░░░░  0/25   -       -      -      -        -         ⚫⚫⚫    │
│                                                                                  │
│  ─── Calibration drift ───                                                       │
│  [ Heatmap: reviewer × criterion × delta vs pool median ]                        │
│  L. Mehta is +0.8 above pool median on criterion 1 (Code Quality) — drift?       │
│                                                                                  │
│  ─── Anti-rubber-stamp pairs ───                                                 │
│  R. Verma ↔ c4821:  5 of last 7 reviews (>70%) — ⚠ continuity risk              │
│  K. Singh ↔ c5102:  4 of last 6 reviews (>66%) — ⚠ monitor                      │
│                                                                                  │
│  [ Rebalance pool ]                                                              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 8.5 Wireframe — Decisions / Calibration

```
┌─ CALIBRATION ────────────────────────────────────────────────────────────────────┐
│  Compare your decisions to peer median over the last 90d                         │
│                                                                                  │
│  ┌─ Criterion drift chart (180px tall) ────────────────────────────────────┐   │
│  │  [ Bar chart: criterion 1..5 × you vs peer median ]                       │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Where you differ most:                                                          │
│   ▸ Criterion 5 (A11y): you avg 3.2 · pool avg 3.9   (−0.7 stricter)             │
│   ▸ Criterion 3 (Requirements on rework v2+): you avg 4.1 · pool avg 3.7 (+0.4) │
│                                                                                  │
│  ─── Sample cross-reviewer comparison ───                                        │
│  Item: Build accessible date picker · v2                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │ Reviewer       C1   C2   C3   C4   C5   Avg                              │    │
│  │ You            4    5    5    4    2    4.0                              │    │
│  │ K. Singh       4    5    4    4    3    4.0                              │    │
│  │ L. Mehta       5    5    4    4    3    4.2                              │    │
│  │ AI suggestion  4    5    3    4    3    3.8                              │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 8.6 Wireframe — Mentorship Session Detail

```
┌─ MENTORSHIP SESSION ─────────────────────────────────────────────────────────────┐
│  c4821 · Accessibility coaching · scheduled 4:00 PM · 45 min                     │
│                                                                                  │
│  ┌─ Pane Left (60%) ────────────────────┐ ┌─ Pane Right (40%) ──────────────┐  │
│  │  Session agenda                       │ │  Contributor context             │  │
│  │  ─────────                            │ │  c4821 · React L3 · A11y L2      │  │
│  │  1. Review v2 of date picker          │ │  Reliability 87/100              │  │
│  │  2. Focus trap implementation         │ │  Learning velocity 72%           │  │
│  │  3. Aria-label patterns               │ │  ─────────                       │  │
│  │  4. Resources                         │ │  Prior sessions (3)              │  │
│  │                                       │ │   ▸ Apr 30 · React patterns      │  │
│  │  Linked review items                  │ │   ▸ May  8 · A11y intro          │  │
│  │  ▸ r-4821 (date picker, v2)           │ │   ▸ May 14 · A11y deep dive      │  │
│  │  ▸ r-3902 (auth modal, v3)            │ │  ─────────                       │  │
│  │                                       │ │  Skill gaps identified           │  │
│  │  ─── Session notes ───                │ │   ▸ Keyboard nav patterns        │  │
│  │  ┌──────────────────────────────┐    │ │   ▸ SR testing                   │  │
│  │  │  (notes editor)               │    │ │                                  │  │
│  │  └──────────────────────────────┘    │ │  Strengths observed              │  │
│  │                                       │ │   ▸ Component composition        │  │
│  │  Recommended next actions            │ │   ▸ Test structure               │  │
│  │  ┌──────────────────────────────┐    │ │                                  │  │
│  │  │  (action list)                │    │ │                                  │  │
│  │  └──────────────────────────────┘    │ │                                  │  │
│  └────────────────────────────────────────┘ └──────────────────────────────────┘  │
│                                                                                  │
│  [ Save draft ]   [ Escalate concern ]   [ Complete session ]                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 8.7 Layout Hierarchy Across the Workspace (canonical)

| Page | Top zone | Body | Right rail | Bottom |
|---|---|---|---|---|
| Today | Needs Now alert | My Work + KPI + Bottleneck + Pool | — | Mentorship + Watchlist |
| Queue | Header + segments + filters | Table | — | Keyboard hint |
| Review Detail | Status header (sticky) | 3-pane (Submission · Decision · Context) | (Context = Pane C) | Shortcut hint |
| Decisions | Header + filters | History table | — | Pagination |
| Mentorship | Today calendar | Sessions list | Session drawer (on open) | — |
| Escalations | Segment chips | Table | Resolution drawer (on open) | — |
| Insights · AI Partnership | KPI strip | Calibration + disagreement | — | Decision log link |
| Insights · Pool Health | Capacity strip | Per-reviewer + drift + anti-RS | Rebalance recs | Forecast |
| Me · Profile | Identity card | Skills + capacity + availability | — | Edit profile |

---

## 9. Enterprise UX Design System Guidance

### 9.1 Table Patterns

| Pattern | When to use | Notes |
|---|---|---|
| **Compact data table** | Queue, history, audit | 32 px row, 13 px body; no zebra |
| **Card list** | Mentorship sessions, escalations | 80–120 px row; supports drawer |
| **Bundle / hierarchical table** | Bundle rollup, project group | 40 px headers, 32 px sub-rows, indent 24 px |
| **Pivot grid** | Calibration, pool health, AI partnership | 13 px body, color-coded cells, sticky first column |
| **Timeline list** | Audit, history, escalation timeline | 80 px row, leading timestamp, trailing actor |

**Universal table rules:**
- No zebra striping (interferes with status colors).
- 1 px divider (`color.divider.subtle`).
- Sticky header on scroll.
- Click row anywhere except interactive children → opens detail.
- Hover state: subtle background tint, not bold-out.

### 9.2 Workflow Patterns

| Pattern | When to use | Example |
|---|---|---|
| **Composer modal** | Multi-field structured input affecting governance | Rework Composer, Reject Composer, Escalation Composer |
| **Confirmation modal with cascade preview** | Terminal action with downstream impact | Accept confirm with payout preview |
| **Side drawer** | Detail without leaving context | Reviewer detail from pool list |
| **Sticky decision toolbar** | Always-reachable primary action on long pages | Pane B bottom on review detail |
| **Inline expand/collapse** | Progressive disclosure within content | Rubric criterion, audit panel |
| **Tabbed sub-navigation within a pane** | Multiple lenses on one entity | Pane A tabs |
| **Banner above content** | Crisis or hold state | Round-3 banner, governance hold |

### 9.3 Enterprise Interaction Patterns

| Pattern | Implementation |
|---|---|
| **Keyboard-first** | Every primary action has a key; `?` opens map |
| **URL-persistent filter state** | Reload, share, bookmark all preserve state |
| **Save-and-resume** | Drafts autosave every 10s; banner "Saved 2s ago" |
| **Soft block + hard block** | Soft = warning + continue; hard = cannot continue |
| **Two-step confirm on terminal** | Modal with impact preview |
| **Audit inline, not orphan** | "View audit" panel on every entity |
| **Bulk-allowed only when safe** | Claim/snooze/release ✓; Accept/Reject/Rework ✗ |
| **Empty states with intent** | "All clear. 0 critical items." — confirms healthy state |
| **Progressive density** | Compact default; toggle to comfortable |
| **Context-preserving drawers** | Drawer dismiss returns to exact position |

### 9.4 Governance Interaction Patterns

| Pattern | Where used |
|---|---|
| **Signed action confirmations** | "This decision will be signed and audited" on every confirm |
| **Forced reason taxonomy** | Reject, escalation, SLA extension all force categorized reason |
| **Cascade preview before commit** | Show downstream impact (payout, reputation, notifications) |
| **Irreversibility notice** | Visible on Accept, Reject; "Dispute available" on Rejected |
| **Frozen snapshots** | Escalation captures the item state at escalation moment |
| **Audit trace inline** | Audit panel on every entity, expandable |
| **Verifiable signature affordance** | "Verify signature" link opens hash check |
| **Holder-named blocks** | "Held by J. Khan (Legal officer)" — accountability, contactable |
| **Policy gate visibility** | Compliance gates panel shows SOW chain, terms, sensitivity |

### 9.5 AI Explainability Interaction Patterns

| Pattern | Where used |
|---|---|
| **AI-suggestion visual distinction** | 🤖 icon + subtle background tint; never confused with human input |
| **Source / Confidence / Coverage / Override** | Required quartet on every AI surface |
| **Tiered detail (glance / peek / report)** | Three levels of explainability across same surface |
| **Override audit with reason** | Every override logged with delta + optional reason |
| **Confidence-tiered friction** | Low conf cannot quick-confirm; soft block on high-conf override |
| **Coverage-gap declaration** | AI explicitly says "not reviewed: …" |
| **Calibration ledger** | Reviewer sees their own AI-agreement patterns |
| **Risk-flag inline** | Plagiarism, timing anomaly, integrity surfaced on detail page |
| **Quick-confirm lane** | Earned by high-confidence + risk-free + complete-evidence trifecta |
| **AI re-analysis delta on rework** | v2 AI compared to v1 AI; what changed |

---

## 10. Product Design Execution Insights

### 10.1 Why These Layouts Improve Enterprise Operations

**Three-pane decision workspace** (Submission · Decision · Context) gives the reviewer **simultaneous access** to evidence, instrument, and context. No tab-switching, no context-loss, no scroll-back. The single most common operational pattern in review (look at code → check rubric → recall contributor history) is now a single eye-movement instead of three navigations.

**Composite-priority queue with "Why first?" affordance** removes the reviewer's tax of *guessing* what to do next. Today's UI shows urgency *as* a sort; the new UI shows urgency *as a reasoning chain*. That's the difference between a sorted list and an operator's checklist.

**Sticky decision toolbar in Pane B** means the primary action is always within thumb-reach, even when the rubric is scrolled deep. Time-to-confirm drops from ~6 seconds (locate, scroll, click) to ~1 second (key A).

**Anti-fatigue patterns** (pace gauge, varietal routing, Pomodoro nudge, end-of-shift soft cap) directly attack the documented review-fatigue problem from `PRODUCT_UNDERSTANDING.md § 12`. Each pattern is small; the cumulative effect on sustained throughput is large.

**Bottleneck spotlight on mentor dashboard** converts the mentor from a reactive operator (responding to SLA breaches) to a proactive operator (rebalancing before breach). This is the operational lift `ENTERPRISE_UX_AUDIT.md § 8.5` calls for.

### 10.2 Why These Workflows Scale Better

**AI quick-confirm lane** converts the throughput math fundamentally. With AI pre-rubric and confidence-gated quick-confirm, a 15-minute review on a high-confidence item drops to 90 seconds. At a population of 50 reviewers each doing 8 quick-confirms a day, that's **50 × 8 × 13.5 min ≈ 90 reviewer-hours saved per day** — capacity equivalent to ~12 additional reviewers, achieved purely through UX.

**Anti-rubber-stamp routing** prevents the failure mode where the same reviewer rubber-stamps their own rework cycle — which is the reviewer-equivalent of marking your own homework. As the platform scales and reviewer pools grow, this single rule keeps the system trustworthy without explicit policing.

**Presence locks** mean two reviewers never grab the same item. As pool size grows, collision probability grows quadratically — without locks, the system would catastrophically fail at scale.

**Calibration mode for new reviewers** addresses the onboarding cliff (`SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 9.4`). New reviewers shadow-rate against established peers before being given live items, with their drift surfaced for self-correction. This converts onboarding from a 4-week cliff to a 2-week glide path.

**Composite filter system with URL persistence** lets each reviewer build their personal view, share it with their pool, and reload to the same state. As volume grows, this is the difference between a usable queue and an unusable one.

### 10.3 How This Improves Trust and Governance

**Signed decisions** convert toast-only theater into cryptographically verifiable artifacts. Every Accept, Reject, Rework carries a hash and a ledger sequence. The reviewer sees the signing happen ("Decision signed · 0xa3…e1"). The enterprise final-accepter can verify upstream. The regulator can verify end-to-end.

**Reviewer confidence declaration** is the single most under-rated trust primitive in this redesign. Asking the reviewer *"how sure are you?"* surfaces uncertainty *before* it becomes a dispute. Downstream consumers see the reviewer's flag and can triage accordingly.

**AI explainability invariants** (Source / Confidence / Coverage / Override) turn the AI from a black box into a colleague whose work is auditable. The reviewer can audit the AI; the audit can audit the reviewer's overrides; the regulator can audit the audit. Trust is *composable*.

**Anti-rubber-stamp routing + reviewer pattern detection** make subtle fraud (lazy approval, coerced approval) visible. Today the audit notes "no reviewer-level pattern detection — always approves, never rejects." The redesign surfaces these patterns to the mentor and to the platform admin.

**Forced reason taxonomy on Reject and Escalate** prevents vague decision-making. Every rejection has a category; every escalation has a root cause. Analytics then know *why* the system bottlenecks, not just *that* it does.

**Inline audit on every entity** answers `ENTERPRISE_UX_AUDIT.md § 6.1`'s critical gap. The reviewer can answer "what happened to this yesterday?" in one click without leaving the decision context.

### 10.4 How This Improves Mentor Efficiency

**Today landing surface** answers the mentor's two most-frequent questions ("what's burning?" and "am I on track?") in 3 and 10 seconds respectively. The hierarchy is built around their attention budget, not around displaying everything.

**Pool health view** lets the mentor see all four reviewers at a glance, identify capacity issues, and execute a rebalance with a single confirmation. Today this requires conversation, spreadsheets, or admin-portal navigation.

**Recommended actions** (e.g., "Rebalance L. Mehta → R. Verma") convert the mentor from a diagnostician (looking at data, deciding what to do) into an operator (reviewing recommendations, confirming or overriding). At scale, this is the difference between a mentor managing one pool and managing five.

**Escalation list with resolution SLA** turns escalations from a black box into a managed queue. The mentor sees what's about to breach its own SLA, in what order, and with what cause.

**Calibration drift heatmap** surfaces reviewer-quality issues *before* they become problems. A reviewer drifting +0.8 above peer median on Code Quality is a coaching opportunity, not a crisis.

**Anti-rubber-stamp pair detection** flags continuity risks the mentor would otherwise miss. The mentor can then redistribute the pair without making the conversation personal.

**Mentorship session detail with context preserved** means the mentor can run a coaching session with the contributor's full history, recent submissions, prior session notes, and skill gaps all visible — without 5 tab-switches.

### 10.5 The Execution Mindset

This blueprint is a contract between design and engineering. Every wireframe in this document is intended to be **built**, not discussed. Every state in section 7 has a defined visual treatment and a defined behavior. Every pattern in section 9 has a clear "when to use" rule.

When ambiguity remains, it is explicit (look for `[ open ]` markers in subsequent revisions). Implementation can proceed by:

1. Building the design tokens (section 0 + UX Architecture Appendix B).
2. Building the component library against Appendix B of the prior document.
3. Building pages in this order: Today → Queue → Review Detail → Decisions → Escalations → Insights → Mentorship → Me.
4. Wiring backend persistence as each page lands (the highest-impact unblock from `AUDIT_CONTEXT.md`: replace toast-only with real persistence on the review-detail decision actions first).
5. Layering AI integration last (the system works without AI; AI lifts the ceiling, doesn't define the floor).

---

## Appendix A — Layout Grid (canonical)

```
Sidebar:            240 px expanded · 64 px collapsed
Top strip:          56 px sticky
Section 1 banner:   variable (only when crisis present)
Page padding:       24 px horizontal · 32 px top
Content max-width:  1440 px centered above 1680
Column system:      12-col · 24 px gutter
Density default:    compact (32 px row, 13 px body)
Z-index scale:      sticky=10 · dropdown=20 · drawer=30 · modal=40 · toast=50 · command=60
```

## Appendix B — Component Contracts (selected)

```
<SLATierChip
  tier="breached" | "critical" | "warning" | "watch" | "healthy"
  timeRemaining={seconds}
  variant="row" | "header" | "card"
/>

<ConfidenceBadge
  source="ai" | "reviewer"
  level="high" | "medium" | "low"
  value={percent}
  variant="default" | "compact"
/>

<RubricCriterion
  criterion={Criterion}
  reviewerScore={1..5 | null}
  aiSuggestion={{ score, confidence, reasoning, source, coverage }}
  onScoreChange={fn}
  onAiAction={"accept" | "edit" | "reject"}
  severity={"blocker" | "major" | "nit" | null}
  expanded={boolean}
/>

<EvidenceCard
  artifact={Artifact}
  integrityChecks={{ hash, virus, plagiarism }}
  onPreview={fn}
  onDownload={fn}
/>

<DecisionToolbar
  enabled={{ accept, rework, reject, escalate }}
  reviewerConfidence={"high" | "medium" | "low" | null}
  onConfidenceChange={fn}
  onDecide={fn}
/>

<RoundBanner
  round={number}
  maxRound={3}
  continuityFlag={boolean}
  rubberStampRisk={boolean}
  onRelease={fn}
  onCompare={fn}
/>

<AuditPanel
  entityId={string}
  entityType={"review" | "escalation" | "session" | "deliverable"}
  events={AuditEvent[]}
  variant="inline-collapsed" | "drawer"
/>

<EscalationComposer
  reviewItemId={string}
  defaultTier={Tier}
  onSubmit={fn}
  onCancel={fn}
/>

<ReworkComposer
  reviewItemId={string}
  rubricSnapshot={Rubric}
  round={number}
  onSubmit={fn}
  onCancel={fn}
/>

<KPITile
  label={string}
  primary={value}
  secondary={[]}
  trend={percent}
  trendDirection={"up" | "down" | "flat"}
  onClick={fn}
/>
```

## Appendix C — Empty / Error / Loading States

| Surface | Empty | Loading | Error |
|---|---|---|---|
| Today / Needs Now | "All clear. 0 critical items." | (no skeleton — it's already optional) | "Could not load alerts — [ Retry ]" |
| Queue | "No items in queue. [ Refresh ]" | Row skeletons (8 rows) | Banner "Could not load queue" + Retry |
| Review detail | n/a (always has content) | 3-pane skeleton | "Could not load review — [ Retry ] [ Back ]" |
| AI evidence summary | "AI pre-analysis pending — try refresh in 30s" | Spinner + "Analyzing…" | "AI unavailable; full human review required" |
| Audit panel | "No audit events yet" | Spinner | "Could not load audit — [ Retry ]" |
| Escalation list | "No open escalations" | Row skeletons (3 rows) | Banner + Retry |
| Insights | "Insufficient data — return after 7 days" | Card skeletons | Banner + Retry |
| Pool health | "No reviewers in your pool" | Row skeletons | Banner + Retry |

**Universal loading rule:** spinners are for indeterminate ops; skeletons are for content-shape known. Never both at once.

## Appendix D — Telemetry Events (selected)

```
queue.viewed                      { segment, group, filter_count }
queue.item_claimed                { review_id, time_in_queue_ms }
review.opened                     { review_id, round, ai_confidence }
review.rubric_scored              { review_id, criterion, score, ai_suggestion, delta }
review.ai_suggestion_action       { review_id, criterion, action, reason }
review.draft_autosaved            { review_id, draft_age_ms }
review.confidence_declared        { review_id, level }
decision.confirmed                { review_id, decision, time_to_decide_ms, ai_agreement }
decision.signed                   { review_id, signature_hash, ledger_seq }
escalation.raised                 { review_id, type, root_cause, target_tier }
escalation.resolved               { escalation_id, resolution, time_to_resolve_ms }
sla.tier_transition               { review_id, from_tier, to_tier }
sla.breached                      { review_id, breach_seconds }
quick_confirm.eligible_shown      { review_id, ai_confidence }
quick_confirm.used                { review_id, time_to_confirm_ms }
ai.partnership.override           { review_id, criterion, delta, reason }
mentor.rebalance.previewed        { source_reviewer, target_reviewer, items_count }
mentor.rebalance.executed         { source_reviewer, target_reviewer, items_count }
bottleneck.recommendation_shown   { cause, recommendation }
bottleneck.recommendation_acted   { cause, action }
```

## Appendix E — Acceptance Criteria Checklist (per page)

**Today**
- [ ] Section 1 hides when no crises; shows count when present
- [ ] My Work shows next 3 items in composite-priority order
- [ ] Pace gauge updates live
- [ ] KPI strip shows three cards with trend
- [ ] Bottleneck section visible only in mentor mode
- [ ] Pool Health visible only in mentor mode
- [ ] All numbers click-through to drill-down

**Queue**
- [ ] Segment chips filter by SLA tier
- [ ] Scope toggle (Mine/Team/Pool) hides Team/Pool in reviewer mode
- [ ] Filters persist to URL
- [ ] Group toggle persists per reviewer
- [ ] Sort persists to URL
- [ ] Keyboard navigation: `/`, `J/K`, `Enter`, `A`
- [ ] Row hover shows secondary actions
- [ ] "Why first?" affordance on top row
- [ ] Bulk: claim, snooze, release, watch; NOT Accept/Reject/Rework
- [ ] Contributor peek on hover >400ms

**Review Detail**
- [ ] Three panes render at correct widths
- [ ] Pane A tabs work and persist
- [ ] Pane B autosaves drafts every 10s
- [ ] Pane B sticky decision toolbar
- [ ] Pane C audit collapsed by default; expand opens drawer
- [ ] Round banner appears for round > 1
- [ ] AI suggestion visually distinct from human input
- [ ] Override actions log to audit
- [ ] Reviewer confidence required before confirm
- [ ] Accept disabled until preconditions met
- [ ] Reject behind "More ▾"
- [ ] Low-confidence Accept/Reject triggers extra confirm
- [ ] Quick-confirm lane appears for AI-ready items

**Rework / Reject / Escalate Composers**
- [ ] All required fields enforced
- [ ] Templates load based on criterion
- [ ] "What worked" required on Rework and Reject
- [ ] Reason taxonomy required
- [ ] Cascade preview visible before confirm
- [ ] Save draft option available
- [ ] Cancel preserves any partial draft

**Escalations List**
- [ ] Resolution SLA visible per row
- [ ] Tabs: Open · Watching · History
- [ ] Filters: type, root cause, urgency, SLA
- [ ] Resolve drawer captures resolution + reason

**Insights**
- [ ] AI Partnership shows agreement, calibration, disagreement, impact
- [ ] Pool Health (mentor) shows capacity, drift, anti-RS pairs
- [ ] All charts have hover tooltips with detail

**Universal**
- [ ] Empty states present and intentional
- [ ] Loading states use skeletons matching content shape
- [ ] Error states offer Retry
- [ ] Keyboard shortcuts work; `?` shows full map
- [ ] URL state preserves across reload
- [ ] Audit panel inline on every governance-relevant entity
- [ ] Every terminal action signed and audited

---

*End of document — `MENTOR_WORKSPACE_UX_EXECUTION_BLUEPRINT.md`.*
