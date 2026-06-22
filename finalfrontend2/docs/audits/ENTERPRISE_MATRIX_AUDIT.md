# Enterprise Portal — Surface × Dimension Matrix Audit

**Date:** 2026-05-26
**Branch:** `mentor-portal-v2`
**Method:** Automated sweep of 45 surfaces + targeted MCP inspection + code-level cross-check
**Scope:** Inch-by-inch verification against reorganized architecture

---

## Executive summary

After three earlier audit passes + the walkthrough Acts 1–9 pass, this final matrix sweep covered **45 enterprise surfaces** across automated and manual dimensions.

### The state in one paragraph
The reorganized architecture is **structurally in place**. Lifecycle continuity holds, cross-portal isolation is clean, console is silent, the demo script flows end-to-end. **Three detail surfaces (Projects, Decomposition, Reviewer) still inherit a "double shell"** — the workspace's section tabs render *above* the detail's own tabs, producing two H1s and two tablists per page. SOW had the same bug; we fixed it via a route group. The same pattern is the right fix for the other three. Outside that, remaining items are doc-drift (script names features that have been renamed) and acknowledged deferrals (Notifications V3, Profile P4-P8, onboarding).

### Verdict
**Stakeholder-demo ready** for Acts 1, 2, 7, 8, 9, Closing. Acts 3 (Decomp drill-down) and 4 (Project drill-down) work but render with the visual double-shell. **Architecturally consistent demo requires the three detail-page route-group fixes.**

---

## 1 · 45-surface sweep results

| # | Surface | HTTP | H1 | Cross-portal | Notes |
|---|---|---|---|---|---|
| 1 | `/enterprise/dashboard` | 200 | (client-greeting) | 0 | Activity feed info-only static; "AI Orchestration" panel from script missing |
| 2 | `/enterprise/sow` | 200 | SOW workspace | 0 | + New SOW CTA, eyebrow correct |
| 3 | `/enterprise/sow/queue` | 200 | SOW workspace | 0 | ✓ |
| 4 | `/enterprise/sow/escalations` | 200 | SOW workspace | 0 | ✓ |
| 5 | `/enterprise/sow/insights` | 200 | SOW workspace | 0 | ✓ |
| 6 | `/enterprise/sow/audit` | 200 | SOW workspace | 0 | ✓ |
| 7 | `/enterprise/sow/intake` | 200 | **New SOW intake** | 0 | ✅ separate-page flow, 5 stages |
| 8 | `/enterprise/sow/[sowId]` | 200 | (raw SOW id) | 0 | ⚠️ H1 reads `sow-helios-2026q2` — no human title |
| 9 | `/enterprise/decomposition` | 200 | Delivery decomposition | 0 | ✓ |
| 10 | `/enterprise/decomposition/plans` | 200 | Delivery decomposition | 0 | ✓ |
| 11 | `/enterprise/decomposition/dependencies` | 200 | Delivery decomposition | 0 | ✓ |
| 12 | `/enterprise/decomposition/staffing` | 200 | Delivery decomposition | 0 | ✓ |
| 13 | `/enterprise/decomposition/insights` | 200 | Delivery decomposition | 0 | ✓ |
| 14 | `/enterprise/decomposition/audit` | 200 | Delivery decomposition | 0 | ✓ |
| 15 | `/enterprise/decomposition/[planId]` | 200 | **Delivery decomposition** ← shell H1 leak | 0 | ❌ **double-shell: 2 H1s + 2 tablists** |
| 16 | `/enterprise/projects` | 200 | Delivery operations | 0 | ✓ |
| 17 | `/enterprise/projects/queue` | 200 | Delivery operations | 0 | ✓ |
| 18 | `/enterprise/projects/exceptions` | 200 | Delivery operations | 0 | ✓ |
| 19 | `/enterprise/projects/insights` | 200 | Delivery operations | 0 | ✓ |
| 20 | `/enterprise/projects/audit` | 200 | Delivery operations | 0 | ✓ |
| 21 | `/enterprise/projects/[projectId]` | 200 | **Delivery operations** ← shell H1 leak | 0 | ❌ **double-shell: 2 H1s + 2 tablists** |
| 22 | `/enterprise/delivery-tracking` | 200 | Operational heartbeat | 0 | ✅ **Hooks-order crash fixed earlier this session** |
| 23 | `/enterprise/delivery-tracking/streams` | 200 | Operational heartbeat | 0 | ✓ |
| 24 | `/enterprise/delivery-tracking/bottlenecks` | 200 | Operational heartbeat | 0 | ✓ |
| 25 | `/enterprise/delivery-tracking/activity` | 200 | Operational heartbeat | 0 | ✓ |
| 26 | `/enterprise/delivery-tracking/audit` | 200 | Operational heartbeat | 0 | ✓ |
| 27 | `/enterprise/delivery-tracking/insights` | 200 | Operational heartbeat | 0 | ✓ |
| 28 | `/enterprise/review` | 200 | Review queue | 0 | ✓ |
| 29 | `/enterprise/review/[deliverableId]` | 200 | (delivery title) | 0 | ✅ single H1, single tablist — gold-standard pattern |
| 30 | `/enterprise/billing` | 200 | Billing & invoices | 0 | ✓ |
| 31 | `/enterprise/billing/invoices` | 200 | Billing & invoices | 0 | ✓ |
| 32 | `/enterprise/billing/invoices/[id]` | 200 | **Billing & invoices** ← shell H1 only | 0 | ⚠️ No invoice-specific H1 |
| 33 | `/enterprise/billing/budget` | 200 | Billing & invoices | 0 | ✓ |
| 34 | `/enterprise/billing/payouts` | 200 | Billing & invoices | 0 | ✓ |
| 35 | `/enterprise/billing/audit` | 200 | Billing & invoices | 0 | ✓ |
| 36 | `/enterprise/billing/insights` | 200 | Billing & invoices | 0 | ✓ |
| 37 | `/enterprise/reviewer` | 200 | Validation orchestration | 0 | ✓ |
| 38 | `/enterprise/reviewer/queue` | 200 | Validation orchestration | 0 | ✓ |
| 39 | `/enterprise/reviewer/queue/[id]` | 200 | **Validation orchestration** ← shell H1 leak | 0 | ❌ **double-shell: 2 H1s + 2 tablists** |
| 40 | `/enterprise/reviewer/escalations` | 200 | Validation orchestration | 0 | ✓ |
| 41 | `/enterprise/reviewer/insights` | 200 | Validation orchestration | 0 | ✓ |
| 42 | `/enterprise/reviewer/audit` | 200 | Validation orchestration | 0 | ✓ |
| 43 | `/enterprise/audit` | 200 | Audit ledger | 0 | ✅ NEW · cross-domain ledger |
| 44 | `/enterprise/profile` | 200 | Who you are… | 0 | P4-P8 placeholders pending |
| 45 | `/enterprise/settings` | 200 | Workspace preferences… | 0 | ✓ |
| 46 | `/enterprise/notifications` | 200 | Lifecycle events… | 0 | ⚠️ V2 holdout (queued P1-P8 redesign) |

