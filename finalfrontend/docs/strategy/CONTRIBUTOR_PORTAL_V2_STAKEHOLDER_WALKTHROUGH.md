# GlimmoraTeam Platform V2 — Stakeholder Walkthrough Script

**Audience:** CEO, executive stakeholders, enterprise customer demos, internal team alignment
**Duration:** 18–25 minutes (lifecycle demo) + 10 minutes (Q&A)
**Environment:** `NEXT_PUBLIC_CONTRIBUTOR_DEMO=1`, `NEXT_PUBLIC_MENTOR_DEMO=1`, dev server at `localhost:3000`
**Pre-demo:** clear `localStorage` to load fresh seed (or open in incognito window)

---

## 0 · One-paragraph pitch (read aloud before opening the browser)

> "What you're about to see is one connected workforce execution ecosystem. Two portals — contributor and mentor — share a single operational lifecycle. Tasks move through state in real time. AI helpers are summoned per workflow, never pushed. The same task object persists from assignment through completion. Every action you take in the demo creates real, observable state changes that ripple across every screen that depends on it. This is what we mean by *believable enterprise workforce ecosystem*."

---

## 1 · Walkthrough order

The demo is built around **one task moving end-to-end** so the storyline stays coherent.

### Recommended order — Contributor side (12–15 min)

| # | Screen | Time | Purpose |
|---|---|---|---|
| 1 | `/contributor/dashboard` | 90s | Set the operational tone. Show active work, momentum, AI cue. |
| 2 | `/contributor/tasks` | 60s | Workload queue. Filter chips, readiness preview. Stable taxonomy. |
| 3 | `/contributor/tasks/t-4821` | 2 min | Workroom cockpit. Brief, instructions, evidence, mentor feedback inline. |
| 4 | `/contributor/tasks/t-4821/revision` | 2 min | Per-task revision workflow. Mentor feedback panel, correction checklist, AI fix hints. |
| 5 | **(check off all corrections)** | — | Watch state flip to "Ready to resubmit." |
| 6 | `/contributor/tasks/t-4821/submit` | 90s | Submission flow with three-stage indicator. Submit → mock mentor scheduler. |
| 7 | **(wait ~8s for mock mentor response)** | — | The task transitions automatically. |
| 8 | `/contributor/tasks/completed` | 60s | New entry appears at top of archive. Header KPIs increment. |
| 9 | `/contributor/progress` | 90s | Earnings this month tile ticks up. Recent contributions list shows the new task. |
| 10 | `/contributor/profile` | 60s | Accepted count incremented. Workload card reflects one fewer active task. |
| 11 | `/contributor/tasks/revisions` | 90s | Cross-revision command center. Activity stream shows the full sequence. |

### Recommended order — Mentor side (6–8 min)

| # | Screen | Time | Purpose |
|---|---|---|---|
| 12 | `/mentor/dashboard` | 60s | Operational dashboard with priority review queue, governance alerts. |
| 13 | `/mentor/reviews/pending` | 60s | Severity-rail review queue. Auditable badges. |
| 14 | `/mentor/sla-monitor` | 60s | SLA & risk monitoring. Time-to-decision metrics. |
| 15 | `/mentor/reviews/escalated` | 60s | Escalated cases with severity context. |
| 16 | `/mentor/reviews/governance-holds` | 60s | Compliance/legal holds workflow. |
| 17 | `/mentor/reviews/rework` | 60s | Rework requests workflow. |

---

## 2 · Demo storyline beat-by-beat

### Beat 1 — "The contributor's morning" (Dashboard)
**Open:** `/contributor/dashboard`

**Say:**
> "When the contributor lands at work, they see what matters now. Not a generic dashboard. Their active workload, their next operational action, momentum signals, and one summoned-not-pushed AI panel. Every card on this page derives from live state — the numbers update as work moves."

**Demonstrate:**
- Point to the Priority Work card highlighting "Revision needed" — the workflow continuity surfaces what needs the contributor next.
- Point to AI Productivity card (collapsed) — open it briefly to show context-aware suggestions derived from current workload state.
- Click "Open revision" on the Date Picker revision card.

### Beat 2 — "Stepping into the workroom" (Per-task workroom)
**Land on:** `/contributor/tasks/t-4821`

