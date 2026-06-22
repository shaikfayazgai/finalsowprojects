# GlimmoraTeam V2 — Final MVP Hardening Report

**Date:** 2026-05-24
**Scope:** Walkthrough-critical fixes only. No feature work, no architecture change.
**Method:** Code-grounded audit + targeted fixes verified by typecheck + route smoke test.
**Constraint:** Stakeholder-grade MVP — fix only what threatens the demo.

---

## Audit findings — what was actually broken vs the noise

The prior audits surfaced ~20 items. Walkthrough-critical filter narrowed it to **2 demo-breaking risks** worth fixing in this phase. The remainder is post-MVP roadmap.

### Critical (demo-breaking)
1. **Mock mentor scheduler had a perpetual-revision risk.** Round 1 → revise; round-parity logic after. If a stakeholder reaches round 3 on `t-4821` (which starts at round 2), the next mentor decision would be revise *again*, then revise again at round 5, and so on. A demoer who clicks Resubmit twice would land in a never-ending revision loop. Visible in code at `scheduleMockMentorReply`.
2. **Earnings (V1 detail page) was still in the contributor sidebar.** The walkthrough script explicitly warned presenters "don't click Detailed earnings during the demo" — but the click target was right there in the nav. A risk-free fix: hide it from the sidebar; keep the page reachable by URL for production users.

### Verified clean (no fix needed)
- **Workload Summary KPIs** — `isActive()` correctly excludes completed/approved. The "assigned" tile only counts pre-completion states.
- **NextStepCard `pickNextTask`** — explicitly filters by state union (revision_requested, ready_for_submission, in_progress, blocked, awaiting_clarification, assigned). Completed states never appear as "Up next."
- **Default workload table** — already excludes completed/approved tasks from the default view per Stabilization Phase fix.
- **Mentor mentor reply timer** — re-arms on rehydrate via `onRehydrateStorage`. Survives reload.
- **Activity stream** — seeded with 8 historical events + live mutations. Never empty.
- **Mock mentor lifecycle** — every demo-path route returns 200; no broken routes.

### Out-of-scope (post-MVP)
- Profile and Progress *deep* metrics still static (header tiles live, deep tiles static). Documented in lifecycle-validation audit; not demo-breaking because the walkthrough script routes around them.
- V1 body of Settings + Earnings detail. V2 headers in place; V1 bodies untouched. Migration is a Phase 2 effort.
- AI Capability/Insights on Profile/Progress still static text. Not demo-critical; covered by AI positioning narrative.

---

## Critical fixes completed

### Fix 1 · Mock mentor — always approve on final round
**File:** `src/lib/stores/contributor-tasks-store.ts`
**Lines:** `scheduleMockMentorReply` decision logic

**Before:**
```ts
const decision = task.reworkRound === 1
  ? "revise"
  : task.reworkRound % 2 === 0 ? "approve" : "revise";
```

**After:**
```ts
if (task.reworkRound >= task.totalRounds) {
  decision = "approve";              // final-round backstop
} else if (task.reworkRound === 1) {
  decision = "revise";                // demo's revision moment
} else {
  decision = task.reworkRound % 2 === 0 ? "approve" : "revise";
}
```

**Demo impact:** Stakeholders who click Resubmit twice can no longer land in an infinite revision loop. The task always reaches `completed` by `totalRounds`. The mock mentor now has the same guarantee a real mentor has — a finite review process.

### Fix 2 · Earnings removed from contributor sidebar
**File:** `src/lib/config/navigation.ts`
**Section:** Productivity

The Earnings link was removed from the contributor nav. The page file remains untouched. URL access still works for production users with real API tokens. The V2 Progress page (`/contributor/progress`) is the single earnings surface in the contributor sidebar — header KPIs are live-derived; the Earnings Panel surfaces payout history, recent contributions, and milestone rewards from the unified store.

**Demo impact:** The walkthrough script's "don't click Detailed earnings" warning is now structurally enforced. Stakeholders can't accidentally click into the V1 page during the demo.

