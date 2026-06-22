# Mentor Review System — UX Architecture & Wireframe Planning

> **Companion to:** `MENTOR_REVIEW_REDESIGN_STRATEGY.md` (the *why*).
> **This document:** the *how* — the IA tree, the wireframe layouts, the state visual system, the screen-by-screen section hierarchy.
>
> **Source ground truth:** `PRODUCT_UNDERSTANDING.md`, `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md`, `ENTERPRISE_UX_AUDIT.md`, and the existing `src/app/mentor/*` + `src/app/enterprise/reviewer/*` implementation.
>
> **Design philosophy:** *The Mentor Review System is the platform's irreversibility surface — payment, credential, acceptance, trust all cross here. Every pixel must serve one of three masters: throughput, defensibility, or trust.*

---

## Table of Contents

1. Mentor System Information Architecture
2. Review Queue UX Architecture
3. Evidence Review Experience
4. Decision Workflow UX
5. Mentor Dashboard Architecture
6. AI Explainability UX Layer
7. Governance & Audit UX
8. State System Architecture
9. Wireframe Planning (page-level layouts)
10. Enterprise UX Design Principles
11. Product Design Interview Insights

Appendices: A. Component inventory · B. Token system · C. Keyboard map · D. Cross-doc anchor table

---

## 1. Mentor System Information Architecture

### 1.1 Architectural Intent

The current product has **two parallel surfaces** for the same role family:

```
/mentor/*                      /enterprise/reviewer/*
├── dashboard                  ├── review-queue
├── queue                      ├── qa-inbox
│   └── [reviewId]             ├── review-history
├── mentorship                 ├── task-monitor
├── escalation                 ├── mentoring-log
├── history                    ├── my-metrics
├── profile                    └── notifications
└── settings
```

`ENTERPRISE_UX_AUDIT.md § 4.3, § 9` calls this out as a P1 IA failure. The redesigned IA converges into a single **Review Hub**, with role-mode (mentor vs reviewer) gating elevated capabilities (mentorship, escalation-resolve authority, team queue visibility).

### 1.2 The Sidebar Structure

```
┌─ REVIEW HUB ──────────────────────────────────┐
│                                                │
│  🏠  Today                                     │   ← landing surface
│                                                │
│  📥  Queue                            (14)     │   ← live count badge
│      ├─ My queue                        14     │
│      ├─ Team queue          [mentor]    37     │
│      ├─ Watch list                       4     │
│      └─ Snoozed                          2     │
│                                                │
│  ✅  Decisions                                 │
│      ├─ Recent                                 │
│      ├─ Reworks in flight                7     │
│      ├─ Disputed                         1     │
│      └─ Calibration                            │
│                                                │
│  🧭  Mentorship             [mentor]           │
│      ├─ Sessions today                   3     │
│      ├─ Active contributors              8     │
│      └─ Mentoring log                          │
│                                                │
│  🚨  Escalations                               │
│      ├─ Open                             5     │
│      ├─ Watching                         2     │
│      └─ History                                │
│                                                │
│  📬  Inbox                              (9)    │
│      ├─ Questions from contributors      4     │
│      ├─ Notifications                    5     │
│      └─ Mentions                         0     │
│                                                │
│  📊  Insights                                  │
│      ├─ My performance                         │
│      ├─ AI partnership                         │
│      ├─ Pool health        [mentor]            │
│      └─ Bottlenecks        [mentor]            │
│                                                │
│  ⚙️  Me                                        │
│      ├─ Profile                                │
│      ├─ Availability                           │
│      ├─ Preferences                            │
│      └─ Capacity & limits                      │
│                                                │
│  ─────────────────────────────                 │
│  👤  R. Verma · Mentor mode 🔁                 │   ← role toggle
│  ⌨️  Press ? for shortcuts                     │
└────────────────────────────────────────────────┘
```

### 1.3 Navigation Hierarchy

```
Level 0   Portal              Review Hub (one entry point)
Level 1   Section             Today · Queue · Decisions · Mentorship · Escalations · Inbox · Insights · Me
Level 2   Sub-view            My queue · Team queue · Watch list · etc.
Level 3   Filter/Group state  url-persisted query params (?segment=critical&group=skill)
Level 4   Item view           /queue/[reviewId] (the decision page)
Level 5   Side panes          Evidence drawer, AI rationale peek, audit panel, contributor context
```

**Rule:** the user must always know what level they're on. A breadcrumb crumbs *only* up to Level 2; Level 3–5 are part of the same workspace.

### 1.4 Queue Organization (logical → visual)

| Logical concept | Visual representation | Persistence |
|---|---|---|
| Segment (SLA tier) | Chip row at top | URL param |
| Group (skill / project / contributor / flat) | Toggle in queue header | Per-user pref |
| Filter (skill, project, type, etc.) | Filter row | URL param |
| Sort (priority / recency / SLA) | Sort dropdown | URL param |
| Saved view | Named view in sidebar | Per-user, named |

The queue is read like this: **Segment → Group → Filter → Sort → Items**. This left-to-right reading order matches the visual layout, so the reviewer's eye and the URL match.

### 1.5 Review Categorization

```
Reviews are categorized along five orthogonal axes:

  Axis                Values
  ───────────────────────────────────────────────────────────────
  Status              Pending · Claimed · In Review · Decided
  SLA tier            Healthy · Watch · Warning · Critical · Breached
  Review type         Initial · Rework · Final · Escalation review
  Risk class          Low · Medium · High · Fraud-flagged
  AI confidence       High (≥90%) · Medium (70-89%) · Low (<70%)
```

A queue item is described by a *tuple* across these five — and any axis can become a filter, group, or sort dimension. This is the core architectural choice that lets the queue scale from 14 items to 14,000.

### 1.6 Escalation Sections

```
Escalations
├─ Open
│   ├─ Raised by me            (mentor mode: raised by my pool)
│   ├─ Routed to me            (where I'm the resolver)
│   └─ Watching                (CC'd, no resolve authority)
├─ History
│   ├─ Resolved
│   ├─ Dismissed
│   └─ Escalated further
└─ Analytics       [mentor]
    ├─ By root cause
    ├─ By resolution SLA
    └─ By repeated-pattern
```

Each escalation is a **first-class object with its own lifecycle**, not a flag on a review item. This is the IA cure for *"escalations are toast-only"* from `ENTERPRISE_UX_AUDIT.md § 8.7`.

### 1.7 Audit / History Sections

The audit is **NOT** a separate top-level section. Per `ENTERPRISE_UX_AUDIT.md § 6.1`: *"Every entity with audit history needs a 'View audit' panel — collapsible, filterable, exportable. Lives inline, not as a separate page."*

So audit appears:

- **Inline panel** on every review detail page
- **Inline panel** on every escalation
- **Inline panel** on every mentorship session
- **Sliding drawer** from a "Decision audit" pill on history items
- **Filterable list** under `Decisions → Recent` for the reviewer's own work

There is no orphan `/audit` page in this IA.

### 1.8 AI Insights Sections

```
Insights
├─ My performance
│   ├─ Throughput (this week, this month, trailing 90d)
│   ├─ Decision distribution (accept / rework / reject)
│   ├─ SLA hit rate
│   ├─ Avg review time by complexity
│   └─ Calibration vs peer-mentor median
│
├─ AI partnership                      ← the explainability ledger
│   ├─ Agreement rate (you vs AI)
│   ├─ Confidence calibration (does AI's confidence predict your agreement?)
│   ├─ Override patterns (where you systematically disagree with AI)
│   ├─ Time saved by AI pre-fill (estimate)
│   └─ Risks caught: by AI / by you / by both
│
├─ Pool health             [mentor]
│   ├─ Reviewer capacity utilization
│   ├─ Queue depth trend
│   ├─ Cross-reviewer agreement (calibration drift)
│   └─ Reviewer-contributor pairing anomalies
│
└─ Bottlenecks             [mentor]
    ├─ Top root causes this period
    ├─ Stuck items (>SLA, no movement)
    ├─ Rework spirals (round ≥ 3)
    └─ Lead-time forecast vs target
```

---

## 2. Review Queue UX Architecture

### 2.1 Queue Prioritization Logic

The queue is sorted by a **composite priority score**:

```
priority = w₁·SLA_urgency                  (0..1, higher = more urgent)
         + w₂·rework_round                 (0..1, normalized: round/3)
         + w₃·enterprise_strategic_tier    (0..1, P0=1.0, P1=0.6, P2=0.3)
         + w₄·skill_match_strength         (0..1)
         + w₅·contributor_reliability_inv  (0..1, less reliable → higher review priority for fairness)
         - w₆·continuity_penalty           (0..1, dampen same-reviewer-twice unless flagged)
         + w₇·pinned_flag                  (∞)
```

**Transparency rule:** the top item shows a "Why is this first?" affordance that surfaces the dominant terms.

```
🔴  Refactor billing service          ← #1
    Why first?  SLA breach (8h ago, +0.95)  ·  P0 enterprise (+0.40)  ·  rework round 2/3 (+0.33)
```

### 2.2 SLA Risk Visibility (the five-tier system, applied to the queue)

```
SLA tier      Token color    Chip                 Queue placement     Notification     Audit weight
────────────────────────────────────────────────────────────────────────────────────────────────────
Healthy       forest         "8h left"            natural             none             low
Watch         teal           "6h left ●"          + 1 rank            none             low
Warning       amber          "3h left ▲"          top of queue        in-app           medium
Critical      crimson        "1h left ⚠"         top + sticky        in-app + push    high
Breached      crimson-flash  "OVERDUE 4h"         top, banner above   push + email     critical, auto-escalate
```

The queue header shows tier counts as **clickable chips** that filter:

```
[ 🔴 Breached 2 ]  [ ⚠ Critical 5 ]  [ ▲ Warning 8 ]  [ ● Normal 14 ]
```

Clicking a chip filters; chips themselves are part of the URL state.

### 2.3 Task Grouping

The queue supports four group modes (toggle, persisted per reviewer):

```
[ Group by: Flat | Project | Contributor | Skill ]
```

| Group mode | When useful | Visual treatment |
|---|---|---|
| **Flat** (default) | Default reviewing flow | Single list |
| **Project** | Reviewer is enterprise-aligned; project context matters | Collapsible project headers; project KPIs in header |
| **Contributor** | Same contributor's v1/v2/v3 across tasks; continuity | Collapsible contributor cards; reliability score + recent decisions |
| **Skill** | Batch calibration; same skill back-to-back | Collapsible skill headers; rubric template per skill |