**Say:**
> "This is the workroom. Cockpit layout. Left side is the work pane — brief, instructions, deliverables, evidence drop zone. Right side is the context pane — acceptance criteria, AI helpers, progress, mentor feedback. The mentor's feedback is *inlined* — they don't have to go find it."

**Demonstrate:**
- Scroll to mentor feedback inline. Point to "What worked" forest-toned block leading.
- Point to the "Open revision flow" CTA.
- Open the AI helper in the context pane briefly. **Say:** "Confidence labeled. Sourced. Overridable. No chatbot."

### Beat 3 — "Working through corrections" (Revision flow)
**Click:** the revision CTA → lands on `/contributor/tasks/t-4821/revision`

**Say:**
> "Revisions don't feel punitive. The mentor's What-Worked leads. Corrections are a checklist with per-correction AI fix hints — sourced from the contributor's own accepted history. The contributor moves through them at their own pace."

**Demonstrate:**
- Show the Mentor Feedback Panel (forest tone). Read the What-Worked block aloud.
- Open the first correction card. Show the AI fix hint panel — point to the source line.
- Check off both corrections. Watch the progress sidebar fill, the readiness score climb, the state flip to "Ready to resubmit."
- **Say:** "Every checkbox mutates the unified task store. This persists across navigation. If I reload right now, everything is preserved."

### Beat 4 — "Sending it back" (Submission flow)
**Click:** Resubmit → lands on `/contributor/tasks/t-4821/submit`

**Say:**
> "Submission is its own flow, not a button. Three stages — Prepare, Review, Confirm. Readiness validation. AI submission check. Note to mentor. Declaration tick. The contributor sends with confidence, not anxiety."

**Demonstrate:**
- Scroll through Readiness Validation. Point to live signals.
- Open AI Submission Check briefly.
- Tick declaration. Click Submit. **Routes back to workroom in `under_review` state.**

### Beat 5 — "The mentor's turn" (Mock mentor scheduler)
**Stay on:** `/contributor/tasks/t-4821` (workroom in under_review state)

**Say:**
> "In production, this is where the mentor reviews. For this demo, a mock mentor scheduler responds in about 8 seconds. Watch the state."

**Wait 8 seconds.** Task transitions to `completed` (round 2+ on this task triggers approval).

### Beat 6 — "Completed work" (Archive)
**Navigate:** `/contributor/tasks/completed`

**Say:**
> "The accepted submission lives here. Mentor's What-Worked quote attached. Credential issued. Portfolio-eligible flagged. Header KPIs incremented in real time — total accepted, lifetime earned, monthly rhythm chart."

**Demonstrate:**
- Point to the new entry at the top of the grid.
- Point to header KPIs — call out that "Lifetime earned" reflects the new payout.
- Click filter chip "First-try" to show categorization.

### Beat 7 — "The trajectory view" (Progress)
**Navigate:** `/contributor/progress`

**Say:**
> "This is the contributor's growth surface. Earnings tile updated. Recent contributions list shows the new task at the top. Six-month chart shows direction. Momentum cards show streak, velocity, consistency. Recognition feed surfaces mentor acknowledgments."

**Demonstrate:**
- Point to "This month earnings" tile — note the delta.
- Open Earnings Panel · "Recent contributions" view. New task at top.
- Briefly scroll the trend chart and milestone progression.

### Beat 8 — "The contributor's record" (Profile)
**Navigate:** `/contributor/profile`

**Say:**
> "Profile is the contributor's operational identity. Trust band, reliability metrics, verified skills, contribution history, achievements. The accepted count just incremented. The streak just extended."

**Demonstrate:**
- Point to header snapshot tiles — Accepted count, streak.
- Scroll to Reliability Panel briefly.
- Scroll to Contribution History timeline.

### Beat 9 — "Cross-revision command center" (Revisions workspace)
**Navigate:** `/contributor/tasks/revisions`

**Say:**
> "When the contributor has multiple revisions in flight, this is where they manage them. Each row is one revision; the right rail shows the full mentor context for whichever is selected. The activity stream on the right shows the lifecycle we just walked."

**Demonstrate:**
- Click a different revision row. Right-rail context loads.
- Point to the activity stream — show the new "Mentor accepted" event from our demo.

### Beat 10 — "The mentor side" (Switch portals)
**Navigate:** `/mentor/dashboard`

**Say:**
> "Same lifecycle, opposite UX philosophy. Where the contributor sees motivation, the mentor sees governance. Severity rails, auditable badges, SLA timers, escalation paths. Same underlying state model."

