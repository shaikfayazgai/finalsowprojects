# Contributor Portal V2 — Lifecycle Validation Audit

**Date:** 2026-05-24
**Scope:** Post-Operational-Realism-Refactor validation of full contributor lifecycle
**Method:** Code path tracing, store mutator inspection, cross-surface data-source grep, runtime smoke tests
**Tone:** Honest. Code-grounded.

---

## Direct verdict

**The critical work path is now operationally real.** Click a task → workroom → submit → mock mentor turn → revision → resubmit → completed. State mutates, persists across navigation, ripples to every surface that reads from the unified store. This is a substantive improvement from the pre-refactor state.

**The growth/reputation layer is not.** Profile, Progress, Earnings, Completed Work KPIs, Revisions activity stream — all still read static mock data. Completing a task in the live store does not update the contributor's trust score, payout totals, achievement feed, or monthly rhythm chart. The "left half" of the portal (where execution happens) is alive; the "right half" (where the contributor's record lives) is still frozen.

**Realism score: 7.4 / 10.** A real ecosystem for the active workflow. A still-frozen ecosystem for the contributor's history and earnings. Believable for the demo flow that walks the critical path; falls apart if the stakeholder asks "does the profile reflect what I just did?"

---

## 1. Task Context Continuity

### What was verified

- **`taskId` persists across screens.** Workroom (`/tasks/[taskId]`), Submit (`/tasks/[taskId]/submit`), Revision (`/tasks/[taskId]/revision`) all read `params.taskId`, look up via `useContributorTasksStore`, and render the matching task. Verified in code.
- **Previously-phantom IDs now resolve.** `t-5209`, `t-6033`, `t-4188`, `t-4711`, `t-4622`, `t-3601` (formerly only in revision/completed mocks, missing from workspace) now appear as real tasks with full identity and lifecycle metadata. Smoke tested.
- **Truly unknown IDs land on `TaskNotFound`.** `/contributor/tasks/phantom-99` renders the empty-state component, not a crash. Smoke tested.
- **Mock universes merged.** `buildSeedTasks()` in the store combines `contributorTasks` + `sampleWorkroomTask` (rich overlay) + `revisionRows` + `completedWork` into one keyed Map. ~25 unique tasks span every lifecycle state.

### What's still partial

- **Per-task workroom for "lite" tasks uses templated content.** Tasks that lack rich `instructions/deliverables/milestones` (most tasks created from revision/completed seeds) get default templates from `task-adapters.ts` (`defaultInstructions`, `defaultDeliverables`, `defaultMilestones`). The identity, state, mentor, deadline, evidence, and feedback are real per-task, but the "how to do this" content is generic — every lite task tells you to "Read the brief carefully" as step 1.
- **`task.blockers` is always `undefined`** in the legacy projection (`use-contributor-tasks.ts` line 59). The `BlockerClarification` panel reads `task.blockers?.[0]?.reason` and won't render the blocker text even when state is `blocked`. The state chip shows correctly, but the supporting "why" is missing.

### Classification: **REALISTIC** for identity + lifecycle. **PARTIALLY REALISTIC** for content depth.

---

## 2. Workflow State Mutation

### What was verified

| Transition | Trigger | Auto-advance? | Code |
|---|---|---|---|
| `assigned` → `accepted` | Opening workroom | ✅ Yes (workroom `useEffect`) | `tasks/[taskId]/page.tsx` |
| `accepted` → `in_progress` | Save Draft | ✅ Yes (inside `saveDraft` mutator) | `contributor-tasks-store.ts` |
| `in_progress` → `ready_for_submission` | _(missing)_ | ❌ **No automatic transition** | — |
| `ready_for_submission` → `under_review` | Submit | ✅ Yes (`submitTask`) | store |
| `in_progress` → `under_review` | Submit (skips ready) | ✅ Works anyway | store |
| `under_review` → `revision_requested` | Mock mentor 8s timer | ✅ Yes (deterministic for round 1) | scheduler |
| `under_review` → `completed` | Mock mentor 8s timer | ✅ Yes (round 2+, alternating) | scheduler |
| `revision_requested` → `ready_for_submission` | All corrections checked | ✅ Yes (`toggleCorrectionResolved`) | store |
| `ready_for_submission` → `under_review` (round 2+) | Resubmit | ✅ Yes (`resubmitTask`) | store |