Group state persists; switching groups never loses filter/sort state.

### 2.4 Filtering Systems

Three tiers of filter complexity (matching § 4.3 of the strategy doc):

**Tier 1 — Always visible (chip row):**

```
┌─ Tier 1 (always visible) ──────────────────────────────────────────────────┐
│ [ 🔴 Breached 2 ] [ ⚠ Critical 5 ] [ ▲ Warning 8 ] [ ● Normal 14 ]         │
│ [ Mine 14 ] [ Team 37 ] [ My pool 51 ]              ⌨ press / to focus     │
└────────────────────────────────────────────────────────────────────────────┘
```

**Tier 2 — One click (dropdown row):**

```
[ Skill ▾ ] [ Project ▾ ] [ Enterprise ▾ ] [ Type ▾ ] [ AI conf ▾ ] [ Round ▾ ] [ Sort ▾ ]
```

**Tier 3 — Power panel (collapsed by default):**

```
⚙ Power filters
├─ Continuity flag (same reviewer last round)
├─ Anomaly flag (reviewer-contributor pairing)
├─ Specific contributor (autocomplete)
├─ Date range (submitted between …)
├─ "Items I've snoozed"
├─ "Items with active question threads"
└─ Saved view: [ load / save / share ]
```

**Filter persistence:** every applied filter writes to URL. Reload preserves state. Sharing a URL shares a filter set.

### 2.5 Bulk Review Flows

Bulk actions are rare in review (each item is a unique decision) but the system supports four:

| Bulk action | When valid | Confirmation pattern |
|---|---|---|
| **Claim N items** | Up to reviewer's capacity limit | Inline confirm in chip row |
| **Snooze N items with reason** | Items waiting on contributor reply | Modal with reason taxonomy + auto-unsnooze date |
| **Release claim on N items** | Reviewer over capacity | Inline confirm |
| **Bulk escalate** (mentor mode) | Pool-level SLA crisis | Modal with target tier + root cause |

**Bulk Accept / Bulk Reject / Bulk Rework are explicitly NOT supported.** Each decision must be individual — bulk decisions are a governance failure mode.

### 2.6 Workload Balancing (mentor mode)

Mentor-only "rebalance" affordance in Team queue header:

```
┌─ Team queue ──────────────────────────────────────────────────────────────┐
│  37 items across 4 reviewers · Pool capacity 60                            │
│                                                                            │
│  Workload distribution                                                     │
│  R. Verma   ████████████░░░░  18/25                                        │
│  K. Singh   ███████░░░░░░░░░  11/25                                        │
│  L. Mehta   ██████████████▲▲  24/20  ← over capacity                       │
│  A. Iyer    ░░░░░░░░░░░░░░░░   -      (offline)                            │
│                                                                            │
│  ⚠ L. Mehta is over capacity by 4 items                                    │
│  Recommended rebalance: move 5 React items from L. Mehta → R. Verma        │
│  [ Preview ] [ Execute ]                                                   │
└────────────────────────────────────────────────────────────────────────────┘
```

Rebalance shows preview (which items would move, why) before executing. Each move is audited.

### 2.7 Review Fatigue Reduction

Six anti-fatigue patterns built into the queue UX:

| Pattern | Where applied |
|---|---|
| **Pace gauge** in queue header | Visual "you've decided 6/10 today" — encourages without shaming |
| **Smart varietal routing** | Routing engine tries to avoid 8 same-skill items in a row when capacity allows |
| **AI quick-confirm lane** | High-confidence items become 90-sec decisions |
| **Pomodoro break suggestion** | After 12 consecutive decisions in <2h, suggest 10-min break |
| **End-of-shift soft cap** | Last 2 hours of declared availability: warn before claiming new items |
| **"Save and come back"** | Drafts autosave; reviewer can step away from a 40-min-old rubric and resume |

---

## 3. Evidence Review Experience

### 3.1 Evidence Viewing Structure (the five-level hierarchy)

```
LEVEL 1  Always inline, zero click
         ─────────────────────────────────
         Summary card · Primary artifact preview · Evidence checklist · Rubric criteria

LEVEL 2  One click, in-pane drawer
         ─────────────────────────────────
         Individual artifact viewers (PDF, code diff, image) · Structured Q&A · External links peek

LEVEL 3  Hover / peek
         ─────────────────────────────────
         AI rationale on rubric · Plagiarism report · File integrity hash · Cited spec lines

LEVEL 4  Modal
         ─────────────────────────────────
         Rework genealogy (v1 vs v2 vs v3) · Audit log · Cross-reviewer comparison (calibration)

LEVEL 5  Separate route, drill
         ─────────────────────────────────
         Contributor full profile · Similar past submissions · Project upstream context
```

**Rule:** Reviewer never leaves the decision context to *see* evidence — only to *investigate*.

### 3.2 File Comparison UX

For rework rounds (v2 vs v1) and for disputed decisions:

```
┌─ Compare submissions ────────────────────────────────────────────────────────┐
│  v1 (May 12)              vs              v2 (May 22)                        │
│                                                                              │
│  artifact.zip · 2.1 MB                    artifact.zip · 2.4 MB              │
│  ───────────────────                      ───────────────────                │
│  src/components/Login.tsx                 src/components/Login.tsx           │
│   ▶ 124 lines                              ▶ 156 lines  (+32 lines)          │
│                                                                              │
│  Inline diff toggle: [ ◐ Unified ] [ Split ] [ Word-level ]                  │
│                                                                              │
│  + added focus trap for modal                                                │
│  + added aria-label to date picker                                           │
│  - removed unused state hook                                                 │
│                                                                              │
│  Reviewer's prior feedback (criterion 5):                                    │
│    "Missing keyboard navigation and screen reader labels"                    │
│    Status: ✓ Addressed in this version                                       │
│                                                                              │
│  AI re-analysis on v2:                                                       │
│    Criterion 5 score updated: 3 → 5 (high confidence)                        │
│    "Focus trap now properly implemented; aria-label added"                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key UX moves:**
- **Reviewer feedback re-displayed alongside diff** — closes the loop visually.
- **"Addressed" status per criterion** — contributor self-reported, reviewer-confirms.
- **AI re-analysis delta** — does the AI now agree this is fixed?

### 3.3 Rubric Scoring UX

The rubric is the central decision instrument. Layout for a single criterion:

```
┌─ Criterion 3 of 5  ·  Requirements Adherence ────────────────────────────────┐
│  Weight: 25%                                                                  │
│                                                                               │
│  Your score:                                                                  │
│     ★ ★ ★ ★ ★                                                                 │
│     1   2   3   4   5                                                         │
│     Below   Meets   Exceeds                                                   │
│                                                                               │
│  ▸ 🤖 AI suggests: ★★★☆☆  (3/5)        confidence: 71% medium                 │
│       "Covers 4 of 6 stated requirements. Missing: keyboard nav, SR labels."  │
│       Source: spec §4.2, requirement matrix lines 12–17                       │
│       Evidence reviewed: Storybook stories, component code                    │
│       Not reviewed: live demo, video walkthrough   ⚠ needs human              │
│                                                                               │
│       [ Accept (3) ]   [ Edit ]   [ Reject suggestion ]                       │
│                                                                               │
│  Your reasoning (contributor will see this):                                  │
│  ┌──────────────────────────────────────────────────────────────┐            │
│  │ Templates:  [ Missing req ▾ ] [ Quality concern ▾ ] [ Nit ▾ ] │            │
│  │                                                                │            │
│  │                                                                │            │
│  └──────────────────────────────────────────────────────────────┘            │
│                                                                               │
│  Internal note (only you see):                                                │
│  ┌──────────────────────────────────────────────────────────────┐            │
│  │                                                                │            │
│  └──────────────────────────────────────────────────────────────┘            │
│                                                                               │
│  Severity if rework: ( ) Blocker  ( ) Major  ( ) Nit                         │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Patterns enforced:**
- AI suggestion is a *visually distinct block* (subtle background, AI badge) — never confused with reviewer input.
- Three actions on AI suggestion: Accept, Edit (overrides), Reject (clears).
- Template chips populate the reasoning field with criterion-anchored starters.
- Severity tagging only appears if the score implies rework.

### 3.4 Contributor History Panels

A right-rail panel on every review detail page:

```
┌─ Contributor context  ─────────────────────────────────┐
│  c4821  ·  joined 7 mo ago                              │
│                                                         │
│  Verified skills (3)                                    │
│   React L3  ·  A11y L2  ·  Tailwind L2                  │
│                                                         │
│  Reliability score        87/100  (▲ 4 this quarter)    │
│  Acceptance rate (last 5) 80%                           │
│  Avg rework rounds         1.4                          │
│                                                         │
│  Recent decisions (5)                                   │
│   ✓ accept       Apr 30   Build accessible date picker  │
│   ✓ accept       Apr 22   Refactor sign-up flow         │
│   ↺ rework→✓    Apr 14   Auth modal (2 rounds)         │
│   ✓ accept       Apr  8   Newsletter subscription form  │
│   ✗ reject       Mar 30   Payment integration (scope)   │
│                                                         │
│  Anomaly flags                  none                    │
│  Mentor watch                   no                      │
│                                                         │
│  [ See full profile ]                                   │
└─────────────────────────────────────────────────────────┘
```

**Design intent:** the reviewer is not deciding in a vacuum. Pattern visibility for fairness, recency for context.

### 3.5 Previous Submission Versions

For any rework round > 1, a banner appears at the top of the detail page:

