# Workforce sourcing & review routing — product architecture

> **Status:** **PROPOSED** — pending Sponsor + Product Lead sign-off  
> **Created:** 2026-05-31  
> **Extends:** `07-decisions-log.md` (#5 two-stage review, #14 persona-conditional portal)  
> **Authoritative for:** internal-employee assignment, matching pool scope, mentor vs enterprise reviewer routing  
> **Related specs:** `02-enterprise-portal.md` §5.D (decomposition), §5.E (projects), `01-contributor-portal.md` §1.2, `05-cross-functional.md` §15

---

## 1. Problem statement

GlimmoraTeam serves **two workforce models in one platform**:

| Model | Example | Enterprise mental model |
|---|---|---|
| **Marketplace** | Freelancer, student, women workforce | “Find skilled people I don’t employ” |
| **Employer** | HRIS-synced internal employees | “Give work to people I already employ” |

Today both models share:

- One **global matching drawer** (ranked contributors with no “my org” filter)
- One **default review path** that assumes a **Glimmora mentor**

That creates two product failures for enterprise buyers:

1. **Discovery** — PMO cannot easily find `designer-1@acme.com` among hundreds of marketplace contributors.
2. **Governance** — Acme asks: “Why does an external mentor review my own employee’s work?”

This document locks the architecture for **sourcing policy**, **assignment UX**, and **review routing** so internal and external delivery can coexist without separate portals.

---

## 2. Principles (locked)

1. **One contributor portal, policy-driven behavior** — no `/internal/` portal fork (extends Decision #14).
2. **Marketplace mode ≠ employer mode** — different defaults for pool scope and review chain.
3. **Task-level granularity** — a single project may mix internal and external tasks (hybrid SOW).
4. **Direct assign is valid** — PMO may skip ranking when the assignee is known (especially internal).
5. **Mentor = platform QA for external trust** — not the default gate for employer-owned delivery.
6. **Audit everything** — `task.assign`, `task.assign.direct`, `task.reassign`, `review.route` events (cross-fn doc 05).

---

## 3. Delivery modes

Every **project** has a default mode; every **task** may override.

| Mode | Code | Who executes | Matching pool | Default review |
|---|---|---|---|---|
| **Internal delivery** | `internal_only` | Tenant HRIS contributors (`contribType = internal`) | My organization only | Manager or `ent.reviewer` — **no Glimmora mentor** |
| **External delivery** | `external_only` | Marketplace contributors (freelancer, student, women WF) | Glimmora network | **Glimmora mentor** (+ optional two-stage `ent.reviewer`) |
| **Hybrid** | `hybrid` | Per-task | Per-task policy | Per-task `reviewPath` |
| **Open market** | `open` (legacy default) | Any contributor with skill match | Global ranked pool | Mentor unless task overrides |

**Phase 1 pilot default for Acme-style tenants:** `hybrid` at project level, with decomposition tagging each task `internal | external`.

---

## 4. Decisions (summary — see `07-decisions-log.md` #21–#24)

### 21. Workforce sourcing policy

- **Decision:** Introduce `workforceSourcing` at **tenant default**, **project**, and **task** (task wins).
- **Values:** `internal_only` | `internal_first` | `external_only` | `open`
- **Why:** Enterprises must not hunt for employees in a global list. Marketplace tenants keep `open`.
- **Owner:** Product + EM Enterprise

| Value | Assign drawer default tab | Matching API scope |
|---|---|---|
| `internal_only` | My organization (only) | `user.tenantId = task.tenantId AND profile.contribType = internal` |
| `internal_first` | My organization | Org pool ranked first; marketplace collapsed below fold |
| `external_only` | Glimmora network | Exclude `internal` unless explicitly invited cross-tenant |
| `open` | Glimmora network | Current global skill pool (cross-tenant) |

### 22. Assignment UX — “My organization”

- **Decision:** Assign-task drawer and workforce directory expose **My organization** as a first-class pool.
- **Capabilities:**
  - Tab: **My organization (N)** | **Glimmora network (M)**
  - Filters: department, manager, cost center, skills, availability
  - Search: name, email, employee ID (from HRIS)
  - **Direct assign:** pick person without running ranker (audit: `task.assign.direct`)
  - **Optional:** “Suggest from my team” using HRIS `manager` field
- **Route:** `/enterprise/workforce` (directory) + assign from `/enterprise/projects/[projectId]`
- **Why:** Internal JTBD is “give this to Priya,” not “who scored 0.94 on Figma globally.”
- **Owner:** Product + EM Enterprise

### 23. Review routing by contributor track

- **Decision:** Add `reviewPath` on **TaskDefinition** (set at decomposition; overridable per task).

| `reviewPath` | When used | Flow |
|---|---|---|
| `mentor` | External contributors (default) | Submit → Glimmora mentor → (optional) `ent.reviewer` if two-stage |
| `internal` | Internal employees (default) | Submit → manager or designated `ent.reviewer` → accepted |
| `mentor_then_internal` | Regulated / upskilling opt-in | Mentor QA → then enterprise acceptance |
| `auto_accept` | Low-risk internal micro-tasks (Phase 2) | Submit → auto-accept with audit |

**Defaults (derived, not manually set every time):**

| `contribType` | Default `reviewPath` | Glimmora mentor required? |
|---|---|---|
| `internal` | `internal` | **No** |
| `general_workforce` | `mentor` | **Yes** |
| `student` | `mentor` | **Yes** (supervisor may see outcome; not a substitute for mentor QA) |
| `women_workforce` | `mentor` | **Yes** |

**Relationship to Decision #5 (two-stage review):** Two-stage applies only when `reviewPath` includes a mentor stage **and** PMO enables “Mentor + Internal reviewer” on the project. Internal-only path skips mentor entirely; enterprise reviewer may still be required by policy.

**Why:** Employer owns identity and performance for staff; Glimmora mentor is independent QA for marketplace trust.

- **Owner:** Product + EM Contributor + EM Mentor

### 24. Economics split — internal vs external

- **Decision:** Internal accepted tasks **do not** create Razorpay/Wise payout rows by default.
- **Internal:** Cost accrues to tenant **cost center / payroll export** (visibility in enterprise billing; settlement outside Glimmora rails).
- **External:** Existing payout + credential flow (Decision #12).
- **Rate cards:** Keep `internal` segment row (already in mocks) for cost attribution, not wallet disbursement.
- **Owner:** Finance + EM Platform

---

## 5. End-to-end flows

### 5.1 Internal employee (employer mode)

```
HRIS sync → Workforce directory (My organization)
     ↓
SOW approved → Decompose (task.sourcing = internal)
     ↓
PMO direct-assign OR pick from My organization tab
     ↓
Task status: matched → contributor accepts → in_progress
     ↓
Workroom → submit
     ↓
Manager or ent.reviewer accepts (reviewPath = internal)
     ↓
Cost center / payroll export (no contributor wallet payout)
```

### 5.2 External contributor (marketplace mode)

```
SOW approved → Decompose (task.sourcing = external)
     ↓
Matching ranks Glimmora network → PMO confirms
     ↓
matched → accept → workroom → submit
     ↓
Glimmora mentor review (reviewPath = mentor)
     ↓
[Optional two-stage] ent.reviewer final accept
     ↓
Payout eligible → Razorpay/Wise → contributor earnings
```

### 5.3 Hybrid project (same SOW)

| Task | sourcing | Assign | reviewPath |
|---|---|---|---|
| API integration | `external` | Marketplace match | `mentor` |
| UI polish | `internal` | Direct → designer | `internal` |
| Security sign-off | `internal` | Direct → engineer | `internal` + optional `mentor_then_internal` |

---

## 6. UI surfaces (enterprise)

| Surface | Purpose | Phase |
|---|---|---|
| **Settings → Workforce** | HRIS-synced employee directory; link to user; department/manager | P1 |
| **Projects → Delivery → Assign drawer** | My organization / Glimmora network tabs | P1 |
| **Decomposition task editor** | Fields: `workforceSourcing`, `reviewPath`, reviewer routing | P1 |
| **Decomposition wireframe update** | Add third reviewer option: “Internal only (manager / ent.reviewer)” | P1 spec |
| **Workforce analytics** | Internal vs external throughput, cost by segment | P2 |

**Assign drawer copy (internal tab empty state):**  
“No synced employees match these skills. Connect HRIS in Settings → Integrations or widen skills on the task.”

---

## 7. Data model (proposed fields)

### TaskDefinition (additions)

```typescript
workforceSourcing?: "internal_only" | "internal_first" | "external_only" | "open";
reviewPath?: "mentor" | "internal" | "mentor_then_internal" | "auto_accept";
internalReviewerId?: string | null;  // User.id — ent.reviewer or manager delegate
```

Defaults computed at task creation from project policy + assignee track when assigned.

### Project / DecompositionPlan (additions)

```typescript
defaultWorkforceSourcing: "hybrid" | "internal_only" | "external_only" | "open";
defaultReviewPath?: "mentor" | "internal";  // fallback when task silent
twoStageReviewEnabled: boolean;  // existing concept — Decision #5
```

### Tenant policy (additions)

```typescript
workforcePolicy: {
  defaultSourcing: "hybrid";
  allowOpenMarket: boolean;      // false = Acme never sees global pool
  requireMentorForInternal: boolean;  // default false — opt-in third-party QA
};
```

### Matching API (`findCandidatesForTask`)

New query params / server filters:

- `pool: "organization" | "network" | "organization_first"`
- `tenantId` (from task — always scoped for org pool)
- Optional: `department`, `managerId`, `contribTypes[]`

---

## 8. API contracts (Phase 1)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/enterprise/workforce` | Paginated org contributors (HRIS + skills) |
| `GET` | `/api/matching/candidates?taskId=&pool=organization` | Rank within tenant internal pool |
| `POST` | `/api/enterprise/tasks/[taskId]/assign` | Assign contributor (ranked or direct) |
| `POST` | `/api/enterprise/tasks/[taskId]/reassign` | PMO reassign (existing RBAC) |

Audit actions: `task.assign`, `task.assign.direct`, `task.reassign`, `review.route_set`.

---

## 9. Phase split

### Phase 1 (pilot-blocking for Acme internal demo)

- [ ] Workforce directory page (read HRIS-synced contributors for tenant)
- [ ] Assign drawer: **My organization** tab + direct assign
- [ ] `workforceSourcing` + `reviewPath` on task (schema + decomposition UI)
- [ ] Review routing: internal tasks → enterprise reviewer queue **without** mentor enqueue
- [ ] Wire `POST .../assign` to `assignTaskToContributor` (replace localStorage demo overlay)
- [ ] Internal payout: cost-center accrual only (no Razorpay row)

### Phase 2

- Manager-as-reviewer from HRIS manager field (auto-route)
- `internal_first` rank blending (org boost, not hard filter)
- `auto_accept` for low-risk internal micro-tasks
- Workforce planning: capacity by department

---

## 10. Acceptance criteria (pilot)

1. Acme PMO opens assign drawer on an `internal_only` task and sees **only** `@acme.com` contributors (e.g. `designer-1@acme.com`).
2. PMO direct-assigns without viewing marketplace list.
3. Internal contributor accepts task in `/contributor/tasks` — same portal as today.
4. On submit, item appears in **`/enterprise/reviewer`** (or manager delegate queue), **not** mentor queue.
5. On accept, no Razorpay payout row; enterprise billing shows cost-center accrual.
6. External task on same project still routes to mentor queue and payout rail.

---

## 11. Open questions (need sign-off)

1. **Student intern at Acme via HRIS** — treat as `internal` or `student` for review? Proposed: HRIS `internal` wins; university supervision module still shows if dual-track.
2. **Internal employee on open-market task** — allowed when PMO explicitly picks from network tab? Proposed: yes, but warn “external sourcing policy — mentor review applies.”
3. **Manager auto-routing** — Phase 1 manual `ent.reviewer` pick vs HRIS manager? Proposed: Phase 1 manual; Phase 2 manager field.

---

## 12. Document control

- **Supersedes:** nothing (additive)
- **Implements next in code:** assign drawer tabs, workforce API, `reviewPath` routing in submission service
- **Change protocol:** same as `07-decisions-log.md`