### Hard finding: **`in_progress → ready_for_submission` is not wired.**

A task can sit at `readinessScore: 95` in `in_progress` state. The Submission flow accepts any state and submits successfully, so functionally nothing breaks — but the lifecycle taxonomy is incomplete. The contributor doesn't see a state chip flip to "Ready to submit" until they actually open Submit.

### Hard finding: **Mock mentor scheduler does NOT survive reload.**

`PENDING_MENTOR_TIMERS` is a module-level `Map<string, setTimeout>` (line 418). It's:
- ✅ Held in memory across SPA navigation
- ❌ Erased on hard page reload
- ❌ No `onRehydrateStorage` callback re-arms timers for tasks already in `under_review`

If a contributor submits and reloads the browser within 8 seconds, the task is **stranded in `under_review` forever**. Same risk if a stakeholder demo opens the portal next morning with a localStorage state from yesterday.

### Hard finding: **Store version is 1 — no migration story.**

If a stakeholder has localStorage from before my latest `buildSeedTasks` changes, the persist middleware loads stale `tasksById` and silently keeps it. Bumping `version: 2` would force a fresh seed on next load. Right now it doesn't. There's also no UI "Reseed" button despite `reseed()` being exported from the store.

### Classification: **REALISTIC** for the critical path. **PARTIALLY REALISTIC** for state-machine completeness. **NEEDS REFACTOR** for reload-survival.

---

## 3. Cross-Screen Continuity

### Surfaces verified as reading from the live store

| Surface | Hook | Status |
|---|---|---|
| Dashboard · Active Work Queue | `useContributorTaskList()` | ✅ Live |
| Dashboard · Priority Work | `useContributorTaskList()` | ✅ Live |
| Dashboard · Revision Feedback card | `useContributorTaskList()` | ✅ Live |
| Dashboard · Workflow Continuity | `useContributorTaskList()` | ✅ Live |
| Dashboard · Header counts | `useContributorTaskList()` | ✅ Live |
| Assigned Work · Workload Summary KPIs | `useContributorTaskList()` | ✅ Live |
| Assigned Work · Workload Table | `useContributorTaskList()` | ✅ Live |
| Assigned Work · Priority Bar | `useContributorTaskList()` | ✅ Live |
| Assigned Work · Blocker Panel | `useContributorTaskList()` | ✅ Live (but blockers undefined — see §1) |
| Assigned Work · Readiness Panel | passed selected task | ✅ Live |
| Workroom dispatcher | `useContributorTaskList()` | ✅ Live |
| Per-task Workroom | `tasksById[taskId]` | ✅ Live |
| Submission Flow | `tasksById[taskId]` | ✅ Live |
| Per-task Revision | `tasksById[taskId]` | ✅ Live |
| Revisions Queue | `useRevisionRows()` | ✅ Live |
| Completed Work · Grid | `useCompletedWork()` | ✅ Live |
| `NextStepCard` (Profile, Progress, Completed, Revisions sidebars) | `useContributorTaskList()` | ✅ Live |

### Surfaces still reading STATIC mock data (continuity broken)