```
┌─ Rework round 2 of 3 ────────────────────────────────────────────────────────┐
│  This is v2 of this submission.                                              │
│  Round 3 will auto-escalate to mentor.                                       │
│                                                                              │
│  Previous rounds:                                                            │
│    v1 (May 12)  Rework requested by R. Verma · 2 blockers, 1 nit             │
│        See full feedback ↓                                                   │
│                                                                              │
│  Continuity flag: same reviewer (you) reviewed v1.                           │
│  Anti-rubber-stamp check: 4 of contributor's last 5 reviews were yours.      │
│  [ Release this item to fresh reviewer ]                                     │
│                                                                              │
│  [ Compare v1 vs v2 ]   [ Show prior rubric ]                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.6 AI-Assisted Evidence Analysis

Per `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 6.5` the AI must surface **source, confidence, coverage, override**. Applied to evidence analysis:

```
┌─ AI evidence summary ────────────────────────────────────────────────────────┐
│  🤖 Review Assistant v3.2  ·  generated 2026-05-23 14:08                     │
│                                                                              │
│  ✓ COVERED                                                                   │
│   ▸ Code quality            (95% conf)  Examined: src/, lib/, tests/         │
│   ▸ Requirements adherence  (71% conf)  Examined: spec §4.2, README          │
│   ▸ Testing                 (88% conf)  Examined: tests/, coverage report    │
│                                                                              │
│  ⚠ COVERAGE GAPS                                                             │
│   ▸ Accessibility           (54% conf)  Could not run interactive a11y tests │
│       → needs human review of live demo                                      │
│   ▸ Visual polish           N/A         No screenshots in evidence           │
│       → needs human review                                                   │
│                                                                              │
│  🚩 RISK FLAGS                                                                │
│   ▸ Plagiarism: 3 functions overlap with public repo X    [ view report ]    │
│   ▸ Submission timing: v2 submitted 4 min after v1 feedback (likely AI)      │
│                                                                              │
│  ⏱ Saved you approximately   28 minutes of evidence inspection                │
└──────────────────────────────────────────────────────────────────────────────┘
```

The reviewer can read this in <10 seconds and know exactly **what the AI did, what it couldn't do, what to verify, what to escalate**.

---

## 4. Decision Workflow UX

### 4.1 Visual Asymmetry Across Decision Types

The three primary decisions are **not equal in consequence** (`SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 5.3`: *"the UI must make this unambiguous"*). The visual treatment encodes that:

```
[  ✓  Accept  ]      ← primary, prominent, forest button
[  ↺  Request Rework  ]   ← secondary, amber-outlined
[  ✕  Reject  ]      ← tertiary, behind a dropdown / "more actions"

[ 🚨 Escalate ]      ← lateral, separate from decision triplet
```

Reject is intentionally one step removed from the primary button row. The reviewer must *intend* to reject; they cannot stumble into it.

### 4.2 Approve Flow (Accept)

```
Step 1 — Pre-confirmation state
   Rubric complete? All 5 criteria scored?           [yes] → enable Accept
   Contributor-visible feedback ≥ 20 chars?          [yes]
   "What worked" field required?                     N/A on Accept (positive default)
   Reviewer confidence declared?                     [pending]

Step 2 — Click Accept → Confirmation modal
   ┌────────────────────────────────────────────────┐
   │  Accept this submission                         │
   │  ────────────────────────────                   │
   │  Task: Build accessible date picker             │
   │  Contributor: c4821                              │
   │  Rubric average: 4.4/5                          │
   │  AI agreement: 88% (you agreed with 4 of 5)     │
   │                                                  │
   │  Your confidence:  ● High  ○ Medium  ○ Low      │
   │                                                  │
   │  Downstream impact:                              │
   │   ✓ Contributor receives $1,200                  │
   │   ✓ Credential progress: 3 of 4 toward L3        │
   │   ✓ Reviewer-Accepted status; awaiting           │
   │     enterprise final acceptance                  │
   │                                                  │
   │  This decision will be signed and audited.      │
   │  [ Cancel ]              [ Confirm Accept ]     │
   └─────────────────────────────────────────────────┘

Step 3 — Post-confirmation
   - Item moves to Decisions → Recent
   - Audit event written + signature hash
   - Contributor notified
   - Bundle rollup re-evaluated
   - Toast: "Accepted. Audit ID a3…e1." [ View audit ]
```

### 4.3 Reject Flow

Reject is the highest-consequence single decision. Multi-step intentionally.

```
Step 1 — From "More actions" dropdown → Reject
   Soft block: "Rejection is irreversible without dispute. Continue?"

Step 2 — Reject Composer (modal)
   ┌────────────────────────────────────────────────┐
   │  Reject submission                              │
   │  ────────────────────────────                   │
   │                                                  │
   │  Rejection reason (required):                   │
   │   ( ) Scope failure — submission doesn't        │
   │       address the task                          │
   │   ( ) Quality failure — execution below         │
   │       acceptable threshold                      │
   │   ( ) Evidence failure — required artifacts     │
   │       missing or unverifiable                   │
   │   ( ) Conduct failure — plagiarism, fraud,      │
   │       policy violation                          │
   │                                                  │
   │  Downstream route:                              │
   │   ( ) Reassign — task returns to pool           │
   │   ( ) Terminate task — no reassignment          │
   │                                                  │
   │  What worked (required, contributor sees):      │
   │  ┌──────────────────────────────────────────┐  │
   │  │                                            │  │
   │  └──────────────────────────────────────────┘  │
   │                                                  │
   │  Reasoning (required, contributor sees):        │
   │  ┌──────────────────────────────────────────┐  │
   │  │                                            │  │
   │  └──────────────────────────────────────────┘  │
   │                                                  │
   │  Internal note:                                 │
   │  ┌──────────────────────────────────────────┐  │
   │  │                                            │  │
   │  └──────────────────────────────────────────┘  │
   │                                                  │
   │  Your confidence:  ○ High  ○ Medium  ○ Low      │
   │                                                  │
   │  Downstream impact:                              │
   │   ✗ No payout for this submission                │
   │   ✗ Reputation impact: contributor -3, you +1    │
   │   ⚠ Contributor may dispute → routes to mentor   │
   │                                                  │
   │  [ Cancel ]              [ Confirm Reject ]     │
   └─────────────────────────────────────────────────┘

Step 3 — Reviewer confidence Low → second confirmation
   "You declared LOW confidence on a reject. Consider escalating instead."
   [ Escalate instead ]   [ Reject anyway ]
```

**"What worked" is required even on reject.** This is morale-preserving and bias-checking — if the reviewer cannot identify a single positive, the decision may be biased.

### 4.4 Rework Flow (the most-used path)

```
Step 1 — Click "Request Rework" → Rework Composer (anchored to rubric)
   ┌────────────────────────────────────────────────────────────────────┐
   │  Request rework                                                     │
   │  ──────────────────────                                             │
   │  Round: 2 of 3   ← auto-escalates at 3                              │
   │                                                                     │
   │  ANCHORED REWORK ITEMS (auto-populated from rubric criteria < 4)   │
   │                                                                     │
   │  ▸ Criterion 5 · Accessibility & UX  (your score: 2/5)              │
   │      Severity:  ● Blocker   ○ Major   ○ Nit                         │
   │      What's missing (contributor sees):                             │
   │       ┌──────────────────────────────────────────────────┐        │
   │       │ [ Missing requirement ▾ ] [ Suggested fix ▾ ]    │        │
   │       │                                                    │        │
   │       └──────────────────────────────────────────────────┘        │
   │      Internal note:                                                 │
   │       ┌──────────────────────────────────────────────────┐        │
   │       │                                                    │        │
   │       └──────────────────────────────────────────────────┘        │
   │                                                                     │
   │  ▸ Criterion 4 · Testing & Documentation  (your score: 3/5)         │
   │      Severity:  ○ Blocker   ● Major   ○ Nit                         │
   │      ...                                                            │
   │                                                                     │
   │  [ + Add criterion ]                                                │
   │                                                                     │
   │  ─────────────────                                                  │
   │  What worked (required, contributor sees):                          │
   │  ┌──────────────────────────────────────────────────────────────┐ │
   │  │                                                                │ │
   │  └──────────────────────────────────────────────────────────────┘ │
   │                                                                     │
   │  Rework deadline: [ 2026-05-26 (auto-suggested) ]                   │
   │                                                                     │
   │  Routing on resubmit:                                               │
   │   ( ) Same reviewer (continuity)                                    │
   │   (●) Fresh reviewer (anti-rubber-stamp)  — default after round 1   │
   │                                                                     │
   │  Your confidence:  ● High  ○ Medium  ○ Low                          │
   │                                                                     │
   │  [ Cancel ]    [ Save draft ]    [ Confirm rework ]                 │
   └─────────────────────────────────────────────────────────────────────┘
```

**Critical design moves:**
- Each rework item is anchored to a specific rubric criterion.
- Severity tagging gates contributor's resubmit (blockers must be addressed; nits are advisory).
- "What worked" is required.
- Default routing after round 1 is **fresh reviewer** (anti-rubber-stamp).
- Round counter is prominent — both reviewer and contributor see auto-escalation looming.

### 4.5 Escalation Flow

Lateral to the primary decision triplet:

```
"Escalate" affordance on detail page → Escalation Composer:

┌──────────────────────────────────────────────────────────────┐
│  Raise escalation                                             │
│                                                               │
│  Type (required):                                             │
│   ( ) SLA breach risk      ( ) Quality dispute                │
│   ( ) Spec ambiguity       ( ) Contributor conduct            │
│   ( ) Reassignment needed  ( ) Tooling/platform failure       │
│                                                               │
│  Root cause (required, drives analytics):                     │
│   ( ) Reviewer capacity         ( ) Quality threshold unclear │
│   ( ) Timeline infeasibility    ( ) Ambiguous specification   │
│   ( ) Contributor conduct       ( ) Tooling failure           │
│   ( ) Cross-team dependency     ( ) Policy gap                │
│                                                               │
│  Target tier (auto-selected by type, editable):               │
│   (●) Reviewer pool lead   ( ) Mentor                         │
│   ( ) Enterprise admin     ( ) Platform admin                 │
│                                                               │
│  Pause review while escalated?                                │
│   (●) Pause   ( ) Continue review in parallel                 │
│                                                               │
│  Resolution SLA (auto from tier):  24h                        │
│                                                               │
│  Description (≥ 20 chars, required):                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                        │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Frozen snapshot of review item attached.                     │
│                                                               │
│  [ Cancel ]                  [ Raise escalation ]             │
└───────────────────────────────────────────────────────────────┘
```

### 4.6 Partial Approval Flow (bundle level)

When a deliverable is a bundle of submissions:

```
Bundle: Onboarding flow redesign (4 submissions)

