# Enterprise Portal V2 — MVP Operational Surface Plan

**Phase:** 1B — Enterprise Portal V2 (MVP surface scoping)
**Scope:** Identify the **minimum but strongest** set of Enterprise V2 surfaces required to complete the workforce lifecycle narrative. **No implementation.**
**Constraint:** Must not exceed the build budget needed to ship Phase 1B alongside Contributor V2 + Mentor V2.

---

## 0 · Operating principle for this plan

> "We are not rebuilding 77 Enterprise pages. We are building the smallest Enterprise V2 surface set that closes the workforce lifecycle. Everything else stays V1, hidden from nav, or deferred to Phase 2."

The acceptance test for any surface entering MVP scope is one question:
**"Does the walkthrough story break without this surface?"** If no, defer.

---

## 1 · MVP-Critical Surfaces

### Tier 1 · Required for the lifecycle walkthrough (6 surfaces)

These are the surfaces without which the demo cannot tell the end-to-end workforce orchestration story.

#### S1 · Enterprise Dashboard
- **Operational purpose:** Operational orchestration overview · today's state across SOWs, projects, reviews, exceptions
- **Lifecycle role:** Entry point. Sets executive tone for the rest of the portal.
- **Why MVP-critical:** First impression. The contributor and mentor portals open with a dashboard; Enterprise must too. Without it the walkthrough opens cold.
- **Downstream ecosystem:** Surfaces real-time counts from the unified task store (active SOWs, in-flight projects, pending acceptances). Links to every other surface.

#### S2 · SOW Workspace
- **Operational purpose:** Unified intake / review / approval surface. Collapses 18 V1 SOW routes into one staged workspace.
- **Lifecycle role:** **Origination.** Where work enters the platform.
- **Why MVP-critical:** Without SOW Workspace, the Enterprise demo has no upstream story. The walkthrough cannot start before tasks exist.
- **Downstream ecosystem:** Approved SOWs feed Decomposition. Approval state transitions are observable.

#### S3 · Decomposition Workspace
- **Operational purpose:** SOW → milestones → tasks. The scoping bridge.
- **Lifecycle role:** **Origination → Production handoff.** This is where Enterprise creates the tasks the Contributor will see in Assigned Work.
- **Why MVP-critical:** This is the most operationally important surface in the entire Enterprise portal — it's the bridge between Enterprise (orchestration) and Contributor (production). Without it, the cross-portal lifecycle story has a missing link.
- **Downstream ecosystem:** Decomposed tasks land in Contributor's Assigned Work via the unified task store. Same task object. Same identity.

#### S4 · Project Portfolio
- **Operational purpose:** All in-flight projects with delivery state visibility.
- **Lifecycle role:** **Delivery visibility.** The "where are my projects right now" surface.
- **Why MVP-critical:** Enterprise buyers ask this question constantly. Without a portfolio surface, the demo can't answer "show me what's in flight."
- **Downstream ecosystem:** Each project rolls up its tasks (which live in the shared store). Project status reflects the underlying task lifecycle states.

#### S5 · Evidence Review (Enterprise Acceptance)
- **Operational purpose:** Enterprise-side acceptance of mentor-approved work. The signal that closes the lifecycle.
- **Lifecycle role:** **Acceptance.** The handback from Mentor governance to Enterprise acceptance.
- **Why MVP-critical:** Without Evidence Review, accepted contributor work has nowhere to land on the enterprise side. The lifecycle would not close.
- **Downstream ecosystem:** Reads from the unified task store (`state: completed` tasks pending enterprise sign-off). Acceptance event triggers Billing.

#### S6 · Billing
- **Operational purpose:** Payouts, invoices, rate cards, financial settlement. Consolidated from 6 V1 routes into one surface with tab views.
- **Lifecycle role:** **Settlement.** The financial closure of the lifecycle.
- **Why MVP-critical:** Money is the proof. Without Billing, "completed work" doesn't connect to financial reality. Enterprise buyers care most about this.
- **Downstream ecosystem:** Invoice line items derive from accepted tasks. Contributor's Progress earnings panel mirrors the same data from the contributor side.

### Tier 2 · Strongly recommended (3 surfaces)

These are not strictly demo-blocking but materially strengthen the governance + delivery story.