**Totals:** 45 / 45 HTTP 200 · 0 cross-portal hrefs · 95 % legacy-palette-free.

---

## 2 · Architectural issues found

### 2.1 — Double-shell on 3 detail surfaces (P0 — same root cause as SOW pre-fix)

| Detail surface | H1 count | Tablist count | Workspace shell label leaking | Detail's own label |
|---|---|---|---|---|
| `/enterprise/projects/[projectId]` | 2 | 2 | "Projects sections" (4 tabs) | "Program sections" (9 tabs) |
| `/enterprise/decomposition/[planId]` | 2 | 2 | "Decomposition sections" (5 tabs) | "Plan workspace sections" (?) |
| `/enterprise/reviewer/queue/[reviewId]` | 2 | 2 | "Reviewer workspace sections" (5 tabs) | "Validation sections" (8 tabs) |

**Contrast — surfaces that got it right:**
- `/enterprise/sow/[sowId]` — 1 H1, 1 tablist (fixed via route group earlier this session)
- `/enterprise/review/[deliverableId]` — 1 H1, 1 tablist (review is at `/review` root, no `/review/queue` workspace shell above it)

**Architectural fix:** Apply the same `(workspace)/` route-group pattern used for SOW to Projects, Decomposition, and Reviewer. Move workspace pages into `(workspace)/`; detail (`[id]`) lives outside the group with its own focused layout.

### 2.2 — SOW detail title shows raw ID instead of human-readable title (P1)
`/enterprise/sow/sow-helios-2026q2` H1 = `"sow-helios-2026q2"`. Should be the SOW's actual title (e.g., "Helios Design System Q2 2026").

### 2.3 — Invoice detail has no invoice-specific H1 (P1)
`/enterprise/billing/invoices/[invoiceId]` H1 = `"Billing & invoices"` (parent header only). Stakeholder opening an invoice has no contextual title.

### 2.4 — Sidebar order — already fixed
Lifecycle order now correctly reads: Overview → Origination → Delivery → Acceptance → Finance → Governance. ✅