| Surface | Static source | What this means |
|---|---|---|
| **Completed Work · KPI Header** | `completedSummary()` from `contributor-completed-work.ts` | "Total accepted 12", "First-try accepts 4", "Lifetime earned $X" don't change when you complete a new task. |
| **Completed Work · Monthly rhythm chart** | `monthlyRhythm()` from same mock | Bars are frozen. |
| **Progress · Header** | `contributorProgress` | "This month earnings", "Quarter to date", "Lifetime" never move. |
| **Progress · Progress Panel chart** | `contributorProgress.months` | 6-month delivery/acceptance/earnings chart is static. |
| **Progress · Earnings Panel** | `contributorProgress.{earnings, payouts, recentContributions, milestoneRewards}` | Approving a task does not add it to recentContributions or update payouts. |
| **Progress · Momentum** | `contributorProgress.momentum` | "5-streak clean accepts" is frozen even if you complete 7 in the demo. |
| **Progress · Performance Insights** | `contributorProgress.insights` | "First-try acceptance +20 pts" never updates. |
| **Progress · AI Growth Assistance** | `contributorProgress.aiHints` | Static suggestions, no live derivation. |
| **Progress · Recognition Feed** | `contributorProgress.recognition` | Mentor acks frozen — won't reflect new approvals. |
| **Progress · Workload Analytics** | `contributorProgress.workload` | "3 active tasks · 78% capacity" doesn't update with live store. |
| **Profile · Header** | `contributorProfile.{identity, trust, streak, workload}` | "Amelia Stone · 86/100 trust · 5-streak" is hardcoded. |
| **Profile · Reliability Panel** | `contributorProfile.reliability` | All 5 metrics frozen. |
| **Profile · Skills** | `contributorProfile.skills` | No reflection of newly-accepted submissions. |
| **Profile · Contribution History** | `contributorProfile.history` | Frozen timeline. |
| **Profile · Achievements** | `contributorProfile.achievements` | Frozen badges. |
| **Profile · Performance Insights** | `contributorProfile.growthInsights` | Frozen. |
| **Profile · AI Capability Insights** | `contributorProfile.aiCapabilityInsights` | Static text. |
| **Profile · AI Contributor Insights** | `contributorProfile.aiInsights` | Static text. |
| **Revisions Workspace · Activity Stream** | `revisionActivityStream` mock | Doesn't show new submissions/corrections from the live store. The store actually emits activity events into `s.activity` — the component ignores them. |
| **Dashboard · AI Productivity Card** | `aiSuggestions` from workspace mock | Static cards. |

### Hard finding: **the "right half" of the portal is entirely static.**

The execution path (Assigned → Workroom → Submit → Revision → Resubmit → Completed) is now live in the store and every surface that *participates in execution* reads from the store. But the contributor's **reputation, history, and earnings surfaces are still frozen** in mock data. A stakeholder walking through "approve this task" and then jumping to Profile will see no change.

### Classification (cross-surface): **REALISTIC** for execution surfaces. **DISCONNECTED** for reputation/earnings surfaces.

---

## 4. AI Operational Realism

### What was derived

- **Workroom Context Panel · AI Suggestions** — now derived per task via `deriveTaskAiSuggestions()`. Looks at state, readiness, evidence gap, unresolved corrections, deadline urgency. Verified — workroom AI cards now show, e.g., "Start with 'Focus trap'" when corrections are open, or "Readiness is ≥ 90% — you can submit" when ready.
- **`aiCue` / `aiNextAction`** on task projections — derived from state via `deriveAiCue()` / `deriveAiNextAction()`. Used by dashboard cards and queue tables.
- **`nextAction`** label on tasks — derived via `deriveNextAction()`. The workload table's "Open" button caption now changes based on state.

### What is still static

- **Dashboard AI Productivity card** (`ai-productivity.tsx`) — reads static `aiSuggestions` from the workspace mock. Will not change when state changes.
- **Profile AI Contributor Insights** — static `contributorProfile.aiInsights`.
- **Profile AI Capability Insights** — static `contributorProfile.aiCapabilityInsights`.
- **Progress AI Growth Assistance** — static `contributorProgress.aiHints`.
- **Per-correction AI fix hints in revision flow** — keyed by `correctionId` against a static hint table. Hints exist only for the original date-picker corrections; new corrections generated by the mock mentor scheduler have no hints.
- **Revisions Workspace cross-AI helper** — `buildCrossInsights` computes from the live `revisionRows`, so it's reactive. Good.

### Classification: **REALISTIC** for workroom/revision in-flow AI. **PLACEHOLDER** for dashboard/profile/progress AI surfaces.

---

## 5. Contributor Operational Believability

### Does the portal now feel operationally real?

**For the execution path: yes.**
- Submitting a task triggers a real state change visible everywhere.
- The mock mentor reply (8s) creates a moment of "real" anticipation.
- Resubmitting increments the round counter visibly.
- Corrections checked in the revision flow ripple to the queue's progress bar instantly.
- Reload preserves the journey (Zustand persist).
- The `NextStepCard` always knows the contributor's actual next move.

