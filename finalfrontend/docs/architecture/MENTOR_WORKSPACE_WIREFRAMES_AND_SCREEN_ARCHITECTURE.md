# Mentor Workspace — Wireframe & Screen Architecture

> **Series position:** Fourth and final document in the Mentor Workspace design set.
> - `MENTOR_REVIEW_REDESIGN_STRATEGY.md` — the *why*
> - `MENTOR_REVIEW_UX_ARCHITECTURE.md` — the *IA*
> - `MENTOR_WORKSPACE_UX_EXECUTION_BLUEPRINT.md` — the *build contract*
> - `MENTOR_WORKSPACE_WIREFRAMES_AND_SCREEN_ARCHITECTURE.md` — *this document — the screen library*
>
> **Source ground truth:** `PRODUCT_UNDERSTANDING.md`, `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md`, `ENTERPRISE_UX_AUDIT.md`, the three prior docs, and the existing `src/app/mentor/*` + `src/app/enterprise/reviewer/*` code.
>
> **Operating thesis:** *A screen library is the artifact a design team hands to engineering. Every wireframe here is dimensioned, every state is variant-counted, every interaction is named. This is the document a Figma library is built against.*

---

## Table of Contents

0. Frame system and notation
1. Mentor Dashboard — screen architecture
2. Review Queue — screen architecture
3. Submission Review — screen architecture
4. Rework & Escalation — screen architecture
5. AI Explainability — component library
6. State-Based Screen Variations
7. Enterprise UX Interaction Patterns
8. Detailed Text Wireframes
9. Figma Execution Guidance
10. Product Design Interview Insights

Appendices: A. Screen inventory · B. Variant matrices · C. Density & responsive rules · D. Motion & timing · E. Wireframe legend

---

## 0. Frame System and Notation

### 0.1 Canonical Frame Sizes

```
DESKTOP frames
   Standard         1440 × 900   (primary design canvas)
   Large            1680 × 1050  (sales-demo capture)
   Compact          1280 × 800   (laptop fallback)
   Ultra            1920 × 1080  (operator displays)

DRAWER / MODAL frames
   Side drawer      420 × var.   (right-anchored)
   Side drawer wide 560 × var.   (escalation, rework composer)
   Modal small      480 × var.   (single-question confirm)
   Modal standard   640 × var.   (composer modals)
   Modal large      840 × var.   (compare, full-rationale)

TABLET frame (Phase 2)
   Standard         1024 × 1366

MOBILE frame (Phase 2, view-only)
   Standard          390 × 844   (notifications + emergency view only)
```

### 0.2 Grid

```
Columns:      12
Gutter:       24 px
Margin:       24 px (left + right inside content area)
Content:      max 1440 px centered above 1680
Baseline:     8 px
Density:      compact-default (32 px row height, 13 px body)
```

### 0.3 Wireframe Notation Used in This Document

```
┌────┐    frame edge
└────┘
║    ║    sticky region
●○○      radio (filled = selected)
□☑       checkbox (☑ = checked)
[ ... ]   button (primary square brackets)
( label ) toggle / segment / chip
{var}     dynamic value
▾ ▸ ▿     disclosure indicators
●●●       online status (3 = active, 2 = idle, 0 = offline)
▰▰▱▱      progress bar
🔴 ⚠ ▲ ●  SLA tier glyphs (Breached / Critical / Warning / Normal)
🤖 👤     AI / human source
🚩 ⏱ 🛡   risk flags (plagiarism / timing / integrity)
✓ ✗ ↺ ☐  decision glyphs
```

---

## 1. Mentor Dashboard — Screen Architecture

### 1.1 Screen Identity

```
Route:         /review-hub
Title:         "Today"
Roles:         mentor, reviewer (mentor sees additional sections)
Refresh:       30s polling for crisis tier; 5min for KPIs
Empty state:   "All clear. 0 critical items." (Section 1 collapse)
```

### 1.2 Full Layout Hierarchy — Mentor Mode @ 1440 × 900

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SIDEBAR 240 ║ CONTENT 1200 (24 px left/right margin → 1152 inner)             ║
║              ║                                                                ║
║              ║ ┌───────────────────────────────────────────────────────────┐ ║
║              ║ │ TOP STRIP · 56 px · sticky                                 │ ║
║              ║ │  ← Today, Sat May 23 2026     Mentor mode 🔁   🔔 9   👤 RV │ ║
║              ║ └────────────────────────────────────────────────────────────┘ ║
║              ║                                                                ║
║              ║ ┌─── SECTION 1 · NEEDS YOU NOW · 120 px · full-width ──────┐ ║
║              ║ │   ⚠  3 critical · 1 escalation past SLA · 2 round-3        │ ║
║              ║ │   ─────────────                                            │ ║
║              ║ │   [ Go to queue ]  [ Resolve escalations ]  [ Round-3 ]    │ ║
║              ║ └────────────────────────────────────────────────────────────┘ ║
║              ║                                                                ║
║              ║ 32 px gap                                                      ║
║              ║                                                                ║
║              ║ ┌─── SECTION 2 · MY WORK · 8 cols (752 px) ──┬── SECTION 3 ─┐ ║
║              ║ │                                              │ MY PACE      │ ║
║              ║ │  MY QUEUE AT A GLANCE                        │ 4 cols(376)  │ ║
║              ║ │  14 pending · 5 at-risk · 3 reworks          │              │ ║
║              ║ │                                              │ Today        │ ║
║              ║ │  NEXT 3 (priority order)                     │ ▰▰▰▰▰▰░░░░  │ ║
║              ║ │  1. 🔴 Refactor billing   8h overdue          │ 6 / 10       │ ║
║              ║ │  2. ⚠  Date picker        2h left             │ Target 5:30  │ ║
║              ║ │  3. ⚠  Auth modal         3h round 2/3        │              │ ║
║              ║ │                                              │ Avg decision │ ║
║              ║ │  [ Open queue ]   [ Quick-confirm (3) ]      │ 1.8 h        │ ║
║              ║ │                                              │              │ ║
║              ║ │                                              │ SLA hit (wk) │ ║
║              ║ │                                              │ 94 %         │ ║
║              ║ └──────────────────────────────────────────────┴──────────────┘ ║
║              ║                                                                ║
║              ║ 32 px gap                                                      ║
║              ║                                                                ║
║              ║ ┌─── SECTION 4 · KPI STRIP · 12 cols ─────────────────────────┐ ║
║              ║ │  ┌─ Throughput ─┐  ┌─ Quality ─┐  ┌─ AI partnership ─┐      │ ║
║              ║ │  │ 18 / 25 wk    │  │ Accept 81 %│  │ Agree 73 %        │   │ ║
║              ║ │  │ SLA hit 94 %  │  │ Rework 16% │  │ Override 27 %     │   │ ║
║              ║ │  │ ▲ 4 %         │  │ Reject  3% │  │ Calibration 88 %  │   │ ║
║              ║ │  └───────────────┘  └────────────┘  └───────────────────┘   │ ║
║              ║ └──────────────────────────────────────────────────────────────┘ ║
║              ║                                                                ║
║              ║ 32 px gap                                                      ║
║              ║                                                                ║
║              ║ ┌─── SECTION 5 · BOTTLENECK SPOTLIGHT [mentor] · 12 cols ────┐ ║
║              ║ │                                                              │ ║
║              ║ │  TOP CAUSES THIS WEEK                                        │ ║
║              ║ │  1. Spec ambiguity        14 (28 %)  ▲ 5                     │ ║
║              ║ │  2. Reviewer capacity      9 (18 %)  ▲ 3                     │ ║
║              ║ │  3. Contributor evidence   7 (14 %)  ▼ 2                     │ ║
║              ║ │                                                              │ ║
║              ║ │  FORECAST                                                    │ ║
║              ║ │  Capacity exceeded by Tuesday at current intake              │ ║
║              ║ │                                                              │ ║
║              ║ │  RECOMMENDED ACTIONS                                         │ ║
║              ║ │  [ Add reviewer ]  [ Pause Acme intake 24h ]  [ Full ]       │ ║
║              ║ └──────────────────────────────────────────────────────────────┘ ║
║              ║                                                                ║
║              ║ 32 px gap                                                      ║
║              ║                                                                ║
║              ║ ┌─── SECTION 6 · POOL HEALTH [mentor] · 12 cols ─────────────┐ ║
║              ║ │   4 reviewers · 53 / 60 cap · pool SLA 91 % ▼ 3 %            │ ║
║              ║ │   ─────────────                                              │ ║
║              ║ │   R. Verma   ████████░░░  18 / 25   ●●● online               │ ║
║              ║ │   K. Singh   ███████░░░░  11 / 25   ●●● online               │ ║
║              ║ │   L. Mehta   ██████████▲  24 / 20   ●●○ over cap             │ ║
║              ║ │   A. Iyer    ░░░░░░░░░░░   0 / 25   ⚫⚫⚫ PTO until May 25     │ ║
║              ║ │   ─────────────                                              │ ║
║              ║ │   [ Rebalance L. Mehta → R. Verma ]                          │ ║
║              ║ └──────────────────────────────────────────────────────────────┘ ║
║              ║                                                                ║
║              ║ 32 px gap                                                      ║
║              ║                                                                ║
║              ║ ┌─── SECTION 7 · MENTORSHIP TODAY · 6 cols ──┬─── WATCHLIST ──┐ ║
║              ║ │                                              │ 6 cols          │ ║
║              ║ │  3 sessions                                  │  4 contributors │ ║
║              ║ │   ▸ c4821 · A11y coaching · 4:00 PM          │   ▸ c5102 ⚠      │ ║
║              ║ │   ▸ c5102 · Test strategy · 5:00 PM          │   ▸ c4821        │ ║
║              ║ │   ▸ c6710 · Onboarding   · 6:00 PM           │   ▸ c6710        │ ║
║              ║ │                                              │   ▸ c8044        │ ║
║              ║ │  [ Mentorship hub → ]                        │  [ See all ]    │ ║
║              ║ └──────────────────────────────────────────────┴─────────────────┘ ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### 1.3 Exact Sections (mapped to source-doc requirements)

| # | Section | Visibility | Anchor |
|---|---|---|---|
| 1 | Needs You Now | always (collapses to one-liner if empty) | `ENTERPRISE_UX_AUDIT.md § 8.1` operational monitoring |
| 2 | My Work | always | `PRODUCT_UNDERSTANDING.md § 13` "what needs my approval right now" |
| 3 | My Pace | always | new — review fatigue counter-measure |
| 4 | KPI Strip | always | reviewer self-monitoring |
| 5 | Bottleneck Spotlight | mentor only | `ENTERPRISE_UX_AUDIT.md § 8.5` leading indicators |
| 6 | Pool Health | mentor only | `ENTERPRISE_UX_AUDIT.md § 8.3` workflow bottlenecks |
| 7 | Mentorship + Watchlist | when non-empty | mentorship flow |

### 1.4 KPI Placement

Three KPI cards in Section 4, each 360 × 120 px, gutter 24 px:

```
┌─ THROUGHPUT (360 × 120) ────────────────────┐
│  THROUGHPUT                          ▲ 4 %  │   ← 11 px label + delta arrow
│                                              │
│   18 / 25                                    │   ← 32 px metric
│   this week                                  │   ← 12 px caption
│                                              │
│   SLA hit 94 %   ●  Pace on track            │   ← 13 px sub-metrics
└──────────────────────────────────────────────┘
```

**Placement rule:** KPIs are *below* My Work because *what you'll do* outranks *how you're doing*.

### 1.5 SLA Alert Areas (three-tier surfacing)

| Surface | Content | Visibility |
|---|---|---|
| Section 1 (Needs You Now) | count of breached + critical | sticky at top |
| Section 2 (My Work) | next 3 items with SLA chips | inline |
| Top strip 🔔 badge | unread SLA notifications | global |

The dashboard never enumerates *all* SLA-at-risk items — that lives in the queue. Dashboard answers *whether to worry*.

### 1.6 AI Insight Panels

```
KPI Strip · AI Partnership card
   Agree 73 %  ·  Override 27 %  ·  Calibration 88 %
   ↓ click drills to /review-hub/insights/ai-partnership

Section 2 · My Work · per-item line
   "AI conf 94 % · ✓ AI ready"   ← only when applicable

Quick-confirm chip in Section 2
   [ Quick-confirm (3) ]   ← only when AI-ready items exist
```

**Rule:** dashboard never shows AI rationale or per-suggestion data. That lives on the review detail.

### 1.7 Workload Panels (mentor mode)

Section 6 layout, with a row spec:

```
┌─ Pool row (32 px, hover → drawer) ──────────────────────────────────────────┐
│  R. Verma          ████████░░░░  18 / 25   ●●● online   ⓘ → click for drawer │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Drawer on click:**

```
┌─ Reviewer drawer (420 × full height) ───────────┐
│  R. Verma                                  [ ✕ ] │
│  Mentor since Q3 2025 · L3                       │
│  Skills: React, TypeScript, A11y, Tailwind       │
│  ─────────────                                   │
│  Capacity      18 / 25  (72 %)                    │
│  Active sessions   1                              │
│  Today         6 decisions                        │
│  This week     28 decisions                       │
│  SLA hit (wk)  96 %                               │
│  Avg time      1.7 h                              │
│  ─────────────                                   │
│  Current queue (top 5)                            │
│   1. 🔴 Billing service   8h over                 │
│   2. ⚠ Date picker        2h                      │
│   ...                                            │
│  ─────────────                                   │
│  [ Reassign N items ]   [ Message ]               │
└──────────────────────────────────────────────────┘
```

### 1.8 Operational Monitoring Areas

Three operational tiers:

| Tier | Surface | What it answers |
|---|---|---|
| **Crisis** | Section 1 | "What needs me NOW?" |
| **Operations** | Sections 5–6 | "What's slowing the system, and where can I intervene?" |
| **Health** | Section 4 KPIs | "Am I doing well?" |

### 1.9 Contributor Quality Indicators

Embedded in Section 7 (Watchlist), per-contributor row:

```
┌─ Watchlist row (40 px) ─────────────────────────────────────────────┐
│  c5102   ⚠ 2 reject last 3   reliab ▼5 q   coaching: test strategy   │
└──────────────────────────────────────────────────────────────────────┘
```

Click → contributor profile drawer (similar pattern to reviewer drawer).

### 1.10 Variant Inventory for Mentor Dashboard

| Variant | When |
|---|---|
| Default mentor | All sections visible |
| Default reviewer | Sections 5, 6 hidden |
| Crisis empty | Section 1 collapses to "All clear" pill |
| Pool empty (mentor) | Section 6 hidden |
| Mentorship empty | Section 7 hidden |
| Loading | Skeletons in each section (5-row skeletons in 2 & 6) |
| Error | Banner across top of Content; per-section retry on failures |

---

## 2. Review Queue — Screen Architecture

### 2.1 Screen Identity

```
Route:        /review-hub/queue?scope=mine&segment=critical&group=flat&sort=sla
Title:        "My Queue (14)" / "Team Queue (37)" / "My Pool (51)"
Default sort: composite priority
Default group: flat
Default segment: all (no segment filter)
```

### 2.2 Full Layout @ 1440 × 900

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SIDEBAR 240 ║ CONTENT 1200                                                    ║
║              ║                                                                 ║
║              ║ ┌─ TOP STRIP · 56 px · sticky ─────────────────────────────┐  ║
║              ║ │  Mentor mode 🔁     🔔 9     👤 RV                          │  ║
║              ║ └────────────────────────────────────────────────────────────┘  ║
║              ║                                                                 ║
║              ║ ┌─ QUEUE HEADER · 88 px · sticky ──────────────────────────┐  ║
║              ║ │  MY QUEUE (14)                       [ Refresh ]  [ ⚙ ]    │  ║
║              ║ │  Avg age 8h · At-risk 5 · Decided today 6                 │  ║
║              ║ │  Pace ▰▰▰▰▰▰░░░░ 60 %                                      │  ║
║              ║ └────────────────────────────────────────────────────────────┘  ║
║              ║                                                                 ║
║              ║ ┌─ SEGMENT CHIPS · 48 px · sticky ─────────────────────────┐  ║
║              ║ │  ( 🔴 Breached 2 ) ( ⚠ Critical 5 ) ( ▲ Warning 8 ) ( ● Normal 14 ) │
║              ║ │  ──────────────                                            │  ║
║              ║ │  ( Mine 14 ) ( Team 37 ) ( My pool 51 )      ⌨ / focus     │  ║
║              ║ └────────────────────────────────────────────────────────────┘  ║
║              ║                                                                 ║
║              ║ ┌─ FILTER ROW · 48 px · sticky on scroll ──────────────────┐  ║
║              ║ │  [ Skill ▾ ] [ Project ▾ ] [ Enterprise ▾ ] [ Type ▾ ]    │  ║
║              ║ │  [ AI conf ▾ ] [ Round ▾ ] [ ⚙ More ]    Group: ( Flat | │  ║
║              ║ │  Project | Contributor | Skill )    Sort: SLA urgency ▾   │  ║
║              ║ └────────────────────────────────────────────────────────────┘  ║
║              ║                                                                 ║
║              ║ ┌─ TABLE · variable · scrolls ─────────────────────────────┐  ║
║              ║ │  Col widths:                                                │  ║
║              ║ │   ☐ 32   SLA 96   TASK flex   CONTRIB 140   TYPE 96         │  ║
║              ║ │   AI 96   WHY 180   ⋮ 56                                    │  ║
║              ║ │                                                              │  ║
║              ║ │  ┌─ Row (88 px, hover bg) ───────────────────────────────┐ │  ║
║              ║ │  │ ☐  🔴 -8h    Refactor billing service                  │ │  ║
║              ║ │  │            Node · Stripe · Acme · P0                   │ │  ║
║              ║ │  │            v2 round 2/3 · last reviewer: you           │ │  ║
║              ║ │  │            ⚠ auto-escalating in 1h                      │ │  ║
║              ║ │  │  c1142     v2-R    🤖 78%    SLA+P0+r2          ⋮      │ │  ║
║              ║ │  │  Reliab 71  round 2  med                                │ │  ║
║              ║ │  └────────────────────────────────────────────────────────┘ │  ║
║              ║ │  ┌─ Row 2 ──────────────────────────────────────────────┐ │  ║
║              ║ │  │ ☐  ⚠ 2h     Build accessible date picker              │ │  ║
║              ║ │  │            React · A11y · Acme · P0                    │ │  ║
║              ║ │  │            v2 round 2/3 · ✓ AI ready  [Q]               │ │  ║
║              ║ │  │  c4821     v2-R    🤖 94%   AI ready · SLA      ⋮      │ │  ║
║              ║ │  │  Reliab 87  round 2  high   [ Quick-confirm ]           │ │  ║
║              ║ │  └────────────────────────────────────────────────────────┘ │  ║
║              ║ │  ┌─ Row 3 ──────────────────────────────────────────────┐ │  ║
║              ║ │  │ ☐  ▲ 6h     ...                                       │ │  ║
║              ║ │  └────────────────────────────────────────────────────────┘ │  ║
║              ║ │  ...                                                         │  ║
║              ║ └──────────────────────────────────────────────────────────────┘ ║
║              ║                                                                 ║
║              ║ ┌─ FOOTER · 40 px ─────────────────────────────────────────┐  ║
║              ║ │ Showing 14 of 14    ⌨ / focus · J/K nav · Enter · A · ?   │  ║
║              ║ └────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### 2.3 Enterprise Table Structure

```
COL  WIDTH    HEADER              CONTENT
──────────────────────────────────────────────────────────────────
1    32 px    ☐                   row checkbox
2    96 px    SLA                 tier chip + countdown
3    flex     TASK                title (14/600) + project line (12/400)
                                  + sub-line (12/400 muted) with round, continuity, AI ready
4    140 px   CONTRIBUTOR         pseudonym (13) + reliability (12 muted)
5    96 px    TYPE                v2-R / Initial / Final + round indicator
6    96 px    AI                  confidence badge + "AI ready" pill if applicable
7    180 px   WHY FIRST?          composite-score breakdown chips
8    56 px    ⋮                   row menu (snooze, release, escalate, watch)
```

### 2.4 Filter Architecture

**Three-tier filter architecture:**

```
TIER 1 · Chips (always visible, in segment row)
  ( 🔴 Breached ) ( ⚠ Critical ) ( ▲ Warning ) ( ● Normal )
  ( Mine ) ( Team ) ( My pool )
  → URL: ?segment=&scope=

TIER 2 · Dropdowns (always visible, in filter row)
  [ Skill ▾ ]      multi-select
  [ Project ▾ ]    multi-select
  [ Enterprise ▾ ] multi-select
  [ Type ▾ ]       multi-select (Initial / Rework / Final / Escalation)
  [ AI conf ▾ ]    multi-select (High / Medium / Low)
  [ Round ▾ ]      range (1 / 2 / 3+)
  → URL: ?skill[]=&project[]=&enterprise[]=&type[]=&conf[]=&round=

TIER 3 · Power panel (collapsed under [ ⚙ More ])
  ☐ Continuity flag (same reviewer as last round)
  ☐ Anomaly flag (reviewer-contributor pairing)
  Contributor:        [ autocomplete ]
  Date range:         [ from ] [ to ]
  ☐ Items I've snoozed
  ☐ Items with active question threads
  Saved view:         [ load ▾ ] [ save current ]
  [ Reset filters ]
```

**Filter chip variant** when active:

```
[ Project: Acme-Helios, BetaCo  ✕ ]
                                 ↑ click to clear this single filter
```

### 2.5 Search Behavior

```
Search invocation
  Keyboard:    /  (focuses input in header)
  Mouse:       click magnifier in QUEUE HEADER

Search input layout (replaces "Avg age" line when focused)
  ┌─ Search ─────────────────────────────────────────────────┐
  │  🔍  [ Search task, contributor, project, skill...     ✕ ] │
  └──────────────────────────────────────────────────────────┘

Search behavior
  Debounce:    250 ms
  Min chars:   2
  Match:       fuzzy across task title, contributor pseudonym, project, skills
  Highlight:   matched substring in results (15/700 weight)
  Persistence: URL ?q=
  Empty result: "No matches. Showing all 14 items below."  (does not block table)
```

### 2.6 Grouping Logic

Group toggle changes table from flat to nested. **Project grouping example:**

```
┌─ Group header (40 px, sticky on scroll within group) ───────────────┐
│  ▾  Acme-Helios       8 items   ·   At-risk 3   ·   P0 strategic     │
└──────────────────────────────────────────────────────────────────────┘
    [ rows indent 24 px from left ]
    ┌─ Row 1 ────────────────────────────────────────────────────────┐
    │ ☐  🔴 -8h    Refactor billing service     c1142     ...         │
    └────────────────────────────────────────────────────────────────┘
    ...

┌─ Group header ──────────────────────────────────────────────────────┐
│  ▾  BetaCo            5 items   ·   At-risk 1   ·   P1 standard      │
└──────────────────────────────────────────────────────────────────────┘
    ...
```

**Group order:** by aggregate priority of items in group (P0 enterprise before P1 before P2; within same tier, by SLA risk).

### 2.7 Prioritization Indicators

Each row carries a **WHY FIRST?** column that decomposes the composite priority:

```
WHY FIRST? chips (180 px col)

Item 1:    SLA -8h · P0 · round 2
Item 2:    AI ready · SLA 2h · P0
Item 3:    SLA 6h
Item 4:    Round 2 · continuity ⚠
Item 5:    Pinned ★
```

Chips visible inline; hover any chip → tooltip with the numeric weight contribution.

### 2.8 SLA Risk Indicators (canonical, again)

```
🔴 -8h      Breached      crimson chip + pulse  + sub-line "auto-escalating in {time}"
⚠ 1h        Critical      crimson chip          + push notification fired
▲ 3h        Warning       amber chip
● 6h        Watch         teal dot
   8h       Healthy       forest (no chip — implicit)
```

**Sub-line escalation hint** appears under task title for tiers Critical and Breached:

```
"⚠ auto-escalating in 1h"            (Critical, < 1h to breach)
"⚠ Breached 8h ago · escalating now" (Breached)
```

### 2.9 Contributor Quick-View Patterns

**Hover behavior on contributor cell:**

```
On hover >400 ms → peek card (320 × 220 px, anchored to cell)

┌─ Contributor peek ──────────────────────┐
│  c4821 · joined 7 mo                     │
│  Verified: React L3 · A11y L2 · TW L2    │
│  Reliability 87/100 (▲ 4 q)              │
│  ─────────────                           │
│  Last 5 decisions                        │
│   ✓ ✓ ↺ ✓ ✗  (recent ← oldest)          │
│  Anomaly: none · Watch: yes — A11y       │
│  ─────────────                           │
│  [ See profile ]                         │
└──────────────────────────────────────────┘
```

### 2.10 Bulk Action Placement

```
Default state (no selection)
  → Filter row visible at top of table

Selection state (≥1 row checked)
  → Filter row is REPLACED by bulk action bar (40 px sticky)

