# Contributor Portal V2 — Legacy Cleanup & Ecosystem Consistency Audit

**Date:** 2026-05-24
**Scope:** Identify V1 legacy surfaces in `/contributor/*` and the contributor layout. Classify each. Produce a focused migration plan.
**Method:** Line counts + V1 fingerprint scan (framer-motion variants, live API calls, toast usage, V1 vs V2 primitives), code path inspection.
**Constraint:** No redesign. No new features. Cleanup planning only.

---

## Executive snapshot

The contributor portal has **10 V1 legacy surfaces** still in the ecosystem totaling **~9,200 lines** of pre-V2 code. They fall into three buckets:

1. **Duplicates** (2 surfaces, ~2,660 LOC) — parallel implementations that conflict with V2 surfaces already in place (Earnings ↔ Progress; Submissions queue ↔ Assigned Work + Revisions).
2. **Workflow-adjacent V1** (3 surfaces, ~1,930 LOC) — surfaces the V2 ecosystem links into but that visually break out of the V2 voice (Credentials, Messages, Learning).
3. **Boundary V1** (3 surfaces, ~3,220 LOC) — surfaces outside the core contributor lifecycle (Support, Settings, Onboarding) where visual mismatch hurts less.

Plus one layout-level concern: the **AI Chat Widget** (780 LOC) at `src/components/layout/ai-chat-widget.tsx` floats over every contributor page and is disconnected from the live task store.

Plus one **base-layer inconsistency**: the sidebar's active-state gradient is hardcoded brown (`#A67763` / `#8B5E4A`) — the enterprise/mentor accent, not the contributor's teal accent. This bleeds across every page.

---

## 1. V1 Legacy Surfaces — code-grounded inventory

Every surface here was verified via fingerprint scan:
- `motion:N` = number of `framer-motion` imports
- `api:N` = number of `fetch*` API calls or `useSession` hooks
- `toast:N` = `toast` notification usage
- `v1-anim:N` = `stagger` / `fadeUp` / `scaleIn` variant uses
- `v2-prims:N` = `ContributorCard` / `ContributorPageHeader` / `ContributorSectionHeader` uses
- LOC = line count

| Route | LOC | motion | api | toast | v1-anim | v2-prims | Verdict |
|---|---:|---:|---:|---:|---:|---:|---|
| `/contributor/earnings` | **1,998** | 1 | 18 | 3 | 8 | 0 | **REBUILD or REMOVE** |
| `/contributor/support` | **1,753** | 1 | 13 | 11 | 5 | 0 | KEEP (boundary) |
| `/contributor/settings` | **1,175** | 1 | 4 | 11 | 9 | 0 | KEEP (boundary) |
| `/contributor/messages` | 761 | 1 | 6 | 0 | 4 | 0 | REFINE |
| `/contributor/tasks/submissions` | 665 | 1 | 7 | 3 | 7 | 0 | **REBUILD or REMOVE** |
| `/contributor/credentials` | 628 | 1 | 8 | 2 | 7 | 0 | REFINE |
| `/contributor/learning` | 539 | 1 | 4 | 4 | 11 | 0 | REFINE |
| `/contributor/onboarding` (modal) | 296 | 1 | — | — | — | 0 | KEEP (boundary · demo bypassed) |
| `src/components/layout/ai-chat-widget.tsx` | 780 | 1 | many | — | — | 0 | **REMOVE from contributor layout** |
| `src/components/layout/sidebar.tsx` (accent color) | — | — | — | — | — | — | **REFINE** (one-color swap) |

**Crucial signal:** every V1 surface scores **`v2-prims: 0`** — none of them use the V2 primitive library that 9 V2 surfaces share. They are visually orthogonal by construction.

### Additional V1 sub-routes (not directly in sidebar nav)

| Route | Status |
|---|---|
| `/contributor/profile/edit` | V1 sub-route · still linked from Profile actions |
| `/contributor/profile/digital-twin` | V1 sub-route |
| `/contributor/profile/evidence` | V1 sub-route |
| `/contributor/credentials/[credentialId]` | V1 sub-route |

---

## 2. Per-page classification with reasoning

### A · `/contributor/earnings` — **REBUILD or REMOVE**
**Why:** This 1,998-LOC surface is a **direct duplicate** of the Earnings panel embedded in the V2 Progress page (`/contributor/progress`). The V2 Progress hero, Progress Panel chart, Earnings Panel (with three-view toggle), and Recognition Feed already cover monthly earnings, payout history, recent contributions, and milestone rewards. The V1 Earnings page is the "detailed" version of what V2 already presents.

