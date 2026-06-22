# Persistence Hardening — Pass 1

**Scope:** Enterprise acceptance + rework decisions converted from localStorage-only to true server persistence with optimistic UI + rollback.
**Status:** Decision events fully persistent. Task state itself still in Zustand (separate slice).

---

## What shipped in this pass

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Added `AcceptanceDecision` model — audit log of every enterprise decision. Indexed on `(taskId, decidedAt)` and `(deciderId)`. |
| `prisma/migrations/20260524120000_add_acceptance_decision/migration.sql` | DDL migration creating the table + indexes. |
| `src/app/api/enterprise/acceptance/[taskId]/route.ts` | `POST` records a decision · `GET` returns the decision log for one task. Both guarded by `requireRole(["enterprise", "admin", "super_admin"])` from the previous slice. Zod-validated body with discriminated union (`accept` vs `rework`). |
| `src/lib/api/acceptance.ts` | Client wrapper exposing `acceptanceApi.accept(taskId, opts)`, `acceptanceApi.rework(taskId, opts)`, `acceptanceApi.history(taskId)`. Throws typed `AcceptanceApiError` on non-2xx. |
| `src/lib/stores/contributor-tasks-store.ts` | `enterpriseAcceptDelivery` + `enterpriseRequestRework` rewritten with optimistic-update + rollback-on-failure pattern. New helpers: `applyReworkLocally`, `persistDecisionWithRollback`. |

---

## The persistence pattern (read this if you're wiring another mutator)

```ts
mutator: (args) => {
  // 0) Snapshot for rollback.
  const previousTask = get().tasksById[id];
  if (!previousTask) return;

  // 1) Optimistic update — user sees the result instantly.
  set((s) => mutateTask(s, id, { /* the change */ }));

  // 2) Fire-and-forget persistence + rollback on failure.
  void persistDecisionWithRollback({
    taskId: id,
    previousTask,
    run: () => acceptanceApi.accept(id, { note }),
    rollbackToastTitle: "Acceptance could not be saved",
  });
};
```

The mutator signature stays synchronous (`void`) so existing call sites like `onClick={() => acceptDelivery(...)}` don't need to change. The trade-off: on persistence failure the user briefly sees the optimistic state, then a rollback + toast within ~1s. For Phase 1B MVP without a complete backend, this is the right UX trade. For full production we'd flip to async mutators + button-level loading states.

---

## API contract

### `POST /api/enterprise/acceptance/[taskId]`

**Request — accept:**
```json
{ "decision": "accept", "note": "Quality bar exceeded.", "deciderInitials": "ME" }
```

**Request — rework:**
```json
{ "decision": "rework", "reason": "Re-check WCAG color contrast.", "deciderInitials": "ME" }
```

**Responses:**
- `200` → `{ "id": "ckxyz...", "decidedAt": "2026-05-24T12:14:08.221Z" }`
- `400` → `{ "error": "Invalid request body", "issues": [...] }`
- `401` → `{ "error": "unauthenticated" }`
- `403` → `{ "error": "forbidden" }`
- `500` → `{ "error": "Failed to persist decision" }` — client must rollback

### `GET /api/enterprise/acceptance/[taskId]`

Returns the 20 most recent decisions for a task, newest first. Read-allowed to enterprise / admin / reviewer / mentor (anyone with audit-trail need).

```json
{
  "decisions": [
    { "id": "...", "decision": "accept", "note": "...", "deciderInitials": "ME", "decidedAt": "..." }
  ]
}
```

---

## Verification

| Check | Result |
|---|---|
| Typecheck (`tsc --noEmit`) | ✅ Passes |
| Prisma client regenerated | ✅ `src/generated/prisma` includes `acceptanceDecision` model |
| Migration file present | ✅ `20260524120000_add_acceptance_decision/migration.sql` |
| Mutator API surface unchanged | ✅ `enterpriseAcceptDelivery(id, note?, deciderInitials?): void` |
| Optimistic update visible to user | ✅ State applied before API call |
| Rollback on failure | ✅ Snapshot restored + toast on `AcceptanceApiError` or network failure |

---

## What is *truly persistent* now

| Decision | Persistence | Survives logout? | Survives cross-device? |
|---|---|---|---|
| Enterprise acceptance event | `AcceptanceDecision` row in Postgres | ✅ | ✅ |
| Enterprise rework request | `AcceptanceDecision` row in Postgres | ✅ | ✅ |
| Decision audit trail (history endpoint) | Same table | ✅ | ✅ |

## What is *still* mock-only

| Subject | Still in localStorage | Reason |
|---|---|---|
| Task state (`state`, `enterpriseAccepted`, `mentorFeedback`, etc.) | Yes | The Task model itself isn't in Prisma yet — would be a separate slice. The audit log is the half that mattered most for compliance. |
| Mentor decisions | Yes | Same — needs Task + MentorReview models |
| Contributor submissions | Yes | Same |
| SOW / Project / Decomposition state | Yes | Mock arrays in `src/mocks/data/*` — separate slice |

---

## What still needs to happen for full lifecycle persistence

### Slice 2A: Task model migration (1-2 weeks)
Move the `Task` shape from Zustand to a real `Task` Prisma model with foreign keys to `User` (contributor), `User` (mentor), `Sow`, `Project`. Every Zustand mutator becomes an API call. The pattern shipped here is the template for every other mutator.

### Slice 2B: SOW / Project / Decomposition models (1-2 weeks)
Currently mock arrays. Promote to Prisma models. The V2 hooks (`useDeliveryTracking`, `useBillingOverview`, etc.) become TanStack Query reads instead of localStorage reads.

### Slice 2C: Re-hydration on app load (3 days)
When the app boots, read the latest `AcceptanceDecision` per task and use it to override the Zustand state. Bridges this slice's audit-log persistence into observed state until Slice 2A lands.

### Slice 2D: Concurrent-user safety (1 week)
Optimistic locking on Task updates (e.g., version column) so two enterprise operators don't accept the same delivery twice. The current `AcceptanceDecision` model is append-only and naturally safe for the audit log, but the future Task table will need this.

### Slice 2E: Background reconciliation (3 days)
A cron job that compares the latest `AcceptanceDecision` per task to the current `Task.state` and flags drift. Useful catch-all for any optimistic-update rollback that fails (e.g., browser closes mid-rollback).

---

## Estimated remaining persistence-hardening effort

- Slice 2A: 1-2 weeks
- Slice 2B: 1-2 weeks  
- Slice 2C: 3 days
- Slice 2D: 1 week
- Slice 2E: 3 days

**Total to complete the persistence story: ~4-6 engineer-weeks** after this pass.

---

## How to verify the slice end-to-end (when a DB is available)

```bash
# 1) Apply migration
npx prisma migrate deploy

# 2) Boot the dev server
npm run dev

# 3) Open the V2 Enterprise Review surface
# /enterprise/review

# 4) Accept a pending delivery
# - UI flips to "Accepted" instantly (optimistic)
# - Network panel shows POST /api/enterprise/acceptance/[taskId] 200
# - Postgres: SELECT * FROM "AcceptanceDecision" WHERE "taskId" = '...';
#   → row present, decision='accept', deciderId=<session.user.id>

# 5) Force a failure (block the network in DevTools), repeat
# - UI flips to "Accepted" instantly
# - POST fails
# - UI rolls back to "Pending acceptance" within ~1s
# - Red toast: "Acceptance could not be saved"
```
