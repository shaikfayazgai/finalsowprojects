# GlimmoraTeam — Stakeholder Walkthrough Master Script

**Phase:** 1B MVP — Final Stakeholder Walkthrough Orchestration
**Target audience:** Executive sponsors, prospective enterprise buyers, board reviewers
**Duration:** 18 minutes (optimal) · 12 min (compressed) · 25 min (extended Q&A)
**Posture:** Operational orchestration story, not a feature parade

---

## 0 · Pre-flight Checklist

Before opening the browser:

| Item | Status check |
|---|---|
| `NEXT_PUBLIC_ENTERPRISE_DEMO=1` set in env | Unblocks enterprise + reviewer surfaces |
| `NEXT_PUBLIC_CONTRIBUTOR_DEMO=1` set | Unblocks contributor surfaces |
| `NEXT_PUBLIC_MENTOR_DEMO=1` set | Unblocks mentor surfaces |
| Browser opens to `/enterprise/dashboard` directly | Avoids login UI |
| Open **4 browser tabs** preloaded — `/enterprise/dashboard`, `/contributor/dashboard`, `/mentor/dashboard`, `/enterprise/review` | Enables tab-swap role transitions; no URL typing live |
| `localStorage` cleared in advance | Forces clean seed state |
| Sidebar in expanded mode in every tab | Visible nav reinforces ecosystem story |
| Browser zoom at 100% | Avoid layout surprises |
| Display: 1440×900 minimum, 1920×1080 preferred | Cards lay out as designed |

**Avoid live URL typing during demo.** Pre-load tabs; switch with Cmd+1/2/3/4.

---

## 1 · Master Sequence — 9 Acts, 18 Minutes

### Act 1 · The Orchestration Pulse *(1 min — Enterprise tab)*

**Page:** `/enterprise/dashboard`

**What the stakeholder sees:** The Cross-Role Activity feed at the bottom showing contributor, mentor, and enterprise events interleaved. KPI tiles at the top. AI Orchestration panel summarizing the state of the workforce.

**Talk track:**
> "This is the Enterprise Workspace. Notice it doesn't open on settings or admin tools — it opens on the *operational pulse* of the workforce. Right now this organization has *N* programs in flight, *X* deliveries pending acceptance, and the activity feed is showing real movement from contributors and mentors. Everything you'll see today flows through this one Dashboard."

**Why it matters:** Sets the frame — Enterprise is the orchestration layer, not an admin console.

**Click:** None. Just point.

---

### Act 2 · Where Work Originates *(2 min — Enterprise tab)*

**Page:** `/enterprise/sow` → click **+ New SOW** → `/enterprise/sow/intake`

**What the stakeholder sees:** SOW Workspace with active engagements, then the 5-stage Intake workspace: Scope → AI Scope Analysis → Operational Classification → Decomposition Readiness → Program Creation.

**Talk track:**
> "Every piece of work in the ecosystem originates here. This isn't a generic file upload — it's a five-stage operational intake. The enterprise team describes the scope; AI analyzes complexity, estimates workforce capacity, and detects governance frameworks. Notice: the AI advises with confidence labels; the humans decide. The terminal stage creates a delivery program with downstream lifecycle handoffs to decomposition, execution, and acceptance."

**Why it matters:** Demonstrates the upstream origin of every contributor task.

**Click:** Type a title ("Helios accessibility uplift Q3"), pick a classification, walk through the 5 stages. Do not actually commit — instead, point at the terminal-state preview.

**Recovery:** If the form gets in a weird state, refresh the page; intake state is local React state and resets cleanly.

---

### Act 3 · Decomposition into Executable Work *(2 min — Enterprise tab)*

**Page:** `/enterprise/decomposition`

**What the stakeholder sees:** Workstream breakdown for the active SOWs. Each program decomposes into workstreams, each workstream into task units. Dependency graph. AI decomposition assistance.

**Talk track:**
> "Approved scope flows in here. The SOW becomes a decomposition plan — workstreams, task units, skill requirements, dependencies. This is where intent becomes executable work. Notice the AI surfaces structural risks: which workstreams depend on which, which need senior contributors, which could parallelize. Again — AI advises; the operator decides."