**Conflict:** Clicking "Detailed earnings" from V2 Progress drops into a 1,998-line page with different visual rhythm, different table styles, different chip semantics. The two surfaces don't share data — V1 reads from a live API, V2 from a mock.

**Quickest cleanup:** Remove the "Earnings" item from the sidebar (the data already lives in Progress). Keep the V1 page reachable via direct URL for the duration of API integration. Most users will never click into it.

**Realistic rebuild scope:** if rebuild is chosen — a V2 Earnings detail page would be a ~600-LOC effort using existing primitives. Not in scope for cleanup phase.

---

### B · `/contributor/tasks/submissions` — **REBUILD or REMOVE**
**Why:** The 665-LOC V1 Submissions queue duplicates the V2 Assigned Work queue (`/contributor/tasks`) and the V2 Revisions Workspace (`/contributor/tasks/revisions`). The V2 lifecycle now tracks every state (under_review, revision_requested, ready_for_submission) in the unified store. The V1 queue tracks a parallel API-backed list.

**Conflict:** Submitting in V2 doesn't appear in V1. V1's "Resubmit" doesn't trigger V2's revision flow. Two parallel ecosystems for the same concept.

**Quickest cleanup:** Sidebar link "Submissions" → redirect to `/contributor/tasks` filtered by `under_review` + `ready_for_submission`. Or remove the sidebar item entirely; the V2 queue already exposes these via its filter chips.

---

### C · `/contributor/credentials` — **REFINE**
**Why:** 628-LOC V1 surface. Standalone capability (no V2 parallel exists). Completed Work cards link into this for credential detail. Functionally useful, structurally orthogonal to V2 voice.

**Conflict:** Visual mismatch. Framer-motion stagger/fadeUp animations, V1 chip styles, no V2 primitives.

**Refinement scope (light):** swap the page header for `ContributorPageHeader` (matches Profile, Progress, Revisions). Re-use existing body. The internal layout can stay V1 for now — only the chrome changes. ~30-LOC change.

---

### D · `/contributor/learning` — **REFINE**
**Why:** 539-LOC V1 surface. Standalone capability. Linked from Skill Ladder placeholder. No V2 parallel.

**Conflict:** 11 V1-anim uses (highest of any V1 page). Body is animation-heavy.

**Refinement scope (light):** same header swap as Credentials. Strip the stagger animations from the header section only. Body stays.

---

### E · `/contributor/messages` — **REFINE**
**Why:** 761-LOC V1 messaging surface. Workflow-adjacent — the revision flow's clarification thread is conceptually the same conversation. Mentor name appears in both.

**Conflict:** Visual mismatch and no live link to revision-flow clarification threads.

**Refinement scope (light):** header swap. Lower-priority — message-thread layouts are intrinsically chat-shaped and look fine standalone. Body untouched.

---

### F · `/contributor/support` — **KEEP**
**Why:** 1,753-LOC help-center surface. Boundary capability — not part of the contributor's daily workflow. Visual mismatch is real but the cost-benefit of refining a help center is poor.

**Conflict:** Visual rhythm differs from V2.

**Decision:** keep as-is. If time permits later, header swap matching the other refinements.

---

### G · `/contributor/settings` — **KEEP**
**Why:** 1,175-LOC account-management surface. Pure boundary — preferences, notifications, security. Not workflow.

**Conflict:** Visual mismatch.

**Decision:** keep as-is. Will eventually need a V2 settings shell, but not on the cleanup-phase critical path.

---

### H · `/contributor/onboarding` modal — **KEEP**
**Why:** 296-LOC SSO onboarding wizard. The `CONTRIBUTOR_DEMO_BYPASS` flag in `layout.tsx` already prevents it firing during demos. Triggered only for new SSO users in production.

**Decision:** out of cleanup scope. Will eventually need a V2 onboarding shell.

---

### I · `src/components/layout/ai-chat-widget.tsx` — **REMOVE from contributor layout**
**Why:** 780-LOC floating chat widget overlaid on every contributor page via `app-shell.tsx:46` (`{config.basePath === "/contributor" && <AIChatWidget />}`). Uses its own `/api/v1/support-chat` endpoint. Has zero connection to the live contributor task store. Conflicts with V2's philosophy of **summoned, embedded AI inside each workflow** (workroom AI, revision AI, dashboard AI, NextStepCard).