### 2.5 — Walkthrough script doc drift (P2)
Script names UI features that have been renamed or restructured in implementation:
- Act 1: "AI Orchestration" panel + "Cross-Role Activity" feed referenced — not in current dashboard
- Act 3: "decomposition/[planId] is V1 and now redirects" — actually V3 with 9 tabs
- Act 4: Lifecycle continuum shows 5 stages (Contributor · Mentor · Reviewer · Enterprise · Billing) not script's 7 (Decomposed → Execution → Mentor → Revision → Enterprise Review → Accepted → Billing)
- Act 8: Tabs named "Overview / Lineage / Evidence / Criteria / Decision" — actually "Overview / Evidence / AI insights / Lineage / Audit / Discussion". "Criteria" tab missing; "Decision" is a side rail, not a tab. Button labeled `Approve` not `Accept & close lifecycle`
- Act 9: "Workforce compensation by skill cohort, paid/pending split" — not detected in body text

These don't break the demo — they break the script-vs-screen alignment for the demoer.

---

## 3 · UX dimensions covered

### Verified clean (high confidence)
| Dimension | Result |
|---|---|
| HTTP 200 on every enterprise surface | 45/45 ✅ |
| Cross-portal link isolation in active code | 0 hrefs to /contributor /mentor /admin ✅ |
| Console errors per page after AUTH_SECRET fix | 0 ✅ |
| Typecheck | 0 errors ✅ |
| Rendered DOM legacy palette classes | 0 ✅ |
| Sealed V1 routes redirect | 51 routes verified ✅ |
| Modal portaling + scroll-lock + ESC | ConfirmDialog + Reassignment + Conflict modals all pass ✅ |
| Bulk action bar wiring (Reviewer queue) | 5 actions → ConfirmDialog → V3 store → audit ledger ✅ |
| Sidebar lifecycle order | Now matches architecture ✅ (fixed this session) |
| Audit Trail aggregator | New `/enterprise/audit` page works end-to-end ✅ (tested with seeded entry) |
| SOW intake separate-page flow | Click + New SOW → /intake → 5 stages → Cancel → workspace ✅ |
| Cross-role context cards read-only | Review Detail Lineage + Delivery Tracking Lineage Context-chipped ✅ |
| Lifecycle propagation (data through V3 stores) | Audit ledger picked up reviewer recommendation across domains ✅ |
| AUTH_SECRET / NextAuth session | HTTP 200, no auth errors ✅ |
| 87 dead V2 files removed | Verified by filesystem inventory ✅ |

### Sampled — not exhaustively verified
| Dimension | Coverage so far |
|---|---|
| Every clickable button | ~30 of unknown total — sampled the bulk action bars, decision rails, action rails |
| Every tab on every detail page | Spot-checked SOW (8), Project (9), Review (6), Reviewer (8); not exhaustively switched through each |
| Every modal opens + traps focus | ~12 of ~30 modals tested |
| Every CSV export downloads | Audit + Reviewer Audit verified; others code-inspected only |
| Every confirmation dialog stamps audit | Sampled on Reviewer recommendation; not exhaustive |
| Empty/loading/error states | Code-inspected; not all browser-exercised |

### Not covered this audit (acknowledged gaps)
- Topbar search ⌘K behavior
- Notifications bell drawer
- Account menu (operator dropdown)
- Keyboard shortcuts (`G D`, `G S`, `G C`, `G P`, `G R`, `G B`)
- Sidebar collapse/expand state persistence
- Active-state highlighting on every sub-route
- Responsive at 1440px / 1920px
- Accessibility (screen reader, contrast, focus visible)
- Activity feed timestamps "X minutes ago" updating live
- Token persistence / acceptance propagation real-time (verified via mock seed only)
- Browser back button behavior post-modal-open
- Refresh on detail page state preservation
- Filter reset behavior
- Tab state persistence in URL

---

## 4 · Fixes shipped THIS session (recap)

| ID | Issue | Status |
|---|---|---|
| P0-A | 3 cross-portal links (Dashboard alert + Review Detail Lineage × 2 + Delivery Tracking Mentor hop) | ✅ |
| P0-B | NextAuth `/api/auth/session` HTTP 500 → noise on every page | ✅ |
| P0-C | Missing `+ New SOW` CTA on `/enterprise/sow` | ✅ |
| P0-D | SOW Intake inheriting workspace shell — moved to its own dedicated page via route group | ✅ |
| P0-E | `/enterprise/delivery-tracking` hooks-order crash (useMemo after early return) | ✅ |
| P0-F | Sidebar order violated lifecycle architecture (Dashboard / Review / Billing bunched at top before SOW) | ✅ |
| P1 | Audit Trail nav decision — built top-level cross-domain aggregator | ✅ |
| P1 | Move 87 dead V2 files out of build graph | ✅ |
| P1 | Stage-label drift on intake stepper (now matches spec) | ✅ |
| P2 | "Phase 7 placeholder" obsolete copy on Reviewer queue | ✅ |

---

## 5 · Open issues — prioritized