┌──────────────────────────────────────────────────────────────┐
│  Bundle decision                                              │
│  ───────────────                                              │
│                                                               │
│  Sub-submissions:                                             │
│   ✓ Sign-up form     — Accepted (R. Verma, May 20)            │
│   ✓ Welcome email    — Accepted (K. Singh, May 21)            │
│   ↺ Onboarding tour  — Rework in progress (v2 due May 26)     │
│   ⏳ Tooltip system   — Pending review (in K. Singh's queue)   │
│                                                               │
│  Bundle state: PARTIAL                                        │
│                                                               │
│  Options:                                                     │
│   ( ) Hold bundle — wait for all 4 to complete                │
│   ( ) Partial accept — release payment for the 2 accepted     │
│       (requires enterprise admin override)                    │
│   ( ) Renegotiate scope — move tour + tooltip out of bundle   │
│                                                               │
│  [ Cancel ]                  [ Continue ]                     │
└───────────────────────────────────────────────────────────────┘
```

### 4.7 Conditional Approval Flow

"Accept with condition" — a Phase 2 pattern for production-grade governance:

```
┌──────────────────────────────────────────────────────────────┐
│  Accept with condition                                        │
│                                                               │
│  Conditions (1 or more required):                             │
│   ☐ Contributor must submit follow-up artifact by [date]      │
│   ☐ Contributor must complete a learning module before        │
│     next assignment                                           │
│   ☐ Enterprise final acceptance gated on additional review    │
│   ☐ Custom: [free text]                                       │
│                                                               │
│  Payout schedule:                                             │
│   ( ) Full payout on accept                                   │
│   (●) Partial now (70%), remainder on condition fulfillment   │
│                                                               │
│  This is logged as ACCEPT_CONDITIONAL; conditions tracked     │
│  and auto-escalate if unmet.                                  │
│                                                               │
│  [ Cancel ]                  [ Confirm Accept (Conditional) ] │
└───────────────────────────────────────────────────────────────┘
```

### 4.8 Confirmation Patterns

Universal patterns applied across all decision types:

| Pattern | When applied |
|---|---|
| **Soft block** (warning, can continue) | Reject from primary action; Low-confidence accept |
| **Hard block** (cannot continue) | Incomplete rubric on Accept; missing required field |
| **Two-step confirm** | All terminal decisions (Accept, Rework, Reject) |
| **Three-step confirm** | Reject when reviewer confidence = Low |
| **Cascade preview** | Show downstream impact (payout, reputation, escalation triggers) |
| **Irreversibility notice** | "This decision will be signed and audited" on every confirm |
| **Cancel safety** | Cancel always returns to draft state; never loses rubric input |

### 4.9 Warnings

Six warning categories, with consistent treatment:

| Warning | Visual | Trigger | Action |
|---|---|---|---|
| **SLA breach imminent** | Amber banner | < 25% time left | Push notification on click-away |
| **Continuity / rubber-stamp risk** | Indigo banner | Same reviewer + ≥4 of last 5 | Suggest release |
| **Low AI confidence** | Crimson banner | AI conf < 70% | Block quick-confirm |
| **Risk flag from AI** | Crimson banner | Plagiarism / fraud / timing anomaly | Force review of risk report |
| **Reviewer confidence Low** | Soft amber | Reviewer self-declares Low | Suggest escalation |
| **Rework round nearing escalation** | Indigo banner | Round 2 of 3 | Show "round 3 auto-escalates" |

### 4.10 Policy Indicators

Compliance and policy gates visible on the decision surface:

```
┌─ Policy gates ─────────────────────────────────────────────────────┐
│  ✓  SOW approval chain complete (all 5 stages signed)               │
│  ✓  Contributor has accepted task terms                             │
│  ✓  Evidence pack 100% complete                                     │
│  ✓  Plagiarism check passed (94% original)                          │
│  ⚠  Data sensitivity: High — extra verification required            │
│  ⚠  Regional compliance: GDPR + India PDPB applicable               │
│                                                                     │
│  [ See compliance details ]                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.11 Confidence Indicators (everywhere they appear)

Consistent visual treatment for *both* AI confidence and reviewer confidence:

```
HIGH        ●  forest        solid badge
MEDIUM      ◐  amber         outlined badge
LOW         ○  crimson       outlined + warning banner above

AI confidence:        [ 🤖 71% medium ]
Reviewer confidence:  [ 👤 You declared: High ]
Combined view:        [ AI 71% medium · You High ]   ← surfaces disagreement
```

---

## 5. Mentor Dashboard Architecture

### 5.1 KPI Hierarchy (Today landing page)

The dashboard has **four tiers of information**, ordered by urgency:

```
TIER 1   Crises             — what needs you in the next hour
TIER 2   Throughput         — am I on pace?
TIER 3   Quality            — am I deciding well?
TIER 4   Partnership        — is AI helping?

         ─────────  (collapsed below the fold by default)  ─────────

TIER 5   Reviewer pool      — mentor mode only
TIER 6   Bottlenecks        — mentor mode only
TIER 7   Watching           — passive monitoring
```

### 5.2 Workload Visibility (mentor mode)

```
┌─ Reviewer pool workload ────────────────────────────────────────────────────┐
│  Pool capacity: 60 · Current load: 53 (88%)                                  │
│                                                                              │
│  Per-reviewer capacity:                                                      │
│   R. Verma   ████████████░░░░  18/25  •  ●●● online                          │
│   K. Singh   ███████░░░░░░░░░  11/25  •  ●●● online                          │
│   L. Mehta   ██████████████▲▲  24/20  •  ●●○ near cap                        │
│   A. Iyer    ░░░░░░░░░░░░░░░░   0/25  •  ⚫⚫⚫ offline (PTO until May 25)    │
│                                                                              │
│   Pool SLA hit (24h):  91%   ▼ 3% from yesterday                             │
│   Avg decision time:   1.9h  ▲ 0.2h from yesterday                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 SLA Breach Alerts

```
┌─ ⚠ Active SLA risks  ────────────────────────────────────────────────────────┐
│                                                                              │
│  🔴 BREACHED (2)                                                              │
│    ▸ Refactor billing service    · 8h overdue · auto-escalating in 1h        │
│    ▸ Migrate auth provider       · 3h overdue · auto-escalating in 6h        │
│                                                                              │
│  ⚠ CRITICAL (3)                                                               │
│    ▸ Build accessible date picker  · 2h left  · K. Singh's queue             │
│    ▸ Refactor analytics service    · 1h left  · L. Mehta's queue             │
│    ▸ Onboarding tooltip system     · 3h left  · R. Verma's queue             │
│                                                                              │
│  ▲ WARNING (8)                                                                │
│    [ Expand ]                                                                 │
│                                                                              │
│  [ View full SLA risk dashboard ]                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Bottleneck Indicators

```
┌─ Bottleneck spotlight  ──────────────────────────────────────────────────────┐
│                                                                              │
│  Top 3 bottleneck causes this week:                                          │
│   1. Spec ambiguity         14 items (28%)  ▲ 5 from last week               │
│   2. Reviewer capacity       9 items (18%)  ▲ 3 from last week               │
│   3. Contributor evidence    7 items (14%)  ▼ 2 from last week               │
│                                                                              │
│  Forecast: at current pace, pool will exceed capacity by Tue                 │
│                                                                              │
│  Recommended actions:                                                        │
│   ▸ Add 1 reviewer (you have 2 available in reserve pool)                    │
│   ▸ Pause new task ingestion from Project Acme-Helios for 24h                │
│   ▸ Address spec ambiguity pattern with enterprise admin                     │
│                                                                              │
│  [ See full bottleneck analysis ]                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Pending Review Visibility (reviewer mode)

```
┌─ My queue at a glance  ──────────────────────────────────────────────────────┐
│                                                                              │
│  14 items pending · 5 SLA at-risk · 3 reworks in flight                      │
│                                                                              │
│  Today's pace                                                                │
│   Decided 6/10 ▰▰▰▰▰▰░░░░ 60%                                                │
│   On track to hit target by 5:30 PM                                          │
│                                                                              │
│  Next 3 items (top priority):                                                │
│   1. 🔴 Refactor billing service    ·  8h overdue                            │
│   2. ⚠ Build accessible date picker · 2h left · AI conf 94% (quick-confirm)  │
│   3. ⚠ Refactor auth modal           · 3h left · rework round 2/3            │
│                                                                              │
│  [ Open queue ]   [ Quick-confirm lane (3 items ready) ]                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Contributor Quality Insights

```
┌─ Contributors I'm mentoring (8)  ────────────────────────────────────────────┐
│                                                                              │
│  c4821  Acceptance 80% · Reliability 87 · Learning velocity 72%              │
│         Active concerns: keyboard nav (3 rework cycles)                      │
│         Next session: today 4 PM                                             │
│                                                                              │
│  c5102  Acceptance 65% · Reliability 71 · Learning velocity 58%              │
│         Active concerns: test coverage, scope drift                          │
│         ⚠ 2 rejections in last 3 reviews — needs check-in                    │
│                                                                              │
│  [ See all 8 ]                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Operational Health Panels

```
┌─ Operational health  ────────────────────────────────────────────────────────┐
│                                                                              │
│  Today                       This week              Trailing 30d             │
│   Decisions   6              94                     412                      │
│   Reworks     3              28                     112                      │
│   Escalations 1              4                      11                       │
│   Disputes   0              1                      3                         │
│                                                                              │
│  AI partnership                                                              │
│   Agreement   73%           71%                     75%                      │
│   Override    27%           29%                     25%                      │
│   Conf calib  88%           86%                     87%                      │
│                                                                              │
│  Pool                                                                        │
│   SLA hit    91%            89%                     92%                      │
│   Capacity   88%            81%                     76%                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. AI Explainability UX Layer

### 6.1 Reasoning Summaries

Three reasoning surfaces, in escalating detail:

**Surface 1 — Inline glance (always visible):**

```
🤖 ★★★☆☆ (3/5) · 71% medium · "missing keyboard nav, screen reader labels"
```

**Surface 2 — Peek (hover or click "Why?"):**

```
Why ★★★☆☆?
 ✓ Requirement 1 (auth flow)         satisfied
 ✓ Requirement 2 (input validation)  satisfied
 ✓ Requirement 3 (error handling)    satisfied
 ✓ Requirement 4 (responsive)        satisfied
 ✗ Requirement 5 (keyboard nav)      missing — no focus trap
 ✗ Requirement 6 (screen reader)     missing — no aria-label on date picker
Source: spec §4.2, requirement matrix lines 12–17
Evidence: Storybook stories, component code
Not reviewed: live demo, video walkthrough
```

**Surface 3 — Full report (modal):**

```
Full AI rationale
─────────────────
Model:      review-assistant-v3.2
Prompt:     v17 (2026-04-30)
Generated:  2026-05-23 14:08 UTC
Token cost: 4,210 / 8,192 (51%)

Inputs analyzed:
 ▸ Task spec (4,800 tokens)
 ▸ Submission code (3,200 tokens of src/)
 ▸ Test files (1,800 tokens)
 ▸ Storybook stories (900 tokens)
 ▸ Evidence checklist (220 tokens)

Per-criterion breakdown:
 [ full detail with citations, lines, snippets ]

Confidence calibration: based on similar past submissions, AI is 88%
calibrated when it says "medium" — i.e., 88% of past medium-conf
suggestions were within ±1 star of human's final rating.

Risk flags raised:
 ▸ Plagiarism: 3 functions overlap with public-repo X
 ▸ Submission timing anomaly: v2 submitted 4 min after v1 feedback

Override history:
 ▸ R. Verma overrode 1 of 5 criteria (criterion 3: 3 → 5, +2)
```

### 6.2 AI Confidence Indicators (canonical visual system)

```
HIGH      ≥90%     ●  forest      [ 🤖 94% high   ]     Quick-confirm available
MEDIUM    70–89%   ◐  amber       [ 🤖 71% medium ]     Full review required
LOW       <70%     ○  crimson     [ 🤖 54% low    ]     Warning banner; cannot quick-confirm
```

**Consistency rule:** the same visual treatment is used wherever AI confidence appears — rubric criteria, queue rows, bundle rollups, dashboard summaries. No exceptions.

### 6.3 Recommendation Explanations (the four primitives)

Every AI recommendation, anywhere in the system, must expose:

| Primitive | UI affordance | Required |
|---|---|---|
| **Source** | "Source: …" line + clickable to peek the cited evidence | Always |
| **Confidence** | Numeric + bucket + color | Always |
| **Coverage gap** | "Not reviewed:" line, what AI couldn't assess | Always |
| **Override** | One-click Accept / Edit / Reject suggestion | Always |

These are the explainability invariants. Any AI surface that omits one fails review.

### 6.4 Override Controls

```
[ Accept suggestion ]   ← one-click; logs "AI:3, Reviewer:3"
[ Edit ]                ← reviewer adjusts; logs "AI:3, Reviewer:5, delta +2"
[ Reject suggestion ]   ← clears AI input; logs "AI:3, Reviewer rejected, Reviewer:5"
```

Every override writes an audit event with:
```
{
  ai_suggestion: 3,
  reviewer_decision: 5,
  delta: +2,
  reviewer_reasoning_optional: "spec §4.3 added requirement post-AI cutoff",
  model_version, prompt_version, timestamp
}
```

### 6.5 Traceability Visibility

A "Trace" tab on every review detail page:

```
┌─ AI/Human decision trace  ───────────────────────────────────────────────────┐
│                                                                              │
│  Criterion           AI sug    Reviewer    Delta    Override reason          │
│  ─────────────────────────────────────────────────────────────────────────── │
│  Code Quality        4         4           0        accepted                 │
│  Completeness        4         5           +1       "exceeds doc standard"  │
│  Requirements        3         5           +2       "spec post-cutoff"      │
│  Testing             4         4           0        accepted                 │
│  Accessibility       2         2           0        accepted                 │
│                                                                              │
│  Aggregate: AI 3.4 avg · Reviewer 4.0 avg · Delta +0.6                       │
│  This is within R. Verma's typical override pattern (+0.5 avg, last 90d).    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 6.6 AI Trust Indicators

The reviewer's own AI partnership ledger (under Insights → AI partnership):

```
┌─ Your AI partnership  ───────────────────────────────────────────────────────┐
│                                                                              │
│  This quarter                                                                │
│   Decisions AI pre-filled         287                                        │
│   You accepted AI suggestion      210 (73%)                                  │
│   You edited AI suggestion         63 (22%)                                  │
│   You rejected AI suggestion       14 (5%)                                   │
│                                                                              │
│  AI confidence calibration                                                   │
│   When AI says HIGH    (≥90%)     you agree 91% of the time                  │
│   When AI says MEDIUM  (70-89%)   you agree 68% of the time                  │
│   When AI says LOW     (<70%)     you agree 41% of the time                  │
│                                                                              │
│   Verdict: AI confidence is well-calibrated for HIGH; less so for MEDIUM.    │
│                                                                              │
│  Where you systematically disagree                                           │
│   ▸ Criterion 5 (Accessibility) on React work: you're +1.2 above AI          │
│   ▸ Criterion 3 (Requirements) on rework v2+: you're -0.4 below AI           │
│                                                                              │
│  Time saved by AI pre-fill (estimated): ~14 hours / week                     │
│  Risks caught: by AI 18 · by you 9 · by both 4                               │
│                                                                              │
│  [ See decision log ]                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

This panel turns AI from a black box into a colleague whose performance is *measurable, auditable, and improvable*.

---

## 7. Governance & Audit UX

### 7.1 Audit Visibility (inline on every entity)

```
┌─ Decision audit  ────────────────────────────────────────────────[ expand ▾ ]┐
│                                                                              │
│  2026-05-23 14:08  AI Review Assistant v3.2 generated rubric proposal        │
│                    Confidence: 71% medium · 4 of 5 criteria pre-filled       │
│                                                                              │
│  2026-05-23 14:21  R. Verma claimed item (presence lock acquired)            │
│                                                                              │
│  2026-05-23 14:23  R. Verma overrode criterion 3 (AI:3 → R:5, +2)            │
│                                                                              │
│  2026-05-23 14:24  R. Verma added 2 criterion-anchored feedback items        │
│                                                                              │
│  2026-05-23 14:25  R. Verma confirmed: Request Rework (round 2 of 3)         │
│                                                                              │
│  2026-05-23 14:25  Decision signed · hash 0xa3…e1 · ledger seq 4,892,103     │
│                                                                              │
│  2026-05-23 14:25  Contributor c4821 notified (push + email)                 │
│                                                                              │
│  2026-05-23 14:25  Reputation engine: contributor Δ -2, reviewer Δ +1        │
│                                                                              │
│  [ Export audit ]   [ Verify signature ]                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Action Traceability (per-actor, per-entity, per-decision)

A "Traceability" view that pivots between three axes:

```
[ By actor ▾ ]   R. Verma · 2026-05-23
                  ───────────────────────
                  14:21  claimed item r-4821
                  14:25  decided rework on r-4821
                  14:31  claimed item r-4822
                  14:55  decided accept on r-4822 (AI agreement)
                  ...

[ By entity ▾ ]  Review item r-4821
                  ───────────────────────
                  May 22 18:04  contributor submitted v2
                  May 22 18:05  AI Review Assistant generated proposal
                  May 23 14:21  R. Verma claimed
                  May 23 14:25  R. Verma decided rework (round 2)
                  ...

[ By decision ▾ ] Rework decision a3e1
                  ───────────────────────
                  inputs:    rubric (5 criteria), feedback (2 items), confidence: high
                  outputs:   workroom reopened, contributor notified, version 3 anticipated
                  artifacts: signed payload, audit event 4,892,103
```

### 7.3 Approval History

Per-entity timeline view:

```
┌─ Approval history for deliverable d-882  ────────────────────────────────────┐
│                                                                              │
│  v1   submitted  May 12 → rework requested May 13 (R. Verma)                 │
│  v2   submitted  May 22 → accepted May 23 (R. Verma) [you are here]          │
│                                                                              │
│  Bundle rollup                                                               │
│   Sub-1 (sign-up form)    ✓ accepted May 20 (R. Verma)                       │
│   Sub-2 (welcome email)   ✓ accepted May 21 (K. Singh)                       │
│   Sub-3 (onboarding tour) ↺ rework v2 due May 26                             │
│   Sub-4 (tooltip system)  ⏳ pending (K. Singh's queue)                      │
│                                                                              │
│  Enterprise final acceptance: PENDING (awaiting bundle completion)           │
│                                                                              │
│  [ See full evidence pack ]   [ Export for audit ]                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Evidence Verification

Each artifact carries an integrity card:

```
┌─ artifact.zip  ─────────────────────────────────────────────────────────────┐
│  Size:       2.4 MB                                                          │
│  Uploaded:   2026-05-22 18:04                                                │
│  SHA-256:    7a9c…b2d1  ✓ matches contributor's submission record            │
│  Virus scan: clean                                                           │
│  Plagiarism: 94% original (3 functions overlap — see report)                 │
│  Signed URL: expires in 58 min                                               │
│                                                                              │
│  [ Download ]  [ Preview inline ]  [ Hash report ]  [ Plagiarism details ]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Fraud / Risk Indicators (inline, never as a separate page)

| Flag | Surfaced on | Visual | Reviewer obligation |
|---|---|---|---|
| **Plagiarism match** | Artifact card + queue row badge | Crimson "94% original" pill | Open report; decide fair-use or violation |
| **Submission timing anomaly** | Contributor context | Amber clock icon | Note in internal field; consider re-review |
| **Reviewer-contributor pairing anomaly** | Banner on detail page | Indigo banner | Consider releasing to fresh reviewer |
| **Reviewer cadence anomaly** | Reviewer's own dashboard | Amber chip | Self-check prompt |
| **File hash mismatch** | Artifact card | Crimson "integrity failed" | Block decision until resolved |
| **AI low-confidence + high-risk class** | Detail page banner | Crimson banner | Cannot quick-confirm; full review required |

### 7.6 Compliance Visibility

```
┌─ Compliance gates  ──────────────────────────────────────────────────────────┐
│                                                                              │
│  ✓ SOW approval chain complete                                               │
│     ├ Business signed       Apr 12 (E. Patel, Acme)                         │
│     ├ Glimmora commercial   Apr 13 (S. Rao, Glimmora)                       │
│     ├ Legal                 Apr 15 (J. Khan, Acme legal)                    │
│     ├ Security              Apr 16 (M. Doe, Acme security)                  │
│     └ Final                 Apr 17 (R. Krishnan, Acme CFO)                  │
│                                                                              │
│  ✓ Contributor terms accepted (May 8)                                        │
│  ✓ Data sensitivity classification: Medium                                   │
│  ✓ Regional compliance: GDPR, India PDPB                                     │
│  ⚠ Audit log retention: 7y (legal hold not active)                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. State System Architecture

### 8.1 Canonical State Inventory

| State | Visual priority | Color token | Operational meaning | Required actions | Transition logic |
|---|---|---|---|---|---|
| **Pending** | low | slate | In queue, unclaimed | Reviewer claims | → Claimed (on claim) |
| **Claimed** | medium | indigo | Locked by a specific reviewer | Reviewer opens, drafts | → In Review (on open); → Pending (lock timeout) |
| **In Review** | medium | indigo | Reviewer actively drafting | Rubric, feedback, confidence | → Decision Pending (click decision); → Claimed (release); autosave |
| **Decision Pending** | high | amber | Confirmation modal open | Confirm or cancel | → Decided branches; → In Review (cancel) |
| **Accepted** | low (terminal) | forest | Reviewer-accepted; awaits enterprise final | Awaiting bundle / enterprise | → Bundle Ready (last in bundle); → Enterprise Final Accepted |
| **Rejected** | high | crimson | Reviewer-rejected | Reassignment or dispute | → Pending (reassign); → Disputed (contributor disputes) |
| **Rework Requested** | medium | amber | Contributor workroom reopened | Contributor resubmits v++ | → Pending (on resubmit); → Escalated Rework (round 3) |
| **Escalated** | high | crimson | Escalation in resolution | Resolver acts | → return-to-flow on resolve; → Escalated Further |
| **Blocked** | critical | crimson | Cannot progress (integrity, evidence, dependency) | Block reason holder acts | → Pending (on resolve) |
| **SLA Risk** | overlay | amber/crimson | Cross-cutting tier (Watch/Warning/Critical/Breached) | Tier-dependent | parallel to primary state |
| **Governance Hold** | critical | crimson | Legal/compliance halted | Compliance officer | → Pending (on release) |
| **Partially Approved** | medium (bundle-level) | amber | Bundle has mixed states | Bundle decision | → Bundle Ready or Partial Release |
| **Disputed** | high | crimson | Confirmed decision under challenge | Mentor/admin reviews | → Upheld (rejected_final) or → Overridden (new decision) |

### 8.2 Visual Priority System

Priority is encoded across three channels — the reviewer reads state in <250 ms:

```
Channel 1 — Color    : forest / amber / crimson / slate / indigo
Channel 2 — Shape    : dot / chip / banner / overlay
Channel 3 — Motion   : static / pulse / flash
```

Critical states use **multiple channels at once** (color + shape + motion) — they cannot be missed.

### 8.3 State Combinations (the real world is multi-dimensional)

A real queue item is described by a tuple:

```
{ primary_state, sla_tier, ai_confidence, risk_class, review_type, round }

Example:
  primary = In Review
  sla_tier = Warning
  ai_confidence = Medium
  risk_class = Low
  review_type = Rework
  round = 2
```

The visual treatment composes:
- Primary state sets the base chip
- SLA tier overlays a urgency indicator
- Risk class adds a flag badge
- Review type adds a round counter
- AI confidence adds a 🤖 chip

Reading a queue row is a multi-dimensional glance, but the composition is consistent across the whole system.

### 8.4 Transition Logic (the canonical state machine)

```
                           [PENDING]
                              │
                  claim ──────┴────── timeout
                    │                   ↑
                    ▼                   │
                [CLAIMED] ───── release ┘
                    │
                  open
                    ▼
               [IN REVIEW]  ←──┐
                    │            │ cancel
                  decide         │
                    ▼            │
            [DECISION PENDING] ──┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   [ACCEPTED]  [REWORK]    [REJECTED]
        │           │           │
        ▼           ▼           ▼
   bundle    workroom     reassign /
   rollup    reopens      dispute
                  │           │
                  ▼           ▼
              [PENDING    [DISPUTED]
              new v]
                              │
                       ┌──────┼──────┐
                       ▼      ▼      ▼
                   upheld   over   escalated
                   = REJ    -ride  further
                   _FINAL   = new
                            decision

Overlays (parallel to primary state):
   [SLA RISK]  watches any non-terminal state
   [BLOCKED]   suspends any non-terminal state
   [GOV HOLD]  suspends any non-terminal state
   [ESCALATED] either pauses or runs parallel
```

### 8.5 Edge-Case State Handling

| Edge case | State handling |
|---|---|
| Reviewer tab close mid-rubric | autosave; on reopen restore at In Review with draft |
| Lock timeout while reviewer afk | release to Pending; previous draft preserved as personal draft |
| Race-to-claim | first-write-wins at API; loser sees "claimed by X 12s ago" |
| Contributor resubmits during reviewer's session | banner on reviewer's session; current rubric becomes draft on v-1; new v opens fresh |
| AI suggestion arrives after open | banner offering merge; reviewer's draft never auto-overwritten |
| Rubric incomplete on Accept | Decision Pending blocks; lists missing criteria |
| Reject without taxonomy | Decision Pending blocks; reason required |
| Escalation raised mid-review | session pauses; presence lock released; frozen snapshot to mentor |
| Reviewer over concurrent cap | new claims blocked; "release one to claim more" |
| AI confidence Low + reviewer one-clicks Accept | soft block + extra confirm |
| Decision confirmed but signature fails | item moves to *Decision Pending Sign* — admin alerted, decision not finalized |

---

## 9. Wireframe Planning

### 9.1 Page-Level Wireframe Inventory

| # | Page | Path | Wireframe type |
|---|---|---|---|
| 1 | Today (Dashboard) | `/review-hub` | Tiered modules |
| 2 | Queue list | `/review-hub/queue` | Segment + filter + table |
| 3 | Review detail | `/review-hub/queue/[reviewId]` | 3-pane decision workspace |
| 4 | Decisions / Recent | `/review-hub/decisions` | Filterable history |
| 5 | Calibration | `/review-hub/decisions/calibration` | Peer-comparison grid |
| 6 | Mentorship sessions | `/review-hub/mentorship/sessions` | Calendar + table |
| 7 | Escalations list | `/review-hub/escalations` | Segment + table + SLA |
| 8 | Escalation detail | `/review-hub/escalations/[id]` | 2-pane resolver workspace |
| 9 | Insights / AI partnership | `/review-hub/insights/ai-partnership` | Analytic dashboard |
| 10 | Insights / Pool health | `/review-hub/insights/pool-health` | Mentor analytics |
| 11 | Profile / Availability | `/review-hub/me/availability` | Form + capacity |

### 9.2 Page 1 — Today

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]   Today, Sat May 23                                                │
│             ──────────────────────────────────────────────────────────────── │
│                                                                              │
│             ⚠ NEEDS YOU NOW                                  ▰▰▰▰ TIER 1     │
│             ┌──────────────────────────────────────────────────────┐         │
│             │ 2 SLA breached · 1 escalation overdue · 1 round-3    │         │
│             │ [ Go to queue ] [ Resolve escalations ]              │         │
│             └──────────────────────────────────────────────────────┘         │
│                                                                              │
│             ─── My queue at a glance ───                     ▰▰▰▰ TIER 2     │
│             14 pending · pace 6/10 · target 5:30 PM                          │
│             [ Open queue ]   [ Quick-confirm lane (3 ready) ]                │
│                                                                              │
│             ─── KPI strip ───                                ▰▰▰▰ TIER 2-3   │
│             ┌────────────┐ ┌────────────┐ ┌────────────┐                     │
│             │ Throughput │ │ Quality    │ │ AI partner │                     │
│             │ 18 / 25    │ │ accept 81% │ │ agree 73%  │                     │
│             │ SLA 94%    │ │ rework 16% │ │ override 27│                     │
│             └────────────┘ └────────────┘ └────────────┘                     │
│                                                                              │
│             ─── Bottleneck spotlight [mentor] ───            ▰▰▰▰ TIER 5-6   │
│             [ Forecast and recommendations panel ]                           │
│                                                                              │
│             ─── Mentorship today (3) ───                     ▰▰▰▰ TIER 7     │
│             ─── Watching (4) ───                             ▰▰▰▰ TIER 7     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Layout hierarchy:** crises → my queue at a glance → KPI strip → bottleneck → mentorship/watching. Top-down attention gradient.

### 9.3 Page 2 — Queue List

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]   ┌────────────────────────────────────────────────────────────┐   │
│             │ MY QUEUE (14)        Avg age 8h  At-risk 5  Decided 6      │   │
│             │ Pace ▰▰▰▰▰▰▱▱▱▱  60% of target                              │   │
│             └────────────────────────────────────────────────────────────┘   │
│                                                                              │
│             [ 🔴 Breached 2 ] [ ⚠ Critical 5 ] [ ▲ Warn 8 ] [ ● Normal 14 ]  │
│             [ Mine ] [ Team ] [ My pool ]                  / focus           │
│                                                                              │
│             [Skill▾] [Project▾] [Enterprise▾] [Type▾] [AI conf▾] [Sort▾]    │
│             [ Group: Flat | Project | Contributor | Skill ]                 │
│                                                                              │
│             ┌──────────────────────────────────────────────────────────┐    │
│             │ 🔴 OVERDUE    Refactor billing service · Node/Stripe     │    │
│             │   c1142 · v2 · Acme P0 · AI conf 78% medium · round 2/3  │    │
│             │   ⚠ auto-escalating in 1h · last reviewer: you           │    │
│             │   Why first? SLA -8h · P0 · round 2/3                    │    │
│             ├──────────────────────────────────────────────────────────┤    │
│             │ ⚠ 2h LEFT     Build accessible date picker · React/A11y │    │
│             │   c4821 · v2 · Acme P0 · AI conf 94% high · ✓ AI ready  │    │
│             │   [ Quick-confirm ]  [ Open full ]                       │    │
│             ├──────────────────────────────────────────────────────────┤    │
│             │ ▲ 6h LEFT     ...                                        │    │
│             └──────────────────────────────────────────────────────────┘    │
│                                                                              │
│             ⌨ / focus · J/K nav · Enter open · A claim · ? help              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.4 Page 3 — Review Detail (3-pane decision workspace)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]                                                                    │
│                                                                              │
│ ┌─── Header strip ────────────────────────────────────────────────────────┐ │
│ │  Build accessible date picker  ·  v2  ·  Rework round 2 of 3            │ │
│ │  ⚠ Warning: 2h left SLA  ·  AI 94% high  ·  c4821  ·  Acme · P0         │ │
│ │  [ Release ] [ Escalate ] [ More ▾ ]                                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─ PANE A (left, 50%) ──┐ ┌─ PANE B (center, 30%) ─┐ ┌─ PANE C (right, 20%)┐│
│ │ Submission            │ │ Decision instrument    │ │ Context              ││
│ │ ─────────────         │ │ ─────────────          │ │ ─────────            ││
│ │                       │ │ Rubric (5 criteria)    │ │ Contributor          ││
│ │ Task description      │ │  ▸ Criterion 1   ★★★★☆  │ │  c4821 · L3 React   ││
│ │  + skills tags        │ │  ▸ Criterion 2   ★★★★★  │ │  Reliability 87     ││
│ │                       │ │  ▸ Criterion 3   🤖→5    │ │  Recent: 5 reviews  ││
│ │ Artifacts             │ │  ▸ Criterion 4   ★★★★☆  │ │                     ││
│ │  artifact.zip ✓        │ │  ▸ Criterion 5   ★★☆☆☆  │ │ AI evidence summary ││
│ │  spec.pdf ✓            │ │                        │ │  ✓ covered           ││
│ │  notes.pdf ✓           │ │ Feedback (template)    │ │  ⚠ gaps              ││
│ │                       │ │ ┌────────────────────┐ │ │  🚩 risk: plagiarism ││
│ │ External links        │ │ │                    │ │ │                     ││
│ │  Storybook · GitHub   │ │ └────────────────────┘ │ │ Compliance gates    ││
│ │                       │ │                        │ │  ✓ SOW chain        ││
│ │ Structured Q&A        │ │ Internal note          │ │  ⚠ data sensitivity ││
│ │  Q1, Q2, Q3           │ │ ┌────────────────────┐ │ │                     ││
│ │                       │ │ │                    │ │ │ Audit (collapsed)   ││
│ │ Evidence checklist    │ │ └────────────────────┘ │ │  [ expand ]         ││
│ │  7/8 complete         │ │                        │ │                     ││
│ │                       │ │ Your confidence        │ │                     ││
│ │ Rework genealogy      │ │  ● High ○ Med ○ Low    │ │                     ││
│ │  v1 → v2 diff         │ │                        │ │                     ││
│ │                       │ │ ┌──────────────────┐   │ │                     ││
│ │                       │ │ │ ✓ Accept         │   │ │                     ││
│ │                       │ │ │ ↺ Rework         │   │ │                     ││
│ │                       │ │ │ ▾ More           │   │ │                     ││
│ │                       │ │ └──────────────────┘   │ │                     ││
│ └───────────────────────┘ └────────────────────────┘ └─────────────────────┘│
│                                                                              │
│ ⌨ shortcuts: A accept · R rework · X reject · E escalate · Cmd+Enter confirm │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Layout hierarchy (left→right):** what the contributor submitted → how you decide → why and on whom.