**Conflict:** Two AI paradigms coexisting — a floating generic chatbot AND the per-workflow summoned helpers. The floating widget weakens the "summoned, not pushed" principle every other V2 AI surface preserves.

**Decision:** remove the `<AIChatWidget />` mount from `app-shell.tsx` for the contributor portal. The component stays in the repo (still used by other portals if applicable). Net cleanup: ~1 line in the layout file, ~780 LOC effectively removed from the contributor experience.

---

### J · Sidebar accent color — **REFINE (highest-leverage fix in this audit)**
**Why:** `src/components/layout/sidebar.tsx` hardcodes the active-state background and primary-section dot to brown gradient `linear-gradient(135deg,#A67763,#8B5E4A)` and `text-brown-700`. The `contributorNav` config sets `accentColor: "teal"` but the sidebar ignores it.

**Conflict:** Every contributor page renders the sidebar with **mentor portal accent colors**. This is the most-visible base-layer inconsistency in the portal.

**Refinement scope:** read `config.accentColor` in the sidebar component, switch to teal gradient for contributor portal. ~10 LOC change. **5–10 minute fix with portal-wide impact.**

---

## 3. Biggest ecosystem inconsistencies (ranked)

1. **Sidebar accent color is brown across the entire contributor portal.** Base-layer visual conflict. Bleeds into every page. **Top priority.**
2. **Earnings duplicated.** V2 Progress shows earnings; V1 Earnings detail also exists in sidebar. Two paradigms for the same data.
3. **Submissions duplicated.** V2 Assigned Work + Revisions cover everything V1 Submissions queue tracks.
4. **AI Chat Widget conflicts with the "summoned AI" philosophy.** Floating chatbot undercuts the workroom/revision/dashboard inline AI.
5. **V1 surfaces use framer-motion stagger animations** absent from V2. The contributor experiences a different motion language depending on which page they're on.
6. **Page headers diverge.** V1 surfaces have bespoke headers; V2 uses `ContributorPageHeader`. The eyebrow + title + chip pattern is the most recognizable V2 signature and is missing from 7 pages.
7. **Chip and table styles differ.** V1 surfaces use older chip patterns and bespoke tables; V2 uses standardized chips and grids.
8. **No shared "save-state-to-store" path on V1 surfaces.** Actions there don't affect V2 surfaces and vice-versa.

---

## 4. Quickest path to ecosystem cohesion

Ordered by **impact-per-effort** (highest first):

### Step 1 · Sidebar accent fix (≈ 10 minutes, portal-wide effect)
Replace hardcoded brown gradients with `config.accentColor`-driven values, or hardcode teal in the contributor branch. Every contributor page improves immediately.

### Step 2 · Remove AI Chat Widget from contributor layout (≈ 5 minutes)
One-line guard change in `app-shell.tsx`. The contributor's AI experience becomes consistently "summoned per workflow" with no floating chatbot competing for attention.

### Step 3 · De-duplicate sidebar (≈ 30 minutes)
- Remove "Earnings" from the Productivity section of `contributorNav` (data already in Progress).
- Remove "Submissions" from the Work Execution section (data already in Assigned Work + Revisions).
- Both routes stay reachable by URL if anything links there; they're just no longer first-class nav.

After this step the sidebar matches the IA the cleanup-phase prompt described, minus the two duplicate items.

### Step 4 · Header swap on REFINE-classified surfaces (≈ 30 minutes per page)
Three surfaces — Credentials, Learning, Messages. For each, replace the bespoke V1 header with `ContributorPageHeader` carrying the right eyebrow + title + subtitle. Body untouched. ~30-LOC change per page. **Combined effect: the three surfaces gain V2 entry chrome without rewriting their internals.**

### Step 5 · Optional: ship Support + Settings header swap (≈ 30 min each)
Same trick. Low impact since these are boundary surfaces, but completes the visual continuity.

### Total effort for "ecosystem feels cohesive"
**≈ 2.5 hours of focused work.** No rewriting, no new features. All changes are header/wrapper/config-level. The V2 experience starts at the sidebar and continues into every visible page header.

### What this does NOT fix
- V1 page bodies still use framer-motion animations + different chip styles + V1 API integration. Refining the header is enough to make the *entry* feel V2; the *body* still feels V1.
- Earnings/Submissions data still doesn't reconcile with V2 store data (they're API-backed; V2 is mock-backed). Removing from sidebar avoids the user-visible conflict.