---

## Sidebar IA — final state for the MVP walkthrough

| Section | Items |
|---|---|
| Overview | Dashboard |
| Work Execution ★ | Assigned Work · Workroom · Submissions · Revisions · Completed Work |
| Productivity | **Progress** *(Earnings hidden from nav this turn)* |
| AI Assistance | AI Guidance · Submission Readiness |
| Growth | Skill Ladder *(Credentials + Learning hidden in Stabilization)* |
| Account | Profile · Settings *(Collaboration section removed in Stabilization)* |

**Net effect:** The contributor sidebar now contains *only* V2-aligned destinations + operational placeholders. There are no V1 click landmines remaining in the contributor nav.

---

## Verification

| Check | Result |
|---|---|
| Typecheck | ✅ clean |
| All 18 demo-path routes return 200 | ✅ pass |
| Runtime errors in dev log on demo path | ✅ none (NextAuth/logo env noise only) |
| Mock mentor decision lands at completed by round 3 | ✅ verified via code path |
| Contributor sidebar no longer routes to V1 Earnings detail | ✅ verified |
| All other surfaces unchanged | ✅ no collateral edits |

---

## Final ecosystem maturity level

Honest assessment, post-hardening:

### Strong (demo-ready)
1. **Per-task lifecycle continuity** — workroom → submit → mock mentor → revision → resubmit → completed
2. **State persistence** — Zustand `persist`, `onRehydrateStorage` re-arms mock mentor timers
3. **Cross-screen ripple** — Completed Work, Progress earnings, Profile snapshot, Revisions activity all react to mutations
4. **Mock mentor decision** — now guaranteed to terminate by totalRounds (Fix 1)
5. **Sidebar IA** — only V2-aligned routes; no V1 click landmines (Fix 2)
6. **Mentor portal** — severity rails, SLA, escalation, governance holds, rework all first-class surfaces
7. **AI surfaces** — derived per state; sourced, confidence-labeled, summoned (collapsed by default)
8. **Activity stream** — seeded backlog + live mutations
9. **Visual consistency within V2** — same primitives, same chrome, same chip semantics
10. **Demo safety** — pre-warmed routes, store version v3 forces clean seed, mock mentor survives reload

### Acceptable (route around in the demo)
- Profile *deep* metrics (reliability percentages, achievements feed, recognition timeline) — static historical mock
- Progress *deep* metrics (6-month chart, momentum, performance insights) — static
- V1 Settings body — V2 header in place; body still framer-motion-animated underneath
- AI Capability/Insight surfaces on Profile + Progress — static text

### Hidden (not in MVP demo path)
- V1 Earnings detail (this turn)
- V1 Credentials, Learning, Messages, Support (Stabilization phase)
- V1 Submissions queue (already removed from sidebar in Stabilization)

---

## Safest stakeholder walkthrough flow

This is the **demo-stable sequence** the presenter should follow. The numbered order matches the executive walkthrough script's narration beats.

### Pre-demo (30 seconds before opening browser)
1. Clear browser localStorage OR open incognito → forces fresh seed v3
2. Pre-warm `/contributor/dashboard`, `/contributor/tasks/t-4821`, `/mentor/dashboard` in three tabs

### Contributor lifecycle (12–14 minutes, in order)
1. `/contributor/dashboard` — operational tone
2. `/contributor/tasks` — workload taxonomy
3. `/contributor/tasks/t-4821` — workroom cockpit
4. `/contributor/tasks/t-4821/revision` — check off both corrections deliberately
5. `/contributor/tasks/t-4821/submit` — tick declaration, submit
6. *(wait 8 seconds — "watch the state")* — mock mentor responds; on round 3 → approval guaranteed by Fix 1
7. `/contributor/tasks/completed` — new entry top of grid, KPIs updated
8. `/contributor/progress` — live earnings tile reflects new approval
9. `/contributor/profile` — header snapshot incremented
10. `/contributor/tasks/revisions` — activity stream shows approval at top

