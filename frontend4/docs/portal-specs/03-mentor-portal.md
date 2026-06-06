# Mentor & Reviewer Workspace — Detailed Specification

> **Status:** Draft v1.0 — Phase 1 rebuild reference
> **SOW anchor:** GLIMMORATEAM™ Global Workforce Intelligence Platform v1.1
> **Owner:** Product · Engineering · Design
> **Last updated:** 2026-05-26
> **Supersedes:** `MENTOR_WORKSPACE_UX_EXECUTION_BLUEPRINT.md`, `MENTOR_WORKSPACE_WIREFRAMES_AND_SCREEN_ARCHITECTURE.md`, `MENTOR_REVIEW_UX_ARCHITECTURE.md`, `MENTOR_REVIEW_REDESIGN_STRATEGY.md`

---

## 0. Document control

| Field | Value |
|---|---|
| Document role | Source of truth for build-out and QA |
| SOW anchor | §1.4.1, §1.5, §3.1.MVP.5, §3.1.MVP.7, §3.1.5, §4.1, §4.3, §7, §19.3, §20.2 |
| Phase 1 horizon | 0–90 days |
| Scope philosophy | SOW-binding review + mentorship only; analytics/orchestration creep cut |

### Reading conventions

Same as previous specs:
- **§** = SOW · **P1/P2** = Phase 1/2 · **🔒 SEAL** = hide · **🚧 BUILD** · **🔧 WIRE** · **✅ KEEP**

---

## 1. Purpose and personas

### 1.1 What this portal is for

The Mentor & Reviewer Workspace is where **mentors and reviewers verify contributor work** in the SOW lifecycle (§4.1 step 6: "Deliverables validated by AI plus human reviewers"). It is where:

- A submitted task is graded against acceptance criteria using a configurable rubric
- A mentor writes structured feedback (what worked · required corrections · optional suggestions)
- A decision is made — accept · request rework · reject — with reasons captured in the immutable audit
- Mentors hold scheduled mentorship sessions with contributors (women workforce + student tracks)
- Escalations land here when contributors report blockers, disputes arise, or SLA breaches need adjudication

It is **the human verification layer** of the autonomous delivery economy. Phase 1 = humans make every accept/reject/rework call; AI is assistive (per §3.1.MVP.7 "assistive autonomy").

### 1.2 Personas

Three personas access this portal. Same portal, role-conditional modules (consistent with contributor + enterprise spec).

| Persona | Role code | What they own | SOW |
|---|---|---|---|
| **Mentor** | `mentor` | Reviews assigned to them; mentorship sessions they hold; their personal history | §3.1.MVP.5, §3.1.5 |
| **Senior mentor** | `mentor.senior` | Everything `mentor` does, plus escalations directed to senior tier; dispute adjudication | §3.1.MVP.5 |
| **Lead mentor** (mentor coach) | `mentor.lead` | Team-level oversight: review queue load across their pool, mentorship coordination | §20.2 |

> Future personas not in Phase 1: "Mentor coordinator" (cross-pool capacity ops) and "Mentor program admin" (configures rubrics globally). Phase 1 collapses those duties into `mentor.lead`.

### 1.2.1 One portal, role-conditional modules

**Decision (locked):** same shell, same navigation, same review experience. Role-specific affordances added as conditional modules:

- **Mentor** — sees own queue, own history, own metrics
- **Senior mentor** — sees a "Senior escalations" extra inbox + dispute UI
- **Lead mentor** — sees a "Team load" extra dashboard card; can reassign reviews across the pool they lead

Roles are additive — a `mentor.lead` is also a `mentor`. The base experience is the same; lead adds.

### 1.3 Jobs-to-be-done

| JTBD | Who | Surface |
|---|---|---|
| "Show me the next review to do" | Mentor | Queue (SLA-ranked) |
| "Help me grade fairly and quickly" | Mentor | Review detail · rubric · AI assist |
| "Tell the contributor what to fix without writing it from scratch" | Mentor | Feedback templates |
| "Don't let me rubber-stamp" | All | Anti-pattern safeguards |
| "Catch me up on this contributor before I review" | Mentor | Contributor context panel |
| "Don't let me miss an SLA" | All | SLA timers + escalations |
| "Tell me what to coach about" | Mentor (mentorship session) | Coaching recommendations |
| "Hand this off when I can't handle it" | Mentor | Reassign / escalate |
| "Show me my own consistency" | Mentor | Personal metrics |
| "Adjudicate this disputed decision" | Senior mentor | Escalation detail |
| "Balance load across the pool" | Lead mentor | Team load module |

### 1.4 What this portal is NOT

- **Not** a contributor workspace — mentors don't deliver tasks here
- **Not** an enterprise admin console — no SOW intake, no tenant config
- **Not** an analytics / orchestration dashboard — Phase 2 features cut from Phase 1
- **Not** a public face — mentors are matched to contributors by the platform, not browsed

### 1.5 Anti-creep statement

The reorganized mentor architecture drifted toward analyst/orchestrator territory (bottleneck forecasting, pool calibration, AI agreement trending, capacity rebalancing). **These are Phase 2 APG features and have been cut from Phase 1.** The mentor's Phase 1 surface is: queue · review · feedback · mentorship · escalation · history. Nothing more.

---

## 2. Phase 1 vs Phase 2 scope

### 2.1 Phase 1 — must ship (SOW-binding)

| # | Capability | SOW | Today | Phase 1 effort |
|---|---|---|---|---|
| 1 | Review queue (SLA-ranked, filterable) | §3.1.MVP.5, §19.3 | Exists | 🔧 WIRE |
| 2 | "Why first?" ranking transparency | implied by §3.1.MVP.7 explainability | Exists | ✅ KEEP |
| 3 | Review detail with brief + evidence + criteria | §3.1.MVP.5 | Exists | 🔧 WIRE evidence storage + diff |
| 4 | Configurable rubric (per criterion: stars/score + comment) | §3.1.MVP.5, §19.3 | Exists | 🔧 WIRE rubric template + persistence |
| 5 | 3-block structured feedback (What worked · Required corrections · Optional suggestions) | §3.1.MVP.5, §19.3 | Exists | ✅ KEEP |
| 6 | Feedback templates per criterion | §19.3 ("guided feedback flows") | Exists | 🔧 WIRE template store |
| 7 | Single & two-stage review routing visibility | §3.1.MVP.5 | Exists (banner) | ✅ KEEP |
| 8 | Decision: Accept / Rework / Reject with reasons | §3.1.MVP.5, §3.1.MVP.7 | Exists | 🔧 WIRE audit |
| 9 | Rework versioning + prior feedback re-surfaced on v2 | §3.1.MVP.5 | Exists | 🔧 WIRE |
| 10 | Diff viewer (v1 ↔ v2 submissions) | §3.1.MVP.5 | Stub | 🚧 BUILD |
| 11 | "Addressed" status tracking on each correction | §3.1.MVP.5 | Exists | ✅ KEEP |
| 12 | Contributor context panel (skills, reliability, last 5 decisions) | §3.1.5, §11 | Exists | 🔧 WIRE to live digital twin |
| 13 | Review Assistant AI (rubric pre-fill + summarization) | §3.1.MVP.7 | Exists | 🔧 WIRE LLM service (assistive only) |
| 14 | AI confidence + source + coverage gaps visible | §3.1.MVP.7, §7.5 | Exists | ✅ KEEP |
| 15 | AI override capture (audit) | §6 (Audit Logs) | Exists | 🔧 WIRE audit |
| 16 | Fresh-reviewer default (anti rubber-stamp) | implied governance | Exists | ✅ KEEP |
| 17 | Continuity flag (same reviewer on rework round) | governance safeguard | Exists | ✅ KEEP |
| 18 | SLA timer per review (healthy/watch/warning/critical/breached) | §4.3 | Exists | 🔧 WIRE policy templates |
| 19 | Auto-escalate on SLA breach | §4.3 | Partial | 🚧 BUILD escalation rule engine |
| 20 | Escalation queue (senior mentor) | §4.3 | Exists | 🔧 WIRE |
| 21 | Mentorship session list + detail | §20.2 | Exists | 🔧 WIRE |
| 22 | Coaching recommendations on accept decision | §19.3 | Exists | ✅ KEEP |
| 23 | Personal history of decisions | §6 | Exists | 🔧 WIRE |
| 24 | Personal metrics (avg time, accept %, SLA hit rate) | §19.3 implicit | Exists | 🔧 WIRE |
| 25 | Profile + settings | implicit | Exists | ✅ KEEP |
| 26 | Notifications | implicit | Exists | 🔧 WIRE delivery |
| 27 | Evidence pack export (basic audit-events JSON + submission metadata) | §3.1.MVP.5, §3.1.MVP.8 | Missing | 🚧 BUILD |
| 28 | Reassign review (with reason) | §3.1.MVP.4 | Exists | 🔧 WIRE |
| 29 | Withdraw mentorship from a task (conflict of interest) | §14 | Missing | 🚧 BUILD |
| 30 | WCAG-aligned core journeys | §1.4.1 | Implicit | 🚧 BUILD audit |