---

## 5. V2 Experience Principles — alignment per surface

For each contributor route, alignment against the six V2 principles:

| Surface | Productivity-oriented | Contributor-guided | Operationally connected | Confidence-building | AI-assisted | Workforce-focused |
|---|---|---|---|---|---|---|
| Dashboard (V2) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assigned Work (V2) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Workroom (V2) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit (V2) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Revision (V2) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Revisions Workspace (V2) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Completed Work (V2) | ✅ | ✅ | ⚠️ static KPIs | ✅ | ⚠️ none | ✅ |
| Progress (V2) | ✅ | ✅ | ❌ static data | ✅ | ⚠️ static | ✅ |
| Profile (V2) | ✅ | ✅ | ❌ static data | ⚠️ wrong identity | ⚠️ static | ✅ |
| AI Guidance / Readiness / Skill Ladder (operational placeholders) | ✅ | ✅ | ❌ static | ✅ | ⚠️ chrome only | ✅ |
| Submissions queue (V1) | ⚠️ | ⚠️ | ❌ parallel ecosystem | ⚠️ | ❌ none | ⚠️ |
| Earnings (V1) | ⚠️ | ⚠️ | ❌ parallel ecosystem | ⚠️ | ❌ none | ⚠️ |
| Credentials (V1) | ⚠️ | ⚠️ | — | ⚠️ | ❌ none | ⚠️ |
| Learning (V1) | ⚠️ | ⚠️ | — | ⚠️ | ❌ none | ⚠️ |
| Messages (V1) | ⚠️ | ⚠️ | — | ⚠️ | ❌ none | ⚠️ |
| Support (V1) | — | ⚠️ | — | ⚠️ | ❌ none | — |
| Settings (V1) | — | ⚠️ | — | ⚠️ | ❌ none | — |

**Read:** V2 surfaces score full ticks on workflow principles. V1 surfaces uniformly score lower — not because they're broken, but because they were written before the V2 principles existed.

---

## 6. Workflow Consistency Audit — specific findings

### Disconnected operational flows still in production
1. **V1 Submissions queue tracks submissions independently** of the V2 lifecycle store. Submitting via V2 doesn't appear in V1.
2. **V1 Earnings tracks payouts independently** of the V2 store. The V2 store currently doesn't track payouts at all — they're displayed via static `contributorProgress` mock.
3. **V1 Messages tracks conversations independently** of the V2 revision-flow clarification threads. A mentor's clarification appears in revision flow but doesn't appear in `/contributor/messages`.
4. **V1 Credentials issues credentials independently** of the V2 Completed Work credential metadata. The Completed Work card's "shareId" doesn't index a real credential in the V1 list.

### V1 interaction logic still present
- `toast` notifications (38 total uses across V1 pages) — toast-store is V1's success/error pattern. V2 doesn't toast; V2 mutates state and the affected surface re-renders. Different feedback paradigm.
- `framer-motion` stagger/fadeUp/scaleIn variants — every V1 page animates list children in sequence on mount. V2 pages don't.
- Modal/drawer patterns — V1 pages occasionally open modals (e.g., earnings drill-down dialogs). V2 does not open modals; routes or inline expansion only.

---

## 7. Legacy Component Detection

### V1 components still in active use (contributor scope)
- Every V1 page is its own monolith — none of them share components with V2 surfaces. None import from `src/app/contributor/_shared/primitives.tsx`.
- `src/components/layout/ai-chat-widget.tsx` — 780-LOC chat widget at layout level.
- `src/app/contributor/onboarding/components/*` — V1 onboarding wizard (Step1Identity, Step2Profile, etc.).

### V1 components technically present but unused in V2 flow
- `motion-variants.ts` (`stagger`, `fadeUp`, `scaleIn`) — exists in `src/lib/utils/`, imported by every V1 page, ignored by every V2 page. Safe to leave; not worth deleting until V1 pages are gone.

### Orphaned after refactor
- `ContributorPlaceholder` primitive (`src/app/contributor/_shared/contributor-placeholder.tsx`) — old "Coming soon" placeholder. No longer imported by any page after the operational-placeholder migration. **Safe to delete.**
- `contributor-placeholder` exports are unreferenced. Removing this file is a 1-step cleanup.

---

## 8. Recommended Migration Plan