**Information priority (top→bottom in each pane):**
- Pane A: task → artifacts → links → Q&A → checklist → genealogy (depth)
- Pane B: rubric → feedback → confidence → decision (the funnel)
- Pane C: contributor → AI → compliance → audit (context layers)

**Action hierarchy:** primary action (Accept) is large, forest, in the center pane. Reject hidden under "More". Escalate lives in the header (lateral to decision).

### 9.5 Page 7 — Escalations List

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]   ESCALATIONS                                                      │
│                                                                              │
│             [ Open 5 ] [ Watching 2 ] [ History ]                            │
│                                                                              │
│             [ Type ▾ ] [ Root cause ▾ ] [ Urgency ▾ ] [ Resolution SLA ▾ ]   │
│                                                                              │
│             ┌──────────────────────────────────────────────────────────┐    │
│             │ 🔴 CRITICAL   Spec ambiguity · Auth modal redesign       │    │
│             │   Raised by R. Verma · routed to you · 18h of 24h used   │    │
│             │   ⚠ Resolution SLA at risk                               │    │
│             │   [ Resolve ] [ Reassign ] [ Escalate further ]         │    │
│             ├──────────────────────────────────────────────────────────┤    │
│             │ ⚠ HIGH        Reviewer capacity · Acme-Helios            │    │
│             │   ...                                                    │    │
│             └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.6 Page 9 — Insights / AI Partnership

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]   AI PARTNERSHIP                                                   │
│                                                                              │
│             ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│             │ Decisions │ │ AI accept│ │ AI edit  │ │ AI reject│             │
│             │ 287      │ │ 73%      │ │ 22%      │ │ 5%       │             │
│             └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                              │
│             ─── Confidence calibration ───                                   │
│             [ Bar chart: AI bucket × agreement rate ]                        │
│             High 91% · Medium 68% · Low 41%                                  │
│                                                                              │
│             ─── Systematic disagreement ───                                  │
│             ▸ Accessibility on React: +1.2                                   │
│             ▸ Requirements on rework v2+: -0.4                               │
│                                                                              │
│             ─── Time saved ───   ~14 h/week                                  │
│             ─── Risks caught ─── by AI 18 · by you 9 · both 4                │
│                                                                              │
│             [ See decision log ]                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.7 Information Priority Rules (applied across all pages)

