# Mentor Review & Acceptance Workflow — Product Design Redesign Strategy

> **Surface in scope:** the Mentor / Reviewer review-and-acceptance workflow in GlimmoraTeam — the human gate between contributor submission and enterprise acceptance, and the AI-assisted surface where money, credentials, and trust are decided.
>
> **Source ground truth:** Master SOW (governance + human-in-the-loop), `PRODUCT_UNDERSTANDING.md` (mental models, AI agent ecosystem, rework loop), `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md` (state machines, escalation paths, audit model), `ENTERPRISE_UX_AUDIT.md` (current pain points, criticality), and the existing frontend (`src/app/mentor/*`, `src/app/enterprise/reviewer/*`).
>
> **One-line thesis:** *The mentor review surface is the throughput ceiling of the entire platform and the only place where AI explainability, governance, and contributor livelihood collide on a single screen. It must be redesigned as a single, opinionated **Review Hub** that makes the right decision the fast decision — and makes every decision auditable.*

---

## 1. Current Workflow Analysis

### 1.1 Current Process (as designed in spec, today)

Per `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 3.2 / § 5.2`, a single review item moves through this lifecycle:

```
assigned → in_progress → under_review
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          accepted     in_rework     reassignment
                            │
                            ▼
                       re-submitted
                            │
                            ▼
                       under_review  (loop, version++)
```

The reviewer's session — per spec — is:
1. Open queue item ranked by SLA urgency + skill match
2. Read task spec, prior reviews, contributor context
3. Open submission + evidence
4. **AI Review Assistant pre-fills rubric scores + summary**
5. Reviewer adjusts rubric (5 criteria × 5 stars)
6. Reviewer writes contributor-visible feedback + internal note
7. Reviewer decides: Accept / Request Rework / Reject (confirmation modal, irreversible)
8. Decision persists; fan-out: contributor notify, reputation recompute, payout eligibility on Accept, version increment on Rework, reassignment/escalation on Reject

### 1.2 Current Frontend Implementation

Two **overlapping surfaces** ship today:

| Surface | Path | State |
|---|---|---|
| Mentor portal | `/mentor/dashboard`, `/mentor/queue`, `/mentor/queue/[reviewId]`, `/mentor/mentorship`, `/mentor/escalation`, `/mentor/history`, `/mentor/profile`, `/mentor/settings` | UI-complete, but **every terminal action is a toast — no persistence** (`AUDIT_CONTEXT.md § 5` rows 17–22; `ENTERPRISE_UX_AUDIT.md § 4.3`). |
| Reviewer sub-portal | `/enterprise/reviewer/review-queue`, `/qa-inbox`, `/review-history`, `/task-monitor`, `/mentoring-log`, `/my-metrics`, `/notifications` | Routes scaffolded; **most pages empty**; `review-queue` wired to live `reviewerApi.listAssignments` (no data); no detail page. |

The mentor detail page (`/mentor/queue/[reviewId]/page.tsx`) is the most-built UI in the system: rubric scoring (5×5), evidence checklist (7/8), artifact downloads (toast-only), structured Q&A, decision confirmation modal. It is, in the audit's words, *"decorative."*

### 1.3 Operational Issues

Drawn from `ENTERPRISE_UX_AUDIT.md § 2.6, § 4.3, § 8.5`, `AUDIT_CONTEXT.md § 3.6, § 5`:

1. **Toast-only terminal actions.** Accept / Request Rework / Reject, file download, session-notes save, escalation resolve / reassign, profile and settings save — none persist. *"This is the highest-impact UX failure in the product."*
2. **No "currently reviewing" lock.** Two reviewers can grab the same item; no presence indicator.
3. **No SLA-breach warning until after breach.** Countdown is shown, but there is no progressive urgency state, no proactive nudge, no auto-escalation rule visible in UI.
4. **No keyboard navigation in queue or rubric.** Reviewer throughput is bound by mouse round-trips. Spec explicitly calls for *"keyboard navigable, peek panel, one-key approve/reject."*
5. **Two overlapping reviewer surfaces** with divergent implementations — operational confusion when reviewer pool grows.
6. **Mentorship sessions, escalations, history are read-only theatre** — drawers open, fields fill, "Save" toasts. No artifact ever leaves the browser.
7. **File downloads are stubs.** A reviewer cannot actually inspect the submission they are about to decide on.
8. **Empty reviewer sub-portal** (`/enterprise/reviewer/*`) shows no fallback or onboarding state — a logged-in reviewer sees blank pages.

### 1.4 UX Issues

1. **Decision asymmetry is invisible.** *Rework* and *Reject* carry radically different downstream consequences (rework = workroom reopens + version increments; reject = no payout + possible reassignment / reputation hit) — but the three buttons sit at equal visual weight (`SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 5.3`: *"the UI must make this unambiguous"*).
2. **AI suggestions are invisible.** The Review Assistant is specified to pre-fill rubric and summarize submission. The current UI shows an empty rubric. There is no "AI suggested" badge, no confidence score, no rationale, no "AI suggested 3, you set 5" delta capture — every explainability rule from `§ 6.5` is violated.
3. **Evidence is buried.** Artifacts open in a separate page / download. The rubric on the right, the submission on the left — there is no inline preview, no side-by-side artifact viewer, no quote-to-feedback affordance.
4. **No rework genealogy.** A v3 submission shows nothing about what feedback was given on v1 and v2; the reviewer must re-derive the conversation from memory.
5. **Feedback is unstructured.** A single textarea. No criterion-anchored comments, no severity tagging (blocker / major / nit), no templates — so feedback quality is reviewer-personality-dependent.
6. **No "currently reviewing" indicator and no draft autosave** — if the reviewer's tab crashes after 40 minutes of work, the rubric is gone.
7. **Escalation modal is generic** — `RaiseEscalationModal` collects type/severity/description but does not capture root-cause classification (reviewer capacity vs. quality threshold vs. timeline feasibility vs. ambiguous spec), so escalation analytics will never show *why* the system is bottlenecking.
8. **No bulk operations.** Mark priority, assign-to-self, batch-defer — the spec calls for them; the UI has zero.

### 1.5 Governance Risks

1. **Decisions don't persist** → there is no audit trail → the *"every state change produces an immutable audit event"* requirement (`§ 7.2`) is unfulfilled where it matters most.
2. **AI suggestion + human override delta is not captured.** The Master SOW's human-in-the-loop principle demands *"AI suggested 3, reviewer set to 5"* be retrievable for later analysis (`§ 6.5`). Today nothing is captured.
3. **No reviewer-level anomaly detection surface** — the audit notes *"no reviewer-level pattern detection (always approves, never rejects)"* (`§ 6.4`). A compromised or coerced reviewer is invisible.
4. **Evidence pack export is hypothetical.** Spec defines an exportable pack of *"task spec, submissions with versions, reviews with rubric scores, acceptance record, payment record, credential, escalations, audit events"* (`§ 7.6`) — none of this composes today because reviews don't persist.
5. **Escalation has no SLA.** `ENTERPRISE_UX_AUDIT.md § 8.7`: *"No SLA on escalation resolution. No escalation history per entity."* So an item can escalate and rot.
6. **No tamper-evident signature** on review decisions. Phase 2 cryptographic signing is anticipated (`§ 7.2`), but the data model does not yet anticipate it.

### 1.6 Trust Risks

1. **Contributor trust:** A toast that disappears in 4 seconds is the only evidence that a livelihood-affecting decision occurred. Contributors who do not see decisions reflected in their dashboards within minutes will assume bias or sabotage. Rejection without genealogy reads as personal.
2. **Reviewer trust:** Reviewers cannot see *their own* impact, cadence, or fairness metrics in a useful way (the mentor profile shows numbers, but they are mock and not reviewer-controlled). Reviewer self-correction depends on this feedback loop.
3. **Enterprise trust:** Enterprise admins must accept deliverables downstream — but they cannot see the AI's confidence, the reviewer's confidence, or the rework history that produced this submission. So final acceptance becomes a rubber stamp or a re-litigation.
4. **AI trust:** Because AI suggestions are invisible, reviewers either ignore them entirely (low AI ROI) or rubber-stamp them (governance failure). Both outcomes undermine the human-in-the-loop premise.