### 2.2 Phase 2 — deferred (was over-scoped in current build)

| Surface | SOW | Why Phase 2 |
|---|---|---|
| **Bottleneck Spotlight** | §7.2 implies APG | Phase 2 — APG forecasting feature |
| **Pool Health + Capacity Rebalancing** | §1.5 names APG; §3.1.MVP.7 excludes APG | Phase 2 orchestration |
| **AI Partnership calibration KPIs** (agree% / override% trends over time) | §6 audit-level only | Phase 2 responsible-AI analytics |
| **My Pace gauge** (reviewer fatigue tracking) | not in SOW | Phase 2 wellness feature |
| **SLA forecast** ("capacity exceeded by Tue") | Phase 2 APG | Phase 2 |
| **Full calibration dashboard** (cross-reviewer agreement) | Phase 2 governance | Phase 2 |
| **Contributor anomaly pairing detection** (continuous dynamic badge) | §8.3 audit-level only | Phase 2 governance analytics — keep the round-by-round continuity flag, drop the dynamic queue badge |
| **AI/* dashboards** (sealed in current build per audit) | not in SOW MVP | Phase 2 |
| **Reviews/* analytics deep dives** | not in SOW MVP | Phase 2 |
| **Contributors/* analytics** | not in SOW MVP | Phase 2 |

### 2.3 Phase 1 exit criteria — mentor portal

A mentor portal passes Phase 1 acceptance when **all** of these are true:

1. A mentor signs in (SSO or credentials) and lands on a queue with at least one assigned review
2. They can open a review, read brief + criteria + evidence, see the contributor context panel
3. The AI assistant pre-fills rubric scores with confidence + source; the mentor can accept, modify, or override each suggestion; overrides are captured in audit
4. The mentor writes 3-block feedback using templates as starting points
5. The mentor submits Accept / Rework / Reject with a reason; audit event written
6. If Rework: the contributor sees revision feedback; on resubmit, the same mentor (continuity flag) is offered first, with a "switch reviewer" option
7. If Reject: contributor sees decision + can dispute (entry surface in contributor doc 01 §5.H.4)
8. On Accept: payout becomes eligible (cross-portal to enterprise + contributor)
9. Mentorship session: a mentor can view their scheduled sessions, write a coaching note that the contributor sees in their profile
10. Senior mentor sees escalations (SLA breach, dispute, blocker) and can adjudicate
11. Lead mentor can see team load and reassign reviews across their pool
12. Personal metrics page renders with real numbers
13. Three core journeys pass a WCAG 2.1 AA audit (Queue → Review → Decision; Mentorship session; Escalation)

### 2.4 Out of scope entirely

- Mentor-side analytics dashboards
- Mentor self-serve mentorship marketplace (mentors don't pick contributors; matching does)
- Pricing visibility (mentors don't see rates per skill — confidentiality)
- Cross-tenant insights

---

## 3. Information architecture

### 3.1 Sidebar (full role)

```
┌─────────────────────────────────┐
│ ▢ Glimmora · Mentor              │
├─────────────────────────────────┤
│ TODAY                            │
│   • Dashboard                    │  /mentor/dashboard
├─────────────────────────────────┤
│ REVIEW                           │
│   • Queue                  [4]   │  /mentor/queue
│   • Escalations            [1]   │  /mentor/escalation  (senior+ only)
│   • History                      │  /mentor/history
├─────────────────────────────────┤
│ MENTORSHIP                       │
│   • Sessions                     │  /mentor/mentorship
├─────────────────────────────────┤
│ ACCOUNT                          │
│   • Profile                      │  /mentor/profile
│   • Settings                     │  /mentor/settings
├─────────────────────────────────┤
│ [<<] collapse                    │
└─────────────────────────────────┘
```

> **Sidebar item count: 7 max** (one role-conditional: Escalations only for `mentor.senior` and `mentor.lead`).

**Sealed for Phase 1 (route removed or hidden):**
- `/mentor/analytics/*` — Phase 2
- `/mentor/calibration` — Phase 2
- `/mentor/pool-health` — Phase 2
- `/mentor/bottleneck` — Phase 2
- `/mentor/sla-monitor` — Phase 2 (timer in queue is sufficient)
- `/mentor/reviews` deep analytics — Phase 2
- `/mentor/contributors` deep analytics — Phase 2

### 3.2 Route map (Phase 1)

| Route | Screen | Phase | SOW | Roles |
|---|---|---|---|---|
| `/mentor/dashboard` | Dashboard | P1 | §19.3 | all mentor |
| `/mentor/queue` | Review queue | P1 | §3.1.MVP.5 | all |
| `/mentor/queue/[reviewId]` | Review detail (decision) | P1 | §3.1.MVP.5 | assigned mentor |
| `/mentor/queue/[reviewId]/diff` | Diff viewer (v1 ↔ v2) | P1 | §3.1.MVP.5 | assigned mentor |
| `/mentor/queue/[reviewId]/audit` | Per-review audit | P1 | §3.1.MVP.8 | assigned mentor + senior |
| `/mentor/history` | Decision history | P1 | implicit | self |
| `/mentor/history/[decisionId]` | Past decision detail (read-only) | P1 | implicit | self |
| `/mentor/history/metrics` | Personal metrics | P1 | §19.3 implicit | self |
| `/mentor/escalation` | Escalation queue | P1 | §4.3 | senior, lead |
| `/mentor/escalation/[escalationId]` | Escalation detail | P1 | §4.3 | senior, lead |
| `/mentor/mentorship` | Mentorship sessions list | P1 | §20.2 | all mentor (when assigned) |
| `/mentor/mentorship/[sessionId]` | Session detail | P1 | §20.2 | assigned mentor |
| `/mentor/profile` | Profile | P1 | implicit | self |
| `/mentor/profile/edit` | Edit profile | P1 | implicit | self |
| `/mentor/settings` | Settings | P1 | implicit | self |
| `/mentor/settings/notifications` | Notification prefs | P1 | implicit | self |
| `/mentor/settings/availability` | Availability (hours, ooo) | P1 | §4.3 | self |
| `/mentor/notifications` | Notifications | P1 | implicit | self |

### 3.3 Navigation patterns

- **Sidebar:** persistent on lg+; mobile drawer. Sidebar shows red dot badges only on Queue + Escalations.
- **Topbar:** sticky 60px. Tenant name not shown (mentors review across tenants). Contains: mobile menu, ⌘K search, notification bell, account menu.
- **"Why this first?"** transparency tooltip on top queue row.
- **Continuity flag** banner on review detail if mentor previously reviewed this task.
- **Fresh reviewer banner** when mentor opens a task they've never seen.
- **Deep linking:** every URL is bookmarkable; filters in query string.

---

## 4. End-to-end user journeys

### Journey A — Daily review cycle (Mentor)

```
[SSO login] ─→ Dashboard ─→ Queue (sorted by SLA)
                                  │
                                  ▼ open top item
                            Review detail
                                  │
                                  ├ Read brief, criteria, evidence
                                  ├ Review contributor context (skills, last 5)
                                  ├ Inspect AI suggestions (rubric pre-fill)
                                  ├ Accept / modify / override each
                                  ├ Write feedback (3-block)
                                  ├ Decision (Accept / Rework / Reject)
                                  ▼
                            Confirmation modal (audit reason)
                                  │
                                  ▼
                            History (decision filed)
                                  │
                                  ▼ next item in queue
```

### Journey B — Rework round (Mentor + Contributor)

```
[Mentor decision: Rework] → Contributor revision flow → Resubmission v2
                                                              │
                                                              ▼
                                                        New review item appears
                                                        Continuity flag: "You reviewed v1"
                                                              │
                                                              ▼
                                                        Review detail (v2)
                                                              ├ "Compare v1 ↔ v2" diff viewer
                                                              ├ Prior feedback shown alongside
                                                              ├ "Addressed" status on each correction
                                                              ├ Re-decide (Accept / Rework / Reject)
                                                              │
                                                              ▼
                                                        Final round (= totalRounds):
                                                          system enforces hard decision
                                                          (no further rework allowed)
```

### Journey C — Mentorship session (Mentor)

```
Mentorship sessions ─→ Today's sessions
                              │
                              ▼
                        Session detail · 30 min · 14:00
                              │
                              ├ Contributor brief: skills, recent work, goals
                              ├ Suggested topics (rule-based)
                              │   - "Address recurring issue: aria-live region usage"
                              │   - "Acknowledge improvement: TAB cycle quality up"
                              ├ Session in progress (video link external)
                              │
                              ▼
                        After session: write coaching note
                              │
                              ▼
                        Contributor sees note in their Profile
```

### Journey D — Escalation (Senior mentor)

```
Escalation queue ─→ Escalation detail
                          │
                          ├ Type: SLA breached / Dispute / Blocker / Conflict-of-interest
                          ├ Context: original task, mentor's note, contributor's note (if any)
                          ▼
                    Decision:
                      • Reassign to another mentor
                      • Adjudicate dispute (override decision)
                      • Extend SLA / waive
                      • Reject escalation (return to original mentor)
                          │
                          ▼
                    Audit event + notifications
```

### Journey E — Team load management (Lead mentor)

```
Dashboard ─→ "Team load" card
                  │
                  ▼
            Queue (filtered to team members)
                  │
                  ├ Spot mentor at >80% capacity
                  ├ Reassign 2 tasks to colleague
                  │
                  ▼
            Reassign modal → reason → submit → audit
```

### Journey F — Conflict of interest withdrawal (Mentor)

```
Queue ─→ Review detail
              │
              ├ Mentor recognizes contributor as personal connection
              ▼
        "Withdraw from this review" action
              │
              ▼
        Reason: conflict of interest
              │
              ▼
        Review reassigned automatically; audit logged
```

---

## 5. Screen-by-screen specification

### 5.A Authentication

Same shared auth screens as contributor (see doc 01 §5.A). Mentors land at `/mentor/dashboard` post-auth. Glimmora-side SSO required for staff mentors; external mentors use email + MFA.

The only mentor-specific note: a mentor's identity ships with a **competency profile** that determines which task types they're eligible to review. This profile is admin-set; mentors see it but can't edit.

---

### 5.B Dashboard

#### 5.B.1 Dashboard — `/mentor/dashboard`
**Phase 1** · SOW §19.3 · 🔧 WIRE

**Use case:** orient the mentor; surface the next-best action.

**Wireframe (base mentor view):**
```
┌──────────────────────────────────────────────────────────────┐
│ Today · Tuesday, May 26                                        │
│ Good morning, Priya                                            │
│ 4 reviews pending · 1 SLA at risk                              │
├──────────────────────────────────────────────────────────────┤
│ NEXT REVIEW (hero)                                             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Date Picker · FocusScope · Round 2                        │ │
│ │ Submitted by Sneha 14m ago · SLA: 2h 14m remaining        │ │
│ │ Helios Q3 · Two-stage · Will route to client after you    │ │
│ │ [ Open review → ]                                          │ │
│ │                                                            │ │
│ │ Why first?  SLA closest to breach; high readiness         │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ QUEUE GLANCE                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ Pending  │ │ SLA risk │ │ Done 7d  │ │ Avg time │         │
│ │    4     │ │    1     │ │    18    │ │  22 min  │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
├──────────────────────────────────────────────────────────────┤
│ TODAY'S MENTORSHIP SESSIONS (3)                               │
│ • 14:00 · Sneha M. · 30 min · Date Picker follow-up          │
│ • 15:30 · Kavi S.  · 30 min · Quarterly check-in              │
│ • 17:00 · Yusuf O. · 45 min · Backend ladder review           │
│ [ Open sessions → ]                                            │
├──────────────────────────────────────────────────────────────┤
│ AI SIGNALS                                                     │
│ › 2 reviews waiting for you are on contributors you've coached │
│ › Your accept rate (84% last 30d) is steady                   │
└──────────────────────────────────────────────────────────────┘
```

**Role-conditional additions:**

- **`mentor.senior`** — adds card "Escalations awaiting you (1)" between hero and queue glance
- **`mentor.lead`** — adds card "Team load" between mentorship and AI signals (see §5.B.2)

**States:** default · empty (no pending reviews) · loading · degraded

**Edge cases:**
- No reviews assigned → "You're all caught up. New reviews appear here when contributors submit." with a calm illustration
- SLA-breached review present → red banner on top with [ Triage ] CTA
- Reviewer off the clock (per `availability`) → soft banner "You're marked off today. Reviews are paused."

**Cognitive load:**
- ONE hero (next review) — never two
- "Why first?" transparency answers the trust question without a click
- Mentorship sessions surfaced because they have a time of day; queue is async

**Decision heuristic:** "What's next?" → hero.

---

#### 5.B.2 Dashboard — Lead mentor team load module
**Phase 1** · `mentor.lead` only

```
┌──────────────────────────────────────────────────────────────┐
│ TEAM LOAD · Helios review pool                                │
├──────────────────────────────────────────────────────────────┤
│ Priya I. (you)   ▓▓▓▓▓▓░░░░ 60% · 4 pending                  │
│ Rajesh V.        ▓▓▓▓▓▓▓▓░░ 80% · 5 pending                  │
│ Amelia S.        ▓▓░░░░░░░░ 20% · 1 pending                   │
│ Yusuf O.         ▓▓▓▓▓▓▓▓▓░ 92% · 6 pending  ⚠ at limit       │
│                                                                │
│ [ Reassign across team ]                                      │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** member > 90% → soft warning, prompt to rebalance.

---

### 5.C Review queue

#### 5.C.1 Queue — `/mentor/queue`
**Phase 1** · SOW §3.1.MVP.5, §19.3 · 🔧 WIRE

**Use case:** the prioritized list of reviews assigned to the mentor. SLA-ranked by default.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Review queue                                                                  │
│ 4 pending · 1 SLA at risk · sorted by SLA (closest first)                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ All 4 ] [ SLA risk 1 ] [ Round 2+ 1 ] [ Two-stage 1 ]   [Group: Flat ▾]    │
├──────────────────────────────────────────────────────────────────────────────┤
│ TASK              │ CONTRIB.  │ SLA   │ STAGE   │ ROUND │ MENTOR FLAGS │ → │
│ ───────────────────┼───────────┼───────┼─────────┼───────┼──────────────┼───│
│ ⚠ Date Picker     │ Sneha M.  │  2h   │ Two-stg │ 2/3   │ continuity   │ → │
│   FocusScope · Helios Q3 · Submitted 14m ago                                  │
│ ⚠ CSV export       │ Yusuf O.  │  5h   │ Single  │ 1/3   │ —            │ → │
│   Reporting V2 · Submitted 1h ago                                             │
│ ⚪ Auth modal       │ Kavi S.   │  2d   │ Single  │ 1/3   │ fresh        │ → │
│ ⚪ Search shortcuts│ Sneha M.  │  3d   │ Single  │ 1/3   │ recent paired│ → │
├──────────────────────────────────────────────────────────────────────────────┤
│ [⚙ Filters]    [Why this order? ⓘ]            Rows per page [25]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Group modes (Group: dropdown):**
- **Flat** (default) — single SLA-ranked list
- **By project** — collapsible groups
- **By contributor** — one panel per contributor (helps see mentorship overlap)
- **By skill** — one panel per skill (helps notice patterns)

**Mentor flag badges:**
- `continuity` — you reviewed v1 of this task (round 2+)
- `fresh` — you've never reviewed this contributor
- `recent paired` — you reviewed this contributor 4+ of last 5 — anti-rubber-stamp soft caution (one-shot, NOT a continuous dynamic badge — that was the Phase 2 over-scope)

**States:** default · empty · filtering · loading · breached_present (red banner at top)

**Edge cases:**
- All reviews breached → "Your queue is over SLA. Senior mentor has been notified." banner
- Filter results 0 → "No reviews match this filter"
- Mentor off the clock → queue read-only with "Mark me available" CTA

**Cognitive load:**
- One sort axis at a time (default SLA); user can override via column click
- Flags are textual, not iconic-only — readable at a glance
- "Why this order?" transparency is one click away (popover lists ranking inputs)

**Decision heuristic:** "Which review first?" → top row, always.

**Accessibility:** rows are `<tr role="row">` with `tabindex=0`; Enter opens review.

---

#### 5.C.2 Queue filter drawer
**Phase 1**

```
┌──────────────────────────────────────────┐
│ Filters                              [ ✕ ] │
├──────────────────────────────────────────┤
│ SLA tier                                   │
│ ☑ Critical / Breached                      │
│ ☑ Warning                                  │
│ ☑ Watch                                    │
│ ☐ Healthy                                  │
│                                            │
│ Stage                                      │
│ ☑ Single-stage                             │
│ ☑ Two-stage                                │
│                                            │
│ Round                                      │
│ ◉ Any   ○ Round 1   ○ Round 2+             │
│                                            │
│ Project                                    │
│ [ All ▾ ]                                  │
│                                            │
│ Skill                                      │
│ [ All ▾ ]                                  │
│                                            │
│ Contributor                                │
│ [ ____________________________ ]           │
│                                            │
│ Flags                                      │
│ ☐ Only "continuity" (my prior round)      │
│ ☐ Only "fresh" (new to me)                │
│ ☐ Only "recent paired" (caution)          │
│                                            │
│ [ Reset ]                  [ Apply ]      │
└──────────────────────────────────────────┘
```

---

#### 5.C.3 "Why this order?" popover
**Phase 1** · SOW §3.1.MVP.7 explainability

```
┌──────────────────────────────────────────────────────────────┐
│  Why this order?                                               │
│                                                                │
│  Default sort is SLA-closest-first, with ties broken by:      │
│   1. Higher contributor readiness (faster decisions)          │
│   2. Two-stage review (downstream queue waits on you)         │
│   3. Round 2+ (rework cycles get priority)                    │
│                                                                │
│  You can override with column click or filters.               │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.D Review detail (the cockpit)

#### 5.D.1 Review detail — `/mentor/queue/[reviewId]`
**Phase 1** · SOW §3.1.MVP.5 · ✅ KEEP polish · 🔧 WIRE

The mentor's most important screen. 3-zone layout:

- **A. Header** (sticky) — task context, SLA, continuity flag, stage banner
- **B. Work pane** (~60%) — evidence inspector + criteria rubric + feedback editor
- **C. Context rail** (~40%, sticky) — contributor digital twin, AI assist, prior feedback (rework rounds)

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Queue · Date Picker · FocusScope · Helios Q3                                │
│ Round 2 of 3 · Two-stage · SLA: 2h 14m · ⚠ at-risk                            │
│ ◉ You reviewed v1 (continuity)  ·  Switch reviewer?                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ WORK PANE (60%)                          │ CONTEXT RAIL (40%)                  │
│ ┌─────────────────────────────────────┐ │ ┌─────────────────────────────────┐│
│ │ BRIEF                                │ │ │ CONTRIBUTOR · Sneha M.           ││
│ │ Implement focus management for the   │ │ │ Designer · L3 · India            ││
│ │ date picker overlay. Trap focus on   │ │ │ Verified skills: React, Figma,   ││
│ │ open and restore on close.           │ │ │   Accessibility (3)              ││
│ │ [ Expand brief ]                     │ │ │                                   ││
│ ├─────────────────────────────────────┤ │ │ Reliability                       ││
│ │ EVIDENCE (4 files)                   │ │ │  Tasks completed: 14              ││
│ │ ┌──────────────────────────────────┐│ │ │  Acceptance rate: 92%             ││
│ │ │ 📄 spec.md       [ View ]         ││ │ │  First-try: 71%                   ││
│ │ │ 🎬 demo.mp4      [ Play ]         ││ │ │  On-time: 89%                     ││
│ │ │ 📄 tests.txt     [ View ]         ││ │ │                                   ││
│ │ │ 📄 aria-test.md  [ View ]         ││ │ │ Last 5 decisions (yours + others)││
│ │ └──────────────────────────────────┘│ │ │  ✓ Auth modal · accepted May 18   ││
│ │                                      │ │ │  ✓ CSV export · accepted May 12   ││
│ │ ⇄ Compare v1 ↔ v2 [ Open diff ]      │ │ │  ⟲ Date Picker v1 · rework May 24 ││
│ │                                      │ │ │     (yours)                       ││
│ ├─────────────────────────────────────┤ │ │  ✓ Search shortcuts · May 8       ││
│ │ ACCEPTANCE CRITERIA · RUBRIC         │ │ │  ✓ Empty-state illustrations·May5 ││
│ │ ┌──────────────────────────────────┐│ │ │                                   ││
│ │ │ ✓ Focus trap on open              ││ │ │ Mentor watch                      ││
│ │ │   ⭐⭐⭐⭐⭐ [ Comment ▾ ]            ││ │ │   None active                     ││
│ │ │   AI suggest: ⭐⭐⭐⭐⭐ · 91% conf   ││ │ ├─────────────────────────────────┤│
│ │ ├──────────────────────────────────┤│ │ │ ✦ AI ASSIST                       ││
│ │ │ ✓ ESC closes + restores focus     ││ │ │  Suggested rubric below.          ││
│ │ │   ⭐⭐⭐⭐⭐ [ Comment ▾ ]            ││ │ │  91% overall confidence           ││
│ │ │   AI suggest: ⭐⭐⭐⭐⭐ · 88% conf   ││ │ │                                   ││
│ │ ├──────────────────────────────────┤│ │ │  Source signals:                  ││
│ │ │ ✓ TAB cycles within picker        ││ │ │   - Code review check passed      ││
│ │ │   ⭐⭐⭐⭐☆ [ Comment ▾ ]            ││ │ │   - Tests file present             ││
│ │ │   AI suggest: ⭐⭐⭐⭐⭐ (you set 4)  ││ │ │   - aria-live region added         ││
│ │ ├──────────────────────────────────┤│ │ │                                   ││
│ │ │ ✓ SHIFT-TAB reverses cycle        ││ │ │  Coverage gaps (not auto-checked):││
│ │ │   ⭐⭐⭐⭐⭐ [ Comment ▾ ]            ││ │ │   - Mobile touch (manual review)  ││
│ │ ├──────────────────────────────────┤│ │ │   - Live demo recording            ││
│ │ │ ✓ Screen reader month change      ││ │ │                                   ││
│ │ │   ⭐⭐⭐⭐☆ [ Comment ▾ ]            ││ │ │  Risk flags:                      ││
│ │ │   AI suggest: ⭐⭐⭐⭐ · 78% conf    ││ │ │   None                            ││
│ │ ├──────────────────────────────────┤│ │ │                                   ││
│ │ │ ✓ Mobile touch dismisses          ││ │ │  ⓘ Override delta logged           ││
│ │ │   ⭐⭐⭐⭐⭐ [ Comment ▾ ]            ││ │ ├─────────────────────────────────┤│
│ │ │   AI suggest: not auto-checked    ││ │ │ PRIOR FEEDBACK (Round 1)          ││
│ │ └──────────────────────────────────┘│ │ │ You wrote:                        ││
│ │                                      │ │ │  "Tighten the aria-live region    ││
│ │ Overall rubric score: 4.83 / 5       │ │ │   and add mobile touch behavior." ││
│ │                                      │ │ │ Addressed status: ✓ both          ││
│ │                                      │ │ ├─────────────────────────────────┤│
│ │                                      │ │ │ REFERENCES                        ││
│ │                                      │ │ │ ↗ Mentor playbook                  ││
│ │                                      │ │ │ ↗ WAI-ARIA dialog pattern         ││
│ ├─────────────────────────────────────┤ │ └─────────────────────────────────┘│
│ │ FEEDBACK (3-block)                   │ │                                      │
│ │ ▼ What worked                        │ │                                      │
│ │   [ template ▾ ] [ generate w/ AI ]  │ │                                      │
│ │   [ textarea                       ] │ │                                      │
│ │                                      │ │                                      │
│ │ ▼ Required corrections (0)           │ │                                      │
│ │   No corrections required at v2.     │ │                                      │
│ │   [ Add a correction ]               │ │                                      │
│ │                                      │ │                                      │
│ │ ▼ Optional suggestions (1)           │ │                                      │
│ │   1. Consider documenting the focus  │ │                                      │
│ │      restoration target in JSDoc.    │ │                                      │
│ │      [ Edit ] [ Remove ]             │ │                                      │
│ │   [ Add a suggestion ]               │ │                                      │
│ ├─────────────────────────────────────┤ │                                      │
│ │ COACHING NOTE (for mentorship)       │ │                                      │
│ │ Sneha's mobile testing improved this │ │                                      │
│ │ round. Encourage same in upcoming    │ │                                      │
│ │ tasks. [ Save to her profile ]       │ │                                      │
│ └─────────────────────────────────────┘ │                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ Reassign ]  [ Withdraw (conflict) ]    [ Save draft ]  [ Decide → ]         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States:** default · loading · saving_draft · drafted · submitting_decision · decision_made · withdrawn · reassigned · concurrent_edit

**Edge cases:**
- Mentor refreshes after submitting → confirmation screen
- Reviewer opens v2 they reviewed v1 of → continuity banner with option "Switch reviewer" (helps governance)
- Mentor has never reviewed contributor → "fresh reviewer" banner
- Mentor reviewed contributor 4+ of last 5 → one-time soft caution banner on entry
- AI service unavailable → assist panel collapses to "AI assist unavailable"; review still possible
- Evidence file unreadable → flag the row; mentor can request re-upload
- Concurrent edit (rare: 2 mentors on same task) → version conflict modal (cross-portal pattern)
- Conflict-of-interest withdraw → review reassigned (Journey F)

**Cognitive load:**
- AI suggestions visible inline next to each criterion — mentor sees the suggestion AND their own field side-by-side
- Confidence shown per AI suggestion (not just overall) → mentor knows where to trust vs verify
- Coverage gaps explicit → mentor knows which criteria they must manually check
- Feedback templates reduce blank-page anxiety

**Decision heuristics:**
- "Is the AI right?" → confidence + source + coverage gap = decide
- "Is this rework or accept?" → criteria stars + missing addressed = decide
- "Should I worry about this contributor?" → Mentor watch + last 5 decisions

**Accessibility:**
- Tab order: header → brief → evidence → criteria (per row: stars → comment) → feedback → coaching → footer
- AI assist panel has `aria-live="polite"` for confidence updates
- Star ratings have `role="slider"` with keyboard arrow controls
- Each criterion has its own region with `aria-labelledby`

**Cross-portal:**
- Brief, criteria, evidence sourced from cross-functional task store
- AI assist calls Review Assistant agent (cross-functional doc 05)
- Decision writes audit + dispatches notification + transitions task state
- Coaching note saved to contributor profile (visible in contributor doc 01 §5.K)

---

#### 5.D.2 Decision modal — Accept
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│  Accept this submission?                                       │
│                                                                │
│  Task: Date Picker · FocusScope · Round 2                     │
│  Contributor: Sneha M.                                         │
│  Overall rubric: 4.83 / 5                                     │
│                                                                │
│  Two-stage routing                                             │
│  After your accept, this goes to Karthik (Acme Corp reviewer).│
│                                                                │
│  Consequences                                                  │
│  ✓ Mentor decision: Accept                                    │
│  → Route to enterprise reviewer (two-stage)                   │
│  → If they also accept, contributor's payout becomes eligible │
│  → A credential will be issued                                │
│                                                                │
│  Reviewer confidence                                          │
│  ◉ Confident   ○ Comfortable   ○ Tentative                    │
│                                                                │
│  Final comment (optional, visible to contributor)             │
│  [ textarea ]                                                  │
│                                                                │
│  [ Cancel ]                              [ Confirm accept ]   │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** "Tentative" → soft "Are you sure?" prompt; tentatives flag for governance review (audit).

---

#### 5.D.3 Decision modal — Request rework
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│  Request rework?                                               │
│                                                                │
│  Round 2 of 3 · One more rework round will exhaust the limit. │
│                                                                │
│  You've written 2 required corrections. Confirm they're       │
│  specific enough for the contributor to act on.               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 1. Add aria-live region for month announcements          ││
│  │    Major                                                  ││
│  │ 2. Implement mobile-touch-outside dismiss                ││
│  │    Major                                                  ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  SLA for contributor to resubmit: [ 48h ▾ ]                   │
│                                                                │
│  [ Cancel ]                              [ Send for rework ]  │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** at round = totalRounds, the "Rework" option is replaced with "Final reject" — the system enforces the round limit per SOW.

---

#### 5.D.4 Decision modal — Reject
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│  Reject this submission?                                       │
│                                                                │
│  This is a strong action. The contributor can dispute the     │
│  decision — a senior mentor will review.                      │
│                                                                │
│  Reason (required, visible to contributor + audit)            │
│  [ textarea ]                                                  │
│                                                                │
│  Category                                                      │
│  ○ Doesn't meet criteria                                       │
│  ○ Off-spec                                                    │
│  ○ Quality below threshold                                     │
│  ○ Plagiarism / fraud (escalates immediately)                 │
│  ○ Other                                                       │
│                                                                │
│  Coaching available?                                          │
│  ☐ Offer a mentorship session to discuss                      │
│                                                                │
│  [ Cancel ]                              [ Confirm reject ]   │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** plagiarism/fraud → automatic escalation to senior mentor + governance.

---

#### 5.D.5 Reassign review modal
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│  Reassign this review                                          │
│                                                                │
│  Pool: Helios review mentors                                  │
│                                                                │
│  Suggested (capacity, fit):                                   │
│  ◉ Amelia Stone · 20% load · Accessibility expert            │
│  ○ Rajesh Verma · 80% load · React focus                     │
│  ○ Specific person... [ search ]                              │
│                                                                │
│  Reason (required, audit + visible to next reviewer)          │
│  [ ▾ Capacity ]   [ Conflict ]   [ Expertise ]   [ Other ]    │
│  [ textarea ]                                                  │
│                                                                │
│  [ Cancel ]                              [ Reassign ]         │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.D.6 Withdraw (conflict of interest)
**Phase 1** · 🚧 BUILD

```
┌──────────────────────────────────────────────────────────────┐
│  Withdraw from this review                                     │
│                                                                │
│  Use this when you have a conflict of interest (you know the  │
│  contributor outside Glimmora, you're related, etc.).         │
│                                                                │
│  Type                                                          │
│  ○ Personal connection                                         │
│  ○ Prior employment / collaboration                            │
│  ○ Financial interest                                          │
│  ○ Other                                                       │
│                                                                │
│  Brief note (governance only — not shown to contributor)      │
│  [ textarea ]                                                  │
│                                                                │
│  The review will be reassigned automatically.                 │
│                                                                │
│  [ Cancel ]                              [ Withdraw ]         │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.D.7 Diff viewer — `/mentor/queue/[reviewId]/diff`
**Phase 1** · SOW §3.1.MVP.5 · 🚧 BUILD

Same diff layout as contributor doc 01 §5.H.3, but from the mentor's POV:
- Left: v1 evidence + notes + criteria status at submit
- Right: v2 (current)
- Highlight what changed; show "addressed" status from contributor's checklist
- Side-by-side video for demo.mp4 comparisons (if applicable)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Review · Diff · Date Picker                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ EVIDENCE                                                                       │
│ ┌──────────────────────────────────┐  ┌──────────────────────────────────┐  │
│ │ v1 (Round 1)                       │  │ v2 (Round 2)                       │  │
│ │  spec.md                           │  │  spec.md  (+12 lines, -2)          │  │
│ │  demo.mp4                          │  │  demo.mp4 (new)                    │  │
│ │  tests.txt                         │  │  tests.txt                         │  │
│ │                                    │  │  aria-test.md (new)                │  │
│ └──────────────────────────────────┘  └──────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────┤
│ CRITERIA                                                                       │
│  v1: 4 / 6 addressed → v2: 6 / 6 addressed                                    │
│                                                                                │
│  Newly addressed:                                                              │
│   ✓ Screen reader announces month change (your prior comment: "missing")     │
│   ✓ Mobile touch dismisses (your prior comment: "iOS Safari issue")          │
├──────────────────────────────────────────────────────────────────────────────┤
│ CONTRIBUTOR'S NOTES (v2 cover note)                                           │
│ "Tested in Chrome, Firefox, Safari + mobile Safari. Added aria-live region   │
│  for month change per your round 1 feedback."                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

#### 5.D.8 Per-review audit — `/mentor/queue/[reviewId]/audit`
**Phase 1**

Lists every event on this review: assigned · opened · saved-draft · AI override delta · decision · resubmitted · final.

---

### 5.E History

#### 5.E.1 History — `/mentor/history`
**Phase 1** · ✅ KEEP

```
┌──────────────────────────────────────────────────────────────┐
│ History                                                        │
│ Your decisions, ordered by most recent                        │
├──────────────────────────────────────────────────────────────┤
│ [ All ] [ Accepted ] [ Rework ] [ Rejected ] [ Withdrawn ]   │
├──────────────────────────────────────────────────────────────┤
│ DATE     │ TASK              │ CONTRIB. │ ROUND │ DECISION    │
│ ─────────┼───────────────────┼──────────┼───────┼─────────────│
│ May 26   │ Date Picker R2    │ Sneha M. │ 2/3   │ ✓ Accept    │
│ May 24   │ Date Picker R1    │ Sneha M. │ 1/3   │ ⟲ Rework    │
│ May 18   │ Auth modal        │ Kavi S.  │ 1/3   │ ✓ Accept    │
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ [ Personal metrics → ]                                         │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.E.2 Decision detail (read-only) — `/mentor/history/[decisionId]`
**Phase 1**

Read-only snapshot of the review at decision time: criteria scores, feedback, AI delta, audit trail.

**Edge:** clicking a Rework decision links to the resulting Round-N review item in queue (if open) or its own history entry (if closed).

---

#### 5.E.3 Personal metrics — `/mentor/history/metrics`
**Phase 1** · ✅ KEEP

```
┌──────────────────────────────────────────────────────────────┐
│ Your metrics · Last 30 days                                    │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │Reviews   │ │ Avg time │ │SLA hit % │ │ Accept % │         │
│ │   18     │ │  22 min  │ │   94%    │ │   78%    │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
├──────────────────────────────────────────────────────────────┤
│ DECISIONS                                                      │
│  Accept    14  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                │
│  Rework     3  ▓▓▓                                             │
│  Reject     1  ▓                                               │
├──────────────────────────────────────────────────────────────┤
│ AI ALIGNMENT (assistive, never automatic)                     │
│  Took AI suggestion as-is: 11 (61%)                           │
│  Modified AI suggestion:    5 (28%)                           │
│  Overrode AI suggestion:    2 (11%)                           │
│  All overrides logged in audit.                               │
├──────────────────────────────────────────────────────────────┤
│ COACHING NOTES WRITTEN                                        │
│  9 notes saved to contributor profiles                        │
└──────────────────────────────────────────────────────────────┘
```

> **Important:** these are observations of the mentor's own work. They are NOT performance scores or comparisons to peers. We do not show "X% better than peers" — that triggers calibration anxiety and is Phase 2 governance territory.

**Cognitive load:** numbers shown without color tones. No ranking, no rivals. Self-knowledge only.

---

### 5.F Escalation

#### 5.F.1 Escalation queue — `/mentor/escalation`
**Phase 1** · `mentor.senior` and `mentor.lead` only · SOW §4.3 · 🔧 WIRE

**Use case:** disputes, SLA breaches that the originating mentor couldn't resolve, conflict-of-interest reassignments that need senior judgment.

```
┌──────────────────────────────────────────────────────────────┐
│ Escalations                                                    │
│ 1 open · 12 resolved last 30d · Avg time to resolve: 5h        │
├──────────────────────────────────────────────────────────────┤
│ [ All ] [ Open ] [ SLA breach ] [ Dispute ] [ Conflict ]      │
├──────────────────────────────────────────────────────────────┤
│ TIME  │ TYPE         │ TASK / CONTRIB.  │ ASSIGNED TO │ →    │
│ ──────┼──────────────┼──────────────────┼─────────────┼──────│
│ 18m   │ Dispute      │ Auth modal       │ unassigned  │ [ → ]│
│       │              │ Kavi S.          │             │      │
│ 2d    │ SLA breach   │ CSV export       │ Priya I.    │ [ → ]│
│       │  (closed)    │                  │             │      │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.F.2 Escalation detail — `/mentor/escalation/[escalationId]`
**Phase 1** · 🔧 WIRE

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Escalations · Dispute · Auth modal · Kavi S.                                │
│ Opened 18m ago · Type: Dispute · Severity: Medium                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ CONTEXT                                                                       │
│ Original mentor: Rajesh Verma · Original decision: Reject (May 24)           │
│ Reject reason: "Doesn't meet criteria — only 2 of 6 addressed."              │
│                                                                                │
│ Contributor's dispute (Kavi S.):                                              │
│ "I addressed criteria 3, 5, and 6 in the supplementary notes. The mentor    │
│  may have missed them. Asking for re-review."                                │
│                                                                                │
│ Evidence: [ Open original review ] [ Open contributor notes ]                │
├──────────────────────────────────────────────────────────────────────────────┤
│ YOUR ADJUDICATION                                                             │
│                                                                                │
│ Decision                                                                       │
│ ○ Uphold original mentor's decision (reject stands)                          │
│ ○ Override — change to Accept                                                 │
│ ○ Override — change to Rework                                                 │
│ ○ Reassign to a different mentor for fresh review                            │
│                                                                                │
│ Reasoning (required, visible to all parties)                                  │
│ [ textarea ]                                                                   │
│                                                                                │
│ ☐ Add coaching note to original mentor's record                              │
│                                                                                │
│ [ Cancel ]                                          [ Submit adjudication ]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States:** open · assigned · in_review · resolved · escalated_further (to governance)

**Edge cases:**
- Original mentor active on a related review → notification of dispute
- Adjudication overrides → contributor + original mentor both notified
- Plagiarism/fraud → automatic forward to governance (platform admin doc 04)

**Cognitive load:** four clear options; reasoning required for transparency.

---

### 5.G Mentorship

#### 5.G.1 Mentorship sessions — `/mentor/mentorship`
**Phase 1** · SOW §20.2 · ✅ KEEP polish

**Use case:** the mentor's schedule of mentorship sessions (scheduled by the system based on contributor opt-ins).

```
┌──────────────────────────────────────────────────────────────┐
│ Mentorship sessions                                            │
├──────────────────────────────────────────────────────────────┤
│ TODAY (3)                                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 14:00 · 30 min · Sneha M.                                 │ │
│ │ Focus: Date Picker follow-up                              │ │
│ │ Joined: Google Meet · [ Join → ]                          │ │
│ │ [ Brief ] [ Suggested topics ] [ Past notes ]            │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 15:30 · 30 min · Kavi S.                                  │ │
│ │ Focus: Quarterly check-in                                 │ │
│ │ [ Brief ] [ Suggested topics ]                            │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 17:00 · 45 min · Yusuf O.                                 │ │
│ │ Focus: Backend ladder review                              │ │
│ │ [ Brief ]                                                  │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ UPCOMING (8)                                                   │
│ Tomorrow · 10:00 · Sneha M. · ...                              │
│ Tomorrow · 14:00 · Anita R. · ...                              │
│ ...                                                            │
├──────────────────────────────────────────────────────────────┤
│ HELD (this week) · 4                                          │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.G.2 Session detail — `/mentor/mentorship/[sessionId]`
**Phase 1** · 🔧 WIRE

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Mentorship · Sneha M. · Today 14:00–14:30                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ CONTRIBUTOR BRIEF                                                             │
│ Sneha Menon · Designer · L3 · India                                           │
│ Track: Women workforce                                                        │
│ Tasks last 30d: 4 completed (3 first-try) · acceptance 92%                   │
│                                                                                │
│ Their recent work                                                              │
│  ✓ Date Picker · FocusScope · accepted today                                  │
│  ⟲ Date Picker · Round 1 · rework May 24                                      │
│  ✓ Auth modal · accepted May 18                                               │
│  ✓ Search shortcuts · accepted May 8                                          │
│                                                                                │
│ Their goals (from profile)                                                    │
│  "Move from L3 to L4 in accessibility this quarter."                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ SUGGESTED TOPICS (rule-based, from their recent work)                         │
│ ✦ Recurring strength: aria-live region usage — call it out                   │
│ ✦ Pattern from round 1: mobile testing gap — coach on test matrix             │
│ ✦ Skill progression: 14 acceptances in accessibility — eligible to claim L4? │
│ ✦ Mentorship opt-ins: short-session preference active                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ EXTERNAL                                                                      │
│ Meeting link: https://meet.google.com/abc-xxxx-zyy                            │
│ [ Open meeting ]   [ Copy link ]                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ COACHING NOTE (write during or after session)                                 │
│ [ textarea ]                                                                   │
│ ☑ Visible to Sneha in her profile                                            │
│ ☐ Visible to her supervisor (if student) / lead mentor                       │
│                                                                                │
│ [ Save draft ]                              [ Save and finish ]               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States:** scheduled · in_progress (during window) · note_saved · closed · no_show

**Edge cases:**
- Contributor no-shows → "Mark no-show" button; opens follow-up scheduling
- Session needs reschedule → "Reschedule" → coordinated via notifications
- Sensitive topics (safety, harassment) → "Escalate to governance" link visible

**Cognitive load:**
- Brief gives mentor 30s of catch-up
- Suggested topics are starter prompts, not a script
- Note field is the only mandatory action; everything else assistive

**Cross-portal:** coaching note writes to contributor profile (doc 01 §5.K).

---

### 5.H Profile & Settings

#### 5.H.1 Profile — `/mentor/profile`
**Phase 1**

```
┌──────────────────────────────────────────────────────────────┐
│ [Avatar]  Priya Iyer                                          │
│           Lead Mentor · Design Systems · India                │
│           Mentor since January 2025                            │
│           [ Edit ]                                             │
├──────────────────────────────────────────────────────────────┤
│ COMPETENCY (admin-set, view-only)                              │
│  Eligible to review:                                          │
│   • React (L1–L4)                                              │
│   • Figma (L1–L4)                                              │
│   • Accessibility / WCAG (L2–L4)                              │
│   • TypeScript (L2–L3)                                        │
├──────────────────────────────────────────────────────────────┤
│ STATS (last 30 days)                                          │
│   18 reviews · 22 min avg · 94% SLA · 78% accept rate         │
├──────────────────────────────────────────────────────────────┤
│ MENTORSHIP (this month)                                       │
│   12 sessions held · 8 active mentees                         │
└──────────────────────────────────────────────────────────────┘
```

---

#### 5.H.2 Edit profile — `/mentor/profile/edit`
**Phase 1**

Editable: bio, avatar, language(s), timezone, mentorship intro paragraph (shown to contributors).

Non-editable (admin-only): name, competency, role.

---

#### 5.H.3 Settings — `/mentor/settings`
**Phase 1**

Section index: Notifications · Availability · Account · Privacy.

---

#### 5.H.4 Notification preferences — `/mentor/settings/notifications`
**Phase 1**

Same channel matrix pattern as contributor (in-app / email / SMS):
- New review assigned (critical, locked on)
- SLA approaching (warning)
- Mentorship session in 30 min (reminder)
- Escalation directed to me (critical)
- Mentor digest (weekly summary)

---

#### 5.H.5 Availability — `/mentor/settings/availability`
**Phase 1** · SOW §4.3

**Use case:** declare when you're available to be assigned reviews; matters for matching and SLA fairness.

```
┌──────────────────────────────────────────────────────────────┐
│ Availability                                                   │
├──────────────────────────────────────────────────────────────┤
│ Working hours                                                  │
│ ┌────┬────┬────┬────┬────┬────┬────┐                          │
│ │Mon │Tue │Wed │Thu │Fri │Sat │Sun │                          │
│ ├────┼────┼────┼────┼────┼────┼────┤                          │
│ │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │    │    │                          │
│ └────┴────┴────┴────┴────┴────┴────┘                          │
│ From [ 09:00 ▾ ]  to  [ 18:00 ▾ ]                              │
│ Timezone [ Asia/Kolkata (IST) ▾ ]                              │
│                                                                │
│ Weekly review capacity                                         │
│ [ Up to 25 reviews / week ▾ ]                                 │
│                                                                │
│ Out of office                                                  │
│ ☐ Mark me OOO from [ date ] to [ date ]                       │
│   While OOO, new reviews go to others; existing reviews pause │
│                                                                │
│ [ Save ]                                                       │
└──────────────────────────────────────────────────────────────┘
```

**Edge:** OOO → matching skips this mentor for new assignments; existing queue paused (no SLA accrual).

---

### 5.I Notifications

#### 5.I.1 Notifications page — `/mentor/notifications`
**Phase 1**

Same pattern as contributor + enterprise. Filters: All · Unread · Review · Mentorship · Escalation · Digest.

---

## 6. Shared component patterns

References — same primitives as previous docs:
- Status chips · readiness bars · confirmation modals · empty states · toasts · version conflict modal · scan-failed modal

Mentor-specific patterns:

### 6.1 Rubric row
- Star scale (5) + comment toggle
- AI suggestion shown inline (with confidence + source)
- Delta logged to audit when reviewer differs from AI

### 6.2 SLA tier badge
- **Healthy** (gray) · **Watch** (steel) · **Warning** (gold) · **Critical** (orange) · **Breached** (red)
- Auto-updates as time passes; recomputed every minute on visible queues

### 6.3 Continuity / fresh / paired flag
- Textual chip on queue rows + banner inside review detail
- Drives anti-rubber-stamp safeguards

### 6.4 3-block feedback editor
- What worked · Required corrections · Optional suggestions
- Templates per criterion category
- Per-correction severity (blocker / major / nit)

### 6.5 Decision confirmation modal
- Required reason field for non-accept decisions
- Reviewer confidence selector
- Consequence preview (what happens to contributor + downstream)

---

## 7. State machines

### 7.1 Review lifecycle (mentor side)

```
[Assigned] ── mentor opens ──> [In review]
                                    │
                                    ├ accept ──> [Closed: accepted]
                                    │              │
                                    │              ▼ (if two-stage)
                                    │           [Routed to enterprise reviewer]
                                    │
                                    ├ rework ──> [Sent back to contributor]
                                    │              │
                                    │              ▼ (contributor resubmits)
                                    │           [Round N+1] (same mentor or new)
                                    │
                                    └ reject ──> [Closed: rejected]
                                                   │
                                                   ▼ (contributor disputes)
                                                [Escalation]
```

### 7.2 Escalation lifecycle

```
[Opened] (auto from SLA breach OR contributor dispute OR mentor conflict) 
   │
   ▼
[Assigned to senior] ── opens ──> [In adjudication]
                                       │
                                       ├ uphold ──> [Resolved: upheld]
                                       ├ override ──> [Resolved: overridden]
                                       ├ reassign ──> [Reassigned: new mentor]
                                       └ forward ──> [Forwarded to governance]
```

### 7.3 Mentorship session lifecycle

```
[Scheduled] ── 5 min before ──> [Reminder]
   │
   ▼ start time
[In window] ── after end time ──> [Held: pending note]
   │                                  │
   │ no-show                          ▼ mentor saves note
   ▼                              [Closed: noted]
[No-show] ── follow-up scheduled ──> ...
```

---

## 8. Cross-portal touchpoints

| Event in mentor portal | Affects | Cross-fn doc |
|---|---|---|
| Mentor accepts (single-stage) | Contributor → payout eligible + credential; project advances | 01, 02 |
| Mentor accepts (two-stage) | Enterprise reviewer queue + project advances | 02 |
| Mentor rework | Contributor revision flow | 01 |
| Mentor reject | Contributor sees rejection; dispute entry available | 01 |
| Mentor withdraws (conflict) | Review reassigned; audit | 05 |
| Reassign across team (lead) | New mentor sees in queue; audit | 05 |
| Escalation opened | Senior mentor queue | — |
| Escalation forwarded | Platform admin governance (doc 04) | 04 |
| Coaching note saved | Contributor profile | 01 |
| AI override delta | Audit event | 05 |
| OOO toggle | Matching engine skips for new assignments | 05 |
| Adjudication overrides decision | Contributor + original mentor notified; audit | 01, 05 |

---

## 9. Data model sketch (mentor-relevant entities)

| Entity | Key fields | Notes |
|---|---|---|
| Mentor | id, name, email, roles[] (mentor / senior / lead), competency[], pools[], availability, capacity, status | Identity |
| Competency | role+skill+level allowed; e.g., {role: design, skill: figma, levelMin: 1, levelMax: 4} | Admin-set |
| ReviewAssignment | id, taskId, submissionId, mentorId, assignedAt, dueAt, slaTier, state | One per round |
| ReviewDecision | assignmentId, decision (accept/rework/reject/withdraw), reason, reviewerConfidence, rubricScores[], feedback (3-block), aiOverrides[], decidedAt | Immutable on submit |
| AiOverrideDelta | criterionId, aiSuggestion, mentorActual, mentorComment | Captured per criterion |
| Escalation | id, type, originatingDecisionId, raisedBy, openedAt, assignedTo, resolution, resolvedAt | Senior workflow |
| MentorshipSession | id, mentorId, contributorId, scheduledAt, duration, focus, externalLink, note, status | Per session |
| CoachingNote | sessionId? or reviewId?, mentorId, contributorId, text, visibleTo[], createdAt | Surfaces in contributor profile |
| MentorMetrics | mentorId, period, reviewCount, avgTimeMin, slaHitPct, decisionsByKind, aiOverrideRate | Materialized weekly |

Full schema in cross-functional doc 05.

---

## 10. RBAC matrix

| Action | mentor | mentor.senior | mentor.lead |
|---|---|---|---|
| Read own queue | ✓ | ✓ | ✓ |
| Read others' queue (pool) | — | — | ✓ (own pool) |
| Decide on own assignment | ✓ | ✓ | ✓ |
| Withdraw (conflict) | ✓ | ✓ | ✓ |
| Reassign own | ✓ | ✓ | ✓ |
| Reassign others' (pool) | — | — | ✓ (own pool) |
| Open escalation queue | — | ✓ | ✓ |
| Adjudicate escalation | — | ✓ | ✓ |
| Forward to governance | — | ✓ | ✓ |
| Edit rubric template | — | — | — (admin only — doc 04) |
| View team load | — | — | ✓ (own pool) |
| Read own audit | ✓ | ✓ | ✓ |
| Read audit of own pool | — | — | ✓ |

---

## 11. Open decisions

1. **Continuity flag default** — proposed: when contributor resubmits round 2+, the system OFFERS the same mentor first but allows them to "Switch reviewer" with one click. Alternative: force a fresh mentor each round (anti-rubber-stamp purist). Confirm.

2. **Anti-rubber-stamp pairing caution** — proposed: one-time soft banner when mentor has reviewed contributor 4+ of last 5 — NOT a continuous dynamic queue badge (over-scoped). Confirm.

3. **Round cap** — proposed: 3 rounds per task max. After round 3, the system forces a hard decision (accept/reject, no further rework). Configurable per work-type policy. Confirm.

4. **Plagiarism / fraud → auto-escalate** — proposed: reject reason category "Plagiarism / fraud" auto-forwards to platform governance, skipping senior mentor adjudication. Confirm.

5. **Tentative-confidence decisions** — proposed: if mentor marks confidence "Tentative", the decision still applies but is flagged for governance review. Confirm whether tentative is allowed at all, or only for Accept (not Reject).

6. **Mentor self-metrics scope** — proposed: own numbers only, no peer comparison, no leaderboard. Confirm (this is the right answer; flagging only to make sure).

7. **Coaching note visibility** — proposed default: visible to contributor in their profile. Optionally also visible to supervisor (student track) or lead mentor. Never visible to enterprise. Confirm.

8. **Evidence pack export** — proposed Phase 1 minimum: per-decision JSON of audit + submission metadata + rubric. Phase 2: full case file with embedded evidence files. Confirm Phase 1 floor.

9. **Pool model** — proposed: mentors belong to one or more pools (e.g., "Helios review pool", "Reporting review pool"). Lead mentor oversees one pool. Confirm.

10. **OOO during open review** — proposed: existing reviews pause (no SLA accrual); new reviews skip. Alternative: existing reviews auto-reassign. Confirm.

11. **AI assist availability when LLM down** — proposed: review proceeds without AI; assist panel collapses; audit notes "AI unavailable". Confirm fallback.

12. **Reviewer confidence default** — proposed: "Confident" pre-selected for Accept; "Comfortable" for Rework; "Confident" for Reject. Mentor can change. Confirm defaults.

13. **Two-stage routing visibility in mentor view** — proposed: banner on review header "Routes to enterprise reviewer after you" + consequence preview in decision modal. Confirm.

14. **Mentor competency editing** — proposed: admin-set only, mentors see read-only. Alternative: mentor can self-declare with admin approval. Confirm Phase 1 model.

15. **Mentor mentorship intro paragraph** — proposed: shown to matched contributors before first session. Edited by mentor in profile. Confirm whether mandatory or optional.

---

## End of mentor portal spec

Next docs:
- `04-platform-admin-portal.md` — Glimmora-side admin (Phase 1 minimal: governance queue, mentor management, rubric templates, university partnerships; most Phase 2)
- `05-cross-functional.md` — Auth, RBAC, audit, AI service, notifications, integrations, accessibility, data model
- `06-phase-1-scope-lockdown.md` — Consolidated 90-day checklist across all portals