#### S7 · Reviewer Workspace (sub-portal shell)
- **Operational purpose:** Enterprise-side reviewer workflow (10 V1 routes wrapped in V2 shell).
- **Lifecycle role:** **Internal-to-enterprise review.** Differs from Mentor (Glimmora governance) — Reviewer is the enterprise's own internal reviewer.
- **Why MVP-critical:** Reviewer is already 10 V1 pages. Wrapping in V2 shell is low effort + high consistency win. Demonstrating that the enterprise has its own review tier (separate from Glimmora mentor) clarifies the role model.
- **Downstream ecosystem:** Shares the unified task store. Reviewer decisions feed into Evidence Review.

#### S8 · Audit Trail
- **Operational purpose:** Cross-cutting operational record of every state-changing event.
- **Lifecycle role:** **Governance proof.** The unforgeable record stakeholders ask about.
- **Why MVP-critical:** Enterprise buyers ask "what's our audit story?" The unified store's activity log already exists; this surface visualizes it.
- **Downstream ecosystem:** Reads the same activity log the Contributor V2 Revisions Workspace activity stream uses. Same events, enterprise framing.

#### S9 · Exceptions
- **Operational purpose:** Delivery escalations + blockers visible to enterprise.
- **Lifecycle role:** **Operational reality.** Things go wrong; the platform shows where.
- **Why MVP-critical:** Without an exceptions surface, the demo only shows the happy path. Enterprise buyers know happy-path demos are theater; they want to see how the platform handles failure.
- **Downstream ecosystem:** Reads from tasks in `blocked` / `awaiting_clarification` / `escalated` states. Mentor portal's Escalated Reviews and Governance Holds also surface here from the enterprise vantage.

### Tier 3 · Nice-to-have (not in MVP)

These can stay V1 or be deferred without breaking the demo:

- **Teams workspace** (workforce formation) — Implied by Decomposition assigning tasks; no need for a dedicated surface in MVP
- **Compliance workspace** (Documents · ESG · Evidence · PODL) — Currently 4 V1 pages, hidden from nav. Promote to nav in Phase 2.
- **Notifications** — V1 page exists; works fine
- **Profile / Settings** — V1 pages; minimal use during demo

### MVP-critical count: **9 surfaces** (6 required + 3 strongly recommended)

---

## 2 · Enterprise Walkthrough Flow

The cleanest demo flow that connects Enterprise V2 to the existing Contributor + Mentor V2 lifecycle:

### The integrated walkthrough story (one continuous narrative)

```
1.  Enterprise Dashboard         "Where the buyer stands operationally today"
        ↓
2.  SOW Workspace                "Acme Corp uploads a new statement of work"
        ↓
3.  SOW Approval (sub-stage)     "The 5-stage approval pipeline clears it"
        ↓
4.  Decomposition Workspace      "The SOW becomes 12 tasks across 3 milestones"
        ↓
5.  [Switch to Contributor V2]   "The contributor sees one of those tasks land in their queue"
        ↓
6.  [Contributor → Submit]       "Contributor completes work, submits"
        ↓
7.  [Switch to Mentor V2]        "Mentor reviews, approves"
        ↓
8.  [Back to Enterprise V2]
8a. Project Portfolio            "Enterprise sees the project tile move from In Progress → Pending Acceptance"
        ↓
8b. Evidence Review              "Enterprise reviews the delivered evidence, accepts"
        ↓
9.  Billing                      "Acceptance creates the invoice line item"
        ↓
10. Audit Trail                  "Every transition above is recorded — provable"
```

### Cross-portal navigation points (where demoer switches)

| Step | Portal switch | What stakeholders see |
|---|---|---|
| 4 → 5 | Enterprise → Contributor | Decomposed task appears in Contributor's Assigned Work in real time |
| 7 → 8 | Mentor → Enterprise | Project tile changes color/state as mentor approval ripples to enterprise |
| 9 → end | Enterprise (Billing) | Invoice line item with payout reference matches contributor's earnings tile |