**For the contributor's record: no.**
- Approving a task changes its state to `completed` and adds it to the Completed Work grid, but the **archive header KPIs don't update**.
- The Profile still says "Amelia Stone, Trusted band, 86/100, 5-streak" no matter what you do.
- The Progress page still says "$960 this month" no matter what you complete.
- The Recognition feed still shows the same May 18 mentor ack from the mock.

**The gap is structural, not visual.** Every surface looks consistent (V2 visual language). But half the surfaces read from a frozen snapshot, so the contributor's "record" doesn't reflect their "execution."

### Verdict: **operationally real for what you're doing right now; AI-generated-feeling for what you've done.**

---

## 6. Local Storage / Persistence Validation

### What was verified

- **Zustand `persist` middleware is active.** Key: `contributor-tasks-store-v1`. Storage: `localStorage` via `createJSONStorage`.
- **`partialize` is configured correctly** — persists `tasksById`, `activity`, `hydratedAt`. Mutators not persisted (correct — they're rebuilt from the create function).
- **State survives navigation across SPA routes.** Verified — submitting a task from the workroom keeps it in `under_review` when you navigate to the dashboard.
- **State survives hard reload of in-flow tasks** (assigned, accepted, in_progress, revision_requested, ready_for_submission, completed). Reloading the dashboard shows the task in its mutated state.

### What does NOT survive reload

- **`PENDING_MENTOR_TIMERS` (module-level Map).** Submitting and reloading within 8s leaves tasks stranded in `under_review` indefinitely. There is no `onRehydrateStorage` callback that scans for `state === "under_review"` and re-arms `setTimeout`.

### Other persistence concerns

- **`store.version: 1`** — if `buildSeedTasks()` changes (more tasks, different shapes) between dev iterations, persisted state from a prior session wins. The stakeholder may demo with stale data without knowing. There's no migration; bumping the version would force re-seed, but that loses any in-flight demo state.
- **No "Reset / Reseed" UI control** — the store exports `reseed()` but no surface calls it. To demonstrate a fresh contributor experience, you must manually clear localStorage in DevTools.
- **Activity log capped at 50 entries** — fine for demo, possibly thin for a long-lived contributor session.

### Classification: **REALISTIC** for in-flow persistence. **NEEDS REFACTOR** for reload survival of pending mentor decisions.

---

## 7. V1 ↔ V2 Cleanup Validation

This refactor did **not** touch V1 surfaces. The 7 V1 pages still present:

| Route | Status |
|---|---|
| `/contributor/tasks/submissions` | V1 — live API · framer-motion · different chip styles |
| `/contributor/earnings` | V1 — 1,998 LOC · live API · different visual rhythm |
| `/contributor/credentials` | V1 — live API |
| `/contributor/learning` | V1 — live API |
| `/contributor/messages` | V1 — live API |
| `/contributor/support` | V1 — live API |
| `/contributor/settings` | V1 — live API |

These pages do **not** read the new store. Submitting in V2 doesn't show up in the V1 Submissions queue. Completing a task in V2 doesn't appear in V1 Earnings. The V1 surfaces remain functional but parallel.

### Classification: **DISCONNECTED**.

---

## 8. Final Realism Score

| Dimension | Score / 10 | Justification |
|---|---|---|
| **Workflow realism** | 8.5 | Critical path is real. State mutates. Mock mentor responds. Per-task pages honor taskId. State machine has one missing automatic transition (`in_progress → ready_for_submission`). |
| **Lifecycle continuity** | 8.0 | Cross-surface continuity is strong on the execution side. Completely broken for reputation/earnings/profile surfaces (~10 frozen consumers). |
| **Operational persistence** | 7.0 | Zustand persist works for state. Mock mentor timers don't survive reload — material flaw. No store version migration. No reset UI. |
| **Contributor ecosystem maturity** | 7.0 | The store is real and elegant. The V1 ↔ V2 gulf and static profile/progress drag the score down. |
| **Enterprise believability** | 7.5 | Internal stakeholder demo is now solid for the execution path. Customer demo still falls apart at the Profile/Progress surfaces. |
| **Overall** | **7.4 / 10** | Material improvement from 6.2. Critical path believable. Reputation surfaces still placeholder behavior dressed in V2 chrome. |

---

## 9. Per-Surface Classification Matrix

| # | Surface | Classification | Rationale |
|---|---|---|---|
| 1 | Dashboard | **REALISTIC** | All cards read live except AI Productivity (placeholder). |
| 2 | Assigned Work · Queue | **REALISTIC** | Live store. Blocker reasons missing (adapter sets to undefined). |
| 3 | Workroom dispatcher | **REALISTIC** | Smart-resume reads live. |
| 4 | Per-task Workroom | **PARTIALLY REALISTIC** | Identity + state + evidence + draft real. Instructions/deliverables templated for lite tasks. |
| 5 | Submission Flow | **REALISTIC** | Honors taskId · mutates store · routes back to workroom in new state. |
| 6 | Per-task Revision | **REALISTIC** | Honors taskId · correction checkboxes mutate store · resubmit works. |
| 7 | Revisions Workspace | **REALISTIC** for queue + detail. **PLACEHOLDER** for activity stream (static). |
| 8 | Completed Work · grid | **REALISTIC** (live grid) |
| 9 | Completed Work · header KPIs + chart | **DISCONNECTED** (static mock) |
| 10 | Progress · header | **DISCONNECTED** |
| 11 | Progress · chart + milestones | **DISCONNECTED** |
| 12 | Progress · earnings panel | **DISCONNECTED** |
| 13 | Progress · momentum + insights + AI | **DISCONNECTED / PLACEHOLDER** |
| 14 | Progress · recognition feed | **DISCONNECTED** |
| 15 | Progress · workload analytics | **DISCONNECTED** |
| 16 | Profile · all sections | **DISCONNECTED** (entire surface static) |
| 17 | Submissions queue (V1) | **DISCONNECTED** (visual mismatch + parallel data) |
| 18 | Earnings detail (V1) | **DISCONNECTED** |
| 19 | Credentials / Learning / Messages / Support / Settings (V1) | **DISCONNECTED** |
| 20 | AI Guidance / Submission Readiness / Skill Ladder | **PLACEHOLDER** (operational chrome · static numbers) |
| 21 | Sidebar | **REALISTIC** for IA. **UI SHELL** for accent color (still brown). |

**Summary counts:**
- REALISTIC: **6**
- PARTIALLY REALISTIC: **1**
- PLACEHOLDER: **3**
- DISCONNECTED: **10**
- NEEDS REFACTOR: **0** (no surface is structurally broken — disconnections are wiring gaps)

---

## 10. Specific Defects Found

These are the concrete, code-grounded findings from this validation pass. Listed with file references so they're addressable:

### D-1 · Mock mentor scheduler is volatile
`src/lib/stores/contributor-tasks-store.ts:418` — `PENDING_MENTOR_TIMERS` is a module-level Map. Reload erases pending timers; tasks stranded in `under_review`. **Impact:** demo breaks if anyone reloads mid-flow.

### D-2 · Default workload table includes completed tasks
`src/app/contributor/tasks/v2-components/workload-table.tsx` — when no bucket/view filter is applied, `let out = allTasks;` includes completed and approved tasks alongside in-flight ones. A contributor sees "Completed Work" rows mixed in with their active queue. **Impact:** Assigned Work feels noisy after a few completions.

### D-3 · Blockers projection sets to `undefined`
`src/lib/contributor/use-contributor-tasks.ts:59` — `blockers: undefined`. The Blocker & Clarification panel renders the chip but never the blocker reason. **Impact:** the supportive "we'll let you know when this is ready" copy never appears.

### D-4 · No automatic `in_progress → ready_for_submission` transition
No mutator advances state when `readinessScore` crosses 90. The state machine is incomplete. **Impact:** a task at 95% readiness still shows "In progress" on the dashboard until the contributor opens Submit.

### D-5 · Completed Work header KPIs read static mock
`src/app/contributor/tasks/completed/v2-components/completed-header.tsx:13,16` — imports `completedSummary()` from the mock file, not the live store. **Impact:** completing a task in the demo doesn't update "Total accepted", "First-try accepts", "Lifetime earned".

### D-6 · Profile entirely static
`src/app/contributor/profile/v2-components/profile-header.tsx:19` and every other profile component — reads `contributorProfile` mock. **Impact:** the contributor's identity, trust score, reliability metrics, skill ladder, contribution history, and achievements never reflect their work.

### D-7 · Progress entirely static
Every Progress v2-component imports `contributorProgress` directly. **Impact:** earnings totals, payout history, milestone progression, momentum, recognition feed don't move when tasks complete.

### D-8 · Revisions activity stream uses static mock
`src/app/contributor/tasks/revisions/v2-components/revisions-activity-stream.tsx:19` — imports static `revisionActivityStream`. **Impact:** the store actually emits activity events (`s.activity`) but the stream component ignores them.

### D-9 · Dashboard AI Productivity card uses static suggestions
`src/app/contributor/dashboard/v2-components/ai-productivity.tsx:22` — static `aiSuggestions` from mock. **Impact:** the only AI surface on the dashboard does not reflect the contributor's actual workload.

### D-10 · Per-correction AI hints don't cover dynamically-created corrections
`mentorRespond` generates correction IDs like `fc-${id}-${round}-1` for revision-requested decisions. The static `correctionAiHints` table only has hints for the original date-picker corrections (`fc1`, `fc2`). **Impact:** corrections generated by the mock mentor have empty AI fix panels.

### D-11 · Store has no version migration
`store.version: 1` and no `migrate` function. Stale localStorage from previous dev iterations silently wins. **Impact:** demoers may see old data without knowing; no reset path.

### D-12 · No UI control to reseed the store
`reseed()` is exported but not called from any surface. **Impact:** restarting a clean demo requires manual `localStorage.clear()` in DevTools.

### D-13 · V1 ↔ V2 still parallel
7 V1 routes unchanged. Submitting in V2 doesn't appear in V1 `/contributor/tasks/submissions`. **Impact:** clicking from V2 progress → V1 earnings is still a context switch into a different era.

---

## 11. Does the contributor portal now behave like a believable enterprise workforce operational ecosystem?

**Partially. For the active workflow: yes. For the contributor's record: no.**

### What works believably

- A contributor can click a task they were assigned, see the workroom open on that specific task, save a draft (which moves them to in_progress), upload evidence, submit, watch the task move to under_review, see it become revision_requested after a few seconds, open the revision flow, check off corrections, watch the readiness score climb, resubmit, see it accepted, and find it in their completed archive.
- That entire flow respects the contributor's individual task identity, persists across reloads (mostly), and ripples to every surface that participates in execution.

### What does not work believably

- The contributor's **trust score**, **reliability metrics**, **skill ladder progression**, **achievement feed**, **monthly earnings**, **payout history**, **milestone progress**, **mentor acknowledgment timeline**, and **recognition events** are all fixed images. Doing the work doesn't update the record. The contributor's "operational reputation" is a static painting.
- The mock mentor scheduler — the closest thing to a real backend response — is fragile. A reload at the wrong second strands tasks.
- The V1 surfaces remain a separate universe.

### The honest summary

**This is no longer a frontend-only simulation.** Half of it is a real local-state operational ecosystem. The other half is a polished static report from a separate ecosystem. A stakeholder demo can walk the execution path convincingly. A stakeholder demo cannot answer "how does completing this affect my trajectory?" — because the trajectory views aren't connected.

To get to "believable enterprise workforce operational ecosystem," the next pass needs to:
1. Wire Profile/Progress/Earnings/Completed-Header/Revisions-Activity to derive from the live store.
2. Make the mock mentor scheduler survive reload (`onRehydrateStorage` callback that re-arms timers for under_review tasks).
3. Add a Reseed UI control + bump store version so demos start clean.
4. Either bring V1 surfaces into the store ecosystem or hide them from V2 navigation.

Without those four, the portal will continue to feel partially fake at the reputation layer — even though the execution layer is genuinely operational now.

---

**End of validation audit.**