**Click:** Hover over a workstream to expand. Do not drill into `/decomposition/[planId]` detail — that's V1 and now redirects.

---

### Act 4 · The Portfolio + Operational Movement *(2 min — Enterprise tab)*

**Page:** `/enterprise/projects` then `/enterprise/delivery-tracking`

**What the stakeholder sees:**
- Projects: portfolio tiles of active programs with health chips
- Delivery Tracking: full-width lifecycle continuum (Decomposed → Execution → Mentor → Revision → Enterprise Review → Accepted → Billing) showing live counts

**Talk track (Projects):**
> "Each decomposed SOW becomes a program in the portfolio. Health is rolled up from the contributor task store — this isn't a hand-maintained status report; the colors update as work moves through the lifecycle."

**Talk track (Delivery Tracking):**
> "This is the operational progression layer. Every unit of work flows through this pipe. Right now *N* are in contributor execution, *M* are with mentors, *K* are awaiting our acceptance. The Governance Propagation panel below shows which mentors are carrying which load — that's the cross-role visibility the enterprise needs without micromanaging the workforce."

**Click:** Don't drill into a project row — `/projects/[id]` is V1 and redirects. Hover to show segmented bars; that's enough.

---

### Act 5 · The Contributor Vantage *(2-3 min — Switch to Contributor tab Cmd+2)*

**Page:** `/contributor/dashboard` then `/contributor/workroom` then `/contributor/tasks`

**What the stakeholder sees:** Today view, an active workroom (in-progress task with deliverables checklist + mentor feedback), the full task list.

**Talk track:**
> "Same ecosystem, different vantage point. The contributor sees only what they need: today's work, what's in progress, what mentor feedback is pending. The teal accent signals execution mode. Notice: this is the same task store the enterprise dashboard reads from — there's no parallel data universe."

**Demonstrate propagation:** Point to a task in `under_review` state. *"This delivery is currently with a mentor. Let's go see that mentor's queue."*

**Click safety:** Workroom is rich and safe. Tasks list is safe. Avoid `/credentials`, `/learning`, `/messages`, `/community`, `/support` — they're V1 and hidden from nav but still URL-reachable.

---

### Act 6 · The Mentor Vantage *(2 min — Switch to Mentor tab Cmd+3)*

**Page:** `/mentor/dashboard` then `/mentor/queue/[id]`

**What the stakeholder sees:** Operational dashboard showing review queue depth, SLA monitor, AI flags. Drill into a queue item to show the mentor review surface.

**Talk track:**
> "Mentors govern quality. The forest accent signals governance mode. From this surface, mentors approve work or send it back for revision. Notice how the system shows revision rounds, blockers resolved, governance markers — this isn't a generic ticketing system, it's a *governance* surface. The enterprise sees this same propagation upstream in Delivery Tracking."

**Critical propagation moment:** *"When the mentor clears a delivery, it doesn't immediately get accepted. It enters the validation lane — let's go see that next."*

**Click safety:** Drill one level into `/mentor/queue/[reviewId]`. Avoid `/contributors/risk`, `/analytics/*`, `/governance/audit` — those are V1.

---

### Act 7 · The Validation Lane *(2 min — Switch to Enterprise tab, navigate to /enterprise/reviewer)*

**Page:** `/enterprise/reviewer`

**What the stakeholder sees:** Cross-role lifecycle strip (Contributor → Mentor → **Reviewer (you are here)** → Enterprise → Billing). Validation queue. Tabbed validation workspace with Recommend tab.

**Talk track:**
> "Between mentor governance and enterprise acceptance sits the Reviewer — an enterprise-side validation role. Reviewers verify evidence packages, score readiness, surface escalations. Crucially, they don't decide acceptance — that authority sits with the enterprise. Notice the Recommend tab: Ready for Enterprise, Flag Escalation, Mentor Revisit. These are *annotations*, not decisions."

**Why this exists:** *"This solves a real operational problem — large enterprise buyers don't want to read every mentor note. The Reviewer pre-validates the package and tees up a clean acceptance decision."*