### P0 — apply same route-group pattern to 3 detail surfaces
| Surface | Action |
|---|---|
| `/enterprise/projects/[projectId]` | Restructure into `projects/(workspace)/` + `projects/[projectId]/` with own layout |
| `/enterprise/decomposition/[planId]` | Same restructure |
| `/enterprise/reviewer/queue/[reviewId]` | Same restructure |

**Total impact:** ~3 dir renames (similar to SOW move I did) + ~3 new dedicated layouts. Each detail surface stops rendering the parent workspace's H1 + 4-tab nav, and instead renders its own focused chrome. Same operational pattern as `/enterprise/review/[deliverableId]` (the gold-standard surface).

### P1 — detail page titles
| Surface | Current H1 | Should be |
|---|---|---|
| `/enterprise/sow/[sowId]` | `"sow-helios-2026q2"` | SOW's `title` field (e.g., "Helios Design System Q2 2026") |
| `/enterprise/billing/invoices/[invoiceId]` | `"Billing & invoices"` | Invoice number + program (e.g., "INV-2026-Q2-001 · Helios DS") |

### P1 — acknowledged-deferred (already tracked)
- Notifications V3 redesign (#297–304 tasks)
- Profile P4–P8 sub-pages (#292–296 tasks)

### P2 — walkthrough script doc drift
`STAKEHOLDER_WALKTHROUGH_SCRIPT.md` mentions feature names that have been renamed or restructured. Recommend a refresh pass before next demo:
- Act 1 — drop "AI Orchestration" / "Cross-Role Activity" references; describe current Attention Queue + Recent Activity layout
- Act 3 — remove "V1 redirect" warning for `/decomposition/[planId]`
- Act 4 — update lifecycle continuum to 5 stages
- Act 8 — update tab names (Overview · Evidence · AI insights · Lineage · Audit · Discussion); describe decision rail (right-side action panel), button labeled "Approve"
- Act 9 — describe what's actually on Billing (5 tabs) instead of "workforce compensation rollup"

### P3 — dimensions I did not exhaustively audit
- Topbar ⌘K + bell + account menu (every page)
- Keyboard shortcuts
- Active state highlighting on every nested sub-route
- Responsive 1440 / 1920
- a11y deep dive

---

## 6 · Hard claims I CAN make with confidence

1. **Cross-portal isolation is total** — across 45 surfaces, 0 hrefs to /contributor /mentor /admin in active rendered DOM.
2. **The 9-Act demo script flows end-to-end** without console errors or runtime crashes after this session's fixes (P0-E + P0-F).
3. **The Reviewer Workspace is the cleanest V3 surface** — 8 phases shipped, 0 legacy palette in active DOM, all modals + audit + recommendation flows verified.
4. **Sealed V1 routes redirect** without breaking demo continuity (verified 51 routes).
5. **Sidebar matches architecture** — Overview → Origination → Delivery → Acceptance → Finance → Governance.
6. **Typecheck is clean** — 0 errors across 87 file deletions + 6 major refactors + 3 new pages.

## 7 · Claims I CANNOT make

1. **"Every button on every page works."** Sampled, not exhaustive.
2. **"Every keyboard shortcut works."** Never tested any.
3. **"Every modal across all surfaces traps focus + closes on ESC."** Sampled ~12 of ~30 known modals.
4. **"Responsive layout is correct at 1440 / 1920."** Tested at default viewport only.
5. **"Accessibility is fully WCAG compliant."** Not audited.
6. **"Notifications + Profile sub-pages are production-quality."** Notifications is V2 holdout; Profile P4-P8 are placeholders.

---

## 8 · Final verdict

**STAKEHOLDER-DEMO READY** with one caveat: **3 detail-surface route-group restructures (P0) should land before showing the project / decomposition / reviewer detail drill-downs.** The visual double-shell isn't a *crash*, but it's a clear architectural quality issue that stakeholders with sharp eyes will catch.

**INTERNAL-QA READY** without those fixes — the QA team can flag the double-shell themselves and we won't lose the deployment.

**PRODUCTION READY** — still gated by the items in `PHASE_1_CLOSURE_CHECKLIST.md §5` (Prisma migration, observability, server-side persistence) which are out of audit scope.

---

## 9 · Recommended next action

1. **Apply the route-group pattern to Projects + Decomposition + Reviewer detail surfaces** (~30 min each, same shape as SOW fix from earlier this session).
2. **Fix the SOW detail H1** to read the SOW title instead of the ID.
3. **Refresh the walkthrough script doc** to match current implementation (Acts 1, 3, 4, 8, 9 each need a paragraph update).
4. **Defer everything else** — they're acknowledged-deferred or out-of-scope per Phase 1B spec.

After (1) + (2) + (3), the next audit pass would graduate to **inch-by-inch responsive + a11y + keyboard sweep** if you want to push toward production-level coverage.

---

**End of matrix audit.** No further audit work pending. The next move is fix execution.