| Rule | Meaning |
|---|---|
| **Top-left is highest** | Anglo-Western reading order; first eye-contact zone |
| **Color outranks position** | Crimson always overrides "should be lower in priority" |
| **Motion outranks color** | Flashing/pulsing is reserved for *act-now* signals; sparingly |
| **Number outranks word** | A "3" badge says more than "three pending" |
| **Recency outranks volume** | "Last 24h" placement above "trailing 90d" |
| **Action below evidence** | Decision instruments live below the evidence they assess |
| **Confirmation above destruction** | "Are you sure?" rises above the action that triggered it |

### 9.8 Action Hierarchy (canonical)

```
TIER 1   Primary action       large, filled, forest         Accept
TIER 2   Secondary action     medium, outlined, amber       Rework
TIER 3   Tertiary action      under "More ▾"                Reject
TIER 4   Lateral action       header chip                   Escalate
TIER 5   Utility action       icon-only                     Release, Snooze
TIER 6   Navigational         link                          See full profile, View audit
```

### 9.9 Page-Level Layout Hierarchies (summary table)

| Page | Top zone | Center zone | Right rail | Bottom |
|---|---|---|---|---|
| Today | "Needs you now" alert | Queue + KPI tiers | — | Mentorship + Watching |
| Queue list | Segment chips + filters | Item list | — | Keyboard hint |
| Review detail | Status header + actions | 3-pane decision workspace | Context | Shortcut hint |
| Decisions list | Filter chips | History table | — | Pagination |
| Mentorship sessions | Today calendar | Sessions table | Session drawer (on open) | — |
| Escalations | Segment chips | Escalation table | Resolution drawer (on open) | — |
| Insights / AI partnership | KPI strip | Calibration + disagreement | — | Decision log link |
| Insights / Pool health | Pool capacity | Per-reviewer + SLA | Rebalance recs | Forecast |