**Demonstrate:**
- Point to severity-rail review queue.
- Point to operational KPIs and governance alerts.
- Click into `/mentor/reviews/pending` briefly.
- Open `/mentor/sla-monitor` to show timer-based monitoring.

### Beat 11 — "Specialized governance flows"
**Navigate** through:
- `/mentor/reviews/escalated` — escalated cases
- `/mentor/reviews/governance-holds` — compliance/legal holds
- `/mentor/reviews/rework` — rework requests

**Say:**
> "Each governance workflow has its own surface — not crammed into one generic dashboard. The mentor's mental model is preserved."

---

## 3 · Before/after transformation narrative

These are the talking points to weave through the walkthrough:

| Before | After |
|---|---|
| Fragmented contributor screens that didn't share state | Unified task store; clicking through any surface reflects the same lifecycle |
| Generic SaaS dashboards | Operational workspaces tuned to contributor execution or mentor governance |
| Isolated contributors with separated mock data | One workforce ecosystem — completion ripples to profile, earnings, history, activity |
| Manual coordination between contributor + mentor lifecycles | Lifecycle continuity: contributor submits → mentor reviews → contributor revises → mentor approves; same task object throughout |
| Static AI panels with hardcoded text | AI guidance derived from live state: unresolved corrections, readiness gaps, deadline urgency, workload patterns |
| V1 page bodies competing for visual attention | V2 ecosystem: same primitives, same header pattern, same chip system across every active surface |
| No persistence — refresh erased the demo | Zustand-backed store survives reload; mock mentor timer survives reload via `onRehydrateStorage` |
| Sidebar accent (brown) didn't match the contributor's accent (teal) | Sidebar accent now derives from portal config — contributor teal, mentor forest, enterprise brown |

---

## 4 · Strongest ecosystem areas (lead with these)

These are the parts of the platform where the realism is strongest. **Demo these confidently.**

1. **Per-task lifecycle continuity** (Workroom → Submit → Mock Mentor → Revision → Resubmit → Completed). Every transition is real, observable, persistent.
2. **The Revisions Workspace** (`/contributor/tasks/revisions`). Best V2 surface. Queue + sticky right-rail detail + live activity stream + cross-revision AI helper.
3. **Mock mentor scheduler.** 8-second response feels alive. Re-arms after reload.
4. **Workroom cockpit** (`/contributor/tasks/[taskId]`). Cockpit layout, summoned AI, inline mentor feedback, evidence workspace.
5. **Mentor portal severity & SLA system.** Governance reads as audit-grade.
6. **Activity stream** in Revisions workspace. Seeded historical events + live mutation log.
7. **NextStepCard.** Cross-surface forward-motion widget; the contributor never feels stranded.
8. **Visual consistency within V2.** Same primitives, same chrome, same chip semantics across 9 contributor surfaces and the mentor portal.

---

## 5 · Remaining weak areas (route around these in the demo)

Be honest internally; route around them in front of stakeholders.

1. **Profile deep metrics still static.** Trust score 86/100, reliability percentages, skill ladder progression, achievements feed, recognition timeline, AI capability insights — all read static mock data. *Show the Profile header snapshot tiles (live), don't drill below them.*
2. **Progress deep metrics still static.** Six-month chart, momentum cards, performance insights, AI growth assistance, recognition feed, milestone progression, 13-week consistency band — all `contributorProgress` mock. *Show the header tile updates, briefly point to the chart for direction, don't dwell on the numbers.*
3. **V1 Earnings detail page** (1,998 LOC). Still in sidebar. *Don't click "Detailed earnings" during the demo — the V2 Progress page's Earnings Panel covers what stakeholders need to see.*
4. **V1 Settings** is now stub-backed in demo mode (works fine) but the body is still V1 motion-animated. *Mention Settings exists; don't make it a demo beat.*
5. **Per-task workroom uses templated content for lite tasks.** Tasks without rich `instructions`/`deliverables` get default boilerplate. *Always demo with `t-4821` (date picker) — it has the rich content overlay.*
6. **`in_progress → ready_for_submission` auto-transition missing.** *Don't make a point of the readiness score; let the contributor's action drive the transition.*
7. **Hidden V1 routes** (Credentials, Learning, Messages, Support) still reachable by URL. *Don't paste those URLs during the demo; they're not in the sidebar.*
8. **Onboarding modal** is V1. *Demo bypass flag prevents it from firing; don't sign out during the demo.*