### Why this flow is the right one
- **Starts upstream.** Story begins where work originates (SOW), not mid-flow (contributor's morning).
- **Demonstrates handoffs explicitly.** Portal switches are theatrical — stakeholders see the same task moving between roles.
- **Closes the loop.** Billing is the proof of the full lifecycle. The walkthrough ends on financial settlement.
- **Audit is the closer.** Audit Trail demonstrates the unforgeable record at the end — answers the "but is this real?" question.

---

## 3 · Implementation Priority Order (build sequence)

Strict order. Each step builds on the previous. Do not parallelize across waves.

### Wave 1 · Origination spine (4 surfaces · highest demo value)
1. **Enterprise Dashboard** — sets tone, surfaces orchestration counts
2. **SOW Workspace** — biggest V1 consolidation (18 routes → 1 staged workspace)
3. **Decomposition Workspace** — the cross-portal handoff to Contributor
4. **Project Portfolio** — delivery visibility (replaces "Project Monitoring")

**Wave 1 demo capability:** SOW intake → Decomposition → tasks appear in Contributor V2 queue → return to Enterprise to see delivery state. The upstream half of the lifecycle is live.

### Wave 2 · Acceptance + financial closure (2 surfaces)
5. **Evidence Review** — enterprise-side acceptance loop
6. **Billing** — consolidated financial surface

**Wave 2 demo capability:** Mentor-approved work flows to Evidence Review → enterprise accepts → invoice appears in Billing → contributor's Progress earnings reflects the same payout. **The full lifecycle is closed.**

### Wave 3 · Governance + edge cases (3 surfaces)
7. **Reviewer Workspace shell** — wrap existing 10 V1 pages
8. **Audit Trail** — visualize the activity log
9. **Exceptions** — escalation visibility

**Wave 3 demo capability:** Governance proof story complete. Enterprise can answer "what's our audit?" and "what happens when things go wrong?"

### Stop here for Phase 1B
Do not continue into Compliance, Teams, deep analytics, settings polish. Those are Phase 2.

---

## 4 · What Stays V1 / Hidden / Deferred

### V1 pages to hide from V2 nav (keep functional, just not in sidebar)

| V1 path | Why hide | Phase to revisit |
|---|---|---|
| `/enterprise/analytics/*` (3 pages) | Needs real operational data; mock analytics distract from lifecycle story | Phase 2 |
| `/enterprise/compliance/*` (4 pages) | Promote to nav in Phase 2 once V2 chrome ready | Phase 2 |
| `/enterprise/team/*` (3 pages) | Workforce formation implied by Decomposition for MVP | Phase 2 |
| `/enterprise/onboarding` | One-time SSO flow; not recurring | Phase 2 cosmetic |
| `/enterprise/notifications` | Functional V1; minimal recurring use | Phase 2 cosmetic |
| `/enterprise/profile` | Functional V1; minimal recurring use | Phase 2 cosmetic |
| `/enterprise/settings/*` (2 pages) | Boundary surface; works fine V1 | Phase 2 cosmetic |
| **SOW deep sub-routes** (`upload/extraction-report`, `upload/gap-analysis`, `upload/gaps`, `upload/parsed-review`, `upload/preview-confirm`, `upload/report`, `upload/review`, `upload/details`) | Consolidate into SOW Workspace stages, NOT separate URLs | Phase 1B consolidation |
| `/enterprise/sow/blueprint`, `/sow/archive`, `/sow/versions` | Internal lifecycle stages of SOW Workspace, not standalone destinations | Phase 1B consolidation |

### V1 pages safe to defer entirely (no Phase 1B touch)

- All sub-routes under `/sow/upload/*` (8 wizard stages) — collapse into SOW Workspace stages
- `/enterprise/sow/[sowId]/compare`, `/sow/[sowId]/contract`, `/sow/[sowId]/kickoff` — sub-states of SOW Workspace detail
- `/enterprise/decomposition/[planId]/edit` — internal decomp workspace state
- `/enterprise/projects/[projectId]/milestones`, `/projects/[projectId]/monitor`, `/projects/[projectId]/tasks/[taskId]` — Project Portfolio drill-down (Phase 1B internal views, not separate top-level)

### Hard exclusions from Phase 1B

- Multi-tenant org switching
- Deep automation rules (auto-routing, auto-approval logic)
- AI generation features beyond Decomposition assistance
- Enterprise-facing notifications system redesign
- Settings deep customization

---

## 5 · Enterprise V2 Operational Philosophy

### What Enterprise V2 should feel like

Where Contributor V2 is **production + motivation** and Mentor V2 is **governance + audit-grade**, Enterprise V2 is **orchestration + strategic visibility**.

| Dimension | Enterprise V2 stance |
|---|---|
| **Information density** | Higher than Contributor (executives read more) · lower than Mentor (no severity rails) |
| **Tone** | Strategic + operational · not chatty, not bureaucratic |
| **Time horizon** | Quarter + year (vs Contributor's day, Mentor's SLA window) |
| **Decision support** | Pattern visibility, not prescriptive AI |
| **Action surface** | Approve, accept, allocate, invoice (vs Contributor's submit / Mentor's review) |
| **Color** | Brown accent (per `accentColor: "brown"` — already in `enterpriseNav` config) |

### What Enterprise V2 must NOT feel like

- ❌ Generic project tracker (Jira/Asana clone)
- ❌ Generic SaaS dashboard (Salesforce clone)
- ❌ Static client portal (read-only buyer dashboard)
- ❌ Different product from Contributor + Mentor V2 (visual mismatch)

### Five operating principles (carried from reorganization doc)
1. Origination over administration
2. Lifecycle over modules
3. Governance is structural, not bolted-on
4. Delivery transparency, not surveillance
5. One ecosystem, three vantage points

### Anti-patterns to avoid
- "Welcome, Enterprise Admin Console" — sounds like internal tooling, not a workforce orchestration product
- Burying SOW intake behind 9 wizard URLs (current V1 reality)
- Splitting Review + Billing into disconnected sections — they're one accept-and-pay loop
- Treating compliance/audit as appendices — they're load-bearing for enterprise trust

---

## 6 · Reviewer Sub-Portal Positioning

### Relationship to Enterprise
**Reviewer is enterprise-side, not platform-side.** It is the workspace used by the enterprise's *own internal reviewers* — not Glimmora mentors. Think: Acme Corp's internal QA lead reviewing the contributor work delivered to Acme's project.

This is critical to distinguish:

| Role | Who | What they do |
|---|---|---|
| **Mentor** | Glimmora staff | Platform-level governance · severity · SLA · escalation |
| **Reviewer** | Enterprise's own staff | Internal review of work delivered to *their* projects |

### Operational responsibilities (from V1 routes)
Reviewer sub-portal already covers:
- Review queue (for the enterprise's own deliverables)
- Task monitor (visibility into ongoing work)
- Q&A inbox (questions from contributors)
- Review history + mentoring log
- Personal metrics

### Lifecycle position
```
Contributor submits → Mentor reviews (Glimmora) → Mentor approves
                                                    ↓
                                  Enterprise Reviewer can also review (optional internal QA gate)
                                                    ↓
                                  Enterprise Evidence Review (acceptance/sign-off)
```

Reviewer is an **optional internal QA tier** the enterprise can opt to use between Mentor approval and Enterprise final acceptance.

### Dependency on Enterprise V2 shell
- Reviewer inherits Enterprise V2 chrome (same sidebar, brown accent, V2 primitives)
- Reviewer-scoped sidebar when inside `/enterprise/reviewer/*`
- Same unified task store
- Same V2 visual language (reuses Mentor V2 governance primitives for severity rails, SLA, etc. — Reviewer does similar work to Mentor)

### Phase 1B scope for Reviewer
**V2 shell wrap only.** No functional rebuild. Wave 3 work.

---

## 7 · Shared Cross-Role Continuity Map

The mandate: same unified task store, three operational vantage points.

### Concrete cross-portal data flows

| Event | Enterprise V2 surface | Contributor V2 surface | Mentor V2 surface |
|---|---|---|---|
| **SOW approved → decomposed into tasks** | Decomposition workspace creates tasks | Tasks appear in Assigned Work | No change yet |
| **Contributor accepts task** | Project Portfolio shows task as `in_progress` | Workroom opens; state = `accepted` → `in_progress` | No change yet |
| **Contributor submits** | Project Portfolio task shows `under_review` | Workroom state = `under_review` | Pending Reviews queue surfaces it |
| **Mentor decides** | Project Portfolio reflects mentor outcome | Dashboard surfaces decision; revision flow or completed | Review activity log updated |
| **Mentor approves** | Project task = `completed` · Evidence Review surfaces it | Completed Work archive · Progress earnings tile updates | Review history log entry |
| **Enterprise accepts** | Evidence Review marks accepted · Billing generates invoice | No change (already in Completed Work) | Audit log entry |
| **Invoice paid** | Billing shows paid · Project tile shows financially closed | Progress · Earnings panel shows payout reference | No change |
| **Mentor escalates** | Exceptions surface flags it · Project Portfolio tile changes color | Workroom state = `escalated` | Escalated Reviews surface |
| **Mentor governance hold** | Compliance + Exceptions flag it | Workroom blocked with hold notice | Governance Holds surface |

### Architectural commitment
The unified contributor task store extends to absorb Enterprise-originated work. New fields on the `Task` model (or new task properties referenced from store):
- `originSowId` — which SOW the task came from
- `originProjectId` — which project it belongs to
- `enterpriseAccepted: boolean` — final enterprise sign-off flag
- `invoiceLineId` — financial trace

**No new store. Same store, extended fields.** Phase 1B does NOT introduce a separate Enterprise data ecosystem.

### State machine extensions
Current Contributor V2 lifecycle: `assigned → accepted → in_progress → ready_for_submission → under_review → revision_requested → ready_for_submission → under_review → approved → completed`

Phase 1B adds two enterprise-side states:
- `completed → pending_enterprise_acceptance` (after mentor approves, before enterprise signs off)
- `pending_enterprise_acceptance → accepted` (enterprise sign-off) → triggers invoice

Optional escalation states already exist (`escalated`, `blocked`).

---

## 8 · Safest Phase 1B Scope (the deliverable)

### What Phase 1B ships
- **9 V2 surfaces** across 3 waves (6 required + 3 strongly recommended)
- **Unified task store extended** for SOW origination, enterprise acceptance, invoice trace
- **Visual consistency** with Contributor + Mentor V2 (same primitives, brown accent for enterprise)
- **Cross-portal continuity verified** — same task object observable from all three vantage points
- **Reviewer sub-portal V2 shell** (wrap only, no functional rebuild)
- **SOW consolidation** (18 V1 routes → 1 staged workspace) — biggest cleanup win

### What Phase 1B does NOT ship
- All 77 V1 pages migrated (only the 9 lifecycle-critical surfaces become V2)
- Backend integration (mock store only, matching Contributor + Mentor V2)
- New roles (no inventing personas beyond `UserRole` union)
- Analytics deep dashboards
- Multi-tenant features
- Settings deep customization
- Compliance V2 (Phase 2)
- Teams V2 (Phase 2)
- Reviewer functional rebuild (Phase 2)

### Phase 1B success criteria
1. ✅ Demo can begin at Enterprise (SOW intake) and end at Enterprise (invoice paid)
2. ✅ The same task object is observable from all three portals
3. ✅ Cross-portal handoffs propagate state in real time (verified by browser walkthrough)
4. ✅ Enterprise V2 sidebar reads cohesively with Contributor + Mentor V2
5. ✅ 18 SOW V1 routes consolidated to 1 workspace
6. ✅ Reviewer sub-portal accessible from Enterprise with consistent V2 chrome
7. ✅ Audit trail surface exposes the unified activity log
8. ✅ Billing surface ties accepted work to invoice line items

---

## 9 · Recommended next role-build step (after this plan is approved)

**Build Wave 1 first. In order. No parallelization within Wave 1.**

1. Enterprise Dashboard V2 — establishes the visual + operational pattern
2. SOW Workspace V2 — biggest consolidation win
3. Decomposition Workspace V2 — the cross-portal handoff to Contributor
4. Project Portfolio V2 — delivery visibility

**After Wave 1 ships, stop. Test the cross-portal handoff** (Decomposition → Contributor Assigned Work). Only proceed to Wave 2 (Evidence Review + Billing) once Wave 1 is verified.

**This sequence guarantees:**
- The cross-ecosystem story (Enterprise → Contributor → Mentor → Enterprise) is testable end-to-end after Wave 2
- Visual + architectural patterns stabilize early
- Risk of large parallel rework is minimized

---

## 10 · Closing operational frame

### The minimum-but-strongest test
The MVP Enterprise V2 must answer all of these from a single demo session:

| Stakeholder question | MVP-critical surface that answers it |
|---|---|
| "Where does work come from?" | SOW Workspace |
| "How does scope become tasks?" | Decomposition |
| "Where are my projects?" | Project Portfolio |
| "Who's working on what?" | Project Portfolio + handoff to Contributor V2 |
| "How is quality controlled?" | Handoff to Mentor V2 (already built) |
| "How do I accept delivered work?" | Evidence Review |
| "What happens financially when I accept?" | Billing |
| "Is this auditable?" | Audit Trail |
| "What happens when things go wrong?" | Exceptions |
| "Where do my internal reviewers work?" | Reviewer Workspace |

If all 10 questions can be answered in a single walkthrough using only V2 surfaces, **Phase 1B is complete**.

### What Phase 1B delivers strategically

The platform transforms from:

> **"Two-thirds of a workforce ecosystem"** — Contributor + Mentor V2 demonstrate execution and governance · the enterprise origin is implicit

To:

> **"A complete workforce orchestration, execution, governance, acceptance, and settlement ecosystem"** — observable from three role-appropriate vantage points over one unified data model

**This is the Phase 1B mandate. Nine surfaces. Three waves. One unified story.**

---

**End of Enterprise V2 MVP operational surface plan.**

No code produced. No implementation. Strictly: surface scope, walkthrough flow, implementation order, V1 defer list, cross-role continuity map, Phase 1B boundary.