---

## 10. Enterprise UX Design Principles

### 10.1 Reducing Cognitive Load

| Principle | Applied as |
|---|---|
| **One IA, not two** | Converged Review Hub eliminates `/mentor/*` vs `/enterprise/reviewer/*` dual-stack |
| **Composite priority, surfaced** | "Why first?" affordance on top items removes guesswork |
| **AI does the boring scoring** | Reviewer arrives at a pre-filled rubric; they edit not generate |
| **Templates anchored to criteria** | No blank-page friction in feedback writing |
| **Inline evidence** | No tab-switching to inspect artifacts |
| **Persistent URL state** | Reload, share, bookmark, all preserve filter+sort+group state |
| **Keyboard everywhere** | `/`, `J/K`, `Enter`, `A/R/X`, `Cmd+Enter` |

### 10.2 Improving Trust

| Principle | Applied as |
|---|---|
| **Persistence is non-negotiable** | No toast-only terminal actions; every decision audits |
| **AI is visible, sourced, overridable** | Source / Confidence / Coverage / Override on every recommendation |
| **Signed decisions** | Hash + ledger sequence on every Accept/Reject/Rework |
| **Reviewer confidence declared** | The reviewer's *own* uncertainty is a first-class signal |
| **Evidence integrity inline** | Hash + virus + plagiarism on every artifact |
| **Anti-rubber-stamp routing** | Same-reviewer-twice penalty; banner when continuity is risky |
| **What worked field on every rework/reject** | Forces balanced feedback; reduces unfair-feeling decisions |

### 10.3 Improving Operational Clarity

| Principle | Applied as |
|---|---|
| **Progressive SLA states** | Five tiers, three visual channels — no decision goes "from green to dead" |
| **Presence locks** | Two reviewers never grab the same item |
| **Bottleneck dashboard** | Leading indicators, not after-the-fact reports |
| **Root-cause taxonomy on escalations** | Analytics know *why*, not just *what* |
| **Resolution SLAs on escalations** | Escalations themselves have deadlines |
| **Frozen snapshot on escalation** | Conversation isn't a moving target |
| **Audit inline on every entity** | "What happened to this yesterday?" answerable in 1 click |

### 10.4 Improving Scalability

| Principle | Applied as |
|---|---|
| **AI lifts the throughput ceiling** | Quick-confirm lane on high-confidence items |
| **Routing avoids fatigue patterns** | Smart varietal mix in queue |
| **Capacity caps prevent hoarding** | Per-reviewer concurrent ceiling |
| **Calibration mode for new reviewers** | Shadow-rate against established; safe ramp |
| **Mentor sees pool health** | Rebalance proactively, before SLA slip |
| **Auto-escalate at round ≥ 3** | Bounds rework spirals |
| **Per-axis prioritization** | One queue scales from 14 to 14,000 items |

### 10.5 Improving Decision Efficiency

| Principle | Applied as |
|---|---|
| **Visual asymmetry across decisions** | Accept, Rework, Reject visually weighted by consequence |
| **Forced reason taxonomy** | No vague "reject because X"; categorized for analytics + clarity |
| **Suggested decision based on rubric average** | UI nudges "average 2.1 — typical rework" |
| **Quick-confirm lane** | 90-sec decision when AI did good homework |
| **One-key actions** | Keyboard shortcuts on every primary action |
| **Defaults that match common patterns** | Rework deadline auto-suggested; routing default = fresh reviewer after round 1 |
| **Cascade preview** | Reviewer sees downstream impact before confirming |

---

## 11. Product Design Interview Insights

### 11.1 What Product Design Skills This Demonstrates

| Skill | How this work demonstrates it |
|---|---|
| **Information architecture** | Convergence of two parallel surfaces into one role-mode-gated IA; five-axis review categorization that scales |
| **State-machine literacy** | Complete state inventory with transitions, edge cases, overlays, rollback semantics |
| **Wireframe craft** | Three-pane decision workspace; layout hierarchies derived from user attention gradients, not aesthetic preference |
| **AI/HCI fluency** | Source / Confidence / Coverage / Override invariants applied to every AI surface |
| **Governance design** | Audit inline on every entity; signed decisions; reviewer confidence declarations; fraud surfaces |
| **Systems thinking** | The chain submission → review → bundle → enterprise → payment → credential designed end-to-end with cross-cutting overlays (SLA, audit, escalation) |
| **Operational empathy** | Pace gauge, anti-fatigue routing, quick-confirm lane, keyboard shortcuts, presence locks |
| **Trust design** | "What worked" required field; visible reviewer identity; criterion-anchored feedback; growth signals on rejected work |
| **Risk awareness** | Anti-rubber-stamp routing, plagiarism inline, anomaly flags, escalation SLAs |
| **Business judgment** | Throughput-ceiling argument; AI ROI quantified; procurement-readiness as evidence-pack composability |