### 1.7 Scalability Problems

`SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 9.4`: *"Reviewer pool is the throughput ceiling. As volume grows, reviewer queue depth grows; SLAs slip."*

The compounding failure modes:

| Mode | What happens | Why current UI accelerates it |
|---|---|---|
| **Review fatigue** | After ~25 items, reviewers default to lazy decisions | No AI pre-fill, no shortcuts, no template feedback → every item costs full cognitive load |
| **Queue aging** | Items past their SLA window pile up | No leading-indicator dashboard; no auto-escalation visible |
| **Reviewer collision** | Two reviewers decide the same item | No presence lock |
| **Rework spirals** | Same item bounces v1 → v2 → v3 → v4 | No criterion-anchored feedback, no rework reason taxonomy, no auto-escalate at ≥3 cycles (spec calls for it) |
| **Onboarding cliff** | New reviewer joins, has no rubric calibration aid | No calibration mode, no shadowing UI, no reviewer-pair affordance |
| **AI ROI collapse** | AI Review Assistant ships, nobody uses it | Suggestions invisible; no friction reduction → reviewer reverts to manual; AI metrics flatline |

---

## 2. User Goals & Mental Models

### 2.1 Mentor Goals (the senior reviewer who also coaches)

Per `PRODUCT_UNDERSTANDING.md § 5.3`: *"I have a queue of reviews and an SLA."*

**Primary goals:**
- Decide accurately and quickly — accuracy under time pressure is the job.
- Coach without losing throughput — mentorship sessions cannot cannibalize review capacity.
- Resolve escalations without becoming a help desk.
- Protect contributor livelihood while protecting platform standards (the two pull in opposite directions; the UI must help arbitrate).

**Implicit goals (often unstated, design must support):**
- *"I don't want to be the reason a contributor's rent is late."* → SLA visibility, rework genealogy, fairness aids.
- *"I want my AI assistant to actually help, not to be a fancy autocomplete."* → confidence, sources, one-click override.
- *"I don't want to make a decision that bites me back in three months."* → audit, traceability, signed decisions, escalation off-ramp.

**Mental model diagram:**

```
        ┌──────────────────────────┐
        │   What's on fire?        │  ← top of mind
        ├──────────────────────────┤
        │   What's almost on fire? │
        ├──────────────────────────┤
        │   What's normal?         │
        ├──────────────────────────┤
        │   What is the AI saying  │
        │   about each of these?   │  ← mediating layer
        ├──────────────────────────┤
        │   What did I decide      │
        │   last time on similar?  │  ← memory aid
        └──────────────────────────┘
```

### 2.2 Reviewer Goals (the operational first-pass decision-maker)

Per `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 2.4`: reviewer is the **submission-level Accept/Rework/Reject** authority; enterprise admin holds **final deliverable acceptance**.

**Primary goals:**
- Burn the queue at a sustainable pace (typical target: 6–12 items/day depending on complexity).
- Be defensible — *"if this decision is challenged, can I point to the evidence?"*
- Stay out of escalation — knowing when to *escalate up* vs. *push back on contributor* vs. *accept with note*.
- Build a reviewer reputation (acceptance accuracy, SLA hit rate, contributor satisfaction).

**Reviewer-specific friction the design must resolve:**
- The reviewer is paid per review (or salaried with throughput targets), so every second of UI friction is a literal cost.
- The reviewer sees the *same kind of work* in 50-item batches. The UI must support *batch context recall* (cached rubric calibration, recent decisions on similar tasks).

### 2.3 Contributor Expectations (the upstream user whose work is being judged)

From `PRODUCT_UNDERSTANDING.md § 5.2` and `§ 12`:

> *"I need to find work I can do, do it well, and get paid. Cares about: clarity of expectations, fairness of review, speed of payout, growth of their credential wallet."*

> *"Treat rework like a next iteration, not a failure. The version number ticks up. The history shows the journey. The contributor sees growth signals (skills practiced) even on rejected work."*

**Contributor expectations from the review surface (which the reviewer must deliver through their UI):**

| Expectation | Design implication for the reviewer UI |
|---|---|
| Knowing *why* — criterion-level, not just "rework" | Reviewer UI must force criterion-anchored comments |
| Knowing *what to fix* — actionable, not aesthetic | Severity tagging (blocker / major / nit); templates |
| Knowing *what was good* — preserve morale | A required "what worked" field on rework / reject decisions |
| Knowing *who decided* — accountability | Reviewer identity surfaced on every decision |
| Knowing *when payout happens* — predictability | Acceptance → payout timing visible at decision time |
| Trusting the AI didn't decide alone | Visible "human reviewed" stamp, with reviewer name |

### 2.4 Enterprise Governance Expectations

From `PRODUCT_UNDERSTANDING.md § 13` and `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 6.3–6.4`:

> *"AI cannot accept a deliverable. Acceptance is always human (reviewer first, enterprise final)."*

> *"Hierarchy of attention for the enterprise admin: 1) What needs my approval right now? 2) What's at risk?"*

**Enterprise expects from the mentor/reviewer surface:**

1. **Reviewer decisions are defensible** — when enterprise final-accepts, they want to see the reviewer's rubric, feedback, AI suggestion deltas, and rework genealogy at a glance.
2. **Risk surfaces upstream** — a reworked-3x submission must be *flagged* before enterprise touches it, not discovered.
3. **No AI-only acceptances** — every accept event must carry a verifiable human signature.
4. **SLA breaches are visible at the portfolio level** — the enterprise admin shouldn't have to drill into a project to learn three reviews are 18 hours overdue.
5. **Evidence packs are exportable** — for legal, finance, regulator, internal audit.
6. **Reviewer anomaly detection** — patterns like "always approves" or "always rejects this contributor" must be queryable.

---

## 3. Workflow Redesign