### Phase A (60 minutes total — highest-leverage cohesion)
1. Sidebar accent color: brown → teal for contributor portal (10 min)
2. Remove AI Chat Widget mount from contributor layout (5 min)
3. Remove Earnings + Submissions from contributor sidebar nav (10 min)
4. Delete orphaned `contributor-placeholder.tsx` (5 min)
5. Header swap on `/contributor/credentials` to `ContributorPageHeader` (30 min)

**Output of Phase A:** The contributor portal feels visually unified at the sidebar level + entry header level. Two duplicate sidebar items are gone. The floating chatbot is gone. The contributor's first impression on every page is V2.

### Phase B (90 minutes total — header sweep on remaining REFINE surfaces)
6. Header swap on `/contributor/learning` (30 min)
7. Header swap on `/contributor/messages` (30 min)
8. Header swap on `/contributor/support` (30 min, optional)

**Output of Phase B:** Every contributor page opens with a V2-shaped header. The body content remains V1 internally but the framing reads V2.

### Phase C (deferred — out of cleanup scope but listed for transparency)
9. V2 rewrite of `/contributor/earnings` as a detail page sourced from the store (would unblock Progress→Earnings continuity)
10. V2 rewrite of `/contributor/tasks/submissions` as a thin filtered view of `/contributor/tasks` (would close the parallel-queue gap)
11. V2 rewrite of `/contributor/settings`
12. V2 onboarding shell

Phase C is **feature-redesign territory** and the cleanup-phase prompt explicitly excludes it. Listed only so the boundary between cleanup and rebuild is clear.

---

## 9. Quickest path to ecosystem cohesion — narrative summary

**Two and a half hours of focused work closes 80% of the visual conflict.** The work is almost entirely:
- One sidebar component edit (accent color)
- One layout component edit (AI chat widget mount)
- One nav config edit (sidebar item list)
- Six page header swaps (no body changes)
- One file deletion (orphaned placeholder)

None of these are rewrites. None require touching V1 page bodies. None affect the V2 store, the V2 lifecycle, or the V2 surfaces. They are purely **alignment edits**.

What this gets you: a portal where every sidebar item routes to a page that opens with the V2 entry header pattern, no floating chatbot competes with embedded AI, no duplicate sidebar destinations confuse the contributor, and the active sidebar item uses the contributor's teal accent.

What it doesn't get you: V1 page bodies still look V1. The earnings/submissions data still doesn't reconcile. Those are Phase C concerns.

---

## 10. Remaining blockers preventing enterprise realism

These are NOT addressed by the cleanup phase — they require the rebuild phase (Phase C) or the prior-audit's lifecycle-validation fixes:

1. **V1 page bodies still look V1.** The cleanup phase aligns headers and chrome only.
2. **Profile / Progress / Completed-Header / Revisions-Activity still read static mock data.** This is the "right half of the portal is frozen" finding from the lifecycle validation audit. Cleanup doesn't touch it.
3. **Mock mentor scheduler doesn't survive reload.** Lifecycle-validation finding D-1.
4. **Earnings data lives in two parallel ecosystems** (V1 API vs V2 mock). Cleanup hides the duplication in the sidebar but doesn't reconcile the data.
5. **Submissions queue is a parallel ecosystem.** Same.
6. **Credentials route from Completed Work** doesn't resolve to real credential detail. V1 page expects credentialIds that don't exist in the V2 store.
7. **AI Capability/Insight surfaces** (Profile, Progress) still show static text labeled "AI." These are operational-placeholder-territory cosmetics; cleanup doesn't fix them.
8. **Sidebar still doesn't visually distinguish "primary work execution" from other sections** beyond the dot — the brown→teal accent swap fixes the active state, but the "primary" emphasis indicator is also brown-hardcoded.

---

## Bottom-line answer

**Is the contributor portal one cohesive enterprise workforce ecosystem yet?**

**No — but it's a 2.5-hour fix away from looking like one at the seams.** The cleanup phase work doesn't make V1 page bodies into V2 page bodies. It does make the contributor stop perceiving the seams as "different products." Every sidebar click would land on a V2-shaped header; the active sidebar item would show in the contributor's accent color; no floating chatbot would compete with embedded AI; duplicate routes would no longer crowd the nav.

After cleanup, the *visual* incoherence is resolved. The *data* incoherence (V1 parallel data, frozen profile, mentor-timer fragility) remains for the rebuild phase to handle.

---

**End of audit.**