### 11.2 How to Explain Governance UX

**The frame:** *"Governance UX is the discipline of making compliance feel like good product, not overhead."*

**The two pillars to walk through in an interview:**

1. **Inline, not orphaned.** Audit, evidence verification, compliance gates, fraud flags — all of these are *inline* on the entities they govern. There is no `/audit` orphan page. The reviewer can answer "who decided what yesterday?" in one click without leaving the decision surface.
2. **Signed, not asserted.** Every decision carries a signature hash and ledger sequence. The UI surfaces "this decision will be signed and audited" *before* confirmation. This isn't security theater — it's the contract between the platform and the regulator, made visible to the operator.

**The interview test:** *"How would you design a UI to be defensible in court?"* The answer is: every decision has a verifiable signature, an evidence pack composes from primary records, and the AI's contribution is captured as a delta against the human's final decision. None of that requires a separate compliance page — it lives where the work happens.

### 11.3 How to Explain Operational UX

**The frame:** *"Operational UX is the discipline of optimizing for the user who does the same kind of work 50 times a day."*

**The three pillars:**

1. **Throughput primitives.** Keyboard shortcuts, presence locks, quick-confirm lane, smart routing — the design treats each second of reviewer time as a measurable cost.
2. **Fatigue counter-measures.** Pace gauges (not shaming), varietal routing (no 8 React reviews in a row), Pomodoro suggestion, end-of-shift soft cap, save-and-come-back state. The system respects the reviewer's human throughput limits.
3. **Bottleneck visibility for the operator.** Mentor sees pool depth, capacity utilization, SLA hit trend, and gets *recommended* rebalances with previews. The mentor is operating the system *as a system*, not reading dashboards.

**The interview test:** *"What changes when you design for someone doing this 50 times a day vs. once a year?"* The answer reaches for batched calibration, persistent draft state, anti-fatigue routing, and a pace gauge — none of which a once-a-year user needs.

### 11.4 How to Explain AI Workflow UX

**The frame:** *"AI workflow UX is the discipline of making AI suggestions trustworthy, overridable, and measurable in the moment of decision."*

**The four invariants:**

1. **Sourced.** Every AI output points to the evidence that produced it. Hover or click reveals the cited lines, the inspected files, the spec sections. *"Why did the AI suggest 3?"* is one click away — always.
2. **Confidence-bounded.** Numeric confidence + bucket (high/medium/low) + color, applied identically wherever AI shows up. Below-threshold suggestions force friction (no quick-confirm).
3. **Coverage-explicit.** The AI declares what it *couldn't* assess. *"Not reviewed: live demo, video walkthrough"* is the single most-overlooked trust primitive in AI UX, and it shifts the reviewer from passive consumer to active validator.
4. **Override-instrumented.** Accept / Edit / Reject suggestions, each writing an audit event with the delta. The system learns from the reviewer's overrides; the reviewer sees their own AI partnership ledger.

**The interview test:** *"How do you keep a reviewer from rubber-stamping AI?"* The answer is: confidence-tiered friction, coverage gaps that force human attention, anti-rubber-stamp routing on continuity, and a partnership ledger that surfaces patterns. The AI is a colleague whose work the reviewer can audit — not an autopilot.

### 11.5 How to Explain Enterprise Dashboard Thinking

**The frame:** *"An enterprise dashboard is not a chart wall. It's an attention budget — what does the operator need to know in the first three seconds?"*

**The four tiers (Today landing surface):**

1. **Tier 1 — Crises.** "Needs you now" alert: SLA breaches, escalation SLA breaches, round-3 reworks. One zone. Always above the fold.
2. **Tier 2 — Pace.** Throughput today + queue at a glance + pace gauge. Answers *"am I on track?"*
3. **Tier 3 — Quality + AI partnership.** Decision distribution + AI agreement + confidence calibration. Answers *"am I deciding well, and is the AI helping?"*
4. **Tier 4 — Operator view (mentor mode).** Pool health, bottleneck spotlight, mentorship sessions, watchlist. Answers *"what's the system doing, and where can I intervene?"*

The **principle**: dashboards must answer questions, not display data. Each tier is the answer to a specific question the operator is asking *at that moment*, in order of urgency.

**The interview test:** *"Why did you put the bottleneck panel below the KPI strip?"* Because the KPI strip answers "am I OK?" and the bottleneck panel answers "what should I do next?" — and the first question has to be answered before the second matters.

### 11.6 The Closing Line for the Interview

> *"The Mentor Review System is the only place in this platform where AI, governance, and contributor livelihood meet on a single screen — every minute. I designed a Review Hub that makes the right decision the fast decision, makes every decision defensible, and makes the AI a colleague whose work the reviewer can audit. The win isn't a prettier queue; it's a throughput ceiling that moves up while the governance floor moves down — measurable in payouts on time, evidence packs that compose, and escalations that resolve before SLAs breach."*

---

## Appendix A — Component Inventory

| Component | Used in | Notes |
|---|---|---|
| `SLATierChip` | queue rows, detail header, KPI cards | 5 states, 3 visual channels |
| `ConfidenceBadge` | rubric criteria, queue rows, dashboards | AI + reviewer; consistent styling |
| `RubricCriterion` | review detail | AI proposal block + reviewer input |
| `EvidenceCard` | review detail (Pane A) | Integrity + preview affordances |
| `ContextPanel` | review detail (Pane C) | Contributor + AI + compliance + audit stack |
| `DecisionToolbar` | review detail (Pane B bottom) | Accept primary, Rework secondary, More tertiary |
| `ConfirmationModal` | all decisions | Two-step pattern; cascade preview |
| `ReworkComposer` | rework path | Criterion-anchored; severity tagging |
| `EscalationComposer` | escalation path | Root-cause taxonomy; frozen snapshot |
| `AuditPanel` | every entity detail | Collapsible inline; export affordance |
| `KPITile` | dashboards | Numeric primary, trend secondary |
| `BottleneckCard` | mentor dashboard | Top-N causes + recommended action |
| `PoolWorkloadBar` | mentor mode | Per-reviewer capacity + rebalance affordance |
| `PaceGauge` | queue header + Today | Visual without shaming |
| `KeyboardHint` | every page footer | `?` for full map |
| `FilterChipRow` | queue list | URL-persisted |
| `GroupToggle` | queue list | Persisted per reviewer |

## Appendix B — Token System (selected)

| Token | Use | Value (illustrative) |
|---|---|---|
| `color.sla.healthy` | Healthy SLA chip | forest-600 |
| `color.sla.watch` | Watch SLA chip | teal-500 |
| `color.sla.warning` | Warning SLA chip | amber-500 |
| `color.sla.critical` | Critical SLA chip | crimson-500 |
| `color.sla.breached` | Breached SLA chip | crimson-700 + pulse |
| `color.confidence.high` | AI/reviewer high | forest-600 |
| `color.confidence.medium` | AI/reviewer medium | amber-500 |
| `color.confidence.low` | AI/reviewer low | crimson-500 |
| `color.decision.accept` | Accept button | forest-600 |
| `color.decision.rework` | Rework button | amber-500 (outlined) |
| `color.decision.reject` | Reject (under More) | crimson-500 (outlined) |
| `motion.urgent.pulse` | Critical/breached states | 1.5s ease loop |
| `elevation.peek` | Hover peek pane | level-2 shadow |
| `elevation.drawer` | Side drawer | level-3 shadow |
| `elevation.modal` | Confirmation modal | level-4 shadow |

## Appendix C — Keyboard Map

```
GLOBAL
  ?               Show full keyboard map
  /               Focus filter / search
  G then T        Go to Today
  G then Q        Go to Queue
  G then E        Go to Escalations
  G then I        Go to Inbox
  Cmd+K           Command palette

QUEUE
  J / K           Next / previous item
  Enter           Open item
  A               Claim item to me
  S               Snooze with reason
  Shift+J/K       Multi-select
  Esc             Clear selection

REVIEW DETAIL
  1..5            Set rubric star (current criterion)
  Tab / Shift+Tab Next / previous criterion
  Cmd+S           Save draft
  A               Accept (opens confirm)
  R               Rework (opens composer)
  X               Reject (opens composer)
  E               Escalate (opens composer)
  Cmd+Enter       Confirm in any modal
  Esc             Cancel modal (preserves draft)

ESCALATION DETAIL
  R               Resolve (opens composer)
  N               Reassign
  F               Escalate further
```

## Appendix D — Cross-Document Anchor Table

| Anchor | Source |
|---|---|
| Converged Review Hub | `ENTERPRISE_UX_AUDIT.md § 9` P1 #1; `MENTOR_REVIEW_REDESIGN_STRATEGY.md § 4.1` |
| Five-tier SLA states | `ENTERPRISE_UX_AUDIT.md § 8.5`; redesign strategy § 3.6 |
| AI explainability invariants | `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 6.5`; redesign strategy § 6 |
| Criterion-anchored rework | `PRODUCT_UNDERSTANDING.md § 12`; redesign strategy § 3.4 |
| Round-3 auto-escalation | `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 3.4` |
| Escalation taxonomy + SLA | `ENTERPRISE_UX_AUDIT.md § 8.7`; redesign strategy § 3.5 |
| Audit inline | `ENTERPRISE_UX_AUDIT.md § 6.1`; redesign strategy § 7.1 |
| Signed decisions | `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 7.2` |
| Evidence pack composition | `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 7.6` |
| Anti-rubber-stamp routing | `ENTERPRISE_UX_AUDIT.md § 6.4` |
| Human-in-the-loop gates | Master SOW via `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 6.3–6.4` |
| Three-pane decision workspace | This document § 9.4 (novel) |
| Reviewer confidence declaration | Redesign strategy § 7.4; this document § 4.2 |
| Quick-confirm lane | Redesign strategy § 6.6; this document § 6 |

---

*End of document — `MENTOR_REVIEW_UX_ARCHITECTURE.md`.*