The redesign converges the two surfaces (`/mentor/*` and `/enterprise/reviewer/*`) into a single **Review Hub** (per `ENTERPRISE_UX_AUDIT.md § 9` P1 #1), where mentor capabilities are an *elevated role mode* on the same primitives.

### 3.1 Submission Flow (contributor → review surface, redesigned)

```
Contributor submits  ─►  Submission Service
                              │
                              ├─► Integrity checks (file hash, virus, plagiarism, duplicate-content)
                              ├─► Evidence completeness check (checklist 100%?)
                              ├─► AI Review Assistant (pre-rubric + risk flags)
                              │     ├─ confidence ≥ threshold → "AI ready" badge
                              │     └─ confidence < threshold → "needs human attention" banner
                              ├─► Routing engine
                              │     ├─ skill match
                              │     ├─ reviewer capacity
                              │     ├─ reviewer recency (avoid same reviewer for v1/v2 unless flagged "continuity")
                              │     ├─ enterprise alignment (if reviewer is enterprise-aligned)
                              │     └─ anomaly filter (reviewer's prior decisions on this contributor)
                              │
                              ▼
                         Lands in Reviewer Queue
                              │
                              └─ Item enters "Pending — auto-assigned" state with SLA timer started
```

**Design decisions baked in:**
- **Pre-routing AI scoring** means the queue can show *AI confidence* per item before the reviewer opens it — supporting triage.
- **Recency-aware routing** prevents the same reviewer from rubber-stamping their own v1 feedback in v2 unless explicitly flagged for continuity.
- **Evidence completeness gating** prevents a half-evidenced submission from consuming reviewer attention.

### 3.2 Review Lifecycle (redesigned, with explicit edges)

```
                            ┌──────────────────────────────┐
                            │  Submission ready for review │
                            └──────────────┬───────────────┘
                                           ▼
                            ┌──────────────────────────────┐
                            │   Pending (queued)            │  ← SLA timer t₀
                            └──────────────┬───────────────┘
                                           ▼
                ┌── claim ──────────┐
                │                   ▼
                │   ┌──────────────────────────────────┐
                │   │   In Review                       │  ← "presence lock" on this reviewer
                │   │   (draft rubric, autosaved)        │
                │   └──────────────┬───────────────────┘
                │                  ▼
                │   ┌──────────────────────────────────────────────┐
                │   │   Decision Pending  (confirmation modal)      │
                │   └─────┬──────────┬──────────┬──────────────────┘
                │         │          │          │
                │     Accept     Rework      Reject
                │         │          │          │
                │         ▼          ▼          ▼
                │   ┌──────────┐ ┌──────────┐ ┌──────────────────┐
                │   │ Accepted │ │ Rework   │ │ Rejected          │
                │   │          │ │ Open     │ │ (reassign route OR
                │   │          │ │  → v++   │ │  dispute route)   │
                │   └────┬─────┘ └────┬─────┘ └────┬─────────────┘
                │        │            │            │
                │        ▼            ▼            ▼
                │   Payout       Contributor   Reassignment /
                │   eligible     workroom      Dispute board
                │   Credential   reopens
                │   progress     (history kept)
                │                     │
                │                     ▼
                │              re-submission → back to Pending (SLA resets, version ticks)
                │
                └── release (timeout / explicit "release") → back to Pending
```

**Edges the current product misses:**
- **Presence lock with release.** When a reviewer claims, the item is locked to them for *N minutes* of inactivity; auto-released if abandoned. No double-grab.
- **Decision Pending** state — distinct from "In Review" — because the confirmation modal must persist if the reviewer navigates away (governance: a half-confirmed decision must not vanish).
- **Rework Open with version increment**, where the contributor workroom is reopened *with the prior rubric visible to them, criterion by criterion*.
- **Reject branches into either reassign or dispute** depending on rejection reason taxonomy.

### 3.3 Approval Lifecycle (reviewer accept → enterprise final accept)

```
Reviewer Accept
   │
   ▼
Submission "Reviewer-Accepted"
   │
   ├─► Reputation engine updates (contributor)
   ├─► Reviewer audit event written (signed)
   ├─► AI suggestion vs human decision delta logged
   ├─► Payout eligibility = ENGAGED (not yet released)
   │
   ▼
Deliverable Bundle Ready  (1..N submissions roll up)
   │
   ▼
Enterprise Final Acceptance Queue   ← portfolio-level, missing today
   │
   ▼
Enterprise admin opens deliverable, sees:
   - Reviewer rubric + feedback
   - AI suggestion deltas
   - Rework genealogy
   - Evidence pack preview
   │
   ▼
Final Accept  (human required) → Payment release pipeline triggered
        │
        └─► Audit event chain closes (reviewer signature → enterprise signature → payment txn ID)
```

The reviewer surface must **render the rollup state** so reviewers see *"my Accept on this submission becomes the enterprise's read-out of this bundle"* — they're not just deciding on isolated artifacts.

### 3.4 Rework Loop (the most-used, least-loved path)

`PRODUCT_UNDERSTANDING.md § 12`: *"Treat rework like a next iteration, not a failure."*

```
Reviewer chooses "Request Rework"
   │
   ▼
Rework Composer (modal, not a textarea):
   ┌────────────────────────────────────────────────────────┐
   │  Anchored to rubric criterion that failed              │
   │  ───────────────────────────────────                   │
   │  ▶ Criterion: "Accessibility & UX"                     │
   │      Severity:  [ Blocker | Major | Nit ]              │
   │      Reason:    [ Bug | Incomplete | Non-compliant |   │
   │                   Scope | Documentation ]              │
   │      What's missing (contributor-visible):             │
   │      [ template snippets ▼ ]                           │
   │      _____________________________________             │
   │      What worked  (preserve morale, required):         │
   │      _____________________________________             │
   │      Internal note (reviewer-only):                    │
   │      _____________________________________             │
   │  ───────────────────────────────────                   │
   │  ▶ Add criterion +                                     │
   │                                                         │
   │  Estimated rework deadline: [ auto, editable ]         │
   │  Round count: 2 of 3 (auto-escalates at 3)             │
   └────────────────────────────────────────────────────────┘
   │
   ▼
Contributor workroom reopens with:
   - Side-by-side: prior rubric vs new (criterion-by-criterion delta)
   - Each rework item shows status (open / addressed / acknowledged)
   - Round counter visible
   - "What worked" preserved at top (morale)
   - Resubmit button gated until all blocker items addressed
   │
   ▼
Resubmit → routes back to same reviewer (continuity flag) or fresh reviewer (anti-rubber-stamp flag)
```

**Why criterion-anchored:** a reworked submission that addresses criterion 3 but breaks criterion 1 must be visible to the reviewer *as a deltas grid*, not as a fresh review. The UI surfaces *what changed since last review*.

**Auto-escalation rule (spec, `§ 3.4`):** at round ≥ 3 the item is auto-escalated to mentor/enterprise. The Rework Composer must show this counter so neither party is blindsided.

### 3.5 Escalation Flow

`SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 3.6` defines four escalation lanes. The redesigned surface treats escalation as a *first-class transition*, not a separate page.

```
"Escalate" affordance appears on three triggers:
  - Reviewer-initiated (from review detail)
  - Auto-triggered (SLA breach, rework round ≥ 3, dispute flagged)
  - Contributor-initiated (grievance, reassignment request)

Escalation Composer:
  ┌──────────────────────────────────────────────────┐
  │  Type: [ SLA breach | Quality dispute | Grievance│
  │          | Reassignment | Spec ambiguity ]        │
  │  Root cause (taxonomy, required):                 │
  │    [ Reviewer capacity | Quality threshold |      │
  │      Timeline feasibility | Ambiguous spec |      │
  │      Contributor conduct | Tooling failure ]      │
  │  Target tier (auto-selected, editable):           │
  │    [ Reviewer pool lead | Mentor | Enterprise |   │
  │      Platform admin ]                             │
  │  Resolution SLA: auto-computed by tier            │
  │  Description (>20 chars, required)                │
  └──────────────────────────────────────────────────┘
        │
        ▼
  Escalation lands in target tier's queue with:
   - own SLA timer
   - linkback to original review item (frozen snapshot)
   - parallel-track flag (does original review pause? depends on type)
```

**Critical addition vs. current product:** escalations have their *own* SLA (per `ENTERPRISE_UX_AUDIT.md § 8.7`: *"No SLA on escalation resolution"* is a critical gap). Resolution SLA is enforced and visible.

### 3.6 SLA Handling (redesigned with progressive states)

Today: a number ticks down. After 0, nothing happens visually.

Redesigned: **five progressive SLA states**, each with distinct visual treatment, behavior, and operator response:

| State | Trigger | Visual | System behavior |
|---|---|---|---|
| **Healthy** | > 50% time remaining | Forest green chip, no urgency | Normal queue rank |
| **Watch** | 25–50% remaining | Teal chip + faint pulse | Bumped one rank in queue |
| **Warning** | 10–25% remaining | Amber chip + tooltip "due in Xh" | Bumped to top of reviewer's queue; reviewer's queue header shows count |
| **Critical** | < 10% remaining OR < 4h | Red chip + persistent banner on detail page | Push notification to reviewer; mentor notified |
| **Breached** | t < 0 | Red flashing chip + "OVERDUE" badge | Auto-escalate to reviewer pool lead; reassign; notify enterprise; audit event |

The SLA state is **not just visual** — it changes routing, ranking, notification, and audit semantics. This is what `ENTERPRISE_UX_AUDIT.md § 8.5` calls *"alert before breach, not after."*

---

## 4. Information Architecture Redesign

### 4.1 Mentor / Reviewer Navigation (converged)

**Before** — two parallel IAs:

```
/mentor/{dashboard, queue, mentorship, escalation, history, profile, settings}
/enterprise/reviewer/{review-queue, qa-inbox, review-history, task-monitor,
                      mentoring-log, my-metrics, notifications}
```

**After** — one IA, role-mode toggled:

```
/review-hub
├── Today                       ← single landing surface
├── Queue                       ← live, prioritized
│    ├── My queue
│    ├── Team queue   (mentor mode only)
│    └── Watch list
├── Decisions                   ← history + my-metrics merged
│    ├── Recent decisions
│    ├── Reworks in flight
│    └── Calibration  (peer-decision comparison)
├── Mentorship   (mentor mode only)
│    ├── Sessions
│    └── Mentoring log
├── Escalations
│    ├── Open
│    ├── Watching
│    └── History
├── Inbox        ← QA, contributor questions, notifications, merged
└── Me           ← profile, settings, availability
```

Mentor mode unlocks Team Queue, Mentorship, and Escalation-resolve authority. Reviewer mode hides those. **One nav, one mental model, role-scoped.**

### 4.2 Review Queue Structure

The queue is a **prioritized, segmented, filterable list of decisions** — not a generic table.

```
┌─ Review Queue ──────────────────────────────────────────────────────────────┐
│  ⏱ SLA breach (2)     ⚠ Critical (5)     ▲ Warning (8)     ● Normal (14)    │  ← segment chips
│                                                                              │
│  [ Filter ▾ ] [ Skill ▾ ] [ Project ▾ ] [ Type ▾ ]  [ Sort: SLA urgency ▾ ] │
│  [ ⌨ Press / to focus, J/K to navigate, Enter to open, A to claim ]         │
│                                                                              │
│  🔴 OVERDUE   Accessibility audit · React/A11y                               │
│      ↳ contributor #c4821 · v2 · enterprise: Acme · AI conf: 78% (medium)   │
│      ↳ assigned 32h ago · SLA breached 8h ago · ⚠ auto-escalating in 1h     │
│                                                                              │
│  🟠 4h LEFT  Refactor billing service · Node/Stripe                          │
│      ↳ contributor #c1142 · v1 · AI conf: 92% (high) · ✓ AI ready          │
│      ↳ ⏱ rework round 2 of 3 · last reviewer: you (continuity flag)         │
│                                                                              │
│  ...                                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Each queue row carries seven loadbearing signals**, in this strict order:
1. SLA state (color + countdown + breach text)
2. Task title + primary skill
3. Contributor pseudonym + version + enterprise
4. AI confidence (with bucket: low/medium/high) and "AI ready" badge if rubric is pre-filled
5. Rework round counter if > 1
6. Continuity flag (if same reviewer touched prior version)
7. Anomaly flag (if reviewer-contributor pairing triggers anti-bias rule)

### 4.3 Filters

Three filter tiers, ordered by frequency of use:

**Tier 1 — Always visible (chips at top):**
- SLA segment (Breached / Critical / Warning / Normal)
- Mine vs Team (mentor mode)

**Tier 2 — One click away (dropdowns):**
- Skill
- Project
- Enterprise
- Review type (Initial / Rework / Final)
- AI confidence (Low / Medium / High)
- Round counter (> 1)

**Tier 3 — Power filters (collapsed panel):**
- Continuity flag
- Anomaly flag
- Specific contributor
- Date range
- "Items I've snoozed"

### 4.4 Prioritization System

Composite priority score, made transparent to the reviewer:

```
priority = w₁·SLA_urgency + w₂·rework_round + w₃·enterprise_strategic_tier
         + w₄·skill_match_strength + w₅·contributor_reliability_inverse
         - w₆·reviewer_continuity_penalty (anti-rubber-stamp)
         + w₇·pinned_flag · ∞
```

The composite is visible — *"This item is #1 because: SLA breach (8h ago) + rework round 2/3 + enterprise: Acme (P0)"* — accessible via a "Why is this first?" affordance on the top item.

### 4.5 Task Grouping

The redesigned queue supports four grouping modes (toggle, persisted per reviewer):

| Mode | When useful |
|---|---|
| **Flat by SLA** (default) | Normal flow |
| **Grouped by project** | When a reviewer is enterprise-aligned and wants project context |
| **Grouped by contributor** | When seeing same contributor's v1 → v2 across tasks |
| **Grouped by skill** | When the reviewer wants to batch-decide same-skill items for calibration |

### 4.6 Evidence Access Hierarchy

Evidence today opens in separate file downloads — context lost. Redesigned hierarchy on the detail page:

```
LEVEL 1 (always inline, no click):       summary card, primary artifact preview, evidence checklist
LEVEL 2 (one click, in-pane drawer):     individual artifact viewers (PDF, code, image), structured Q&A
LEVEL 3 (peek, hover):                   AI rationale, plagiarism check, file integrity hash
LEVEL 4 (modal):                         rework genealogy, audit log for this submission
LEVEL 5 (separate route, "drill"):       contributor's full prior history, similar past submissions
```

The point: a reviewer never leaves the decision context to *see* evidence. They leave only to *investigate*.

---

## 5. Dashboard Redesign

### 5.1 Mentor Dashboard ("Today")

**Job:** answer "what needs my attention right now?" in under 5 seconds.

```
┌─ Today, Sat May 23 ───────────────────────────────────────────────────────────┐
│                                                                               │
│  ⚠ NEEDS YOU NOW                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  2 items breaching SLA · 1 escalation past resolution SLA · 1 rework   │ │
│  │   round 3 awaiting auto-escalation review                              │ │
│  │   [ Go to queue ]   [ Resolve escalations ]                            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌── Throughput ──────────┐  ┌── Quality ──────────┐  ┌── AI partnership ──┐ │
│  │  This week  18/25 ▰▰▰  │  │  Accept rate 81%    │  │  AI agree rate 73% │ │
│  │  Avg review time 1.8h  │  │  Rework rate 16%    │  │  Override rate 27% │ │
│  │  SLA hit 94%           │  │  Reject rate 3%     │  │  Conf accuracy 88% │ │
│  └─────────────────────── ┘  └─────────────────────┘  └────────────────────┘ │
│                                                                               │
│  Bottleneck spotlight                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Reviewer pool depth: 6 items > 80% SLA · 3 reviewers offline today    │ │
│  │  Recommendation: claim 2 items from "team queue" to keep pool healthy. │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Mentorship sessions today (3)                       [ open mentorship → ]    │
│  Contributors I'm watching (4)                       [ open watchlist → ]     │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Anchor design choices:**
- *Needs you now* is the only red-zone block — everything else is informational.
- AI partnership panel makes the explainability loop **visible to the reviewer**, building their AI literacy over time.
- Bottleneck spotlight: leading indicator, action prompt — `§ 8.5`'s *"alert before breach"*.

### 5.2 Review Queue Dashboard

The queue page header is itself a mini-dashboard:

```
┌─ Queue header ──────────────────────────────────────────────────────────────┐
│  My queue (14)        ⏱ Avg age 8h     SLA at-risk 5     Today decided 6   │
│                                                                              │
│  Throughput pace ▰▰▰▱▱▱▱▱▱▱   60% of target  (target = 10/day)              │
└──────────────────────────────────────────────────────────────────────────────┘
```

This gives the reviewer constant feedback on *whether they're keeping up*, not just *what's in the queue*.

### 5.3 Workload Visibility (mentor mode)

Mentor-only "Team workload" panel:

```
┌─ Team workload ─────────────────────────────────────────────────────────────┐
│  Reviewer            Queue   Today   SLA hit   Status                       │
│  ──────────────────────────────────────────────────────────────────────────│
│  R. Verma             18      4      88%      🟢 active                      │
│  K. Singh             11      2      94%      🟢 active                      │
│  L. Mehta             24⚠     0      72%⚠     🟠 overdue lunch              │
│  A. Iyer               -      -      -        ⚪ offline (PTO)               │
│                                                                              │
│  Pool depth alert: L. Mehta over capacity (24 vs 15 ceiling)                │
│  Recommended action: rebalance 5 items to R. Verma (skill match)            │
│  [ Rebalance ]                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Bottleneck Visibility

Promoted from absent (today) to first-class. Two views:

- **Inline** on dashboard (above): leading indicators with action prompt.
- **Drill-down** on `/review-hub/decisions/bottlenecks`:

```
Top 5 bottleneck causes this week
  1. "Spec ambiguity" — 14 items (28%)
  2. "Reviewer capacity" — 9 items (18%)
  3. "Contributor evidence gaps" — 7 items (14%)
  ...

Top 3 bottleneck contributors
  1. Project Acme-Helios — 6 items > SLA
  ...

Top 3 bottleneck reviewers (anonymized in mentor mode, named in admin mode)
  ...
```

### 5.5 SLA Risk Indicators

Three layers of SLA risk visualization:

| Layer | What it shows | Where |
|---|---|---|
| **Per-item chip** | This item's SLA state | Queue row, detail header |
| **Per-reviewer band** | This reviewer's at-risk count | Dashboard, queue header |
| **Per-pool gauge** | The pool's collective SLA hit rate (24h, 7d) | Mentor dashboard, admin operations |

### 5.6 Contributor Context Panel (in review detail)

Right-rail collapsible panel on every review detail page:

```
┌─ Contributor context ─────────────────────────────────┐
│  c4821 · joined 7mo ago                                │
│  Verified skills: React (L3), A11y (L2), Tailwind (L2)│
│  Reliability score: 87/100  (▲ 4 this quarter)        │
│                                                        │
│  Recent activity (last 5 reviews):                     │
│    ✓ accepted        Apr 30                            │
│    ✓ accepted        Apr 22                            │
│    ↺ rework→accept   Apr 14  (2 rounds)               │
│    ✓ accepted        Apr  8                            │
│    ✗ rejected        Mar 30  (reason: scope)           │
│                                                        │
│  Anomaly flags: none                                   │
│  Mentor watch: no                                      │
│                                                        │
│  [ See full profile ]                                  │
└────────────────────────────────────────────────────────┘
```

This is the antidote to *"reviewer decides in a vacuum"* — pattern visibility for fairness, recency for context, anomaly flags for trust.

---

## 6. AI Explainability UX

This is the section where the redesign earns its keep. Per the Master SOW (`SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 6.4`): *"AI must surface confidence. AI must be explainable — 'Why' must be one click away on every recommendation."*

### 6.1 AI Review Suggestions — on the rubric

Every rubric criterion gets a structured AI proposal block:

```
┌─ Criterion 3 of 5 · Requirements Adherence ──────────────────────────────────┐
│                                                                              │
│  Your score:    ☆ ☆ ☆ ☆ ☆                                                    │
│                                                                              │
│  ▸ 🤖 AI suggests: ★★★☆☆  (3/5)        confidence: 71% medium                │
│       "Submission covers 4 of 6 stated requirements. Missing: keyboard       │
│        navigation, screen reader labels for the date picker."                │
│       [ Accept suggestion ]   [ Edit ]   [ Reject suggestion ]               │
│                                                                              │
│       Source: spec doc §4.2, requirement matrix lines 12–17                  │
│       Evidence reviewed: Storybook stories, component code                   │
│       Not reviewed: live demo, video walkthrough  ← needs human              │
│                                                                              │
│  Internal note (only you see this):  _____________________________           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

The four explainability primitives, applied to every AI rubric proposal:

1. **Sourced.** What spec / evidence drove this score — clickable, opens the cited spec line in a peek pane.
2. **Editable.** One click to accept; click rating to override.
3. **Confidence.** Shown numerically (71%) and bucketed (low/medium/high), with color.
4. **Coverage gap.** *"Not reviewed"* — the AI tells the reviewer *what it couldn't assess.* This is the single most-overlooked trust primitive.

### 6.2 Confidence Indicators

A consistent visual vocabulary across all AI-touched surfaces:

| Bucket | Range | Color | Visual treatment | Reviewer obligation |
|---|---|---|---|---|
| **High** | ≥ 90% | Forest | Solid badge | Quick-confirm flow available |
| **Medium** | 70–89% | Amber | Outlined badge with tooltip | Full review required |
| **Low** | < 70% | Crimson | Outlined + warning banner above rubric | Mandatory rubric edit; cannot one-click-accept |

The reviewer cannot "speedrun" a low-confidence AI suggestion — the UI enforces friction proportional to risk.

### 6.3 Reasoning Summaries

Every AI suggestion expands to a structured rationale:

```
Why ★★★☆☆?
  ✓ Requirement 1 (auth flow): satisfied — see component/auth/login.tsx:24
  ✓ Requirement 2 (input validation): satisfied — schema in lib/validations
  ✓ Requirement 3 (error handling): satisfied
  ✓ Requirement 4 (responsive design): satisfied — Storybook viewport tests
  ✗ Requirement 5 (keyboard nav): missing — no focus trap found in modal
  ✗ Requirement 6 (screen reader): missing — no aria-label on date picker

Risk flags surfaced:
  ⚠ Confidence on R5 is 54% — could not test interactively
  ⚠ Possible plagiarism: 3 functions overlap with public repo X — see hash report

Model: review-assistant-v3.2 · prompt v17 · 2026-05-23 14:08 UTC
```

### 6.4 Override Controls

Every AI suggestion has a triplet:
- **Accept suggestion** (one click; logs as "AI suggested 3, reviewer accepted 3")
- **Edit** (sets rubric directly; logs as "AI suggested 3, reviewer set 5, delta +2")
- **Reject suggestion** (clears AI input; reviewer enters fresh; logs as "AI suggested 3, reviewer rejected suggestion, set 5")

Each of these maps to an audit event with full payload (model version, prompt, suggestion, override, delta, reasoning capture).

### 6.5 Trust Indicators

A trust ledger on the AI's record, surfaced to the reviewer:

```
┌─ AI Review Assistant performance (you, last 90d) ─────────────────────────┐
│                                                                            │
│  AI/your agreement rate:      73%       (▲ 4% vs last quarter)             │
│  AI confidence calibration:   88%       (when AI says >90%, you agree 91%)│
│  Time saved by AI pre-fill:   ~14h/week                                    │
│  Catches you'd have missed:   7         (flagged risks confirmed on review)│
│                                                                            │
│  [ See override log ]   [ Adjust AI partnership preferences ]              │
└────────────────────────────────────────────────────────────────────────────┘
```

This panel turns the AI from a black box into a colleague whose performance the reviewer can audit.

### 6.6 The Quick-Confirm Lane (the speed payoff)

When confidence is ≥ 90% **and** evidence is complete **and** no risk flags **and** rubric pre-fill is unambiguous:

```
┌─ This submission is "AI ready" ──────────────────────────────────────────┐
│  AI confidence: 94% · All 5 criteria pre-filled · No risk flags          │
│                                                                          │
│  Quick decision lane: review summary → confirm in one click              │
│                                                                          │
│  [ Open summary review ]      [ Open full review ]                       │
└──────────────────────────────────────────────────────────────────────────┘
```

Quick-confirm still requires human action — but reduces a 15-minute review to 90 seconds when the AI's homework is good. This is where reviewer throughput scales without sacrificing the governance guarantee.

---

## 7. Governance & Trust UX

### 7.1 Audit Visibility

Per `ENTERPRISE_UX_AUDIT.md § 6.1`: *"Every entity with audit history needs a 'View audit' panel — collapsible, filterable, exportable. Lives inline, not as a separate page."*

Implementation on the review detail page:

```
┌─ Decision audit ────────────────────────────────────────────────────[expand]┐
│  2026-05-23 14:08  AI Review Assistant v3.2 generated rubric proposal       │
│  2026-05-23 14:21  R. Verma claimed the item (presence lock)                │
│  2026-05-23 14:23  R. Verma overrode criterion 3 (AI:3 → R:5, +2)           │
│  2026-05-23 14:24  R. Verma added 2 criterion-anchored feedback items       │
│  2026-05-23 14:25  R. Verma confirmed: Request Rework (round 2 of 3)        │
│  2026-05-23 14:25  Decision signed (hash 0xa3...e1)                          │
│  2026-05-23 14:25  Contributor c4821 notified                                │
│  2026-05-23 14:25  Reputation engine: contributor delta -2, reviewer +1     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Evidence Verification

Every artifact and every evidence item carries integrity metadata:

```
artifact.zip · 2.4 MB · uploaded 2026-05-22 18:04
  SHA-256: 7a9c…b2d1  ✓ matches contributor's submission record
  Virus scan: clean
  Plagiarism check: 94% original (3 functions overlap — see report)
  [ Download (signed URL, expires 60m) ]   [ Preview inline ]   [ View hash report ]
```

Reviewer sees integrity at a glance; deeper inspection is one click away.

### 7.3 Traceability

The right-rail "Provenance" tab on every decision:

```
This submission is connected to:
  ├─ Task #t-2418 (in Project Acme-Helios)
  │    ├─ SOW #sow-882 (Business + Commercial + Legal + Security + Final all signed)
  │    └─ Decomposition plan #plan-441 (approved 2026-04-12)
  ├─ Prior versions: v1 (2026-05-12), v2 (this)
  ├─ Reviewer assignments: v1 → R. Verma (accepted-with-rework), v2 → R. Verma (continuity)
  ├─ Mentorship sessions linked: 1 (2026-05-14, skill: A11y)
  └─ Escalations: none
```

This is the *clickable shadow* of the evidence pack — every relationship navigable from the decision surface.

### 7.4 Approval Confidence (the reviewer's *own* confidence)

Counter-intuitive but necessary: the reviewer also declares *their* confidence at decision time:

```
Your confidence in this decision:   ● High   ○ Medium   ○ Low
   Why does this matter?   At low/medium, the deliverable downstream shows
   "reviewer flagged uncertainty" so the enterprise final-accepter sees it.
```

Three benefits:
- Surfaces uncertainty *before* it becomes a dispute.
- Trains reviewer self-awareness.
- Lets enterprise final-acceptance triage by reviewer confidence.

### 7.5 Fraud Detection Indicators

Surfaced inline, never as a separate "fraud page":

| Flag | Where surfaced | What reviewer does |
|---|---|---|
| **Plagiarism match** | Artifact viewer + queue row badge | Open report; decide if fair-use or violation |
| **Submission timing anomaly** | Contributor context panel | E.g., "v2 submitted within 4 minutes of v1 rework feedback" — likely AI-only response, may need re-review |
| **Reviewer-contributor pairing anomaly** | Banner on detail page if reviewer has accepted ≥ 6 of this contributor's last 7 | "Anti-rubber-stamp check: consider releasing this item" |
| **Reviewer cadence anomaly** | Reviewer's own dashboard | E.g., "Your average decision time on this skill is 4× faster than peers" — self-check prompt |
| **Evidence file hash mismatch** | Artifact viewer | Block decision until resolved |

### 7.6 Escalation Clarity

Escalations carry three first-class fields the current product hides:

1. **Root-cause taxonomy** (forced choice at composition; powers analytics).
2. **Resolution SLA** (per-tier, enforced).
3. **Frozen snapshot** of the review item at escalation moment (so the escalation conversation isn't on a moving target).

And every escalation has a public-to-stakeholders timeline:

```
2026-05-23 14:25  R. Verma raised escalation (type: quality_dispute, root: ambiguous_spec)
2026-05-23 14:48  Routed to L. Mehta (reviewer pool lead)
2026-05-23 15:02  L. Mehta acknowledged, set resolution by 2026-05-24 15:02
2026-05-23 16:11  L. Mehta requested spec clarification from enterprise
[awaiting enterprise — 18h of 24h SLA used]
```

---

## 8. State System Design

The redesign is unworkable without an explicit, complete state machine. Below is the canonical state model.

### 8.1 Workflow States — Submission

| State | Entry | Exit | Visible to |
|---|---|---|---|
| `submitted` | contributor submits | passes integrity → `queued`; fails → `rejected_intake` | contributor, system |
| `rejected_intake` | integrity fail (virus, dup, evidence incomplete) | contributor fixes → `submitted` | contributor |
| `queued` | passes intake + AI pre-rubric done | reviewer claims → `claimed` | contributor, reviewer |
| `claimed` | reviewer claims (presence lock) | reviewer drafts → `in_review`; lock timeout → `queued` | reviewer (lock holder), system |
| `in_review` | reviewer opens rubric | confirm dialog → `decision_pending`; release → `queued` | reviewer, audit |
| `decision_pending` | reviewer hits Accept/Rework/Reject | confirm → branch state; cancel → `in_review` | reviewer |
| `accepted` | reviewer confirms Accept | enterprise final-acceptance pipeline | all |
| `rework_open` | reviewer confirms Rework | contributor resubmits → `submitted` (v++); SLA breach → `escalated_rework` | all |
| `rejected` | reviewer confirms Reject (recoverable) | reassign → `queued` (new reviewer); dispute → `disputed` | all |
| `disputed` | contributor or reviewer disputes reject | mentor/admin resolves → `accepted` | `rework_open` | `rejected_final` | all + mentor |
| `rejected_final` | dispute resolution upholds reject | terminal | all |
| `escalated_rework` | round ≥ 3 OR SLA breach on rework | mentor/admin resolves → returns to flow | mentor, admin |

### 8.2 Workflow States — Reviewer Item View

| State | What it means for the UI |
|---|---|
| `pending` | In queue; not yet claimed |
| `claimed_by_me` | I hold the lock |
| `claimed_by_other` | Locked by another reviewer; shows who + how long left |
| `decision_drafted` | I've drafted rubric/feedback, not confirmed; autosave persists |
| `decision_confirming` | Confirmation modal open; nav-away preserves draft |
| `decision_submitted` | Locked, audit-written, awaiting downstream events |
| `under_dispute` | A confirmed decision is now disputed by contributor; reviewer can comment but not edit |

### 8.3 Edge Cases (must be handled, not glossed over)

| Edge case | Behavior |
|---|---|
| Reviewer closes tab mid-rubric | Draft autosaved every 10s; restore on reopen |
| Reviewer is offline; SLA breaches | Auto-release after timeout; reassign |
| Two reviewers race to claim | First-write-wins at API; second sees "claimed by X 12s ago" |
| Contributor resubmits during review | Reviewer sees "contributor submitted v3 — refresh to load?" banner; current rubric preserved as draft on v2 |
| AI suggestion arrives after reviewer opens | Banner: "AI rubric proposal ready" — does not overwrite reviewer's drafted ratings; reviewer chooses to merge |
| Rubric incomplete at submission | Confirm modal blocks decision; lists missing criteria |
| Reject without reason category | Confirm modal blocks; reason taxonomy required |
| Escalation while item in `in_review` | Reviewer's session pauses; presence lock released; item moves to mentor with frozen snapshot |
| Reviewer reaches concurrent cap | New claims blocked; banner "release one to claim more" |
| AI low confidence + reviewer one-clicks accept | Soft block — extra confirm step "AI flagged this; confirm full review" |

### 8.4 Partial Approval States

For deliverables composed of multiple submissions:

| State | Meaning |
|---|---|
| `bundle_partial` | Some submissions accepted, others in rework/reject |
| `bundle_blocked_by_reject` | One submission terminally rejected; bundle cannot ship |
| `bundle_ready_for_enterprise` | All submissions reviewer-accepted; awaiting enterprise final acceptance |
| `bundle_partial_enterprise_overflow` | Enterprise accepts subset; remainder routed back to rework |

### 8.5 Blocked States

| State | Why blocked | Resolution path |
|---|---|---|
| `blocked_by_integrity` | File hash mismatch / virus | Contributor resubmits |
| `blocked_by_evidence` | Required evidence checklist incomplete | Contributor completes |
| `blocked_by_dispute` | Active dispute on contributor → reviewer pairing | Mentor reassigns |
| `blocked_by_capacity` | Reviewer pool at ceiling, no qualified reviewer available | Mentor expands pool or admin overrides |
| `blocked_by_dependency` | Submission depends on prior milestone not yet accepted | Enterprise acts upstream |
| `blocked_by_legal_hold` | Compliance officer halted | Compliance resolves |

### 8.6 Escalated States

Cross-cutting state, parallel-track:

```
parent_item: in_review | rework_open | rejected
   │
   └─ escalation_id: opened → acknowledged → in_resolution → resolved | dismissed | escalated_further
```

Visible on parent and on escalation queue; parent waits or proceeds depending on escalation type (SLA breach pauses; quality dispute may proceed; spec ambiguity always pauses).

### 8.7 SLA Breach States

Already detailed in § 3.6; canonically captured here:

| State | Trigger | Side effects |
|---|---|---|
| `sla_healthy` | > 50% remaining | nothing |
| `sla_watch` | 25–50% | ranking bump |
| `sla_warning` | 10–25% | ranking top + reviewer notification |
| `sla_critical` | < 10% / < 4h | push + mentor notification |
| `sla_breached` | t < 0 | auto-escalate, reassign, audit, enterprise notification |
| `sla_breached_recovered` | breach resolved by decision | item closes, breach event remains in audit |

### 8.8 Rollback Scenarios

A confirmed decision is *immutable*. Rollback is achieved by *forward operation*:

| Scenario | Forward operation |
|---|---|
| Reviewer realized they Accepted by mistake | Reviewer raises self-initiated dispute → mentor reviews → decision overridden via new audit event chain |
| AI suggestion later proved wrong | Audit-only: AI override delta is recomputed; no decision change |
| Contributor disputes accept (wants more pay) | Routes to enterprise dispute board, not reviewer rollback |
| Plagiarism discovered post-accept | Mentor/admin opens "Revoke acceptance" workflow; payment claw-back if not yet released; audit chain extended |
| Wrong contributor credited | Admin opens "Reassign credit" workflow; reputation deltas reversed; audit chain extended |

No state ever goes "back" — only "forward, with reversal recorded."

---

## 9. Enterprise UX Improvements

### 9.1 Reducing Cognitive Load

| Lever | How |
|---|---|
| **Single Review Hub** | One IA across mentor + reviewer instead of two surfaces |
| **AI pre-fill + quick-confirm** | High-confidence items shortcut to 90-second decisions |
| **Criterion-anchored feedback templates** | Eliminate blank-page friction; templates per skill family |
| **Inline evidence** | No tab-switching to inspect artifacts |
| **Composite priority with "why first?"** | Reviewer stops guessing what to do next |
| **Defaults that match the segment** | A "rework" defaults round counter, deadline, severity to the most common pattern |

### 9.2 Improving Operational Clarity

| Lever | How |
|---|---|
| **Progressive SLA states** | Five distinct visual treatments instead of one timer |
| **Presence locks** | Eliminate reviewer collisions |
| **Bottleneck dashboard** | Leading-indicator surfacing |
| **Decision audit inline** | No "where did this come from?" |
| **Escalation root-cause taxonomy** | Analytics that name the actual problem |
| **AI partnership metrics** | Reviewer learns where AI helps and where it doesn't |

### 9.3 Reducing Review Fatigue

| Lever | How |
|---|---|
| **Keyboard shortcuts** | `/` focus, `J/K` nav, `Enter` open, `A/R/X` accept/rework/reject, `Cmd+Enter` confirm |
| **Quick-confirm lane** | Earn speed on the easy ones, spend time on the hard ones |
| **Batched calibration mode** | Group same-skill items, decide in flight while context is hot |
| **Snooze with reason** | Defer items legitimately (waiting on contributor reply) without losing them |
| **Pomodoro-style throughput pacing** | Show pace, don't shame; suggest break at high-volume thresholds |
| **Smart routing avoiding fatigue patterns** | Don't queue 8 React reviews in a row; vary if possible |

### 9.4 Simplifying Decision-Making

| Lever | How |
|---|---|
| **Visual asymmetry between Accept / Rework / Reject** | Different colors, sizes, icons; Reject behind a secondary action |
| **Forced reason taxonomy** | No vague "reject because" — categorized for analytics + clarity |
| **Required "what worked"** | Forces a balanced decision, reduces unfair-feeling rejections |
| **Reviewer confidence declaration** | Channels uncertainty into a structured signal |
| **Auto-suggested decision based on rubric average** | UI nudges "average score is 2.1 — typical for rework"; reviewer confirms or overrides |

### 9.5 Improving Scalability

| Lever | How |
|---|---|
| **Routing avoids same-reviewer continuity unless flagged** | Anti-rubber-stamp; widens pool utilization |
| **Calibration mode for new reviewers** | Shadow-rate against established reviewers; safe ramp |
| **AI confidence tiers gate quick-confirm** | High-confidence items consume less reviewer time → throughput scales |
| **Reviewer pool dashboards (mentor mode)** | Mentors can rebalance proactively |
| **Auto-escalate at round ≥ 3** | Bounds rework loops |
| **Reviewer concurrency cap** | Prevents queue hoarding; spreads load |
| **Pre-routing AI risk scoring** | Bad submissions never burn human cycles |

---

## 10. Product Design Rationale

### 10.1 Why These Redesigns Matter

The mentor review surface is the *one* place in the platform where four irreversible currencies are exchanged at once: **contributor livelihood (payment), enterprise commitment (acceptance), AI legitimacy (suggestion → decision), and platform trust (audit, fairness, governance)**. A failure here is not a UX nit — it is a structural failure of the product's premise.

Today the surface is *decorative* (`ENTERPRISE_UX_AUDIT.md § 4.3`): a beautiful queue, a thoughtful rubric, an opinionated decision modal — none of which persists. The redesign converts the decorative into the *load-bearing*.

### 10.2 Business Impact

| Outcome | Mechanism |
|---|---|
| **Higher reviewer throughput** | AI quick-confirm lane, keyboard nav, anchored templates → 30–50% review-time reduction on high-confidence items |
| **Lower review-cycle cost** | Throughput ceiling moves up; the same reviewer pool serves more enterprises |
| **Faster payouts → contributor retention** | Acceptance → payment timing visible and predictable; retention compounds the contributor pool growth |
| **Defensible decisions → enterprise willingness-to-buy** | Evidence pack readiness is a procurement requirement at enterprise scale; today it doesn't compose |
| **AI ROI** | Currently AI suggestions are invisible → effectively zero ROI. Explainable surface makes the AI feature *real* and measurable |

### 10.3 Governance Impact

| Outcome | Mechanism |
|---|---|
| **Audit completeness** | Every decision persists with full payload (rubric, feedback, AI delta, signature) |
| **Human-in-the-loop verifiable** | AI suggestion + human override delta is captured; SOW gate enforced |
| **Fraud surface narrows** | Reviewer pattern detection, anti-rubber-stamp routing, plagiarism checks inline |
| **Regulator readiness** | Evidence pack assembles from primary records, not from approximations |
| **Escalation accountability** | Root cause + SLA-bound resolution + frozen snapshot make escalations analyzable |

### 10.4 Operational Efficiency Impact

| Outcome | Mechanism |
|---|---|
| **SLA hit rate up** | Progressive SLA states + auto-escalation + bottleneck visibility |
| **Reduced reviewer collisions** | Presence locks |
| **Lower rework spirals** | Criterion-anchored feedback, severity tagging, auto-escalate at round 3 |
| **Mentor leverage** | Mentor sees pool health and can rebalance proactively |
| **Onboarding new reviewers** | Calibration mode + AI scaffolding reduce ramp time |

### 10.5 User Trust Impact

| Outcome | Mechanism |
|---|---|
| **Contributor trust** | Persistent, criterion-anchored, balanced feedback; growth signals on rejected work; visible reviewer identity |
| **Reviewer trust** | Their own AI partnership metrics; defensible decisions; rework genealogy |
| **Enterprise trust** | Reviewer confidence declarations; evidence pack readiness; risk surfaces upstream |
| **AI trust** | Explainability primitives (source, confidence, override, coverage gap); calibration ledger |
| **Platform trust** | Audit visibility at every entity; signed decisions; tamper-evident chain |

---

## 11. Interview Storytelling

### 11.1 How to Present This Redesign in Interviews

**Open with the leverage question** — *"Where in this product does a UI failure cost real money?"* — and place the mentor review surface as the answer. This frames the redesign as **business-critical product design**, not UI polish.

**The narrative arc:**

1. **Observation.** "The most visually finished surface in this product is its most operationally broken. Every decision is a toast; the AI assistant is invisible; the audit doesn't compose. This is the surface that gates contributor payment, enterprise acceptance, and AI legitimacy. So I redesigned it."
2. **Diagnosis.** Show the gap inventory — toast-only decisions, no presence lock, no SLA progressive states, no AI explainability, no rework genealogy, two overlapping surfaces. Each linked to a downstream consequence in business, governance, or operations.
3. **Mental model reframe.** "Reviewers are throughput-limited, AI-doubting, livelihood-aware actors. The UI's job is to *make the right decision the fast decision*. Everything below flows from that line."
4. **Design moves.** Walk through the converged Review Hub, the AI explainability primitives (sourced/confidence/coverage-gap/override), progressive SLA states, criterion-anchored rework, presence locks, evidence-access hierarchy. Each move tied back to a problem.
5. **State system.** Show the canonical state machine. Talk about edge cases (tab-close mid-rubric, race-to-claim, escalation while in review). *This is where systems-thinking earns its applause.*
6. **Governance overlay.** "Every decision is signed. Every AI delta is captured. Every escalation has a root cause and an SLA. This is what the Master SOW's human-in-the-loop requirement actually looks like as UI."
7. **Outcome framing.** Higher throughput, lower cycle cost, defensible decisions, AI ROI, regulator readiness, contributor retention. Tie each to a business metric.
8. **What I'd do next.** Honest limits: calibration analytics, reviewer reputation feedback loop, cross-enterprise reviewer pool optimization. Future work that compounds.

### 11.2 What Product Design Skills It Demonstrates

| Skill | How this work demonstrates it |
|---|---|
| **First-principles thinking** | Reframing the surface as the leverage point, not a feature page |
| **State-machine literacy** | A complete, audit-aware state model with edge cases |
| **AI/HCI fluency** | Explainability primitives, confidence-tiered friction, AI partnership ledger |
| **Governance-aware UX** | Audit inline, signed decisions, reviewer confidence declarations, fraud surfaces |
| **Operational empathy** | Reviewer fatigue, keyboard shortcuts, presence locks, calibration mode |
| **Information architecture** | Converged IA across two roles, grouping modes, evidence-access hierarchy |
| **Systems thinking** | Submission → review → acceptance → payment → credential — one chain, designed end-to-end |
| **Business judgment** | Throughput ceiling argument; AI ROI; procurement-readiness |
| **Trust design** | Visible reviewer identity, "what worked" requirement, criterion-anchored feedback, contributor morale signals |
| **Risk awareness** | Anti-rubber-stamp routing, plagiarism inline, anomaly flags, escalation SLAs |

### 11.3 How It Shows Systems Thinking

Show the chain explicitly:

```
Contributor submits
   → Integrity + AI pre-rubric
   → Routed (skill, recency, anomaly)
   → Reviewer queue (priority composite, SLA tiered)
   → Reviewer decision (AI-assisted, confidence-gated, signed)
   → Bundle rollup (partial states)
   → Enterprise final accept (reviewer confidence visible, evidence pack composes)
   → Payment release (cap held until human signature chain complete)
   → Credential issued (audit chain closes)
```

Then point at the cross-cuts:
- **SLA** runs through every node with a state machine of its own.
- **Audit** writes at every transition and never overwrites.
- **AI** intervenes at three nodes (intake, rubric, risk), each with explainability.
- **Escalation** is a parallel track that can attach at four nodes.

This is the answer to *"can you design a workflow that doesn't fall apart at scale?"* The systems thinking lives in the cross-cuts, not the boxes.

### 11.4 How It Shows Enterprise UX Thinking

Three signals an interviewer will look for:

1. **You designed for the enterprise admin without designing on the enterprise admin's surface.** The reviewer-side improvements (confidence declarations, evidence pack readiness, rework genealogy, reviewer pattern detection) are the *root causes* of what the enterprise admin will see downstream. Enterprise UX often masquerades as B2C polish — *real* enterprise UX is upstream plumbing.
2. **You took governance as a design constraint, not as compliance overhead.** Audit inline. Signed decisions. Coverage-gap declarations. Root-cause taxonomy. These are governance affordances that *also make the product better to use* — the hallmark of mature enterprise design.
3. **You designed for the throughput ceiling.** Enterprise SaaS lives or dies by the leverage of its bottleneck role. You identified the bottleneck (reviewer pool), designed the AI partnership to lift the ceiling, and made the ceiling visible to operators (mentor) and analysts (admin) so it can be managed.

**Closing line for the interview:**

> *"The mentor review surface is the platform's single point of irreversibility — payment, credential, acceptance, trust. I redesigned it to make irreversibility feel safe: explainable AI, signed decisions, criterion-anchored feedback, progressive SLA states, and one converged Review Hub instead of two parallel surfaces. The win isn't a prettier queue; it's a throughput ceiling that moves up while the governance floor moves down."*

---

## Appendix A — Mapping the Redesign to Source Documents

| Redesign decision | Anchor |
|---|---|
| Converge `/mentor/*` + `/enterprise/reviewer/*` into Review Hub | `ENTERPRISE_UX_AUDIT.md § 9` P1 #1 |
| AI explainability primitives (sourced, confidence, override, coverage gap) | `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 6.5`; `ENTERPRISE_UX_AUDIT.md § 7.3, § 7.4` |
| Presence lock + draft autosave | `ENTERPRISE_UX_AUDIT.md § 2.6, § 4.3` |
| Progressive SLA states + alert-before-breach | `ENTERPRISE_UX_AUDIT.md § 8.5`; `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 3.4, § 5.1` |
| Criterion-anchored rework composer | `PRODUCT_UNDERSTANDING.md § 12`; `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 5.3` |
| Auto-escalate at rework round ≥ 3 | `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 3.4` |
| Escalation root-cause taxonomy + resolution SLA | `ENTERPRISE_UX_AUDIT.md § 8.7`; `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 3.6` |
| Decision signatures + audit inline | `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 7.2`; `ENTERPRISE_UX_AUDIT.md § 6.1` |
| Evidence pack composition | `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 7.6` |
| Reviewer pattern detection (anti-rubber-stamp, anomaly) | `ENTERPRISE_UX_AUDIT.md § 6.4` |
| Human-in-the-loop on acceptance | Master SOW via `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 6.3–6.4` |
| Reviewer confidence declaration | New, derived from `§ 6.5` + `§ 7.6` (downstream audit utility) |
| Quick-confirm lane gated by confidence | `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md § 6.2` (Human-in-the-loop tier; AI proposes, human confirms) |
| Bottleneck dashboard / leading indicators | `ENTERPRISE_UX_AUDIT.md § 8.1, § 8.3, § 8.5` |
| Contributor morale signals on rework | `PRODUCT_UNDERSTANDING.md § 12` (growth-signal principle) |

---

*End of document — `MENTOR_REVIEW_REDESIGN_STRATEGY.md`.*