┌─ Bulk action bar ─────────────────────────────────────────────────┐
│  3 selected  ·  [ Claim ] [ Snooze ] [ Release ] [ Watch ] [ ✕ ]   │
└────────────────────────────────────────────────────────────────────┘
```

**Allowed:** Claim, Snooze, Release, Watch.
**Forbidden:** Accept, Reject, Rework.

### 2.11 Variant Inventory for Queue

| Variant | When |
|---|---|
| Default · Mine | reviewer's own queue, no filters |
| Default · Team (mentor) | mentor viewing team's queue |
| Filtered | any active filter |
| Grouped | group != Flat |
| Selection | ≥1 row checked |
| Empty | 0 items match |
| Loading | row skeletons (8 rows) |
| Error | banner above table |

---

## 3. Submission Review — Screen Architecture

### 3.1 Screen Identity

```
Route:        /review-hub/queue/[reviewId]
Title:        "{Task} · v{N} · {ReviewType}"
Layout:       3-pane workspace (Submission 50% · Decision 30% · Context 20%)
Autosave:     every 10 s while editing
Presence:     lock acquired on first interaction; released on idle or explicit "release"
```

### 3.2 Full Layout @ 1440 × 900

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SIDEBAR 240 ║ CONTENT 1200                                                    ║
║              ║                                                                 ║
║              ║ ┌─ TOP STRIP · 56 px · sticky ─────────────────────────────┐  ║
║              ║ │ ← Queue   Build accessible date picker · v2 · Rework r2/3 │  ║
║              ║ │ ⚠ 2h SLA · 🤖 94% high · c4821 · Acme · P0                  │  ║
║              ║ │                          [ Release ] [ Escalate ] [ More ▾ ] │  ║
║              ║ └────────────────────────────────────────────────────────────┘  ║
║              ║                                                                 ║
║              ║ ┌─ ROUND BANNER (only if round > 1) · 64 px ───────────────┐  ║
║              ║ │  Rework round 2 of 3   ·   Round 3 auto-escalates         │  ║
║              ║ │  Previous reviewer: you   ·   4/5 of c4821's recent yours │  ║
║              ║ │  [ See v1↔v2 diff ]   [ Release to fresh reviewer ]       │  ║
║              ║ └────────────────────────────────────────────────────────────┘  ║
║              ║                                                                 ║
║              ║ ┌── PANE A · SUBMISSION ──┐ ┌── PANE B · DECISION ──┐ ┌── C ─┐ ║
║              ║ │ 50%  (588 px)            │ │ 30%  (352 px)         │ │ 20%   │ ║
║              ║ │                          │ │                       │ │ 235px │ ║
║              ║ │ Tabs:                    │ │ RUBRIC                │ │       │ ║
║              ║ │ Overview · Artifacts ·   │ │ ▸ C1 Code Quality     │ │ CTRB  │ ║
║              ║ │ Q&A · Evidence ·         │ │   ★★★★☆ 🤖 ★★★★☆       │ │ c4821 │ ║
║              ║ │ Compare · History        │ │ ▸ C2 Completeness     │ │ L3    │ ║
║              ║ │ ─────────────            │ │   ★★★★★ 🤖 ★★★★★       │ │ Reli  │ ║
║              ║ │                          │ │ ▸ C3 Requirements     │ │ 87    │ ║
║              ║ │ Task description         │ │   ☆☆☆☆☆ 🤖 ★★★☆☆(71%) │ │ ✓✓↺✓✗ │ ║
║              ║ │ Build an accessible      │ │   [ Accept(3) Edit ✗ ]│ │       │ ║
║              ║ │ date picker.             │ │ ▸ C4 Testing          │ │ AI    │ ║
║              ║ │ React · TS · A11y        │ │   ★★★★☆ 🤖 ★★★★☆       │ │ 🤖94% │ ║
║              ║ │                          │ │ ▸ C5 Accessibility    │ │ ✓ CQ  │ ║
║              ║ │ Artifacts (3)            │ │   ★★☆☆☆ 🤖 ★★★☆☆       │ │ ✓ Cm  │ ║
║              ║ │  ┌─────────────────────┐│ │                       │ │ ◐ Re  │ ║
║              ║ │  │ artifact.zip 2.4MB   ││ │ FEEDBACK              │ │ ✓ Te  │ ║
║              ║ │  │ SHA ok · Plag 94 %   ││ │ Templates:            │ │ ◐ Ac  │ ║
║              ║ │  │ [Preview][Download]  ││ │ [ Missing req ▾ ]     │ │ 🚩 plag│ ║
║              ║ │  └─────────────────────┘│ │ ┌───────────────────┐ │ │       │ ║
║              ║ │  ┌─────────────────────┐│ │ │                   │ │ │ COMP  │ ║
║              ║ │  │ spec.pdf 480 KB ✓   ││ │ └───────────────────┘ │ │ ✓ SOW │ ║
║              ║ │  └─────────────────────┘│ │                       │ │ ✓ Trm │ ║
║              ║ │  ┌─────────────────────┐│ │ INTERNAL NOTE         │ │ ⚠ Snst│ ║
║              ║ │  │ notes.pdf 120 KB ✓  ││ │ ┌───────────────────┐ │ │ ✓ GDPR│ ║
║              ║ │  └─────────────────────┘│ │ │                   │ │ │       │ ║
║              ║ │                          │ │ └───────────────────┘ │ │ AUDIT │ ║
║              ║ │ External links           │ │                       │ │ 4 evt │ ║
║              ║ │  ▸ Storybook             │ │ YOUR CONFIDENCE       │ │ [exp] │ ║
║              ║ │  ▸ GitHub                │ │ ● High ○ Med ○ Low    │ │       │ ║
║              ║ │                          │ │                       │ │       │ ║
║              ║ │ Structured responses     │ │ ┌─────────────────┐   │ │       │ ║
║              ║ │  Q1, Q2, Q3              │ │ │ ✓ Accept        │   │ │       │ ║
║              ║ │                          │ │ └─────────────────┘   │ │       │ ║
║              ║ │ Evidence checklist 7/8   │ │ ┌─────────────────┐   │ │       │ ║
║              ║ │  ✓ Tests ✓ Stories ...   │ │ │ ↺ Request Rework│   │ │       │ ║
║              ║ │  ✗ Demo (open)           │ │ └─────────────────┘   │ │       │ ║
║              ║ │                          │ │ [ More ▾ ]            │ │       │ ║
║              ║ │                          │ │  Reject · Escalate ·  │ │       │ ║
║              ║ │                          │ │  Release · Save draft │ │       │ ║
║              ║ └──────────────────────────┘ └───────────────────────┘ └───────┘ ║
║              ║                                                                 ║
║              ║ ┌─ FOOTER · 40 px ─────────────────────────────────────────┐  ║
║              ║ │ ⌨ A accept · R rework · X reject · E escalate · Cmd+Enter │  ║
║              ║ └────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### 3.3 Split-Panel Layout (proportions)

```
Pane A (Submission)      588 px   (50 % - 12 px gutter / 2)
Pane B (Decision)        352 px   (30 % - 12 px gutter)
Pane C (Context)         235 px   (20 % - 12 px gutter / 2)

Vertical scroll:         each pane independent
Sticky elements:
   Pane A:               tab strip
   Pane B:               decision toolbar (bottom)
   Pane C:               none (compact, fits viewport)
```

### 3.4 Evidence Viewing System (Pane A · Artifacts tab)

**Artifact card · 144 px tall:**

```
┌─ Artifact (full width of pane) ──────────────────────────────────────────┐
│ ┌── 96 × 96 ──┐  artifact.zip                                              │
│ │             │  2.4 MB · uploaded May 22 18:04                            │
│ │   📦         │  ─────────────                                             │
│ │             │  SHA-256: 7a9c…b2d1  ✓ matches submission record           │
│ └─────────────┘  Virus scan: clean                                         │
│                  Plagiarism: 94 % original · 3 funcs overlap (report ↗)   │
│                                                                            │
│                  [ Preview inline ]  [ Download ]  [ Reports ]             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Inline preview** — opens drawer over Pane A:

```
┌─ Inline preview drawer (full Pane A) ──────────────────────────────────┐
│  ← Back to artifacts                            artifact.zip · src/    │
│  ─────────────────                                                     │
│  File tree (left 160) │  Content viewer (right, monospace)             │
│   ▸ src/              │   1 │ import React from "react"                │
│     ▸ components/     │   2 │ import { Dialog } from "./Dialog"        │
│       Login.tsx       │   3 │                                          │
│       DatePicker.tsx  │   4 │ export function Login() {                │
│     ▸ lib/            │   5 │   const focusRef = useRef(null)          │
│   ▸ tests/            │   6 │   ...                                    │
│   ▸ stories/          │                                                │
│                       │                                                │
│   [ Search files ]    │   [ Find in file ] [ Copy ] [ View raw ]      │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Version Comparison (Pane A · Compare tab)

Tab visible only when `round > 1`:

```
┌─ Compare v1 vs v2 (full Pane A) ──────────────────────────────────────┐
│  Compare:  ( v1 ↔ v2 ✓ )   ( v1 ↔ current draft )                      │
│  Mode:     ( Unified ✓ )   ( Split )   ( Word-level )                  │
│  ─────────────                                                         │
│  src/components/DatePicker.tsx                                         │
│   124 │  function DatePicker() {                                        │
│   125 │    const [open, setOpen] = useState(false)                      │
│   126 │+   const focusRef = useRef<HTMLButtonElement>(null)             │
│   127 │+   useEffect(() => focusRef.current?.focus(), [open])           │
│   128 │    return (                                                     │
│   129 │      <Dialog                                                    │
│   130 │+       aria-label="Choose date"                                 │
│   131 │+       initialFocus={focusRef}                                  │
│   132 │      >                                                          │
│  ─────────────                                                         │
│  Prior reviewer feedback (criterion 5):                                │
│   "Missing focus trap and aria-label on date picker"                   │
│   Status:  ✓ Addressed in v2                                           │
│  ─────────────                                                         │
│  AI re-analysis on v2:                                                 │
│   Criterion 5: 3 → 5 (high confidence)                                 │
│   "Focus trap implemented; aria-label added"                           │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Rubric Scoring Section (Pane B)

**Criterion collapsed (default):**

```
┌─ C3 Requirements Adherence (40 px) ──────────────────────────────────┐
│ ▸   C3   ☆☆☆☆☆   🤖 ★★★☆☆ (71%)            [ Score ]                 │
└──────────────────────────────────────────────────────────────────────┘
```

**Criterion expanded:**

```
┌─ C3 Requirements Adherence  (expanded, ~360 px tall) ────────────────┐
│ ▾   Weight 25 %                                                       │
│                                                                       │
│   YOUR SCORE                                                          │
│   ★  ★  ★  ★  ★                                                       │
│   1  2  3  4  5                                                       │
│   Below   Meets   Exceeds                                             │
│                                                                       │
│   🤖 AI SUGGESTS  ★★★☆☆ (3/5) · 71 % medium                           │
│   "Covers 4 of 6 reqs. Missing keyboard nav, SR labels."             │
│   Source: spec §4.2, lines 12–17                                      │
│   Examined: stories, code · Not reviewed: live demo, video           │
│   [ Accept (3) ]  [ Edit ]  [ Reject suggestion ]                     │
│                                                                       │
│   YOUR REASONING (contributor sees)                                   │
│   Templates: [ Missing req ▾ ] [ Quality ▾ ] [ Nit ▾ ]                │
│   ┌─────────────────────────────────────────────────────┐            │
│   │                                                       │            │
│   └─────────────────────────────────────────────────────┘            │
│                                                                       │
│   INTERNAL NOTE                                                       │
│   ┌─────────────────────────────────────────────────────┐            │
│   │                                                       │            │
│   └─────────────────────────────────────────────────────┘            │
│                                                                       │
│   SEVERITY IF REWORK    ( ) Blocker  ( ) Major  ( ) Nit              │
└───────────────────────────────────────────────────────────────────────┘
```

### 3.7 Contributor Context Panel (Pane C top section)

```
┌─ Contributor (235 × 200) ────────────────┐
│  c4821                                    │
│  joined 7 mo · L3 React · A11y L2         │
│  ─────────────                            │
│  Reliability       87 / 100  ▲4 q         │
│  Acceptance        80 %  (last 5)         │
│  Avg rework rounds 1.4                    │
│  ─────────────                            │
│  Last 5                                   │
│   ✓  ✓  ↺  ✓  ✗                          │
│  ─────────────                            │
│  Anomaly: none                            │
│  Watch:   yes — A11y coaching             │
│  ─────────────                            │
│  [ See profile ]                          │
└───────────────────────────────────────────┘
```

### 3.8 AI Reasoning Panel (Pane C middle section)

```
┌─ AI evidence summary (235 × 280) ────────┐
│  🤖 v3.2 · 94 % high · 14:08              │
│  ─────────────                            │
│  COVERED                                  │
│   ✓ Code quality          95 %            │
│   ✓ Completeness          88 %            │
│   ◐ Requirements          71 % · gap     │
│   ✓ Testing               88 %            │
│   ◐ Accessibility         54 % · gap     │
│  ─────────────                            │
│  COVERAGE GAPS                            │
│   Live demo not run                       │
│   Video walkthrough not analyzed          │
│   → needs human review                    │
│  ─────────────                            │
│  RISK FLAGS                               │
│   🚩 Plagiarism 3 funcs                   │
│   ⏱ Timing 4 min after v1                │
│  ─────────────                            │
│  ⏱ Saved you ~28 min                      │
│  [ Full rationale ]                       │
└───────────────────────────────────────────┘
```

### 3.9 Approval Action Hierarchy (Pane B bottom · sticky 120 px)

```
┌─ Decision toolbar (sticky bottom) ───────────┐
│  YOUR CONFIDENCE                              │
│  ● High   ○ Med   ○ Low                       │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │  ✓  Accept                          │     │   ← primary, forest, 44 px
│  └─────────────────────────────────────┘     │
│  ┌─────────────────────────────────────┐     │
│  │  ↺  Request Rework                  │     │   ← secondary, amber outline
│  └─────────────────────────────────────┘     │
│  [ More ▾ ]                                   │   ← tertiary
│    Reject · Escalate · Release · Save draft   │
└───────────────────────────────────────────────┘
```

### 3.10 Audit Visibility (Pane C bottom · collapsed)

```
┌─ Audit (collapsed, 235 × 56) ────────────┐
│  4 events · last @14:08                   │
│  [ expand ]                               │
└───────────────────────────────────────────┘

On expand → opens right-overlay drawer (420 × full height):

┌─ Audit drawer ──────────────────────────────────────────┐
│  Decision audit · r-4821                          [ ✕ ] │
│  ─────────────                                          │
│  May 23 14:08  AI v3.2 generated rubric proposal        │
│                Conf 71 % medium · 4/5 pre-filled        │
│                                                         │
│  May 23 14:21  R. Verma claimed item                    │
│                                                         │
│  May 23 14:23  R. Verma overrode C3 (AI:3 → R:5 +2)     │
│                Reasoning: "spec §4.3 added post-cutoff" │
│                                                         │
│  May 23 14:24  R. Verma added 2 feedback items          │
│                                                         │
│  May 23 14:25  R. Verma confirmed Rework (round 2)      │
│  ─────────────                                          │
│  [ Export JSON ]  [ Verify signature ]  [ Ledger ]      │
└─────────────────────────────────────────────────────────┘
```

### 3.11 Variant Inventory for Submission Review

| Variant | When |
|---|---|
| Default (round 1, no banner) | first review |
| Round 2+ banner | round > 1 |
| AI ready (quick-confirm) | AI conf ≥ 90% + no risks + complete evidence |
| Continuity flag banner | same reviewer reviewed prior round |
| Read-only after decision | post-decide state |
| Governance hold banner | item on hold |
| Risk flag banner | plagiarism / timing / integrity |
| Draft state | mid-rubric edit |
| Loading | 3-pane skeleton |
| Error | banner above 3-pane |

---

## 4. Rework & Escalation Screens

### 4.1 Rework Composer (Modal · 640 × variable)

```
╔═══ Modal · Request Rework ════════════════════════════════════════════════╗
║                                                                          [✕]║
║  Request rework · v2 → v3                                                  ║
║  Round 2 of 3   ⚠ Round 3 auto-escalates to mentor                         ║
║  ────────────────                                                          ║
║                                                                            ║
║  ANCHORED REWORK ITEMS                                                     ║
║  Auto-populated from rubric criteria below 4 stars.                        ║
║                                                                            ║
║  ┌─ Item 1 · C5 Accessibility (2/5) ───────────────────────────────┐     ║
║  │  SEVERITY    ● Blocker   ○ Major   ○ Nit                          │     ║
║  │                                                                    │     ║
║  │  WHAT NEEDS TO CHANGE (contributor sees)                          │     ║
║  │  Templates: [ Missing req ▾ ]  [ Suggested fix ▾ ]                │     ║
║  │  ┌────────────────────────────────────────────────────────┐      │     ║
║  │  │  Keyboard nav broken: focus trap missing in modal.      │      │     ║
║  │  │  Suggested: use react-aria's <FocusScope> wrapper.      │      │     ║
║  │  └────────────────────────────────────────────────────────┘      │     ║
║  │                                                                    │     ║
║  │  INTERNAL NOTE                                                    │     ║
║  │  ┌────────────────────────────────────────────────────────┐      │     ║
║  │  │                                                          │      │     ║
║  │  └────────────────────────────────────────────────────────┘      │     ║
║  │  [ Remove item ]                                                  │     ║
║  └────────────────────────────────────────────────────────────────────┘     ║
║                                                                            ║
║  ┌─ Item 2 · C4 Testing (3/5) ─────────────────────────────────────┐     ║
║  │  SEVERITY    ○ Blocker   ● Major   ○ Nit                          │     ║
║  │  WHAT NEEDS TO CHANGE                                             │     ║
║  │  Templates: ...                                                   │     ║
║  │  ┌────────────────────────────────────────────────────────┐      │     ║
║  │  │  Test coverage at 62 %, threshold 80 %.                  │      │     ║
║  │  └────────────────────────────────────────────────────────┘      │     ║
║  └────────────────────────────────────────────────────────────────────┘     ║
║                                                                            ║
║  [ + Add criterion ]                                                       ║
║  ────────────────                                                          ║
║                                                                            ║
║  WHAT WORKED (required · contributor sees)                                 ║
║  ┌──────────────────────────────────────────────────────────────────┐    ║
║  │  Strong component composition. Clean test structure.              │    ║
║  └──────────────────────────────────────────────────────────────────┘    ║
║                                                                            ║
║  REWORK DEADLINE   [ 2026-05-26 ▾ ]  (3 days, editable)                    ║
║                                                                            ║
║  ROUTING ON RESUBMIT                                                       ║
║   ○ Same reviewer (continuity)                                             ║
║   ● Fresh reviewer (anti-rubber-stamp) — default after round 1             ║
║                                                                            ║
║  YOUR CONFIDENCE   ● High  ○ Med  ○ Low                                    ║
║                                                                            ║
║  DOWNSTREAM IMPACT                                                         ║
║   ↺ Workroom reopens with criterion-anchored items                         ║
║   ↺ Version increments to v3                                               ║
║   ↺ SLA resets                                                             ║
║   ⚠ Round 3 (if needed) auto-escalates                                     ║
║                                                                            ║
║  [ Cancel ]    [ Save draft ]    [ Confirm Rework ]                        ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### 4.2 Reject Composer (Modal · 640 × variable)

```
╔═══ Modal · Reject submission ═════════════════════════════════════════════╗
║  Reject submission                                                    [ ✕ ]║
║  ⚠ Rejection is irreversible without dispute                               ║
║  ────────────────                                                          ║
║                                                                            ║
║  REJECTION REASON (required)                                               ║
║   ○ Scope failure — doesn't address the task                              ║
║   ○ Quality failure — execution below threshold                           ║
║   ○ Evidence failure — required artifacts missing/unverifiable            ║
║   ● Conduct failure — plagiarism, fraud, policy violation                 ║
║                                                                            ║
║  DOWNSTREAM ROUTE                                                          ║
║   ● Reassign — task returns to pool                                       ║
║   ○ Terminate task — no reassignment                                      ║
║                                                                            ║
║  WHAT WORKED (required · contributor sees)                                 ║
║  ┌──────────────────────────────────────────────────────────────────┐    ║
║  │                                                                    │    ║
║  └──────────────────────────────────────────────────────────────────┘    ║
║                                                                            ║
║  REASONING (required · contributor sees · ≥ 50 chars)                      ║
║  ┌──────────────────────────────────────────────────────────────────┐    ║
║  │                                                                    │    ║
║  └──────────────────────────────────────────────────────────────────┘    ║
║                                                                            ║
║  INTERNAL NOTE                                                             ║
║  ┌──────────────────────────────────────────────────────────────────┐    ║
║  │                                                                    │    ║
║  └──────────────────────────────────────────────────────────────────┘    ║
║                                                                            ║
║  YOUR CONFIDENCE   ○ High  ○ Med  ○ Low                                    ║
║                                                                            ║
║  DOWNSTREAM IMPACT                                                         ║
║   ✗ No payout for this submission                                          ║
║   ✗ Reputation: contributor Δ -3, reviewer Δ +1                            ║
║   ⚠ Contributor may dispute (7-day window) → routes to mentor              ║
║   This decision will be signed and audited                                 ║
║                                                                            ║
║  [ Cancel ]                                  [ Confirm Reject ]            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### 4.3 Clarification Request (Side drawer · 420 × variable)

```
┌─ Ask contributor for clarification ─────────────────────────┐
│  Question (contributor sees this):                     [ ✕ ] │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Could you walk me through the keyboard nav         │    │
│  │  decisions for the date picker?                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Pause SLA while waiting?                                    │
│   ○ Yes — pauses the SLA timer                               │
│   ● No — keep SLA running                                    │
│                                                              │
│  Expected response by: [ 2026-05-24 ]                        │
│                                                              │
│  [ Cancel ]    [ Send question ]                             │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Escalation Composer (Modal · 640 × variable)

```
╔═══ Modal · Raise escalation ══════════════════════════════════════════════╗
║  Raise escalation                                                     [ ✕ ]║
║  Item: Build accessible date picker · v2 · c4821                           ║
║  ────────────────                                                          ║
║                                                                            ║
║  TYPE (required)                                                           ║
║   ○ SLA breach risk        ○ Quality dispute                              ║
║   ● Spec ambiguity         ○ Contributor conduct                          ║
║   ○ Reassignment needed    ○ Tooling / platform failure                   ║
║                                                                            ║
║  ROOT CAUSE (required · drives analytics)                                  ║
║   ○ Reviewer capacity         ○ Quality threshold unclear                  ║
║   ○ Timeline infeasibility    ● Ambiguous specification                    ║
║   ○ Contributor conduct       ○ Tooling failure                            ║
║   ○ Cross-team dependency     ○ Policy gap                                 ║
║                                                                            ║
║  TARGET TIER (auto-selected · editable)                                    ║
║   ● Reviewer pool lead   ○ Mentor   ○ Enterprise admin   ○ Platform admin ║
║                                                                            ║
║  PAUSE REVIEW?                                                             ║
║   ● Pause review and SLA                                                   ║
║   ○ Continue in parallel                                                   ║
║                                                                            ║
║  Resolution SLA   24 h · breach at May 24 14:25                            ║
║                                                                            ║
║  DESCRIPTION (≥ 20 chars · required)                                       ║
║  ┌──────────────────────────────────────────────────────────────────┐    ║
║  │                                                                    │    ║
║  └──────────────────────────────────────────────────────────────────┘    ║
║                                                                            ║
║  Frozen snapshot of review item attached.                                  ║
║                                                                            ║
║  [ Cancel ]                                  [ Raise escalation ]          ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### 4.5 Escalation Resolve Drawer (Side drawer · 560 × variable)

```
┌─ Resolve escalation · esc-7821 ─────────────────────────────────────┐
│  Spec ambiguity · Auth modal redesign                          [ ✕ ] │
│  Raised by R. Verma · routed to you · 18 of 24h used                 │
│  ─────────────                                                       │
│                                                                      │
│  CONTEXT                                                             │
│  Frozen snapshot from May 22 18:04                                   │
│  Item: r-3902 · v3 · round 3 of 3                                    │
│  Contributor: c5102                                                  │
│  Description:                                                        │
│   "Spec §4.2 conflicts with §4.7 on session timeout behavior         │
│    after step-up auth. Contributor's interpretation differs from     │
│    mine. Need product owner ruling."                                 │
│                                                                      │
│  ─────────────                                                       │
│  RELATED EVIDENCE                                                    │
│   ▸ Original spec document                                           │
│   ▸ Q&A thread with c5102                                            │
│   ▸ Reviewer R. Verma's prior reviews                                │
│                                                                      │
│  ─────────────                                                       │
│  RESOLUTION                                                          │
│   ● Resolve in favor of reviewer interpretation                      │
│   ○ Resolve in favor of contributor interpretation                   │
│   ○ Update spec (request enterprise amendment)                       │
│   ○ Reassign reviewer (continuity broken)                            │
│   ○ Escalate to enterprise admin                                     │
│                                                                      │
│  RESOLUTION NOTES (required · ≥ 30 chars)                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  NOTIFY                                                              │
│   ☑ Reviewer (R. Verma)                                              │
│   ☑ Contributor (c5102)                                              │
│   ☐ Enterprise admin                                                 │
│                                                                      │
│  [ Cancel ]    [ Submit resolution ]                                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.6 Governance Hold Block (Modal · 480 × variable)

```
╔═══ Governance hold ═══════════════════════════════════════════╗
║  This item is on hold by compliance                       [ ✕ ]║
║  ─────────────                                                 ║
║                                                                ║
║  REASON                                                        ║
║  Legal review of data sensitivity                              ║
║                                                                ║
║  HELD BY                                                       ║
║  J. Khan · Legal officer                                       ║
║                                                                ║
║  HELD SINCE                                                    ║
║  May 22 09:00                                                  ║
║                                                                ║
║  EXPECTED RELEASE                                              ║
║  May 25                                                        ║
║                                                                ║
║  ─────────────                                                 ║
║  You cannot decide on held items.                              ║
║  ─────────────                                                 ║
║                                                                ║
║  [ Watch this item ]   [ Contact J. Khan ]   [ Close ]         ║
╚════════════════════════════════════════════════════════════════╝
```

### 4.7 Risk Review Panel (inline in Pane C, when risk flags present)

```
┌─ Risk flags raised by AI (235 × 240) ────┐
│  🚩 PLAGIARISM                            │
│   3 functions overlap public-repo X       │
│   Match confidence: 88 %                  │
│   [ View report ]                         │
│   [ Mark as fair-use ]                    │
│   [ Mark as violation ]                   │
│  ─────────────                            │
│  ⏱ TIMING ANOMALY                         │
│   v2 submitted 4 min after v1 feedback    │
│   Pattern: likely automated response      │
│   [ View timing pattern ]                 │
│  ─────────────                            │
│  ⚠ Must be acknowledged before Accept     │
└───────────────────────────────────────────┘
```

**Acknowledgment requirement:** clicking Accept opens a soft-block modal:

```
╔═══ Acknowledge risk flags ═══════════════════════════╗
║  Two risk flags are unresolved on this item.    [ ✕ ] ║
║  ─────────────                                        ║
║  🚩 Plagiarism (3 funcs overlap)                       ║
║   Acknowledge reasoning:                              ║
║   ┌────────────────────────────────────────────┐     ║
║   │  Reviewed; fair-use of common patterns.     │     ║
║   └────────────────────────────────────────────┘     ║
║                                                       ║
║  ⏱ Timing anomaly                                     ║
║   Acknowledge reasoning:                              ║
║   ┌────────────────────────────────────────────┐     ║
║   │  Reviewed live demo; contributor present.   │     ║
║   └────────────────────────────────────────────┘     ║
║                                                       ║
║  Both acknowledgments are logged to the audit.        ║
║                                                       ║
║  [ Cancel ]              [ Continue to Accept ]        ║
╚═══════════════════════════════════════════════════════╝
```

### 4.8 Blocked Workflow Resolution Widget (inline on detail page)

```
┌─ Blocked: legal hold ────────────────────────────────────────────────┐
│  Held since   May 22 09:00                                            │
│  Held by      J. Khan (Legal officer)                                 │
│  Reason       Data sensitivity classification review                  │
│  Expected     May 25                                                  │
│  ─────────────                                                        │
│  TIMELINE                                                             │
│   May 22 09:00  Hold placed                                           │
│   May 22 11:30  Legal team notified                                   │
│   May 23 09:00  Awaiting external classifier response                 │
│  ─────────────                                                        │
│  [ Watch ]   [ Notify on release ]   [ Message J. Khan ]              │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 5. AI Explainability — Component Library

### 5.1 Reasoning Card (the canonical AI suggestion block)

**Three sizes, same content scheme:**

```
SIZE-S (inline, 1 line)
🤖 ★★★☆☆ (3/5) · 71 % medium · "missing keyboard nav, SR labels"

SIZE-M (rubric criterion, ~120 px tall)
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI SUGGESTS  ★★★☆☆ (3/5) · 71 % medium                    │
│ "Covers 4 of 6 requirements. Missing: keyboard nav, SR."    │
│ Source: spec §4.2 · Not reviewed: live demo                 │
│ [ Accept (3) ]  [ Edit ]  [ Reject suggestion ]              │
└─────────────────────────────────────────────────────────────┘

SIZE-L (full report modal, see § 6.4 of UX Architecture)
```

### 5.2 Confidence Indicator (canonical token usage)

```
HIGH      ≥90 %    ●  forest      [ 🤖 94 % high   ]
MEDIUM    70–89 %  ◐  amber       [ 🤖 71 % medium ]
LOW       <70 %    ○  crimson     [ 🤖 54 % low    ]

Reviewer confidence shares vocabulary:
[ 👤 You: High ]   [ 👤 You: Med ]   [ 👤 You: Low ]

Combined surface (decision header):
[ 🤖 71 % medium · 👤 You: High ]   ← exposes disagreement
```

### 5.3 Override Pattern (the canonical 3-action triplet)

```
Always presented as a horizontal triplet directly under any AI suggestion:

[ ✓ Accept suggestion (3) ]   [ ✎ Edit ]   [ ✗ Reject suggestion ]

Audit payload on click:

Accept:  { ai: 3, human: 3, delta: 0 }
Edit:    { ai: 3, human: <new>, delta, reason_optional }
Reject:  { ai: 3, human: <new>, delta, reason_required }
```

**Edit reason prompt** (small modal, 360 × variable):

```
┌─ Why did you change from 3 to 5? (optional) ──────┐
│ ┌─────────────────────────────────────────────┐  │
│ │  Spec §4.3 added a new requirement after AI  │  │
│ │  cutoff. This submission addresses it.        │  │
│ └─────────────────────────────────────────────┘  │
│ [ Skip ]    [ Save ]                              │
└───────────────────────────────────────────────────┘
```

### 5.4 Traceability Indicator (decision-level)

```
┌─ AI/Human trace (component, 360 × 220) ──────────────────────────┐
│  Criterion        AI sug  Human  Delta   Reason                   │
│  ─────────────────────────────────────────────────────────────── │
│  C1 Code Quality  4       4      0       accepted                 │
│  C2 Completeness  4       5      +1      "exceeds doc standard"  │
│  C3 Requirements  3       5      +2      "spec post-cutoff"      │
│  C4 Testing       4       4      0       accepted                 │
│  C5 Accessibility 2       2      0       accepted                 │
│  ─────────────────────────────────────────────────────────────── │
│  Aggregate:  AI 3.4 · Human 4.0 · Delta +0.6                      │
│  Within your typical pattern (+0.5 avg, 90d)                      │
└────────────────────────────────────────────────────────────────────┘
```

### 5.5 AI Recommendation Module (the queue-row AI chip)

```
On queue row, AI takes 96 px column:

[ 🤖 94 %      ]      ← confidence + ready state
[  high · AI ready ]

Variants:
   AI ready  (≥90 % + all criteria pre-filled + no risks)
   AI prep   (medium + partial pre-fill)
   AI weak   (low + needs full human review)
   AI risk   (any conf + risk flag raised)
   AI N/A    (system bypassed AI for this item)
```

### 5.6 AI Partnership Ledger (insights page module)

```
┌─ Your AI partnership (last 90 d) ──────────────────────────────────────┐
│                                                                          │
│  AGREEMENT                                                               │
│   Decisions AI pre-filled         287                                    │
│   You accepted suggestion         210 (73 %)                             │
│   You edited                       63 (22 %)                             │
│   You rejected                     14 (5 %)                              │
│                                                                          │
│  CALIBRATION                                                             │
│   AI HIGH    (≥90 %):   you agreed 91 % of the time                      │
│   AI MEDIUM  (70-89 %): you agreed 68 %                                  │
│   AI LOW     (<70 %):   you agreed 41 %                                  │
│                                                                          │
│   Verdict: HIGH well-calibrated · MEDIUM over-confident                  │
│                                                                          │
│  SYSTEMATIC DISAGREEMENT                                                 │
│   C5 (A11y) on React work: +1.2 above AI                                 │
│   C3 (Requirements) on rework v2+: -0.4 below AI                         │
│                                                                          │
│  IMPACT                                                                  │
│   Estimated time saved: ~14 h / week                                     │
│   Risks caught: AI 18 · You 9 · Both 4                                   │
│                                                                          │
│  [ See decision log ]   [ Tune AI partnership preferences ]              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. State-Based Screen Variations

For each major state: visual differences, action changes, escalation changes, operational behavior.

### 6.1 State · PENDING

```
Visual diff:    SLA tier sets the chip color
                slate base background
                "Claim" CTA in row's hover action

Actions:        Primary: Claim
                Secondary: snooze · watch · escalate (mentor)

Escalation:     Auto-escalate on SLA breach

Operational:    Available to claim by any pool reviewer
                AI pre-rubric cached
```

**Queue row (Pending):**

```
☐  🔴 -8h    Refactor billing svc   c1142    v2-R    🤖 78%   SLA+P0  ⋮
              Node · Stripe · Acme · P0     Reliab 71  round 2  med
              [ Hover → Claim ]
```

### 6.2 State · REVIEWING (Claimed → In Review → Decision Pending)

```
Visual diff:    Indigo "claimed by R. Verma" badge for others
                Full editable Pane B for the lock-holder
                Autosave indicator in top strip

Actions:        Primary: rubric · feedback · decide
                Secondary: release · escalate · save draft · snooze

Escalation:     Reviewer-initiated · auto on SLA breach

Operational:    Presence lock held; auto-release on idle
                Draft autosaved every 10 s
```

**Detail page header (Reviewing):**

```
┌─ Top strip (Reviewing) ─────────────────────────────────────────────┐
│  ← Queue   Build a11y date picker · v2 · Rework r2/3                 │
│  ⚠ 2h SLA · 🤖 94 % high · Saved 2s ago                              │
│                          [ Release ] [ Escalate ] [ More ▾ ]         │
└──────────────────────────────────────────────────────────────────────┘
```

**Queue row (claimed by other):**

```
☐  ⚠ 2h     Build a11y date picker  c4821   v2-R   🤖 94%   ─── ⋮
              [ Claimed by K. Singh · 18 min ago ]
```

### 6.3 State · ACCEPTED

```
Visual diff:    Forest "Accepted" pill in header
                Pane B replaced by Decision Summary
                Read-only

Actions:        Primary: (none for reviewer)
                Secondary: see enterprise acceptance status · dispute (if eligible)

Escalation:     N/A unless disputed

Operational:    Audit signed · contributor notified · bundle rollup updated
                Payout eligibility = ENGAGED
```

**Header (Accepted):**

```
┌─ Top strip (Accepted) ───────────────────────────────────────────────┐
│  ← Queue   Build a11y date picker · v2                                │
│  ✓ Accepted by R. Verma · May 23 14:25 · 0xa3…e1                      │
│                          [ Export audit ] [ See bundle ]              │
└───────────────────────────────────────────────────────────────────────┘
```

**Pane B replaced with summary card:**

```
┌─ Decision summary (Pane B) ─────────────────────────┐
│  ACCEPTED                                            │
│  Reviewer:  R. Verma                                 │
│  When:      May 23 14:25                             │
│  Conf:      ● High                                   │
│  Rubric:    4.4 / 5 average                          │
│  AI agree:  88 % (4/5)                               │
│  Audit:     0xa3…e1                                  │
│  ─────────────                                       │
│  Downstream                                          │
│   $1,200 payout queued                               │
│   Credential progress: 3 of 4 → L3                   │
│   Enterprise final acceptance: PENDING               │
│   Bundle status: 3 of 4 sub-submissions accepted     │
└──────────────────────────────────────────────────────┘
```

### 6.4 State · REJECTED

```
Visual diff:    Crimson "Rejected" pill in header
                Reasoning + What worked prominent in Pane B
                Contributor dispute banner

Actions:        Primary: (none for reviewer)
                Secondary: see dispute status · history

Escalation:     Contributor dispute → mentor

Operational:    Audit signed · contributor notified · 7-day dispute window
```

**Header (Rejected):**

```
┌─ Top strip (Rejected) ──────────────────────────────────────────────┐
│  ← Queue   Build a11y date picker · v2                               │
│  ✗ Rejected by R. Verma · May 23 · scope failure · 0xb4…c2           │
│                          [ Export audit ] [ See dispute window ]     │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.5 State · ESCALATED

```
Visual diff:    Crimson "Escalated" banner above 3-pane
                Frozen snapshot link
                Pane B disabled if paused; active if parallel

Actions:        If paused: rubric/decide disabled
                If parallel: cannot finalize until escalation resolves

Escalation:     Further escalation possible

Operational:    Escalation ticket with own SLA
                Original SLA paused/continues per pause flag
```

**Banner (Escalated):**

```
┌─ Escalation banner ───────────────────────────────────────────────────┐
│  🚨 ESCALATION IN PROGRESS                                              │
│  Type: Spec ambiguity · Target: Reviewer pool lead · SLA 18 of 24h    │
│  Status: Acknowledged by L. Mehta · awaiting enterprise clarification  │
│  [ See escalation ]   [ Frozen snapshot ]                              │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.6 State · BLOCKED

```
Visual diff:    Crimson banner with block reason and holder
                Pane B disabled (drafts allowed; confirms blocked)
                Resolution timeline widget visible

Actions:        Primary: watch · notify on release
                Reviewer cannot confirm any decision

Escalation:     If hold exceeds N days, auto-escalate to platform admin

Operational:    SLA timer paused
                Block holder notified
```

**Block banner:**

```
┌─ Block banner ────────────────────────────────────────────────────────┐
│  🛑 BLOCKED                                                            │
│  Reason: file integrity (SHA mismatch detected on artifact.zip)        │
│  Holder: System · since May 23 09:00                                   │
│  Resolution: contributor must re-upload                                │
│  [ Watch ]   [ Notify on release ]                                     │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.7 State · GOVERNANCE HOLD

```
Visual diff:    Crimson Hold banner with named holder
                Modal block on any decision attempt
                Resolution timeline + contact affordance

Actions:        Watch · Contact holder

Escalation:     N/A — hold is the escalation

Operational:    SLA paused · audit event with hold metadata
```

**Decision attempt produces the block modal (§ 4.6 above).**

### 6.8 State · SLA BREACH RISK (overlay, tier-dependent)

```
Visual diff:    Tier color overrides primary state's calm tones
                At Critical+: warning banner at top of detail page
                At Breached: pulse animation on chips

Actions:        Acceleration affordances (snooze NOT available at Critical+)

Escalation:     Auto-escalate on Breached

Operational:    Tier transitions audited
                Push notifications fired at Critical
                Pool lead notified at Breached
```

**Banner (Critical SLA):**

```
┌─ SLA banner (Critical) ──────────────────────────────────────────────┐
│  ⚠ CRITICAL · 1h to SLA breach                                        │
│  Auto-escalation rule: at -0h, this item routes to your pool lead.   │
│  [ Decide now ]   [ Escalate manually ]   [ Extend SLA (mentor) ]    │
└────────────────────────────────────────────────────────────────────────┘
```

**Banner (Breached):**

```
┌─ SLA banner (Breached) ──────────────────────────────────────────────┐
│  🔴 OVERDUE · 8h past SLA · auto-escalating in 12 min                 │
│  Reassignment may occur if not decided.                                │
│  [ Decide now ]   [ Escalate now ]   [ Extend SLA (mentor) ]          │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.9 State transition cheat-sheet (visual edition)

```
PENDING     →   slate chip, "Claim" hover                Claim
              ↓
REVIEWING   →   indigo presence badge, autosave         Decide
              ↓
DECISION
PENDING     →   amber modal open, blocking              Confirm
              ↓
   ↓ Accept                                  ↓ Reject               ↓ Rework
ACCEPTED    →   forest pill                  REJECTED → crimson     REWORK → amber pill
              ↓                                                       ↓
Bundle/EnterpriseFinal                       (dispute window)         (workroom reopens
                                                                       v++ · SLA reset)

Overlays:
   SLA RISK         →   tier-color overlay on all non-terminal states
   BLOCKED          →   crimson banner; suspends decide
   GOV HOLD         →   crimson banner; suspends decide
   ESCALATED        →   crimson banner; pauses or parallel
```

---

## 7. Enterprise UX Interaction Patterns

### 7.1 Enterprise Table Behaviors

```
Behavior              Implementation
──────────────────────────────────────────────────────────────────────────────────
Sticky header         table header stays visible on scroll
Row hover             subtle bg tint (no zebra), pointer cursor on title
Row click             opens detail; preserves queue scroll position
Multi-select          checkbox column 1; shift-click range; cmd-click toggle
Keyboard nav          J/K cycle rows; Enter opens; A claims; S snooze
Resize columns        no (compact, designed widths)
Reorder columns       no (designed reading order)
Sort                  click header to cycle asc/desc/none
Group                 explicit toggle, not click-header behavior
Filter                external (chip row + dropdowns)
Density               compact default · comfortable toggle in prefs
Empty                 dedicated component with retry affordance
Loading               row skeletons matching row height
Error                 banner above table + per-row error if individual fetch fails
Virtualization        rows > 100 items; preserves scroll position on filter change
```

### 7.2 Review Interaction Pattern

```
Pattern                              Mechanism
─────────────────────────────────────────────────────────────────────────────────
Claim before edit                    presence lock acquired on first interaction
Draft autosave                       every 10s; banner "Saved {N}s ago"
AI suggestion accept/edit/reject     three-button triplet under each AI block
Per-criterion expand/collapse        ▸/▾ chevron; auto-expand on focus
Templates injection                  cursor-position insertion; non-destructive
Confidence required to decide        Accept/Reject disabled until set
Sticky toolbar                       Pane B bottom; primary action one tap away
Keyboard for primary actions         A/R/X/E + Cmd+Enter to confirm
Cancel preserves draft               modal Cancel never loses field state
Two-step confirm on terminal         every Accept/Reject/Rework
Audit visible inline                 Pane C bottom, expandable
```

### 7.3 Approval Interaction Pattern

```
Pre-Accept gates (all enforced)
   1. All 5 rubric criteria scored
   2. Feedback ≥ 20 chars OR template-populated
   3. Reviewer confidence declared
   4. No unresolved risk flags
   5. No governance hold

Pre-Reject gates
   1. Reason taxonomy selected
   2. What worked field populated
   3. Reasoning ≥ 50 chars
   4. Reviewer confidence declared
   5. Downstream route selected (reassign / terminate)

Pre-Rework gates
   1. ≥ 1 anchored rework item
   2. Severity selected for each
   3. What worked field populated
   4. Deadline set
   5. Routing on resubmit selected
   6. Reviewer confidence declared

Confirmation pattern (universal)
   1. Click primary action → opens confirmation modal
   2. Modal shows: summary + downstream impact + signature notice
   3. Reviewer confirms; signature hash generated; audit written
   4. Toast with audit hash; auto-advance to next item in queue
```

### 7.4 Audit Interaction Pattern

```
Where audit appears
   Detail pages         inline panel in right rail (collapsed default)
   List rows            no audit access in row (drill required)
   History pages        full audit per item in modal/drawer
   Entity timelines     visual audit alongside other events

Audit actions
   Expand               on click "expand" link
   Filter               by actor / event-type / date
   Export               JSON download
   Verify               cryptographic signature check
   Drill                click event → opens related entity

Audit composition
   1 event = 1 row, leading timestamp, actor, action, details
   Multi-line details indent under main row
   Color: subtle; do not compete with primary content
```

### 7.5 Escalation Interaction Pattern

```
Raise
   from review detail → composer modal
   from queue row     → row menu (mentor only)
   from system        → auto-raise on SLA / round 3

Compose
   Type + Root cause + Tier + Pause + Description
   Frozen snapshot attached automatically
   Resolution SLA computed from tier

Route
   Reviewer pool lead    → for SLA breach, capacity
   Mentor                → for quality dispute, conduct, ambiguity
   Enterprise admin      → for spec, scope, terms
   Platform admin        → for tooling, policy

Resolve
   Drawer on click "Resolve" in escalations list
   Resolution radio + notes + notify checkboxes
   Submit resolution → audit event + notifications

Escalate further
   From resolver's drawer if their tier is insufficient
   Creates new escalation linked to original
```

### 7.6 AI Interaction Pattern

```
AI surface invariants (the four primitives)
   Source        clickable to peek the cited evidence
   Confidence    numeric + bucket + color
   Coverage      explicit declaration of what AI couldn't assess
   Override      three-action triplet (Accept/Edit/Reject) on every suggestion

Visual distinction
   🤖 icon always present
   subtle background tint (2 %) on AI blocks
   reviewer input always on plain surface

Friction proportional to risk
   High conf      quick-confirm available
   Medium conf    full review required, soft confirm
   Low conf       cannot quick-confirm, full review required

Override capture
   Accept       0-delta audit event
   Edit         delta audit event + optional reason prompt
   Reject       delta audit event + required reason prompt

Re-analysis
   on contributor resubmit, AI re-analyzes
   delta shown in Pane A Compare tab
   reviewer sees AI's "what changed" view alongside diff
```

---

## 8. Detailed Text Wireframes (additional surfaces)

### 8.1 Decisions / Recent History

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ SIDEBAR ║ DECISIONS · RECENT                                              ║
║          ║                                                                ║
║          ║ ┌─ Filter row ─────────────────────────────────────────────┐  ║
║          ║ │ [ Decision ▾ ] [ Date ▾ ] [ Skill ▾ ] [ Confidence ▾ ]    │  ║
║          ║ │ [ Project ▾ ]                                              │  ║
║          ║ └────────────────────────────────────────────────────────────┘  ║
║          ║                                                                ║
║          ║ ┌─ Table ───────────────────────────────────────────────────┐  ║
║          ║ │ Decision   Task                Contrib   Time  Conf  Audit │  ║
║          ║ │ ────────────────────────────────────────────────────────── │  ║
║          ║ │ ✓ Accept   Date picker         c4821    14:25  ● High  ↗   │  ║
║          ║ │ ↺ Rework   Auth modal          c5102    13:48  ● High  ↗   │  ║
║          ║ │ ✓ Accept   Newsletter signup   c8044    12:11  ◐ Med   ↗   │  ║
║          ║ │ ✗ Reject   Payment integ.      c2390    11:02  ● High  ↗   │  ║
║          ║ │ ✓ Accept   Mobile nav          c4821    10:18  ● High  ↗   │  ║
║          ║ │ ↺ Rework   Form validation     c5102    09:42  ◐ Med   ↗   │  ║
║          ║ └────────────────────────────────────────────────────────────┘  ║
║          ║                                                                ║
║          ║ ┌─ Footer pagination ──────────────────────────────────────┐  ║
║          ║ │ Showing 6 of 92                          [ < ] 1 / 16 [ > ] │  ║
║          ║ └────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### 8.2 Decisions / Reworks in Flight

```
┌─ Reworks in flight (7) ──────────────────────────────────────────────────┐
│                                                                          │
│  ROUND 1 → 2  (4)                                                        │
│   ▸ Date picker · c4821 · v2 due May 26 · 1d left                        │
│   ▸ Auth modal  · c5102 · v2 due May 27 · 2d left                        │
│   ...                                                                    │
│                                                                          │
│  ROUND 2 → 3  (2)   ⚠ next round auto-escalates                          │
│   ▸ Billing svc · c1142 · v3 due May 25 · breached                       │
│   ▸ Analytics   · c2390 · v3 due May 28                                  │
│                                                                          │
│  ROUND 3 → ESCALATED  (1)                                                │
│   ▸ Reports API · c8044 · escalated to mentor                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Mentorship · Sessions Today

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ SIDEBAR ║ MENTORSHIP · TODAY                                              ║
║          ║                                                                ║
║          ║ ┌─ Today calendar strip ──────────────────────────────────┐   ║
║          ║ │  10  11  12  13  14  15  16  17  18  19   (1h marks)    │   ║
║          ║ │              │NOW                                          │   ║
║          ║ │       ▭ 4PM     ▭ 5PM     ▭ 6PM                          │   ║
║          ║ └──────────────────────────────────────────────────────────┘   ║
║          ║                                                                ║
║          ║ ┌─ Sessions list ───────────────────────────────────────────┐  ║
║          ║ │ 4:00 PM  c4821 · A11y coaching · 45 min · Scheduled       │  ║
║          ║ │   Context: r-4821 (date picker, v2 rework)                 │  ║
║          ║ │   Linked items: 2 · Skill gaps: keyboard nav, SR testing  │  ║
║          ║ │   [ Begin session ]                                        │  ║
║          ║ │   ────────────                                             │  ║
║          ║ │ 5:00 PM  c5102 · Test strategy · 30 min · Scheduled        │  ║
║          ║ │   Context: skill coaching                                  │  ║
║          ║ │   [ Begin session ]                                        │  ║
║          ║ │   ────────────                                             │  ║
║          ║ │ 6:00 PM  c6710 · Onboarding · 60 min · Scheduled           │  ║
║          ║ │   Context: new contributor                                 │  ║
║          ║ │   [ Begin session ]                                        │  ║
║          ║ └────────────────────────────────────────────────────────────┘  ║
║          ║                                                                ║
║          ║ ┌─ Active contributors strip (8) ──────────────────────────┐  ║
║          ║ │ c4821 · c5102 · c6710 · c8044 · c2390 · ...               │  ║
║          ║ └────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### 8.4 Mentorship · Session Detail (in-session)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ SIDEBAR ║ SESSION · c4821 · A11y coaching                                 ║
║          ║                                                                ║
║          ║ ┌── Pane Left 60 % ────────────────┐ ┌── Pane Right 40 % ────┐ ║
║          ║ │  AGENDA                            │  CONTRIBUTOR           │ ║
║          ║ │  1. Review v2 of date picker       │  c4821 · L3 React      │ ║
║          ║ │  2. Focus trap patterns            │  Reliability 87        │ ║
║          ║ │  3. Aria-label conventions         │  Velocity 72 %         │ ║
║          ║ │  4. Resources                      │  ────────              │ ║
║          ║ │                                    │  PRIOR SESSIONS (3)    │ ║
║          ║ │  LINKED ITEMS                      │   Apr 30 · React patt. │ ║
║          ║ │  ▸ r-4821 (date picker, v2)        │   May 8  · A11y intro  │ ║
║          ║ │  ▸ r-3902 (auth modal, v3)         │   May 14 · A11y deep   │ ║
║          ║ │                                    │  ────────              │ ║
║          ║ │  SESSION NOTES                     │  SKILL GAPS            │ ║
║          ║ │  ┌─────────────────────────────┐  │   ▸ Keyboard nav       │ ║
║          ║ │  │  (editor)                    │  │   ▸ SR testing         │ ║
║          ║ │  └─────────────────────────────┘  │  ────────              │ ║
║          ║ │                                    │  STRENGTHS             │ ║
║          ║ │  NEXT ACTIONS                      │   ▸ Composition        │ ║
║          ║ │  ┌─────────────────────────────┐  │   ▸ Test structure     │ ║
║          ║ │  │  (action list)               │  │                        │ ║
║          ║ │  └─────────────────────────────┘  │                        │ ║
║          ║ └────────────────────────────────────┘ └────────────────────────┘ ║
║          ║                                                                ║
║          ║ [ Save draft ]  [ Escalate concern ]  [ Complete session ]    ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### 8.5 Insights / Pool Health

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ SIDEBAR ║ POOL HEALTH [mentor]                                            ║
║          ║                                                                ║
║          ║ ┌─ KPI strip (4 tiles) ────────────────────────────────────┐  ║
║          ║ │  CAPACITY     SLA HIT     THROUGHPUT     AI PARTNERSHIP   │  ║
║          ║ │  53/60 88%    91% ▼3%     127/175 wk     74 % agree       │  ║
║          ║ └────────────────────────────────────────────────────────────┘  ║
║          ║                                                                ║
║          ║ ┌─ Per-reviewer table ───────────────────────────────────────┐  ║
║          ║ │ Reviewer    Cap          Today  Wk  SLA  Time   Status     │  ║
║          ║ │ R. Verma    █████░ 18/25   6    28   96%  1.7h  ●●●         │  ║
║          ║ │ K. Singh    ████░░ 11/25   4    19   94%  1.9h  ●●●         │  ║
║          ║ │ L. Mehta    ██████▲ 24/20  0    8    72% ⚠ 3.4h ⚠ ●●○      │  ║
║          ║ │ A. Iyer     ░░░░░░  0/25   -    -    -    -     ⚫⚫⚫        │  ║
║          ║ └─────────────────────────────────────────────────────────────┘  ║
║          ║                                                                ║
║          ║ ┌─ Calibration drift (heatmap) ─────────────────────────────┐  ║
║          ║ │  [ Heatmap: reviewer × criterion × delta vs pool median ] │  ║
║          ║ │  L. Mehta: +0.8 on C1 (Code Quality) — drift?              │  ║
║          ║ └────────────────────────────────────────────────────────────┘  ║
║          ║                                                                ║
║          ║ ┌─ Anti-rubber-stamp pairs ────────────────────────────────┐  ║
║          ║ │  R. Verma ↔ c4821  5/7 reviews (71 %) ⚠ continuity risk   │  ║
║          ║ │  K. Singh ↔ c5102  4/6 reviews (66 %) ⚠ monitor           │  ║
║          ║ │  [ Rebalance pairings ]                                    │  ║
║          ║ └────────────────────────────────────────────────────────────┘  ║
║          ║                                                                ║
║          ║ ┌─ Forecast & recommendations ─────────────────────────────┐  ║
║          ║ │  Capacity exceeded by Tue at current intake                │  ║
║          ║ │  ▸ Add 1 reviewer (2 available in reserve)                 │  ║
║          ║ │  ▸ Pause Acme intake 24h                                   │  ║
║          ║ │  ▸ Address spec ambiguity with enterprise                  │  ║
║          ║ └────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### 8.6 Spacing Hierarchy Applied (canonical example)

```
4 px      icon-to-text within a chip                  [ 🤖 94% ]
8 px      within-component padding                    inside a card
12 px     between sibling controls                    label → input
16 px     between sub-sections of a card              feedback → internal note
24 px     between cards within a section              KPI card to next KPI card
32 px     between sections of a page                  Section 1 to Section 2
48 px     between major regions                       top strip to first section
64 px     page top padding                            under top strip
```

### 8.7 Section Hierarchy Applied

```
Page level
  └─ Top strip (sticky)
     └─ Section (e.g., Needs You Now)
        └─ Subsection (e.g., counts row)
           └─ Component (e.g., button group)
              └─ Element (e.g., button)
                 └─ Sub-element (e.g., icon)
```

### 8.8 Content Grouping Rules

```
Group by                              Use when
─────────────────────────────────────────────────────────────────────────
Urgency                               Today landing, queue segments
Entity (item, project, contributor)   review history, mentorship
Decision type                         decisions / recent
Pipeline stage                        SOW approval flow
Role responsibility                   admin vs reviewer vs contributor views
Time recency                          audit, history
```

### 8.9 Action Positioning Rules

```
Primary action          bottom-right of card / modal       (exit-point convention)
Cancel                  bottom-left
Secondary action        next to primary (its left)
Destructive             behind "More ▾" OR with soft-confirm
Lateral action          header or top-right strip
Utility (icon-only)     top-right corner of card
Drawer trigger          inline link, ↗ glyph
Nav (drill)             title click, ↗ glyph for external
```

### 8.10 Operational Priorities Visualized

```
LAYER 1   RED ZONE     "Needs You Now" — only when crisis
LAYER 2   PERSONAL     My queue · My pace · My KPIs
LAYER 3   OPERATIONAL  Bottleneck · Pool health (mentor)
LAYER 4   PASSIVE      Mentorship today · Watchlist

Within any layer:
   1.  Crisis (red)
   2.  Decision-required
   3.  Time-sensitive
   4.  Informational
   5.  Historical
```

---

## 9. Figma Execution Guidance

### 9.1 How to Structure These Screens in Figma

**Top-level file architecture:**

```
GLIMMORA · MENTOR WORKSPACE
├── 01 · Foundations
│   ├── Color tokens
│   ├── Typography tokens
│   ├── Spacing tokens
│   ├── Elevation / shadow
│   ├── Radius
│   ├── Iconography
│   └── Motion specs
├── 02 · Primitives          (atoms)
│   ├── Button
│   ├── Input
│   ├── Chip
│   ├── Badge
│   ├── Avatar
│   ├── Star rating
│   └── ...
├── 03 · Composites          (molecules)
│   ├── SLA Chip
│   ├── Confidence Badge
│   ├── KPI Tile
│   ├── Rubric Criterion (collapsed / expanded variants)
│   ├── Evidence Card
│   ├── Reasoning Card (S / M / L)
│   └── ...
├── 04 · Organisms
│   ├── Queue Row
│   ├── Queue Header
│   ├── Filter Row
│   ├── Decision Toolbar
│   ├── Contributor Peek Card
│   ├── Audit Panel
│   └── ...
├── 05 · Screens             (full pages, one per variant)
│   ├── Today / Mentor / Default
│   ├── Today / Reviewer / Default
│   ├── Today / Empty crisis
│   ├── Queue / Default
│   ├── Queue / Filtered
│   ├── Queue / Selection mode
│   ├── Queue / Empty
│   ├── Review Detail / Default
│   ├── Review Detail / Round 2+
│   ├── Review Detail / AI ready (quick-confirm)
│   ├── Review Detail / Accepted (read-only)
│   ├── Review Detail / Rejected (read-only)
│   ├── Review Detail / Blocked
│   ├── Review Detail / Governance hold
│   ├── Review Detail / Escalated
│   ├── Review Detail / SLA Critical
│   ├── Review Detail / SLA Breached
│   ├── ...
├── 06 · Flows               (linked frames for prototyping)
│   ├── Rework decision flow
│   ├── Reject decision flow
│   ├── Escalation flow
│   ├── Resolve escalation flow
│   ├── Quick-confirm flow
│   └── ...
├── 07 · Specs & Tokens      (build-ready annotations)
└── 08 · Archive             (deprecated / superseded)
```

### 9.2 Component System Recommendations

**Use Figma Variants extensively:**

```
SLA Chip component
  Property "tier"          variants: healthy · watch · warning · critical · breached
  Property "size"          variants: row · header · card
  Property "showTimer"     boolean

Rubric Criterion component
  Property "state"         variants: collapsed · expanded · disabled · ai-pending
  Property "aiAction"      variants: none · accept · edit · reject
  Property "score"         variants: 0 · 1 · 2 · 3 · 4 · 5

Decision Toolbar
  Property "enabled"       boolean per action (accept, rework, reject, escalate)
  Property "confidence"    variants: none · high · medium · low
  Property "primary"       variants: accept · save-draft  (Accept disabled until preconditions)

Queue Row
  Property "slaTier"       variants per tier
  Property "selected"      boolean
  Property "aiReady"       boolean
  Property "riskFlag"      variants: none · plagiarism · timing · anomaly · multiple
  Property "round"         variants: 1 · 2 · 3+
  Property "continuity"    boolean
```

**Auto-layout rules:**

- Every list/row component uses **horizontal auto-layout** with hug-content for inner items and fill-container for the flex column.
- Every card uses **vertical auto-layout** with 8/16/24 px spacing per the canonical spacing scale.
- Three-pane workspace uses **horizontal auto-layout at the workspace level**; each pane uses **vertical auto-layout** internally.
- Sticky elements (top strip, queue header, filter row, decision toolbar) are **absolute-positioned in their parent frames** with sticky behavior emulated via constraints in mocks.

### 9.3 Layout Grid Recommendations

```
Page frame                    1440 × 900
Layout grid                   12 columns · 24 px gutter · 24 px margin
Content max-width             1152 px inside 1200 content frame (24 px L/R)

Within content (1152 px)
  3-pane workspace            588 (Pane A) · 352 (Pane B) · 235 (Pane C) with 12 + 12 gutters
                              = 588 + 12 + 352 + 12 + 235 = 1199 ≈ content frame
  KPI strip                   3 × 360 + 2 × 24 gutters = 1128 px
  Mentorship + Watchlist      560 + 24 + 560 = 1144 px

Modal / drawer frames
  Small modal                 480 × variable, centered
  Standard modal              640 × variable, centered
  Large modal                 840 × variable, centered
  Side drawer                 420 × full-height, right-anchored
  Wide side drawer            560 × full-height, right-anchored
```

### 9.4 Design System Recommendations

**Token naming convention:**

```
color.semantic.{role}.{tier}        e.g., color.sla.critical
color.surface.{purpose}             e.g., color.surface.ai, color.surface.hover
color.text.{purpose}                e.g., color.text.muted, color.text.inverse
color.border.{purpose}              e.g., color.border.subtle, color.border.focus

font.{role}.{property}              e.g., font.body.size, font.title.weight
spacing.{value}                     e.g., spacing.16
radius.{size}                       e.g., radius.md
elevation.{level}                   e.g., elevation.drawer

motion.{name}                       e.g., motion.urgentPulse, motion.peekFade
```

**Style library structure:**

- One central **Design System** library file.
- Mentor Workspace consumes the library only — no local styles.
- Variant icons (AI, source, human) defined as icon components, not raster images.

**Component documentation in Figma:**

Every component carries:
- Description (1 paragraph)
- Variants table
- Anatomy diagram (annotated with token references)
- Usage rules (when to use; when not to)
- Accessibility notes (focus order, contrast, ARIA)
- Code reference (link to `MENTOR_WORKSPACE_UX_EXECUTION_BLUEPRINT.md` Appendix B)

### 9.5 Prototyping Recommendations

**Build prototypes for these critical flows:**

1. **Quick-confirm flow** — high-confidence AI ready item → Accept → next item (the throughput story).
2. **Full review flow** — claim → rubric → AI override → confirmation → audit (the trust story).
3. **Rework flow** — open detail → request rework → compose → confirm → workroom preview (the governance story).
4. **Escalation flow** — encounter spec ambiguity → escalate → mentor resolves → return to flow (the system story).
5. **Bottleneck → rebalance flow** — mentor sees forecast → preview rebalance → execute (the operator story).
6. **AI partnership ledger drilldown** — KPI strip → AI partnership page → decision log → individual decision audit (the explainability story).

### 9.6 Annotations and Specs

Each shipped screen includes a sidebar of annotations:

```
Annotation labels (placed alongside each component):

A1   Sticky behavior
A2   Keyboard shortcut
A3   Hover state transition
A4   Loading state placeholder
A5   Empty state behavior
A6   Error state behavior
A7   Audit event fired
A8   Telemetry event fired
A9   ARIA / accessibility note
A10  Token reference
```

### 9.7 Hand-off Checklist (per screen)

```
Per-screen Figma deliverable must include:
   ☐ Frame at canonical viewport (1440 × 900)
   ☐ All variants for that screen
   ☐ Loading state
   ☐ Empty state
   ☐ Error state
   ☐ Annotated tokens (color, font, spacing)
   ☐ Annotated interactions (hover, focus, click)
   ☐ Annotated telemetry events
   ☐ Annotated accessibility notes
   ☐ Linked to relevant spec section in MENTOR_WORKSPACE_UX_EXECUTION_BLUEPRINT.md
   ☐ Component usage list (which library components used)
```

---

## 10. Product Design Interview Insights

### 10.1 What This Redesign Demonstrates

A complete UX execution at the highest end of enterprise design — IA, screen library, component contracts, state variants, motion, accessibility, telemetry. The portfolio demonstrates:

1. **System-level thinking** — the workspace is not a collection of screens; it's a coherent operating system for a role. Every screen shares vocabulary, behavior, and patterns. The component library is the proof.
2. **Build-readiness** — every wireframe is dimensioned, every state is variant-counted, every interaction has a contract. A front-end engineer can start building from these documents without further design intervention.
3. **Cross-disciplinary fluency** — IA, visual design, motion, accessibility, telemetry, governance, AI HCI, operations research (queue theory, throughput math), and developer empathy all in one artifact.
4. **Stakeholder management baked in** — annotations and acceptance criteria are visible; the designer is not "throwing things over the wall."
5. **Production maturity** — empty states, error states, loading skeletons, keyboard navigation, audit, telemetry — the things that are forgotten in junior design portfolios are foregrounded here.

### 10.2 How This Shows Enterprise UX Maturity

The redesign treats six things that beginners ignore as first-class:

| Maturity marker | How it shows up |
|---|---|
| **Persistence over polish** | The single biggest fix is making toast-only decisions actually persist — not adding a new feature |
| **Empty / loading / error states** | Documented per surface in Appendix C of the blueprint; designed, not afterthought |
| **Audit and signature as UX** | "This decision will be signed and audited" is a UI sentence, not a backend concern |
| **Telemetry as a design output** | Appendix D names 20 events; design specifies the events the product needs to learn |
| **Accessibility specified** | Keyboard map per surface; ARIA notes per component; focus order intentional |
| **Operational reality** | Pace gauge, anti-fatigue routing, Pomodoro nudge — designed for the operator doing this 50 times a day |
| **Cost discipline** | Quick-confirm lane quantified ("~90 reviewer-hours/day saved at 50 reviewers"); design choices defended on operating-model math |
| **Governance literacy** | Forced reason taxonomy, frozen snapshots, resolution SLAs on escalations — governance affordances designed in, not bolted on |

A senior interviewer will look for exactly these markers. Each is present.

### 10.3 How This Shows Systems Thinking

The strongest evidence of systems thinking is the **cross-cutting layer** of the design:

```
Primary entities         SOW · Submission · Review · Bundle · Acceptance · Payment

Cross-cutting overlays   SLA (every state)
                         Audit (every transition)
                         AI (intake, rubric, risk)
                         Escalation (parallel track on any state)
                         Compliance (gate at every decision)
```

The designer who understands systems builds *invariants* — properties that must hold across every screen. This document carries five:

1. Every decision is signed and audited inline.
2. Every AI suggestion exposes Source / Confidence / Coverage / Override.
3. Every escalation has type + root cause + tier + SLA + frozen snapshot.
4. Every SLA tier has a defined visual + behavior + system response.
5. Every state has a layout-behavior + action-change + escalation-logic specification.

These invariants compose. A new state can be added by specifying these five properties; the rest is mechanical.

### 10.4 How This Shows AI Workflow Understanding

The redesign treats AI not as a feature but as a **role participant** in the workflow:

- AI has a confidence calibration ledger that the reviewer audits (Insights / AI partnership).
- AI declares its coverage gaps — "not reviewed: live demo" — instead of pretending to be omniscient.
- AI's friction is proportional to its uncertainty — High confidence enables quick-confirm; Low confidence blocks it.
- AI's overrides are an audit-grade signal — every Edit and Reject is logged with delta and optional reason.
- AI's recommendations appear in eight defined surfaces and nowhere else — preventing AI noise in places it doesn't add decision value.
- AI's role is sized to the governance budget — high-risk decisions (Acceptance, Payout) are explicitly human; AI's job is leverage, not substitution.

A senior AI/UX practitioner reading this design will recognize these as the rare correct moves. Most AI features ship with confidence buried, coverage hidden, overrides un-instrumented. This design ships them.

### 10.5 Closing Frame for the Interview

> *"The Mentor Workspace is the most consequential surface in the platform — payment, credential, AI legitimacy, and contributor livelihood all cross there. I designed it as a single Review Hub with a complete component library, a state-by-state behavior contract, and the AI integrated as an auditable colleague rather than an autopilot. Every decision is signed; every AI suggestion is sourced, confidence-bounded, and override-instrumented; every escalation has a root cause and an SLA. The win isn't a prettier queue — it's a workspace where throughput goes up, governance goes deeper, and trust composes from primary records. This is what enterprise design looks like when it's done at maturity."*

---

## Appendix A — Screen Inventory

| # | Screen | Route | Variants |
|---|---|---|---|
| 1 | Today (mentor) | `/review-hub` | default, no-crisis, mentorship-empty |
| 2 | Today (reviewer) | `/review-hub` | default, no-crisis |
| 3 | Queue | `/review-hub/queue` | default, filtered, grouped, selection, empty, loading, error |
| 4 | Review detail | `/review-hub/queue/[id]` | default, round 2+, AI ready, accepted, rejected, rework requested, escalated, blocked, governance hold, SLA critical, SLA breached, draft, loading, error |
| 5 | Rework composer | modal | default, with template, multi-criterion |
| 6 | Reject composer | modal | default, low-confidence, conduct-failure |
| 7 | Escalation composer | modal | default, auto-escalation context |
| 8 | Clarification request | drawer | default, SLA pause selected |
| 9 | SLA extension | modal | mentor-only |
| 10 | Governance block | modal | default |
| 11 | Decisions / Recent | `/review-hub/decisions` | default, filtered, empty |
| 12 | Decisions / Reworks in flight | `/review-hub/decisions/reworks` | default, with round-3 |
| 13 | Decisions / Calibration | `/review-hub/decisions/calibration` | default, insufficient-data |
| 14 | Escalations list | `/review-hub/escalations` | default, watching, history |
| 15 | Escalation resolve | drawer | default |
| 16 | Mentorship today | `/review-hub/mentorship/sessions` | default, no-sessions |
| 17 | Session detail | `/review-hub/mentorship/sessions/[id]` | scheduled, in-session, complete |
| 18 | Insights / AI partnership | `/review-hub/insights/ai-partnership` | default, insufficient-data |
| 19 | Insights / Pool health | `/review-hub/insights/pool-health` | default, mentor-only |
| 20 | Me / Profile | `/review-hub/me` | view, edit |

## Appendix B — Variant Matrix (selected components)

```
SLA Chip                     5 tiers × 3 sizes                      = 15 variants
Confidence Badge             2 sources × 3 levels × 2 sizes         = 12 variants
Rubric Criterion             4 states × 6 scores × 3 ai-actions     = 72 variants
Queue Row                    5 tiers × 2 selected × 2 aiReady × 4 risk × 3 rounds × 2 continuity
                             = 5 × 2 × 2 × 4 × 3 × 2 = 480 variants  (use boolean overrides, not exhaustive frames)
Decision Toolbar             4 enabled-flags × 4 confidence states  = ≤ 16 useful variants
Reasoning Card               3 sizes × 3 confidence × 4 action      = 36 variants
KPI Tile                     3 trend × 2 sizes × 2 click-state      = 12 variants
```

**Implementation note:** for components with >50 variants, expose properties as **booleans / enums** in Figma component-set properties; do not enumerate every combination as a separate frame.

## Appendix C — Density & Responsive Rules

```
Density modes
   Compact (default)         32 px row, 13 px body, 8 px vertical padding
   Comfortable               40 px row, 14 px body, 12 px vertical padding

Viewport breakpoints
   ≥1680                     content centered at 1440 max
   1440–1679                 content fills width with 24 px margin
   1280–1439                 sidebar collapsible; content compressed; 3-pane → 2-pane (Context becomes drawer)
   <1280                     Phase 2; not designed in this iteration

Pane behavior at narrow viewport
   3-pane workspace          becomes 2-pane (Submission + Decision) with Context behind icon-toggle
   Pane A                    minimum 480 px
   Pane B                    minimum 320 px
   Pane C                    becomes overlay drawer (420 px)
```

## Appendix D — Motion & Timing

```
Token name                 Duration     Easing         Where used
─────────────────────────────────────────────────────────────────────────
motion.peekFade            120 ms       ease-out       hover peek cards
motion.tooltipFade          80 ms       ease-out       tooltips
motion.drawerSlideIn       220 ms       ease-in-out    right drawers
motion.modalScale          180 ms       ease-out       modal entries
motion.toastSlide          220 ms       ease-out       toasts
motion.rowHover             80 ms       ease-out       row background tint
motion.starFill            100 ms       ease-out       rubric star fill
motion.urgentPulse        1500 ms       ease-in-out    Breached SLA chip (loop)
motion.confettiAccept      400 ms       ease-out       Accept confirmation flourish
motion.autoSaveBlip        200 ms       ease-out       "Saved 2s ago" indicator
```

**Rules:**
- Motion budget per page: max 2 simultaneous animations (excluding loops).
- `motion.urgentPulse` reserved for Breached only; do not extend to Critical.
- `prefers-reduced-motion: reduce` honored — all loops disabled; transitions shortened to 60 ms.

## Appendix E — Wireframe Legend

```
Symbol           Meaning
─────────────────────────────────────────────────────────────────
╔═╗  ║  ╚═╝     sticky region / strong frame
┌─┐  │  └─┘     standard frame
┄ ┄ ┄            optional / collapsible region
●  ◐  ○         confidence level (high / medium / low)
●  ○            radio (selected / unselected)
☑  ☐            checkbox
[ Label ]       button
( Label )       chip / toggle / radio segment
▾ ▸ ▿           disclosure (open / closed / pending)
{var}           dynamic value
🔴 ⚠ ▲ ●         SLA tier (breached / critical / warning / normal)
🤖 👤           AI / human
🚩 ⏱ 🛡         risk flag (plagiarism / timing / integrity)
✓ ✗ ↺          decision (accept / reject / rework)
●●●  ●●○  ⚫⚫⚫   online status (active / idle / offline)
▰▰▱▱           progress bar
↗               external / drill link
⋮  ⚙            row menu / settings
```

---

*End of document — `MENTOR_WORKSPACE_WIREFRAMES_AND_SCREEN_ARCHITECTURE.md`.*
*This concludes the four-document Mentor Workspace design set.*