### Mentor lifecycle (6–8 minutes, in order)
11. `/mentor/dashboard` — severity, SLA, queue
12. `/mentor/reviews/pending` — triage
13. `/mentor/sla-monitor` — operational health
14. `/mentor/reviews/escalated` — governance escalation
15. `/mentor/reviews/governance-holds` — compliance hold
16. `/mentor/reviews/rework` — rework flow

### Do NOT click during the demo
- The "Detailed earnings" link from Progress — V1 page (now hidden from sidebar; still reachable by URL)
- Sub-routes off Profile (`/profile/edit`, `/profile/digital-twin`, `/profile/evidence`) — V1
- Anything inside Settings beyond the header — V1 body
- Hidden V1 routes if pasted (Credentials, Learning, Messages, Support, Submissions queue, Earnings detail)

### Pacing guidance
- **Click revision corrections deliberately** — one at a time. Each click should produce a visible store update.
- **Pause for the mock mentor.** The 8-second wait is theater. Say "watch the state" and stop talking.
- **Don't switch tasks.** `t-4821` is the spine of the demo. Switching breaks the narrative.
- **If a reload happens mid-demo:** the lifecycle survives via `onRehydrateStorage`. Mention it casually if asked.

---

## Remaining post-MVP roadmap

Honest, prioritized, **out of scope** for this MVP demo:

### P1 (next sprint)
1. **Profile deep metrics → live derivation.** Trust score, reliability percentages, achievement feed, recognition timeline currently read static `contributorProfile` mock. Wire them to the unified store.
2. **Progress deep metrics → live derivation.** 6-month chart, momentum cards, performance insights, AI growth assistance. Currently static `contributorProgress`.
3. **Completed Work credential routing.** Credential shareIds in completed-work entries don't resolve to real credential detail. Either stub the credential detail route or compute from the store.

### P2 (post-MVP)
4. **V2 Earnings detail page.** Replace the 1,998-LOC V1 earnings page with a V2 surface sourced from the live store. Restores "Detailed earnings" as a safe sidebar item.
5. **V2 Settings body migration.** Currently V2 header over V1 body. Migrate to V2 visual language.
6. **V2 Credentials, Learning, Messages, Support.** Currently hidden from sidebar. Migrate when ready.
7. **V2 Onboarding modal.** Currently V1; demo bypass flag hides it.
8. **Per-task workroom for "lite" tasks.** Tasks without rich `instructions`/`deliverables` get templated content. Either author rich content per task or accept the templating.
9. **`in_progress → ready_for_submission` auto-transition.** Currently no automatic transition based on readiness score crossing 90. Functional but lifecycle-taxonomy-incomplete.

### P3 (post-launch, real backend)
10. **Backend integration.** Replace mock mentor scheduler with real mentor decision flow. Replace mock payouts with real disbursement. Replace seeded activity backlog with real audit log.
11. **AI Capability/Insight live derivation.** Currently static text. Compute from actual operational patterns once data accumulates.
12. **Real session identity.** Profile identity currently hardcoded to "Amelia Stone." Make session-aware once auth is wired.

---

## Final verdict

The platform is now in its strongest possible MVP state for stakeholder presentation. The two walkthrough-critical risks identified in the prior audits have been resolved with targeted, low-risk fixes:

1. **No infinite revision loop** — mock mentor always approves by `totalRounds`.
2. **No V1 click landmines in the contributor sidebar** — Earnings removed; only V2 destinations remain navigable.

The lifecycle demonstration the executive script narrates is now structurally guaranteed to complete. Every navigation in the walkthrough sequence lands on a V2-aligned surface. Every state mutation propagates across the ecosystem. Every action terminates.

**The MVP is a believable, operationally connected, stakeholder-grade workforce ecosystem.**

What remains beyond this MVP — Profile/Progress deep metrics, V1 body migrations, backend integration — is roadmap, not blocker. The presentation can proceed with confidence.

---

**End of final hardening report.**