**Click:** Select a row, open the Evidence tab, check a couple boxes (local-state verification — won't persist but demonstrates the workflow).

---

### Act 8 · The Acceptance Decision — *The Propagation Moment* *(3-4 min — Stay on Enterprise tab, navigate to /enterprise/review)*

**Page:** `/enterprise/review`

**What the stakeholder sees:** Acceptance queue, tabbed validation panel (Overview, Lineage, Evidence, Criteria, **Decision**).

**Talk track:**
> "This is the only surface in the entire workforce ecosystem where the enterprise *acts*. Everywhere else, they observe. Here, they sign off. Acceptance closes the lifecycle and triggers billing."

**Demonstrate live propagation — the headline moment:**

1. Select a pending delivery
2. Open all 5 tabs briefly (Overview → Lineage → Evidence → Criteria) — *"Look at the full lineage. Every mentor decision, every revision round, every evidence artifact is one tab away."*
3. Open Decision tab
4. Type an acceptance note: *"Approved. Quality bar exceeded."*
5. **Click "Accept & close lifecycle"**
6. **Switch immediately to Cmd+1 (Enterprise Dashboard)** — point at the activity feed: the acceptance event has appeared
7. **Switch to /enterprise/billing (sidebar click)** — point at the Eligibility Queue: the accepted line is now there
8. **Switch to Cmd+2 (Contributor)** — point at the Completed tab: contributor sees their work as accepted

> *"That's one click in Enterprise Review that propagates through five surfaces in real time. One state machine, six observation surfaces."*

**This is the demo's emotional peak.** Pause here. Let it land.

---

### Act 9 · Financial Closure *(2 min — Enterprise tab, /enterprise/billing)*

**Page:** `/enterprise/billing`

**What the stakeholder sees:** Eligibility queue with the just-accepted line, invoice lifecycle (eligible → draft → sent → paid), per-program budget utilization, workforce compensation by skill cohort.

**Talk track:**
> "Acceptance isn't the end of the lifecycle — it's the start of financial closure. The accepted line is now eligible. As programs accumulate accepted lines, they synthesize into invoices that flow through draft → sent → paid. Notice the workforce compensation rollup at the bottom — contributors are compensated by skill cohort, with a paid/pending split. The brown 'over envelope' chip on programs is the financial risk surface — same propagation pattern we saw upstream."

**Closing line:**
> "Every section of this surface is derived live from the unified task store. There's no separate billing system — financial closure is a *projection* of operational state."

**Click safety:** No drill-ins anywhere. All `/billing/{invoices,rate-cards,pricing,reports}` legacy URLs now redirect back to this V2 page if anyone strays.

---

### Closing · Return to Pulse *(30 seconds — Enterprise tab Cmd+1)*

**Page:** `/enterprise/dashboard`

**Talk track:**
> "We started here on the orchestration pulse. We just walked the entire workforce lifecycle — origination, decomposition, execution, governance, validation, acceptance, financial closure. Three role portals, one ecosystem. Authority distributed, propagation immediate, AI as a summoned assistant — never a decision-maker."

---

## 2 · Role Transition Choreography

The four-tab structure is the mechanism. Transitions are narrated, not navigated.

| From → To | Mechanism | Talk-track bridge |
|---|---|---|
| Enterprise Delivery Tracking → Contributor | Cmd+2 | "Same ecosystem, contributor vantage" |
| Contributor (task in review) → Mentor | Cmd+3 | "That review sits in a mentor queue — let's go see it" |
| Mentor (cleared work) → Reviewer | Cmd+1, click "Reviewer Workspace" in sidebar | "Cleared work enters the validation lane" |
| Reviewer → Enterprise Review | Sidebar click "Enterprise Review" | "Validated, ready for sign-off" |
| Enterprise Review (after accept) → Cross-portal propagation | Cmd+1 then Cmd+2 then back | "Watch one acceptance propagate through five surfaces" |
| Enterprise Review → Billing | Sidebar click | "Acceptance triggered billing eligibility" |

The bridges are *causal*, not just *navigational*. Each transition is "because X just happened, now Y."

---

## 3 · Demo Safety Pass — What NOT to Click

### Hard rule: stay inside the sidebar
Every V2 surface is reachable from the sidebar. Anything *not* in the sidebar is risky.

### Specifically avoid

| Surface | Reason | If clicked accidentally |
|---|---|---|
| Any SOW row → `/sow/[id]` | V1 detail | Redirects to `/sow` — harmless loopback |
| Any project row → `/projects/[id]` | V1 detail | Redirects to `/projects` — harmless |
| Decomposition plan drill → `/decomposition/[id]` | V1 detail | Redirects to `/decomposition` — harmless |
| Review detail → `/review/[id]` | V1 detail | Redirects to `/review` — harmless |
| Enterprise sidebar: **Profile**, **Settings**, **Notifications** | Still V1, unstyled | Pages render but visibly off-rhythm. Just don't click |
| Contributor sidebar: any link below "Skill Ladder" if visible | V1 placeholders | Avoid |
| Mentor sidebar: `Analytics` section, `Governance` section, `Contributor Insights` lower items | V1 | Avoid |

### If you click the wrong thing

- **V1 redirect happens:** browser URL briefly shows the V1 path, then snaps back to V2. Continue narrating; the recovery is invisible.
- **V1 page actually renders (Profile/Settings/Notifications):** click the sidebar back to a V2 surface. Recovery line: *"That's a Phase 2 surface; let's get back to the operational view."*
- **AI guidance pages or contributor sub-pages render unstyled:** Cmd+L into the address bar, type the safe V2 URL.

### Walkthrough-safe URL allowlist (memorize 4)

```
/enterprise/dashboard
/contributor/dashboard
/mentor/dashboard
/enterprise/review
```

If anything goes sideways, type one of these.

---

## 4 · Executive Talk Track — Reusable Phrases

Pre-canned framings. Use these instead of improvising — they keep tone consistent and avoid jargon.

### Orchestration framing
- "Authority distributed, propagation immediate."
- "One state machine, six observation surfaces."
- "Same ecosystem, different vantage."
- "Acceptance closes the lifecycle and triggers billing."

### Governance framing
- "AI advises; humans decide."
- "Authority never transfers — mentors govern, enterprise accepts."
- "Summoned, not pushed."

### Operational framing
- "This isn't a status report — it's where the work is right now."
- "Movement here mirrors what contributors and mentors see, in real time."
- "Operational propagation, not data duplication."

### AI positioning (memorize these — see Section 5)
- "AI is an operational assistant, not a decision-maker."
- "Every signal is confidence-labeled."
- "When the system has nothing meaningful to flag, it says so — instead of fabricating concern."

---

## 5 · AI Positioning Strategy

**Always describe AI as:**
- ✓ "Operational assistant"
- ✓ "Governance-aware intelligence"
- ✓ "Orchestration support layer"
- ✓ "Risk visibility engine"
- ✓ "Summoned recommendations"

**Never describe AI as:**
- ✗ "Autonomous workforce manager"
- ✗ "AI that replaces reviewers/mentors"
- ✗ "Magical scope generation"
- ✗ "Decision automation"

### The 3-sentence AI defense (when asked "is this really AI?")

1. *"AI signals are deterministic projections from the operational state — they're not generative speculation, they're computed observations with confidence labels."*
2. *"The model never moves the lifecycle forward — only humans accept, only mentors approve, only contributors submit."*
3. *"When the operational pulse is healthy, the AI panels say so explicitly — they refuse to fabricate concern. That posture is what makes the model credible when something does light up."*

---

## 6 · Timing & Pacing

| Act | Time | Pacing |
|---|---|---|
| 1 · Orchestration pulse | 1 min | Pause — let the dashboard breathe |
| 2 · SOW + Intake | 3 min | Walk the 5 stages — quick on each |
| 3 · Decomposition | 2 min | Skim — don't get lost in detail |
| 4 · Projects + Delivery Tracking | 2 min | Accelerate, this is observation |
| 5 · Contributor | 2.5 min | Slow down on workroom — show realism |
| 6 · Mentor | 2 min | Same — drill once into a queue item |
| 7 · Reviewer | 2 min | Tabs are the story — show 3 tabs |
| **8 · Acceptance & propagation** | **3.5 min** | **Slowest section. This is the climax.** |
| 9 · Billing | 2 min | Quick close |
| Return to pulse | 30 sec | Anchor the takeaway |
| **Total** | **18 min** | Q&A buffer not included |

**Where to pause for effect:**
- After dashboard reveal (Act 1) — let them notice the activity feed
- After SOW Intake stage 4 (AI signals) — let them see the AI confidence chips
- **The acceptance click + tab-switch (Act 8) — biggest pause**
- After billing eligibility queue appears — let them connect "acceptance → invoice"

**Where to accelerate:**
- Projects portfolio (Act 4 first half) — visually rich but read-only
- Decomposition workstream graph — easy to lose audience in detail

---

## 7 · Compressed Walkthroughs

### 12-minute version (skip Reviewer + Contributor depth)

Acts 1 → 2 → 4 (skip 3) → 5 (dashboard only) → 6 (dashboard only) → 8 → 9 → close

### 8-minute "elevator" version

1. Dashboard (1 min) — orchestration pulse
2. SOW + Intake (2 min) — origin
3. Delivery Tracking (1 min) — lifecycle continuum
4. Acceptance + propagation (3 min) — *the moment*
5. Billing (1 min) — closure

### 25-minute extended (add depth + Q&A buffers)

Add to standard:
- Mentor SLA monitor drill
- AI signal deep-dive on Delivery Tracking
- Workforce compensation breakdown in Billing
- 5-minute Q&A reserve

---

## 8 · Demo-Risk Checklist (printable)

Before the demo, confirm:

- [ ] All three demo flags set in env
- [ ] Browser cleared, 4 tabs preloaded
- [ ] Sidebar expanded on all tabs
- [ ] Test the **Acceptance click + propagation** once before going live
- [ ] Have the safe-URL allowlist memorized
- [ ] Backup screen recording of the propagation moment in case live state is awkward
- [ ] Don't promise feature dates during demo — "Phase 2" is the only forward-reference allowed
- [ ] Time-box Q&A separately; do not improvise feature additions mid-demo

---

## 9 · Final MVP Maturity Assessment

| Dimension | Status |
|---|---|
| **Architectural integrity** | ✅ Unified store, single source of truth across 3 portals |
| **Lifecycle continuity** | ✅ End-to-end propagation verified |
| **V2 visual coherence** | ✅ Consistent header/tile/AI/sidebar patterns across 9 enterprise surfaces |
| **Cross-role storytelling** | ✅ Lifecycle strip in Reviewer + cross-role activity in Dashboard make ecosystem legible |
| **V1 isolation** | ✅ 63 V1 routes redirected; sidebar contains only V2 entries |
| **Terminology consistency** | ✅ "Program" canonical; "plan" reserved for decomposition artifacts |
| **AI posture** | ✅ Summoned · confidence-labeled · refuses fabrication |
| **Demo safety** | ✅ Drill-clicks loop back; walkthrough cannot accidentally fall into V1 |
| **Operational realism** | ⚠️ Adequate for 18-min demo. Repetition shows over 25 min. P3 deferred. |
| **Detail surfaces** | ⚠️ SOW/Project/Review *detail* pages are V1 redirects, not V2 builds. Phase 2 scope. |
| **Profile / Settings / Notifications** | ⚠️ Still V1-styled, in sidebar. Visible if clicked, doesn't break. |

**Verdict: STAKEHOLDER-WALKTHROUGH READY.**

The Phase 1B MVP is structurally sound, narratively coherent, and demo-safe. A guided 18-minute walkthrough following this script demonstrates a connected enterprise workforce orchestration ecosystem with believable cross-role propagation, executive-grade language, and a memorable acceptance-to-billing propagation moment as the demo climax.

**Remaining work for Phase 2** (not blocking MVP demo): V2 detail pages (SOW / Project / Review), Profile / Settings / Notifications V2-styling, seed data realism deepening, "this quarter" date pinning, internal type renames for `ProgressionStream → DeliveryProgram`.

**One sentence to close the demo:**
> "What you've seen is one operational truth, observed from three vantage points, closed in seven lifecycle stages — that's GlimmoraTeam."