---

## 6 · Demo safety pass — what we verified

Last-mile checks before the walkthrough:

- ✅ All 22 demo-path routes return 200 (contributor + mentor critical paths).
- ✅ Typecheck clean.
- ✅ No runtime errors in the dev log on the demo path.
- ✅ No user-visible "Coming soon" / "TODO" / "Placeholder" text leaking through.
- ✅ No dead `onClick={() => {}}` handlers in V2 surfaces.
- ✅ Settings page renders in demo mode (stub-backed, was previously erroring).
- ✅ Sidebar accent matches portal (teal for contributor, brown for mentor).
- ✅ Store version v3 — fresh seed on first load.
- ✅ Mock mentor scheduler survives reload via `onRehydrateStorage`.
- ✅ Activity backlog seeded with 8 believable past events.

---

## 7 · Pre-demo checklist (run 5 minutes before the call)

1. **Clear browser localStorage** for `localhost:3000`. Or open an incognito window. (Forces fresh seed v3.)
2. **Restart the dev server** if it's been running for hours (avoid OOM from accumulated webpack cache).
3. **Verify the home page loads in under 2s** — if not, hard-restart.
4. **Open these three tabs in order** so they're pre-warmed:
   - `/contributor/dashboard`
   - `/contributor/tasks/t-4821`
   - `/mentor/dashboard`
5. **Have this script open on a second monitor.**
6. **Mute notifications.** Slack, email, calendar — all off.

---

## 8 · Stakeholder presentation recommendations

### Lead with the lifecycle, not the screens
Don't say "let me show you the dashboard, then the workroom, then…". Say "let me walk you through how one task moves through the workforce." The screens emerge from the lifecycle, not the other way around.

### Use one task across the whole demo
Use `t-4821` (Date Picker) as the spine. It's the richest-content task in the store, has a real revision history, has mentor feedback baked in. Switching tasks mid-demo breaks the narrative.

### Trigger the mock mentor visibly
When you click Submit, **say "watch the state" and pause**. The 8-second mentor response is a moment of theater. If you keep talking, stakeholders miss it.

### Don't fight the V1 surfaces
If a stakeholder clicks Settings or Earnings detail unprompted, frame it as "those are still on the production stack — V2 brings them in next." Don't pretend they're V2.

### Lead with what's most real
Workroom → Revision → Submission → Completed is the strongest stretch. Open with the dashboard for context, but spend the most demo minutes in the Workroom/Revision/Submission triangle.

### Close with the mentor side
The mentor portal is the "same data, opposite UX" payoff. Save it for last. Don't open with it.

### Keep AI claims modest
The AI in this demo is real-state-derived, not LLM-generated. Frame it as "AI helpers that look at your current workflow state and surface the next operational hint." Don't oversell as "AI co-pilot."

### Have an answer for "is this real?"
**Honest framing:** "The frontend is real and operational — every action you saw mutate state actually persists in browser storage. The backend integration is the next phase. What we built is the experience layer that the backend will populate."

---

## 9 · What this demo PROVES

After the walkthrough, the stakeholder should understand:

1. **The contributor lifecycle is one connected workflow.** Same task, multiple surfaces, one state model.
2. **The mentor governance lifecycle mirrors it.** Same data shape, different UX philosophy.
3. **AI is summoned per workflow, not pushed as a chatbot.** Embedded helpers, not interruptions.
4. **The system has operational visibility at every level.** From dashboard tiles to activity streams to per-task progress.
5. **The visual language is consistent and enterprise-mature.** No two pages feel like different products.
6. **The product is ready to be backed by a real API.** What stakeholders see is the experience contract; the backend can plug into it.

---

## 10 · What this demo does NOT prove (be honest internally)

1. **Profile and Progress deep analytics are not yet live-derived.** They show believable static numbers, not real trajectory.
2. **The V1 surfaces still exist** behind the curtain. Earnings detail, Credentials, Learning, Messages, Support are not yet V2.
3. **AI is rule-based derivation**, not language-model generation. Honest framing if asked.
4. **Backend integration is the next phase.** The store-based persistence is browser-local.

---

**End of walkthrough script.**

Print this. Read it once before the call. Keep it open on a second monitor during the demo.
